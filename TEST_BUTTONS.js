// 🧪 Тест за бутони в секция услуги
const puppeteer = require('puppeteer');

async function testButtons() {
  console.log('🎯 Тестване на бутони в секция услуги...');
  
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
    
    // 3. Провери всички бутони
    console.log('📋 Проверявам всички бутони...');
    const allButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        hasSvg: !!btn.querySelector('svg'),
        svgClass: btn.querySelector('svg')?.className || ''
      }));
    });
    
    console.log('📋 Намерени бутони:');
    allButtons.forEach((btn, i) => {
      console.log(`${i + 1}. "${btn.text}" - class: "${btn.className}" - hasSvg: ${btn.hasSvg} - svgClass: "${btn.svgClass}"`);
    });
    
    // 4. Провери всички SVG елементи
    console.log('\n📋 Проверявам всички SVG елементи...');
    const allSvgs = await page.evaluate(() => {
      const svgs = Array.from(document.querySelectorAll('svg'));
      return svgs.map(svg => ({
        className: svg.className,
        parentButton: svg.closest('button')?.className || 'no button parent'
      }));
    });
    
    console.log('📋 Намерени SVG елементи:');
    allSvgs.forEach((svg, i) => {
      console.log(`${i + 1}. class: "${svg.className}" - parent button: "${svg.parentButton}"`);
    });
    
    // 5. Провери всички бутони с text-blue-600 клас
    console.log('\n📋 Проверявам бутони с text-blue-600 клас...');
    const blueButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.filter(btn => btn.className.includes('text-blue-600')).map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className,
        hasSvg: !!btn.querySelector('svg')
      }));
    });
    
    console.log('📋 Бутони с text-blue-600:');
    blueButtons.forEach((btn, i) => {
      console.log(`${i + 1}. "${btn.text}" - hasSvg: ${btn.hasSvg}`);
    });
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  } finally {
    await browser.close();
  }
}

testButtons(); 