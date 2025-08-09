'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Plus, Edit, Trash2, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface SupportNote {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'improvement' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  created_by: string
}

interface SupportNotesProps {
  onClose: () => void
}

export default function SupportNotes({ onClose }: SupportNotesProps) {
  const [notes, setNotes] = useState<SupportNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNote, setEditingNote] = useState<SupportNote | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'bug' as SupportNote['type'],
    priority: 'medium' as SupportNote['priority']
  })

  useEffect(() => {
    loadSupportNotes()
  }, [])

  // Handle Escape key for closing modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const loadSupportNotes = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/support-notes', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error loading support notes:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const method = editingNote ? 'PUT' : 'POST'
      const url = '/api/admin/support-notes'

      const payload = editingNote
        ? { id: editingNote.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await loadSupportNotes()
        setShowAddModal(false)
        setEditingNote(null)
        setFormData({
          title: '',
          description: '',
          type: 'bug',
          priority: 'medium'
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Грешка при запазване на бележката')
      }
    } catch (error) {
      console.error('Error saving support note:', error)
      alert('Грешка при запазване на бележката')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете тази бележка?')) return
    
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/support-notes?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': adminToken || ''
        }
      })

      if (response.ok) {
        await loadSupportNotes()
      } else {
        alert('Грешка при изтриване на бележката')
      }
    } catch (error) {
      console.error('Error deleting support note:', error)
      alert('Грешка при изтриване на бележката')
    }
  }

  const handleEdit = (note: SupportNote) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      description: note.description,
      type: note.type,
      priority: note.priority
    })
    setShowAddModal(true)
  }

  const handleStatusChange = async (id: string, status: SupportNote['status']) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch(`/api/admin/support-notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id, status })
      })

      if (response.ok) {
        await loadSupportNotes()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getTypeColor = (type: SupportNote['type']) => {
    switch (type) {
      case 'bug': return 'bg-red-100 text-red-800'
      case 'feature': return 'bg-blue-100 text-blue-800'
      case 'improvement': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: SupportNote['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: SupportNote['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeText = (type: SupportNote['type']) => {
    switch (type) {
      case 'bug': return 'Бъг'
      case 'feature': return 'Функция'
      case 'improvement': return 'Подобрение'
      case 'other': return 'Друго'
      default: return type
    }
  }

  const getPriorityText = (priority: SupportNote['priority']) => {
    switch (priority) {
      case 'urgent': return 'Спешно'
      case 'high': return 'Високо'
      case 'medium': return 'Средно'
      case 'low': return 'Ниско'
      default: return priority
    }
  }

  const getStatusText = (status: SupportNote['status']) => {
    switch (status) {
      case 'open': return 'Отворено'
      case 'in_progress': return 'В процес'
      case 'resolved': return 'Решено'
      case 'closed': return 'Затворено'
      default: return status
    }
  }

  const getStatusIcon = (status: SupportNote['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      case 'closed': return <MessageSquare className="w-4 h-4" />
      default: return <MessageSquare className="w-4 h-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Бележки към поддръжката</h2>
              <p className="text-sm text-gray-600">Управление на бъгове и желания</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setEditingNote(null)
                setFormData({
                  title: '',
                  description: '',
                  type: 'bug',
                  priority: 'medium'
                })
                setShowAddModal(true)
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Добави бележка</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Общо бележки</p>
                  <p className="text-2xl font-bold text-gray-900">{notes.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Отворени</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {notes.filter(n => n.status === 'open').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">В процес</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {notes.filter(n => n.status === 'in_progress').length}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Решени</p>
                  <p className="text-2xl font-bold text-green-600">
                    {notes.filter(n => n.status === 'resolved').length}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{note.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(note.type)}`}>
                        {getTypeText(note.type)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(note.priority)}`}>
                        {getPriorityText(note.priority)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{note.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Създадено: {new Date(note.created_at).toLocaleString('bg-BG')}</span>
                      <span>От: {note.created_by}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(note.status)}`}>
                      {getStatusIcon(note.status)}
                      <span className="ml-1">{getStatusText(note.status)}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <select
                      value={note.status}
                      onChange={(e) => handleStatusChange(note.id, e.target.value as SupportNote['status'])}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="open">Отворено</option>
                      <option value="in_progress">В процес</option>
                      <option value="resolved">Решено</option>
                      <option value="closed">Затворено</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(note)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50"
                      title="Редактирай"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                      title="Изтрий"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {notes.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Няма бележки към поддръжката</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingNote ? 'Редактирай бележка' : 'Добави бележка'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Заглавие
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as SupportNote['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bug">Бъг</option>
                        <option value="feature">Функция</option>
                        <option value="improvement">Подобрение</option>
                        <option value="other">Друго</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Приоритет
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as SupportNote['priority'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Ниско</option>
                        <option value="medium">Средно</option>
                        <option value="high">Високо</option>
                        <option value="urgent">Спешно</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false)
                        setEditingNote(null)
                        setFormData({
                          title: '',
                          description: '',
                          type: 'bug',
                          priority: 'medium'
                        })
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Отказ
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{editingNote ? 'Запази' : 'Добави'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 