// assets/js/main.js - VERSIÓN FINAL 2.6.0

import { CONFIG, CONSTANTS, UTILS, AppError } from './config.js';
import { Player } from './player.js';
import { getNotificationManager } from './notifications.js';
import { getPerformanceMonitor } from './performance.js';
import { getValidator } from './validation.js';
import utils from './utils.js';

class YSHDDEPK {
    constructor() {
        this.config = CONFIG;
        this.constants = CONSTANTS;
        this.utils = utils;
        
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
            isMobile: this.utils.matchMedia('md'),
            isTablet: this.utils.matchMedia('lg') && !this.utils.matchMedia('md'),
            isDesktop: !this.utils.matchMedia('lg'),
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
        const savedVolume = this.utils.getState('music-volume');
        if (savedVolume !== null) {
            this.state.music.volume = savedVolume;
        }
        
        const savedTheme = this.utils.getState('theme');
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
        this.state.isMobile = this.utils.matchMedia('md');
        this.state.isTablet = this.utils.matchMedia('lg') && !this.utils.matchMedia('md');
        this.state.isDesktop = !this.utils.matchMedia('lg');
        
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
        
        console.log('✅ Componentes UI inicializados');
    }
    
    initLoader() {
        const loader = document.getElementById('loader');
        if (!loader) return;
        
        // Animar barra de progreso
        const progressFill = loader.querySelector('.progress-fill');
        let progress = 0;
        
        const animateProgress = () => {
            progress += Math.random() * 10 + 5;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = `${progress}%`;
            
            if (progress < 100) {
                setTimeout(animateProgress, 100);
            } else {
                setTimeout(() => {
                    loader.classList.add('hidden');
                    setTimeout(() => {
                        loader.style.display = 'none';
                    }, 500);
                }, 500);
            }
        };
        
        setTimeout(animateProgress, 300);
    }
    
