// assets/js/main.js
import { CONFIG } from './config.js';
import { Player } from './player.js';
import { Analytics } from './analytics.js';
import { EmailService } from './email.js';
import { PressKit } from './presskit.js';
import { TourManager } from './tour.js';
import { Collaborations } from './collaborations.js';
import { Sessions } from './sessions.js';
import { Notifications } from './notifications.js';
import { Security } from './security.js';
import { Performance } from './performance.js';
import { Validation } from './validation.js';

class YSHDDEPK {
    constructor() {
        this.config = CONFIG;
        this.modules = {};
        this.state = {
            isLoading: true,
            isMobile: window.innerWidth < 768,
            isScrolled: false,
            currentSection: 'hero',
            theme: 'dark',
            music: {
                isPlaying: false,
                currentTrack: null,
                volume: 80
            }
        };
        
        this.init();
    }

    async init() {
        try {
            // 1. Configuración inicial del entorno
            this.setupEnvironment();
            
            // 2. Inicializar módulos core
            await this.initializeCoreModules();
            
            // 3. Configurar eventos globales
            this.setupGlobalEvents();
            
            // 4. Inicializar componentes UI
            this.initUIComponents();
            
            // 5. Cargar datos iniciales
            await this.loadInitialData();
            
            // 6. Finalizar carga
            this.completeLoading();
            
            console.log('✅ YSHDD EPK v2.5.0 inicializado correctamente');
            this.modules.notifications.show('EPK profesional cargado', 'success');
            
        } catch (error) {
            console.error('❌ Error inicializando EPK:', error);
            this.showCriticalError(error);
        }
    }

    setupEnvironment() {
        // Configurar variables globales
        window.YSHDD = this;
        window.CONFIG = this.config;
        
        // Detectar características del navegador
        this.detectFeatures();
        
        // Configurar theme inicial
        this.applyTheme();
        
        // Prevenir acciones no deseadas
        this.setupProtections();
    }

    detectFeatures() {
        this.state.features = {
            serviceWorker: 'serviceWorker' in navigator,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            touch: 'ontouchstart' in window,
            pwa: window.matchMedia('(display-mode: standalone)').matches
        };
    }

