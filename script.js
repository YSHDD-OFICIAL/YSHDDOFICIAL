/**
 * ============================================================================
 * script.js — YSHDD EPK Premium 2027
 * Módulo de utilidades de UI: loader, menú, header, scroll reveal, back-to-top,
 * modales, bio expandible, video modal, temas, búsqueda, filtros de galería,
 * formularios y notificaciones.
 *
 * - Sin dependencias externas.
 * - Compatible con HTML actualizado (IDs y clases de index.html v3).
 * - Idempotente: todos los inicializadores comprueban existencia de nodos.
 * - Accesible (WCAG 2.2 AA): aria-expanded, aria-pressed, focus trap básico,
 *   prefers-reduced-motion respetado.
 * - No usa estilos inline salvo casos justificados (overlay/scroll).
 * ============================================================================
 */

'use strict';

/* ============================================================================
   HELPERS
   ============================================================================ */

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const safe = (fn) => {
  try { return fn(); }
  catch (err) { console.warn('[YSHDD]', err); return null; }
};

/* ============================================================================
   LOADER
   ============================================================================ */

function initLoader() {
  const loader = $('#loader');
  if (!loader) return;

  const hide = () => {
    loader.classList.add('hidden');
    loader.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('loading');
  };

  // Ocultar tras window.load o tras un timeout máximo (nunca bloquear).
  if (document.readyState === 'complete') {
    setTimeout(hide, 350);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 350), { once: true });
    setTimeout(hide, 2500); // fallback defensivo
  }
}

/* ============================================================================
   MENÚ MÓVIL
   ============================================================================ */

function initMobileMenu() {
  const toggle = $('#navToggle');
  const nav    = $('#mainNav');
  if (!toggle || !nav) return;

  const close = () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('open');
    document.body.style.overflow = '';
  };

  const open = () => {
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  // Cerrar al hacer click en un enlace
  $$('a', nav).forEach((link) => {
    link.addEventListener('click', close);
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      close();
      toggle.focus();
    }
  });

  // Cerrar al cambiar de breakpoint
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener?.('change', (e) => { if (e.matches) close(); });
}

/* ============================================================================
   HEADER SCROLL EFFECT
   ============================================================================ */

function initHeaderScroll() {
  const header = $('#mainHeader');
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('scrolled', window.scrollY > 50);
      lastY = window.scrollY;
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================================
   READING PROGRESS
   ============================================================================ */

function initReadingProgress() {
  const bar = $('.reading-progress-bar');
  if (!bar) return;

  const update = () => {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const progress     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.inlineSize = `${Math.min(100, Math.max(0, progress))}%`;
  };

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ============================================================================
   SCROLL REVEAL
   ============================================================================ */

function initScrollReveal() {
  const elements = $$('.scroll-reveal');
  if (!elements.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -100px 0px', threshold: 0.1 }
  );

  elements.forEach((el) => observer.observe(el));
}

/* ============================================================================
   BACK TO TOP
   ============================================================================ */

function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;

  const updateVisibility = () => {
    const show = window.scrollY > 500;
    btn.hidden = !show;
    btn.setAttribute('aria-hidden', show ? 'false' : 'true');
  };

  btn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();
}

/* ============================================================================
   VIDEO MODAL (galería → iframe YouTube)
   ============================================================================ */

function initVideoModal() {
  const triggers = $$('.play-video, [data-video-id]');
  const modal    = $('#videoModal');
  const iframe   = $('#videoIframe');
  const closeBtn = $('#videoModal .modal-close');

  // Si no existe el modal en el DOM, salir silenciosamente.
  if (!triggers.length || !modal || !iframe) return;

  let lastFocused = null;

  const trapFocus = (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      modal
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  };

  const openModal = (videoId) => {
    if (!videoId) return;
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    modal.classList.add('show');
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lastFocused = document.activeElement;
    (closeBtn || modal).focus();
    document.addEventListener('keydown', trapFocus);
  };

  const closeModal = () => {
    modal.classList.remove('show');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    iframe.src = '';
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trapFocus);
    lastFocused?.focus?.();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const id =
        trigger.dataset.videoId ||
        trigger.closest('[data-video-id]')?.dataset.videoId ||
        trigger.querySelector('[data-video-id]')?.dataset.videoId;
      openModal(id);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });
}

/* ============================================================================
   BIO EXPANDIBLE (por si el HTML incluye #toggle-bio / #more-bio)
   ============================================================================ */

function initExpandableBio() {
  const btn   = $('#toggle-bio');
  const extra = $('#more-bio');
  if (!btn || !extra) return;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    extra.classList.toggle('show', !expanded);
    extra.hidden = expanded;
    btn.innerHTML = expanded
      ? 'Leer más <i class="bx bx-chevron-down" aria-hidden="true"></i>'
      : 'Leer menos <i class="bx bx-chevron-up" aria-hidden="true"></i>';
  });
}

/* ============================================================================
   THEME TOGGLE (dark / light)
   ============================================================================ */

function initThemeToggle() {
  const toggle = $('#themeToggle');
  if (!toggle) return;

  const STORAGE_KEY = 'yshdd-theme';
  const root = document.documentElement;

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    toggle.setAttribute('aria-pressed', String(theme === 'light'));
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'bx bx-sun' : 'bx bx-moon';
    }
  };

  const stored = safe(() => localStorage.getItem(STORAGE_KEY));
  const system = window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';

  apply(stored || system);

  toggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    apply(next);
    safe(() => localStorage.setItem(STORAGE_KEY, next));
  });
}

