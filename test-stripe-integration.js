#!/usr/bin/env node

// Test script for Stripe integration
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testStripeIntegration() {
  console.log('🧪 Testing Stripe Integration...\n');

  try {
    // Test 1: Create a payment intent
    console.log('1. Testing payment intent creation...');
    
    const paymentData = {
      bookingId: 1, // Assuming booking ID 1 exists
      amount: 10000, // $100.00 in cents
      currency: 'usd',
      description: 'Test payment for booking #1'
    };

    const response = await axios.post(`${API_BASE_URL}/api/payments/create-intent`, paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-jwt-for-testing' // We'll need to handle auth
      }
    });

    if (response.data.client_secret) {
      console.log('✅ Payment intent created successfully!');
      console.log(`   Client Secret: ${response.data.client_secret.substring(0, 20)}...`);
      console.log(`   Amount: $${paymentData.amount / 100}`);
    } else {
      console.log('❌ Payment intent creation failed - no client secret returned');
    }

    // Test 2: Check payment status (should return not found for non-existent booking)
    console.log('\n2. Testing payment status endpoint...');
    
    const statusResponse = await axios.get(`${API_BASE_URL}/api/payments/status/999`, {
      headers: {
        'Authorization': 'Bearer fake-jwt-for-testing'
      }
    });

    console.log('✅ Payment status endpoint is accessible');

  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`);
      console.log(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.log('❌ Network Error: No response received');
      console.log('   Make sure the web-api server is running on port 3001');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Check if API server is running first
async function checkApiServer() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const isServerRunning = await checkApiServer();
  
  if (!isServerRunning) {
    console.log('❌ API server is not running on port 3001');
    console.log('   Please start it with: cd services/web-api && npm run dev');
    process.exit(1);
  }

  await testStripeIntegration();
}

main().catch(console.error);
