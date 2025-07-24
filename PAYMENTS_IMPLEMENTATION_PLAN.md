# Payments System Implementation Plan

## 📋 Overview

This document outlines the implementation plan for a comprehensive payments system in the service scheduler application. The system needs to handle customer payments, track payment status, and manage employee payroll based on completed jobs.

## 🎯 Requirements Analysis

### Core Requirements:
1. **Customer Payment Processing**: Accept payments on the booking website
2. **Payment Status Tracking**: Dashboard to see which customers have paid
3. **Employee Payroll**: Calculate and track employee compensation based on completed jobs
4. **Financial Reporting**: Track revenue, pending payments, and payroll expenses

## 🛠 Technology Stack Recommendations

### Payment Processing
**Recommended: Stripe**
- **Pros**: Excellent developer experience, comprehensive docs, strong security, supports many payment methods
- **Cons**: 2.9% + 30¢ per transaction fee
- **Alternatives**: PayPal, Square, Braintree

### Integration Approach
- **Frontend**: Stripe Elements for secure card collection
- **Backend**: Stripe API for payment processing and webhooks
- **Database**: PostgreSQL with additional payment-related tables

## 🗄 Database Schema Additions

### New Tables Needed:

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, canceled
  payment_method TEXT, -- card, cash, check, etc.
  stripe_payment_method_id TEXT,
  failure_reason TEXT,
  customer_email TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')
  )
);

-- Payment refunds table
CREATE TABLE payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  stripe_refund_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT, -- requested_by_customer, duplicate, fraudulent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, succeeded, failed, canceled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Employee payroll records
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  base_amount DECIMAL(10,2) NOT NULL, -- calculated from hourly rate * hours worked
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,4), -- percentage (0.1500 = 15%)
  commission_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  hours_worked DECIMAL(5,2),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT payroll_status_check CHECK (
    status IN ('pending', 'approved', 'paid', 'disputed')
  )
);

-- Payment methods (saved customer payment info)
CREATE TABLE customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- card, bank_account
  card_brand TEXT, -- visa, mastercard, amex
  card_last_four TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment-related columns to existing tables
ALTER TABLE bookings ADD COLUMN payment_required BOOLEAN DEFAULT TRUE;
ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2);

-- Add company_id to payments for multi-tenancy
ALTER TABLE payments ADD COLUMN company_id UUID REFERENCES companies(id);
ALTER TABLE payroll_records ADD COLUMN company_id UUID REFERENCES companies(id);
```

## 🏗 Architecture Components

### 1. Frontend Components

#### Customer-Facing (Booking Website)
```typescript
// Payment form component
- PaymentForm.tsx
- PaymentMethodSelector.tsx
- PaymentSummary.tsx
- PaymentConfirmation.tsx

// Hooks
- usePayment.ts
- useStripe.ts
```

#### Admin Dashboard
```typescript
// Payments management
- PaymentsPage.tsx
- PaymentsList.tsx
- PaymentDetails.tsx
- RefundModal.tsx

// Payroll management
- PayrollPage.tsx
- PayrollCalculator.tsx
- PayrollReports.tsx
- EmployeePayrollSummary.tsx
```

### 2. Backend API Routes

#### Payment Processing
```typescript
// Customer payment endpoints
POST /api/payments/create-intent     // Create Stripe PaymentIntent
POST /api/payments/confirm          // Confirm payment
GET  /api/payments/status/:id       // Check payment status

// Admin payment endpoints
GET  /api/admin/payments            // List all payments
GET  /api/admin/payments/:id        // Get payment details
POST /api/admin/payments/:id/refund // Process refund

// Webhooks
POST /api/webhooks/stripe           // Handle Stripe webhooks
```

#### Payroll Management
```typescript
// Payroll endpoints
GET  /api/payroll/calculate         // Calculate payroll for period
POST /api/payroll/generate          // Generate payroll records
GET  /api/payroll/reports           // Payroll reports
PUT  /api/payroll/:id/approve       // Approve payroll record
```

### 3. Business Logic Services

```typescript
// Payment service
class PaymentService {
  createPaymentIntent(booking: Booking, amount: number)
  confirmPayment(paymentIntentId: string)
  processRefund(paymentId: string, amount: number)
  handleWebhook(event: Stripe.Event)
}

