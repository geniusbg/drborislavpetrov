import { NextRequest, NextResponse } from 'next/server'
import { getDatabase, getPoolStatus, logDatabaseError } from '@/lib/database'

// Validation function for bug data
type Severity = 'low' | 'medium' | 'high' | 'critical'
type Category = 'ui' | 'functionality' | 'performance' | 'security' | 'database'
type Priority = 'low' | 'medium' | 'high' | 'urgent'
interface BugInput {
  title: string
  description: string
  reporter: string
  severity?: Severity
  category?: Category
  priority?: Priority
  steps_to_reproduce?: string[]
  tags?: string[]
}

function validateBugData(data: BugInput): { isValid: boolean; error?: string } {
  const validSeverities = ['low', 'medium', 'high', 'critical']
  const validCategories = ['ui', 'functionality', 'performance', 'security', 'database']
  const validPriorities = ['low', 'medium', 'high', 'urgent']
  
  // Required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    return { isValid: false, error: 'Title is required and must be a non-empty string' }
  }
  
  if (!data.description || typeof data.description !== 'string') {
    return { isValid: false, error: 'Description is required and must be a string' }
  }
  
  if (!data.reporter || typeof data.reporter !== 'string' || data.reporter.trim().length === 0) {
    return { isValid: false, error: 'Reporter is required and must be a non-empty string' }
  }
  
  // Severity validation
  if (data.severity && !validSeverities.includes(data.severity)) {
    return { isValid: false, error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` }
  }
  
  // Category validation
  if (data.category && !validCategories.includes(data.category)) {
    return { isValid: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` }
  }
  
  // Priority validation
  if (data.priority && !validPriorities.includes(data.priority)) {
    return { isValid: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` }
  }
  
  // Array fields validation
  if (data.steps_to_reproduce && !Array.isArray(data.steps_to_reproduce)) {
    return { isValid: false, error: 'steps_to_reproduce must be an array' }
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    return { isValid: false, error: 'tags must be an array' }
  }
  
  return { isValid: true }
}

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')
    
    const db = await getDatabase()
    
    let query = 'SELECT * FROM bug_reports'
    const params: unknown[] = []
    const whereConditions: string[] = []
    
    if (status) {
      whereConditions.push(`status = $${params.length + 1}`)
      params.push(status)
    }
    
    if (category) {
      whereConditions.push(`category = $${params.length + 1}`)
      params.push(category)
    }
    
    if (severity) {
      whereConditions.push(`severity = $${params.length + 1}`)
      params.push(severity)
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }
    
    query += ' ORDER BY created_at DESC'
    
    const result = await db.query(query, params)
    db.release()
    
    return NextResponse.json({ bugs: result.rows })
  } catch (error) {
    console.error('Error fetching bugs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let db: import('pg').PoolClient | null = null
  try {
    console.log('🔍 POST /api/admin/bugs called')
    
    // Log pool status before operation
    const poolStatus = getPoolStatus()
    console.log('🔍 Database pool status:', poolStatus)
    
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('🔍 Request body:', body)
    
    // Validate input data
    const validationResult = validateBugData(body)
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    const {
      title,
      description,
      severity,
      category,
      priority,
      reporter,
      steps_to_reproduce,
      expected_behavior,
      actual_behavior,
      browser,
      device,
      tags,
      resolution
    } = body

    console.log('🔍 About to insert bug with values:', {
      title, description: description || '', severity, category, priority, reporter,
      steps_to_reproduce: steps_to_reproduce || [], 
      expected_behavior, actual_behavior, browser, device, tags: tags || [], resolution
    })
    
    db = await getDatabase()
    
    // Test database connection first
    try {
      const testResult = await db.query('SELECT 1 as test')
      console.log('🔍 Database connection test:', testResult.rows[0])
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError)
      throw dbError
    }
    
    const result = await db.query(`
      INSERT INTO bug_reports (
        title, description, severity, category, priority, reporter,
        steps_to_reproduce, expected_behavior, actual_behavior,
        browser, device, tags, resolution
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, description || '', severity, category, priority, reporter || 'admin',
      steps_to_reproduce || [], expected_behavior, actual_behavior,
      browser, device, tags || [], resolution
    ])

    console.log('🔍 Bug inserted successfully:', result.rows[0])
    return NextResponse.json({ 
      success: true, 
      bug: result.rows[0] 
    })
  } catch (error) {
    logDatabaseError(error, 'POST /api/admin/bugs')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Always release the database connection
    if (db) {
      try {
        db.release()
        console.log('🔍 Database connection released')
      } catch (releaseError) {
        console.error('❌ Error releasing database connection:', releaseError)
      }
    }
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
    const {
      id,
      title,
      description,
      severity,
      status,
      category,
      priority,
      assignedTo,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      browser,
      device,
      tags,
      resolution
    } = body

    const db = await getDatabase()
    const result = await db.query(`
      UPDATE bug_reports 
      SET title = $1, description = $2, severity = $3, status = $4,
          category = $5, priority = $6, assigned_to = $7,
          steps_to_reproduce = $8, expected_behavior = $9, actual_behavior = $10,
          browser = $11, device = $12, tags = $13, resolution = $14, updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `, [
      title, description, severity, status, category, priority, assignedTo,
      stepsToReproduce, expectedBehavior, actualBehavior, browser, device, tags, resolution, id
    ])
    
    if (result.rowCount === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      )
    }

    db.release()
    return NextResponse.json({ 
      success: true, 
      bug: result.rows[0] 
    })
  } catch (error) {
    console.error('Error updating bug report:', error)
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
        { error: 'Bug ID is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const result = await db.query('DELETE FROM bug_reports WHERE id = $1', [id])
    
    if (result.rowCount === 0) {
      db.release()
      return NextResponse.json(
        { error: 'Bug report not found' },
        { status: 404 }
      )
    }

    db.release()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bug report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 