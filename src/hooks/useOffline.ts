/**
 * React hook for offline state management
 * Provides offline status and utilities for components
 */

import { useState, useEffect, useCallback } from 'react'
import { offlineDetector, OfflineState } from '@/lib/offline-detector'
import { offlineAPI } from '@/lib/offline-api'

interface UseOfflineReturn {
  isOnline: boolean
  connectionQuality: OfflineState['connectionQuality']
  isOffline: boolean
  retryCount: number
  lastCheck: number
  checkConnection: () => Promise<boolean>
  syncPendingActions: () => Promise<{ success: number; failed: number }>
  getPendingCount: () => Promise<number>
  clearCache: () => Promise<void>
}

export function useOffline(): UseOfflineReturn {
  const [offlineState, setOfflineState] = useState<OfflineState>(() => offlineDetector.getState())

  useEffect(() => {
    // Subscribe to offline state changes
    const unsubscribe = offlineDetector.subscribe((state) => {
      setOfflineState(state)
    })

    // Initial sync if online
    if (offlineState.isOnline) {
      syncPendingActions()
    }

    return unsubscribe
  }, [])

  const checkConnection = useCallback(async (): Promise<boolean> => {
    return await offlineDetector.forceCheck()
  }, [])

  const syncPendingActions = useCallback(async (): Promise<{ success: number; failed: number }> => {
    try {
      return await offlineAPI.syncPendingActions()
    } catch (error) {
      console.error('[useOffline] Sync failed:', error)
      return { success: 0, failed: 0 }
    }
  }, [])

  const getPendingCount = useCallback(async (): Promise<number> => {
    try {
      return await offlineAPI.getPendingSyncCount()
    } catch (error) {
      console.error('[useOffline] Get pending count failed:', error)
      return 0
    }
  }, [])

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await offlineAPI.clearCache()
    } catch (error) {
      console.error('[useOffline] Clear cache failed:', error)
    }
  }, [])

  return {
    isOnline: offlineState.isOnline,
    connectionQuality: offlineState.connectionQuality,
    isOffline: !offlineState.isOnline,
    retryCount: offlineState.retryCount,
    lastCheck: offlineState.lastCheck,
    checkConnection,
    syncPendingActions,
    getPendingCount,
    clearCache
  }
}
