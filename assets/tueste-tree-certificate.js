/**
 * Tueste Tree — generador de certificado descargable, 100% client-side.
 *
 * No hay backend propio en un repo de tema de Shopify, así que esto dibuja el
 * certificado en un <canvas> nativo (sin librerías nuevas) a partir de datos
 * que el llamador ya tiene en pantalla, y lo entrega como PNG descargable.
 *
 * Se comparte entre la landing de Tueste Tree (certificado de vista previa) y
 * /pages/verificar (certificado real, post-compra) — por eso no lee el DOM
 * directamente: solo recibe un objeto plano con los valores a dibujar.
 *
 * Uso:
 *   window.TuesteTreeCertificate.download({
 *     logo, image, kicker, subtitle, heading, lot, treeNumber,
 *     guardian, treeName, quantity, date, origin, note, footer, filename,
 *     rows: [['Etiqueta', 'Valor'], ...] // opcional, reemplaza las filas por defecto
 *   });
 * Todos los campos son opcionales y tienen un valor por defecto razonable.
 * `rows` permite a cada página definir su propio set de campos (la landing
 * muestra guardián/nombre/cantidad/fecha/origen; /pages/verificar muestra
 * guardián/insignia/fecha/origen), sin duplicar la lógica de dibujo.
 */
(function () {
  'use strict';

  if (window.TuesteTreeCertificate) return;

  var COLORS = {
    pageBg: '#17150f',
    bgTop: '#2b2519',
    bgBottom: '#12110d',
    cream: '#ffe8bf',
    creamSoft: 'rgba(255, 232, 191, 0.72)',
    line: 'rgba(255, 232, 191, 0.18)',
    amber: '#fba922',
    amberBorder: 'rgba(251, 169, 34, 0.55)',
    leaf: '#3fbf5a',
    cherry: '#df5362',
    lilac: '#a48cdf'
  };

  var FONT_SERIF = 'Lora, Georgia, "Times New Roman", serif';
  var FONT_MONO = '"DM Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  var FONT_SANS = 'Poppins, system-ui, -apple-system, sans-serif';
  var FONT_FAMILIES_TO_PRELOAD = ['400 16px ' + FONT_SERIF, '700 16px ' + FONT_MONO, '600 16px ' + FONT_SANS];

  function whenFontsReady() {
    if (!document.fonts || !document.fonts.ready) return Promise.resolve();
    var loads = FONT_FAMILIES_TO_PRELOAD.map(function (spec) {
      try {
        return document.fonts.load(spec);
      } catch (error) {
        return Promise.resolve();
      }
    });
    return Promise.race([
      Promise.all(loads).then(function () { return document.fonts.ready; }).catch(function () { return null; }),
      new Promise(function (resolve) { window.setTimeout(resolve, 1200); })
    ]);
  }

  function loadImage(src, timeoutMs) {
    return new Promise(function (resolve) {
      if (!src) { resolve(null); return; }
      var settled = false;
      var img = new Image();
      var timer = window.setTimeout(function () {
        if (settled) return;
        settled = true;
        resolve(null);
      }, timeoutMs || 4000);
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(img);
      };
      img.onerror = function () {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(null);
      };
      img.src = src;
    });
  }

  function wrapLines(ctx, text, maxWidth) {
    var words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    var lines = [];
    var current = words[0];
    for (var i = 1; i < words.length; i++) {
      var attempt = current + ' ' + words[i];
      if (ctx.measureText(attempt).width > maxWidth) {
        lines.push(current);
        current = words[i];
      } else {
        current = attempt;
      }
    }
    lines.push(current);
    return lines;
  }

  function drawTracked(ctx, text, centerX, y, spacing) {
    var chars = String(text || '').split('');
    if (!chars.length) return;
    var widths = chars.map(function (ch) { return ctx.measureText(ch).width; });
    var total = widths.reduce(function (sum, w) { return sum + w; }, 0) + spacing * Math.max(0, chars.length - 1);
    var x = centerX - total / 2;
    var align = ctx.textAlign;
    ctx.textAlign = 'left';
    chars.forEach(function (ch, index) {
      ctx.fillText(ch, x, y);
      x += widths[index] + spacing;
    });
    ctx.textAlign = align;
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawDots(ctx, x, y, colors, spacing, radius) {
    colors.forEach(function (color, index) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x + index * spacing, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawWrappedCentered(ctx, text, centerX, startY, maxWidth, lineHeight) {
    var lines = wrapLines(ctx, text, maxWidth);
    lines.forEach(function (line, index) {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });
    return startY + lines.length * lineHeight;
  }

  function buildCanvas(data) {
    return Promise.all([loadImage(data.logo, 4000), loadImage(data.image, 4000), whenFontsReady()]).then(function (results) {
      var logo = results[0];
      var illustration = results[1];

      var scale = Math.min(2, window.devicePixelRatio || 1.5) || 2;
      var width = 1000;
      var height = 1360;
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      ctx.fillStyle = COLORS.pageBg;
      ctx.fillRect(0, 0, width, height);

      var pad = 42;
      var cardWidth = width - pad * 2;
      var cardHeight = height - pad * 2;
      var gradient = ctx.createLinearGradient(0, pad, 0, pad + cardHeight);
      gradient.addColorStop(0, COLORS.bgTop);
      gradient.addColorStop(1, COLORS.bgBottom);

      roundedRectPath(ctx, pad, pad, cardWidth, cardHeight, 28);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = COLORS.amberBorder;
      ctx.stroke();

      drawDots(ctx, pad + 42, pad + 38, [COLORS.lilac, COLORS.amber, COLORS.cherry], 15, 4.5);
      drawDots(ctx, width - pad - 42 - 30, pad + 38, [COLORS.cherry, COLORS.lilac, COLORS.leaf], 15, 4.5);

      var centerX = width / 2;
      var cursorY = pad + 66;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      if (logo) {
        var logoHeight = 44;
        var logoWidth = logoHeight * (logo.width / logo.height);
        ctx.drawImage(logo, centerX - logoWidth / 2, cursorY - logoHeight, logoWidth, logoHeight);
        cursorY += 24;
      } else {
        ctx.fillStyle = COLORS.cream;
        ctx.font = '400 26px ' + FONT_SERIF;
        drawTracked(ctx, data.brand || 'TUESTE TREE', centerX, cursorY, 3);
        cursorY += 20;
      }

      cursorY += 24;
      ctx.fillStyle = COLORS.amber;
      ctx.font = '700 13px ' + FONT_MONO;
      drawTracked(ctx, (data.kicker || 'Certificado de tradición').toUpperCase(), centerX, cursorY, 2.5);
      cursorY += 22;

      ctx.fillStyle = COLORS.creamSoft;
      ctx.font = '600 12px ' + FONT_MONO;
      drawTracked(ctx, (data.subtitle || 'Tueste Tree · Adopción de origen').toUpperCase(), centerX, cursorY, 2);
      cursorY += 48;

      ctx.fillStyle = COLORS.cream;
      ctx.font = 'italic 400 38px ' + FONT_SERIF;
      cursorY = drawWrappedCentered(ctx, data.heading || 'Este árbol ya tiene guardián.', centerX, cursorY, cardWidth - 150, 44);
      cursorY += 22;

      if (illustration) {
        var imageWidth = 300;
        var imageHeight = Math.min(340, imageWidth * (illustration.height / illustration.width));
        roundedRectPath(ctx, centerX - imageWidth / 2, cursorY, imageWidth, imageHeight, 12);
        ctx.save();
        ctx.clip();
        ctx.drawImage(illustration, centerX - imageWidth / 2, cursorY, imageWidth, imageHeight);
        ctx.restore();
        cursorY += imageHeight + 32;
      } else {
        cursorY += 12;
      }

      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 50, cursorY);
      ctx.lineTo(width - pad - 50, cursorY);
      ctx.stroke();
      cursorY += 34;

      ctx.fillStyle = COLORS.creamSoft;
      ctx.font = '600 12px ' + FONT_MONO;
      drawTracked(ctx, (data.lot || 'Lote fundacional · Founders').toUpperCase(), centerX, cursorY, 2);
      cursorY += 30;

      ctx.fillStyle = COLORS.amber;
      ctx.font = '700 16px ' + FONT_MONO;
      drawTracked(ctx, (data.treeNumber || 'ÁRBOL N.° 000000').toUpperCase(), centerX, cursorY, 2);
      cursorY += 46;

      var rows = data.rows || [
        ['Guardián', data.guardian || '—'],
        ['Nombre del árbol', data.treeName || '—'],
        ['Cantidad', data.quantity || '1 árbol fundacional'],
        ['Fecha de siembra', data.date || '—'],
        ['Origen', data.origin || 'Finca Tres Esquinas · Cañón de Aures · 1.840 msnm']
      ];

      var rowLeft = pad + 56;
      var rowRight = width - pad - 56;
      ctx.font = '500 14px ' + FONT_SANS;
      rows.forEach(function (row) {
        ctx.fillStyle = COLORS.creamSoft;
        ctx.textAlign = 'left';
        ctx.fillText(row[0], rowLeft, cursorY);

        ctx.fillStyle = COLORS.cream;
        ctx.textAlign = 'right';
        ctx.font = '600 14px ' + FONT_SANS;
        var valueLines = wrapLines(ctx, row[1], (rowRight - rowLeft) * 0.62);
        valueLines.forEach(function (line, index) {
          ctx.fillText(line, rowRight, cursorY + index * 18);
        });
        ctx.font = '500 14px ' + FONT_SANS;
        cursorY += 18 * Math.max(1, valueLines.length) + 16;
      });

      cursorY += 6;
      if (data.note) {
        ctx.fillStyle = COLORS.creamSoft;
        ctx.font = '400 11px ' + FONT_SANS;
        ctx.textAlign = 'center';
        cursorY = drawWrappedCentered(ctx, data.note, centerX, cursorY, cardWidth - 170, 15);
      }

      var barGradient = ctx.createLinearGradient(pad, 0, pad + cardWidth, 0);
      barGradient.addColorStop(0, COLORS.amber);
      barGradient.addColorStop(0.22, COLORS.amber);
      barGradient.addColorStop(0.4, COLORS.cherry);
      barGradient.addColorStop(0.6, COLORS.leaf);
      barGradient.addColorStop(0.78, COLORS.lilac);
      barGradient.addColorStop(1, COLORS.cream);
      ctx.fillStyle = barGradient;
      ctx.fillRect(pad, pad + cardHeight - 6, cardWidth, 6);

      if (data.footer) {
        ctx.fillStyle = COLORS.creamSoft;
        ctx.font = '400 11px ' + FONT_SANS;
        ctx.textAlign = 'center';
        ctx.fillText(data.footer, centerX, height - 18);
      }

      return canvas;
    });
  }

  function canvasToSource(canvas) {
    return new Promise(function (resolve, reject) {
      if (!canvas.toBlob) {
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
        return;
      }
      canvas.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('No se pudo generar la imagen del certificado.'));
        }
      }, 'image/png');
    });
  }

  function triggerDownload(source, filename) {
    var isBlob = typeof source !== 'string';
    var url = isBlob ? URL.createObjectURL(source) : source;
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      document.body.removeChild(link);
      if (isBlob) URL.revokeObjectURL(url);
    }, 0);
  }

  function slugify(value) {
    // Rango Unicode "Combining Diacritical Marks" (0x0300–0x036F), construido
    // desde códigos numéricos (no un escape \u en el source) a propósito:
    // evita que un editor o pipeline de texto "normalice" el escape y lo
    // vuelva un carácter combinante literal invisible dentro del archivo.
    var COMBINING_DIACRITICS_START = String.fromCharCode(768); // 0x0300
    var COMBINING_DIACRITICS_END = String.fromCharCode(879); // 0x036F
    var COMBINING_DIACRITICS = new RegExp('[' + COMBINING_DIACRITICS_START + '-' + COMBINING_DIACRITICS_END + ']', 'g');
    return String(value || '')
      .normalize('NFD').replace(COMBINING_DIACRITICS, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  function download(data) {
    data = data || {};
    return buildCanvas(data).then(canvasToSource).then(function (source) {
      var suffix = slugify(data.treeNumber) || slugify(data.guardian) || 'arbol';
      triggerDownload(source, data.filename || 'tueste-tree-certificado-' + suffix + '.png');
      return true;
    });
  }

  window.TuesteTreeCertificate = { download: download };
})();
