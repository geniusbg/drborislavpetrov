'use client'

import React from 'react'
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Calendar } from 'lucide-react'
import type { Booking } from '@/types/global'
import Pagination from '@/components/admin/Pagination'

// Sort types
type SortField = 'date' | 'time' | 'name' | 'phone' | 'service' | 'status' | 'createdAt'
type SortDirection = 'asc' | 'desc'

interface SortState {
  field: SortField
  direction: SortDirection
}

interface BookingsTabProps {
  bookings: Booking[]
  filteredBookings: Booking[]
  paginatedBookings: Booking[]
  bookingSearchTerm: string
  bookingDateFilter: 'all' | 'today' | 'yesterday' | '7days' | '30days'
  sortState: SortState
  currentBookingsPage: number
  totalBookingsPages: number
  bookingsStartIndex: number
  bookingsEndIndex: number
  bookingsPerPage: number
  onBookingSearchChange: (term: string) => void
  onBookingDateFilterChange: (filter: 'all' | 'today' | 'yesterday' | '7days' | '30days') => void
  onSortChange: (field: SortField) => void
  onBookingPageChange: (page: number) => void
  onBookingsPerPageChange: (perPage: number) => void
  onAddBooking: () => void
  onEditBooking: (booking: Booking) => void
  onDeleteBooking: (id: number | string) => void
}

export default function BookingsTab({
  bookings,
  filteredBookings,
  paginatedBookings,
  bookingSearchTerm,
  bookingDateFilter,
  sortState,
  currentBookingsPage,
  totalBookingsPages,
  bookingsStartIndex,
  bookingsEndIndex,
  bookingsPerPage,
  onBookingSearchChange,
  onBookingDateFilterChange,
  onSortChange,
  onBookingPageChange,
  onBookingsPerPageChange,
  onAddBooking,
  onEditBooking,
  onDeleteBooking
}: BookingsTabProps) {
  
  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortState.field !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />
    }
    return sortState.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  // Handle date filter change - reset to page 1
  const handleDateFilterChange = (filter: 'all' | 'today' | 'yesterday' | '7days' | '30days') => {
    onBookingDateFilterChange(filter)
    onBookingPageChange(1)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900">Резервации</h2>
          <p className="text-sm text-gray-600 mt-1">
            {bookingSearchTerm || bookingDateFilter !== 'all' 
              ? `${filteredBookings.length} от ${bookings.length} резервации` 
              : `${bookings.length} резервации`}
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          {/* Date Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Период:</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => handleDateFilterChange('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  bookingDateFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Всички
              </button>
              <button
                onClick={() => handleDateFilterChange('today')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  bookingDateFilter === 'today'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Днес
              </button>
              <button
                onClick={() => handleDateFilterChange('yesterday')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  bookingDateFilter === 'yesterday'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Вчера
              </button>
              <button
                onClick={() => handleDateFilterChange('7days')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  bookingDateFilter === '7days'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 дни
              </button>
              <button
                onClick={() => handleDateFilterChange('30days')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  bookingDateFilter === '30days'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 дни
              </button>
            </div>
          </div>
          
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Търси по име, телефон, имейл, дата, час или услуга..."
              value={bookingSearchTerm}
              onChange={(e) => onBookingSearchChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {bookingSearchTerm && (
              <button
                onClick={() => onBookingSearchChange('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Mobile Sort Dropdown */}
          <div className="sm:hidden relative">
            <select
              value={`${sortState.field}-${sortState.direction}`}
              onChange={(e) => {
                const [field] = e.target.value.split('-') as [SortField, SortDirection]
                onSortChange(field)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc">Дата (най-нови)</option>
              <option value="date-asc">Дата (най-стари)</option>
              <option value="time-asc">Час (рано)</option>
              <option value="time-desc">Час (късно)</option>
              <option value="name-asc">Име (A-Z)</option>
              <option value="name-desc">Име (Z-A)</option>
              <option value="service-asc">Услуга (A-Z)</option>
              <option value="service-desc">Услуга (Z-A)</option>
              <option value="status-asc">Статус (A-Z)</option>
              <option value="status-desc">Статус (Z-A)</option>
            </select>
          </div>
          
          {/* Add Booking Button */}
          <button
            onClick={onAddBooking}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Добави резервация</span>
          </button>
        </div>
      </div>
      
      {/* Mobile: Card Layout, Desktop: Table Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {paginatedBookings.map((booking) => (
            <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{booking.name}</h3>
                  {booking.phone && (
                    <p className="text-sm text-gray-600">{booking.phone}</p>
                  )}
                  {booking.email && (
                    <p className="text-sm text-gray-600">{booking.email}</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEditBooking(booking)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Редактирай"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteBooking(booking.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Изтрий"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Дата:</span>
                  <span className="font-medium">{booking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Час:</span>
                  <span className="font-medium">{booking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Услуга:</span>
                  <span className="font-medium">{booking.serviceName || booking.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Статус:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Потвърдена' :
                     booking.status === 'pending' ? 'Чакаща' :
                     booking.status === 'cancelled' ? 'Отказана' :
                     booking.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop: Table Layout */}
      <div className="hidden sm:block">
        <table className="w-full divide-y divide-gray-200 table-auto">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('name')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Пациент</span>
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('date')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Дата</span>
                  {getSortIcon('date')}
                </button>
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('time')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Час</span>
                  {getSortIcon('time')}
                </button>
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('service')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Услуга</span>
                  {getSortIcon('service')}
                </button>
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('status')}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  <span>Статус</span>
                  {getSortIcon('status')}
                </button>
              </th>
              <th className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedBookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                  <div>
                    <div className="font-medium">{booking.name}</div>
                    {booking.phone && (
                      <div className="text-gray-500">{booking.phone}</div>
                    )}
                    {booking.email && (
                      <div className="text-gray-500">{booking.email}</div>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {booking.date}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {booking.time}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  {booking.serviceName || booking.service}
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status === 'confirmed' ? 'Потвърдена' :
                     booking.status === 'pending' ? 'Чакаща' :
                     booking.status === 'cancelled' ? 'Отказана' :
                     booking.status}
                  </span>
                </td>
                <td className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 text-sm text-gray-900">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEditBooking(booking)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Редактирай"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBooking(booking.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Изтрий"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls for Bookings */}
      <Pagination
        currentPage={currentBookingsPage}
        totalPages={totalBookingsPages}
        totalItems={filteredBookings.length}
        startIndex={bookingsStartIndex}
        endIndex={bookingsEndIndex}
        itemsPerPage={bookingsPerPage}
        onPageChange={onBookingPageChange}
        onItemsPerPageChange={onBookingsPerPageChange}
        label="резервации"
      />
    </div>
  )
}
