import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '../../../../../middleware/auth'
import PaymentService from '../../../../../lib/payment-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Authenticate the request
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: authResult.message 
      }, { status: 401 })
    }

    const bookingId = params.bookingId

    if (!bookingId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Booking ID is required' 
      }, { status: 400 })
    }

    // Get company ID from authenticated user
    const companyId = authResult.user?.company_id || '550e8400-e29b-41d4-a716-446655440000'

    // Get payment status
    const paymentStatus = await PaymentService.getPaymentStatus(bookingId, companyId)

    return NextResponse.json({
      success: true,
      data: paymentStatus,
      message: 'Payment status retrieved successfully'
    })

  } catch (error) {
    console.error('Error getting payment status:', error)
    
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to get payment status' 
    }, { status: 500 })
  }
}
