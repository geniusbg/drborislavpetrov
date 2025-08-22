import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number; limit: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Rate Limiting with different tiers
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  
  // Different limits for different routes
  let limit = { windowMs: 15 * 60 * 1000, maxRequests: 300 } // Default: Public
  
  if (request.nextUrl.pathname.startsWith('/api/admin/')) {
    // Admin routes - more generous
    limit = { windowMs: 15 * 60 * 1000, maxRequests: 500 }
  } else if (request.nextUrl.pathname.startsWith('/api/')) {
    // API routes - moderate
    limit = { windowMs: 15 * 60 * 1000, maxRequests: 200 }
  } else if (request.nextUrl.pathname.startsWith('/admin')) {
    // Admin panel pages - generous
    limit = { windowMs: 15 * 60 * 1000, maxRequests: 400 }
  }

  const clientData = rateLimitStore.get(clientIP)
  
  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    rateLimitStore.set(clientIP, { 
      count: 1, 
      resetTime: now + limit.windowMs,
      limit: limit.maxRequests
    })
  } else if (clientData.count >= limit.maxRequests) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000)
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too many requests',
        retryAfter: retryAfter,
        limit: limit.maxRequests,
        windowMs: Math.ceil(limit.windowMs / 1000)
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
        }
      }
    )
  } else {
    // Increment request count
    clientData.count++
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 