// Payroll service
class PayrollService {
  calculateEmployeePayroll(employeeId: string, startDate: Date, endDate: Date)
  generatePayrollRecords(payPeriod: PayPeriod)
  approvePayroll(payrollId: string)
  generatePayrollReport(startDate: Date, endDate: Date)
}
```

## 💳 Payment Flow Implementation

### Customer Payment Flow

1. **Booking Creation**
   ```typescript
   // When customer creates booking
   const booking = await createBooking(bookingData);
   const paymentRequired = calculatePaymentAmount(booking);
   ```

2. **Payment Intent Creation**
   ```typescript
   // Create Stripe PaymentIntent
   const paymentIntent = await stripe.paymentIntents.create({
     amount: Math.round(booking.totalPrice * 100), // Convert to cents
     currency: 'usd',
     customer: stripeCustomerId,
     metadata: {
       booking_id: booking.id,
       company_id: booking.companyId
     }
   });
   ```

3. **Frontend Payment Collection**
   ```typescript
   // Using Stripe Elements
   const PaymentForm = () => {
     const stripe = useStripe();
     const elements = useElements();
     
     const handleSubmit = async (event) => {
       event.preventDefault();
       
       const result = await stripe.confirmPayment({
         elements,
         confirmParams: {
           return_url: `${window.location.origin}/booking-confirmation`,
         },
       });
     };
   };
   ```

4. **Webhook Processing**
   ```typescript
   // Handle payment success
   export async function POST(req: Request) {
     const sig = req.headers.get('stripe-signature');
     const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
     
     if (event.type === 'payment_intent.succeeded') {
       await updateBookingPaymentStatus(event.data.object.metadata.booking_id, 'paid');
       await createPaymentRecord(event.data.object);
       await sendPaymentConfirmationEmail(event.data.object);
     }
   }
   ```

### Employee Payroll Flow

1. **Time Tracking Integration**
   ```typescript
   // Calculate hours worked from job status updates
   const calculateHoursWorked = (booking: Booking) => {
     const startUpdate = booking.statusUpdates.find(u => u.status === 'in-progress');
     const endUpdate = booking.statusUpdates.find(u => u.status === 'completed');
     
     if (startUpdate && endUpdate) {
       return (endUpdate.timestamp - startUpdate.timestamp) / (1000 * 60 * 60);
     }
     return booking.service.duration / 60; // Fallback to estimated duration
   };
   ```

2. **Payroll Calculation**
   ```typescript
   const calculatePayroll = (employee: Employee, bookings: Booking[]) => {
     let totalAmount = 0;
     let totalHours = 0;
     
     for (const booking of bookings) {
       const hoursWorked = calculateHoursWorked(booking);
       const baseAmount = hoursWorked * employee.hourlyRate;
       const commissionAmount = booking.payment.amount * employee.commissionRate;
       
       totalAmount += baseAmount + commissionAmount;
       totalHours += hoursWorked;
     }
     
     return { totalAmount, totalHours };
   };
   ```

## 🔐 Security Considerations

### PCI Compliance
- **Never store card data**: Use Stripe Elements and PaymentMethods
- **Secure webhook endpoints**: Verify webhook signatures
- **Environment variables**: Store API keys securely

### Data Protection
```typescript
// Environment variables needed
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

