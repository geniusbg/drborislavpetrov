const http = require('http');

async function removeDuplicates() {
  console.log('🗑️ Removing duplicates from bug tracker...\n');
  
  try {
    // First, get all bugs
    const getOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/bugs',
      method: 'GET',
      headers: {
        'x-admin-token': 'admin-token'
      }
    };
    
    const getReq = http.request(getOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', async () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const bugs = Array.isArray(response) ? response : response.bugs || [];
            
            console.log(`📊 Total bugs found: ${bugs.length}`);
            
            if (bugs.length === 0) {
              console.log('✅ No bugs found to check for duplicates');
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
            
            // Find duplicates and keep only the oldest one
            const bugsToDelete = [];
            Object.keys(groupedByTitle).forEach(title => {
              if (groupedByTitle[title].length > 1) {
                // Sort by created_at and keep the oldest (first)
                const sortedBugs = groupedByTitle[title].sort((a, b) => 
                  new Date(a.created_at) - new Date(b.created_at)
                );
                
                // Delete all except the oldest
                for (let i = 1; i < sortedBugs.length; i++) {
                  bugsToDelete.push(sortedBugs[i]);
                }
              }
            });
            
            if (bugsToDelete.length === 0) {
              console.log('✅ No duplicates to remove!');
              return;
            }
            
            console.log(`🗑️ Found ${bugsToDelete.length} duplicates to remove:`);
            bugsToDelete.forEach((bug, index) => {
              console.log(`   ${index + 1}. ID: ${bug.id} - "${bug.title}"`);
            });
            
            // Delete duplicates
            let deletedCount = 0;
            for (const bug of bugsToDelete) {
              try {
                await new Promise((resolve, reject) => {
                  const deleteOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/admin/bugs/${bug.id}`,
                    method: 'DELETE',
                    headers: {
                      'x-admin-token': 'admin-token'
                    }
                  };
                  
                  const deleteReq = http.request(deleteOptions, (deleteRes) => {
                    let deleteData = '';
                    deleteRes.on('data', (chunk) => {
                      deleteData += chunk;
                    });
                    
                    deleteRes.on('end', () => {
                      if (deleteRes.statusCode === 200) {
                        console.log(`✅ Deleted: ID ${bug.id} - "${bug.title}"`);
                        deletedCount++;
                      } else {
                        console.log(`❌ Failed to delete ID ${bug.id}: ${deleteData}`);
                      }
                      resolve();
                    });
                  });
                  
                  deleteReq.on('error', (e) => {
                    console.error(`❌ Error deleting ID ${bug.id}: ${e.message}`);
                    reject(e);
                  });
                  
                  deleteReq.end();
                });
                
                // Wait between deletions
                await new Promise(resolve => setTimeout(resolve, 200));
                
              } catch (error) {
                console.error(`❌ Error deleting bug ${bug.id}:`, error);
              }
            }
            
            console.log(`\n📊 Summary:`);
            console.log(`🗑️ Duplicates found: ${bugsToDelete.length}`);
            console.log(`✅ Successfully deleted: ${deletedCount}`);
            console.log(`❌ Failed to delete: ${bugsToDelete.length - deletedCount}`);
            
          } catch (parseError) {
            console.error('❌ Error parsing JSON:', parseError);
            console.error('Raw data:', data);
          }
        } else {
          console.log(`❌ Failed to get bugs: ${data}`);
        }
      });
    });
    
    getReq.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
    });
    
    getReq.end();
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error);
  }
}

removeDuplicates(); 