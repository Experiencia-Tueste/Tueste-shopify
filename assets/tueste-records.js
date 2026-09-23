(function () {
  'use strict';

  document.querySelectorAll('[data-tueste-records]').forEach(function (root) {
    var filters = root.querySelectorAll('[data-record-filter]');
    var releases = root.querySelectorAll('[data-release-type]');
    filters.forEach(function (filter) {
      filter.addEventListener('click', function () {
        var selected = filter.getAttribute('data-record-filter');
        filters.forEach(function (item) {
          var active = item === filter;
          item.classList.toggle('is-active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        releases.forEach(function (release) {
          release.hidden = selected !== 'all' && release.getAttribute('data-release-type') !== selected;
        });
      });
    });
  });
}());
