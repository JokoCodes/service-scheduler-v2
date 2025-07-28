import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import type { ApiResponse } from '@service-scheduler/shared-types'

interface PickupJobRequest {
  bookingId: string
  assignmentId: string
  notes?: string
}

// POST /api/mobile/staff/jobs/pickup - Staff picks up a job assignment
export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    const body: PickupJobRequest = await request.json()

    // Validate required fields
    if (!body.bookingId || !body.assignmentId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking ID and Assignment ID are required'
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Check if assignment exists and belongs to the current user
    const { data: assignment, error: fetchError } = await supabase
      .from('booking_staff_assignments')
      .select(`
        *,
        bookings!inner (
          id,
          customer_name,
          service_name,
          scheduled_date,
          scheduled_time,
          staff_required,
          staff_fulfilled
        )
      `)
      .eq('id', body.assignmentId)
      .eq('booking_id', body.bookingId)
      .eq('employee_id', user.id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Assignment not found or you do not have permission to pick up this job'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Check if assignment is in a state that can be picked up
    if (assignment.status !== 'assigned') {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot pick up job. Current status: ${assignment.status}`
        } as ApiResponse,
        { status: 400 }
      )
    }

    // Update the assignment status to 'accepted'
    const adminClient = getAdminClient()
    const updateData = {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      notes: body.notes,
      updated_at: new Date().toISOString()
    }

    const { data: updatedAssignment, error: updateError } = await adminClient
      .from('booking_staff_assignments')
      .update(updateData)
      .eq('id', body.assignmentId)
      .select(`
        *,
        profiles:employee_id (
          name,
          phone,
          position
        ),
        bookings!inner (
          id,
          customer_name,
          service_name,
          scheduled_date,
          scheduled_time,
          service_address,
          staff_required,
          staff_fulfilled
        )
      `)
      .single()

    if (updateError) {
      console.error('Job pickup update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to pick up job assignment'
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Log the successful pickup
    console.log(`Job picked up successfully:`, {
      bookingId: body.bookingId,
      assignmentId: body.assignmentId,
      employeeId: user.id,
      staffing: `${updatedAssignment.bookings.staff_fulfilled}/${updatedAssignment.bookings.staff_required}`
    })

    // Create notification for admin users
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')

    if (adminUsers && adminUsers.length > 0) {
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: 'staff_job_pickup',
        title: 'Job Assignment Accepted',
        message: `${updatedAssignment.profiles?.name} has picked up a job for ${updatedAssignment.bookings.customer_name}`,
        data: JSON.stringify({
          booking_id: body.bookingId,
          assignment_id: body.assignmentId,
          employee_id: user.id,
          customer_name: updatedAssignment.bookings.customer_name,
          service_name: updatedAssignment.bookings.service_name,
          scheduled_date: updatedAssignment.bookings.scheduled_date
        }),
        priority: 'medium'
      }))

      await adminClient
        .from('notifications')
        .insert(notifications)
    }

    // Return the updated assignment with booking details
    return NextResponse.json({
      success: true,
      data: {
        id: updatedAssignment.id,
        bookingId: updatedAssignment.booking_id,
        employeeId: updatedAssignment.employee_id,
        employeeName: updatedAssignment.profiles?.name,
        role: updatedAssignment.role,
        status: updatedAssignment.status,
        assignedAt: updatedAssignment.assigned_at,
        acceptedAt: updatedAssignment.accepted_at,
        notes: updatedAssignment.notes,
        booking: {
          id: updatedAssignment.bookings.id,
          customerName: updatedAssignment.bookings.customer_name,
          serviceName: updatedAssignment.bookings.service_name,
          serviceAddress: updatedAssignment.bookings.service_address,
          scheduledDate: updatedAssignment.bookings.scheduled_date,
          scheduledTime: updatedAssignment.bookings.scheduled_time,
          staffRequired: updatedAssignment.bookings.staff_required,
          staffFulfilled: updatedAssignment.bookings.staff_fulfilled
        }
      },
      message: 'Job picked up successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Job pickup error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
