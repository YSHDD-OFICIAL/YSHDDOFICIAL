/**
 * ============================================================================
 * colaboraciones.js — YSHDD EPK Premium 2027
 * Módulo de Colaboraciones del EPK.
 *
 * Objetivo:
 * - Renderizar las colaboraciones REALES del EPK (JHEY DAE, CRISIS).
 * - Delegar el formulario de propuesta a `mailto:` (sin backend).
 * - Exponer la API pública para que `main.js` u otros módulos la usen.
 *
 * Reglas del proyecto:
 * - 100% estático. No hay API REST en el repo.
 * - Solo se usan imágenes REALES del repo.
 * - DOM generado con textContent (sin innerHTML con datos externos).
 * - A11Y (WCAG 2.2 AA): alt reales, role="status", aria-live.
 * - Idempotente: puede importarse múltiples veces sin duplicar listeners.
 *
 * Contrato esperado del HTML (index.html v3):
 *   #collaborations .collab-cards            (contenedor de tarjetas)
 *   #collaborations .collab-form             (formulario de propuesta)
 *   #collaborations .collab-form form        (formulario mailto)
 * ============================================================================
 */

'use strict';

import { CONFIG, UTILS } from './config.js';

/* ============================================================================
   Imágenes REALES disponibles
   ============================================================================ */

const IMG = {
  portrait: 'YSHDD.png',
  crisisCover: 'CRISIS.png',
  crisisVisual: 'crisis-v.png',
  jheyDae: 'JHEY-DAE.png',
};

/* ============================================================================
   Datos REALES de colaboraciones
   ----------------------------------------------------------------------------
   No inventar artistas, fechas ni métricas. Solo lo confirmado en el repo.
   ============================================================================ */

const REAL_COLLABORATIONS = [
  {
    id: 'jhey-dae',
    name: 'JHEY DAE',
    role: 'Artista',
    image: IMG.jheyDae,
    alt: 'JHEY DAE, colaborador de YSHDD',
    status: 'active', // "activa"
    year: 2026,
    description:
      'Colaboración en preparación junto a JHEY DAE. Nuevo proyecto en estudio.',
    tags: ['En estudio', 'Trap cristiano'],
    ctaMailSubject: 'Colaboración JHEY DAE × YSHDD',
  },
  {
    id: 'crisis',
    name: 'CRISIS',
    role: 'Álbum',
    image: IMG.crisisCover,
    alt: 'Portada del álbum CRISIS de YSHDD',
    status: 'completed', // "completada"
    year: 2025,
    description:
      'Álbum debut de YSHDD. 5 tracks · 16:06. Proyecto completado y publicado.',
    tags: ['Álbum', '5 tracks', '2025'],
  },
];

/* ============================================================================
   Clase Collaborations
   ============================================================================ */

