import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, patientName } = body

    if (!userId && !patientName) {
      return NextResponse.json(
        { error: 'Липсва ID или име на потребителя' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find user by ID or name
    let user
    if (userId) {
      user = await db.get('SELECT * FROM users WHERE id = ?', [userId])
    } else {
      user = await db.get('SELECT * FROM users WHERE name = ?', [patientName])
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      )
    }

    // Check if user has active bookings
    const activeBookings = await db.get('SELECT COUNT(*) as count FROM bookings WHERE phone = ? AND status != "cancelled"', [user.phone])
    
    if (activeBookings.count > 0) {
      return NextResponse.json(
        { error: `Потребителят ${user.name} има активни резервации и не може да бъде изтрит` },
        { status: 409 }
      )
    }

    await db.run('DELETE FROM users WHERE id = ?', [user.id])

    return NextResponse.json({
      success: true,
      message: `Потребителят ${user.name} е изтрит успешно`
    })
  } catch (error) {
    console.error('Siri delete user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при изтриване на потребителя' },
      { status: 500 }
    )
  }
} 