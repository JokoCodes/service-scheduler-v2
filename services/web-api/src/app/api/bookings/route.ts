import { NextRequest, NextResponse } from 'next/server'
import { supabase, getAdminClient } from '@/lib/database'
import { authenticate, createAuthResponse } from '@/middleware/auth'
import { validateAndTransform, bookingListQuerySchema, createBookingSchema } from '@service-scheduler/utils'
import type { ApiResponse, BookingListQuery, CreateBookingRequest, Booking } from '@service-scheduler/shared-types'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticate(request)
    if (!user) {
      return createAuthResponse.unauthorized()
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters with defaults
    const validatedQuery = validateAndTransform(bookingListQuerySchema, query) as BookingListQuery
    
    // Ensure defaults are set (they should be from the schema, but just in case)
    const queryWithDefaults = {
      page: 1,
      limit: 20,
      ...validatedQuery
    }
    
    // Build the query - your database has customer data directly in bookings table
    let queryBuilder = supabase
      .from('bookings')
      .select('*')
    
    // Apply filters
    if (queryWithDefaults.status) {
      queryBuilder = queryBuilder.eq('status', queryWithDefaults.status)
    }
    
    if (queryWithDefaults.employeeId) {
      queryBuilder = queryBuilder.eq('assigned_employee_id', queryWithDefaults.employeeId)
    }
    
    if (queryWithDefaults.dateFrom) {
      queryBuilder = queryBuilder.gte('scheduled_date', queryWithDefaults.dateFrom)
    }
    
    if (queryWithDefaults.dateTo) {
      queryBuilder = queryBuilder.lte('scheduled_date', queryWithDefaults.dateTo)
    }
    
    if (queryWithDefaults.search) {
      queryBuilder = queryBuilder.or(`
        customer_name.ilike.%${queryWithDefaults.search}%,
        customer_email.ilike.%${queryWithDefaults.search}%,
        service_name.ilike.%${queryWithDefaults.search}%,
        service_address.ilike.%${queryWithDefaults.search}%
      `)
    }
    
    // Get total count for pagination
    const { count } = await queryBuilder.select('*', { count: 'exact', head: true })
    
    // Apply pagination and ordering
    const offset = (queryWithDefaults.page - 1) * queryWithDefaults.limit
    queryBuilder = queryBuilder
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .range(offset, offset + queryWithDefaults.limit - 1)
    
    const { data: bookingsData, error } = await queryBuilder
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to fetch bookings from database',
          error: error.message
        } as ApiResponse,
        { status: 500 }
      )
    }
    
    // Transform data to match frontend types - using actual database field names
    const bookings: Booking[] = bookingsData?.map((booking: any) => ({
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
      scheduledTime: booking.scheduled_time?.substring(0, 5) || booking.scheduled_time, // Format time if needed
      status: booking.status,
      notes: booking.notes,
      assignedEmployeeId: booking.assigned_employee_id,
      assignedEmployeeName: booking.assigned_employee_name,
      staffRequired: booking.staff_required || 1,
      staffFulfilled: booking.staff_fulfilled || 0,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    })) || []
    
    const totalPages = Math.ceil((count || 0) / queryWithDefaults.limit)
    
    const response: ApiResponse = {
      success: true,
      data: bookings,
      meta: {
        pagination: {
          currentPage: queryWithDefaults.page,
          totalPages,
          totalItems: count || 0,
          itemsPerPage: queryWithDefaults.limit,
          hasNextPage: queryWithDefaults.page < totalPages,
          hasPreviousPage: queryWithDefaults.page > 1
        },
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Bookings fetch error:', error)
    
    if (error instanceof Error && error.message.includes('Invalid')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid query parameters',
          errors: { query: [error.message] }
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

export async function POST(request: NextRequest) {
  console.log('🚀 Backend API: POST /api/bookings called')
  console.log('📅 Timestamp:', new Date().toISOString())
  
  try {
    // Authenticate user (admin only)
    console.log('🔐 Authenticating user...')
    const user = await authenticate(request)
    
    if (!user) {
      console.log('❌ Authentication failed: No user found')
      return createAuthResponse.unauthorized()
    }
    
    console.log('👤 User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role
    })
    
    if (user.role !== 'admin') {
      console.log('❌ Authorization failed: User role is not admin:', user.role)
      return createAuthResponse.forbidden()
    }
    
    console.log('✅ User authorized as admin')
    
    console.log('📋 Reading request body...')
    const body = await request.json()
    console.log('📦 Request body received:', {
      ...body,
      customerEmail: body.customerEmail?.substring(0, 3) + '***' // Hide email for security
    })
    
    // Validate request data
    const validatedData = validateAndTransform(createBookingSchema, body) as CreateBookingRequest
    
    // Use admin client for database operations to bypass RLS
    console.log('🔧 Getting admin client for database operations...')
    const adminClient = getAdminClient()
    
    // Customer data is stored directly in bookings table, no separate customers table needed
    console.log('📝 Using direct customer data storage in bookings table')
    
    // Get service details for pricing and name
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
    
    // Create the booking with admin client to bypass RLS - using direct customer fields
    console.log('📋 Creating booking with admin client...')
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .insert({
        customer_name: validatedData.customerName,
        customer_email: validatedData.customerEmail,
        customer_phone: validatedData.customerPhone,
        service_id: validatedData.serviceId,
        service_name: service?.name || 'Unknown Service', // We need service name for the booking
        service_price: service.price,
        service_duration: service?.duration || 0,
        assigned_employee_id: validatedData.assignedEmployeeId,
        scheduled_date: validatedData.scheduledDate,
        scheduled_time: validatedData.scheduledTime,
        service_address: validatedData.serviceAddress,
        notes: validatedData.notes,
        status: 'pending',
        company_id: '550e8400-e29b-41d4-a716-446655440000' // Using the company ID from existing data
      })
      .select('*')
      .single()
    
    if (bookingError) {
      console.error('Booking creation error details:', {
        error: bookingError,
        code: bookingError.code,
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint
      })
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create booking',
          error: bookingError.message,
          details: bookingError.details
        } as ApiResponse,
        { status: 500 }
      )
    }
    
    // Get employee details if assigned
    let employeeData = null
    if (validatedData.assignedEmployeeId) {
      const { data: empData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', validatedData.assignedEmployeeId)
        .single()
      employeeData = empData
    }
    
    // Transform response
    const bookingResponse: Booking = {
      id: booking.id,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      serviceAddress: booking.service_address,
      serviceId: booking.service_id,
      serviceName: service?.name || 'Unknown Service',
      servicePrice: parseFloat(service.price.toString()),
      serviceDuration: service?.duration || 0,
      scheduledDate: booking.scheduled_date,
      scheduledTime: booking.scheduled_time,
      status: booking.status,
      notes: booking.notes,
      assignedEmployeeId: booking.assigned_employee_id || null,
      assignedEmployeeName: employeeData?.name || null,
      staffRequired: booking.staff_required || 1,
      staffFulfilled: booking.staff_fulfilled || 0,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }
    
    const response: ApiResponse = {
      success: true,
      data: bookingResponse,
      message: 'Booking created successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Create booking error:', error)
    
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
