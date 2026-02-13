import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number; limit: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Note: Admin authentication is handled in route handlers, not in middleware,
  // because middleware runs on Edge runtime which doesn't support database connections.

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // CSP: frame-src allows Google iframes (e.g. maps, forms); останалото както по подразбиране
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' wss: ws:; manifest-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com https://docs.google.com;"
  )

  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Rate limiting: skip in development to avoid 429 during hot reload / Strict Mode
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()

    type RateLimit = { windowMs: number; maxRequests: number }
    let limit: RateLimit = { windowMs: 15 * 60 * 1000, maxRequests: 300 }

    if (request.nextUrl.pathname.startsWith('/api/admin/')) {
      limit = { windowMs: 15 * 60 * 1000, maxRequests: 500 }
    } else if (request.nextUrl.pathname.startsWith('/api/')) {
      limit = { windowMs: 15 * 60 * 1000, maxRequests: 200 }
    } else if (request.nextUrl.pathname.startsWith('/admin')) {
      limit = { windowMs: 15 * 60 * 1000, maxRequests: 400 }
    }

    const clientData = rateLimitStore.get(clientIP)

    if (!clientData || now > clientData.resetTime) {
      rateLimitStore.set(clientIP, {
        count: 1,
        resetTime: now + limit.windowMs,
        limit: limit.maxRequests
      })
    } else if (clientData.count >= limit.maxRequests) {
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
      clientData.count++
    }
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