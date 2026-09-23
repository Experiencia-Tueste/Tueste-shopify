(function () {
  'use strict';

  /* Datos del contador de fundadores — mismos que la landing. */
  var TAKEN = 3570;
  var TOTAL = 10200;

  /* --- Carrito visual --- */
  var drawer = document.querySelector('[data-cart-drawer]');
  var openButton = document.querySelector('[data-cart-open]');
  var closeButton = document.querySelector('[data-cart-close]');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (open && closeButton) closeButton.focus();
    if (!open && openButton) openButton.focus();
  }

  if (openButton) openButton.addEventListener('click', function () { setDrawer(true); });
  if (closeButton) closeButton.addEventListener('click', function () { setDrawer(false); });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && drawer && drawer.classList.contains('is-open')) setDrawer(false);
  });

  /* --- Carrusel del hero --- */
  var hero = document.querySelector('[data-hero]');
  var slides = hero ? hero.querySelectorAll('[data-slide]') : [];
  var AUTOPLAY = 6500;

  if (hero && slides.length > 1) {
    var dotsBox = hero.querySelector('[data-hero-dots]');
    var current = 0;
    var timer = null;
    var noMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = [];

    Array.prototype.forEach.call(slides, function (slide, i) {
      slide.setAttribute('aria-hidden', String(i !== 0));
      if (!dotsBox) return;
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Diapositiva ' + (i + 1));
      dot.addEventListener('click', function () { go(i); restart(); });
      dotsBox.appendChild(dot);
      dots.push(dot);
    });

    function go(index) {
      current = (index + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (slide, i) {
        var on = i === current;
        slide.classList.toggle('is-active', on);
        slide.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-on', i === current);
        dot.setAttribute('aria-selected', String(i === current));
      });

      /* La barra de fundadores se vuelve a llenar cada vez que entra su slide. */
      var bars = slides[current].querySelectorAll('[data-meter]');
      if (bars.length && typeof pct === 'number') {
        Array.prototype.forEach.call(bars, function (bar) { bar.style.width = '0'; });
        window.setTimeout(function () {
          Array.prototype.forEach.call(bars, function (bar) { bar.style.width = pct + '%'; });
        }, 260);
      }
    }

    function next() { go(current + 1); }
    function prev() { go(current - 1); }

    function start() {
      if (noMotion) return;
      timer = window.setInterval(next, AUTOPLAY);
    }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function restart() { stop(); start(); }

    var nextBtn = hero.querySelector('[data-hero-next]');
    var prevBtn = hero.querySelector('[data-hero-prev]');
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);

    hero.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { next(); restart(); }
      if (event.key === 'ArrowLeft') { prev(); restart(); }
    });

    /* Deslizar en móvil */
    var startX = null;
    hero.addEventListener('touchstart', function (event) {
      startX = event.touches[0].clientX;
      stop();
    }, { passive: true });

    hero.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 45) { delta < 0 ? next() : prev(); }
      startX = null;
      start();
    }, { passive: true });

    /* Sin autoplay mientras el hero no se ve. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.isIntersecting ? start() : stop(); });
      }, { threshold: 0.2 }).observe(hero);
    } else {
      start();
    }

    go(0);
  }

  /* --- Carruseles horizontales (presentaciones) --- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-rail]'), function (rail) {
    var name = rail.getAttribute('data-rail');
    var prev = document.querySelector('[data-rail-prev="' + name + '"]');
    var next = document.querySelector('[data-rail-next="' + name + '"]');
    var card = rail.firstElementChild;

    function step() {
      if (!card) return rail.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(rail).columnGap || getComputedStyle(rail).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      if (prev) prev.disabled = rail.scrollLeft <= 2;
      if (next) next.disabled = rail.scrollLeft >= max;
    }

    if (prev) prev.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });

    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);

    rail.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { rail.scrollBy({ left: step(), behavior: 'smooth' }); event.preventDefault(); }
      if (event.key === 'ArrowLeft') { rail.scrollBy({ left: -step(), behavior: 'smooth' }); event.preventDefault(); }
    });

    sync();
  });

  /* --- Contador de fundadores --- */
  var pct = Math.round((TAKEN / TOTAL) * 100);

  Array.prototype.forEach.call(document.querySelectorAll('[data-taken]'), function (node) {
    node.textContent = TAKEN.toLocaleString('es-CO');
  });

  function fillMeters() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-meter]'), function (node) {
      node.style.width = pct + '%';
    });
  }

  if ('requestAnimationFrame' in window) {
    requestAnimationFrame(function () { setTimeout(fillMeters, 240); });
  } else {
    fillMeters();
  }

  /* --- Entrada de secciones --- */
  var reveals = document.querySelectorAll('.te-preview__reveal');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealAll() {
    Array.prototype.forEach.call(reveals, function (node) { node.classList.add('is-in'); });
  }

  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('te-armed');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(reveals, function (node) { observer.observe(node); });

    /* Salvavidas: si algo impide que el observador dispare, nada queda oculto. */
    window.setTimeout(revealAll, 6000);
  } else {
    revealAll();
  }
}());
