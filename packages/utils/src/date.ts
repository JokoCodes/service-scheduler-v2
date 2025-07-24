import { 
  format, 
  parseISO, 
  isValid, 
  addDays, 
  addHours, 
  addMinutes,
  startOfDay, 
  endOfDay,
  isBefore,
  isAfter,
  differenceInMinutes,
  differenceInHours,
  parseJSON
} from 'date-fns'

// Common date formats
export const DATE_FORMATS = {
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_TIME_12H: 'h:mm a'
} as const

// Format date to common display formats
export const formatDate = (date: Date | string, formatStr: string = DATE_FORMATS.DISPLAY_DATE): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (!isValid(dateObj)) {
    throw new Error('Invalid date provided')
  }
  
  return format(dateObj, formatStr)
}

// Parse date from various formats
export const parseDate = (dateStr: string): Date => {
  // Try parsing as ISO date first
  let date = parseISO(dateStr)
  
  // If that fails, try JSON parsing (handles more formats)
  if (!isValid(date)) {
    date = parseJSON(dateStr)
  }
  
  if (!isValid(date)) {
    throw new Error(`Unable to parse date: ${dateStr}`)
  }
  
  return date
}

// Get date range helpers
export const getDateRange = (startDate: Date | string, days: number) => {
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate
  const end = addDays(start, days)
  
  return {
    start: startOfDay(start),
    end: endOfDay(end)
  }
}

// Time slot utilities
export const createTimeSlots = (
  startTime: string, 
  endTime: string, 
  intervalMinutes: number = 30
): string[] => {
  const slots: string[] = []
  
  // Parse start and end times (assuming format "HH:MM")
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const startDate = new Date()
  startDate.setHours(startHour, startMinute, 0, 0)
  
  const endDate = new Date()
  endDate.setHours(endHour, endMinute, 0, 0)
  
  let currentTime = new Date(startDate)
  
  while (currentTime < endDate) {
    slots.push(format(currentTime, 'HH:mm'))
    currentTime = addMinutes(currentTime, intervalMinutes)
  }
  
  return slots
}

// Check if time slot is available
export const isTimeSlotAvailable = (
  date: Date | string,
  startTime: string,
  endTime: string,
  existingBookings: Array<{ scheduledDate: string | Date; scheduledTime: string; duration: number }>
): boolean => {
  const targetDate = typeof date === 'string' ? parseDate(date) : date
  const targetDateStr = format(targetDate, DATE_FORMATS.ISO_DATE)
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const slotStart = new Date(targetDate)
  slotStart.setHours(startHour, startMinute, 0, 0)
  
  const slotEnd = new Date(targetDate)
  slotEnd.setHours(endHour, endMinute, 0, 0)
  
  // Check against existing bookings
  for (const booking of existingBookings) {
    const bookingDate = typeof booking.scheduledDate === 'string' 
      ? parseDate(booking.scheduledDate) 
      : booking.scheduledDate
    
    const bookingDateStr = format(bookingDate, DATE_FORMATS.ISO_DATE)
    
    // Only check bookings on the same date
    if (bookingDateStr !== targetDateStr) continue
    
    const [bookingHour, bookingMinute] = booking.scheduledTime.split(':').map(Number)
    const bookingStart = new Date(bookingDate)
    bookingStart.setHours(bookingHour, bookingMinute, 0, 0)
    
    const bookingEnd = addMinutes(bookingStart, booking.duration)
    
    // Check for overlap
    const hasOverlap = isBefore(slotStart, bookingEnd) && isAfter(slotEnd, bookingStart)
    
    if (hasOverlap) {
      return false
    }
  }
  
  return true
}

// Calculate duration between time strings
export const calculateDuration = (startTime: string, endTime: string): number => {
  const today = new Date()
  
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  
  const start = new Date(today)
  start.setHours(startHour, startMinute, 0, 0)
  
  const end = new Date(today)
  end.setHours(endHour, endMinute, 0, 0)
  
  return differenceInMinutes(end, start)
}

// Get business hours for a specific day
export const getBusinessHours = (
  dayOfWeek: number,
  availability: Array<{ dayOfWeek: number; startTime: string; endTime: string; isAvailable: boolean }>
) => {
  return availability
    .filter(slot => slot.dayOfWeek === dayOfWeek && slot.isAvailable)
    .map(slot => ({
      startTime: slot.startTime,
      endTime: slot.endTime
    }))
}

// Check if a date/time is in the past
export const isPastDateTime = (date: Date | string, time?: string): boolean => {
  const targetDate = typeof date === 'string' ? parseDate(date) : date
  
  if (time) {
    const [hour, minute] = time.split(':').map(Number)
    targetDate.setHours(hour, minute, 0, 0)
  }
  
  return isBefore(targetDate, new Date())
}

// Get relative time description
export const getRelativeTime = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? parseDate(date) : date
  const now = new Date()
  
  const minutesDiff = differenceInMinutes(targetDate, now)
  const hoursDiff = differenceInHours(targetDate, now)
  
  if (minutesDiff < 0) {
    const absMinutes = Math.abs(minutesDiff)
    if (absMinutes < 60) return `${absMinutes} minutes ago`
    const absHours = Math.abs(hoursDiff)
    if (absHours < 24) return `${absHours} hours ago`
    return formatDate(targetDate, DATE_FORMATS.DISPLAY_DATE)
  } else {
    if (minutesDiff < 60) return `in ${minutesDiff} minutes`
    if (hoursDiff < 24) return `in ${hoursDiff} hours`
    return formatDate(targetDate, DATE_FORMATS.DISPLAY_DATE)
  }
}
