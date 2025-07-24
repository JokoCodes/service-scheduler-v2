-- Cleanup Script for emanjoko@yahoo.com Test User
-- This script removes the test user from all tables to allow clean recreation

BEGIN;

-- Step 1: Remove from profiles table (if exists)
DELETE FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emanjoko@yahoo.com'
  UNION
  SELECT id FROM employees WHERE email = 'emanjoko@yahoo.com'
);

-- Step 2: Remove from employees table (if exists)
DELETE FROM employees 
WHERE email = 'emanjoko@yahoo.com';

-- Step 3: Remove from auth.users (this might not work due to Supabase restrictions)
-- Note: You may need to delete this user from the Supabase dashboard instead
DELETE FROM auth.users 
WHERE email = 'emanjoko@yahoo.com';

-- Step 4: Clean up any related data (employee_availability, etc.)
DELETE FROM employee_availability 
WHERE employee_id IN (
  SELECT id FROM employees WHERE email = 'emanjoko@yahoo.com'
  UNION
  SELECT id FROM auth.users WHERE email = 'emanjoko@yahoo.com'
);

DELETE FROM employee_skills 
WHERE employee_id IN (
  SELECT id FROM employees WHERE email = 'emanjoko@yahoo.com'
  UNION
  SELECT id FROM auth.users WHERE email = 'emanjoko@yahoo.com'
);

-- Step 5: Verification - should return no results
SELECT 'CLEANUP VERIFICATION' as status;

SELECT 'auth.users' as table_name, COUNT(*) as remaining_records
FROM auth.users 
WHERE email = 'emanjoko@yahoo.com'

UNION ALL

SELECT 'employees' as table_name, COUNT(*)
FROM employees 
WHERE email = 'emanjoko@yahoo.com'

UNION ALL

SELECT 'profiles' as table_name, COUNT(*)
FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emanjoko@yahoo.com'
  UNION
  SELECT id FROM employees WHERE email = 'emanjoko@yahoo.com'
);

COMMIT;

-- Note: If auth.users deletion fails, you'll need to:
-- 1. Go to Supabase Dashboard
-- 2. Authentication > Users
-- 3. Find emanjoko@yahoo.com
-- 4. Delete manually
