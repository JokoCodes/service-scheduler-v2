const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './services/web-api/.env.local' })

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error(`SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ Missing'}`)
    console.error(`SUPABASE_ANON_KEY: ${supabaseKey ? '✅' : '❌ Missing'}`)
    return
  }
  
  console.log(`📍 Connecting to: ${supabaseUrl}`)
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing basic connection...')
    const { data, error } = await supabase.from('companies').select('count').limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      
      if (error.message.includes('relation "companies" does not exist')) {
        console.log('\n💡 Solution: You need to create the database tables!')
        console.log('   Run the SQL from your project/supabase-setup.sql in your Supabase SQL editor')
      }
      return
    }
    
    console.log('✅ Database connection successful!')
    
    // Test 2: Check for admin user
    console.log('\n2️⃣ Checking for admin user...')
    const { data: users } = await supabase.from('users').select('*').eq('role', 'admin')
    
    if (!users || users.length === 0) {
      console.log('❌ No admin user found')
      console.log('\n💡 Solution: Create an admin user:')
      console.log('   1. Go to Supabase Dashboard → Authentication → Users')
      console.log('   2. Add user: admin@demo.com / admin123')  
      console.log('   3. The trigger will automatically create a user profile')
    } else {
      console.log('✅ Admin user found:', users[0].name || users[0].email)
    }
    
    // Test 3: Check sample data
    console.log('\n3️⃣ Checking sample data...')
    const { data: services } = await supabase.from('services').select('count')
    const { data: customers } = await supabase.from('customers').select('count')
    
    console.log(`Services: ${services?.[0]?.count || 0}`)
    console.log(`Customers: ${customers?.[0]?.count || 0}`)
    
    if ((services?.[0]?.count || 0) === 0) {
      console.log('\n💡 Tip: Add sample data with the SQL from DATABASE_SETUP.md')
    }
    
    console.log('\n🎉 Database setup looks good! Try logging in with:')
    console.log('   Email: admin@demo.com')
    console.log('   Password: admin123')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

testConnection()
