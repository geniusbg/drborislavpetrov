'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { Booking, User as UserType, Service as ServiceType } from '@/types/global'
import { useAdminState, type SortField, type SortState } from '@/contexts/AdminStateContext'
import { useAdminData } from '@/hooks/useAdminData'

export function useAdminEventHandlers() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loadBookings, loadUsers, loadServices } = useAdminData()
  
  const {
    bookings,
    setBookings,
    setShowUserModal,
    setShowBookingModal,
    setShowServiceModal,
    setEditingUser,
    setEditingBooking,
    setEditingService,
    setSortState
  } = useAdminState()

  // Function to change tabs with browser history
  const changeTab = (tab: string) => {
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

  // Handle sort change
  const handleSort = (field: SortField) => {
    setSortState((prev: SortState) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

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

  const handleDeleteBooking = async (id: number | string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази резервация?')) return

    try {
      const adminToken = localStorage.getItem('adminToken')
      // Convert id to string for API (API expects string in query params)
      const idString = typeof id === 'number' ? id.toString() : id
      const response = await fetch(`/api/admin/bookings?id=${idString}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        }
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
        setBookings(bookings.map(booking => 
          booking.id?.toString() === id.toString() ? { ...booking, status } : booking
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

  return {
    changeTab,
    handleSort,
    handleSettingsClick,
    handleLogout,
    handleAddBooking,
    handleEditBooking,
    handleDeleteBooking,
    handleUpdateBookingStatus,
    handleUpdateBookingNotes,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleViewUserHistory,
    handleAddService,
    handleEditService,
    handleDeleteService
  }
}
