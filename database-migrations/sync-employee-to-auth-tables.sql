-- Sync employee data from employees table to profiles table
-- Auth User UID: e446e783-b7c0-4de2-b023-d4d87f12c9a7 (emanjoko@yahoo.com)
-- Employee Table ID: db18769a-8ee7-4acc-8ed4-f320675b1394 (emanjoko@yahoo.com)
-- We must use the Auth UID for profiles table due to foreign key constraint

-- Step 1: Insert/Update in profiles table (Extended user data)
-- Using the correct auth.users UID as the profile ID
INSERT INTO profiles (id, name, phone, avatar, position, hourly_rate, is_active, created_at, updated_at)
SELECT 
  'e446e783-b7c0-4de2-b023-d4d87f12c9a7'::uuid as id, -- Auth user UID
  e.name,
  e.phone,
  NULL as avatar, -- Avatar not in employees table
  e.position,
  e.hourly_rate,
  e.is_active,
  e.created_at,
  e.updated_at
FROM employees e 
WHERE e.email = 'emanjoko@yahoo.com' -- Match by email instead of ID
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  position = EXCLUDED.position,
  hourly_rate = EXCLUDED.hourly_rate,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();


-- Step 2: Verification query to ensure sync worked
SELECT 
  'Data Sync Verification' as status,
  'e446e783-b7c0-4de2-b023-d4d87f12c9a7' as auth_user_id,
  e.name as employee_name,
  e.email as employee_email,
  e.position as employee_position,
  e.hourly_rate as employee_hourly_rate,
  p.name as profile_name,
  p.position as profile_position,
  CASE WHEN p.id IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as profiles_table_status
FROM employees e
LEFT JOIN profiles p ON p.id = 'e446e783-b7c0-4de2-b023-d4d87f12c9a7'::uuid
WHERE e.email = 'emanjoko@yahoo.com';

-- Step 3: Show what needs to be done next
SELECT 
  'NEXT STEPS' as action,
  'Send invitation email to emanjoko@yahoo.com using Supabase Admin API or Dashboard' as instruction,
  'User will receive email to set their password' as note;
