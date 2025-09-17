/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Clock, TrendingUp, ArrowLeft, Smartphone, LogOut, Plus, Edit, Trash2, BarChart3, Mic, X, Bug, FileText, MessageSquare, ChevronUp, ChevronDown, Settings } from 'lucide-react'
import CalendarComponent from '@/components/admin/Calendar'
import UserHistory from '@/components/admin/UserHistory'
import UserForm from '@/components/admin/UserForm'
import BookingForm from '@/components/admin/BookingForm'
import ServiceForm from '@/components/admin/ServiceForm'
import NextBookingNotification from '@/components/admin/NextBookingNotification'
import OfflineStatus from '@/components/OfflineStatus'

import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'
import VoiceInterface from '@/components/admin/VoiceInterface'
import VoiceAssistant from '@/components/admin/VoiceAssistant'
import { useSocket } from '@/hooks/useSocket'
import { useOffline } from '@/hooks/useOffline'
import { offlineAPI } from '@/lib/offline-api'
import { offlineStorage } from '@/lib/offline-storage'
import type { Booking, User as UserType, Service as ServiceType } from '@/types/global'
import BugTracker from '@/components/admin/BugTracker'
import BackupManager from '@/components/admin/BackupManager'
import SettingsWorkingHours from '@/components/admin/SettingsWorkingHours'
import BotProtectionSettings from '@/components/admin/BotProtectionSettings'
import UnderConstructionSettings from '@/components/admin/UnderConstructionSettings'
import UnderConstructionBanner from '@/components/UnderConstructionBanner'
import QADashboard from '@/components/admin/QADashboard'
import SupportNotes from '@/components/admin/SupportNotes'
import QuickResponseWidget from '@/components/admin/QuickResponseWidget'
import Pagination from '@/components/admin/Pagination'

import { getBulgariaTime, formatBulgariaDate } from '@/lib/bulgaria-time'

export const dynamic = 'force-dynamic'

// Sort types
type SortField = 'date' | 'time' | 'name' | 'phone' | 'service' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

