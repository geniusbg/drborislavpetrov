// Dynamic import for fetch
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
  await addBugReports();
})();

async function addBugReports() {
  console.log('🐛 Добавям bug reports за откритите и поправени проблеми...');
  
  const adminToken = 'admin123'; // Това е тестов token, в реалността трябва да е валиден
  
  const bugReports = [
    {
      title: 'Hydration Error: Prop `min` did not match',
      description: 'Сървърът показваше "2025-07-31", а клиентът "2025-08-01" в booking формата. Това причиняваше hydration mismatch error.',
      severity: 'high',
      category: 'ui',
      priority: 'high',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Сървърът и клиентът трябва да показват една и съща дата',
      actualBehavior: 'Сървърът и клиентът показваха различни дати',
      stepsToReproduce: [
        'Отвори главната страница',
        'Отиди в секцията за резервации',
        'Провери датата в date input полето',
        'Виж конзолата за hydration errors'
      ],
      browser: 'Chrome, Firefox, Safari',
      device: 'Desktop, Mobile',
      tags: ['hydration', 'date', 'booking-form', 'critical']
    },
    {
      title: 'CSS не се зарежда - страницата се показва без стилове',
      description: 'След рестартиране на приложението, CSS стиловете не се зареждаха правилно и страницата се показваше без стилове.',
      severity: 'critical',
      category: 'ui',
      priority: 'urgent',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Страницата трябва да се показва с правилните CSS стилове',
      actualBehavior: 'Страницата се показваше без стилове и позициониране',
      stepsToReproduce: [
        'Стартирай приложението',
        'Отвори главната страница',
        'Провери дали CSS се зарежда'
      ],
      browser: 'Всички браузъри',
      device: 'Всички устройства',
      tags: ['css', 'styling', 'critical', 'layout']
    },
    {
      title: 'AM/PM формат все още видим в time inputs',
      description: 'Въпреки че добавихме data-format="24h", AM/PM индикаторът все още се показваше в time input полетата.',
      severity: 'medium',
      category: 'ui',
      priority: 'medium',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Time inputs трябва да показват само 24-часов формат без AM/PM',
      actualBehavior: 'AM/PM индикаторът се показваше в time inputs',
      stepsToReproduce: [
        'Отвори booking формата',
        'Кликни на time input полето',
        'Провери дали се показва AM/PM'
      ],
      browser: 'Chrome, Safari',
      device: 'Desktop',
      tags: ['time-format', '24h', 'am-pm', 'ui']
    },
    {
      title: 'Time input полетата не са избираеми след CSS fix',
      description: 'След поправянето на CSS за скриване на AM/PM, time input полетата станаха неизбираеми.',
      severity: 'high',
      category: 'functionality',
      priority: 'high',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Time input полетата трябва да са избираеми и функционални',
      actualBehavior: 'Time input полетата не са избираеми',
      stepsToReproduce: [
        'Отвори booking формата',
        'Кликни на time input полето',
        'Опитай да избереш час'
      ],
      browser: 'Chrome, Safari',
      device: 'Desktop',
      tags: ['time-input', 'functionality', 'css-conflict']
    },
    {
      title: 'Timeline маркер показва грешна дата (2-ри август вместо 1-ви)',
      description: 'Timeline маркерът показваше 2-ри август вместо 1-ви август, което е грешна дата.',
      severity: 'medium',
      category: 'ui',
      priority: 'medium',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Timeline маркерът трябва да показва правилната дата',
      actualBehavior: 'Timeline маркерът показваше грешна дата',
      stepsToReproduce: [
        'Отиди в Календар секцията',
        'Кликни на днешната дата',
        'Провери timeline маркера'
      ],
      browser: 'Всички браузъри',
      device: 'Desktop',
      tags: ['timeline', 'date', 'calendar', 'timezone']
    },
    {
      title: 'Service editing modal се затваря автоматично след 4 секунди',
      description: 'Модалът за редактиране на услуги се затваряше автоматично след 4 секунди, което пречи на редактирането.',
      severity: 'high',
      category: 'functionality',
      priority: 'high',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Модалът трябва да остане отворен докато потребителят го затвори',
      actualBehavior: 'Модалът се затваряше автоматично след 4 секунди',
      stepsToReproduce: [
        'Отиди в Услуги секцията',
        'Кликни на редактирай услуга',
        'Изчакай 4 секунди',
        'Модалът се затваря автоматично'
      ],
      browser: 'Всички браузъри',
      device: 'Desktop',
      tags: ['modal', 'auto-close', 'service-editing', 'race-condition']
    },
    {
      title: 'User modal се отваря отново след затваряне',
      description: 'След като се затвори user modal-ът, той се отваряше отново автоматично в рамките на минута.',
      severity: 'medium',
      category: 'functionality',
      priority: 'medium',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Модалът трябва да остане затворен след затваряне',
      actualBehavior: 'Модалът се отваряше отново автоматично',
      stepsToReproduce: [
        'Отиди в Потребители секцията',
        'Добави или редактирай потребител',
        'Затвори модала',
        'Изчакай минута',
        'Модалът се отваря отново'
      ],
      browser: 'Всички браузъри',
      device: 'Desktop',
      tags: ['modal', 'auto-open', 'user-management']
    },
    {
      title: 'Timeline click логика не работи правилно',
      description: 'Кликването на timeline не отваряше правилните форми - трябва да отваря "Нова резервация" за празни часове и "Редактирай резервация" за заети часове.',
      severity: 'medium',
      category: 'functionality',
      priority: 'medium',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Клик на празен час трябва да отваря "Нова резервация", клик на зает час трябва да отваря "Редактирай резервация"',
      actualBehavior: 'Timeline click логиката не работеше правилно',
      stepsToReproduce: [
        'Отиди в Календар -> Daily Schedule',
        'Кликни на празен час в timeline',
        'Кликни на зает час в timeline',
        'Провери дали се отварят правилните форми'
      ],
      browser: 'Всички браузъри',
      device: 'Desktop',
      tags: ['timeline', 'booking', 'click-logic', 'calendar']
    },
    {
      title: 'Form inputs изтриват символи при писане',
      description: 'При писане в form inputs, символите се изтриваха веднага след въвеждане.',
      severity: 'high',
      category: 'functionality',
      priority: 'high',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Символите трябва да остават в input полетата при писане',
      actualBehavior: 'Символите се изтриваха веднага след въвеждане',
      stepsToReproduce: [
        'Отвори booking формата',
        'Опитай да напишеш в name полето',
        'Символите се изтриват'
      ],
      browser: 'Всички браузъри',
      device: 'Desktop',
      tags: ['form-input', 'typing', 'input-deletion', 'react-hooks']
    },
    {
      title: 'Next.js ChunkLoadError при зареждане',
      description: 'При зареждане на приложението се показваше ChunkLoadError: Loading chunk app/page failed.',
      severity: 'critical',
      category: 'performance',
      priority: 'urgent',
      reporter: 'QA Team',
      status: 'resolved',
      expectedBehavior: 'Приложението трябва да се зарежда без грешки',
      actualBehavior: 'Показваше се ChunkLoadError',
      stepsToReproduce: [
        'Стартирай приложението',
        'Отвори браузъра',
        'Отиди на localhost:3000',
        'Виж конзолата за грешки'
      ],
      browser: 'Всички браузъри',
      device: 'Всички устройства',
      tags: ['nextjs', 'chunk-error', 'build-error', 'critical']
    }
  ];

  for (const bug of bugReports) {
    try {
      console.log(`📋 Добавям bug: ${bug.title}`);
      
      const response = await fetch('http://localhost:3000/api/admin/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        },
        body: JSON.stringify(bug)
      });

      if (response.ok) {
        console.log(`✅ Успешно добавен: ${bug.title}`);
      } else {
        console.log(`❌ Грешка при добавяне: ${bug.title} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Грешка при добавяне: ${bug.title} - ${error.message}`);
    }
  }

  console.log('🎉 Добавянето на bug reports завърши!');
} 