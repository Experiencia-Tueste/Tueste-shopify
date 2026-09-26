(function () {
  'use strict';

  var SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  var NOTE_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
  var BASE_FREQUENCY = 220;

  var MOODS = [
    { id: 'amanecer', name: 'Amanecer', sub: 'luminosa, fresca', notes: ['naranja', 'panela', 'flores blancas'], bars: [82, 55, 64] },
    { id: 'tierra', name: 'Tierra', sub: 'cálida, profunda', notes: ['cacao', 'nueces tostadas', 'caramelo'], bars: [38, 84, 78] },
    { id: 'noche', name: 'Noche', sub: 'intensa, elegante', notes: ['frutos rojos', 'vino', 'chocolate oscuro'], bars: [60, 80, 58] },
    { id: 'fiesta', name: 'Fiesta', sub: 'vibrante, dulce', notes: ['frutas tropicales', 'miel', 'jazmín'], bars: [76, 60, 86] }
  ];
  var BAR_LABELS = ['Acidez', 'Cuerpo', 'Dulzor'];

  var TIMBRES = [
    { id: 'cristal', name: 'Cristal', sub: 'campanas', wave: 'triangle' },
    { id: 'madera', name: 'Madera', sub: 'marimba', wave: 'sine' },
    { id: 'bruma', name: 'Bruma', sub: 'pad suave', wave: 'sawtooth' }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character];
    });
  }

  function motifFor(name) {
    var letters = String(name || 'tueste').toLowerCase().replace(/[^a-zñáéíóú]/g, '');
    var degrees = [];
    for (var i = 0; i < Math.min(letters.length, 10); i++) {
      degrees.push(SCALE[letters.charCodeAt(i) % SCALE.length]);
    }
    if (degrees.length < 3) degrees = degrees.concat([0, 4, 7]);
    return degrees;
  }

  function noteNamesFor(degrees) {
    return degrees.map(function (degree) { return NOTE_NAMES[degree % 12]; });
  }

  function findById(list, id) {
    var found = null;
    list.forEach(function (item) { if (item.id === id) found = item; });
    return found;
  }

  function initUnity(root) {
    if (root.dataset.initialized === 'true') return;
    root.dataset.initialized = 'true';

    var wizard = root.querySelector('[data-unity-wizard]');
    var form = root.querySelector('form');
    if (!wizard || !form) return;

    var steps = Array.from(wizard.querySelectorAll('.tu-unity__step'));
    var dotsHost = wizard.querySelector('[data-wizard-dots]');
    var prevButton = wizard.querySelector('[data-wizard-prev]');
    var nextButton = wizard.querySelector('[data-wizard-next]');
    var currentStep = 0;

    if (dotsHost) {
      dotsHost.innerHTML = steps.map(function (_, index) {
        return '<button type="button" class="tu-unity__dot" data-dot-index="' + index + '" aria-label="Ir al paso ' + (index + 1) + '"></button>';
      }).join('');
    }
    var dots = dotsHost ? Array.from(dotsHost.querySelectorAll('[data-dot-index]')) : [];

    function showStep(index, options) {
      options = options || {};
      currentStep = Math.max(0, Math.min(steps.length - 1, index));
      steps.forEach(function (step, i) { step.hidden = i !== currentStep; });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === currentStep);
        if (i === currentStep) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      if (prevButton) prevButton.disabled = currentStep === 0;
      if (nextButton) nextButton.hidden = currentStep === steps.length - 1;
      if (options.scroll) {
        var target = root.querySelector('#taller');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (options.focus) {
        var heading = steps[currentStep] ? steps[currentStep].querySelector('h3') : null;
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus({ preventScroll: true });
        }
      }
    }

    if (prevButton) prevButton.addEventListener('click', function () { showStep(currentStep - 1, { scroll: true, focus: true }); });
    if (nextButton) nextButton.addEventListener('click', function () { showStep(currentStep + 1, { scroll: true, focus: true }); });
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () { showStep(index, { scroll: true, focus: true }); });
    });

    root.querySelectorAll('[data-unity-goto-step]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        var index = parseInt(link.getAttribute('data-unity-goto-step'), 10);
        if (isNaN(index)) return;
        event.preventDefault();
        showStep(index, { scroll: true, focus: true });
      });
    });

    /* ---------- paso 1 · el camino ---------- */
    var pathButtons = Array.from(wizard.querySelectorAll('[data-path-option]'));
    var qtyInput = wizard.querySelector('[data-config="quantity"]');
    var qtyHint = wizard.querySelector('[data-qty-hint]');
    var qtyMinus = wizard.querySelector('[data-qty-minus]');
    var qtyPlus = wizard.querySelector('[data-qty-plus]');
    var bagPreview = root.querySelector('[data-bag-preview]');
    var bagStamp = root.querySelector('[data-bag-stamp]');

    function findPathButton(id) {
      var found = null;
      pathButtons.forEach(function (button) { if (button.getAttribute('data-path-option') === id) found = button; });
      return found;
    }

    var firstPath = pathButtons[0];
    var state = {
      pathTitle: firstPath ? firstPath.getAttribute('data-title') : '',
      bagColor: firstPath ? (firstPath.getAttribute('data-color') || '#8d493d') : '#8d493d',
      minQty: firstPath ? (parseInt(firstPath.getAttribute('data-min'), 10) || 50) : 50,
      qtyStep: firstPath ? (parseInt(firstPath.getAttribute('data-qty-step'), 10) || 10) : 10,
      qtyUnit: firstPath ? (firstPath.getAttribute('data-unit') || 'bolsas') : 'bolsas',
      quantity: 0,
      company: '',
      logoName: '',
      mood: MOODS[0].id,
      timbre: 'madera',
      trees: false
    };
    state.quantity = state.minQty;

    function clampQuantity(value) {
      var step = state.qtyStep || 10;
      var stepped = Math.round(value / step) * step;
      if (!isFinite(stepped) || stepped < state.minQty) stepped = state.minQty;
      return Math.min(5000, stepped);
    }

    function selectPath(id, options) {
      options = options || {};
      var button = findPathButton(id);
      if (!button) return;
      pathButtons.forEach(function (candidate) {
        candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
      });
      state.pathTitle = button.getAttribute('data-title') || '';
      state.bagColor = button.getAttribute('data-color') || '#8d493d';
      state.minQty = parseInt(button.getAttribute('data-min'), 10) || 50;
      state.qtyStep = parseInt(button.getAttribute('data-qty-step'), 10) || 10;
      state.qtyUnit = button.getAttribute('data-unit') || 'bolsas';
      state.quantity = clampQuantity(state.quantity);
      renderAll();
      if (options.scroll) showStep(0, { scroll: true, focus: !!options.focus });
    }

    pathButtons.forEach(function (button) {
      button.addEventListener('click', function () { selectPath(button.getAttribute('data-path-option')); });
    });

    root.querySelectorAll('[data-path-jump]').forEach(function (link) {
      var id = link.getAttribute('data-path-jump');
      var matches = pathButtons.some(function (button) { return button.getAttribute('data-path-option') === id; });
      if (!matches) return;
      link.addEventListener('click', function (event) {
        event.preventDefault();
        selectPath(id, { scroll: true, focus: true });
      });
    });

    /* ---------- paso 2 · marca en la bolsa ---------- */
    var companyInput = wizard.querySelector('[data-config="company"]');
    var logoInput = wizard.querySelector('[data-logo-input]');
    var logoPreview = root.querySelector('[data-logo-preview]');
    var logoClear = wizard.querySelector('[data-logo-clear]');
    var logoHint = wizard.querySelector('[data-logo-hint]');
    var logoHintDefault = logoHint ? logoHint.textContent : '';

    if (companyInput) {
      companyInput.addEventListener('input', function () {
        state.company = companyInput.value.trim();
        renderAll();
      });
    }

    if (logoInput) {
      logoInput.addEventListener('change', function () {
        var file = logoInput.files && logoInput.files[0];
        if (!file || file.type.indexOf('image/') !== 0) return;
        var reader = new FileReader();
        reader.addEventListener('load', function () {
          state.logoName = file.name;
          if (logoPreview) { logoPreview.src = reader.result; logoPreview.hidden = false; }
          if (logoHint) logoHint.textContent = file.name;
          if (logoClear) logoClear.hidden = false;
          renderAll();
        });
        reader.readAsDataURL(file);
      });
    }
    if (logoClear) {
      logoClear.addEventListener('click', function () {
        state.logoName = '';
        if (logoInput) logoInput.value = '';
        if (logoPreview) { logoPreview.removeAttribute('src'); logoPreview.hidden = true; }
        if (logoHint) logoHint.textContent = logoHintDefault;
        logoClear.hidden = true;
        renderAll();
      });
    }

    /* ---------- paso 3 · la taza ---------- */
    var moodHost = wizard.querySelector('[data-mood-options]');
    if (moodHost) {
      moodHost.innerHTML = MOODS.map(function (mood, index) {
        return '<button type="button" class="tu-unity__option" data-mood-option="' + mood.id + '" aria-pressed="' + (index === 0 ? 'true' : 'false') + '"><strong>' + escapeHtml(mood.name) + '</strong><small>' + escapeHtml(mood.sub) + '</small></button>';
      }).join('');
    }
    var moodButtons = moodHost ? Array.from(moodHost.querySelectorAll('[data-mood-option]')) : [];
    moodButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        state.mood = button.getAttribute('data-mood-option');
        moodButtons.forEach(function (candidate) { candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false'); });
        renderAll();
      });
    });

    function moodNow() {
      return findById(MOODS, state.mood) || MOODS[0];
    }

    function renderMoodProfile() {
      var mood = moodNow();
      var notesHost = wizard.querySelector('[data-mood-notes]');
      var barsHost = wizard.querySelector('[data-mood-bars]');
      if (notesHost) notesHost.innerHTML = mood.notes.map(function (note) { return '<span>' + escapeHtml(note) + '</span>'; }).join('');
      if (barsHost) {
        barsHost.innerHTML = BAR_LABELS.map(function (label, index) {
          var value = mood.bars[index];
          return '<div class="tu-unity__bar"><span>' + label + '</span><i style="--v:' + value + '%"></i><em>' + Math.round(value / 10) + '/10</em></div>';
        }).join('');
      }
    }

    /* ---------- paso 4 · la firma sonora ---------- */
    var timbreHost = wizard.querySelector('[data-timbre-options]');
    if (timbreHost) {
      timbreHost.innerHTML = TIMBRES.map(function (timbre) {
        return '<button type="button" class="tu-unity__option" data-timbre-option="' + timbre.id + '" aria-pressed="' + (timbre.id === state.timbre ? 'true' : 'false') + '"><strong>' + escapeHtml(timbre.name) + '</strong><small>' + escapeHtml(timbre.sub) + '</small></button>';
      }).join('');
    }
    var timbreButtons = timbreHost ? Array.from(timbreHost.querySelectorAll('[data-timbre-option]')) : [];
    timbreButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        state.timbre = button.getAttribute('data-timbre-option');
        timbreButtons.forEach(function (candidate) { candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false'); });
        renderAll();
      });
    });

    function timbreNow() {
      return findById(TIMBRES, state.timbre) || TIMBRES[1];
    }

    var audioContext = null;
    var playButton = wizard.querySelector('[data-play-signature]');
    var audioStatus = wizard.querySelector('[data-audio-status]');

    function playSignature() {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        if (audioStatus) audioStatus.textContent = 'Tu navegador no permite reproducir audio.';
        return;
      }
      try {
        audioContext = audioContext || new AudioContextClass();
      } catch (error) {
        if (audioStatus) audioStatus.textContent = 'Tu navegador no permite reproducir audio.';
        return;
      }
      if (audioContext.state === 'suspended') audioContext.resume();
      if (audioStatus) audioStatus.textContent = '';

      var timbre = timbreNow();
      var degrees = motifFor(state.company);
      var noteDuration = 0.4;
      var noteGap = 0.22;
      var startTime = audioContext.currentTime + 0.05;

      var master = audioContext.createGain();
      master.gain.value = 0.22;
      master.connect(audioContext.destination);

      degrees.forEach(function (degree, index) {
        var oscillator = audioContext.createOscillator();
        var gain = audioContext.createGain();
        oscillator.type = timbre.wave;
        oscillator.frequency.value = BASE_FREQUENCY * Math.pow(2, degree / 12);
        var noteStart = startTime + index * noteGap;
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(1, noteStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);
        oscillator.connect(gain);
        gain.connect(master);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + noteDuration + 0.05);
      });

      if (playButton) {
        playButton.classList.add('is-playing');
        var totalDuration = (degrees.length * noteGap + noteDuration) * 1000;
        clearTimeout(playButton._unityTimer);
        playButton._unityTimer = setTimeout(function () { playButton.classList.remove('is-playing'); }, totalDuration);
      }
    }

    if (playButton) playButton.addEventListener('click', playSignature);

    /* ---------- paso 5 · volumen y Tueste Tree ---------- */
    function renderQuantity() {
      if (qtyInput) {
        qtyInput.min = state.minQty;
        qtyInput.step = state.qtyStep;
        qtyInput.value = state.quantity;
      }
      if (qtyHint) qtyHint.textContent = 'Mínimo del camino: ' + state.minQty.toLocaleString('es-CO') + ' ' + state.qtyUnit + '.';
    }

    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        state.quantity = clampQuantity(parseInt(qtyInput.value, 10) || state.minQty);
        renderAll();
      });
    }
    if (qtyMinus) qtyMinus.addEventListener('click', function () { state.quantity = clampQuantity(state.quantity - state.qtyStep); renderAll(); });
    if (qtyPlus) qtyPlus.addEventListener('click', function () { state.quantity = clampQuantity(state.quantity + state.qtyStep); renderAll(); });

    var treesCheckbox = wizard.querySelector('[data-config="trees"]');
    var treesHint = wizard.querySelector('[data-trees-hint]');
    var treesLink = wizard.querySelector('[data-trees-link]');
    if (treesLink) treesLink.href = root.dataset.treeUrl || treesLink.href;
    if (treesCheckbox) {
      treesCheckbox.addEventListener('change', function () {
        state.trees = treesCheckbox.checked;
        if (treesHint) treesHint.hidden = !treesCheckbox.checked;
        renderAll();
      });
    }

    /* ---------- paso 6 · contacto ---------- */
    var contactCompanyField = root.querySelector('[data-contact-company]');
    var contactMessageField = root.querySelector('[data-contact-message]');
    if (contactCompanyField) contactCompanyField.addEventListener('input', function () { contactCompanyField.dataset.touched = '1'; });
    if (contactMessageField) contactMessageField.addEventListener('input', function () { contactMessageField.dataset.touched = '1'; });

    form.addEventListener('submit', function () {
      updateSummary();
      if (contactCompanyField && !contactCompanyField.value) contactCompanyField.value = state.company;
    });

    /* ---------- resumen, bolsa y enlaces ---------- */
    function setSummary(key, value) {
      var target = root.querySelector('[data-summary="' + key + '"]');
      if (target) target.textContent = value || '—';
    }

    function buildBrief() {
      var mood = moodNow();
      var timbre = timbreNow();
      var notes = noteNamesFor(motifFor(state.company));
      var lines = [
        'Brief Tueste Unity',
        'Camino: ' + (state.pathTitle || 'Pendiente'),
        'Marca: ' + (state.company || 'Pendiente'),
        'Logo: ' + (state.logoName ? 'Sí (' + state.logoName + ')' : 'Sin logo por ahora'),
        'Taza: ' + mood.name + ' (' + mood.notes.join(', ') + ')',
        'Firma sonora: ' + timbre.name + ' · ' + notes.join(' '),
        'Volumen: ' + state.quantity.toLocaleString('es-CO') + ' ' + state.qtyUnit,
        'Tueste Tree: ' + (state.trees ? 'Sí, quiero sumar árboles' : 'No por ahora')
      ];
      if (state.trees && root.dataset.treeUrl) lines.push('Más sobre Tueste Tree: ' + root.dataset.treeUrl);
      return lines.join('\n');
    }

    function updateSummary() {
      var mood = moodNow();
      var timbre = timbreNow();
      var notes = noteNamesFor(motifFor(state.company));

      setSummary('path', state.pathTitle);
      setSummary('company', state.company);
      setSummary('logo', state.logoName ? 'Subido (' + state.logoName + ')' : 'Sin logo por ahora');
      setSummary('mood', mood.name + ' · ' + mood.notes.join(', '));
      setSummary('signature', timbre.name + ' · ' + notes.join(' '));
      setSummary('quantity', state.quantity.toLocaleString('es-CO') + ' ' + state.qtyUnit);
      setSummary('trees', state.trees ? 'Sí, quiero sumar árboles' : 'No por ahora');

      var label = root.querySelector('[data-bag-label]');
      if (label) label.textContent = state.company || 'Tu marca';
      var meta = root.querySelector('[data-bag-meta]');
      if (meta) meta.textContent = state.pathTitle || 'Café de origen';
      var stampStrong = bagStamp ? bagStamp.querySelector('strong') : null;
      if (stampStrong) stampStrong.textContent = state.pathTitle || 'Tu café';
      if (bagPreview) bagPreview.style.setProperty('--bag-color', state.bagColor);

      var noteRead = wizard.querySelector('[data-notes-read]');
      if (noteRead) noteRead.textContent = notes.join(' · ');

      var brief = buildBrief();
      var briefField = root.querySelector('[data-brief-field]');
      if (briefField) briefField.value = brief;
      if (contactMessageField && !contactMessageField.dataset.touched) contactMessageField.value = brief;
      if (contactCompanyField && !contactCompanyField.dataset.touched) contactCompanyField.value = state.company;
    }

    function updateLinks() {
      var encoded = encodeURIComponent(buildBrief());
      var number = root.dataset.whatsapp || '';
      var email = root.dataset.email || '';
      var whatsappLink = root.querySelector('[data-whatsapp-link]');
      var mailLink = root.querySelector('[data-email-link]');
      if (whatsappLink && number) whatsappLink.href = 'https://wa.me/' + number.replace(/[^0-9]/g, '') + '?text=' + encoded;
      if (mailLink && email) mailLink.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Brief Tueste Unity') + '&body=' + encoded;
    }

    function renderAll() {
      renderQuantity();
      renderMoodProfile();
      updateSummary();
      updateLinks();
    }

    renderAll();
    showStep(0);
  }

  function boot() {
    document.querySelectorAll('[data-tueste-unity]').forEach(initUnity);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  document.addEventListener('shopify:section:load', boot);
}());
