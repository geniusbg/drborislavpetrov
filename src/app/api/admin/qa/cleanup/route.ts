import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const filePath = path.join(process.cwd(), 'CLEANUP_TEST_DATA.js')
    
    console.log('Running test data cleanup...')
    
    try {
      const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
        timeout: 30000 // 30 seconds timeout
      })
      
      console.log('Cleanup output:', stdout)
      if (stderr) {
        console.error('Cleanup stderr:', stderr)
      }
      
      // Check if the cleanup was successful (basic check)
      const success = !stderr || stderr.length === 0
      
      return NextResponse.json({
        success,
        output: stdout,
        error: stderr || null,
        message: success ? 'Test data cleaned up successfully' : 'Cleanup failed'
      })
      
    } catch (execError: unknown) {
      console.error('Cleanup execution error:', execError)
      
      return NextResponse.json({
        success: false,
        error: (execError as Error).message,
        message: 'Cleanup failed to execute'
      })
    }
    
  } catch (error) {
    console.error('Error running cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 