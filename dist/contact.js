(() => {
  'use strict';

  const dialog = document.getElementById('contact-dialog');
  const closeButton = dialog.querySelector('.contact-close');
  const copyButton = dialog.querySelector('.contact-copy');
  const status = dialog.querySelector('.contact-status');
  const phone = dialog.querySelector('.contact-phone');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let trigger = null;
  let savedScroll = null;
  let closeTimer = null;
  let opening = 0;
  let copying = false;
  let backdropStarted = false;

  function openContact(button) {
    if (dialog.open) return;
    trigger = button;
    opening++;
    copying = false;
    status.textContent = '';
    copyButton.disabled = false;
    const root = document.documentElement;
    savedScroll = {
      x: window.scrollX,
      y: window.scrollY,
      overflow: root.style.overflow,
      padding: document.body.style.paddingRight
    };
    const scrollbar = window.innerWidth - root.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight);
    root.style.overflow = 'hidden';
    document.body.style.paddingRight = padding + scrollbar + 'px';
    dialog.showModal();
    phone.focus({preventScroll: true});
  }

  function closeContact() {
    if (!dialog.open || closeTimer !== null) return;
    if (motion.matches) {
      dialog.close();
      return;
    }
    dialog.classList.add('is-closing');
    closeTimer = window.setTimeout(() => dialog.close(), 160);
  }

  document.querySelectorAll('[data-contact]').forEach(button => {
    button.addEventListener('click', () => openContact(button));
  });
  closeButton.addEventListener('click', closeContact);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeContact();
  });
  function outsideContent(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  }
  dialog.addEventListener('pointerdown', event => {
    backdropStarted = event.target === dialog && outsideContent(event);
  });
  dialog.addEventListener('click', event => {
    if (backdropStarted && event.target === dialog && outsideContent(event)) closeContact();
    backdropStarted = false;
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.querySelectorAll('a[href], button:not(:disabled)'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    closeTimer = null;
    opening++;
    dialog.classList.remove('is-closing');
    if (savedScroll) {
      document.documentElement.style.overflow = savedScroll.overflow;
      document.body.style.paddingRight = savedScroll.padding;
      window.scrollTo({left: savedScroll.x, top: savedScroll.y, behavior: 'instant'});
      savedScroll = null;
    }
    trigger?.focus({preventScroll: true});
  });
  copyButton.addEventListener('click', async () => {
    if (copying) return;
    copying = true;
    const currentOpening = opening;
    status.textContent = '';
    try {
      await navigator.clipboard.writeText(phone.getAttribute('href').slice(4));
      if (dialog.open && opening === currentOpening) status.textContent = 'Номер скопирован';
    } catch {
      if (dialog.open && opening === currentOpening) {
        status.textContent = 'Не удалось скопировать. Выделите номер телефона и скопируйте вручную.';
      }
    } finally {
      if (opening === currentOpening) copying = false;
    }
  });
})();
