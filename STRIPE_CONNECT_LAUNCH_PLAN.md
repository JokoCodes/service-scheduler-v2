# Stripe Connect Implementation Plan - Launch Ready

## 📋 Overview

This plan outlines implementing Stripe Connect as the **sole payout method** for the app launch, replacing all legacy payment methods. All employees must connect their Stripe accounts to receive payments.

## 🎯 Launch Strategy

- **Single Payment Method**: Only Stripe Connect, no legacy options
- **Mandatory Setup**: All employees must complete Stripe onboarding
- **Simplified UI**: Clean, focused payment setup experience
- **Automated Payouts**: Fully automated payment processing

## 🛠 Technical Implementation

### 1. Database Schema (Simplified)

```sql
-- Remove legacy payout columns, add Stripe Connect fields
ALTER TABLE profiles DROP COLUMN IF EXISTS payout_method;
ALTER TABLE profiles DROP COLUMN IF EXISTS bank_details;
ALTER TABLE profiles DROP COLUMN IF EXISTS paypal_email;
ALTER TABLE profiles DROP COLUMN IF EXISTS venmo_username;

-- Add Stripe Connect fields
ALTER TABLE profiles ADD COLUMN stripe_account_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN stripe_onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE profiles ADD COLUMN stripe_charges_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE profiles ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE profiles ADD COLUMN payout_preference TEXT DEFAULT 'standard' CHECK (payout_preference IN ('standard', 'instant'));
ALTER TABLE profiles ADD COLUMN stripe_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN stripe_dashboard_url TEXT;

-- Employee payouts tracking
CREATE TABLE employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_transfer_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  fee_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_type TEXT NOT NULL DEFAULT 'standard' CHECK (payout_type IN ('standard', 'instant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  failure_reason TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraint: employees cannot be assigned jobs without Stripe setup
ALTER TABLE bookings ADD CONSTRAINT employee_stripe_required 
  CHECK (assigned_employee_id IS NULL OR 
         assigned_employee_id IN (
           SELECT id FROM profiles WHERE stripe_payouts_enabled = TRUE
         ));
```

### 2. Mobile App Profile Screen (Simplified)

