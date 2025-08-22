class SecurityManager {
  constructor() {
    this.initCSP();
    this.initXSSProtection();
    this.initClickjackingProtection();
    this.initFormValidation();
    this.initCopyProtection();
  }

  initCSP() {
    document.addEventListener('securitypolicyviolation', (e) => {
      const report = {
        violatedDirective: e.violatedDirective,
        blockedURI: e.blockedURI,
        originalPolicy: e.originalPolicy,
        referrer: e.referrer,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        columnNumber: e.columnNumber
      };
      
      this.sendCSPReport(report);
    });
  }

  sendCSPReport(report) {
    fetch('/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    }).catch(err => console.error('Error enviando CSP report:', err));
  }

  initXSSProtection() {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
          input.value = this.sanitizeInput(input.value);
        });
      });
    });
  }

  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  initClickjackingProtection() {
    if (self !== top) {
      top.location = self.location;
    }
  }

  initFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;
        
        inputs.forEach(input => {
          if (input.required && !input.value.trim()) {
            input.style.borderColor = 'var(--color-error)';
            isValid = false;
          }
        });
        
        if (!isValid) {
          e.preventDefault();
          this.showFormError('Por favor completa todos los campos requeridos.');
        }
      });
    });
  }

  showFormError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'form-error-message';
    errorElement.textContent = message;
    
    const existingError = document.querySelector('.form-error-message');
    if (existingError) existingError.remove();
    
    document.body.appendChild(errorElement);
    setTimeout(() => errorElement.remove(), 5000);
  }

  initCopyProtection() {
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection();
      if (selection.toString().length > 100) {
        e.preventDefault();
        this.showCopyWarning();
      }
    });
  }

  showCopyWarning() {
    const warning = document.createElement('div');
    warning.className = 'copy-warning';
    warning.innerHTML = `
      <p>El contenido está protegido. Para uso extenso, por favor contacta a <a href="mailto:yshddoficial@gmail.com">yshddoficial@gmail.com</a></p>
    `;
    
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 5000);
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const securityManager = new SecurityManager();
  window.yshddSecurity = securityManager;
});