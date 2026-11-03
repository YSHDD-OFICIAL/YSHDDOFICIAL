/**
 * ============================================================================
 * main.js — YSHDD EPK Premium 2027
 * Punto de entrada único (type="module").
 *
 * Este archivo coordina todos los módulos del EPK. Los módulos internos se
 * importan aquí y NO deben enlazarse por separado en index.html (evita doble
 * carga). Los módulos que no existan en el repo se cargan con import()
 * dinámico y se degradan de forma segura (fallback silencioso).
 *
 * Convenciones:
 * - Sin dependencias de terceros.
 * - Accesible (WCAG 2.2 AA).
 * - Idempotente: todos los inicializadores verifican la existencia de DOM.
 * - Respeta prefers-reduced-motion y prefers-color-scheme.
 * - Emite eventos en window.YSHDD.events.
 * ============================================================================
 */

'use strict';

/* ============================================================================
   HELPERS INTERNOS
   ============================================================================ */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const prefersDark = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const nowISO = () => new Date().toISOString();

const log = (level, ...args) => {
  const prefix = '[YSHDD]';
  const fn = console[level] || console.log;
  fn.call(console, prefix, ...args);
};

const safe = async (name, fn) => {
  try {
    return await fn();
  } catch (err) {
    log('warn', `módulo "${name}" falló:`, err?.message || err);
    return null;
  }
};

/* ============================================================================
   CONFIGURACIÓN ESTÁTICA DEL EPK
   ============================================================================ */

const CONFIG = {
  version: '3.0.0',
  name: 'YSHDD EPK',
  domain: 'https://yshdd.netlify.app/',
  email: 'yshddoficial@gmail.com',
  artist: {
    name: 'YSHDD',
    realName: 'Luis Esteban Potosí Venté',
    birthDate: '2005-05-30',
    origin: 'Cali, Colombia',
    startYear: 2023,
    genres: ['Rap Cristiano', 'Trap Cristiano', 'Drill Cristiano'],
    album: { name: 'CRISIS', year: 2025, tracks: 5, duration: '16:06' },
    single: { name: '¿Quién Soy?', year: 2024, duration: '2:19' },
    upcoming: { name: 'Guiamé', year: 2026 },
    award: 'Artista Revelación 2024 — Festival Cristiano Nacional',
  },
  social: {
    spotify: 'https://open.spotify.com/intl-es/artist/43tSpIfMASioBV4PmbyymH',
    youtube: 'https://youtube.com/@yshdd',
    apple:   'https://music.apple.com/co/artist/yshdd/1675116188',
    amazon:  'https://amazon.es/music/player/artists/B0BX5SDDVV2/yshdd',
    instagram: 'https://instagram.com/yshddoficial',
    tiktok:    'https://tiktok.com/@yshddoficial',
    facebook:  'https://facebook.com/yshddoficial',
    youtubeVideoCRISIS: 'https://youtu.be/naMGlK1ozFc',
  },
  media: {
    heroVideo: 'YSHDD.mp4',
    heroPoster: 'YSHDD.png',
    audio: 'EL%20VALOR%20DEL%20LEGADO.mp3',
    cover: 'CRISIS.png',
    visual: 'crisis-v.png',
  },
  storageKeys: {
    theme: 'yshdd-theme',
    volume: 'yshdd-music-volume',
    user: 'yshdd-user-id',
    visits: 'yshdd-visit-count',
    prefs: 'yshdd-preferences',
  },
};

/* ============================================================================
   ESTADO GLOBAL
   ============================================================================ */

const state = {
  ready: false,
  theme: 'dark',
  online: navigator.onLine,
  isMobile: window.innerWidth < 768,
  isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: window.innerWidth >= 1024,
  activeSection: 'hero',
  visitCount: 1,
  userId: '',
  modules: {},
  player: null,
};

const events = {
  ready: [],
  error: [],
  themeChange: [],
  sectionChange: [],
  onlineChange: [],
};

/* ============================================================================
   API PÚBLICA
   ============================================================================ */

