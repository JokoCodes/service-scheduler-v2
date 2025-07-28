// Check employees table structure
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cjhdqcvkspqiklkzzxci.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqaGRxY3Zrc3BxaWtsa3p6eGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExNjE4MzUsImV4cCI6MjA2NjczNzgzNX0.aBJMX-y0cJcIXNtphZ0EdTxm0FtAP94S8JfS-oj01bc'

const supabase = createClient(supabaseUrl, supabaseKey)

const profileId = 'f945cb10-0e27-4c6d-b945-e0952736579c'

async function debugEmployees() {
  console.log('=== EMPLOYEES TABLE DEBUG ===')
  console.log('Profile ID:', profileId)
  
  try {
    // Check all employees
    console.log('\n1. All employees in the database:')
    const { data: allEmployees, error: allError } = await supabase
      .from('employees')
      .select('*')
    
    console.log('   Error:', allError)
    console.log('   Count:', allEmployees?.length || 0)
    console.log('   Employees:', allEmployees)
    
    // Check if our profile exists as an employee
    console.log('\n2. Looking for our profile as an employee:')
    const { data: ourEmployee, error: ourError } = await supabase
      .from('employees')
      .select('*')
      .eq('profile_id', profileId)
    
    console.log('   Error:', ourError)
    console.log('   Found:', !!ourEmployee && ourEmployee.length > 0)
    console.log('   Employee data:', ourEmployee)
    
    // Also check by id (in case constraint is by employee.id not profile_id)
    console.log('\n3. Looking for employee with id matching our profile ID:')
    const { data: employeeById, error: byIdError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', profileId)
    
    console.log('   Error:', byIdError)
    console.log('   Found:', !!employeeById && employeeById.length > 0)
    console.log('   Employee data:', employeeById)
    
    // Check what profile_ids exist in employees table
    console.log('\n4. Profile IDs that exist in employees table:')
    const { data: employeeProfiles, error: profilesError } = await supabase
      .from('employees')
      .select('id, profile_id, name, email')
    
    console.log('   Error:', profilesError)
    console.log('   Employee profile mappings:', employeeProfiles)
    
  } catch (error) {
    console.error('Debug error:', error)
  }
}

debugEmployees()
