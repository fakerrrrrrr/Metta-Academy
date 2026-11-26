/* Classroom: plan status, lesson list with locks, protected player. */
(async function () {
  'use strict';
  var session = await UI.init({ page: 'learn', auth: 'user' });
  if (!session) return;
  var t = UI.t, esc = UI.esc, ICON = UI.ICON, A = window.Access;
  var q = new URLSearchParams(location.search);
  var settings, lessons, st, plan, current = null, wmTimer = null, playToken = 0;
  var SEEN_KEY = 'metta_seen_' + session.user.id;
  var seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}'); } catch (e) { seen = {}; }

  async function loadData() {
    var r = await Promise.all([API.getSettings(), API.listLessons(), API.myState()]);
    settings = r[0]; st = r[2];
    lessons = r[1].filter(function (l) { return l.published !== false; })
      .sort(function (a, b) {
        return (a.kind === b.kind ? 0 : a.kind === 'special' ? 1 : -1) || ((a.chapter || 1) - (b.chapter || 1)) ||
          ((a.section || 1) - (b.section || 1)) || ((a.sort || 0) - (b.sort || 0));
      });
    plan = A.planState(st.enrollment, settings, st.today, st.hasPendingInstallment);
  }
  function access(l) {
    return A.lessonAccess(l, { role: st.profile.role, enrollment: st.enrollment, settings: settings,
      purchases: st.purchases, hasPendingInstallment: st.hasPendingInstallment, today: st.today });
  }

  /* ---------- hero: greeting, progress ring, stat tiles */
  // chapter pictures: images/chapters/ch1 … ch5 (course-data.js) — literal paths so the preview builder finds them
  var COVERS = ['images/chapters/ch1.webp', 'images/chapters/ch2.webp', 'images/chapters/ch3.webp', 'images/chapters/ch4.webp', 'images/chapters/ch5.webp'];
  function coreList() { var nums = UI.clipNumbers(lessons); return lessons.filter(function (l) { return nums[l.id]; }); }
  function isOpen(l) { return access(l).open && (!l.coming_soon || st.profile.role === 'admin'); }
  function nextUp() {   // the first open lesson not watched yet
    var c = coreList(), open = c.filter(isOpen);
    return { lesson: open.filter(function (l) { return !seen[l.id]; })[0] || null, any: open[0] || null, open: open.length, n: c.length,
      seen: c.filter(function (l) { return seen[l.id]; }).length };
  }
  function renderStatus() {
    var first = (st.profile.full_name || '').split(' ')[0] || '';
    document.getElementById('hello').textContent = t('hello', { name: first });
    var nums = UI.clipNumbers(lessons), nu = nextUp();
    var pct = nu.n ? Math.round(nu.seen / nu.n * 100) : 0;

    // plan line
    var planName, chip = '';
    if (st.profile.role === 'admin') { planName = t('status_admin'); chip = '<span class="chip gold no-dot">' + esc(t('status_admin_p')) + '</span>'; }
    else if (!plan.plan) { planName = t('status_none'); }
    else if (plan.plan === 'full') { planName = t('status_full'); chip = '<span class="chip ok">' + esc(t('lifetime')) + '</span>'; }
    else if (plan.complete) { planName = t('status_inst'); chip = '<span class="chip ok">' + esc(t('chip_complete')) + '</span>'; }
    else {
      planName = t('status_inst');
      chip = plan.overdue ? '<span class="chip bad">' + esc(t('chip_overdue')) + '</span>' :
        plan.awaiting ? '<span class="chip info">' + esc(t('chip_checking')) + '</span>' :
        plan.daysLeft <= (settings.reminder_days || 3) ? '<span class="chip warn">' + esc(t('chip_due_soon')) + '</span>' : '<span class="chip ok">' + esc(t('chip_active')) + '</span>';
    }
    var segs = '';
    if (plan.plan === 'installment') for (var i = 1; i <= plan.count; i++) segs += '<i class="' + (i <= plan.unlocked ? 'on' : (i === plan.unlocked + 1 && !plan.complete ? 'next' : '')) + '"></i>';
    document.getElementById('planLine').innerHTML = '<b>' + esc(planName) + '</b>' + chip +
      (segs ? '<div class="segs" title="' + esc(t('status_inst_p', { paid: plan.paid, n: plan.count })) + '">' + segs + '</div>' : '');

    // buttons
    var acts = '';
    if (nu.lesson) acts += '<button class="btn btn-gold btn-lg" data-go="' + esc(nu.lesson.id) + '">' + ICON.play + '<span>' + esc(nu.seen ? t('cl_continue', { n: nums[nu.lesson.id] }) : t('cl_start')) + '</span></button>';
    else if (nu.any) acts += '<button class="btn btn-ghost btn-lg" data-go="' + esc(nu.any.id) + '">' + ICON.play + '<span>' + esc(t('cl_rewatch')) + '</span></button>';
    if (st.profile.role === 'admin') acts += '<a class="btn btn-ghost" href="admin.html">' + ICON.gear + '<span>' + esc(t('nav_admin')) + '</span></a>';
    else if (!plan.plan) acts += '<a class="btn btn-gold btn-lg" href="pricing.html">' + esc(t('see_plans')) + ICON.arrow + '</a>';
    else if (plan.plan === 'installment' && !plan.complete && !st.hasPendingInstallment)
      acts += '<a class="btn btn-ghost" href="pay.html?item=installment">' + ICON.card + '<span>' + esc(t('pay_installment_n', { no: plan.paid + 1, amt: UI.baht(settings.installment_amount) })) + '</span></a>';
    document.getElementById('heroActs').innerHTML = acts;

    // ring
    var R = 52, C = 2 * Math.PI * R;
    document.getElementById('ring').innerHTML = '<svg viewBox="0 0 128 128" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9C865"/><stop offset=".5" stop-color="#D4AF37"/><stop offset="1" stop-color="#AA7C11"/></linearGradient></defs>' +
      '<circle cx="64" cy="64" r="' + R + '" class="trk"/><circle cx="64" cy="64" r="' + R + '" class="val" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
      '<div class="ring-in"><b>' + pct + '<small>%</small></b><span>' + esc(t('cl_progress')) + '</span></div>' +
      (nu.n && nu.seen === nu.n ? '<div class="ring-done">' + esc(t('cl_done_all')) + '</div>' : '');

    // stat tiles
    var nextTile;
    if (st.profile.role === 'admin' || plan.plan === 'full' || plan.complete) nextTile = [ICON.shield, t('cl_stat_access'), t('cl_stat_lifetime'), ''];
    else if (plan.plan === 'installment') nextTile = [ICON.clock, t('cl_stat_next'), UI.date(plan.nextDue), UI.baht(settings.installment_amount) + ' · ' + daysText(plan.daysLeft), plan.overdue ? 'bad' : plan.daysLeft <= 3 ? 'warn' : ''];
    else nextTile = [ICON.clock, t('cl_stat_next'), t('cl_stat_none'), ''];
    var tiles = [
      [ICON.tag, t('cl_stat_plan'), planName, plan.plan === 'installment' ? t('status_inst_p', { paid: plan.paid, n: plan.count }) : ''],
      [ICON.book, t('cl_stat_open'), nu.open + ' / ' + nu.n, ''],
      [ICON.check, t('cl_stat_seen'), nu.seen + ' / ' + nu.n, ''],
      nextTile
    ];
    document.getElementById('status').innerHTML = tiles.map(function (x) {
      return '<div class="stat' + (x[4] ? ' ' + x[4] : '') + '"><span class="stat-ic">' + x[0] + '</span><div><span class="stat-l">' + esc(x[1]) + '</span><b>' + esc(x[2]) + '</b>' + (x[3] ? '<i>' + esc(x[3]) + '</i>' : '') + '</div></div>';
    }).join('');
    renderJourney(); renderExam();
  }

  /* ---------- certificate exam (booked / date set / passed, or a small invitation) */
  var CERT_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M7 8.5h10M7 12h6"/><circle cx="16.5" cy="16.5" r="2.6"/><path d="M15.3 18.7l-.8 3 2-1 2 1-.8-3"/></svg>';
  function renderExam() {
    var box = document.getElementById('exam'), C = window.METTA_CONFIG || {};
    var b = (st.exams || []).slice().sort(function (x, y) { return x.created_at < y.created_at ? 1 : -1; })[0];
    if (st.profile.role === 'admin') { box.innerHTML = ''; return; }
    if (!b) {
      if (!plan.plan) { box.innerHTML = ''; return; }
      var ex = settings.exam_packages || API.DEFAULT_EXAMS, min = Math.min.apply(null, ex.map(function (e) { return e.price; }));
      box.innerHTML = '<a class="ex-card invite" href="pricing.html#cert"><span class="ex-ic">' + CERT_IC + '</span><div class="grow"><b>' + esc(t('ex_cta_h')) + '</b><span>' + esc(t('ex_cta_p', { amt: UI.baht(min) })) + '</span></div><span class="btn btn-ghost btn-sm">' + esc(t('ex_cta_btn')) + ICON.arrow + '</span></a>';
      return;
    }
    var line, sub = '', act = '';
    if (b.status === 'passed') {
      line = t('ex_passed'); sub = t('ex_passed_p');
    } else if (b.status === 'scheduled' && b.exam_date) {
      line = t('ex_sched', { date: UI.date(b.exam_date) }); sub = t('ex_sched_p');
    } else {
      line = t('ex_paid');
      if (C.LINE_URL) act = '<a class="btn btn-gold btn-sm" href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener">' + ICON.line + '<span>' + esc(t('ex_contact')) + '</span></a>';
    }
    box.innerHTML = '<div class="ex-card ' + b.status + '"><span class="ex-ic">' + CERT_IC + '</span><div class="grow"><span class="ex-k">' + esc(t('ex_h')) + ' · ' + esc(t('ex_pkg', { n: b.days })) + '</span>' +
      '<b>' + esc(line) + '</b>' + (sub ? '<span>' + esc(sub) + '</span>' : '') + '</div>' + act + '</div>';
  }
  document.getElementById('hero').addEventListener('click', function (e) {
    var b = e.target.closest('[data-go]'); if (!b) return;
    select(lessons.filter(function (l) { return l.id === b.dataset.go; })[0], true, true);
  });

  /* ---------- chapter journey */
  function renderJourney() {
    var nCh = UI.chapters(settings).length, core = coreList(), html = '';
    for (var c = 1; c <= nCh; c++) {
      var ls = core.filter(function (l) { return (l.chapter || 1) === c; }); if (!ls.length) continue;
      var sn = ls.filter(function (l) { return seen[l.id]; }).length, open = ls.filter(isOpen);
      var here = current && current.chapter === c && current.kind !== 'special';
      html += '<button class="jcard' + (open.length ? '' : ' locked') + (sn === ls.length ? ' done' : '') + (here ? ' here' : '') + '" data-ch="' + c + '">' +
        '<span class="jimg" style="background-image:url(\'' + COVERS[(c - 1) % COVERS.length] + '\')"></span><span class="jno">' + (c < 10 ? '0' + c : c) + '</span>' +
        (open.length ? (sn === ls.length ? '<span class="jbadge">' + ICON.check + '</span>' : '') : '<span class="jbadge lk">' + ICON.lock + '</span>') +
        '<span class="jbody"><b>' + esc(UI.chapterTitle(settings, c)) + '</b><small>' + esc(UI.chapterOther(settings, c) || '') + '</small>' +
        '<span class="jbar"><i style="width:' + Math.round(sn / ls.length * 100) + '%"></i></span>' +
        '<span class="jmeta">' + esc(open.length ? t('cl_ch_seen', { seen: sn, n: ls.length }) : t('cl_ch_locked')) + '</span></span></button>';
    }
    document.getElementById('journey').innerHTML = html;
    document.getElementById('journeyWrap').hidden = !html;
  }
  document.getElementById('journey').addEventListener('click', function (e) {
    var b = e.target.closest('.jcard'); if (!b) return;
    var ls = coreList().filter(function (l) { return (l.chapter || 1) === +b.dataset.ch; });
    var pick = ls.filter(function (l) { return isOpen(l) && !seen[l.id]; })[0] || ls.filter(isOpen)[0] || ls[0];
    select(pick, true, true);
  });
  function daysText(d) {
    if (d > 1) return t('in_days', { n: d }); if (d === 1) return t('tomorrow'); if (d === 0) return t('today');
    return t('days_late', { n: -d });
  }

  /* ---------- alerts */
  function renderAlerts() {
    var out = [], e = st.enrollment;
    if (q.get('welcome')) out.push(['ok', ICON.check, t('welcome_alert'), null]);
    if (e && e.suspended) out.push(['bad', ICON.warn, t('alert_suspended'), null]);
    else if (plan.overdue) out.push(['bad', ICON.warn, t('alert_overdue', { no: plan.paid + 1, date: UI.date(plan.nextDue), amt: UI.baht(settings.installment_amount) }), ['pay.html?item=installment', t('pay_now')]]);
    else if (plan.plan === 'installment' && !plan.complete && !st.hasPendingInstallment && plan.daysLeft <= Math.max(settings.reminder_days || 3, 3))
      out.push(['warn', ICON.clock, t('alert_due_soon', { no: plan.paid + 1, when: daysText(plan.daysLeft), date: UI.date(plan.nextDue) }), ['pay.html?item=installment', t('pay_now')]]);
    var pending = st.payments.filter(function (p) { return p.status === 'pending'; });
    if (pending.length) out.push(['info', ICON.clock, t('alert_pending', { n: pending.length }), ['pay.html#history', t('view')]]);
    var last = st.payments[0];
    if (last && last.status === 'rejected' && last.reviewed_at && (Date.now() - new Date(last.reviewed_at)) < 14 * 86400000)
      out.push(['bad', ICON.warn, t('alert_rejected', { reason: last.reject_reason || '—' }), ['pay.html', t('upload_again')]]);
    UI.notes().filter(function (n) { return n.kind === 'approved' && !n.read_at && !welcomeShown[n.payment_id]; }).slice(0, 2).forEach(function (n) {
      var x = UI.noteItem(n), d = n.data || {};
      out.unshift(['ok', ICON.check, t('ap_alert', { item: x.body.split(' · ')[0], amt: UI.baht(d.amount || 0) }), [x.href, t('ap_receipt')], n.id]);
    });
    document.getElementById('alerts').innerHTML = out.map(function (a) {
      return '<div class="alert ' + a[0] + '">' + a[1] + '<div class="grow">' + esc(a[2]) + '</div>' +
        (a[3] ? '<a class="btn btn-sm ' + (a[0] === 'bad' ? 'btn-gold' : 'btn-ghost') + '" href="' + a[3][0] + '"' + (a[4] ? ' data-read="' + esc(a[4]) + '"' : '') + '>' + esc(a[3][1]) + '</a>' : '') +
        (a[4] ? '<button class="alert-x" data-read="' + esc(a[4]) + '" aria-label="' + esc(t('dismiss')) + '">×</button>' : '') + '</div>';
    }).join('');
  }

  var welcomeShown = {};
  document.getElementById('alerts').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-read]'); if (!b) return;
    var id = b.dataset.read, n = UI.notes().filter(function (x) { return x.id === id; })[0];
    if (n) n.read_at = new Date().toISOString();
    if (b.tagName === 'BUTTON') { e.preventDefault(); renderAlerts(); UI.renderBell(); }
    try { await API.markRead([id]); } catch (er) { /* ignore */ }
  });

  /* ---------- welcome to the academy (first approved payment) */
  function showWelcome(n) {
    welcomeShown[n.payment_id] = 1;
    var rel = UI.notes().filter(function (x) { return x.payment_id === n.payment_id && !x.read_at; }).map(function (x) { return x.id; });
    var C = window.METTA_CONFIG || {}, bits = '';
    for (var i = 0; i < 28; i++) bits += '<i style="--x:' + (Math.random() * 100).toFixed(1) + '%;--d:' + (Math.random() * 2.5).toFixed(2) + 's;--r:' + Math.round(Math.random() * 360) + 'deg;--s:' + (0.6 + Math.random() * 0.9).toFixed(2) + '"></i>';
    var bg = document.createElement('div'); bg.className = 'modal-bg wl-bg';
    bg.innerHTML = '<div class="wl" role="dialog" aria-modal="true" aria-labelledby="wlH"><div class="wl-confetti" aria-hidden="true">' + bits + '</div>' +
      '<div class="wl-top"><img src="images/teacher-award.webp" alt="" class="wl-photo"><img src="images/logo-cat.png" alt="" class="wl-cat"></div>' +
      '<div class="wl-body"><div class="wl-kicker">' + ICON.check + '<span>' + esc(t('wl_kicker')) + '</span></div>' +
      '<h2 id="wlH">' + esc(t('wl_h')) + '</h2><p>' + esc(t('wl_p')) + '</p>' +
      '<ol class="wl-steps"><li><b>1</b><span>' + esc(t('wl_s1')) + '</span></li><li><b>2</b><span>' + esc(t('wl_s2')) + '</span></li><li><b>3</b><span>' + esc(t('wl_s3')) + '</span></li></ol>' +
      '<div class="wl-sign">' + esc(t('wl_sign')) + '</div>' +
      '<div class="wl-acts"><button class="btn btn-gold btn-lg" id="wlGo">' + ICON.play + '<span>' + esc(t('wl_start')) + '</span></button>' +
      '<a class="btn btn-ghost" href="receipt.html?id=' + encodeURIComponent(n.payment_id || '') + '" id="wlRc">' + ICON.receipt + '<span>' + esc(t('wl_receipt')) + '</span></a>' +
      (C.LINE_URL ? '<a class="btn btn-ghost" href="' + esc(C.LINE_URL) + '" target="_blank" rel="noopener">' + ICON.line + '<span>LINE</span></a>' : '') + '</div></div></div>';
    document.body.appendChild(bg); document.body.style.overflow = 'hidden';
    async function done() {
      rel.forEach(function (id) { var x = UI.notes().filter(function (y) { return y.id === id; })[0]; if (x) x.read_at = new Date().toISOString(); });
      UI.renderBell(); renderAlerts();
      try { await API.markRead(rel); } catch (e) { /* ignore */ }
    }
    function close() { bg.remove(); document.body.style.overflow = ''; done(); }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.addEventListener('keydown', function esc_(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', esc_); if (bg.isConnected) close(); } });
    bg.querySelector('#wlGo').onclick = function () {
      close(); var nu = nextUp(); if (nu.lesson || nu.any) select(nu.lesson || nu.any, true, true);
    };
    bg.querySelector('#wlRc').addEventListener('click', function () { done(); });
    setTimeout(function () { bg.querySelector('#wlGo').focus(); }, 50);
  }
  function checkNotes() {
    var w = UI.notes().filter(function (n) { return n.kind === 'welcome' && !n.read_at && !welcomeShown[n.payment_id]; })[0];
    if (w && !document.querySelector('.wl-bg')) showWelcome(w);
    renderAlerts();
  }

  /* ---------- lesson list */
  function renderList() {
    var box = document.getElementById('lessons');
    var open = lessons.filter(function (l) { return access(l).open && !l.coming_soon; }).length;
    var nums = UI.clipNumbers(lessons), coreN = Object.keys(nums).length;
    var seenN = lessons.filter(function (l) { return nums[l.id] && seen[l.id]; }).length;
    if (coreN) open = lessons.filter(function (l) { return nums[l.id] && access(l).open && !l.coming_soon; }).length;
    var html = '<div class="lessons-head"><b>' + esc(t('course_content')) + '</b><span class="prog"><span>' +
      esc(t('open_of', { open: open, n: coreN || lessons.length })) + '</span>' + (coreN ? '<span>' + esc(t('watched_of', { seen: seenN, n: coreN })) + '</span>' : '') + '</span></div>';
    var groups = [], coreLs = lessons.filter(function (l) { return l.kind !== 'special'; });
    var nCh = coreLs.reduce(function (m, l) { return Math.max(m, l.chapter || 1); }, UI.chapters(settings).length);
    for (var c = 1; c <= nCh; c++) {
      var ls = coreLs.filter(function (l) { return (l.chapter || 1) === c; });
      if (ls.length) groups.push({ no: c < 10 ? '0' + c : '' + c, title: UI.chapterTitle(settings, c), alt: UI.chapterOther(settings, c), list: ls });
    }
    var sp = lessons.filter(function (l) { return l.kind === 'special'; });
    if (sp.length) groups.push({ no: '+', title: t('special_title'), alt: t('special_meta'), list: sp, special: true });
    groups.forEach(function (g) {
      var lockedAll = g.list.every(function (l) { return !access(l).open; });
      html += '<div class="lsec' + (g.special ? ' special' : '') + '"><div class="lsec-h"><span class="no">' + g.no + '</span><span class="t">' + esc(g.title) + (g.alt ? '<small class="alt">' + esc(g.alt) + '</small>' : '') + '</span>' +
        (lockedAll ? ICON.lock : '') + '</div>';
      g.list.forEach(function (l) {
        var a = access(l), cls = a.open && !l.coming_soon ? 'open' : 'locked';
        if (l.coming_soon) cls += ' soon';
        if (seen[l.id]) cls += ' seen';
        if (current && current.id === l.id) cls += ' active';
        var tag = l.coming_soon ? t('coming_soon') : l.is_preview ? t('free_preview') :
          (!a.open && a.buyable ? UI.baht(l.price) : (!a.open && a.reason === 'section_locked' ? t('month_tag', { n: l.section }) : ''));
        var fresh = isNew(l) ? '<span class="chip gold no-dot new">' + esc(t('new_badge')) + '</span>' : '';
        html += '<button class="lrow ' + cls + '" data-id="' + esc(l.id) + '"><span class="ic">' + (l.coming_soon ? ICON.clock : a.open ? (seen[l.id] ? ICON.check : ICON.play) : ICON.lock) + '</span>' +
          '<span class="tt"><b>' + (nums[l.id] ? '<span class="n">' + nums[l.id] + '.</span> ' : '') + esc(UI.pick(l, 'title')) + '</b><i>' + esc(l.duration_min ? t('n_min', { n: l.duration_min }) : '') + '</i></span>' +
          fresh + (tag ? '<span class="tag">' + esc(tag) + '</span>' : '') + '</button>';
      });
      html += '</div>';
    });
    if (!groups.length) html += '<div class="empty">' + esc(t('no_lessons_yet')) + '</div>';
    box.innerHTML = html;
  }
  document.getElementById('lessons').addEventListener('click', function (e) {
    var b = e.target.closest('.lrow'); if (!b) return;
    select(lessons.filter(function (l) { return l.id === b.dataset.id; })[0], true);
  });

  // A clip counts as new for 14 days after it is added.
  function isNew(l) { return l.created_at && (Date.now() - new Date(l.created_at)) < 14 * 86400000; }

  /* ---------- player */
  function stopWatermark() { if (wmTimer) { clearInterval(wmTimer); wmTimer = null; } }
  function select(l, scroll, always) {
    if (!l) return;
    current = l; stopWatermark();
    playToken++;   // cancels any video still loading for the previously selected lesson
    var url = new URL(location.href); url.searchParams.set('lesson', l.id); url.searchParams.delete('welcome'); history.replaceState(null, '', url);
    renderList(); renderInfo(); renderJourney();
    var a = access(l), p = document.getElementById('player');
    if (l.coming_soon && st.profile.role !== 'admin') p.innerHTML = soonPanel(l);
    else if (a.open) play(l); else p.innerHTML = lockPanel(l, a);
    if (scroll && (always || innerWidth < 1000)) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderInfo() {
    var l = current; if (!l) { document.getElementById('lessonInfo').innerHTML = ''; return; }
    var next = lessons[lessons.indexOf(l) + 1] || null, prev = lessons[lessons.indexOf(l) - 1] || null;
    var no = UI.clipNumbers(lessons)[l.id];
    var where = l.kind === 'special' ? t('special_title') :
      (no ? t('clip_no', { n: no }) + ' · ' : '') + t('chapter_n', { n: l.chapter || 1 }) + ' · ' + UI.chapterTitle(settings, l.chapter || 1);
    document.getElementById('lessonInfo').innerHTML = '<div class="now">' + (no ? '<span class="now-n">' + no + '</span>' : '') + '<span>' + esc(t('cl_now_playing')) + '</span></div><h2>' + esc(UI.pick(l, 'title')) + '</h2>' +
 '<div class="meta"><span>' + esc(where) + '</span>' +
      (l.kind !== 'special' && !(plan.plan === 'full' || plan.complete || st.profile.role === 'admin') ? '<span>· ' + esc(t('month_tag', { n: l.section || 1 })) + '</span>' : '') +   // the month only matters to monthly students
      (l.duration_min ? '<span>· ' + esc(t('n_min', { n: l.duration_min })) + '</span>' : '') +
      (l.coming_soon ? '<span class="chip info no-dot">' + esc(t('coming_soon')) + '</span>' : '') +
      (l.is_preview ? '<span class="chip gold no-dot">' + esc(t('free_preview')) + '</span>' : '') + '</div>' +
      (UI.pick(l, 'description') ? '<p>' + esc(UI.pick(l, 'description')) + '</p>' : '') + kitTip(l) +
      ((prev || next) ? '<div class="next-row">' +
        (prev ? '<button class="btn btn-ghost btn-sm prev" id="prevBtn">' + ICON.arrow + '<span>' + esc(t('cl_prev')) + '</span></button>' : '<span></span>') +
        (next ? '<button class="btn btn-gold btn-sm" id="nextBtn"><span>' + esc(t('cl_next')) + ': ' + esc(UI.pick(next, 'title')) + '</span>' + ICON.arrow + '</button>' : '') + '</div>' : '');
    var nb = document.getElementById('nextBtn'), pb = document.getElementById('prevBtn');
    if (nb) nb.onclick = function () { select(next, true, true); };
    if (pb) pb.onclick = function () { select(prev, true, true); };
  }
  // Equipment from the shop, where a chapter needs it: chapter 1 (equipment) → starter kit, chapter 4 (colour) → colour set
  function kitTip(l) {
    var K = window.METTA_KITS || [], id = l.kind === 'special' ? null : ({ 1: 'starter', 4: 'colours' })[l.chapter || 1];
    var k = id && K.filter(function (x) { return x.id === id; })[0]; if (!k) return '';
    var en = UI.lang() === 'en';
    return '<a class="kit-tip" href="kits.html#kit-' + k.id + '"><img src="' + esc(k.img) + '" alt=""><span><i>' + esc(t(id === 'starter' ? 'kits_tip_ch1' : 'kits_tip_ch4')) + '</i>' +
      '<b>' + esc(en ? k.name_en : k.name_th) + ' · ' + esc(UI.baht(k.price)) + '</b></span>' + ICON.arrow + '</a>';
  }
  function lockPanel(l, a) {
    var title, text, acts = [];
    var buy = a.buyable ? '<a class="btn btn-ghost btn-sm" href="pay.html?item=lesson&lesson=' + encodeURIComponent(l.id) + '">' + esc(t('buy_lesson', { price: UI.baht(l.price) })) + '</a>' : '';
    switch (a.reason) {
      case 'overdue':
        title = t('lock_overdue_h'); text = t('lock_overdue_p', { no: plan.paid + 1, date: UI.date(plan.nextDue) });
        acts.push('<a class="btn btn-gold btn-sm" href="pay.html?item=installment">' + esc(t('pay_installment_n', { no: plan.paid + 1, amt: UI.baht(settings.installment_amount) })) + '</a>'); break;
      case 'section_locked':
        title = t('lock_section_h', { no: l.section }); text = t('lock_section_p', { no: l.section });
        if (l.section === plan.paid + 1 && !st.hasPendingInstallment) acts.push('<a class="btn btn-gold btn-sm" href="pay.html?item=installment">' + esc(t('pay_installment_n', { no: plan.paid + 1, amt: UI.baht(settings.installment_amount) })) + '</a>');
        else if (st.hasPendingInstallment) text += ' ' + t('lock_pending_extra');
        else acts.push('<a class="btn btn-gold btn-sm" href="pay.html?item=installment&n=' + (l.section - plan.paid) + '">' + esc(t('pay_ahead', { n: l.section - plan.paid })) + '</a>');
        acts.push(buy); break;
      case 'special_locked':
        title = t('lock_special_h'); text = t('lock_special_p');
        acts.push(a.buyable ? buy.replace('btn-ghost', 'btn-gold') : ''); break;
      case 'coming_soon':
        return soonPanel(l);
      case 'suspended':
        title = t('lock_suspended_h'); text = t('alert_suspended');
        acts.push('<a class="btn btn-ghost btn-sm" href="tel:' + esc(window.METTA_CONFIG.PHONE_INTL) + '">' + esc(window.METTA_CONFIG.PHONE) + '</a>'); break;
      default:
        title = t('lock_enroll_h'); text = t('lock_enroll_p');
        acts.push('<a class="btn btn-gold btn-sm" href="pay.html?item=full">' + esc(t('plan_full')) + ' ' + esc(UI.baht(settings.full_price)) + '</a>');
        acts.push('<a class="btn btn-ghost btn-sm" href="pay.html?item=installment">' + esc(t('plan_inst')) + ' ' + esc(UI.baht(settings.installment_amount)) + esc(t('per_month')) + '</a>');
        acts.push(buy);
    }
    return '<div class="state">' + ICON.lock.replace('<svg', '<svg class="big"') + '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="acts">' + acts.join('') + '</div></div>';
  }
  function soonPanel(l) {
    return '<div class="state">' + ICON.clock.replace('<svg', '<svg class="big"') + '<h3>' + esc(t('soon_h')) + '</h3><p>' +
      esc(l.kind === 'special' ? t('soon_special_p') : t('soon_p')) + '</p></div>';
  }
  async function play(l) {
    var p = document.getElementById('player'), my = ++playToken;
    p.innerHTML = '<div class="state"><span class="btn busy" style="border:0"></span><p>' + esc(t('loading_video')) + '</p></div>';
    try {
      var r = await API.getPlayback(l.id);
      if (my !== playToken || !p.isConnected) return;   // user clicked another lesson or left the page meanwhile
      seen[l.id] = 1; try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* ignore */ }
      if (r.kind === 'vdocipher') {
        p.innerHTML = '<iframe src="https://player.vdocipher.com/v2/?otp=' + encodeURIComponent(r.otp) + '&playbackInfo=' + encodeURIComponent(r.playbackInfo) +
          '" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen title="' + esc(UI.pick(l, 'title')) + '"></iframe>';
      } else demoPlayer(p, l, r);
      renderList(); renderStatus();
    } catch (e) {
      if (my !== playToken || !p.isConnected) return;
      if (e.code === 'other_device') { await API.signOut(); location.replace('login.html?kicked=1'); return; }
      if (e.code === 'locked') {
        await refresh(false);
        if (!access(current).open) return;          // the lock screen is now showing
      }
      p.innerHTML = '<div class="state">' + ICON.warn.replace('<svg', '<svg class="big"') + '<h3>' + esc(UI.errorText(e)) + '</h3>' +
        '<div class="acts"><button class="btn btn-ghost btn-sm" id="retry">' + esc(t('retry')) + '</button></div></div>';
      var rb = p.querySelector('#retry'); if (rb) rb.onclick = function () { play(l); };
    }
  }
  // Demo stand-in for the VdoCipher player, with the same kind of moving watermark.
  var lastDemo = null;
  function demoPlayer(p, l, r) {
    lastDemo = { l: l, r: r };
    p.innerHTML = '<div class="demo-video"><div class="art"></div><span class="tag">' + esc(t('demo_player_tag')) + '</span>' +
      '<div class="state" style="background:none">' + ICON.playCircle.replace('<svg', '<svg class="big"') + '<h3>' + esc(UI.pick(l, 'title')) + '</h3><p>' + esc(t('demo_player_p')) + '</p></div>' +
      '<span class="vwm" id="wm1">' + esc(r.watermark) + '</span><span class="vwm faint" id="wm2">' + esc(r.email) + '</span>' +
      '<div class="bar"><span>0:00</span><div class="track"><i></i></div><span>' + (l.duration_min || 10) + ':00</span></div></div>';
    function move() {
      ['wm1', 'wm2'].forEach(function (id) {
        var w = document.getElementById(id); if (!w) return;
        w.style.left = (5 + Math.random() * 55) + '%'; w.style.top = (8 + Math.random() * 72) + '%';
      });
    }
    // place once, then drift slowly to a new spot (no jumping — calm to watch, still never in one fixed place)
    move(); setTimeout(move, 60); wmTimer = setInterval(move, 24000);
  }
  // Light deterrents on top of DRM: no right-click / drag on the player.
  ['contextmenu', 'dragstart'].forEach(function (ev) { document.getElementById('player').addEventListener(ev, function (e) { e.preventDefault(); }); });

  // initial=true picks a lesson; later refreshes keep the video playing unless its lock changed.
  async function refresh(initial) {
    var wasOpen = current ? access(current).open : null;
    await loadData(); renderStatus(); renderAlerts();
    if (!initial && current) {
      var cur = lessons.filter(function (l) { return l.id === current.id; })[0];
      if (cur && access(cur).open === wasOpen) { current = cur; renderList(); renderInfo(); return; }
    }
    var want = q.get('lesson') && lessons.filter(function (l) { return l.id === q.get('lesson'); })[0];
    if (current) want = lessons.filter(function (l) { return l.id === current.id; })[0] || want;
    if (!want) {
      var openOnes = lessons.filter(function (l) { return access(l).open; });
      want = openOnes.filter(function (l) { return !seen[l.id]; })[0] || openOnes[0] || lessons[0];
    }
    if (want) select(want); else { renderList(); document.getElementById('player').innerHTML = '<div class="state"><p>' + esc(t('no_lessons_yet')) + '</p></div>'; }
  }

  try { await refresh(true); }
  catch (e) { document.getElementById('alerts').innerHTML = '<div class="alert bad">' + ICON.warn + '<div class="grow">' + esc(UI.errorText(e)) + '</div></div>'; return; }
  UI.notesReady().then(checkNotes);
  // A new approval arrives while the page is open (bell checks every minute) → refresh the locks, then celebrate.
  document.addEventListener('notes', function (e) {
    var fresh = e.detail.some(function (n) { return !n.read_at && ((n.kind === 'approved' || n.kind === 'welcome') && !welcomeShown[n.payment_id] || /^exam_/.test(n.kind)); });
    (fresh ? refresh(false) : Promise.resolve()).then(checkNotes).catch(function () {});
  });
  document.addEventListener('langchange', function () {
    renderStatus(); renderAlerts(); renderList(); renderInfo();
    if (!current) return;
    if (!access(current).open) document.getElementById('player').innerHTML = lockPanel(current, access(current));
    else if (lastDemo && lastDemo.l.id === current.id && document.querySelector('#player .demo-video')) { stopWatermark(); demoPlayer(document.getElementById('player'), current, lastDemo.r); }
  });
  // Come back to the tab after paying elsewhere → refresh the locks.
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(false).catch(function () {}); });
})();
