/**
 * ============================================================================
 * actualizacion.js — YSHDD EPK Premium 2027
 * Sistema de actualización del Service Worker (SW) + aviso in-app accesible.
 *
 * Reglas del proyecto:
 * - 100% estático. Solo interactúa con `./sw.js` (relativo).
 * - Sin `setTimeout` mágicos que confundan al usuario.
 * - Aviso accesible: role="status" + aria-live="polite", botones nativos.
 * - Respeta prefers-reduced-motion.
 * - NO recarga la página automáticamente al detectar `controllerchange`
 *   (comportamiento intrusivo). Solo tras acción explícita del usuario.
 * - Si `YSHDD.notify` está disponible, delega el feedback ahí.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Constantes
   ============================================================================ */

const SW_URL = './sw.js';
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 h
const NOTICE_TIMEOUT_MS = 20000;

/* ============================================================================
   Clase UpdateManager
   ============================================================================ */

export class UpdateManager {
  constructor(options = {}) {
    this.options = {
      autoInit: true,
      intervalMs: CHECK_INTERVAL_MS,
      ...options,
    };

    this.registration = null;
    this.waitingWorker = null;
    this.updateAvailable = false;
    this.notificationEl = null;
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    this._intervalId = null;
    this._bound = false;

    if (this.options.autoInit) this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  async init() {
    if (this._bound) return;
    this._bound = true;

    if (!('serviceWorker' in navigator)) {
      console.info('[actualizacion] Service Worker no soportado.');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
    } catch (err) {
      console.warn('[actualizacion] SW no listo:', err?.message || err);
      return;
    }

    this.setupUpdateFound();
    this.setupControllerChange();
    await this.checkForUpdates();

    // Verificación periódica
    this._intervalId = setInterval(() => this.checkForUpdates(), this.options.intervalMs);

    // Exponer en YSHDD
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.actualizacion = this;
    }
    window.YSHDDUpdate = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Listeners                                                                */
  /* ------------------------------------------------------------------------ */

  setupUpdateFound() {
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // Solo cuando hay un SW previo controlando (es decir, es una actualización)
        if (
          newWorker.state === 'installed' &&
          navigator.serviceWorker.controller
        ) {
          this.waitingWorker = newWorker;
          this.handleUpdateAvailable();
        }
      });
    });
  }

  setupControllerChange() {
    // NO recargamos automáticamente. Solo informamos.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.info('[actualizacion] SW controlador cambiado.');
      if (window.YSHDD?.notify) {
        window.YSHDD.notify(
          'La nueva versión se aplicó correctamente.',
          'success'
        );
      }
    });
  }

  async checkForUpdates() {
    try {
      await this.registration?.update?.();
    } catch (err) {
      console.warn('[actualizacion] update() fallo:', err?.message || err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Notificación                                                             */
  /* ------------------------------------------------------------------------ */

  handleUpdateAvailable() {
    if (this.updateAvailable) return;
    this.updateAvailable = true;

    if (window.YSHDD?.notify) {
      window.YSHDD.notify(
        'Hay una nueva versión del EPK. Actualiza cuando quieras.',
        'info',
        NOTICE_TIMEOUT_MS
      );
    }
    this.showInAppNotice();
  }

  showInAppNotice() {
    if (this.notificationEl) return;
    if (document.getElementById('updateNotice')) return;

    const el = document.createElement('div');
    el.id = 'updateNotice';
    el.className = 'update-notification';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');

    const content = document.createElement('div');
    content.className = 'update-content';

    const p = document.createElement('p');
    p.textContent = 'Nueva versión disponible del EPK.';

    const actions = document.createElement('div');
    actions.className = 'update-buttons';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'btn btn-primary';
    applyBtn.textContent = 'Actualizar ahora';
    applyBtn.addEventListener('click', () => this.applyUpdate());

    const laterBtn = document.createElement('button');
    laterBtn.type = 'button';
    laterBtn.className = 'btn btn-outline';
    laterBtn.textContent = 'Más tarde';
    laterBtn.addEventListener('click', () => this.dismiss());

    actions.append(applyBtn, laterBtn);
    content.append(p, actions);
    el.appendChild(content);

    document.body.appendChild(el);
    this.notificationEl = el;

    // Auto-cierre (sin recargar). No molesta.
    setTimeout(() => this.dismiss(), NOTICE_TIMEOUT_MS);
  }

  /* ------------------------------------------------------------------------ */
  /* Acciones                                                                 */
  /* ------------------------------------------------------------------------ */

  applyUpdate() {
    // Enviar mensaje al SW en espera → skipWaiting
    if (this.waitingWorker) {
      try {
        this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      } catch { /* no-op */ }
    }
    // Recarga explícita (única y tras acción del usuario)
    window.location.reload();
  }

  dismiss() {
    this.notificationEl?.remove();
    this.notificationEl = null;
  }

  destroy() {
    if (this._intervalId) clearInterval(this._intervalId);
    this._intervalId = null;
    this.dismiss();
    this._bound = false;
    if (window.YSHDDUpdate === this) window.YSHDDUpdate = null;
    if (window.YSHDD?.state?.modules) {
      delete window.YSHDD.state.modules.actualizacion;
    }
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getUpdateManager() {
  if (!instance) instance = new UpdateManager();
  return instance;
}

export default getUpdateManager;

if (typeof window !== 'undefined') {
  const bind = () => {
    const um = getUpdateManager();
    window.YSHDDUpdate = um;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
