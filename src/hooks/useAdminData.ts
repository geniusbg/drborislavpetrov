'use client'

import { useEffect } from 'react'
import { offlineAPI } from '@/lib/offline-api'
import { offlineStorage } from '@/lib/offline-storage'
import { useAdminState } from '@/contexts/AdminStateContext'
import { getBulgariaTime } from '@/lib/bulgaria-time'

export function useAdminData() {
  const {
    bookings,
    users,
    services,
    isLoadingBookings,
    isLoadingServices,
    initLoadStartedRef,
    overlayProgress,
    setOverlayProgress,
    isClosing,
    setIsClosing,
    hideOverlay,
    setHideOverlay,
    isLoading,
    setIsLoading,
    overlayFinalizedRef,
    setBookings,
    setUsers,
    setServices,
    setIsLoadingBookings,
    setIsLoadingServices,
    setIsMobileOrIOS,
    currentDateTime,
    setCurrentDateTime
  } = useAdminState()

  // Data loading functions
  const loadBookings = async (forceRefresh = false) => {
    if (isLoadingBookings) return
    
    try {
      setIsLoadingBookings(true)
      console.log('🔍 Loading bookings with offline API')
      
      const response = await offlineAPI.getBookings(forceRefresh)
      
      console.log('📅 Bookings response:', response)
      
      if (response.data) {
        console.log('📅 Bookings data:', response.data)
        setBookings((response.data.bookings as any[]) || [])
      } else if (response.error) {
        console.error('❌ loadBookings - failed:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedBookings = await offlineStorage.getBookings()
          if (cachedBookings && cachedBookings.length > 0) {
            console.log('📦 Loading cached bookings from offline storage:', cachedBookings.length)
            setBookings(cachedBookings as any[])
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached bookings:', cacheError)
        }
      }
    } catch (error) {
      console.error('❌ loadBookings error:', error)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const loadUsers = async (forceRefresh = false) => {
    try {
      console.log('🔍 Loading users with offline API')
      
      const response = await offlineAPI.getUsers(forceRefresh)
      
      console.log('👥 Users response:', response)
      
      if (response.data) {
        console.log('👥 Users data:', response.data)
        setUsers((response.data.users as any[]) || [])
      } else if (response.error) {
        console.error('❌ loadUsers - failed:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedUsers = await offlineStorage.getUsers()
          if (cachedUsers && cachedUsers.length > 0) {
            console.log('📦 Loading cached users from offline storage:', cachedUsers.length)
            setUsers(cachedUsers as any[])
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached users:', cacheError)
        }
      }
    } catch (error) {
      console.error('❌ loadUsers error:', error)
    }
  }

  const loadServices = async (forceRefresh = false) => {
    try {
      setIsLoadingServices(true)
      console.log('🔍 Loading services with offline API')
      
      const response = await offlineAPI.getServices(forceRefresh)
      
      console.log('⚙️ Services response:', response)
      
      if (response.data) {
        console.log('⚙️ Services data:', response.data)
        setServices((response.data.services as any[]) || [])
      } else if (response.error) {
        console.error('❌ loadServices - failed:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedServices = await offlineStorage.getServices()
          if (cachedServices && cachedServices.length > 0) {
            console.log('📦 Loading cached services from offline storage:', cachedServices.length)
            setServices(cachedServices as any[])
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached services:', cacheError)
        }
      }
    } catch (error) {
      console.error('❌ loadServices error:', error)
    } finally {
      setIsLoadingServices(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (initLoadStartedRef.current) return
      initLoadStartedRef.current = true

      // Load all data in parallel for better performance
      const tasks = [loadBookings(), loadServices(), loadUsers()]
      const totalTasks = tasks.length
      
      try {
        await Promise.all(tasks)
        setOverlayProgress(100)
      } catch (error) {
        console.error('Error loading data:', error)
        setOverlayProgress(100)
      }
      
      // Hide overlay immediately after data is loaded
      setOverlayProgress(100)
      setIsClosing(true)
      setTimeout(() => {
        setHideOverlay(true)
        setIsLoading(false)
        overlayFinalizedRef.current = true
      }, 50) // Minimal delay for smooth transition
    }

    loadInitialData()
  }, [])

  // Detect iOS/mobile (for VoiceAssistant fallback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      const isIOS = /iPhone|iPad|iPod/i.test(ua)
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      setIsMobileOrIOS(isIOS || isMobile)
    }
  }, [])

  // Current time update
  useEffect(() => {
    const updateTime = () => {
      setCurrentDateTime(getBulgariaTime())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    loadBookings,
    loadUsers,
    loadServices
  }
}
