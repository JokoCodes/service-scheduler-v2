import type { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse,
  Booking,
  BookingListQuery,
  CreateBookingRequest,
  UpdateBookingRequest,
  Employee,
  Customer,
  Service,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  PaymentStatusResponse
} from '@service-scheduler/shared-types'

const API_BASE_URL = process.env.NEXT_PUBLIC_WEB_API_URL || 'http://localhost:3001'

// API Client Class
class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.token = this.getStoredToken()
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  private removeToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('token_expires_at')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuthRetry = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add authentication header if token exists
    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      
      // Handle 401 Unauthorized - try to refresh token once
      if (response.status === 401 && !skipAuthRetry && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
        console.warn('401 response, attempting token refresh...')
        const refreshResult = await this.refreshToken()
        if (refreshResult) {
          // Retry the original request with new token
          return this.request<T>(endpoint, options, true)
        } else {
          // Refresh failed, user needs to login again
          this.removeToken()
          throw new Error('Session expired. Please login again.')
        }
      }
      
      const data = await response.json()

      if (!response.ok) {
        // Handle different error types
        if (response.status === 403) {
          throw new Error(data.message || 'Access denied')
        }
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      this.setToken(response.data.token)
      
      // Store user info and refresh token
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
    }

    return response.data!
  }

  async refreshToken(): Promise<LoginResponse | null> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token')
      : null

    if (!refreshToken) {
      this.removeToken()
      return null
    }

    try {
      const response = await this.request<LoginResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      })

      if (response.success && response.data) {
        this.setToken(response.data.token)
        if (typeof window !== 'undefined') {
          localStorage.setItem('refresh_token', response.data.refreshToken)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
        return response.data
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.removeToken()
    }

    return null
  }

  logout() {
    this.removeToken()
  }

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  }

  isAuthenticated(): boolean {
    return !!this.token
  }

  // Bookings API
  async getBookings(query?: BookingListQuery): Promise<Booking[]> {
    const searchParams = new URLSearchParams()
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/bookings${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    const response = await this.request<Booking[]>(endpoint)
    
    return response.data || []
  }

  async getBooking(id: string): Promise<Booking> {
    const response = await this.request<Booking>(`/api/bookings/${id}`)
    return response.data!
  }

  async createBooking(booking: CreateBookingRequest): Promise<Booking> {
    console.log('📡 API Client: Starting createBooking request')
    console.log('🎯 Endpoint: /api/bookings')
    console.log('📋 Payload:', {
      ...booking,
      customerEmail: booking.customerEmail?.substring(0, 3) + '***' // Hide email for security
    })
    console.log('🔑 Auth token present:', !!this.token)
    console.log('🔗 Base URL:', this.baseUrl)
    
    try {
      const response = await this.request<Booking>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(booking),
      })
      
      console.log('✅ API Client: Booking created successfully')
      console.log('📦 Response:', response)
      
      return response.data!
    } catch (error: any) {
      console.error('❌ API Client: createBooking failed')
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        stack: error.stack
      })
      throw error
    }
  }

  async updateBooking(id: string, booking: UpdateBookingRequest): Promise<Booking> {
    const response = await this.request<Booking>(`/api/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(booking),
    })
    return response.data!
  }

  async deleteBooking(id: string): Promise<void> {
    await this.request(`/api/bookings/${id}`, {
      method: 'DELETE',
    })
  }

  // Employees API
  async getEmployees(): Promise<Employee[]> {
    const response = await this.request<Employee[]>('/api/employees')
    return response.data || []
  }

  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const response = await this.request<Employee>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    })
    return response.data!
  }

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const response = await this.request<Employee>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    })
    return response.data!
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.request(`/api/employees/${id}`, {
      method: 'DELETE',
    })
  }

  // Customers API
  async getCustomers(): Promise<Customer[]> {
    const response = await this.request<Customer[]>('/api/customers')
    return response.data || []
  }

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    const response = await this.request<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    })
    return response.data!
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const response = await this.request<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    })
    return response.data!
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.request(`/api/customers/${id}`, {
      method: 'DELETE',
    })
  }

  // Services API
  async getServices(): Promise<Service[]> {
    const response = await this.request<Service[]>('/api/services')
    return response.data || []
  }

  async createService(service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const response = await this.request<Service>('/api/services', {
      method: 'POST',
      body: JSON.stringify(service),
    })
    return response.data!
  }

  async updateService(id: string, service: Partial<Service>): Promise<Service> {
    const response = await this.request<Service>(`/api/services?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    })
    return response.data!
  }

  async deleteService(id: string): Promise<void> {
    await this.request(`/api/services?id=${id}`, {
      method: 'DELETE',
    })
  }

  // Dashboard API (placeholder)
  async getDashboardStats(): Promise<any> {
    const response = await this.request<any>('/api/dashboard')
    return response.data || {}
  }

  // Payments API
  async createPaymentIntent(request: CreatePaymentIntentRequest): Promise<CreatePaymentIntentResponse> {
    const response = await this.request<CreatePaymentIntentResponse>('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(request),
    })
    return response.data!
  }

  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResponse> {
    const response = await this.request<PaymentStatusResponse>(`/api/payments/status/${bookingId}`)
    return response.data!
  }

  async getPayments(): Promise<any[]> {
    const response = await this.request<any[]>('/api/payments')
    return response.data || []
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export types and utilities
export type { ApiResponse, LoginRequest, LoginResponse, Booking, Employee, Customer, Service }
