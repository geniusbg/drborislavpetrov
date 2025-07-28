/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, X, Check, AlertCircle } from 'lucide-react'

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

interface VoiceAssistantProps {
  onCommand: (command: string) => void
  isListening: boolean
  setIsListening: (listening: boolean) => void
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

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, isListening, setIsListening }) => {
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const recognitionRef = useRef<any>(null)

  const processCommand = useCallback(async (command: string) => {
    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const parsedCommand = parseVoiceCommand(command)
      
      if (parsedCommand.action) {
        const response = await fetch('/api/admin/voice-commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedCommand),
        })

        const result = await response.json()

        if (result.success) {
          setSuccess(result.message || 'Командата е изпълнена успешно')
          onCommand(command)
        } else {
          setError(result.error || 'Грешка при изпълнение на командата')
        }
      } else {
        setError('Не разпознавам командата. Моля, опитайте отново.')
      }
    } catch (err) {
      setError('Грешка при обработка на командата')
      console.error('Voice command error:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [onCommand])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      const recognition = recognitionRef.current
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'bg-BG'
      recognition.maxAlternatives = 3

      recognition.onstart = () => {
        setIsListening(true)
        setError('')
        setSuccess('')
      }

      recognition.onresult = (event: any) => {
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

        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setError(`Грешка при разпознаване: ${event.error}`)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (transcript.trim()) {
          processCommand(transcript.trim())
        }
      }
    } else {
      setError('Гласовото разпознаване не се поддържа в този браузър')
    }
  }, [processCommand, transcript, setIsListening])

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('')
      setError('')
      setSuccess('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const parseVoiceCommand = (command: string): ParsedCommand => {
    // Enhanced patterns for better recognition
    const patterns = {
      // User management
      addUser: /добави\s+потребител\s+([^телефон]+?)(?:\s+телефон\s+([^\s]+))?(?:\s+имейл\s+([^\s]+))?/i,
      updateUser: /промени\s+потребител\s+([^телефон]+?)(?:\s+телефон\s+([^\s]+))?(?:\s+имейл\s+([^\s]+))?/i,
      deleteUser: /изтрий\s+потребител\s+([^\s]+)/i,
      
      // Booking management
      addBooking: /добави\s+резервация\s+([^дата]+?)(?:\s+дата\s+([^\s]+))?(?:\s+час\s+([^\s]+))?(?:\s+услуга\s+([^\s]+))?/i,
      updateBooking: /промени\s+резервация\s+([^дата]+?)(?:\s+дата\s+([^\s]+))?(?:\s+час\s+([^\s]+))?/i,
      cancelBooking: /отмени\s+резервация\s+([^дата]+?)(?:\s+дата\s+([^\s]+))?/i,
      
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

  const handleManualSubmit = () => {
    if (transcript.trim()) {
      processCommand(transcript.trim())
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setError('')
    setSuccess('')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Гласов Асистент</h3>
          </div>
          <button
            onClick={clearTranscript}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Voice Button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`
              p-4 rounded-full transition-all duration-200 transform hover:scale-105
              ${isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isListening ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Status */}
        <div className="text-center mb-3">
          <p className="text-sm text-gray-600">
            {isListening ? 'Говорете сега...' : 'Натиснете за да говорите'}
          </p>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="mb-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{transcript}</p>
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleManualSubmit}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4 mr-1" />
                Изпълни
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg mb-2">
            <Check className="w-4 h-4 text-green-500" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Обработване...</span>
          </div>
        )}

        {/* Help */}
        <div className="text-xs text-gray-500 mt-3">
          <p className="font-medium mb-1">Примери команди:</p>
          <ul className="space-y-1">
            <li>• &quot;добави потребител Иван Иванов телефон 0888123456&quot;</li>
            <li>• &quot;промени потребител Мария телефон 0888765432&quot;</li>
            <li>• &quot;добави резервация Петър 15.12.2024 14:00&quot;</li>
            <li>• &quot;провери свободни часове за утре&quot;</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VoiceAssistant 