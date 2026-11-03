/**
 * ============================================================================
 * jugador.js — YSHDD EPK Premium 2027
 * Reproductor de audio del EPK (progresivo, sin frameworks).
 *
 * Características:
 * - Usa el <audio> real que ya está en index.html (#music audio) si existe.
 *   Si no hay <audio>, crea uno y lo monta en el contenedor .player.
 * - Controles accesibles (WCAG 2.2 AA): botones nativos, aria-*, teclado,
 *   foco visible, barra de progreso con role="slider".
 * - Persistencia de volumen y "última pista" vía localStorage.
 * - Respeta prefers-reduced-motion.
 * - Integra YSHDD.notify() si está disponible.
 * - Idempotente: se puede importar múltiples veces sin duplicar listeners.
 *
 * Rutas REALES del repo:
 *   - EL VALOR DEL LEGADO.mp3  →  "EL%20VALOR%20DEL%20LEGADO.mp3"
 *   - crisis-v.png             →  portada del reproductor
 *
 * NO inventar rutas de audio: solo existe un mp3 real en el repo.
 * La playlist completa (CRISIS, ¿Quién Soy?) se resuelve con enlaces
 * externos a Spotify/YouTube desde el HTML, no como pistas locales.
 * ============================================================================
 */

'use strict';

import { CONFIG, CONSTANTS, UTILS } from './config.js';

/* ============================================================================
   Playlist real (solo pista existente en el repo)
   ----------------------------------------------------------------------------
   Los demás lanzamientos se enlazan externamente desde el HTML.
   ============================================================================ */

const REAL_TRACKS = [
  {
    id: 'el-valor-del-legado',
    title: 'El Valor del Legado',
    artist: 'YSHDD',
    album: 'CRISIS',
    year: 2025,
    duration: '—', // se rellena al cargar metadata
    src: 'EL%20VALOR%20DEL%20LEGADO.mp3',
    cover: 'crisis-v.png',
  },
];

/* ============================================================================
   Player
   ============================================================================ */

export class Player {
  constructor(options = {}) {
    this.options = {
      mountSelector: '#music',
      autoInit: true,
      ...options,
    };

    this.audio = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.shuffle = false;
    this.repeat = 'none'; // none | one | all

    this.volume = CONFIG?.features?.musicPlayer?.volume ?? 80;
    this.currentTime = 0;
    this.duration = 0;
    this.currentIndex = 0;

    this.playlist = [...REAL_TRACKS];
    this.currentTrack = this.playlist[0] || null;

    // Elementos UI
    this.el = {
      container: null,
      playBtn: null,
      prevBtn: null,
      nextBtn: null,
      playIcon: null,
      progressBar: null,
      progressFill: null,
      timeCurrent: null,
      timeTotal: null,
      volumeSlider: null,
      volumeBtn: null,
      titleEl: null,
      artistEl: null,
      coverEl: null,
      shuffleBtn: null,
      repeatBtn: null,
    };

    // Handlers guardados para destroy()
    this._handlers = [];
    this._initialized = false;

    if (this.options.autoInit) this.init();
  }

  /* ------------------------------------------------------------------------ */
  /* Init                                                                     */
  /* ------------------------------------------------------------------------ */

  async init() {
    if (this._initialized) return;
    this._initialized = true;

    this.mountAudio();
    this.cacheElements();
    this.bindAudioEvents();
    this.bindUIEvents();
    this.restoreState();
    this.syncUI();

    if (window.YSHDD?.state) {
      window.YSHDD.state.modules = window.YSHDD.state.modules || {};
      window.YSHDD.state.modules.jugador = this;
      window.YSHDD.state.modules.player = this;
      window.YSHDD.state.player = this.audio;
    }

    window.YSHDDPlayer = this;
  }

  /* ------------------------------------------------------------------------ */
  /* Audio                                                                   */
  /* ------------------------------------------------------------------------ */

