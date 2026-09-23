(function () {
  'use strict';

  var roots = document.querySelectorAll('[data-tueste-tree]');

  roots.forEach(function (root) {
    if (root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    var steps = Array.from(root.querySelectorAll('[data-step]'));
    var currentStep = 0;
    var selectedTree = null;
    var planted = false;
    var holdTimer = null;
    var holdStartedAt = 0;
    var holdDuration = 1500;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var guardianInput = root.querySelector('[data-guardian-name]');
    var treeNameInput = root.querySelector('[data-tree-name]');
    var quantityInput = root.querySelector('[data-quantity]');
    var priceText = root.dataset.price || 'USD 100';
    var storageKey = root.dataset.storageKey || 'tueste-tree-guardian';
    var toast = root.querySelector('[data-toast]');

    function parseNumber(value) {
      var normalized = String(value || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
      var number = Number(normalized.replace(/[^\d.-]/g, ''));
      return Number.isFinite(number) ? number : 0;
    }

    function formatNumber(value) {
      return new Intl.NumberFormat('es-CO').format(value);
    }

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

    function updateProgress() {
      var total = parseNumber(root.dataset.totalFounders);
      var count = parseNumber(root.dataset.initialFounders);
      var percentage = total > 0 ? Math.min(100, (count / total) * 100) : 0;
      root.querySelectorAll('[data-progress-meter]').forEach(function (meter) {
        meter.style.width = percentage + '%';
      });
      root.querySelectorAll('[data-founder-count]').forEach(function (node) {
        node.textContent = root.dataset.initialFounders;
      });
    }

    function showStep(stepIndex) {
      currentStep = Math.max(0, Math.min(stepIndex, steps.length - 1));
      steps.forEach(function (step, index) {
        step.hidden = index !== currentStep;
      });
      scrollToElement(steps[currentStep]);
      var heading = steps[currentStep].querySelector('h1, h2');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        window.setTimeout(function () { heading.focus({ preventScroll: true }); }, reducedMotion ? 0 : 250);
      }
    }

    function getTreeLabel(number) {
      return 'ÁRBOL N.° ' + String(number).padStart(6, '0');
    }

    function selectTree(button) {
      if (!button || button.dataset.treeStatus !== 'free') return;
      root.querySelectorAll('[data-tree-node].is-mine').forEach(function (node) {
        node.classList.remove('is-mine');
        node.setAttribute('aria-label', 'Libre · árbol ' + node.dataset.treeNumber);
      });
      button.classList.add('is-mine');
      button.setAttribute('aria-label', 'El tuyo · árbol ' + button.dataset.treeNumber);
      selectedTree = button.dataset.treeNumber;
      var selectionNumber = root.querySelector('[data-selection-number]');
      var selectionVariety = root.querySelector('[data-selection-variety]');
      if (selectionNumber) selectionNumber.textContent = getTreeLabel(selectedTree);
      if (selectionVariety) {
        var varieties = ['Castillo', 'Caturra', 'Colombia'];
        selectionVariety.textContent = varieties[Number(selectedTree) % varieties.length];
      }
      var toPlant = root.querySelector('[data-to-plant]');
      if (toPlant) toPlant.disabled = false;
    }

    function resetHoldProgress() {
      var progress = root.querySelector('[data-hold-progress]');
      if (progress) progress.style.strokeDashoffset = '572';
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
    }

    function animateHold(timestamp) {
      var elapsed = timestamp - holdStartedAt;
      var progressValue = Math.min(1, elapsed / holdDuration);
      var progress = root.querySelector('[data-hold-progress]');
      if (progress) progress.style.strokeDashoffset = String(572 - (572 * progressValue));
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
      holdTimer = window.requestAnimationFrame(animateHold);
    }

    function stopHolding(event) {
      if (event && event.type === 'keyup' && event.key !== ' ' && event.key !== 'Enter') return;
      if (planted) return;
      window.cancelAnimationFrame(holdTimer);
      holdTimer = null;
      var holdButton = root.querySelector('[data-hold-to-plant]');
      if (holdButton) holdButton.classList.remove('is-pressing');
      resetHoldProgress();
    }

    function updateCertificate() {
      var guardian = guardianInput ? guardianInput.value.trim() : '';
      var treeName = treeNameInput ? treeNameInput.value.trim() : '';
      var certificateName = root.querySelector('[data-certificate-name]');
      var certificateTree = root.querySelector('[data-certificate-tree]');
      var certificateQuantity = root.querySelector('[data-certificate-quantity]');
      var certificateDate = root.querySelector('[data-certificate-date]');
      var certificateNumber = root.querySelector('[data-certificate-number]');
      if (certificateName) certificateName.textContent = guardian || '—';
      if (certificateTree) certificateTree.textContent = treeName || getTreeLabel(selectedTree || '000000');
      if (certificateQuantity) {
        var quantity = Math.max(1, Math.min(1000, parseInt(quantityInput ? quantityInput.value : 1, 10) || 1));
        certificateQuantity.textContent = quantity + (quantity === 1 ? ' árbol fundacional' : ' árboles fundacionales');
      }
      if (certificateDate) {
        certificateDate.textContent = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
      }
      if (certificateNumber) certificateNumber.textContent = getTreeLabel(selectedTree || '000000');
    }

    function updateBadgeState(quantity) {
      var cards = Array.from(root.querySelectorAll('[data-badge-card]'));
      var current = cards[0];
      cards.forEach(function (card) {
        var threshold = parseNumber(card.dataset.badgeThreshold);
        if (quantity >= threshold) current = card;
        card.classList.toggle('is-current', quantity >= threshold && card === current);
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
      var quantity = Math.max(1, Math.min(1000, parseInt(value, 10) || 1));
      if (quantityInput) quantityInput.value = quantity;
      var basePrice = parseNumber(priceText);
      var currency = priceText.replace(/[\d.,\s]/g, '') || 'USD';
      var total = root.querySelector('[data-quantity-total]');
      var label = root.querySelector('[data-quantity-label]');
      var agentNote = root.querySelector('[data-agent-note]');
      if (total) total.textContent = currency + ' ' + formatNumber(basePrice * quantity);
      if (label) label.textContent = '· ' + quantity + (quantity === 1 ? ' árbol fundacional' : ' árboles fundacionales');
      if (agentNote) agentNote.hidden = quantity <= 30;
      updateBadgeState(quantity);
      if (planted) updateCertificate();
    }

    function restoreGuardian() {
      if (!guardianInput) return;
      try {
        var savedGuardian = window.sessionStorage.getItem(storageKey);
        if (savedGuardian) guardianInput.value = savedGuardian;
      } catch (error) {
        return;
      }
    }

    function persistGuardian() {
      if (!guardianInput) return;
      try {
        if (guardianInput.value.trim()) window.sessionStorage.setItem(storageKey, guardianInput.value.trim());
      } catch (error) {
        return;
      }
    }

    root.querySelectorAll('[data-enter-finca]').forEach(function (button) {
      button.addEventListener('click', function () { showStep(1); });
    });

    root.querySelectorAll('[data-tree-node]').forEach(function (button) {
      button.addEventListener('click', function () { selectTree(button); });
    });

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
      if (toCertificate) toCertificate.disabled = !guardianInput || guardianInput.value.trim().length === 0;
    }

    if (guardianInput) guardianInput.addEventListener('input', refreshNameButton);
    var toCertificate = root.querySelector('[data-to-certificate]');
    if (toCertificate) {
      toCertificate.addEventListener('click', function () {
        if (!guardianInput || !guardianInput.value.trim()) return;
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
      quantityInput.addEventListener('input', function () { updateQuantity(quantityInput.value); });
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

    restoreGuardian();
    refreshNameButton();
    updateProgress();
    updateQuantity(quantityInput ? quantityInput.value : 1);
  });
})();
