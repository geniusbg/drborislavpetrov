'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings, Calendar as CalendarIcon, Clock } from 'lucide-react'
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

// Интерфейс за свободни часове
interface AvailableSlots {
  date: string
  availableSlots: string[]
}

// Helper function to ensure valid AvailableSlots
const ensureValidAvailableSlots = (slot: { date?: string; availableSlots?: unknown }): AvailableSlots => ({
  date: slot.date || '',
  availableSlots: Array.isArray(slot.availableSlots) ? slot.availableSlots : []
})

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
  const [dailyScheduleWorkingHours, setDailyScheduleWorkingHours] = useState<WorkingHours | null>(null)
  
  // Month/Year picker state
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false)
  const [tempSelectedMonth, setTempSelectedMonth] = useState(0)
  const [tempSelectedYear, setTempSelectedYear] = useState(2025)
  
  // Force update state for re-rendering when data changes
  const [forceUpdate, setForceUpdate] = useState(0)
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)
  
  // Свободни часове за месеца (изчислени локално)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlots[]>([])
  
  // Индикатор за зареждане на данни за месеца
  const [isMonthDataLoading, setIsMonthDataLoading] = useState(false)
  
  // Настройки за работно време по подразбиране
  const [defaultWorkingHours, setDefaultWorkingHours] = useState({
    workingDays: [1, 2, 3, 4, 5], // Понеделник до Петък
    startTime: '09:00',
    endTime: '18:00'
  })
  
  // Избрана услуга за изчисляване на свободни часове
  const [selectedService, setSelectedService] = useState<number | string>('')
  const [services, setServices] = useState<Array<{id: number, name: string, duration: number}>>([])
  
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

  // WebSocket event handlers for real-time updates
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      // Join admin room
      joinAdmin()
      
      // Handle booking updates
      const handleBookingAdded = (newBooking: Booking) => {
        if (newBooking.date) {
          // Recalculate available slots for the affected date
          calculateAvailableSlots()
        }
      }
      
      const handleBookingUpdated = (updatedBooking: Booking) => {
        if (updatedBooking.date) {
          // Recalculate available slots for the affected date
          calculateAvailableSlots()
        }
      }
      
      const handleBookingDeleted = (deletedBooking: Booking) => {
        if (deletedBooking.date) {
          // Recalculate available slots for the affected date
          calculateAvailableSlots()
        }
      }
      
      // Add event listeners
      socket.on('booking-added', handleBookingAdded)
      socket.on('booking-updated', handleBookingUpdated)
      socket.on('booking-deleted', handleBookingDeleted)
      
      // Cleanup
      return () => {
        socket.off('booking-added', handleBookingAdded)
        socket.off('booking-updated', handleBookingUpdated)
        socket.off('booking-deleted', handleBookingDeleted)
      }
    }
  }, [socket, isConnected, isSupported, joinAdmin])

  // Load services for dropdown
  const loadServices = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/services', {
        headers: {
          'x-admin-token': adminToken || 'test'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
        // Set first service as default if none selected
        if (data.services && data.services.length > 0 && !selectedService) {
          setSelectedService(data.services[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }, [selectedService])

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

  // Load services on component mount
  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Handle Escape key for Month/Year Picker modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMonthYearPicker) {
        setShowMonthYearPicker(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showMonthYearPicker])

  // Load working hours for current month only
  const loadWorkingHours = useCallback(async () => {
    try {
      console.log('📅 Calendar: loadWorkingHours called at:', getBulgariaTime().toISOString())
      const adminToken = localStorage.getItem('adminToken')
      
      // Зареждаме данни само за текущия месец
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
        console.log('📅 Calendar: Working hours loaded successfully for month:', startDate, 'to', endDate)
        
        // Изчисляваме свободните часове след зареждане на работните часове
        if (services.length > 0) {
          // Изчисляваме веднага, без setTimeout
          calculateAvailableSlots()
        }
      }
    } catch (error) {
      console.error('Error loading working hours:', error)
      setIsMonthDataLoading(false)
    }
  }, [currentDate, services.length])

  // Зареждане на настройки за работно време
  const loadDefaultSettings = useCallback(async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/settings', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.settings?.defaultWorkingHours) {
          setDefaultWorkingHours(data.settings.defaultWorkingHours)
          console.log('📅 Calendar: Default working hours loaded:', data.settings.defaultWorkingHours)
        } else {
          console.log('📅 Calendar: No default working hours found in settings')
        }
      } else {
        console.log('📅 Calendar: Failed to load settings, response not ok')
      }
    } catch (error) {
      console.error('Error loading default settings:', error)
    }
  }, [])



  // Зарежда данни при първоначално зареждане
  useEffect(() => {
    loadDefaultSettings()
  }, [loadDefaultSettings])

  // Консолидиран useEffect за управление на всички state updates
  useEffect(() => {
    const currentMonthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    
    // Проверяваме дали имаме нужните данни
    const hasServices = services.length > 0
    const hasWorkingHoursForMonth = workingHours.some(wh => wh.date && wh.date.startsWith(currentMonthString))
    const hasCalculatedForMonth = availableSlots.some(slot => slot.date && slot.date.startsWith(currentMonthString))
    
    console.log('📅 Calendar: useEffect check:', {
      currentMonthString,
      hasServices,
      hasWorkingHoursForMonth,
      hasCalculatedForMonth,
      isMonthDataLoading,
      workingHoursCount: workingHours.length,
      availableSlotsCount: availableSlots.length
    })
    
    if (isMonthDataLoading) {
      // Ако се зареждат данните, проверяваме дали можем да ги скрием
      if (hasServices && hasWorkingHoursForMonth && hasCalculatedForMonth) {
        console.log('📅 Calendar: All data ready for month:', currentMonthString)
        setIsMonthDataLoading(false)
        
        // Принудително re-render за да се покажат правилните данни
        setTimeout(() => {
          setForceUpdate(prev => prev + 1)
        }, 50)
      } else if (hasServices && hasWorkingHoursForMonth) {
        // Ако имаме основните данни, скриваме loading индикатора
        console.log('📅 Calendar: Basic data ready, hiding loading indicator')
        setIsMonthDataLoading(false)
      } else {
        console.log('📅 Calendar: Still waiting for data:', {
          waitingFor: {
            services: !hasServices,
            workingHours: !hasWorkingHoursForMonth,
            availableSlots: !hasCalculatedForMonth
          }
        })
      }
    } else {
      // Ако не се зареждат данните, проверяваме дали трябва да заредим
      if (!hasWorkingHoursForMonth) {
        console.log('📅 Calendar: Loading working hours for month:', currentMonthString)
        loadWorkingHours()
      } else if (!hasCalculatedForMonth && hasServices) {
        console.log('📅 Calendar: Calculating available slots for month:', currentMonthString)
        calculateAvailableSlots()
      }
    }
  }, [currentDate, workingHours, availableSlots, services.length, isMonthDataLoading])

  // Debug: Проверяваме дали bookings props са заредени правилно
  useEffect(() => {
    if (bookings.length > 0) {
      console.log('📅 Calendar: Bookings props received:', {
        totalBookings: bookings.length,
        currentMonth: currentDate.getMonth() + 1,
        currentYear: currentDate.getFullYear()
      })
    }
  }, [bookings, currentDate])

  // Следи промените в currentDate и показва индикатор за зареждане само при смяна на месеца
  useEffect(() => {
    // Показвай индикатор за зареждане само при смяна на месеца
    setIsMonthDataLoading(true)
  }, [currentDate])

  // Инициализира временните стойности когато се отвори модала
  useEffect(() => {
    if (showMonthYearPicker) {
      setTempSelectedMonth(currentDate.getMonth())
      setTempSelectedYear(currentDate.getFullYear())
    }
  }, [showMonthYearPicker, currentDate])





  // WebSocket event handlers - optimized with useCallback and debouncing
  const handleWorkingHoursUpdated = useCallback((updatedWorkingHours: WorkingHours) => {
    // Debounce updates to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      setWorkingHours(prev => prev.map(wh => 
        wh.date === updatedWorkingHours.date ? updatedWorkingHours : wh
      ))
      // Recalculate available slots after working hours update
      setTimeout(() => calculateAvailableSlots(), 100)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  const handleWorkingHoursAdded = useCallback((newWorkingHours: WorkingHours) => {
    // Debounce updates to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      setWorkingHours(prev => [...prev, newWorkingHours])
      // Recalculate available slots after working hours addition
      setTimeout(() => calculateAvailableSlots(), 100)
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  const handleWorkingHoursDeleted = useCallback((date: string) => {
    // Debounce updates to prevent excessive re-renders
    const timeoutId = setTimeout(() => {
      setWorkingHours(prev => prev.filter(wh => wh.date !== date))
      // Recalculate available slots after working hours deletion
      calculateAvailableSlots()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [])

  // WebSocket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      joinAdmin()
      
      // Listen for working hours updates
      socket.on('working-hours-updated', handleWorkingHoursUpdated)
      socket.on('working-hours-added', handleWorkingHoursAdded)
      socket.on('working-hours-deleted', handleWorkingHoursDeleted)

      return () => {
        socket.off('working-hours-updated', handleWorkingHoursUpdated)
        socket.off('working-hours-added', handleWorkingHoursAdded)
        socket.off('working-hours-deleted', handleWorkingHoursDeleted)
      }
    }
  }, [socket, isConnected, isSupported, joinAdmin, handleWorkingHoursUpdated, handleWorkingHoursAdded, handleWorkingHoursDeleted])

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

  // Debug: Log available data for current month (only once when loading starts)
  useEffect(() => {
    if (isMonthDataLoading) {
      const currentMonthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const monthBookings = Object.keys(bookingsByDate).filter(date => date.startsWith(currentMonthString))
      const monthWorkingHours = workingHours.filter(wh => wh.date && wh.date.startsWith(currentMonthString))
      
      console.log(`📅 Calendar Debug for ${currentMonthString}:`, {
        monthBookings: monthBookings.length,
        monthWorkingHours: monthWorkingHours.length,
        totalBookings: Object.keys(bookingsByDate).length,
        totalWorkingHours: workingHours.length
      })
    }
  }, [isMonthDataLoading, currentDate]) // Премахнах bookingsByDate и workingHours от dependencies

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
    // Ако има зададено работно време за тази дата, използваме него
    if (workingHoursData) {
      return !workingHoursData.isWorkingDay
    }
    
    // Използваме настройките за работни дни
    // За календарни дати използваме UTC методи за консистентност
    const dayOfWeek = date.getUTCDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isNonWorking = !defaultWorkingHours.workingDays.includes(dayOfWeek)
    

    
    return isNonWorking
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

    // Функция за изчисляване на свободните часове
  const calculateAvailableSlots = () => {
    // Проверяваме дали вече се изчисляват свободните часове
    if (isMonthDataLoading) {
      console.log('📅 Calendar: Still loading month data, skipping calculation')
      return
    }
    

    
    console.log('📅 Calendar: calculateAvailableSlots called with:', {
      currentDate: currentDate.toISOString(),
      servicesCount: services.length,
      bookingsCount: bookings.length,
      workingHoursCount: workingHours.length
    })
    
    // Проверяваме дали имаме нужните данни
    if (services.length === 0) {
      console.log('📅 Calendar: No services available, skipping calculation')
      return
    }
    
    const slots: AvailableSlots[] = []
    
    // Изчисли за всички дни от месеца
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateString = calendarDateToString(date)
      
      // Провери дали е работен ден
      if (isNonWorkingDay(date)) {
        slots.push({ date: dateString, availableSlots: [] })
        continue
      }
      
      // Получи работното време за деня
      const workingHoursData = getWorkingHoursForDate(date)
      let startTime = defaultWorkingHours.startTime
      let endTime = defaultWorkingHours.endTime
      
      if (workingHoursData) {
        if (!workingHoursData.isWorkingDay) {
          slots.push({ date: dateString, availableSlots: [] })
          continue
        }
        startTime = workingHoursData.startTime
        endTime = workingHoursData.endTime
      }
      
      // Генерирай всички възможни слотове (на всеки 30 мин)
      const availableSlots: string[] = []
      const [startHour, startMin] = startTime.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)
      
      let currentTime = startHour * 60 + startMin // минути от полунощ
      const endTimeMinutes = endHour * 60 + endMin
      
      // Получи резервациите за деня
      const dayBookings = bookingsByDate[dateString] || []
      
      // Получи почивките за деня
      const breaks = workingHoursData?.breaks || []
      
      // НЕ добавяме автоматично default почивка - потребителят може да работи без почивки
      
      // Ако няма избрана услуга, използвай първата налична услуга или default 30 мин
      let serviceDuration = 30
      if (selectedService && services.length > 0) {
        const selectedServiceData = services.find(s => s.id === selectedService)
        serviceDuration = selectedServiceData?.duration || 30
      } else if (services.length > 0) {
        // Използвай първата услуга ако няма избрана
        serviceDuration = services[0].duration || 30
      }
      




        while (currentTime < endTimeMinutes) {
          const hours = Math.floor(currentTime / 60)
          const minutes = currentTime % 60
          const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          
          // Провери дали има резервация в този час (отчитайки продължителността)
          const hasBooking = dayBookings.some(booking => {
            // Отменените резервации не блокират свободните часове
            if (booking.status === 'cancelled') {
              return false
            }
            
            const bookingStartTime = booking.time
            const [bookingHour, bookingMin] = bookingStartTime.split(':').map(Number)
            const bookingStartMinutes = bookingHour * 60 + bookingMin
            
            // Използваме реалната продължителност на резервацията 
            const bookingDuration = booking.serviceDuration || 60 // fallback към 60 мин
            

            const bookingEndMinutes = bookingStartMinutes + bookingDuration
            
            // Проверява дали услугата може да се побере в този слот
            const slotEndMinutes = currentTime + serviceDuration
            const isBlocked = (currentTime >= bookingStartMinutes && currentTime < bookingEndMinutes) ||
                             (slotEndMinutes > bookingStartMinutes && slotEndMinutes <= bookingEndMinutes) ||
                             (currentTime <= bookingStartMinutes && slotEndMinutes >= bookingEndMinutes)
            

            
            return isBlocked
          })
          
          // Провери дали е в почивка
          const isBreakTime = breaks.some(breakItem => {
            const [breakStartH, breakStartM] = breakItem.startTime.split(':').map(Number)
            const [breakEndH, breakEndM] = breakItem.endTime.split(':').map(Number)
            const breakStart = breakStartH * 60 + breakStartM
            const breakEnd = breakEndH * 60 + breakEndM
            
            // Ако почивката е 0 минути (start === end), не я считай за почивка
            if (breakStart === breakEnd) {
              return false
            }
            
            return currentTime >= breakStart && currentTime < breakEnd
          })
          
          // Провери дали услугата може да се побере до края на работния ден
          const slotEndMinutes = currentTime + serviceDuration
          const canFitInDay = slotEndMinutes <= endTimeMinutes
          
          if (!hasBooking && !isBreakTime && canFitInDay) {
            availableSlots.push(timeString)
          }
          
          currentTime += Math.min(30, serviceDuration) // следващия слот според услугата, но не повече от 30 мин
        }
        
              slots.push({ date: dateString, availableSlots })
    }
    
    console.log('📅 Calendar: Available slots calculated:', slots.length, 'days')
    setAvailableSlots(slots)
    
    // Принудително re-render за да се покажат правилните данни
    setTimeout(() => {
      setForceUpdate(prev => prev + 1)
    }, 100)
  }

  // Изчисли свободните часове когато се променят данните
  useEffect(() => {
    // Проверяваме дали имаме всички необходими данни
    const hasAllRequiredData = 
      defaultWorkingHours.workingDays.length > 0 && 
      services.length > 0 && 
      !isMonthDataLoading
    
    if (hasAllRequiredData) {
      const timeoutId = setTimeout(() => {
        calculateAvailableSlots()
      }, 100) // Debounce от 100ms за по-бързо обновяване
      
      return () => clearTimeout(timeoutId)
    }
  }, [defaultWorkingHours.workingDays.length, selectedService, services, isMonthDataLoading])

  // Функция за проверка дали денят има свободни часове
  const hasAvailableSlots = (date: Date) => {
    if (isMonthDataLoading) {
      // Ако се зареждат данните за месеца, показвай в зелено (не оранжево)
      return true
    }
    
    const dateString = calendarDateToString(date)
    const daySlots = availableSlots.find(slot => slot.date === dateString)
    
    // Ако нямаме данни за този ден, провери дали е работен ден
    if (!daySlots) {
      return !isNonWorkingDay(date)
    }
    

    
    const hasSlots = daySlots.availableSlots && daySlots.availableSlots.length > 0
    
    return hasSlots
  }

  // Функция за получаване на броя свободни часове за ден
  const getAvailableSlotsCount = (date: Date) => {

    
    const dateString = calendarDateToString(date)
    const daySlots = availableSlots.find(slot => slot.date === dateString)
    return daySlots && daySlots.availableSlots ? daySlots.availableSlots.length : 0
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
              {isMonthDataLoading && (
                <div className="flex items-center justify-center mt-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-xs text-blue-600">Зареждане...</span>
                </div>
              )}
              
              {/* Month/Year Selector Button */}
              <button
                onClick={() => setShowMonthYearPicker(true)}
                className="mt-2 text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                Избери месец/година
              </button>
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

        {/* Service Selection for Available Slots Calculation */}
        <div className="mt-4 sm:mt-6">
          <div className={`${isMobile ? 'flex-col items-start gap-2' : 'flex items-center gap-3'}`}>
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Услуга за свободни часове:
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(Number(e.target.value))}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 ${isMobile ? 'w-full' : 'min-w-[200px]'}`}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.duration} мин)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Legend */}
        <div className="mt-4 sm:mt-6">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border-2 border-green-200 rounded"></div>
              <span className="text-gray-700">Свободни часове</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-50 border-2 border-orange-200 rounded"></div>
              <span className="text-gray-700">Няма свободни часове</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-200 rounded"></div>
              <span className="text-gray-700">Почивен ден</span>
            </div>
            {isMonthDataLoading && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-blue-600">Зареждане на данните...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid - Mobile Responsive Design */}
      {isMonthDataLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Зареждане на данните за месеца...</h3>
            <p className="text-gray-500">Моля, изчакайте докато се заредят работните часове и резервациите</p>
          </div>
        </div>
      ) : (
        <>
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
                  ${isSelected ? 'border-blue-300 shadow-lg' : ''}
                  ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50/50' : ''}
                          ${isCurrentMonth(date) && isNonWorkingDay(date) && !isToday(date) ? 'bg-red-100/90 hover:bg-red-200/90 border-red-300 text-red-800' : ''}
                          ${isCurrentMonth(date) && !isNonWorkingDay(date) && hasAvailableSlots(date) && !isToday(date) ? 'bg-green-50/80 hover:bg-green-100/80 border-green-200' : ''}
        ${isCurrentMonth(date) && !isNonWorkingDay(date) && !hasAvailableSlots(date) && !isToday(date) ? 'bg-orange-100/90 hover:bg-orange-200/90 border-orange-300 text-orange-800' : ''}
                  ${isCurrentMonth(date) && !isToday(date) && !isSelected && !isNonWorkingDay(date) ? 'hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50' : ''}
                  touch-manipulation backdrop-blur-sm
                `}
              >
                {/* Mobile Portrait - Compact Layout */}
                {isMobile && isPortrait ? (
                  <>
                    {/* Date Number with Available Slots Indicator */}
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-lg font-bold ${isToday(date) ? 'text-white' : ''}`}>
                        {date.getUTCDate()}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {/* Today Indicator */}
                        {isToday(date) && (
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce" title="Днес"></div>
                        )}
                        
                        {/* Available Slots Status */}
                        {isCurrentMonth(date) && !isNonWorkingDay(date) && hasAvailableSlots(date) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title={`${getAvailableSlotsCount(date)} свободни часове`}></div>
                        )}
                      </div>
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
                        
                        {/* Working Hours Status - Completely removed */}

                        {/* Available Slots Status */}
                        {isCurrentMonth(date) && !isNonWorkingDay(date) && hasAvailableSlots(date) && (
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" title={`${getAvailableSlotsCount(date)} свободни часове`}>
                            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Add Booking Button - Hidden on mobile portrait */}
                    {isCurrentMonth(date) && onAddBooking && !isMobile && (
                      <button
                        onClick={(e) => handleAddBooking(date, e)}
                        className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 -translate-x-4 sm:-translate-x-6 md:-translate-x-8 p-1 sm:p-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transition-all duration-200 shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 z-10 w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 flex items-center justify-center"
                        title="Добави резервация"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
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

                        {/* Available Slots Info */}
                        {isCurrentMonth(date) && !isNonWorkingDay(date) && hasAvailableSlots(date) && (
                          <div className="text-sm text-green-600 text-center bg-green-50 rounded-lg py-1.5 border border-green-200">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{getAvailableSlotsCount(date)} свободни часа</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Working Hours Indicator - Hidden on mobile portrait */}
                    {isCurrentMonth(date) && !isMobile && (
                      <button
                        onClick={(e) => handleWorkingHoursClick(date, e)}
                        className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 translate-x-0.5 sm:translate-x-1 md:translate-x-2 p-1 sm:p-1.5 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-md hover:shadow-lg w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 flex items-center justify-center"
                        title="Работно време"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
        </>
      )}

      {/* Month/Year Picker Modal */}
      {showMonthYearPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowMonthYearPicker(false)}>
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4" 
               onClick={(e) => e.stopPropagation()}
               style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Избери месец и година</h3>
              <button
                onClick={() => setShowMonthYearPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setTempSelectedYear(tempSelectedYear - 1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Предишна година"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-lg font-semibold text-gray-900">{tempSelectedYear}</span>
              <button
                onClick={() => setTempSelectedYear(tempSelectedYear + 1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Следваща година"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Month Grid */}
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((month, index) => (
                <button
                  key={index}
                  onClick={() => setTempSelectedMonth(index)}
                  className={`p-3 text-center rounded-lg transition-colors ${
                    tempSelectedMonth === index
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => setShowMonthYearPicker(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Отказ
              </button>
              <button
                onClick={() => {
                  setCurrentDate(new Date(tempSelectedYear, tempSelectedMonth, 1))
                  setShowMonthYearPicker(false)
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Приложи
              </button>
            </div>
          </div>
        </div>
      )}

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
          initialData={workingHoursFromDailySchedule && dailyScheduleWorkingHours 
            ? dailyScheduleWorkingHours 
            : workingHours.find(wh => wh.date === selectedWorkingHoursDate)
          }
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
          onEditWorkingHours={(workingHoursData: WorkingHours) => {
            setWorkingHoursFromDailySchedule(true)
            setSelectedWorkingHoursDate(calendarDateToString(selectedDate))
            // Use working hours data from DailySchedule
            setDailyScheduleWorkingHours(workingHoursData)
            // Also update the workingHours array to keep it in sync
            setWorkingHours(prev => {
              const existing = prev.find(wh => wh.date === calendarDateToString(selectedDate))
              if (existing) {
                return prev.map(wh => wh.date === calendarDateToString(selectedDate) ? workingHoursData : wh)
              } else {
                return [...prev, workingHoursData]
              }
            })
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