export class Collaborations {
  constructor(options = {}) {
    this.options = {
      autoMount: true,
      email: CONFIG?.artist?.management?.email || 'yshddoficial@gmail.com',
      ...options,
    };

    this.data = [...REAL_COLLABORATIONS];
    this._handlers = [];
    this._bound = false;

    if (this.options.autoMount) this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  init() {
    if (this._bound) return;
    this._bound = true;

    this.renderCards();
    this.bindFollowActions();
    this.bindForm();

    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.colaboraciones = this;
      window.YSHDD.state.modules.collaborations = this;
    }
    window.YSHDDCollaborations = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  renderCards() {
    const container = document.querySelector('#collaborations .collab-cards');
    if (!container) return;

    // No sobreescribir si ya hay tarjetas (SEO-friendly)
    if (container.querySelector('.collab-card')) return;

    const frag = document.createDocumentFragment();
    this.data.forEach((collab) => {
      frag.appendChild(this.createCard(collab));
    });
    container.appendChild(frag);
  }

  createCard(collab) {
    const isActive = collab.status === 'active';

    const card = document.createElement('article');
    card.className = `collab-card${isActive ? ' featured' : ''}`;
    card.dataset.collabId = collab.id;

    // Header
    const header = document.createElement('div');
    header.className = 'collab-header';

    const badge = document.createElement('span');
    badge.className = `collab-badge${isActive ? '' : ' past'}`;
    badge.textContent = isActive ? 'ACTIVA' : 'COMPLETADA';

    const dateEl = document.createElement('span');
    dateEl.className = 'collab-date';
    dateEl.textContent = String(collab.year);

    header.append(badge, dateEl);

    // Figura principal
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = collab.image;
    img.alt = collab.alt || collab.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 300;
    img.height = 300;
    figure.appendChild(img);

    const caption = document.createElement('figcaption');
    caption.textContent = isActive
      ? `${collab.name} × YSHDD`
      : collab.name;
    figure.appendChild(caption);

    // Info
    const info = document.createElement('div');
    info.className = 'collab-info';

    const h3 = document.createElement('h3');
    h3.textContent =
      collab.role === 'Álbum'
        ? `Álbum: ${collab.name}`
        : `Colaboración: ${collab.name}`;

    const p = document.createElement('p');
    p.textContent = collab.description;

    info.append(h3, p);

    // Tags
    if (Array.isArray(collab.tags) && collab.tags.length) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'collab-tracks';
      collab.tags.forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'track-tag';
        span.textContent = tag;
        tagsWrap.appendChild(span);
      });
      info.appendChild(tagsWrap);
    }

    // Estado activo
    if (isActive) {
      const status = document.createElement('div');
      status.className = 'collab-status';
      const dot = document.createElement('span');
      dot.className = 'status-indicator active';
      dot.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = 'En producción';
      status.append(dot, label);
      info.appendChild(status);
    }

    card.append(header, figure, info);

    // Acciones para activas
    if (isActive) {
      const actions = document.createElement('div');
      actions.className = 'collab-actions';

      const mailto = UTILS.buildMailto({
        email: this.options.email,
        subject: collab.ctaMailSubject || `Colaboración ${collab.name}`,
        body: `Hola YSHDD,\n\nMe interesa la colaboración con ${collab.name}.\n\n`,
      });

      const a = document.createElement('a');
      a.href = mailto;
      a.className = 'btn btn-outline';
      a.innerHTML = '<i class="bx bx-bell" aria-hidden="true"></i>';
      const txt = document.createElement('span');
      txt.textContent = 'Seguir proyecto';
      a.appendChild(txt);

      actions.appendChild(a);
      card.appendChild(actions);
    }

    return card;
  }

  /* ------------------------------------------------------------------------ */
  /* Follow (local)                                                           */
  /* ------------------------------------------------------------------------ */

  bindFollowActions() {
    const onClick = (e) => {
      const btn = e.target.closest('[data-action="follow"]');
      if (!btn) return;
      const id = btn.getAttribute('data-collab-id');
      if (id) this.follow(id);
    };
    document.addEventListener('click', onClick);
    this._handlers.push(() => document.removeEventListener('click', onClick));
  }

  follow(id) {
    const collab = this.data.find((c) => c.id === id);
    if (!collab) return;

    try {
      const key = 'yshdd-followed-collabs';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch { /* no-op */ }

    if (window.YSHDD?.notify) {
      window.YSHDD.notify(
        `Ahora sigues la colaboración con ${collab.name}.`,
        'success'
      );
    } else {
      console.info(`[colaboraciones] follow: ${id}`);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Formulario de propuesta                                                  */
  /* ------------------------------------------------------------------------ */

  bindForm() {
    const form = document.querySelector('#collaborations .collab-form form');
    if (!form) return;

    const onSubmit = (e) => this.onSubmit(e, form);
    form.addEventListener('submit', onSubmit);
    this._handlers.push(() => form.removeEventListener('submit', onSubmit));
  }

  onSubmit(event, form) {
    const data = this.collect(form);
    const errors = this.validate(data);

    if (errors.length) {
      event.preventDefault();
      this.showErrors(form, errors);
      this.focusFirstError(form, errors);
      if (window.YSHDD?.notify) {
        window.YSHDD.notify('Revisa los campos marcados.', 'warning');
      }
      return;
    }

    // Construir mailto prellenado
    const subject = `Propuesta de colaboración YSHDD${
      data.nombre ? ' — ' + data.nombre : ''
    }`;
    const body = [
      'Propuesta de colaboración desde el EPK',
      `Nombre: ${data.nombre || ''}`,
      `Email: ${data.email || ''}`,
      `Rol: ${data.rol || ''}`,
      '',
      'Idea creativa:',
      data.mensaje || '',
      '',
      '— Enviado desde yshdd.netlify.app',
    ].join('\n');

    const mailto = UTILS.buildMailto({
      email: this.options.email,
      subject,
      body,
    });

    // Dejamos que el navegador abra el cliente de correo
    // (el HTML ya tiene action="mailto:..."; reforzamos con datos prellenados).
    form.setAttribute('action', mailto);

    if (window.YSHDD?.notify) {
      window.YSHDD.notify(
        'Abriendo tu cliente de correo con la propuesta…',
        'info'
      );
    }
  }

  collect(form) {
    const data = {};
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      if (!field.name) return;
      data[field.name] = typeof field.value === 'string'
        ? field.value.trim()
        : field.value;
    });
    return data;
  }

  validate(data) {
    const errors = [];
    if (!data.nombre) {
      errors.push({ name: 'nombre', message: 'El nombre es obligatorio.' });
    }
    if (!data.email || !UTILS.isValidEmail(data.email)) {
      errors.push({ name: 'email', message: 'Introduce un email válido.' });
    }
    if (!data.mensaje || data.mensaje.length < 10) {
      errors.push({
        name: 'mensaje',
        message: 'Cuéntanos un poco más (mínimo 10 caracteres).',
      });
    }
    return errors;
  }

  showErrors(form, errors) {
    this.clearErrors(form);
    errors.forEach((err) => {
      const field = form.querySelector(`[name="${err.name}"]`);
      if (!field) return;
      field.setAttribute('aria-invalid', 'true');
      const wrap = field.closest('.form-field');
      if (wrap) {
        wrap.classList.add('error');
        let msg = wrap.querySelector('.error-message');
        if (!msg) {
          msg = document.createElement('span');
          msg.className = 'error-message';
          msg.setAttribute('role', 'alert');
          wrap.appendChild(msg);
        }
        msg.textContent = err.message;
      }
    });
  }

  clearErrors(form) {
    form.querySelectorAll('.form-field.error').forEach((w) => {
      w.classList.remove('error');
      w.querySelector('.error-message')?.remove();
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) =>
      el.removeAttribute('aria-invalid')
    );
  }

  focusFirstError(form, errors) {
    const first = errors[0];
    if (!first) return;
    form.querySelector(`[name="${first.name}"]`)?.focus();
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  getStats() {
    return {
      total: this.data.length,
      active: this.data.filter((c) => c.status === 'active').length,
      completed: this.data.filter((c) => c.status === 'completed').length,
    };
  }

  getCollaborations() {
    return [...this.data];
  }

  destroy() {
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    this._bound = false;
    if (window.YSHDDCollaborations === this) window.YSHDDCollaborations = null;
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getCollaborations() {
  if (!instance) instance = new Collaborations();
  return instance;
}

export default getCollaborations;

if (typeof window !== 'undefined') {
  const bind = () => {
    const collab = getCollaborations();
    window.YSHDDCollaborations = collab;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
