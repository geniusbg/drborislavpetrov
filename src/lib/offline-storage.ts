// Offline Storage - запазва промените до връщане на интернет връзката

interface OfflineAction {
  id: string
  type: 'CREATE_BOOKING' | 'UPDATE_BOOKING' | 'DELETE_BOOKING' | 'CREATE_USER' | 'UPDATE_USER' | 'DELETE_USER'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
  maxRetries: number
}

class OfflineStorage {
  private storageKey = 'offline-actions'
  private maxRetries = 3
  private retryDelay = 5000 // 5 секунди

  // Запазва действие за offline изпълнение
  saveAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const fullAction: OfflineAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries
    }

    const actions = this.getActions()
    actions.push(fullAction)
    this.setActions(actions)

    console.log('💾 Offline action saved:', fullAction)
    return id
  }

  // Взема всички запазени действия
  getActions(): OfflineAction[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get offline actions:', error)
      return []
    }
  }

  // Запазва действията в localStorage
  private setActions(actions: OfflineAction[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(actions))
    } catch (error) {
      console.error('Failed to save offline actions:', error)
    }
  }

  // Изтрива действие след успешно изпълнение
  removeAction(id: string): void {
    const actions = this.getActions()
    const filtered = actions.filter(action => action.id !== id)
    this.setActions(filtered)
    console.log('✅ Offline action removed:', id)
  }

  // Изпълнява всички запазени действия когато се върне връзката
  async syncActions(): Promise<void> {
    const actions = this.getActions()
    if (actions.length === 0) return

    console.log('🔄 Syncing offline actions:', actions.length)

    for (const action of actions) {
      try {
        await this.executeAction(action)
        this.removeAction(action.id)
      } catch (error) {
        console.error('Failed to sync action:', action.id, error)
        
        // Увеличаваме retry count
        action.retryCount++
        if (action.retryCount >= action.maxRetries) {
          console.error('Max retries reached for action:', action.id)
          this.removeAction(action.id)
        } else {
          // Запазваме обновения action
          const actions = this.getActions()
          const index = actions.findIndex(a => a.id === action.id)
          if (index !== -1) {
            actions[index] = action
            this.setActions(actions)
          }
        }
      }
    }
  }

  // Изпълнява конкретно действие
  private async executeAction(action: OfflineAction): Promise<void> {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      throw new Error('No admin token')
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-admin-token': adminToken
    }

    switch (action.type) {
      case 'CREATE_BOOKING':
        const createResponse = await fetch('/api/admin/bookings', {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data)
        })
        if (!createResponse.ok) {
          throw new Error(`Failed to create booking: ${createResponse.status}`)
        }
        break

      case 'UPDATE_BOOKING':
        const updateResponse = await fetch(`/api/admin/bookings/${action.data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(action.data)
        })
        if (!updateResponse.ok) {
          throw new Error(`Failed to update booking: ${updateResponse.status}`)
        }
        break

      case 'DELETE_BOOKING':
        const deleteResponse = await fetch(`/api/admin/bookings/${action.data.id}`, {
          method: 'DELETE',
          headers
        })
        if (!deleteResponse.ok) {
          throw new Error(`Failed to delete booking: ${deleteResponse.status}`)
        }
        break

      case 'CREATE_USER':
        const createUserResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(action.data)
        })
        if (!createUserResponse.ok) {
          throw new Error(`Failed to create user: ${createUserResponse.status}`)
        }
        break

      case 'UPDATE_USER':
        const updateUserResponse = await fetch(`/api/admin/users/${action.data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(action.data)
        })
        if (!updateUserResponse.ok) {
          throw new Error(`Failed to update user: ${updateUserResponse.status}`)
        }
        break

      case 'DELETE_USER':
        const deleteUserResponse = await fetch(`/api/admin/users/${action.data.id}`, {
          method: 'DELETE',
          headers
        })
        if (!deleteUserResponse.ok) {
          throw new Error(`Failed to delete user: ${deleteUserResponse.status}`)
        }
        break

      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  // Проверява дали има запазени действия
  hasPendingActions(): boolean {
    return this.getActions().length > 0
  }

  // Изчиства всички запазени действия
  clearActions(): void {
    localStorage.removeItem(this.storageKey)
    console.log('🗑️ All offline actions cleared')
  }

  // Връща броя на запазените действия
  getPendingCount(): number {
    return this.getActions().length
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage()

// Автоматично синхронизиране при връщане на връзката
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🌐 Connection restored, syncing offline actions...')
    offlineStorage.syncActions()
  })

  // Синхронизиране при зареждане на страницата
  window.addEventListener('load', () => {
    if (navigator.onLine) {
      offlineStorage.syncActions()
    }
  })
}
