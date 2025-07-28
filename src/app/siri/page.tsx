'use client'

import { useState } from 'react'
import { Copy, Download, Smartphone, Mic, Calendar, Users, CheckCircle, XCircle } from 'lucide-react'

const SiriShortcutsPage = () => {
  const [copied, setCopied] = useState<string | null>(null)

  const shortcuts = [
    {
      id: 'create_booking',
      name: 'Създай резервация',
      description: 'Създава нова резервация за пациент',
      icon: Calendar,
      color: 'bg-blue-500',
      url: 'http://localhost:3000/api/siri/create-booking'
    },
    {
      id: 'confirm_booking',
      name: 'Потвърди резервация',
      description: 'Потвърждава чакаща резервация',
      icon: CheckCircle,
      color: 'bg-green-500',
      url: 'http://localhost:3000/api/siri/confirm-booking'
    },
    {
      id: 'cancel_booking',
      name: 'Отмени резервация',
      description: 'Отменя резервация',
      icon: XCircle,
      color: 'bg-red-500',
      url: 'http://localhost:3000/api/siri/cancel-booking'
    },
    {
      id: 'get_bookings',
      name: 'Провери резервации',
      description: 'Показва чакащи резервации',
      icon: Users,
      color: 'bg-purple-500',
      url: 'http://localhost:3000/api/siri/get-bookings'
    },
    {
      id: 'create_user',
      name: 'Създай потребител',
      description: 'Създава нов потребител',
      icon: Users,
      color: 'bg-indigo-500',
      url: 'http://localhost:3000/api/siri/create-user'
    },
    {
      id: 'update_user',
      name: 'Редактирай потребител',
      description: 'Редактира съществуващ потребител',
      icon: Users,
      color: 'bg-yellow-500',
      url: 'http://localhost:3000/api/siri/update-user'
    },
    {
      id: 'delete_user',
      name: 'Изтрий потребител',
      description: 'Изтрива потребител',
      icon: Users,
      color: 'bg-red-600',
      url: 'http://localhost:3000/api/siri/delete-user'
    }
  ]

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Smartphone className="w-12 h-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900">Siri Shortcuts</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Интегрирайте вашата зъболекарска практика с Siri за бързо управление на резервациите
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Как да настроите Siri Shortcuts:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Отворете Shortcuts приложението</h3>
                  <p className="text-gray-600">Намерете Shortcuts приложението на вашия iPhone</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Създайте нов Shortcut</h3>
                  <p className="text-gray-600">Натиснете "+" за да създадете нов Shortcut</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Добавете "Get Contents of URL"</h3>
                  <p className="text-gray-600">Търсете и добавете действието "Get Contents of URL"</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Въведете URL адреса</h3>
                  <p className="text-gray-600">Копирайте URL адреса от долу и го въведете</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">5</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Настройте метода на POST</h3>
                  <p className="text-gray-600">Променете метода на "POST" и добавете JSON данни</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold">6</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Добавете към Siri</h3>
                  <p className="text-gray-600">Натиснете "Add to Siri" и задайте гласова команда</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="grid md:grid-cols-2 gap-6">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon
            return (
              <div key={shortcut.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${shortcut.color} rounded-lg flex items-center justify-center mr-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shortcut.name}</h3>
                    <p className="text-gray-600">{shortcut.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL адрес:
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={shortcut.url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(shortcut.url, shortcut.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 flex items-center"
                      >
                        {copied === shortcut.id ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      JSON данни:
                    </label>
                    <div className="flex">
                      <textarea
                        value={JSON.stringify({
                          action: shortcut.id,
                          data: shortcut.id === 'create_booking' ? {
                            patientName: "Иван Иванов",
                            date: "2025-08-24",
                            time: "10:00",
                            service: 1,
                            phone: "+359888123456",
                            email: "ivan.ivanov@gmail.com"
                          } : shortcut.id === 'confirm_booking' || shortcut.id === 'cancel_booking' ? {
                            bookingId: 1
                          } : shortcut.id === 'create_user' ? {
                            patientName: "Петър Петров",
                            phone: "+359888123456",
                            email: "petar.petrov@gmail.com"
                          } : shortcut.id === 'update_user' ? {
                            userId: 1,
                            patientName: "Петър Петров",
                            phone: "+359888123456",
                            email: "petar.petrov@gmail.com"
                          } : shortcut.id === 'delete_user' ? {
                            userId: 1
                          } : {}
                        }, null, 2)}
                        readOnly
                        rows={4}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-xs font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(JSON.stringify({
                          action: shortcut.id,
                          data: shortcut.id === 'create_booking' ? {
                            patientName: "Иван Иванов",
                            date: "2025-08-24",
                            time: "10:00",
                            service: 1,
                            phone: "+359888123456",
                            email: "ivan.ivanov@gmail.com"
                          } : shortcut.id === 'confirm_booking' || shortcut.id === 'cancel_booking' ? {
                            bookingId: 1
                          } : shortcut.id === 'create_user' ? {
                            patientName: "Петър Петров",
                            phone: "+359888123456",
                            email: "petar.petrov@gmail.com"
                          } : shortcut.id === 'update_user' ? {
                            userId: 1,
                            patientName: "Петър Петров",
                            phone: "+359888123456",
                            email: "petar.petrov@gmail.com"
                          } : shortcut.id === 'delete_user' ? {
                            userId: 1
                          } : {}
                        }, null, 2), `${shortcut.id}-json`)}
                        className="px-3 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 flex items-center"
                      >
                        {copied === `${shortcut.id}-json` ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Example Commands */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Примерни Siri команди:</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">За създаване на резервация:</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">"Хей Siri, създай резервация"</p>
                <p className="text-sm text-gray-600">"Хей Siri, резервирай час"</p>
                <p className="text-sm text-gray-600">"Хей Siri, нов пациент"</p>
                <p className="text-sm text-gray-600">"Хей Siri, резервирай за Иван телефон 0888123456"</p>
                <p className="text-sm text-gray-600">"Хей Siri, резервирай за Петър 0888765432 petar@gmail.com"</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">За управление на резервации:</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">"Хей Siri, потвърди резервация"</p>
                <p className="text-sm text-gray-600">"Хей Siri, отмени час"</p>
                <p className="text-sm text-gray-600">"Хей Siri, провери резервации"</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-3">За управление на потребители:</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">"Хей Siri, създай потребител"</p>
                <p className="text-sm text-gray-600">"Хей Siri, редактирай потребител"</p>
                <p className="text-sm text-gray-600">"Хей Siri, изтрий потребител"</p>
                <p className="text-sm text-gray-600">"Хей Siri, добави потребител Петър 0888765432 petar@gmail.com"</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SiriShortcutsPage 