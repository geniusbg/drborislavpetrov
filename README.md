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
- **Управление на статуси** - потвърждаване/отменяване на резервации
- **Email уведомления** - автоматични съобщения

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
Приложението използва PostgreSQL база данни на отдалечен сървър:
- **Host**: 192.168.1.134
- **Port**: 5432
- **Database**: drborislavpetrov
- **User**: drborislavpetrov

За подробности вижте `DATABASE.md`.

### Администраторски достъп
По подразбиране:
- **Потребителско име**: admin
- **Парола**: admin123

## 🎯 Използване

### За посетителите:
1. Отворете `http://localhost:3000`
2. Навигирайте към секцията "Резервирай час"
3. Попълнете формата за резервиране
4. Получете потвърждение по email

### За администратора:
1. Отидете на `http://localhost:3000/admin/login`
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