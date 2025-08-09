-- Създаване на bug tracker таблици
-- Изпълнете тези команди като postgres администратор

-- Създаване на bug_reports таблица
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
);

-- Създаване на bug_comments таблица
CREATE TABLE IF NOT EXISTS bug_comments (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
  author VARCHAR(100) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Създаване на bug_attachments таблица
CREATE TABLE IF NOT EXISTS bug_attachments (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER REFERENCES bug_reports(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Даване на права
GRANT ALL PRIVILEGES ON TABLE bug_reports TO drborislavpetrov;
GRANT ALL PRIVILEGES ON TABLE bug_comments TO drborislavpetrov;
GRANT ALL PRIVILEGES ON TABLE bug_attachments TO drborislavpetrov;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drborislavpetrov;

-- Проверка на създадените таблици
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'bug_%'; 