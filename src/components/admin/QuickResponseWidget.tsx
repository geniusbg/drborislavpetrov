'use client'

import React, { useState, useEffect } from 'react'
import { Phone, Clock, Copy, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { getBulgariaTime, formatBulgariaDate } from '@/lib/bulgaria-time'

interface TimeSlot {
  time: string
  date: string
  service?: string
}

interface QuickResponseWidgetProps {
  onClose?: () => void
  onCreateBooking?: (date: string, time: string) => void
}

const QuickResponseWidget: React.FC<QuickResponseWidgetProps> = ({ onClose, onCreateBooking }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'month'>('today')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = getBulgariaTime()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    console.log('🔍 Current date:', now.toISOString())
    console.log('🔍 Calculated month:', `${year}-${String(month).padStart(2, '0')}`)
    return `${year}-${String(month).padStart(2, '0')}`
  })
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Monthly calendar state
  const [monthlyCalendar, setMonthlyCalendar] = useState<Array<{
    date: string
    dayNumber: string
    status: 'weekend' | 'no-slots' | 'has-slots' | 'loading' | 'empty'
    availableSlots: string[]
  }>>([])
  const [selectedMonthDate, setSelectedMonthDate] = useState<string | null>(null)

  // Get current date in Bulgaria timezone
  const getCurrentDate = () => {
    const now = getBulgariaTime()
    return now.toISOString().split('T')[0]
  }

  // Get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date(getCurrentDate())
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  // Load available slots for a specific date
  const loadAvailableSlots = async (date: string, limit: number = 10) => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/available-time-slots?date=${date}&limit=${limit}`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const slots = data.availableSlots.map((time: string) => ({
          time,
          date,
          service: 'Общ преглед'
        }))
        setAvailableSlots(slots)
      } else {
        console.error('Failed to load available slots')
        setAvailableSlots([])
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load monthly calendar view
  const loadMonthlyCalendar = async () => {
    console.log('🔍 Loading monthly calendar for:', selectedMonth)
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/available-time-slots/month?month=${selectedMonth}&limit=100`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const monthlySlots = data.availableSlots || []
        
        // Create calendar grid for the month
        const calendar = createMonthlyCalendar(selectedMonth, monthlySlots)
        setMonthlyCalendar(calendar)
        setAvailableSlots([]) // Clear the list view
      } else {
        console.error('Failed to load monthly calendar')
        setMonthlyCalendar([])
      }
    } catch (error) {
      console.error('Error loading monthly calendar:', error)
      setMonthlyCalendar([])
    } finally {
      setIsLoading(false)
    }
  }

  // Create monthly calendar grid
  const createMonthlyCalendar = (yearMonth: string, monthlySlots: TimeSlot[]) => {
    const [year, month] = yearMonth.split('-').map(Number)
    console.log('🔍 Creating calendar for:', yearMonth, 'year:', year, 'month:', month)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday
    
    const calendar: Array<{
      date: string
      dayNumber: string
      status: 'weekend' | 'no-slots' | 'has-slots' | 'loading' | 'empty'
      availableSlots: string[]
    }> = []
    
    // Create 6 weeks (42 days) to ensure we cover the entire month
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      // Use UTC to avoid timezone issues
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()
      
      // Check if this date is in the current month
      const isCurrentMonth = currentDate.getMonth() === month - 1
      
      if (!isCurrentMonth) {
        calendar.push({
          date: dateStr,
          dayNumber: currentDate.getDate().toString(),
          status: 'empty',
          availableSlots: []
        })
        continue
      }
      
      // Check if it's weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        calendar.push({
          date: dateStr,
          dayNumber: currentDate.getDate().toString(),
          status: 'weekend',
          availableSlots: []
        })
        continue
      }
      
      // Check if there are available slots for this date
      const slotsForDate = monthlySlots.filter(slot => slot.date === dateStr)
      
      calendar.push({
        date: dateStr,
        dayNumber: currentDate.getDate().toString(),
        status: slotsForDate.length > 0 ? 'has-slots' : 'no-slots',
        availableSlots: slotsForDate.map(slot => slot.time)
      })
    }
    
    return calendar
  }

  // Calculate available hours for a day
  const calculateAvailableHours = (slots: string[]) => {
    if (slots.length === 0) return '0ч'
    
    // Convert slots to minutes and calculate total available time
    const totalMinutes = slots.length * 15 // Each slot is 15 minutes
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours === 0) {
      return `${minutes}мин`
    } else if (minutes === 0) {
      return `${hours}ч`
    } else {
      return `${hours}ч ${minutes}мин`
    }
  }

  // Handle calendar day click
  const handleCalendarDayClick = (date: string, status: string) => {
    if (status === 'has-slots') {
      console.log('🔍 Calendar day clicked:', date, 'for month:', selectedMonth)
      setSelectedMonthDate(date)
      loadAvailableSlots(date, 0) // Load all available slots (no limit)
    }
  }

  // Handle time slot click for booking creation
  const handleTimeSlotClick = (date: string, time: string) => {
    if (onCreateBooking) {
      onCreateBooking(date, time)
      setIsOpen(false)
    }
  }

  // Handle tab change
  const handleTabChange = (tab: 'today' | 'tomorrow' | 'week' | 'month') => {
    console.log('🔍 Tab changed to:', tab)
    setActiveTab(tab)
    setCopySuccess(false)
    
    if (tab === 'today') {
      loadAvailableSlots(getCurrentDate(), 0)
    } else if (tab === 'tomorrow') {
      loadAvailableSlots(getTomorrowDate(), 0)
    } else if (tab === 'week') {
      loadAvailableSlots(getCurrentDate(), 0) // For now, just load today's slots
    } else if (tab === 'month') {
      console.log('🔍 Loading monthly calendar from handleTabChange')
      loadMonthlyCalendar()
    }
  }

  // Copy slots to clipboard
  const copyToClipboard = async () => {
    if (availableSlots.length === 0) return

    let text = ''
    const dateLabel = activeTab === 'today' ? 'днес' : 
                     activeTab === 'tomorrow' ? 'утре' : 
                     activeTab === 'week' ? 'тази седмица' : 
                     `за ${selectedMonth}`

    if (activeTab === 'month') {
      // Group by date for monthly view
      const groupedSlots = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = []
        acc[slot.date].push(slot.time)
        return acc
      }, {} as Record<string, string[]>)

      text = `Свободни часове ${dateLabel}:\n`
      Object.entries(groupedSlots).forEach(([date, times]) => {
        const formattedDate = formatBulgariaDate(new Date(date))
        text += `${formattedDate}: ${times.join(', ')}\n`
      })
    } else {
      const times = availableSlots.map(slot => slot.time)
      text = `Свободни часове ${dateLabel}: ${times.join(', ')}`
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  // Load initial data when modal opens
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    window.addEventListener('quick-response-open', onOpen as EventListener)
    return () => window.removeEventListener('quick-response-open', onOpen as EventListener)
  }, [])

  useEffect(() => {
    if (isOpen) {
      handleTabChange(activeTab)
    }
  }, [isOpen])

  // Load monthly calendar when selectedMonth changes
  useEffect(() => {
    if (activeTab === 'month' && selectedMonth) {
      console.log('🔍 useEffect triggered - loading monthly calendar')
      loadMonthlyCalendar()
    }
  }, [selectedMonth, activeTab])

  // Debug useEffect
  useEffect(() => {
    console.log('🔍 Debug - selectedMonth:', selectedMonth, 'activeTab:', activeTab)
  }, [selectedMonth, activeTab])

  // Format time for display
  const formatTime = (time: string) => {
    return time
  }

  // Get tab label
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'today': return 'Днес'
      case 'tomorrow': return 'Утре'
      case 'week': return 'Седмица'
      case 'month': return 'Месец'
      default: return tab
    }
  }

  // Get ready response text
  const getReadyResponse = () => {
    if (availableSlots.length === 0) {
      return "Извинете, но засега нямам свободни часове."
    }

    const times = availableSlots.map(slot => slot.time)
    let dateLabel = ''
    
    if (activeTab === 'today') {
      dateLabel = 'днес'
    } else if (activeTab === 'tomorrow') {
      dateLabel = 'утре'
    } else if (activeTab === 'week') {
      dateLabel = 'тази седмица'
    } else if (activeTab === 'month') {
      if (selectedMonthDate) {
        dateLabel = formatBulgariaDate(new Date(selectedMonthDate))
      } else {
        dateLabel = `за ${new Date(selectedMonth + '-01').toLocaleDateString('bg-BG', { 
          year: 'numeric', 
          month: 'long' 
        })}`
      }
    }

    return `Добър ден! ${dateLabel} имам свободни часове в ${times.join(', ')}.`
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center space-x-2"
        title="Бързо реагиране - свободни часове"
      >
        <Phone className="w-5 h-5" />
        <Clock className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Бързо реагиране</h3>
                    <p className="text-sm text-gray-600">Свободни часове за телефонни обаждания</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    onClose?.()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-8">
                  {(['today', 'tomorrow', 'week', 'month'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {getTabLabel(tab)}
                    </button>
                  ))}
                </nav>
              </div>

                             {/* Month selector for monthly view */}
               {activeTab === 'month' && (
                 <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                                       <button
                      onClick={() => {
                        const [year, month] = selectedMonth.split('-')
                        const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1)
                        currentDate.setMonth(currentDate.getMonth() - 1)
                        const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                        setSelectedMonth(newMonth)
                        setTimeout(() => loadMonthlyCalendar(), 0)
                      }}
                     className="p-1 hover:bg-gray-200 rounded"
                   >
                     <ChevronLeft className="w-5 h-5" />
                   </button>
                                       <span className="font-medium">
                      {(() => {
                        const [year, month] = selectedMonth.split('-')
                        const date = new Date(parseInt(year), parseInt(month) - 1, 1)
                        return date.toLocaleDateString('bg-BG', { 
                          year: 'numeric', 
                          month: 'long' 
                        })
                      })()}
                    </span>
                                       <button
                      onClick={() => {
                        const [year, month] = selectedMonth.split('-')
                        const currentDate = new Date(parseInt(year), parseInt(month) - 1, 1)
                        currentDate.setMonth(currentDate.getMonth() + 1)
                        const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                        setSelectedMonth(newMonth)
                        setTimeout(() => loadMonthlyCalendar(), 0)
                      }}
                     className="p-1 hover:bg-gray-200 rounded"
                   >
                     <ChevronRight className="w-5 h-5" />
                   </button>
                 </div>
               )}

              {/* Content */}
              <div className="space-y-4">
                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Зареждане на свободни часове...</span>
                  </div>
                )}

                                 {/* Monthly Calendar View */}
                 {activeTab === 'month' && !isLoading && monthlyCalendar.length > 0 && (
                   <div>
                                           <h4 className="font-medium text-gray-900 mb-3">
                        Календар за {(() => {
                          const [year, month] = selectedMonth.split('-')
                          const date = new Date(parseInt(year), parseInt(month) - 1, 1)
                          return date.toLocaleDateString('bg-BG', { 
                            year: 'numeric', 
                            month: 'long' 
                          })
                        })()}
                      </h4>
                     
                     {/* Calendar Legend */}
                     <div className="flex flex-wrap gap-4 mb-4 text-xs">
                       <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                         <span>Има свободни часове</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                         <span>Всички часове заети</span>
                       </div>
                       <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                         <span>Почивен ден</span>
                       </div>
                     </div>
                     
                     {/* Calendar Grid */}
                     <div className="grid grid-cols-7 gap-1">
                       {/* Day headers */}
                       {['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day) => (
                         <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
                           {day}
                         </div>
                       ))}
                       
                       {/* Calendar days */}
                       {monthlyCalendar.map((day, index) => (
                         <button
                           key={index}
                           onClick={() => handleCalendarDayClick(day.date, day.status)}
                           disabled={day.status === 'empty' || day.status === 'weekend' || day.status === 'no-slots'}
                           className={`p-2 text-center text-sm transition-colors ${
                             day.status === 'empty'
                               ? 'text-gray-300 cursor-default'
                               : day.status === 'weekend'
                               ? 'bg-gray-100 text-gray-500 cursor-default'
                               : day.status === 'no-slots'
                               ? 'bg-red-100 text-red-700 cursor-pointer hover:bg-red-200'
                               : day.status === 'has-slots'
                               ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                               : 'bg-gray-100 text-gray-500 cursor-default'
                           }`}
                         >
                                                       <div className="font-medium">{day.dayNumber}</div>
                                                         {day.status === 'has-slots' && day.availableSlots.length > 0 && (
                               <div className="text-xs text-green-600 mt-1">
                                 {calculateAvailableHours(day.availableSlots)}
                               </div>
                             )}
                         </button>
                       ))}
                     </div>
                   </div>
                 )}

                                   {/* Available slots for selected date */}
                  {!isLoading && availableSlots.length > 0 && activeTab === 'month' && selectedMonthDate && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Свободни часове за {formatBulgariaDate(new Date(selectedMonthDate))}:
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimeSlotClick(slot.date, slot.time)}
                            className="bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <div className="text-sm font-medium text-green-800">
                              {formatTime(slot.time)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                                   {/* Available slots for other tabs */}
                  {!isLoading && availableSlots.length > 0 && activeTab !== 'month' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Свободни часове {activeTab === 'today' ? 'за днес' : 
                                        activeTab === 'tomorrow' ? 'за утре' : 
                                        activeTab === 'week' ? 'за тази седмица' : 
                                        `за ${selectedMonth}`}:
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimeSlotClick(slot.date, slot.time)}
                            className="bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <div className="text-sm font-medium text-green-800">
                              {formatTime(slot.time)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                                 {/* No slots available */}
                 {!isLoading && availableSlots.length === 0 && activeTab !== 'month' && (
                   <div className="text-center py-8">
                     <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                     <p className="text-gray-600">
                       Няма свободни часове {activeTab === 'today' ? 'за днес' : 
                                           activeTab === 'tomorrow' ? 'за утре' : 
                                           activeTab === 'week' ? 'за тази седмица' : 
                                           `за ${selectedMonth}`}
                     </p>
                   </div>
                 )}

                {/* Ready response */}
                {!isLoading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Готов отговор за телефон:</h4>
                    <p className="text-blue-800 text-sm">{getReadyResponse()}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={copyToClipboard}
                    disabled={availableSlots.length === 0}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      availableSlots.length > 0
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copySuccess ? 'Копирано!' : 'Копирай в клипборда'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      onClose?.()
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Затвори
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QuickResponseWidget 