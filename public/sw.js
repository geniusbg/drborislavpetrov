// Service Worker for offline caching
const CACHE_NAME = 'drborislavpetrov-v5';
const urlsToCache = [
  '/',
  '/admin',
  '/offline.html',
  '/manifest.json',
  '/admin-manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/admin-icon-192.png',
  '/admin-icon-512.png'
];

function canCacheRequest(request) {
  return request.method === 'GET' && 
         (request.url.startsWith('http://') || request.url.startsWith('https://')) &&
         !request.url.includes('/api/') && // Не кешираме API заявки
         request.destination !== 'document' && // Не кешираме navigation requests тук
         !request.url.includes('socket') && // Не кешираме socket заявки
         request.mode !== 'no-cors'; // Не кешираме no-cors заявки
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Кешираме файловете поотделно за по-добра обработка на грешки
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // Продължаваме дори ако някой файл не може да бъде кеширан
            })
          )
        );
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Cache failed:', error);
        // Продължаваме дори ако кеширането не успее
        self.skipWaiting();
      })
  );
});

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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip non-GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests with offline fallback
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache only GET API responses for offline use
          if (response.status === 200 && event.request.method === 'GET') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, copy);
              } catch (error) {
                console.warn('Failed to cache API request:', error);
              }
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for API requests
          return caches.match(event.request)
            .then((cached) => {
              if (cached) {
                return cached;
              }
              // Return offline response for API requests
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'Няма интернет връзка. Моля, проверете връзката си.' 
                }),
                { 
                  status: 503, 
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Skip socket traffic
  if (url.includes('socket')) {
    return;
  }

  // Navigation requests: hybrid strategy - network-first for online, cache-first for offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Първо опитваме се от мрежата за актуални данни
      fetch(event.request)
        .then((response) => {
          // Cache successful navigation responses
          if (response.status === 200 && event.request.method === 'GET') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(event.request, copy);
                console.log('[SW] Cached fresh navigation response:', event.request.url);
              } catch (error) {
                console.warn('Failed to cache navigation request:', error);
              }
            });
          }
          console.log('[SW] Serving fresh navigation from network:', event.request.url);
          return response;
        })
        .catch(() => {
          // Ако мрежата fail-не, опитваме се от кеша
          console.log('[SW] Network failed, trying cache for:', event.request.url);
          return caches.match(event.request)
            .then((cached) => {
              if (cached) {
                console.log('[SW] Serving cached navigation:', event.request.url);
                return cached;
              }
              
              // Ако няма кеширана версия, показваме offline страницата
              console.log('[SW] No cache available, showing offline page for:', event.request.url);
              return caches.match('/offline.html').then((offlinePage) => {
                if (offlinePage) {
                  // Запазваме оригиналния URL в sessionStorage
                  const originalUrl = event.request.url;
                  const url = new URL(originalUrl);
                  const pathname = url.pathname;
                  
                  // Създаваме нова response с JavaScript който запазва URL-а
                  return offlinePage.text().then((html) => {
                    const modifiedHtml = html.replace(
                      'sessionStorage.setItem(\'offline-original-url\', window.location.pathname);',
                      `sessionStorage.setItem('offline-original-url', '${pathname}');`
                    );
                    return new Response(modifiedHtml, {
                      headers: offlinePage.headers
                    });
                  });
                }
                // Fallback ако offline.html не е наличен
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Офлайн - Д-р Борислав Петров</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f3f4f6;">
                    <h1>Няма интернет връзка</h1>
                    <p>Моля, проверете връзката си и опитайте отново.</p>
                    <button onclick="window.location.reload()">Опитай отново</button>
                  </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              });
            });
        })
    );
    return;
  }

  // Static assets: cache-first with offline fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && canCacheRequest(event.request)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, copy);
            } catch (error) {
              console.warn('Failed to cache request:', error);
            }
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for static assets
        if (event.request.destination === 'image') {
          // Return placeholder for images
          return new Response(
            '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="14">Офлайн</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        // For other static assets, return empty response
        return new Response('', { status: 404 });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});