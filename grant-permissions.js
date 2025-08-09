const { Pool } = require('pg')

// PostgreSQL connection
const pgPool = new Pool({
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*',
})

async function grantPermissions() {
  try {
    console.log('🔐 Attempting to grant permissions...')
    
    const client = await pgPool.connect()
    
    // Try to grant permissions
    try {
      console.log('📋 Trying to grant CREATE permission...')
      await client.query('GRANT CREATE ON SCHEMA public TO drborislavpetrov')
      console.log('✅ Granted CREATE permission')
    } catch (err) {
      console.log('⚠️ Could not grant CREATE permission:', err.message)
    }
    
    try {
      console.log('📋 Trying to grant USAGE permission...')
      await client.query('GRANT USAGE ON SCHEMA public TO drborislavpetrov')
      console.log('✅ Granted USAGE permission')
    } catch (err) {
      console.log('⚠️ Could not grant USAGE permission:', err.message)
    }
    
    // Check current permissions
    console.log('🔍 Checking current permissions...')
    const permResult = await client.query(`
      SELECT 
        has_schema_privilege('drborislavpetrov', 'public', 'CREATE') as can_create,
        has_schema_privilege('drborislavpetrov', 'public', 'USAGE') as can_use
    `)
    console.log('Current permissions:', permResult.rows[0])
    
    client.release()
    
  } catch (error) {
    console.error('❌ Error granting permissions:', error)
  } finally {
    await pgPool.end()
  }
}

grantPermissions() 