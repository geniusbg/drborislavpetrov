const { Pool } = require('pg')
const fs = require('fs')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'drborislavpetrov',
  password: 'postgres',
  port: 5432,
})

async function checkDatabaseAndBackup() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 Checking current database state...')
    
    // Check bookings
    const bookingsResult = await client.query('SELECT COUNT(*) as count FROM bookings')
    console.log(`📋 Bookings count: ${bookingsResult.rows[0].count}`)
    
    // Check users
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users')
    console.log(`👥 Users count: ${usersResult.rows[0].count}`)
    
    // Check services
    const servicesResult = await client.query('SELECT COUNT(*) as count FROM services')
    console.log(`🛠️ Services count: ${servicesResult.rows[0].count}`)
    
    // Get sample data
    const sampleBookings = await client.query('SELECT * FROM bookings LIMIT 5')
    const sampleUsers = await client.query('SELECT * FROM users LIMIT 5')
    const sampleServices = await client.query('SELECT * FROM services LIMIT 5')
    
    // Create backup
    const backup = {
      timestamp: new Date().toISOString(),
      bookings: sampleBookings.rows,
      users: sampleUsers.rows,
      services: sampleServices.rows,
      counts: {
        bookings: bookingsResult.rows[0].count,
        users: usersResult.rows[0].count,
        services: servicesResult.rows[0].count
      }
    }
    
    const backupFileName = `database-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    fs.writeFileSync(backupFileName, JSON.stringify(backup, null, 2))
    console.log(`💾 Backup created: ${backupFileName}`)
    
    // Show sample data
    console.log('\n📋 Sample bookings:')
    sampleBookings.rows.forEach(booking => {
      console.log(`  - ${booking.name} (${booking.phone}) - ${booking.date} ${booking.time}`)
    })
    
    console.log('\n👥 Sample users:')
    sampleUsers.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.phone})`)
    })
    
    console.log('\n🛠️ Sample services:')
    sampleServices.rows.forEach(service => {
      console.log(`  - ${service.name} (${service.duration}min)`)
    })
    
  } catch (error) {
    console.error('❌ Error checking database:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkDatabaseAndBackup() 