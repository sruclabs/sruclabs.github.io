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
     3. RITUAL FIELD — Synchronized process indicator
     ---------------------------------------------------------------------- */

  var ritualField = document.querySelector('.ritual-field');
  var ritualPhases = ritualField
    ? Array.prototype.slice.call(ritualField.querySelectorAll('[data-phase]'))
    : [];

  if (ritualPhases.length) {
    var ritualPhase = 0;
    var ritualTimer = null;
    var showRitualPhase = function (phase) {
      ritualPhases.forEach(function (item, index) {
        item.classList.toggle('is-current', index === phase);
      });
    };

    var startRitual = function () {
      if (ritualTimer) return;
      showRitualPhase(0);
      ritualTimer = window.setInterval(function () {
        ritualPhase = (ritualPhase + 1) % ritualPhases.length;
        showRitualPhase(ritualPhase);
      }, 3000);
    };

    showRitualPhase(ritualPhase);

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if ('IntersectionObserver' in window) {
        var ritualObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              startRitual();
              observer.disconnect();
            }
          });
        }, { threshold: 0.25 });
        ritualObserver.observe(ritualField);
      } else {
        startRitual();
      }
    }
  }

  /* ----------------------------------------------------------------------
     4. SMOOTH SCROLL WITH HEADER OFFSET
     ---------------------------------------------------------------------- */

  // About and Contact are visible navigation placeholders until their pages
  // exist. Prevent the temporary '#' href from scrolling to the page top.
  document.querySelectorAll('.nav-placeholder').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      // The header scrolls with the document, so subtracting its height here
      // would move the destination too far above the viewport.
      var offset = 24;
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