// Secure headers for payment endpoints
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self' js.stripe.com",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff'
};
```

## 📊 Dashboard Features

### Payments Dashboard
- **Overview Cards**: Total revenue, pending payments, refunds
- **Payments List**: Filterable by status, date, customer
- **Payment Details**: Full payment history, refund options
- **Financial Reports**: Daily/weekly/monthly revenue reports

### Payroll Dashboard
- **Employee Overview**: Hours worked, earnings, commission
- **Payroll Generation**: Batch create payroll for pay periods
- **Approval Workflow**: Review and approve payroll before processing
- **Reporting**: Payroll costs, employee performance metrics

## 🚀 Implementation Phases

### Phase 1: Core Payment Infrastructure (Week 1-2)
- [ ] Database schema setup
- [ ] Stripe integration setup
- [ ] Basic payment API endpoints
- [ ] Customer payment form on booking website
- [ ] Webhook handling for payment confirmation

### Phase 2: Admin Payment Management (Week 3)
- [ ] Payments dashboard page
- [ ] Payment listing and search
- [ ] Payment details and refund functionality
- [ ] Basic financial reporting

### Phase 3: Payroll System (Week 4-5)
- [ ] Payroll calculation logic
- [ ] Payroll dashboard
- [ ] Employee payroll tracking
- [ ] Payroll approval workflow

### Phase 4: Advanced Features (Week 6)
- [ ] Recurring payments for subscription services
- [ ] Advanced financial reporting
- [ ] Payment analytics and insights
- [ ] Integration with accounting software (QuickBooks, Xero)

## 🧪 Local Testing Strategy

### Development Environment Setup

#### 1. Stripe Test Environment
```bash
# Install Stripe CLI for local webhook testing
brew install stripe/stripe-cli/stripe

# Login to Stripe (will open browser)
stripe login

# Get your test API keys from Stripe Dashboard
# Add to your .env.local files:
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Generated by Stripe CLI
```

#### 2. Local Webhook Testing
```bash
# Forward Stripe webhooks to your local development server
stripe listen --forward-to localhost:3001/api/webhooks/stripe

# This will output a webhook signing secret like:
# whsec_1234567890abcdef...
# Add this to your STRIPE_WEBHOOK_SECRET environment variable
```

#### 3. Test Data Setup
```sql
-- Create test customers with various scenarios
INSERT INTO customers (id, name, email, phone, address, company_id) VALUES
  ('test-customer-1', 'Test Customer 1', 'test1@example.com', '+1-555-0001', '123 Test St', '550e8400-e29b-41d4-a716-446655440000'),
  ('test-customer-2', 'Test Customer 2', 'test2@example.com', '+1-555-0002', '456 Test Ave', '550e8400-e29b-41d4-a716-446655440000');

-- Create test services with different pricing
INSERT INTO services (id, name, description, duration, price, category, company_id) VALUES
  ('test-service-1', 'Basic Service', 'Test service $50', 60, 50.00, 'basic', '550e8400-e29b-41d4-a716-446655440000'),
  ('test-service-2', 'Premium Service', 'Test service $150', 120, 150.00, 'premium', '550e8400-e29b-41d4-a716-446655440000');

-- Create test bookings in various states
INSERT INTO bookings (id, customer_id, service_id, assigned_employee_id, scheduled_date, scheduled_time, status, service_address, total_price, payment_status) VALUES
  ('test-booking-1', 'test-customer-1', 'test-service-1', 'your-employee-id', '2025-08-01', '10:00', 'pending', '123 Test St', 50.00, 'unpaid'),
  ('test-booking-2', 'test-customer-2', 'test-service-2', 'your-employee-id', '2025-08-02', '14:00', 'confirmed', '456 Test Ave', 150.00, 'paid');
```

### Testing Scripts and Utilities

#### 1. Payment Testing Script
```javascript
// create-test-payment.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createTestPayment() {
  try {
    // Create a test customer
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test Customer',
      metadata: { company_id: '550e8400-e29b-41d4-a716-446655440000' }
    });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 5000, // $50.00
      currency: 'usd',
      customer: customer.id,
      payment_method_types: ['card'],
      metadata: {
        booking_id: 'test-booking-1',
        company_id: '550e8400-e29b-41d4-a716-446655440000'
      }
    });

    console.log('Payment Intent created:', paymentIntent.id);
    console.log('Client Secret:', paymentIntent.client_secret);
    
    return paymentIntent;
  } catch (error) {
    console.error('Error creating test payment:', error);
  }
}

createTestPayment();
```

#### 2. Webhook Testing Script
```javascript
// test-webhook.js
const fetch = require('node-fetch');

