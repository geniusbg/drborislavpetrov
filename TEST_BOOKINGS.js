// 🧪 Прост тест за резервации
const puppeteer = require('puppeteer');

async function testBookings() {
  console.log('🎯 Тестване на резервации...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // 1. Отиди в login страницата
    console.log('📋 Отивам в login страницата...');
    await page.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 2. Попълни credentials
    console.log('📋 Попълвам credentials...');
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    
    // 3. Кликни Login
    console.log('📋 Кликам Login...');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    console.log('✅ Кликнах Login');
    
    // 4. Провери дали сме в admin panel
    const title = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    
    console.log('📋 Заглавie:', title);
    
    if (title && title.includes('Админ Панел')) {
      console.log('✅ Admin panel се зарежда успешно');
    } else {
      console.log('❌ Admin panel не се зарежда правилно');
      return;
    }
    
    // 3. Отиди в секция Резервации
    console.log('📋 Отивам в секция Резервации...');
    
    // Изчакай малко за да се заредят всички елементи
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Провери всички бутони
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent);
    });
    console.log('📋 Намерени бутони:', allButtons);
    
    // Кликни на първия бутон "Резервации"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingBtn = buttons.find(btn => btn.textContent.trim() === 'Резервации');
      if (bookingBtn) bookingBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    console.log('✅ Кликнах на бутон "Резервации"');
    
    // 4. Кликни "Добави резервация"
    console.log('📋 Кликам "Добави резервация"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBookingBtn = buttons.find(btn => btn.textContent.trim() === 'Добави резервация');
      if (addBookingBtn) addBookingBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    console.log('✅ Кликнах на бутон "Добави резервация"');
    
    // 5. Провери дали се отвори модал
    const modal = await page.$('form');
    if (modal) {
      console.log('✅ Модалът за резервация се отвори');
    } else {
      console.log('❌ Модалът за резервация не се отвори');
      return;
    }
    
    // 6. Попълни формата
    console.log('📋 Попълвам формата...');
    
    // Изчакай малко за да се зареди формата
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Име - използвай по-специфичен селектор
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[type="text"]');
      if (nameInput) nameInput.value = 'Test Patient';
    });
    
    // Телефон
    await page.evaluate(() => {
          const phoneInput = document.querySelector('input[type="tel"]');
    if (phoneInput) phoneInput.value = `+359888${Date.now()}`;
    });
    
    // Имейл
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) emailInput.value = 'test@example.com';
    });
    
    // Услуга
    await page.evaluate(() => {
      const serviceSelect = document.querySelector('select');
      if (serviceSelect) serviceSelect.value = '1';
    });
    
    // Дата
    await page.evaluate(() => {
      const dateInput = document.querySelector('input[type="date"]');
      if (dateInput) dateInput.value = '2024-12-31';
    });
    
    // Час
    await page.evaluate(() => {
      const timeInput = document.querySelector('input[type="time"]');
      if (timeInput) timeInput.value = '14:00';
    });
    
    console.log('✅ Формата се попълни');
    
    // 7. Кликни "Запази"
    console.log('📋 Кликам "Запази"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      if (saveBtn) saveBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    console.log('✅ Кликнах "Запази"');
    
    // 8. Провери дали резервацията се създаде
    const bookingInList = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => el.textContent.includes('Test Patient'));
    });
    
    if (bookingInList) {
      console.log('✅ Резервацията се създаде успешно!');
    } else {
      console.log('❌ Резервацията не се създаде');
    }
    
    console.log('\n🎉 Тестът завърши!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testBookings(); 