interface SortState {
  field: SortField
  direction: SortDirection
}

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get active tab from URL or default to 'bookings'
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams?.get?.('tab')
    return tab || 'bookings'
  })
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [isUserModalClosing, setIsUserModalClosing] = useState(false)
  const [isBookingModalClosing, setIsBookingModalClosing] = useState(false)
  const userModalOpenCount = useRef(0)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<UserType | null>(null)
  const [userFromHistory, setUserFromHistory] = useState<UserType | null>(null)
  // const [modalFromUserHistory, setModalFromUserHistory] = useState(false) // REMOVED: не се използва
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [bookingSearchTerm, setBookingSearchTerm] = useState('')
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [isMobileOrIOS, setIsMobileOrIOS] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})
  // const [showBackupManager, setShowBackupManager] = useState(false)
  const [showSupportNotes, setShowSupportNotes] = useState(false)
  // SSR-safe loading overlay with real progress
  const [hideOverlay, setHideOverlay] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [overlayProgress, setOverlayProgress] = useState(0)
  const initLoadStartedRef = useRef(false)
  const overlayFinalizedRef = useRef(false)
  const [reopenQuickResponse, setReopenQuickResponse] = useState(false)

  // Sort state
  const [sortState, setSortState] = useState<SortState>(() => {
    // Load from localStorage or default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminBookingSort')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Invalid saved data, use default
        }
      }
    }
    return { field: 'date', direction: 'desc' }
  })

  // WebSocket connection
  const { socket, isConnected, isSupported, joinAdmin } = useSocket()
  const { } = useOffline()

  // Save sort state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminBookingSort', JSON.stringify(sortState))
    }
  }, [sortState])

  // Detect iOS/mobile (for VoiceAssistant fallback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent
      const isIOS = /iPhone|iPad|iPod/i.test(ua)
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
      setIsMobileOrIOS(isIOS || isMobile)
    }
  }, [])

  // Request microphone access (used before opening VoiceAssistant on iOS/mobile)
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop tracks immediately; we just need the permission grant
      stream.getTracks().forEach(t => t.stop())
      console.log('Микрофонът е достъпен')
    } catch (err) {
      console.error('Достъпът до микрофона е отказан:', err)
    }
  }

  // Sort function
  const sortBookings = (bookings: Booking[], sort: SortState) => {
    return [...bookings].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sort.field) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'time':
          aValue = a.time
          bValue = b.time
          break
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'phone':
          aValue = a.phone?.toLowerCase() || ''
          bValue = b.phone?.toLowerCase() || ''
          break
        case 'service':
          aValue = getServiceLabel(a.service).toLowerCase()
          bValue = getServiceLabel(b.service).toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0
          bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // Handle sort change
  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Function to change tabs with browser history
  const changeTab = (tab: string) => {
    setActiveTab(tab)
    // Update URL with new tab
    const params = new URLSearchParams(searchParams?.toString?.() || '')
    params.set('tab', tab)
    // Clear modal states when changing tabs
    params.delete('modal')
    params.delete('userId')
    params.delete('bookingId')
    params.delete('serviceId')
    params.delete('date')
    router.push(`/admin?${params.toString()}`, { scroll: false })
  }

  // Function to open modal with browser history
  const openModal = (modalType: string, id?: string | number, date?: string) => {
    console.log('🔍 [AdminPage] openModal called with:', { modalType, id, date })
    if (modalType === 'booking' && id) {
      const booking = bookings.find(b => b.id === id)
      if (booking) {
        console.log('🔍 [AdminPage] Found booking for edit:', booking)
        setEditingBooking(booking)
        setShowBookingModal(true)
      }
      return
    }
    
    if (modalType === 'booking' && !id) {
      console.log('🔍 [AdminPage] Opening new booking modal')
      const newBooking = {
        id: '',
        name: '',
        phone: '',
        email: '',
        service: '',
        serviceName: '',
        serviceDuration: 30,
        time: '',
        status: 'pending',
        date: date || '' // Празна дата ако не е подадена от календара
      }
      console.log('🔍 [AdminPage] New booking data:', newBooking)
      setEditingBooking(newBooking)
      setShowBookingModal(true)
      return
    }
    
    const params = new URLSearchParams(searchParams?.toString?.() || '')
    params.set('modal', modalType)
    if (id) {
      if (modalType === 'userHistory') {
        params.set('userId', id.toString())
      } else {
        params.set(`${modalType}Id`, id.toString())
      }
    }
    if (date) params.set('date', date)
    router.push(`/admin?${params.toString()}`, { scroll: false })
  }

  // Function to open service modal with loading check
  const openServiceModal = (serviceId?: number) => {
    if (isLoadingServices) {
      alert('Моля, изчакайте услугите да се заредят...')
      return
    }
    
    // Добавяме по-голямо закъснение за да се стабилизира state-а
    setTimeout(() => {
      if (serviceId) {
        const service = services.find(s => s.id === serviceId)
        if (service) {
          setEditingService(service)
          setShowServiceModal(true)
        }
      } else {
        setEditingService(null)
        setShowServiceModal(true)
      }
    }, 150) // Увеличаваме от 50ms на 150ms
  }

  // Function to close modal with browser history
  const closeModal = () => {
    // Директно задаване на state
    setShowBookingModal(false)
    setShowUserModal(false)
    setShowServiceModal(false)
    setSelectedUserForHistory(null)
    setEditingUser(null)
    setEditingService(null)
    setEditingBooking(null)
    setUserFromHistory(null)
    // setModalFromUserHistory(false) // REMOVED: не се използва
    
    // Изчистване на URL параметри
    const params = new URLSearchParams(searchParams?.toString?.() || '')
    params.delete('modal')
    params.delete('bookingId')
    params.delete('userId')
    params.delete('serviceId')
    params.delete('date')
    router.push(`/admin?${params.toString()}`, { scroll: false })
  }

  // Check authentication on mount
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      window.location.href = '/admin/login'
      return
    }
  }, [])

  // Sync state with URL parameters
  useEffect(() => {
    const tab = searchParams?.get?.('tab') || 'bookings'
    const modal = searchParams?.get?.('modal')
    const bookingId = searchParams?.get?.('bookingId')
    const userId = searchParams?.get?.('userId')
    const serviceId = searchParams?.get?.('serviceId')
    const date = searchParams?.get?.('date')

    // Update active tab
    setActiveTab(tab)

    // Handle modals based on URL
    if (modal === 'booking') {
      // Изчакай дати да се заредят
      if (isLoading) {
        return
      }
      // Ако модалът е в процес на затваряне, не го отваряй отново
      if (isBookingModalClosing) {
        return
      }
      
      if (bookingId) {
        const booking = bookings.find(b => b.id === bookingId)
        if (booking) {
          setEditingBooking(booking)
          setShowBookingModal(true)
        }
      } else {
        setEditingBooking({
          id: '',
          name: '',
          phone: '',
          email: '',
          service: '',
          serviceName: '',
          serviceDuration: 30,
          time: '',
          status: 'pending',
          date: date || '' // Празна дата ако не е подадена от URL
        })
        setShowBookingModal(true)
      }
    } else if (modal === 'user') {
      if (isUserModalClosing) {
        console.log('🔍 [AdminPage] User modal is closing, not opening again')
        return
      }
      if (userId) {
        const user = users.find(u => u.id && u.id.toString() === userId)
        if (user) {
          setEditingUser(user)
          setShowUserModal(true)
        }
      } else {
        setEditingUser(null)
        setShowUserModal(true)
      }
    } else if (modal === 'service') {
      if (serviceId) {
        const service = services.find(s => s.id.toString() === serviceId)
        if (service) {
          setEditingService(service)
          setShowServiceModal(true)
        }
      } else {
        setEditingService(null)
        setShowServiceModal(true)
      }
    } else if (modal === 'userHistory') {
      if (userId) {
        const user = users.find(u => u.id && u.id.toString() === userId)
        if (user) {
          setSelectedUserForHistory(user)
        }
      }
    } else if (modal === 'dailySchedule') {
      if (date) {
        // This will be handled by Calendar component
        // The date is passed via selectedDateFromURL prop
      }
    } else {
      // Close all modals if no modal in URL, BUT only if we're not in the middle of editing
      // НЕ затваряй модалите ако активно редактираме
      if (!showServiceModal && !showUserModal) {
        setShowUserModal(false)
        setShowServiceModal(false)
        setSelectedUserForHistory(null)
        setEditingUser(null)
        setEditingService(null)
      }
    }
  }, [searchParams, bookings, users, services, isLoading, isBookingModalClosing])

  // Update current date and time every second
  useEffect(() => {
    // Set initial time to avoid hydration mismatch
    setCurrentDateTime(getBulgariaTime())
    
    const timer = setInterval(() => {
      setCurrentDateTime(getBulgariaTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // No timeout-based hiding; we hide when real loading finishes

  // Load data on mount with progress tracking (guarded against React Strict Mode double-invoke)
  useEffect(() => {
    if (initLoadStartedRef.current) return
    initLoadStartedRef.current = true

    const loadInitialData = async () => {
      const tasks = [loadBookings, loadServices, loadUsers]
      const totalTasks = tasks.length
      let completed = 0

      const bump = () => {
        completed += 1
        const pct = Math.round((completed / totalTasks) * 90) // keep last 10% for finalize
        setOverlayProgress(prev => Math.max(prev, pct))
      }

      await Promise.all(
        tasks.map(fn => fn().then(bump).catch(bump))
      )

      // finalize
      setIsLoading(false)
      setOverlayProgress(prev => Math.max(prev, 100))

      // Hold a bit, then animate closing once (rotate + scale back + fade)
      const closeDelayMs = 1000
      const animDurationMs = 1400
      if (!overlayFinalizedRef.current) {
        overlayFinalizedRef.current = true
        setTimeout(() => setIsClosing(true), closeDelayMs)
        setTimeout(() => setHideOverlay(true), closeDelayMs + animDurationMs + 100)
      }
    }
    
    loadInitialData()
    
    // WebSocket handles real-time updates - no polling needed
    // Auto-refresh only if WebSocket is not available
    const fallbackInterval = setInterval(() => {
      if (!isConnected) {
        loadBookings()
      }
    }, 30000) // 30 seconds fallback
    
    return () => {
      clearInterval(fallbackInterval)
    }
  }, []) // Empty dependency array to run only once

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      joinAdmin()
      
      // Listen for booking updates
      socket.on('booking-added', (newBooking: Booking) => {
        setBookings(prev => [...prev, newBooking])
      })

      socket.on('booking-updated', (updatedBooking: Booking) => {
        setBookings(prev => prev.map(booking => 
          booking.id === updatedBooking.id ? updatedBooking : booking
        ))
      })

      socket.on('booking-deleted', (bookingId: string) => {
        setBookings(prev => prev.filter(booking => booking.id !== bookingId))
      })

      // Listen for user updates
      socket.on('user-added', (newUser: any) => {
        setUsers(prev => [...prev, newUser])
      })

      socket.on('user-updated', (updatedUser: any) => {
        setUsers(prev => prev.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        ))
      })

      socket.on('user-deleted', (userId: string) => {
        setUsers(prev => prev.filter(user => user.id?.toString() !== userId))
      })

      // Listen for service updates
      socket.on('service-added', (newService: ServiceType) => {
        setServices(prev => [...prev, newService])
      })

      socket.on('service-updated', (updatedService: ServiceType) => {
        setServices(prev => prev.map(service => 
          service.id === updatedService.id ? updatedService : service
        ))
      })

      socket.on('service-deleted', (serviceId: string) => {
        setServices(prev => prev.filter(service => service.id?.toString() !== serviceId))
      })

      return () => {
        socket.off('booking-added')
        socket.off('booking-updated')
        socket.off('booking-deleted')
        socket.off('user-added')
        socket.off('user-updated')
        socket.off('user-deleted')
        socket.off('service-added')
        socket.off('service-updated')
        socket.off('service-deleted')
      }
    }
  }, [socket, isConnected, isSupported, joinAdmin])

  const loadBookings = async () => {
    try {
      console.log('🔍 Loading bookings with offline API')
      
      const response = await offlineAPI.getBookings()
      
      console.log('📊 Bookings response:', response)
      
      if (response.data) {
        console.log('📊 Bookings data:', response.data)
        setBookings(response.data.bookings as Booking[])
      } else if (response.error) {
        console.error('❌ Failed to load bookings:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedBookings = await offlineStorage.getBookings()
          if (cachedBookings && cachedBookings.length > 0) {
            console.log('📦 Loading cached bookings from offline storage:', cachedBookings.length)
            setBookings(cachedBookings as Booking[])
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached bookings:', cacheError)
        }
      }
    } catch (error) {
      console.error('❌ Error loading bookings:', error)
    }
  }

  const loadServices = async () => {
    try {
      setIsLoadingServices(true)
      const response = await offlineAPI.getServices()
      if (response.data) {
        // Map database fields to interface fields
        const mappedServices = (response.data.services as any[]).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          priceCurrency: service.priceCurrency,
          priceBgn: service.priceBgn,
          priceEur: service.priceEur,
          isActive: service.isactive // Map from database field to interface field
        }))
        setServices(mappedServices)
        
        // Ако има отворен модал за редактиране, обновяваме editingService с новите данни
        if (editingService && showServiceModal) {
          const updatedService = mappedServices.find((s: ServiceType) => s.id === editingService.id)
          if (updatedService) {
            // Изчакваме малко преди да обновим editingService
            setTimeout(() => {
              setEditingService(updatedService)
            }, 50)
          }
        }
      } else if (response.error) {
        console.error('❌ Failed to load services:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedServices = await offlineStorage.getServices()
          if (cachedServices && cachedServices.length > 0) {
            console.log('📦 Loading cached services from offline storage:', cachedServices.length)
            const mappedServices = (cachedServices as any[]).map((service: any) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              duration: service.duration,
              price: service.price,
              priceCurrency: service.priceCurrency,
              priceBgn: service.priceBgn,
              priceEur: service.priceEur,
              isActive: service.isactive
            }))
            setServices(mappedServices)
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached services:', cacheError)
        }
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setIsLoadingServices(false)
    }
  }

  const loadUsers = async () => {
    try {
      console.log('🔍 Loading users with offline API')
      
      const response = await offlineAPI.getUsers()
      
      console.log('👥 Users response:', response)
      
      if (response.data) {
        console.log('👥 Users data:', response.data)
        setUsers((response.data.users as UserType[]) || [])
      } else if (response.error) {
        console.error('❌ loadUsers - failed:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedUsers = await offlineStorage.getUsers()
          if (cachedUsers && cachedUsers.length > 0) {
            console.log('📦 Loading cached users from offline storage:', cachedUsers.length)
            setUsers(cachedUsers as UserType[])
          }
        } catch (cacheError) {
          console.error('❌ Failed to load cached users:', cacheError)
        }
      }
    } catch (error) {
      console.error('❌ Error loading users:', error)
    }
  }

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    const actionKey = `status-${id}-${status}`
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }))
    
    console.log('🔍 updateBookingStatus called with:', { id, status })
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id, status })
      })
      
      if (response.ok) {
        console.log('✅ Booking status updated successfully')
        setBookings(prev => prev.map(booking => 
          booking.id === id ? { ...booking, status } : booking
        ))
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to update booking status:', errorData)
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const deleteBooking = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази резервация? Това действие не може да бъде отменено.')) return
    
    const actionKey = `delete-${id}`
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        setBookings(prev => prev.filter(booking => booking.id !== id))
        // Затваряме модала след успешно изтриване
        setShowBookingModal(false)
        setEditingBooking(null)
      } else {
        console.error('Failed to delete booking')
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceLabel = (serviceId: string) => {
    const service = services.find(s => s.id.toString() === serviceId)
    return service ? service.name : serviceId
  }

  const handleServiceSubmit = async (serviceData: Partial<ServiceType>) => {
    setIsLoadingServices(true)
    const adminToken = localStorage.getItem('adminToken')
    const method = editingService ? 'PUT' : 'POST'
    
    const response = await fetch('/api/admin/services', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken || ''
      },
      body: JSON.stringify(editingService ? { ...serviceData, id: editingService.id } : serviceData)
    })
    
    if (response.ok) {
      // Зареждаме услугите ПРЕДИ да затворим модала
      await loadServices()
      
      // Изчакваме малко преди да затворим модала
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Затваряме модала
      setShowServiceModal(false)
      setEditingService(null)
      
      // Изчистваме loading state след малко закъснение
      setTimeout(() => {
        setIsLoadingServices(false)
      }, 100)
    } else {
      const errorData = await response.json().catch(() => ({}))
      setIsLoadingServices(false)
      throw new Error(errorData.message || 'Грешка при запазване на услугата')
    }
  }

  const handleDeleteService = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        loadServices()
      } else {
        console.error('Failed to delete service')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const handleBookingSubmit = async (bookingData: Partial<Booking>) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const isNewBooking = !editingBooking?.id
      
      let response
      if (isNewBooking) {
        // Create new booking
        response = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify(bookingData)
        })
      } else {
        // Update existing booking
        response = await fetch('/api/admin/bookings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify({ ...bookingData, id: editingBooking?.id })
        })
      }
      
      if (response.ok) {
        await loadBookings()
        setIsBookingModalClosing(true)
        // Clear modal state and URL params to prevent re-opening after save
        const params = new URLSearchParams(searchParams?.toString?.() || '')
        params.delete('modal')
        params.delete('bookingId')
        params.delete('date')
        router.push(`/admin?${params.toString()}`, { scroll: false })
        // Small delay to ensure URL state is applied before closing
        await new Promise(resolve => setTimeout(resolve, 300))
        setShowBookingModal(false)
        setEditingBooking(null)
        setIsBookingModalClosing(false)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Грешка при запазване на резервацията')
      }
    } catch (error) {
      console.error('Error saving booking:', error)
      alert('Грешка при запазване на резервацията')
    }
  }

  const handleUpdateTreatmentNotes = async (bookingId: string, notes: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({
          id: bookingId,
          treatment_notes: notes
        })
      })
      
      if (response.ok) {
        loadBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Грешка при обновяване на бележките')
      }
    } catch (error) {
      console.error('Error updating treatment notes:', error)
      alert('Грешка при обновяване на бележките')
    }
  }

  const handleEditBookingFromHistory = (booking: Booking) => {
    setEditingBooking(booking)
    setShowBookingModal(true)
  }

  const handleCreateBookingFromHistory = (user: UserType) => {
    setEditingBooking({
      id: '',
      name: user.name,
      phone: user.phone || '',
      email: user.email || '',
      service: '',
      serviceName: '',
      serviceDuration: 30,
      time: '',
      status: 'pending',
      date: '' // Празна дата - потребителят трябва да я избере ръчно
    })
    setShowBookingModal(true)
  }

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    const searchTerm = userSearchTerm.toLowerCase()
    return users.filter(user => {
      const name = (user.name || '').toLowerCase()
      const phone = (user.phone || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      return (
        name.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        email.includes(searchTerm)
      )
    })
  }, [users, userSearchTerm])

  // Pagination state for bookings
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Pagination state for users
  const [currentUsersPage, setCurrentUsersPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(20)
  
  // Pagination state for services
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [servicesPerPage, setServicesPerPage] = useState(20)

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    const searchTerm = bookingSearchTerm.toLowerCase()
    const filtered = bookings.filter(booking => {
      return (
        (booking.name && booking.name.toLowerCase().includes(searchTerm)) ||
        (booking.phone && booking.phone.toLowerCase().includes(searchTerm)) ||
        (booking.email && booking.email.toLowerCase().includes(searchTerm)) ||
        (booking.date && booking.date.toLowerCase().includes(searchTerm)) ||
        (booking.time && booking.time.toLowerCase().includes(searchTerm)) ||
        (booking.service && getServiceLabel(booking.service).toLowerCase().includes(searchTerm))
      )
    })
    
    // Apply sorting
    return sortBookings(filtered, sortState)
  }, [bookings, bookingSearchTerm, services, sortState])

  // Calculate pagination for bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex)

  // Calculate pagination for users
  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (currentUsersPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  // Calculate pagination for services
  const totalServicesPages = Math.ceil(services.length / servicesPerPage)
  const servicesStartIndex = (currentServicesPage - 1) * servicesPerPage
  const servicesEndIndex = servicesStartIndex + servicesPerPage
  const paginatedServices = services.slice(servicesStartIndex, servicesEndIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [bookingSearchTerm])

  // Reset users page when search changes
  useEffect(() => {
    setCurrentUsersPage(1)
  }, [userSearchTerm])

  // Reset services page when search changes
  useEffect(() => {
    setCurrentServicesPage(1)
  }, [])

  const handleAddBooking = (date: Date) => {
    const newBooking = {
      id: '',
      name: '',
      phone: '',
      email: '',
      service: '',
      serviceName: '',
      serviceDuration: 30,
      time: '',
      status: 'pending',
      date: date.toISOString().split('T')[0] // Дата се попълва само когато се кликва от календара
    }
    console.log('🔍 [AdminPage] handleAddBooking called with:', newBooking)
    setEditingBooking(newBooking)
    setShowBookingModal(true)
  }

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command executed:', command)
    // Refresh data after voice command
    loadBookings()
    loadUsers()
    loadServices()
  }



  // Removed unused formatDateTime function

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Зареждане…</div></div>}>
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen initial overlay (SSR-safe): same markup SSR & first client render */}
      {!hideOverlay && (
        <div
          aria-hidden
          className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-[1400ms]"
          style={{ opacity: isClosing ? 0 : 1 }}
        >
          <div
            className="text-center transform-gpu transition-transform duration-[1400ms]"
            style={{
              transform: isClosing ? 'perspective(800px) translateZ(-200px) rotateY(20deg) scale(0.9)' : 'none',
            }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Д-р Борислав Петров</h1>
              <p className="text-gray-600">Стоматология</p>
            </div>
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="w-64 mx-auto mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(overlayProgress, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">Зареждане… {overlayProgress}%</p>
          </div>
        </div>
      )}
      {/* Next Booking Notification */}
      {currentDateTime && <NextBookingNotification currentTime={currentDateTime} />}
      
      {/* Under Construction Banner */}
      <UnderConstructionBanner isAdminPage={true} />
      
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-800 shadow">
        <div className="max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Brand + Breadcrumb */}
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="text-white">
                <div className="flex items-center text-xs sm:text-sm text-blue-100 space-x-2" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Администрация</h1>
              </div>
            </div>

            {/* Actions (Desktop) */}
            <div className="hidden sm:flex items-center space-x-2 md:space-x-2.5 lg:space-x-3 flex-wrap overflow-x-auto scrollbar-hide">
              <OfflineStatus showDetails={false} />
              <Link href="/" className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden lg:inline">Към сайта</span>
              </Link>
              <a href="/siri" className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0">
                <Smartphone className="w-4 h-4" />
                <span className="hidden lg:inline">Siri Shortcuts</span>
              </a>

              <button
                onClick={() => setShowSupportNotes(true)}
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">Поддръжка</span>
              </button>
              
              <button
                onClick={() => changeTab('settings')}
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden lg:inline">Настройки</span>
              </button>
              
              <div className="h-5 w-px bg-blue-300/60 flex-shrink-0" />
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('adminToken')
                    window.location.href = '/admin/login'
                  }
                }}
                className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Изход</span>
              </button>
            </div>

            {/* Mobile actions */}
            <div className="sm:hidden flex items-center space-x-2">
              <button
                onClick={() => changeTab('settings')}
                className="p-2 text-blue-100 hover:text-white transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('adminToken')
                    window.location.href = '/admin/login'
                  }
                }}
                className="p-2 text-blue-100 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Secondary row removed per request: Search + Today/Week chips */}
        </div>
      </header>

      {/* Clock widget временно премахнат */}

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Зареждане на админ панела...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8 py-4 sm:py-8">
          


          {/* Tabs - Mobile Optimized Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-1 sm:p-1.5 md:p-2">
              {/* Mobile: Horizontal Scrollable Tabs */}
              <div className="sm:hidden overflow-x-auto scrollbar-hide">
                <nav className="flex space-x-1">
                  <button
                    onClick={() => {
                      changeTab('bookings')
                      localStorage.setItem('adminActiveTab', 'bookings')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'bookings'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Резервации</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      changeTab('calendar')
                      localStorage.setItem('adminActiveTab', 'calendar')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'calendar'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Календар</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      changeTab('users')
                      localStorage.setItem('adminActiveTab', 'users')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'users'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Потребители</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      changeTab('services')
                      localStorage.setItem('adminActiveTab', 'services')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'services'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Услуги</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      changeTab('analytics')
                      localStorage.setItem('adminActiveTab', 'analytics')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'analytics'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Аналитикс</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      changeTab('qa')
                      localStorage.setItem('adminActiveTab', 'qa')
                    }}
                    className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                      activeTab === 'qa'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>QA</span>
                    </div>
                  </button>
                  

                  


                </nav>
              </div>
              
              {/* Desktop: Responsive Tabs */}
              <nav className="hidden sm:flex space-x-1 md:space-x-1.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => {
                    changeTab('bookings')
                    localStorage.setItem('adminActiveTab', 'bookings')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'bookings'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Резервации</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('calendar')
                    localStorage.setItem('adminActiveTab', 'calendar')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Календар</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('users')
                    localStorage.setItem('adminActiveTab', 'users')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Потребители</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('services')
                    localStorage.setItem('adminActiveTab', 'services')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'services'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Услуги</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('analytics')
                    localStorage.setItem('adminActiveTab', 'analytics')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Аналитикс</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('bugTracker')
                    localStorage.setItem('adminActiveTab', 'bugTracker')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'bugTracker'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Bug className="w-4 h-4" />
                    <span>Bug Tracker</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    changeTab('qa')
                    localStorage.setItem('adminActiveTab', 'qa')
                  }}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'qa'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>QA</span>
                  </div>
                </button>
                

                


              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'bookings' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Резервации</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {bookingSearchTerm ? `${filteredBookings.length} от ${bookings.length} резервации` : `${bookings.length} резервации`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Търси по име, телефон, имейл, дата, час или услуга..."
                      value={bookingSearchTerm}
                      onChange={(e) => setBookingSearchTerm(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {bookingSearchTerm && (
                      <button
                        onClick={() => setBookingSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* Mobile Sort Dropdown */}
                  <div className="sm:hidden relative">
                    <select
                      value={`${sortState.field}-${sortState.direction}`}
                      onChange={(e) => {
                        const [field, direction] = e.target.value.split('-') as [SortField, SortDirection]
                        setSortState({ field, direction })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="date-desc">Дата (най-нови)</option>
                      <option value="date-asc">Дата (най-стари)</option>
                      <option value="time-asc">Час (рано)</option>
                      <option value="time-desc">Час (късно)</option>
                      <option value="name-asc">Име (A-Z)</option>
                      <option value="name-desc">Име (Z-A)</option>
                      <option value="service-asc">Услуга (A-Z)</option>
                      <option value="service-desc">Услуга (Z-A)</option>
                      <option value="status-asc">Статус (A-Z)</option>
                      <option value="status-desc">Статус (Z-A)</option>
                    </select>
                  </div>
                  
                  {/* Add Booking Button */}
                  <button
                    onClick={() => openModal('booking')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добави резервация</span>
                  </button>
                </div>
              </div>
              
              {/* Mobile: Card Layout, Desktop: Table Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {paginatedBookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{booking.name}</h3>
                          {booking.phone && (
                            <p className="text-sm text-gray-600">{booking.phone}</p>
                          )}
                          {booking.email && (
                            <p className="text-sm text-gray-600">{booking.email}</p>
                          )}
                          {booking.userName && booking.userName !== booking.name && (
                            <p className="text-xs text-blue-600">Потребител: {booking.userName}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status === 'pending' && 'Чакаща'}
                          {booking.status === 'confirmed' && 'Потвърдена'}
                          {booking.status === 'cancelled' && 'Отменена'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Услуга</p>
                          <p className="font-medium">{getServiceLabel(booking.service)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Дата & Час</p>
                          <p className="font-medium">
                            {formatBulgariaDate(new Date(booking.date))}
                          </p>
                          <p className="text-gray-600">{booking.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openModal('booking', booking.id)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                          title="Редактирай"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            disabled={loadingActions[`status-${booking.id}-confirmed`]}
                            className={`text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50 ${loadingActions[`status-${booking.id}-confirmed`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Потвърди"
                          >
                            {loadingActions[`status-${booking.id}-confirmed`] ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            disabled={loadingActions[`status-${booking.id}-cancelled`]}
                            className={`text-orange-600 hover:text-orange-900 p-2 rounded-md hover:bg-orange-50 ${loadingActions[`status-${booking.id}-cancelled`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Отмени"
                          >
                            {loadingActions[`status-${booking.id}-cancelled`] ? (
                              <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteBooking(booking.id)}
                          disabled={loadingActions[`delete-${booking.id}`]}
                          className={`text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 ${loadingActions[`delete-${booking.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Изтрий завинаги"
                        >
                          {loadingActions[`delete-${booking.id}`] ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block">
                <table className="w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Пациент</span>
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('service')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Услуга</span>
                          {getSortIcon('service')}
                        </button>
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Дата & Час</span>
                          {getSortIcon('date')}
                        </button>
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                        >
                          <span>Статус</span>
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0">
                          <div className="truncate">
                            <div className="text-sm font-medium text-gray-900 truncate">{booking.name}</div>
                            {booking.phone && (
                              <div className="text-sm text-gray-500 truncate">{booking.phone}</div>
                            )}
                            {booking.email && (
                              <div className="text-sm text-gray-500 truncate">{booking.email}</div>
                            )}
                            {booking.userName && booking.userName !== booking.name && (
                              <div className="text-xs text-blue-600 truncate">Потребител: {booking.userName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0">
                          <div className="text-sm text-gray-900 truncate">{getServiceLabel(booking.service)}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0">
                          <div className="text-sm text-gray-900">
                            <div className="truncate">{formatBulgariaDate(new Date(booking.date))}</div>
                            <div className="text-sm text-gray-500 truncate">{booking.time}</div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status === 'pending' && 'Чакаща'}
                            {booking.status === 'confirmed' && 'Потвърдена'}
                            {booking.status === 'cancelled' && 'Отменена'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal('booking', booking.id)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Редактирай"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                disabled={loadingActions[`status-${booking.id}-confirmed`]}
                                className={`text-green-600 hover:text-green-900 ${loadingActions[`status-${booking.id}-confirmed`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Потвърди"
                              >
                                {loadingActions[`status-${booking.id}-confirmed`] ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Clock className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                disabled={loadingActions[`status-${booking.id}-cancelled`]}
                                className={`text-orange-600 hover:text-orange-900 ${loadingActions[`status-${booking.id}-cancelled`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title="Отмени"
                              >
                                {loadingActions[`status-${booking.id}-cancelled`] ? (
                                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => deleteBooking(booking.id)}
                              disabled={loadingActions[`delete-${booking.id}`]}
                              className={`text-red-600 hover:text-red-900 ${loadingActions[`delete-${booking.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Изтрий завинаги"
                            >
                              {loadingActions[`delete-${booking.id}`] ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredBookings.length}
                startIndex={startIndex}
                endIndex={endIndex}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                label="резервации"
              />
            </div>
          )}

          {activeTab === 'calendar' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Календар на резервациите</h2>
                  <p className="text-sm text-gray-600 mt-1">Преглед и управление на резервациите по дни</p>
                </div>
                <button
                  onClick={() => openModal('booking')}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добави резервация</span>
                </button>
              </div>
              <div className="p-2 sm:p-2.5 md:p-4 lg:p-6">
                <CalendarComponent 
                  bookings={bookings}
                  onBookingClick={(booking) => {
                    openModal('booking', booking.id)
                  }}
                  onAddBooking={handleAddBooking}
                  onNavigateToDailySchedule={(date) => openModal('dailySchedule', undefined, date)}
                  selectedDateFromURL={searchParams?.get?.('date') || undefined}
                  onCloseDailySchedule={() => closeModal()}
                />
              </div>
            </div>
          )}

          {activeTab === 'services' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Услуги</h2>
                  <p className="text-sm text-gray-600 mt-1">Управление на стоматологичните услуги</p>
                </div>
                <button
                  onClick={() => openServiceModal()}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добави услуга</span>
                </button>
              </div>
              
              {/* Mobile: Card Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {paginatedServices.map((service) => (
                    <div key={service.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Продължителност</p>
                          <p className="font-medium">{service.duration}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Цена</p>
                          <p className="font-medium">
                            {service.priceBgn && !isNaN(Number(service.priceBgn)) ? (
                              service.priceEur && !isNaN(Number(service.priceEur)) ? 
                                `${Number(service.priceBgn).toFixed(2)} лв. / ${Number(service.priceEur).toFixed(2)} €` :
                                `${Number(service.priceBgn).toFixed(2)} лв.`
                            ) : service.price ? 
                              `${service.price} лв.` : 
                              '-'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => openServiceModal(service.id)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block">
                <table className="w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Услуга
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Продължителност
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedServices.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-900">{service.description || '-'}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-900">{service.duration}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {service.priceBgn && !isNaN(Number(service.priceBgn)) ? (
                              service.priceEur && !isNaN(Number(service.priceEur)) ? 
                                `${Number(service.priceBgn).toFixed(2)} лв. / ${Number(service.priceEur).toFixed(2)} €` :
                                `${Number(service.priceBgn).toFixed(2)} лв.`
                            ) : service.price ? 
                              `${service.price} лв.` : 
                              '-'
                            }
                          </div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? 'Активна' : 'Неактивна'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openServiceModal(service.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls for Services */}
              <Pagination
                currentPage={currentServicesPage}
                totalPages={totalServicesPages}
                totalItems={services.length}
                startIndex={servicesStartIndex}
                endIndex={servicesEndIndex}
                itemsPerPage={servicesPerPage}
                onPageChange={setCurrentServicesPage}
                onItemsPerPageChange={setServicesPerPage}
                label="услуги"
              />
            </div>
          )}

          {activeTab === 'users' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Потребители</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {userSearchTerm ? `${filteredUsers.length} от ${users.length} потребители` : `${users.length} потребители`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Търси по име, телефон или имейл..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => openModal('user')}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добави потребител</span>
                  </button>
                </div>
              </div>
              
              {/* Mobile: Card Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {paginatedUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 break-words">{user.name}</h3>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-600 break-words">{user.phone}</p>
                            {user.email && (
                              <p className="text-sm text-gray-600 break-words">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        <div className="font-medium text-gray-700">Създаден:</div>
                        <div className="break-words">
                          {user.createdat ? new Date(user.createdat).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }) + ' ' + new Date(user.createdat).toLocaleTimeString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => user.id && openModal('user', user.id.toString())}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Сигурни ли сте, че искате да изтриете потребителя ${user.name}?`)) {
                              try {
                                const adminToken = localStorage.getItem('adminToken')
                                const response = await fetch(`/api/admin/users?id=${user.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'x-admin-token': adminToken || ''
                                  }
                                })
                                if (response.ok) {
                                  loadUsers()
                                } else {
                                  const error = await response.json()
                                  alert(error.error || 'Грешка при изтриване на потребителя')
                                }
                              } catch (error) {
                                console.error('Error deleting user:', error)
                                alert('Грешка при изтриване на потребителя')
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block">
                <table className="w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Име
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имейл
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                        Създаден на
                      </th>
                      <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="truncate max-w-xs" title={user.name}>{user.name}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                          <div className="truncate max-w-xs" title={user.email || '-'}>{user.email || '-'}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                          <div className="truncate max-w-xs" title={user.phone}>{user.phone}</div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-500 min-w-0">
                          <div className="whitespace-nowrap text-xs" title={user.createdat ? new Date(user.createdat).toLocaleDateString('bg-BG', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          }) + ' ' + new Date(user.createdat).toLocaleTimeString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : '-'}>
                            {user.createdat ? new Date(user.createdat).toLocaleDateString('bg-BG', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            }) + ' ' + new Date(user.createdat).toLocaleTimeString('bg-BG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : '-'}
                          </div>
                        </td>
                        <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 max-w-0 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => user.id && openModal('userHistory', user.id.toString())}
                              className="text-green-600 hover:text-green-900"
                              title="История на резервациите"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => user.id && openModal('user', user.id.toString())}
                              className="text-blue-600 hover:text-blue-900"
                              title="Редактирай"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Сигурни ли сте, че искате да изтриете потребителя ${user.name}?`)) {
                                  try {
                                    const adminToken = localStorage.getItem('adminToken')
                                    const response = await fetch(`/api/admin/users?id=${user.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'x-admin-token': adminToken || ''
                                      }
                                    })
                                    if (response.ok) {
                                      loadUsers()
                                    } else {
                                      const error = await response.json()
                                      alert(error.error || 'Грешка при изтриване на потребителя')
                                    }
                                  } catch (error) {
                                    console.error('Error deleting user:', error)
                                    alert('Грешка при изтриване на потребителя')
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Изтрий"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls for Users */}
              <Pagination
                currentPage={currentUsersPage}
                totalPages={totalUsersPages}
                totalItems={filteredUsers.length}
                startIndex={usersStartIndex}
                endIndex={usersEndIndex}
                itemsPerPage={usersPerPage}
                onPageChange={setCurrentUsersPage}
                onItemsPerPageChange={setUsersPerPage}
                label="потребители"
              />
            </div>
          )}

          {activeTab === 'analytics' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Аналитикс Табло</h2>
                  <p className="text-sm text-gray-600 mt-1">Статистики и анализи на резервациите</p>
                </div>
              </div>
              <div className="p-2 sm:p-2.5 md:p-4 lg:p-6">
                <AnalyticsDashboard />
              </div>
            </div>
          )}

          {activeTab === 'bugTracker' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Баг Тракър</h2>
                  <p className="text-sm text-gray-600 mt-1">Откриване и управление на бъгове</p>
                </div>
              </div>
              <div className="p-2 sm:p-2.5 md:p-4 lg:p-6">
                <BugTracker onClose={() => changeTab('bookings')} />
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">QA Dashboard</h2>
                  <p className="text-sm text-gray-600 mt-1">Управление на качеството и тестове</p>
                </div>
              </div>
              <div className="p-2 sm:p-2.5 md:p-4 lg:p-6">
                <QADashboard />
              </div>
            </div>
          )}



          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Настройки</h2>
                  <p className="text-sm text-gray-600 mt-1">Конфигурация на работно време и защита от ботове</p>
                </div>
              </div>
              <div className="p-2 sm:p-2.5 md:p-4 lg:p-6 space-y-6">
                {/* Settings: Default Working Hours */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Работно време</h3>
                  <SettingsWorkingHours />
                </div>
                
                {/* Bot Protection Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Защита от ботове</h3>
                  <BotProtectionSettings />
                </div>

                {/* Under Construction Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Under Construction Режим</h3>
                  <UnderConstructionSettings />
                </div>

                {/* Backup Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup Управление</h3>
                  <p className="text-sm text-gray-600 mb-4">Автоматични и ръчни backup-и на базата данни</p>
                  <BackupManager />
                </div>
              </div>
            </div>
          )}


        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white m-4" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBooking?.id ? 'Редактирай резервация' : 'Добави резервация'}
              </h3>
              <BookingForm
                booking={editingBooking}
                onSubmit={handleBookingSubmit}
                onCancel={async () => {
                  setIsBookingModalClosing(true)
                  // Clear URL params first to prevent re-open from effects
                  const params = new URLSearchParams(searchParams?.toString?.() || '')
                  params.delete('modal')
                  params.delete('bookingId')
                  params.delete('date')
                  router.push(`/admin?${params.toString()}`, { scroll: false })
                  await new Promise(resolve => setTimeout(resolve, 100))
                  setShowBookingModal(false)
                  setEditingBooking(null)
                  setIsBookingModalClosing(false)
                  
                  // Return to user history if we came from there
                  if (userFromHistory) {
                    setUserFromHistory(null)
                    setSelectedUserForHistory(null)
                  }

                  // Re-open Quick Response only after booking modal closes
                  if (reopenQuickResponse) {
                    setTimeout(() => {
                      const ev = new CustomEvent('quick-response-open')
                      window.dispatchEvent(ev)
                      setReopenQuickResponse(false)
                    }, 0)
                  }
                }}
                onDelete={editingBooking?.id ? deleteBooking : undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white m-4" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Редактирай услуга' : 'Добави услуга'}
              </h3>
              <ServiceForm
                service={editingService}
                onSubmit={handleServiceSubmit}
                onCancel={() => {
                  closeModal()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white m-4" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Редактирай потребител' : 'Добави потребител'}
              </h3>
              <UserForm
                user={editingUser}
                onSubmit={async (userData) => {
                  if (isUserModalClosing) {
                    console.log('🔍 [AdminPage] User modal is closing, not submitting')
                    return
                  }
                  
                  const adminToken = localStorage.getItem('adminToken')
                  const method = editingUser ? 'PUT' : 'POST'
                  const response = await fetch('/api/admin/users', {
                    method,
                    headers: {
                      'Content-Type': 'application/json',
                      'x-admin-token': adminToken || ''
                    },
                    body: JSON.stringify(editingUser ? { ...userData, id: editingUser.id } : userData)
                  })

                  if (response.ok) {
                    setIsUserModalClosing(true)
                    userModalOpenCount.current++
                    console.log('🔍 [AdminPage] Closing user modal, count:', userModalOpenCount.current)
                    
                    // Изчистваме URL параметрите преди да затворим модала
                    const params = new URLSearchParams(searchParams?.toString?.() || '')
                    params.delete('modal')
                    params.delete('userId')
                    router.push(`/admin?${params.toString()}`, { scroll: false })
                    
                    // Добавяме закъснение за да се види loading индикатор
                    await new Promise(resolve => setTimeout(resolve, 500))
                    
                    setShowUserModal(false)
                    setEditingUser(null)
                    setIsUserModalClosing(false)
                    
                    // Не обновяваме данните тук - WebSocket ще ги обнови автоматично
                    // или ще се обновят при следващото зареждане
                  } else {
                    const errorData = await response.json().catch(() => ({}))
                    throw new Error(errorData.error || errorData.message || `Грешка (${response.status}) при запазване на потребителя`)
                  }
                }}
                onCancel={() => {
                  if (isUserModalClosing) {
                    console.log('🔍 [AdminPage] User modal is closing, not closing again')
                    return
                  }
                  closeModal()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {selectedUserForHistory && (
        <UserHistory
          user={selectedUserForHistory}
          bookings={bookings}
          onClose={() => closeModal()}
          onUpdateTreatmentNotes={handleUpdateTreatmentNotes}
          onEditBooking={handleEditBookingFromHistory}
          onDeleteBooking={deleteBooking}
          onCreateBooking={handleCreateBookingFromHistory}
        />
      )}

      {/* Floating Voice Button */}
      {!showVoiceInterface && (
        <div className="fixed z-50 right-4 bottom-20 sm:bottom-4">
          <button
            onClick={async () => {
              if (
                isMobileOrIOS &&
                typeof navigator !== 'undefined' &&
                navigator.mediaDevices &&
                typeof navigator.mediaDevices.getUserMedia === 'function'
              ) {
                await startMic()
              }
              setShowVoiceInterface(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Гласови команди"
            aria-label="Гласови команди"
          >
            <Mic className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

      {/* Voice Interface */}
      {showVoiceInterface && (
        isMobileOrIOS ? (
          <VoiceAssistant
            onCommand={handleVoiceCommand}
            isListening={isVoiceListening}
            setIsListening={setIsVoiceListening}
            onClose={() => setShowVoiceInterface(false)}
          />
        ) : (
          <VoiceInterface 
            onCommand={handleVoiceCommand}
            onClose={() => setShowVoiceInterface(false)}
          />
        )
      )}

      {/* Support Notes Modal */}
      {showSupportNotes && (
        <SupportNotes onClose={() => setShowSupportNotes(false)} />
      )}

      {/* Quick Response Widget */}
      <QuickResponseWidget 
        onCreateBooking={(date, time) => {
          // Open booking modal with pre-filled date and time and default service
          const newBooking = {
            id: '',
            name: '',
            phone: '',
            email: '',
            service: '',
            serviceName: '',
            serviceDuration: 30,
            time: time,
            status: 'pending' as const,
            date: date
          }
          setEditingBooking(newBooking as any)
          setShowBookingModal(true)
          // Sync URL so effects that depend on it won't accidentally close the modal
          // Don't set date parameter to avoid opening DailySchedule modal
          try {
            const params = new URLSearchParams(searchParams?.toString?.() || '')
            params.set('modal', 'booking')
            // Remove date parameter to prevent DailySchedule from opening
            params.delete('date')
            router.push(`/admin?${params.toString()}`, { scroll: false })
          } catch {}
          // Flag to re-open Quick Response after the booking modal is closed
          setReopenQuickResponse(true)
        }}
      />
    </div>
    </Suspense>
  )
} 