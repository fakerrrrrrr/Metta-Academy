/* Admin: overview, slip approval, students, lessons, settings. */
(async function () {
  'use strict';
  var session = await UI.init({ page: 'admin', auth: 'admin' });
  if (!session) return;
  var t = UI.t, esc = UI.esc, ICON = UI.ICON, A = window.Access;
  var settings, lessons, students, pending, videos = {}, today = API.today();
  var tab = (location.hash || '#overview').slice(1), slipView = 'pending', stuFilter = 'all', stuSearch = '';

  async function loadAll() {
    var r = await Promise.all([API.getSettings(), API.listLessons(), API.admin.students(), API.admin.payments('pending'), API.admin.lessonVideos()]);
    settings = r[0]; lessons = r[1]; students = r[2]; pending = r[3]; videos = r[4] || {};
    today = API.today();
    students.forEach(function (s) { s.plan = A.planState(s.enrollment, settings, today, s.hasPendingInstallment); });
    var c = document.getElementById('slipCount'); c.textContent = pending.length; c.hidden = !pending.length;
  }
  function lessonById(id) { return lessons.filter(function (l) { return l.id === id; })[0]; }
  function itemLabel(p) {
    var ex = p.exam_days ? t('item_exam', { n: p.exam_days }) : '';
    if (p.kind === 'exam') return ex;
    if (p.kind === 'full') return t('item_full') + (ex ? ' + ' + ex : '');
    if (p.kind === 'installment') return (p.installments > 1 ? t('item_inst_multi', { n: p.installments }) : t('item_inst')) + (ex ? ' + ' + ex : '');
    var l = lessonById(p.lesson_id); return t('item_lesson') + (l ? ': ' + UI.pick(l, 'title') : '');
  }
  function planChip(s) {
    var p = s.plan;
    if (s.enrollment && s.enrollment.suspended) return '<span class="chip bad">' + esc(t('chip_suspended')) + '</span>';
    if (!p.plan) return s.purchases.length ? '<span class="chip info">' + esc(t('chip_single', { n: s.purchases.length })) + '</span>' : '<span class="chip">' + esc(t('chip_none')) + '</span>';
    if (p.plan === 'full') return '<span class="chip gold">' + esc(t('chip_full')) + '</span>';
    if (p.complete) return '<span class="chip gold">' + esc(t('chip_complete')) + '</span>';
    if (p.overdue) return '<span class="chip bad">' + esc(t('chip_overdue')) + '</span>';
    if (p.awaiting) return '<span class="chip info">' + esc(t('chip_checking')) + '</span>';
    if (p.daysLeft <= 7) return '<span class="chip warn">' + esc(t('chip_due_soon')) + '</span>';
    return '<span class="chip ok">' + esc(t('chip_active')) + '</span>';
  }
  function segs(s) {
    var p = s.plan, h = '<span class="mini-segs">';
    for (var i = 1; i <= settings.installment_count; i++) h += '<i class="' + (p.plan && i <= p.unlocked ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  function dueText(p) {
    if (!p.nextDue) return '—';
    var d = p.daysLeft;
    return UI.date(p.nextDue) + '<span class="sub">' + esc(d > 0 ? t('in_days', { n: d }) : d === 0 ? t('today') : t('days_late', { n: -d })) + '</span>';
  }
  function bkkMonth(iso) { return A.bangkokToday(iso).slice(0, 7); }

  /* ---------- tabs */
  function showTab(name) {
    tab = ['overview', 'slips', 'students', 'lessons', 'settings'].indexOf(name) === -1 ? 'overview' : name;
    history.replaceState(null, '', '#' + tab);
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    document.querySelectorAll('main section[id^=tab-]').forEach(function (s) { s.hidden = s.id !== 'tab-' + tab; });
    ({ overview: renderOverview, slips: renderSlips, students: renderStudents, lessons: renderLessons, settings: renderSettings })[tab]();
  }
  document.getElementById('tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showTab(b.dataset.tab); });

  /* ---------- overview */
  function renderOverview() {
    var enrolled = students.filter(function (s) { return s.plan.plan; });
    var full = enrolled.filter(function (s) { return s.plan.plan === 'full' || s.plan.complete; }).length;
    var overdue = students.filter(function (s) { return s.plan.overdue && !(s.enrollment && s.enrollment.suspended); });
    var soon = students.filter(function (s) { return s.plan.plan === 'installment' && !s.plan.complete && !s.plan.overdue && s.plan.daysLeft >= 0 && s.plan.daysLeft <= 7; })
      .sort(function (a, b) { return a.plan.daysLeft - b.plan.daysLeft; });
    var month = A.bangkokToday().slice(0, 7), revenue = 0;
    students.forEach(function (s) { s.payments.forEach(function (p) { if (p.status === 'approved' && p.reviewed_at && bkkMonth(p.reviewed_at) === month) revenue += p.amount; }); });
    var setup = [];
    var hasBank = String(settings.bank_account || '').replace(/\D/g, '').length >= 8;
    if (!hasBank && !PromptPay.isValidId(settings.promptpay_id)) setup.push(['settings', t('setup_pp')]);
    var noVideo = lessons.filter(function (l) { return !videos[l.id] && !l.coming_soon && l.published !== false; }).length;   // students would see an error
    if (API.mode === 'live' && noVideo) setup.push(['lessons', t('setup_video', { n: noVideo })]);
    if (!lessons.length) setup.push(['lessons', t('setup_lessons')]);

    function personRow(s, extra) {
      var p = s.profile;
      return '<tr class="click" data-stu="' + esc(p.id) + '"><td>' + esc(p.full_name || p.email) + '<span class="sub">' + esc(p.phone || p.email) + '</span></td><td>' + extra + '</td><td>' + planChip(s) + '</td></tr>';
    }
    var examStudents = students.filter(function (s) { var b = lastExam(s); return b && b.status !== 'passed'; })
      .sort(function (a, b) { return (lastExam(a).exam_date || '9') < (lastExam(b).exam_date || '9') ? -1 : 1; });
    var el = document.getElementById('tab-overview');
    el.innerHTML =
      (setup.length ? '<div class="alert warn">' + ICON.warn + '<div class="grow"><b>' + esc(t('setup_h')) + '</b><br>' + setup.map(function (s) { return '<a class="link" href="#' + s[0] + '" data-go="' + s[0] + '">' + esc(s[1]) + '</a>'; }).join('<br>') + '</div></div>' : '') +
      '<div class="kpis">' +
      kpi(enrolled.length, t('kpi_enrolled'), '') + kpi(full, t('kpi_full'), '') +
      kpi(enrolled.length - full, t('kpi_inst'), '') + kpi(overdue.length, t('kpi_overdue'), overdue.length ? 'alertk' : '') +
      kpi(UI.baht(revenue), t('kpi_revenue'), '') + '</div>' +
      (pending.length ? '<div class="alert info">' + ICON.clock + '<div class="grow">' + esc(t('ov_pending', { n: pending.length })) + '</div><button class="btn btn-gold btn-sm" data-go="slips">' + esc(t('ov_check_now')) + '</button></div>' : '') +
      '<div class="grid-2" style="margin-top:1rem">' +
      '<div><h3 class="card-h" style="margin-bottom:.8rem">' + esc(t('ov_overdue')) + '</h3>' +
      (overdue.length ? '<div class="tbl-wrap"><table class="tbl" style="min-width:0"><tbody>' + overdue.map(function (s) { return personRow(s, dueText(s.plan)); }).join('') + '</tbody></table></div>' : '<div class="card empty">' + esc(t('ov_none_overdue')) + '</div>') + '</div>' +
      '<div><h3 class="card-h" style="margin-bottom:.8rem">' + esc(t('ov_soon')) + '</h3>' +
      (soon.length ? '<div class="tbl-wrap"><table class="tbl" style="min-width:0"><tbody>' + soon.map(function (s) { return personRow(s, dueText(s.plan)); }).join('') + '</tbody></table></div>' : '<div class="card empty">' + esc(t('ov_none_soon')) + '</div>') + '</div></div>' +
      (examStudents.length ? '<h3 class="card-h" style="margin:1.6rem 0 .8rem">' + esc(t('adm_ex_list')) + '</h3><div class="tbl-wrap"><table class="tbl" style="min-width:0"><tbody>' +
        examStudents.map(function (s) { var b = lastExam(s); return personRow(s, esc(t('item_exam', { n: b.days })) + '<span class="sub">' + examChip(b) + (b.exam_date && b.status !== 'passed' ? ' ' + esc(UI.date(b.exam_date)) : '') + '</span>'); }).join('') + '</tbody></table></div>' : '');
  }
  function lastExam(s) { return (s.exams || []).slice().sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; })[0] || null; }
  function examChip(b) {
    return '<span class="chip ' + (b.status === 'passed' ? 'gold' : b.status === 'scheduled' ? 'info' : 'warn') + '">' + esc(t('adm_ex_st_' + b.status)) + '</span>';
  }
  function kpi(v, l, cls) { return '<div class="kpi ' + cls + '"><div class="v">' + esc(v) + '</div><div class="l">' + esc(l) + '</div></div>'; }
  document.querySelector('main').addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); showTab(g.dataset.go); return; }
    var r = e.target.closest('[data-stu]'); if (r) openStudent(r.dataset.stu);
  });

  /* ---------- slips */
  async function renderSlips() {
    var el = document.getElementById('tab-slips');
    el.innerHTML = '<div class="toolbar"><div class="seg-filter"><button data-sv="pending" class="' + (slipView === 'pending' ? 'active' : '') + '">' + esc(t('slips_pending')) + ' (' + pending.length + ')</button>' +
      '<button data-sv="done" class="' + (slipView === 'done' ? 'active' : '') + '">' + esc(t('slips_done')) + '</button></div></div><div id="slipBody"></div>';
    el.querySelectorAll('[data-sv]').forEach(function (b) { b.onclick = function () { slipView = b.dataset.sv; renderSlips(); }; });
    var body = document.getElementById('slipBody');
    if (slipView === 'pending') {
      if (!pending.length) { body.innerHTML = '<div class="card empty">' + esc(t('slips_empty')) + '</div>'; return; }
      body.innerHTML = '<div class="slips">' + pending.map(function (p) {
        var pr = p.profile || {};
        return '<div class="slip" data-pid="' + esc(p.id) + '"><div class="img" data-zoom="' + esc(p.id) + '"><span class="faint">…</span></div><div class="body">' +
          '<div class="amt gold">' + esc(UI.baht(p.amount)) + '</div><b>' + esc(itemLabel(p)) + '</b>' +
          '<span>' + esc(pr.full_name || '—') + ' · <a class="link" href="tel:' + esc(pr.phone) + '">' + esc(pr.phone || '') + '</a></span>' +
          '<span class="faint" style="font-size:.8rem">' + esc(pr.email || '') + '</span>' +
          '<span class="faint" style="font-size:.8rem">' + esc(t('sent_at', { when: UI.dateTime(p.created_at) })) + '</span>' +
          (p.note ? '<span style="font-size:.86rem">“' + esc(p.note) + '”</span>' : '') + '</div>' +
          '<div class="acts"><button class="btn btn-danger btn-sm" data-reject="' + esc(p.id) + '">' + esc(t('reject')) + '</button>' +
          '<button class="btn btn-ok btn-sm" data-approve="' + esc(p.id) + '">' + esc(t('approve')) + '</button></div></div>';
      }).join('') + '</div><p class="faint" style="font-size:.82rem;margin-top:1rem">' + esc(t('slips_tip')) + '</p>';
      pending.forEach(async function (p) {
        var url = await API.slipUrl(p), box = body.querySelector('[data-zoom="' + p.id + '"]');
        if (box) { box.innerHTML = '<img alt="slip" src="' + esc(url) + '">'; box.dataset.url = url; }
      });
    } else {
      body.innerHTML = '<div class="card empty">…</div>';
      var done = (await API.admin.payments(null)).filter(function (p) { return p.status !== 'pending'; }).slice(0, 80);
      body.innerHTML = done.length ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('col_date')) + '</th><th>' + esc(t('col_student')) + '</th><th>' + esc(t('col_item')) + '</th><th>' + esc(t('col_amount')) + '</th><th>' + esc(t('col_status')) + '</th></tr></thead><tbody>' +
        done.map(function (p) {
          return '<tr><td>' + esc(UI.dateTime(p.created_at)) + '</td><td>' + esc(p.profile ? p.profile.full_name : '—') + '</td><td>' + esc(itemLabel(p)) + '</td><td>' + esc(UI.baht(p.amount)) + '</td><td>' +
            (p.status === 'approved' ? '<span class="chip ok">' + esc(t('st_approved')) + '</span> <a class="link" style="font-size:.8rem" href="receipt.html?id=' + encodeURIComponent(p.id) + '">' + esc(t('receipt')) + '</a>' : '<span class="chip bad">' + esc(t('st_rejected')) + '</span><span class="sub">' + esc(p.reject_reason) + '</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="card empty">' + esc(t('slips_none_done')) + '</div>';
    }
  }
  document.getElementById('tab-slips').addEventListener('click', async function (e) {
    var z = e.target.closest('[data-zoom]');
    if (z && z.dataset.url) { UI.modal({ title: t('view_slip'), wide: true, body: '<img class="zoom-img" src="' + esc(z.dataset.url) + '" alt="slip">' }); return; }
    var ap = e.target.closest('[data-approve]'), rj = e.target.closest('[data-reject]');
    var id = (ap || rj) && (ap || rj).dataset[ap ? 'approve' : 'reject']; if (!id) return;
    var p = pending.filter(function (x) { return x.id === id; })[0];
    if (ap) {
      if (!(await UI.confirm(t('approve_q', { amt: UI.baht(p.amount), name: (p.profile || {}).full_name || '', item: itemLabel(p) }), t('approve')))) return;
      await act(ap, function () { return API.admin.approve(id).then(function (r) { UI.refreshBell(); return r; }); }, t('approved_toast'));
    } else {
      var reason = await UI.prompt(t('reject_h'), t('reject_reason'), t('reject_ph'));
      if (reason === null) return;
      await act(rj, function () { return API.admin.reject(id, reason).then(function (r) { UI.refreshBell(); return r; }); }, t('rejected_toast'));
    }
  });
  async function act(btn, fn, okMsg) {
    try { await UI.busy(btn, fn); UI.toast(okMsg, 'ok'); await loadAll(); showTab(tab); }
    catch (er) { UI.toast(UI.errorText(er), 'bad'); }
  }

  /* ---------- students */
  function renderStudents() {
    var el = document.getElementById('tab-students');
    var filters = [['all', t('f_all')], ['full', t('chip_full')], ['installment', t('plan_inst')], ['overdue', t('chip_overdue')], ['soon', t('chip_due_soon')], ['none', t('chip_none')]];
    el.innerHTML = '<div class="toolbar"><input class="input" id="stuSearch" type="search" data-i18n-ph="search_ph" value="' + esc(stuSearch) + '"><div class="seg-filter">' +
      filters.map(function (f) { return '<button data-sf="' + f[0] + '" class="' + (stuFilter === f[0] ? 'active' : '') + '">' + esc(f[1]) + '</button>'; }).join('') + '</div>' +
      '<span class="grow"></span><button class="btn btn-ghost btn-sm" id="csvBtn">' + esc(t('export_csv')) + '</button></div><div id="stuBody"></div>';
    UI.applyLang(el);
    var input = document.getElementById('stuSearch');
    input.addEventListener('input', function () { stuSearch = input.value; paintStudents(); });
    el.querySelectorAll('[data-sf]').forEach(function (b) { b.onclick = function () { stuFilter = b.dataset.sf; renderStudents(); }; });
    document.getElementById('csvBtn').onclick = exportCsv;
    paintStudents();
  }
  function paintStudents() {
    var qs = stuSearch.trim().toLowerCase();
    var list = students.filter(function (s) {
      var p = s.profile, pl = s.plan;
      if (qs && [p.full_name, p.email, p.phone, p.line_id].join(' ').toLowerCase().indexOf(qs) === -1) return false;
      switch (stuFilter) {
        case 'full': return pl.plan === 'full' || pl.complete;
        case 'installment': return pl.plan === 'installment' && !pl.complete;
        case 'overdue': return pl.overdue;
        case 'soon': return pl.plan === 'installment' && !pl.complete && !pl.overdue && pl.daysLeft <= 7;
        case 'none': return !pl.plan;
        default: return true;
      }
    });
    var box = document.getElementById('stuBody');
    if (!list.length) { box.innerHTML = '<div class="card empty">' + esc(t('stu_empty')) + '</div>'; return; }
    box.innerHTML = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>' + esc(t('col_student')) + '</th><th>' + esc(t('col_contact')) + '</th><th>' + esc(t('col_plan')) + '</th><th>' + esc(t('col_progress')) + '</th><th>' + esc(t('col_next_due')) + '</th><th>' + esc(t('col_status')) + '</th></tr></thead><tbody>' +
      list.map(function (s) {
        var p = s.profile, pl = s.plan;
        return '<tr class="click" data-stu="' + esc(p.id) + '"><td>' + esc(p.full_name || '—') + '<span class="sub">' + esc(p.email) + '</span></td>' +
          '<td>' + esc(p.phone || '—') + (p.line_id ? '<span class="sub">LINE: ' + esc(p.line_id) + '</span>' : '') + '</td>' +
          '<td>' + esc(!pl.plan ? '—' : pl.plan === 'full' ? t('plan_full') : t('plan_inst')) + '</td>' +
          '<td>' + (pl.plan ? segs(s) + '<span class="sub">' + (pl.plan === 'full' ? esc(t('lifetime')) : pl.paid + '/' + pl.count) + '</span>' : '—') + '</td>' +
          '<td>' + dueText(pl) + '</td><td>' + planChip(s) + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="faint" style="font-size:.8rem;margin-top:.7rem">' + esc(t('stu_count', { n: list.length })) + '</p>';
  }

  function exportCsv() {
    var head = [t('f_name'), t('f_email'), t('f_phone'), 'LINE', t('col_plan'), t('stu_paid'), t('stu_start'), t('col_next_due'), t('col_status')];
    var rows = students.map(function (s) {
      var p = s.profile, pl = s.plan, st = document.createElement('div'); st.innerHTML = planChip(s);
      return [p.full_name, p.email, p.phone, p.line_id, !pl.plan ? '' : pl.plan === 'full' ? t('plan_full') : t('plan_inst'),
        pl.plan === 'installment' ? pl.paid + '/' + pl.count : '', s.enrollment ? s.enrollment.started_on : '', pl.nextDue || '', st.textContent];
    });
    var blob = new Blob([Bulk.toCsv(head, rows)], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'metta-students-' + A.bangkokToday() + '.csv'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  async function openStudent(id) {
    var s = students.filter(function (x) { return x.profile.id === id; })[0]; if (!s) return;
    var p = s.profile, e = s.enrollment || {}, pl = s.plan;
    var views = []; try { views = await API.admin.views(id); } catch (er) { /* optional */ }
    var lineLink = p.line_id ? '<a class="link" target="_blank" rel="noopener" href="https://line.me/ti/p/~' + encodeURIComponent(p.line_id) + '">LINE: ' + esc(p.line_id) + '</a>' : '';
    var body = document.createElement('div');
    body.innerHTML =
      '<dl class="dl"><dt>' + esc(t('f_email')) + '</dt><dd>' + esc(p.email) + '</dd><dt>' + esc(t('f_phone')) + '</dt><dd><a class="link" href="tel:' + esc(p.phone) + '">' + esc(p.phone || '—') + '</a> ' + lineLink + '</dd>' +
      '<dt>' + esc(t('col_status')) + '</dt><dd>' + planChip(s) + '</dd>' + (pl.nextDue ? '<dt>' + esc(t('col_next_due')) + '</dt><dd>' + dueText(pl) + '</dd>' : '') + '</dl>' +
      '<h4 class="eyebrow" style="margin:1.4rem 0 .8rem">' + esc(t('stu_plan_edit')) + '</h4>' +
      '<div class="form"><div class="row-3"><label class="field"><span>' + esc(t('col_plan')) + '</span><select name="plan"><option value="">' + esc(t('chip_none')) + '</option>' +
      '<option value="full"' + (e.plan === 'full' ? ' selected' : '') + '>' + esc(t('plan_full')) + '</option><option value="installment"' + (e.plan === 'installment' ? ' selected' : '') + '>' + esc(t('plan_inst')) + '</option></select></label>' +
      '<label class="field"><span>' + esc(t('stu_paid')) + '</span><input type="number" name="paid" min="0" max="' + settings.installment_count + '" value="' + (e.installments_paid || 0) + '"></label>' +
      '<label class="field"><span>' + esc(t('stu_start')) + '</span><input type="date" name="start" value="' + esc(e.started_on || today) + '"></label></div>' +
      '<label class="check"><input type="checkbox" name="suspended"' + (e.suspended ? ' checked' : '') + '><span>' + esc(t('stu_suspend')) + '</span></label>' +
      '<p class="faint" style="font-size:.78rem">' + esc(t('stu_plan_note')) + '</p></div>' +
      '<h4 class="eyebrow" style="margin:1.4rem 0 .8rem">' + esc(t('pay_history')) + '</h4>' +
      (s.payments.length ? '<div class="tbl-wrap"><table class="tbl" style="min-width:0"><tbody>' + s.payments.map(function (x) {
        return '<tr><td>' + esc(UI.dateTime(x.created_at)) + '</td><td>' + esc(itemLabel(x)) + '</td><td>' + esc(UI.baht(x.amount)) + '</td><td>' +
          (x.status === 'approved' ? '<span class="chip ok">' + esc(t('st_approved')) + '</span> <a class="link" style="font-size:.8rem" href="receipt.html?id=' + encodeURIComponent(x.id) + '">' + esc(t('receipt')) + '</a>' : x.status === 'rejected' ? '<span class="chip bad">' + esc(t('st_rejected')) + '</span>' : '<span class="chip info">' + esc(t('st_pending')) + '</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="faint">' + esc(t('pay_no_history')) + '</p>') +
      examBlock(s) +
      (s.purchases.length ? '<h4 class="eyebrow" style="margin:1.4rem 0 .6rem">' + esc(t('stu_bought')) + '</h4><ul style="display:grid;gap:.3rem">' + s.purchases.map(function (lid) { var l = lessonById(lid); return '<li class="muted">• ' + esc(l ? UI.pick(l, 'title') : lid) + '</li>'; }).join('') + '</ul>' : '') +
      '<h4 class="eyebrow" style="margin:1.4rem 0 .6rem">' + esc(t('stu_views')) + '</h4>' +
      (views.length ? '<ul style="display:grid;gap:.3rem;font-size:.86rem">' + views.map(function (v) { var l = lessonById(v.lesson_id); return '<li class="muted">' + esc(UI.dateTime(v.created_at)) + ' — ' + esc(l ? UI.pick(l, 'title') : '?') + (v.ip ? ' <span class="faint">(' + esc(v.ip) + ')</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="faint">' + esc(t('stu_no_views')) + '</p>');
    body.addEventListener('click', async function (ev) {
      var btn = ev.target.closest('[data-exact]'); if (!btn) return;
      var b = lastExam(s), act = btn.dataset.exact, dt = body.querySelector('[name=exam_date]');
      try {
        if (act === 'date') { if (!dt.value) { UI.toast(t('err_exam_date_required'), 'bad'); return; } await UI.busy(btn, function () { return API.admin.examUpdate(b.id, 'scheduled', dt.value); }); }
        else if (act === 'pass') { if (!(await UI.confirm(t('adm_ex_pass_q', { name: p.full_name || p.email })))) return; await UI.busy(btn, function () { return API.admin.examUpdate(b.id, 'passed', dt && dt.value || null); }); }
        else if (act === 'undo') { await UI.busy(btn, function () { return API.admin.examUpdate(b.id, b.exam_date ? 'scheduled' : 'paid', b.exam_date || null); }); }
        UI.toast(t('saved'), 'ok'); await loadAll(); showTab(tab);
        var box = body.querySelector('#examBlock'), fresh = students.filter(function (x) { return x.profile.id === id; })[0];
        if (box && fresh) { s = fresh; box.outerHTML = examBlock(fresh); }
      } catch (er) { UI.toast(UI.errorText(er), 'bad'); }
    });
    UI.modal({ title: p.full_name || p.email, wide: true, body: body, actions: [].concat(settings.single_device ? [   // only when "one device at a time" is switched on
      { label: t('stu_reset_device'), onClick: async function () { await API.admin.resetDevice(id); UI.toast(t('stu_device_done'), 'ok'); return false; } }] : [], [
      { label: t('cancel') },
      { label: t('save'), kind: 'btn-gold', onClick: async function () {
        var g = function (n) { return body.querySelector('[name=' + n + ']'); };
        var planV = g('plan').value;
        if (!planV) {
          if (s.enrollment && !(await UI.confirm(t('stu_remove_q')))) return false;
          await API.admin.updateEnrollment(id, null);
        } else {
          var paid = Math.max(0, Math.min(settings.installment_count, parseInt(g('paid').value, 10) || 0));
          if (!/^\d{4}-\d{2}-\d{2}$/.test(g('start').value)) { UI.toast(t('err_fill_fields'), 'bad'); return false; }
          await API.admin.updateEnrollment(id, { plan: planV, installments_paid: paid, started_on: g('start').value, suspended: g('suspended').checked });
        }
        UI.toast(t('saved'), 'ok'); await loadAll(); showTab(tab);
      } }]) });
  }

  function examBlock(s) {
    var b = lastExam(s);
    var h = '<div id="examBlock"><h4 class="eyebrow" style="margin:1.4rem 0 .8rem">' + esc(t('adm_exam')) + '</h4>';
    if (!b) return h + '<p class="faint">' + esc(t('adm_ex_none')) + '</p></div>';
    h += '<div class="adm-exam"><div class="ae-top"><b>' + esc(t('item_exam', { n: b.days })) + '</b> · ' + esc(UI.baht(b.price)) + ' ' + examChip(b) + '</div>';
    if (b.status === 'passed') {
      h += '<p class="muted" style="margin:.5rem 0">' + esc(t('adm_ex_passed_on', { date: UI.date(b.passed_on), no: b.cert_no || '—' })) + '</p><div class="ae-acts">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-exact="undo">' + esc(t('adm_ex_undo')) + '</button></div>';
    } else {
      h += '<div class="ae-acts"><label class="field" style="margin:0"><span>' + esc(t('adm_ex_date')) + '</span><input type="date" name="exam_date" value="' + esc(b.exam_date || '') + '"></label>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-exact="date">' + esc(t('adm_ex_set')) + '</button>' +
        '<button type="button" class="btn btn-gold btn-sm" data-exact="pass">' + esc(t('adm_ex_pass')) + '</button></div>';
    }
    return h + '</div></div>';
  }

  /* ---------- lessons */
  function chapterCount() {
    return lessons.reduce(function (m, l) { return l.kind === 'special' ? m : Math.max(m, l.chapter || 1); }, UI.chapters(settings).length) || 1;
  }
  function renderLessons() {
    var el = document.getElementById('tab-lessons'), html = '<div class="toolbar"><button class="btn btn-gold btn-sm" id="addLesson">+ ' + esc(t('les_add')) + '</button>' +
      '<button class="btn btn-ghost btn-sm" id="bulkLessons">' + esc(t('bulk_btn')) + '</button><span class="grow"></span>' +
      '<span class="faint" style="font-size:.82rem">' + esc(t('les_count', { n: lessons.length })) + '</span></div>';
    var groups = [], nCh = chapterCount(), nums = UI.clipNumbers(lessons);   // numbers match Geeno's file names (1)…, 2)…)
    for (var i = 1; i <= nCh; i++) groups.push({ title: t('chapter_n', { n: i }) + ' · ' + UI.chapterTitle(settings, i), ch: i,
      list: lessons.filter(function (l) { return l.kind !== 'special' && (l.chapter || 1) === i; }) });
    groups.push({ title: t('special_title') + ' · ' + t('special_meta'), list: lessons.filter(function (l) { return l.kind === 'special'; }), special: true });
    groups.forEach(function (g) {
      var list = g.list.slice().sort(function (a, b) { return ((a.section || 1) - (b.section || 1)) || ((a.sort || 0) - (b.sort || 0)); });
      html += '<div class="ladmin-sec' + (g.special ? ' special' : '') + '"><h4>' + esc(g.title) + '<button class="link" data-add-ch="' + (g.special ? 's' : g.ch) + '">+ ' + esc(t('les_add')) + '</button></h4>' + (list.length ? list.map(function (l) {
        return '<div class="lad-row"><div class="tt"><b>' + (nums[l.id] ? '<span class="n">' + nums[l.id] + '.</span> ' : '') + esc(l.title_th || l.title_en || '—') + '</b><span>' + esc(l.title_en || '') + (l.duration_min ? ' · ' + t('n_min', { n: l.duration_min }) : '') + '</span></div><div class="chips">' +
          (l.kind !== 'special' ? '<span class="chip no-dot">' + esc(t('month_tag', { n: l.section || 1 })) + '</span>' : '') +
          (l.is_preview ? '<span class="chip gold no-dot">' + esc(t('free_preview')) + '</span>' : '') +
          (l.price ? '<span class="chip gold no-dot">' + esc(UI.baht(l.price)) + '</span>' : '') +
          (l.coming_soon ? '<span class="chip info">' + esc(t('coming_soon')) + '</span>' : '') +
          (l.published === false ? '<span class="chip warn">' + esc(t('les_hidden')) + '</span>' : '') +
          (videos[l.id] ? '<span class="chip ok">' + esc(t('les_has_video')) + '</span>' : '<span class="chip bad">' + esc(t('les_no_video')) + '</span>') +
          '</div><button class="btn btn-ghost btn-sm" data-edit="' + esc(l.id) + '">' + esc(t('edit')) + '</button></div>';
      }).join('') : '<p class="faint" style="font-size:.86rem;padding:.3rem 0 .6rem">' + esc(g.special ? t('special_none') : t('les_none')) + '</p>') + '</div>';
    });
    el.innerHTML = html;
    document.getElementById('addLesson').onclick = function () { editLesson(null); };
    document.getElementById('bulkLessons').onclick = bulkLessons;
    el.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { editLesson(lessonById(b.dataset.edit)); }; });
    el.querySelectorAll('[data-add-ch]').forEach(function (b) { b.onclick = function () { editLesson(null, b.dataset.addCh); }; });
  }
  // The first monthly payment of a chapter (chapter 1 → 1, chapter 2 → 3 … with 5 chapters / 10 months)
  function firstMonth(ch) { var n = chapterCount(), m = settings.installment_count; return Math.min(m, Math.floor((ch - 1) * m / n) + 1); }
  // A new clip in a chapter opens with the chapter's latest month (e.g. a new anime clip → month 10)
  function newClipMonth(ch) {
    return lessons.reduce(function (m, l) { return l.kind !== 'special' && (l.chapter || 1) === ch ? Math.max(m, l.section || 1) : m; }, 0) || firstMonth(ch);
  }
  function nextSort(kind, ch) {
    return lessons.reduce(function (m, l) { return (l.kind === kind && (kind === 'special' || (l.chapter || 1) === ch)) ? Math.max(m, l.sort || 0) : m; }, 0) + 1;
  }
  function bulkLessons() {
    var body = document.createElement('div'), parsed = { rows: [], errors: [] };
    body.innerHTML = '<p class="muted" style="font-size:.88rem">' + esc(t('bulk_help')) + '</p>' +
      '<pre class="bulk-ex">2 | 4 | งานตัวหนังสือ ตอน 2 | Lettering part 2 | 30\n5 | 10 | ลงสีอนิเมะ | Anime colouring | 25\ns | ภาพเหมือนหน้าคน | Realistic portraits | 45 | 1900</pre>' +
      '<label class="field"><textarea id="bulkText" rows="10" spellcheck="false"></textarea></label><div class="form-msg" id="bulkMsg"></div>';
    var ta = body.querySelector('#bulkText'), msg = body.querySelector('#bulkMsg'), m;
    function check() {
      parsed = Bulk.parseBulkLessons(ta.value, chapterCount(), settings.installment_count);
      var errs = parsed.errors.map(function (er) { return t('bulk_line', { line: er.line, msg: t(er.code, { n: chapterCount(), m: settings.installment_count }) }); });
      msg.className = 'form-msg ' + (errs.length ? 'err' : 'ok');
      msg.innerHTML = errs.length ? errs.map(esc).join('<br>') : (parsed.rows.length ? esc(t('bulk_ready', { n: parsed.rows.length })) : '');
      var b = m && m.el.querySelector('.modal-f .btn-gold'); if (b) { b.textContent = t('bulk_add', { n: parsed.rows.length }); b.disabled = !parsed.rows.length || !!errs.length; }
    }
    ta.addEventListener('input', check);
    m = UI.modal({ title: t('bulk_h'), wide: true, body: body, actions: [{ label: t('cancel') }, { label: t('bulk_add', { n: 0 }), kind: 'btn-gold', onClick: async function () {
      check(); if (!parsed.rows.length || parsed.errors.length) return false;
      var base = {};
      for (var i = 0; i < parsed.rows.length; i++) {
        var r = parsed.rows[i], k = r.kind === 'special' ? 's' : r.chapter;
        base[k] = base[k] || nextSort(r.kind, r.chapter);
        r.sort = base[k]++; r.vdo_id = '';
        await API.admin.saveLesson(r);
      }
      UI.toast(t('bulk_done', { n: parsed.rows.length }), 'ok'); await loadAll(); showTab('lessons');
    } }] });
    check();
  }

  function editLesson(l, addTo) {
    var isNew = !l;
    if (isNew) {
      var sp = addTo === 's', ch = sp ? 1 : (+addTo || 1);
      l = { kind: sp ? 'special' : 'core', chapter: ch, section: sp ? 1 : newClipMonth(ch), sort: nextSort(sp ? 'special' : 'core', ch), title_th: '', title_en: '',
        description_th: '', description_en: '', duration_min: null, price: null, is_preview: false, published: true, coming_soon: false };
    }
    var nCh = chapterCount(), chOpts = '', mOpts = '', i;
    for (i = 1; i <= nCh; i++) chOpts += '<option value="' + i + '"' + ((l.chapter || 1) === i ? ' selected' : '') + '>' + esc(t('chapter_n', { n: i }) + ' · ' + UI.chapterTitle(settings, i)) + '</option>';
    for (i = 1; i <= settings.installment_count; i++) mOpts += '<option value="' + i + '"' + ((l.section || 1) === i ? ' selected' : '') + '>' + esc(t('month_tag', { n: i })) + '</option>';
    var body = document.createElement('div');
    body.innerHTML = '<div class="form">' +
      '<div class="row-2"><label class="field"><span>' + esc(t('les_title_th')) + ' *</span><input name="title_th" value="' + esc(l.title_th) + '"></label>' +
      '<label class="field"><span>' + esc(t('les_title_en')) + '</span><input name="title_en" value="' + esc(l.title_en) + '"></label></div>' +
      '<div class="row-3"><label class="field"><span>' + esc(t('les_kind')) + '</span><select name="kind"><option value="core"' + (l.kind !== 'special' ? ' selected' : '') + '>' + esc(t('les_kind_core')) + '</option><option value="special"' + (l.kind === 'special' ? ' selected' : '') + '>' + esc(t('les_kind_special')) + '</option></select></label>' +
      '<label class="field core-only"><span>' + esc(t('les_chapter')) + '</span><select name="chapter">' + chOpts + '</select></label>' +
      '<label class="field core-only"><span>' + esc(t('les_month')) + '</span><select name="section">' + mOpts + '</select></label></div>' +
      '<label class="field"><span>' + esc(t('les_vdo')) + '</span><input name="vdo_id" value="' + esc(videos[l.id] || '') + '" placeholder="e.g. 1234567890abcdef1234567890abcdef" spellcheck="false"><small>' + esc(t('les_vdo_help')) + '</small></label>' +
      '<div class="row-3"><label class="field"><span>' + esc(t('les_minutes')) + '</span><input type="number" min="0" name="duration_min" value="' + (l.duration_min || '') + '"></label>' +
      '<label class="field"><span>' + esc(t('les_price')) + '<b class="req" hidden> *</b></span><input type="number" min="0" name="price" value="' + (l.price || '') + '" placeholder="—"><small id="priceHelp"></small></label>' +
      '<label class="field"><span>' + esc(t('les_order')) + '</span><input type="number" name="sort" value="' + (l.sort || 0) + '"></label></div>' +
      '<label class="field"><span>' + esc(t('les_desc_th')) + '</span><textarea name="description_th">' + esc(l.description_th) + '</textarea></label>' +
      '<label class="field"><span>' + esc(t('les_desc_en')) + '</span><textarea name="description_en">' + esc(l.description_en) + '</textarea></label>' +
      '<label class="check"><input type="checkbox" name="is_preview"' + (l.is_preview ? ' checked' : '') + '><span>' + esc(t('les_preview')) + '</span></label>' +
      '<label class="check"><input type="checkbox" name="coming_soon"' + (l.coming_soon ? ' checked' : '') + '><span>' + esc(t('les_soon')) + '</span></label>' +
      '<p class="soon-hint" id="soonHint" hidden>' + esc(t('les_soon_hint')) + '</p>' +
      '<label class="check"><input type="checkbox" name="published"' + (l.published !== false ? ' checked' : '') + '><span>' + esc(t('les_published')) + '</span></label></div>';
    var kindSel = body.querySelector('[name=kind]'), chSel = body.querySelector('[name=chapter]'), mSel = body.querySelector('[name=section]');
    function syncKind() {
      var sp = kindSel.value === 'special';
      body.querySelectorAll('.core-only').forEach(function (f) { f.style.visibility = sp ? 'hidden' : 'visible'; });
      body.querySelector('.req').hidden = !sp;
      body.querySelector('#priceHelp').textContent = sp ? t('les_need_price') : t('les_price_help');
    }
    kindSel.onchange = syncKind; syncKind();
    function syncHint() { body.querySelector('#soonHint').hidden = !(body.querySelector('[name=vdo_id]').value.trim() && body.querySelector('[name=coming_soon]').checked); }
    body.querySelector('[name=vdo_id]').addEventListener('input', syncHint); body.querySelector('[name=coming_soon]').addEventListener('change', syncHint); syncHint();
    // new clip: moving it to another chapter also moves the opening month to that chapter's first month
    if (isNew) chSel.onchange = function () { mSel.value = firstMonth(+chSel.value); };
    var actions = [];
    if (!isNew) actions.push({ label: t('delete'), kind: 'btn-danger', onClick: async function () {
      if (!(await UI.confirm(t('les_delete_q', { title: l.title_th || l.title_en }), t('delete'), true))) return false;
      await API.admin.deleteLesson(l.id); UI.toast(t('deleted'), 'ok'); await loadAll(); showTab('lessons');
    } });
    actions.push({ label: t('cancel') });
    actions.push({ label: t('save'), kind: 'btn-gold', onClick: async function () {
      var g = function (n) { return body.querySelector('[name=' + n + ']'); };
      var num = function (n) { var v = g(n).value.trim(); return v === '' ? null : Math.max(0, parseInt(v, 10) || 0); };
      if (!g('title_th').value.trim() && !g('title_en').value.trim()) { g('title_th').classList.add('invalid'); UI.toast(t('err_title_required'), 'bad'); return false; }
      var vdo = g('vdo_id').value.trim();
      if (vdo && !/^[A-Za-z0-9_-]{8,64}$/.test(vdo)) { g('vdo_id').classList.add('invalid'); UI.toast(t('err_vdo_id'), 'bad'); return false; }
      var special = g('kind').value === 'special';
      if (special && !(num('price') > 0)) { g('price').classList.add('invalid'); UI.toast(t('les_need_price'), 'bad'); return false; }
      var row = { kind: special ? 'special' : 'core', chapter: special ? 1 : parseInt(g('chapter').value, 10), section: special ? 1 : parseInt(g('section').value, 10),
        sort: parseInt(g('sort').value, 10) || 0,
        title_th: g('title_th').value.trim(), title_en: g('title_en').value.trim(), description_th: g('description_th').value.trim(), description_en: g('description_en').value.trim(),
        duration_min: num('duration_min'), price: num('price') || null, is_preview: g('is_preview').checked, coming_soon: g('coming_soon').checked,
        published: g('published').checked, vdo_id: vdo };
      if (!isNew) row.id = l.id;
      await API.admin.saveLesson(row); UI.toast(t('saved'), 'ok'); await loadAll(); showTab('lessons');
    } });
    UI.modal({ title: isNew ? t('les_add') : t('les_edit'), wide: true, body: body, actions: actions });
  }

  /* ---------- settings */
  function renderSettings() {
    var s = settings, el = document.getElementById('tab-settings');
    var chs = UI.chapters(s).map(function (c) { return { th: c.th || '', en: c.en || '', desc_th: c.desc_th || '', desc_en: c.desc_en || '' }; });
    el.innerHTML = '<form class="grid-2" id="setForm" novalidate>' +
      '<div class="card form"><h3 class="card-h">' + esc(t('set_prices')) + '</h3>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('set_full')) + '</span><input type="number" min="0" name="full_price" value="' + s.full_price + '"></label>' +
      '<label class="field"><span>' + esc(t('set_inst_amt')) + '</span><input type="number" min="0" name="installment_amount" value="' + s.installment_amount + '"></label></div>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('set_inst_count')) + '</span><input type="number" min="1" max="36" name="installment_count" value="' + s.installment_count + '"><small>' + esc(t('set_inst_count_help')) + '</small></label>' +
      '<label class="field"><span>' + esc(t('set_grace')) + '</span><input type="number" min="0" max="60" name="grace_days" value="' + s.grace_days + '"><small>' + esc(t('set_grace_help')) + '</small></label></div>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('set_reminder')) + '</span><input type="number" min="0" max="30" name="reminder_days" value="' + s.reminder_days + '"><small>' + esc(t('set_reminder_help')) + '</small></label><div></div></div>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('adm_bundle_pct')) + '</span><input type="number" min="0" max="90" name="bundle_discount_pct" value="' + (s.bundle_discount_pct == null ? 15 : s.bundle_discount_pct) + '"></label>' +
        '<label class="field"><span>' + esc(t('adm_bundle_on')) + '</span><select name="bundle_discount_on"><option value="exam"' + (s.bundle_discount_on !== 'total' ? ' selected' : '') + '>' + esc(t('adm_bundle_exam')) + '</option>' +
        '<option value="total"' + (s.bundle_discount_on === 'total' ? ' selected' : '') + '>' + esc(t('adm_bundle_total')) + '</option></select></label></div>' +
      '<div class="row-3">' + (s.exam_packages || API.DEFAULT_EXAMS).map(function (x, i) {
        return '<label class="field"><span>' + esc(t('item_exam', { n: x.days })) + '</span><input type="number" min="0" name="exam_price_' + i + '" value="' + x.price + '"></label>';
      }).join('') + '</div>' +
      '<label class="check"><input type="checkbox" name="single_device"' + (s.single_device !== false ? ' checked' : '') + '><span>' + esc(t('set_single')) + '</span></label>' +
      '<p class="faint" style="font-size:.78rem;margin-top:-.5rem">' + esc(t('set_single_help')) + '</p></div>' +
      '<div class="card form"><h3 class="card-h">' + esc(t('set_pp')) + '</h3>' +
      '<label class="field"><span>' + esc(t('set_bank_name')) + '</span><input name="bank_name" value="' + esc(s.bank_name || '') + '"></label>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('set_bank_acc')) + '</span><input name="bank_account" value="' + esc(s.bank_account || '') + '" inputmode="numeric"></label>' +
      '<label class="field"><span>' + esc(t('set_bank_holder')) + '</span><input name="bank_account_name" value="' + esc(s.bank_account_name || '') + '"></label></div>' +
      '<p class="faint" style="font-size:.8rem;margin:.2rem 0 .1rem">' + esc(t('set_bank_test')) + '</p>' +
      '<div class="sub-h">' + esc(t('set_pp_opt')) + '</div>' +
      '<div class="row-2"><label class="field"><span>' + esc(t('set_pp_id')) + '</span><input name="promptpay_id" value="' + esc(s.promptpay_id) + '" inputmode="numeric"><small>' + esc(t('set_pp_id_help')) + '</small></label>' +
      '<label class="field"><span>' + esc(t('set_pp_name')) + '</span><input name="promptpay_name" value="' + esc(s.promptpay_name) + '"><small>' + esc(t('set_pp_name_help')) + '</small></label></div>' +
      '<div style="display:flex;gap:1rem;align-items:center"><div class="qr-box" style="margin:0;padding:8px;border-radius:10px"><canvas id="testQr" style="width:120px;height:120px"></canvas></div><p class="faint" style="font-size:.82rem" id="testQrNote"></p></div></div>' +
      '<div class="card form" style="grid-column:1/-1"><h3 class="card-h">' + esc(t('set_chapters')) + '</h3><p class="faint" style="font-size:.82rem;margin-top:-.4rem">' + esc(t('set_chapters_help')) + '</p>' +
      '<div class="ch-edit" id="chEdit"></div><div class="toolbar" style="margin:0"><button type="button" class="btn btn-ghost btn-sm" id="chAdd">' + esc(t('set_ch_add')) + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="chRemove">' + esc(t('set_ch_remove')) + '</button></div></div>' +
      '<div style="grid-column:1/-1;display:flex;justify-content:flex-end"><button class="btn btn-gold" type="submit" id="setSave">' + esc(t('save')) + '</button></div></form>';
    var f = document.getElementById('setForm'), box = document.getElementById('chEdit');
    function readChapters() {
      box.querySelectorAll('.ch-row').forEach(function (r, i) {
        chs[i] = { th: r.querySelector('[data-k=th]').value.trim(), en: r.querySelector('[data-k=en]').value.trim(),
          desc_th: r.querySelector('[data-k=desc_th]').value.trim(), desc_en: r.querySelector('[data-k=desc_en]').value.trim() };
      });
    }
    function paintChapters() {
      box.innerHTML = chs.map(function (c, i) {
        var n = i + 1, count = lessons.filter(function (l) { return l.kind !== 'special' && (l.chapter || 1) === n; }).length;
        return '<div class="ch-row"><div class="ch-no">' + (n < 10 ? '0' + n : n) + '<small>' + esc(t('les_count', { n: count })) + '</small></div><div class="ch-f">' +
          '<div class="row-2"><input class="input" data-k="th" value="' + esc(c.th) + '" placeholder="ชื่อบท (ไทย)"><input class="input" data-k="en" value="' + esc(c.en) + '" placeholder="Chapter name (English)"></div>' +
          '<div class="row-2"><textarea class="input" rows="3" data-k="desc_th" placeholder="คำอธิบาย (ไทย)">' + esc(c.desc_th) + '</textarea><textarea class="input" rows="3" data-k="desc_en" placeholder="Description (English)">' + esc(c.desc_en) + '</textarea></div></div></div>';
      }).join('');
      var last = chs.length, used = lessons.some(function (l) { return l.kind !== 'special' && (l.chapter || 1) === last; });
      document.getElementById('chRemove').disabled = chs.length <= 1 || used;
      document.getElementById('chRemove').title = used ? t('set_ch_in_use') : '';
    }
    paintChapters();
    document.getElementById('chAdd').onclick = function () { readChapters(); chs.push({ th: '', en: '', desc_th: '', desc_en: '' }); paintChapters(); };
    document.getElementById('chRemove').onclick = function () { readChapters(); if (chs.length > 1) chs.pop(); paintChapters(); };
    function testQr() {
      var id = f.promptpay_id.value, note = document.getElementById('testQrNote'), c = document.getElementById('testQr');
      if (PromptPay.isValidId(id)) { PromptPay.draw(c, PromptPay.payload(id, 1), { size: 240 }); note.textContent = t('set_pp_test'); c.parentNode.hidden = false; }
      else { c.parentNode.hidden = true; note.textContent = id ? t('set_pp_invalid') : t('set_pp_empty'); }
    }
    f.promptpay_id.addEventListener('input', testQr); testQr();
    f.addEventListener('submit', async function (e) {
      e.preventDefault();
      var n = function (k) { return Math.max(0, parseInt(f[k].value, 10) || 0); };
      if (f.promptpay_id.value && !PromptPay.isValidId(f.promptpay_id.value)) { f.promptpay_id.classList.add('invalid'); UI.toast(t('set_pp_invalid'), 'bad'); return; }
      var accDigits = f.bank_account.value.replace(/\D/g, '');
      if (f.bank_account.value.trim() && (accDigits.length < 8 || accDigits.length > 16)) { f.bank_account.classList.add('invalid'); UI.toast(t('set_bank_invalid'), 'bad'); return; }
      if (!accDigits && !f.promptpay_id.value) { f.bank_account.classList.add('invalid'); UI.toast(t('setup_pp'), 'bad'); return; }
      readChapters();
      var cleanCh = chs.filter(function (c, i) { return c.th || c.en || i < chapterCountUsed(); });
      if (!cleanCh.length || cleanCh.some(function (c) { return !c.th && !c.en; })) { UI.toast(t('set_ch_need_name'), 'bad'); return; }
      var count = Math.min(36, Math.max(1, n('installment_count')));
      var patch = { full_price: n('full_price'), installment_amount: n('installment_amount'), installment_count: count,
        grace_days: Math.min(60, n('grace_days')), reminder_days: Math.min(30, n('reminder_days')), single_device: f.single_device.checked,
        bank_name: f.bank_name.value.trim(), bank_account: f.bank_account.value.trim(), bank_account_name: f.bank_account_name.value.trim(),
        promptpay_id: f.promptpay_id.value.replace(/[^0-9]/g, ''), promptpay_name: f.promptpay_name.value.trim(), chapters: cleanCh,
        exam_packages: (s.exam_packages || API.DEFAULT_EXAMS).map(function (x, i) { return Object.assign({}, x, { price: Math.max(0, n('exam_price_' + i)) }); }),
        bundle_discount_pct: Math.min(90, Math.max(0, n('bundle_discount_pct'))), bundle_discount_on: f.bundle_discount_on.value === 'total' ? 'total' : 'exam' };
      if (count !== s.installment_count && !(await UI.confirm(t('set_count_q')))) return;
      try { await UI.busy(document.getElementById('setSave'), function () { return API.admin.saveSettings(patch); }); UI.toast(t('saved'), 'ok'); await loadAll(); showTab('settings'); }
      catch (er) { UI.toast(UI.errorText(er), 'bad'); }
    });
  }
  function chapterCountUsed() { return lessons.reduce(function (m, l) { return l.kind === 'special' ? m : Math.max(m, l.chapter || 1); }, 0); }

  try { await loadAll(); showTab(tab); }
  catch (er) { document.getElementById('tab-overview').hidden = false; document.getElementById('tab-overview').innerHTML = '<div class="alert bad">' + ICON.warn + '<div class="grow">' + esc(UI.errorText(er)) + '</div></div>'; }
  document.addEventListener('langchange', function () { showTab(tab); });
})();
