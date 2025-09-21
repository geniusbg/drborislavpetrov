'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAInstallButtonProps {
  className?: string
  showBanner?: boolean
}

export default function PWAInstallButton({ className = '', showBanner = true }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [showBannerState, setShowBannerState] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as Navigator & { standalone?: boolean }).standalone ||
                              document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
      return isStandaloneMode
    }

    // Check if it's iOS
    const checkIOS = () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(iOS)
      return iOS
    }

    // Check if app was previously dismissed
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
      return dismissedTime > oneDayAgo
    }

    const standalone = checkStandalone()
    const iOS = checkIOS()
    const wasDismissed = checkDismissed()

    setIsInstalled(standalone)

    // Show iOS instructions if on iOS and not installed
    if (iOS && !standalone && !wasDismissed && showBanner) {
      setShowBannerState(true)
    }

    // Force user engagement to trigger beforeinstallprompt
    if (!standalone && !iOS) {
      // Simulate user interactions
      const simulateEngagement = () => {
        document.body.click()
        document.dispatchEvent(new Event('click'))
        window.dispatchEvent(new Event('focus'))
        window.dispatchEvent(new Event('user-interaction'))
      }
      
      // Reduced engagement simulation to prevent performance issues
      setTimeout(simulateEngagement, 1000)
      setTimeout(simulateEngagement, 5000)
    }

    // Handle beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      if (!standalone && !wasDismissed) {
        setShowInstallButton(true)
        if (showBanner) {
          setShowBannerState(true)
        }
      }
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallButton(false)
      setShowBannerState(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [showBanner])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'dismissed') {
        // Remember dismissal for 24 hours
        localStorage.setItem('pwa-install-dismissed', Date.now().toString())
      }
      
      // Clean up
      setDeferredPrompt(null)
      setShowInstallButton(false)
      setShowBannerState(false)
    } catch (error) {
      console.error('[PWA] Error during installation:', error)
    }
  }

  const handleBannerDismiss = () => {
    setShowBannerState(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  // Don't show anything if app is already installed
  if (isInstalled || isStandalone) {
    return null
  }

  return (
    <>
      {/* Install Button */}
      {showInstallButton && !isIOS && (
        <button
          onClick={handleInstallClick}
          className={`inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 ${className}`}
          aria-label="Инсталирай приложението"
        >
          <Download className="w-4 h-4" />
          <span>Инсталирай</span>
        </button>
      )}

      {/* Install Banner */}
      {showBannerState && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                Инсталирай приложението
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {isIOS 
                  ? 'Добави към началния екран за по-добро преживяване'
                  : 'Инсталирай приложението за бърз достъп и offline функционалност'
                }
              </p>
              
              {isIOS ? (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>1. Натисни бутона &quot;Споделяне&quot; ⬆️</p>
                  <p>2. Избери &quot;Добави към началния екран&quot;</p>
                  <p>3. Натисни &quot;Добави&quot;</p>
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                  disabled={!deferredPrompt}
                >
                  Инсталирай сега
                </button>
              )}
            </div>
            
            <button
              onClick={handleBannerDismiss}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Затвори"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// Hook for using PWA install functionality
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const checkInstallability = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as Navigator & { standalone?: boolean }).standalone ||
                              document.referrer.includes('android-app://')
      
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      
      setIsInstalled(isStandaloneMode)
      setIsIOS(iOS)
      setCanInstall(!isStandaloneMode)
    }

    checkInstallability()

    const handleBeforeInstallPrompt = () => {
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  return { canInstall, isInstalled, isIOS }
}
