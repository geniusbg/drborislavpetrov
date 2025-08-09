'use client'

import { useEffect, useState } from 'react'

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Show loading screen only after component mounts (avoid SSR)
    setIsVisible(true)
    
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval)
          return 95
        }
        return prev + Math.random() * 10 + 5 // Random increment 5-15
      })
    }, 100)

    // Complete loading after 1.5 seconds
    const completeTimer = setTimeout(() => {
      setProgress(100)
      
      // Hide after showing 100%
      setTimeout(() => {
        setIsVisible(false)
      }, 300)
    }, 1500)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(completeTimer)
    }
  }, [])

  // Don't render during SSR to avoid hydration issues
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center transition-opacity duration-300">
      <div className="text-center">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Д-р Борислав Петров
          </h1>
          <p className="text-gray-600">Стоматология</p>
        </div>

        {/* Animated Spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 mx-auto mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Progress Text */}
        <p className="text-sm text-gray-500">
          Зареждане... {Math.round(Math.min(progress, 100))}%
        </p>

        {/* Loading Dots */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  )
}