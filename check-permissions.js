const { Pool } = require('pg')

// PostgreSQL connection
const pgPool = new Pool({
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*',
})

async function checkPermissions() {
  try {
    console.log('🔍 Checking PostgreSQL permissions...')
    
    const client = await pgPool.connect()
    
    // Check current user
    const userResult = await client.query('SELECT current_user, session_user')
    console.log('Current user:', userResult.rows[0])
    
    // Check schema permissions
    const schemaResult = await client.query(`
      SELECT 
        nspname as schema_name,
        has_schema_privilege(current_user, nspname, 'CREATE') as can_create,
        has_schema_privilege(current_user, nspname, 'USAGE') as can_use
      FROM pg_namespace 
      WHERE nspname = 'public'
    `)
    console.log('Schema permissions:', schemaResult.rows[0])
    
    // Check if we can create tables
    try {
      await client.query('CREATE TABLE test_permissions (id SERIAL PRIMARY KEY)')
      console.log('✅ Can create tables')
      await client.query('DROP TABLE test_permissions')
      console.log('✅ Can drop tables')
    } catch (err) {
      console.log('❌ Cannot create tables:', err.message)
    }
    
    // List existing tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('Existing tables:', tablesResult.rows.map(row => row.table_name))
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error)
  } finally {
    await pgPool.end()
  }
}

checkPermissions() 