import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Конфигурационен файл
const CONFIG_FILE = path.join(process.cwd(), 'backup-config.json')

// Проверка на admin token
function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === 'mock-token'
}

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

// Запазване на конфигурацията
type BackupFormat = 'json' | 'sql'
interface BackupConfigSchema {
  retentionDays: number
  backupInterval: number
  backupFormat: BackupFormat
  backupLocation: string
  autoBackup: boolean
  compression: boolean
}

function saveConfig(config: BackupConfigSchema) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}

// GET - Вземане на конфигурацията
export async function GET(request: NextRequest) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = loadConfig()
    
    return NextResponse.json({
      config
    })
  } catch (error) {
    console.error('Error getting config:', error)
    return NextResponse.json(
      { error: 'Failed to get config' },
      { status: 500 }
    )
  }
}

// POST - Запазване на конфигурацията
export async function POST(request: NextRequest) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    // Валидация на конфигурацията (очаква директно полета, не вложен обект)
    const config: BackupConfigSchema = {
      retentionDays: Math.max(1, Math.min(365, Number(body.retentionDays ?? 5))),
      backupInterval: Math.max(1, Math.min(24, Number(body.backupInterval ?? 1))),
      backupFormat: (body.backupFormat === 'sql' ? 'sql' : 'json') as BackupFormat,
      backupLocation: String(body.backupLocation ?? './backups/'),
      autoBackup: Boolean(body.autoBackup),
      compression: Boolean(body.compression)
    }

    // Запазване на конфигурацията
    const success = saveConfig(config)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save config' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      config
    })
  } catch (error) {
    console.error('Error saving config:', error)
    return NextResponse.json(
      { error: 'Failed to save config' },
      { status: 500 }
    )
  }
} 