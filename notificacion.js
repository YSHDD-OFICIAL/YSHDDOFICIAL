class NotificationManager {
  constructor() {
    this.VAPID_PUBLIC_KEY = 'TU_CLAVE_PUBLICA_VAPID';
    this.notificationPermission = null;
    this.init();
  }

  async init() {
    this.notificationPermission = Notification.permission;
    await this.checkPermission();
    await this.registerServiceWorker();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (this.notificationPermission === 'default') {
      this.notificationPermission = await Notification.requestPermission();
    }

    return this.notificationPermission === 'granted';
  }

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (!('PushManager' in window)) return;

      if (this.notificationPermission === 'granted') {
        await this.subscribeToPush(registration);
      }
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }

  async subscribeToPush(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });

      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Error al subscribirse:', error);
      return null;
    }
  }

  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) throw new Error('Error al guardar subscripción');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      throw error;
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

  async showLocalNotification(title, options) {
    if (!await this.checkPermission()) return;

    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, options);
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const notificationManager = new NotificationManager();
  
  // Botón para activar notificaciones
  const notificationBtn = document.createElement('button');
  notificationBtn.className = 'notification-btn';
  notificationBtn.textContent = 'Activar Notificaciones';
  notificationBtn.style.display = 'none';
  
  notificationBtn.addEventListener('click', async () => {
    if (await notificationManager.checkPermission()) {
      notificationBtn.style.display = 'none';
    }
  });

  // Mostrar botón si no hay permiso
  if (Notification.permission !== 'granted') {
    notificationBtn.style.display = 'block';
    document.body.appendChild(notificationBtn);
  }

  // Exponer para uso global si es necesario
  window.yshddNotifications = notificationManager;
});