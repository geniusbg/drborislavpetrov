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

    // Default working hours if not set
    const defaultWorkingHours = {
      isWorkingDay: true,
      startTime: '09:00',
      endTime: '18:00',
      notes: null,
      breaks: [{ startTime: '12:00', endTime: '13:00', description: 'Почивка' }]
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
      bookings: mappedBookings,
      totalBookings: mappedBookings.length
    })
  } catch (error) {
    console.error('Error fetching daily schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 