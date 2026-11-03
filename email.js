/**
 * ============================================================================
 * email.js — YSHDD EPK Premium 2027
 * Gestión de formularios de contacto del EPK (100% estático, sin backend).
 *
 * IMPORTANTE
 * ----------
 * El EPK vive en GitHub Pages / Netlify y NO tiene backend. Por eso:
 *   - No se llama a `api.yshdd.com` (no existe).
 *   - No se hace `fetch()` a endpoints inexistentes.
 *   - Los formularios usan `action="mailto:yshddoficial@gmail.com"` en el HTML
 *     (ya definido en index.html) y este módulo añade validación y feedback
 *     accesible.
 *
 * Fallback ante cualquier "envío" real:
 *   - Se construye un `mailto:` con los datos del formulario (subject + body
 *     prellenados) y se abre el cliente de correo del usuario.
 *   - Se muestra feedback vía `window.YSHDD.notify()` (o fallback aria-live).
 *
 * A11Y
 * ----
 * - Nunca se usa innerHTML con datos del usuario.
 * - Mensajes anunciados con role="status" + aria-live="polite".
 * - El foco se lleva al primer campo inválido.
 * - Los formularios mantienen su <label> nativo.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Constantes locales
   ============================================================================ */

const MAIL_TO = CONFIG?.artist?.management?.email || 'yshddoficial@gmail.com';

const FIELD_LABELS = {
  nombre: 'Nombre',
  email: 'Email',
  asunto: 'Asunto',
  mensaje: 'Mensaje',
  rol: 'Rol / Especialidad',
  telefono: 'Teléfono',
  empresa: 'Empresa / Medio',
};

const SUBJECT_BY_FORM = {
  contact: 'Contacto EPK YSHDD',
  collaboration: 'Propuesta de colaboración YSHDD',
  newsletter: 'Suscripción Newsletter YSHDD',
  booking: 'Booking YSHDD',
};

/* ============================================================================
   Clase principal
   ============================================================================ */

export class EmailService {
  constructor(options = {}) {
    this.options = {
      autoBind: true,
      mailto: MAIL_TO,
      ...options,
    };

    this._handlers = [];
    this._initialized = false;

    if (this.options.autoBind) this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  init() {
    if (this._initialized) return;
    this._initialized = true;

    document
      .querySelectorAll('form[data-form-kind], form[action^="mailto:"]')
      .forEach((form) => this.attach(form));

    // Delegación por si se añaden formularios luego
    const onDocSubmit = (e) => {
      const form = e.target.closest('form[data-form-kind]');
      if (!form) return;
      if (form.dataset.emailBound === 'true') return;
      this.attach(form);
    };
    document.addEventListener('submit', onDocSubmit, true);
    this._handlers.push(() => document.removeEventListener('submit', onDocSubmit, true));

    // Registro en el estado global
    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.email = this;
    }
    window.YSHDDEmail = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Binding                                                                  */
  /* ------------------------------------------------------------------------ */

  attach(form) {
    if (!form || form.dataset.emailBound === 'true') return;
    form.dataset.emailBound = 'true';

    // Determinar tipo de formulario
    if (!form.dataset.formKind) {
      const kind = this.detectFormKind(form);
      if (kind) form.dataset.formKind = kind;
    }

    const onSubmit = (e) => this.onSubmit(e, form);
    form.addEventListener('submit', onSubmit);
    this._handlers.push(() => form.removeEventListener('submit', onSubmit));

    // Aviso si el navegador no soporta mailto (raro) — accesible
    form.dataset.hasMailto = String(
      Boolean(form.getAttribute('action')?.startsWith('mailto:'))
    );
  }

  detectFormKind(form) {
    if (form.classList.contains('newsletter-form')) return 'newsletter';
    if (form.id === 'collabForm' || form.closest('#collaborations')) return 'collaboration';
    if (form.closest('#contact')) return 'contact';
    const action = form.getAttribute('action') || '';
    if (/subject=.*booking/i.test(action)) return 'booking';
    return 'contact';
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  onSubmit(event, form) {
    // No interceptar si el usuario aún no validó
    const data = this.collect(form);
    const errors = this.validate(form, data);

    if (errors.length > 0) {
      event.preventDefault();
      this.showErrors(form, errors);
      this.focusFirstError(form, errors);
      this.announce('Revisa los campos marcados antes de enviar.', 'warning');
      return;
    }

    // Construir mailto con subject + body prellenados
    const kind = form.dataset.formKind || 'contact';
    const subject = this.buildSubject(kind, data);
    const body = this.buildBody(kind, data);
    const mailto = UTILS.buildMailto({
      email: this.options.mailto,
      subject,
      body,
    });

    // Si el HTML ya define action="mailto:...", dejar que el navegador lo abra.
    // Si no, forzamos la apertura del cliente de correo.
    const action = form.getAttribute('action') || '';
    if (!action.startsWith('mailto:')) {
      event.preventDefault();
      window.location.href = mailto;
    } else {
      // Reemplazamos el action para asegurar subject y body prellenados
      form.setAttribute('action', mailto);
    }

    // Feedback accesible
    this.announce(
      'Se ha abierto tu cliente de correo con los datos del formulario. Si no se abrió, revisa tu configuración.',
      'success'
    );

    // Feedback transitorio visual
    this.toast('Abriendo tu cliente de correo…', 'info');
  }

  /* ------------------------------------------------------------------------ */
  /* Recolección de datos                                                     */
  /* ------------------------------------------------------------------------ */

  collect(form) {
    const data = {};
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      if (!field.name) return;
      const key = field.name;
      if (field.type === 'checkbox') {
        data[key] = field.checked;
      } else if (field.type === 'radio') {
        if (field.checked) data[key] = field.value;
      } else {
        data[key] = typeof field.value === 'string' ? field.value.trim() : field.value;
      }
    });
    return data;
  }

