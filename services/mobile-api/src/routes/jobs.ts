import { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { getEmployeeActiveJobs, updateJobStatus, supabase, getMobileEmployeeProfile, getAdminClient } from '../lib/database'
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

// Assign job to employee
fastify.post('/assign', {
  preHandler: authenticate
}, async (request, reply) => {
  try {
    const { bookingId, employeeId } = request.body
    
    fastify.log.info('Assigning job:', { bookingId, employeeId })

    // Check if the employee exists in the employees table using profile_id
    let { data: userInEmployees, error: employeesError } = await supabase
      .from('employees')
      .select('id, profile_id')
      .eq('profile_id', employeeId)  // Look up by profile_id instead of id
      .single()
    
    fastify.log.info('Employee check result:', { userInEmployees, employeesError })
    
    let actualEmployeeId: string

    if (employeesError && employeesError.code === 'PGRST116') {
      // If employee record doesn't exist, create it
      fastify.log.info('Employee not found in employees table, fetching from profiles...')
      
      const { data: userInProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, phone, position, hourly_rate, is_active, company_id')
        .eq('id', employeeId)
        .single()

      fastify.log.info('Profile lookup result:', { userInProfiles, profilesError })

      if (profilesError || !userInProfiles) {
        fastify.log.error('Profile not found:', profilesError)
        return reply.status(404).send({
          success: false,
          message: 'User not found in profiles table'
        })
      }

      // Ensure the user has a company_id
      const companyId = userInProfiles.company_id || '550e8400-e29b-41d4-a716-446655440000'
      
      fastify.log.info('Creating employee record with company_id:', companyId)
      
      const { data: newEmployee, error: createError } = await supabase
        .from('employees')
        .insert({
          profile_id: userInProfiles.id,  // Link to profile
          name: userInProfiles.name,
          phone: userInProfiles.phone,
          position: userInProfiles.position,
          hourly_rate: userInProfiles.hourly_rate,
          is_active: userInProfiles.is_active ?? true,
          company_id: companyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (createError) {
        fastify.log.error('Employee creation error:', createError)
        return reply.status(500).send({
          success: false,
          message: `Failed to create employee record: ${createError.message}`
        })
      }
      
      fastify.log.info('Employee record created successfully:', newEmployee)
      actualEmployeeId = newEmployee.id
    } else {
      // Employee record exists, use its id
      actualEmployeeId = userInEmployees.id
    }

    // Assign the job to the employee using the actual employee.id
    const { data, error } = await supabase
      .from('bookings')
      .update({
        assigned_employee_id: actualEmployeeId,  // Use employee.id, not profile.id
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()

    if (error) {
      fastify.log.error('Booking update error:', error)
      return reply.status(500).send({
        success: false,
        message: 'Failed to assign job'
      })
    }

    return reply.send({
      success: true,
      message: 'Job successfully assigned',
      data
    })

  } catch (error) {
    fastify.log.error('Error assigning job:', error)
    return reply.status(500).send({
      success: false,
      message: 'Internal server error'
    })
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

  // Enterprise Employee Resolution Helper
  async function getOrCreateEmployee(profileId: string, companyId: string) {
    try {
      const adminClient = getAdminClient()
      fastify.log.info('🔍 Employee resolution started:', { profileId, companyId })
      
      // Step 1: Try to find existing employee
      fastify.log.info('Step 1: Looking for existing employee...')
      
      const { data: existingEmployee, error: lookupError } = await adminClient
        .from('employees')
        .select('*')
        .eq('profile_id', profileId)
        .eq('company_id', companyId)
        .single()

      fastify.log.info('Employee lookup result:', {
        found: !!existingEmployee,
        error: lookupError,
        errorCode: lookupError?.code
      })

      if (existingEmployee && !lookupError) {
        fastify.log.info('✅ Found existing employee:', {
          employeeId: existingEmployee.id,
          profileId: existingEmployee.profile_id,
          name: existingEmployee.name,
          companyId: existingEmployee.company_id
        })
        return existingEmployee
      }

      // Step 2: Get profile information
      fastify.log.info('Step 2: Employee not found, fetching profile info...', { profileId })
      
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id, name, email, phone')
        .eq('id', profileId)
        .single()

      fastify.log.info('Profile lookup result:', {
        found: !!profile,
        profile: profile ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone
        } : null,
        error: profileError
      })

      if (profileError || !profile) {
        fastify.log.error('❌ Profile not found:', { profileId, error: profileError })
        throw new Error(`Profile not found: ${profileId}`)
      }

      // Step 3: Create employee record (Enterprise Auto-Provisioning)
      fastify.log.info('Step 3: Auto-creating employee record...', {
        profileId,
        companyId,
        profileName: profile.name
      })
      
      const employeeData = {
        profile_id: profileId,
        company_id: companyId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        position: 'Staff', // Default position
        is_active: true,
        hourly_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      fastify.log.info('Employee data to create:', employeeData)
      
      const { data: newEmployee, error: createError } = await adminClient
        .from('employees')
        .insert(employeeData)
        .select('*')
        .single()

      fastify.log.info('Employee creation result:', {
        success: !!newEmployee,
        employee: newEmployee ? {
          id: newEmployee.id,
          profile_id: newEmployee.profile_id,
          name: newEmployee.name,
          company_id: newEmployee.company_id
        } : null,
        error: createError
      })

      if (createError) {
        fastify.log.error('❌ Employee creation failed:', {
          employeeData,
          error: createError,
          errorCode: createError.code,
          errorMessage: createError.message,
          errorDetails: createError.details
        })
        throw new Error(`Failed to create employee: ${createError.message}`)
      }

      fastify.log.info('✅ Employee auto-created successfully:', {
        employeeId: newEmployee.id,
        profileId,
        name: newEmployee.name,
        companyId: newEmployee.company_id
      })
      
      return newEmployee

    } catch (error) {
      fastify.log.error('❌ Employee resolution error:', {
        profileId,
        companyId,
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  // Staff Assignment Routes for new staff management system
  
  // POST /api/jobs/bookings/:bookingId/staff - Assign staff to booking (Enterprise)
  fastify.post('/bookings/:bookingId/staff', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', format: 'uuid' }
        },
        required: ['bookingId']
      },
      body: {
        type: 'object',
        properties: {
          profileId: { type: 'string', format: 'uuid' },  // Clear naming
          role: { type: 'string', enum: ['lead', 'employee', 'supervisor'], default: 'employee' },
          notes: { type: 'string', maxLength: 1000 }
        },
        required: ['profileId']
      }
    }
  }, async (request, reply) => {
    try {
      const { bookingId } = request.params
      const { profileId, role = 'employee', notes } = request.body
      
      fastify.log.info('=== STAFF ASSIGNMENT REQUEST START ===', {
        bookingId,
        profileId,
        role,
        requestId: Date.now()
      })
      
      // Step 1: Validate booking exists and get company context
      fastify.log.info('Step 1: Looking up booking...', { bookingId })
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id, staff_required, staff_fulfilled, company_id')
        .eq('id', bookingId)
        .single()

      fastify.log.info('Booking lookup result:', {
        found: !!booking,
        booking: booking ? {
          id: booking.id,
          company_id: booking.company_id,
          staff_required: booking.staff_required,
          staff_fulfilled: booking.staff_fulfilled
        } : null,
        error: bookingError
      })

      if (bookingError || !booking) {
        fastify.log.error('❌ Booking not found:', { bookingId, error: bookingError })
        return reply.status(404).send({
          success: false,
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
          debug: { bookingId, error: bookingError }
        })
      }

      // Step 2: Get or create employee record (Enterprise Logic)
      fastify.log.info('Step 2: Resolving employee record...', {
        profileId,
        companyId: booking.company_id
      })
      
      let employee
      try {
        employee = await getOrCreateEmployee(profileId, booking.company_id)
        fastify.log.info('✅ Employee resolved successfully:', {
          employeeId: employee.id,
          profileId: employee.profile_id,
          name: employee.name,
          companyId: employee.company_id
        })
      } catch (error) {
        fastify.log.error('❌ Employee resolution failed:', {
          profileId,
          companyId: booking.company_id,
          error: error.message,
          stack: error.stack
        })
        
        if (error.message.includes('Profile not found')) {
          return reply.status(404).send({
            success: false,
            message: 'Employee profile not found',
            code: 'PROFILE_NOT_FOUND',
            debug: { profileId, error: error.message }
          })
        }
        
        if (error.message.includes('Failed to create employee')) {
          return reply.status(500).send({
            success: false,
            message: 'Employee provisioning failed',
            code: 'EMPLOYEE_CREATION_FAILED',
            debug: { profileId, error: error.message }
          })
        }
        
        throw error // Re-throw unknown errors
      }

      // Step 3: Create staff assignment with proper employee_id
      fastify.log.info('Step 3: Creating staff assignment...', {
        bookingId,
        employeeId: employee.id,
        role,
        notes
      })
      
      const assignmentData = {
        booking_id: bookingId,
        employee_id: employee.profile_id, // Use profile_id to match FK constraint
        role: role,
        notes: notes,
        status: 'assigned'
      }
      
      fastify.log.info('Assignment data to insert:', assignmentData)
      
      const adminClient = getAdminClient()
      const { data: assignment, error: assignmentError } = await adminClient
        .from('booking_staff_assignments')
        .insert(assignmentData)
        .select('id, booking_id, employee_id, role, status, assigned_at, notes, created_at, updated_at')
        .single()

      fastify.log.info('Assignment creation result:', {
        success: !!assignment,
        assignment: assignment ? {
          id: assignment.id,
          booking_id: assignment.booking_id,
          employee_id: assignment.employee_id,
          status: assignment.status
        } : null,
        error: assignmentError
      })

      if (assignmentError) {
        fastify.log.error('❌ Staff assignment creation failed:', {
          assignmentData,
          error: assignmentError,
          errorCode: assignmentError.code,
          errorMessage: assignmentError.message,
          errorDetails: assignmentError.details
        })
        
        // Handle duplicate assignment
        if (assignmentError.code === '23505') {
          return reply.status(409).send({
            success: false,
            message: 'Employee is already assigned to this booking',
            code: 'DUPLICATE_ASSIGNMENT',
            debug: { assignmentData, error: assignmentError }
          })
        }
        
        // Check for foreign key constraint failures
        if (assignmentError.code === '23503') {
          return reply.status(400).send({
            success: false,
            message: 'Invalid booking or employee reference',
            code: 'FOREIGN_KEY_VIOLATION',
            debug: { assignmentData, error: assignmentError }
          })
        }

        return reply.status(500).send({
          success: false,
          message: 'Failed to assign staff',
          code: 'ASSIGNMENT_FAILED',
          debug: {
            assignmentData,
            error: {
              code: assignmentError.code,
              message: assignmentError.message,
              details: assignmentError.details,
              hint: assignmentError.hint
            }
          }
        })
      }

      fastify.log.info('✅ Staff assigned successfully:', {
        assignmentId: assignment.id,
        bookingId,
        employeeId: employee.id,
        profileId
      })

      const responseData = {
        id: assignment.id,
        bookingId: assignment.booking_id,
        employeeId: assignment.employee_id,
        profileId: employee.profile_id,
        employeeName: employee.name || employee.full_name || 'Unknown',
        employeePosition: employee.position,
        role: assignment.role,
        status: assignment.status,
        assignedAt: assignment.assigned_at,
        notes: assignment.notes
      }
      
      fastify.log.info('Response data:', responseData)

      return reply.status(201).send({
        success: true,
        data: responseData,
        message: 'Staff assigned successfully'
      })

    } catch (error) {
      fastify.log.error('❌ CRITICAL: Assign staff error:', {
        error: error.message,
        stack: error.stack,
        bookingId: request.params?.bookingId,
        profileId: request.body?.profileId
      })
      
      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        debug: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      })
    }
  })

  // PUT /api/jobs/bookings/:bookingId/staff/:assignmentId - Update staff assignment status
  fastify.put('/bookings/:bookingId/staff/:assignmentId', {
    preHandler: authenticate,
    schema: {
      params: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', format: 'uuid' },
          assignmentId: { type: 'string', format: 'uuid' }
        },
        required: ['bookingId', 'assignmentId']
      },
      body: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['accepted', 'declined', 'completed'] },
          notes: { type: 'string', maxLength: 1000 }
        },
        required: ['status']
      }
    }
  }, async (request, reply) => {
    try {
      const { bookingId, assignmentId } = request.params
      const { status, notes } = request.body
      const profileId = request.user!.id // This is the profile ID from auth

      fastify.log.info('Staff assignment status update:', { bookingId, assignmentId, status, profileId })

      // Step 1: Find the employee record for this profile
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, profile_id, company_id')
        .eq('profile_id', profileId)
        .single()

      if (employeeError || !employee) {
        fastify.log.error('Employee not found for profile:', { profileId, error: employeeError })
        return reply.status(404).send({
          success: false,
          message: 'Employee record not found for your profile',
          code: 'EMPLOYEE_NOT_FOUND'
        })
      }

      // Step 2: Check if assignment exists and belongs to this employee
      const { data: assignment, error: fetchError } = await supabase
        .from('booking_staff_assignments')
        .select(`
          *,
          employees:employee_id (
            id,
            profile_id,
            name
          )
        `)
        .eq('id', assignmentId)
        .eq('booking_id', bookingId)
        .eq('employee_id', profileId) // Use profile_id to match FK constraint
        .single()

      if (fetchError || !assignment) {
        fastify.log.error('Assignment not found:', { assignmentId, employeeId: employee.id, error: fetchError })
        return reply.status(404).send({
          success: false,
          message: 'Assignment not found or you do not have permission to update this assignment',
          code: 'ASSIGNMENT_NOT_FOUND'
        })
      }

      // Prepare update data
      const updateData: any = {
        status: status,
        notes: notes,
        updated_at: new Date().toISOString()
      }

      // Set timestamp based on status
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString()
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      // Update the staff assignment
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('booking_staff_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select(`
          *,
          employees:employee_id (
            name,
            phone,
            profile_id
          )
        `)
        .single()

      if (updateError) {
        fastify.log.error('Staff assignment update error:', updateError)
        return reply.status(500).send({
          success: false,
          message: 'Failed to update staff assignment'
        })
      }

      // If status is accepted, log the booking info
      if (status === 'accepted') {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, staff_required, staff_fulfilled')
          .eq('id', bookingId)
          .single()

        if (booking) {
          fastify.log.info(`Job picked up: Booking ${bookingId} staffing updated: ${booking.staff_fulfilled}/${booking.staff_required} staff`)
        }
      }

      return reply.send({
        success: true,
        data: {
          id: updatedAssignment.id,
          bookingId: updatedAssignment.booking_id,
          employeeId: updatedAssignment.employee_id,
          employeeName: updatedAssignment.employees?.name,
          role: updatedAssignment.role,
          status: updatedAssignment.status,
          assignedAt: updatedAssignment.assigned_at,
          acceptedAt: updatedAssignment.accepted_at,
          completedAt: updatedAssignment.completed_at,
          notes: updatedAssignment.notes
        },
        message: 'Staff assignment updated successfully'
      })

    } catch (error) {
      fastify.log.error('Update staff assignment error:', error)
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      })
    }
  })

  // POST /api/jobs/pickup - Mobile staff job pickup endpoint
  fastify.post('/pickup', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          bookingId: { type: 'string', format: 'uuid' },
          assignmentId: { type: 'string', format: 'uuid' },
          notes: { type: 'string', maxLength: 1000 }
        },
        required: ['bookingId', 'assignmentId']
      }
    }
  }, async (request, reply) => {
    try {
      const { bookingId, assignmentId, notes } = request.body
      const userId = request.user!.id

      // Check if assignment exists and belongs to the current user
      const { data: assignment, error: fetchError } = await supabase
        .from('booking_staff_assignments')
        .select(`
          *,
          bookings!inner (
            id,
            customer_name,
            service_name,
            scheduled_date,
            scheduled_time,
            service_address,
            staff_required,
            staff_fulfilled
          )
        `)
        .eq('id', assignmentId)
        .eq('booking_id', bookingId)
        .eq('employee_id', userId)  // Use userId (profile_id) to match FK constraint
        .single()

      if (fetchError || !assignment) {
        return reply.status(404).send({
          success: false,
          message: 'Assignment not found or you do not have permission to pick up this job'
        })
      }

      // Check if assignment is in a state that can be picked up
      if (assignment.status !== 'assigned') {
        return reply.status(400).send({
          success: false,
          message: `Cannot pick up job. Current status: ${assignment.status}`
        })
      }

      // Update the assignment status to 'accepted'
      const updateData = {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        notes: notes,
        updated_at: new Date().toISOString()
      }

      const { data: updatedAssignment, error: updateError } = await supabase
        .from('booking_staff_assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select(`
          *,
          employees:employee_id (
            name,
            phone,
            profile_id
          ),
          bookings!inner (
            id,
            customer_name,
            service_name,
            scheduled_date,
            scheduled_time,
            service_address,
            staff_required,
            staff_fulfilled
          )
        `)
        .single()

      if (updateError) {
        fastify.log.error('Job pickup update error:', updateError)
        return reply.status(500).send({
          success: false,
          message: 'Failed to pick up job assignment'
        })
      }

      // Log the successful pickup
      fastify.log.info(`Job picked up successfully:`, {
        bookingId,
        assignmentId,
        employeeId: userId,
        staffing: `${updatedAssignment.bookings.staff_fulfilled}/${updatedAssignment.bookings.staff_required}`
      })

      // Return the updated assignment with booking details
      return reply.send({
        success: true,
        data: {
          id: updatedAssignment.id,
          bookingId: updatedAssignment.booking_id,
          employeeId: updatedAssignment.employee_id,
          employeeName: updatedAssignment.employees?.name,
          role: updatedAssignment.role,
          status: updatedAssignment.status,
          assignedAt: updatedAssignment.assigned_at,
          acceptedAt: updatedAssignment.accepted_at,
          notes: updatedAssignment.notes,
          booking: {
            id: updatedAssignment.bookings.id,
            customerName: updatedAssignment.bookings.customer_name,
            serviceName: updatedAssignment.bookings.service_name,
            serviceAddress: updatedAssignment.bookings.service_address,
            scheduledDate: updatedAssignment.bookings.scheduled_date,
            scheduledTime: updatedAssignment.bookings.scheduled_time,
            staffRequired: updatedAssignment.bookings.staff_required,
            staffFulfilled: updatedAssignment.bookings.staff_fulfilled
          }
        },
        message: 'Job picked up successfully'
      })

    } catch (error) {
      fastify.log.error('Job pickup error:', error)
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      })
    }
  })
}
