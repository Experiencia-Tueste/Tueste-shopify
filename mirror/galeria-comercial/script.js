const filters = document.querySelectorAll('[data-filter]');
const products = document.querySelectorAll('[data-category]');
const count = document.querySelector('[data-count]');

filters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;
    let visible = 0;

    filters.forEach((button) => {
      const isActive = button === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    products.forEach((product) => {
      const show = selected === 'all' || product.dataset.category === selected;
      product.hidden = !show;
      if (show) visible += 1;
    });

    count.textContent = visible;
  });
});
