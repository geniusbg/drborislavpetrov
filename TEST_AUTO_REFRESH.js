// 🧪 Тест за автоматично обновяване на компоненти
const puppeteer = require('puppeteer');

async function testAutoRefresh() {
  console.log('🎯 Тестване на автоматично обновяване...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Обработвай alert диалозите
  page.on('dialog', dialog => {
    console.log('📋 Alert диалог:', dialog.message());
    dialog.accept();
  });
  
  // Обработвай console логове от браузъра
  page.on('console', msg => {
    console.log('📋 Browser console:', msg.text());
  });
  
  try {
    // 1. Login
    console.log('📋 Login...');
    await page.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 2. Запомни началното състояние на всички секции
    console.log('📋 Проверявам начално състояние...');
    
    // Резервации
    const initialBookings = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Начални резервации:', initialBookings);
    
    // Потребители
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const initialUsers = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Начални потребители:', initialUsers);
    
    // Услуги
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const servicesBtn = buttons.find(btn => btn.textContent.trim() === 'Услуги');
      if (servicesBtn) servicesBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const initialServices = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Начални услуги:', initialServices);
    
    // 3. Отвори нов таб и направи промени
    console.log('📋 Отварям нов таб за промени...');
    const newPage = await browser.newPage();
    await newPage.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? newPage.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    await newPage.type('input[name="username"]', 'admin');
    await newPage.type('input[name="password"]', 'admin123');
    await newPage.click('button[type="submit"]');
    await (page.waitForTimeout ? newPage.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 4. Добави нов потребител в новия таб
    console.log('📋 Добавям нов потребител...');
    await newPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? newPage.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    await newPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? newPage.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    const uniquePhone = `+359888${Date.now()}`;
    await newPage.type('input[name="name"]', 'Auto Refresh Test User');
    await newPage.type('input[name="phone"]', uniquePhone);
    await newPage.click('button[type="submit"]');
    await (page.waitForTimeout ? newPage.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // 5. Добави нова услуга в новия таб
    console.log('📋 Добавям нова услуга...');
    await newPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const servicesBtn = buttons.find(btn => btn.textContent.trim() === 'Услуги');
      if (servicesBtn) servicesBtn.click();
    });
    await (page.waitForTimeout ? newPage.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Debug: провери дали сме в секция Услуги
    const currentSection = await newPage.evaluate(() => {
      const activeTab = document.querySelector('.bg-blue-600');
      return activeTab ? activeTab.textContent : 'No active tab';
    });
    console.log('📋 Текуща секция в новия таб:', currentSection);
    
    // Debug: провери всички бутони
    const allButtons = await newPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent.trim()).filter(text => text);
    });
    console.log('📋 Налични бутони в новия таб:', allButtons);
    
    await newPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addServiceBtn = buttons.find(btn => btn.textContent.trim() === 'Добави услуга') ||
                           buttons.find(btn => btn.textContent.trim() === 'Добави');
      if (addServiceBtn) {
        console.log('Found add service button, clicking...');
        addServiceBtn.click();
      } else {
        console.log('Add service button not found');
      }
    });
    await (page.waitForTimeout ? newPage.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Debug: провери дали се отвори модал
    const { modalOpened, modalInputs } = await newPage.evaluate(() => {
      const modal = document.querySelector('form') || document.querySelector('.modal');
      let inputs = [];
      if (modal) {
        inputs = Array.from(modal.querySelectorAll('input, textarea, select')).map(el => ({
          tag: el.tagName,
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          value: el.value
        }));
      }
      return { modalOpened: !!modal, modalInputs: inputs };
    });
    console.log('📋 Модалът за услуга се отвори:', modalOpened);
    console.log('📋 Input елементи в модала:', modalInputs);
    
    // Попълни формата бързо без изчакване между полетата
    try {
      await newPage.type('input[name="name"]', 'Auto Refresh Test Service');
      await newPage.type('input[name="duration"]', '60');
      await newPage.type('input[name="price"]', '50');
      await newPage.click('button[type="submit"]');
      console.log('✅ Попълних формата бързо');
    } catch (error) {
      console.log('❌ Грешка при попълване на формата:', error.message);
    }
    await newPage.click('button[type="submit"]');
    await (page.waitForTimeout ? newPage.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали модалът се затвори (успешно добавяне)
    const modalClosed = await newPage.evaluate(() => {
      const modal = document.querySelector('form') || document.querySelector('.modal');
      return !modal;
    });
    console.log('📋 Модалът за услуга се затвори след добавяне:', modalClosed);
    
    // 6. Провери дали първият таб се обнови автоматично
    console.log('📋 Проверявам автоматично обновяване в първия таб...');
    await (page.waitForTimeout ? page.waitForTimeout(5000) : new Promise(resolve => setTimeout(resolve, 5000)));
    
    // Провери потребители
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const updatedUsers = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Обновени потребители:', updatedUsers);
    
    if (updatedUsers > initialUsers) {
      console.log('✅ Потребителите се обновиха автоматично!');
    } else {
      console.log('❌ Потребителите не се обновиха автоматично');
    }
    
    // Провери услуги
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const servicesBtn = buttons.find(btn => btn.textContent.trim() === 'Услуги');
      if (servicesBtn) servicesBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const updatedServices = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Обновени услуги:', updatedServices);
    
    if (updatedServices > initialServices) {
      console.log('✅ Услугите се обновиха автоматично!');
    } else {
      console.log('❌ Услугите не се обновиха автоматично');
    }
    
    // 7. Провери резервации (върни се в първата секция)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsBtn = buttons.find(btn => btn.textContent.trim() === 'Резервации');
      if (bookingsBtn) bookingsBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const updatedBookings = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    console.log('📋 Обновени резервации:', updatedBookings);
    
    console.log('\n🎉 Тестът за автоматично обновяване завърши!');
    
    // Затвори новия таб
    await newPage.close();
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testAutoRefresh(); 