# Д-р Борислав Петров - Зъболекарски уебсайт

Модерен уебсайт за зъболекарска практика, изграден с Next.js, TypeScript и Tailwind CSS.

## 🚀 Функционалности

### За посетителите:
- **Начална страница** с информация за практиката
- **Услуги** - подробно описание на стоматологичните услуги
- **За мен** - информация за д-р Борислав Петров
- **Резервиране на час** - онлайн система за резервиране
- **Контакти** - форма за съобщения и контактна информация

### За администратора:
- **Административна панел** за управление на резервации
- **Статистики** - преглед на резервациите
- **Управление на статуси** - потвърждаване/отменяне на резервации
- **Email уведомления** - автоматични съобщения
- **Извънредни резервации** - възможност за добавяне на резервации в почивните дни
- **Responsive дизайн** - адаптивен интерфейс за всички устройства
- **Smart модали** - позициониране спрямо текущата позиция на скрола
- **Loading индикация** - визуална обратна връзка при операции

## 🛠 Технологии

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (отдалечен сървър)
- **Email**: Nodemailer
- **Validation**: Zod
- **Icons**: Lucide React

## 📦 Инсталация

1. Клонирайте репозиторията:
```bash
git clone <repository-url>
cd drborislavpetrov
```

2. Инсталирайте зависимостите:
```bash
npm install
```

3. Копирайте примерния env файл:
```bash
cp env.example .env.local
```

4. Конфигурирайте environment променливите в `.env.local`

5. Стартирайте development сървъра:
```bash
npm run dev
```

## ⚙️ Конфигурация

### Email настройки
За да работи email функционалността, конфигурирайте следните променливи в `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=dr.petrov@example.com
ADMIN_EMAIL=admin@example.com
```

### База данни
Приложението използва PostgreSQL база данни. Настройките се задават в `.env` файла:
- **Host**: Зададен в DB_HOST
- **Port**: Зададен в DB_PORT
- **Database**: Зададен в DB_NAME
- **User**: Зададен в DB_USER

За подробности вижте `DATABASE.md`.

### Администраторски достъп
По подразбиране:
- **Потребителско име**: admin
- **Парола**: admin123

## 🎯 Използване

### За посетителите:
1. Отворете домейна на сайта, зададен в Settings → Site Domain (например `https://example.com`) или локално `http://localhost:3000`
2. Навигирайте към секцията "Резервирай час"
3. Попълнете формата за резервиране
4. Получете потвърждение по email

### За администратора:
1. Отидете на `<SITE_DOMAIN>/admin/login` (например `https://example.com/admin/login`) или локално `http://localhost:3000/admin/login`
2. Влезте с администраторските данни
3. Управлявайте резервациите от административната панел

## 📁 Структура на проекта

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Административни страници
│   ├── api/               # API routes
│   └── globals.css        # Глобални стилове
├── components/            # React компоненти
│   ├── home/             # Компоненти за началната страница
│   └── layout/           # Layout компоненти
└── lib/                  # Utility функции
    ├── database.ts       # Database функции
    ├── email.ts          # Email функции
    └── validation.ts     # Validation схеми
