import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getEmployeeActiveJobs, updateJobStatus, supabase, getMobileEmployeeProfile } from '../lib/database'
import { validateAndTransform, jobStatusUpdateSchema } from '@service-scheduler/utils'
import { formatDate, formatDuration, formatCurrency } from '@service-scheduler/utils'
import type { ApiResponse, MobileJobUpdateRequest } from '@service-scheduler/shared-types'

export async function jobsRoutes(
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
      
      let token = authHeader
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        })
      }
      
      try {
        const profile = await getMobileEmployeeProfile(user.id)
        
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
  
  // Get employee's active jobs (mobile-optimized)
  fastify.get('/active', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const limit = parseInt((request.query as any)?.limit || '20', 10)
      
      const jobs = await getEmployeeActiveJobs(employeeId, limit)
      
      // Transform data for mobile consumption (lightweight)
      const mobileJobs = jobs.map(job => ({
        id: job.id,
        scheduledDate: job.scheduled_date,
        scheduledTime: job.scheduled_time,
        status: job.status,
        customerName: job.customers.name,
        customerPhone: job.customers.phone,
        serviceAddress: job.service_address,
        serviceName: job.services.name,
        serviceDuration: job.services.duration,
        servicePrice: parseFloat(job.services.price),
        notes: job.notes,
        // Mobile-friendly formatted versions
        displayDate: formatDate(job.scheduled_date, 'MMM dd, yyyy'),
        displayTime: job.scheduled_time,
        displayDuration: formatDuration(job.services.duration),
        displayPrice: formatCurrency(parseFloat(job.services.price))
      }))
      
      const response: ApiResponse = {
        success: true,
        data: mobileJobs,
        meta: {
          total: mobileJobs.length,
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Get active jobs error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch jobs'
      } as ApiResponse)
    }
  })
  
  // Update job status (mobile-optimized with location and photos)
  fastify.post<{
    Body: MobileJobUpdateRequest
  }>('/update', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['bookingId', 'status'],
        properties: {
          bookingId: { type: 'string', format: 'uuid' },
          status: { 
            type: 'string',
            enum: ['confirmed', 'in-progress', 'completed', 'cancelled']
          },
          notes: { type: 'string', maxLength: 1000 },
          photos: { 
            type: 'array',
            items: { type: 'string' },
            maxItems: 10
          },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', minimum: -90, maximum: 90 },
              longitude: { type: 'number', minimum: -180, maximum: 180 }
            },
            required: ['latitude', 'longitude']
          },
          customerSignature: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const validatedData = validateAndTransform(jobStatusUpdateSchema, request.body)
      
      await updateJobStatus(
        validatedData.bookingId,
        employeeId,
        validatedData.status,
        {
          notes: validatedData.notes,
          latitude: validatedData.location?.latitude,
          longitude: validatedData.location?.longitude,
          photos: validatedData.photos,
          customerSignature: validatedData.customerSignature
        }
      )
      
      const response: ApiResponse = {
        success: true,
        message: `Job status updated to ${validatedData.status}`,
        data: {
          bookingId: validatedData.bookingId,
          status: validatedData.status,
          timestamp: new Date().toISOString()
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Job status update error:', error)
      
      if (error instanceof Error && error.message.includes('Invalid')) {
        return reply.status(400).send({
          success: false,
          message: 'Validation failed',
          errors: { general: [error.message] }
        } as ApiResponse)
      }
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to update job status'
      } as ApiResponse)
    }
  })
  
  // Get specific job details
  fastify.get<{
    Params: { jobId: string }
  }>('/:jobId', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          jobId: { type: 'string', format: 'uuid' }
        },
        required: ['jobId']
      }
    }
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const { jobId } = request.params
      
      // Get specific job with detailed info for mobile
      const { data: job, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            address
          ),
          services:service_id (
            name,
            description,
            duration,
            price,
            category
          ),
          job_status_updates (
            id,
            status,
            notes,
            latitude,
            longitude,
            photos,
            timestamp
          )
        `)
        .eq('id', jobId)
        .eq('assigned_employee_id', employeeId) // Security check
        .single()
      
      if (error || !job) {
        return reply.status(404).send({
          success: false,
          message: 'Job not found'
        } as ApiResponse)
      }
      
      // Transform for mobile
      const mobileJobDetail = {
        id: job.id,
        scheduledDate: job.scheduled_date,
        scheduledTime: job.scheduled_time,
        status: job.status,
        serviceAddress: job.service_address,
        notes: job.notes,
        totalPrice: parseFloat(job.total_price),
        customer: {
          name: job.customers.name,
          email: job.customers.email,
          phone: job.customers.phone,
          address: job.customers.address
        },
        service: {
          name: job.services.name,
          description: job.services.description,
          duration: job.services.duration,
          price: parseFloat(job.services.price),
          category: job.services.category
        },
        statusHistory: job.job_status_updates.map((update: any) => ({
          id: update.id,
          status: update.status,
          notes: update.notes,
          location: update.latitude && update.longitude ? {
            latitude: parseFloat(update.latitude),
            longitude: parseFloat(update.longitude)
          } : null,
          photos: update.photos || [],
          timestamp: update.timestamp,
          displayTime: formatDate(update.timestamp, 'MMM dd, yyyy HH:mm')
        })),
        // Mobile-friendly formatted versions
        displayDate: formatDate(job.scheduled_date, 'MMM dd, yyyy'),
        displayTime: job.scheduled_time,
        displayDuration: formatDuration(job.services.duration),
        displayPrice: formatCurrency(parseFloat(job.total_price))
      }
      
      const response: ApiResponse = {
        success: true,
        data: mobileJobDetail,
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Get job detail error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch job details'
      } as ApiResponse)
    }
  })
  
  // Upload job photos (multipart upload)
  fastify.post<{
    Params: { jobId: string }
  }>('/:jobId/photos', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          jobId: { type: 'string', format: 'uuid' }
        },
        required: ['jobId']
      }
    }
  }, async (request, reply) => {
    try {
      const employeeId = request.user!.id
      const { jobId } = request.params
      
      // Handle multipart file upload
      const parts = request.files()
      const uploadedFiles: string[] = []
      
      for await (const part of parts) {
        if (part.type === 'file' && part.mimetype.startsWith('image/')) {
          // In a real implementation, you'd upload to Supabase Storage or S3
          // For now, we'll simulate the upload and return a placeholder URL
          const fileName = `job-${jobId}-${Date.now()}-${part.filename}`
          const fileUrl = `https://storage.supabase.co/v1/object/public/job-photos/${fileName}`
          
          uploadedFiles.push(fileUrl)
          
          // TODO: Implement actual file upload to Supabase Storage
          // const buffer = await part.toBuffer()
          // await uploadToSupabaseStorage(buffer, fileName)
        }
      }
      
      if (uploadedFiles.length === 0) {
        return reply.status(400).send({
          success: false,
          message: 'No valid image files provided'
        } as ApiResponse)
      }
      
      const response: ApiResponse = {
        success: true,
        data: {
          jobId,
          uploadedPhotos: uploadedFiles,
          count: uploadedFiles.length
        },
        message: `${uploadedFiles.length} photos uploaded successfully`,
        meta: {
          timestamp: new Date().toISOString()
        }
      }
      
      return response
      
    } catch (error) {
      fastify.log.error('Photo upload error:', error)
      
      return reply.status(500).send({
        success: false,
        message: 'Failed to upload photos'
      } as ApiResponse)
    }
  })
}
