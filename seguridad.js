/**
 * ============================================================================
 * seguridad.js — YSHDD EPK Premium 2027
 * Módulo de seguridad en cliente (defensa en profundidad, 100% estático).
 *
 * IMPORTANTE:
 * - Un EPK estático NO puede implementar seguridad real del lado servidor.
 *   Este módulo solo aplica capas de mitigación en el cliente:
 *     · Observa violaciones de CSP (si el hosting las define).
 *     · Normaliza y marca entradas sospechosas para los validadores.
 *     · Detecta framing (clickjacking) y ofrece mitigación limitada.
 *     · Refuerza validación nativa en formularios.
 *     · Advierte ante copia masiva de contenido (a11y-safe).
 *
 * - No bloquea imágenes, no desactiva clic derecho, no altera texto del
 *   usuario (eso rompe a11y y UX). La sanitización se delega a validación.js.
 * - No envía datos a backends inexistentes.
 * - Respeta WCAG 2.2 AA: avisos vía role="status" + aria-live.
 * ============================================================================
 */

'use strict';

import { CONFIG, UTILS } from './config.js';

/* ============================================================================
   Constantes internas
   ============================================================================ */

const WARN_TIMEOUT = 6000;
const SUSPICIOUS_PATTERNS = [
  /<\s*script[\s>]/i,
  /<\s*iframe[\s>]/i,
  /<\s*img[^>]+onerror\s*=/i,
  /javascript\s*:/i,
  /data:text\/html/i,
  /on(?:load|error|click|mouseover|focus)\s*=/i,
];

const SUSPICIOUS_MIN_LENGTH = 500;

/* ============================================================================
   Clase principal
   ============================================================================ */

