// 🧪 Тест за localStorage
const puppeteer = require('puppeteer');

async function testLocalStorage() {
  console.log('🎯 Тестване на localStorage...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Отиди в login страницата
    console.log('📋 Отивам в login страницата...');
    await page.goto('http://localhost:3000/admin/login');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 2. Провери localStorage преди login
    const tokenBefore = await page.evaluate(() => {
      return localStorage.getItem('adminToken');
    });
    console.log('📋 Token преди login:', tokenBefore);
    
    // 3. Попълни credentials
    console.log('📋 Попълвам credentials...');
    await page.type('input[name="username"]', 'admin');
    await page.type('input[name="password"]', 'admin123');
    
    // 4. Кликни Login
    console.log('📋 Кликам Login...');
    await page.click('button[type="submit"]');
    await (page.waitForTimeout ? page.waitForTimeout(2000) : new Promise(resolve => setTimeout(resolve, 2000)));
    
    // 5. Провери localStorage след login
    const tokenAfter = await page.evaluate(() => {
      return localStorage.getItem('adminToken');
    });
    console.log('📋 Token след login:', tokenAfter);
    
    if (tokenAfter) {
      console.log('✅ Token се запази в localStorage');
    } else {
      console.log('❌ Token не се запази в localStorage');
    }
    
    // 6. Провери дали сме в admin panel
    const title = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent : null;
    });
    
    console.log('📋 Заглавie:', title);
    
    if (title && title.includes('Админ Панел')) {
      console.log('✅ Admin panel се зарежда успешно');
    } else {
      console.log('❌ Admin panel не се зарежда правилно');
    }
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testLocalStorage(); 