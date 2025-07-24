// Utility functions for handling name fields during migration

export interface NameComponents {
  firstName: string
  lastName: string
  fullName: string
}

/**
 * Split a full name into first and last name components
 * Handles edge cases like single names, prefixes, etc.
 */
export function splitFullName(fullName: string): NameComponents {
  if (!fullName || typeof fullName !== 'string') {
    return {
      firstName: '',
      lastName: '',
      fullName: ''
    }
  }

  const trimmedName = fullName.trim()
  if (!trimmedName) {
    return {
      firstName: '',
      lastName: '',
      fullName: ''
    }
  }

  const nameParts = trimmedName.split(/\s+/)
  
  if (nameParts.length === 1) {
    // Single name - use as first name
    return {
      firstName: nameParts[0],
      lastName: '',
      fullName: trimmedName
    }
  } else if (nameParts.length === 2) {
    // Standard "First Last" format
    return {
      firstName: nameParts[0],
      lastName: nameParts[1],
      fullName: trimmedName
    }
  } else {
    // Multiple parts - first part as firstName, rest as lastName
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')
    return {
      firstName,
      lastName,
      fullName: trimmedName
    }
  }
}

/**
 * Combine first and last name into full name
 */
export function combineNames(firstName: string, lastName: string): string {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''
  
  if (!first && !last) {
    return ''
  }
  
  if (!first) {
    return last
  }
  
  if (!last) {
    return first
  }
  
  return `${first} ${last}`
}

/**
 * Get display name with fallback logic
 * Prioritizes full name, then combines first/last, then falls back to email prefix
 */
export function getDisplayName(options: {
  firstName?: string
  lastName?: string
  fullName?: string
  name?: string // Legacy field
  email?: string
}): string {
  const { firstName, lastName, fullName, name, email } = options
  
  // Try full name first (new or legacy)
  if (fullName?.trim()) {
    return fullName.trim()
  }
  
  if (name?.trim()) {
    return name.trim()
  }
  
  // Try combining first/last names
  const combined = combineNames(firstName || '', lastName || '')
  if (combined) {
    return combined
  }
  
  // Fallback to email prefix
  if (email?.trim()) {
    const emailPrefix = email.split('@')[0]
    return emailPrefix.replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  
  return 'Unknown'
}

/**
 * Convert legacy booking object to new format
 */
export function convertLegacyBooking(booking: any): any {
  const customerNames = splitFullName(booking.customerName || booking.customer_name || '')
  const employeeNames = splitFullName(booking.assignedEmployeeName || booking.assigned_employee_name || '')
  
  return {
    ...booking,
    // New fields
    customerFirstName: customerNames.firstName,
    customerLastName: customerNames.lastName,
    assignedEmployeeFirstName: employeeNames.firstName,
    assignedEmployeeLastName: employeeNames.lastName,
    // Keep legacy fields for compatibility
    customerName: booking.customerName || booking.customer_name,
    assignedEmployeeName: booking.assignedEmployeeName || booking.assigned_employee_name
  }
}

/**
 * Convert legacy employee object to new format
 */
export function convertLegacyEmployee(employee: any): any {
  const names = splitFullName(employee.name || '')
  
  return {
    ...employee,
    // New fields
    firstName: names.firstName,
    lastName: names.lastName,
    // Keep legacy field for compatibility
    name: employee.name
  }
}

/**
 * Convert legacy customer object to new format
 */
export function convertLegacyCustomer(customer: any): any {
  const names = splitFullName(customer.name || '')
  
  return {
    ...customer,
    // New fields
    firstName: names.firstName,
    lastName: names.lastName,
    // Keep legacy field for compatibility
    name: customer.name
  }
}
