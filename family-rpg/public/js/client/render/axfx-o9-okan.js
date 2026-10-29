// 第51回 C3（o9）: 宇宙一のおかん の え（8技）。c の 時間は はなつ しゅんかんが 0
// ・しかる 技は ぎざぎざの ふきだし「コラーッ」・音の 輪・雷。しかられた 敵には 汗と「シュン…」（反省して 止まる）
// ・家族に かける 技は ごはん・お弁当・ハート・ほうき（axfx-o5 の 小物を かりる）
// ・宇宙の しるし: うずまきの 銀河・星（axfx-o9-kit.js）
import { obj as o4, txt, rings, boom, blessing, arrows, N, org } from './axfx-o4-kit.js';
import { obj as o5, fly, toss } from './axfx-o5-kit.js';
import { sky, galaxy, bubble, zabuton, party } from './axfx-o9-kit.js';

const GOLD = ['#ffffff', '#fff6b0', '#ffd23a', '#ffb020'];
const PINK = ['#ffffff', '#ffc8dc', '#ff7aa8'];
const GREEN = ['#ffffff', '#c8ffe0', '#7dffb0'];
const top = (c, t, dy = 40) => Math.max(12, t.y - dy);
// しかられた 敵: 汗が たれて「シュン…」
function shun(c, t, i, d) {
  const { fx } = c;
  for (let j = 0; j < (c.all ? 1 : 3); j++) fx.twinkle(t.x + 10 + j * 4, t.y - 16, { color: '#8ac8ff', size: 3, vy: 28, delay: d + j * 90, life: 380 });
  if (i < 3) txt(c, 'シュン…', t.x, top(c, t, 26), { size: 8, color: '#d8ecff', ink: '#1a2a5a', delay: d + 60, life: 520, pop: false });
}

