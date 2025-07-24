-- Improved Name Schema Migration
-- This migration implements the best practice: first_name + last_name + computed full_name

BEGIN;

-- Step 1: Add first_name and last_name columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Step 2: Parse existing name data into first_name and last_name
-- This is a simple split - you might need to adjust based on your data
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

-- Step 3: Add computed full_name column (PostgreSQL 12+)
-- This automatically combines first_name + last_name
DO $$
BEGIN
  -- Check if we can use generated columns (PostgreSQL 12+)
  IF (SELECT version() LIKE '%PostgreSQL 1[2-9]%' OR version() LIKE '%PostgreSQL [2-9][0-9]%') THEN
    -- Use generated column for automatic computation
    EXECUTE 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255) GENERATED ALWAYS AS (
      CASE 
        WHEN last_name = '''' OR last_name IS NULL THEN first_name
        ELSE first_name || '' '' || last_name 
      END
    ) STORED';
  ELSE
    -- Fallback: regular column with trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
      ALTER TABLE public.profiles ADD COLUMN full_name VARCHAR(255);
    END IF;
  END IF;
END $$;

-- Step 4: Create function to compute full_name (fallback for older PostgreSQL)
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

-- Step 5: Update existing full_name data
UPDATE public.profiles 
SET full_name = compute_full_name(first_name, last_name)
WHERE full_name IS NULL OR full_name = '';

-- Step 6: Create trigger to maintain full_name (for older PostgreSQL versions)
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Compute full_name when first_name or last_name changes
  NEW.full_name = compute_full_name(NEW.first_name, NEW.last_name);
  
  -- If full_name is directly updated, try to parse it back
  IF OLD.full_name IS DISTINCT FROM NEW.full_name AND 
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

-- Step 7: Add NOT NULL constraints (with default values)
UPDATE public.profiles SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';
UPDATE public.profiles SET last_name = '' WHERE last_name IS NULL;

ALTER TABLE public.profiles ALTER COLUMN first_name SET NOT NULL;
-- Note: last_name can be empty (some people have single names)

-- Step 8: Fix bookings table - add employee_id column
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS employee_id UUID;

-- Add foreign key constraint for employee_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_employee_id_fkey'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- Sync existing booking data
UPDATE public.bookings 
SET employee_id = assigned_employee_id 
WHERE employee_id IS NULL AND assigned_employee_id IS NOT NULL;

-- Create trigger to keep employee fields in sync
CREATE OR REPLACE FUNCTION sync_booking_employee_ids()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id THEN
    NEW.employee_id = NEW.assigned_employee_id;
  END IF;
  
  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    NEW.assigned_employee_id = NEW.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_booking_employee_ids_trigger ON public.bookings;
CREATE TRIGGER sync_booking_employee_ids_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_employee_ids();

-- Step 9: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON public.bookings(employee_id);

-- Step 10: Also update employees table for consistency
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

-- Step 11: Verification queries
SELECT 'SCHEMA_VERIFICATION' as status, 'Profiles table structure' as check_type;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('name', 'first_name', 'last_name', 'full_name')
ORDER BY column_name;

SELECT 'DATA_VERIFICATION' as status, 'Sample profile names' as check_type;
SELECT id, name, first_name, last_name, full_name
FROM public.profiles 
LIMIT 3;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Name schema improved successfully!';
  RAISE NOTICE '1. Added first_name and last_name columns';
  RAISE NOTICE '2. Added computed/synced full_name column';
  RAISE NOTICE '3. Created triggers for automatic synchronization';
  RAISE NOTICE '4. Fixed bookings employee_id issue';
  RAISE NOTICE '5. Added performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Best practice: Use first_name + last_name in your forms';
  RAISE NOTICE 'full_name will be computed automatically';
END $$;
