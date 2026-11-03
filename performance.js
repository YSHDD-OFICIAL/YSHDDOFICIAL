/**
 * ============================================================================
 * performance.js — YSHDD EPK Premium 2027
 * Monitor de Core Web Vitals y rendimiento en cliente.
 *
 * Objetivos:
 * - Medir FCP, LCP, FID, CLS, TTFB, INP (Core Web Vitals 2027).
 * - Observar recursos pesados y long tasks.
 * - Reaccionar a cambios de conexión y visibilidad.
 * - 100% estático: no envía datos a ningún backend (no existe).
 *   Los datos se loguean en consola y se guardan localmente (opt-in).
 *
 * Reglas del proyecto:
 * - Sin dependencias externas.
 * - No romper nada si el navegador no soporta alguna API.
 * - Sin `gtag()` si `CONFIG.features.analytics.enabled === false`.
 * - No usar `performance.timing` (deprecado); solo Navigation Timing v2.
 * - Compatible con pages/Netlify (sin backend).
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Umbrales (Core Web Vitals 2027)
   ============================================================================ */

const THRESHOLDS = Object.freeze({
  fcp:  { good: 1800, poor: 3000 },
  lcp:  { good: 2500, poor: 4000 },
  fid:  { good: 100,  poor: 300 },
  inp:  { good: 200,  poor: 500 },
  cls:  { good: 0.1,  poor: 0.25 },
  ttfb: { good: 800,  poor: 1800 },
  tti:  { good: 3800, poor: 7300 },
});

const STORAGE_KEY = 'yshdd-performance-metrics';
const SUGGESTIONS_KEY = 'yshdd-performance-suggestions';
const MAX_STORED = 100;

/* ============================================================================
   Utilidades internas
   ============================================================================ */

const isProd = () => window.location.hostname !== 'localhost'
  && window.location.hostname !== '127.0.0.1';

const supportsPerformanceObserver =
  typeof PerformanceObserver !== 'undefined';

const statusFor = (metric, value) => {
  const t = THRESHOLDS[metric];
  if (!t || typeof value !== 'number') return 'unknown';
  if (value <= t.good) return 'good';
  if (value <= t.poor) return 'needs_improvement';
  return 'poor';
};

