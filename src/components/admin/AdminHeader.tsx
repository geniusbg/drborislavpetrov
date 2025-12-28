'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, ArrowLeft, Smartphone, LogOut, Settings, MessageSquare } from 'lucide-react'

interface AdminHeaderProps {
  isHeaderVisible: boolean
  onSettingsClick: () => void
  onLogout: () => void
}

export default function AdminHeader({ isHeaderVisible, onSettingsClick, onLogout }: AdminHeaderProps) {
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-blue-800 shadow transition-transform duration-0 ${
      isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-2.5 md:px-4 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand + Breadcrumb */}
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white/15 rounded-lg backdrop-blur-sm">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-white">
              <div className="flex items-center text-xs sm:text-sm text-blue-100 space-x-2" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Администрация</h1>
            </div>
          </div>

          {/* Actions (Desktop) */}
          <div className="hidden sm:flex items-center space-x-2 md:space-x-2.5 lg:space-x-3 flex-wrap overflow-x-auto scrollbar-hide">
            <Link href="/" className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden lg:inline">Към сайта</span>
            </Link>
            <a href="/siri" className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0">
              <Smartphone className="w-4 h-4" />
              <span className="hidden lg:inline">Siri Shortcuts</span>
            </a>

            <div className="h-5 w-px bg-blue-300/60 flex-shrink-0" />
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open('https://t.me/drborislavpetrov', '_blank')
                }
              }}
              className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden lg:inline">Поддръжка</span>
            </button>
            
            <button
              onClick={onSettingsClick}
              className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline">Настройки</span>
            </button>
            
            <div className="h-5 w-px bg-blue-300/60 flex-shrink-0" />
            <button
              onClick={onLogout}
              className="text-blue-100 hover:text-white transition-colors inline-flex items-center space-x-2 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Изход</span>
            </button>
          </div>

          {/* Mobile actions */}
          <div className="sm:hidden flex items-center space-x-2">
            <button
              onClick={onSettingsClick}
              className="p-2 text-blue-100 hover:text-white transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-blue-100 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary row removed per request: Search + Today/Week chips */}
      </div>
    </header>
  )
}
