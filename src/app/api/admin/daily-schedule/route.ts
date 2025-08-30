import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Get working hours for this date with breaks
    const workingHours = await db.query(`
      SELECT wh.*, 
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
      GROUP BY wh.id, wh.date, wh.is_working_day, wh.start_time, wh.end_time, wh.notes, wh.created_at
    `, [date])
    
    // Get all bookings for this date
    const bookings = await db.query(`
      SELECT b.*, s.name as serviceName, s.duration as serviceDuration, u.name as userName, b.service
      FROM bookings b
      LEFT JOIN services s ON (
        b.service::text = s.id::text OR b.service = s.name
      )
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.date = $1
      ORDER BY b.time
    `, [date])

    db.release()

    // Map serviceduration to serviceDuration for frontend compatibility
    const mappedBookings = bookings.rows.map(booking => {
      const { serviceduration, ...rest } = booking
      return {
        ...rest,
        serviceDuration: serviceduration || booking.serviceDuration || 30
      }
    })

    // Deduplicate bookings by id to avoid inflated counts
    const uniqueBookingsMap = new Map<string, (typeof mappedBookings)[number]>()
    for (const b of mappedBookings) {
      const key = String((b as unknown as { id?: string | number }).id)
      if (!uniqueBookingsMap.has(key)) {
        uniqueBookingsMap.set(key, b)
      }
    }
    const uniqueBookings = Array.from(uniqueBookingsMap.values())

    // Load default settings to determine if the day is working
    let defaultSettings = {
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00'
    }

    try {
      const fs = require('fs')
      const path = require('path')
      const SETTINGS_FILE = path.join(process.cwd(), 'app-settings.json')
      if (fs.existsSync(SETTINGS_FILE)) {
        const json = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'))
        if (json?.defaultWorkingHours) {
          defaultSettings = json.defaultWorkingHours
        }
      }
    } catch (e) {
      console.error('Failed to load default settings for daily schedule:', e)
    }

    // Determine if the date is a working day based on settings
    const dateObj = new Date(date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isWorkingDayByDefault = defaultSettings.workingDays.includes(dayOfWeek)

    // Default working hours if not set
    const defaultWorkingHours = {
      isWorkingDay: isWorkingDayByDefault,
      startTime: defaultSettings.startTime || '09:00',
      endTime: defaultSettings.endTime || '18:00',
      notes: isWorkingDayByDefault ? null : 'Почивен ден според настройките',
      breaks: [{ startTime: defaultSettings.breakStart || '12:00', endTime: defaultSettings.breakEnd || '13:00', description: 'Почивка' }]
    }

    const workingHoursData = workingHours.rows.length > 0 ? {
      isWorkingDay: workingHours.rows[0].is_working_day,
      startTime: workingHours.rows[0].start_time,
      endTime: workingHours.rows[0].end_time,
      notes: workingHours.rows[0].notes,
      breaks: workingHours.rows[0].breaks
    } : defaultWorkingHours

    return NextResponse.json({
      date,
      workingHours: workingHoursData,
      bookings: uniqueBookings,
      totalBookings: uniqueBookings.length
    })
  } catch (error) {
    console.error('Error fetching daily schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 