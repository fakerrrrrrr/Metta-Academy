/* Metta Academy — access rules.
 *
 * This file decides, for the screen, which lessons a student can open and why.
 * The SAME rules live in supabase/schema.sql (function lesson_access), which is what
 * actually protects the videos — the server never hands out a video key unless the
 * database says yes. tests/access.compare.js checks both versions give identical answers.
 *
 * Rules (agreed with Geeno, Nov 2026):
 *  - Basic course (kind 'core'), full payment 14,900: every basic clip, for life,
 *    including clips released later (new clips come weekly until the course is complete).
 *  - Monthly plan (1,800 x 10): payment N opens the clips whose `section` (= unlock
 *    month) is N or lower. Payment N+1 is due N months after the start date. If the due
 *    date passes (plus grace days, default 0) and it is still unpaid, ALL basic clips
 *    stop until the student pays. A slip waiting for approval keeps them open.
 *    After all 10 payments the student is treated the same as full payment.
 *  - Specialised courses (kind 'special'): sold one clip at a time only — NOT included
 *    in full payment or the monthly plan.
 *  - Any clip bought on its own: that clip, forever.
 *  - Free preview clips: anyone who is logged in.
 *  - Suspended accounts (set by the admin): only free previews.
 */
(function (root) {
  'use strict';

  var OPEN = ['admin', 'preview', 'purchased', 'full', 'complete', 'section'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function parse(s) { var p = String(s).slice(0, 10).split('-'); return { y: +p[0], m: +p[1], d: +p[2] }; }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  // Today's date in Thailand as 'YYYY-MM-DD' (the school runs on Bangkok time).
  function bangkokToday(now) {
    var t = (now ? new Date(now) : new Date()).getTime() + 7 * 3600 * 1000;
    var d = new Date(t);
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  // Same behaviour as PostgreSQL `date + interval 'n months'`: Jan 31 + 1 month = Feb 28.
  function addMonths(s, n) {
    var p = parse(s), total = p.y * 12 + (p.m - 1) + n;
    var y = Math.floor(total / 12), m = total % 12 + 1;
    return ymd(y, m, Math.min(p.d, daysInMonth(y, m)));
  }
  function addDays(s, n) {
    var p = parse(s), d = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  function diffDays(a, b) { // a - b, in days
    var pa = parse(a), pb = parse(b);
    return Math.round((Date.UTC(pa.y, pa.m - 1, pa.d) - Date.UTC(pb.y, pb.m - 1, pb.d)) / 86400000);
  }

  /* Summary of a student's plan on a given day.
   * enrollment: { plan: 'full'|'installment', started_on: 'YYYY-MM-DD', installments_paid: n, suspended: bool } | null
   * settings:   { installment_count, grace_days }
   */
  function planState(enrollment, settings, today, hasPendingInstallment) {
    var count = (settings && settings.installment_count) || 10;
    var grace = (settings && settings.grace_days) || 0;
    var s = { plan: null, paid: 0, count: count, complete: false, nextDue: null, lockDate: null,
              daysLeft: null, overdue: false, awaiting: false, unlocked: 0, suspended: false };
    if (!enrollment || !enrollment.plan) return s;
    s.plan = enrollment.plan;
    s.suspended = !!enrollment.suspended;
    if (s.plan === 'full') { s.complete = true; s.unlocked = count; return s; }
    s.paid = Math.max(0, enrollment.installments_paid || 0);
    s.unlocked = Math.min(s.paid, count);
    if (s.paid >= count) { s.complete = true; return s; }
    s.nextDue = addMonths(enrollment.started_on, s.paid);
    s.lockDate = addDays(s.nextDue, grace + 1);           // first day the videos stop
    s.daysLeft = diffDays(s.nextDue, today);              // negative = late
    var late = diffDays(today, s.nextDue) > grace;
    s.awaiting = late && !!hasPendingInstallment;
    s.overdue = late && !hasPendingInstallment;
    return s;
  }

  /* Why a lesson is open or locked for this student.
   * ctx: { role, enrollment, settings, purchases: [lessonId], hasPendingInstallment, today }
   * lesson: { id, kind: 'core'|'special', section (unlock month), price, is_preview, coming_soon }
   * Returns { open, reason, buyable }
   */
  function lessonAccess(lesson, ctx) {
    var reason = reasonFor(lesson, ctx);
    var open = OPEN.indexOf(reason) !== -1;
    return { open: open, reason: reason,
             buyable: !open && reason !== 'suspended' && reason !== 'coming_soon' && !!lesson.price && lesson.price > 0 };
  }

  function reasonFor(lesson, ctx) {
    if (ctx.role === 'admin') return 'admin';
    if (lesson.published === false) return 'unpublished';
    if (lesson.coming_soon) return 'coming_soon';         // listed on the site, video not released yet
    if (lesson.is_preview) return 'preview';
    var e = ctx.enrollment;
    if (e && e.suspended) return 'suspended';
    if ((ctx.purchases || []).indexOf(lesson.id) !== -1) return 'purchased';
    if (lesson.kind === 'special') return 'special_locked';
    if (!e || !e.plan) return 'not_enrolled';
    if (e.plan === 'full') return 'full';
    var st = planState(e, ctx.settings, ctx.today || bangkokToday(), ctx.hasPendingInstallment);
    if (st.complete) return 'complete';
    if (st.overdue) return 'overdue';
    return (lesson.section || 1) <= st.paid ? 'section' : 'section_locked';
  }

  var api = { bangkokToday: bangkokToday, addMonths: addMonths, addDays: addDays, diffDays: diffDays,
              planState: planState, lessonAccess: lessonAccess, OPEN: OPEN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Access = api;
})(typeof window !== 'undefined' ? window : globalThis);
