// Business logic types - Frontend-friendly interfaces

export interface Booking {
  id: string
  // Legacy fields for backward compatibility
  customerName?: string
  assignedEmployeeName?: string
  // New name fields
  customerFirstName: string
  customerLastName: string
  customerEmail: string
  customerPhone: string
  serviceAddress: string
  serviceId: string
  serviceName: string
  servicePrice: number
  serviceDuration: number
  scheduledDate: string
  scheduledTime: string
  status: BookingStatus
  notes?: string
  assignedEmployeeId?: string
  assignedEmployeeFirstName?: string
  assignedEmployeeLastName?: string
  staffRequired: number
  staffFulfilled: number
  paymentRequired?: boolean
  paymentStatus?: string
  depositAmount?: number
  finalAmount?: number
  createdAt: string
  updatedAt: string
}

export interface Employee {
  id: string
  // Legacy field for backward compatibility
  name?: string
  // New name fields
  firstName: string
  lastName: string
  email: string
  phone?: string
  position?: string
  role?: 'admin' | 'employee' | 'technician'
  isActive?: boolean
  hourlyRate?: number
  totalRevenue?: number
  avatar?: string
  skills?: string[]
  isAvailable?: boolean
  currentJob?: string
}

export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  category: string
  isActive: boolean
}

export interface Customer {
  id: string
  // Legacy field for backward compatibility
  name?: string
  // New name fields
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  totalBookings: number
  totalSpent: number
  lastBookingDate?: string
}

export interface Payment {
  id: string
  bookingId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string
  stripePaymentMethodId?: string
  failureReason?: string
  customerEmail?: string
  metadata?: Record<string, any>
  companyId: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

export interface PaymentRefund {
  id: string
  paymentId: string
  stripeRefundId?: string
  amount: number
  reason?: string
  status: RefundStatus
  createdAt: string
  processedAt?: string
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  priority: NotificationPriority
  createdAt: string
}

// Enums and Union Types
export type BookingStatus = 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled'
export type NotificationPriority = 'low' | 'medium' | 'high'
export type UserRole = 'admin' | 'employee' | 'customer'
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'canceled'

// Mobile-specific types
export interface JobStatus {
  id: string
  bookingId: string
  status: BookingStatus
  timestamp: string
  location?: {
    latitude: number
    longitude: number
  }
  notes?: string
  photos?: string[]
  customerSignature?: string
}

export interface EmployeeLocation {
  employeeId: string
  latitude: number
  longitude: number
  timestamp: string
  isActive: boolean
}

export interface EmployeeAvailability {
  employeeId: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  isAvailable: boolean
}

// Dashboard and Analytics Types
export interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  completedBookings: number
  totalRevenue: number
  activeEmployees: number
  averageJobDuration: number
}

export interface EmployeePerformance {
  employeeId: string
  employeeName: string
  totalJobs: number
  completedJobs: number
  completionRate: number
  totalRevenue: number
  averageRating: number
  hoursWorked: number
}
