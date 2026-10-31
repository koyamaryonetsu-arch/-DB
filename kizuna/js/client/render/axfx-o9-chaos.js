// 第51回 C3（o9）: はかいと創造の神 の え（8技）。c の 時間は はなつ しゅんかんが 0
// ・はかい … 白い 光・消しゴムで まっ白に けす（o9Erase）・むらさきと 黒の つぶ
// ・創造   … 青い 点線の 設計図から 色が つく 装備（o9Gear）・金の 火花・生まれる 星（o9Galaxy）
import { txt, line, bg, boom, blessing, arrows, N, org } from './axfx-o4-kit.js?v=7040d8c7ec18';
import { sky, galaxy, erase, gear, party, O9_GEARS } from './axfx-o9-kit.js?v=7040d8c7ec18';

const VOID = ['#ffffff', '#e8d8ff', '#b48aff', '#5a2a8a'];
const MAKE = ['#ffffff', '#fff6b0', '#ffd23a', '#5ac8ff'];
const GREEN = ['#ffffff', '#c8ffe0', '#7dffb0'];
const top = (c, t, dy = 40) => Math.max(12, t.y - dy);
const pickGear = (i) => O9_GEARS[(i * 5 + 1) % O9_GEARS.length];
// 消える 前の ふるえる 白い わく
function whiteOut(c, t, i, d, o = {}) {
  const { k } = c;
  erase(c, t, { w: (o.w || 52) * c.sz, h: (o.h || 46) * c.sz, dir: c.dir === 'down' ? -1 : 1, wipe: o.wipe || 320, delay: d, life: o.life || 700 });
  k.particles(t.x, t.y, { colors: VOID, n: N(c, o.n ?? 14), speed: 90, g: -30, delay: d + 120, life: 520 });
  if (i < 3) txt(c, 'シーン…', t.x, top(c, t, 30), { size: 9, color: '#ffffff', ink: '#5a2a8a', delay: d + (o.wipe || 320), life: 420, pop: false });
}

