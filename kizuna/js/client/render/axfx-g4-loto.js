// 第48回 G4: 勇者・ロトの勇者（ギガスラッシュ・ギガデイン・きずなの剣・ロトの剣技・ギガクロスブレイク・テラデイン・ミナデイン…）の 大技の え
// この ファイルは G4 だけが さわる。時間は shared/data/ax-time-g4.js。play の 時間は はなつ しゅんかんが 0
import { pal, rnd } from './axkit.js?v=a02b94650854';
import { add, bg, darken, hands, ground, per, solo, ringPts } from './axfx-g4-kit.js?v=a02b94650854';

const GOLD = { main: '#ffd23a', glow: '#fff0a0', core: '#ffffff', list: ['#ffd23a', '#fff6b0', '#ffffff'] };
const DEIN = { color: '#e8f4ff', glow: '#ffd23a', core: '#ffffff' };
const LIGHT = pal('light');
const aimOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

// 剣を 天に かかげる（ロトの 剣は つばに 金の つばさ）。bolts … 空から 剣に おちる いなずま
function raise(c, o = {}) {
  const h = hands(c, 12);
  const len = (o.len || 36) * (c.fromAlly ? 1 : 0.8);
  const ang = -Math.PI / 2 + (o.tilt ?? 0.1);
  add(c, 'g4Blade', { x: h.x, y: h.y, ang0: ang, len, w: 2.8, elec: o.elec !== false, elecGlow: o.glow || '#ffd23a', elecCol: o.col || '#fff6b0', color: o.blade || '#bfe4ff', loto: o.loto !== false, life: o.life || 380, delay: o.delay || 0, grow: o.grow || 0, len0: 0.4 });
  const tip = { x: h.x + Math.cos(ang) * len, y: h.y + Math.sin(ang) * len };
  for (let i = 0; i < (o.bolts ?? 2); i++) c.k.bolt(tip.x + rnd(-26, 26), -12, tip.x, tip.y, { w: 2.2, color: o.col || '#fff6b0', glow: o.glow || '#ffd23a', forks: 2, amp: 9, life: 220, grow: 50, delay: (o.delay || 0) + i * 110 });
  if (o.bolts !== 0) c.k.flash('#fff6d0', 70, (o.delay || 0) + 50);
  c.fx.glow(tip.x, tip.y, { color: o.glow || '#ffd23a', r: 20, delay: (o.delay || 0) + 40, life: 320, alpha: 0.9 });
  return tip;
}
// 空の 雷雲（画面の 上）
const cloud = (c, o = {}) => add(c, 'g4Cloud', { x: o.x ?? c.center.x, y: o.y ?? 6, r: o.r || 80, sy: 0.32, spin: o.spin || 1.4, color: o.color || '#141428', color2: o.color2 || '#24243e', lit: o.lit || '#c8d8ff', flash: o.flash ?? 0.14, life: o.life || c.len - 100, delay: o.delay || 0 });
// 味方の まわりの わ（1人の ときは その 人の まわり、なん人かは みんなを むすぶ）
const loopPts = (c) => (c.n >= 2 ? c.targets.map((t) => [t.x, t.y - 12]) : ringPts(c.t.x, c.t.y - 12, 22, 7, 0.55));

