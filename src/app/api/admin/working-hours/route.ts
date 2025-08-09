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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const db = await getDatabase()
    
    let query = `
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
    `
    let params: string[] = []
    
    if (startDate && endDate) {
      query += ' WHERE wh.date >= $1 AND wh.date <= $2'
      params = [startDate, endDate]
    }
    
    query += ' GROUP BY wh.id, wh.date, wh.is_working_day, wh.start_time, wh.end_time, wh.notes, wh.created_at'
    query += ' ORDER BY wh.date'
    
    const result = await db.query(query, params)
    db.release()
    
    // Convert snake_case to camelCase
    const workingHours = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      isWorkingDay: row.is_working_day,
      startTime: row.start_time,
      endTime: row.end_time,
      notes: row.notes,
      breaks: row.breaks
    }))
    
    return NextResponse.json({ workingHours })
  } catch (error) {
    console.error('Error fetching working hours:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { date, isWorkingDay, startTime, endTime, notes, breaks } = body

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if working hours for this date already exist
    const existing = await db.query('SELECT * FROM working_hours WHERE date = $1', [date])
    
    let workingHoursId: number
    
    if (existing.rows.length > 0) {
      // Update existing record
      const result = await db.query(`
        UPDATE working_hours 
        SET is_working_day = $1, start_time = $2, end_time = $3, notes = $4
        WHERE date = $5
        RETURNING id
      `, [isWorkingDay, startTime, endTime, notes, date])
      workingHoursId = result.rows[0].id
      
      // Delete existing breaks
      await db.query('DELETE FROM working_breaks WHERE working_hours_id = $1', [workingHoursId])
    } else {
      // Insert new record
      const result = await db.query(`
        INSERT INTO working_hours (date, is_working_day, start_time, end_time, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [date, isWorkingDay, startTime, endTime, notes])
      workingHoursId = result.rows[0].id
    }

    // Insert breaks
    if (breaks && Array.isArray(breaks)) {
      for (const breakItem of breaks) {
        await db.query(`
          INSERT INTO working_breaks (working_hours_id, start_time, end_time, description)
          VALUES ($1, $2, $3, $4)
        `, [workingHoursId, breakItem.startTime, breakItem.endTime, breakItem.description || 'Почивка'])
      }
    }

    db.release()
    return NextResponse.json({
      message: 'Working hours updated successfully'
    })
  } catch (error) {
    console.error('Error updating working hours:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    
    // Get the working hours ID first
    const workingHours = await db.query('SELECT id FROM working_hours WHERE date = $1', [date])
    
    if (workingHours.rows.length > 0) {
      const workingHoursId = workingHours.rows[0].id
      
      // Delete breaks first (due to foreign key constraint)
      await db.query('DELETE FROM working_breaks WHERE working_hours_id = $1', [workingHoursId])
      
      // Then delete working hours
      await db.query('DELETE FROM working_hours WHERE date = $1', [date])
    }
    
    db.release()

    return NextResponse.json({
      message: 'Working hours deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting working hours:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 