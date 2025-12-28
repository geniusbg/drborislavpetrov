'use client'

import React, { useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import { useOffline } from '@/hooks/useOffline'
import { getBulgariaDateStringDB, getBulgariaTime } from '@/lib/bulgaria-time'

// Context and Hooks
import { AdminStateProvider, useAdminState, type SortState } from '@/contexts/AdminStateContext'
import { useAdminData } from '@/hooks/useAdminData'
import { useAdminEventHandlers } from '@/hooks/useAdminEventHandlers'
import type { Booking } from '@/types/global'

// Components
import AdminHeader from '@/components/admin/AdminHeader'
import AdminNavigation from '@/components/admin/AdminNavigation'
import BookingsTab from '@/components/admin/tabs/BookingsTab'
import UsersTab from '@/components/admin/tabs/UsersTab'
import ServicesTab from '@/components/admin/tabs/ServicesTab'
import AnalyticsTab from '@/components/admin/tabs/AnalyticsTab'
import AdminsTab from '@/components/admin/tabs/AdminsTab'
import CalendarComponent from '@/components/admin/Calendar'
import BugTracker from '@/components/admin/BugTracker'
import SettingsWorkingHours from '@/components/admin/SettingsWorkingHours'
import BotProtectionSettings from '@/components/admin/BotProtectionSettings'
import QADashboard from '@/components/admin/QADashboard'
import NextBookingNotification from '@/components/admin/NextBookingNotification'
import AdminModals from '@/components/admin/AdminModals'

export const dynamic = 'force-dynamic'

function AdminPageContent() {
  const searchParams = useSearchParams()
  const activeTab = searchParams?.get?.('tab') || 'bookings'
  
  // Check authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      // Redirect to login if no token
      window.location.href = '/admin/login'
      return
    }
  }, [])
  
  const {
    bookings,
    users,
    services,
    hideOverlay,
    isClosing,
    overlayProgress,
    isHeaderVisible,
    lastScrollY,
    bookingSearchTerm,
    bookingDateFilter,
    userSearchTerm,
    serviceSearchTerm,
    sortState,
    currentBookingsPage,
    bookingsPerPage,
    currentUsersPage,
    usersPerPage,
    currentServicesPage,
    servicesPerPage,
    currentDateTime
  } = useAdminState()

  const {
    setIsHeaderVisible,
    setLastScrollY,
    setBookingSearchTerm,
    setBookingDateFilter,
    setUserSearchTerm,
    setServiceSearchTerm,
    setCurrentBookingsPage,
    setBookingsPerPage,
    setCurrentUsersPage,
    setUsersPerPage,
    setCurrentServicesPage,
    setServicesPerPage
  } = useAdminState()

  const { loadBookings } = useAdminData()
  const {
    changeTab,
    handleSort,
    handleAddBooking,
    handleEditBooking,
    handleDeleteBooking,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleViewUserHistory,
    handleAddService,
    handleEditService,
    handleDeleteService
  } = useAdminEventHandlers()

  // WebSocket connection
  const { socket, isConnected, joinAdmin } = useSocket()
  // useOffline hook registers listeners for offline state changes
  useOffline()

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show header only when at the very top of the page
      if (currentScrollY < 10) {
        setIsHeaderVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide header when scrolling down and past 100px
        setIsHeaderVisible(false)
      }
      // Don't show header when scrolling up unless at the very top
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, setIsHeaderVisible, setLastScrollY])

  // Sort function
  const sortBookings = (bookings: Booking[], sort: SortState) => {
    return [...bookings].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

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

  // Filter functions
  const filteredBookings = useMemo(() => {
    const searchTerm = bookingSearchTerm.toLowerCase()
    const now = getBulgariaTime()
    const today = getBulgariaDateStringDB()
    
    // Helper function to get date string in YYYY-MM-DD format
    const getDateString = (dateStr: string): string => {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr
      }
      // Try to parse and format
      try {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch {
        return dateStr
      }
    }
    
    // Helper function to calculate days difference
    const getDaysDifference = (dateStr: string): number => {
      try {
        const bookingDate = new Date(getDateString(dateStr) + 'T00:00:00')
        const todayDate = new Date(today + 'T00:00:00')
        const diffTime = todayDate.getTime() - bookingDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
      } catch {
        return Infinity
      }
    }
    
    return bookings.filter(booking => {
      // Date filter
      if (bookingDateFilter !== 'all') {
        const bookingDate = getDateString(booking.date)
        const daysDiff = getDaysDifference(booking.date)
        
        switch (bookingDateFilter) {
          case 'today':
            if (bookingDate !== today) return false
            break
          case 'yesterday':
            if (daysDiff !== 1) return false
            break
          case '7days':
            // Include today and past 7 days (0 to 7 days ago)
            if (daysDiff < 0 || daysDiff > 7) return false
            break
          case '30days':
            // Include today and past 30 days (0 to 30 days ago)
            if (daysDiff < 0 || daysDiff > 30) return false
            break
        }
      }
      
      // Search filter
      if (searchTerm) {
        return (
          booking.name.toLowerCase().includes(searchTerm) ||
          (booking.phone && booking.phone.includes(searchTerm)) ||
          (booking.email && booking.email.toLowerCase().includes(searchTerm)) ||
          booking.date.includes(searchTerm) ||
          booking.time.includes(searchTerm) ||
          (booking.serviceName && booking.serviceName.toLowerCase().includes(searchTerm)) ||
          (booking.service && booking.service.toLowerCase().includes(searchTerm))
        )
      }
      
      return true
    })
  }, [bookings, bookingSearchTerm, bookingDateFilter])

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
  const totalBookingsPagesCalc = Math.ceil(filteredBookings.length / bookingsPerPage)
  const bookingsStartIndexCalc = (currentBookingsPage - 1) * bookingsPerPage
  const bookingsEndIndexCalc = bookingsStartIndexCalc + bookingsPerPage
  const paginatedBookings = sortBookings(filteredBookings, sortState).slice(bookingsStartIndexCalc, bookingsEndIndexCalc)

  const totalUsersPagesCalc = Math.ceil(filteredUsers.length / usersPerPage)
  const usersStartIndexCalc = (currentUsersPage - 1) * usersPerPage
  const usersEndIndexCalc = usersStartIndexCalc + usersPerPage
  const paginatedUsers = filteredUsers.slice(usersStartIndexCalc, usersEndIndexCalc)

  const totalServicesPagesCalc = Math.ceil(filteredServices.length / servicesPerPage)
  const servicesStartIndexCalc = (currentServicesPage - 1) * servicesPerPage
  const servicesEndIndexCalc = servicesStartIndexCalc + servicesPerPage
  const paginatedServices = filteredServices.slice(servicesStartIndexCalc, servicesEndIndexCalc)

  // WebSocket listeners
  useEffect(() => {
    if (!socket || !isConnected) return

    joinAdmin()
    
    // Listen for booking updates
    socket.on('booking-added', () => {
      // Handle booking added - reload bookings
      loadBookings()
    })

    socket.on('booking-updated', () => {
      // Handle booking updated - reload bookings
      loadBookings()
    })

    socket.on('booking-deleted', () => {
      // Handle booking deleted - reload bookings
      loadBookings()
    })

    return () => {
      socket.off('booking-added')
      socket.off('booking-updated')
      socket.off('booking-deleted')
    }
  }, [socket, isConnected, joinAdmin, loadBookings])

  return (
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
      <AdminHeader />

      {/* Navigation */}
      <AdminNavigation />

      {/* Content */}
      <div className={`max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8 py-4 sm:py-8 transition-all duration-300 ${
        isHeaderVisible ? 'pt-44 sm:pt-48' : 'pt-16 sm:pt-20'
      }`}>
        {/* Show content immediately, but show loading state for individual tabs */}
          
          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              filteredBookings={filteredBookings}
              paginatedBookings={paginatedBookings}
              bookingSearchTerm={bookingSearchTerm}
              bookingDateFilter={bookingDateFilter}
              sortState={sortState}
              currentBookingsPage={currentBookingsPage}
              totalBookingsPages={totalBookingsPagesCalc}
              bookingsStartIndex={bookingsStartIndexCalc}
              bookingsEndIndex={bookingsEndIndexCalc}
              bookingsPerPage={bookingsPerPage}
              onBookingSearchChange={setBookingSearchTerm}
              onBookingDateFilterChange={setBookingDateFilter}
              onSortChange={handleSort}
              onBookingPageChange={setCurrentBookingsPage}
              onBookingsPerPageChange={setBookingsPerPage}
              onAddBooking={handleAddBooking}
              onEditBooking={handleEditBooking}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
                <CalendarComponent 
                  bookings={bookings}
              onBookingClick={(booking) => handleEditBooking(booking)}
              onAddBooking={() => handleAddBooking()}
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab
              users={users}
              filteredUsers={filteredUsers}
              paginatedUsers={paginatedUsers}
              userSearchTerm={userSearchTerm}
              currentUsersPage={currentUsersPage}
              totalUsersPages={totalUsersPagesCalc}
              usersStartIndex={usersStartIndexCalc}
              usersEndIndex={usersEndIndexCalc}
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
              totalServicesPages={totalServicesPagesCalc}
              servicesStartIndex={servicesStartIndexCalc}
              servicesEndIndex={servicesEndIndexCalc}
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
            <AnalyticsTab />
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <AdminsTab />
          )}

          {/* Bug Tracker Tab */}
          {activeTab === 'bugTracker' && (
            <BugTracker 
              onClose={() => changeTab('bookings')}
            />
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

      {/* Modals */}
      <AdminModals />
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminStateProvider>
        <AdminPageContent />
      </AdminStateProvider>
    </Suspense>
  )
} 
