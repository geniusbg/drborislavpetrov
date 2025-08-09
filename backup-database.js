const { Pool } = require('pg')
const { exec } = require('child_process')
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
  
  const backupFileName = `drborislavpetrov_backup_${timestamp}.sql`
  const backupPath = path.join(BACKUP_DIR, backupFileName)
  
  console.log(`🔄 Starting backup: ${backupFileName}`)
  console.log(`📁 Backup path: ${backupPath}`)
  
  // PostgreSQL dump команда
  const dumpCommand = `pg_dump -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -f "${backupPath}"`
  
  // Set environment variable for password
  const env = { ...process.env, PGPASSWORD: DB_CONFIG.password }
  
  return new Promise((resolve, reject) => {
    exec(dumpCommand, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Backup failed:', error.message)
        reject(error)
        return
      }
      
      if (stderr) {
        console.warn('⚠️ Backup warnings:', stderr)
      }
      
      console.log('✅ Backup completed successfully!')
      console.log(`📊 Backup file: ${backupPath}`)
      
      // Проверка на размера на файла
      const stats = fs.statSync(backupPath)
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
      console.log(`📏 Backup size: ${fileSizeInMB} MB`)
      
      resolve(backupPath)
    })
  })
}

async function cleanupOldBackups() {
  console.log('🧹 Cleaning up old backups...')
  
  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)
    
    let deletedCount = 0
    
    for (const file of files) {
      if (!file.endsWith('.sql')) continue
      
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
    const backupFiles = files.filter(file => file.endsWith('.sql'))
    
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

module.exports = { createBackup, cleanupOldBackups, listBackups } 