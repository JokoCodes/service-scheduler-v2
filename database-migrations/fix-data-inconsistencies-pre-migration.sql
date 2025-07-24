-- Fix Data Inconsistencies Pre-Migration
-- This script addresses orphaned employee references before applying schema changes
-- Run this BEFORE running fix-schema-inconsistencies.sql

BEGIN;

-- Step 1: Identify and report data inconsistencies
SELECT 
  'DATA ISSUE ANALYSIS' as status,
  'Orphaned employee references in bookings' as issue_type,
  COUNT(*) as count
FROM public.bookings b
LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL;

-- Step 2: Show specific orphaned records
SELECT 
  'ORPHANED RECORDS' as status,
  b.id as booking_id,
  b.assigned_employee_id as missing_employee_id,
  b.service_name,
  b.customer_name,
  b.scheduled_date
FROM public.bookings b
LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL
LIMIT 10;

-- Step 3: Check if the missing employee ID exists in auth.users
SELECT 
  'AUTH USER CHECK' as status,
  b.assigned_employee_id,
  CASE 
    WHEN u.id IS NOT NULL THEN 'EXISTS_IN_AUTH_USERS'
    ELSE 'NOT_IN_AUTH_USERS'
  END as auth_status
FROM public.bookings b
LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
LEFT JOIN auth.users u ON b.assigned_employee_id = u.id
WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL
GROUP BY b.assigned_employee_id, u.id;

-- Step 4: Fix Option A - Create missing profile records for valid auth users
-- This creates profiles for employees that exist in auth.users but not in profiles
INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  full_name, 
  phone, 
  role, 
  company_id,
  created_at,
  updated_at
)
SELECT DISTINCT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Employee User') as name,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Employee User') as full_name,
  u.phone,
  'employee',
  -- Use the default company ID if available, otherwise NULL
  (SELECT id FROM public.companies LIMIT 1),
  NOW(),
  NOW()
FROM auth.users u
INNER JOIN public.bookings b ON b.assigned_employee_id = u.id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND b.assigned_employee_id IS NOT NULL;

-- Step 5: Fix Option B - NULL out invalid employee assignments
-- For employee IDs that don't exist in auth.users at all, clear the assignment
UPDATE public.bookings 
SET assigned_employee_id = NULL
WHERE assigned_employee_id IS NOT NULL 
  AND assigned_employee_id NOT IN (
    SELECT id FROM auth.users
  );

-- Step 6: Verification - Check if all issues are resolved
SELECT 
  'VERIFICATION' as status,
  'Remaining orphaned references' as check_type,
  COUNT(*) as remaining_issues
FROM public.bookings b
LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL;

-- Step 7: Show summary of fixes applied
SELECT 
  'SUMMARY' as status,
  'Profiles created' as action,
  COUNT(*) as count
FROM public.profiles 
WHERE created_at >= NOW() - INTERVAL '1 minute';

SELECT 
  'SUMMARY' as status,
  'Employee assignments cleared' as action,
  COUNT(*) as count
FROM public.bookings 
WHERE assigned_employee_id IS NULL 
  AND updated_at >= NOW() - INTERVAL '1 minute';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Data inconsistencies fixed!';
  RAISE NOTICE '1. Created missing profile records for valid auth users';
  RAISE NOTICE '2. Cleared invalid employee assignments';
  RAISE NOTICE '3. Database is now ready for schema migration';
  RAISE NOTICE 'You can now safely run fix-schema-inconsistencies.sql';
END $$;
