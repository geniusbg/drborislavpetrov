import { randomBytes } from 'crypto'

// Generate CSRF token
export const generateCSRFToken = (): string => {
  return randomBytes(32).toString('hex')
}

// Validate CSRF token
export const validateCSRFToken = (token: string, storedToken: string): boolean => {
  return token === storedToken
}

// Get CSRF token from cookies
export const getCSRFTokenFromCookies = (cookies: string): string | null => {
  const csrfCookie = cookies
    .split(';')
    .find(cookie => cookie.trim().startsWith('csrf='))
  
  return csrfCookie ? csrfCookie.split('=')[1] : null
} 