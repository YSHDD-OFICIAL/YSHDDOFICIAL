// assets/js/utils.js

import { CONFIG, CONSTANTS, UTILS } from './config.js';

export class Utils {
    // ====== MANEJO DE ESTADO ======
    
    static setState(key, value, storage = 'local') {
        try {
            const data = JSON.stringify({
                value,
                timestamp: Date.now(),
                version: CONFIG.app.version
            });
            
            if (storage === 'local') {
                localStorage.setItem(key, data);
            } else if (storage === 'session') {
                sessionStorage.setItem(key, data);
            }
            
            return true;
        } catch (error) {
            console.error('Error guardando estado:', error);
            return false;
        }
    }
    
    static getState(key, storage = 'local', maxAge = null) {
        try {
            const storageObj = storage === 'local' ? localStorage : sessionStorage;
            const data = storageObj.getItem(key);
            
            if (!data) return null;
            
            const parsed = JSON.parse(data);
            
            // Verificar versión
            if (parsed.version !== CONFIG.app.version) {
                storageObj.removeItem(key);
                return null;
            }
            
            // Verificar antigüedad
            if (maxAge && Date.now() - parsed.timestamp > maxAge) {
                storageObj.removeItem(key);
                return null;
            }
            
            return parsed.value;
        } catch (error) {
            console.error('Error recuperando estado:', error);
            return null;
        }
    }
    
    static removeState(key, storage = 'local') {
        try {
            const storageObj = storage === 'local' ? localStorage : sessionStorage;
            storageObj.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removiendo estado:', error);
            return false;
        }
    }
    
    static clearState(storage = 'local') {
        try {
            const storageObj = storage === 'local' ? localStorage : sessionStorage;
            storageObj.clear();
            return true;
        } catch (error) {
            console.error('Error limpiando estado:', error);
            return false;
        }
    }
    
    // ====== MANEJO DE COOKIES ======
    
    static setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Strict`;
    }
    
    static getCookie(name) {
        const nameEQ = `${name}=`;
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        
        return null;
    }
    
    static deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
    
    // ====== MANEJO DE URLS ======
    
    static updateUrlParams(params = {}, replace = false) {
        const url = new URL(window.location.href);
        
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        
        if (replace) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
    }
    
    static getUrlParam(key) {
        const url = new URL(window.location.href);
        return url.searchParams.get(key);
    }
    
    static removeUrlParam(key) {
        const url = new URL(window.location.href);
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url);
    }
    
    static createShareUrl(params = {}) {
        const url = new URL(window.location.origin + window.location.pathname);
        
        Object.keys(params).forEach(key => {
            url.searchParams.set(key, params[key]);
        });
        
        return url.toString();
    }
    
    // ====== MANEJO DE ARCHIVOS ======
    
    static readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsText(file);
        });
    }
    
    static readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                resolve(event.target.result);
            };
            
            reader.onerror = (error) => {
                reject(error);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    static downloadTextFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
    
    static downloadJSONFile(data, filename) {
        const content = JSON.stringify(data, null, 2);
        this.downloadTextFile(content, filename, 'application/json');
    }
    
    // ====== MANEJO DE FECHAS ======
    
    static formatDate(date, format = 'es') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        if (format === 'es') {
            return d.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } else if (format === 'short') {
            return d.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } else if (format === 'relative') {
            return this.getRelativeTime(d);
        } else if (format === 'datetime') {
            return d.toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return d.toLocaleDateString();
    }
    
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 30) {
            return this.formatDate(date, 'short');
        } else if (days > 0) {
            return `hace ${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else if (minutes > 0) {
            return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        } else {
            return 'hace unos segundos';
        }
    }
    
    static formatDuration(seconds) {
        if (!seconds && seconds !== 0) return '0:00';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }
    
    // ====== MANEJO DE DOM ======
    
    static createElement(tag, attributes = {}, children = []) {
        return UTILS.createElement(tag, attributes, children);
    }
    
