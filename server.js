require('dotenv').config()
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Prepare the Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Create Socket.io server with improved CORS settings
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ["https://yourdomain.com", "https://www.yourdomain.com"] // Replace with actual domain
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"]
    },
    transports: ['websocket', 'polling'],
    // Add rate limiting for better security
    maxHttpBufferSize: 1e6, // 1MB max message size
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000 // 25 seconds
  })

  // Store global io instance for API routes
  global.io = io

  // Socket.io event handlers
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id)

    socket.on('join-admin', () => {
      socket.join('admin')
      console.log('👤 Client joined admin room:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })

    // Handle booking events
    socket.on('booking-updated', (booking) => {
      socket.to('admin').emit('booking-updated', booking)
    })

    socket.on('booking-added', (booking) => {
      socket.to('admin').emit('booking-added', booking)
    })

    socket.on('booking-deleted', (bookingId) => {
      socket.to('admin').emit('booking-deleted', bookingId)
    })

    socket.on('next-booking-changed', (booking) => {
      socket.to('admin').emit('next-booking-changed', booking)
    })

    // Handle user events
    socket.on('user-updated', (user) => {
      socket.to('admin').emit('user-updated', user)
    })

    // Handle service events
    socket.on('service-updated', (service) => {
      socket.to('admin').emit('service-updated', service)
    })
  })

  server.listen(port, () => {
    console.log(`🚀 Ready on http://${hostname}:${port}`)
    console.log(`🔌 Socket.io server running on port ${port}`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)

    // Auto-backup scheduler (node-cron fallback to setInterval)
    try {
      const fs = require('fs')
      const path = require('path')
      const { spawn } = require('child_process')
      let cron
      try { cron = require('node-cron') } catch {}

      const CONFIG_FILE = path.join(process.cwd(), 'backup-config.json')

      function loadConfig() {
        try {
          if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
            return JSON.parse(raw)
          }
        } catch (e) {
          console.error('Auto-backup loadConfig error:', e)
        }
        return {
          retentionDays: 5,
          backupInterval: 1,
          backupFormat: 'sql',
          backupLocation: './backups/',
          autoBackup: true,
          compression: false,
        }
      }

      function ensureDir(dir) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      }

      function latestBackupMtime(dir) {
        try {
          const files = fs.readdirSync(dir)
          let latest = 0
          for (const f of files) {
            const full = path.join(dir, f)
            const st = fs.statSync(full)
            if (st.isFile()) latest = Math.max(latest, st.mtimeMs)
          }
          return latest
        } catch {
          return 0
        }
      }

      async function runBackupIfDue() {
        const cfg = loadConfig()
        if (!cfg.autoBackup) return
        const dir = path.isAbsolute(cfg.backupLocation) ? cfg.backupLocation : path.join(process.cwd(), cfg.backupLocation)
        ensureDir(dir)

        const last = latestBackupMtime(dir)
        const hoursSince = last ? (Date.now() - last) / (1000 * 60 * 60) : Infinity
        if (hoursSince < cfg.backupInterval) return

        const host = process.env.PGHOST
        const port = process.env.PGPORT || '5432'
        const db = process.env.PGDATABASE
        const user = process.env.PGUSER
        const pass = process.env.PGPASSWORD
        if (!host || !db || !user || !pass) {
          console.warn('Auto-backup skipped: missing PG env vars')
          return
        }

        const now = new Date()
        const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
        const ext = cfg.backupFormat === 'sql' ? 'sql' : 'dump'
        const fmt = cfg.backupFormat === 'sql' ? 'p' : 'c'
        const filePath = path.join(dir, `backup-${stamp}.${ext}`)

        console.log('🗄️ Auto-backup started →', filePath)
        await new Promise((resolve, reject) => {
          const child = spawn('pg_dump', ['-h', host, '-p', String(port), '-U', user, '-F', fmt, '-b', '-v', '-f', filePath, db], {
            env: { ...process.env, PGPASSWORD: pass },
          })
          child.stdout?.on('data', (d) => process.stdout.write(d))
          child.stderr?.on('data', (d) => process.stderr.write(d))
          child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pg_dump exited ${code}`))))
          child.on('error', reject)
        }).catch((e) => console.error('Auto-backup error:', e))

        // Retention cleanup
        try {
          const cutoff = Date.now() - cfg.retentionDays * 24 * 60 * 60 * 1000
          const entries = fs.readdirSync(dir)
          for (const f of entries) {
            const full = path.join(dir, f)
            const st = fs.statSync(full)
            if (st.isFile() && st.mtimeMs < cutoff) fs.unlinkSync(full)
          }
        } catch {}
      }

      if (cron && cron.schedule) {
        // Check every 5 minutes whether backup is due
        cron.schedule('*/5 * * * *', runBackupIfDue)
        console.log('⏱️ node-cron scheduler initialized (*/5 * * * *).')
      } else {
        setInterval(runBackupIfDue, 5 * 60 * 1000)
        console.log('⏱️ setInterval scheduler initialized (5 min).')
      }
    } catch (e) {
      console.error('Scheduler init error:', e)
    }
  })
}) 