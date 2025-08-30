import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const adminToken = request.headers.get('x-admin-token')
    
    if (!adminToken || (adminToken !== 'test' && adminToken !== 'mock-token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Поддържаме и двата формата
    let command = body.command
    
    // Ако няма command, но има action и originalCommand, използвай originalCommand
    if (!command && body.action && body.originalCommand) {
      command = body.originalCommand
    }

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    
    // Execute the command based on type
    let result = null
    
    // Ако получи директно name, phone, email от VoiceInterface
    if (body.action === 'addUser' && body.name) {
      // Add user logic
      try {
        // Проверяваме дали има потребител с такова име
        const existingUserByName = await db.query('SELECT * FROM users WHERE name ILIKE $1', [`%${body.name}%`])
        
        // Проверяваме дали има потребител с такъв телефон (ако е предоставен)
        let existingUserByPhone = null
        if (body.phone && body.phone.trim() !== '') {
          existingUserByPhone = await db.query('SELECT * FROM users WHERE phone = $1', [body.phone.trim()])
        }
        
        if (existingUserByName.rows.length > 0) {
          result = { error: `Потребител с име "${body.name}" вече съществува в системата` }
        } else if (existingUserByPhone && existingUserByPhone.rows.length > 0) {
          const existingUser = existingUserByPhone.rows[0]
          result = { error: `Телефон номерът ${body.phone} вече се използва от потребител "${existingUser.name}"` }
        } else {
          // Convert empty string to null for phone
          const phoneValue = body.phone && body.phone.trim() !== '' ? body.phone.trim() : null
          const emailValue = body.email && body.email.trim() !== '' ? body.email.trim() : null
          
          const insertResult = await db.query(
            'INSERT INTO users (name, phone, email, createdat) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [body.name, phoneValue, emailValue]
          )
          
          if (insertResult.rows && insertResult.rows.length > 0) {
            result = { message: `Потребителят ${body.name} беше добавен успешно` }
          } else {
            result = { error: `Грешка при добавяне на потребителя ${body.name}` }
          }
        }
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        const error = dbError as { code?: string; constraint?: string; message?: string }
        if (error.code === '23505') { // Unique constraint violation
          // Проверяваме дали грешката е за телефон или име
          if (error.constraint && error.constraint.includes('phone')) {
            result = { error: `Телефон номерът ${body.phone} вече се използва от друг потребител` }
          } else {
            result = { error: `Потребител с име "${body.name}" вече съществува в системата` }
          }
        } else {
          result = { error: `Грешка в базата данни: ${error.message || 'Неизвестна грешка'}` }
        }
      }
    } else if (body.action === 'deleteUser' && body.name) {
      // Delete user logic
      try {
        const deleteResult = await db.query(
          'DELETE FROM users WHERE name ILIKE $1',
          [`%${body.name}%`]
        )
        
        if (deleteResult.rowCount && deleteResult.rowCount > 0) {
          result = { message: `Потребителят ${body.name} беше изтрит успешно` }
        } else {
          result = { error: `Потребителят "${body.name}" не беше намерен в системата` }
        }
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        const error = dbError as { message?: string }
        result = { error: `Грешка при изтриване на потребителя: ${error.message || 'Неизвестна грешка'}` }
      }
    } else if (body.action === 'updateUser' && body.name) {
      // Update user logic
      console.log('Updating user:', body.name, 'with email:', body.email, 'phone:', body.phone)
      
      try {
        // First, get the current user data to preserve existing phone if not provided
        const currentUser = await db.query('SELECT * FROM users WHERE name ILIKE $1', [`%${body.name}%`])
        
        if (currentUser.rows.length === 0) {
          result = { error: `Потребителят "${body.name}" не беше намерен в системата` }
        } else {
          // Проверяваме дали новият телефон номер вече се използва от друг потребител
          if (body.phone !== undefined && body.phone !== null && body.phone.trim() !== '') {
            const existingUserByPhone = await db.query(
              'SELECT * FROM users WHERE phone = $1 AND name NOT ILIKE $2', 
              [body.phone.trim(), `%${body.name}%`]
            )
            
            if (existingUserByPhone.rows.length > 0) {
              const existingUser = existingUserByPhone.rows[0]
              result = { error: `Телефон номерът ${body.phone.trim()} вече се използва от потребител "${existingUser.name}"` }
            } else {
              // Only update fields that are provided, preserve existing phone if not provided
              let updateQuery = 'UPDATE users SET updatedat = NOW()'
              const params: (string | null)[] = []
              let paramIndex = 1
              
              if (body.email !== undefined && body.email !== null && body.email.trim() !== '') {
                updateQuery += `, email = $${paramIndex}`
                params.push(body.email.trim())
                paramIndex++
              } else if (body.email !== undefined) {
                // If email is explicitly set to empty/null, update it
                updateQuery += `, email = $${paramIndex}`
                params.push(null)
                paramIndex++
              }
              
              // Only update phone if provided, otherwise keep existing
              if (body.phone !== undefined && body.phone !== null && body.phone.trim() !== '') {
                updateQuery += `, phone = $${paramIndex}`
                params.push(body.phone.trim())
                paramIndex++
              } else if (body.phone !== undefined) {
                // If phone is explicitly set to empty/null, update it
                updateQuery += `, phone = $${paramIndex}`
                params.push(null)
                paramIndex++
              }
              
              updateQuery += ` WHERE name ILIKE $${paramIndex} RETURNING *`
              params.push(`%${body.name}%`)
              
              const updateResult = await db.query(updateQuery, params)
              
              console.log('Update result:', updateResult.rowCount, 'rows affected')
              
              if (updateResult.rowCount && updateResult.rowCount > 0) {
                result = { message: `Потребителят ${body.name} беше ъпдейтнат успешно` }
              } else {
                result = { error: `Потребителят ${body.name} не беше намерен` }
              }
            }
          } else {
            // Ако не се променя телефон номер, просто ъпдейтваме
            let updateQuery = 'UPDATE users SET "updatedAt" = NOW()'
            const params: (string | null)[] = []
            let paramIndex = 1
            
            if (body.email !== undefined) {
              updateQuery += `, email = $${paramIndex}`
              params.push(body.email)
              paramIndex++
            }
            
            updateQuery += ` WHERE name ILIKE $${paramIndex} RETURNING *`
            params.push(`%${body.name}%`)
            
            const updateResult = await db.query(updateQuery, params)
            
            console.log('Update result:', updateResult.rowCount, 'rows affected')
            
            if (updateResult.rowCount && updateResult.rowCount > 0) {
              result = { message: `Потребителят ${body.name} беше ъпдейтнат успешно` }
            } else {
              result = { error: `Потребителят ${body.name} не беше намерен` }
            }
          }
        }
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        const error = dbError as { code?: string; constraint?: string; message?: string }
        if (error.code === '23505' && error.constraint && error.constraint.includes('phone')) {
          result = { error: `Телефон номерът ${body.phone} вече се използва от друг потребител` }
        } else {
          result = { error: `Грешка при ъпдейтване на потребителя: ${error.message || 'Неизвестна грешка'}` }
        }
      }
    } else if (body.action === 'addBooking' && body.name) {
      // Add booking logic
      console.log('Adding booking for:', body.name, 'date:', body.date, 'time:', body.time, 'service:', body.service)
      
      try {
        // Find user by name
        const userResult = await db.query('SELECT * FROM users WHERE name ILIKE $1', [`%${body.name}%`])
        if (userResult.rows.length === 0) {
          result = { error: `Потребителят "${body.name}" не беше намерен в системата` }
        } else {
          const user = userResult.rows[0]
          
          // Проверяваме дали са предоставени дата и час
          if (!body.date) {
            result = { error: `Моля, укажете дата за резервацията (например: 15.12.2024)` }
          } else if (!body.time) {
            result = { error: `Моля, укажете час за резервацията (например: 14:00)` }
          } else {
            // Check if booking already exists for this time
            const existingBooking = await db.query(
              'SELECT * FROM bookings WHERE date = $1 AND time = $2 AND status != $3',
              [body.date, body.time, 'cancelled']
            )
            
            if (existingBooking.rows.length > 0) {
              result = { error: `Този час (${body.time}) на ${body.date} вече е зает` }
            } else {
              // Create booking
              const bookingResult = await db.query(
                'INSERT INTO bookings (name, phone, email, date, time, service, createdat) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
                [user.name, user.phone, user.email, body.date, body.time, body.service || 'Услуга']
              )
              
              if (bookingResult.rows && bookingResult.rows.length > 0) {
                result = { message: `Резервацията за ${user.name} на ${body.date} в ${body.time} беше създадена успешно` }
              } else {
                result = { error: `Грешка при създаване на резервацията` }
              }
            }
          }
        }
      } catch (dbError: unknown) {
        console.error('Database error:', dbError)
        const error = dbError as { message?: string }
        result = { error: `Грешка при създаване на резервацията: ${error.message || 'Неизвестна грешка'}` }
      }
          } else if (body.action === 'cancelBooking' && body.name) {
        // Cancel booking logic
        console.log('Canceling booking for:', body.name, 'date:', body.date)
        
        try {
          const cancelResult = await db.query(
            'DELETE FROM bookings WHERE name ILIKE $1 AND date = $2 RETURNING *',
            [`%${body.name}%`, body.date]
          )
          
          if (cancelResult.rowCount && cancelResult.rowCount > 0) {
            result = { message: `Резервацията за ${body.name} беше отменена успешно` }
          } else {
            result = { error: `Резервацията за "${body.name}" на ${body.date} не беше намерена` }
          }
        } catch (dbError: unknown) {
          console.error('Database error:', dbError)
          const error = dbError as { message?: string }
          result = { error: `Грешка при отменяване на резервацията: ${error.message || 'Неизвестна грешка'}` }
        }
              } else if (body.action === 'showBookings') {
        // Show bookings logic
        console.log('Showing bookings for date:', body.date)
        
        try {
          let query = 'SELECT * FROM bookings'
          const params: (string | null)[] = []
          
          if (body.date) {
            query += ' WHERE date = $1'
            params.push(body.date)
          }
          
          query += ' ORDER BY date, time'
          
          const bookingsResult = await db.query(query, params)
          
          if (bookingsResult.rows && bookingsResult.rows.length > 0) {
            result = { 
              message: `Намерени са ${bookingsResult.rows.length} резервации`,
              bookings: bookingsResult.rows
            }
          } else {
            result = { message: 'Няма намерени резервации' }
          }
        } catch (dbError: unknown) {
          console.error('Database error:', dbError)
          const error = dbError as { message?: string }
          result = { error: `Грешка при търсене на резервации: ${error.message || 'Неизвестна грешка'}` }
        }
              } else if (body.action === 'checkAvailability') {
        // Check availability logic
        console.log('Checking availability for date:', body.date)
        
        try {
          const availabilityResult = await db.query(
            'SELECT id, time FROM bookings WHERE date = $1 AND status != \'cancelled\' ORDER BY time',
            [body.date]
          )
          
          if (availabilityResult.rows && availabilityResult.rows.length > 0) {
            result = { 
              message: `Заета времена за ${body.date}:`,
              bookedTimes: availabilityResult.rows.map(row => row.time)
            }
          } else {
            result = { message: `Всички времена са свободни за ${body.date}` }
          }
        } catch (dbError: unknown) {
          console.error('Database error:', dbError)
          const error = dbError as { message?: string }
          result = { error: `Грешка при проверка на свободните времена: ${error.message || 'Неизвестна грешка'}` }
        }
    } else {
      // Parse the voice command using the original logic
      const parsedCommand = await parseVoiceCommand(command)
      
      if (parsedCommand.type === 'add_user' && parsedCommand.user?.name) {
        // Add user logic
        const insertResult = await db.query(
          'INSERT INTO users (name, phone, email, createdat) VALUES ($1, $2, $3, NOW()) RETURNING *',
          [parsedCommand.user.name, parsedCommand.user.phone || null, parsedCommand.user.email || null]
        )
        
        if (insertResult.rows && insertResult.rows.length > 0) {
          result = { message: `Потребителят ${parsedCommand.user.name} беше добавен успешно` }
        } else {
          result = { error: `Грешка при добавяне на потребителя ${parsedCommand.user.name}` }
        }
      } else if (parsedCommand.type === 'delete_user' && parsedCommand.user?.name) {
        // Delete user logic
        const deleteResult = await db.query(
          'DELETE FROM users WHERE name ILIKE $1',
          [`%${parsedCommand.user.name}%`]
        )
        
        if (deleteResult.rowCount && deleteResult.rowCount > 0) {
          result = { message: `Потребителят ${parsedCommand.user.name} беше изтрит успешно` }
        } else {
          result = { error: `Потребителят ${parsedCommand.user.name} не беше намерен` }
        }
      } else if (parsedCommand.type === 'manage_user' && parsedCommand.user?.name) {
        // Update user logic - find user by name and update
        console.log('Managing user:', parsedCommand.user.name, 'with email:', parsedCommand.user.email, 'phone:', parsedCommand.user.phone)
        
        // First, get the current user data to preserve existing phone if not provided
        const currentUser = await db.query('SELECT * FROM users WHERE name ILIKE $1', [`%${parsedCommand.user.name}%`])
        
        if (currentUser.rows.length === 0) {
          result = { error: `Потребителят ${parsedCommand.user.name} не беше намерен` }
        } else {
          // Only update fields that are provided, preserve existing phone if not provided
          let updateQuery = 'UPDATE users SET updatedat = NOW()'
          const params: (string | null)[] = []
          let paramIndex = 1
          
          if (parsedCommand.user.email !== undefined && parsedCommand.user.email !== null) {
            updateQuery += `, email = $${paramIndex}`
            params.push(parsedCommand.user.email)
            paramIndex++
          }
          
          // Only update phone if provided, otherwise keep existing
          if (parsedCommand.user.phone !== undefined && parsedCommand.user.phone !== null && parsedCommand.user.phone.trim() !== '') {
            updateQuery += `, phone = $${paramIndex}`
            params.push(parsedCommand.user.phone.trim())
            paramIndex++
          }
          
          updateQuery += ` WHERE name ILIKE $${paramIndex} RETURNING *`
          params.push(`%${parsedCommand.user.name}%`)
          
          const updateResult = await db.query(updateQuery, params)
          
          if (updateResult.rowCount && updateResult.rowCount > 0) {
            result = { message: `Потребителят ${parsedCommand.user.name} беше ъпдейтнат успешно` }
          } else {
            result = { error: `Потребителят ${parsedCommand.user.name} не беше намерен` }
          }
        }
      } else if (parsedCommand.type === 'create_booking' && parsedCommand.user?.name) {
        // Create booking logic
        console.log('Creating booking for:', parsedCommand.user.name, 'date:', parsedCommand.date, 'time:', parsedCommand.time)
        
        // Find user by name
        const userResult = await db.query('SELECT * FROM users WHERE name ILIKE $1', [`%${parsedCommand.user.name}%`])
        if (userResult.rows.length === 0) {
          result = { error: `Потребителят ${parsedCommand.user.name} не беше намерен` }
        } else {
          const user = userResult.rows[0]
          
          // Create booking
          const bookingResult = await db.query(
            'INSERT INTO bookings (name, phone, email, date, time, service, createdat) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
            [user.name, user.phone, user.email, parsedCommand.date, parsedCommand.time, parsedCommand.service || 'Услуга']
          )
          
          if (bookingResult.rows && bookingResult.rows.length > 0) {
            result = { message: `Резервацията за ${user.name} беше създадена успешно` }
          } else {
            result = { error: `Грешка при създаване на резервацията` }
          }
        }
      } else if (parsedCommand.type === 'cancel_booking' && parsedCommand.user?.name) {
        // Cancel booking logic
        console.log('Canceling booking for:', parsedCommand.user.name, 'date:', parsedCommand.date)
        
        const cancelResult = await db.query(
          'DELETE FROM bookings WHERE name ILIKE $1 AND date = $2 RETURNING *',
          [`%${parsedCommand.user.name}%`, parsedCommand.date]
        )
        
        if (cancelResult.rowCount && cancelResult.rowCount > 0) {
          result = { message: `Резервацията за ${parsedCommand.user.name} беше отменена успешно` }
        } else {
          result = { error: `Резервацията за ${parsedCommand.user.name} не беше намерена` }
        }
      } else if (parsedCommand.type === 'show_bookings') {
        // Show bookings logic
        console.log('Showing bookings for date:', parsedCommand.date)
        
        let query = 'SELECT * FROM bookings'
        const params: (string | null)[] = []
        
        if (parsedCommand.date) {
          query += ' WHERE date = $1'
          params.push(parsedCommand.date)
        }
        
        query += ' ORDER BY date, time'
        
        const bookingsResult = await db.query(query, params)
        
        if (bookingsResult.rows && bookingsResult.rows.length > 0) {
          result = { 
            message: `Намерени са ${bookingsResult.rows.length} резервации`,
            bookings: bookingsResult.rows
          }
        } else {
          result = { message: 'Няма намерени резервации' }
        }
      } else if (parsedCommand.type === 'check_availability') {
        // Check availability logic
        console.log('Checking availability for date:', parsedCommand.date)
        
        const availabilityResult = await db.query(
          'SELECT id, time FROM bookings WHERE date = $1 AND status != \'cancelled\' ORDER BY time',
          [parsedCommand.date]
        )
        
        if (availabilityResult.rows && availabilityResult.rows.length > 0) {
          result = { 
            message: `Заета времена за ${parsedCommand.date}:`,
            bookedTimes: availabilityResult.rows.map(row => row.time)
          }
        } else {
          result = { message: `Всички времена са свободни за ${parsedCommand.date}` }
        }
      } else {
        result = parsedCommand
      }
    }
    
    db.release()

    // Проверяваме дали има грешка в резултата
    if (result && typeof result === 'object' && 'error' in result) {
      return NextResponse.json({
        success: false,
        error: (result as { error: string }).error
      })
    }
    
    return NextResponse.json({
      success: true,
      result: result
    })
  } catch (error) {
    console.error('Error processing voice command:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Възникна неочаквана грешка при обработка на командата' 
      },
      { status: 500 }
    )
  }
}

