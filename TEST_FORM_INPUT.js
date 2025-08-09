// 🧪 Тест за въвеждане в формата за услуги
const puppeteer = require('puppeteer');

async function testFormInput() {
  console.log('🎯 Тестване на въвеждане в формата за услуги...');
  
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
    
    // 4. Провери оригиналните стойности
    console.log('📋 Проверявам оригиналните стойности...');
    const originalValues = await page.evaluate(() => {
      const nameInput = document.querySelector('input[type="text"]');
      const durationInput = document.querySelector('input[type="number"]');
      const priceInput = document.querySelector('input[type="number"][step="0.01"]');
      
      return {
        name: nameInput ? nameInput.value : '',
        duration: durationInput ? durationInput.value : '',
        price: priceInput ? priceInput.value : ''
      };
    });
    
    console.log('📋 Оригинални стойности:', originalValues);
    
    // 5. Попълни формата с page.type()
    console.log('📋 Попълвам формата с page.type()...');
    
    // Изчисти и попълни име
    await page.click('input[type="text"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.type('input[type="text"]', 'Test Service Updated');
    
    // Изчисти и попълни продължителност
    await page.click('input[type="number"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.type('input[type="number"]', '45');
    
    // Изчисти и попълни цена
    await page.click('input[type="number"][step="0.01"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.type('input[type="number"][step="0.01"]', '99.99');
    
    // 6. Провери новите стойности
    console.log('📋 Проверявам новите стойности...');
    const newValues = await page.evaluate(() => {
      const nameInput = document.querySelector('input[type="text"]');
      const durationInput = document.querySelector('input[type="number"]');
      const priceInput = document.querySelector('input[type="number"][step="0.01"]');
      
      return {
        name: nameInput ? nameInput.value : '',
        duration: durationInput ? durationInput.value : '',
        price: priceInput ? priceInput.value : ''
      };
    });
    
    console.log('📋 Нови стойности:', newValues);
    
    // 7. Провери дали стойностите са се променили
    if (newValues.name !== originalValues.name || 
        newValues.duration !== originalValues.duration || 
        newValues.price !== originalValues.price) {
      console.log('✅ Стойностите са се променили');
    } else {
      console.log('❌ Стойностите не са се променили');
    }
    
    // 8. Кликни "Запази"
    console.log('📋 Кликам "Запази"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      if (saveBtn) saveBtn.click();
    });
    
    // 9. Изчакай и провери дали модалът се затвори
    console.log('📋 Изчаквам дали модалът се затвори...');
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    const modalClosed = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !modal;
    });
    
    if (modalClosed) {
      console.log('✅ Модалът се затвори след запазване');
    } else {
      console.log('❌ Модалът не се затвори след запазване');
    }
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testFormInput(); 