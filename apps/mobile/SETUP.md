# Mobile App Setup Instructions

## Environment Configuration

1. Update your `.env.local` file with your Supabase credentials:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration (for future use)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## Database Setup

1. Make sure you've run the migration scripts in the root directory:
   - `database-migrations/001_payments_schema.sql`
   - `database-migrations/add-stripe-connect-fields.sql`

2. Verify the tables exist in your Supabase dashboard:
   - `profiles` (with Stripe Connect fields)
   - `bookings` (with payment fields)
   - `payments`
   - `employee_payouts`
   - `companies`

## Features Implemented

### ✅ Earnings Screen
- Real-time earnings data from Supabase
- Stripe Connect integration status
- Payout history with status tracking
- Weekly and monthly earnings summary

### ✅ Profile Screen  
- User profile management
- Payout preferences (Standard/Instant)
- Stripe Connect onboarding status
- Account information editing

### ✅ Schedule Screen
- Available time slot management
- Calendar integration
- Availability setting for employees

### ✅ Jobs Screen
- Three-tab interface (Available, Assigned, Completed)
- Job status tracking
- Payment information integration

### ✅ Job Details Screen
- Complete job information
- Timer functionality for active jobs
- Payment status integration
- Customer communication

## Testing the Integration

1. Start the mobile app:
   ```bash
   npm start
   ```

2. Test the following flows:
   - Login with a test employee account
   - View earnings (will show $0 initially without data)
   - Check profile Stripe Connect status
   - Set availability in the Schedule tab
   - Browse jobs in different statuses

## Next Steps

1. **Stripe Connect Integration**: Implement actual Stripe Connect onboarding flow
2. **Payment Processing**: Add payment capture for completed jobs
3. **Real-time Updates**: Add real-time subscriptions for job status changes
4. **Push Notifications**: Notify employees of new job assignments
5. **Geolocation**: Add location tracking for job verification
