/* Sruc Labs — interactions. Plain JS, no dependencies. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 0. Theme (dark / light) — initial value set inline in <head> */
  var root = document.documentElement;
  var themeToggle = document.getElementById('theme-toggle');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem('sruc-theme', t); } catch (err) { /* ignore */ }
    if (themeMeta) themeMeta.setAttribute('content', t === 'dark' ? '#0C1210' : '#F6F7F3');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }
  if (root.dataset.theme !== 'dark' && root.dataset.theme !== 'light') {
    root.dataset.theme = 'light';
  }
  applyTheme(root.dataset.theme);
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  }

  /* 1. Year */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* 2. Local clock (24h, HH:MM) */
  var clock = document.getElementById('clock');
  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent =
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  tick();
  window.setInterval(tick, 20000);

  /* 3. Mobile menu */
  var btn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobilemenu');
  function setMenu(open) {
    if (!btn || !menu) return;
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Close' : 'Menu';
  }
  if (btn && menu) {
    btn.addEventListener('click', function () {
      setMenu(!menu.classList.contains('open'));
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        // In-page links are closed by the scroll handler below (after a
        // delay, so the landing is measured with the menu fully shut).
        // Close anything else here straight away.
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') setMenu(false);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        setMenu(false);
        btn.focus();
      }
    });
  }

  /* 4. Calm scroll for in-page links — one ease, no overshoot, cancellable */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  var scrollRaf = null;
  function cancelScroll() {
    if (scrollRaf !== null) {
      cancelAnimationFrame(scrollRaf);
      scrollRaf = null;
    }
  }
  ['wheel', 'touchstart', 'touchmove'].forEach(function (ev) {
    window.addEventListener(ev, cancelScroll, { passive: true });
  });
  function calmScrollTo(targetY, done) {
    cancelScroll();
    if (reduceMotion) {
      window.scrollTo({ top: targetY, behavior: 'auto' });
      if (done) done();
      return;
    }
    var startY = window.pageYOffset;
    var dist = targetY - startY;
    if (Math.abs(dist) < 4) {
      if (done) done();
      return;
    }
    var dur = Math.min(1100, Math.max(600, Math.abs(dist) * 0.5));
    var t0 = null;
    function frame(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: startY + dist * easeInOutCubic(t), behavior: 'auto' });
      if (t < 1) {
        scrollRaf = requestAnimationFrame(frame);
      } else {
        scrollRaf = null;
        window.scrollTo({ top: targetY, behavior: 'auto' });
        if (done) done();
      }
    }
    scrollRaf = requestAnimationFrame(frame);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href');
      if (!id || id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      // The mobile menu is an overlay — closing it changes no layout,
      // so the landing is measured and scrolled to immediately.
      setMenu(false);
      var top = target.getBoundingClientRect().top + window.pageYOffset - 88;
      top = Math.max(0, top);
      calmScrollTo(top, function () {
        try { history.pushState(null, '', id); } catch (err) { /* ignore */ }
      });
    });
  });

  /* 5. Reveal on scroll — with a small cascade inside groups */
  var items = document.querySelectorAll('.reveal');
  items.forEach(function (el) {
    var parent = el.parentElement;
    if (!parent) return;
    var siblings = Array.prototype.filter.call(parent.children, function (c) {
      return c.classList && c.classList.contains('reveal');
    });
    if (siblings.length > 1) {
      var i = siblings.indexOf(el);
      el.style.transitionDelay = Math.min(0.12, i * 0.06) + 's';
    }
  });
  if (reduceMotion) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          obs.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* 6. Figure steps — one shared clock with the 6s liquid loop.
     Edges match keyframe events, not even thirds: gather 0s (carrier
     appears at eyelet), hold 2.04s (carrier reaches bowl, 34% of 6s),
     release 3.24s (drop detaches, 54% of 6s). CSS loop is parked at t=0
     until .go releases it in the same instant the highlights start. */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.figure-steps li'));
  var LOOP_MS = 6000;
  var HOLD_AT = 2040;
  var RELEASE_AT = 3240;
  if (steps.length && !reduceMotion) {
    var paint = function (phase) {
      steps.forEach(function (li, i) { li.classList.toggle('on', i === phase); });
    };
    var started = false;
    var start = function () {
      if (started) return;
      started = true;
      var fig = document.querySelector('.figure');
      if (fig) fig.classList.add('go');
      var cycle = function () {
        paint(0);
        window.setTimeout(function () { paint(1); }, HOLD_AT);
        window.setTimeout(function () { paint(2); }, RELEASE_AT);
        window.setTimeout(cycle, LOOP_MS);
      };
      cycle();
    };
    var figEl = document.querySelector('.figure');
    if ('IntersectionObserver' in window && figEl) {
      var fio = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { start(); obs.disconnect(); }
        });
      }, { threshold: 0.25 });
      fio.observe(figEl);
    } else {
      start();
    }
  } else if (steps.length) {
    steps[1].classList.add('on');
  }
})();
