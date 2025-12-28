'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { useOffline } from '@/hooks/useOffline'
import { offlineAPI } from '@/lib/offline-api'
import { offlineStorage } from '@/lib/offline-storage'
import type { Booking, User as UserType, Service as ServiceType } from '@/types/global'

// Import components
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNavigation from '@/components/admin/AdminNavigation'
import BookingsTab from '@/components/admin/tabs/BookingsTab'
import UsersTab from '@/components/admin/tabs/UsersTab'
import ServicesTab from '@/components/admin/tabs/ServicesTab'
import AnalyticsTab from '@/components/admin/tabs/AnalyticsTab'
import CalendarComponent from '@/components/admin/Calendar'
import UserHistory from '@/components/admin/UserHistory'
import UserForm from '@/components/admin/UserForm'
import BookingForm from '@/components/admin/BookingForm'
import ServiceForm from '@/components/admin/ServiceForm'
import NextBookingNotification from '@/components/admin/NextBookingNotification'
import VoiceInterface from '@/components/admin/VoiceInterface'
import VoiceAssistant from '@/components/admin/VoiceAssistant'
import BugTracker from '@/components/admin/BugTracker'
import SettingsWorkingHours from '@/components/admin/SettingsWorkingHours'
import BotProtectionSettings from '@/components/admin/BotProtectionSettings'
import QADashboard from '@/components/admin/QADashboard'
import SupportNotes from '@/components/admin/SupportNotes'
import QuickResponseWidget from '@/components/admin/QuickResponseWidget'

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
  
  // Data state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [isUserModalClosing, setIsUserModalClosing] = useState(false)
  const [isBookingModalClosing, setIsBookingModalClosing] = useState(false)
  const [isServiceModalClosing, setIsServiceModalClosing] = useState(false)
  
  // Editing states
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  
  // Search states
  const [bookingSearchTerm, setBookingSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [serviceSearchTerm, setServiceSearchTerm] = useState('')
  
  // Sort state
  const [sortState, setSortState] = useState<SortState>(() => {
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
  
  // Pagination states
  const [currentBookingsPage, setCurrentBookingsPage] = useState(1)
  const [bookingsPerPage, setBookingsPerPage] = useState(20)
  const [currentUsersPage, setCurrentUsersPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(20)
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [servicesPerPage, setServicesPerPage] = useState(20)
  
  // Other states
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [isMobileOrIOS, setIsMobileOrIOS] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})
  const [showSupportNotes, setShowSupportNotes] = useState(false)
  const [hideOverlay, setHideOverlay] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [overlayProgress, setOverlayProgress] = useState(0)
  const initLoadStartedRef = useRef(false)
  const overlayFinalizedRef = useRef(false)
  const [reopenQuickResponse, setReopenQuickResponse] = useState(false)
  
  // Header scroll state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        // Always show header when near top
        setIsHeaderVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide header when scrolling down
        setIsHeaderVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Show header when scrolling up
        setIsHeaderVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

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
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'phone':
          aValue = a.phone || ''
          bValue = b.phone || ''
          break
        case 'service':
          aValue = (a.serviceName || a.service || '').toLowerCase()
          bValue = (b.serviceName || b.service || '').toLowerCase()
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
        setBookings((response.data.bookings as Booking[]) || [])
      } else if (response.error) {
        console.error('❌ loadBookings - failed:', response.error)
        
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
        setServices((response.data.services as ServiceType[]) || [])
      } else if (response.error) {
        console.error('❌ loadServices - failed:', response.error)
        
        // Try to load from offline storage as fallback
        try {
          const cachedServices = await offlineStorage.getServices()
          if (cachedServices && cachedServices.length > 0) {
            console.log('📦 Loading cached services from offline storage:', cachedServices.length)
            setServices(cachedServices as ServiceType[])
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

  // Filter functions
  const filteredBookings = useMemo(() => {
    const searchTerm = bookingSearchTerm.toLowerCase()
    return bookings.filter(booking => {
      return (
        booking.name.toLowerCase().includes(searchTerm) ||
        (booking.phone && booking.phone.includes(searchTerm)) ||
        (booking.email && booking.email.toLowerCase().includes(searchTerm)) ||
        booking.date.includes(searchTerm) ||
        booking.time.includes(searchTerm) ||
        (booking.serviceName && booking.serviceName.toLowerCase().includes(searchTerm)) ||
        (booking.service && booking.service.toLowerCase().includes(searchTerm))
      )
    })
  }, [bookings, bookingSearchTerm])

  const filteredUsers = useMemo(() => {
    const searchTerm = userSearchTerm.toLowerCase()
    return users.filter(user => {
      return (
        user.name.toLowerCase().includes(searchTerm) ||
        (user.phone && user.phone.includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
      )
    })
  }, [users, userSearchTerm])

  const filteredServices = useMemo(() => {
    const searchTerm = serviceSearchTerm.toLowerCase()
    return services.filter(service => {
      return (
        service.name.toLowerCase().includes(searchTerm) ||
        (service.description && service.description.toLowerCase().includes(searchTerm))
      )
    })
  }, [services, serviceSearchTerm])

  // Pagination calculations
  const totalBookingsPages = Math.ceil(filteredBookings.length / bookingsPerPage)
  const bookingsStartIndex = (currentBookingsPage - 1) * bookingsPerPage
  const bookingsEndIndex = bookingsStartIndex + bookingsPerPage
  const paginatedBookings = sortBookings(filteredBookings, sortState).slice(bookingsStartIndex, bookingsEndIndex)

  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndex = (currentUsersPage - 1) * usersPerPage
  const usersEndIndex = usersStartIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndex, usersEndIndex)

  const totalServicesPages = Math.ceil(filteredServices.length / servicesPerPage)
  const servicesStartIndex = (currentServicesPage - 1) * servicesPerPage
  const servicesEndIndex = servicesStartIndex + servicesPerPage
  const paginatedServices = filteredServices.slice(servicesStartIndex, servicesEndIndex)

  // Reset pages when search changes
  useEffect(() => {
    setCurrentBookingsPage(1)
  }, [bookingSearchTerm])

  useEffect(() => {
    setCurrentUsersPage(1)
  }, [userSearchTerm])

  useEffect(() => {
    setCurrentServicesPage(1)
  }, [serviceSearchTerm])

  // Event handlers
  const handleSettingsClick = () => {
    changeTab('settings')
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken')
      window.location.href = '/admin/login'
    }
  }

  const handleAddBooking = () => {
    setEditingBooking(null)
    setShowBookingModal(true)
  }

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking)
    setShowBookingModal(true)
  }

  const handleDeleteBooking = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази резервация?')) return

    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await loadBookings()
      } else {
        const error = await response.json()
        alert(`Грешка при изтриване: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
      alert('Грешка при изтриване на резервацията')
    }
  }

  const handleUpdateBookingStatus = async (id: number, status: string) => {
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
        console.error('❌ Failed to update booking status')
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
    }
  }

  const handleUpdateBookingNotes = async (id: number, notes: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({
          id: id,
          treatment_notes: notes
        })
      })
      
      if (response.ok) {
        loadBookings()
      } else {
        const error = await response.json()
        alert(`Грешка при обновяване: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating booking notes:', error)
      alert('Грешка при обновяване на бележките')
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setShowUserModal(true)
  }

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setShowUserModal(true)
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този потребител?')) return

    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/users`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        loadUsers(true)
      } else {
        const error = await response.json()
        alert(`Грешка при изтриване: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Грешка при изтриване на потребителя')
    }
  }

  const handleViewUserHistory = (userId: number) => {
    const params = new URLSearchParams(searchParams?.toString?.() || '')
    params.set('modal', 'userHistory')
    params.set('userId', userId.toString())
    router.push(`/admin?${params.toString()}`, { scroll: false })
  }

  const handleAddService = () => {
    setEditingService(null)
    setShowServiceModal(true)
  }

  const handleEditService = (service: ServiceType) => {
    setEditingService(service)
    setShowServiceModal(true)
  }

  const handleDeleteService = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) return

    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/services`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await loadServices(true)
      } else {
        const error = await response.json()
        alert(`Грешка при изтриване: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting service:', error)
      alert('Грешка при изтриване на услугата')
    }
  }

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      if (initLoadStartedRef.current) return
      initLoadStartedRef.current = true

      const tasks = [loadBookings, loadServices, loadUsers]
      const totalTasks = tasks.length
      let completed = 0

      for (const task of tasks) {
        try {
          await task()
          completed++
          const progress = Math.round((completed / totalTasks) * 100)
          setOverlayProgress(progress)
        } catch (error) {
          console.error('Error loading data:', error)
          completed++
          const progress = Math.round((completed / totalTasks) * 100)
          setOverlayProgress(progress)
        }
      }

      // Final progress update
      setOverlayProgress(100)
      
      // Hide overlay after a short delay
      setTimeout(() => {
        setIsClosing(true)
        setTimeout(() => {
          setHideOverlay(true)
          setIsLoading(false)
          overlayFinalizedRef.current = true
        }, 1400)
      }, 200)
    }

    loadInitialData()
  }, [])

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    joinAdmin()

    // Listen for booking updates
    socket.on('booking-added', (newBooking: any) => {
      setBookings(prev => [...prev, newBooking])
    })

    socket.on('booking-updated', (updatedBooking: any) => {
      setBookings(prev => prev.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      ))
    })

    socket.on('booking-deleted', (bookingId: string) => {
      setBookings(prev => prev.filter(booking => booking.id?.toString() !== bookingId))
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
    socket.on('service-added', async (newService: any) => {
      await loadServices(true)
    })

    socket.on('service-updated', async (updatedService: any) => {
      await loadServices(true)
    })

    socket.on('service-deleted', async (serviceId: string) => {
      await loadServices(true)
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
  }, [socket, isConnected, joinAdmin])

  // Current time update
  useEffect(() => {
    const updateTime = () => {
      setCurrentDateTime(getBulgariaTime())
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-gray-50">
        {/* Loading Overlay */}
        {!hideOverlay && (
          <div
            aria-hidden
            className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-[1400ms]"
            style={{ opacity: isClosing ? 0 : 1 }}
          >
            <div
              className="text-center transform-gpu transition-transform duration-[1400ms]"
              style={{ transform: isClosing ? 'scale(0.95)' : 'scale(1)' }}
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
        
        {/* Header */}
        <AdminHeader 
          isHeaderVisible={isHeaderVisible}
          onSettingsClick={handleSettingsClick}
          onLogout={handleLogout}
        />

        {/* Navigation */}
        <AdminNavigation 
          activeTab={activeTab}
          isHeaderVisible={isHeaderVisible}
          onTabChange={changeTab}
        />

        {/* Content */}
        {!isLoading && (
          <div className="max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8 py-4 sm:py-8">
            
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <BookingsTab
                bookings={bookings}
                filteredBookings={filteredBookings}
                paginatedBookings={paginatedBookings}
                bookingSearchTerm={bookingSearchTerm}
                sortState={sortState}
                currentBookingsPage={currentBookingsPage}
                totalBookingsPages={totalBookingsPages}
                bookingsStartIndex={bookingsStartIndex}
                bookingsEndIndex={bookingsEndIndex}
                bookingsPerPage={bookingsPerPage}
                loadingActions={loadingActions}
                onBookingSearchChange={setBookingSearchTerm}
                onSortChange={handleSort}
                onBookingPageChange={setCurrentBookingsPage}
                onBookingsPerPageChange={setBookingsPerPage}
                onAddBooking={handleAddBooking}
                onEditBooking={handleEditBooking}
                onDeleteBooking={handleDeleteBooking}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onUpdateBookingNotes={handleUpdateBookingNotes}
              />
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <CalendarComponent />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                filteredUsers={filteredUsers}
                paginatedUsers={paginatedUsers}
                userSearchTerm={userSearchTerm}
                currentUsersPage={currentUsersPage}
                totalUsersPages={totalUsersPages}
                usersStartIndex={usersStartIndex}
                usersEndIndex={usersEndIndex}
                usersPerPage={usersPerPage}
                onUserSearchChange={setUserSearchTerm}
                onUserPageChange={setCurrentUsersPage}
                onUsersPerPageChange={setUsersPerPage}
                onAddUser={handleAddUser}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
                onViewUserHistory={handleViewUserHistory}
              />
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <ServicesTab
                services={services}
                filteredServices={filteredServices}
                paginatedServices={paginatedServices}
                serviceSearchTerm={serviceSearchTerm}
                currentServicesPage={currentServicesPage}
                totalServicesPages={totalServicesPages}
                servicesStartIndex={servicesStartIndex}
                servicesEndIndex={servicesEndIndex}
                servicesPerPage={servicesPerPage}
                onServiceSearchChange={setServiceSearchTerm}
                onServicePageChange={setCurrentServicesPage}
                onServicesPerPageChange={setServicesPerPage}
                onAddService={handleAddService}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
              />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                bookings={bookings}
                users={users}
                services={services}
              />
            )}

            {/* Bug Tracker Tab */}
            {activeTab === 'bugTracker' && (
              <BugTracker />
            )}

            {/* QA Tab */}
            {activeTab === 'qa' && (
              <QADashboard />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <SettingsWorkingHours />
                <BotProtectionSettings />
              </div>
            )}
          </div>
        )}

        {/* Modals */}
        {showUserModal && (
          <UserForm
            user={editingUser}
            onClose={() => {
              setIsUserModalClosing(true)
              setTimeout(() => {
                setShowUserModal(false)
                setIsUserModalClosing(false)
                setEditingUser(null)
              }, 300)
            }}
            onSave={async (userData) => {
              try {
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
                  setTimeout(() => {
                    setShowUserModal(false)
                    setIsUserModalClosing(false)
                    setEditingUser(null)
                    loadUsers(true)
                  }, 300)
                } else {
                  const error = await response.json()
                  alert(`Грешка при запазване: ${error.message}`)
                }
              } catch (error) {
                console.error('Error saving user:', error)
                alert('Грешка при запазване на потребителя')
              }
            }}
          />
        )}

        {showBookingModal && (
          <BookingForm
            booking={editingBooking}
            services={services}
            onClose={() => {
              setIsBookingModalClosing(true)
              setTimeout(() => {
                setShowBookingModal(false)
                setIsBookingModalClosing(false)
                setEditingBooking(null)
              }, 300)
            }}
            onSave={async (bookingData) => {
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
                  setTimeout(() => {
                    setShowBookingModal(false)
                    setIsBookingModalClosing(false)
                    setEditingBooking(null)
                  }, 300)
                } else {
                  const error = await response.json()
                  alert(`Грешка при запазване: ${error.message}`)
                }
              } catch (error) {
                console.error('Error saving booking:', error)
                alert('Грешка при запазване на резервацията')
              }
            }}
          />
        )}

        {showServiceModal && (
          <ServiceForm
            service={editingService}
            onClose={() => {
              setIsServiceModalClosing(true)
              setTimeout(() => {
                setShowServiceModal(false)
                setIsServiceModalClosing(false)
                setEditingService(null)
              }, 300)
            }}
            onSave={async (serviceData) => {
              try {
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
                  await loadServices(true) // Force refresh to get latest data
                  
                  // Изчакваме малко преди да затворим модала
                  setTimeout(() => {
                    setIsServiceModalClosing(true)
                    setTimeout(() => {
                      setShowServiceModal(false)
                      setIsServiceModalClosing(false)
                      setEditingService(null)
                    }, 300)
                  }, 100)
                } else {
                  const error = await response.json()
                  alert(`Грешка при запазване: ${error.message}`)
                }
              } catch (error) {
                console.error('Error saving service:', error)
                alert('Грешка при запазване на услугата')
              }
            }}
          />
        )}

        {/* User History Modal */}
        {searchParams?.get('modal') === 'userHistory' && searchParams?.get('userId') && (
          <UserHistory
            userId={parseInt(searchParams.get('userId')!)}
            onClose={() => {
              const params = new URLSearchParams(searchParams?.toString?.() || '')
              params.delete('modal')
              params.delete('userId')
              router.push(`/admin?${params.toString()}`, { scroll: false })
            }}
            onRefreshBookings={() => loadBookings(true)}
          />
        )}

        {/* Voice Interface */}
        {showVoiceInterface && (
          <VoiceInterface
            onClose={() => setShowVoiceInterface(false)}
            onVoiceCommand={(command) => {
              console.log('Voice command received:', command)
              // Handle voice commands here
            }}
          />
        )}

        {/* Voice Assistant */}
        {isVoiceListening && (
          <VoiceAssistant
            onClose={() => setIsVoiceListening(false)}
            onResult={(result) => {
              console.log('Voice result:', result)
              setIsVoiceListening(false)
            }}
          />
        )}

        {/* Support Notes */}
        {showSupportNotes && (
          <SupportNotes
            onClose={() => setShowSupportNotes(false)}
          />
        )}

        {/* Quick Response Widget */}
        <QuickResponseWidget
          onBookingCreated={() => {
            loadBookings()
            // Flag to re-open Quick Response after the booking modal is closed
            setReopenQuickResponse(true)
          }}
        />
      </div>
    </Suspense>
  )
}
