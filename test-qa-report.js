const fs = require('fs');

console.log('🧪 Тестване на генерирането на QA отчет...');

try {
  const report = {
    timestamp: new Date().toISOString(),
    testFiles: {},
    qaGuides: {},
    summary: {
      totalTests: 0,
      availableTests: 0,
      totalGuides: 0,
      availableGuides: 0
    }
  };

  // Проверяваме тестовите файлове
  const testFiles = {
    'QA_AUTOMATED_TEST.js': 'Автоматизирани тестове (Puppeteer)',
    'TEST_HOMEPAGE.js': 'Тест на начална страница',
    'TEST_BOOKINGS.js': 'Тест на резервации',
    'TEST_CALENDAR.js': 'Тест на календар'
  };

  for (const [file, description] of Object.entries(testFiles)) {
    const exists = fs.existsSync(file);
    report.testFiles[file] = {
      description,
      exists,
      size: exists ? fs.statSync(file).size : 0
    };
    report.summary.totalTests++;
    if (exists) report.summary.availableTests++;
  }

  // Записваме отчета
  fs.writeFileSync('qa_report.json', JSON.stringify(report, null, 2));
  
  console.log('✅ QA отчетът е генериран успешно!');
  console.log(`📊 Статистика:`);
  console.log(`   - Тестове: ${report.summary.availableTests}/${report.summary.totalTests}`);
  
} catch (error) {
  console.error('❌ Грешка при генериране на отчет:', error.message);
} 