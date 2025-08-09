import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Middleware без request tracking - просто препраща заявките
  const response = NextResponse.next()
  
  return response
}

// Minimal middleware config
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 