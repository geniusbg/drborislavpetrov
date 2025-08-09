const { Pool } = require('pg')

async function addTestBooking() {
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
    console.log('🔍 Adding test booking...')
    const client = await pool.connect()
    
    // Add test booking
    const result = await client.query(`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, message, status, createdat)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      'Тестова резервация',
      'test@example.com',
      '0988825195',
      '1',
      30,
      '2025-08-03',
      '14:30',
      'Тестова резервация за проверка',
      'pending'
    ])

    console.log('✅ Test booking added with ID:', result.rows[0].id)

    // Show all bookings
    const bookings = await client.query('SELECT * FROM bookings')
    console.log('\n📊 All bookings:', bookings.rows)

    client.release()
    await pool.end()
    console.log('\n✅ Test completed!')
  } catch (error) {
    console.error('❌ Error adding test booking:', error)
    await pool.end()
  }
}

addTestBooking() 