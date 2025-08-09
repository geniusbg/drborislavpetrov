// 🧪 Тест за network requests
const puppeteer = require('puppeteer');

async function testNetwork() {
  console.log('🎯 Тестване на network requests...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  
  // Listen to network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/admin/bookings')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    }
  });
  
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('/api/admin/bookings')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    }
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
    
    // 2. Отиди в резервации
    console.log('📋 Отивам в резервации...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const bookingBtn = buttons.find(btn => btn.textContent.trim() === 'Резервации');
      if (bookingBtn) bookingBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // 3. Отвори модал за резервация
    console.log('📋 Отварям модал за резервация...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBookingBtn = buttons.find(btn => btn.textContent.trim() === 'Добави резервация');
      if (addBookingBtn) addBookingBtn.click();
    });
    await (page.waitForTimeout ? page.waitForTimeout(1000) : new Promise(resolve => setTimeout(resolve, 1000)));
    
    // 4. Попълни формата
    console.log('📋 Попълвам формата...');
    await page.type('input[type="text"]', 'Network Test Patient');
    await page.type('input[type="tel"]', `+359888${Date.now()}`);
    await page.type('input[type="email"]', 'network@test.com');
    await page.select('select', '1');
    await page.type('input[type="date"]', '2024-12-31');
    await page.type('input[type="time"]', '15:00');
    
    // 5. Кликни Запази
    console.log('📋 Кликам Запази...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find(btn => btn.textContent.trim() === 'Запази');
      if (saveBtn) saveBtn.click();
    });
    
    // 6. Изчакай за network requests
    await (page.waitForTimeout ? page.waitForTimeout(3000) : new Promise(resolve => setTimeout(resolve, 3000)));
    
    // 7. Провери requests
    console.log('\n📋 Network Requests:');
    requests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
      console.log(`   Headers:`, req.headers);
    });
    
    console.log('\n📋 Network Responses:');
    responses.forEach((res, i) => {
      console.log(`${i + 1}. ${res.status} ${res.url}`);
      console.log(`   Headers:`, res.headers);
    });
    
    // 8. Провери дали резервацията се появи
    const bookingInList = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => el.textContent.includes('Network Test Patient'));
    });
    
    if (bookingInList) {
      console.log('✅ Резервацията се появи в списъка');
    } else {
      console.log('❌ Резервацията не се появи в списъка');
    }
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testNetwork(); 