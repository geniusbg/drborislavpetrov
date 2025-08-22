'use client'

// ✅ OPTIMIZED: DailySchedule is now the ONLY component managing bookings
// AdminPage no longer has booking logic, eliminating conflicts

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { User, Phone, Calendar, X, Edit, Plus } from 'lucide-react'
import BookingForm from './BookingForm'
import { useSocket } from '@/hooks/useSocket'
import type { Booking, WorkingHours } from '@/types/global'
import { getBulgariaTime, formatBulgariaDate, getBulgariaDateStringDB } from '@/lib/bulgaria-time'

interface DailyScheduleProps {
  date: string
  onClose: () => void
  onEditWorkingHours: () => void
  onEditBooking?: (booking: Booking) => void
  onDeleteBooking?: (bookingId: string) => void
}

const DailySchedule = ({ date, onClose, onEditWorkingHours, onEditBooking, onDeleteBooking }: DailyScheduleProps) => {
  const [schedule, setSchedule] = useState<{
    date: string
    workingHours: WorkingHours
    bookings: Booking[]
    totalBookings: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const modalOpenCount = useRef(0)
  const [services, setServices] = useState<{id: number, name: string}[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})
  
  // WebSocket connection for real-time updates
  const { socket, isConnected, isSupported, joinAdmin } = useSocket()

  const loadDailySchedule = useCallback(async () => {
    try {
      setLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      
      console.log('📅 DailySchedule: loadDailySchedule called with date:', date, 'at:', getBulgariaTime().toISOString())
      console.log('📅 DailySchedule: Stack trace:', new Error().stack)
      console.log('📅 DailySchedule: showBookingForm:', showBookingForm)
      
      // Load both schedule and services
      const [scheduleResponse, servicesResponse] = await Promise.all([
        fetch(`/api/admin/daily-schedule?date=${date}`, {
          headers: {
            'x-admin-token': adminToken || 'test'
          }
        }),
        fetch('/api/admin/services', {
          headers: {
            'x-admin-token': adminToken || 'test'
          }
        })
      ])

      if (scheduleResponse.ok) {
        const scheduleData = await scheduleResponse.json()
        setSchedule(scheduleData)
        console.log('📅 DailySchedule: Schedule loaded successfully')
      }
      
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json()
        setServices(servicesData.services)
        console.log('📅 DailySchedule: Services loaded successfully')
      }
    } catch (error) {
      console.error('Error loading daily schedule:', error)
    } finally {
      setLoading(false)
    }
  }, [date, showBookingForm])

  // Add debouncing to prevent excessive API calls
  const [lastLoadTime, setLastLoadTime] = useState(0)
  const LOAD_DEBOUNCE_DELAY = 2000 // 2 seconds

  useEffect(() => {
    // Don't reload schedule if booking form is open or closing
    if (!showBookingForm && !isModalClosing) {
      const now = Date.now()
      if (now - lastLoadTime > LOAD_DEBOUNCE_DELAY) {
        setLastLoadTime(now)
        loadDailySchedule()
      }
    }
  }, [date, showBookingForm, isModalClosing, lastLoadTime, loadDailySchedule])

  // Update current time every second
  useEffect(() => {
    // Set initial time to avoid hydration mismatch
    setCurrentTime(getBulgariaTime())
    
    const timer = setInterval(() => {
      setCurrentTime(getBulgariaTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Handle Escape key for closing modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBookingForm) {
          handleBookingCancel()
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showBookingForm, onClose])



  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      // Only join admin once per component mount
      joinAdmin()
      
      // Listen for booking updates for this specific date
      const handleBookingAdded = (newBooking: Booking) => {
        console.log('📅 DailySchedule: handleBookingAdded called with:', newBooking)
        if (newBooking.date !== date) return

        setSchedule(prev => {
          if (!prev) return null
          // Deduplicate by id to avoid duplicate keys and double rendering
          const withoutSame = prev.bookings.filter(b => b.id !== newBooking.id)
          const updatedBookings = [...withoutSame, newBooking]
          return {
            ...prev,
            bookings: updatedBookings,
            totalBookings: updatedBookings.length
          }
        })

        if (showBookingForm) {
          console.log('📅 DailySchedule: Closing modal after booking added via WebSocket')
          setIsModalClosing(true)
          setShowBookingForm(false)
          setEditingBooking(null)
          setTimeout(() => setIsModalClosing(false), 500)
        }
        console.log('📅 DailySchedule: Booking added, modal should stay closed')
      }

      const handleBookingUpdated = (updatedBooking: Booking) => {
        console.log('📅 DailySchedule: handleBookingUpdated called with:', updatedBooking)
        setSchedule(prev => {
          if (!prev) return null
          const replaced = prev.bookings.map(booking => (
            booking.id === updatedBooking.id ? updatedBooking : booking
          ))
          // Deduplicate by id-time-duration triple
          const seen = new Set<string>()
          const deduped = replaced.filter(b => {
            const k = `${b.id}-${b.time}-${b.serviceDuration || 30}`
            if (seen.has(k)) return false
            seen.add(k)
            return true
          })
          return { ...prev, bookings: deduped }
        })
      }

      const handleBookingDeleted = (bookingId: string) => {
        setSchedule(prev => prev ? {
          ...prev,
          bookings: prev.bookings.filter(booking => booking.id !== bookingId),
          totalBookings: Math.max(0, prev.totalBookings - 1)
        } : null)
      }

      const handleWorkingHoursUpdated = () => {
        // Reload the schedule when working hours are updated
        loadDailySchedule()
      }

      socket.on('booking-added', handleBookingAdded)
      socket.on('booking-updated', handleBookingUpdated)
      socket.on('booking-deleted', handleBookingDeleted)
      socket.on('working-hours-updated', handleWorkingHoursUpdated)

      return () => {
        socket.off('booking-added', handleBookingAdded)
        socket.off('booking-updated', handleBookingUpdated)
        socket.off('booking-deleted', handleBookingDeleted)
        socket.off('working-hours-updated', handleWorkingHoursUpdated)
      }
    }
  }, [socket, isConnected, isSupported, date, joinAdmin, loadDailySchedule])

  const getTimeSlots = () => {
    if (!schedule?.workingHours) return []

    const slots = []
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    const breaks = schedule.workingHours.breaks || []
    
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMinute = parseInt(endTime.split(':')[1])

    let currentHour = startHour
    let currentMinute = startMinute

    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      
      // Check if this time is during any break
      const isBreak = breaks.some(breakItem => {
        const breakStartHour = parseInt(breakItem.startTime.split(':')[0])
        const breakStartMinute = parseInt(breakItem.startTime.split(':')[1])
        const breakEndHour = parseInt(breakItem.endTime.split(':')[0])
        const breakEndMinute = parseInt(breakItem.endTime.split(':')[1])
        
        return (
          (currentHour > breakStartHour || (currentHour === breakStartHour && currentMinute >= breakStartMinute)) &&
          (currentHour < breakEndHour || (currentHour === breakEndHour && currentMinute < breakEndMinute))
        )
      })

      // Find booking that starts at this time or covers this time slot
      const booking = schedule.bookings.find(b => {
        if (b.time === timeString) {
          return true // Exact match
        }
        
        // Check if this time slot is covered by a longer booking
        const [bookingHour, bookingMinute] = b.time.split(':').map(Number)
        const bookingStartMinutes = bookingHour * 60 + bookingMinute
        const bookingDuration = b.serviceDuration || 30
        const bookingEndMinutes = bookingStartMinutes + bookingDuration
        
        const [slotHour, slotMinute] = timeString.split(':').map(Number)
        const slotMinutes = slotHour * 60 + slotMinute
        
        // Check if this slot is within the booking's time range
        return slotMinutes >= bookingStartMinutes && slotMinutes < bookingEndMinutes
      })
      
      slots.push({
        time: timeString,
        isBreak,
        booking
      })

      // Move to next 15-minute slot
      currentMinute += 15
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour++
      }
    }

    return slots
  }

  const getCurrentTimePosition = useCallback(() => {
    if (!schedule?.workingHours || !currentTime) return null
    
    const currentHour = currentTime.getHours()
    const currentMinute = currentTime.getMinutes()
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    // Check if we're viewing today's schedule using Bulgaria time
    const today = getBulgariaDateStringDB()
    
    if (date !== today) {
      return null
    }
    
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMinute = parseInt(endTime.split(':')[1])
    
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    const currentTotalMinutes = currentHour * 60 + currentMinute
    
    // Show marker even if outside working hours for today
    if (date === today) {
      const totalDuration = endTotalMinutes - startTotalMinutes
      const elapsed = currentTotalMinutes - startTotalMinutes
      let percentage = (elapsed / totalDuration) * 100
      
      // If outside working hours, clamp to timeline bounds
      if (currentTotalMinutes < startTotalMinutes) {
        percentage = 0
      } else if (currentTotalMinutes > endTotalMinutes) {
        percentage = 100
      }
      
      return {
        time: currentTimeString,
        percentage: Math.min(Math.max(percentage, 0), 100)
      }
    }
    
    return null
  }, [currentTime, schedule, date])

  const getSlotStartPercentage = (time: string) => {
    if (!schedule?.workingHours) return 0
    const [hour, minute] = time.split(':').map(Number)
    const totalMinutes = hour * 60 + minute
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const totalDurationMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) - startTimeMinutes
    const slotStartPercentage = ((totalMinutes - startTimeMinutes) / totalDurationMinutes) * 100
    return slotStartPercentage
  }

  const getSlotEndPercentage = (time: string) => {
    if (!schedule?.workingHours) return 0
    const [hour, minute] = time.split(':').map(Number)
    const totalMinutes = hour * 60 + minute
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const totalDurationMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) - startTimeMinutes
    const slotEndPercentage = ((totalMinutes - startTimeMinutes) / totalDurationMinutes) * 100
    return slotEndPercentage
  }

  const getBreakStartPercentage = (breakStartTime?: string) => {
    if (!schedule?.workingHours) return 0
    const breakStart = breakStartTime || (schedule.workingHours.breaks && schedule.workingHours.breaks.length > 0 ? schedule.workingHours.breaks[0].startTime : '12:00')
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    const [hour, minute] = breakStart.split(':').map(Number)
    const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const totalDurationMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) - startTimeMinutes
    const breakStartPercentage = ((hour * 60 + minute - startTimeMinutes) / totalDurationMinutes) * 100
    return breakStartPercentage
  }

  const getBreakEndPercentage = (breakEndTime?: string) => {
    if (!schedule?.workingHours) return 0
    const breakEnd = breakEndTime || (schedule.workingHours.breaks && schedule.workingHours.breaks.length > 0 ? schedule.workingHours.breaks[0].endTime : '13:00')
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    const [hour, minute] = breakEnd.split(':').map(Number)
    const startTimeMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const totalDurationMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) - startTimeMinutes
    const breakEndPercentage = ((hour * 60 + minute - startTimeMinutes) / totalDurationMinutes) * 100
    return breakEndPercentage
  }

  const handleEditBooking = (booking: Booking) => {
    const actionKey = `edit-${booking.id}`
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }))
    
    if (showBookingForm || isModalClosing) {
      console.log('📅 DailySchedule: Modal already open or closing, not opening again for edit')
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
      return
    }
    
    setEditingBooking(booking)
    setShowBookingForm(true)
    
    // Изчистваме loading след малко закъснение за да се види индикаторът
    setTimeout(() => {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
    }, 500)
  }

  const handleDeleteBooking = async (bookingId: string) => {
    const actionKey = `delete-${bookingId}`
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      // Add a small delay to make loading visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const adminToken = localStorage.getItem('adminToken')
      
      console.log('📅 DailySchedule: Fetching booking details for ID:', bookingId)
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        // Update local state immediately for better UX
        setSchedule(prev => prev ? {
          ...prev,
          bookings: prev.bookings.filter(booking => booking.id !== bookingId),
          totalBookings: Math.max(0, prev.totalBookings - 1)
        } : null)
        
        // Close the modal after successful deletion
        setShowBookingForm(false)
        setEditingBooking(null)
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    const actionKey = `status-${booking.id}-${newStatus}`
    setLoadingActions(prev => ({ ...prev, [actionKey]: true }))
    
    try {
      console.log('📅 DailySchedule: Changing status for booking:', booking.id, 'to:', newStatus)
      
      // Add a small delay to make loading visible
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Don't update local state immediately - wait for API response
      
      // Use the full booking update endpoint to preserve serviceDuration
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ 
          id: booking.id,
          status: newStatus,
          // Preserve all existing booking data
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          service: booking.service,
          serviceDuration: booking.serviceDuration,
          date: booking.date,
          time: booking.time,
          message: booking.message
        })
      })
      
      if (response.ok) {
        // Get the updated booking data from response
        const responseData = await response.json()
        
        // Update local state with the full updated booking - only after successful API response
        setSchedule(prev => prev ? {
          ...prev,
          bookings: prev.bookings.map(b => 
            b.id === booking.id ? { 
              ...b, 
              ...responseData.booking, 
              status: newStatus,
              // Ensure serviceDuration is preserved - handle both cases
              serviceDuration: responseData.booking.serviceDuration || responseData.booking.serviceduration || b.serviceDuration || 30
            } : b
          )
        } : null)
      } else {
        console.error('Failed to update booking status:', response.status)
      }
    } catch (error) {
      console.error('Error changing booking status:', error)
    } finally {
      setLoadingActions(prev => ({ ...prev, [actionKey]: false }))
    }
  }

  const handleBookingSubmit = async (bookingData: Partial<Booking>, isStatusOnly: boolean = false) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const isNewBooking = !editingBooking?.id
      
      // Check if booking time conflicts with breaks (only for new bookings or time changes)
      if (!isStatusOnly && bookingData.time) {
        const isAvailable = isTimeSlotAvailable(bookingData.time, bookingData.serviceDuration || 30, editingBooking?.id)
        if (!isAvailable) {
          alert('Избраното време конфликтира с почивка или съществуваща резервация. Моля, изберете друго време.')
          return
        }
      }
      
      console.log('📅 DailySchedule: Submitting booking', { 
        isNewBooking, 
        editingBookingId: editingBooking?.id,
        isStatusOnly,
        bookingDataKeys: Object.keys(bookingData)
      })
      
      let response
      if (isNewBooking) {
        // Create new booking
        const apiData = {
          ...bookingData,
          service: bookingData.service, // Use service ID directly
          serviceDuration: bookingData.serviceDuration || 30
        }
        
        response = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify(apiData)
        })
      } else if (isStatusOnly) {
        // Status-only update - use dedicated endpoint
        response = await fetch('/api/admin/bookings/status', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify({ 
            id: editingBooking?.id,
            status: bookingData.status 
          })
        })
      } else {
        // Full booking update - use the main endpoint for full updates
        const apiData = {
          ...bookingData,
          service: bookingData.service, // Use service ID directly
          serviceDuration: bookingData.serviceDuration || 30
        }
        
        response = await fetch('/api/admin/bookings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify({ 
            ...apiData, 
            id: editingBooking?.id 
          })
        })
      }
      
      if (response.ok) {
        const result = await response.json()
        
        // Update local state immediately for better UX
        if (isNewBooking) {
          // Add new booking to local state
          const newBooking = {
            id: result.id,
            name: bookingData.name || '',
            phone: bookingData.phone || '',
            serviceName: getServiceName(bookingData.service || ''),
            serviceDuration: bookingData.serviceDuration || 30,
            time: bookingData.time || '',
            status: 'pending',
            date: bookingData.date || date,
            email: bookingData.email || '',
            service: bookingData.service || ''
          }
          
          setSchedule(prev => prev ? {
            ...prev,
            bookings: [...prev.bookings, newBooking],
            totalBookings: prev.totalBookings + 1
          } : null)
        } else {
          // Update existing booking in local state
          setSchedule(prev => prev ? {
            ...prev,
            bookings: prev.bookings.map(booking => 
              booking.id === editingBooking?.id 
                ? {
                    ...booking,
                    name: bookingData.name || booking.name,
                    phone: bookingData.phone || booking.phone,
                    serviceName: getServiceName(bookingData.service || ''),
                    serviceDuration: bookingData.serviceDuration || booking.serviceDuration,
                    time: bookingData.time || booking.time,
                    date: bookingData.date || booking.date,
                    email: bookingData.email || booking.email,
                    service: bookingData.service || booking.service
                  }
                : booking
            )
          } : null)
        }
        
        console.log('📅 DailySchedule: Closing modal after successful submission')
        setIsModalClosing(true)
        setShowBookingForm(false)
        setEditingBooking(null)
        
        // Reduced delay since AdminPage no longer interferes
        setTimeout(() => {
          console.log('📅 DailySchedule: Modal should be closed now, count:', modalOpenCount.current)
          setIsModalClosing(false)
        }, 500)
      }
    } catch (error) {
      console.error('Error saving booking:', error)
    }
  }

  const handleBookingCancel = () => {
    setIsModalClosing(true)
    setShowBookingForm(false)
    setEditingBooking(null)
    
    // Reduced delay since AdminPage no longer interferes
    setTimeout(() => {
      setIsModalClosing(false)
    }, 500)
  }

  const handleAddNewBooking = () => {
    console.log('📅 DailySchedule: handleAddNewBooking called for date:', date)
    if (showBookingForm || isModalClosing) {
      console.log('📅 DailySchedule: Modal already open or closing, not opening again')
      return
    }
    modalOpenCount.current++
    console.log('📅 DailySchedule: Opening modal, count:', modalOpenCount.current)
    
    // Създаваме нова резервация с автоматично попълнена дата
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
      date: date // Автоматично попълваме датата от дневния график
    })
    setShowBookingForm(true)
  }

  const getServiceName = (serviceId: string | number) => {
    const service = services.find(s => s.id.toString() === serviceId.toString())
    return service?.name || 'Услуга'
  }

  // Removed unused helper getServiceIdByName

  // Функция за проверка дали часът е свободен
  const isTimeSlotAvailable = (time: string, duration: number = 30, excludeBookingId?: string) => {
    if (!schedule?.bookings) return true
    
    const [hours, minutes] = time.split(':').map(Number)
    const startTimeMinutes = hours * 60 + minutes
    const endTimeMinutes = startTimeMinutes + duration
    
    // Провери дали времето е в почивка
    if (schedule?.workingHours?.breaks) {
      for (const breakItem of schedule.workingHours.breaks) {
        const [breakStartHour, breakStartMinute] = breakItem.startTime.split(':').map(Number)
        const [breakEndHour, breakEndMinute] = breakItem.endTime.split(':').map(Number)
        const breakStartMinutes = breakStartHour * 60 + breakStartMinute
        const breakEndMinutes = breakEndHour * 60 + breakEndMinute
        
        // Провери дали има припокриване с почивка
        if (
          (startTimeMinutes >= breakStartMinutes && startTimeMinutes < breakEndMinutes) ||
          (endTimeMinutes > breakStartMinutes && endTimeMinutes <= breakEndMinutes) ||
          (startTimeMinutes <= breakStartMinutes && endTimeMinutes >= breakEndMinutes)
        ) {
          return false
        }
      }
    }
    
    for (const booking of schedule.bookings) {
      // Пропусни отменените резервации - те освобождават времето
      if (booking.status === 'cancelled') {
        continue
      }
      
      // Пропусни текущата резервация ако редактираме
      if (excludeBookingId && booking.id === excludeBookingId) {
        continue
      }
      
      const [bookingHours, bookingMinutes] = booking.time.split(':').map(Number)
      const bookingStartMinutes = bookingHours * 60 + bookingMinutes
      const bookingDuration = booking.serviceDuration || 30
      const bookingEndMinutes = bookingStartMinutes + bookingDuration
      
      // Провери дали има припокриване
      if (
        (startTimeMinutes >= bookingStartMinutes && startTimeMinutes < bookingEndMinutes) ||
        (endTimeMinutes > bookingStartMinutes && endTimeMinutes <= bookingEndMinutes) ||
        (startTimeMinutes <= bookingStartMinutes && endTimeMinutes >= bookingEndMinutes)
      ) {
        return false
      }
    }
    
    return true
  }

  // Функция за получаване на свободни часове
  const getAvailableTimeSlots = () => {
    if (!schedule?.workingHours) return []
    
    const slots = []
    const startTime = schedule.workingHours.startTime || '09:00'
    const endTime = schedule.workingHours.endTime || '18:00'
    
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    let currentHour = startHour
    let currentMinute = startMinute
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      
      // Провери дали часът е свободен за стандартна услуга (30 мин)
      if (isTimeSlotAvailable(timeString, 30)) {
        slots.push(timeString)
      }
      
      currentMinute += 15
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour++
      }
    }
    
    return slots
  }

  const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = (clickX / rect.width) * 100
    
    // Convert percentage back to time
    const startTime = schedule?.workingHours.startTime || '09:00'
    const endTime = schedule?.workingHours.endTime || '18:00'
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = parseInt(endTime.split(':')[0])
    const endMinute = parseInt(endTime.split(':')[1])
    
    const startTotalMinutes = startHour * 60 + startMinute
    const endTotalMinutes = endHour * 60 + endMinute
    const totalDuration = endTotalMinutes - startTotalMinutes
    
    const clickedMinutes = startTotalMinutes + (percentage / 100) * totalDuration
    const clickedHour = Math.floor(clickedMinutes / 60)
    const clickedMinute = Math.floor(clickedMinutes % 60)
    
    // Round to nearest 15 minutes
    const roundedMinute = Math.round(clickedMinute / 15) * 15
    const finalHour = roundedMinute === 60 ? clickedHour + 1 : clickedHour
    const finalMinute = roundedMinute === 60 ? 0 : roundedMinute
    
    const selectedTime = `${finalHour.toString().padStart(2, '0')}:${finalMinute.toString().padStart(2, '0')}`
    
    // Check if this time is available (not during a break and not already booked)
    const isDuringBreak = schedule?.workingHours.breaks?.some(breakItem => {
      const breakStart = breakItem.startTime
      const breakEnd = breakItem.endTime
      return selectedTime >= breakStart && selectedTime < breakEnd
    })
    
    const isAlreadyBooked = schedule?.bookings?.some(booking => 
      booking.time === selectedTime && booking.status !== 'cancelled'
    )
    
    if (isDuringBreak) {
      alert('Избраното време е в почивка. Моля, изберете друго време.')
      return
    }
    
    if (!isAlreadyBooked) {
      // Set the selected time and open booking form for new booking
      // Only open if modal is not already open or closing
      if (!showBookingForm && !isModalClosing) {
        setEditingBooking({
          id: '',
          name: '',
          phone: '',
          service: '',
          serviceName: '',
          serviceDuration: 30,
          time: selectedTime,
          status: 'pending',
          date: date
        })
        setShowBookingForm(true)
      }
    } else {
      // Find the existing booking and open edit form
      const existingBooking = schedule?.bookings?.find(booking => booking.time === selectedTime)
      if (existingBooking && !showBookingForm && !isModalClosing) {
        setEditingBooking(existingBooking)
        setShowBookingForm(true)
      }
    }
  }

  const timeSlots = getTimeSlots()
  const currentTimePosition = useMemo(() => getCurrentTimePosition(), [getCurrentTimePosition])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-center mt-2">Зареждане...</p>
        </div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className="text-center">Грешка при зареждане на графика</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-md"
          >
            Затвори
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              График за {formatBulgariaDate(new Date(date), { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <p className="text-gray-600 mt-1">
              {schedule.totalBookings} резервации
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onEditWorkingHours}
              className="px-3 py-2 text-sm font-medium text-primary-700 bg-primary-100 rounded-md hover:bg-primary-200 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Промени работно време</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {!schedule.workingHours.isWorkingDay ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center py-6">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Почивен ден</h3>
              {schedule.workingHours.notes && (
                <p className="text-gray-600">{schedule.workingHours.notes}</p>
              )}
            </div>
            
            {/* Извънредни резервации */}
            {schedule.bookings.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Извънредни резервации</h4>
                  <button
                    onClick={handleAddNewBooking}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добави резервация</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {schedule.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`p-4 rounded-lg border ${
                        booking.status === 'cancelled' 
                          ? 'bg-red-50 border-red-200' 
                          : booking.status === 'pending'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {booking.time}
                          </span>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{booking.name}</span>
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{booking.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {booking.serviceName || getServiceName(booking.service || '')}
                            </div>
                            <div className="text-xs text-gray-500">
                              до {(() => {
                                const [hours, minutes] = booking.time.split(':').map(Number)
                                const duration = booking.serviceDuration || 30
                                const endTimeInMinutes = hours * 60 + minutes + duration
                                const endHour = Math.floor(endTimeInMinutes / 60) % 24
                                const endMinute = endTimeInMinutes % 60
                                return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
                              })()}
                            </div>
                            {booking.status === 'cancelled' && (
                              <span className="text-xs text-red-600 font-medium">Отменена</span>
                            )}
                          </div>
                          {onEditBooking && (
                            <button
                              onClick={() => handleEditBooking(booking)}
                              disabled={loadingActions[`edit-${booking.id}`]}
                              className={`p-2 text-gray-500 hover:text-blue-600 transition-colors rounded ${loadingActions[`edit-${booking.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title="Редактирай резервация"
                            >
                              {loadingActions[`edit-${booking.id}`] ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Edit className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      {booking.message && (
                        <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                          {booking.message}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">Няма извънредни резервации за този ден</p>
                <button
                  onClick={handleAddNewBooking}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добави извънредна резервация</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Time slots */}
            <div className="space-y-4 max-h-80 overflow-y-auto overscroll-contain">
              {/* Timeline with Hour Markers */}
              <div className="relative">
                {/* Timeline Bar */}
                <div 
                  className="relative bg-gray-200 rounded-lg h-20 cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={handleTimelineClick}
                  title="Кликнете за добавяне на резервация в този час"
                >
                  {/* Available Time Slots - Show as light green background */}
                    {getAvailableTimeSlots().map((timeSlot) => {
                    const slotStartPercentage = getSlotStartPercentage(timeSlot)
                    const slotEndTime = new Date(`2000-01-01T${timeSlot}`)
                    slotEndTime.setMinutes(slotEndTime.getMinutes() + 30)
                    const slotEndTimeString = slotEndTime.toTimeString().slice(0, 5)
                    const slotEndPercentage = getSlotStartPercentage(slotEndTimeString)
                    
                    return (
                      <div
                        key={`available-${timeSlot}`}
                        className="absolute bg-green-100 border border-green-200 h-full rounded opacity-60 hover:opacity-80 transition-opacity cursor-pointer z-5"
                        style={{
                          left: `${slotStartPercentage}%`,
                          width: `${slotEndPercentage - slotStartPercentage}%`
                        }}
                        title={`Свободен час: ${timeSlot}`}
                        onClick={() => {
                          // Auto-fill the time when clicking on available slot
                          if (showBookingForm) {
                            setEditingBooking(prev => prev ? {
                              ...prev,
                              time: timeSlot
                            } : null)
                          } else {
                            handleAddNewBooking()
                            // Set the time after form opens
                            setTimeout(() => {
                              setEditingBooking(prev => prev ? {
                                ...prev,
                                time: timeSlot
                              } : null)
                            }, 100)
                          }
                        }}
                      >
                        <div className="flex items-center justify-center h-full text-xs text-green-700 font-medium">
                          ✓
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Time Markers - Every 30 minutes */}
                  {(() => {
                    const startHour = parseInt(schedule.workingHours.startTime?.split(':')[0] || '9')
                    const startMinute = parseInt(schedule.workingHours.startTime?.split(':')[1] || '0')
                    const endHour = parseInt(schedule.workingHours.endTime?.split(':')[0] || '18')
                    const endMinute = parseInt(schedule.workingHours.endTime?.split(':')[1] || '0')
                    const markers = []
                    
                    let currentHour = startHour
                    let currentMinute = startMinute
                    
                    while (
                      currentHour < endHour || 
                      (currentHour === endHour && currentMinute <= endMinute)
                    ) {
                      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
                      const percentage = getSlotStartPercentage(timeString)
                      const isFullHour = currentMinute === 0
                      
                      markers.push(
                        <div
                          key={timeString}
                          className={`absolute top-0 bottom-0 z-10 ${
                            isFullHour ? 'w-0.5 bg-gray-700' : 'w-0.5 bg-gray-400'
                          }`}
                          style={{ left: `${percentage}%` }}
                        >
                          {/* Hour marker line */}
                          <div className="absolute top-0 bottom-0 w-full"></div>
                          
                          {/* Hour text below timeline */}
                          <div className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-white px-1 py-0.5 rounded shadow-sm z-20 border ${
                            isFullHour ? 'text-gray-900 border-gray-300' : 'text-gray-600 border-gray-200'
                          }`}>
                            {timeString}
                          </div>
                        </div>
                      )
                      
                      // Move to next 30-minute slot
                      currentMinute += 30
                      if (currentMinute >= 60) {
                        currentMinute = 0
                        currentHour++
                      }
                    }
                    return markers
                  })()}
                  
                                     {/* Break Periods - Show all breaks */}
                   {schedule.workingHours.breaks && schedule.workingHours.breaks.map((breakItem, breakIndex) => {
                     const breakStartPercentage = getBreakStartPercentage(breakItem.startTime)
                     const breakEndPercentage = getBreakEndPercentage(breakItem.endTime)
                     
                                           // Alternate break colors - Better contrast
                      const breakColors = [
                        { bg: 'bg-red-400', text: 'text-white', border: 'border-red-500' },
                        { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
                        { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' }
                      ]
                     
                     const colorIndex = breakIndex % breakColors.length
                     const colors = breakColors[colorIndex]
                     
                                           return (
                        <div 
                          key={breakIndex}
                          className={`absolute ${colors.bg} h-full border-2 ${colors.border} rounded cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{
                            left: `${breakStartPercentage}%`,
                            width: `${breakEndPercentage - breakStartPercentage}%`
                          }}
                          title={`Почивка: ${breakItem.startTime} - ${breakItem.endTime}. Кликнете за редактиране`}
                          onClick={() => {
                            // Open working hours form to edit breaks
                            onEditWorkingHours()
                          }}
                        >
                          {/* Gradient overlay for breaks */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded"></div>
                          
                          <div className={`flex items-center justify-center h-full text-xs ${colors.text} font-medium relative z-10`}>
                            {breakItem.description || 'Почивка'}
                          </div>
                        </div>
                      )
                   })}
                  
                                                                         {/* Bookings */}
                  {(() => {
                    // Get all bookings including cancelled ones to show as markers
                    const allBookings = schedule.bookings
                    
                    return allBookings.map((booking) => {
                      // Check if booking is within working hours
                      const [bookingHour, bookingMinute] = booking.time.split(':').map(Number)
                      const [startHour, startMinute] = (schedule.workingHours.startTime || '09:00').split(':').map(Number)
                      const [endHour, endMinute] = (schedule.workingHours.endTime || '18:00').split(':').map(Number)
                      
                      const bookingTimeMinutes = bookingHour * 60 + bookingMinute
                      const startTimeMinutes = startHour * 60 + startMinute
                      const endTimeMinutes = endHour * 60 + endMinute
                      
                      // Skip bookings outside working hours
                      if (bookingTimeMinutes < startTimeMinutes || bookingTimeMinutes >= endTimeMinutes) {
                        return null
                      }
                      
                      const slotStart = getSlotStartPercentage(booking.time)
                      
                      // Calculate end time based on service duration
                      const startTime = new Date(`2000-01-01T${booking.time}`)
                      const endTime = new Date(startTime.getTime() + (booking.serviceDuration || 30) * 60000)
                      const endTimeString = endTime.toTimeString().slice(0, 5)
                      
                      // Calculate the actual end position based on service duration
                      const actualEndPercentage = getSlotStartPercentage(endTimeString)
                      
                      // Status-based colors for bookings
                      let colors
                      if (booking.status === 'pending') {
                        colors = { bg: 'bg-yellow-500', border: 'border-yellow-400', hover: 'hover:bg-yellow-600', indicator: 'bg-yellow-700' }
                      } else if (booking.status === 'cancelled') {
                        // Cancelled bookings show as subtle markers
                        colors = { bg: 'bg-gray-300', border: 'border-gray-400', hover: 'hover:bg-gray-400', indicator: 'bg-gray-600' }
                      } else {
                        colors = { bg: 'bg-blue-500', border: 'border-blue-400', hover: 'hover:bg-blue-600', indicator: 'bg-blue-700' }
                      }
                      
                      return (
                        <div
                          key={`timeline-booking-${booking.id}-${date}-${booking.time}`}
                          className={`absolute ${colors.bg} ${booking.status === 'cancelled' ? 'h-full opacity-60' : 'h-full'} rounded cursor-pointer ${colors.hover} transition-all duration-300 shadow-lg border-2 ${colors.border} transform hover:scale-[1.02] hover:shadow-xl ${booking.status === 'cancelled' ? 'z-10' : 'z-30'}`}
                          style={{
                            left: `${slotStart}%`,
                            width: `${actualEndPercentage - slotStart}%`
                          }}
                          title={booking.status === 'cancelled' 
                            ? `ОТМЕНЕНА: ${booking.name} - ${getServiceName(booking.service || '')}. Начало: ${booking.time}. Край: ${endTimeString}. Кликнете за нова резервация на това място`
                            : `${booking.name} - ${getServiceName(booking.service || '')}. Начало: ${booking.time}. Край: ${endTimeString}. Кликнете за редактиране`
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            if (booking.status === 'cancelled') {
                              // For cancelled bookings, create new booking at this time
                              setEditingBooking({
                                id: '',
                                name: '',
                                phone: '',
                                service: '',
                                serviceName: '',
                                serviceDuration: 30,
                                time: booking.time,
                                status: 'pending',
                                date: date
                              })
                              setShowBookingForm(true)
                            } else {
                              handleEditBooking(booking)
                            }
                          }}
                        >
                         {/* Gradient overlay for better visual appeal */}
                         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded"></div>
                         
                                                     {/* Start Time Indicator */}
                          <div className={`absolute left-0 top-0 bottom-0 w-2 ${colors.indicator} rounded-l shadow-lg`}>
                            <div className="absolute -top-2 -left-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <div className={`w-2 h-2 ${colors.indicator} rounded-full`}></div>
                            </div>
                          </div>
                          
                          {/* End Time Indicator */}
                          <div className={`absolute right-0 top-0 bottom-0 w-2 ${colors.indicator} rounded-r shadow-lg`}>
                            <div className="absolute -top-2 -right-1 w-4 h-4 bg-white rounded-full border-2 border-gray-300 flex items-center justify-center">
                              <div className={`w-2 h-2 ${colors.indicator} rounded-full`}></div>
                            </div>
                          </div>
                         
                         {/* Booking Content */}
                         <div className={`flex flex-col items-center justify-center h-full text-xs ${booking.status === 'cancelled' ? 'text-gray-700' : 'text-white'} font-medium px-1 relative z-10`}>
                           <div className="font-bold text-center drop-shadow-sm">
                             {booking.time}
                           </div>
                           {booking.status === 'cancelled' ? (
                             <div className="text-xs text-center leading-tight font-medium">
                               <div className="line-through opacity-75">{booking.name}</div>
                               <div className="text-red-600 font-bold">ОТМЕНЕНА</div>
                               <div className="text-green-600 text-xs">Кликни за нова</div>
                             </div>
                           ) : (
                             <>
                               <div className="text-xs text-center leading-tight font-medium">
                                 {booking.name}
                               </div>
                               <div className="text-xs opacity-90 text-center">
                                 {endTimeString}
                               </div>
                               
                               {/* Status Change Buttons - Only show for active bookings */}
                               <div className="flex space-x-1 mt-1">
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleStatusChange(booking, 'confirmed')
                                   }}
                                   disabled={loadingActions[`status-${booking.id}-confirmed`]}
                                   className={`px-1 py-0.5 text-xs rounded ${booking.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-white/20 text-white hover:bg-green-600'} ${loadingActions[`status-${booking.id}-confirmed`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   title="Потвърди"
                                 >
                                   {loadingActions[`status-${booking.id}-confirmed`] ? '⏳' : '✓'}
                                 </button>
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation()
                                     handleStatusChange(booking, 'cancelled')
                                   }}
                                   disabled={loadingActions[`status-${booking.id}-cancelled`]}
                                   className={`px-1 py-0.5 text-xs rounded ${booking.status === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white/20 text-white hover:bg-red-600'} ${loadingActions[`status-${booking.id}-cancelled`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   title="Отмени"
                                 >
                                   {loadingActions[`status-${booking.id}-cancelled`] ? '⏳' : '✕'}
                                 </button>
                               </div>
                             </>
                           )}
                         </div>
                         
                         {/* Enhanced Hover Effect */}
                         <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-all duration-300 rounded"></div>
                       </div>
                     )
                   })
                 })()}
                  
                                     {/* Available Time Slots - Show clickable areas */}
                   {timeSlots.map((slot) => {
                     if (!slot.booking && !slot.isBreak) {
                       const slotStart = getSlotStartPercentage(slot.time)
                       const slotEnd = getSlotEndPercentage(slot.time)
                       
                       return (
                         <div
                            key={`available-${slot.time}`}
                           className="absolute bg-green-100 border-2 border-dashed border-green-300 h-full opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                           style={{
                             left: `${slotStart}%`,
                             width: `${slotEnd - slotStart}%`
                           }}
                           title={`Свободно време: ${slot.time} - кликнете за резервация`}
                         />
                       )
                     }
                     return null
                   })}
                   
                   {/* Current Time Indicator */}
                   {currentTimePosition && (
                     <div 
                       className="absolute top-0 bottom-0 w-2 bg-red-600 z-30 shadow-lg animate-pulse"
                       style={{ left: `${currentTimePosition.percentage}%` }}
                     >
                       <div className="absolute -top-4 -left-4 w-8 h-8 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce">
                         <div className="w-3 h-3 bg-white rounded-full"></div>
                       </div>
                       <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-sm px-3 py-1 rounded whitespace-nowrap shadow-lg font-bold border-2 border-white">
                         {currentTimePosition.time}
                       </div>
                     </div>
                   )}
                </div>
                
                {/* Space for time labels */}
                <div className="h-12"></div>

              </div>
              
              {/* Detailed Bookings List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Резервации за деня</h4>
                  <button
                    onClick={handleAddNewBooking}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добави резервация</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {schedule.bookings.length > 0 ? (
                    schedule.bookings.map((booking) => (
                      <div
                        key={`list-booking-${booking.id}-${date}-${booking.time}`}
                        className={`p-3 rounded-lg border ${
                          booking.status === 'cancelled' 
                            ? 'bg-red-50 border-red-200' 
                            : booking.status === 'pending'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm font-medium">
                              {booking.time}
                            </span>
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-green-600" />
                              <span className="font-medium">
                                {booking.name}
                              </span>
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{booking.phone}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                {booking.serviceName || getServiceName(booking.service || '')}
                              </div>
                              <div className="text-xs text-gray-500">
                                до {(() => {
                                  const [hours, minutes] = booking.time.split(':').map(Number)
                                  const duration = booking.serviceDuration || 30
                                  const endTimeInMinutes = hours * 60 + minutes + duration
                                  const endHour = Math.floor(endTimeInMinutes / 60) % 24
                                  const endMinute = endTimeInMinutes % 60
                                  return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
                                })()}
                              </div>
                              {booking.status === 'cancelled' && (
                                <span className="text-xs text-red-600 font-medium">Отменена</span>
                              )}
                            </div>
                            {(onEditBooking || onDeleteBooking) && (
                              <div className="flex items-center space-x-1">
                                {onEditBooking && (
                                  <button
                                    onClick={() => handleEditBooking(booking)}
                                    disabled={loadingActions[`edit-${booking.id}`]}
                                    className={`p-1 text-gray-500 hover:text-blue-600 transition-colors ${loadingActions[`edit-${booking.id}`] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title="Редактирай резервация"
                                  >
                                    {loadingActions[`edit-${booking.id}`] ? (
                                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <Edit className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                                {/* Remove duplicate delete button - delete is available in the edit modal */}
                              </div>
                            )}
                          </div>
                        </div>
                        {booking.message && (
                          <div className="mt-2 text-xs text-gray-500">
                            {booking.message}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Няма резервации за този ден
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBooking ? 'Редактирай резервация' : 'Нова резервация'}
              </h2>
              <button
                onClick={handleBookingCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <BookingForm
              booking={editingBooking}
              onSubmit={handleBookingSubmit}
              onCancel={handleBookingCancel}
              onDelete={editingBooking?.id ? handleDeleteBooking : undefined}
              isStatusOnly={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default DailySchedule 