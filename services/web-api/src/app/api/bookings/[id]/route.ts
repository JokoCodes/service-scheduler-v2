import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import { validateAndTransform, updateBookingSchema } from '@service-scheduler/utils'
import type { ApiResponse, UpdateBookingRequest, Booking } from '@service-scheduler/shared-types'

// GET /api/bookings/[id] - Get a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Transform data to match frontend types
    const bookingResponse: Booking = {
      id: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone,
      serviceAddress: booking.service_address,
      serviceId: booking.service_id,
      serviceName: booking.service_name,
      servicePrice: parseFloat(booking.service_price || '0'),
      serviceDuration: booking.service_duration,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time?.substring(0, 5) || booking.scheduled_time,
      status: booking.status,
      notes: booking.notes,
      assignedEmployeeId: booking.assigned_employee_id,
      assignedEmployeeName: booking.assigned_employee_name,
      staffRequired: booking.staff_required || 1,
      staffFulfilled: booking.staff_fulfilled || 0,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }

    return NextResponse.json({
      success: true,
      data: bookingResponse
    } as ApiResponse)

  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Update a specific booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user (admin only)
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    if (user.role !== 'admin') {
      return createAuthResponse.forbidden()
    }

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = validateAndTransform(updateBookingSchema, body) as UpdateBookingRequest

    // Get service details if service changed
    let serviceData = null
    if (validatedData.serviceId && validatedData.serviceId !== existingBooking.service_id) {
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('name, price, duration')
        .eq('id', validatedData.serviceId)
        .single()

      if (serviceError || !service) {
        return NextResponse.json(
          {
            success: false,
            message: 'Service not found'
          } as ApiResponse,
          { status: 404 }
        )
      }
      serviceData = service
    }

    // Get employee name if employee assigned or changed
    let employeeName = existingBooking.assigned_employee_name
    if (validatedData.assignedEmployeeId !== existingBooking.assigned_employee_id) {
      if (validatedData.assignedEmployeeId) {
        const { data: empData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', validatedData.assignedEmployeeId)
          .single()
        employeeName = empData?.name || null
      } else {
        employeeName = null
      }
    }

    // Build update object with only provided fields
    const updateData: any = {}
    
    if (validatedData.customerName !== undefined) updateData.customer_name = validatedData.customerName
    if (validatedData.customerEmail !== undefined) updateData.customer_email = validatedData.customerEmail
    if (validatedData.customerPhone !== undefined) updateData.customer_phone = validatedData.customerPhone
    if (validatedData.serviceAddress !== undefined) updateData.service_address = validatedData.serviceAddress
    if (validatedData.scheduledDate !== undefined) updateData.scheduled_date = validatedData.scheduledDate
    if (validatedData.scheduledTime !== undefined) updateData.scheduled_time = validatedData.scheduledTime
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.assignedEmployeeId !== undefined) {
      updateData.assigned_employee_id = validatedData.assignedEmployeeId
      updateData.assigned_employee_name = employeeName
    }
    if (validatedData.staffRequired !== undefined) updateData.staff_required = validatedData.staffRequired
    if (validatedData.staffFulfilled !== undefined) updateData.staff_fulfilled = validatedData.staffFulfilled
    
    // Update service-related fields if service changed
    if (serviceData) {
      updateData.service_id = validatedData.serviceId
      updateData.service_name = serviceData.name
      updateData.service_price = serviceData.price
      updateData.service_duration = serviceData.duration
    }

    updateData.updated_at = new Date().toISOString()

    // Use admin client for database operations
    const adminClient = getAdminClient()
    const { data: updatedBooking, error: updateError } = await adminClient
      .from('bookings')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update booking',
          error: updateError.message
        } as ApiResponse,
        { status: 500 }
      )
    }

    // Transform response
    const bookingResponse: Booking = {
      id: updatedBooking.id,
      customerName: updatedBooking.customer_name,
      customerEmail: updatedBooking.customer_email,
      customerPhone: updatedBooking.customer_phone,
      serviceAddress: updatedBooking.service_address,
      serviceId: updatedBooking.service_id,
      serviceName: updatedBooking.service_name,
      servicePrice: parseFloat(updatedBooking.service_price || '0'),
      serviceDuration: updatedBooking.service_duration,
      scheduledDate: updatedBooking.scheduled_date,
      scheduledTime: updatedBooking.scheduled_time?.substring(0, 5) || updatedBooking.scheduled_time,
      status: updatedBooking.status,
      notes: updatedBooking.notes,
      assignedEmployeeId: updatedBooking.assigned_employee_id,
      assignedEmployeeName: updatedBooking.assigned_employee_name,
      staffRequired: updatedBooking.staff_required || 1,
      staffFulfilled: updatedBooking.staff_fulfilled || 0,
      createdAt: updatedBooking.created_at,
      updatedAt: updatedBooking.updated_at
    }

    return NextResponse.json({
      success: true,
      data: bookingResponse,
      message: 'Booking updated successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Update booking error:', error)
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: { general: [error.message] }
        } as ApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Delete a specific booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user (admin only)
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }

    if (user.role !== 'admin') {
      return createAuthResponse.forbidden()
    }

    // Check if booking exists
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        {
          success: false,
          message: 'Booking not found'
        } as ApiResponse,
        { status: 404 }
      )
    }

    // Use admin client for database operations
    const adminClient = getAdminClient()
    const { error: deleteError } = await adminClient
      .from('bookings')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Booking deletion error:', deleteError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to delete booking',
          error: deleteError.message
        } as ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully'
    } as ApiResponse)

  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      } as ApiResponse,
      { status: 500 }
    )
  }
}

// OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
