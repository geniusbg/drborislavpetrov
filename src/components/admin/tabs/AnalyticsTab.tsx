'use client'

import React from 'react'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

interface AnalyticsTabProps {
  bookings: any[]
  users: any[]
  services: any[]
}

export default function AnalyticsTab({ bookings, users, services }: AnalyticsTabProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-2 sm:px-2.5 md:px-4 lg:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-900">Анализи Табло</h2>
          <p className="text-sm text-gray-600 mt-1">Статистики и анализи на резервациите</p>
        </div>
      </div>
      
      <div className="p-2 sm:p-2.5 md:p-4 lg:p-6">
        <AnalyticsDashboard 
          bookings={bookings}
          users={users}
          services={services}
        />
      </div>
    </div>
  )
}
