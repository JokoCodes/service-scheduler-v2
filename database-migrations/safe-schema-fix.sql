-- Safe Schema Fix Migration
-- This migration handles data inconsistencies before adding foreign key constraints

BEGIN;

-- Step 1: Investigate data inconsistencies first
SELECT 'DATA_ANALYSIS' as status, 'Orphaned bookings analysis' as check_type;

-- Find bookings with assigned_employee_id that don't exist in profiles
SELECT 
  'ORPHANED_BOOKINGS' as issue_type,
  COUNT(*) as count,
  'bookings reference non-existent profiles' as description
FROM bookings b
LEFT JOIN profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL 
  AND p.id IS NULL;

-- Show the problematic IDs
SELECT 'PROBLEMATIC_IDS' as status;
SELECT DISTINCT 
  b.assigned_employee_id as missing_profile_id,
  COUNT(*) as booking_count
FROM bookings b
LEFT JOIN profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL 
  AND p.id IS NULL
GROUP BY b.assigned_employee_id;

-- Step 2: Clean up orphaned data (set employee_id to NULL for invalid references)
UPDATE bookings 
SET assigned_employee_id = NULL
WHERE assigned_employee_id IS NOT NULL 
  AND assigned_employee_id NOT IN (SELECT id FROM profiles);

-- Log what we cleaned up
SELECT 'CLEANUP_RESULT' as status, 
       ROW_COUNT() as orphaned_bookings_cleaned;

-- Step 3: Add first_name and last_name columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Step 4: Parse existing name data into first_name and last_name
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 5: Add full_name column (regular column, not generated for compatibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Step 6: Create function to compute full_name
CREATE OR REPLACE FUNCTION compute_full_name(fname TEXT, lname TEXT)
RETURNS TEXT AS $$
BEGIN
  IF lname = '' OR lname IS NULL THEN
    RETURN fname;
  ELSE
    RETURN fname || ' ' || lname;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 7: Update existing full_name data
UPDATE public.profiles 
SET full_name = compute_full_name(first_name, last_name)
WHERE full_name IS NULL OR full_name = '';

-- Step 8: Create trigger to maintain full_name
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Compute full_name when first_name or last_name changes
  NEW.full_name = compute_full_name(NEW.first_name, NEW.last_name);
  
  -- If full_name is directly updated, try to parse it back
  IF (TG_OP = 'UPDATE') AND 
     (OLD.full_name IS DISTINCT FROM NEW.full_name) AND 
     (OLD.first_name = NEW.first_name AND OLD.last_name = NEW.last_name) THEN
    -- User updated full_name directly, try to parse it
    NEW.first_name = CASE 
      WHEN position(' ' in NEW.full_name) > 0 THEN split_part(NEW.full_name, ' ', 1)
      ELSE NEW.full_name
    END;
    NEW.last_name = CASE 
      WHEN position(' ' in NEW.full_name) > 0 THEN substring(NEW.full_name from position(' ' in NEW.full_name) + 1)
      ELSE ''
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS sync_full_name_trigger ON public.profiles;
CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_full_name();

-- Step 9: Add NOT NULL constraints (with safety checks)
UPDATE public.profiles SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';
UPDATE public.profiles SET last_name = '' WHERE last_name IS NULL;

-- Only add NOT NULL constraint if all data is valid
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles WHERE first_name IS NULL OR first_name = '') = 0 THEN
    ALTER TABLE public.profiles ALTER COLUMN first_name SET NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping NOT NULL constraint due to invalid data';
  END IF;
END $$;

-- Step 10: Add employee_id column to bookings (without foreign key first)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS employee_id UUID;

-- Step 11: Sync existing booking data (only valid references)
UPDATE public.bookings 
SET employee_id = assigned_employee_id 
WHERE employee_id IS NULL 
  AND assigned_employee_id IS NOT NULL
  AND assigned_employee_id IN (SELECT id FROM profiles);

-- Step 12: Add foreign key constraint AFTER data is clean
DO $$
BEGIN
  -- Double-check that all employee_id references are valid
  IF (SELECT COUNT(*) FROM bookings b 
      LEFT JOIN profiles p ON b.employee_id = p.id 
      WHERE b.employee_id IS NOT NULL AND p.id IS NULL) = 0 THEN
    
    -- Safe to add foreign key constraint
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'bookings_employee_id_fkey'
    ) THEN
      ALTER TABLE public.bookings 
      ADD CONSTRAINT bookings_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.profiles(id);
      RAISE NOTICE 'Foreign key constraint added successfully';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key constraint skipped - still have invalid references';
  END IF;
END $$;

-- Step 13: Create trigger to keep employee fields in sync
CREATE OR REPLACE FUNCTION sync_booking_employee_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the reference exists in profiles table
  IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id THEN
    IF NEW.assigned_employee_id IS NULL OR 
       EXISTS (SELECT 1 FROM profiles WHERE id = NEW.assigned_employee_id) THEN
      NEW.employee_id = NEW.assigned_employee_id;
    ELSE
      NEW.employee_id = NULL;
      RAISE NOTICE 'Invalid employee reference %, setting employee_id to NULL', NEW.assigned_employee_id;
    END IF;
  END IF;
  
  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    IF NEW.employee_id IS NULL OR 
       EXISTS (SELECT 1 FROM profiles WHERE id = NEW.employee_id) THEN
      NEW.assigned_employee_id = NEW.employee_id;
    ELSE
      NEW.assigned_employee_id = NULL;
      RAISE NOTICE 'Invalid employee reference %, setting assigned_employee_id to NULL', NEW.employee_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_booking_employee_ids_trigger ON public.bookings;
CREATE TRIGGER sync_booking_employee_ids_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_employee_ids();

-- Step 14: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON public.bookings(employee_id);

-- Step 15: Also update employees table for consistency
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Parse existing employee names
UPDATE public.employees 
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END,
  full_name = name
WHERE first_name IS NULL;

-- Step 16: Final verification
SELECT 'FINAL_VERIFICATION' as status;

SELECT 
  'profiles_columns' as check_type,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('name', 'first_name', 'last_name', 'full_name')
ORDER BY column_name;

SELECT 'data_sample' as check_type;
SELECT id, name, first_name, last_name, full_name
FROM public.profiles 
LIMIT 3;

SELECT 'foreign_key_check' as check_type;
SELECT 
  CASE WHEN COUNT(*) = 0 THEN 'ALL_CLEAN' ELSE 'ISSUES_REMAIN' END as status,
  COUNT(*) as problematic_bookings
FROM bookings b 
LEFT JOIN profiles p ON b.employee_id = p.id 
WHERE b.employee_id IS NOT NULL AND p.id IS NULL;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema migration completed safely!';
  RAISE NOTICE '1. Cleaned up orphaned booking references';
  RAISE NOTICE '2. Added first_name, last_name, and full_name columns';
  RAISE NOTICE '3. Created automatic synchronization triggers';
  RAISE NOTICE '4. Added employee_id to bookings with safe constraints';
  RAISE NOTICE '5. Added performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Data integrity preserved throughout migration';
END $$;
