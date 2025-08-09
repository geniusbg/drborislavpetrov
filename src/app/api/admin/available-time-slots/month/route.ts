import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') // Format: YYYY-MM
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!month) {
      return NextResponse.json({ error: 'Month is required (format: YYYY-MM)' }, { status: 400 })
    }

    console.log('🕒 Getting available time slots for month:', { month, limit })

    const db = await getDatabase()

    // Parse month
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0) // Last day of the month

    const allSlots: Array<{ time: string; date: string }> = []

    // Iterate through each day of the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, monthNum - 1, day)
      const dateStr = currentDate.toISOString().split('T')[0]

      // Skip weekends (Saturday = 6, Sunday = 0)
      const dayOfWeek = currentDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue
      }

      // Get working hours for this date
      const workingHoursQuery = `
        SELECT start_time, end_time, is_working_day, break_start, break_end 
        FROM working_hours 
        WHERE date = $1
      `
      const workingHoursResult = await db.query(workingHoursQuery, [dateStr])
      
      let workingStart = '09:00'
      let workingEnd = '18:00'
      let isWorkingDay = true
      let breakStart = null
      let breakEnd = null

      if (workingHoursResult.rows.length > 0) {
        const workingHours = workingHoursResult.rows[0]
        if (!workingHours.is_working_day) {
          isWorkingDay = false
        } else {
          workingStart = workingHours.start_time || '09:00'
          workingEnd = workingHours.end_time || '18:00'
          breakStart = workingHours.break_start
          breakEnd = workingHours.break_end
        }
      }

      if (!isWorkingDay) {
        continue
      }

      // Get existing bookings for this date
      const bookingsQuery = `
        SELECT time, COALESCE(serviceduration, 30) as duration 
        FROM bookings 
        WHERE date = $1 AND status != 'cancelled'
      `
      const bookingsResult = await db.query(bookingsQuery, [dateStr])
      const existingBookings = bookingsResult.rows

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
        if (timeInMinutes + 30 <= endTimeInMinutes) { // Default 30 min service
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          allTimeSlots.push(timeString)
        }
      }

      // Filter out slots that conflict with existing bookings and break time
      const availableSlots = allTimeSlots.filter(slot => {
        const slotStartInMinutes = convertTimeToMinutes(slot)
        const slotEndInMinutes = slotStartInMinutes + 30 // Default 30 min service

        // Check if this slot conflicts with break time
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

    db.release()
    return NextResponse.json({ availableSlots: limitedSlots })

  } catch (error) {
    console.error('Error getting monthly available time slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
} 