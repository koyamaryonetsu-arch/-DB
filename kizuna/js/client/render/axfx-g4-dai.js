// 第48回 G4: ダイの大冒険（アバン流・竜の騎士・竜魔人・大魔道士）の 大技の え。この ファイルは G4 だけが さわる
// 時間は shared/data/ax-time-g4.js。play の 時間は はなつ しゅんかんが 0
import { pal, rnd } from './axkit.js?v=5c89bfcd3c09';
import { add, obj, bg, darken, hands, ground, per } from './axfx-g4-kit.js?v=5c89bfcd3c09';

const FIRE = pal('fire');
// 竜闘気（青白）・竜魔人（むらさき）・アバンの 金
const RYU = { main: '#5ad0ff', glow: '#bfeaff', core: '#ffffff', list: ['#e8fbff', '#5ad0ff', '#ffffff'] };
const RYUMA = { main: '#a86aff', glow: '#e0c8ff', core: '#ffffff', list: ['#f0e0ff', '#a86aff', '#ffffff', '#6a8aff'] };
const AVAN = { main: '#ffe08a', glow: '#ffb020', core: '#ffffff', list: ['#ffffff', '#ffe08a', '#ffb020'] };
const BOLT = { main: '#fff6b0', glow: '#ffe040', core: '#ffffff' };
const aimOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
// a から b を こえて 画面の はしの そとまで（光線が 敵を つらぬいて のびる）
const beyond = (a, b, L = 200) => {
  const an = aimOf(a, b), cx = Math.cos(an), cy = Math.sin(an);
  let l = 0;
  while (l < L && a.x + cx * l > -50 && a.x + cx * l < 306 && a.y + cy * l > -50 && a.y + cy * l < 194) l += 4;
  return { x: a.x + cx * l, y: a.y + cy * l };
};

// 剣を 天に かかげて いなずまを うける（ギガブレイク・魔法剣・ギガクロス）
function raiseSword(c, o = {}) {
  const h = hands(c, 14);
  const len = (o.len || 34) * (c.fromAlly ? 1 : 0.8);
  add(c, 'g4Blade', { x: h.x, y: h.y, ang0: -Math.PI / 2 + (o.tilt || 0.12), len, w: 2.6, elec: true, elecGlow: o.glow || '#ffe040', elecCol: o.col || '#fff6b0', color: o.blade || '#9ad8ff', loto: !!o.loto, life: o.life || 380, delay: o.delay || 0 });
  const tip = { x: h.x + Math.cos(-Math.PI / 2 + (o.tilt || 0.12)) * len, y: h.y - len };
  for (let i = 0; i < (o.bolts || 2); i++) c.k.bolt(tip.x + rnd(-30, 30), -12, tip.x, tip.y, { w: 2.4, color: o.col || '#fff6b0', glow: o.glow || '#ffe040', forks: 2, amp: 10, life: 220, grow: 50, delay: (o.delay || 0) + i * 110 });
  c.k.flash('#fff6d0', 80, (o.delay || 0) + 50);
  c.fx.glow(tip.x, tip.y, { color: o.glow || '#ffe040', r: 22, delay: (o.delay || 0) + 50, life: 300, alpha: 0.9 });
  c.fx.sparks(tip.x, tip.y, { colors: ['#ffffff', o.col || '#fff6b0'], n: 12, speed: 120, delay: (o.delay || 0) + 60, life: 360 });
  return tip;
}

