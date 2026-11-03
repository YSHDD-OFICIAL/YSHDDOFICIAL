/**
 * ============================================================================
 * sessions.js — YSHDD EPK Premium 2027
 * Módulo de "Sesiones" (live, acústicas, estudio, behind-the-scenes).
 *
 * Reglas del proyecto:
 * - 100% estático, sin backend. No hay rutas fantasma.
 * - Solo usa las imágenes REALES del repo.
 * - DOM generado con textContent / createElement (sin innerHTML peligroso).
 * - Integra YSHDD.notify() si está disponible.
 * - Accesible (WCAG 2.2 AA): <time datetime>, alt descriptivos, aria-*.
 * - Idempotente: puede importarse varias veces sin duplicar handlers.
 *
 * Contrato esperado del HTML (index.html v3):
 *   #sessions                       (sección, ya existe)
 *   .sessions-grid                  (opcional, se rellena si está vacío)
 *   .upcoming-grid                  (opcional)
 *   #live-tab .sessions-grid        (opcional)
 *   #acoustic-tab .acoustic-tracks  (opcional)
 * Si ninguno existe, el módulo simplemente expone datos en YSHDD.state.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Datos REALES del repo
   ----------------------------------------------------------------------------
   No inventar rutas. Solo se usan los archivos existentes.
   Las sesiones de estudio acústicas usan las portadas visuales reales.
   ============================================================================ */

const REAL_IMAGES = {
  portrait:      'YSHDD.png',
  crisisCover:   'CRISIS.png',
  crisisVisual:  'crisis-v.png',
  quienSoy:      'Quien_soy_yo.png',
  vidaNueva:     'VIDA-NUEVA.png',
  valorLegado:   'EL%20VALOR%20DEL%20LEGADO.png',
  callesDeOro:   'CALLES%20DE%20ORO%20(INS).png',
  contraDiablo:  'CONTRA%20EL%20DIABLO.png',
  elDon:         'EL%20DON.png',
  jordan23:      'JORDAN%2023.png',
  nuestroJuez:   'NUESTRO%20JUEZ.png',
  noMasCritica:  'No%20M%C3%A1s%20Cr%C3%ADtica%20(INS).png',
  soldadoDelRey: 'SOLDADO%20DEL%20REY.png',
  jheyDae:       'JHEY-DAE.png',
};

const YOUTUBE_CRISIS = CONFIG?.external?.youtubeVideoCRISIS || 'https://youtu.be/naMGlK1ozFc';

/* ============================================================================
   Modelo de datos
   ----------------------------------------------------------------------------
   Todo lo que aparece aquí representa contenido real o claramente neutro.
   Lo que no está confirmado se marca como "Por confirmar".
   ============================================================================ */

const LIVE_SESSIONS = [
  {
    id: 'live-crisis',
    title: 'Sesión de grabación · CRISIS',
    description:
      'Registro en estudio del álbum debut CRISIS (5 tracks, 16:06).',
    thumbnail: REAL_IMAGES.crisisVisual,
    alt: 'Visual del álbum CRISIS de YSHDD usado en la sesión de grabación',
    duration: '16:06',
    date: '2025',
    location: 'Cali, Colombia',
    tags: ['estudio', 'álbum'],
    videoId: 'naMGlK1ozFc',
    videoUrl: YOUTUBE_CRISIS,
  },
  {
    id: 'live-legado',
    title: 'El Valor del Legado',
    description:
      'Sesión enfocada en el track "El Valor del Legado". Disponible en audio oficial.',
    thumbnail: REAL_IMAGES.valorLegado,
    alt: 'Portada del sencillo El Valor del Legado de YSHDD',
    duration: '—',
    date: '2025',
    location: 'Cali, Colombia',
    tags: ['audio', 'estudio'],
    videoId: null,
    videoUrl: null,
  },
];

const ACOUSTIC_SESSIONS = [
  {
    id: 'acoustic-1',
    title: 'Sesión Acústica · Selección CRISIS',
    description:
      'Versiones acústicas de selección del álbum CRISIS (contenido por confirmar).',
    thumbnail: REAL_IMAGES.crisisCover,
    alt: 'Portada del álbum CRISIS de YSHDD',
    date: '2025',
    tracks: [
      { title: '¿Quién Soy? (Acústico)', duration: 'Por confirmar' },
      { title: 'CRISIS (Acústico)', duration: 'Por confirmar' },
    ],
  },
];

