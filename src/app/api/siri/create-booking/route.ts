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
    let user = await db.query('SELECT * FROM users WHERE name = $1', [patientName])
    if (user.rows.length === 0) {
      const userResult = await db.query(`
        INSERT INTO users (name, phone, email)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [patientName, userPhone, email || null])
      
      // Update user variable with the new user data
      user = await db.query('SELECT * FROM users WHERE id = $1', [userResult.rows[0].id])
      console.log('Created new user via Siri:', user.rows[0])
    } else {
      // Update phone and email if provided and different
      const existingUser = user.rows[0]
      const updateFields = []
      const updateValues = []
      
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
        
        // Update user object
        if (phone) existingUser.phone = phone
        if (email) existingUser.email = email
        
        console.log('Updated user via Siri:', existingUser)
      }
    }

    // Check if slot is available
    const existingBooking = await db.query(`
      SELECT * FROM bookings 
      WHERE date = $1 AND time = $2 AND status != 'cancelled'
    `, [date, time])

    if (existingBooking.rows.length > 0) {
      db.release()
      return NextResponse.json(
        { error: `Този час (${time}) на ${date} вече е зает` },
        { status: 409 }
      )
    }

    // Create booking
    const result = await db.query(`
      INSERT INTO bookings (name, phone, service, date, time, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id
    `, [patientName, user.rows[0].phone, service, date, time])

    db.release()
    return NextResponse.json({
      success: true,
      message: `Резервацията за ${patientName} на ${date} в ${time} е създадена успешно`,
      bookingId: result.rows[0].id
    })
  } catch (error) {
    console.error('Siri create booking error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаване на резервацията' },
      { status: 500 }
    )
  }
} 