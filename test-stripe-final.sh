#!/bin/bash

echo "🧪 Final Stripe Integration Test with Real Data"
echo "=============================================="

# Get authentication token
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

# Test with first booking (John Smith - House Cleaning - $89)
BOOKING_ID="e4de319f-6250-4927-be60-c4b7f7e8f632"
AMOUNT=8900  # $89.00 in cents
CUSTOMER_EMAIL="john.smith@email.com"

echo ""
echo "2. Testing payment intent creation..."
echo "   Booking ID: $BOOKING_ID"
echo "   Amount: $89.00"
echo "   Customer: $CUSTOMER_EMAIL"

payment_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d "{
    \"bookingId\": \"$BOOKING_ID\",
    \"amount\": $AMOUNT,
    \"currency\": \"usd\",
    \"customerEmail\": \"$CUSTOMER_EMAIL\",
    \"description\": \"House Cleaning Service Payment\"
  }")

payment_http_code="${payment_response: -3}"
payment_response_body="${payment_response%???}"

echo ""
echo "HTTP Status: $payment_http_code"
echo "Response: $payment_response_body"

if [ "$payment_http_code" = "200" ]; then
    echo ""
    echo "✅ SUCCESS! Payment intent created successfully!"
    
    # Extract client secret
    client_secret=$(echo "$payment_response_body" | grep -o '"clientSecret":"[^"]*"' | cut -d'"' -f4)
    payment_intent_id=$(echo "$payment_response_body" | grep -o '"paymentIntentId":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$client_secret" ]; then
        echo "   Client Secret: ${client_secret:0:25}..."
        echo "   Payment Intent ID: $payment_intent_id"
        echo ""
        echo "🎉 Stripe integration is working!"
        echo "   You can now use this client secret in your frontend to accept payments."
    fi
    
    # Test payment status endpoint
    echo ""
    echo "3. Testing payment status endpoint..."
    status_response=$(curl -s -X GET "http://localhost:3001/api/payments/status/$BOOKING_ID" \
      -H "Authorization: Bearer $token")
    
    echo "Payment Status Response: $status_response"
    
else
    echo ""
    echo "❌ Payment intent creation failed"
    echo "   This might be due to:"
    echo "   - Amount mismatch with booking total"
    echo "   - Booking not found"
    echo "   - Stripe configuration issues"
fi

echo ""
echo "=============================================="
echo "🔧 Next Steps:"
echo "1. Start Stripe webhook forwarding: stripe listen --forward-to localhost:3001/api/webhooks/stripe"
echo "2. Test the payment flow in your frontend"
echo "3. Monitor webhook events for payment success/failure"
