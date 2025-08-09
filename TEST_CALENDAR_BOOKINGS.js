const puppeteer = require('puppeteer');

async function checkAndRestoreAdminToken(page) {
  const adminToken = await page.evaluate(() => {
    const adminToken = localStorage.getItem('adminToken');
    return !!adminToken;
  });
  
  if (!adminToken) {
    console.log('📋 Admin token е изгубен, опитвам да се логна отново...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали се логнахме успешно
    const isLoggedInAgain = await page.evaluate(() => {
      const adminToken = localStorage.getItem('adminToken');
      return !!adminToken;
    });
    
    if (isLoggedInAgain) {
      console.log('✅ Успешно се логнах отново');
      await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    } else {
      console.log('❌ Неуспешно логване');
    }
  }
}

async function testCalendarBookings() {
  console.log('🎯 Пълен тест за резервации през календара...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('📋 Browser console:', msg.text()));
  
  try {
    // 1. Login
    console.log('📋 Login...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    
    // Провери дали страницата се зареди правилно
    const pageTitle = await page.title();
    console.log('📋 Page title:', pageTitle);
    
    // Изчакай малко за да се зареди страницата
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали има login форма
    const loginFormExists = await page.evaluate(() => {
      const form = document.querySelector('form');
      const usernameInput = document.querySelector('input[name="username"]');
      const passwordInput = document.querySelector('input[name="password"]');
      return !!(form && usernameInput && passwordInput);
    });
    
    if (!loginFormExists) {
      throw new Error('❌ Login формата не е намерена');
    }
    
    console.log('✅ Login формата е намерена');
    
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали се логнахме успешно
    const isLoggedIn = await page.evaluate(() => {
      const adminToken = localStorage.getItem('adminToken');
      return !!adminToken;
    });
    
    if (!isLoggedIn) {
      throw new Error('❌ Неуспешно логване');
    }
    console.log('✅ Успешно логване - admin token наличен');
    
    // 2. Отиди в секция Календар
    console.log('📋 Отивам в секция Календар...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Кликни върху таб Календар
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const calendarBtn = buttons.find(btn => btn.textContent.includes('Календар'));
      if (calendarBtn) {
        console.log('Намерен бутон Календар, кликвам...');
        calendarBtn.click();
      }
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    console.log('📋 Текуща секция: Календар');
    
    // 3. ТЕСТ 1: Добавяне на резервация чрез бутон в календарната клетка
    console.log('\n🧪 ТЕСТ 1: Добавяне на резервация чрез бутон в календарната клетка');
    
    // Намери и кликни бутон "Добави резервация" в календарната клетка
    const addBookingBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Добави резервация'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addBookingBtn) {
      console.log('✅ Бутонът "Добави резервация" в календарната клетка е кликнат');
      
      // Изчакай формата да се отвори
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали формата се отвори
      const formOpened = await page.evaluate(() => {
        const form = document.querySelector('form');
        const timeInput = document.querySelector('input[name="time"]');
        return !!(form && timeInput);
      });
      
      if (formOpened) {
        console.log('✅ Формата за резервация се отвори');
        console.log('📋 Попълвам формата за резервация от календарната клетка...');
        
        // Попълни формата
        console.log('📋 Попълвам полетата с Puppeteer...');
        
        // Debug информация за полетата в формата
        const formFields = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (!form) return null;
          
          const inputs = form.querySelectorAll('input, select, textarea');
          const fields = [];
          
          inputs.forEach(input => {
            fields.push({
              name: input.name,
              type: input.type,
              tagName: input.tagName,
              value: input.value
            });
          });
          
          console.log('📋 Form fields:', fields);
          return fields;
        });
        
        console.log('📋 Form fields debug:', formFields);
        
        // Попълни дата
        await page.click('input[name="date"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const year = tomorrow.getFullYear();
        const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const day = String(tomorrow.getDate()).padStart(2, '0');
        const tomorrowStr = `${year}-${month}-${day}`;
        console.log('📋 Tomorrow date:', tomorrowStr);
        await page.type('input[name="date"]', tomorrowStr);
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Попълни час
        await page.click('input[name="time"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type('input[name="time"]', '10:00');
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Провери дали времето се попълни правилно
        const timeValue = await page.evaluate(() => {
          const timeInput = document.querySelector('input[name="time"]');
          return timeInput ? timeInput.value : '';
        });
        console.log('📋 Time value after typing:', timeValue);
        
        // Попълни име
        await page.click('input[name="name"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type('input[name="name"]', 'Тест Клиент 1');
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Попълни телефон
        await page.click('input[name="phone"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type('input[name="phone"]', `+359888${Date.now()}`);
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Попълни услуга - опитай различни имена на полето
        try {
          await page.select('select[name="serviceId"]', '1');
        } catch (e) {
          try {
            await page.select('select[name="service"]', '1');
          } catch (e2) {
            console.log('📋 Не може да се намери service select полето');
          }
        }
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Попълни съобщение
        await page.click('textarea[name="message"]');
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type('textarea[name="message"]', 'Тест резервация от календарната клетка');
        await (page.waitForTimeout ? page.waitForTimeout(500) : new Promise(resolve => setTimeout(resolve, 500)));
        
        // Debug информация за данните в формата
        const formData = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (!form) return null;
          
          const formData = new FormData(form);
          const data = {};
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          console.log('📋 Form data:', data);
          return data;
        });
        
        console.log('📋 Form data debug:', formData);
        
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        console.log('✅ Формата е попълнена от календарната клетка');
        
        // Запази резервацията
        console.log('📋 Запазвам резервацията...');
        
        // Добави listener за network заявки
        page.on('response', async (response) => {
          if (response.url().includes('/api/admin/bookings') && response.request().method() === 'POST') {
            console.log('📋 API отговор за резервация:', response.status());
            try {
              const responseText = await response.text();
              console.log('📋 API отговор текст:', responseText);
            } catch (e) {
              console.log('📋 Не може да се прочете API отговора');
            }
          }
        });
        
        // Debug информация за бутоните
        const buttonInfo = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveButtons = buttons.filter(btn => btn.textContent.includes('Запази'));
          
          console.log('📋 Всички бутони:', buttons.map(btn => ({ text: btn.textContent, type: btn.type })));
          console.log('📋 Save бутони:', saveButtons.map(btn => ({ text: btn.textContent, type: btn.type })));
          
          return {
            totalButtons: buttons.length,
            saveButtons: saveButtons.length,
            saveButtonTexts: saveButtons.map(btn => btn.textContent)
          };
        });
        
        console.log('📋 Button debug info:', buttonInfo);
        
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => btn.textContent.includes('Запази') && btn.type === 'submit');
          if (saveBtn) {
            console.log('📋 Намерен save бутон:', saveBtn.textContent, saveBtn.type);
            saveBtn.click();
            console.log('📋 Save бутонът е кликнат');
          } else {
            console.log('📋 Save бутонът не е намерен');
            // Опитай да кликнеш първия бутон със "Запази"
            const anySaveBtn = buttons.find(btn => btn.textContent.includes('Запази'));
            if (anySaveBtn) {
              console.log('📋 Кликвам алтернативен save бутон:', anySaveBtn.textContent);
              anySaveBtn.click();
            }
          }
        });
        
        // Изчакай да се запази
        await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
        
        // Провери дали резервацията се запази успешно
        const bookingSaved = await page.evaluate(() => {
          // Провери дали формата се затвори (знак, че резервацията се запази)
          const form = document.querySelector('form');
          const modal = document.querySelector('[role="dialog"]');
          const errorMessage = document.querySelector('.text-red-500, .text-red-600');
          
          console.log('📋 Form exists:', !!form);
          console.log('📋 Modal exists:', !!modal);
          console.log('📋 Error message exists:', !!errorMessage);
          
          if (errorMessage) {
            console.log('📋 Error message text:', errorMessage.textContent);
          }
          
          return !form && !modal;
        });
        
        if (bookingSaved) {
          console.log('✅ Резервацията е запазена от календарната клетка');
        } else {
          console.log('❌ Резервацията не се запази успешно');
        }
      } else {
        console.log('❌ Формата за резервация не се отвори');
      }
    } else {
      console.log('❌ Бутонът "Добави резервация" не е намерен');
    }
    
    // Проверка за admin token след Тест 1
    console.log('📋 Проверявам admin token след Тест 1...');
    await checkAndRestoreAdminToken(page);
    
    // 4. ТЕСТ 2: Отваряне на DailySchedule модал
    console.log('\n🧪 ТЕСТ 2: Отваряне на DailySchedule модал');
    
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Кликни върху дата в календара
    const dailyScheduleOpened = await page.evaluate(() => {
      const cells = document.querySelectorAll('.cursor-pointer');
      for (let cell of cells) {
        if (!cell.classList.contains('bg-blue-100') && 
            !cell.classList.contains('bg-green-100') && 
            !cell.classList.contains('bg-yellow-100') && 
            !cell.classList.contains('bg-red-100')) {
          cell.click();
          return true;
        }
      }
      return false;
    });
    
    if (dailyScheduleOpened) {
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали DailySchedule модалът се отвори
      const modalOpened = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"]');
        const title = document.querySelector('h2');
        const timeline = document.querySelector('.timeline');
        const workingHours = document.querySelector('.working-hours');
        
        console.log('Modal found:', !!modal);
        console.log('Title found:', !!title);
        console.log('Timeline found:', !!timeline);
        console.log('Working hours found:', !!workingHours);
        
        return !!(modal && title && timeline);
      });
      
      if (modalOpened) {
        console.log('✅ DailySchedule модалът се отвори');
      } else {
        console.log('❌ DailySchedule модалът не се отвори');
      }
    } else {
      console.log('❌ Не може да се намери свободна клетка в календара');
    }
    
    // Проверка за admin token след Тест 2
    console.log('📋 Проверявам admin token след Тест 2...');
    await checkAndRestoreAdminToken(page);
    
    // 5. ТЕСТ 3: Добавяне на резервация чрез бутон "Нова резервация"
    console.log('\n🧪 ТЕСТ 3: Добавяне на резервация чрез бутон "Нова резервация"');
    
    const newBookingBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newBtn = buttons.find(btn => btn.textContent.includes('Нова резервация'));
      if (newBtn) {
        newBtn.click();
        return true;
      }
      return false;
    });
    
    if (newBookingBtn) {
      console.log('✅ Бутонът "Нова резервация" е кликнат');
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали формата се отвори
      const formOpened = await page.evaluate(() => {
        const form = document.querySelector('form');
        const timeInput = document.querySelector('input[name="time"]');
        return !!(form && timeInput);
      });
      
      if (formOpened) {
        console.log('✅ Формата за резервация се отвори от бутона "Нова резервация"');
        console.log('📋 Попълвам формата за резервация от бутона "Нова резервация"...');
        
        // Попълни формата
        await page.evaluate(() => {
          // Попълни дата
          const dateInput = document.querySelector('input[name="date"]');
          if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            dateInput.value = tomorrowStr;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни час
          const timeInput = document.querySelector('input[name="time"]');
          if (timeInput) {
            timeInput.value = '11:00';
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни име
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput) {
            nameInput.value = 'Тест Клиент 2';
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни телефон
          const phoneInput = document.querySelector('input[name="phone"]');
          if (phoneInput) {
            phoneInput.value = `+359888${Date.now()}`;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни услуга
          const serviceSelect = document.querySelector('select[name="serviceId"]');
          if (serviceSelect && serviceSelect.options.length > 1) {
            serviceSelect.value = serviceSelect.options[1].value;
            serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни услуга (алтернативно име на полето)
          const serviceSelectAlt = document.querySelector('select[name="service"]');
          if (serviceSelectAlt && serviceSelectAlt.options.length > 1) {
            serviceSelectAlt.value = serviceSelectAlt.options[1].value;
            serviceSelectAlt.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни съобщение
          const messageInput = document.querySelector('textarea[name="message"]');
          if (messageInput) {
            messageInput.value = 'Тест резервация от бутона "Нова резервация"';
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            messageInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        console.log('✅ Формата е попълнена от бутона "Нова резервация"');
        
        // Запази резервацията
        console.log('📋 Запазвам резервацията от бутона "Нова резервация"...');
        
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => btn.textContent.includes('Запази') && btn.type === 'submit');
          if (saveBtn) {
            saveBtn.click();
          }
        });
        
        await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
        
        // Провери дали резервацията се запази успешно
        const bookingSaved = await page.evaluate(() => {
          const form = document.querySelector('form');
          const modal = document.querySelector('[role="dialog"]');
          const errorMessage = document.querySelector('.text-red-500, .text-red-600');
          
          console.log('📋 Form exists (Test 3):', !!form);
          console.log('📋 Modal exists (Test 3):', !!modal);
          console.log('📋 Error message exists (Test 3):', !!errorMessage);
          
          if (errorMessage) {
            console.log('📋 Error message text (Test 3):', errorMessage.textContent);
          }
          
          return !form && !modal;
        });
        
        if (bookingSaved) {
          console.log('✅ Резервацията е запазена от бутона "Нова резервация"');
        } else {
          console.log('❌ Резервацията не се запази успешно');
        }
      } else {
        console.log('❌ Формата за резервация не се отвори от бутона "Нова резервация"');
      }
    } else {
      console.log('❌ Бутонът "Нова резервация" не е намерен');
    }
    
    // Проверка за admin token след Тест 3
    console.log('📋 Проверявам admin token след Тест 3...');
    await checkAndRestoreAdminToken(page);
    
    // 6. ТЕСТ 4: Добавяне на резервация чрез бутон "Добави резервация" в списъка
    console.log('\n🧪 ТЕСТ 4: Добавяне на резервация чрез бутон "Добави резервация" в списъка');
    
    const addBookingListBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Добави резервация') && !btn.closest('.calendar'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (addBookingListBtn) {
      console.log('✅ Бутонът "Добави резервация" в списъка е кликнат');
      
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали формата се отвори
      const formOpened = await page.evaluate(() => {
        const form = document.querySelector('form');
        const timeInput = document.querySelector('input[name="time"]');
        return !!(form && timeInput);
      });
      
      if (formOpened) {
        console.log('✅ Формата за резервация се отвори от бутона "Добави резервация" в списъка');
        console.log('📋 Попълвам формата за резервация от бутона "Добави резервация" в списъка...');
        
        // Попълни формата
        await page.evaluate(() => {
          // Попълни дата
          const dateInput = document.querySelector('input[name="date"]');
          if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            dateInput.value = tomorrowStr;
            dateInput.dispatchEvent(new Event('input', { bubbles: true }));
            dateInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни час
          const timeInput = document.querySelector('input[name="time"]');
          if (timeInput) {
            timeInput.value = '12:00';
            timeInput.dispatchEvent(new Event('input', { bubbles: true }));
            timeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни име
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput) {
            nameInput.value = 'Тест Клиент 3';
            nameInput.dispatchEvent(new Event('input', { bubbles: true }));
            nameInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни телефон
          const phoneInput = document.querySelector('input[name="phone"]');
          if (phoneInput) {
            phoneInput.value = `+359888${Date.now()}`;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни услуга
          const serviceSelect = document.querySelector('select[name="serviceId"]');
          if (serviceSelect && serviceSelect.options.length > 1) {
            serviceSelect.value = serviceSelect.options[1].value;
            serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни услуга (алтернативно име на полето)
          const serviceSelectAlt = document.querySelector('select[name="service"]');
          if (serviceSelectAlt && serviceSelectAlt.options.length > 1) {
            serviceSelectAlt.value = serviceSelectAlt.options[1].value;
            serviceSelectAlt.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          // Попълни съобщение
          const messageInput = document.querySelector('textarea[name="message"]');
          if (messageInput) {
            messageInput.value = 'Тест резервация от бутона "Добави резервация" в списъка';
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));
            messageInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
        console.log('✅ Формата е попълнена от бутона "Добави резервация" в списъка');
        
        // Запази резервацията
        console.log('📋 Запазвам резервацията от бутона "Добави резервация" в списъка...');
        
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const saveBtn = buttons.find(btn => btn.textContent.includes('Запази') && btn.type === 'submit');
          if (saveBtn) {
            saveBtn.click();
          }
        });
        
        await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
        
        // Провери дали резервацията се запази успешно
        const bookingSaved = await page.evaluate(() => {
          const form = document.querySelector('form');
          const modal = document.querySelector('[role="dialog"]');
          const errorMessage = document.querySelector('.text-red-500, .text-red-600');
          
          console.log('📋 Form exists (Test 4):', !!form);
          console.log('📋 Modal exists (Test 4):', !!modal);
          console.log('📋 Error message exists (Test 4):', !!errorMessage);
          
          if (errorMessage) {
            console.log('📋 Error message text (Test 4):', errorMessage.textContent);
          }
          
          return !form && !modal;
        });
        
        if (bookingSaved) {
          console.log('✅ Резервацията е запазена от бутона "Добави резервация" в списъка');
        } else {
          console.log('❌ Резервацията не се запази успешно');
        }
      } else {
        console.log('❌ Формата за резервация не се отвори от бутона "Добави резервация" в списъка');
      }
    } else {
      console.log('❌ Бутонът "Добави резервация" в списъка не е намерен');
    }
    
    // 7. ТЕСТ 5: Проверка на създадените резервации
    console.log('\n🧪 ТЕСТ 5: Проверка на създадените резервации');
    
    // Отвори отново DailySchedule за проверка
    console.log('📋 Отварям отново DailySchedule за проверка на резервациите...');
    
    const dailyScheduleReopened = await page.evaluate(() => {
      const cells = document.querySelectorAll('.cursor-pointer');
      for (let cell of cells) {
        if (!cell.classList.contains('bg-blue-100') && 
            !cell.classList.contains('bg-green-100') && 
            !cell.classList.contains('bg-yellow-100') && 
            !cell.classList.contains('bg-red-100')) {
          cell.click();
          return true;
        }
      }
      return false;
    });
    
    if (dailyScheduleReopened) {
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери броя резервации
      const bookingCounts = await page.evaluate(() => {
        const timelineBookings = document.querySelectorAll('.timeline .booking');
        const listBookings = document.querySelectorAll('.booking-list .booking');
        
        return {
          timeline: timelineBookings.length,
          list: listBookings.length
        };
      });
      
      console.log(`✅ Timeline показва ${bookingCounts.timeline} резервации`);
      console.log(`✅ Списъкът показва ${bookingCounts.list} резервации`);
    } else {
      console.log('❌ Не може да се отвори DailySchedule за проверка');
    }
    
    // 8. ТЕСТ 6: Проверка на свободни часове и конфликти
    console.log('\n🧪 ТЕСТ 6: Проверка на свободни часове и конфликти');
    
    // Опитай да създадеш резервация в същия час като съществуваща
    console.log('📋 Тествам създаване на резервация в зает час...');
    
    const conflictTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => btn.textContent.includes('Добави резервация'));
      if (addBtn) {
        addBtn.click();
        return true;
      }
      return false;
    });
    
    if (conflictTest) {
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Попълни формата със същия час като съществуваща резервация
      await page.evaluate(() => {
        const dateInput = document.querySelector('input[name="date"]');
        const timeInput = document.querySelector('input[name="time"]');
        const nameInput = document.querySelector('input[name="name"]');
        const serviceSelect = document.querySelector('select[name="service"]');
        
        if (dateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          dateInput.value = tomorrowStr;
        }
        
        if (timeInput) {
          timeInput.value = '10:00'; // Същият час като първата резервация
        }
        
        if (nameInput) {
          nameInput.value = 'Конфликт Тест';
        }
        
        if (serviceSelect && serviceSelect.options.length > 1) {
          serviceSelect.value = serviceSelect.options[1].value;
        }
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      // Опитай да запазиш
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtn = buttons.find(btn => btn.textContent.includes('Запази') && btn.type === 'submit');
        if (saveBtn) {
          saveBtn.click();
        }
      });
      
      await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
      
      // Провери дали има съобщение за грешка
      const errorMessage = await page.evaluate(() => {
        const errorElement = document.querySelector('.text-red-500, .text-red-600, .bg-red-100');
        return errorElement ? errorElement.textContent : null;
      });
      
      if (errorMessage) {
        console.log('✅ Конфликтът е открит:', errorMessage);
      } else {
        console.log('❌ Конфликтът не е открит');
      }
    }
    
    console.log('\n🎉 Пълен тестът за резервации през календара завърши!');
      
    } catch (error) {
      console.error('❌ Грешка в теста:', error.message);
    } finally {
      await browser.close();
    }
  }
  
  testCalendarBookings();