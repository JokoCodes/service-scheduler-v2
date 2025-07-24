import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
export const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
export const uuidSchema = z.string().uuid('Invalid UUID format')

// Booking validation schemas
export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'])

export const createBookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long'),
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  serviceAddress: z.string().min(1, 'Service address is required').max(500, 'Address too long'),
  serviceId: uuidSchema,
  scheduledDate: dateSchema,
  scheduledTime: timeSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
  assignedEmployeeId: uuidSchema.optional()
})

export const updateBookingSchema = createBookingSchema.partial().extend({
  status: bookingStatusSchema.optional()
})

// Employee validation schemas
export const createEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  position: z.string().max(100, 'Position too long').optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  skills: z.array(z.string().max(50, 'Skill name too long')).optional()
})

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  isActive: z.boolean().optional()
})

// Service validation schemas
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  duration: z.number().int().positive('Duration must be a positive integer'),
  price: z.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  isActive: z.boolean().default(true)
})

export const updateServiceSchema = createServiceSchema.partial()

// Customer validation schemas
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1, 'Address is required').max(500, 'Address too long')
})

export const updateCustomerSchema = createCustomerSchema.partial()

// Authentication validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'employee']).optional()
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['admin', 'employee']).default('employee')
})

// Mobile-specific validation schemas
export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  isActive: z.boolean()
})

export const jobStatusUpdateSchema = z.object({
  bookingId: uuidSchema,
  status: bookingStatusSchema,
  notes: z.string().max(1000, 'Notes too long').optional(),
  photos: z.array(z.string().url('Invalid photo URL')).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  customerSignature: z.string().optional()
})

// Availability validation schemas
export const availabilityUpdateSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be 0-6'),
  startTime: timeSchema,
  endTime: timeSchema,
  isAvailable: z.boolean()
}).refine(data => {
  // Validate that end time is after start time
  const [startHour, startMinute] = data.startTime.split(':').map(Number)
  const [endHour, endMinute] = data.endTime.split(':').map(Number)
  
  const startTotalMinutes = startHour * 60 + startMinute
  const endTotalMinutes = endHour * 60 + endMinute
  
  return endTotalMinutes > startTotalMinutes
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

// Notification validation schemas
export const pushNotificationSchema = z.object({
  employeeIds: z.array(uuidSchema).optional(),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
  data: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
})

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
})

export const bookingListQuerySchema = paginationSchema.extend({
  status: bookingStatusSchema.optional(),
  employeeId: uuidSchema.optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  search: z.string().max(100).optional()
})

export const employeeListQuerySchema = paginationSchema.extend({
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  skills: z.array(z.string()).optional()
})

// Helper functions for validation
export const validateAndTransform = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data)
}

export const validateAndTransformSafe = <T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } => {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  } else {
    return { success: false, errors: result.error }
  }
}

// Custom validation functions
export const isValidTimeRange = (startTime: string, endTime: string): boolean => {
  try {
    timeSchema.parse(startTime)
    timeSchema.parse(endTime)
    
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    
    return endTotalMinutes > startTotalMinutes
  } catch {
    return false
  }
}

export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  try {
    dateSchema.parse(startDate)
    dateSchema.parse(endDate)
    
    return new Date(startDate) <= new Date(endDate)
  } catch {
    return false
  }
}

// Format validation errors for API responses
export const formatValidationErrors = (error: z.ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {}
  
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }
  
  return formatted
}
