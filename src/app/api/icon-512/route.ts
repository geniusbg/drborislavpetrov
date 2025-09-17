import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'icon-512.png')
    
    if (!fs.existsSync(iconPath)) {
      return new NextResponse('Icon 512 not found', { status: 404 })
    }
    
    const iconBuffer = fs.readFileSync(iconPath)
    
    return new NextResponse(iconBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving icon 512:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
