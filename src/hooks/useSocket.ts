'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isSupported: boolean
  joinAdmin: () => void
  fallbackToPolling: () => void
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const hasJoinedAdminRef = useRef(false)
  const connectionAttempts = useRef(0)
  const maxAttempts = 5 // Increased for better reliability
  const isCreatingSocket = useRef(false) // Prevent multiple socket creation attempts

  // Lightweight reachability probe to avoid console errors when server is down
  const serverReachable = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 1500)
      const res = await fetch('/manifest.json', { method: 'HEAD', cache: 'no-store', signal: ctrl.signal })
      clearTimeout(t)
      return !!res.ok
    } catch {
      return false
    }
  }, [])

  const createSocket = useCallback(async () => {
    // Only create socket on client side and if it doesn't exist
    if (typeof window !== 'undefined' && !socketRef.current && !isCreatingSocket.current) {
      isCreatingSocket.current = true
      // Do not attempt to connect when offline
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOnline(false)
        isCreatingSocket.current = false
        return null
      }
      // Skip if server looks down (preflight)
      const ok = await serverReachable()
      if (!ok) {
        isCreatingSocket.current = false
        setIsSupported(false)
        return null
      }
      try {
        // Use dynamic URL based on current page origin
        const socketUrl = window.location.origin
        console.log('🔌 Attempting to connect to Socket.io server at:', socketUrl)

        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'], // WebSocket first, polling as fallback
          path: '/socket.io',
          autoConnect: false, // ръчно управление
          forceNew: false, // Prevent multiple connections
          timeout: 10000, // 10 second timeout - reduced for faster fallback
          reconnection: false // без автоматични опити; ние ще менажираме по online/offline
        })

        // Store event handlers for cleanup
        const connectHandler = () => {
          console.log('✅ Connected to WebSocket server')
          setIsConnected(true)
          setIsSupported(true)
          connectionAttempts.current = 0
        }

        const disconnectHandler = () => {
          console.log('❌ Disconnected from WebSocket server')
          setIsConnected(false)
        }

        const connectErrorHandler = (_error: Error) => {
          // Безшумно затваряне при грешка (напр. сървърът е спрян)
          setIsConnected(false)
          setIsSupported(false)
          try { newSocket.close() } catch {}
        }

        newSocket.on('connect', connectHandler)
        newSocket.on('disconnect', disconnectHandler)
        newSocket.on('connect_error', connectErrorHandler)

        // Add specific handling for WebSocket transport failures
        const errorHandler = (_error: Error) => {
          // Безшумно – не шумим в конзолата при спряно API
          setIsConnected(false)
        }

        // Handle transport fallback
        const upgradeHandler = () => {
          console.log('✅ WebSocket upgrade successful')
        }

        const upgradeErrorHandler = (error: Error) => {
          console.warn('⚠️ WebSocket upgrade failed, falling back to polling:', error)
          // Force polling transport if WebSocket fails
          newSocket.io.opts.transports = ['polling']
        }

        newSocket.on('error', errorHandler)
        newSocket.on('upgrade', upgradeHandler)
        newSocket.on('upgradeError', upgradeErrorHandler)

        // Без допълнителни таймаути/превключване – пазим конзолата чиста при спрян сървър

        setSocket(newSocket)
        socketRef.current = newSocket
        isCreatingSocket.current = false

        // свържи само ако сме онлайн
        if (typeof navigator === 'undefined' || navigator.onLine !== false) {
          try { newSocket.connect() } catch {}
        }

        return newSocket
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error)
        setIsSupported(false)
        isCreatingSocket.current = false
        return null
      }
    }
    return socketRef.current
  }, [serverReachable])

  useEffect(() => {
    // Track online/offline
    const update = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const handleOnline = () => {
      setIsOnline(true)
      // Try reconnect on coming online
      if (!socketRef.current) createSocket()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setIsConnected(false)
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
        setSocket(null)
      }
    }
    update()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [createSocket])

  useEffect(() => {
    // Only create socket if it doesn't exist and not already creating
    if (!socketRef.current && !isCreatingSocket.current && isOnline) {
      // Add small delay to prevent rapid socket creation
      const timer = setTimeout(() => {
        const maybePromise = createSocket()
        
        if (maybePromise && typeof (maybePromise as Promise<Socket | null>).then === 'function') {
          ;(maybePromise as Promise<Socket | null>).then((newSocket) => {
            if (newSocket) {
              return () => {
                if (newSocket) {
                  newSocket.close()
                  socketRef.current = null
                }
              }
            }
          })
        } else if (maybePromise) {
          return () => {
            const s = maybePromise as Socket
            if (s) { s.close(); socketRef.current = null }
          }
        }
      }, 100) // 100ms delay
      
      return () => {
        clearTimeout(timer)
        if (socketRef.current) {
          socketRef.current.close()
          socketRef.current = null
        }
      }
    }
  }, [createSocket, isOnline])

  const joinAdmin = useCallback(() => {
    if (socket && isConnected && socketRef.current) {
      // Check if already joined to prevent multiple joins
      if (!socketRef.current.connected) {
        console.log('👤 Socket not connected, skipping join-admin')
        return
      }
      
      // Use a flag to prevent multiple joins
      if (!hasJoinedAdminRef.current) {
        socket.emit('join-admin')
        hasJoinedAdminRef.current = true
        console.log('👤 Joined admin room')
      }
    }
  }, [socket, isConnected])

  const fallbackToPolling = useCallback(() => {
    console.log('🔄 Falling back to polling mode')
    setIsSupported(false)
    if (socket) {
      socket.close()
      setSocket(null)
    }
  }, [socket])

  return {
    socket,
    isConnected,
    isSupported,
    joinAdmin,
    fallbackToPolling
  }
} 