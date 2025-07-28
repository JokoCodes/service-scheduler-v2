// Debug script to check user profile existence
// Run with: node debug-profile.js

const { createClient } = require('@supabase/supabase-js')

// Use the actual Supabase instance from mobile config
const supabaseUrl = 'https://cjhdqcvkspqiklkzzxci.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGRxY3Zrc3BxaWtsa3p6eGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjE4MzUsImV4cCI6MjA2NjczNzgzNX0.aBJMX-y0cJcIXNtphZ0EdTxm0FtAP94S8JfS-oj01bc'

const supabase = createClient(supabaseUrl, supabaseKey)

const profileId = 'f945cb10-0e27-4c6d-b945-e0952736579c'

async function checkProfile() {
  console.log('=== PROFILE DEBUG ===')
  console.log('Profile ID to check:', profileId)
  console.log('Supabase URL:', supabaseUrl)
  
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()
    
    console.log('\n1. Profile lookup result:')
    console.log('   Found:', !!profile)
    console.log('   Error:', profileError)
    
    if (profile) {
      console.log('   Profile data:', {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        created_at: profile.created_at
      })
    }
    
    // Check auth.users table to see if user exists there
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profileId)
    console.log('\n2. Auth user lookup result:')
    console.log('   Found:', !!authUser?.user)
    console.log('   Error:', authError)
    
    if (authUser?.user) {
      console.log('   Auth user data:', {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at
      })
    }
    
    // Check all profiles to see what exists
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .limit(5)
    
    console.log('\n3. All profiles sample:')
    console.log('   Error:', allError)
    console.log('   Count:', allProfiles?.length || 0)
    console.log('   Sample profiles:', allProfiles)
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

checkProfile()
