import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { emitUserAdded, emitUserUpdate, emitUserDeleted } from '@/lib/socket'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    console.log('🔍 Users API - adminToken:', adminToken ? 'present' : 'missing')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      console.log('❌ Users API - Unauthorized: invalid token')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔍 Users API - Connecting to database...')
    const db = await getDatabase()
    console.log('🔍 Users API - Database connected, executing query...')
    const result = await db.query('SELECT id, name, email, phone, address, notes, createdat, updatedat FROM users ORDER BY name')
    console.log('🔍 Users API - Query executed, rows:', result.rows.length)
    
    db.release()
    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('❌ Error fetching users:', error)
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
    const { name, email, phone, address, notes } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Phone е optional за admin потребители
    // if (!phone) {
    //   return NextResponse.json(
    //     { error: 'Phone is required' },
    //     { status: 400 }
    //   )
    // }

    const db = await getDatabase()
    
    // Check if user with this phone already exists (only if phone is provided)
    if (phone && phone.trim()) {
      // Normalize by last 9 digits to avoid +359/0 duplicates
      const digits = phone.replace(/\D/g, '')
      const last9 = digits.slice(-9)
      const existingUser = await db.query('SELECT * FROM users WHERE right(regexp_replace(coalesce(phone, \'\'), \n\t\t\'[^0-9]\', \'\', \'g\'), 9) = $1', [last9])
      if (existingUser.rows.length > 0) {
        db.release()
        return NextResponse.json(
          { error: 'User with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    const result = await db.query(`
      INSERT INTO users (name, email, phone, address, notes, createdat)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [name, email || null, phone && phone.trim() ? phone.trim() : null, address || null, notes || null])

    const newUser = result.rows[0]
    db.release()
    
    // Emit WebSocket event
    emitUserAdded(newUser)
    
    return NextResponse.json({
      message: 'User created successfully',
      userId: newUser.id
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
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, name, email, phone, address, notes } = body

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      )
    }

    // Phone е optional за admin потребители
    // if (!phone) {
    //   return NextResponse.json(
    //     { error: 'Phone is required' },
    //     { status: 400 }
    //   )
    // }

    const db = await getDatabase()
    
    // Check if phone is already used by another user (only if phone is provided)
    if (phone && phone.trim()) {
      const digits = phone.replace(/\D/g, '')
      const last9 = digits.slice(-9)
      const existingUser = await db.query('SELECT * FROM users WHERE right(regexp_replace(coalesce(phone, \'\'), \'[^0-9]\', \'\', \'g\'), 9) = $1 AND id != $2', [last9, id])
      if (existingUser.rows.length > 0) {
        db.release()
        return NextResponse.json(
          { error: 'Phone number is already used by another user' },
          { status: 409 }
        )
      }
    }

    const result = await db.query(`
      UPDATE users 
      SET name = $1, email = $2, phone = $3, address = $4, notes = $5, updatedat = NOW()
      WHERE id = $6
      RETURNING *
    `, [name, email || null, phone && phone.trim() ? phone.trim() : null, address || null, notes || null, id])

    const updatedUser = result.rows[0]
    db.release()
    
    // Emit WebSocket event
    emitUserUpdate(updatedUser)
    
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
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if user has any bookings
    const bookings = await db.query('SELECT COUNT(*) as count FROM bookings WHERE phone = (SELECT phone FROM users WHERE id = $1)', [id])
    if (parseInt(bookings.rows[0].count) > 0) {
      db.release()
              return NextResponse.json(
          { error: 'Не може да се изтрие потребител със съществуващи резервации' },
          { status: 400 }
        )
    }

    await db.query('DELETE FROM users WHERE id = $1', [id])

    db.release()
    
    // Emit WebSocket event
    emitUserDeleted(id)
    
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