import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const services = await db.all('SELECT * FROM services ORDER BY id')
    
    return NextResponse.json({ 
      count: services.length,
      services 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 