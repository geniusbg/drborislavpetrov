const http = require('http');

const data = JSON.stringify({
  voiceCommand: "добави потребител мария маринова телефон 0881234567"
});

console.log('Sending command:', data);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/voice-commands',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-admin-token': 'admin123',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end(); 