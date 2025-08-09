const puppeteer = require('puppeteer');

async function testHomepage() {
  console.log('🏠 Тест за главната страница...');
  
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
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    // 1. Навигирай към главната страница
    console.log('📋 Отивам на главната страница...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // 2. Провери дали страницата се зареди успешно
    const pageTitle = await page.title();
    console.log('📋 Заглавие на страницата:', pageTitle);
    
    // 3. Провери дали има hydration errors в конзолата
    console.log('📋 Проверявам за hydration errors...');
    const hydrationErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        errors.push({ type: 'error', message: args.join(' ') });
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        errors.push({ type: 'warning', message: args.join(' ') });
        originalWarn.apply(console, args);
      };
      
      // Trigger a page reload to catch hydration errors
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return errors;
    });
    
    // 4. Провери дали всички основни секции са заредени
    console.log('📋 Проверявам основните секции...');
    const sections = await page.evaluate(() => {
      const sections = {
        header: !!document.querySelector('header'),
        hero: !!document.querySelector('#home'),
        services: !!document.querySelector('#services'),
        booking: !!document.querySelector('#booking'),
        contact: !!document.querySelector('#contact'),
        footer: !!document.querySelector('footer')
      };
      
      return sections;
    });
    
    console.log('📋 Намерени секции:');
    Object.entries(sections).forEach(([section, exists]) => {
      console.log(`  - ${section}: ${exists ? '✅' : '❌'}`);
    });
    
    // 5. Провери дали има JavaScript errors
    console.log('📋 Проверявам за JavaScript errors...');
    const jsErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };
      
      // Try to interact with some elements to trigger any potential errors
      try {
        const bookingForm = document.querySelector('#booking form');
        if (bookingForm) {
          const inputs = bookingForm.querySelectorAll('input, select, textarea');
          console.log(`Found ${inputs.length} form inputs`);
        }
        
        const serviceCards = document.querySelectorAll('[data-service]');
        console.log(`Found ${serviceCards.length} service cards`);
        
        const contactLinks = document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]');
        console.log(`Found ${contactLinks.length} contact links`);
      } catch (error) {
        errors.push(error.message);
      }
      
      return errors;
    });
    
    if (jsErrors.length > 0) {
      console.log('❌ JavaScript errors found:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('✅ Няма JavaScript errors');
    }
    
    // 6. Провери дали има проблеми с датата в booking формата
    console.log('📋 Проверявам booking формата...');
    const bookingFormCheck = await page.evaluate(() => {
      const dateInput = document.querySelector('input[type="date"]');
      if (dateInput) {
        const minDate = dateInput.getAttribute('min');
        const currentDate = new Date().toISOString().split('T')[0];
        return {
          hasDateInput: true,
          minDate,
          currentDate,
          isHydrationError: minDate !== currentDate
        };
      }
      return { hasDateInput: false };
    });
    
    if (bookingFormCheck.hasDateInput) {
      console.log('📋 Date input информация:');
      console.log(`  - Min date: ${bookingFormCheck.minDate}`);
      console.log(`  - Current date: ${bookingFormCheck.currentDate}`);
      console.log(`  - Hydration error: ${bookingFormCheck.isHydrationError ? '❌' : '✅'}`);
    }
    
    // 7. Провери дали всички изображения се зареждат
    console.log('📋 Проверявам изображенията...');
    const imageCheck = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const brokenImages = [];
      
      images.forEach((img, index) => {
        if (!img.complete || img.naturalWidth === 0) {
          brokenImages.push({
            index,
            src: img.src,
            alt: img.alt
          });
        }
      });
      
      return {
        totalImages: images.length,
        brokenImages
      };
    });
    
    console.log(`📋 Изображения: ${imageCheck.totalImages} общо, ${imageCheck.brokenImages.length} счупени`);
    if (imageCheck.brokenImages.length > 0) {
      console.log('❌ Счупени изображения:');
      imageCheck.brokenImages.forEach(img => {
        console.log(`  - ${img.src} (${img.alt})`);
      });
    }
    
    // 8. Провери дали всички линкове работят
    console.log('📋 Проверявам линковете...');
    const linkCheck = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href]');
      const internalLinks = [];
      const externalLinks = [];
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href.startsWith('/') || href.startsWith('#')) {
          internalLinks.push(href);
        } else if (href.startsWith('http')) {
          externalLinks.push(href);
        }
      });
      
      return {
        totalLinks: links.length,
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length
      };
    });
    
    console.log(`📋 Линкове: ${linkCheck.totalLinks} общо (${linkCheck.internalLinks} вътрешни, ${linkCheck.externalLinks} външни)`);
    
    // 9. Провери дали има проблеми с CSS
    console.log('📋 Проверявам CSS...');
    const cssCheck = await page.evaluate(() => {
      const styles = document.querySelectorAll('link[rel="stylesheet"]');
      const inlineStyles = document.querySelectorAll('[style]');
      
      return {
        stylesheets: styles.length,
        inlineStyles: inlineStyles.length
      };
    });
    
    console.log(`📋 CSS: ${cssCheck.stylesheets} stylesheets, ${cssCheck.inlineStyles} inline styles`);
    
    // 10. Провери дали има проблеми с responsive design
    console.log('📋 Проверявам responsive design...');
    const viewportCheck = await page.evaluate(() => {
      return {
        viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
        width: window.innerWidth,
        height: window.innerHeight
      };
    });
    
    console.log(`📋 Viewport: ${viewportCheck.viewport}`);
    console.log(`📋 Window size: ${viewportCheck.width}x${viewportCheck.height}`);
    
    console.log('\n🎉 Тестът за главната страница завърши!');
    
  } catch (error) {
    console.error('❌ Грешка при тестване на главната страница:', error);
  } finally {
    await browser.close();
  }
}

testHomepage(); 