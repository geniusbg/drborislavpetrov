const http = require('http');

async function removeSomeDuplicates() {
  console.log('🗑️ Removing some duplicates from bug tracker...\n');
  
  // IDs на дубликати които искаме да изтрием
  const duplicateIds = [55, 63, 54, 62, 53, 61];
  
  console.log(`🗑️ Will try to delete ${duplicateIds.length} duplicates`);
  
  let deletedCount = 0;
  
  for (const id of duplicateIds) {
    try {
      console.log(`🗑️ Deleting ID: ${id}`);
      
      await new Promise((resolve, reject) => {
        const deleteOptions = {
          hostname: 'localhost',
          port: 3000,
          path: `/api/admin/bugs/${id}`,
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
              console.log(`✅ Successfully deleted ID: ${id}`);
              deletedCount++;
            } else {
              console.log(`❌ Failed to delete ID ${id}: ${deleteData}`);
            }
            resolve();
          });
        });
        
        deleteReq.on('error', (e) => {
          console.error(`❌ Error deleting ID ${id}: ${e.message}`);
          reject(e);
        });
        
        deleteReq.end();
      });
      
      // Wait between deletions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error deleting bug ${id}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`🗑️ Attempted to delete: ${duplicateIds.length} duplicates`);
  console.log(`✅ Successfully deleted: ${deletedCount}`);
  console.log(`❌ Failed to delete: ${duplicateIds.length - deletedCount}`);
}

removeSomeDuplicates(); 