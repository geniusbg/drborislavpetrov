import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const service = searchParams.get('service')
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '30')
    const excludeBookingId = searchParams.get('excludeBookingId')
    const limit = parseInt(searchParams.get('limit') || '10')

    // For quick response widget, service is optional
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    console.log('🕒 Getting available time slots for:', { date, service, serviceDuration, excludeBookingId })

    const db = await getDatabase()

    // Step 1: Get working hours for this date
    const workingHoursQuery = `
      SELECT start_time, end_time, is_working_day, break_start, break_end 
      FROM working_hours 
      WHERE date = $1
    `
    const workingHoursResult = await db.query(workingHoursQuery, [date])
    
    let workingStart = '09:00'
    let workingEnd = '18:00'
    let isWorkingDay = false
    let breakStart = null
    let breakEnd = null

    if (workingHoursResult.rows.length > 0) {
      const workingHours = workingHoursResult.rows[0]
      if (workingHours.is_working_day) {
        isWorkingDay = true
        workingStart = workingHours.start_time || '09:00'
        workingEnd = workingHours.end_time || '18:00'
        breakStart = workingHours.break_start
        breakEnd = workingHours.break_end
      }
    } else {
      // If no working hours record exists, assume it's a working day with default hours
      // This handles the case where working_hours table is empty
      isWorkingDay = true
      workingStart = '09:00'
      workingEnd = '18:00'
    }

    console.log('🕒 Working hours:', { isWorkingDay, workingStart, workingEnd, breakStart, breakEnd })

    if (!isWorkingDay) {
      return NextResponse.json({ availableSlots: [] })
    }

    // Step 2: Get existing bookings for this date
    let bookingsQuery = `
      SELECT time, COALESCE(serviceduration, 30) as duration 
      FROM bookings 
      WHERE date = $1 AND status != 'cancelled'
    `
    const queryParams = [date]

    // Exclude current booking if editing
    if (excludeBookingId) {
      bookingsQuery += ` AND id != $2`
      queryParams.push(excludeBookingId)
    }

    const bookingsResult = await db.query(bookingsQuery, queryParams)
    const existingBookings = bookingsResult.rows

    console.log('🕒 Existing bookings:', existingBookings)

    // Step 3: Generate all possible 15-minute time slots within working hours
    const allTimeSlots: string[] = []
    const startHour = parseInt(workingStart.split(':')[0])
    const startMinute = parseInt(workingStart.split(':')[1])
    const endHour = parseInt(workingEnd.split(':')[0])
    const endMinute = parseInt(workingEnd.split(':')[1])

    const startTimeInMinutes = startHour * 60 + startMinute
    const endTimeInMinutes = endHour * 60 + endMinute

    for (let timeInMinutes = startTimeInMinutes; timeInMinutes < endTimeInMinutes; timeInMinutes += 15) {
      const hour = Math.floor(timeInMinutes / 60)
      const minute = timeInMinutes % 60
      
      // Check if this slot + service duration fits within working hours
      if (timeInMinutes + serviceDuration <= endTimeInMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        allTimeSlots.push(timeString)
      }
    }

    console.log('🕒 All possible slots:', allTimeSlots.length)

    // Step 4: Filter out slots that conflict with existing bookings and break time
    const availableSlots = allTimeSlots.filter(slot => {
      const slotStartInMinutes = convertTimeToMinutes(slot)
      const slotEndInMinutes = slotStartInMinutes + serviceDuration

      // Check if this slot conflicts with break time (single window)
      if (breakStart && breakEnd) {
        const breakStartInMinutes = convertTimeToMinutes(breakStart)
        const breakEndInMinutes = convertTimeToMinutes(breakEnd)
        if (slotStartInMinutes < breakEndInMinutes && slotEndInMinutes > breakStartInMinutes) {
          return false // Conflicts with break time
        }
      }

      // Check if this slot conflicts with any existing booking
      for (const booking of existingBookings) {
        const bookingStartInMinutes = convertTimeToMinutes(booking.time)
        const bookingEndInMinutes = bookingStartInMinutes + booking.duration

        // Check for overlap
        if (slotStartInMinutes < bookingEndInMinutes && slotEndInMinutes > bookingStartInMinutes) {
          return false // Conflict found
        }
      }

      return true // No conflict
    })

    console.log('🕒 Available slots:', availableSlots.length, availableSlots)

    // Apply limit if specified
    const limitedSlots = limit > 0 ? availableSlots.slice(0, limit) : availableSlots

    db.release()
    return NextResponse.json({ availableSlots: limitedSlots })

  } catch (error) {
    console.error('Error getting available time slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}