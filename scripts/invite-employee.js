/**
 * Script to invite employee via Supabase Admin API
 * Run this after executing the SQL sync script
 * 
 * Usage: node scripts/invite-employee.js
 */

const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

async function inviteEmployee() {
  // Create admin client (requires service role key)
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Sending invitation to emanjoko@yahoo.com...')
    
    // Send invitation email
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      'emanjoko@yahoo.com',
      {
        data: {
          name: 'Eman Joko',
          role: 'employee'
        },
        redirectTo: 'your-mobile-app://auth/callback' // Adjust for your mobile app
      }
    )

    if (error) {
      console.error('Error sending invitation:', error.message)
      return
    }

    console.log('✅ Invitation sent successfully!')
    console.log('User details:', {
      id: data.user.id,
      email: data.user.email,
      invited_at: data.user.invited_at
    })
    
    console.log('\n📧 Next steps:')
    console.log('1. Check emanjoko@yahoo.com for the invitation email')
    console.log('2. User should click the invitation link to set their password')
    console.log('3. User can then log into the mobile app')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Alternative method: Create user with temporary password
async function createUserWithPassword() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('Creating user with temporary password...')
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'emanjoko@yahoo.com',
      password: 'TempPassword123!', // User should change this
      user_metadata: {
        name: 'Eman Joko',
        role: 'employee'
      },
      email_confirm: true // Skip email confirmation
    })

    if (error) {
      console.error('Error creating user:', error.message)
      return
    }

    console.log('✅ User created successfully!')
    console.log('User details:', {
      id: data.user.id,
      email: data.user.email
    })
    
    console.log('\n🔑 Login credentials:')
    console.log('Email: emanjoko@yahoo.com')
    console.log('Password: TempPassword123!')
    console.log('⚠️ User should change password after first login')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Main execution
if (require.main === module) {
  const method = process.argv[2] || 'invite'
  
  if (method === 'invite') {
    inviteEmployee()
  } else if (method === 'create') {
    createUserWithPassword()
  } else {
    console.log('Usage:')
    console.log('  node scripts/invite-employee.js invite    # Send invitation email')
    console.log('  node scripts/invite-employee.js create    # Create with temp password')
  }
}

module.exports = { inviteEmployee, createUserWithPassword }
