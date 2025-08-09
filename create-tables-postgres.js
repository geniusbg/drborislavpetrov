const { Pool } = require('pg')

// PostgreSQL connection as postgres admin
const pgPool = new Pool({
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'postgres', // Try with postgres admin
  password: 'postgres', // Default postgres password
})

async function createTables() {
  try {
    console.log('🔧 Creating tables with postgres admin...')
    
    const client = await pgPool.connect()
    
    // Create bookings table
    console.log('📋 Creating bookings table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT NOT NULL,
        service INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create users table
    console.log('📋 Creating users table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
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
    
    // Create services table
    console.log('📋 Creating services table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        duration INTEGER NOT NULL DEFAULT 30,
        price REAL,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Grant permissions to drborislavpetrov user
    console.log('🔐 Granting permissions to drborislavpetrov...')
    await client.query('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drborislavpetrov')
    await client.query('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drborislavpetrov')
    await client.query('GRANT CREATE ON SCHEMA public TO drborislavpetrov')
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO drborislavpetrov')
    await client.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO drborislavpetrov')
    
    console.log('✅ Tables created and permissions granted!')
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error creating tables:', error)
  } finally {
    await pgPool.end()
  }
}

createTables() 