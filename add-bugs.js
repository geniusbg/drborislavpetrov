const bugs = [
  {
    title: "Промяна на статус показва грешка 'часът вече е зает'",
    description: "Когато се редактира резервация и се променя само статуса, системата показва грешка за конфликт на времето. Проблемът е че се извиква основния API endpoint с проверка за конфликти вместо специализиран endpoint за статус.",
    category: "booking",
    severity: "high",
    status: "resolved",
    priority: "high",
    reporter: "admin",
    stepsToReproduce: "Отвори формата за редактиране на резервация, промени статуса от pending на confirmed, запази промяната",
    expectedBehavior: "Статусът се променя успешно без грешки",
    actualBehavior: "Системата показва грешка за конфликт",
    browser: "Chrome",
    device: "Desktop",
    tags: ["booking", "status", "conflict"]
  },
  {
    title: "Работно време показва вчерашната дата",
    description: "Когато се отваря формата за работно време, показва се вчерашната дата вместо днешната. Проблемът е в isSunday функцията която използва локално време вместо българско.",
    category: "working-hours",
    severity: "medium",
    status: "resolved",
    priority: "medium",
    reporter: "admin",
    stepsToReproduce: "Отвори формата за работно време, провери датата която се показва",
    expectedBehavior: "Показва се днешната дата",
    actualBehavior: "Показва се вчерашната дата",
    browser: "Chrome",
    device: "Desktop",
    tags: ["working-hours", "date", "timezone"]
  },
  {
    title: "Runtime Error: Cannot read properties of undefined (reading 'toLowerCase')",
    description: "В page.tsx има грешка при филтриране на резервации когато някои полета са undefined.",
    category: "ui",
    severity: "medium",
    status: "resolved",
    priority: "medium",
    reporter: "admin",
    stepsToReproduce: "Отвори админ панела, опитай да филтрираш резервации",
    expectedBehavior: "Филтрирането работи без грешки",
    actualBehavior: "Получава се runtime error",
    browser: "Chrome",
    device: "Desktop",
    tags: ["ui", "filter", "runtime-error"]
  },
  {
    title: "Автоматичен backup не се стартира",
    description: "Автоматичният backup не се стартира на определеното време.",
    category: "backup",
    severity: "high",
    status: "open",
    priority: "high",
    reporter: "admin",
    stepsToReproduce: "Настрой автоматичен backup, изчакай до определеното време",
    expectedBehavior: "Backup се стартира автоматично",
    actualBehavior: "Backup не се стартира автоматично",
    browser: "N/A",
    device: "Server",
    tags: ["backup", "scheduled-task", "windows"]
  }
];

async function addBugs() {
  for (const bug of bugs) {
    try {
      const response = await fetch('http://localhost:3000/api/admin/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin-token'
        },
        body: JSON.stringify(bug)
      });
      
      if (response.ok) {
        console.log(`✅ Bug added: ${bug.title}`);
      } else {
        console.error(`❌ Failed to add bug: ${bug.title}`);
      }
    } catch (error) {
      console.error(`❌ Error adding bug: ${bug.title}`, error);
    }
  }
}

addBugs(); 