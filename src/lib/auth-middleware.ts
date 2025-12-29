import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from './auth-helpers'

/**
 * Centralized authentication check for admin API routes
 * This should be called at the start of each admin API route handler
 * 
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAdminAuth(request)
 *   if (!auth.valid) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   // auth.admin contains admin info if needed
 *   // ... rest of handler
 * }
 * ```
 */
export async function requireAdminAuth(request: NextRequest) {
  return await verifyRequestToken(request)
}

/**
 * Centralized authentication check that returns 401 response if not authenticated
 * Use this for cleaner code - it handles the response automatically
 * 
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResponse = await checkAdminAuth(request)
 *   if (authResponse) return authResponse // Returns 401 if not authenticated
 *   // ... rest of handler (user is authenticated)
 * }
 * ```
 */
export async function checkAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const auth = await verifyRequestToken(request)
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  return null // User is authenticated
}

