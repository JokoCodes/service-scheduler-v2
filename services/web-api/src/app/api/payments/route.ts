import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '../../../middleware/auth'
import { supabase } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }
    const user = authResult.user

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('payments')
      .select(`
        *,
        bookings (
          customer_name,
          customer_email,
          service_name,
          scheduled_date
        )
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: payments, error, count } = await query

    if (error) {
      console.error('Error fetching payments:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch payments' 
      }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      data: payments || [],
      meta: {
        pagination: {
          currentPage: page,
          totalPages: Math.ceil((totalCount || 0) / limit),
          totalItems: totalCount || 0,
          itemsPerPage: limit,
          hasNextPage: (totalCount || 0) > page * limit,
          hasPreviousPage: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error) {
    console.error('Error in payments API:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
