import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = await getDatabase()
    const result = await db.query('SELECT * FROM services WHERE isActive = true ORDER BY name')
    
    db.release()
    return NextResponse.json({ services: result.rows })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 