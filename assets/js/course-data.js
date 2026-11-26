/* =====================================================================
 *  METTA TATTOO ACADEMY — the course content (Geeno's 13 clips)
 *  ---------------------------------------------------------------------
 *  ONE place for the curriculum. It is used by:
 *    • demo mode (sample site)            • the home page outline
 *    • tools/make_seed_sql.js  → supabase/seed_course.sql (real database)
 *
 *  Basic course (คอร์สพื้นฐาน): 5 chapters. Full payment = every clip.
 *  Monthly plan: 10 payments. `month` = which payment opens the clip.
 *  Specialised courses (คอร์สเฉพาะทาง): sold one clip at a time,
 *  NOT included in the full payment. Recommended after the basic course.
 * ===================================================================== */
(function (root) {
  'use strict';

  // Geeno's own order (his Drive folder "สอนสัก", clips 1–13, Nov 2026). He may add clips later and
  // rearrange them with you — that is done in Admin → Lessons, not here.
  // img = the chapter's cover picture in the classroom. Replace the file (same name) with a frame from Geeno's video any time.
  var chapters = [
    { img: 'images/chapters/ch1.webp', th: 'อุปกรณ์และการเตรียมเครื่อง', en: 'Equipment & machine setup',
      desc_th: 'รู้จักอุปกรณ์ เข็มแต่ละแบบ และการพันเครื่อง ก่อนเริ่มลงมือสักครั้งแรก',
      desc_en: 'Get to know your equipment, every kind of needle and how to wrap your machine before your first line.' },
    { img: 'images/chapters/ch2.webp', th: 'การเดินเส้น', en: 'Linework',
      desc_th: 'ฝึกเดินเส้นให้คม เรียบ และสม่ำเสมอ ตั้งแต่เส้นพื้นฐาน งานตัวหนังสือ ไปจนถึงไฟน์ไลน์',
      desc_en: 'Clean, smooth, even lines — from basic linework to lettering and fine line.' },
    { img: 'images/chapters/ch3.webp', th: 'แสงและเงา', en: 'Light & shadow',
      desc_th: 'ทฤษฎีแสงเงาฉบับละเอียด สร้างน้ำหนักให้งานมีมิติและดูสมจริง',
      desc_en: 'Light and shadow in depth — building tone so your work has depth and looks real.' },
    { img: 'images/chapters/ch4.webp', th: 'สีและการไล่เฉด', en: 'Colour & gradients',
      desc_th: 'ผสมสี ไล่เฉด ฝึกเทคนิค แล้วขึ้นรูปทรงด้วยเฉดสีบนชิ้นงานจริง',
      desc_en: 'Mix colour, build gradients, practise the technique, then shape a real piece with colour.' },
    { img: 'images/chapters/ch5.webp', th: 'สไตล์ชิคาโน่และอนิเมะ', en: 'Chicano & anime styles',
      desc_th: 'นำทุกอย่างที่เรียนมาใช้กับสไตล์ยอดนิยม: แสงเงาชิคาโน่ เดินเส้นและแสงเงาอนิเมะ',
      desc_en: 'Put everything together in two popular styles: Chicano shading, plus anime linework and shading.' }
  ];

  // [chapter, month, Thai title, English title, {vdo_id}]  — one row per clip, in Geeno's numbered order.
  // vdo_id = the clip's VdoCipher Video ID once it's uploaded (the seed links it and marks the clip ready).
  // month = the monthly payment that opens it: payment 1 opens clips 1–3, then one clip per payment,
  // and payment 10 opens the last two (12 + 13). Full payment opens everything.
  var L = [
    [1, 1, 'แนะนำอุปกรณ์', 'Your tattoo equipment'],
    [1, 1, 'เรื่องของเข็ม', 'All about needles'],
    [1, 1, 'สอนพันเครื่อง', 'Wrapping your machine'],

    [2, 2, 'เดินเส้น', 'Linework'],
    [2, 3, 'งานตัวหนังสือ', 'Lettering'],
    [2, 4, 'บทเรียนไฟน์ไลน์', 'Fine line'],

    [3, 5, 'ทฤษฎีแสงเงาฉบับละเอียด', 'Light & shadow theory in depth'],

    [4, 6, 'ทฤษฎีผสมสี ไล่เฉดสีก่อนปฏิบัติ', 'Colour mixing & gradients (before you start)'],
    [4, 7, 'ฝึกเทคนิคก่อนขึ้นรูปทรงงานสี', 'Practice drills before colour work'],
    [4, 8, 'ขึ้นรูปทรงเฉดสี', 'Shaping a piece with colour gradients'],

    [5, 9, 'แสงเงาชิคาโน่', 'Chicano shading'],
    [5, 10, 'เดินเส้นอนิเมะ', 'Anime linework'],
    [5, 10, 'แสงเงาอนิเมะ', 'Anime shading']
  ];

  // VdoCipher Video IDs, clip 1 → 13 in the same order as L (Geeno's account, uploaded 22 Nov 2026).
  // The seed links them, so each lesson is ready to watch straight away. Leave '' for a clip not uploaded yet.
  var VDO = [
    'da3ff8c5f185411b890517d2511700f1',   // 1
    '359ff6fc56a44e108a2d1432162cc0b7',   // 2
    '3fbd3e246beb425fb44548abb32a5530',   // 3
    '22d2b130d8fb4db2b6ef419fbf04c404',   // 4
    '46052148bc9743528f04a584b9e0dd0a',   // 5
    'f011e94db220402f928022f43c303f8c',   // 6
    '2d08dda4fb85493d829d69bc5c0ef6ea',   // 7
    '378cccde34f747b29a2042fde0d74424',   // 8
    'b8e23e1f96dc4c2c8f995d77885576bb',   // 9
    '9fccd78f5ab142dd9f6b121da008b271',   // 10
    '3136537f12f344f48e23ee81a9f23cd6',   // 11
    'ccd72366dc4343559d240ad5cff576a8',   // 12
    '28f55c5b75d04119956118ec269e8aef'   // 13
  ];

  var lessons = L.map(function (r, i) {
    return Object.assign({ kind: 'core', chapter: r[0], section: r[1], sort: i + 1, title_th: r[2], title_en: r[3],
      description_th: '', description_en: '', duration_min: null, price: null, is_preview: false, published: true, coming_soon: false, vdo_id: VDO[i] || null }, r[4] || {});
  });

  // Specialised courses — EXAMPLES ONLY (titles/prices to confirm with Geeno).
  // Examples only (the demo shows them). Geeno: specialised = harder than the basics — anatomy, faces,
  // portraits, competition-level anime; from ฿1,900 per clip, priced by complexity, new clips added all the time.
  var specialExamples = [
    { kind: 'special', chapter: 1, section: 1, sort: 1, title_th: 'เฉพาะทาง: ภาพเหมือนหน้าคน', title_en: 'Specialist: Realistic portraits',
      description_th: 'ต้องมีพื้นฐานก่อน', description_en: 'Take the basic course first.', duration_min: null, price: 1900, is_preview: false, published: true, coming_soon: false },
    { kind: 'special', chapter: 1, section: 1, sort: 2, title_th: 'เฉพาะทาง: อนิเมะระดับประกวด', title_en: 'Specialist: Competition-level anime',
      description_th: 'ต้องมีพื้นฐานก่อน', description_en: 'Take the basic course first.', duration_min: null, price: 1900, is_preview: false, published: true, coming_soon: false }
  ];

  var api = { chapters: chapters, lessons: lessons, specialExamples: specialExamples, installments: 10 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.METTA_COURSE = api;
})(typeof window !== 'undefined' ? window : globalThis);
