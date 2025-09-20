// Detailed PWA Debug Script
// Run this in browser console for detailed PWA diagnostics

console.log('🕵️ DETAILED PWA DIAGNOSTIC');
console.log('==========================');

async function debugPWA() {
  // 1. Service Worker Status
  console.log('\n📱 SERVICE WORKER STATUS:');
  
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`   Registrations: ${registrations.length}`);
    
    registrations.forEach((reg, index) => {
      console.log(`   ${index + 1}. Scope: ${reg.scope}`);
      console.log(`      Active: ${reg.active ? reg.active.state : 'none'}`);
      console.log(`      Installing: ${reg.installing ? reg.installing.state : 'none'}`);
      console.log(`      Waiting: ${reg.waiting ? reg.waiting.state : 'none'}`);
    });
    
    const controller = navigator.serviceWorker.controller;
    console.log(`   Controller: ${controller ? controller.state : 'none'}`);
  } else {
    console.log('   ❌ Not supported');
  }
  
  // 2. Cache Storage
  console.log('\n💾 CACHE STORAGE:');
  
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    console.log(`   Available caches: ${cacheNames.length}`);
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      console.log(`   ${cacheName}: ${requests.length} items`);
      
      // Show first 10 items
      requests.slice(0, 10).forEach(request => {
        console.log(`      - ${request.url}`);
      });
      if (requests.length > 10) {
        console.log(`      ... and ${requests.length - 10} more`);
      }
    }
  } else {
    console.log('   ❌ Not supported');
  }
  
  // 3. Test Network Requests
  console.log('\n🌐 NETWORK TESTS:');
  
  const testUrls = [
    '/',
    '/admin',
    '/manifest.json',
    '/sw.js',
    '/_next/static/css/ea6a797b251728a3.css' // Actual CSS file from build
  ];
  
  for (const url of testUrls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`   ${url}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ${url}: ❌ ${error.message}`);
    }
  }
  
  // 4. Test Offline Functionality
  console.log('\n🔌 OFFLINE TEST:');
  console.log('   To test offline:');
  console.log('   1. Open DevTools → Network → Offline');
  console.log('   2. Refresh the page');
  console.log('   3. Check console for Service Worker logs');
  
  // 5. IndexedDB Status
  console.log('\n🗄️ INDEXEDDB STATUS:');
  
  if ('indexedDB' in window) {
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('drborislavpetrov-offline', 3); // Use correct version
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      console.log(`   Database: ${db.name} v${db.version}`);
      console.log(`   Object stores: ${Array.from(db.objectStoreNames).join(', ')}`);
      
      db.close();
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  } else {
    console.log('   ❌ Not supported');
  }
  
  // 6. Application Status
  console.log('\n📊 APPLICATION STATUS:');
  console.log(`   Online: ${navigator.onLine}`);
  console.log(`   URL: ${window.location.href}`);
  console.log(`   Protocol: ${window.location.protocol}`);
  console.log(`   User Agent: ${navigator.userAgent.slice(0, 50)}...`);
}

// Run the diagnostic
debugPWA().catch(console.error);

// Add a global function for easy rerun
window.debugPWA = debugPWA;
