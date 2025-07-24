'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutForm } from '@/components/CheckoutForm'
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CreditCardIcon 
} from '@heroicons/react/24/outline'
import type { 
  Service, 
  Employee,
  CreateBookingRequest,
  PaymentIntentRequest,
  CreatePaymentIntentResponse 
} from '@service-scheduler/shared-types'

// Initialize Stripe (you'll need to set up your public key)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

interface FormData {
  // Customer Information
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  
  // Service Information
  serviceId: string
  scheduledDate: string
  scheduledTime: string
  notes: string
  
  // Employee Assignment
  assignedEmployeeId: string
  
  // Staff Management
  staffRequired: number
  staffFulfilled: number
  
  // Payment
  requiresPayment: boolean
  paymentType: 'full' | 'deposit' | 'none'
  depositPercentage: number
}

interface FormErrors {
  [key: string]: string
}

export default function NewBookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<CreatePaymentIntentResponse | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    serviceId: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
    assignedEmployeeId: '',
    staffRequired: 1,
    staffFulfilled: 0,
    requiresPayment: true,
    paymentType: 'full',
    depositPercentage: 20
  })

  const [errors, setErrors] = useState<FormErrors>({})

  // Load services and employees on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [servicesData, employeesData] = await Promise.all([
          apiClient.getServices(),
          apiClient.getEmployees()
        ])
        setServices(servicesData.filter(s => s.isActive))
        setEmployees(employeesData.filter(e => e.isActive))
      } catch (error) {
        console.error('Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  // Update selected service when serviceId changes
  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find(s => s.id === formData.serviceId)
      setSelectedService(service || null)
    } else {
      setSelectedService(null)
    }
  }, [formData.serviceId, services])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Customer validation
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required'
    if (!formData.customerEmail.trim()) newErrors.customerEmail = 'Customer email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) newErrors.customerEmail = 'Please enter a valid email'
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required'
    if (!formData.customerAddress.trim()) newErrors.customerAddress = 'Service address is required'

    // Service validation
    if (!formData.serviceId) newErrors.serviceId = 'Please select a service'
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Please select a date'
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Please select a time'

    // Check if date is in the past
    if (formData.scheduledDate) {
      const selectedDate = new Date(formData.scheduledDate + 'T' + formData.scheduledTime)
      const now = new Date()
      if (selectedDate <= now) {
        newErrors.scheduledDate = 'Please select a future date and time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateAmount = (): number => {
    if (!selectedService) return 0
    
    if (formData.paymentType === 'deposit') {
      return selectedService.price * (formData.depositPercentage / 100)
    }
    
    return selectedService.price
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🚀 Form submitted - starting booking creation process')
    
    if (!validateForm()) {
      console.log('❌ Form validation failed')
      return
    }

    console.log('✅ Form validation passed')
    setLoading(true)
    
    try {
      // First create the booking
      const bookingData: CreateBookingRequest = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        serviceAddress: formData.customerAddress,
        serviceId: formData.serviceId,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        notes: formData.notes,
        assignedEmployeeId: formData.assignedEmployeeId || undefined
      }

      console.log('📋 Booking data prepared:', {
        ...bookingData,
        customerEmail: bookingData.customerEmail?.substring(0, 3) + '***' // Partially hide email for security
      })
      
      console.log('🔐 API Client auth status:', {
        isAuthenticated: apiClient.isAuthenticated(),
        hasToken: !!apiClient.getCurrentUser()
      })
      
      console.log('📡 Calling apiClient.createBooking...')
      const booking = await apiClient.createBooking(bookingData)
      console.log('✅ Booking created successfully:', booking)
      
      // If payment is required, create payment intent
      if (formData.requiresPayment && selectedService) {
        const paymentData: PaymentIntentRequest = {
          bookingId: booking.id,
          amount: calculateAmount(), // Amount in dollars, backend will convert to cents
          customerEmail: formData.customerEmail,
          savePaymentMethod: true
        }

        const intent = await apiClient.createPaymentIntent(paymentData)
        setPaymentIntent(intent)
        setShowPaymentSection(true)
      } else {
        // No payment required, redirect to bookings list
        router.push('/dashboard/bookings?success=true')
      }
      
    } catch (error: any) {
      console.error('Failed to create booking:', error)
      setErrors({ submit: error.message || 'Failed to create booking. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push('/dashboard/bookings?success=true&payment=completed')
  }

  const handlePaymentError = (error: string) => {
    setErrors({ payment: error })
  }

  // Generate time slots (8 AM to 6 PM, 30-minute intervals)
  const timeSlots = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8
    const minute = i % 2 === 0 ? '00' : '30'
    const displayHour = hour > 12 ? hour - 12 : hour
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHourStr = displayHour === 0 ? '12' : displayHour.toString()
    
    return {
      value: `${hour.toString().padStart(2, '0')}:${minute}`,
      label: `${displayHourStr}:${minute} ${period}`
    }
  })

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  if (showPaymentSection && paymentIntent) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <button
                  onClick={() => setShowPaymentSection(false)}
                  className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Booking Details
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Payment Information</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Complete payment to confirm your booking
                </p>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent.clientSecret }}>
                <CheckoutForm
                  clientSecret={paymentIntent.clientSecret}
                  amount={paymentIntent.amount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  loading={loading}
                />
              </Elements>

              {errors.payment && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.payment}</p>
                </div>
              )}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Create New Booking</h1>
              <p className="mt-1 text-sm text-gray-600">
                Add a new service booking for a customer
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Customer Information Section */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      className={`input ${errors.customerName ? 'border-red-300' : ''}`}
                      placeholder="Enter customer's full name"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      className={`input ${errors.customerEmail ? 'border-red-300' : ''}`}
                      placeholder="customer@example.com"
                    />
                    {errors.customerEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      className={`input ${errors.customerPhone ? 'border-red-300' : ''}`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.customerPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinIcon className="h-4 w-4 inline mr-1" />
                      Service Address *
                    </label>
                    <input
                      type="text"
                      name="customerAddress"
                      value={formData.customerAddress}
                      onChange={handleInputChange}
                      className={`input ${errors.customerAddress ? 'border-red-300' : ''}`}
                      placeholder="Full address where service will be performed"
                    />
                    {errors.customerAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerAddress}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Information Section */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      name="serviceId"
                      value={formData.serviceId}
                      onChange={handleInputChange}
                      className={`input ${errors.serviceId ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select a service...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration} min)
                        </option>
                      ))}
                    </select>
                    {errors.serviceId && (
                      <p className="mt-1 text-sm text-red-600">{errors.serviceId}</p>
                    )}
                    
                    {selectedService && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>{selectedService.name}</strong> - ${selectedService.price}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          {selectedService.description}
                        </p>
                        <p className="text-xs text-blue-600">
                          Duration: {selectedService.duration} minutes
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarIcon className="h-4 w-4 inline mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      min={today}
                      className={`input ${errors.scheduledDate ? 'border-red-300' : ''}`}
                    />
                    {errors.scheduledDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <ClockIcon className="h-4 w-4 inline mr-1" />
                      Time *
                    </label>
                    <select
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      className={`input ${errors.scheduledTime ? 'border-red-300' : ''}`}
                    >
                      <option value="">Select time...</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                    {errors.scheduledTime && (
                      <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Employee (Optional)
                    </label>
                    <select
                      name="assignedEmployeeId"
                      value={formData.assignedEmployeeId}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Auto-assign later</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position || 'Employee'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Required
                    </label>
                    <input
                      type="number"
                      name="staffRequired"
                      value={formData.staffRequired}
                      onChange={handleInputChange}
                      min="1"
                      className="input"
                      placeholder="Number of staff members needed"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      How many staff members are needed for this service?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Fulfilled
                    </label>
                    <input
                      type="number"
                      name="staffFulfilled"
                      value={formData.staffFulfilled}
                      onChange={handleInputChange}
                      min="0"
                      max={formData.staffRequired}
                      className="input"
                      placeholder="Number of staff members assigned"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      How many staff members have been assigned so far?
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="input"
                      placeholder="Any special instructions or requirements..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-lg font-medium text-gray-900">Payment Options</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.requiresPayment}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiresPayment: e.target.checked }))}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require payment for this booking</span>
                    </label>
                  </div>

                  {formData.requiresPayment && selectedService && (
                    <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentType"
                            value="full"
                            checked={formData.paymentType === 'full'}
                            onChange={handleInputChange}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Full Payment (${selectedService.price})
                          </span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="paymentType"
                            value="deposit"
                            checked={formData.paymentType === 'deposit'}
                            onChange={handleInputChange}
                            className="text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Deposit Only</span>
                        </label>

                        {formData.paymentType === 'deposit' && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              name="depositPercentage"
                              value={formData.depositPercentage}
                              onChange={handleInputChange}
                              min="1"
                              max="100"
                              className="w-16 input text-sm"
                            />
                            <span className="text-sm text-gray-700">
                              % (${(selectedService.price * formData.depositPercentage / 100).toFixed(2)})
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">
                          <strong>Amount to collect now:</strong> ${calculateAmount().toFixed(2)}
                        </p>
                        {formData.paymentType === 'deposit' && (
                          <p className="text-xs text-gray-500 mt-1">
                            Remaining balance: ${(selectedService.price - calculateAmount()).toFixed(2)} 
                            (to be collected after service completion)
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary btn-md"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    formData.requiresPayment ? 'Create Booking & Proceed to Payment' : 'Create Booking'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

