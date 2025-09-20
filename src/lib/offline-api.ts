/**
 * Offline-first API wrapper
 * Handles online/offline states and provides caching/fallback
 */

import { offlineDetector } from './offline-detector'
import { offlineStorage } from './offline-storage'
import { offlineFetch, OfflineFetchOptions } from './offline-fetch'

interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  offline?: boolean
  fromCache?: boolean
  cached?: boolean
}

interface ApiRequestOptions extends OfflineFetchOptions {
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: unknown
  headers?: Record<string, string>
  timeout?: number
  cache?: boolean
  cacheTTL?: number
  fallbackData?: unknown
  retryAttempts?: number
  retryDelay?: number
  forceRefresh?: boolean
}

class OfflineAPI {
  private baseURL: string

  constructor(baseURL: string = '') {
    this.baseURL = baseURL
  }

  public async request<T = unknown>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
    const {
      endpoint,
      method = 'GET',
      data,
      headers = {},
      timeout = 10000,
      cache = true,
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      fallbackData,
      retryAttempts = 3,
      retryDelay = 1000,
      forceRefresh = false,
      ...fetchOptions
    } = options

    // When online, disable caching for fresh data
    const isOnline = offlineDetector.canMakeRequest()
    const shouldCache = cache && !isOnline

    const url = `${this.baseURL}${endpoint}`
    const cacheKey = `${method}:${url}`

