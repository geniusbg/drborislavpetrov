# Bug Tracker Документация

## 📋 Преглед

Bug Tracker системата позволява автоматично записване на бъгове с възможност за добавяне на резолюция (описание на решението).

## 🔧 Нови функционалности

### 1. Поле за резолюция
- **Поле**: `resolution` (TEXT)
- **Описание**: Съхранява как проблемът е решен
- **Локация**: В таблицата `bug_reports`

### 2. Автоматично записване на бъгове
- **Файл**: `src/lib/bug-recorder.ts`
- **Функции**:
  - `recordBug()` - Основна функция
  - `recordBugWithResolution()` - С резолюция
  - `recordUIBug()` - UI бъгове
  - `recordFunctionalityBug()` - Функционални бъгове

## 🗄️ База данни

### Добавяне на поле resolution
```sql
-- Изпълнете в PostgreSQL
ALTER TABLE bug_reports ADD COLUMN IF NOT EXISTS resolution TEXT;
COMMENT ON COLUMN bug_reports.resolution IS 'Описание на решението на проблема';
```

### Структура на таблицата
```sql
CREATE TABLE bug_reports (
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
  resolution TEXT, -- НОВО ПОЛЕ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 UI Промени

### BugTracker компонент
- **Показване на резолюция**: Зелена кутия с резолюцията
- **Редактиране**: Поле за въвеждане на резолюция във формата

### BugForm компонент
- **Ново поле**: Textarea за резолюция
- **Placeholder**: "Описание на решението на проблема (запълнете когато проблемът е решен)"

## 🔌 API Промени

### POST /api/admin/bugs
- **Ново поле**: `resolution` в request body
- **Валидация**: Опционално поле

### PUT /api/admin/bugs
- **Обновяване**: Поле `resolution` може да се редактира
- **Параметри**: Добавено `resolution` в UPDATE заявката

## 📝 Използване

### Автоматично записване на бъгове
```typescript
import { recordBug, recordUIBug, recordFunctionalityBug } from '@/lib/bug-recorder'

// Основна функция
await recordBug({
  title: 'Проблем с валидация',
  description: 'Формата не валидира правилно email адреса',
  category: 'functionality',
  severity: 'medium',
  resolution: 'Поправена е regex валидацията'
})

// UI бъгове
await recordUIBug(
  'Кнопката не се показва правилно',
  'Кнопката е извън екрана на мобилни устройства',
  'high',
  'Добавена е responsive дизайн логика'
)

// Функционални бъгове
await recordFunctionalityBug(
  'Резервацията не се запазва',
  'При натискане на "Запази" не се изпраща заявката',
  'critical',
  'Поправена е логиката за валидация на формата'
)
```

### Ръчно записване чрез BugTracker
1. Отворете BugTracker от админ панела
2. Натиснете "Нов Bug Report"
3. Попълнете всички полета
4. В полето "Резолюция" опишете решението (ако проблемът е решен)
5. Натиснете "Създай Bug Report"

## 🏷️ Автоматично записани бъгове

Бъговете, записани чрез функциите от `bug-recorder.ts`, се маркират с:
- **Reporter**: "System"
- **Tags**: `['auto-recorded']`
- **Priority**: "medium"

## 🔄 Добавяне на резолюция към съществуващи бъгове

За да добавите резолюция към вече съществуващи бъгове:

1. Отворете BugTracker
2. Намерете бъга в списъка
3. Натиснете бутона за редактиране (✏️)
4. Попълнете полето "Резолюция"
5. Натиснете "Обнови"

## 📊 Статистика

- **Автоматично записани**: Маркирани с tag `auto-recorded`
- **С резолюция**: Показват се в зелена кутия
- **Без резолюция**: Обикновен текст

## 🚀 Следващи стъпки

1. **Изпълнете SQL скрипта** за добавяне на полето `resolution`
2. **Тествайте функционалността** чрез BugTracker интерфейса
3. **Интегрирайте функциите** за автоматично записване в други компоненти
4. **Добавете резолюции** към съществуващи бъгове

## 📞 Поддръжка

При проблеми с Bug Tracker системата:
1. Проверете конзолата за грешки
2. Уверете се, че полето `resolution` е добавено в базата данни
3. Проверете дали API routes работят правилно 