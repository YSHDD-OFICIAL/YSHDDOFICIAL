// assets/js/config.js - VERSIÓN COMPLETA 2.6.0

export const CONFIG = {
    // Información de la aplicación
    app: {
        name: 'YSHDD EPK',
        version: '2.6.0',
        build: '20250315',
        author: 'YSHDD',
        email: 'yshddoficial@gmail.com',
        website: 'https://yshdd.netlify.app/',
        repo: 'https://github.com/YSHDD-OFICIAL/YSHDDOFICIAL/',
        license: 'Proprietary'
    },
    
    // Información del artista
    artist: {
        name: 'YSHDD',
        realName: 'Luis Esteban Potosí Venté',
        birthDate: '2005-05-30',
        location: 'Cali, Colombia',
        genre: ['Rap Cristiano', 'Trap Cristiano', 'Hip Hop Cristiano'],
        activeSince: 2023,
        label: 'Independiente',
        management: 'YSHDD Management',
        booking: 'yshddoficial@gmail.com'
    },
    
    // APIs y endpoints
    api: {
        baseUrl: 'https://yshdd.netlify.app/',
        endpoints: {
            contact: '/contact',
            newsletter: '/newsletter',
            booking: '/booking',
            collaboration: '/collaboration',
            stats: '/stats',
            download: '/download',
            stream: '/stream'
        },
        keys: {
            analytics: 'G-XXXXXXXXXX',
            vapid: '',
            recaptcha: 'SITE_KEY'
        }
    },
    
    // URLs de redes sociales
    social: {
        instagram: {
            url: 'https://instagram.com/yshddoficial',
            handle: '@yshddoficial'
        },
        youtube: {
            url: 'https://youtube.com/@yshdd',
            handle: '@yshdd'
        },
        spotify: {
            url: 'https://open.spotify.com/artist/43tSpIfMASioBV4PmbyymH',
            artistId: '43tSpIfMASioBV4PmbyymH'
        },
        tiktok: {
            url: 'https://tiktok.com/@yshddoficial',
            handle: '@yshddoficial'
        },
        facebook: {
            url: 'https://facebook.com/yshddoficial',
            handle: 'yshddoficial'
        },
        twitter: {
            url: 'https://twitter.com/yshdd',
            handle: '@yshdd'
        },
        soundcloud: {
            url: 'https://soundcloud.com/yshdd',
            handle: 'yshdd'
        },
        appleMusic: {
            url: 'https://music.apple.com/artist/yshdd',
            artistId: 'id123456789'
        }
    },
    
    // URLs de descarga
    downloads: {
        epkBasic: {
            url: '/downloads/epk-basic.zip',
            size: '5MB',
            version: '1.0'
        },
        epkFull: {
            url: '/downloads/epk-full.zip',
            size: '50MB',
            version: '2.0'
        },
        bio: {
            url: '/downloads/bio-completa.pdf',
            size: '2MB',
            pages: 5
        },
        photos: {
            url: '/downloads/fotos-prensa.zip',
            size: '30MB',
            count: 15
        },
        music: {
            url: '/downloads/musica-para-medios.zip',
            size: '15MB',
            tracks: 3
        }
    },
    
    // Configuración de características
    features: {
        pwa: {
            enabled: true,
            installable: true,
            offline: true
        },
        notifications: {
            enabled: true,
            permissionRequired: true
        },
        analytics: {
            enabled: true,
            providers: ['google', 'custom']
        },
        lazyLoad: {
            enabled: true,
            threshold: 0.5
        },
        webp: {
            enabled: true,
            fallback: true
        },
        serviceWorker: {
            enabled: true,
            version: '2.6.0'
        },
        musicPlayer: {
            enabled: true,
            autoplay: false,
            volume: 80
        }
    },
    
    // Configuración de seguridad
    security: {
        csp: {
            enabled: true,
            reportOnly: false
        },
        xssProtection: {
            enabled: true
        },
        clickjackingProtection: {
            enabled: true
        },
        emailObfuscation: {
            enabled: true,
            method: 'rot13'
        },
        rightClickProtection: {
            enabled: true,
            imagesOnly: true
        }
    },
    
    // Configuración de rendimiento
    performance: {
        lazyLoadThreshold: 0.5,
        imageQuality: 85,
        cacheTTL: 3600,
        preloadCritical: true,
        prefetchLinks: true,
        webpQuality: 80,
        maxImageSize: 1920
    },
    
    // Contenido estático
    content: {
        stats: {
            monthlyStreams: 28,
            followers: 8700,
            cities: 12,
            releases: 5,
            collaborations: 3,
            performances: 50
        },
        
        releases: [
            {
                id: 1,
                title: 'CRISIS',
                type: 'album',
                year: 2025,
                tracks: 5,
                duration: '16:06',
                plays: 118,
                likes: 10,
                spotifyId: '',
                cover: 'crisis-v.png'
            },
        ],
        
        videos: [
            {
                id: 1,
                title: 'Vida Nueva•YSHDD & SIRRIVAL - Instrumental (Audio Official)',
                type: 'official',
                views: 118,
                duration: '2:33',
                url: 'https://youtu.be/RZUXjDMY528?si=VuToIxLRDgkIQRPy',
                thumbnail: 'VIDA-NUEVA.png'
            }
        ],
        
        gallery: {
            categories: ['press', 'live', 'studio', 'behind'],
            images: [
                {
                    id: 1,
                    src: 'YSHDD.png',
                    webp: 'YSHDD,png',
                    category: 'press',
                    alt: 'YSHDD',
                    width: 1200,
                    height: 800
                }
            ]
        }
    },
    
    // Internacionalización
    i18n: {
        default: 'es',
        supported: ['es', 'en'],
        fallback: 'es'
    },
    
    // Analytics events
    events: {
        pageView: 'page_view',
        download: 'download',
        play: 'play',
        contact: 'contact',
        social: 'social_click'
    }
};

