-- Migration: Add First/Last Name Support
-- This migration adds first_name and last_name columns to customers, employees, profiles, and bookings tables
-- while maintaining backward compatibility with existing name fields

-- ============================================================================
-- PHASE 1: Add new columns
-- ============================================================================

-- Add new name columns to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS first_name character varying,
ADD COLUMN IF NOT EXISTS last_name character varying;

-- Add new name columns to employees table  
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS first_name character varying,
ADD COLUMN IF NOT EXISTS last_name character varying;

-- Add new name columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Add new customer name columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS customer_first_name character varying,
ADD COLUMN IF NOT EXISTS customer_last_name character varying;

-- Add new employee name columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS assigned_employee_first_name character varying,
ADD COLUMN IF NOT EXISTS assigned_employee_last_name character varying;

-- ============================================================================
-- PHASE 2: Data migration - Split existing names
-- ============================================================================

-- Function to split names (handles edge cases)
CREATE OR REPLACE FUNCTION split_name(full_name text, part text)
RETURNS text AS $$
BEGIN
    IF full_name IS NULL OR trim(full_name) = '' THEN
        RETURN '';
    END IF;
    
    CASE part
        WHEN 'first' THEN
            RETURN trim(split_part(full_name, ' ', 1));
        WHEN 'last' THEN
            -- Handle single names and multi-word last names
            IF array_length(string_to_array(trim(full_name), ' '), 1) <= 1 THEN
                RETURN '';
            ELSE
                RETURN trim(substring(full_name FROM position(' ' IN full_name) + 1));
            END IF;
        ELSE
            RETURN '';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Migrate customers table
UPDATE customers 
SET 
    first_name = split_name(name, 'first'),
    last_name = split_name(name, 'last')
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Migrate employees table
UPDATE employees 
SET 
    first_name = split_name(name, 'first'),
    last_name = split_name(name, 'last')
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Migrate profiles table
UPDATE profiles 
SET 
    first_name = split_name(name, 'first'),
    last_name = split_name(name, 'last')
WHERE name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

-- Migrate bookings table (customer names)
UPDATE bookings 
SET 
    customer_first_name = split_name(customer_name, 'first'),
    customer_last_name = split_name(customer_name, 'last')
WHERE customer_name IS NOT NULL AND (customer_first_name IS NULL OR customer_last_name IS NULL);

-- Migrate bookings table (employee names)
UPDATE bookings 
SET 
    assigned_employee_first_name = split_name(assigned_employee_name, 'first'),
    assigned_employee_last_name = split_name(assigned_employee_name, 'last')
WHERE assigned_employee_name IS NOT NULL AND (assigned_employee_first_name IS NULL OR assigned_employee_last_name IS NULL);

-- ============================================================================
-- PHASE 3: Add computed columns for backward compatibility
-- ============================================================================

-- Add computed full_name columns
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS full_name character varying 
GENERATED ALWAYS AS (
    CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND trim(last_name) != '' THEN
            trim(first_name) || ' ' || trim(last_name)
        WHEN first_name IS NOT NULL THEN
            trim(first_name)
        WHEN last_name IS NOT NULL THEN
            trim(last_name)
        ELSE
            ''
    END
) STORED;

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS full_name character varying 
GENERATED ALWAYS AS (
    CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND trim(last_name) != '' THEN
            trim(first_name) || ' ' || trim(last_name)
        WHEN first_name IS NOT NULL THEN
            trim(first_name)
        WHEN last_name IS NOT NULL THEN
            trim(last_name)
        ELSE
            ''
    END
) STORED;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name text 
GENERATED ALWAYS AS (
    CASE 
        WHEN first_name IS NOT NULL AND last_name IS NOT NULL AND trim(last_name) != '' THEN
            trim(first_name) || ' ' || trim(last_name)
        WHEN first_name IS NOT NULL THEN
            trim(first_name)
        WHEN last_name IS NOT NULL THEN
            trim(last_name)
        ELSE
            ''
    END
) STORED;

-- ============================================================================
-- PHASE 4: Data validation and cleanup
-- ============================================================================

-- Set empty strings to NULL for cleaner data
UPDATE customers SET first_name = NULL WHERE trim(first_name) = '';
UPDATE customers SET last_name = NULL WHERE trim(last_name) = '';

UPDATE employees SET first_name = NULL WHERE trim(first_name) = '';
UPDATE employees SET last_name = NULL WHERE trim(last_name) = '';

UPDATE profiles SET first_name = NULL WHERE trim(first_name) = '';
UPDATE profiles SET last_name = NULL WHERE trim(last_name) = '';

UPDATE bookings SET customer_first_name = NULL WHERE trim(customer_first_name) = '';
UPDATE bookings SET customer_last_name = NULL WHERE trim(customer_last_name) = '';
UPDATE bookings SET assigned_employee_first_name = NULL WHERE trim(assigned_employee_first_name) = '';
UPDATE bookings SET assigned_employee_last_name = NULL WHERE trim(assigned_employee_last_name) = '';

-- ============================================================================
-- PHASE 5: Add constraints (after migration is complete and tested)
-- ============================================================================

-- NOTE: Uncomment these after confirming migration is successful
-- and frontend has been updated to use new fields

