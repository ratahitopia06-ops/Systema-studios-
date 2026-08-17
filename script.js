document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.site-nav');
  const form = document.querySelector('#quote-form');
  const formStatus = document.querySelector('#form-status');
  const serviceSelect = document.querySelector('#service');
  const submitButton = form?.querySelector('button[type="submit"]');

  const setHeaderState = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 18);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    menuButton.querySelector('.sr-only').textContent = 'Open menu';
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.classList.toggle('is-open', !isOpen);
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('is-open', !isOpen);
    menuButton.querySelector('.sr-only').textContent = isOpen ? 'Open menu' : 'Close menu';
  });

  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.querySelectorAll('a[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      if (serviceSelect) serviceSelect.value = link.dataset.service || '';
    });
  });

  const revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((target) => observer.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  document.querySelector('#year').textContent = new Date().getFullYear();

  const setStatus = (message, type = '') => {
    if (!formStatus) return;
    formStatus.className = `form-status ${type}`.trim();
    formStatus.textContent = message;
  };

  const validateForm = () => {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach((field) => {
      const hasValue = field.value.trim().length > 0;
      const meetsLength = !field.minLength || field.value.trim().length >= field.minLength;
      const validEmail = field.type !== 'email' || !field.value || field.validity.valid;
      const fieldIsValid = hasValue && meetsLength && validEmail;
      field.classList.toggle('invalid', !fieldIsValid);
      if (!fieldIsValid) isValid = false;
    });

    return isValid;
  };

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setStatus('');

    if (!validateForm()) {
      setStatus('Please complete the highlighted fields so we can get back to you.', 'error');
      form.querySelector('.invalid')?.focus();
      return;
    }

    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending the Force…';

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Your request could not be sent right now.');

      form.reset();
      setStatus('Request received. We will be in touch to talk through the job and arrange a site visit.', 'success');
    } catch (error) {
      setStatus(error.message || 'Your request could not be sent right now. Please try again.', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
});
