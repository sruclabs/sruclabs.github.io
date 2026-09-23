/* ==========================================================================
   SRUC LABS — Main Script
   ========================================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     1. MOBILE MENU
     ---------------------------------------------------------------------- */

  var menuToggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.site-nav');

  function openMenu() {
    nav.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.textContent = 'Close';
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.textContent = 'Menu';
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('is-open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close on nav link click
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    // Close when clicking outside the nav
    document.addEventListener('click', function (e) {
      if (
        nav.classList.contains('is-open') &&
        !nav.contains(e.target) &&
        !menuToggle.contains(e.target)
      ) {
        closeMenu();
      }
    });
  }

  /* ----------------------------------------------------------------------
     2. YEAR
     ---------------------------------------------------------------------- */

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------------------
     3. SMOOTH SCROLL WITH HEADER OFFSET
     ---------------------------------------------------------------------- */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var header = document.querySelector('.site-header');
      var offset = header ? header.offsetHeight + 24 : 96;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: top,
        behavior: 'smooth'
      });

      // Update URL without jump
      history.pushState(null, '', targetId);
    });
  });

  /* ----------------------------------------------------------------------
     4. INTERSECTION OBSERVER — Reveal on Scroll
     ---------------------------------------------------------------------- */

  var revealItems = document.querySelectorAll('.reveal');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (prefersReducedMotion.matches) {
    // If reduced motion, show everything immediately
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  } else if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    // Fallback: show everything
    revealItems.forEach(function (item) {
      item.classList.add('is-visible');
    });
  }

})();
