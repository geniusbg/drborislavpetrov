'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Phone, Clock, Copy, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getBulgariaTime, formatBulgariaDate } from '@/lib/bulgaria-time'

interface TimeSlot {
  time: string
  date: string
  service?: string
}

interface ServiceOption {
  id: number
  name: string
  duration: number
}

interface QuickResponseWidgetProps {
  onClose?: () => void
  onCreateBooking?: (date: string, time: string) => void
}

const QuickResponseWidget: React.FC<QuickResponseWidgetProps> = ({ onClose, onCreateBooking }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'next20' | 'month'>('today')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = getBulgariaTime()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthStr = `${year}-${String(month).padStart(2, '0')}`
    return monthStr
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

  // Service filter state
  const [services, setServices] = useState<ServiceOption[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('') // empty => default behavior (15m)
  const selectedServiceDuration = useMemo(() => {
    const selected = services.find(s => s.id.toString() === selectedServiceId)
    return selected?.duration ?? 15
  }, [services, selectedServiceId])

  // Load next N free slots across days
  const loadNextAvailableSlots = async (count: number) => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const start = getCurrentDate()
      const params = new URLSearchParams({
        from: start,
        limit: String(count),
        serviceDuration: String(selectedServiceDuration),
      })
      const response = await fetch(`/api/admin/available-time-slots/next?${params.toString()}`, {
        headers: { 'x-admin-token': adminToken || '' }
      })
      if (response.ok) {
        const data = await response.json()
        const slots: TimeSlot[] = (data.slots as Array<{ time: string; date: string }> | undefined || []).map((s) => ({
          time: s.time,
          date: s.date,
        }))
        setAvailableSlots(slots)
        setMonthlyCalendar([])
      } else {
        setAvailableSlots([])
      }
    } catch (e) {
      setAvailableSlots([])
    } finally {
      setIsLoading(false)
    }
  }

  // Get current date in Bulgaria timezone (avoid UTC shift)
  const getCurrentDate = () => {
    const now = getBulgariaTime()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Get tomorrow's date (in BG timezone, avoid parsing YYYY-MM-DD as UTC)
  const getTomorrowDate = () => {
    const t = getBulgariaTime()
    t.setDate(t.getDate() + 1)
    const y = t.getFullYear()
    const m = String(t.getMonth() + 1).padStart(2, '0')
    const d = String(t.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Load available slots for a specific date
  const loadAvailableSlots = async (date: string, limit: number = 10) => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/available-time-slots?date=${date}&limit=${limit}&serviceDuration=${selectedServiceDuration}`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const slots = (data.availableSlots || []).map((time: string) => ({
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

  // Create monthly calendar grid
  const createMonthlyCalendar = (yearMonth: string, monthlySlots: TimeSlot[]) => {
    const [year, month] = yearMonth.split('-').map(Number)
    
    const firstDay = new Date(year, month - 1, 1)
    const startDate = new Date(firstDay)
    // Shift to Monday-started week: getDay() => 0(Sun)..6(Sat). Offset so Monday=0
    const mondayOffset = (firstDay.getDay() + 6) % 7
    startDate.setDate(startDate.getDate() - mondayOffset)
    
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
      // Build date string in local time to avoid UTC shifts
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
      // const dayOfWeek = currentDate.getDay() // 0=Sun..6=Sat (not needed here)
      
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

  // Load monthly calendar view
  const loadMonthlyCalendar = useCallback(async () => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/available-time-slots/month?month=${selectedMonth}&limit=0&serviceDuration=${selectedServiceDuration}`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const monthlySlots = (data.availableSlots || []) as TimeSlot[]
        
        // Create calendar grid for the month
        const calendar = createMonthlyCalendar(selectedMonth, monthlySlots)
        setMonthlyCalendar(calendar)
        setAvailableSlots([]) // Clear the list view
        setSelectedMonthDate(null) // Reset selected date
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
  }, [selectedMonth, selectedServiceDuration])

  // Reload lists when service filter changes for non-month tabs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Only react after first load of services
    if (!services) return
    if (activeTab === 'today') {
      loadAvailableSlots(getCurrentDate(), 0)
    } else if (activeTab === 'tomorrow') {
      loadAvailableSlots(getTomorrowDate(), 0)
    } else if (activeTab === 'next20') {
      loadNextAvailableSlots(20)
    }
  }, [selectedServiceDuration])



  // Load monthly calendar when month tab is activated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'month') {
      loadMonthlyCalendar()
    }
  }, [activeTab]) // Only depend on activeTab

  // Load monthly calendar when selectedMonth changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (activeTab === 'month') {
      setMonthlyCalendar([]) // Clear calendar to trigger reload
      loadMonthlyCalendar()
    }
  }, [selectedMonth]) // Only depend on selectedMonth


  // Calculate available time for a day considering service duration and slot grouping
  const calculateAvailableHours = (slots: string[]) => {
    if (slots.length === 0) return '0ч'

    // Parse times to minutes
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number)
      return h * 60 + m
    }
    const sorted = [...slots].sort()
    let groupCount = 0
    let prev: number | null = null
    for (const t of sorted) {
      const m = toMinutes(t)
      if (prev === null || m !== prev + 15) {
        groupCount += 1
      }
      prev = m
    }
    // Total unique available minutes (union of bookable windows)
    const totalMinutes = slots.length * 15 + groupCount * (selectedServiceDuration - 15)

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours === 0) return `${minutes}мин`
    if (minutes === 0) return `${hours}ч`
    return `${hours}ч ${minutes}мин`
  }

  // Handle calendar day click
  const handleCalendarDayClick = (date: string, status: string) => {
    setSelectedMonthDate(date)
    if (status === 'has-slots') {
      const dayData = monthlyCalendar.find(day => day.date === date)
      if (dayData && dayData.availableSlots.length > 0) {
        const slots = dayData.availableSlots.map(time => ({ time, date, service: 'Общ преглед' }))
        setAvailableSlots(slots)
        return
      }
      // Fallback to API call if needed
      loadAvailableSlots(date, 0)
    } else {
      // No slots for this day → clear list to avoid confusion
      setAvailableSlots([])
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
  const handleTabChange = (tab: 'today' | 'tomorrow' | 'next20' | 'month') => {
    setActiveTab(tab)
    setCopySuccess(false)
    setSelectedMonthDate(null) // Reset selected date when changing tabs
    
    if (tab === 'today') {
      loadAvailableSlots(getCurrentDate(), 0)
    } else if (tab === 'tomorrow') {
      loadAvailableSlots(getTomorrowDate(), 0)
    } else if (tab === 'next20') {
      loadNextAvailableSlots(20)
    } else if (tab === 'month') {
      loadMonthlyCalendar()
    }
  }

  // Load services for filter (once on mount)
  useEffect(() => {
    const loadServices = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken')
        const response = await fetch('/api/admin/services', {
          headers: { 'x-admin-token': adminToken || 'test' }
        })
        if (response.ok) {
          const data = await response.json()
          setServices(data.services || [])
        }
      } catch {}
    }
    loadServices()
  }, [])

  // Copy slots to clipboard
  const copyToClipboard = async () => {
    if (availableSlots.length === 0) return

    let text = ''
    const dateLabel = activeTab === 'today' ? 'днес' : 
                     activeTab === 'tomorrow' ? 'утре' : 
                     activeTab === 'next20' ? 'следващите 20' : 
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setAvailableSlots([])
      }
    }
    window.addEventListener('quick-response-open', onOpen as EventListener)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('quick-response-open', onOpen as EventListener)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isOpen) {
      handleTabChange(activeTab)
    }
  }, [isOpen])

  // Load monthly calendar when selectedMonth changes
  useEffect(() => {
    if (activeTab === 'month' && selectedMonth) {
      loadMonthlyCalendar()
    }
  }, [selectedMonth, activeTab, loadMonthlyCalendar])

  // (debug removed)

  // Format time for display
  const formatTime = (time: string) => {
    return time
  }

  // Get tab label
  const getTabLabel = (tab: string) => {
    switch (tab) {
      case 'today': return 'Днес'
      case 'tomorrow': return 'Утре'
      case 'next20': return 'Следващи 20'
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
    } else if (activeTab === 'next20') {
      dateLabel = 'следващите 20'
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
      {/* Floating Button (responsive, avoids overlapping header/actions) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:right-20 z-50 bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 flex items-center space-x-2"
        title="Бързо реагиране - свободни часове"
        aria-label="Бързо реагиране"
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
                  {(['today', 'tomorrow', 'next20', 'month'] as const).map((tab) => (
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
                       setSelectedMonthDate(null) // Reset selected date
                       setAvailableSlots([]) // Clear slots
                       setMonthlyCalendar([]) // Clear calendar to trigger reload
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
                       setSelectedMonthDate(null) // Reset selected date
                       setAvailableSlots([]) // Clear slots
                       setMonthlyCalendar([]) // Clear calendar to trigger reload
                     }}
                     className="p-1 hover:bg-gray-200 rounded"
                   >
                     <ChevronRight className="w-5 h-5" />
                   </button>
                 </div>
               )}

               {/* Service filter */}
               <div className="mb-3">
                 <label className="block text-sm text-gray-600 mb-1">Филтър по услуга (по избор)</label>
                 <select
                   value={selectedServiceId}
                   onChange={(e) => {
                     // Set new service; clear current view immediately to avoid flicker
                     setSelectedServiceId(e.target.value)
                     setAvailableSlots([])
                     if (activeTab === 'month') {
                       setMonthlyCalendar([])
                     }
                   }}
                   className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                 >
                   <option value="">Без филтър (15 мин)</option>
                   {services.map(s => (
                     <option key={s.id} value={s.id.toString()}>
                       {s.name} ({s.duration} мин)
                     </option>
                   ))}
                 </select>
               </div>

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
                     
                     {/* Debug info */}
                     <div className="text-xs text-gray-500 mb-2">
                       Calendar days: {monthlyCalendar.length}, Selected month: {selectedMonth}
                     </div>
                     
                     {/* Calendar Grid */}
                     <div className="grid grid-cols-7 gap-1">
                       {/* Day headers */}
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day) => (
                         <div key={day} className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
                           {day}
                         </div>
                       ))}
                       
                       {/* Calendar days */}
                       {monthlyCalendar.map((day, index) => (
                          <button
                            key={index}
                            onClick={() => handleCalendarDayClick(day.date, day.status)}
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

                 {/* Loading state for month */}
                 {activeTab === 'month' && isLoading && (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-3"></div>
                     <span className="text-gray-600">Зареждане на месечен календар...</span>
                   </div>
                 )}

                 {/* No calendar data */}
                 {activeTab === 'month' && !isLoading && monthlyCalendar.length === 0 && (
                   <div className="text-center py-8">
                     <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                     <p className="text-gray-600">Няма данни за календара</p>
                     <button 
                       onClick={loadMonthlyCalendar}
                       className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                     >
                       Опитай отново
                     </button>
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
                            <div className="text-sm font-medium text-green-800">{formatTime(slot.time)}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Debug info removed */}

                                   {/* Available slots for other tabs */}
                  {!isLoading && availableSlots.length > 0 && activeTab !== 'month' && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Свободни часове {activeTab === 'today' ? 'за днес' : 
                                        activeTab === 'tomorrow' ? 'за утре' : 
                                        activeTab === 'next20' ? 'следващите 20' : 
                                        `за ${selectedMonth}`}:
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleTimeSlotClick(slot.date, slot.time)}
                            className="bg-green-50 border border-green-200 rounded-lg p-3 text-left hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            {activeTab === 'next20' && (
                              <div className={"text-sm font-medium text-gray-700"}>{formatBulgariaDate(new Date(slot.date))}</div>
                            )}
                            <div className={activeTab === 'next20' ? 'text-lg font-semibold text-green-800' : 'text-sm font-medium text-green-800'}>
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
                                            activeTab === 'next20' ? 'в следващите 20' : 
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