async function parseVoiceCommand(command: string) {
  // Clean the command first - replace klyomba with @ symbol
  const cleanCommand = command
    .replace(/\bкльомба\b/gi, '@')
    .replace(/\bklyomba\b/gi, '@')
  
  console.log('Parsing voice command:', cleanCommand)
  
  // Convert command to lowercase for easier parsing
  const lowerCommand = cleanCommand.toLowerCase()
  
  // Parse date
  const date = parseDate(lowerCommand)
  console.log('Parsed date:', date)
  
  // Parse time
  const time = parseTime(lowerCommand)
  console.log('Parsed time:', time)
  
  // Parse service
  const service = parseService(lowerCommand)
  console.log('Parsed service:', service)
  
  // Parse user info
  const userInfo = parseUserInfo(lowerCommand)
  console.log('Parsed user info:', userInfo)
  
  // Determine command type
  if (lowerCommand.includes('резервация') || lowerCommand.includes('запази') || lowerCommand.includes('направи')) {
    return {
      type: 'create_booking',
      date,
      time,
      service,
      user: userInfo
    }
  } else if (lowerCommand.includes('потвърди') || lowerCommand.includes('подтверди')) {
    return {
      type: 'confirm_booking',
      date,
      time,
      service,
      user: userInfo
    }
  } else if (lowerCommand.includes('отмени') || lowerCommand.includes('откажи')) {
    return {
      type: 'cancel_booking',
      date,
      time,
      service,
      user: userInfo
    }
  } else if (lowerCommand.includes('добави потребител') || lowerCommand.includes('add user')) {
    return {
      type: 'add_user',
      user: userInfo
    }
  } else if (lowerCommand.includes('изтрий потребител') || lowerCommand.includes('delete user')) {
    return {
      type: 'delete_user',
      user: userInfo
    }
  } else if (lowerCommand.includes('потребител') || lowerCommand.includes('клиент')) {
    return {
      type: 'manage_user',
      user: userInfo
    }
  } else if (lowerCommand.includes('добави резервация') || lowerCommand.includes('създай резервация') || lowerCommand.includes('направи резервация')) {
    return {
      type: 'create_booking',
      date,
      time,
      service,
      user: userInfo
    }
  } else if (lowerCommand.includes('отмени резервация') || lowerCommand.includes('откажи резервация') || lowerCommand.includes('прекрати резервация')) {
    return {
      type: 'cancel_booking',
      date,
      time,
      service,
      user: userInfo
    }
  } else if (lowerCommand.includes('покажи резервации') || lowerCommand.includes('списък резервации')) {
    return {
      type: 'show_bookings',
      date
    }
  } else if (lowerCommand.includes('провери свободни') || lowerCommand.includes('свободни часове')) {
    return {
      type: 'check_availability',
      date
    }
  }
  
  return {
    type: 'unknown',
    command: command
  }
}

