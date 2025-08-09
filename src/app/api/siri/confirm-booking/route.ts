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
    const booking = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId])
    if (booking.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Резервацията не е намерена' },
        { status: 404 }
      )
    }

    // Update booking status
    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', bookingId])
    db.release()

    return NextResponse.json({
      success: true,
      message: 'Резервацията е потвърдена успешно'
    })
  } catch (error) {
    console.error('Siri confirm booking error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при потвърждаване на резервацията' },
      { status: 500 }
    )
  }
} 