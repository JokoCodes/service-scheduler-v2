-- Staff Management Migration
-- Adds support for multiple staff assignment and capacity tracking

BEGIN;

-- Step 1: Add staff fields to bookings table if they don't exist
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS staff_required INTEGER DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS staff_fulfilled INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Create booking_staff_assignments table for many-to-many relationship
-- This allows multiple employees to be assigned to a single booking
CREATE TABLE IF NOT EXISTS public.booking_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff', -- 'lead', 'staff', 'supervisor'
  status TEXT DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'completed'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate assignments
  UNIQUE(booking_id, employee_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_staff_assignments_booking_id ON public.booking_staff_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_staff_assignments_employee_id ON public.booking_staff_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_booking_staff_assignments_status ON public.booking_staff_assignments(status);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_required ON public.bookings(staff_required);
CREATE INDEX IF NOT EXISTS idx_bookings_staff_fulfilled ON public.bookings(staff_fulfilled);

-- Step 4: Create function to update staff_fulfilled count automatically
CREATE OR REPLACE FUNCTION update_booking_staff_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update staff_fulfilled count for the affected booking
  UPDATE public.bookings 
  SET staff_fulfilled = (
    SELECT COUNT(*) 
    FROM public.booking_staff_assignments 
    WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
    AND status IN ('assigned', 'accepted', 'completed')
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create triggers to automatically update staff counts
DROP TRIGGER IF EXISTS trigger_update_staff_count_insert ON public.booking_staff_assignments;
DROP TRIGGER IF EXISTS trigger_update_staff_count_update ON public.booking_staff_assignments;
DROP TRIGGER IF EXISTS trigger_update_staff_count_delete ON public.booking_staff_assignments;

CREATE TRIGGER trigger_update_staff_count_insert
  AFTER INSERT ON public.booking_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION update_booking_staff_count();

CREATE TRIGGER trigger_update_staff_count_update
  AFTER UPDATE ON public.booking_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION update_booking_staff_count();

CREATE TRIGGER trigger_update_staff_count_delete
  AFTER DELETE ON public.booking_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION update_booking_staff_count();

-- Step 6: Create view for booking staff summary (useful for mobile app)
CREATE OR REPLACE VIEW public.booking_staff_summary AS
SELECT 
  b.id as booking_id,
  b.customer_name,
  b.service_name,
  b.scheduled_date,
  b.scheduled_time,
  b.service_address,
  b.status as booking_status,
  b.staff_required,
  b.staff_fulfilled,
  CASE 
    WHEN b.staff_fulfilled >= b.staff_required THEN 'fully_staffed'
    WHEN b.staff_fulfilled > 0 THEN 'partially_staffed'
    ELSE 'unstaffed'
  END as staffing_status,
  ARRAY_AGG(
    CASE 
      WHEN bsa.employee_id IS NOT NULL THEN
        json_build_object(
          'employee_id', bsa.employee_id,
          'employee_name', p.name,
          'role', bsa.role,
          'status', bsa.status,
          'accepted_at', bsa.accepted_at
        )
      ELSE NULL
    END
  ) FILTER (WHERE bsa.employee_id IS NOT NULL) as assigned_staff
FROM public.bookings b
LEFT JOIN public.booking_staff_assignments bsa ON b.id = bsa.booking_id
LEFT JOIN public.profiles p ON bsa.employee_id = p.id
GROUP BY b.id, b.customer_name, b.service_name, b.scheduled_date, 
         b.scheduled_time, b.service_address, b.status, 
         b.staff_required, b.staff_fulfilled;

-- Step 7: Migrate existing assigned_employee_id to new system
-- Only migrate assignments where the employee still exists in profiles table
INSERT INTO public.booking_staff_assignments (booking_id, employee_id, role, status)
SELECT 
  b.id as booking_id,
  b.assigned_employee_id as employee_id,
  'lead' as role,
  'assigned' as status
FROM public.bookings b
INNER JOIN public.profiles p ON b.assigned_employee_id = p.id
WHERE b.assigned_employee_id IS NOT NULL
ON CONFLICT (booking_id, employee_id) DO NOTHING;

-- Log any bookings with invalid employee references that couldn't be migrated
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM public.bookings b
  LEFT JOIN public.profiles p ON b.assigned_employee_id = p.id
  WHERE b.assigned_employee_id IS NOT NULL AND p.id IS NULL;
  
  IF invalid_count > 0 THEN
    RAISE NOTICE 'WARNING: % bookings have invalid assigned_employee_id references that could not be migrated', invalid_count;
    RAISE NOTICE 'These bookings will need manual review and correction.';
  END IF;
END $$;

-- Step 8: Enable RLS (Row Level Security) for the new table
ALTER TABLE public.booking_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "booking_staff_assignments_select_policy" ON public.booking_staff_assignments
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      INNER JOIN auth.users u ON p.id = u.id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "booking_staff_assignments_insert_policy" ON public.booking_staff_assignments
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      INNER JOIN auth.users u ON p.id = u.id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "booking_staff_assignments_update_policy" ON public.booking_staff_assignments
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      INNER JOIN auth.users u ON p.id = u.id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "booking_staff_assignments_delete_policy" ON public.booking_staff_assignments
  FOR DELETE USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      INNER JOIN auth.users u ON p.id = u.id
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Step 9: Verification queries
SELECT 
  'VERIFICATION' as status,
  'bookings staff columns' as check_type,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'bookings' 
  AND table_schema = 'public' 
  AND column_name IN ('staff_required', 'staff_fulfilled');

SELECT 
  'VERIFICATION' as status,
  'booking_staff_assignments table' as check_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'booking_staff_assignments' 
    AND table_schema = 'public'
  ) THEN 'EXISTS' ELSE 'MISSING' END as result;

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Staff Management Migration Completed!';
  RAISE NOTICE '1. ✅ Added staff_required/staff_fulfilled columns';
  RAISE NOTICE '2. ✅ Created booking_staff_assignments table';
  RAISE NOTICE '3. ✅ Added automatic staff count triggers';
  RAISE NOTICE '4. ✅ Created booking_staff_summary view';
  RAISE NOTICE '5. ✅ Migrated existing assignments';
  RAISE NOTICE '6. ✅ Applied Row Level Security';
  RAISE NOTICE '========================================';
END $$;
