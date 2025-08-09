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

    const db = await getDatabase()
    const result = await db.query(`
      SELECT * FROM support_notes 
      ORDER BY created_at DESC
    `)
    
    db.release()
    
    return NextResponse.json({
      notes: result.rows
    })
    
  } catch (error) {
    console.error('Error loading support notes:', error)
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

    const { title, description, type, priority } = await request.json()
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const result = await db.query(`
      INSERT INTO support_notes (title, description, type, priority, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [title, description, type, priority, 'open', 'Super Admin'])
    
    db.release()
    
    return NextResponse.json({
      note: result.rows[0],
      message: 'Support note created successfully'
    })
    
  } catch (error) {
    console.error('Error creating support note:', error)
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

    const { id, title, description, type, priority, status } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    if (status) {
      // Update only status
      const result = await db.query(`
        UPDATE support_notes 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, id])
      
      db.release()
      
      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: 'Support note not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        note: result.rows[0],
        message: 'Status updated successfully'
      })
    } else {
      // Update full note
      const result = await db.query(`
        UPDATE support_notes 
        SET title = $1, description = $2, type = $3, priority = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `, [title, description, type, priority, id])
      
      db.release()
      
      if (result.rowCount === 0) {
        return NextResponse.json(
          { error: 'Support note not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        note: result.rows[0],
        message: 'Support note updated successfully'
      })
    }
    
  } catch (error) {
    console.error('Error updating support note:', error)
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
        { error: 'Note ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const result = await db.query('DELETE FROM support_notes WHERE id = $1', [id])
    
    db.release()
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Support note not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Support note deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting support note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 