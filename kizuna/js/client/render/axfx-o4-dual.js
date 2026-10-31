// 第49回 O4: 合体技（ため なし。顔の カットインの あとに 出る）
// ・全館リニューアル・なんとかしてよ〜！・一晩で大リフォーム・ひみつ道具とれん金・9回ウラの大逆転・ウーウーカンカンピーポー・はっけよい、のこった！
// ・時間は shared/data/ax-time-o4.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { obj, car, hose, rings, txt, line, bg, pow, boom, blessing, arrows, N, org, ground, rnd } from './axfx-o4-kit.js?v=a5c15ff5e061';

const PI = Math.PI;
const COOL = ['#ffffff', '#bfeaff', '#5ac8ff'];
const GOLD = ['#ffffff', '#ffd23a', '#ffa00a'];
const CONF = ['#ff4a4a', '#ffd23a', '#4ab8ff', '#5ad85a', '#ff7ad8', '#ffffff'];
const party = (c) => [0, 1, 2, 3].map((i) => ({ x: c.W / 2 + (i - 1.5) * 58, y: c.H - 22 }));
function firework(c, x, y, delay, n = 16) {
  c.fx.glow(x, y, { color: '#ffffff', r: 18, delay, life: 260, alpha: 0.8 });
  c.fx.sparks(x, y, { colors: CONF, n, speed: 150, g: 50, drag: 0.94, delay, life: 520, len: 5 });
  c.k.shockwave(x, y, { r0: 3, r1: 26, color: '#ffffff', w: 1.5, delay });
}

