import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

type BackupFormat = 'json' | 'sql'

const CONFIG_FILE = path.join(process.cwd(), 'backup-config.json')

function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === 'mock-token' || adminToken === 'test'
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
    backupFormat: 'sql' as BackupFormat,
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
    if (!checkAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cfg = loadConfig()
    const dir = path.isAbsolute(cfg.backupLocation)
      ? cfg.backupLocation
      : path.join(process.cwd(), cfg.backupLocation)
    ensureDir(dir)

    const host = process.env.PGHOST
    const port = process.env.PGPORT || '5432'
    const db = process.env.PGDATABASE
    const user = process.env.PGUSER
    const pass = process.env.PGPASSWORD

    if (!host || !db || !user || !pass) {
      return NextResponse.json({
        error: 'Missing database env vars (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD)'
      }, { status: 500 })
    }

    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const ext = cfg.backupFormat === 'sql' ? 'sql' : 'dump'
    const fmt = cfg.backupFormat === 'sql' ? 'p' : 'c'
    const filePath = path.join(dir, `backup-${stamp}.${ext}`)

    let stderrBuf = ''
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn('pg_dump', ['-h', host, '-p', String(port), '-U', user, '-F', fmt, '-b', '-v', '-f', filePath, db], {
          env: { ...process.env, PGPASSWORD: pass },
        })
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
        child.on('error', reject)
      })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({ error: 'Backup failed', details: stderrBuf || msg }, { status: 500 })
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
        }
      }
    } catch {}

    return NextResponse.json({ success: true, file: path.basename(filePath) })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 })
  }
}

// Duplicate legacy block removed to avoid multiple NextResponse definitions