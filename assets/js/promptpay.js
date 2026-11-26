/* Metta Academy — PromptPay QR (Thai QR Payment / EMVCo).
 * Builds the payload a Thai banking app reads, with the amount pre-filled,
 * and draws it onto a <canvas> using the bundled encoder (assets/vendor/qr.js).
 * Works for a mobile number (08x...), a 13-digit citizen / tax ID, or a 15-digit e-wallet ID.
 */
(function (root) {
  'use strict';

  function tlv(id, value) {
    var len = String(value.length);
    return id + (len.length < 2 ? '0' + len : len) + value;
  }

  // CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — required by the EMVCo spec.
  function crc16(str) {
    var crc = 0xFFFF;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) << 8;
      for (var b = 0; b < 8; b++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return ('0000' + crc.toString(16).toUpperCase()).slice(-4);
  }

  function cleanId(id) { return String(id || '').replace(/[^0-9]/g, ''); }

  // Returns { tag, value } for the merchant account sub-field, or null when the ID is not valid.
  function accountField(id) {
    var d = cleanId(id);
    if (d.length === 10 && d.charAt(0) === '0') return { tag: '01', value: '0066' + d.slice(1) }; // mobile
    if (d.length === 11 && d.slice(0, 2) === '66') return { tag: '01', value: '00' + d };        // mobile with country code
    if (d.length === 13) return { tag: '02', value: d };                                          // citizen / tax ID
    if (d.length === 15) return { tag: '03', value: d };                                          // e-wallet
    return null;
  }

  function isValidId(id) { return accountField(id) !== null; }

  function payload(id, amount) {
    var acc = accountField(id);
    if (!acc) throw new Error('Invalid PromptPay ID');
    var hasAmount = typeof amount === 'number' && amount > 0;
    var merchant = tlv('00', 'A000000677010111') + tlv(acc.tag, acc.value);
    var s = tlv('00', '01') +
            tlv('01', hasAmount ? '12' : '11') +   // 12 = one-time QR with amount
            tlv('29', merchant) +
            tlv('58', 'TH') +
            tlv('53', '764') +                      // THB
            (hasAmount ? tlv('54', amount.toFixed(2)) : '') +
            '6304';
    return s + crc16(s);
  }

  // Draw onto a canvas. Returns the canvas.
  function draw(canvas, text, opts) {
    opts = opts || {};
    var QR = root.MettaQR;
    if (!QR) throw new Error('QR encoder not loaded');
    var m = QR.matrix(text, 'M');
    var quiet = 4, n = m.length + quiet * 2;
    var px = opts.size || 260;
    var scale = Math.max(1, Math.floor(px / n));
    var size = scale * n;
    canvas.width = size; canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (var r = 0; r < m.length; r++) for (var c = 0; c < m.length; c++)
      if (m[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    return canvas;
  }

  var api = { payload: payload, crc16: crc16, isValidId: isValidId, draw: draw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PromptPay = api;
})(typeof window !== 'undefined' ? window : globalThis);
