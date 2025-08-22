class EmailService {
  constructor() {
    this.apiBaseUrl = 'https://api.yshdd.com/email';
    this.endpoints = {
      contact: '/contact',
      newsletter: '/newsletter',
      booking: '/booking'
    };
  }

  async send(data, endpoint) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en EmailService:', error);
      throw error;
    }
  }

  getAuthToken() {
    // Implementar lógica para obtener token de autenticación
    return localStorage.getItem('yshdd_email_token') || 'public_token';
  }

  async sendContactForm(formData) {
    return this.send(formData, this.endpoints.contact);
  }

  async subscribeToNewsletter(email) {
    return this.send({ email }, this.endpoints.newsletter);
  }

  async sendBookingRequest(bookingData) {
    return this.send(bookingData, this.endpoints.booking);
  }
}

// Función para mostrar mensajes en formularios
function showFormMessage(message, type) {
  const messageElement = document.createElement('div');
  messageElement.className = `form-message ${type}`;
  messageElement.innerHTML = `
    <i class="bx ${type === 'success' ? 'bx-check-circle' : 'bx-error'}"></i>
    <span>${message}</span>
  `;
  
  const existingMessage = document.querySelector('.form-message');
  if (existingMessage) existingMessage.remove();
  
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.insertBefore(messageElement, contactForm.firstChild);
    
    setTimeout(() => {
      messageElement.style.opacity = '0';
      setTimeout(() => messageElement.remove(), 300);
    }, 5000);
  }
}

// Integración con el formulario de contacto
document.addEventListener('DOMContentLoaded', () => {
  const emailService = new EmailService();
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value,
        timestamp: new Date().toISOString()
      };

      const submitBtn = contactForm.querySelector('.submit-btn');
      const originalText = submitBtn.innerHTML;
      
      try {
        submitBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Enviando...';
        submitBtn.disabled = true;
        
        await emailService.sendContactForm(formData);
        showFormMessage('¡Mensaje enviado con éxito!', 'success');
        contactForm.reset();
      } catch (error) {
        showFormMessage('Error al enviar el mensaje. Por favor intenta nuevamente.', 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
  
  window.yshddEmailService = emailService;
});