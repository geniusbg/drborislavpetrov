'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Lock, User, Mail } from 'lucide-react'
import Pagination from '@/components/admin/Pagination'

interface Admin {
  id: number
  username: string
  email?: string
  full_name?: string
  is_active: boolean
  created_at: string
  last_login?: string
  created_by?: number
}

interface AdminsTabProps {
  // No props needed - component manages its own state
}

export default function AdminsTab({}: AdminsTabProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    isActive: true
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/admins', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAdmins(data.admins || [])
      } else {
        setError('Грешка при зареждане на административни потребители')
      }
    } catch (error) {
      console.error('Error loading admins:', error)
      setError('Грешка при зареждане на административни потребители')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingAdmin(null)
    setFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      isActive: true
    })
    setError('')
    setShowModal(true)
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      username: admin.username,
      password: '', // Don't pre-fill password
      email: admin.email || '',
      fullName: admin.full_name || '',
      isActive: admin.is_active
    })
    setError('')
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Сигурни ли сте, че искате да изтриете този административен потребител?')) {
      return
    }

    try {
      setIsDeleting(id)
      const response = await fetch(`/api/admin/admins?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        loadAdmins()
      } else {
        const data = await response.json()
        alert(data.error || 'Грешка при изтриване')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Грешка при изтриване')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username) {
      setError('Потребителското име е задължително')
      return
    }

    if (!editingAdmin && !formData.password) {
      setError('Паролата е задължителна при създаване')
      return
    }

    try {
      setIsSubmitting(true)
      const url = '/api/admin/admins'
      const method = editingAdmin ? 'PUT' : 'POST'
      const body = editingAdmin
        ? {
            id: editingAdmin.id,
            username: formData.username,
            ...(formData.password && { password: formData.password }),
            email: formData.email || null,
            fullName: formData.fullName || null,
            isActive: formData.isActive
          }
        : {
            username: formData.username,
            password: formData.password,
            email: formData.email || null,
            fullName: formData.fullName || null
          }

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        setShowModal(false)
        loadAdmins()
      } else {
        setError(data.error || 'Грешка при запазване')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      setError('Грешка при запазване')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter admins
  const filteredAdmins = admins.filter(admin => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      admin.username.toLowerCase().includes(term) ||
      (admin.email && admin.email.toLowerCase().includes(term)) ||
      (admin.full_name && admin.full_name.toLowerCase().includes(term))
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('bg-BG', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <p className="text-gray-600">Зареждане...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-900">Административни потребители</h2>
            <p className="text-sm text-gray-600 mt-1">
              {searchTerm ? `${filteredAdmins.length} от ${admins.length} потребители` : `${admins.length} потребители`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Търси по име, потребителско име или имейл..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setCurrentPage(1)
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            
            {/* Add Admin Button */}
            <button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Добави администратор</span>
            </button>
          </div>
        </div>
        
        {/* Desktop: Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Потребителско име
                </th>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Име
                </th>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Имейл
                </th>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Последно влизане
                </th>
                <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{admin.username}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                    {admin.full_name || '-'}
                  </td>
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                    {admin.email ? (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{admin.email}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? 'Активен' : 'Деактивиран'}
                    </span>
                  </td>
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                    {admin.last_login ? formatDate(admin.last_login) : 'Никога'}
                  </td>
                  <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Редактирай"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        disabled={isDeleting === admin.id}
                        className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Изтрий"
                      >
                        {isDeleting === admin.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile: Card Layout */}
        <div className="block sm:hidden">
          <div className="space-y-3 p-4">
            {paginatedAdmins.map((admin) => (
              <div key={admin.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{admin.username}</h3>
                    {admin.full_name && (
                      <p className="text-sm text-gray-600">{admin.full_name}</p>
                    )}
                    {admin.email && (
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактирай"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      disabled={isDeleting === admin.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Изтрий"
                    >
                      {isDeleting === admin.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Статус:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      admin.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.is_active ? 'Активен' : 'Деактивиран'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Последно влизане:</span>
                    <span className="font-medium">
                      {admin.last_login ? formatDate(admin.last_login) : 'Никога'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredAdmins.length}
          startIndex={startIndex + 1}
          endIndex={Math.min(endIndex, filteredAdmins.length)}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          label="административни потребители"
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingAdmin ? 'Редактиране на администратор' : 'Добавяне на администратор'}
              </h3>
              
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Потребителско име *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Парола {editingAdmin ? '(оставете празно за да не се променя)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={!editingAdmin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Име
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имейл
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {editingAdmin && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Активен</span>
                    </label>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        <span>Запазване...</span>
                      </>
                    ) : (
                      <span>{editingAdmin ? 'Запази' : 'Създай'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Отказ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

