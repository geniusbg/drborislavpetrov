'use client'

import { useState, useEffect } from 'react'
import { Trash2, Clock } from 'lucide-react'
import type { Booking, Service as ServiceType } from '@/types/global'
import { getBulgariaTime } from '@/lib/bulgaria-time'
import { offlineStorage } from '@/lib/offline-storage'

interface BookingFormProps {
  booking: Booking | null
  onSubmit: (data: Partial<Booking>, isStatusOnly?: boolean) => void
  onCancel: () => void
  onDelete?: (bookingId: string) => void
  isStatusOnly?: boolean
}

const BookingForm = ({ booking, onSubmit, onCancel, onDelete }: BookingFormProps) => {
  const [services, setServices] = useState<ServiceType[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: booking?.name || '',
    email: booking?.email || '',
    phone: booking?.phone || '',
    service: booking?.service || '',
    serviceName: booking?.serviceName || '',
    serviceDuration: booking?.serviceDuration || 30,
    date: booking?.date || '',
    time: booking?.time || '',
    message: booking?.message || '',
    status: booking?.status || 'pending'
  })

  useEffect(() => {
    const loadServices = async () => {
      try {
        const adminToken = localStorage.getItem('adminToken')
        const response = await fetch('/api/admin/services', {
          headers: {
            'x-admin-token': adminToken || 'test'
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
    loadServices()
  }, [])

  // Load available time slots when date, service, or serviceDuration changes
  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      
      if (!formData.date || !formData.service) {

        setAvailableTimeSlots([])
        return
      }

      setLoadingTimeSlots(true)
      try {
        const adminToken = localStorage.getItem('adminToken')
        const params = new URLSearchParams({
          date: formData.date,
          service: formData.service,
          serviceDuration: formData.serviceDuration.toString()
        })
        // Return all available slots (no server-side limit)
        params.append('limit', '0')
        
        // If editing existing booking, exclude it from conflicts
        if (booking?.id) {
          params.append('excludeBookingId', booking.id.toString())
        }

        const apiUrl = `/api/admin/available-time-slots?${params}`

        
        const response = await fetch(apiUrl, {
          headers: {
            'x-admin-token': adminToken || 'mock-token'
          }
        })
        
        if (response.ok) {
          const data = await response.json()

          setAvailableTimeSlots(data.availableSlots || [])
        } else {
          console.error('Failed to load available time slots')
          setAvailableTimeSlots([])
        }
      } catch (error) {
        console.error('Error loading available time slots:', error)
        setAvailableTimeSlots([])
      } finally {
        setLoadingTimeSlots(false)
      }
    }

    loadAvailableTimeSlots()
  }, [formData.date, formData.service, formData.serviceDuration, booking?.id])

  // Update form data when booking changes - only on initial load or when booking ID changes
  useEffect(() => {
    if (booking) {
      setFormData({
        name: booking.name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        service: booking.service || '',
        serviceName: booking.serviceName || '',
        serviceDuration: booking.serviceDuration || 30,
        date: booking.date || '',
        time: booking.time || '',
        message: booking.message || '',
        status: booking.status || 'pending'
      })
    } else {
      // Reset form when no booking (new booking)
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        serviceName: '',
        serviceDuration: 30,
        date: '',
        time: '',
        message: '',
        status: 'pending'
      })
    }
  }, [booking?.id]) // eslint-disable-next-line react-hooks/exhaustive-deps

  // Handle Escape key for closing modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Check if this is only a status update by comparing with original booking
    const isStatusOnlyUpdate = booking ? 
      (formData.name === booking.name &&
      formData.email === booking.email &&
      formData.phone === booking.phone &&
      formData.service === booking.service &&
      formData.date === booking.date &&
      formData.time === booking.time &&
      // Handle null/empty message comparison
      (formData.message || '') === (booking.message || '') &&
      formData.status !== booking.status) : false
      
    // Check if no changes were made at all
    const noChanges = booking ? 
      (formData.name === booking.name &&
      formData.email === booking.email &&
      formData.phone === booking.phone &&
      formData.service === booking.service &&
      formData.date === booking.date &&
      formData.time === booking.time &&
      (formData.message || '') === (booking.message || '') &&
      formData.status === booking.status) : false
    
    console.log('🔍 [BookingForm] Status check:', {
      booking: booking ? {
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        message: booking.message,
        status: booking.status
      } : null,
      formData: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        message: formData.message,
        status: formData.status
      },
      comparisons: {
        nameMatch: formData.name === booking?.name,
        emailMatch: formData.email === booking?.email,
        phoneMatch: formData.phone === booking?.phone,
        serviceMatch: formData.service === booking?.service,
        dateMatch: formData.date === booking?.date,
        timeMatch: formData.time === booking?.time,
        messageMatch: (formData.message || '') === (booking?.message || ''),
        statusDifferent: formData.status !== booking?.status
      },
      keysComparison: {
        formDataKeys: Object.keys(formData),
        bookingKeys: booking ? Object.keys(booking) : [],
        keysMatch: Object.keys(formData).length === (booking ? Object.keys(booking).length : 0)
      },
      isStatusOnlyUpdate,
      noChanges
    })
    
    // If no changes were made, just close the modal
    if (noChanges) {
      console.log('🔍 [BookingForm] No changes detected, closing modal')
      onCancel()
      return
    }
    
    // Check if the selected date and time are in the past
    if (formData.date && formData.time) {
      const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
      const now = getBulgariaTime()
      
      if (selectedDateTime < now) {
        const confirmPast = confirm(
          `Избраната дата и час (${formData.date} ${formData.time}) са в миналото. Сигурни ли сте, че искате да добавите резервация за минало време? Това може да е грешка.`
        )
        
        if (!confirmPast) {
          return
        }
      }
    }
    
    // API /api/admin/available-time-slots вече проверява за конфликти
    // Само наличните часове се показват в dropdown-а
    
    // Convert empty phone to undefined (per user requirement: phone should be UNIQUE OR NULL)
    const submissionData = {
      ...formData,
      phone: formData.phone && formData.phone.trim() !== '' ? formData.phone.trim() : undefined
    }
    
    try {
      // Проверяваме дали сме онлайн
      if (navigator.onLine) {
        // Онлайн режим - изпращаме веднага
        await onSubmit(submissionData, isStatusOnlyUpdate)
      } else {
        // Офлайн режим - запазваме за синхронизация
        const actionType = booking ? 'UPDATE_BOOKING' : 'CREATE_BOOKING'
        const actionData = booking ? 
          { ...submissionData, id: booking.id } : 
          submissionData
        
        offlineStorage.saveAction({
          type: actionType,
          data: actionData
        })
        
        // Показваме съобщение за успешно запазване
        alert('Резервацията е запазена за синхронизация. Ще се изпрати когато се върне интернет връзката.')
        
        // Затваряме формата
        onCancel()
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      if (navigator.onLine) {
        alert('Грешка при запазване на резервацията. Моля, опитайте отново.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Име *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Телефон</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="+359888123456 (опционално)"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Имейл</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Услуга *</label>
          <select
            name="service"
            value={formData.service}
            onChange={(e) => {
              const selectedService = services.find(s => s.id.toString() === e.target.value)
              setFormData({ 
                ...formData, 
                service: e.target.value,
                serviceName: selectedService?.name || '',
                serviceDuration: selectedService?.duration || 30
              })
            }}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Изберете услуга</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.duration} мин)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Статус</label>
          <select
            name="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Booking['status'] })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="pending">Чакаща</option>
            <option value="confirmed">Потвърдена</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Дата *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Час *</label>
          <div className="relative">
            <select
              name="time"
              value={formData.time}
              onChange={(e) => {
                console.log('🔍 [BookingForm] Time changed to:', e.target.value)
                setFormData({ ...formData, time: e.target.value })
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md pl-10 pr-8 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              required
              disabled={loadingTimeSlots || !formData.date || !formData.service}
            >
              <option value="">
                {loadingTimeSlots ? 'Зареждане...' : 
                 !formData.date ? 'Първо изберете дата' :
                 !formData.service ? 'Първо изберете услуга' :
                 availableTimeSlots.length === 0 ? 'Няма свободни часове' :
                 'Изберете час'}
              </option>
              {availableTimeSlots.map(timeSlot => (
                <option key={timeSlot} value={timeSlot}>
                  {timeSlot}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Съобщение</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        {booking?.id && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (navigator.onLine) {
                // Онлайн режим - изтриваме веднага
                onDelete(booking.id)
              } else {
                // Офлайн режим - запазваме за синхронизация
                offlineStorage.saveAction({
                  type: 'DELETE_BOOKING',
                  data: { id: booking.id }
                })
                
                alert('Изтриването е запазено за синхронизация. Ще се изпълни когато се върне интернет връзката.')
                
                // Затваряме формата
                onCancel()
              }
            }}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Изтрий</span>
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Отказ
        </button>
                  <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Запазване...' : 'Запази'}
          </button>
      </div>
    </form>
  )
}

export default BookingForm 