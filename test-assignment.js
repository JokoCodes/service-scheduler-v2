// Test actual assignment to get the exact error
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cjhdqcvkspqiklkzzxci.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGRxY3Zrc3BxaWtsa3p6eGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjE4MzUsImV4cCI6MjA2NjczNzgzNX0.aBJMX-y0cJcIXNtphZ0EdTxm0FtAP94S8JfS-oj01bc'

const supabase = createClient(supabaseUrl, supabaseKey)

const profileId = 'f945cb10-0e27-4c6d-b945-e0952736579c'

async function testAssignment() {
  console.log('=== ASSIGNMENT TEST ===')
  
  try {
    // Get an available booking
    const { data: availableBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, assigned_employee_id, status, customer_name, service_name')
      .is('assigned_employee_id', null)
      .eq('status', 'pending')  // Only get pending jobs
      .limit(1)
    
    if (fetchError) {
      console.error('Error fetching bookings:', fetchError)
      return
    }
    
    if (!availableBookings || availableBookings.length === 0) {
      console.log('No available bookings found')
      return
    }
    
    const booking = availableBookings[0]
    console.log('Testing assignment for booking:', {
      id: booking.id,
      customer: booking.customer_name,
      service: booking.service_name,
      current_status: booking.status
    })
    
    console.log('Assigning to profile:', profileId)
    
    // Attempt the assignment (this should replicate the mobile app logic)
    const { data: result, error: assignError } = await supabase
      .from('bookings')
      .update({
        assigned_employee_id: profileId,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
    
    console.log('\nAssignment result:')
    console.log('Success:', !!result)
    console.log('Error:', assignError)
    console.log('Updated data:', result)
    
    if (assignError) {
      console.log('\nDetailed error analysis:')
      console.log('Error code:', assignError.code)
      console.log('Error message:', assignError.message)
      console.log('Error details:', assignError.details)
      console.log('Error hint:', assignError.hint)
    }
    
    // If successful, clean up by reverting the assignment
    if (result && !assignError) {
      console.log('\n✅ Assignment successful! Reverting for cleanup...')
      const { error: revertError } = await supabase
        .from('bookings')
        .update({
          assigned_employee_id: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        
      if (revertError) {
        console.log('⚠️ Warning: Could not revert assignment:', revertError)
      } else {
        console.log('✅ Assignment reverted successfully')
      }
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testAssignment()