const YSHDD = {
  version: CONFIG.version,
  config: CONFIG,
  state,
  events,
  on(event, cb) { (events[event] ||= []).push(cb); },
  off(event, cb) {
    if (events[event]) events[event] = events[event].filter(fn => fn !== cb);
  },
  emit(event, payload) {
    (events[event] || []).forEach(fn => {
      try { fn(payload); } catch (e) { log('warn', 'listener error:', e); }
    });
  },
  notify(message, type = 'info', timeout = 4000) {
    return window.YSHDD?.notify?.(message, type, timeout) ?? notifyFallback(message, type, timeout);
  },
  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return false;
    modal.classList.add('show');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    return true;
  },
  closeModal(id) {
    const modal = id ? document.getElementById(id) : null;
    const target = modal || document.querySelector('.modal.show');
    if (!target) return false;
    target.classList.remove('show');
    target.hidden = true;
    target.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    return true;
  },
  closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(m => {
      m.classList.remove('show');
      m.hidden = true;
      m.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  },
  scrollTo(target, behavior) {
    const el = typeof target === 'string' ? document.getElementById(target) : target;
    if (!el) return;
    el.scrollIntoView({
      behavior: behavior || (prefersReducedMotion() ? 'auto' : 'smooth'),
      block: 'start',
    });
  },
};

window.YSHDD = Object.assign(window.YSHDD || {}, YSHDD);

/* ============================================================================
   NOTIFICACIÓN DE RESPALDO (en caso de que script.js no haya cargado)
   ============================================================================ */

