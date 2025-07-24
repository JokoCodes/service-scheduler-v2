import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { updateEmployeeLocation } from '../lib/database'
import { validateAndTransform, locationUpdateSchema } from '@service-scheduler/utils'
import type { ApiResponse, LocationUpdateRequest } from '@service-scheduler/shared-types'

export async function locationRoutes(
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
  
  // Update employee location
  fastify.post<{
    Body: LocationUpdateRequest
  }>('/update', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['latitude', 'longitude', 'isActive'],
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          isActive: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const validatedData = validateAndTransform(locationUpdateSchema, request.body)
      
      await updateEmployeeLocation(
        employeeId,
        validatedData.latitude,
        validatedData.longitude,
        validatedData.isActive
      )
      
      const response: ApiResponse = {
        success: true,
        message: 'Location updated successfully',
        data: {
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
          isActive: validatedData.isActive,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Location update error:', error)
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: { general: [error.message] }
        } as ApiResponse)
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update location'
      } as ApiResponse)
    }
  })
}
