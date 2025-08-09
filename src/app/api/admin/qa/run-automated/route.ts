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

    const filePath = path.join(process.cwd(), 'QA_AUTOMATED_TEST.js')
    
    console.log('Running automated QA test...')
    
    try {
      const { stdout, stderr } = await execAsync(`node "${filePath}"`, {
        timeout: 120000 // 2 minutes timeout for automated test
      })
      
      console.log('Automated test output:', stdout)
      if (stderr) {
        console.error('Automated test stderr:', stderr)
      }
      
      // Check if the test was successful (basic check)
      const success = !stderr || stderr.length === 0
      
      return NextResponse.json({
        success,
        output: stdout,
        error: stderr || null,
        message: success ? 'Automated test completed successfully' : 'Automated test failed'
      })
      
    } catch (execError: unknown) {
      console.error('Automated test execution error:', execError)
      
      return NextResponse.json({
        success: false,
        error: (execError as Error).message,
        message: 'Automated test failed to execute'
      })
    }
    
  } catch (error) {
    console.error('Error running automated test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 