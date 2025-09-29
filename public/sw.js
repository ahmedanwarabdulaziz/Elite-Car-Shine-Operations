// Elite Car Shine - Employee Portal Service Worker
const CACHE_NAME = 'elite-car-shine-employee-v2';
const urlsToCache = [
  '/',
  '/employee/dashboard',
  '/employee/login',
  '/work-orders',
  '/work-orders-dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/sw.js'
];

// Enhanced cache strategy for Android/Huawei devices
const CACHE_STRATEGIES = {
  CACHE_FIRST: ['/employee/dashboard', '/work-orders', '/work-orders-dashboard'],
  NETWORK_FIRST: ['/api/', '/firebase/'],
  STALE_WHILE_REVALIDATE: ['/static/', '/assets/']
};

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Enhanced fetch event with Android/Huawei optimizations
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Determine cache strategy based on URL
  let strategy = 'NETWORK_FIRST'; // default
  if (CACHE_STRATEGIES.CACHE_FIRST.some(path => pathname.includes(path))) {
    strategy = 'CACHE_FIRST';
  } else if (CACHE_STRATEGIES.NETWORK_FIRST.some(path => pathname.includes(path))) {
    strategy = 'NETWORK_FIRST';
  } else if (CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some(path => pathname.includes(path))) {
    strategy = 'STALE_WHILE_REVALIDATE';
  }

  event.respondWith(handleRequest(event.request, strategy));
});

async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  switch (strategy) {
    case 'CACHE_FIRST':
      return cacheFirst(request, cache);
    case 'NETWORK_FIRST':
      return networkFirst(request, cache);
    case 'STALE_WHILE_REVALIDATE':
      return staleWhileRevalidate(request, cache);
    default:
      return networkFirst(request, cache);
  }
}

async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('Service Worker: Serving from cache (cache-first)', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, no cache available', request.url);
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return cache.match('/employee/dashboard');
    }
    throw error;
  }
}

async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return cache.match('/employee/dashboard');
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle offline form submissions when back online
  return new Promise((resolve) => {
    // Implementation for syncing offline data
    console.log('Service Worker: Syncing offline data');
    resolve();
  });
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Elite Car Shine',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Elite Car Shine', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/employee/dashboard')
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'INSTALL_PWA') {
    console.log('Service Worker: PWA installation requested');
    // Try to trigger PWA installation
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TRIGGER_INSTALL'
          });
        });
      })
    );
  }
});