```typescript
// Updated UserProfile interface (no legacy fields)
interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  rating: number
  totalJobs: number
  joinDate: string
  
  // Stripe Connect (required fields)
  stripeAccountId?: string
  stripeOnboardingCompleted: boolean
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
  payoutPreference: 'standard' | 'instant'
  stripeConnectedAt?: string
  stripeDashboardUrl?: string
}

// Profile screen component
const ProfileScreen = () => {
  // ... existing state ...

  const renderPaymentSection = () => {
    if (!profile.stripeOnboardingCompleted) {
      return (
        <View style={styles.paymentSetupRequired}>
          <View style={styles.requirementHeader}>
            <Ionicons name="warning" size={32} color="#f59e0b" />
            <View style={styles.headerText}>
              <Text style={styles.requirementTitle}>Payment Setup Required</Text>
              <Text style={styles.requirementSubtitle}>
                You must connect a bank account to receive payments
              </Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Secure bank account connection</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Automatic payments after job completion</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Choose standard (free) or instant payouts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.benefitText}>Track all payments in one place</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.setupButton}
            onPress={handleStripeConnect}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#ffffff" />
                <Text style={styles.setupButtonText}>Connect Bank Account</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.securityNote}>
            Powered by Stripe • Bank-level security • No card details stored
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.paymentConnected}>
        <View style={styles.connectedHeader}>
          <Ionicons name="checkmark-circle" size={28} color="#10b981" />
          <View style={styles.connectedInfo}>
            <Text style={styles.connectedTitle}>Bank Account Connected</Text>
            <Text style={styles.connectedSubtitle}>Ready to receive payments</Text>
          </View>
        </View>

        {/* Payout Speed Preference */}
        <View style={styles.payoutSettings}>
          <Text style={styles.settingsTitle}>Payout Speed</Text>
          
          <TouchableOpacity
            style={[
              styles.payoutOption,
              profile.payoutPreference === 'standard' && styles.payoutOptionActive
            ]}
            onPress={() => updatePayoutPreference('standard')}
          >
            <View style={styles.payoutOptionContent}>
              <Text style={styles.payoutOptionTitle}>Standard (Free)</Text>
              <Text style={styles.payoutOptionDesc}>2-7 business days • No fees</Text>
            </View>
            <Ionicons 
              name={profile.payoutPreference === 'standard' ? 'radio-button-on' : 'radio-button-off'}
              size={24} 
              color={profile.payoutPreference === 'standard' ? '#3b82f6' : '#9ca3af'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.payoutOption,
              profile.payoutPreference === 'instant' && styles.payoutOptionActive
            ]}
            onPress={() => updatePayoutPreference('instant')}
          >
            <View style={styles.payoutOptionContent}>
              <Text style={styles.payoutOptionTitle}>Instant</Text>
              <Text style={styles.payoutOptionDesc}>Within minutes • 1.5% fee deducted</Text>
            </View>
            <Ionicons 
              name={profile.payoutPreference === 'instant' ? 'radio-button-on' : 'radio-button-off'}
              size={24} 
              color={profile.payoutPreference === 'instant' ? '#3b82f6' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActions}>
          <TouchableOpacity 
            style={styles.dashboardButton}
            onPress={() => Linking.openURL(profile.stripeDashboardUrl!)}
          >
            <Ionicons name="analytics-outline" size={18} color="#6b7280" />
            <Text style={styles.dashboardButtonText}>View Payment Dashboard</Text>
            <Ionicons name="open-outline" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const handleStripeConnect = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/stripe/create-connect-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          email: profile.email,
          firstName: profile.name.split(' ')[0],
          lastName: profile.name.split(' ').slice(1).join(' ') || profile.name.split(' ')[0]
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Open Stripe onboarding
        await Linking.openURL(result.data.onboardingUrl)
        
        // Show success message and refresh status
        Alert.alert(
          'Setup Started',
          'Complete the bank account setup in your browser, then return to the app.',
          [{ text: 'OK', onPress: () => refreshStripeStatus() }]
        )
      } else {
        Alert.alert('Error', result.message)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start payment setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const refreshStripeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/account-status`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      })
      
      const result = await response.json()
      
      if (result.success && result.data.connected) {
        setProfile(prev => ({
          ...prev,
          stripeOnboardingCompleted: true,
          stripeChargesEnabled: result.data.chargesEnabled,
          stripePayoutsEnabled: result.data.payoutsEnabled,
          stripeDashboardUrl: result.data.dashboardUrl
        }))
      }
    } catch (error) {
      console.error('Failed to refresh Stripe status:', error)
    }
  }

  // Check Stripe status on app focus
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && profile.stripeAccountId && !profile.stripeOnboardingCompleted) {
        refreshStripeStatus()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription?.remove()
  }, [profile.stripeAccountId, profile.stripeOnboardingCompleted])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        {profile.stripeOnboardingCompleted && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? 'checkmark' : 'pencil'} 
              size={20} 
              color={isEditing ? '#10b981' : '#3b82f6'} 
            />
            <Text style={[styles.editButtonText, isEditing && styles.saveButtonText]}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        {/* ... existing profile header ... */}

        {/* Payment Setup Section - Always First Priority */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {profile.stripeOnboardingCompleted ? 'Payment Settings' : 'Payment Setup'}
          </Text>
          {renderPaymentSection()}
        </View>

        {/* Only show other sections if payment is set up */}
        {profile.stripeOnboardingCompleted && (
          <>
            {/* Personal Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {/* ... existing personal info fields ... */}
            </View>

            {/* Job Availability */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Availability</Text>
              <TouchableOpacity style={styles.availabilityButton}>
                <Text style={styles.availabilityButtonText}>Available for Jobs</Text>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
```

### 3. Backend API Endpoints

```typescript
// /api/stripe/create-connect-account/route.ts
export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { email, firstName, lastName } = await request.json()
    
    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_profile: {
        product_description: 'Home services and maintenance'
      },
      individual: {
        first_name: firstName,
        last_name: lastName,
        email
      }
    })

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.MOBILE_APP_SCHEME}://profile?refresh=stripe`,
      return_url: `${process.env.MOBILE_APP_SCHEME}://profile?connected=stripe`,
      type: 'account_onboarding',
    })

    // Save to database
    await db.query(
      'UPDATE profiles SET stripe_account_id = $1 WHERE id = $2',
      [account.id, authResult.user.id]
    )

    return NextResponse.json({
      success: true,
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url
      }
    })
  } catch (error) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create payment account' 
    }, { status: 500 })
  }
}

// /api/stripe/account-status/route.ts
export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  
  try {
    const authResult = await authenticateRequest(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userResult = await db.query(
      'SELECT stripe_account_id FROM profiles WHERE id = $1',
      [authResult.user.id]
    )

    if (!userResult.rows[0]?.stripe_account_id) {
      return NextResponse.json({
        success: true,
        data: { connected: false }
      })
    }

    const account = await stripe.accounts.retrieve(userResult.rows[0].stripe_account_id)
    
    const isComplete = account.details_submitted && 
                      account.charges_enabled && 
                      account.payouts_enabled

    // Update database
    await db.query(`
      UPDATE profiles 
      SET 
        stripe_onboarding_completed = $1,
        stripe_charges_enabled = $2,
        stripe_payouts_enabled = $3,
        stripe_dashboard_url = $4,
        stripe_connected_at = CASE 
          WHEN $1 = TRUE AND stripe_connected_at IS NULL 
          THEN NOW() 
          ELSE stripe_connected_at 
        END
      WHERE id = $5
    `, [
      isComplete,
      account.charges_enabled,
      account.payouts_enabled,
      isComplete ? `https://dashboard.stripe.com/express/accounts/${account.id}` : null,
      authResult.user.id
    ])

    return NextResponse.json({
      success: true,
      data: {
        connected: isComplete,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        dashboardUrl: isComplete ? `https://dashboard.stripe.com/express/accounts/${account.id}` : null
      }
    })
  } catch (error) {
    console.error('Account status error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to check account status' 
    }, { status: 500 })
  }
}

