import Stripe from 'stripe'
import { supabase, getAdminClient } from './database'
import type { CreatePaymentIntentRequest, CreatePaymentIntentResponse } from '@service-scheduler/shared-types'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export class PaymentService {
  /**
   * Create a Stripe PaymentIntent for a booking
   */
  static async createPaymentIntent(
    request: CreatePaymentIntentRequest,
    companyId: string
  ): Promise<CreatePaymentIntentResponse> {
    try {
      // Get booking details to validate amount
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', request.bookingId)
        .eq('company_id', companyId)
        .single()

      if (bookingError || !booking) {
        throw new Error('Booking not found')
      }

      // Get the booking amount - check multiple possible fields
      let bookingPrice = Number(booking.total_price) || Number(booking.service_price) || 0
      const requestAmountDollars = request.amount // Frontend sends in dollars
      const requestAmount = Math.round(requestAmountDollars * 100) // Convert to cents for Stripe
      
      console.log('Booking price fields:', {
        total_price: booking.total_price,
        service_price: booking.service_price,
        booking_price_dollars: bookingPrice,
        request_amount_dollars: requestAmountDollars,
        request_amount_cents: requestAmount
      })
      
      // Allow some flexibility in amount matching (within $1)
      const amountDifference = Math.abs(requestAmountDollars - bookingPrice)
      if (amountDifference > 1) { // More than $1 difference
        throw new Error(`Payment amount ($${requestAmountDollars.toFixed(2)}) does not match booking total ($${bookingPrice.toFixed(2)})`)
      }

      // Create or retrieve Stripe customer
      let stripeCustomer: Stripe.Customer | null = null
      
      if (request.customerEmail) {
        // Check if customer already exists
        const existingCustomers = await stripe.customers.list({
          email: request.customerEmail,
          limit: 1,
        })

        if (existingCustomers.data.length > 0) {
          stripeCustomer = existingCustomers.data[0]
        } else {
          // Create new customer
          stripeCustomer = await stripe.customers.create({
            email: request.customerEmail,
            name: booking.customer_name,
            metadata: {
              company_id: companyId,
              booking_id: request.bookingId,
            }
          })
        }
      }

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: requestAmount,
        currency: request.currency || 'usd',
        customer: stripeCustomer?.id,
        metadata: {
          booking_id: request.bookingId,
          company_id: companyId,
          customer_name: booking.customer_name,
          service_name: booking.service_name,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      })

      // Create payment record in database using admin client to bypass RLS
      const adminClient = getAdminClient()
      const { error: paymentError } = await adminClient
        .from('payments')
        .insert({
          booking_id: request.bookingId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: request.amount,
          currency: request.currency || 'usd',
          status: 'pending',
          customer_email: request.customerEmail,
          company_id: companyId,
          metadata: {
            stripe_customer_id: stripeCustomer?.id,
            booking_details: {
              customer_name: booking.customer_name,
              service_name: booking.service_name,
              scheduled_date: booking.scheduled_date,
            }
          }
        })

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError)
        // Continue anyway - we can reconcile later via webhooks
      }

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: request.amount,
        currency: request.currency || 'usd',
      }

    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  /**
   * Handle successful payment (called by webhook)
   */
  static async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.booking_id
      const companyId = paymentIntent.metadata.company_id

      if (!bookingId) {
        throw new Error('No booking ID in payment metadata')
      }

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          payment_method: paymentIntent.charges.data[0]?.payment_method_details?.type || 'card',
          stripe_payment_method_id: paymentIntent.payment_method?.toString(),
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (paymentUpdateError) {
        console.error('Failed to update payment record:', paymentUpdateError)
      }

      // Update booking payment status
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (bookingUpdateError) {
        console.error('Failed to update booking payment status:', bookingUpdateError)
      }

      console.log(`✅ Payment successful for booking ${bookingId}`)

    } catch (error) {
      console.error('Error handling payment success:', error)
      throw error
    }
  }

  /**
   * Handle failed payment (called by webhook)
   */
  static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    try {
      const bookingId = paymentIntent.metadata.booking_id
      const failureReason = paymentIntent.last_payment_error?.message || 'Payment failed'

      // Update payment record
      const { error: paymentUpdateError } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          failure_reason: failureReason,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', paymentIntent.id)

      if (paymentUpdateError) {
        console.error('Failed to update payment record:', paymentUpdateError)
      }

      console.log(`❌ Payment failed for booking ${bookingId}: ${failureReason}`)

    } catch (error) {
      console.error('Error handling payment failure:', error)
      throw error
    }
  }

  /**
   * Get payment status for a booking
   */
  static async getPaymentStatus(bookingId: string, companyId: string) {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !payment) {
        return { status: 'not_found' }
      }

      return {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paid_at,
        failureReason: payment.failure_reason,
      }

    } catch (error) {
      console.error('Error getting payment status:', error)
      throw error
    }
  }

  /**
   * Process refund
   */
  static async processRefund(
    paymentId: string, 
    amount?: number, 
    reason?: string,
    companyId?: string
  ) {
    try {
      // Get payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single()

      if (paymentError || !payment) {
        throw new Error('Payment not found')
      }

      if (companyId && payment.company_id !== companyId) {
        throw new Error('Unauthorized: Payment belongs to different company')
      }

      if (!payment.stripe_payment_intent_id) {
        throw new Error('No Stripe payment intent ID found')
      }

      // Create refund in Stripe
      const refundAmount = amount ? Math.round(amount * 100) : undefined
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: refundAmount,
        reason: reason as any,
        metadata: {
          payment_id: paymentId,
          company_id: payment.company_id,
        }
      })

      // Create refund record
      const { error: refundError } = await supabase
        .from('payment_refunds')
        .insert({
          payment_id: paymentId,
          stripe_refund_id: refund.id,
          amount: refund.amount / 100,
          reason: reason,
          status: 'pending',
        })

      if (refundError) {
        console.error('Failed to create refund record:', refundError)
      }

      return {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        expectedAvailability: refund.status === 'pending' ? '5-10 business days' : undefined,
      }

    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  }
}

export default PaymentService
