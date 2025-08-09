async function testBugAPI() {
  try {
    console.log('🧪 Testing bug API...');
    
    // Test GET
    console.log('📤 Testing GET /api/admin/bugs...');
    const getResponse = await fetch('http://localhost:3000/api/admin/bugs', {
      headers: {
        'x-admin-token': 'admin-token'
      }
    });
    
    console.log('GET Status:', getResponse.status);
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('GET Response: Bugs count:', getData.bugs?.length || 0);
    }
    
    // Test POST with minimal data
    console.log('\n📤 Testing POST /api/admin/bugs...');
    const postData = {
      title: 'Test Bug',
      description: 'Test Description',
      severity: 'low',
      category: 'test'
    };
    
    console.log('📤 POST data:', JSON.stringify(postData, null, 2));
    
    const postResponse = await fetch('http://localhost:3000/api/admin/bugs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'admin-token'
      },
      body: JSON.stringify(postData)
    });
    
    console.log('POST Status:', postResponse.status);
    console.log('POST Headers:', Object.fromEntries(postResponse.headers.entries()));
    
    if (postResponse.ok) {
      const postResult = await postResponse.json();
      console.log('POST Response:', JSON.stringify(postResult, null, 2));
    } else {
      const errorText = await postResponse.text();
      console.log('POST Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

testBugAPI(); 