/* ============================================================================
   Clase
   ============================================================================ */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fcp: null,
      lcp: null,
      fid: null,
      inp: null,
      cls: null,
      ttfb: null,
      tti: null,
      memory: null,
    };

    this.observers = [];
    this.resources = [];
    this.longTasks = [];
    this.visibilityEvents = [];
    this.networkEvents = [];

    this.thresholds = THRESHOLDS;

    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this._initialized = false;
    this._destroyed = false;

    // Solo se activa en producción para no ensuciar desarrollo.
    if (isProd()) this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.setupPerformanceObservers();
    this.setupNavigationTiming();
    this.trackResources();
    this.monitorLongTasks();
    this.setupVisibilityListener();
    this.setupNetworkListener();

    window.addEventListener('load', () => {
      // Pequeño delay para capturar LCP final
      setTimeout(() => this.collectMetrics(), 1200);
    }, { once: true });
  }

  /* ------------------------------------------------------------------------ */
  /* Observers                                                                */
  /* ------------------------------------------------------------------------ */

  setupPerformanceObservers() {
    if (!supportsPerformanceObserver) return;

    // LCP
    this.observe('largest-contentful-paint', (list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) {
        this.metrics.lcp = last.startTime;
        this.reportMetric('lcp', last.startTime);
      }
    });

    // CLS
    this.observe('layout-shift', (list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          this.metrics.cls = (this.metrics.cls || 0) + entry.value;
        }
      }
    });

    // FID (legacy) + first-input
    this.observe('first-input', (list) => {
      for (const entry of list.getEntries()) {
        this.metrics.fid = entry.processingStart - entry.startTime;
        this.reportMetric('fid', this.metrics.fid);
      }
    });

    // INP (Interaction to Next Paint)
    this.observe('event', (list) => {
      for (const entry of list.getEntries()) {
        if (!entry.interactionId) continue;
        const dur = entry.duration;
        if (!this.metrics.inp || dur > this.metrics.inp) {
          this.metrics.inp = dur;
          this.reportMetric('inp', dur);
        }
      }
    });
  }

  observe(type, handler) {
    try {
      const obs = new PerformanceObserver((list) => handler(list));
      obs.observe({ type, buffered: true });
      this.observers.push(obs);
    } catch {
      /* tipo no soportado por el navegador */
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Navigation Timing (v2)                                                   */
  /* ------------------------------------------------------------------------ */

  setupNavigationTiming() {
    if (!('performance' in window)) return;
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (!nav) return;

    this.metrics.ttfb = nav.responseStart - nav.requestStart;

    const fcp = performance.getEntriesByName?.('first-contentful-paint')?.[0];
    if (fcp) {
      this.metrics.fcp = fcp.startTime;
      this.reportMetric('fcp', fcp.startTime);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Recursos                                                                 */
  /* ------------------------------------------------------------------------ */

  trackResources() {
    if (!supportsPerformanceObserver) return;
    this.observe('resource', (list) => {
      for (const entry of list.getEntries()) {
        this.resources.push({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          transferSize: entry.transferSize || 0,
          encodedBodySize: entry.encodedBodySize || 0,
        });
      }
      this.analyzeHeavyResources();
    });
  }

  analyzeHeavyResources() {
    const heavy = this.resources.filter(
      (r) => r.duration > 1000 || r.transferSize > 500 * 1024
    );
    if (!heavy.length) return;

    if (CONFIG?.features?.analytics?.enabled && typeof window.gtag === 'function') {
      window.gtag('event', 'heavy_resource', {
        event_category: 'performance',
        event_label: 'resource_load',
        value: heavy.length,
      });
    }

    this.suggestOptimizations(heavy);
  }

  suggestOptimizations(resources) {
    const suggestions = [];

    for (const r of resources) {
      if (r.type === 'img' && r.transferSize > 200 * 1024) {
        suggestions.push({
          type: 'image',
          url: r.name,
          size: UTILS.formatNumber(r.transferSize),
          suggestion: 'Convertir a WebP / AVIF y optimizar tamaño.',
        });
      }
      if (r.type === 'script' && r.duration > 500) {
        suggestions.push({
          type: 'script',
          url: r.name,
          duration: r.duration.toFixed(0),
          suggestion: 'Aplicar code splitting o diferir ejecución.',
        });
      }
      if (r.type === 'css' && r.transferSize > 50 * 1024) {
        suggestions.push({
          type: 'css',
          url: r.name,
          size: UTILS.formatNumber(r.transferSize),
          suggestion: 'Minificar y purgar CSS no utilizado.',
        });
      }
      if (r.type === 'font' && r.transferSize > 100 * 1024) {
        suggestions.push({
          type: 'font',
          url: r.name,
          size: UTILS.formatNumber(r.transferSize),
          suggestion: 'Usar font-display: swap y subset.',
        });
      }
    }

    if (suggestions.length) {
      try {
        localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions.slice(0, 50)));
      } catch { /* no-op */ }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Long Tasks                                                               */
  /* ------------------------------------------------------------------------ */

  monitorLongTasks() {
    if (!supportsPerformanceObserver) return;
    this.observe('longtask', (list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration < 50) continue;
        this.longTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name || 'unknown',
        });
        if (entry.duration > 100) this.reportLongTask(entry);
      }
    });
  }

  reportLongTask(task) {
    if (CONFIG?.features?.analytics?.enabled && typeof window.gtag === 'function') {
      window.gtag('event', 'long_task', {
        event_category: 'performance',
        event_label: task.name,
        value: Math.round(task.duration),
      });
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Visibilidad                                                              */
  /* ------------------------------------------------------------------------ */

  setupVisibilityListener() {
    let hiddenAt = 0;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenAt = Date.now();
        return;
      }
      const hiddenDuration = Date.now() - hiddenAt;
      this.visibilityEvents.push({
        timestamp: new Date().toISOString(),
        hiddenDuration,
      });
      if (hiddenDuration > 10_000) {
        if (CONFIG?.features?.analytics?.enabled && typeof window.gtag === 'function') {
          window.gtag('event', 'visibility_change', {
            event_category: 'user_behavior',
            event_label: 'returned',
            value: Math.round(hiddenDuration / 1000),
          });
        }
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Red                                                                      */
  /* ------------------------------------------------------------------------ */

  setupNetworkListener() {
    const push = (status) => {
      this.networkEvents.push({
        status,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || null,
        rtt: navigator.connection?.rtt || null,
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('online', () => push('online'));
    window.addEventListener('offline', () => push('offline'));

    const conn = navigator.connection;
    if (conn && typeof conn.addEventListener === 'function') {
      conn.addEventListener('change', () => push('change'));
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Métricas                                                                 */
  /* ------------------------------------------------------------------------ */

  collectMetrics() {
    // TTI estimado (sin backend): DCL o Load event (lo que ocurra último).
    const nav = performance.getEntriesByType?.('navigation')?.[0];
    if (nav) {
      const dcl = nav.domContentLoadedEventEnd;
      const load = nav.loadEventEnd;
      this.metrics.tti = Math.max(dcl, load);
      this.reportMetric('tti', this.metrics.tti);
    }

    // Memoria (Chrome only)
    if (performance.memory) {
      this.metrics.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }

    this.reportAllMetrics();
    this.optimizeAfterLoad();
  }

  reportMetric(name, value) {
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    const status = statusFor(name, value);
    this.storeMetric(name, value, status);

    if (CONFIG?.features?.analytics?.enabled && typeof window.gtag === 'function') {
      window.gtag('event', 'performance_metric', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(value),
        metric_status: status,
      });
    }
  }

  reportAllMetrics() {
    // Solo debug en consola si estamos en prod y el usuario lo pide
    if (window.YSHDD?.config?.app?.channel === 'development') {
      console.group?.('[perf] Core Web Vitals');
      Object.entries(this.metrics).forEach(([k, v]) => {
        if (typeof v === 'number') {
          console.log?.(`${k}: ${v.toFixed(2)} (${statusFor(k, v)})`);
        }
      });
      console.groupEnd?.();
    }
  }

  storeMetric(name, value, status) {
    try {
      const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      arr.push({ name, value, status, ts: new Date().toISOString() });
      if (arr.length > MAX_STORED) arr.splice(0, arr.length - MAX_STORED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch { /* no-op */ }
  }

  /* ------------------------------------------------------------------------ */
  /* Optimizaciones post-load                                                 */
  /* ------------------------------------------------------------------------ */

  optimizeAfterLoad() {
    this.lazyLoadImages();
    this.preconnectDomains();
  }

  lazyLoadImages() {
    document
      .querySelectorAll('img[data-src]:not(.loaded)')
      .forEach((img) => {
        if (UTILS.isElementInViewport(img)) {
          img.src = img.dataset.src;
          img.classList.add('loaded');
        }
      });
  }

  preconnectDomains() {
    const domains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://www.youtube-nocookie.com',
      'https://open.spotify.com',
    ];
    domains.forEach((domain) => {
      if (document.querySelector(`link[rel="preconnect"][href="${domain}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  getMetrics() { return { ...this.metrics }; }
  getResources() { return [...this.resources]; }
  getLongTasks() { return [...this.longTasks]; }
  getSuggestions() {
    try {
      return JSON.parse(localStorage.getItem(SUGGESTIONS_KEY) || '[]');
    } catch { return []; }
  }

  clearData() {
    this.metrics = {
      fcp: null, lcp: null, fid: null, inp: null,
      cls: null, ttfb: null, tti: null, memory: null,
    };
    this.resources = [];
    this.longTasks = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(SUGGESTIONS_KEY);
    } catch { /* no-op */ }
  }

  destroy() {
    this._destroyed = true;
    this.observers.forEach((o) => {
      try { o.disconnect(); } catch { /* no-op */ }
    });
    this.observers = [];
  }
}

/* ============================================================================
   Singleton
   ============================================================================ */

let instance = null;

export function getPerformanceMonitor() {
  if (!instance) instance = new PerformanceMonitor();
  return instance;
}

export default getPerformanceMonitor;

/* ============================================================================
   Auto-bind a YSHDD
   ============================================================================ */

if (typeof window !== 'undefined') {
  const bind = () => {
    const monitor = getPerformanceMonitor();
    window.YSHDDPerformance = monitor;
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.performance = monitor;
      window.YSHDD.state.modules.rendimiento = monitor;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
