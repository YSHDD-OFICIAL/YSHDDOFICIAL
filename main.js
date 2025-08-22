// Importar todos los módulos necesarios
import './notificacion.js';
import './actualizacion.js';
import './Email.js';

// Inicialización global del sitio
document.addEventListener('DOMContentLoaded', function() {
  console.log('EPK YSHDD - Todos los módulos cargados');
  
  // Verificar si es la primera visita
  if (!localStorage.getItem('yshdd_firstVisit')) {
    localStorage.setItem('yshdd_firstVisit', new Date().toISOString());
    console.log('Primera visita registrada');
  }
  
  // Inicializar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado:', reg.scope))
      .catch(err => console.error('Error registrando SW:', err));
  }
});