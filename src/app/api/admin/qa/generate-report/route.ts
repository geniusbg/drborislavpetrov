import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

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

    console.log('Generating QA report...')
    
    try {
      // Run the QA automated test to generate a report
      console.log('Starting QA automated test...')
      const { stdout, stderr } = await execAsync(`node QA_AUTOMATED_TEST.js`, {
        timeout: 120000 // 2 minutes timeout
      })
      
      console.log('QA test completed')
      console.log('stdout length:', stdout?.length || 0)
      console.log('stderr length:', stderr?.length || 0)
      
      console.log('QA test output:', stdout)
      if (stderr) {
        console.error('QA test stderr:', stderr)
      }
      
      // Check if qa_report.json was created
      const reportPath = path.join(process.cwd(), 'qa_report.json')
      let reportData = null
      
      if (fs.existsSync(reportPath)) {
        try {
          const reportContent = fs.readFileSync(reportPath, 'utf8')
          reportData = JSON.parse(reportContent)
        } catch (parseError) {
          console.error('Error parsing QA report:', parseError)
        }
      }
      
      // Create a summary report
      const success = !stderr || stderr.length === 0
      const timestamp = new Date().toISOString()
      
      const summaryReport = {
        timestamp,
        totalTests: reportData?.summary?.total || 0,
        passedTests: reportData?.summary?.passed || 0,
        failedTests: reportData?.summary?.failed || 0,
        details: reportData?.results || [],
        success,
        output: stdout,
        error: stderr || null
      }
      
      // Save the report data if it exists
      if (reportData) {
        // Save with timestamp for history
        const timestamp = new Date().toISOString()
        const reportFileName = `qa_report_${timestamp.replace(/[:.]/g, '-')}.json`
        const historicalReportPath = path.join(process.cwd(), reportFileName)
        
        // Save historical report
        fs.writeFileSync(historicalReportPath, JSON.stringify(reportData, null, 2))
        
        // Also save as latest report for backward compatibility
        const latestReportPath = path.join(process.cwd(), 'qa_report.json')
        fs.writeFileSync(latestReportPath, JSON.stringify(reportData, null, 2))
        
        console.log(`Report saved as: ${reportFileName}`)
      }
      
      return NextResponse.json({
        success: true,
        report: summaryReport,
        message: 'QA report generated successfully'
      })
      
    } catch (execError: unknown) {
      console.error('QA report generation error:', execError)
      
      return NextResponse.json({
        success: false,
        error: (execError as Error).message,
        message: 'Failed to generate QA report'
      })
    }
    
  } catch (error) {
    console.error('Error generating QA report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 