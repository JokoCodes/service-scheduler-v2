import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getEmployeeNotifications, markNotificationRead } from '../lib/database'
import { formatDate } from '@service-scheduler/utils'
import type { ApiResponse } from '@service-scheduler/shared-types'

export async function notificationsRoutes(
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
  
  // Get employee notifications
  fastify.get('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const limit = parseInt((request.query as any)?.limit || '50', 10)
      
      const notifications = await getEmployeeNotifications(employeeId, limit)
      
      // Transform for mobile consumption
      const mobileNotifications = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        isRead: notification.is_read,
        createdAt: notification.created_at,
        displayTime: formatDate(notification.created_at, 'MMM dd, yyyy HH:mm')
      }))
      
      const response: ApiResponse = {
        success: true,
        data: mobileNotifications,
        meta: {
          total: mobileNotifications.length,
          unread: mobileNotifications.filter(n => !n.isRead).length,
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Get notifications error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch notifications'
      } as ApiResponse)
    }
  })
  
  // Mark notification as read
  fastify.patch<{
    Params: { notificationId: string }
  }>('/:notificationId/read', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          notificationId: { type: 'string', format: 'uuid' }
        },
        required: ['notificationId']
      }
    }
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const { notificationId } = request.params
      
      await markNotificationRead(notificationId, employeeId)
      
      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as read',
        data: {
          notificationId,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Mark notification read error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to mark notification as read'
      } as ApiResponse)
    }
  })
}
