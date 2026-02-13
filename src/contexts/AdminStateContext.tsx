'use client'

import React, { createContext, useContext, useState, useRef } from 'react'
import type { Booking, User as UserType, Service as ServiceType, Case as CaseType } from '@/types/global'

// Sort types
export type SortField = 'date' | 'time' | 'name' | 'phone' | 'service' | 'status' | 'createdAt'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  field: SortField
  direction: SortDirection
}

interface AdminState {
  // Data
  bookings: Booking[]
  users: UserType[]
  services: ServiceType[]
  cases: CaseType[]
  
  // Loading states
  isLoading: boolean
  isLoadingBookings: boolean
  isLoadingServices: boolean
  loadingActions: { [key: string]: boolean }
  
  // Modal states
  showUserModal: boolean
  showBookingModal: boolean
  showServiceModal: boolean
  showCaseModal: boolean
  isUserModalClosing: boolean
  isBookingModalClosing: boolean
  isServiceModalClosing: boolean
  isCaseModalClosing: boolean
  
  // Editing states
  editingUser: UserType | null
  editingBooking: Booking | null
  editingService: ServiceType | null
  editingCase: CaseType | null
  
  // Search states
  bookingSearchTerm: string
  userSearchTerm: string
  serviceSearchTerm: string
  
  // Date filter state
  bookingDateFilter: 'all' | 'today' | 'yesterday' | '7days' | '30days'
  
  // Sort state
  sortState: SortState
  
  // Pagination states
  currentBookingsPage: number
  bookingsPerPage: number
  currentUsersPage: number
  usersPerPage: number
  currentServicesPage: number
  servicesPerPage: number
  
  // Other states
  showVoiceInterface: boolean
  isVoiceListening: boolean
  isMobileOrIOS: boolean
  currentDateTime: Date | null
  showSupportNotes: boolean
  hideOverlay: boolean
  isClosing: boolean
  overlayProgress: number
  reopenQuickResponse: boolean
  
  // Header scroll state
  isHeaderVisible: boolean
  lastScrollY: number
}

interface AdminStateContextType extends AdminState {
  // Setters
  setBookings: (bookings: Booking[]) => void
  setUsers: (users: UserType[]) => void
  setServices: (services: ServiceType[]) => void
  setCases: (cases: CaseType[]) => void
  setIsLoading: (loading: boolean) => void
  setIsLoadingBookings: (loading: boolean) => void
  setIsLoadingServices: (loading: boolean) => void
  setLoadingActions: (actions: { [key: string]: boolean }) => void
  setShowUserModal: (show: boolean) => void
  setShowBookingModal: (show: boolean) => void
  setShowServiceModal: (show: boolean) => void
  setShowCaseModal: (show: boolean) => void
  setIsUserModalClosing: (closing: boolean) => void
  setIsBookingModalClosing: (closing: boolean) => void
  setIsServiceModalClosing: (closing: boolean) => void
  setIsCaseModalClosing: (closing: boolean) => void
  setEditingUser: (user: UserType | null) => void
  setEditingBooking: (booking: Booking | null) => void
  setEditingService: (service: ServiceType | null) => void
  setEditingCase: (caseItem: CaseType | null) => void
  setBookingSearchTerm: (term: string) => void
  setUserSearchTerm: (term: string) => void
  setServiceSearchTerm: (term: string) => void
  setBookingDateFilter: (filter: 'all' | 'today' | 'yesterday' | '7days' | '30days') => void
  setSortState: React.Dispatch<React.SetStateAction<SortState>>
  setCurrentBookingsPage: (page: number) => void
  setBookingsPerPage: (perPage: number) => void
  setCurrentUsersPage: (page: number) => void
  setUsersPerPage: (perPage: number) => void
  setCurrentServicesPage: (page: number) => void
  setServicesPerPage: (perPage: number) => void
  setShowVoiceInterface: (show: boolean) => void
  setIsVoiceListening: (listening: boolean) => void
  setIsMobileOrIOS: (mobile: boolean) => void
  setCurrentDateTime: (date: Date | null) => void
  setShowSupportNotes: (show: boolean) => void
  setHideOverlay: (hide: boolean) => void
  setIsClosing: (closing: boolean) => void
  setOverlayProgress: (progress: number) => void
  setReopenQuickResponse: (reopen: boolean) => void
  setIsHeaderVisible: (visible: boolean) => void
  setLastScrollY: (y: number) => void
  
  // Refs
  initLoadStartedRef: React.MutableRefObject<boolean>
  overlayFinalizedRef: React.MutableRefObject<boolean>
}

const AdminStateContext = createContext<AdminStateContextType | undefined>(undefined)

