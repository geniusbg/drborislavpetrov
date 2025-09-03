import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { getDatabase } from '@/lib/database'

type BackupFormat = 'json' | 'sql'

const CONFIG_FILE = path.join(process.cwd(), 'backup-config.json')

function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  const validTokens = process.env.ADMIN_TOKENS?.split(',') || []
  
  if (!adminToken) {
    console.log('❌ No admin token provided')
    return false
  }
  
  const isValid = validTokens.includes(adminToken.trim())
  if (!isValid) {
    console.log('❌ Invalid admin token provided')
  }
  
  return isValid
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Backup loadConfig error:', e)
  }
  return {
    retentionDays: 5,
    backupInterval: 1,
    backupFormat: 'json' as BackupFormat, // Default to JSON for local development
    backupLocation: './backups/',
    autoBackup: true,
    compression: false,
  }
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function humanAge(from: Date) {
  const diffMs = Date.now() - from.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins} мин`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ч`
  const days = Math.floor(hours / 24)
  return `${days} дни`
}

// JavaScript backup function (fallback when pg_dump is not available)
async function createJavaScriptBackup(filePath: string) {
  console.log('🔧 Starting JavaScript backup...')
  
  const db = await getDatabase()
  
  try {
    console.log('🔌 Connected to database, getting table names...')
    // Get all table names
    const tablesResult = await db.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `)
    
    const tables = tablesResult.rows.map((row: { tablename: string }) => row.tablename)
    const backupData: {
      timestamp: string
      database: string
      tables: Record<string, { columns: Array<{ name: string; type: number }>; rows: unknown[] } | { error: string }>
    } = {
      timestamp: new Date().toISOString(),
      database: 'drborislavpetrov', // Will be replaced with actual DB name
      tables: {}
    }

    // Backup each table
    for (const table of tables) {
      try {
        const dataResult = await db.query(`SELECT * FROM "${table}"`)
        backupData.tables[table] = {
          columns: dataResult.fields.map((field: { name: string; dataTypeID: number }) => ({
            name: field.name,
            type: field.dataTypeID
          })),
          rows: dataResult.rows
        }
      } catch (error) {
        console.error(`Error backing up table ${table}:`, error)
        backupData.tables[table] = { error: 'Failed to backup table' }
      }
    }

    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2))
    return true
  } finally {
    db.release()
  }
}

// Automatic backup function
async function performAutomaticBackup() {
  try {
    console.log('🤖 Starting automatic backup...')
    
    const cfg = loadConfig()
    if (!cfg.autoBackup) {
      console.log('⚠️ Automatic backup is disabled in config')
      return { success: false, error: 'Automatic backup is disabled' }
    }
    
    const dir = path.isAbsolute(cfg.backupLocation)
      ? cfg.backupLocation
      : path.join(process.cwd(), cfg.backupLocation)
    ensureDir(dir)

    // Database connection configuration for backup
    const host = process.env.DB_HOST
    const port = process.env.DB_PORT || '5432'
    const db = process.env.DB_NAME
    const user = process.env.DB_USER
    const pass = process.env.DB_PASSWORD

    if (!host || !db || !user || !pass) {
      console.error('❌ Missing database environment variables for automatic backup')
      return { success: false, error: 'Missing database environment variables' }
    }

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    
    const ext = 'json'
    const filePath = path.join(dir, `auto-backup-${stamp}.${ext}`)

    let backupMethod = 'unknown'
    let errorDetails = ''

    // Check operating system and use appropriate backup method
    const isWindows = process.platform === 'win32'
    
    if (isWindows) {
      // Windows: Use JavaScript backup directly (pg_dump not available)
      console.log('🔄 Windows detected, using JavaScript backup...')
      try {
        await createJavaScriptBackup(filePath)
        backupMethod = 'javascript'
        console.log('✅ Automatic JavaScript backup successful on Windows')
      } catch (jsBackupError) {
        errorDetails = `JavaScript backup failed on Windows: ${jsBackupError instanceof Error ? jsBackupError.message : String(jsBackupError)}`
        console.error('❌ JavaScript backup failed:', errorDetails)
        return { success: false, error: errorDetails }
      }
    } else {
      // Linux/Mac: Try pg_dump first, fallback to JavaScript
      try {
        console.log('🔄 Linux/Mac detected, attempting automatic pg_dump backup...')
        await new Promise<void>((resolve, reject) => {
          const child = spawn('pg_dump', ['-h', host, '-p', String(port), '-U', user, '-F', 'c', '-b', '-v', '-f', filePath, db], {
            env: { ...process.env, PGPASSWORD: pass },
          })
          
          let stderrBuf = ''
          child.stdout?.on('data', (d) => {
            process.stdout.write(d)
          })
          child.stderr?.on('data', (d) => {
            const s = d.toString()
            stderrBuf += s
            process.stderr.write(d)
          })
          child.on('close', (code) => {
            if (code === 0) resolve()
            else reject(new Error(`pg_dump exited with code ${code}`))
          })
          child.on('error', (error) => {
            errorDetails = `pg_dump spawn error: ${error.message}`
            reject(error)
          })
        })
        backupMethod = 'pg_dump'
        console.log('✅ Automatic pg_dump backup successful')
      } catch (pgDumpError) {
        console.log('❌ Automatic pg_dump failed, trying JavaScript backup...')
        errorDetails = pgDumpError instanceof Error ? pgDumpError.message : String(pgDumpError)
        
        // Fallback to JavaScript backup
        try {
          console.log('🔄 Attempting automatic JavaScript backup...')
          await createJavaScriptBackup(filePath)
          backupMethod = 'javascript'
          console.log('✅ Automatic JavaScript backup successful')
        } catch (jsBackupError) {
          errorDetails = `Automatic JavaScript backup also failed: ${jsBackupError instanceof Error ? jsBackupError.message : String(jsBackupError)}`
          console.error('❌ Both automatic backup methods failed:', errorDetails)
          return { success: false, error: errorDetails }
        }
      }
    }

    // Retention cleanup
    try {
      const cutoff = Date.now() - cfg.retentionDays * 24 * 60 * 60 * 1000
      const entries = fs.readdirSync(dir)
      for (const f of entries) {
        const full = path.join(dir, f)
        const st = fs.statSync(full)
        if (st.isFile() && st.mtime.getTime() < cutoff) {
          fs.unlinkSync(full)
          console.log(`🗑️ Deleted old automatic backup: ${f}`)
        }
      }
    } catch (cleanupError) {
      console.warn('⚠️ Automatic backup retention cleanup failed:', cleanupError)
    }

    console.log(`🎉 Automatic backup completed successfully using ${backupMethod}`)
    return { 
      success: true, 
      file: path.basename(filePath),
      method: backupMethod,
      timestamp: now.toISOString(),
      output: `Automatic backup completed using ${backupMethod}`
    }
  } catch (error) {
    console.error('❌ Error in automatic backup:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cfg = loadConfig()
    const dir = path.isAbsolute(cfg.backupLocation)
      ? cfg.backupLocation
      : path.join(process.cwd(), cfg.backupLocation)
    ensureDir(dir)

    const filesRaw = fs.readdirSync(dir)
      .filter((f) => fs.statSync(path.join(dir, f)).isFile())
      .map((f) => {
        const stat = fs.statSync(path.join(dir, f))
        return {
          name: f,
          size: formatBytes(stat.size),
          date: new Date(stat.mtime).toLocaleString('bg-BG'),
          age: humanAge(stat.mtime),
          mtime: stat.mtime.getTime(),
        }
      })
      .sort((a, b) => b.mtime - a.mtime)

    const files = filesRaw.map((file) => ({
      name: file.name,
      size: file.size,
      date: file.date,
      age: file.age,
    }))

    const stats = {
      totalBackups: files.length,
      totalSize: formatBytes(
        files.reduce((sum, f) => sum + fs.statSync(path.join(dir, f.name)).size, 0)
      ),
      oldestBackup: files[files.length - 1]?.date || '-',
      newestBackup: files[0]?.date || '-',
      retentionDays: cfg.retentionDays,
    }

    return NextResponse.json({ backups: files, stats })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting backup process...')
    
    if (!checkAdminToken(request)) {
      console.log('❌ Unauthorized backup attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin token validated')
    const cfg = loadConfig()
    console.log('📋 Backup config loaded:', cfg)
    
    const dir = path.isAbsolute(cfg.backupLocation)
      ? cfg.backupLocation
      : path.join(process.cwd(), cfg.backupLocation)
    console.log('📁 Backup directory:', dir)
    ensureDir(dir)

    // Database connection configuration for backup
    // Use same environment variables as the main database connection
    const host = process.env.DB_HOST
    const port = process.env.DB_PORT || '5432'
    const db = process.env.DB_NAME
    const user = process.env.DB_USER
    const pass = process.env.DB_PASSWORD

    if (!host || !db || !user || !pass) {
      console.error('❌ Missing database environment variables for backup')
      return NextResponse.json({
        error: 'Missing required database environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD'
      }, { status: 500 })
    }

    console.log('🔍 Backup connection details:', { host, port, db, user, pass: '***' })

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    
    // Always use JSON format for JavaScript backup (better for local development)
    const ext = 'json'
    const filePath = path.join(dir, `backup-${stamp}.${ext}`)

    let backupMethod = 'unknown'
    let errorDetails = ''

    // Try pg_dump first (for production Linux servers)
    try {
      console.log('🔄 Attempting pg_dump backup...')
      await new Promise<void>((resolve, reject) => {
        const child = spawn('pg_dump', ['-h', host, '-p', String(port), '-U', user, '-F', 'c', '-b', '-v', '-f', filePath, db], {
          env: { ...process.env, PGPASSWORD: pass },
        })
        
        let stderrBuf = ''
        child.stdout?.on('data', (d) => {
          process.stdout.write(d)
        })
        child.stderr?.on('data', (d) => {
          const s = d.toString()
          stderrBuf += s
          process.stderr.write(d)
        })
        child.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`pg_dump exited with code ${code}`))
        })
        child.on('error', (error) => {
          errorDetails = `pg_dump spawn error: ${error.message}`
          reject(error)
        })
      })
      backupMethod = 'pg_dump'
      console.log('✅ pg_dump backup successful')
    } catch (pgDumpError) {
      console.log('❌ pg_dump failed, trying JavaScript backup...')
      errorDetails = pgDumpError instanceof Error ? pgDumpError.message : String(pgDumpError)
      
      // Fallback to JavaScript backup
      try {
        console.log('🔄 Attempting JavaScript backup...')
        await createJavaScriptBackup(filePath)
        backupMethod = 'javascript'
        console.log('✅ JavaScript backup successful')
      } catch (jsBackupError) {
        errorDetails = `JavaScript backup also failed: ${jsBackupError instanceof Error ? jsBackupError.message : String(jsBackupError)}`
        console.error('❌ Both backup methods failed:', errorDetails)
        return NextResponse.json({ 
          error: 'Backup failed', 
          details: errorDetails 
        }, { status: 500 })
      }
    }

    // Retention cleanup
    try {
      const cutoff = Date.now() - cfg.retentionDays * 24 * 60 * 60 * 1000
      const entries = fs.readdirSync(dir)
      for (const f of entries) {
        const full = path.join(dir, f)
        const st = fs.statSync(full)
        if (st.isFile() && st.mtime.getTime() < cutoff) {
          fs.unlinkSync(full)
          console.log(`🗑️ Deleted old backup: ${f}`)
        }
      }
    } catch (cleanupError) {
      console.warn('⚠️ Retention cleanup failed:', cleanupError)
    }

    console.log(`🎉 Backup completed successfully using ${backupMethod}`)
    return NextResponse.json({ 
      success: true, 
      file: path.basename(filePath),
      method: backupMethod
    })
  } catch (error) {
    console.error('❌ Error creating backup:', error)
    return NextResponse.json({ 
      error: 'Backup failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// Automatic backup endpoint
export async function PUT(request: NextRequest) {
  try {
    console.log('🤖 Automatic backup endpoint called...')
    
    if (!checkAdminToken(request)) {
      console.log('❌ Unauthorized automatic backup attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Admin token validated for automatic backup')
    
    const result = await performAutomaticBackup()
    
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json({ 
        error: 'Automatic backup failed', 
        details: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ Error in automatic backup endpoint:', error)
    return NextResponse.json({ 
      error: 'Automatic backup failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}