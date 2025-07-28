'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Phone } from 'lucide-react'

interface Booking {
  id: string
  name: string
  phone: string
  service: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  serviceName?: string
  userName?: string
}

interface CalendarProps {
  bookings: Booking[]
  onBookingClick: (booking: Booking) => void
}

const Calendar = ({ bookings, onBookingClick }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Touch gesture handling for mobile swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      // Swipe left - next month
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else if (isRightSwipe) {
      // Swipe right - previous month
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }
  }

  // Filter bookings based on status
  const filteredBookings = bookings.filter(booking => {
    if (statusFilter === 'all') return true
    return booking.status === statusFilter
  })

  // Get current month's first day and last day
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get start of calendar (including previous month's days) - START FROM MONDAY
  const startDate = new Date(firstDayOfMonth)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Convert to Monday start
  startDate.setDate(startDate.getDate() - daysToSubtract)
  
  // Get end of calendar (including next month's days) - END ON SUNDAY
  const endDate = new Date(lastDayOfMonth)
  const lastDayOfWeek = lastDayOfMonth.getDay() // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek // Complete to Sunday
  endDate.setDate(endDate.getDate() + daysToAdd)

  // Generate calendar days
  const calendarDays = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    calendarDays.push(new Date(current))
    current.setDate(current.getDate() + 1)
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
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const getBookingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    const bookings = bookingsByDate[dateString] || []
    // Sort bookings by time
    return bookings.sort((a, b) => a.time.localeCompare(b.time))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Calendar Header - Mobile Optimized */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Календар</h2>
          
          {/* Mobile: Touch-friendly navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            
            <div className="text-center min-w-[140px] sm:min-w-[180px]">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>
            
            <button
              onClick={() => handleMonthChange('next')}
              className="p-2 sm:p-3 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Status Filter - Mobile Optimized */}
        <div className="mt-4">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {['all', 'pending', 'confirmed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Всички' : 
                 status === 'pending' ? 'Чакащи' :
                 status === 'confirmed' ? 'Потвърдени' : 'Отменени'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid - Touch Optimized */}
      <div 
        className="p-4 sm:p-6"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center">
              <div className="text-xs sm:text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const bookings = getBookingsForDate(date)
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString()
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={`
                  relative min-h-[60px] sm:min-h-[80px] p-1 sm:p-2 rounded-lg cursor-pointer transition-all duration-200
                  ${isToday(date) ? 'bg-blue-50 border-2 border-blue-200' : ''}
                  ${isSelected ? 'bg-blue-100 border-2 border-blue-300' : ''}
                  ${!isCurrentMonth(date) ? 'text-gray-400' : 'text-gray-900'}
                  ${isCurrentMonth(date) && !isToday(date) && !isSelected ? 'hover:bg-gray-50' : ''}
                  touch-manipulation
                `}
              >
                {/* Date Number */}
                <div className="text-xs sm:text-sm font-medium mb-1">
                  {date.getDate()}
                </div>
                
                {/* Bookings Indicators */}
                {bookings.length > 0 && (
                  <div className="space-y-1">
                    {bookings.slice(0, 2).map((booking, bookingIndex) => (
                      <div
                        key={bookingIndex}
                        onClick={(e) => {
                          e.stopPropagation()
                          onBookingClick(booking)
                        }}
                        className={`
                          text-xs px-1 py-0.5 rounded border truncate
                          ${getStatusColor(booking.status)}
                          touch-manipulation
                        `}
                        title={`${booking.name} - ${booking.time} - ${getStatusText(booking.status)}`}
                      >
                        {booking.time} - {booking.name}
                      </div>
                    ))}
                    
                    {bookings.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{bookings.length - 2} още
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details - Mobile Optimized */}
      {selectedDate && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('bg-BG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-500">✕</span>
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {getBookingsForDate(selectedDate).map((booking) => (
              <div
                key={booking.id}
                onClick={() => onBookingClick(booking)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${getStatusColor(booking.status)}
                  hover:shadow-sm touch-manipulation
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{booking.time}</span>
                  </div>
                  <span className="text-xs font-medium">
                    {getStatusText(booking.status)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{booking.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{booking.phone}</span>
                  </div>
                  
                  {booking.serviceName && (
                    <div className="text-sm text-gray-600">
                      Услуга: {booking.serviceName}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {getBookingsForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Няма резервации за този ден</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar 