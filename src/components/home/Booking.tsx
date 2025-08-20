/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react'
import { validateBooking, type BookingFormData } from '@/lib/validation'
import { getBulgariaTime } from '@/lib/bulgaria-time'

const Booking = () => {
  const [bookingData, setBookingData] = useState<BookingFormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [csrfToken, setCsrfToken] = useState('') // временно изключено

  const [services, setServices] = useState<Array<{id: number, name: string, duration: number}>>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [minDate, setMinDate] = useState('')
  const isServiceSelected = !!bookingData.service
  const isDateSelected = !!bookingData.date
  const timePlaceholder = isLoadingSlots
    ? 'Зареждане...'
    : !isServiceSelected
      ? 'Първо изберете услуга'
      : !isDateSelected
        ? 'Първо изберете дата'
        : (availableSlots.length === 0 ? 'Няма свободни часове' : 'Изберете час')

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await fetch('/api/services')
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

  // Load available slots when date or service changes
  useEffect(() => {
    if (bookingData.date && bookingData.service) {
      loadAvailableSlots()
    }
  }, [bookingData.date, bookingData.service])

  // Set min date on client side only to avoid hydration mismatch
  useEffect(() => {
    const today = getBulgariaTime()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    setMinDate(`${year}-${month}-${day}`)
  }, [])

  const loadAvailableSlots = async () => {
    setIsLoadingSlots(true)
    try {
      const response = await fetch(`/api/available-slots?date=${bookingData.date}&serviceId=${bookingData.service}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots)
      }
    } catch (error) {
      console.error('Error loading available slots:', error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Client-side validation
    const validation = validateBooking(bookingData)
    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      validation.error.issues.forEach(issue => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message
        }
      })
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Normalize phone on client to help UX
      const phoneDigits = (bookingData.phone || '').replace(/\D/g, '')
      let phoneE164 = bookingData.phone
      if (phoneDigits.startsWith('0')) {
        phoneE164 = '+359' + phoneDigits.replace(/^0+/, '')
      } else if (!bookingData.phone.startsWith('+') && phoneDigits.length === 9) {
        phoneE164 = '+359' + phoneDigits
      }
      const payload = { ...bookingData, phone: phoneE164 }
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'x-csrf-token': csrfToken // временно изключено
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        setBookingData({
          name: '',
          email: '',
          phone: '',
          service: '',
          date: '',
          time: '',
          message: ''
        })
      } else {
        setErrors({ submit: result.error })
      }
    } catch (error) {
      setErrors({ submit: 'Възникна грешка. Моля опитайте отново.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <section id="booking" className="section-padding bg-gradient-to-br from-primary-50 to-white">
      <div className="container-custom">
                            <div className="text-center mb-16 animate-fade-in">
                      <h2 className="text-3xl lg:text-4xl font-bold text-secondary-900 mb-4">
                        Резервирайте час
                      </h2>
                      <p className="text-xl text-secondary-600 max-w-3xl mx-auto mb-4">
                        Резервирайте час за преглед или лечение. Ще се свържем с вас за потвърждение.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-3xl mx-auto">
                        <p className="text-yellow-800 text-sm">
                          <strong>Важно:</strong> Моля, изберете точно услугата, от която имате нужда. 
                          Времетраенето на резервацията зависи от избраната услуга и не може да се промени след като се резервира.
                        </p>
                      </div>
                    </div>

        <div className="grid lg:grid-cols-2 gap-12 animate-fade-in">
          {/* Booking Form */}
          <div className="card animate-slide-up">
            <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
              Попълнете формата
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                    Име *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={bookingData.name}
                      onChange={handleChange}
                      required
                      className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                      placeholder="Вашето име"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700 mb-2">
                    Телефон *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={bookingData.phone}
                      onChange={handleChange}
                      required
                      className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="+359 888 123 456"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Имейл
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={bookingData.email}
                    onChange={handleChange}
                    className="input-field pl-10"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                                            <div>
                              <label htmlFor="service" className="block text-sm font-medium text-secondary-700 mb-2">
                                Услуга * <span className="text-red-500">(важно)</span>
                              </label>
                              <select
                                id="service"
                                name="service"
                                value={bookingData.service}
                                onChange={handleChange}
                                required
                                className={`input-field ${errors.service ? 'border-red-500' : ''}`}
                              >
                                <option value="">Изберете услуга</option>
                                {services.map((service) => (
                                  <option key={service.id} value={service.id}>
                                    {service.name}
                                  </option>
                                ))}
                              </select>
                              {errors.service && (
                                <p className="text-red-600 text-xs mt-1">{errors.service}</p>
                              )}
                              <p className="text-xs text-secondary-600 mt-1">
                                Изберете точно услугата, от която имате нужда. Времетраенето не може да се промени след резервиране.
                              </p>
                            </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-secondary-700 mb-2">
                    Дата *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={bookingData.date}
                      onChange={handleChange}
                      required
                      className={`input-field pl-10 ${errors.date ? 'border-red-500' : ''}`}
                      min={minDate}
                    />
                    {errors.date && (
                      <p className="text-red-600 text-xs mt-1">{errors.date}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-secondary-700 mb-2">
                  Час *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                                                    <select
                                id="time"
                                name="time"
                                value={bookingData.time}
                                onChange={handleChange}
                                required
                                className={`input-field pl-10 ${errors.time ? 'border-red-500' : ''}`}
                                disabled={!isServiceSelected || !isDateSelected || isLoadingSlots}
                              >
                                <option value="">
                                  {timePlaceholder}
                                </option>
                                {availableSlots.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </select>
                    {errors.time && (
                      <p className="text-red-600 text-xs mt-1">{errors.time}</p>
                    )}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-secondary-700 mb-2">
                  Допълнителна информация
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-secondary-400" />
                  <textarea
                    id="message"
                    name="message"
                    value={bookingData.message}
                    onChange={handleChange}
                    rows={4}
                    className="input-field pl-10 resize-none"
                    placeholder="Допълнителна информация за вашия случай..."
                  />
                </div>
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {errors.submit}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Изпращане...' : 'Резервирай час'}</span>
              </button>
            </form>
          </div>

          {/* Booking Info */}
          <div className="space-y-8 animate-fade-in">
            <div className="card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Защо да резервирате онлайн?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Бързо и лесно</h4>
                    <p className="text-secondary-600 text-sm">Резервирайте за минути от вашия дом</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Моментално потвърждение</h4>
                    <p className="text-secondary-600 text-sm">Получете потвърждение веднага</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary-900">Напомняния</h4>
                    <p className="text-secondary-600 text-sm">Получете напомняне преди час</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-primary-50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Работно време
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between animate-fade-in" style={{ animationDelay: '0.5s' }}>
                  <span className="text-secondary-700">Понеделник - Петък</span>
                  <span className="font-semibold text-secondary-900">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <span className="text-secondary-700">Събота</span>
                  <span className="font-semibold text-secondary-900">9:00 - 14:00</span>
                </div>
                <div className="flex justify-between animate-fade-in" style={{ animationDelay: '0.7s' }}>
                  <span className="text-secondary-700">Неделя</span>
                  <span className="font-semibold text-red-600">Затворено</span>
                </div>
              </div>
            </div>

            <div className="card animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">
                Имате въпроси?
              </h3>
              <p className="text-secondary-600 mb-4">
                Ако имате въпроси или се нуждаете от помощ, не се колебайте да се свържете с нас.
              </p>
              <div className="space-y-3">
                <a href="tel:+359888123456" className="flex items-center space-x-3 text-secondary-700 hover:text-primary-600 transition-colors animate-fade-in" style={{ animationDelay: '0.8s' }}>
                  <Phone className="w-4 h-4" />
                  <span>+359 888 123 456</span>
                </a>
                <a href="mailto:dr.petrov@example.com" className="flex items-center space-x-3 text-secondary-700 hover:text-primary-600 transition-colors animate-fade-in" style={{ animationDelay: '0.9s' }}>
                  <Mail className="w-4 h-4" />
                  <span>dr.petrov@example.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Booking 