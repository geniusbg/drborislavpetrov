/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Type, Zap } from 'lucide-react'

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
  onClose?: () => void
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

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onCommand, isListening, setIsListening, onClose }) => {
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showTextInput, setShowTextInput] = useState(false)
  const [manualCommand, setManualCommand] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const recognitionRef = useRef<any>(null)
  const [isHolding, setIsHolding] = useState(false)
  const [statusLabel, setStatusLabel] = useState('')
  const [isOnline, setIsOnline] = useState(true)

  // IndexedDB setup for offline queue
  const dbPromiseRef = useRef<Promise<IDBDatabase> | null>(null)
  const getDb = (): Promise<IDBDatabase> => {
    if (dbPromiseRef.current) return dbPromiseRef.current
    dbPromiseRef.current = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        reject(new Error('IndexedDB не се поддържа'))
        return
      }
      const request = indexedDB.open('voice-assistant-db', 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('audioQueue')) {
          db.createObjectStore('audioQueue', { keyPath: 'id', autoIncrement: true })
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error || new Error('IDB грешка'))
    })
    return dbPromiseRef.current
  }

  const addRecord = (db: IDBDatabase, storeName: string, value: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      const store = tx.objectStore(storeName)
      store.add(value)
    })
  }

  const deleteRecord = (db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      const store = tx.objectStore(storeName)
      store.delete(key)
    })
  }

  const getAllRecords = (db: IDBDatabase, storeName: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      tx.onerror = () => reject(tx.error)
      const store = tx.objectStore(storeName)
      if ('getAll' in store) {
        const req = (store as any).getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      } else {
        const results: any[] = []
        const cursorReq = (store as any).openCursor()
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (cursor) {
            results.push(cursor.value)
            cursor.continue()
          } else {
            resolve(results)
          }
        }
        cursorReq.onerror = () => reject(cursorReq.error)
      }
    })
  }

  const enqueueAudio = async (blob: Blob) => {
    try {
      const db = await getDb()
      await addRecord(db, 'audioQueue', { createdAt: Date.now(), type: blob.type, data: await blob.arrayBuffer() })
      setSuccess('Записът е запазен офлайн – ще се изпрати при свързване.')
    } catch (e) {
      console.error('Offline queue error:', e)
      setError('Неуспешно записване офлайн.')
    }
  }

  const processCommand = useCallback(async (command: string) => {
    setIsProcessing(true)
    setError('')
    setSuccess('')

    try {
      const parsedCommand = parseVoiceCommand(command)
      
      if (parsedCommand.action) {
        const adminToken = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/voice-commands', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken || ''
          },
          body: JSON.stringify(parsedCommand)
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

  const flushQueue = useCallback(async () => {
    try {
      const db = await getDb()
      const all = await getAllRecords(db, 'audioQueue')
      for (const item of all) {
        try {
          const blob = new Blob([item.data], { type: item.type || 'audio/webm' })
          const resp = await fetch('/api/stt', { method: 'POST', headers: { 'content-type': blob.type }, body: blob })
          const data = await resp.json()
          await deleteRecord(db, 'audioQueue', item.id)
          if (data?.text) {
            await processCommand(data.text)
          }
        } catch (e) {
          console.error('Flush item failed, will retry later', e)
        }
      }
    } catch (e) {
      console.error('Flush queue error:', e)
    }
  }, [processCommand])

  // Simple device detection
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const supportsMediaRecorder = typeof window !== 'undefined' && typeof (window as any).MediaRecorder === 'function'
  
  // Command templates for quick access
  const commandTemplates = [
    {
      category: 'Потребители',
      commands: [
        { text: 'добави потребител [име] телефон [номер]', example: 'добави потребител Иван Иванов телефон 0888123456' },
        { text: 'промени потребител [име] телефон [номер]', example: 'промени потребител Мария телефон 0888765432' },
        { text: 'изтрий потребител [име]', example: 'изтрий потребител Петър' }
      ]
    },
    {
      category: 'Резервации',
      commands: [
        { text: 'добави резервация [име] [дата] [час]', example: 'добави резервация Петър 15.12.2024 14:00' },
        { text: 'промени резервация [име] [дата] [час]', example: 'промени резервация Иван 20.12.2024 10:00' },
        { text: 'отмени резервация [име] [дата]', example: 'отмени резервация Мария 25.12.2024' }
      ]
    },
    {
      category: 'Услуги',
      commands: [
        { text: 'провери свободни часове [дата]', example: 'провери свободни часове за утре' },
        { text: 'покажи резервации [дата]', example: 'покажи резервации за днес' }
      ]
    }
  ]

  // Smart suggestions based on input
  const getSuggestions = (input: string) => {
    if (!input.trim()) return []
    
    const suggestions: string[] = []
    const lowerInput = input.toLowerCase()
    
    commandTemplates.forEach(category => {
      category.commands.forEach(cmd => {
        if (cmd.text.toLowerCase().includes(lowerInput) || 
            cmd.example.toLowerCase().includes(lowerInput)) {
          suggestions.push(cmd.example)
        }
      })
    })
    
    return suggestions.slice(0, 5) // Limit to 5 suggestions
  }

  const suggestions = getSuggestions(manualCommand)

  // Check if voice recognition is supported (desktop only)
  const checkVoiceSupport = useCallback(() => {
    if (typeof window !== 'undefined') {
      // iOS Safari doesn't support SpeechRecognition, so disable voice mode on mobile
      if (isMobile) {
        setVoiceSupported(false)
        setShowTextInput(true)
        setError('iOS използва hold-to-record бутона за по-добро изживяване.')
        return
      }
      
      // Desktop: check for SpeechRecognition support
      const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
      setVoiceSupported(hasSpeechRecognition)
      if (!hasSpeechRecognition) {
        setShowTextInput(true)
        setError('Гласовото разпознаване не се поддържа в този браузър')
      }
    }
  }, [isMobile])

  // Check microphone permissions
  const checkMicrophonePermission = useCallback(async () => {
    try {
      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        setError('За да записвам аудио, е нужен защитен контекст (https или localhost).')
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }, [])

  // Online/offline listeners
  useEffect(() => {
    const update = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    const onOnline = () => { setIsOnline(true); flushQueue() }
    const onOffline = () => setIsOnline(false)
    update()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [flushQueue])



  // iOS-friendly: hold-to-record button using MediaRecorder, sending to /api/stt
  const startRecording = useCallback(async () => {
    if (!supportsMediaRecorder) {
      setError('Този браузър не поддържа запис от микрофона. Използвайте текстов режим или обновете iOS.')
      return
    }
    if (typeof window === 'undefined' || !navigator.mediaDevices) return
    try {
      setError('')
      setSuccess('')
      setIsProcessing(false)
      setStatusLabel('Запис...')
      setIsHolding(true)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' })
          if (!isOnline) {
            await enqueueAudio(blob)
          } else {
            setStatusLabel('Изпращане към STT...')
            try {
              const resp = await fetch('/api/stt', {
                method: 'POST',
                headers: { 'content-type': blob.type },
                body: blob,
              })
              
              console.log('STT Response status:', resp.status)
              
              if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(`STT API error (${resp.status}): ${errorData.error || 'Unknown error'}`)
              }
              
              const data = await resp.json()
              console.log('STT Response data:', data)
              
               if (data?.text) {
                 setTranscript(data.text) // Покажи разпознатия текст
                 await processCommand(data.text)
                 setStatusLabel('Готово')
                 setTimeout(() => setStatusLabel(''), 1200)
               } else {
                 throw new Error('Няма разпознат текст от STT')
               }
            } catch (fetchError) {
              console.error('STT fetch error:', fetchError)
              throw fetchError
            }
          }
        } catch (e) {
          console.error('STT request failed', e)
          const errorMessage = e instanceof Error ? e.message : 'Неизвестна грешка'
          setError(`STT грешка: ${errorMessage}`)
          setStatusLabel('Грешка')
          setTimeout(() => {
            setStatusLabel('')
            setError('')
          }, 3000)
        } finally {
          stream.getTracks().forEach(t => t.stop())
          setIsHolding(false)
        }
      }
      mediaRecorder.start()
      ;(window as any).__va_rec = mediaRecorder
    } catch (e) {
      console.error('Recording error', e)
      setIsHolding(false)
      setStatusLabel('')
    }
  }, [processCommand, supportsMediaRecorder, isOnline])

  const stopRecording = useCallback(() => {
    const mr = (typeof window !== 'undefined' ? (window as any).__va_rec : null)
    if (mr && mr.state !== 'inactive') mr.stop()
    setIsHolding(false)
  }, [])

  useEffect(() => {
    // Check voice support on mount
    checkVoiceSupport()

    // Only initialize voice recognition on desktop
    if (isMobile || !voiceSupported) {
      return
    }

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
        
        let errorMessage = 'Грешка при разпознаване'
        
        if (event.error === 'not-allowed') {
          errorMessage = 'Няма разрешение за достъп до микрофона. Моля, разрешете достъпа в настройките на браузъра.'
        } else if (event.error === 'service-not-allowed') {
          errorMessage = 'Гласовото разпознаване не е достъпно. Моля, използвайте текстово въвеждане.'
          setShowTextInput(true)
        } else if (event.error === 'no-speech') {
          errorMessage = 'Не се разпозна глас. Моля, опитайте отново.'
        } else if (event.error === 'network') {
          errorMessage = 'Грешка в мрежата. Моля, проверете интернет връзката.'
        }
        
        setError(errorMessage)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (transcript.trim() && !showTextInput) {
          processCommand(transcript.trim())
        }
      }
    }
  }, [processCommand, transcript, setIsListening, voiceSupported, isMobile, checkVoiceSupport, showTextInput])

  const startListening = async () => {
    // iOS doesn't support SpeechRecognition, use hold-to-record instead
    if (isMobile) {
      setShowTextInput(true)
      setError('iOS използва hold-to-record бутона за по-добро изживяване.')
      return
    }

    if (!voiceSupported) {
      setShowTextInput(true)
      return
    }

    // Check permissions first
    const hasPermission = await checkMicrophonePermission()
    
    if (!hasPermission) {
      setError('Няма разрешение за достъп до микрофона. Моля, разрешете достъпа.')
      setShowTextInput(true)
      return
    }

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
    const command = showTextInput ? manualCommand : transcript
    if (command.trim()) {
      processCommand(command.trim())
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setManualCommand('')
    setError('')
    setSuccess('')
    setShowTextInput(false)
  }

  const handleManualCommandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setManualCommand(value)
    setShowSuggestions(value.length > 0)
    setSelectedSuggestion(0)
  }

  const handleManualCommandKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showSuggestions && suggestions.length > 0) {
        // Use selected suggestion
        setManualCommand(suggestions[selectedSuggestion])
        setShowSuggestions(false)
      } else {
        handleManualSubmit()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestion(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestion(prev => prev > 0 ? prev - 1 : 0)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setManualCommand(suggestion)
    setShowSuggestions(false)
  }

  const handleTemplateClick = (template: string) => {
    setManualCommand(template)
    setShowSuggestions(false)
  }

  return (
    <div className="fixed inset-0 sm:bottom-4 sm:right-4 sm:inset-auto z-50 flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-0">
      <div className="bg-white w-full sm:w-80 sm:max-w-sm h-[85vh] sm:h-auto sm:rounded-xl shadow-2xl border border-gray-200 overflow-y-auto">
        {/* Mobile-optimized content */}
        <div className="p-4">
        {/* Mobile-friendly Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 -m-4 p-4 border-b sm:border-b-0 border-gray-100">
          <div className="flex items-center space-x-2">
            {showTextInput ? <Type className="w-5 h-5 text-blue-600" /> : <Volume2 className="w-5 h-5 text-blue-600" />}
            <h3 className="font-semibold text-gray-900 text-lg sm:text-base">
              {showTextInput ? 'Текстов Асистент' : 'Гласов Асистент'}
            </h3>
            {isMobile && (
              <Zap className="w-4 h-4 text-gray-500" />
            )}
          </div>
          <button
            onClick={() => { 
              if (onClose) {
                onClose()
              } else {
                clearTranscript()
              }
            }}
            className="p-2 sm:p-1 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
          >
            <X className="w-6 h-6 sm:w-4 sm:h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Content area with better mobile spacing */}
        <div className="space-y-4">

        {/* Voice Commands Only - No Mode Toggle */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 font-medium">
            🎤 Гласови команди за управление
          </p>
        </div>

        {/* Voice Button - Desktop */}
        {voiceSupported && (
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
        )}

        {/* Mobile-friendly hold-to-record button */}
        {isMobile && (
          <div className="flex justify-center mb-6 select-none" onContextMenu={(e) => e.preventDefault()}>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); startRecording() }}
              onMouseUp={(e) => { e.preventDefault(); stopRecording() }}
              onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId); startRecording() }}
              onPointerUp={(e) => { e.preventDefault(); stopRecording() }}
              onPointerCancel={(e) => { e.preventDefault(); stopRecording() }}
              onTouchStart={(e) => { e.preventDefault(); startRecording() }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording() }}
              onTouchCancel={(e) => { e.preventDefault(); stopRecording() }}
              draggable={false}
              className={`px-8 py-4 rounded-xl text-white font-semibold text-lg shadow-lg active:scale-95 transition-all duration-200 select-none min-h-[64px] touch-manipulation ${
                isHolding 
                  ? 'bg-red-500 animate-pulse shadow-red-200' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
              style={{ WebkitUserSelect: 'none', userSelect: 'none', touchAction: 'none' as any }}
              aria-pressed={isListening}
            >
              <div className="flex items-center justify-center space-x-3">
                <Mic className="w-6 h-6" />
                <span>{isHolding ? 'Записвам...' : 'Задръж за запис'}</span>
              </div>
            </button>
          </div>
        )}

        {/* Status */}
        <div className="text-center mb-3">
          <p className="text-sm text-gray-600">
            {isMobile 
              ? '📱 Мобилно: Използвайте hold-to-record бутона' 
              : isListening 
                ? 'Говорете сега...' 
                : 'Натиснете за да говорите'
            }
          </p>
          {statusLabel && (
            <p className="text-xs text-gray-500 mt-1">{statusLabel}</p>
          )}
          {isMobile && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Android: Web Speech API | iOS: Hold-to-record
            </p>
          )}
        </div>


        {/* Voice Recognition Result */}
        {transcript && (
          <div className="mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Разпознато от говора:</p>
                </div>
                <button
                  onClick={() => setTranscript('')}
                  className="text-blue-600 hover:text-blue-800 p-1 rounded"
                  title="Изчисти"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-blue-700 bg-white rounded p-2 border">{transcript}</p>
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
          {isMobile && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">📱 Мобилно Решение:</p>
              <ul className="text-blue-700 mt-1 space-y-1">
                <li>• Задръжте бутона докато говорите</li>
                <li>• Говорете ясно и бавно</li>
                <li>• Използвайте примерните команди</li>
                <li>• Командата се изпълнява автоматично</li>
              </ul>
            </div>
          )}
          {!isMobile && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">🎤 Гласови команди:</p>
              <ul className="text-green-700 mt-1 space-y-1">
                <li>• Натиснете микрофона и говорете</li>
                <li>• Говорете ясно и бавно</li>
                <li>• Използвайте примерните команди</li>
                <li>• Командата се изпълнява автоматично</li>
              </ul>
            </div>
          )}
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceAssistant 