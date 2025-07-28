-- Add missing columns to establish proper relationships between profiles and employees
-- This creates a robust bidirectional relationship and aligns with TypeScript definitions

BEGIN;

-- Step 1: Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'employee';

-- Step 1b: Add profile_id to employees table for bidirectional relationship
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS profile_id UUID;

-- Step 2: Add constraints
DO $$
BEGIN
  -- Add foreign key constraint for profiles.company_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_company_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id);
  END IF;
  
  -- Add foreign key constraint for employees.profile_id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'employees_profile_id_fkey'
  ) THEN
    ALTER TABLE public.employees 
    ADD CONSTRAINT employees_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
  END IF;
  
  -- Add check constraint for valid roles
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('admin', 'employee', 'customer'));
  END IF;
END $$;

-- Step 3: Update the test user with the correct company_id and email
UPDATE public.profiles 
SET 
  company_id = '550e8400-e29b-41d4-a716-446655440000'::uuid,
  email = 'emanjoko@yahoo.com'
WHERE id = 'e446e783-b7c0-4de2-b023-d4d87f12c9a7'::uuid;

-- Step 4: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);

-- Step 5: Verification - Check all new columns
SELECT 
  'VERIFICATION' as status,
  'profiles table structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('company_id', 'email', 'role')
ORDER BY column_name;

-- Step 5b: Verify employees table structure
SELECT 
  'VERIFICATION' as status,
  'employees table structure' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'employees' 
  AND table_schema = 'public' 
  AND column_name = 'profile_id';

-- Step 6: Verify test user data
SELECT 
  'TEST_USER_VERIFICATION' as status,
  id,
  name,
  email,
  company_id,
  role
FROM public.profiles 
WHERE id = 'e446e783-b7c0-4de2-b023-d4d87f12c9a7'::uuid;

-- Step 7: Verify company exists
SELECT 
  'COMPANY_EXISTS' as status,
  id,
  name as company_name
FROM public.companies 
WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SCHEMA ENHANCEMENT COMPLETED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PROFILES TABLE:';
  RAISE NOTICE '✓ Added company_id column with foreign key to companies';
  RAISE NOTICE '✓ Added email column';
  RAISE NOTICE '✓ Added role column with check constraint (admin|employee|customer)';
  RAISE NOTICE '';
  RAISE NOTICE 'EMPLOYEES TABLE:';
  RAISE NOTICE '✓ Added profile_id column with foreign key to profiles';
  RAISE NOTICE '✓ Created bidirectional relationship (profiles ↔ employees)';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST USER UPDATED:';
  RAISE NOTICE '  - ID: e446e783-b7c0-4de2-b023-d4d87f12c9a7';
  RAISE NOTICE '  - company_id: 550e8400-e29b-41d4-a716-446655440000';
  RAISE NOTICE '  - email: emanjoko@yahoo.com';
  RAISE NOTICE '  - role: employee (default)';
  RAISE NOTICE '';
  RAISE NOTICE 'The job assignment system is now fully connected!';
END $$;
