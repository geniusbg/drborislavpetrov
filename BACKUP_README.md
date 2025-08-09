# Database Backup System

## 📋 Общ преглед

Автоматична система за backup на базата данни с следните функции:

- **Автоматичен backup** на всеки 1 час
- **Retention policy** - запазва последните 5 дни
- **JSON формат** - лесен за четене и възстановяване
- **Logging** - записва всички операции
- **Възстановяване** - възможност за restore от backup

## 🚀 Как да стартираш

### 1. Ръчен backup
```bash
node backup-database-node.js
```

### 2. Автоматичен scheduler (Windows)
```bash
start-backup-scheduler.bat
```

### 3. PowerShell scheduler (като Administrator)
```powershell
powershell -ExecutionPolicy Bypass -File setup-backup-scheduler-simple.ps1
```

## 📁 Файлова структура

```
backups/
├── drborislavpetrov_backup_2025-08-03_12-49-08-274Z.json
├── drborislavpetrov_backup_2025-08-03_13-49-08-274Z.json
└── ...

backup.log          # Log файл с операциите
run-backup.ps1      # PowerShell скрипт за автоматичен backup
```

## 🔧 Конфигурация

### Backup настройки (в `backup-database-node.js`):
```javascript
const DB_CONFIG = {
  host: '192.168.1.134',
  port: 5432,
  database: 'drborislavpetrov',
  user: 'drborislavpetrov',
  password: 'Xander123)(*'
}

const RETENTION_DAYS = 5  // Запазва последните 5 дни
```

### Интервал на backup:
- **По подразбиране**: 1 час
- **Промяна**: редактирай `setup-backup-scheduler-simple.ps1`

## 📊 Backup съдържание

Backup файлът съдържа всички таблици:

- **bookings** - резервации
- **users** - потребители  
- **services** - услуги
- **working_hours** - работно време
- **working_breaks** - почивки
- **bug_reports** - доклади за бъгове
- **bug_comments** - коментари
- **bug_attachments** - прикачени файлове

## 🔄 Възстановяване

### 1. Списък с налични backups:
```bash
node restore-database.js
```

### 2. Възстановяване от конкретен backup:
```bash
node restore-database.js drborislavpetrov_backup_2025-08-03_12-49-08-274Z.json
```

## 📋 Управление на Scheduled Tasks

### Windows Task Scheduler команди:
```powershell
# Преглед на задачата
Get-ScheduledTask -TaskName 'DrBorislavPetrov-DatabaseBackup'

# Стартиране
Start-ScheduledTask -TaskName 'DrBorislavPetrov-DatabaseBackup'

# Спиране
Stop-ScheduledTask -TaskName 'DrBorislavPetrov-DatabaseBackup'

# Изтриване
Unregister-ScheduledTask -TaskName 'DrBorislavPetrov-DatabaseBackup'
```

## 📝 Log файлове

### Backup log (`backup.log`):
```
2025-08-03 12:49:08 - Backup completed successfully
2025-08-03 13:49:08 - Backup completed successfully
```

### Console output:
```
Starting database backup process...
Database connection test successful!
Backing up bookings table...
Backing up users table...
Backing up services table...
Backup completed successfully!
Backup size: 0.02 MB
```

## ⚠️ Важни забележки

1. **Права**: Scheduled Task изисква Administrator права
2. **Съединение**: Изисква се достъп до базата данни
3. **Дисково пространство**: Проверявай размера на backups директорията
4. **Възстановяване**: Винаги прави backup преди restore

## 🛠️ Troubleshooting

### Проблем: "Access is denied"
**Решение**: Стартирай PowerShell като Administrator

### Проблем: "Database connection failed"
**Решение**: Провери дали базата данни е достъпна

### Проблем: "Node.js not found"
**Решение**: Инсталирай Node.js

### Проблем: Backup файловете са големи
**Решение**: Намали retention периода или интервала

## 📞 Поддръжка

За проблеми с backup системата:
1. Провери log файловете
2. Тествай ръчен backup
3. Провери правата за достъп
4. Провери дисковото пространство 