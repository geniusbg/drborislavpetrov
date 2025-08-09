/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Phone, Mail, FileText, Edit, X, Trash2, Plus } from 'lucide-react'
import type { Booking, User as UserType } from '@/types/global'
import { formatBulgariaDate, formatBulgariaTime } from '@/lib/bulgaria-time'

interface UserHistoryProps {
  user: UserType
  bookings: Booking[]
  onClose: () => void
  onUpdateTreatmentNotes: (bookingId: string, notes: string) => Promise<void>
  onEditBooking?: (booking: Booking) => void
  onDeleteBooking?: (bookingId: string) => void
  onCreateBooking?: (user: UserType) => void
}

const UserHistory = ({ user, bookings, onClose, onUpdateTreatmentNotes, onEditBooking, onDeleteBooking, onCreateBooking }: UserHistoryProps) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  // Normalize phone numbers for comparison (BG): compare by last 9 digits
  const normalizePhone = (phone: string | undefined) => {
    if (!phone) return ''
    const digitsOnly = phone.replace(/\D/g, '')
    // Take last 9 digits for Bulgarian numbers
    return digitsOnly.slice(-9)
  }
  
  const userBookings = bookings.filter(booking => {
    const userPhone9 = normalizePhone(user.phone)
    const bookingPhone9 = normalizePhone(booking.phone)
    // Match by phone only if BOTH phones are present
    if (userPhone9 && bookingPhone9) {
      return userPhone9 === bookingPhone9
    }
    // Next fallback: match by userId if API provided it
    const bUserId = (booking as unknown as { userId?: string | number }).userId
    if (user.id && bUserId) {
      return String(user.id) === String(bUserId)
    }
    // Fallback: match by email if available
    const userEmail = (user.email || '').toLowerCase()
    const bookingEmail = (((booking as unknown as { userEmail?: string; email?: string }).userEmail) || (booking as unknown as { email?: string }).email || '').toLowerCase()
    if (userEmail && bookingEmail) {
      return userEmail === bookingEmail
    }
    // Last resort: if both phone and email are empty on both sides, compare normalized names (case/space-insensitive)
    const userHasNoContacts = !userPhone9 && !userEmail
    const bookingHasNoContacts = !bookingPhone9 && !bookingEmail
    if (userHasNoContacts && bookingHasNoContacts) {
      const normalizeNameText = (n: string | undefined) => (n || '').trim().replace(/\s+/g, ' ').toLowerCase()
      return normalizeNameText(user.name) === normalizeNameText((booking as unknown as { name?: string }).name)
    }
    return false
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Потвърдена'
      case 'pending':
        return 'Чакаща'
      case 'cancelled':
        return 'Отменена'
      default:
        return status
    }
  }

  const getServiceDisplayName = (booking: Booking) => {
    if (booking.servicename) {
      return booking.servicename
    }
    if (booking.serviceName) {
      return booking.serviceName
    }
    // Fallback to service ID if no name is available
    return `Услуга ${booking.service}`
  }

  const handleEditNotes = (booking: Booking) => {
    setEditingNotes(booking.id)
    setNotesText(booking.treatment_notes || '')
  }

  const handleSaveNotes = async () => {
    if (editingNotes && notesText.trim()) {
      await onUpdateTreatmentNotes(editingNotes, notesText)
      setEditingNotes(null)
      setNotesText('')
    }
  }

  const handleCancelEdit = () => {
    setEditingNotes(null)
    setNotesText('')
  }

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

  const handleDeleteBooking = (bookingId: string) => {
    if (confirm('Сигурни ли сте, че искате да изтриете тази резервация? Това действие не може да бъде отменено.')) {
      onDeleteBooking?.(bookingId)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
                {user.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Информация за потребителя</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Име:</span> {user.name}
              </div>
              <div>
                <span className="font-medium">Телефон:</span> {user.phone}
              </div>
              {user.email && (
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
              )}
              {user.address && (
                <div>
                  <span className="font-medium">Адрес:</span> {user.address}
                </div>
              )}
              {user.notes && (
                <div>
                  <span className="font-medium">Бележки:</span> {user.notes}
                </div>
              )}
            </div>
          </div>

          {/* Bookings History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>История на резервациите ({userBookings.length})</span>
              </h3>
              {onCreateBooking && (
                <button
                  onClick={() => onCreateBooking(user)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Нова резервация
                </button>
              )}
            </div>
            
            {userBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Няма резервации за този потребител
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{booking.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{booking.time}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {onEditBooking && (
                          <button
                            onClick={() => onEditBooking(booking)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-blue-50"
                            title="Редактирай резервацията"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Редактирай</span>
                          </button>
                        )}
                        {onDeleteBooking && (
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-red-50"
                            title="Изтрий резервацията"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Изтрий</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="font-medium">Услуга:</span> {getServiceDisplayName(booking)}
                    </div>

                    <div className="mb-3">
                      <span className="font-medium">Статус:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-medium">Създадена на:</span> 
                      {booking.createdAt ? (
                        <>
                          {formatBulgariaDate(new Date(booking.createdAt))} в {formatBulgariaTime(new Date(booking.createdAt), { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        'Няма информация за датата на създаване'
                      )}
                    </div>

                    {booking.message && (
                      <div className="mb-3">
                        <span className="font-medium">Съобщение:</span>
                        <p className="text-gray-700 mt-1 italic">"{booking.message}"</p>
                      </div>
                    )}

                    {/* Treatment Notes */}
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center space-x-2">
                          <FileText className="w-4 h-4" />
                          <span>Бележки за лечението</span>
                        </h4>
                        {editingNotes !== booking.id && (
                          <button
                            onClick={() => handleEditNotes(booking)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Редактирай</span>
                          </button>
                        )}
                      </div>
                      
                      {editingNotes === booking.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            className="w-full p-2 border rounded-md resize-none"
                            rows={3}
                            placeholder="Въведете бележки за лечението..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveNotes}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                              Запази
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
                            >
                              Отмени
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-700">
                          {booking.treatment_notes ? (
                            <p className="whitespace-pre-wrap">{booking.treatment_notes}</p>
                          ) : (
                            <p className="text-gray-500 italic">Няма бележки за лечението</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserHistory 