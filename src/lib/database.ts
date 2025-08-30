import { Pool, PoolClient } from 'pg'

let pool: Pool | null = null

export async function getDatabase(): Promise<PoolClient> {
  if (!pool) {
    // Database connection configuration
    // All values must be provided via environment variables
    const host = process.env.DB_HOST
    const port = process.env.DB_PORT
    const database = process.env.DB_NAME
    const user = process.env.DB_USER
    const password = process.env.DB_PASSWORD

    if (!host || !database || !user || !password) {
      throw new Error('Missing required database environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD')
    }

    pool = new Pool({
      host,
      port: parseInt(port || '5432'),
      database,
      user,
      password,
      max: 30,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 30000,
    })
    
    // Добавяме error handling за pool
    pool.on('error', (err) => {
      console.error('❌ Unexpected error on idle client', err)
    })
    
    pool.on('connect', () => {
      console.log('✅ New database connection established')
    })
  }
  
  try {
    const client = await pool.connect()
    
    // Create tables if they don't exist
    await createTablesIfNotExist(client)
    
    return client
  } catch (error) {
    console.error('❌ Error connecting to database:', error)
    
    // Retry logic
    if (pool) {
      console.log('🔄 Attempting to recreate pool...')
      await pool.end()
      pool = null
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Recursive call to recreate pool
      return getDatabase()
    }
    
    throw error
  }
}

async function createTablesIfNotExist(client: PoolClient) {
  try {
    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        service TEXT NOT NULL,
        serviceduration INTEGER DEFAULT 30,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
        treatment_notes TEXT,
        createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create users table with phone as unique identifier (but allowing NULL for admin users)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT UNIQUE NULL,
        address TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Alter existing table to allow NULL values for phone (if constraint exists)
    try {
      await client.query(`
        ALTER TABLE users 
        ALTER COLUMN phone DROP NOT NULL
      `)
    } catch (error) {
      // Column might already allow NULL or constraint doesn't exist
      console.log('Phone column already allows NULL or constraint not found')
    }
    
    // Create services table
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
    
    // Create working hours table
    await client.query(`
      CREATE TABLE IF NOT EXISTS working_hours (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL UNIQUE,
        is_working_day BOOLEAN DEFAULT true,
        start_time TEXT DEFAULT '09:00',
        end_time TEXT DEFAULT '18:00',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create breaks table for multiple breaks per day
    await client.query(`
      CREATE TABLE IF NOT EXISTS working_breaks (
        id SERIAL PRIMARY KEY,
        working_hours_id INTEGER REFERENCES working_hours(id) ON DELETE CASCADE,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        description TEXT DEFAULT 'Почивка',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create bug tracking tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
        category TEXT CHECK (category IN ('ui', 'functionality', 'performance', 'security', 'database')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        reporter TEXT NOT NULL,
        assigned_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        steps_to_reproduce TEXT[],
        expected_behavior TEXT,
        actual_behavior TEXT,
        browser TEXT,
        device TEXT,
        screenshots TEXT[],
        tags TEXT[]
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_comments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        author TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_internal BOOLEAN DEFAULT false
      )
    `)
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS bug_attachments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Insert default services if table is empty
    const servicesCount = await client.query('SELECT COUNT(*) as count FROM services')
    if (parseInt(servicesCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO services (name, description, duration, price) VALUES
        ('Преглед и консултация', 'Основен преглед на зъбите и консултация', 30, 50.00),
        ('Почистване и профилактика', 'Професионално почистване на зъбен камък', 45, 80.00),
        ('Лечение на кариес', 'Лечение на кариес с модерни материали', 60, 120.00),
        ('Отбелязване', 'Професионално отбелязване на зъбите', 90, 200.00),
        ('Ортодонтия', 'Консултация за ортодонтски лечение', 45, 100.00)
      `)
    }
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

export async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

// Database pool monitoring function
export function getPoolStatus() {
  if (!pool) return null
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  }
}

// Enhanced error logging
export function logDatabaseError(error: unknown, operation: string) {
  const err = error as Partial<{
    message: string
    code: string | number
    detail: string
    hint: string
    where: string
    stack: string
  }>
  console.error(`❌ Database error in ${operation}:`, {
    message: err?.message,
    code: err?.code,
    detail: err?.detail,
    hint: err?.hint,
    where: err?.where,
    stack: err?.stack
  })
}

// Helper function to convert SQLite-style queries to PostgreSQL
export function convertQuery(sqliteQuery: string): string {
  // Replace SQLite-specific syntax with PostgreSQL syntax
  return sqliteQuery
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    .replace(/BOOLEAN DEFAULT 1/g, 'BOOLEAN DEFAULT true')
    .replace(/BOOLEAN DEFAULT 0/g, 'BOOLEAN DEFAULT false')
    .replace(/datetime\('now', '-7 days'\)/g, "CURRENT_TIMESTAMP - INTERVAL '7 days'")
    .replace(/DATE\(/g, 'DATE(')
} 