// Constantes globales
export const CONSTANTS = {
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1280,
        WIDE: 1536
    },
    
    ANIMATION: {
        DURATION: {
            FAST: 150,
            BASE: 300,
            SLOW: 500,
            XL: 1000
        },
        EASING: {
            BASE: 'cubic-bezier(0.4, 0, 0.2, 1)',
            BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
            EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)'
        }
    },
    
    STORAGE_KEYS: {
        THEME: 'yshdd-theme',
        USER_ID: 'yshdd-user-id',
        NOTIFICATIONS: 'yshdd-notifications',
        SESSIONS: 'yshdd-sessions',
        MUSIC_VOLUME: 'yshdd-music-volume',
        LAST_VISIT: 'yshdd-last-visit'
    },
    
    EVENT_TYPES: {
        CLICK: 'click',
        SCROLL: 'scroll',
        RESIZE: 'resize',
        LOAD: 'load',
        ERROR: 'error',
        ONLINE: 'online',
        OFFLINE: 'offline'
    },
    
    COLORS: {
        PRIMARY: '#ffdd57',
        SECONDARY: '#222222',
        ACCENT: '#e94560',
        SUCCESS: '#4caf50',
        ERROR: '#f44336',
        WARNING: '#ff9800',
        INFO: '#2196f3',
        DARK: '#111111',
        LIGHT: '#ffffff'
    }
};

