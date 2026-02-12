import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { normalizePhoneE164, sanitizePhoneDigits } from '@/lib/phone'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/email'

/** Normalize time to "HH:MM" so "9:00" and "09:00" match. */
function normalizeTimeHHMM(t: string): string {
  const parts = String(t).trim().split(':').map(Number)
  const h = Math.max(0, Math.min(23, parts[0] ?? 0))
  const m = Math.max(0, Math.min(59, parts[1] ?? 0))
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function timeToMinutes(t: string): number {
  const [h, m] = String(t).split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, service, date, time, message } = body
    const phoneE164 = normalizePhoneE164(phone, process.env.DEFAULT_COUNTRY || 'BG')

    // Validate required fields - phone is mandatory for public bookings
    if (!name || !phoneE164 || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Всички задължителни полета трябва да бъдат попълнени' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if user exists by phone number
    let user = await db.query("SELECT * FROM users WHERE right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 9) = $1", [sanitizePhoneDigits(phoneE164).slice(-9)])
    
    if (user.rows.length === 0) {
      // Create new user
      const userResult = await db.query(`
        INSERT INTO users (name, email, phone)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [name, email || null, phoneE164])
      
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

    // Get service duration first for overlap check
    const serviceDetails = await db.query('SELECT * FROM services WHERE id = $1', [service])
    if (serviceDetails.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Избраната услуга не съществува' },
        { status: 400 }
      )
    }
    const duration = serviceDetails.rows[0].duration ?? 30
    const timeNormalized = normalizeTimeHHMM(time)
    const newStart = timeToMinutes(timeNormalized)
    const newEnd = newStart + duration

    // Check if the time slot overlaps any existing booking (same logic as available-slots)
    const existingBookings = await db.query(
      `SELECT time, COALESCE(serviceduration, 30) as duration FROM bookings WHERE date = $1 AND status != 'cancelled'`,
      [date]
    )
    for (const row of existingBookings.rows as Array<{ time: string; duration: number }>) {
      const bStart = timeToMinutes(normalizeTimeHHMM(row.time))
      const bEnd = bStart + (row.duration || 30)
      if (newStart < bEnd && newEnd > bStart) {
        db.release()
        return NextResponse.json(
          { error: 'Този час вече е зает. Моля, изберете друг час.' },
          { status: 409 }
        )
      }
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
      
      const timeMinutes = timeToMinutes(timeNormalized)
      
      // Check if time is during break
      if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
        db.release()
        return NextResponse.json(
          { error: 'Този час е в почивка. Моля, изберете друг час.' },
          { status: 409 }
        )
      }
    }

    // Create the booking with service duration (store normalized time)
    const result = await db.query(`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [name, email || null, phoneE164, serviceDetails.rows[0].name, serviceDetails.rows[0].duration, date, timeNormalized, message || null, 'pending'])

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