#!/bin/bash

echo "🧪 Testing Stripe Integration with curl..."
echo ""

# Test 1: Create a payment intent
echo "1. Testing payment intent creation..."

response=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "bookingId": 1,
    "amount": 10000,
    "currency": "usd",
    "description": "Test payment for booking #1"
  }')

# Extract HTTP status code (last 3 characters)
http_code="${response: -3}"
# Extract response body (all but last 3 characters)
response_body="${response%???}"

echo "HTTP Status: $http_code"
echo "Response: $response_body"
echo ""

if [ "$http_code" = "200" ]; then
    echo "✅ Payment intent creation endpoint is working!"
else
    echo "❌ Payment intent creation failed with status $http_code"
fi

echo ""

# Test 2: Check payment status endpoint
echo "2. Testing payment status endpoint..."

status_response=$(curl -s -w "%{http_code}" -X GET http://localhost:3001/api/payments/status/999 \
  -H "Authorization: Bearer test-token")

status_http_code="${status_response: -3}"
status_response_body="${status_response%???}"

echo "HTTP Status: $status_http_code"
echo "Response: $status_response_body"

if [ "$status_http_code" = "404" ] || [ "$status_http_code" = "200" ]; then
    echo "✅ Payment status endpoint is accessible!"
else
    echo "❌ Payment status endpoint returned unexpected status $status_http_code"
fi
