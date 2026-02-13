'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { useAdminState } from '@/contexts/AdminStateContext'
import { useAdminData } from '@/hooks/useAdminData'
import UserForm from '@/components/admin/UserForm'
import BookingForm from '@/components/admin/BookingForm'
import ServiceForm from '@/components/admin/ServiceForm'
import CaseForm from '@/components/admin/CaseForm'
import UserHistory from '@/components/admin/UserHistory'
import VoiceInterface from '@/components/admin/VoiceInterface'
import VoiceAssistant from '@/components/admin/VoiceAssistant'
import SupportNotes from '@/components/admin/SupportNotes'
import QuickResponseWidget from '@/components/admin/QuickResponseWidget'

export default function AdminModals() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loadBookings, loadUsers, loadServices, loadCases } = useAdminData()
  
  const {
    showUserModal,
    showBookingModal,
    showServiceModal,
    showCaseModal,
    editingUser,
    editingBooking,
    editingService,
    editingCase,
    users,
    bookings,
    showVoiceInterface,
    isVoiceListening,
    showSupportNotes,
    setReopenQuickResponse,
    setIsUserModalClosing,
    setShowUserModal,
    setEditingUser,
    setIsBookingModalClosing,
    setShowBookingModal,
    setEditingBooking,
    setIsServiceModalClosing,
    setShowServiceModal,
    setEditingService,
    setIsCaseModalClosing,
    setShowCaseModal,
    setEditingCase,
    setShowVoiceInterface,
    setIsVoiceListening
  } = useAdminState()

  return (
    <>
      {/* User Modal */}
      {showUserModal && (
        <UserForm
          user={editingUser}
          onSubmit={async (userData) => {
            try {
              const method = editingUser ? 'PUT' : 'POST'
              const response = await fetch('/api/admin/users', {
                method,
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingUser ? { ...userData, id: editingUser.id } : userData)
              })

              if (response.ok) {
                setIsUserModalClosing(true)
                setTimeout(() => {
                  setShowUserModal(false)
                  setIsUserModalClosing(false)
                  setEditingUser(null)
                  loadUsers(true)
                }, 300)
              } else {
                const error = await response.json()
                alert(`Грешка при запазване: ${error.message}`)
              }
            } catch (error) {
              console.error('Error saving user:', error)
              alert('Грешка при запазване на потребителя')
            }
          }}
          onCancel={() => {
            setIsUserModalClosing(true)
            setTimeout(() => {
              setShowUserModal(false)
              setIsUserModalClosing(false)
              setEditingUser(null)
            }, 300)
          }}
        />
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={() => {
          setIsBookingModalClosing(true)
          setTimeout(() => {
            setShowBookingModal(false)
            setIsBookingModalClosing(false)
            setEditingBooking(null)
          }, 300)
        }}>
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl mx-4" 
               onClick={(e) => e.stopPropagation()}
               style={{ 
                 position: 'fixed',
                 top: '10vh', 
                 left: '50%', 
                 transform: 'translateX(-50%)',
                 maxHeight: '80vh',
                 overflowY: 'auto'
               }}>
            <BookingForm
              booking={editingBooking}
              onSubmit={async (bookingData) => {
            try {
              const isNewBooking = !editingBooking?.id
              let response

              if (isNewBooking) {
                // Create new booking
                response = await fetch('/api/admin/bookings', {
                  method: 'POST',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(bookingData)
                })
              } else {
                // Update existing booking
                response = await fetch('/api/admin/bookings', {
                  method: 'PUT',
                  credentials: 'include',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ ...bookingData, id: editingBooking?.id })
                })
              }
              
              if (response.ok) {
                await loadBookings()
                setIsBookingModalClosing(true)
                setTimeout(() => {
                  setShowBookingModal(false)
                  setIsBookingModalClosing(false)
                  setEditingBooking(null)
                }, 300)
              } else {
                const error = await response.json()
                alert(`Грешка при запазване: ${error.message}`)
              }
            } catch (error) {
              console.error('Error saving booking:', error)
              alert('Грешка при запазване на резервацията')
            }
          }}
          onCancel={() => {
            setIsBookingModalClosing(true)
            setTimeout(() => {
              setShowBookingModal(false)
              setIsBookingModalClosing(false)
              setEditingBooking(null)
            }, 300)
          }}
            />
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={() => {
              setIsServiceModalClosing(true)
              setTimeout(() => {
                setShowServiceModal(false)
                setIsServiceModalClosing(false)
                setEditingService(null)
              }, 300)
            }}
          />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 rounded-t-xl z-10">
              <h2 id="service-modal-title" className="text-lg font-semibold text-gray-900">
                {editingService ? 'Редактиране на услуга' : 'Добавяне на услуга'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsServiceModalClosing(true)
                  setTimeout(() => {
                    setShowServiceModal(false)
                    setIsServiceModalClosing(false)
                    setEditingService(null)
                  }, 300)
                }}
                className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ServiceForm
                service={editingService}
                onSubmit={async (serviceData) => {
                  try {
                    const method = editingService ? 'PUT' : 'POST'
                    const response = await fetch('/api/admin/services', {
                      method,
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(editingService ? { ...serviceData, id: editingService.id } : serviceData)
                    })
                    if (response.ok) {
                      await loadServices(true)
                      setIsServiceModalClosing(true)
                      setTimeout(() => {
                        setShowServiceModal(false)
                        setIsServiceModalClosing(false)
                        setEditingService(null)
                      }, 300)
                    } else {
                      const error = await response.json()
                      alert(`Грешка при запазване: ${error.message}`)
                    }
                  } catch (error) {
                    console.error('Error saving service:', error)
                    alert('Грешка при запазване на услугата')
                  }
                }}
                onCancel={() => {
                  setIsServiceModalClosing(true)
                  setTimeout(() => {
                    setShowServiceModal(false)
                    setIsServiceModalClosing(false)
                    setEditingService(null)
                  }, 300)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Case Modal */}
      {showCaseModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            aria-hidden="true"
            onClick={() => {
              setIsCaseModalClosing(true)
              setTimeout(() => {
                setShowCaseModal(false)
                setIsCaseModalClosing(false)
                setEditingCase(null)
              }, 300)
            }}
          />
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 rounded-t-xl z-10">
              <h2 id="case-modal-title" className="text-lg font-semibold text-gray-900">
                {editingCase ? 'Редактиране на случай' : 'Добавяне на случай'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCaseModalClosing(true)
                  setTimeout(() => {
                    setShowCaseModal(false)
                    setIsCaseModalClosing(false)
                    setEditingCase(null)
                  }, 300)
                }}
                className="flex-shrink-0 p-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <CaseForm
                caseItem={editingCase}
                onSubmit={async (data) => {
                  try {
                    const hasMainFile = 'main_image_file' in data && data.main_image_file
                    const gallery = data.gallery ?? []
                    const hasGalleryFiles = gallery.some((g: { file?: File }) => g?.file)
                    const useFormData = hasMainFile || hasGalleryFiles
                    const method = editingCase ? 'PUT' : 'POST'
                    let response: Response
                    if (useFormData) {
                      const form = new FormData()
                      form.set('title', data.title ?? '')
                      form.set('short_description', data.short_description ?? '')
                      form.set('body', data.body ?? '')
                      form.set('order_index', String(data.order_index ?? 0))
                      form.set('show_on_homepage', data.show_on_homepage ? 'true' : 'false')
                      form.set('homepage_order', String(data.homepage_order ?? 0))
                      if (editingCase) form.set('id', String(editingCase.id))
                      if (data.main_image_file) form.set('main_image', data.main_image_file)
                      const galleryPayload = gallery.map((g: { path: string | null; caption: string }) => ({ path: g.path ?? null, caption: g.caption ?? '' }))
                      form.set('gallery', JSON.stringify(galleryPayload))
                      gallery.forEach((g: { file?: File }, i: number) => {
                        if (g?.file) form.set(`gallery_${i}_file`, g.file)
                      })
                      response = await fetch('/api/admin/cases', {
                        method,
                        credentials: 'include',
                        body: form,
                      })
                    } else {
                      const payload: Record<string, unknown> = {
                        title: data.title,
                        short_description: data.short_description,
                        body: data.body,
                        order_index: data.order_index,
                        show_on_homepage: data.show_on_homepage,
                        homepage_order: data.homepage_order,
                      }
                      if (editingCase) payload.id = editingCase.id
                      if (gallery.length) payload.gallery = gallery.map((g: { path: string | null; caption: string }) => ({ path: g.path ?? null, caption: g.caption ?? '' }))
                      response = await fetch('/api/admin/cases', {
                        method,
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      })
                    }
                    if (response.ok) {
                      await loadCases()
                      setIsCaseModalClosing(true)
                      setTimeout(() => {
                        setShowCaseModal(false)
                        setIsCaseModalClosing(false)
                        setEditingCase(null)
                      }, 300)
                    } else {
                      const err = await response.json().catch(() => ({}))
                      alert(`Грешка при запазване: ${err?.error || 'Неизвестна грешка'}`)
                    }
                  } catch (error) {
                    console.error('Error saving case:', error)
                    alert('Грешка при запазване на случая')
                  }
                }}
                onCancel={() => {
                  setIsCaseModalClosing(true)
                  setTimeout(() => {
                    setShowCaseModal(false)
                    setIsCaseModalClosing(false)
                    setEditingCase(null)
                  }, 300)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User History Modal */}
      {searchParams?.get('modal') === 'userHistory' && searchParams?.get('userId') && (
        <UserHistory
          user={users.find(u => u.id === parseInt(searchParams.get('userId')!))!}
          bookings={bookings.filter(b => b.userId === parseInt(searchParams.get('userId')!))}
          onClose={() => {
            const params = new URLSearchParams(searchParams?.toString?.() || '')
            params.delete('modal')
            params.delete('userId')
            router.push(`/admin?${params.toString()}`, { scroll: false })
          }}
          onUpdateTreatmentNotes={async (bookingId, notes) => {
            // Handle treatment notes update
            console.log('Update treatment notes:', bookingId, notes)
            await loadBookings()
          }}
          onEditBooking={(booking) => {
            setEditingBooking(booking)
            setShowBookingModal(true)
          }}
          onDeleteBooking={(bookingId) => {
            // Handle booking deletion
            console.log('Delete booking:', bookingId)
          }}
          onRefreshBookings={() => loadBookings(true)}
        />
      )}

      {/* Voice Interface */}
      {showVoiceInterface && (
        <VoiceInterface
          onCommand={(command) => {
            console.log('Voice command received:', command)
            // Handle voice commands here
          }}
          onClose={() => setShowVoiceInterface(false)}
        />
      )}

      {/* Voice Assistant */}
      {isVoiceListening && (
        <VoiceAssistant
          onCommand={(command) => {
            console.log('Voice result:', command)
            setIsVoiceListening(false)
          }}
          isListening={isVoiceListening}
          setIsListening={setIsVoiceListening}
          onClose={() => setIsVoiceListening(false)}
        />
      )}

      {/* Support Notes */}
      {showSupportNotes && (
        <SupportNotes
          onClose={() => {
            // Handle support notes close
          }}
        />
      )}

      {/* Quick Response Widget */}
      <QuickResponseWidget
        onCreateBooking={() => {
          loadBookings()
          // Flag to re-open Quick Response after the booking modal is closed
          setReopenQuickResponse(true)
        }}
      />
    </>
  )
}
