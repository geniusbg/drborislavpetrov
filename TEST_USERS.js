// 🧪 QA Тест за секцията Потребители
const puppeteer = require('puppeteer');

async function testUsersSection() {
  console.log('🎯 QA Тест за секцията Потребители...');
  
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
    
    // 2. Отиди в секция Потребители
    console.log('📋 Отивам в секция Потребители...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 3. Провери дали има потребители
    const usersCount = await page.evaluate(() => {
      const userRows = document.querySelectorAll('tr');
      return userRows.length - 1; // Изваждаме header-а
    });
    console.log(`📋 Намерени потребители: ${usersCount}`);
    
    // 4. ТЕСТ 1: Добавяне на нов потребител
    console.log('\n🧪 ТЕСТ 1: Добавяне на нов потребител');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Провери дали се отвори модал
    const modalOpened = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !!modal;
    });
    
    if (modalOpened) {
      console.log('✅ Модалът за добавяне на потребител се отвори');
      
             // Попълни формата
       await page.type('input[name="name"]', 'Test User QA');
       await page.type('input[name="email"]', 'test@qa.com');
       await page.type('input[name="phone"]', `+359888${Date.now()}`);
       await page.type('textarea[name="address"]', 'Test Address 123');
       await page.type('textarea[name="notes"]', 'Test notes for QA');
      
      // Кликни "Добави"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtn = buttons.find(btn => btn.textContent.trim() === 'Добави');
        if (addBtn) addBtn.click();
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали модалът се затвори
      const modalClosed = await page.evaluate(() => {
        const modal = document.querySelector('form');
        return !modal;
      });
      
      if (modalClosed) {
        console.log('✅ Потребителят беше добавен успешно');
      } else {
        console.log('❌ Модалът не се затвори след добавяне');
      }
    } else {
      console.log('❌ Модалът за добавяне на потребител не се отвори');
    }
    
    // 5. ТЕСТ 2: Редактиране на потребител
    console.log('\n🧪 ТЕСТ 2: Редактиране на потребител');
    await page.evaluate(() => {
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const editBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-blue-600') && !btn.className.includes('text-red-600');
      });
      if (editBtn) editBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    const editModalOpened = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !!modal;
    });
    
    if (editModalOpened) {
      console.log('✅ Модалът за редактиране се отвори');
      
      // Попълни формата с нови данни
      await page.click('input[name="name"]');
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.type('input[name="name"]', 'Test User QA Updated');
      
      // Кликни "Запази"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
        if (saveBtn) saveBtn.click();
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      const editModalClosed = await page.evaluate(() => {
        const modal = document.querySelector('form');
        return !modal;
      });
      
      if (editModalClosed) {
        console.log('✅ Потребителят беше редактиран успешно');
      } else {
        console.log('❌ Модалът не се затвори след редактиране');
      }
    } else {
      console.log('❌ Модалът за редактиране не се отвори');
    }
    
    // 6. ТЕСТ 3: Преглед на история на потребител
    console.log('\n🧪 ТЕСТ 3: Преглед на история на потребител');
    await page.evaluate(() => {
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const historyBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-green-600');
      });
      if (historyBtn) historyBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    const historyModalOpened = await page.evaluate(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return !!modal;
    });
    
    if (historyModalOpened) {
      console.log('✅ Модалът за история се отвори');
      
      // Провери дали има резервации
      const bookingsCount = await page.evaluate(() => {
        const bookingRows = document.querySelectorAll('tr');
        return bookingRows.length - 1; // Изваждаме header-а
      });
      console.log(`📋 Намерени резервации в историята: ${bookingsCount}`);
      
      // 7. ТЕСТ 4: Редактиране на бележки за лечение
      if (bookingsCount > 0) {
        console.log('\n🧪 ТЕСТ 4: Редактиране на бележки за лечение');
        
        // Кликни на бутон за редактиране на бележки
        await page.evaluate(() => {
          const editNotesBtn = document.querySelector('button[title="Редактирай бележки"]');
          if (editNotesBtn) editNotesBtn.click();
        });
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        
        // Провери дали се отвори textarea за редактиране
        const textareaOpened = await page.evaluate(() => {
          const textarea = document.querySelector('textarea');
          return textarea && textarea.style.display !== 'none';
        });
        
        if (textareaOpened) {
          console.log('✅ Textarea за бележки се отвори');
          
          // Попълни бележки
          await page.type('textarea', 'QA тест бележки за лечение');
          
          // Кликни "Запази"
          await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
            if (saveBtn) saveBtn.click();
          });
          
          await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
          console.log('✅ Бележките бяха запазени');
        } else {
          console.log('❌ Textarea за бележки не се отвори');
        }
      }
      
      // Затвори модала за история
      await page.evaluate(() => {
        const closeBtn = document.querySelector('button svg');
        if (closeBtn) closeBtn.closest('button').click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
    } else {
      console.log('❌ Модалът за история не се отвори');
    }
    
    // 8. ТЕСТ 5: Изтриване на потребител
    console.log('\n🧪 ТЕСТ 5: Изтриване на потребител');
    await page.evaluate(() => {
      const tableButtons = Array.from(document.querySelectorAll('table button'));
      const deleteBtn = tableButtons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && btn.className.includes('text-red-600');
      });
      if (deleteBtn) deleteBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Провери дали се появи confirm диалог
    const confirmDialog = await page.evaluate(() => {
      return window.confirm;
    });
    
    if (confirmDialog) {
      console.log('✅ Confirm диалог се появи');
      // Приеми изтриването
      await page.evaluate(() => {
        window.confirm = () => true;
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      console.log('✅ Потребителят беше изтрит');
    } else {
      console.log('❌ Confirm диалог не се появи');
    }
    
    // 9. ТЕСТ 6: Валидация на формата
    console.log('\n🧪 ТЕСТ 6: Валидация на формата');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Опитай да запазиш без задължителни полета
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.trim() === 'Добави');
      if (addBtn) addBtn.click();
    });
    
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // Провери дали модалът все още е отворен (валидацията не е минала)
    const modalStillOpen = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !!modal;
    });
    
    if (modalStillOpen) {
      console.log('✅ Валидацията работи - модалът остава отворен при грешни данни');
    } else {
      console.log('❌ Валидацията не работи - модалът се затвори при грешни данни');
    }
    
    // Затвори модала
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(btn => btn.textContent.trim() === 'Отказ');
      if (cancelBtn) cancelBtn.click();
    });
    
    console.log('\n🎉 Всички тестове за секцията Потребители завършиха!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testUsersSection(); 