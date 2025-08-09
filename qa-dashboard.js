// 🧪 QA Dashboard - Управление на тестове
// Виртуален QA екип - табло за управление

const fs = require('fs');
const path = require('path');

class QADashboard {
  constructor() {
    this.testFiles = {
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
    
    this.qaGuides = {
      'QA_CHECKLIST.md': 'QA Checklist - Ръчно тестване',
      'QA_TEAM_GUIDE.md': 'QA Team Guide - Ръководство за екипа',
      'QA_TEST_SCRIPT.md': 'QA Test Script - Скрипт за тестване',
      'MANUAL_QA_TEST.md': 'Manual QA Test - Ръчно тестване',
      'QA_TESTS_BOOKING_STATUS.md': 'QA Tests Booking Status - Статус резервации'
    };
  }

  showMainMenu() {
    console.log('\n🧪 === QA DASHBOARD ===');
    console.log('1. 📋 Покажи всички QA тестове');
    console.log('2. 🚀 Стартирай автоматизиран тест');
    console.log('3. 🔧 Стартирай конкретен тест');
    console.log('4. 📊 Покажи QA ръководства');
    console.log('5. 🧹 Изчисти тестови данни');
    console.log('6. 📈 Генерирай QA отчет');
    console.log('7. 🔍 Провери статус на тестове');
    console.log('8. ❌ Излез');
    console.log('========================\n');
  }

  async listAllTests() {
    console.log('\n📋 === ВСИЧКИ QA ТЕСТОВЕ ===\n');
    
    console.log('🤖 АВТОМАТИЗИРАНИ ТЕСТОВЕ:');
    console.log('============================');
    for (const [file, description] of Object.entries(this.testFiles)) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${exists} ${file} - ${description}`);
    }
    
    console.log('\n📚 QA РЪКОВОДСТВА:');
    console.log('==================');
    for (const [file, description] of Object.entries(this.qaGuides)) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${exists} ${file} - ${description}`);
    }
    
    console.log('\n📊 ДРУГИ ТЕСТОВИ ФАЙЛОВЕ:');
    console.log('==========================');
    const otherTestFiles = [
      'test-bug-api.js',
      'test-bug-validation.js',
      'test-bug-post.js',
      'check-duplicates.js',
      'remove-duplicates.js',
      'add-fixed-bugs-safe.js'
    ];
    
