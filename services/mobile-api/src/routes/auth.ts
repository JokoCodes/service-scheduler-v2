import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { supabase, getMobileEmployeeProfile } from '../lib/database'
import { validateAndTransform, loginSchema } from '@service-scheduler/utils'
import type { LoginRequest, ApiResponse } from '@service-scheduler/shared-types'
export async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Create inline auth function since middleware registration is complex
  const authenticate = async (request: any, reply: any) => {
    try {
      const authHeader = request.headers.authorization
      
      if (!authHeader) {
        return reply.status(401).send({
          success: false,
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        })
      }
      
      // Extract token (support both "Bearer token" and "token" formats)
      let token = authHeader
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        })
      }
      
      // Get employee profile to ensure they're active
      try {
        const profile = await getMobileEmployeeProfile(user.id)
        
        // Attach user to request
        request.user = {
          id: user.id,
          email: user.email || '',
          name: profile.name,
          role: 'employee'
        }
        
      } catch (profileError) {
        return reply.status(403).send({
          success: false,
          message: 'Employee account not found or inactive',
          code: 'FORBIDDEN'
        })
      }
      
    } catch (error) {
      fastify.log.error('Authentication error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Authentication service error',
        code: 'INTERNAL_ERROR'
      })
    }
  }
  // Login endpoint for mobile employees
  fastify.post<{
    Body: LoginRequest
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['employee'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const validatedData = validateAndTransform(loginSchema, request.body)
      
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      })
      
      if (error || !data.user || !data.session) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid credentials'
        } as ApiResponse)
      }
      
      // Check if user is an employee and active
      try {
        const profile = await getMobileEmployeeProfile(data.user.id)
        
        const response: ApiResponse = {
          success: true,
          data: {
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: {
              id: data.user.id,
              name: profile.name,
              email: data.user.email || '',
              role: 'employee'
            },
            expiresIn: data.session.expires_in || 3600
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        }
        
        return response
        
      } catch (profileError) {
        fastify.log.error('Profile fetch error:', profileError)
        return reply.status(403).send({
          success: false,
          message: 'Employee account not found or inactive'
        } as ApiResponse)
      }
      
    } catch (error) {
      fastify.log.error('Login error:', error)
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: { general: [error.message] }
        } as ApiResponse)
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      } as ApiResponse)
    }
  })
  
  // Refresh token endpoint
  fastify.post<{
    Body: { refreshToken: string }
  }>('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { refreshToken } = request.body
      
      // Refresh the session
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      })
      
      if (error || !data.session || !data.user) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid refresh token'
        } as ApiResponse)
      }
      
      // Verify user is still active
      try {
        const profile = await getMobileEmployeeProfile(data.user.id)
        
        const response: ApiResponse = {
          success: true,
          data: {
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: {
              id: data.user.id,
              name: profile.name,
              email: data.user.email || '',
              role: 'employee'
            },
            expiresIn: data.session.expires_in || 3600
          },
          meta: {
            timestamp: new Date().toISOString()
          }
        }
        
        return response
        
      } catch (profileError) {
        return reply.status(403).send({
          success: false,
          message: 'Employee account not found or inactive'
        } as ApiResponse)
      }
      
    } catch (error) {
      fastify.log.error('Refresh token error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      } as ApiResponse)
    }
  })
  
  // Logout endpoint (optional - mainly invalidates locally stored tokens)
  fastify.post('/logout', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      // With Supabase, logout is mainly client-side token removal
      // But we can invalidate the session server-side if needed
      
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Logout error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      } as ApiResponse)
    }
  })
  
  // Verify token endpoint (for mobile app to check token validity)
  fastify.get('/verify', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      // If we reach here, the token is valid (thanks to authenticate preHandler)
      const user = (request as any).user
      
      const response: ApiResponse = {
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Token verification error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      } as ApiResponse)
    }
  })
}
