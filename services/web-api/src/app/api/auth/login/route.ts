import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database'
import { validateAndTransform, loginSchema } from '@service-scheduler/utils'
import type { LoginRequest, ApiResponse } from '@service-scheduler/shared-types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = validateAndTransform(loginSchema, body) as LoginRequest
    
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })
    
    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
          errors: { email: ['Invalid email or password'] }
        } as ApiResponse,
        { status: 401 }
      )
    }
    
    if (!data.user || !data.session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication failed'
        } as ApiResponse,
        { status: 401 }
      )
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, position, is_active')
      .eq('id', data.user.id)
      .single()
    
    // Check if user is active
    if (profile && !profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is inactive'
        } as ApiResponse,
        { status: 403 }
      )
    }
    
    // Use position from database profile as role, fallback to user metadata
    const userRole = profile?.position || data.user.user_metadata?.role || 'employee'
    
    // Check role if specified in login request
    if (validatedData.role && userRole !== validatedData.role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid role for this login'
        } as ApiResponse,
        { status: 403 }
      )
    }
    
    const response: ApiResponse = {
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: {
          id: data.user.id,
          name: profile?.name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
          role: userRole
        },
        expiresIn: data.session.expires_in || 3600
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Login error:', error)
    
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

// Handle preflight requests for CORS
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
