import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const adminToken = request.headers.get('x-admin-token')

    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { enabled, message, showOnMainPage, showOnAdminPage } = body

    // Validate required fields
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled field is required and must be boolean' }, { status: 400 })
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'message field is required and must be non-empty string' }, { status: 400 })
    }

    if (typeof showOnMainPage !== 'boolean') {
      return NextResponse.json({ error: 'showOnMainPage field is required and must be boolean' }, { status: 400 })
    }

    if (typeof showOnAdminPage !== 'boolean') {
      return NextResponse.json({ error: 'showOnAdminPage field is required and must be boolean' }, { status: 400 })
    }

    // Save to database (for now, just return success - localStorage handles the actual storage)
    // In the future, this could save to a database table
    
    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('under-construction-updated', {
        enabled,
        message: message.trim(),
        showOnMainPage,
        showOnAdminPage
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Under Construction settings updated successfully',
      config: {
        enabled,
        message: message.trim(),
        showOnMainPage,
        showOnAdminPage
      }
    })

  } catch (error) {
    console.error('Error updating Under Construction settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const adminToken = request.headers.get('x-admin-token')

    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return default config
    // In the future, this could load from database
    return NextResponse.json({
      enabled: false,
      message: 'Сайтът е в процес на изграждане. Моля, извикайте за резервация.',
      showOnMainPage: true,
      showOnAdminPage: false
    })

  } catch (error) {
    console.error('Error getting Under Construction settings:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
