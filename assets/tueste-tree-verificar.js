/**
 * /pages/verificar — redirige a la página propia de un certificado Tueste
 * Tree, resuelta por Shopify como "storefront page" del metaobject
 * `certificado-arbol` (ver sections/certificado-arbol.liquid y el
 * comentario de contrato en sections/verificar-arbol.liquid).
 *
 * REDISEÑO: esta página ya no embebe ningún dato de certificados, así que
 * este script ya no busca nada en una lista local. Solo hace una cosa:
 * toma un número de árbol (de `?numero=` o del formulario), lo reduce a
 * dígitos, y arma la URL de esa entrada. Si el número no corresponde a
 * ningún certificado real, eso lo resuelve Shopify al cargar esa URL
 * (404 nativo del tema) — este script no puede saberlo de antemano, porque
 * Liquid no tiene forma de leer `?numero=` en el servidor para chequearlo
 * acá antes de redirigir.
 */
(function () {
  'use strict';

  function onlyDigits(value) {
    return String(value || '').replace(/[^0-9]/g, '');
  }

  function initVerificar(root) {
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    if (root.dataset.configured !== 'true') return;

    var form = root.querySelector('[data-state="prompt"]');
    var redirecting = root.querySelector('[data-state="redirecting"]');
    var numeroInput = root.querySelector('[data-numero-input]');
    var base = root.dataset.certificateBase || '';

    function goTo(numero) {
      var digits = onlyDigits(numero);
      if (!digits) return false;
      if (form) form.hidden = true;
      if (redirecting) redirecting.hidden = false;
      window.location.assign(base + '/' + window.encodeURIComponent(digits));
      return true;
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        goTo(numeroInput ? numeroInput.value : '');
      });
    }

    var params = new URLSearchParams(window.location.search);
    var queryNumero = params.get('numero');
    if (queryNumero) {
      var digits = onlyDigits(queryNumero);
      if (numeroInput) numeroInput.value = digits;
      goTo(digits);
    }
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-tree-verificar]'), initVerificar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
