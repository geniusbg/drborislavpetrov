const CACHE_NAME = 'drborislavpetrov-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Helper function to check if request can be cached
function canCacheRequest(request) {
  // Only cache GET requests and HTTP/HTTPS requests
  return request.method === 'GET' && 
         (request.url.startsWith('http://') || request.url.startsWith('https://'));
}

// Service Worker loaded

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', (event) => {
  // Skip caching for admin pages and API endpoints
  if (event.request.url.includes('/admin') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('socket')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses and cacheable requests
            if (response && response.status === 200 && canCacheRequest(event.request)) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone).catch((error) => {
                  // Silently fail if cache.put fails (e.g., chrome-extension scheme)
                  console.warn('Service Worker: Cache.put failed:', error);
                });
              });
            }
            return response;
          })
          .catch((error) => {
            // Return original request instead of fallback for better error handling
            return fetch(event.request).catch(() => {
              // Only use fallback for navigation requests if network completely fails
              if (event.request.mode === 'navigate') {
                return caches.match('/');
              }
              return new Response('Network error', { status: 503 });
            });
          });
      })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 