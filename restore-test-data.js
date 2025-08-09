const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'drborislavpetrov',
  password: 'postgres',
  port: 5432,
})

async function restoreTestData() {
  const client = await pool.connect()
  
  try {
    console.log('🔄 Restoring test data...')
    
    // Add services
    console.log('📝 Adding services...')
    await client.query(`
      INSERT INTO services (name, duration, price) 
      VALUES 
      ('Консултация', 30, 50),
      ('Лечение', 60, 100),
      ('Профилактика', 45, 75),
      ('Екстрена помощ', 90, 150),
      ('Следопит', 30, 40)
      ON CONFLICT (name) DO NOTHING
    `)
    console.log('✅ Services added')
    
    // Add users
    console.log('📝 Adding users...')
    await client.query(`
      INSERT INTO users (name, phone, email) 
      VALUES 
      ('Николай Петров', '+359988825195', 'geniuss0ft@yahoo.com'),
      ('Мария Иванова', '+359888123456', 'maria@example.com'),
      ('Петър Георгиев', '+359888123457', 'petar@example.com'),
      ('Анна Димитрова', '+359888123458', 'anna@example.com'),
      ('Стефан Тодоров', '+359888123459', 'stefan@example.com')
      ON CONFLICT (phone) DO NOTHING
    `)
    console.log('✅ Users added')
    
    // Add bookings
    console.log('📝 Adding bookings...')
    await client.query(`
      INSERT INTO bookings (name, email, phone, service, serviceduration, date, time, status, treatment_notes) 
      VALUES 
      ('Николай Петров', 'geniuss0ft@yahoo.com', '+359988825195', 1, 30, '2025-08-02', '10:00', 'confirmed', 'Първа сесия - пациентът се чувства добре'),
      ('Мария Иванова', 'maria@example.com', '+359888123456', 2, 60, '2025-08-02', '11:00', 'pending', 'Втора сесия - нужни са допълнителни процедури'),
      ('Петър Георгиев', 'petar@example.com', '+359888123457', 3, 45, '2025-08-02', '12:00', 'confirmed', 'Трета сесия - лечение завършено успешно'),
      ('Анна Димитрова', 'anna@example.com', '+359888123458', 4, 90, '2025-08-03', '09:00', 'pending', 'Екстрена помощ - пациентът в критично състояние'),
      ('Стефан Тодоров', 'stefan@example.com', '+359888123459', 5, 30, '2025-08-03', '14:00', 'confirmed', 'Следопит - всичко наред')
      ON CONFLICT DO NOTHING
    `)
    console.log('✅ Bookings added')
    
    // Check final state
    const bookingsCount = await client.query('SELECT COUNT(*) as count FROM bookings')
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users')
    const servicesCount = await client.query('SELECT COUNT(*) as count FROM services')
    
    console.log('\n📊 Final database state:')
    console.log(`📋 Bookings: ${bookingsCount.rows[0].count}`)
    console.log(`👥 Users: ${usersCount.rows[0].count}`)
    console.log(`🛠️ Services: ${servicesCount.rows[0].count}`)
    
  } catch (error) {
    console.error('❌ Error restoring test data:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

restoreTestData() 