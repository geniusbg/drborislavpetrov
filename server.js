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
  })
}) 