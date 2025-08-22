const { Pool } = require('pg')
require('dotenv').config()

async function updateDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  try {
    console.log('🔍 Updating database schema...')
    const client = await pool.connect()
    
    // Check if serviceduration column exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'serviceduration'
    `)
    
    if (checkColumn.rows.length === 0) {
      console.log('➕ Adding serviceduration column...')
      await client.query('ALTER TABLE bookings ADD COLUMN serviceduration INTEGER DEFAULT 30')
      console.log('✅ serviceduration column added')
    } else {
      console.log('✅ serviceduration column already exists')
    }

    // Check if treatment_notes column exists
    const checkNotesColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'treatment_notes'
    `)
    
    if (checkNotesColumn.rows.length === 0) {
      console.log('➕ Adding treatment_notes column...')
      await client.query('ALTER TABLE bookings ADD COLUMN treatment_notes TEXT')
      console.log('✅ treatment_notes column added')
    } else {
      console.log('✅ treatment_notes column already exists')
    }

    // Check if createdat column exists (should be createdat, not createdAt)
    const checkCreatedAtColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'createdat'
    `)
    
    if (checkCreatedAtColumn.rows.length === 0) {
      console.log('➕ Adding createdat column...')
      await client.query('ALTER TABLE bookings ADD COLUMN createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
      console.log('✅ createdat column added')
    } else {
      console.log('✅ createdat column already exists')
    }

    // Add user_id column to bookings if missing
    const checkUserIdColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'user_id'
    `)

    if (checkUserIdColumn.rows.length === 0) {
      console.log('➕ Adding user_id column and foreign key...')
      await client.query('ALTER TABLE bookings ADD COLUMN user_id INTEGER')
      await client.query('ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL')
      console.log('✅ user_id column and FK added')
    } else {
      console.log('✅ user_id column already exists')
    }

    // Show table structure
    console.log('\n📊 Current bookings table structure:')
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
      ORDER BY ordinal_position
    `)
    console.log(structure.rows)

    client.release()
    await pool.end()
    console.log('\n✅ Database update completed!')
  } catch (error) {
    console.error('❌ Error updating database:', error)
    await pool.end()
  }
}

updateDatabase() 