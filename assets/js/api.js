/* Metta Academy — data layer.
 * One interface, two engines:
 *   DEMO  (no Supabase keys in config.js) — fake data saved in this browser only.
 *   LIVE  (keys present) — Supabase for login, database, slips; the get-video
 *         Edge Function for protected VdoCipher playback.
 * Pages only ever call API.*, so switching to live needs no page changes.
 */
(function (root) {
  'use strict';
  var C = root.METTA_CONFIG || {};
  var A = root.Access;
  var LIVE = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);

  function err(code, extra) { var e = new Error(code); e.code = code; if (extra) Object.assign(e, extra); return e; }
  function clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function uid() { return (root.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, function () { return (Math.random() * 16 | 0).toString(16); }); }
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage full or blocked */ } }
  function sdel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

  // Shrink a photo of a slip to a sensible size (keeps uploads fast and small).
  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(err('not_image'));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, maxSide / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(err('not_image')); }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(err('not_image')); };
      img.src = url;
    });
  }
  function blobToDataUrl(b) {
    return new Promise(function (res) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.readAsDataURL(b); });
  }

  var COURSE = root.METTA_COURSE || { chapters: [], lessons: [], specialExamples: [] };
  var DEFAULT_CHAPTERS = COURSE.chapters;
  // Studio exam packages (same as settings.exam_packages in supabase/exams.sql)
  var DEFAULT_EXAMS = [
    { days: 7,  price: 9900,  people: '1–2', works: '1–2' },
    { days: 15, price: 12900, people: '3–5', works: '3–5', recommended: true },
    { days: 30, price: 17900, people: '6',   works: '6', big: true }
  ];
  function examPrice(settings, days) {
    var e = (settings.exam_packages || DEFAULT_EXAMS).filter(function (x) { return +x.days === +days; })[0];
    return e ? e.price : 0;
  }
  // Course + exam bought together (same maths as payments_prepare in supabase/exams.sql)
  function bundle(settings, days) {
    var pct = settings.bundle_discount_pct == null ? 15 : +settings.bundle_discount_pct;
    var on = settings.bundle_discount_on || 'exam', ex = examPrice(settings, days), full = settings.full_price;
    var discount = pct > 0 ? Math.round((on === 'exam' ? ex : full + ex) * pct / 100) : 0;
    return { full: full, exam: ex, pct: pct, on: on, discount: discount, before: full + ex, total: full + ex - discount };
  }

  /* =================================================================
   *  DEMO ENGINE
   * ================================================================= */
  var KEY = 'metta_demo_v2', SKEY = 'metta_demo_session';

  function demoSlipSvg(name, amount) {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">' +
      '<rect width="600" height="800" fill="#f4f6f8"/><rect width="600" height="150" fill="#113566"/>' +
      '<text x="300" y="88" font-family="Arial" font-size="34" fill="#fff" text-anchor="middle" font-weight="bold">โอนเงินสำเร็จ</text>' +
      '<circle cx="300" cy="230" r="46" fill="#2bb673"/><path d="M278 230l15 15 30-32" stroke="#fff" stroke-width="9" fill="none"/>' +
      '<text x="300" y="350" font-family="Arial" font-size="56" text-anchor="middle" font-weight="bold" fill="#111">฿' + amount.toLocaleString('en-US') + '.00</text>' +
      '<text x="60" y="440" font-family="Arial" font-size="22" fill="#666">จาก</text><text x="540" y="440" font-family="Arial" font-size="24" fill="#111" text-anchor="end">' + name + '</text>' +
      '<text x="60" y="500" font-family="Arial" font-size="22" fill="#666">ไปยัง</text><text x="540" y="500" font-family="Arial" font-size="24" fill="#111" text-anchor="end">Metta Tattoo</text>' +
      '<text x="60" y="560" font-family="Arial" font-size="22" fill="#666">พร้อมเพย์</text><text x="540" y="560" font-family="Arial" font-size="24" fill="#111" text-anchor="end">xxx-xxx-0000</text>' +
      '<text x="300" y="700" font-family="Arial" font-size="64" fill="rgba(228,112,95,.35)" text-anchor="middle" font-weight="bold" transform="rotate(-18 300 700)">ตัวอย่างสลิป</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  }

  function seed() {
    var today = A.bangkokToday();
    // Geeno's real curriculum (assets/js/course-data.js) — all 13 clips ready to watch.
    // The two specialised clips are examples.
    var L = COURSE.lessons.map(function (l) {
      return Object.assign({}, l, { id: uid(), coming_soon: false,
        created_at: new Date(Date.now() - 40 * 86400000).toISOString() });
    }).concat(COURSE.specialExamples.map(function (l) {
      return Object.assign({}, l, { id: uid(), created_at: new Date(Date.now() - 3 * 86400000).toISOString() });
    }));
    var special1 = L.filter(function (l) { return l.kind === 'special'; })[0];

    var users = [], enr = {}, pays = [], purch = [];
    function user(email, name, phone, role) {
      var u = { id: uid(), email: email, password: 'demo1234',
        profile: { email: email, full_name: name, phone: phone, line_id: '', role: role || 'student', created_at: new Date().toISOString() } };
      u.profile.id = u.id; users.push(u); return u;
    }
    function startFor(paid, daysToDue) { // pick a start date so the next payment is due in `daysToDue` days
      return A.addMonths(A.addDays(today, daysToDue), -paid);
    }
    user('gino@metta.demo', 'จีโน่ (Gino)', '090-969-1592', 'admin');
    var me = user('student@metta.demo', 'นักเรียนทดลอง', '081-234-5678');
    enr[me.id] = { plan: 'installment', started_on: startFor(2, 16), installments_paid: 2, suspended: false };
    var nok = user('nok@metta.demo', 'นก ศิริพร', '081-222-3344');
    enr[nok.id] = { plan: 'full', started_on: A.addMonths(today, -2), installments_paid: 0, suspended: false };
    var beam = user('beam@metta.demo', 'บีม ธนพล', '086-555-4433');
    enr[beam.id] = { plan: 'installment', started_on: startFor(3, 3), installments_paid: 3, suspended: false };
    var mint = user('mint@metta.demo', 'มิ้นท์ ชลธิชา', '089-000-1122');
    enr[mint.id] = { plan: 'installment', started_on: startFor(4, -3), installments_paid: 4, suspended: false };
    var fah = user('fah@metta.demo', 'ฟ้า ณัฐชา', '062-777-8899');
    purch.push({ user_id: fah.id, lesson_id: special1.id });
    var ton = user('ton@metta.demo', 'ต้น อภิชาติ', '095-111-2233');
    var arm = user('arm@metta.demo', 'อาร์ม กิตติ', '084-321-6543');
    enr[arm.id] = { plan: 'installment', started_on: startFor(5, 9), installments_paid: 5, suspended: false };

    function pay(u, kind, n, lesson, status, daysAgo, exam) {
      var s = DEMO_SETTINGS(), ep = exam ? examPrice(s, exam) : 0, disc = exam && kind === 'full' ? bundle(s, exam).discount : 0;
      var amount = (kind === 'full' ? s.full_price : kind === 'installment' ? n * s.installment_amount : lesson.price) + ep - disc;
      pays.push({ id: uid(), user_id: u.id, kind: kind, installments: n, lesson_id: lesson ? lesson.id : null, amount: amount, exam_days: exam || null, exam_price: ep, discount: disc,
        slip_url: demoSlipSvg(u.profile.full_name.split(' ')[0], amount), note: '', status: status, reject_reason: '',
        created_at: new Date(Date.now() - daysAgo * 86400000).toISOString(), reviewed_at: status === 'pending' ? null : new Date(Date.now() - (daysAgo - 0.2) * 86400000).toISOString() });
    }
    pay(me, 'installment', 1, null, 'approved', 46); pay(me, 'installment', 1, null, 'approved', 14);
    pay(nok, 'full', 1, null, 'approved', 61, 15);
    pay(fah, 'lesson', 1, special1, 'approved', 9);
    pay(ton, 'full', 1, null, 'pending', 0.1);
    pay(arm, 'installment', 1, null, 'pending', 0.4);

    var d = { v: 5, settings: DEMO_SETTINGS(), lessons: L, videos: {}, users: users, enrollments: enr,
              payments: [], purchases: purch, views: [], dayOffset: 0, notifications: [], exams: [] };
    pays.slice().sort(function (a, b) { return a.created_at < b.created_at ? -1 : 1; }).forEach(function (p) {
      d.payments.push(p); demoNotify(d, p, 'insert');
      if (p.status === 'approved' && p.exam_days) d.exams.push({ id: uid(), user_id: p.user_id, payment_id: p.id, days: p.exam_days, price: p.exam_price,
        status: 'scheduled', exam_date: A.addDays(today, 12), passed_on: null, cert_no: null, created_at: p.reviewed_at });
      if (p.status !== 'pending') demoNotify(d, p, p.status);
    });
    d.notifications.forEach(function (n) { if (n.kind !== 'new_slip') n.read_at = n.created_at; });
    return d;
  }
  // Same rules as the database trigger in supabase/notifications.sql
  function demoNotify(d, pay, event) {
    d.notifications = d.notifications || [];
    var l = pay.lesson_id && d.lessons.filter(function (x) { return x.id === pay.lesson_id; })[0];
    var info = { amount: pay.amount, item: pay.kind, n: pay.installments, lesson_th: l ? l.title_th : null, lesson_en: l ? l.title_en : null, exam: pay.exam_days || null, discount: pay.discount || 0 };
    function add(userId, kind, extra, when) {
      d.notifications.push({ id: uid(), user_id: userId, kind: kind, payment_id: pay.id, data: Object.assign({}, info, extra || {}),
        read_at: null, created_at: when || new Date().toISOString() });
    }
    var student = d.users.filter(function (u) { return u.id === pay.user_id; })[0];
    if (event === 'insert') {
      d.users.filter(function (u) { return u.profile.role === 'admin'; }).forEach(function (a) {
        add(a.id, 'new_slip', { name: student ? (student.profile.full_name || student.email) : '' }, pay.created_at);
      });
      return;
    }
    d.notifications.forEach(function (n) { if (n.payment_id === pay.id && n.kind === 'new_slip' && !n.read_at) n.read_at = new Date().toISOString(); });
    if (event === 'approved') {
      var first = !d.payments.some(function (x) { return x.user_id === pay.user_id && x.status === 'approved' && x.id !== pay.id; });
      var e = d.enrollments[pay.user_id];
      add(pay.user_id, 'approved', { paid: e ? e.installments_paid : 0 }, pay.reviewed_at);
      if (first) add(pay.user_id, 'welcome', null, pay.reviewed_at);
    } else if (event === 'rejected') add(pay.user_id, 'rejected', { reason: pay.reject_reason }, pay.reviewed_at);
  }
  function DEMO_SETTINGS() {
    return { full_price: 14900, installment_amount: 1800, installment_count: 10, grace_days: 0, reminder_days: 3,
             single_device: false, promptpay_id: '004999253210859', promptpay_name: 'พีรวัส กริชกำจร',
             bank_name: 'ธนาคารกสิกรไทย (KBank)', bank_account: '020-1-61877-0', bank_account_name: 'พีรวัส กริชกำจร',
             chapters: clone(DEFAULT_CHAPTERS), exam_packages: clone(DEFAULT_EXAMS),
             bundle_discount_pct: 15, bundle_discount_on: 'exam' };
  }

  var db = null;
  function load() {
    if (db) return db;
    try { db = JSON.parse(sget(KEY) || 'null'); } catch (e) { db = null; }
    if (!db || db.v !== 5) { db = seed(); save(); }   // v5 = 13 real clips + notifications + exams
    return db;
  }
  function save() { sset(KEY, JSON.stringify(db)); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms || 120); }); }
  function me() { var d = load(), id = sget(SKEY); return d.users.filter(function (u) { return u.id === id; })[0] || null; }
  function needAdmin() { var u = me(); if (!u || u.profile.role !== 'admin') throw err('admin_only'); return u; }
  function demoToday() { return A.addDays(A.bangkokToday(), load().dayOffset || 0); }

  var Demo = {
    mode: 'demo',
    today: demoToday,
    init: function () { load(); return Promise.resolve(); },
    session: async function () {
      var u = me(); if (!u) return null;
      return { user: { id: u.id, email: u.email }, profile: clone(u.profile) };
    },
    signIn: async function (email, password) {
      await wait(250);
      var u = load().users.filter(function (x) { return x.email.toLowerCase() === String(email).trim().toLowerCase(); })[0];
      if (!u || u.password !== password) throw err('bad_login');
      sset(SKEY, u.id); return { user: { id: u.id, email: u.email }, profile: clone(u.profile) };
    },
    signUp: async function (f) {
      await wait(300);
      var d = load(), email = String(f.email).trim().toLowerCase();
      if (d.users.some(function (x) { return x.email.toLowerCase() === email; })) throw err('email_taken');
      if (!f.password || f.password.length < 8) throw err('weak_password');
      var u = { id: uid(), email: email, password: f.password,
        profile: { email: email, full_name: f.full_name, phone: f.phone || '', line_id: f.line_id || '', role: 'student', created_at: new Date().toISOString() } };
      u.profile.id = u.id; d.users.push(u); save(); sset(SKEY, u.id);
      return { needsConfirm: false };
    },
    resetPassword: async function () { await wait(300); return true; },
    signOut: async function () { sdel(SKEY); },
    checkDevice: async function () { return 'ok'; },
    updateProfile: async function (patch) {
      var u = me(); if (!u) throw err('not_logged_in');
      ['full_name', 'phone', 'line_id'].forEach(function (k) { if (k in patch) u.profile[k] = patch[k]; });
      save(); return clone(u.profile);
    },
    getSettings: async function () { return clone(load().settings); },
    listLessons: async function () {
      var u = me(), all = load().lessons;
      var list = (u && u.profile.role === 'admin') ? all : all.filter(function (l) { return l.published; });
      return clone(list);
    },
    myState: async function () {
      var u = me(); if (!u) throw err('not_logged_in');
      var d = load();
      var pays = d.payments.filter(function (p) { return p.user_id === u.id; })
        .sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; });
      return {
        profile: clone(u.profile),
        enrollment: clone(d.enrollments[u.id] || null),
        purchases: d.purchases.filter(function (p) { return p.user_id === u.id; }).map(function (p) { return p.lesson_id; }),
        payments: clone(pays),
        hasPendingInstallment: pays.some(function (p) { return p.kind === 'installment' && p.status === 'pending'; }),
        exams: clone((d.exams || []).filter(function (x) { return x.user_id === u.id; })),
        today: demoToday()
      };
    },
    getPlayback: async function (lessonId) {
      await wait(350);
      var u = me(); if (!u) throw err('not_logged_in');
      var d = load(), l = d.lessons.filter(function (x) { return x.id === lessonId; })[0];
      if (!l) throw err('bad_lesson');
      var st = await Demo.myState();
      var acc = A.lessonAccess(l, { role: u.profile.role, enrollment: st.enrollment, settings: d.settings,
        purchases: st.purchases, hasPendingInstallment: st.hasPendingInstallment, today: st.today });
      if (!acc.open) throw err('locked', { reason: acc.reason });
      d.views.push({ user_id: u.id, lesson_id: l.id, created_at: new Date().toISOString(), user_agent: navigator.userAgent });
      save();
      return { kind: 'demo', watermark: [u.profile.full_name, u.profile.phone].filter(Boolean).join(' · '), email: u.email };
    },
    submitPayment: async function (p) {
      var u = me(); if (!u) throw err('not_logged_in');
      var d = load(), s = d.settings, e = d.enrollments[u.id];
      var amount, ex = p.kind === 'lesson' ? null : (p.exam_days || null), ep = 0;
      if (p.kind === 'exam' && !ex) throw err('invalid_exam');
      if (ex) {
        ep = examPrice(s, ex); if (!ep) throw err('invalid_exam');
        if ((d.exams || []).some(function (x) { return x.user_id === u.id && x.status !== 'passed'; }) ||
            d.payments.some(function (x) { return x.user_id === u.id && x.status === 'pending' && x.exam_days; })) throw err('exam_already');
      }
      var disc = ex && p.kind === 'full' ? bundle(s, ex).discount : 0;
      if (p.kind === 'exam') amount = 0;
      else if (p.kind === 'full') { if (e && e.plan === 'full') throw err('already_full'); amount = s.full_price; }
      else if (p.kind === 'installment') {
        if (e && e.plan === 'full') throw err('already_full');
        var pending = d.payments.filter(function (x) { return x.user_id === u.id && x.kind === 'installment' && x.status === 'pending'; })
          .reduce(function (n, x) { return n + x.installments; }, 0);
        var remaining = s.installment_count - (e ? e.installments_paid : 0) - pending;
        if (!(p.installments >= 1 && p.installments <= remaining)) throw err('invalid_installments');
        amount = p.installments * s.installment_amount;
      } else {
        var l = d.lessons.filter(function (x) { return x.id === p.lesson_id && x.published; })[0];
        if (!l || !l.price) throw err('lesson_not_for_sale'); amount = l.price;
      }
      var blob = await compressImage(p.file, 900, 0.72);
      var url = await blobToDataUrl(blob);
      d.payments.push({ id: uid(), user_id: u.id, kind: p.kind, installments: p.kind === 'installment' ? p.installments : 1,
        lesson_id: p.kind === 'lesson' ? p.lesson_id : null, amount: amount + ep - disc, exam_days: ex, exam_price: ep, discount: disc, slip_url: url, note: p.note || '',
        status: 'pending', reject_reason: '', created_at: new Date().toISOString(), reviewed_at: null });
      demoNotify(d, d.payments[d.payments.length - 1], 'insert');
      save(); await wait(300);
      return true;
    },
    slipUrl: async function (pay) { return pay.slip_url; },
    getExam: async function (id) {
      var u = me(); if (!u) throw err('not_logged_in');
      var d = load(), x = (d.exams || []).filter(function (b) { return b.id === id; })[0];
      if (!x || (x.user_id !== u.id && u.profile.role !== 'admin')) throw err('not_found');
      var who = d.users.filter(function (y) { return y.id === x.user_id; })[0];
      return Object.assign(clone(x), { profile: who ? clone(who.profile) : null });
    },
    notifications: async function () {
      var u = me(); if (!u) return [];
      return clone((load().notifications || []).filter(function (n) { return n.user_id === u.id; })
        .sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; }).slice(0, 30));
    },
    markRead: async function (ids) {
      var u = me(); if (!u) return; var now = new Date().toISOString();
      (load().notifications || []).forEach(function (n) { if (n.user_id === u.id && !n.read_at && (!ids || ids.indexOf(n.id) >= 0)) n.read_at = now; });
      save();
    },

    admin: {
      payments: async function (status) {
        needAdmin(); var d = load();
        return clone(d.payments.filter(function (p) { return !status || p.status === status; })
          .sort(function (a, b) { return status === 'pending' ? (a.created_at < b.created_at ? -1 : 1) : (b.created_at < a.created_at ? -1 : 1); })
          .map(function (p) {
            var u = d.users.filter(function (x) { return x.id === p.user_id; })[0];
            return Object.assign({}, p, { profile: u ? u.profile : null });
          }));
      },
      approve: async function (id) {
        needAdmin(); await wait(200);
        var d = load(), p = d.payments.filter(function (x) { return x.id === id; })[0];
        if (!p || p.status !== 'pending') throw err('payment_not_pending');
        var s = d.settings, start = A.bangkokToday(p.created_at);
        var e = d.enrollments[p.user_id];
        if (p.kind === 'full') {
          d.enrollments[p.user_id] = Object.assign(e || { started_on: start, installments_paid: 0, suspended: false }, { plan: 'full' });
        } else if (p.kind === 'installment') {
          if (!e) d.enrollments[p.user_id] = { plan: 'installment', started_on: start, installments_paid: Math.min(p.installments, s.installment_count), suspended: false };
          else if (e.plan === 'installment') e.installments_paid = Math.min(e.installments_paid + p.installments, s.installment_count);
        } else if (p.lesson_id && !d.purchases.some(function (x) { return x.user_id === p.user_id && x.lesson_id === p.lesson_id; })) {
          d.purchases.push({ user_id: p.user_id, lesson_id: p.lesson_id });
        }
        if (p.exam_days) { d.exams = d.exams || []; d.exams.push({ id: uid(), user_id: p.user_id, payment_id: p.id, days: p.exam_days, price: p.exam_price,
          status: 'paid', exam_date: null, passed_on: null, cert_no: null, created_at: new Date().toISOString() }); }
        p.status = 'approved'; p.reviewed_at = new Date().toISOString(); demoNotify(d, p, 'approved'); save();
      },
      reject: async function (id, reason) {
        needAdmin(); await wait(200);
        var d = load(), p = d.payments.filter(function (x) { return x.id === id; })[0];
        if (!p || p.status !== 'pending') throw err('payment_not_pending');
        p.status = 'rejected'; p.reject_reason = reason || ''; p.reviewed_at = new Date().toISOString(); demoNotify(d, p, 'rejected'); save();
      },
      students: async function () {
        needAdmin(); var d = load();
        return clone(d.users.filter(function (u) { return u.profile.role !== 'admin'; }).map(function (u) {
          var pays = d.payments.filter(function (p) { return p.user_id === u.id; });
          return { profile: u.profile, enrollment: d.enrollments[u.id] || null,
            purchases: d.purchases.filter(function (p) { return p.user_id === u.id; }).map(function (p) { return p.lesson_id; }),
            payments: pays.sort(function (a, b) { return b.created_at < a.created_at ? -1 : 1; }),
            hasPendingInstallment: pays.some(function (p) { return p.kind === 'installment' && p.status === 'pending'; }),
            exams: (d.exams || []).filter(function (x) { return x.user_id === u.id; }) };
        }));
      },
      examUpdate: async function (id, status, date) {
        needAdmin(); await wait(150);
        var d = load(), b = (d.exams || []).filter(function (x) { return x.id === id; })[0];
        if (!b) throw err('not_found');
        if (status === 'scheduled' && !date) throw err('exam_date_required');
        b.status = status; if (date) b.exam_date = date;
        b.passed_on = status === 'passed' ? (b.passed_on || demoToday()) : null;
        if (status === 'passed' && !b.cert_no) {
          d.certSeq = (d.certSeq || 0) + 1;
          b.cert_no = 'MTA-' + demoToday().slice(0, 4) + '-' + ('000' + d.certSeq).slice(-4);
        }
        d.notifications = d.notifications || [];
        if (status === 'scheduled' || status === 'passed') {
          d.notifications = d.notifications.filter(function (n) { return !(status === 'passed' && n.exam_id === b.id && n.kind === 'exam_passed'); });
          d.notifications.push({ id: uid(), user_id: b.user_id, kind: status === 'passed' ? 'exam_passed' : 'exam_scheduled', exam_id: b.id, payment_id: null,
            data: { days: b.days, date: b.exam_date, cert_no: b.cert_no }, read_at: null, created_at: new Date().toISOString() });
        }
        save();
      },
      updateEnrollment: async function (userId, patch) {
        needAdmin(); var d = load();
        if (patch === null) { delete d.enrollments[userId]; save(); return; }
        d.enrollments[userId] = Object.assign(d.enrollments[userId] || { plan: 'installment', started_on: demoToday(), installments_paid: 0, suspended: false }, patch);
        save();
      },
      resetDevice: async function () { needAdmin(); await wait(150); },
      views: async function (userId) {
        needAdmin(); var d = load();
        return clone(d.views.filter(function (v) { return v.user_id === userId; }).slice(-15).reverse());
      },
      lessonVideos: async function () { needAdmin(); return clone(load().videos); },
      saveLesson: async function (l) {
        needAdmin(); var d = load(), vdo = l.vdo_id; delete l.vdo_id;
        if (!l.id) { l.id = uid(); l.created_at = new Date().toISOString(); d.lessons.push(l); }
        else d.lessons = d.lessons.map(function (x) { return x.id === l.id ? Object.assign(x, l) : x; });
        if (vdo) d.videos[l.id] = vdo; else delete d.videos[l.id];
        save(); return clone(l);
      },
      deleteLesson: async function (id) {
        needAdmin(); var d = load();
        d.lessons = d.lessons.filter(function (x) { return x.id !== id; }); delete d.videos[id];
        d.purchases = d.purchases.filter(function (x) { return x.lesson_id !== id; }); save();
      },
      saveSettings: async function (patch) { needAdmin(); var d = load(); Object.assign(d.settings, patch); save(); return clone(d.settings); }
    },

    demo: {
      shiftDays: function (n) { var d = load(); d.dayOffset = (d.dayOffset || 0) + n; save(); },
      resetDate: function () { var d = load(); d.dayOffset = 0; save(); },
      resetAll: function () { sdel(KEY); sdel(SKEY); db = null; load(); },
      loginAs: function (email) { var u = load().users.filter(function (x) { return x.email === email; })[0]; if (u) sset(SKEY, u.id); },
      offset: function () { return load().dayOffset || 0; }
    }
  };

  /* =================================================================
   *  LIVE ENGINE (Supabase)
   * ================================================================= */
  var sb = null, cachedSettings = null;
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(err('network')); };
      document.head.appendChild(s);
    });
  }
  function mapAuthError(e) {
    var m = (e && e.message || '').toLowerCase();
    if (m.indexOf('invalid login') !== -1) return err('bad_login');
    if (m.indexOf('already registered') !== -1 || m.indexOf('already been registered') !== -1) return err('email_taken');
    if (m.indexOf('not confirmed') !== -1) return err('email_not_confirmed');
    if (m.indexOf('password') !== -1) return err('weak_password');
    if (m.indexOf('rate limit') !== -1) return err('rate_limited');
    return err('unknown', { detail: e && e.message });
  }
  function check(r) { if (r.error) throw err(r.error.message && /^[a-z_]+$/.test(r.error.message) ? r.error.message : 'db_error', { detail: r.error.message }); return r.data; }
  function deviceKey(id) { return 'metta_device_' + id; }
  async function currentUser() {
    var r = await sb.auth.getSession(); var s = r.data && r.data.session;
    return s ? s.user : null;
  }
  async function needUser() { var u = await currentUser(); if (!u) throw err('not_logged_in'); return u; }
  function mergeProfiles(rows, profiles) {
    var byId = {}; (profiles || []).forEach(function (p) { byId[p.id] = p; });
    return rows.map(function (r) { return Object.assign({}, r, { profile: byId[r.user_id] || null }); });
  }

  var Live = {
    mode: 'live',
    today: function () { return A.bangkokToday(); },
    init: async function () {
      if (sb) return;
      if (!root.supabase) await loadScript(SUPABASE_JS);
      sb = root.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    },
    session: async function () {
      var u = await currentUser(); if (!u) return null;
      var p = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
      return { user: { id: u.id, email: u.email }, profile: p.data || { id: u.id, email: u.email, full_name: '', role: 'student' } };
    },
    signIn: async function (email, password) {
      var r = await sb.auth.signInWithPassword({ email: String(email).trim(), password: password });
      if (r.error) throw mapAuthError(r.error);
      var tok = await sb.rpc('claim_session');
      if (!tok.error) sset(deviceKey(r.data.user.id), tok.data);
      return Live.session();
    },
    signUp: async function (f) {
      var r = await sb.auth.signUp({ email: String(f.email).trim(), password: f.password, options: {
        data: { full_name: f.full_name, phone: f.phone || '', line_id: f.line_id || '' },
        emailRedirectTo: location.href.replace(/[^/]*$/, '') + 'login.html?confirmed=1' } });
      if (r.error) throw mapAuthError(r.error);
      if (r.data && r.data.user && r.data.user.identities && r.data.user.identities.length === 0) throw err('email_taken');
      if (!r.data.session) return { needsConfirm: true };
      var tok = await sb.rpc('claim_session');
      if (!tok.error) sset(deviceKey(r.data.user.id), tok.data);
      return { needsConfirm: false };
    },
    resetPassword: async function (email) {
      var r = await sb.auth.resetPasswordForEmail(String(email).trim(), { redirectTo: location.href.replace(/[^/]*$/, '') + 'login.html?reset=1' });
      if (r.error) throw mapAuthError(r.error); return true;
    },
    setNewPassword: async function (pw) { var r = await sb.auth.updateUser({ password: pw }); if (r.error) throw mapAuthError(r.error); },
    signOut: async function () { var u = await currentUser(); if (u) sdel(deviceKey(u.id)); await sb.auth.signOut(); },
    // 'ok' if this device holds the account's active session, 'kicked' if another device logged in since.
    checkDevice: async function (profile) {
      var s = cachedSettings || await Live.getSettings();
      if (!profile || profile.role === 'admin' || s.single_device === false) return 'ok';
      var mine = sget(deviceKey(profile.id));
      if (!mine) { var t = await sb.rpc('claim_session'); if (!t.error) sset(deviceKey(profile.id), t.data); return 'ok'; }
      return mine === profile.active_session ? 'ok' : 'kicked';
    },
    updateProfile: async function (patch) {
      var u = await needUser();
      return check(await sb.from('profiles').update({ full_name: patch.full_name, phone: patch.phone, line_id: patch.line_id }).eq('id', u.id).select().single());
    },
    getSettings: async function () {
      cachedSettings = check(await sb.from('settings').select('*').eq('id', 1).single());
      if (!Array.isArray(cachedSettings.chapters) || !cachedSettings.chapters.length) cachedSettings.chapters = clone(DEFAULT_CHAPTERS);
      if (!Array.isArray(cachedSettings.exam_packages) || !cachedSettings.exam_packages.length) cachedSettings.exam_packages = clone(DEFAULT_EXAMS);
      if (cachedSettings.bundle_discount_pct == null) { cachedSettings.bundle_discount_pct = 15; cachedSettings.bundle_discount_on = 'exam'; }
      return clone(cachedSettings);
    },
    listLessons: async function () {
      return check(await sb.from('lessons').select('*').order('kind').order('chapter').order('sort').order('created_at'));
    },
    myState: async function () {
      var u = await needUser();
      var res = await Promise.all([
        sb.from('profiles').select('*').eq('id', u.id).single(),
        sb.from('enrollments').select('*').eq('user_id', u.id).maybeSingle(),
        sb.from('purchases').select('lesson_id').eq('user_id', u.id),
        sb.from('payments').select('*').eq('user_id', u.id).order('created_at', { ascending: false }),
        sb.from('exam_bookings').select('*').eq('user_id', u.id).order('created_at', { ascending: false })
      ]);
      var pays = check(res[3]) || [];
      return { profile: check(res[0]), enrollment: check(res[1]), purchases: (check(res[2]) || []).map(function (p) { return p.lesson_id; }),
        payments: pays, hasPendingInstallment: pays.some(function (p) { return p.kind === 'installment' && p.status === 'pending'; }),
        exams: res[4].error ? [] : res[4].data, today: A.bangkokToday() };
    },
    getPlayback: async function (lessonId) {
      var u = await needUser();
      var r = await sb.functions.invoke('get-video', { body: { lesson_id: lessonId, device: sget(deviceKey(u.id)) } });
      if (r.error) {
        var body = {};
        try { body = await r.error.context.json(); } catch (e) { /* no body */ }
        throw err(body.error || 'video_error', { reason: body.reason });
      }
      return { kind: 'vdocipher', otp: r.data.otp, playbackInfo: r.data.playbackInfo };
    },
    submitPayment: async function (p) {
      var u = await needUser();
      var blob = await compressImage(p.file, 1400, 0.82);
      var path = u.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
      var up = await sb.storage.from('slips').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
      if (up.error) throw err('upload_failed', { detail: up.error.message });
      var row = { user_id: u.id, kind: p.kind, installments: p.kind === 'installment' ? p.installments : 1,
        lesson_id: p.kind === 'lesson' ? p.lesson_id : null, slip_path: path, note: p.note || '' };
      if (p.exam_days && p.kind !== 'lesson') row.exam_days = p.exam_days;
      var ins = await sb.from('payments').insert(row);
      if (ins.error) { await sb.storage.from('slips').remove([path]); check(ins); }
      return true;
    },
    getExam: async function (id) {
      await needUser();
      var x = check(await sb.from('exam_bookings').select('*').eq('id', id).maybeSingle());
      if (!x) throw err('not_found');
      x.profile = check(await sb.from('profiles').select('full_name, email').eq('id', x.user_id).maybeSingle());
      return x;
    },
    slipUrl: async function (pay) {
      var r = await sb.storage.from('slips').createSignedUrl(pay.slip_path, 3600);
      return r.data ? r.data.signedUrl : '';
    },
    // Bell + welcome (supabase/notifications.sql). Quietly empty if that file hasn't been run yet.
    notifications: async function () {
      var u = await currentUser(); if (!u) return [];
      var r = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(30);
      return r.error ? [] : r.data;
    },
    markRead: async function (ids) {
      var q = sb.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
      if (ids) q = q.in('id', ids);
      await q;
    },
    admin: {
      payments: async function (status) {
        var q = sb.from('payments').select('*').order('created_at', { ascending: status === 'pending' }).limit(300);
        if (status) q = q.eq('status', status);
        var rows = check(await q) || [];
        var ids = rows.map(function (r) { return r.user_id; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
        var profs = ids.length ? check(await sb.from('profiles').select('*').in('id', ids)) : [];
        return mergeProfiles(rows, profs);
      },
      approve: async function (id) { check(await sb.rpc('approve_payment', { pid: id })); },
      reject: async function (id, reason) { check(await sb.rpc('reject_payment', { pid: id, reason: reason || '' })); },
      students: async function () {
        var res = await Promise.all([
          sb.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }),
          sb.from('enrollments').select('*'),
          sb.from('purchases').select('user_id, lesson_id'),
          sb.from('payments').select('*').order('created_at', { ascending: false }).limit(2000),
          sb.from('exam_bookings').select('*')
        ]);
        var profs = check(res[0]) || [], enr = check(res[1]) || [], pur = check(res[2]) || [], pays = check(res[3]) || [];
        var exs = res[4].error ? [] : res[4].data;
        return profs.map(function (p) {
          var mine = pays.filter(function (x) { return x.user_id === p.id; });
          return { profile: p, enrollment: enr.filter(function (e) { return e.user_id === p.id; })[0] || null,
            purchases: pur.filter(function (x) { return x.user_id === p.id; }).map(function (x) { return x.lesson_id; }),
            payments: mine, hasPendingInstallment: mine.some(function (x) { return x.kind === 'installment' && x.status === 'pending'; }),
            exams: exs.filter(function (x) { return x.user_id === p.id; }) };
        });
      },
      examUpdate: async function (id, status, date) { check(await sb.rpc('exam_update', { bid: id, new_status: status, new_date: date || null })); },
      updateEnrollment: async function (userId, patch) {
        if (patch === null) { check(await sb.from('enrollments').delete().eq('user_id', userId)); return; }
        var cur = check(await sb.from('enrollments').select('*').eq('user_id', userId).maybeSingle());
        var row = Object.assign(cur || { user_id: userId, plan: 'installment', started_on: A.bangkokToday(), installments_paid: 0, suspended: false }, patch, { updated_at: new Date().toISOString() });
        check(await sb.from('enrollments').upsert(row));
      },
      resetDevice: async function (userId) { check(await sb.rpc('admin_reset_device', { uid: userId })); },
      views: async function (userId) {
        return check(await sb.from('view_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(15));
      },
      lessonVideos: async function () {
        var rows = check(await sb.from('lesson_videos').select('*')) || [], out = {};
        rows.forEach(function (r) { out[r.lesson_id] = r.vdo_id; }); return out;
      },
      saveLesson: async function (l) {
        var vdo = l.vdo_id; delete l.vdo_id;
        var saved = check(await sb.from('lessons').upsert(l).select().single());
        if (vdo) check(await sb.from('lesson_videos').upsert({ lesson_id: saved.id, vdo_id: vdo }));
        else check(await sb.from('lesson_videos').delete().eq('lesson_id', saved.id));
        return saved;
      },
      deleteLesson: async function (id) { check(await sb.from('lessons').delete().eq('id', id)); },
      saveSettings: async function (patch) {
        patch = Object.assign({}, patch, { updated_at: new Date().toISOString() });
        cachedSettings = check(await sb.from('settings').update(patch).eq('id', 1).select().single());
        return clone(cachedSettings);
      }
    },
    demo: null
  };

  root.API = LIVE ? Live : Demo;
  root.API.compressImage = compressImage;
  root.API.DEFAULT_CHAPTERS = DEFAULT_CHAPTERS;
  root.API.DEFAULT_EXAMS = DEFAULT_EXAMS;
  root.API.bundle = bundle;
})(window);
