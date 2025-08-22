const { Client } = require('pg');

async function runMigration() {
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

    console.log('📝 Изпълняване на SQL миграцията...');
    
    // Добавяне на новите колони
    await client.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS "priceCurrency" VARCHAR(3) DEFAULT 'BGN',
      ADD COLUMN IF NOT EXISTS "priceBgn" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "priceEur" DECIMAL(10,2);
    `);
    console.log('✅ Добавени нови колони');

    // Обновяване на съществуващите услуги
    const updateResult = await client.query(`
      UPDATE services 
      SET 
        "priceCurrency" = 'BGN',
        "priceBgn" = price,
        "priceEur" = ROUND((price / 1.95583)::DECIMAL(10,2), 2)
      WHERE "priceCurrency" IS NULL;
    `);
    console.log(`✅ Обновени ${updateResult.rowCount} услуги`);

    // Проверка на резултата
    const checkResult = await client.query('SELECT COUNT(*) as total, COUNT("priceCurrency") as with_currency FROM services');
    console.log(`📊 Общо услуги: ${checkResult.rows[0].total}`);
    console.log(`📊 С валута: ${checkResult.rows[0].with_currency}`);

    // Примерна услуга
    const sampleService = await client.query('SELECT name, price, "priceCurrency", "priceBgn", "priceEur" FROM services LIMIT 1');
    if (sampleService.rows[0]) {
      const service = sampleService.rows[0];
      console.log(`📋 Примерна услуга: ${service.name}`);
      console.log(`   Оригинална цена: ${service.price} лв.`);
      console.log(`   Валута: ${service.priceCurrency}`);
      console.log(`   Цена в лева: ${service.priceBgn} лв.`);
      console.log(`   Цена в евро: ${service.priceEur} €`);
    }

    console.log('🎉 Миграцията завърши успешно!');
    
  } catch (error) {
    console.error('❌ Грешка при миграцията:', error);
  } finally {
    await client.end();
    console.log('🔌 Връзката е затворена');
  }
}

runMigration();