const UPCOMING_SESSIONS = [
  // DATO REAL REQUERIDO: fechas confirmadas de sesiones o presentaciones.
  // Se deja un placeholder neutro, no una fecha falsa.
  {
    id: 'upcoming-1',
    title: 'Sesión por confirmar',
    description:
      'Estamos preparando nuevas sesiones. Escríbenos para proponer una colaboración o cobertura.',
    date: null,
    time: null,
    location: 'Por confirmar',
    type: 'TBD',
  },
];

/* ============================================================================
   Clase Sessions
   ============================================================================ */

export class Sessions {
  constructor(options = {}) {
    this.options = {
      autoMount: true,
      ...options,
    };

    this.data = {
      live: [...LIVE_SESSIONS],
      acoustic: [...ACOUSTIC_SESSIONS],
      upcoming: [...UPCOMING_SESSIONS],
    };

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

    this.renderLiveSessions();
    this.renderAcousticSessions();
    this.renderUpcomingSessions();
    this.setupEventListeners();

    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.sessions = this;
      window.YSHDD.state.modules.sesiones = this;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render: Live Sessions                                                    */
  /* ------------------------------------------------------------------------ */

  renderLiveSessions() {
    const container =
      document.querySelector('#live-tab .sessions-grid') ||
      document.querySelector('#sessions .sessions-grid');

    if (!container) return;

    // No sobreescribir contenido si ya hay elementos (SEO-friendly)
    if (container.children.length > 0) return;

    const frag = document.createDocumentFragment();
    this.data.live.forEach((session) => {
      frag.appendChild(this.createSessionCard(session));
    });
    container.appendChild(frag);
  }

  /* ------------------------------------------------------------------------ */
  /* Render: Acoustic Sessions                                                */
  /* ------------------------------------------------------------------------ */

  renderAcousticSessions() {
    const container = document.querySelector('#acoustic-tab .acoustic-tracks');
    if (!container || container.children.length > 0) return;

    const session = this.data.acoustic[0];
    if (!session) return;

    const frag = document.createDocumentFragment();
    session.tracks.forEach((track, index) => {
      frag.appendChild(this.createTrackElement(track, index === 0, session.id));
    });
    container.appendChild(frag);
  }

  /* ------------------------------------------------------------------------ */
  /* Render: Upcoming Sessions                                                */
  /* ------------------------------------------------------------------------ */

  renderUpcomingSessions() {
    const container = document.querySelector('.upcoming-grid');
    if (!container || container.children.length > 0) return;

    const frag = document.createDocumentFragment();
    this.data.upcoming.forEach((session) => {
      frag.appendChild(this.createUpcomingCard(session));
    });
    container.appendChild(frag);
  }

  /* ------------------------------------------------------------------------ */
  /* Factories                                                                */
  /* ------------------------------------------------------------------------ */

  createSessionCard(session) {
    const card = document.createElement('article');
    card.className = 'session-card';
    card.dataset.sessionId = session.id;

    // Media
    const media = document.createElement('div');
    media.className = 'session-media';

    const thumb = document.createElement('div');
    thumb.className = 'session-thumbnail';

    const img = document.createElement('img');
    img.src = session.thumbnail;
    img.alt = session.alt || session.title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = 800;
    img.height = 450;
    thumb.appendChild(img);

    if (session.videoId) {
      const overlay = document.createElement('div');
      overlay.className = 'session-overlay';

      const playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'play-session';
      playBtn.dataset.videoId = session.videoId;
      playBtn.setAttribute('aria-label', `Reproducir ${session.title}`);
      playBtn.innerHTML = '<i class="bx bx-play-circle" aria-hidden="true"></i>';

      overlay.appendChild(playBtn);
      thumb.appendChild(overlay);
    }
    media.appendChild(thumb);

    // Tags
    if (Array.isArray(session.tags) && session.tags.length) {
      const tagsWrap = document.createElement('div');
      tagsWrap.className = 'session-tags';
      session.tags.forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsWrap.appendChild(span);
      });
      media.appendChild(tagsWrap);
    }

