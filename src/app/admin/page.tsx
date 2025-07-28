'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, TrendingUp, LogOut, Plus, Edit, Trash2, Mic, MicOff, Smartphone, ArrowLeft } from 'lucide-react'
import ServiceForm from '@/components/admin/ServiceForm'
import BookingForm from '@/components/admin/BookingForm'
import UserForm from '@/components/admin/UserForm'
import CalendarComponent from '@/components/admin/Calendar'
import UserHistory from '@/components/admin/UserHistory'

interface Booking {
  id: string
  name: string
  email?: string
  phone: string
  service: string
  date: string
  time: string
  message?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  userName?: string // Added for user information
}

interface Service {
  id: number
  name: string
  description?: string
  duration: number
  price?: number
  isActive: boolean
}

interface User {
  id: number
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage on mount
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminActiveTab') || 'bookings'
    }
    return 'bookings'
  })
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const [lastBookingCount, setLastBookingCount] = useState(0)
  const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [bookingSearchTerm, setBookingSearchTerm] = useState('')
  const [userFromHistory, setUserFromHistory] = useState<User | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [availabilityDate, setAvailabilityDate] = useState<string>('')
  const [availabilityDateStr, setAvailabilityDateStr] = useState<string>('')

  // Check authentication on mount
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      window.location.href = '/admin/login'
      return
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadBookings(),
        loadServices(),
        loadUsers()
      ])
      setIsLoading(false)
    }
    
    loadInitialData()
    
    // Auto-refresh bookings every 10 seconds
    const bookingsInterval = setInterval(() => {
      loadBookings()
    }, 10000)
    
    // Auto-refresh users every 30 seconds
    const usersInterval = setInterval(() => {
      loadUsers()
    }, 30000)
    
    // Auto-refresh services every 60 seconds
    const servicesInterval = setInterval(() => {
      loadServices()
    }, 60000)
    
    return () => {
      clearInterval(bookingsInterval)
      clearInterval(usersInterval)
      clearInterval(servicesInterval)
    }
  }, []) // Empty dependency array to run only once

  const loadBookings = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data.bookings)
        
        // Check for new bookings
        if (data.bookings.length > lastBookingCount && lastBookingCount > 0) {
          alert(`Нова резервация! Общо: ${data.bookings.length}`)
        }
        setLastBookingCount(data.bookings.length)
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const loadServices = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/services', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id, status })
      })
      
      if (response.ok) {
        setBookings(prev => prev.map(booking => 
          booking.id === id ? { ...booking, status } : booking
        ))
      } else {
        console.error('Failed to update booking status')
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
    }
  }

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getServiceLabel = (serviceId: string) => {
    const service = services.find(s => s.id.toString() === serviceId)
    return service ? service.name : serviceId
  }

  const handleServiceSubmit = async (serviceData: Partial<Service>) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const method = editingService ? 'PUT' : 'POST'
      
      const response = await fetch('/api/admin/services', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(editingService ? { ...serviceData, id: editingService.id } : serviceData)
      })
      
      if (response.ok) {
        loadServices()
        setShowServiceModal(false)
        setEditingService(null)
      } else {
        console.error('Failed to save service')
      }
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleDeleteService = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази услуга?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/services?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        loadServices()
      } else {
        console.error('Failed to delete service')
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const handleBookingSubmit = async (bookingData: Partial<Booking>) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/bookings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ 
          id: editingBooking?.id,
          ...bookingData 
        })
      })
      
      if (response.ok) {
        loadBookings()
        setShowBookingModal(false)
        setEditingBooking(null)
        
        // Return to user history if we came from there
        if (userFromHistory) {
          setSelectedUserForHistory(userFromHistory)
          setUserFromHistory(null) // Clear the stored user
        }
      } else {
        console.error('Failed to update booking')
      }
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const handleUpdateTreatmentNotes = async (bookingId: string, notes: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bookings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({
          id: bookingId,
          treatment_notes: notes
        })
      })
      
      if (response.ok) {
        loadBookings()
      } else {
        const error = await response.json()
        alert(error.error || 'Грешка при обновяване на бележките')
      }
    } catch (error) {
      console.error('Error updating treatment notes:', error)
      alert('Грешка при обновяване на бележките')
    }
  }

  const handleEditBookingFromHistory = (booking: Booking) => {
    setEditingBooking(booking)
    setShowBookingModal(true)
    setUserFromHistory(selectedUserForHistory)
  }

  const handleCreateBookingFromSlot = (time: string) => {
    setEditingBooking({
      id: '',
      name: '',
      phone: '',
      service: '',
      date: availabilityDate,
      time: time,
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    setShowBookingModal(true)
    // Clear availability data after selecting a slot
    setAvailableSlots([])
    setAvailabilityDate('')
    setAvailabilityDateStr('')
  }

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchTerm = userSearchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(searchTerm) ||
      user.phone.toLowerCase().includes(searchTerm) ||
      (user.email && user.email.toLowerCase().includes(searchTerm))
    )
  })

  // Filter bookings based on search term
  const filteredBookings = bookings.filter(booking => {
    const searchTerm = bookingSearchTerm.toLowerCase()
    return (
      booking.name.toLowerCase().includes(searchTerm) ||
      booking.phone.toLowerCase().includes(searchTerm) ||
      (booking.email && booking.email.toLowerCase().includes(searchTerm)) ||
      booking.date.toLowerCase().includes(searchTerm) ||
      booking.time.toLowerCase().includes(searchTerm) ||
      getServiceLabel(booking.service).toLowerCase().includes(searchTerm)
    )
  })

  const startVoiceRecognition = () => {
    // Check if running on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    
    if (isIOS) {
      alert('Гласовото разпознаване не се поддържа на iOS устройства. Моля, използвайте компютър или Android устройство.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Гласовото разпознаване не се поддържа в този браузър. Моля, използвайте Chrome или Edge.')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'bg-BG'

      recognition.onstart = () => {
        setIsListening(true)
        setVoiceMessage('Говорете сега...')
      }

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        console.log('Voice transcript:', transcript)
        setVoiceMessage(`Разбрах: "${transcript}"`)

        try {
          const adminToken = localStorage.getItem('adminToken')
          const response = await fetch('/api/admin/voice-commands', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminToken || ''
            },
            body: JSON.stringify({ voiceCommand: transcript })
          })

          const result = await response.json()
          console.log('API response:', result)

          if (result.success) {
            setVoiceMessage(result.message)
            
            // Check if this is an availability check result
            if (result.result && result.result.availableSlots) {
              setAvailableSlots(result.result.availableSlots)
              setAvailabilityDate(result.result.targetDate)
              setAvailabilityDateStr(result.result.dateStr)
            } else {
              // Clear availability data for other commands
              setAvailableSlots([])
              setAvailabilityDate('')
              setAvailabilityDateStr('')
            }
            
            // Refresh all sections after voice command
            loadBookings()
            loadUsers()
            loadServices()
          } else {
            setVoiceMessage(`Грешка: ${result.message}`)
            // Clear availability data on error
            setAvailableSlots([])
            setAvailabilityDate('')
            setAvailabilityDateStr('')
          }
        } catch (error) {
          console.error('Voice command error:', error)
          setVoiceMessage('Грешка при обработка на командата')
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        console.error('Speech recognition error:', event.error)

        let errorMessage = 'Грешка при разпознаване на гласа'
        if (event.error === 'not-allowed') {
          errorMessage = 'Няма разрешение за достъп до микрофона. Моля, разрешете достъпа.'
        } else if (event.error === 'no-speech') {
          errorMessage = 'Не се разпозна глас. Моля, опитайте отново.'
        } else if (event.error === 'network') {
          errorMessage = 'Грешка в мрежата. Моля, проверете интернет връзката.'
        }

        setVoiceMessage(errorMessage)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch (error) {
      console.error('Error starting speech recognition:', error)
      setVoiceMessage('Грешка при стартиране на гласовото разпознаване')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 gap-4">
            {/* Left Section - Title and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">Админ Панел</h1>
                  <p className="text-blue-100 text-sm">Управление на резервации и потребители</p>
                </div>
              </div>
            </div>
            
            {/* Center Section - Voice Command */}
            <div className="flex flex-col items-center space-y-3">
              <button
                onClick={startVoiceRecognition}
                disabled={isListening}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-red-500/25 animate-pulse' 
                    : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm hover:scale-105'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span className="hidden sm:inline">
                  {isListening ? 'Спиране...' : 'Гласова команда'}
                </span>
              </button>
              
              {/* Voice Command Examples - Collapsible */}
              <div className="relative group">
                <button className="text-blue-100 hover:text-white text-xs underline">
                  Примери за команди
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Гласови команди:</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-green-600 text-sm">Резервации:</p>
                        <p className="text-xs text-gray-600">"запази ми час за Иван Иванов за 24 август от 10 часа за почистване на зъби"</p>
                      </div>
                      <div>
                        <p className="font-medium text-blue-600 text-sm">Потребители:</p>
                        <p className="text-xs text-gray-600">"добави потребител Иван Иванов телефон 0881234567"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section - Navigation and Actions */}
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Към сайта</span>
              </a>
              
              <a
                href="/siri"
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Siri Shortcuts</span>
              </a>
              
              <div className="h-6 w-px bg-blue-400"></div>
              
              <button
                onClick={() => {
                  localStorage.removeItem('adminToken')
                  window.location.href = '/admin/login'
                }}
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Изход</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Зареждане на админ панела...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Voice Command Message */}
          {voiceMessage && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mic className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-blue-800 font-medium">{voiceMessage}</p>
              </div>
              
              {/* Available Slots - Clickable Options */}
              {availableSlots.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Кликнете на час за създаване на резервация:
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {availableSlots.map((time, index) => (
                      <button
                        key={index}
                        onClick={() => handleCreateBookingFromSlot(time)}
                        className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors duration-200"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Statistics Cards - Modern Design */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Общо резервации</p>
                  <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Потвърдени</p>
                  <p className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Чакащи</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => b.status === 'pending').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Потребители</p>
                  <p className="text-2xl font-bold text-purple-600">{users.length}</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs - Modern Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="p-1">
              <nav className="flex space-x-1">
                <button
                  onClick={() => {
                    setActiveTab('bookings')
                    localStorage.setItem('adminActiveTab', 'bookings')
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'bookings'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Резервации</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('calendar')
                    localStorage.setItem('adminActiveTab', 'calendar')
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Календар</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('users')
                    localStorage.setItem('adminActiveTab', 'users')
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Потребители</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('services')
                    localStorage.setItem('adminActiveTab', 'services')
                  }}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'services'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Услуги</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'bookings' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Резервации</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {bookingSearchTerm ? `${filteredBookings.length} от ${bookings.length} резервации` : `${bookings.length} резервации`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Търси по име, телефон, имейл, дата, час или услуга..."
                      value={bookingSearchTerm}
                      onChange={(e) => setBookingSearchTerm(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {bookingSearchTerm && (
                      <button
                        onClick={() => setBookingSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile: Card Layout, Desktop: Table Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{booking.name}</h3>
                          <p className="text-sm text-gray-600">{booking.phone}</p>
                          {booking.email && (
                            <p className="text-sm text-gray-600">{booking.email}</p>
                          )}
                          {booking.userName && booking.userName !== booking.name && (
                            <p className="text-xs text-blue-600">Потребител: {booking.userName}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status === 'pending' && 'Чакаща'}
                          {booking.status === 'confirmed' && 'Потвърдена'}
                          {booking.status === 'cancelled' && 'Отменена'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Услуга</p>
                          <p className="font-medium">{getServiceLabel(booking.service)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Дата & Час</p>
                          <p className="font-medium">
                            {new Date(booking.date).toLocaleDateString('bg-BG')}
                          </p>
                          <p className="text-gray-600">{booking.time}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setEditingBooking(booking)
                            setShowBookingModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            className="text-green-600 hover:text-green-900 p-2 rounded-md hover:bg-green-50"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Пациент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Услуга
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата & Час
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                            <div className="text-sm text-gray-500">{booking.phone}</div>
                            {booking.email && (
                              <div className="text-sm text-gray-500">{booking.email}</div>
                            )}
                            {booking.userName && booking.userName !== booking.name && (
                              <div className="text-xs text-blue-600">Потребител: {booking.userName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getServiceLabel(booking.service)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.date).toLocaleDateString('bg-BG')}
                          </div>
                          <div className="text-sm text-gray-500">{booking.time}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status === 'pending' && 'Чакаща'}
                            {booking.status === 'confirmed' && 'Потвърдена'}
                            {booking.status === 'cancelled' && 'Отменена'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingBooking(booking)
                                setShowBookingModal(true)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Календар на резервациите</h2>
                <p className="text-sm text-gray-600 mt-1">Преглед и управление на резервациите по дни</p>
              </div>
              <div className="p-6">
                <CalendarComponent 
                  bookings={bookings}
                  onBookingClick={(booking) => {
                    setEditingBooking(booking)
                    setShowBookingModal(true)
                  }}
                  onNewBooking={(date) => {
                    setEditingBooking({
                      id: '',
                      name: '',
                      phone: '',
                      service: '',
                      date: date,
                      time: '',
                      status: 'pending',
                      createdAt: new Date().toISOString()
                    })
                    setShowBookingModal(true)
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'services' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Услуги</h2>
                  <p className="text-sm text-gray-600 mt-1">Управление на стоматологичните услуги</p>
                </div>
                <button
                  onClick={() => {
                    setEditingService(null)
                    setShowServiceModal(true)
                  }}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добави услуга</span>
                </button>
              </div>
              
              {/* Mobile: Card Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {services.map((service) => (
                    <div key={service.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{service.name}</h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Активна' : 'Неактивна'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Продължителност</p>
                          <p className="font-medium">{service.duration} мин.</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Цена</p>
                          <p className="font-medium">
                            {service.price ? `${service.price} лв.` : '-'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setEditingService(service)
                            setShowServiceModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Услуга
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Продължителност
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Цена
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{service.description || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{service.duration} мин.</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {service.price ? `${service.price} лв.` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? 'Активна' : 'Неактивна'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingService(service)
                                setShowServiceModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-semibold text-gray-900">Потребители</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {userSearchTerm ? `${filteredUsers.length} от ${users.length} потребители` : `${users.length} потребители`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder="Търси по име, телефон или имейл..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добави потребител</span>
                  </button>
                </div>
              </div>
              
              {/* Mobile: Card Layout */}
              <div className="block sm:hidden">
                <div className="space-y-3 p-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.phone}</p>
                          {user.email && (
                            <p className="text-sm text-gray-600">{user.email}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500 mb-3">
                        Създаден: {new Date(user.createdAt).toLocaleDateString('bg-BG')}
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setEditingUser(user)
                            setShowUserModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Сигурни ли сте, че искате да изтриете потребителя ${user.name}?`)) {
                              try {
                                const adminToken = localStorage.getItem('adminToken')
                                const response = await fetch(`/api/admin/users?id=${user.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'x-admin-token': adminToken || ''
                                  }
                                })
                                if (response.ok) {
                                  loadUsers()
                                } else {
                                  const error = await response.json()
                                  alert(error.error || 'Грешка при изтриване на потребителя')
                                }
                              } catch (error) {
                                console.error('Error deleting user:', error)
                                alert('Грешка при изтриване на потребителя')
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Име
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Имейл
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Създаден на
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedUserForHistory(user)}
                              className="text-green-600 hover:text-green-900"
                              title="История на резервациите"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setShowUserModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Редактирай"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Сигурни ли сте, че искате да изтриете потребителя ${user.name}?`)) {
                                  try {
                                    const adminToken = localStorage.getItem('adminToken')
                                    const response = await fetch(`/api/admin/users?id=${user.id}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'x-admin-token': adminToken || ''
                                      }
                                    })
                                    if (response.ok) {
                                      loadUsers()
                                    } else {
                                      const error = await response.json()
                                      alert(error.error || 'Грешка при изтриване на потребителя')
                                    }
                                  } catch (error) {
                                    console.error('Error deleting user:', error)
                                    alert('Грешка при изтриване на потребителя')
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Изтрий"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingBooking ? 'Редактирай резервация' : 'Нова резервация'}
              </h3>
              <BookingForm
                booking={editingBooking}
                onSubmit={handleBookingSubmit}
                onCancel={() => {
                  setShowBookingModal(false)
                  setEditingBooking(null)
                  
                  // Return to user history if we came from there
                  if (userFromHistory) {
                    setSelectedUserForHistory(userFromHistory)
                    setUserFromHistory(null) // Clear the stored user
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Редактирай услуга' : 'Добави услуга'}
              </h3>
              <ServiceForm
                service={editingService}
                onSubmit={handleServiceSubmit}
                onCancel={() => {
                  setShowServiceModal(false)
                  setEditingService(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Редактирай потребител' : 'Добави потребител'}
              </h3>
              <UserForm
                user={editingUser}
                onSubmit={async (userData) => {
                  try {
                    const adminToken = localStorage.getItem('adminToken')
                    const method = editingUser ? 'PUT' : 'POST'
                    const response = await fetch('/api/admin/users', {
                      method,
                      headers: {
                        'Content-Type': 'application/json',
                        'x-admin-token': adminToken || ''
                      },
                      body: JSON.stringify(editingUser ? { ...userData, id: editingUser.id } : userData)
                    })

                    if (response.ok) {
                      loadUsers()
                      setShowUserModal(false)
                      setEditingUser(null)
                    } else {
                      console.error('Failed to save user')
                    }
                  } catch (error) {
                    console.error('Error saving user:', error)
                  }
                }}
                onCancel={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {selectedUserForHistory && (
        <UserHistory
          user={selectedUserForHistory}
          bookings={bookings}
          onClose={() => setSelectedUserForHistory(null)}
          onUpdateTreatmentNotes={handleUpdateTreatmentNotes}
          onEditBooking={handleEditBookingFromHistory}
        />
      )}
    </div>
  )
}

export default AdminDashboard 