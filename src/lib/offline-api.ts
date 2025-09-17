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
      ...fetchOptions
    } = options

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
    }

    try {
      // Mark that we're attempting a request
      offlineDetector.markRequestAttempted()

      const response = await offlineFetch.fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        timeout,
        ...fetchOptions
      })

      if (response.ok) {
        const responseData = await response.json() as T
        
        // Cache the response if caching is enabled
        if (cache) {
          await this.cacheResponse(cacheKey, responseData, cacheTTL)
        }

        return {
          data: responseData,
          fromCache: response.fromCache || false
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
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
    return this.get('/api/admin/bookings', {
      cache: true,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      fallbackData: { bookings: [] }
    })
  }

  async getServices(): Promise<ApiResponse<{ services: unknown[] }>> {
    return this.get('/api/admin/services', {
      cache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      fallbackData: { services: [] }
    })
  }

  async getUsers(): Promise<ApiResponse<{ users: unknown[] }>> {
    return this.get('/api/admin/users', {
      cache: true,
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      fallbackData: { users: [] }
    })
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
