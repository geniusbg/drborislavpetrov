import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyRequestToken(request)
    
    if (auth.valid && auth.tokenInfo) {
      return NextResponse.json({
        authenticated: true,
        admin: auth.tokenInfo
      })
    }
    
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  } catch (error) {
    console.error('Error checking auth:', error)
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}

