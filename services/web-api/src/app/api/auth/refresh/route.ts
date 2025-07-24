import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/database'
import { validateAndTransform } from '@service-scheduler/utils'
import { z } from 'zod'
import type { RefreshTokenRequest, ApiResponse } from '@service-scheduler/shared-types'

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = validateAndTransform(refreshTokenSchema, body) as RefreshTokenRequest
    
    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: validatedData.refreshToken
    })
    
    if (error || !data.session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid refresh token'
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
    
    // Check if user is still active
    if (profile && !profile.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Account is inactive'
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
          role: profile?.position || data.user.user_metadata?.role || 'employee'
        },
        expiresIn: data.session.expires_in || 3600
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Refresh token error:', error)
    
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
