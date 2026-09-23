(function () {
  'use strict';

  document.querySelectorAll('[data-tueste-unity]').forEach(function (root) {
    var config = root.querySelector('[data-unity-config]');
    var form = root.querySelector('form');
    if (!config || !form) return;

    var values = {
      company: '',
      project: '',
      path: 'Tu sello, rápido',
      quantity: 'Prueba inicial',
      mood: 'Dulce y redondo',
      sound: 'Orgánica',
      color: 'Verde bosque',
      style: 'Clásica',
      notes: '',
      trees: false
    };

    function field(name) {
      return config.querySelector('[data-config="' + name + '"]');
    }

    function updateSummary() {
      Object.keys(values).forEach(function (key) {
        var target = root.querySelector('[data-summary="' + key + '"]');
        if (target) target.textContent = key === 'trees' ? (values[key] ? 'Sí, conversar sobre Tree' : 'No por ahora') : (values[key] || '—');
      });
      var label = root.querySelector('[data-bag-label]');
      if (label) label.textContent = values.company || 'Tu marca';
      var colorField = field('color');
      var colorOption = colorField && colorField.options[colorField.selectedIndex];
      var preview = root.querySelector('[data-bag-preview]');
      if (preview && colorOption) preview.style.setProperty('--bag-color', colorOption.getAttribute('data-color') || '#2e6347');
      var brief = buildBrief();
      var briefField = root.querySelector('[data-brief-field]');
      if (briefField) briefField.value = brief;
      var message = root.querySelector('[data-contact-message]');
      if (message && !message.value) message.value = brief;
    }

    function buildBrief() {
      var lines = [
        'Brief Tueste Unity',
        'Empresa: ' + (values.company || 'Pendiente'),
        'Proyecto: ' + (values.project || 'Pendiente'),
        'Camino: ' + values.path,
        'Volumen: ' + values.quantity,
        'Perfil sensorial: ' + values.mood,
        'Firma sonora: ' + values.sound,
        'Color de bolsa: ' + values.color,
        'Estilo de empaque: ' + values.style,
        'Tueste Tree: ' + (values.trees ? 'Sí' : 'No')
      ];
      if (values.notes) lines.push('Notas: ' + values.notes);
      return lines.join('\n');
    }

    function updateLinks() {
      var encoded = encodeURIComponent(buildBrief());
      var number = root.getAttribute('data-whatsapp') || '';
      var email = root.getAttribute('data-email') || '';
      var whatsapp = root.querySelector('[data-whatsapp-link]');
      var mail = root.querySelector('[data-email-link]');
      if (whatsapp && number) whatsapp.href = 'https://wa.me/' + number.replace(/[^0-9]/g, '') + '?text=' + encoded;
      if (mail && email) mail.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Brief Tueste Unity') + '&body=' + encoded;
    }

    config.addEventListener('input', function (event) {
      var key = event.target.getAttribute('data-config');
      if (!key) return;
      values[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value.trim();
      updateSummary();
      updateLinks();
    });

    var logoInput = root.querySelector('[data-logo-input]');
    var logoPreview = root.querySelector('[data-logo-preview]');
    if (logoInput && logoPreview) {
      logoInput.addEventListener('change', function () {
        var file = logoInput.files && logoInput.files[0];
        if (!file || file.type.indexOf('image/') !== 0) return;
        var reader = new FileReader();
        reader.addEventListener('load', function () {
          logoPreview.src = reader.result;
          logoPreview.hidden = false;
        });
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', function () {
      updateSummary();
      var companyField = root.querySelector('[data-contact-company]');
      if (companyField && !companyField.value) companyField.value = values.company;
    });

    updateSummary();
    updateLinks();
  });
}());
