/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Volume2, Smartphone, Command, X, Check, AlertCircle } from 'lucide-react'
import { getBulgariaTime } from '@/lib/bulgaria-time'

interface VoiceInterfaceProps {
  onCommand: (command: string) => void
  onClose?: () => void
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

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onCommand, onClose }) => {
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
      recognitionRef.current.maxAlternatives = 1
      
      // Увеличаваме timeout-а за по-дълго слушане
      recognitionRef.current.continuous = true
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Voice recognition started')
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
        
        // Clean up the transcript for display - replace klyomba with @ symbol
        const cleanedTranscript = cleanTranscript(finalTranscript + interimTranscript)
        
        console.log('🎤 Voice transcript:', cleanedTranscript)
        setVoiceState(prev => ({
          ...prev,
          transcript: cleanedTranscript
        }))
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error)
        setVoiceState(prev => ({
          ...prev,
          isListening: false,
          error: `Грешка: ${event.error}`
        }))
      }
      
      recognitionRef.current.onend = () => {
        console.log('🎤 Voice recognition ended')
        setVoiceState(prev => ({ ...prev, isListening: false }))
      }
    }
  }, [])

  // Parse voice command function
  const parseVoiceCommand = (command: string): ParsedCommand => {
    console.log('🎤 === PARSING VOICE COMMAND ===')
    console.log('📝 Input command:', command)
    
    // Completely rewritten patterns based on virtual team consultation
    // @virtual-skeptic: Previous regex was too restrictive with [^0-9]+?
    // @virtual-performance-optimizer: Using positive lookahead for better performance
    const patterns = {
      // User management - improved patterns with better name extraction
      addUser: /(?:добави|създай|направи)\s+(?:потребител|клиент|пациент)\s+([а-я]+(?:\s+[а-я]+)*?)(?=\s+(?:телефон|тел|номер|имейл|email)|$)/i,
      updateUser: /(?:промени|редактирай|измени)\s+(?:потребител|клиент|пациент)\s+([а-я]+(?:\s+[а-я]+)*?)(?=\s+(?:телефон|тел|номер|имейл|email)|$)/i,
      deleteUser: /(?:изтрий|премахни|удали)\s+(?:потребител|клиент|пациент)\s+([а-я]+(?:\s+[а-я]+)*)/i,
      
      // Booking management - improved patterns
      addBooking: /(?:добави|създай|направи|запиши|запази)\s+(?:резервация|запис|час)(?:\s+за\s+|\s+на\s+|\s+)([^0-9]+?)(?=\s+(?:дата|ден|час|време|услуга|лечение|\d|на|за|от)|$)/i,
      updateBooking: /(?:промени|редактирай|измени)\s+(?:резервация|запис|час)\s+([^0-9]+?)(?=\s+(?:дата|ден|час|време|\d)|$)/i,
      cancelBooking: /(?:отмени|откажи|прекрати)\s+(?:резервация|запис|час)\s+([^0-9]+?)(?=\s+(?:дата|ден|\d)|$)/i,
      deleteBooking: /(?:изтрий|премахни|удали)\s+(?:резервация|запис|час)\s+([^0-9]+?)(?=\s+(?:дата|ден|\d)|$)/i,
      
      // Utility commands
      checkAvailability: /(?:провери|покажи)\s+(?:свободни\s+)?(?:часове|слотове)(?:\s+за\s+([^\s]+))?/i,
      showBookings: /(?:покажи|списък|резервации)\s+(?:резервации|записи|часове)\s+за\s+([^\s]+)/i,
    }

    // Check each pattern
    for (const [action, pattern] of Object.entries(patterns)) {
      const match = command.match(pattern)
      if (match) {
        console.log('✅ Pattern matched:', action)
        console.log('📋 Match groups:', match)
        
        const result: ParsedCommand = {
          action: action,
          originalCommand: command
        }

        // Extract parameters based on action
        switch (action) {
          case 'addUser':
          case 'updateUser':
            // @virtual-skeptic: Simplified name extraction using positive lookahead
            result.name = match[1]?.trim() || ''
            
            // Extract phone and email using improved patterns
            const phoneMatch = command.match(/(?:телефон|тел|номер)\s+([0-9\s\+\-\(\)]+)/i)
            const emailMatch = command.match(/(?:имейл|email)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
            let email = emailMatch?.[1]?.trim()
            let phone = phoneMatch?.[1]?.trim()
            
            // Clean phone number - remove all spaces and special characters except digits
            if (phone) {
              phone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '')
            }

            // Ако не е намерен email на латиница, търси на кирилица и сглоби
            if (!email) {
              // Търси "имейл <потребител> кльомба <домейн> точка <разширение>"
              const emailPartsMatch = command.match(/(?:имейл|email)\s+([а-яa-zA-Z0-9._%+-]+)\s+(?:кльомба|klyomba|@)\s+([а-яa-zA-Z0-9._%+-]+)\s+(?:точка|dot|\.)\s*([а-яa-zA-Z]{2,})/i)
              if (emailPartsMatch) {
                let username = emailPartsMatch[1]?.trim()
                let domain = emailPartsMatch[2]?.trim()
                let tld = emailPartsMatch[3]?.trim()
                // Конвертирай кирилица към латиница
                const bulgarianToLatin: { [key: string]: string } = {
                  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
                  'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
                  'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                  'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
                  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
                  'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
                  'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
                  'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
                }
                const convertToLatin = (text: string): string => {
                  return text.split('').map(char => bulgarianToLatin[char] || char).join('')
                }
                username = convertToLatin(username)
                domain = convertToLatin(domain)
                tld = convertToLatin(tld)
                // Ако tld е "бг", направи го "bg"
                if (tld.toLowerCase() === 'бг') tld = 'bg'
                email = `${username}@${domain}.${tld}`
              }
            }

                         // Ако още няма email, пробвай да сглобиш от "имейл <потребител> кльомба <домейн>"
             if (!email) {
               const emailSimpleMatch = command.match(/(?:имейл|email)\s+([а-яa-zA-Z0-9._%+-]+)\s+(?:кльомба|klyomba|@)\s+([а-яa-zA-Z0-9._%+-]+)/i)
               if (emailSimpleMatch) {
                 let username = emailSimpleMatch[1]?.trim()
                 let domain = emailSimpleMatch[2]?.trim()
                 const bulgarianToLatin: { [key: string]: string } = {
                   'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
                   'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
                   'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                   'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya',
                   'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh', 'З': 'Z',
                   'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P',
                   'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
                   'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': 'Y', 'Ю': 'Yu', 'Я': 'Ya'
                 }
                 const convertToLatin = (text: string): string => {
                   return text.split('').map(char => bulgarianToLatin[char] || char).join('')
                 }
                 username = convertToLatin(username)
                 domain = convertToLatin(domain)
                 
                 // Проверяваме дали домейнът вече съдържа точка (например yahoo.com)
                 if (domain.includes('.')) {
                   email = `${username}@${domain}`
                 } else {
                   email = `${username}@${domain}.bg` // по подразбиране .bg само ако няма точка
                 }
               }
             }

             // Ако не е намерен телефон в структурирания формат, търси навсякъде в командата
             if (!phone) {
               const phoneAnywhere = command.match(/([0-9]{3,4}\s*[0-9]{2}\s*[0-9]{2})/)
               if (phoneAnywhere) {
                 phone = phoneAnywhere[1]?.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '')
               }
             }

             result.phone = phone
             result.email = email
            break
          case 'deleteUser':
            result.name = match[1]?.trim()
            break
          case 'addBooking':
            result.name = match[1]?.trim()
            
            // Extract other parameters using separate patterns
            const dateMatch = command.match(/(?:дата|ден)\s+([^\s]+)/i)
            const timeMatch = command.match(/(?:час|време)\s+([^\s]+)/i)
            const serviceMatch = command.match(/(?:услуга|лечение)\s+([^\s]+)/i)
            
            result.date = dateMatch?.[1]?.trim()
            result.time = timeMatch?.[1]?.trim()
            result.service = serviceMatch?.[1]?.trim()
            
            // Ако не е намерена дата, пробвай да я извлечеш от различни формати
            if (!result.date) {
              // Търси дата във формат DD.MM или DD.MM.YYYY
              const dateFormatMatch = command.match(/(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/)
              if (dateFormatMatch) {
                const day = dateFormatMatch[1]
                const month = dateFormatMatch[2]
                const year = dateFormatMatch[3] || getBulgariaTime().getFullYear()
                result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                console.log('📅 Extracted date:', result.date)
              }
            }
            
            // Ако все още няма дата, пробвай да я извлечеш от текстов формат (например "15 август 2025")
            if (!result.date) {
              const textDateMatch = command.match(/(\d{1,2})\s+(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)\s+(\d{4})/i)
              if (textDateMatch) {
                const day = textDateMatch[1]
                const monthName = textDateMatch[2].toLowerCase()
                const year = textDateMatch[3]
                
                const monthMap: { [key: string]: string } = {
                  'януари': '01', 'февруари': '02', 'март': '03', 'април': '04',
                  'май': '05', 'юни': '06', 'юли': '07', 'август': '08',
                  'септември': '09', 'октомври': '10', 'ноември': '11', 'декември': '12'
                }
                
                const month = monthMap[monthName]
                if (month) {
                  result.date = `${year}-${month}-${day.padStart(2, '0')}`
                  console.log('📅 Extracted text date:', result.date)
                }
              }
            }
            
            // Ако все още няма дата, пробвай да я извлечеш от числови формати (например "първи август 2025")
            if (!result.date) {
              const ordinalDateMatch = command.match(/(първи|втори|трети|четвърти|пети|шести|седми|осми|девети|десети|единадесети|дванадесети|тринадесети|четиринадесети|петнадесети|шестнадесети|седемнадесети|осемнадесети|деветнадесети|двадесети|двадесет и първи|двадесет и втори|двадесет и трети|двадесет и четвърти|двадесет и пети|двадесет и шести|двадесет и седми|двадесет и осми|двадесет и девети|тридесети|тридесет и първи)\s+(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)\s+(\d{4})(?:\s+година)?/i)
              if (ordinalDateMatch) {
                const dayName = ordinalDateMatch[1].toLowerCase()
                const monthName = ordinalDateMatch[2].toLowerCase()
                const year = ordinalDateMatch[3]
                
                const dayMap: { [key: string]: string } = {
                  'първи': '01', 'втори': '02', 'трети': '03', 'четвърти': '04', 'пети': '05',
                  'шести': '06', 'седми': '07', 'осми': '08', 'девети': '09', 'десети': '10',
                  'единадесети': '11', 'дванадесети': '12', 'тринадесети': '13', 'четиринадесети': '14', 'петнадесети': '15',
                  'шестнадесети': '16', 'седемнадесети': '17', 'осемнадесети': '18', 'деветнадесети': '19', 'двадесети': '20',
                  'двадесет и първи': '21', 'двадесет и втори': '22', 'двадесет и трети': '23', 'двадесет и четвърти': '24', 'двадесет и пети': '25',
                  'двадесет и шести': '26', 'двадесет и седми': '27', 'двадесет и осми': '28', 'двадесет и девети': '29', 'тридесети': '30', 'тридесет и първи': '31'
                }
                
                const monthMap: { [key: string]: string } = {
                  'януари': '01', 'февруари': '02', 'март': '03', 'април': '04',
                  'май': '05', 'юни': '06', 'юли': '07', 'август': '08',
                  'септември': '09', 'октомври': '10', 'ноември': '11', 'декември': '12'
                }
                
                const day = dayMap[dayName]
                const month = monthMap[monthName]
                if (day && month) {
                  result.date = `${year}-${month}-${day}`
                  console.log('📅 Extracted ordinal date:', result.date)
                }
              }
            }
            
            // Ако не е намерен час, пробвай да го извлечеш от различни формати
            if (!result.time) {
              // Търси час във формат HH:MM
              const timeFormatMatch = command.match(/(\d{1,2}):(\d{2})/)
              if (timeFormatMatch) {
                const hour = timeFormatMatch[1].padStart(2, '0')
                const minute = timeFormatMatch[2]
                result.time = `${hour}:${minute}`
                console.log('🕐 Extracted time:', result.time)
              }
            }
            
            // Ако все още няма час, пробвай да го извлечеш от "от X часа" формат
            if (!result.time) {
              const fromHourMatch = command.match(/от\s+(\d{1,2})\s+(?:часа|час)/i)
              if (fromHourMatch) {
                const hour = fromHourMatch[1].padStart(2, '0')
                result.time = `${hour}:00`
                console.log('🕐 Extracted time from "от X часа":', result.time)
              }
            }
            
            // Ако все още няма час, пробвай да го извлечеш от "в X часа" формат
            if (!result.time) {
              const atHourMatch = command.match(/в\s+(\d{1,2})\s+(?:часа|час)/i)
              if (atHourMatch) {
                const hour = atHourMatch[1].padStart(2, '0')
                result.time = `${hour}:00`
                console.log('🕐 Extracted time from "в X часа":', result.time)
              }
            }
            
            // Ако все още няма час, пробвай да го извлечеш от "от HH:MM" формат
            if (!result.time) {
              const fromTimeMatch = command.match(/от\s+(\d{1,2}):(\d{2})/i)
              if (fromTimeMatch) {
                const hour = fromTimeMatch[1].padStart(2, '0')
                const minute = fromTimeMatch[2]
                result.time = `${hour}:${minute}`
                console.log('🕐 Extracted time from "от HH:MM":', result.time)
              }
            }
            
            // Ако все още няма дата, пробвай да я извлечеш от края на командата
            if (!result.date) {
              // Търси дата след името на потребителя
              const afterNameMatch = command.match(new RegExp(`${result.name}\\s+([0-9]{1,2}\\.[0-9]{1,2}(?:\\.[0-9]{4})?)`, 'i'))
              if (afterNameMatch) {
                const dateStr = afterNameMatch[1]
                const dateParts = dateStr.split('.')
                if (dateParts.length >= 2) {
                  const day = dateParts[0]
                  const month = dateParts[1]
                  const year = dateParts[2] || getBulgariaTime().getFullYear()
                  result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
                  console.log('📅 Extracted date from after name:', result.date)
                }
              }
            }
            
            // Ако все още няма дата, пробвай да я извлечеш след "за" или "на"
            if (!result.date) {
              const forDateMatch = command.match(/(?:за|на)\s+(\d{1,2})\s+(януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)\s+(\d{4})/i)
              if (forDateMatch) {
                const day = forDateMatch[1]
                const monthName = forDateMatch[2].toLowerCase()
                const year = forDateMatch[3]
                
                const monthMap: { [key: string]: string } = {
                  'януари': '01', 'февруари': '02', 'март': '03', 'април': '04',
                  'май': '05', 'юни': '06', 'юли': '07', 'август': '08',
                  'септември': '09', 'октомври': '10', 'ноември': '11', 'декември': '12'
                }
                
                const month = monthMap[monthName]
                if (month) {
                  result.date = `${year}-${month}-${day.padStart(2, '0')}`
                  console.log('📅 Extracted date from "за/на":', result.date)
                }
              }
            }
            
            // Ако все още няма час, пробвай да го извлечеш от края на командата
            if (!result.time) {
              // Търси час след датата
              const afterDateMatch = command.match(/(\d{1,2}):(\d{2})/)
              if (afterDateMatch) {
                const hour = afterDateMatch[1].padStart(2, '0')
                const minute = afterDateMatch[2]
                result.time = `${hour}:${minute}`
                console.log('🕐 Extracted time from after date:', result.time)
              }
            }
            
            break
          case 'updateBooking':
            result.name = match[1]?.trim()
            
            const updateDateMatch = command.match(/(?:дата|ден)\s+([^\s]+)/i)
            const updateTimeMatch = command.match(/(?:час|време)\s+([^\s]+)/i)
            
            result.date = updateDateMatch?.[1]?.trim()
            result.time = updateTimeMatch?.[1]?.trim()
            break
          case 'cancelBooking':
            result.name = match[1]?.trim()
            
            const cancelDateMatch = command.match(/(?:дата|ден)\s+([^\s]+)/i)
            result.date = cancelDateMatch?.[1]?.trim()
            break
          case 'deleteBooking':
            result.name = match[1]?.trim()
            
            const deleteDateMatch = command.match(/(?:дата|ден)\s+([^\s]+)/i)
            result.date = deleteDateMatch?.[1]?.trim()
            break
          case 'checkAvailability':
            result.date = match[1]?.trim()
            break
          case 'showBookings':
            result.date = match[1]?.trim()
            break
        }

        console.log('📤 Parsed result:', result)
        console.log('================================')
        return result
      }
    }

    console.log('❌ No pattern matched')
    console.log('================================')
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
    'изтрий резервация',
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
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      await recognitionRef.current.start()
      
      // Set a longer timeout (10 seconds) before auto-stopping
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && voiceState.isListening) {
          console.log('🎤 Auto-stopping voice recognition after timeout')
          recognitionRef.current.stop()
        }
      }, 10000) // 10 seconds
      
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      setVoiceState(prev => ({ 
        ...prev, 
        error: 'Грешка при стартиране на гласовото разпознаване' 
      }))
    }
  }, [voiceState.isMobile, voiceState.isSupported, voiceState.isListening])

  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    setVoiceState(prev => ({ ...prev, isListening: false }))
  }, [])

  const handleVoiceSubmit = useCallback(async () => {
    if (!voiceState.transcript.trim()) return

    setIsProcessing(true)
    setVoiceState(prev => ({ ...prev, error: '' }))
    setSuccess('')

    try {
      // Clean the transcript before parsing - replace klyomba with @ symbol
      const cleanedTranscript = cleanTranscript(voiceState.transcript)
      
      // Check if original transcript was longer than cleaned (indicating multiple commands)
      if (voiceState.transcript.length > cleanedTranscript.length + 50) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Открити са множество команди. Изпълнява се само първата команда.' 
        }))
        // Update the transcript to show only the first command
        setVoiceState(prev => ({ ...prev, transcript: cleanedTranscript }))
      }
      
      // Parse the voice command
      const parsedCommand = parseVoiceCommand(cleanedTranscript)
      
      if (!parsedCommand.action) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Неразпозната команда. Опитайте отново.' 
        }))
        return
      }

      console.log('📤 Sending command to API:', parsedCommand)

      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsedCommand)
      })

      const result = await response.json()
      console.log('📥 API response:', result)

      if (result.success) {
        setSuccess(result.message || 'Командата е изпълнена успешно')
        setVoiceState(prev => ({ ...prev, transcript: '' }))
        onCommand(voiceState.transcript)
      } else {
        setVoiceState(prev => ({ ...prev, error: result.error || 'Грешка при обработка на командата' }))
      }
    } catch (error) {
      console.error('Voice command error:', error)
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
      // Clean the command before parsing - replace klyomba with @ symbol
      const cleanedCommand = cleanTranscript(command)
      
      // Parse the command
      const parsedCommand = parseVoiceCommand(cleanedCommand)
      
      if (!parsedCommand.action) {
        setVoiceState(prev => ({ 
          ...prev, 
          error: 'Неразпозната команда. Опитайте отново.' 
        }))
        return
      }

      console.log('📤 Sending smart command to API:', parsedCommand)

      const response = await fetch('/api/admin/voice-commands', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsedCommand)
      })

      const result = await response.json()
      console.log('📥 API response:', result)

      if (result.success) {
        setSuccess(result.message || 'Командата е изпълнена успешно')
        onCommand(command)
      } else {
        setVoiceState(prev => ({ ...prev, error: result.error || 'Грешка при обработка на командата' }))
      }
    } catch (error) {
      console.error('Smart command error:', error)
      setVoiceState(prev => ({ ...prev, error: 'Грешка при изпращане на командата' }))
    } finally {
      setIsProcessing(false)
    }
  }, [onCommand])

  // Helper function to clean transcript
  const cleanTranscript = (text: string): string => {
    // Clean the text and take only the first command if multiple are present
    let cleaned = text
      .replace(/\bкльомба\b/gi, '@')
      .replace(/\bklyomba\b/gi, '@')
    
    // If there are multiple commands (separated by common patterns), take only the first one
    const commandSeparators = [
      /промени потребител.*?(?=промени потребител)/gi,
      /добави потребител.*?(?=добави потребител)/gi,
      /изтрий потребител.*?(?=изтрий потребител)/gi,
      /добави резервация.*?(?=добави резервация)/gi,
      /промени резервация.*?(?=промени резервация)/gi,
      /отмени резервация.*?(?=отмени резервация)/gi,
      /запази час.*?(?=запази час)/gi,
      /запиши час.*?(?=запиши час)/gi
    ]
    
    // Find the first complete command
    for (const separator of commandSeparators) {
      const match = cleaned.match(separator)
      if (match) {
        cleaned = match[0].trim()
        break
      }
    }
    
    // If the text is too long (more than 200 characters), truncate it
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200) + '...'
    }
    
    return cleaned
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Гласови команди</h3>
            {voiceState.isMobile && <Smartphone className="w-4 h-4 text-gray-500" />}
          </div>
          <div className="flex items-center space-x-2">
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                title="Затвори"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Voice Recognition Section */}
        {voiceState.isSupported ? (
          <div className="space-y-3">
            {/* Voice Button */}
            <div className="flex justify-center">
              <button
                data-voice-trigger
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
                  onChange={(e) => {
                    // Clean the input when user types - replace klyomba with @ symbol
                    const cleanValue = e.target.value
                      .replace(/\bкльомба\b/gi, '@')
                      .replace(/\bklyomba\b/gi, '@')
                    setVoiceState(prev => ({ ...prev, transcript: cleanValue }))
                  }}
                  placeholder="Вашата команда ще се появи тук..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
                
                {/* Warning for multiple commands */}
                {voiceState.transcript.length > 150 && (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    ⚠️ Дълга команда открита. Уверете се, че въвеждате само една команда.
                  </div>
                )}
                
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
                    // Clean the input before sending - replace klyomba with @ symbol
                    const cleanValue = cleanTranscript(target.value.trim())
                    handleSmartCommand(cleanValue)
                    target.value = ''
                  }
                }
              }}
            />
            
            <div className="grid grid-cols-2 gap-1">
              {voiceTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Clean the template before sending - replace klyomba with @ symbol
                    const cleanTemplate = template
                      .replace(/\bкльомба\b/gi, '@')
                      .replace(/\bklyomba\b/gi, '@')
                    handleSmartCommand(cleanTemplate)
                  }}
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