const { Client } = require('pg');

async function runProductionMigration() {
  const client = new Client({
    host: '66.29.142.10', // Production host
    port: 5432,
    database: 'drborislavpetrov',
    user: 'drborislavpetrov',
    password: 'Xander123)(*'
  });

  try {
    console.log('🔌 Свързване с production базата данни...');
    await client.connect();
    console.log('✅ Свързани успешно с production!');

    console.log('📝 Изпълняване на SQL миграцията за production...');
    
    // Добавяне на новите колони
    await client.query(`
      ALTER TABLE services 
      ADD COLUMN IF NOT EXISTS "priceCurrency" VARCHAR(3) DEFAULT 'BGN',
      ADD COLUMN IF NOT EXISTS "priceBgn" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "priceEur" DECIMAL(10,2);
    `);
    console.log('✅ Добавени нови колони в production');

    // Обновяване на съществуващите услуги
    const updateResult = await client.query(`
      UPDATE services 
      SET 
        "priceCurrency" = 'BGN',
        "priceBgn" = price,
        "priceEur" = ROUND((price / 1.95583)::DECIMAL(10,2), 2)
      WHERE "priceCurrency" IS NULL;
    `);
    console.log(`✅ Обновени ${updateResult.rowCount} услуги в production`);

    // Проверка на резултата
    const checkResult = await client.query('SELECT COUNT(*) as total, COUNT("priceCurrency") as with_currency FROM services');
    console.log(`📊 Общо услуги в production: ${checkResult.rows[0].total}`);
    console.log(`📊 С валута в production: ${checkResult.rows[0].with_currency}`);

    // Примерна услуга от production
    const sampleService = await client.query('SELECT name, price, "priceCurrency", "priceBgn", "priceEur" FROM services LIMIT 1');
    if (sampleService.rows[0]) {
      const service = sampleService.rows[0];
      console.log(`📋 Примерна услуга от production: ${service.name}`);
      console.log(`   Оригинална цена: ${service.price} лв.`);
      console.log(`   Валута: ${service.priceCurrency}`);
      console.log(`   Цена в лева: ${service.priceBgn} лв.`);
      console.log(`   Цена в евро: ${service.priceEur} €`);
    }

    console.log('🎉 Production миграцията завърши успешно!');
    
  } catch (error) {
    console.error('❌ Грешка при production миграцията:', error);
  } finally {
    await client.end();
    console.log('🔌 Production връзката е затворена');
  }
}

runProductionMigration();
