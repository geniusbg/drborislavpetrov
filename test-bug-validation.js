const http = require('http');

// Test cases for validation
const testCases = [
  {
    name: "Valid bug data",
    data: {
      title: "Test Bug",
      description: "Test Description",
      severity: "low",
      category: "ui",
      priority: "medium",
      reporter: "admin",
      steps_to_reproduce: ["step1", "step2"],
      expected_behavior: "Should work",
      actual_behavior: "Works",
      browser: "Chrome",
      device: "Desktop",
      tags: ["test", "validation"]
    },
    expectedStatus: 200
  },
  {
    name: "Missing required fields",
    data: {
      title: "",
      description: "Test",
      reporter: "admin"
    },
    expectedStatus: 400
  },
  {
    name: "Invalid severity",
    data: {
      title: "Test Bug",
      description: "Test Description",
      severity: "invalid",
      reporter: "admin"
    },
    expectedStatus: 400
  },
  {
    name: "Invalid category",
    data: {
      title: "Test Bug",
      description: "Test Description",
      category: "invalid",
      reporter: "admin"
    },
    expectedStatus: 400
  },
  {
    name: "Invalid array fields",
    data: {
      title: "Test Bug",
      description: "Test Description",
      reporter: "admin",
      steps_to_reproduce: "not an array",
      tags: "not an array"
    },
    expectedStatus: 400
  }
];

async function testBugAPI() {
  console.log('🧪 Testing bug API validation...\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    
    const postData = JSON.stringify(testCase.data);
    
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
        const statusMatch = res.statusCode === testCase.expectedStatus;
        const statusIcon = statusMatch ? '✅' : '❌';
        
        console.log(`${statusIcon} Status: ${res.statusCode} (expected: ${testCase.expectedStatus})`);
        console.log(`📥 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        console.log('---');
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
    });
    
    req.write(postData);
    req.end();
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testBugAPI(); 