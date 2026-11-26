/* =====================================================================
 *  METTA TATTOO ACADEMY — site settings
 *  ---------------------------------------------------------------------
 *  While SUPABASE_URL is empty the whole site runs in DEMO MODE: fake
 *  students, fake payments, everything saved only in this browser. Good
 *  for showing Geeno before the real accounts exist.
 *
 *  To go live, paste the two values from Supabase Dashboard →
 *  Project Settings → API  (the "anon public" key is safe to put here).
 * ===================================================================== */
window.METTA_CONFIG = {
  SUPABASE_URL: 'https://oachtavntetktrjaobmr.supabase.co',          // e.g. 'https://abcdefghijk.supabase.co'
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hY2h0YXZudGV0a3RyamFvYm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTY2MjI0MSwiZXhwIjoyMTExMjM4MjQxfQ.O2RAamB86NYtxeiZVnFkGEUOQ-qd1yX45SmvuR25Dyo',     // e.g. 'eyJhbGciOi...'

  // Links back to the main studio site and contact channels
  STUDIO_SITE_URL: 'https://www.instagram.com/metta_tattoo.chiangmai/',
  PHONE: '090-969-1592',
  PHONE_INTL: '+66909691592',
  WHATSAPP: '66809081571',
  MESSENGER: 'https://m.me/61555471899520',
  // Shop LINE link (e.g. 'https://line.me/R/ti/p/@mettatattoo'). Empty = LINE buttons are hidden.
  LINE_URL: 'https://line.me/ti/p/vkbOTwyY3N',
  LINE_ID: 'geeno.',      // shown next to the LINE buttons (Kru Geeno's ID has a dot at the end)

  // Videos for the public pages (not lessons). Either a file in the site, e.g. 'media/tattooing.mp4',
  // or a YouTube link. Empty = not shown.
  HOME_VIDEO: '',    // short clip of Kru Geeno tattooing (home page cover), plays muted on a loop
  INTRO_VIDEO: 'https://www.youtube.com/watch?v=5E-TN_FlUgM',   // Kru Geeno introducing himself and the course (top of the home page + Kru Geeno page)

  // Kru Geeno's social media (shown on the Kru Geeno page, the home page and the footer)
  TIKTOK: 'https://www.tiktok.com/@gno_tattoo',
  INSTAGRAM: 'https://www.instagram.com/metta_tattoo.chiangmai/',
  // His tattoo supplies shop (Facebook). Empty = hidden.
  SUPPLIES_URL: 'https://www.facebook.com/p/Metta-Tattoo-Supplies-Shop-61566396194556/',
  // Optional follower counts shown on the cards, e.g. '120K'. Empty = not shown.
  TIKTOK_FOLLOWERS: '', INSTAGRAM_FOLLOWERS: '', FACEBOOK_FOLLOWERS: '',
  FACEBOOK: 'https://www.facebook.com/p/รับสักลาย-สอนสักลาย-เชียงใหม่-by-Metta-Tattoo-61555471899520/',
  TEACHER_NAME_EN: 'Geeno',
  TEACHER_NAME_TH: 'จีโน่',

  DEFAULT_LANG: 'th'          // 'th' or 'en'
};
