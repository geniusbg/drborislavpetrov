'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar as CalendarIcon } from 'lucide-react'
import WorkingHoursForm from './WorkingHoursForm'
import DailySchedule from './DailySchedule'
import { useSocket } from '@/hooks/useSocket'
import type { Booking, WorkingHours } from '@/types/global'
import { emitWorkingHoursUpdated } from '@/lib/socket'
import { getBulgariaTime, getBulgariaDateStringDB, dateToLocalDateString, createCalendarDate, calendarDateToString } from '@/lib/bulgaria-time'

interface CalendarProps {
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
  onAddBooking?: (date: Date) => void
  onNavigateToDailySchedule?: (date: string) => void
  selectedDateFromURL?: string
  onCloseDailySchedule?: () => void
}

const Calendar = ({ bookings, onBookingClick, onAddBooking, onNavigateToDailySchedule, selectedDateFromURL, onCloseDailySchedule }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(getBulgariaTime())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([])
  const [showWorkingHoursForm, setShowWorkingHoursForm] = useState(false)
  const [showDailySchedule, setShowDailySchedule] = useState(false)
  const [selectedWorkingHoursDate, setSelectedWorkingHoursDate] = useState<string>('')
  const [workingHoursFromDailySchedule, setWorkingHoursFromDailySchedule] = useState(false)
  const [dailyScheduleKey, setDailyScheduleKey] = useState(0)
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  
  // Detect screen size and orientation
  useEffect(() => {
    const updateScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsPortrait(window.innerHeight > window.innerWidth)
    }
    
    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    window.addEventListener('orientationchange', updateScreenSize)
    
    return () => {
      window.removeEventListener('resize', updateScreenSize)
      window.removeEventListener('orientationchange', updateScreenSize)
    }
  }, [])
  
  // WebSocket connection for real-time updates
  const { socket, isConnected, isSupported, joinAdmin } = useSocket()

  // Handle date from URL - Block month navigation, only open DailySchedule
  useEffect(() => {
    if (selectedDateFromURL) {
      const date = new Date(selectedDateFromURL)
      if (!isNaN(date.getTime())) {
        // Don't change current month - only set selected date and open DailySchedule
        // setCurrentDate(date) // BLOCKED - only arrow buttons can change months
        setSelectedDate(date)
        setShowDailySchedule(true)
      }
    }
  }, [selectedDateFromURL])



  // Load working hours for current month
  const loadWorkingHours = useCallback(async () => {
    try {
      console.log('📅 Calendar: loadWorkingHours called at:', getBulgariaTime().toISOString())
      const adminToken = localStorage.getItem('adminToken')
          const startDate = dateToLocalDateString(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))
    const endDate = dateToLocalDateString(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))
      
      const response = await fetch(`/api/admin/working-hours?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWorkingHours(data.workingHours)
        console.log('📅 Calendar: Working hours loaded successfully')
      }
    } catch (error) {
      console.error('Error loading working hours:', error)
    }
  }, [currentDate])

  useEffect(() => {
    loadWorkingHours()
  }, [loadWorkingHours])

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      joinAdmin()
      
      // Listen for working hours updates
      socket.on('working-hours-updated', (updatedWorkingHours: WorkingHours) => {
        setWorkingHours(prev => prev.map(wh => 
          wh.date === updatedWorkingHours.date ? updatedWorkingHours : wh
        ))
      })

      socket.on('working-hours-added', (newWorkingHours: WorkingHours) => {
        setWorkingHours(prev => [...prev, newWorkingHours])
      })

      socket.on('working-hours-deleted', (date: string) => {
        setWorkingHours(prev => prev.filter(wh => wh.date !== date))
      })

      return () => {
        socket.off('working-hours-updated')
        socket.off('working-hours-added')
        socket.off('working-hours-deleted')
      }
    }
  }, [socket, isConnected, isSupported, joinAdmin])

  // Deduplicate bookings by id (fallback to date+time+name if no id)
  const uniqueBookings = useMemo(() => {
    const seen = new Set<string>()
    const result: Booking[] = []
    for (const b of bookings) {
      const key = b.id ? String(b.id) : `${b.date}|${b.time}|${b.name || ''}`
      if (seen.has(key)) continue
      seen.add(key)
      result.push(b)
    }
    return result
  }, [bookings])

  // Filter bookings based on status
  const filteredBookings = uniqueBookings.filter(booking => {
    if (statusFilter === 'all') return true
    return booking.status === statusFilter
  })

  // Get current month's first day and last day
  const firstDayOfMonth = createCalendarDate(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = createCalendarDate(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get start of calendar (including previous month's days) - START FROM MONDAY
  const startDate = new Date(firstDayOfMonth)
  const firstDayOfWeek = firstDayOfMonth.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Convert to Monday start
  startDate.setUTCDate(startDate.getUTCDate() - daysToSubtract)
  
  // Get end of calendar (including next month's days) - END ON SUNDAY
  const endDate = new Date(lastDayOfMonth)
  const lastDayOfWeek = lastDayOfMonth.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek // Complete to Sunday
  endDate.setUTCDate(endDate.getUTCDate() + daysToAdd)

  // Generate calendar days
  const calendarDays = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    calendarDays.push(new Date(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  // Group bookings by date
  const bookingsByDate = filteredBookings.reduce((acc, booking) => {
    const date = booking.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(booking)
    return acc
  }, {} as Record<string, Booking[]>)

  const monthNames = [
    'Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни',
    'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'
  ]

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд']

  const isToday = (date: Date) => {
    const today = getBulgariaDateStringDB()
    return calendarDateToString(date) === today
  }

  const isCurrentMonth = (date: Date) => {
    return date.getUTCMonth() === currentDate.getMonth()
  }

  const isSunday = (date: Date) => {
    return date.getUTCDay() === 0 // 0 = Sunday
  }

  const isNonWorkingDay = (date: Date) => {
    const workingHoursData = getWorkingHoursForDate(date)
    // Ако има зададено работно време, използваме него
    if (workingHoursData) {
      return !workingHoursData.isWorkingDay
    }
    // По подразбиране неделя е неработен ден
    return isSunday(date)
  }

  const getBookingsForDate = (date: Date) => {
    const dateString = calendarDateToString(date)
    const bookings = bookingsByDate[dateString] || []
    return bookings
  }

  const getWorkingHoursForDate = (date: Date) => {
    const dateString = calendarDateToString(date)
    return workingHours.find(wh => wh.date === dateString)
  }

  // Функция за определяне на текущата и следващите резервации
  const getRelevantBookings = (date: Date) => {
    const bookings = getBookingsForDate(date)
    if (bookings.length === 0) return []
    
    const bulgariaNow = getBulgariaTime()
    const today = getBulgariaDateStringDB()
    const currentTime = bulgariaNow.getHours() * 60 + bulgariaNow.getMinutes() // в минути
    
    // Сортираме резервациите по време
    const sortedBookings = [...bookings].sort((a, b) => {
      const timeA = a.time.split(':').map(Number)
      const timeB = b.time.split(':').map(Number)
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1])
    })
    
    // Ако датата е днес, търсим текущата резервация
    if (calendarDateToString(date) === today) {
      let currentBookingIndex = -1
      let nextBookingIndex = -1
      
      // Намираме текущата резервация (която е в хода)
      for (let i = 0; i < sortedBookings.length; i++) {
        const booking = sortedBookings[i]
        const [startHours, startMinutes] = booking.time.split(':').map(Number)
        const startTime = startHours * 60 + startMinutes
        
        // Използваме реалната продължителност на услугата
        const duration = booking.serviceDuration || 30 // минути
        const endTime = startTime + duration
        
        // Проверяваме дали резервацията е в хода
        if (currentTime >= startTime && currentTime < endTime) {
          currentBookingIndex = i
          nextBookingIndex = i + 1
          break
        }
        
        // Ако няма текуща, търсим следващата
        if (currentTime < startTime) {
          nextBookingIndex = i
          break
        }
      }
      
      // Ако намерихме текуща резервация
      if (currentBookingIndex >= 0) {
        const result = [sortedBookings[currentBookingIndex]]
        if (nextBookingIndex < sortedBookings.length) {
          result.push(sortedBookings[nextBookingIndex])
        }
        return result
      }
      
      // Ако намерихме следваща резервация
      if (nextBookingIndex >= 0) {
        const result = [sortedBookings[nextBookingIndex]]
        if (nextBookingIndex + 1 < sortedBookings.length) {
          result.push(sortedBookings[nextBookingIndex + 1])
        }
        return result
      }
      
      // Ако няма текуща или следваща, връщаме първите 2
      return sortedBookings.slice(0, 2)
    } else {
      // За други дни връщаме първите 2 резервации
      return sortedBookings.slice(0, 2)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Потвърдена'
      case 'pending':
        return 'Чакаща'
      case 'cancelled':
        return 'Отменена'
      default:
        return status
    }
  }

  // Mobile calendar utilities
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getBookingIndicators = (date: Date) => {
    const bookings = getBookingsForDate(date)
    if (bookings.length === 0) return null

    // For mobile compact view - show only dots
    if (isMobile && isPortrait) {
      return bookings.slice(0, 4).map((booking, index) => ({
        status: booking.status,
        index
      }))
    }

    // For larger screens or landscape - show text info
    return getRelevantBookings(date)
  }

  const getCellHeight = () => {
    if (isMobile && isPortrait) return 'min-h-[60px]'
    if (isMobile) return 'min-h-[80px]'
    return 'min-h-[120px]'
  }

  const getCellPadding = () => {
    if (isMobile && isPortrait) return 'p-1'
    if (isMobile) return 'p-2'
    return 'p-3'
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowDailySchedule(true)
    if (onNavigateToDailySchedule) {
      // Use calendar date formatting for timezone independence
      const bulgariaDatString = calendarDateToString(date)
      onNavigateToDailySchedule(bulgariaDatString)
    }
  }

  const handleWorkingHoursClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    // Use calendar date formatting for timezone independence
    const dateString = calendarDateToString(date)
    setSelectedWorkingHoursDate(dateString)
    setShowWorkingHoursForm(true)
  }

  const handleAddBooking = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddBooking) {
      onAddBooking(date)
    }
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  const handleSaveWorkingHours = async (workingHoursData: WorkingHours) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/working-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(workingHoursData)
      })

      if (response.ok) {
        setShowWorkingHoursForm(false)
        loadWorkingHours() // Reload working hours
        emitWorkingHoursUpdated(workingHoursData) // Emit the updated event
        
        // Принудително обновяване на DailySchedule
        setDailyScheduleKey(prev => prev + 1)
        
        // If opened from DailySchedule, return to DailySchedule
        if (workingHoursFromDailySchedule) {
          setWorkingHoursFromDailySchedule(false)
          setShowDailySchedule(true)
        }
      }
    } catch (error) {
      console.error('Error saving working hours:', error)
    }
  }

  const handleDeleteWorkingHours = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/working-hours?date=${selectedWorkingHoursDate}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })

      if (response.ok) {
        setShowWorkingHoursForm(false)
        loadWorkingHours() // Reload working hours
        
        // If opened from DailySchedule, return to DailySchedule
        if (workingHoursFromDailySchedule) {
          setWorkingHoursFromDailySchedule(false)
          setShowDailySchedule(true)
        }
      }
    } catch (error) {
      console.error('Error deleting working hours:', error)
    }
  }

  const handleEditBooking = (booking: Booking) => {
    // Open booking form directly in DailySchedule
    if (onBookingClick) {
      onBookingClick(booking)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })

      if (response.ok) {
        // Refresh the daily schedule
        setShowDailySchedule(false)
        // You might want to refresh the calendar data here
      }
    } catch (error) {
      console.error('Error deleting booking:', error)
    }
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-purple-50 rounded-2xl shadow-xl border border-white/50 backdrop-blur-sm">
      {/* Calendar Header - Modern Design */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-white/20 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Календар
              </h2>
              <p className="text-sm text-gray-600">Управление на резервации</p>
            </div>
          </div>
          
          {/* Mobile: Touch-friendly navigation */}
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-3 sm:p-4 bg-white/80 hover:bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation backdrop-blur-sm min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
            
            <div className="text-center min-w-[140px] sm:min-w-[200px]">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>
            
            <button
              onClick={() => handleMonthChange('next')}
              className="p-3 sm:p-4 bg-white/80 hover:bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation backdrop-blur-sm min-w-[48px] min-h-[48px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Status Filter - Modern Design */}
        <div className="mt-4 sm:mt-6">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'Всички', color: 'from-gray-500 to-gray-600' },
              { key: 'pending', label: 'Чакащи', color: 'from-yellow-500 to-orange-500' },
              { key: 'confirmed', label: 'Потвърдени', color: 'from-green-500 to-emerald-600' },
              { key: 'cancelled', label: 'Отменени', color: 'from-red-500 to-pink-600' }
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg min-h-[44px] ${
                  statusFilter === status.key
                    ? `bg-gradient-to-r ${status.color} text-white shadow-lg`
                    : 'bg-white/80 text-gray-700 hover:bg-white backdrop-blur-sm'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid - Mobile Responsive Design */}
      <div 
        className={`${isMobile ? 'p-2' : 'p-6'}`}
      >
        {/* Day Headers - Mobile Responsive Design */}
        <div className="grid grid-cols-7 gap-0 mb-2 sm:mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center">
              <div className={`${isMobile ? 'text-xs py-2 px-1' : 'text-sm sm:text-base py-3 px-2'} font-semibold text-gray-600 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100`}>
                {day}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Days - Mobile Responsive Design */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const bookings = getBookingsForDate(date)
            const bookingIndicators = getBookingIndicators(date)
            const isSelected = selectedDate && selectedDate.getTime() === date.getTime()
            const workingHoursData = getWorkingHoursForDate(date)
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  group relative ${getCellHeight()} ${getCellPadding()} cursor-pointer transition-all duration-300
                  rounded-xl border-2 hover:border-blue-300 hover:shadow-lg
                  ${isToday(date) ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl border-blue-400 animate-pulse' : ''}
                  ${isSelected ? 'bg-gradient-to-br from-blue-100 to-purple-100 border-blue-300 shadow-lg' : ''}
                  ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50/50' : ''}
                  ${isCurrentMonth(date) && isNonWorkingDay(date) && !isToday(date) && !isSelected ? 'bg-red-50/80 hover:bg-red-100/80 border-red-200' : ''}
                  ${isCurrentMonth(date) && !isNonWorkingDay(date) && !isToday(date) && !isSelected ? 'text-gray-900 bg-white/80 hover:bg-white' : ''}
                  ${isCurrentMonth(date) && !isToday(date) && !isSelected && !isNonWorkingDay(date) ? 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50' : ''}
                  touch-manipulation backdrop-blur-sm
                `}
              >
                {/* Mobile Portrait - Compact Layout */}
                {isMobile && isPortrait ? (
                  <>
                    {/* Date Number */}
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-lg font-bold ${isToday(date) ? 'text-white' : ''}`}>
                        {date.getUTCDate()}
                      </div>
                      
                      {/* Today Indicator */}
                      {isToday(date) && (
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" title="Днес"></div>
                      )}
                    </div>
                    
                    {/* Status Dots */}
                    {bookingIndicators && (
                      <div className="flex justify-center gap-1 mt-1">
                        {bookingIndicators.map((indicator, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${getStatusDot(indicator.status)}`}
                            title={`${getStatusText(indicator.status)}`}
                          />
                        ))}
                        {bookings.length > 4 && (
                          <div className="text-xs text-gray-500 ml-1">+{bookings.length - 4}</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  /* Desktop/Landscape - Full Layout */
                  <>
                    {/* Date Number with Working Hours Indicator */}
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-lg sm:text-xl font-bold ${isToday(date) ? 'text-white' : ''}`}>
                        {date.getUTCDate()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Today Indicator */}
                        {isToday(date) && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full animate-bounce" title="Днешна дата"></div>
                        )}
                        
                        {/* Working Hours Status */}
                        {isCurrentMonth(date) && workingHoursData && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" title={workingHoursData.isWorkingDay ? "Работен ден" : "Почивен ден"}>
                            {workingHoursData.isWorkingDay ? (
                              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></div>
                            ) : (
                              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Add Booking Button - Hidden on mobile portrait */}
                    {isCurrentMonth(date) && onAddBooking && !isMobile && (
                      <button
                        onClick={(e) => handleAddBooking(date, e)}
                        className="absolute top-2 left-1/2 transform -translate-x-1/2 -translate-x-8 p-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 z-10 min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="Добави резервация"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Bookings Indicators */}
                    {bookingIndicators && (
                      <div className="space-y-1">
                        {Array.isArray(bookingIndicators) && bookingIndicators.length > 0 && 'name' in bookingIndicators[0] ? (
                          // Full booking objects (desktop view)
                          (bookingIndicators as Booking[]).map((booking: Booking, bookingIndex: number) => (
                            <div
                              key={bookingIndex}
                              onClick={(e) => {
                                e.stopPropagation()
                                onBookingClick(booking)
                              }}
                              className={`
                                text-sm px-2 py-1.5 rounded-lg border truncate transition-all duration-200 hover:scale-105
                                ${getStatusColor(booking.status)}
                                touch-manipulation shadow-sm hover:shadow-md
                              `}
                              title={`${booking.name} - ${booking.time} - ${getStatusText(booking.status)}`}
                            >
                              {booking.time} - {booking.name}
                            </div>
                          ))
                        ) : null}
                        
                        {bookings.length > (Array.isArray(bookingIndicators) ? bookingIndicators.length : 0) && (
                          <div className="text-sm text-gray-500 text-center bg-gray-100 rounded-lg py-1.5">
                            +{bookings.length - (Array.isArray(bookingIndicators) ? bookingIndicators.length : 0)} още
                          </div>
                        )}
                      </div>
                    )}

                    {/* Working Hours Indicator - Hidden on mobile portrait */}
                    {isCurrentMonth(date) && !isMobile && (
                      <button
                        onClick={(e) => handleWorkingHoursClick(date, e)}
                        className="absolute top-2 left-1/2 transform -translate-x-1/2 translate-x-2 p-1.5 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg min-w-[32px] min-h-[32px] flex items-center justify-center"
                        title="Работно време"
                      >
                        <Settings className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Working Hours Form Modal */}
      {showWorkingHoursForm && (
        <WorkingHoursForm
          selectedDate={selectedWorkingHoursDate}
          onSave={handleSaveWorkingHours}
          onCancel={() => {
            setShowWorkingHoursForm(false)
            // If opened from DailySchedule, return to DailySchedule
            if (workingHoursFromDailySchedule) {
              setWorkingHoursFromDailySchedule(false)
              setShowDailySchedule(true)
            }
          }}
          onDelete={handleDeleteWorkingHours}
          initialData={workingHours.find(wh => wh.date === selectedWorkingHoursDate)}
        />
      )}

      {/* Daily Schedule Modal */}
      {showDailySchedule && selectedDate && (
        <DailySchedule
          date={calendarDateToString(selectedDate)}
          onClose={() => {
            setShowDailySchedule(false)
            if (onCloseDailySchedule) {
              onCloseDailySchedule()
            }
          }}
          onEditWorkingHours={() => {
            setWorkingHoursFromDailySchedule(true)
            setSelectedWorkingHoursDate(calendarDateToString(selectedDate))
            setShowWorkingHoursForm(true)
          }}
          onEditBooking={handleEditBooking}
          onDeleteBooking={handleDeleteBooking}
          key={`daily-schedule-${calendarDateToString(selectedDate)}-${dailyScheduleKey}`}
        />
      )}
    </div>
  )
}

export default Calendar