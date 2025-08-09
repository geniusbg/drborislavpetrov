const http = require('http');

async function monitorPool() {
  console.log('🔍 Monitoring database pool status...\n');
  
  // Test GET request to check pool status
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
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📊 GET Status: ${res.statusCode}`);
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log(`📋 Bugs count: ${response.bugs?.length || 0}`);
        } catch (e) {
          console.log('📥 Raw response:', data.substring(0, 200));
        }
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });
  
  req.end();
  
  // Wait and test POST
  setTimeout(async () => {
    console.log('\n🧪 Testing POST request...');
    
    const postData = JSON.stringify({
      title: "Pool Test Bug",
      description: "Testing pool monitoring",
      severity: "low",
      category: "ui",
      priority: "medium",
      reporter: "admin",
      steps_to_reproduce: ["test step"],
      expected_behavior: "Should work",
      actual_behavior: "Works",
      browser: "Chrome",
      device: "Desktop",
      tags: ["test", "pool"]
    });
    
    const postOptions = {
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
    
    const postReq = http.request(postOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 POST Status: ${res.statusCode}`);
        console.log(`📥 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        
        if (res.statusCode === 200) {
          console.log('✅ POST request successful!');
        } else {
          console.log('❌ POST request failed');
        }
      });
    });
    
    postReq.on('error', (e) => {
      console.error(`❌ POST request error: ${e.message}`);
    });
    
    postReq.write(postData);
    postReq.end();
  }, 2000);
}

monitorPool(); 