export const AX_G4_DAI = {
  // 海波斬: とても 速い 水色の 細い 一閃 ＋ 波の すじ・しぶき → おくれて 線が ひかる
  ax_kaihazan: {
    charge: { color: '#5ac8ff', color2: '#e0f8ff' },
    sfx: 'ax_g4_kaiha',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      k.streaks({ ang: 0.08, color: '#bfefff', n: 16, life: 260, alpha: 0.55, speed: 1.8 });
      c.each((t, i, d) => {
        const L = 62 * c.sz;
        add(c, 'g4Cleave', { x0: t.x - L, y0: t.y + 6, x1: t.x + L, y1: t.y - 8, w: 2, color: '#d8f8ff', glow: '#2ab8ff', core: '#ffffff', edge: '#0a5ac8', grow: c.hit * 0.8, delay: d, life: 300 });
        // 波の すじ（海の 波の ような 一閃）
        for (let j = 0; j < 3; j++) add(c, 'g4Thread', { pts: [[t.x - L * 0.9, t.y + 10 + j * 5], [t.x + L * 0.8, t.y - 2 + j * 5]], sag: 3 - j, grow: c.hit + j * 30, w: 0.9, color: '#bfefff', glow: '#2a8aff', delay: d + j * 20, life: 380 });
        // 一しゅん おくれて 線が ひかる
        add(c, 'g4Cleave', { x0: t.x - L, y0: t.y + 6, x1: t.x + L, y1: t.y - 8, w: 3.2, color: '#ffffff', glow: '#7ae0ff', core: '#ffffff', edge: '#0a5ac8', grow: 30, delay: d + c.hit + 120, life: 260 });
        k.splash(t.x, t.y, { n: per(c, 16), delay: d + c.hit, power: 0.8 });
        k.impact(t.x, t.y, { r: 11 * c.sz, glow: '#7ae0ff', colors: ['#ffffff', '#7ae0ff'], delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#bfefff', '#2ab8ff'], n: per(c, 16), speed: 170, ang: -0.1, spread: 0.6, delay: d + c.hit + 110, life: 320 });
      });
      k.shake(100, 1.1, c.hit);
    },
  },
  // 大地斬: 上から 下へ 太い 一閃（白い しん・金の ふち）→ じめんが 割れる・岩の かけら → ちり
  ax_daichizan: {
    minParts: 82,
    charge: { color: '#ffc04a', color2: '#fff4d0' },
    sfx: 'ax_g4_daichi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = ground(c, t, 22);
        add(c, 'g4Cleave', { x0: t.x + 8, y0: t.y - 56 * c.sz, x1: t.x - 4, y1: gy + 4, w: 5 * c.sz, color: '#fff6d8', glow: '#ffb020', core: '#ffffff', grow: c.hit, delay: d, life: 420 });
        c.fx.crack(t.x - 3, gy, { n: 6, len: 30 * c.sz, color: '#2a1a10', hi: '#ffd66b', delay: d + c.hit, life: 520 });
        k.impact(t.x, t.y + 6, { r: 15 * c.sz, glow: '#ffd66b', colors: AVAN.list, delay: d + c.hit, heavy: i === 0 });
        k.debris(t.x, gy, { n: per(c, 14), up: 150, delay: d + c.hit });
        k.shockwave(t.x, gy, { r0: 4, r1: 44 * c.sz, sy: 0.3, color: '#ffd66b', w: 2.2, n: 2, gap: 80, delay: d + c.hit });
        for (let j = 0; j < 5; j++) c.fx.puff(t.x + rnd(-20, 20), gy, { color: '#c8b090', r0: 3, r1: 12, vx: rnd(-40, 40), vy: rnd(-26, -6), life: 420, alpha: 0.5, delay: d + c.hit + 60 });
      });
      k.shake(120, 1.3, c.hit);
    },
  },
  // 空裂斬: 光の 刃が とんで、敵の まん中の 小さな 光の 点（核）を つらぬく → 光の 十字
  ax_kuuretsuzan: {
    minParts: 86,
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_g4_kuuretsu',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 16);
      c.each((t, i, d) => {
        // 核（見えない 心）が 光って 見える
        c.fx.glow(t.x, t.y, { color: '#ff7ad8', r: 6, delay: d, life: c.hit + 80, alpha: 1 });
        c.fx.twinkle(t.x, t.y, { color: '#ffd0f0', size: 5, delay: d + 40, life: c.hit });
        k.dash(h.x, h.y, t.x, t.y, { color: '#fff6c8', travel: c.hit, w: 3.4, delay: d, n: 3 });
        add(c, 'g4Cleave', { x0: h.x, y0: h.y, x1: t.x + (t.x - h.x) * 0.25, y1: t.y + (t.y - h.y) * 0.25, w: 1.4, color: '#ffffff', glow: '#fff0a0', core: '#ffffff', grow: c.hit, delay: d, life: c.hit + 160 });
        add(c, 'g4Cross', { x: t.x, y: t.y, s: 24 * c.sz, w: 2.4, color: '#fff6c8', glow: '#ffe08a', core: '#ffffff', h2: 40, boomAt: 200, delay: d + c.hit, life: 380 });
        k.impact(t.x, t.y, { r: 10 * c.sz, glow: '#fff0a0', delay: d + c.hit, heavy: i === 0 });
        k.sparkles(t.x, t.y, { n: per(c, 10), r: 20, delay: d + c.hit + 40, life: 300 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff0a0'], n: per(c, 18), speed: 150, delay: d + c.hit, life: 320 });
      });
      k.shake(100, 1.1, c.hit);
    },
  },
  // アバンストラッシュ: 逆手の よこなぎ → 金白の 光が とんで「A」の かたちに 斬る → ほしの ひかり・金の わ 2重 → きらきら
  ax_avan_strash: {
    minParts: 100,
    charge: { color: '#ffd23a', color2: '#fff6d0', power: 1.1 },
    sfx: 'ax_g4_strash',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 10);
      // 逆手で 低く かまえた 剣を よこに なぐ（光の 弧）
      const a0 = c.fromAlly ? Math.PI * 0.95 : -Math.PI * 0.95, a1 = c.fromAlly ? Math.PI * 1.95 : Math.PI * 0.05 - Math.PI * 0.0;
      add(c, 'g4Blade', { x: h.x, y: h.y, ang0: a0, ang1: c.fromAlly ? a1 : 0.05, swing: 120, len: 28, w: 2.4, color: '#ffe08a', glow: '#ffb020', life: 300 });
      c.each((t, i, d) => {
        k.dash(h.x, h.y - 6, t.x, t.y, { color: '#ffe08a', travel: c.hit - 40, w: 6 * c.sz, delay: d + 60, n: 5 });
        add(c, 'g4AStrash', { x: t.x, y: t.y + 2, s: 34 * c.sz, w: 5 * c.sz, swing: 210, delay: d + c.hit - 20, life: 620, color: '#fff2b0', glow: '#ffb020' });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd66b', colors: AVAN.list, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 58 * c.sz, color: '#ffd23a', w: 2.6, n: 2, gap: 110, delay: d + c.hit + 200, life: 420 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 10), colors: ['#ffffff', '#ffe08a', '#ffd23a'], speed: 80, size: 2.6, delay: d + c.hit + 240, life: 520 });
        k.sparkles(t.x, t.y, { n: per(c, 12), r: 30, size: 6, delay: d + c.hit + 300, life: 360 });
        k.particles(t.x, t.y, { colors: AVAN.list, n: per(c, 24), speed: 180, delay: d + c.hit, life: 420 });
      });
      k.speedLines(c.center.x, c.center.y, { delay: c.hit - 40, life: 260, r1: 150, color: '#fff2b0' });
      k.shake(200, 1.8, c.hit);
    },
  },
  // 竜闘気: ひたいの 紋章が つよく ひかり、青白い 竜闘気の 球が からだを つつむ・小石が うく → オーラが もえる
  ax_ryutouki: {
    charge: { color: '#5ad0ff', color2: '#e8fbff' },
    sfx: 'ax_g4_ryutouki',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38, { fout: 320 });
      c.each((t, i, d) => {
        const cy = t.y - 18;
        add(c, 'g4Crest', { x: t.x, y: cy - 22, s: 7, pop: 220, color: '#5ad0ff', delay: d, life: c.len - 80 });
        add(c, 'g4Bubble', { x: t.x, y: cy, r: 30, grow: c.hit, color: '#7ad8ff', delay: d + 80, life: c.len - 160 });
        k.aura(t.x, cy + 6, { style: 'flame', r: 16, h: 40, color: '#5ad0ff', color2: '#e8fbff', delay: d + c.hit, life: c.len - c.hit - 40, k: 1.3 });
        k.shockwave(t.x, cy, { r0: 10, r1: 70, color: '#bfeaff', w: 2.6, n: 2, gap: 120, delay: d + c.hit });
        for (let j = 0; j < 6; j++) c.fx.add({ kind: 'axShape', shape: 'rock', x: t.x + rnd(-40, 40), y: Math.min(c.H - 3, t.y + 14), vx: rnd(-4, 4), vy: rnd(-34, -18), g: 0, drag: 1, color: ['#a08060', '#6a5040', '#d8c0a0'][j % 3], size: rnd(1.2, 2.4), rot0: rnd(0, 6), spin: rnd(-2, 2), delay: d + rnd(0, 200), life: 700, add: false, pop: false });
        c.fx.sparks(t.x, cy + 10, { colors: RYU.list, n: 24, speed: 90, ang: -Math.PI / 2, spread: 0.5, g: -120, drag: 0.97, delay: d + c.hit, life: 560 });
        k.particles(t.x, cy, { colors: RYU.list, n: 20, speed: 140, delay: d + c.hit, life: 420 });
      });
      k.flash('#e8fbff', 120, c.hit);
      k.shake(320, 2, c.hit);
    },
  },
  // ギガブレイク: 剣を 天に かかげ いなずまを まとう → とびこんで 上から 大きな 一閃 → いなずまの はしら・じめんに 電気
  ax_giga_break: {
    minParts: 154,
    charge: { color: '#5ad0ff', color2: '#ffffff' },
    sfx: 'ax_g4_gigabreak',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.45);
      raiseSword(c, { len: 36, bolts: 2, life: 300 });
      const h = hands(c, 14);
      c.each((t, i, d) => {
        k.dash(h.x, h.y, t.x, t.y - 10, { color: '#9ad8ff', travel: 150, w: 5, delay: d + 220 });
        add(c, 'g4Cleave', { x0: t.x + 4, y0: t.y - 72 * c.sz, x1: t.x - 2, y1: ground(c, t, 26), w: 6 * c.sz, zig: true, color: '#e8f6ff', glow: '#5ad0ff', core: '#ffffff', zigGlow: '#ffd23a', grow: 80, delay: d + c.hit - 70, life: 520 });
        k.pillar(t.x, t.y, { w: 13 * c.sz, color: '#fff6b0', glow: '#9ad8ff', delay: d + c.hit, life: 460 });
        k.bolt(t.x - 4, ground(c, t, 18), t.x - 50, ground(c, t, 22), { w: 1.4, forks: 1, amp: 5, life: 380, delay: d + c.hit + 60 });
        k.bolt(t.x + 4, ground(c, t, 18), t.x + 50, ground(c, t, 22), { w: 1.4, forks: 1, amp: 5, life: 380, delay: d + c.hit + 90 });
        k.shockwave(t.x, ground(c, t, 20), { r0: 4, r1: 60 * c.sz, sy: 0.3, color: '#fff6b0', w: 2.2, n: 3, gap: 90, delay: d + c.hit });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#9ad8ff', colors: ['#ffffff', '#fff6b0', '#5ad0ff'], delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#9ad8ff'], n: per(c, 30), speed: 200, delay: d + c.hit + 40, life: 520 });
      });
      k.flash('#ffffff', 140, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
  // 竜の紋章: 紋章の 大きな 光 → 青白い やさしい 光が からだを つつむ（回復）
  ax_ryu_no_monshou: {
    charge: { color: '#5ad0ff', color2: '#e8fbff' },
    sfx: 'ax_g4_crest',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35);
      c.each((t, i, d) => {
        add(c, 'g4Crest', { x: t.x, y: t.y - 48, s: 15, pop: 260, color: '#7ad8ff', delay: d, life: c.len - 60 });
        k.pillar(t.x, t.y, { w: 9, color: '#bfeaff', glow: '#e8fbff', delay: d + c.hit - 60, life: 460, burst: false, alpha: 0.6 });
        c.fx.swirl(t.x, t.y - 6, ['#e8fbff', '#7ad8ff', '#ffffff'], { n: 22, rad: 18, h: 40, delay: d + c.hit, life: 560 });
        k.shapes(t.x, t.y - 10, { shape: 'twinkle', n: 12, colors: ['#ffffff', '#bfeaff'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit, life: 520 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 40, sy: 0.4, color: '#bfeaff', n: 2, gap: 100, delay: d + c.hit });
      });
      k.flash('#e8fbff', 100, c.hit);
      k.shake(300, 2, c.hit - 80);
    },
  },
  // 竜のいかり: ほのおの 竜の あたまが 口を あけて 敵ぜんぶに ほのおの 息 → ほのおの かべ
  ax_ryu_no_ikari: {
    charge: { color: '#ff7a3a', color2: '#ffe0a0' },
    sfx: 'ax_g4_dragonfire',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4, { color: '#1a0402' });
      const ang = aimOf(c.from, c.center);
      const hx = c.from.x + Math.cos(ang) * 26, hy = c.from.y + Math.sin(ang) * 26 - (c.fromAlly ? 10 : 0);
      add(c, 'g4Dragon', { x: hx, y: hy, ang, s: 17, color: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', eye: '#fff2a0', pop: 200, openAt: 120, life: c.len - 200 });
      const mx = hx + Math.cos(ang) * 22, my = hy + Math.sin(ang) * 22;
      c.each((t, i, d) => {
        k.beam(mx, my, t.x, t.y, { w: 12 * c.sz, color: '#ff7a1a', glow: '#ffc040', core: '#fff2a0', delay: d + 180, life: 560, grow: c.hit - 180, widths: [0.5, 1, 1.2, 0.9, 0], streaks: false });
        k.flames(t.x, ground(c, t, 18), { w: 34 * c.sz, h: 34 * c.sz, n: 6, delay: d + c.hit + 40, life: 640 });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffa040', colors: FIRE.list, delay: d + c.hit, heavy: i === 0 });
      });
      // ほのおの かべ
      const gy = Math.min(c.H - 4, c.center.y + 20);
      for (let j = 0; j < 4; j++) k.flames(lerpX(c, j), gy, { w: 48, h: 26, n: 6, delay: c.hit + 160 + j * 50, life: 560, embers: j % 2 === 0 });
      k.shake(380, 2.2, c.hit);
    },
  },
  // ドルオーラ: 両手を 竜の あごの ように ひらいて 青白い 球 → 極太の 光線（先が 竜の あたま）→ 白い ドーム → 青い 大爆発
  ax_doruora: {
    charge: { color: '#5ad0ff', color2: '#ffffff', power: 1.15 },
    sfx: 'ax_g4_doruora',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.45);
      const h = c.fromAlly ? { x: c.from.x, y: c.H - 20 } : hands(c, 0);
      // 両手の あいだで ちぢむ 球（まわりの 光を すいこむ）
      c.k.orb(h.x, h.y, { r: 11, color: '#5ad0ff', glow: '#bfeaff', rim: '#ffffff', grow: 60, hold: 120, life: 200 });
      k.gather(h.x, h.y, { colors: ['#ffffff', '#bfeaff'], n: 14, r: 44, life: 180, waves: 1 });
      // 竜の あご（上と 下の 手）
      const ang0 = aimOf(h, c.center);
      add(c, 'g4Dragon', { x: h.x + Math.cos(ang0) * 6, y: h.y + Math.sin(ang0) * 6, ang: ang0, s: 7, color: '#5ad0ff', glow: '#bfeaff', open: 1, openAt: 0, life: 240 });
      c.each((t, i, d) => {
        const ang = aimOf(h, t);
        const grow = c.hit - 180;
        const far = beyond(h, t, 210);
        k.beam(h.x, h.y, t.x, t.y, { w: 19 * c.sz, color: '#5ad0ff', glow: '#bfeaff', core: '#ffffff', delay: d + 180, life: 840, grow, widths: [0.6, 1, 1.15, 1.1, 0.8, 0], burst: false });
        k.beam(t.x, t.y, far.x, far.y, { w: 17 * c.sz, color: '#5ad0ff', glow: '#bfeaff', core: '#ffffff', delay: d + 180 + grow - 10, life: 840 - grow, grow: 120, widths: [0.9, 1.1, 1, 0.8, 0], burst: false, streaks: true });
        add(c, 'g4Dragon', { x0: h.x, y0: h.y, x1: t.x - Math.cos(ang) * 8, y1: t.y - Math.sin(ang) * 8, travel: grow, ease: 'out', ang, s: 12 * c.sz, color: '#9ae8ff', glow: '#bfeaff', open: 1, openAt: grow - 40, delay: d + 180, life: grow + 260 });
        add(c, 'g4Bubble', { x: t.x, y: t.y, r: 32 * c.sz, grow: 120, color: '#ffffff', core: '#ffffff', fill: 0.55, delay: d + c.hit, life: 380 });
        k.explosion(t.x, t.y, { r: 26 * c.sz, pal: RYU, delay: d + c.hit + 320, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 10, r1: 90 * c.sz, color: '#bfeaff', w: 3, n: 2, gap: 120, delay: d + c.hit + 320 });
        k.particles(t.x, t.y, { colors: RYU.list, n: per(c, 34), speed: 220, delay: d + c.hit + 340, life: 560 });
      });
      k.streaks({ ang: aimOf(c.from, c.center), color: '#bfeaff', n: 22, delay: c.hit + 360, life: 460, alpha: 0.5 });
      k.flash('#ffffff', 160, c.hit);
      k.shake(450, 2.8, c.hit + 300);
    },
  },
  // 竜の急こう下: 空へ（青い すじ）→ 画面の 上から 竜の かたちの 光に なって 急降下 → ほのおと しょうげき・ひび
  ax_ryu_kyuukouka: {
    charge: { color: '#5ad0ff', color2: '#e8fbff' },
    sfx: 'ax_g4_dive',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.42);
      k.dash(c.from.x, c.from.y, c.from.x + 10, -24, { color: '#5ad0ff', travel: 160, w: 5 });
      c.each((t, i, d) => {
        const st = 220, tr = c.hit - st;
        add(c, 'g4Dragon', { x0: t.x + 30, y0: -34, x1: t.x, y1: t.y - 14, travel: tr, ease: 'in', ang: Math.atan2(t.y - 14 + 34, -30), noFlip: true, s: 17 * c.sz, color: '#7ad8ff', glow: '#bfeaff', open: 0.9, delay: d + st, life: tr + 120 });
        k.beam(t.x + 30, -20, t.x, t.y - 10, { w: 7 * c.sz, color: '#5ad0ff', glow: '#bfeaff', core: '#ffffff', grow: tr, delay: d + st, life: tr + 220, burst: false, streaks: true });
        const gy = ground(c, t, 22);
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#9ad8ff', colors: RYU.list, delay: d + c.hit, heavy: i === 0 });
        k.flames(t.x, gy, { w: 40 * c.sz, h: 30, cols: ['#3a8aff', '#9ad8ff', '#ffffff'], n: 6, delay: d + c.hit, life: 560 });
        c.fx.crack(t.x, gy, { n: 7, len: 34 * c.sz, color: '#1a1a30', hi: '#9ad8ff', delay: d + c.hit, life: 640 });
        k.shockwave(t.x, gy, { r0: 4, r1: 70 * c.sz, sy: 0.3, color: '#bfeaff', w: 2.6, n: 2, gap: 100, delay: d + c.hit });
        k.debris(t.x, gy, { n: per(c, 14), up: 170, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: RYU.list, n: per(c, 24), speed: 200, delay: d + c.hit, life: 460 });
      });
      k.flash('#e8fbff', 110, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
  // 両手の竜の紋章: ひたいと 両手の 3つの 紋章が ひかって 1つに → むらさき〜青の オーラ・うろこの 光・せなかに つばさ
  ax_ryouteno_monshou: {
    charge: { color: '#a86aff', color2: '#e0c8ff' },
    sfx: 'ax_g4_monshou3',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.55 });
      darken(c, 0.2);
      c.each((t, i, d) => {
        const cy = t.y - 20;
        const pts = [[t.x - 28, cy + 4], [t.x + 28, cy + 4], [t.x, cy - 24]];
        pts.forEach(([px, py], j) => {
          add(c, 'g4Crest', { x0: px, y0: py, x1: t.x, y1: cy - 24, travel: 160, start: 300, s: 7, pop: 160, color: j === 2 ? '#a86aff' : '#6a8aff', delay: d + j * 110, life: c.len - j * 110 - 120 });
          k.shockwave(px, py, { r0: 3, r1: 26, color: '#e0c8ff', w: 1.6, delay: d + j * 110 });
        });
        add(c, 'g4Crest', { x: t.x, y: cy - 24, s: 13, pop: 200, color: '#c88aff', delay: d + c.hit, life: c.len - c.hit - 60 });
        add(c, 'g4Wings', { x: t.x, y: cy, s: 52, open: 280, color: '#a86aff', core: '#e0c8ff', flap: 0.12, flapAt: 300, delay: d + c.hit, life: c.len - c.hit - 40 });
        k.aura(t.x, cy + 8, { style: 'flame', r: 18, h: 46, color: '#a86aff', color2: '#e0c8ff', delay: d + c.hit, life: c.len - c.hit - 60, k: 1.6 });
        k.shapes(t.x, cy, { shape: 'diamond', n: 18, colors: ['#e0c8ff', '#a86aff', '#6a8aff'], speed: 50, size: 1.6, spin: 6, delay: d + c.hit + 100, life: 700, r: 16 });
        k.shockwave(t.x, cy, { r0: 10, r1: 110, color: '#e0c8ff', w: 3, n: 3, gap: 120, delay: d + c.hit });
        c.fx.sparks(t.x, cy + 10, { colors: RYUMA.list, n: 26, speed: 100, ang: -Math.PI / 2, spread: 0.6, g: -120, drag: 0.97, delay: d + c.hit, life: 620 });
      });
      k.flash('#f0e0ff', 160, c.hit);
      k.shake(560, 3.2, c.hit);
    },
  },
  // いなずまの魔法剣: 剣に 黄色い いなずま（ライデイン）が 落ちて まとわる → いなずまの 刃の ななめ斬り → 雷の 爆発
  ax_inazuma_mahouken: {
    charge: { color: '#ffe040', color2: '#fff6b0' },
    sfx: 'ax_g4_mahouken',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.42, { color: '#0a0a02' });
      raiseSword(c, { len: 34, bolts: 3, life: 320, blade: '#ffe040', glow: '#ffd000', col: '#fff6b0', tilt: -0.2 });
      c.each((t, i, d) => {
        const s = 40 * c.sz;
        add(c, 'g4Cleave', { x0: t.x - s, y0: t.y - s, x1: t.x + s, y1: t.y + s * 0.8, w: 4.5 * c.sz, zig: true, color: '#fff6b0', glow: '#ffd000', core: '#ffffff', zigGlow: '#ffe040', grow: 90, delay: d + c.hit - 90, life: 440 });
        k.slash(t.x, t.y, { r: 30 * c.sz, w: 6, ang: 0.8, color: '#fff6b0', glow: '#ffd000', core: '#ffffff', delay: d + c.hit - 60, life: 380 });
        k.explosion(t.x, t.y, { r: 20 * c.sz, pal: pal('bolt'), delay: d + c.hit + 60, heavy: i === 0, smoke: '#5a5030' });
        k.boltRain(t.x, t.y, { n: 3, spread: 22, gap: 70, delay: d + c.hit, w: 2.4, color: '#fff6b0', glow: '#ffd000' });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#fff6b0', '#ffe040'], n: per(c, 26), speed: 200, delay: d + c.hit, life: 460 });
      });
      k.flash('#fff6b0', 130, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // 竜魔のおたけび: むらさきの しょうげきの わが なんじゅうにも ひろがって 敵ぜんぶを ゆらす → 下むきの やじるし
  ax_ryuma_otakebi: {
    charge: { color: '#a86aff', color2: '#e0c8ff' },
    sfx: 'ax_g4_roar',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.6 });
      darken(c, 0.25);
      const ang = aimOf(c.from, c.center);
      add(c, 'g4Dragon', { x: c.from.x + Math.cos(ang) * 16, y: c.from.y + Math.sin(ang) * 16 - (c.fromAlly ? 14 : 0), ang, s: 16, color: '#a86aff', glow: '#e0c8ff', open: 1, openAt: 0, pop: 160, life: 760 });
      const o = { x: c.from.x, y: c.fromAlly ? c.from.y - 20 : c.from.y };
      for (let j = 0; j < 6; j++) k.shockwave(o.x, o.y, { r0: 8, r1: 230, color: j % 2 ? '#e0c8ff' : '#a86aff', w: 3.2, delay: j * 110, life: 560 });
      k.speedLines(o.x, o.y, { color: '#e0c8ff', n: 26, life: 600, r0: 30, r1: 200 });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#c8a8f0', colors: RYUMA.list, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 40 * c.sz, color: '#e0c8ff', n: 3, gap: 90, delay: d + c.hit + 60 });
        c.fx.arrows(t.x, t.y - 4, '#c8a8ff', false, 3, d + c.hit + 260);
        k.particles(t.x, t.y, { colors: RYUMA.list, n: per(c, 26), speed: 160, delay: d + c.hit, life: 520 });
        k.shapes(t.x, t.y, { shape: 'diamond', n: per(c, 8), colors: ['#e0c8ff', '#a86aff'], speed: 60, size: 1.8, delay: d + c.hit + 200, life: 600 });
      });
      k.flash('#e0c8ff', 120, c.hit);
      k.shake(640, 3.4, c.hit - 100);
    },
  },
  // 竜闘気の守り: 味方 1人ずつを 青白い 竜闘気の まく（六角の 光が 一しゅん）
  ax_ryutouki_mamori: {
    charge: { color: '#5ad0ff', color2: '#e8fbff' },
    sfx: 'ax_g4_guard',
    allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.4 });
      add(c, 'g4Crest', { x: c.W / 2, y: 30, s: 14, pop: 220, color: '#7ad8ff', life: c.len - 100 });
      c.each((t, i, d) => {
        k.dash(c.W / 2, 34, t.x, t.y - 10, { color: '#7ad8ff', travel: c.hit, w: 4, delay: d });
        add(c, 'g4Hex', { x: t.x, y: t.y - 10, r: 22, color: '#7ad8ff', delay: d + c.hit, life: c.len - c.hit - d - 40 });
        add(c, 'g4Bubble', { x: t.x, y: t.y - 10, r: 24, color: '#bfeaff', grow: 160, delay: d + c.hit, life: 640 });
        k.sparkles(t.x, t.y - 10, { n: 8, r: 20, colors: ['#ffffff', '#bfeaff'], delay: d + c.hit + 80, life: 360 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 36, sy: 0.4, color: '#bfeaff', delay: d + c.hit });
      });
      k.flash('#e8fbff', 100, c.hit);
      k.shake(500, 2.8, c.hit - 100);
    },
  },
  // 竜魔の大火炎: むらさきの 竜の あたま（光）から 青白い ほのおの 息が 敵ぜんぶを なめる → ほのおの かべ
  ax_ryuma_daikaen: {
    charge: { color: '#a86aff', color2: '#e0c8ff' },
    sfx: 'ax_g4_dragonfire',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.55 });
      darken(c, 0.2);
      const ang = aimOf(c.from, c.center);
      const hx = c.from.x + Math.cos(ang) * 30, hy = c.from.y + Math.sin(ang) * 30 - (c.fromAlly ? 14 : 0);
      add(c, 'g4Dragon', { x: hx, y: hy, ang, s: 23, color: '#a86aff', glow: '#e0c8ff', core: '#ffffff', eye: '#ffe0ff', pop: 220, openAt: 150, life: c.len - 240 });
      const mx = hx + Math.cos(ang) * 30, my = hy + Math.sin(ang) * 30;
      const BF = ['#3a6aff', '#9ac8ff', '#ffffff'];
      c.each((t, i, d) => {
        k.beam(mx, my, t.x, t.y, { w: 12 * c.sz, color: '#5a8aff', glow: '#c8d8ff', core: '#ffffff', delay: d + 200, life: 760, grow: c.hit - 200, widths: [0.5, 1, 1.25, 1.1, 0.7, 0], streaks: true, burst: false });
        k.flames(t.x, ground(c, t, 18), { w: 40 * c.sz, h: 40 * c.sz, cols: BF, n: 7, delay: d + c.hit, life: 760 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#9ac8ff', colors: BF, delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: BF, n: per(c, 28), speed: 180, delay: d + c.hit + 80, life: 520 });
      });
      const gy = Math.min(c.H - 4, c.center.y + 22);
      for (let j = 0; j < 5; j++) k.flames(lerpX(c, j, 5), gy, { w: 46, h: 36, cols: BF, n: 6, delay: c.hit + 200 + j * 60, life: 720, embers: j % 2 === 0 });
      k.flash('#c8d8ff', 120, c.hit);
      k.shake(600, 3.2, c.hit);
    },
  },
  // 竜魔の十字斬り: たての いなずまの 一閃 → よこの 一閃 → むらさきの 十字が 敵の 上に のこって 爆発
  ax_ryuma_juuji: {
    charge: { color: '#a86aff', color2: '#e0c8ff' },
    sfx: 'ax_g4_cross',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.6 });
      darken(c, 0.2);
      c.each((t, i, d) => {
        const s = 44 * c.sz;
        add(c, 'g4Cleave', { x0: t.x, y0: t.y - s, x1: t.x, y1: t.y + s, w: 4 * c.sz, zig: true, color: '#e8d8ff', glow: '#a86aff', zigGlow: '#c88aff', zigCol: '#f0e0ff', grow: 70, delay: d + c.hit - 70, life: 360 });
        add(c, 'g4Cleave', { x0: t.x - s, y0: t.y, x1: t.x + s, y1: t.y, w: 4 * c.sz, zig: true, color: '#e8d8ff', glow: '#a86aff', zigGlow: '#c88aff', zigCol: '#f0e0ff', grow: 70, delay: d + c.hit + 150, life: 360 });
        add(c, 'g4Cross', { x: t.x, y: t.y, s, w: 4.5 * c.sz, elec: true, color: '#c88aff', glow: '#a86aff', core: '#ffffff', h2: 220, boomAt: 520, delay: d + c.hit, life: 1050 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#c8a8f0', delay: d + c.hit, heavy: i === 0 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#c8a8f0', delay: d + c.hit + 220 });
        k.explosion(t.x, t.y, { r: 24 * c.sz, pal: RYUMA, delay: d + c.hit + 560, heavy: i === 0, smoke: '#3a2a5a' });
        k.pillar(t.x, t.y, { w: 10 * c.sz, color: '#e0c8ff', glow: '#a86aff', delay: d + c.hit + 560, life: 420 });
        k.particles(t.x, t.y, { colors: RYUMA.list, n: per(c, 24), speed: 210, delay: d + c.hit + 580, life: 520 });
      });
      k.flash('#f0e0ff', 150, c.hit + 560);
      k.shake(600, 3.4, c.hit + 540);
    },
  },
  // 竜闘気の大つばさ: せなかから 青白い 光の 大きな つばさが ひらき、ばさっと はばたいて 敵ぜんぶを 風で なぎはらう → 光の 羽が まう
  ax_ryutouki_tsubasa: {
    charge: { color: '#7ad8ff', color2: '#ffffff' },
    sfx: 'ax_g4_wing',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.5 });
      darken(c, 0.15);
      const o = { x: c.from.x, y: c.fromAlly ? c.from.y - 12 : c.from.y };
      add(c, 'g4Wings', { x: o.x, y: o.y, s: 86, open: 260, color: '#7ad8ff', core: '#e8fbff', flap: 0.35, flapAt: 260, flapMs: 90, life: c.len - 200 });
      k.shockwave(o.x, o.y, { r0: 20, r1: 200, color: '#bfeaff', w: 3, n: 2, gap: 120, delay: 300 });
      k.streaks({ ang: aimOf(c.from, c.center), color: '#e8fbff', n: 30, delay: 300, life: 560, alpha: 0.6, speed: 1.4 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) c.fx.gust(t.x - 30, t.y - 10 + j * 10, { len: 70, amp: 4, color: '#e8fbff', w: 1.2, dir: 1, delay: d + c.hit - 60 + j * 40, life: 380 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#bfeaff', colors: RYU.list, delay: d + c.hit, heavy: i === 0 });
        k.shapes(t.x, t.y, { shape: 'petal', n: per(c, 14), colors: ['#ffffff', '#bfeaff', '#7ad8ff'], speed: 110, g: 20, size: 2.6, spin: 5, delay: d + c.hit, life: 900 });
        k.particles(t.x, t.y, { colors: RYU.list, n: per(c, 24), speed: 200, delay: d + c.hit, life: 480 });
      });
      k.shapes(c.W / 2, -6, { shape: 'petal', n: 18, colors: ['#ffffff', '#bfeaff'], speed: 30, ang: Math.PI / 2, spread: 1.2, g: 30, size: 2.4, spin: 3, delay: c.hit + 200, life: 1000, r: 90 });
      k.flash('#e8fbff', 120, c.hit);
      k.shake(560, 3, c.hit);
    },
  },
  // 竜魔の大波動: 両手の 竜の あごの あいだに 白い 球（3つの 紋章）→ 画面の 半分の 太さの むらさきと 白の 波動 → 白フラッシュ・大爆発 → むらさきの つぶ
  ax_ryuma_daihadou: {
    charge: { color: '#a86aff', color2: '#ffffff', power: 1.1 },
    sfx: 'ax_g4_daihadou',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.6 });
      darken(c, 0.15);
      const h = c.fromAlly ? { x: c.from.x, y: c.H - 22 } : hands(c, 0);
      for (const [dx, dy, s] of [[-18, 6, 6], [18, 6, 6], [0, -18, 8]]) add(c, 'g4Crest', { x: h.x + dx, y: h.y + dy, s, pop: 140, color: '#c88aff', life: 520 });
      c.k.orb(h.x, h.y, { r: 13, color: '#ffffff', glow: '#e0c8ff', rim: '#a86aff', grow: 120, hold: 120, life: 300 });
      k.gather(h.x, h.y, { colors: ['#ffffff', '#e0c8ff', '#a86aff'], n: 18, r: 60, life: 220, waves: 1 });
      const ang0 = aimOf(h, c.center);
      add(c, 'g4Dragon', { x: h.x, y: h.y, ang: ang0, s: 12, color: '#a86aff', glow: '#e0c8ff', open: 1, openAt: 0, life: 300 });
      const st = 220, grow = c.hit - st;
      // 画面の 半分の 太さの 波動（まん中）＋ 的ごとの 波動
      const far = beyond(h, c.center, 220);
      k.beam(h.x, h.y, c.center.x, c.center.y, { w: 30, color: '#a86aff', glow: '#e0c8ff', core: '#ffffff', delay: st, life: 1100, grow, widths: [0.5, 1, 1.15, 1.1, 1, 0.7, 0], burst: false });
      k.beam(c.center.x, c.center.y, far.x, far.y, { w: 28, color: '#a86aff', glow: '#e0c8ff', core: '#ffffff', delay: st + grow - 10, life: 1100 - grow, grow: 140, widths: [0.9, 1.1, 1, 0.9, 0.6, 0], burst: false });
      add(c, 'g4Dragon', { x0: h.x, y0: h.y, x1: c.center.x, y1: c.center.y + (c.fromAlly ? 18 : -18), travel: grow, ease: 'out', ang: ang0, s: 22, color: '#c88aff', glow: '#e0c8ff', open: 1, openAt: grow - 40, delay: st, life: grow + 520 });
      c.each((t, i, d) => {
        if (c.all) k.beam(h.x, h.y, t.x, t.y, { w: 12 * c.sz, color: '#c88aff', glow: '#f0e0ff', core: '#ffffff', delay: st + d, life: 900, grow, widths: [0.4, 1, 1, 0.8, 0], burst: false, streaks: false });
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#e0c8ff', colors: RYUMA.list, delay: d + c.hit, heavy: i === 0 });
        k.explosion(t.x, t.y, { r: 28 * c.sz, pal: RYUMA, delay: d + c.hit + 420, heavy: i === 0, smoke: '#3a2a5a' });
        k.debris(t.x, ground(c, t, 20), { n: per(c, 10, 2), up: 180, colors: ['#6a5a8a', '#3a2a5a', '#c8a8f0'], delay: d + c.hit + 440 });
        k.shapes(t.x, t.y, { shape: 'diamond', n: per(c, 14), colors: ['#f0e0ff', '#a86aff', '#ffffff'], speed: 70, size: 1.8, g: -20, delay: d + c.hit + 700, life: 700 });
      });
      k.shockwave(c.center.x, c.center.y, { r0: 20, r1: 200, color: '#f0e0ff', w: 4, n: 3, gap: 120, delay: c.hit + 420 });
      k.flash('#ffffff', 220, c.hit + 400);
      k.shake(700, 3.8, c.hit + 380);
    },
  },
  // メドローア: 右手に ほのお・左手に こおり → 胸の 前で 1つに（白むらさき）→ 光の 弓を ひく → 光の 矢 → 敵を つつむ 白い 球 → しずかに 光の 粉に（爆発しない 消滅）
  ax_medroa: {
    charge: { color: '#c8a8ff', color2: '#ffffff' },
    sfx: 'ax_g4_medroa',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.45);
      const h = hands(c, 26);
      const mid = { x: h.x, y: h.y };
      // ほのお（赤）と こおり（青）が 1つに
      k.orb(h.x - 32, h.y + 6, { r: 8, color: '#ff5a2a', glow: '#ffa040', rim: '#fff2a0', grow: 50, start: 70, travel: 130, to: mid });
      k.orb(h.x + 32, h.y + 6, { r: 8, color: '#3aa8ff', glow: '#9ae6ff', rim: '#ffffff', grow: 50, start: 70, travel: 130, to: mid });
      k.flames(h.x - 32, h.y + 14, { w: 12, h: 14, n: 3, life: 200, embers: false });
      k.shapes(h.x + 32, h.y + 6, { shape: 'flake', n: 5, colors: ['#ffffff', '#9ae6ff'], speed: 20, size: 2.4, life: 220 });
      c.fx.glow(mid.x, mid.y, { color: '#e8d8ff', r: 24, delay: 200, life: 260, alpha: 1 });
      k.shockwave(mid.x, mid.y, { r0: 4, r1: 36, color: '#e8d8ff', delay: 200 });
      const ang = aimOf(mid, c.center);
      add(c, 'g4Bow', { x: mid.x, y: mid.y, ang, s: 19, draw: 120, shootAt: c.hit - 120 - 210, delay: 210, life: c.hit - 120 - 210 + 160 });
      c.each((t, i, d) => {
        const ta = aimOf(mid, t);
        add(c, 'g4Arrow', { x0: mid.x + Math.cos(ta) * 16, y0: mid.y + Math.sin(ta) * 16, x1: t.x, y1: t.y, travel: 120, tail: 70, delay: d + c.hit - 120, life: 260 });
        const r = 26 * c.sz;
        add(c, 'g4Void', { x: t.x, y: t.y, r, hold: 380, delay: d + c.hit, life: 760 });
        k.shockwave(t.x, t.y, { r0: r * 0.6, r1: r * 1.6, color: '#e8d8ff', w: 1.6, delay: d + c.hit, life: 300 });
        // しずかに きえて 光の 粉
        k.sparkles(t.x, t.y, { n: per(c, 18), r: r, colors: ['#ffffff', '#e8d8ff', '#c8a8ff'], size: 4, delay: d + c.hit + 560, gap: 18, life: 420 });
        k.shapes(t.x, t.y, { shape: 'twinkle', n: per(c, 26), colors: ['#ffffff', '#e8d8ff', '#c8a8ff'], speed: 26, g: -24, size: 1.8, spin: 2, delay: d + c.hit + 540, life: 640, r: r * 0.7, add: true });
        c.fx.glow(t.x, t.y, { color: '#ffffff', r: 12, delay: d + c.hit - 20, life: 120, alpha: 1 });
      });
      // 音が 消える ような しろい まく
      c.k.tint('#f0ecff', { a: 0.18, delay: c.hit, life: 520, fin: 80, fout: 200 });
      k.flash('#ffffff', 80, c.hit);
      k.shake(300, 2, c.hit + 540);
    },
  },
  // 五本指のメラゾーマ: 5本の 指先に 火の たま → 5つの 大きな 火の たまが 次々 → 5回の ほのおの 爆発
  ax_gohon_merazoma: {
    charge: { color: '#ff6a1a', color2: '#ffe0a0' },
    sfx: 'ax_g4_mera5',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.42, { color: '#1a0402' });
      const h = hands(c, 22);
      for (let j = 0; j < 5; j++) {
        const fa = -Math.PI / 2 + (j - 2) * 0.38 * (c.fromAlly ? 1 : -1);
        const fx0 = h.x + Math.cos(fa) * 14, fy0 = h.y + Math.sin(fa) * 14 * (c.fromAlly ? 1 : -1);
        const t = c.targets[j % c.n];
        const d = j * 60;
        k.orb(fx0, fy0, { r: 9 * c.sz, color: '#ff5a10', glow: '#ffa040', rim: '#fff2a0', arms: 3, grow: 120, start: 140 + d, travel: c.hit - 140, to: { x: t.x + rnd(-6, 6), y: t.y + rnd(-6, 6) }, hop: c.fromAlly ? 12 : -8 });
        c.fx.sparks(fx0, fy0, { colors: FIRE.list, n: 4, speed: 40, g: -60, delay: 20, life: 260 });
        k.explosion(t.x + rnd(-8, 8), t.y + rnd(-6, 6), { r: (c.n > 1 ? 16 : 20) * c.sz, pal: FIRE, delay: c.hit + d, heavy: j === 0 });
        k.flames(t.x, ground(c, t, 16), { w: 26, h: 24, n: 4, delay: c.hit + d + 40, life: 520, embers: j % 2 === 0 });
      }
      c.each((t, i, d) => k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffa040', colors: FIRE.list, delay: c.hit + i * 60, heavy: false }));
      k.shake(420, 2.4, c.hit);
    },
  },
  // 今のはメラだ: 小さな 火が 巨大な 不死鳥の かたちの ほのおに なって 敵へ → 大爆発
  ax_ima_no_wa_mera: {
    charge: { color: '#ff6a1a', color2: '#ffe0a0' },
    sfx: 'ax_g4_phoenix',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'space', { a: 0.6 });
      c.k.tint('#3a0800', { a: 0.35, life: c.len, fin: 80, fout: 300 });
      const h = hands(c, 22);
      k.orb(h.x, h.y, { r: 3, color: '#ff5a10', glow: '#ffa040', rim: '#fff2a0', grow: 80, hold: 60, life: 180 });
      c.fx.glow(h.x, h.y, { color: '#ffa040', r: 30, delay: 140, life: 200, alpha: 1 });
      add(c, 'g4Loto', { x0: h.x, y0: h.y - 10, x1: c.center.x, y1: c.center.y, travel: c.hit - 160, start: 0, ease: 'in', s: 30 * (c.all ? 1.1 : 1), pop: 200, flap: 0.3, color: '#ff6a1a', core: '#ffe08a', glow: '#ff9a2a', delay: 160, life: c.hit - 160 + 200 });
      k.flames(h.x, h.y + 6, { w: 18, h: 20, n: 4, delay: 140, life: 300 });
      for (let j = 0; j < 6; j++) { const u = j / 6; c.fx.sparks(h.x + (c.center.x - h.x) * u, h.y + (c.center.y - h.y) * u, { colors: ['#ff6a1a', '#ffc060', '#fff2a0'], n: 6, speed: 60, g: -40, delay: 160 + (c.hit - 160) * u, life: 360 }); }
      c.each((t, i, d) => {
        k.explosion(t.x, t.y, { r: 30 * c.sz, pal: FIRE, delay: d + c.hit, heavy: i === 0 });
        k.flames(t.x, ground(c, t, 18), { w: 44 * c.sz, h: 40 * c.sz, n: 7, delay: d + c.hit + 60, life: 800 });
        k.debris(t.x, ground(c, t, 16), { n: per(c, 10), colors: ['#5a3020', '#2a1a10', '#ff8a3a'], up: 160, delay: d + c.hit + 60 });
      });
      k.shockwave(c.center.x, c.center.y, { r0: 10, r1: 170, color: '#ffc060', w: 4, n: 3, gap: 110, delay: c.hit });
      k.shapes(c.center.x, c.center.y, { shape: 'petal', n: 20, colors: ['#ff6a1a', '#ffc060', '#fff2a0'], speed: 90, g: -30, size: 2.4, delay: c.hit + 300, life: 800 });
      k.flash('#fff2a0', 220, c.hit);
      k.shake(680, 3.6, c.hit);
    },
  },
};

// 敵の ならびの x（左から j ばんめ）
function lerpX(c, j, n = 4) {
  const xs = c.targets.map((t) => t.x);
  const lo = Math.min(...xs) - 30, hi = Math.max(...xs) + 30;
  return lo + (hi - lo) * (j / Math.max(1, n - 1));
}
void obj;
