/**
 * Página de un certificado Tueste Tree individual
 * (templates/metaobject.certificado-arbol.json, sections/certificado-arbol.liquid).
 *
 * La sección ya renderiza el certificado completo en HTML, server-side,
 * con cada campo escapado por Liquid (`| escape`). Este script no busca
 * ni recibe datos de certificados desde ningún lado — solo:
 *   1) formatea la fecha ISO guardada en `data-fecha-iso` al formato
 *      legible es-CO (mismo formato que usaba antes la búsqueda en
 *      assets/tueste-tree-verificar.js).
 *   2) arma el objeto plano para `TuesteTreeCertificate.download()`
 *      leyendo el propio DOM ya renderizado con `.textContent` (nunca
 *      `.innerHTML`), igual que hacía la verificación anterior.
 */
(function () {
  'use strict';

  function formatDate(value) {
    if (!value) return '—';
    var parsed = new Date(value);
    if (isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
  }

  function initCertificate(root) {
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    var dateNode = root.querySelector('[data-certificate-date]');
    if (dateNode) dateNode.textContent = formatDate(dateNode.getAttribute('data-fecha-iso'));

    var downloadButton = root.querySelector('[data-download-certificate]');
    if (!downloadButton) return;

    downloadButton.addEventListener('click', function () {
      if (!window.TuesteTreeCertificate || downloadButton.disabled) return;
      var text = function (selector) {
        var node = root.querySelector(selector);
        return node ? node.textContent.trim() : '';
      };
      var logoImage = root.querySelector('.tt-certificate-logo');
      var illustration = root.querySelector('img:not(.tt-certificate-logo)');
      var origin = root.querySelector('dl > div:last-child dd');

      downloadButton.disabled = true;
      window.TuesteTreeCertificate.download({
        logo: logoImage ? logoImage.src : '',
        image: illustration ? illustration.src : '',
        kicker: text('.tt-certificate-kicker'),
        subtitle: text('.tt-certificate-subtitle'),
        heading: text('h1'),
        lot: text('.tt-certificate-lot'),
        treeNumber: text('[data-certificate-number]'),
        note: text('.tt-certificate-note'),
        rows: [
          ['Guardián', text('[data-certificate-name]')],
          ['Insignia', text('[data-certificate-badge]')],
          ['Fecha de siembra', text('[data-certificate-date]')],
          ['Origen', origin ? origin.textContent.trim() : '']
        ]
      }).catch(function () {
        window.alert('No pudimos generar el certificado. Intenta de nuevo en unos minutos.');
      }).then(function () {
        downloadButton.disabled = false;
      });
    });
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-certificate]'), initCertificate);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
