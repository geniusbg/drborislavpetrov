/**
 * Offline-aware fetch wrapper with caching and fallback mechanisms
 * Provides seamless online/offline transitions for API requests
 */

import { offlineDetector } from './offline-detector'
import { offlineStorage } from './offline-storage'

interface OfflineFetchOptions extends Omit<RequestInit, 'cache'> {
  timeout?: number
  cache?: boolean
  cacheTTL?: number
  fallbackData?: unknown
  retryAttempts?: number
  retryDelay?: number
  forceRefresh?: boolean
}

interface OfflineFetchResponse extends Response {
  ok: boolean
  status: number
  statusText: string
  json: () => Promise<unknown>
  text: () => Promise<string>
  offline?: boolean
  fromCache?: boolean
  cached?: boolean
}

class OfflineFetchManager {
  private requestQueue: Map<string, Promise<OfflineFetchResponse>> = new Map()
  private defaultTimeout = 10000 // 10 seconds
  private defaultCacheTTL = 300000 // 5 minutes
  private defaultRetryAttempts = 3
  private defaultRetryDelay = 1000 // 1 second

  public async fetch(
    input: RequestInfo | URL,
    options: OfflineFetchOptions = {}
  ): Promise<OfflineFetchResponse> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const {
      timeout = this.defaultTimeout,
      cache = true,
      cacheTTL = this.defaultCacheTTL,
      fallbackData,
      retryAttempts = this.defaultRetryAttempts,
      retryDelay = this.defaultRetryDelay,
      forceRefresh = false,
      ...fetchOptions
    } = options

    // Check if request is already in progress
    const requestKey = this.getRequestKey(input, options)
    if (this.requestQueue.has(requestKey)) {
      return this.requestQueue.get(requestKey)!
    }

    // Create request promise
    const requestPromise = this.executeRequest(
      input,
      {
        timeout,
        cache,
        cacheTTL,
        fallbackData,
        retryAttempts,
        retryDelay,
        forceRefresh,
        ...fetchOptions
      }
    )

    // Store in queue
    this.requestQueue.set(requestKey, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      // Remove from queue when complete
      this.requestQueue.delete(requestKey)
    }
  }

  private async executeRequest(
    input: RequestInfo | URL,
    options: OfflineFetchOptions
  ): Promise<OfflineFetchResponse> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const { timeout, cache, cacheTTL, fallbackData, retryAttempts, retryDelay, forceRefresh, ...fetchOptions } = options

    // Check cache first if enabled and not forcing refresh
    if (cache && !forceRefresh) {
      const cachedData = await offlineStorage.getCachedData(url)
      if (cachedData) {
        console.log(`[OfflineFetch] Serving from cache: ${url}`)
        return this.createResponse(cachedData, { fromCache: true })
      }
    } else if (forceRefresh) {
      console.log(`[OfflineFetch] Force refresh requested for ${url}, bypassing cache`)
    }

    // Check if we can make network requests
    if (!offlineDetector.canMakeRequest()) {
      console.log(`[OfflineFetch] Offline detected for ${url}, using fallback`)
      
      if (fallbackData) {
        return this.createResponse(fallbackData, { offline: true })
      }
      
      // Try to get cached data as fallback
      const cachedData = await offlineStorage.getCachedData(url)
      if (cachedData) {
        return this.createResponse(cachedData, { offline: true, fromCache: true })
      }
      
      // Return offline error response
      return this.createOfflineResponse(url)
    }

    // Attempt network request with retries
    for (let attempt = 0; attempt <= (retryAttempts || 0); attempt++) {
      try {
        const response = await this.makeNetworkRequest(input, timeout || 10000, fetchOptions)
        
        // Mark successful request
        offlineDetector.markRequestAttempted()
        
        // Cache successful responses
        if (cache && response.ok) {
          const responseData = await response.clone().json().catch(() => response.clone().text())
          await offlineStorage.cacheResponse(url, responseData, cacheTTL)
        }
        
        return response as OfflineFetchResponse
        
      } catch (error) {
        console.warn(`[OfflineFetch] Request attempt ${attempt + 1} failed for ${url}:`, error)
        
        // If this is the last attempt, try fallback
        if (attempt === retryAttempts) {
          if (fallbackData) {
            return this.createResponse(fallbackData, { offline: true })
          }
          
          // Try cached data as last resort
          const cachedData = await offlineStorage.getCachedData(url)
          if (cachedData) {
            return this.createResponse(cachedData, { offline: true, fromCache: true })
          }
          
          return this.createOfflineResponse(url)
        }
        
        // Wait before retry
        if (attempt < (retryAttempts || 0)) {
          await this.delay((retryDelay || 1000) * Math.pow(2, attempt)) // Exponential backoff
        }
      }
    }

    // This should never be reached, but just in case
    return this.createOfflineResponse(url)
  }

  private async makeNetworkRequest(
    input: RequestInfo | URL,
    timeout: number,
    fetchOptions: RequestInit
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(input, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private createResponse(data: unknown, metadata: { offline?: boolean; fromCache?: boolean } = {}): OfflineFetchResponse {
    const response = new Response(JSON.stringify(data), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Create a new response object instead of modifying the existing one
    return new Response(JSON.stringify(data), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json'
      }
    }) as OfflineFetchResponse
  }

  private createOfflineResponse(url: string): OfflineFetchResponse {
    const errorData = {
      error: 'Offline',
      message: 'No internet connection. Please check your connection and try again.',
      url,
      timestamp: new Date().toISOString()
    }

    const response = new Response(JSON.stringify(errorData), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Create a new response object instead of modifying the existing one
    return new Response(JSON.stringify(errorData), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    }) as OfflineFetchResponse
  }

  private getRequestKey(input: RequestInfo | URL, options: OfflineFetchOptions): string {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Utility methods
  public async clearCache(): Promise<void> {
    await offlineStorage.clearExpiredCache()
  }

  public async getCacheSize(): Promise<number> {
    // This would require additional implementation in offlineStorage
    return 0
  }

  public isRequestInProgress(url: string): boolean {
    return Array.from(this.requestQueue.keys()).some(key => key.includes(url))
  }
}

// Export singleton instance
export const offlineFetch = new OfflineFetchManager()

// Export convenience function
export async function offlineFetchRequest(
  input: RequestInfo | URL,
  options: OfflineFetchOptions = {}
): Promise<OfflineFetchResponse> {
  return offlineFetch.fetch(input, options)
}

// Export types
export type { OfflineFetchOptions, OfflineFetchResponse }