function parseDate(command: string): string | null {
  const today = new Date()
  
  if (command.includes('днес') || command.includes('today')) {
    return today.toISOString().split('T')[0]
  }
  
  if (command.includes('утре') || command.includes('tomorrow')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }
  
  // Parse DD.MM format
  const dateMatch = command.match(/(\d{1,2})\.(\d{1,2})/)
  if (dateMatch) {
    const day = parseInt(dateMatch[1])
    const month = parseInt(dateMatch[2])
    const year = today.getFullYear()
    const date = new Date(year, month - 1, day)
    return date.toISOString().split('T')[0]
  }
  
  // Parse DD.MM.YYYY format
  const dateFullMatch = command.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (dateFullMatch) {
    const day = parseInt(dateFullMatch[1])
    const month = parseInt(dateFullMatch[2])
    const year = parseInt(dateFullMatch[3])
    const date = new Date(year, month - 1, day)
    return date.toISOString().split('T')[0]
  }
  
  // Parse YYYY-MM-DD format
  const dateISOMatch = command.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (dateISOMatch) {
    const year = parseInt(dateISOMatch[1])
    const month = parseInt(dateISOMatch[2])
    const day = parseInt(dateISOMatch[3])
    const date = new Date(year, month - 1, day)
    return date.toISOString().split('T')[0]
  }
  
  return null
}

