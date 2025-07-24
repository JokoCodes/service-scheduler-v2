import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { supabase, getMobileEmployeeProfile } from '../lib/database'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  
  interface FastifyRequest {
    user?: {
      id: string
      email: string
      name: string
      role: string
    }
  }
}

export async function authMiddleware(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
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
  })
}

// Register the authentication middleware
export default async function(fastify: FastifyInstance) {
  await authMiddleware(fastify)
}
