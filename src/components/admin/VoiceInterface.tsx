/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Smartphone, Command, X, Check, AlertCircle } from 'lucide-react'

interface VoiceInterfaceProps {
  onCommand: (command: string) => void
}

interface VoiceState {
  isListening: boolean
  isSupported: boolean
  transcript: string
  error: string
  isMobile: boolean
}

interface ParsedCommand {
  action: string
  entity?: string
  name?: string
  phone?: string
  email?: string
  date?: string
  time?: string
  service?: string
  originalCommand: string
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onCommand }) => {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    error: '',
    isMobile: false
  })
  
  const [showSmartInterface, setShowSmartInterface] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState('')
  
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Detect device and browser support
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    const isSupported = !!SpeechRecognition && !isIOS // iOS Safari doesn't support Web Speech API
    
    setVoiceState(prev => ({
      ...prev,
      isSupported,
      isMobile
    }))

    // Initialize speech recognition
    if (SpeechRecognition && !isIOS) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'bg-BG'
      
      recognitionRef.current.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true, error: '' }))
      }
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        setVoiceState(prev => ({
          ...prev,
          transcript: finalTranscript + interimTranscript
        }))
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: `Грешка: ${event.error}`
        }))
      }
      
      recognitionRef.current.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }))
      }
    }
  }, [])

  // Parse voice command function
  const parseVoiceCommand = (command: string): ParsedCommand => {
    // Enhanced patterns for better recognition
    const patterns = {
      // User management
      addUser: /добави\s+потребител\s+(.+?)(?:\s+телефон\s+([^\s]+))?(?:\s+имейл\s+([^\s]+))?/i,
      updateUser: /промени\s+потребител\s+(.+?)(?:\s+телефон\s+([^\s]+))?(?:\s+имейл\s+([^\s]+))?/i,
      deleteUser: /изтрий\s+потребител\s+(.+?)(?:\s|$)/i,
      
      // Booking management
      addBooking: /добави\s+резервация\s+(.+?)(?:\s+дата\s+([^\s]+))?(?:\s+час\s+([^\s]+))?(?:\s+услуга\s+([^\s]+))?/i,
      updateBooking: /промени\s+резервация\s+(.+?)(?:\s+дата\s+([^\s]+))?(?:\s+час\s+([^\s]+))?/i,
      cancelBooking: /отмени\s+резервация\s+(.+?)(?:\s+дата\s+([^\s]+))?/i,
      
      // Utility commands
      checkAvailability: /провери\s+свободни\s+часове(?:\s+за\s+([^\s]+))?/i,
      showBookings: /покажи\s+резервации\s+за\s+([^\s]+)/i,
    }

    // Check each pattern
    for (const [action, pattern] of Object.entries(patterns)) {
      const match = command.match(pattern)
      if (match) {
        const result: ParsedCommand = {
          action: action,
          originalCommand: command
        }

        // Extract parameters based on action
        switch (action) {
          case 'addUser':
          case 'updateUser':
            result.name = match[1]?.trim()
            result.phone = match[2]?.trim()
            result.email = match[3]?.trim()
            break
          case 'deleteUser':
            result.name = match[1]?.trim()
            break
          case 'addBooking':
            result.name = match[1]?.trim()
            result.date = match[2]?.trim()
            result.time = match[3]?.trim()
            result.service = match[4]?.trim()
            break
          case 'updateBooking':
            result.name = match[1]?.trim()
            result.date = match[2]?.trim()
            result.time = match[3]?.trim()
            break
          case 'cancelBooking':
            result.name = match[1]?.trim()
            result.date = match[2]?.trim()
            break
          case 'checkAvailability':
            result.date = match[1]?.trim()
            break
          case 'showBookings':
            result.date = match[1]?.trim()
            break
        }

        return result
      }
    }

    return { action: '', originalCommand: command }
  }

  // Voice command templates
  const voiceTemplates = [
    'добави потребител',
    'промени потребител', 
    'изтрий потребител',
    'добави резервация',
    'промени резервация',
    'отмени резервация',
    'провери свободни часове',
    'покажи резервации'
  ]

  const startVoiceRecognition = useCallback(async () => {
    if (voiceState.isMobile && !voiceState.isSupported) {
      // On iOS or unsupported mobile, show smart interface
      setShowSmartInterface(true)
      return
    }

    if (!recognitionRef.current) {
      setVoiceState(prev => ({ ...prev, error: 'Гласовото разпознаване не е поддържано' }))
      return
    }

    try {
      await recognitionRef.current.start()
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Грешка при стартиране на гласовото разпознаване' 
      }))
    }
  }, [voiceState.isMobile, voiceState.isSupported])

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setVoiceState(prev => ({ ...prev, isListening: false }))
  }, [])

  const handleVoiceSubmit = useCallback(async () => {
    if (!voiceState.transcript.trim()) return

    setIsProcessing(true)
    setVoiceState(prev => ({ ...prev, error: '' }))
    setSuccess('')

    try {
      // Parse the voice command
      const parsedCommand = parseVoiceCommand(voiceState.transcript)
      
      if (!parsedCommand.action) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Неразпозната команда. Опитайте отново.' 
        }))
        return
      }

      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedCommand)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message || 'Командата е изпълнена успешно')
        setVoiceState(prev => ({ ...prev, transcript: '' }))
        onCommand(voiceState.transcript)
      } else {
        setVoiceState(prev => ({ ...prev, error: result.error || 'Грешка при обработка на командата' }))
      }
    } catch (error) {
      setVoiceState(prev => ({ ...prev, error: 'Грешка при изпращане на командата' }))
    } finally {
      setIsProcessing(false)
    }
  }, [voiceState.transcript, onCommand])

  const handleSmartCommand = useCallback(async (command: string) => {
    setIsProcessing(true)
    setSuccess('')
    setVoiceState(prev => ({ ...prev, error: '' }))

    try {
      // Parse the command
      const parsedCommand = parseVoiceCommand(command)
      
      if (!parsedCommand.action) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Неразпозната команда. Опитайте отново.' 
        }))
        return
      }

      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedCommand)
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(result.message || 'Командата е изпълнена успешно')
        onCommand(command)
      } else {
        setVoiceState(prev => ({ ...prev, error: result.error || 'Грешка при обработка на командата' }))
      }
    } catch (error) {
      setVoiceState(prev => ({ ...prev, error: 'Грешка при изпращане на командата' }))
    } finally {
      setIsProcessing(false)
    }
  }, [onCommand])

  const clearTranscript = () => {
    setVoiceState(prev => ({ ...prev, transcript: '', error: '' }))
    setSuccess('')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Гласово управление</h3>
            {voiceState.isMobile && <Smartphone className="w-4 h-4 text-gray-500" />}
          </div>
          <button 
            onClick={clearTranscript}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Voice Recognition Section */}
        {voiceState.isSupported ? (
          <div className="space-y-3">
            {/* Voice Button */}
            <div className="flex justify-center">
              <button
                onClick={voiceState.isListening ? stopVoiceRecognition : startVoiceRecognition}
                className={`p-4 rounded-full transition-all duration-200 ${
                  voiceState.isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {voiceState.isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Status */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {voiceState.isListening ? '🎤 Говорете...' : 'Натиснете за да говорите'}
              </p>
            </div>

            {/* Transcript */}
            {voiceState.transcript && (
              <div className="space-y-2">
                <textarea
                  ref={inputRef}
                  value={voiceState.transcript}
                  onChange={(e) => setVoiceState(prev => ({ ...prev, transcript: e.target.value }))}
                  placeholder="Вашата команда ще се появи тук..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleVoiceSubmit}
                    disabled={isProcessing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {isProcessing ? 'Обработва...' : 'Изпълни'}
                  </button>
                  
                  <button
                    onClick={() => setShowSmartInterface(true)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Command className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fallback for unsupported devices */
          <div className="space-y-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Smartphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {voiceState.isMobile 
                  ? 'На мобилни устройства използвайте Smart Command Interface'
                  : 'Гласовото разпознаване не е поддържано'
                }
              </p>
              <button
                onClick={() => setShowSmartInterface(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Отвори Smart Interface
              </button>
            </div>
          </div>
        )}

        {/* Smart Command Interface */}
        {showSmartInterface && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Smart Command Interface</h4>
              <button
                onClick={() => setShowSmartInterface(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Въведете команда..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const target = e.target as HTMLInputElement
                  if (target.value.trim()) {
                    handleSmartCommand(target.value.trim())
                    target.value = ''
                  }
                }
              }}
            />
            
            <div className="grid grid-cols-2 gap-1">
              {voiceTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleSmartCommand(template)}
                  className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Messages */}
        {voiceState.error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg mt-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{voiceState.error}</span>
          </div>
        )}

        {/* Success Messages */}
        {success && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg mt-3">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}

        {/* Help Section */}
        <div className="text-xs text-gray-500 mt-3">
          <p>💡 Примери: &quot;добави потребител Иван телефон 0888123456&quot;</p>
          <p>💡 &quot;добави резервация Петър 15.12.2024 14:00&quot;</p>
        </div>
      </div>
    </div>
  )
}

export default VoiceInterface 