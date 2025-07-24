# First/Last Name Migration Plan

## Overview

This migration adds support for storing first and last names separately for customers, employees, and staff members while maintaining backward compatibility with existing single name fields.

## Migration Strategy

### Phase 1: Database Schema Changes ✅
- Add new `first_name` and `last_name` columns to relevant tables
- Keep existing `name` columns for backward compatibility
- Add computed `full_name` columns for easy access

### Phase 2: Data Migration ✅
- Split existing names using intelligent parsing
- Handle edge cases (single names, multiple middle names, etc.)
- Populate new fields with migrated data

### Phase 3: Frontend Updates 🔄
- Update TypeScript types to support new fields
- Modify UI components to use new name fields
- Add utility functions for name handling

### Phase 4: API Updates 🔄
- Update API endpoints to handle both old and new formats
- Add validation for new name fields
- Ensure backward compatibility

### Phase 5: Testing & Validation 🔄
- Test data integrity after migration
- Verify UI displays names correctly
- Test API compatibility

### Phase 6: Cleanup 🔄
- Remove legacy fields after full migration
- Update documentation
- Remove compatibility code

## Current Name Extraction

With your current setup, you can extract first names using SQL:

```sql
-- Get first name from existing name field
SELECT 
  id,
  name,
  TRIM(SPLIT_PART(name, ' ', 1)) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1 
    THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
    ELSE ''
  END as last_name
FROM customers;
```

## Database Schema Changes

### Tables Modified:
- `customers` - Added `first_name`, `last_name`, `full_name`
- `employees` - Added `first_name`, `last_name`, `full_name`
- `profiles` - Added `first_name`, `last_name`, `full_name`
- `bookings` - Added `customer_first_name`, `customer_last_name`, `assigned_employee_first_name`, `assigned_employee_last_name`

### New Indexes:
- Performance indexes on name fields for search
- Composite indexes for full name searches

## Frontend Changes

### Updated Types:
```typescript
// New fields added to Booking interface
interface Booking {
  // Legacy fields (optional during migration)
  customerName?: string
  assignedEmployeeName?: string
  
  // New name fields
  customerFirstName: string
  customerLastName: string
  assignedEmployeeFirstName?: string
  assignedEmployeeLastName?: string
}

// Similar updates for Employee and Customer interfaces
```

### Utility Functions:
- `splitFullName()` - Split full name into components
- `combineNames()` - Combine first/last into full name
- `getDisplayName()` - Get best available name with fallbacks
- `convertLegacyBooking()` - Convert old format to new

### UI Components Updated:
- Booking forms now support separate first/last name fields
- Display logic uses utility functions for backward compatibility
- Search functionality works with both old and new formats

## Benefits of New Structure

### 1. **Better Data Quality**
- Separate fields prevent name parsing errors
- Easier validation and formatting
- Support for names from different cultures

### 2. **Enhanced Features**
- Personalized greetings using first names
- Better sorting and searching capabilities
- Improved customer experience

### 3. **Reporting & Analytics**
- Name-based insights and demographics
- Better customer segmentation
- Improved data export quality

### 4. **Integration Friendly**
- Many external APIs expect separate name fields
- Better compatibility with CRM systems
- Easier data synchronization

## Migration Timeline

### Immediate (Week 1)
- [x] Run database migration
- [x] Update TypeScript types
- [x] Add utility functions

### Short Term (Week 2-3)
- [ ] Update booking creation/editing forms
- [ ] Update customer management UI
- [ ] Update employee management UI
- [ ] Test data integrity

### Medium Term (Week 4-6)
- [ ] Update all API endpoints
- [ ] Add comprehensive validation
- [ ] Update documentation
- [ ] Train team on new fields

### Long Term (Week 7-8)
- [ ] Remove legacy compatibility code
- [ ] Drop old name columns
- [ ] Final cleanup and optimization

## Rollback Plan

If issues occur, the migration can be rolled back using:

```sql
-- Remove new columns
ALTER TABLE customers DROP COLUMN first_name, DROP COLUMN last_name, DROP COLUMN full_name;
ALTER TABLE employees DROP COLUMN first_name, DROP COLUMN last_name, DROP COLUMN full_name;
-- ... etc
```

## Testing Checklist

### Data Integrity
- [ ] All existing names properly split
- [ ] No data loss during migration
- [ ] Full names match original names
- [ ] Edge cases handled correctly

### UI Functionality
- [ ] Forms accept first/last names
- [ ] Display shows correct names
- [ ] Search works with new fields
- [ ] Legacy data displays correctly

### API Compatibility
- [ ] Old API calls still work
- [ ] New API calls work correctly
- [ ] Validation prevents bad data
- [ ] Error handling works

### Performance
- [ ] Search performance maintained
- [ ] Database indexes working
- [ ] No significant slowdowns
- [ ] Query optimization verified

## Support and Troubleshooting

### Common Issues:

**1. Names not splitting correctly**
- Check `splitFullName()` function logic
- Review edge cases in migration script
- Manually fix problematic entries

**2. UI showing empty names**
- Verify `getDisplayName()` fallback logic
- Check component prop passing
- Ensure legacy compatibility

**3. Search not working**
- Verify search includes both old and new fields
- Check database indexes
- Test search query logic

**4. API errors**
- Check field validation rules
- Verify required field logic
- Test with both old/new payloads

### Getting Help:
- Check migration logs for errors
- Review utility function implementations
- Test with sample data first
- Contact development team for issues

---

## Files Modified in This Migration:

### Database:
- `database/migrations/add_first_last_names.sql` - Main migration script

### Types:
- `packages/shared-types/src/database.ts` - Database type definitions
- `packages/shared-types/src/business.ts` - Business logic types
- `packages/shared-types/src/nameUtils.ts` - Name utility functions
- `packages/shared-types/src/index.ts` - Export new utilities

### Frontend:
- `apps/web/src/app/dashboard/bookings/page.tsx` - Updated booking page
- Components that display customer/employee names
- Forms that collect name information

### API (Pending):
- Backend API endpoints
- Validation schemas
- Database query logic

This migration provides a solid foundation for better name handling while maintaining full backward compatibility during the transition period.
