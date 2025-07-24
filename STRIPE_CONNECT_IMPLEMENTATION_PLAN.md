# Stripe Connect Implementation Plan for Employee Payouts

## 📋 Overview

This plan details implementing Stripe Connect to handle employee payouts directly within the app, replacing the current manual payout methods (bank, PayPal, Venmo).

## 🎯 Key Benefits of Stripe Connect

- **Automated Payouts**: No manual processing of employee payments
- **Tax Compliance**: Automatic 1099 generation for contractors
- **Security**: Stripe handles sensitive financial data
- **Transparency**: Real-time payout status and history
- **Flexibility**: Instant or standard payouts based on preference

## 🛠 Technical Architecture

### Database Schema Updates

```sql
-- Add Stripe Connect fields to profiles table
ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN stripe_onboarding_url TEXT;
ALTER TABLE profiles ADD COLUMN stripe_dashboard_url TEXT;
ALTER TABLE profiles ADD COLUMN payout_preference TEXT DEFAULT 'standard' CHECK (payout_preference IN ('standard', 'instant'));
ALTER TABLE profiles ADD COLUMN stripe_connected_at TIMESTAMP WITH TIME ZONE;

-- Create payouts tracking table
CREATE TABLE employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_transfer_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0, -- For instant payouts
  net_amount DECIMAL(10,2) NOT NULL,
  payout_type TEXT NOT NULL DEFAULT 'standard', -- 'standard' or 'instant'
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, paid, failed
  failure_reason TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payout_type_check CHECK (payout_type IN ('standard', 'instant')),
  CONSTRAINT payout_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'canceled'))
);
```

## 📱 Mobile App Profile Updates

### Updated Profile Interface
```typescript
interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  rating: number
  totalJobs: number
  joinDate: string
  profileImage?: string
  
  // Stripe Connect fields
  stripeAccountId?: string
  stripeOnboardingCompleted: boolean
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
  stripeOnboardingUrl?: string
  stripeDashboardUrl?: string
  payoutPreference: 'standard' | 'instant'
  stripeConnectedAt?: string
  
  // Keep for backward compatibility during transition
  legacyPayoutMethod?: 'bank' | 'paypal' | 'venmo'
  bankDetails?: {
    accountHolderName: string
    routingNumber: string
    accountNumber: string
  }
  paypalEmail?: string
  venmoUsername?: string
}
```

### Profile Screen Updates
```typescript
// Add to profile.tsx

const renderStripeConnectSection = () => {
  if (!profile.stripeOnboardingCompleted) {
    return (
      <View style={styles.stripeSection}>
        <Text style={styles.sectionTitle}>Payment Setup Required</Text>
        <Text style={styles.sectionSubtitle}>
          Connect your bank account to receive payments directly
        </Text>
        
        <TouchableOpacity 
          style={styles.connectStripeButton}
          onPress={handleStripeConnect}
        >
          <Ionicons name="card" size={20} color="#ffffff" />
          <Text style={styles.connectStripeText}>Connect Bank Account</Text>
        </TouchableOpacity>
        
        <View style={styles.stripeInfo}>
          <Text style={styles.infoText}>
            • Secure setup through Stripe
          </Text>
          <Text style={styles.infoText}>
            • Get paid automatically after job completion
          </Text>
          <Text style={styles.infoText}>
            • Choose standard (free) or instant payouts
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.stripeSection}>
      <Text style={styles.sectionTitle}>Payment Settings</Text>
      
      <View style={styles.stripeConnected}>
        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
        <View style={styles.stripeInfo}>
          <Text style={styles.connectedText}>Bank Account Connected</Text>
          <Text style={styles.connectedSubtext}>
            Ready to receive payments
          </Text>
        </View>
      </View>
      
      {/* Payout Preference */}
      <View style={styles.payoutPreference}>
        <Text style={styles.preferenceTitle}>Payout Speed</Text>
        
        <TouchableOpacity
          style={[
            styles.preferenceOption,
            profile.payoutPreference === 'standard' && styles.preferenceActive
          ]}
          onPress={() => updatePayoutPreference('standard')}
        >
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Standard (Free)</Text>
            <Text style={styles.preferenceDescription}>
              2-7 business days • No fees
            </Text>
          </View>
          <Ionicons 
            name={profile.payoutPreference === 'standard' ? 'radio-button-on' : 'radio-button-off'}
            size={20} 
            color={profile.payoutPreference === 'standard' ? '#3b82f6' : '#9ca3af'}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.preferenceOption,
            profile.payoutPreference === 'instant' && styles.preferenceActive
          ]}
          onPress={() => updatePayoutPreference('instant')}
        >
          <View style={styles.preferenceContent}>
            <Text style={styles.preferenceLabel}>Instant</Text>
            <Text style={styles.preferenceDescription}>
              Within minutes • 1.5% fee
            </Text>
          </View>
          <Ionicons 
            name={profile.payoutPreference === 'instant' ? 'radio-button-on' : 'radio-button-off'}
            size={20} 
            color={profile.payoutPreference === 'instant' ? '#3b82f6' : '#9ca3af'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Account Management */}
      <View style={styles.accountActions}>
        <TouchableOpacity 
          style={styles.dashboardButton}
          onPress={handleOpenStripeDashboard}
        >
          <Ionicons name="analytics" size={16} color="#6b7280" />
          <Text style={styles.dashboardButtonText}>View Stripe Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.disconnectButton}
          onPress={handleDisconnectStripe}
        >
          <Ionicons name="unlink" size={16} color="#ef4444" />
          <Text style={styles.disconnectButtonText}>Disconnect Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// Handler functions
const handleStripeConnect = async () => {
  try {
    setLoading(true)
    
    // Call backend API to create Stripe Connect account
    const response = await fetch('/api/stripe/create-connect-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        email: profile.email,
        businessProfile: {
          name: profile.name,
          support_email: profile.email
        }
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      // Open Stripe onboarding in browser
      Linking.openURL(result.data.onboardingUrl)
      
      // Update profile with onboarding URL
      setProfile(prev => ({
        ...prev,
        stripeOnboardingUrl: result.data.onboardingUrl,
        stripeAccountId: result.data.accountId
      }))
    } else {
      Alert.alert('Error', result.message)
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to connect Stripe account')
  } finally {
    setLoading(false)
  }
}

const updatePayoutPreference = async (preference: 'standard' | 'instant') => {
  try {
    const response = await fetch('/api/profile/payout-preference', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ payoutPreference: preference })
    })
    
    if (response.ok) {
      setProfile(prev => ({ ...prev, payoutPreference: preference }))
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to update payout preference')
  }
}
```

