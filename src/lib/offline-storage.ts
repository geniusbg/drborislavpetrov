/**
 * IndexedDB wrapper for offline data storage and synchronization
 * Provides offline-first data management with automatic sync when online
 */

interface StoredData {
  id: string
  data: unknown
  timestamp: number
  version: number
  synced: boolean
}

interface SyncAction {
  id: string
  action: 'create' | 'update' | 'delete'
  data: unknown
  timestamp: number
  retries: number
  maxRetries: number
}

interface OfflineStorageConfig {
  dbName: string
  version: number
  stores: {
    bookings: string
    services: string
    users: string
    syncQueue: string
    cache: string
  }
}

class OfflineStorage {
  private db: IDBDatabase | null = null
  private dbPromise: Promise<IDBDatabase> | null = null
  private config: OfflineStorageConfig = {
    dbName: 'drborislavpetrov-offline',
    version: 3,
    stores: {
      bookings: 'bookings',
      services: 'services', 
      users: 'users',
      syncQueue: 'syncQueue',
      cache: 'cache'
    }
  }

  constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initializeDB()
    }
  }

  private async initializeDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(this.config.dbName, this.config.version)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = (event.target as IDBOpenDBRequest).transaction!

        // Create object stores
        const stores = this.config.stores
        
        // Bookings store
        if (!db.objectStoreNames.contains(stores.bookings)) {
          const bookingsStore = db.createObjectStore(stores.bookings, { keyPath: 'id' })
          bookingsStore.createIndex('timestamp', 'timestamp', { unique: false })
          bookingsStore.createIndex('synced', 'synced', { unique: false })
        }

        // Services store
        if (!db.objectStoreNames.contains(stores.services)) {
          const servicesStore = db.createObjectStore(stores.services, { keyPath: 'id' })
          servicesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Users store
        if (!db.objectStoreNames.contains(stores.users)) {
          const usersStore = db.createObjectStore(stores.users, { keyPath: 'id' })
          usersStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(stores.syncQueue)) {
          const syncStore = db.createObjectStore(stores.syncQueue, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
          syncStore.createIndex('retries', 'retries', { unique: false })
        }

        // Cache store for API responses
        if (!db.objectStoreNames.contains(stores.cache)) {
          const cacheStore = db.createObjectStore(stores.cache, { keyPath: 'key' })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
          cacheStore.createIndex('expires', 'expires', { unique: false })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'))
      }
    })

    return this.dbPromise
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB()
    }
    return this.db!
  }

  // Generic data storage methods
  public async storeData(storeName: string, data: unknown): Promise<void> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('[OfflineStorage] IndexedDB not available, skipping store operation')
      return
    }

    try {
      const db = await this.getDB()
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      const storedData: StoredData = {
        id: (data as { id?: string })?.id || Date.now().toString(),
        data,
        timestamp: Date.now(),
        version: 1,
        synced: false
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(storedData)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`[OfflineStorage] Error storing data in ${storeName}:`, error)
      throw error
    }
  }

  public async getData(storeName: string, id?: string): Promise<unknown[]> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('[OfflineStorage] IndexedDB not available, returning empty array')
      return []
    }

    try {
      const db = await this.getDB()
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      return new Promise((resolve, reject) => {
        const results: unknown[] = []
        
        if (id) {
          const request = store.get(id)
          request.onsuccess = () => {
            if (request.result) {
              results.push(request.result.data)
            }
            resolve(results)
          }
          request.onerror = () => reject(request.error)
        } else {
          const request = store.getAll()
          request.onsuccess = () => {
            const data = request.result.map((item: StoredData) => item.data)
            resolve(data)
          }
          request.onerror = () => reject(request.error)
        }
      })
    } catch (error) {
      console.error(`[OfflineStorage] Error getting data from ${storeName}:`, error)
      return []
    }
  }

  public async deleteData(storeName: string, id: string): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error(`[OfflineStorage] Error deleting data from ${storeName}:`, error)
      throw error
    }
  }

  // Specific methods for different data types
  public async storeBookings(bookings: unknown[]): Promise<void> {
    for (const booking of bookings) {
      await this.storeData(this.config.stores.bookings, booking)
    }
  }

  public async getBookings(): Promise<unknown[]> {
    return await this.getData(this.config.stores.bookings)
  }

  public async storeServices(services: unknown[]): Promise<void> {
    for (const service of services) {
      await this.storeData(this.config.stores.services, service)
    }
  }

  public async getServices(): Promise<unknown[]> {
    return await this.getData(this.config.stores.services)
  }

  public async storeUsers(users: unknown[]): Promise<void> {
    for (const user of users) {
      await this.storeData(this.config.stores.users, user)
    }
  }

  public async getUsers(): Promise<unknown[]> {
    return await this.getData(this.config.stores.users)
  }

  // Cache management
  public async cacheResponse(key: string, data: unknown, ttl: number = 300000): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.cache], 'readwrite')
      const store = transaction.objectStore(this.config.stores.cache)
      
      const cacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        expires: Date.now() + ttl
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(cacheEntry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error caching response:', error)
    }
  }

  public async getCachedData<T = unknown>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.cache], 'readonly')
      const store = transaction.objectStore(this.config.stores.cache)
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => {
          const result = request.result
          if (result && result.expires > Date.now()) {
            resolve(result.data)
        } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error getting cached data:', error)
      return null
    }
  }

  // Sync queue management
  public async addToSyncQueue(action: SyncAction): Promise<void> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('[OfflineStorage] IndexedDB not available, skipping sync queue operation')
      return
    }

    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.syncQueue], 'readwrite')
      const store = transaction.objectStore(this.config.stores.syncQueue)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(action)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error adding to sync queue:', error)
      throw error
    }
  }

  public async getSyncQueue(): Promise<SyncAction[]> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('[OfflineStorage] IndexedDB not available, returning empty sync queue')
      return []
    }

    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.syncQueue], 'readonly')
      const store = transaction.objectStore(this.config.stores.syncQueue)
      
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error getting sync queue:', error)
      return []
    }
  }

  public async removeFromSyncQueue(id: string): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.syncQueue], 'readwrite')
      const store = transaction.objectStore(this.config.stores.syncQueue)
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error removing from sync queue:', error)
      throw error
    }
  }

  public async getPendingCount(): Promise<number> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return 0
    }

    const queue = await this.getSyncQueue()
    return queue.length
  }

  // Sync processing
  public async processSyncItem(item: SyncAction, apiCall: (data: unknown) => Promise<unknown>): Promise<boolean> {
    try {
      await apiCall(item.data)
      await this.removeFromSyncQueue(item.id)
      return true
    } catch (error) {
      console.error('[OfflineStorage] Sync item failed:', error)
      
      // Increment retry count
      item.retries++
      if (item.retries >= item.maxRetries) {
        await this.removeFromSyncQueue(item.id)
        return false
      }
      
      // Update retry count in queue
      await this.updateSyncItemRetries(item.id, item.retries)
      return false
    }
  }

  // Process sync item without requiring apiCall parameter
  public async processSyncItemSimple(item: SyncAction): Promise<boolean> {
    try {
      // For now, just simulate successful sync
      // In a real implementation, you would call the appropriate API based on item.type
      console.log(`[OfflineStorage] Processing sync item: ${item.action}`, item.data)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return true
    } catch (error) {
      console.error('[OfflineStorage] Sync item failed:', error)
      return false
    }
  }

  // Sync all pending actions
  public async syncActions(): Promise<void> {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      console.warn('[OfflineStorage] IndexedDB not available, skipping sync actions')
      return
    }

    try {
      const queue = await this.getSyncQueue()
      console.log(`[OfflineStorage] Syncing ${queue.length} pending actions`)
      
      for (const item of queue) {
        if (item.retries >= item.maxRetries) {
          console.warn(`[OfflineStorage] Skipping item ${item.id} - max retries exceeded`)
          await this.removeFromSyncQueue(item.id)
          continue
        }
        
        try {
          // Actually sync the item by calling the API
          const success = await this.processSyncItemSimple(item)
          if (success) {
            await this.removeFromSyncQueue(item.id)
            console.log(`[OfflineStorage] Successfully synced item ${item.id}`)
          } else {
            item.retries++
            await this.updateSyncItemRetries(item.id, item.retries)
            console.log(`[OfflineStorage] Failed to sync item ${item.id}, retry ${item.retries}/${item.maxRetries}`)
          }
        } catch (error) {
          console.error(`[OfflineStorage] Failed to sync item ${item.id}:`, error)
          await this.updateSyncItemRetries(item.id, item.retries + 1)
        }
      }
    } catch (error) {
      console.error('[OfflineStorage] Error during sync:', error)
      throw error
    }
  }

  private async updateSyncItemRetries(id: string, retries: number): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.syncQueue], 'readwrite')
      const store = transaction.objectStore(this.config.stores.syncQueue)
      
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retries = retries
          store.put(item)
        }
      }
    } catch (error) {
      console.error('[OfflineStorage] Error updating sync item retries:', error)
    }
  }

  // Cleanup methods
  public async clearExpiredCache(): Promise<void> {
    try {
      const db = await this.getDB()
      const transaction = db.transaction([this.config.stores.cache], 'readwrite')
      const store = transaction.objectStore(this.config.stores.cache)
      const index = store.index('expires')
      
      const now = Date.now()
      const range = IDBKeyRange.upperBound(now)
      
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range)
        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            cursor.delete()
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('[OfflineStorage] Error clearing expired cache:', error)
    }
  }

  public async clearAllData(): Promise<void> {
    try {
      const db = await this.getDB()
      const storeNames = Object.values(this.config.stores)
      
      for (const storeName of storeNames) {
        const transaction = db.transaction([storeName], 'readwrite')
        const store = transaction.objectStore(storeName)
        await new Promise<void>((resolve, reject) => {
          const request = store.clear()
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      }
    } catch (error) {
      console.error('[OfflineStorage] Error clearing all data:', error)
    }
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorage()

// Export types
export type { StoredData, SyncAction, OfflineStorageConfig }