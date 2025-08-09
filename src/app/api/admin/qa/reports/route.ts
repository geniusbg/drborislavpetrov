import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const reports: Array<{ 
      timestamp: string; 
      summary?: { total?: number; passed?: number; failed?: number }; 
      results?: unknown[]; 
      id?: number; 
      type?: string; 
      fileName?: string;
      totalTests?: number;
      passedTests?: number;
      failedTests?: number;
      details?: unknown[];
    }> = []
    
    // Read all QA report files (historical reports with timestamps)
    const reportFiles = fs.readdirSync(process.cwd())
      .filter(file => file.startsWith('qa_report_') && file.endsWith('.json'))
      .sort() // Sort by filename (which includes timestamp)
    
    // Read historical reports first
    for (const fileName of reportFiles) {
      try {
        const reportPath = path.join(process.cwd(), fileName)
        const reportContent = fs.readFileSync(reportPath, 'utf8')
        const reportData = JSON.parse(reportContent)
        reports.push({
          timestamp: reportData.timestamp || new Date().toISOString(),
          totalTests: reportData.summary?.total || 0,
          passedTests: reportData.summary?.passed || 0,
          failedTests: reportData.summary?.failed || 0,
          details: reportData.results || [],
          type: 'historical_report',
          fileName: fileName
        })
      } catch (error) {
        console.error(`Error reading ${fileName}:`, error)
      }
    }
    
    // Add latest report if it exists and is different from historical reports
    const latestReportPath = path.join(process.cwd(), 'qa_report.json')
    if (fs.existsSync(latestReportPath)) {
      try {
        const reportContent = fs.readFileSync(latestReportPath, 'utf8')
        const reportData = JSON.parse(reportContent)
        
        // Check if this latest report is already in historical reports
        const latestTimestamp = reportData.timestamp
        const isDuplicate = reports.some(report => report.timestamp === latestTimestamp)
        
        if (!isDuplicate) {
          reports.push({
            timestamp: reportData.timestamp || new Date().toISOString(),
            totalTests: reportData.summary?.total || 0,
            passedTests: reportData.summary?.passed || 0,
            failedTests: reportData.summary?.failed || 0,
            details: reportData.results || [],
            type: 'latest_report'
          })
        }
      } catch (error) {
        console.error('Error reading qa_report.json:', error)
      }
    }
    
    // Only use qa_report.json - summary report is redundant
    // Check for qa_summary_report.json (for backward compatibility)
    const summaryReportPath = path.join(process.cwd(), 'qa_summary_report.json')
    if (fs.existsSync(summaryReportPath)) {
      try {
        // Delete old summary report to avoid duplicates
        fs.unlinkSync(summaryReportPath)
        console.log('Deleted old qa_summary_report.json to avoid duplicates')
      } catch (error) {
        console.error('Error deleting old summary report:', error)
      }
    }
    
    // Sort reports by timestamp (newest first) and add index
    reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // Add index to each report for proper numbering
    reports.forEach((report, index) => {
      report.id = index + 1
    })
    
    return NextResponse.json({
      reports,
      count: reports.length
    })
    
  } catch (error) {
    console.error('Error loading QA reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 