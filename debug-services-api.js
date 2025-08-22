const { Client } = require('pg');

async function debugServicesAPI() {
  const client = new Client({
    host: '192.168.1.134',
    port: 5432,
    database: 'drborislavpetrov',
    user: 'drborislavpetrov',
    password: 'Xander123)(*'
  });

  try {
    console.log('🔌 Свързване с базата данни...');
    await client.connect();
    console.log('✅ Свързани успешно!');

    console.log('📋 Проверка на всички услуги от базата данни...');
    
    const servicesResult = await client.query('SELECT * FROM services ORDER BY name');
    
    console.log(`\n📊 Общо услуги: ${servicesResult.rows.length}`);
    
    servicesResult.rows.forEach((service, index) => {
      console.log(`\n${index + 1}. ${service.name}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Оригинална цена: ${service.price} лв.`);
      console.log(`   Валута: ${service.priceCurrency}`);
      console.log(`   Цена в лева: ${service.priceBgn} лв.`);
      console.log(`   Цена в евро: ${service.priceEur} €`);
      console.log(`   Активна: ${service.isactive}`);
      
      // Проверка за null стойности
      if (service.priceBgn === null || service.priceEur === null) {
        console.log('   ⚠️  ВНИМАНИЕ: Липсват стойности за двойните цени!');
      }
    });

    // Проверка на GET заявката (какво се връща от API)
    console.log('\n🧪 Тестване на GET заявката (какво се връща от API)...');
    try {
      const getResult = await client.query('SELECT id, name, price, "priceCurrency", "priceBgn", "priceEur", isactive FROM services ORDER BY name');
      console.log('✅ GET заявката работи');
      console.log('📋 Данни, които се връщат от API:');
      
      getResult.rows.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name}: ${service.price} лв. / ${service.priceBgn} лв. / ${service.priceEur} €`);
      });
      
    } catch (error) {
      console.error('❌ Грешка в GET заявката:', error.message);
    }

  } catch (error) {
    console.error('❌ Грешка при дебъгването:', error);
  } finally {
    await client.end();
    console.log('🔌 Връзката е затворена');
  }
}

debugServicesAPI();
