export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          phone: string | null
          avatar: string | null
          position: string | null
          hourly_rate: number | null
          is_active: boolean
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
          first_name: string | null
          last_name: string | null
          full_name: string | null
          company_id: string | null
          email: string | null
          role: 'admin' | 'employee' | 'customer'
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
          customer_name: string
          customer_email: string
          customer_phone: string
          service_address: string
          service_id: string | null
          service_name: string
          service_price: number
          service_duration: number
          scheduled_date: string
          scheduled_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          assigned_employee_id: string | null
          assigned_employee_name: string | null
          company_id: string | null
          created_at: string
          updated_at: string
          service_cost: number
          actual_start_time: string | null
          actual_end_time: string | null
          customer_rating: number | null
          customer_feedback: string | null
          payment_required: boolean
          payment_status: string
          deposit_amount: number
          final_amount: number | null
          staff_required: number
          staff_fulfilled: number
          customer_first_name: string | null
          customer_last_name: string | null
          assigned_employee_first_name: string | null
          assigned_employee_last_name: string | null
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          service_address: string
          service_id?: string | null
          service_name: string
          service_price: number
          service_duration: number
          scheduled_date: string
          scheduled_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          assigned_employee_id?: string | null
          assigned_employee_name?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          service_cost?: number
          actual_start_time?: string | null
          actual_end_time?: string | null
          customer_rating?: number | null
          customer_feedback?: string | null
          payment_required?: boolean
          payment_status?: string
          deposit_amount?: number
          final_amount?: number | null
          staff_required?: number
          staff_fulfilled?: number
          customer_first_name?: string | null
          customer_last_name?: string | null
          assigned_employee_first_name?: string | null
          assigned_employee_last_name?: string | null
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          service_address?: string
          service_id?: string | null
          service_name?: string
          service_price?: number
          service_duration?: number
          scheduled_date?: string
          scheduled_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          assigned_employee_id?: string | null
          assigned_employee_name?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          service_cost?: number
          actual_start_time?: string | null
          actual_end_time?: string | null
          customer_rating?: number | null
          customer_feedback?: string | null
          payment_required?: boolean
          payment_status?: string
          deposit_amount?: number
          final_amount?: number | null
          staff_required?: number
          staff_fulfilled?: number
          customer_first_name?: string | null
          customer_last_name?: string | null
          assigned_employee_first_name?: string | null
          assigned_employee_last_name?: string | null
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
          logo_url: string | null
          website_url: string | null
          settings: Record<string, any>
          subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'canceled' | 'past_due'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          website_url?: string | null
          settings?: Record<string, any>
          subscription_plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          website_url?: string | null
          settings?: Record<string, any>
          subscription_plan?: 'free' | 'basic' | 'premium' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'canceled' | 'past_due'
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          position: string | null
          is_active: boolean
          hourly_rate: number
          company_id: string | null
          created_at: string
          updated_at: string
          avg_rating: number
          total_ratings: number
          total_hours_worked: number
          total_bookings_completed: number
          first_name: string | null
          last_name: string | null
          full_name: string | null
          profile_id: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          position?: string | null
          is_active?: boolean
          hourly_rate?: number
          company_id?: string | null
          created_at?: string
          updated_at?: string
          avg_rating?: number
          total_ratings?: number
          total_hours_worked?: number
          total_bookings_completed?: number
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          profile_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          position?: string | null
          is_active?: boolean
          hourly_rate?: number
          company_id?: string | null
          created_at?: string
          updated_at?: string
          avg_rating?: number
          total_ratings?: number
          total_hours_worked?: number
          total_bookings_completed?: number
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          profile_id?: string | null
        }
      }
      booking_staff_assignments: {
        Row: {
          id: string
          booking_id: string
          employee_id: string
          role: string
          status: string
          assigned_at: string
          accepted_at: string | null
          completed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          employee_id: string
          role?: string
          status?: string
          assigned_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          employee_id?: string
          role?: string
          status?: string
          assigned_at?: string
          accepted_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_feedback: {
        Row: {
          id: string
          booking_id: string
          customer_id: string
          rating: number
          feedback: string
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          customer_id: string
          rating: number
          feedback: string
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          customer_id?: string
          rating?: number
          feedback?: string
          created_at?: string
        }
      }
      employee_availability: {
        Row: {
          id: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      job_status_updates: {
        Row: {
          id: string
          booking_id: string
          employee_id: string
          status: string
          notes: string | null
          latitude: number | null
          longitude: number | null
          customer_signature: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          booking_id: string
          employee_id: string
          status: string
          notes?: string | null
          latitude?: number | null
          longitude?: number | null
          customer_signature?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          booking_id?: string
          employee_id?: string
          status?: string
          notes?: string | null
          latitude?: number | null
          longitude?: number | null
          customer_signature?: string | null
          timestamp?: string
        }
      }
      notifications: {
        Row: {
          id: string
          type: string
          title: string
          message: string
          is_read: boolean
          priority: string
          metadata: Record<string, any> | null
          company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          message: string
          is_read?: boolean
          priority?: string
          metadata?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          priority?: string
          metadata?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          duration: number
          price: number
          category: string | null
          is_active: boolean
          pricing_type: 'flat' | 'hourly'
          hourly_rate: number | null
          custom_pricing: Record<string, any> | null
          company_id: string | null
          created_at: string
          updated_at: string
          cost: number
          avg_rating: number
          total_ratings: number
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          duration: number
          price: number
          category?: string | null
          is_active?: boolean
          pricing_type?: 'flat' | 'hourly'
          hourly_rate?: number | null
          custom_pricing?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          cost?: number
          avg_rating?: number
          total_ratings?: number
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          duration?: number
          price?: number
          category?: string | null
          is_active?: boolean
          pricing_type?: 'flat' | 'hourly'
          hourly_rate?: number | null
          custom_pricing?: Record<string, any> | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          cost?: number
          avg_rating?: number
          total_ratings?: number
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          notes: string | null
          total_bookings: number
          total_spent: number
          last_booking_date: string | null
          company_id: string | null
          created_at: string
          updated_at: string
          avg_rating: number
          first_booking_date: string | null
          customer_since: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          total_bookings?: number
          total_spent?: number
          last_booking_date?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          avg_rating?: number
          first_booking_date?: string | null
          customer_since?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          notes?: string | null
          total_bookings?: number
          total_spent?: number
          last_booking_date?: string | null
          company_id?: string | null
          created_at?: string
          updated_at?: string
          avg_rating?: number
          first_booking_date?: string | null
          customer_since?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
        }
      }
      employee_locations: {
        Row: {
          id: string
          employee_id: string
          latitude: number
          longitude: number
          is_active: boolean
          timestamp: string
        }
        Insert: {
          id?: string
          employee_id: string
          latitude: number
          longitude: number
          is_active?: boolean
          timestamp?: string
        }
        Update: {
          id?: string
          employee_id?: string
          latitude?: number
          longitude?: number
          is_active?: boolean
          timestamp?: string
        }
      }
      employee_skills: {
        Row: {
          id: string
          employee_id: string
          skill: string
          level: string | null
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          skill: string
          level?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          skill?: string
          level?: string | null
          created_at?: string
        }
      }
      payment_refunds: {
        Row: {
          id: string
          payment_id: string
          stripe_refund_id: string | null
          amount: number
          reason: string | null
          status: 'pending' | 'succeeded' | 'failed' | 'canceled'
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          payment_id: string
          stripe_refund_id?: string | null
          amount: number
          reason?: string | null
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          payment_id?: string
          stripe_refund_id?: string | null
          amount?: number
          reason?: string | null
          status?: 'pending' | 'succeeded' | 'failed' | 'canceled'
          created_at?: string
          processed_at?: string | null
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
