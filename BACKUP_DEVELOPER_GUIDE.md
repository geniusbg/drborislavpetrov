# 👨‍💻 Backup System Developer Guide

## 🎯 Бърз старт

### 1. Структура на проекта
```
backup-system/
├── src/components/admin/
│   ├── BackupManager.tsx      # Основен компонент
│   └── BackupConfig.tsx       # Конфигурационен модал
├── src/app/api/admin/backups/
│   ├── route.ts               # Основен API
│   ├── config/route.ts        # Конфигурация API
│   ├── [fileName]/route.ts    # DELETE API
│   └── [fileName]/restore/route.ts # RESTORE API
├── backup-database-node.js    # Backup скрипт
├── restore-database-node.js   # Restore скрипт
├── backup-config.json         # Конфигурация
└── backups/                   # Backup файлове
```

### 2. Инсталация и настройка
```bash
# 1. Клонирай проекта
git clone <repository>

# 2. Инсталирай зависимости
npm install

# 3. Стартирай сървъра
npm run dev

# 4. Отвори админ панела
http://localhost:3000/admin?tab=backup
```

---

## 🔧 Разработка

### Добавяне на нови функции

#### 1. Нова API endpoint
```typescript
// src/app/api/admin/backups/new-feature/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Проверка на admin token
  const adminToken = request.headers.get('x-admin-token')
  if (adminToken !== 'mock-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Твоята логика тук
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

#### 2. Нов UI компонент
```typescript
// src/components/admin/NewFeature.tsx
'use client'

import { useState, useEffect } from 'react'

interface NewFeatureProps {
  onSuccess?: () => void
}

export default function NewFeature({ onSuccess }: NewFeatureProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAction = async () => {
    setIsLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const response = await fetch('/api/admin/backups/new-feature', {
        headers: {
          'x-admin-token': adminToken || ''
        }
      })
      
      if (response.ok) {
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4">
      <button
        onClick={handleAction}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {isLoading ? 'Loading...' : 'New Feature'}
      </button>
    </div>
  )
}
```

#### 3. Интеграция в BackupManager
```typescript
// В BackupManager.tsx
import NewFeature from './NewFeature'

// В render функцията
{showNewFeature && (
  <NewFeature
    onSuccess={() => {
      setShowNewFeature(false)
      loadBackups() // Обнови данните
    }}
  />
)}
```

---

## 🧪 Тестване

### 1. Unit тестове
```typescript
// __tests__/backup-manager.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import BackupManager from '../src/components/admin/BackupManager'

describe('BackupManager', () => {
  test('renders backup statistics', () => {
    render(<BackupManager />)
    expect(screen.getByText('Backup Управление')).toBeInTheDocument()
  })

  test('shows config modal when clicked', () => {
    render(<BackupManager />)
    fireEvent.click(screen.getByText('Конфигурация'))
    expect(screen.getByText('Backup Конфигурация')).toBeInTheDocument()
  })
})
```

### 2. API тестове
```typescript
// __tests__/api/backups.test.ts
import { NextRequest } from 'next/server'
import { GET, POST } from '../src/app/api/admin/backups/route'

describe('Backup API', () => {
  test('GET returns backup list', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/backups', {
      headers: { 'x-admin-token': 'mock-token' }
    })
    
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data).toHaveProperty('backups')
    expect(data).toHaveProperty('stats')
  })
})
```

### 3. Integration тестове
```bash
# Тестване на backup скрипта
node backup-database-node.js

# Тестване на restore скрипта
node restore-database-node.js

# Тестване на API endpoints
curl -H "x-admin-token: mock-token" http://localhost:3000/api/admin/backups
```

---

## 🐛 Debugging

### 1. Console логове
```typescript
// Добави в компонентите
console.log('🔄 Config changed:', newConfig)
console.log('📊 Updating stats with new retention days:', newConfig.retentionDays)
console.log('📊 New stats:', newStats)
```

### 2. Browser DevTools
```javascript
// В browser console
// Проверка на backup файлове
fetch('/api/admin/backups', {
  headers: { 'x-admin-token': 'mock-token' }
}).then(r => r.json()).then(console.log)

// Проверка на конфигурация
fetch('/api/admin/backups/config', {
  headers: { 'x-admin-token': 'mock-token' }
}).then(r => r.json()).then(console.log)
```

### 3. Server логове
```bash
# Проверка на server логове
npm run dev

