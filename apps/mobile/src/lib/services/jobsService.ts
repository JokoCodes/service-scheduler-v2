import { supabase, Tables } from '../supabase'

export type Booking = Tables<'bookings'>
export type Payment = Tables<'payments'>

export interface JobWithPayment extends Booking {
  payments?: Payment[]
}

export interface JobsData {
  available: JobWithPayment[]
  assigned: JobWithPayment[]
  completed: JobWithPayment[]
}

class JobsService {
  async getJobsForEmployee(employeeId: string): Promise<JobsData> {
    try {
      // Get available jobs (not assigned to anyone)
      const { data: availableJobs, error: availableError } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .is('employee_id', null)
        .eq('status', 'confirmed')
        .order('scheduled_date', { ascending: true })

      if (availableError) {
        throw new Error(`Failed to fetch available jobs: ${availableError.message}`)
      }

      // Get assigned jobs for this employee
      const { data: assignedJobs, error: assignedError } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('employee_id', employeeId)
        .in('status', ['confirmed', 'in_progress'])
        .order('scheduled_date', { ascending: true })

      if (assignedError) {
        throw new Error(`Failed to fetch assigned jobs: ${assignedError.message}`)
      }

      // Get completed jobs for this employee
      const { data: completedJobs, error: completedError } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('employee_id', employeeId)
        .eq('status', 'completed')
        .order('scheduled_date', { ascending: false })
        .limit(20) // Limit to recent completed jobs

      if (completedError) {
        throw new Error(`Failed to fetch completed jobs: ${completedError.message}`)
      }

      return {
        available: availableJobs || [],
        assigned: assignedJobs || [],
        completed: completedJobs || [],
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  }

  async assignJobToEmployee(bookingId: string, employeeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          employee_id: employeeId,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (error) {
        throw new Error(`Failed to assign job: ${error.message}`)
      }
    } catch (error) {
      console.error('Error assigning job:', error)
      throw error
    }
  }

  async startJob(bookingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (error) {
        throw new Error(`Failed to start job: ${error.message}`)
      }
    } catch (error) {
      console.error('Error starting job:', error)
      throw error
    }
  }

  async completeJob(bookingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          payment_status: 'paid', // Assuming payment is processed on completion
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (error) {
        throw new Error(`Failed to complete job: ${error.message}`)
      }
    } catch (error) {
      console.error('Error completing job:', error)
      throw error
    }
  }

  async getJobById(bookingId: string): Promise<JobWithPayment | null> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('id', bookingId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch job: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error fetching job by ID:', error)
      throw error
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  getStatusColor(status: Booking['status']): string {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'confirmed':
        return '#3b82f6'
      case 'in_progress':
        return '#8b5cf6'
      case 'completed':
        return '#10b981'
      case 'cancelled':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  getStatusText(status: Booking['status']): string {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'in_progress':
        return 'In Progress'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return status
    }
  }

  getPaymentStatusColor(status: Booking['payment_status']): string {
    switch (status) {
      case 'unpaid':
        return '#ef4444'
      case 'pending':
        return '#f59e0b'
      case 'paid':
        return '#10b981'
      case 'failed':
        return '#ef4444'
      case 'refunded':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  getPaymentStatusText(status: Booking['payment_status']): string {
    switch (status) {
      case 'unpaid':
        return 'Unpaid'
      case 'pending':
        return 'Pending'
      case 'paid':
        return 'Paid'
      case 'failed':
        return 'Failed'
      case 'refunded':
        return 'Refunded'
      default:
        return status
    }
  }
}

export const jobsService = new JobsService()
