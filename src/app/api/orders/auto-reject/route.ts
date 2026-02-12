import { NextResponse } from 'next/server'

/**
 * Auto-reject orders endpoint
 * This endpoint is being called by an external source (likely a browser extension or cached request)
 */
export async function POST() {
  // Return 404 silently - this endpoint is not implemented
  return NextResponse.json(
    { 
      error: 'Not Found',
      message: 'This endpoint is not implemented.'
    },
    { status: 404 }
  )
}

