/* Public tabs (index, course, pricing, teacher, faq): one script, each part runs only if its section is on the page. */
(async function () {
  'use strict';
  var PAGE = document.body.dataset.page || 'home';
  var session = await UI.init({ page: PAGE, auth: 'none' });
  var t = UI.t, esc = UI.esc, C = window.METTA_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var settings = null, lessons = [];
  try { settings = await API.getSettings(); lessons = await API.listLessons(); } catch (e) { console.warn(e); }
  lessons = lessons.filter(function (l) { return l.published !== false; });

  // Logged-in visitors: point the sign-up buttons at the classroom
  if (session) document.querySelectorAll('a[href^="login.html?mode=register"]').forEach(function (a) { a.href = 'learn.html'; });

  // Exam / contact buttons → Messenger (falls back to phone)
  if ($('examContact')) $('examContact').href = C.LINE_URL || C.MESSENGER || ('tel:' + (C.PHONE_INTL || ''));
  if ($('faqLine') && C.LINE_URL) { $('faqLine').href = C.LINE_URL; $('faqLine').hidden = false; $('faqLine').innerHTML = UI.ICON.line + '<span>' + esc(t('line_btn')) + '</span>'; }
  if ($('faqMsg')) $('faqMsg').href = C.MESSENGER || '#';

  /* ---------- Kru Geeno's social media + supplies shop (links from config.js) */
  function handle(url) { var m = /(?:tiktok\.com\/|instagram\.com\/)(@?[\w.]+)/.exec(url || ''); return m ? (m[1].charAt(0) === '@' ? m[1] : '@' + m[1]) : ''; }
  var SHOP_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3"/><path d="M10 20v-5h4v5"/></svg>';
  var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
  // Photos of Geeno's own work used as previews on the cards (full literal paths so the preview builder finds them)
  var TK_BG = 'images/work/38.webp', IG_THUMBS = ['images/work/03.webp', 'images/work/24.webp', 'images/work/43.webp'], FB_BG = 'images/work/19.webp';
  function socialList() {
    return [
      C.LINE_URL && { k: 'line', url: C.LINE_URL, icon: UI.ICON.line, name: 'LINE', sub: C.LINE_ID ? 'ID: ' + C.LINE_ID : '', desc: 'soc_line', cta: 'soc_line_cta' },
      C.TIKTOK && { k: 'tiktok', url: C.TIKTOK, icon: UI.ICON.tk, name: 'TikTok', sub: handle(C.TIKTOK), desc: 'soc_tk', cta: 'soc_tk_cta', n: C.TIKTOK_FOLLOWERS, hl: true },
      C.INSTAGRAM && { k: 'instagram', url: C.INSTAGRAM, icon: UI.ICON.ig, name: 'Instagram', sub: handle(C.INSTAGRAM), desc: 'soc_ig', cta: 'soc_ig_cta', n: C.INSTAGRAM_FOLLOWERS },
      C.FACEBOOK && { k: 'facebook', url: C.FACEBOOK, icon: UI.ICON.fb, name: 'Facebook', sub: 'Metta Tattoo', desc: 'soc_fb', cta: 'soc_fb_cta', n: C.FACEBOOK_FOLLOWERS },
      C.SUPPLIES_URL && { k: 'shop', url: C.SUPPLIES_URL, icon: SHOP_ICON, name: t('soc_shop'), sub: 'Metta Tattoo Supplies', desc: 'soc_shop_d', cta: 'shop_cta' }
    ].filter(Boolean);
  }
  function cardHtml(x) {
    var n = x.n ? '<span class="soc-n">' + esc(t('soc_followers', { n: x.n })) + '</span>' : '';
    var head = '<span class="soc-ic">' + x.icon + '</span><span class="soc-txt"><b>' + esc(x.name) + '</b><span class="soc-sub">' + esc(x.sub) + '</span></span>';
    var go = '<span class="soc-go">' + esc(t(x.cta)) + '<i>→</i></span>';
    if (x.k === 'tiktok') return '<a class="soc-card soc-tiktok" href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      '<span class="soc-bg" style="background-image:url(' + TK_BG + ')"></span><span class="soc-shade"></span>' +
      '<span class="soc-live"><i></i>' + esc(t('soc_live')) + '</span><span class="soc-play">' + PLAY_ICON + '</span>' +
      '<span class="soc-body"><span class="soc-head">' + head + n + '</span><span class="soc-desc">' + esc(t(x.desc)) + '</span>' + go + '</span></a>';
    if (x.k === 'instagram') return '<a class="soc-card soc-instagram" href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      '<span class="soc-head">' + head + n + '</span><span class="soc-thumbs">' + IG_THUMBS.map(function (src) { return '<img src="' + src + '" alt="" loading="lazy">'; }).join('') + '</span>' +
      '<span class="soc-desc">' + esc(t(x.desc)) + '</span>' + go + '</a>';
    if (x.k === 'facebook') return '<a class="soc-card soc-facebook" href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      '<span class="soc-bg" style="background-image:url(' + FB_BG + ')"></span><span class="soc-shade"></span>' +
      '<span class="soc-body"><span class="soc-head">' + head + n + '</span><span class="soc-desc">' + esc(t(x.desc)) + '</span>' + go + '</span></a>';
    if (x.k === 'line') return '<a class="soc-card soc-line" href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
      '<span class="soc-body"><span class="soc-head">' + head + '</span><span class="soc-desc">' + esc(t(x.desc)) + '</span>' + go + '</span>' +
      '<span class="soc-qr"><canvas data-line-qr aria-label="LINE QR"></canvas><small>' + esc(t('kits_qr')) + '</small></span></a>';
    return '<a class="soc-card soc-shop" href="' + esc(x.url) + '" target="_blank" rel="noopener"><span class="soc-head">' + head + '</span>' +
      '<span class="soc-desc">' + esc(t(x.desc)) + '</span>' + go + '</a>';
  }
  function renderSocials() {
    document.querySelectorAll('[data-socials="cards"]').forEach(function (box) { box.innerHTML = socialList().map(cardHtml).join(''); });
    document.querySelectorAll('[data-socials="mini"]').forEach(function (box) {
      box.innerHTML = socialList().filter(function (x) { return x.k !== 'shop'; }).map(function (x) {
        return '<a class="soc-btn soc-btn-' + x.k + '" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + x.icon +
          '<span><b>' + esc(x.name) + '</b><small>' + esc(x.sub) + '</small></span></a>';
      }).join('');
    });
    document.querySelectorAll('[data-shop]').forEach(function (a) { a.href = 'kits.html'; a.removeAttribute('target'); a.hidden = false; });
    // LINE everywhere: QR on the card, a line under the home buttons, a button in every "enrol" box
    if (C.LINE_URL && window.PromptPay) document.querySelectorAll('[data-line-qr]').forEach(function (cv) { try { PromptPay.draw(cv, C.LINE_URL, { size: 260 }); } catch (e) { /* no QR */ } });
    document.querySelectorAll('[data-line-link]').forEach(function (a) {
      if (!C.LINE_URL) return; a.href = C.LINE_URL; a.hidden = false;
      a.innerHTML = '<span class="hl-ic">' + UI.ICON.line + '</span><span>' + esc(t('line_hero')) + (C.LINE_ID ? ' <b>ID: ' + esc(C.LINE_ID) + '</b>' : '') + '</span>';
    });
    document.querySelectorAll('[data-studio-ig]').forEach(function (a) {
      if (!C.INSTAGRAM) return; a.href = C.INSTAGRAM; a.hidden = false; a.innerHTML = UI.ICON.ig + '<span>' + esc(t('gal_ig')) + '</span>';
    });
    document.querySelectorAll('[data-line-btn]').forEach(function (a) {
      if (!C.LINE_URL) return; a.href = C.LINE_URL; a.hidden = false; a.innerHTML = UI.ICON.line + '<span>' + esc(t('line_btn')) + '</span>';
    });
  }
  renderSocials();
  document.addEventListener('langchange', renderSocials);

  // STUDENT WORK — Kru Geeno posts students' tattoos on the shop's Facebook page.
  // The page's feed is loaded only when the section scrolls into view; if Facebook is blocked
  // (ad blocker, no internet) the big button underneath still opens the page.
  (function studentWork() {
    var sec = $('students'), url = C.STUDENT_WORK_FB || C.FACEBOOK;
    if (!sec || !url) return;
    sec.hidden = false;
    function labels() {
      document.querySelectorAll('[data-sw-link]').forEach(function (a) { a.href = url; a.innerHTML = UI.ICON.fb + '<span>' + esc(t('sw_btn')) + '</span>' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'; });
      document.querySelectorAll('[data-sw-link-ph]').forEach(function (a) { a.href = url; a.innerHTML = '<span class="sw-ph-ic">' + UI.ICON.fb + '</span><b>' + esc(t('sw_ph')) + '</b>'; });
    }
    labels(); document.addEventListener('langchange', labels);
    var box = $('swFrame'), done = false;
    function load() {
      if (done) return; done = true;
      var w = Math.max(180, Math.min(500, Math.floor(box.clientWidth || 340)));
      var h = Math.max(300, Math.floor(box.clientHeight || 420));
      var f = document.createElement('iframe');
      f.title = 'Facebook · Metta Tattoo'; f.loading = 'lazy'; f.width = w; f.height = h;
      f.setAttribute('scrolling', 'no'); f.setAttribute('frameborder', '0'); f.setAttribute('allow', 'encrypted-media; picture-in-picture; web-share');
      f.src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(url) + '&tabs=timeline&width=' + w + '&height=' + h +
        '&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=' + (UI.lang && UI.lang() === 'en' ? 'en_US' : 'th_TH');
      f.onload = function () { box.classList.add('loaded'); };
      box.appendChild(f);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); } }, { rootMargin: '300px' });
      io.observe(sec);
    } else load();
  })();
  if ($('faqPhone')) { $('faqPhone').href = 'tel:' + (C.PHONE_INTL || ''); $('faqPhone').innerHTML = UI.ICON.phone + '<span>' + esc(C.PHONE || '') + '</span>'; }

  function minSpecial() { var p = specials().map(function (l) { return l.price; }).filter(function (x) { return x > 0; }); return p.length ? Math.min.apply(null, p) : 0; }
  function core() { return lessons.filter(function (l) { return l.kind !== 'special'; }); }
  function specials() { return lessons.filter(function (l) { return l.kind === 'special'; }).sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); }); }

  /* ---------- prices (home card + pricing tab) */
  function renderPrices() {
    if (!settings) return;
    var s = settings, instTotal = s.installment_amount * s.installment_count;
    document.querySelectorAll('[data-price=full]').forEach(function (e) { e.textContent = UI.baht(s.full_price); });
    document.querySelectorAll('[data-price=inst]').forEach(function (e) { e.textContent = UI.baht(s.installment_amount); });
    if ($('heroInst')) $('heroInst').textContent = t('hero_inst', { amt: UI.baht(s.installment_amount) });
    if ($('heroFull')) $('heroFull').textContent = t('hero_full', { amt: UI.baht(s.full_price) });
    if ($('planInstSub')) $('planInstSub').textContent = t('plan_inst_sub', { n: s.installment_count, total: UI.baht(instTotal) });
    if ($('planFullSave')) $('planFullSave').textContent = instTotal > s.full_price ? t('plan_full_save', { amt: UI.baht(instTotal - s.full_price) }) : t('plan_full_4');
    var box = $('singlePrice'), cta = $('singleCta');
    if (!box) return;
    // Specialised: "from ฿990 /clip", or "coming soon" while none are published
    var prices = specials().map(function (l) { return l.price; }).filter(function (p) { return p > 0; });
    if (prices.length) {
      // Geeno: "from ฿1,900 per clip — the price depends on how complex the piece is"
      var min = Math.min.apply(null, prices);
      box.innerHTML = '<small class="from">' + esc(t('price_from')) + '</small><span>' + esc(UI.baht(min)) + '</span><small>' + esc(t('per_clip')) + '</small>';
      cta.textContent = t('plan_single_cta'); cta.classList.remove('disabled');
    } else {
      box.innerHTML = '<span class="soon">' + esc(t('plan_single_soon')) + '</span>';
      cta.textContent = t('plan_single_soon'); cta.classList.add('disabled');
    }
  }

  function renderMiniChapters() {
    var box = $('homeChapters'); if (!box) return;
    box.innerHTML = UI.chapters(settings).map(function (c, i) {
      var n = core().filter(function (l) { return (l.chapter || 1) === i + 1; }).length;
      return '<li><span class="no">' + (i < 9 ? '0' : '') + (i + 1) + '</span><b>' + esc(UI.chapterTitle(settings, i + 1)) + '</b>' + (n ? '<i>' + esc(t('n_lessons', { n: n })) + '</i>' : '') + '</li>';
    }).join('');
  }
  function renderStats() {
    if (!$('statChapters')) return;
    $('statChapters').textContent = UI.chapters(settings).length;
    var n = core().length;
    $('statLessons').textContent = n ? n : '—';
  }

  /* ---------- curriculum (course tab) */
  function lessonRow(l, opts) {
    var other = UI.pickOther(l, 'title'), desc = UI.pick(l, 'description');
    var right = [];
    if (opts.price && l.price) right.push('<b class="gold">' + esc(UI.baht(l.price)) + '</b>');
    if (l.duration_min) right.push(esc(t('n_min', { n: l.duration_min })));
    if (opts.month && l.section) right.push('<span class="mt">' + esc(t('month_tag', { n: l.section })) + '</span>');
    var no = opts.no && opts.no[l.id];
    return '<li' + (l.is_preview ? ' class="free"' : '') + '>' + (no ? '<span class="no">' + no + '</span>' : (l.is_preview ? UI.ICON.play : UI.ICON.lock)) + '<span>' + esc(UI.pick(l, 'title')) +
      (l.is_preview ? ' <span class="chip gold no-dot">' + esc(t('free_preview')) + '</span>' : '') +
      (l.coming_soon ? ' <span class="chip no-dot soon">' + esc(t('coming_soon')) + '</span>' : '') +
      (desc && opts.desc ? '<small class="ld">' + esc(desc) + '</small>' : '') + '</span>' +
      '<span class="d">' + right.join(' · ') + '</span></li>';
  }
  function renderCurriculum() {
    var box = $('curr'); if (!box) return;
    var openNow = {}; box.querySelectorAll('details[open]').forEach(function (d) { openNow[d.dataset.k] = 1; });
    var first = !box.children.length, html = '', chev = UI.ICON.chev.replace('<svg', '<svg class="chev"');
    var nCh = core().reduce(function (m, l) { return Math.max(m, l.chapter || 1); }, UI.chapters(settings).length);
    var nums = UI.clipNumbers(lessons);
    for (var i = 1; i <= nCh; i++) {
      var ls = core().filter(function (l) { return (l.chapter || 1) === i; })
        .sort(function (a, b) { return (a.section || 0) - (b.section || 0) || (a.sort || 0) - (b.sort || 0); });
      var months = ls.map(function (l) { return l.section || 1; });
      var a = months.length ? Math.min.apply(null, months) : i * 2 - 1, b = months.length ? Math.max.apply(null, months) : i * 2;
      var mins = ls.reduce(function (s, l) { return s + (l.duration_min || 0); }, 0);
      var other = UI.chapterOther(settings, i), desc = UI.chapterDesc(settings, i);
      var isOpen = first ? i === 1 : openNow['c' + i];
      var cimg = UI.chapterImg(i);
      html += '<details class="chap' + (cimg ? ' has-img' : '') + '" data-k="c' + i + '"' + (isOpen ? ' open' : '') + '><summary>' + (cimg ? '<span class="cimg" style="background-image:url(\'' + esc(cimg) + '\')"></span>' : '') + '<span class="cn">' + (i < 10 ? '0' + i : i) + '</span>' +
        '<span class="ct">' + esc(UI.chapterTitle(settings, i)) + (other ? '<small class="alt">' + esc(other) + '</small>' : '') + '</span>' +
        '<span class="cm">' + (ls.length ? esc(t('n_lessons', { n: ls.length })) + (mins ? ' · ' + esc(t('n_min', { n: mins })) : '') : esc(t('coming_soon'))) +
        '<small>' + esc(a === b ? t('chap_month', { a: a }) : t('chap_months', { a: a, b: b })) + '</small></span>' +
        chev + '</summary>' + (desc ? '<p class="cdesc">' + esc(desc) + '</p>' : '') + '<ul>' +
        (ls.length ? ls.map(function (l) { return lessonRow(l, { month: true, desc: true, no: nums }); }).join('')
          : '<li><span class="faint">' + esc(t('chapter_soon')) + '</span></li>') + '</ul></details>';
    }
    var sp = specials();
    html += '<details class="chap special" id="special" data-k="s"' + (openNow.s || (first && location.hash === '#special') ? ' open' : '') + '><summary><span class="cn">+</span>' +
      '<span class="ct">' + esc(t('special_title')) + '<small class="alt">' + esc(UI.lang() === 'th' ? 'Specialised courses' : 'คอร์สเฉพาะทาง') + '</small></span>' +
      '<span class="cm">' + esc(sp.length ? t('price_from') + ' ' + UI.baht(minSpecial()) + t('per_clip') : t('coming_soon')) + '<small>' + esc(t('special_ongoing')) + '</small></span>' + chev + '</summary>' +
      '<p class="cdesc">' + esc(t('special_note')) + '</p><ul>' +
      (sp.length ? sp.map(function (l) { return lessonRow(l, { price: true }); }).join('') : '<li><span class="faint">' + esc(t('special_none')) + '</span></li>') +
      '</ul>' + (sp.length ? '<p class="cfoot"><a class="link" href="' + (session ? 'learn.html' : 'login.html?mode=register&next=learn.html') + '">' + esc(session ? t('nav_classroom') : t('special_buy_hint')) + '</a></p>' : '') +
      '</details>';
    box.innerHTML = html;
  }

  /* ---------- lightbox (gallery) */
  var lb = $('lightbox');
  function openLb(src, title) { $('lbImg').src = src; $('lbImg').alt = title; $('lbTitle').textContent = title; lb.hidden = false; }
  if (lb) {
    $('lbClose').addEventListener('click', function () { lb.hidden = true; });
    lb.addEventListener('mousedown', function (e) { if (e.target === lb) lb.hidden = true; });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.hidden = true; });
  }

  /* ---------- gallery (teacher tab) */
  var G = window.METTA_GALLERY || [], filter = 'all', shown = 12, cats = [];
  G.forEach(function (g) { if (!cats.some(function (c) { return c.cat === g.cat; })) cats.push(g); });
  function renderFilters() {
    if (!$('filters')) return;
    $('filters').innerHTML = '<button class="filter' + (filter === 'all' ? ' active' : '') + '" data-f="all">' + esc(t('all')) + '</button>' +
      cats.map(function (c) { return '<button class="filter' + (filter === c.cat ? ' active' : '') + '" data-f="' + esc(c.cat) + '">' + esc(UI.lang() === 'th' ? c.cat_th : c.cat_en) + '</button>'; }).join('');
  }
  function renderGallery() {
    if (!$('masonry')) return;
    var list = G.filter(function (g) { return filter === 'all' || g.cat === filter; });
    $('masonry').innerHTML = list.slice(0, shown).map(function (g) {
      var title = UI.lang() === 'th' ? g.title_th : g.title_en, cat = UI.lang() === 'th' ? g.cat_th : g.cat_en;
      return '<button class="tile" data-i="' + G.indexOf(g) + '"><img src="' + esc(g.src) + '" alt="' + esc(title) + '" loading="lazy">' +
        '<span class="meta"><i>' + esc(cat) + '</i><b>' + esc(title) + '</b></span></button>';
    }).join('');
    $('moreBtn').hidden = list.length <= shown;
  }
  if ($('masonry')) {
    $('filters').addEventListener('click', function (e) { var b = e.target.closest('.filter'); if (!b) return; filter = b.dataset.f; shown = 12; renderFilters(); renderGallery(); });
    $('moreBtn').addEventListener('click', function () { shown += 12; renderGallery(); });
    $('masonry').addEventListener('click', function (e) { var b = e.target.closest('.tile'); if (!b) return; var g = G[+b.dataset.i]; openLb(g.src, UI.lang() === 'th' ? g.title_th : g.title_en); });
  }

  /* ---------- FAQ tab */
  function renderFaq() {
    if (!$('faqList')) return;
    var ex = exams(), ep = function (i) { return ex[i] ? (ex[i].price ? UI.baht(ex[i].price) : t('exam_ask')) : ''; };
    var kp = function (id) { var k = kit(id); return k ? UI.baht(k.price) + (kl(k, 'ship') ? ' (' + kl(k, 'ship') + ')' : '') : ''; };
    var vars = { k1: kp('starter'), k2: kp('full'), k3: kp('colours'), n: settings ? settings.installment_count : 10, amt: settings ? UI.baht(settings.installment_amount) : '', full: settings ? UI.baht(settings.full_price) : '',
      sp: minSpecial() ? UI.baht(minSpecial()) : UI.baht(1900), e1: ep(0), e2: ep(1), e3: ep(2) };
    var html = '';
    for (var i = 1; I18N.has(UI.lang(), 'faq' + i + '_q'); i++) {
      html += '<details class="reveal show"' + (i === 1 ? ' open' : '') + '><summary>' + esc(t('faq' + i + '_q')) + '</summary><p>' + esc(t('faq' + i + '_a', vars)) + '</p></details>';
    }
    $('faqList').innerHTML = html;
  }

  /* ---------- two ways to enrol: online course · course + certificate (exam packages from settings.exam_packages) */
  function exams() { return (settings && settings.exam_packages) || API.DEFAULT_EXAMS; }
  var PEOPLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>';
  var CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  var PIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/></svg>';
  var XPK_IMG = { 7: ['images/work/30.webp', 'images/work/24.webp'], 15: ['images/work/16.webp', 'images/work/04.webp', 'images/work/28.webp'], 30: ['images/work/26.webp', 'images/work/36.webp', 'images/work/42.webp'] };
  function renderExams() {
    var ex = exams(), full = settings ? settings.full_price : 14900, min = Math.min.apply(null, ex.map(function (e) { return e.price; }));
    if ($('trOnlineP')) $('trOnlineP').innerHTML = '<small>' + esc(t('price_from')) + '</small>' + esc(UI.baht(settings ? settings.installment_amount : 1800)) + '<small>' + esc(t('per_month')) + '</small>';
    if ($('trCertP')) $('trCertP').innerHTML = '<small>' + esc(t('tr_cert_from')) + '</small>' + esc(UI.baht(min));
    var box = $('examPkgs'); if (!box) return;
    var signed = !!session;
    box.innerHTML = ex.map(function (e, i) {
      var imgs = XPK_IMG[e.days] || XPK_IMG[[7, 15, 30][i] || 15] || [];
      return '<article class="xp' + (e.recommended ? ' rec' : '') + '">' + (e.recommended ? '<span class="badge">' + esc(t('exam_rec')) + '</span>' : '') +
        '<div class="xp-days"><b>' + e.days + '</b><span>' + esc(t('xp_days_word')) + '</span></div>' +
        '<ul class="xp-facts"><li>' + CAL + '<span>' + esc(t('xp_period', { n: e.days })) + '</span></li>' +
          '<li>' + PEOPLE + '<span>' + esc(t('xp_people', { n: e.people })) + '</span></li>' +
          '<li>' + PIC + '<span>' + esc(t('xp_works', { n: e.works })) + (e.big ? '<small>' + esc(t('xp_big')) + '</small>' : '') + '</span></li></ul>' +
        '<div class="xp-imgs n' + imgs.length + '">' + imgs.map(function (src) { return '<img src="' + src + '" alt="" loading="lazy">'; }).join('') + '</div>' +
        '<div class="xp-price">' + esc(UI.baht(e.price)) + '<small>' + esc(t('xp_exam_only')) + '</small></div>' +
        (function () { var bd = API.bundle(settings || { full_price: full }, e.days);
          return '<div class="xp-bundle"><span>' + esc(t('xp_with_course', { amt: UI.baht(full) })) + (bd.discount ? '<i class="disc-pill">' + esc(t(((settings && settings.bundle_discount_on) || 'exam') === 'exam' ? 'bundle_off_exam' : 'bundle_off', { pct: bd.pct })) + '</i>' : '') + '</span>' +
            '<b>' + (bd.discount ? '<s>' + esc(UI.baht(bd.before)) + '</s>' : '') + esc(UI.baht(bd.total)) + '</b></div>'; })() +
        '<a class="btn ' + (e.recommended ? 'btn-gold' : 'btn-ghost') + ' btn-block" href="' + esc(payHref(signed, 'pay.html?item=full&exam=' + e.days)) + '">' + esc(t('xp_cta_bundle')) + '</a>' +
        '<a class="xp-alt" href="' + esc(payHref(signed, 'pay.html?item=exam&exam=' + e.days)) + '">' + esc(t('xp_cta_exam')) + '</a></article>';
    }).join('');
  }
  // signed-in visitors go straight to the payment page; others sign up first, then land there
  function payHref(signed, target) { return signed ? target : 'login.html?mode=register&next=' + encodeURIComponent(target); }
  function showTrack(k, scroll) {
    if (!$('cert')) return;
    document.querySelectorAll('.etrack').forEach(function (b) { var on = b.dataset.track === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('trOnline').hidden = k !== 'online'; $('cert').hidden = k !== 'cert';
    if (scroll) $('pricing').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.etrack'); if (b) { showTrack(b.dataset.track); history.replaceState(null, '', b.dataset.track === 'cert' ? '#cert' : location.pathname + location.search); return; }
    var oc = e.target.closest('[data-open-cert]'); if (oc) { e.preventDefault(); showTrack('cert', true); history.replaceState(null, '', '#cert'); }
  });
  if (location.hash === '#cert') showTrack('cert');

  /* ---------- videos from Kru Geeno (config.js → HOME_VIDEO / INTRO_VIDEO) */
  function youtubeId(u) { var m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m && m[1]; }
  function videoHtml(src, opts) {
    var yt = youtubeId(src);
    if (yt) return '<iframe src="https://www.youtube-nocookie.com/embed/' + yt + (opts.bg ? '?autoplay=1&mute=1&loop=1&playlist=' + yt + '&controls=0&playsinline=1' : '?rel=0') +
      '" title="Kru Geeno" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    return opts.bg ? '<video src="' + esc(src) + '" autoplay muted loop playsinline preload="metadata"></video>'
                   : '<video src="' + esc(src) + '" controls playsinline preload="metadata" poster="images/teacher-award.webp"></video>';
  }
  function renderVideos() {
    var wall = $('heroWall');
    if (wall && C.HOME_VIDEO && !wall.classList.contains('has-video')) {
      wall.classList.add('has-video');
      wall.innerHTML = '<div class="hero2-video">' + videoHtml(C.HOME_VIDEO, { bg: true }) + '</div>' + wall.querySelector('.hero2-badge').outerHTML;
    }
    // intro video: a light poster first (fast on phones), the YouTube player loads when tapped
    if (C.INTRO_VIDEO) {
      if ($('homeIntro')) $('homeIntro').hidden = false;
      document.querySelectorAll('[data-intro]').forEach(function (box) {
        if (box.children.length) return;
        var yt = youtubeId(C.INTRO_VIDEO);
        if (!yt) { box.innerHTML = videoHtml(C.INTRO_VIDEO, {}); return; }
        box.innerHTML = '<button class="yt-lite" type="button" aria-label="' + esc(t('intro_play')) + '">' +
          '<img src="https://i.ytimg.com/vi/' + yt + '/maxresdefault.jpg" alt="" loading="lazy" onerror="if(this.dataset.f){this.onerror=null;this.src=\'images/teacher-award.webp\'}else{this.dataset.f=1;this.src=\'https://i.ytimg.com/vi/' + yt + '/hqdefault.jpg\'}">' +
          '<span class="yt-play">' + UI.ICON.play + '</span><span class="yt-cap">' + esc(t('intro_play')) + '</span></button>';
        box.firstChild.addEventListener('click', function () {
          box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + yt + '?autoplay=1&rel=0&playsinline=1&modestbranding=1" title="Kru Geeno" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
        });
      });
    }
    var sec = $('introSec');
    if (sec) {
      if (C.INTRO_VIDEO) { sec.hidden = false; }
      else if (API.mode === 'demo') {   // demo only: show where the video will go
        sec.hidden = false;
        $('introVideo').innerHTML = '<div class="intro-ph"><img src="images/teacher-award.webp" alt=""><span>' + UI.ICON.play + '<b>' + esc(t('intro_soon')) + '</b></span></div>';
      }
    }
  }

  /* ---------- equipment kits from the shop (kits-data.js) — ordered through LINE */
  var KITS = window.METTA_KITS || [];
  function kit(id) { return KITS.filter(function (k) { return k.id === id; })[0]; }
  function kl(k, f) { return UI.lang() === 'en' ? k[f + '_en'] || k[f + '_th'] : k[f + '_th'] || k[f + '_en']; }
  var TRUCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="5.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>';
  var ZOOM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5M11 8v6M8 11h6"/></svg>';
  function lineHref() { return C.LINE_URL || C.MESSENGER || ('tel:' + (C.PHONE_INTL || '')); }
  function priceBlock(k) {
    return '<div class="kp-price">' + (k.was ? '<s>' + esc(UI.baht(k.was)) + '</s>' : '') + '<b>' + esc(UI.baht(k.price)) + '</b>' +
      (k.was ? '<span class="disc-pill">' + esc(t('kits_save', { amt: UI.baht(k.was - k.price) })) + '</span>' : '') +
      (kl(k, 'ship') ? '<span class="kp-ship">' + TRUCK + esc(kl(k, 'ship')) + '</span>' : '') + '</div>';
  }
  function kitCard(k, wide) {
    var priced = k.items.some(function (i) { return i[2]; });
    return '<article class="kcard' + (wide ? ' wide' : '') + '" id="kit-' + k.id + '">' +
      '<button class="kc-img" data-poster="' + esc(k.poster) + '" data-title="' + esc(kl(k, 'name')) + '" aria-label="' + esc(t('kits_view_poster')) + '">' +
        '<img src="' + esc(k.img) + '" alt="' + esc(kl(k, 'name')) + '" loading="lazy"><span class="kc-badge">' + esc(kl(k, 'badge')) + '</span><span class="kc-zoom">' + ZOOM + esc(t('kits_view_poster')) + '</span></button>' +
      '<div class="kc-body"><h3>' + esc(kl(k, 'name')) + '</h3><p class="kc-tag">' + esc(kl(k, 'tag')) + '</p>' + priceBlock(k) +
        '<h4>' + esc(t('kits_inside')) + '</h4><ul class="kc-items' + (priced ? ' priced' : '') + '">' + k.items.map(function (i) {
          return '<li>' + UI.ICON.check + '<span>' + esc(UI.lang() === 'en' ? i[1] : i[0]) + '</span>' + (i[2] ? '<em>' + esc(UI.baht(i[2])) + '</em>' : '') + '</li>';
        }).join('') + '</ul>' +
        (priced && k.was ? '<p class="kc-sum">' + esc(t('kits_items_total', { amt: UI.baht(k.was) })) + '</p>' : '') +
        '<div class="kc-acts"><a class="btn btn-gold btn-block line-btn" href="' + esc(lineHref()) + '" target="_blank" rel="noopener">' + UI.ICON.line + '<span>' + esc(t('kits_order_btn')) + '</span></a></div>' +
      '</div></article>';
  }
  function renderKits() {
    if (!KITS.length) return;
    if ($('kitList')) $('kitList').innerHTML = ['starter', 'full'].map(function (id) { return kit(id) ? kitCard(kit(id)) : ''; }).join('');
    if ($('kitColours') && kit('colours')) $('kitColours').innerHTML = kitCard(kit('colours'), true);
    if ($('kitCmp') && kit('starter') && kit('full')) {
      var Y = '<span class="yes">' + UI.ICON.check + '</span>', N = '<span class="no">—</span>';
      var rows = [
        ['kits_c_machine', Y, Y], ['kits_c_needles', esc(t('kits_c_needles_s')), esc(t('kits_c_needles_f'))],
        ['kits_c_ink', esc(t('kits_c_ink_s')), esc(t('kits_c_ink_f'))], ['kits_c_printer', N, Y],
        ['kits_c_skin', esc(t('kits_c_skin_n')), esc(t('kits_c_skin_n'))], ['kits_c_cons', esc(t('kits_c_cons_s')), esc(t('kits_c_cons_f'))],
        ['kits_c_ship', '<span class="no">' + esc(t('kits_c_ask')) + '</span>', esc(t('kits_c_free'))]
      ];
      $('kitCmp').innerHTML = '<thead><tr><th></th><th>' + esc(t('kits_c_h_s')) + '<small>' + esc(kl(kit('starter'), 'badge')) + '</small></th><th class="hl">' + esc(t('kits_c_h_f')) + '<small>' + esc(kl(kit('full'), 'badge')) + '</small></th></tr></thead><tbody>' +
        rows.map(function (r) { return '<tr><th>' + esc(t(r[0])) + '</th><td>' + r[1] + '</td><td class="hl">' + r[2] + '</td></tr>'; }).join('') +
        '<tr class="tot"><th>' + esc(t('kits_c_price')) + '</th><td>' + esc(UI.baht(kit('starter').price)) + '</td><td class="hl">' + esc(UI.baht(kit('full').price)) + '</td></tr></tbody>';
    }
    if ($('kitGuide')) {
      var G2 = [['starter', 'kits_g1_t', 'kits_g1_p', 'kits_g1_ch'], ['colours', 'kits_g2_t', 'kits_g2_p', 'kits_g2_ch'], ['full', 'kits_g3_t', 'kits_g3_p', 'kits_g3_ch']];
      $('kitGuide').innerHTML = G2.map(function (g) {
        var k = kit(g[0]); if (!k) return '';
        return '<a class="kg" href="#kit-' + k.id + '"><img src="' + esc(k.img) + '" alt="" loading="lazy"><div><span class="kg-ch">' + esc(t(g[3])) + '</span><b>' + esc(t(g[1])) + '</b><p>' + esc(t(g[2])) + '</p>' +
          '<span class="kg-go">' + esc(kl(k, 'name')) + ' · ' + esc(UI.baht(k.price)) + UI.ICON.arrow + '</span></div></a>';
      }).join('');
    }
    if ($('koBtns')) {
      $('koBtns').innerHTML = '<a class="btn btn-gold line-btn" href="' + esc(lineHref()) + '" target="_blank" rel="noopener">' + UI.ICON.line + '<span>' + esc(t('kits_order_btn')) + '</span></a>' +
        (C.SUPPLIES_URL ? '<a class="btn btn-ghost" href="' + esc(C.SUPPLIES_URL) + '" target="_blank" rel="noopener">' + UI.ICON.fb + '<span>' + esc(t('kits_fb')) + '</span></a>' : '') +
        '<a class="btn btn-ghost" href="tel:' + esc(C.PHONE_INTL) + '">' + UI.ICON.phone + '<span>' + esc(C.PHONE) + '</span></a>';
      if (C.LINE_URL && window.PromptPay && $('lineQr') && !$('lineQr').dataset.done) {
        try { PromptPay.draw($('lineQr'), C.LINE_URL, { size: 320 }); $('lineQr').dataset.done = 1; $('koQr').hidden = false; } catch (e) { /* no QR */ }
      }
      if ($('lineId')) $('lineId').textContent = C.LINE_ID ? 'LINE ID: ' + C.LINE_ID : '';
    }
    if ($('kitLine') && kit('starter')) {
      $('kitLine').innerHTML = UI.ICON.bag + '<span>' + esc(t('kits_price_line', { amt: UI.baht(kit('starter').price) })) + '</span>' + UI.ICON.arrow;
      $('kitLine').hidden = false;
    }
    if ($('kitMinis')) {
      $('kitMinis').innerHTML = ['starter', 'full', 'colours'].map(function (id) {
        var k = kit(id); if (!k) return '';
        return '<a class="kmini reveal show" href="kits.html#kit-' + k.id + '"><span class="km-img"><img src="' + esc(k.img) + '" alt="" loading="lazy"><i>' + esc(kl(k, 'badge')) + '</i></span>' +
          '<span class="km-t"><b>' + esc(kl(k, 'name')) + '</b><span>' + esc(kl(k, 'tag')) + '</span></span>' +
          '<span class="km-p">' + (k.was ? '<s>' + esc(UI.baht(k.was)) + '</s>' : '') + '<b>' + esc(UI.baht(k.price)) + '</b>' + (kl(k, 'ship') ? '<small>' + esc(kl(k, 'ship')) + '</small>' : '') + '</span></a>';
      }).join('');
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-poster]'); if (!b || !$('lightbox')) return;
    openLb(b.dataset.poster, b.dataset.title || '');
  });

  function renderAll() { renderExams(); renderVideos(); renderPrices(); renderStats(); renderMiniChapters(); renderCurriculum(); renderFilters(); renderGallery(); renderFaq(); renderKits(); }
  renderAll();
  document.addEventListener('langchange', renderAll);

  // Arriving with a #hash (e.g. course.html#special, pricing.html#guarantee) — jump there once the content exists
  if (location.hash) setTimeout(function () { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }, 250);
})();
