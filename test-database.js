const { Pool } = require('pg')

async function testDatabase() {
  const pool = new Pool({
    host: '192.168.1.134',
    port: 5432,
    database: 'drborislavpetrov',
    user: 'drborislavpetrov',
    password: 'Xander123)(*',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  try {
    console.log('🔍 Testing database connection...')
    const client = await pool.connect()
    console.log('✅ Database connected successfully!')

    // Test bookings table
    console.log('\n📊 Testing bookings table...')
    const bookingsResult = await client.query('SELECT COUNT(*) as count FROM bookings')
    console.log('📊 Bookings count:', bookingsResult.rows[0].count)

    // Test users table
    console.log('\n👥 Testing users table...')
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users')
    console.log('👥 Users count:', usersResult.rows[0].count)

    // Test services table
    console.log('\n🦷 Testing services table...')
    const servicesResult = await client.query('SELECT COUNT(*) as count FROM services')
    console.log('🦷 Services count:', servicesResult.rows[0].count)

    // Show some sample data
    console.log('\n📊 Sample bookings:')
    const sampleBookings = await client.query('SELECT * FROM bookings LIMIT 3')
    console.log(sampleBookings.rows)

    console.log('\n👥 Sample users:')
    const sampleUsers = await client.query('SELECT * FROM users LIMIT 3')
    console.log(sampleUsers.rows)

    client.release()
    await pool.end()
    console.log('\n✅ Database test completed!')
  } catch (error) {
    console.error('❌ Database test failed:', error)
    await pool.end()
  }
}

testDatabase() 