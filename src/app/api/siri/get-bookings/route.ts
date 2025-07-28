import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET() {
  try {
    const db = await getDatabase()

    const bookings = await db.all(`
      SELECT b.*, s.name as serviceName, u.name as userName
      FROM bookings b
      LEFT JOIN services s ON b.service = s.id
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.status = 'pending'
      ORDER BY b.createdAt DESC
      LIMIT 10
    `)

    const formattedBookings = bookings.map((b: any) => ({
      id: b.id,
      patientName: b.name,
      service: b.serviceName,
      date: b.date,
      time: b.time,
      status: b.status
    }))

    return NextResponse.json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings,
      message: `Намерени са ${formattedBookings.length} чакащи резервации`
    })
  } catch (error) {
    console.error('Siri get bookings error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при получаване на резервациите' },
      { status: 500 }
    )
  }
} 