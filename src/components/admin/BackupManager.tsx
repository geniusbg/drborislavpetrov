'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  Play,
  Settings
} from 'lucide-react'
import BackupConfig from './BackupConfig'
import { getBulgariaTime } from '@/lib/bulgaria-time'

interface BackupFile {
  name: string
  size: string
  date: string
  age: string
}

interface BackupStats {
  totalBackups: number
  totalSize: string
  oldestBackup: string
  newestBackup: string
  retentionDays: number
}

interface BackupConfig {
  retentionDays: number
  backupInterval: number
  backupFormat: 'json' | 'sql'
  backupLocation: string
  autoBackup: boolean
  compression: boolean
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupFile[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningBackup, setIsRunningBackup] = useState(false)
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<BackupConfig>({
    retentionDays: 5,
    backupInterval: 1,
    backupFormat: 'json',
    backupLocation: './backups/',
    autoBackup: true,
    compression: false
  })

  const loadBackups = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/backups', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to load backups')
      
      const data = await response.json()
      console.log('🔍 Backup API Response:', data) // Debug logging
      
      const files = (data.backups as BackupFile[] | undefined) || []
      console.log('📁 Files found:', files.length) // Debug logging
      
      setBackups(files.map(({ name, size, date, age }) => ({ name, size, date, age })))
      
      // Update stats with fresh data from API
      if (data.stats) {
        console.log('📊 Stats from API:', data.stats) // Debug logging
        setStats({
          ...data.stats,
          retentionDays: config.retentionDays
        })
        console.log('✅ Stats updated with retentionDays:', config.retentionDays) // Debug logging
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [config.retentionDays])

  const runManualBackup = async () => {
    setIsRunningBackup(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Backup failed')
      
      await response.json()
      setLastBackup(getBulgariaTime().toLocaleString('bg-BG'))
      
      // Reload backups after successful backup
      await loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed')
    } finally {
      setIsRunningBackup(false)
    }
  }

  const deleteBackup = async (fileName: string) => {
    if (!confirm(`Сигурни ли сте, че искате да изтриете ${fileName}?`)) return
    
    try {
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(fileName)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Failed to delete backup')
      
      await loadBackups()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const restoreBackup = async (fileName: string) => {
    if (!confirm(`ВНИМАНИЕ: Това ще презапише текущата база данни с ${fileName}. Продължавате ли?`)) return
    
    try {
      const response = await fetch(`/api/admin/backups/${encodeURIComponent(fileName)}/restore`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) throw new Error('Restore failed')
      
      alert('Възстановяването завърши успешно!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed')
    }
  }

  const handleConfigChange = (newConfig: BackupConfig) => {
    console.log('🔄 Config changed:', newConfig)
    setConfig(newConfig)
    
    // Update stats with new retention policy immediately
    if (stats) {
      console.log('📊 Updating stats with new retention days:', newConfig.retentionDays)
      setStats(prev => {
        const newStats = prev ? {
          ...prev,
          retentionDays: newConfig.retentionDays
        } : null
        console.log('📊 New stats:', newStats)
        return newStats
      })
    }
    
    // Don't reload backups immediately - let user do it manually if needed
    // loadBackups() // Removed to prevent flickering
  }

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/backups/config', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        
        // Update stats with loaded config immediately
        setStats(prev => prev ? {
          ...prev,
          retentionDays: data.config.retentionDays
        } : null)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      await loadConfig() // Load config first
      await loadBackups() // Then load backups (which will use the correct config)
    }
    
    initializeData()
  }, [loadBackups])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <HardDrive className="w-6 h-6 text-blue-600" />
          Backup Управление
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
                     <button
             onClick={loadBackups}
             disabled={isLoading}
             className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all duration-200 ease-in-out text-sm sm:text-base"
           >
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             Обнови
           </button>
                     <button
             onClick={runManualBackup}
             disabled={isRunningBackup}
             className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 ease-in-out text-sm sm:text-base"
           >
             <Play className="w-4 h-4" />
             {isRunningBackup ? 'Създаване...' : 'Ръчен Backup'}
           </button>
                     <button
             onClick={() => setShowConfig(true)}
             className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 ease-in-out text-sm sm:text-base"
           >
             <Settings className="w-4 h-4" />
             Конфигурация
           </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </div>
      )}

      {lastBackup && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            Последен backup: {lastBackup}
          </div>
        </div>
      )}

             {/* Backup Statistics */}
       {stats && (
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 transition-all duration-300 ease-in-out">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Общо Backups</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalBackups}</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Общ размер</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.totalSize}</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Retention Policy</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.retentionDays} дни</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Последен</span>
            </div>
            <div className="text-sm font-medium text-purple-600">{stats.newestBackup}</div>
          </div>
        </div>
      )}

      {/* Backup Files List */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup Файлове</h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Зареждане...</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive className="w-12 h-12 text-gray-400 mx-auto" />
            <p className="text-gray-500 mt-2">Няма налични backup файлове</p>
          </div>
                 ) : (
           <div className="space-y-3">
             {backups.map((backup, index) => (
               <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-800">{backup.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Размер: {backup.size} | Дата: {backup.date} | Възраст: {backup.age}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                         <button
                       onClick={() => restoreBackup(backup.name)}
                       className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs sm:text-sm transition-all duration-200 ease-in-out"
                     >
                       <Upload className="w-3 h-3" />
                       Възстанови
                     </button>
                     <button
                       onClick={() => deleteBackup(backup.name)}
                       className="flex items-center justify-center gap-1 px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs sm:text-sm transition-all duration-200 ease-in-out"
                     >
                       <Trash2 className="w-3 h-3" />
                       Изтрий
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Configuration */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Конфигурация</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Retention Policy:</span>
            <span className="ml-2 text-gray-600">{config.retentionDays} дни</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Backup Интервал:</span>
            <span className="ml-2 text-gray-600">{config.backupInterval} час(а)</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Формат:</span>
            <span className="ml-2 text-gray-600">{config.backupFormat.toUpperCase()}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Локация:</span>
            <span className="ml-2 text-gray-600">{config.backupLocation}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Автоматичен Backup:</span>
            <span className="ml-2 text-gray-600">{config.autoBackup ? 'Включен' : 'Изключен'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Компресия:</span>
            <span className="ml-2 text-gray-600">{config.compression ? 'Включена' : 'Изключена'}</span>
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <BackupConfig
          onConfigChange={handleConfigChange}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
} 