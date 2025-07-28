// Debug script to check bookings table and constraints
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cjhdqcvkspqiklkzzxci.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGRxY3Zrc3BxaWtsa3p6eGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjE4MzUsImV4cCI6MjA2NjczNzgzNX0.aBJMX-y0cJcIXNtphZ0EdTxm0FtAP94S8JfS-oj01bc'

const supabase = createClient(supabaseUrl, supabaseKey)

const profileId = 'f945cb10-0e27-4c6d-b945-e0952736579c'

async function debugBookings() {
  console.log('=== BOOKINGS DEBUG ===')
  console.log('Profile ID:', profileId)
  
  try {
    // 1. Check existing bookings with this profile assigned
    console.log('\n1. Checking existing bookings with this profile assigned:')
    const { data: existingBookings, error: existingError } = await supabase
      .from('bookings')
      .select('id, assigned_employee_id, status, customer_name, service_name')
      .eq('assigned_employee_id', profileId)
    
    console.log('   Error:', existingError)
    console.log('   Count:', existingBookings?.length || 0)
    console.log('   Bookings:', existingBookings)
    
    // 2. Check available bookings (should have null assigned_employee_id)
    console.log('\n2. Checking available bookings:')
    const { data: availableBookings, error: availableError } = await supabase
      .from('bookings')
      .select('id, assigned_employee_id, status, customer_name, service_name')
      .is('assigned_employee_id', null)
      .limit(3)
    
    console.log('   Error:', availableError)
    console.log('   Count:', availableBookings?.length || 0)
    console.log('   Sample bookings:', availableBookings)
    
    // 3. Try to get a specific booking to test assignment
    if (availableBookings && availableBookings.length > 0) {
      const testBookingId = availableBookings[0].id
      console.log('\n3. Testing assignment simulation:')
      console.log('   Test booking ID:', testBookingId)
      console.log('   Profile ID to assign:', profileId)
      
      // Don't actually do the assignment, just show what would happen
      console.log('   Assignment would be:', {
        booking_id: testBookingId,
        assigned_employee_id: profileId,
        status: 'confirmed'
      })
      
      // Check if this profile ID exists (we know it does, but let's confirm)
      const { data: profileExists, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single()
      
      console.log('   Profile exists check:', !!profileExists, profileCheckError)
    }
    
    // 4. Check table structure
    console.log('\n4. Checking if assigned_employee_id column has any constraints:')
    // We can't directly query pg_constraint with anon key, but we can try an invalid assignment
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugBookings()
