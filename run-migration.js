#!/usr/bin/env node

// Script to run database migration
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

async function runMigration() {
  console.log('🗄️ Running payments database migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, 'database-migrations', '001_payments_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration SQL loaded from:', migrationPath);
    console.log('📄 SQL length:', migrationSQL.length, 'characters');
    console.log('');

    // Execute the migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');

    // Verify the tables were created
    console.log('🔍 Verifying table creation...');
    
    const tables = ['payments', 'payment_refunds'];
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (tableError) {
        console.log(`❌ Table ${table}: ${tableError.message}`);
      } else {
        console.log(`✅ Table ${table}: Created successfully`);
      }
    }

    // Check if bookings table has new columns
    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('payment_status, payment_required')
      .limit(1);

    if (bookingsError) {
      console.log('❌ Bookings table columns: Failed to verify');
    } else {
      console.log('✅ Bookings table: Payment columns added');
    }

    console.log('');
    console.log('🎉 Database migration completed successfully!');
    console.log('   You can now use the full payment processing features.');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Alternative function if exec_sql doesn't exist
async function runMigrationManually() {
  console.log('⚠️  The exec_sql function is not available.');
  console.log('   You need to run the migration manually in the Supabase SQL Editor.');
  console.log('');
  console.log('📋 Follow these steps:');
  console.log('1. Open your Supabase dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the following SQL:');
  console.log('');
  console.log('=' .repeat(60));
  
  const migrationPath = path.join(__dirname, 'database-migrations', '001_payments_schema.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(migrationSQL);
  
  console.log('=' .repeat(60));
  console.log('');
  console.log('4. Click "Run" to execute the migration');
}

// Run the migration
runMigration().catch(() => {
  runMigrationManually();
});
