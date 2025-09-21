// Clear Old Sync Queue Script
// Run this in browser console to clear old sync items that fail

console.log('🗑️ CLEARING OLD SYNC QUEUE');
console.log('=========================');

async function clearOldSyncQueue() {
  try {
    // Open the database
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('drborislavpetrov-offline', 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Database opened: ${db.name} v${db.version}`);
    
    // Get all sync queue items
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const getAllRequest = store.getAll();
    const items = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    console.log(`📊 Found ${items.length} sync queue items`);
    
    let deletedCount = 0;
    let updatedCount = 0;
    
    for (const item of items) {
      console.log(`🔍 Processing item: ${item.id} (action: ${item.action}, retries: ${item.retries})`);
      
      // Option 1: Delete items with too many retries
      if (item.retries >= 3) {
        store.delete(item.id);
        deletedCount++;
        console.log(`❌ Deleted failed item: ${item.id}`);
        continue;
      }
      
      // Option 2: Update old action types to new format
      let needsUpdate = false;
      if (item.action === 'update' && item.id.includes('booking')) {
        item.action = 'update-booking';
        needsUpdate = true;
      } else if (item.action === 'create' && item.id.includes('booking')) {
        item.action = 'create-booking';
        needsUpdate = true;
      } else if (item.action === 'delete' && item.id.includes('booking')) {
        item.action = 'delete-booking';
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        // Reset retry count for updated items
        item.retries = 0;
        store.put(item);
        updatedCount++;
        console.log(`✅ Updated item ${item.id} to action: ${item.action}`);
      }
    }
    
    db.close();
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Deleted failed items: ${deletedCount}`);
    console.log(`   - Updated action types: ${updatedCount}`);
    console.log(`   - Remaining items: ${items.length - deletedCount}`);
    
    if (updatedCount > 0) {
      console.log(`\n🔄 Refresh the page to trigger sync with updated items`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing sync queue:', error);
  }
}

// Helper function to completely clear sync queue
window.clearAllSyncQueue = async function() {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('drborislavpetrov-offline', 3);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    store.clear();
    console.log('🗑️ All sync queue items cleared');
    
    db.close();
  } catch (error) {
    console.error('❌ Error clearing all sync queue:', error);
  }
};

// Run the cleanup
clearOldSyncQueue().catch(console.error);

console.log('\n💡 Available commands:');
console.log('- clearOldSyncQueue() - Clean and update old sync items');
console.log('- window.clearAllSyncQueue() - Clear all sync items completely');
