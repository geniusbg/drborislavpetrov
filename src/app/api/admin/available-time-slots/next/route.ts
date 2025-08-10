import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-admin-token')
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') // YYYY-MM-DD
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const serviceDuration = parseInt(searchParams.get('serviceDuration') || '15', 10)

    if (!from) {
      return NextResponse.json({ error: 'Parameter "from" (YYYY-MM-DD) is required' }, { status: 400 })
    }

    const db = await getDatabase()

    const collected: Array<{ date: string; time: string }> = []
    let cursor = new Date(from)

    // Collect until we have limit items or we traversed 90 days max
    for (let dayOffset = 0; collected.length < limit && dayOffset < 90; dayOffset++) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      // Skip weekends (Sun=0, Sat=6)
      const dayOfWeek = cursor.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Working hours for this date
        const workingHoursQuery = `
          SELECT start_time, end_time, is_working_day, break_start, break_end
          FROM working_hours
          WHERE date = $1
        `
        const whRes = await db.query(workingHoursQuery, [dateStr])

        let workingStart = '09:00'
        let workingEnd = '18:00'
        let isWorkingDay = false
        let breakStart: string | null = null
        let breakEnd: string | null = null

        if (whRes.rows.length > 0) {
          const wh = whRes.rows[0]
          if (wh.is_working_day) {
            isWorkingDay = true
            workingStart = wh.start_time || '09:00'
            workingEnd = wh.end_time || '18:00'
            breakStart = wh.break_start
            breakEnd = wh.break_end
          }
        } else {
          // default working day if no record
          isWorkingDay = true
        }

        if (isWorkingDay) {
          // Existing bookings
          const bookingsQuery = `
            SELECT time, COALESCE(serviceduration, 30) as duration
            FROM bookings
            WHERE date = $1 AND status != 'cancelled'
          `
          const bookingsRes = await db.query(bookingsQuery, [dateStr])
          const existing = bookingsRes.rows as Array<{ time: string; duration: number }>

          // Generate slots
          const startHour = parseInt(workingStart.split(':')[0], 10)
          const startMinute = parseInt(workingStart.split(':')[1], 10)
          const endHour = parseInt(workingEnd.split(':')[0], 10)
          const endMinute = parseInt(workingEnd.split(':')[1], 10)
          const startMinutes = startHour * 60 + startMinute
          const endMinutes = endHour * 60 + endMinute

          for (let t = startMinutes; t < endMinutes; t += 15) {
            if (collected.length >= limit) break

            const slotStart = t
            const slotEnd = t + serviceDuration
            if (slotEnd > endMinutes) continue

            // Break conflict (single window from working_hours)
            if (breakStart && breakEnd) {
              const bs = convertTimeToMinutes(breakStart)
              const be = convertTimeToMinutes(breakEnd)
              if (slotStart < be && slotEnd > bs) continue
            }

            // Booking conflict
            let conflict = false
            for (const b of existing) {
              const bStart = convertTimeToMinutes(b.time)
              const bEnd = bStart + (b.duration || 30)
              if (slotStart < bEnd && slotEnd > bStart) {
                conflict = true
                break
              }
            }
            if (conflict) continue

            // Add slot
            const hour = Math.floor(slotStart / 60)
            const minute = slotStart % 60
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
            collected.push({ date: dateStr, time: timeStr })
          }
        }
      }

      // Advance to next day
      cursor.setDate(cursor.getDate() + 1)
    }

    db.release()
    return NextResponse.json({ slots: collected })
  } catch (error) {
    console.error('Error getting next available time slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function convertTimeToMinutes(timeString: string): number {
  const [h, m] = timeString.split(':').map(Number)
  return h * 60 + m
}


