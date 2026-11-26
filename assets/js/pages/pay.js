/* Payment: choose item → transfer to the studio's bank account (or PromptPay QR, if set) → upload slip → admin approves. */
(async function () {
  'use strict';
  var session = await UI.init({ page: 'pay', auth: 'user' });
  if (!session) return;
  var t = UI.t, esc = UI.esc, ICON = UI.ICON, A = window.Access;
  var q = new URLSearchParams(location.search);
  var settings, lessons, st, plan, sel = { kind: null, installments: 1, lesson_id: null, exam_days: null }, file = null;

  async function load() {
    var r = await Promise.all([API.getSettings(), API.listLessons(), API.myState()]);
    settings = r[0]; lessons = r[1]; st = r[2];
    plan = A.planState(st.enrollment, settings, st.today, st.hasPendingInstallment);
  }
  function pendingInstallments() {
    return st.payments.filter(function (p) { return p.kind === 'installment' && p.status === 'pending'; })
      .reduce(function (n, p) { return n + p.installments; }, 0);
  }
  function remaining() { return settings.installment_count - plan.paid - pendingInstallments(); }
  function buyable() {
    var pendingLessons = st.payments.filter(function (p) { return p.kind === 'lesson' && p.status === 'pending'; }).map(function (p) { return p.lesson_id; });
    return lessons.filter(function (l) {
      if (!(l.price > 0) || l.published === false || pendingLessons.indexOf(l.id) !== -1) return false;
      var a = A.lessonAccess(l, { role: 'student', enrollment: st.enrollment, settings: settings, purchases: st.purchases,
        hasPendingInstallment: st.hasPendingInstallment, today: st.today });
      return !a.open && a.buyable;
    });
  }
  function exams() { return settings.exam_packages || API.DEFAULT_EXAMS; }
  function examPrice(days) { var x = exams().filter(function (e) { return +e.days === +days; })[0]; return x ? x.price : 0; }
  // one exam at a time: none booked (or the last one passed) and none waiting for a slip check
  function canExam() {
    return !(st.exams || []).some(function (x) { return x.status !== 'passed'; }) &&
      !st.payments.some(function (p) { return p.status === 'pending' && p.exam_days; });
  }
  function examChips(withNone) {
    return '<div class="exam-chips" role="radiogroup">' + (withNone ? '<button type="button" class="echip' + (!sel.exam_days ? ' on' : '') + '" data-exam="">' + esc(t('pay_exam_none')) + '</button>' : '') +
      exams().map(function (x) {
        return '<button type="button" class="echip' + (+sel.exam_days === +x.days ? ' on' : '') + '" data-exam="' + x.days + '"><b>' + esc(t('exam_days', { n: x.days })) + '</b><span>' + esc(UI.baht(x.price)) + '</span></button>';
      }).join('') + '</div>';
  }
  function canFull() { return !st.enrollment || (!st.enrollment.plan); }
  function canInst() { return (!st.enrollment || st.enrollment.plan === 'installment') && !plan.complete && remaining() > 0; }

  function amount() {
    if (sel.kind === 'exam') return examPrice(sel.exam_days);
    if (sel.kind === 'full') return sel.exam_days ? API.bundle(settings, sel.exam_days).total : settings.full_price;
    if (sel.kind === 'installment') return settings.installment_amount * sel.installments;
    if (sel.kind === 'lesson') { var l = lessons.filter(function (x) { return x.id === sel.lesson_id; })[0]; return l ? l.price : 0; }
    return 0;
  }
  function itemLabel(p) {
    var ex = p.exam_days ? t('item_exam', { n: p.exam_days }) : '';
    if (p.kind === 'exam') return ex;
    if (p.kind === 'full') return t('item_full') + (ex ? ' + ' + ex : '');
    if (p.kind === 'installment') {
      return (p.installments > 1 ? t('item_inst_multi', { n: p.installments }) : t('item_inst')) + (ex ? ' + ' + ex : '');
    }
    var l = lessons.filter(function (x) { return x.id === p.lesson_id; })[0];
    return t('item_lesson') + (l ? ': ' + UI.pick(l, 'title') : '');
  }

  /* ---------- step 1: options */
  function renderOptions() {
    var box = document.getElementById('options'), html = '';
    var e = st.enrollment, buy = buyable();
    if (e && e.plan === 'full' || plan.complete) html += '<div class="alert ok">' + ICON.check + '<div class="grow">' + esc(t('pay_have_full')) + '</div></div>';
    if (canFull()) html += opt('full', t('plan_full'), t('opt_full_d'), UI.baht(settings.full_price),
      canExam() ? '<div class="extra exam-add"><span class="ea-h">' + UI.ICON.spark + esc(t('pay_exam_add')) + (API.bundle(settings, exams()[0].days).pct ? ' <span class="disc-pill">' + esc(t(((settings && settings.bundle_discount_on) || 'exam') === 'exam' ? 'bundle_off_exam' : 'bundle_off', { pct: API.bundle(settings, exams()[0].days).pct })) + '</span>' : '') + '</span>' + examChips(true) + '</div>' : '');
    if (canInst()) {
      var rem = remaining(), nextNo = plan.paid + pendingInstallments() + 1;
      var desc = !e ? t('opt_inst_first', { n: settings.installment_count }) : t('opt_inst_next', { no: nextNo, date: plan.nextDue ? UI.date(plan.nextDue) : '—' });
      var picker = rem > 1 ? '<div class="extra"><label class="field"><span>' + esc(t('opt_inst_count')) + '</span><select id="instCount">' +
        Array.from({ length: rem }, function (_, i) { var n = i + 1; return '<option value="' + n + '"' + (n === sel.installments ? ' selected' : '') + '>' +
          esc(n === 1 ? t('opt_inst_one', { no: nextNo }) : t('opt_inst_many', { n: n, from: nextNo, to: nextNo + n - 1 })) + ' — ' + UI.baht(n * settings.installment_amount) + '</option>'; }).join('') +
        '</select></label></div>' : '';
      html += opt('installment', !e ? t('plan_inst') : t('opt_inst_h', { no: nextNo }), desc, UI.baht(settings.installment_amount) + t('per_month'), picker);
    } else if (e && e.plan === 'installment' && !plan.complete) {
      html += '<div class="alert info">' + ICON.clock + '<div class="grow">' + esc(t('pay_inst_waiting')) + '</div></div>';
    }
    if (buy.length) {
      var lsel = '<div class="extra"><label class="field"><span>' + esc(t('opt_lesson_pick')) + '</span><select id="lessonPick">' +
        buy.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === sel.lesson_id ? ' selected' : '') + '>' + esc(UI.pick(l, 'title')) + ' — ' + UI.baht(l.price) + '</option>'; }).join('') +
        '</select></label></div>';
      html += opt('lesson', t('plan_single'), t('opt_lesson_d'), t('from') + ' ' + UI.baht(Math.min.apply(null, buy.map(function (l) { return l.price; }))), lsel);
    }
    if (canExam()) html += opt('exam', t('opt_exam_h'), t('opt_exam_d'), t('from') + ' ' + UI.baht(Math.min.apply(null, exams().map(function (x) { return x.price; }))),
      '<div class="extra">' + examChips(false) + '</div>', 'exam');
    else if ((st.exams || []).some(function (x) { return x.status !== 'passed'; })) html += '<div class="alert ok">' + ICON.check + '<div class="grow">' + esc(t('pay_exam_have')) + '</div></div>';
    if (!canFull() && !canInst() && !buy.length && !canExam() && !(e && e.plan === 'full' || plan.complete)) html += '<div class="empty">' + esc(t('pay_nothing')) + '</div>';
    box.innerHTML = html;
    var anyOpt = canFull() || canInst() || buy.length || canExam();
    document.getElementById('right').hidden = !anyOpt;

    // default choice
    var want = q.get('item');
    var ok = function (k) { return !!box.querySelector('.opt[data-kind="' + k + '"]'); };
    if (!sel.kind || !ok(sel.kind)) sel.kind = ok(want) ? want : ok('installment') && st.enrollment ? 'installment' : ok('full') ? 'full' : ok('installment') ? 'installment' : ok('lesson') ? 'lesson' : null;
    if (want === 'installment' && q.get('n') && !sel._n) { sel._n = 1; sel.installments = Math.min(remaining(), Math.max(1, +q.get('n') || 1)); }
    if (!sel._ex) { sel._ex = 1; var qe = +q.get('exam'); if (exams().some(function (x) { return +x.days === qe; })) sel.exam_days = qe; }
    if (sel.kind === 'exam' && !sel.exam_days) sel.exam_days = (exams().filter(function (x) { return x.recommended; })[0] || exams()[0]).days;
    if (sel.kind === 'installment' || sel.kind === 'lesson' || !canExam()) sel.exam_days = null;
    if (sel.kind === 'lesson' && (!sel.lesson_id || !buy.some(function (l) { return l.id === sel.lesson_id; })))
      sel.lesson_id = (q.get('lesson') && buy.some(function (l) { return l.id === q.get('lesson'); })) ? q.get('lesson') : (buy[0] && buy[0].id);
    box.querySelectorAll('.opt').forEach(function (o) {
      o.classList.toggle('sel', o.dataset.kind === sel.kind);
      o.querySelector('input[type=radio]').checked = o.dataset.kind === sel.kind;
    });
    var ic = document.getElementById('instCount'); if (ic) { ic.value = sel.installments; ic.onchange = function () { sel.installments = +ic.value; renderQr(); }; }
    var lp = document.getElementById('lessonPick'); if (lp) { if (sel.lesson_id) lp.value = sel.lesson_id; lp.onchange = function () { sel.lesson_id = lp.value; renderQr(); }; }
    renderQr();
  }
  function opt(kind, title, desc, price, extra, cls) {
    return '<label class="opt' + (cls ? ' ' + cls : '') + '" data-kind="' + kind + '"><input type="radio" name="item" value="' + kind + '"><span class="ot"><b>' + esc(title) + '</b><span>' + esc(desc) + '</span>' + (extra || '') + '</span><span class="op">' + esc(price) + '</span></label>';
  }
  document.getElementById('options').addEventListener('change', function (e) {
    if (e.target.name === 'item') { sel.kind = e.target.value; renderOptions(); }
  });
  document.getElementById('options').addEventListener('click', function (e) {
    var c = e.target.closest('.echip'); if (!c) return;
    e.preventDefault();
    var o = c.closest('.opt'); sel.kind = o.dataset.kind;
    sel.exam_days = c.dataset.exam ? +c.dataset.exam : null;
    renderOptions();
  });

  /* ---------- step 2: transfer (bank account; PromptPay QR only if the studio set one) */
  var BANK_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8"/><path d="M3 21h18"/></svg>';
  function renderQr() {
    var card = document.getElementById('qrCard');
    if (!sel.kind) { card.innerHTML = ''; return; }
    var amt = amount(), amtCopy = amt % 1 ? amt.toFixed(2) : String(amt);
    var hasBank = !!(settings.bank_account && String(settings.bank_account).replace(/\D/g, '').length >= 8);
    var hasPP = PromptPay.isValidId(settings.promptpay_id);
    var head = '<div class="eyebrow">' + esc(t('pay_step2')) + '</div>';
    if (!hasBank && !hasPP) {
      card.innerHTML = head + '<div class="alert warn" style="text-align:left;margin-top:1rem">' + ICON.warn + '<div class="grow">' + esc(t('pp_not_set')) + '</div></div>';
      return;
    }
    var bd = sel.kind === 'full' && sel.exam_days ? API.bundle(settings, sel.exam_days) : null;
    var html = head + '<div class="pay-sum"><span class="faint">' + esc(itemLabel(sel)) + '</span>' +
      (bd && bd.discount ? '<div class="pay-was"><s>' + esc(UI.baht(bd.before)) + '</s><span class="disc-pill">' + esc(t('bundle_save', { pct: bd.pct, amt: UI.baht(bd.discount) })) + '</span></div>' : '') +
      '<div class="amount-big gold">' + esc(UI.baht(amt)) + '</div></div>';
    if (API.mode === 'demo') html += '<div class="alert warn" style="text-align:left">' + ICON.warn + '<div class="grow">' + esc(t('demo_no_transfer')) + '</div></div>';
    // PromptPay QR first (amount filled in automatically), the bank account below as the other way to pay
    var bankHtml = '', qrHtml = '';
    if (hasBank) {
      var acc = String(settings.bank_account).trim();
      bankHtml = '<div class="bank-card"><div class="bank-top"><span class="bank-ic">' + BANK_IC + '</span><div><span class="faint">' + esc(t('bank_h')) + '</span><b>' + esc(settings.bank_name || '') + '</b></div></div>' +
        '<div class="bank-row"><span class="k">' + esc(t('bank_acc_no')) + '</span><b class="acc" id="bankAcc">' + esc(acc) + '</b>' +
          '<button type="button" class="btn btn-' + (hasPP ? 'ghost' : 'gold') + ' btn-sm" data-copy="' + esc(acc.replace(/\D/g, '')) + '">' + esc(t('copy_acc')) + '</button></div>' +
        '<div class="bank-row"><span class="k">' + esc(t('bank_acc_name')) + '</span><b>' + esc(settings.bank_account_name || '—') + '</b></div>' +
        '<div class="bank-row"><span class="k">' + esc(t('bank_amount')) + '</span><b class="gold">' + esc(UI.baht(amt)) + '</b>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + amtCopy + '">' + esc(t('pp_copy_amt')) + '</button></div></div>' +
        '<p class="bank-note">' + ICON.info + '<span>' + esc(t('bank_check')) + '</span></p>' +
        '<p class="faint bank-steps">' + esc(t('bank_steps')) + '</p>';
    }
    if (hasPP) {
      var ppDigits = String(settings.promptpay_id).replace(/\D/g, ''), typeable = ppDigits.length !== 15;   // a 15-digit K PLUS / e-wallet ID is scan-only
      qrHtml = '<p class="pp-scan-h">' + esc(t('pp_scan_h')) + '</p>' +
        '<div class="qr-box"><div class="qr-head">PromptPay · พร้อมเพย์</div><canvas id="qr" aria-label="PromptPay QR"></canvas>' +
        (API.mode === 'demo' ? '<div class="qr-demo"><span>' + esc(t('demo_badge')) + '</span></div>' : '') + '</div>' +
        '<div class="pp-to">' + esc(t('pp_to')) + ' <b>' + esc(settings.promptpay_name || settings.bank_account_name || '—') + '</b></div>' +
        (typeable ? '<div class="pp-to faint" style="font-size:.86rem">' + esc(fmtId(settings.promptpay_id)) + '</div>' : '') +
        '<div class="qr-acts"><button type="button" class="btn btn-gold btn-sm" id="saveQr">' + esc(t('pp_save')) + '</button>' +
        (typeable ? '<button type="button" class="btn btn-ghost btn-sm" data-copy="' + esc(ppDigits) + '">' + esc(t('pp_copy_id')) + '</button>' : '') + '</div>' +
        (phone ? '<div class="alert info" style="text-align:left;margin-top:1rem">' + ICON.info + '<div class="grow">' + esc(t('pp_mobile')) + '</div></div>' : '') +
        '<p class="faint" style="font-size:.8rem;margin-top:.8rem">' + esc(t('pp_howto')) + '</p>';
    }
    html += hasPP ? qrHtml + (hasBank ? '<div class="or-line"><span>' + esc(t('bank_or')) + '</span></div>' + bankHtml : '') : bankHtml;
    card.innerHTML = html;
    if (hasPP) {
      PromptPay.draw(document.getElementById('qr'), PromptPay.payload(settings.promptpay_id, amt), { size: 480 });
      document.getElementById('saveQr').onclick = function () {
        var a = document.createElement('a'); a.download = 'metta-promptpay-' + amt + '.png'; a.href = document.getElementById('qr').toDataURL('image/png'); a.click();
      };
    }
  }
  var phone = matchMedia('(pointer:coarse)').matches;
  function fmtId(id) { var d = String(id).replace(/\D/g, ''); return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : d.length === 13 ? d.replace(/(\d)(\d{4})(\d{5})(\d{2})(\d)/, '$1-$2-$3-$4-$5') : d; }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (er) { /* ignore */ } ta.remove(); }
    UI.toast(t('copied') + ': ' + text, 'ok');
  }
  document.getElementById('qrCard').addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copyText(b.dataset.copy); });

  /* ---------- step 3: slip */
  var drop = document.getElementById('drop'), input = document.getElementById('slipFile');
  function renderDrop() {
    document.getElementById('dropInner').innerHTML = file ? '<img id="slipPreview" alt="slip"><span class="faint" style="display:block;font-size:.8rem;margin-top:.5rem">' + esc(t('pay_change_slip')) + '</span>'
      : ICON.upload + '<b style="display:block;font-weight:500">' + esc(t('pay_drop')) + '</b><span class="faint" style="font-size:.8rem">' + esc(t('pay_drop_hint')) + '</span>';
    if (file) { var img = document.getElementById('slipPreview'); img.src = URL.createObjectURL(file); }
  }
  function setFile(f) {
    if (!f) return;
    if (!/^image\//.test(f.type)) { UI.toast(t('err_not_image'), 'bad'); return; }
    if (f.size > 15 * 1024 * 1024) { UI.toast(t('err_too_big'), 'bad'); return; }
    file = f; renderDrop(); document.getElementById('slipMsg').textContent = '';
  }
  input.addEventListener('change', function () { setFile(input.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });

  document.getElementById('slipForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = document.getElementById('slipMsg');
    if (!sel.kind) { msg.className = 'form-msg err'; msg.textContent = t('err_pick_item'); return; }
    if (!file) { msg.className = 'form-msg err'; msg.textContent = t('err_no_slip'); drop.classList.add('over'); setTimeout(function () { drop.classList.remove('over'); }, 900); return; }
    try {
      await UI.busy(document.getElementById('sendBtn'), function () {
        return API.submitPayment({ kind: sel.kind, installments: sel.installments, lesson_id: sel.lesson_id, file: file, note: e.target.note.value.trim(),
          exam_days: sel.kind === 'exam' || sel.kind === 'full' ? sel.exam_days : null });
      });
      file = null; e.target.reset(); renderDrop();
      document.getElementById('payGrid').innerHTML = '<div class="card success" style="grid-column:1/-1">' + ICON.check +
        '<h2 class="h-serif" style="font-size:1.5rem;margin-bottom:.5rem">' + esc(t('pay_sent_h')) + '</h2><p class="muted" style="max-width:46ch;margin:0 auto 1.4rem">' + esc(t('pay_sent_p')) + '</p>' +
        '<a class="btn btn-gold" href="learn.html">' + esc(t('nav_classroom')) + '</a></div>';
      await load(); renderHistory();
      scrollTo({ top: 0, behavior: 'smooth' });
    } catch (er) { msg.className = 'form-msg err'; msg.textContent = UI.errorText(er); }
  });

  /* ---------- history */
  function statusChip(p) {
    return p.status === 'approved' ? '<span class="chip ok">' + esc(t('st_approved')) + '</span>' :
      p.status === 'rejected' ? '<span class="chip bad">' + esc(t('st_rejected')) + '</span>' : '<span class="chip info">' + esc(t('st_pending')) + '</span>';
  }
  function renderHistory() {
    var box = document.getElementById('historyBox');
    if (!st.payments.length) { box.innerHTML = '<div class="card empty">' + esc(t('pay_no_history')) + '</div>'; return; }
    box.innerHTML = '<div class="tbl-wrap"><table class="tbl tbl-stack"><thead><tr><th>' + esc(t('col_date')) + '</th><th>' + esc(t('col_item')) + '</th><th>' + esc(t('col_amount')) + '</th><th>' + esc(t('col_status')) + '</th><th></th></tr></thead><tbody>' +
      st.payments.map(function (p, i) {
        return '<tr><td data-k="' + esc(t('col_date')) + '">' + esc(UI.dateTime(p.created_at)) + '</td><td data-k="' + esc(t('col_item')) + '">' + esc(itemLabel(p)) + (p.note ? '<span class="sub">' + esc(p.note) + '</span>' : '') + '</td><td data-k="' + esc(t('col_amount')) + '">' + esc(UI.baht(p.amount)) + '</td>' +
          '<td data-k="' + esc(t('col_status')) + '">' + statusChip(p) + (p.status === 'rejected' && p.reject_reason ? '<span class="sub">' + esc(p.reject_reason) + '</span>' : '') + '</td>' +
          '<td style="white-space:nowrap"><button class="link" data-slip="' + i + '" style="font-size:.82rem">' + esc(t('view_slip')) + '</button>' +
          (p.status === 'approved' ? ' · <a class="link" style="font-size:.82rem" href="receipt.html?id=' + encodeURIComponent(p.id) + '">' + esc(t('receipt')) + '</a>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  document.getElementById('historyBox').addEventListener('click', async function (e) {
    var b = e.target.closest('[data-slip]'); if (!b) return;
    var url = await API.slipUrl(st.payments[+b.dataset.slip]);
    UI.modal({ title: t('view_slip'), wide: true, body: '<img class="zoom-img" src="' + esc(url) + '" alt="slip">' });
  });

  function renderAlerts() {
    var out = '';
    if (plan.overdue) out += '<div class="alert bad">' + ICON.warn + '<div class="grow">' + esc(t('alert_overdue', { no: plan.paid + 1, date: UI.date(plan.nextDue), amt: UI.baht(settings.installment_amount) })) + '</div></div>';
    document.getElementById('payAlerts').innerHTML = out;
  }

  try { await load(); renderAlerts(); renderOptions(); renderDrop(); renderHistory(); }
  catch (er) { document.getElementById('payAlerts').innerHTML = '<div class="alert bad">' + ICON.warn + '<div class="grow">' + esc(UI.errorText(er)) + '</div></div>'; }
  document.addEventListener('langchange', function () { if (document.getElementById('options')) { renderAlerts(); renderOptions(); renderDrop(); } renderHistory(); });
  if (location.hash === '#history') setTimeout(function () { document.getElementById('history').scrollIntoView(); }, 300);
})();
