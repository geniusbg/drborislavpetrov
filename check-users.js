const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function checkUsers() {
  try {
    const db = await open({ filename: './bookings.db', driver: sqlite3.Database })
    
    console.log('=== ВСИЧКИ ПОТРЕБИТЕЛИ ===')
    const users = await db.all('SELECT * FROM users ORDER BY id')
    users.forEach(user => {
      console.log(`ID: ${user.id}, Име: ${user.name}, Телефон: ${user.phone}, Email: ${user.email || 'няма'}`)
    })
    
    console.log('\n=== ВСИЧКИ РЕЗЕРВАЦИИ ===')
    const bookings = await db.all('SELECT * FROM bookings ORDER BY id')
    bookings.forEach(booking => {
      console.log(`ID: ${booking.id}, Име: ${booking.name}, Дата: ${booking.date}, Час: ${booking.time}, Статус: ${booking.status}`)
    })
    
    await db.close()
  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkUsers() 