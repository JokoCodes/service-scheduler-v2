# Testing Guide: New Assignment System Implementation

## What We Fixed

✅ **Updated Mobile Job Retrieval**: Jobs service now queries `booking_staff_assignments` instead of legacy `bookings.assigned_employee_id`
✅ **Updated Mobile API**: Active jobs endpoint uses new assignment system  
✅ **Updated Job Details**: Handles both new assignment data and legacy fallbacks
✅ **Updated Jobs Screen**: Shows assignment role and uses new status logic

## Testing Steps

### 1. Test Staff Assignment Creation
```bash
# This should already work from previous testing
curl -X POST http://192.168.86.20:3002/api/jobs/bookings/BOOKING_ID/staff \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "USER_PROFILE_ID", "role": "employee"}'
```

### 2. Test Mobile Jobs Retrieval
```bash
# Test the mobile API active jobs endpoint
curl -X GET http://192.168.86.20:3002/api/jobs/active \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Mobile App Flow
1. **Open Mobile App**
2. **Go to Jobs Tab**
3. **Assign a job** from Available tab (should create assignment)
4. **Check Assigned tab** - job should appear immediately
5. **Refresh** - job should persist in Assigned tab

### 4. Verify Database State
```sql
-- Check that assignment was created
SELECT * FROM booking_staff_assignments 
WHERE employee_id = 'YOUR_PROFILE_ID';

-- Verify booking is not in legacy assigned field
SELECT id, assigned_employee_id, status 
FROM bookings 
WHERE id = 'BOOKING_ID';
```

## Expected Results

### Before Fix ❌
- Staff assignment creates record in `booking_staff_assignments`
- Mobile app queries `bookings.assigned_employee_id` (null)
- Job doesn't appear in Assigned tab

### After Fix ✅
- Staff assignment creates record in `booking_staff_assignments`
- Mobile app queries `booking_staff_assignments` table
- Job appears immediately in Assigned tab
- Shows assignment role and metadata

## Debug Logging

The implementation includes comprehensive logging:

```javascript
// JobsService logs
🔍 [JobsService] Fetching jobs for profile: [profile_id]
✅ [JobsService] Assigned jobs found: [count]
✅ [JobsService] Available jobs found: [count]
📊 [JobsService] Final job counts: {...}

// Mobile API logs  
🔍 Employee resolution started: {...}
✅ Staff assigned successfully: {...}
```

## Rollback Plan

If issues occur, the mobile app includes legacy fallbacks:
- Job details checks both new assignment data and legacy fields
- Status determination includes fallback logic
- Assignment detection works with both systems

## Performance Notes

- **Efficient Queries**: Uses joins to minimize database calls
- **Indexed Fields**: `booking_staff_assignments` table has proper indexes
- **Lazy Loading**: Data is fetched on-demand with pull-to-refresh

## Next Steps After Testing

1. **Monitor Performance**: Check query performance in production
2. **Clean Legacy Data**: Eventually remove `assigned_employee_id` references
3. **Real-time Updates**: Add WebSocket subscriptions for live job updates
4. **Notifications**: Implement push notifications for new assignments
