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

  /* 0b. Navigation — single source of truth. Desktop pill and mobile
     menu both render from NAV_LINKS, so they cannot drift apart.
     Runs before menu + click-to-scroll binding below.
     "Apps" lives at /apps/ (apps/index.html). Both pages also carry
     their own #contact section, so "Write to us" stays an in-page
     anchor everywhere and needs no cross-page path. */
  var isAppsPage = /(^|\/)apps\/?(\.html)?($|[?#])/.test(window.location.pathname);
  var NAV_LINKS = [
    { href: isAppsPage ? './' : 'apps/', label: 'Apps', desktopClass: isAppsPage ? 'active' : undefined, current: isAppsPage },
    { href: '#contact', label: 'Write to us ↓', desktopClass: 'topnav-pill' }
  ];
  /* Home exists only off the homepage — on / the wordmark is home */
  if (isAppsPage) NAV_LINKS.unshift({ href: '../', label: 'Home' });
  function buildLink(l, className) {
    var a = document.createElement('a');
    a.setAttribute('href', l.href);
    if (className) a.className = className;
    a.textContent = l.label;
    if (l.current) a.setAttribute('aria-current', 'page');
    if (/^https?:/.test(l.href)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
    return a;
  }
  var topnav = document.querySelector('.topnav');
  var mobilemenuEl = document.getElementById('mobilemenu');
  NAV_LINKS.forEach(function (l) {
    if (topnav) topnav.appendChild(buildLink(l, l.desktopClass));
    if (mobilemenuEl) mobilemenuEl.appendChild(buildLink(l, null));
  });

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
    document.body.style.overflow = open ? 'hidden' : '';
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
    /* resizing to desktop with the menu open must not strand it */
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860 && menu.classList.contains('open')) setMenu(false);
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
      // A jump target below the fold may still carry its pre-reveal
      // offset — settle it first so the landing is measured exactly,
      // then hand its transition back once arrived.
      var needsReveal = target.classList && target.classList.contains('reveal') && !target.classList.contains('in');
      if (needsReveal) {
        target.style.transition = 'none';
        target.classList.add('in');
      }
      var topbarIn = document.querySelector('.topbar-in');
      var headerOffset = topbarIn ? (topbarIn.offsetHeight + 1) : 73;
      var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      top = Math.max(0, top);
      calmScrollTo(top, function () {
        if (needsReveal) target.style.transition = '';
        try { history.pushState(null, '', id); } catch (err) { /* ignore */ }
      });
    });
  });

  /* 4b. Scroll-to-top button — calm return, responsive visibility */
  var scrollTopBtn = document.getElementById('scroll-top');
  if (scrollTopBtn) {
    var checkScrollTop = function () {
      if (window.pageYOffset > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    };
    window.addEventListener('scroll', checkScrollTop, { passive: true });
    checkScrollTop();

    scrollTopBtn.addEventListener('click', function () {
      calmScrollTo(0, function () {
        try {
          if (window.location.hash) {
            history.pushState(null, '', window.location.pathname + window.location.search);
          }
        } catch (err) { /* ignore */ }
      });
    });
  }

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
  /* 7. Work carousel — one card in view. Simple swipe (pointer drag),
     arrows, and auto-advance. No dependencies. */
  var carousel = document.getElementById('work-carousel');
  if (carousel) {
    var viewport = carousel.querySelector('.work-viewport');
    var track = carousel.querySelector('.work-track');
    var slides = Array.prototype.slice.call(track.children);
    var prevBtn = document.getElementById('work-prev');
    var nextBtn = document.getElementById('work-next');
    var nowEl = document.getElementById('work-now');
    var totalEl = document.getElementById('work-total');
    var navRow = carousel.querySelector('.work-nav');
    var count = slides.length;
    var at = 0;
    var AUTO_MS = 7000;
    var timer = null;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    /* sweet paging — each slide breathes in scale and tone with its
       distance from rest, then hands back to plain CSS when settled */
    var sweetRaf = null;
    function sweetTick() {
      sweetRaf = null;
      var w = viewport.offsetWidth || 1;
      var tx = 0;
      var m = window.getComputedStyle(track).transform;
      if (m && m !== 'none') {
        var parts = m.split(',');
        if (parts.length === 6) tx = parseFloat(parts[4]) || 0;
        else if (parts.length === 16) tx = parseFloat(parts[12]) || 0;
      }
      var pos = -tx / w;
      var settled = true;
      slides.forEach(function (s, i) {
        var d = Math.min(1, Math.abs(i - pos));
        s.style.opacity = String(1 - 0.28 * d);
        s.style.transform = 'scale(' + (1 - 0.035 * d) + ')';
        if (d > 0.002 && d < 0.998) settled = false;
      });
      if (!settled || track.classList.contains('live')) {
        sweetRaf = requestAnimationFrame(sweetTick);
      } else {
        slides.forEach(function (s) { s.style.opacity = ''; s.style.transform = ''; });
      }
    }
    function sweetStart() {
      if (reduceMotion || sweetRaf !== null) return;
      sweetRaf = requestAnimationFrame(sweetTick);
    }
    function render() {
      track.style.transform = 'translateX(' + (-at * 100) + '%)';
      if (nowEl) nowEl.textContent = pad(at + 1);
      if (prevBtn) prevBtn.disabled = (at === 0);
      if (nextBtn) nextBtn.disabled = (at === count - 1);
      slides.forEach(function (s, i) {
        var hidden = i !== at;
        s.setAttribute('aria-label', (i + 1) + ' of ' + count);
        s.setAttribute('aria-hidden', hidden ? 'true' : 'false');
        s.querySelectorAll('a, button').forEach(function (el) {
          if (hidden) el.setAttribute('tabindex', '-1');
          else el.removeAttribute('tabindex');
        });
      });
      sweetStart();
    }
    function stop() {
      if (timer !== null) { window.clearInterval(timer); timer = null; }
    }
    function start() {
      if (reduceMotion || count < 2) return;
      stop();
      timer = window.setInterval(function () {
        at = (at + 1) % count;
        render();
      }, AUTO_MS);
    }
    function go(d) {
      at = (at + d + count) % count;
      render();
      stop();
      start();
    }
    function step(d) {
      /* user-initiated moves clamp at the ends and never wrap —
         a repeated command from one gesture (trackpad momentum tail)
         must land on the same card, never bounce back to the first */
      var next = Math.max(0, Math.min(count - 1, at + d));
      if (next === at) return;
      at = next;
      render();
      stop();
      start();
    }
    if (count < 2) {
      if (navRow) navRow.style.display = 'none';
    } else {
      if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
      carousel.addEventListener('pointerenter', stop);
      carousel.addEventListener('pointerleave', start);
      carousel.addEventListener('focusin', stop);
      carousel.addEventListener('focusout', start);

      var dragX = null;
      var dragDX = 0;
      var dragged = false;
      viewport.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragX = e.clientX;
        dragDX = 0;
        dragged = false;
        track.classList.add('live');
        viewport.classList.add('dragging');
        /* capture only once a real drag proves out, so card links keep working */
        stop();
      });
      viewport.addEventListener('pointermove', function (e) {
        if (dragX === null) return;
        dragDX = e.clientX - dragX;
        if (Math.abs(dragDX) > 6) {
          dragged = true;
          try { viewport.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        track.style.transform = 'translateX(calc(' + (-at * 100) + '% + ' + dragDX + 'px))';
        sweetStart();
      });
      var endDrag = function () {
        if (dragX === null) return;
        var w = viewport.offsetWidth || 1;
        var limit = Math.max(60, w * 0.12);
        track.classList.remove('live');
        viewport.classList.remove('dragging');
        if (dragDX < -limit) at = Math.min(count - 1, at + 1);
        else if (dragDX > limit) at = Math.max(0, at - 1);
        dragX = null;
        dragDX = 0;
        render();
        start();
      };
      viewport.addEventListener('pointerup', endDrag);
      viewport.addEventListener('pointercancel', endDrag);
      /* a real drag must not trigger card links on release */
      viewport.addEventListener('click', function (e) {
        if (dragged) {
          e.preventDefault();
          e.stopPropagation();
          dragged = false;
        }
      }, true);

      /* touchpad swipe — one horizontal flick moves one card */
      var wheelLock = false;
      viewport.addEventListener('wheel', function (e) {
        if (count < 2 || e.ctrlKey || wheelLock) return;
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        e.preventDefault();
        wheelLock = true;
        step(e.deltaX > 0 ? 1 : -1);
        window.setTimeout(function () { wheelLock = false; }, 800);
      }, { passive: false });

      /* keyboard — region is focusable via tabindex */
      carousel.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      });
    }
    if (totalEl) totalEl.textContent = pad(count);
    render();
    start();
  }
})();
