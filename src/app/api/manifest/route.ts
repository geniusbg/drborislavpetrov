import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'manifest.json')
    
    if (!fs.existsSync(manifestPath)) {
      return new NextResponse('Manifest not found', { status: 404 })
    }
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    console.error('Error serving manifest:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