export function AdminStateProvider({ children }: { children: React.ReactNode }) {
  // Data state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [services, setServices] = useState<ServiceType[]>([])
  const [cases, setCases] = useState<CaseType[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [loadingActions, setLoadingActions] = useState<{ [key: string]: boolean }>({})
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCaseModal, setShowCaseModal] = useState(false)
  const [isUserModalClosing, setIsUserModalClosing] = useState(false)
  const [isBookingModalClosing, setIsBookingModalClosing] = useState(false)
  const [isServiceModalClosing, setIsServiceModalClosing] = useState(false)
  const [isCaseModalClosing, setIsCaseModalClosing] = useState(false)
  
  // Editing states
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editingService, setEditingService] = useState<ServiceType | null>(null)
  const [editingCase, setEditingCase] = useState<CaseType | null>(null)
  
  // Search states
  const [bookingSearchTerm, setBookingSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [serviceSearchTerm, setServiceSearchTerm] = useState('')
  
  // Date filter state
  const [bookingDateFilter, setBookingDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all')
  
  // Sort state
  const [sortState, setSortState] = useState<SortState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('adminBookingSort')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Invalid saved data, use default
        }
      }
    }
    return { field: 'date', direction: 'desc' }
  })
  
  // Pagination states
  const [currentBookingsPage, setCurrentBookingsPage] = useState(1)
  const [bookingsPerPage, setBookingsPerPage] = useState(20)
  const [currentUsersPage, setCurrentUsersPage] = useState(1)
  const [usersPerPage, setUsersPerPage] = useState(20)
  const [currentServicesPage, setCurrentServicesPage] = useState(1)
  const [servicesPerPage, setServicesPerPage] = useState(20)
  
  // Other states
  const [showVoiceInterface, setShowVoiceInterface] = useState(false)
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [isMobileOrIOS, setIsMobileOrIOS] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null)
  const [showSupportNotes, setShowSupportNotes] = useState(false)
  const [hideOverlay, setHideOverlay] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [overlayProgress, setOverlayProgress] = useState(0)
  const [reopenQuickResponse, setReopenQuickResponse] = useState(false)
  
  // Header scroll state
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Refs
  const initLoadStartedRef = useRef(false)
  const overlayFinalizedRef = useRef(false)

  const value: AdminStateContextType = {
    // Data
    bookings,
    users,
    services,
    cases,
    
    // Loading states
    isLoading,
    isLoadingBookings,
    isLoadingServices,
    loadingActions,
    
    // Modal states
    showUserModal,
    showBookingModal,
    showServiceModal,
    showCaseModal,
    isUserModalClosing,
    isBookingModalClosing,
    isServiceModalClosing,
    isCaseModalClosing,
    
    // Editing states
    editingUser,
    editingBooking,
    editingService,
    editingCase,
    
    // Search states
    bookingSearchTerm,
    userSearchTerm,
    serviceSearchTerm,
    
    // Date filter state
    bookingDateFilter,
    
    // Sort state
    sortState,
    
    // Pagination states
    currentBookingsPage,
    bookingsPerPage,
    currentUsersPage,
    usersPerPage,
    currentServicesPage,
    servicesPerPage,
    
    // Other states
    showVoiceInterface,
    isVoiceListening,
    isMobileOrIOS,
    currentDateTime,
    showSupportNotes,
    hideOverlay,
    isClosing,
    overlayProgress,
    reopenQuickResponse,
    
    // Header scroll state
    isHeaderVisible,
    lastScrollY,
    
    // Setters
    setBookings,
    setUsers,
    setServices,
    setCases,
    setIsLoading,
    setIsLoadingBookings,
    setIsLoadingServices,
    setLoadingActions,
    setShowUserModal,
    setShowBookingModal,
    setShowServiceModal,
    setShowCaseModal,
    setIsUserModalClosing,
    setIsBookingModalClosing,
    setIsServiceModalClosing,
    setIsCaseModalClosing,
    setEditingUser,
    setEditingBooking,
    setEditingService,
    setEditingCase,
    setBookingSearchTerm,
    setUserSearchTerm,
    setServiceSearchTerm,
    setBookingDateFilter,
    setSortState,
    setCurrentBookingsPage,
    setBookingsPerPage,
    setCurrentUsersPage,
    setUsersPerPage,
    setCurrentServicesPage,
    setServicesPerPage,
    setShowVoiceInterface,
    setIsVoiceListening,
    setIsMobileOrIOS,
    setCurrentDateTime,
    setShowSupportNotes,
    setHideOverlay,
    setIsClosing,
    setOverlayProgress,
    setReopenQuickResponse,
    setIsHeaderVisible,
    setLastScrollY,
    
    // Refs
    initLoadStartedRef,
    overlayFinalizedRef,
  }

  return (
    <AdminStateContext.Provider value={value}>
      {children}
    </AdminStateContext.Provider>
  )
}

export function useAdminState() {
  const context = useContext(AdminStateContext)
  if (context === undefined) {
    throw new Error('useAdminState must be used within an AdminStateProvider')
  }
  return context
}
