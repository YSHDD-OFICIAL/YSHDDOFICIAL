// Configuración mejorada de Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){ dataLayer.push(arguments); }
gtag('js', new Date());

// ID de seguimiento (reemplazar con el real)
gtag('config', 'G-XXXXXXXXXX', {
  page_title: document.title,
  page_path: window.location.pathname,
  user_id: localStorage.getItem('yshdd_userId') || 'anonymous'
});

// Generar ID de usuario único si no existe
if (!localStorage.getItem('yshdd_userId')) {
  localStorage.setItem('yshdd_userId', 'user_' + Math.random().toString(36).substr(2, 9));
}

// Trackear eventos personalizados
function trackEvent(category, action, label, value) {
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
}

// Trackear páginas virtuales para SPA
function trackPageView(pageTitle, pagePath) {
  gtag('config', 'G-XXXXXXXXXX', {
    page_title: pageTitle,
    page_path: pagePath
  });
}

// Trackear interacciones importantes
document.addEventListener('DOMContentLoaded', function() {
  // Trackear clicks en enlaces de streaming
  document.querySelectorAll('.stream-button, .platform').forEach(link => {
    link.addEventListener('click', function() {
      const platform = this.querySelector('span')?.textContent || 'Desconocido';
      trackEvent('Streaming', 'Click', platform);
    });
  });

  // Trackear redes sociales
  document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('click', function() {
      const social = this.querySelector('i')?.className.replace('bx bxl-', '') || 'unknown';
      trackEvent('Redes Sociales', 'Click', social);
    });
  });

  // Trackear formulario de contacto
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function() {
      trackEvent('Contacto', 'Formulario Enviado', 'Contacto');
    });
  }
});

// Trackear cambios de sección (para SPA-like behavior)
const observer = new MutationObserver(function() {
  trackPageView(document.title, window.location.pathname + window.location.hash);
});

observer.observe(document, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true
});