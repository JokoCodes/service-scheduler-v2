// Debug script to test staff assignment data flow
// Run with: node debug-staff-assignment.js

const testData = {
  bookingId: "2db477cf-71a1-4d09-ac63-1c3f6bf38ba9",
  profileId: "f945cb10-0e27-4c6d-b945-e0952736579c",
  resolvedEmployeeId: "e803ed4b-392e-4631-88c7-52ed4cd1474e"
};

console.log('=== STAFF ASSIGNMENT DEBUG ===');
console.log('1. Input Data:');
console.log('   - Booking ID:', testData.bookingId);
console.log('   - Profile ID (from mobile app):', testData.profileId);
console.log('   - Resolved Employee ID (from getOrCreateEmployee):', testData.resolvedEmployeeId);

console.log('\n2. Expected Flow:');
console.log('   - profileId (f945cb10...) should exist in profiles table');
console.log('   - employeeId (e803ed4b...) should exist in employees table');
console.log('   - employees.profile_id should equal profileId');
console.log('   - booking_staff_assignments.employee_id should reference employees.id');

console.log('\n3. Actual Error:');
console.log('   - Foreign key constraint booking_staff_assignments_employee_id_fkey');
console.log('   - is looking for employee_id in "profiles" table');
console.log('   - but employee_id should reference "employees" table');

console.log('\n4. Database Schema Problem:');
console.log('   - booking_staff_assignments.employee_id -> profiles.id (WRONG)');
console.log('   - booking_staff_assignments.employee_id -> employees.id (CORRECT)');

console.log('\n5. Solutions:');
console.log('   A) Fix foreign key constraint to reference employees table');
console.log('   B) OR use profile_id instead of employee_id in assignment data');

console.log('\n6. Assignment Data Being Inserted:');
console.log(JSON.stringify({
  booking_id: testData.bookingId,
  employee_id: testData.resolvedEmployeeId, // This ID exists in employees table
  role: "employee",
  status: "assigned"
}, null, 2));

console.log('\n7. Foreign Key Check:');
console.log('   - employee_id =', testData.resolvedEmployeeId);
console.log('   - Constraint expects this ID to exist in profiles.id');
console.log('   - But this ID actually exists in employees.id');
console.log('   - The employees.profile_id =', testData.profileId);
