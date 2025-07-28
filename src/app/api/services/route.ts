import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const services = await db.all('SELECT * FROM services WHERE isActive = 1 ORDER BY name')
    
    return NextResponse.json({ services })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 