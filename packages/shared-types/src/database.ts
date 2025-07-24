// Database schema types - These match the Supabase database structure

export interface DatabaseBooking {
  id: string
  // Legacy fields for backward compatibility during migration
  customer_name?: string
  assigned_employee_name?: string
  // New name fields
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_phone: string
  service_address: string
  service_id: string
  service_name: string
  service_price: number
  service_duration: number
  scheduled_date: string
  scheduled_time: string
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
  notes?: string
  assigned_employee_id?: string
  assigned_employee_first_name?: string
  assigned_employee_last_name?: string
  company_id: string
  created_at: string
  updated_at: string
  // Additional fields from your schema
  staff_required: number
  staff_fulfilled: number
  service_cost?: number
  actual_start_time?: string
  actual_end_time?: string
  customer_rating?: number
  customer_feedback?: string
  payment_required: boolean
  payment_status: string
  deposit_amount?: number
  final_amount?: number
}

export interface DatabaseEmployee {
  id: string
  // Legacy field for backward compatibility during migration
  name?: string
  // New name fields
  first_name: string
  last_name: string
  full_name?: string // Generated column
  email: string
  phone?: string
  position?: string
  is_active: boolean
  hourly_rate?: number
  total_revenue?: number
  avatar?: string
  skills?: string[]
  is_available: boolean
  current_job?: string
  company_id: string
  created_at: string
  updated_at: string
  // Additional fields from your schema
  avg_rating?: number
  total_ratings?: number
  total_hours_worked?: number
  total_bookings_completed?: number
}

export interface DatabaseService {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  is_active: boolean
  company_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseCustomer {
  id: string
  // Legacy field for backward compatibility during migration
  name?: string
  // New name fields
  first_name: string
  last_name: string
  full_name?: string // Generated column
  email: string
  phone?: string
  address?: string
  notes?: string
  total_bookings: number
  total_spent: number
  last_booking_date?: string
  company_id: string
  created_at: string
  updated_at: string
  // Additional fields from your schema
  avg_rating?: number
  first_booking_date?: string
  customer_since?: string
}

export interface DatabaseUser {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: 'admin' | 'employee' | 'customer'
  company_id?: string
  created_at: string
  updated_at: string
}

export interface DatabaseCompany {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  website?: string
  logo_url?: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface DatabaseNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  priority: 'low' | 'medium' | 'high'
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}
