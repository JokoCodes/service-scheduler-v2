import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import type { ApiResponse } from '@service-scheduler/shared-types'

interface StaffAssignment {
  id: string
  bookingId: string
  employeeId: string
  employeeName?: string
  role: 'lead' | 'staff' | 'supervisor'
  status: 'assigned' | 'accepted' | 'declined' | 'completed'
  assignedAt: string
  acceptedAt?: string
  completedAt?: string
  notes?: string
}

interface AssignStaffRequest {
  employeeId: string
  role?: 'lead' | 'staff' | 'supervisor'
  notes?: string
}

interface UpdateStaffStatusRequest {
  status: 'accepted' | 'declined' | 'completed'
  notes?: string
}

// GET /api/bookings/[id]/staff - Get staff assignments for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    const { data: assignments, error } = await supabase
      .from('booking_staff_assignments')
      .select(`
        *,
        profiles:employee_id (
          name,
          phone,
          position
        )
      `)
      .eq('booking_id', params.id)

    if (error) {
      console.error('Staff assignments fetch error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch staff assignments'
        } as ApiResponse,
        { status: 500 }
      )
    }

    const staffAssignments: StaffAssignment[] = assignments.map((assignment: any) => ({
      id: assignment.id,
      bookingId: assignment.booking_id,
      employeeId: assignment.employee_id,
      employeeName: assignment.profiles?.name,
      role: assignment.role,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      acceptedAt: assignment.accepted_at,
      completedAt: assignment.completed_at,
      notes: assignment.notes
    }))

    return NextResponse.json({
      success: true,
      data: staffAssignments
    } as ApiResponse)

  } catch (error) {
    console.error('Get staff assignments error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// POST /api/bookings/[id]/staff - Assign staff to a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    if (user.role !== 'admin') {
      return createAuthResponse.forbidden()
    }

    const body: AssignStaffRequest = await request.json()

    // Check if booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, staff_required, staff_fulfilled')
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', body.employeeId)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Use admin client for insertion
    const adminClient = getAdminClient()
    const { data: assignment, error: assignmentError } = await adminClient
      .from('booking_staff_assignments')
      .insert({
        booking_id: params.id,
        employee_id: body.employeeId,
        role: body.role || 'staff',
        notes: body.notes,
        status: 'assigned'
      })
      .select('*')
      .single()

    if (assignmentError) {
      // Handle duplicate assignment
      if (assignmentError.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            message: 'Employee is already assigned to this booking'
          } as ApiResponse,
          { status: 409 }
        )
      }

      console.error('Staff assignment error:', assignmentError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to assign staff'
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Create notification for the assigned employee
    await adminClient
      .from('notifications')
      .insert({
        user_id: body.employeeId,
        type: 'booking_assignment',
        title: 'New Booking Assignment',
        message: `You have been assigned to a booking scheduled for ${booking.scheduled_date}`,
        data: JSON.stringify({
          booking_id: params.id,
          role: body.role || 'staff'
        }),
        priority: 'high'
      })

    const staffAssignment: StaffAssignment = {
      id: assignment.id,
      bookingId: assignment.booking_id,
      employeeId: assignment.employee_id,
      employeeName: employee.name,
      role: assignment.role,
      status: assignment.status,
      assignedAt: assignment.assigned_at,
      notes: assignment.notes
    }

    return NextResponse.json({
      success: true,
      data: staffAssignment,
      message: 'Staff assigned successfully'
    } as ApiResponse, { status: 201 })

  } catch (error) {
    console.error('Assign staff error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id]/staff - Remove all staff from booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    if (user.role !== 'admin') {
      return createAuthResponse.forbidden()
    }

    const adminClient = getAdminClient()
    const { error } = await adminClient
      .from('booking_staff_assignments')
      .delete()
      .eq('booking_id', params.id)

    if (error) {
      console.error('Remove staff error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to remove staff assignments'
        } as ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All staff assignments removed'
    } as ApiResponse)

  } catch (error) {
    console.error('Remove staff error:', error)
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
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
