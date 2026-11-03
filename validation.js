/**
 * ============================================================================
 * validación.js — YSHDD EPK Premium 2027
 * Módulo de validación de formularios del EPK (100% estático).
 *
 * Objetivos:
 * - Validar los formularios reales del EPK: contacto, colaboraciones y
 *   newsletter (definidos en index.html v3).
 * - Feedback accesible (WCAG 2.2 AA): aria-invalid, aria-describedby,
 *   role="alert", foco al primer error.
 * - Sin backend: la validación prepara los datos para el envío vía mailto:.
 * - Idempotente y sin dependencias externas.
 *
 * Contrato del HTML (index.html v3):
 *   - #contact        → form (contact-name, contact-email, contact-subject, contact-msg)
 *   - #collaborations → form (collab-name, collab-email, collab-role, collab-msg)
 *   - #newsletter     → form (newsletter-name, newsletter-email)
 *
 * No se validan tarjetas de crédito, contraseñas ni archivos: el EPK no
 * incluye esos casos de uso. Se dejan fuera para no añadir código muerto.
 * ============================================================================
 */

'use strict';

import { CONFIG, UTILS, Validators } from './config.js';

/* ============================================================================
   Definición de campos por formulario
   ============================================================================ */

const FORM_RULES = {
  contact: {
    fields: {
      nombre: { required: true, minLength: 2, maxLength: 100, label: 'Nombre' },
      email: { required: true, email: true, maxLength: 254, label: 'Email' },
      asunto: { required: true, maxLength: 200, label: 'Asunto' },
      mensaje: { required: true, minLength: 10, maxLength: 5000, label: 'Mensaje' },
    },
  },
  collaboration: {
    fields: {
      nombre: { required: true, minLength: 2, maxLength: 100, label: 'Nombre' },
      email: { required: true, email: true, maxLength: 254, label: 'Email' },
      rol: { required: true, label: 'Rol / Especialidad' },
      mensaje: { required: true, minLength: 10, maxLength: 5000, label: 'Idea creativa' },
    },
  },
  newsletter: {
    fields: {
      nombre: { required: false, maxLength: 100, label: 'Nombre' },
      email: { required: true, email: true, maxLength: 254, label: 'Email' },
    },
  },
};

/* ============================================================================
   Clase Validator
   ============================================================================ */