    // Info
    const info = document.createElement('div');
    info.className = 'session-info';

    const title = document.createElement('h3');
    title.className = 'session-title';
    title.textContent = session.title;

    const desc = document.createElement('p');
    desc.className = 'session-description';
    desc.textContent = session.description;

    const meta = document.createElement('div');
    meta.className = 'session-meta';

    if (session.date) {
      const t = document.createElement('time');
      // Acepta año o fecha ISO
      t.dateTime = /^\d{4}$/.test(session.date)
        ? `${session.date}`
        : session.date;
      t.innerHTML = `<i class="bx bx-calendar" aria-hidden="true"></i> ${UTILS.formatDate(
        /^\d{4}$/.test(session.date) ? `${session.date}-01-01` : session.date
      )}`;
      meta.appendChild(t);
    }

    if (session.duration) {
      const dur = document.createElement('span');
      dur.innerHTML = `<i class="bx bx-time" aria-hidden="true"></i> ${session.duration}`;
      meta.appendChild(dur);
    }

    if (session.location) {
      const loc = document.createElement('span');
      loc.innerHTML = `<i class="bx bx-map" aria-hidden="true"></i> ${session.location}`;
      meta.appendChild(loc);
    }

    info.append(title, desc, meta);

    card.append(media, info);
    return card;
  }

  createTrackElement(track, isActive = false, sessionId) {
    const row = document.createElement('div');
    row.className = `track-item ${isActive ? 'active' : ''}`;
    row.dataset.sessionId = sessionId || '';

    const info = document.createElement('div');
    info.className = 'track-info';

    const h4 = document.createElement('h4');
    h4.textContent = track.title;

    const p = document.createElement('p');
    p.textContent = track.duration || '—';

    info.append(h4, p);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'track-play';
    btn.dataset.track = track.title;
    btn.setAttribute('aria-label', `Reproducir ${track.title}`);
    btn.innerHTML = '<i class="bx bx-play" aria-hidden="true"></i>';

    row.append(info, btn);
    return row;
  }

  createUpcomingCard(session) {
    const card = document.createElement('article');
    card.className = 'upcoming-card';

    // Fecha
    const dateWrap = document.createElement('div');
    dateWrap.className = 'upcoming-date';

    const date = session.date ? new Date(session.date) : null;
    const day = date ? date.getDate() : '—';
    const month = date
      ? date.toLocaleString('es', { month: 'short' }).toUpperCase()
      : 'PRÓX';

    const dayEl = document.createElement('span');
    dayEl.className = 'date-day';
    dayEl.textContent = String(day);

    const monthEl = document.createElement('span');
    monthEl.className = 'date-month';
    monthEl.textContent = month;

    dateWrap.append(dayEl, monthEl);

    // Info
    const info = document.createElement('div');
    info.className = 'upcoming-info';

    const h4 = document.createElement('h4');
    h4.textContent = session.title;

    const p = document.createElement('p');
    p.textContent = session.description;

    const details = document.createElement('div');
    details.className = 'upcoming-details';

    if (session.time) {
      const t = document.createElement('span');
      t.innerHTML = `<i class="bx bx-time" aria-hidden="true"></i> ${session.time}`;
      details.appendChild(t);
    }
    if (session.location) {
      const l = document.createElement('span');
      l.innerHTML = `<i class="bx bx-map" aria-hidden="true"></i> ${session.location}`;
      details.appendChild(l);
    }

    info.append(h4, p, details);

    // Botón
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline btn-sm';
    btn.dataset.sessionId = session.id;
    btn.textContent = session.date ? 'Recordar' : 'Consultar';
    btn.setAttribute(
      'aria-label',
      session.date ? `Recordar ${session.title}` : `Consultar ${session.title}`
    );

    card.append(dateWrap, info, btn);
    return card;
  }

  /* ------------------------------------------------------------------------ */
  /* Eventos                                                                  */
  /* ------------------------------------------------------------------------ */

  setupEventListeners() {
    const onClick = (e) => {
      // Reproducir sesión (iframe del video)
      const playBtn = e.target.closest('.play-session');
      if (playBtn) {
        const videoId = playBtn.getAttribute('data-video-id');
        if (videoId) this.playSession(videoId);
        return;
      }

      // Track acústico
      const trackBtn = e.target.closest('.track-play');
      if (trackBtn) {
        this.playTrack(trackBtn.getAttribute('data-track') || '');
        return;
      }

      // Recordar sesión
      const rememberBtn = e.target.closest('.upcoming-card [data-session-id], .upcoming-card .btn');
      if (rememberBtn && rememberBtn.classList.contains('btn')) {
        const id = rememberBtn.getAttribute('data-session-id');
        if (id) this.rememberSession(id);
      }
    };

    document.addEventListener('click', onClick);
    this._handlers.push(() => document.removeEventListener('click', onClick));
  }

  /* ------------------------------------------------------------------------ */
  /* Acciones                                                                 */
  /* ------------------------------------------------------------------------ */

  playSession(videoId) {
    // Preferimos delegación al modal global si existe
    const modal = document.getElementById('videoModal');
    const iframe = document.getElementById('videoIframe');

    if (modal && iframe) {
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      modal.hidden = false;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      return;
    }

    // Fallback: abrir en nueva pestaña
    window.open(
      `https://www.youtube-nocookie.com/embed/${videoId}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  playTrack(trackTitle) {
    if (!trackTitle) return;
    if (window.YSHDD?.notify) {
      window.YSHDD.notify(
        `Reproducción de "${trackTitle}" por confirmar.`,
        'info'
      );
    } else {
      console.log(`[sessions] ${trackTitle}`);
    }
  }

  rememberSession(sessionId) {
    const session =
      this.data.upcoming.find((s) => s.id === sessionId) ||
      this.data.live.find((s) => s.id === sessionId);

    if (!session) return;

    // Sin backend: si no hay fecha real, derivamos a mailto.
    if (!session.date) {
      const email = CONFIG.artist?.booking?.email || 'yshddoficial@gmail.com';
      const subject = encodeURIComponent(
        `Consulta sesión · ${session.title}`
      );
      window.location.href = `mailto:${email}?subject=${subject}`;
      return;
    }

    // Con fecha real: ofrecer descarga .ics
    try {
      const ics = this.buildICS(session);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yshdd-${session.id}.ics`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 100);

      if (window.YSHDD?.notify) {
        window.YSHDD.notify('Evento agregado al calendario.', 'success');
      }
    } catch {
      if (window.YSHDD?.notify) {
        window.YSHDD.notify('No se pudo agregar al calendario.', 'warning');
      }
    }
  }

  buildICS(session) {
    const start = new Date(
      `${session.date}T${session.time || '12:00'}:00`
    ).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(
      new Date(`${session.date}T${session.time || '12:00'}:00`).getTime() +
        60 * 60 * 1000
    ).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//YSHDD EPK//ES',
      'BEGIN:VEVENT',
      `UID:${session.id}@yshdd.netlify.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:YSHDD — ${session.title}`,
      `DESCRIPTION:${(session.description || '').replace(/\n/g, ' ')}`,
      `LOCATION:${session.location || 'Por confirmar'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  /* ------------------------------------------------------------------------ */
  /* API                                                                      */
  /* ------------------------------------------------------------------------ */

  getStats() {
    return {
      totalLive: this.data.live.length,
      totalAcoustic: this.data.acoustic.length,
      totalUpcoming: this.data.upcoming.length,
      totalTracks: this.data.acoustic.reduce(
        (n, s) => n + (s.tracks?.length || 0),
        0
      ),
    };
  }

  destroy() {
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    this._bound = false;
    if (window.YSHDD?.state?.modules) {
      delete window.YSHDD.state.modules.sessions;
      delete window.YSHDD.state.modules.sesiones;
    }
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getSessions() {
  if (!instance) instance = new Sessions();
  return instance;
}

export default getSessions;

if (typeof window !== 'undefined') {
  const bind = () => {
    const sessions = getSessions();
    window.YSHDDSessions = sessions;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
