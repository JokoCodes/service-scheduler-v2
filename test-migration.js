#!/usr/bin/env node

// Script to test that the migration worked
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './services/web-api/.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testMigration() {
  console.log('🔍 Testing database migration...\n');

  try {
    // Test 1: Check if payments table exists
    console.log('1. Testing payments table...');
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (paymentsError) {
      console.log('   ❌ Payments table:', paymentsError.message);
    } else {
      console.log('   ✅ Payments table: Available');
    }

    // Test 2: Check if payment_refunds table exists
    console.log('2. Testing payment_refunds table...');
    const { data: refundsData, error: refundsError } = await supabase
      .from('payment_refunds')
      .select('*')
      .limit(1);

    if (refundsError) {
      console.log('   ❌ Payment_refunds table:', refundsError.message);
    } else {
      console.log('   ✅ Payment_refunds table: Available');
    }

    // Test 3: Check if bookings table has new payment columns
    console.log('3. Testing bookings table payment columns...');
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('payment_status, payment_required, deposit_amount, final_amount')
      .limit(1);

    if (bookingsError) {
      console.log('   ❌ Bookings payment columns:', bookingsError.message);
    } else {
      console.log('   ✅ Bookings payment columns: Available');
      if (bookingsData && bookingsData.length > 0) {
        console.log('   📊 Sample data:', {
          payment_status: bookingsData[0].payment_status,
          payment_required: bookingsData[0].payment_required
        });
      }
    }

    console.log('\n🎉 Migration verification completed!');
    
    // Check if there are any errors
    const hasErrors = paymentsError || refundsError || bookingsError;
    if (hasErrors) {
      console.log('⚠️  Some tables may not have been created properly.');
      console.log('   Please check the Supabase SQL Editor for any error messages.');
    } else {
      console.log('✅ All payment tables and columns are ready!');
      console.log('   You can now test the full payment flow.');
    }

  } catch (error) {
    console.error('❌ Migration test failed:', error.message);
  }
}

testMigration();