## 🔧 Backend API Endpoints

### 1. Create Stripe Connect Account
```typescript
// /api/stripe/create-connect-account/route.ts
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    const { email, businessProfile } = await request.json()
    
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        product_description: 'Service scheduling and home services',
        ...businessProfile
      }
    })
    
    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/profile?refresh=true`,
      return_url: `${process.env.FRONTEND_URL}/profile?connected=true`,
      type: 'account_onboarding',
    })
    
    // Save to database
    await db.query(
      'UPDATE profiles SET stripe_account_id = $1, stripe_onboarding_url = $2 WHERE id = $3',
      [account.id, accountLink.url, authResult.user.id]
    )
    
    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url
      }
    })
  } catch (error) {
    console.error('Stripe Connect creation error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create Stripe account' 
    }, { status: 500 })
  }
}
```

### 2. Check Stripe Account Status
```typescript
// /api/stripe/account-status/route.ts
export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user's Stripe account ID from database
    const user = await db.query(
      'SELECT stripe_account_id FROM profiles WHERE id = $1',
      [authResult.user.id]
    )
    
    if (!user.rows[0]?.stripe_account_id) {
      return NextResponse.json({
        success: true,
        data: { connected: false }
      })
    }
    
    // Check Stripe account status
    const account = await stripe.accounts.retrieve(user.rows[0].stripe_account_id)
    
    const isComplete = account.details_submitted && 
                      account.charges_enabled && 
                      account.payouts_enabled
    
    // Update database with current status
    await db.query(`
      UPDATE profiles 
      SET 
        stripe_onboarding_completed = $1,
        stripe_charges_enabled = $2,
        stripe_payouts_enabled = $3,
        stripe_dashboard_url = $4
      WHERE id = $5
    `, [
      isComplete,
      account.charges_enabled,
      account.payouts_enabled,
      account.charges_enabled ? `https://dashboard.stripe.com/express/accounts/${account.id}` : null,
      authResult.user.id
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        connected: isComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
        dashboardUrl: account.charges_enabled ? `https://dashboard.stripe.com/express/accounts/${account.id}` : null
      }
    })
  } catch (error) {
    console.error('Stripe account status error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check account status' 
    }, { status: 500 })
  }
}
```

### 3. Process Employee Payout
```typescript
// /api/stripe/process-payout/route.ts
export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  try {
    const { bookingId, employeeId, amount, payoutType = 'standard' } = await request.json()
    
    // Get employee's Stripe account
    const employee = await db.query(
      'SELECT stripe_account_id, stripe_payouts_enabled FROM profiles WHERE id = $1',
      [employeeId]
    )
    
    if (!employee.rows[0]?.stripe_account_id || !employee.rows[0].stripe_payouts_enabled) {
      throw new Error('Employee Stripe account not ready for payouts')
    }
    
    const stripeAccountId = employee.rows[0].stripe_account_id
    
    // Calculate fees for instant payouts
    let feeAmount = 0
    let netAmount = amount
    
    if (payoutType === 'instant') {
      feeAmount = Math.round(amount * 0.015) // 1.5% fee
      netAmount = amount - feeAmount
    }
    
    // Create transfer to employee's account
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100), // Convert to cents
      currency: 'usd',
      destination: stripeAccountId,
      metadata: {
        booking_id: bookingId,
        employee_id: employeeId,
        payout_type: payoutType
      }
    })
    
    // For instant payouts, trigger immediate payout
    if (payoutType === 'instant') {
      await stripe.payouts.create({
        amount: Math.round(netAmount * 100),
        currency: 'usd',
        method: 'instant'
      }, {
        stripeAccount: stripeAccountId
      })
    }
    
    // Record payout in database
    await db.query(`
      INSERT INTO employee_payouts (
        employee_id, booking_id, stripe_transfer_id, 
        amount, fee_amount, net_amount, payout_type, status,
        scheduled_at, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      employeeId, bookingId, transfer.id,
      amount, feeAmount, netAmount, payoutType, 'processing',
      new Date(), payoutType === 'instant' ? new Date() : null
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        transferId: transfer.id,
        netAmount,
        feeAmount,
        payoutType
      }
    })
  } catch (error) {
    console.error('Payout processing error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to process payout' 
    }, { status: 500 })
  }
}
```

## 💰 Payout Processing Logic

### Automatic Payouts After Job Completion
```typescript
// /api/jobs/complete/route.ts
export async function POST(request: NextRequest) {
  try {
    const { bookingId, employeeId } = await request.json()
    
    // Mark job as completed
    await db.query(
      'UPDATE bookings SET status = $1, completed_at = $2 WHERE id = $3',
      ['completed', new Date(), bookingId]
    )
    
    // Calculate employee earnings
    const booking = await db.query(`
      SELECT b.*, s.price, p.hourly_rate, p.commission_rate, p.payout_preference
      FROM bookings b 
      JOIN services s ON b.service_id = s.id
      JOIN profiles p ON b.assigned_employee_id = p.id
      WHERE b.id = $1
    `, [bookingId])
    
    if (booking.rows.length === 0) {
      throw new Error('Booking not found')
    }
    
    const bookingData = booking.rows[0]
    const hoursWorked = calculateHoursWorked(bookingData)
    const baseAmount = hoursWorked * bookingData.hourly_rate
    const commissionAmount = bookingData.price * (bookingData.commission_rate || 0)
    const totalAmount = baseAmount + commissionAmount
    
    // Process payout based on employee preference
    await fetch('/api/stripe/process-payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId,
        employeeId,
        amount: totalAmount,
        payoutType: bookingData.payout_preference
      })
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job completion error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 })
  }
}
```

## 🔄 Migration Strategy

### 1. Database Migration
```sql
-- Migration script to add Stripe Connect fields
BEGIN;

-- Add new columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_dashboard_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payout_preference TEXT DEFAULT 'standard';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;

-- Create payouts table
CREATE TABLE IF NOT EXISTS employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_transfer_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'pending',
  failure_reason TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT payout_type_check CHECK (payout_type IN ('standard', 'instant')),
  CONSTRAINT payout_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'canceled'))
);

-- Add constraints
ALTER TABLE profiles ADD CONSTRAINT payout_preference_check 
  CHECK (payout_preference IN ('standard', 'instant'));

COMMIT;
```

### 2. Gradual Rollout
1. **Phase 1**: Add Stripe Connect fields to profile without removing existing payout methods
2. **Phase 2**: Prompt existing users to connect Stripe accounts
3. **Phase 3**: Make Stripe Connect mandatory for new employees
4. **Phase 4**: Remove legacy payout methods after all users are migrated

## 🧪 Testing Strategy

### Test Scenarios
1. **New User Onboarding**: Complete Stripe Connect setup flow
2. **Payout Processing**: Test both standard and instant payouts
3. **Error Handling**: Test failed onboarding, rejected accounts
4. **Account Status Updates**: Webhook handling for account updates
5. **Migration**: Test existing users connecting Stripe accounts

### Test Data Setup
```javascript
// Create test Stripe Connect account
const testAccount = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: 'test@example.com',
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  }
})
```

## 📊 Monitoring & Analytics

### Key Metrics
- Stripe Connect onboarding completion rate
- Payout success/failure rates
- Average time to first payout
- Instant vs standard payout usage
- Employee satisfaction with payout speed

### Alerts
- Failed payout attempts
- Stripe account issues
- High instant payout fees (could indicate cash flow issues)

## 💰 Cost Analysis

### Stripe Connect Fees
- **Standard Transfers**: FREE
- **Instant Payouts**: 1.5% (paid by employee or company)
- **Platform Fee**: Optional % of each transaction (you can charge this)

### Implementation Time Estimate
- **Backend API**: 20-25 hours
- **Mobile UI Updates**: 15-20 hours  
- **Testing & Debugging**: 10-15 hours
- **Total**: 45-60 hours (1-1.5 weeks full-time)

## 🔐 Security Considerations

- Store Stripe account IDs securely
- Validate all webhook signatures
- Implement proper error handling
- Log all payout transactions
- Monitor for suspicious activity

## 🚀 Next Steps

1. Set up Stripe Connect in test mode
2. Create database migration scripts
3. Build backend API endpoints
4. Update mobile profile screen
5. Implement payout processing logic
6. Test end-to-end flow
7. Plan migration for existing users

This plan provides a comprehensive approach to integrating Stripe Connect while maintaining a smooth user experience and ensuring secure, automated payouts for employees.
