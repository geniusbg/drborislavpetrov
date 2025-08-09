const http = require('http');

async function checkDuplicates() {
  console.log('🔍 Checking for duplicates in bug tracker...\n');
  
  try {
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
        console.log(`🔍 Response status: ${res.statusCode}`);
        console.log(`🔍 Response data: ${data.substring(0, 200)}...`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const bugs = Array.isArray(response) ? response : response.bugs || [];
            
            console.log(`📊 Total bugs in tracker: ${bugs.length}`);
            
            if (bugs.length === 0) {
              console.log('✅ No bugs found in tracker');
              return;
            }
            
            // Group by title to find duplicates
            const groupedByTitle = {};
            bugs.forEach(bug => {
              const title = bug.title.toLowerCase().trim();
              if (!groupedByTitle[title]) {
                groupedByTitle[title] = [];
              }
              groupedByTitle[title].push(bug);
            });
            
            // Find duplicates
            const duplicates = [];
            Object.keys(groupedByTitle).forEach(title => {
              if (groupedByTitle[title].length > 1) {
                duplicates.push({
                  title: title,
                  bugs: groupedByTitle[title]
                });
              }
            });
            
            if (duplicates.length === 0) {
              console.log('✅ No duplicates found!');
            } else {
              console.log(`❌ Found ${duplicates.length} duplicate groups:`);
              duplicates.forEach((group, index) => {
                console.log(`\n${index + 1}. "${group.title}" (${group.bugs.length} duplicates):`);
                group.bugs.forEach((bug, bugIndex) => {
                  console.log(`   ${bugIndex + 1}. ID: ${bug.id}, Created: ${bug.created_at}`);
                });
              });
            }
            
            console.log(`\n📊 Summary:`);
            console.log(`📝 Total bugs: ${bugs.length}`);
            console.log(`❌ Duplicate groups: ${duplicates.length}`);
            console.log(`🔧 Unique bugs: ${Object.keys(groupedByTitle).length}`);
            
          } catch (parseError) {
            console.error('❌ Error parsing JSON:', parseError);
            console.error('Raw data:', data);
          }
        } else {
          console.log(`❌ Failed to get bugs: ${data}`);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Error checking duplicates:', error);
  }
}

checkDuplicates(); 