interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5 // 5 requests per 15 minutes

export const checkRateLimit = (identifier: string): { allowed: boolean; remaining: number } => {
  const now = Date.now()
  const record = store[identifier]

  if (!record || now > record.resetTime) {
    // First request or window expired
    store[identifier] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    }
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count }
}

export const getClientIdentifier = (ip: string, userAgent: string): string => {
  return `${ip}-${userAgent}`
} 