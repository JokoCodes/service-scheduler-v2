#!/bin/bash

echo "🔑 Getting authentication token..."

# Login to get a valid JWT token
response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "admin123"
  }')

echo "Login response: $response"
echo ""

# Extract token from response (assuming it's in the format {"success":true,"token":"...","user":...})
token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$token" ]; then
    echo "✅ Got authentication token!"
    echo "Token: ${token:0:20}..."
    
    # Now test the Stripe endpoints with the real token
    echo ""
    echo "🧪 Testing Stripe endpoints with valid token..."
    
    # Test payment intent creation
    echo ""
    echo "1. Creating payment intent..."
    payment_response=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/payments/create-intent \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d '{
        "bookingId": 1,
        "amount": 10000,
        "currency": "usd",
        "description": "Test payment for booking #1"
      }')
    
    payment_http_code="${payment_response: -3}"
    payment_response_body="${payment_response%???}"
    
    echo "HTTP Status: $payment_http_code"
    echo "Response: $payment_response_body"
    
    if [ "$payment_http_code" = "200" ]; then
        echo "✅ Payment intent created successfully!"
    else
        echo "❌ Payment intent creation failed"
    fi
    
else
    echo "❌ Failed to get authentication token"
    echo "Make sure the web app is running and admin@demo.com user exists"
fi
