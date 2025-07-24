const API_BASE = 'http://localhost:3001'

async function testLogin() {
  try {
    console.log('🧪 Testing login...')
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@demo.com',
        password: 'admin123',
        role: 'admin'  // Specify the role we expect
      })
    })
    
    const data = await response.json()
    
    console.log('📊 Response status:', response.status)
    console.log('📝 Response data:', JSON.stringify(data, null, 2))
    
    if (data.success && data.data) {
      console.log('\n✅ Login successful!')
      console.log('👤 User info:', data.data.user)
      console.log('🎭 User role:', data.data.user.role)
      console.log('🔑 Token present:', !!data.data.token)
    } else {
      console.log('\n❌ Login failed!')
      console.log('💥 Error:', data.message)
      if (data.errors) {
        console.log('🚨 Errors:', data.errors)
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
}

testLogin()
