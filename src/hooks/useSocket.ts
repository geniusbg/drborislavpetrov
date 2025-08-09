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
  const maxAttempts = 3

  const createSocket = useCallback(() => {
    // Only create socket on client side and if it doesn't exist
    if (typeof window !== 'undefined' && !socketRef.current) {
      try {
        // Use dynamic URL based on current page origin
        const socketUrl = window.location.origin
        console.log('🔌 Attempting to connect to Socket.io server at:', socketUrl)
        
        const newSocket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          forceNew: false, // Changed to false to prevent multiple connections
          timeout: 5000, // 5 second timeout
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000
        })

        newSocket.on('connect', () => {
          console.log('✅ Connected to WebSocket server')
          setIsConnected(true)
          setIsSupported(true)
          connectionAttempts.current = 0
        })

        newSocket.on('disconnect', () => {
          console.log('❌ Disconnected from WebSocket server')
          setIsConnected(false)
        })

        newSocket.on('connect_error', (error) => {
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
        })

        setSocket(newSocket)
        socketRef.current = newSocket

        return newSocket
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error)
        setIsSupported(false)
        return null
      }
    }
    return socketRef.current
  }, [])

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const newSocket = createSocket()
      
      return () => {
        if (newSocket) {
          newSocket.close()
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