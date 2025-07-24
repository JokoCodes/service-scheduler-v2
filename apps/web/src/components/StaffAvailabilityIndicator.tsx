'use client'

import { useState, useEffect } from 'react'
import { 
  UserIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

interface StaffMember {
  id: string
  name: string
  role: string
  status: 'available' | 'busy' | 'offline' | 'on-break'
  currentJob?: string
  avatar?: string
}

interface StaffAvailabilityIndicatorProps {
  compact?: boolean
  showHeader?: boolean
  maxVisible?: number
  refreshInterval?: number
  onStaffClick?: (staff: StaffMember) => void
}

export default function StaffAvailabilityIndicator({ 
  compact = false, 
  showHeader = true,
  maxVisible = 5,
  refreshInterval = 30000, // 30 seconds
  onStaffClick
}: StaffAvailabilityIndicatorProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    loadStaffAvailability()
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadStaffAvailability()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const loadStaffAvailability = async () => {
    try {
      // This would be replaced with actual API call
      // const staffData = await apiClient.getStaffAvailability()
      
      // Mock data for demonstration
      const mockStaff: StaffMember[] = [
        {
          id: '1',
          name: 'John Smith',
          role: 'Lead Technician',
          status: 'available',
          avatar: '/avatars/john.jpg'
        },
        {
          id: '2',
          name: 'Sarah Johnson',
          role: 'Assistant',
          status: 'busy',
          currentJob: 'Installing HVAC system',
          avatar: '/avatars/sarah.jpg'
        },
        {
          id: '3',
          name: 'Mike Davis',
          role: 'Specialist',
          status: 'available',
          avatar: '/avatars/mike.jpg'
        },
        {
          id: '4',
          name: 'Emily Brown',
          role: 'Technician',
          status: 'on-break',
          avatar: '/avatars/emily.jpg'
        },
        {
          id: '5',
          name: 'Alex Wilson',
          role: 'Trainee',
          status: 'offline',
          avatar: '/avatars/alex.jpg'
        }
      ]
      
      setStaff(mockStaff)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load staff availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: StaffMember['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'busy':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      case 'on-break':
        return <ClockIcon className="h-4 w-4 text-blue-500" />
      case 'offline':
        return <XCircleIcon className="h-4 w-4 text-gray-400" />
      default:
        return <UserIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: StaffMember['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 ring-green-600/20'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20'
      case 'on-break':
        return 'bg-blue-100 text-blue-800 ring-blue-600/20'
      case 'offline':
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
      default:
        return 'bg-gray-100 text-gray-800 ring-gray-600/20'
    }
  }

  const getStatusText = (status: StaffMember['status']) => {
    switch (status) {
      case 'available':
        return 'Available'
      case 'busy':
        return 'Busy'
      case 'on-break':
        return 'On Break'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  const stats = {
    available: staff.filter(s => s.status === 'available').length,
    busy: staff.filter(s => s.status === 'busy').length,
    onBreak: staff.filter(s => s.status === 'on-break').length,
    offline: staff.filter(s => s.status === 'offline').length,
    total: staff.length
  }

  const visibleStaff = staff.slice(0, maxVisible)
  const hiddenCount = Math.max(0, staff.length - maxVisible)

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} text-center`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-xs text-gray-500">Loading staff...</p>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3">
        {showHeader && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Staff ({stats.available}/{stats.total})
            </h4>
            <div className="flex space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-400" title="Available"></div>
              <div className="h-2 w-2 rounded-full bg-yellow-400" title="Busy"></div>
              <div className="h-2 w-2 rounded-full bg-blue-400" title="On Break"></div>
              <div className="h-2 w-2 rounded-full bg-gray-400" title="Offline"></div>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          {visibleStaff.map((member) => (
            <div 
              key={member.id} 
              className={`flex items-center space-x-2 p-1 rounded text-xs ${
                onStaffClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onStaffClick?.(member)}
            >
              <div className="flex-shrink-0">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="h-3 w-3 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{member.name}</p>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(member.status)}
              </div>
            </div>
          ))}
          
          {hiddenCount > 0 && (
            <div className="text-center py-1">
              <span className="text-xs text-gray-500">+{hiddenCount} more</span>
            </div>
          )}
        </div>
        
        <div className="mt-2 text-xs text-gray-500 text-center">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Staff Availability
            </h3>
            <button
              onClick={loadStaffAvailability}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Refresh"
            >
              ↻ Refresh
            </button>
          </div>
          
          {/* Stats Summary */}
          <div className="mt-3 grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{stats.available}</div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{stats.busy}</div>
              <div className="text-xs text-gray-500">Busy</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{stats.onBreak}</div>
              <div className="text-xs text-gray-500">On Break</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">{stats.offline}</div>
              <div className="text-xs text-gray-500">Offline</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="space-y-3">
          {visibleStaff.map((member) => (
            <div 
              key={member.id} 
              className={`flex items-center space-x-3 p-3 rounded-lg border border-gray-100 ${
                onStaffClick ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={() => onStaffClick?.(member)}
            >
              <div className="flex-shrink-0">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusBadge(member.status)}`}>
                    {getStatusText(member.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{member.role}</p>
                {member.currentJob && (
                  <p className="text-xs text-gray-400 mt-1 italic">{member.currentJob}</p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {getStatusIcon(member.status)}
              </div>
            </div>
          ))}
          
          {hiddenCount > 0 && (
            <div className="text-center py-2">
              <button 
                className="text-sm text-primary-600 hover:text-primary-800"
                onClick={() => {/* Handle show more */}}
              >
                Show {hiddenCount} more staff members
              </button>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center border-t border-gray-100 pt-3">
          Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh: {refreshInterval / 1000}s
        </div>
      </div>
    </div>
  )
}