    static removeElement(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
    
    static fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            element.style.transition = `opacity ${duration}ms`;
            element.style.opacity = '0';
            
            setTimeout(() => {
                this.removeElement(element);
                resolve();
            }, duration);
        });
    }
    
    static fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms`;
            element.style.display = '';
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
            
            setTimeout(resolve, duration);
        });
    }
    
    static toggleElement(element, show) {
        if (show) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    }
    
    static scrollToElement(element, offset = 100, behavior = 'smooth') {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior
        });
    }
    
    static scrollToTop(behavior = 'smooth') {
        window.scrollTo({
            top: 0,
            behavior
        });
    }
    
    static isElementInViewport(el, threshold = 0) {
        if (!el) return false;
        
        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top <= windowHeight - threshold &&
            rect.bottom >= threshold &&
            rect.left <= windowWidth - threshold &&
            rect.right >= threshold
        );
    }
    
    // ====== MANEJO DE EVENTOS ======
    
    static addGlobalEventListener(event, selector, handler, options = {}) {
        document.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler(e);
            }
        }, options);
    }
    
    static debounceEvent(element, event, handler, delay = 300) {
        let timeout;
        
        const debouncedHandler = (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => handler(e), delay);
        };
        
        element.addEventListener(event, debouncedHandler);
        
        return () => {
            element.removeEventListener(event, debouncedHandler);
        };
    }
    
    static throttleEvent(element, event, handler, limit = 300) {
        let inThrottle;
        
        const throttledHandler = (e) => {
            if (!inThrottle) {
                handler(e);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
        
        element.addEventListener(event, throttledHandler);
        
        return () => {
            element.removeEventListener(event, throttledHandler);
        };
    }
    
    // ====== MANEJO DE IMÁGENES ======
    
    static preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    static lazyLoadImage(img) {
        if (!img.dataset.src) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(img);
    }
    
    static createImagePlaceholder(width, height, color = '#333', text = '') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        if (text) {
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);
        }
        
        return canvas.toDataURL();
    }
    
    // ====== MANEJO DE MEDIA QUERIES ======
    
    static getMediaQuery(breakpoint) {
        const breakpoints = {
            sm: '(max-width: 640px)',
            md: '(max-width: 768px)',
            lg: '(max-width: 1024px)',
            xl: '(max-width: 1280px)'
        };
        
        return breakpoints[breakpoint] || breakpoint;
    }
    
    static matchMedia(breakpoint) {
        return window.matchMedia(this.getMediaQuery(breakpoint)).matches;
    }
    
    static onMediaQueryChange(breakpoint, callback) {
        const mediaQuery = window.matchMedia(this.getMediaQuery(breakpoint));
        
        const handler = (event) => callback(event.matches);
        mediaQuery.addEventListener('change', handler);
        
        // Ejecutar callback inicial
        callback(mediaQuery.matches);
        
        return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // ====== MANEJO DE ANIMACIONES ======
    
    static animateCSS(element, animation, prefix = 'animate__') {
        return new Promise((resolve) => {
            const animationName = `${prefix}${animation}`;
            
            element.classList.add(`${prefix}animated`, animationName);
            
            function handleAnimationEnd(event) {
                event.stopPropagation();
                element.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }
            
            element.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    }
    
    static createRipple(event) {
        const button = event.currentTarget;
        const circle = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = button.getElementsByClassName('ripple')[0];
        if (ripple) {
            ripple.remove();
        }
        
        button.appendChild(circle);
    }
    
    // ====== MANEJO DE DATOS ======
    
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
    
    static mergeObjects(...objects) {
        return objects.reduce((result, current) => {
            return { ...result, ...current };
        }, {});
    }
    
    static deepMerge(target, source) {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && key in target) {
                Object.assign(source[key], this.deepMerge(target[key], source[key]));
            }
        }
        
        Object.assign(target || {}, source);
        return target;
    }
    
    static filterObject(obj, predicate) {
        return Object.fromEntries(
            Object.entries(obj).filter(([key, value]) => predicate(key, value))
        );
    }
    
    static mapObject(obj, mapper) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => mapper(key, value))
        );
    }
    
    // ====== MANEJO DE ARRAYS ======
    
    static chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    static uniqueArray(array) {
        return [...new Set(array)];
    }
    
    static sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            let aValue = a[key];
            let bValue = b[key];
            
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (aValue < bValue) return order === 'asc' ? -1 : 1;
            if (aValue > bValue) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    // ====== MANEJO DE STRINGS ======
    
    static truncateString(str, length = 100, suffix = '...') {
        if (!str) return '';
        if (str.length <= length) return str;
        return str.substr(0, length).trim() + suffix;
    }
    
    static capitalizeString(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
    
    static titleCase(str) {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    static slugify(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    
    static generateRandomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // ====== MANEJO DE NÚMEROS ======
    
    static formatNumber(num, options = {}) {
        const defaults = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        const config = { ...defaults, ...options };
        
        if (num === null || num === undefined) return '0';
        
        return new Intl.NumberFormat('es-ES', config).format(num);
    }
    
    static formatCurrency(amount, currency = 'USD', locale = 'es-ES') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency
        }).format(amount);
    }
    
    static formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }
    
    static randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // ====== MANEJO DE ERRORES ======
    
    static handleError(error, context = '') {
        const errorData = {
            message: error.message || 'Error desconocido',
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error(`Error en ${context}:`, errorData);
        
        // Enviar a servicio de tracking si existe
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: errorData.message,
                fatal: false
            });
        }
        
        // Guardar en localStorage para debugging
        try {
            const errors = JSON.parse(localStorage.getItem('yshdd-errors') || '[]');
            errors.push(errorData);
            if (errors.length > 50) errors.shift();
            localStorage.setItem('yshdd-errors', JSON.stringify(errors));
        } catch (e) {
            // No hacer nada si no se puede guardar
        }
        
        return errorData;
    }
    
    static tryCatch(fn, errorHandler) {
        try {
            return fn();
        } catch (error) {
            if (errorHandler) {
                return errorHandler(error);
            } else {
                this.handleError(error, 'tryCatch');
                throw error;
            }
        }
    }
    
    static async tryCatchAsync(fn, errorHandler) {
        try {
            return await fn();
        } catch (error) {
            if (errorHandler) {
                return errorHandler(error);
            } else {
                this.handleError(error, 'tryCatchAsync');
                throw error;
            }
        }
    }
    
    // ====== MANEJO DE PERMISOS ======
    
    static async requestPermission(permission) {
        const permissions = {
            notifications: () => Notification.requestPermission(),
            camera: () => navigator.mediaDevices.getUserMedia({ video: true }),
            microphone: () => navigator.mediaDevices.getUserMedia({ audio: true }),
            geolocation: () => new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            })
        };
        
        const handler = permissions[permission];
        if (!handler) {
            throw new Error(`Permiso no soportado: ${permission}`);
        }
        
        try {
            const result = await handler();
            return { granted: true, result };
        } catch (error) {
            return { granted: false, error: error.message };
        }
    }
    
    static checkPermission(permission) {
        const status = {
            notifications: Notification.permission,
            camera: 'prompt',
            microphone: 'prompt',
            geolocation: 'prompt'
        };
        
        return status[permission] || 'unknown';
    }
    
    // ====== MANEJO DE CONEXIÓN ======
    
    static checkConnection() {
        return {
            online: navigator.onLine,
            type: navigator.connection?.effectiveType || 'unknown',
            downlink: navigator.connection?.downlink || 0,
            rtt: navigator.connection?.rtt || 0,
            saveData: navigator.connection?.saveData || false
        };
    }
    
    static onConnectionChange(callback) {
        window.addEventListener('online', () => callback(this.checkConnection()));
        window.addEventListener('offline', () => callback(this.checkConnection()));
        
        if (navigator.connection) {
            navigator.connection.addEventListener('change', () => 
                callback(this.checkConnection())
            );
        }
        
        return () => {
            window.removeEventListener('online', callback);
            window.removeEventListener('offline', callback);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', callback);
            }
        };
    }
    
    // ====== MANEJO DE STORAGE ======
    
    static getStorageUsage() {
        return new Promise((resolve) => {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                navigator.storage.estimate().then(estimate => {
                    resolve({
                        used: estimate.usage,
                        quota: estimate.quota,
                        percentage: estimate.quota ? 
                            (estimate.usage / estimate.quota * 100).toFixed(2) : 0
                    });
                }).catch(() => resolve(null));
            } else {
                resolve(null);
            }
        });
    }
    
    static clearCache() {
        // Limpiar localStorage y sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cookies
        document.cookie.split(';').forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            this.deleteCookie(name);
        });
        
        // Limpiar Service Worker cache
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
        
        // Limpiar cache de imágenes
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    caches.delete(cacheName);
                });
            });
        }
        
        return true;
    }
    
    // ====== UTILIDADES DE DESARROLLO ======
    
    static log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const styles = {
            info: 'color: #2196F3; font-weight: bold;',
            success: 'color: #4CAF50; font-weight: bold;',
            warning: 'color: #FF9800; font-weight: bold;',
            error: 'color: #F44336; font-weight: bold;',
            debug: 'color: #9C27B0; font-weight: bold;'
        };
        
        const style = styles[level] || styles.info;
        
        console.log(`%c[YSHDD ${level.toUpperCase()}] ${timestamp}`, style, message);
        if (data) {
            console.log(data);
        }
        
        // Guardar en localStorage en desarrollo
        if (window.location.hostname === 'localhost') {
            const logs = JSON.parse(localStorage.getItem('yshdd-logs') || '[]');
            logs.push({ level, timestamp, message, data });
            if (logs.length > 1000) logs.shift();
            localStorage.setItem('yshdd-logs', JSON.stringify(logs));
        }
    }
    
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        this.log('debug', `${name}: ${(end - start).toFixed(2)}ms`);
        
        return result;
    }
    
    static async measureAsyncPerformance(name, fn) {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        this.log('debug', `${name}: ${(end - start).toFixed(2)}ms`);
        
        return result;
    }
}

// Exportar funciones estáticas como funciones regulares para compatibilidad
export const utils = {
    // Estado
    setState: Utils.setState,
    getState: Utils.getState,
    removeState: Utils.removeState,
    clearState: Utils.clearState,
    
    // Cookies
    setCookie: Utils.setCookie,
    getCookie: Utils.getCookie,
    deleteCookie: Utils.deleteCookie,
    
    // URLs
    updateUrlParams: Utils.updateUrlParams,
    getUrlParam: Utils.getUrlParam,
    removeUrlParam: Utils.removeUrlParam,
    createShareUrl: Utils.createShareUrl,
    
    // Archivos
    readFileAsText: Utils.readFileAsText,
    readFileAsDataURL: Utils.readFileAsDataURL,
    downloadTextFile: Utils.downloadTextFile,
    downloadJSONFile: Utils.downloadJSONFile,
    
    // Fechas
    formatDate: Utils.formatDate,
    getRelativeTime: Utils.getRelativeTime,
    formatDuration: Utils.formatDuration,
    
    // DOM
    createElement: Utils.createElement,
    removeElement: Utils.removeElement,
    fadeOut: Utils.fadeOut,
    fadeIn: Utils.fadeIn,
    toggleElement: Utils.toggleElement,
    scrollToElement: Utils.scrollToElement,
    scrollToTop: Utils.scrollToTop,
    isElementInViewport: Utils.isElementInViewport,
    
    // Eventos
    addGlobalEventListener: Utils.addGlobalEventListener,
    debounceEvent: Utils.debounceEvent,
    throttleEvent: Utils.throttleEvent,
    
    // Imágenes
    preloadImage: Utils.preloadImage,
    lazyLoadImage: Utils.lazyLoadImage,
    createImagePlaceholder: Utils.createImagePlaceholder,
    
    // Media Queries
    getMediaQuery: Utils.getMediaQuery,
    matchMedia: Utils.matchMedia,
    onMediaQueryChange: Utils.onMediaQueryChange,
    
    // Animaciones
    animateCSS: Utils.animateCSS,
    createRipple: Utils.createRipple,
    
    // Datos
    deepClone: Utils.deepClone,
    mergeObjects: Utils.mergeObjects,
    deepMerge: Utils.deepMerge,
    filterObject: Utils.filterObject,
    mapObject: Utils.mapObject,
    
    // Arrays
    chunkArray: Utils.chunkArray,
    shuffleArray: Utils.shuffleArray,
    uniqueArray: Utils.uniqueArray,
    sortBy: Utils.sortBy,
    
    // Strings
    truncateString: Utils.truncateString,
    capitalizeString: Utils.capitalizeString,
    titleCase: Utils.titleCase,
    slugify: Utils.slugify,
    generateRandomString: Utils.generateRandomString,
    
    // Números
    formatNumber: Utils.formatNumber,
    formatCurrency: Utils.formatCurrency,
    formatPercentage: Utils.formatPercentage,
    randomNumber: Utils.randomNumber,
    
    // Errores
    handleError: Utils.handleError,
    tryCatch: Utils.tryCatch,
    tryCatchAsync: Utils.tryCatchAsync,
    
    // Permisos
    requestPermission: Utils.requestPermission,
    checkPermission: Utils.checkPermission,
    
    // Conexión
    checkConnection: Utils.checkConnection,
    onConnectionChange: Utils.onConnectionChange,
    
    // Storage
    getStorageUsage: Utils.getStorageUsage,
    clearCache: Utils.clearCache,
    
    // Desarrollo
    log: Utils.log,
    measurePerformance: Utils.measurePerformance,
    measureAsyncPerformance: Utils.measureAsyncPerformance
};

// Exportar por defecto
export default utils;

// Inicialización global
window.YSHDDUtils = utils;
