import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, patientName, phone, email } = body

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

    // Build update query
    const updateFields = []
    const updateValues = []
    
    if (patientName && patientName !== existingUser.name) {
      updateFields.push('name = $' + (updateValues.length + 1))
      updateValues.push(patientName)
    }
    
    if (phone && phone !== existingUser.phone) {
      updateFields.push('phone = $' + (updateValues.length + 1))
      updateValues.push(phone)
    }
    
    if (email && email !== existingUser.email) {
      updateFields.push('email = $' + (updateValues.length + 1))
      updateValues.push(email)
    }
    
    if (updateFields.length > 0) {
      updateValues.push(existingUser.id)
      await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateValues.length}`, updateValues)
    }

    db.release()

    return NextResponse.json({
      success: true,
      message: 'Потребителят е обновен успешно'
    })
  } catch (error) {
    console.error('Siri update user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при обновяване на потребителя' },
      { status: 500 }
    )
  }
} 