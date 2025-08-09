import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// Конфигурация
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const RETENTION_DAYS = 5

// Проверка на admin token
function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === 'mock-token' // В продукция трябва да се проверява реалният token
}

// Вземане на backup файлове
async function getBackupFiles() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return []
  }

  const files = fs.readdirSync(BACKUP_DIR)
  const backupFiles = files.filter(file => file.endsWith('.json'))
  
  return backupFiles.map(file => {
    const filePath = path.join(BACKUP_DIR, file)
    const stats = fs.statSync(filePath)
    const age = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      name: file,
      size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
      date: stats.mtime.toLocaleString('bg-BG'),
      age: `${age} дни`
    }
  }).sort((a, b) => {
    // Sort by modification time (newest first)
    const aPath = path.join(BACKUP_DIR, a.name)
    const bPath = path.join(BACKUP_DIR, b.name)
    const aStats = fs.statSync(aPath)
    const bStats = fs.statSync(bPath)
    return bStats.mtime.getTime() - aStats.mtime.getTime()
  })
}

// Вземане на backup статистики
async function getBackupStats() {
  const files = await getBackupFiles()
  
  if (files.length === 0) {
    return {
      totalBackups: 0,
      totalSize: '0 MB',
      oldestBackup: 'Няма',
      newestBackup: 'Няма',
      retentionDays: RETENTION_DAYS
    }
  }

  const totalSize = files.reduce((sum, file) => {
    const sizeInMB = parseFloat(file.size.replace(' MB', ''))
    return sum + sizeInMB
  }, 0)

  return {
    totalBackups: files.length,
    totalSize: `${totalSize.toFixed(2)} MB`,
    oldestBackup: files[files.length - 1]?.date || 'Няма',
    newestBackup: files[0]?.date || 'Няма',
    retentionDays: RETENTION_DAYS
  }
}

// GET - Вземане на backup файлове и статистики
export async function GET(request: NextRequest) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const backups = await getBackupFiles()
    const stats = await getBackupStats()

    return NextResponse.json({
      backups,
      stats
    })
  } catch (error) {
    console.error('Error getting backups:', error)
    return NextResponse.json(
      { error: 'Failed to get backups' },
      { status: 500 }
    )
  }
}

// POST - Създаване на ръчен backup
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Изпълняване на backup скрипта
    const backupScript = path.join(process.cwd(), 'backup-database-node.js')
    
    if (!fs.existsSync(backupScript)) {
      return NextResponse.json(
        { error: 'Backup script not found' },
        { status: 404 }
      )
    }

    const { stdout, stderr } = await execAsync(`node "${backupScript}"`)
    
    if (stderr) {
      console.warn('Backup warnings:', stderr)
    }

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      output: stdout
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    )
  }
} 