const { Pool } = require('pg')

// PostgreSQL connection
const pgPool = new Pool({
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*',
})

async function dropAndRecreateTables() {
  try {
    console.log('🗑️ Dropping existing tables...')
    
    const client = await pgPool.connect()
    
    // Drop existing tables
    try {
      await client.query('DROP TABLE IF EXISTS bookings CASCADE')
      console.log('✅ Dropped bookings table')
    } catch (err) {
      console.log('⚠️ Could not drop bookings table:', err.message)
    }
    
    try {
      await client.query('DROP TABLE IF EXISTS users CASCADE')
      console.log('✅ Dropped users table')
    } catch (err) {
      console.log('⚠️ Could not drop users table:', err.message)
    }
    
    try {
      await client.query('DROP TABLE IF EXISTS services CASCADE')
      console.log('✅ Dropped services table')
    } catch (err) {
      console.log('⚠️ Could not drop services table:', err.message)
    }
    
    // Recreate tables with correct data types
    console.log('📋 Recreating tables with correct data types...')
    
    // Create bookings table with TEXT service field
    await client.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created bookings table')
    
    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NOT NULL,
        address TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created users table')
    
    // Create services table
    await client.query(`
      CREATE TABLE services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✅ Created services table')
    
    console.log('🎉 Tables recreated successfully!')
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error recreating tables:', error)
  } finally {
    await pgPool.end()
  }
}

dropAndRecreateTables() 