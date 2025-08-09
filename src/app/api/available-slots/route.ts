import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')

    if (!date || !serviceId) {
      return NextResponse.json(
        { error: 'Date and serviceId are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Get service duration
    const service = await db.query('SELECT duration FROM services WHERE id = $1', [serviceId])
    if (service.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Get all bookings for the date
    const bookings = await db.query(`
      SELECT time, duration 
      FROM bookings b
      JOIN services s ON b.service = s.name
      WHERE b.date = $1 AND b.status != 'cancelled'
    `, [date])

    db.release()

    // Define working hours
    const workingHours = {
      start: 9, // 9:00
      end: 18,  // 18:00
      breakStart: 12, // 12:00
      breakEnd: 13    // 13:00
    }

    // Generate all possible time slots
    const allSlots = []
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      if (hour >= workingHours.breakStart && hour < workingHours.breakEnd) {
        continue // Skip lunch break
      }
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Calculate occupied slots
    const occupiedSlots = new Set()
    bookings.rows.forEach(booking => {
      const startTime = booking.time
      const duration = booking.duration || 30
      const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
      
      // Mark all slots that this booking occupies
      for (let i = 0; i < duration; i += 30) {
        const slotMinutes = startMinutes + i
        const slotHour = Math.floor(slotMinutes / 60)
        const slotMinute = slotMinutes % 60
        const slotTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`
        occupiedSlots.add(slotTime)
      }
    })

    // Filter out occupied slots
    const availableSlots = allSlots.filter(slot => !occupiedSlots.has(slot))

    return NextResponse.json({ 
      availableSlots,
      serviceDuration: service.rows[0].duration
    })
  } catch (error) {
    console.error('Error getting available slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 