export const AX_O9_OKAN = {
  // 宇宙のコラーッ！: 銀河の 前で ぎざぎざの ふきだしが ふくらみ、音の 輪 → 敵に 雷 → 汗と シュン…
  ox_o9_uchuu_kora: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_kora',
    allyFx: 'bolt',
    rich: GOLD,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      sky(c, 'space', { a: 0.3, life: 560 });
      galaxy(c, o.x, o.y - 24, { r: 46, spin: 2.6, life: c.len - 200 });
      const by = c.dir === 'down' ? o.y + 26 : o.y - 40;
      bubble(c, 'コラーーッ!!', { keys: [[0, o.x, by, 0.3], [140, o.x, by, 1.15], [c.hit - 60, c.center.x, c.dir === 'down' ? c.center.y - 30 : c.center.y - 34, 1.25]], size: 20, life: c.hit + 360 });
      rings(c, o.x, by, { n: 4, r1: 50, span: 0.8, ang: Math.atan2(c.center.y - by, c.center.x - o.x), color: '#ffd23a', per: 420, gap: 110, life: 900 });
      c.each((t, i, d) => {
        k.bolt(t.x + 6, Math.max(-6, t.y - 90), t.x, t.y, { w: 3.2, color: '#fff6b0', glow: '#ffd83a', delay: c.hit + d - 70, life: 380, forks: 3 });
        boom(c, t, c.hit + d, { i, r: 16, heavy: i === 0, colors: GOLD, n: 16, color: '#fff6b0', edge: '#ffb020', amp: 2.6, shake: 420 });
        k.shapes(t.x, t.y - 4, { shape: 'star', n: N(c, 10), colors: ['#ffe060', '#ffffff'], speed: 90, size: 2, delay: c.hit + d + 40, life: 560 });
        shun(c, t, i, c.hit + d + 380);
      });
      k.flash('#fff6b0', 100, c.hit);
    },
  },
  // 宇宙一の大もりごはん: 星空から 山もりの ちゃわんが おりてきて、ごはんつぶの 星が 家族へ
  ox_o9_uchuu_gohan: {
    charge: { color: '#ffffff', color2: '#ffe8b0' },
    sfx: 'ax_o9_gohan',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = Math.max(26, c.center.y - 66);
      galaxy(c, cx, cy, { r: 52, spin: 1.2, life: c.len - 160, colors: ['#ffffff', '#fff6b0', '#ffd8a8'] });
      o5(c, 'chawan', { x0: cx, y0: -20, x1: cx, y1: cy, travel: 320, ease: 'out', s: 17, glow: '#fff6c8', life: c.len - 220, fout: 220 });
      for (let j = 0; j < 3; j++) k.particles(cx - 10 + j * 10, cy - 20, { colors: ['#ffffff', '#f0f0f0'], n: 4, speed: 18, ang: -Math.PI / 2, spread: 0.3, g: -40, delay: 300 + j * 120, life: 600 });
      txt(c, 'モリモリ', cx, cy - 26, { size: 12, color: '#ffffff', ink: '#8a5a1a', delay: 320, life: 520 });
      c.each((t, i, d) => {
        k.shapes(cx, cy, { shape: 'star', n: 3, colors: ['#ffffff', '#fff6b0'], speed: 0, size: 2.2, delay: c.hit - 220 + d, life: 260 });
        fly(c, 'onigiri', cx, cy + 6, t.x, t.y - 10, { s: 5, delay: c.hit - 240 + d, travel: 240, stay: 260, spin: 4 });
        blessing(c, t, c.hit + d, GREEN, 10);
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.35, color: '#7dffb0', w: 2, delay: c.hit + d, life: 420 });
      });
      txt(c, 'イタダキマス!', cx, c.fromAlly ? c.H - 44 : cy + 30, { size: 11, color: '#c8ffe0', ink: '#1a5a3a', delay: c.hit + 180, life: 520, pop: false });
    },
  },
  // 正座で反省タイム: ざぶとんが すべりこみ、大きな おかんの かげが「スワリナサイ!」→ 時計が まわって 汗・攻撃力 ↓
  ox_o9_seiza_hansei: {
    charge: { color: '#ff7aa8', color2: '#ffffff' },
    sfx: 'ax_o9_hansei',
    allyFx: 'dark',
    rich: PINK,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gx = Math.min(c.W - 22, t.x + 34), gy = Math.max(26, t.y - 6);
        if (i < 2) o5(c, 'okan', { x: gx, y: gy, s: 20, glow: '#ffd23a', delay: d, life: c.len - 200 - d, color: '#5a2a4a', pop: 160 });
        if (i < 2) bubble(c, 'スワリナサイ!', { keys: [[0, gx - 4, top(c, t, 44), 0.4], [140, gx - 10, top(c, t, 44), 1]], size: 14, fsize: 0.6, delay: 80 + d, life: 640 });
        zabuton(c, { keys: [[0, t.x - 70, t.y + 18, 1], [c.hit, t.x, t.y + 16, 1.2]], ease: 'out', size: 16 * c.sz, delay: d, life: c.len - 160 - d });
        k.speedLines(t.x, t.y, { color: '#ffd23a', n: N(c, 16), r0: 22, r1: 90, delay: c.hit + d, life: 280 });
        boom(c, t, c.hit + d, { i, r: 14, heavy: i === 0, colors: PINK, n: 14, color: '#ffe0ec', edge: '#ff4a8a', amp: 2, shake: 320 });
        o4(c, 'clock', { keys: [[0, t.x - 22, top(c, t, 30), 0.4], [140, t.x - 22, top(c, t, 30), 1]], size: 8, spin: 9, delay: c.hit + d + 120, life: 760 });
        arrows(c, t, c.hit + d + 260, ['#ff4a4a'], true);
        shun(c, t, i, c.hit + d + 300);
      });
      txt(c, 'クドクド…', c.center.x, Math.max(14, c.center.y - 52), { size: 10, color: '#ffffff', ink: '#8a1a4a', delay: c.hit + 400, life: 600, pop: false });
    },
  },
  // 流れ星スリッパ: 星の しっぽを ひいた スリッパが 空から 流れおちて スパーン！→ 星が はじける
  ox_o9_nagareboshi_slipper: {
    charge: { color: '#ff7aa8', color2: '#fff6b0' },
    sfx: 'ax_o9_slipper',
    allyFx: 'claw',
    rich: ['#ffffff', '#fff6b0', '#ff9ac8'],
    play(fx, c) {
      const { k } = c;
      sky(c, 'space', { a: 0.25, life: 520, delay: c.hit - 120 });
      c.each((t, i, d) => {
        const sx = c.dir === 'down' ? t.x + 90 : t.x - 110, sy = c.dir === 'down' ? Math.max(10, t.y - 100) : -10;
        o5(c, 'slipper', { x0: sx, y0: sy, x1: t.x, y1: t.y - 4, travel: c.hit, ease: 'in', s: 11 * c.sz, glow: '#fff6b0', trail: 5, spin: 10, delay: d, life: c.hit + 220, fout: 120 });
        for (let j = 0; j < (c.all ? 2 : 5); j++) {
          const u = (j + 1) / 6;
          k.shapes(sx + (t.x - sx) * u, sy + (t.y - sy) * u, { shape: 'star', n: 2, colors: ['#ffe060', '#ffffff'], speed: 20, size: 2, delay: d + c.hit * u, life: 420 });
        }
        boom(c, t, c.hit + d, { i, r: 18, heavy: i === 0, colors: ['#ffffff', '#ffe060', '#ff9ac8'], n: 18, color: '#ffe0ec', edge: '#ff4a8a', amp: 3, shake: 440 });
        if (i < 3) txt(c, 'スパーン!!', t.x, top(c, t, 30), { size: 15, color: '#ffffff', ink: '#c81a5a', delay: c.hit + d, life: 520 });
        k.shapes(t.x, t.y, { shape: 'star', n: N(c, 14), colors: ['#ffe060', '#ffffff', '#ff9ac8'], speed: 120, size: 2.4, g: 60, delay: c.hit + d + 30, life: 640 });
        shun(c, t, i, c.hit + d + 420);
      });
      k.flash('#fff0f6', 90, c.hit);
    },
  },
  // 愛情たっぷり宇宙弁当: お弁当が ひらいて、星の おかずと ハートが 家族へ → じわじわ 光る わ
  ox_o9_uchuu_bentou: {
    charge: { color: '#ff7aa8', color2: '#ffffff' },
    sfx: 'ax_o9_bentou',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = Math.max(26, c.center.y - 62);
      o5(c, 'bento', { x: cx, y: cy, s: 15, pop: 200, openAt: 220, glow: '#fff6c8', life: c.len - 200, fout: 220 });
      k.shapes(cx, cy, { shape: 'star', n: 10, colors: ['#ffe060', '#ff9a4a', '#ffffff'], speed: 70, size: 2.6, delay: 260, life: 520 });
      c.each((t, i, d) => {
        fly(c, 'heart', cx, cy, t.x, t.y - 12, { s: 5, delay: c.hit - 260 + d, travel: 260, stay: 240, glow: '#ff9ac8' });
        blessing(c, t, c.hit + d, GREEN, 9);
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.35, color: '#7dffb0', w: 2, delay: c.hit + d + 120, life: 420, n: 2, gap: 160 });
      });
      txt(c, 'ノコサズタベテ!', cx, cy + 28, { size: 10, color: '#ffffff', ink: '#c81a5a', delay: 300, life: 560, pop: false });
    },
  },
  // 宇宙一のおかんの愛: 大きな ハートが どくん → 光の 柱が たおれた 家族に → ハートが のぼる
  ox_o9_okan_no_ai: {
    charge: { color: '#ff7aa8', color2: '#ffffff' },
    sfx: 'ax_o9_ai',
    allyFx: 'holy',
    rich: PINK,
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = Math.max(26, c.center.y - 60);
      o5(c, 'heart', { x: cx, y: cy, s: 22, pop: 220, squash: 0.12, glow: '#ff9ac8', life: c.len - 200, fout: 240 });
      galaxy(c, cx, cy, { r: 60, spin: 1.5, life: c.len - 220, colors: ['#ffffff', '#ffc8dc', '#ff7aa8', '#fff6b0'] });
      bubble(c, 'オキナサイ!', { keys: [[0, cx, cy - 26, 0.4], [140, cx, cy - 28, 1]], size: 15, fsize: 0.5, edge: '#ff4a8a', color: '#ff2a7a', delay: 120, life: 620 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 18, color: '#ffc8dc', glow: '#ffffff', delay: c.hit + d - 40, life: 560 });
        k.shapes(t.x, t.y - 6, { shape: 'heart', n: 6, colors: ['#ff7aa8', '#ffc8dc', '#ffffff'], speed: 50, ang: -Math.PI / 2, spread: 0.8, g: -40, size: 2.4, delay: c.hit + d + 60, life: 640 });
        blessing(c, t, c.hit + d + 100, PINK, 8);
      });
      k.flash('#fff0f6', 80, c.hit);
    },
  },
  // 宇宙の家事全力: ほうき・ちゃわん・せんたく物が 家族の まわりを 光の 速さで まわる → 力の 矢印
  ox_o9_uchuu_kaji: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_kaji',
    allyFx: 'wind',
    rich: GOLD,
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = Math.max(24, c.center.y - 50);
      const tools = ['broom', 'chawan', 'shamoji', 'slipper'];
      tools.forEach((sh, j) => {
        const pts = [];
        for (let s = 0; s <= 12; s++) { const an = (j / 4) * Math.PI * 2 + s * 0.55; pts.push([cx + Math.cos(an) * 70, cy + 18 + Math.sin(an) * 22]); }
        o5(c, sh, { pts, travel: c.hit + 200, s: 8, spin: 6, delay: j * 40, life: c.hit + 360, glow: '#fff6c8' });
      });
      k.streaks({ ang: 0, color: '#fff6b0', n: 18, delay: 60, life: c.hit, speed: 1.4, alpha: 0.5 });
      txt(c, 'シュババババ', cx, cy - 14, { size: 11, color: '#ffffff', ink: '#8a5a0a', delay: 120, life: 560, pop: false });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, GOLD, 8);
        arrows(c, t, c.hit + d + 60, ['#ff4a4a', '#3a8aff', '#3ad860']);
      });
    },
  },
  // 宇宙一のカミナリ（看板）: 宇宙の 空・大きな おかんの かげ と 銀河 →「イイカゲンニ…!!」→ 銀河じゅうの 雷が 敵全体に → 家族に ハートで ぎゅっ
  ox_o9_uchuu_kaminari: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_kaminari',
    allyFx: 'bolt',
    rich: GOLD,
    play(fx, c) {
      const { k } = c;
      const gx = c.W / 2, gy = c.dir === 'down' ? 40 : 34;
      sky(c, 'space', { a: 0.34, life: 600 });
      galaxy(c, gx, gy, { r: 96, spin: 1.6, grow: 420, life: c.len - 160, sy: 0.42 });
      const ox = gx - 78;
      o5(c, 'okan', { x: ox, y: gy + 4, s: 26, glow: '#ffd23a', pop: 240, life: c.hit + 520, color: '#7a3a5a' });
      bubble(c, 'イイカゲンニシナサーイ!!', { keys: [[0, ox + 40, gy - 4, 0.3], [180, gx + 28, gy - 6, 1.05]], ease: 'out', size: 17, fsize: 0.52, delay: 140, life: c.hit + 200 });
      rings(c, ox + 10, gy, { n: 4, r1: 60, span: 0.7, ang: Math.atan2(c.center.y - gy, c.center.x - ox), color: '#ffd23a', per: 520, gap: 120, life: 1100, delay: 200 });
      c.each((t, i, d) => {
        k.boltRain(t.x, t.y, { n: c.all ? 2 : 4, spread: 24, gap: 70, w: 3.4, color: '#fff6b0', glow: '#ffd83a', delay: c.hit + d - 160, life: 420 });
        boom(c, t, c.hit + d, { i, r: 22, heavy: i === 0, colors: GOLD, n: 18, color: '#fff6b0', edge: '#ffb020', amp: 3, shake: 460 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#ffd23a', w: 3, delay: c.hit + d + 40, n: 2, gap: 120 });
        shun(c, t, i, c.hit + d + 460);
      });
      k.flash('#fff6b0', 120, c.hit);
      // 家族を ぎゅっ（回復）
      party(c).forEach((p, j) => {
        toss(c, 'heart', p.x, p.y - 30, { s: 5, vx: 0, vy: -40, g: -20, delay: c.hit + 620 + j * 60, life: 520 });
        blessing(c, p, c.hit + 660 + j * 60, GREEN, 6);
      });
      if (c.fromAlly) txt(c, 'ギュッ', c.W / 2, c.H - 46, { size: 13, color: '#ffc8dc', ink: '#c81a5a', delay: c.hit + 700, life: 520 });
    },
  },
};
