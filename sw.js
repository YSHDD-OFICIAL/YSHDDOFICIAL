/**
 * ============================================================================
 * sw.js — YSHDD EPK Premium 2027
 * Service Worker del EPK (GitHub Pages / Netlify, 100% estático).
 *
 * Objetivos:
 * - Precachear SOLO archivos que existen en el repo (sin rutas fantasma).
 * - Estrategias coherentes por tipo de recurso:
 *     · Navegación   → network-first con fallback a caché y offline.html
 *     · Estáticos    → cache-first con revalidación en background
 *     · Resto        → stale-while-revalidate
 * - Fallback a `offline.html` cuando la red falla.
 * - Limpieza de caches antiguas al activar.
 * - Soporte de mensajes: SKIP_WAITING, CACHE_URLS, GET_VERSION.
 * - SIN push notifications (no hay backend ni VAPID real).
 * - SIN llamadas a `/api/...` ni a dominios externos de analítica.
 *
 * Reglas del proyecto:
 * - Rutas REALES del repo. Si un archivo no existe, NO se precachea.
 * - Sin `console.log` en producción (solo `console.warn/error`).
 * - Sin `skipWaiting()` automático (se hace por mensaje del cliente).
 * ============================================================================
 */

'use strict';

/* ============================================================================
   Configuración
   ============================================================================ */

const SW_VERSION = '2027.01.0';
const CACHE_NAME = `yshdd-epk-${SW_VERSION}`;
const OFFLINE_URL = './offline.html';

/**
 * Lista REAL de assets existentes en el repo.
 * Si alguno de estos no existe, `cache.addAll` fallaría en bloque.
 * Por eso se cachean individualmente en `install`.
 */
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './offline.html',
  './404.html',
  './privacidad.html',
  './LICENCIA',

  './main.css',
  './main.js',

  './config.js',
  './analytics.js',
  './colaboraciones.js',
  './email.js',
  './notificaciones.js',
  './rendimiento.js',
  './jugador.js',
  './seguridad.js',
  './sesiones.js',
  './utils.js',
  './validación.js',
  './actualización.js',

  './site.webmanifest',
  './robots.txt',
  './mapa%20del%20sitio.xml',

  './YSHDD.png',
  './CRISIS.png',
  './crisis-v.png',
  './Quien_soy_yo.png',
  './VIDA-NUEVA.png',
  './CALLES%20DE%20ORO%20(INS).png',
  './CONTRA%20EL%20DIABLO.png',
  './EL%20DON.png',
  './EL%20VALOR%20DEL%20LEGADO.png',
  './JORDAN%2023.png',
  './NUESTRO%20JUEZ.png',
  './No%20M%C3%A1s%20Cr%C3%ADtica%20(INS).png',
  './SOLDADO%20DEL%20REY.png',
  './JHEY-DAE.png',

  './EL%20VALOR%20DEL%20LEGADO.mp3',
];

/* ============================================================================
   Utilidades
   ============================================================================ */

const isNavigation = (request) => request.mode === 'navigate';

const isSameOrigin = (url) => {
  try {
    return new URL(url).origin === self.location.origin;
  } catch {
    return false;
  }
};

const shouldSkipCache = (request) => {
  if (request.method !== 'GET') return true;
  if (!isSameOrigin(request.url)) return true; // Fuentes, YouTube, Spotify...
  if (request.url.startsWith('chrome-extension://')) return true;
  return false;
};

const STATIC_EXTENSIONS = new Set([
  'css', 'js', 'mjs',
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'avif',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'mp4', 'webm', 'mp3', 'wav', 'ogg', 'pdf',
  'json', 'xml', 'txt',
]);

const isStaticAsset = (request) => {
  const url = new URL(request.url);
  const ext = url.pathname.split('.').pop()?.toLowerCase() || '';
  return STATIC_EXTENSIONS.has(ext);
};

