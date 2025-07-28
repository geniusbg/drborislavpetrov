'use client'

import { useState } from 'react'
import { Calendar, Clock, User, Phone, Mail, FileText, Edit, X } from 'lucide-react'

interface Booking {
  id: string
  name: string
  phone: string
  service: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'cancelled'
  treatment_notes?: string
  message?: string
  createdAt: string
  serviceName?: string
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

interface UserHistoryProps {
  user: User
  bookings: Booking[]
  onClose: () => void
  onUpdateTreatmentNotes: (bookingId: string, notes: string) => Promise<void>
  onEditBooking?: (booking: Booking) => void
}

const UserHistory = ({ user, bookings, onClose, onUpdateTreatmentNotes, onEditBooking }: UserHistoryProps) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  const userBookings = bookings.filter(booking => booking.phone === user.phone)

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>История на резервациите ({userBookings.length})</span>
            </h3>
            
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
                    </div>
                    
                    <div className="mb-3">
                      <span className="font-medium">Услуга:</span> {booking.serviceName || `Услуга ${booking.service}`}
                    </div>

                    <div className="mb-3">
                      <span className="font-medium">Статус:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="mb-3 text-sm text-gray-600">
                      <span className="font-medium">Създадена на:</span> {new Date(booking.createdAt).toLocaleDateString('bg-BG')} в {new Date(booking.createdAt).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
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