    // Check if we can make a request
    if (!offlineDetector.canMakeRequest()) {
      console.log(`[OfflineAPI] Offline detected for ${url}, using cached data`)
      
      // Try to get cached data
      const cachedData = await this.getCachedData<T>(cacheKey)
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          offline: true
        }
      }

      // Use fallback data if available
      if (fallbackData) {
        return {
          data: fallbackData as T,
          offline: true
        }
      }

      return {
        error: 'No internet connection and no cached data available',
        offline: true
      }
    } else {
      // When online, skip cached data and always fetch fresh
      console.log(`[OfflineAPI] Online detected for ${url}, fetching fresh data`)
    }

    try {
      // Mark that we're attempting a request
      offlineDetector.markRequestAttempted()

      // Get admin token if available
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      
      const response = await offlineFetch.fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken && { 'x-admin-token': adminToken }),
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        timeout,
        forceRefresh,
        ...fetchOptions
      })

      if (response.ok) {
        // offline-fetch now always sets response.data, so we can use it directly
        const responseData = response.data as T
        
        // Cache the response only if we should cache (offline mode)
        if (shouldCache) {
          await this.cacheResponse(cacheKey, responseData, cacheTTL)
        }

        return {
          data: responseData,
          fromCache: response.fromCache || false
        }
      } else {
        // offline-fetch now always sets response.data, so we can use it directly
        const errorData = response.data as { error?: string } || { error: 'Unknown error' }
        return {
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          offline: response.offline || false
        }
      }
    } catch (error) {
      console.warn(`[OfflineAPI] Request failed for ${url}, trying cached data:`, error)
      
      // Try to get cached data as fallback
      const cachedData = await this.getCachedData<T>(cacheKey)
      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          offline: true
        }
      }

      // Use fallback data if available
      if (fallbackData) {
        return {
          data: fallbackData as T,
          offline: true
        }
      }

      return {
        error: error instanceof Error ? error.message : 'Network request failed',
        offline: true
      }
    }
  }

  // Convenience methods
  async get<T = unknown>(endpoint: string, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, endpoint, method: 'GET' })
  }

  async post<T = unknown>(endpoint: string, data?: unknown, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, endpoint, method: 'POST', data })
  }

  async put<T = unknown>(endpoint: string, data?: unknown, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, endpoint, method: 'PUT', data })
  }

  async delete<T = unknown>(endpoint: string, options: Partial<ApiRequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, endpoint, method: 'DELETE' })
  }

  // Specific API methods
  async getBookings(): Promise<ApiResponse<{ bookings: unknown[] }>> {
    const response = await this.get<{ bookings: unknown[] }>('/api/admin/bookings', {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fallbackData: { bookings: [] }
    })
    
    // Store bookings in dedicated store for offline access
    if (response.data && !response.offline) {
      const bookingsData = response.data as { bookings: unknown[] }
      if (bookingsData.bookings && bookingsData.bookings.length > 0) {
        await offlineStorage.storeBookings(bookingsData.bookings)
        console.log(`[OfflineAPI] Stored ${bookingsData.bookings.length} bookings in dedicated store`)
      }
    }
    
    // If no data from cache, try dedicated store
    if (response.offline && (!response.data || (response.data as { bookings: unknown[] }).bookings.length === 0)) {
      try {
        const storedBookings = await offlineStorage.getBookings()
        if (storedBookings.length > 0) {
          console.log(`[OfflineAPI] Fallback to dedicated store: ${storedBookings.length} bookings`)
          return {
            data: { bookings: storedBookings },
            offline: true
          } as ApiResponse<{ bookings: unknown[] }>
        }
      } catch (error) {
        console.warn('[OfflineAPI] Failed to get bookings from dedicated store:', error)
      }
    }
    
    return response
  }

  async getServices(): Promise<ApiResponse<{ services: unknown[] }>> {
    const response = await this.get<{ services: unknown[] }>('/api/admin/services', {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      fallbackData: { services: [] }
    })
    
    // Store services in dedicated store for offline access
    if (response.data && !response.offline) {
      const servicesData = response.data as { services: unknown[] }
      if (servicesData.services && servicesData.services.length > 0) {
        await offlineStorage.storeServices(servicesData.services)
        console.log(`[OfflineAPI] Stored ${servicesData.services.length} services in dedicated store`)
      }
    }
    
    // If no data from cache, try dedicated store
    if (response.offline && (!response.data || (response.data as { services: unknown[] }).services.length === 0)) {
      try {
        const storedServices = await offlineStorage.getServices()
        if (storedServices.length > 0) {
          console.log(`[OfflineAPI] Fallback to dedicated store: ${storedServices.length} services`)
          return {
            data: { services: storedServices },
            offline: true
          } as ApiResponse<{ services: unknown[] }>
        }
      } catch (error) {
        console.warn('[OfflineAPI] Failed to get services from dedicated store:', error)
      }
    }
    
    return response
  }

  async getUsers(): Promise<ApiResponse<{ users: unknown[] }>> {
    const response = await this.get<{ users: unknown[] }>('/api/admin/users', {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      fallbackData: { users: [] }
    })
    
    // Store users in dedicated store for offline access
    if (response.data && !response.offline) {
      const usersData = response.data as { users: unknown[] }
      if (usersData.users && usersData.users.length > 0) {
        await offlineStorage.storeUsers(usersData.users)
        console.log(`[OfflineAPI] Stored ${usersData.users.length} users in dedicated store`)
      }
    }
    
    return response
  }

  // Cache management
  private async cacheResponse(key: string, data: unknown, ttl: number): Promise<void> {
    try {
      await offlineStorage.cacheResponse(key, data, ttl)
    } catch (error) {
      console.warn('[OfflineAPI] Failed to cache response:', error)
    }
  }

  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      return await offlineStorage.getCachedData<T>(key)
    } catch (error) {
      console.warn('[OfflineAPI] Failed to get cached data:', error)
      return null
    }
  }

  // Sync management
  async getPendingSyncCount(): Promise<number> {
    try {
      return await offlineStorage.getPendingCount()
    } catch (error) {
      console.warn('[OfflineAPI] Failed to get pending sync count:', error)
      return 0
    }
  }

  async syncPendingActions(): Promise<void> {
    try {
      await offlineStorage.syncActions()
    } catch (error) {
      console.warn('[OfflineAPI] Failed to sync pending actions:', error)
    }
  }
}

export const offlineAPI = new OfflineAPI()
export type { ApiResponse, ApiRequestOptions }
