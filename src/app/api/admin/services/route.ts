import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { emitServiceAdded, emitServiceUpdate, emitServiceDeleted } from '@/lib/socket'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDatabase()
    const result = await db.query('SELECT * FROM services ORDER BY name')
    
    db.release()
    return NextResponse.json({ services: result.rows })
  } catch (error) {
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
    const { name, description, duration, price, isActive } = body

    const db = await getDatabase()
    const result = await db.query(`
      INSERT INTO services (name, description, duration, price, isActive)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, duration, price, isActive ?? true])

    const newService = result.rows[0]
    db.release()
    
    // Emit WebSocket event
    emitServiceAdded(newService)
    
    return NextResponse.json({ 
      success: true, 
      service: newService 
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, description, duration, price, isActive } = body

    const db = await getDatabase()
    const result = await db.query(`
      UPDATE services 
      SET name = $1, description = $2, duration = $3, price = $4, isActive = $5
      WHERE id = $6
      RETURNING *
    `, [name, description, duration, price, isActive, id])
    
    if (result.rowCount === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const updatedService = result.rows[0]
    db.release()
    
    // Emit WebSocket event
    emitServiceUpdate(updatedService)
    
    return NextResponse.json({ 
      success: true, 
      service: updatedService 
    })
  } catch (error) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Service ID required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const result = await db.query('DELETE FROM services WHERE id = $1', [id])
    
    if (result.rowCount === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    db.release()
    
    // Emit WebSocket event
    emitServiceDeleted(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 