# Service Scheduler - Staffing Capacity Management Implementation Plan

## Overview

This document outlines the complete implementation plan for resolving **Defect #2: Handling Staff Requirements per Job**. The solution provides multi-staff assignment capabilities, real-time status tracking, and mobile app integration.

## Current Status ✅

**What's Already Implemented:**
- ✅ Database schema includes `staff_required` and `staff_fulfilled` fields
- ✅ Frontend types support staff management
- ✅ Basic API routes for bookings
- ✅ Booking deletion functionality fixed (created `/api/bookings/[id]/route.ts`)

## Implementation Phases

### Phase 1: Database Schema Enhancement

**Status:** SQL Migration Created ✅

**Files:**
- `database-migrations/002_staff_management.sql`

**Features:**
1. **Staff Fields:** Added `staff_required` and `staff_fulfilled` to bookings table
2. **Assignment Table:** Created `booking_staff_assignments` for many-to-many relationships
3. **Automatic Counting:** Triggers automatically update `staff_fulfilled` count
4. **Staff Summary View:** `booking_staff_summary` view for efficient queries
5. **Row Level Security:** Applied RLS policies for data security

**Database Schema:**
```sql
-- Bookings table enhancements
ALTER TABLE bookings ADD COLUMN staff_required INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN staff_fulfilled INTEGER DEFAULT 0;

-- New table for multiple staff assignments
CREATE TABLE booking_staff_assignments (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  employee_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'staff', -- 'lead', 'staff', 'supervisor'
  status TEXT DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'completed'
  assigned_at TIMESTAMP,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);
```

### Phase 2: API Enhancements

**Status:** Completed ✅

**New API Endpoints:**

1. **Individual Booking Operations**
   - `GET /api/bookings/[id]` - Get specific booking
   - `PUT /api/bookings/[id]` - Update booking (including staff fields)
   - `DELETE /api/bookings/[id]` - Delete booking ✅ **FIXES 404 ERROR**

2. **Staff Assignment Management**
   - `GET /api/bookings/[id]/staff` - Get staff assignments
   - `POST /api/bookings/[id]/staff` - Assign staff to booking
   - `DELETE /api/bookings/[id]/staff` - Remove all staff

3. **Individual Staff Assignment**
   - `PUT /api/bookings/[id]/staff/[assignmentId]` - Update assignment status
   - `DELETE /api/bookings/[id]/staff/[assignmentId]` - Remove specific assignment

4. **Mobile API**
   - `GET /api/mobile/staff/assignments` - Mobile-optimized staff assignments

### Phase 3: Mobile App Integration

**How Mobile App Will Know About Staffing Requirements:**

#### 1. **Assignment Notifications**
```javascript
// Mobile app receives push notification when assigned
{
  type: 'booking_assignment',
  title: 'New Booking Assignment',
  data: {
    booking_id: 'uuid',
    role: 'staff',
    staffing_status: 'partially_staffed',
    total_required: 3,
    total_fulfilled: 1
  }
}
```

#### 2. **Assignment Status Endpoint**
```javascript
// GET /api/mobile/staff/assignments
{
  "success": true,
  "data": [
    {
      "id": "assignment-uuid",
      "bookingId": "booking-uuid",
      "customerName": "John Doe",
      "serviceName": "House Cleaning",
      "scheduledDate": "2024-01-15",
      "scheduledTime": "10:00",
      "role": "staff",
      "status": "assigned",
      "staffingStatus": "partially_staffed", // Key indicator
      "totalStaffRequired": 3,
      "totalStaffFulfilled": 1,
      "otherStaff": [
        {
          "employeeName": "Jane Smith",
          "role": "lead",
          "status": "accepted"
        }
      ]
    }
  ]
}
```

#### 3. **Real-time Updates**
- WebSocket or Server-Sent Events for real-time staffing status
- Mobile app shows badge/indicator when more staff needed

### Phase 4: Frontend Enhancements

**Admin Dashboard Improvements:**

