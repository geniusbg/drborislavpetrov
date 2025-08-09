const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Database configuration - using remote server
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

async function createSupportNotesTable() {
  try {
    console.log('Creating support_notes table...')
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-support-notes-table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Execute SQL
    const client = await pool.connect()
    
    try {
      await client.query(sqlContent)
      console.log('✅ Support notes table created successfully!')
      
      // Verify the table was created
      const result = await client.query(`
        SELECT COUNT(*) as count FROM support_notes
      `)
      
      console.log(`📊 Found ${result.rows[0].count} support notes in the database`)
      
    } finally {
      client.release()
    }
    
  } catch (error) {
    console.error('❌ Error creating support notes table:', error)
  } finally {
    await pool.end()
  }
}

createSupportNotesTable() 