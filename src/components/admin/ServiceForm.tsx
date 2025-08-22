'use client'

import { useState, useEffect } from 'react'
import type { Service as ServiceType } from '@/types/global'
import { getDualPrice, formatDualPrice, validatePrice } from '@/lib/currency'

interface ServiceFormProps {
  service: ServiceType | null
  onSubmit: (data: Partial<ServiceType>) => void
  onCancel: () => void
}

const ServiceForm = ({ service, onSubmit, onCancel }: ServiceFormProps) => {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    duration: service?.duration || 30,
    price: service?.price || 0,
    priceCurrency: (service?.priceCurrency as 'BGN' | 'EUR') || 'BGN',
    isActive: service?.isActive ?? true
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        duration: service.duration || 30,
        price: service.price || 0,
        priceCurrency: (service?.priceCurrency as 'BGN' | 'EUR') || 'BGN',
        isActive: service.isActive ?? true
      })
    } else {
      // Reset form when no service (new service)
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        priceCurrency: 'BGN',
        isActive: true
      })
    }
  }, [service])

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
    setErrors({})
    setIsSubmitting(true)
    
    // Валидация
    const newErrors: { [key: string]: string } = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Името на услугата е задължително!'
    }
    
    if (formData.duration < 15) {
      newErrors.duration = 'Продължителността трябва да е поне 15 минути!'
    }
    
    if (formData.price < 0) {
      newErrors.price = 'Цената не може да бъде отрицателна!'
    }
    
    if (!validatePrice(formData.price, formData.priceCurrency)) {
      newErrors.price = 'Цената е твърде висока или твърде ниска!'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }
    
    try {
      // Автоматично превалутиране при запазване
      const dualPrice = getDualPrice({ amount: formData.price, currency: formData.priceCurrency })
      
      const serviceData = {
        ...formData,
        priceBgn: dualPrice.bgn,
        priceEur: dualPrice.eur
      }
      
      await onSubmit(serviceData)
      setIsSubmitting(false)
    } catch (error) {
      setErrors({ submit: 'Грешка при запазване на услугата!' })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Име на услугата</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Описание</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Продължителност (минути)</label>
        <input
          type="number"
          name="duration"
          value={formData.duration}
                        onChange={(e) => {
                const value = e.target.value;
                const parsedValue = value === '' ? 30 : parseInt(value);
                if (!isNaN(parsedValue)) {
                  setFormData({ ...formData, duration: parsedValue });
                }
              }}
          className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
            errors.duration ? 'border-red-500' : 'border-gray-300'
          }`}
          min="15"
          step="15"
          required
        />
        {errors.duration && (
          <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Цена</label>
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value;
                const parsedValue = value === '' ? 0 : parseFloat(value);
                if (!isNaN(parsedValue)) {
                  setFormData({ ...formData, price: parsedValue });
                }
              }}
              className={`block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          
          <select
            value={formData.priceCurrency}
            onChange={(e) => setFormData({ ...formData, priceCurrency: e.target.value as 'BGN' | 'EUR' })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="BGN">лв.</option>
            <option value="EUR">€</option>
          </select>
        </div>
        
        {/* Показване на двойната цена */}
        {formData.price > 0 && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
            <span className="font-medium">Двойна цена:</span> {formatDualPrice(getDualPrice({ amount: formData.price, currency: formData.priceCurrency }))}
          </div>
        )}
        
        {errors.price && (
          <p className="text-sm text-red-600">{errors.price}</p>
        )}
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          name="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
        <label className="ml-2 block text-sm text-gray-900">Активна услуга</label>
      </div>
      
      {/* Общи грешки */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
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
          {isSubmitting ? 'Запазване...' : (service ? 'Запази' : 'Добави')}
        </button>
      </div>
    </form>
  )
}

export default ServiceForm 