const safeCachePut = async (cacheName, request, response) => {
  try {
    if (!response || !response.ok) return;
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch (err) {
    console.warn('[sw] cache.put error:', err?.message || err);
  }
};

/* ============================================================================
   Estrategias
   ============================================================================ */

/**
 * Network-first con fallback a caché y a offline.html.
 * Ideal para navegación (HTML).
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    safeCachePut(CACHE_NAME, request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Sin conexión</title>' +
      '<body style="font-family:system-ui;background:#0b0b0f;color:#fff;' +
      'display:flex;align-items:center;justify-content:center;height:100vh;' +
      'margin:0;text-align:center"><div><h1>Sin conexión</h1>' +
      '<p>Vuelve a intentarlo cuando recuperes la conexión.</p></div></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
    );
  }
}

/**
 * Cache-first con revalidación en background.
 * Ideal para CSS/JS/imágenes/audio.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Revalidar en background
    fetch(request)
      .then((res) => safeCachePut(CACHE_NAME, request, res))
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    safeCachePut(CACHE_NAME, request, response.clone());
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Gateway Timeout' });
  }
}

/**
 * Stale-while-revalidate.
 * Ideal para el resto de recursos same-origin.
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      safeCachePut(CACHE_NAME, request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }

  const network = await networkPromise;
  if (network) return network;

  return new Response('', { status: 504, statusText: 'Gateway Timeout' });
}

/* ============================================================================
   Instalación
   ============================================================================ */

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cachear assets uno por uno (no romper si alguno falla).
    await Promise.all(
      ASSETS_TO_CACHE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (res && res.ok) await cache.put(url, res.clone());
        } catch (err) {
          console.warn('[sw] install: no se pudo cachear', url, err?.message || err);
        }
      })
    );

    // NO skipWaiting automático: lo pide el cliente con postMessage.
  })());
});

/* ============================================================================
   Activación
   ============================================================================ */

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Limpiar caches antiguas
    const names = await caches.keys();
    await Promise.all(
      names.map((name) => {
        if (name !== CACHE_NAME && name.startsWith('yshdd-epk-')) {
          return caches.delete(name);
        }
        return null;
      })
    );

    await self.clients.claim();

    // Notificar a los clientes activos que hay nueva versión lista
    const clientsList = await self.clients.matchAll({ type: 'window' });
    clientsList.forEach((client) => {
      client.postMessage({
        source: 'yshdd-sw',
        type: 'activated',
        version: SW_VERSION,
      });
    });
  })());
});

/* ============================================================================
   Fetch
   ============================================================================ */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (shouldSkipCache(request)) return;

  if (isNavigation(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

/* ============================================================================
   Mensajes desde el cliente
   ============================================================================ */

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  // Acepta "SKIP_WAITING" (string) o { type: 'SKIP_WAITING' }
  const type =
    typeof data === 'string' ? data : data.type;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (type === 'GET_VERSION') {
    event.source?.postMessage?.({
      source: 'yshdd-sw',
      type: 'version',
      version: SW_VERSION,
      cacheName: CACHE_NAME,
    });
    return;
  }

  if (type === 'CACHE_URLS' && Array.isArray(data.urls)) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const results = [];
      for (const url of data.urls) {
        try {
          const res = await fetch(url, { cache: 'reload' });
          if (res && res.ok) {
            await cache.put(url, res.clone());
            results.push({ url, ok: true });
          } else {
            results.push({ url, ok: false });
          }
        } catch {
          results.push({ url, ok: false });
        }
      }
      event.ports?.[0]?.postMessage({
        source: 'yshdd-sw',
        type: 'cache-urls-result',
        results,
      });
    })());
  }
});

/* ============================================================================
   Sin push, sin background-sync y sin notificaciones del SW
   ----------------------------------------------------------------------------
   · No hay VAPID real ni backend → no se implementa `push`.
   · No hay tareas programadas → no se implementa `sync`.
   · Las notificaciones in-app las gestiona `notifications.js`.
   ============================================================================ */

/* ============================================================================
   Manejo de errores del SW
   ============================================================================ */

self.addEventListener('error', (event) => {
  console.error('[sw] error:', event.error || event.message);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[sw] unhandledrejection:', event.reason);
});
