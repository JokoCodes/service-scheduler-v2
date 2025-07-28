-- Test Script for Staff Assignment Functionality
-- This script tests the database triggers and views for staff management

BEGIN;

-- Test 1: Verify that the tables exist and have correct structure
SELECT 
  'TEST 1: Table Structure Check' as test_name,
  (SELECT count(*) FROM information_schema.tables WHERE table_name = 'booking_staff_assignments') as assignments_table_exists,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'bookings' AND column_name IN ('staff_required', 'staff_fulfilled')) as booking_columns_exist;

-- Test 2: Insert a test booking to work with
INSERT INTO bookings (
  id, 
  customer_name, 
  customer_email, 
  service_name, 
  scheduled_date, 
  scheduled_time, 
  status,
  staff_required,
  staff_fulfilled,
  company_id
) VALUES (
  'test-booking-123',
  'Test Customer',
  'test@example.com',
  'Test Service',
  '2024-02-15',
  '10:00:00',
  'pending',
  3,  -- Requires 3 staff
  0,  -- Currently 0 fulfilled
  'test-company-id'
) ON CONFLICT (id) DO UPDATE SET
  staff_required = 3,
  staff_fulfilled = 0;

-- Test 3: Check initial booking state
SELECT 
  'TEST 2: Initial Booking State' as test_name,
  id,
  customer_name,
  staff_required,
  staff_fulfilled
FROM bookings 
WHERE id = 'test-booking-123';

-- Test 4: Create test staff assignments (simulating job pickup)
-- First, we need to ensure we have test profile entries
INSERT INTO profiles (id, name, email) VALUES 
  ('test-employee-1', 'John Doe', 'john@example.com'),
  ('test-employee-2', 'Jane Smith', 'jane@example.com'),
  ('test-employee-3', 'Bob Johnson', 'bob@example.com')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Test 5: Assign staff and check if triggers update staff_fulfilled count
INSERT INTO booking_staff_assignments (
  booking_id,
  employee_id,
  role,
  status
) VALUES 
  ('test-booking-123', 'test-employee-1', 'lead', 'assigned'),
  ('test-booking-123', 'test-employee-2', 'staff', 'assigned')
ON CONFLICT (booking_id, employee_id) DO UPDATE SET
  status = EXCLUDED.status;

-- Test 6: Check if staff_fulfilled was updated by trigger
SELECT 
  'TEST 3: After Assignment' as test_name,
  id,
  customer_name,
  staff_required,
  staff_fulfilled,
  CASE 
    WHEN staff_fulfilled >= staff_required THEN 'fully_staffed'
    WHEN staff_fulfilled > 0 THEN 'partially_staffed'
    ELSE 'unstaffed'
  END as staffing_status
FROM bookings 
WHERE id = 'test-booking-123';

-- Test 7: Simulate job pickup (accepting assignment)
UPDATE booking_staff_assignments 
SET 
  status = 'accepted',
  accepted_at = NOW()
WHERE booking_id = 'test-booking-123' 
  AND employee_id = 'test-employee-1';

-- Test 8: Check staffing status after acceptance
SELECT 
  'TEST 4: After Job Pickup (Accept)' as test_name,
  b.id,
  b.customer_name,
  b.staff_required,
  b.staff_fulfilled,
  CASE 
    WHEN b.staff_fulfilled >= b.staff_required THEN 'fully_staffed'
    WHEN b.staff_fulfilled > 0 THEN 'partially_staffed'
    ELSE 'unstaffed'
  END as staffing_status
FROM bookings b
WHERE b.id = 'test-booking-123';

-- Test 9: Check the staff summary view
SELECT 
  'TEST 5: Staff Summary View' as test_name,
  booking_id,
  customer_name,
  staff_required,
  staff_fulfilled,
  staffing_status,
  jsonb_array_length(assigned_staff::jsonb) as assigned_staff_count
FROM booking_staff_summary 
WHERE booking_id = 'test-booking-123';

-- Test 10: Simulate another staff member picking up the job
UPDATE booking_staff_assignments 
SET 
  status = 'accepted',
  accepted_at = NOW()
WHERE booking_id = 'test-booking-123' 
  AND employee_id = 'test-employee-2';

-- Test 11: Add third staff member to fulfill requirement
INSERT INTO booking_staff_assignments (
  booking_id,
  employee_id,
  role,
  status,
  accepted_at
) VALUES 
  ('test-booking-123', 'test-employee-3', 'staff', 'accepted', NOW())
ON CONFLICT (booking_id, employee_id) DO UPDATE SET
  status = 'accepted',
  accepted_at = NOW();

-- Test 12: Final check - should be fully staffed
SELECT 
  'TEST 6: Final Fully Staffed State' as test_name,
  b.id,
  b.customer_name,
  b.staff_required,
  b.staff_fulfilled,
  CASE 
    WHEN b.staff_fulfilled >= b.staff_required THEN 'fully_staffed'
    WHEN b.staff_fulfilled > 0 THEN 'partially_staffed'
    ELSE 'unstaffed'
  END as staffing_status
FROM bookings b
WHERE b.id = 'test-booking-123';

-- Test 13: Check individual assignments
SELECT 
  'TEST 7: Individual Assignments' as test_name,
  bsa.id,
  bsa.employee_id,
  p.name as employee_name,
  bsa.role,
  bsa.status,
  bsa.assigned_at,
  bsa.accepted_at
FROM booking_staff_assignments bsa
JOIN profiles p ON bsa.employee_id = p.id
WHERE bsa.booking_id = 'test-booking-123'
ORDER BY bsa.assigned_at;

-- Cleanup test data
DELETE FROM booking_staff_assignments WHERE booking_id = 'test-booking-123';
DELETE FROM bookings WHERE id = 'test-booking-123';
DELETE FROM profiles WHERE id IN ('test-employee-1', 'test-employee-2', 'test-employee-3');

SELECT 'TEST COMPLETE: All test data cleaned up' as final_message;

ROLLBACK;
