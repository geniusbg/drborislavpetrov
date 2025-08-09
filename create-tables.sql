-- Създаване на таблици за приложението drborislavpetrov
-- Изпълнете тези команди като postgres администратор

-- Създаване на bookings таблица
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  service INTEGER REFERENCES services(id),
  serviceDuration INTEGER DEFAULT 30,
  date DATE NOT NULL,
  time TIME NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  treatment_notes TEXT,
  createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Създаване на users таблица
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT UNIQUE, -- Променено: премахнат NOT NULL, за да позволим администраторски потребители без телефон
  address TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Създаване на services таблица
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price REAL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Даване на права на drborislavpetrov потребителя
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO drborislavpetrov;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO drborislavpetrov;
GRANT CREATE ON SCHEMA public TO drborislavpetrov;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO drborislavpetrov;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO drborislavpetrov;

-- Проверка на създадените таблици
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'; 