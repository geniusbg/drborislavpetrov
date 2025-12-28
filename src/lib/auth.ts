import { getDatabase } from './database'
import crypto from 'crypto'

export interface TokenInfo {
  adminId: number
  username: string
  email?: string
  fullName?: string
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a new admin token in the database
 */
export async function createAdminToken(
  adminId: number,
  ipAddress?: string,
  userAgent?: string,
  expirationHours: number = 24
): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expirationHours)

  const db = await getDatabase()
  try {
    await db.query(
      `INSERT INTO admin_tokens (token, admin_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, adminId, expiresAt, ipAddress || null, userAgent || null]
    )
    return token
  } finally {
    db.release()
  }
}

/**
 * Verify and validate an admin token
 */
export async function verifyAdminToken(token: string): Promise<{ valid: boolean; adminId?: number; tokenInfo?: TokenInfo }> {
  if (!token || token.length === 0) {
    return { valid: false }
  }

  // Allow mock-token and test only in development
  if (process.env.NODE_ENV === 'development') {
    if (token === 'mock-token' || token === 'test') {
      return { valid: true, adminId: 1 }
    }
  }

  const db = await getDatabase()
  try {
    // Find token and check expiration
    const result = await db.query(
      `SELECT at.token, at.admin_id, at.expires_at, a.username, a.email, a.full_name, a.is_active
       FROM admin_tokens at
       JOIN admins a ON at.admin_id = a.id
       WHERE at.token = $1 AND at.expires_at > NOW()`,
      [token]
    )

    if (result.rows.length === 0) {
      return { valid: false }
    }

    const row = result.rows[0]

    // Check if admin is still active
    if (!row.is_active) {
      return { valid: false }
    }

    // Update last_used timestamp
    await db.query(
      'UPDATE admin_tokens SET last_used = NOW() WHERE token = $1',
      [token]
    )

    return {
      valid: true,
      adminId: row.admin_id,
      tokenInfo: {
        adminId: row.admin_id,
        username: row.username,
        email: row.email,
        fullName: row.full_name
      }
    }
  } catch (error) {
    console.error('Error verifying token:', error)
    return { valid: false }
  } finally {
    db.release()
  }
}

/**
 * Revoke (delete) an admin token
 */
export async function revokeAdminToken(token: string): Promise<void> {
  const db = await getDatabase()
  try {
    await db.query('DELETE FROM admin_tokens WHERE token = $1', [token])
  } finally {
    db.release()
  }
}

/**
 * Revoke all tokens for an admin
 */
export async function revokeAllAdminTokens(adminId: number): Promise<void> {
  const db = await getDatabase()
  try {
    await db.query('DELETE FROM admin_tokens WHERE admin_id = $1', [adminId])
  } finally {
    db.release()
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const db = await getDatabase()
  try {
    const result = await db.query(
      'DELETE FROM admin_tokens WHERE expires_at < NOW() RETURNING id'
    )
    return result.rows.length
  } finally {
    db.release()
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

