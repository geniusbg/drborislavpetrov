const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'postgres',
  password: 'your_password_here'
});

async function checkBugTable() {
  try {
    console.log('🔍 Checking bug_reports table structure...');
    
    // Проверка на структурата на таблицата
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'bug_reports'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    structureResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} ${row.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Проверка на съществуващи данни
    const dataResult = await pool.query('SELECT COUNT(*) as count FROM bug_reports');
    console.log(`📊 Total bugs in table: ${dataResult.rows[0].count}`);

    // Проверка на последните 3 bugs
    const recentBugs = await pool.query('SELECT id, title, created_at FROM bug_reports ORDER BY created_at DESC LIMIT 3');
    console.log('📝 Recent bugs:');
    recentBugs.rows.forEach(bug => {
      console.log(`   ID: ${bug.id}, Title: ${bug.title}, Created: ${bug.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error checking bug table:', error);
  } finally {
    await pool.end();
  }
}

checkBugTable(); 