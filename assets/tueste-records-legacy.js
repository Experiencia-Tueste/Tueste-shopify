(function () {
  'use strict';

  /* ---------- generative monochrome art (canvas, no photos) ---------- */
  function rng(seed) {
    var value = seed;
    return function () {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  }

  function drawGenerativeArt(canvas, seed) {
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    if (!width || !height) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    var random = rng(seed * 7919 + 13);

    ctx.fillStyle = '#111214';
    ctx.fillRect(0, 0, width, height);

    var cx = width * (0.35 + random() * 0.4);
    var cy = height * (0.35 + random() * 0.4);
    var radius = Math.max(width, height) * (0.7 + random() * 0.5);
    var rings = 70;
    for (var i = 0; i < rings; i++) {
      var t = i / rings;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * t, 0, Math.PI * 2);
      var ringAlpha = 0.02 + 0.1 * Math.pow(1 - t, 2) * (0.4 + random() * 0.6);
      ctx.strokeStyle = 'rgba(236, 232, 224, ' + ringAlpha.toFixed(3) + ')';
      ctx.lineWidth = 0.6 + random() * 1.6;
      ctx.stroke();
    }

    var accents = 1 + Math.floor(random() * 3);
    for (var a = 0; a < accents; a++) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * (0.05 + random() * 0.6), 0, Math.PI * 2);
      var accentAlpha = 0.25 + random() * 0.4;
      ctx.strokeStyle = 'rgba(194, 154, 85, ' + accentAlpha.toFixed(3) + ')';
      ctx.lineWidth = 1 + random() * 1.5;
      ctx.stroke();
    }

    var vignette = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 0.9);
    vignette.addColorStop(0, 'rgba(10, 10, 11, 0)');
    vignette.addColorStop(1, 'rgba(10, 10, 11, .75)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }

  function paintCanvases(root) {
    root.querySelectorAll('canvas').forEach(function (canvas) {
      var seededAncestor = canvas.closest('[data-seed]');
      var seed = Number(
        canvas.getAttribute('data-seed') ||
        (seededAncestor && seededAncestor.getAttribute('data-seed')) ||
        1
      );
      drawGenerativeArt(canvas, seed);
    });
  }

  /* ---------- catalog filters ---------- */
  function initFilters(root) {
    var filters = root.querySelectorAll('[data-record-filter]');
    var releases = root.querySelectorAll('[data-release-type]');
    if (!filters.length) return;

    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var selected = filter.getAttribute('data-record-filter');
        filters.forEach(function (item) {
          var active = item === filter;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        releases.forEach(function (release) {
          if (selected === 'all') {
            release.hidden = false;
          } else if (selected === 'soon') {
            release.hidden = release.getAttribute('data-release-soon') !== 'true';
          } else {
            release.hidden = release.getAttribute('data-release-type') !== selected;
          }
        });
      });
    });
  }

  /* ---------- hero carousel ---------- */
  function initHero(root) {
    var hero = root.querySelector('[data-hero]');
    var slidesWrap = root.querySelector('[data-hero-slides]');
    if (!hero || !slidesWrap) return;

    var slides = Array.prototype.slice.call(slidesWrap.querySelectorAll('[data-seed]'));
    if (!slides.length) return;

    var dotsWrap = root.querySelector('[data-hero-dots]');
    var counter = root.querySelector('[data-hero-counter]');
    var toggle = root.querySelector('[data-hero-toggle]');
    var toggleIcon = root.querySelector('[data-hero-toggle-icon]');
    var toggleLabel = root.querySelector('[data-hero-toggle-label]');
    var prevButton = root.querySelector('[data-hero-prev]');
    var nextButton = root.querySelector('[data-hero-next]');
    var total = slides.length;
    var current = 0;
    var timer = null;
    var pausedByUser = false;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    var dots = slides.map(function (slide, index) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'tu-records__hero-dot';
      dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (index + 1) + ' de ' + total);
      dot.addEventListener('click', function () {
        goTo(index);
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      return dot;
    });

    function render() {
      slides.forEach(function (slide, index) {
        var active = index === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      dots.forEach(function (dot, index) {
        var active = index === current;
        dot.classList.toggle('is-active', active);
        if (active) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
      if (counter) {
        counter.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(total).padStart(2, '0');
      }
    }

    function goTo(index) {
      current = (index + total) % total;
      render();
      restart();
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function restart() {
      stop();
      if (pausedByUser || reduceMotion.matches) return;
      timer = setInterval(function () {
        goTo(current + 1);
      }, 6500);
    }

    if (prevButton) {
      prevButton.addEventListener('click', function () {
        goTo(current - 1);
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', function () {
        goTo(current + 1);
      });
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        pausedByUser = !pausedByUser;
        toggle.setAttribute('aria-pressed', String(pausedByUser));
        if (toggleIcon) toggleIcon.textContent = pausedByUser ? '▶' : '⏸';
        if (toggleLabel) toggleLabel.textContent = pausedByUser ? 'Reanudar autoplay' : 'Pausar autoplay';
        if (pausedByUser) {
          stop();
        } else {
          restart();
        }
      });
    }

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', function () {
      if (!pausedByUser) restart();
    });
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', function () {
      if (!pausedByUser) restart();
    });

    if (typeof reduceMotion.addEventListener === 'function') {
      reduceMotion.addEventListener('change', restart);
    } else if (typeof reduceMotion.addListener === 'function') {
      reduceMotion.addListener(restart);
    }

    render();

    /* Sin autoplay mientras el hero no se ve. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { entry.isIntersecting ? restart() : stop(); });
      }, { threshold: 0.2 }).observe(hero);
    } else {
      restart();
    }
  }

  function initRecords(root) {
    if (!root || root.dataset.tuesteRecordsReady === 'true') return;
    root.dataset.tuesteRecordsReady = 'true';

    initFilters(root);
    initHero(root);
    paintCanvases(root);

    var repaintTimer;
    window.addEventListener('resize', function () {
      clearTimeout(repaintTimer);
      repaintTimer = setTimeout(function () {
        paintCanvases(root);
      }, 200);
    });
  }

  function boot() {
    document.querySelectorAll('[data-tueste-records]').forEach(initRecords);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
}());
