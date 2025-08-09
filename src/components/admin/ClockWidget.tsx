'use client'

import { useState, useEffect } from 'react'
import { getBulgariaTime, getBulgariaDateString, getBulgariaTimeString, getBulgariaWeekday } from '@/lib/bulgaria-time'

interface ClockWidgetProps {
  className?: string
}

const ClockWidget = ({ className = '' }: ClockWidgetProps) => {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentDateTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted || !currentDateTime) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
          {/* Loading State - Beautiful Skeleton */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 animate-pulse">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex flex-col items-center justify-center">
                <div className="text-center">
                  <div className="font-mono font-bold text-lg sm:text-xl lg:text-2xl tracking-wider text-slate-400">
                    --:--:--
                  </div>
                  <div className="font-mono text-xs sm:text-sm text-slate-400 mt-1">
                    Зареждане...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatDateTime = () => {
    
    return {
      date: getBulgariaDateString(),
      time: getBulgariaTimeString(),
      weekday: getBulgariaWeekday()
    }
  }

  const { time, date, weekday } = formatDateTime(currentDateTime)
  const currentTime = getBulgariaTime()
  
  // Calculate hand angles
  const hours = currentTime.getHours() % 12
  const minutes = currentTime.getMinutes()
  const seconds = currentTime.getSeconds()
  
  const hourAngle = (hours * 30) + (minutes * 0.5)
  const minuteAngle = minutes * 6
  const secondAngle = seconds * 6

  return (
    <div className={`relative ${className}`}>
      {/* Modern Clock Design */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48">
        {/* Outer Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 blur-xl animate-pulse" />
        
        {/* Main Clock Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl border-4 border-white/20 backdrop-blur-sm">
          {/* Inner Ring with Glass Effect */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500/90 via-purple-500/90 to-pink-500/90 border-2 border-white/30 backdrop-blur-sm">
            {/* Clock Face with Glass Morphism */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/10 via-white/20 to-white/10 backdrop-blur-md flex flex-col items-center justify-center text-white">
              
              {/* Digital Time Display */}
              <div className="text-center z-10">
                <div className="font-mono font-bold text-lg sm:text-xl lg:text-2xl tracking-wider text-white drop-shadow-lg" suppressHydrationWarning>
                  {time}
                </div>
                <div className="font-mono text-xs sm:text-sm opacity-90 mt-1 text-white/90 drop-shadow-md" suppressHydrationWarning>
                  {weekday}
                </div>
                <div className="font-mono text-xs sm:text-sm opacity-90 text-white/90 drop-shadow-md" suppressHydrationWarning>
                  {date}
                </div>
              </div>
              
              {/* Analog Clock Hands */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Hour Numbers */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute text-white font-bold text-xs sm:text-sm drop-shadow-md"
                    style={{
                      transform: `rotate(${index * 30}deg) translateY(-40%)`,
                      left: '50%',
                      top: '50%',
                      marginLeft: '-0.5rem',
                      marginTop: '-0.5rem'
                    }}
                  >
                    {hour}
                  </div>
                ))}
                
                {/* Hour Hand */}
                <div 
                  className="absolute w-1.5 bg-white rounded-full origin-bottom shadow-lg transition-transform duration-1000 ease-out"
                  style={{
                    height: '20%',
                    transform: `rotate(${hourAngle}deg)`,
                    top: '30%',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                  }}
                />
                
                {/* Minute Hand */}
                <div 
                  className="absolute w-1 bg-white rounded-full origin-bottom shadow-lg transition-transform duration-1000 ease-out"
                  style={{
                    height: '30%',
                    transform: `rotate(${minuteAngle}deg)`,
                    top: '20%',
                    boxShadow: '0 0 8px rgba(255,255,255,0.4)'
                  }}
                />
                
                {/* Second Hand */}
                <div 
                  className="absolute w-0.5 bg-red-400 rounded-full origin-bottom shadow-lg transition-transform duration-1000 ease-out"
                  style={{
                    height: '35%',
                    transform: `rotate(${secondAngle}deg)`,
                    top: '15%',
                    boxShadow: '0 0 6px rgba(248,113,113,0.6)'
                  }}
                />
                
                {/* Center Dot with Glow */}
                <div className="absolute w-4 h-4 bg-white rounded-full shadow-lg" style={{
                  boxShadow: '0 0 15px rgba(255,255,255,0.8), inset 0 0 5px rgba(0,0,0,0.1)'
                }} />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute inset-0 rounded-full border border-white/20" />
              <div className="absolute inset-4 rounded-full border border-white/10" />
              
              {/* Animated Particles */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
                    style={{
                      left: `${50 + 45 * Math.cos(i * 60 * Math.PI / 180)}%`,
                      top: `${50 + 45 * Math.sin(i * 60 * Math.PI / 180)}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-br from-green-400 to-blue-500 rounded-full animate-pulse" />
        
        {/* Status Indicator */}
        <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg" />
      </div>
    </div>
  )
}

export default ClockWidget 