// 第51回 C1（o7）: 日の火影の 技の え（影分身・ヒノカミ神楽の 炎の 太刀・日輪らせん丸・きつね・炎の 結界）
// ・影分身は オレンジの 服に 黄色い かみの 忍び（o7Obj の ninja）。ボンと けむりで 出て、それぞれ 炎の 刀で まう
// ・看板の 技は 夜の 空 → 分身たちが 敵を かこんで 炎の 輪を えがく → さいごに 夜明けの 光
import { obj, fly, text, bg, hands, ground, above, per, partyTop, hitFx, allyGlow, upArrow } from './axfx-o7-kit.js?v=847e4bcd6ab2';
import { rnd } from './axkit.js?v=847e4bcd6ab2';

const FIRE = ['#ffffff', '#ffd23a', '#ff7a1a', '#c8302a'];
const SUN = '#ff8a1a';
const RED = '#ff5a5a', BLUE = '#5a9aff', GREEN = '#3ad860';

const userPt = (c) => (c.fromAlly ? { x: c.from.x, y: c.H - 24 } : { x: c.from.x, y: c.from.y });
// ボンッ（分身の けむり）
function poof(c, x, y, d) {
  for (let j = 0; j < 4; j++) c.fx.puff(x + rnd(-6, 6), y + rnd(-4, 4), { color: '#ffffff', r0: 4, r1: 13, vx: rnd(-20, 20), vy: rnd(-24, -6), life: 460, alpha: 0.75, delay: d + j * 20 });
}
// 分身が 1人 あらわれて（x,y）、ゆれながら まつ
function clone(c, x, y, d, life, o = {}) {
  poof(c, x, y, d);
  obj(c, 'ninja', { keys: [[0, x, y + 4, 0.5], [140, x, y, 1]], s: o.s || 9, pose: o.pose ?? -0.6, fire: o.fire ?? true, swing: !!o.swing, flip: !!o.flip, delay: d, life, fout: 160, glow: o.fire === false ? null : '#ff8a2a', glowR: 1.2 });
}
// 炎の 太刀の 輪（ヒノカミ神楽の 円い 太刀すじ）
function fireArc(c, t, d, r = 22, a0 = -2.6, span = 4.4) {
  c.k.crescent(t.x, t.y, { r: r * c.sz, a0, a1: a0 + span, w: 7, color: '#ffb04a', glow: '#ff5a1a', core: '#fff6c8', delay: d, swing: 200, life: 420, after: 3 });
}

