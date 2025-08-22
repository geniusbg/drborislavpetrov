import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

// Проверка на admin token
function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === 'mock-token'
}

// DELETE - Изтриване на backup файл
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const fileName = decodeURIComponent(resolvedParams.fileName)
    const filePath = path.join(BACKUP_DIR, fileName)

    // Проверка дали файлът съществува
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Проверка дали файлът е в backup директорията (security)
    const realPath = fs.realpathSync(filePath)
    const backupDirReal = fs.realpathSync(BACKUP_DIR)
    
    if (!realPath.startsWith(backupDirReal)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Изтриване на файла
    fs.unlinkSync(filePath)

    return NextResponse.json({
      success: true,
      message: `Backup file ${fileName} deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Failed to delete backup' },
      { status: 500 }
    )
  }
} 