function notifyFallback(message, type = 'info', timeout = 4000) {
  const container = document.getElementById('notifications');
  if (!container) {
    log('info', `[${type}] ${message}`);
    return null;
  }
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="notification-icon" aria-hidden="true">●</span>
    <div class="notification-content">
      <p class="notification-message">${message}</p>
    </div>
    <button type="button" class="notification-close" aria-label="Cerrar notificación">×</button>
  `;
  el.querySelector('.notification-close').addEventListener('click', () => el.remove());
  container.appendChild(el);
  setTimeout(() => el.remove(), timeout);
  return el;
}

/* ============================================================================
   TEMA
   ============================================================================ */

function initTheme() {
  const stored = safe('theme:read', () => localStorage.getItem(CONFIG.storageKeys.theme));
  const initial = stored || (prefersDark() ? 'dark' : 'light');
  applyTheme(initial);

  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    safe('theme:write', () => localStorage.setItem(CONFIG.storageKeys.theme, next));
    YSHDD.emit('themeChange', next);
  });
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    const icon = toggle.querySelector('i');
    if (icon) icon.className = theme === 'light' ? 'bx bx-sun' : 'bx bx-moon';
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'light' ? '#fafafa' : '#0b0b0f');
  }
}

/* ============================================================================
   CONEXIÓN ONLINE / OFFLINE
   ============================================================================ */

function initConnectionWatcher() {
  window.addEventListener('online', () => {
    state.online = true;
    YSHDD.notify('Conexión restablecida', 'success');
    YSHDD.emit('onlineChange', true);
  });
  window.addEventListener('offline', () => {
    state.online = false;
    YSHDD.notify('Sin conexión a internet — modo offline activo', 'warning');
    YSHDD.emit('onlineChange', false);
  });
}

/* ============================================================================
   RESIZE / BREAKPOINTS
   ============================================================================ */

function initResponsive() {
  let raf = null;
  window.addEventListener('resize', () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      state.isMobile = window.innerWidth < 768;
      state.isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      state.isDesktop = window.innerWidth >= 1024;
      raf = null;
    });
  }, { passive: true });
}

/* ============================================================================
   ATAJOS DE TECLADO GLOBALES
   ============================================================================ */

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target?.tagName || '').toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

    // Escape → cerrar modales / menús
    if (e.key === 'Escape') {
      YSHDD.closeAllModals();
      const nav = document.getElementById('mainNav');
      const toggle = document.getElementById('navToggle');
      if (nav?.classList.contains('open')) {
        nav.classList.remove('open');
        toggle?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    // Ctrl/Cmd + Shift + T → toggle tema
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyT') {
      e.preventDefault();
      document.getElementById('themeToggle')?.click();
    }
  });
}

/* ============================================================================
   CONTADOR DE VISITAS + ID DE USUARIO
   ============================================================================ */

function initUserSession() {
  safe('user:id', () => {
    let id = localStorage.getItem(CONFIG.storageKeys.user);
    if (!id) {
      id = 'u_' + Math.random().toString(36).slice(2, 11);
      localStorage.setItem(CONFIG.storageKeys.user, id);
    }
    state.userId = id;
  });

  safe('user:visits', () => {
    const n = parseInt(localStorage.getItem(CONFIG.storageKeys.visits) || '0', 10) + 1;
    localStorage.setItem(CONFIG.storageKeys.visits, String(n));
    state.visitCount = n;
  });
}

/* ============================================================================
   SERVICE WORKER
   ============================================================================ */

async function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
    log('info', 'Service Worker registrado:', reg.scope);

    // Actualización periódica silenciosa (cada hora)
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

    // Aviso cuando hay nueva versión esperando
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          YSHDD.notify('Hay una nueva versión disponible. Recarga para actualizar.', 'info', 8000);
        }
      });
    });
  } catch (err) {
    log('warn', 'Service Worker no registrado:', err?.message || err);
  }
}

/* ============================================================================
   CARGA DINÁMICA DE MÓDULOS
   ----------------------------------------------------------------------------
   Todos los módulos JS del repo se cargan aquí. Si alguno falta, se ignora.
   ============================================================================ */

const MODULE_FILES = {
  analytics:       './analytics.js',
  collaborations:  './colaboraciones.js',
  email:           './email.js',
  notificaciones:  './notificaciones.js',
  rendimiento:     './rendimiento.js',
  jugador:         './jugador.js',
  seguridad:       './seguridad.js',
  sesiones:        './sesiones.js',
  utils:           './utils.js',
  validacion:      './validación.js',
  actualizacion:   './actualización.js',
  config:          './config.js',
  player:          './player.js',
  performance:     './performance.js',
  validation:      './validation.js',
};

async function loadModule(name, path) {
  try {
    const mod = await import(path);
    const inst = mod?.default ?? mod?.instance ?? mod?.getInstance?.() ?? mod;
    state.modules[name] = inst;
    return inst;
  } catch (err) {
    log('info', `módulo "${name}" no disponible (${path})`);
    return null;
  }
}

async function loadAllModules() {
  const entries = Object.entries(MODULE_FILES);
  await Promise.allSettled(
    entries.map(([name, path]) => loadModule(name, path))
  );
}

/* ============================================================================
   PLAYER (delegación a módulo si existe; fallback al <audio> nativo del DOM)
   ============================================================================ */

function initPlayer() {
  const playerModule = state.modules.jugador || state.modules.player;
  const audioEl = document.querySelector('#music audio');

  if (playerModule && typeof playerModule.init === 'function') {
    safe('player:module', () => playerModule.init());
    state.player = playerModule;
    return;
  }

  if (audioEl) {
    // Guardar volumen previo
    const storedVolume = safe('player:vol', () =>
      localStorage.getItem(CONFIG.storageKeys.volume)
    );
    if (storedVolume !== null && !Number.isNaN(Number(storedVolume))) {
      audioEl.volume = Math.min(1, Math.max(0, Number(storedVolume) / 100));
    }

    // Persistir volumen
    audioEl.addEventListener('volumechange', () => {
      safe('player:vol-save', () =>
        localStorage.setItem(CONFIG.storageKeys.volume, String(Math.round(audioEl.volume * 100)))
      );
    });

    state.player = audioEl;
  }
}

/* ============================================================================
   FORMULARIOS (validación ligera de respaldo + feedback accesible)
   ============================================================================ */

function initForms() {
  const validator =
    state.modules.validacion ||
    state.modules.validation;

  $$('form').forEach((form) => {
    if (form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', (e) => {
      // Si es mailto:, permitimos el envío normal; damos feedback.
      const action = form.getAttribute('action') || '';
      const isMailto = action.startsWith('mailto:');

      // Validación delegada al módulo (si existe)
      if (validator && typeof validator.validateForm === 'function') {
        const result = validator.validateForm(form);
        if (result === false || result?.valid === false) {
          e.preventDefault();
          YSHDD.notify('Revisa los campos marcados', 'error');
          return;
        }
      }

      if (isMailto) {
        YSHDD.notify('Abriendo tu cliente de correo…', 'info');
      } else {
        YSHDD.notify('Formulario enviado', 'success');
      }
    });
  });
}

/* ============================================================================
   GALERÍA — FILTROS (delegación segura; convive con script.js)
   ============================================================================ */

function initGalleryFilters() {
  const filters = $$('#gallery [data-filter]');
  const items   = $$('#gallery .gallery-grid figure[data-cat]');
  if (!filters.length || !items.length) return;

  filters.forEach((btn) => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => {
      const cat = btn.dataset.filter || 'all';
      items.forEach((fig) => {
        fig.hidden = !(cat === 'all' || fig.dataset.cat === cat);
      });
      filters.forEach((b) =>
        b.setAttribute('aria-pressed', String(b.dataset.filter === cat))
      );
    });
  });
}

/* ============================================================================
   VIDEO MODAL (delegación segura)
   ============================================================================ */

function initVideoModalDelegation() {
  const modal   = document.getElementById('videoModal');
  const iframe  = document.getElementById('videoIframe');
  if (!modal || !iframe) return;

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-video-id]');
    if (!trigger) return;
    const id = trigger.getAttribute('data-video-id');
    if (!id) return;
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    modal.hidden = false;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  modal.addEventListener('click', (e) => {
    if (e.target !== modal) return;
    modal.classList.remove('show');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    iframe.src = '';
    document.body.style.overflow = '';
  });
}

/* ============================================================================
   BÚSQUEDA INTERNA (por si script.js no la inicializa)
   ============================================================================ */

function initSearchPanel() {
  const btn   = document.getElementById('searchBtn');
  const panel = document.getElementById('searchPanel');
  if (!btn || !panel) return;

  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) panel.querySelector('input')?.focus();
  });
}

/* ============================================================================
   THEME + A11Y DE ENLACES DE NAV
   ============================================================================ */

function initSectionSpy() {
  if (!('IntersectionObserver' in window)) return;
  const links = $$('#mainNav a[href^="#"]');
  if (!links.length) return;

  const sections = links
    .map(a => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      state.activeSection = id;
      links.forEach(a => {
        const isCurrent = a.getAttribute('href') === `#${id}`;
        if (isCurrent) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
      YSHDD.emit('sectionChange', id);
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================================
   UTILIDADES DE ANÁLISIS (opcional)
   ============================================================================ */

function trackEvent(category, action, label, value) {
  const analytics = state.modules.analytics || state.modules.analytics;
  if (analytics && typeof analytics.trackEvent === 'function') {
    analytics.trackEvent(category, action, label, value);
  } else if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } else {
    log('info', `event: ${category}/${action}/${label ?? ''}`);
  }
}