export const AX_O7_HOKAGE = {
  // 影分身・日の型: ボン ボン ボン ボン → 4人の 分身が 炎の 刀を かまえる → 赤と 緑の 矢印
  ox_sk_bunshin: {
    charge: { color: SUN, color2: '#ffe08a' },
    sfx: 'ax_o7_bunshin',
    play(fx, c) {
      const { k } = c;
      const base = c.t;
      const spots = [-58, -30, 30, 58];
      spots.forEach((dx, j) => {
        const x = Math.max(14, Math.min(c.W - 14, base.x + dx)), y = base.y - 12 - Math.abs(dx) * 0.15;
        clone(c, x, y, 60 + j * 90, c.len - 100 - j * 90, { flip: dx < 0, pose: dx < 0 ? 0.6 : -0.6 });
        text(c, x, y - 22, 'ボン', { size: 9, fill: '#ffffff', edge: '#6a3a0a', delay: 60 + j * 90, life: 300, pop: false });
      });
      c.each((t, i) => {
        const d = c.hit + i * 60;
        allyGlow(c, t, d, SUN, { drops: 4 });
        upArrow(c, t.x - 8, t.y - 22, d + 40, RED);
        upArrow(c, t.x + 8, t.y - 22, d + 100, GREEN);
        k.flames(t.x, t.y + 10, { w: 18, h: 16, delay: d - 60, life: 520, embers: false });
      });
      text(c, base.x, above(c, base, 48), 'ボボボボン！', { size: 11, fill: '#ffffff', edge: '#6a3a0a', delay: 380, life: 520 });
    },
  },
  // 分身火車: 本体と 分身2人が 前回りで とびかかり、たての 炎の 輪で 切る → ゴォッ
  ox_sk_kasha: {
    charge: { color: SUN, color2: '#ffe08a' },
    sfx: 'ax_o7_kasha',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        const at = c.hit + d;
        for (let j = 0; j < (c.all ? 1 : 3); j++) {
          const sx = h.x + (j - 1) * 30, sy = h.y;
          obj(c, 'ninja', { keys: [[0, sx, sy, 0.8, 0], [c.hit - 60, t.x + (j - 1) * 12, t.y - 30, 1, Math.PI * 2], [c.hit + 120, t.x + (j - 1) * 12, t.y - 6, 1, Math.PI * 2.2]], s: 8, fire: true, ease: 'io', delay: d + j * 60, life: c.hit + 300, fout: 140, glow: SUN });
          fireArc(c, { x: t.x + (j - 1) * 10, y: t.y }, at - 120 + j * 70, 20, -Math.PI / 2 - 0.2, Math.PI * 1.8);
        }
        k.flames(t.x, t.y + 12, { w: 24, h: 24, delay: at, life: 560 });
        hitFx(c, t, i, at, { glow: SUN, colors: FIRE, n: 14, ring: 34 });
        text(c, t.x, above(c, t, 34), 'ゴォッ', { size: 12, fill: '#fff6c8', edge: '#8a1a0a', delay: at, life: 460 });
      });
      k.shake(420, 1.8, c.hit);
    },
  },
  // 日輪らせん丸: 手の 中に 小さな 太陽の らせん丸 → とんで ぶつかる → 炎の うず と 大爆発
  ox_sk_rasen: {
    charge: { color: SUN, color2: '#ffffff' },
    sfx: 'ax_o7_rasen',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const t = c.t;
      const shuri = !!c.vars.shuriken;
      k.orb(h.x, h.y - 10, { r: shuri ? 11 : 10, color: '#ff7a1a', glow: '#ffd23a', rim: '#fff6c8', arms: shuri ? 6 : 4, spin: 2, grow: 220, to: t, start: 260, travel: c.hit - 260 });
      if (shuri) k.shockwave(h.x, h.y - 10, { r0: 6, r1: 26, color: '#fff6c8', w: 3, delay: 220, life: 260, n: 2 });
      clone(c, h.x + (c.fromAlly ? 30 : -30), h.y - 4, 0, c.hit, { fire: false, flip: true, pose: 1 });
      c.each((tt, i, d) => {
        const at = c.hit + d;
        if (i > 0) k.orb(t.x, t.y, { r: 7, color: '#ff7a1a', glow: '#ffd23a', arms: 3, grow: 60, to: tt, start: 60, travel: Math.max(60, d), delay: c.hit });
        k.explosion(tt.x, tt.y, { r: 22 * c.sz, element: 'fire', delay: at + (i ? 60 : 0), heavy: i === 0 });
        for (let j = 0; j < 3; j++) k.crescent(tt.x, tt.y, { r: (14 + j * 7) * c.sz, a0: j * 2, a1: j * 2 + 5, w: 4, color: '#ffd23a', glow: '#ff7a1a', delay: at + j * 40, swing: 260, life: 400 });
        hitFx(c, tt, i, at, { glow: SUN, colors: FIRE, n: 10 });
      });
      text(c, t.x, above(c, t, 40), shuri ? 'ギュイイイン' : 'ギュイイン', { size: 12, burst: '#ffd23a', fill: '#8a1a0a', stroke: false, delay: c.hit, life: 560 });
      k.shake(480, 2, c.hit);
    },
  },
  // 分身・飛輪陽炎: 分身たちが ゆらめく 陽炎の 太刀で 敵の あいだを かけぬける → ヒュンヒュン
  ox_sk_hirin: {
    charge: { color: SUN, color2: '#ffe08a' },
    sfx: 'ax_o7_hirin',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const n = 6;
      for (let i = 0; i < n; i++) {
        const t = c.targets[i % c.n];
        const d = c.hit + i * 80;
        const side = i % 2 ? 1 : -1;
        k.dash(t.x - side * 60, t.y + rnd(-10, 6), t.x + side * 30, t.y, { color: '#ffb04a', travel: 110, w: 5, h: 18, n: 3, delay: d - 110 });
        fireArc(c, t, d - 60, 18 + (i % 3) * 4, side > 0 ? -2.8 : -0.6, side > 0 ? 3.6 : -3.6);
        hitFx(c, t, Math.min(i, 2), d, { glow: SUN, colors: FIRE, n: 6, r: 12 });
        // ゆらめく 陽炎
        fx.puff(t.x + rnd(-14, 14), t.y + 6, { color: '#ffb04a', r0: 4, r1: 14, vy: -26, life: 420, alpha: 0.35, delay: d });
      }
      c.each((t, i, d) => { if (i < 3) obj(c, 'ninja', { keys: [[0, t.x - 30, t.y - 20, 0.4], [180, t.x - 24, t.y - 18, 0.9]], s: 7, pose: 0.9, fire: true, swing: true, delay: c.hit - 220 + d, life: 700, fout: 160, alpha: 0.85 }); });
      text(c, c.center.x, above(c, c.center, 44), 'ヒュンヒュン', { size: 11, fill: '#fff6c8', edge: '#8a1a0a', delay: c.hit, life: 560 });
      k.shake(500, 1.4, c.hit);
    },
  },
  // 日と火の意志: 仲間の うしろで 炎が もえあがる → 太陽の 光 → 赤い 矢印
  ox_sk_ishi: {
    charge: { color: SUN, color2: '#ffffff' },
    sfx: 'ax_o7_ishi',
    play(fx, c) {
      const { k } = c;
      const top = partyTop(c, 56);
      obj(c, 'sun', { keys: [[0, top.x, top.y + 20, 0.4], [320, top.x, top.y, 1]], s: 13, life: c.len - 120, fout: 220, glow: '#ffd23a' });
      c.each((t, i) => {
        const d = c.hit - 200 + i * 60;
        k.flames(t.x, t.y + 6, { w: 22, h: 30, delay: d, life: 620 });
        allyGlow(c, t, d + 200, SUN, { drops: 3 });
        upArrow(c, t.x, t.y - 26, d + 260, RED);
      });
      text(c, top.x, top.y + 26, 'ゴオオッ', { size: 10, fill: '#fff6c8', edge: '#8a1a0a', delay: c.hit, life: 460 });
    },
  },
  // 太陽のびじゅう玉: 大きな きつねが あらわれ、口の 前に 赤い 太陽の 玉 → とんで 大爆炎
  ox_sk_bijuu: {
    charge: { color: '#ff3a1a', color2: '#ffd23a' },
    sfx: 'ax_o7_bijuu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const fy = c.fromAlly ? c.H - 46 : 30;
      const fox = { x: c.fromAlly ? 46 : c.W - 46, y: fy };
      obj(c, 'fox', { keys: [[0, fox.x, fox.y + 20, 0.4], [300, fox.x, fox.y, 1.1], [c.hit, fox.x, fox.y - 4, 1.15]], s: 18, life: c.hit + 260, fout: 220, glow: '#ff7a1a', glowR: 1.5 });
      bg(c, 'fire', { delay: c.hit - 200, life: 600 });
      const mouth = { x: fox.x + (c.fromAlly ? 20 : -20), y: fox.y + (c.fromAlly ? -14 : 14) };
      k.orb(mouth.x, mouth.y, { r: 13, color: '#c8201a', glow: '#ff7a1a', rim: '#ffd23a', arms: 5, spin: 1.5, grow: 360, to: c.center, start: 420, travel: c.hit - 420 });
      k.gather(mouth.x, mouth.y, { colors: ['#ffd23a', '#ff7a1a'], n: 12, r: 36, waves: 2, gap: 150 });
      c.each((t, i, d) => {
        const at = c.hit + d;
        k.explosion(t.x, t.y, { r: 26 * c.sz, element: 'fire', delay: at, heavy: i === 0 });
        k.flames(t.x, t.y + 12, { w: 26, h: 28, delay: at + 60, life: 600 });
        hitFx(c, t, i, at, { glow: SUN, colors: FIRE, n: 8 });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 48), 'ドゴォォン', { size: 14, burst: '#ffd23a', fill: '#8a1a0a', stroke: false, delay: c.hit, life: 640 });
      k.shake(700, 2.6, c.hit);
      k.flash('#ffd8a0', 120, c.hit);
    },
  },
  // 火影の炎の結界: 仲間を つつむ 炎の ドーム（あたたかい オレンジ）→ 青い 矢印・緑の いやし
  ox_sk_kekkai: {
    charge: { color: SUN, color2: '#ffffff' },
    sfx: 'ax_o7_kekkai',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        const d = 120 + i * 60;
        k.glyph(t.x, t.y + 10, { r: 22, color: SUN, color2: '#fff6c8', variant: 'magic', delay: d, life: c.len - 300, sy: 0.4 });
        k.crescent(t.x, t.y - 2, { r: 24, a0: Math.PI, a1: Math.PI * 2, w: 4, color: '#ffb04a', glow: '#ff7a1a', delay: d + 80, swing: 300, life: c.len - 400, after: 0, sy: 1.1 });
        allyGlow(c, t, c.hit + i * 60, '#7dffb0', { drops: 3 });
        upArrow(c, t.x + 12, t.y - 24, c.hit + 80 + i * 60, BLUE);
        k.flames(t.x - 18, t.y + 12, { w: 10, h: 14, delay: d + 100, life: 520, embers: false });
        k.flames(t.x + 18, t.y + 12, { w: 10, h: 14, delay: d + 140, life: 520, embers: false });
      });
      text(c, c.center.x, Math.max(14, c.center.y - 46), 'ポウッ', { size: 11, fill: '#fff6c8', edge: '#8a3a0a', delay: c.hit, life: 460 });
    },
  },
  // 影分身・ヒノカミ神楽: 夜の 空 → 分身たちが 敵を かこむ → みんなで 炎の 輪を えがいて まう → 夜明けの 光
  ox_sk_sig: {
    charge: { color: SUN, color2: '#ffe08a' },
    sfx: 'ax_o7_kagura',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { delay: 0, life: c.hit + 200, a: 0.3 });
      const cx = c.center.x, cy = c.center.y;
      const ring = [-70, -40, 40, 70, 0];
      const spots = ring.map((dx) => ({ x: Math.max(14, Math.min(c.W - 14, cx + dx)), y: dx === 0 ? Math.max(18, cy - 40) : cy - 14 + Math.abs(dx) * 0.1 }));
      spots.forEach((p, j) => clone(c, p.x, p.y, 60 + j * 70, c.len - 200 - j * 40, { swing: true, flip: ring[j] < 0, s: 11 }));
      text(c, cx, Math.max(14, cy - 56), 'シャラン♪', { size: 10, fill: '#fff6c8', edge: '#8a1a0a', delay: 140, life: 520 });
      // みんなで まう: 1体ずつ 炎の 輪
      const hits = c.all ? 10 : 9;
      for (let i = 0; i < hits; i++) {
        const t = c.targets[i % c.n];
        const d = c.hit + i * 75;
        const p = spots[i % spots.length];
        k.dash(p.x, p.y, t.x, t.y, { color: '#ffb04a', travel: 90, w: 4, h: 14, n: 2, delay: d - 100 });
        fireArc(c, t, d - 90, 18 + (i % 3) * 5, -2.6 + i * 0.9, 4.2);
        hitFx(c, t, Math.min(i, 2), d, { glow: SUN, colors: FIRE, n: 5, r: 12 });
      }
      c.each((t, i, d) => k.flames(t.x, t.y + 12, { w: 22, h: 26, delay: c.hit + 300 + d, life: 600, embers: i === 0 }));
      // 夜明け
      bg(c, 'dawn', { delay: c.hit + 600, life: 520, sy: 20 });
      text(c, cx, Math.max(14, cy - 40), 'ゴォォォ', { size: 13, burst: '#ffd23a', fill: '#8a1a0a', stroke: false, delay: c.hit + 300, life: 600 });
      k.shake(800, 1.8, c.hit);
    },
  },
};
