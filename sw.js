const APP_VERSION = 'v1.0.0';
const CACHE_NAME = `yshdd-epk-${APP_VERSION}`;
const OFFLINE_PAGE = '/offline.html';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/script.js',
  '/favicon.ico',
  '/logo.webp',
  '/img/social-share.webp',
  '/img/icons/icon-192x192.webp',
  '/img/icons/icon-512x512.webp',
  '/YSHDD.jpeg',
  '/crisis.png',
  '/quiensoy.png',
  OFFLINE_PAGE,
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Oswald:wght@500&display=swap',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'
];

// ====== INSTALL EVENT ======
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(ASSETS_TO_PRECACHE);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[Service Worker] Install failed:', err);
      })
  );
});

// ====== ACTIVATE EVENT ======
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', APP_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
    .catch((err) => {
      console.error('[Service Worker] Activation failed:', err);
    })
  );
});

// ====== FETCH EVENT ======
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  
  // Estrategia: Cache First, falling back to network
  if (isCacheable(request)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Devuelve la respuesta en caché si existe
          if (cachedResponse) {
            console.log(`[Service Worker] Serving from cache: ${requestUrl.pathname}`);
            return cachedResponse;
          }
          
          // Si no está en caché, hace la petición a la red
          return fetch(request)
            .then((networkResponse) => {
              // Clona la respuesta para guardarla en caché
              const responseToCache = networkResponse.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log(`[Service Worker] Caching new resource: ${requestUrl.pathname}`);
                  cache.put(request, responseToCache);
                });
              
              return networkResponse;
            })
            .catch(() => {
              // Fallback para navegación si está offline
              if (request.mode === 'navigate') {
                return caches.match(OFFLINE_PAGE);
              }
              
              // Fallback para imágenes
              if (request.headers.get('Accept').includes('image')) {
                return caches.match('/img/placeholder.webp');
              }
              
              return new Response('Offline - No hay conexión a internet', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' })
              });
            });
        })
    );
  }
});

// ====== PUSH NOTIFICATIONS ======
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let pushData = { title: 'Nueva actualización', body: 'Hay nuevo contenido disponible' };
  
  try {
    pushData = event.data.json();
  } catch (err) {
    console.log('[Service Worker] Push data not JSON, using default');
  }
  
  const options = {
    body: pushData.body || 'Mensaje importante de YSHDD',
    icon: '/img/icons/icon-192x192.webp',
    badge: '/img/icons/badge.webp',
    image: pushData.image || '/img/social-share.webp',
    data: {
      url: pushData.url || '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'view', title: 'Ver ahora' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(pushData.title || 'YSHDD', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    // Acción por defecto al hacer click en la notificación
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// ====== BACKGROUND SYNC ======
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-contact-forms') {
    event.waitUntil(
      syncPendingForms()
        .then(() => console.log('[Service Worker] Forms synced successfully'))
        .catch(err => console.error('[Service Worker] Sync failed:', err))
    );
  }
});

// ====== HELPER FUNCTIONS ======
function isCacheable(request) {
  const requestUrl = new URL(request.url);
  
  // No cachear solicitudes a la API o endpoints dinámicos
  if (requestUrl.pathname.startsWith('/api/')) {
    return false;
  }
  
  // No cachear solicitudes POST
  if (request.method !== 'GET') {
    return false;
  }
  
  // Solo cachear recursos locales y fuentes/iconos de terceros
  return (
    requestUrl.origin === self.location.origin ||
    requestUrl.origin === 'https://fonts.googleapis.com' ||
    requestUrl.origin === 'https://unpkg.com'
  );
}

async function syncPendingForms() {
  // Implementar lógica para sincronizar formularios pendientes
  const cache = await caches.open('pending-forms');
  const keys = await cache.keys();
  
  for (const key of keys) {
    const request = await cache.match(key);
    try {
      const response = await fetch(request);
      if (response.ok) {
        await cache.delete(key);
      }
    } catch (err) {
      console.error('[Service Worker] Failed to sync form:', err);
      throw err;
    }
  }
}

// ====== PERIODIC SYNC (para actualizaciones en segundo plano) ======
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') {
    console.log('[Service Worker] Periodic sync for content updates');
    event.waitUntil(updateCachedContent());
  }
});

async function updateCachedContent() {
  const cache = await caches.open(CACHE_NAME);
  const cachedUrls = (await cache.keys()).map(req => req.url);
  
  for (const url of cachedUrls) {
    if (shouldUpdate(url)) {
      try {
        const networkResponse = await fetch(url);
        if (networkResponse.ok) {
          await cache.put(url, networkResponse.clone());
          console.log(`[Service Worker] Updated cache for: ${url}`);
        }
      } catch (err) {
        console.error(`[Service Worker] Failed to update ${url}:`, err);
      }
    }
  }
}

function shouldUpdate(url) {
  // Actualizar solo ciertos tipos de recursos
  const updateableExtensions = ['.html', '.css', '.js', '.webp', '.mp4', '.mp3', '.m4a'];
  return updateableExtensions.some(ext => url.endsWith(ext));
}