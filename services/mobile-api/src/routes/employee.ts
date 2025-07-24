import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getMobileEmployeeProfile } from '../lib/database'
import type { ApiResponse } from '@service-scheduler/shared-types'

export async function employeeRoutes(
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
      const { supabase } = require('../lib/database')
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
        const { getMobileEmployeeProfile } = require('../lib/database')
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
  
  // Get current employee profile
  fastify.get('/profile', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      
      const profile = await getMobileEmployeeProfile(employeeId)
      
      const response: ApiResponse = {
        success: true,
        data: {
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          avatar: profile.avatar,
          isActive: profile.is_active
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Get employee profile error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch employee profile'
      } as ApiResponse)
    }
  })
}