    initNavigation() {
        // Navegación móvil
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('show');
                document.body.style.overflow = navMenu.classList.contains('show') ? 'hidden' : '';
            });
            
            // Cerrar menú al hacer clic en enlace
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('show');
                    navToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                });
            });
        }
        
        // Navegación suave
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    this.utils.scrollToElement(target, 80);
                }
            });
        });
    }
    
    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        
        if (themeToggle && themeIcon) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Configurar icono inicial
            themeIcon.className = this.state.theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
        }
    }
    
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        
        // Actualizar icono
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = this.state.theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
        }
        
        // Guardar preferencia
        this.utils.setState('theme', this.state.theme);
        
        // Emitir evento
        this.emit('onThemeChange', this.state.theme);
        
        // Mostrar notificación
        this.showNotification(
            `Tema cambiado a ${this.state.theme === 'dark' ? 'oscuro' : 'claro'}`,
            'success'
        );
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Actualizar meta theme-color
        const themeColor = this.state.theme === 'dark' ? '#111111' : '#ffffff';
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.setAttribute('content', themeColor);
        }
        
        // Actualizar CSS variables si es necesario
        this.updateThemeVariables();
    }
    
    updateThemeVariables() {
        const root = document.documentElement;
        
        if (this.state.theme === 'light') {
            root.style.setProperty('--color-bg', '#ffffff');
            root.style.setProperty('--color-text', '#000000');
            root.style.setProperty('--color-text-secondary', 'rgba(0, 0, 0, 0.85)');
            root.style.setProperty('--color-bg-light', '#f5f5f5');
        } else {
            root.style.setProperty('--color-bg', '#111111');
            root.style.setProperty('--color-text', '#ffffff');
            root.style.setProperty('--color-text-secondary', 'rgba(255, 255, 255, 0.85)');
            root.style.setProperty('--color-bg-light', '#1a1a1a');
        }
    }
    
    getSavedTheme() {
        return this.utils.getState('theme') || 'dark';
    }
    
    initAnimatedCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
    
    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = this.utils.formatNumber(Math.floor(current));
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = this.utils.formatNumber(target);
            }
        };
        
        updateCounter();
    }
    
    initTabs() {
        document.querySelectorAll('.tab-btn').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Actualizar botones activos
                button.parentElement.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Mostrar panel correspondiente
                const tabContainer = button.closest('.tabs-content') || 
                                   document.querySelector('.tabs-content');
                if (tabContainer) {
                    tabContainer.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('active');
                    });
                    
                    const targetPane = tabContainer.querySelector(`#${tabId}-tab`);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    }
                }
                
                // Track event
                this.modules.analytics.trackEvent('tabs', 'switch', tabId);
            });
        });
    }
    
    initForms() {
        // Formulario de contacto profesional
        const contactForm = document.getElementById('professionalForm');
        if (contactForm) {
            // Configurar validación en tiempo real
            this.modules.validator.setupLiveValidation(contactForm, {
                'contact-name': ['required', 'minLength:2'],
                'contact-email': ['required', 'email'],
                'contact-subject': ['required'],
                'contact-message': ['required', 'minLength:10']
            });
            
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData);
                
                // Validar
                const validation = this.modules.validator.validateContactForm(data);
                if (!validation.isValid) {
                    this.modules.validator.displayErrors(contactForm, validation.errors);
                    return;
                }
                
                // Sanitizar datos
                const sanitizedData = {
                    name: this.modules.validator.sanitize(data['contact-name']),
                    email: this.modules.validator.sanitize(data['contact-email'], 'email'),
                    company: this.modules.validator.sanitize(data['contact-company']),
                    phone: this.modules.validator.sanitize(data['contact-phone'], 'phone'),
                    subject: this.modules.validator.sanitize(data['contact-subject']),
                    message: this.modules.validator.sanitize(data['contact-message'], 'html')
                };
                
                // Enviar formulario
                await this.submitContactForm(contactForm, sanitizedData);
            });
        }
        
        // Formulario de colaboraciones
        const collabForm = document.getElementById('collabForm');
        if (collabForm) {
            collabForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(collabForm);
                const data = Object.fromEntries(formData);
                
                // Validar
                const validation = this.modules.validator.validateCollaborationForm(data);
                if (!validation.isValid) {
                    this.showNotification(validation.firstError?.message || 'Error en el formulario', 'error');
                    return;
                }
                
                // Enviar formulario
                await this.submitCollaborationForm(collabForm, data);
            });
        }
        
        // Newsletter
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const emailInput = newsletterForm.querySelector('input[type="email"]');
                const email = emailInput.value.trim();
                
                // Validar
                if (!this.modules.validator.isValidEmail(email)) {
                    this.showNotification('Por favor, introduce un email válido', 'error');
                    return;
                }
                
                // Suscribir
                await this.subscribeToNewsletter(newsletterForm, email);
            });
        }
    }
    
    async submitContactForm(form, data) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Mostrar loading
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            // En producción, enviar a API
            // const response = await fetch(CONFIG.api.endpoints.contact, {...});
            
            // Simular envío
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Éxito
            this.showNotification(
                'Mensaje enviado. Te responderemos en 24-48 horas.',
                'success'
            );
            
            form.reset();
            this.modules.validator.clearErrors(form);
            
            // Track event
            this.modules.analytics.trackEvent('contact', 'form_submit', 'professional');
            
        } catch (error) {
            this.showNotification(
                'Error enviando el mensaje. Por favor, intenta nuevamente.',
                'error'
            );
            
            // Track error
            this.modules.analytics.trackError(error);
            
        } finally {
            // Restaurar botón
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async submitCollaborationForm(form, data) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            // Simular envío
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.showNotification(
                'Propuesta de colaboración enviada. Te contactaremos pronto.',
                'success'
            );
            
            form.reset();
            
            this.modules.analytics.trackEvent('collaboration', 'proposal_submit', data.collabRole);
            
        } catch (error) {
            this.showNotification(
                'Error enviando la propuesta. Por favor, intenta nuevamente.',
                'error'
            );
            
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    async subscribeToNewsletter(form, email) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Suscribiendo...';
            submitBtn.disabled = true;
            
            // Simular suscripción
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showNotification('¡Te has suscrito al newsletter!', 'success');
            form.reset();
            
            this.modules.analytics.trackEvent('newsletter', 'subscribe', 'footer');
            
        } catch (error) {
            this.showNotification('Error al suscribirse. Intenta nuevamente.', 'error');
            
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    initModals() {
        // Modal de EPK
        this.setupEPKModal();
        
        // Modal de video
        this.setupVideoModal();
        
        // Modal de imagen
        this.setupImageModal();
        
        // Cerrar modales con Escape
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    setupEPKModal() {
        const epkModal = document.getElementById('epkModal');
        const epkButtons = document.querySelectorAll('[data-action="epk-modal"], #quickEPK, #downloadEPK');
        const closeButtons = document.querySelectorAll('.modal-close');
        
        // Abrir modal
        epkButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (epkModal) {
                    epkModal.classList.add('show');
                    document.body.style.overflow = 'hidden';
                    this.modules.analytics.trackEvent('epk', 'modal_open', 'download');
                }
            });
        });
        
        // Cerrar modal
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Cerrar al hacer clic fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        });
        
        // Descargas dentro del modal
        document.querySelectorAll('[data-download]').forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-download');
                this.downloadEPK(type);
                
                // Cerrar modal
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    document.body.style.overflow = '';
                }
            });
        });
    }
    
    setupVideoModal() {
        // Implementar modal de video
    }
    
    setupImageModal() {
        // Implementar modal de imagen
    }
    
    initFloatingActions() {
        // Botón volver arriba
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                this.utils.scrollToTop();
                this.modules.analytics.trackEvent('ui', 'back_to_top', 'click');
            });
        }
        
        // Botón de EPK rápido
        const quickEPK = document.getElementById('quickEPK');
        if (quickEPK) {
            quickEPK.addEventListener('click', () => {
                this.downloadEPK('basic');
            });
        }
    }
    
    initGallery() {
        // Inicializar galería si existe
        if (this.modules.gallery) {
            this.modules.gallery.setupFilters();
        }
    }
    
    initVideoPlayers() {
        // Configurar event listeners para videos
        document.querySelectorAll('.play-video, .play-session, .play-album').forEach(button => {
            button.addEventListener('click', (e) => {
                const videoId = e.target.closest('[data-video]')?.getAttribute('data-video') ||
                              e.target.closest('[data-session]')?.getAttribute('data-session') ||
                              e.target.closest('[data-album]')?.getAttribute('data-album');
                
                if (videoId) {
                    this.playVideo(videoId);
                    this.modules.analytics.trackEvent('video', 'play', videoId);
                }
            });
        });
    }
    
    initDownloadButtons() {
        // Botones de descarga generales
        document.querySelectorAll('#downloadFullBio, #downloadAllPhotos, #downloadFullEPK').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const type = btn.id.replace('download', '').toLowerCase();
                this.downloadResource(type);
            });
        });
        
        // Pre-order
        const preorderBtn = document.getElementById('preorderBtn');
        if (preorderBtn) {
            preorderBtn.addEventListener('click', () => {
                this.showNotification('¡Te notificaremos cuando "Mala Mía" esté disponible!', 'success');
                this.modules.analytics.trackEvent('music', 'preorder', 'mala_mia');
            });
        }
    }
    
    initTooltips() {
        // Inicializar tooltips con Tippy.js si está disponible
        if (typeof tippy !== 'undefined') {
            document.querySelectorAll('[data-tippy-content]').forEach(el => {
                tippy(el, {
                    theme: 'yshdd',
                    animation: 'scale',
                    duration: 200
                });
            });
        } else {
            // Fallback a tooltips nativos
            this.setupNativeTooltips();
        }
    }
    
    setupNativeTooltips() {
        const elements = document.querySelectorAll('[title]');
        elements.forEach(el => {
            const title = el.getAttribute('title');
            el.removeAttribute('title');
            
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'native-tooltip';
                tooltip.textContent = title;
                document.body.appendChild(tooltip);
                
                const rect = el.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - 10}px`;
                tooltip.style.transform = 'translate(-50%, -100%)';
            });
            
            el.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.native-tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }
    
    initAccordions() {
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.parentElement;
                const content = header.nextElementSibling;
                
                if (accordion.classList.contains('active')) {
                    accordion.classList.remove('active');
                    content.style.maxHeight = null;
                } else {
                    // Cerrar otros acordeones
                    document.querySelectorAll('.accordion.active').forEach(acc => {
                        if (acc !== accordion) {
                            acc.classList.remove('active');
                            acc.querySelector('.accordion-content').style.maxHeight = null;
                        }
                    });
                    
                    accordion.classList.add('active');
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
    }
    
    async loadInitialData() {
        console.log('📥 Cargando datos iniciales...');
        
        try {
            // Cargar datos en paralelo
            await Promise.allSettled([
                this.loadMusicData(),
                this.loadGalleryData(),
                this.loadStatsData(),
                this.loadSocialData()
            ]);
            
            // Actualizar estadísticas en tiempo real
            this.updateRealTimeStats();
            
            console.log('✅ Datos iniciales cargados');
            
        } catch (error) {
            console.warn('Algunos datos no pudieron cargarse:', error);
            this.showNotification('Algunos datos pueden no estar actualizados', 'warning');
        }
    }
    
    async loadMusicData() {
        // Cargar datos de música
        if (this.modules.player) {
            await this.modules.player.loadPlaylist();
        }
    }
    
    async loadGalleryData() {
        // Cargar datos de galería
        if (this.modules.gallery) {
            // Implementar carga de datos
        }
    }
    
    async loadStatsData() {
        // Cargar estadísticas
        try {
            // En producción, cargar desde API
            const stats = {
                monthlyStreams: 52000,
                followers: 10500,
                cities: 12,
                releases: 5,
                collaborations: 3
            };
            
            this.updateStatsUI(stats);
            
        } catch (error) {
            console.warn('Error cargando estadísticas:', error);
        }
    }
    
    async loadSocialData() {
        // Cargar datos de redes sociales
        // Implementar si es necesario
    }
    
    updateRealTimeStats() {
        // Actualizar estadísticas periódicamente
        setInterval(() => {
            this.updateStreamCount();
        }, 30000); // Cada 30 segundos
    }
    
    updateStreamCount() {
        const streamsElement = document.querySelector('[data-count="50000"]');
        if (streamsElement) {
            const current = parseInt(streamsElement.textContent.replace(/,/g, ''));
            const increment = Math.floor(Math.random() * 10);
            streamsElement.textContent = this.utils.formatNumber(current + increment);
        }
    }
    
    updateStatsUI(stats) {
        Object.keys(stats).forEach(statKey => {
            const element = document.querySelector(`[data-stat="${statKey}"]`);
            if (element) {
                element.textContent = this.utils.formatNumber(stats[statKey]);
            }
        });
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker registrado:', registration.scope);
                
                // Verificar actualizaciones periódicamente
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // Cada hora
                
            } catch (error) {
                console.error('❌ Error registrando Service Worker:', error);
            }
        }
    }
    
    completeLoading() {
        setTimeout(() => {
            // Marcar como cargado
            this.state.isLoading = false;
            
            // Remover clase de loading del body
            document.body.classList.remove('loading');
            
            // Mostrar animación de entrada
            this.animatePageEntrance();
            
            // Track page view
            this.trackPageView();
            
            // Emitir evento de carga
            this.emit('onLoad', this.state);
            
            console.log('🎉 YSHDD EPK completamente cargado y listo');
            
        }, 1000);
    }
    
    animatePageEntrance() {
        // Animar elementos al cargar
        document.querySelectorAll('.scroll-reveal').forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('animate-in');
        });
    }
    
    trackPageView() {
        this.modules.analytics.trackPageView(
            document.title,
            window.location.pathname + window.location.hash
        );
    }
    
    trackVisibilityChange() {
        this.modules.analytics.trackEvent('user', 'visibility_change', 'returned');
    }
    
    // ====== MÉTODOS DE UTILIDAD ======
    
    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        let currentSection = 'hero';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        });
        
        if (this.state.currentSection !== currentSection) {
            this.state.currentSection = currentSection;
            this.updateNavigation();
            this.emit('onSectionChange', currentSection);
            this.modules.analytics.trackEvent('navigation', 'section_change', currentSection);
        }
    }
    
    updateNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${this.state.currentSection}`) {
                link.classList.add('active');
            }
        });
    }
    
    updateUIForScreenSize() {
        // Ajustar grids para mobile
        const grids = document.querySelectorAll('.albums-grid, .collaborations-grid, .sessions-grid');
        grids.forEach(grid => {
            if (this.state.isMobile) {
                grid.style.gridTemplateColumns = '1fr';
            } else {
                grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            }
        });
        
        // Ajustar hero actions
        const heroActions = document.querySelector('.hero-actions');
        if (heroActions && this.state.isMobile) {
            heroActions.style.flexDirection = 'column';
        }
    }
    
    updateBackToTopButton() {
        const backToTop = document.getElementById('backToTop');
        if (backToTop) {
            backToTop.style.display = window.scrollY > 500 ? 'flex' : 'none';
        }
    }
    
    lazyLoadImages() {
        document.querySelectorAll('img[data-src]:not(.loaded)').forEach(img => {
            if (this.utils.isElementInViewport(img)) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
    
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
    
    // ====== MÉTODOS DE ACCIÓN ======
    
    playVideo(videoId) {
        // Implementar reproducción de video
        this.showNotification(`Reproduciendo: ${videoId}`, 'info');
    }
    
    downloadEPK(type = 'basic') {
        const urls = {
            basic: '/downloads/epk-basic.zip',
            full: '/downloads/epk-full.zip',
            cloud: 'https://cloud.yshdd.com/epk'
        };
        
        const url = urls[type] || urls.basic;
        
        // Track event
        this.modules.analytics.trackEvent('epk', 'download', type);
        
        // Mostrar notificación
        this.showNotification(`Descargando EPK ${type}...`, 'info');
        
        // Descargar
        setTimeout(() => {
            this.utils.downloadFile(url, `yshdd-epk-${type}.zip`);
        }, 1000);
    }
    
    downloadResource(type) {
        const resources = {
            bio: '/downloads/bio-completa.pdf',
            photos: '/downloads/fotos-prensa.zip',
            music: '/downloads/musica-para-medios.zip',
            broll: '/downloads/b-roll.zip'
        };
        
        const url = resources[type];
        if (url) {
            this.utils.downloadFile(url, `yshdd-${type}.zip`);
            this.modules.analytics.trackEvent('download', type, 'resource');
        }
    }
    
    // ====== MANEJO DE USUARIO ======
    
    generateUserId() {
        let userId = this.utils.getState('user-id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            this.utils.setState('user-id', userId);
        }
        return userId;
    }
    
    getVisitCount() {
        return parseInt(this.utils.getState('visit-count') || '0');
    }
    
    incrementVisitCount() {
        const count = this.getVisitCount() + 1;
        this.utils.setState('visit-count', count);
        this.state.user.visitCount = count;
    }
    
    getUserPreferences() {
        return this.utils.getState('user-preferences') || {};
    }
    
    saveUserState() {
        // Guardar preferencias del usuario
        this.utils.setState('user-preferences', this.state.user.preferences);
        
        // Guardar volumen de música
        if (this.modules.player) {
            this.utils.setState('music-volume', this.modules.player.getVolume());
        }
    }
    
    // ====== NOTIFICACIONES ======
    
    showNotification(message, type = 'info', duration = 5000) {
        if (this.modules.notifications) {
            return this.modules.notifications.show(message, { type });
        } else {
            // Fallback básico
            console.log(`[${type}] ${message}`);
            return null;
        }
    }
    
    // ====== EVENT EMITTER ======
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
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
    
    // ====== MANEJO DE ERRORES ======
    
    handleCriticalError(error) {
        const errorData = this.utils.handleError(error, 'critical_init');
        
        // Mostrar error al usuario
        this.showCriticalErrorUI(errorData);
        
        // Intentar recuperación
        setTimeout(() => {
            this.attemptRecovery();
        }, 5000);
    }
    
    showCriticalErrorUI(errorData) {
        const errorHtml = `
            <div class="critical-error" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #111;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2rem;
                z-index: 10000;
            ">
                <i class='bx bx-error-circle' style="font-size: 4rem; color: #ffdd57; margin-bottom: 1rem;"></i>
                <h3 style="color: white; margin-bottom: 1rem;">Error crítico</h3>
                <p style="color: #888; margin-bottom: 2rem;">
                    No se pudo cargar el EPK completamente.
                    <br>
                    <small>${errorData.message}</small>
                </p>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="location.reload()" class="btn btn-primary" style="
                        background: #ffdd57;
                        color: #222;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        <i class='bx bx-refresh'></i>
                        Recargar página
                    </button>
                    <button onclick="window.YSHDD?.clearCache()" class="btn btn-secondary" style="
                        background: transparent;
                        color: #fff;
                        border: 1px solid #666;
                        padding: 1rem 2rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        <i class='bx bx-trash'></i>
                        Limpiar cache
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }
    
    attemptRecovery() {
        // Intentar recuperación automática
        console.log('🔄 Intentando recuperación...');
        
        // Limpiar cache y recargar
        this.clearCache();
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    clearCache() {
        this.utils.clearCache();
        this.showNotification('Cache limpiado', 'success');
    }
    
    // ====== MÉTODOS PÚBLICOS ======
    
    getState() {
        return { ...this.state };
    }
    
    getModules() {
        return { ...this.modules };
    }
    
    getConfig() {
        return { ...this.config };
    }
    
    reload() {
        location.reload();
    }
    
    reset() {
        this.clearCache();
        this.reload();
    }
    
    // ====== DESTRUCTOR ======
    
    destroy() {
        // Limpiar event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyboard);
        document.removeEventListener('click', this.handleClickOutside);
        
        // Destruir módulos
        if (this.modules.player) {
            this.modules.player.destroy();
        }
        
        if (this.modules.performance) {
            this.modules.performance.destroy();
        }
        
        // Limpiar state
        this.saveUserState();
        
        // Remover referencias
        window.YSHDD = null;
        window.CONFIG = null;
        window.CONSTANTS = null;
        window.UTILS = null;
        
        console.log('♻️ YSHDD EPK destruido');
    }
}

// ====== INICIALIZACIÓN GLOBAL ======

// Polyfills para navegadores antiguos
if (!window.Promise) {
    console.warn('Promise no soportado, cargando polyfill...');
    // Aquí iría la carga del polyfill
}

if (!window.IntersectionObserver) {
    console.warn('IntersectionObserver no soportado, algunas funciones pueden no estar disponibles');
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializar aplicación
        window.yshddApp = new YSHDDEPK();
        
        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global no capturado:', event.error);
            if (window.yshddApp) {
                window.yshddApp.modules.analytics?.trackError(event.error);
                window.yshddApp.showNotification('Ocurrió un error inesperado', 'error');
            }
        });
        
        // Manejar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada no capturada:', event.reason);
            if (window.yshddApp) {
                window.yshddApp.modules.analytics?.trackError(event.reason);
            }
        });
        
        console.log('🌐 YSHDD EPK iniciando...');
        
    } catch (error) {
        console.error('Error fatal inicializando aplicación:', error);
        
        // Mostrar error crítico
        const errorHtml = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #111;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 2rem;
                z-index: 10000;
            ">
                <h1 style="color: #ffdd57; margin-bottom: 1rem;">⚠️ Error Crítico</h1>
                <p style="color: #888; margin-bottom: 2rem;">
                    No se pudo cargar la aplicación.
                    <br>
                    Por favor, recarga la página o contacta al soporte.
                </p>
                <button onclick="location.reload()" style="
                    background: #ffdd57;
                    color: #222;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                ">
                    Recargar Página
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
    }
});

// ====== FUNCIONES GLOBALES PARA DESARROLLO ======

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugYSHDD = {
        version: '2.6.0',
        app: () => window.yshddApp,
        modules: () => window.yshddApp?.getModules(),
        state: () => window.yshddApp?.getState(),
        config: () => window.yshddApp?.getConfig(),
        reload: () => window.yshddApp?.reload(),
        reset: () => window.yshddApp?.reset(),
        clearCache: () => {
            localStorage.clear();
            sessionStorage.clear();
            location.reload();
        },
        testNotification: (type = 'info') => {
            const messages = {
                success: '¡Éxito! Esta es una notificación de prueba.',
                error: 'Error: Esta es una notificación de prueba.',
                warning: 'Advertencia: Esta es una notificación de prueba.',
                info: 'Información: Esta es una notificación de prueba.'
            };
            
            window.yshddApp?.showNotification(messages[type], type);
        },
        performance: () => window.yshddApp?.modules.performance?.getMetrics()
    };
    
    console.log('🔧 Modo desarrollo activado - debugYSHDD disponible');
}

// ====== EXPORTACIÓN PARA MÓDULOS ======

export default YSHDDEPK;
