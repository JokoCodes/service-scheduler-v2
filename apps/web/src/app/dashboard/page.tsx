'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import StaffAvailabilityIndicator from '@/components/StaffAvailabilityIndicator'
import { apiClient } from '@/lib/api'

interface Stat {
  name: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
}

interface RecentBooking {
  id: string
  customer: string
  service: string
  date: string
  status: string
}

interface DashboardData {
  stats: Stat[]
  recentBookings: RecentBooking[]
  summary: {
    totalBookings: number
    activeEmployees: number
    totalCustomers: number
    totalServices: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    totalRevenue: number
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'badge-warning'
    case 'confirmed':
      return 'badge-primary'
    case 'in-progress':
      return 'badge-warning'
    case 'completed':
      return 'badge-success'
    default:
      return 'badge-gray'
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if user is authenticated first
      if (!apiClient.isAuthenticated()) {
        setError('No authentication token found')
        return
      }

      // Use apiClient which handles token automatically
      const data = await apiClient.getDashboardStats()
      setDashboardData(data)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Quick action handlers
  const handleCreateBooking = () => {
    router.push('/dashboard/bookings/new')
  }

  const handleAddCustomer = () => {
    router.push('/dashboard/customers/new')
  }

  const handleScheduleEmployee = () => {
    router.push('/dashboard/employees')
  }

  // Loading state
  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Overview of your service business
                </p>
              </div>
              
              {/* Loading skeleton */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading dashboard data...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // Error state
  if (error) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Overview of your service business
                </p>
              </div>
              
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading dashboard</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <button 
                  onClick={fetchDashboardData}
                  className="btn-primary btn-md"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  // No data state (should not happen if API works correctly)
  if (!dashboardData) {
    return (
      <ProtectedRoute requireAdmin>
        <DashboardLayout>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Overview of your service business
                </p>
              </div>
              
              <div className="text-center py-12">
                <p className="text-gray-500">No dashboard data available.</p>
                <button 
                  onClick={fetchDashboardData}
                  className="btn-primary btn-md mt-4"
                >
                  Refresh
                </button>
              </div>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Overview of your service business
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {dashboardData.stats.map((stat) => (
                <div key={stat.name} className="card p-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stat.changeType === 'increase' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Bookings */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {dashboardData.recentBookings.length > 0 ? (
                    dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{booking.customer}</p>
                            <p className="text-sm text-gray-500">{booking.service}</p>
                            <p className="text-xs text-gray-400">{booking.date}</p>
                          </div>
                          <span className={`badge ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <p>No recent bookings found</p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-3 border-t border-gray-200">
                  <a href="/dashboard/bookings" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    View all bookings →
                  </a>
                </div>
              </div>

              {/* Staff Availability */}
              <div className="lg:row-span-1">
                <StaffAvailabilityIndicator 
                  compact={false}
                  showHeader={true}
                  maxVisible={4}
                  refreshInterval={30000}
                  onStaffClick={(staff) => {
                    console.log('Staff clicked:', staff)
                    // Could navigate to staff details or show quick actions
                  }}
                />
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6 space-y-4">
                  <button 
                    onClick={handleCreateBooking}
                    className="btn-primary btn-md w-full hover:bg-primary-700 transition-colors"
                  >
                    Create New Booking
                  </button>
                  <button 
                    onClick={handleAddCustomer}
                    className="btn-secondary btn-md w-full hover:bg-gray-100 transition-colors"
                  >
                    Add New Customer
                  </button>
                  <button 
                    onClick={handleScheduleEmployee}
                    className="btn-secondary btn-md w-full hover:bg-gray-100 transition-colors"
                  >
                    Schedule Employee
                  </button>
                </div>
              </div>
            </div>

            {/* Business Summary */}
            <div className="mt-8">
              <div className="card">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Business Summary</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{dashboardData.summary.totalCustomers}</p>
                      <p className="text-sm text-gray-500">Total Customers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">{dashboardData.summary.totalServices}</p>
                      <p className="text-sm text-gray-500">Active Services</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success-600">${dashboardData.summary.thisMonthRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">This Month</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-600">${dashboardData.summary.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
