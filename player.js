// assets/js/player.js

import { CONFIG, UTILS } from './config.js';

export class Player {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTrack = null;
        this.trackList = [];
        this.currentTime = 0;
        this.duration = 0;
        this.volume = CONFIG.features.musicPlayer.volume;
        this.shuffle = false;
        this.repeat = 'none'; // none, one, all
        this.playlist = [];
        this.currentIndex = 0;
        
        this.elements = {
            playButton: null,
            prevButton: null,
            nextButton: null,
            playIcon: null,
            progressBar: null,
            progressFill: null,
            currentTime: null,
            totalTime: null,
            volumeSlider: null,
            volumeButton: null,
            trackTitle: null,
            trackArtist: null
        };
        
        this.events = {
            onPlay: [],
            onPause: [],
            onEnd: [],
            onTimeUpdate: [],
            onVolumeChange: []
        };
    }
    
    async init() {
        console.log('🎵 Inicializando reproductor...');
        
        // Crear elemento de audio
        this.audio = new Audio();
        this.audio.preload = 'metadata';
        this.audio.volume = this.volume / 100;
        
        // Configurar eventos de audio
        this.setupAudioEvents();
        
        // Obtener elementos DOM
        this.getDOMElements();
        
        // Configurar eventos UI
        this.setupUIEvents();
        
        // Cargar lista de reproducción
        await this.loadPlaylist();
        
        // Restaurar estado guardado
        this.restoreState();
        
        console.log('✅ Reproductor inicializado');
    }
    
    setupAudioEvents() {
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.emit('onPlay', this.currentTrack);
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.emit('onPause', this.currentTrack);
        });
        
        this.audio.addEventListener('ended', () => {
            this.handleTrackEnd();
            this.emit('onEnd', this.currentTrack);
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.duration = this.audio.duration || 0;
            this.updateProgress();
            this.emit('onTimeUpdate', {
                currentTime: this.currentTime,
                duration: this.duration,
                percentage: (this.currentTime / this.duration) * 100 || 0
            });
        });
        
        this.audio.addEventListener('volumechange', () => {
            this.volume = this.audio.volume * 100;
            this.updateVolumeUI();
            this.emit('onVolumeChange', this.volume);
            this.saveState();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('Error en reproductor:', e);
            this.handleError();
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateTimeDisplay();
        });
    }
    
    getDOMElements() {
        this.elements.playButton = document.querySelector('[data-action="play"]');
        this.elements.prevButton = document.querySelector('[data-action="prev"]');
        this.elements.nextButton = document.querySelector('[data-action="next"]');
        this.elements.playIcon = document.getElementById('playIcon');
        this.elements.progressBar = document.querySelector('.player-progress .progress-bar');
        this.elements.progressFill = document.querySelector('.player-progress .progress-fill');
        this.elements.currentTime = document.querySelector('.progress-time .current-time');
        this.elements.totalTime = document.querySelector('.progress-time .total-time');
        this.elements.volumeSlider = document.querySelector('.volume-slider');
        this.elements.volumeButton = document.querySelector('.volume-btn');
        this.elements.trackTitle = document.getElementById('currentTitle');
        this.elements.trackArtist = document.getElementById('currentArtist');
    }
    
    setupUIEvents() {
        // Botón play/pause
        if (this.elements.playButton) {
            this.elements.playButton.addEventListener('click', () => this.togglePlay());
        }
        
        // Botón anterior
        if (this.elements.prevButton) {
            this.elements.prevButton.addEventListener('click', () => this.prev());
        }
        
        // Botón siguiente
        if (this.elements.nextButton) {
            this.elements.nextButton.addEventListener('click', () => this.next());
        }
        
        // Control de progreso
        if (this.elements.progressBar) {
            this.elements.progressBar.addEventListener('click', (e) => this.seek(e));
        }
        
        // Control de volumen
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
        }
        
        if (this.elements.volumeButton) {
            this.elements.volumeButton.addEventListener('click', () => this.toggleMute());
        }
        
        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    if (e.ctrlKey) this.seekBackward(10);
                    break;
                case 'ArrowRight':
                    if (e.ctrlKey) this.seekForward(10);
                    break;
                case 'ArrowUp':
                    if (e.ctrlKey) this.changeVolume(10);
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey) this.changeVolume(-10);
                    break;
                case 'KeyM':
                    if (e.ctrlKey) this.toggleMute();
                    break;
            }
        });
    }
    
    async loadPlaylist() {
        try {
            // En producción, cargaría desde una API
            this.playlist = CONFIG.content.releases.map(release => ({
                id: release.id,
                title: release.title,
                artist: 'YSHDD',
                duration: release.duration,
                url: `/assets/media/audio/${release.id}.mp3`,
                cover: release.cover,
                plays: release.plays,
                likes: release.likes
            }));
            
            // Configurar primera canción
            if (this.playlist.length > 0) {
                this.currentTrack = this.playlist[0];
                this.updateTrackInfo();
            }
            
        } catch (error) {
            console.error('Error cargando playlist:', error);
        }
    }
    
    restoreState() {
        // Restaurar volumen
        const savedVolume = localStorage.getItem(CONFIG.STORAGE_KEYS.MUSIC_VOLUME);
        if (savedVolume) {
            this.volume = parseInt(savedVolume);
            this.audio.volume = this.volume / 100;
            if (this.elements.volumeSlider) {
                this.elements.volumeSlider.value = this.volume;
            }
        }
        
        // Restaurar última canción
        const lastTrackId = localStorage.getItem('yshdd-last-track');
        if (lastTrackId) {
            const track = this.playlist.find(t => t.id == lastTrackId);
            if (track) {
                this.currentTrack = track;
                this.currentIndex = this.playlist.indexOf(track);
                this.updateTrackInfo();
            }
        }
    }
    
    saveState() {
        localStorage.setItem(CONFIG.STORAGE_KEYS.MUSIC_VOLUME, this.volume);
        if (this.currentTrack) {
            localStorage.setItem('yshdd-last-track', this.currentTrack.id);
        }
    }
    
    play(track = null) {
        if (track) {
            this.currentTrack = track;
            this.currentIndex = this.playlist.indexOf(track);
            this.updateTrackInfo();
        }
        
        if (!this.currentTrack) {
            console.error('No hay canción seleccionada');
            return;
        }
        
        if (this.audio.src !== this.currentTrack.url) {
            this.audio.src = this.currentTrack.url;
            this.audio.load();
        }
        
        this.audio.play().catch(error => {
            console.error('Error reproduciendo audio:', error);
            // Mostrar error al usuario
            this.showError('No se puede reproducir la canción. Intenta más tarde.');
        });
        
        // Track analytics
        this.trackPlayEvent();
    }
    
    pause() {
        this.audio.pause();
    }
    
    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    prev() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.shuffle) {
            newIndex = this.getRandomIndex();
        } else {
            newIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        }
        
        this.currentIndex = newIndex;
        this.currentTrack = this.playlist[newIndex];
        this.play(this.currentTrack);
    }
    
    next() {
        if (this.playlist.length === 0) return;
        
        let newIndex;
        if (this.shuffle) {
            newIndex = this.getRandomIndex();
        } else {
            newIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        
        this.currentIndex = newIndex;
        this.currentTrack = this.playlist[newIndex];
        this.play(this.currentTrack);
    }
    
    getRandomIndex() {
        if (this.playlist.length <= 1) return 0;
        
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } while (newIndex === this.currentIndex && this.playlist.length > 1);
        
        return newIndex;
    }
    
    handleTrackEnd() {
        switch(this.repeat) {
            case 'one':
                this.play(this.currentTrack);
                break;
            case 'all':
                this.next();
                break;
            case 'none':
            default:
                if (this.currentIndex < this.playlist.length - 1) {
                    this.next();
                } else {
                    this.pause();
                    this.currentTime = 0;
                    this.updateProgress();
                }
                break;
        }
    }
    
    seek(event) {
        if (!this.elements.progressBar || !this.audio.duration) return;
        
        const rect = this.elements.progressBar.getBoundingClientRect();
        const percentage = (event.clientX - rect.left) / rect.width;
        const time = percentage * this.audio.duration;
        
        this.audio.currentTime = time;
        this.currentTime = time;
        this.updateProgress();
    }
    
    seekForward(seconds = 10) {
        if (!this.audio.duration) return;
        
        const newTime = Math.min(this.audio.currentTime + seconds, this.audio.duration);
        this.audio.currentTime = newTime;
        this.currentTime = newTime;
        this.updateProgress();
    }
    
    seekBackward(seconds = 10) {
        if (!this.audio.duration) return;
        
        const newTime = Math.max(this.audio.currentTime - seconds, 0);
        this.audio.currentTime = newTime;
        this.currentTime = newTime;
        this.updateProgress();
    }
    
    setVolume(value) {
        const volume = parseInt(value);
        this.volume = Math.min(Math.max(volume, 0), 100);
        this.audio.volume = this.volume / 100;
        this.updateVolumeUI();
        this.saveState();
    }
    
    changeVolume(delta) {
        const newVolume = Math.min(Math.max(this.volume + delta, 0), 100);
        this.setVolume(newVolume);
    }
    
    toggleMute() {
        if (this.audio.muted) {
            this.audio.muted = false;
            if (this.elements.volumeButton) {
                this.elements.volumeButton.innerHTML = '<i class="bx bx-volume-full"></i>';
            }
        } else {
            this.audio.muted = true;
            if (this.elements.volumeButton) {
                this.elements.volumeButton.innerHTML = '<i class="bx bx-volume-mute"></i>';
            }
        }
    }
    
    updatePlayButton() {
        if (!this.elements.playIcon) return;
        
        if (this.isPlaying) {
            this.elements.playIcon.className = 'bx bx-pause';
        } else {
            this.elements.playIcon.className = 'bx bx-play';
        }
    }
    
    updateProgress() {
        if (!this.elements.progressFill || !this.duration) return;
        
        const percentage = (this.currentTime / this.duration) * 100;
        this.elements.progressFill.style.width = `${percentage}%`;
        
        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(this.currentTime);
        }
    }
    
    updateTimeDisplay() {
        if (this.elements.totalTime && this.duration) {
            this.elements.totalTime.textContent = this.formatTime(this.duration);
        }
    }
    
    updateTrackInfo() {
        if (!this.currentTrack) return;
        
        if (this.elements.trackTitle) {
            this.elements.trackTitle.textContent = this.currentTrack.title;
        }
        
        if (this.elements.trackArtist) {
            this.elements.trackArtist.textContent = this.currentTrack.artist;
        }
        
        // Actualizar contadores
        const playCountElement = document.getElementById('playCount');
        const likeCountElement = document.getElementById('likeCount');
        
        if (playCountElement) {
            playCountElement.textContent = UTILS.formatNumber(this.currentTrack.plays);
        }
        
        if (likeCountElement) {
            likeCountElement.textContent = UTILS.formatNumber(this.currentTrack.likes);
        }
    }
    
    updateVolumeUI() {
        if (this.elements.volumeSlider) {
            this.elements.volumeSlider.value = this.volume;
        }
        
        if (this.elements.volumeButton) {
            let icon = 'bx-volume-full';
            if (this.volume === 0) {
                icon = 'bx-volume-mute';
            } else if (this.volume < 30) {
                icon = 'bx-volume-low';
            } else if (this.volume < 70) {
                icon = 'bx-volume';
            }
            
            this.elements.volumeButton.innerHTML = `<i class="bx ${icon}"></i>`;
        }
    }
    
    formatTime(seconds) {
        if (!seconds && seconds !== 0) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    handleError() {
        console.error('Error en reproductor de audio');
        // Mostrar notificación de error
        this.showError('Error al reproducir la canción');
    }
    
    showError(message) {
        // Crear notificación de error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'player-error';
        errorDiv.innerHTML = `
            <i class="bx bx-error-circle"></i>
            <span>${message}</span>
            <button class="player-error-close">&times;</button>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: var(--color-error);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
        
        // Botón para cerrar
        errorDiv.querySelector('.player-error-close').addEventListener('click', () => {
            errorDiv.remove();
        });
    }
    
    trackPlayEvent() {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'play', {
                event_category: 'music',
                event_label: this.currentTrack?.title || 'Unknown',
                value: this.currentTrack?.id
            });
        }
    }
    
    // Event emitter
    on(event, callback) {
        if (this.events[event]) {
            this.events[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en evento ${event}:`, error);
                }
            });
        }
    }
    
    // Métodos públicos
    getCurrentTrack() {
        return this.currentTrack;
    }
    
    getPlaylist() {
        return this.playlist;
    }
    
    getCurrentTime() {
        return this.currentTime;
    }
    
    getDuration() {
        return this.duration;
    }
    
    getVolume() {
        return this.volume;
    }
    
    isMuted() {
        return this.audio.muted;
    }
    
    setShuffle(enabled) {
        this.shuffle = enabled;
    }
    
    setRepeat(mode) {
        const validModes = ['none', 'one', 'all'];
        if (validModes.includes(mode)) {
            this.repeat = mode;
        }
    }
    
    // Limpieza
    destroy() {
        this.pause();
        this.audio.src = '';
        this.audio = null;
        
        // Remover event listeners
        if (this.elements.playButton) {
            this.elements.playButton.replaceWith(this.elements.playButton.cloneNode(true));
        }
        
        // Limpiar eventos
        this.events = {
            onPlay: [],
            onPause: [],
            onEnd: [],
            onTimeUpdate: [],
            onVolumeChange: []
        };
    }
}

// Inicialización global
window.YSHDDPlayer = null;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.YSHDDPlayer = new Player();
        await window.YSHDDPlayer.init();
    } catch (error) {
        console.error('Error inicializando reproductor:', error);
    }
});
