// assets/js/notifications.js

import { CONFIG, UTILS } from './config.js';

export class NotificationManager {
    constructor() {
        this.permission = null;
        this.notificationQueue = [];
        this.isProcessing = false;
        this.supported = 'Notification' in window;
        this.serviceWorkerRegistration = null;
        this.vapidPublicKey = CONFIG.api.keys.vapid;
        
        this.defaultOptions = {
            icon: '/assets/images/favicon-192x192.png',
            badge: '/assets/images/badge-72x72.png',
            vibrate: [100, 50, 100],
            requireInteraction: false,
            silent: false,
            tag: 'yshdd-notification'
        };
    }
    
    async init() {
        console.log('🔔 Inicializando sistema de notificaciones...');
        
        // Verificar soporte
        if (!this.supported) {
            console.warn('Notificaciones no soportadas en este navegador');
            return false;
        }
        
        // Obtener permiso actual
        this.permission = Notification.permission;
        
        // Registrar Service Worker para push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            await this.registerServiceWorker();
        }
        
        // Configurar botón de permisos si es necesario
        this.setupPermissionButton();
        
        console.log('✅ Sistema de notificaciones inicializado');
        return true;
    }
    
    async registerServiceWorker() {
        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
            console.log('Service Worker registrado para notificaciones');
            
            // Suscribirse a push notifications
            if (this.permission === 'granted') {
                await this.subscribeToPush();
            }
            
        } catch (error) {
            console.error('Error registrando Service Worker:', error);
        }
    }
    
    async subscribeToPush() {
        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
            });
            
            // Enviar suscripción al servidor
            await this.sendSubscriptionToServer(subscription);
            
            console.log('Suscripción a push notifications activada');
            return subscription;
            
        } catch (error) {
            console.error('Error suscribiéndose a push:', error);
            return null;
        }
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/save-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            });
            
            if (!response.ok) throw new Error('Error guardando suscripción');
            return await response.json();
            
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
    
    async requestPermission() {
        if (!this.supported) return 'denied';
        
        try {
            this.permission = await Notification.requestPermission();
            
            // Si se otorga permiso, suscribirse a push
            if (this.permission === 'granted' && this.serviceWorkerRegistration) {
                await this.subscribeToPush();
            }
            
            // Actualizar UI
            this.updatePermissionUI();
            
            return this.permission;
            
        } catch (error) {
            console.error('Error solicitando permiso:', error);
            return 'denied';
        }
    }
    
    setupPermissionButton() {
        // Crear botón si no existe
        let button = document.getElementById('notification-permission-btn');
        
        if (!button && this.permission === 'default') {
            button = document.createElement('button');
            button.id = 'notification-permission-btn';
            button.className = 'notification-permission-btn';
            button.innerHTML = `
                <i class='bx bx-bell'></i>
                <span>Activar notificaciones</span>
            `;
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: var(--color-primary);
                color: var(--color-secondary);
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 9998;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideInLeft 0.3s ease;
            `;
            
            button.addEventListener('click', () => this.requestPermission());
            document.body.appendChild(button);
        }
    }
    
    updatePermissionUI() {
        const button = document.getElementById('notification-permission-btn');
        
        if (button) {
            if (this.permission === 'granted') {
                button.innerHTML = `
                    <i class='bx bx-bell-ring'></i>
                    <span>Notificaciones activadas</span>
                `;
                button.style.background = 'var(--color-success)';
                button.style.color = 'white';
                
                // Ocultar después de 3 segundos
                setTimeout(() => {
                    button.style.animation = 'slideOutLeft 0.3s ease';
                    setTimeout(() => button.remove(), 300);
                }, 3000);
                
            } else if (this.permission === 'denied') {
                button.innerHTML = `
                    <i class='bx bx-bell-off'></i>
                    <span>Notificaciones bloqueadas</span>
                `;
                button.style.background = 'var(--color-error)';
                button.style.color = 'white';
            }
        }
    }
    
    async show(title, options = {}) {
        // Si no hay soporte, mostrar en consola
        if (!this.supported) {
            console.log(`[Notification] ${title}: ${options.body || ''}`);
            return null;
        }
        
        // Si no hay permiso, usar notificaciones en pantalla
        if (this.permission !== 'granted') {
            return this.showInApp(title, options);
        }
    
        // Usar Service Worker si está disponible
        if (this.serviceWorkerRegistration) {
            return this.showViaServiceWorker(title, options);
        } else {
            // Usar Notification API directamente
            return this.showViaAPI(title, options);
        }
    }
    
    async showViaServiceWorker(title, options) {
        try {
            const mergedOptions = {
                ...this.defaultOptions,
                ...options,
                data: {
                    timestamp: Date.now(),
                    ...options.data
                }
            };
            
            await this.serviceWorkerRegistration.showNotification(title, mergedOptions);
            
            // Track event
            this.trackNotificationEvent('push', title);
            
        } catch (error) {
            console.error('Error mostrando notificación via Service Worker:', error);
            // Fallback a notificación en pantalla
            this.showInApp(title, options);
        }
    }
    
    async showViaAPI(title, options) {
        try {
            const mergedOptions = {
                ...this.defaultOptions,
                ...options
            };
            
            const notification = new Notification(title, mergedOptions);
            
            // Manejar clic
            notification.onclick = (event) => {
                event.preventDefault();
                this.handleNotificationClick(options.data);
                notification.close();
            };
            
            // Auto-cerrar después de 10 segundos
            setTimeout(() => notification.close(), 10000);
            
            // Track event
            this.trackNotificationEvent('api', title);
            
            return notification;
            
        } catch (error) {
            console.error('Error mostrando notificación via API:', error);
            // Fallback a notificación en pantalla
            this.showInApp(title, options);
        }
    }
    
    showInApp(title, options) {
        // Crear notificación en pantalla
        const notification = this.createInAppNotification(title, options);
        
        // Agregar a la cola
        this.notificationQueue.push(notification);
        
        // Procesar cola
        if (!this.isProcessing) {
            this.processQueue();
        }
        
        // Track event
        this.trackNotificationEvent('inapp', title);
        
        return notification;
    }
    
    createInAppNotification(title, options) {
        const id = UTILS.generateId('notification-');
        const type = options.type || 'info';
        
        // Iconos por tipo
        const icons = {
            success: 'bx-check-circle',
            error: 'bx-error-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };
        
        const icon = icons[type] || 'bx-info-circle';
        
        // Crear elemento
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `inapp-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class='bx ${icon}'></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                ${options.body ? `<div class="notification-body">${options.body}</div>` : ''}
            </div>
            <button class="notification-close">
                <i class='bx bx-x'></i>
            </button>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--color-bg);
            border-left: 4px solid var(--color-${type});
            color: var(--color-text);
            padding: 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            max-width: 400px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            transform: translateX(100%);
            opacity: 0;
        `;
        
        // Estilos específicos por tipo
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        
        notification.style.borderLeftColor = colors[type] || colors.info;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Configurar eventos
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.removeInAppNotification(notification));
        
        // Auto-remover después de 5 segundos
        const autoRemove = setTimeout(() => {
            this.removeInAppNotification(notification);
        }, 5000);
        
        // Pausar auto-remove al hacer hover
        notification.addEventListener('mouseenter', () => {
            clearTimeout(autoRemove);
        });
        
        notification.addEventListener('mouseleave', () => {
            setTimeout(() => {
                this.removeInAppNotification(notification);
            }, 5000);
        });
        
        // Manejar clic en la notificación
        notification.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                if (options.onClick) {
                    options.onClick();
                }
                this.removeInAppNotification(notification);
            }
        });
        
        return {
            element: notification,
            id: id,
            type: type,
            timestamp: Date.now()
        };
    }
    
    removeInAppNotification(notification) {
        if (!notification || !notification.element) return;
        
        notification.element.style.animation = 'slideOutRight 0.3s ease';
        notification.element.style.transform = 'translateX(100%)';
        notification.element.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.remove();
            }
            
            // Remover de la cola
            this.notificationQueue = this.notificationQueue.filter(n => n.id !== notification.id);
            
            // Procesar siguiente
            this.isProcessing = false;
            this.processQueue();
        }, 300);
    }
    
    processQueue() {
        if (this.notificationQueue.length === 0 || this.isProcessing) return;
        
        this.isProcessing = true;
        const notification = this.notificationQueue[0];
        
        // Mostrar la primera notificación
        setTimeout(() => {
            this.removeInAppNotification(notification);
        }, 5000);
    }
    
    handleNotificationClick(data) {
        if (!data) return;
        
        // Manejar acciones según los datos
        if (data.url) {
            window.open(data.url, '_blank');
        }
        
        if (data.action) {
            switch(data.action) {
                case 'play':
                    if (window.YSHDDPlayer) {
                        window.YSHDDPlayer.play();
                    }
                    break;
                case 'download':
                    if (data.fileUrl) {
                        UTILS.downloadFile(data.fileUrl, data.fileName);
                    }
                    break;
                case 'navigate':
                    if (data.section) {
                        const element = document.querySelector(data.section);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }
                    break;
            }
        }
        
        // Track click
        if (typeof gtag !== 'undefined') {
            gtag('event', 'notification_click', {
                event_category: 'notifications',
                event_label: data.action || 'unknown',
                value: data.timestamp
            });
        }
    }
    
    trackNotificationEvent(method, title) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'notification_shown', {
                event_category: 'notifications',
                event_label: title,
                method: method
            });
        }
    }
    
    // Métodos utilitarios
    showSuccess(message, options = {}) {
        return this.show('¡Éxito!', {
            body: message,
            type: 'success',
            ...options
        });
    }
    
    showError(message, options = {}) {
        return this.show('Error', {
            body: message,
            type: 'error',
            ...options
        });
    }
    
    showWarning(message, options = {}) {
        return this.show('Advertencia', {
            body: message,
            type: 'warning',
            ...options
        });
    }
    
    showInfo(message, options = {}) {
        return this.show('Información', {
            body: message,
            type: 'info',
            ...options
        });
    }
    
    // Limpiar todas las notificaciones
    clearAll() {
        // Limpiar notificaciones push
        if (this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration.getNotifications().then(notifications => {
                notifications.forEach(notification => notification.close());
            });
        }
        
        // Limpiar notificaciones en pantalla
        document.querySelectorAll('.inapp-notification').forEach(notification => {
            notification.remove();
        });
        
        this.notificationQueue = [];
        this.isProcessing = false;
    }
    
    // Obtener estadísticas
    getStats() {
        return {
            supported: this.supported,
            permission: this.permission,
            pushEnabled: !!this.serviceWorkerRegistration,
            queueLength: this.notificationQueue.length
        };
    }
}

// Exportar singleton global
let notificationManagerInstance = null;

export function getNotificationManager() {
    if (!notificationManagerInstance) {
        notificationManagerInstance = new NotificationManager();
    }
    return notificationManagerInstance;
}

// Inicialización global
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const manager = getNotificationManager();
        await manager.init();
        window.YSHDDNotifications = manager;
    } catch (error) {
        console.error('Error inicializando notificaciones:', error);
    }
});