    for (const file of otherTestFiles) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${exists} ${file}`);
    }
  }

  async runAutomatedTest() {
    console.log('\n🚀 === СТАРТИРАНЕ НА АВТОМАТИЗИРАН ТЕСТ ===\n');
    
    if (!fs.existsSync('QA_AUTOMATED_TEST.js')) {
      console.log('❌ QA_AUTOMATED_TEST.js не е намерен!');
      return;
    }
    
    console.log('🔍 Проверявам дали server-ът работи...');
    
    try {
      const { exec } = require('child_process');
      
      // Проверяваме дали server-ът работи
      const testServer = new Promise((resolve) => {
        exec('curl -s http://localhost:3000/api/admin/bugs -H "x-admin-token: admin-token"', (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Server-ът не работи! Стартирайте го с: npm run dev');
            resolve(false);
          } else {
            console.log('✅ Server-ът работи!');
            resolve(true);
          }
        });
      });
      
      const serverRunning = await testServer;
      if (!serverRunning) return;
      
      console.log('🚀 Стартирам автоматизирания QA тест...');
      console.log('📝 Това ще отвори браузър и ще изпълни всички тестове...\n');
      
      exec('node QA_AUTOMATED_TEST.js', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Грешка при стартиране на теста:', error.message);
        } else {
          console.log('✅ Тестът завърши успешно!');
          console.log(stdout);
        }
      });
      
    } catch (error) {
      console.log('❌ Грешка:', error.message);
    }
  }

  async runSpecificTest() {
    console.log('\n🔧 === СТАРТИРАНЕ НА КОНКРЕТЕН ТЕСТ ===\n');
    
    console.log('Достъпни тестове:');
    let index = 1;
    for (const [file, description] of Object.entries(this.testFiles)) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${index}. ${exists} ${file} - ${description}`);
      index++;
    }
    
    console.log('\nВъведете номера на теста (или 0 за изход):');
    
    // Тук бихме могли да добавим интерактивен избор
    // За сега ще покажем как да стартирате ръчно
    console.log('\n💡 За да стартирате тест ръчно, използвайте:');
    console.log('   node [име_на_файла]');
    console.log('   Пример: node TEST_HOMEPAGE.js');
  }

  async showQAGuides() {
    console.log('\n📚 === QA РЪКОВОДСТВА ===\n');
    
    for (const [file, description] of Object.entries(this.qaGuides)) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${exists} ${file} - ${description}`);
      
      if (exists === '✅') {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').slice(0, 3); // Първите 3 реда
          console.log(`   📝 ${lines.join(' ')}...`);
        } catch (error) {
          console.log('   ❌ Грешка при четене на файла');
        }
      }
      console.log('');
    }
  }

  async cleanupTestData() {
    console.log('\n🧹 === ИЗЧИСТВАНЕ НА ТЕСТОВИ ДАННИ ===\n');
    
    if (fs.existsSync('CLEANUP_TEST_DATA.js')) {
      console.log('🚀 Стартирам изчистване на тестови данни...');
      
      const { exec } = require('child_process');
      exec('node CLEANUP_TEST_DATA.js', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ Грешка при изчистване:', error.message);
        } else {
          console.log('✅ Тестовите данни са изчистени!');
          console.log(stdout);
        }
      });
    } else {
      console.log('❌ CLEANUP_TEST_DATA.js не е намерен!');
    }
  }

  async generateQAReport() {
    console.log('\n📈 === ГЕНЕРИРАНЕ НА QA ОТЧЕТ ===\n');
    
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
    for (const [file, description] of Object.entries(this.testFiles)) {
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
    for (const [file, description] of Object.entries(this.qaGuides)) {
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
    
    console.log('✅ QA отчетът е генериран: qa_report.json');
    console.log(`📊 Статистика:`);
    console.log(`   - Тестове: ${report.summary.availableTests}/${report.summary.totalTests}`);
    console.log(`   - Ръководства: ${report.summary.availableGuides}/${report.summary.totalGuides}`);
  }

  async checkTestStatus() {
    console.log('\n🔍 === ПРОВЕРКА НА СТАТУС НА ТЕСТОВЕ ===\n');
    
    // Проверяваме дали server-ът работи
    console.log('🔍 Проверявам server статус...');
    
    const { exec } = require('child_process');
    exec('curl -s http://localhost:3000/api/admin/bugs -H "x-admin-token: admin-token"', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Server-ът не работи!');
        console.log('💡 Стартирайте го с: npm run dev');
      } else {
        console.log('✅ Server-ът работи!');
      }
    });
    
    // Проверяваме тестовите файлове
    console.log('\n📋 Статус на тестови файлове:');
    for (const [file, description] of Object.entries(this.testFiles)) {
      const exists = fs.existsSync(file) ? '✅' : '❌';
      console.log(`${exists} ${file}`);
    }
  }

  async start() {
    console.log('🧪 Добре дошли в QA Dashboard!');
    console.log('💡 Изберете опция от менюто по-долу...\n');
    
    this.showMainMenu();
    
    // За демонстрация, ще покажем всички тестове
    console.log('📋 Показвам всички QA тестове...\n');
    await this.listAllTests();
    
    console.log('\n💡 За да стартирате автоматизиран тест, използвайте:');
    console.log('   node QA_AUTOMATED_TEST.js');
    console.log('\n💡 За да стартирате конкретен тест, използвайте:');
    console.log('   node [име_на_тест_файла]');
    console.log('\n💡 За да проверите QA ръководствата, отворете:');
    console.log('   QA_CHECKLIST.md');
  }
}

// Стартираме dashboard-а
const dashboard = new QADashboard();
dashboard.start(); 