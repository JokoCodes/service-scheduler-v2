-- Quick verification script to ensure staff management tables exist
-- Run this to verify the database setup before testing

-- Check if booking_staff_assignments table exists
SELECT 
  'booking_staff_assignments table check' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'booking_staff_assignments' 
      AND table_schema = 'public'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌ - Run database-migrations/002_staff_management.sql'
  END as status;

-- Check if bookings table has staff columns
SELECT 
  'bookings staff columns check' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name IN ('staff_required', 'staff_fulfilled')
      AND table_schema = 'public'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌ - Run database-migrations/002_staff_management.sql'
  END as status;

-- Check if employees table has profile_id column and foreign key
SELECT 
  'employees profile_id column check' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name = 'profile_id'
      AND table_schema = 'public'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌ - Check employees table schema'
  END as status;

-- Check if the booking_staff_summary view exists
SELECT 
  'booking_staff_summary view check' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'booking_staff_summary' 
      AND table_schema = 'public'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌ - Run database-migrations/002_staff_management.sql'
  END as status;

-- Check if triggers exist
SELECT 
  'staff count triggers check' as verification,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name LIKE '%staff_count%'
    ) THEN 'EXISTS ✅'
    ELSE 'MISSING ❌ - Run database-migrations/002_staff_management.sql'
  END as status;
