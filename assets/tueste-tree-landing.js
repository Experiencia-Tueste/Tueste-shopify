(function () {
  'use strict';

  function initTree(root) {
    if (!root || root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    var steps = Array.from(root.querySelectorAll('[data-step]'));
    var currentStep = 0;
    var selectedTree = null;
    var planted = false;
    var holdTimer = null;
    var holdStartedAt = 0;
    var lastHoldTick = -1;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var holdDuration = reducedMotion ? 600 : 1500;
    var guardianInput = root.querySelector('[data-guardian-name]');
    var treeNameInput = root.querySelector('[data-tree-name]');
    var quantityInput = root.querySelector('[data-quantity]');
    var priceText = root.dataset.price || 'USD 100';
    var storageKey = root.dataset.storageKey || 'tueste-tree-guardian';
    var toast = root.querySelector('[data-toast]');
    var buyForm = root.querySelector('[data-tree-buy-form]');
    var propertyGuardianInput = root.querySelector('[data-property-guardian]');
    var propertyTreeNumberInput = root.querySelector('[data-property-tree-number]');
    var propertyBadgeInput = root.querySelector('[data-property-badge]');
    var certificateArticle = root.querySelector('[data-certificate]');
    var downloadCertificateButton = root.querySelector('[data-download-certificate]');

    var MAX_QUANTITY = 30;
    var GRID_SIZE = 200;
    var GRID_SEED = 1840;
    var TAKEN_RATIO = 0.35;
    var HOLD_CIRCUMFERENCE = 572;
    var VARIETIES = ['Caturra', 'Castillo', 'Geisha', 'Bourbon rosado', 'Tabi', 'Pink Bourbon', 'Colombia', 'Típica'];

    function parseNumber(value) {
      var normalized = String(value || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      var number = Number(normalized.replace(/[^\d.-]/g, ''));
      return Number.isFinite(number) ? number : 0;
    }

    function formatNumber(value) {
      return new Intl.NumberFormat('es-CO').format(value);
    }

    function mulberry(seed) {
      var a = seed;
      return function () {
        a |= 0;
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /* founder_count / founder_total ahora son settings "number" (ver schema),
       así que llegan como dígitos limpios, sin separadores que adivinar:
       Number() directo, sin pasar por parseNumber() (que asume es-CO y
       rompería un decimal legítimo como "3570.5" al tratar el punto como
       separador de miles). */
    var totalTrees = Number(root.dataset.totalFounders);
    var takenTrees = Number(root.dataset.initialFounders);
    if (!totalTrees || totalTrees <= 0) totalTrees = 10200;
    if (!takenTrees || takenTrees < 0) takenTrees = 0;
    if (takenTrees >= totalTrees) takenTrees = totalTrees - 1;

    function scrollToElement(element) {
      if (!element) return;
      element.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('is-visible');
      window.clearTimeout(showToast.timer);
      showToast.timer = window.setTimeout(function () {
        toast.classList.remove('is-visible');
      }, 3200);
    }

    function getTreeLabel(number) {
      return 'ÁRBOL N.° ' + String(number).padStart(6, '0');
    }

    function getQuantity() {
      var raw = quantityInput ? quantityInput.value : 1;
      return Math.max(1, Math.min(MAX_QUANTITY, parseInt(raw, 10) || 1));
    }

    /* counters */
    function countTo(el, target, duration) {
      if (!el) return;
      if (reducedMotion) {
        el.textContent = formatNumber(target);
        return;
      }
      var start = performance.now();
      var from = Math.max(0, target - 480);
      function frame(timestamp) {
        var k = Math.min(1, (timestamp - start) / duration);
        var eased = 1 - Math.pow(1 - k, 3);
        var value = Math.round(from + (target - from) * eased);
        el.textContent = formatNumber(value);
        if (k < 1) window.requestAnimationFrame(frame);
      }
      window.requestAnimationFrame(frame);
    }

    function updateProgress() {
      var percentage = totalTrees > 0 ? Math.min(100, (takenTrees / totalTrees) * 100) : 0;
      root.querySelectorAll('[data-progress-meter]').forEach(function (meter) {
        meter.style.width = percentage + '%';
      });
      root.querySelectorAll('[data-founder-count]').forEach(function (node) {
        countTo(node, takenTrees, 1500);
      });
    }

    /* header steps */
    function updateStepDots() {
      root.querySelectorAll('[data-step-dot]').forEach(function (dot) {
        var dotStep = Number(dot.dataset.stepDot);
        dot.classList.toggle('is-done', dotStep < currentStep);
        dot.classList.toggle('is-current', dotStep === currentStep);
      });
    }

    function showStep(stepIndex) {
      currentStep = Math.max(0, Math.min(stepIndex, steps.length - 1));
      steps.forEach(function (step, index) {
        step.hidden = index !== currentStep;
      });
      updateStepDots();
      scrollToElement(steps[currentStep]);
      var heading = steps[currentStep].querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        window.setTimeout(function () { heading.focus({ preventScroll: true }); }, reducedMotion ? 0 : 250);
      }
    }

    /* lote grid: 200 nodos, semilla determinística (mulberry) para que el
       patrón de tomados/libres coincida con la referencia y no forme diagonales
       detectables. El número real de árbol se sortea aparte (Fisher-Yates,
       aleatoriedad nueva en cada carga de página) sobre el rango todavía
       disponible y se reparte 1:1 a los nodos libres, así ningún nodo repite
       número por construcción (ver assignTreeNumbers). */
    function buildTreeGrid() {
      var grid = root.querySelector('[data-tree-grid]');
      if (!grid) return;
      var random = mulberry(GRID_SEED);
      var fragment = document.createDocumentFragment();
      var freeButtons = [];
      for (var i = 0; i < GRID_SIZE; i++) {
        var taken = random() < TAKEN_RATIO;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tt-tree-node ' + (taken ? 'is-taken' : 'is-free');
        button.setAttribute('data-tree-node', '');
        button.dataset.treeIndex = String(i);
        button.dataset.treeStatus = taken ? 'taken' : 'free';
        button.setAttribute('aria-label', taken ? 'Con guardián' : 'Libre · toca para elegirlo');
        if (taken) {
          button.disabled = true;
          button.setAttribute('aria-disabled', 'true');
        } else {
          freeButtons.push(button);
        }
        fragment.appendChild(button);
      }
      assignTreeNumbers(freeButtons);
      grid.appendChild(fragment);
    }

    /* Baraja el rango real todavía disponible (takenTrees+1..totalTrees) y lo
       reparte 1:1 a los nodos libres en el orden en que aparecen: por
       construcción, dos nodos nunca reciben el mismo número. takenTrees es
       siempre menor que totalTrees (ver el clamp más arriba), así que el
       pool nunca queda vacío. Si algún día hubiera menos árboles reales que
       nodos libres (inventario casi agotado), el sobrante da la vuelta sobre
       la misma baraja en lugar de colapsar todos los nodos al mismo número. */
    function assignTreeNumbers(freeButtons) {
      var pool = [];
      for (var n = takenTrees + 1; n <= totalTrees; n++) pool.push(n);
      for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = pool[i];
        pool[i] = pool[j];
        pool[j] = temp;
      }
      freeButtons.forEach(function (button, index) {
        button.dataset.treeNumber = String(pool[index % pool.length]);
      });
    }

    function selectTree(button) {
      if (!button || button.dataset.treeStatus !== 'free') return;
      root.querySelectorAll('[data-tree-node].is-mine').forEach(function (node) {
        node.classList.remove('is-mine');
        node.setAttribute('aria-label', 'Libre · toca para elegirlo');
      });
      var index = Number(button.dataset.treeIndex);
      var treeNumber = Number(button.dataset.treeNumber);
      var variety = VARIETIES[index % VARIETIES.length];
      button.classList.add('is-mine');
      button.setAttribute('aria-label', 'El tuyo · ' + getTreeLabel(treeNumber));
      selectedTree = treeNumber;
      var selectionNumber = root.querySelector('[data-selection-number]');
      var selectionVariety = root.querySelector('[data-selection-variety]');
      if (selectionNumber) selectionNumber.textContent = getTreeLabel(selectedTree);
      if (selectionVariety) selectionVariety.textContent = variety;
      var toPlant = root.querySelector('[data-to-plant]');
      if (toPlant) toPlant.disabled = false;
    }

    /* siembra: sostener para plantar */
    function resetHoldProgress() {
      var progress = root.querySelector('[data-hold-progress]');
      if (progress) progress.style.strokeDashoffset = String(HOLD_CIRCUMFERENCE);
    }

    function burst() {
      if (reducedMotion) return;
      var canvas = root.querySelector('[data-seeds]');
      if (!canvas) return;
      var box = canvas.parentElement;
      var ctx = canvas.getContext('2d');
      if (!ctx || !box) return;
      canvas.width = box.clientWidth;
      canvas.height = box.clientHeight;
      var cx = canvas.width / 2;
      var cy = canvas.height / 2 + 20;
      var colors = ['#FBA922', '#E23A5A', '#3FBF5A', '#B694FF', '#FFE8BF'];
      var particles = [];
      for (var i = 0; i < 90; i++) {
        var angle = Math.random() * Math.PI * 2;
        var velocity = 2 + Math.random() * 6;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 3,
          r: 2 + Math.random() * 4,
          c: colors[i % colors.length],
          l: 1
        });
      }
      var tick = 0;
      function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var alive = false;
        particles.forEach(function (p) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.16;
          p.vx *= 0.985;
          p.l -= 0.011;
          if (p.l > 0) {
            alive = true;
            ctx.globalAlpha = Math.max(0, p.l);
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, p.r, p.r * 1.5, p.vx * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        tick += 1;
        if (alive && tick < 220) {
          window.requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      window.requestAnimationFrame(frame);
    }

    function finishPlanting() {
      if (planted) return;
      planted = true;
      window.cancelAnimationFrame(holdTimer);
      var planting = root.querySelector('[data-planting]');
      var plantedMessage = root.querySelector('[data-planted-message]');
      var holdButton = root.querySelector('[data-hold-to-plant]');
      if (planting) planting.classList.add('is-planted');
      if (plantedMessage) plantedMessage.hidden = false;
      if (holdButton) {
        holdButton.classList.remove('is-pressing');
        holdButton.disabled = true;
      }
      resetHoldProgress();
      burst();
      if (navigator.vibrate) navigator.vibrate([20, 40, 60]);
    }

    function animateHold(timestamp) {
      var elapsed = timestamp - holdStartedAt;
      var progressValue = Math.min(1, elapsed / holdDuration);
      var progress = root.querySelector('[data-hold-progress]');
      if (progress) progress.style.strokeDashoffset = String(HOLD_CIRCUMFERENCE - (HOLD_CIRCUMFERENCE * progressValue));
      if (navigator.vibrate) {
        var tick = Math.floor(progressValue * 10);
        if (tick > 0 && tick !== lastHoldTick) {
          lastHoldTick = tick;
          navigator.vibrate(6);
        }
      }
      if (progressValue >= 1) {
        finishPlanting();
        return;
      }
      holdTimer = window.requestAnimationFrame(animateHold);
    }

    function startHolding(event) {
      if (planted || (event.type === 'keydown' && event.key !== ' ' && event.key !== 'Enter')) return;
      if (event.type === 'keydown') event.preventDefault();
      var holdButton = root.querySelector('[data-hold-to-plant]');
      if (!holdButton || holdButton.classList.contains('is-pressing')) return;
      holdButton.classList.add('is-pressing');
      holdStartedAt = performance.now();
      lastHoldTick = -1;
      holdTimer = window.requestAnimationFrame(animateHold);
    }

    function stopHolding(event) {
      if (event && event.type === 'keyup' && event.key !== ' ' && event.key !== 'Enter') return;
      if (planted) return;
      window.cancelAnimationFrame(holdTimer);
      holdTimer = null;
      lastHoldTick = -1;
      var holdButton = root.querySelector('[data-hold-to-plant]');
      if (holdButton) holdButton.classList.remove('is-pressing');
      resetHoldProgress();
    }

    /* WhatsApp: reusa el patrón data-whatsapp / data-whatsapp-link de Tueste Unity */
    function updateWhatsAppLink() {
      var link = root.querySelector('[data-whatsapp-link]');
      if (!link) return;
      var number = (root.dataset.whatsapp || '').replace(/[^0-9]/g, '');
      if (!number) return;
      var guardian = guardianInput ? guardianInput.value.trim() : '';
      var message = 'Hola, quiero adoptar más de 30 árboles en Tueste Tree' + (guardian ? ' — ' + guardian : '');
      link.href = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
    }

    /* carrito: las properties se llenan siempre desde lo que ya se ve en el
       certificado, nunca se recalculan aparte, para que el line item quede
       idéntico a lo que el comprador vio en pantalla. */
    function syncBuyFormProperties() {
      if (!propertyGuardianInput && !propertyTreeNumberInput && !propertyBadgeInput) return;
      var certificateName = root.querySelector('[data-certificate-name]');
      var certificateNumber = root.querySelector('[data-certificate-number]');
      var currentBadgeName = root.querySelector('[data-current-badge-name]');
      if (propertyGuardianInput) {
        var guardianValue = certificateName ? certificateName.textContent.trim() : '';
        propertyGuardianInput.value = guardianValue && guardianValue !== '—' ? guardianValue : '';
      }
      if (propertyTreeNumberInput) {
        var numberValue = certificateNumber ? certificateNumber.textContent.trim() : '';
        propertyTreeNumberInput.value = numberValue || 'Pendiente de asignación';
      }
      if (propertyBadgeInput) {
        var badgeValue = currentBadgeName ? currentBadgeName.textContent.trim() : '';
        propertyBadgeInput.value = badgeValue || 'Semilla';
      }
    }

    function updateCertificate() {
      var guardian = guardianInput ? guardianInput.value.trim() : '';
      var treeName = treeNameInput ? treeNameInput.value.trim() : '';
      var certificateName = root.querySelector('[data-certificate-name]');
      var certificateTree = root.querySelector('[data-certificate-tree]');
      var certificateQuantity = root.querySelector('[data-certificate-quantity]');
      var certificateDate = root.querySelector('[data-certificate-date]');
      var certificateNumber = root.querySelector('[data-certificate-number]');
      var quantity = getQuantity();
      var first = selectedTree || (takenTrees + 1);
      if (certificateName) certificateName.textContent = guardian || '—';
      if (certificateTree) certificateTree.textContent = treeName || getTreeLabel(first);
      if (certificateQuantity) {
        certificateQuantity.textContent = quantity + (quantity === 1 ? ' árbol fundacional' : ' árboles fundacionales');
      }
      if (certificateDate) {
        certificateDate.textContent = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
      }
      if (certificateNumber) {
        var last = Math.min(totalTrees, first + quantity - 1);
        certificateNumber.textContent = quantity > 1
          ? 'ÁRBOLES N.° ' + String(first).padStart(6, '0') + ' – ' + String(last).padStart(6, '0')
          : getTreeLabel(first);
      }
      updateWhatsAppLink();
      syncBuyFormProperties();
    }

    function updateBadgeState(quantity) {
      var cards = Array.from(root.querySelectorAll('[data-badge-card]'));
      /* Paso 1: decidir, sin tocar el DOM todavía, cuál tarjeta es "la
         actual" (el umbral más alto que la cantidad cumple). Paso 2: recién
         con ese valor ya fijo, iterar para aplicar la clase. Si ambos pasos
         se mezclan en un solo forEach, "current" se reasigna mientras se lee
         de vuelta y cualquier tarjeta cuyo umbral se cumpla queda marcada. */
      var current = cards[0];
      cards.forEach(function (card) {
        var threshold = parseNumber(card.dataset.badgeThreshold);
        if (quantity >= threshold) current = card;
      });
      cards.forEach(function (card) {
        card.classList.toggle('is-current', card === current);
      });
      var image = current ? current.querySelector('img') : null;
      var name = current ? current.querySelector('h3') : null;
      var description = current ? current.querySelector('div') : null;
      var currentImage = root.querySelector('[data-current-badge-image]');
      var currentName = root.querySelector('[data-current-badge-name]');
      var currentDescription = root.querySelector('[data-current-badge-description]');
      if (currentImage && image) {
        currentImage.src = image.src;
        currentImage.alt = image.alt;
      }
      if (currentName && name) currentName.textContent = name.textContent;
      if (currentDescription && description) currentDescription.textContent = description.textContent;
    }

    function updateQuantity(value) {
      var quantity = Math.max(1, Math.min(MAX_QUANTITY, parseInt(value, 10) || 1));
      if (quantityInput) quantityInput.value = quantity;
      var basePrice = parseNumber(priceText);
      var currency = priceText.replace(/[\d.,\s]/g, '') || 'USD';
      var total = root.querySelector('[data-quantity-total]');
      var label = root.querySelector('[data-quantity-label]');
      var agentNote = root.querySelector('[data-agent-note]');
      var minus = root.querySelector('[data-quantity-minus]');
      var plus = root.querySelector('[data-quantity-plus]');
      if (total) total.textContent = currency + ' ' + formatNumber(basePrice * quantity);
      if (label) label.textContent = '· ' + quantity + (quantity === 1 ? ' árbol fundacional' : ' árboles fundacionales');
      if (agentNote) agentNote.hidden = quantity < MAX_QUANTITY;
      if (minus) minus.disabled = quantity <= 1;
      if (plus) plus.disabled = quantity >= MAX_QUANTITY;
      updateBadgeState(quantity);
      if (planted) updateCertificate();
    }

    function restoreGuardian() {
      if (!guardianInput) return;
      try {
        var savedGuardian = window.localStorage.getItem(storageKey);
        if (savedGuardian) guardianInput.value = savedGuardian;
      } catch (error) {
        return;
      }
    }

    function persistGuardian() {
      if (!guardianInput) return;
      try {
        if (guardianInput.value.trim()) window.localStorage.setItem(storageKey, guardianInput.value.trim());
      } catch (error) {
        return;
      }
    }

    root.querySelectorAll('[data-enter-finca]').forEach(function (button) {
      button.addEventListener('click', function () { showStep(1); });
    });

    buildTreeGrid();
    var treeGrid = root.querySelector('[data-tree-grid]');
    if (treeGrid) {
      treeGrid.addEventListener('click', function (event) {
        var button = event.target.closest('[data-tree-node]');
        if (button) selectTree(button);
      });
    }

    var toPlant = root.querySelector('[data-to-plant]');
    if (toPlant) toPlant.addEventListener('click', function () { if (selectedTree) showStep(2); });

    var holdButton = root.querySelector('[data-hold-to-plant]');
    if (holdButton) {
      holdButton.addEventListener('pointerdown', startHolding);
      holdButton.addEventListener('pointerup', stopHolding);
      holdButton.addEventListener('pointerleave', stopHolding);
      holdButton.addEventListener('pointercancel', stopHolding);
      holdButton.addEventListener('keydown', startHolding);
      holdButton.addEventListener('keyup', stopHolding);
      holdButton.addEventListener('blur', stopHolding);
    }

    var toName = root.querySelector('[data-to-name]');
    if (toName) toName.addEventListener('click', function () { showStep(3); });

    function refreshNameButton() {
      var toCertificate = root.querySelector('[data-to-certificate]');
      if (toCertificate) toCertificate.disabled = !guardianInput || guardianInput.value.trim().length < 2;
    }

    if (guardianInput) {
      guardianInput.addEventListener('input', function () {
        refreshNameButton();
        updateWhatsAppLink();
      });
    }
    var toCertificate = root.querySelector('[data-to-certificate]');
    if (toCertificate) {
      toCertificate.addEventListener('click', function () {
        if (!guardianInput || guardianInput.value.trim().length < 2) return;
        persistGuardian();
        updateCertificate();
        showStep(4);
      });
    }

    var minus = root.querySelector('[data-quantity-minus]');
    var plus = root.querySelector('[data-quantity-plus]');
    if (minus) minus.addEventListener('click', function () { updateQuantity(Number(quantityInput.value) - 1); });
    if (plus) plus.addEventListener('click', function () { updateQuantity(Number(quantityInput.value) + 1); });
    if (quantityInput) {
      quantityInput.addEventListener('input', function () {
        if (Number(quantityInput.value) > MAX_QUANTITY) {
          updateQuantity(MAX_QUANTITY);
          showToast('Máximo 30 árboles por adopción en línea. Para más, habla con nuestro agente.');
          return;
        }
        updateQuantity(quantityInput.value);
      });
      quantityInput.addEventListener('change', function () { updateQuantity(quantityInput.value); });
    }

    root.querySelectorAll('[data-badge-card]').forEach(function (card) {
      card.addEventListener('click', function () {
        updateQuantity(parseNumber(card.dataset.badgeThreshold));
        if (currentStep !== 4) showToast('Cantidad guardada para tu recorrido editorial.');
      });
    });

    var shareButton = root.querySelector('[data-share]');
    if (shareButton) {
      shareButton.addEventListener('click', function () {
        var shareData = { title: document.title, text: 'Conoce Tueste Tree', url: window.location.href };
        if (navigator.share) {
          navigator.share(shareData).catch(function () {});
          return;
        }
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).then(function () {
            showToast('Enlace copiado.');
          }).catch(function () {
            showToast('Copia el enlace desde la barra del navegador.');
          });
          return;
        }
        showToast('Copia el enlace desde la barra del navegador.');
      });
    }

    /* el submit real lo maneja el custom element product-form (theme.js);
       esta captura solo garantiza que las hidden properties queden frescas
       justo antes, sin importar el orden de los listeners de submit. */
    if (buyForm) {
      buyForm.addEventListener('submit', syncBuyFormProperties, true);
    }

    if (downloadCertificateButton && certificateArticle) {
      downloadCertificateButton.addEventListener('click', function () {
        if (!window.TuesteTreeCertificate || downloadCertificateButton.disabled) return;
        var text = function (selector) {
          var node = certificateArticle.querySelector(selector);
          return node ? node.textContent.trim() : '';
        };
        var logoImage = certificateArticle.querySelector('.tt-certificate-logo');
        var illustration = certificateArticle.querySelector('img:not(.tt-certificate-logo)');
        var originRow = certificateArticle.querySelectorAll('dl > div');
        var originValue = originRow.length ? originRow[originRow.length - 1].querySelector('dd') : null;
        var footerNote = document.querySelector('.tt-editorial-footer p');

        downloadCertificateButton.disabled = true;
        window.TuesteTreeCertificate.download({
          logo: logoImage ? logoImage.src : '',
          image: illustration ? illustration.src : '',
          kicker: text('.tt-certificate-kicker'),
          subtitle: text('.tt-certificate-subtitle'),
          heading: text('h3'),
          lot: text('.tt-certificate-lot'),
          treeNumber: text('[data-certificate-number]'),
          guardian: text('[data-certificate-name]'),
          treeName: text('[data-certificate-tree]'),
          quantity: text('[data-certificate-quantity]'),
          date: text('[data-certificate-date]'),
          origin: originValue ? originValue.textContent.trim() : '',
          note: text('.tt-certificate-note'),
          footer: footerNote ? footerNote.textContent.trim() : ''
        }).catch(function () {
          showToast('No pudimos generar el certificado. Intenta de nuevo.');
        }).then(function () {
          downloadCertificateButton.disabled = false;
        });
      });
    }

    restoreGuardian();
    refreshNameButton();
    updateWhatsAppLink();
    updateStepDots();
    updateProgress();
    updateQuantity(quantityInput ? quantityInput.value : 1);
    syncBuyFormProperties();
  }

  function boot() {
    document.querySelectorAll('[data-tueste-tree]').forEach(initTree);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
})();
