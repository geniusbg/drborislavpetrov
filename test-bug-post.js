const https = require('https');
const http = require('http');

const bugData = {
  title: "Test bug от скрипт",
  description: "Тестово описание",
  severity: "low",
  category: "test",
  reporter: "admin",
  steps_to_reproduce: ["стъпка 1", "стъпка 2"],
  expected_behavior: "Трябва да работи",
  actual_behavior: "Работи",
  browser: "Chrome",
  device: "Desktop",
  tags: ["test", "script"]
};

const postData = JSON.stringify(bugData);

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

console.log('🔍 Sending POST request to bug API...');
console.log('📤 Data:', JSON.stringify(bugData, null, 2));

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Response:', data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Bug added successfully!');
    } else {
      console.log('❌ Failed to add bug');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(postData);
req.end(); 