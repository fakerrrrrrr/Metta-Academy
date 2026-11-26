/* Metta Academy — shared page pieces: nav, footer, language, modal, toasts, guards. */
(function (root) {
  'use strict';
  var C = root.METTA_CONFIG || {};
  var I = root.I18N;
  var API = root.API;
  var LANG_KEY = 'metta_lang';

  var ICON = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 003.4 0"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    playCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4z" fill="currentColor" stroke="none"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
    upload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>',
    out: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>',
    yantra: '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width=".6"><circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="72"/><circle cx="100" cy="100" r="54"/><path d="M100 10 L100 190 M10 100 L190 100 M30 30 L170 170 M170 30 L30 170"/><path d="M100 28 L118 64 L158 64 L126 88 L138 126 L100 102 L62 126 L74 88 L42 64 L82 64 Z"/><circle cx="100" cy="100" r="14"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15l-1.3 4.6 4.7-1.2A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.7-2.7-.2-.3A8 8 0 1112 20zm4.4-5.9c-.2-.1-1.4-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.6 6.6 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 001.8-1.3 2.3 2.3 0 00.2-1.3c-.1-.1-.2-.2-.4-.3z"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.3 2 2 6.2 2 11.7c0 3.1 1.4 5.8 3.7 7.6V23l3.4-1.9c.9.3 1.9.4 2.9.4 5.7 0 10-4.2 10-9.7S17.7 2 12 2zm1 13l-2.5-2.7L5.6 15l5.4-5.7 2.6 2.7 4.8-2.7z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg>',
    tk: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 3c.4 2.3 1.8 4 4 4.3v3c-1.5 0-2.9-.4-4-1.2v6.4a6.2 6.2 0 11-6.2-6.2c.3 0 .6 0 .9.1v3.1a3.1 3.1 0 102.2 3V3H16z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    line: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5.1.3.1.7 0 1l-.1.9c0 .3-.2 1 .9.6 1.1-.5 6-3.5 8.1-6 1.5-1.6 2.1-3.3 2.1-5C22.2 6.6 17.6 3 12 3zM8.3 13.4H6.2c-.3 0-.5-.2-.5-.5V8.8c0-.3.2-.5.5-.5s.5.2.5.5v3.6h1.6c.3 0 .5.2.5.5s-.2.5-.5.5zm2.1-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V8.8c0-.3.2-.5.5-.5s.5.2.5.5v4.1zm5 0c0 .2-.1.4-.3.5h-.2c-.2 0-.3-.1-.4-.2l-2.1-2.9v2.6c0 .3-.2.5-.5.5s-.5-.2-.5-.5V8.8c0-.2.1-.4.3-.5h.2c.2 0 .3.1.4.2l2.1 2.9V8.8c0-.3.2-.5.5-.5s.5.2.5.5v4.1zm3.4-2.6c.3 0 .5.2.5.5s-.2.5-.5.5h-1.6v1.1h1.6c.3 0 .5.2.5.5s-.2.5-.5.5h-2.1c-.3 0-.5-.2-.5-.5V8.8c0-.3.2-.5.5-.5h2.1c.3 0 .5.2.5.5s-.2.5-.5.5h-1.6v1.1h1.6z"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 12V4a1 1 0 011-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 4M12 17h.01"/></svg>'
  };

  var state = { lang: null, session: null, page: '' };

  function lang() { return state.lang; }
  function t(key, vars) { return I.t(state.lang, key, vars); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function baht(n) { return '฿' + Number(n || 0).toLocaleString('en-US'); }
  function date(d, opts) {
    if (!d) return '—';
    var s = String(d).length <= 10 ? d + 'T12:00:00+07:00' : d;
    return new Date(s).toLocaleDateString(state.lang === 'th' ? 'th-TH' : 'en-GB',
      Object.assign({ day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }, opts || {}));
  }
  function dateTime(d) {
    return new Date(d).toLocaleString(state.lang === 'th' ? 'th-TH' : 'en-GB',
      { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
  }
  function pick(obj, base) { // bilingual field: title_th / title_en
    if (!obj) return '';
    var v = obj[base + '_' + state.lang]; return v || obj[base + '_th'] || obj[base + '_en'] || '';
  }
  // The same field in the other language, if it exists and is different (shown as a small subtitle).
  function pickOther(obj, base) {
    if (!obj) return '';
    var other = obj[base + '_' + (state.lang === 'th' ? 'en' : 'th')] || '';
    return other && other !== pick(obj, base) ? other : '';
  }
  // Chapters of the basic course (settings.chapters → [{th, en, desc_th, desc_en}])
  function chapters(settings) {
    var arr = settings && Array.isArray(settings.chapters) && settings.chapters.length ? settings.chapters : API.DEFAULT_CHAPTERS;
    return arr || [];
  }
  function chapterImg(n) {
    var c = (window.METTA_COURSE && window.METTA_COURSE.chapters || [])[n - 1];
    return c && c.img || '';
  }
  function chapterTitle(settings, n) {
    var c = chapters(settings)[n - 1];
    return c ? (c[state.lang] || c.th || c.en || t('chapter_n', { n: n })) : t('chapter_n', { n: n });
  }
  function chapterOther(settings, n) {
    var c = chapters(settings)[n - 1]; if (!c) return '';
    var o = c[state.lang === 'th' ? 'en' : 'th'] || '';
    return o && o !== chapterTitle(settings, n) ? o : '';
  }
  function chapterDesc(settings, n) {
    var c = chapters(settings)[n - 1]; if (!c) return '';
    return c['desc_' + state.lang] || c.desc_th || c.desc_en || '';
  }

  // Clip numbers 1, 2, 3 … across the whole basic course (the order students follow: chapter → month → order).
  // Returns { lessonId: number }. Specialised clips get no number.
  function clipNumbers(lessons) {
    var map = {};
    (lessons || []).filter(function (l) { return l.kind !== 'special' && l.published !== false; })
      .sort(function (a, b) { return ((a.chapter || 1) - (b.chapter || 1)) || ((a.section || 1) - (b.section || 1)) || ((a.sort || 0) - (b.sort || 0)); })
      .forEach(function (l, i) { map[l.id] = i + 1; });
    return map;
  }

  /* ---------- language */
  function applyLang(scope) {
    scope = scope || document;
    document.documentElement.lang = state.lang;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
    var tt = document.querySelector('meta[name=page-title]');
    if (tt) document.title = t(tt.content) + ' · Metta Tattoo Academy';
    document.querySelectorAll('.lang-toggle button').forEach(function (b) { b.classList.toggle('active', b.dataset.lang === state.lang); });
    positionPill();
  }
  function positionPill() {
    document.querySelectorAll('.lang-toggle').forEach(function (tg) {
      var a = tg.querySelector('button.active'), p = tg.querySelector('.pill');
      if (a && p) { p.style.left = a.offsetLeft + 'px'; p.style.width = a.offsetWidth + 'px'; }
    });
  }
  function setLang(l) {
    state.lang = l === 'en' ? 'en' : 'th';
    try { localStorage.setItem(LANG_KEY, state.lang); } catch (e) { /* ignore */ }
    applyLang();
    document.dispatchEvent(new CustomEvent('langchange', { detail: state.lang }));
  }

  /* ---------- nav */
  // The public site is split into tabs (separate pages): home · course · pricing · teacher · FAQ
  var TABS = [['home', 'index.html', 'nav_home', 'home'], ['course', 'course.html', 'nav_curriculum', 'book'],
              ['pricing', 'pricing.html', 'nav_pricing', 'tag'], ['kits', 'kits.html', 'nav_kits', 'bag'], ['teacher', 'teacher.html', 'nav_teacher', 'user'], ['faq', 'faq.html', 'nav_faq', 'help']];
  function isPublic() { return TABS.some(function (x) { return x[0] === state.page; }); }
  function renderTabbar() {
    if (!isPublic() || document.getElementById('tabbar')) return;
    var bar = document.createElement('nav'); bar.className = 'tabbar'; bar.id = 'tabbar';
    bar.innerHTML = TABS.map(function (x) {
      return '<a href="' + x[1] + '"' + (state.page === x[0] ? ' class="active" aria-current="page"' : '') + '>' + ICON[x[3]] + '<span data-i18n="' + x[2] + '"></span></a>';
    }).join('');
    document.body.appendChild(bar); document.body.classList.add('has-tabbar');
  }
  function renderNav() {
    var s = state.session, p = s && s.profile, isAdmin = p && p.role === 'admin';
    var pub = isPublic();
    var links = pub ? '<nav class="nav-links">' + TABS.map(function (x) {
      return '<a href="' + x[1] + '"' + (state.page === x[0] ? ' class="active" aria-current="page"' : '') + ' data-i18n="' + x[2] + '"></a>';
    }).join('') + '</nav>' : '<nav class="nav-links">' +
      '<a href="index.html" data-i18n="nav_home"></a>' +
      (s ? '<a href="learn.html" class="' + (state.page === 'learn' ? 'active' : '') + '" data-i18n="nav_classroom"></a>' +
           '<a href="pay.html" class="' + (state.page === 'pay' ? 'active' : '') + '" data-i18n="nav_payments"></a>' : '') +
      (isAdmin ? '<a href="admin.html" class="' + (state.page === 'admin' ? 'active' : '') + '" data-i18n="nav_admin"></a>' : '') + '</nav>';
    var right;
    if (s) {
      var initial = (p.full_name || p.email || '?').trim().charAt(0).toUpperCase();
      right = (state.page !== 'learn' ? '<a href="learn.html" class="btn btn-gold nav-cta nav-class" data-i18n="nav_classroom"></a>' : '') +
        '<div class="bell" id="bell"><button class="bell-btn" id="bellBtn" aria-haspopup="true" data-i18n-aria="nt_title">' + ICON.bell + '<span class="bell-n" id="bellN" hidden></span></button>' +
        '<div class="bell-menu" role="menu"><div class="bell-h"><b data-i18n="nt_title"></b><button id="bellAll" data-i18n="nt_read_all"></button></div><div class="bell-list" id="bellList"></div></div></div>' +
        '<div class="acct" id="acct"><button class="acct-btn" id="acctBtn" aria-haspopup="true" data-i18n-aria="nav_account">' + esc(initial) + '</button>' +
        '<div class="acct-menu" role="menu"><div class="who"><b>' + esc(p.full_name || '—') + '</b><span>' + esc(p.email) + '</span></div>' +
        '<a href="index.html">' + ICON.home + '<span data-i18n="nav_home"></span></a>' +
        '<a href="learn.html">' + ICON.book + '<span data-i18n="nav_classroom"></span></a>' +
        '<a href="pay.html">' + ICON.card + '<span data-i18n="nav_payments"></span></a>' +
        '<button id="profileBtn">' + ICON.user + '<span data-i18n="nav_profile"></span></button>' +
        (isAdmin ? '<a href="admin.html">' + ICON.gear + '<span data-i18n="nav_admin"></span></a>' : '') +
        '<button id="logoutBtn">' + ICON.out + '<span data-i18n="nav_logout"></span></button></div></div>';
    } else {
      right = '<a href="login.html" class="btn btn-ghost nav-cta nav-login" data-i18n-aria="nav_login">' + ICON.user + '<span data-i18n="nav_login"></span></a>' +
        '<a href="pricing.html" class="btn btn-gold nav-cta" data-i18n="nav_enroll"></a>';
    }
    var html = '<div class="nav-inner"><a href="index.html" class="nav-logo" aria-label="Metta Tattoo Academy"><span class="brand-cat" aria-hidden="true"></span>' +
      '<span class="wm"><b>METTA</b><i>ACADEMY</i></span></a>' + links +
      '<div class="nav-right"><div class="lang-toggle"><span class="pill"></span><button data-lang="th">ไทย</button><button data-lang="en">EN</button></div>' + right + '</div></div>';
    var nav = document.getElementById('nav');
    if (!nav) { nav = document.createElement('header'); nav.id = 'nav'; nav.className = 'nav'; document.body.prepend(nav); }
    nav.innerHTML = html;
    nav.querySelectorAll('.lang-toggle button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });
    var acct = document.getElementById('acct');
    if (acct) {
      document.getElementById('acctBtn').addEventListener('click', function (e) { e.stopPropagation(); acct.classList.toggle('open'); });
      document.addEventListener('click', function () { acct.classList.remove('open'); });
      document.getElementById('logoutBtn').addEventListener('click', async function () { await API.signOut(); location.href = 'index.html'; });
      document.getElementById('profileBtn').addEventListener('click', editProfile);
    }
    var bell = document.getElementById('bell');
    if (bell) {
      document.getElementById('bellBtn').addEventListener('click', function (e) {
        e.stopPropagation(); if (acct) acct.classList.remove('open');
        bell.classList.toggle('open'); renderBell();
      });
      bell.querySelector('.bell-menu').addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () { bell.classList.remove('open'); });
      document.getElementById('bellAll').addEventListener('click', async function () {
        await API.markRead(null); state.notes.forEach(function (n) { n.read_at = n.read_at || new Date().toISOString(); }); renderBell();
      });
      document.getElementById('bellList').addEventListener('click', async function (e) {
        var a = e.target.closest('[data-note]'); if (!a) return;
        e.preventDefault();
        var n = state.notes.filter(function (x) { return x.id === a.dataset.note; })[0];
        if (n && !n.read_at) { n.read_at = new Date().toISOString(); try { await API.markRead([n.id]); } catch (er) { /* ignore */ } }
        location.href = a.getAttribute('href');
      });
      state.notesP = loadBell();
      setInterval(function () { if (!document.hidden) loadBell(); }, 60000);
      document.addEventListener('visibilitychange', function () { if (!document.hidden) loadBell(); });
    }
    addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 30); }, { passive: true });
  }

  /* ---------- notifications (bell) */
  state.notes = [];
  function noteItem(n) {
    var d = n.data || {}, amt = baht(d.amount || 0);
    var ex = d.exam ? t('nt_item_exam', { n: d.exam }) : '';
    var item = d.item === 'exam' ? ex : (d.item === 'full' ? t('nt_item_full') : d.item === 'installment' ? t('nt_item_inst', { n: d.n || 1 }) :
      t('nt_item_lesson', { title: (lang() === 'en' ? d.lesson_en || d.lesson_th : d.lesson_th || d.lesson_en) || '—' })) + (ex && d.item !== 'exam' ? ' + ' + ex : '');
    switch (n.kind) {
      case 'welcome':  return { tone: 'gold', icon: ICON.spark, title: t('nt_welcome_t'), body: t('nt_welcome_b'), href: 'learn.html' };
      case 'approved': return { tone: 'ok', icon: ICON.check, title: t('nt_approved_t'), body: t('nt_approved_b', { item: item, amt: amt }), href: 'receipt.html?id=' + encodeURIComponent(n.payment_id || '') };
      case 'rejected': return { tone: 'bad', icon: ICON.warn, title: t('nt_rejected_t'), body: t('nt_rejected_b', { reason: d.reason || '—' }), href: 'pay.html' };
      case 'reminder': return { tone: d.when === 'late' ? 'bad' : 'gold', icon: ICON.clock, title: t(d.when === 'late' ? 'nt_rem_late_t' : d.when === 'today' ? 'nt_rem_today_t' : 'nt_rem_t', { n: d.days }),
        body: t('nt_rem_b', { no: d.no, amt: baht(d.amount || 0), date: d.due ? date(d.due) : '—' }), href: 'pay.html?item=installment' };
      case 'exam_scheduled': return { tone: 'gold', icon: ICON.clock, title: t('nt_exsched_t'), body: t('nt_exsched_b', { date: d.date ? date(d.date) : '—' }), href: 'learn.html#exam' };
      case 'exam_passed': return { tone: 'gold', icon: ICON.spark, title: t('nt_expass_t'), body: t('nt_expass_b', { no: d.cert_no || '' }), href: 'learn.html#exam' };
      case 'new_slip': return { tone: 'info', icon: ICON.receipt, title: t('nt_slip_t'), body: t('nt_slip_b', { name: d.name || '—', item: item, amt: amt }), href: 'admin.html' };
      default:         return { tone: 'info', icon: ICON.bell, title: t('nt_title'), body: '', href: 'learn.html' };
    }
  }
  function ago(iso) {
    var m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 1) return t('nt_now'); if (m < 60) return t('nt_min_ago', { n: m });
    var h = Math.round(m / 60); if (h < 24) return t('nt_hr_ago', { n: h });
    return date(iso);
  }
  function renderBell() {
    var list = document.getElementById('bellList'), badge = document.getElementById('bellN'); if (!list) return;
    var unread = state.notes.filter(function (n) { return !n.read_at; }).length;
    badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : unread;
    document.getElementById('bellBtn').classList.toggle('has', !!unread);
    list.innerHTML = state.notes.length ? state.notes.map(function (n) {
      var x = noteItem(n);
      return '<a class="note ' + x.tone + (n.read_at ? '' : ' unread') + '" href="' + x.href + '" data-note="' + esc(n.id) + '"><span class="note-ic">' + x.icon + '</span>' +
        '<span class="note-t"><b>' + esc(x.title) + '</b><span>' + esc(x.body) + '</span><i>' + esc(ago(n.created_at)) + '</i></span></a>';
    }).join('') : '<div class="note-empty">' + ICON.bell + '<span>' + esc(t('nt_empty')) + '</span></div>';
  }
  async function loadBell() {
    try { state.notes = await API.notifications(); } catch (e) { state.notes = []; }
    renderBell();
    document.dispatchEvent(new CustomEvent('notes', { detail: state.notes }));
    return state.notes;
  }

  function renderFooter() {
    var f = document.getElementById('footer'); if (!f) return;
    f.className = 'footer';
    f.innerHTML = '<div class="wrap"><div class="footer-top"><div>' +
      '<a href="index.html" class="nav-logo"><span class="brand-cat" style="width:46px;height:46px"></span><span class="wm"><b>METTA</b><i>ACADEMY</i></span></a>' +
      '<p data-i18n="footer_blurb"></p><div class="socials">' +
      (C.LINE_URL ? '<a class="s-line" href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener" aria-label="LINE">' + ICON.line + '</a>' : '') +
      '<a href="' + esc(C.INSTAGRAM) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICON.ig + '</a>' +
      '<a href="' + esc(C.FACEBOOK) + '" target="_blank" rel="noopener" aria-label="Facebook">' + ICON.fb + '</a>' +
      '<a href="' + esc(C.TIKTOK) + '" target="_blank" rel="noopener" aria-label="TikTok">' + ICON.tk + '</a></div></div>' +
      '<div class="footer-col"><h5 data-i18n="footer_course"></h5><a href="course.html" data-i18n="nav_curriculum"></a>' +
      '<a href="pricing.html" data-i18n="nav_pricing"></a><a href="kits.html" data-i18n="nav_kits"></a><a href="teacher.html" data-i18n="nav_teacher"></a><a href="faq.html" data-i18n="nav_faq"></a>' +
      '<a href="learn.html" data-i18n="nav_classroom"></a><a href="terms.html" data-i18n="footer_terms"></a><a href="' + esc(C.STUDIO_SITE_URL) + '" target="_blank" rel="noopener" data-i18n="footer_studio"></a></div>' +
      '<div class="footer-col"><h5 data-i18n="footer_contact"></h5><a href="tel:' + esc(C.PHONE_INTL) + '">' + esc(C.PHONE) + ' (' + esc(state.lang === 'th' ? C.TEACHER_NAME_TH : C.TEACHER_NAME_EN) + ')</a>' +
      (C.LINE_URL ? '<a href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener">LINE' + (C.LINE_ID ? ': ' + esc(C.LINE_ID) : '') + '</a>' : '') +
      (C.SUPPLIES_URL ? '<a href="' + esc(C.SUPPLIES_URL) + '" target="_blank" rel="noopener" data-i18n="soc_shop"></a>' : '') +
      '<span data-i18n="footer_addr"></span><span data-i18n="footer_hours"></span></div></div>' +
      '<div class="footer-bot"><span>© ' + new Date().getFullYear() + ' Metta Tattoo · Chiang Mai</span><span data-i18n="footer_rights"></span></div></div>';
  }

  function renderFab() {
    if (document.getElementById('fab')) return;
    var d = document.createElement('div'); d.className = 'fab'; d.id = 'fab';
    d.innerHTML = '<div class="fab-menu">' +
      (C.LINE_URL ? '<a class="fab-btn ln" href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener">' + ICON.line + '<span>LINE</span></a>' : '') +
      '<a class="fab-btn ph" href="tel:' + esc(C.PHONE_INTL) + '">' + ICON.phone + '<span>' + esc(C.PHONE) + '</span></a>' +
      '<a class="fab-btn wa" href="https://wa.me/' + esc(C.WHATSAPP) + '" target="_blank" rel="noopener">' + ICON.wa + '<span>WhatsApp</span></a>' +
      '<a class="fab-btn me" href="' + esc(C.MESSENGER) + '" target="_blank" rel="noopener">' + ICON.me + '<span>Messenger</span></a></div>' +
      '<button class="fab-main" aria-expanded="false" data-i18n-aria="contact_us"><span class="c">' + ICON.chat + '</span><span class="x">' + ICON.x + '</span></button>';
    document.body.appendChild(d);
    var b = d.querySelector('.fab-main');
    b.addEventListener('click', function (e) { e.stopPropagation(); var o = d.classList.toggle('open'); b.setAttribute('aria-expanded', o); });
    document.addEventListener('click', function () { d.classList.remove('open'); });
  }

  /* ---------- demo panel */
  function renderDemoBar() {
    if (API.mode !== 'demo') return;
    var el = document.createElement('div'); el.className = 'demobar'; el.id = 'demobar';
    function paint() {
      var off = API.demo.offset();
      el.innerHTML = '<button type="button" id="demoToggle"><i></i>' + esc(t('demo_badge')) + '</button><div class="panel">' +
        '<div class="lbl" data-i18n="demo_title"></div><p data-i18n-html="demo_explain"></p>' +
        '<p><span data-i18n="demo_date"></span> <b>' + esc(date(API.today(), { weekday: 'short' })) + '</b>' + (off ? ' (+' + off + ')' : '') + '</p>' +
        '<div class="row"><button data-shift="7">+7 <span data-i18n="demo_days"></span></button><button data-shift="30">+30 <span data-i18n="demo_days"></span></button>' +
        '<button data-today="1" data-i18n="demo_today"></button></div>' +
        '<div class="lbl" data-i18n="demo_login_as"></div><div class="row">' +
        '<button data-as="student@metta.demo" data-i18n="demo_as_student"></button><button data-as="mint@metta.demo" data-i18n="demo_as_overdue"></button>' +
        '<button data-as="gino@metta.demo" data-i18n="demo_as_admin"></button></div>' +
        '<div class="row"><button data-reset="1" data-i18n="demo_reset"></button></div></div>';
      applyLang(el);
    }
    paint();
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      e.stopPropagation();
      if (b.id === 'demoToggle') { el.classList.toggle('open'); return; }
      if (b.dataset.shift) { API.demo.shiftDays(+b.dataset.shift); location.reload(); }
      if (b.dataset.today) { API.demo.resetDate(); location.reload(); }
      if (b.dataset.as) { API.demo.loginAs(b.dataset.as); location.href = b.dataset.as.indexOf('gino') === 0 ? 'admin.html' : 'learn.html'; }
      if (b.dataset.reset) { API.demo.resetAll(); location.reload(); }
    });
    document.addEventListener('click', function () { el.classList.remove('open'); });
  }

  /* ---------- modal / toast / confirm */
  function modal(opts) {
    var bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true"><div class="modal-h"><h3></h3>' +
      '<button class="modal-x" aria-label="Close">&times;</button></div><div class="modal-b"></div><div class="modal-f"></div></div>';
    bg.querySelector('h3').textContent = opts.title || '';
    var body = bg.querySelector('.modal-b');
    if (typeof opts.body === 'string') body.innerHTML = opts.body; else if (opts.body) body.appendChild(opts.body);
    var foot = bg.querySelector('.modal-f');
    (opts.actions || []).forEach(function (a) {
      var b = document.createElement('button'); b.className = 'btn btn-sm ' + (a.kind || 'btn-ghost'); b.textContent = a.label;
      b.addEventListener('click', async function () {
        if (!a.onClick) return close();
        b.classList.add('busy');
        try { var r = await a.onClick(b); if (r !== false) close(); } catch (e) { toast(errorText(e), 'bad'); }
        b.classList.remove('busy');
      });
      foot.appendChild(b);
    });
    if (!foot.children.length) foot.remove();
    function close() { bg.remove(); document.removeEventListener('keydown', onKey); if (opts.onClose) opts.onClose(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    bg.querySelector('.modal-x').addEventListener('click', close);
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(bg);
    var f = bg.querySelector('input,select,textarea'); if (f) setTimeout(function () { f.focus(); }, 50);
    return { el: bg, close: close, body: body };
  }
  function confirmBox(text, okLabel, danger) {
    return new Promise(function (res) {
      var done = false;
      modal({ title: t('confirm_title'), body: '<p>' + esc(text) + '</p>', onClose: function () { if (!done) res(false); },
        actions: [{ label: t('cancel') }, { label: okLabel || t('ok'), kind: danger ? 'btn-danger' : 'btn-gold', onClick: function () { done = true; res(true); } }] });
    });
  }
  function promptBox(title, label, placeholder) {
    return new Promise(function (res) {
      var done = false;
      var m = modal({ title: title, body: '<label class="field"><span>' + esc(label) + '</span><input type="text" placeholder="' + esc(placeholder || '') + '"></label>',
        onClose: function () { if (!done) res(null); },
        actions: [{ label: t('cancel') }, { label: t('ok'), kind: 'btn-gold', onClick: function () { done = true; res(m.body.querySelector('input').value.trim()); } }] });
    });
  }
  function toast(msg, kind) {
    var box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    var el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.textContent = msg;
    box.appendChild(el); setTimeout(function () { el.remove(); }, kind === 'bad' ? 6000 : 3500);
  }
  function errorText(e) {
    var code = (e && e.code) || 'unknown';
    var key = 'err_' + code;
    return I.has(state.lang, key) ? t(key) : t('err_unknown') + (e && e.detail ? ' (' + e.detail + ')' : '');
  }
  async function busy(btn, fn) {
    btn.classList.add('busy'); btn.disabled = true;
    try { return await fn(); } finally { btn.classList.remove('busy'); btn.disabled = false; }
  }

  function editProfile() {
    var p = state.session.profile;
    var m = modal({ title: t('profile_title'), body:
      '<div class="form"><label class="field"><span data-i18n="f_name"></span><input name="full_name" value="' + esc(p.full_name) + '"></label>' +
      '<div class="row-2"><label class="field"><span data-i18n="f_phone"></span><input name="phone" value="' + esc(p.phone) + '"></label>' +
      '<label class="field"><span data-i18n="f_line"></span><input name="line_id" value="' + esc(p.line_id) + '"></label></div>' +
      '<p class="faint" style="font-size:.8rem" data-i18n="profile_wm_note"></p></div>',
      actions: [{ label: t('cancel') }, { label: t('save'), kind: 'btn-gold', onClick: async function () {
        var g = function (n) { return m.body.querySelector('[name=' + n + ']').value.trim(); };
        if (!g('full_name')) { toast(t('err_name_required'), 'bad'); return false; }
        state.session.profile = Object.assign(p, await API.updateProfile({ full_name: g('full_name'), phone: g('phone'), line_id: g('line_id') }));
        toast(t('saved'), 'ok'); renderNav(); applyLang();
      } }] });
    applyLang(m.el);
  }

  /* ---------- reveal on scroll */
  function reveals() {
    var els = document.querySelectorAll('.reveal:not(.show)');
    if (!('IntersectionObserver' in root)) { els.forEach(function (e) { e.classList.add('show'); }); return; }
    document.documentElement.classList.add('rv');   // content is only hidden once this works
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('show'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- boot every page
   * opts.auth: 'none' | 'user' | 'admin'
   */
  async function init(opts) {
    state.page = opts.page || '';
    var saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* ignore */ }
    var q = new URLSearchParams(location.search).get('lang');
    state.lang = q === 'en' || q === 'th' ? q : (saved || C.DEFAULT_LANG || 'th');
    try { await API.init(); } catch (e) { document.body.insertAdjacentHTML('afterbegin', '<div class="alert bad" style="margin:6rem 1rem">' + esc(t('err_network')) + '</div>'); throw e; }
    state.session = await API.session();
    if (opts.auth !== 'none' && !state.session) {
      location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search)); return null;
    }
    if (opts.auth === 'admin' && state.session.profile.role !== 'admin') { location.replace('learn.html'); return null; }
    if (state.session && opts.auth !== 'none') {
      var dev = await API.checkDevice(state.session.profile);
      if (dev === 'kicked') { await API.signOut(); location.replace('login.html?kicked=1'); return null; }
    }
    renderNav(); renderTabbar(); renderFooter(); renderFab(); renderDemoBar();
    applyLang();
    addEventListener('resize', positionPill); setTimeout(positionPill, 150);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(positionPill);
    reveals();
    return state.session;
  }

  root.UI = { init: init, t: t, lang: lang, setLang: setLang, applyLang: applyLang, esc: esc, baht: baht, date: date, dateTime: dateTime,
    pick: pick, pickOther: pickOther, chapters: chapters, chapterImg: chapterImg, chapterTitle: chapterTitle, chapterOther: chapterOther, chapterDesc: chapterDesc, clipNumbers: clipNumbers, modal: modal, confirm: confirmBox, prompt: promptBox, toast: toast, errorText: errorText,
    busy: busy, reveals: reveals, ICON: ICON, session: function () { return state.session; },
    notes: function () { return state.notes; }, notesReady: function () { return state.notesP || Promise.resolve([]); }, noteItem: noteItem, refreshBell: loadBell, renderBell: renderBell };
})(window);
