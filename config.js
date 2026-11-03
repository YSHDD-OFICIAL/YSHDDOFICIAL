/**
 * ============================================================================
 * config.js — YSHDD EPK Premium 2027
 * Configuración central, constantes y utilidades del EPK.
 *
 * Este módulo es la FUENTE ÚNICA DE VERDAD para:
 * - Metadata del artista y del EPK (usada por JSON-LD, meta tags, UI).
 * - URLs de redes sociales y plataformas (deben coincidir 100% con index.html).
 * - Rutas de descargas y assets REALES del repo (sin rutas fantasma).
 * - Features flags, seguridad, rendimiento e i18n.
 * - Utilidades reutilizables (estado, DOM, formato, validación).
 *
 * Reglas del proyecto:
 * - Sin dependencias externas.
 * - Sin rutas inventadas: solo archivos que existen en el repo.
 * - Compatible con GitHub Pages / Netlify (100% estático).
 * - Todo dato sensible se maneja sin backend (mailto: reales).
 * ============================================================================
 */

'use strict';

/* ============================================================================
   CONFIGURACIÓN
   ============================================================================ */

export const CONFIG = Object.freeze({
  /* ------------------------------ App / EPK ------------------------------ */
  app: {
    name: 'YSHDD EPK',
    version: '3.0.0',
    build: '2027.01',
    channel: 'production',
    author: 'YSHDD',
    email: 'yshddoficial@gmail.com',
    website: 'https://yshdd.netlify.app/',
    repo: 'https://github.com/YSHDD-OFICIAL/YSHDDOFICIAL/',
    license: 'LICENCIA',
    language: 'es',
    locale: 'es_CO',
    copyright: '© 2026-2027 YSHDD. Todos los derechos reservados.',
    keywords: [
      'YSHDD',
      'EPK',
      'rap cristiano',
      'trap cristiano',
      'drill cristiano',
      'Cali',
      'Colombia',
      'booking',
      'prensa',
    ],
  },

  /* ------------------------------- Artista ------------------------------- */
  artist: {
    stageName: 'YSHDD',
    realName: 'Luis Esteban Potosí Venté',
    birthDate: '2005-05-30',
    birthPlace: 'Cali, Colombia',
    origin: 'Cali, Colombia',
    nationality: 'Colombiana',
    activeSince: 2023,
    genres: ['Rap Cristiano', 'Trap Cristiano', 'Drill Cristiano'],
    label: 'Independiente',
    management: {
      name: 'Esteban Potosí',
      role: 'Management',
      email: 'yshddoficial@gmail.com',
    },
    booking: {
      email: 'yshddoficial@gmail.com',
      subject: 'Booking YSHDD',
    },
    press: {
      email: 'yshddoficial@gmail.com',
      subject: 'Prensa YSHDD',
    },
    award: 'Artista Revelación 2024 — Festival Cristiano Nacional',
    discography: {
      album: {
        name: 'CRISIS',
        year: 2025,
        tracks: 5,
        duration: '16:06',
        cover: 'CRISIS.png',
        visual: 'crisis-v.png',
        youtube: 'https://youtu.be/naMGlK1ozFc',
      },
      single: {
        name: '¿Quién Soy?',
        year: 2024,
        duration: '2:19',
        cover: 'Quien_soy_yo.png',
      },
      upcoming: {
        name: 'Guiamé',
        year: 2026,
        cover: null,
      },
    },
    timeline: [
      { year: 2023, label: 'Inicio de la carrera artística en Cali.' },
      { year: 2024, label: 'Single ¿Quién Soy? · Premio Artista Revelación.' },
      { year: 2025, label: 'Álbum debut CRISIS (5 tracks, 16:06).' },
      { year: 2026, label: 'Próximo álbum Guiamé.' },
      { year: 2027, label: 'Tour 2027 (fechas por confirmar).' },
    ],
  },

  /* ----------------------------- Redes reales ---------------------------- */
  social: {
    spotify: {
      url: 'https://open.spotify.com/intl-es/artist/43tSpIfMASioBV4PmbyymH',
      label: 'Spotify',
      icon: 'bxl-spotify',
      id: '43tSpIfMASioBV4PmbyymH',
    },
    youtube: {
      url: 'https://youtube.com/@yshdd',
      label: 'YouTube',
      icon: 'bxl-youtube',
      handle: '@yshdd',
    },
    appleMusic: {
      url: 'https://music.apple.com/co/artist/yshdd/1675116188',
      label: 'Apple Music',
      icon: 'bxl-apple',
      id: '1675116188',
    },
    amazonMusic: {
      url: 'https://amazon.es/music/player/artists/B0BX5SDDVV2/yshdd',
      label: 'Amazon Music',
      icon: 'bxl-amazon',
      id: 'B0BX5SDDVV2',
    },
    instagram: {
      url: 'https://instagram.com/yshddoficial',
      label: 'Instagram',
      icon: 'bxl-instagram',
      handle: '@yshddoficial',
    },
    tiktok: {
      url: 'https://tiktok.com/@yshddoficial',
      label: 'TikTok',
      icon: 'bxl-tiktok',
      handle: '@yshddoficial',
    },
    facebook: {
      url: 'https://facebook.com/yshddoficial',
      label: 'Facebook',
      icon: 'bxl-facebook',
      handle: 'yshddoficial',
    },
  },

  /* -------------------------- Assets reales del repo ------------------------- */
  assets: {
    heroVideo: 'YSHDD.mp4',
    heroPoster: 'YSHDD.png',
    audio: 'EL%20VALOR%20DEL%20LEGADO.mp3',
    audioFilename: 'EL VALOR DEL LEGADO.mp3',
    favicon: 'YSHDD.png',
    appleTouchIcon: 'YSHDD.png',
    manifest: 'site.webmanifest',
    serviceWorker: './sw.js',
    css: 'main.css',
    mainJs: 'main.js',
    offline: 'offline.html',
    notFound: '404.html',
    privacy: 'privacidad.html',
    license: 'LICENCIA',
    covers: {
      crisis: 'CRISIS.png',
      crisisVisual: 'crisis-v.png',
      quienSoy: 'Quien_soy_yo.png',
      quienSoyAlt: 'quiensoy.png',
      callesDeOro: 'CALLES%20DE%20ORO%20(INS).png',
      contraElDiablo: 'CONTRA%20EL%20DIABLO.png',
      elDon: 'EL%20DON.png',
      elValorDelLegado: 'EL%20VALOR%20DEL%20LEGADO.png',
      jordan23: 'JORDAN%2023.png',
      nuestroJuez: 'NUESTRO%20JUEZ.png',
      noMasCritica: 'No%20M%C3%A1s%20Cr%C3%ADtica%20(INS).png',
      soldadoDelRey: 'SOLDADO%20DEL%20REY.png',
      vidaNueva: 'VIDA-NUEVA.png',
      jheyDae: 'JHEY-DAE.png',
    },
  },

  /* ------------------------- Rutas NO implementadas ------------------------ */
  downloads: {
    // No existen PDFs/ZIPs reales en el repo.
    // Se resuelven vía mailto: con asunto prellenado.
    epk: {
      kind: 'mailto',
      subject: 'Solicitud EPK YSHDD',
    },
    pressKit: {
      kind: 'mailto',
      subject: 'Solicitud Kit de Prensa YSHDD',
    },
    bio: {
      kind: 'mailto',
      subject: 'Solicitud Biografía YSHDD (PDF)',
    },
    rider: {
      kind: 'mailto',
      subject: 'Solicitud Rider Técnico YSHDD',
    },
    photos: {
      kind: 'mailto',
      subject: 'Solicitud Fotos de Prensa YSHDD',
    },
  },

  /* --------------------------- URLs externas reales ------------------------ */
  external: {
    youtubeVideoCRISIS: 'https://youtu.be/naMGlK1ozFc',
    youtubeVideoCRISISEmbed: 'https://www.youtube-nocookie.com/embed/naMGlK1ozFc',
  },

  /* -------------------------------- APIs ---------------------------------- */
  api: {
    // El EPK es 100% estático. No hay backend.
    enabled: false,
    baseUrl: null,
  },

  /* ------------------------------ Features -------------------------------- */
  features: {
    pwa: {
      enabled: true,
      installable: true,
      offline: true,
    },
    notifications: {
      enabled: true,
      liveRegion: true,
    },
    analytics: {
      enabled: false, // Sin backend; los eventos solo se loguean en local.
      provider: 'none',
    },
    lazyLoad: {
      enabled: true,
      threshold: 0.5,
    },
    theme: {
      enabled: true,
      default: 'dark',
      storageKey: 'yshdd-theme',
    },
    musicPlayer: {
      enabled: true,
      autoplay: false,
      volume: 80,
      storageKey: 'yshdd-music-volume',
    },
    webShare: {
      enabled: true,
      fallbackClipboard: true,
    },
    search: {
      enabled: true,
      minLength: 2,
    },
    gallery: {
      enabled: true,
      filters: ['all', 'portadas', 'prensa', 'colaboraciones'],
    },
    serviceWorker: {
      enabled: true,
      scope: './',
    },
    smoothScroll: {
      enabled: true,
      respectReducedMotion: true,
    },
  },

  /* ------------------------------- Seguridad ------------------------------ */
  security: {
    csp: {
      // Definido a nivel de servidor/hosting (Netlify _headers o GitHub Pages).
      enabled: false,
      reportOnly: false,
    },
    xssProtection: { enabled: true },
    clickjackingProtection: { enabled: true },
    emailObfuscation: {
      enabled: false, // Mejor accesibilidad: los mailto: quedan visibles.
      method: 'none',
    },
    rightClickProtection: {
      enabled: false, // No bloqueamos imágenes; perjudica UX y a11y.
    },
  },

  /* ------------------------------ Rendimiento ----------------------------- */
  performance: {
    lazyLoadThreshold: 0.5,
    imageQuality: 85,
    cacheTTL: 3600,
    preloadCritical: true,
    prefetchLinks: false,
    maxImageSize: 1920,
    fontFamilies: ['Inter', 'Oswald', 'Playfair Display'],
  },

  /* --------------------------------- i18n --------------------------------- */
  i18n: {
    default: 'es',
    supported: ['es'], // en.html no existe en el repo.
    fallback: 'es',
    htmlLang: 'es',
    hreflang: {
      es: 'https://yshdd.netlify.app/',
    },
  },

  /* ------------------------------ Eventos --------------------------------- */
  events: {
    pageView: 'page_view',
    download: 'download',
    play: 'play',
    pause: 'pause',
    contact: 'contact',
    socialClick: 'social_click',
    shareClick: 'share_click',
    themeChange: 'theme_change',
    sectionChange: 'section_change',
    swRegistered: 'sw_registered',
    errorGlobal: 'error_global',
  },

  /* ------------------------------ Storage keys ----------------------------- */
  storageKeys: {
    theme: 'yshdd-theme',
    volume: 'yshdd-music-volume',
    userId: 'yshdd-user-id',
    visits: 'yshdd-visit-count',
    prefs: 'yshdd-preferences',
    lastVisit: 'yshdd-last-visit',
  },
});

