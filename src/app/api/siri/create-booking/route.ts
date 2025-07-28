import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { patientName, date, time, service = 1, phone, email } = body

    if (!patientName || !date || !time) {
      return NextResponse.json(
        { error: 'Липсва информация за резервацията' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Use provided phone or default
    const userPhone = phone || '+359888000000'

    // Check if user exists
    let user = await db.get('SELECT * FROM users WHERE name = ?', [patientName])
    if (!user) {
      const userResult = await db.run(`
        INSERT INTO users (name, phone, email)
        VALUES (?, ?, ?)
      `, [patientName, userPhone, email || null])
      
      user = {
        id: userResult.lastID,
        name: patientName,
        phone: userPhone,
        email: email || null
      }
      console.log('Created new user via Siri:', user)
    } else {
      // Update phone and email if provided and different
      let updateFields = []
      let updateValues = []
      
      if (phone && phone !== user.phone) {
        updateFields.push('phone = ?')
        updateValues.push(phone)
      }
      
      if (email && email !== user.email) {
        updateFields.push('email = ?')
        updateValues.push(email)
      }
      
      if (updateFields.length > 0) {
        updateValues.push(user.id)
        await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)
        
        // Update user object
        if (phone) user.phone = phone
        if (email) user.email = email
        
        console.log('Updated user via Siri:', user)
      }
    }

    // Check if slot is available
    const existingBooking = await db.get(`
      SELECT * FROM bookings 
      WHERE date = ? AND time = ? AND status != 'cancelled'
    `, [date, time])

    if (existingBooking) {
      return NextResponse.json(
        { error: `Този час (${time}) на ${date} вече е зает` },
        { status: 409 }
      )
    }

    // Create booking
    const result = await db.run(`
      INSERT INTO bookings (name, phone, service, date, time, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `, [patientName, user.phone, service, date, time])

    return NextResponse.json({
      success: true,
      message: `Резервацията за ${patientName} на ${date} в ${time} е създадена успешно`,
      bookingId: result.lastID
    })
  } catch (error) {
    console.error('Siri create booking error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаване на резервацията' },
      { status: 500 }
    )
  }
} 