/**
 * ============================================================================
 * utils.js — YSHDD EPK Premium 2027
 * Utilidades compartidas del EPK.
 *
 * Objetivo:
 * - Exponer helpers reutilizables SIN duplicar los que ya existen en
 *   `config.js` (UTILS y Validators).
 * - Todo lo que ya está en `UTILS` se reexporta para que este módulo sea
 *   el punto de entrada canónico en el resto del código.
 * - Añadir helpers específicos del EPK: DOM seguro, cookies, storage,
 *   URLs, descargas, debounce/throttle, media queries, files.
 *
 * Reglas:
 * - Sin dependencias externas.
 * - Sin APIs inexistentes (sin `gtag` ficticio, sin `fetch` a backends).
 * - Seguro ante ausencia de `localStorage`, `cookies`, `navigator.connection`.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS, Validators, AppError } from './config.js';

/* ============================================================================
   Estado / Storage
   ============================================================================ */

const Storage = {
  set(key, value, storage = 'local') {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage;
      store.setItem(key, JSON.stringify({
        v: CONFIG?.app?.version || '0',
        t: Date.now(),
        value,
      }));
      return true;
    } catch {
      return false;
    }
  },

  get(key, storage = 'local', maxAge = null) {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage;
      const raw = store.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (maxAge && Date.now() - parsed.t > maxAge) {
        store.removeItem(key);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  },

  remove(key, storage = 'local') {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage;
      store.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear(storage = 'local') {
    try {
      const store = storage === 'session' ? sessionStorage : localStorage;
      store.clear();
      return true;
    } catch {
      return false;
    }
  },
};

/* ============================================================================
   Cookies (opt-in, solo si el proyecto lo requiere)
   ============================================================================ */

const Cookies = {
  set(name, value, days = 365) {
    if (typeof document === 'undefined') return false;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict`;
    return true;
  },

  get(name) {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    return (
      document.cookie
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(prefix))
        ?.slice(prefix.length) ?? null
    );
  },

  remove(name) {
    if (typeof document === 'undefined') return false;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    return true;
  },
};

/* ============================================================================
   URL helpers
   ============================================================================ */

const URLs = {
  getParam(key) {
    return new URL(window.location.href).searchParams.get(key);
  },

  updateParams(params = {}, replace = true) {
    const url = new URL(window.location.href);
    Object.entries(params).forEach(([k, v]) => {
      if (v == null) url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    });
    (replace ? history.replaceState : history.pushState).call(
      history, {}, '', url.toString()
    );
    return url.toString();
  },

  removeParam(key) {
    return URLs.updateParams({ [key]: null });
  },

  share(params = {}) {
    const url = new URL(window.location.origin + window.location.pathname);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return url.toString();
  },
};

/* ============================================================================
   DOM helpers (seguros)
   ============================================================================ */

const DOM = {
  $: (sel, ctx = document) => ctx.querySelector(sel),
  $$: (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel)),

  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'dataset' && value && typeof value === 'object') {
        Object.assign(el.dataset, value);
      } else if (key === 'style' && value && typeof value === 'object') {
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

  remove(el) { el?.parentElement?.removeChild(el); },

  async fadeOut(el, duration = 300) {
    if (!el) return;
    if (UTILS.prefersReducedMotion()) { el.remove(); return; }
    el.style.transition = `opacity ${duration}ms`;
    el.style.opacity = '0';
    await new Promise((r) => setTimeout(r, duration));
    el.remove();
  },

  async fadeIn(el, duration = 300) {
    if (!el) return;
    el.style.opacity = '0';
    el.style.transition = `opacity ${duration}ms`;
    el.style.display = '';
    await new Promise((r) => requestAnimationFrame(r));
    el.style.opacity = '1';
    await new Promise((r) => setTimeout(r, duration));
  },

  scrollTo(target, offset = 100, behavior) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top,
      behavior: behavior || (UTILS.prefersReducedMotion() ? 'auto' : 'smooth'),
    });
  },

  scrollTop(behavior) {
    window.scrollTo({
      top: 0,
      behavior: behavior || (UTILS.prefersReducedMotion() ? 'auto' : 'smooth'),
    });
  },

  on(target, event, handler, options = {}) {
    target?.addEventListener?.(event, handler, options);
    return () => target?.removeEventListener?.(event, handler, options);
  },

  delegate(root, selector, event, handler) {
    const listener = (e) => {
      const target = e.target.closest(selector);
      if (target && root.contains(target)) handler(e, target);
    };
    root.addEventListener(event, listener);
    return () => root.removeEventListener(event, listener);
  },
};

/* ============================================================================
   Formato
   ============================================================================ */

const Format = {
  date(date, locale = 'es-CO') {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale, {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  },

  relative(date) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const sec = Math.floor(diff / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);

    if (day > 30) return Format.date(d);
    if (day > 0) return `hace ${day} día${day > 1 ? 's' : ''}`;
    if (hr > 0) return `hace ${hr} hora${hr > 1 ? 's' : ''}`;
    if (min > 0) return `hace ${min} minuto${min > 1 ? 's' : ''}`;
    return 'hace unos segundos';
  },

  duration(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  },

  number(n) { return UTILS.formatNumber(n); },

  currency(amount, currency = 'COP', locale = 'es-CO') {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
      return String(amount);
    }
  },

  percent(value, decimals = 1) {
    if (!Number.isFinite(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  },
};

/* ============================================================================
   Strings
   ============================================================================ */

const Strings = {
  truncate(str, length = 100, suffix = '…') {
    if (!str) return '';
    return str.length <= length ? str : str.slice(0, length).trim() + suffix;
  },
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  titleCase(str) {
    if (!str) return '';
    return str.toLowerCase().split(/\s+/).map(Strings.capitalize).join(' ');
  },
  slugify(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  },
  random(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  },
};

/* ============================================================================
   Arrays
   ============================================================================ */

const Arrays = {
  chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  },
  shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  unique(arr) { return [...new Set(arr)]; },
  sortBy(arr, key, order = 'asc') {
    return [...arr].sort((a, b) => {
      const av = a?.[key];
      const bv = b?.[key];
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return order === 'asc' ? cmp : -cmp;
    });
  },
};

/* ============================================================================
   Objetos
   ============================================================================ */

const Objects = {
  clone(obj) { return JSON.parse(JSON.stringify(obj)); },
  merge(...objs) { return Object.assign({}, ...objs); },
  filter(obj, pred) {
    return Object.fromEntries(Object.entries(obj).filter(([k, v]) => pred(k, v)));
  },
  map(obj, fn) {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => fn(k, v)));
  },
};

/* ============================================================================
   Timing
   ============================================================================ */

const Timing = {
  debounce(fn, wait = 200, immediate = false) {
    let timer = null;
    return function debounced(...args) {
      const ctx = this;
      const later = () => {
        timer = null;
        if (!immediate) fn.apply(ctx, args);
      };
      const callNow = immediate && !timer;
      clearTimeout(timer);
      timer = setTimeout(later, wait);
      if (callNow) fn.apply(ctx, args);
    };
  },
  throttle(fn, limit = 200) {
    let lock = false;
    return function throttled(...args) {
      if (lock) return;
      fn.apply(this, args);
      lock = true;
      setTimeout(() => (lock = false), limit);
    };
  },
  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },
};

/* ============================================================================
   Archivos y descargas
   ============================================================================ */

const Files = {
  readAsText(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target?.result ?? '');
      r.onerror = reject;
      r.readAsText(file);
    });
  },
  readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = (e) => resolve(e.target?.result ?? '');
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  },
  downloadText(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
  },
  downloadJSON(data, filename) {
    Files.downloadText(JSON.stringify(data, null, 2), filename, 'application/json');
  },
};

/* ============================================================================
   Media queries
   ============================================================================ */

const Media = {
  query(bp) {
    const map = {
      sm: `(max-width: ${CONSTANTS.BREAKPOINTS.SM}px)`,
      md: `(max-width: ${CONSTANTS.BREAKPOINTS.MD}px)`,
      lg: `(max-width: ${CONSTANTS.BREAKPOINTS.LG}px)`,
      xl: `(max-width: ${CONSTANTS.BREAKPOINTS.XL}px)`,
    };
    return map[bp] || bp;
  },
  matches(bp) {
    return window.matchMedia(Media.query(bp)).matches;
  },
  onChange(bp, cb) {
    const mql = window.matchMedia(Media.query(bp));
    const handler = (e) => cb(e.matches);
    mql.addEventListener?.('change', handler);
    cb(mql.matches);
    return () => mql.removeEventListener?.('change', handler);
  },
};

/* ============================================================================
   Conexión / storage
   ============================================================================ */

const Env = {
  connection() {
    const c = navigator.connection || {};
    return {
      online: navigator.onLine,
      effectiveType: c.effectiveType || 'unknown',
      downlink: c.downlink || 0,
      rtt: c.rtt || 0,
      saveData: Boolean(c.saveData),
    };
  },

  onConnectionChange(cb) {
    const handler = () => cb(Env.connection());
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    navigator.connection?.addEventListener?.('change', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
      navigator.connection?.removeEventListener?.('change', handler);
    };
  },

  async storageInfo() { return UTILS.getStorageInfo(); },
};

/* ============================================================================
   Logger / errores
   ============================================================================ */

const Log = {
  info: (...a) => console.info('[YSHDD]', ...a),
  warn: (...a) => console.warn('[YSHDD]', ...a),
  error: (...a) => console.error('[YSHDD]', ...a),
  debug: (...a) => {
    if (window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1') {
      console.debug('[YSHDD:debug]', ...a);
    }
  },
};

const Errors = {
  handle(error, context = 'general') {
    const payload = {
      message: error?.message || String(error),
      context,
      stack: error?.stack || null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };
    Log.error('Error en', context, payload);
    if (window.YSHDD?.emit) window.YSHDD.emit('error', payload);
    return payload;
  },

  async tryCatchAsync(fn, context = 'async') {
    try { return await fn(); }
    catch (e) { Errors.handle(e, context); return null; }
  },

  tryCatch(fn, context = 'sync') {
    try { return fn(); }
    catch (e) { Errors.handle(e, context); return null; }
  },
};

/* ============================================================================
   API pública (objeto único)
   ============================================================================ */

export const U = {
  Storage,
  Cookies,
  URLs,
  DOM,
  Format,
  Strings,
  Arrays,
  Objects,
  Timing,
  Files,
  Media,
  Env,
  Log,
  Errors,
  // Reexport de config
  CONFIG,
  CONSTANTS,
  UTILS,
  Validators,
  AppError,
};

export default U;

/* ============================================================================
   Auto-bind
   ============================================================================ */

if (typeof window !== 'undefined') {
  const bind = () => {
    window.YSHDDUtils = U;
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.utils = U;
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