export class Validator {
  constructor(options = {}) {
    this.options = {
      autoBind: true,
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

    document.querySelectorAll('form').forEach((form) => this.attach(form));

    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.validacion = this;
      window.YSHDD.state.modules.validation = this;
    }
    window.YSHDDValidator = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Binding                                                                  */
  /* ------------------------------------------------------------------------ */

  attach(form) {
    if (!form || form.dataset.validatorBound === 'true') return;
    form.dataset.validatorBound = 'true';

    const kind = this.detectKind(form);
    if (!kind) return;
    form.dataset.formKind = kind;

    const onSubmit = (e) => this.onSubmit(e, form, kind);
    form.addEventListener('submit', onSubmit);
    this._handlers.push(() => form.removeEventListener('submit', onSubmit));

    // Validación en vivo (blur + input suave)
    form.querySelectorAll('input, textarea, select').forEach((field) => {
      const name = field.name;
      if (!name) return;

      const onBlur = () => this.validateSingleField(field, kind);
      const onInput = () => this.clearFieldError(field);

      field.addEventListener('blur', onBlur);
      field.addEventListener('input', onInput);

      this._handlers.push(() => field.removeEventListener('blur', onBlur));
      this._handlers.push(() => field.removeEventListener('input', onInput));
    });
  }

  detectKind(form) {
    if (form.closest('#newsletter')) return 'newsletter';
    if (form.closest('#collaborations')) return 'collaboration';
    if (form.closest('#contact')) return 'contact';
    if (form.classList.contains('newsletter-form')) return 'newsletter';
    return null;
  }

  /* ------------------------------------------------------------------------ */
  /* Submit                                                                   */
  /* ------------------------------------------------------------------------ */

  onSubmit(event, form, kind) {
    const data = this.collect(form);
    const result = this.validate(kind, data);

    if (!result.valid) {
      event.preventDefault();
      this.renderErrors(form, result.errors);
      this.focusFirstError(form, result.errors);
      if (window.YSHDD?.notify) {
        window.YSHDD.notify(
          'Revisa los campos marcados antes de enviar.',
          'warning'
        );
      }
      return;
    }

    this.clearErrors(form);
    // Si es mailto:, dejamos que el navegador abra el cliente de correo.
    // El módulo email.js reforzará subject y body si está presente.
  }

  /* ------------------------------------------------------------------------ */
  /* Recolección                                                              */
  /* ------------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------------ */
  /* Validación por campo                                                     */
  /* ------------------------------------------------------------------------ */

  validate(kind, data) {
    const rules = FORM_RULES[kind];
    if (!rules) return { valid: true, errors: [] };

    const errors = [];

    Object.entries(rules.fields).forEach(([name, config]) => {
      const value = data[name];

      if (config.required && !Validators.required(value)) {
        errors.push({
          name,
          message: `${config.label || name} es obligatorio.`,
        });
        return;
      }

      if (config.email && value && !Validators.email(value)) {
        errors.push({
          name,
          message: 'Introduce un email válido.',
        });
        return;
      }

      if (config.minLength && value && !Validators.minLength(value, config.minLength)) {
        errors.push({
          name,
          message: `${config.label || name} debe tener al menos ${config.minLength} caracteres.`,
        });
        return;
      }

      if (config.maxLength && value && !Validators.maxLength(value, config.maxLength)) {
        errors.push({
          name,
          message: `${config.label || name} no debe exceder ${config.maxLength} caracteres.`,
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  validateSingleField(field, kind) {
    const name = field.name;
    if (!name) return true;

    const rules = FORM_RULES[kind]?.fields?.[name];
    if (!rules) return true;

    const value = (field.value || '').trim();
    let error = null;

    if (rules.required && !Validators.required(value)) {
      error = `${rules.label || name} es obligatorio.`;
    } else if (rules.email && value && !Validators.email(value)) {
      error = 'Introduce un email válido.';
    } else if (rules.minLength && value && !Validators.minLength(value, rules.minLength)) {
      error = `${rules.label || name} debe tener al menos ${rules.minLength} caracteres.`;
    } else if (rules.maxLength && value && !Validators.maxLength(value, rules.maxLength)) {
      error = `${rules.label || name} no debe exceder ${rules.maxLength} caracteres.`;
    }

    if (error) {
      this.setFieldError(field, error);
      return false;
    }
    this.clearFieldError(field);
    return true;
  }

  /* ------------------------------------------------------------------------ */
  /* UI de errores                                                            */
  /* ------------------------------------------------------------------------ */

  setFieldError(field, message) {
    const wrap = field.closest('.form-field') || field.parentElement;
    if (!wrap) return;

    wrap.classList.add('error');
    field.setAttribute('aria-invalid', 'true');

    const errorId = `${field.id || field.name}-error`;
    field.setAttribute('aria-describedby', errorId);

    let msgEl = wrap.querySelector('.error-message');
    if (!msgEl) {
      msgEl = document.createElement('span');
      msgEl.className = 'error-message';
      msgEl.id = errorId;
      msgEl.setAttribute('role', 'alert');
      wrap.appendChild(msgEl);
    }
    msgEl.textContent = message;
  }

  clearFieldError(field) {
    const wrap = field.closest('.form-field') || field.parentElement;
    if (wrap) {
      wrap.classList.remove('error');
      wrap.querySelector('.error-message')?.remove();
    }
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
  }

  renderErrors(form, errors) {
    this.clearErrors(form);
    errors.forEach((err) => {
      const field = form.querySelector(`[name="${err.name}"]`);
      if (field) this.setFieldError(field, err.message);
    });
  }

  clearErrors(form) {
    form.querySelectorAll('.form-field.error').forEach((w) => w.classList.remove('error'));
    form.querySelectorAll('.error-message').forEach((el) => el.remove());
    form.querySelectorAll('[aria-invalid="true"]').forEach((el) => {
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
    });
  }

  focusFirstError(form, errors) {
    if (!errors.length) return;
    const first = form.querySelector(`[name="${errors[0].name}"]`);
    first?.focus?.();
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                              */
  /* ------------------------------------------------------------------------ */

  /** Valida un formulario ya existente sin disparar envío. */
  validateFormElement(form) {
    const kind = form.dataset.formKind || this.detectKind(form);
    if (!kind) return { valid: true, errors: [] };
    return this.validate(kind, this.collect(form));
  }

  /** Sanitiza un string libre (útil antes de mailto o de construir body). */
  sanitize(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/[\u0000-\u001F\u007F]/g, '')
      .replace(/<\s*script[^>]*>.*?<\s*\/\s*script\s*>/gis, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  destroy() {
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    this._initialized = false;
    if (window.YSHDDValidator === this) window.YSHDDValidator = null;
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getValidator() {
  if (!instance) instance = new Validator();
  return instance;
}

export default getValidator;

if (typeof window !== 'undefined') {
  const bind = () => {
    const v = getValidator();
    window.YSHDDValidator = v;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