1. **Booking List View**
   - Color-coded staffing indicators
   - Staff count display (1/3 staff assigned)
   - Quick staff assignment buttons

2. **Booking Detail/Edit Modal**
   - Staff requirement input field
   - Multi-staff assignment interface
   - Role assignment (lead, staff, supervisor)
   - Staff status tracking

3. **Visual Indicators**
   ```css
   .staffing-status {
     &.fully-staffed { color: green; }
     &.partially-staffed { color: orange; }
     &.unstaffed { color: red; }
   }
   ```

### Phase 5: Business Logic & Validation

**Staffing Rules:**
1. **Minimum Requirements:** Ensure at least 1 staff per booking
2. **Maximum Limits:** Prevent over-staffing (configurable)
3. **Role Requirements:** Enforce at least 1 lead for multi-staff bookings
4. **Availability Checking:** Validate staff availability before assignment
5. **Skills Matching:** Consider employee skills for service requirements

**Notification System:**
1. **Admin Notifications:**
   - New staff responses (accepted/declined)
   - Understaffed bookings alerts
   - Staff completion updates

2. **Employee Notifications:**
   - New assignments
   - Assignment removals
   - Booking changes

### Phase 6: Mobile App Features

**Employee Mobile App Integration:**

1. **Assignment Dashboard**
   - Shows personal assignments
   - Indicates team staffing status
   - Accept/decline functionality

2. **Team Coordination**
   - View other assigned staff
   - Communication tools
   - Role-based responsibilities

3. **Status Updates**
   - Accept assignment
   - Mark as completed
   - Add notes/issues

## Implementation Steps

### Step 1: Database Migration (CRITICAL)
```bash
# Run the database migration
psql -h your-supabase-host -d postgres -f database-migrations/002_staff_management.sql
```

### Step 2: API Testing
```bash
# Test the new booking deletion endpoint
curl -X DELETE http://localhost:3001/api/bookings/[booking-id] \
  -H "Authorization: Bearer your-token"

# Should return 200 instead of 404
```

### Step 3: Frontend Integration
Update the booking deletion function to use the correct endpoint:
```javascript
// Already fixed in previous implementation
const handleDeleteBooking = async (bookingId) => {
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  // Will now work correctly
};
```

## Benefits

### For Administrators
- **Better Resource Planning:** Know exact staffing requirements
- **Real-time Visibility:** See staffing status at a glance
- **Flexible Assignment:** Assign multiple staff with different roles
- **Automated Tracking:** System updates counts automatically

### For Employees
- **Clear Expectations:** Know if it's a team job
- **Role Clarity:** Understand their specific role (lead vs staff)
- **Team Awareness:** See who else is assigned
- **Status Tracking:** Accept/decline assignments

### For Business Operations
- **Improved Efficiency:** Better staff utilization
- **Quality Assurance:** Ensure adequate staffing
- **Customer Satisfaction:** Properly staffed jobs
- **Cost Management:** Avoid over/under-staffing

## Testing Strategy

### 1. Database Testing
- Verify migration runs successfully
- Test trigger functionality
- Validate RLS policies

### 2. API Testing
- Test all new endpoints
- Verify authentication/authorization
- Test error handling

### 3. Frontend Testing
- Test booking deletion (should work now!)
- Test staff assignment UI
- Verify real-time updates

### 4. Mobile Testing
- Test assignment notifications
- Verify status updates
- Test team coordination features

## Next Steps

1. **Immediate:** Run database migration to fix booking deletion
2. **Short-term:** Implement frontend staff management UI
3. **Medium-term:** Add mobile app integration
4. **Long-term:** Add advanced features (skills matching, availability checking)

## Risk Mitigation

1. **Data Migration:** Backup database before running migration
2. **API Compatibility:** Maintain backward compatibility
3. **Performance:** Monitor query performance with new tables
4. **User Training:** Document new features for admin users

---

**Summary:** This implementation provides a comprehensive solution for staff management that addresses the original defect while adding advanced capabilities for multi-staff coordination, real-time tracking, and mobile integration. The booking deletion issue is also resolved as part of this implementation.
