/**
 * Offline-first API wrapper with automatic caching and synchronization
 * Provides seamless online/offline API experience
 */

import { offlineDetector } from './offline-detector'
import { offlineStorage } from './offline-storage'
import { offlineFetch, OfflineFetchOptions } from './offline-fetch'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  offline?: boolean
  fromCache?: boolean
  cached?: boolean
}

interface ApiRequestOptions extends OfflineFetchOptions {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  headers?: Record<string, string>
  timeout?: number
  cache?: boolean
  cacheTTL?: number
  fallbackData?: any
  retryAttempts?: number
  retryDelay?: number
}

class OfflineAPI {
  private baseURL: string = ''
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  public async request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    const {
      endpoint,
      method = 'GET',
      data,
      headers = {},
      timeout = 10000,
      cache = true,
      cacheTTL = 300000, // 5 minutes
      fallbackData,
      retryAttempts = 3,
      retryDelay = 1000,
      ...fetchOptions
    } = options

    const url = this.buildURL(endpoint)
    const requestOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...headers
      },
      ...fetchOptions
    }

    // Add body for non-GET requests
    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data)
    }

    try {
      const response = await offlineFetch.fetch(url, {
        ...requestOptions,
        timeout,
        cache,
        cacheTTL,
        fallbackData,
        retryAttempts,
        retryDelay
      })

      const responseData = await response.json()

      return {
        data: responseData,
        offline: response.offline || false,
        fromCache: response.fromCache || false,
        cached: response.cached || false
      }

    } catch (error) {
      console.error(`[OfflineAPI] Request failed for ${endpoint}:`, error)
      
      // Try to get cached data as fallback
      if (cache) {
        const cachedData = await offlineStorage.getCachedData(url)
        if (cachedData) {
          return {
            data: cachedData,
            offline: true,
            fromCache: true,
            cached: true
          }
        }
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        offline: !offlineDetector.isOnline()
      }
    }
  }

  // Convenience methods
  public async get<T = any>(endpoint: string, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...options,
      endpoint,
      method: 'GET'
    })
  }

  public async post<T = any>(endpoint: string, data?: any, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...options,
      endpoint,
      method: 'POST',
      data
    })
  }

  public async put<T = any>(endpoint: string, data?: any, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...options,
      endpoint,
      method: 'PUT',
      data
    })
  }

  public async delete<T = any>(endpoint: string, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...options,
      endpoint,
      method: 'DELETE'
    })
  }

  public async patch<T = any>(endpoint: string, data?: any, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...options,
      endpoint,
      method: 'PATCH',
      data
    })
  }

  // Specialized methods for common endpoints
  public async getBookings(): Promise<ApiResponse> {
    const response = await this.get('/api/admin/bookings', {
      cache: true,
      cacheTTL: 60000, // 1 minute
      fallbackData: await offlineStorage.getBookings()
    })

    // Store in offline storage if successful
    if (response.data && !response.offline) {
      await offlineStorage.storeBookings(response.data)
    }

    return response
  }

  public async getServices(): Promise<ApiResponse> {
    const response = await this.get('/api/admin/services', {
      cache: true,
      cacheTTL: 300000, // 5 minutes
      fallbackData: await offlineStorage.getServices()
    })

    // Store in offline storage if successful
    if (response.data && !response.offline) {
      await offlineStorage.storeServices(response.data)
    }

    return response
  }

  public async getUsers(): Promise<ApiResponse> {
    const response = await this.get('/api/admin/users', {
      cache: true,
      cacheTTL: 300000, // 5 minutes
      fallbackData: await offlineStorage.getUsers()
    })

    // Store in offline storage if successful
    if (response.data && !response.offline) {
      await offlineStorage.storeUsers(response.data)
    }

    return response
  }

  public async createBooking(bookingData: any): Promise<ApiResponse> {
    const response = await this.post('/api/admin/bookings', bookingData, {
      cache: false,
      retryAttempts: 5,
      retryDelay: 2000
    })

    // Add to sync queue if offline
    if (response.offline) {
      await offlineStorage.addToSyncQueue({
        id: `booking-${Date.now()}`,
        action: 'create',
        data: bookingData,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 5
      })
    }

    return response
  }

  public async updateBooking(id: string, bookingData: any): Promise<ApiResponse> {
    const response = await this.put(`/api/admin/bookings/${id}`, bookingData, {
      cache: false,
      retryAttempts: 5,
      retryDelay: 2000
    })

    // Add to sync queue if offline
    if (response.offline) {
      await offlineStorage.addToSyncQueue({
        id: `booking-update-${id}-${Date.now()}`,
        action: 'update',
        data: { id, ...bookingData },
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 5
      })
    }

    return response
  }

  public async deleteBooking(id: string): Promise<ApiResponse> {
    const response = await this.delete(`/api/admin/bookings/${id}`, {
      cache: false,
      retryAttempts: 5,
      retryDelay: 2000
    })

    // Add to sync queue if offline
    if (response.offline) {
      await offlineStorage.addToSyncQueue({
        id: `booking-delete-${id}-${Date.now()}`,
        action: 'delete',
        data: { id },
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 5
      })
    }

    return response
  }

  // Sync management
  public async syncPendingActions(): Promise<{ success: number; failed: number }> {
    if (!offlineDetector.isOnline()) {
      return { success: 0, failed: 0 }
    }

    const syncQueue = await offlineStorage.getSyncQueue()
    let success = 0
    let failed = 0

    for (const item of syncQueue) {
      try {
        const apiCall = this.getApiCallForAction(item.action)
        const success = await offlineStorage.processSyncItem(item, apiCall)
        
        if (success) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error(`[OfflineAPI] Sync failed for item ${item.id}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  private getApiCallForAction(action: string): (data: any) => Promise<any> {
    switch (action) {
      case 'create':
        return (data) => this.createBooking(data)
      case 'update':
        return (data) => this.updateBooking(data.id, data)
      case 'delete':
        return (data) => this.deleteBooking(data.id)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  // Utility methods
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint
    }
    
    const base = this.baseURL || (typeof window !== 'undefined' ? window.location.origin : '')
    return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  }

  public setBaseURL(baseURL: string): void {
    this.baseURL = baseURL
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  public async clearCache(): Promise<void> {
    await offlineStorage.clearExpiredCache()
  }

  public async getPendingSyncCount(): Promise<number> {
    return await offlineStorage.getPendingCount()
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/api/health', {
        timeout: 5000,
        cache: false
      })
      return response.data?.status === 'ok'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const offlineAPI = new OfflineAPI()

// Export types
export type { ApiResponse, ApiRequestOptions }