/* ============================================================================
   BOOTSTRAP
   ============================================================================ */

async function bootstrap() {
  log('info', `Iniciando ${CONFIG.name} v${CONFIG.version}…`);

  // Sincrónico / crítico
  safe('theme', initTheme);
  safe('session', initUserSession);
  safe('connection', initConnectionWatcher);
  safe('responsive', initResponsive);
  safe('keyboard', initKeyboardShortcuts);
  safe('search', initSearchPanel);
  safe('gallery', initGalleryFilters);
  safe('video-modal', initVideoModalDelegation);
  safe('section-spy', initSectionSpy);

  // Carga de módulos (async)
  await safe('modules', loadAllModules);

  // Post-módulos
  safe('player', initPlayer);
  safe('forms', initForms);

  // Service Worker
  await safe('sw', initServiceWorker);

  // Marcar listo
  state.ready = true;
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');

  YSHDD.emit('ready', state);
  log('info', 'EPK listo ✔');

  // Marcar primer pageview
  trackEvent('page', 'view', window.location.pathname);
}

/* ============================================================================
   ARRANQUE
   ============================================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}

/* ============================================================================
   ERRORES GLOBALES
   ============================================================================ */

window.addEventListener('error', (e) => {
  log('error', 'error global:', e.error || e.message);
  YSHDD.emit('error', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  log('error', 'promesa rechazada:', e.reason);
  YSHDD.emit('error', e.reason);
});

/* ============================================================================
   EXPORTS (para tests o extensiones futuras)
   ============================================================================ */

export { YSHDD, CONFIG, state, events };
export default YSHDD;
