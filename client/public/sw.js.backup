// TaxBot Vietnam - Enhanced Service Worker for Google Play Standards
const CACHE_NAME = 'taxbot-vietnam-v1.0.0';
const STATIC_CACHE = 'taxbot-static-v1.0.0';
const DYNAMIC_CACHE = 'taxbot-dynamic-v1.0.0';

// Critical resources for offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
  '/offline.html'
];

// App shell resources
const APP_SHELL = [
  '/ai-calculator',
  '/calculator',
  '/customer/dashboard',
  '/contact',
  '/registration'
];

// API endpoints to cache for offline
const API_CACHE = [
  '/api/packages',
  '/api/health'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('TaxBot Vietnam SW: Installing v1.0.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('TaxBot Vietnam SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache app shell
      caches.open(CACHE_NAME).then(cache => {
        console.log('TaxBot Vietnam SW: Caching app shell');
        return cache.addAll(APP_SHELL);
      }),
      
      // Pre-cache API responses
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('TaxBot Vietnam SW: Pre-caching API');
        return Promise.all(
          API_CACHE.map(url => {
            return fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response.clone());
              }
            }).catch(() => {
              // Ignore network errors during install
              console.log(`TaxBot Vietnam SW: Failed to pre-cache ${url}`);
            });
          })
        );
      })
    ]).then(() => {
      // Force activation
      self.skipWaiting();
    }).catch(error => {
      console.error('TaxBot Vietnam SW: Install failed', error);
    })
  );
});

// Enhanced fetch event - optimized caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and different origins
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Strategy 1: Cache First for static assets
        if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }
        
        // Strategy 2: Network First for API calls
        if (url.pathname.startsWith('/api/')) {
          try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
              // Cache successful API responses
              const cache = await caches.open(DYNAMIC_CACHE);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          } catch (error) {
            // Try cache for API requests
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return structured offline response for API
            return new Response(
              JSON.stringify({
                success: false,
                error: 'OFFLINE_MODE',
                message: 'Không có kết nối internet. Ứng dụng đang hoạt động ở chế độ offline.',
                timestamp: new Date().toISOString()
              }),
              {
                headers: { 
                  'Content-Type': 'application/json',
                  'X-Offline-Mode': 'true'
                },
                status: 503
              }
            );
          }
        }
        
        // Strategy 3: Stale While Revalidate for app shell
        if (APP_SHELL.includes(url.pathname)) {
          const cachedResponse = await caches.match(request);
          const networkPromise = fetch(request).then(response => {
            if (response.ok) {
              const cache = caches.open(CACHE_NAME);
              cache.then(c => c.put(request, response.clone()));
            }
            return response;
          }).catch(() => cachedResponse);
          
          return cachedResponse || await networkPromise;
        }
        
        // Strategy 4: Network First for other requests
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
      } catch (error) {
        // Fallback to cache or offline page
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html') || 
                 new Response('TaxBot Vietnam - Offline Mode', {
                   headers: { 'Content-Type': 'text/html' }
                 });
        }
        
        // Return 503 for other requests
        return new Response('Service Unavailable', { status: 503 });
      }
    })()
  );
});

// Enhanced activate event - cache management and client claiming
self.addEventListener('activate', (event) => {
  console.log('TaxBot Vietnam SW: Activating v1.0.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const keepCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE];
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!keepCaches.includes(cacheName)) {
              console.log('TaxBot Vietnam SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients immediately
      self.clients.claim()
    ]).then(() => {
      console.log('TaxBot Vietnam SW: Now ready to handle fetches');
      
      // Notify all clients about the new service worker
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: '1.0.0',
            message: 'TaxBot Vietnam updated successfully'
          });
        });
      });
    })
  );
});

// Push notification event (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'TaxBot Vietnam có thông báo mới',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'TaxBot Vietnam', 
        options
      )
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});