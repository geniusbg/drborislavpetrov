const fs = require('fs')
const path = require('path')

// Конфигурация
const DB_CONFIG = {
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*'
}

const BACKUP_DIR = path.join(__dirname, 'backups')

async function listAvailableBackups() {
  console.log('Available backups:')
  
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('Backup directory not found:', BACKUP_DIR)
      return []
    }
    
    const files = fs.readdirSync(BACKUP_DIR)
    const backupFiles = files.filter(file => file.endsWith('.json'))
    
    if (backupFiles.length === 0) {
      console.log('   No backup files found.')
      return []
    }
    
    // Sort by modification time (newest first)
    const fileStats = backupFiles.map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        path: filePath,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        date: stats.mtime
      }
    }).sort((a, b) => b.date - a.date)
    
    fileStats.forEach((file, index) => {
      const age = Math.floor((Date.now() - file.date.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`   ${index + 1}. ${file.name}`)
      console.log(`      Size: ${file.size} MB`)
      console.log(`      Age: ${age} days ago`)
      console.log(`      Date: ${file.date.toLocaleString('bg-BG')}`)
    })
    
    return fileStats
  } catch (error) {
    console.error('Error listing backups:', error.message)
    return []
  }
}

async function restoreFromBackup(backupPath) {
  console.log(`Starting restore from: ${path.basename(backupPath)}`)
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }
  
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  const { Pool } = require('pg')
  const pool = new Pool(DB_CONFIG)
  
  try {
    const client = await pool.connect()
    
    console.log('WARNING: This will overwrite the current database!')
    console.log('Make sure you have a backup of current data if needed.')
    
    // Begin transaction
    await client.query('BEGIN')
    
    try {
      // Restore bookings
      if (backup.tables.bookings && backup.tables.bookings.length > 0) {
        console.log('Restoring bookings...')
        await client.query('DELETE FROM bookings')
        for (const booking of backup.tables.bookings) {
          await client.query(`
            INSERT INTO bookings (id, name, email, phone, service, serviceduration, date, time, message, status, treatment_notes, createdat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            booking.id, booking.name, booking.email, booking.phone, booking.service,
            booking.serviceduration, booking.date, booking.time, booking.message,
            booking.status, booking.treatment_notes, booking.createdat
          ])
        }
      }
      
      // Restore users
      if (backup.tables.users && backup.tables.users.length > 0) {
        console.log('Restoring users...')
        await client.query('DELETE FROM users')
        for (const user of backup.tables.users) {
          await client.query(`
            INSERT INTO users (id, name, email, phone, address, notes, createdat, updatedat)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            user.id, user.name, user.email, user.phone, user.address,
            user.notes, user.createdat, user.updatedat
          ])
        }
      }
      
      // Restore services
      if (backup.tables.services && backup.tables.services.length > 0) {
        console.log('Restoring services...')
        await client.query('DELETE FROM services')
        for (const service of backup.tables.services) {
          await client.query(`
            INSERT INTO services (id, name, description, duration, price, isactive, createdat)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            service.id, service.name, service.description, service.duration,
            service.price, service.isactive, service.createdat
          ])
        }
      }
      
      // Commit transaction
      await client.query('COMMIT')
      console.log('Restore completed successfully!')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
    client.release()
  } catch (error) {
    console.error('Restore failed:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

async function testDatabaseConnection() {
  const { Pool } = require('pg')
  const pool = new Pool(DB_CONFIG)
  
  try {
    const client = await pool.connect()
    console.log('Database connection test successful!')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection test failed:', error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function main() {
  console.log('Database Restore Tool')
  console.log(`Time: ${new Date().toLocaleString('bg-BG')}`)
  
  // Test database connection first
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.error('Cannot proceed with restore - database connection failed!')
    process.exit(1)
  }
  
  // List available backups
  const backups = await listAvailableBackups()
  
  if (backups.length === 0) {
    console.log('No backup files available for restore.')
    process.exit(1)
  }
  
  // If backup file is provided as argument
  const backupFile = process.argv[2]
  
  if (backupFile) {
    const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile)
    
    try {
      await restoreFromBackup(backupPath)
      console.log('Restore completed successfully!')
    } catch (error) {
      console.error('Restore failed:', error.message)
      process.exit(1)
    }
  } else {
    console.log('')
    console.log('Usage: node restore-database-node.js <backup-file-name>')
    console.log('Example: node restore-database-node.js drborislavpetrov_backup_2025-08-03_12-49-08-274Z.json')
    console.log('')
    console.log('Available backups (use the filename from the list above):')
    backups.forEach((backup, index) => {
      console.log(`   ${index + 1}. ${backup.name}`)
    })
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { listAvailableBackups, restoreFromBackup } 