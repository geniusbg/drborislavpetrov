// 🧪 Тест за редактиране на услуги - Race Condition
const puppeteer = require('puppeteer');

async function testServiceEditing() {
  console.log('🎯 Тестване на редактиране на услуги...');
  
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
    
    // 3. Провери дали има услуги
    const servicesCount = await page.evaluate(() => {
      const serviceRows = document.querySelectorAll('tr');
      return serviceRows.length - 1; // Изваждаме header-а
    });
    console.log(`📋 Намерени услуги: ${servicesCount}`);
    
    if (servicesCount === 0) {
      console.log('❌ Няма услуги за редактиране');
      return;
    }
    
    // 4. Кликни на първата услуга за редактиране
    console.log('📋 Кликам на първата услуга за редактиране...');
    await page.evaluate(() => {
      // Търси бутон с Edit икона в таблицата
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const editBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-blue-600') && !btn.className.includes('text-red-600');
      });
      if (editBtn) editBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // 5. Провери дали се отвори модал
    const modalOpened = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !!modal;
    });
    
    if (!modalOpened) {
      console.log('❌ Модалът не се отвори');
      return;
    }
    
    console.log('✅ Модалът се отвори');
    
         // 6. Попълни формата с нови данни
     console.log('📋 Попълвам формата...');
     
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
    
    console.log('✅ Формата се попълни');
    
         // 7. Провери дали има бутон "Отказ" и дали работи
     console.log('📋 Проверявам за бутон "Отказ"...');
     const hasCancelButton = await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const cancelBtn = buttons.find(btn => btn.textContent.trim() === 'Отказ');
       return !!cancelBtn;
     });
     
     if (hasCancelButton) {
       console.log('✅ Бутон "Отказ" е наличен');
       
       // 7.5. Тествай дали бутонът "Отказ" работи
       console.log('📋 Тествам дали бутонът "Отказ" работи...');
       await page.evaluate(() => {
         const buttons = Array.from(document.querySelectorAll('button'));
         const cancelBtn = buttons.find(btn => btn.textContent.trim() === 'Отказ');
         if (cancelBtn) cancelBtn.click();
       });
       
       // Изчакай малко и провери дали модалът се затвори
       await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
       
       const modalClosedAfterCancel = await page.evaluate(() => {
         const modal = document.querySelector('form');
         return !modal;
       });
       
       if (modalClosedAfterCancel) {
         console.log('✅ Бутон "Отказ" работи - модалът се затвори');
       } else {
         console.log('❌ Бутон "Отказ" НЕ работи - модалът не се затвори');
       }
       
       // Отвори модала отново за следващите тестове
       console.log('📋 Отварям модала отново за следващите тестове...');
       await page.evaluate(() => {
         const tableButtons = Array.from(document.querySelectorAll('table button'));
         const editBtn = tableButtons.find(btn => {
           const svg = btn.querySelector('svg');
           return svg && btn.className.includes('text-blue-600') && !btn.className.includes('text-red-600');
         });
         if (editBtn) editBtn.click();
       });
       await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
       
     } else {
       console.log('❌ Бутон "Отказ" не е наличен');
     }
     
     // 8. Кликни "Запази"
     console.log('📋 Кликам "Запази"...');
     await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
       if (saveBtn) saveBtn.click();
     });
    
         // 8. Изчакай малко и провери дали модалът се затвори след запазване
     console.log('📋 Изчаквам дали модалът се затвори след запазване...');
     await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
     
     const modalClosed = await page.evaluate(() => {
       const modal = document.querySelector('form');
       return !modal;
     });
     
     if (modalClosed) {
       console.log('✅ Модалът се затвори след запазване');
     } else {
       console.log('❌ Модалът не се затвори след запазване');
       console.log('⚠️ Това може да е проблем с бутона "Запази"');
       
       // Провери дали има съобщение за грешка
       const errorMessage = await page.evaluate(() => {
         const errorDiv = document.querySelector('.text-red-500, .text-red-600, [class*="error"]');
         return errorDiv ? errorDiv.textContent.trim() : null;
       });
       
       if (errorMessage) {
         console.log(`⚠️ Намерено съобщение за грешка: "${errorMessage}"`);
       }
     }
    
    // 9. СЕГА - КРИТИЧНИЯТ ТЕСТ: Кликни отново на редактиране ВЕДНАГА
    console.log('\n🚨 КРИТИЧЕН ТЕСТ: Кликам отново на редактиране веднага...');
    await page.evaluate(() => {
      // Търси бутон с Edit икона в таблицата
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const editBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-blue-600') && !btn.className.includes('text-red-600');
      });
      if (editBtn) editBtn.click();
    });
    
    // 10. Провери дали модалът се отвори отново
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    const modalReopened = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !!modal;
    });
    
    if (modalReopened) {
      console.log('✅ Модалът се отвори отново');
      
      // 11. Изчакай 1 минута и провери дали се затваря автоматично
      console.log('⏰ Изчаквам 1 минута за да видя дали се затваря автоматично...');
      await (page.waitForTimeout ? page.waitForTimeout(60000) : new Promise(resolve => setTimeout(resolve, 60000)));
      
      const modalStillOpen = await page.evaluate(() => {
        const modal = document.querySelector('form');
        return !!modal;
      });
      
      if (modalStillOpen) {
        console.log('✅ Модалът остава отворен - НЯМА проблем!');
      } else {
        console.log('❌ ПРОБЛЕМ: Модалът се затвори автоматично!');
        console.log('🚨 Това е race condition проблем!');
      }
      
    } else {
      console.log('❌ Модалът не се отвори отново');
    }
    
    // 12. Допълнителен тест - провери дали има setTimeout в кода
    console.log('\n🔍 Проверявам за setTimeout в кода...');
    const hasSetTimeout = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const pageContent = document.documentElement.outerHTML;
      return pageContent.includes('setTimeout') || pageContent.includes('setTimeout');
    });
    
    if (hasSetTimeout) {
      console.log('⚠️ Намерен setTimeout в кода - може да причинява проблема');
    } else {
      console.log('✅ Няма setTimeout в кода');
    }
    
    console.log('\n🎉 Тестът завърши!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testServiceEditing(); 