import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID на резервацията е задължително' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if booking exists
    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [bookingId])
    if (!booking) {
      return NextResponse.json(
        { error: 'Резервацията не е намерена' },
        { status: 404 }
      )
    }

    // Confirm booking
    await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['confirmed', bookingId])

    return NextResponse.json({
      success: true,
      message: `Резервацията за ${booking.name} на ${booking.date} в ${booking.time} е потвърдена успешно`
    })
  } catch (error) {
    console.error('Siri confirm booking error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при потвърждаване на резервацията' },
      { status: 500 }
    )
  }
} 