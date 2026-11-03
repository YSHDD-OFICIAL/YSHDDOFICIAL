/**
 * ============================================================================
 * analytics.js — YSHDD EPK Premium 2027
 * Capa de analítica del EPK (100% estático, sin backend propio).
 *
 * IMPORTANTE
 * ----------
 * - El repo NO tiene un ID real de Google Analytics.
 *   CONFIG.features.analytics.enabled === false y CONFIG.api.keys.analytics
 *   no contiene un ID válido (es placeholder "G-XXXXXXXXXX").
 * - Este módulo está preparado para activarse si en el futuro se configura
 *   un ID real, SIN enviar datos a ningún servicio mientras no lo haya.
 * - Fallback local: los eventos se guardan en un buffer en memoria y, si el
 *   usuario lo permite, se persisten en localStorage (solo para debug).
 * - Nada de `fetch()` a endpoints inexistentes.
 * - Nada de `gtag('config', 'G-XXXXXXXXXX', ...)` (ID inventado).
 *
 * A11Y
 * ----
 * - No modifica el DOM visible del usuario.
 * - No bloquea interacciones.
 *
 * Uso
 * ---
 *   import { getAnalytics } from './analytics.js';
 *   const A = getAnalytics();
 *   A.trackEvent('streaming', 'click', 'Spotify');
 *   A.trackPageView('Música', '/#music');
 *
 * Compatibilidad
 * --------------
 * - Con `window.YSHDD.emit(...)` (main.js) para reemitir eventos.
 * - Con el `state.modules.analytics` del EPK.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Constantes locales
   ============================================================================ */

const STORAGE_KEY = 'yshdd-analytics-buffer';
const MAX_BUFFER = 100;

const PLACEHOLDER_ID_PATTERN = /X{4,}/i;

/* ============================================================================
   Clase Analytics
   ============================================================================ */

export class Analytics {
  constructor(options = {}) {
    this.options = {
      debug: false,
      persistBuffer: true,
      ...options,
    };

    this.trackingId = this.resolveTrackingId();
    this.enabled = Boolean(
      CONFIG?.features?.analytics?.enabled && this.trackingId
    );

    this.buffer = [];
    this.pageViewOnce = new Set();
    this._handlers = [];
    this._bound = false;

    // Restaurar buffer previo (solo debug)
    if (this.options.persistBuffer) this.loadBuffer();

    this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  init() {
    if (this._bound) return;
    this._bound = true;

    // Si hay un ID real y analytics habilitado → registrar gtag
    if (this.enabled) {
      this.setupGtag();
    }

    // Añadir listeners de interacción
    this.bindAutoTrack();

    // Reemitir a YSHDD
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.analytics = this;
    }
    window.YSHDDAnalytics = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Tracking ID                                                              */
  /* ------------------------------------------------------------------------ */

  resolveTrackingId() {
    const id = CONFIG?.api?.keys?.analytics;
    if (!id || typeof id !== 'string') return null;
    if (PLACEHOLDER_ID_PATTERN.test(id)) return null;
    if (!/^G-[A-Z0-9]{6,}$/i.test(id)) return null;
    return id;
  }

  /* ------------------------------------------------------------------------ */
  /* gtag (solo si hay ID real)                                               */
  /* ------------------------------------------------------------------------ */

  setupGtag() {
    // gtag.js debe cargarse con <script async> en <head> SOLO si el ID es real.
    // Aquí no lo inyectamos para no cargar analítica sin consentimiento.
    // En su lugar, exponemos un wrapper seguro: si window.gtag existe, se usa.
    if (typeof window.gtag !== 'function') {
      // Fallback local (no envía nada): acumula en dataLayer.
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
    try {
      window.gtag('js', new Date());
      window.gtag('config', this.trackingId, {
        page_title: document.title,
        page_path: window.location.pathname + window.location.hash,
        anonymize_ip: true,
        send_page_view: true,
      });
    } catch (err) {
      console.warn('[analytics] gtag init error:', err?.message || err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Eventos                                                                  */
  /* ------------------------------------------------------------------------ */

  /**
   * Envía un evento de analítica.
   * - Si hay gtag real → envía a Google.
   * - Si no → lo guarda en el buffer local (y opcionalmente en localStorage).
   * - Emite `YSHDD.emit('analytics:event', payload)` si existe.
   */
  trackEvent(category, action, label = '', value = undefined) {
    const payload = {
      t: new Date().toISOString(),
      category: String(category || 'general'),
      action: String(action || 'unknown'),
      label: label != null ? String(label) : '',
      value: Number.isFinite(value) ? value : undefined,
      path: window.location.pathname + window.location.hash,
      title: document.title,
    };

    // gtag real
    if (this.enabled && typeof window.gtag === 'function') {
      try {
        window.gtag('event', payload.action, {
          event_category: payload.category,
          event_label: payload.label,
          value: payload.value,
          page_path: payload.path,
        });
      } catch { /* no-op */ }
    }

    // Buffer local
    this.pushToBuffer(payload);

    // Reemitir
    if (window.YSHDD?.emit) window.YSHDD.emit('analytics:event', payload);

    if (this.options.debug) console.info('[analytics]', payload);
    return payload;
  }

  trackPageView(pageTitle, pagePath) {
    const key = `${pagePath || window.location.pathname + window.location.hash}`;
    if (this.pageViewOnce.has(key)) return null;
    this.pageViewOnce.add(key);

    const payload = {
      t: new Date().toISOString(),
      title: pageTitle || document.title,
      path: key,
    };

    if (this.enabled && typeof window.gtag === 'function') {
      try {
        window.gtag('event', 'page_view', {
          page_title: payload.title,
          page_path: payload.path,
        });
      } catch { /* no-op */ }
    }

    this.pushToBuffer({ category: 'page', action: 'view', ...payload });

    if (window.YSHDD?.emit) window.YSHDD.emit('analytics:page', payload);
    if (this.options.debug) console.info('[analytics:page]', payload);
    return payload;
  }

  /* ------------------------------------------------------------------------ */
  /* Buffer local                                                             */
  /* ------------------------------------------------------------------------ */

  pushToBuffer(entry) {
    this.buffer.push(entry);
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer.splice(0, this.buffer.length - MAX_BUFFER);
    }
    if (this.options.persistBuffer) this.saveBuffer();
  }

  saveBuffer() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.buffer));
    } catch { /* no-op */ }
  }

