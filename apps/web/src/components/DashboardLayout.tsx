'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  UsersIcon, 
  UserGroupIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  BellIcon,
  BanknotesIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  UsersIcon as UsersIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  CogIcon as CogIconSolid,
  WrenchScrewdriverIcon as WrenchScrewdriverIconSolid,
  GlobeAltIcon as GlobeAltIconSolid
} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: 'service' | 'customer' | 'booking' | 'employee' | 'navigation'
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: HomeIcon, 
    activeIcon: HomeIconSolid 
  },
  { 
    name: 'Bookings', 
    href: '/dashboard/bookings', 
    icon: CalendarDaysIcon, 
    activeIcon: CalendarDaysIconSolid 
  },
  { 
    name: 'Services', 
    href: '/dashboard/services', 
    icon: WrenchScrewdriverIcon, 
    activeIcon: WrenchScrewdriverIconSolid 
  },
  { 
    name: 'Customers', 
    href: '/dashboard/customers', 
    icon: UsersIcon, 
    activeIcon: UsersIconSolid 
  },
  { 
    name: 'Employees', 
    href: '/dashboard/employees', 
    icon: UserGroupIcon, 
    activeIcon: UserGroupIconSolid 
  },
  { 
    name: 'Payments', 
    href: '/dashboard/payments', 
    icon: CurrencyDollarIcon, 
    activeIcon: CurrencyDollarIcon 
  },
  { 
    name: 'Payroll', 
    href: '/dashboard/payroll', 
    icon: BanknotesIcon, 
    activeIcon: BanknotesIcon 
  },
  { 
    name: 'Booking Portal', 
    href: '/dashboard/booking-portal', 
    icon: GlobeAltIcon, 
    activeIcon: GlobeAltIconSolid 
  },
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: CogIcon, 
    activeIcon: CogIconSolid 
  },
]

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Mock searchable data - replace with real API calls
  const mockSearchData: SearchResult[] = [
    // Services
    { id: '1', title: 'Deep Cleaning', subtitle: 'Professional deep cleaning service', type: 'service', href: '/dashboard/services?search=Deep%20Cleaning', icon: WrenchScrewdriverIcon },
    { id: '2', title: 'House Cleaning', subtitle: 'Standard house cleaning service', type: 'service', href: '/dashboard/services?search=House%20Cleaning', icon: WrenchScrewdriverIcon },
    { id: '3', title: 'Office Cleaning', subtitle: 'Commercial office cleaning', type: 'service', href: '/dashboard/services?search=Office%20Cleaning', icon: WrenchScrewdriverIcon },
    { id: '4', title: 'Window Cleaning', subtitle: 'Professional window cleaning', type: 'service', href: '/dashboard/services?search=Window%20Cleaning', icon: WrenchScrewdriverIcon },
    { id: '5', title: 'Carpet Cleaning', subtitle: 'Specialized carpet cleaning service', type: 'service', href: '/dashboard/services?search=Carpet%20Cleaning', icon: WrenchScrewdriverIcon },
    
    // Customers
    { id: '6', title: 'John Smith', subtitle: 'john.smith@email.com', type: 'customer', href: '/dashboard/customers?search=John%20Smith', icon: UsersIcon },
    { id: '7', title: 'Emily Davis', subtitle: 'emily.davis@email.com', type: 'customer', href: '/dashboard/customers?search=Emily%20Davis', icon: UsersIcon },
    { id: '8', title: 'Jane Doe', subtitle: 'jane.doe@example.com', type: 'customer', href: '/dashboard/customers?search=Jane%20Doe', icon: UsersIcon },
    
    // Employees
    { id: '9', title: 'Sarah Johnson', subtitle: 'Senior Cleaner', type: 'employee', href: '/dashboard/employees?search=Sarah%20Johnson', icon: UserGroupIcon },
    { id: '10', title: 'Mike Wilson', subtitle: 'Cleaner', type: 'employee', href: '/dashboard/employees?search=Mike%20Wilson', icon: UserGroupIcon },
    
    // Navigation
    { id: '11', title: 'Dashboard', subtitle: 'Go to main dashboard', type: 'navigation', href: '/dashboard', icon: HomeIcon },
    { id: '12', title: 'Bookings', subtitle: 'Manage all bookings', type: 'navigation', href: '/dashboard/bookings', icon: CalendarDaysIcon },
    { id: '13', title: 'Services', subtitle: 'Manage services', type: 'navigation', href: '/dashboard/services', icon: WrenchScrewdriverIcon },
    { id: '14', title: 'Customers', subtitle: 'Manage customers', type: 'navigation', href: '/dashboard/customers', icon: UsersIcon },
    { id: '15', title: 'Employees', subtitle: 'Manage employees', type: 'navigation', href: '/dashboard/employees', icon: UserGroupIcon },
    { id: '16', title: 'Settings', subtitle: 'Application settings', type: 'navigation', href: '/dashboard/settings', icon: CogIcon },
    
    // Bookings (examples)
    { id: '17', title: 'Booking #1001', subtitle: 'John Smith - House Cleaning - Jan 15', type: 'booking', href: '/dashboard/bookings?search=1001', icon: CalendarDaysIcon },
    { id: '18', title: 'Booking #1002', subtitle: 'Emily Davis - Deep Cleaning - Jan 16', type: 'booking', href: '/dashboard/bookings?search=1002', icon: CalendarDaysIcon },
  ]

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setSearchResults([])
        setShowSearchResults(false)
        return
      }

      // Perform search
      const query = searchQuery.toLowerCase().trim()
      const filtered = mockSearchData.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      )

      // Sort results by relevance
      const sorted = filtered.sort((a, b) => {
        const aTitle = a.title.toLowerCase()
        const bTitle = b.title.toLowerCase()
        
        // Exact matches first
        if (aTitle === query && bTitle !== query) return -1
        if (bTitle === query && aTitle !== query) return 1
        
        // Title starts with query
        if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1
        if (bTitle.startsWith(query) && !aTitle.startsWith(query)) return 1
        
        // Services and navigation items get priority
        const priorityTypes = ['service', 'navigation']
        const aPriority = priorityTypes.includes(a.type)
        const bPriority = priorityTypes.includes(b.type)
        
        if (aPriority && !bPriority) return -1
        if (bPriority && !aPriority) return 1
        
        return aTitle.localeCompare(bTitle)
      })

      setSearchResults(sorted.slice(0, 8)) // Limit to 8 results
      setShowSearchResults(true)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Mock notifications data - replace with real data
  const notifications = [
    {
      id: '1',
      title: 'New booking request',
      message: 'John Smith has requested a cleaning service',
      time: '5 minutes ago',
      type: 'booking',
      unread: true
    },
    {
      id: '2',
      title: 'Payment received',
      message: 'Payment of $120 received from Jane Doe',
      time: '1 hour ago',
      type: 'payment',
      unread: true
    },
    {
      id: '3',
      title: 'Schedule reminder',
      message: 'You have 3 appointments tomorrow',
      time: '2 hours ago',
      type: 'reminder',
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  const handleLogout = () => {
    logout()
    // Navigation to login is handled by the ProtectedRoute component
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // If there are search results, navigate to the first one
    if (searchResults.length > 0) {
      const firstResult = searchResults[0]
      router.push(firstResult.href)
      setSearchQuery('')
      setShowSearchResults(false)
    }
  }

  const handleSearchResultClick = (result: SearchResult) => {
    router.push(result.href)
    setSearchQuery('')
    setShowSearchResults(false)
  }

  const getResultTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-800'
      case 'customer': return 'bg-green-100 text-green-800'
      case 'booking': return 'bg-purple-100 text-purple-800'
      case 'employee': return 'bg-orange-100 text-orange-800'
      case 'navigation': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-screen flex">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 flex z-40 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">Service Scheduler</span>
            </div>
            
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = isActive ? item.activeIcon : item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={clsx(
                      'group flex items-center px-2 py-2 text-base font-medium rounded-md',
                      isActive
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900">Service Scheduler</span>
              </div>
              
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = isActive ? item.activeIcon : item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="mr-3 h-6 w-6" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {/* User menu */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 flex-shrink-0 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Global Header with Search and Notifications */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Mobile menu button */}
              <div className="flex items-center lg:hidden">
                <button
                  type="button"
                  className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>

              {/* Global Search */}
              <div className="flex-1 max-w-2xl mx-4 lg:mx-8" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search bookings, customers, services..."
                  />
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        {searchResults.map((result) => {
                          const Icon = result.icon
                          return (
                            <button
                              key={result.id}
                              onClick={() => handleSearchResultClick(result)}
                              className="w-full flex items-center px-3 py-2 text-left rounded-md hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <Icon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="ml-3 flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {result.title}
                                  </p>
                                  <span className={clsx(
                                    'ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
                                    getResultTypeColor(result.type)
                                  )}>
                                    {result.type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                  {result.subtitle}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      
                      {searchQuery && (
                        <div className="border-t border-gray-200 p-3 text-center">
                          <p className="text-sm text-gray-500">
                            Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to go to the first result
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Notifications and User Menu */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <BellIcon className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-sm text-gray-500">{unreadCount} unread</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={clsx(
                                'p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer',
                                notification.unread ? 'bg-blue-50' : ''
                              )}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className={clsx(
                                    'text-sm font-medium',
                                    notification.unread ? 'text-gray-900' : 'text-gray-700'
                                  )}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {notification.time}
                                  </p>
                                </div>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 ml-2" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-200 text-center">
                          <Link
                            href="/dashboard/notifications"
                            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar - Desktop Only */}
                <div className="hidden lg:block">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="hidden xl:block">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name || 'Admin User'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}
