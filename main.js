import { CONFIG, CONSTANTS, UTILS, AppError } from './config.js';
import { Player } from './player.js';
import { getNotificationManager } from './notifications.js';
import { getPerformanceMonitor } from './performance.js';
import { getValidator } from './validation.js';
// NOTA: Se eliminó import utils from './utils.js'; porque UTILS ya viene de config.js

class YSHDDEPK {
    constructor() {
        this.config = CONFIG;
        this.constants = CONSTANTS;
        this.utils = UTILS; // Usar UTILS de config.js
        
        this.modules = {
            player: null,
            notifications: null,
            performance: null,
            validator: null,
            analytics: null,
            security: null,
            email: null,
            gallery: null,
            sessions: null,
            collaborations: null,
            tour: null,
            presskit: null
        };
        
        this.state = {
            isLoading: true,
            isMobile: this.isMobileDevice(),
            isTablet: this.isTabletDevice(),
            isDesktop: !this.isMobileDevice() && !this.isTabletDevice(),
            isScrolled: false,
            currentSection: 'hero',
            theme: this.getSavedTheme(),
            user: {
                id: this.generateUserId(),
                sessionStart: Date.now(),
                visitCount: this.getVisitCount(),
                preferences: this.getUserPreferences()
            },
            music: {
                isPlaying: false,
                currentTrack: null,
                volume: 80,
                muted: false
            },
            connection: {
                online: navigator.onLine,
                type: navigator.connection?.effectiveType || 'unknown',
                saveData: navigator.connection?.saveData || false
            }
        };
        
        this.events = {
            onLoad: [],
            onReady: [],
            onError: [],
            onThemeChange: [],
            onSectionChange: []
        };
        
        this.init();
    }
    
    // Métodos auxiliares para detección de dispositivos
    isMobileDevice() {
        return window.innerWidth < 768;
    }
    
