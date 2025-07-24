'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { BanknotesIcon, ClockIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline'

const PayrollPage = () => {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-2">Manage employee payments and payroll processing</p>
          </div>

          {/* Coming Soon Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <BanknotesIcon className="w-12 h-12 text-blue-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payroll System Coming Soon
            </h2>
            
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              We're building a comprehensive payroll management system with Stripe Connect integration. 
              This will include automatic payroll calculations, direct bank transfers to employees, 
              and detailed payroll reporting.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
              <div className="p-4 bg-gray-50 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-2">Employee Management</h3>
                <p className="text-sm text-gray-600">
                  Track completed jobs, hours worked, and commission rates for each employee
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <ClockIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-2">Automated Calculations</h3>
                <p className="text-sm text-gray-600">
                  Automatically calculate pay based on completed bookings and hourly rates
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <ChartBarIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <h3 className="font-medium text-gray-900 mb-2">Payroll Reports</h3>
                <p className="text-sm text-gray-600">
                  Generate detailed payroll reports and tax documents
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>Phase 2B Development:</strong> This feature is part of our payments implementation roadmap. 
                We'll integrate with Stripe Connect to enable direct payroll processing.
              </p>
            </div>

            <button 
              disabled
              className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Coming Soon - Phase 2B
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

export default PayrollPage
