// 🧪 Тест за затваряне на модала за потребители
const puppeteer = require('puppeteer');

async function testUsersModalClose() {
  console.log('🎯 Тестване на затваряне на модала за потребители...');
  
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
    
    // 2. Отиди в секция Потребители
    console.log('📋 Отивам в секция Потребители...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      console.log('All button texts:', buttons.map(btn => btn.textContent.trim()));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      console.log('Found users button:', !!usersBtn);
      if (usersBtn) {
        console.log('Clicking users button...');
        usersBtn.click();
      } else {
        console.log('Users button not found, trying alternative selector...');
        // Опитай да намериш бутона по клас или атрибут
        const altUsersBtn = document.querySelector('button[data-tab="users"]') || 
                           document.querySelector('button[aria-label*="Потребители"]') ||
                           document.querySelector('button:contains("Потребители")');
        if (altUsersBtn) {
          console.log('Found users button with alternative selector');
          altUsersBtn.click();
        }
      }
    });
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали се смени секцията
    const newTab = await page.evaluate(() => {
      const activeTab = document.querySelector('.bg-blue-600');
      return activeTab ? activeTab.textContent : 'No active tab';
    });
    console.log('📋 След клик секция:', newTab);
    
    // 3. ТЕСТ 1: Отвори модала за добавяне и кликни "Отказ"
    console.log('\n🧪 ТЕСТ 1: Отваряне и затваряне с "Отказ"');
    
    // Debug: провери дали сме в правилната секция
    const currentTab = await page.evaluate(() => {
      const activeTab = document.querySelector('.bg-blue-600');
      return activeTab ? activeTab.textContent : 'No active tab';
    });
    console.log('📋 Текуща секция:', currentTab);
    
    // Debug: провери всички бутони
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => btn.textContent.trim()).filter(text => text);
    });
    console.log('📋 Намерени бутони:', allButtons);
    
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
      
      // Кликни "Отказ"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(btn => btn.textContent.trim() === 'Отказ');
        if (cancelBtn) cancelBtn.click();
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали модалът се затвори
      const modalClosed = await page.evaluate(() => {
        const modal = document.querySelector('form');
        return !modal;
      });
      
      if (modalClosed) {
        console.log('✅ Модалът се затвори с "Отказ"');
      } else {
        console.log('❌ Модалът не се затвори с "Отказ"');
      }
    } else {
      console.log('❌ Модалът за добавяне на потребител не се отвори');
    }
    
    // 4. ТЕСТ 2: Отвори модала за редактиране и кликни "Отказ"
    console.log('\n🧪 ТЕСТ 2: Отваряне на редактиране и затваряне с "Отказ"');
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
      
      // Кликни "Отказ"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const cancelBtn = buttons.find(btn => btn.textContent.trim() === 'Отказ');
        if (cancelBtn) cancelBtn.click();
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      const editModalClosed = await page.evaluate(() => {
        const modal = document.querySelector('form');
        return !modal;
      });
      
      if (editModalClosed) {
        console.log('✅ Модалът за редактиране се затвори с "Отказ"');
      } else {
        console.log('❌ Модалът за редактиране не се затвори с "Отказ"');
      }
    } else {
      console.log('❌ Модалът за редактиране не се отвори');
    }
    
    // 5. ТЕСТ 3: Отвори модала за добавяне и попълни минимални данни за тест на "Добави"
    console.log('\n🧪 ТЕСТ 3: Тестване на "Добави" с минимални данни');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
         // Попълни само задължителните полета с уникален телефонен номер
     const uniquePhone = `+359888${Date.now()}`;
     await page.type('input[name="name"]', 'Test User');
     await page.type('input[name="phone"]', uniquePhone);
    
    // Кликни "Добави"
    await page.click('button[type="submit"]');
    
    await (page.waitForTimeout ? page.waitForTimeout(5000) : new Promise(resolve => setTimeout(resolve, 5000)));
    
    // Провери дали модалът се затвори
    const addModalClosed = await page.evaluate(() => {
      const modal = document.querySelector('form');
      return !modal;
    });
    
    if (addModalClosed) {
      console.log('✅ Модалът се затвори след "Добави"');
    } else {
      console.log('❌ Модалът не се затвори след "Добави"');
    }
    
    console.log('\n🎉 Тестът за затваряне на модала завърши!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testUsersModalClose(); 