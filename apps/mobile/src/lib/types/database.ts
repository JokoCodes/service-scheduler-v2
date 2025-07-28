export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          company_id: string | null
          role: 'admin' | 'employee' | 'customer'
          avatar_url: string | null
          created_at: string
          updated_at: string
          // Stripe Connect fields
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean
          stripe_charges_enabled: boolean
          stripe_payouts_enabled: boolean
          payout_preference: 'standard' | 'instant'
          stripe_connected_at: string | null
          stripe_dashboard_url: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          company_id?: string | null
          role?: 'admin' | 'employee' | 'customer'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          payout_preference?: 'standard' | 'instant'
          stripe_connected_at?: string | null
          stripe_dashboard_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company_id?: string | null
          role?: 'admin' | 'employee' | 'customer'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean
          stripe_charges_enabled?: boolean
          stripe_payouts_enabled?: boolean
          payout_preference?: 'standard' | 'instant'
          stripe_connected_at?: string | null
          stripe_dashboard_url?: string | null
        }
      }
      bookings: {
        Row: {
          id: string
          customer_id: string
          assigned_employee_id: string | null
          company_id: string
          service_name: string
          service_address: string
          scheduled_date: string
          scheduled_time: string
          duration_minutes: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
          // Payment fields
          payment_required: boolean
          payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          deposit_amount: number
          final_amount: number | null
        }
        Insert: {
          id?: string
          customer_id: string
          assigned_employee_id?: string | null
          company_id: string
          service_name: string
          service_address: string
          scheduled_date: string
          scheduled_time: string
          duration_minutes: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
          payment_required?: boolean
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          deposit_amount?: number
          final_amount?: number | null
        }
        Update: {
          id?: string
          customer_id?: string
          assigned_employee_id?: string | null
          company_id?: string
          service_name?: string
          service_address?: string
          scheduled_date?: string
          scheduled_time?: string
          duration_minutes?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
          payment_required?: boolean
          payment_status?: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
          deposit_amount?: number
          final_amount?: number | null
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          payment_method: string | null
          stripe_payment_method_id: string | null
          failure_reason: string | null
          customer_email: string | null
          metadata: Record<string, any> | null
          company_id: string | null
          created_at: string
          updated_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          stripe_payment_intent_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          payment_method?: string | null
          stripe_payment_method_id?: string | null
          failure_reason?: string | null
          customer_email?: string | null
          metadata?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          stripe_payment_intent_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
          payment_method?: string | null
          stripe_payment_method_id?: string | null
          failure_reason?: string | null
          customer_email?: string | null
          metadata?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          paid_at?: string | null
        }
      }
      employee_payouts: {
        Row: {
          id: string
          employee_id: string
          booking_id: string
          stripe_transfer_id: string | null
          amount: number
          fee_amount: number
          net_amount: number
          payout_type: 'standard' | 'instant'
          status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          booking_id: string
          stripe_transfer_id?: string | null
          amount: number
          fee_amount?: number
          net_amount: number
          payout_type?: 'standard' | 'instant'
          status?: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          booking_id?: string
          stripe_transfer_id?: string | null
          amount?: number
          fee_amount?: number
          net_amount?: number
          payout_type?: 'standard' | 'instant'
          status?: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Enums: {
      user_role: 'admin' | 'employee' | 'customer'
      booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
      payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
      stripe_payment_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
      payout_preference: 'standard' | 'instant'
      payout_status: 'pending' | 'processing' | 'paid' | 'failed' | 'canceled'
    }
  }
}
