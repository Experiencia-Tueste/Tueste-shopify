/* ------------------------------------------------------------
 * Tueste Records · slider del hero, filtros del catálogo y arte generativo (portado del HTML original)
 * Se inicializa sobre cada [data-tueste-records]. Los datos (lanzamientos, plataformas, playlists, noticias)
 * ahora viven en Liquid; aquí solo queda el comportamiento.
 * ------------------------------------------------------------ */
(function () {
  'use strict';

  /* ---------- arte generativo monocromo (sin fotos) ---------- */
  function rng(s) {
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  function drawArt(cv, seed, dense) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = cv.clientWidth || 600;
    var h = cv.clientHeight || 600;
    if (!w || !h) return;
    cv.width = w * dpr;
    cv.height = h * dpr;
    var c = cv.getContext('2d');
    c.scale(dpr, dpr);
    var r = rng(seed * 7919 + 13);
    c.fillStyle = '#111214';
    c.fillRect(0, 0, w, h);
    var cx = w * (0.35 + r() * 0.4);
    var cy = h * (0.35 + r() * 0.4);
    var R = Math.max(w, h) * (0.7 + r() * 0.5);
    var n = dense ? 90 : 46;
    for (var i = 0; i < n; i++) {
      var t = i / n;
      c.beginPath();
      c.arc(cx, cy, R * t, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(236,232,224,' + (0.02 + 0.10 * Math.pow(1 - t, 2) * (0.4 + r() * 0.6)) + ')';
      c.lineWidth = 0.6 + r() * 1.6;
      c.stroke();
    }
    var k = 1 + Math.floor(r() * 3);
    for (var j = 0; j < k; j++) {
      c.beginPath();
      c.arc(cx, cy, R * (0.05 + r() * 0.6), 0, Math.PI * 2);
      c.strokeStyle = 'rgba(194,154,85,' + (0.25 + r() * 0.4) + ')';
      c.lineWidth = 1 + r() * 1.5;
      c.stroke();
    }
    try {
      var img = c.getImageData(0, 0, w * dpr, h * dpr);
      var d = img.data;
      for (var p = 0; p < d.length; p += 4) {
        var g = (r() - 0.5) * 18;
        d[p] += g; d[p + 1] += g; d[p + 2] += g;
      }
      c.putImageData(img, 0, 0);
    } catch (e) { /* canvas tainted o sin permisos: se omite el grano */ }
    var gr = c.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 0.9);
    gr.addColorStop(0, 'rgba(10,10,11,0)');
    gr.addColorStop(1, 'rgba(10,10,11,.75)');
    c.fillStyle = gr;
    c.fillRect(0, 0, w, h);
  }

  function paint(root) {
    root.querySelectorAll('canvas[data-gen]').forEach(function (cv) {
      var holder = cv.closest('[data-seed]');
      var seed = +(cv.dataset.seed || (holder && holder.dataset.seed) || 1);
      drawArt(cv, seed, cv.dataset.gen === 'dense');
    });
  }

  /* ---------- slider del hero ---------- */
  function initSlider(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
    var dots = root.querySelector('[data-dots]');
    var counter = root.querySelector('[data-counter]');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    if (slides.length < 2) return;
    var cur = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var interval = +(root.dataset.autoplay || 6500);

    if (dots) {
      slides.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', 'Slide ' + (i + 1));
        b.addEventListener('click', function () { go(i); });
        dots.appendChild(b);
      });
    }

    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        var on = j === cur;
        s.classList.toggle('on', on);
        s.setAttribute('aria-hidden', String(!on));
      });
      if (dots) Array.prototype.forEach.call(dots.children, function (d, j) {
        d.classList.toggle('on', j === cur);
        d.setAttribute('aria-selected', String(j === cur));
      });
      if (counter) counter.textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      restart();
    }

    function restart() {
      clearInterval(timer);
      if (!reduce && interval > 0) timer = setInterval(function () { go(cur + 1); }, interval);
    }

    if (prev) prev.addEventListener('click', function () { go(cur - 1); });
    if (next) next.addEventListener('click', function () { go(cur + 1); });
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);
    go(0);
  }

  /* ---------- filtros del catálogo ---------- */
  function initFilters(root) {
    var filters = root.querySelector('[data-filters]');
    var grid = root.querySelector('[data-grid]');
    if (!filters || !grid) return;
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      Array.prototype.forEach.call(filters.children, function (x) {
        x.classList.toggle('on', x === b);
        x.setAttribute('aria-pressed', String(x === b));
      });
      var f = b.dataset.f;
      grid.querySelectorAll('[data-type]').forEach(function (r) {
        var show = f === 'all' || (f === 'soon' ? r.dataset.soon === '1' : r.dataset.type === f);
        r.hidden = !show;
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-tueste-records]').forEach(function (root) {
      if (root.dataset.trInit) return;
      root.dataset.trInit = '1';
      initSlider(root);
      initFilters(root);
      paint(root);
    });
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      document.querySelectorAll('[data-tueste-records]').forEach(paint);
    }, 200);
  });

  /* Editor de temas: repintar cuando se carga o selecciona una sección */
  document.addEventListener('shopify:section:load', function () {
    document.querySelectorAll('[data-tueste-records]').forEach(function (root) { root.dataset.trInit = ''; });
    init();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
