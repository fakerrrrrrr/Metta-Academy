/* Printable receipt for an approved payment (student: own payments; admin: any). */
(async function () {
  'use strict';
  var session = await UI.init({ page: 'receipt', auth: 'user' });
  if (!session) return;
  var t = UI.t, esc = UI.esc, C = window.METTA_CONFIG;
  var id = new URLSearchParams(location.search).get('id');
  var isAdmin = session.profile.role === 'admin';
  var pay = null, student = null, lessons = [];

  try {
    lessons = await API.listLessons();
    if (isAdmin) {
      pay = (await API.admin.payments(null)).filter(function (p) { return p.id === id; })[0] || null;
      student = pay && pay.profile;
      document.getElementById('rcBack').href = 'admin.html#slips';
    } else {
      var st = await API.myState();
      pay = st.payments.filter(function (p) { return p.id === id; })[0] || null;
      student = st.profile;
    }
  } catch (e) { /* shown as not found below */ }

  function item(p) {
    var ex = p.exam_days ? t('item_exam', { n: p.exam_days }) : '';
    if (p.kind === 'exam') return ex + ' — Metta Tattoo Academy';
    if (p.kind === 'full') return t('item_full') + (ex ? ' + ' + ex : '') + ' — Metta Tattoo Academy';
    if (p.kind === 'installment') return (p.installments > 1 ? t('item_inst_multi', { n: p.installments }) : t('item_inst')) + (ex ? ' + ' + ex : '') + ' — Metta Tattoo Academy';
    var l = lessons.filter(function (x) { return x.id === p.lesson_id; })[0];
    return t('item_lesson') + (l ? ': ' + UI.pick(l, 'title') : '');
  }
  function number(p) { return 'MT-' + A_ym(p.reviewed_at || p.created_at) + '-' + String(p.id).replace(/-/g, '').slice(0, 6).toUpperCase(); }
  function A_ym(iso) { return window.Access.bangkokToday(iso).slice(0, 7).replace('-', ''); }

  function render() {
    var box = document.getElementById('receipt');
    document.getElementById('rcPrint').hidden = !(pay && pay.status === 'approved');
    if (!pay) { box.innerHTML = '<p class="empty">' + esc(t('rc_not_found')) + '</p>'; return; }
    if (pay.status !== 'approved') { box.innerHTML = '<p class="empty">' + esc(t('rc_not_ready')) + '</p>'; return; }
    var s = student || {};
    box.innerHTML =
      '<header class="rc-head"><div class="rc-brand"><img class="rc-cat" src="images/logo-cat.png" alt="Metta Tattoo"><div>' +
      '<span>' + esc(t('footer_addr')) + '</span><span>' + esc(C.PHONE) + '</span></div></div>' +
      '<div class="rc-title"><h1>' + esc(t('receipt')) + '</h1><dl><dt>' + esc(t('rc_no')) + '</dt><dd>' + esc(number(pay)) + '</dd>' +
      '<dt>' + esc(t('rc_date')) + '</dt><dd>' + esc(UI.date(pay.created_at)) + '</dd>' +
      '<dt>' + esc(t('rc_approved')) + '</dt><dd>' + esc(UI.date(pay.reviewed_at || pay.created_at)) + '</dd></dl></div></header>' +
      '<section class="rc-from"><span>' + esc(t('rc_from')) + '</span><b>' + esc(s.full_name || '—') + '</b>' +
      '<span>' + esc([s.email, s.phone].filter(Boolean).join(' · ')) + '</span></section>' +
      '<table class="rc-table"><thead><tr><th>' + esc(t('rc_item')) + '</th><th>' + esc(t('rc_amount')) + '</th></tr></thead>' +
      '<tbody>' + (pay.discount ? '<tr><td>' + esc(item(pay)) + '</td><td>' + esc(UI.baht(pay.amount + pay.discount)) + '.00</td></tr>' +
        '<tr class="rc-disc"><td>' + esc(t('rc_bundle_disc')) + '</td><td>−' + esc(UI.baht(pay.discount)) + '.00</td></tr>'
        : '<tr><td>' + esc(item(pay)) + '</td><td>' + esc(UI.baht(pay.amount)) + '.00</td></tr>') + '</tbody>' +
      '<tfoot><tr><td>' + esc(t('rc_total')) + '</td><td>' + esc(UI.baht(pay.amount)) + '.00</td></tr></tfoot></table>' +
      '<p class="rc-meta">' + esc(t('rc_method')) + ': ' + esc(t('rc_promptpay')) + '</p>' +
      '<footer class="rc-foot"><p>' + esc(t('rc_thanks')) + '</p><p class="small">' + esc(t('rc_note')) + '</p></footer>';
  }
  render();
  document.getElementById('rcPrint').addEventListener('click', function () { window.print(); });
  document.addEventListener('langchange', render);
})();
