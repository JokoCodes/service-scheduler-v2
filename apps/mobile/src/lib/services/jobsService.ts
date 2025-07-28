import { supabase, Tables } from '../supabase'

export type Booking = Tables<'bookings'>
export type Payment = Tables<'payments'>

export interface JobWithPayment extends Booking {
  payments?: Payment[]
  customer?: {
    id: string
    full_name: string | null
    email: string
    phone: string | null
  }
}

export interface JobsData {
  available: JobWithPayment[]
  assigned: JobWithPayment[]
  completed: JobWithPayment[]
}

class JobsService {
  // Helper function to get employee ID from profile ID
  private async getEmployeeIdFromProfile(profileId: string): Promise<string | null> {
    try {
      console.log('🔍 [JobsService] Looking up employee ID for profile:', profileId)
      
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id')
        .eq('profile_id', profileId)
        .single()
      
      if (error) {
        console.error('❌ [JobsService] Error finding employee:', error)
        return null
      }
      
      console.log('✅ [JobsService] Found employee ID:', employee.id)
      return employee.id
    } catch (error) {
      console.error('❌ [JobsService] Error in getEmployeeIdFromProfile:', error)
      return null
    }
  }

  async getJobsForEmployee(profileId: string): Promise<JobsData> {
    try {
      console.log('🔍 [JobsService] Fetching jobs for profile:', profileId)
      
      // Convert profile ID to employee ID for querying assigned jobs
      const employeeId = await this.getEmployeeIdFromProfile(profileId)
      if (!employeeId) {
        console.warn('⚠️ [JobsService] Employee record not found, returning only available jobs')
      }
      
      // Get available jobs (not assigned to anyone)
      const { data: availableJobs, error: availableError } = await supabase
        .from('bookings')
        .select(`
          *,
          payments(*)
        `)
        .is('assigned_employee_id', null)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_date', new Date().toISOString().split('T')[0]) // Only future jobs
        .order('scheduled_date', { ascending: true })

      if (availableError) {
        console.error('❌ [JobsService] Error fetching available jobs:', availableError)
        throw new Error(`Failed to fetch available jobs: ${availableError.message}`)
      }

      console.log('✅ [JobsService] Available jobs found:', availableJobs?.length || 0)

      let assignedJobs: JobWithPayment[] = []
      let completedJobs: JobWithPayment[] = []
      
      if (employeeId) {
        // Get assigned jobs for this employee
        const { data: assigned, error: assignedError } = await supabase
          .from('bookings')
          .select(`
            *,
            payments(*)
          `)
          .eq('assigned_employee_id', employeeId)
          .in('status', ['confirmed'])
          .order('scheduled_date', { ascending: true })

        if (assignedError) {
          console.error('❌ [JobsService] Error fetching assigned jobs:', assignedError)
          throw new Error(`Failed to fetch assigned jobs: ${assignedError.message}`)
        }

        assignedJobs = assigned || []
        console.log('✅ [JobsService] Assigned jobs found:', assignedJobs.length)

        // Get completed jobs for this employee
        const { data: completed, error: completedError } = await supabase
          .from('bookings')
          .select(`
            *,
            payments(*)
          `)
          .eq('assigned_employee_id', employeeId)
          .eq('status', 'completed')
          .order('scheduled_date', { ascending: false })
          .limit(20) // Limit to recent completed jobs

        if (completedError) {
          console.error('❌ [JobsService] Error fetching completed jobs:', completedError)
          throw new Error(`Failed to fetch completed jobs: ${completedError.message}`)
        }

        completedJobs = completed || []
        console.log('✅ [JobsService] Completed jobs found:', completedJobs.length)
      }

      const result = {
        available: availableJobs || [],
        assigned: assignedJobs || [],
        completed: completedJobs || [],
      }

      console.log('📊 [JobsService] Final job counts:', {
        available: result.available.length,
        assigned: result.assigned.length,
        completed: result.completed.length
      })

      return result
    } catch (error) {
      console.error('❌ [JobsService] Error fetching jobs:', error)
      throw error
    }
  }

  async assignJobToEmployee(bookingId: string, profileId: string): Promise<void> {
    try {
      console.log('📝 [JobsService] Assigning job:', { bookingId, profileId })
      
      // Convert profile ID to employee ID
      const employeeId = await this.getEmployeeIdFromProfile(profileId)
      if (!employeeId) {
        throw new Error('Employee record not found for this profile')
      }
      
      console.log('🎯 [JobsService] Using employee ID for assignment:', employeeId)
      
      const { error } = await supabase
        .from('bookings')
        .update({
          assigned_employee_id: employeeId,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (error) {
        console.error('❌ [JobsService] Assignment failed:', error)
        throw new Error(`Failed to assign job: ${error.message}`)
      }
      
      console.log('✅ [JobsService] Job assigned successfully')
    } catch (error) {
      console.error('Error assigning job:', error)
      throw error
    }
  }

  async startJob(bookingId: string): Promise<void> {
    try {
      // Since 'in_progress' is not supported, we'll keep it as 'confirmed'
      // This method can be used for other job start logic if needed
      const { error } = await supabase
        .from('bookings')
        .update({
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
      console.log('🔍 [JobsService.getJobById] Starting query for ID:', bookingId)
      console.log('🔍 [JobsService.getJobById] Making Supabase query...')
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*, payments(*)')
        .eq('id', bookingId)
        .single()

      console.log('🔍 [JobsService.getJobById] Supabase query completed')
      console.log('🔍 [JobsService.getJobById] Error:', error)
      console.log('🔍 [JobsService.getJobById] Data received:', data ? 'yes' : 'no')
      
      if (error) {
        console.error('❌ [JobsService.getJobById] Supabase error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to fetch job: ${error.message}`)
      }

      if (data) {
        console.log('✅ [JobsService.getJobById] Job found:', {
          id: data.id,
          service_name: data.service_name,
          customer_name: data.customer_name,
          service_address: data.service_address,
          scheduled_date: data.scheduled_date,
          scheduled_time: data.scheduled_time,
          status: data.status
        })
      } else {
        console.warn('⚠️ [JobsService.getJobById] No data returned from query')
      }

      return data
    } catch (error) {
      console.error('❌ [JobsService.getJobById] Unexpected error:', error)
      console.error('❌ [JobsService.getJobById] Error type:', typeof error)
      console.error('❌ [JobsService.getJobById] Error details:', error.message || 'No message')
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
