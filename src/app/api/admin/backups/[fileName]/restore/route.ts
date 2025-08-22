import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// Проверка на admin token
function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === 'mock-token'
}

// POST - Възстановяване от backup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const fileName = decodeURIComponent(resolvedParams.fileName)
    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, fileName)

    // Проверка дали файлът съществува
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Backup file not found' },
        { status: 404 }
      )
    }

    // Проверка дали файлът е в backup директорията (security)
    const realPath = fs.realpathSync(filePath)
    const backupDirReal = fs.realpathSync(backupDir)
    
    if (!realPath.startsWith(backupDirReal)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      )
    }

    // Изпълняване на restore скрипта
    const restoreScript = path.join(process.cwd(), 'restore-database-node.js')
    
    if (!fs.existsSync(restoreScript)) {
      return NextResponse.json(
        { error: 'Restore script not found' },
        { status: 404 }
      )
    }

    const { stdout, stderr } = await execAsync(`node "${restoreScript}" "${fileName}"`)
    
    if (stderr) {
      console.warn('Restore warnings:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Database restored successfully',
      output: stdout
    })
  } catch (error) {
    console.error('Error restoring backup:', error)
    return NextResponse.json(
      { error: 'Failed to restore backup' },
      { status: 500 }
    )
  }
} 