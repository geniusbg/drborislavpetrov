import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

// Конфигурация
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const CONFIG_FILE = path.join(process.cwd(), 'backup-config.json')

// Зареждане на конфигурацията
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(configData)
    }
  } catch (error) {
    console.error('Error loading config:', error)
  }
  
  // Default конфигурация
  return {
    retentionDays: 5,
    backupInterval: 1,
    backupFormat: 'json',
    backupLocation: './backups/',
    autoBackup: true,
    compression: false
  }
}

// Изчистване на стари backup файлове
async function cleanupOldBackups() {
  try {
    const config = loadConfig()
    const retentionDays = config.retentionDays || 5
    
    if (!fs.existsSync(BACKUP_DIR)) {
      return
    }

    const files = fs.readdirSync(BACKUP_DIR)
    const now = Date.now()
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(BACKUP_DIR, file)
        const stats = fs.statSync(filePath)
        const age = now - stats.mtime.getTime()

        if (age > retentionMs) {
          fs.unlinkSync(filePath)
          console.log(`🗑️ Deleted old backup: ${file}`)
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error)
  }
}

// POST - Автоматичен backup
export async function POST(request: NextRequest) {
  try {
    // Проверка на admin token (опционално за автоматични backup-ове)
    const adminToken = request.headers.get('x-admin-token')
    const isAuthorized = adminToken === 'mock-token' || adminToken === 'auto-backup-token'
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting automatic backup...')
    console.log('⏰ Time:', new Date().toISOString())

    // Изчистване на стари backup файлове
    await cleanupOldBackups()

    // Изпълняване на backup скрипта
    const backupScript = path.join(process.cwd(), 'backup-database-node.js')
    
    if (!fs.existsSync(backupScript)) {
      console.error('❌ Backup script not found:', backupScript)
      return NextResponse.json(
        { error: 'Backup script not found' },
        { status: 404 }
      )
    }

    const { stdout, stderr } = await execAsync(`node "${backupScript}"`)
    
    if (stderr) {
      console.warn('⚠️ Backup warnings:', stderr)
    }

    console.log('✅ Automatic backup completed successfully')
    console.log('📄 Output:', stdout)

    return NextResponse.json({
      success: true,
      message: 'Automatic backup completed successfully',
      timestamp: new Date().toISOString(),
      output: stdout
    })
  } catch (error) {
    console.error('❌ Error during automatic backup:', error)
    return NextResponse.json(
      { error: 'Failed to create automatic backup' },
      { status: 500 }
    )
  }
}

// GET - Проверка на статуса на автоматичния backup
export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    if (adminToken !== 'mock-token') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = loadConfig()
    const backupScript = path.join(process.cwd(), 'backup-database-node.js')
    const scriptExists = fs.existsSync(backupScript)
    const backupDirExists = fs.existsSync(BACKUP_DIR)

    return NextResponse.json({
      autoBackup: config.autoBackup,
      backupInterval: config.backupInterval,
      retentionDays: config.retentionDays,
      scriptExists,
      backupDirExists,
      lastCheck: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error checking auto backup status:', error)
    return NextResponse.json(
      { error: 'Failed to check auto backup status' },
      { status: 500 }
    )
  }
} 