import { NextRequest } from 'next/server'
import { verifyAdminToken } from './auth'

/**
 * Get admin token from request (checks both cookie and header for backward compatibility)
 */
export async function getAdminTokenFromRequest(request: NextRequest): Promise<string | null> {
  // First try to get from httpOnly cookie (preferred)
  const cookieToken = request.cookies.get('adminToken')?.value
  if (cookieToken) {
    return cookieToken
  }

  // Fallback to header for backward compatibility
  const headerToken = request.headers.get('x-admin-token')
  if (headerToken) {
    return headerToken
  }

  return null
}

/**
 * Verify admin token from request and return admin info
 */
export async function verifyRequestToken(request: NextRequest) {
  const token = await getAdminTokenFromRequest(request)
  
  if (!token) {
    return { valid: false }
  }

  return await verifyAdminToken(token)
}

