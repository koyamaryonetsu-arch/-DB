// 第51回 C1（o7）: 伝説の超勇者の 技の え（金色の 気・勇者の 剣・雷・かめはめデイン）
// ・気（ki）の ためは ドラゴンボールの g1 だけ。ここでは はなつ ところの 中で 金色の オーラ（k.aura の flame）を かく
// ・かめはめデイン: 手の あいだに 青い 気の たま（バチバチ）→ 雷を まとった 青白い ビーム → 空から 雷も おちる
import { obj, fly, text, bg, hands, ground, above, per, partyTop, hitFx, allyGlow, upArrow, zap } from './axfx-o7-kit.js?v=a9ce9cd0de1b';
import { rnd } from './axkit.js?v=a9ce9cd0de1b';

const GOLD = ['#ffffff', '#ffe45a', '#ffb02a'];
const BOLT = ['#ffffff', '#fff27a', '#7ad8ff'];
const KI = '#ffd23a';
const RED = '#ff5a5a', BLUE = '#5a9aff', GREEN = '#3ad860';

const userPt = (c) => (c.fromAlly ? { x: c.from.x, y: c.H - 24 } : { x: c.from.x, y: c.from.y });
// 金色の 気の オーラ（からだが すけて 見える うすさ）
function kiAura(c, p, d, life, k = 1.2) {
  c.k.aura(p.x, p.y, { style: 'flame', color: KI, color2: '#fff6b0', r: 18, h: 36, k, life, delay: d, alpha: 0.75 });
  c.fx.sparks(p.x, p.y + 6, { colors: ['#fff6b0', KI], n: 10, speed: 70, ang: -Math.PI / 2, spread: 0.6, g: -80, delay: d + 60, life: 520, len: 6 });
}
// 雷の しるし（パチパチ）
function crackle(c, p, d, n = 3, r = 18) {
  for (let j = 0; j < n; j++) {
    const a = rnd(0, Math.PI * 2);
    zap(c, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, p.x + Math.cos(a + 1.4) * r * 0.5, p.y + Math.sin(a + 1.4) * r * 0.5, d + j * 70, { w: 1.4, amp: 5, forks: 0, life: 160, color: '#e8f8ff', glow: '#7ad8ff' });
  }
}

