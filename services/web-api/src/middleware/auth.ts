import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabase, getAdminClient } from '../lib/database'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  name: string
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser
}

// JWT secret for token verification
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Extract token from Authorization header
const extractToken = (req: NextRequest): string | null => {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader) return null
  
  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return authHeader
}

// Verify JWT token
export const verifyJWTToken = (token: string): AuthenticatedUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      role: decoded.role || 'employee',
      name: decoded.name || decoded.user_metadata?.name || ''
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Verify Supabase token
export const verifySupabaseToken = async (token: string): Promise<AuthenticatedUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    // Get user profile for additional info
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, position')
      .eq('id', user.id)
      .single()
    
    // Use position from database profile as role (matches login API), fallback to user metadata
    const userRole = profile?.position || user.user_metadata?.role || 'employee'
    
    return {
      id: user.id,
      email: user.email || '',
      role: userRole,
      name: profile?.name || user.user_metadata?.name || ''
    }
  } catch (error) {
    console.error('Supabase token verification failed:', error)
    return null
  }
}

// Main authentication middleware
export const authenticate = async (req: NextRequest): Promise<AuthenticatedUser | null> => {
  const token = extractToken(req)
  
  if (!token) {
    return null
  }
  
  // Try Supabase token verification first (since our login returns Supabase tokens)
  let user = await verifySupabaseToken(token)
  
  // If Supabase fails, try JWT verification as fallback
  if (!user) {
    user = verifyJWTToken(token)
  }
  
  return user
}

// Role-based authorization
export const requireRole = (requiredRoles: string[]) => {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const user = await authenticate(req)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (!requiredRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    // Add user to request for use in API handlers
    ;(req as AuthenticatedRequest).user = user
    
    return null // Continue to next middleware/handler
  }
}

// Admin-only middleware
export const requireAdmin = requireRole(['admin'])

// Admin or employee middleware  
export const requireEmployee = requireRole(['admin', 'employee'])

// Helper to get current user from request
export const getCurrentUser = (req: NextRequest): AuthenticatedUser | null => {
  return (req as AuthenticatedRequest).user || null
}

// Request authentication function for API routes
export const authenticateRequest = async (req: NextRequest): Promise<{success: boolean, message?: string, user?: AuthenticatedUser}> => {
  const user = await authenticate(req)
  
  if (!user) {
    return {
      success: false,
      message: 'Authentication required'
    }
  }
  
  return {
    success: true,
    user
  }
}

// Create authentication response helpers
export const createAuthResponse = {
  unauthorized: (message = 'Authentication required') =>
    NextResponse.json(
      { success: false, message, code: 'UNAUTHORIZED' },
      { status: 401 }
    ),
    
  forbidden: (message = 'Insufficient permissions') =>
    NextResponse.json(
      { success: false, message, code: 'FORBIDDEN' },
      { status: 403 }
    ),
    
  invalid: (message = 'Invalid token') =>
    NextResponse.json(
      { success: false, message, code: 'INVALID_TOKEN' },
      { status: 401 }
    )
}
