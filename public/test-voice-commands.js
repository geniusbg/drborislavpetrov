// Test commands for iOS voice recognition
const BASE_URL = 'http://localhost:3000';

const testCommands = [
  {
    name: 'Add User Test',
    command: {
      action: 'addUser',
      name: 'Иван Иванов',
      phone: '0888123456',
      email: 'ivan@example.com',
      originalCommand: 'добави потребител Иван Иванов телефон 0888123456 имейл ivan@example.com'
    }
  },
  {
    name: 'Update User Test',
    command: {
      action: 'updateUser',
      name: 'Мария Петрова',
      phone: '0888765432',
      originalCommand: 'промени потребител Мария Петрова телефон 0888765432'
    }
  },
  {
    name: 'Check Availability Test',
    command: {
      action: 'checkAvailability',
      date: 'завтра',
      originalCommand: 'провери свободни часове за завтра'
    }
  },
  {
    name: 'Add Booking Test',
    command: {
      action: 'addBooking',
      name: 'Петър Георгиев',
      date: '15.12.2024',
      time: '14:00',
      service: 'консултация',
      originalCommand: 'добави резервация Петър Георгиев 15.12.2024 14:00 консултация'
    }
  }
];

async function testVoiceCommand(testCase) {
  console.log(`\n🧪 Тестване: ${testCase.name}`);
  console.log(`📝 Команда: ${testCase.command.originalCommand}`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/voice-commands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.command),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Успех: ${result.message || 'Команда изпълнена'}`);
      if (result.data) {
        console.log(`📊 Данни:`, JSON.stringify(result.data, null, 2));
      }
    } else {
      console.log(`❌ Грешка: ${result.error || 'Неизвестна грешка'}`);
    }
    
    return { success: response.ok, result };
  } catch (error) {
    console.log(`❌ Свързване: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testIOSDetection() {
  console.log('\n📱 Тестване на iOS Detection Logic');
  
  // Simulate different user agents
  const testUserAgents = [
    {
      name: 'iPhone Safari',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      expected: true
    },
    {
      name: 'iPad Safari',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      expected: true
    },
    {
      name: 'Desktop Chrome',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      expected: false
    },
    {
      name: 'Android Chrome',
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      expected: false
    }
  ];
  
  testUserAgents.forEach(test => {
    const isIOS = /iPad|iPhone|iPod/.test(test.userAgent);
    const status = isIOS === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${isIOS ? 'iOS Detected' : 'Not iOS'} (Expected: ${test.expected ? 'iOS' : 'Not iOS'})`);
  });
}

async function testVoiceSupport() {
  console.log('\n🎤 Тестване на Voice Support Logic');
  
  // Simulate different browser capabilities
  const testScenarios = [
    {
      name: 'iOS Safari (No Voice Support)',
      hasSpeechRecognition: false,
      isIOS: true,
      expected: false
    },
    {
      name: 'Desktop Chrome (Voice Support)',
      hasSpeechRecognition: true,
      isIOS: false,
      expected: true
    },
    {
      name: 'Desktop Firefox (Voice Support)',
      hasSpeechRecognition: true,
      isIOS: false,
      expected: true
    },
    {
      name: 'Old Browser (No Voice Support)',
      hasSpeechRecognition: false,
      isIOS: false,
      expected: false
    }
  ];
  
  testScenarios.forEach(test => {
    const voiceSupported = test.hasSpeechRecognition && !test.isIOS;
    const status = voiceSupported === test.expected ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${voiceSupported ? 'Supported' : 'Not Supported'} (Expected: ${test.expected ? 'Supported' : 'Not Supported'})`);
  });
}

async function runAllTests() {
  console.log('🚀 Стартиране на тестове за iOS Voice Recognition');
  console.log('=' .repeat(60));
  
  // Test iOS detection logic
  await testIOSDetection();
  
  // Test voice support logic
  await testVoiceSupport();
  
  // Test voice commands API
  console.log('\n🔧 Тестване на Voice Commands API');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  let totalCount = testCommands.length;
  
  for (const testCase of testCommands) {
    const result = await testVoiceCommand(testCase);
    if (result.success) {
      successCount++;
    }
  }
  
  console.log('\n📊 Резултати от тестовете:');
  console.log(`✅ Успешни: ${successCount}/${totalCount}`);
  console.log(`❌ Неуспешни: ${totalCount - successCount}/${totalCount}`);
  console.log(`📈 Успеваемост: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 Всички тестове преминаха успешно!');
  } else {
    console.log('\n⚠️ Някои тестове не преминаха. Проверете логиката.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testVoiceCommand,
  testIOSDetection,
  testVoiceSupport,
  runAllTests
}; 