export const AX_G4_LOTO = {
  // ギガスラッシュ: 剣に いなずまを あつめて よこに 大きく なぎはらう（画面の はしから はしまで）→ 敵ぜんぶに いなずま
  ax_giga_slash: {
    minParts: 162,
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_gigaslash',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.42);
      raise(c, { len: 34, bolts: 2, life: 260 });
      const y = c.center.y;
      add(c, 'g4Cleave', { x0: -12, y0: y + 10, x1: c.W + 12, y1: y - 8, w: 6, zig: true, color: '#fff6d0', glow: '#ffd23a', core: '#ffffff', zigGlow: '#9ad8ff', zigCol: '#e8f4ff', edge: '#a06a0a', grow: 110, delay: c.hit - 110, life: 560 });
      k.crescent(c.center.x, y + 70, { r: 96, a0: -Math.PI + 0.4, a1: -0.4, w: 10, color: '#fff6d0', glow: '#ffd23a', core: '#ffffff', swing: 120, life: 460, after: 3, delay: c.hit - 120 });
      k.streaks({ ang: -0.08, color: '#fff6b0', n: 22, delay: c.hit - 60, life: 300, alpha: 0.6, speed: 2 });
      c.each((t, i, d) => {
        k.bolt(t.x + rnd(-10, 10), -12, t.x, t.y, { w: 2.6, color: DEIN.color, glow: DEIN.glow, forks: 2, amp: 10, life: 320, grow: 50, delay: d + c.hit + 40 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd23a', colors: GOLD.list, delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#9ad8ff'], n: per(c, 26) + solo(c, 20), speed: 200, delay: d + c.hit + 40, life: 480 });
        k.shockwave(t.x, ground(c, t, 18), { r0: 4, r1: 46 * c.sz, sy: 0.3, color: '#fff6b0', n: 2, gap: 90, delay: d + c.hit + 60 });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(400, 2.6, c.hit);
    },
  },
  // きずなのちかい: 味方を 金の 光の 糸が つないで わに → 金の 光
  ax_kizuna_chikai: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g4_kizuna',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35);
      add(c, 'g4Thread', { pts: loopPts(c), loop: true, grow: c.hit, w: 1.6, color: '#fff0a0', glow: '#ffd23a', sag: c.n >= 2 ? -14 : 0, life: c.len - 60 });
      c.each((t, i, d) => {
        c.fx.glow(t.x, t.y - 12, { color: '#ffd23a', r: 26, delay: d + c.hit, life: 420, alpha: 0.9 });
        k.sparkles(t.x, t.y - 12, { n: 8, r: 18, colors: ['#ffffff', '#fff0a0'], delay: d + c.hit, life: 380 });
        k.shapes(t.x, t.y - 8, { shape: 'heart', n: 5, colors: ['#ffd23a', '#fff0a0'], speed: 30, ang: -Math.PI / 2, spread: 0.7, g: -20, size: 2.2, delay: d + c.hit + 80, life: 480 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.4, color: '#fff0a0', delay: d + c.hit });
      });
      k.flash('#fff6c8', 90, c.hit);
      k.shake(300, 2, c.hit - 100);
    },
  },
  // 勇者のいのり: 金の 光の 羽が ふる → 回復
  ax_yuusha_inori: {
    charge: { color: '#ffe08a', color2: '#ffffff' },
    sfx: 'ax_g4_inori',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35);
      add(c, 'g4Rays', { x: c.center.x, y: -6, r: 150, n: 10, color: '#fff0a0', alpha: 0.35, life: c.len - 80 });
      k.shapes(c.center.x, -8, { shape: 'petal', n: 22, colors: ['#ffd23a', '#fff6c8', '#ffffff'], speed: 26, ang: Math.PI / 2, spread: 0.5, g: 70, drag: 0.94, size: 2.6, spin: 4, life: c.len - 100, r: 70, add: false });
      c.each((t, i, d) => {
        c.fx.swirl(t.x, t.y - 4, ['#fff6c8', '#ffd23a', '#ffffff'], { n: 16, rad: 16, h: 36, delay: d + c.hit, life: 480 });
        c.fx.glow(t.x, t.y - 10, { color: '#ffe08a', r: 22, delay: d + c.hit, life: 380, alpha: 0.8 });
        k.shapes(t.x, t.y - 10, { shape: 'twinkle', n: 6, colors: ['#ffffff', '#fff0a0'], speed: 26, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit + 60, life: 420 });
      });
      k.shake(300, 2, c.hit - 60);
    },
  },
  // ギガデイン: 剣を 天に・空に 黒い 雲 → 空から 太い いなずまが 敵ごとに おちる（青白い しん・金の ふち・えだわかれ）→ じめんに 電気の わ
  ax_gigadein: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_gigadein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.45, { color: '#02040e' });
      raise(c, { len: 30, bolts: 0, elec: true, life: 300 });
      cloud(c, { r: 90, life: c.len - 160 });
      c.each((t, i, d) => {
        const T0 = d + c.hit - 40;
        k.bolt(t.x + rnd(-8, 8), -6, t.x, t.y, { w: 5.2 * c.sz, color: DEIN.color, glow: DEIN.glow, forks: 3, amp: 12, n: 11, life: 420, grow: 40, delay: T0 });
        k.bolt(t.x + rnd(-20, 20), -6, t.x + rnd(-6, 6), t.y, { w: 2, color: DEIN.color, glow: '#9ad8ff', forks: 2, amp: 10, life: 300, grow: 40, delay: T0 + 120 });
        k.pillar(t.x, t.y, { w: 9 * c.sz, color: '#fff6b0', glow: '#ffd23a', delay: T0 + 30, life: 320, burst: false });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#fff6b0', '#9ad8ff'], delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, ground(c, t, 18), { r0: 4, r1: 50 * c.sz, sy: 0.3, color: '#fff6b0', w: 2.2, n: 3, gap: 100, delay: d + c.hit });
        for (let j = 0; j < 2 + solo(c, 2); j++) k.bolt(t.x, ground(c, t, 16), t.x + rnd(-44, 44), ground(c, t, 20 + rnd(-4, 6)), { w: 1, forks: 0, amp: 4, n: 5, life: 200, grow: 30, delay: d + c.hit + 60 + j * 70 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: per(c, 24) + solo(c, 24), speed: 210, delay: d + c.hit, life: 480 });
      });
      k.flash('#ffffff', 150, c.hit - 20);
      k.shake(440, 2.8, c.hit);
    },
  },
  // きずなの剣: 仲間の 色の 光（4色）が 剣に あつまる → 光の 剣が 大きく のびて 4色の すじを ひきながら 斬る → 4色の わ → 光の ほし
  ax_kizuna_no_ken: {
    minParts: 166,
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_kizunaken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4);
      const COLS = ['#ff5a5a', '#5ab8ff', '#5ae07a', '#ffd23a'];
      const h = hands(c, 12);
      COLS.forEach((col, j) => {
        const sx = c.W * (0.12 + j * 0.25), sy = c.fromAlly ? c.H + 4 : -4;
        k.dash(sx, sy, h.x, h.y - 20, { color: col, travel: 170, w: 4, delay: j * 40, n: 3 });
      });
      add(c, 'g4Blade', { x: h.x, y: h.y, ang0: -Math.PI / 2 + 0.1, len: 52, len0: 0.35, grow: 220, w: 3.2, color: '#ffffff', glow: '#fff0a0', loto: false, delay: 120, life: 300 });
      c.each((t, i, d) => {
        COLS.forEach((col, j) => k.crescent(t.x - 22 + j * 3, t.y - 10 + j * 4, { r: (34 + j * 5) * c.sz, a0: -2.6, a1: 0.5, w: 5, color: col, glow: col, core: '#ffffff', swing: 120, life: 420, after: 2, delay: d + c.hit - 100 + j * 25 }));
        k.slash(t.x, t.y, { r: 36 * c.sz, w: 7, ang: -0.6, color: '#ffffff', glow: '#fff0a0', core: '#ffffff', delay: d + c.hit - 60, life: 420 });
        COLS.forEach((col, j) => k.shockwave(t.x, t.y, { r0: 6, r1: (40 + j * 10) * c.sz, color: col, w: 2, delay: d + c.hit + 80 + j * 60, life: 420 }));
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#fff0a0', colors: COLS, delay: d + c.hit, heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'star', n: per(c, 14) + solo(c, 8), colors: COLS, speed: 90, size: 2.6, delay: d + c.hit + 200, life: 560 });
        k.particles(t.x, t.y, { colors: ['#ffffff', ...COLS], n: per(c, 22) + solo(c, 18), speed: 200, delay: d + c.hit, life: 460 });
      });
      k.flash('#ffffff', 100, c.hit);
      k.shake(400, 2.6, c.hit);
    },
  },
  // ジゴデイン: 赤と 黒の いなずまが 1本 太く おちる → 黒い 雷の うず → 赤い 火花
  ax_jigodein: {
    minParts: 164,
    charge: { color: '#ff3a3a', color2: '#ffd0d0' },
    sfx: 'ax_g4_jigodein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.5, { color: '#120004' });
      cloud(c, { r: 90, color: '#1a0408', color2: '#3a0a12', lit: '#ff5a5a', flash: 0.18, life: c.len - 160 });
      const m = c.center;
      // まん中に 太い 1本 ＋ ほかの 敵へ えだ
      k.bolt(m.x + rnd(-6, 6), -6, m.x, m.y, { w: 6.5, color: '#ff4a4a', glow: '#5a0010', forks: 3, amp: 12, n: 12, life: 520, grow: 50, delay: c.hit - 50 });
      k.pillar(m.x, m.y, { w: 12, color: '#ff6a6a', glow: '#8a0a1a', core: '#ffe0e0', delay: c.hit - 20, life: 420, burst: false });
      c.each((t, i, d) => {
        if (c.all) k.bolt(m.x, m.y - 30, t.x, t.y, { w: 2.6, color: '#ff4a4a', glow: '#5a0010', forks: 1, amp: 8, life: 360, grow: 40, delay: d + c.hit - 40 });
        add(c, 'g4Cloud', { x: t.x, y: ground(c, t, 10), r: 34 * c.sz, sy: 0.45, spin: -3, color: '#120208', color2: '#2a0610', lit: '#ff3a3a', flash: 0.25, delay: d + c.hit + 60, life: 700 });
        k.impact(t.x, t.y, { r: 16 * c.sz, color: '#ffe0e0', glow: '#ff3a3a', colors: ['#ff3a3a', '#ffd0d0', '#2a0008'], delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ff3a3a', '#ff8a6a', '#ffd0d0'], n: per(c, 30) + solo(c, 24), speed: 200, delay: d + c.hit + 80, life: 560 });
        for (let j = 0; j < 2 + solo(c, 2); j++) k.bolt(t.x + rnd(-14, 14), t.y + rnd(-14, 6), t.x + rnd(-30, 30), t.y + rnd(-20, 14), { w: 1.2, color: '#ff6a6a', glow: '#3a0008', forks: 0, n: 4, amp: 4, life: 160, grow: 20, delay: d + c.hit + 150 + j * 90 });
      });
      k.flash('#ff8a8a', 140, c.hit);
      k.shake(460, 2.9, c.hit);
    },
  },
  // ロトの剣技: 剣に 金の 鳥の 紋章が ひかり、金白の 光の 斬げき → 紋章の かたちの 光
  ax_loto_kengi: {
    minParts: 156,
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g4_lotoken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4);
      const tip = raise(c, { len: 38, bolts: 0, elec: false, life: 320, blade: '#fff0a0' });
      const h = hands(c, 12);
      add(c, 'g4Loto', { x: h.x, y: h.y - 6, s: 7, pop: 160, color: '#ffd23a', core: '#fff6c8', life: 320 });
      c.fx.glow(tip.x, tip.y, { color: '#fff0a0', r: 26, life: 300, alpha: 1 });
      c.each((t, i, d) => {
        k.dash(h.x, h.y - 10, t.x, t.y, { color: '#ffd23a', travel: c.hit - 80, w: 5, delay: d + 60 });
        k.slash(t.x, t.y, { r: 34 * c.sz, w: 8, ang: -0.7, color: '#fff6d0', glow: '#ffd23a', core: '#ffffff', delay: d + c.hit - 60, life: 440, after: 3 });
        add(c, 'g4Loto', { x: t.x, y: t.y - 4, s: 15 * c.sz, pop: 200, color: '#ffd23a', core: '#fff6c8', flap: 0.12, delay: d + c.hit + 40, life: 700 });
        k.impact(t.x, t.y, { r: 17 * c.sz, glow: '#ffd23a', colors: GOLD.list, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 60 * c.sz, color: '#ffd23a', w: 2.4, n: 2, gap: 120, delay: d + c.hit + 120 });
        k.particles(t.x, t.y, { colors: GOLD.list, n: per(c, 26) + solo(c, 30), speed: 190, delay: d + c.hit, life: 480 });
        k.sparkles(t.x, t.y, { n: per(c, 10) + solo(c, 8), r: 30, delay: d + c.hit + 300, life: 360 });
      });
      k.flash('#fff6d0', 100, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // ロトのしるし: 画面の 上に 大きな 金の 鳥の 紋章 → 味方へ 金の 光が ふる
  ax_loto_shirushi: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g4_shirushi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'gold', { a: 0.55, sy: 40 });
      add(c, 'g4Loto', { x: c.W / 2, y: 44, s: 24, pop: 320, flap: 0.12, color: '#ffd23a', core: '#fff6c8', life: c.len - 60 });
      k.shockwave(c.W / 2, 44, { r0: 10, r1: 120, color: '#fff0a0', w: 3, n: 2, gap: 140, delay: 200 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 8, color: '#fff0a0', glow: '#ffd23a', delay: d + c.hit - 60, life: 520, burst: false, alpha: 0.8 });
        k.shapes(t.x, t.y - 60, { shape: 'twinkle', n: 10, colors: ['#ffffff', '#fff0a0', '#ffd23a'], speed: 40, ang: Math.PI / 2, spread: 0.3, g: 60, size: 3, delay: d + c.hit - 120, life: 520 });
        c.fx.glow(t.x, t.y - 10, { color: '#ffd23a', r: 26, delay: d + c.hit, life: 420, alpha: 0.9 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, sy: 0.4, color: '#fff0a0', delay: d + c.hit });
      });
      k.flash('#fff6c8', 120, c.hit);
      k.shake(520, 3, 120);
    },
  },
  // ロトのいのり: 金の 光の はしらが 味方 1人ずつに → 金の 羽
  ax_loto_inori: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_inori',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'dawn', { a: 0.35, sy: 0 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 14, color: '#fff0a0', glow: '#ffd23a', core: '#ffffff', delay: d + c.hit - 70, life: 640, burst: false, widths: [0.4, 1, 1, 0.8, 0] });
        k.shapes(t.x, t.y - 40, { shape: 'petal', n: 10, colors: ['#ffd23a', '#fff6c8', '#ffffff'], speed: 30, spread: Math.PI, g: 30, size: 2.4, spin: 4, delay: d + c.hit + 40, life: 640, add: false });
        c.fx.swirl(t.x, t.y - 2, ['#fff6c8', '#ffd23a'], { n: 14, rad: 14, h: 40, delay: d + c.hit, life: 520 });
        k.shapes(t.x, t.y - 6, { shape: 'twinkle', n: 6, colors: ['#ffffff', '#fff0a0'], speed: 24, ang: -Math.PI / 2, spread: 0.7, g: -30, size: 3, delay: d + c.hit + 120, life: 420 });
      });
      k.flash('#fff6c8', 110, c.hit);
      k.shake(500, 3, c.hit - 80);
    },
  },
  // 伝説のきずな: 味方を 金と 白の 光の 糸で つなぎ、ひとりずつに ロトの しるしの 光
  ax_densetsu_kizuna: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_kizuna',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'gold', { a: 0.42, sy: 10 });
      add(c, 'g4Thread', { pts: loopPts(c), loop: true, grow: c.hit, w: 2.2, color: '#fff6c8', glow: '#ffd23a', sag: c.n >= 2 ? -18 : 0, life: c.len - 60 });
      add(c, 'g4Thread', { pts: loopPts(c), loop: true, grow: c.hit + 120, w: 1, color: '#ffffff', glow: '#fff0a0', sag: c.n >= 2 ? -8 : 0, delay: 80, life: c.len - 140 });
      c.each((t, i, d) => {
        add(c, 'g4Loto', { x: t.x, y: t.y - 30, s: 9, pop: 200, color: '#ffd23a', core: '#fff6c8', delay: d + c.hit - 100, life: c.len - c.hit - d });
        c.fx.glow(t.x, t.y - 12, { color: '#ffd23a', r: 28, delay: d + c.hit, life: 460, alpha: 0.9 });
        k.sparkles(t.x, t.y - 14, { n: 8, r: 20, colors: ['#ffffff', '#fff0a0'], delay: d + c.hit + 60, life: 380 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, sy: 0.4, color: '#fff0a0', n: 2, gap: 90, delay: d + c.hit });
      });
      k.flash('#fff6c8', 110, c.hit);
      k.shake(500, 3, c.hit - 100);
    },
  },
  // ギガクロスブレイク: 雷雲の 空 → たての いなずまの 一閃 → よこの 一閃 → 金色の 大きな 十字が 敵ぜんぶの 上で ひかって 爆発・いなずまの はしら
  ax_giga_cross_break: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g4_gigacross',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      bg(c, 'storm', { a: 0.6 });
      cloud(c, { r: 110, life: c.len - 160 });
      raise(c, { len: 36, bolts: 2, life: 260 });
      const m = c.center;
      const xs = c.targets.map((t) => t.x);
      const s = Math.max(52, (Math.max(...xs) - Math.min(...xs)) / 2 + 34);
      add(c, 'g4Cleave', { x0: m.x, y0: m.y - s, x1: m.x, y1: m.y + s * 0.8, w: 6, zig: true, color: '#fff6d0', glow: '#ffd23a', core: '#ffffff', zigGlow: '#9ad8ff', edge: '#8a5a00', grow: 80, delay: c.hit - 80, life: 380 });
      add(c, 'g4Cleave', { x0: m.x - s, y0: m.y, x1: m.x + s, y1: m.y, w: 6, zig: true, color: '#fff6d0', glow: '#ffd23a', core: '#ffffff', zigGlow: '#9ad8ff', edge: '#8a5a00', grow: 80, delay: c.hit + 140, life: 380 });
      add(c, 'g4Cross', { x: m.x, y: m.y, s, w: 7, elec: true, color: '#ffe060', glow: '#ffd23a', core: '#ffffff', edge: '#8a5a00', h2: 220, boomAt: 600, delay: c.hit, life: 1180 });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffd23a', colors: GOLD.list, delay: d + c.hit, heavy: i === 0 });
        k.pillar(t.x, t.y, { w: 12 * c.sz, color: '#fff6b0', glow: '#ffd23a', delay: d + c.hit + 600, life: 460 });
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: pal('gold'), delay: d + c.hit + 620, heavy: i === 0, smoke: '#5a4a2a' });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: per(c, 20) + solo(c, 30), speed: 220, delay: d + c.hit + 620, life: 520 });
      });
      k.shockwave(m.x, m.y, { r0: 20, r1: 190, color: '#fff0a0', w: 4, n: 3, gap: 110, delay: c.hit + 600 });
      k.flash('#ffffff', 220, c.hit + 600);
      k.shake(680, 3.6, c.hit + 580);
    },
  },
  // アルテマソード: 剣から 天まで 光の はしらが のびて、そのまま ふりおろす → 光の 大爆発 → 光の 羽
  ax_ultima_sword: {
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_g4_ultima',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      bg(c, 'storm', { a: 0.6 });
      const m = c.center;
      const piv = c.fromAlly ? { x: c.from.x - 30, y: c.H + 4 } : { x: c.from.x, y: c.from.y };
      const at = aimOf(piv, m);
      const L = Math.hypot(m.x - piv.x, m.y - piv.y) + 70;
      const a0 = c.fromAlly ? -Math.PI / 2 - 0.55 : at - 1.3, a1 = c.fromAlly ? at + 0.3 : at + 0.25;
      add(c, 'g4Blade', { x: piv.x, y: piv.y, ang0: a0, ang1: a1, swingAt: c.hit - 160, swing: 160, len: L, len0: 0.15, grow: 300, w: 7, color: '#fff6c8', glow: '#ffffff', core: '#ffffff', loto: true, life: c.hit + 260 });
      k.pillar(piv.x + Math.cos(a0) * L * 0.6, 40, { w: 10, color: '#fff6c8', glow: '#ffffff', delay: 120, life: 300, burst: false, alpha: 0.6 });
      k.speedLines(m.x, m.y, { delay: c.hit - 120, life: 300, r1: 170, color: '#fff6c8' });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#fff0a0', colors: LIGHT.list, delay: d + c.hit, heavy: i === 0 });
        k.explosion(t.x, t.y, { r: 30 * c.sz, pal: pal('holy'), delay: d + c.hit + 60, heavy: i === 0, smoke: '#8a8070' });
        k.shapes(t.x, t.y, { shape: 'petal', n: per(c, 16) + solo(c, 10), colors: ['#ffffff', '#fff6c8', '#ffe08a'], speed: 80, g: 30, size: 2.6, spin: 5, delay: d + c.hit + 300, life: 900, add: false });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6c8'], n: per(c, 24) + solo(c, 30), speed: 230, delay: d + c.hit + 60, life: 520 });
      });
      k.shockwave(m.x, m.y, { r0: 20, r1: 200, color: '#ffffff', w: 4, n: 3, gap: 120, delay: c.hit + 60 });
      k.flash('#ffffff', 240, c.hit);
      k.shake(700, 3.8, c.hit);
    },
  },
  // 光の玉: 頭の 上に 白金の 玉 → かがやいて 画面の くらさが ぜんぶ はらわれる → 敵ぜんぶに 光の はしら
  ax_hikari_no_tama: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_g4_hikari',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 30);
      const sky = { x: c.W / 2, y: 26 };
      darken(c, 0.55, { life: 340, fout: 120 });
      k.orb(h.x, h.y, { r: 9, color: '#fff6c8', glow: '#ffffff', rim: '#ffe08a', grow: 120, start: 140, travel: 200, to: sky, hop: 6 });
      k.orb(sky.x, sky.y, { r: 14, color: '#fff6c8', glow: '#ffffff', rim: '#ffe08a', grow: 120, hold: c.len - 700, delay: 340 });
      add(c, 'g4Rays', { x: sky.x, y: sky.y, r: 180, n: 16, color: '#fff6c8', alpha: 0.32, spin: 0.4, delay: 340, life: c.len - 380 });
      bg(c, 'dawn', { a: 0.38, sy: sky.y, delay: 360, life: c.len - 360 });
      k.shockwave(sky.x, sky.y, { r0: 10, r1: 260, color: '#ffffff', w: 5, n: 3, gap: 120, delay: 360, life: 520 });
      k.flash('#ffffff', 200, 360);
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 13 * c.sz, color: '#fff6c8', glow: '#ffffff', core: '#ffffff', delay: d + c.hit - 70, life: 600 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#fff0a0', colors: LIGHT.list, delay: d + c.hit, heavy: i === 0 });
        k.sparkles(t.x, t.y, { n: per(c, 14) + solo(c, 10), r: 26, delay: d + c.hit + 160, life: 420 });
        k.particles(t.x, t.y, { colors: LIGHT.list, n: per(c, 24) + solo(c, 30), speed: 200, delay: d + c.hit, life: 520 });
      });
      k.shake(600, 3.4, c.hit);
    },
  },
  // テラデイン: 雷雲の うずの まん中から 画面の 3分の1 ある 巨大な いなずまの はしら → 電気の わ 3重・白フラッシュ → 小さな いなずまが じめんを はしり つづける
  ax_teradein: {
    charge: { color: '#ffd23a', color2: '#ffffff', power: 1.1 },
    sfx: 'ax_g4_teradein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      bg(c, 'storm', { a: 0.6 });
      const m = c.center;
      cloud(c, { x: m.x, y: 2, r: 130, spin: 2.2, flash: 0.2, life: c.len - 100 });
      raise(c, { len: 34, bolts: 1, life: 240 });
      k.gather(m.x, 8, { colors: ['#ffffff', '#c8d8ff'], n: 16, r: 90, life: 220, waves: 1 });
      k.pillar(m.x, m.y + 6, { w: 36, color: '#fff6b0', glow: '#9ad8ff', core: '#ffffff', delay: c.hit - 60, life: 720, widths: [0.4, 1, 1.15, 1, 0.8, 0.5, 0] });
      for (let j = 0; j < 4; j++) k.bolt(m.x + rnd(-20, 20), -6, m.x + rnd(-40, 40), m.y + rnd(-10, 10), { w: 3, color: DEIN.color, glow: '#ffd23a', forks: 3, amp: 16, n: 11, life: 300, grow: 40, delay: c.hit - 40 + j * 110 });
      const gy = Math.min(c.H - 6, m.y + 24);
      k.shockwave(m.x, gy, { r0: 10, r1: 150, sy: 0.32, color: '#fff6b0', w: 3.2, n: 3, gap: 110, delay: c.hit });
      c.each((t, i, d) => {
        if (c.all) k.bolt(m.x, m.y - 20, t.x, t.y, { w: 2.6, color: DEIN.color, glow: '#ffd23a', forks: 2, amp: 10, life: 380, grow: 40, delay: d + c.hit - 30 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#fff6b0', '#9ad8ff'], delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#9ad8ff'], n: per(c, 28) + solo(c, 30), speed: 240, delay: d + c.hit + 20, life: 520 });
        k.debris(t.x, ground(c, t, 18), { n: per(c, 10), up: 170, delay: d + c.hit + 40 });
      });
      // じめんを はしり つづける 小さな いなずま（0.5びょう）
      for (let j = 0; j < 12; j++) {
        const x0 = m.x + rnd(-90, 90);
        k.bolt(x0, gy + rnd(-4, 4), x0 + rnd(-30, 30), gy + rnd(-6, 8), { w: 1, color: '#fff6b0', glow: '#9ad8ff', forks: 0, n: 5, amp: 4, life: 180, grow: 30, delay: c.hit + 360 + j * 50 });
      }
      k.flash('#ffffff', 260, c.hit);
      k.shake(700, 3.8, c.hit);
    },
  },
  // ミナデイン（合体技）: 4人の いちから 金の 光が 空へ → 空で 1つに → 巨大な いなずまが 敵へ → 大爆発
  ax_minadein: {
    sfx: 'ax_g4_minadein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      bg(c, 'storm', { a: 0.6 });
      const sky = { x: c.center.x, y: 16 };
      cloud(c, { x: sky.x, y: 4, r: 110, spin: 1.8, life: c.len - 100 });
      const COLS = ['#ffd23a', '#fff0a0', '#ffe060', '#ffffff'];
      for (let j = 0; j < 4; j++) {
        const sx = c.W * (0.14 + j * 0.24);
        c.fx.glow(sx, c.H - 10, { color: '#ffd23a', r: 18, delay: j * 120, life: 360, alpha: 0.9 });
        k.pillar(sx, c.H - 6, { w: 4, color: '#fff0a0', glow: '#ffd23a', delay: j * 120, life: 360, burst: false, alpha: 0.6 });
        k.dash(sx, c.H - 10, sky.x, sky.y, { color: COLS[j], travel: 340, w: 4, delay: j * 120, n: 3 });
      }
      k.orb(sky.x, sky.y, { r: 16, color: '#ffd23a', glow: '#fff6b0', rim: '#ffffff', grow: 360, hold: 260, delay: 480 });
      k.gather(sky.x, sky.y, { colors: ['#ffffff', '#fff0a0'], n: 16, r: 60, life: 260, waves: 2, gap: 160, delay: 500 });
      k.shockwave(sky.x, sky.y, { r0: 6, r1: 80, color: '#fff0a0', w: 2.4, n: 2, gap: 160, delay: 600 });
      c.each((t, i, d) => {
        k.bolt(sky.x, sky.y, t.x, t.y, { w: 5.5, color: DEIN.color, glow: DEIN.glow, forks: 3, amp: 14, n: 12, life: 520, grow: 60, delay: d + c.hit - 60 });
        k.pillar(t.x, t.y, { w: 16 * c.sz, color: '#fff6b0', glow: '#ffd23a', delay: d + c.hit - 30, life: 560 });
        k.explosion(t.x, t.y, { r: 28 * c.sz, pal: pal('gold'), delay: d + c.hit + 40, heavy: i === 0, smoke: '#5a4a2a' });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: per(c, 24) + solo(c, 24), speed: 230, delay: d + c.hit + 40, life: 520 });
      });
      k.shockwave(c.center.x, c.center.y, { r0: 20, r1: 180, color: '#fff6b0', w: 4, n: 3, gap: 110, delay: c.hit + 40 });
      k.flash('#ffffff', 240, c.hit);
      k.shake(600, 3.2, c.hit);
    },
  },
};
