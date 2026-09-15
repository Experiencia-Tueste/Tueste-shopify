// Filtro de la grilla de la galería comercial (mockup local, sin dependencias)
document.addEventListener('DOMContentLoaded', () => {
  const filters = document.querySelectorAll('.filter');
  const cards = document.querySelectorAll('[data-category]');
  const countEl = document.querySelector('[data-count]');

  function applyFilter(value){
    let visible = 0;
    cards.forEach(card => {
      const match = value === 'todo' || card.dataset.category === value;
      card.hidden = !match;
      if (match) visible += 1;
    });
    if (countEl) countEl.textContent = visible;

    filters.forEach(btn => {
      const isActive = btn.dataset.filter === value;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  }

  filters.forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // Los enlaces del nav superior (CAFÉ / OBJETOS) también filtran, además de saltar a la sección
  document.querySelectorAll('[data-filter-link]').forEach(link => {
    link.addEventListener('click', () => applyFilter(link.dataset.filterLink));
  });
});