-- Make first_name required for new records
-- ALTER TABLE customers ALTER COLUMN first_name SET NOT NULL;
-- ALTER TABLE employees ALTER COLUMN first_name SET NOT NULL;  
-- ALTER TABLE profiles ALTER COLUMN first_name SET NOT NULL;

-- Add check constraints to ensure at least first_name is provided
-- ALTER TABLE customers ADD CONSTRAINT customers_name_check 
--     CHECK (first_name IS NOT NULL AND trim(first_name) != '');
-- ALTER TABLE employees ADD CONSTRAINT employees_name_check 
--     CHECK (first_name IS NOT NULL AND trim(first_name) != '');
-- ALTER TABLE profiles ADD CONSTRAINT profiles_name_check 
--     CHECK (first_name IS NOT NULL AND trim(first_name) != '');

-- ============================================================================
-- PHASE 6: Create indexes for performance
-- ============================================================================

-- Add indexes on new name columns for search performance
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers (first_name);
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers (last_name);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers (full_name);

CREATE INDEX IF NOT EXISTS idx_employees_first_name ON employees (first_name);
CREATE INDEX IF NOT EXISTS idx_employees_last_name ON employees (last_name);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON employees (full_name);

CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON profiles (first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON profiles (last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles (full_name);

-- Composite indexes for full name searches
CREATE INDEX IF NOT EXISTS idx_customers_names ON customers (first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_employees_names ON employees (first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_names ON profiles (first_name, last_name);

-- ============================================================================
-- PHASE 7: Create views for backward compatibility (OPTIONAL)
-- ============================================================================

-- Create views that maintain the old interface for legacy code
CREATE OR REPLACE VIEW customers_legacy AS
SELECT 
    id,
    COALESCE(full_name, name, first_name, '') as name,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    address,
    notes,
    total_bookings,
    total_spent,
    last_booking_date,
    company_id,
    created_at,
    updated_at,
    avg_rating,
    first_booking_date,
    customer_since
FROM customers;

CREATE OR REPLACE VIEW employees_legacy AS
SELECT 
    id,
    COALESCE(full_name, name, first_name, '') as name,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    position,
    is_active,
    hourly_rate,
    company_id,
    created_at,
    updated_at,
    avg_rating,
    total_ratings,
    total_hours_worked,
    total_bookings_completed
FROM employees;

-- ============================================================================
-- PHASE 8: Functions for name operations
-- ============================================================================

-- Function to get display name with fallback logic
CREATE OR REPLACE FUNCTION get_display_name(
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_full_name text DEFAULT NULL,
    p_legacy_name text DEFAULT NULL,
    p_email text DEFAULT NULL
)
RETURNS text AS $$
BEGIN
    -- Try full name first (new or legacy)
    IF p_full_name IS NOT NULL AND trim(p_full_name) != '' THEN
        RETURN trim(p_full_name);
    END IF;
    
    IF p_legacy_name IS NOT NULL AND trim(p_legacy_name) != '' THEN
        RETURN trim(p_legacy_name);
    END IF;
    
    -- Try combining first/last names
    IF p_first_name IS NOT NULL AND trim(p_first_name) != '' THEN
        IF p_last_name IS NOT NULL AND trim(p_last_name) != '' THEN
            RETURN trim(p_first_name) || ' ' || trim(p_last_name);
        ELSE
            RETURN trim(p_first_name);
        END IF;
    END IF;
    
    IF p_last_name IS NOT NULL AND trim(p_last_name) != '' THEN
        RETURN trim(p_last_name);
    END IF;
    
    -- Fallback to email prefix
    IF p_email IS NOT NULL AND trim(p_email) != '' THEN
        RETURN split_part(p_email, '@', 1);
    END IF;
    
    RETURN 'Unknown';
END;
$$ LANGUAGE plpgsql;

-- Drop the helper function (optional)
-- DROP FUNCTION IF EXISTS split_name(text, text);

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (for emergencies)
-- ============================================================================

/*
-- To rollback this migration, run:

-- Remove new columns
ALTER TABLE customers DROP COLUMN IF EXISTS first_name, DROP COLUMN IF EXISTS last_name, DROP COLUMN IF EXISTS full_name;
ALTER TABLE employees DROP COLUMN IF EXISTS first_name, DROP COLUMN IF EXISTS last_name, DROP COLUMN IF EXISTS full_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS first_name, DROP COLUMN IF EXISTS last_name, DROP COLUMN IF EXISTS full_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS customer_first_name, DROP COLUMN IF EXISTS customer_last_name;
ALTER TABLE bookings DROP COLUMN IF EXISTS assigned_employee_first_name, DROP COLUMN IF EXISTS assigned_employee_last_name;

-- Drop views
DROP VIEW IF EXISTS customers_legacy;
DROP VIEW IF EXISTS employees_legacy;

-- Drop functions
DROP FUNCTION IF EXISTS get_display_name(text, text, text, text, text);
DROP FUNCTION IF EXISTS split_name(text, text);

-- Drop indexes
DROP INDEX IF EXISTS idx_customers_first_name, idx_customers_last_name, idx_customers_full_name, idx_customers_names;
DROP INDEX IF EXISTS idx_employees_first_name, idx_employees_last_name, idx_employees_full_name, idx_employees_names;
DROP INDEX IF EXISTS idx_profiles_first_name, idx_profiles_last_name, idx_profiles_full_name, idx_profiles_names;
*/
