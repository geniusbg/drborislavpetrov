import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import bcrypt from 'bcrypt'

export async function GET(request: NextRequest) {
  try {
    // Authentication is handled by middleware

    const db = await getDatabase()
    const result = await db.query(`
      SELECT id, username, email, full_name, is_active, created_at, last_login, created_by
      FROM admins
      ORDER BY created_at DESC
    `)
    
    db.release()
    return NextResponse.json({ admins: result.rows })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication is handled by middleware

    const body = await request.json()
    const { username, password, email, fullName } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Validate username format
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 50 characters' },
        { status: 400 }
      )
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    if (password.length > 200) {
      return NextResponse.json(
        { error: 'Password is too long' },
        { status: 400 }
      )
    }

    // Check password complexity (at least one letter and one number)
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one letter and one number' },
        { status: 400 }
      )
    }

    // Validate username uniqueness
    const db = await getDatabase()
    const existing = await db.query(
      'SELECT id FROM admins WHERE username = $1',
      [username]
    )

    if (existing.rows.length > 0) {
      db.release()
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create admin
    const result = await db.query(`
      INSERT INTO admins (username, password_hash, email, full_name, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, is_active, created_at
    `, [username, passwordHash, email || null, fullName || null, auth.adminId || null])

    const newAdmin = result.rows[0]
    db.release()

    return NextResponse.json({
      message: 'Admin created successfully',
      admin: newAdmin
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authentication is handled by middleware

    const body = await request.json()
    const { id, username, password, email, fullName, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check if admin exists
    const existing = await db.query('SELECT id FROM admins WHERE id = $1', [id])
    if (existing.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Check username uniqueness if username is being changed
    if (username) {
      const usernameCheck = await db.query(
        'SELECT id FROM admins WHERE username = $1 AND id != $2',
        [username, id]
      )
      if (usernameCheck.rows.length > 0) {
        db.release()
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        )
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: (string | number | boolean | null)[] = []
    let paramIndex = 1

    if (username) {
      updates.push(`username = $${paramIndex++}`)
      values.push(username)
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email || null)
    }
    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`)
      values.push(fullName || null)
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`)
      values.push(isActive)
    }
    if (password) {
      // Validate password strength when updating
      if (typeof password !== 'string' || password.length < 8) {
        db.release()
        return NextResponse.json(
          { error: 'Password must be at least 8 characters long' },
          { status: 400 }
        )
      }

      if (password.length > 200) {
        db.release()
        return NextResponse.json(
          { error: 'Password is too long' },
          { status: 400 }
        )
      }

      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        db.release()
        return NextResponse.json(
          { error: 'Password must contain at least one letter and one number' },
          { status: 400 }
        )
      }

      const passwordHash = await bcrypt.hash(password, 10)
      updates.push(`password_hash = $${paramIndex++}`)
      values.push(passwordHash)
    }

    if (updates.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    values.push(id)
    const query = `
      UPDATE admins
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, is_active, created_at, last_login
    `

    const result = await db.query(query, values)
    db.release()

    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: result.rows[0]
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication is handled by middleware

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const adminId = parseInt(id)
    
    // Prevent deleting yourself
    if (auth.adminId === adminId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Check if admin exists
    const existing = await db.query('SELECT id FROM admins WHERE id = $1', [adminId])
    if (existing.rows.length === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Delete admin
    await db.query('DELETE FROM admins WHERE id = $1', [adminId])
    db.release()

    return NextResponse.json({
      message: 'Admin deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

