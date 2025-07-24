'use client'

import { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { 
  CogIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface BookingPortalSettings {
  title: string
  description: string
  heroTitle: string
  heroSubtitle: string
  heroImage?: string
  primaryColor: string
  enableOnlineBooking: boolean
  requireCustomerAccounts: boolean
  customDomain: string
  enableSMSNotifications: boolean
  enableEmailNotifications: boolean
  showReviews: boolean
  showLicensedInsured: boolean
  bookingConfirmationMessage: string
  cancellationPolicy: string
  termsOfService: string
  privacyPolicy: string
}

interface BookingPortalContent {
  aboutTitle: string
  aboutDescription: string
  aboutFullText: string
  servicesTitle: string
  servicesDescription: string
  whyChooseUsTitle: string
  whyChooseUsPoints: string[]
  testimonialsSectionTitle: string
  testimonials: Array<{
    name: string
    rating: number
    text: string
    location?: string
  }>
  faqTitle: string
  faqs: Array<{
    question: string
    answer: string
  }>
  contactTitle: string
  contactDescription: string
  footerText: string
}

export default function BookingPortalPage() {
  const [activeTab, setActiveTab] = useState<'settings' | 'content'>('settings')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  // Mock data - in a real app, this would come from an API or context
  const [settings, setSettings] = useState<BookingPortalSettings>({
    title: 'Professional Cleaning Services',
    description: 'Book professional cleaning services for your home or office',
    heroTitle: 'Professional Cleaning Services for Your Home',
    heroSubtitle: 'Experience the difference with our expert cleaning team. We provide comprehensive cleaning solutions tailored to your needs.',
    heroImage: undefined,
    primaryColor: '#3B82F6',
    enableOnlineBooking: true,
    requireCustomerAccounts: false,
    customDomain: '',
    enableSMSNotifications: true,
    enableEmailNotifications: true,
    showReviews: true,
    showLicensedInsured: true,
    bookingConfirmationMessage: 'Thank you for your booking! We\'ll send you a confirmation email shortly and our team will contact you to confirm details.',
    cancellationPolicy: 'Cancellations must be made at least 24 hours before your scheduled appointment. Late cancellations may incur a fee.',
    termsOfService: 'By using our services, you agree to our terms and conditions...',
    privacyPolicy: 'We respect your privacy and are committed to protecting your personal information...'
  })

  const [content, setContent] = useState<BookingPortalContent>({
    aboutTitle: 'About Our Services',
    aboutDescription: 'We are a trusted cleaning service with years of experience',
    aboutFullText: 'Our team of professional cleaners is dedicated to providing exceptional service for your home and office. With years of experience in the industry, we understand what it takes to deliver spotless results that exceed your expectations.\n\nWe use only the highest quality, eco-friendly cleaning products and state-of-the-art equipment to ensure your space is not just clean, but also safe for your family and pets. Our trained professionals are insured, bonded, and committed to maintaining the highest standards of service.\n\nWhether you need regular maintenance cleaning, deep cleaning, or specialized services, we tailor our approach to meet your specific needs and schedule.',
    servicesTitle: 'Our Services',
    servicesDescription: 'Comprehensive cleaning solutions for your home and office',
    whyChooseUsTitle: 'Why Choose Us?',
    whyChooseUsPoints: [
      'Licensed and insured professionals',
      'Eco-friendly cleaning products',
      'Flexible scheduling to fit your needs',
      '100% satisfaction guarantee',
      'Affordable competitive pricing',
      'Free quotes and consultations'
    ],
    testimonialsSectionTitle: 'What Our Customers Say',
    testimonials: [
      {
        name: 'Sarah Johnson',
        rating: 5,
        text: 'Excellent service! My house has never been cleaner. The team was professional, punctual, and thorough.',
        location: 'Downtown'
      },
      {
        name: 'Mike Davis',
        rating: 5,
        text: 'I\'ve been using their service for over a year now. Consistently great results and friendly staff.',
        location: 'Westside'
      },
      {
        name: 'Emily Chen',
        rating: 5,
        text: 'They did an amazing deep clean for my office. Highly recommend their commercial services.',
        location: 'Business District'
      }
    ],
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      {
        question: 'How far in advance should I book?',
        answer: 'We recommend booking at least 24-48 hours in advance, especially for weekend appointments. However, we often accommodate same-day bookings based on availability.'
      },
      {
        question: 'Do I need to be home during the cleaning?',
        answer: 'No, you don\'t need to be present. Many of our clients provide us with access instructions or a spare key. All our cleaners are bonded and insured for your peace of mind.'
      },
      {
        question: 'What cleaning products do you use?',
        answer: 'We use professional-grade, eco-friendly cleaning products that are safe for children and pets. If you have specific product preferences or allergies, please let us know.'
      },
      {
        question: 'What if I\'m not satisfied with the cleaning?',
        answer: 'Your satisfaction is our priority. If you\'re not completely happy with our service, please contact us within 24 hours and we\'ll return to address any concerns at no additional cost.'
      }
    ],
    contactTitle: 'Get In Touch',
    contactDescription: 'Ready to book your cleaning service? Contact us today for a free quote!',
    footerText: '© 2024 Professional Cleaning Services. All rights reserved.'
  })

  const tabs = [
    { id: 'settings' as const, name: 'Settings', icon: CogIcon },
    { id: 'content' as const, name: 'Content', icon: DocumentTextIcon },
  ]

  const updateSettings = (key: keyof BookingPortalSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateContent = (key: keyof BookingPortalContent, value: any) => {
    setContent(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Booking portal settings saved:', { settings, content })
      setSaveStatus('success')
      
    } catch (error) {
      console.error('Error saving booking portal settings:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const SettingsTab = () => (
    <div className="space-y-6">
      {/* Booking Website URL */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Booking Website</h3>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Your Booking Website</p>
                <p className="text-sm text-gray-600">Share this link with customers to allow online booking</p>
              </div>
              <a
                href={typeof window !== 'undefined' ? `${window.location.origin}/booking` : '/booking'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                <span>View Website</span>
              </a>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Booking URL</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={typeof window !== 'undefined' ? `${window.location.origin}/booking` : 'https://yourapp.com/booking'}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                />
                <button 
                  onClick={async () => {
                    const url = typeof window !== 'undefined' ? `${window.location.origin}/booking` : 'https://yourapp.com/booking'
                    try {
                      await navigator.clipboard.writeText(url)
                      console.log('Booking URL copied to clipboard')
                    } catch (err) {
                      console.error('Failed to copy URL:', err)
                    }
                  }}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Basic Settings</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website Title</label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) => updateSettings('title', e.target.value)}
                placeholder="Professional Cleaning Services"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettings('primaryColor', e.target.value)}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettings('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website Description</label>
            <input
              type="text"
              value={settings.description}
              onChange={(e) => updateSettings('description', e.target.value)}
              placeholder="Book professional cleaning services for your home or office"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Booking Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Booking Features</h3>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: 'enableOnlineBooking', label: 'Enable Online Booking', description: 'Allow customers to book services through your website' },
            { key: 'requireCustomerAccounts', label: 'Require Customer Accounts', description: 'Customers must create accounts before booking' },
            { key: 'showReviews', label: 'Show Customer Reviews', description: 'Display customer reviews and ratings on the booking website' },
            { key: 'showLicensedInsured', label: 'Show Licensed & Insured Badge', description: 'Display "Licensed & Insured" badge to build customer trust' },
            { key: 'enableSMSNotifications', label: 'SMS Notifications', description: 'Send SMS confirmations and reminders to customers' },
            { key: 'enableEmailNotifications', label: 'Email Notifications', description: 'Send email confirmations and updates to customers' }
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                <p className="text-sm text-gray-500">{setting.description}</p>
              </div>
              <button
                onClick={() => updateSettings(setting.key as keyof BookingPortalSettings, !settings[setting.key as keyof BookingPortalSettings])}
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  settings[setting.key as keyof BookingPortalSettings] ? 'bg-blue-600' : 'bg-gray-200'
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    settings[setting.key as keyof BookingPortalSettings] ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Domain */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Custom Domain</h3>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Custom Domains</h5>
                <p className="text-sm text-gray-600">Upgrade to Professional plan to use custom domains</p>
              </div>
              <a
                href="/pricing"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium inline-flex items-center"
              >
                Upgrade Plan
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const ContentTab = () => (
    <div className="space-y-6">
      {/* Hero Section Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Hero Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => updateSettings('heroTitle', e.target.value)}
              placeholder="Professional Cleaning Services for Your Home"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero Description</label>
            <textarea
              rows={3}
              value={settings.heroSubtitle}
              onChange={(e) => updateSettings('heroSubtitle', e.target.value)}
              placeholder="Experience the difference with our expert cleaning team..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          {/* Hero Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hero Image</label>
            <p className="text-xs text-gray-500 mb-3">
              Upload an image for your booking website hero section. Recommended: 800x600px or larger.
            </p>
            
            {settings.heroImage ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={settings.heroImage}
                      alt="Hero Image Preview"
                      className="h-32 w-auto max-w-48 object-cover border border-gray-200 rounded-lg"
                    />
                    <button
                      onClick={() => updateSettings('heroImage', undefined)}
                      className="mt-2 flex items-center space-x-1 px-2 py-1 text-xs text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-3 w-3" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-800">Hero image uploaded successfully</p>
                    </div>
                    <p className="text-sm text-green-700">
                      This image will be displayed on your booking website hero section.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <div className="max-w-md mx-auto">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Hero Image</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add a compelling hero image to make your booking website more attractive.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Drag and drop your image here, or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                        browse files
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && file.type.startsWith('image/')) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                updateSettings('heroImage', event.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                    </p>
                    <div className="text-xs text-gray-500">
                      <p><strong>Supported:</strong> PNG, JPG, SVG up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">About Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
            <input
              type="text"
              value={content.aboutTitle}
              onChange={(e) => updateContent('aboutTitle', e.target.value)}
              placeholder="About Our Services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
            <input
              type="text"
              value={content.aboutDescription}
              onChange={(e) => updateContent('aboutDescription', e.target.value)}
              placeholder="We are a trusted cleaning service with years of experience"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full About Text</label>
            <textarea
              rows={6}
              value={content.aboutFullText}
              onChange={(e) => updateContent('aboutFullText', e.target.value)}
              placeholder="Our team of professional cleaners..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">This will be displayed when users click "Read More" in the about section.</p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Services Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services Section Title</label>
            <input
              type="text"
              value={content.servicesTitle}
              onChange={(e) => updateContent('servicesTitle', e.target.value)}
              placeholder="Our Services"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services Description</label>
            <input
              type="text"
              value={content.servicesDescription}
              onChange={(e) => updateContent('servicesDescription', e.target.value)}
              placeholder="Comprehensive cleaning solutions for your home and office"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <p className="text-xs text-gray-500">Note: Individual services are managed from the Services page and automatically displayed here.</p>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Why Choose Us Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
            <input
              type="text"
              value={content.whyChooseUsTitle}
              onChange={(e) => updateContent('whyChooseUsTitle', e.target.value)}
              placeholder="Why Choose Us?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Points (one per line)</label>
            <textarea
              rows={6}
              value={content.whyChooseUsPoints.join('\n')}
              onChange={(e) => updateContent('whyChooseUsPoints', e.target.value.split('\n').filter(point => point.trim()))}
              placeholder="Licensed and insured professionals\nEco-friendly cleaning products\nFlexible scheduling to fit your needs"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Contact Section</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Title</label>
            <input
              type="text"
              value={content.contactTitle}
              onChange={(e) => updateContent('contactTitle', e.target.value)}
              placeholder="Get In Touch"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Description</label>
            <input
              type="text"
              value={content.contactDescription}
              onChange={(e) => updateContent('contactDescription', e.target.value)}
              placeholder="Ready to book your cleaning service? Contact us today for a free quote!"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Legal Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Legal Content</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Confirmation Message
            </label>
            <textarea
              rows={3}
              value={settings.bookingConfirmationMessage}
              onChange={(e) => updateSettings('bookingConfirmationMessage', e.target.value)}
              placeholder="Thank you for your booking..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Policy
            </label>
            <textarea
              rows={3}
              value={settings.cancellationPolicy}
              onChange={(e) => updateSettings('cancellationPolicy', e.target.value)}
              placeholder="Cancellations must be made at least 24 hours..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Terms of Service
            </label>
            <textarea
              rows={4}
              value={settings.termsOfService}
              onChange={(e) => updateSettings('termsOfService', e.target.value)}
              placeholder="By using our services, you agree to..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Policy
            </label>
            <textarea
              rows={4}
              value={settings.privacyPolicy}
              onChange={(e) => updateSettings('privacyPolicy', e.target.value)}
              placeholder="We respect your privacy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Footer</h3>
        </div>
        <div className="p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
            <input
              type="text"
              value={content.footerText}
              onChange={(e) => updateContent('footerText', e.target.value)}
              placeholder="© 2024 Professional Cleaning Services. All rights reserved."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
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
            <h1 className="text-3xl font-bold text-gray-900">Booking Portal Settings</h1>
            <p className="text-gray-600 mt-2">Customize your public booking website's appearance and content</p>
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
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'content' && <ContentTab />}

          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              className="btn-secondary btn-md"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary btn-md"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="ml-2 text-sm text-green-700">Settings saved successfully!</p>
              </div>
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">Failed to save settings. Please try again.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
