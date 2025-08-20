'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, X, Bell } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { getBulgariaDateStringDB, getBulgariaTime } from '@/lib/bulgaria-time'

interface Booking {
  id: string
  name: string
  phone: string
  serviceName: string
  time: string
  date: string
}

interface NextBookingNotificationProps {
  currentTime: Date
}

const NextBookingNotification = ({ currentTime }: NextBookingNotificationProps) => {
  const [nextBooking, setNextBooking] = useState<Booking | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [hasPlayedSound, setHasPlayedSound] = useState(false)
  const [lastCheck, setLastCheck] = useState<number>(0)
  const [cachedBookings, setCachedBookings] = useState<Booking[]>([])
  
  // WebSocket connection
  const { socket, isConnected, isSupported, joinAdmin } = useSocket()
  const isFetchingRef = useRef(false)
  // Track per-booking reminders so we don't repeat notifications on each interval tick
  const reminderFlagsRef = useRef<Record<string, { notified5: boolean; notified0: boolean }>>({})
  const [lastReminderLabel, setLastReminderLabel] = useState<string>('')
  // Snooze control: if set, don't show notifications until this timestamp
  const snoozeUntilRef = useRef<number>(0)
  // Mute per booking for the day
  const mutedTodayRef = useRef<Set<string>>(new Set())

  const checkNextBooking = useCallback(async () => {
    try {
      console.log('🔍 NextBookingNotification: checkNextBooking called at:', getBulgariaTime().toISOString())
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      if (!adminToken) {
        console.log('🔔 NextBookingNotification: No admin token, skipping API call')
        return
      }

      // Additional protection - don't make API calls if we're not on admin page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin')) {
        console.log('🔔 NextBookingNotification: Not on admin page, skipping API call')
        return
      }

      // Get today's date
      const today = getBulgariaDateStringDB()
      console.log('🔍 NextBookingNotification: Checking for today:', today)
      
      // Check if we need to fetch new data (shorten gate; refresh fast after mount)
      const now = Date.now()
      const shouldFetch = (lastCheck === 0) || ((now - lastCheck) > 60_000) // 60s
      console.log('🔍 NextBookingNotification: shouldFetch:', shouldFetch, 'cachedBookings.length:', cachedBookings.length, 'timeSinceLastCheck:', now - lastCheck)
      
      if (shouldFetch) {
        console.log('🔔 NextBookingNotification: Fetching all bookings and filtering client-side...')
        // Fetch all and filter for today (API without date returns full list)
        const response = await fetch(`/api/admin/bookings`, {
          headers: {
            'x-admin-token': adminToken || 'mock-token'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const all = (data.bookings || []) as Booking[]
          const bookings = all.filter(b => b.date === today)
          setCachedBookings(bookings)
          setLastCheck(now)
          console.log('🔔 NextBookingNotification: Bookings cached successfully, count:', bookings.length)
          // Load muted set for today
          try {
            const rawMuted = localStorage.getItem(`next-booking-muted-${today}`)
            const arr = rawMuted ? (JSON.parse(rawMuted) as string[]) : []
            mutedTodayRef.current = new Set(arr)
          } catch {}
        } else {
          // On non-OK, still move lastCheck forward to avoid hammering API
          setLastCheck(now)
        }
      } else {
        console.log('🔔 NextBookingNotification: Using cached data, skipping API call')
      }
    } catch (error) {
      console.error('Error checking next booking:', error)
    }
  }, [cachedBookings.length, lastCheck])

  const checkUrgentBooking = useCallback(() => {
    if (!cachedBookings.length) return

    const today = getBulgariaDateStringDB()
    const todayBookings = cachedBookings
      .filter((booking: Booking) => booking.date === today)
      .sort((a: Booking, b: Booking) => a.time.localeCompare(b.time))

    // Find bookings that are exactly T-5 or T-0 (and overdue)
    const nextBooking = todayBookings.find((booking: Booking) => {
      if (mutedTodayRef.current.has(booking.id)) return false
      const [bookingHour, bookingMinute] = booking.time.split(':').map(Number)
      const bookingTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bookingHour, bookingMinute)
      const timeDiff = bookingTime.getTime() - currentTime.getTime()
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))
      
      // Trigger only at T-5 and T-0 (keep overdue as T-0)
      return minutesDiff === 5 || minutesDiff === 0
    })

    if (nextBooking) {
      // Respect snooze window
      if (Date.now() < snoozeUntilRef.current) {
        setIsVisible(false)
        return
      }
      setNextBooking(nextBooking)
      setIsVisible(true)
      setIsDismissed(false)
      
      // Play sound for urgent bookings (within 5 minutes or overdue)
      const [bookingHour, bookingMinute] = nextBooking.time.split(':').map(Number)
      const bookingTime = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), bookingHour, bookingMinute)
      const timeDiff = bookingTime.getTime() - currentTime.getTime()
      const minutesDiff = Math.floor(timeDiff / (1000 * 60))

      // Initialize flags for this booking
      if (!reminderFlagsRef.current[nextBooking.id]) {
        reminderFlagsRef.current[nextBooking.id] = { notified5: false, notified0: false }
      }
      const flags = reminderFlagsRef.current[nextBooking.id]

      // Fire dedicated reminders at T-5 and T-0 (exact minute)
      if (minutesDiff === 5 && !flags.notified5) {
        setLastReminderLabel('Напомняне: 5 мин преди срещата')
        flags.notified5 = true
      }
      if (minutesDiff === 0 && !flags.notified0) {
        setLastReminderLabel('Начало на срещата')
        flags.notified0 = true
      }

      // Play sound for T-5 and T-0 (and overdue)
      if ((minutesDiff <= 5) && !hasPlayedSound) {
        // Create and play notification sound
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
        audio.volume = 0.3
        audio.play().catch(() => {}) // Ignore errors if audio fails
        setHasPlayedSound(true)
      }
    } else {
      setIsVisible(false)
      setHasPlayedSound(false)
    }
  }, [cachedBookings, currentTime, hasPlayedSound])

  // Load cached data from sessionStorage on mount (to avoid extra fetches after remount)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem('next-booking-cache')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed.bookings)) setCachedBookings(parsed.bookings)
        if (typeof parsed.lastCheck === 'number') setLastCheck(parsed.lastCheck)
      }
    } catch {}
  }, [])

  // Persist cache to sessionStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(
        'next-booking-cache',
        JSON.stringify({ bookings: cachedBookings, lastCheck })
      )
    } catch {}
  }, [cachedBookings, lastCheck])

  // Safe polling loop with guards to avoid mass requests
  useEffect(() => {
    let stopped = false

    const run = async () => {
      if (stopped) return
      if (isFetchingRef.current) return
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/admin')) return

      isFetchingRef.current = true
      try {
        await checkNextBooking()
        // Evaluate immediately after fetching
        checkUrgentBooking()
      } catch (e) {
        console.error('NextBookingNotification run() error:', e)
      } finally {
        isFetchingRef.current = false
      }
    }

    // initial run
    run()

    // run when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run()
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
    }

    // run every 60s; internal 5-min cache prevents excess API calls
    const interval = setInterval(run, 60_000)

    return () => {
      stopped = true
      clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
      }
    }
  }, [checkNextBooking])

  // Separate useEffect for urgent booking checks
  useEffect(() => {
    if (!cachedBookings.length) return

    // Check if user is authenticated before starting interval
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
    if (!adminToken) {
      console.log('🔔 NextBookingNotification: No admin token, skipping urgent booking interval')
      return
    }

    // Check for urgent bookings more frequently for accurate minute triggers
    const urgentInterval = setInterval(checkUrgentBooking, 15000) // 15 seconds

    return () => clearInterval(urgentInterval)
  }, [cachedBookings.length, checkUrgentBooking])

  // WebSocket event listeners
  useEffect(() => {
    if (socket && isConnected && isSupported) {
      joinAdmin()

      // Listen for real-time booking updates
      socket.on('next-booking-changed', (booking: Booking) => {
        setNextBooking(booking)
        setIsVisible(true)
        setIsDismissed(false)
        setHasPlayedSound(false)
      })

      socket.on('booking-added', (booking: Booking) => {
        // Update cache and check immediately (no wait)
        setCachedBookings(prev => {
          const next = [...prev, booking]
          return next
        })
        setTimeout(() => checkUrgentBooking(), 0)
        console.log('🔔 NextBookingNotification: Booking added via WebSocket (instant check)')
      })

      socket.on('booking-deleted', (bookingId: string) => {
        setCachedBookings(prev => prev.filter(b => b.id !== bookingId))
        setTimeout(() => checkUrgentBooking(), 0)
        console.log('🔔 NextBookingNotification: Booking deleted via WebSocket (instant check)')
      })

      return () => {
        socket.off('next-booking-changed')
        socket.off('booking-added')
        socket.off('booking-deleted')
      }
    } else if (!isSupported) {
      // Fallback to polling if WebSocket is not supported
      console.log('🔄 Using polling fallback')
    }
  }, [socket, isConnected, isSupported, joinAdmin]) // Remove checkNextBooking from dependencies

  useEffect(() => {
    if (isVisible && !isDismissed) {
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 20000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, isDismissed])

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  // Snooze disabled per request

  const handleMuteToday = () => {
    if (!nextBooking) return
    const today = getBulgariaDateStringDB()
    mutedTodayRef.current.add(nextBooking.id)
    try {
      localStorage.setItem(
        `next-booking-muted-${today}`,
        JSON.stringify(Array.from(mutedTodayRef.current))
      )
    } catch {}
    setIsVisible(false)
    setIsDismissed(true)
  }

  // Check if user is authenticated before rendering anything
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
  if (!adminToken || !isVisible || isDismissed || !nextBooking) {
    return null
  }

  // Calculate time until next booking
      const now = getBulgariaTime()
  const [bookingHour, bookingMinute] = nextBooking.time.split(':').map(Number)
  const bookingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), bookingHour, bookingMinute)
  const timeDiff = bookingTime.getTime() - now.getTime()
  const minutesUntil = Math.floor(timeDiff / (1000 * 60))

  // Visual severity by proximity
  const severity = minutesUntil <= 0 ? 'danger' : minutesUntil <= 10 ? 'warning' : 'info'
  const styles = severity === 'danger'
    ? { container: 'bg-red-600 border-red-500 text-white', pill: 'bg-white/20 text-white', accent: 'text-white' }
    : severity === 'warning'
    ? { container: 'bg-amber-500 border-amber-400 text-white', pill: 'bg-white/20 text-white', accent: 'text-white' }
    : { container: 'bg-indigo-600 border-indigo-500 text-white', pill: 'bg-white/20 text-white', accent: 'text-white' }

  return (
    <div className={`fixed bottom-4 left-4 z-50 w-80 shadow-xl border rounded-xl p-4 ${styles.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Bell className={`w-5 h-5 ${styles.accent}`} />
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-semibold">Следваща резервация</span>
            </div>
            <div className="text-sm opacity-95">
              <span className="font-medium">{nextBooking.name}</span>
              <span className="mx-1">·</span>
              <span>{nextBooking.serviceName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className={`w-4 h-4 ${styles.accent}`} />
              <span className="font-semibold">{nextBooking.time}</span>
              {lastReminderLabel && (
                <span className={`ml-1 inline-block px-2 py-0.5 rounded ${styles.pill}`}>{lastReminderLabel}</span>
              )}
            </div>
            <div className="text-xs opacity-90">
              {minutesUntil > 0 ? (
                <span>След {minutesUntil} мин.</span>
              ) : minutesUntil < 0 ? (
                <span className="font-semibold">ЗАКЪСНЯВА!</span>
              ) : (
                <span className="font-semibold">СЕГА!</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Snooze button removed */}
          <button
            onClick={handleMuteToday}
            className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            title="Не напомняй днес за тази среща"
          >
            Спри
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-white/20 transition-colors"
            title="Затвори"
          >
            <X className={`w-4 h-4 ${styles.accent}`} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NextBookingNotification 