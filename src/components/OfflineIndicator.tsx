'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Clock, CheckCircle } from 'lucide-react'
import { offlineStorage } from '@/lib/offline-storage'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingActions, setPendingActions] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      
      if (online) {
        // Когато се върне връзката, започваме синхронизация
        setIsSyncing(true)
        offlineStorage.syncActions().finally(() => {
          setIsSyncing(false)
          setPendingActions(offlineStorage.getPendingCount())
        })
      } else {
        setIsSyncing(false)
      }
      
      setPendingActions(offlineStorage.getPendingCount())
    }

    updateStatus()
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Проверяваме на всеки 5 секунди за промени в pending actions
    const interval = setInterval(() => {
      setPendingActions(offlineStorage.getPendingCount())
    }, 5000)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  if (isOnline && pendingActions === 0 && !isSyncing) {
    return null
  }

  return (
    <div className={`fixed top-16 right-4 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-500' : 'bg-red-500'
    } text-white rounded-lg shadow-lg p-3 max-w-sm`}>
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {isSyncing ? (
            <Clock className="w-5 h-5 animate-spin" />
          ) : isOnline ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {isSyncing ? (
            <div>
              <p className="text-sm font-medium">Синхронизиране...</p>
              <p className="text-xs opacity-90">
                Изпълняват се {pendingActions} офлайн действия
              </p>
            </div>
          ) : isOnline ? (
            <div>
              <p className="text-sm font-medium">Онлайн</p>
              {pendingActions > 0 && (
                <p className="text-xs opacity-90">
                  {pendingActions} действия чакат синхронизация
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">Офлайн режим</p>
              <p className="text-xs opacity-90">
                Промените ще се запазят за синхронизация
              </p>
            </div>
          )}
        </div>

        {pendingActions > 0 && !isSyncing && (
          <div className="flex-shrink-0">
            <div className="bg-white/20 rounded-full px-2 py-1">
              <span className="text-xs font-bold">{pendingActions}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
