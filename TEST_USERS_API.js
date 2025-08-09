// 🧪 Тест за API на потребителите
const puppeteer = require('puppeteer');

async function testUsersAPI() {
  console.log('🎯 Тестване на API за потребители...');
  
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
  
  try {
    // 1. Login
    console.log('📋 Login...');
    await page.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 2. Отиди в секция Потребители
    console.log('📋 Отивам в секция Потребители...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 3. Отвори модала за добавяне
    console.log('📋 Отварям модала за добавяне...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // 4. Попълни формата
    console.log('📋 Попълвам формата...');
    await page.type('input[name="name"]', 'Test User API');
    await page.type('input[name="email"]', 'test@api.com');
    const timestamp = Date.now();
    await page.type('input[name="phone"]', `+359888${timestamp}`);
    await page.type('textarea[name="address"]', 'Test Address API');
    await page.type('textarea[name="notes"]', 'Test notes API');
    
    // 5. Включи network monitoring
    console.log('📋 Включвам network monitoring...');
    await page.setRequestInterception(true);
    
    let apiCallDetected = false;
    let apiResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('/api/admin/users') && request.method() === 'POST') {
        console.log('📋 API заявка за потребители детектирана:', request.url());
        apiCallDetected = true;
      }
      request.continue();
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/admin/users') && response.request().method() === 'POST') {
        console.log('📋 API отговор получен:', response.status());
        apiResponse = response.status();
      }
    });
    
    // 6. Кликни "Добави"
    console.log('📋 Кликам "Добави"...');
    
    // Провери дали формата е валиден
    const formValid = await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="name"]');
      const phoneInput = document.querySelector('input[name="phone"]');
      const form = document.querySelector('form');
      
      console.log('Form validation check:', {
        nameValue: nameInput ? nameInput.value : 'no input',
        phoneValue: phoneInput ? phoneInput.value : 'no input',
        formExists: !!form
      });
      
      return nameInput && nameInput.value.trim() !== '' && 
             phoneInput && phoneInput.value.trim() !== '';
    });
    
    if (formValid) {
      console.log('✅ Формата е валиден');
    } else {
      console.log('❌ Формата не е валиден');
    }
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.trim() === 'Добави');
      if (addBtn) addBtn.click();
    });
    
    // 7. Изчакай за API заявката
    console.log('📋 Изчаквам за API заявката...');
    await (page.waitForTimeout ? page.waitForTimeout(8000) : new Promise(resolve => setTimeout(resolve, 8000)));
    
    if (apiCallDetected) {
      console.log('✅ API заявката беше изпратена');
      if (apiResponse === 200) {
        console.log('✅ API заявката беше успешна (200)');
      } else {
        console.log(`❌ API заявката не беше успешна (${apiResponse})`);
      }
    } else {
      console.log('❌ API заявката не беше детектирана');
    }
    
    // 8. Провери дали модалът се затвори
    const modalClosed = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !modal;
    });
    
    if (modalClosed) {
      console.log('✅ Модалът се затвори след добавяне');
    } else {
      console.log('❌ Модалът не се затвори след добавяне');
    }
    
    // 9. Провери за console errors
    console.log('📋 Проверявам за console errors...');
    const logs = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    if (logs.length > 0) {
      console.log('⚠️ Намерени console errors:');
      logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log}`);
      });
    } else {
      console.log('✅ Няма console errors');
    }
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await page.setRequestInterception(false);
    await browser.close();
  }
}

testUsersAPI(); 