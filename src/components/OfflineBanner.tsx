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
        : 'bg-orange-500 text-white'
    }`}>
      <div className="px-4 py-2 flex items-center justify-between text-sm font-medium">
        <div className="flex-1">
          {isOnline ? (
            <div className="flex items-center justify-center space-x-2">
              <span>✅</span>
              <span>Връзката е възстановена</span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <span>📱</span>
                <span className="font-semibold">Офлайн режим</span>
              </div>
              <div className="text-xs opacity-90 text-center">
                <div>✅ Резервации се запазват локално</div>
                <div>✅ Преглед на запазени данни</div>
                <div>⚠️ Синхронизация при връзка</div>
              </div>
              <button
                onClick={() => {
                  // Force check connection
                  window.location.reload()
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
              >
                Опитай отново
              </button>
            </div>
          )}
        </div>
        
        {/* Close button */}
        <button
          onClick={() => setShowBanner(false)}
          className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          title="Затвори"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
