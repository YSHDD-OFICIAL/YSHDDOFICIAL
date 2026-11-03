/**
 * ============================================================================
 * notifications.js — YSHDD EPK Premium 2027
 * Sistema de notificaciones in-app + Web Notifications + Push (opcional).
 *
 * Diseño:
 * - 100% estático (funciona sin backend). Si no hay VAPID/Push, todo cae a
 *   notificaciones in-app accesibles (aria-live) sin romper nada.
 * - A11Y WCAG 2.2 AA: usa `role="status"` y `aria-live="polite"` en el
 *   contenedor #notifications ya presente en index.html.
 * - Respeta prefers-reduced-motion.
 * - Cola interna para evitar solapamientos visuales.
 * - Singleton accesible vía getNotificationManager().
 * - Compatible con el nuevo main.js (que expone YSHDD.notify como wrapper).
 *
 * NO depende de APIs inexistentes:
 * - No llama a /api/save-subscription (no hay backend real).
 * - No usa VAPID placeholder (si no hay key real, se omite push).
 * ============================================================================
 */

'use strict';

import { CONFIG, UTILS, CONSTANTS } from './config.js';

/* ============================================================================
   NotificationManager
   ============================================================================ */

export class NotificationManager {
  constructor(options = {}) {
    this.supported = typeof window !== 'undefined' && 'Notification' in window;
    this.permission = this.supported ? Notification.permission : 'denied';
    this.pushSupported =
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window;

    this.queue = [];
    this.isProcessing = false;

    this.defaultDuration = 5000;
    this.maxQueue = 5;

    this.containerId = CONSTANTS.A11Y.LIVE_REGION_ID || 'notifications';
    this.container = null;

    this.serviceWorkerRegistration = null;

    // VAPID real (config). Si está vacío → se omite push.
    this.vapidPublicKey = CONFIG?.api?.keys?.vapid || '';

    this.options = {
      icon: CONFIG?.assets?.favicon || 'YSHDD.png',
      badge: CONFIG?.assets?.favicon || 'YSHDD.png',
      tag: 'yshdd-notification',
      requireInteraction: false,
      silent: false,
      ...options,
    };

    // Reducción de movimiento
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Estado de inicialización
    this._ready = this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  async init() {
    // Asegurar contenedor aria-live
    this.container = this.ensureContainer();

    // Registrar Service Worker si existe (para push/click handlers)
    if (this.pushSupported) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
      } catch {
        this.serviceWorkerRegistration = null;
      }
    }

    // Escuchar mensajes del SW (por si sw.js emite notificaciones)
    if (this.serviceWorkerRegistration && 'onmessage' in this.serviceWorkerRegistration) {
      // Evitar sobreescribir handlers externos: usar addEventListener si existe
      try {
        navigator.serviceWorker.addEventListener('message', this.handleSWMessage);
      } catch {
        /* no-op */
      }
    }

    // Botón opcional de permiso
    this.maybeRenderPermissionButton();

