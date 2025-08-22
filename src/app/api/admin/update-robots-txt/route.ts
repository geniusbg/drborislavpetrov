import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    // Проверка на admin token
    const adminToken = request.headers.get('x-admin-token')
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 })
    }

    // Път до robots.txt файла
    const robotsPath = join(process.cwd(), 'public', 'robots.txt')
    
    // Записване на новото съдържание
    await writeFile(robotsPath, content, 'utf-8')
    
    return NextResponse.json({ 
      success: true, 
      message: 'robots.txt е обновен успешно',
      content: content
    })
    
  } catch (error) {
    console.error('Error updating robots.txt:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

