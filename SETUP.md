# 🚀 Инсталация и настройка

## Предварителни изисквания

### 1. Инсталиране на Node.js

1. **Изтеглете Node.js** от [официалния сайт](https://nodejs.org/)
2. **Изберете LTS версия** (Long Term Support)
3. **Следвайте инсталацията** с всички настройки по подразбиране
4. **Рестартирайте компютъра** след инсталацията

### 2. Проверка на инсталацията

Отворете PowerShell или Command Prompt и въведете:

```bash
node --version
npm --version
```

Трябва да видите версиите на Node.js и npm.

## 🛠 Инсталация на проекта

### 1. Клониране на репозиторията

```bash
git clone <repository-url>
cd dr-borislav-petrov-website
```

### 2. Инсталиране на зависимостите

```bash
npm install
```

### 3. Стартиране на development сървъра

```bash
npm run dev
```

### 4. Отваряне в браузъра

Отворете домейна на сайта, зададен в Settings → Site Domain (напр. `https://example.com`) или локално `http://localhost:3000`

## 🔧 Разработка

### Полезни команди

```bash
npm run dev          # Стартира development сървър
npm run build        # Създава production build
npm run start        # Стартира production сървър
npm run lint         # Проверява кода за грешки
npm run type-check   # Проверява TypeScript типове
```

### Структура на файловете

```
dr-borislav-petrov-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Основен layout
│   │   ├── page.tsx           # Начална страница
│   │   └── globals.css        # Глобални стилове
│   └── components/            # React компоненти
│       ├── layout/           # Layout компоненти
│       │   ├── Header.tsx
│       │   └── Footer.tsx
│       └── home/             # Компоненти за началната страница
│           ├── Hero.tsx
│           ├── Services.tsx
│           ├── About.tsx
│           └── Contact.tsx
├── package.json              # Зависимости и скриптове
├── tailwind.config.js        # Tailwind CSS конфигурация
├── tsconfig.json            # TypeScript конфигурация
└── README.md               # Документация
```

## 🎨 Персонализация

### Редактиране на съдържание

1. **Главна страница** - редактирайте `src/components/home/Hero.tsx`
2. **Услуги** - редактирайте `src/components/home/Services.tsx`
3. **За мен** - редактирайте `src/components/home/About.tsx`
4. **Контакти** - редактирайте `src/components/home/Contact.tsx`

### Промяна на цветове

Редактирайте `tailwind.config.js` за промяна на цветовата схема:

```javascript
colors: {
  primary: {
    // Вашите цветове тук
  }
}
```

## 🚀 Deployment

### Vercel (Препоръчително)

1. Създайте акаунт на [Vercel](https://vercel.com)
2. Свържете GitHub репозиторията
3. Настройте environment variables
4. Deploy автоматично

### Други опции

- **Netlify:** Upload `out/` папката след `npm run build`
- **DigitalOcean:** Настройте Node.js сървър
- **AWS:** Използвайте Amplify

## 🐛 Често срещани проблеми

### "npm не е разпознат"

**Решение:** Рестартирайте компютъра след инсталацията на Node.js

### "Port 3000 is already in use"

**Решение:** Използвайте друг порт:
```bash
npm run dev -- -p 3001
```

### TypeScript грешки

**Решение:** Проверете дали всички зависимости са инсталирани:
```bash
npm install
```

## 📞 Поддръжка

За въпроси и проблеми:
- **Разработчик:** Nikolay Petrov
- **Компания:** HitOps
- **Email:** support@hitops.com

---

Създадено с ❤️ от HitOps 