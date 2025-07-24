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

    console.log('Fetching employees from employees table...')
    
    // Query employees table directly
    const { data: employeeList, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to fetch employees' 
      }, { status: 500 })
    }

    console.log('Raw employee data from database:', JSON.stringify(employeeList, null, 2))
    console.log('Number of employees found:', employeeList?.length || 0)

    // Transform data to match expected format
    const transformedEmployees = employeeList?.map((employee: any) => ({
      id: employee.id,
      name: employee.name || 'Unknown',
      email: employee.email || '',
      phone: employee.phone,
      avatar: employee.avatar,
      position: employee.position,
      hourlyRate: employee.hourly_rate || employee.hourlyRate,
      isActive: employee.is_active !== false || employee.isActive !== false, // Default to true if not explicitly false
      role: employee.role || employee.position || 'employee',
      skills: employee.skills || [],
      createdAt: employee.created_at || employee.createdAt,
      updatedAt: employee.updated_at || employee.updatedAt
    })) || []

    return NextResponse.json({
      success: true,
      data: transformedEmployees,
      message: 'Employees fetched successfully'
    })

  } catch (error) {
    console.error('Error fetching employees:', error)
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
    const { email, name, phone, position, hourlyRate, role = 'employee' } = body

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and name are required' 
      }, { status: 400 })
    }

    // Create user first (this would typically be done through Supabase Auth)
    // For now, we'll return an error suggesting to use proper user creation
    return NextResponse.json({ 
      success: false, 
      message: 'Employee creation should be done through the authentication system. Please use Supabase Auth to create users first.' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
