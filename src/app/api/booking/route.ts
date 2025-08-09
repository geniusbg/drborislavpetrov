import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, service, date, time, message } = body

    // Validate required fields - phone is mandatory for public bookings
    if (!name || !phone || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Всички задължителни полета трябва да бъдат попълнени' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if user exists by phone number
    let user = await db.query('SELECT * FROM users WHERE phone = $1', [phone])
    
    if (user.rows.length === 0) {
      // Create new user
      const userResult = await db.query(`
        INSERT INTO users (name, email, phone)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [name, email || null, phone])
      
      // Update user variable with the new user data
      user = await db.query('SELECT * FROM users WHERE id = $1', [userResult.rows[0].id])
    } else {
      // Update existing user's information if needed
      const existingUser = user.rows[0]
      if (existingUser.name !== name || existingUser.email !== email) {
        await db.query(`
          UPDATE users 
          SET name = $1, email = $2, updatedAt = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [name, email || null, existingUser.id])
      }
    }

    // Check if the time slot is available
    const existingBooking = await db.query(`
      SELECT * FROM bookings 
      WHERE date = $1 AND time = $2 AND status != 'cancelled'
    `, [date, time])

    if (existingBooking.rows.length > 0) {
      db.release()
      return NextResponse.json(
        { error: 'Този час вече е зает. Моля, изберете друг час.' },
        { status: 409 }
      )
    }

    // Check if time conflicts with break
    const breaksResult = await db.query(`
      SELECT wb.start_time, wb.end_time
      FROM working_hours wh
      JOIN working_breaks wb ON wh.id = wb.working_hours_id
      WHERE wh.date = $1
    `, [date])
    
    // Check if this time conflicts with any break
    for (const breakItem of breaksResult.rows) {
      const [breakStartHour, breakStartMinute] = breakItem.start_time.split(':').map(Number)
      const [breakEndHour, breakEndMinute] = breakItem.end_time.split(':').map(Number)
      const breakStartMinutes = breakStartHour * 60 + breakStartMinute
      const breakEndMinutes = breakEndHour * 60 + breakEndMinute
      
      const [timeHour, timeMinute] = time.split(':').map(Number)
      const timeMinutes = timeHour * 60 + timeMinute
      
      // Check if time is during break
      if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
        db.release()
        return NextResponse.json(
          { error: 'Този час е в почивка. Моля, изберете друг час.' },
          { status: 409 }
        )
      }
    }

    // Get service details for duration calculation
    const serviceDetails = await db.query('SELECT * FROM services WHERE id = $1', [service])
    if (serviceDetails.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Избраната услуга не съществува' },
        { status: 400 }
      )
    }

    // Create the booking with service duration
    const result = await db.query(`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [name, email || null, phone, serviceDetails.rows[0].name, serviceDetails.rows[0].duration, date, time, message || null, 'pending'])

    const bookingId = result.rows[0].id

    // Get the complete booking with service name for email
    const booking = await db.query(`
      SELECT b.*, b.service as serviceName 
      FROM bookings b 
      WHERE b.id = $1
    `, [bookingId])

    db.release()

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking.rows[0])
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    // Send admin notification
    try {
      await sendAdminNotification(booking.rows[0])
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Резервацията е създадена успешно! Ще получите потвърждение на имейла.',
      bookingId
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Възникна грешка при създаването на резервацията' },
      { status: 500 }
    )
  }
} 