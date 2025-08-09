// 🧪 Тест за API на услугите
const puppeteer = require('puppeteer');

async function testServicesAPI() {
  console.log('🎯 Тестване на API за услуги...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // 1. Login
    console.log('📋 Login...');
    await page.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 2. Отиди в секция Услуги
    console.log('📋 Отивам в секция Услуги...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const servicesBtn = buttons.find(btn => btn.textContent.trim() === 'Услуги');
      if (servicesBtn) servicesBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 3. Отвори модала за редактиране
    console.log('📋 Отварям модала за редактиране...');
    await page.evaluate(() => {
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const editBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-blue-600') && !btn.className.includes('text-red-600');
      });
      if (editBtn) editBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // 4. Попълни формата
    console.log('📋 Попълвам формата...');
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[type="text"]');
      if (nameInput) nameInput.value = 'Test Service API';
      
      const durationInput = document.querySelector('input[type="number"]');
      if (durationInput) durationInput.value = '60';
      
      const priceInput = document.querySelector('input[type="number"][step="0.01"]');
      if (priceInput) priceInput.value = '150.00';
    });
    
    // 5. Включи network monitoring
    console.log('📋 Включвам network monitoring...');
    await page.setRequestInterception(true);
    
    let apiCallDetected = false;
    let apiResponse = null;
    
    page.on('request', request => {
      if (request.url().includes('/api/admin/services') && request.method() === 'PUT') {
        console.log('📋 API заявка за услуги детектирана:', request.url());
        apiCallDetected = true;
      }
      request.continue();
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/admin/services') && response.request().method() === 'PUT') {
        console.log('📋 API отговор получен:', response.status());
        apiResponse = response.status();
      }
    });
    
    // 6. Кликни "Запази"
    console.log('📋 Кликам "Запази"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      if (saveBtn) saveBtn.click();
    });
    
    // 7. Изчакай за API заявката
    console.log('📋 Изчаквам за API заявката...');
    await (page.waitForTimeout ? page.waitForTimeout(5000) : new Promise(resolve => setTimeout(resolve, 5000)));
    
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
      console.log('✅ Модалът се затвори след запазване');
    } else {
      console.log('❌ Модалът не се затвори след запазване');
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

testServicesAPI(); 