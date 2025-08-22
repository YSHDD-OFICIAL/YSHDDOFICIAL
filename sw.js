const APP_VERSION = 'v2.0.0';
const CACHE_NAME = `yshdd-epk-${APP_VERSION}`;
const OFFLINE_PAGE = '/offline.html';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/script.js',
  '/analytics.js',
  '/notificacion.js',
  '/actualizacion.js',
  '/seguridad.js',
  '/Email.js',
  '/privacy.html',
  '/offline.html',
  '/404.html',
  '/site.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/img/bio/bio-image.webp',
  '/img/albums/crisis.webp',
  '/img/albums/quiensoy.webp',
  '/img/videos/quien-soy-thumb.webp',
  '/img/videos/crisis-thumb.webp',
  '/img/videos/entrevista-thumb.webp',
  '/img/gallery/concierto.webp',
  '/img/gallery/estudio.webp',
  '/img/gallery/fotos.webp',
  '/img/gallery/vivo.webp',
  '/img/icons/icon-192x192.webp',
  '/img/icons/icon-512x512.webp',
  '/img/favicon.ico',
  '/img/social-share.webp',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700&family=Oswald:wght@500&display=swap',
  'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css'
];

// ====== INSTALL EVENT ======
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', APP_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching critical assets');
        return cache.addAll(ASSETS_TO_PRECACHE);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting and activate immediately');
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
          // Eliminar cachés antiguas que no coincidan con el nombre actual
          if (cacheName !== CACHE_NAME && cacheName.startsWith('yshdd-epk-')) {
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
  
  // Solo manejar solicitudes GET y que sean cacheables
  if (request.method !== 'GET' || !isCacheable(request)) {
    return;
  }
  
  // Estrategia: Stale-While-Revalidate para mejor performance
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Siempre hacer la petición a red para actualizar la caché
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Clonar la respuesta para guardarla en caché
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback para cuando no hay conexión
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fallback específico para navegación
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
        
        // Fallback para imágenes
        if (request.headers.get('Accept').includes('image')) {
          return caches.match('/img/icons/icon-192x192.webp');
        }
        
        return new Response('Offline - No hay conexión a internet', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
      
      // Devolver la respuesta en caché inmediatamente si existe, mientras se actualiza
      return cachedResponse || fetchPromise;
    })
  );
});

// ====== PUSH NOTIFICATIONS ======
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let pushData = { 
    title: 'YSHDD - Nuevo contenido', 
    body: 'Hay nueva música disponible', 
    icon: '/img/icons/icon-192x192.webp',
    url: '/'
  };
  
  try {
    pushData = event.data.json();
  } catch (err) {
    console.log('[Service Worker] Push data not JSON, using default');
  }
  
  const options = {
    body: pushData.body || 'Nuevo contenido disponible de YSHDD',
    icon: pushData.icon || '/img/icons/icon-192x192.webp',
    badge: '/img/icons/icon-72x72.webp',
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
    self.registration.showNotification(
      pushData.title || 'YSHDD', 
      options
    )
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view' || event.action === '') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
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
  
  // No cachear solicitudes a Netlify functions o admin
  if (requestUrl.pathname.startsWith('/.netlify/')) {
    return false;
  }
  
  // No cachear solicitudes a APIs externas (excepto fuentes e iconos)
  if (requestUrl.origin !== self.location.origin) {
    const allowedDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'unpkg.com'
    ];
    
    if (!allowedDomains.includes(requestUrl.hostname)) {
      return false;
    }
  }
  
  // Solo cachear recursos estáticos
  const staticExtensions = ['.css', '.js', '.html', '.webp', '.jpg', '.png', '.ico', '.woff2', '.ttf'];
  return staticExtensions.some(ext => requestUrl.pathname.endsWith(ext));
}

async function syncPendingForms() {
  // Implementar lógica para sincronizar formularios pendientes
  // Esto es útil para cuando el usuario envía formularios offline
  try {
    const cache = await caches.open('pending-forms');
    const keys = await cache.keys();
    
    for (const key of keys) {
      const request = await cache.match(key);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(key);
          console.log('[Service Worker] Form synced successfully');
        }
      } catch (err) {
        console.error('[Service Worker] Failed to sync form:', err);
        throw err;
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error accessing pending forms cache:', err);
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
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedRequests = await cache.keys();
    
    for (const request of cachedRequests) {
      if (shouldUpdate(request.url)) {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            console.log(`[Service Worker] Updated cache for: ${request.url}`);
          }
        } catch (err) {
          console.error(`[Service Worker] Failed to update ${request.url}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('[Service Worker] Error updating cached content:', err);
  }
}

function shouldUpdate(url) {
  // Actualizar solo ciertos tipos de recursos con menor frecuencia
  const updateableResources = ['.html', '.css', '.js', '.json'];
  return updateableResources.some(ext => url.endsWith(ext));
}

// ====== MESSAGE HANDLING ======
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_NEW_RESOURCE') {
    caches.open(CACHE_NAME).then(cache => {
      cache.add(event.data.url);
    });
  }
});

// ====== OFFLINE DETECTION ======
// Función para verificar el estado de conexión
function updateOnlineStatus() {
  console.log('[Service Worker] Connectivity changed:', navigator.onLine ? 'online' : 'offline');
}

// Escuchar cambios en la conectividad
self.addEventListener('online', updateOnlineStatus);
self.addEventListener('offline', updateOnlineStatus);