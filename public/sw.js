// Service Worker for offline caching
const CACHE_NAME = 'drborislavpetrov-v14';
const urlsToCache = [
  '/',
  '/admin',
  '/offline.html',
  '/manifest.json',
  '/admin-manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/icon-144.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
  '/admin-icon-144.svg',
  '/admin-icon-192.png',
  '/admin-icon-512.png',
  '/admin-icon-192-maskable.png',
  '/admin-icon-512-maskable.png'
];

// Listen for PWA install prompt
self.addEventListener('beforeinstallprompt', (event) => {
  // The event will be handled by the main thread
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
  // PWA installed successfully
});

// Extended patterns for caching
const shouldCacheUrl = (url) => {
  // Cache main navigation pages
  if (url === '/' || url === '/admin' || url.endsWith('/')) return true;
  
  // Cache static assets
  if (url.includes('/_next/static/')) return true;
  if (url.includes('/static/')) return true;
  
  // Cache specific file types
  if (url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)) return true;
  
  // Don't cache API endpoints
  if (url.includes('/api/')) return false;
  
  // Don't cache socket connections
  if (url.includes('socket')) return false;
  
  return false;
};

function canCacheRequest(request) {
  return request.method === 'GET' && 
         (request.url.startsWith('http://') || request.url.startsWith('https://')) &&
         shouldCacheUrl(request.url) &&
         request.mode !== 'no-cors'; // Не кешираме no-cors заявки
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files without verbose logging
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).then(() => {
              return url;
            }).catch(error => {
              return null; // Continue even if some files can't be cached
            })
          )
        );
      })
      .then((results) => {
        self.skipWaiting();
      })
      .catch((error) => {
        // Continue even if caching fails
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
      // Първо проверяваме кеша за по-бързо зареждане
      caches.match(event.request)
        .then((cached) => {
          if (cached) {
            // Serving cached navigation
            
            // В background опитваме да обновим кеша
            fetch(event.request)
              .then((response) => {
                if (response.status === 200 && event.request.method === 'GET') {
                  const copy = response.clone();
                  caches.open(CACHE_NAME).then((cache) => {
                    try {
                      cache.put(event.request, copy);
                      console.log('[SW] Updated cached navigation response:', event.request.url);
                    } catch (error) {
                      console.warn('Failed to update cached navigation request:', error);
                    }
                  });
                }
              })
              .catch(() => {
                console.log('[SW] Background update failed for:', event.request.url);
              });
            
            return cached;
          }
          
          // Ако няма кеширана версия, опитваме от мрежата
          console.log('[SW] No cache available, fetching from network:', event.request.url);
          return fetch(event.request)
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
              // Serving fresh navigation from network
              return response;
            })
            .catch(() => {
              // Ако мрежата fail-не, показваме offline страницата
              console.log('[SW] Network failed, showing offline page for:', event.request.url);
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

  // Static assets: cache-first with aggressive caching
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Serving cached static asset
        // Ensure proper MIME type for cached responses
        const url = event.request.url;
        let contentType = 'text/plain';
        
        if (url.endsWith('.css')) {
          contentType = 'text/css';
        } else if (url.endsWith('.js')) {
          contentType = 'application/javascript';
        } else if (url.endsWith('.png')) {
          contentType = 'image/png';
        } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (url.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        } else if (url.endsWith('.ico')) {
          contentType = 'image/x-icon';
        } else if (url.endsWith('.json')) {
          contentType = 'application/json';
        } else if (url.endsWith('.html')) {
          contentType = 'text/html';
        }
        
        // Return cached response with proper headers
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: {
            ...cached.headers,
            'Content-Type': contentType
          }
        });
      }
      
      console.log('[SW] Fetching and caching static asset:', event.request.url);
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          // Cache all successful GET requests for static assets
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, copy);
              console.log('[SW] Cached static asset:', event.request.url);
            } catch (error) {
              console.warn('Failed to cache request:', error);
            }
          });
        }
        return response;
      }).catch((error) => {
        console.log('[SW] Failed to fetch static asset:', event.request.url, error);
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