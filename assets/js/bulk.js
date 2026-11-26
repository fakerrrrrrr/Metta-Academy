/* Metta Academy — admin helpers that don't touch the page (so they can be tested):
 *  parseBulkLessons: turns a pasted list into lesson rows
 *  studentsCsv:      builds an Excel-friendly CSV of the student list
 */
(function (root) {
  'use strict';

  /* One clip per line (tabs work too — paste straight from Excel / Google Sheets):
   *   basic course:  chapter | month | Thai title | English title | minutes | price
   *   specialised:   s | Thai title | English title | minutes | price        (price required)
   * chapter = 1..chapterCount. month = the monthly payment that opens the clip (1..monthCount);
   * it may be left out, then the chapter's first month is used. Everything after the Thai title is optional.
   * Returns { rows: [...], errors: [{ line, code }] } */
  function parseBulkLessons(text, chapterCount, monthCount) {
    var rows = [], errors = [];
    chapterCount = chapterCount || 5; monthCount = monthCount || 10;
    function num(v) {
      if (v == null || v === '' || v === '-') return null;
      var c = String(v).replace(/[,฿\s]|บาท|นาที|min/gi, '');
      return /^\d+$/.test(c) ? parseInt(c, 10) : NaN;
    }
    // chapter 1 → month 1, chapter 2 → month 3 … (spreads the months evenly over the chapters)
    function firstMonth(ch) { return Math.min(monthCount, Math.floor((ch - 1) * monthCount / chapterCount) + 1); }
    String(text || '').split(/\r?\n/).forEach(function (raw, i) {
      var line = raw.trim();
      if (!line || line.charAt(0) === '#') return;
      var parts = line.split(line.indexOf('|') !== -1 ? '|' : '\t').map(function (p) { return p.trim(); });
      var ch = (parts[0] || '').toLowerCase(), kind = 'core', chapter = 1, month = null;
      if (ch === 's' || ch === 'special' || ch === 'เฉพาะทาง') kind = 'special';
      else if (/^\d+$/.test(ch) && +ch >= 1 && +ch <= chapterCount) chapter = +ch;
      else { errors.push({ line: i + 1, code: 'bulk_bad_ch' }); return; }
      var rest = parts.slice(1);
      // optional month column: a number right after the chapter
      if (rest.length > 1 && /^\d+$/.test(rest[0])) {
        var m = rest.shift();
        if (kind === 'core') {
          if (+m < 1 || +m > monthCount) { errors.push({ line: i + 1, code: 'bulk_bad_month' }); return; }
          month = +m;
        }
      }
      if (!rest[0]) { errors.push({ line: i + 1, code: 'bulk_no_title' }); return; }
      var minutes = num(rest[2]), price = num(rest[3]);
      if (Number.isNaN(minutes) || Number.isNaN(price)) { errors.push({ line: i + 1, code: 'bulk_bad_num' }); return; }
      if (kind === 'special' && !(price > 0)) { errors.push({ line: i + 1, code: 'bulk_need_price' }); return; }
      rows.push({ kind: kind, chapter: kind === 'core' ? chapter : 1, section: kind === 'core' ? (month || firstMonth(chapter)) : 1,
        title_th: rest[0], title_en: rest[1] || '', duration_min: minutes, price: price || null,
        description_th: '', description_en: '', is_preview: false, published: true, coming_soon: false });
    });
    return { rows: rows, errors: errors };
  }

  function csvCell(v) {
    var s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  /* header: array of column titles; rows: array of arrays. Starts with a BOM so Excel shows Thai correctly. */
  function toCsv(header, rows) {
    return '﻿' + [header].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  }

  var api = { parseBulkLessons: parseBulkLessons, toCsv: toCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Bulk = api;
})(typeof window !== 'undefined' ? window : globalThis);
