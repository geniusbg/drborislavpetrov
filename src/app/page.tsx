'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import Hero from '@/components/home/Hero'
import Services from '@/components/home/Services'
import About from '@/components/home/About'
import Booking from '@/components/home/Booking'
import Contact from '@/components/home/Contact'
import Footer from '@/components/layout/Footer'
import { SectionTransition } from '@/components/layout/SectionTransition'

export default function HomePage() {
  // Loading overlay state
  const [hideOverlay, setHideOverlay] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [overlayProgress, setOverlayProgress] = useState(0)
  const initLoadStartedRef = useRef(false)
  const overlayFinalizedRef = useRef(false)

  // Simulate loading progress
  useEffect(() => {
    if (initLoadStartedRef.current) return
    initLoadStartedRef.current = true

    const simulateLoading = async () => {
      // Simulate different loading phases
      const phases = [
        { progress: 20, delay: 200 },
        { progress: 40, delay: 300 },
        { progress: 60, delay: 400 },
        { progress: 80, delay: 300 },
        { progress: 100, delay: 200 }
      ]

      for (const phase of phases) {
        await new Promise(resolve => setTimeout(resolve, phase.delay))
        setOverlayProgress(prev => Math.max(prev, phase.progress))
      }

      // Finalize with animation
      const closeDelayMs = 800
      const animDurationMs = 1200
      if (!overlayFinalizedRef.current) {
        overlayFinalizedRef.current = true
        setTimeout(() => setIsClosing(true), closeDelayMs)
        setTimeout(() => setHideOverlay(true), closeDelayMs + animDurationMs + 100)
      }
    }

    simulateLoading()
  }, [])

  return (
    <main className="min-h-screen">
      {/* Loading overlay */}
      {!hideOverlay && (
        <div
          aria-hidden
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-[1200ms]"
          style={{ opacity: isClosing ? 0 : 1 }}
        >
          <div
            className="text-center transform-gpu transition-transform duration-[1200ms]"
            style={{
              transform: isClosing ? 'perspective(800px) translateZ(-200px) rotateY(20deg) scale(0.9)' : 'none',
            }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Д-р Борислав Петров</h1>
              <p className="text-gray-600">Стоматология</p>
            </div>
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="w-64 mx-auto mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(overlayProgress, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">Зареждане… {overlayProgress}%</p>
          </div>
        </div>
      )}

      <Header />
      <SectionTransition>
        <Hero />
      </SectionTransition>
      <SectionTransition>
        <Services />
      </SectionTransition>
      <SectionTransition>
        <About />
      </SectionTransition>
      <SectionTransition>
        <Booking />
      </SectionTransition>
      <SectionTransition>
        <Contact />
      </SectionTransition>
      <Footer />
    </main>
  )
}