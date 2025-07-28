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
    const services = await db.all('SELECT * FROM services ORDER BY name')
    
    return NextResponse.json({ services })
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
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, duration, price } = body

    const db = await getDatabase()
    const result = await db.run(`
      INSERT INTO services (name, description, duration, price)
      VALUES (?, ?, ?, ?)
    `, [name, description, duration, price])

    const newService = await db.get('SELECT * FROM services WHERE id = ?', [result.lastID])

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
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, description, duration, price, isActive } = body

    const db = await getDatabase()
    const result = await db.run(`
      UPDATE services 
      SET name = ?, description = ?, duration = ?, price = ?, isActive = ?
      WHERE id = ?
    `, [name, description, duration, price, isActive ? 1 : 0, id])
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    const updatedService = await db.get('SELECT * FROM services WHERE id = ?', [id])

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
        { error: 'Service ID required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const result = await db.run('DELETE FROM services WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 