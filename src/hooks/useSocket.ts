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
  const socketRef = useRef<Socket | null>(null)
  const hasJoinedAdminRef = useRef(false)
  const connectionAttempts = useRef(0)
  const maxAttempts = 5 // Increased for better reliability
  const isCreatingSocket = useRef(false) // Prevent multiple socket creation attempts

  const createSocket = useCallback(() => {
    // Only create socket on client side and if it doesn't exist
    if (typeof window !== 'undefined' && !socketRef.current && !isCreatingSocket.current) {
      isCreatingSocket.current = true
      try {
        // Use dynamic URL based on current page origin
        const socketUrl = window.location.origin
        console.log('🔌 Attempting to connect to Socket.io server at:', socketUrl)
        
        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'], // WebSocket first, polling as fallback
          autoConnect: true,
          forceNew: false, // Prevent multiple connections
          timeout: 10000, // 10 second timeout - reduced for faster fallback
          reconnection: true,
          reconnectionAttempts: 3, // Reduced reconnection attempts
          reconnectionDelay: 1000, // Reduced delay between attempts
          reconnectionDelayMax: 5000 // Maximum delay between attempts
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

        const connectErrorHandler = (error: Error) => {
          console.error('❌ WebSocket connection error:', error)
          setIsConnected(false)
          connectionAttempts.current++
          
          // If multiple connection attempts fail, disable WebSocket
          if (connectionAttempts.current >= maxAttempts) {
            console.warn('⚠️ WebSocket connection failed multiple times, falling back to polling')
            setIsSupported(false)
            if (newSocket) {
              newSocket.close()
            }
          }
        }

        newSocket.on('connect', connectHandler)
        newSocket.on('disconnect', disconnectHandler)
        newSocket.on('connect_error', connectErrorHandler)

        // Add specific handling for WebSocket transport failures
        const errorHandler = (error: Error) => {
          console.error('❌ Socket.io error:', error)
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

        // Add connection timeout handling
        setTimeout(() => {
          if (!newSocket.connected) {
            console.warn('⚠️ Connection timeout, forcing polling transport')
            newSocket.io.opts.transports = ['polling']
            newSocket.connect()
          }
        }, 10000) // 10 second timeout for connection

        setSocket(newSocket)
        socketRef.current = newSocket
        isCreatingSocket.current = false

        return newSocket
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error)
        setIsSupported(false)
        isCreatingSocket.current = false
        return null
      }
    }
    return socketRef.current
  }, [])

  useEffect(() => {
    // Only create socket if it doesn't exist and not already creating
    if (!socketRef.current && !isCreatingSocket.current) {
      // Add small delay to prevent rapid socket creation
      const timer = setTimeout(() => {
        const newSocket = createSocket()
        
        if (newSocket) {
          return () => {
            if (newSocket) {
              newSocket.close()
              socketRef.current = null
            }
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
  }, [createSocket])

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