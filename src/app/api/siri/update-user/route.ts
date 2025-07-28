import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, patientName, phone, email } = body

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

    // Update user fields
    const updateFields = []
    const updateValues = []
    
    if (patientName && patientName !== user.name) {
      updateFields.push('name = ?')
      updateValues.push(patientName)
    }
    
    if (phone && phone !== user.phone) {
      updateFields.push('phone = ?')
      updateValues.push(phone)
    }
    
    if (email && email !== user.email) {
      updateFields.push('email = ?')
      updateValues.push(email)
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Няма промени за прилагане' },
        { status: 400 }
      )
    }

    updateValues.push(user.id)
    await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)

    return NextResponse.json({
      success: true,
      message: `Потребителят ${user.name} е обновен успешно`
    })
  } catch (error) {
    console.error('Siri update user error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при обновяване на потребителя' },
      { status: 500 }
    )
  }
} 