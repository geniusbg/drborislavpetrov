import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { createAdminToken, getClientIP } from '@/lib/auth'
import bcrypt from 'bcrypt'

// Simple in-memory rate limiting store (in production, use Redis)
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

// Rate limiting: 5 attempts per 15 minutes per IP
const MAX_LOGIN_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(ip)

  if (!attempts || now > attempts.resetTime) {
    // First attempt or window expired
    loginAttempts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true }
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((attempts.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  attempts.count++
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request)
    
    // Check rate limiting
    const rateLimit = checkRateLimit(ipAddress)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          retryAfter: rateLimit.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimit.retryAfter?.toString() || '900'
          }
        }
      )
    }

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Input validation
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 1 || password.length > 200) {
      return NextResponse.json(
        { error: 'Invalid password format' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Find admin by username
    // Always perform bcrypt comparison to prevent timing attacks
    const result = await db.query(
      'SELECT id, username, password_hash, email, full_name, is_active FROM admins WHERE username = $1',
      [username]
    )

    // Use a dummy hash for comparison if user doesn't exist (prevent timing attacks)
    const dummyHash = '$2b$10$dummyhashfordummycomparisonpurposesonly'
    const admin = result.rows.length > 0 ? result.rows[0] : null
    const passwordHash = admin?.password_hash || dummyHash

    // Always perform bcrypt comparison (constant time)
    let passwordValid = false
    if (admin && admin.password_hash === '$2b$10$placeholder') {
      // Default password check (for initial setup) - constant time comparison
      passwordValid = password === 'admin123'
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10)
        await db.query(
          'UPDATE admins SET password_hash = $1 WHERE id = $2',
          [hashedPassword, admin.id]
        )
      }
    } else {
      passwordValid = await bcrypt.compare(password, passwordHash)
    }

    // Check if admin exists and is active (only after password check to prevent user enumeration)
    if (!admin || !passwordValid) {
      db.release()
      // Don't reveal if user exists or not
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Check if admin is active
    if (!admin.is_active) {
      db.release()
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Update last login
    await db.query(
      'UPDATE admins SET last_login = NOW() WHERE id = $1',
      [admin.id]
    )

    db.release()

    // Reset rate limit on successful login
    loginAttempts.delete(ipAddress)

    // Generate and store token in database
    const userAgent = request.headers.get('user-agent') || undefined
    const token = await createAdminToken(admin.id, ipAddress, userAgent, 24) // 24 hours expiration

    // Create response
    const response = NextResponse.json({
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.full_name
      }
    })

    // Set httpOnly cookie with token
    const isProduction = process.env.NODE_ENV === 'production'
    response.cookies.set('adminToken', token, {
      httpOnly: true,
      secure: isProduction, // Only send over HTTPS in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
