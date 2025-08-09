-- Създаване на таблици за приложението drborislavpetrov
-- Изпълнете тези команди като postgres администратор

-- Създаване на bookings таблица
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  service INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Създаване на users таблица
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT UNIQUE NOT NULL,
  address TEXT,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Създаване на services таблица
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price REAL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Даване на права на drborislavpetrov потребителя
GRANT ALL PRIVILEGES ON TABLE bookings TO drborislavpetrov;
GRANT ALL PRIVILEGES ON TABLE users TO drborislavpetrov;
GRANT ALL PRIVILEGES ON TABLE services TO drborislavpetrov;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO drborislavpetrov;

-- Проверка на създадените таблици
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'; 