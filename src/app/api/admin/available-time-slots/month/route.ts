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
  let db
  try {
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '0')
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '30')

    if (!month) {
      return NextResponse.json({ error: 'Month is required (format: YYYY-MM)' }, { status: 400 })
    }

    console.log('🕒 Getting available time slots for month:', { month, limit })

    db = await getDatabase()

    // Parse month
    const [year, monthNum] = month.split('-').map(Number)
    // Use local time boundaries to avoid UTC off-by-one
    const endDate = new Date(year, monthNum, 0)

    const allSlots: Array<{ time: string; date: string }> = []

    // Iterate through each day of the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, monthNum - 1, day)
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

      // Get working hours for this date (override per-day from table, otherwise settings defaults)
      const workingHoursQuery = `
        SELECT start_time, end_time, is_working_day, break_start, break_end 
        FROM working_hours 
        WHERE date = $1
      `
      const workingHoursResult = await db.query(workingHoursQuery, [dateStr])
      
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
        } else {
          isWorkingDay = false
        }
      } else {
        // Fallback to global settings and default working days
        const defaultSettings = loadDefaultSettings()
        const workingDays: number[] = defaultSettings?.workingDays || [1,2,3,4,5]
        const dayOfWeek = currentDate.getDay()
        if (workingDays.includes(dayOfWeek)) {
          isWorkingDay = true
          workingStart = defaultSettings?.startTime || '09:00'
          workingEnd = defaultSettings?.endTime || '18:00'
          breakStart = defaultSettings?.breakStart || null
          breakEnd = defaultSettings?.breakEnd || null
        } else {
          isWorkingDay = false
        }
      }

      if (!isWorkingDay) {
        console.log(`🕒 ${dateStr}: Not a working day`)
        continue
      }

      console.log(`🕒 ${dateStr}: Working day, hours: ${workingStart}-${workingEnd}, break: ${breakStart}-${breakEnd}`)

      // Get existing bookings for this date (with correct service duration)
      const bookingsQuery = `
        SELECT b.time, b.service, b.serviceduration, s.duration, s.name
        FROM bookings b
        LEFT JOIN services s ON CASE 
          WHEN b.service ~ '^[0-9]+$' THEN (b.service::integer = s.id)
          ELSE false
        END
        WHERE b.date = $1 AND b.status != 'cancelled'
      `
      const bookingsResult = await db.query(bookingsQuery, [dateStr])
      console.log(`🕒 ${dateStr}: Bookings result:`, bookingsResult.rows)
      const existingBookings = bookingsResult.rows.map(row => ({
        time: row.time,
        duration: row.serviceduration || row.duration || 30
      }))

      // Generate all possible 15-minute time slots within working hours
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

      // Filter out slots that conflict with existing bookings and break time
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

      // Add available slots for this date
      availableSlots.forEach(time => {
        allSlots.push({
          time,
          date: dateStr
        })
      })
    }

    // Sort by date and time
    allSlots.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return a.time.localeCompare(b.time)
    })

    // Apply limit
    const limitedSlots = limit > 0 ? allSlots.slice(0, limit) : allSlots

    console.log('🕒 Monthly available slots:', limitedSlots.length)

    // Properly release the database connection
    if (db) {
      db.release()
    }
    
    return NextResponse.json({ availableSlots: limitedSlots })

  } catch (error) {
    console.error('Error getting monthly available time slots:', error)
    
    // Make sure to release the database connection even on error
    if (db) {
      db.release()
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
} 