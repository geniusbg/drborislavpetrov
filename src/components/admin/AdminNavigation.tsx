'use client'

import React from 'react'
import { Calendar, Users, Settings, BarChart3, Bug, CheckCircle } from 'lucide-react'

interface AdminNavigationProps {
  activeTab: string
  isHeaderVisible: boolean
  onTabChange: (tab: string) => void
}

export default function AdminNavigation({ activeTab, isHeaderVisible, onTabChange }: AdminNavigationProps) {
  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    localStorage.setItem('adminActiveTab', tab)
  }

  return (
    <div className={`fixed top-16 left-0 right-0 z-30 bg-white border-b border-gray-200 transition-all duration-0 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-1 sm:p-1.5 md:p-2">
            {/* Mobile: Horizontal Scrollable Tabs */}
            <div className="sm:hidden overflow-x-auto scrollbar-hide">
              <nav className="flex space-x-1">
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'bookings'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Резервации</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('calendar')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Календар</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Потребители</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('services')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'services'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Услуги</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Анализи</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('bugTracker')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'bugTracker'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Bug className="w-4 h-4" />
                    <span>Бъгове</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('qa')}
                  className={`flex-shrink-0 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                    activeTab === 'qa'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>QA</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Desktop: Full Width Tabs */}
            <div className="hidden sm:block">
              <nav className="flex space-x-1">
                <button
                  onClick={() => handleTabChange('bookings')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'bookings'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Резервации</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('calendar')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'calendar'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Календар</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'users'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Потребители</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('services')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'services'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Услуги</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('analytics')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'analytics'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Анализи</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('bugTracker')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'bugTracker'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Bug className="w-4 h-4" />
                    <span>Бъгове</span>
                  </div>
                </button>
                <button
                  onClick={() => handleTabChange('qa')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'qa'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>QA</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
