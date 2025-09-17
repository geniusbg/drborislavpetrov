/**
 * Offline status indicator component
 * Shows current connection status and pending sync actions
 */

import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Sync, AlertCircle, CheckCircle } from 'lucide-react'
import { useOffline } from '@/hooks/useOffline'

interface OfflineStatusProps {
  showDetails?: boolean
  className?: string
}

export default function OfflineStatus({ showDetails = false, className = '' }: OfflineStatusProps) {
  const { isOnline, isOffline, connectionQuality, retryCount, syncPendingActions, getPendingCount } = useOffline()
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingCount()
      setPendingCount(count)
    }

    updatePendingCount()
    
    // Update every 5 seconds
    const interval = setInterval(updatePendingCount, 5000)
    return () => clearInterval(interval)
  }, [getPendingCount])

  const handleSync = async () => {
    if (isSyncing || !isOnline) return

    setIsSyncing(true)
    try {
      const result = await syncPendingActions()
      if (result.success > 0) {
        setLastSync(new Date())
        setPendingCount(prev => Math.max(0, prev - result.success))
      }
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusIcon = () => {
    if (isOffline) {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'good':
        return <Wifi className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <Wifi className="w-4 h-4 text-orange-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    if (isOffline) {
      return 'Офлайн'
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return 'Отлично'
      case 'good':
        return 'Добро'
      case 'poor':
        return 'Слабо'
      default:
        return 'Неизвестно'
    }
  }

  const getStatusColor = () => {
    if (isOffline) {
      return 'text-red-600 bg-red-50 border-red-200'
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'good':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {pendingCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {pendingCount}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isSyncing ? (
              <Sync className="w-4 h-4 animate-spin" />
            ) : (
              <Sync className="w-4 h-4" />
            )}
            Синхронизирай
          </button>
        )}
      </div>

      {showDetails && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Статус:</span>
            <span className="font-medium">{isOnline ? 'Онлайн' : 'Офлайн'}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Качество:</span>
            <span className="font-medium">{getStatusText()}</span>
          </div>
          
          {retryCount > 0 && (
            <div className="flex justify-between">
              <span>Опити:</span>
              <span className="font-medium">{retryCount}</span>
            </div>
          )}
          
          {pendingCount > 0 && (
            <div className="flex justify-between">
              <span>Чакащи действия:</span>
              <span className="font-medium text-red-600">{pendingCount}</span>
            </div>
          )}
          
          {lastSync && (
            <div className="flex justify-between">
              <span>Последна синхронизация:</span>
              <span className="font-medium text-xs">
                {lastSync.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      {isOffline && (
        <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Няма интернет връзка. Данните ще се синхронизират при връзка.</span>
          </div>
        </div>
      )}

      {isOnline && pendingCount === 0 && lastSync && (
        <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded-md">
          <div className="flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Всички данни са синхронизирани</span>
          </div>
        </div>
      )}
    </div>
  )
}
