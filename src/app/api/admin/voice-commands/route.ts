import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

interface ParsedCommand {
  action: 'create_booking' | 'update_booking' | 'delete_booking' | 'create_user' | 'update_user' | 'delete_user' | 'check_availability' | 'unknown'
  patientName?: string
  phone?: string
  email?: string
  date?: string
  time?: string
  service?: string
  bookingId?: string
  userId?: string
  message?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== VOICE COMMAND API CALLED ===')
    const adminToken = request.headers.get('x-admin-token')
    console.log('Admin token:', adminToken)
    
    if (!adminToken) {
      console.log('No admin token provided')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Received body:', body)
    
    const { voiceCommand, email } = body
    console.log('Voice command:', voiceCommand)
    console.log('Email:', email)
    
    const command = parseVoiceCommand(voiceCommand)
    console.log('Parsed command:', command)
    
    // Add email directly for voice commands
    if (email) {
      command.email = email
    }
    
    console.log('Final command:', command)
    
    const result = await executeCommand(command)
    console.log('Execute result:', result)
    
    return NextResponse.json({
      success: true,
      message: result.message,
      parsedCommand: command,
      result
    })
  } catch (error) {
    console.error('Voice command error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function parseVoiceCommand(command: string): ParsedCommand {
  const lowerCommand = command.toLowerCase()
  console.log('Parsing command:', lowerCommand)
  console.log('Original command:', command)
  console.log('Lower command:', lowerCommand)
  
  // Declare all variables at the beginning
  let patientName: string | undefined
  let date: string | undefined
  let time: string | undefined
  let service: string | undefined
  let phone: string | undefined
  let email: string | undefined
  let userId: string | undefined
  let action: ParsedCommand['action'] = 'unknown'

  // Extract patient name - improved pattern
  const namePatterns = [
    // FIXED: User management patterns FIRST - extract only the name part
    /(?:добави|създай|нов|регистрирай)\s+(?:потребител|клиент)\s+([а-яё\s]+?)(?:\s+(?:имейл|email|телефон|тел|phone|име|name))/i,
    /(?:добави|създай|нов|регистрирай)\s+(?:потребител|клиент)\s+([а-яё\s]+?)(?:\s|$)/i,
    /(?:промени|редактирай|измени|обнови)\s+(?:потребител|клиент)\s+([а-яё\s]+?)(?:\s+(?:имейл|email|телефон|тел|phone|име|name))/i,
    /(?:промени|редактирай|измени|обнови)\s+(?:потребител|клиент)\s+([а-яё\s]+?)(?:\s|$)/i,
    /(?:изтрий|премахни|удали)\s+(?:потребител|клиент)\s+([а-яё\s]+?)(?:\s+(?:имейл|email|телефон|тел|phone|име|name)|$)/i,
    // Booking patterns SECOND
    /(?:запази|резервирай|направи|резервация)\s+(?:ми\s+)?(?:час|резервация)\s+(?:за|на)\s+([а-яё\s]+?)(?:\s+(?:за|на|от|в|в\s+|\d|август|септември|октомври|ноември|декември|януари|февруари|март|април|май|юни|юли))/i,
    /(?:за|на)\s+([а-яё\s]+?)(?:\s+(?:за|на|от|в|в\s+|\d|август|септември|октомври|ноември|декември|януари|февруари|март|април|май|юни|юли))/i,
    /(?:час|резервация)\s+(?:за|на)\s+([а-яё\s]+?)(?:\s+(?:за|на|от|в|в\s+|\d|август|септември|октомври|ноември|декември|януари|февруари|март|април|май|юни|юли))/i,
    /^([а-яё\s]+?)\s+(?:за|на|от|в|в\s+|\d|август|септември|октомври|ноември|декември|януари|февруари|март|април|май|юни|юли)/i
  ]
  
  for (const pattern of namePatterns) {
    const nameMatch = command.match(pattern)
    console.log('Trying name pattern:', pattern, 'match:', nameMatch)
    if (nameMatch) {
      patientName = nameMatch[1].trim()
      console.log('Found patient name:', patientName, 'from pattern:', pattern)
      break
    }
  }

  // Determine action - improved detection
  const createBookingKeywords = ['запази', 'резервирай', 'направи резервация', 'създай резервация', 'добави резервация', 'резервация', 'час', 'запази час', 'резервирай час', 'резервация за']
  const updateBookingKeywords = ['промени резервация', 'редактирай резервация', 'измени резервация', 'обнови резервация']
  const deleteBookingKeywords = ['изтрий резервация', 'отмени резервация', 'премахни резервация', 'удали резервация']
  const checkAvailabilityKeywords = ['провери', 'свободни часове', 'налични часове', 'свободно време', 'налично време', 'кога е свободно', 'кога има час', 'покажи часове', 'свободни слотове']
  
  const createUserKeywords = ['добави потребител', 'създай потребител', 'нов потребител', 'регистрирай потребител', 'добави клиент', 'създай клиент', 'нов клиент', 'add user', 'create user', 'new user', 'register user']
  const updateUserKeywords = ['промени потребител', 'редактирай потребител', 'измени потребител', 'обнови потребител', 'промени клиент', 'редактирай клиент', 'измени клиент', 'обнови клиент', 'update user', 'edit user', 'modify user', 'change user']
  const deleteUserKeywords = ['изтрий потребител', 'премахни потребител', 'удали потребител', 'изтрий клиент', 'премахни клиент', 'удали клиент', 'delete user', 'remove user', 'erase user']
  
  console.log('Checking action keywords in command:', lowerCommand)
  
  // Check for user management actions first (more specific)
  console.log('Checking createUserKeywords:', createUserKeywords)
  console.log('Checking updateUserKeywords:', updateUserKeywords)
  console.log('Checking deleteUserKeywords:', deleteUserKeywords)
  
  if (createUserKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'create_user'
    console.log('Detected create_user action from keywords')
  } else if (updateUserKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'update_user'
    console.log('Detected update_user action from keywords')
  } else if (deleteUserKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'delete_user'
    console.log('Detected delete_user action from keywords')
  } else if (checkAvailabilityKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'check_availability'
    console.log('Detected check_availability action from keywords')
  } else if (createBookingKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'create_booking'
    console.log('Detected create_booking action from keywords')
  } else if (updateBookingKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'update_booking'
    console.log('Detected update_booking action from keywords')
  } else if (deleteBookingKeywords.some(keyword => lowerCommand.includes(keyword))) {
    action = 'delete_booking'
    console.log('Detected delete_booking action from keywords')
  } else {
    console.log('No action keywords found in command')
    console.log('Command:', lowerCommand)
    console.log('updateUserKeywords:', updateUserKeywords)
    console.log('Checking each keyword:')
    updateUserKeywords.forEach(keyword => {
      console.log(`  "${keyword}" in command: ${lowerCommand.includes(keyword)}`)
    })
  }
  
  console.log('Final action detected:', action)

  // If we have patient name, date, time, or service but no action, assume create_booking
  if (action === 'unknown' && (patientName || date || time || service)) {
    action = 'create_booking'
    console.log('Assuming create_booking action based on extracted data')
  }

  // Extract date - improved pattern with ordinal numbers
  // Only extract date for booking actions and check_availability
  if (action === 'create_booking' || action === 'update_booking' || action === 'delete_booking' || action === 'check_availability' || action === 'unknown') {
    const datePatterns = [
      /(\d{1,2})\s+(?:януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/,
      /(?:на|за)\s+(\d{1,2})\s+(?:януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/,
      /(?:първи|втори|трети|четвърти|пети|шести|седми|осми|девети|десети|единадесети|дванадесети|тринадесети|четиринадесети|петнадесети|шестнадесети|седемнадесети|осемнадесети|деветнадесети|двадесети|двадесет\s+и\s+първи)\s+(?:януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/,
      // Add pattern for "за пети октомври" format
      /(?:за|на)\s+(?:първи|втори|трети|четвърти|пети|шести|седми|осми|девети|десети|единадесети|дванадесети|тринадесети|четиринадесети|петнадесети|шестнадесети|седемнадесети|осемнадесети|деветнадесети|двадесети|двадесет\s+и\s+първи|двадесет\s+и\s+втори|двадесет\s+и\s+трети|двадесет\s+и\s+четвърти|двадесет\s+и\s+пети|двадесет\s+и\s+шести|двадесет\s+и\s+седми|двадесет\s+и\s+осми|двадесет\s+и\s+девети|двадесет\s+и\s+десети|тридесети|тридесет\s+и\s+първи)\s+(?:януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/
    ]
    
    for (const pattern of datePatterns) {
      const dateMatch = lowerCommand.match(pattern)
      console.log('Trying date pattern:', pattern, 'match:', dateMatch)
      if (dateMatch && dateMatch[1]) {
        const day = dateMatch[1]
        const month = lowerCommand.match(/(?:януари|февруари|март|април|май|юни|юли|август|септември|октомври|ноември|декември)/)?.[0]
        
        console.log('Extracted day:', day, 'month:', month)
        
        if (day && month) {
          const monthMap: { [key: string]: number } = {
            'януари': 0, 'февруари': 1, 'март': 2, 'април': 3, 'май': 4, 'юни': 5,
            'юли': 6, 'август': 7, 'септември': 8, 'октомври': 9, 'ноември': 10, 'декември': 11
          }
          
          const ordinalMap: { [key: string]: number } = {
            'първи': 1, 'втори': 2, 'трети': 3, 'четвърти': 4, 'пети': 5, 'шести': 6, 'седми': 7, 'осми': 8, 'девети': 9, 'десети': 10,
            'единадесети': 11, 'дванадесети': 12, 'тринадесети': 13, 'четиринадесети': 14, 'петнадесети': 15, 'шестнадесети': 16,
            'седемнадесети': 17, 'осемнадесети': 18, 'деветнадесети': 19, 'двадесети': 20,
            'двадесет и първи': 21, 'двадесет и втори': 22, 'двадесет и трети': 23, 'двадесет и четвърти': 24, 'двадесет и пети': 25,
            'двадесет и шести': 26, 'двадесет и седми': 27, 'двадесет и осми': 28, 'двадесет и девети': 29, 'двадесет и десети': 30,
            'тридесети': 30, 'тридесет и първи': 31
          }
          
          let dayNumber: number
          if (ordinalMap[day]) {
            dayNumber = ordinalMap[day]
            console.log('Using ordinal mapping for day:', day, '->', dayNumber)
          } else {
            dayNumber = parseInt(day)
            console.log('Using numeric parsing for day:', day, '->', dayNumber)
          }
          
          const monthNumber = monthMap[month]
          const currentYear = new Date().getFullYear()
          const targetDate = new Date(currentYear, monthNumber, dayNumber)
          
          // If the date is in the past, assume next year
          if (targetDate < new Date()) {
            targetDate.setFullYear(currentYear + 1)
          }
          
          date = targetDate.toISOString().split('T')[0]
          console.log('Found date:', date, 'from pattern:', pattern, 'day:', day, 'month:', month, 'dayNumber:', dayNumber, 'monthNumber:', monthNumber)
          break
        }
      }
    }
  }

  // Extract time - improved patterns
  const timePatterns = [
    /(?:от|в|в\s+|до)(\d{1,2}):(\d{2})/, // от 10:30, в 14:45, до 10:30
    /(?:от|в|в\s+|до)(\d{1,2})\s+часа/, // от 10 часа, в 14 часа, до 10 часа
    /(?:от|в|в\s+|до)(\d{1,2}):(\d{2})\s+часа/, // от 10:30 часа, в 14:45 часа, до 10:30 часа
    /(\d{1,2}):(\d{2})/, // 10:30, 14:45
    /(\d{1,2})\s+часа/, // 10 часа, 14 часа
  ]
  
  for (const pattern of timePatterns) {
    const timeMatch = lowerCommand.match(pattern)
    if (timeMatch && timeMatch[1]) {
      if (timeMatch[2]) {
        // Format: HH:MM
        const hours = timeMatch[1].padStart(2, '0')
        const minutes = timeMatch[2].padStart(2, '0')
        time = `${hours}:${minutes}`
      } else {
        // Format: HH часа
        const hours = timeMatch[1].padStart(2, '0')
        time = `${hours}:00`
      }
      console.log('Found time:', time, 'from pattern:', pattern)
      break
    }
  }

  // Extract phone number
  const phonePatterns = [
    /(\d{3}\s*\d{3}\s*\d{3})/, // 088 123 456
    /(\d{10})/, // 0881234567
    /(\+359\s*\d{3}\s*\d{3}\s*\d{3})/, // +359 88 123 456
    /(\d{3}-\d{3}-\d{3})/, // 088-123-456
    /телефон\s*(\d{3}\s*\d{3}\s*\d{3})/, // телефон 088 123 456
    /тел\s*(\d{3}\s*\d{3}\s*\d{3})/, // тел 088 123 456
    // New patterns for spaced digits
    /телефон\s*((?:\d\s*){10})/, // телефон 0 8 1 2 3 4 5 6 7 8
    /тел\s*((?:\d\s*){10})/, // тел 0 8 1 2 3 4 5 6 7 8
    /((?:\d\s*){10})/, // 0 8 1 2 3 4 5 6 7 8
  ]
  
  for (const pattern of phonePatterns) {
    const phoneMatch = lowerCommand.match(pattern)
    if (phoneMatch && phoneMatch[1]) {
      // Clean up phone number (remove spaces and dashes)
      phone = phoneMatch[1].replace(/[\s\-]/g, '')
      
      // Add +359 prefix if it's a 9-digit number starting with 8 or 9
      if (phone.length === 9 && (phone.startsWith('8') || phone.startsWith('9'))) {
        phone = '+359' + phone
      }
      // Add +359 prefix if it's a 10-digit number starting with 0
      else if (phone.length === 10 && phone.startsWith('0')) {
        phone = '+359' + phone.substring(1)
      }
      
      console.log('Found phone:', phone, 'from pattern:', pattern)
      break
    }
  }

  // Extract email address
  const emailPatterns = [
    // Universal pattern for both Cyrillic and Latin names with spaces (FIRST)
    /(?:имейл|email)\s+([а-яё\s]+)\s+([a-zA-Z0-9.-]+)\s+([a-zA-Z]{2,})/, // имейл мария маймунско abv.bg
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // Standard email
    /email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // email user@domain.com
    /имейл\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/, // имейл user@domain.com
    /([a-zA-Z0-9._%+-]+)\s+at\s+([a-zA-Z0-9.-]+)\s+dot\s+([a-zA-Z]{2,})/, // user at domain dot com
    /([a-zA-Z0-9._%+-]+)\s+@\s+([a-zA-Z0-9.-]+)\s+\.\s+([a-zA-Z]{2,})/, // user @ domain . com
  ]
  
  console.log('Extracting email from command:', lowerCommand)
  for (const pattern of emailPatterns) {
    const emailMatch = lowerCommand.match(pattern)
    console.log('Trying email pattern:', pattern, 'match:', emailMatch)
    if (emailMatch && emailMatch[1]) {
      console.log('Email match found:', emailMatch)
      if (emailMatch.length === 4) {
        // Handle "user at domain dot com" format
        email = `${emailMatch[1]}@${emailMatch[2]}.${emailMatch[3]}`
      } else if (emailMatch.length === 3) {
        // Handle "user @ domain . com" format OR "user domain com" format
        if (emailMatch[2] && emailMatch[3]) {
          email = `${emailMatch[1].replace(/\s+/g, '')}@${emailMatch[2]}.${emailMatch[3]}`
        } else {
          email = emailMatch[1]
        }
      } else {
        email = emailMatch[1]
      }
      
      console.log('Found email:', email, 'from pattern:', pattern)
      break
    }
  }
  
  // If no email found, try to extract from the command manually
  if (!email) {
    console.log('No email found with patterns, trying manual extraction')
    console.log('Command to extract from:', lowerCommand)
    
    // Try to find email after "имейл" keyword with spaces
    const emailMatch = lowerCommand.match(/имейл\s+([а-яё\s]+)\s+([a-zA-Z0-9.-]+)\s+([a-zA-Z]{2,})/)
    console.log('Email match result:', emailMatch)
    
    if (emailMatch) {
      // Convert Cyrillic to Latin for email
      const cyrillicToLatin: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht',
        'ъ': 'a', 'ь': '', 'ю': 'yu', 'я': 'ya',
        'кльомба': 'klomba', 'маймунско': 'majmunsko', 'маймунска': 'majmunska', 
        'маймунски': 'majmunski', 'кльомби': 'klombi', 'кльомбо': 'klombo'
      }
      
      let latinName = emailMatch[1].replace(/\s+/g, '')
      console.log('Original name:', emailMatch[1], 'Cleaned name:', latinName)
      
      // Convert Cyrillic to Latin
      for (const [cyrillic, latin] of Object.entries(cyrillicToLatin)) {
        latinName = latinName.replace(new RegExp(cyrillic, 'g'), latin)
      }
      
      email = `${latinName}@${emailMatch[2]}.${emailMatch[3]}`
      console.log('Final email:', email)
    }
  }

  // Format patient name with capital letters
  if (patientName) {
    patientName = patientName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  // Extract user ID (for update/delete operations)
  const userIdPatterns = [
    /потребител\s*(\d+)/, // потребител 123
    /ID\s*(\d+)/, // ID 123
    /номер\s*(\d+)/, // номер 123
    /(\d+)\s*потребител/, // 123 потребител
  ]
  
  for (const pattern of userIdPatterns) {
    const userIdMatch = lowerCommand.match(pattern)
    if (userIdMatch && userIdMatch[1]) {
      userId = userIdMatch[1]
      console.log('Found user ID:', userId, 'from pattern:', pattern)
      break
    }
  }

  // Extract service - AFTER extracting patient name to avoid conflicts
  const servicePatterns = [
    /(?:за|на)\s+(почистване|преглед|лечение|отбелязване|ортодонтия|кариес|зъби|почистване на зъби|лечение на зъби|преглед на зъби)/,
    /(?:почистване|преглед|лечение|отбелязване|ортодонтия|кариес|зъби|почистване на зъби|лечение на зъби|преглед на зъби)/
  ]
  
  for (const pattern of servicePatterns) {
    const serviceMatch = lowerCommand.match(pattern)
    if (serviceMatch) {
      service = serviceMatch[1] || serviceMatch[0]
      console.log('Found service:', service, 'from pattern:', pattern)
      break
    }
  }

  console.log('Parsed command:', { action, patientName, date, time, service })

  return {
    action,
    patientName,
    phone,
    email,
    date,
    time,
    service,
    userId,
    message: `Разбрах: ${action === 'create_booking' ? 'създаване на резервация' : 
              action === 'update_booking' ? 'редактиране на резервация' : 
              action === 'delete_booking' ? 'изтриване на резервация' :
              action === 'create_user' ? 'създаване на потребител' :
              action === 'update_user' ? 'редактиране на потребител' :
              action === 'delete_user' ? 'изтриване на потребител' : 'неизвестна команда'}`
  }
}

async function executeCommand(command: ParsedCommand) {
  const db = await getDatabase()
  
  if (command.action === 'check_availability') {
    // Get target date from command or use today
    let targetDate = command.date
    if (!targetDate) {
      // Use today if no date specified
      targetDate = new Date().toISOString().split('T')[0]
    }

    // Get all bookings for the target date
    const bookings = await db.all(`
      SELECT * FROM bookings 
      WHERE date = ? AND status != 'cancelled'
      ORDER BY time
    `, [targetDate])

    // Get all services to calculate duration
    const services = await db.all('SELECT * FROM services WHERE isActive = 1')
    const serviceMap = new Map(services.map(s => [s.id, s.duration]))

    // Define working hours (9:00-17:00)
    const workingHours = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', 
                         '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

    // Find available slots
    const availableSlots = []
    for (const time of workingHours) {
      let isAvailable = true
      
      // Check if any booking overlaps with this time
      for (const booking of bookings) {
        const bookingTime = booking.time
        const serviceDuration = serviceMap.get(booking.service) || 30 // default 30 min
        
        // Calculate booking end time
        const [bookingHour, bookingMin] = bookingTime.split(':').map(Number)
        const bookingEnd = new Date(2000, 0, 1, bookingHour, bookingMin + serviceDuration)
        const bookingEndTime = `${bookingEnd.getHours().toString().padStart(2, '0')}:${bookingEnd.getMinutes().toString().padStart(2, '0')}`
        
        // Check if current time slot overlaps with existing booking
        const [currentHour, currentMin] = time.split(':').map(Number)
        const currentEnd = new Date(2000, 0, 1, currentHour, currentMin + 30) // assume 30 min slot
        const currentEndTime = `${currentEnd.getHours().toString().padStart(2, '0')}:${currentEnd.getMinutes().toString().padStart(2, '0')}`
        
        if (time < bookingEndTime && currentEndTime > bookingTime) {
          isAvailable = false
          break
        }
      }
      
      if (isAvailable) {
        availableSlots.push(time)
      }
    }

    const dateStr = new Date(targetDate).toLocaleDateString('bg-BG')
    
    if (availableSlots.length === 0) {
      return {
        success: true,
        message: `На ${dateStr} няма свободни часове. Всички часове са заети.`,
        availableSlots: [],
        targetDate: targetDate
      }
    } else {
      const slotsText = availableSlots.slice(0, 8).join(', ') // Show first 8 slots
      const moreText = availableSlots.length > 8 ? ` и още ${availableSlots.length - 8} часа` : ''
      
      return {
        success: true,
        message: `Свободни часове на ${dateStr}: ${slotsText}${moreText}. Общо ${availableSlots.length} свободни часа.`,
        availableSlots: availableSlots,
        targetDate: targetDate,
        dateStr: dateStr
      }
    }
  }

  if (command.action === 'create_booking') {
    if (!command.patientName || !command.date || !command.time) {
      return {
        success: false,
        message: 'Липсва информация за резервацията. Нужни са: име, дата и час.'
      }
    }

    // Get service ID based on service name
    let serviceId = 1 // default
    if (command.service) {
      const serviceMap: Record<string, number> = {
        'почистване': 2,
        'преглед': 1,
        'лечение': 3,
        'отбелязване': 4,
        'ортодонтия': 5,
        'кариес': 3,
        'зъби': 2
      }
      serviceId = serviceMap[command.service] || 1
    }

    // Check if slot is available
    const existingBooking = await db.get(`
      SELECT * FROM bookings 
      WHERE date = ? AND time = ? AND status != 'cancelled'
    `, [command.date, command.time])

    if (existingBooking) {
      return {
        success: false,
        message: `Този час (${command.time}) на ${command.date} вече е зает.`
      }
    }

    // Generate a default phone number for voice commands
    let defaultPhone = '+359888000000'

    // Use phone from voice command if provided
    if (command.phone) {
      defaultPhone = command.phone
    } else {
      // Generate a unique phone number if none provided
      const timestamp = Date.now()
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      defaultPhone = `+359888${timestamp.toString().slice(-6)}${randomSuffix}`
    }

    // Find user by name (case-insensitive)
    let user = await db.get('SELECT * FROM users WHERE LOWER(name) = LOWER(?)', [command.patientName])
    console.log('Searching for user with name:', command.patientName)
    console.log('Found user:', user)
    
    // Also try to find all users to see what's in the database
    const allUsers = await db.all('SELECT * FROM users')
    console.log('All users in database:', allUsers.map(u => ({ id: u.id, name: u.name })))
    
    if (!user) {
      // Create new user with generated unique phone and email
      const userResult = await db.run(`
        INSERT INTO users (name, phone, email)
        VALUES (?, ?, ?)
      `, [command.patientName, defaultPhone, command.email || null])
      
      user = {
        id: userResult.lastID,
        name: command.patientName,
        phone: defaultPhone,
        email: command.email || null
      }
      console.log('Created new user:', user)
    } else {
      // Update existing user's phone and email if provided
      const updateFields = []
      const updateValues = []
      
      if (command.phone && command.phone !== user.phone) {
        // Check if new phone already exists
        const existingUserWithNewPhone = await db.get('SELECT * FROM users WHERE phone = ? AND id != ?', [command.phone, user.id])
        if (existingUserWithNewPhone) {
          return {
            success: false,
            message: `Потребител с телефон ${command.phone} вече съществува.`
          }
        }
        
        // Migrate all bookings and data to new phone number
        await db.run('UPDATE bookings SET phone = ? WHERE phone = ?', [command.phone, user.phone])
        
        updateFields.push('phone = ?')
        updateValues.push(command.phone)
      }
      
      if (command.email && command.email !== user.email) {
        updateFields.push('email = ?')
        updateValues.push(command.email)
      }
      
      if (updateFields.length > 0) {
        updateValues.push(user.id)
        await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)
        
        // Update user object
        if (command.phone) user.phone = command.phone
        if (command.email) user.email = command.email
        
        console.log('Updated user:', user)
      }
      defaultPhone = user.phone
    }

    // Create booking
    try {
      await db.run(`
        INSERT INTO bookings (name, phone, service, date, time, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `, [command.patientName, user.phone, serviceId, command.date, command.time])

      return {
        success: true,
        message: `Резервацията е създадена успешно за ${command.patientName} на ${command.date} в ${command.time}. Потребител: ${user.name}, Телефон: ${user.phone}`
      }
    } catch (error) {
      console.error('Voice command error:', error)
      return {
        success: false,
        message: `Грешка при създаване на резервацията: ${error instanceof Error ? error.message : 'Неизвестна грешка'}`
      }
    }
  }
  
  // Handle user management commands
  if (command.action === 'create_user') {
    if (!command.patientName) {
      return {
        success: false,
        message: 'Липсва име на потребителя.'
      }
    }

    const defaultPhone = command.phone || '+359888000000'
    
    // Check if user already exists by phone (unique identifier)
    const existingUser = await db.get('SELECT * FROM users WHERE phone = ?', [defaultPhone])
    
    if (existingUser) {
      return {
        success: false,
        message: `Потребител с телефон ${defaultPhone} вече съществува.`
      }
    }

    // Create new user
    await db.run(`
      INSERT INTO users (name, phone, email)
      VALUES (?, ?, ?)
    `, [command.patientName, defaultPhone, command.email || null])

    return {
      success: true,
      message: `Потребителят ${command.patientName} е създаден успешно. Телефон: ${defaultPhone}`
    }
  }

  if (command.action === 'update_user') {
    if (!command.userId && !command.patientName) {
      return {
        success: false,
        message: 'Липсва ID или име на потребителя за редактиране.'
      }
    }

    let user
    if (command.userId) {
      user = await db.get('SELECT * FROM users WHERE id = ?', [command.userId])
    } else {
      user = await db.get('SELECT * FROM users WHERE LOWER(name) = LOWER(?)', [command.patientName])
    }

    if (!user) {
      return {
        success: false,
        message: 'Потребителят не е намерен.'
      }
    }

    // Update user fields
    const updateFields = []
    const updateValues = []
    
    if (command.patientName && command.patientName !== user.name) {
      updateFields.push('name = ?')
      updateValues.push(command.patientName)
    }
    
    if (command.phone && command.phone !== user.phone) {
      // Check if new phone already exists
      const existingUserWithNewPhone = await db.get('SELECT * FROM users WHERE phone = ? AND id != ?', [command.phone, user.id])
      if (existingUserWithNewPhone) {
        return {
          success: false,
          message: `Потребител с телефон ${command.phone} вече съществува.`
        }
      }
      
      // Migrate all bookings and data to new phone number
      await db.run('UPDATE bookings SET phone = ? WHERE phone = ?', [command.phone, user.phone])
      
      updateFields.push('phone = ?')
      updateValues.push(command.phone)
    }
    
    // Add email for testing
    if (command.email && command.email !== user.email) {
      updateFields.push('email = ?')
      updateValues.push(command.email)
    }
    
    if (updateFields.length === 0) {
      return {
        success: false,
        message: 'Няма промени за прилагане.'
      }
    }

    updateValues.push(user.id)
    await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues)

    return {
      success: true,
      message: `Потребителят ${user.name} е обновен успешно.`
    }
  }

  if (command.action === 'delete_user') {
    if (!command.userId && !command.patientName) {
      return {
        success: false,
        message: 'Липсва ID или име на потребителя за изтриване.'
      }
    }

    let user
    if (command.userId) {
      user = await db.get('SELECT * FROM users WHERE id = ?', [command.userId])
    } else {
      user = await db.get('SELECT * FROM users WHERE LOWER(name) = LOWER(?)', [command.patientName])
    }

    if (!user) {
      return {
        success: false,
        message: 'Потребителят не е намерен.'
      }
    }

    // Check if user has any bookings or treatment notes
    const userBookings = await db.all('SELECT * FROM bookings WHERE phone = ?', [user.phone])
    const hasBookings = userBookings.length > 0
    const hasTreatmentNotes = userBookings.some(booking => booking.treatment_notes)
    
    if (hasBookings) {
      const pendingBookings = userBookings.filter(b => b.status === 'pending').length
      const confirmedBookings = userBookings.filter(b => b.status === 'confirmed').length
      
      if (pendingBookings > 0 || confirmedBookings > 0) {
        return {
          success: false,
          message: `Потребителят ${user.name} има ${pendingBookings > 0 ? 'чакащи' : ''}${pendingBookings > 0 && confirmedBookings > 0 ? ' и ' : ''}${confirmedBookings > 0 ? 'потвърдени' : ''} резервации и не може да бъде изтрит.`
        }
      }
      
      // If user has cancelled bookings or treatment notes, ask for confirmation
      if (hasTreatmentNotes) {
        return {
          success: false,
          message: `Потребителят ${user.name} има бележки за лечението. Сигурни ли сте, че искате да го изтриете? Изпратете командата отново за потвърждение.`
        }
      }
    }

    await db.run('DELETE FROM users WHERE id = ?', [user.id])

    return {
      success: true,
      message: `Потребителят ${user.name} е изтрит успешно.`
    }
  }

  return {
    success: false,
    message: 'Командата не е имплементирана все още.'
  }
}