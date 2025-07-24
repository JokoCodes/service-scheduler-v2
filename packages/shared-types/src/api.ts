// API request/response types for both web and mobile services

// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  meta?: {
    pagination?: PaginationMeta
    timestamp?: string
    requestId?: string
  }
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
  role?: 'admin' | 'employee'
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// Booking-related API types
export interface CreateBookingRequest {
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceAddress: string
  serviceId: string
  scheduledDate: string
  scheduledTime: string
  notes?: string
  assignedEmployeeId?: string
}

export interface UpdateBookingRequest {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  serviceAddress?: string
  serviceId?: string
  scheduledDate?: string
  scheduledTime?: string
  status?: string
  notes?: string
  assignedEmployeeId?: string
}

export interface BookingListQuery {
  page?: number
  limit?: number
  status?: string
  employeeId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// Employee-related API types
export interface CreateEmployeeRequest {
  name: string
  email: string
  phone?: string
  position?: string
  hourlyRate?: number
  skills?: string[]
}

export interface UpdateEmployeeRequest {
  name?: string
  email?: string
  phone?: string
  position?: string
  hourlyRate?: number
  isActive?: boolean
  skills?: string[]
}

export interface EmployeeListQuery {
  page?: number
  limit?: number
  isActive?: boolean
  search?: string
  skills?: string[]
}

// Mobile-specific API types
export interface MobileJobUpdateRequest {
  bookingId: string
  status: string
  notes?: string
  photos?: string[]
  location?: {
    latitude: number
    longitude: number
  }
  customerSignature?: string
}

export interface LocationUpdateRequest {
  latitude: number
  longitude: number
  isActive: boolean
}

export interface AvailabilityUpdateRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
}

// Push notification types
export interface PushNotificationRequest {
  employeeIds?: string[]
  title: string
  message: string
  data?: Record<string, any>
  priority?: 'low' | 'medium' | 'high'
}

// Dashboard and analytics API types
export interface DashboardQuery {
  dateFrom?: string
  dateTo?: string
  employeeId?: string
}

export interface AnalyticsQuery {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'
  dateFrom: string
  dateTo: string
  groupBy?: string
}

// File upload types
export interface FileUploadResponse {
  url: string
  filename: string
  originalName: string
  size: number
  mimeType: string
}

// Error response types
export interface ApiError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

// WebSocket message types for real-time features
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  userId?: string
}

export interface BookingUpdateMessage extends WebSocketMessage {
  type: 'BOOKING_UPDATE'
  data: {
    bookingId: string
    status: string
    employeeId?: string
  }
}

export interface LocationUpdateMessage extends WebSocketMessage {
  type: 'LOCATION_UPDATE'
  data: {
    employeeId: string
    latitude: number
    longitude: number
  }
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION'
  data: {
    id: string
    title: string
    message: string
    priority: string
  }
}

// Payment API types
export interface CreatePaymentIntentRequest {
  bookingId: string
  amount: number
  currency?: string
  customerEmail?: string
  savePaymentMethod?: boolean
}

export interface CreatePaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string
  paymentMethodId?: string
}

export interface PaymentStatusResponse {
  paymentId: string
  status: string
  amount: number
  paidAt?: string
  failureReason?: string
}

export interface RefundPaymentRequest {
  paymentId: string
  amount?: number // Partial refund if specified
  reason?: string
}

export interface RefundPaymentResponse {
  refundId: string
  amount: number
  status: string
  expectedAvailability?: string
}

export interface PaymentListQuery {
  page?: number
  limit?: number
  status?: string
  bookingId?: string
  customerEmail?: string
  dateFrom?: string
  dateTo?: string
}
