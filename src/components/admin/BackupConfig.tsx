'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Clock, 
  HardDrive, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface BackupConfig {
  retentionDays: number
  backupInterval: number // в часове
  backupFormat: 'json' | 'sql'
  backupLocation: string
  autoBackup: boolean
  compression: boolean
}

interface BackupConfigProps {
  onConfigChange: (config: BackupConfig) => void
  onClose: () => void
}

export default function BackupConfig({ onConfigChange, onClose }: BackupConfigProps) {
  // Drag state
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })

  const [config, setConfig] = useState<BackupConfig>({
    retentionDays: 5,
    backupInterval: 1,
    backupFormat: 'json',
    backupLocation: './backups/',
    autoBackup: true,
    compression: false
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const loadConfig = async () => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/backups/config', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/backups/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Конфигурацията е запазена успешно!' })
        onConfigChange(config)
        setTimeout(() => onClose(), 2000)
      } else {
        setMessage({ type: 'error', text: 'Грешка при запазване на конфигурацията' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Грешка при запазване на конфигурацията' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof BackupConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    loadConfig()
  }, [])

  // Handle Escape key for closing modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Drag functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto cursor-move" 
        style={{ 
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Backup Конфигурация</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {message.text}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Зареждане на конфигурацията...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Retention Policy */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Retention Policy
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Запазване на backups (дни)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={config.retentionDays}
                      onChange={(e) => handleInputChange('retentionDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Стари backup файлове ще бъдат автоматично изтрити след този период
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Schedule */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  Backup График
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.autoBackup}
                        onChange={(e) => handleInputChange('autoBackup', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Автоматичен backup
                      </span>
                    </label>
                  </div>
                  
                  {config.autoBackup && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Интервал на backup (часове)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={config.backupInterval}
                        onChange={(e) => handleInputChange('backupInterval', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Backup ще се изпълнява на всеки {config.backupInterval} час(а)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Backup Format */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-green-600" />
                  Backup Формат
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Формат на backup файловете
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="backupFormat"
                          value="json"
                          checked={config.backupFormat === 'json'}
                          onChange={(e) => handleInputChange('backupFormat', e.target.value)}
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">JSON (рекомендуван)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="backupFormat"
                          value="sql"
                          checked={config.backupFormat === 'sql'}
                          onChange={(e) => handleInputChange('backupFormat', e.target.value)}
                          className="border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">SQL</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={config.compression}
                        onChange={(e) => handleInputChange('compression', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Компресия на backup файлове
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Намалява размера на backup файловете
                    </p>
                  </div>
                </div>
              </div>

              {/* Backup Location */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Backup Локация
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Директория за backup файлове
                  </label>
                  <input
                    type="text"
                    value={config.backupLocation}
                    onChange={(e) => handleInputChange('backupLocation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="./backups/"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Път към директорията където ще се запазват backup файловете
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Отмени
          </button>
          <button
            onClick={saveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Запазване...' : 'Запази'}
          </button>
        </div>
      </div>
    </div>
  )
} 