async function testWebhook() {
  const webhookPayload = {
    id: 'evt_test_webhook',
    object: 'event',
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: 'pi_test_1234567890',
        amount: 5000,
        currency: 'usd',
        status: 'succeeded',
        metadata: {
          booking_id: 'test-booking-1',
          company_id: '550e8400-e29b-41d4-a716-446655440000'
        }
      }
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test-signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log('Webhook test response:', response.status);
    const result = await response.json();
    console.log('Response body:', result);
  } catch (error) {
    console.error('Webhook test failed:', error);
  }
}

testWebhook();
```

#### 3. Payroll Calculation Test
```javascript
// test-payroll.js
const { calculatePayrollForEmployee } = require('./src/lib/payroll-service');

async function testPayrollCalculation() {
  const testEmployee = {
    id: 'test-employee-1',
    hourlyRate: 25.00,
    commissionRate: 0.10 // 10%
  };

  const testBookings = [
    {
      id: 'test-booking-1',
      totalPrice: 100.00,
      statusUpdates: [
        { status: 'in-progress', timestamp: new Date('2025-08-01T10:00:00Z') },
        { status: 'completed', timestamp: new Date('2025-08-01T12:00:00Z') }
      ]
    },
    {
      id: 'test-booking-2',
      totalPrice: 150.00,
      statusUpdates: [
        { status: 'in-progress', timestamp: new Date('2025-08-01T14:00:00Z') },
        { status: 'completed', timestamp: new Date('2025-08-01T17:00:00Z') }
      ]
    }
  ];

  const payroll = calculatePayrollForEmployee(testEmployee, testBookings);
  console.log('Payroll calculation result:', payroll);
  
  // Expected: 
  // - Booking 1: 2 hours * $25 = $50 + (10% of $100) = $10 = $60
  // - Booking 2: 3 hours * $25 = $75 + (10% of $150) = $15 = $90
  // - Total: $150
}

testPayrollCalculation();
```

### Stripe Test Cards

#### Successful Payment Test Cards
```javascript
// Use these test card numbers in your payment forms
const testCards = {
  visa: '4242424242424242',
  visaDebit: '4000056655665556',
  mastercard: '5555555555554444',
  amex: '378282246310005',
  discover: '6011111111111117'
};

// All test cards use:
// - Any future expiration date (e.g., 12/25)
// - Any 3-digit CVC (e.g., 123)
// - Any ZIP code (e.g., 12345)
```

#### Failed Payment Test Cards
```javascript
const failureTestCards = {
  declined: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  incorrectCvc: '4000000000000127',
  processingError: '4000000000000119'
};
```

### Local Testing Checklist

#### Payment Flow Testing
- [ ] **Successful Payment**
  ```bash
  # 1. Create booking on website
  # 2. Fill payment form with test card 4242424242424242
  # 3. Verify payment intent created in Stripe dashboard
  # 4. Check webhook received and processed
  # 5. Confirm booking status updated to 'paid'
  # 6. Verify payment record created in database
  ```

- [ ] **Failed Payment**
  ```bash
  # 1. Use declined test card 4000000000000002
  # 2. Verify error handling in UI
  # 3. Check payment intent status in Stripe
  # 4. Confirm booking remains 'unpaid'
  ```

- [ ] **Refund Processing**
  ```bash
  # 1. Process successful payment
  # 2. Initiate refund through admin dashboard
  # 3. Verify refund created in Stripe
  # 4. Check refund webhook processing
  # 5. Confirm refund record in database
  ```

#### Payroll Testing
- [ ] **Basic Calculation**
  ```bash
  # 1. Complete a booking with time tracking
  # 2. Run payroll calculation for employee
  # 3. Verify hours worked calculation
  # 4. Check base pay + commission calculation
  # 5. Confirm payroll record created
  ```

- [ ] **Approval Workflow**
  ```bash
  # 1. Generate payroll records
  # 2. Review in admin dashboard
  # 3. Approve/reject payroll entries
  # 4. Verify status updates
  ```

### Automated Testing Setup

#### Jest Test Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
  ],
};

// tests/setup.js
const dotenv = require('dotenv');
dotenv.config({ path: '.env.test' });

// Mock Stripe for tests
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});
```

