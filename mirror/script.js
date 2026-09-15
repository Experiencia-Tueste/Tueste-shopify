// Tueste — Espejo estático — comportamiento básico del hero slideshow y contador de cantidad

document.addEventListener('DOMContentLoaded', () => {
  // ---- Hero slideshow ----
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dots button');
  let current = 0;
  let timer;

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current]?.classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current]?.classList.add('is-active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    timer = setInterval(next, 6000);
  }
  function stopAutoplay() {
    clearInterval(timer);
  }

  document.querySelector('.hero__nav--next')?.addEventListener('click', () => { next(); stopAutoplay(); startAutoplay(); });
  document.querySelector('.hero__nav--prev')?.addEventListener('click', () => { prev(); stopAutoplay(); startAutoplay(); });
  dots.forEach((dot, i) => dot.addEventListener('click', () => { goTo(i); stopAutoplay(); startAutoplay(); }));

  if (slides.length) startAutoplay();

  // ---- Quantity selector ----
  document.querySelectorAll('.qty-selector').forEach(sel => {
    const [minus, countEl, plus] = sel.children;
    let qty = 1;
    minus.addEventListener('click', () => { qty = Math.max(1, qty - 1); countEl.textContent = qty; });
    plus.addEventListener('click', () => { qty += 1; countEl.textContent = qty; });
  });

  // ---- Newsletter (demo only, no real submission) ----
  document.querySelector('.newsletter')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Demo: aquí se conectaría con el formulario real de Shopify.');
  });
});
