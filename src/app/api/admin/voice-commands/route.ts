/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const command: ParsedCommand = body

    console.log('Received voice command:', command)

    if (!command.action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Невалидна команда' 
      })
    }

    const db = await open({
      filename: 'bookings.db',
      driver: sqlite3.Database
    })

    let result: any = {}

    switch (command.action) {
      case 'addUser':
        result = await handleAddUser(db, command)
        break
      case 'updateUser':
        result = await handleUpdateUser(db, command)
        break
      case 'deleteUser':
        result = await handleDeleteUser(db, command)
        break
      case 'addBooking':
        result = await handleAddBooking(db, command)
        break
      case 'updateBooking':
        result = await handleUpdateBooking(db, command)
        break
      case 'cancelBooking':
        result = await handleCancelBooking(db, command)
        break
      case 'checkAvailability':
        result = await handleCheckAvailability(db, command)
        break
      case 'showBookings':
        result = await handleShowBookings(db, command)
        break
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Неразпозната команда' 
        })
    }

    await db.close()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Voice command error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Грешка при обработка на командата' 
    })
  }
}

async function handleAddUser(db: any, command: ParsedCommand) {
  const { name, phone, email } = command

  if (!name) {
    return { success: false, error: 'Името е задължително' }
  }

  // Generate unique phone if not provided
  let userPhone = phone
  if (!userPhone) {
    const timestamp = Date.now()
    userPhone = `0888${timestamp.toString().slice(-6)}`
  }

  // Format phone number
  userPhone = formatPhoneNumber(userPhone)

  // Check if user already exists
  const existingUser = await db.get(
    'SELECT * FROM users WHERE phone = ?',
    [userPhone]
  )

  if (existingUser) {
    return { 
      success: false, 
      error: `Потребител с телефон ${userPhone} вече съществува` 
    }
  }

  // Capitalize name
  const capitalizedName = capitalizeName(name)

  await db.run(
    'INSERT INTO users (name, phone, email) VALUES (?, ?, ?)',
    [capitalizedName, userPhone, email || null]
  )

  return { 
    success: true, 
    message: `Потребителят ${capitalizedName} е добавен успешно с телефон ${userPhone}` 
  }
}

async function handleUpdateUser(db: any, command: ParsedCommand) {
  const { name, phone, email } = command

  if (!name) {
    return { success: false, error: 'Името е задължително' }
  }

  // Find user by name (case insensitive)
  const user = await db.get(
    'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
    [name]
  )

  if (!user) {
    return { success: false, error: `Потребителят ${name} не е намерен` }
  }

  const updateFields = []
  const updateValues = []

  if (phone) {
    const formattedPhone = formatPhoneNumber(phone)
    
    // Check if new phone already exists
    const existingUser = await db.get(
      'SELECT * FROM users WHERE phone = ? AND id != ?',
      [formattedPhone, user.id]
    )

    if (existingUser) {
      return { 
        success: false, 
        error: `Телефон ${formattedPhone} вече се използва от друг потребител` 
      }
    }

    updateFields.push('phone = ?')
    updateValues.push(formattedPhone)

    // Migrate bookings to new phone
    await db.run(
      'UPDATE bookings SET phone = ? WHERE phone = ?',
      [formattedPhone, user.phone]
    )
  }

  if (email) {
    updateFields.push('email = ?')
    updateValues.push(email)
  }

  if (updateFields.length === 0) {
    return { success: false, error: 'Не са посочени данни за промяна' }
  }

  updateValues.push(user.id)
  await db.run(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  )

  return { 
    success: true, 
    message: `Потребителят ${name} е обновен успешно` 
  }
}