#### Database Testing Setup
```javascript
// tests/db-setup.js
const { Pool } = require('pg');

// Create test database connection
const testDb = new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
});

// Cleanup function
const cleanupTestData = async () => {
  await testDb.query('DELETE FROM payments WHERE metadata @> \'"test": true\'');
  await testDb.query('DELETE FROM payroll_records WHERE notes LIKE \'%test%\'');
  await testDb.query('DELETE FROM bookings WHERE id LIKE \'test-%\'');
};

module.exports = { testDb, cleanupTestData };
```

### End-to-End Testing with Playwright

```javascript
// e2e/payment-flow.spec.js
const { test, expect } = require('@playwright/test');

test('complete payment flow', async ({ page }) => {
  // Navigate to booking page
  await page.goto('http://localhost:3000/booking');
  
  // Fill booking form
  await page.fill('[name="customerName"]', 'Test Customer');
  await page.fill('[name="customerEmail"]', 'test@example.com');
  await page.selectOption('[name="serviceId"]', 'test-service-1');
  
  // Proceed to payment
  await page.click('button:text("Book Now")');
  
  // Fill payment form
  const cardElement = page.frameLocator('iframe[name*="card"]');
  await cardElement.fill('[name="cardnumber"]', '4242424242424242');
  await cardElement.fill('[name="exp-date"]', '1225');
  await cardElement.fill('[name="cvc"]', '123');
  
  // Submit payment
  await page.click('button:text("Pay Now")');
  
  // Verify success
  await expect(page.locator('text=Payment Successful')).toBeVisible();
});
```

### Monitoring and Debugging

#### Logging Setup
```javascript
// lib/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/payments.log' }),
    new winston.transports.Console()
  ],
});

module.exports = logger;
```

#### Debug Payment Issues
```bash
# Check Stripe logs
stripe logs tail

# Monitor webhook delivery
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed

# Check local server logs
tail -f logs/payments.log
```

### Performance Testing

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Payment API Load Test"
    requests:
      - post:
          url: "/api/payments/create-intent"
          json:
            amount: 5000
            currency: "usd"
            bookingId: "test-booking-1"
```

```bash
# Run load test
npm install -g artillery
artillery run artillery-config.yml
```

### Pre-Production Checklist

- [ ] All unit tests passing
- [ ] Integration tests with Stripe test mode
- [ ] End-to-end payment flow works
- [ ] Webhook handling robust
- [ ] Payroll calculations accurate
- [ ] Error handling comprehensive
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Monitoring and logging setup
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] SSL certificates ready for production

## 🧪 Testing Strategy

## 📈 Monitoring and Analytics

### Key Metrics to Track
- Payment success rate
- Average transaction amount
- Failed payment reasons
- Employee productivity (revenue per hour)
- Customer payment behavior

### Alerting
- Failed payments
- Webhook processing errors
- Unusual payment patterns
- Payroll calculation discrepancies

## 💰 Cost Considerations

### Stripe Fees
- Standard rate: 2.9% + 30¢ per successful transaction
- Volume discounts available for high-volume businesses

### Development Time Estimate
- **Phase 1**: 40-50 hours
- **Phase 2**: 25-30 hours  
- **Phase 3**: 35-40 hours
- **Phase 4**: 20-25 hours
- **Total**: 120-145 hours (3-4 months part-time)

## 🔄 Future Enhancements

### Advanced Payment Features
- Installment payments
- Subscription billing for recurring services
- Multi-payment methods per booking
- Cryptocurrency payments

### Payroll Enhancements
- Direct deposit integration
- Tax calculation and reporting
- Benefits and deductions management
- Time tracking integration with mobile app

### Financial Management
- Invoice generation
- Expense tracking
- Profit/loss reporting
- Integration with accounting platforms

---

This comprehensive plan provides a roadmap for implementing a robust payments system that handles both customer payments and employee payroll management. The phased approach allows for incremental development and testing, ensuring each component works correctly before building on top of it.
