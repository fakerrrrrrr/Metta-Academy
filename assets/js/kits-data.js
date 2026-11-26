/* =====================================================================
 *  Equipment kits sold by Metta Tattoo (shown on kits.html, the home page,
 *  the course page and in the classroom). Taken from Kru Geeno's product
 *  posters. Students order through the shop's LINE — there is no online
 *  checkout for equipment. To change a price or an item, edit it here.
 *
 *  was:   normal price (crossed out) — null if there is none
 *  ship:  shipping note from the poster — null if the poster doesn't say
 *  items: [Thai, English, price or null]
 * ===================================================================== */
window.METTA_KITS = [
  {
    id: 'starter',
    name_th: 'ชุดเซตอุปกรณ์สักลาย', name_en: 'Starter tattoo kit',
    tag_th: 'ครบชุด พร้อมเริ่มสัก เหมาะสำหรับมือใหม่', tag_en: 'Everything to start — made for beginners',
    badge_th: 'เหมาะสำหรับมือใหม่', badge_en: 'For beginners',
    price: 3190, was: 3580,
    ship_th: null, ship_en: null,
    img: 'images/kits/starter.webp', poster: 'images/kits/starter-poster.webp',
    items: [
      ['เครื่องสัก + แบตเตอรี่ 2 ก้อน', 'Tattoo machine + 2 batteries', 2500],
      ['เข็ม Needle Walk 20 เล่ม คละเบอร์ (RL 3, 5, 7, 9, 18 · RM 7, 9, 11, 13, 15)', 'Needle Walk cartridges ×20, mixed (RL 3, 5, 7, 9, 18 · RM 7, 9, 11, 13, 15)', 350],
      ['สีดำ TBK 1 oz', 'TBK black ink, 1 oz', 350],
      ['วาสลีนเล็ก 1 กระปุก', 'Small vaseline tub', 40],
      ['จุกสี M 1 ห่อ', 'Ink caps (M), 1 bag', 25],
      ['น้ำยาลอกลายหนังเทียม 1 ขวด', 'Stencil transfer solution for practice skin', 120],
      ['หนังเทียม 2 แผ่น', 'Practice skin ×2', 160],
      ['ผ้าพันกระบอก 1 ม้วน', 'Grip wrap, 1 roll', 35]
    ]
  },
  {
    id: 'full',
    name_th: 'ชุดเซตอุปกรณ์สักลาย ครบจบ', name_en: 'Complete tattoo kit',
    tag_th: 'ครบจบ พร้อมใช้งาน เหมาะสำหรับมือใหม่ – มืออาชีพ', tag_en: 'Complete and ready to use — beginners to pros',
    badge_th: 'ครบจบ ชุดเดียว', badge_en: 'All-in-one',
    price: 7900, was: null,
    ship_th: 'ส่งฟรี', ship_en: 'Free shipping',
    img: 'images/kits/full.webp', poster: 'images/kits/full-poster.webp',
    items: [
      ['เครื่องสัก พร้อมแบต 2 ก้อน', 'Tattoo machine with 2 batteries', null],
      ['เครื่องลอกลาย ใช้งานง่าย', 'Stencil printer, easy to use', null],
      ['เข็มสัก 40 เล่ม คละเบอร์', '40 needle cartridges, mixed sizes', null],
      ['สีและน้ำยาครบชุด เริ่มสักได้ทันที', 'Full set of inks and solutions', null],
      ['อุปกรณ์สิ้นเปลืองครบในชุด', 'All the consumables you need', null],
      ['อุปกรณ์ฝึกสัก หนังเทียม 2 แผ่น', 'Practice skin ×2', null],
      ['มีบริการหลังการขาย', 'After-sales support', null]
    ]
  },
  {
    id: 'colours',
    name_th: 'ชุดแม่สี 1 oz', name_en: 'Primary colour set, 1 oz',
    tag_th: '3 สีพื้นฐาน ผสมได้มากกว่า 30 เฉดสี', tag_en: '3 primary colours — mix more than 30 shades',
    badge_th: 'สำหรับบทที่ 4 สีและการไล่เฉด', badge_en: 'For chapter 4: colour & gradients',
    price: 1500, was: null,
    ship_th: 'รวมส่งทั่วประเทศ', ship_en: 'Shipping included (Thailand)',
    img: 'images/kits/colours.webp', poster: 'images/kits/colours-poster.webp',
    items: [
      ['แดง — Eternal Lipstick Red', 'Red — Eternal Lipstick Red', null],
      ['เหลือง — Eternal Solid Gold', 'Yellow — Eternal Solid Gold', null],
      ['น้ำเงิน — Eternal True Blue', 'Blue — Eternal True Blue', null],
      ['ขนาด 30 ml ต่อสี', '30 ml per colour', null]
    ]
  }
];