    setupProtections() {
        // Prevenir clic derecho en imágenes
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG' && this.config.security.preventRightClick) {
                e.preventDefault();
                this.modules.notifications.show('Las imágenes están protegidas', 'info');
            }
        });
        
        // Prevenir copia de contenido sensible
        document.addEventListener('copy', (e) => {
            if (e.target.classList.contains('protected')) {
                e.preventDefault();
                this.modules.notifications.show('Este contenido está protegido', 'warning');
            }
        });
        
        // Proteger emails
        this.protectEmailAddresses();
    }

    protectEmailAddresses() {
        const emails = document.querySelectorAll('[data-email]');
        emails.forEach(el => {
            const email = el.getAttribute('data-email');
            const protectedEmail = this.obfuscateEmail(email);
            el.href = `mailto:${protectedEmail}`;
            if (el.textContent === email) {
                el.textContent = protectedEmail;
            }
        });
    }

    obfuscateEmail(email) {
        return email.replace('@', ' [at] ').replace(/\./g, ' [dot] ');
    }

    async initializeCoreModules() {
        // Orden de inicialización importante
        this.modules.security = new Security();
        this.modules.performance = new Performance();
        this.modules.validation = new Validation();
        this.modules.notifications = new Notifications();
        
        // Módulos de funcionalidad
        this.modules.player = new Player();
        this.modules.analytics = new Analytics();
        this.modules.email = new EmailService();
        this.modules.presskit = new PressKit();
        this.modules.tour = new TourManager();
        this.modules.collaborations = new Collaborations();
        this.modules.sessions = new Sessions();
        
        // Inicializar cada módulo
        await Promise.all([
            this.modules.security.init(),
            this.modules.performance.init(),
            this.modules.analytics.init(),
            this.modules.player.init()
        ]);
    }

    setupGlobalEvents() {
        // Scroll handling
        this.setupScrollEvents();
        
        // Resize handling
        this.setupResizeEvents();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Click outside handling
        this.setupClickOutside();
        
        // History handling
        this.setupHistoryEvents();
    }

    setupScrollEvents() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            // Header scroll effect
            this.state.isScrolled = window.scrollY > 100;
            document.getElementById('mainHeader').classList.toggle('scrolled', this.state.isScrolled);
            
            // Update active section
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveSection();
            }, 100);
            
            // Lazy load images on scroll
            this.lazyLoadImages();
        }, { passive: true });
    }

    setupResizeEvents() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            this.state.isMobile = window.innerWidth < 768;
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResizeComplete();
            }, 250);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S para descargar EPK
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.modules.presskit.downloadQuick();
                return;
            }
            
            // Espacio para play/pause música
            if (e.key === ' ' && !this.isFormElement(e.target)) {
                e.preventDefault();
                this.modules.player.togglePlay();
                return;
            }
            
            // Flechas para navegación
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateSections(e.key === 'ArrowDown' ? 'next' : 'prev');
                return;
            }
            
            // Escape para cerrar modales
            if (e.key === 'Escape') {
                this.closeAllModals();
                return;
            }
        });
    }

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            // Cerrar menús al hacer clic fuera
            const navMenu = document.getElementById('navMenu');
            const navToggle = document.getElementById('navToggle');
            
            if (navMenu.classList.contains('show') && 
                !navMenu.contains(e.target) && 
                !navToggle.contains(e.target)) {
                navMenu.classList.remove('show');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    setupHistoryEvents() {
        window.addEventListener('popstate', () => {
            this.handleHistoryChange();
        });
    }

    initUIComponents() {
        // Navegación móvil
        this.initMobileNavigation();
        
        // Theme toggle
        this.initThemeToggle();
        
        // Contadores animados
        this.initAnimatedCounters();
        
        // Tabs system
        this.initTabs();
        
        // Formularios
        this.initForms();
        
        // Modales
        this.initModals();
        
        // Botones flotantes
        this.initFloatingActions();
        
        // Lazy loading
        this.initLazyLoading();
        
        // Tooltips
        this.initTooltips();
    }

    initMobileNavigation() {
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                navToggle.setAttribute('aria-expanded', !isExpanded);
                navMenu.classList.toggle('show');
                
                // Animar items del menú
                if (!isExpanded) {
                    this.animateMenuItems();
                }
            });
            
            // Cerrar menú al hacer clic en enlace
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('show');
                    navToggle.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    animateMenuItems() {
        const items = document.querySelectorAll('.nav-item');
        items.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
            item.classList.add('animate-in');
        });
    }

    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
                this.applyTheme();
                
                // Actualizar icono
                themeIcon.className = this.state.theme === 'dark' ? 'bx bx-sun' : 'bx bx-moon';
                
                // Guardar preferencia
                localStorage.setItem('yshdd-theme', this.state.theme);
                
                this.modules.notifications.show(
                    `Tema cambiado a ${this.state.theme === 'dark' ? 'oscuro' : 'claro'}`,
                    'success'
                );
            });
        }
        
        // Cargar tema guardado
        const savedTheme = localStorage.getItem('yshdd-theme');
        if (savedTheme) {
            this.state.theme = savedTheme;
            this.applyTheme();
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
        
        // Actualizar meta theme-color
        const themeColor = this.state.theme === 'dark' ? '#111111' : '#ffffff';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
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
        const duration = 2000; // ms
        const step = target / (duration / 16); // 60fps
        let current = 0;
        
        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString();
            }
        };
        
        updateCounter();
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Actualizar botones activos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Mostrar panel correspondiente
                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `${tabId}-tab`) {
                        pane.classList.add('active');
                    }
                });
                
                // Track event
                this.modules.analytics.trackEvent('tabs', 'switch', tabId);
            });
        });
    }

    initForms() {
        // Formulario de contacto profesional
        const contactForm = document.getElementById('professionalForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData);
                
                // Validar
                const isValid = this.modules.validation.validateContact(data);
                if (!isValid) return;
                
                // Mostrar loading
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="bx bx-loader-circle spin"></i> Enviando...';
                submitBtn.disabled = true;
                
                try {
                    // Enviar email
                    const success = await this.modules.email.sendProfessionalContact(data);
                    
                    if (success) {
                        this.modules.notifications.show(
                            'Mensaje enviado al equipo de YSHDD. Te responderemos en 24-48 horas.',
                            'success'
                        );
                        contactForm.reset();
                        
                        // Track conversion
                        this.modules.analytics.trackEvent('contact', 'form_submit', 'professional');
                    } else {
                        throw new Error('Error enviando el mensaje');
                    }
                } catch (error) {
                    this.modules.notifications.show(
                        'Error enviando el mensaje. Por favor, intenta nuevamente.',
                        'error'
                    );
                } finally {
                    // Restaurar botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
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
                if (!data.collabName || !data.collabRole || !data.collabIdea) {
                    this.modules.notifications.show('Por favor, completa todos los campos requeridos', 'error');
                    return;
                }
                
                // Enviar propuesta
                const success = await this.modules.collaborations.submitProposal(data);
                
                if (success) {
                    this.modules.notifications.show(
                        'Propuesta de colaboración enviada. Te contactaremos pronto.',
                        'success'
                    );
                    collabForm.reset();
                }
            });
        }
    }

    initModals() {
        // Modal de EPK
        const epkModal = document.getElementById('epkModal');
        const epkButtons = document.querySelectorAll('[data-action="epk-modal"]');
        const closeButtons = document.querySelectorAll('.modal-close');
        
        // Abrir modal
        epkButtons.forEach(button => {
            button.addEventListener('click', () => {
                epkModal.classList.add('show');
                document.body.style.overflow = 'hidden';
            });
        });
        
        // Cerrar modal
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                epkModal.classList.remove('show');
                document.body.style.overflow = '';
            });
        });
        
        // Cerrar al hacer clic fuera
        epkModal.addEventListener('click', (e) => {
            if (e.target === epkModal) {
                epkModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
        
        // Descargas dentro del modal
        const downloadButtons = document.querySelectorAll('[data-download]');
        downloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-download');
                this.modules.presskit.download(type);
                epkModal.classList.remove('show');
                document.body.style.overflow = '';
            });
        });
    }

    initFloatingActions() {
        const backToTop = document.getElementById('backToTop');
        
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                window.scrollTo({ inset-block-start:0, behavior:'smooth' });
                this.modules.analytics.trackEvent('ui', 'back_to_top', 'click');
            });
        }
        
        if (quickEPK) {
            quickEPK.addEventListener('click', () => {
                this.modules.presskit.downloadQuick();
            });
        }
    }

    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    initTooltips() {
        const elements = document.querySelectorAll('[data-tooltip]');
        elements.forEach(el => {
            el.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - 10}px`;
                tooltip.style.transform = 'translate(-50%, -100%)';
            });
            
            el.addEventListener('mouseleave', () => {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) tooltip.remove();
            });
        });
    }

    async loadInitialData() {
        try {
            // Cargar datos en paralelo
            await Promise.all([
                this.modules.tour.loadDates(),
                this.modules.collaborations.load(),
                this.modules.sessions.load(),
                this.modules.presskit.loadStats()
            ]);
            
            // Actualizar estadísticas en tiempo real
            this.updateRealTimeStats();
            
        } catch (error) {
            console.warn('Algunos datos no pudieron cargarse:', error);
            this.modules.notifications.show('Algunos datos pueden no estar actualizados', 'warning');
        }
    }

    async updateRealTimeStats() {
        try {
            // Actualizar contadores de streams (ejemplo con API simulada)
            const stats = await this.fetchStreamingStats();
            if (stats) {
                this.updateStatElements(stats);
            }
        } catch (error) {
            console.warn('No se pudieron actualizar estadísticas en tiempo real:', error);
        }
    }

    async fetchStreamingStats() {
        // En producción, esto llamaría a APIs reales
        return {
            monthlyStreams: 52000,
            followers: 10500,
            cities: 12
        };
    }

    updateStatElements(stats) {
        const elements = {
            monthlyStreams: document.querySelector('[data-stat="monthly-streams"]'),
            followers: document.querySelector('[data-stat="followers"]'),
            cities: document.querySelector('[data-stat="cities"]')
        };
        
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = stats[key].toLocaleString();
            }
        });
    }

    completeLoading() {
        // Ocultar loader
        setTimeout(() => {
            const loader = document.getElementById('loader');
            loader.classList.add('hidden');
            document.body.classList.remove('loading');
            this.state.isLoading = false;
            
            // Mostrar animación de entrada
            this.animatePageEntrance();
            
            // Iniciar service worker
            this.registerServiceWorker();
            
        }, 1000);
    }

    animatePageEntrance() {
        const elements = document.querySelectorAll('.scroll-reveal');
        elements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.1}s`;
            el.classList.add('animate-in');
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registrado:', registration);
                
                // Verificar actualizaciones periódicamente
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // Cada hora
                
            } catch (error) {
                console.error('Error registrando Service Worker:', error);
            }
        }
    }

    updateActiveSection() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        let currentSection = 'hero';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop &&
                scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.id;
            }
        });
        
        if (this.state.currentSection !== currentSection) {
            this.state.currentSection = currentSection;
            this.updateNavigation();
            this.modules.analytics.trackEvent('navigation', 'section_change', currentSection);
        }
    }

    updateNavigation() {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${this.state.currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    navigateSections(direction) {
        const sections = Array.from(document.querySelectorAll('section[id]'));
        const currentIndex = sections.findIndex(
            section => section.id === this.state.currentSection
        );
        
        let nextIndex;
        if (direction === 'next' && currentIndex < sections.length - 1) {
            nextIndex = currentIndex + 1;
        } else if (direction === 'prev' && currentIndex > 0) {
            nextIndex = currentIndex - 1;
        } else {
            return;
        }
        
        const nextSection = sections[nextIndex];
        nextSection.scrollIntoView({ behavior: 'smooth' });
    }

    closeAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        });
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]:not(.loaded)');
        images.forEach(img => {
            if (this.isElementInViewport(img)) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }

    isElementInViewport(el) {
        return (
            rect.top <= window.innerHeight &&
            rect.bottom >= 0 &&
            rect.left <= window.innerWidth &&
            rect.right >= 0
        );
    }

    isFormElement(element) {
        return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element.tagName);
    }

    handleResizeComplete() {
        // Re-inicializar componentes que dependen del tamaño
        this.modules.player.handleResize();
        
        // Actualizar grid layouts si es necesario
        this.updateGridLayouts();
    }

    handleHistoryChange() {
        // Manejar cambios en el history API
        const hash = window.location.hash;
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    updateGridLayouts() {
        // Ajustar grid columns basado en tamaño de pantalla
        const grids = document.querySelectorAll('.albums-grid, .collaborations-grid');
        grids.forEach(grid => {
            if (this.state.isMobile) {
                grid.style.gridTemplateColumns = '1fr';
            } else {
                grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            }
        });
    }

    showCriticalError(error) {
        const errorHtml = `
            <div class="error-container">
                <i class='bx bx-error-circle'></i>
                <h3>Error crítico</h3>
                <p>No se pudo cargar el EPK completamente.</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class='bx bx-refresh'></i>
                    Recargar página
                </button>
            </div>
        `;
        
        document.body.innerHTML = errorHtml;
        document.body.style.display = 'flex';
        document.body.style.alignItems = 'center';
        document.body.style.justifyContent = 'center';
        document.body.style.minHeight = '100vh';
        document.body.style.textAlign = 'center';
        document.body.style.padding = '2rem';
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Polyfill para navegadores antiguos
    if (!('IntersectionObserver' in window)) {
        import('./utils/polyfills.js').then(() => {
            new YSHDDEPK();
        });
    } else {
        new YSHDDEPK();
    }
});

// Manejar errores no capturados
window.addEventListener('error', (event) => {
    console.error('Error global no capturado:', event.error);
    
    if (window.YSHDD && window.YSHDD.modules.notifications) {
        window.YSHDD.modules.notifications.show(
            'Ocurrió un error inesperado. La página puede no funcionar correctamente.',
            'error'
        );
    }
});

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa rechazada no capturada:', event.reason);
});

// Exportar para acceso global (debug y desarrollo)
export default YSHDDEPK;