async function handleDeleteUser(db: any, command: ParsedCommand) {
  const { name } = command

  if (!name) {
    return { success: false, error: 'Името е задължително' }
  }

  // Find user by name (case insensitive)
  const user = await db.get(
    'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
    [name]
  )

  if (!user) {
    return { success: false, error: `Потребителят ${name} не е намерен` }
  }

  // Check for future bookings
  const futureBookings = await db.all(
    'SELECT * FROM bookings WHERE phone = ? AND status IN (?, ?) AND date >= date("now")',
    [user.phone, 'pending', 'confirmed']
  )

  if (futureBookings.length > 0) {
    return { 
      success: false, 
      error: `Не може да изтриете потребителят - има ${futureBookings.length} активни резервации` 
    }
  }

  // Check for historical data
  const historicalData = await db.all(
    'SELECT * FROM bookings WHERE phone = ?',
    [user.phone]
  )

  if (historicalData.length > 0) {
    return { 
      success: false, 
      error: `Потребителят има ${historicalData.length} исторически записи. Изисква се повторно потвърждение.` 
    }
  }

  await db.run('DELETE FROM users WHERE id = ?', [user.id])

  return { 
    success: true, 
    message: `Потребителят ${name} е изтрит успешно` 
  }
}

async function handleAddBooking(db: any, command: ParsedCommand) {
  const { name, date, time, service } = command

  if (!name || !date || !time) {
    return { 
      success: false, 
      error: 'Името, датата и часът са задължителни' 
    }
  }

  // Find or create user
  let user = await db.get(
    'SELECT * FROM users WHERE LOWER(name) = LOWER(?)',
    [name]
  )

  if (!user) {
    // Create user with default phone
    const timestamp = Date.now()
    const defaultPhone = `0888${timestamp.toString().slice(-6)}`
    
    await db.run(
      'INSERT INTO users (name, phone) VALUES (?, ?)',
      [capitalizeName(name), defaultPhone]
    )
    
    user = await db.get(
      'SELECT * FROM users WHERE phone = ?',
      [defaultPhone]
    )
  }

  // Parse and format date
  const formattedDate = parseDate(date)
  if (!formattedDate) {
    return { success: false, error: 'Невалидна дата' }
  }

  // Check if slot is available
  const existingBooking = await db.get(
    'SELECT * FROM bookings WHERE date = ? AND time = ? AND status != ?',
    [formattedDate, time, 'cancelled']
  )

  if (existingBooking) {
    return { 
      success: false, 
      error: `Слотът ${time} на ${formattedDate} вече е зает` 
    }
  }

  // Get service ID if service name provided
  let serviceId = null
  if (service) {
    const serviceRecord = await db.get(
      'SELECT id FROM services WHERE LOWER(name) = LOWER(?)',
      [service]
    )
    serviceId = serviceRecord?.id || null
  }

  await db.run(
    'INSERT INTO bookings (name, phone, date, time, service_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    [user.name, user.phone, formattedDate, time, serviceId, 'pending']
  )

  return { 
    success: true, 
    message: `Резервацията за ${user.name} на ${formattedDate} в ${time} е създадена успешно` 
  }
}

