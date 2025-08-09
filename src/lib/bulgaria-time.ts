/**
 * Utility functions for working with Bulgarian time
 */

/**
 * Get current time in Bulgaria
 */
export function getBulgariaTime(): Date {
  const now = new Date()
  
  // Get Bulgaria time using Intl.DateTimeFormat
  const bulgariaTimeString = now.toLocaleString('en-CA', {
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse the Bulgaria time string
  const [datePart, timePart] = bulgariaTimeString.split(', ')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)
  
  // Create a new Date object with Bulgaria time values
  // Note: This creates a Date in the local timezone but with Bulgaria time values
  return new Date(year, month - 1, day, hour, minute, second)
}

/**
 * Convert any date to Bulgaria time
 */
export function toBulgariaTime(date: Date): Date {
  // Create a proper Date object in Bulgaria timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Sofia',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(date)
  const dayValue = parts.find(p => p.type === 'day')?.value
  const monthValue = parts.find(p => p.type === 'month')?.value
  const yearValue = parts.find(p => p.type === 'year')?.value
  const hourValue = parts.find(p => p.type === 'hour')?.value
  const minuteValue = parts.find(p => p.type === 'minute')?.value
  const secondValue = parts.find(p => p.type === 'second')?.value
  
  // Create date in local timezone but with Bulgaria time values
  return new Date(
    parseInt(yearValue!),
    parseInt(monthValue!) - 1, // Month is 0-indexed
    parseInt(dayValue!),
    parseInt(hourValue!),
    parseInt(minuteValue!),
    parseInt(secondValue!)
  )
}

/**
 * Format date in Bulgarian locale with Bulgaria timezone
 */
export function formatBulgariaDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString('bg-BG', {
    timeZone: 'Europe/Sofia',
    ...options
  })
}

/**
 * Format time in Bulgarian locale with Bulgaria timezone
 */
export function formatBulgariaTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString('bg-BG', {
    timeZone: 'Europe/Sofia',
    hour12: false,
    ...options
  })
}

/**
 * Get current date string in Bulgaria (DD-MM-YYYY)
 */
export function getBulgariaDateString(): string {
  const bulgariaTime = getBulgariaTime()
  const day = bulgariaTime.getDate().toString().padStart(2, '0')
  const month = (bulgariaTime.getMonth() + 1).toString().padStart(2, '0')
  const year = bulgariaTime.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Get current date string in Bulgaria (YYYY-MM-DD) for database format
 */
export function getBulgariaDateStringDB(): string {
  const bulgariaTime = getBulgariaTime()
  const day = bulgariaTime.getDate().toString().padStart(2, '0')
  const month = (bulgariaTime.getMonth() + 1).toString().padStart(2, '0')
  const year = bulgariaTime.getFullYear()
  return `${year}-${month}-${day}`
}

/**
 * Convert any Date to YYYY-MM-DD string in local timezone (NOT UTC)
 * Use this instead of date.toISOString().split('T')[0] to avoid timezone bugs
 */
export function dateToLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Create a timezone-independent date object for calendar purposes
 * This ensures calendar dates work the same regardless of user's timezone
 */
export function createCalendarDate(year: number, month: number, day: number): Date {
  // Use UTC to avoid timezone issues, but we'll treat it as a "calendar date"
  // Month is 0-indexed in Date constructor
  return new Date(Date.UTC(year, month, day))
}

/**
 * Convert calendar date to local date string, accounting for timezone-independent calendar dates
 */
export function calendarDateToString(date: Date): string {
  // For UTC dates created by createCalendarDate, we need to use UTC methods
  const year = date.getUTCFullYear()
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = date.getUTCDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get current time string in Bulgaria (HH:MM:SS)
 */
export function getBulgariaTimeString(): string {
  const bulgariaTime = getBulgariaTime()
  const hours = bulgariaTime.getHours().toString().padStart(2, '0')
  const minutes = bulgariaTime.getMinutes().toString().padStart(2, '0')
  const seconds = bulgariaTime.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Get weekday name in Bulgarian
 */
export function getBulgariaWeekday(date: Date = new Date()): string {
  const bulgariaTime = toBulgariaTime(date)
  const weekdays = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота']
  return weekdays[bulgariaTime.getDay()]
} 