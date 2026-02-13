import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import type { PoolClient } from 'pg'
import { emitBookingAdded, emitBookingDeleted, emitBookingUpdate } from '@/lib/socket'
import { verifyRequestToken } from '@/lib/auth-helpers'

// Global request counter for debugging
let apiRequestCounter = 0

// Cache for optional column detection
let hasUserIdColumnCache: boolean | null = null

async function ensureHasUserIdColumn(db: PoolClient): Promise<boolean> {
  if (hasUserIdColumnCache !== null) return hasUserIdColumnCache
  try {
    const res = await db.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'user_id' LIMIT 1`
    )
    hasUserIdColumnCache = res.rows.length > 0
    return hasUserIdColumnCache
  } catch {
    hasUserIdColumnCache = false
    return false
  }
}

/** Връща числов service ID от подадено id (число/стринг) или име на услуга */
async function resolveServiceId(db: PoolClient, service: string | number): Promise<number | null> {
  const num = typeof service === 'number' ? service : parseInt(String(service), 10)
  if (!Number.isNaN(num) && num > 0) return num
  const byName = await db.query('SELECT id FROM services WHERE name = $1 LIMIT 1', [String(service)])
  return byName.rows[0]?.id != null ? Number(byName.rows[0].id) : null
}

// Функция за проверка на свободни часове
async function checkTimeSlotAvailability(db: PoolClient, date: string, time: string, serviceId: number, duration: number, excludeBookingId?: number) {
  try {
    // Първо вземи информация за услугата
    const serviceResult = await db.query('SELECT duration FROM services WHERE id = $1', [serviceId])
    if (serviceResult.rowCount === 0) {
      return { available: false, error: 'Service not found' }
    }
    
    const serviceDuration = duration || serviceResult.rows[0].duration || 30
    
    // Конвертирай времето в минути от началото на деня
    const [hours, minutes] = time.split(':').map(Number)
    const startTimeMinutes = hours * 60 + minutes
    const endTimeMinutes = startTimeMinutes + serviceDuration
    
    // Провери за почивки
    const breaksResult = await db.query(`
      SELECT wb.start_time, wb.end_time
      FROM working_hours wh
      JOIN working_breaks wb ON wh.id = wb.working_hours_id
      WHERE wh.date = $1
    `, [date])
    
    // Провери дали има конфликт с почивка
    for (const breakItem of breaksResult.rows) {
      const [breakStartHour, breakStartMinute] = breakItem.start_time.split(':').map(Number)
      const [breakEndHour, breakEndMinute] = breakItem.end_time.split(':').map(Number)
      const breakStartMinutes = breakStartHour * 60 + breakStartMinute
      const breakEndMinutes = breakEndHour * 60 + breakEndMinute
      
      // Провери дали има припокриване с почивка (включително докосване)
      if (startTimeMinutes < breakEndMinutes && endTimeMinutes > breakStartMinutes) {
        return { 
          available: false, 
          error: `Time slot conflicts with break time (${breakItem.start_time} - ${breakItem.end_time})` 
        }
      }
    }
    
    // Провери за съществуващи резервации в същия ден
    const existingBookingsQuery = `
      SELECT b.time, b.serviceduration, b.id
      FROM bookings b
      WHERE b.date = $1 
        AND b.status != 'cancelled'
        ${excludeBookingId ? 'AND b.id != $2' : ''}
    `
    
    const existingBookingsParams = excludeBookingId ? [date, excludeBookingId] : [date]
    const existingBookings = await db.query(existingBookingsQuery, existingBookingsParams)
    
    // Провери за припокриване
    for (const booking of existingBookings.rows) {
      const [bookingHours, bookingMinutes] = booking.time.split(':').map(Number)
      const bookingStartMinutes = bookingHours * 60 + bookingMinutes
      const bookingDuration = booking.serviceduration || 30
      const bookingEndMinutes = bookingStartMinutes + bookingDuration
      
      // Провери дали има припокриване (включително докосване)
      if (startTimeMinutes < bookingEndMinutes && endTimeMinutes > bookingStartMinutes) {
        return { 
          available: false, 
          error: `Time slot conflicts with existing booking at ${booking.time}` 
        }
      }
    }
    
    return { available: true }
  } catch (error) {
    console.error('Error checking time slot availability:', error)
    return { available: false, error: 'Error checking availability' }
  }
}

export async function GET(request: NextRequest) {
  apiRequestCounter++
  console.log(`🌐 API /admin/bookings GET call #${apiRequestCounter}`)
  
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const id = searchParams.get('id')
    
    // Authentication check (centralized via verifyRequestToken in route handlers)
    // Note: Cannot be in middleware due to Edge runtime limitations with database
    console.log('🌐 API /admin/bookings GET called:', { 
      callNumber: apiRequestCounter,
      hasDate: !!date, 
      hasId: !!id, 
      date: date,
      id: id,
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      timestamp: new Date().toISOString()
    })

    // const serviceId = searchParams.get('serviceId') // Unused variable
    
    // Ако има date параметър, връщай свободните часове за тази дата
    if (date) {
      let db: PoolClient | null = null
      
      try {
        db = await getDatabase()
        
        // Вземи всички резервации за датата
        const bookingsResult = await db.query(`
          SELECT b.id, b.time, 
                 COALESCE(b.serviceduration, 30) as serviceDuration
          FROM bookings b
          WHERE b.date = $1 AND b.status != 'cancelled'
          ORDER BY b.time
        `, [date])
        
        // Вземи работното време за датата
        const workingHoursResult = await db.query(`
          SELECT wh.start_time, wh.end_time,
                 COALESCE(
                   json_agg(
                     json_build_object(
                       'id', wb.id,
                       'startTime', wb.start_time,
                       'endTime', wb.end_time,
                       'description', wb.description
                     )
                   ) FILTER (WHERE wb.id IS NOT NULL), 
                   '[]'::json
                 ) as breaks
          FROM working_hours wh
          LEFT JOIN working_breaks wb ON wh.id = wb.working_hours_id
          WHERE wh.date = $1
          GROUP BY wh.id, wh.start_time, wh.end_time
        `, [date])
        
        // Map serviceduration to serviceDuration for frontend compatibility  
        const mappedBookedSlots = bookingsResult.rows.map((slot: { serviceduration?: number; serviceDuration?: number }) => {
          const { serviceduration, ...rest } = slot
          return {
            ...rest,
            serviceDuration: serviceduration || slot.serviceDuration || 30
          }
        })
        
        const workingHours = workingHoursResult.rows[0] || null
        
        return NextResponse.json({
          date,
          bookedSlots: mappedBookedSlots,
          workingHours,
          message: 'Available time slots retrieved successfully'
        })
      } catch (error) {
        console.error('Error fetching available time slots:', error)
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      } finally {
        if (db) {
          db.release()
        }
      }
    }
    
    // Ако няма date параметър, връщай всички резервации
    let db: PoolClient | null = null
    
    try {
      db = await getDatabase()
      const hasUserId = await ensureHasUserIdColumn(db)
      const result = await db.query(
        hasUserId
          ? `
        SELECT b.*, 
               COALESCE(s.name, b.service::text) as serviceName, 
               COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
               u.id as userId,
               u.name as userName, 
               u.email as userEmail
        FROM bookings b
        LEFT JOIN services s ON (
          s.id::text = b.service::text OR s.name = b.service::text
        )
        LEFT JOIN users u ON (
          b.user_id = u.id
          OR (b.user_id IS NULL AND b.phone IS NOT NULL AND u.phone IS NOT NULL AND right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 9))
          OR (b.user_id IS NULL AND b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email))
          OR (
            b.user_id IS NULL 
            AND (b.phone IS NULL OR b.phone = '') AND (u.phone IS NULL OR u.phone = '') 
            AND (b.email IS NULL OR b.email = '') AND (u.email IS NULL OR u.email = '') 
            AND LOWER(regexp_replace(trim(b.name), '\\s+', ' ', 'g')) = LOWER(regexp_replace(trim(u.name), '\\s+', ' ', 'g'))
          )
        )
        ORDER BY b.createdat DESC
      `
          : `
        SELECT b.*, 
               CASE 
                 WHEN s.name IS NOT NULL THEN s.name
                 WHEN b.service ~ '^[0-9]+$' THEN '[Изтрита] Услуга ' || b.service
                 ELSE '[Изтрита] ' || b.service
               END as "serviceName", 
               COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
               u.id as userId,
               u.name as userName, 
               u.email as userEmail,
               s.id as serviceId,
               b.service as originalService
        FROM bookings b
        LEFT JOIN services s ON (
          CASE 
            WHEN b.service ~ '^[0-9]+$' THEN s.id = CAST(b.service AS INTEGER)
            ELSE s.name = b.service
          END
        )
        LEFT JOIN users u ON (
          (b.phone IS NOT NULL AND u.phone IS NOT NULL AND right(regexp_replace(b.phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 9))
          OR (b.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(b.email) = LOWER(u.email))
          OR ((b.phone IS NULL OR b.phone = '') AND (u.phone IS NULL OR u.phone = '') AND (b.email IS NULL OR b.email = '') AND (u.email IS NULL OR u.email = '') AND LOWER(b.name) = LOWER(u.name))
        )
        ORDER BY b.createdat DESC
      `
      )
      
      // Map serviceduration to serviceDuration for frontend compatibility
      const mappedBookings = result.rows.map((booking: { id?: string | number; serviceduration?: number; serviceDuration?: number; createdat?: string; createdAt?: string }) => {
        const { serviceduration, createdat, ...rest } = booking
        return {
          ...rest,
          createdAt: createdat || booking.createdAt,
          serviceDuration: serviceduration || booking.serviceDuration || 30
        }
      })

      // Deduplicate by booking id to avoid inflated counts due to JOINs
      const uniqueById = new Map<string, (typeof mappedBookings)[number]>()
      for (const b of mappedBookings) {
        const key = b && (b as unknown as { id?: string | number }).id ? String((b as unknown as { id?: string | number }).id) : JSON.stringify(b)
        if (!uniqueById.has(key)) {
          uniqueById.set(key, b)
        }
      }
      const uniqueBookings = Array.from(uniqueById.values())
      
      return NextResponse.json({ bookings: uniqueBookings })
    } catch (error) {
      console.error('Error fetching bookings:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    } finally {
      if (db) {
        db.release()
      }
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyRequestToken(request)
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, service, serviceDuration, date, time, message } = body

    // Admin can create bookings without phone - only name, service, date, time are required
    if (!name || !service || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields: name, service, date, time' },
        { status: 400 }
      )
    }
    
    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Please use HH:MM format (e.g., 14:30)' },
        { status: 400 }
      )
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Please use YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Автоматично създаване на потребител ако phone е предоставен
    if (phone && phone.trim()) {
      // Check if user exists by phone number
      const user = await db.query('SELECT * FROM users WHERE phone = $1', [phone.trim()])
      
      if (user.rows.length === 0) {
        // Create new user
        await db.query(`
          INSERT INTO users (name, email, phone)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [name, email || null, phone.trim()])
        
        console.log(`✅ Created new user for phone: ${phone.trim()}`)
      } else {
        // Update existing user's information if needed
        const existingUser = user.rows[0]
        if (existingUser.name !== name || existingUser.email !== email) {
          await db.query(`
            UPDATE users 
            SET name = $1, email = $2, updatedAt = CURRENT_TIMESTAMP
            WHERE id = $3
          `, [name, email || null, existingUser.id])
          
          console.log(`✅ Updated existing user for phone: ${phone.trim()}`)
        }
      }
    }
    
    // Провери дали часът е свободен
    const availabilityCheck = await checkTimeSlotAvailability(db, date, time, parseInt(service), serviceDuration)
    
    if (!availabilityCheck.available) {
      db.release()
      return NextResponse.json(
        { error: availabilityCheck.error },
        { status: 409 } // Conflict
      )
    }
    
    // Insert new booking (phone can be null for admin bookings)
    // Try to resolve user_id when possible by phone/email/name
    let resolvedUserId: number | null = null
    try {
      const userLookup = await db.query(`
        SELECT id FROM users 
        WHERE (
          ($1 IS NOT NULL AND $1 <> '' AND phone IS NOT NULL AND right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) = right(regexp_replace($1, '[^0-9]', '', 'g'), 9))
        ) OR (
          ($2 IS NOT NULL AND $2 <> '' AND email IS NOT NULL AND LOWER(email) = LOWER($2))
        ) OR (
          ($1 IS NULL OR $1 = '') AND ($2 IS NULL OR $2 = '') AND LOWER(name) = LOWER($3)
        )
        LIMIT 1
      `, [phone || null, email || null, name])
      if (userLookup.rows[0]) {
        resolvedUserId = userLookup.rows[0].id
      }
    } catch (e) {
      console.warn('User lookup failed, proceeding without user_id')
    }

    const hasUserId = await ensureHasUserIdColumn(db)
    const result = await db.query(
      hasUserId
        ? `
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status, createdat, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10)
      RETURNING id, createdat
    `
        : `
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status, createdat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id, createdat
    `,
      hasUserId
        ? [name, email || null, phone || null, parseInt(service), serviceDuration || 30, date, time, message || null, 'pending', resolvedUserId]
        : [name, email || null, phone || null, parseInt(service), serviceDuration || 30, date, time, message || null, 'pending']
    )

    const newBookingId = result.rows[0].id
    const newCreatedAt = result.rows[0].createdat
    const newBooking = {
      id: newBookingId,
      name,
      email,
      phone,
      userId: hasUserId ? (resolvedUserId || undefined) : undefined,
      service,
      serviceDuration: serviceDuration || 30,
      date,
      time,
      message,
      status: 'pending',
      createdAt: newCreatedAt
    }

    db.release()
    
    // Emit WebSocket event for real-time updates
    try {
      // Enrich with serviceName for immediate UI display
      const svc = await db.query('SELECT name FROM services WHERE id::text = $1 OR name = $1', [String(service)])
      const enriched = { ...newBooking, serviceName: svc.rows[0]?.name || String(service) }
      emitBookingAdded(enriched as unknown)
    } catch (error) {
      console.error('WebSocket emit error:', error)
    }
    
    return NextResponse.json({
      message: 'Booking created successfully',
      id: newBookingId
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyRequestToken(request)
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const body = await request.json()
    console.log('🔍 [PUT Bookings] Request body:', body)
    const { id, status, treatment_notes, ...otherFields } = body
    console.log('🔍 [PUT Bookings] Extracted data:', { id, status, treatment_notes, otherFields })
    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    const db = await getDatabase()
    
    // Check if this is a status-only update
    const hasStatusOnly = status !== undefined && Object.keys(otherFields).length === 0
    const hasTreatmentNotesOnly = treatment_notes !== undefined && Object.keys(otherFields).length === 0
    

    
    if (hasStatusOnly) {
      await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id])
    } else if (hasTreatmentNotesOnly) {
      await db.query('UPDATE bookings SET treatment_notes = $1 WHERE id = $2', [treatment_notes, id])
    } else {
      // Update booking details (name, email, phone, service, etc.)
      const { name, email, phone, service, serviceDuration, date, time, message } = otherFields
      console.log('🔍 [PUT Bookings] Update booking details:', { name, email, phone, service, serviceDuration, date, time, message })
      
      if (date && time && service) {
        const serviceId = await resolveServiceId(db, service)
        if (serviceId == null) {
          db.release()
          return NextResponse.json(
            { error: 'Услугата не е намерена (ид или име)' },
            { status: 400 }
          )
        }
        const availabilityCheck = await checkTimeSlotAvailability(db, date, time, serviceId, serviceDuration || 30, parseInt(String(id), 10))
        if (!availabilityCheck.available) {
          db.release()
          return NextResponse.json(
            { error: availabilityCheck.error },
            { status: 409 }
          )
        }
      }
      
      console.log('🔍 [PUT Bookings] SQL Update params:', [name, email || null, phone, service, serviceDuration || 30, date, time, message || null, status || 'pending', id])
      
      const result = await db.query(`
        UPDATE bookings
        SET name = $1, email = $2, phone = $3, service = $4, serviceduration = $5, date = $6, time = $7, message = $8, status = $9
        WHERE id = $10
      `, [name, email || null, phone, service, serviceDuration || 30, date, time, message || null, status || 'pending', id])
      
      console.log('🔍 [PUT Bookings] SQL Update result:', result.rowCount)
    }
    db.release()
    
    // Get the updated booking for WebSocket event
    const updatedBooking = await db.query(`
      SELECT b.*, 
             CASE 
               WHEN s.name IS NOT NULL THEN s.name
               WHEN b.service ~ '^[0-9]+$' THEN '[Изтрита] Услуга ' || b.service
               ELSE '[Изтрита] ' || b.service
             END as "serviceName",
             COALESCE(b.serviceduration, s.duration, 30) as serviceDuration,
             u.name as userName, 
             u.email as userEmail,
             s.id as serviceId,
             b.service as originalService
      FROM bookings b
      LEFT JOIN services s ON (
        CASE 
          WHEN b.service ~ '^[0-9]+$' THEN s.id = CAST(b.service AS INTEGER)
          ELSE s.name = b.service
        END
      )
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.id = $1
    `, [id])

    const mapped = (() => {
      const row = updatedBooking.rows[0] as { serviceduration?: number; createdat?: string; createdAt?: string } | undefined
      if (!row) return null
      const { serviceduration, createdat, ...rest } = row as Record<string, unknown>
      return { 
        ...(rest as Record<string, unknown>), 
        createdAt: createdat || row.createdAt, 
        serviceDuration: serviceduration || (row as unknown as { serviceDuration?: number }).serviceDuration || 30 
      }
    })()

    try {
      if (mapped) emitBookingUpdate(mapped)
    } catch (error) {
      console.error('WebSocket emit error:', error)
    }
    return NextResponse.json({
      message: 'Booking updated successfully',
      booking: mapped
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyRequestToken(request)
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    await db.query('DELETE FROM bookings WHERE id = $1', [id])

    db.release()
    
    // Emit WebSocket event for real-time updates
    try {
      emitBookingDeleted(id)
    } catch (error) {
      console.error('WebSocket emit error:', error)
    }
    
    return NextResponse.json({
      message: 'Booking deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 