async function handleUpdateBooking(db: any, command: ParsedCommand) {
  const { name, date, time } = command

  if (!name || !date) {
    return { success: false, error: 'Името и датата са задължителни' }
  }

  const formattedDate = parseDate(date)
  if (!formattedDate) {
    return { success: false, error: 'Невалидна дата' }
  }

  // Find booking
  const booking = await db.get(
    'SELECT * FROM bookings WHERE LOWER(name) = LOWER(?) AND date = ?',
    [name, formattedDate]
  )

  if (!booking) {
    return { 
      success: false, 
      error: `Резервация за ${name} на ${formattedDate} не е намерена` 
    }
  }

  const updateFields = []
  const updateValues = []

  if (time) {
    // Check if new time is available
    const existingBooking = await db.get(
      'SELECT * FROM bookings WHERE date = ? AND time = ? AND id != ? AND status != ?',
      [formattedDate, time, booking.id, 'cancelled']
    )

    if (existingBooking) {
      return { 
        success: false, 
        error: `Слотът ${time} на ${formattedDate} вече е зает` 
      }
    }

    updateFields.push('time = ?')
    updateValues.push(time)
  }

  if (updateFields.length === 0) {
    return { success: false, error: 'Не са посочени данни за промяна' }
  }

  updateValues.push(booking.id)
  await db.run(
    `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  )

  return { 
    success: true, 
    message: `Резервацията за ${name} е обновена успешно` 
  }
}

async function handleCancelBooking(db: any, command: ParsedCommand) {
  const { name, date } = command

  if (!name || !date) {
    return { success: false, error: 'Името и датата са задължителни' }
  }

  const formattedDate = parseDate(date)
  if (!formattedDate) {
    return { success: false, error: 'Невалидна дата' }
  }

  const booking = await db.get(
    'SELECT * FROM bookings WHERE LOWER(name) = LOWER(?) AND date = ?',
    [name, formattedDate]
  )

  if (!booking) {
    return { 
      success: false, 
      error: `Резервация за ${name} на ${formattedDate} не е намерена` 
    }
  }

  await db.run(
    'UPDATE bookings SET status = ? WHERE id = ?',
    ['cancelled', booking.id]
  )

  return { 
    success: true, 
    message: `Резервацията за ${name} на ${formattedDate} е отменена успешно` 
  }
}

async function handleCheckAvailability(db: any, command: ParsedCommand) {
  const { date } = command
  
  let targetDate = date ? parseDate(date) : new Date().toISOString().split('T')[0]
  
  if (!targetDate) {
    targetDate = new Date().toISOString().split('T')[0]
  }

  // Get all bookings for the date
  const bookings = await db.all(
    'SELECT time FROM bookings WHERE date = ? AND status != ?',
    [targetDate, 'cancelled']
  )

  const bookedTimes = bookings.map((b: any) => b.time)
  
  // Available time slots (9:00 - 17:00)
  const allSlots = []
  for (let hour = 9; hour <= 17; hour++) {
    allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
  }

  const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot))

  return {
    success: true,
    message: `Намерени ${availableSlots.length} свободни слотове за ${targetDate}`,
    result: {
      availableSlots,
      targetDate
    }
  }
}

async function handleShowBookings(db: any, command: ParsedCommand) {
  const { date } = command
  
  if (!date) {
    return { success: false, error: 'Датата е задължителна' }
  }

  const formattedDate = parseDate(date)
  if (!formattedDate) {
    return { success: false, error: 'Невалидна дата' }
  }

  const bookings = await db.all(
    'SELECT * FROM bookings WHERE date = ? ORDER BY time',
    [formattedDate]
  )

  return {
    success: true,
    message: `Намерени ${bookings.length} резервации за ${formattedDate}`,
    result: {
      bookings,
      date: formattedDate
    }
  }
}

// Helper functions
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // Handle 9-digit numbers (add +359)
  if (digits.length === 9 && digits.startsWith('8')) {
    return `+359${digits.slice(1)}`
  }
  
  // Handle 10-digit numbers (add +359)
  if (digits.length === 10 && digits.startsWith('08')) {
    return `+359${digits.slice(1)}`
  }
  
  // Handle 12-digit numbers (already formatted)
  if (digits.length === 12 && digits.startsWith('359')) {
    return `+${digits}`
  }
  
  // Default: assume it's a valid number
  return digits.startsWith('+') ? digits : `+359${digits}`
}

function capitalizeName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function parseDate(dateStr: string): string | null {
  // Handle various date formats
  const today = new Date()
  
  if (dateStr.toLowerCase() === 'днес' || dateStr.toLowerCase() === 'сега') {
    return today.toISOString().split('T')[0]
  }
  
  if (dateStr.toLowerCase() === 'утре') {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  
  // Try to parse DD.MM.YYYY format
  const match = dateStr.match(/(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Try to parse YYYY-MM-DD format
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr
  }
  
  return null
}