/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

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
  const { patientName, date, time, service } = data

  if (!patientName || !date || !time) {
    return NextResponse.json(
      { error: 'Липсва информация за резервацията' },
      { status: 400 }
    )
  }

  // Check if user exists
  let user = await db.get('SELECT * FROM users WHERE name = ?', [patientName])
  if (!user) {
    const userResult = await db.run(`
      INSERT INTO users (name, phone)
      VALUES (?, ?)
    `, [patientName, '+359888000000'])
    
    user = {
      id: userResult.lastID,
      name: patientName,
      phone: '+359888000000'
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
  `, [patientName, user.phone, service || 1, date, time])

  return NextResponse.json({
    success: true,
    message: `Резервацията за ${patientName} на ${date} в ${time} е създадена успешно`,
    bookingId: result.lastID
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

  await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['confirmed', bookingId])

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

  await db.run('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId])

  return NextResponse.json({
    success: true,
    message: 'Резервацията е отменена успешно'
  })
}

async function handleGetBookings(db: any) {
  const bookings = await db.all(`
    SELECT b.*, s.name as serviceName, u.name as userName
    FROM bookings b
    LEFT JOIN services s ON b.service = s.id
    LEFT JOIN users u ON b.phone = u.phone
    WHERE b.status = 'pending'
    ORDER BY b.createdAt DESC
    LIMIT 10
  `)

  return NextResponse.json({
    success: true,
    bookings: bookings.map((b: Record<string, unknown>) => ({
      id: b.id,
      patientName: b.name,
      service: b.serviceName,
      date: b.date,
      time: b.time,
      status: b.status
    }))
  })
} 