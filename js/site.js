// Progressive enhancement: navigation, contact links and photo originals also work without JS.
const menu = document.querySelector('.mobile-menu');
if (menu) {
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) menu.open = false;
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary').focus();
    }
  });
}

for (const dialog of document.querySelectorAll('dialog')) {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
}

const galleryDialog = document.querySelector('#gallery-dialog');
if (galleryDialog && typeof galleryDialog.showModal === 'function') {
  const photo = document.querySelector('#gallery-image');
  const placeholder = photo.src;
  const caption = document.querySelector('#gallery-caption');
  const original = document.querySelector('#gallery-original');
  const counter = document.querySelector('#gallery-count');
  const error = document.querySelector('#gallery-error');
  let group = [];
  let position = 0;
  function showPhoto(index) {
    position = (index + group.length) % group.length;
    const link = group[position];
    const thumbnail = link.querySelector('img');
    error.hidden = true;
    photo.alt = thumbnail.alt;
    photo.width = Number(link.dataset.width);
    photo.height = Number(link.dataset.height);
    photo.sizes = '(max-width: 760px) calc(100vw - 48px), (max-width: 1280px) 88vw, 1200px';
    photo.srcset = link.dataset.srcset;
    photo.src = link.dataset.large;
    caption.textContent = thumbnail.alt;
    original.href = link.href;
    counter.textContent = `${position + 1} / ${group.length}`;
  }
  photo.addEventListener('error', () => { error.hidden = false; });
  for (const link of document.querySelectorAll('[data-gallery]')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      group = [...document.querySelectorAll('[data-gallery]')].filter(item => item.dataset.gallery === link.dataset.gallery);
      galleryDialog.showModal();
      document.body.classList.add('dialog-open');
      showPhoto(group.indexOf(link));
    });
  }
  document.querySelector('#gallery-prev').addEventListener('click', () => showPhoto(position - 1));
  document.querySelector('#gallery-next').addEventListener('click', () => showPhoto(position + 1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      showPhoto(position + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  galleryDialog.addEventListener('close', () => {
    photo.removeAttribute('srcset');
    photo.src = placeholder;
  });
}

const heroVideo = document.querySelector('.hero-background-video');
if (heroVideo && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData) {
  const startHeroVideo = () => {
    if (!heroVideo.hasAttribute('src')) {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.load();
    }
    heroVideo.play().catch(() => { /* The poster remains as a still-image fallback. */ });
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      startHeroVideo();
    }, { rootMargin: '200px' });
    observer.observe(heroVideo);
  } else {
    startHeroVideo();
  }
}
