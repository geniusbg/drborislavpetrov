const http = require('http');

console.log('🔍 Testing server connection...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/bugs',
  method: 'GET',
  headers: {
    'x-admin-token': 'admin-token'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response length: ${data.length}`);
    console.log(`First 200 chars: ${data.substring(0, 200)}`);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end(); 