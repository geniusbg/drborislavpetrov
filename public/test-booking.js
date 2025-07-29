const http = require('http');

const data = JSON.stringify({
  voiceCommand: "запази ми час за Пешо Пешо за 24 август от 14:00 за почистване на зъби"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/voice-commands',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'x-admin-token': 'admin-token-123'
  }
};

console.log('Sending command:', data);

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end(); 