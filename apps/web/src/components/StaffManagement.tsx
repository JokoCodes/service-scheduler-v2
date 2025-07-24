'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { Employee, Booking } from '@service-scheduler/shared-types'
import { getDisplayName } from '@service-scheduler/shared-types'
import { 
  UserIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

// Staff Assignment Types
export interface StaffAssignment {
  id: string
  bookingId: string
  employeeId: string
  employeeName: string
  role: StaffRole
  status: AssignmentStatus
  assignedAt: string
  acceptedAt?: string
  completedAt?: string
  notes?: string
}

export type StaffRole = 'lead' | 'assistant' | 'specialist' | 'trainee'
export type AssignmentStatus = 'assigned' | 'accepted' | 'declined' | 'completed' | 'cancelled'

interface StaffManagementProps {
  booking: Booking
  onUpdate?: () => void
  isEditable?: boolean
}

export default function StaffManagement({ booking, onUpdate, isEditable = true }: StaffManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddStaff, setShowAddStaff] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedRole, setSelectedRole] = useState<StaffRole>('assistant')
  const [assignmentNotes, setAssignmentNotes] = useState('')

  useEffect(() => {
    loadStaffData()
  }, [booking.id])

  const loadStaffData = async () => {
    try {
      setLoading(true)
      const [employeesData, assignmentsData] = await Promise.all([
        apiClient.getEmployees(),
        // This would be a new API endpoint for staff assignments
        loadStaffAssignments(booking.id)
      ])
      
      setEmployees(employeesData.filter(e => e.isActive))
      setStaffAssignments(assignmentsData)
    } catch (error) {
      console.error('Failed to load staff data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Mock function - would be replaced with actual API call
  const loadStaffAssignments = async (bookingId: string): Promise<StaffAssignment[]> => {
    // This would make an API call to get staff assignments for the booking
    // For now, return mock data if there's an assigned employee
    if (booking.assignedEmployeeId && booking.assignedEmployeeName) {
      return [{
        id: 'mock-1',
        bookingId,
        employeeId: booking.assignedEmployeeId,
        employeeName: booking.assignedEmployeeName,
        role: 'lead',
        status: 'assigned',
        assignedAt: new Date().toISOString()
      }]
    }
    return []
  }

  const handleAddStaffAssignment = async () => {
    if (!selectedEmployee || !selectedRole) return

    try {
      const selectedEmp = employees.find(e => e.id === selectedEmployee)
      if (!selectedEmp) return

      const newAssignment: StaffAssignment = {
        id: `temp-${Date.now()}`, // Temporary ID, would be replaced by backend
        bookingId: booking.id,
        employeeId: selectedEmployee,
        employeeName: getDisplayName({
          firstName: selectedEmp.firstName,
          lastName: selectedEmp.lastName,
          name: selectedEmp.name,
          email: selectedEmp.email
        }),
        role: selectedRole,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
        notes: assignmentNotes
      }

      // This would be an API call
      // await apiClient.createStaffAssignment(newAssignment)
      
      setStaffAssignments(prev => [...prev, newAssignment])
      setShowAddStaff(false)
      setSelectedEmployee('')
      setSelectedRole('assistant')
      setAssignmentNotes('')
      onUpdate?.()
    } catch (error) {
      console.error('Failed to add staff assignment:', error)
    }
  }

  const handleUpdateAssignmentStatus = async (assignmentId: string, status: AssignmentStatus) => {
    try {
      // This would be an API call
      // await apiClient.updateStaffAssignment(assignmentId, { status })
      
      setStaffAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { 
                ...assignment, 
                status,
                ...(status === 'accepted' && { acceptedAt: new Date().toISOString() }),
                ...(status === 'completed' && { completedAt: new Date().toISOString() })
              }
            : assignment
        )
      )
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update assignment status:', error)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!window.confirm('Are you sure you want to remove this staff assignment?')) return

    try {
      // This would be an API call
      // await apiClient.deleteStaffAssignment(assignmentId)
      
      setStaffAssignments(prev => prev.filter(a => a.id !== assignmentId))
      onUpdate?.()
    } catch (error) {
      console.error('Failed to remove staff assignment:', error)
    }
  }

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      case 'accepted':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20'
      case 'declined':
        return 'bg-red-100 text-red-800 ring-red-600/20'
      case 'completed':
        return 'bg-green-100 text-green-800 ring-green-600/20'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
    }
  }

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'lead':
        return 'bg-purple-100 text-purple-800 ring-purple-600/20'
      case 'assistant':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20'
      case 'specialist':
        return 'bg-green-100 text-green-800 ring-green-600/20'
      case 'trainee':
        return 'bg-orange-100 text-orange-800 ring-orange-600/20'
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
    }
  }

  const activeAssignments = staffAssignments.filter(a => a.status !== 'declined' && a.status !== 'cancelled')
  const staffingProgress = {
    required: booking.staffRequired || 1,
    assigned: activeAssignments.length,
    accepted: activeAssignments.filter(a => a.status === 'accepted').length,
    completed: activeAssignments.filter(a => a.status === 'completed').length
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading staff information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Staffing Overview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <UserIcon className="h-4 w-4 mr-2" />
            Staff Management
          </h4>
          {isEditable && (
            <button
              type="button"
              onClick={() => setShowAddStaff(true)}
              className="btn-primary btn-sm flex items-center"
              disabled={activeAssignments.length >= staffingProgress.required}
            >
              <UserPlusIcon className="h-4 w-4 mr-1" />
              Add Staff
            </button>
          )}
        </div>

        {/* Staffing Progress */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{staffingProgress.required}</div>
            <div className="text-xs text-gray-500">Required</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{staffingProgress.assigned}</div>
            <div className="text-xs text-gray-500">Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{staffingProgress.accepted}</div>
            <div className="text-xs text-gray-500">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{staffingProgress.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((staffingProgress.accepted / staffingProgress.required) * 100, 100)}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-center text-gray-500">
          {staffingProgress.accepted} of {staffingProgress.required} staff accepted
        </div>

        {/* Status Indicator */}
        {staffingProgress.accepted >= staffingProgress.required ? (
          <div className="mt-3 flex items-center text-green-600 text-sm">
            <CheckIcon className="h-4 w-4 mr-1" />
            Fully staffed
          </div>
        ) : staffingProgress.assigned >= staffingProgress.required ? (
          <div className="mt-3 flex items-center text-yellow-600 text-sm">
            <ClockIcon className="h-4 w-4 mr-1" />
            Awaiting staff acceptance
          </div>
        ) : (
          <div className="mt-3 flex items-center text-red-600 text-sm">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Needs more staff
          </div>
        )}
      </div>

      {/* Staff Assignments List */}
      {staffAssignments.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-gray-900">Staff Assignments</h5>
          {staffAssignments.map((assignment) => (
            <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h6 className="font-medium text-gray-900">{assignment.employeeName}</h6>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getRoleBadge(assignment.role)}`}>
                      {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(assignment.status)}`}>
                      {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Assigned: {new Date(assignment.assignedAt).toLocaleString()}</div>
                    {assignment.acceptedAt && (
                      <div>Accepted: {new Date(assignment.acceptedAt).toLocaleString()}</div>
                    )}
                    {assignment.completedAt && (
                      <div>Completed: {new Date(assignment.completedAt).toLocaleString()}</div>
                    )}
                    {assignment.notes && (
                      <div className="italic">Notes: {assignment.notes}</div>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <div className="flex items-center space-x-2">
                    {assignment.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleUpdateAssignmentStatus(assignment.id, 'accepted')}
                          className="p-1 text-green-600 hover:text-green-800"
                          title="Mark as accepted"
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateAssignmentStatus(assignment.id, 'declined')}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Mark as declined"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {assignment.status === 'accepted' && (
                      <button
                        onClick={() => handleUpdateAssignmentStatus(assignment.id, 'completed')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Mark as completed"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveAssignment(assignment.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Remove assignment"
                    >
                      <UserMinusIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add Staff Assignment</h3>
                <button
                  onClick={() => setShowAddStaff(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                handleAddStaffAssignment()
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Employee *
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Choose an employee...</option>
                    {employees
                      .filter(emp => !activeAssignments.some(a => a.employeeId === emp.id))
                      .map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position || 'Employee'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="lead">Lead Technician</option>
                    <option value="assistant">Assistant</option>
                    <option value="specialist">Specialist</option>
                    <option value="trainee">Trainee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any special instructions or notes for this assignment..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary btn-md"
                    disabled={!selectedEmployee || !selectedRole}
                  >
                    Add Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {staffAssignments.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <InformationCircleIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No staff assigned to this booking yet.</p>
          {isEditable && (
            <p className="text-xs mt-1">Click "Add Staff" to assign employees to this booking.</p>
          )}
        </div>
      )}
    </div>
  )
}