  mountAudio() {
    // Buscar un <audio> existente dentro de #music
    const existing = document.querySelector('#music audio');
    if (existing) {
      this.audio = existing;
      // Normalizar atributos mínimos
      if (!this.audio.preload) this.audio.preload = 'metadata';
      return;
    }

    // Si no hay audio, crear uno a partir del primer track real
    const mount =
      document.querySelector(this.options.mountSelector) || document.body;

    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    if (this.currentTrack?.src) audio.src = this.currentTrack.src;

    audio.setAttribute('aria-label', 'Reproductor de audio de YSHDD');
    mount.appendChild(audio);

    this.audio = audio;
  }

  cacheElements() {
    this.el.container =
      document.querySelector(this.options.mountSelector) ||
      this.audio.closest('.player');

    const q = (sel) => (this.el.container || document).querySelector(sel);

    this.el.playBtn = q('[data-action="play"]');
    this.el.prevBtn = q('[data-action="prev"]');
    this.el.nextBtn = q('[data-action="next"]');
    this.el.playIcon = q('#playIcon');
    this.el.progressBar = q('.player-progress .progress-bar');
    this.el.progressFill = q('.player-progress .progress-fill');
    this.el.timeCurrent = q('.progress-time .current-time');
    this.el.timeTotal = q('.progress-time .total-time');
    this.el.volumeSlider = q('.volume-slider');
    this.el.volumeBtn = q('.volume-btn');
    this.el.titleEl = q('#currentTitle');
    this.el.artistEl = q('#currentArtist');
    this.el.coverEl = q('#currentCover');
    this.el.shuffleBtn = q('[data-action="shuffle"]');
    this.el.repeatBtn = q('[data-action="repeat"]');

    // Configurar barra de progreso accesible
    if (this.el.progressBar) {
      this.el.progressBar.setAttribute('role', 'slider');
      this.el.progressBar.setAttribute('tabindex', '0');
      this.el.progressBar.setAttribute('aria-label', 'Progreso de la pista');
      this.el.progressBar.setAttribute('aria-valuemin', '0');
      this.el.progressBar.setAttribute('aria-valuemax', '100');
      this.el.progressBar.setAttribute('aria-valuenow', '0');
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Audio events                                                            */
  /* ------------------------------------------------------------------------ */

  bindAudioEvents() {
    if (!this.audio) return;

    const add = (event, fn, opts) => {
      this.audio.addEventListener(event, fn, opts);
      this._handlers.push(() => this.audio.removeEventListener(event, fn, opts));
    };

    add('play', () => {
      this.isPlaying = true;
      this.updatePlayIcon();
      this.emit('onPlay', this.currentTrack);
    });

    add('pause', () => {
      this.isPlaying = false;
      this.updatePlayIcon();
      this.emit('onPause', this.currentTrack);
    });

    add('ended', () => {
      this.handleTrackEnd();
      this.emit('onEnd', this.currentTrack);
    });

    add('timeupdate', () => {
      this.currentTime = this.audio.currentTime || 0;
      this.duration = this.audio.duration || 0;
      this.updateProgress();
      this.emit('onTimeUpdate', {
        currentTime: this.currentTime,
        duration: this.duration,
        percentage: this.duration
          ? (this.currentTime / this.duration) * 100
          : 0,
      });
    });

    add('loadedmetadata', () => {
      this.duration = this.audio.duration || 0;
      if (this.el.timeTotal) {
        this.el.timeTotal.textContent = UTILS.formatDuration(this.duration);
      }
      if (this.currentTrack) {
        this.currentTrack.duration = UTILS.formatDuration(this.duration);
      }
    });

    add('volumechange', () => {
      this.volume = Math.round((this.audio.volume || 0) * 100);
      this.isMuted = this.audio.muted;
      this.updateVolumeUI();
      this.emit('onVolumeChange', this.volume);
      this.saveState();
    });

    add('error', () => {
      this.handleError();
    });
  }

  /* ------------------------------------------------------------------------ */
  /* UI events                                                               */
  /* ------------------------------------------------------------------------ */

  bindUIEvents() {
    const bind = (el, event, fn) => {
      if (!el) return;
      el.addEventListener(event, fn);
      this._handlers.push(() => el.removeEventListener(event, fn));
    };

    bind(this.el.playBtn, 'click', () => this.togglePlay());
    bind(this.el.prevBtn, 'click', () => this.prev());
    bind(this.el.nextBtn, 'click', () => this.next());

    // Seek click/touch
    bind(this.el.progressBar, 'click', (e) => this.seekByPointer(e));
    bind(this.el.progressBar, 'keydown', (e) => this.seekByKeyboard(e));

    // Volumen
    bind(this.el.volumeSlider, 'input', (e) =>
      this.setVolume(Number(e.target.value))
    );
    bind(this.el.volumeBtn, 'click', () => this.toggleMute());

    // Shuffle / Repeat
    bind(this.el.shuffleBtn, 'click', () => {
      this.shuffle = !this.shuffle;
      this.el.shuffleBtn.setAttribute('aria-pressed', String(this.shuffle));
    });
    bind(this.el.repeatBtn, 'click', () => {
      this.repeat = this.repeat === 'none'
        ? 'all'
        : this.repeat === 'all'
        ? 'one'
        : 'none';
      this.el.repeatBtn.setAttribute('aria-pressed', String(this.repeat !== 'none'));
      this.el.repeatBtn.dataset.mode = this.repeat;
    });

    // Atajos globales (no interfieren con inputs)
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.target?.isContentEditable) return;

      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        // Solo si el foco NO está en un botón (evita doble toggle)
        if (e.target?.tagName !== 'BUTTON') {
          e.preventDefault();
          this.togglePlay();
        }
      } else if (e.ctrlKey && e.code === 'KeyM') {
        e.preventDefault();
        this.toggleMute();
      } else if (e.ctrlKey && e.code === 'ArrowRight') {
        e.preventDefault();
        this.seekBy(10);
      } else if (e.ctrlKey && e.code === 'ArrowLeft') {
        e.preventDefault();
        this.seekBy(-10);
      } else if (e.ctrlKey && e.code === 'ArrowUp') {
        e.preventDefault();
        this.setVolume(Math.min(100, this.volume + 10));
      } else if (e.ctrlKey && e.code === 'ArrowDown') {
        e.preventDefault();
        this.setVolume(Math.max(0, this.volume - 10));
      }
    };
    document.addEventListener('keydown', onKey);
    this._handlers.push(() => document.removeEventListener('keydown', onKey));
  }

  /* ------------------------------------------------------------------------ */
  /* Estado persistente                                                      */
  /* ------------------------------------------------------------------------ */

  restoreState() {
    if (!this.audio) return;

    // Volumen
    try {
      const storedVolume = localStorage.getItem(
        CONSTANTS.STORAGE_KEYS.MUSIC_VOLUME
      );
      if (storedVolume !== null) {
        const v = Math.min(100, Math.max(0, Number(storedVolume)));
        if (Number.isFinite(v)) {
          this.audio.volume = v / 100;
          this.volume = v;
        }
      }
    } catch { /* no-op */ }

    // Última pista (solo si hay más de una; aquí solo hay una real)
    try {
      const last = localStorage.getItem('yshdd-last-track');
      if (last) {
        const idx = this.playlist.findIndex((t) => t.id === last);
        if (idx >= 0) {
          this.currentIndex = idx;
          this.currentTrack = this.playlist[idx];
        }
      }
    } catch { /* no-op */ }
  }

  saveState() {
    try {
      localStorage.setItem(
        CONSTANTS.STORAGE_KEYS.MUSIC_VOLUME,
        String(this.volume)
      );
      if (this.currentTrack) {
        localStorage.setItem('yshdd-last-track', this.currentTrack.id);
      }
    } catch { /* no-op */ }
  }

  /* ------------------------------------------------------------------------ */
  /* Controls                                                                */
  /* ------------------------------------------------------------------------ */

  play(track = null) {
    if (!this.audio) return;

    if (track) {
      this.currentTrack = track;
      this.currentIndex = this.playlist.indexOf(track);
      this.loadCurrent();
    }

    if (!this.currentTrack) return;

    this.audio.play().catch((err) => {
      console.warn('[player] play error:', err?.message || err);
      this.handleError();
    });
  }

  pause() {
    this.audio?.pause?.();
  }

  togglePlay() {
    if (!this.audio) return;
    if (this.isPlaying) this.pause();
    else this.play();
  }

  prev() {
    if (!this.playlist.length) return;
    const idx = this.shuffle
      ? this.randomIndex()
      : (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.currentIndex = idx;
    this.currentTrack = this.playlist[idx];
    this.loadCurrent();
    this.play();
  }

  next() {
    if (!this.playlist.length) return;
    const idx = this.shuffle
      ? this.randomIndex()
      : (this.currentIndex + 1) % this.playlist.length;
    this.currentIndex = idx;
    this.currentTrack = this.playlist[idx];
    this.loadCurrent();
    this.play();
  }

  loadCurrent() {
    if (!this.audio || !this.currentTrack) return;
    if (this.audio.src !== this.currentTrack.src) {
      this.audio.src = this.currentTrack.src;
      this.audio.load();
    }
    this.syncUI();
  }

  randomIndex() {
    if (this.playlist.length <= 1) return 0;
    let idx;
    do {
      idx = Math.floor(Math.random() * this.playlist.length);
    } while (idx === this.currentIndex);
    return idx;
  }

  handleTrackEnd() {
    switch (this.repeat) {
      case 'one':
        this.play(this.currentTrack);
        break;
      case 'all':
        this.next();
        break;
      default:
        if (this.currentIndex < this.playlist.length - 1) {
          this.next();
        } else {
          this.pause();
          this.audio.currentTime = 0;
          this.updateProgress();
        }
    }
  }

  seekByPointer(event) {
    if (!this.audio?.duration || !this.el.progressBar) return;
    const rect = this.el.progressBar.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width)
    );
    this.audio.currentTime = ratio * this.audio.duration;
    this.updateProgress();
  }

  seekByKeyboard(event) {
    if (!this.audio?.duration) return;
    const step = 5; // segundos
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.seekBy(step);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.seekBy(-step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.audio.currentTime = 0;
      this.updateProgress();
    } else if (event.key === 'End') {
      event.preventDefault();
      this.audio.currentTime = this.audio.duration;
      this.updateProgress();
    }
  }

  seekBy(seconds) {
    if (!this.audio?.duration) return;
    this.audio.currentTime = Math.min(
      this.audio.duration,
      Math.max(0, this.audio.currentTime + seconds)
    );
    this.updateProgress();
  }

  setVolume(value) {
    if (!this.audio) return;
    const v = Math.min(100, Math.max(0, Number(value) || 0));
    this.audio.volume = v / 100;
    this.volume = v;
    this.updateVolumeUI();
    this.saveState();
  }

  toggleMute() {
    if (!this.audio) return;
    this.audio.muted = !this.audio.muted;
    this.isMuted = this.audio.muted;
    this.updateVolumeUI();
  }

  /* ------------------------------------------------------------------------ */
  /* UI sync                                                                 */
  /* ------------------------------------------------------------------------ */

  syncUI() {
    this.updatePlayIcon();
    this.updateProgress();
    this.updateVolumeUI();
    this.updateTrackInfo();
  }

  updatePlayIcon() {
    if (!this.el.playIcon) return;
    this.el.playIcon.className = this.isPlaying ? 'bx bx-pause' : 'bx bx-play';
    if (this.el.playBtn) {
      this.el.playBtn.setAttribute(
        'aria-label',
        this.isPlaying ? 'Pausar audio' : 'Reproducir audio'
      );
    }
  }

  updateProgress() {
    if (!this.el.progressFill) return;
    const pct = this.duration
      ? Math.min(100, (this.currentTime / this.duration) * 100)
      : 0;
    this.el.progressFill.style.inlineSize = `${pct}%`;

    if (this.el.progressBar) {
      this.el.progressBar.setAttribute(
        'aria-valuenow',
        String(Math.round(pct))
      );
      this.el.progressBar.setAttribute(
        'aria-valuetext',
        `${UTILS.formatDuration(this.currentTime)} de ${UTILS.formatDuration(
          this.duration
        )}`
      );
    }

    if (this.el.timeCurrent) {
      this.el.timeCurrent.textContent = UTILS.formatDuration(this.currentTime);
    }
    if (this.el.timeTotal) {
      this.el.timeTotal.textContent = UTILS.formatDuration(this.duration);
    }
  }

  updateVolumeUI() {
    if (this.el.volumeSlider) this.el.volumeSlider.value = this.volume;

    if (this.el.volumeBtn) {
      let icon = 'bx-volume-full';
      if (this.isMuted || this.volume === 0) icon = 'bx-volume-mute';
      else if (this.volume < 30) icon = 'bx-volume-low';
      else if (this.volume < 70) icon = 'bx-volume';
      this.el.volumeBtn.innerHTML = `<i class="bx ${icon}" aria-hidden="true"></i>`;
      this.el.volumeBtn.setAttribute(
        'aria-label',
        this.isMuted ? 'Activar sonido' : 'Silenciar'
      );
    }
  }

  updateTrackInfo() {
    if (!this.currentTrack) return;
    if (this.el.titleEl) this.el.titleEl.textContent = this.currentTrack.title;
    if (this.el.artistEl) this.el.artistEl.textContent = this.currentTrack.artist;
    if (this.el.coverEl && this.currentTrack.cover) {
      this.el.coverEl.src = this.currentTrack.cover;
      this.el.coverEl.alt = `Portada de ${this.currentTrack.title}`;
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Errores                                                                 */
  /* ------------------------------------------------------------------------ */

  handleError() {
    const msg =
      'No se pudo reproducir el audio. Revisa tu conexión o intenta de nuevo.';
    if (window.YSHDD?.notify) window.YSHDD.notify(msg, 'error');
    else console.warn('[player]', msg);
  }

  /* ------------------------------------------------------------------------ */
  /* Event emitter                                                           */
  /* ------------------------------------------------------------------------ */

  _events = {
    onPlay: [],
    onPause: [],
    onEnd: [],
    onTimeUpdate: [],
    onVolumeChange: [],
  };

  on(event, cb) {
    (this._events[event] ||= []).push(cb);
  }

  off(event, cb) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter((fn) => fn !== cb);
    }
  }

  emit(event, data) {
    (this._events[event] || []).forEach((fn) => {
      try { fn(data); } catch { /* no-op */ }
    });
  }

  /* ------------------------------------------------------------------------ */
  /* API pública                                                             */
  /* ------------------------------------------------------------------------ */

  getCurrentTrack() { return this.currentTrack; }
  getPlaylist() { return [...this.playlist]; }
  getCurrentTime() { return this.currentTime; }
  getDuration() { return this.duration; }
  getVolume() { return this.volume; }
  isCurrentlyMuted() { return this.isMuted; }
  setShuffle(v) { this.shuffle = Boolean(v); }
  setRepeat(mode) {
    if (['none', 'one', 'all'].includes(mode)) this.repeat = mode;
  }

  destroy() {
    this.pause();
    this._handlers.forEach((fn) => fn());
    this._handlers = [];
    if (this.audio) {
      try { this.audio.src = ''; } catch { /* no-op */ }
      this.audio = null;
    }
    this._events = {
      onPlay: [], onPause: [], onEnd: [], onTimeUpdate: [], onVolumeChange: [],
    };
    if (window.YSHDDPlayer === this) window.YSHDDPlayer = null;
    this._initialized = false;
  }
}

/* ============================================================================
   Singleton + auto-bind
   ============================================================================ */

let instance = null;

export function getPlayer() {
  if (!instance) instance = new Player();
  return instance;
}

export default getPlayer;

if (typeof window !== 'undefined') {
  const bind = () => {
    const player = getPlayer();
    window.YSHDDPlayer = player;
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
}
