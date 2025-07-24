-- Fix Schema Inconsistencies Migration - SAFE VERSION
-- This migration resolves the schema mismatches with better error handling
-- Run fix-data-inconsistencies-pre-migration.sql FIRST

BEGIN;

-- Step 1: Add full_name column to profiles table (aliasing name)
-- The code expects 'full_name' but the table has 'name'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Sync existing data from name to full_name
UPDATE public.profiles 
SET full_name = name 
WHERE full_name IS NULL AND name IS NOT NULL;

-- Create trigger to keep full_name in sync with name
CREATE OR REPLACE FUNCTION sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
  -- When name is updated, update full_name
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.full_name = NEW.name;
  END IF;
  
  -- When full_name is updated, update name
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    NEW.name = NEW.full_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_profile_names_trigger ON public.profiles;

-- Create trigger for automatic sync
CREATE TRIGGER sync_profile_names_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_names();

-- Step 2: Add employee_id column to bookings table SAFELY
-- The code expects 'employee_id' but the table has 'assigned_employee_id'
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS employee_id UUID;

-- IMPORTANT: Verify data integrity before adding foreign key constraint
-- Check for orphaned references
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM public.bookings b
  LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
  WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL;
  
  IF orphaned_count > 0 THEN
    RAISE WARNING 'Found % orphaned employee references. Consider running fix-data-inconsistencies-pre-migration.sql first.', orphaned_count;
  ELSE
    RAISE NOTICE 'Data integrity check passed. No orphaned references found.';
  END IF;
END $$;

-- Sync existing data from assigned_employee_id to employee_id
-- Only copy valid references that exist in profiles table
UPDATE public.bookings 
SET employee_id = assigned_employee_id 
WHERE employee_id IS NULL 
  AND assigned_employee_id IS NOT NULL
  AND assigned_employee_id IN (SELECT id FROM public.profiles);

-- Add foreign key constraint for employee_id with better error handling
DO $$
BEGIN
  -- First check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_employee_id_fkey'
  ) THEN
    
    -- Double-check for any remaining orphaned references
    IF NOT EXISTS (
      SELECT 1 FROM public.bookings b
      LEFT JOIN public.profiles p ON b.employee_id = p.id
      WHERE b.employee_id IS NOT NULL AND p.id IS NULL
    ) THEN
      -- Safe to add constraint
      ALTER TABLE public.bookings 
      ADD CONSTRAINT bookings_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.profiles(id);
      
      RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
      RAISE WARNING 'Cannot add foreign key constraint due to orphaned references. Run data cleanup first.';
    END IF;
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to add foreign key constraint: %', SQLERRM;
END $$;

-- Create trigger to keep employee_id in sync with assigned_employee_id
CREATE OR REPLACE FUNCTION sync_booking_employee_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- When assigned_employee_id is updated, update employee_id
  IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id THEN
    NEW.employee_id = NEW.assigned_employee_id;
  END IF;
  
  -- When employee_id is updated, update assigned_employee_id
  IF NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    NEW.assigned_employee_id = NEW.employee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_booking_employee_ids_trigger ON public.bookings;

-- Create trigger for automatic sync
CREATE TRIGGER sync_booking_employee_ids_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_employee_ids();

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON public.bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_employee_id ON public.bookings(assigned_employee_id);

-- Step 4: Comprehensive verification queries
SELECT 
  'VERIFICATION' as status,
  'profiles table columns' as check_type,
  CASE 
    WHEN column_name = 'name' THEN 'EXISTS - name'
    WHEN column_name = 'full_name' THEN 'EXISTS - full_name'
  END as result
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public' 
  AND column_name IN ('name', 'full_name')

UNION ALL

SELECT 
  'VERIFICATION' as status,
  'bookings table columns' as check_type,
  CASE 
    WHEN column_name = 'assigned_employee_id' THEN 'EXISTS - assigned_employee_id'
    WHEN column_name = 'employee_id' THEN 'EXISTS - employee_id'
  END as result
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND table_schema = 'public' 
  AND column_name IN ('assigned_employee_id', 'employee_id')

UNION ALL

SELECT 
  'VERIFICATION' as status,
  'data sync check' as check_type,
  COUNT(*)::text || ' profiles with synced names' as result
FROM public.profiles 
WHERE name = full_name OR (name IS NULL AND full_name IS NULL)

UNION ALL

SELECT 
  'VERIFICATION' as status,
  'data sync check' as check_type,
  COUNT(*)::text || ' bookings with synced employee_ids' as result
FROM public.bookings 
WHERE assigned_employee_id = employee_id OR (assigned_employee_id IS NULL AND employee_id IS NULL)

UNION ALL

SELECT 
  'VERIFICATION' as status,
  'foreign key constraint' as check_type,
  CASE 
    WHEN COUNT(*) > 0 THEN 'EXISTS - bookings_employee_id_fkey'
    ELSE 'MISSING - bookings_employee_id_fkey'
  END as result
FROM pg_constraint 
WHERE conname = 'bookings_employee_id_fkey';

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema inconsistencies migration completed!';
  RAISE NOTICE '1. ✅ Added full_name column to profiles (synced with name)';
  RAISE NOTICE '2. ✅ Added employee_id column to bookings (synced with assigned_employee_id)';
  RAISE NOTICE '3. ✅ Created triggers to keep columns in sync';
  RAISE NOTICE '4. ✅ Added performance indexes';
  RAISE NOTICE '5. ✅ Added data integrity checks';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '- Test the Jobs screen functionality';
  RAISE NOTICE '- Verify data synchronization is working';
  RAISE NOTICE '- Monitor for any remaining data issues';
  RAISE NOTICE '========================================';
END $$;
