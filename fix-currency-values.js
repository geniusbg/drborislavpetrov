const { Client } = require('pg');

async function fixCurrencyValues() {
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

    console.log('🔧 Попълване на липсващите стойности...');
    
    // Попълване на priceBgn и priceEur за всички услуги
    const updateResult = await client.query(`
      UPDATE services 
      SET 
        "priceBgn" = price,
        "priceEur" = ROUND((price / 1.95583)::DECIMAL(10,2), 2)
      WHERE "priceBgn" IS NULL OR "priceEur" IS NULL;
    `);
    console.log(`✅ Обновени ${updateResult.rowCount} услуги`);

    // Проверка на резултата
    const checkResult = await client.query('SELECT name, price, "priceCurrency", "priceBgn", "priceEur" FROM services ORDER BY name');
    console.log('\n📋 Всички услуги след обновяването:');
    
    checkResult.rows.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   Оригинална цена: ${service.price} лв.`);
      console.log(`   Валута: ${service.priceCurrency}`);
      console.log(`   Цена в лева: ${service.priceBgn} лв.`);
      console.log(`   Цена в евро: ${service.priceEur} €`);
      console.log('');
    });

    console.log('🎉 Поправянето завърши успешно!');
    
  } catch (error) {
    console.error('❌ Грешка при поправянето:', error);
  } finally {
    await client.end();
    console.log('🔌 Връзката е затворена');
  }
}

fixCurrencyValues();
