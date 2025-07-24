// Common utility types and constants

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>

// Common value objects
export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface PhoneNumber {
  countryCode: string
  number: string
  formatted: string
}

export interface Money {
  amount: number
  currency: string
  formatted: string
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
}

export interface DateRange {
  startDate: string
  endDate: string
}

// File and media types
export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadedBy: string
}

export interface ImageMetadata extends FileMetadata {
  width: number
  height: number
  thumbnailUrl?: string
}

// Common constants
export const BOOKING_STATUSES = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const
export const USER_ROLES = ['admin', 'employee', 'customer'] as const
export const NOTIFICATION_PRIORITIES = ['low', 'medium', 'high'] as const

// Time and date constants
export const TIME_ZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney'
] as const

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  TIME_24H: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
} as const

// Error codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  
  // Permission errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const

// HTTP status codes for reference
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const

// Type guards
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  return VALIDATION_PATTERNS.PHONE.test(phone)
}

export const isValidTime = (time: string): boolean => {
  return VALIDATION_PATTERNS.TIME_24H.test(time)
}

export const isValidDate = (date: string): boolean => {
  return VALIDATION_PATTERNS.DATE_ISO.test(date)
}

export const isValidUUID = (uuid: string): boolean => {
  return VALIDATION_PATTERNS.UUID.test(uuid)
}
