// assets/js/modules/sessions.js
export class Sessions {
    constructor() {
        this.sessions = {
            live: [],
            acoustic: [],
            studio: [],
            behind: []
        };
        this.upcomingSessions = [];
        this.init();
    }

    async init() {
        await this.loadSessions();
        await this.loadUpcomingSessions();
        this.setupEventListeners();
    }

    async loadSessions() {
        try {
            // Datos de ejemplo
            this.sessions = {
                live: [
                    {
                        id: 1,
                        title: "Festival Juventud 2024",
                        description: "Presentación completa en festival nacional. Setlist de 30 minutos.",
                        thumbnail: "assets/images/sessions/live1.jpg",
                        duration: "30:00",
                        date: "2024-10-15",
                        location: "Bogotá, Colombia",
                        attendees: 500,
                        tags: ["en vivo", "festival"],
                        videoUrl: "https://youtube.com/embed/..."
                    },
                    {
                        id: 2,
                        title: "Sesión Iglesia Local",
                        description: "Presentación íntima para comunidad juvenil.",
                        thumbnail: "assets/images/sessions/live2.jpg",
                        duration: "45:00",
                        date: "2024-08-20",
                        location: "Cali, Colombia",
                        tags: ["iglesia", "acústico"],
                        videoUrl: "https://youtube.com/embed/..."
                    }
                ],
                acoustic: [
                    {
                        id: 3,
                        title: "Sesión Acústica #1",
                        description: "Versiones acústicas de los éxitos más populares.",
                        thumbnail: "assets/images/sessions/acoustic.jpg",
                        date: "2024-12-10",
                        tracks: [
                            { title: "¿Quién Soy? (Acústico)", duration: "3:45" },
                            { title: "CRISIS (Acústico)", duration: "4:20" }
                        ]
                    }
                ],
                studio: [
                    // Sesiones en estudio
                ],
                behind: [
                    // Behind the scenes
                ]
            };
            
            this.renderSessions();
            
        } catch (error) {
            console.error('Error cargando sesiones:', error);
            throw error;
        }
    }

    async loadUpcomingSessions() {
        try {
            this.upcomingSessions = [
                {
                    id: 1,
                    title: "Sesión en Vivo - Radio XYZ",
                    description: "Entrevista y performance en directo",
                    date: "2025-03-15",
                    time: "16:00",
                    location: "Bogotá",
                    type: "radio"
                },
                {
                    id: 2,
                    title: "Acústico Especial",
                    description: "Sesión exclusiva para plataforma streaming",
                    date: "2025-04-10",
                    type: "streaming"
                }
            ];
            
            this.renderUpcomingSessions();
            
        } catch (error) {
            console.error('Error cargando próximas sesiones:', error);
        }
    }

    renderSessions() {
        this.renderLiveSessions();
        this.renderAcousticSessions();
    }

