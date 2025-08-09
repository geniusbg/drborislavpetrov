// 🧪 Тест за валидация на формата за услуги
const puppeteer = require('puppeteer');

async function testFormValidation() {
  console.log('🎯 Тестване на валидация на формата за услуги...');
  
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
    
    // 5. Попълни формата с нови данни
    console.log('📋 Попълвам формата с нови данни...');
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[type="text"]');
      if (nameInput) {
        nameInput.value = 'Test Service Updated';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const durationInput = document.querySelector('input[type="number"]');
      if (durationInput) {
        durationInput.value = '45';
        durationInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      const priceInput = document.querySelector('input[type="number"][step="0.01"]');
      if (priceInput) {
        priceInput.value = '99.99';
        priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    
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
    
    // 7. Провери дали формата е валиден
    console.log('📋 Проверявам дали формата е валиден...');
    const formValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      
      const nameInput = form.querySelector('input[type="text"]');
      const durationInput = form.querySelector('input[type="number"]');
      
      return nameInput && nameInput.value.trim() !== '' && 
             durationInput && durationInput.value !== '';
    });
    
    if (formValid) {
      console.log('✅ Формата е валиден');
    } else {
      console.log('❌ Формата не е валиден');
    }
    
    // 8. Провери дали бутонът "Запази" е активен
    console.log('📋 Проверявам дали бутонът "Запази" е активен...');
    const saveButtonActive = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      return saveBtn && !saveBtn.disabled;
    });
    
    if (saveButtonActive) {
      console.log('✅ Бутонът "Запази" е активен');
    } else {
      console.log('❌ Бутонът "Запази" не е активен');
    }
    
    // 9. Кликни "Запази"
    console.log('📋 Кликам "Запази"...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      if (saveBtn) saveBtn.click();
    });
    
    // 10. Изчакай и провери дали модалът се затвори
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

testFormValidation(); 