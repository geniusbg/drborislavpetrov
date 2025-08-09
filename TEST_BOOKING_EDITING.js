const puppeteer = require('puppeteer')

async function testBookingEditing() {
  console.log('🧪 Стартиране на QA тест за редактиране на резервации...')
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })
  
  const page = await browser.newPage()
  
  try {
    // 1. Отиди на admin страницата
    console.log('📱 Отивам на admin страницата...')
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' })
    
    // 2. Изчакай да се зареди login формата
    await page.waitForSelector('input[name="username"]', { timeout: 10000 })
    console.log('📝 Login формата се зареди')
    
    // 3. Логни се
    console.log('🔐 Логвам се...')
    await page.type('input[name="username"]', 'admin')
    await page.type('input[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // 4. Изчакай да се зареди admin страницата
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    console.log('✅ Успешно логване')
    
    // 5. Изчакай да се заредят резервациите
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 6. Провери дали има резервации
    const bookingCards = await page.$$('.bg-gray-50')
    console.log(`📊 Намерени ${bookingCards.length} резервации`)
    
    if (bookingCards.length === 0) {
      console.log('⚠️ Няма резервации за редактиране. Създавам нова резервация...')
      
      // Създай нова резервация
      await page.click('button:has-text("Добави резервация")')
      await page.waitForSelector('form', { timeout: 5000 })
      
      // Попълни формата
      await page.type('input[name="name"]', 'Test Booking for Edit')
      await page.type('input[name="phone"]', `+359888${Date.now()}`)
      await page.type('input[name="email"]', 'test@edit.com')
      
      // Избери услуга
      await page.select('select[name="service"]', '1')
      
      // Задай дата (утре)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      await page.type('input[name="date"]', tomorrowStr)
      
      // Задай час
      await page.type('input[name="time"]', '14:00')
      
      // Запази резервацията
      await page.click('button[type="submit"]')
      
      // Изчакай да се зареди отново
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // 7. Намери първата резервация и кликни редактирай само в нея
    // bookingCards вече е дефинирана по-горе, използвай я тук
    if (bookingCards.length === 0) {
      console.log('❌ Няма резервации за редактиране')
      return
    }
    const firstBooking = bookingCards[0]
    const editButton = await firstBooking.$('button[title="Редактирай"]')
    if (editButton) {
      console.log('✏️ Кликвам на бутона за редактиране в първата резервация...')
      await page.evaluate(el => el.click(), editButton)
    } else {
      console.log('❌ Не е намерен бутон за редактиране в първата резервация')
      return
    }
    
    // 8. Изчакай да се отвори модала за редактиране
    await page.waitForSelector('form', { timeout: 5000 })
    console.log('✅ Модалът за редактиране се отвори')
    
    // 9. Провери дали полетата са попълнени
    const nameValue = await page.$eval('input[name="name"]', el => el.value)
    console.log(`📝 Име в формата: ${nameValue}`)
    
    // 10. Промени името
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="name"]')
      if (nameInput) {
        nameInput.value = 'Updated Test Booking'
        nameInput.dispatchEvent(new Event('input', { bubbles: true }))
        nameInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    console.log('✏️ Променено име на резервацията')
    
    // 11. Промени часа
    await page.evaluate(() => {
      const timeInput = document.querySelector('input[name="time"]')
      if (timeInput) {
        timeInput.value = '15:00'
        timeInput.dispatchEvent(new Event('input', { bubbles: true }))
        timeInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    console.log('🕐 Променен час на резервацията')
    
    // 11.5. Промени статуса
    await page.evaluate(() => {
      const statusSelect = document.querySelector('select[name="status"]')
      if (statusSelect) {
        statusSelect.value = 'confirmed'
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })
    console.log('✅ Променен статус на резервацията')
    
    // 12. Запази промените
    console.log('💾 Запазване на промените...')
    
    // Debug: Check what buttons are available in the modal
    const modalButtons = await page.$$('form button')
    console.log(`🔍 Debug: Found ${modalButtons.length} buttons in form`)
    
    for (let i = 0; i < modalButtons.length; i++) {
      try {
        const buttonText = await modalButtons[i].$eval('button', el => el.textContent)
        const buttonType = await modalButtons[i].$eval('button', el => el.type)
        console.log(`🔍 Debug: Modal button ${i + 1}: text="${buttonText}", type="${buttonType}"`)
      } catch (error) {
        console.log(`🔍 Debug: Could not read modal button ${i + 1}`)
      }
    }
    
    // Try different selectors for submit button
    const submitButton = await page.$('button[type="submit"]') || 
                        await page.$('button:has-text("Запази")') ||
                        await page.$('button:has-text("Save")') ||
                        await page.$('button:has-text("Submit")')
    
    if (submitButton) {
      console.log('🔍 Debug: Found submit button, clicking...')
      await submitButton.click()
    } else {
      console.log('❌ Could not find submit button')
      return
    }
    
    // 13. Изчакай да се затвори модала
    console.log('🔍 Debug: Waiting for modal to close...')
    try {
      await page.waitForFunction(() => {
        const modal = document.querySelector('.fixed.inset-0.bg-gray-600')
        return !modal || modal.style.display === 'none'
      }, { timeout: 10000 })
      console.log('✅ Модалът се затвори')
    } catch (error) {
      console.log('❌ Модалът не се затвори в рамките на 10 секунди')
    }
    
    // Изчакай малко повече за да се обновят данните
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 14. Провери дали промените са се запазили
    console.log('🔍 Debug: Checking if changes were saved...')
    
    // Провери всички резервации за обновеното име
    const allBookings = await page.$$('.bg-gray-50')
    console.log(`🔍 Debug: Found ${allBookings.length} booking cards`)
    
    let foundUpdatedBooking = false
    for (let i = 0; i < allBookings.length; i++) {
      try {
        const bookingName = await allBookings[i].$eval('h3', el => el.textContent)
        console.log(`🔍 Debug: Booking ${i + 1} name: ${bookingName}`)
        
        if (bookingName.includes('Updated Test Booking')) {
          console.log(`✅ Found updated booking at position ${i + 1}`)
          foundUpdatedBooking = true
          break
        }
      } catch (error) {
        console.log(`🔍 Debug: Could not read booking ${i + 1} name`)
      }
    }
    
    if (foundUpdatedBooking) {
      console.log('🎉 УСПЕХ: Редактирането на резервации работи правилно!')
    } else {
      console.log('❌ ГРЕШКА: Промените не са се запазили')
      console.log('🔍 Debug: Expected to find "Updated Test Booking" but it was not found in any booking')
    }
    
  } catch (error) {
    console.error('❌ ГРЕШКА при тестване:', error.message)
    
    // Направи screenshot при грешка
    await page.screenshot({ path: 'booking-editing-error.png' })
    console.log('📸 Screenshot запазен като booking-editing-error.png')
  } finally {
    await browser.close()
    console.log('🔚 Тестът приключи')
  }
}

// Стартирай теста
testBookingEditing().catch(console.error) 