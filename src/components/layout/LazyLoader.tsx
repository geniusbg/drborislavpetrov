'use client'

import { Suspense, lazy } from 'react'

// Lazy load components
const Booking = lazy(() => import('@/components/home/Booking'))
const Contact = lazy(() => import('@/components/home/Contact'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
)

// Lazy loaded components with fallback
export const LazyBooking = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Booking />
  </Suspense>
)

export const LazyContact = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Contact />
  </Suspense>
) 