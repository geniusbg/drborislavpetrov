'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Phone } from 'lucide-react'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'Начало', href: '#home' },
    { name: 'За мен', href: '#about' },
    { name: 'Услуги', href: '#services' },
    { name: 'Контакти', href: '#contact' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="#home" className="flex items-center space-x-2 animate-fade-in">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">ДП</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">Д-р Борислав Петров</h1>
              <p className="text-sm text-secondary-600">Зъболекар</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-secondary-700 hover:text-primary-600 transition-colors duration-200 font-medium animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="#booking"
              className="btn-primary flex items-center space-x-2 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              <Phone className="w-4 h-4" />
              <span>Резервирай час</span>
            </Link>
            <Link
              href="/admin/login"
              className="text-secondary-700 hover:text-primary-600 transition-colors duration-200 font-medium animate-fade-in"
              style={{ animationDelay: '0.5s' }}
            >
              Админ
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-secondary-700 hover:text-primary-600 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-secondary-200">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-secondary-700 hover:text-primary-600 transition-colors duration-200 font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="#booking"
                className="btn-primary flex items-center justify-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="w-4 h-4" />
                <span>Резервирай час</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 