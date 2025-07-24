import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import type { ApiResponse } from '@service-scheduler/shared-types'

interface UpdateStaffStatusRequest {
  status: 'accepted' | 'declined' | 'completed'
  notes?: string
}

// PUT /api/bookings/[id]/staff/[assignmentId] - Update staff assignment status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    const body: UpdateStaffStatusRequest = await request.json()

    // Check if assignment exists and user has permission
    const { data: assignment, error: fetchError } = await supabase
      .from('booking_staff_assignments')
      .select('*')
      .eq('id', params.assignmentId)
      .eq('booking_id', params.id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Staff assignment not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Only admin or the assigned employee can update
    if (user.role !== 'admin' && user.id !== assignment.employee_id) {
      return createAuthResponse.forbidden()
    }

    // Prepare update data
    const updateData: any = {
      status: body.status,
      notes: body.notes,
      updated_at: new Date().toISOString()
    }

    // Set timestamp based on status
    if (body.status === 'accepted') {
      updateData.accepted_at = new Date().toISOString()
    } else if (body.status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const adminClient = getAdminClient()
    const { data: updatedAssignment, error: updateError } = await adminClient
      .from('booking_staff_assignments')
      .update(updateData)
      .eq('id', params.assignmentId)
      .select(`
        *,
        profiles:employee_id (
          name,
          phone,
          position
        )
      `)
      .single()

    if (updateError) {
      console.error('Staff assignment update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update staff assignment'
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Create notification for admin when employee responds
    if (body.status === 'accepted' || body.status === 'declined') {
      // Get admin users
      const { data: adminUsers } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      if (adminUsers && adminUsers.length > 0) {
        const notifications = adminUsers.map(admin => ({
          user_id: admin.id,
          type: 'staff_response',
          title: `Staff Assignment ${body.status}`,
          message: `${updatedAssignment.profiles?.name} has ${body.status} the booking assignment`,
          data: JSON.stringify({
            booking_id: params.id,
            assignment_id: params.assignmentId,
            employee_id: assignment.employee_id,
            status: body.status
          }),
          priority: 'medium'
        }))

        await adminClient
          .from('notifications')
          .insert(notifications)
      }
    }

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
        completedAt: updatedAssignment.completed_at,
        notes: updatedAssignment.notes
      },
      message: 'Staff assignment updated successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Update staff assignment error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id]/staff/[assignmentId] - Remove specific staff assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    if (user.role !== 'admin') {
      return createAuthResponse.forbidden()
    }

    // Check if assignment exists
    const { data: assignment, error: fetchError } = await supabase
      .from('booking_staff_assignments')
      .select('employee_id, profiles:employee_id(name)')
      .eq('id', params.assignmentId)
      .eq('booking_id', params.id)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        {
          success: false,
          message: 'Staff assignment not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    const adminClient = getAdminClient()
    const { error: deleteError } = await adminClient
      .from('booking_staff_assignments')
      .delete()
      .eq('id', params.assignmentId)

    if (deleteError) {
      console.error('Remove staff assignment error:', deleteError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to remove staff assignment'
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Notify the employee about removal
    await adminClient
      .from('notifications')
      .insert({
        user_id: assignment.employee_id,
        type: 'booking_unassignment',
        title: 'Booking Assignment Removed',
        message: 'You have been removed from a booking assignment',
        data: JSON.stringify({
          booking_id: params.id,
          assignment_id: params.assignmentId
        }),
        priority: 'medium'
      })

    return NextResponse.json({
      success: true,
      message: 'Staff assignment removed successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Remove staff assignment error:', error)
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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
