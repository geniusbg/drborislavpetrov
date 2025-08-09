'use client'

import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import type { Break, WorkingHours } from '@/types/global'
// import { getBulgariaTime } from '@/lib/bulgaria-time'

interface WorkingHoursFormProps {
  selectedDate: string
  onSave: (workingHours: WorkingHours) => void
  onCancel: () => void
  onDelete?: () => void
  initialData?: WorkingHours
}

const WorkingHoursForm = ({ selectedDate, onSave, onCancel, onDelete, initialData }: WorkingHoursFormProps) => {
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<WorkingHours>({
    date: selectedDate,
    isWorkingDay: true,
    startTime: '09:00',
    endTime: '18:00',
    notes: '',
    breaks: [{ startTime: '12:00', endTime: '13:00', description: 'Почивка' }]
  })

  // Проверяваме дали избраната дата е неделя
  const isSunday = (dateString: string) => {
    // Създаваме дата в българско време
    const [year, month, day] = dateString.split('-').map(Number)
    const bulgariaDate = new Date(year, month - 1, day) // month - 1 защото getMonth() връща 0-11
    return bulgariaDate.getDay() === 0 // 0 = Sunday
  }

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: selectedDate,
        isWorkingDay: initialData.isWorkingDay ?? true,
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '18:00',
        notes: initialData.notes || '',
        breaks: initialData.breaks && initialData.breaks.length > 0 
          ? initialData.breaks 
          : [{ startTime: '12:00', endTime: '13:00', description: 'Почивка' }]
      })
    } else {
      // Reset to defaults when no initial data
      // По подразбиране неделя е неработен ден
      const defaultIsWorkingDay = !isSunday(selectedDate)
      setFormData({
        date: selectedDate,
        isWorkingDay: defaultIsWorkingDay,
        startTime: '09:00',
        endTime: '18:00',
        notes: '',
        breaks: [{ startTime: '12:00', endTime: '13:00', description: 'Почивка' }]
      })
    }
  }, [initialData, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving working hours:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const addBreak = () => {
    setFormData(prev => ({
      ...prev,
      breaks: [...prev.breaks, { startTime: '12:00', endTime: '13:00', description: 'Почивка' }]
    }))
  }

  const removeBreak = (index: number) => {
    setFormData(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }))
  }

  const updateBreak = (index: number, field: keyof Break, value: string) => {
    setFormData(prev => ({
      ...prev,
      breaks: prev.breaks.map((breakItem, i) => 
        i === index ? { ...breakItem, [field]: value } : breakItem
      )
    }))
  }

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Работно време за {new Date(selectedDate).toLocaleDateString('bg-BG')}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSunday(selectedDate) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-800">
                  Неделя - по подразбиране неработен ден
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isWorkingDay"
              name="isWorkingDay"
              checked={formData.isWorkingDay}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isWorkingDay" className="text-sm font-medium text-gray-700">
              Работен ден
            </label>
          </div>

          {formData.isWorkingDay && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Начало
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    step="1800"
                    data-format="24h"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Край
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    step="1800"
                    data-format="24h"
                  />
                </div>
              </div>

              {/* Breaks Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Почивки
                  </label>
                  <button
                    type="button"
                    onClick={addBreak}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    + Добави почивка
                  </button>
                </div>
                
                {formData.breaks.map((breakItem, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Почивка {index + 1}
                      </span>
                      {formData.breaks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBreak(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Премахни
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">От</label>
                        <input
                          type="time"
                          value={breakItem.startTime}
                          onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          step="1800"
                          data-format="24h"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">До</label>
                        <input
                          type="time"
                          value={breakItem.endTime}
                          onChange={(e) => updateBreak(index, 'endTime', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          step="1800"
                          data-format="24h"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Описание</label>
                        <input
                          type="text"
                          value={breakItem.description}
                          onChange={(e) => updateBreak(index, 'description', e.target.value)}
                          placeholder="Почивка"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Бележки
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Например: В отпуск, Почивка, Специални часове..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
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
            className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 flex items-center space-x-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Запазване...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Запази</span>
              </>
            )}
          </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WorkingHoursForm 