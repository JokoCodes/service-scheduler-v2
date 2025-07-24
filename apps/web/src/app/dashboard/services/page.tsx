'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { apiClient } from '@/lib/api'
import type { Service } from '@service-scheduler/shared-types'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'


const categories = ['All Categories', 'Residential', 'Commercial', 'Specialized']

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    pricingType: 'fixed',
    duration: '',
    category: 'Residential'
  })

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        const servicesData = await apiClient.getServices()
        setServices(servicesData)
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'All Categories' || service.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddService = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      pricingType: 'fixed',
      duration: '',
      category: 'Residential'
    })
    setShowModal(true)
  }

  const handleEditService = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      pricingType: 'fixed',
      duration: service.duration.toString(),
      category: service.category
    })
    setShowModal(true)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await apiClient.deleteService(serviceId)
        setServices(prev => prev.filter(service => service.id !== serviceId))
      } catch (error) {
        console.error('Failed to delete service:', error)
        alert('Failed to delete service. Please try again.')
      }
    }
  }

  const handleToggleActive = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (!service) return

    try {
      const updatedService = await apiClient.updateService(serviceId, { 
        isActive: !service.isActive 
      })
      setServices(prev => 
        prev.map(s => 
          s.id === serviceId ? updatedService : s
        )
      )
    } catch (error) {
      console.error('Failed to toggle service status:', error)
      alert('Failed to update service status. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const serviceData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      pricingType: formData.pricingType,
      duration: parseInt(formData.duration),
      category: formData.category,
      isActive: true
    }

    try {
      if (editingService) {
        const updatedService = await apiClient.updateService(editingService.id, serviceData)
        setServices(prev =>
          prev.map(service =>
            service.id === editingService.id
              ? updatedService
              : service
          )
        )
      } else {
        const newService = await apiClient.createService(serviceData)
        setServices(prev => [newService, ...prev])
      }

      setShowModal(false)
      setEditingService(null)
    } catch (error) {
      console.error('Failed to save service:', error)
      alert('Failed to save service. Please try again.')
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Residential':
        return 'bg-blue-100 text-blue-800'
      case 'Commercial':
        return 'bg-green-100 text-green-800'
      case 'Specialized':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPricingTypeLabel = (pricingType?: string) => {
    switch (pricingType) {
      case 'fixed':
        return 'Fixed Price'
      case 'hourly':
        return 'Per Hour'
      case 'per_sqft':
        return 'Per Sq Ft'
      case 'custom_quote':
        return 'Custom Quote'
      default:
        return 'Fixed Price'
    }
  }

  const formatPrice = (price: number, pricingType?: string) => {
    if (pricingType === 'custom_quote') {
      return 'Quote Required'
    }
    const formattedPrice = `$${price}`
    switch (pricingType) {
      case 'hourly':
        return `${formattedPrice}/hr`
      case 'per_sqft':
        return `${formattedPrice}/sq ft`
      default:
        return formattedPrice
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
                  <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your company's services and pricing
                  </p>
                </div>
                <button 
                  onClick={handleAddService}
                  className="btn-primary btn-md flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Service
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Services */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <WrenchScrewdriverIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Total Services
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {services.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Services */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Active Services
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {services.filter(s => s.isActive).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Average Price */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">$</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Average Price
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${ services.length > 0 
                          ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)
                          : 0
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="card">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-0.5">
                          <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                          <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                          <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                          <div className="h-1.5 w-1.5 bg-purple-600 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        Categories
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {new Set(services.map(s => s.category)).size}
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
                        placeholder="Search services..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="sm:w-48">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Services List */}
            <div className="card">
              {loading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="p-6 text-center">
                  <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || categoryFilter !== 'All Categories' 
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Get started by adding your first service.'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'All Categories' && (
                    <div className="mt-6">
                      <button
                        onClick={handleAddService}
                        className="btn-primary btn-md"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Service
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      Services ({filteredServices.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {filteredServices.map((service) => (
                      <div key={service.id} className="p-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">
                                {service.name}
                              </h4>
                              <span className={clsx(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                getCategoryColor(service.category)
                              )}>
                                {service.category}
                              </span>
                              {!service.isActive && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-gray-600">
                              {service.description}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <span className="font-semibold text-primary-600">
                                {formatPrice(service.price, service.pricingType)}
                              </span>
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                {getPricingTypeLabel(service.pricingType)}
                              </span>
                              <span>{service.duration} minutes</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleActive(service.id)}
                              className={clsx(
                                'px-3 py-1 rounded text-sm font-medium',
                                service.isActive
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              )}
                            >
                              {service.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleEditService(service)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                              title="Edit service"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="p-2 text-gray-400 hover:text-red-600"
                              title="Delete service"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Add/Edit Service Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </h3>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pricing Type
                      </label>
                      <select
                        value={formData.pricingType}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricingType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="fixed">Fixed Price</option>
                        <option value="hourly">Per Hour</option>
                        <option value="per_sqft">Per Square Foot</option>
                        <option value="custom_quote">Custom Quote</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.pricingType === 'custom_quote' ? 'Base Price ($)' : 'Price ($)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                          placeholder={formData.pricingType === 'custom_quote' ? 'Starting from...' : ''}
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.duration}
                          onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Specialized">Specialized</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="btn-secondary btn-md"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary btn-md"
                      >
                        {editingService ? 'Update Service' : 'Add Service'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
