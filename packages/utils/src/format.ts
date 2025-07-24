// Formatting utilities for display and API responses

// Currency formatting
export const formatCurrency = (
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Phone number formatting
export const formatPhoneNumber = (phone: string, format: 'national' | 'international' = 'national'): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    // US format: (123) 456-7890
    if (format === 'national') {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // US format with country code
    const number = cleaned.slice(1)
    if (format === 'national') {
      return `(${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    } else {
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
  } else {
    // International format or unknown - return as is with + if needed
    return format === 'international' && !cleaned.startsWith('+') 
      ? `+${cleaned}` 
      : cleaned
  }
}

// Name formatting
export const formatName = (firstName: string, lastName?: string, format: 'full' | 'firstLast' | 'lastFirst' | 'initials' = 'full'): string => {
  const first = firstName.trim()
  const last = lastName?.trim() || ''
  
  switch (format) {
    case 'firstLast':
      return last ? `${first} ${last}` : first
    case 'lastFirst':
      return last ? `${last}, ${first}` : first
    case 'initials':
      return last ? `${first[0]}${last[0]}` : first[0] || ''
    case 'full':
    default:
      return last ? `${first} ${last}` : first
  }
}

// Duration formatting (minutes to human readable)
export const formatDuration = (minutes: number, format: 'short' | 'long' = 'short'): string => {
  if (minutes < 60) {
    return format === 'short' ? `${minutes}m` : `${minutes} minutes`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  if (remainingMinutes === 0) {
    return format === 'short' ? `${hours}h` : `${hours} hours`
  }
  
  if (format === 'short') {
    return `${hours}h ${remainingMinutes}m`
  } else {
    const hourText = hours === 1 ? 'hour' : 'hours'
    const minuteText = remainingMinutes === 1 ? 'minute' : 'minutes'
    return `${hours} ${hourText} ${remainingMinutes} ${minuteText}`
  }
}

// Address formatting
export const formatAddress = (address: {
  street?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
}, format: 'single-line' | 'multi-line' = 'single-line'): string => {
  const parts = [
    address.street,
    address.city,
    [address.state, address.zipCode].filter(Boolean).join(' '),
    address.country
  ].filter(Boolean)
  
  if (format === 'multi-line') {
    return parts.join('\n')
  } else {
    return parts.join(', ')
  }
}

// Status formatting with colors/badges
export const formatStatus = (status: string): { text: string; color: string; variant: string } => {
  const statusMap: Record<string, { text: string; color: string; variant: string }> = {
    pending: { text: 'Pending', color: 'orange', variant: 'outline' },
    confirmed: { text: 'Confirmed', color: 'blue', variant: 'solid' },
    'in-progress': { text: 'In Progress', color: 'yellow', variant: 'solid' },
    completed: { text: 'Completed', color: 'green', variant: 'solid' },
    cancelled: { text: 'Cancelled', color: 'red', variant: 'outline' }
  }
  
  return statusMap[status] || { text: status, color: 'gray', variant: 'outline' }
}

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Percentage formatting
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`
}

// Number formatting with thousand separators
export const formatNumber = (
  value: number, 
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(value)
}

// Capitalize first letter of each word
export const formatTitle = (text: string): string => {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Format search/filter terms
export const formatSearchTerm = (term: string): string => {
  return term.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (text.length <= maxLength) return text
  
  return text.slice(0, maxLength - suffix.length) + suffix
}

// Format skill level
export const formatSkillLevel = (level: string): { text: string; color: string } => {
  const levelMap: Record<string, { text: string; color: string }> = {
    beginner: { text: 'Beginner', color: 'green' },
    intermediate: { text: 'Intermediate', color: 'yellow' },
    advanced: { text: 'Advanced', color: 'blue' },
    expert: { text: 'Expert', color: 'purple' }
  }
  
  return levelMap[level.toLowerCase()] || { text: level, color: 'gray' }
}

// Format priority level
export const formatPriority = (priority: string): { text: string; color: string; icon: string } => {
  const priorityMap: Record<string, { text: string; color: string; icon: string }> = {
    low: { text: 'Low', color: 'green', icon: '⬇️' },
    medium: { text: 'Medium', color: 'yellow', icon: '➡️' },
    high: { text: 'High', color: 'red', icon: '⬆️' }
  }
  
  return priorityMap[priority.toLowerCase()] || { text: priority, color: 'gray', icon: '❓' }
}

// Format coordinates for display
export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`
}

// Format distance
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)} km`
  } else {
    return `${Math.round(meters / 1000)} km`
  }
}

// Format array to readable list
export const formatList = (
  items: string[], 
  conjunction: string = 'and',
  max?: number
): string => {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  
  const displayItems = max ? items.slice(0, max) : items
  const remaining = max ? Math.max(0, items.length - max) : 0
  
  if (displayItems.length === 2) {
    const result = displayItems.join(` ${conjunction} `)
    return remaining > 0 ? `${result} ${conjunction} ${remaining} more` : result
  }
  
  const lastItem = displayItems.pop()
  const result = `${displayItems.join(', ')} ${conjunction} ${lastItem}`
  
  return remaining > 0 ? `${result} ${conjunction} ${remaining} more` : result
}
