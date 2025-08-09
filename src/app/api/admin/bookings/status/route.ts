import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { emitBookingUpdate } from '@/lib/socket'

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Status update endpoint called')
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('🔍 Status update body:', body)
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Update only the status
    await db.query('UPDATE bookings SET status = $1 WHERE id = $2', [status, id])
    
    db.release()
    
    // Get the updated booking for WebSocket event
    const updatedBooking = await db.query(`
      SELECT b.*, 
             b.service as serviceName, 
             COALESCE(b.serviceduration, 30) as serviceDuration,
             u.name as userName, 
             u.email as userEmail
      FROM bookings b
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.id = $1
    `, [id])
    
    // Emit WebSocket event for real-time updates
    try {
      emitBookingUpdate(updatedBooking.rows[0])
    } catch (error) {
      console.error('WebSocket emit error:', error)
    }
    
    return NextResponse.json({
      message: 'Booking status updated successfully'
    })
  } catch (error) {
    console.error('Error updating booking status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 