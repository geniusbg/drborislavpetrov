'use client'

import { useState, useEffect } from 'react'
import { Bug, User, Tag, Filter, Plus, Edit, Trash2 } from 'lucide-react'
import type { BugReport } from '@/types/global'

interface BugTrackerProps {
  onClose: () => void
}

const BugTracker = ({ onClose }: BugTrackerProps) => {
  const [bugs, setBugs] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showBugForm, setShowBugForm] = useState(false)
  const [editingBug, setEditingBug] = useState<BugReport | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterSeverity, setFilterSeverity] = useState<string>('')
  
  // Drag state for main modal
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })

  const loadBugs = async () => {
    try {
      setLoading(true)
      const adminToken = localStorage.getItem('adminToken')
      const params = new URLSearchParams()
      
      if (filterStatus) params.append('status', filterStatus)
      if (filterCategory) params.append('category', filterCategory)
      if (filterSeverity) params.append('severity', filterSeverity)
      
      const response = await fetch(`/api/admin/bugs?${params.toString()}`, {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBugs(data.bugs)
      }
    } catch (error) {
      console.error('Error loading bugs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBugs()
  }, [filterStatus, filterCategory, filterSeverity])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }



  const handleDeleteBug = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този bug report?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/bugs?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        loadBugs()
      }
    } catch (error) {
      console.error('Error deleting bug:', error)
    }
  }



  const filteredBugs = bugs.filter(bug => {
    if (filterStatus && bug.status !== filterStatus) return false
    if (filterCategory && bug.category !== filterCategory) return false
    if (filterSeverity && bug.severity !== filterSeverity) return false
    return true
  })

  // Handle Escape key for closing modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showBugForm) {
          setShowBugForm(false)
          setEditingBug(null)
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showBugForm, onClose])

  // Drag functions for main modal
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[85vh] overflow-y-auto cursor-move" 
        style={{ 
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between mb-6" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center space-x-3">
            <Bug className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Bug Tracker</h2>
              <p className="text-gray-600">Управление на bug reports</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBugForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Нов Bug Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Затвори
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Филтри:</span>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">Всички статуси</option>
              <option value="open">Отворени</option>
              <option value="in-progress">В процес</option>
              <option value="resolved">Решени</option>
              <option value="closed">Затворени</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">Всички категории</option>
              <option value="ui">UI</option>
              <option value="functionality">Функционалност</option>
              <option value="performance">Производителност</option>
              <option value="security">Сигурност</option>
              <option value="database">База данни</option>
            </select>

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="">Всички нива</option>
              <option value="critical">Критично</option>
              <option value="high">Високо</option>
              <option value="medium">Средно</option>
              <option value="low">Ниско</option>
            </select>
          </div>
        </div>

        {/* Bug List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Зареждане...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBugs.length > 0 ? (
              filteredBugs.map((bug) => (
                <div
                  key={bug.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{bug.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(bug.severity)}`}>
                          {bug.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bug.status)}`}>
                          {bug.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{bug.description}</p>
                      
                      {bug.resolution && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                          <h4 className="text-sm font-medium text-green-800 mb-1">Резолюция:</h4>
                          <p className="text-sm text-green-700">{bug.resolution}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{bug.reporter}</span>
                        </div>
                        {bug.assignedTo && (
                          <div className="flex items-center space-x-1">
                            <span>→</span>
                            <span>{bug.assignedTo}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{bug.category}</span>
                        </div>
                        {bug.tags && bug.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span>🏷️</span>
                            <span>{bug.tags.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingBug(bug)
                          setShowBugForm(true)
                        }}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                        title="Редактирай"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBug(bug.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                        title="Изтрий"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Bug className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Няма bug reports</h3>
                <p className="text-gray-600">Всички bug reports са решени или няма създадени такива.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bug Form Modal */}
      {showBugForm && (
                 <BugForm
           bug={editingBug}
           onSubmit={async () => {
             // TODO: Implement bug form submission
             setShowBugForm(false)
             setEditingBug(null)
             loadBugs()
           }}
          onCancel={() => {
            setShowBugForm(false)
            setEditingBug(null)
          }}
        />
      )}
    </div>
  )
}

