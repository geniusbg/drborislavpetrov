'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { Calendar, Clock, TrendingUp, Users } from 'lucide-react'

interface AnalyticsData {
  bookingsByPeriod: Array<{
    date: string
    count: string
    confirmed: string
    cancelled: string
    pending: string
  }>
  usersWithMostBookings: Array<{
    name: string
    phone: string
    totalbookings: string
    confirmedbookings: string
    cancelledbookings: string
  }>
  usersWithMostCancelled: Array<{
    name: string
    phone: string
    totalbookings: string
    cancelledbookings: string
  }>
  newUsersByPeriod: Array<{
    date: string
    count: string
  }>
  popularServices: Array<{
    servicename: string
    totalbookings: string
    confirmedbookings: string
    cancelledbookings: string
  }>
  overallStats: {
    totalbookings: string
    confirmedbookings: string
    cancelledbookings: string
    pendingbookings: string
    totalusers: string
    activeservices: string
  }
  recentActivity: Array<{
    date: string
    newbookings: string
    newusers: string
  }>
  period: string
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [error, setError] = useState<string | null>(null)
  
  // WebSocket connection for real-time analytics updates
  // const { socket, isConnected } = useSocket()

  const fetchAnalytics = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        headers: {
          'x-admin-token': localStorage.getItem('adminToken') || ''
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(period)
  }, [period])

  // WebSocket event listeners for real-time analytics updates
  // useEffect(() => {
  //   if (socket && isConnected) {
  //     // Listen for booking changes that affect analytics
  //     socket.on('booking-added', () => {
  //       // Refresh analytics when new booking is added
  //       fetchAnalytics(period)
  //     })

  //     socket.on('booking-updated', () => {
  //       // Refresh analytics when booking status changes
  //       fetchAnalytics(period)
  //     })

  //     socket.on('booking-deleted', () => {
  //       // Refresh analytics when booking is deleted
  //       fetchAnalytics(period)
  //     })

  //     return () => {
  //       socket.off('booking-added')
  //       socket.off('booking-updated')
  //       socket.off('booking-deleted')
  //     }
  //   }
  // }, [socket, isConnected, period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-600 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => fetchAnalytics(period)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const periodLabels = {
    week: 'Седмица',
    month: 'Месец', 
    year: 'Година',
    all: 'Цялото време'
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Аналитика</h1>
          
          {/* Period Selector */}
          <div className="flex gap-2 mb-6">
            {Object.entries(periodLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overall Stats Cards - Beautiful Modern Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Общо резервации</p>
                  <p className="text-3xl font-bold text-white">{data.overallStats.totalbookings}</p>
                  <p className="text-xs text-blue-200 mt-1">Активни записи</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Потвърдени</p>
                  <p className="text-3xl font-bold text-white">{data.overallStats.confirmedbookings}</p>
                  <p className="text-xs text-green-200 mt-1">Одобрени записи</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-100">Чакащи</p>
                  <p className="text-3xl font-bold text-white">{data.overallStats.pendingbookings}</p>
                  <p className="text-xs text-yellow-200 mt-1">В процес</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">Потребители</p>
                  <p className="text-3xl font-bold text-white">{data.overallStats.totalusers}</p>
                  <p className="text-xs text-purple-200 mt-1">Регистрирани</p>
                </div>
                <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bookings by Period Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Резервации по период</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.bookingsByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="confirmed" fill="#10B981" name="Потвърдени" />
                <Bar dataKey="pending" fill="#F59E0B" name="Чакащи" />
                <Bar dataKey="cancelled" fill="#EF4444" name="Отменени" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* New Users Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Нови потребители</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.newUsersByPeriod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name="Нови потребители" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Users with Most Bookings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Потребители с най-много резервации</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.usersWithMostBookings} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalbookings" fill="#3B82F6" name="Общо резервации" />
                <Bar dataKey="confirmedbookings" fill="#10B981" name="Потвърдени" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Users with Most Cancelled Bookings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Потребители с най-много отменени резервации</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.usersWithMostCancelled} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="cancelledbookings" fill="#EF4444" name="Отменени резервации" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Services */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Най-популярни услуги</h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.popularServices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="servicename" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalbookings" fill="#3B82F6" name="Общо резервации" />
                <Bar dataKey="confirmedbookings" fill="#10B981" name="Потвърдени" />
                <Bar dataKey="cancelledbookings" fill="#EF4444" name="Отменени" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Последна активност (последните 7 дни)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.recentActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newbookings" stroke="#3B82F6" strokeWidth={2} name="Нови резервации" />
                <Line type="monotone" dataKey="newusers" stroke="#10B981" strokeWidth={2} name="Нови потребители" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
} 