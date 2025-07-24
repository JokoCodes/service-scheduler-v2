'use client';

import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import type { Payment } from '@service-scheduler/shared-types';
import { 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Example implementation features
  // 1. Automatic Processing: Stripe handles customer payments automatically via webhooks
  // 2. Status Tracking: Track payment status through different states with icons
  // 3. Failed Payment Recovery: Logic for retry attempts will go here, with alerts
  // 4. Text Notifications: Integrate SMS webhook using a service like Twilio

  // Calculate payment statistics
  const getPaymentStats = () => {
    if (!payments || payments.length === 0) {
      return {
        totalPayments: 0,
        pendingPayments: 0,
        totalRevenue: 0,
        failedPayments: 0
      };
    }

    const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'processing').length;
    const failedPayments = payments.filter(p => p.status === 'failed' || p.status === 'cancelled').length;
    const successfulPayments = payments.filter(p => p.status === 'succeeded');
    const totalRevenue = successfulPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      totalPayments: payments.length,
      pendingPayments,
      totalRevenue: totalRevenue / 100, // Convert from cents to dollars
      failedPayments
    };
  };

  const stats = getPaymentStats();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const payments = await apiClient.getPayments();
        setPayments(payments);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      }
      setLoading(false);
    };

    fetchPayments();
  }, []);

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  if (loading) return <div>Loading...</div>;

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const handleBackClick = () => {
    setSelectedPayment(null);
  };

  if (selectedPayment) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 space-y-8">
            <button onClick={handleBackClick} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Payments</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div><strong>Payment ID:</strong> {selectedPayment.id}</div>
              <div><strong>Booking ID:</strong> {selectedPayment.bookingId}</div>
              <div><strong>Customer Email:</strong> {selectedPayment.customerEmail || 'N/A'}</div>
              <div><strong>Amount:</strong> ${(selectedPayment.amount / 100).toFixed(2)}</div>
              <div><strong>Currency:</strong> {selectedPayment.currency}</div>
              <div><strong>Status:</strong> {selectedPayment.status}</div>
              <div><strong>Payment Method:</strong> {selectedPayment.paymentMethod || 'N/A'}</div>
              <div><strong>Date:</strong> {new Date(selectedPayment.createdAt).toLocaleDateString()}</div>
              {selectedPayment.paidAt && (
                <div><strong>Paid At:</strong> {new Date(selectedPayment.paidAt).toLocaleDateString()}</div>
              )}
              {selectedPayment.failureReason && (
                <div><strong>Failure Reason:</strong> {selectedPayment.failureReason}</div>
              )}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              <p className="mt-2 text-sm text-gray-700">
                Monitor customer payments, track revenue, and manage payment issues.
              </p>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Revenue */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">${stats.totalRevenue.toFixed(2)}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Payments */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pending Payments</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.pendingPayments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Payments */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CreditCardIcon className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Payments</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.totalPayments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Payments */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircleIcon className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Failed Payments</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.failedPayments}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Payments</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about customer payment status and actions.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {payments.map(payment => (
                  <div key={payment.id} className="bg-white shadow rounded-lg mb-4 flex justify-between items-center p-6 hover:bg-blue-50 cursor-pointer" onClick={() => handlePaymentClick(payment)}>
                    <div className="flex items-center space-x-3">
                      <div className="text-lg font-semibold text-gray-700 truncate">
                        {payment.customerEmail || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Booking ID: {payment.bookingId}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-lg font-semibold text-gray-900">
                        ${(payment.amount / 100).toFixed(2)}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' || payment.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default PaymentsPage;
