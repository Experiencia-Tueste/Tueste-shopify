(function () {
  'use strict';

  function initHome(root) {
    if (!root || root.dataset.tuesteHomeReady === 'true') return;
    root.dataset.tuesteHomeReady = 'true';

    var takenNodes = root.querySelectorAll('[data-taken]');
    var meterNodes = root.querySelectorAll('[data-meter]');
    var taken = Number((takenNodes[0] && takenNodes[0].textContent || '0').replace(/[^0-9]/g, '')) || 0;
    var total = Number(root.dataset.treeTotal) || 1;
    var percentage = Math.min(100, Math.round((taken / total) * 100));

    Array.prototype.forEach.call(takenNodes, function (node) {
      node.textContent = taken.toLocaleString('es-CO');
    });
    window.requestAnimationFrame(function () {
      Array.prototype.forEach.call(meterNodes, function (node) { node.style.width = percentage + '%'; });
    });

    var hero = root.querySelector('[data-hero]');
    var slides = hero ? hero.querySelectorAll('[data-slide]') : [];
    if (hero && slides.length > 1) {
      var dotsBox = hero.querySelector('[data-hero-dots]');
      var current = 0;
      var timer = null;
      var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var dots = [];

      function show(index) {
        current = (index + slides.length) % slides.length;
        Array.prototype.forEach.call(slides, function (slide, i) {
          var active = i === current;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', String(!active));
        });
        Array.prototype.forEach.call(dots, function (dot, i) {
          dot.classList.toggle('is-on', i === current);
          dot.setAttribute('aria-selected', String(i === current));
        });
      }

      function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
      function start() { if (!reduced && !timer) timer = window.setInterval(function () { show(current + 1); }, 6500); }
      function restart() { stop(); start(); }

      Array.prototype.forEach.call(slides, function (slide, i) {
        if (!dotsBox) return;
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Diapositiva ' + (i + 1));
        dot.addEventListener('click', function () { show(i); restart(); });
        dotsBox.appendChild(dot);
        dots.push(dot);
      });

      var next = hero.querySelector('[data-hero-next]');
      var previous = hero.querySelector('[data-hero-prev]');
      if (next) next.addEventListener('click', function () { show(current + 1); restart(); });
      if (previous) previous.addEventListener('click', function () { show(current - 1); restart(); });
      hero.addEventListener('mouseenter', stop);
      hero.addEventListener('mouseleave', start);
      hero.addEventListener('focusin', stop);
      hero.addEventListener('focusout', start);
      show(0);
      start();
    }

    Array.prototype.forEach.call(root.querySelectorAll('[data-rail]'), function (rail) {
      var name = rail.getAttribute('data-rail');
      var previous = root.querySelector('[data-rail-prev="' + name + '"]');
      var next = root.querySelector('[data-rail-next="' + name + '"]');
      var card = rail.firstElementChild;
      function step() { return card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8; }
      function sync() {
        var max = rail.scrollWidth - rail.clientWidth - 2;
        if (previous) previous.disabled = rail.scrollLeft <= 2;
        if (next) next.disabled = rail.scrollLeft >= max;
      }
      if (previous) previous.addEventListener('click', function () { rail.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { rail.scrollBy({ left: step(), behavior: 'smooth' }); });
      rail.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('.tueste-home'), initHome);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
}());
