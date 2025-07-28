'use client'

import { useState, useEffect } from 'react'
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
  onNewBooking?: (date: string) => void
}

const Calendar = ({ bookings, onBookingClick, onNewBooking }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Филтър:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Всички</option>
              <option value="pending">Чакащи</option>
              <option value="confirmed">Потвърдени</option>
              <option value="cancelled">Отменени</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Днес
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm text-blue-600 font-medium">Общо резервации</div>
          <div className="text-2xl font-bold text-blue-900">{filteredBookings.length}</div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-sm text-yellow-600 font-medium">Чакащи</div>
          <div className="text-2xl font-bold text-yellow-900">
            {filteredBookings.filter(b => b.status === 'pending').length}
          </div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-sm text-green-600 font-medium">Потвърдени</div>
          <div className="text-2xl font-bold text-green-900">
            {filteredBookings.filter(b => b.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-sm text-red-600 font-medium">Отменени</div>
          <div className="text-2xl font-bold text-red-900">
            {filteredBookings.filter(b => b.status === 'cancelled').length}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const dayBookings = getBookingsForDate(date)
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
          
          return (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50
                ${isToday(date) ? 'bg-blue-50 border-blue-300' : ''}
                ${!isCurrentMonth(date) ? 'text-gray-400' : ''}
                ${isSelected ? 'bg-blue-100 border-blue-400' : ''}
              `}
              onClick={() => setSelectedDate(date)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="text-sm font-medium">
                  {date.getDate()}
                </div>
                {onNewBooking && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onNewBooking(date.toISOString().split('T')[0])
                    }}
                    className="text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full p-1 transition-colors"
                    title="Добави резервация"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Bookings for this day */}
              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className={`
                      text-xs p-1 rounded border cursor-pointer hover:opacity-80
                      ${getStatusColor(booking.status)}
                    `}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBookingClick(booking)
                    }}
                  >
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">{booking.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span className="truncate">{booking.name}</span>
                    </div>
                    <div className="text-xs opacity-75">
                      {getStatusText(booking.status)}
                    </div>
                  </div>
                ))}
                
                {dayBookings.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayBookings.length - 3} още
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">
              Резервации за {selectedDate.toLocaleDateString('bg-BG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            {onNewBooking && (
              <button
                onClick={() => onNewBooking(selectedDate.toISOString().split('T')[0])}
                className="bg-primary-600 text-white px-3 py-1 rounded-md text-sm hover:bg-primary-700"
              >
                + Нова резервация
              </button>
            )}
          </div>
          
          {getBookingsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500">Няма резервации за този ден</p>
          ) : (
            <div className="space-y-2">
              {getBookingsForDate(selectedDate).map((booking) => (
                <div
                  key={booking.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow
                    ${getStatusColor(booking.status)}
                  `}
                  onClick={() => onBookingClick(booking)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{booking.time}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{booking.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{booking.phone}</span>
                    </div>
                    <div className="text-sm opacity-75">
                      {booking.serviceName || booking.service}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Calendar 