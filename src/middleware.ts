import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Get real client IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIP = forwarded?.split(',')[0] || realIp || 'unknown'
  
  // Add client IP to headers for Socket.io
  const response = NextResponse.next()
  response.headers.set('x-client-ip', clientIP)
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}