'use client'

import { useState, useEffect } from 'react'

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (!online) {
        setShowBanner(true)
      } else {
        // Скрыва банеря след 3 секунди когато се върне онлайн
        setTimeout(() => setShowBanner(false), 3000)
      }
    }

    // Проверка при зареждане
    updateOnlineStatus()

    // Слушане за промени в онлайн статуса
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (!showBanner) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="px-4 py-2 text-center text-sm font-medium">
        {isOnline ? (
          <div className="flex items-center justify-center space-x-2">
            <span>✅</span>
            <span>Връзката е възстановена</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>📱</span>
            <span>Работите офлайн - някои функции може да не са налични</span>
          </div>
        )}
      </div>
    </div>
  )
}
