-- Investigation and Cleanup Script
-- This script will help us understand the existing company structure
-- and clean up the test user data as requested

-- Step 1: Investigate existing companies
SELECT 
  'COMPANIES' as table_name,
  id, 
  name, 
  email,
  created_at
FROM companies 
ORDER BY created_at;

-- Step 2: Check existing employees and their company associations
SELECT 
  'EMPLOYEES' as table_name,
  id,
  name,
  email,
  company_id,
  position,
  is_active,
  created_at
FROM employees 
WHERE company_id IS NOT NULL
ORDER BY created_at;

-- Step 3: Show current test user data across all tables
SELECT 
  'auth.users' as table_name, 
  id::text, 
  email, 
  created_at::text
FROM auth.users 
WHERE email = 'emanjoko@yahoo.com'

UNION ALL

SELECT 
  'employees' as table_name, 
  id::text, 
  email, 
  created_at::text
FROM employees 
WHERE email = 'emanjoko@yahoo.com'

UNION ALL

SELECT 
  'profiles' as table_name, 
  id::text, 
  'N/A' as email, 
  created_at::text
FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'emanjoko@yahoo.com'
  UNION
  SELECT id FROM employees WHERE email = 'emanjoko@yahoo.com'
);

-- Step 4: Show company environment variable info (if we create one)
SELECT 
  'RECOMMENDED SETUP' as note,
  'Add EXPO_PUBLIC_COMPANY_ID environment variable' as action,
  id as suggested_company_id,
  name as company_name
FROM companies 
LIMIT 1;
