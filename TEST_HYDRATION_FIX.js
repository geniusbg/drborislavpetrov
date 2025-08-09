const puppeteer = require('puppeteer');

async function testHydrationFix() {
  console.log('🔧 Тест за hydration fix...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null, 
    args: ['--start-maximized'] 
  });
  
  const page = await browser.newPage();
  
  // Capture console errors and warnings
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`📋 ${msg.type().toUpperCase()}: ${msg.text()}`);
    }
  });
  
  try {
    // 1. Навигирай към главната страница
    console.log('📋 Отивам на главната страница...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // 2. Провери дали има hydration errors
    console.log('📋 Проверявам за hydration errors...');
    const hydrationErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('Prop `min` did not match') || 
            message.includes('hydration') ||
            message.includes('Server:') && message.includes('Client:')) {
          errors.push(message);
        }
        originalError.apply(console, args);
      };
      
      // Trigger a page reload to catch hydration errors
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return errors;
    });
    
    if (hydrationErrors.length > 0) {
      console.log('❌ Hydration errors found:');
      hydrationErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ Няма hydration errors');
    }
    
    // 3. Провери дали датата в booking формата е правилна
    console.log('📋 Проверявам датата в booking формата...');
    const dateCheck = await page.evaluate(() => {
      const dateInput = document.querySelector('input[type="date"]');
      if (dateInput) {
        const minDate = dateInput.getAttribute('min');
        const currentDate = new Date().toISOString().split('T')[0];
        const bulgariaDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Sofia' })).toISOString().split('T')[0];
        
        return {
          hasDateInput: true,
          minDate,
          currentDate,
          bulgariaDate,
          isCorrect: minDate === bulgariaDate
        };
      }
      return { hasDateInput: false };
    });
    
    if (dateCheck.hasDateInput) {
      console.log('📋 Date input проверка:');
      console.log(`  - Min date: ${dateCheck.minDate}`);
      console.log(`  - Current date (local): ${dateCheck.currentDate}`);
      console.log(`  - Bulgaria date: ${dateCheck.bulgariaDate}`);
      console.log(`  - Is correct: ${dateCheck.isCorrect ? '✅' : '❌'}`);
    }
    
    // 4. Провери дали има други подобни проблеми
    console.log('📋 Проверявам за други подобни проблеми...');
    const otherIssues = await page.evaluate(() => {
      const issues = [];
      
      // Check for any date-related elements
      const dateElements = document.querySelectorAll('input[type="date"], input[type="time"]');
      dateElements.forEach((el, index) => {
        const min = el.getAttribute('min');
        const max = el.getAttribute('max');
        const value = el.getAttribute('value');
        
        if (min || max || value) {
          issues.push({
            type: 'date_element',
            index,
            min,
            max,
            value,
            tagName: el.tagName,
            type: el.type
          });
        }
      });
      
      return issues;
    });
    
    if (otherIssues.length > 0) {
      console.log('📋 Намерени date elements:');
      otherIssues.forEach(issue => {
        console.log(`  - ${issue.tagName}[type="${issue.type}"]: min="${issue.min}", max="${issue.max}", value="${issue.value}"`);
      });
    } else {
      console.log('✅ Няма проблемни date elements');
    }
    
    // 5. Провери дали всички компоненти се зареждат правилно
    console.log('📋 Проверявам компонентите...');
    const componentCheck = await page.evaluate(() => {
      const components = {
        header: !!document.querySelector('header'),
        hero: !!document.querySelector('#home'),
        services: !!document.querySelector('#services'),
        booking: !!document.querySelector('#booking'),
        contact: !!document.querySelector('#contact'),
        footer: !!document.querySelector('footer'),
        bookingForm: !!document.querySelector('#booking form'),
        dateInput: !!document.querySelector('input[type="date"]'),
        timeSelect: !!document.querySelector('select[name="time"]'),
        serviceSelect: !!document.querySelector('select[name="service"]')
      };
      
      return components;
    });
    
    console.log('📋 Компоненти:');
    Object.entries(componentCheck).forEach(([component, exists]) => {
      console.log(`  - ${component}: ${exists ? '✅' : '❌'}`);
    });
    
    console.log('\n🎉 Тестът за hydration fix завърши!');
    
  } catch (error) {
    console.error('❌ Грешка при тестване:', error);
  } finally {
    await browser.close();
  }
}

testHydrationFix(); 