// Versión mejorada del sistema de actualización
class UpdateManager {
    constructor() {
        this.updateAvailable = false;
        this.updateNotification = null;
        this.registration = null;
        this.init();
    }

    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker no es compatible en este navegador');
            return;
        }
        
        try {
            // Esperar a que el Service Worker esté listo
            this.registration = await navigator.serviceWorker.ready;
            this.setupUpdateListener();
            this.checkForUpdates();
            
            // Verificar actualizaciones cada hora
            setInterval(() => this.checkForUpdates(), 60 * 60 * 1000);
        } catch (error) {
            console.error('Error inicializando UpdateManager:', error);
        }
    }

    setupUpdateListener() {
        // Escuchar cuando se encuentra una actualización
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                // Cuando el nuevo Service Worker esté instalado y haya un controlador activo
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.handleUpdateAvailable();
                }
            });
        });

        // También escuchar el evento controllerchange para detectar cambios
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Controller changed - page will refresh');
            window.location.reload();
        });
    }

    async checkForUpdates() {
        try {
            await this.registration.update();
            console.log('Verificación de actualizaciones completada');
        } catch (err) {
            console.error('Error al verificar actualizaciones:', err);
        }
    }

    handleUpdateAvailable() {
        if (this.updateAvailable) return;
        
        this.updateAvailable = true;
        this.showUpdateNotification();
    }

    showUpdateNotification() {
        if (this.updateNotification) return;
        
        // Crear elemento de notificación
        this.updateNotification = document.createElement('div');
        this.updateNotification.className = 'update-notification';
        this.updateNotification.innerHTML = `
            <div class="update-content">
                <p>¡Nueva versión disponible!</p>
                <div class="update-buttons">
                    <button id="reload-btn" class="update-btn primary">Actualizar Ahora</button>
                    <button id="dismiss-btn" class="update-btn secondary">Más Tarde</button>
                </div>
            </div>
        `;
        
        // Aplicar estilos
        this.updateNotification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            z-index: 10000;
            border-left: 4px solid #ffdd57;
            max-width: 300px;
        `;
        
        this.updateNotification.querySelector('.update-content p').style.cssText = `
            margin: 0 0 12px 0;
            font-weight: 600;
        `;
        
        this.updateNotification.querySelector('.update-buttons').style.cssText = `
            display: flex;
            gap: 10px;
        `;
        
        const buttons = this.updateNotification.querySelectorAll('.update-btn');
        buttons.forEach(btn => {
            btn.style.cssText = `
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s ease;
            `;
        });
        
        this.updateNotification.querySelector('.primary').style.cssText = `
            background: #ffdd57;
            color: #222;
        `;
        
        this.updateNotification.querySelector('.secondary').style.cssText = `
            background: transparent;
            color: #fff;
            border: 1px solid #666;
        `;
        
        // Añadir al DOM
        document.body.appendChild(this.updateNotification);
        
        // Configurar event listeners
        document.getElementById('reload-btn').addEventListener('click', () => {
            this.updateNotification.remove();
            this.updateNotification = null;
            window.location.reload();
        });
        
        document.getElementById('dismiss-btn').addEventListener('click', () => {
            this.updateNotification.remove();
            this.updateNotification = null;
            this.updateAvailable = false;
        });
        
        // Auto-ocultar después de 30 segundos
        setTimeout(() => {
            if (this.updateNotification) {
                this.updateNotification.remove();
                this.updateNotification = null;
                this.updateAvailable = false;
            }
        }, 30000);
    }
}

// Inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUpdateManager);
} else {
    initUpdateManager();
}

function initUpdateManager() {
    if ('serviceWorker' in navigator) {
        const updateManager = new UpdateManager();
        window.yshddUpdateManager = updateManager;
    }
}