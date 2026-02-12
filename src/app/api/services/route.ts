import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = await getDatabase()
    // Column in DB is lowercase isactive (PostgreSQL folds unquoted identifiers)
    const result = await db.query(`
      SELECT id, name, description, duration
      FROM services
      WHERE isactive = true
      ORDER BY name
    `)

    db.release()
    return NextResponse.json({ services: result.rows ?? [] })
  } catch (error) {
    console.error('GET /api/services error:', error)
    return NextResponse.json(
      { error: 'Internal server error', services: [] },
      { status: 500 }
    )
  }
} 