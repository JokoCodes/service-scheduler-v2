import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '../../../../middleware/auth'
import PaymentService from '../../../../lib/payment-service'
import type { CreatePaymentIntentRequest } from '@service-scheduler/shared-types'

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const body = await request.json() as CreatePaymentIntentRequest

    // Validate required fields
    if (!body.bookingId || !body.amount) {
      return NextResponse.json({ 
        success: false, 
        message: 'bookingId and amount are required' 
      }, { status: 400 })
    }

    if (body.amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Amount must be greater than 0' 
      }, { status: 400 })
    }

    // Get company ID from authenticated user
    const companyId = authResult.user?.company_id || '550e8400-e29b-41d4-a716-446655440000'

    console.log('Creating payment intent for booking:', body.bookingId, 'Amount:', body.amount)

    // Create payment intent
    const paymentIntent = await PaymentService.createPaymentIntent(body, companyId)

    return NextResponse.json({
      success: true,
      data: paymentIntent,
      message: 'Payment intent created successfully'
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create payment intent' 
    }, { status: 500 })
  }
}
