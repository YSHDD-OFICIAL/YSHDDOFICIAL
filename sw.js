// sw.js - Service Worker profesional para YSHDD EPK
const CACHE_NAME = 'yshdd-epk-v2.5.0';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.css',
  '/main.js',
  '/profile-main.jpg',
  '/crisis.jpg',
  '/quien-soy.jpg',
  '/YSHDD.mp4',
  '/favicon.ico',
  '/site.webmanifest'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cacheando recursos críticos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('✅ Service Worker instalado');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Eliminando cache viejo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado');
        return self.clients.claim();
      })
  );
});

// Estrategia: Stale-While-Revalidate para mejor performance
self.addEventListener('fetch', event => {
  // Evitar cache para solicitudes de analytics y APIs externas
  if (this.shouldSkipCache(event.request)) {
    return;
  }
  
  // Para solicitudes de navegación, usar network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(this.handleNavigationRequest(event.request));
    return;
  }
  
  // Para recursos estáticos, usar cache-first
  if (this.isStaticAsset(event.request)) {
    event.respondWith(this.handleStaticRequest(event.request));
    return;
  }
  
  // Para todo lo demás, usar stale-while-revalidate
  event.respondWith(this.handleStaleWhileRevalidate(event.request));
});

// Métodos de manejo de requests
shouldSkipCache(request) {
  const url = new URL(request.url);
  
  // No cachear solicitudes de analytics
  if (url.hostname.includes('google-analytics') ||
      url.hostname.includes('gtag') ||
      url.hostname.includes('analytics')) {
    return true;
  }
  
  // No cachear APIs externas
  if (url.hostname.includes('api.') ||
      url.hostname.includes('backend')) {
    return true;
  }
  
  // No cachear WebSocket
  if (request.url.startsWith('ws:') || request.url.startsWith('wss:')) {
    return true;
  }
  
  return false;
}

async handleNavigationRequest(request) {
  try {
    // Intentar network primero
    const networkResponse = await fetch(request);
    
    // Clonar respuesta para cache
    const clonedResponse = networkResponse.clone();
    
    // Actualizar cache en background
    caches.open(CACHE_NAME)
      .then(cache => cache.put(request, clonedResponse))
      .catch(error => console.error('Error actualizando cache:', error));
    
    return networkResponse;
    
  } catch (error) {
    // Fallback a cache si network falla
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback a página offline
    return caches.match('/offline.html');
  }
}

async handleStaticRequest(request) {
  // Cache first para recursos estáticos
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Actualizar cache en background
    this.updateCacheInBackground(request);
    return cachedResponse;
  }
  
  // Si no está en cache, fetch y cache
  try {
    const networkResponse = await fetch(request);
    const clonedResponse = networkResponse.clone();
    
    caches.open(CACHE_NAME)
      .then(cache => cache.put(request, clonedResponse))
      .catch(error => console.error('Error cacheando recurso:', error));
    
    return networkResponse;
    
  } catch (error) {
    console.error('Error fetching recurso:', error);
    // Podrías retornar un fallback aquí
    return new Response('', { status: 404, statusText: 'Not Found' });
  }
}

async handleStaleWhileRevalidate(request) {
  // Intentar cache primero
  const cachedPromise = caches.match(request);
  
  // Network promise para actualizar cache
  const networkPromise = fetch(request)
    .then(networkResponse => {
      // Clonar para cache
      const clonedResponse = networkResponse.clone();
      
      // Actualizar cache
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, clonedResponse))
        .catch(error => console.error('Error actualizando cache:', error));
      
      return networkResponse;
    })
    .catch(error => {
      console.error('Error en network request:', error);
      return null;
    });
  
  // Retornar cache primero, luego actualizar
  try {
    const cachedResponse = await cachedPromise;
    if (cachedResponse) {
      // En background, actualizar desde network
      networkPromise.catch(() => {}); // Ignorar errores
      return cachedResponse;
    }
    
    // Si no hay cache, esperar network
    const networkResponse = await networkPromise;
    if (networkResponse) {
      return networkResponse;
    }
    
    throw new Error('Network request failed');
    
  } catch (error) {
    console.error('Error en stale-while-revalidate:', error);
    return new Response('', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Retry-After': '30' }
    });
  }
}

isStaticAsset(request) {
  const url = new URL(request.url);
  const extension = url.pathname.split('.').pop().toLowerCase();
  
  const staticExtensions = [
    'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 
    'webp', 'ico', 'woff', 'woff2', 'ttf', 'eot',
    'mp4', 'webm', 'mp3', 'wav', 'pdf'
  ];
  
  return staticExtensions.includes(extension) ||
         request.url.includes('/assets/') ||
         request.url.includes('/images/') ||
         request.url.includes('/media/');
}

async updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    const clonedResponse = networkResponse.clone();
    
    caches.open(CACHE_NAME)
      .then(cache => cache.put(request, clonedResponse))
      .catch(error => console.error('Error actualizando cache en background:', error));
      
  } catch (error) {
    console.error('Error en background fetch:', error);
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data === 'UPDATE_CACHE') {
    this.updateCache();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(event.data.urls))
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          event.ports[0].postMessage({ success: false, error: error.message });
        })
    );
  }
});

async updateCache() {
  const cache = await caches.open(CACHE_NAME);
  
  // Actualizar recursos críticos
  for (const url of ASSETS_TO_CACHE) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (error) {
      console.error(`Error actualizando ${url}:`, error);
    }
  }
  
  // Limpiar recursos no utilizados
  const cachedRequests = await cache.keys();
  const currentUrls = new Set(ASSETS_TO_CACHE);
  
  for (const request of cachedRequests) {
    if (!currentUrls.has(request.url)) {
      await cache.delete(request);
    }
  }
  
  console.log('✅ Cache actualizado');
}

// Manejar sync events (para background sync)
self.addEventListener('sync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(this.updateCache());
  }
});

// Manejar push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver más'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Precache de rutas dinámicas
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Precache para rutas específicas
  if (url.pathname.startsWith('/album/') || 
      url.pathname.startsWith('/session/')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              // Cachear para futuro uso
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clonedResponse));
              
              return networkResponse;
            })
            .catch(() => {
              // Fallback genérico
              return new Response(
                JSON.stringify({ error: 'Content not available offline' }),
                { 
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
  }
});
