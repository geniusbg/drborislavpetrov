// 🧪 Тест за API резервации
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testBookingAPI() {
  console.log('🎯 Тестване на API за резервации...');
  
  try {
    // 1. Тест за създаване на резервация
    console.log('📋 Създавам резервация...');
    
    const bookingData = {
      name: 'Test Patient',
      email: 'test@example.com',
      phone: `+359888${Date.now()}`,
      service: '1',
      date: '2024-12-31',
      time: '14:00',
      message: 'Test booking'
    };
    
    const response = await fetch('http://localhost:3000/api/admin/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'mock-token'
      },
      body: JSON.stringify(bookingData)
    });
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response headers:', response.headers.raw());
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Резервацията се създаде успешно:', result);
    } else {
      const error = await response.text();
      console.log('❌ Грешка при създаване:', error);
    }
    
    // 2. Тест за взимане на резервации
    console.log('\n📋 Взимам резервации...');
    
    const getResponse = await fetch('http://localhost:3000/api/admin/bookings', {
      method: 'GET',
      headers: {
        'x-admin-token': 'mock-token'
      }
    });
    
    console.log('📋 GET Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const bookings = await getResponse.json();
      console.log('✅ Резервациите се заредиха:', bookings.bookings?.length || 0, 'резервации');
    } else {
      const error = await getResponse.text();
      console.log('❌ Грешка при взимане на резервации:', error);
    }
    
  } catch (error) {
    console.error('💥 Грешка:', error.message);
  }
}

testBookingAPI(); 