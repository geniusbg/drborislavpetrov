import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientName, phone, email } = body

    if (!patientName) {
      return NextResponse.json(
        { error: 'Липсва име на потребителя' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Use provided phone or default
    const userPhone = phone || '+359888000000'

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE name = ? OR phone = ?', [patientName, userPhone])
    
    if (existingUser) {
      return NextResponse.json(
        { error: `Потребителят ${patientName} вече съществува` },
        { status: 409 }
      )
    }

    // Create new user
    const result = await db.run(`
      INSERT INTO users (name, phone, email)
      VALUES (?, ?, ?)
    `, [patientName, userPhone, email || null])

    return NextResponse.json({
      success: true,
      message: `Потребителят ${patientName} е създаден успешно. Телефон: ${userPhone}`,
      userId: result.lastID
    })
  } catch (error) {
    console.error('Siri create user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаване на потребителя' },
      { status: 500 }
    )
  }
} 