  loadBuffer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) this.buffer = arr.slice(-MAX_BUFFER);
    } catch { /* no-op */ }
  }

  getBuffer() {
    return [...this.buffer];
  }

  clearBuffer() {
    this.buffer = [];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  }

  /* ------------------------------------------------------------------------ */
  /* Auto-track                                                               */
  /* ------------------------------------------------------------------------ */

  bindAutoTrack() {
    // Delegación global de clicks sobre plataformas y redes
    const onClick = (e) => {
      const a = e.target.closest('a, button');
      if (!a) return;

      // Plataformas oficiales
      if (a.matches('.platforms a, .platforms-list a, .playlists-list a, .hero-platforms a')) {
        const label =
          a.getAttribute('aria-label') ||
          a.textContent?.trim() ||
          a.getAttribute('href') ||
          '';
        this.trackEvent('streaming', 'click', label);
        return;
      }

      // Redes sociales (footer)
      if (a.matches('.footer-social a, .social-icons a')) {
        const label =
          a.getAttribute('aria-label') ||
          a.textContent?.trim() ||
          '';
        this.trackEvent('social', 'click', label);
        return;
      }

      // Botones de descarga / EPK
      if (a.matches('[download], a[href$=".pdf"], a[href^="mailto:"]')) {
        const label =
          a.getAttribute('aria-label') ||
          a.textContent?.trim() ||
          a.getAttribute('href') ||
          '';
        this.trackEvent('download', 'click', label);
      }
    };

    document.addEventListener('click', onClick, true);
    this._handlers.push(() => document.removeEventListener('click', onClick, true));

    // Formularios (submit)
    const onSubmit = (e) => {
      const form = e.target.closest('form');
      if (!form) return;
      const kind = form.dataset.formKind || form.id || 'form';
      this.trackEvent('form', 'submit', kind);
    };
    document.addEventListener('submit', onSubmit, true);
    this._handlers.push(() => document.removeEventListener('submit', onSubmit, true));

    // Cambios de hash → page_view virtual
    const onHashChange = () => {
      this.trackPageView(document.title, window.location.pathname + window.location.hash);
    };
    window.addEventListener('hashchange', onHashChange);
    this._handlers.push(() => window.removeEventListener('hashchange', onHashChange));

    // Primera page_view
    this.trackPageView(document.title, window.location.pathname + window.location.hash);
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  isEnabled() { return this.enabled; }

  getTrackingId() { return this.trackingId; }

  destroy() {
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    this._bound = false;
    if (window.YSHDDAnalytics === this) window.YSHDDAnalytics = null;
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getAnalytics() {
  if (!instance) instance = new Analytics();
  return instance;
}

export default getAnalytics;

if (typeof window !== 'undefined') {
  const bind = () => {
    const a = getAnalytics();
    window.YSHDDAnalytics = a;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
