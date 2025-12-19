// ====== LOADER ======
function initLoader() {
  const loader = document.querySelector('.loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
        document.body.style.overflow = 'auto';
      }, 500);
    }, 1500);
  }
}

// ====== MENÚ MÓVIL ======
function initMobileMenu() {
  const menuBtn = document.querySelector('.menu-btn');
  const menu = document.getElementById('menu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      menu.classList.toggle('show');
      document.body.style.overflow = menu.classList.contains('show') ? 'hidden' : 'auto';
      menuBtn.innerHTML = menu.classList.contains('show') ? '<i class="bx bx-x"></i>' : '<i class="bx bx-menu"></i>';
    });
    
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        if (menu.classList.contains('show')) {
          menu.classList.remove('show');
          document.body.style.overflow = 'auto';
          menuBtn.innerHTML = '<i class="bx bx-menu"></i>';
          menuBtn.setAttribute('aria-expanded', 'false');
        }
        
        navLinks.forEach(item => item.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }
}

// ====== HEADER SCROLL EFFECT ======
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (header) {
    window.addEventListener('scroll', function() {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }
}

// ====== SCROLL REVEAL ANIMATION ======
function initScrollReveal() {
  const scrollRevealElements = document.querySelectorAll('.scroll-reveal');
  
  function checkScroll() {
    scrollRevealElements.forEach((element, index) => {
      const elementTop = element.getBoundingClientRect().top;
      if (elementTop < window.innerHeight - 100) {
        element.classList.add('visible');
        element.style.transitionDelay = `${index * 0.1}s`;
      }
    });
    
    const backToTop = document.querySelector('.back-to-top');
    if (backToTop) {
      backToTop.classList.toggle('show', window.scrollY > 500);
    }
  }
  
  checkScroll();
  window.addEventListener('scroll', checkScroll);
}

// ====== BOTÓN VOLVER ARRIBA ======
function initBackToTop() {
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ inset-block-start: 0, behavior: 'smooth' });
    });
  }
}

// ====== VIDEO MODAL ======
function initVideoModal() {
  const videoItems = document.querySelectorAll('.video-item');
  const videoModal = document.getElementById('video-modal');
  const videoIframe = document.getElementById('video-iframe');
  const closeModal = document.querySelector('.close-modal');
  
  if (videoItems.length && videoModal && videoIframe && closeModal) {
    videoItems.forEach(item => {
      item.addEventListener('click', function() {
        const videoUrl = this.querySelector('.video-thumbnail').getAttribute('data-video');
        videoIframe.src = videoUrl;
        videoModal.classList.add('show');
        videoModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    });
    
    closeModal.addEventListener('click', function() {
      videoModal.classList.remove('show');
      videoModal.setAttribute('aria-hidden', 'true');
      videoIframe.src = '';
      document.body.style.overflow = 'auto';
    });
    
    videoModal.addEventListener('click', function(e) {
      if (e.target === videoModal) {
        videoModal.classList.remove('show');
        videoModal.setAttribute('aria-hidden', 'true');
        videoIframe.src = '';
        document.body.style.overflow = 'auto';
      }
    });
  }
}

// ====== BIOGRAFÍA EXPANDIBLE ======
function initExpandableBio() {
  const toggleBioBtn = document.getElementById('toggle-bio');
  const moreBio = document.getElementById('more-bio');
  
  if (toggleBioBtn && moreBio) {
    toggleBioBtn.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      moreBio.classList.toggle('show');
      
      if (moreBio.classList.contains('show')) {
        this.innerHTML = 'Leer menos <i class="bx bx-chevron-up"></i>';
      } else {
        this.innerHTML = 'Leer más <i class="bx bx-chevron-down"></i>';
      }
    });
  }
}

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', function() {
  initLoader();
  initMobileMenu();
  initHeaderScroll();
  initScrollReveal();
  initBackToTop();
  initVideoModal();
  initExpandableBio();
});