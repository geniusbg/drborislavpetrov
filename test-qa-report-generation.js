const fs = require('fs');

console.log('🧪 Тестване на генерирането на QA отчет...');

try {
  // Симулираме QA Dashboard класа
  const testFiles = {
    'QA_AUTOMATED_TEST.js': 'Автоматизирани тестове (Puppeteer)',
    'TEST_HOMEPAGE.js': 'Тест на начална страница',
    'TEST_BOOKINGS.js': 'Тест на резервации',
    'TEST_CALENDAR.js': 'Тест на календар',
    'TEST_USERS.js': 'Тест на потребители',
    'TEST_SERVICE_EDITING.js': 'Тест на редактиране услуги',
    'TEST_API.js': 'Тест на API endpoints',
    'TEST_FORM_VALIDATION.js': 'Тест на валидация на форми',
    'TEST_BUTTONS.js': 'Тест на бутони и UI',
    'TEST_NETWORK.js': 'Тест на мрежови заявки',
    'TEST_LOCALSTORAGE.js': 'Тест на localStorage',
    'TEST_AUTO_REFRESH.js': 'Тест на автоматично обновяване',
    'TEST_HYDRATION_FIX.js': 'Тест на hydration',
    'TEST_CALENDAR_BOOKINGS.js': 'Тест на календар резервации',
    'TEST_BOOKING_CREATION.js': 'Тест на създаване резервации',
    'TEST_BOOKING_EDITING.js': 'Тест на редактиране резервации',
    'TEST_USERS_API.js': 'Тест на потребители API',
    'TEST_USERS_MODAL_CLOSE.js': 'Тест на модали потребители',
    'TEST_API_SERVICES.js': 'Тест на услуги API'
  };

  const qaGuides = {
    'QA_CHECKLIST.md': 'QA Checklist - Ръчно тестване',
    'QA_TEAM_GUIDE.md': 'QA Team Guide - Ръководство за екипа',
    'QA_TEST_SCRIPT.md': 'QA Test Script - Скрипт за тестване',
    'MANUAL_QA_TEST.md': 'Manual QA Test - Ръчно тестване',
    'QA_TESTS_BOOKING_STATUS.md': 'QA Tests Booking Status - Статус резервации'
  };

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

  // Проверяваме QA ръководствата
  for (const [file, description] of Object.entries(qaGuides)) {
    const exists = fs.existsSync(file);
    report.qaGuides[file] = {
      description,
      exists,
      size: exists ? fs.statSync(file).size : 0
    };
    report.summary.totalGuides++;
    if (exists) report.summary.availableGuides++;
  }

  // Записваме отчета
  fs.writeFileSync('qa_report.json', JSON.stringify(report, null, 2));
  
  console.log('✅ QA отчетът е генериран успешно!');
  console.log(`📊 Статистика:`);
  console.log(`   - Тестове: ${report.summary.availableTests}/${report.summary.totalTests}`);
  console.log(`   - Ръководства: ${report.summary.availableGuides}/${report.summary.totalGuides}`);
  
  // Проверяваме дали файлът е създаден
  if (fs.existsSync('qa_report.json')) {
    const reportContent = JSON.parse(fs.readFileSync('qa_report.json', 'utf8'));
    console.log('✅ Файлът qa_report.json е създаден успешно');
    console.log(`📅 Timestamp: ${reportContent.timestamp}`);
  } else {
    console.log('❌ Файлът qa_report.json не е създаден');
  }
  
} catch (error) {
  console.error('❌ Грешка при генериране на отчет:', error.message);
  console.error('Stack trace:', error.stack);
} 