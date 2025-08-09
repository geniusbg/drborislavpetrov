'use client'

import { useState, useEffect, useRef } from 'react'

interface SectionTransitionProps {
  children: React.ReactNode
  className?: string
  threshold?: number
}

export const SectionTransition = ({ 
  children, 
  className = '', 
  threshold = 0.1 
}: SectionTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Добавяме малко закъснение за анимацията
          setTimeout(() => setIsLoaded(true), 100)
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={sectionRef}
      className={`
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${isLoaded ? 'scale-100' : 'scale-95'}
        ${className}
      `}
    >
      {children}
    </div>
  )
} 