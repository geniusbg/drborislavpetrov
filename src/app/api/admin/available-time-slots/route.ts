import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import fs from 'fs'
import path from 'path'

function loadDefaultSettings() {
  try {
    const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')
    if (fs.existsSync(SETTINGS_FILE)) {
      const json = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
      return json?.defaultWorkingHours || null
    }
  } catch (e) {
    console.error('Failed to load default settings:', e)
  }
  return {
    workingDays: [1,2,3,4,5],
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00'
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    // const service = searchParams.get('service')
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '30')
    const excludeBookingId = searchParams.get('excludeBookingId')
    const limit = parseInt(searchParams.get('limit') || '10')

    // For quick response widget, service is optional
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }



    const db = await getDatabase()

    // Step 1: Get working hours and breaks for this date (matching DailySchedule API)
    const workingHoursQuery = `
      SELECT wh.start_time, wh.end_time, wh.is_working_day,
             COALESCE(
               json_agg(
                 json_build_object(
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
      GROUP BY wh.id, wh.start_time, wh.end_time, wh.is_working_day
    `
    const workingHoursResult = await db.query(workingHoursQuery, [date])
    
    let workingStart = '09:00'
    let workingEnd = '18:00'
    let isWorkingDay = false
    let breaks: Array<{startTime: string, endTime: string}> = []

    if (workingHoursResult.rows.length > 0) {
      const workingHours = workingHoursResult.rows[0]
      if (workingHours.is_working_day) {
        isWorkingDay = true
        workingStart = workingHours.start_time || '09:00'
        workingEnd = workingHours.end_time || '18:00'
        breaks = workingHours.breaks || []
      } else {
        isWorkingDay = false
      }
    } else {
      // Fallback to global settings and default working days
      const defaults = loadDefaultSettings()
      const dayOfWeek = new Date(date).getDay()
      const workingDays: number[] = defaults?.workingDays || [1,2,3,4,5]
      if (workingDays.includes(dayOfWeek)) {
        isWorkingDay = true
        workingStart = defaults?.startTime || '09:00'
        workingEnd = defaults?.endTime || '18:00'
        // Add default break if specified
        if (defaults?.breakStart && defaults?.breakEnd) {
          breaks = [{
            startTime: defaults.breakStart,
            endTime: defaults.breakEnd
          }]
        }
      } else {
        // isWorkingDay = false
      }
    }




    // Admin-ите могат да добавят резервации дори в почивните дни
    // if (!isWorkingDay) {
    //   return NextResponse.json({ availableSlots: [] })
    // }

    // Step 2: Get existing bookings for this date (temporary fix - use booking serviceduration field)
    let bookingsQuery = `
      SELECT id, time, COALESCE(serviceduration, 30) as duration 
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

    



    // Step 4: Filter out slots that conflict with existing bookings and break time
    const availableSlots = allTimeSlots.filter(slot => {
      const slotStartInMinutes = convertTimeToMinutes(slot)
      const slotEndInMinutes = slotStartInMinutes + serviceDuration

      // Check if this slot conflicts with any break times
      for (const breakItem of breaks) {
        const breakStartInMinutes = convertTimeToMinutes(breakItem.startTime)
        const breakEndInMinutes = convertTimeToMinutes(breakItem.endTime)
        if (slotStartInMinutes < breakEndInMinutes && slotEndInMinutes > breakStartInMinutes) {
          return false // Conflicts with break time
        }
      }

      // Check if this slot conflicts with any existing booking
      for (const booking of existingBookings) {
        const bookingStartInMinutes = convertTimeToMinutes(booking.time)
        const bookingEndInMinutes = bookingStartInMinutes + booking.duration

        // Check for overlap (including touching times)
        if (slotStartInMinutes < bookingEndInMinutes && slotEndInMinutes > bookingStartInMinutes) {
          return false // Conflict found
        }
      }


      return true // No conflict
    })

    





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