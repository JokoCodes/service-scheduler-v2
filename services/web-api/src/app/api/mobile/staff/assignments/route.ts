import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import type { ApiResponse } from '@service-scheduler/shared-types'

interface MobileStaffAssignment {
  id: string
  bookingId: string
  customerName: string
  serviceName: string
  serviceAddress: string
  scheduledDate: string
  scheduledTime: string
  role: string
  status: 'assigned' | 'accepted' | 'declined' | 'completed'
  assignedAt: string
  acceptedAt?: string
  completedAt?: string
  notes?: string
  staffingStatus: 'fully_staffed' | 'partially_staffed' | 'unstaffed'
  totalStaffRequired: number
  totalStaffFulfilled: number
  otherStaff?: {
    employeeName: string
    role: string
    status: string
  }[]
}

// GET /api/mobile/staff/assignments - Get staff assignments for mobile app
export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // assigned, accepted, completed
    const date = searchParams.get('date') // YYYY-MM-DD format
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('booking_staff_summary')
      .select('*')
      .eq('assigned_staff', user.id) // Filter by current user's assignments

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (date) {
      query = query.eq('scheduled_date', date)
    }

    // Apply pagination and ordering
    query = query
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data: assignments, error } = await query

    if (error) {
      console.error('Mobile staff assignments fetch error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch staff assignments'
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Transform data for mobile app
    const mobileAssignments: MobileStaffAssignment[] = assignments?.map((assignment: any) => {
      // Find current user's assignment details
      const userAssignment = assignment.assigned_staff?.find(
        (staff: any) => staff.employee_id === user.id
      )

      // Get other staff members
      const otherStaff = assignment.assigned_staff?.filter(
        (staff: any) => staff.employee_id !== user.id
      ).map((staff: any) => ({
        employeeName: staff.employee_name,
        role: staff.role,
        status: staff.status
      })) || []

      return {
        id: userAssignment?.id || assignment.booking_id,
        bookingId: assignment.booking_id,
        customerName: assignment.customer_name,
        serviceName: assignment.service_name,
        serviceAddress: assignment.service_address,
        scheduledDate: assignment.scheduled_date,
        scheduledTime: assignment.scheduled_time,
        role: userAssignment?.role || 'staff',
        status: userAssignment?.status || 'assigned',
        assignedAt: userAssignment?.assigned_at || assignment.created_at,
        acceptedAt: userAssignment?.accepted_at,
        completedAt: userAssignment?.completed_at,
        notes: userAssignment?.notes,
        staffingStatus: assignment.staffing_status,
        totalStaffRequired: assignment.staff_required,
        totalStaffFulfilled: assignment.staff_fulfilled,
        otherStaff
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: mobileAssignments,
      meta: {
        pagination: {
          offset,
          limit,
          total: mobileAssignments.length
        },
        timestamp: new Date().toISOString()
      }
    } as ApiResponse)

  } catch (error) {
    console.error('Mobile staff assignments error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
