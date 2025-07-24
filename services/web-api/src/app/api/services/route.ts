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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')

    // Build query
    let query = supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category && category !== 'All Categories') {
      query = query.eq('category', category)
    }
    
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: services, error } = await query

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch services' 
      }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedServices = services?.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: parseFloat(service.price || '0'),
      pricingType: service.pricing_type || 'fixed',
      duration: service.duration,
      category: service.category || 'Residential',
      isActive: service.is_active,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedServices,
    })

  } catch (error) {
    console.error('Error in services API:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, price, pricingType, duration, category } = body

    // Validate required fields
    if (!name || !duration || !price || !category) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, duration, price, and category are required' 
      }, { status: 400 })
    }

    // Get company_id from the authenticated user
    const companyId = '550e8400-e29b-41d4-a716-446655440000' // Demo company ID

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name,
        description,
        price: parseFloat(price),
        pricing_type: pricingType || 'flat',
        duration: parseInt(duration),
        category,
        company_id: companyId,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to create service' 
      }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedService = {
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: parseFloat(service.price || '0'),
      pricingType: service.pricing_type || 'fixed',
      duration: service.duration,
      category: service.category || 'Residential',
      isActive: service.is_active,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedService,
    })

  } catch (error) {
    console.error('Error creating service:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('id')
    
    if (!serviceId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Service ID is required' 
      }, { status: 400 })
    }

    const body = await request.json()
    const { name, description, price, pricingType, duration, category, isActive } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (pricingType !== undefined) updateData.pricing_type = pricingType
    if (duration !== undefined) updateData.duration = parseInt(duration)
    if (category !== undefined) updateData.category = category
    if (isActive !== undefined) updateData.is_active = isActive
    updateData.updated_at = new Date().toISOString()

    const { data: service, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to update service' 
      }, { status: 500 })
    }

    // Transform the data to match frontend expectations
    const transformedService = {
      id: service.id,
      name: service.name,
      description: service.description || '',
      price: parseFloat(service.price || '0'),
      pricingType: service.pricing_type || 'fixed',
      duration: service.duration,
      category: service.category || 'Residential',
      isActive: service.is_active,
      createdAt: service.created_at,
      updatedAt: service.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedService,
    })

  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('id')
    
    if (!serviceId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Service ID is required' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to delete service' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
