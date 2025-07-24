import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import PaymentService from '../../../../lib/payment-service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found in webhook')
      return NextResponse.json({ 
        success: false, 
        message: 'No signature found' 
      }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`✅ Webhook signature verified: ${event.type}`)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid signature' 
      }, { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💳 Payment succeeded: ${paymentIntent.id}`)
        
        await PaymentService.handlePaymentSuccess(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ Payment failed: ${paymentIntent.id}`)
        
        await PaymentService.handlePaymentFailed(paymentIntent)
        break
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`⏹️  Payment canceled: ${paymentIntent.id}`)
        
        // Update payment record to canceled
        // We'll implement this similar to handlePaymentFailed
        break
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        console.log(`⚠️  Dispute created: ${dispute.id}`)
        
        // Handle dispute - notify admin, update records
        // We'll implement dispute handling in Phase 2
        break
      }

      case 'refund.created': {
        const refund = event.data.object as Stripe.Refund
        console.log(`💰 Refund created: ${refund.id}`)
        
        // Update refund status in database
        // Implementation would go here
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        console.log(`👤 Customer created: ${customer.id}`)
        
        // Sync customer data if needed
        break
      }

      default:
        console.log(`🔄 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: 'Webhook processing failed' 
    }, { status: 500 })
  }
}

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs'
