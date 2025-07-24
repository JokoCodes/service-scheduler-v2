'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import type { Booking, BookingListQuery } from '@service-scheduler/shared-types'
import { splitFullName, getDisplayName, combineNames } from '@service-scheduler/shared-types'
import StaffManagement from '@/components/StaffManagement'
import StaffAvailabilityIndicator from '@/components/StaffAvailabilityIndicator'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 ring-blue-600/20'
    case 'in-progress':
      return 'bg-orange-100 text-orange-800 ring-orange-600/20'
    case 'completed':
      return 'bg-green-100 text-green-800 ring-green-600/20'
    case 'cancelled':
      return 'bg-red-100 text-red-800 ring-red-600/20'
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-600/20'
  }
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Booking>>({})
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)

  useEffect(() => {
    fetchBookings()
  }, [searchTerm, statusFilter, dateFromFilter, dateToFilter])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const query: BookingListQuery = {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        dateFrom: dateFromFilter || undefined,
        dateTo: dateToFilter || undefined,
        limit: 50
      }
      
      const data = await apiClient.getBookings(query)
      setBookings(data)
      setError(null)
    } catch (err) {
      setError('Failed to load bookings')
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      await apiClient.updateBooking(bookingId, { status: newStatus })
      await fetchBookings() // Refresh the list
    } catch (err) {
      console.error('Error updating booking status:', err)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await apiClient.deleteBooking(bookingId)
        await fetchBookings() // Refresh the list
      } catch (err) {
        console.error('Error deleting booking:', err)
      }
    }
  }

  // Action handlers for booking management
  const handleCreateBooking = () => {
    router.push('/dashboard/bookings/new')
  }

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowViewModal(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setEditFormData({
      // Use new name fields with fallbacks to legacy fields
      customerFirstName: booking.customerFirstName || splitFullName(booking.customerName || '').firstName,
      customerLastName: booking.customerLastName || splitFullName(booking.customerName || '').lastName,
      customerEmail: booking.customerEmail,
      status: booking.status,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      servicePrice: booking.servicePrice,
      staffRequired: booking.staffRequired || 1,
      staffFulfilled: booking.staffFulfilled || 0,
      serviceAddress: booking.serviceAddress
    })
    setShowEditModal(true)
  }

  const handleEditFormChange = (field: keyof Booking, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveBookingChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBooking) return

    setIsSubmittingEdit(true)
    try {
      // Prepare update data - only include changed fields
      const updateData: Partial<Booking> = {}
      
      if (editFormData.customerName !== selectedBooking.customerName) {
        updateData.customerName = editFormData.customerName
      }
      if (editFormData.customerEmail !== selectedBooking.customerEmail) {
        updateData.customerEmail = editFormData.customerEmail
      }
      if (editFormData.status !== selectedBooking.status) {
        updateData.status = editFormData.status
      }
      if (editFormData.scheduledDate !== selectedBooking.scheduledDate) {
        updateData.scheduledDate = editFormData.scheduledDate
      }
      if (editFormData.scheduledTime !== selectedBooking.scheduledTime) {
        updateData.scheduledTime = editFormData.scheduledTime
      }
      if (editFormData.servicePrice !== selectedBooking.servicePrice) {
        updateData.servicePrice = editFormData.servicePrice
      }
      if (editFormData.staffRequired !== selectedBooking.staffRequired) {
        updateData.staffRequired = editFormData.staffRequired
      }
      if (editFormData.staffFulfilled !== selectedBooking.staffFulfilled) {
        updateData.staffFulfilled = editFormData.staffFulfilled
      }
      if (editFormData.serviceAddress !== selectedBooking.serviceAddress) {
        updateData.serviceAddress = editFormData.serviceAddress
      }

      console.log('Updating booking with data:', updateData)
      
      // Call API to update booking
      await apiClient.updateBooking(selectedBooking.id, updateData)
      
      // Refresh bookings list
      await fetchBookings()
      
      // Close modal and reset form
      setShowEditModal(false)
      setEditFormData({})
      
      // Show success message (you might want to add toast notifications)
      console.log('Booking updated successfully!')
      
    } catch (error) {
      console.error('Failed to update booking:', error)
      // You might want to show an error message to the user
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage all customer bookings and appointments
                  </p>
                </div>
                <button 
                  onClick={handleCreateBooking}
                  className="btn-primary btn-md flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create New Booking
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Bookings */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Total Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Bookings */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Pending Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.filter(b => b.status === 'pending').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Bookings */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Today's Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.filter(b => 
                          new Date(b.scheduledDate).toDateString() === new Date().toDateString()
                        ).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Revenue */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">$</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${ bookings.length > 0 
                          ? bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.servicePrice, 0).toLocaleString()
                          : '0'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card mb-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customers, services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Status Filter */}
                  <div className="sm:w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Date Range */}
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFromFilter}
                      onChange={(e) => setDateFromFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={dateToFilter}
                      onChange={(e) => setDateToFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="card">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading bookings...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={fetchBookings}
                    className="mt-2 btn-secondary btn-md"
                  >
                    Try Again
                  </button>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No bookings found</p>
                  <button 
                    onClick={handleCreateBooking}
                    className="mt-2 btn-primary btn-md flex items-center mx-auto"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create First Booking
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Bookings ({bookings.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Header Row */}
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {booking.customerName}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </div>
                            
                            {/* Service Info */}
                            <div className="mb-3">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {booking.serviceName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.customerEmail}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.serviceAddress}
                              </p>
                            </div>
                            
                            {/* Details Row */}
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(booking.scheduledDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {booking.scheduledTime}
                              </div>
                              <div className="flex items-center">
                                <UserIcon className="h-4 w-4 mr-1" />
                                {booking.assignedEmployeeName || 'Unassigned'}
                              </div>
                              <div className="flex items-center">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                  {booking.serviceDuration} min
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  booking.staffFulfilled >= booking.staffRequired 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  Staff: {booking.staffFulfilled || 0}/{booking.staffRequired || 1}
                                </span>
                              </div>
                              <div className="font-semibold text-primary-600">
                                ${booking.servicePrice.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {/* Status Update */}
                            <select
                              value={booking.status}
                              onChange={(e) => handleStatusUpdate(booking.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewBooking(booking)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="View booking"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditBooking(booking)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                                title="Edit booking"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBooking(booking.id)}
                                className="p-2 text-gray-400 hover:text-red-600"
                                title="Delete booking"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Booking Modal */}
        {showViewModal && selectedBooking && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.customerEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(selectedBooking.status)}`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedBooking.scheduledDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.scheduledTime}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceDuration} minutes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedBooking.servicePrice.toFixed(2)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned Employee</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.assignedEmployeeName || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staff Required</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.staffRequired || 1}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staff Fulfilled</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.staffFulfilled || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Staffing Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedBooking.staffFulfilled >= selectedBooking.staffRequired 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedBooking.staffFulfilled >= selectedBooking.staffRequired ? 'Fully Staffed' : 'Needs Staff'}
                    </span>
                  </div>
                </div>
                
                {/* Staff Information Section */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Assigned Staff</h4>
                  <StaffManagement 
                    booking={selectedBooking} 
                    onUpdate={fetchBookings}
                    isEditable={false}
                  />
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="btn-secondary btn-md"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditBooking(selectedBooking)
                    }}
                    className="btn-primary btn-md"
                  >
                    Edit Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Booking Modal */}
        {showEditModal && selectedBooking && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Booking</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSaveBookingChanges}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                      <input
                        type="text"
                        value={editFormData.customerName || ''}
                        onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editFormData.customerEmail || ''}
                        onChange={(e) => handleEditFormChange('customerEmail', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={editFormData.status || ''}
                        onChange={(e) => handleEditFormChange('status', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={editFormData.scheduledDate || ''}
                        onChange={(e) => handleEditFormChange('scheduledDate', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        value={editFormData.scheduledTime || ''}
                        onChange={(e) => handleEditFormChange('scheduledTime', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.servicePrice || ''}
                        onChange={(e) => handleEditFormChange('servicePrice', parseFloat(e.target.value) || 0)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Staff Required</label>
                      <input
                        type="number"
                        min="1"
                        value={editFormData.staffRequired || 1}
                        onChange={(e) => handleEditFormChange('staffRequired', parseInt(e.target.value) || 1)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Staff Fulfilled</label>
                      <input
                        type="number"
                        min="0"
                        max={editFormData.staffRequired || 1}
                        value={editFormData.staffFulfilled || 0}
                        onChange={(e) => handleEditFormChange('staffFulfilled', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        value={editFormData.serviceAddress || ''}
                        onChange={(e) => handleEditFormChange('serviceAddress', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Staff Management Section */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Staff Management</h4>
                    <StaffManagement 
                      booking={selectedBooking} 
                      onUpdate={fetchBookings}
                      isEditable={true}
                    />
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="btn-secondary btn-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary btn-md"
                      disabled={isSubmittingEdit}
                    >
                      {isSubmittingEdit ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
