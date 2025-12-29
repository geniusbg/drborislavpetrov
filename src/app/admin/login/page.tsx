'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

// Custom zoom animation
const zoomAnimation = `
  @keyframes zoom-in-out {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  .zoom-in-out {
    animation: zoom-in-out 2s ease-in-out;
  }
`

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Typewriter effect for title
  const fullText = 'Д-р Борислав Петров'
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, 100) // Speed of typing (100ms per character)
      
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Грешно потребителско име или парола')
        setIsLoading(false)
        return
      }

      // Token is now stored in httpOnly cookie automatically
      // Store admin info in localStorage for client-side use (non-sensitive data)
      if (data.admin) {
        localStorage.setItem('adminInfo', JSON.stringify(data.admin))
      }

      // Redirect to admin panel
      router.push('/admin')
    } catch (error) {
      console.error('Login error:', error)
      setError('Възникна грешка при влизане. Моля опитайте отново.')
    }
    
    setIsLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <style jsx>{zoomAnimation}</style>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl p-8 shadow-2xl zoom-in-out hover:scale-105 transition-all duration-300">
            <h1 className="text-center text-xl sm:text-xl md:text-2xl lg:text-3xl font-bold text-white leading-relaxed font-serif min-h-[50px] sm:min-h-[60px] flex items-center justify-center">
              <span className="text-center">
                {displayedText}
                {currentIndex < fullText.length && (
                  <span className="animate-pulse">|</span>
                )}
              </span>
            </h1>
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-semibold text-gray-700">
          Администрация
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Влезте в административният панел
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Потребителско име
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={credentials.username}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Въведете потребителско име"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Парола
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Въведете парола"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Влизане...' : 'Влез'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  )
}

export default AdminLogin 