  /* ------------------------------------------------------------------------ */
  /* Validación                                                               */
  /* ------------------------------------------------------------------------ */

  validate(form, data) {
    const errors = [];

    form.querySelectorAll('input, textarea, select').forEach((field) => {
      const name = field.name || field.id;
      if (!name) return;

      // Required vacío
      if (field.required && !data[field.name]?.toString().trim()) {
        errors.push({
          name: field.name || field.id,
          message: `El campo "${FIELD_LABELS[name] || name}" es obligatorio.`,
          field,
        });
        return;
      }

      // Email
      if ((field.type === 'email' || field.name === 'email') && data[field.name]) {
        if (!UTILS.isValidEmail(data[field.name])) {
          errors.push({
            name: field.name,
            message: 'Introduce un email válido.',
            field,
          });
        }
      }

      // Longitud mínima
      if (field.name === 'mensaje' && data.mensaje && data.mensaje.length < 10) {
        errors.push({
          name: 'mensaje',
          message: 'El mensaje es demasiado corto (mínimo 10 caracteres).',
          field,
        });
      }
    });

    return errors;
  }

  showErrors(form, errors) {
    this.clearErrors(form);
    errors.forEach(({ field, message }) => {
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
        msg.textContent = message;
      }
    });
  }

  clearErrors(form) {
    form.querySelectorAll('.form-field.error').forEach((w) => {
      w.classList.remove('error');
      const msg = w.querySelector('.error-message');
      if (msg) msg.remove();
    });
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid');
    });
  }

  focusFirstError(form, errors) {
    const first = errors.find((e) => e.field)?.field;
    first?.focus?.();
  }

  /* ------------------------------------------------------------------------ */
  /* Construcción de mailto                                                   */
  /* ------------------------------------------------------------------------ */

  buildSubject(kind, data) {
    const base = SUBJECT_BY_FORM[kind] || SUBJECT_BY_FORM.contact;
    if (data.nombre) return `${base} — ${data.nombre}`;
    if (data.asunto) return `${base} — ${data.asunto}`;
    return base;
  }

  buildBody(kind, data) {
    const lines = [];
    lines.push(`Origen: EPK YSHDD (${kind})`);
    lines.push(`Fecha: ${new Date().toISOString()}`);
    lines.push('');

    const fields = [
      ['nombre', 'Nombre'],
      ['email', 'Email'],
      ['empresa', 'Empresa'],
      ['telefono', 'Teléfono'],
      ['asunto', 'Asunto'],
      ['rol', 'Rol'],
      ['mensaje', 'Mensaje'],
    ];

    fields.forEach(([key, label]) => {
      const value = data[key];
      if (value === undefined || value === null || value === '') return;
      lines.push(`${label}: ${typeof value === 'string' ? value : String(value)}`);
    });

    lines.push('');
    lines.push('— Enviado desde yshdd.netlify.app');
    return lines.join('\n');
  }

  /* ------------------------------------------------------------------------ */
  /* Feedback                                                                 */
  /* ------------------------------------------------------------------------ */

  announce(message, type = 'info') {
    if (window.YSHDD?.notify) {
      window.YSHDD.notify(message, type);
      return;
    }
    const el = document.getElementById('notifications');
    if (!el) return;
    const node = document.createElement('div');
    node.className = `notification ${type}`;
    node.setAttribute('role', 'status');
    node.textContent = message;
    el.appendChild(node);
    setTimeout(() => node.remove(), 5000);
  }

  toast(message, type = 'info') {
    this.announce(message, type);
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  /**
   * Devuelve el mailto de contacto prellenado con datos arbitrarios.
   */
  buildContactMailto(data = {}) {
    return UTILS.buildMailto({
      email: this.options.mailto,
      subject: this.buildSubject('contact', data),
      body: this.buildBody('contact', data),
    });
  }

  destroy() {
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    this._initialized = false;
    if (window.YSHDDEmail === this) window.YSHDDEmail = null;
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getEmailService() {
  if (!instance) instance = new EmailService();
  return instance;
}

export default getEmailService;

if (typeof window !== 'undefined') {
  const bind = () => {
    const email = getEmailService();
    window.YSHDDEmail = email;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
