import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'
import { getBulgariaDateStringDB } from '@/lib/bulgaria-time'

export async function GET(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')

    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    const db = await getDatabase()

    // Get current date and calculate date ranges
    const now = new Date()
    const currentDate = getBulgariaDateStringDB()
    
    let startDate: string
    let endDate: string

    switch (period) {
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = new Date(weekStart.toLocaleString('en-US', { timeZone: 'Europe/Sofia' })).toISOString().split('T')[0]
        endDate = currentDate
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate = new Date(monthStart.toLocaleString('en-US', { timeZone: 'Europe/Sofia' })).toISOString().split('T')[0]
        endDate = currentDate
        break
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        startDate = new Date(yearStart.toLocaleString('en-US', { timeZone: 'Europe/Sofia' })).toISOString().split('T')[0]
        endDate = currentDate
        break
      default:
        startDate = currentDate
        endDate = currentDate
    }

    // Get bookings for the period
    const bookingsResult = await db.query(`
      SELECT b.*, s.name as serviceName, s.duration as serviceDuration, u.name as userName
      FROM bookings b
      LEFT JOIN services s ON b.service = s.name
      LEFT JOIN users u ON b.phone = u.phone
      WHERE b.date >= $1 AND b.date <= $2
      ORDER BY b.date, b.time
    `, [startDate, endDate])

    const bookings = bookingsResult.rows

    // Get users for the period
    const usersResult = await db.query(`
      SELECT * FROM users 
      WHERE createdat::date >= $1 AND createdat::date <= $2
      ORDER BY createdat DESC
    `, [startDate, endDate])

    const users = usersResult.rows

    // Calculate analytics
    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length

    // Get most popular service
    const serviceCounts: { [key: string]: number } = {}
    bookings.forEach(booking => {
      const serviceName = booking.serviceName || 'Unknown'
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1
    })
    
    // Get user with most bookings
    const userBookingCounts: { [key: string]: number } = {}
    bookings.forEach(booking => {
      const userName = booking.userName || booking.name
      userBookingCounts[userName] = (userBookingCounts[userName] || 0) + 1
    })
    
    // Get user with most cancelled bookings
    const cancelledBookingsByUser: { [key: string]: number } = {}
    bookings.filter(b => b.status === 'cancelled').forEach(booking => {
      const userName = booking.userName || booking.name
      cancelledBookingsByUser[userName] = (cancelledBookingsByUser[userName] || 0) + 1
    })

    // Group bookings by date for charts
    const bookingsByDate: { [key: string]: number } = {}
    bookings.forEach(booking => {
      const date = booking.date
      bookingsByDate[date] = (bookingsByDate[date] || 0) + 1
    })

    // Group bookings by week for weekly chart
    const bookingsByWeek: { [key: string]: number } = {}
    bookings.forEach(booking => {
      const date = new Date(booking.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]
      bookingsByWeek[weekKey] = (bookingsByWeek[weekKey] || 0) + 1
    })

    // Group bookings by month for monthly chart
    const bookingsByMonth: { [key: string]: number } = {}
    bookings.forEach(booking => {
      const date = new Date(booking.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      bookingsByMonth[monthKey] = (bookingsByMonth[monthKey] || 0) + 1
    })

    db.release()

    // Transform data to match AnalyticsDashboard expectations
    const bookingsByPeriod = Object.entries(bookingsByDate).map(([date, count]) => ({
      date,
      count: count.toString(),
      confirmed: bookings.filter(b => b.date === date && b.status === 'confirmed').length.toString(),
      cancelled: bookings.filter(b => b.date === date && b.status === 'cancelled').length.toString(),
      pending: bookings.filter(b => b.date === date && b.status === 'pending').length.toString()
    }))

    const usersWithMostBookings = Object.entries(userBookingCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({
        name,
        phone: bookings.find(b => (b.userName || b.name) === name)?.phone || '',
        totalbookings: total.toString(),
        confirmedbookings: bookings.filter(b => (b.userName || b.name) === name && b.status === 'confirmed').length.toString(),
        cancelledbookings: bookings.filter(b => (b.userName || b.name) === name && b.status === 'cancelled').length.toString()
      }))

    const usersWithMostCancelled = Object.entries(cancelledBookingsByUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, cancelled]) => ({
        name,
        phone: bookings.find(b => (b.userName || b.name) === name)?.phone || '',
        totalbookings: userBookingCounts[name]?.toString() || '0',
        cancelledbookings: cancelled.toString()
      }))

    const newUsersByPeriod = Object.entries(users.reduce((acc, user) => {
      const date = user.createdat ? (typeof user.createdat === 'string' ? user.createdat.split('T')[0] : user.createdat.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as { [key: string]: number })).map(([date, count]) => ({
      date,
      count: typeof count === 'number' ? count.toString() : '0'
    }))

    const popularServices = Object.entries(serviceCounts)
      .sort(([,a], [,b]) => Number(b) - Number(a))
      .slice(0, 5)
      .map(([name, total]) => ({
        servicename: name,
        totalbookings: total.toString(),
        confirmedbookings: bookings.filter(b => b.serviceName === name && b.status === 'confirmed').length.toString(),
        cancelledbookings: bookings.filter(b => b.serviceName === name && b.status === 'cancelled').length.toString()
      }))

    // Get services count - simplified for now
    const activeServices = 0

    const overallStats = {
      totalbookings: totalBookings.toString(),
      confirmedbookings: confirmedBookings.toString(),
      cancelledbookings: cancelledBookings.toString(),
      pendingbookings: pendingBookings.toString(),
      totalusers: users.length.toString(),
      activeservices: activeServices.toString()
    }

    const recentActivity = Object.entries(bookingsByDate)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7)
      .map(([date, count]) => ({
        date,
        newbookings: count.toString(),
        newusers: users.filter(u => {
          const d = typeof u.createdat === 'string' ? u.createdat : u.createdat?.toISOString?.() || ''
          return d.startsWith(date)
        }).length.toString()
      }))

    return NextResponse.json({
      period,
      bookingsByPeriod,
      usersWithMostBookings,
      usersWithMostCancelled,
      newUsersByPeriod,
      popularServices,
      overallStats,
      recentActivity
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 