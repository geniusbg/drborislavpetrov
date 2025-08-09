import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = await getDatabase()
    
    const bookings = await db.query(`
      SELECT b.*, s.name as serviceName, u.name as userName
      FROM bookings b
      LEFT JOIN services s ON b.service = s.name
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.status = 'pending'
      ORDER BY b.createdAt DESC
      LIMIT 10
    `)

    db.release()
    
    return NextResponse.json({
      success: true,
      bookings: bookings.rows.map((b: Record<string, unknown>) => ({
        id: b.id,
        patientName: b.name,
        service: b.serviceName,
        date: b.date,
        time: b.time,
        status: b.status
      }))
    })
  } catch (error) {
    console.error('Siri get bookings error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при извличане на резервациите' },
      { status: 500 }
    )
  }
} 