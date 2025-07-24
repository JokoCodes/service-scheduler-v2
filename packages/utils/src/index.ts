// Main exports for the utils package

// Date utilities
export * from './date'

// Validation utilities
export * from './validation'

// Formatting utilities
export * from './format'

// Common helper functions
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastCallTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastCallTime >= wait) {
      lastCallTime = now
      func(...args)
    }
  }
}

export const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
  const result = {} as Pick<T, K>
  
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  
  return result
}

export const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>
  
  for (const key of keys) {
    delete (result as any)[key]
  }
  
  return result
}
