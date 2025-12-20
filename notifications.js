// En tu config.js, dentro de export const UTILS = { ... }

// Métodos de estado (para localStorage)
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

// Navegación y scroll
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

// Detección de dispositivos
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

// Elemento en viewport (para performance.js)
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

// Descarga de archivos (para notifications.js)
downloadFile: function(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || url.split('/').pop();
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
},

// Animaciones y transiciones
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

// Generador de IDs (ya existe, pero verifica que esté)
generateId: function(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}${timestamp}_${random}`;
},

// Validación de formularios (para main.js)
validateEmail: function(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
},

validatePhone: function(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
},

// Formateo de texto
capitalize: function(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
},

truncate: function(text, length = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substr(0, length).trim() + suffix;
},

// Fechas y tiempos
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

// Manejo de eventos
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
}
