const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.textContent = open ? 'Close' : 'Menu';
  });
}
document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('is-open');
  if (menuToggle) { menuToggle.setAttribute('aria-expanded', 'false'); menuToggle.textContent = 'Menu'; }
}));
document.querySelector('#year').textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