// Funciones de utilidad - COMPLETO
export const UTILS = {
    // ========== MÉTODOS DE ESTADO (localStorage) ==========
    getState: function(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error obteniendo estado ${key}:`, error);
            return null;
        }
    },
    
    setState: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error guardando estado ${key}:`, error);
            return false;
        }
    },
    
    removeState: function(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removiendo estado ${key}:`, error);
            return false;
        }
    },
    
    clearState: function() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error limpiando estado:', error);
            return false;
        }
    },
    
    hasState: function(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error(`Error verificando estado ${key}:`, error);
            return false;
        }
    },
    
    // ========== NAVEGACIÓN Y SCROLL ==========
    scrollToElement: function(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },
    
    scrollToTop: function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    },
    
    // ========== DETECCIÓN DE DISPOSITIVOS ==========
    matchMedia: function(breakpoint) {
        const breakpoints = {
            'sm': 640,
            'md': 768,
            'lg': 1024,
            'xl': 1280,
            '2xl': 1536
        };
        
        const width = breakpoints[breakpoint] || breakpoint;
        return window.innerWidth < width;
    },
    
    isMobileDevice: function() {
        return window.innerWidth < 768;
    },
    
    isTabletDevice: function() {
        return window.innerWidth >= 768 && window.innerWidth < 1024;
    },
    
    isDesktopDevice: function() {
        return window.innerWidth >= 1024;
    },
    
    // ========== ELEMENTO EN VIEWPORT ==========
    isElementInViewport: function(el) {
        if (!el) return false;
        
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= window.innerHeight &&
            rect.bottom >= 0 &&
            rect.left <= window.innerWidth &&
            rect.right >= 0
        );
    },
    
    // ========== DESCARGA DE ARCHIVOS ==========
    downloadFile: function(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || url.split('/').pop();
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            if (a.parentNode) {
                document.body.removeChild(a);
            }
        }, 100);
    },
    
    // ========== ANIMACIONES ==========
    animateElement: function(element, animation, duration = 300) {
        if (!element) return;
        
        element.style.animation = `${animation} ${duration}ms ease`;
        setTimeout(() => {
            element.style.animation = '';
        }, duration);
    },
    
    fadeIn: function(element, duration = 300) {
        if (!element) return;
        
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let opacity = 0;
        const interval = 10;
        const increment = interval / duration;
        
        const fade = () => {
            opacity += increment;
            element.style.opacity = opacity.toString();
            
            if (opacity < 1) {
                requestAnimationFrame(fade);
            }
        };
        
        fade();
    },
    
    fadeOut: function(element, duration = 300) {
        if (!element) return;
        
        let opacity = 1;
        const interval = 10;
        const decrement = interval / duration;
        
        const fade = () => {
            opacity -= decrement;
            element.style.opacity = opacity.toString();
            
            if (opacity > 0) {
                requestAnimationFrame(fade);
            } else {
                element.style.display = 'none';
            }
        };
        
        fade();
    },
    
    // ========== FORMATEO DE NÚMEROS ==========
    formatNumber: function(num) {
        if (!num && num !== 0) return '0';
        
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    
    // ========== FORMATEO DE DURACIÓN ==========
    formatDuration: function(seconds) {
        if (!seconds) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // ========== GENERADOR DE IDs ==========
    generateId: function(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    },
    
    // ========== VALIDACIÓN ==========
    isValidEmail: function(email) {
        if (!email) return false;
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    isValidPhone: function(phone) {
        if (!phone) return false;
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    },
    
    validateEmail: function(email) {
        return this.isValidEmail(email);
    },
    
    validatePhone: function(phone) {
        return this.isValidPhone(phone);
    },
    
    // ========== FORMATEO DE TEXTO ==========
    capitalize: function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
    
    truncate: function(text, length = 100, suffix = '...') {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substr(0, length).trim() + suffix;
    },
    
    // ========== FECHAS ==========
    formatDate: function(dateString, format = 'es') {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        if (format === 'es') {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
        
        return date.toLocaleDateString();
    },
    
    formatTime: function(seconds) {
        if (!seconds && seconds !== 0) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // ========== MANEJO DE EVENTOS ==========
    debounce: function(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // ========== URL PARAMS ==========
    getUrlParams: function() {
        const params = {};
        const query = window.location.search.substring(1);
        
        if (!query) return params;
        
        query.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    },
    
    // ========== COPY TO CLIPBOARD ==========
    copyToClipboard: async function(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (err) {
            console.error('Error copying to clipboard:', err);
            return false;
        }
    },
    
    // ========== VERIFICACIÓN DE CARACTERÍSTICAS ==========
    isTouchDevice: function() {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 || 
               (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);
    },
    
    isOnline: function() {
        return navigator.onLine;
    },
    
    // ========== TAMAÑO DE PANTALLA ==========
    getScreenSize: function() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: window.devicePixelRatio || 1,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        };
    },
    
    // ========== WEBP SUPPORT ==========
    supportsWebP: function() {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(true);
            image.onerror = () => resolve(false);
            image.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
        });
    },
    
    // ========== SERVICE WORKER SUPPORT ==========
    supportsServiceWorker: function() {
        return 'serviceWorker' in navigator;
    },
    
    // ========== NOTIFICATIONS SUPPORT ==========
    supportsNotifications: function() {
        return 'Notification' in window;
    },
    
    // ========== OBFUSCATE EMAIL ==========
    obfuscateEmail: function(email) {
        if (!email) return '';
        return email
            .replace('@', ' [at] ')
            .replace(/\./g, ' [dot] ')
            .replace(/\-/g, ' [dash] ');
    },
    
    // ========== ENCODE/DECODE DATA ==========
    encodeData: function(data) {
        return btoa(encodeURIComponent(JSON.stringify(data)));
    },
    
    decodeData: function(encoded) {
        try {
            return JSON.parse(decodeURIComponent(atob(encoded)));
        } catch (e) {
            console.error('Error decoding data:', e);
            return null;
        }
    },
    
    // ========== MEDIR PERFORMANCE ==========
    measurePerformance: function(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name}: ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    // ========== CREAR ELEMENTOS ==========
    createElement: function(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'style' && typeof attributes[key] === 'object') {
                Object.assign(element.style, attributes[key]);
            } else if (key === 'dataset') {
                Object.assign(element.dataset, attributes[key]);
            } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
                element.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    },
    
    // ========== GET STORAGE INFO ==========
    getStorageInfo: async function() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    quota: estimate.quota,
                    percentage: estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(2) : 0
                };
            } catch (error) {
                console.error('Error obteniendo info de almacenamiento:', error);
                return null;
            }
        }
        return null;
    }
};

// Clase de error personalizada
export class AppError extends Error {
    constructor(message, code = 'APP_ERROR', details = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
    
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// Exportar por defecto
export default {
    CONFIG,
    CONSTANTS,
    UTILS,
    AppError
};
