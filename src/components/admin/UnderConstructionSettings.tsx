'use client'

import { useState, useEffect, useCallback } from 'react'
import { Construction, Save } from 'lucide-react'

interface UnderConstructionConfig {
  enabled: boolean
  message: string
  showOnMainPage: boolean
  showOnAdminPage: boolean
}

// interface Socket {
//   emit: (event: string, data: UnderConstructionConfig) => void
// }

// Socket interface is already declared globally in other files

export default function UnderConstructionSettings() {
  const [config, setConfig] = useState<UnderConstructionConfig>({
    enabled: false,
    message: 'Сайтът е в процес на изграждане. Моля, извикайте за резервация.',
    showOnMainPage: true,
    showOnAdminPage: false
  })
  
  // Ensure config values are never undefined
  const safeConfig = {
    enabled: config.enabled ?? false,
    message: config.message ?? 'Сайтът е в процес на изграждане. Моля, извикайте за резервация.',
    showOnMainPage: config.showOnMainPage ?? true,
    showOnAdminPage: config.showOnAdminPage ?? false
  }
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [debouncedConfig, setDebouncedConfig] = useState<UnderConstructionConfig | null>(null)

  useEffect(() => {
    // Load config from localStorage
    const savedConfig = localStorage.getItem('underConstructionConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        
        // Fix field names if they're wrong
        if (parsed.showOnPublic !== undefined) {
          parsed.showOnMainPage = parsed.showOnPublic
          delete parsed.showOnPublic
        }
        
        setConfig(parsed)
      } catch (error) {
        console.error('Failed to parse saved config:', error)
      }
    }
  }, [])

  // Debounce config updates to prevent excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedConfig(config)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [config])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Validate config before saving
      if (!config.message || config.message.trim().length === 0) {
        console.error('🔧 Message cannot be empty')
        setIsSaving(false)
        return
      }
      
      // Ensure all required fields are present
      const configToSave = {
        enabled: config.enabled,
        message: config.message.trim(),
        showOnMainPage: config.showOnMainPage,
        showOnAdminPage: config.showOnAdminPage
      }
      
      // Save to localStorage
      localStorage.setItem('underConstructionConfig', JSON.stringify(configToSave))
      
      // Save to database via API
      const response = await fetch('/api/admin/settings/under-construction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'test', // Add admin token
        },
        body: JSON.stringify(configToSave),
      })

      if (response.ok) {
        // Emit socket event for real-time update
        if (typeof window !== 'undefined' && window.socket) {
          window.socket.emit('under-construction-updated', configToSave)
        }
      } else {
        console.error('🔧 API call failed:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to save config:', error)
    } finally {
      setIsSaving(false)
    }
  }, [config])

  const handleReset = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('underConstructionConfig')
    
    setConfig({
      enabled: false,
      message: 'Сайтът е в процес на изграждане. Моля, извикайте за резервация.',
      showOnMainPage: true,
      showOnAdminPage: false
    })
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Construction className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Under Construction Режим
          </h3>
        </div>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showPreview ? 'Скрий преглед' : 'Покажи преглед'}
        </button>
      </div>

      {/* Preview Banner */}
      {showPreview && debouncedConfig?.enabled && (
        <div className="mb-6 p-4 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Construction className="w-5 h-5 text-orange-600" />
            <span className="font-medium text-orange-800">Преглед на банер:</span>
          </div>
          <div className="bg-orange-500 text-white p-3 rounded text-center">
            {debouncedConfig.message}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Активирай Under Construction режим
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Показва банер на посетителите, че сайтът е в процес на изграждане
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
                          <input
                type="checkbox"
                checked={safeConfig.enabled}
                onChange={(e) => setConfig({ ...safeConfig, enabled: e.target.checked })}
                className="sr-only peer"
              />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Съобщение
          </label>
                      <textarea
              value={safeConfig.message}
              onChange={(e) => setConfig({ ...safeConfig, message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Въведете съобщение за посетителите..."
            />
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Къде да се показва:</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Главна страница</label>
              <p className="text-xs text-gray-500">Показва банер на посетителите</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={safeConfig.showOnMainPage}
                onChange={(e) => setConfig({ ...safeConfig, showOnMainPage: e.target.checked })}
                className="sr-only peer"
                disabled={!safeConfig.enabled}
              />
              <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                safeConfig.enabled ? 'bg-gray-200' : 'bg-gray-100'
              }`}></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm text-gray-700">Админ страница</label>
              <p className="text-xs text-gray-500">Показва банер на администраторите</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={safeConfig.showOnAdminPage}
                onChange={(e) => setConfig({ ...safeConfig, showOnAdminPage: e.target.checked })}
                className="sr-only peer"
                disabled={!safeConfig.enabled}
              />
              <div className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                safeConfig.enabled ? 'bg-gray-200' : 'bg-gray-100'
              }`}></div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Възстанови
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Запазване...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Запази</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