    renderLiveSessions() {
        const container = document.querySelector('#live-tab .sessions-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.sessions.live.forEach(session => {
            const card = this.createSessionCard(session);
            container.appendChild(card);
        });
    }

    renderAcousticSessions() {
        const container = document.querySelector('#acoustic-tab .acoustic-tracks');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.sessions.acoustic[0]?.tracks.forEach((track, index) => {
            const trackElement = this.createTrackElement(track, index === 0);
            container.appendChild(trackElement);
        });
    }

    renderUpcomingSessions() {
        const container = document.querySelector('.upcoming-grid');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.upcomingSessions.forEach(session => {
            const card = this.createUpcomingCard(session);
            container.appendChild(card);
        });
    }

    createSessionCard(session) {
        const div = document.createElement('div');
        div.className = 'session-card';
        div.innerHTML = `
            <div class="session-media">
                <div class="session-thumbnail">
                    <img src="${session.thumbnail}" alt="${session.title}" loading="lazy">
                    <div class="session-overlay">
                        <button class="play-session" data-session-id="${session.id}">
                            <i class='bx bx-play-circle'></i>
                        </button>
                    </div>
                </div>
                <div class="session-tags">
                    ${session.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="session-info">
                <h3 class="session-title">${session.title}</h3>
                <p class="session-description">${session.description}</p>
                <div class="session-meta">
                    <span><i class='bx bx-calendar'></i> ${this.formatDate(session.date)}</span>
                    <span><i class='bx bx-time'></i> ${session.duration}</span>
                    ${session.attendees ? `<span><i class='bx bx-user'></i> ${session.attendees}+ asistentes</span>` : ''}
                    ${session.location ? `<span><i class='bx bx-map'></i> ${session.location}</span>` : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    createTrackElement(track, isActive = false) {
        const div = document.createElement('div');
        div.className = `track-item ${isActive ? 'active' : ''}`;
        div.innerHTML = `
            <div class="track-info">
                <h4>${track.title}</h4>
                <p>${track.duration}</p>
            </div>
            <button class="track-play" data-track="${track.title}">
                <i class='bx bx-play'></i>
            </button>
        `;
        
        return div;
    }

    createUpcomingCard(session) {
        const date = new Date(session.date);
        const day = date.getDate();
        const month = date.toLocaleString('es', { month: 'short' }).toUpperCase();
        
        const div = document.createElement('div');
        div.className = 'upcoming-card';
        div.innerHTML = `
            <div class="upcoming-date">
                <span class="date-day">${day}</span>
                <span class="date-month">${month}</span>
            </div>
            <div class="upcoming-info">
                <h4>${session.title}</h4>
                <p>${session.description}</p>
                <div class="upcoming-details">
                    ${session.time ? `<span><i class='bx bx-time'></i> ${session.time}</span>` : ''}
                    ${session.location ? `<span><i class='bx bx-map'></i> ${session.location}</span>` : ''}
                </div>
            </div>
            <button class="btn btn-outline btn-small" data-session-id="${session.id}">
                Recordar
            </button>
        `;
        
        return div;
    }

    setupEventListeners() {
        // Play session
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-session')) {
                const button = e.target.closest('.play-session');
                const sessionId = button.getAttribute('data-session-id');
                this.playSession(sessionId);
            }
            
            if (e.target.closest('.track-play')) {
                const button = e.target.closest('.track-play');
                const trackTitle = button.getAttribute('data-track');
                this.playTrack(trackTitle);
            }
            
            // Recordar sesión
            if (e.target.closest('[data-session-id]') && e.target.closest('.btn')) {
                const button = e.target.closest('[data-session-id]');
                const sessionId = button.getAttribute('data-session-id');
                this.rememberSession(sessionId);
            }
        });
    }

    playSession(sessionId) {
        const session = this.sessions.live.find(s => s.id == sessionId);
        if (!session || !session.videoUrl) return;
        
        // En un caso real, esto abriría el video en un modal
        window.open(session.videoUrl, '_blank');
        
        // Track event
        if (window.YSHDD && window.YSHDD.modules.analytics) {
            window.YSHDD.modules.analytics.trackEvent('sessions', 'play', session.title);
        }
    }

    playTrack(trackTitle) {
        // Simulación de reproducción de track acústico
        console.log('Reproduciendo:', trackTitle);
        
        if (window.YSHDD && window.YSHDD.modules.notifications) {
            window.YSHDD.modules.notifications.show(
                `Reproduciendo: ${trackTitle}`,
                'success'
            );
        }
    }

    rememberSession(sessionId) {
        const session = this.upcomingSessions.find(s => s.id == sessionId);
        if (!session) return;
        
        // Guardar en localStorage
        const remembered = JSON.parse(localStorage.getItem('yshdd-remembered-sessions') || '[]');
        if (!remembered.includes(sessionId)) {
            remembered.push(sessionId);
            localStorage.setItem('yshdd-remembered-sessions', JSON.stringify(remembered));
            
            // Agregar a calendario (simulación)
            this.addToCalendar(session);
        }
    }

    addToCalendar(session) {
        // Simulación de agregar a calendario
        const event = {
            title: `YSHDD: ${session.title}`,
            description: session.description,
            start: new Date(session.date + (session.time ? `T${session.time}` : '')),
            end: new Date(new Date(session.date + (session.time ? `T${session.time}` : '')).getTime() + 60 * 60 * 1000), // +1 hora
            location: session.location || 'Online'
        };
        
        console.log('Evento agregado a calendario:', event);
        
        if (window.YSHDD && window.YSHDD.modules.notifications) {
            window.YSHDD.modules.notifications.show(
                `Sesión "${session.title}" recordada`,
                'success'
            );
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getStats() {
        return {
            totalLive: this.sessions.live.length,
            totalAcoustic: this.sessions.acoustic.length,
            totalUpcoming: this.upcomingSessions.length,
            totalTracks: this.sessions.acoustic.reduce((total, session) => 
                total + (session.tracks?.length || 0), 0)
        };
    }
}
