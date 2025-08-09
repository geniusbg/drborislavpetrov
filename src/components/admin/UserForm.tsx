'use client'

import { useState, useEffect } from 'react'
import type { User as UserType } from '@/types/global'

interface UserFormProps {
  user?: UserType | null
  onSubmit: (user: UserType) => void
  onCancel: () => void
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<UserType>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const translateUserError = (msg: string) => {
    const m = (msg || '').toLowerCase()
    if (m.includes('name is required')) return 'Името е задължително.'
    if (m.includes('id and name are required')) return 'Липсват ID или име.'
    if (m.includes('phone number is already used') || m.includes('user with this phone number already exists')) {
      return 'Телефонният номер вече се използва от друг потребител.'
    }
    if (m.includes('unauthorized')) return 'Нямате права за това действие.'
    if (m.includes('internal server error')) return 'Вътрешна грешка на сървъра.'
    // Ако вече е на български, върни оригинала
    if (msg.match(/[А-Яа-я]/)) return msg
    // Fallback
    return 'Грешка при запазване на потребителя.'
  }

  useEffect(() => {
    if (user) {
      // Normalize undefined/null fields to empty strings to keep inputs controlled
      setFormData(prev => ({
        ...prev,
        ...user,
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        notes: user.notes ?? ''
      }))
    }
  }, [user])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('UserForm handleSubmit called')
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)
    
    // Валидация
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Името е задължително!'
    }
    
    // Phone е optional за admin - премахваме валидацията
    if (formData.phone && formData.phone.trim() && !/^\+?[0-9\s\-\(\)]+$/.test(formData.phone.trim())) {
      newErrors.phone = 'Невалиден формат на телефонен номер!'
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Невалиден формат на имейл адрес!'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }
    
    try {
      await onSubmit(formData)
      setIsSubmitting(false)
    } catch (error) {
      const raw = error instanceof Error ? error.message : 'Грешка при запазване на потребителя.'
      setErrors({ submit: translateUserError(raw) })
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Име *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name ?? ''}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Имейл
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email ?? ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone ?? ''}
              onChange={handleChange}
              placeholder="+359888123456"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address ?? ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Бележки
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes ?? ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Общи грешки */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Отказ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Запазване...' : (user ? 'Запази' : 'Добави')}
            </button>
          </div>
        </form>
    </div>
  )
}

export default UserForm 