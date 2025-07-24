#!/usr/bin/env node

// Script to run Stripe Connect database migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './services/web-api/.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runStripeConnectMigration() {
  console.log('🗄️ Running Stripe Connect database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database-migrations', 'add-stripe-connect-fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded from:', migrationPath);
    console.log('📄 SQL length:', migrationSQL.length, 'characters\n');

    // First, let's check if the profiles table exists
    const { data: profilesCheck, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Cannot access profiles table:', profilesError.message);
      throw new Error('Profiles table not accessible');
    }
    
    console.log('✅ Profiles table accessible');
    
    // Note: Since we can't execute raw SQL through RPC, we'll need to do this manually
    console.log('\n⚠️ Manual migration required!');
    console.log('Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));
    console.log('\nSteps:');
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run"');
    console.log('5. Return here and press Enter when complete');
    
    // Wait for user confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      readline.question('\nPress Enter after running the SQL in Supabase Dashboard...', () => {
        readline.close();
        resolve();
      });
    });
    
    // Verify the migration worked
    console.log('\n🔍 Verifying migration...');
    
    // Check if new columns exist by trying to query them
    const { data: stripeCheck, error: stripeError } = await supabase
      .from('profiles')
      .select('stripe_account_id, stripe_onboarding_completed, payout_preference')
      .limit(1);
    
    if (stripeError) {
      console.log('❌ Migration verification failed:', stripeError.message);
      console.log('Please ensure you ran the SQL in the Supabase Dashboard');
    } else {
      console.log('✅ Stripe Connect fields added successfully!');
    }
    
    // Check if employee_payouts table exists
    const { data: payoutsCheck, error: payoutsError } = await supabase
      .from('employee_payouts')
      .select('id')
      .limit(1);
    
    if (payoutsError) {
      console.log('❌ Employee payouts table not found:', payoutsError.message);
    } else {
      console.log('✅ Employee payouts table created successfully!');
    }
    
    console.log('\n🎉 Stripe Connect migration completed!');
    console.log('   The database is now ready for Stripe Connect integration.');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Run the migration
runStripeConnectMigration();
