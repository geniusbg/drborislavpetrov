# 🔄 Backup System Documentation

## 📋 Съдържание
1. [Общ преглед](#общ-преглед)
2. [Архитектура](#архитектура)
3. [Компоненти](#компоненти)
4. [API Endpoints](#api-endpoints)
5. [Конфигурация](#конфигурация)
6. [Използване](#използване)
7. [Troubleshooting](#troubleshooting)
8. [Поддръжка](#поддръжка)

---

## 🎯 Общ преглед

Backup системата предоставя автоматично и ръчно резервно копие на базата данни с управление на retention policy, компресия и възстановяване.

### ✨ Основни функции:
- ✅ **Автоматичен backup** на всеки час
- ✅ **Ръчен backup** с едно кликване
- ✅ **Retention policy** - автоматично изтриване на стари backup-и
- ✅ **Възстановяване** от backup файлове
- ✅ **Конфигурация** на всички настройки
- ✅ **Статистики** и мониторинг
- ✅ **Компресия** на backup файлове

---

## 🏗️ Архитектура

### Файлова структура:
```
src/
├── components/admin/
│   ├── BackupManager.tsx      # Основен UI компонент
│   └── BackupConfig.tsx       # Конфигурационен модал
├── app/api/admin/backups/
│   ├── route.ts               # GET/POST - списък и създаване
│   ├── config/route.ts        # GET/POST - конфигурация
│   ├── [fileName]/route.ts    # DELETE - изтриване
│   └── [fileName]/restore/route.ts # POST - възстановяване
└── lib/
    └── database.ts            # Database връзка

backup-database-node.js        # Node.js backup скрипт
restore-database-node.js       # Node.js restore скрипт
backup-config.json            # Конфигурационен файл
backups/                      # Директория за backup файлове
```

### Data Flow:
```
UI (BackupManager) 
    ↓
API Endpoints (/api/admin/backups/*)
    ↓
Node.js Scripts (backup-database-node.js)
    ↓
PostgreSQL Database
```

---

## 🧩 Компоненти

### 1. BackupManager.tsx
**Локация**: `src/components/admin/BackupManager.tsx`

**Функции**:
- Показване на backup статистики
- Списък на backup файлове
- Ръчно създаване на backup
- Изтриване на backup файлове
- Възстановяване от backup
- Управление на конфигурацията

**Props**: Няма (самостоятелен компонент)

**State**:
```typescript
interface BackupFile {
  name: string
  size: string
  date: string
  age: string
}

interface BackupStats {
  totalBackups: number
  totalSize: string
  oldestBackup: string
  newestBackup: string
  retentionDays: number
}

interface BackupConfig {
  retentionDays: number
  backupInterval: number
  backupFormat: 'json' | 'sql'
  backupLocation: string
  autoBackup: boolean
  compression: boolean
}
```

### 2. BackupConfig.tsx
**Локация**: `src/components/admin/BackupConfig.tsx`

**Функции**:
- Промяна на retention policy
- Настройка на backup интервал
- Избор на backup формат
- Включване/изключване на компресия
- Промяна на backup локация

**Props**:
```typescript
interface BackupConfigProps {
  onConfigChange: (config: BackupConfig) => void
  onClose: () => void
}
```

---

## 🔌 API Endpoints

### 1. GET /api/admin/backups
**Функция**: Вземане на списък с backup файлове и статистики

**Response**:
```json
{
  "backups": [
    {
      "name": "drborislavpetrov_backup_2025-08-03_12-54-43-253Z.json",
      "size": "0.02 MB",
      "date": "3.08.2025 г., 05:54:43 ч.",
      "age": "0 дни"
    }
  ],
  "stats": {
    "totalBackups": 1,
    "totalSize": "0.02 MB",
    "oldestBackup": "3.08.2025 г., 05:54:43 ч.",
    "newestBackup": "3.08.2025 г., 05:54:43 ч.",
    "retentionDays": 5
  }
}
```

### 2. POST /api/admin/backups
**Функция**: Създаване на нов backup

**Response**:
```json
{
  "success": true,
  "message": "Backup created successfully",
  "fileName": "drborislavpetrov_backup_2025-08-03_13-41-51-228Z.json"
}
```

### 3. GET /api/admin/backups/config
**Функция**: Вземане на текущата конфигурация

**Response**:
```json
{
  "config": {
    "retentionDays": 5,
    "backupInterval": 1,
    "backupFormat": "json",
    "backupLocation": "./backups/",
    "autoBackup": true,
    "compression": false
  }
}
```

### 4. POST /api/admin/backups/config
**Функция**: Запазване на нова конфигурация

**Request Body**:
```json
{
  "retentionDays": 4,
  "backupInterval": 2,
  "backupFormat": "json",
  "backupLocation": "./backups/",
  "autoBackup": true,
  "compression": true
}
```

### 5. DELETE /api/admin/backups/[fileName]
**Функция**: Изтриване на конкретен backup файл

**Response**:
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

### 6. POST /api/admin/backups/[fileName]/restore
**Функция**: Възстановяване от backup файл

**Response**:
```json
{
  "success": true,
  "message": "Database restored successfully"
}
```

---

## ⚙️ Конфигурация

### Конфигурационен файл: `backup-config.json`
```json
{
  "retentionDays": 5,
  "backupInterval": 1,
  "backupFormat": "json",
  "backupLocation": "./backups/",
  "autoBackup": true,
  "compression": false
}
```

### Параметри:

| Параметър | Описание | Диапазон | По подразбиране |
|-----------|----------|----------|------------------|
| `retentionDays` | Дни за запазване на backup-ите | 1-365 | 5 |
| `backupInterval` | Интервал на автоматичен backup (часове) | 1-24 | 1 |
| `backupFormat` | Формат на backup файловете | `json` \| `sql` | `json` |
| `backupLocation` | Директория за backup файлове | string | `./backups/` |
| `autoBackup` | Включване на автоматичен backup | boolean | `true` |
| `compression` | Компресия на backup файлове | boolean | `false` |

---

## 🚀 Използване

### 1. Достъп до Backup системата
```
1. Отвори админ панела: http://localhost:3000/admin
2. Кликни на "Backup" таба
3. Влизаш в Backup Управление
```

### 2. Преглед на статистики
```
- Общо Backups: Брой налични backup файлове
- Общ размер: Общ размер на всички backup-и
- Retention Policy: Дни за запазване (оранжев банер)
- Последен: Дата на последния backup
```

### 3. Ръчно създаване на backup
```
1. Кликни "Ръчен Backup" бутон (син)
2. Изчакай съобщението "Backup създаден успешно"
3. Backup файлът се появява в списъка
```

### 4. Конфигурация на настройките
```
1. Кликни "Конфигурация" бутон (оранжев)
2. Промени желаните настройки:
   - Retention Policy: 1-365 дни
   - Backup Интервал: 1-24 часа
   - Формат: JSON или SQL
   - Компресия: Включи/изключи
3. Кликни "Запази"
```

### 5. Възстановяване от backup
```
1. Намери желания backup файл в списъка
2. Кликни "Възстанови" бутон (зелен)
3. Потвърди действието
4. Изчакай съобщението за успешно възстановяване
```

### 6. Изтриване на backup
```
1. Намери backup файла в списъка
2. Кликни "Изтрий" бутон (червен)
3. Потвърди действието
4. Backup файлът се изтрива
```

---

## 🔧 Troubleshooting

### Проблем: "Failed to load backups"
**Причина**: Проблем с API endpoint или database връзка
**Решение**:
1. Провери дали сървърът работи
2. Провери database връзката
3. Провери правата за достъп до `backups/` директорията

### Проблем: "Backup failed"
**Причина**: Проблем с Node.js backup скрипта
**Решение**:
1. Провери дали `backup-database-node.js` съществува
2. Провери database credentials
3. Провери правата за писане в `backups/` директорията

### Проблем: "Restore failed"
**Причина**: Проблем с restore скрипта или database
**Решение**:
1. Провери дали backup файлът съществува
2. Провери database permissions
3. Провери дали backup файлът е валиден

### Проблем: Retention policy не се обновява
**Причина**: Проблем с конфигурационния файл
**Решение**:
1. Провери `backup-config.json` файла
2. Провери правата за писане
3. Рестартирай сървъра

### Проблем: Автоматичен backup не работи
**Причина**: Проблем със scheduled task
**Решение**:
1. Провери Windows Task Scheduler
2. Провери `start-backup-scheduler.bat`
3. Провери Node.js installation

---

## 🛠️ Поддръжка

### Автоматичен backup
```batch
# Стартиране на автоматичен backup
start-backup-scheduler.bat
```

### Ръчен backup
```bash
# Създаване на backup
node backup-database-node.js

# Възстановяване от backup
node restore-database-node.js
```

### PowerShell Scheduled Task
```powershell
# Създаване на scheduled task
.\setup-backup-scheduler-simple.ps1
```

### Мониторинг на backup файлове
```bash
# Списък на backup файлове
dir backups\

# Проверка на размера
dir backups\ /s
```

### Логове
- Backup логове: `backup-database-node.js` console output
- API логове: Server console output
- Error логове: Browser console (F12)

---

## 📝 Допълнителни бележки

### Безопасност
- Всички API endpoints изискват `x-admin-token`
- Backup файловете се запазват локално
- Възстановяването презаписва цялата база данни

### Производителност
- Backup файловете се компресират ако е включено
- Статистиката се кешира за по-бързо зареждане
- UI анимации са оптимизирани за плавност

### Backup формати
- **JSON**: Рекомендуван, по-малък размер, по-лесен за четене
- **SQL**: Стандартен формат, по-голям размер, по-труден за четене

### Retention Policy
- Стари backup файлове се изтриват автоматично
- Retention policy се прилага при всяко зареждане
- Потребителят може да промени retention дни

---

## 📞 Поддръжка

За въпроси или проблеми:
1. Провери логовете в конзолата
2. Провери файловете в `backups/` директорията
3. Провери `backup-config.json` файла
4. Рестартирай сървъра ако е необходимо

**Важно**: Винаги тествай backup и restore функциите в development среда преди да ги използваш в production! 