```

## 🚨 Извънредни резервации

### За администраторите:
Системата позволява на admin-ите да добавят извънредни резервации в почивните дни:

1. **Отворете дневен график** за почивен ден в admin панела
2. **Кликнете бутона** "Добави извънредна резервация"
3. **Изберете услуга** - системата показва свободни часове според стандартното работно време
4. **Създайте резервацията**

### Важно:
- **Само admin-ите** могат да добавят извънредни резервации
- **Публичните потребители не могат** да резервират в почивните дни
- **Запазва се оригиналното поведение** за публичния сайт

За подробности вижте `EMERGENCY_BOOKINGS_GUIDE.md` и `README_EMERGENCY_BOOKINGS.md`.

## 🆕 Последни промени (2024-12-28)

### ✨ Responsive Design & UX Improvements
- **Responsive навигация** - header и main navigation се адаптират към всички екрани
- **Smart модали** - Daily Schedule модалът се отваря спрямо текущата позиция на скрола
- **Responsive таблици** - няма хоризонтален скрол на екрани ≥640px
- **Loading индикация** - визуална обратна връзка при запазване на данни

### 🔧 Technical Improvements
- **Modal позициониране** - фиксирана позиция, няма вътрешен скрол
- **Async handling** - правилно управление на loading states
- **Tailwind CSS** - responsive breakpoints за всички компоненти

### 📱 Mobile-First Approach
- **Breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Flexbox responsive** - `flex-shrink-0`, `overflow-x-auto`, `scrollbar-hide`
- **Consistent spacing** - `px-2 sm:px-2.5 md:px-4 lg:px-8`

**За подробна документация вижте:**
- `CHANGELOG.md` - пълна история на промените
- `README-DEVELOPERS.md` - бързо ръководство за разработчици

## 🔧 Development команди

```bash
npm run dev          # Стартиране на development сървър
npm run build        # Build за production
npm run start        # Стартиране на production сървър
npm run lint         # ESLint проверка
npm run type-check   # TypeScript проверка
```

## 🚀 Deployment

### Vercel (препоръчително):
1. Свържете GitHub репозиторията с Vercel
2. Конфигурирайте environment променливите
3. Deploy автоматично при push

### Други платформи:
1. Build проекта: `npm run build`
2. Стартирайте production сървъра: `npm run start`

## 🔒 Сигурност

- **CSRF защита** - защита срещу Cross-Site Request Forgery
- **Rate limiting** - ограничаване на заявките
- **Input validation** - валидация на всички входни данни
- **SQL injection защита** - използване на prepared statements

## 📧 Email функционалност

Системата автоматично изпраща:
- **Потвърждение на резервация** към пациента
- **Уведомление за нова резервация** към администратора

## 🗄️ База данни

Използва се SQLite база данни с таблица `bookings` за съхранение на резервациите.

## 🤝 Принос

1. Fork проекта
2. Създайте feature branch
3. Направете промените
4. Submit pull request

## 📄 Лиценз

MIT License - вижте LICENSE файла за детайли.

## 📞 Поддръжка

За въпроси и поддръжка, свържете се с екипа за разработка. 

## 🎤 Гласови команди (Whisper STT – iOS съвместимост)

### Как работи
- **Десктоп (Chrome/Edge):** Ползва се Web Speech API, когато е наличен.
- **iOS и мобилни браузъри:** Използва се fallback чрез запис с `MediaRecorder` и изпращане към `POST /api/stt`, където сървърът транскрибира аудиото с **Whisper CLI**.

### Изисквания (локално/сървър)
- Python 3.9+
- Инсталиране на Whisper: `pip install -U openai-whisper`
- (по избор) GPU ускорение: `pip install torch` според вашата платформа/драйвери
- Уверете се, че командата `whisper` е достъпна в PATH, или посочете пътя чрез променлива на средата (виж по-долу)

### Конфигурация
- `.env.local` (или средата на сървъра):
  - `WHISPER_MODEL=small` (по подразбиране; възможни: `base`, `medium`, `large-v3`)
  - `WHISPER_CLI=whisper` (по избор; ако `whisper` не е в PATH, задайте пълен път или използвайте `python -m whisper`)

Примери:
- Windows: `WHISPER_CLI="C:\\Users\\<user>\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\whisper.exe"`
- Алтернативно: `WHISPER_CLI="python -m whisper"`

### API маршрут
- `POST /api/stt`
  - Тяло: бинарно аудио (`audio/webm`, `audio/wav`, `audio/ogg`, `audio/mpeg`)
  - Отговор: `{ "text": "..." }`

Пример за бърз тест:
```bash
curl -sS -X POST \
  -H "content-type: audio/webm" \
  --data-binary @sample.webm \
  http://localhost:3000/api/stt
```

### Кратък фронтенд пример (iOS friendly)
```ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const rec = new MediaRecorder(stream)
const chunks: BlobPart[] = []
rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
rec.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/webm' })
  const res = await fetch('/api/stt', { method: 'POST', headers: { 'content-type': blob.type }, body: blob })
  const data = await res.json()
  console.log('STT:', data.text)
  stream.getTracks().forEach(t => t.stop())
}
rec.start()
// ... по-късно: rec.stop()
```

### Отстраняване на проблеми
- 501 „Whisper не е наличен“: инсталирайте `openai-whisper` и задайте `WHISPER_CLI`, ако не е в PATH
- 400 „Unsupported content-type/Empty audio“: изпращайте валидно аудио и правилен `content-type`
- Таймаут: маршрутът има лимит ~60s; за по-дълги записи намалете модела или съкратете клипа

Бележка: Транскрипцията е офлайн/локална и не използва външни API-та. Езикът е настроен на `bg` по подразбиране.