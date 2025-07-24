import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'

// Import our custom plugins and routes
import { authRoutes } from './routes/auth'
import { jobsRoutes } from './routes/jobs'
import { locationRoutes } from './routes/location'
import { notificationsRoutes } from './routes/notifications'
import { employeeRoutes } from './routes/employee'

const server = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
})

const start = async () => {
  try {
    // Register plugins
    await server.register(cors, {
      origin: true, // Allow all origins in development
      credentials: true
    })

    await server.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB file size limit
      }
    })

    await server.register(jwt, {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    })

    await server.register(websocket, {
      options: { 
        maxPayload: 1048576, // 1MB
        clientTracking: true
      }
    })

    // Register routes
    await server.register(authRoutes, { prefix: '/api/auth' })
    await server.register(jobsRoutes, { prefix: '/api/jobs' })
    await server.register(locationRoutes, { prefix: '/api/location' })
    await server.register(notificationsRoutes, { prefix: '/api/notifications' })
    await server.register(employeeRoutes, { prefix: '/api/employee' })

    // Health check endpoint
    server.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'mobile-api',
        version: '1.0.0'
      }
    })

    // Root endpoint
    server.get('/', async (request, reply) => {
      return {
        service: 'Service Scheduler Mobile API',
        description: 'Backend API service optimized for React Native employee app',
        version: '1.0.0',
        features: [
          '🚀 High-performance Fastify server',
          '📱 Mobile-optimized lightweight payloads',
          '🔄 Real-time WebSocket connections',
          '📍 GPS location tracking',
          '📸 Photo upload support',
          '🔔 Push notifications',
          '⚡ Optimized for mobile data usage'
        ],
        endpoints: {
          auth: '/api/auth/*',
          jobs: '/api/jobs/*',
          location: '/api/location/*',
          notifications: '/api/notifications/*',
          employee: '/api/employee/*',
          websocket: '/ws'
        }
      }
    })

    // Error handler
    server.setErrorHandler((error, request, reply) => {
      server.log.error(error)

      if (error.validation) {
        reply.status(400).send({
          success: false,
          message: 'Validation error',
          errors: error.validation
        })
        return
      }

      if (error.statusCode) {
        reply.status(error.statusCode).send({
          success: false,
          message: error.message
        })
        return
      }

      reply.status(500).send({
        success: false,
        message: 'Internal server error'
      })
    })

    // Start the server
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3002
    const host = process.env.HOST || '0.0.0.0'

    await server.listen({ port, host })
    
    server.log.info(`🚀 Mobile API server running on http://${host}:${port}`)
    server.log.info(`📱 Optimized for React Native employee app`)
    server.log.info(`🔄 WebSocket support enabled`)
    
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  server.log.info('Received SIGTERM, shutting down gracefully')
  server.close(() => {
    server.log.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  server.log.info('Received SIGINT, shutting down gracefully')
  server.close(() => {
    server.log.info('Server closed')
    process.exit(0)
  })
})

start()
