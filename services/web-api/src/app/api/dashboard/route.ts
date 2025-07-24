import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '../../../middleware/auth'
import { supabase } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    // Run all queries in parallel for better performance
    const [
      bookingsResult,
      employeesResult,
      customersResult,
      servicesResult,
      paymentsResult
    ] = await Promise.all([
      // Get bookings data
      supabase
        .from('bookings')
        .select('id, status, service_price, created_at, customer_name, service_name, scheduled_date')
        .order('created_at', { ascending: false }),
      
      // Get employees data
      supabase
        .from('employees')
        .select('id, name, is_active')
        .eq('is_active', true),
      
      // Get customers data
      supabase
        .from('customers')
        .select('id, name, total_bookings, total_spent, created_at'),
      
      // Get services data
      supabase
        .from('services')
        .select('id, name, is_active'),
      
      // Get payments data for revenue calculation
      supabase
        .from('payments')
        .select('amount, status, created_at')
        .in('status', ['succeeded', 'completed'])
    ])

    // Handle any database errors
    if (bookingsResult.error) {
      console.error('Error fetching bookings:', bookingsResult.error)
    }
    if (employeesResult.error) {
      console.error('Error fetching employees:', employeesResult.error)
    }
    if (customersResult.error) {
      console.error('Error fetching customers:', customersResult.error)
    }
    if (servicesResult.error) {
      console.error('Error fetching services:', servicesResult.error)
    }
    if (paymentsResult.error) {
      console.error('Error fetching payments:', paymentsResult.error)
    }

    const bookings = bookingsResult.data || []
    const employees = employeesResult.data || []
    const customers = customersResult.data || []
    const services = servicesResult.data || []
    const payments = paymentsResult.data || []

    // Calculate current month boundaries
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Calculate stats
    const totalBookings = bookings.length
    const activeEmployees = employees.length

    // Calculate revenue for this month and last month
    const thisMonthPayments = payments.filter(p => new Date(p.created_at) >= currentMonth)
    const lastMonthPayments = payments.filter(p => {
      const paymentDate = new Date(p.created_at)
      return paymentDate >= lastMonth && paymentDate < currentMonth
    })

    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    
    const revenueChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1) + '%'
      : thisMonthRevenue > 0 ? '+100%' : '0%'

    // Calculate customer satisfaction (mock for now - could be calculated from reviews/ratings)
    const customerSatisfaction = '4.8/5'

    // Get recent bookings (last 5)
    const recentBookings = bookings.slice(0, 5).map(booking => ({
      id: booking.id,
      customer: booking.customer_name || 'Unknown Customer',
      service: booking.service_name || 'Unknown Service',
      date: new Date(booking.scheduled_date || booking.created_at).toISOString().split('T')[0],
      status: booking.status || 'pending'
    }))

    // Calculate booking trends
    const thisMonthBookings = bookings.filter(b => new Date(b.created_at) >= currentMonth).length
    const lastMonthBookings = bookings.filter(b => {
      const bookingDate = new Date(b.created_at)
      return bookingDate >= lastMonth && bookingDate < currentMonth
    }).length

    const bookingChange = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1) + '%'
      : thisMonthBookings > 0 ? '+100%' : '0%'

    // Employee change (simplified - just showing count)
    const employeeChange = `+${employees.length}`

    // Prepare response data
    const dashboardData = {
      stats: [
        { 
          name: 'Total Bookings', 
          value: totalBookings.toString(), 
          change: bookingChange,
          changeType: bookingChange.startsWith('-') ? 'decrease' : 'increase'
        },
        { 
          name: 'Active Employees', 
          value: activeEmployees.toString(), 
          change: employeeChange,
          changeType: 'increase'
        },
        { 
          name: 'Revenue (This Month)', 
          value: `$${thisMonthRevenue.toLocaleString()}`, 
          change: revenueChange,
          changeType: revenueChange.startsWith('-') ? 'decrease' : 'increase'
        },
        { 
          name: 'Customer Satisfaction', 
          value: customerSatisfaction, 
          change: '+0.1',
          changeType: 'increase'
        },
      ],
      recentBookings,
      summary: {
        totalBookings,
        activeEmployees,
        totalCustomers: customers.length,
        totalServices: services.filter(s => s.is_active).length,
        thisMonthRevenue,
        lastMonthRevenue,
        totalRevenue: payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