export const AX_O9_CHAOS = {
  // まっさらに消す: 手を かざすと 白い 光 → 消しゴムが 敵を まっ白に ぬりつぶす
  ox_o9_massara: {
    charge: { color: '#e8d8ff', color2: '#ffffff' },
    sfx: 'ax_o9_massara',
    allyFx: 'dark',
    rich: VOID,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      k.gather(o.x, o.y - 14, { colors: ['#ffffff', '#b48aff'], n: 14, r: 40, delay: 0, life: 280 });
      c.each((t, i, d) => {
        k.beam(o.x, o.y - 14, t.x, t.y, { w: 6 * c.sz, color: '#e8d8ff', glow: '#b48aff', core: '#ffffff', delay: d + 140, life: c.hit - 40, grow: c.hit - 160, widths: [0.3, 1, 1, 0.4, 0] });
        boom(c, t, c.hit + d, { i, r: 16, heavy: i === 0, colors: VOID, n: 14, color: '#ffffff', edge: '#8a5ad8', amp: 2.6, shake: 400 });
        whiteOut(c, t, i, c.hit + d + 80);
      });
      k.flash('#ffffff', 110, c.hit);
    },
  },
  // 装備つくりかえ: 設計図の 空 → 家族の 上に 青い 点線の 装備 → 色が ついて きらり → 金の 火花「カンカン」
  ox_o9_tsukurikae: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o9_tsukurikae',
    allyFx: 'heal',
    rich: MAKE,
    play(fx, c) {
      const { k } = c;
      bg(c, 'blueprint', { a: 0.28, life: 560, fin: 140 });
      c.each((t, i, d) => {
        const gy = Math.max(16, t.y - 40);
        gear(c, pickGear(i), { keys: [[0, t.x, gy, 0.6], [200, t.x, gy, 1.25, 0.2], [c.hit, t.x, t.y - 16, 1, 0]], ease: 'out', size: 14, drawAt: 260, delay: d, life: c.hit + 360 });
        fx.sparks(t.x, gy, { colors: ['#ffffff', '#ffd23a', '#ffb020'], n: 10, speed: 130, g: 160, delay: 260 + d, life: 380 });
        k.shockwave(t.x, gy, { r0: 6, r1: 34, color: '#5ac8ff', w: 2, delay: 240 + d, life: 360 });
        k.sparkles(t.x, gy, { n: 5, r: 20, size: 5, delay: 300 + d, life: 320, gap: 50 });
        blessing(c, t, c.hit + d, MAKE, 8);
        fx.glow(t.x, t.y - 10, { color: '#fff6b0', r: 22, delay: c.hit + d, life: 360, alpha: 0.8 });
      });
      txt(c, 'カンカン!', c.center.x, Math.max(14, c.center.y - 62), { size: 12, color: '#ffffff', ink: '#1a3a8a', delay: 240, life: 460 });
      txt(c, 'ニューソウビ!', c.center.x, Math.max(14, c.center.y - 40), { size: 11, color: '#fff6b0', ink: '#8a5a0a', delay: c.hit + 120, life: 520, pop: false });
    },
  },
  // こわしてつくる: こぶしの しょうげきで 敵が こわれ、かけらが 自分の 上で 新しい 装備に なる
  ox_o9_kowashite_tsukuru: {
    charge: { color: '#b48aff', color2: '#ffffff' },
    sfx: 'ax_o9_kowashite',
    allyFx: 'quake',
    rich: VOID,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      k.speedLines(c.center.x, c.center.y, { color: '#e8d8ff', n: 24, r0: 30, r1: 160, delay: c.hit - 120, life: 300 });
      c.each((t, i, d) => {
        k.dash(o.x, o.y - 8, t.x, t.y, { color: '#b48aff', travel: c.hit, w: 6, delay: d, life: c.hit + 120 });
        boom(c, t, c.hit + d, { i, r: 18, heavy: i === 0, colors: VOID, n: 14, color: '#e8d8ff', edge: '#5a2a8a', amp: 2.6, shake: 420 });
        k.debris(t.x, t.y, { n: N(c, 10), colors: ['#b48aff', '#5a2a8a', '#ffffff'], up: 140, g: 260, size: 2, delay: c.hit + d, life: 520 });
        // かけらが 自分の 上へ もどる
        for (let j = 0; j < (c.all ? 1 : 3); j++) fx.twinkle(t.x, t.y - 10, { color: '#fff6b0', size: 3, vy: -60, delay: c.hit + d + 300 + j * 60, life: 300 });
      });
      const gy = c.fromAlly ? c.H - 52 : o.y - 30;
      gear(c, 'sword', { keys: [[0, o.x, gy + 10, 0.4], [200, o.x, gy, 1.3, 0.3]], ease: 'out', size: 10, drawAt: 200, delay: c.hit + 520, life: 760 });
      fx.sparks(o.x, gy, { colors: MAKE, n: 14, speed: 120, g: 120, delay: c.hit + 720, life: 420 });
      txt(c, 'ガシャーン!', c.center.x, Math.max(14, c.center.y - 44), { size: 14, color: '#ffffff', ink: '#5a2a8a', delay: c.hit, life: 420 });
    },
  },
  // 無にかえす光: 空から まっ白な 光の 柱 → 画面が 一しゅん 白く → 弱った 敵は 消しゴムで 消える
  ox_o9_mu_no_hikari: {
    charge: { color: '#ffffff', color2: '#e8d8ff' },
    sfx: 'ax_o9_mu',
    allyFx: 'dark',
    rich: VOID,
    play(fx, c) {
      const { k } = c;
      k.gather(c.center.x, Math.max(10, c.center.y - 60), { colors: ['#ffffff', '#e8d8ff'], n: 16, r: 50, life: 300 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 26 * c.sz, color: '#f4eeff', glow: '#ffffff', core: '#ffffff', delay: c.hit + d - 120, life: 640 });
        boom(c, t, c.hit + d, { i, r: 20, heavy: i === 0, colors: VOID, n: 16, color: '#ffffff', edge: '#b48aff', amp: 2.8, shake: 440 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 60 * c.sz, color: '#e8d8ff', w: 3, delay: c.hit + d + 30, n: 2, gap: 110 });
        whiteOut(c, t, i, c.hit + d + 180, { wipe: 260 });
      });
      sky(c, 'white', { a: 0.3, life: 420, delay: c.hit - 40 });
      k.flash('#ffffff', 140, c.hit);
    },
  },
  // 創造神の作業台: 設計図の 線が 家族の 上に のびて、体と 装備を まとめて 作りなおす（緑の 光と 装備）
  ox_o9_sagyoudai: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o9_sagyoudai',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      const { k } = c;
      const cy = Math.max(20, c.center.y - 54);
      bg(c, 'blueprint', { a: 0.26, life: 560, fin: 140 });
      line(c, [[16, cy], [c.W - 16, cy]], { color: '#bfeaff', glow: '#5ac8ff', w: 1.4, travel: 300, life: c.len - 300 });
      line(c, [[16, cy + 30], [c.W - 16, cy + 30]], { color: '#bfeaff', glow: '#5ac8ff', w: 1, travel: 300, delay: 80, life: c.len - 380, dash: [4, 4] });
      txt(c, 'トンテンカン', c.center.x, cy - 12, { size: 12, color: '#ffffff', ink: '#1a3a8a', delay: 200, life: 600, pop: false });
      c.each((t, i, d) => {
        gear(c, pickGear(i + 2), { keys: [[0, t.x, cy + 14, 0.6], [200, t.x, cy + 14, 1.1], [c.hit + 80, t.x, t.y - 14, 0.9]], ease: 'out', size: 8, drawAt: 240, delay: d, life: c.hit + 380 });
        fx.sparks(t.x, cy + 14, { colors: ['#ffffff', '#ffd23a'], n: 6, speed: 100, g: 160, delay: 240 + d, life: 360 });
        blessing(c, t, c.hit + d, GREEN, 10);
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.35, color: '#7dffb0', w: 2, delay: c.hit + d, life: 420 });
      });
    },
  },
  // はかいと創造の玉: むらさきと 金の 玉が ふくらみ、敵の 上で 大ばく発 → そのあとに 新しい 星が 生まれる
  ox_o9_hakai_souzou_dama: {
    charge: { color: '#b48aff', color2: '#ffd23a' },
    sfx: 'ax_o9_dama',
    allyFx: 'fire',
    rich: ['#ffffff', '#ffd23a', '#ff7a2a', '#b48aff'],
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const sy = c.fromAlly ? c.H - 50 : o.y - 26;
      k.orb(o.x, sy, { r: 14, color: '#8a4ad8', glow: '#ffb020', rim: '#ffffff', arms: 6, spin: 2, grow: 260, to: c.center, start: 300, travel: c.hit - 300, delay: 0 });
      c.each((t, i, d) => {
        k.explosion(t.x, t.y, { r: 26 * c.sz, pal: { main: '#ff7a2a', glow: '#ffb020', core: '#ffffff', dark: '#3a1a5a', list: ['#ffd23a', '#ff7a2a', '#b48aff'] }, delay: c.hit + d, heavy: i === 0 });
        boom(c, t, c.hit + d, { i, r: 20, heavy: i === 0, colors: ['#ffffff', '#ffd23a', '#ff7a2a'], n: 12, color: '#fff6b0', edge: '#ff7a2a', amp: 3, shake: 460, ring: false });
        k.flames(t.x, t.y + 8, { w: 26 * c.sz, h: 26 * c.sz, n: c.all ? 2 : 4, delay: c.hit + d + 60, life: 520 });
      });
      galaxy(c, c.center.x, Math.max(16, c.center.y - 30), { r: 40, spin: 2.2, delay: c.hit + 520, life: c.len - c.hit - 520, colors: ['#ffffff', '#fff6b0', '#b48aff', '#8ac8ff'] });
      txt(c, 'キラッ', c.center.x + 30, Math.max(14, c.center.y - 46), { size: 11, color: '#fff6b0', ink: '#5a2a8a', delay: c.hit + 640, life: 420, pop: false });
      k.flash('#fff0d8', 120, c.hit);
    },
  },
  // 世界のルール書きかえ: 設計図の 線が 敵の 上を はしり、大きな バツ → 書きなおす 線 → 力の 矢印 ↓
  ox_o9_rule_kakikae: {
    charge: { color: '#5ac8ff', color2: '#ffffff' },
    sfx: 'ax_o9_rule',
    allyFx: 'dark',
    rich: ['#ffffff', '#bfeaff', '#5ac8ff', '#ff4a4a'],
    play(fx, c) {
      const { k } = c;
      bg(c, 'blueprint', { a: 0.3, life: 600, fin: 120 });
      const ys = c.targets.map((t) => t.y);
      const y0 = Math.max(8, Math.min(...ys) - 34), y1 = Math.min(c.H - 8, Math.max(...ys) + 20);
      for (let j = 0; j < 4; j++) { const y = c.lerp(y0, y1, j / 3); line(c, [[6, y], [c.W - 6, y]], { color: '#bfeaff', glow: '#5ac8ff', w: 1, travel: 200, delay: 60 + j * 60, life: 520 }); }
      c.each((t, i, d) => {
        const r = 14 * c.sz;
        line(c, [[t.x - r, t.y - r], [t.x + r, t.y + r]], { color: '#ff6a6a', glow: '#ff2a2a', w: 3, travel: 120, delay: c.hit + d - 160, life: 520 });
        line(c, [[t.x + r, t.y - r], [t.x - r, t.y + r]], { color: '#ff6a6a', glow: '#ff2a2a', w: 3, travel: 120, delay: c.hit + d - 60, life: 460 });
        boom(c, t, c.hit + d, { i, r: 15, heavy: i === 0, colors: ['#ffffff', '#bfeaff', '#ff6a6a'], n: 12, color: '#e6fbff', edge: '#1a5ad8', amp: 2.2, shake: 360 });
        line(c, null, { wave: { x0: t.x - 20, x1: t.x + 20, y: t.y + 18, amp: 3, k: 4 }, color: '#bfeaff', glow: '#5ac8ff', w: 1.4, travel: 200, delay: c.hit + d + 160, life: 420 });
        arrows(c, t, c.hit + d + 220, ['#ff4a4a', '#3a8aff'], true);
      });
      txt(c, 'カキカエ!', c.center.x, Math.max(14, y0 - 6), { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 520 });
    },
  },
  // はかいと創造のビッグバン（看板）: まっ白な 空の まん中に 小さな 点 → 大ばく発の わが 画面いっぱい → 敵は 白く 消え → 銀河が 生まれ、家族に 新しい 装備が ふる
  ox_o9_big_bang: {
    charge: { color: '#ffffff', color2: '#b48aff' },
    sfx: 'ax_o9_bigbang',
    allyFx: 'dark',
    rich: VOID,
    play(fx, c) {
      const { k } = c;
      const bx = c.center.x, by = Math.max(24, Math.min(c.H - 30, c.center.y - 6));
      sky(c, 'space', { a: 0.34, life: 600 });
      k.gather(bx, by, { colors: ['#ffffff', '#b48aff', '#ffd23a'], n: 20, r: 70, waves: 2, gap: 160, life: 320 });
      fx.glow(bx, by, { color: '#ffffff', r: 8, delay: 0, life: c.hit, alpha: 1 });
      // 小さな 点が ふくらんで まわる（はかいと 創造の 2色の うず）
      k.orb(bx, by, { r: 16, color: '#8a4ad8', glow: '#ffffff', rim: '#ffd23a', arms: 6, spin: 3, grow: c.hit - 120, hold: 80, delay: 0, life: c.hit + 40 });
      galaxy(c, bx, by, { r: 54, spin: -5, grow: c.hit - 200, life: c.hit, colors: ['#ffffff', '#b48aff', '#ffd23a'] });
      txt(c, 'ゴゴゴゴ', bx, Math.max(14, by - 34), { size: 12, color: '#e8d8ff', ink: '#2a0a4a', delay: 120, life: c.hit - 160, pop: false });
      k.explosion(bx, by, { r: 46, pal: { main: '#b48aff', glow: '#ffffff', core: '#ffffff', dark: '#2a0a4a', list: ['#ffffff', '#e8d8ff', '#b48aff', '#ffd23a'] }, delay: c.hit - 60, heavy: true });
      k.shockwave(bx, by, { r0: 8, r1: 200, color: '#ffffff', w: 4, delay: c.hit - 40, n: 3, gap: 120, life: 520 });
      sky(c, 'white', { a: 0.32, life: 380, delay: c.hit - 40 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 20, heavy: i === 0, colors: VOID, n: 12, color: '#ffffff', edge: '#b48aff', amp: 3.2, shake: 520, ring: false });
        whiteOut(c, t, i, c.hit + d + 200, { wipe: 300, n: 10 });
      });
      galaxy(c, bx, Math.max(18, by - 20), { r: 70, spin: 2, grow: 500, delay: c.hit + 520, life: c.len - c.hit - 520, colors: ['#ffffff', '#fff6b0', '#b48aff', '#8ac8ff'] });
      party(c).forEach((p, j) => {
        gear(c, pickGear(j + 3), { keys: [[0, p.x, -10, 0.8], [360, p.x, p.y - 30, 1, 0.4]], ease: 'out', size: 8, drawAt: 160, delay: c.hit + 760 + j * 70, life: 640 });
        fx.sparks(p.x, p.y - 30, { colors: MAKE, n: 6, speed: 90, g: 120, delay: c.hit + 1120 + j * 70, life: 360 });
      });
      txt(c, 'ドッカーン!!', bx, Math.max(14, by - 40), { size: 18, color: '#ffffff', ink: '#5a2a8a', delay: c.hit, life: 520 });
      k.flash('#ffffff', 160, c.hit - 40);
    },
  },
};
