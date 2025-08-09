// 🧹 Скрипт за почистване на тестови данни
const { Pool } = require('pg');

async function cleanupTestData() {
  console.log('🧹 Започвам почистване на тестови данни...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'drborislavpetrov',
    user: 'postgres',
    password: 'postgres'
  });
  
  try {
    const client = await pool.connect();
    
    // 1. Изтрий тестови потребители
    console.log('📋 Изтривам тестови потребители...');
    const deleteUsersResult = await client.query(`
      DELETE FROM users 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%Auto Refresh%' 
         OR name LIKE '%History%' 
         OR name LIKE '%Calendar%'
    `);
    console.log(`✅ Изтрити ${deleteUsersResult.rowCount} тестови потребители`);
    
    // 2. Изтрий тестови услуги
    console.log('📋 Изтривам тестови услуги...');
    const deleteServicesResult = await client.query(`
      DELETE FROM services 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%Auto Refresh%' 
         OR name LIKE '%Calendar%'
    `);
    console.log(`✅ Изтрити ${deleteServicesResult.rowCount} тестови услуги`);
    
    // 3. Изтрий тестови резервации
    console.log('📋 Изтривам тестови резервации...');
    const deleteBookingsResult = await client.query(`
      DELETE FROM bookings 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%Auto Refresh%' 
         OR name LIKE '%History%' 
         OR name LIKE '%Calendar%'
         OR email LIKE '%test%'
    `);
    console.log(`✅ Изтрити ${deleteBookingsResult.rowCount} тестови резервации`);
    
    // 4. Изтрий тестови bug reports
    console.log('📋 Изтривам тестови bug reports...');
    const deleteBugReportsResult = await client.query(`
      DELETE FROM bug_reports 
      WHERE title LIKE '%Test%' 
         OR description LIKE '%Test%'
         OR reporter_name LIKE '%Test%'
    `);
    console.log(`✅ Изтрити ${deleteBugReportsResult.rowCount} тестови bug reports`);
    
    // 5. Провери оставащи данни
    console.log('📋 Проверявам оставащи данни...');
    
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    const servicesCount = await client.query('SELECT COUNT(*) FROM services');
    const bookingsCount = await client.query('SELECT COUNT(*) FROM bookings');
    const bugReportsCount = await client.query('SELECT COUNT(*) FROM bug_reports');
    
    console.log('📊 Оставащи данни:');
    console.log(`   - Потребители: ${usersCount.rows[0].count}`);
    console.log(`   - Услуги: ${servicesCount.rows[0].count}`);
    console.log(`   - Резервации: ${bookingsCount.rows[0].count}`);
    console.log(`   - Bug Reports: ${bugReportsCount.rows[0].count}`);
    
    client.release();
    console.log('✅ Почистването завърши успешно!');
    
  } catch (error) {
    console.error('💥 Грешка при почистване:', error.message);
  } finally {
    await pool.end();
  }
}

// Функция за почистване на конкретни тестови данни
async function cleanupSpecificTestData(testName) {
  console.log(`🧹 Почиствам данни за тест: ${testName}...`);
  
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'drborislavpetrov',
    user: 'postgres',
    password: 'postgres'
  });
  
  try {
    const client = await pool.connect();
    
    switch (testName) {
      case 'auto-refresh':
        // Изтрий данни от auto refresh теста
        await client.query(`
          DELETE FROM users WHERE name LIKE '%Auto Refresh%'
        `);
        await client.query(`
          DELETE FROM services WHERE name LIKE '%Auto Refresh%'
        `);
        console.log('✅ Изчистени auto-refresh тестови данни');
        break;
        
      case 'history':
        // Изтрий данни от history теста
        await client.query(`
          DELETE FROM users WHERE name LIKE '%History%'
        `);
        await client.query(`
          DELETE FROM bookings WHERE name LIKE '%History%'
        `);
        console.log('✅ Изчистени history тестови данни');
        break;
        
      case 'calendar':
        // Изтрий данни от calendar теста
        await client.query(`
          DELETE FROM users WHERE name LIKE '%Calendar%'
        `);
        await client.query(`
          DELETE FROM bookings WHERE name LIKE '%Calendar%'
        `);
        console.log('✅ Изчистени calendar тестови данни');
        break;
        
      default:
        console.log('❌ Неизвестен тест:', testName);
    }
    
    client.release();
    
  } catch (error) {
    console.error('💥 Грешка при почистване:', error.message);
  } finally {
    await pool.end();
  }
}

// Провери дали се извиква с аргумент
const testName = process.argv[2];
if (testName) {
  cleanupSpecificTestData(testName);
} else {
  cleanupTestData();
} 