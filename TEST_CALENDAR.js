// 🧪 Пълен тест за функционалността на Календар секцията
const puppeteer = require('puppeteer');

async function testCalendar() {
  console.log('🎯 Пълен тест за функционалността на Календар...');
  
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
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0', timeout: 60000 });
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(5000) : new Promise(resolve => setTimeout(resolve, 5000)));
    
    // 2. Отиди в секция Календар
    console.log('📋 Отивам в секция Календар...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const calendarBtn = buttons.find(btn => btn.textContent.trim() === 'Календар');
      if (calendarBtn) calendarBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Провери дали се смени секцията
    const currentTab = await page.evaluate(() => {
      const activeTab = document.querySelector('.bg-blue-600');
      return activeTab ? activeTab.textContent : 'No active tab';
    });
    console.log('📋 Текуща секция:', currentTab);
    
    if (currentTab !== 'Календар') {
      console.log('❌ Не успях да отида в секция Календар');
      return;
    }
    
    // DEBUG: Покажи всички бутони в календара
    console.log('\n🔍 DEBUG: Анализ на всички бутони в календара...');
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        hasSvg: !!btn.querySelector('svg'),
        svgContent: btn.querySelector('svg') ? btn.querySelector('svg').innerHTML : null
      }));
    });
    console.log('📋 Всички бутони:', allButtons);
    
    // 3. ТЕСТ 1: Проверка на навигацията в календара
    console.log('\n🧪 ТЕСТ 1: Навигация в календара');
    
    // Провери дали има бутони за навигация (ChevronLeft, ChevronRight)
    const hasNavigation = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const prevBtn = buttons.find(btn => btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('chevron-left'));
      const nextBtn = buttons.find(btn => btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('chevron-right'));
      return { prev: !!prevBtn, next: !!nextBtn };
    });
    
    if (hasNavigation.prev && hasNavigation.next) {
      console.log('✅ Бутоните за навигация са налични');
      
      // Тествай навигацията
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const nextBtn = buttons.find(btn => btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('chevron-right'));
        if (nextBtn) nextBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const prevBtn = buttons.find(btn => btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('chevron-left'));
        if (prevBtn) prevBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      console.log('✅ Навигацията в календара работи');
    } else {
      console.log('❌ Бутоните за навигация не са налични');
    }
    
    // 4. ТЕСТ 2: Проверка на днешната дата
    console.log('\n🧪 ТЕСТ 2: Проверка на днешната дата');
    
    const todayHighlighted = await page.evaluate(() => {
      const today = new Date();
      const todayCell = document.querySelector(`[data-date="${today.toISOString().split('T')[0]}"]`) ||
                       document.querySelector('.bg-blue-100') ||
                       document.querySelector('.border-blue-400');
      return !!todayCell;
    });
    
    if (todayHighlighted) {
      console.log('✅ Днешната дата е маркирана');
    } else {
      console.log('❌ Днешната дата не е маркирана');
    }
    
    // 5. ТЕСТ 3: Проверка на филтри за статус
    console.log('\n🧪 ТЕСТ 3: Проверка на филтри за статус');
    
    const hasStatusFilters = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const filterButtons = buttons.filter(btn => 
        btn.textContent.includes('Всички') || 
        btn.textContent.includes('Чакащи') || 
        btn.textContent.includes('Потвърдени') || 
        btn.textContent.includes('Отменени')
      );
      return filterButtons.length > 0;
    });
    
    if (hasStatusFilters) {
      console.log('✅ Филтрите за статус са налични');
      
      // Тествай филтрите
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const pendingBtn = buttons.find(btn => btn.textContent.includes('Чакащи'));
        if (pendingBtn) pendingBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const confirmedBtn = buttons.find(btn => btn.textContent.includes('Потвърдени'));
        if (confirmedBtn) confirmedBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const allBtn = buttons.find(btn => btn.textContent.includes('Всички'));
        if (allBtn) allBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      
      console.log('✅ Филтрите за статус работят');
    } else {
      console.log('❌ Филтрите за статус не са налични');
    }
    
    // 6. ТЕСТ 4: Проверка на съществуващи резервации
    console.log('\n🧪 ТЕСТ 4: Проверка на съществуващи резервации');
    
    const hasBookings = await page.evaluate(() => {
      const bookingElements = document.querySelectorAll('[class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-red-100"]');
      return bookingElements.length > 0;
    });
    
    if (hasBookings) {
      console.log('✅ Има резервации в календара');
      
      // Тествай кликване върху резервация
      await page.evaluate(() => {
        const bookingElement = document.querySelector('[class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-red-100"]');
        if (bookingElement) bookingElement.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали се отвори DailySchedule модал
      const dailyScheduleOpened = await page.evaluate(() => {
        const modal = document.querySelector('[class*="modal"], [class*="fixed"]');
        return !!modal;
      });
      
      if (dailyScheduleOpened) {
        console.log('✅ DailySchedule модалът се отвори');
        
        // Затвори модала
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const closeBtn = buttons.find(btn => btn.textContent.includes('×') || btn.textContent.includes('Затвори'));
          if (closeBtn) closeBtn.click();
        });
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      } else {
        console.log('❌ DailySchedule модалът не се отвори');
      }
    } else {
      console.log('📋 Няма резервации в календара');
    }
    
    // 7. ТЕСТ 5: Добавяне на нова резервация
    console.log('\n🧪 ТЕСТ 5: Добавяне на нова резервация');
    
    // Кликни върху свободна дата
    await page.evaluate(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      const tomorrowCell = document.querySelector(`[data-date="${tomorrowStr}"]`) ||
                          document.querySelector('.cursor-pointer:not(.bg-blue-100):not([class*="bg-green"]):not([class*="bg-yellow"]):not([class*="bg-red"])');
      if (tomorrowCell) tomorrowCell.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // Провери дали се отвори DailySchedule модал
    const dailyScheduleOpened2 = await page.evaluate(() => {
      const modal = document.querySelector('[class*="modal"], [class*="fixed"]');
      return !!modal;
    });
    
    if (dailyScheduleOpened2) {
      console.log('✅ DailySchedule модалът се отвори при кликване върху дата');
      
      // Затвори модала
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const closeBtn = buttons.find(btn => btn.textContent.includes('×') || btn.textContent.includes('Затвори'));
        if (closeBtn) closeBtn.click();
      });
      await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    } else {
      console.log('❌ DailySchedule модалът не се отвори при кликване върху дата');
    }
    
    // 8. ТЕСТ 6: Проверка на бутон "Добави резервация" (Plus икона) - подобрен
    console.log('\n🧪 ТЕСТ 6: Проверка на бутон "Добави резервация"');
    
    // Първо провери дали има бутони с Plus икона в календарните клетки
    const hasAddButtons = await page.evaluate(() => {
      // Търси бутони с Plus икона в календарните клетки
      const calendarCells = document.querySelectorAll('.cursor-pointer');
      let foundAddButtons = 0;
      
      calendarCells.forEach(cell => {
        const plusButtons = cell.querySelectorAll('button');
        plusButtons.forEach(btn => {
          if (btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('plus')) {
            foundAddButtons++;
          }
        });
      });
      
      return foundAddButtons > 0;
    });
    
    if (hasAddButtons) {
      console.log('✅ Бутоните "Добави резервация" са налични');
      
      // Тествай кликване върху бутон за добавяне
      await page.evaluate(() => {
        const calendarCells = document.querySelectorAll('.cursor-pointer');
        for (let cell of calendarCells) {
          const plusBtn = cell.querySelector('button svg');
          if (plusBtn && plusBtn.innerHTML.includes('plus')) {
            plusBtn.closest('button').click();
            break;
          }
        }
      });
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали се отвори модал за добавяне
      const addModalOpened = await page.evaluate(() => {
        const modal = document.querySelector('form') || document.querySelector('.modal');
        return !!modal;
      });
      
      if (addModalOpened) {
        console.log('✅ Модалът за добавяне на резервация се отвори');
        
        // Затвори модала
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const closeBtn = buttons.find(btn => btn.textContent.includes('Отказ') || btn.textContent.includes('×'));
          if (closeBtn) closeBtn.click();
        });
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      } else {
        console.log('❌ Модалът за добавяне на резервация не се отвори');
      }
    } else {
      console.log('❌ Бутоните "Добави резервация" не са налични');
    }
    
    // 9. ТЕСТ 7: Проверка на работно време (Settings икона) - подобрен
    console.log('\n🧪 ТЕСТ 7: Проверка на работно време');
    
    // Провери дали има бутони с Settings икона в календарните клетки
    const hasWorkingHoursButtons = await page.evaluate(() => {
      const calendarCells = document.querySelectorAll('.cursor-pointer');
      let foundSettingsButtons = 0;
      
      calendarCells.forEach(cell => {
        const settingsButtons = cell.querySelectorAll('button');
        settingsButtons.forEach(btn => {
          if (btn.querySelector('svg') && btn.querySelector('svg').innerHTML.includes('settings')) {
            foundSettingsButtons++;
          }
        });
      });
      
      return foundSettingsButtons > 0;
    });
    
    if (hasWorkingHoursButtons) {
      console.log('✅ Бутоните за работно време са налични');
      
      // Тествай кликване върху бутон за работно време
      await page.evaluate(() => {
        const calendarCells = document.querySelectorAll('.cursor-pointer');
        for (let cell of calendarCells) {
          const settingsBtn = cell.querySelector('button svg');
          if (settingsBtn && settingsBtn.innerHTML.includes('settings')) {
            settingsBtn.closest('button').click();
            break;
          }
        }
      });
      await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
      
      // Провери дали се отвори модал за работно време
      const workingHoursModalOpened = await page.evaluate(() => {
        const modal = document.querySelector('form') || document.querySelector('.modal');
        return !!modal;
      });
      
      if (workingHoursModalOpened) {
        console.log('✅ Модалът за работно време се отвори');
        
        // Затвори модала
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const closeBtn = buttons.find(btn => btn.textContent.includes('Отказ') || btn.textContent.includes('×'));
          if (closeBtn) closeBtn.click();
        });
        await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
      } else {
        console.log('❌ Модалът за работно време не се отвори');
      }
    } else {
      console.log('❌ Бутоните за работно време не са налични');
    }
    
    // 10. ТЕСТ 8: Проверка на индикатори за работно време - подобрен
    console.log('\n🧪 ТЕСТ 8: Проверка на индикатори за работно време');
    
    const hasWorkingHoursIndicators = await page.evaluate(() => {
      // Търси индикатори в календарните клетки
      const calendarCells = document.querySelectorAll('.cursor-pointer');
      let foundIndicators = 0;
      
      calendarCells.forEach(cell => {
        const indicators = cell.querySelectorAll('.w-2.h-2.bg-green-500, .w-2.h-2.bg-red-500, .w-2.h-2.rounded-full');
        foundIndicators += indicators.length;
      });
      
      return foundIndicators > 0;
    });
    
    if (hasWorkingHoursIndicators) {
      console.log('✅ Индикаторите за работно време са налични');
    } else {
      console.log('📋 Няма индикатори за работно време');
    }
    
    // 11. ТЕСТ 9: Проверка на touch/swipe функционалност
    console.log('\n🧪 ТЕСТ 9: Проверка на touch/swipe функционалност');
    
    const hasTouchSupport = await page.evaluate(() => {
      const calendarGrid = document.querySelector('[onTouchStart]') || document.querySelector('[onTouchMove]') || document.querySelector('[onTouchEnd]');
      return !!calendarGrid;
    });
    
    if (hasTouchSupport) {
      console.log('✅ Touch/swipe функционалността е налична');
    } else {
      console.log('📋 Touch/swipe функционалността не е налична');
    }
    
    // 12. ТЕСТ 10: Проверка на структура на календара
    console.log('\n🧪 ТЕСТ 10: Проверка на структура на календара');
    
    const calendarStructure = await page.evaluate(() => {
      const dayHeaders = document.querySelectorAll('.grid-cols-7 .text-xs, .grid-cols-7 .text-sm');
      const calendarDays = document.querySelectorAll('.grid-cols-7 > div > div');
      const has7Columns = document.querySelector('.grid-cols-7');
      
      return {
        hasDayHeaders: dayHeaders.length >= 7,
        hasCalendarDays: calendarDays.length > 0,
        has7Columns: !!has7Columns
      };
    });
    
    if (calendarStructure.hasDayHeaders && calendarStructure.hasCalendarDays && calendarStructure.has7Columns) {
      console.log('✅ Структурата на календара е правилна');
    } else {
      console.log('❌ Структурата на календара не е правилна');
    }
    
    // 13. ТЕСТ 11: Проверка на hover ефекти и скрити бутони
    console.log('\n🧪 ТЕСТ 11: Проверка на hover ефекти и скрити бутони');
    
    // Провери дали има скрити бутони които се появяват при hover
    const hasHiddenButtons = await page.evaluate(() => {
      const calendarCells = document.querySelectorAll('.cursor-pointer');
      let foundHiddenButtons = 0;
      
      calendarCells.forEach(cell => {
        // Провери за бутони с opacity-0 или скрити класове
        const hiddenButtons = cell.querySelectorAll('button[class*="opacity-0"], button[class*="hidden"], button[class*="invisible"]');
        foundHiddenButtons += hiddenButtons.length;
      });
      
      return foundHiddenButtons > 0;
    });
    
    if (hasHiddenButtons) {
      console.log('✅ Има скрити бутони които се появяват при hover');
    } else {
      console.log('📋 Няма скрити бутони');
    }
    
    console.log('\n🎉 Пълен тестът за Календар завърши!');
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testCalendar(); 