    isTabletDevice() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    }
    
    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= window.innerHeight &&
            rect.bottom >= 0 &&
            rect.left <= window.innerWidth &&
            rect.right >= 0
        );
    }
    
    async init() {
        try {
            console.log('🚀 Inicializando YSHDD EPK v2.6.0...');
            
            // 1. Configuración inicial
            this.setupEnvironment();
            
            // 2. Inicializar módulos core
            await this.initializeCoreModules();
            
            // 3. Configurar eventos globales
            this.setupGlobalEvents();
            
            // 4. Inicializar componentes UI
            this.initUIComponents();
            
            // 5. Cargar datos iniciales
            await this.loadInitialData();
            
            // 6. Configurar Service Worker
            await this.registerServiceWorker();
            
            // 7. Finalizar carga
            this.completeLoading();
            
            console.log('✅ YSHDD EPK inicializado correctamente');
            this.emit('onReady', this.state);
            
        } catch (error) {
            console.error('❌ Error inicializando EPK:', error);
            this.handleCriticalError(error);
        }
    }
    
    setupEnvironment() {
        // Configurar variables globales
        window.YSHDD = this;
        window.CONFIG = this.config;
        window.CONSTANTS = this.constants;
        window.UTILS = this.utils;
        
        // Configurar theme
        this.applyTheme();
        
        // Configurar protección básica
        this.setupBasicProtection();
        
        // Configurar analytics
        this.setupAnalytics();
        
        // Configurar preferencias del usuario
        this.setupUserPreferences();
    }
    
    setupBasicProtection() {
        // Proteger emails
        this.protectEmailAddresses();
        
        // Prevenir clic derecho en imágenes protegidas
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG' && e.target.classList.contains('protected')) {
                e.preventDefault();
                this.showNotification('Esta imagen está protegida', 'info');
            }
        });
        
        // Prevenir drag and drop de imágenes protegidas
        document.addEventListener('dragstart', (e) => {
            if (e.target.tagName === 'IMG' && e.target.classList.contains('protected')) {
                e.preventDefault();
            }
        });
    }
    
    protectEmailAddresses() {
        document.querySelectorAll('[data-email]').forEach(el => {
            const email = el.getAttribute('data-email');
            const protectedEmail = this.utils.obfuscateEmail(email);
            
            if (el.tagName === 'A') {
                el.href = `mailto:${protectedEmail}`;
            }
            
            if (el.textContent === email) {
                el.textContent = protectedEmail;
            }
        });
    }
    
    setupAnalytics() {
        // Google Analytics
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', CONFIG.api.keys.analytics, {
            page_title: document.title,
            page_path: window.location.pathname,
            user_id: this.state.user.id
        });
        
        // Eventos personalizados
        this.modules.analytics = {
            trackEvent: (category, action, label, value) => {
                if (typeof gtag === 'function') {
                    gtag('event', action, {
                        event_category: category,
                        event_label: label,
                        value: value
                    });
                }
                console.log(`📊 Analytics: ${category} - ${action} - ${label}`);
            },
            
            trackPageView: (title, path) => {
                if (typeof gtag === 'function') {
                    gtag('config', CONFIG.api.keys.analytics, {
                        page_title: title,
                        page_path: path
                    });
                }
            },
            
            trackError: (error, fatal = false) => {
                if (typeof gtag === 'function') {
                    gtag('event', 'exception', {
                        description: error.message,
                        fatal: fatal
                    });
                }
            }
        };
    }
    
    setupUserPreferences() {
        // Cargar preferencias guardadas
        const savedVolume = localStorage.getItem(CONSTANTS.STORAGE_KEYS.MUSIC_VOLUME);
        if (savedVolume !== null) {
            this.state.music.volume = parseInt(savedVolume);
        }
        
        const savedTheme = localStorage.getItem(CONSTANTS.STORAGE_KEYS.THEME);
        if (savedTheme) {
            this.state.theme = savedTheme;
            this.applyTheme();
        }
        
        // Incrementar contador de visitas
        this.incrementVisitCount();
    }
    
    async initializeCoreModules() {
        console.log('📦 Inicializando módulos...');
        
        // Orden de inicialización importante
        this.modules.validator = getValidator();
        this.modules.notifications = await getNotificationManager();
        this.modules.performance = getPerformanceMonitor();
        
        // Inicializar player
        this.modules.player = new Player();
        await this.modules.player.init();
        
        // Inicializar otros módulos
        await this.initAdditionalModules();
        
        console.log('✅ Módulos inicializados:', Object.keys(this.modules));
    }
    
    async initAdditionalModules() {
        // Inicializar módulos según necesidades
        const modulesToInit = [];
        
        // Gallery module
        if (document.querySelector('.gallery-grid')) {
            modulesToInit.push(this.initGalleryModule());
        }
        
        // Sessions module
        if (document.querySelector('.sessions-section')) {
            modulesToInit.push(this.initSessionsModule());
        }
        
        // Collaborations module
        if (document.querySelector('.collaborations-section')) {
            modulesToInit.push(this.initCollaborationsModule());
        }
        
        // Ejecutar en paralelo
        await Promise.allSettled(modulesToInit);
    }
    
    async initGalleryModule() {
        this.modules.gallery = {
            images: CONFIG.content.gallery.images,
            categories: CONFIG.content.gallery.categories,
            
            render: () => {
                const container = document.querySelector('.gallery-grid');
                if (!container) return;
                
                container.innerHTML = this.modules.gallery.images.map(img => `
                    <div class="gallery-item" data-category="${img.category}">
                        <img src="${img.src}" 
                             data-src="${img.src}"
                             alt="${img.alt}"
                             loading="lazy"
                             width="${img.width}"
                             height="${img.height}">
                        <div class="gallery-overlay">
                            <button class="gallery-view" data-image="${img.src}">
                                <i class='bx bx-zoom-in'></i>
                            </button>
                            <button class="gallery-download" data-image="${img.src}">
                                <i class='bx bx-download'></i>
                            </button>
                        </div>
                    </div>
                `).join('');
                
                // Configurar lazy loading
                this.setupGalleryLazyLoad();
            },
            
            setupFilters: () => {
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const filter = btn.getAttribute('data-filter');
                        this.filterGallery(filter);
                    });
                });
            },
            
            filterGallery: (filter) => {
                const items = document.querySelectorAll('.gallery-item');
                items.forEach(item => {
                    if (filter === 'all' || item.getAttribute('data-category') === filter) {
                        item.style.display = 'block';
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            }
        };
        
        this.modules.gallery.render();
        this.modules.gallery.setupFilters();
    }
    
    setupGalleryLazyLoad() {
        const images = document.querySelectorAll('.gallery-item img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });
        
        images.forEach(img => observer.observe(img));
    }
    
    async initSessionsModule() {
        this.modules.sessions = {
            data: {
                live: [],
                acoustic: [],
                studio: [],
                behind: []
            },
            
            load: async () => {
                // Cargar datos de sesiones
                try {
                    // En producción, cargar desde API
                    this.modules.sessions.data = {
                        live: [
                            {
                                id: 1,
                                title: "Festival Juventud 2024",
                                description: "Presentación completa en festival nacional",
                                thumbnail: "assets/images/sessions/live1.jpg",
                                duration: "30:00",
                                date: "2024-10-15",
                                views: 25000
                            }
                        ]
                    };
                    
                    this.renderSessions();
                    return true;
                } catch (error) {
                    console.error('Error cargando sesiones:', error);
                    return false;
                }
            },
            
            render: () => {
                // Renderizar sesiones
                const container = document.querySelector('.sessions-grid');
                if (!container) return;
                
                // Implementar renderizado
            }
        };
        
        await this.modules.sessions.load();
    }
    
    async initCollaborationsModule() {
        this.modules.collaborations = {
            data: [],
            
            load: async () => {
                try {
                    // Cargar colaboraciones
                    this.modules.collaborations.data = [
                        {
                            id: 1,
                            artist: "Artista X",
                            project: "Proyecto Secreto",
                            status: "active",
                            date: "2025"
                        }
                    ];
                    
                    this.renderCollaborations();
                    return true;
                } catch (error) {
                    console.error('Error cargando colaboraciones:', error);
                    return false;
                }
            },
            
            render: () => {
                // Renderizar colaboraciones
                const container = document.querySelector('.collaborations-grid');
                if (!container) return;
                
                // Implementar renderizado
            }
        };
        
        await this.modules.collaborations.load();
    }
    
    setupGlobalEvents() {
        // Scroll handling
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        
        // Resize handling
        window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Click outside handling
        document.addEventListener('click', this.handleClickOutside.bind(this));
        
        // Connection events
        window.addEventListener('online', () => {
            this.state.connection.online = true;
            this.showNotification('Conexión restablecida', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.state.connection.online = false;
            this.showNotification('Sin conexión a internet', 'warning');
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.trackVisibilityChange();
            }
        });
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            this.saveUserState();
        });
    }
    
    handleScroll() {
        // Header scroll effect
        this.state.isScrolled = window.scrollY > 100;
        const header = document.getElementById('mainHeader');
        if (header) {
            header.classList.toggle('scrolled', this.state.isScrolled);
        }
        
        // Update active section
        this.updateActiveSection();
        
        // Lazy load images
        this.lazyLoadImages();
        
        // Show/hide back to top button
        this.updateBackToTopButton();
    }
    
    handleResize() {
        this.state.isMobile = this.isMobileDevice();
        this.state.isTablet = this.isTabletDevice();
        this.state.isDesktop = !this.isMobileDevice() && !this.isTabletDevice();
        
        this.updateUIForScreenSize();
    }
    
    handleKeyboard(e) {
        // Evitar atajos en inputs
        if (e.target.tagName === 'INPUT' || 
            e.target.tagName === 'TEXTAREA' || 
            e.target.tagName === 'SELECT') {
            return;
        }
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                if (this.modules.player) {
                    this.modules.player.togglePlay();
                }
                break;
                
            case 'KeyD':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.downloadEPK('basic');
                }
                break;
                
            case 'Escape':
                this.closeAllModals();
                this.closeAllDropdowns();
                break;
                
            case 'KeyT':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.toggleTheme();
                }
                break;
                
            case 'KeyM':
                if (e.ctrlKey && this.modules.player) {
                    e.preventDefault();
                    this.modules.player.toggleMute();
                }
                break;
                
            case 'ArrowLeft':
                if (e.ctrlKey && this.modules.player) {
                    e.preventDefault();
                    this.modules.player.seekBackward(10);
                }
                break;
                
            case 'ArrowRight':
                if (e.ctrlKey && this.modules.player) {
                    e.preventDefault();
                    this.modules.player.seekForward(10);
                }
                break;
        }
    }
    
    handleClickOutside(e) {
        // Cerrar menús desplegables al hacer clic fuera
        document.querySelectorAll('.dropdown.show').forEach(dropdown => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Cerrar menú móvil
        const navMenu = document.getElementById('navMenu');
        const navToggle = document.getElementById('navToggle');
        
        if (navMenu && navMenu.classList.contains('show') && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
            navMenu.classList.remove('show');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    }
    
    initUIComponents() {
        console.log('🎨 Inicializando componentes UI...');
        
        // Loader
        this.initLoader();
        
        // Navegación
        this.initNavigation();
        
        // Tema
        this.initThemeToggle();
        
        // Contadores animados
        this.initAnimatedCounters();
        
        // Tabs
        this.initTabs();
        
        // Formularios
        this.initForms();
        
        // Modales
        this.initModals();
        
        // Botones flotantes
        this.initFloatingActions();
        
        // Galería
        this.initGallery();
        
        // Video players
        this.initVideoPlayers();
        
        // Download buttons
        this.initDownloadButtons();
        
        // Tooltips
        this.initTooltips();
        
        // Accordions
        this.initAccordions();
        
        console.log('✅
