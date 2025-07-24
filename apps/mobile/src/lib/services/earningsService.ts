import { supabase, Tables } from '../supabase'

export type EmployeePayout = Tables<'employee_payouts'>
export type Profile = Tables<'profiles'>
export type Booking = Tables<'bookings'>

export interface EarningsData {
  totalEarnings: number
  pendingPayouts: number
  paidPayouts: number
  completedJobs: number
  thisWeekEarnings: number
  thisMonthEarnings: number
  payouts: EmployeePayout[]
  stripeConnected: boolean
  stripeOnboardingUrl?: string
}

class EarningsService {
  async getEmployeeEarnings(employeeId: string): Promise<EarningsData> {
    try {
      console.log('💰 [EarningsService] Starting getEmployeeEarnings for:', employeeId)
      
      // Get employee profile to check Stripe Connect status
      console.log('📊 [EarningsService] Fetching profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeId)
        .single()
      
      console.log('📊 [EarningsService] Profile result:', { profile: profile?.id, error: profileError })

      if (profileError) {
        console.error('❌ [EarningsService] Profile error:', profileError)
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }
      
      console.log('✅ [EarningsService] Profile fetched successfully')

      // Get all payouts for the employee
      console.log('💰 [EarningsService] Fetching payouts...')
      const { data: payouts, error: payoutsError } = await supabase
        .from('employee_payouts')
        .select('*, bookings(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
      
      console.log('💰 [EarningsService] Payouts result:', { count: payouts?.length || 0, error: payoutsError })

      if (payoutsError) {
        console.error('❌ [EarningsService] Payouts error:', payoutsError)
        throw new Error(`Failed to fetch payouts: ${payoutsError.message}`)
      }
      
      console.log('✅ [EarningsService] Payouts fetched successfully, count:', payouts?.length || 0)

      // Calculate earnings statistics
      const totalEarnings = payouts?.reduce((sum, payout) => sum + payout.net_amount, 0) || 0
      const pendingPayouts = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.net_amount, 0) || 0
      const paidPayouts = payouts?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.net_amount, 0) || 0
      const completedJobs = payouts?.length || 0

      // Calculate this week and month earnings
      const now = new Date()
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const thisWeekEarnings = payouts?.filter(p => 
        new Date(p.created_at) >= weekStart && p.status === 'paid'
      ).reduce((sum, p) => sum + p.net_amount, 0) || 0

      const thisMonthEarnings = payouts?.filter(p => 
        new Date(p.created_at) >= monthStart && p.status === 'paid'
      ).reduce((sum, p) => sum + p.net_amount, 0) || 0

      const result = {
        totalEarnings,
        pendingPayouts,
        paidPayouts,
        completedJobs,
        thisWeekEarnings,
        thisMonthEarnings,
        payouts: payouts || [],
        stripeConnected: profile.stripe_onboarding_completed,
        stripeOnboardingUrl: profile.stripe_dashboard_url || undefined,
      }
      
      console.log('🎆 [EarningsService] Final result:', {
        totalEarnings,
        pendingPayouts, 
        paidPayouts,
        completedJobs,
        payoutsCount: payouts?.length || 0,
        stripeConnected: profile.stripe_onboarding_completed
      })
      
      return result
    } catch (error) {
      console.error('Error fetching employee earnings:', error)
      throw error
    }
  }

  async updateStripeConnectInfo(employeeId: string, updates: {
    stripe_account_id?: string
    stripe_onboarding_completed?: boolean
    stripe_charges_enabled?: boolean
    stripe_payouts_enabled?: boolean
    stripe_dashboard_url?: string
    stripe_connected_at?: string
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)

      if (error) {
        throw new Error(`Failed to update Stripe Connect info: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating Stripe Connect info:', error)
      throw error
    }
  }

  async updatePayoutPreference(employeeId: string, preference: 'standard' | 'instant'): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          payout_preference: preference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)

      if (error) {
        throw new Error(`Failed to update payout preference: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating payout preference:', error)
      throw error
    }
  }

  async getPayoutHistory(employeeId: string, limit = 20): Promise<EmployeePayout[]> {
    try {
      const { data: payouts, error } = await supabase
        .from('employee_payouts')
        .select('*, bookings(*)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch payout history: ${error.message}`)
      }

      return payouts || []
    } catch (error) {
      console.error('Error fetching payout history:', error)
      throw error
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  getStatusColor(status: EmployeePayout['status']): string {
    switch (status) {
      case 'paid':
        return '#10b981'
      case 'pending':
        return '#f59e0b'
      case 'processing':
        return '#3b82f6'
      case 'failed':
        return '#ef4444'
      case 'canceled':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  getStatusText(status: EmployeePayout['status']): string {
    switch (status) {
      case 'paid':
        return 'Paid'
      case 'pending':
        return 'Pending'
      case 'processing':
        return 'Processing'
      case 'failed':
        return 'Failed'
      case 'canceled':
        return 'Canceled'
      default:
        return status
    }
  }
}

export const earningsService = new EarningsService()
