#!/bin/bash

echo "🔍 Finding real booking data for Stripe testing..."

# First get a valid token
echo "1. Getting authentication token..."
response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "admin123"
  }')

token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$token" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token!"

# Get bookings to find valid booking IDs
echo ""
echo "2. Fetching existing bookings..."
bookings_response=$(curl -s -X GET http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $token")

echo "Bookings response: $bookings_response"

# Try to extract first booking ID (this is a basic approach, might need adjustment)
booking_id=$(echo "$bookings_response" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$booking_id" ]; then
    echo ""
    echo "❌ No bookings found! Creating a test booking first would be needed."
    echo "   For now, let's try testing with the Stripe API directly without booking validation..."
    
    # Test Stripe API directly
    echo ""
    echo "3. Testing Stripe API configuration..."
    
    # Create a simple payment intent with Stripe directly
    node -e "
      const Stripe = require('stripe');
      require('dotenv').config({ path: './services/web-api/.env.local' });
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      console.log('Testing Stripe configuration...');
      console.log('Stripe Secret Key present:', !!process.env.STRIPE_SECRET_KEY);
      console.log('Webhook Secret present:', !!process.env.STRIPE_WEBHOOK_SECRET);
      
      stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { test: 'stripe-integration' }
      }).then((intent) => {
        console.log('✅ Stripe API working! Created test PaymentIntent:', intent.id);
        console.log('   Client Secret:', intent.client_secret.substring(0, 20) + '...');
      }).catch((error) => {
        console.log('❌ Stripe API error:', error.message);
      });
    "
    
else
    echo "✅ Found booking ID: $booking_id"
    
    # Test payment intent creation with real booking ID
    echo ""
    echo "3. Testing payment intent creation with booking ID $booking_id..."
    
    payment_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/payments/create-intent \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "{
        \"bookingId\": $booking_id,
        \"amount\": 5000,
        \"currency\": \"usd\",
        \"description\": \"Test payment for booking #$booking_id\"
      }")
    
    payment_http_code="${payment_response: -3}"
    payment_response_body="${payment_response%???}"
    
    echo "HTTP Status: $payment_http_code"
    echo "Response: $payment_response_body"
    
    if [ "$payment_http_code" = "200" ]; then
        echo "✅ Payment intent created successfully with real booking!"
    else
        echo "❌ Payment intent creation failed"
    fi
fi