    return true;
  }

  ensureContainer() {
    let node = document.getElementById(this.containerId);
    if (node) return node;

    node = document.createElement('div');
    node.id = this.containerId;
    node.className = 'notifications';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.setAttribute('aria-atomic', 'true');
    document.body.appendChild(node);
    return node;
  }

  /* ------------------------------------------------------------------------ */
  /* Push opcional                                                            */
  /* ------------------------------------------------------------------------ */

  isVapidConfigured() {
    const k = this.vapidPublicKey;
    return (
      typeof k === 'string' &&
      k.length > 20 &&
      !/^TU_|PLACEHOLDER|XXXX/i.test(k)
    );
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const out = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i += 1) out[i] = rawData.charCodeAt(i);
    return out;
  }

  async subscribeToPush() {
    if (!this.isVapidConfigured() || !this.serviceWorkerRegistration) return null;
    try {
      const existing = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (existing) return existing;

      const sub = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      // Sin backend no enviamos la suscripción a ningún servidor.
      // Guardamos localmente para diagnóstico.
      try {
        localStorage.setItem('yshdd-push-subscription', JSON.stringify(sub));
      } catch {
        /* no-op */
      }
      return sub;
    } catch {
      return null;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Permisos                                                                 */
  /* ------------------------------------------------------------------------ */

  async requestPermission() {
    if (!this.supported) return 'denied';

    try {
      this.permission = await Notification.requestPermission();
    } catch {
      this.permission = 'denied';
    }

    if (this.permission === 'granted' && this.isVapidConfigured()) {
      await this.subscribeToPush();
    }

    this.maybeRenderPermissionButton(true);
    return this.permission;
  }

  maybeRenderPermissionButton(forceRemove = false) {
    const id = 'notification-permission-btn';
    const existing = document.getElementById(id);

    if (forceRemove && existing) {
      existing.remove();
      return;
    }

    if (!this.supported || this.permission !== 'default') {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const btn = document.createElement('button');
    btn.id = id;
    btn.type = 'button';
    btn.className = 'notification-permission-btn';
    btn.setAttribute('aria-label', 'Activar notificaciones del EPK');
    btn.innerHTML = `
      <i class="bx bx-bell" aria-hidden="true"></i>
      <span>Activar notificaciones</span>
    `;

    btn.addEventListener('click', async () => {
      await this.requestPermission();
      if (this.permission === 'granted') {
        this.success('Notificaciones activadas');
      } else if (this.permission === 'denied') {
        this.warning('Notificaciones bloqueadas por el navegador');
      }
    });

    document.body.appendChild(btn);
  }

  /* ------------------------------------------------------------------------ */
  /* API principal                                                            */
  /* ------------------------------------------------------------------------ */

  /**
   * Mostrar notificación. Acepta un objeto O un par (title, options).
   * - Esta sobrecarga mantiene compatibilidad con el main.js previo.
   */
  show(input, maybeOptions) {
    let title = 'YSHDD';
    let options = {};

    if (typeof input === 'string') {
      title = input;
      options = maybeOptions || {};
    } else if (input && typeof input === 'object') {
      options = { ...input };
      title = options.title || 'YSHDD';
      // Si no viene `type`, deducirlo de `message/body`
    }

    // Normalización
    const type = options.type || 'info';
    const body = options.body || options.message || '';

    // Web Notification si:
    // - hay permiso granted
    // - el documento NO está visible (opción) O options.web === true
    const useWeb =
      this.supported &&
      this.permission === 'granted' &&
      (options.web === true || document.hidden);

    if (useWeb && this.serviceWorkerRegistration) {
      return this.showViaServiceWorker(title, { ...options, body, type });
    }
    if (useWeb && this.supported) {
      return this.showViaAPI(title, { ...options, body, type });
    }

    // In-app
    return this.enqueue({ title, body, type, options });
  }

  /**
   * Azúcar sintáctica (más legible en el resto del código).
   */
  info(message, options = {}) {
    return this.show('Información', { ...options, body: message, type: 'info' });
  }
  success(message, options = {}) {
    return this.show('Éxito', { ...options, body: message, type: 'success' });
  }
  warning(message, options = {}) {
    return this.show('Advertencia', { ...options, body: message, type: 'warning' });
  }
  error(message, options = {}) {
    return this.show('Error', { ...options, body: message, type: 'error' });
  }

  /* ------------------------------------------------------------------------ */
  /* Web Notifications                                                        */
  /* ------------------------------------------------------------------------ */

  async showViaServiceWorker(title, options) {
    try {
      const merged = {
        icon: this.options.icon,
        badge: this.options.badge,
        tag: this.options.tag,
        ...options,
        data: { ts: Date.now(), ...(options.data || {}) },
      };
      await this.serviceWorkerRegistration.showNotification(title, merged);
      return true;
    } catch {
      return this.enqueue({
        title,
        body: options.body || '',
        type: options.type || 'info',
        options,
      });
    }
  }

  showViaAPI(title, options) {
    try {
      const n = new Notification(title, {
        icon: this.options.icon,
        badge: this.options.badge,
        tag: this.options.tag,
        ...options,
      });
      n.onclick = (e) => {
        e.preventDefault();
        this.handleClick(options.data);
        n.close();
      };
      setTimeout(() => {
        try { n.close(); } catch { /* no-op */ }
      }, this.defaultDuration);
      return n;
    } catch {
      return this.enqueue({
        title,
        body: options.body || '',
        type: options.type || 'info',
        options,
      });
    }
  }

  handleSWMessage = (event) => {
    const data = event?.data;
    if (!data || data.source !== 'yshdd-sw') return;
    if (data.type === 'notification-click') {
      this.handleClick(data.payload);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* In-app (aria-live)                                                       */
  /* ------------------------------------------------------------------------ */

  enqueue(item) {
    // Límite de cola
    if (this.queue.length >= this.maxQueue) this.queue.shift();
    this.queue.push(item);
    this.process();
    return item;
  }

  process() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) return;
    this.isProcessing = true;
    const item = this.queue.shift();
    this.renderInApp(item);
    // Al terminar, dejar libre el flag para la siguiente
    setTimeout(() => {
      this.isProcessing = false;
      if (this.queue.length) this.process();
    }, this.reducedMotion ? 0 : 150);
  }

  renderInApp(item) {
    const { title, body, type = 'info', options = {} } = item;
    const container = this.container || this.ensureContainer();

    // Iconografía por tipo
    const icons = {
      success: 'bx-check-circle',
      error: 'bx-error-circle',
      warning: 'bx-error',
      info: 'bx-info-circle',
    };

    // Elemento
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.setAttribute('role', 'status');

    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<i class="bx ${icons[type] || icons.info}"></i>`;

    const content = document.createElement('div');
    content.className = 'notification-content';

    const titleEl = document.createElement('p');
    titleEl.className = 'notification-title';
    titleEl.textContent = title;

    const msgEl = document.createElement('p');
    msgEl.className = 'notification-message';
    msgEl.textContent = body;

    content.append(titleEl);
    if (body) content.append(msgEl);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'notification-close';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    closeBtn.textContent = '×';

    const remove = () => {
      el.classList.add('leaving');
      const finish = () => el.remove();
      if (this.reducedMotion) finish();
      else setTimeout(finish, 200);
    };

    closeBtn.addEventListener('click', remove);

    // Auto-cierre
    const ttl = Number(options.duration) || this.defaultDuration;
    const timer = setTimeout(remove, ttl);
    el.addEventListener('mouseenter', () => clearTimeout(timer));
    el.addEventListener('mouseleave', () => setTimeout(remove, 1200));

    // Click (opcional)
    if (typeof options.onClick === 'function') {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        if (e.target.closest('.notification-close')) return;
        try { options.onClick(); } catch { /* no-op */ }
        remove();
      });
    }

    el.append(icon, content, closeBtn);
    container.appendChild(el);
  }

  /* ------------------------------------------------------------------------ */
  /* Click handling                                                           */
  /* ------------------------------------------------------------------------ */

  handleClick(data) {
    if (!data) return;

    if (data.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (data.action === 'navigate' && data.section) {
      const target = document.querySelector(data.section);
      if (target) UTILS.scrollToElement(target, 80);
    }
    if (data.action === 'download' && data.fileUrl) {
      UTILS.downloadFile(data.fileUrl, data.fileName);
    }
    if (data.action === 'play' && window.YSHDD?.state?.player) {
      try { window.YSHDD.state.player.play?.(); } catch { /* no-op */ }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Utilidades públicas                                                      */
  /* ------------------------------------------------------------------------ */

  clearAll() {
    // In-app
    (this.container || document.getElementById(this.containerId))
      ?.querySelectorAll('.notification')
      .forEach((n) => n.remove());
    this.queue = [];
    this.isProcessing = false;

    // Web notifications
    this.serviceWorkerRegistration
      ?.getNotifications?.()
      .then((list) => list.forEach((n) => n.close?.()))
      .catch(() => { /* no-op */ });
  }

  getStats() {
    return {
      supported: this.supported,
      permission: this.permission,
      pushSupported: this.pushSupported,
      pushSubscribed: this.isVapidConfigured(),
      queueLength: this.queue.length,
      containerId: this.containerId,
    };
  }
}

/* ============================================================================
   Singleton
   ============================================================================ */

let instance = null;

export function getNotificationManager() {
  if (!instance) instance = new NotificationManager();
  return instance;
}

export default getNotificationManager;

/* ============================================================================
   Auto-bind a YSHDD.notify (si main.js está listo o llega después)
   ============================================================================ */

// Exponer la instancia cuando el DOM esté listo (idempotente)
if (typeof document !== 'undefined') {
  const bind = () => {
    const manager = getNotificationManager();
    const bridge = (message, type = 'info', timeout = 4000) => {
      const opts = { type, duration: timeout };
      return manager.show(
        typeof message === 'string'
          ? 'YSHDD'
          : message?.title || 'YSHDD',
        typeof message === 'string'
          ? { ...opts, body: message }
          : { ...opts, ...message }
      );
    };

    window.YSHDDNotifications = manager;
    window.YSHDD = Object.assign(window.YSHDD || {}, {
      notify: window.YSHDD?.notify || bridge,
      notifications: manager,
    });

    // Notificar a main.js si llegó antes
    if (window.YSHDD?.state?.modules) {
      window.YSHDD.state.modules.notificaciones = manager;
      window.YSHDD.state.modules.notifications = manager;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
