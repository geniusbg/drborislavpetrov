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
    workingDays: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
  }
}

function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json({ error: 'Missing date or serviceId' }, { status: 400 })
    }

    const db = await getDatabase()

    // Get service duration
    const svcRes = await db.query('SELECT duration FROM services WHERE id = $1', [serviceId])
    const serviceDuration: number = svcRes.rows?.[0]?.duration || 30

    // working_hours override
    const whRes = await db.query(
      'SELECT start_time, end_time, is_working_day, break_start, break_end FROM working_hours WHERE date = $1',
      [date]
    )

    let isWorkingDay = false
    let workingStart = '09:00'
    let workingEnd = '18:00'
    let breakStart: string | null = null
    let breakEnd: string | null = null

    if (whRes.rows.length > 0) {
      const wh = whRes.rows[0]
      if (wh.is_working_day) {
        isWorkingDay = true
        workingStart = wh.start_time || workingStart
        workingEnd = wh.end_time || workingEnd
        breakStart = wh.break_start
        breakEnd = wh.break_end
      }
    } else {
      // fallback to defaults and working days
      const defaults = loadDefaultSettings()
      const dayOfWeek = new Date(date).getDay()
      const workingDays: number[] = defaults?.workingDays || [1, 2, 3, 4, 5]
      if (workingDays.includes(dayOfWeek)) {
        isWorkingDay = true
        workingStart = defaults?.startTime || workingStart
        workingEnd = defaults?.endTime || workingEnd
        breakStart = defaults?.breakStart || null
        breakEnd = defaults?.breakEnd || null
      }
    }

    if (!isWorkingDay) {
      db.release()
      return NextResponse.json({ availableSlots: [] })
    }

    // existing bookings on date
    const bkRes = await db.query(
      `SELECT time, COALESCE(serviceduration, 30) as duration FROM bookings WHERE date = $1 AND status != 'cancelled'`,
      [date]
    )
    const existing = bkRes.rows as Array<{ time: string; duration: number }>

    const all: string[] = []
    const [sh, sm] = workingStart.split(':').map(Number)
    const [eh, em] = workingEnd.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em

    for (let t = startMin; t < endMin; t += 15) {
      const slotStart = t
      const slotEnd = t + serviceDuration
      if (slotEnd > endMin) continue

      // break conflict
      if (breakStart && breakEnd) {
        const bs = convertTimeToMinutes(breakStart)
        const be = convertTimeToMinutes(breakEnd)
        if (slotStart < be && slotEnd > bs) continue
      }

      // booking conflict
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

      const hour = Math.floor(slotStart / 60)
      const minute = slotStart % 60
      all.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }

    db.release()
    return NextResponse.json({ availableSlots: all })
  } catch (error) {
    console.error('Public available slots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// legacy duplicate removed