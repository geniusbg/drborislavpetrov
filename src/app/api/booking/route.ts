import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, service, date, time, message } = body

    // Validate required fields
    if (!name || !phone || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Всички задължителни полета трябва да бъдат попълнени' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if user exists by phone number
    let user = await db.get('SELECT * FROM users WHERE phone = ?', [phone])
    
    if (!user) {
      // Create new user
      const userResult = await db.run(`
        INSERT INTO users (name, email, phone)
        VALUES (?, ?, ?)
      `, [name, email || null, phone])
      
      user = {
        id: userResult.lastID,
        name,
        email: email || null,
        phone
      }
    } else {
      // Update existing user's information if needed
      if (user.name !== name || user.email !== email) {
        await db.run(`
          UPDATE users 
          SET name = ?, email = ?, updatedAt = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, email || null, user.id])
      }
    }

    // Check if the time slot is available
    const existingBooking = await db.get(`
      SELECT * FROM bookings 
      WHERE date = ? AND time = ? AND status != 'cancelled'
    `, [date, time])

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Този час вече е зает. Моля, изберете друг час.' },
        { status: 409 }
      )
    }

    // Get service details for duration calculation
    const serviceDetails = await db.get('SELECT * FROM services WHERE id = ?', [service])
    if (!serviceDetails) {
      return NextResponse.json(
        { error: 'Избраната услуга не съществува' },
        { status: 400 }
      )
    }

    // Create the booking
    const result = await db.run(`
      INSERT INTO bookings (name, email, phone, service, date, time, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [name, email || null, phone, service, date, time, message || null])

    const bookingId = result.lastID

    // Get the complete booking with service name for email
    const booking = await db.get(`
      SELECT b.*, s.name as serviceName 
      FROM bookings b 
      LEFT JOIN services s ON b.service = s.id 
      WHERE b.id = ?
    `, [bookingId])

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking)
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    // Send admin notification
    try {
      await sendAdminNotification(booking)
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