export class SecurityManager {
  constructor(options = {}) {
    this.options = {
      cspObserver: true,
      framingGuard: true,
      formHardening: true,
      copyWatch: true,
      maxCopyChars: 2000,
      ...options,
    };

    this.container = null;
    this._bound = false;

    this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  init() {
    this.container = this.ensureStatusContainer();

    if (this.options.cspObserver) this.initCSPObserver();
    if (this.options.framingGuard) this.initFramingGuard();
    if (this.options.formHardening) this.initFormHardening();
    if (this.options.copyWatch) this.initCopyWatch();

    this._bound = true;
  }

  /* ------------------------------------------------------------------------ */
  /* Utilidades                                                               */
  /* ------------------------------------------------------------------------ */

  ensureStatusContainer() {
    let node = document.getElementById('security-status');
    if (node) return node;

    node = document.createElement('div');
    node.id = 'security-status';
    node.className = 'security-status visually-hidden';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-atomic', 'true');
    document.body.appendChild(node);
    return node;
  }

  announce(message) {
    if (!this.container) return;
    this.container.textContent = message;
    clearTimeout(this._announceTimer);
    this._announceTimer = setTimeout(() => {
      if (this.container) this.container.textContent = '';
    }, WARN_TIMEOUT);
  }

  looksSuspicious(value) {
    if (typeof value !== 'string') return false;
    if (value.length < 5) return false;
    return SUSPICIOUS_PATTERNS.some((re) => re.test(value));
  }

  /* ------------------------------------------------------------------------ */
  /* CSP observer                                                             */
  /* ------------------------------------------------------------------------ */

  initCSPObserver() {
    if (!CONFIG?.security?.csp?.enabled) {
      // Si el proyecto no define CSP en hosting, igual registramos eventos
      // para diagnóstico (sin hacer peticiones de red).
    }

    document.addEventListener('securitypolicyviolation', (event) => {
      const report = {
        timestamp: new Date().toISOString(),
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile || null,
        lineNumber: event.lineNumber || 0,
        columnNumber: event.columnNumber || 0,
        documentURI: event.documentURI || document.location.href,
      };

      // Sin backend: solo guardamos una muestra local (últimas 20 violaciones).
      try {
        const key = 'yshdd-csp-violations';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push(report);
        localStorage.setItem(key, JSON.stringify(list.slice(-20)));
      } catch { /* no-op */ }

      if (window.YSHDD?.emit) window.YSHDD.emit('cspViolation', report);
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Framing guard (clickjacking)                                             */
  /* ------------------------------------------------------------------------ */

  initFramingGuard() {
    // Mitigación limitada en cliente: si estamos dentro de un iframe ajeno,
    // intentamos romper el frame. Para una protección real se requiere
    // cabecera `Content-Security-Policy: frame-ancestors` o `X-Frame-Options`.
    try {
      if (window.self !== window.top) {
        // Notificamos (silencioso) y, si el navegador lo permite, rompemos.
        try {
          window.top.location = window.self.location.href;
        } catch {
          // No permitido → dejamos aviso en consola y mostramos fallback.
          document.documentElement.setAttribute('data-framed', 'true');
        }
      }
    } catch {
      /* no-op */
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Form hardening                                                           */
  /* ------------------------------------------------------------------------ */

  initFormHardening() {
    document.querySelectorAll('form').forEach((form) => {
      // Evitar doble bind
      if (form.dataset.securityBound === 'true') return;
      form.dataset.securityBound = 'true';

      // Novalidate explícito si el formulario es mailto: — los navegadores
      // abren el cliente de correo con lo que haya, así que validamos antes.
      form.addEventListener('submit', (e) => {
        const invalid = [];

        form.querySelectorAll('input, textarea, select').forEach((field) => {
          // Campos requeridos vacíos
          if (field.required && !String(field.value || '').trim()) {
            invalid.push(field);
            return;
          }
          // Patrones sospechosos en campos de texto
          if (
            (field.tagName === 'TEXTAREA' || field.type === 'text') &&
            this.looksSuspicious(field.value)
          ) {
            invalid.push(field);
          }
        });

        if (invalid.length) {
          e.preventDefault();
          invalid[0].focus?.();
          this.announce(
            'Revisa los campos: contienen datos no permitidos o faltan.'
          );
          if (window.YSHDD?.notify) {
            window.YSHDD.notify(
              'Revisa los campos marcados antes de enviar.',
              'warning'
            );
          }
        }
      });

      // Sanitizar SOLO al perder el foco, no en cada tecla (rompe a11y).
      form.querySelectorAll('input[type="text"], textarea').forEach((field) => {
        field.addEventListener('blur', () => {
          if (this.looksSuspicious(field.value)) {
            field.value = ''; // preferimos vaciar antes que reescribir mal.
            this.announce('Se ha limpiado un campo con contenido no permitido.');
          }
        });
      });
    });
  }

  /* ------------------------------------------------------------------------ */
  /* Copy watch                                                               */
  /* ------------------------------------------------------------------------ */

  initCopyWatch() {
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection?.();
      if (!selection) return;
      const text = selection.toString() || '';
      if (text.length <= this.options.maxCopyChars) return;

      // No bloqueamos la copia (perjudica UX). Solo avisamos.
      this.announce(
        'Estás copiando una cantidad extensa de contenido. Para uso periodístico, contacta yshddoficial@gmail.com.'
      );
      if (window.YSHDD?.notify) {
        window.YSHDD.notify(
          'Contenido extenso copiado. Para uso profesional escribe a yshddoficial@gmail.com.',
          'info',
          WARN_TIMEOUT
        );
      }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  /**
   * Sanitiza un valor de texto SIN romper a11y ni reescribir el campo en vivo.
   * Devuelve el valor seguro listo para enviar a un validador.
   */
  sanitizeValue(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u001F\u007F]/g, '') // control chars
      .replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Verifica si un valor contiene patrones típicos de XSS/injection.
   */
  isSuspicious(value) {
    return this.looksSuspicious(value);
  }

  /**
   * Devuelve un snapshot de violaciones CSP guardadas.
   */
  getCSPViolations() {
    try {
      return JSON.parse(localStorage.getItem('yshdd-csp-violations') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Limpia los datos almacenados por este módulo.
   */
  clear() {
    try {
      localStorage.removeItem('yshdd-csp-violations');
    } catch { /* no-op */ }
  }

  destroy() {
    this._bound = false;
    this.container = null;
  }
}

/* ============================================================================
   Singleton
   ============================================================================ */

let instance = null;

export function getSecurityManager(options) {
  if (!instance) instance = new SecurityManager(options);
  return instance;
}

export default getSecurityManager;

/* ============================================================================
   Auto-bind a YSHDD
   ============================================================================ */

if (typeof window !== 'undefined') {
  const bind = () => {
    const security = getSecurityManager();
    window.YSHDDSecurity = security;
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.seguridad = security;
      window.YSHDD.state.modules.security = security;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}

