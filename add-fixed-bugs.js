const http = require('http');

// Всички bugs които поправихме и не са в tracker-а
const fixedBugs = [
  {
    title: "Промяна на статус показва грешка 'часът вече е зает'",
    description: "Когато се редактира резервация и се променя само статуса, системата показваше грешка за конфликт на времето. Проблемът беше че се извикваше основния API endpoint с проверка за конфликти вместо специализиран endpoint за статус.",
    severity: "high",
    category: "booking",
    priority: "high",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори формата за редактиране на резервация",
      "Промени статуса от pending на confirmed",
      "Запази промяната"
    ],
    expected_behavior: "Статусът се променя успешно без грешки",
    actual_behavior: "Системата показваше грешка за конфликт",
    browser: "Chrome",
    device: "Desktop",
    tags: ["booking", "status", "conflict", "resolved"]
  },
  {
    title: "Работно време показва вчерашната дата",
    description: "Когато се отваряше формата за работно време, показваше се вчерашната дата вместо днешната. Проблемът беше в isSunday функцията която използваше локално време вместо българско.",
    severity: "medium",
    category: "working-hours",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори формата за работно време",
      "Провери датата която се показва"
    ],
    expected_behavior: "Показва се днешната дата",
    actual_behavior: "Показваше се вчерашната дата",
    browser: "Chrome",
    device: "Desktop",
    tags: ["working-hours", "date", "timezone", "resolved"]
  },
  {
    title: "Runtime Error: Cannot read properties of undefined (reading 'toLowerCase')",
    description: "В page.tsx имаше грешка при филтриране на резервации когато някои полета са undefined. Проблемът беше липса на null checks преди извикване на toLowerCase().",
    severity: "medium",
    category: "ui",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори админ панела",
      "Опитай да филтрираш резервации"
    ],
    expected_behavior: "Филтрирането работи без грешки",
    actual_behavior: "Получаваше се runtime error",
    browser: "Chrome",
    device: "Desktop",
    tags: ["ui", "filter", "runtime-error", "resolved"]
  },
  {
    title: "Bug Tracker API POST заявки дават 500 грешка",
    description: "POST заявките към bug tracker API-то даваха 500 Internal Server Error. Проблемът беше connection leak и липса на proper error handling.",
    severity: "high",
    category: "database",
    priority: "high",
    reporter: "admin",
    steps_to_reproduce: [
      "Опитай да добавиш bug през скрипт",
      "Опитай curl POST заявка"
    ],
    expected_behavior: "Bug се добавя успешно",
    actual_behavior: "Получаваше се 500 грешка",
    browser: "N/A",
    device: "Server",
    tags: ["api", "database", "connection", "resolved"]
  },
  {
    title: "Calendar '+' button позициониране",
    description: "Кнопката '+' в календара се припокриваше с номера на датата. Проблемът беше в CSS позиционирането.",
    severity: "medium",
    category: "ui",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори календара",
      "Провери позицията на '+' кнопката"
    ],
    expected_behavior: "Кнопката не се припокрива с номера",
    actual_behavior: "Кнопката се припокриваше с номера",
    browser: "Chrome",
    device: "Desktop",
    tags: ["calendar", "ui", "positioning", "resolved"]
  },
  {
    title: "Escape key не работи за всички модали",
    description: "Escape клавишът не работеше за всички pop-up прозорци/модали. Проблемът беше в event handling-а.",
    severity: "medium",
    category: "ui",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори някой модал",
      "Натисни Escape"
    ],
    expected_behavior: "Модалът се затваря",
    actual_behavior: "Модалът не се затваряше",
    browser: "Chrome",
    device: "Desktop",
    tags: ["keyboard", "modal", "escape", "resolved"]
  },
  {
    title: "Calendar дата кликване показва грешна дата",
    description: "Когато се кликва на дата в календара, се highlight-ваше грешната дата (например клик на 14-ти highlight-ва 13-ти).",
    severity: "medium",
    category: "ui",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори календара",
      "Кликни на дата"
    ],
    expected_behavior: "Highlight-ва се правилната дата",
    actual_behavior: "Highlight-ваше се грешната дата",
    browser: "Chrome",
    device: "Desktop",
    tags: ["calendar", "click", "highlight", "resolved"]
  },
  {
    title: "Timeline не показва правилна продължителност на услугите",
    description: "Timeline-ът не показваше правилно продължителността на услугите. Проблемът беше в изчисляването на времето.",
    severity: "medium",
    category: "functionality",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори Daily Schedule",
      "Провери timeline-а"
    ],
    expected_behavior: "Показва се правилната продължителност",
    actual_behavior: "Показваше се грешна продължителност",
    browser: "Chrome",
    device: "Desktop",
    tags: ["timeline", "duration", "services", "resolved"]
  },
  {
    title: "Calendar marker показва грешна текуща дата",
    description: "Calendar marker-ът показваше грешна текуща дата. Проблемът беше в timezone handling-а.",
    severity: "medium",
    category: "ui",
    priority: "medium",
    reporter: "admin",
    steps_to_reproduce: [
      "Отвори календара",
      "Провери текущата дата marker"
    ],
    expected_behavior: "Показва се правилната текуща дата",
    actual_behavior: "Показваше се грешна текуща дата",
    browser: "Chrome",
    device: "Desktop",
    tags: ["calendar", "current-date", "timezone", "resolved"]
  },
  {
    title: "Всички часове не са синхронизирани с българско време",
    description: "Часовете и времето в различните части на приложението не бяха синхронизирани с българското време.",
    severity: "high",
    category: "functionality",
    priority: "high",
    reporter: "admin",
    steps_to_reproduce: [
      "Провери часовете в различните секции",
      "Сравни с българското време"
    ],
    expected_behavior: "Всички часове показват българско време",
    actual_behavior: "Часовете показваха локално време",
    browser: "Chrome",
    device: "Desktop",
    tags: ["time", "timezone", "bulgaria", "resolved"]
  }
];

async function addFixedBugs() {
  console.log('🐛 Adding fixed bugs to tracker...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const bug of fixedBugs) {
    try {
      console.log(`📝 Adding: ${bug.title}`);
      
      const postData = JSON.stringify(bug);
      
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/bugs',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-token',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ Success: ${bug.title}`);
            successCount++;
          } else {
            console.log(`❌ Failed: ${bug.title} - ${data}`);
            errorCount++;
          }
        });
      });
      
      req.on('error', (e) => {
        console.error(`❌ Error: ${bug.title} - ${e.message}`);
        errorCount++;
      });
      
      req.write(postData);
      req.end();
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error adding bug: ${bug.title}`, error);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successCount} bugs`);
  console.log(`❌ Failed to add: ${errorCount} bugs`);
  console.log(`📝 Total processed: ${fixedBugs.length} bugs`);
}

addFixedBugs(); 