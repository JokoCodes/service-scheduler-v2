-- Stripe Connect Implementation Migration
-- This migration adds Stripe Connect related fields based on the existing schema.

BEGIN;

-- Add Stripe Connect fields to the profiles table for employee authentication
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payout_preference TEXT DEFAULT 'standard';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_dashboard_url TEXT;

-- Add unique constraint for stripe account ID
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_stripe_account_id_unique'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_stripe_account_id_unique UNIQUE (stripe_account_id);
  END IF;
END $$;

-- Add checks for payout preference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_payout_preference_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_payout_preference_check 
      CHECK (payout_preference IN ('standard', 'instant'));
  END IF;
END $$;

-- Create employee payouts table
CREATE TABLE IF NOT EXISTS public.employee_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id), -- Assumes employees are referenced by profiles
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  stripe_transfer_id TEXT UNIQUE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  fee_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL CHECK (net_amount > 0),
  payout_type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'pending',
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employee_payouts_amount_check'
  ) THEN
    ALTER TABLE public.employee_payouts ADD CONSTRAINT employee_payouts_amount_check CHECK (amount >= fee_amount);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employee_payouts_payout_type_check'
  ) THEN
    ALTER TABLE public.employee_payouts ADD CONSTRAINT employee_payouts_payout_type_check CHECK (payout_type IN ('standard', 'instant'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employee_payouts_status_check'
  ) THEN
    ALTER TABLE public.employee_payouts ADD CONSTRAINT employee_payouts_status_check CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'canceled'));
  END IF;
END $$;

-- Add indexes for quick lookup
CREATE INDEX IF NOT EXISTS idx_employee_payouts_employee_id ON public.employee_payouts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_payouts_booking_id ON public.employee_payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_employee_payouts_company_id ON public.employee_payouts(company_id);

-- Trigger to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_employee_payouts_updated_at ON public.employee_payouts;
CREATE TRIGGER update_employee_payouts_updated_at
BEFORE UPDATE ON public.employee_payouts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Stripe Connect migration completed.';
END $$;
