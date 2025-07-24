'use client'

import { useState, useEffect } from 'react'
import { MapPinIcon, PhoneIcon, EnvelopeIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// Mock company data - in real app this would come from API or context
const companyData = {
  companyName: 'Service Scheduler',
  logo: undefined,
  bookingWebsite: {
    title: 'Professional Cleaning Services',
    description: 'Book professional cleaning services for your home or office',
    heroTitle: 'Professional Cleaning Services for Your Home',
    heroSubtitle: 'Experience the difference with our expert cleaning team. We provide comprehensive cleaning solutions tailored to your needs.',
    heroImage: undefined,
    primaryColor: '#3B82F6',
    enableOnlineBooking: true,
    requireCustomerAccounts: false,
    showReviews: true,
    showLicensedInsured: true,
    bookingConfirmationMessage: 'Thank you for your booking! We\'ll send you a confirmation email shortly and our team will contact you to confirm details.',
    cancellationPolicy: 'Cancellations must be made at least 24 hours before your scheduled appointment. Late cancellations may incur a fee.',
  }
}

const services = [
  { id: 1, name: 'Standard House Cleaning', price: 120, duration: 120, description: 'Complete house cleaning including all rooms, kitchen, and bathrooms' },
  { id: 2, name: 'Deep Cleaning', price: 180, duration: 180, description: 'Thorough deep cleaning service including baseboards, inside appliances, and detailed work' },
  { id: 3, name: 'Office Cleaning', price: 100, duration: 90, description: 'Professional office cleaning for small to medium businesses' },
  { id: 4, name: 'Post-Construction Cleanup', price: 250, duration: 240, description: 'Specialized cleaning after construction or renovation work' }
]

const reviews = [
  { id: 1, name: 'Sarah Johnson', rating: 5, comment: 'Excellent service! The team was professional and thorough.' },
  { id: 2, name: 'Michael Chen', rating: 5, comment: 'Outstanding cleaning quality. Highly recommend!' },
  { id: 3, name: 'Emily Davis', rating: 4, comment: 'Great attention to detail. Will book again.' }
]

export default function BookingWebsite() {
  const [selectedService, setSelectedService] = useState<number | null>(null)
  const [address, setAddress] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  })
  const [step, setStep] = useState(1) // 1: Service Selection, 2: Details, 3: Confirmation

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceSelect = (serviceId: number) => {
    setSelectedService(serviceId)
  }

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBooking = () => {
    // Handle booking submission
    alert(companyData.bookingWebsite.bookingConfirmationMessage)
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: 'smooth' }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {companyData.logo ? (
                <img src={companyData.logo} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SS</span>
                </div>
              )}
              <span className="text-xl font-bold text-gray-900">{companyData.companyName}</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#home" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Home
              </a>
              <a href="#services" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Services
              </a>
              <a href="#about" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                About
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <PhoneIcon className="h-5 w-5 text-gray-600" />
              <span className="text-gray-700">+1 (555) 987-6543</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div id="home" className="relative bg-gradient-to-r from-primary-50 to-primary-100 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                {companyData.bookingWebsite.heroTitle}
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                {companyData.bookingWebsite.heroSubtitle}
              </p>
              
              {/* Licensed & Insured Badge */}
              {companyData.bookingWebsite.showLicensedInsured && (
                <div className="mt-6 flex items-center space-x-2">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-semibold text-green-700">Licensed & Insured</span>
                </div>
              )}

              {/* Address Input */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your service address to get started
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <MapPinIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={handleAddressChange}
                      placeholder="Enter your full address..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                    />
                  </div>
                  <button
                    onClick={() => address && setStep(2)}
                    disabled={!address.trim()}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Get Quote
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-12 lg:mt-0">
              {companyData.bookingWebsite.heroImage ? (
                <img
                  src={companyData.bookingWebsite.heroImage}
                  alt="Hero"
                  className="w-full rounded-2xl shadow-xl"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="h-24 w-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="h-12 w-12" />
                    </div>
                    <p className="text-xl font-semibold">Professional Service</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Selection Modal/Section */}
      {step === 2 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Select a Service</h2>
              <p className="text-gray-600 mt-1">Service address: {address}</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                    selectedService === service.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                  <div className="text-sm text-gray-500">
                    Duration: {service.duration} minutes
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedService}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {step === 3 && selectedServiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <div className="mt-2 text-sm text-gray-600">
                <p>{selectedServiceData.name} - ${selectedServiceData.price}</p>
                <p>{address}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                  <input
                    type="date"
                    value={customerInfo.date}
                    onChange={(e) => handleCustomerInfoChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
                  <select
                    value={customerInfo.time}
                    onChange={(e) => handleCustomerInfoChange('time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select time...</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
              <button
                onClick={handleBooking}
                disabled={!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.date || !customerInfo.time}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Book Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer comprehensive cleaning services tailored to your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
                  <span className="text-2xl font-bold text-primary-600">${service.price}</span>
                </div>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Duration: {service.duration} minutes</span>
                  <button 
                    onClick={() => {
                      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Book Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About {companyData.companyName}</h2>
              <p className="text-lg text-gray-600 mb-6">
                We are a professional cleaning service company dedicated to providing exceptional 
                cleaning solutions for homes and businesses. With years of experience and a team 
                of trained professionals, we ensure your space is spotless and sanitized.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">Licensed & Insured</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">Trained Professional Staff</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">Eco-Friendly Cleaning Products</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  <span className="text-gray-700">100% Satisfaction Guarantee</span>
                </div>
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Us?</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Over 5 years of cleaning experience</li>
                  <li>• Flexible scheduling to fit your needs</li>
                  <li>• Competitive pricing with no hidden fees</li>
                  <li>• Full background checks on all employees</li>
                  <li>• Comprehensive insurance coverage</li>
                  <li>• Customer satisfaction guarantee</li>
                </ul>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Ready to get started?</p>
                    <button 
                      onClick={() => {
                        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="btn-primary btn-md"
                    >
                      Book Your Service
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {companyData.bookingWebsite.showReviews && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
              <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <StarSolidIcon key={i} className="h-6 w-6 text-yellow-400" />
                ))}
                <span className="ml-2 text-lg font-semibold text-gray-900">4.9/5</span>
                <span className="text-gray-600">({reviews.length} reviews)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{review.comment}"</p>
                  <p className="text-sm font-semibold text-gray-900">- {review.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {companyData.logo ? (
                  <img src={companyData.logo} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SS</span>
                  </div>
                )}
                <span className="text-xl font-bold">{companyData.companyName}</span>
              </div>
              <p className="text-gray-400">{companyData.bookingWebsite.description}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-2 text-gray-400">
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-4 w-4" />
                  <span>+1 (555) 987-6543</span>
                </div>
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>contact@servicescheduler.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPinIcon className="h-4 w-4" />
                  <span>123 Business St, Suite 100, City, State 12345</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
              <div className="space-y-1 text-gray-400">
                <p>Monday - Friday: 9:00 AM - 5:00 PM</p>
                <p>Saturday: 10:00 AM - 3:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {companyData.companyName}. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <button className="text-gray-400 hover:text-white text-sm">Privacy Policy</button>
              <button className="text-gray-400 hover:text-white text-sm">Terms of Service</button>
              <button className="text-gray-400 hover:text-white text-sm">Cancellation Policy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