export const AX_O4_DUAL = {
  // 全館リニューアル: 建物が 足場に かこまれる → 足場が とれると ぴかぴかの ビル → 冷たい 風が 敵全体、緑の 光が 味方 → 紙ふぶき
  ox_zenkan_renewal: {
    sfx: 'ax_o4_renewal',
    allyFx: 'ice',
    rich: COOL,
    play(fx, c) {
      const { k } = c;
      const bx = c.W / 2, by = 40;
      obj(c, 'building', { keys: [[0, bx, by + 10, 0.7], [200, bx, by, 1]], size: 30, cols: 4, rows: 3, aspect: 0.8, room: '#8a8478', wall: '#c8c2b6', ac: false, life: 420, fout: 80 });
      // 足場（線の こうし）
      const sc = [];
      for (let i = 0; i <= 4; i++) sc.push([[bx - 36 + i * 18, by + 30], [bx - 36 + i * 18, by - 34]]);
      for (let j = 0; j <= 3; j++) sc.push([[bx - 38, by + 28 - j * 20], [bx + 38, by + 28 - j * 20]]);
      sc.forEach((pts, j) => line(c, pts, { color: '#ffd23a', glow: '#a87a0a', w: 1.4, travel: 160, delay: 60 + j * 25, life: 420 - j * 10 }));
      txt(c, 'トンカン', bx + 54, by - 20, { size: 10, color: '#ffffff', ink: '#6a4020', delay: 120, life: 300, pop: false });
      for (let j = 0; j < 4; j++) fx.sparks(bx + rnd(-30, 30), by + rnd(-20, 20), { colors: ['#ffffff', '#ffd23a'], n: 4, speed: 90, delay: 140 + j * 70, life: 220 });
      pow(c, bx, by, { r: 34, delay: 440, color: '#ffffff', edge: '#5ac8ff', life: 260 });
      obj(c, 'building', { keys: [[0, bx, by, 0.8], [160, bx, by, 1.08], [260, bx, by, 1.05]], size: 30, cols: 4, rows: 3, aspect: 0.8, litAt: 120, litGap: 25, lit: '#bfeaff', delay: 440, life: c.len - 480, glow: '#ffffff', glowA: 0.5 });
      txt(c, 'パァッ', bx - 50, by - 22, { size: 12, color: '#ffffff', ink: '#1a5a9a', delay: 460, life: 340 });
      k.sparkles(bx, by, { n: 10, r: 40, colors: ['#ffffff', '#bfeaff'], delay: 460 });
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 1 : 3); j++) line(c, [[bx + rnd(-20, 20), by + 30], [c.lerp(bx, t.x, 0.5) + rnd(-10, 10), c.lerp(by, t.y, 0.5)], [t.x, t.y]], { color: '#e8fbff', glow: '#5ac8ff', w: 1.6, travel: 260, delay: 560 + d + j * 40, life: 420 });
        boom(c, t, c.hit + d, { i, pow: true, r: 15, heavy: i === 0, colors: COOL, n: 16, color: '#e6fbff', edge: '#3a8cff', ringCol: '#9ae6ff', amp: 1.8, shake: 260 });
        c.k.shapes(t.x, t.y - 8, { shape: 'flake', n: N(c, 8), colors: COOL, speed: 60, g: 30, size: 2.4, delay: c.hit + d + 60, life: 520 });
      });
      if (c.fromAlly) party(c).forEach((p, i) => { fx.glow(p.x, p.y - 6, { color: '#7dffb0', r: 22, delay: c.hit + 120 + i * 40, life: 380, alpha: 0.6 }); k.particles(p.x, p.y, { colors: ['#7dffb0', '#ffffff'], n: 6, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, delay: c.hit + 120 + i * 40, life: 460 }); });
      k.shapes(c.W / 2, -4, { shape: 'card', n: 16, colors: CONF, speed: 60, ang: PI / 2, spread: 1.3, g: 70, drag: 0.96, spin: 9, size: 1.6, delay: c.hit + 100, life: c.len - c.hit - 160, add: false, pop: false });
      txt(c, 'ヒュウゥ', c.center.x, c.center.y - 38, { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 400 });
    },
  },
  // なんとかしてよ〜！: 大きな 工具箱から スパナ・ねじ・電球・かさが どさどさ 敵全体に 降る → 味方に 緑の 矢印
  ox_nantoka_shiteyo: {
    sfx: 'ax_o4_nantoka',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      txt(c, 'えーん', 40, c.H - 40, { size: 13, color: '#bfe6ff', ink: '#2a3a7a', delay: 0, life: 420 });
      for (let j = 0; j < 4; j++) fx.drop(46 + j * 4, c.H - 50, { color: '#9ad8ff', vx: rnd(-40, 40), vy: -60, g: 260, size: 1.6, delay: j * 60, life: 420 });
      const bx = c.W / 2, by = 24;
      obj(c, 'toolbox', { keys: [[0, bx, by - 30, 0.6], [200, bx, by, 1.3], [300, bx, by - 3, 1.4]], ease: 'out', size: 14, life: c.len - 40 });
      pow(c, bx, by - 8, { r: 16, delay: 300, color: '#ffffff', edge: '#e83a2a', life: 240 });
      const shapes = ['spanner', 'bolt', 'bulb', 'umbrella', 'nut', 'flashlight'];
      c.each((t, i, d) => {
        const m = c.all ? 3 : 6;
        for (let j = 0; j < m; j++) {
          const sh = shapes[(i * 2 + j) % shapes.length];
          const at = c.hit + d - 120 + j * 60;
          const off = (j - (m - 1) / 2) * 9;
          obj(c, sh, { keys: [[0, bx + rnd(-10, 10), by, 0.4, 0], [180, c.lerp(bx, t.x + off, 0.6), 4, 1, 2], [at - 300, t.x + off, t.y - 4 + rnd(-6, 6), 1.1, 5]], ease: 'io', size: sh === 'umbrella' ? 11 : 9, delay: 300, life: at - 300 + 140 });
          fx.sparks(t.x + off, t.y, { colors: ['#ffffff', '#ffd23a'], n: 3, speed: 90, delay: at, life: 220 });
        }
        boom(c, t, c.hit + d, { i, pow: true, r: 14, heavy: i === 0, colors: ['#ffffff', '#ffd23a', '#c8d0dc'], n: 14 });
        txt(c, 'ガラガラ', t.x, t.y - 30, { size: 9, color: '#ffffff', ink: '#3a3e4a', delay: c.hit + d + 80, life: 300, pop: false });
      });
      if (c.fromAlly) party(c).forEach((p, i) => arrows(c, p, c.hit + 300 + i * 40, ['#3ad87a']));
      k.debris(c.center.x, c.center.y + 6, { n: 8, delay: c.hit + 100, up: 110, colors: ['#c8d0dc', '#ffd23a', '#e83a2a'] });
    },
  },
  // 一晩で大リフォーム: 地面に れん成陣 → 鉄の 柱が 敵全体の 下から つき上がる → 柱が 家の かべに なって 味方を まもる
  ox_hitoban_reform: {
    sfx: 'ax_o4_reform',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { a: 0.26, life: 520 });
      c.each((t, i, d) => {
        const g = ground(c, t, 10);
        obj(c, 'circle', { x: t.x, y: g, size: 24 * c.sz, sy: 0.32, drawAt: 0, delay: d, life: c.hit + 200 });
        for (let j = 0; j < (c.all ? 2 : 3); j++) fx.zap(t.x + rnd(-20, 20), g + rnd(-4, 4), t.x + rnd(-20, 20), g - rnd(4, 14), { color: '#bfeaff', glow: '#5ac8ff', delay: 200 + d + j * 80, life: 160 });
        for (let j = 0; j < 3; j++) {
          const px = t.x + (j - 1) * 14 * c.sz;
          obj(c, 'girder', { keys: [[0, px, g + 30, 0.9, PI / 2], [140, px, t.y - 6, 1, PI / 2], [300, px, t.y - 8, 1, PI / 2]], ease: 'out', size: 14 * c.sz, delay: c.hit + d - 140 + j * 40, life: 380 });
        }
        boom(c, t, c.hit + d, { i, pow: true, r: 15, heavy: i === 0, colors: ['#ffffff', '#c8d0dc', '#5ac8ff'], n: 14, amp: 1.8 });
        k.debris(t.x, g, { n: N(c, 6), delay: c.hit + d, up: 120 });
      });
      txt(c, 'ズガガガ', c.center.x, c.center.y - 40, { size: 13, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 380 });
      // 家の かべに なって 味方を まもる
      const hx = c.W / 2, hy = 36;
      obj(c, 'house', { keys: [[0, hx, hy + 10, 0.5], [180, hx, hy, 1.2]], size: 16, delay: c.hit + 260, life: c.len - c.hit - 300, glow: '#5ab8ff', glowA: 0.5 });
      txt(c, 'ガキン', hx + 30, hy - 10, { size: 11, color: '#ffffff', ink: '#1a3a8a', delay: c.hit + 300, life: 300 });
      if (c.fromAlly) party(c).forEach((p, i) => obj(c, 'shield', { keys: [[0, p.x, p.y - 10, 0.4], [140, p.x, p.y - 14, 1.1]], size: 8, delay: c.hit + 360 + i * 40, life: 360, glow: '#5ab8ff' }));
    },
  },
  // ひみつ道具とれん金: 小さな スパナが れん成陣の 光で 巨大化 → 大きな スパナが 敵全体を おしつぶす → 青い MPの つぶ
  ox_himitsu_rensei: {
    sfx: 'ax_o4_rensei',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const sx = c.W / 2, sy = 34;
      obj(c, 'circle', { x: sx, y: sy, size: 24, drawAt: 0, life: 560 });
      for (let j = 0; j < 4; j++) fx.zap(sx + rnd(-20, 20), sy + rnd(-20, 20), sx + rnd(-20, 20), sy + rnd(-20, 20), { color: '#bfeaff', glow: '#5ac8ff', delay: 200 + j * 70, life: 140 });
      txt(c, 'パン', sx - 34, sy - 18, { size: 11, color: '#ffffff', ink: '#1a3a8a', delay: 120, life: 260 });
      txt(c, 'ムクムク', sx + 40, sy, { size: 10, color: '#ffffff', ink: '#1a3a8a', delay: 360, life: 300, pop: false });
      const xs = c.targets.map((t) => t.x);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const big = Math.max(30, (Math.max(...xs) - Math.min(...xs)) / 2 + 24);
      obj(c, 'spanner', { keys: [[0, sx, sy, 0.15, -0.3], [300, sx, sy, 0.3, -0.2], [560, sx, sy - 6, 1, -0.4], [c.hit, mx, c.center.y - 4, 1.05, 0.12], [c.hit + 300, mx, c.center.y, 1, 0.08]], ease: 'io', size: big, color: '#d8e0ec', life: c.hit + 380, fout: 220, glow: '#bfeaff', glowA: 0.4 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, pow: true, r: 16, heavy: i === 0, colors: ['#ffffff', '#c8d0dc', '#5ac8ff'], n: 16, amp: 2.2, shake: 300 });
        k.debris(t.x, t.y + 8, { n: N(c, 6), delay: c.hit + d, up: 100 });
      });
      txt(c, 'ドスン', c.center.x, c.center.y - 40, { size: 15, color: '#ffffff', ink: '#1a3a8a', delay: c.hit, life: 400 });
      if (c.fromAlly) party(c).forEach((p, i) => k.particles(p.x, p.y - 4, { colors: ['#5ab8ff', '#9ad8ff', '#ffffff'], n: 6, speed: 50, ang: -PI / 2, spread: 0.8, g: -50, size: 1.2, delay: c.hit + 200 + i * 40, life: 480 }));
    },
  },
  // 9回ウラの大逆転: スコアボード → 子どもの おうえんの 音符 → カキーン！ 金の すじで 敵1体 → 大きな 花火
  ox_kyuukai_ura: {
    sfx: 'ax_o4_gyakuten',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      bg(c, 'stadium', { a: 0.3, life: c.len - 80 });
      obj(c, 'score', { keys: [[0, c.W / 2, 34, 0.6], [180, c.W / 2, 28, 1]], size: 30, top: '0 0 1 0 0 0 2 0 0', bot: '0 0 0 1 0 0 0 0 3', flipAt: c.hit + 100, life: c.len - 60 });
      txt(c, 'がんばれー', 36, c.H - 34, { size: 11, color: '#ffffff', ink: '#c81a5a', delay: 40, life: 520 });
      k.shapes(40, c.H - 30, { shape: 'note', n: 12, colors: ['#ff7ad8', '#ffffff', '#ffd23a'], speed: 60, ang: -PI / 2 + 0.4, spread: 0.6, g: -20, size: 2.8, delay: 60, life: 640 });
      k.shapes(40, c.H - 30, { shape: 'heart', n: 6, colors: ['#ff7ad8', '#ffb0ec'], speed: 50, ang: -PI / 2 + 0.4, spread: 0.6, g: -20, size: 2.6, delay: 200, life: 560 });
      const o = org(c);
      const pv = { x: o.x - 10, y: o.y - 6 };
      obj(c, 'bat', { keys: [[0, pv.x, pv.y, 1, PI * 0.8], [c.hit - 260, pv.x, pv.y, 1, PI * 1.02], [c.hit - 160, pv.x, pv.y, 1, PI * 2.05], [c.hit + 100, pv.x, pv.y, 1, PI * 2.1]], ease: 'in', size: 30, gold: true, life: c.hit + 160 });
      fx.arc(pv.x, pv.y, { r: 27, a0: PI * 1.02, a1: PI * 2.05, w: 5, color: '#ffffff', glow: '#ffd23a', delay: c.hit - 260, life: 300 });
      const cp = { x: pv.x, y: pv.y - 26 };
      obj(c, 'ball', { keys: [[0, c.W / 2 + 40, 18], [200, cp.x, cp.y]], ease: 'lin', size: 3.2, spin: 18, delay: c.hit - 400, life: 210 });
      fx.glow(cp.x, cp.y, { color: '#ffd23a', r: 30, delay: c.hit - 200, life: 220, alpha: 1 });
      txt(c, 'カッキーン', cp.x + 30, cp.y - 16, { size: 13, color: '#ffd23a', ink: '#1a2a5a', delay: c.hit - 200, life: 380 });
      k.beam(cp.x, cp.y, t.x, t.y, { w: 6, color: '#ffd23a', glow: '#fff6b0', core: '#ffffff', grow: 200, delay: c.hit - 200, life: 460, widths: [0.4, 1, 1, 0.5, 0], streaks: true });
      boom(c, t, c.hit, { r: 22, heavy: true, colors: GOLD, n: 26, color: '#ffe040', edge: '#e8a01a', amp: 2.2, shake: 320 });
      k.shockwave(t.x, t.y, { r0: 10, r1: 70, color: '#ffd23a', w: 3, n: 2, delay: c.hit + 40 });
      firework(c, 60, 24, c.hit + 160, 18);
      firework(c, c.W - 60, 30, c.hit + 280, 18);
      firework(c, c.W / 2, 12, c.hit + 400, 18);
      txt(c, 'ドーン', t.x, t.y - 34, { size: 15, color: '#ffffff', ink: '#a85a0a', delay: c.hit, life: 420 });
    },
  },
  // ウーウーカンカンピーポー: パトカー・消防車・救急車が かけつけ → 赤と 青の 光 → 味方に 緑の 光 → 白い 羽（起き上がり）
  ox_uukanpi: {
    sfx: 'ax_o4_uukanpi',
    play(fx, c) {
      const { k } = c;
      const ry = 58;
      line(c, [[0, ry + 8], [c.W, ry + 8]], { color: '#c8d0dc', glow: '#5a6478', w: 2, travel: 200, life: c.len - 80 });
      car(c, 'police', { keys: [[0, -30, ry], [420, 70, ry], [c.len - 60, 76, ry]], ease: 'out', s: 1.35, beam: false, life: c.len - 40, streak: '#ffffff' });
      car(c, 'fire', { keys: [[0, c.W + 50, ry + 2], [480, c.W - 40, ry + 2], [c.len - 60, c.W - 44, ry + 2]], ease: 'out', dir: -1, s: 1.25, beam: false, life: c.len - 40, streak: '#ffffff', delay: 60 });
      car(c, 'ambulance', { keys: [[0, -40, ry - 26], [520, c.W / 2 + 20, ry - 26], [c.len - 60, c.W / 2 + 24, ry - 26]], ease: 'out', s: 1.35, beam: false, life: c.len - 40, streak: '#ffffff', delay: 120 });
      txt(c, 'ウーウー', 40, ry - 22, { size: 10, color: '#ffffff', ink: '#2a3a7a', delay: 60, life: 420, pop: false });
      txt(c, 'カンカン', c.W - 50, ry - 20, { size: 10, color: '#ffffff', ink: '#a8202a', delay: 160, life: 420, pop: false });
      txt(c, 'ピーポー', c.W / 2, ry - 46, { size: 10, color: '#ffffff', ink: '#c81a1a', delay: 260, life: 420, pop: false });
      for (let j = 0; j < 6; j++) fx.glow(j % 2 ? 60 : c.W - 60, ry - 10, { color: j % 2 ? '#ff3a3a' : '#3a8cff', r: 40, delay: 300 + j * 90, life: 120, alpha: 0.6 });
      hose(c, c.W - 50, ry - 12, c.W / 2 + 30, 6, { h: 20, w: 3, grow: 300, delay: 480, life: 400 });
      c.each((t, i) => {
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 30, delay: c.hit + i * 40, life: 420, alpha: 0.75 });
        k.pillar(t.x, t.y, { w: 14, color: '#ffffff', glow: '#c8ffe0', delay: c.hit + i * 40, life: 420 });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: c.n > 2 ? 4 : 10, colors: ['#ffffff', '#f0f8ff'], speed: 50, ang: -PI / 2, spread: 1, g: -20, size: 2.8, delay: c.hit + 60 + i * 40, life: 560 });
        blessing(c, t, c.hit + i * 40, ['#7dffb0', '#ffffff'], c.n > 2 ? 8 : 14);
        arrows(c, t, c.hit + 160 + i * 40, ['#ff4a4a', '#3a8cff']);
      });
    },
  },
  // はっけよい、のこった！: 土俵の 白い 円 → 3人の 影が ドスンと 四股 → 敵全体を 円の 外へ おし出す 衝撃波 → 塩の 白い つぶ
  ox_hakkeyoi: {
    sfx: 'ax_o4_hakkeyoi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, gy = Math.min(c.H - 8, c.center.y + 16);
      obj(c, 'disk', { keys: [[0, cx, gy, 0.6], [200, cx, gy, 1]], size: 110, sy: 0.22, edge: '#ffffff', fill: 'rgba(200,160,100,0.25)', w: 3, life: c.len - 40 });
      txt(c, 'はっけよい', cx, 24, { size: 14, color: '#ffffff', ink: '#6a3a1a', delay: 40, life: 460 });
      const xs = [c.W / 2 - 70, c.W / 2, c.W / 2 + 70];
      xs.forEach((x, j) => {
        const y = c.fromAlly ? c.H - 2 : 30;
        obj(c, 'man', { keys: [[0, x, y + 16, 0.9], [180 + j * 60, x, y - 10, 1, -0.15], [300 + j * 60, x, y, 1, 0], [c.hit - 120, x, y + 2, 1, 0], [c.hit, x, y - 14, 1.1, 0], [c.hit + 200, x, y - 8, 1, 0]], ease: 'io', size: 16, color: ['#3a3e5a', '#2a5a3a', '#5a3a3a'][j], belt: ['#ffd23a', '#ff4a4a', '#ffffff'][j], alpha: 0.9, life: c.len - 60 });
        k.shockwave(x, gy, { r0: 6, r1: 34, color: '#e8c89a', w: 2.4, sy: 0.3, delay: 300 + j * 60 });
        for (let m = 0; m < 2; m++) fx.puff(x + (m ? 10 : -10), gy, { color: '#c8a070', r0: 3, r1: 10, vx: (m ? 1 : -1) * 20, vy: -8, life: 460, alpha: 0.6, delay: 300 + j * 60 });
        txt(c, 'ドスン', x, gy - 50, { size: 10, color: '#ffffff', ink: '#6a3a1a', delay: 300 + j * 60, life: 240 });
      });
      k.shake(200, 1.6, 300);
      k.shake(200, 1.6, 420);
      k.shockwave(cx, gy - 10, { r0: 20, r1: 140, color: '#ffffff', w: 3.4, delay: c.hit - 60, n: 2 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, pow: true, r: 16, heavy: i === 0, colors: ['#ffffff', '#e8c89a', '#ffd23a'], n: 16, amp: 2.2, shake: 320 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#f4f4ec'], n: N(c, 10), speed: 110, ang: Math.atan2(t.y - gy, t.x - cx), spread: 0.5, delay: c.hit + d, life: 380 });
      });
      txt(c, 'のこった！', cx, c.center.y - 44, { size: 15, color: '#ffe040', ink: '#6a3a1a', delay: c.hit, life: 480 });
      k.shapes(cx, 0, { shape: 'diamond', n: 14, colors: ['#ffffff', '#f4f4ec'], speed: 40, ang: PI / 2, spread: 1.4, g: 120, size: 1.4, delay: c.hit + 100, life: 600 });
    },
  },
};
void [hose, rings, line];
