/**
 * Centralized offline detection and network request management
 * Replaces unreliable navigator.onLine with robust connection testing
 */

interface OfflineState {
  isOnline: boolean
  lastCheck: number
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline'
  retryCount: number
}

class OfflineDetector {
  private state: OfflineState = {
    isOnline: true,
    lastCheck: 0,
    connectionQuality: 'excellent',
    retryCount: 0
  }

  private listeners: Set<(state: OfflineState) => void> = new Set()
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_INTERVAL = 15000 // 15 seconds
  private readonly RETRY_DELAY = 2000 // 2 seconds
  private readonly MAX_RETRIES = 3

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Initial check
    this.checkConnection()
    
    // Listen to browser events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline())
      window.addEventListener('offline', () => this.handleOffline())
      
      // Start periodic checks
      this.startPeriodicChecks()
    }
  }

  private async checkConnection(): Promise<boolean> {
    const now = Date.now()
    
    // Don't check too frequently - increase to 10 seconds
    if (now - this.state.lastCheck < 10000) {
      return this.state.isOnline
    }

    this.state.lastCheck = now

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      // Server-side: assume online
      this.updateState({
        isOnline: true,
        connectionQuality: 'excellent',
        retryCount: 0
      })
      return true
    }

    // If navigator.onLine is false, don't even try
    if (!navigator.onLine) {
      this.updateState({
        isOnline: false,
        connectionQuality: 'offline',
        retryCount: this.state.retryCount + 1
      })
      return false
    }

    let timeout: NodeJS.Timeout | undefined
    
    try {
      // Use a lightweight endpoint for connection testing
      const controller = new AbortController()
      timeout = setTimeout(() => controller.abort(), 5000) // Increase timeout for dev
      
      // Use a simple endpoint that doesn't have rate limiting
      const baseUrl = window.location.origin
      const testUrl = `${baseUrl}/manifest.json`
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[OfflineDetector] Testing connection to:', testUrl)
      }
      
      const response = await fetch(testUrl, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      
      const isOnline = response.ok
      const connectionQuality = this.assessConnectionQuality(response)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[OfflineDetector] Connection test result:', { isOnline, status: response.status, quality: connectionQuality })
      }
      
      this.updateState({
        isOnline,
        connectionQuality,
        retryCount: isOnline ? 0 : this.state.retryCount + 1
      })
      
      return isOnline
    } catch (error) {
      if (timeout) {
        clearTimeout(timeout) // Ensure timeout is cleared
      }
      
      // Handle AbortError as expected offline behavior, not an error
      if (error instanceof Error && error.name === 'AbortError') {
        // Only log in development for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log('[OfflineDetector] Connection timeout (expected offline behavior)')
        }
        this.updateState({
          isOnline: false,
          connectionQuality: 'offline',
          retryCount: this.state.retryCount + 1
        })
        return false
      }
      
      // Only log other errors in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[OfflineDetector] Connection check failed:', error)
      }
      
      this.updateState({
        isOnline: false,
        connectionQuality: 'offline',
        retryCount: this.state.retryCount + 1
      })
      
      return false
    }
  }

  private assessConnectionQuality(response: Response): OfflineState['connectionQuality'] {
    // Simple quality assessment based on response time
    // In a real app, you might use more sophisticated metrics
    if (response.status === 200) {
      return 'excellent'
    } else if (response.status >= 400 && response.status < 500) {
      return 'poor'
    } else {
      return 'offline'
    }
  }

  private updateState(updates: Partial<OfflineState>) {
    const oldState = { ...this.state }
    this.state = { ...this.state, ...updates }
    
    // Notify listeners if state changed
    if (JSON.stringify(oldState) !== JSON.stringify(this.state)) {
      this.notifyListeners()
    }
  }

  private handleOnline() {
    console.log('[OfflineDetector] Browser online event detected')
    this.checkConnection()
  }

  private handleOffline() {
    console.log('[OfflineDetector] Browser offline event detected')
    this.updateState({
      isOnline: false,
      connectionQuality: 'offline'
    })
  }

  private startPeriodicChecks() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    
    this.checkInterval = setInterval(() => {
      this.checkConnection()
    }, this.CHECK_INTERVAL)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('[OfflineDetector] Listener error:', error)
      }
    })
  }

  // Public API
  public getState(): OfflineState {
    return { ...this.state }
  }

  public isOnline(): boolean {
    return this.state.isOnline
  }

  public getConnectionQuality(): OfflineState['connectionQuality'] {
    return this.state.connectionQuality
  }

  public canMakeRequest(): boolean {
    // In development, always allow requests if we haven't explicitly detected offline
    if (process.env.NODE_ENV === 'development' && this.state.retryCount === 0) {
      return true
    }
    
    if (!this.state.isOnline) {
      return false
    }
    
    // Don't make requests if we've exceeded retry limit
    if (this.state.retryCount >= this.MAX_RETRIES) {
      return false
    }
    
    return true
  }

  public markRequestAttempted(): void {
    this.state.lastCheck = Date.now()
  }

  public subscribe(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  public async forceCheck(): Promise<boolean> {
    return await this.checkConnection()
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    
    this.listeners.clear()
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnline())
      window.removeEventListener('offline', () => this.handleOffline())
    }
  }
}

// Export singleton instance
export const offlineDetector = new OfflineDetector()

// Export types
export type { OfflineState }
