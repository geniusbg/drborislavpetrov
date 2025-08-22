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
    try {
      const result = await db.query(`
        SELECT id, name, description, duration, price, "priceCurrency", "priceBgn", "priceEur", isactive, createdat
        FROM services 
        ORDER BY name
      `)
      
      return NextResponse.json({ services: result.rows })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('Error in GET services:', error)
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
    const { name, description, duration, price, priceCurrency, priceBgn, priceEur, isActive } = body

    const db = await getDatabase()
    try {
      const result = await db.query(`
        INSERT INTO services (name, description, duration, price, "priceCurrency", "priceBgn", "priceEur", isactive)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [name, description, duration, price, priceCurrency || 'BGN', priceBgn || price, priceEur || price, isActive ?? true])

      const newService = result.rows[0]
      
      // Emit WebSocket event
      emitServiceAdded(newService)
      
      return NextResponse.json({ 
        success: true, 
        service: newService 
      })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('Error in POST services:', error)
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
    const { id, name, description, duration, price, priceCurrency, priceBgn, priceEur, isActive } = body

    const db = await getDatabase()
    try {
      const result = await db.query(`
        UPDATE services 
        SET name = $1, description = $2, duration = $3, price = $4, "priceCurrency" = $5, "priceBgn" = $6, "priceEur" = $7, isactive = $8
        WHERE id = $9
        RETURNING *
      `, [name, description, duration, price, priceCurrency || 'BGN', priceBgn || price, priceEur || price, isActive, id])
      
      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }

      const updatedService = result.rows[0]
      
      // Emit WebSocket event
      emitServiceUpdate(updatedService)
      
      return NextResponse.json({ 
        success: true, 
        service: updatedService 
      })
    } finally {
      db.release()
    }
  } catch (error) {
    console.error('Error in PUT services:', error)
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