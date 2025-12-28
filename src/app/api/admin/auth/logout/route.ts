import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, revokeAdminToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('adminToken')?.value

    if (token) {
      // Verify and revoke token
      const verification = await verifyAdminToken(token)
      if (verification.valid) {
        await revokeAdminToken(token)
      }
    }

    // Create response
    const response = NextResponse.json({ message: 'Logged out successfully' })

    // Clear cookie
    response.cookies.set('adminToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

