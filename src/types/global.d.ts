/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-var */

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

declare global {
  var __DEV__: boolean
  var __PROD__: boolean
}

export {}

export interface Booking {
  id: string
  name: string
  phone: string
  service: string
  date: string
  time: string
  status: string // Changed from 'pending' | 'confirmed' | 'cancelled' to string
  message?: string
  userId?: number | string
  userName?: string
  serviceName?: string
  serviceDuration?: number
  createdAt?: string
  email?: string
  treatment_notes?: string
}

export interface Break {
  id?: number
  startTime: string
  endTime: string
  description: string
}

export interface WorkingHours {
  date?: string
  isWorkingDay: boolean
  startTime: string
  endTime: string
  notes?: string
  breaks: Break[]
}

export interface User {
  id?: number
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
  createdat?: string
  updatedat?: string
}

export interface Service {
  id: number
  name: string
  description?: string
  duration: number
  price?: number
  priceCurrency?: 'BGN' | 'EUR'
  priceBgn?: number
  priceEur?: number
  isActive: boolean
}

// Bug Tracking Types
export interface BugReport {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  category: 'ui' | 'functionality' | 'performance' | 'security' | 'database'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reporter: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  stepsToReproduce: string[]
  expectedBehavior: string
  actualBehavior: string
  browser?: string
  device?: string
  screenshots?: string[]
  tags: string[]
  resolution?: string
}

export interface BugComment {
  id: string
  bugId: string
  author: string
  content: string
  createdAt: string
  isInternal: boolean
}

export interface BugAttachment {
  id: string
  bugId: string
  filename: string
  url: string
  size: number
  uploadedAt: string
} 