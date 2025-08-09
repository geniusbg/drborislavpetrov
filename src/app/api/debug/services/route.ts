import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = await getDatabase()
    const services = await db.query('SELECT * FROM services ORDER BY id')
    
    db.release()
    
    return NextResponse.json({ 
      count: services.rows.length,
      services: services.rows
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 