/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { validateAdminBooking } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    const db = await getDatabase()

    switch (action) {
      case 'create_booking':
        return await handleCreateBooking(data, db)
      
      case 'confirm_booking':
        return await handleConfirmBooking(data, db)
      
      case 'cancel_booking':
        return await handleCancelBooking(data, db)
      
      case 'get_bookings':
        return await handleGetBookings(db)
      
      default:
        return NextResponse.json(
          { error: 'Неизвестно действие' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Siri API error:', error)
    return NextResponse.json(
      { error: 'Възникна грешка' },
      { status: 500 }
    )
  }
}

async function handleCreateBooking(data: Record<string, unknown>, db: any) {
  // Validate data using admin booking schema (phone optional)
  const validation = validateAdminBooking(data)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.issues[0].message },
      { status: 400 }
    )
  }

  const { name: patientName, date, time, service, phone } = validation.data

  // Check if user exists by phone number (if phone provided) or by name
  let user = null
  if (phone && phone.trim()) {
    user = await db.query('SELECT * FROM users WHERE phone = $1', [phone.trim()])
  }
  
  if (!user || user.rows.length === 0) {
    // Try to find by name if phone not found
    user = await db.query('SELECT * FROM users WHERE name = $1', [patientName])
  }
  
  if (user.rows.length === 0) {
    // Create new user
    const userPhone = phone && phone.trim() ? phone.trim() : '+359888000000'
    const userResult = await db.query(`
      INSERT INTO users (name, phone)
      VALUES ($1, $2)
      RETURNING id
    `, [patientName, userPhone])
    
    user = {
      rows: [{
        id: userResult.rows[0].id,
        name: patientName,
        phone: userPhone
      }]
    }
    
    console.log(`✅ Created new user for Siri booking: ${patientName} with phone: ${userPhone}`)
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
        { error: `Този час (${time}) на ${date} е в почивка (${breakItem.start_time} - ${breakItem.end_time})` },
        { status: 409 }
      )
    }
  }

  // Create booking
  const result = await db.query(`
    INSERT INTO bookings (name, phone, service, date, time, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING id
  `, [patientName, user.rows[0].phone, service || 1, date, time])

  db.release()
  return NextResponse.json({
    success: true,
    message: `Резервацията за ${patientName} на ${date} в ${time} е създадена успешно`,
    bookingId: result.rows[0].id
  })
}

async function handleConfirmBooking(data: Record<string, unknown>, db: any) {
  const { bookingId } = data

  if (!bookingId) {
    return NextResponse.json(
      { error: 'ID на резервацията е задължително' },
      { status: 400 }
    )
  }

  await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['confirmed', bookingId])
  db.release()

  return NextResponse.json({
    success: true,
    message: 'Резервацията е потвърдена успешно'
  })
}

async function handleCancelBooking(data: Record<string, unknown>, db: any) {
  const { bookingId } = data

  if (!bookingId) {
    return NextResponse.json(
      { error: 'ID на резервацията е задължително' },
      { status: 400 }
    )
  }

  await db.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', bookingId])
  db.release()

  return NextResponse.json({
    success: true,
    message: 'Резервацията е отменена успешно'
  })
}

async function handleGetBookings(db: any) {
  const bookings = await db.query(`
    SELECT b.*, s.name as serviceName, u.name as userName
    FROM bookings b
    LEFT JOIN services s ON b.service = s.name
    LEFT JOIN users u ON b.phone = u.phone
    WHERE b.status = 'pending'
    ORDER BY b.createdAt DESC
    LIMIT 10
  `)

  db.release()
  return NextResponse.json({
    success: true,
    bookings: bookings.rows.map((b: Record<string, unknown>) => ({
      id: b.id,
      patientName: b.name,
      service: b.serviceName,
      date: b.date,
      time: b.time,
      status: b.status
    }))
  })
} 