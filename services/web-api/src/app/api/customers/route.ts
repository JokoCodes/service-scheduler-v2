import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/database'
import { authenticateRequest } from '../../../middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    // Fetch customers from database
    const { data: customerList, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch customers' 
      }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedCustomers = customerList?.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes || '',
      totalSpend: customer.total_spend || 0,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedCustomers,
      message: 'Customers fetched successfully'
    })

  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, address, notes } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name and email are required' 
      }, { status: 400 })
    }

    // Insert new customer
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name,
        email,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        total_spend: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create customer' 
      }, { status: 500 })
    }

    // Transform the returned customer data
    const transformedCustomer = {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      notes: newCustomer.notes || '',
      totalSpend: newCustomer.total_spend || 0,
      createdAt: newCustomer.created_at,
      updatedAt: newCustomer.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedCustomer,
      message: 'Customer created successfully'
    })

  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
