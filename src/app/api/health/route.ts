import { NextResponse } from 'next/server'

/**
 * Health check endpoint
 * Used by monitoring tools and external services to check if the server is running
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'drborislavpetrov'
    },
    { status: 200 }
  )
}