// Placeholder BugForm component
const BugForm = ({ bug, onSubmit, onCancel }: { bug: BugReport | null; onSubmit: () => void; onCancel: () => void }) => {
  // Drag state for bug form modal
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 })

  const [formData, setFormData] = useState({
    title: bug?.title || '',
    description: bug?.description || '',
    severity: (bug?.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
    category: (bug?.category as 'ui' | 'functionality' | 'performance' | 'security' | 'database') || 'functionality',
    priority: (bug?.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
    reporter: bug?.reporter || 'Admin',
    stepsToReproduce: bug?.stepsToReproduce || [''],
    expectedBehavior: bug?.expectedBehavior || '',
    actualBehavior: bug?.actualBehavior || '',
    browser: bug?.browser || '',
    device: bug?.device || '',
    tags: bug?.tags || [],
    resolution: bug?.resolution || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const method = bug ? 'PUT' : 'POST'
      const url = bug ? `/api/admin/bugs` : `/api/admin/bugs`
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(bug ? { ...formData, id: bug.id } : formData)
      })
      
      if (response.ok) {
        onSubmit()
      } else {
        alert('Грешка при запазване на bug report')
      }
    } catch (error) {
      console.error('Error saving bug report:', error)
      alert('Грешка при запазване на bug report')
    }
  }

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      stepsToReproduce: [...prev.stepsToReproduce, '']
    }))
  }

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.filter((_, i) => i !== index)
    }))
  }

  const updateStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      stepsToReproduce: prev.stepsToReproduce.map((step, i) => i === index ? value : step)
    }))
  }

  // Drag functions for bug form modal
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - modalPosition.x,
        y: e.clientY - modalPosition.y
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto cursor-move" 
        style={{ 
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${modalPosition.x}px, ${modalPosition.y}px)`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4" onMouseDown={(e) => e.stopPropagation()}>
          {bug ? 'Редактирай Bug Report' : 'Нов Bug Report'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4" onMouseDown={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Заглавие *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Кратко описание на проблема"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Категория *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as 'ui' | 'functionality' | 'performance' | 'security' | 'database' }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="ui">UI</option>
                <option value="functionality">Функционалност</option>
                <option value="performance">Производителност</option>
                <option value="security">Сигурност</option>
                <option value="database">База данни</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тежест *
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="low">Ниско</option>
                <option value="medium">Средно</option>
                <option value="high">Високо</option>
                <option value="critical">Критично</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="low">Ниско</option>
                <option value="medium">Средно</option>
                <option value="high">Високо</option>
                <option value="urgent">Спешно</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Подробно описание на проблема"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Резолюция
            </label>
            <textarea
              rows={3}
              value={formData.resolution}
              onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Описание на решението на проблема (запълнете когато проблемът е решен)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Очаквано поведение
              </label>
              <textarea
                rows={2}
                value={formData.expectedBehavior}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedBehavior: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Какво трябваше да се случи"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Реално поведение
              </label>
              <textarea
                rows={2}
                value={formData.actualBehavior}
                onChange={(e) => setFormData(prev => ({ ...prev, actualBehavior: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Какво се случи всъщност"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Стъпки за възпроизвеждане
            </label>
            {formData.stepsToReproduce.map((step, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  placeholder={`Стъпка ${index + 1}`}
                />
                {formData.stepsToReproduce.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="px-2 py-2 text-red-600 hover:text-red-900"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addStep}
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              + Добави стъпка
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Браузър
              </label>
              <input
                type="text"
                value={formData.browser}
                onChange={(e) => setFormData(prev => ({ ...prev, browser: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Chrome, Firefox, Safari..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Устройство
              </label>
              <input
                type="text"
                value={formData.device}
                onChange={(e) => setFormData(prev => ({ ...prev, device: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                placeholder="Desktop, Mobile, Tablet..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Отказ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {bug ? 'Обнови' : 'Създай'} Bug Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BugTracker 