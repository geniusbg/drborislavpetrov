import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, patientName } = body

    if (!userId && !patientName) {
      return NextResponse.json(
        { error: 'ID на потребителя или име е задължително' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find user by ID or name
    let user
    if (userId) {
      user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
    } else {
      user = await db.query('SELECT * FROM users WHERE name = $1', [patientName])
    }

    if (user.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      )
    }

    const existingUser = user.rows[0]

    // Check if user has active bookings
    const activeBookings = await db.query('SELECT COUNT(*) as count FROM bookings WHERE phone = $1 AND status != $2', [existingUser.phone, 'cancelled'])
    if (parseInt(activeBookings.rows[0].count) > 0) {
      db.release()
      return NextResponse.json(
        { error: 'Не може да изтриете потребител с активни резервации' },
        { status: 400 }
      )
    }

    // Delete user
    await db.query('DELETE FROM users WHERE id = $1', [existingUser.id])
    db.release()

    return NextResponse.json({
      success: true,
      message: `Потребителят ${existingUser.name} е изтрит успешно`
    })
  } catch (error) {
    console.error('Siri delete user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при изтриване на потребителя' },
      { status: 500 }
    )
  }
} 