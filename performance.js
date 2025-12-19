// assets/js/performance.js

import { CONFIG, UTILS } from './config.js';

export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fcp: null,      // First Contentful Paint
            lcp: null,      // Largest Contentful Paint
            fid: null,      // First Input Delay
            cls: null,      // Cumulative Layout Shift
            ttfb: null,     // Time to First Byte
            tti: null,      // Time to Interactive
            memory: null
        };
        
        this.observers = [];
        this.resources = [];
        this.longTasks = [];
        this.paintTimes = [];
        
        this.thresholds = {
            good: 2000,     // 2 segundos
            needsImprovement: 4000, // 4 segundos
            poor: 6000      // 6 segundos
        };
        
        this.init();
    }
    
    init() {
        console.log('⚡ Inicializando monitor de rendimiento...');
        
        // Solo en producción
        if (window.location.hostname === 'localhost') {
            console.log('Monitor de rendimiento desactivado en desarrollo');
            return;
        }
        
        this.setupPerformanceObservers();
        this.trackResources();
        this.monitorLongTasks();
        this.setupVisibilityListener();
        this.setupNetworkListener();
        
        // Reportar al cargar la página
        window.addEventListener('load', () => {
            setTimeout(() => this.collectMetrics(), 1000);
        });
        
        console.log('✅ Monitor de rendimiento inicializado');
    }
    
    setupPerformanceObservers() {
        // Observer para LCP
        if ('PerformanceObserver' in window) {
            try {
                // LCP Observer
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.lcp = lastEntry.startTime;
                    this.reportMetric('lcp', lastEntry.startTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
                
                // CLS Observer
                const clsObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            this.metrics.cls = (this.metrics.cls || 0) + entry.value;
                        }
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
                
                // FID Observer
                const fidObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    for (const entry of entries) {
                        this.metrics.fid = entry.processingStart - entry.startTime;
                        this.reportMetric('fid', this.metrics.fid);
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.push(fidObserver);
                
            } catch (error) {
                console.warn('PerformanceObserver no soportado:', error);
            }
        }
        
        // TTFB (Time to First Byte)
        if (performance.timing) {
            this.metrics.ttfb = performance.timing.responseStart - performance.timing.requestStart;
            this.reportMetric('ttfb', this.metrics.ttfb);
        }
        
        // FCP (First Contentful Paint)
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
            this.metrics.fcp = fcpEntry.startTime;
            this.reportMetric('fcp', fcpEntry.startTime);
        }
    }
    
    trackResources() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.resources.push({
                        name: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        type: entry.initiatorType,
                        startTime: entry.startTime
                    });
                });
                
                // Analizar recursos pesados
                this.analyzeHeavyResources();
            });
            
            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (error) {
                console.warn('Resource tracking no disponible:', error);
            }
        }
    }
    
    monitorLongTasks() {
        if ('PerformanceObserver' in window) {
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.duration > 50) { // Tareas mayores a 50ms
                        this.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime,
                            name: entry.name || 'unknown'
                        });
                        
                        // Reportar tareas muy largas
                        if (entry.duration > 100) {
                            this.reportLongTask(entry);
                        }
                    }
                });
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.push(longTaskObserver);
            } catch (error) {
                console.warn('Long task monitoring no disponible:', error);
            }
        }
    }
    
    setupVisibilityListener() {
        let hiddenTime = 0;
        let visibilityChangeTime = 0;
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                hiddenTime = Date.now();
            } else {
                const hiddenDuration = Date.now() - hiddenTime;
                if (hiddenDuration > 10000) { // 10 segundos
                    this.reportVisibilityChange(hiddenDuration);
                }
            }
        });
    }
    
    setupNetworkListener() {
        // Monitorear cambios de conexión
        window.addEventListener('online', () => {
            this.reportNetworkChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.reportNetworkChange('offline');
        });
        
        // Medir velocidad de conexión
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection) {
                this.reportConnectionInfo(connection);
                
                connection.addEventListener('change', () => {
                    this.reportConnectionInfo(connection);
                });
            }
        }
    }
    
    collectMetrics() {
        // TTI (Time to Interactive) - estimado
        const now = performance.now();
        const domContentLoaded = performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        const loadEvent = performance.timing.loadEventEnd - performance.timing.navigationStart;
        
        this.metrics.tti = Math.max(domContentLoaded, loadEvent);
        
        // Memoria (si está disponible)
        if (performance.memory) {
            this.metrics.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Reportar métricas completas
        this.reportAllMetrics();
        
        // Optimizar después de la carga
        this.optimizeAfterLoad();
    }
    
    analyzeHeavyResources() {
        const heavyResources = this.resources.filter(r => 
            r.duration > 1000 || r.size > 500000 // >1s o >500KB
        );
        
        if (heavyResources.length > 0) {
            console.warn('Recursos pesados detectados:', heavyResources);
            
            // Reportar a analytics
            if (typeof gtag !== 'undefined') {
                gtag('event', 'heavy_resource', {
                    event_category: 'performance',
                    event_label: 'resource_load',
                    value: heavyResources.length
                });
            }
            
            // Sugerir optimizaciones
            this.suggestOptimizations(heavyResources);
        }
    }
    
    suggestOptimizations(resources) {
        const suggestions = [];
        
        resources.forEach(resource => {
            if (resource.type === 'image' && resource.size > 200000) {
                suggestions.push({
                    type: 'image',
                    url: resource.name,
                    size: UTILS.formatNumber(resource.size),
                    suggestion: 'Convertir a WebP y optimizar tamaño'
                });
            }
            
            if (resource.type === 'script' && resource.duration > 500) {
                suggestions.push({
                    type: 'script',
                    url: resource.name,
                    duration: resource.duration.toFixed(0),
                    suggestion: 'Considerar code splitting o lazy loading'
                });
            }
            
            if (resource.type === 'css' && resource.size > 50000) {
                suggestions.push({
                    type: 'css',
                    url: resource.name,
                    size: UTILS.formatNumber(resource.size),
                    suggestion: 'Minificar y purgar CSS no utilizado'
                });
            }
        });
        
        if (suggestions.length > 0) {
            console.log('Sugerencias de optimización:', suggestions);
            
            // Guardar para análisis posterior
            localStorage.setItem('yshdd-performance-suggestions', JSON.stringify(suggestions));
        }
    }
    
    reportMetric(name, value) {
        const status = this.getPerformanceStatus(value, name);
        
        console.log(`📊 ${name.toUpperCase()}: ${value.toFixed(2)}ms (${status})`);
        
        // Reportar a Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metric', {
                event_category: 'performance',
                event_label: name,
                value: Math.round(value),
                metric_status: status
            });
        }
        
        // Almacenar para análisis
        this.storeMetric(name, value, status);
    }
    
    reportAllMetrics() {
        console.group('📈 Métricas de rendimiento completas');
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key] && typeof this.metrics[key] === 'number') {
                const status = this.getPerformanceStatus(this.metrics[key], key);
                console.log(`${key}: ${this.metrics[key].toFixed(2)}ms (${status})`);
            }
        });
        console.groupEnd();
        
        // Enviar reporte consolidado
        this.sendPerformanceReport();
    }
    
    reportLongTask(task) {
        console.warn(`⚠️ Tarea larga detectada: ${task.duration.toFixed(2)}ms`);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'long_task', {
                event_category: 'performance',
                event_label: task.name,
                value: Math.round(task.duration),
                threshold_exceeded: task.duration > 100
            });
        }
    }
    
    reportVisibilityChange(duration) {
        console.log(`👁️  Usuario regresó después de ${(duration / 1000).toFixed(1)} segundos`);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'visibility_change', {
                event_category: 'user_behavior',
                event_label: 'returned',
                value: Math.round(duration / 1000)
            });
        }
    }
    
    reportNetworkChange(status) {
        console.log(`🌐 Cambio de conexión: ${status}`);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'network_change', {
                event_category: 'network',
                event_label: status
            });
        }
    }
    
    reportConnectionInfo(connection) {
        const info = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
        
        console.log('📶 Información de conexión:', info);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', 'connection_info', {
                event_category: 'network',
                event_label: connection.effectiveType,
                value: connection.downlink
            });
        }
    }
    
    sendPerformanceReport() {
        // Enviar a endpoint de analytics
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            metrics: this.metrics,
            resources: this.resources.length,
            longTasks: this.longTasks.length,
            userAgent: navigator.userAgent,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink
            } : null
        };
        
        // Enviar de forma asíncrona
        if (navigator.sendBeacon) {
            const data = new Blob([JSON.stringify(report)], { type: 'application/json' });
            navigator.sendBeacon('/api/performance', data);
        }
    }
    
    getPerformanceStatus(value, metric) {
        let threshold;
        
        switch(metric) {
            case 'fcp':
                threshold = { good: 1800, needsImprovement: 3000 };
                break;
            case 'lcp':
                threshold = { good: 2500, needsImprovement: 4000 };
                break;
            case 'fid':
                threshold = { good: 100, needsImprovement: 300 };
                break;
            case 'cls':
                threshold = { good: 0.1, needsImprovement: 0.25 };
                break;
            case 'ttfb':
                threshold = { good: 800, needsImprovement: 1800 };
                break;
            default:
                threshold = { good: 2000, needsImprovement: 4000 };
        }
        
        if (value <= threshold.good) return 'good';
        if (value <= threshold.needsImprovement) return 'needs_improvement';
        return 'poor';
    }
    
    storeMetric(name, value, status) {
        const stored = JSON.parse(localStorage.getItem('yshdd-performance-metrics') || '[]');
        stored.push({
            name,
            value,
            status,
            timestamp: new Date().toISOString()
        });
        
        // Mantener solo las últimas 100 métricas
        if (stored.length > 100) {
            stored.splice(0, stored.length - 100);
        }
        
        localStorage.setItem('yshdd-performance-metrics', JSON.stringify(stored));
    }
    
    optimizeAfterLoad() {
        // Lazy load imágenes fuera del viewport
        this.lazyLoadImages();
        
        // Preconectar a dominios importantes
        this.preconnectDomains();
        
        // Prefetch enlaces importantes
        this.prefetchImportantLinks();
        
        // Limpiar listeners innecesarios
        this.cleanupEventListeners();
    }
    
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]:not(.loaded)');
        images.forEach(img => {
            if (UTILS.isElementInViewport(img)) {
                img.src = img.dataset.src;
                img.classList.add('loaded');
            }
        });
    }
    
    preconnectDomains() {
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://www.youtube.com',
            'https://i.ytimg.com',
            CONFIG.api.baseUrl
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    prefetchImportantLinks() {
        // Prefetch secciones importantes
        const links = [
            '/#music',
            '/#videos',
            '/#contact'
        ];
        
        links.forEach(link => {
            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = link;
            document.head.appendChild(prefetch);
        });
    }
    
    cleanupEventListeners() {
        // Remover listeners de scroll innecesarios después de la carga inicial
        const scrollListeners = window._yshddScrollListeners || [];
        scrollListeners.forEach(listener => {
            window.removeEventListener('scroll', listener);
        });
        window._yshddScrollListeners = [];
    }
    
    // Métodos públicos
    getMetrics() {
        return { ...this.metrics };
    }
    
    getResources() {
        return [...this.resources];
    }
    
    getLongTasks() {
        return [...this.longTasks];
    }
    
    getSuggestions() {
        return JSON.parse(localStorage.getItem('yshdd-performance-suggestions') || '[]');
    }
    
    clearData() {
        localStorage.removeItem('yshdd-performance-metrics');
        localStorage.removeItem('yshdd-performance-suggestions');
        this.metrics = {};
        this.resources = [];
        this.longTasks = [];
    }
    
    // Destructor
    destroy() {
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('Error desconectando observer:', error);
            }
        });
        this.observers = [];
    }
}

// Singleton global
let performanceMonitorInstance = null;

export function getPerformanceMonitor() {
    if (!performanceMonitorInstance) {
        performanceMonitorInstance = new PerformanceMonitor();
    }
    return performanceMonitorInstance;
}

// Inicialización global
document.addEventListener('DOMContentLoaded', () => {
    // Solo en producción
    if (window.location.hostname !== 'localhost') {
        window.YSHDDPerformance = getPerformanceMonitor();
    }
});
