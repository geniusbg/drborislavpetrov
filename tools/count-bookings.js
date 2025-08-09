const { Client } = require('pg')

const client = new Client({
  host: process.env.DB_HOST || '192.168.1.134',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'drborislavpetrov',
  user: process.env.DB_USER || 'drborislavpetrov',
  password: process.env.DB_PASSWORD || 'Xander123)(*'
})

;(async () => {
  try {
    console.log('[count-bookings] Connecting...')
    await client.connect()
    console.log('[count-bookings] Connected')
    const totalRes = await client.query('SELECT COUNT(*)::int AS count FROM bookings')
    const distinctRes = await client.query('SELECT COUNT(DISTINCT id)::int AS count FROM bookings')
    const total = totalRes.rows[0]?.count ?? 0
    const distinct = distinctRes.rows[0]?.count ?? 0
    console.log(JSON.stringify({ totalBookings: total, distinctIds: distinct }))
  } catch (err) {
    console.error('[count-bookings] Error:', err && err.message ? err.message : err)
    process.exit(1)
  } finally {
    await client.end()
    console.log('[count-bookings] Done')
  }
})()


