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
    const users = await db.all('SELECT * FROM users ORDER BY name')
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
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
    const { name, email, phone, address, notes } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if user with this phone already exists
    const existingUser = await db.get('SELECT * FROM users WHERE phone = ?', [phone])
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this phone number already exists' },
        { status: 409 }
      )
    }

    const result = await db.run(`
      INSERT INTO users (name, email, phone, address, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [name, email || null, phone, address || null, notes || null])

    return NextResponse.json({
      message: 'User created successfully',
      userId: result.lastID
    })
  } catch (error) {
    console.error('Error creating user:', error)
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
    const { id, name, email, phone, address, notes } = body

    if (!id || !name || !phone) {
      return NextResponse.json(
        { error: 'ID, name and phone are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if phone is already used by another user
    const existingUser = await db.get('SELECT * FROM users WHERE phone = ? AND id != ?', [phone, id])
    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number is already used by another user' },
        { status: 409 }
      )
    }

    await db.run(`
      UPDATE users 
      SET name = ?, email = ?, phone = ?, address = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, email || null, phone, address || null, notes || null, id])

    return NextResponse.json({
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
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
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if user has any bookings
    const bookings = await db.get('SELECT COUNT(*) as count FROM bookings WHERE phone = (SELECT phone FROM users WHERE id = ?)', [id])
    if (bookings.count > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing bookings' },
        { status: 400 }
      )
    }

    await db.run('DELETE FROM users WHERE id = ?', [id])

    return NextResponse.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 