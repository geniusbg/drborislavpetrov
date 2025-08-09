import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientName, phone, email } = body

    if (!patientName) {
      return NextResponse.json(
        { error: 'Името на пациента е задължително' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE name = $1 OR phone = $2', [patientName, phone])
    if (existingUser.rows.length > 0) {
      db.release()
      return NextResponse.json(
        { error: 'Потребител с това име или телефон вече съществува' },
        { status: 409 }
      )
    }

    // Create new user
    const result = await db.query(`
      INSERT INTO users (name, phone, email)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [patientName, phone || null, email || null])

    db.release()

    return NextResponse.json({
      success: true,
      message: `Потребителят ${patientName} е създаден успешно`,
      userId: result.rows[0].id
    })
  } catch (error) {
    console.error('Siri create user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаване на потребителя' },
      { status: 500 }
    )
  }
} 