import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const faviconPath = path.join(process.cwd(), 'favicon-32x32.png')
    
    if (!fs.existsSync(faviconPath)) {
      return new NextResponse('Favicon 32x32 not found', { status: 404 })
    }
    
    const faviconBuffer = fs.readFileSync(faviconPath)
    
    return new NextResponse(faviconBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving favicon 32x32:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