export const AX_O7_HERO = {
  // 超勇者の雷剣: 空から 剣に 雷 → 金と 雷の 三日月で 切る → ズバッ
  ox_sh_ken: {
    charge: { color: '#fff27a', color2: '#ffffff' },
    sfx: 'ax_o7_raiken',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const hira = !!c.vars.hira;
      obj(c, 'sword', { keys: [[0, h.x, h.y - 10, 0.6, -0.4], [180, h.x, h.y - 22, 1.2, -0.2]], s: 11, life: c.hit + 120, fout: 120, glow: KI, glowR: 1.6 });
      zap(c, h.x, -6, h.x, h.y - 30, 40, { w: 3, amp: 8 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        k.slash(t.x, t.y, { r: 30 * c.sz, ang: -0.8, w: 8, color: '#fff6b0', glow: KI, core: '#ffffff', delay: at - 90 });
        if (hira) k.slash(t.x, t.y, { r: 28 * c.sz, ang: 0.8, flip: true, w: 7, color: '#e8f8ff', glow: '#7ad8ff', delay: at + 60 });
        zap(c, t.x - 10, -6, t.x, t.y, at - 20, { w: 2.6 });
        hitFx(c, t, i, at, { glow: KI, colors: BOLT, n: 14, ring: 38 });
        text(c, t.x + 6, above(c, t, 34), hira ? 'ズババッ' : 'ズバッ', { size: 13, fill: '#ffffff', edge: '#8a6a0a', delay: at, life: 460 });
      });
      k.shake(360, 1.8, c.hit);
      k.flash('#fff6c8', 80, c.hit);
    },
  },
  // 気をためる: 金色の オーラが もえあがる・小石が うく・パチパチ → 赤い 矢印
  ox_sh_ki: {
    charge: { color: KI, color2: '#ffffff' },
    sfx: 'ax_o7_kiup',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        kiAura(c, t, 0, c.len - 80, 1.4);
        k.shockwave(t.x, t.y + 8, { r0: 6, r1: 40, sy: 0.35, color: KI, w: 2, delay: 80, n: 3, gap: 160, life: 420 });
        crackle(c, { x: t.x, y: t.y - 10 }, 200 + i * 30, 4, 20);
        k.debris(t.x, t.y + 14, { n: 4, up: 60, g: -20, delay: 120, colors: ['#c8b8a0', '#a08060'] });
        upArrow(c, t.x + 18, t.y - 20, c.hit, RED);
        k.gather(t.x, t.y - 6, { colors: ['#fff6b0', KI], n: 10, r: 36, waves: 2, gap: 160 });
      });
      text(c, c.t.x, above(c, c.t, 46), 'はあああ…！', { size: 11, fill: '#fff27a', edge: '#6a4a0a', delay: 60, life: c.len - 300, wob: 0.06 });
      k.shake(c.len - 400, 0.6, 100);
    },
  },
  // ギガスラッシュ・超: 剣を 回すと 雷の 輪が 画面を よこぎる → 空から 雷
  ox_sh_gigaslash: {
    charge: { color: '#fff27a', color2: '#ffffff' },
    sfx: 'ax_o7_gigaslash',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      obj(c, 'sword', { keys: [[0, h.x, h.y - 18, 1.1, 0], [c.hit, h.x, h.y - 18, 1.1, Math.PI * 4]], s: 11, life: c.hit + 80, glow: KI });
      const cx = c.center.x, cy = c.center.y;
      k.crescent(cx, cy, { r: 70, a0: Math.PI * 0.9, a1: Math.PI * 2.1, w: 10, color: '#fff6b0', glow: KI, delay: c.hit - 200, swing: 260, life: 520, sy: 0.45 });
      k.crescent(cx, cy, { r: 58, a0: Math.PI * 2.1, a1: Math.PI * 0.9, w: 7, color: '#e8f8ff', glow: '#7ad8ff', delay: c.hit - 120, swing: 260, life: 480, sy: 0.45 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        k.boltRain(t.x, t.y, { n: 2, delay: at - 40, w: 2.6 });
        hitFx(c, t, i, at, { glow: KI, colors: BOLT, n: 12, ring: 36 });
      });
      text(c, cx, Math.max(14, cy - 44), 'ギガスラッシュ', { size: 11, burst: '#fff27a', fill: '#3a2a0a', stroke: false, delay: c.hit, life: 560 });
      k.streaks({ ang: 0, color: '#fff6b0', n: 18, delay: c.hit - 100, life: 360 });
      k.shake(440, 2, c.hit);
    },
  },
  // 勇者の金色のオーラ: 勇者の しるし（金の わ）が 仲間を つつむ → 金の オーラと 赤・青・緑の 矢印
  ox_sh_aura: {
    charge: { color: KI, color2: '#ffffff' },
    sfx: 'ax_o7_aura',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 50);
      k.glyph(top.x, top.y + 20, { r: 30, color: KI, color2: '#ffffff', variant: 'holy', life: c.len - 200, sy: 0.4 });
      obj(c, 'crown', { keys: [[0, top.x, top.y + 10, 0.4], [300, top.x, top.y - 4, 1.1]], s: 8, life: c.len - 200, fout: 220, glow: KI });
      c.each((t, i) => {
        const d = c.hit + i * 60;
        kiAura(c, t, d - 120, 700, 1);
        allyGlow(c, t, d, KI, { drops: 3 });
        upArrow(c, t.x - 12, t.y - 22, d + 40, RED);
        upArrow(c, t.x, t.y - 26, d + 100, BLUE);
        upArrow(c, t.x + 12, t.y - 22, d + 160, GREEN);
      });
      k.sparkles(top.x, top.y, { n: 8, r: 40, colors: GOLD, delay: 200 });
    },
  },
  // 超勇者のいのり: 空から 金の 光の はしらが 仲間に おりる → 緑の いやし
  ox_sh_inori: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o7_inori',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 60);
      k.shapes(top.x, top.y, { shape: 'twinkle', n: 10, colors: GOLD, speed: 30, size: 3, life: 900 });
      c.each((t, i) => {
        const d = c.hit - 160 + i * 70;
        k.pillar(t.x, t.y, { w: 16, color: '#fff6c8', glow: KI, delay: d, life: 600 });
        allyGlow(c, t, d + 160, '#7dffb0', { drops: 5, ring: 30 });
        k.shapes(t.x, t.y - 10, { shape: 'heart', n: 2, colors: ['#7dffb0', '#ffffff'], speed: 30, g: -20, size: 2.6, delay: d + 260, life: 600 });
      });
      text(c, top.x, top.y, 'キラキラ', { size: 10, fill: '#fff6c8', edge: '#8a6a0a', delay: c.hit, life: 500 });
    },
  },
  // ギガデイン・極: 空が くらい 雲 → 何本もの 太い 雷が 敵全体に → ピシャーン
  ox_sh_gigadein: {
    charge: { color: '#c8e8ff', color2: '#ffffff' },
    sfx: 'ax_o7_gigadein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { delay: 0, life: c.hit + 300, a: 0.3 });
      for (let j = 0; j < 5; j++) fx.puff(30 + j * 50, c.fromAlly ? 8 : c.H - 8, { color: '#3a3a5a', r0: 10, r1: 26, vx: rnd(-8, 8), life: c.hit + 400, alpha: 0.75, delay: j * 40 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        k.pillar(t.x, t.y, { w: 12, color: '#e8f8ff', glow: '#7ad8ff', delay: at - 70, life: 420 });
        k.boltRain(t.x, t.y, { n: per(c, 3), delay: at - 60, w: 3, spread: 14 });
        hitFx(c, t, i, at, { glow: '#7ad8ff', colors: BOLT, n: 14, ring: 40 });
        crackle(c, t, at + 80, 2, 16);
      });
      text(c, c.center.x, Math.max(14, c.center.y - 46), 'ピシャーン', { size: 14, burst: '#fff27a', fill: '#1a2a6a', stroke: false, delay: c.hit, life: 620 });
      k.flash('#ffffff', 120, c.hit);
      k.shake(560, 2.2, c.hit);
    },
  },
  // 雷の超連げき: しゅん間移動の ひかり（シュン）→ 雷の こぶし 7回 → バシバシ
  ox_sh_rengeki: {
    charge: { color: '#fff27a', color2: '#ffffff' },
    sfx: 'ax_o7_rengeki',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const t = c.targets[i % c.n];
        const d = c.hit + i * 70;
        const side = i % 2 ? 1 : -1;
        const p = { x: t.x + side * 22, y: t.y + rnd(-10, 6) };
        fx.glow(p.x, p.y, { color: KI, r: 12, delay: d - 70, life: 160, alpha: 1 });
        k.dash(p.x + side * 30, p.y, p.x, p.y, { color: '#fff6b0', travel: 70, w: 4, h: 16, n: 3, delay: d - 70 });
        fly(c, 'fist', p.x, p.y, t.x, t.y, { travel: 60, delay: d - 60, s: 5, rot0: side > 0 ? Math.PI : 0, glow: KI, stay: 40, col: '#ffe8c8' });
        hitFx(c, t, Math.min(i, 2), d, { glow: KI, colors: BOLT, n: 5, r: 11 });
        if (i % 2 === 0) zap(c, t.x, t.y - 26, t.x + rnd(-6, 6), t.y + 4, d, { w: 1.8, forks: 1 });
      }
      text(c, c.t.x - 30, above(c, c.t, 30), 'シュン', { size: 9, fill: '#fff6b0', edge: '#6a4a0a', delay: c.hit - 80, life: 360, pop: false });
      text(c, c.center.x, above(c, c.center, 44), 'バシバシバシ', { size: 12, burst: '#fff27a', fill: '#ffffff', edge: '#6a4a0a', delay: c.hit + 120, life: 600 });
      k.shake(600, 1.4, c.hit);
    },
  },
  // かめはめデイン: 金色の 気 → 手の あいだに 青い 気の たま（バチバチ）→ 雷を まとった 青白い ビーム → 空からも 雷 → デイーン！
  ox_sh_sig: {
    minParts: 260,
    charge: { color: KI, color2: '#ffffff' },
    sfx: 'ax_o7_kamedein',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const u = userPt(c);
      const h = { x: u.x + (c.fromAlly ? 0 : 0), y: c.fromAlly ? u.y - 16 : u.y + 12 };
      const fire = c.hit - 380;
      // 気を ためる（ki の かわりに え の 中で）
      kiAura(c, u, 0, fire + 200, 1.6);
      k.orb(h.x, h.y, { r: 9, color: '#4ab8ff', glow: '#a8e4ff', rim: '#ffffff', arms: 5, grow: fire, hold: 60, life: fire + 120 });
      k.gather(h.x, h.y, { colors: ['#a8e4ff', '#ffffff', KI], n: 12, r: 40, waves: 3, gap: 160 });
      crackle(c, h, 120, 4, 16);
      text(c, h.x + (c.fromAlly ? 40 : 0), h.y - 26, 'かめはめ…', { size: 10, fill: '#ffffff', edge: '#1a4a8a', delay: 40, life: fire, pop: false });
      // ビーム（雷を まとう）
      c.each((t, i, d) => {
        const at = c.hit + d;
        k.beam(h.x, h.y, t.x, t.y, { w: 12 * c.sz, color: '#7ad8ff', glow: '#c8f0ff', core: '#ffffff', delay: fire + d, grow: 380, life: 900, widths: [0.4, 1, 1.1, 1, 0.5, 0] });
        for (let j = 0; j < 3; j++) zap(c, h.x, h.y, t.x, t.y, fire + d + 120 + j * 110, { w: 2, amp: 14, forks: 1, color: '#fff27a', glow: KI, grow: 240 });
        k.pillar(t.x, t.y, { w: 10, color: '#fff6b0', glow: KI, delay: at - 30, life: 380 });
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { glow: '#7ad8ff', core: '#ffffff', list: BOLT }, delay: at, heavy: i === 0 });
        hitFx(c, t, i, at, { glow: '#7ad8ff', colors: BOLT, n: 8 });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 46), 'デイーン！', { size: 15, burst: '#fff27a', fill: '#1a3a8a', stroke: false, delay: c.hit, life: 700 });
      k.speedLines(c.t.x, c.t.y, { color: '#c8f0ff', n: 20, delay: fire, life: 420 });
      k.flash('#e8f8ff', 140, c.hit);
      k.shake(700, 2.6, c.hit);
    },
  },
};