# Проверка на backup логове
node backup-database-node.js
```

---

## 🔄 Deployment

### 1. Production настройки
```json
// backup-config.json
{
  "retentionDays": 30,
  "backupInterval": 6,
  "backupFormat": "json",
  "backupLocation": "/var/backups/",
  "autoBackup": true,
  "compression": true
}
```

### 2. Environment variables
```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
BACKUP_DIR=/var/backups/
ADMIN_TOKEN=your-secure-token
```

### 3. Scheduled tasks
```powershell
# Windows Task Scheduler
.\setup-backup-scheduler-simple.ps1

# Linux cron job
0 */6 * * * /usr/bin/node /path/to/backup-database-node.js
```

---

## 📊 Мониторинг

### 1. Backup статистики
```typescript
// Проверка на backup статистики
interface BackupStats {
  totalBackups: number
  totalSize: string
  oldestBackup: string
  newestBackup: string
  retentionDays: number
}
```

### 2. Error tracking
```typescript
// Добави error tracking
const handleError = (error: Error) => {
  console.error('Backup Error:', error)
  // Изпрати към error tracking service
  // Sentry.captureException(error)
}
```

### 3. Performance monitoring
```typescript
// Добави performance monitoring
const startTime = Date.now()
// ... backup операция
const duration = Date.now() - startTime
console.log(`Backup completed in ${duration}ms`)
```

---

## 🔒 Безопасност

### 1. Authentication
```typescript
// Проверка на admin token
function checkAdminToken(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')
  return adminToken === process.env.ADMIN_TOKEN
}
```

### 2. File validation
```typescript
// Проверка на backup файлове
function validateBackupFile(fileName: string) {
  const backupDir = path.join(process.cwd(), 'backups')
  const filePath = path.join(backupDir, fileName)
  
  // Проверка дали файлът е в backup директорията
  if (!filePath.startsWith(backupDir)) {
    throw new Error('Invalid file path')
  }
  
  return filePath
}
```

### 3. Database security
```typescript
// Използвай parameterized queries
const query = 'SELECT * FROM users WHERE id = $1'
const result = await client.query(query, [userId])
```

---

## 🚀 Performance

### 1. Оптимизация на UI
```typescript
// Използвай React.memo за компоненти
const BackupItem = React.memo(({ backup }: { backup: BackupFile }) => {
  return (
    <div className="backup-item">
      {backup.name}
    </div>
  )
})

// Използвай useMemo за изчисления
const filteredBackups = useMemo(() => {
  return backups.filter(backup => backup.age < config.retentionDays)
}, [backups, config.retentionDays])
```

### 2. Оптимизация на API
```typescript
// Кеширане на статистики
const statsCache = new Map()

export async function GET(request: NextRequest) {
  const cacheKey = 'backup-stats'
  const cached = statsCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < 60000) {
    return NextResponse.json(cached.data)
  }
  
  const stats = await calculateStats()
  statsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  })
  
  return NextResponse.json(stats)
}
```

### 3. Оптимизация на backup
```typescript
// Компресия на backup файлове
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

async function createCompressedBackup(data: any) {
  const jsonData = JSON.stringify(data)
  const compressed = await gzipAsync(Buffer.from(jsonData))
  return compressed
}
```

---

## 📚 Полезни ресурси

### 1. Документация
- [PostgreSQL Backup](https://www.postgresql.org/docs/current/backup.html)
- [Node.js File System](https://nodejs.org/api/fs.html)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### 2. Инструменти
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html) - PostgreSQL backup
- [zlib](https://nodejs.org/api/zlib.html) - Компресия
- [cron](https://en.wikipedia.org/wiki/Cron) - Scheduled tasks

### 3. Best practices
- Винаги тествай backup и restore в development
- Документирай всички промени
- Следвай security best practices
- Мониторирай performance

---

## 🆘 Поддръжка

### Често срещани проблеми:

1. **"Failed to load backups"**
   - Провери database връзката
   - Провери правата за достъп

2. **"Backup failed"**
   - Провери Node.js installation
   - Провери database credentials

3. **"Restore failed"**
   - Провери backup файла
   - Провери database permissions

### Контакти:
- Създай issue в GitHub
- Провери логовете в конзолата
- Тествай в development среда

**Важно**: Винаги прави backup преди да правиш промени в production! 