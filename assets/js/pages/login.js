/* Login / register / forgot password. */
(async function () {
  'use strict';
  var q = new URLSearchParams(location.search);
  var session = await UI.init({ page: 'login', auth: 'none' });
  var t = UI.t;
  var next = q.get('next') || '';
  if (!/^[a-z]+\.html(\?[\w=&%.-]*)?$/i.test(next)) next = '';   // only local pages
  function go(profile) { location.href = next || (profile && profile.role === 'admin' ? 'admin.html' : 'learn.html'); }

  var forms = { login: 'loginForm', register: 'registerForm', forgot: 'forgotForm', newpw: 'newPwForm' };
  function show(mode) {
    Object.keys(forms).forEach(function (m) { document.getElementById(forms[m]).hidden = m !== mode; });
    document.getElementById('authTabs').hidden = mode === 'forgot' || mode === 'newpw';
    document.querySelectorAll('#authTabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === mode); });
    var f = document.querySelector('#' + forms[mode] + ' input'); if (f) f.focus();
  }
  document.querySelectorAll('[data-mode]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.mode); }); });
  document.getElementById('forgotLink').addEventListener('click', function () { show('forgot'); });

  var notice = document.getElementById('notice');
  function note(kind, key) { notice.innerHTML = '<div class="alert ' + kind + '">' + UI.ICON.info + '<div class="grow">' + UI.esc(t(key)) + '</div></div>'; }
  if (q.get('kicked')) note('warn', 'kicked_notice');
  else if (q.get('confirmed')) note('ok', 'confirmed_notice');
  else if (next === 'pay.html' || /^pay\.html/.test(next)) note('info', 'login_to_pay');

  if (q.get('reset') && API.mode === 'live') show('newpw');
  else if (session && !q.get('kicked')) { go(session.profile); return; }
  else show(q.get('mode') === 'register' ? 'register' : 'login');

  function vals(form) { var o = {}; new FormData(form).forEach(function (v, k) { o[k] = typeof v === 'string' ? v.trim() : v; }); return o; }
  function mark(form, names) {
    form.querySelectorAll('.invalid').forEach(function (e) { e.classList.remove('invalid'); });
    names.forEach(function (n) { var e = form.querySelector('[name=' + n + ']'); if (e) e.classList.add('invalid'); });
    if (names.length) { var f = form.querySelector('[name=' + names[0] + ']'); if (f) f.focus(); }
  }
  var emailOk = function (e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); };

  document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, v = vals(f), msg = document.getElementById('loginMsg'), bad = [];
    if (!emailOk(v.email)) bad.push('email'); if (!v.password) bad.push('password');
    mark(f, bad); if (bad.length) { msg.className = 'form-msg err'; msg.textContent = t('err_fill_fields'); return; }
    msg.textContent = '';
    try { var s = await UI.busy(f.querySelector('[type=submit]'), function () { return API.signIn(v.email, v.password); }); go(s.profile); }
    catch (er) { msg.className = 'form-msg err'; msg.textContent = UI.errorText(er); }
  });

  document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, v = vals(f), msg = document.getElementById('regMsg'), bad = [];
    if (!v.full_name) bad.push('full_name');
    if (!/^[0-9+\-\s]{9,15}$/.test(v.phone || '')) bad.push('phone');
    if (!emailOk(v.email)) bad.push('email');
    if (!v.password || v.password.length < 8) bad.push('password');
    mark(f, bad);
    if (bad.length) { msg.className = 'form-msg err'; msg.textContent = bad.indexOf('password') !== -1 && bad.length === 1 ? t('err_weak_password') : t('err_fill_fields'); return; }
    if (!f.agree.checked) { msg.className = 'form-msg err'; msg.textContent = t('err_agree'); return; }
    msg.textContent = '';
    try {
      var r = await UI.busy(f.querySelector('[type=submit]'), function () { return API.signUp(v); });
      if (r.needsConfirm) { f.innerHTML = '<div class="success">' + UI.ICON.check + '<h2 class="h-serif" style="font-size:1.4rem;margin-bottom:.6rem">' + UI.esc(t('check_email_h')) + '</h2><p class="muted">' + UI.esc(t('check_email_p', { email: v.email })) + '</p></div>'; return; }
      location.href = next || 'learn.html?welcome=1';
    } catch (er) { msg.className = 'form-msg err'; msg.textContent = UI.errorText(er); }
  });

  document.getElementById('forgotForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, v = vals(f), msg = document.getElementById('forgotMsg');
    if (!emailOk(v.email)) { mark(f, ['email']); msg.className = 'form-msg err'; msg.textContent = t('err_fill_fields'); return; }
    try { await UI.busy(f.querySelector('[type=submit]'), function () { return API.resetPassword(v.email); }); msg.className = 'form-msg ok'; msg.textContent = t('forgot_sent'); }
    catch (er) { msg.className = 'form-msg err'; msg.textContent = UI.errorText(er); }
  });

  document.getElementById('newPwForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target, v = vals(f), msg = document.getElementById('newPwMsg');
    if (!v.password || v.password.length < 8) { mark(f, ['password']); msg.className = 'form-msg err'; msg.textContent = t('err_weak_password'); return; }
    try { await UI.busy(f.querySelector('[type=submit]'), function () { return API.setNewPassword(v.password); }); UI.toast(t('saved'), 'ok'); location.href = 'learn.html'; }
    catch (er) { msg.className = 'form-msg err'; msg.textContent = UI.errorText(er); }
  });

  if (API.mode === 'demo') {
    var d = document.getElementById('demoLogins'); d.hidden = false;
    d.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-demo]'); if (!b) return;
      var s = await API.signIn(b.dataset.demo, 'demo1234'); go(s.profile);
    });
  }
})();
