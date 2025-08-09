// 🧪 Тест за историята на резервациите за потребители
const puppeteer = require('puppeteer');

async function testUserHistory() {
  console.log('🎯 Тестване на историята на резервациите...');
  
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
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // 3. ТЕСТ 1: Проверка на потребители без резервации
    console.log('\n🧪 ТЕСТ 1: Потребители без резервации');
    
    // Провери дали има потребители
    const usersCount = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return 0;
      const rows = table.querySelectorAll('tbody tr');
      return rows.length;
    });
    
    console.log('📋 Брой потребители:', usersCount);
    
    if (usersCount > 0) {
      // Кликни върху иконата за история на Николай Петров
      await page.evaluate(() => {
        const table = document.querySelector('table');
        if (table) {
          const rows = Array.from(table.querySelectorAll('tbody tr'));
          const nikolayRow = rows.find(row => {
            const nameCell = row.querySelector('td');
            return nameCell && nameCell.textContent.includes('Николай Петров');
          });
          
          if (nikolayRow) {
            const historyBtn = nikolayRow.querySelector('button[title="История на резервациите"]') ||
                              nikolayRow.querySelector('button[title*="История"]') ||
                              nikolayRow.querySelector('button[aria-label*="История"]') ||
                              nikolayRow.querySelector('svg[data-icon="history"]')?.closest('button') ||
                              nikolayRow.querySelector('button:has(svg)');
            if (historyBtn) {
              console.log('Clicking history button for Николай Петров...');
              console.log('Button title:', historyBtn.title);
              console.log('Button onclick:', historyBtn.onclick);
              historyBtn.click();
            } else {
              console.log('History button not found for Николай Петров');
            }
          } else {
            console.log('Николай Петров not found in table');
          }
        }
      });
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали се отвори модал или панел
      const historyModal = await page.evaluate(() => {
        const modal = document.querySelector('.modal') || 
                     document.querySelector('[role="dialog"]') ||
                     document.querySelector('.history-panel') ||
                     document.querySelector('.bg-white.rounded-lg.shadow-xl') ||
                     document.querySelector('.bg-white.border.rounded-lg');
        return !!modal;
      });
      
      if (historyModal) {
        console.log('✅ Модалът за история се отвори');
        
        // Провери дали има резервации
        const hasBookings = await page.evaluate(() => {
          const bookings = document.querySelectorAll('.booking-item') ||
                          document.querySelectorAll('tr') ||
                          document.querySelectorAll('.bg-gray-50');
          return bookings.length > 0;
        });
        
        if (hasBookings) {
          console.log('✅ Има резервации в историята');
        } else {
          console.log('📋 Няма резервации в историята - показва се празно съобщение');
          
          // Провери дали има съобщение "Няма резервации"
          const noBookingsMessage = await page.evaluate(() => {
            const message = document.querySelector('.text-gray-500') ||
                          document.querySelector('.text-center') ||
                          document.querySelector('p');
            return message ? message.textContent.includes('Няма') || message.textContent.includes('No') : false;
          });
          
          if (noBookingsMessage) {
            console.log('✅ Показва се правилно съобщение за липса на резервации');
          } else {
            console.log('❌ Не се показва съобщение за липса на резервации');
          }
        }
        
        // Затвори модала
        await page.evaluate(() => {
          const closeBtn = document.querySelector('button svg[data-icon="x"]')?.closest('button') ||
                          document.querySelector('button:has(svg)') ||
                          document.querySelector('.close-btn') ||
                          document.querySelector('button[aria-label="Close"]');
          if (closeBtn) closeBtn.click();
        });
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      } else {
        console.log('❌ Модалът за история не се отвори');
      }
    } else {
      console.log('📋 Няма потребители за тестване');
    }
    
    // 4. ТЕСТ 2: Създаване на потребител с резервации
    console.log('\n🧪 ТЕСТ 2: Създаване на потребител с резервации');
    
    // Добави нов потребител
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addUserBtn = buttons.find(btn => btn.textContent.trim() === 'Добави потребител');
      if (addUserBtn) addUserBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    const uniquePhone = `+359888${Date.now()}`;
    await page.type('input[name="name"]', 'History Test User');
    await page.type('input[name="phone"]', uniquePhone);
    await page.type('input[name="email"]', 'history@test.com');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Отиди в секция Резервации и добави резервация за този потребител
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingsBtn = buttons.find(btn => btn.textContent.trim() === 'Резервации');
      if (bookingsBtn) bookingsBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Добави резервация
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBookingBtn = buttons.find(btn => btn.textContent.trim() === 'Добави резервация');
      if (addBookingBtn) addBookingBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    await page.type('input[name="name"]', 'History Test User');
    await page.type('input[name="phone"]', uniquePhone);
    await page.type('input[name="email"]', 'history@test.com');
    
    // Изчакай услугите да се заредят
    await page.waitForFunction(() => {
      const serviceSelect = document.querySelector('select[name="service"]');
      return serviceSelect && serviceSelect.options.length > 1;
    }, { timeout: 10000 });
    
    // Избери услуга
    await page.evaluate(() => {
      const serviceSelect = document.querySelector('select[name="service"]');
      console.log('Service select found:', !!serviceSelect);
      if (serviceSelect) {
        console.log('Service options count:', serviceSelect.options.length);
        if (serviceSelect.options.length > 1) { // Skip the first "Изберете услуга" option
          serviceSelect.value = serviceSelect.options[1].value;
          serviceSelect.dispatchEvent(new Event('change'));
          console.log('Selected service:', serviceSelect.options[1].text);
        } else {
          console.log('No service options available');
        }
      } else {
        console.log('Service select not found');
      }
    });
    
    // Избери дата (утре)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.type('input[name="date"]', tomorrowStr);
    
    // Избери час
    await page.evaluate(() => {
      const timeSelect = document.querySelector('select[name="time"]');
      if (timeSelect && timeSelect.options.length > 0) {
        timeSelect.value = timeSelect.options[0].value;
        timeSelect.dispatchEvent(new Event('change'));
      }
    });
    
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // 5. ТЕСТ 3: Проверка на историята за потребител с резервации
    console.log('\n🧪 ТЕСТ 3: Проверка на историята за потребител с резервации');
    
    // Върни се в секция Потребители
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const usersBtn = buttons.find(btn => btn.textContent.trim() === 'Потребители');
      if (usersBtn) usersBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Намери потребителя и кликни върху историята
    await page.evaluate(() => {
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const targetRow = rows.find(row => {
          const nameCell = row.querySelector('td');
          return nameCell && nameCell.textContent.includes('History Test User');
        });
        
        if (targetRow) {
          const historyBtn = targetRow.querySelector('button[title="История на резервациите"]') ||
                            targetRow.querySelector('button[title*="История"]') ||
                            targetRow.querySelector('button[aria-label*="История"]') ||
                            targetRow.querySelector('svg[data-icon="history"]')?.closest('button') ||
                            targetRow.querySelector('button:has(svg)');
          if (historyBtn) {
            console.log('Clicking history button for user with bookings...');
            historyBtn.click();
          }
        }
      }
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Провери дали се отвори модал и има резервации
    const historyModalWithBookings = await page.evaluate(() => {
      const modal = document.querySelector('.modal') || 
                   document.querySelector('[role="dialog"]') ||
                   document.querySelector('.history-panel') ||
                   document.querySelector('.bg-white.border.rounded-lg');
      return !!modal;
    });
    
    if (historyModalWithBookings) {
      console.log('✅ Модалът за история се отвори');
      
      const hasBookingsInHistory = await page.evaluate(() => {
        const bookings = document.querySelectorAll('.booking-item') ||
                        document.querySelectorAll('tr') ||
                        document.querySelectorAll('.bg-gray-50');
        return bookings.length > 0;
      });
      
      if (hasBookingsInHistory) {
        console.log('✅ Има резервации в историята на потребителя');
      } else {
        console.log('❌ Няма резервации в историята на потребителя');
      }
      
      // Затвори модала
      await page.evaluate(() => {
        const closeBtn = document.querySelector('button:contains("×")') ||
                        document.querySelector('button:contains("Затвори")') ||
                        document.querySelector('.close-btn') ||
                        document.querySelector('button[aria-label="Close"]');
        if (closeBtn) closeBtn.click();
      });
    } else {
      console.log('❌ Модалът за история не се отвори');
    }
    
    console.log('\n🎉 Тестът за историята на резервациите завърши!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testUserHistory(); 