/* ============================================================================
   SHARE (Web Share API + fallback clipboard)
   ============================================================================ */

async function initShare() {
  const btn = $('#shareBtn');
  if (!btn) return;

  const notify = (msg) => window.YSHDD?.notify?.(msg, 'success');

  btn.addEventListener('click', async () => {
    const data = {
      title: document.title,
      text: 'EPK oficial de YSHDD — Rap Cristiano desde Cali',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(data.url);
      notify?.('Enlace copiado al portapapeles');
    } catch {
      // Fallback final: seleccionar URL para copiar manualmente
      window.prompt('Copia este enlace:', data.url);
    }
  });
}

/* ============================================================================
   BÚSQUEDA INTERNA
   ============================================================================ */

function initSearch() {
  const openBtn  = $('#searchBtn');
  const panel    = $('#searchPanel');
  const input    = $('#searchInput');
  const results  = $('#searchResults');
  if (!openBtn || !panel) return;

  // Dataset indexable: secciones y sus títulos
  const index = $$('main section[id]').map((section) => {
    const heading = section.querySelector('h1, h2');
    return {
      id: section.id,
      title: heading ? heading.textContent.trim() : section.id,
      text: section.textContent.trim().slice(0, 800),
    };
  });

  const toggle = (force) => {
    const willOpen = typeof force === 'boolean' ? force : panel.hidden;
    panel.hidden = !willOpen;
    openBtn.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) input?.focus();
  };

  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.addEventListener('click', () => toggle());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) toggle(false);
  });

  panel.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = (input?.value || '').trim().toLowerCase();
    if (!q) return;

    const matches = index.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
    );

    if (!results) return;
    results.innerHTML = matches.length
      ? matches
          .map(
            (m) =>
              `<a href="#${m.id}">${m.title}</a>`
          )
          .join('')
      : '<p>Sin resultados.</p>';

    $('#search-results')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}

/* ============================================================================
   FILTROS DE GALERÍA
   ============================================================================ */

function initGalleryFilters() {
  const filters = $$('.gallery-filters [data-filter]');
  const items   = $$('#gallery .gallery-grid figure[data-cat]');
  if (!filters.length || !items.length) return;

  const apply = (cat) => {
    items.forEach((fig) => {
      const show = cat === 'all' || fig.dataset.cat === cat;
      fig.hidden = !show;
    });

    filters.forEach((btn) => {
      btn.setAttribute(
        'aria-pressed',
        String(btn.dataset.filter === cat)
      );
    });
  };

  filters.forEach((btn) => {
    btn.addEventListener('click', () => apply(btn.dataset.filter));
  });

  apply('all');
}

/* ============================================================================
   FORMULARIOS (mailto:) — feedback accesible
   ============================================================================ */

function initForms() {
  const forms = $$('form[action^="mailto:"]');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener('submit', () => {
      // mailto: no requiere preventDefault (el navegador abre el cliente).
      // Damos feedback accesible breve.
      window.YSHDD?.notify?.(
        'Abriendo tu cliente de correo…',
        'info'
      );
    });
  });
}

/* ============================================================================
   SMOOTH SCROLL INTERNO (respetuoso con prefers-reduced-motion)
   ============================================================================ */

function initSmoothAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.getElementById(id.slice(1));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
    history.replaceState(null, '', id);
  });
}

/* ============================================================================
   SPY DE SECCIONES (resalta el enlace activo en la nav)
   ============================================================================ */

function initSectionSpy() {
  const links = $$('#mainNav a[href^="#"]');
  const sections = links
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (!links.length || !sections.length) return;

  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((a) =>
          a.setAttribute(
            'aria-current',
            a.getAttribute('href') === `#${id}` ? 'page' : 'false'
          )
        );
      });
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
}

/* ============================================================================
   EXPUESTO PÚBLICO: NOTIFICACIONES (usado por otros módulos)
   ============================================================================ */

function notify(message, type = 'info', timeout = 4000) {
  const container = $('#notifications');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="notification-icon" aria-hidden="true">●</span>
    <div class="notification-content">
      <p class="notification-message">${message}</p>
    </div>
    <button type="button" class="notification-close" aria-label="Cerrar notificación">×</button>
  `;

  const remove = () => el.remove();
  el.querySelector('.notification-close').addEventListener('click', remove);
  container.appendChild(el);
  setTimeout(remove, timeout);
}

/* ============================================================================
   API GLOBAL PARA MAIN.JS
   ============================================================================ */

window.YSHDD = Object.assign(window.YSHDD || {}, {
  notify,
  helpers: { $, $$, prefersReducedMotion, safe },
});

/* ============================================================================
   BOOTSTRAP
   ============================================================================ */

function bootstrap() {
  safe(initLoader);
  safe(initMobileMenu);
  safe(initHeaderScroll);
  safe(initReadingProgress);
  safe(initScrollReveal);
  safe(initBackToTop);
  safe(initVideoModal);
  safe(initExpandableBio);
  safe(initThemeToggle);
  safe(initShare);
  safe(initSearch);
  safe(initGalleryFilters);
  safe(initForms);
  safe(initSmoothAnchors);
  safe(initSectionSpy);

  // Marcar cargado para evitar parpadeos del loader
  document.body.classList.add('loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
