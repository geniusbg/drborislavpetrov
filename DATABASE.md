# Database Configuration

## База данни: PostgreSQL

Приложението използва **PostgreSQL** база данни на отдалечен сървър.

### Конфигурация за връзка:

```javascript
const pool = new Pool({
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
```

### Важни бележки:

1. **НИКОГА не превключвайте на SQLite** - приложението е проектирано за PostgreSQL
2. **Винаги използвайте отдалечения сървър** - 192.168.1.134
3. **Правилните данни за връзка са в `src/lib/database.ts`**

### Структура на таблиците:

#### bookings
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `email` TEXT
- `phone` TEXT NOT NULL
- `service` TEXT NOT NULL (съхранява ID на услугата като string)
- `serviceDuration` INTEGER DEFAULT 30
- `date` TEXT NOT NULL
- `time` TEXT NOT NULL
- `message` TEXT
- `status` TEXT DEFAULT 'pending'
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### services
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `description` TEXT
- `duration` INTEGER NOT NULL DEFAULT 30
- `price` REAL
- `isActive` BOOLEAN DEFAULT true
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### users
- `id` SERIAL PRIMARY KEY
- `name` TEXT NOT NULL
- `email` TEXT
- `phone` TEXT UNIQUE (може да бъде NULL за админ потребители)
- `address` TEXT
- `notes` TEXT
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### JOIN логика:

При JOIN между `bookings` и `services`:
```sql
LEFT JOIN services s ON b.service = s.id::text
```

Това е защото `bookings.service` съхранява ID-то като TEXT, а `services.id` е INTEGER.

### Скриптове за обновяване:

Използвайте `update-database.js` за обновяване на базата данни:
```bash
node update-database.js
```

### ВНИМАНИЕ:
- Никога не променяйте на SQLite
- Винаги използвайте PostgreSQL с правилните данни за връзка
- Всички API route-ове са конфигурирани за PostgreSQL 