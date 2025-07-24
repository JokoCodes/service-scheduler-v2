'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  UserIcon, 
  BellIcon, 
  BuildingOfficeIcon, 
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  avatar: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  jobUpdates: boolean
  scheduleChanges: boolean
  customerMessages: boolean
  systemAlerts: boolean
}

interface CompanySettings {
  companyName: string
  address: string
  phone: string
  email: string
  website: string
  timezone: string
  businessHours: {
    start: string
    end: string
  }
  logo?: string
}

interface SystemSettings {
  theme: string
  language: string
  dateFormat: string
  timeFormat: string
  autoSave: boolean
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Mock data - in a real app, this would come from an API or context
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@demo.com',
    phone: '+1 (555) 123-4567',
    role: 'Administrator',
    avatar: 'AU'
  })

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    jobUpdates: true,
    scheduleChanges: true,
    customerMessages: false,
    systemAlerts: true
  })

  const [company, setCompany] = useState<CompanySettings>({
    companyName: 'Service Scheduler',
    address: '123 Business St, Suite 100, City, State 12345',
    phone: '+1 (555) 987-6543',
    email: 'contact@servicescheduler.com',
    website: 'https://servicescheduler.com',
    timezone: 'America/New_York',
    businessHours: {
      start: '09:00',
      end: '17:00'
    },
    logo: undefined
  })

  const [system, setSystem] = useState<SystemSettings>({
    theme: 'light',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    autoSave: true
  })

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id:'company', name: 'Company', icon: BuildingOfficeIcon },
    { id: 'system', name: 'System', icon: ShieldCheckIcon },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Settings saved:', { userProfile, notifications, company, system })
      setSaveStatus('success')
      
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
  }

  const updateCompany = (key: keyof CompanySettings, value: string) => {
    setCompany(prev => ({ ...prev, [key]: value }))
  }

  const updateSystem = (key: keyof SystemSettings, value: any) => {
    setSystem(prev => ({ ...prev, [key]: value }))
  }


  // Tab Components
  const ProfileTab = ({ userProfile, setUserProfile, showPassword, setShowPassword }: {
    userProfile: UserProfile
    setUserProfile: (profile: UserProfile) => void
    showPassword: boolean
    setShowPassword: (show: boolean) => void
  }) => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                {userProfile.avatar}
              </div>
            </div>
            <div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
                Change Avatar
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={userProfile.firstName}
                onChange={(e) => setUserProfile({...userProfile, firstName: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={userProfile.lastName}
                onChange={(e) => setUserProfile({...userProfile, lastName: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={userProfile.phone}
                onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Security</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const NotificationsTab = ({ notifications, updateNotification }: {
    notifications: NotificationSettings
    updateNotification: (key: keyof NotificationSettings, value: boolean) => void
  }) => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Email Notifications</h3>
        </div>
        <div className="p-6 space-y-4">
          {Object.entries({
            emailNotifications: 'Email notifications',
            jobUpdates: 'Job updates',
            scheduleChanges: 'Schedule changes',
            customerMessages: 'Customer messages',
            systemAlerts: 'System alerts'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{label}</h4>
              </div>
              <button
                type="button"
                onClick={() => updateNotification(key as keyof NotificationSettings, !notifications[key as keyof NotificationSettings])}
                className={clsx(
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  notifications[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200'
                )}
                role="switch"
                aria-checked={notifications[key as keyof NotificationSettings]}
              >
                <span className={clsx(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                  notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">SMS & Push Notifications</h3>
        </div>
        <div className="p-6 space-y-4">
          {Object.entries({
            smsNotifications: 'SMS notifications',
            pushNotifications: 'Push notifications'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">{label}</h4>
              </div>
              <button
                type="button"
                onClick={() => updateNotification(key as keyof NotificationSettings, !notifications[key as keyof NotificationSettings])}
                className={clsx(
                  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                  notifications[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-200'
                )}
                role="switch"
                aria-checked={notifications[key as keyof NotificationSettings]}
              >
                <span className={clsx(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                  notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                )} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const CompanyTab = ({ company, updateCompany }: {
    company: CompanySettings
    updateCompany: (key: keyof CompanySettings, value: string) => void
  }) => (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            <div className="space-y-4">
              {company.logo ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={company.logo}
                      alt="Company Logo"
                      className="h-20 w-auto max-w-40 object-contain border border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={() => setCompany(prev => ({ ...prev, logo: undefined }))}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Logo uploaded successfully</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop your logo here, or{' '}
                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                      browse
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file && file.type.startsWith('image/')) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              setCompany(prev => ({
                                ...prev,
                                logo: event.target?.result as string
                              }))
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, SVG up to 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={company.companyName}
                onChange={(e) => updateCompany('companyName', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="url"
                value={company.website}
                onChange={(e) => updateCompany('website', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={company.email}
                onChange={(e) => updateCompany('email', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={company.phone}
                onChange={(e) => updateCompany('phone', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              rows={3}
              value={company.address}
              onChange={(e) => updateCompany('address', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      {/* Business Hours */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Business Hours</h3>
        </div>
        <div className="p-6 space-y-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <div key={day} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  defaultChecked={!['Saturday', 'Sunday'].includes(day)}
                />
                <span className="text-sm font-medium text-gray-700 w-20">{day}</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="time"
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  defaultValue="09:00"
                  disabled={['Saturday', 'Sunday'].includes(day)}
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                  defaultValue="17:00"
                  disabled={['Saturday', 'Sunday'].includes(day)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note about Booking Portal Settings */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ArrowTopRightOnSquareIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Booking Website Settings</h3>
            <p className="mt-1 text-sm text-blue-700">
              Booking website customization has been moved to a dedicated section. 
              <a href="/dashboard/booking-portal" className="font-medium underline hover:text-blue-600">
                Configure your booking portal here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const SystemTab = ({ system, updateSystem }: {
    system: SystemSettings
    updateSystem: (key: keyof SystemSettings, value: any) => void
  }) => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="space-y-2">
              {['light', 'dark', 'auto'].map((theme) => (
                <label key={theme} className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value={theme}
                    checked={system.theme === theme}
                    onChange={(e) => updateSystem('theme', e.target.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{theme}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select
              value={system.language}
              onChange={(e) => updateSystem('language', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Date & Time</h3>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date Format</label>
            <select
              value={system.dateFormat}
              onChange={(e) => updateSystem('dateFormat', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Time Format</label>
            <div className="space-y-2">
              {['12h', '24h'].map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="radio"
                    name="timeFormat"
                    value={format}
                    checked={system.timeFormat === format}
                    onChange={(e) => updateSystem('timeFormat', e.target.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{format === '12h' ? '12 hour' : '24 hour'}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Auto-save</h4>
              <p className="text-sm text-gray-500">Automatically save changes</p>
            </div>
            <button
              type="button"
              onClick={() => updateSystem('autoSave', !system.autoSave)}
              className={clsx(
                'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                system.autoSave ? 'bg-blue-600' : 'bg-gray-200'
              )}
              role="switch"
              aria-checked={system.autoSave}
            >
              <span className={clsx(
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
                system.autoSave ? 'translate-x-5' : 'translate-x-0'
              )} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedRoute requireAdmin>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={clsx(
                        'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm',
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && <ProfileTab userProfile={userProfile} setUserProfile={setUserProfile} showPassword={showPassword} setShowPassword={setShowPassword} />}
          {activeTab === 'notifications' && <NotificationsTab notifications={notifications} updateNotification={updateNotification} />}
          {activeTab === 'company' && <CompanyTab company={company} updateCompany={updateCompany} />}
          {activeTab === 'system' && <SystemTab system={system} updateSystem={updateSystem} />}

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              className="btn-secondary btn-md"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              className="btn-primary btn-md"
            >
              Save Changes
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
