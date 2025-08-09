const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'postgres',
  password: 'your_password_here'
});

async function createBugTrackerTables() {
  try {
    console.log('🔄 Creating bug tracker tables...');
    
    // Създаване на bug_reports таблица
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        severity VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(50),
        status VARCHAR(50) DEFAULT 'open',
        priority VARCHAR(50) DEFAULT 'medium',
        reporter VARCHAR(100),
        assigned_to VARCHAR(100),
        steps_to_reproduce TEXT,
        expected_behavior TEXT,
        actual_behavior TEXT,
        browser VARCHAR(100),
        device VARCHAR(100),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ bug_reports table created');

    // Създаване на bug_comments таблица
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bug_comments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        author VARCHAR(100) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ bug_comments table created');

    // Създаване на bug_attachments таблица
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bug_attachments (
        id SERIAL PRIMARY KEY,
        bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ bug_attachments table created');

    // Даване на права
    await pool.query('GRANT ALL PRIVILEGES ON TABLE bug_reports TO drborislavpetrov');
    await pool.query('GRANT ALL PRIVILEGES ON TABLE bug_comments TO drborislavpetrov');
    await pool.query('GRANT ALL PRIVILEGES ON TABLE bug_attachments TO drborislavpetrov');
    await pool.query('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drborislavpetrov');
    console.log('✅ Permissions granted');

    // Проверка на създадените таблици
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'bug_%'
    `);
    
    console.log('📋 Bug tracker tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('🎉 Bug tracker tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating bug tracker tables:', error);
  } finally {
    await pool.end();
  }
}

createBugTrackerTables(); 