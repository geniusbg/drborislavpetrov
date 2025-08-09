# 🧪 QA Dashboard - Ръководство за употреба

## 📋 Общ преглед

QA Dashboard-ът е централизирана система за управление на всички QA тестове в проекта. Той предоставя лесен начин за стартиране, мониториране и управление на тестовете.

## 🚀 Как да стартираш QA таблото

### Вариант 1: PowerShell (Препоръчан)
```powershell
powershell -ExecutionPolicy Bypass -File qa-dashboard-simple.ps1
```

### Вариант 2: Batch файл
```batch
qa-dashboard-simple.bat
```

### Вариант 3: Node.js
```bash
node qa-dashboard.js
```

## 📊 Функционалности

### 1. 📋 Показване на всички QA тестове
- Автоматизирани тестове (Puppeteer)
- Тестове на различни компоненти
- QA ръководства и документация

### 2. 🚀 Стартиране на автоматизиран тест
- Проверява дали server-ът работи
- Стартира QA_AUTOMATED_TEST.js
- Отваря браузър и изпълнява всички тестове

### 3. 🔧 Стартиране на конкретен тест
- Показва списък с всички налични тестове
- Инструкции за ръчно стартиране

### 4. 📊 Показване на QA ръководства
- QA_CHECKLIST.md - Ръчно тестване
- QA_TEAM_GUIDE.md - Ръководство за екипа
- QA_TEST_SCRIPT.md - Скрипт за тестване
- MANUAL_QA_TEST.md - Ръчно тестване
- QA_TESTS_BOOKING_STATUS.md - Статус резервации

### 5. 🧹 Изчистване на тестови данни
- Стартира CLEANUP_TEST_DATA.js
- Изчиства тестови данни от базата

### 6. 📈 Генериране на QA отчет
- Създава qa_report.json
- Статистика за тестове и ръководства

### 7. 🔍 Проверка на статус на тестове
- Проверява дали server-ът работи
- Статус на тестови файлове

## 📁 Налични тестове

### 🤖 Автоматизирани тестове:
- **QA_AUTOMATED_TEST.js** - Автоматизирани тестове (Puppeteer)
- **TEST_HOMEPAGE.js** - Тест на начална страница
- **TEST_BOOKINGS.js** - Тест на резервации
- **TEST_CALENDAR.js** - Тест на календар
- **TEST_USERS.js** - Тест на потребители
- **TEST_SERVICE_EDITING.js** - Тест на редактиране услуги
- **TEST_API.js** - Тест на API endpoints
- **TEST_FORM_VALIDATION.js** - Тест на валидация на форми
- **TEST_BUTTONS.js** - Тест на бутони и UI
- **TEST_NETWORK.js** - Тест на мрежови заявки
- **TEST_LOCALSTORAGE.js** - Тест на localStorage
- **TEST_AUTO_REFRESH.js** - Тест на автоматично обновяване
- **TEST_HYDRATION_FIX.js** - Тест на hydration
- **TEST_CALENDAR_BOOKINGS.js** - Тест на календар резервации
- **TEST_BOOKING_CREATION.js** - Тест на създаване резервации
- **TEST_BOOKING_EDITING.js** - Тест на редактиране резервации
- **TEST_USERS_API.js** - Тест на потребители API
- **TEST_USERS_MODAL_CLOSE.js** - Тест на модали потребители
- **TEST_API_SERVICES.js** - Тест на услуги API

## 🛠️ Ръчно стартиране на тестове

### Автоматизиран тест:
```bash
node QA_AUTOMATED_TEST.js
```

### Конкретен тест:
```bash
node TEST_HOMEPAGE.js
node TEST_BOOKINGS.js
node TEST_CALENDAR.js
# и т.н.
```

## 📚 QA Ръководства

### QA_CHECKLIST.md
- Пълна checklist за ръчно тестване
- Проверка на всички функционалности
- Тестване на различни браузъри

### QA_TEAM_GUIDE.md
- Ръководство за QA екипа
- Процеси и процедури
- Стандарти за тестване

### MANUAL_QA_TEST.md
- Инструкции за ръчно тестване
- Стъпка по стъпка тестове
- Проверка на UI/UX

## 🔧 Конфигурация

### Server проверка:
QA таблото автоматично проверява дали server-ът работи на `http://localhost:3000`

### Стартиране на server:
```bash
npm run dev
```

## 📈 Отчети

### QA отчет (qa_report.json):
```json
{
  "timestamp": "2025-08-04T08:30:00.000Z",
  "testFiles": {
    "QA_AUTOMATED_TEST.js": {
      "description": "Automated Tests (Puppeteer)",
      "exists": true,
      "size": 16405
    }
  },
  "summary": {
    "totalTests": 19,
    "availableTests": 19,
    "totalGuides": 5,
    "availableGuides": 5
  }
}
```

## 🚨 Troubleshooting

### Server не работи:
```bash
npm run dev
```

### Тест не се стартира:
1. Провери дали файлът съществува
2. Провери дали server-ът работи
3. Провери дали има грешки в конзолата

### PowerShell грешки:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 💡 Съвети

1. **Винаги стартирай server-а преди тестове**
2. **Изчисти кеша на браузъра преди тестване**
3. **Тествай на различни браузъри**
4. **Проверявай конзолата за грешки**
5. **Използвай QA_CHECKLIST.md за систематично тестване**

## 📞 Поддръжка

За въпроси или проблеми с QA таблото:
1. Провери дали всички файлове са налични
2. Провери дали server-ът работи
3. Провери конзолата за грешки
4. Използвай QA_CHECKLIST.md за ръчно тестване 