// /api/jobs/complete/route.ts (Auto-payout on completion)
export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json()
    
    // Get booking and employee details
    const bookingResult = await db.query(`
      SELECT 
        b.id,
        b.assigned_employee_id,
        b.total_price,
        b.duration_minutes,
        p.hourly_rate,
        p.commission_rate,
        p.payout_preference,
        p.stripe_account_id,
        p.stripe_payouts_enabled
      FROM bookings b
      JOIN profiles p ON b.assigned_employee_id = p.id
      WHERE b.id = $1 AND b.status = 'in-progress'
    `, [bookingId])

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found or not in progress')
    }

    const booking = bookingResult.rows[0]
    
    if (!booking.stripe_payouts_enabled) {
      throw new Error('Employee payment account not ready')
    }

    // Mark job as completed
    await db.query(
      'UPDATE bookings SET status = $1, completed_at = $2 WHERE id = $3',
      ['completed', new Date(), bookingId]
    )

    // Calculate payout
    const hoursWorked = booking.duration_minutes / 60
    const baseAmount = hoursWorked * booking.hourly_rate
    const commissionAmount = booking.total_price * (booking.commission_rate || 0)
    const totalAmount = baseAmount + commissionAmount

    // Process payout
    await processEmployeePayout({
      bookingId: booking.id,
      employeeId: booking.assigned_employee_id,
      amount: totalAmount,
      payoutType: booking.payout_preference
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

### 4. Job Assignment Logic

```typescript
// Ensure employees can only be assigned jobs if Stripe is set up
const canAssignJob = async (employeeId: string): Promise<boolean> => {
  const result = await db.query(
    'SELECT stripe_payouts_enabled FROM profiles WHERE id = $1',
    [employeeId]
  )
  
  return result.rows[0]?.stripe_payouts_enabled === true
}

// In job assignment endpoint
export async function POST(request: NextRequest) {
  const { bookingId, employeeId } = await request.json()
  
  if (!(await canAssignJob(employeeId))) {
    return NextResponse.json({
      success: false,
      message: 'Employee must complete payment setup before accepting jobs'
    }, { status: 400 })
  }
  
  // Proceed with job assignment...
}
```

## 📱 User Experience Flow

### 1. New Employee Onboarding
```
1. Download app → 2. Create account → 3. **Payment Setup Required** → 4. Connect Stripe → 5. Ready for jobs
```

### 2. Existing Employee (if migrating)
```
1. Open app → 2. **Payment Setup Banner** → 3. Connect Stripe → 4. Continue using app
```

### 3. Job Completion Flow
```
1. Complete job → 2. Automatic payout calculation → 3. Stripe transfer → 4. Notification sent
```

## 🚀 Implementation Timeline

### Week 1: Backend Foundation
- [ ] Database schema updates
- [ ] Stripe Connect API endpoints
- [ ] Webhook handling for account updates
- [ ] Payout processing logic

### Week 2: Mobile App Updates
- [ ] Update profile screen UI
- [ ] Stripe Connect integration
- [ ] Payment preference settings
- [ ] Account status checking

### Week 3: Testing & Refinement
- [ ] End-to-end testing
- [ ] Error handling improvements
- [ ] UI/UX refinements
- [ ] Performance optimization

### Week 4: Launch Preparation
- [ ] Production Stripe setup
- [ ] Final testing
- [ ] Documentation
- [ ] Launch!

## ✅ Launch Checklist

### Pre-Launch
- [ ] Stripe Connect configured in production
- [ ] Database migrations applied
- [ ] All API endpoints tested
- [ ] Mobile app UI finalized
- [ ] Error handling comprehensive
- [ ] Webhook endpoints secured

### Launch Day
- [ ] Monitor Stripe Connect onboarding rates
- [ ] Track any payment setup issues
- [ ] Monitor payout processing
- [ ] Support team ready for payment questions

### Post-Launch
- [ ] Collect user feedback on onboarding
- [ ] Monitor payout success rates
- [ ] Optimize based on user behavior
- [ ] Plan additional payment features

This streamlined approach ensures a clean launch with Stripe Connect as the only payment option, providing a consistent experience for all users from day one.
