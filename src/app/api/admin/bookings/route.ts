import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const bookings = await db.all(`
      SELECT b.*, s.name as serviceName, u.name as userName, u.email as userEmail
      FROM bookings b
      LEFT JOIN services s ON b.service = s.id
      LEFT JOIN users u ON b.phone = u.phone
      ORDER BY b.createdAt DESC
    `)
    
    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status, treatment_notes, ...otherFields } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    if (status) {
      // Update booking status (now allows cancelling confirmed bookings)
      await db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id])
    } else if (treatment_notes !== undefined) {
      // Update treatment notes
      await db.run('UPDATE bookings SET treatment_notes = ? WHERE id = ?', [treatment_notes, id])
    } else {
      // Update booking details
      const { name, email, phone, service, date, time, message } = otherFields
      await db.run(`
        UPDATE bookings 
        SET name = ?, email = ?, phone = ?, service = ?, date = ?, time = ?, message = ?
        WHERE id = ?
      `, [name, email || null, phone, service, date, time, message || null, id])
    }

    return NextResponse.json({
      message: 'Booking updated successfully'
    })
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    await db.run('DELETE FROM bookings WHERE id = ?', [id])

    return NextResponse.json({
      message: 'Booking deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 