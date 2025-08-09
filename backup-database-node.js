const { Pool } = require('pg')
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
const RETENTION_DAYS = 5

// Създаване на backup директорията ако не съществува
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  console.log('📁 Created backup directory:', BACKUP_DIR)
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                   new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0]
  
  const backupFileName = `drborislavpetrov_backup_${timestamp}.json`
  const backupPath = path.join(BACKUP_DIR, backupFileName)
  
  console.log(`🔄 Starting backup: ${backupFileName}`)
  console.log(`📁 Backup path: ${backupPath}`)
  
  const pool = new Pool(DB_CONFIG)
  
  try {
    const client = await pool.connect()
    
    // Backup структура
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        database: DB_CONFIG.database,
        host: DB_CONFIG.host
      },
      tables: {}
    }
    
    // Backup bookings table
    console.log('📊 Backing up bookings table...')
    const bookingsResult = await client.query('SELECT * FROM bookings ORDER BY id')
    backup.tables.bookings = bookingsResult.rows
    
    // Backup users table
    console.log('👥 Backing up users table...')
    const usersResult = await client.query('SELECT * FROM users ORDER BY id')
    backup.tables.users = usersResult.rows
    
    // Backup services table
    console.log('🦷 Backing up services table...')
    const servicesResult = await client.query('SELECT * FROM services ORDER BY id')
    backup.tables.services = servicesResult.rows
    
    // Backup working_hours table
    console.log('⏰ Backing up working_hours table...')
    const workingHoursResult = await client.query('SELECT * FROM working_hours ORDER BY id')
    backup.tables.working_hours = workingHoursResult.rows
    
    // Backup working_breaks table
    console.log('☕ Backing up working_breaks table...')
    const workingBreaksResult = await client.query('SELECT * FROM working_breaks ORDER BY id')
    backup.tables.working_breaks = workingBreaksResult.rows
    
    // Backup bug_reports table
    console.log('🐛 Backing up bug_reports table...')
    const bugReportsResult = await client.query('SELECT * FROM bug_reports ORDER BY id')
    backup.tables.bug_reports = bugReportsResult.rows
    
    // Backup bug_comments table
    console.log('💬 Backing up bug_comments table...')
    const bugCommentsResult = await client.query('SELECT * FROM bug_comments ORDER BY id')
    backup.tables.bug_comments = bugCommentsResult.rows
    
    // Backup bug_attachments table
    console.log('📎 Backing up bug_attachments table...')
    const bugAttachmentsResult = await client.query('SELECT * FROM bug_attachments ORDER BY id')
    backup.tables.bug_attachments = bugAttachmentsResult.rows
    
    client.release()
    
    // Записване на backup файла
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    
    // Проверка на размера на файла
    const stats = fs.statSync(backupPath)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    
    console.log('✅ Backup completed successfully!')
    console.log(`📊 Backup file: ${backupPath}`)
    console.log(`📏 Backup size: ${fileSizeInMB} MB`)
    console.log(`📊 Records backed up:`)
    console.log(`   - Bookings: ${backup.tables.bookings.length}`)
    console.log(`   - Users: ${backup.tables.users.length}`)
    console.log(`   - Services: ${backup.tables.services.length}`)
    console.log(`   - Working Hours: ${backup.tables.working_hours.length}`)
    console.log(`   - Working Breaks: ${backup.tables.working_breaks.length}`)
    console.log(`   - Bug Reports: ${backup.tables.bug_reports.length}`)
    console.log(`   - Bug Comments: ${backup.tables.bug_comments.length}`)
    console.log(`   - Bug Attachments: ${backup.tables.bug_attachments.length}`)
    
    return backupPath
  } catch (error) {
    console.error('❌ Backup failed:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

async function restoreFromBackup(backupPath) {
  console.log(`🔄 Starting restore from: ${path.basename(backupPath)}`)
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`)
  }
  
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
  const pool = new Pool(DB_CONFIG)
  
  try {
    const client = await pool.connect()
    
    console.log('⚠️  WARNING: This will overwrite the current database!')
    console.log('⚠️  Make sure you have a backup of current data if needed.')
    
    // Begin transaction
    await client.query('BEGIN')
    
    try {
      // Restore bookings
      if (backup.tables.bookings && backup.tables.bookings.length > 0) {
        console.log('📊 Restoring bookings...')
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
        console.log('👥 Restoring users...')
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
        console.log('🦷 Restoring services...')
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
      console.log('✅ Restore completed successfully!')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
    client.release()
  } catch (error) {
    console.error('❌ Restore failed:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...')
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)
    
    let deletedCount = 0
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      const fileDate = new Date(stats.mtime)
      
      if (fileDate < cutoffDate) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ Deleted old backup: ${file}`)
        deletedCount++
      }
    }
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} old backups.`)
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  }
}

async function listBackups() {
  console.log('📋 Current backups:')
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const backupFiles = files.filter(file => file.endsWith('.json'))
    
    if (backupFiles.length === 0) {
      console.log('   No backup files found.')
      return
    }
    
    // Sort by modification time (newest first)
    const fileStats = backupFiles.map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      return {
        name: file,
        size: (stats.size / (1024 * 1024)).toFixed(2),
        date: stats.mtime
      }
    }).sort((a, b) => b.date - a.date)
    
    fileStats.forEach((file, index) => {
      const age = Math.floor((Date.now() - file.date.getTime()) / (1000 * 60 * 60 * 24))
      console.log(`   ${index + 1}. ${file.name}`)
      console.log(`      Size: ${file.size} MB`)
      console.log(`      Age: ${age} days ago`)
    })
  } catch (error) {
    console.error('❌ Error listing backups:', error.message)
  }
}

async function testDatabaseConnection() {
  const pool = new Pool(DB_CONFIG)
  
  try {
    const client = await pool.connect()
    console.log('✅ Database connection test successful!')
    client.release()
    return true
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message)
    return false
  } finally {
    await pool.end()
  }
}

async function main() {
  console.log('🚀 Starting database backup process...')
  console.log(`⏰ Time: ${new Date().toLocaleString('bg-BG')}`)
  console.log(`📅 Retention: ${RETENTION_DAYS} days`)
  
  // Test database connection first
  const connectionOk = await testDatabaseConnection()
  if (!connectionOk) {
    console.error('❌ Cannot proceed with backup - database connection failed!')
    process.exit(1)
  }
  
  try {
    // Create backup
    await createBackup()
    
    // Cleanup old backups
    await cleanupOldBackups()
    
    // List current backups
    await listBackups()
    
    console.log('🎉 Backup process completed successfully!')
  } catch (error) {
    console.error('❌ Backup process failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { createBackup, restoreFromBackup, cleanupOldBackups, listBackups } 