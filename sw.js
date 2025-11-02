const CACHE_NAME = 'simplifai-v1.0.0';
const STATIC_CACHE = 'simplifai-static-v1.0.0';
const DYNAMIC_CACHE = 'simplifai-dynamic-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external API calls
  if (url.origin !== location.origin && !STATIC_ASSETS.includes(url.pathname)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // For HTML files, try network in background for updates
          if (request.destination === 'document') {
            fetchAndUpdate(request);
          }
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response for caching
            const responseToCache = response.clone();
            
            // Cache dynamic content
            if (shouldCache(request)) {
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Offline fallback
            return getOfflineFallback(request);
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    event.waitUntil(syncContactForm());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from SimplifAI-1',
    icon: '/images/icon-192x192.png',
    badge: '/images/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SimplifAI-1', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
function fetchAndUpdate(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        return caches.open(STATIC_CACHE)
          .then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
      }
      throw new Error('Network response was not ok');
    })
    .catch(() => {
      // Network failed, but we have the cached version
      return caches.match(request);
    });
}

function shouldCache(request) {
  const url = new URL(request.url);
  
  // Cache images, fonts, and static assets
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    return true;
  }
  
  // Cache same-origin requests
  if (url.origin === location.origin) {
    return true;
  }
  
  // Cache specific external resources
  const cacheableHosts = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net'
  ];
  
  return cacheableHosts.includes(url.hostname);
}

function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.destination === 'document') {
    return caches.match('/offline.html') || 
           new Response('Offline - Please check your internet connection', {
             status: 503,
             statusText: 'Service Unavailable'
           });
  }
  
  // Return placeholder for images
  if (request.destination === 'image') {
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">Image unavailable offline</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // Return error for other requests
  return new Response('Offline - Resource not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

function syncContactForm() {
  return caches.open(DYNAMIC_CACHE)
    .then((cache) => {
      return cache.match('/pending-contact-forms');
    })
    .then((response) => {
      if (response) {
        return response.json();
      }
      return [];
    })
    .then((pendingForms) => {
      const syncPromises = pendingForms.map((formData) => {
        return fetch('https://api.simplifai-1.com/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      });
      
      return Promise.all(syncPromises);
    })
    .then(() => {
      // Clear pending forms after successful sync
      return caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.delete('/pending-contact-forms');
        });
    })
    .catch((error) => {
      console.error('Background sync failed:', error);
    });
}

// Cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Handle cache update messages from client
    console.log('Service Worker: Cache update message received');
  }
});

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const start = performance.now();
  
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        const end = performance.now();
        const duration = end - start;
        
        // Log slow requests
        if (duration > 1000) {
          console.warn(`Slow request detected: ${event.request.url} took ${duration}ms`);
        }
        
        return response;
      } catch (error) {
        const end = performance.now();
        const duration = end - start;
        
        console.error(`Request failed: ${event.request.url} after ${duration}ms`, error);
        throw error;
      }
    })()
  );
});