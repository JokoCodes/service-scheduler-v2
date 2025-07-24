import { createSupabaseClient, getDatabaseConfig, type DatabaseConfig } from '@service-scheduler/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Lazy-loaded database configuration
let config: DatabaseConfig | null = null
const getConfig = () => {
  if (!config) {
    config = getDatabaseConfig()
  }
  return config
}

// Lazy-loaded Supabase client for mobile operations (optimized for auth and real-time)
let _supabase: SupabaseClient | null = null
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!_supabase) {
      const cfg = getConfig()
      _supabase = createSupabaseClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    }
    return (_supabase as any)[prop]
  }
})

// Admin client for server-side operations
let adminClient: SupabaseClient | null = null

export const getAdminClient = (): SupabaseClient => {
  if (!adminClient) {
    const cfg = getConfig()
    if (!cfg.supabaseServiceRoleKey) {
      throw new Error('Service role key required for admin operations')
    }
    adminClient = createSupabaseClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey)
  }
  return adminClient
}

// Database health check optimized for mobile
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })
      .limit(1)
    
    return !error
  } catch (error) {
    console.error('Mobile API database health check failed:', error)
    return false
  }
}

// Mobile-specific database helpers

// Get lightweight employee profile for mobile
export const getMobileEmployeeProfile = async (employeeId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone, avatar, is_active')
    .eq('id', employeeId)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}

// Get employee's active jobs (mobile-optimized)
export const getEmployeeActiveJobs = async (employeeId: string, limit: number = 20) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      scheduled_date,
      scheduled_time,
      status,
      service_address,
      notes,
      customers:customer_id (
        name,
        phone
      ),
      services:service_id (
        name,
        duration,
        price
      )
    `)
    .eq('assigned_employee_id', employeeId)
    .in('status', ['confirmed', 'in-progress'])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(limit)
  
  if (error) throw error
  return data
}

// Update job status (mobile-optimized)
export const updateJobStatus = async (
  bookingId: string,
  employeeId: string,
  status: string,
  updateData: {
    notes?: string
    latitude?: number
    longitude?: number
    photos?: string[]
    customerSignature?: string
  }
) => {
  // Update booking status
  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', bookingId)
    .eq('assigned_employee_id', employeeId) // Security check
  
  if (bookingError) throw bookingError
  
  // Create job status update record
  const { error: statusError } = await supabase
    .from('job_status_updates')
    .insert({
      booking_id: bookingId,
      employee_id: employeeId,
      status,
      notes: updateData.notes,
      latitude: updateData.latitude,
      longitude: updateData.longitude,
      photos: updateData.photos,
      customer_signature: updateData.customerSignature,
      timestamp: new Date().toISOString()
    })
  
  if (statusError) throw statusError
  
  return true
}

// Update employee location
export const updateEmployeeLocation = async (
  employeeId: string,
  latitude: number,
  longitude: number,
  isActive: boolean = true
) => {
  const { error } = await supabase
    .from('employee_locations')
    .insert({
      employee_id: employeeId,
      latitude,
      longitude,
      is_active: isActive,
      timestamp: new Date().toISOString()
    })
  
  if (error) throw error
  return true
}

// Get employee notifications (mobile-optimized)
export const getEmployeeNotifications = async (
  employeeId: string,
  limit: number = 50
) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, message, priority, is_read, created_at')
    .eq('user_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data
}

// Mark notification as read
export const markNotificationRead = async (
  notificationId: string,
  employeeId: string
) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', employeeId) // Security check
  
  if (error) throw error
  return true
}
