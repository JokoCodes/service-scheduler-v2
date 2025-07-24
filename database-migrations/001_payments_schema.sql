-- Payments System Schema Migration
-- Phase 1: Core payment infrastructure

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  stripe_payment_method_id TEXT,
  failure_reason TEXT,
  customer_email TEXT,
  metadata JSONB,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT payments_status_check CHECK (
    status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')
  )
);

-- Create payment refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  stripe_refund_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT refund_status_check CHECK (
    status IN ('pending', 'succeeded', 'failed', 'canceled')
  )
);

-- Add payment-related columns to existing bookings table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_required') THEN
        ALTER TABLE bookings ADD COLUMN payment_required BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='payment_status') THEN
        ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='deposit_amount') THEN
        ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='final_amount') THEN
        ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2);
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_payment_id ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Add RLS policies for payments (company-based access)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Policy for payments: users can only see payments for their company
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'payments_company_policy'
  ) THEN
    CREATE POLICY payments_company_policy ON payments
      USING (company_id = (
        SELECT company_id FROM profiles 
        WHERE id = auth.uid()
      ));
  END IF;
END $$;

-- Policy for refunds: users can only see refunds for their company's payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payment_refunds' AND policyname = 'refunds_company_policy'
  ) THEN
    CREATE POLICY refunds_company_policy ON payment_refunds
      USING (payment_id IN (
        SELECT id FROM payments 
        WHERE company_id = (
          SELECT company_id FROM profiles 
          WHERE id = auth.uid()
        )
      ));
  END IF;
END $$;