function parseTime(command: string): string | null {
  // Parse HH:MM format
  const timeMatch = command.match(/(\d{1,2}):(\d{2})/)
  if (timeMatch) {
    const hour = parseInt(timeMatch[1])
    const minute = parseInt(timeMatch[2])
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
  
  // Parse "час" format
  const hourMatch = command.match(/(\d{1,2})\s*час/)
  if (hourMatch) {
    const hour = parseInt(hourMatch[1])
    return `${hour.toString().padStart(2, '0')}:00`
  }
  
  // Parse "в" format (например "в 14 часа")
  const hourInMatch = command.match(/в\s+(\d{1,2})\s+(?:часа|час)/)
  if (hourInMatch) {
    const hour = parseInt(hourInMatch[1])
    return `${hour.toString().padStart(2, '0')}:00`
  }
  
  // Parse "в" format без "часа" (например "в 14")
  const hourSimpleMatch = command.match(/в\s+(\d{1,2})(?:\s|$)/)
  if (hourSimpleMatch) {
    const hour = parseInt(hourSimpleMatch[1])
    return `${hour.toString().padStart(2, '0')}:00`
  }
  
  return null
}

function parseService(command: string): string | null {
  const services = [
    'преглед', 'консултация', 'почистване', 'профилактика', 
    'лечение', 'кариес', 'отбелязване', 'ортодонтия'
  ]
  
  for (const service of services) {
    if (command.includes(service)) {
      return service
    }
  }
  
  return null
}

function parseUserInfo(command: string): { name: string | null; phone: string | null; email: string | null } {
  // Clean the command first - replace klyomba with @ symbol
  const cleanCommand = command
    .replace(/\bкльомба\b/gi, '@')
    .replace(/\bklyomba\b/gi, '@')
  
  console.log('Parsing user info from command:', cleanCommand)
  
  // Parse name - look for words after "добави потребител" or "потребител"
  let name = null
  
  // First try to match name with following keywords (for commands with additional info)
  const nameMatchWithKeywords = cleanCommand.match(/(?:добави\s+потребител|потребител)\s+([а-я]+(?:\s+[а-я]+)*?)(?=\s+(?:имейл|телефон|тел|номер|email|phone))/i)
  if (nameMatchWithKeywords) {
    name = nameMatchWithKeywords[1]?.trim()
    console.log('Name match with keywords:', nameMatchWithKeywords, 'Extracted name:', name)
  }
  
  // If no match with keywords, try to match name at the end of the command (for simple commands like "изтрий потребител Иван Георгиев")
  if (!name) {
    const nameMatchAtEnd = cleanCommand.match(/(?:добави\s+потребител|потребител|изтрий\s+потребител|промени\s+потребител)\s+([а-я]+(?:\s+[а-я]+)*?)(?:\s|$)/i)
    if (nameMatchAtEnd) {
      name = nameMatchAtEnd[1]?.trim()
      console.log('Name match at end:', nameMatchAtEnd, 'Extracted name:', name)
    }
  }
  
  // If still no name found, try a more aggressive approach for delete commands
  if (!name) {
    const deleteNameMatch = cleanCommand.match(/(?:изтрий\s+потребител)\s+([а-я]+(?:\s+[а-я]+)*)/i)
    if (deleteNameMatch) {
      name = deleteNameMatch[1]?.trim()
      console.log('Delete name match:', deleteNameMatch, 'Extracted name:', name)
    }
  }
  
  // Parse phone - look for phone numbers with spaces and special characters
  let phone = null
  const phoneMatch = cleanCommand.match(/(?:телефон|тел|номер)\s+([0-9\s\+\-\(\)]+)/i)
  if (phoneMatch) {
    phone = phoneMatch[1]?.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '')
    console.log('Phone match:', phoneMatch, 'Extracted phone:', phone)
  }
  
  // Parse email - look for email patterns
  let email = null
  
  // First try to find structured email with "имейл" keyword
  const emailMatch = cleanCommand.match(/(?:имейл|email)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (emailMatch) {
    email = emailMatch[1]?.trim()
    console.log('Email match:', emailMatch, 'Extracted email:', email)
  }
  
  // If no structured match, try to extract email from the end of the command
  if (!email) {
    // Look for email pattern anywhere in the command
    const emailAnywhere = cleanCommand.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (emailAnywhere) {
      email = emailAnywhere[1]?.trim()
      console.log('Email found anywhere:', email)
    }
  }
  
  // If still no email found, try to extract email with dots and special characters
  if (!email) {
    // Look for patterns like "nikolay.petrov@gmail.com" or "genius.bg@gmail.com"
    const emailWithDots = cleanCommand.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (emailWithDots) {
      email = emailWithDots[1]?.trim()
      console.log('Email found with dots:', email)
    }
  }
  
  // If still no email found, try to extract email parts after "имейл" keyword
  if (!email) {
    const emailKeywordMatch = cleanCommand.match(/(?:имейл|email)\s+([а-яa-zA-Z0-9._%+-]+(?:\s+[а-яa-zA-Z0-9._%+-]+)*)/i)
    if (emailKeywordMatch) {
      const emailParts = emailKeywordMatch[1]?.trim().split(/\s+/)
      if (emailParts && emailParts.length >= 2) {
        // Try to construct email from parts
        const username = emailParts[0]
        const domain = emailParts.slice(1).join('')
        
        // Convert Bulgarian characters to Latin equivalents
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
        
        const latinUsername = convertToLatin(username)
        const latinDomain = convertToLatin(domain)
        
        // Remove spaces and special characters from domain
        const cleanDomain = latinDomain.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.-]/g, '')
        
        // Add @ symbol if missing
        if (!cleanDomain.includes('@')) {
          email = `${latinUsername}@${cleanDomain}`
        } else {
          email = `${latinUsername}${cleanDomain}`
        }
        
        console.log('Constructed email from Bulgarian:', email)
      }
    }
  }
  
  // If still no email found, try to extract email with @ symbol words
  if (!email) {
    // Replace @ symbol words with actual @ symbol
    const emailWithAtSymbol = cleanCommand
      .replace(/\b(?:ат|майл|доган|комершъл|символ|klyomba)\b/gi, '@')
      .replace(/\s+/g, '')
      .replace(/кльомба/gi, '@') // Replace кльомба without word boundaries
      .replace(/klyomba/gi, '@') // Additional replacement for any remaining klyomba
    
    const emailWithAtMatch = emailWithAtSymbol.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    if (emailWithAtMatch) {
      email = emailWithAtMatch[1]
      console.log('Found email with @ symbol word:', email)
    }
  }
  
  // If still no email found, try to extract email with Bulgarian text
  if (!email) {
    // Look for pattern like "username кльомба domain.com" or "username klyomba domain.com"
    const emailWithKlyombaMatch = cleanCommand.match(/([а-яa-zA-Z0-9._%+-]+)\s+(?:кльомба|klyomba)\s+([а-яa-zA-Z0-9._%+-]+(?:\s+[а-яa-zA-Z0-9._%+-]+)*)/i)
    if (emailWithKlyombaMatch) {
      const username = emailWithKlyombaMatch[1]?.trim()
      const domain = emailWithKlyombaMatch[2]?.trim().replace(/\s+/g, '')
      
      // Convert Bulgarian characters to Latin equivalents
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
      
      const latinUsername = convertToLatin(username)
      const latinDomain = convertToLatin(domain)
      
      // Remove spaces and special characters from domain
      const cleanDomain = latinDomain.replace(/\s+/g, '').replace(/[^a-zA-Z0-9.-]/g, '')
      
      email = `${latinUsername}@${cleanDomain}`
      console.log('Constructed email from klyomba pattern:', email)
    }
  }
  

  
  // If no structured match, try to extract from the end of the command
  if (!phone) {
    // Look for phone number anywhere in the command
    const phoneAnywhere = cleanCommand.match(/([0-9]{3,4}\s*[0-9]{2}\s*[0-9]{2})/)
    if (phoneAnywhere) {
      phone = phoneAnywhere[1]?.trim().replace(/\s+/g, '').replace(/[^0-9]/g, '')
      console.log('Phone found anywhere:', phone)
    }
  }
  
  console.log('Final parsed user info:', { name, phone, email })
  return {
    name,
    phone,
    email
  }
}