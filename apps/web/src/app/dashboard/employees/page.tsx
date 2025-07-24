'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import type { Employee } from '@service-scheduler/shared-types'
import {
  Squares2X2Icon,
  ListBulletIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import AddEmployeeModal from '@/components/AddEmployeeModal'

type ViewMode = 'grid' | 'list'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.getEmployees()
      
      console.log('Frontend: Raw API response:', data)
      console.log('Frontend: Number of employees received:', data?.length || 0)
      console.log('Frontend: First employee (if any):', data?.[0])
      
      setEmployees(data)
      
      // Auto-default to list view if more than 20 employees
      if (data.length > 20) {
        setViewMode('list')
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err)
      setError('Failed to load employees. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle creating a new employee
  const handleCreateEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      const newEmployee = await apiClient.createEmployee(employeeData)
      setEmployees(prev => [...prev, newEmployee])
      setIsAddModalOpen(false)
      
      // Show success message (you could add toast notifications here)
      console.log('Employee created successfully:', newEmployee)
    } catch (error) {
      console.error('Failed to create employee:', error)
      // You could show an error toast here
      throw error // Re-throw to let the modal handle the error state
    }
  }

  // Calculate summary statistics
  const stats = {
    total: employees.length,
    active: employees.filter(emp => emp.isActive).length,
    inactive: employees.filter(emp => emp.isActive === false).length,
    averageRate: employees.length > 0 
      ? employees.filter(emp => emp.hourlyRate).reduce((sum, emp) => sum + (emp.hourlyRate || 0), 0) / employees.filter(emp => emp.hourlyRate).length
      : 0
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Inactive
      </span>
    )
  }

  const getRoleBadge = (role?: string) => {
    const roleStyles = {
      admin: 'bg-purple-100 text-purple-800',
      employee: 'bg-blue-100 text-blue-800',
      technician: 'bg-gray-100 text-gray-800',
    }
    
    const displayRole = role || 'employee'
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[displayRole as keyof typeof roleStyles] || roleStyles.employee}`}>
        {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
      </span>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    onClick={fetchEmployees}
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage your team members, their roles, and availability.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Employee
          </button>

          <AddEmployeeModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleCreateEmployee}
          />
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Employees</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inactive}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg. Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.averageRate > 0 ? `$${stats.averageRate.toFixed(0)}/hr` : 'N/A'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first team member.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Employee
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">View as:</span>
                <div className="flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={clsx(
                      'px-3 py-2 text-xs font-medium rounded-l-md border focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      'px-3 py-2 text-xs font-medium rounded-r-md border border-l-0 focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                      viewMode === 'list'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
                {employees.length > 20 && ' (Auto-switched to list view)'}
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-6">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {employee.avatar ? (
                            <img className="h-12 w-12 rounded-full" src={employee.avatar} alt={employee.name} />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {employee.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {employee.position || 'Employee'}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(employee.isActive)}
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="truncate">{employee.email}</span>
                        </div>
                        {employee.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <span>{employee.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getRoleBadge(employee.role)}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.hourlyRate ? `$${employee.hourlyRate}/hr` : 'Rate not set'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-gray-500">
                            ⭐ No ratings
                          </div>
                          <div className="text-sm text-gray-500">
                            0 jobs completed
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 bg-indigo-50 text-indigo-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-indigo-100 transition-colors">
                          Edit
                        </button>
                        <button className="flex-1 bg-red-50 text-red-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-red-100 transition-colors">
                          {employee.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jobs
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {employee.avatar ? (
                                  <img className="h-10 w-10 rounded-full" src={employee.avatar} alt={employee.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {employee.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {employee.position || 'Employee'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{employee.email}</div>
                            {employee.phone && (
                              <div className="text-sm text-gray-500">{employee.phone}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getRoleBadge(employee.role)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {employee.hourlyRate ? `$${employee.hourlyRate}/hr` : 'Not set'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="text-yellow-400 mr-1">⭐</span>
                              No rating
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            0
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(employee.isActive)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-4">
                              Edit
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              {employee.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        {renderContent()}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
