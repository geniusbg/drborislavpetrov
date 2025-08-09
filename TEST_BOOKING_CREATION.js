const puppeteer = require('puppeteer')

async function testBookingCreation() {
  console.log('🚀 Starting booking creation test...')
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  })
  
  try {
    const page = await browser.newPage()
    
    // 1. Go to admin page
    console.log('📱 Navigating to admin page...')
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' })
    
    // 2. Login
    console.log('🔐 Logging in...')
    await page.click('button[type="submit"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    
    // 3. Go to bookings tab
    console.log('📋 Going to bookings tab...')
    await page.click('button[data-tab="bookings"]')
    await page.waitForTimeout(2000)
    
    // 4. Click "Add Booking" button
    console.log('➕ Clicking Add Booking button...')
    await page.click('button:has-text("Добави резервация")')
    await page.waitForTimeout(2000)
    
    // 5. Fill the booking form
    console.log('📝 Filling booking form...')
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[name="name"]')
      if (nameInput) nameInput.value = 'Тест Пациент'
      
      const emailInput = document.querySelector('input[name="email"]')
      if (emailInput) emailInput.value = 'test@example.com'
      
          const phoneInput = document.querySelector('input[name="phone"]')
    if (phoneInput) phoneInput.value = `+359888${Date.now()}`
      
      const serviceSelect = document.querySelector('select[name="service"]')
      if (serviceSelect) {
        serviceSelect.value = '1'
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
      
      const dateInput = document.querySelector('input[name="date"]')
      if (dateInput) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        dateInput.value = tomorrow.toISOString().split('T')[0]
      }
      
      const timeInput = document.querySelector('input[name="time"]')
      if (timeInput) timeInput.value = '10:00'
    })
    
    console.log('✅ Form filled successfully')
    
    // 6. Submit the form
    console.log('💾 Submitting form...')
    await page.click('button[type="submit"]')
    
    // 7. Wait for response
    await page.waitForTimeout(3000)
    
    // 8. Check if booking was created
    console.log('🔍 Checking if booking was created...')
    const bookingCards = await page.$$('.bg-gray-50')
    const foundBooking = await page.evaluate(() => {
      const cards = document.querySelectorAll('.bg-gray-50')
      for (let card of cards) {
        const name = card.querySelector('h3')
        if (name && name.textContent.includes('Тест Пациент')) {
          return true
        }
      }
      return false
    })
    
    if (foundBooking) {
      console.log('✅ Booking created successfully!')
    } else {
      console.log('❌ Booking was not created')
    }
    
    // 9. Check for errors in console
    const logs = await page.evaluate(() => {
      return window.consoleLogs || []
    })
    
    if (logs.length > 0) {
      console.log('📋 Console logs:')
      logs.forEach(log => console.log(log))
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
    console.log('🏁 Test completed')
  }
}

// Add console log capture
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

testBookingCreation() 