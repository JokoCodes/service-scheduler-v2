// Test the fixed job assignment
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cjhdqcvkspqiklkzzxci.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGRxY3Zrc3BxaWtsa3p6eGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjE4MzUsImV4cCI6MjA2NjczNzgzNX0.aBJMX-y0cJcIXNtphZ0EdTxm0FtAP94S8JfS-oj01bc'

const supabase = createClient(supabaseUrl, supabaseKey)

const profileId = 'f945cb10-0e27-4c6d-b945-e0952736579c'

async function testFixedAssignment() {
  console.log('=== TESTING FIXED ASSIGNMENT ===')
  
  try {
    // Step 1: Get employee ID from profile ID (like our service does)
    console.log('\n1. Converting profile ID to employee ID:')
    console.log('   Profile ID:', profileId)
    
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('profile_id', profileId)
      .single()
    
    if (employeeError || !employee) {
      console.error('   Error finding employee:', employeeError)
      return
    }
    
    const employeeId = employee.id
    console.log('   Employee ID:', employeeId)
    
    // Step 2: Get an available booking
    console.log('\n2. Finding available booking:')
    const { data: availableBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, assigned_employee_id, status, customer_name, service_name')
      .is('assigned_employee_id', null)
      .eq('status', 'pending')
      .limit(1)
    
    if (fetchError) {
      console.error('   Error fetching bookings:', fetchError)
      return
    }
    
    if (!availableBookings || availableBookings.length === 0) {
      console.log('   No available bookings found')
      return
    }
    
    const booking = availableBookings[0]
    console.log('   Found booking:', {
      id: booking.id,
      customer: booking.customer_name,
      service: booking.service_name
    })
    
    // Step 3: Test assignment with EMPLOYEE ID (not profile ID)
    console.log('\n3. Testing assignment:')
    console.log('   Assigning employee ID:', employeeId)
    console.log('   To booking ID:', booking.id)
    
    const { data: result, error: assignError } = await supabase
      .from('bookings')
      .update({
        assigned_employee_id: employeeId, // Using employee ID now!
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
    
    console.log('\n4. Assignment result:')
    if (assignError) {
      console.error('   ❌ FAILED:', assignError)
      console.log('   Error code:', assignError.code)
      console.log('   Error message:', assignError.message)
    } else {
      console.log('   ✅ SUCCESS! Assignment completed')
      console.log('   Updated booking:', {
        id: result[0].id,
        assigned_employee_id: result[0].assigned_employee_id,
        status: result[0].status
      })
      
      // Step 5: Clean up by reverting the assignment
      console.log('\n5. Cleaning up (reverting assignment):')
      const { error: revertError } = await supabase
        .from('bookings')
        .update({
          assigned_employee_id: null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id)
        
      if (revertError) {
        console.log('   ⚠️ Could not revert:', revertError)
      } else {
        console.log('   ✅ Assignment reverted successfully')
      }
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testFixedAssignment()