/* ============================================================================
   CONSTANTES
   ============================================================================ */

export const CONSTANTS = Object.freeze({
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },

  ANIMATION: {
    DURATION: {
      FAST: 150,
      BASE: 300,
      SLOW: 500,
      XL: 1000,
    },
    EASING: {
      BASE: 'cubic-bezier(0.4, 0, 0.2, 1)',
      BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  STORAGE_KEYS: {
    THEME: 'yshdd-theme',
    USER_ID: 'yshdd-user-id',
    MUSIC_VOLUME: 'yshdd-music-volume',
    VISITS: 'yshdd-visit-count',
    PREFERENCES: 'yshdd-preferences',
    LAST_VISIT: 'yshdd-last-visit',
  },

  EVENT_TYPES: {
    CLICK: 'click',
    SCROLL: 'scroll',
    RESIZE: 'resize',
    LOAD: 'load',
    ERROR: 'error',
    ONLINE: 'online',
    OFFLINE: 'offline',
    VISIBILITY: 'visibilitychange',
  },

  COLORS: {
    PRIMARY: '#ffdd57',
    PRIMARY_DARK: '#ffc107',
    SECONDARY: '#222222',
    ACCENT: '#e94560',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3',
    DARK: '#0b0b0f',
    LIGHT: '#ffffff',
    THEME_DARK: '#0b0b0f',
    THEME_LIGHT: '#fafafa',
  },

  A11Y: {
    SKIP_LINK_TARGET: '#mainContent',
    FOCUSABLE_SELECTOR:
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    LIVE_REGION_ID: 'notifications',
  },

  ROUTES: {
    HOME: 'index.html',
    OFFLINE: 'offline.html',
    NOT_FOUND: '404.html',
    PRIVACY: 'privacidad.html',
    LICENSE: 'LICENCIA',
  },
});

/* ============================================================================
   UTILIDADES (puras y sin efectos globales al importar)
   ============================================================================ */

export const UTILS = Object.freeze({
  /* ----------------------------- Estado ---------------------------------- */
  getState(key, fallback = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch {
      return fallback;
    }
  },

  setState(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  removeState(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clearState() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  hasState(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },

  /* ---------------------------- Navegación -------------------------------- */
  scrollToElement(element, offset = 0) {
    if (!element) return;
    const behavior = this.prefersReducedMotion() ? 'auto' : 'smooth';
    const rect = element.getBoundingClientRect();
    const top = rect.top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior });
  },

  scrollToTop(behavior) {
    window.scrollTo({
      top: 0,
      behavior: behavior || (this.prefersReducedMotion() ? 'auto' : 'smooth'),
    });
  },

  /* -------------------------- Preferencias -------------------------------- */
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  prefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },

  prefersLight() {
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  },

  /* ----------------------- Detección de dispositivos ---------------------- */
  isMobileDevice() {
    return window.innerWidth < CONSTANTS.BREAKPOINTS.MD;
  },

  isTabletDevice() {
    return (
      window.innerWidth >= CONSTANTS.BREAKPOINTS.MD &&
      window.innerWidth < CONSTANTS.BREAKPOINTS.LG
    );
  },

  isDesktopDevice() {
    return window.innerWidth >= CONSTANTS.BREAKPOINTS.LG;
  },

  matchMedia(breakpoint) {
    const map = {
      sm: CONSTANTS.BREAKPOINTS.SM,
      md: CONSTANTS.BREAKPOINTS.MD,
      lg: CONSTANTS.BREAKPOINTS.LG,
      xl: CONSTANTS.BREAKPOINTS.XL,
      '2xl': CONSTANTS.BREAKPOINTS.XXL,
    };
    const width = map[breakpoint] || Number(breakpoint) || 0;
    return window.innerWidth < width;
  },

  isTouchDevice() {
    return (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints || 0) > 0
    );
  },

  isOnline() {
    return navigator.onLine;
  },

  /* ---------------------------- Viewport ---------------------------------- */
  isElementInViewport(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top <= window.innerHeight &&
      rect.bottom >= 0 &&
      rect.left <= window.innerWidth &&
      rect.right >= 0
    );
  },

  getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.devicePixelRatio || 1,
      orientation:
        window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
    };
  },

  /* --------------------------- Descargas ---------------------------------- */
  downloadFile(url, filename) {
    if (!url) return false;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || url.split('/').pop();
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 100);
    return true;
  },

  /* -------------------------- Formateo ----------------------------------- */
  formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    }
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  },

  formatDate(dateString, locale = 'es-CO') {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  },

  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  truncate(text, length = 100, suffix = '…') {
    if (!text) return '';
    return text.length <= length ? text : text.slice(0, length).trim() + suffix;
  },

  generateId(prefix = 'id') {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 9);
    return `${prefix}_${ts}_${rand}`;
  },

  /* -------------------------- Validación --------------------------------- */
  isValidEmail(email) {
    if (typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  },

  /* -------------------------- Utilidades DOM ------------------------------ */
  debounce(fn, wait = 200, immediate = false) {
    let timeout;
    return function debounced(...args) {
      const ctx = this;
      const later = () => {
        timeout = null;
        if (!immediate) fn.apply(ctx, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) fn.apply(ctx, args);
    };
  },

  throttle(fn, limit = 200) {
    let inThrottle = false;
    return function throttled(...args) {
      if (inThrottle) return;
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    };
  },

  createElement(tag, attributes = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'dataset' && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (value === true) {
        el.setAttribute(key, '');
      } else if (value !== false && value != null) {
        el.setAttribute(key, String(value));
      }
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child == null) return;
      el.appendChild(
        typeof child === 'string' ? document.createTextNode(child) : child
      );
    });
    return el;
  },

  /* -------------------------- Portapapeles -------------------------------- */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  },

  /* -------------------------- URL params --------------------------------- */
  getUrlParams() {
    const params = {};
    const query = window.location.search.replace(/^\?/, '');
    if (!query) return params;
    query.split('&').forEach((pair) => {
      const [k, v = ''] = pair.split('=');
      if (!k) return;
      params[decodeURIComponent(k)] = decodeURIComponent(v);
    });
    return params;
  },

  /* -------------------------- Soporte navegador --------------------------- */
  supportsWebP() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width > 0);
      img.onerror = () => resolve(false);
      img.src =
        'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    });
  },

  supportsServiceWorker() {
    return 'serviceWorker' in navigator;
  },

  supportsNotifications() {
    return 'Notification' in window;
  },

  /* -------------------------- Performance -------------------------------- */
  measurePerformance(name, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    if (window?.console?.debug) {
      console.debug(`[perf] ${name}: ${(end - start).toFixed(2)}ms`);
    }
    return result;
  },

  /* -------------------------- Storage info ------------------------------- */
  async getStorageInfo() {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null;
    }
    try {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      return {
        used: usage,
        quota,
        percentage: quota ? Number(((usage / quota) * 100).toFixed(2)) : 0,
      };
    } catch {
      return null;
    }
  },

  /* -------------------------- Helpers de URL ------------------------------ */
  buildMailto({ email, subject, body }) {
    if (!email) return 'mailto:';
    const params = [];
    if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
    if (body) params.push(`body=${encodeURIComponent(body)}`);
    return `mailto:${email}${params.length ? '?' + params.join('&') : ''}`;
  },

  resolveAsset(path) {
    if (!path) return '';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(path)) return path;
    return path;
  },

  /* -------------------------- Fecha ISO ---------------------------------- */
  toISODate(date = new Date()) {
    return date.toISOString().slice(0, 10);
  },

  /* -------------------------- Limpieza suave ------------------------------ */
  escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
});

/* ============================================================================
   ERRORES
   ============================================================================ */

export class AppError extends Error {
  constructor(message, code = 'APP_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

/* ============================================================================
   VALIDADORES (opcional, reutilizables por main.js/validación.js)
   ============================================================================ */

export const Validators = Object.freeze({
  required(value) {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },
  minLength(value, n = 2) {
    return typeof value === 'string' && value.trim().length >= n;
  },
  maxLength(value, n = 5000) {
    return typeof value === 'string' && value.length <= n;
  },
  email(value) {
    return UTILS.isValidEmail(value);
  },
  phone(value) {
    return UTILS.isValidPhone(value);
  },
});

/* ============================================================================
   EXPORT POR DEFECTO
   ============================================================================ */

export default {
  CONFIG,
  CONSTANTS,
  UTILS,
  Validators,
  AppError,
};
