'use client'

import { useEffect, useState, useMemo } from 'react'
import { Construction, X } from 'lucide-react'

interface UnderConstructionConfig {
  enabled: boolean
  message: string
  showOnMainPage: boolean
  showOnAdminPage: boolean
}

// Socket interface is already declared globally in layout.tsx

interface UnderConstructionBannerProps {
  isAdminPage?: boolean
}

// Socket interface is already declared globally in layout.tsx

export default function UnderConstructionBanner({ isAdminPage = false }: UnderConstructionBannerProps) {
  const [config, setConfig] = useState<UnderConstructionConfig | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Load config from localStorage
    const savedConfig = localStorage.getItem('underConstructionConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (error) {
        console.error('Failed to parse saved config:', error)
      }
    }

    // Listen for socket updates
    let socket: Window['socket'] | null = null
    if (typeof window !== 'undefined' && window.socket) {
      socket = window.socket
      const handleUpdate = (newConfig: UnderConstructionConfig) => {
        setConfig(newConfig)
        setDismissed(false) // Reset dismissed state when config changes
      }
      
      if (socket) {
        socket.on('under-construction-updated', handleUpdate as (data: unknown) => void)
        
        // Cleanup function
        return () => {
          if (socket) {
            socket.off('under-construction-updated', handleUpdate as (data: unknown) => void)
          }
        }
      }
    }
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
  }

  // Use useMemo to prevent unnecessary re-renders
  const shouldShow = useMemo(() => {
    if (!mounted) return false
    if (!config || !config.enabled) return false
    if (isAdminPage && !config.showOnAdminPage) return false
    if (!isAdminPage && !config.showOnMainPage) return false
    if (dismissed) return false
    return true
  }, [mounted, config?.enabled, config?.showOnAdminPage, config?.showOnMainPage, isAdminPage, dismissed])

  // Prevent unnecessary re-renders by checking if config actually changed
  const configKey = useMemo(() => {
    if (!config) return 'no-config'
    return `${config.enabled}-${config.showOnMainPage}-${config.showOnAdminPage}-${config.message}`
  }, [config])

  if (!shouldShow || !config) {
    return null
  }

  return (
    <div 
      key={configKey}
      className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white shadow-lg"
    >
      <div className="flex items-center justify-center px-4 py-3 relative">
        <div className="flex items-center space-x-3">
          <Construction className="w-5 h-5 text-white" />
          <span className="font-medium text-center">
            {config.message}
          </span>
        </div>
        
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 hover:bg-orange-600 rounded transition-colors"
          title="Скрий банер"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
