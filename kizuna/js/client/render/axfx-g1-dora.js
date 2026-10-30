// 第48回 G1: ネコ型ロボット・耳無しネコ型ロボット・ドラえもん ＋ カッパ・はなかっぱ・筋肉ニンニク の え
// 時間は shared/data/ax-time-g1.js。c の 時間は はなつ しゅんかんが 0
import { org, selfAt, N, darken, bg, ball, mark, prop, fist, boom, path, ghost, wind, cone, arc, air, flower, TAU, lerp } from './axfx-g1-lib.js?v=ba9bc083e891';
import { kiHit } from './axfx-g1-dbz.js?v=ba9bc083e891';

const DORA = { main: '#2a9aff', glow: '#bfe4ff', core: '#ffffff', list: ['#ffffff', '#bfe4ff', '#2a9aff'] };
const STAR = { main: '#ffffff', glow: '#ffe066', core: '#ffffff', list: ['#ffffff', '#ffe066', '#ffb03a'] };
const HEAL = { main: '#7dffb0', glow: '#c8ffe0', core: '#ffffff', list: ['#7dffb0', '#c8ffe0', '#ffffff'] };
const KAPPA = { main: '#3ab84a', glow: '#b8f0a0', core: '#ffffff', list: ['#ffffff', '#b8f0a0', '#3ab84a'] };
const WATER = { main: '#3a9aff', glow: '#bfe8ff', core: '#ffffff', list: ['#ffffff', '#bfe8ff', '#3a9aff'] };
const PINK = { main: '#ff7ab8', glow: '#ffd0e4', core: '#ffffff', list: ['#ffffff', '#ffd0e4', '#ff7ab8'] };
const MUSC = { main: '#ff8a2a', glow: '#ffd08a', core: '#ffffff', list: ['#ffffff', '#ffd08a', '#ff8a2a'] };
const FLOWER_COLS = [['#ff5a9a', '#ffe066', '#ffd0e4'], ['#ffe03a', '#ff8a2a', '#fff6c8'], ['#5aa8ff', '#ffffff', '#d8ecff'], ['#ff4a3a', '#ffe066', '#ffc0b0'], ['#b07aff', '#ffe066', '#e8d8ff']];

// 回復・強化の ひかり（a … selfAt）
function healFx(c, a, d, P = HEAL, o = {}) {
  const { fx, k } = c;
  fx.glow(a.x, a.y - 10, { color: P.glow, r: 26, delay: d, life: 360 });
  k.sparkles(a.x, a.y - 12, { n: N(c, o.tw ?? 8), r: 16, colors: [P.core, P.glow], delay: d, life: 320, gap: 30 });
  fx.sparks(a.x, a.y, { colors: P.list, n: N(c, (o.n ?? 14) + 6), speed: 50, ang: -Math.PI / 2, spread: 0.8, g: -90, drag: 0.96, delay: d, life: o.life ?? 420, len: 4 });
  fx.converge(a.x, a.y - 10, { colors: P.list, n: N(c, 8), r: 26, delay: Math.max(0, d - 160), life: 160 });
  fx.shock(a.x, a.foot - 3, { r0: 6, r1: 40, sy: 0.3, color: P.main, w: 1.6, delay: d, life: 360 });
  if (o.up) fx.arrows(a.x, a.y - 8, o.up, true, 3, d);
}
// まんがの ポカッ（ほし と すじ）
function pokan(c, x, y, d, P = STAR, o = {}) {
  kiHit(c, x, y, d, P, { r: o.r || 14, n: o.n ?? 16, smoke: o.smoke || 0, debris: o.debris || 0, heavy: o.heavy });
  c.k.shapes(x, y, { shape: 'star', n: N(c, o.stars ?? 6), colors: ['#ffe066', '#ffffff'], speed: 90, size: 2.4, delay: d, life: 380 });
  // まんがの「ポカッ」の すじ（外へ とぶ 白い 線）
  c.fx.sparks(x, y, { colors: ['#ffffff', P.glow], n: N(c, 12), speed: 230, g: 0, drag: 0.94, delay: d, life: 260, len: 9 });
}
// とぶ ものの うしろの すじ・ちり（x0,y0 → x1,y1 の あいだ、0〜travel ms）
function trail(c, x0, y0, x1, y1, travel, cols, n = 6, d = 0) {
  for (let j = 1; j <= n; j++) c.fx.sparks(lerp(x0, x1, j / (n + 1)), lerp(y0, y1, j / (n + 1)), { colors: cols, n: 3, speed: 40, delay: d + travel * j / (n + 1), life: 300, len: 4 });
}
// 画面に ただよう もの
function drift(c, cols, n, o = {}) {
  const { x0 = 0, x1 = c.W, y0 = 10, y1 = c.H - 10, from = 0, to = c.len * 0.6, vy = -20, life = 480 } = o;
  for (let j = 0; j < n; j++) c.fx.add({ kind: 'spark', x: c.rnd(x0, x1), y: c.rnd(y0, y1), vx: c.rnd(-8, 8), vy: vy * c.rnd(0.6, 1.3), g: 0, drag: 0.99, len: 3, color: cols[j % cols.length], size: 1.1, life: life * c.rnd(0.7, 1), delay: c.rnd(from, to), add: true });
}

export const AX_G1_DORA = {
  // ───────────── ネコ型ロボット ─────────────
  ax_manmaru_punch: {
    charge: { color: '#2a9aff', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_poka', allyFx: 'claw',
    play(fx, c) {
      const t = c.t, o = org(c);
      // まんまるの 白い 手が ボヨンと のびる
      fist(c, o.x, o.y, t.x, t.y, { style: 'round', s: 1.5 * c.sz, color: '#ffffff', glow: '#bfe4ff', travel: c.hit, life: c.hit + 160 });
      fx.shock(t.x, t.y, { r0: 4, r1: 30, color: '#ffffff', w: 2.4, delay: c.hit, life: 260 });
      pokan(c, t.x, t.y, c.hit, STAR, { r: 15, n: 20, stars: 8 });
      c.k.speedLines(t.x, t.y, { n: 12, delay: c.hit, life: 180, r0: 16, r1: 60 });
    },
  },
  ax_dorayaki: {
    charge: { color: '#ffb03a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_pon', allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const py = a.ally ? c.H - 46 : a.y - 26;
        prop(c, 'dorayaki', a.x, py, { s: 1.8, delay: d, life: c.hit + 120, pop: 140, shrink: c.hit });
        fx.sparks(a.x, py, { colors: ['#ffe066', '#ffffff'], n: 8, speed: 70, delay: d, life: 260 });
        c.k.shapes(a.x, py, { shape: 'heart', n: 2, colors: ['#ff7ab8', '#ffb0d8'], speed: 26, ang: -Math.PI / 2, spread: 0.6, size: 3, delay: d + c.hit - 80, life: 380, add: false });
        healFx(c, a, d + c.hit);
      });
    },
  },
  ax_pocket_saguru: {
    charge: { color: '#2a9aff', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_pocket', allyFx: 'buff',
    play(fx, c) {
      const a = selfAt(c, c.t);
      const px = a.x, py = a.ally ? c.H - 30 : a.y + 4;
      prop(c, 'pocket', px, py, { s: 1.4, life: c.len - 40, pop: 80 });
      fx.glow(px, py, { color: '#fff6d0', r: 18, life: 300 });
      // がらくたが ぽんぽん 飛び出して 落ちる
      ['pot', 'boot', 'ball', 'fish'].forEach((nm, j) => {
        const sx = (j % 2 ? 1 : -1) * (30 + j * 8);
        prop(c, nm, px, py - 4, { vx: sx, vy: -150 - j * 10, g: 420, spin: (j % 2 ? 1 : -1) * 6, s: 1.2, delay: j * 70, life: 420, pop: 60 });
        fx.sparks(px, py - 4, { colors: ['#ffffff', '#fff6d0'], n: 4, speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: j * 70, life: 220 });
      });
      // さいごに 光る 道具の かたち
      prop(c, 'light', px, py - 30, { s: 1.6, glow: '#fff6b0', delay: c.hit, life: c.len - c.hit - 60, pop: 120 });
      c.k.sparkles(px, py - 30, { n: 6, r: 14, delay: c.hit, life: 300 });
      fx.sparks(px, py - 30, { colors: ['#ffffff', '#ffe066'], n: 14, speed: 90, delay: c.hit, life: 300 });
    },
  },
  ax_suzu_no_ne: {
    charge: { color: '#ffd23a', color2: '#ffffff', power: 0.8 },
    sfx: 'ax_g1_suzu', allyFx: 'sleep',
    play(fx, c) {
      const o = org(c, 12);
      prop(c, 'bell', o.x, o.y, { s: 2.2, swing: 0.5, life: c.len - 80, pop: 100, glow: '#ffe066' });
      for (let j = 0; j < 3; j++) fx.shock(o.x, o.y, { r0: 8, r1: 90, color: '#ffe066', w: 1.8, delay: j * 110, life: 420 });
      // チリンチリーン（すずの まわりの きらめき・ねむりの 音ぷ）
      fx.sparks(o.x, o.y, { colors: ['#ffe066', '#ffffff', '#fff6b0'], n: 18, speed: 70, delay: 40, life: 360, len: 4 });
      c.k.sparkles(o.x, o.y, { n: 6, r: 16, delay: 0, life: 260, gap: 50 });
      drift(c, ['#ffe066', '#bfe4ff', '#ffffff'], 14, { y0: 20, y1: c.H * 0.6, from: c.hit, to: c.len - 400, vy: -10 });
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) fx.shock(t.x, t.y, { r0: 6, r1: 30, color: '#fff6b0', w: 1.4, delay: c.hit + d + j * 100, life: 300 });
        c.k.shapes(t.x, t.y - 10, { shape: 'note', n: N(c, 5), colors: ['#ffe066', '#ffffff', '#bfe4ff'], speed: 30, ang: -Math.PI / 2, spread: 0.9, size: 3, delay: c.hit + d, life: 420, add: false });
        mark(c, 'Z', t.x + 14, t.y - 20, { size: 4, color: '#bfe4ff', color2: '#1a3a6a', vy: -12, delay: c.hit + d + 100, life: c.len - c.hit - 160 - d });
        fx.sparks(t.x, t.y, { colors: ['#ffe066', '#ffffff'], n: N(c, 10), speed: 60, delay: c.hit + d, life: 300 });
      });
    },
  },
  ax_robot_tackle: {
    charge: { color: '#2a9aff', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_tackle', allyFx: 'claw',
    play(fx, c) {
      let p0 = org(c);
      c.each((t, i, d) => {
        const st = i === 0 ? 0 : c.hit - 120 + d;
        prop(c, 'robo', p0.x, p0.y, { to: t, travel: i === 0 ? c.hit : 120, start: 0, s: 1.4 * c.sz, delay: st, life: (i === 0 ? c.hit : 120) + 60, pop: 0, fade: 40 });
        c.k.dash(p0.x, p0.y, t.x, t.y, { color: '#2a9aff', travel: i === 0 ? c.hit : 120, w: 6, n: 2, delay: st });
        trail(c, p0.x, p0.y, t.x, t.y, i === 0 ? c.hit : 120, ['#bfe4ff', '#ffffff'], N(c, 6), st);
        pokan(c, t.x, t.y, c.hit + d, DORA, { r: 14, n: 16, stars: 5 });
        p0 = t;
      });
    },
  },
  ax_nekorobo_fullpower: {
    charge: { color: '#2a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_fullpower', allyFx: 'claw',
    play(fx, c) {
      const o = org(c, 10);
      // 歯車が 3つ 回る
      for (let j = 0; j < 3; j++) prop(c, 'gear', o.x + (j - 1) * 16, o.y - (j === 1 ? 10 : 0), { s: 1.4 - (j % 2) * 0.3, spin: j % 2 ? -12 : 12, life: 260, pop: 60, glow: '#bfe4ff' });
      // 青い 光の 体当たりが 敵ぜんぶを ジグザグ
      const pts = [o, ...c.targets.map((t, i) => ({ x: t.x, y: t.y + (i % 2 ? -6 : 6) }))];
      if (c.n === 1) pts.push({ x: c.t.x + 30, y: c.t.y - 20 });
      const travel = c.hit + (c.n - 1) * c.stagger;
      path(c, pts, { color: '#2a9aff', glow: '#bfe4ff', w: 4, travel: travel * (c.n === 1 ? 1.5 : 1), tail: 0.4 });
      fx.sparks(o.x, o.y, { colors: ['#bfe4ff', '#ffffff', '#a8b0c8'], n: 16, speed: 90, delay: 40, life: 300 });
      for (let j = 1; j < pts.length; j++) trail(c, pts[j - 1].x, pts[j - 1].y, pts[j].x, pts[j].y, travel / (pts.length - 1), ['#2a9aff', '#ffffff'], N(c, 4), travel * (j - 1) / (pts.length - 1));
      c.each((t, i, d) => {
        pokan(c, t.x, t.y, c.hit + d, DORA, { r: 15, n: 14, stars: 3 });
        for (let j = 0; j < 3; j++) prop(c, j ? 'screw' : 'gear', t.x, t.y, { vx: c.rnd(-80, 80), vy: c.rnd(-150, -80), g: 420, spin: c.rnd(-10, 10), s: 1, delay: c.hit + d, life: 380, pop: 40 });
        fx.shock(t.x, t.y, { r0: 6, r1: 40, color: '#2a9aff', w: 2, delay: c.hit + d + 40, life: 320 });
      });
    },
  },
  ax_dorayaki_wake: {
    charge: { color: '#ffb03a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_pon2', allyFx: 'heal',
    play(fx, c) {
      const cx = c.W / 2, cy = c.H - 64;
      prop(c, 'dorayaki', cx, cy, { s: 2.6, life: 130, pop: 100, fade: 40 });
      fx.sparks(cx, cy, { colors: ['#ffe066', '#ffffff', '#b8682a'], n: 14, speed: 100, delay: 110, life: 260 });
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const py = a.ally ? c.H - 40 : a.y - 22;
        prop(c, 'dorayaki', cx, cy, { to: { x: a.x, y: py }, travel: c.hit - 120, start: 120, hop: 16, s: 1.3, spin: 4, life: c.hit + 120, pop: 0, shrink: c.hit });
        c.k.shapes(a.x, py, { shape: 'heart', n: 2, colors: ['#ff7ab8', '#ffb0d8'], speed: 24, ang: -Math.PI / 2, spread: 0.6, size: 3, delay: c.hit, life: 360, add: false });
        healFx(c, a, c.hit + d * 0.5, HEAL, { n: N(c, 12) });
      });
    },
  },
  // ───────────── 耳無しネコ型ロボット ─────────────
  ax_manmaru_zutsuki: {
    charge: { color: '#2a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_gotsun', allyFx: 'claw',
    play(fx, c) {
      const t = c.t, o = org(c);
      prop(c, 'robo', o.x, o.y, { to: t, travel: c.hit, s: 2 * c.sz, hop: c.fromAlly ? 14 : -10, spin: 3, life: c.hit + 120, pop: 0, fade: 80 });
      c.k.dash(o.x, o.y, t.x, t.y, { color: '#2a9aff', travel: c.hit, w: 8, n: 2 });
      trail(c, o.x, o.y, t.x, t.y, c.hit, ['#bfe4ff', '#ffffff'], 8);
      pokan(c, t.x, t.y, c.hit, STAR, { r: 22, n: 30, stars: 10, heavy: [180, 1.8], debris: 8 });
      c.k.speedLines(t.x, t.y, { n: 18, delay: c.hit, life: 220 });
      fx.shock(t.x, t.y, { r0: 8, r1: 60, color: '#ffe066', w: 2.4, delay: c.hit + 50, life: 360 });
      fx.sparks(t.x, t.y - 22, { colors: ['#ffe066', '#ffffff'], n: 16, speed: 40, delay: c.hit + 120, life: 500, len: 3 });
      fx.star(t.x, t.y, '#ffffff', 26, c.hit, 300);
      // ひよこ（黄色い 点）が まわる
      mark(c, 'dizzy', t.x, t.y - 22 * c.sz, { size: 9 * c.sz, color: '#ffe066', color2: '#5a3a10', spin: 5, delay: c.hit + 80, life: c.len - c.hit - 100 });
      for (let j = 0; j < 3; j++) fx.add({ kind: 'axShape', shape: 'circle', x: t.x + Math.cos(j * 2.1) * 10, y: t.y - 22 * c.sz, vx: Math.cos(j * 2.1 + 1.6) * 30, vy: 0, g: 0, color: '#ffe066', size: 1.8, delay: c.hit + 100, life: c.len - c.hit - 140, add: false, pop: true });
    },
  },
  ax_oonaki: {
    charge: { color: '#7ad8ff', color2: '#ffffff' },
    sfx: 'ax_g1_wahn', allyFx: 'water',
    play(fx, c) {
      const o = org(c, 14);
      // 両目から 噴水の ような なみだの 弧
      for (let j = 0; j < 6; j++) {
        const sx = j % 2 ? 1 : -1;
        const t = c.targets[j % c.n];
        const tx = c.n > 1 ? t.x : t.x + sx * 14;
        arc(c, o.x + sx * 4, o.y, tx, t.y, { hop: 30 + j * 4, w: 3, color: '#5ab8ff', color2: '#e8f8ff', travel: c.hit - 40, hold: c.hit + 40, delay: j * 30, life: c.hit + 220 });
      }
      for (let j = 0; j < 3; j++) fx.shock(o.x, o.y, { r0: 6, r1: 80, color: '#bfe8ff', w: 1.6, delay: j * 160, life: 420 });
      // 目もとから とびちる なみだの しずく
      for (let j = 0; j < 26; j++) fx.drop(o.x + (j % 2 ? 4 : -4), o.y, { color: j % 3 ? '#7ad8ff' : '#e8f8ff', vx: (j % 2 ? 1 : -1) * c.rnd(40, 140), vy: c.rnd(-160, -60), g: 360, size: c.rnd(1.1, 1.9), delay: c.rnd(0, c.len * 0.5), life: 520 });
      drift(c, ['#bfe8ff', '#ffffff'], 22, { from: c.hit, to: c.len - 400, vy: -12 });
      c.each((t, i, d) => {
        c.k.splash(t.x, t.y, { cols: WATER.list, n: N(c, 16), delay: c.hit + d });
        for (let j = 0; j < N(c, 8); j++) fx.drop(t.x + c.rnd(-12, 12), t.y - c.rnd(10, 20), { color: '#7ad8ff', vx: c.rnd(-20, 20), vy: c.rnd(-20, 20), g: 300, size: 1.4, delay: c.hit + d + 80, life: 420 });
        mark(c, 'sweat', t.x + 14, t.y - 14, { size: 4, color: '#7ad8ff', color2: '#1a4a8a', delay: c.hit + d + 120, life: 360 });
      });
    },
  },
  ax_dorayaki_ooguui: {
    charge: { color: '#ffb03a', color2: '#ffffff' },
    sfx: 'ax_g1_mogu', allyFx: 'heal',
    play(fx, c) {
      const a = selfAt(c, c.t);
      const by = a.ally ? c.H - 30 : a.y + 8;
      // どら焼きの 山が どんどん 消える（ぱくぱく）
      for (let j = 0; j < 5; j++) {
        const px = a.x + (j % 2 ? 6 : -6) * (j > 2 ? 0 : 1), py = by - j * 6;
        prop(c, 'dorayaki', px, py, { s: 1.5, delay: j * 30, life: c.hit + 40 - (4 - j) * 0 - j * 50 + 120, pop: 80, fade: 40, shrink: c.hit - j * 50 });
        fx.sparks(px, py, { colors: ['#b8682a', '#e8a050'], n: 5, speed: 60, delay: c.hit + 80 - j * 50, life: 240 });
      }
      c.k.shapes(a.x, by - 30, { shape: 'heart', n: 4, colors: ['#ff7ab8', '#ffb0d8'], speed: 30, ang: -Math.PI / 2, spread: 0.7, size: 3, delay: c.hit, life: 380, add: false });
      healFx(c, a, c.hit, HEAL, { n: 18 });
    },
  },
  ax_robot_shuuri: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_g1_shuuri', allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const cy = a.y - 18;
        // スパナと ドライバーが 回る
        prop(c, 'wrench', a.x - 16, cy, { to: { x: a.x + 16, y: cy }, travel: c.hit, hop: 12, spin: 12, s: 1.4, delay: d, life: c.hit + 80 });
        prop(c, 'driver', a.x + 16, cy + 6, { to: { x: a.x - 16, y: cy + 6 }, travel: c.hit, hop: -12, spin: -10, s: 1.4, delay: d, life: c.hit + 80 });
        prop(c, 'gear', a.x, cy - 10, { spin: 8, s: 1.3, glow: '#c8ffe0', delay: d, life: c.hit + 160 });
        // カチャカチャ（工具の 火花）
        for (let j = 0; j < 4; j++) fx.sparks(a.x + c.rnd(-8, 8), cy + c.rnd(-4, 4), { colors: ['#ffffff', '#ffe066', '#d0d8e8'], n: N(c, 4), speed: 90, delay: d + j * 70, life: 200, len: 4 });
        healFx(c, a, d + c.hit, HEAL, { n: N(c, 14) });
        c.k.sparkles(a.x, cy, { n: 4, r: 12, colors: ['#ffffff', '#d0d8e8'], delay: d + c.hit + 100, life: 260 });
      });
    },
  },
  ax_nezumi_kowai: {
    charge: { color: '#2a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_gyaa', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c, 10);
      // 画面の はしに 小さな ネズミが ちょろっ
      prop(c, 'mouse', -10, c.H - 18, { to: { x: 50, y: c.H - 18 }, travel: 220, s: 1.5, life: 300, pop: 0 });
      mark(c, '!', o.x + 10, o.y - 20, { size: 7, color: '#ff3a3a', color2: '#ffffff', life: 300 });
      mark(c, 'sweat', o.x - 12, o.y - 14, { size: 4, color: '#7ad8ff', color2: '#1a4a8a', life: 360 });
      k.shake(240, 2, 40);
      // 青い 影が あちこち 飛びはねる
      const pts = [o, ...c.targets.flatMap((t, i) => [{ x: t.x + (i % 2 ? 20 : -20), y: t.y - 30 }, { x: t.x, y: t.y }])];
      path(c, pts, { color: '#2a9aff', glow: '#bfe4ff', w: 3, travel: c.hit + (c.n - 1) * c.stagger, tail: 0.3 });
      const tools = ['hammer', 'cannon', 'pot'];
      c.each((t, i, d) => {
        const m = c.n > 3 ? 1 : c.n > 2 ? 2 : 3;
        for (let j = 0; j < m; j++) prop(c, tools[(i + j) % 3], t.x + c.rnd(-20, 20), t.y - 50, { to: { x: t.x + c.rnd(-6, 6), y: t.y - 4 }, travel: 120, start: c.hit - 120 + d + j * 70, s: 1.4, spin: c.rnd(-8, 8), life: c.hit + d + j * 70 + 60, pop: 0, fade: 30 });
        for (let j = 0; j < m; j++) pokan(c, t.x + c.rnd(-6, 6), t.y + c.rnd(-6, 6), c.hit + d + j * 70, DORA, { r: 12, n: 8, stars: 2 });
        for (let j = 0; j < N(c, 6); j++) fx.puff(t.x + c.rnd(-14, 14), t.y + c.rnd(-10, 8), { color: j % 2 ? '#8a8090' : '#6a6070', r0: 6, r1: 18, vx: c.rnd(-10, 10), vy: c.rnd(-10, -2), life: 360, alpha: 0.7, delay: c.hit + d + 240 });
      });
      for (let j = 1; j < pts.length; j++) trail(c, pts[j - 1].x, pts[j - 1].y, pts[j].x, pts[j].y, 60, ['#2a9aff', '#ffffff'], N(c, 4), (c.hit + (c.n - 1) * c.stagger) * (j - 1) / (pts.length - 1));
      drift(c, ['#bfe4ff', '#ffffff', '#ffe066'], N(c, 20), { from: c.hit, to: c.len - 400, vy: -16 });
      // ネズミが にげて いく
      prop(c, 'mouse', c.W - 40, c.H - 16, { to: { x: c.W + 14, y: c.H - 16 }, travel: 200, start: 0, s: 1.5, flip: true, delay: c.len - 320, life: 220, pop: 0 });
      k.shake(300, 2.2, c.hit);
    },
  },
  ax_maru_kaiten: {
    charge: { color: '#2a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_gorogoro', allyFx: 'claw',
    play(fx, c) {
      let p0 = org(c);
      c.each((t, i, d) => {
        const tr = i === 0 ? c.hit : c.stagger;
        const st = i === 0 ? 0 : c.hit + d - c.stagger;
        prop(c, 'robo', p0.x, p0.y, { to: t, travel: tr, s: 1.8 * c.sz, spin: 28, spinLines: true, delay: st, life: tr + (i === c.n - 1 ? 260 : 10), pop: 0, fade: 60 });
        c.k.dash(p0.x, p0.y, t.x, t.y, { color: '#2a9aff', travel: tr, w: 7, n: 2, delay: st });
        trail(c, p0.x, p0.y, t.x, t.y, tr, ['#bfe4ff', '#ffffff', '#d8c8a0'], N(c, 8), st);
        pokan(c, t.x, t.y, c.hit + d, DORA, { r: 18, n: 22, stars: 8, debris: 6 });
        fx.shock(t.x, t.y + 16, { r0: 6, r1: 44, sy: 0.3, color: '#ffffff', w: 2, delay: c.hit + d, life: 360 });
        // 星の 列
        for (let j = 0; j < 3; j++) fx.twinkle(t.x + (j - 1) * 10, t.y - 18 - Math.abs(j - 1) * 4, { color: '#ffe066', size: 5, delay: c.hit + d + 60 + j * 40, life: 300 });
        if (c.n === 1) fx.sparks(t.x, t.y + 14, { colors: ['#d8c8a0', '#ffffff'], n: 10, speed: 70, ang: -Math.PI / 2, spread: 1.2, g: 120, delay: c.hit, life: 360 });
        p0 = t;
      });
      c.k.shake(200, 1.6, c.hit);
    },
  },
  // ───────────── ドラえもん ─────────────
  ax_kuukihou: {
    charge: { color: '#5ad87a', color2: '#ffffff' },
    sfx: 'ax_g1_dokan', allyFx: 'wind',
    play(fx, c) {
      const t = c.t, o = org(c, 4);
      const ang = Math.atan2(t.y - o.y, t.x - o.x);
      prop(c, 'cannon', o.x, o.y, { rot: ang, s: 1.8, life: c.len - 120, pop: 80 });
      const mx = o.x + Math.cos(ang) * 10, my = o.y + Math.sin(ang) * 10;
      fx.converge(mx, my, { colors: ['#ffffff', '#c8f0ff'], n: 12, r: 30, life: 120 });
      // すきとおった 空気の 輪が 3つ 連続
      for (let j = 0; j < 3; j++) air(c, mx, my, t.x, t.y, { r: (11 + j * 2) * c.sz, start: 40 + j * 60, travel: c.hit - 40 - 120 + 120 - j * 0, delay: 0, life: 40 + j * 60 + c.hit - 40 + 40 });
      fx.shock(mx, my, { r0: 3, r1: 20, color: '#ffffff', w: 1.6, delay: 40, life: 200 });
      // 敵に 空気の 衝撃波（ゆがんだ 輪）・ちり
      for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 6, r1: 50 + j * 16, color: j ? '#c8f0ff' : '#ffffff', w: 3 - j * 0.6, delay: c.hit + 60 + j * 60, life: 360 });
      kiHit(c, t.x, t.y, c.hit + 120, { main: '#ffffff', glow: '#c8f0ff', core: '#ffffff', list: ['#ffffff', '#c8f0ff', '#e0d8c8'] }, { r: 20, n: 26, smoke: 4, debris: 8, heavy: [200, 2] });
      c.k.speedLines(t.x, t.y, { n: 16, delay: c.hit + 120, life: 220 });
      // 空気に すわれる ちり・はじける ちり
      fx.sparks(t.x, t.y, { colors: ['#ffffff', '#c8f0ff', '#e0d8c8'], n: 26, speed: 220, delay: c.hit + 100, life: 380, len: 8 });
      trail(c, mx, my, t.x, t.y, c.hit, ['#ffffff', '#c8f0ff'], 6, 40);
    },
  },
  ax_smalllight: {
    charge: { color: '#fff27a', color2: '#ffffff' },
    sfx: 'ax_g1_light', allyFx: 'debuff',
    play(fx, c) {
      const t = c.t, o = org(c, 4);
      const ang = Math.atan2(t.y - o.y, t.x - o.x);
      prop(c, 'light', o.x, o.y, { rot: ang, s: 1.8, life: c.len - 100, pop: 80 });
      cone(c, o.x + Math.cos(ang) * 10, o.y + Math.sin(ang) * 10, t.x, t.y, { spread: 0.22, over: 14, color: '#fff27a', color2: '#ffffff', delay: 60, life: c.len - 160 });
      // 敵の 形の 光の わくが 小さく ちぢむ
      for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 34 * c.sz, r1: 6, color: '#fff27a', w: 2, delay: c.hit - 80 + j * 120, life: 320 });
      fx.glow(t.x, t.y, { color: '#fff6b0', r: 30, delay: c.hit, life: 360 });
      for (let j = 0; j < 3; j++) mark(c, 'down', t.x + (j - 1) * 14, t.y - 26, { size: 5, color: '#ff8a8a', color2: '#5a1a1a', vy: 18, delay: c.hit + 60 + j * 60, life: 360 });
      fx.sparks(t.x, t.y, { colors: ['#fff27a', '#ffffff'], n: 30, speed: 40, g: 40, delay: c.hit, life: 500 });
      c.k.sparkles(t.x, t.y, { n: 8, r: 20, delay: c.hit, life: 300 });
      // 光の なかを ながれる つぶ
      for (let j = 0; j < 5; j++) fx.sparks(o.x, o.y, { colors: ['#fff27a', '#ffffff'], n: 8, speed: 160, ang, spread: 0.18, g: 0, drag: 1, delay: 60 + j * 70, life: 420, len: 6 });
    },
  },
  ax_takecopter: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_g1_copter', allyFx: 'wind',
    play(fx, c) {
      darken(c, 0.2, c.len - 60);
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const hy = a.ally ? c.H - 50 : a.y - 26;
        prop(c, 'copter', a.x + 30, hy + 30, { to: { x: a.x, y: hy }, travel: c.hit - 40, hop: 10, s: 1.8, delay: d, life: c.len - 100 - d, pop: 60 });
        wind(c, a.x, hy + 4, { w: 24, h: 40, dir: 1, n: 14, delay: d + c.hit, life: c.len - c.hit - 140 - d });
        fx.sparks(a.x, hy + 6, { colors: ['#ffffff', '#e8f8ff'], n: N(c, 14), speed: 70, ang: Math.PI / 2, spread: 0.5, g: 30, delay: d + c.hit, life: 380, len: 5 });
        for (let j = 0; j < 3; j++) fx.shock(a.x, a.foot - 4, { r0: 6, r1: 40 + j * 10, sy: 0.3, color: '#ffffff', w: 1.6, delay: d + c.hit + j * 100, life: 380 });
        healFx(c, a, d + c.hit, { main: '#ffe066', glow: '#fff6b0', core: '#ffffff', list: ['#ffffff', '#fff6b0', '#ffe066'] }, { n: N(c, 16), up: '#ffe066' });
      });
    },
  },
  ax_himitsu_dougu: {
    charge: { color: '#2a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_tetere', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35, c.len - 60);
      const a = selfAt(c, c.t);
      const py = a.ally ? c.H - 28 : a.y + 4;
      prop(c, 'pocket', a.x, py, { s: 1.6, life: c.len - 60, pop: 80 });
      // ポケットから 光が あふれる
      fx.glow(a.x, py, { color: '#fff6d0', r: 26, life: 420 });
      fx.sparks(a.x, py, { colors: ['#ffffff', '#fff6d0', '#bfe4ff'], n: 24, speed: 120, ang: -Math.PI / 2, spread: 0.8, delay: 60, life: 360 });
      // 頭の 上に 道具（どこでもドア・空気ほう・タケコプター・ビッグライト から ランダム）
      const item = ['door', 'cannon', 'copter', 'light'][Math.floor(c.rnd(0, 4))];
      const iy = a.ally ? c.H - 74 : a.y - 34;
      bg(c, 'rays', { x: a.x, y: iy, color: '#fff6b0', color2: null, a: 0.5, delay: c.hit - 100, life: c.len - c.hit + 40, fin: 80 });
      prop(c, item, a.x, py, { to: { x: a.x, y: iy }, travel: c.hit - 100, start: 100, s: item === 'door' ? 2.6 : 3.6, rot: item === 'cannon' || item === 'light' ? -0.4 : 0, life: c.len - 80, pop: 0, glow: '#ffffff', open: item === 'door' ? 0.5 : null });
      k.flash('#ffffff', 100, c.hit);
      fx.shock(a.x, iy, { r0: 6, r1: 70, color: '#fff6b0', w: 2.4, delay: c.hit, life: 400 });
      k.sparkles(a.x, iy, { n: 14, r: 34, delay: c.hit, life: 360, gap: 40 });
      fx.sparks(a.x, iy, { colors: ['#ffffff', '#ffe066', '#bfe4ff'], n: 30, speed: 110, delay: c.hit, life: 460 });
    },
  },
  ax_time_furoshiki: {
    charge: { color: '#e83a3a', color2: '#3a6aff' },
    sfx: 'ax_g1_furoshiki', allyFx: 'heal',
    play(fx, c) {
      darken(c, 0.25, c.len - 60);
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const cy = a.ally ? c.H - 34 : a.y;
        // 赤い ふろしきが ひらりと かぶさる
        prop(c, 'furoshiki', a.x - 20, cy - 50, { to: { x: a.x, y: cy }, travel: 260, hop: -12, s: 1.8, swing: 0.25, delay: d, life: c.hit + 60, pop: 60, fade: 60 });
        // 時計の 針が 逆回り
        prop(c, 'clock', a.x + 22, cy - 26, { s: 1.5, delay: d + 120, life: c.hit, pop: 100 });
        fx.swirl(a.x, cy, ['#ffffff', '#fff6b0'], { n: N(c, 16), rad: 18, h: 20, delay: d + 200, life: 400 });
        // ふろしきが とれて 光
        prop(c, 'furoshiki', a.x, cy, { vx: 40, vy: -80, g: 60, s: 1.8, spin: 3, delay: d + c.hit, life: 380, pop: 0, fade: 200 });
        c.k.pillar(a.x, cy + 10, { w: 12, color: '#c8ffe0', glow: '#ffffff', delay: d + c.hit, life: 420, burst: false });
        healFx(c, a, d + c.hit, HEAL, { n: N(c, 18), tw: 8 });
        c.k.sparkles(a.x, cy - 10, { n: 6, r: 18, colors: ['#ffffff', '#fff6b0'], delay: d + c.hit + 100, life: 300 });
      });
    },
  },
  ax_chikyu_hakai_bakudan: {
    charge: { color: '#ff8a2a', color2: '#ffffff' },
    sfx: 'ax_g1_bakudan', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4, c.len - 60);
      const o = org(c, 10);
      mark(c, 'sweat', o.x - 14, o.y - 10, { size: 5, color: '#7ad8ff', color2: '#1a4a8a', life: 400 });
      mark(c, 'sweat', o.x + 16, o.y - 4, { size: 4, color: '#7ad8ff', color2: '#1a4a8a', delay: 80, life: 340 });
      // 大きな 黒い 爆弾が ずるずる → まん中に ころがる
      const cx = c.center.x, cy = c.center.y + 8;
      prop(c, 'bomb', o.x, o.y + 10, { to: { x: o.x, y: o.y - 14 }, travel: 160, s: 1.6, life: 200, pop: 60, fade: 10 });
      prop(c, 'bomb', o.x, o.y - 14, { to: { x: cx, y: cy }, travel: 300, start: 0, hop: 20, spin: 6, s: 1.6, delay: 190, life: c.hit - 190, pop: 0, fade: 20 });
      // 導火線の 火花
      for (let j = 0; j < 6; j++) fx.sparks(cx + 10, cy - 18, { colors: ['#ffe066', '#ff8a2a', '#ffffff'], n: 4, speed: 80, ang: -Math.PI / 2, spread: 1, g: 200, delay: 500 + j * 20, life: 200 });
      // マンガの 爆発が 画面いっぱい
      boom(c, cx, cy, { r: c.all ? 84 : 64, spikes: 14, delay: c.hit, grow: 200, life: 700 });
      boom(c, cx + c.rnd(-30, 30), cy - 10, { r: 34, delay: c.hit + 120, grow: 140, life: 480 });
      k.flash('#ffffff', 140, c.hit);
      k.shake(440, 3, c.hit);
      c.each((t, i, d) => {
        kiHit(c, t.x, t.y, c.hit + d, { main: '#ff8a2a', glow: '#fff27a', core: '#ffffff', list: ['#ffffff', '#fff27a', '#ff4a1a'] }, { r: 16, n: 16, debris: 6 });
        // 黒い けむりの 中で ぐるぐる
        mark(c, 'dizzy', t.x, t.y - 22, { size: 8, color: '#ffe066', color2: '#20202a', spin: 6, delay: c.hit + d + 360, life: c.len - c.hit - 420 - d });
      });
      for (let j = 0; j < 12; j++) fx.puff(cx + c.rnd(-60, 60), cy + c.rnd(-20, 14), { color: j % 2 ? '#2a2428' : '#4a4048', r0: 6, r1: 22, vx: c.rnd(-16, 16), vy: c.rnd(-16, -4), life: 520, alpha: 0.75, delay: c.hit + 300 + j * 10 });
      // ボカーン の 火花・はへん・ただよう 火の粉
      fx.sparks(cx, cy, { colors: ['#ffffff', '#fff27a', '#ff8a2a', '#e8401a'], n: 40, speed: 260, delay: c.hit, life: 520, len: 10, size: 1.3 });
      k.debris(cx, cy + 10, { n: 14, up: 160, delay: c.hit });
      drift(c, ['#ff8a2a', '#fff27a', '#ffffff'], 30, { from: c.hit + 100, to: c.len - 400, vy: -26 });
    },
  },
  ax_biglight: {
    charge: { color: '#fff27a', color2: '#ffffff' },
    sfx: 'ax_g1_biglight', allyFx: 'buff',
    play(fx, c) {
      darken(c, 0.3, c.len - 60);
      const a = selfAt(c, c.t);
      const ly = a.ally ? c.H - 80 : a.y - 50;
      const lx = a.x + (a.x < c.W / 2 ? 46 : -46);
      prop(c, 'light', lx, ly, { rot: Math.atan2(a.y - ly, a.x - lx), s: 2.2, life: c.len - 100, pop: 80, color: '#3a8aff', color2: '#8ac8ff' });
      cone(c, lx, ly, a.x, a.y - 14, { spread: 0.3, over: 16, color: '#fff27a', color2: '#ffffff', delay: 60, life: c.hit + 200 });
      // 体の 光の わくが 2倍に ふくらむ
      for (let j = 0; j < 3; j++) fx.shock(a.x, a.y - 14, { r0: 12, r1: 50 + j * 16, color: '#fff27a', w: 2.6 - j * 0.6, delay: c.hit + j * 90, life: 420 });
      ghost(c, a.x, a.y - 44, { s: 1.4, color: '#fff27a', delay: c.hit - 60, life: 380, flick: false });
      ghost(c, a.x, a.y - 66, { s: 2.6, color: '#fff6b0', delay: c.hit + 40, life: c.len - c.hit - 120, flick: false });
      for (let j = 0; j < 3; j++) mark(c, 'up', a.x + (j - 1) * 18, a.y - 30, { size: 6, color: '#ffe066', color2: '#5a3a10', vy: -24, delay: c.hit + 100 + j * 60, life: 380 });
      fx.sparks(a.x, a.y - 14, { colors: ['#ffffff', '#fff27a'], n: 26, speed: 100, ang: -Math.PI / 2, spread: 1, delay: c.hit, life: 420 });
      for (let j = 0; j < 3; j++) fx.sparks(lx, ly, { colors: ['#fff27a', '#ffffff'], n: 6, speed: 150, ang: Math.atan2(a.y - 14 - ly, a.x - lx), spread: 0.25, g: 0, drag: 1, delay: 60 + j * 90, life: 380, len: 6 });
      c.k.sparkles(a.x, a.y - 40, { n: 8, r: 26, delay: c.hit + 60, life: 300 });
    },
  },
  // ───────────── カッパ ─────────────
  ax_kappa_tsuppari: {
    charge: { color: '#3ab84a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_bashi', allyFx: 'claw',
    play(fx, c) {
      const t = c.t;
      for (let j = 0; j < 6; j++) {
        const sx = j % 2 ? 1 : -1;
        const hx = t.x + sx * 4 + c.rnd(-4, 4), hy = t.y + c.rnd(-8, 6);
        const dd = c.hit - 70 + j * 70;
        fist(c, hx + sx * 34, hy + 20, hx, hy, { style: 'palm', s: 1.2 * c.sz, color: '#4ac85a', glow: '#b8f0a0', travel: 70, life: 140, delay: dd - 70 + 70 - 70 + 0 });
        fx.star(hx, hy, '#ffffff', 9, dd, 160);
        fx.sparks(hx, hy, { colors: KAPPA.list, n: 7, speed: 130, delay: dd, life: 260, len: 5 });
        fx.shock(hx, hy, { r0: 3, r1: 18, color: '#ffffff', w: 1.4, delay: dd, life: 200 });
      }
      c.k.shake(120, 1.2, c.hit);
      fx.glow(t.x, t.y, { color: '#b8f0a0', r: 26, delay: c.hit, life: 420 });
    },
  },
  ax_kyuuri_kajiru: {
    charge: { color: '#3ab84a', color2: '#ffffff', power: 0.6 },
    sfx: 'ax_g1_pori', allyFx: 'heal',
    play(fx, c) {
      const a = selfAt(c, c.t);
      const py = a.ally ? c.H - 40 : a.y - 20;
      prop(c, 'cucumber', a.x, py, { s: 1.6, rot: -0.3, bites: 70, life: c.hit + 100, pop: 60 });
      for (let j = 0; j < 3; j++) fx.sparks(a.x + 8 - j * 3, py, { colors: ['#c8f0a0', '#3ab84a'], n: 4, speed: 50, g: 200, delay: 70 + j * 70, life: 260 });
      healFx(c, a, c.hit, HEAL, { n: 14 });
    },
  },
  ax_mizudeppou: {
    charge: { color: '#3a9aff', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_pyu', allyFx: 'water',
    play(fx, c) {
      const o = org(c, 6);
      c.each((t, i, d) => {
        arc(c, o.x, o.y, t.x, t.y, { hop: c.fromAlly ? 26 : 10, w: 3.2, color: '#3a9aff', color2: '#e8f8ff', travel: c.hit, hold: c.hit + 40, delay: d, life: c.hit + 200 });
        c.k.splash(t.x, t.y, { cols: WATER.list, n: N(c, 18), delay: c.hit + d });
        fx.shock(t.x, t.y + 18, { r0: 4, r1: 34, sy: 0.3, color: '#7ac8ff', w: 1.8, delay: c.hit + d + 80, life: 420 });
        fx.glow(t.x, t.y, { color: '#bfe8ff', r: 18, delay: c.hit + d, life: 260 });
        // 水の 線から こぼれる しずく
        for (let j = 1; j < 6; j++) { const u = j / 6; fx.drop(lerp(o.x, t.x, u), lerp(o.y, t.y, u) - (c.fromAlly ? 26 : 10) * Math.sin(u * Math.PI), { color: j % 2 ? '#7ac8ff' : '#e8f8ff', vx: c.rnd(-20, 20), vy: c.rnd(-30, 10), g: 300, size: 1.3, delay: d + c.hit * u, life: 360 }); }
        fx.sparks(t.x, t.y, { colors: WATER.list, n: N(c, 12), speed: 160, delay: c.hit + d, life: 300, len: 6 });
      });
    },
  },
  ax_osara_nurasu: {
    charge: { color: '#7ac8ff', color2: '#ffffff', power: 0.6 },
    sfx: 'ax_g1_picho', allyFx: 'buff',
    play(fx, c) {
      const a = selfAt(c, c.t);
      const py = a.ally ? c.H - 44 : a.y - 24;
      prop(c, 'plate', a.x, py, { s: 1.8, life: c.len - 60, pop: 80 });
      for (let j = 0; j < 3; j++) prop(c, 'drop', a.x + (j - 1) * 5, py - 40, { to: { x: a.x + (j - 1) * 5, y: py - 2 }, travel: 120, start: 0, s: 1.2, color: '#7ac8ff', delay: j * 70, life: 130, pop: 0, fade: 20 });
      for (let j = 0; j < 3; j++) c.k.splash(a.x, py, { cols: WATER.list, n: 4, power: 0.4, delay: 120 + j * 70 });
      fx.twinkle(a.x + 6, py - 2, { color: '#ffffff', size: 8, delay: c.hit, life: 280 });
      healFx(c, a, c.hit, WATER, { n: 12, up: '#7ac8ff' });
    },
  },
  ax_kappa_zumou: {
    charge: { color: '#3ab84a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_dosukoi', allyFx: 'claw',
    play(fx, c) {
      const t = c.t, o = org(c);
      c.k.dash(o.x, o.y, t.x, t.y, { color: '#3ab84a', travel: c.hit, w: 8, n: 3 });
      fx.puff(o.x, o.y + 6, { color: '#d8c8a0', r0: 4, r1: 14, life: 360, alpha: 0.6 });
      // 土俵の 輪
      fx.shock(t.x, t.y + 18, { r0: 30, r1: 44, sy: 0.3, color: '#ffffff', w: 2.4, delay: c.hit, life: 460 });
      pokan(c, t.x, t.y, c.hit, { main: '#ffffff', glow: '#b8f0a0', core: '#ffffff', list: ['#ffffff', '#b8f0a0', '#d8c8a0'] }, { r: 18, n: 22, smoke: 3, debris: 8, heavy: [140, 1.6] });
      for (let j = 0; j < 6; j++) fx.puff(t.x + c.rnd(-20, 20), t.y + 18, { color: '#d8c8a0', r0: 3, r1: 12, vx: c.rnd(-40, 40), vy: -10, life: 420, alpha: 0.55, delay: c.hit });
    },
  },
  ax_kawanagare: {
    charge: { color: '#3a9aff', color2: '#ffffff' },
    sfx: 'ax_g1_zabaan', allyFx: 'water',
    play(fx, c) {
      const cy = c.center.y + 4;
      // 左から 右へ 青い 川の 帯が 流れて 敵を のみこむ（あたまが まん中に つく 時間が あたる 時間）
      const v = (c.center.x + 24) / Math.max(1, c.hit);
      fx.add({ kind: 'g1River', x: c.center.x, y: cy, v, half: c.all ? 30 : 24, start: -24, tailAt: c.hit + 160, life: c.len - 40 });
      c.k.streaks({ ang: 0, color: '#bfe8ff', n: 20, life: c.len - 80, alpha: 0.5 });
      // 川の あわ・しぶき（左から 右へ）
      for (let j = 0; j < 26; j++) fx.add({ kind: 'spark', x: c.rnd(-20, c.W * 0.5), y: cy + c.rnd(-26, 26), vx: c.rnd(180, 300), vy: c.rnd(-20, 10), g: 30, drag: 0.99, len: 5, color: j % 2 ? '#ffffff' : '#bfe8ff', size: 1.2, life: c.rnd(300, 460), delay: c.rnd(0, c.len - 500), add: true });
      for (let j = 0; j < 10; j++) fx.bubble(c.rnd(10, c.W - 10), cy + c.rnd(-16, 16), { color: '#e6fbff', size: c.rnd(1.2, 2.2), vy: -20, delay: c.rnd(80, c.len - 500), life: 400 });
      c.each((t, i, d) => {
        c.k.splash(t.x, t.y, { cols: WATER.list, n: N(c, 18), delay: c.hit + d });
        fx.glow(t.x, t.y, { color: '#bfe8ff', r: 20, delay: c.hit + d, life: 260 });
      });
      // キュウリが 2本 ぷかぷか
      for (let j = 0; j < 2; j++) prop(c, 'cucumber', -20, cy - 6 + j * 10, { to: { x: c.W * 0.6 + j * 40, y: cy - 8 + j * 12 }, travel: c.len - 200, hop: 4, s: 1.4, swing: 0.3, delay: 60 + j * 60, life: c.len - 140 - j * 60, pop: 0 });
    },
  },
  ax_kyuuri_shuriken: {
    charge: { color: '#3ab84a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_shushu', allyFx: 'claw',
    play(fx, c) {
      const o = org(c);
      for (let j = 0; j < 5; j++) {
        const t = c.targets[j % c.n];
        const tx = t.x + c.rnd(-8, 8), ty = t.y + c.rnd(-8, 8);
        const dd = j * 40 + (j % c.n) * 0;
        prop(c, 'slice', o.x + (j - 2) * 6, o.y, { to: { x: tx, y: ty }, travel: c.hit - 40, start: 0, spin: 24, s: 1.4, delay: dd, life: c.hit - 40 + 20, pop: 40, fade: 10 });
        fx.star(tx, ty, '#ffffff', 8, dd + c.hit - 40, 160);
        fx.sparks(tx, ty, { colors: KAPPA.list, n: N(c, 8, 0.8), speed: 130, delay: dd + c.hit - 40, life: 280, len: 5 });
        // 当たって ぱらり
        prop(c, 'slice', tx, ty, { vx: c.rnd(-30, 30), vy: -60, g: 300, spin: 8, s: 1.2, delay: dd + c.hit - 40, life: 380, pop: 0, fade: 120 });
      }
      c.each((t, i, d) => c.k.slash(t.x, t.y, { r: 22 * c.sz, w: 3, color: '#e8ffd0', glow: '#3ab84a', delay: c.hit + d, life: 300 }));
    },
  },
  // ───────────── はなかっぱ ─────────────
  ax_hanabira_cutter: {
    charge: { color: '#ff7ab8', color2: '#ffffff' },
    sfx: 'ax_g1_hanabira', allyFx: 'claw',
    play(fx, c) {
      const t = c.t, o = org(c, 16);
      flower(c, o.x, o.y, { r: 9, n: 8, cols: FLOWER_COLS[0], open: 80, life: 300 });
      // ピンクの 花びら 8まいが うずを まいて 刃の ように
      for (let j = 0; j < 8; j++) {
        const a = j / 8 * TAU;
        prop(c, 'petal', o.x + Math.cos(a) * 10, o.y + Math.sin(a) * 6, { to: { x: t.x + Math.cos(a) * 6, y: t.y + Math.sin(a) * 6 }, travel: c.hit - 40, hop: (j % 2 ? 1 : -1) * (14 + j * 2), spin: 16, rot: a, s: 1.4, delay: j * 12, life: c.hit + 60, pop: 40, fade: 60 });
      }
      c.k.multiSlash(t.x, t.y, { n: 3, gap: 60, r: 24 * c.sz, w: 4, color: '#ffe0f0', glow: '#ff7ab8', core: '#ffffff', delay: c.hit - 30 });
      kiHit(c, t.x, t.y, c.hit, PINK, { r: 16, n: 22 });
      c.k.petals(t.x, t.y, { n: 20, spread: 24, delay: c.hit + 80, life: c.len - c.hit - 120 });
      c.k.petals(o.x, o.y, { n: 8, spread: 12, delay: 0, life: 400 });
    },
  },
  ax_kafun_hakushon: {
    charge: { color: '#ffe03a', color2: '#ffffff' },
    sfx: 'ax_g1_hakushon', allyFx: 'debuff',
    play(fx, c) {
      const o = org(c, 14);
      flower(c, o.x, o.y, { r: 10, n: 8, cols: FLOWER_COLS[1], open: 80, life: c.hit });
      // 黄色い 花粉の 雲が ふわっと
      c.each((t, i, d) => {
        fx.sparks(t.x, t.y, { colors: ['#ffe86a', '#fff6b0'], n: N(c, 26), speed: 30, g: -10, drag: 0.97, delay: c.hit + d + 100, life: 560, len: 2 });
        for (let j = 0; j < N(c, 9); j++) {
          const u = j / 8;
          fx.sparks(lerp(o.x, t.x, u), lerp(o.y, t.y, u), { colors: ['#ffe86a', '#ffffff'], n: 3, speed: 24, delay: u * (c.hit - 60), life: 420, len: 2 });
          fx.puff(lerp(o.x, t.x, u) + c.rnd(-8, 8), lerp(o.y, t.y, u) + c.rnd(-8, 8), { color: j % 2 ? '#ffe86a' : '#fff6b0', r0: 3, r1: 12, vx: c.rnd(-6, 6), vy: c.rnd(-8, 4), life: 520, alpha: 0.6, delay: u * (c.hit - 60) });
        }
        // ハックション（衝撃の 輪）
        fx.shock(t.x, t.y, { r0: 6, r1: 50, color: '#ffffff', w: 2.6, delay: c.hit + d, life: 320 });
        fx.shock(t.x, t.y, { r0: 6, r1: 36, color: '#ffe86a', w: 1.8, delay: c.hit + d + 60, life: 320 });
        c.k.speedLines(t.x, t.y, { n: 10, delay: c.hit + d, life: 160, r0: 14, r1: 50 });
        fx.sparks(t.x, t.y, { colors: ['#ffe86a', '#ffffff'], n: N(c, 14), speed: 90, delay: c.hit + d, life: 340 });
        for (let j = 0; j < N(c, 5); j++) fx.puff(t.x + c.rnd(-14, 14), t.y + c.rnd(-10, 10), { color: '#ffe86a', r0: 2, r1: 8, vx: c.rnd(-20, 20), vy: c.rnd(-20, -4), life: 440, alpha: 0.55, delay: c.hit + d + 60 });
      });
    },
  },
  ax_hana_no_mitsu: {
    charge: { color: '#ffc83a', color2: '#ffffff' },
    sfx: 'ax_g1_mitsu', allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const top = a.ally ? c.H - 70 : a.y - 40;
        flower(c, a.x, top, { r: 9, n: 6, cols: FLOWER_COLS[1], open: 80, delay: d, life: c.hit + 160 });
        for (let j = 0; j < 3; j++) prop(c, 'drop', a.x, top + 4, { to: { x: a.x + (j - 1) * 4, y: a.y - 8 }, travel: 160, start: 0, s: 1.3, color: '#ffc83a', delay: d + 60 + j * 60, life: 170, pop: 0, fade: 20 });
        healFx(c, a, d + c.hit, { main: '#ffc83a', glow: '#fff2b0', core: '#ffffff', list: ['#ffc83a', '#fff2b0', '#7dffb0'] }, { n: N(c, 14) });
        c.k.petals(a.x, a.y - 12, { n: N(c, 8), spread: 18, delay: d + c.hit, life: 400 });
        fx.sparks(a.x, top, { colors: ['#ffc83a', '#ffffff'], n: N(c, 8), speed: 40, delay: d + 40, life: 300, len: 3 });
      });
    },
  },
  ax_pakkaan: {
    charge: { color: '#ff7ab8', color2: '#ffffff' },
    sfx: 'ax_g1_pakkaan', allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c, 18);
      // 頭の 花が パッカーン！
      flower(c, o.x, o.y, { r: 26, n: 10, cols: FLOWER_COLS[0], open: 120, at: 90, glow: '#ffd0e4', life: c.len - 160 });
      fx.shock(o.x, o.y, { r0: 10, r1: 70, color: '#ffd0e4', w: 2.6, delay: 100, life: 380 });
      fx.glow(o.x, o.y, { color: '#ffffff', r: 40, delay: 90, life: 260 });
      // 花びらが 爆発の ように 敵ぜんぶへ
      c.each((t, i, d) => {
        for (let j = 0; j < N(c, 7); j++) prop(c, 'petal', o.x, o.y, { to: { x: t.x + c.rnd(-10, 10), y: t.y + c.rnd(-10, 10) }, travel: c.hit - 120, start: 120, hop: c.rnd(-20, 20), spin: 14, s: 1.3, color: FLOWER_COLS[j % 5][0], delay: d, life: c.hit + 40, pop: 30, fade: 40 });
        kiHit(c, t.x, t.y, c.hit + d, PINK, { r: 16, n: 16 });
      });
      fx.sparks(o.x, o.y, { colors: ['#ff7ab8', '#ffe066', '#ffffff'], n: 30, speed: 180, delay: 100, life: 420, len: 7 });
      c.k.sparkles(o.x, o.y, { n: 8, r: 26, delay: 100, life: 300 });
      // 色とりどりの 花びらの 雨
      k.petals(c.center.x, 10, { n: 22, colors: ['#ff7ab8', '#ffe03a', '#5aa8ff', '#ffffff', '#b07aff'], spread: 100, delay: c.hit + 100, life: c.len - c.hit - 160, rise: -40 });
      k.shake(200, 1.6, c.hit);
    },
  },
  ax_gattsu_no_hana: {
    charge: { color: '#ff4a3a', color2: '#ffffff' },
    sfx: 'ax_g1_pon', allyFx: 'buff',
    play(fx, c) {
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        const top = a.ally ? c.H - 60 : a.y - 34;
        flower(c, a.x, top, { r: 14, n: 7, cols: FLOWER_COLS[3], open: 160, at: 60, glow: '#ffc0b0', delay: d, life: c.len - 80 - d });
        fx.sparks(a.x, top, { colors: ['#ff4a3a', '#ffe066', '#ffffff'], n: N(c, 16), speed: 70, delay: d + 120, life: 300 });
        c.k.petals(a.x, top, { n: N(c, 6), colors: ['#ff4a3a', '#ffc0b0'], spread: 12, delay: d + 200, life: 400 });
        healFx(c, a, d + c.hit, { main: '#ff6a4a', glow: '#ffc0b0', core: '#ffffff', list: ['#ff6a4a', '#ffc0b0', '#ffffff'] }, { n: N(c, 12), up: '#ff6a4a' });
      });
    },
  },
  ax_atama_no_hana: {
    charge: { color: '#ff7ab8', color2: '#ffffff' },
    sfx: 'ax_g1_sake', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const a = selfAt(c, c.t);
      const cols = FLOWER_COLS[Math.floor(c.rnd(0, FLOWER_COLS.length))];
      const by = a.ally ? c.H - 30 : a.y - 10;
      const top = a.ally ? c.H - 76 : a.y - 46;
      // つぼみが ぐんぐん のびて → 大きな 花が 開く（放射の 光）
      flower(c, a.x, by, { to: { x: a.x, y: top }, travel: c.hit - 60, r: 22, n: 9, cols, open: 200, at: c.hit, stem: 40, glow: cols[2], life: c.len - 60 });
      bg(c, 'rays', { x: a.x, y: top, color: cols[0], color2: null, a: 0.55, delay: c.hit, life: c.len - c.hit - 40, fin: 80 });
      fx.shock(a.x, top, { r0: 8, r1: 70, color: cols[2], w: 2.4, delay: c.hit, life: 400 });
      fx.glow(a.x, top, { color: '#ffffff', r: 36, delay: c.hit, life: 300 });
      k.petals(a.x, top, { n: 18, colors: [cols[0], cols[2], '#ffffff'], spread: 30, delay: c.hit + 60, life: c.len - c.hit - 120 });
      fx.sparks(a.x, top, { colors: [cols[0], cols[1], '#ffffff'], n: 26, speed: 120, delay: c.hit, life: 420 });
    },
  },
  ax_hana_fubuki: {
    charge: { color: '#ff7ab8', color2: '#ffffff' },
    sfx: 'ax_g1_fubuki', allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const cy = c.center.y;
      // 画面の 左から 花びらの 大きな ふぶき
      for (let j = 0, m = c.n > 3 ? 50 : 70; j < m; j++) {
        const tt = c.rnd(0, c.len * 0.55);
        fx.add({ kind: 'axShape', shape: 'petal', x: -10, y: cy + c.rnd(-40, 40), vx: c.rnd(260, 380), vy: c.rnd(-30, 30), g: 0, drag: 1, color: ['#ff8ac8', '#ffd0e4', '#ffffff', '#ff5a9a'][j % 4], size: c.rnd(1.6, 2.8), rot0: c.rnd(0, 6), spin: c.rnd(-10, 10), delay: tt, life: 900, add: false, pop: false });
      }
      k.streaks({ ang: 0, color: '#ffd0e4', n: 26, life: c.len - 160, alpha: 0.55 });
      c.each((t, i, d) => {
        c.k.multiSlash(t.x, t.y, { n: 2, gap: 80, r: 22 * c.sz, w: 3, color: '#ffe0f0', glow: '#ff7ab8', delay: c.hit + d - 40 });
        kiHit(c, t.x, t.y, c.hit + d, PINK, { r: 14, n: 14 });
        k.petals(t.x, t.y, { n: N(c, 10), spread: 20, delay: c.hit + d + 160, life: 420, rise: -10 });
      });
    },
  },
  // ───────────── 筋肉ニンニク ─────────────
  ax_ninniku_power: {
    charge: { color: '#ff8a2a', color2: '#ffd08a' },
    sfx: 'ax_g1_mukimuki', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35, c.len - 60);
      const a = selfAt(c, c.t);
      const py = a.ally ? c.H - 44 : a.y - 20;
      prop(c, 'garlic', a.x, py, { s: 1.8, glow: '#ffffff', life: 260, pop: 80, shrink: 120 });
      // オレンジの 光が 体から ふき出し、腕の 形の だ円の 光が ふくらむ
      k.aura(a.x, a.y - 14, { style: 'flame', r: 26, h: 64, color: MUSC.main, color2: '#ffe0b0', delay: 200, life: c.len - 300, k: 1.6 });
      for (const sx of [-1, 1]) fx.add({ kind: 'g1Bicep', x: a.x + sx * 22, y: a.y - 30, sx, grow: 260, delay: c.hit - 100, life: c.len - c.hit - 40 });
      fx.shock(a.x, a.y - 14, { r0: 10, r1: 90, color: '#ffd08a', w: 2.6, delay: c.hit, life: 420 });
      k.shake(240, 1.8, c.hit);
      for (let j = 0; j < 3; j++) fx.twinkle(a.x + (j - 1) * 24, a.y - 46 + Math.abs(j - 1) * 8, { color: '#ffffff', size: 9, delay: c.hit + 120 + j * 60, life: 300 });
      fx.sparks(a.x, a.y - 14, { colors: MUSC.list, n: 40, speed: 120, ang: -Math.PI / 2, spread: 1, g: -60, delay: c.hit, life: 520 });
      fx.sparks(a.x, py, { colors: ['#ffffff', '#f4f0e8'], n: 12, speed: 60, delay: 100, life: 300, len: 3 });
    },
  },
  ax_muscle_punch: {
    charge: { color: '#ff8a2a', color2: '#ffd08a' },
    sfx: 'ax_g1_dogo', allyFx: 'claw',
    play(fx, c) {
      const t = c.t, o = org(c);
      fist(c, o.x, o.y, t.x, t.y, { style: 'muscle', s: 2 * c.sz, color: '#ff9a3a', glow: '#ffd08a', travel: c.hit, life: c.hit + 200 });
      for (let j = 0; j < 2; j++) fx.shock(t.x, t.y, { r0: 8, r1: 60 + j * 24, color: j ? '#ffd08a' : '#ffffff', w: 3 - j, delay: c.hit + j * 80, life: 380 });
      kiHit(c, t.x, t.y, c.hit, MUSC, { r: 22, n: 34, smoke: 4, debris: 12, heavy: [200, 2] });
      c.k.speedLines(t.x, t.y, { n: 18, delay: c.hit, life: 220 });
      trail(c, o.x, o.y, t.x, t.y, c.hit, MUSC.list, 8);
      fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd08a'], n: 24, speed: 260, delay: c.hit, life: 360, len: 10 });
      afterglowM(c, t.x, t.y, c.hit + 200, 16);
    },
  },
  ax_muscle_pose: {
    charge: { color: '#ff8a2a', color2: '#ffd08a' },
    sfx: 'ax_g1_kiran', allyFx: 'debuff',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4, c.len - 60);
      const o = org(c, 0);
      const hy = c.fromAlly ? c.H - 56 : o.y - 26;
      bg(c, 'rays', { x: o.x, y: hy + 10, color: '#ff8a2a', color2: null, a: 0.6, life: c.len - 80 });
      ghost(c, o.x, hy, { s: 1.6, color: '#ff9a3a', life: c.len - 120, flick: false });
      for (const sx of [-1, 1]) fx.add({ kind: 'g1Bicep', x: o.x + sx * 18, y: hy + 8, sx, grow: 200, delay: 60, life: c.len - 200 });
      // キラーンの 星 3つ
      for (let j = 0; j < 3; j++) fx.twinkle(o.x + (j - 1) * 22, hy - 6 + Math.abs(j - 1) * 10, { color: '#ffffff', size: 12, delay: 120 + j * 70, life: 360 });
      c.each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#ffd08a', r: 24, delay: c.hit + d, life: 300 });
        for (let j = 0; j < 3; j++) mark(c, 'down', t.x + (j - 1) * 12, t.y - 24, { size: 5, color: '#8ab0ff', color2: '#1a2a5a', vy: 20, delay: c.hit + d + j * 60, life: 420 });
        mark(c, 'lines', t.x, t.y - 4, { size: 8, color: '#5a6aa0', color2: '#ffffff', delay: c.hit + d + 100, life: 420 });
        fx.sparks(t.x, t.y, { colors: MUSC.list, n: N(c, 18), speed: 80, delay: c.hit + d, life: 360 });
      });
      fx.sparks(o.x, hy, { colors: MUSC.list, n: 30, speed: 100, delay: 100, life: 460 });
      drift(c, ['#ff8a2a', '#ffd08a', '#ffffff'], 64, { from: 0, to: c.len - 400, vy: -22 });
    },
  },
  ax_protein: {
    charge: { color: '#ff8a2a', color2: '#ffffff' },
    sfx: 'ax_g1_shaka', allyFx: 'heal',
    play(fx, c) {
      darken(c, 0.25, c.len - 60);
      const a = selfAt(c, c.t);
      const py = a.ally ? c.H - 46 : a.y - 22;
      prop(c, 'shaker', a.x + 6, py, { s: 1.8, swing: 0.6, life: c.hit, pop: 80 });
      for (let j = 0; j < 4; j++) fx.sparks(a.x + 6, py - 10, { colors: ['#ffffff', '#ffd08a'], n: 5, speed: 60, delay: j * 70, life: 220 });
      // ごくごく → ぷはー
      prop(c, 'shaker', a.x + 6, py, { s: 1.8, rot: -2.2, delay: c.hit - 60, life: 260, pop: 0 });
      fx.puff(a.x - 4, py - 4, { color: '#ffffff', r0: 3, r1: 12, vx: -20, vy: -20, life: 400, alpha: 0.6, delay: c.hit + 160 });
      c.k.aura(a.x, a.y - 12, { style: 'flame', r: 22, h: 52, color: MUSC.main, color2: '#ffe0b0', delay: c.hit, life: c.len - c.hit - 80, k: 1.3 });
      healFx(c, a, c.hit, HEAL, { n: 24, tw: 8 });
    },
  },
  ax_mukimuki_tackle: {
    charge: { color: '#ff8a2a', color2: '#ffd08a' },
    sfx: 'ax_g1_dododo', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38, c.len - 60);
      let p0 = org(c);
      c.each((t, i, d) => {
        const tr = i === 0 ? c.hit : c.stagger;
        const st = i === 0 ? 0 : c.hit + d - c.stagger;
        k.dash(p0.x, p0.y, t.x, t.y, { color: '#ff8a2a', travel: tr, w: 10, n: 4, delay: st });
        trail(c, p0.x, p0.y, t.x, t.y, tr, MUSC.list, N(c, 10), st);
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffd08a'], n: N(c, 20), speed: 240, delay: c.hit + d, life: 340, len: 9 });
        kiHit(c, t.x, t.y, c.hit + d, MUSC, { r: 20, n: 22, smoke: 3, debris: 8 });
        fx.crack(t.x, t.y + 18, { n: 5, len: 26, color: '#3a2010', hi: '#ffd08a', delay: c.hit + d, life: 700 });
        for (let j = 0; j < N(c, 5); j++) fx.puff(t.x + c.rnd(-18, 18), t.y + 18, { color: '#d8c8a0', r0: 3, r1: 12, vx: c.rnd(-30, 30), vy: -10, life: 460, alpha: 0.5, delay: c.hit + d });
        p0 = t;
      });
      k.shake(500, 2.4, c.hit);
      k.speedLines(c.center.x, c.center.y, { n: 20, delay: c.hit, life: 300, color: '#ffd08a' });
      drift(c, MUSC.list, 30, { from: c.hit, to: c.len - 400, vy: -24, y0: c.H * 0.3 });
    },
  },
  ax_muscle_atama_hana: {
    charge: { color: '#ff8a2a', color2: '#ffd08a' },
    sfx: 'ax_g1_muscleflower', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.42, c.len - 60);
      const t = c.t, o = org(c, 18);
      // 太い 花びらの ムキムキの 花が さいて、花ごと 頭つきで ドーン
      flower(c, o.x, o.y, { to: { x: t.x, y: t.y }, travel: c.hit - 260, start: 260, r: 26, n: 7, fat: 0.42, cols: ['#ff8a2a', '#ffe066', '#ffd08a'], open: 200, at: 40, glow: '#ffd08a', life: c.hit + 80 });
      for (const sx of [-1, 1]) fx.add({ kind: 'g1Bicep', x: o.x + sx * 26, y: o.y + 10, sx, grow: 200, delay: 60, life: 300 });
      k.dash(o.x, o.y, t.x, t.y, { color: '#ff8a2a', travel: c.hit - 260, w: 12, n: 3, delay: 260 });
      k.flash('#fff0d0', 120, c.hit);
      k.shake(420, 3, c.hit);
      kiHit(c, t.x, t.y, c.hit, MUSC, { r: 28, n: 34, debris: 14, ring: '#ffffff' });
      k.explosion(t.x, t.y, { r: 30 * c.sz, pal: { main: '#ff8a2a', glow: '#ffd08a', core: '#ffffff', list: ['#ffffff', '#ffd08a', '#ff7ab8'] }, delay: c.hit + 80, heavy: false });
      k.petals(t.x, t.y, { n: 30, colors: ['#ff8a2a', '#ffe066', '#ff7ab8', '#ffffff'], spread: 50, delay: c.hit + 120, life: c.len - c.hit - 180, rise: 80 });
      drift(c, ['#ff8a2a', '#ffe066', '#ff7ab8'], 30, { from: c.hit + 100, to: c.len - 400, vy: -20 });
    },
  },
  ax_ninniku_bomber: {
    charge: { color: '#ff8a2a', color2: '#ffffff' },
    sfx: 'ax_g1_bomber', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38, c.len - 60);
      const o = org(c, 6);
      for (let j = 0; j < 5; j++) {
        const t = c.targets[j % c.n];
        const tx = t.x + (c.n > 1 ? c.rnd(-10, 10) : (j - 2) * 14), ty = t.y + c.rnd(-8, 8);
        const dd = j * 60;
        prop(c, 'garlic', o.x, o.y, { to: { x: tx, y: ty }, travel: c.hit - 40, hop: c.fromAlly ? 30 : 10, spin: 8, s: 1.4, delay: dd - (j ? 0 : 0), life: c.hit - 40 + 20, pop: 40, fade: 10 });
        k.explosion(tx, ty, { r: 16 * c.sz, pal: { main: '#ff8a2a', glow: '#ffd08a', core: '#ffffff', list: ['#ffffff', '#fff0d0', '#ff8a2a'] }, delay: dd + c.hit - 40 + 40, heavy: j === 0 });
      }
      c.each((t, i, d) => kiHit(c, t.x, t.y, c.hit + d, MUSC, { r: 14, n: 14, smoke: 4 }));
      k.shake(500, 2.4, c.hit);
    },
  },
};

function afterglowM(c, x, y, d, n) {
  c.fx.sparks(x, y, { colors: MUSC.list, n: N(c, n), speed: 40, g: -30, drag: 0.95, delay: d, life: 460, len: 3 });
}
// ちからこぶの 光（だ円が ふくらむ）
export const G1_DORA_FINE = {
  // 川の 帯（左から のびる。ふちが 波うち、あわ と 流れの すじ）
  g1River(x, p, t, fx) {
    const W = fx?.W || 256;
    const front = p.start + p.v * p.age;
    const tail = p.age > p.tailAt ? -30 + (p.age - p.tailAt) * p.v * 1.3 : -30;
    const out = Math.max(0, Math.min(1, (p.life - p.age) / 160));
    if (out <= 0 || front <= tail) return;
    const L = Math.max(tail, -30), R = Math.min(front, W + 40);
    const edge = (xx, k) => Math.sin(xx / 9 + p.age / 70 + k) * 2.4 + Math.sin(xx / 23 - p.age / 110) * 1.6;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const band = (half, col, a, k) => {
      x.globalAlpha = a * out; x.fillStyle = col;
      x.beginPath();
      x.moveTo(L, p.y - half);
      for (let xx = L; xx <= R; xx += 4) x.lineTo(xx, p.y - half + edge(xx, k));
      // あたまの 波（まるく もりあがる）
      x.quadraticCurveTo(R + half * 0.9, p.y, R, p.y + half);
      for (let xx = R; xx >= L; xx -= 4) x.lineTo(xx, p.y + half + edge(xx, k + 2) * 0.6);
      x.closePath(); x.fill();
    };
    band(p.half, '#1a5ab0', 0.88, 0);
    band(p.half * 0.72, '#2f8aff', 0.9, 1);
    band(p.half * 0.32, '#6ac8ff', 0.85, 2);
    // ながれる すじ と あわ
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#e8f8ff'; x.lineWidth = 1; x.globalAlpha = 0.7 * out;
    x.beginPath();
    for (let i = 0; i < 14; i++) {
      const lane = p.y + ((i * 37) % 100 / 100 - 0.5) * p.half * 1.6;
      const u = ((p.age * 0.35 + i * 53) % (W + 60)) - 30;
      if (u > L && u + 12 < R) { x.moveTo(u, lane); x.lineTo(u + 12, lane); }
    }
    x.stroke();
    x.fillStyle = '#ffffff'; x.globalAlpha = out;
    for (let i = 0; i < 9; i++) { const yy = p.y - p.half + (i / 8) * p.half * 2; x.beginPath(); x.arc(R + Math.sin(i + p.age / 50) * 2 - 2, yy, 1.4 + (i % 3) * 0.5, 0, TAU); x.fill(); }
    for (let xx = L; xx < R; xx += 9) { x.beginPath(); x.arc(xx, p.y - p.half + edge(xx, 0) + 1, 1, 0, TAU); x.fill(); }
    x.restore();
  },
  g1Bicep(x, p) {
    const g = Math.min(1, p.age / Math.max(1, p.grow));
    const e = 1 - (1 - g) * (1 - g);
    const out = Math.max(0, Math.min(1, (p.life - p.age) / 160));
    if (out <= 0 || e <= 0) return;
    x.save();
    x.translate(p.x, p.y);
    x.scale(p.sx, 1);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.75 * out;
    x.fillStyle = '#ff8a2a';
    x.beginPath(); x.ellipse(0, 0, 4 + 8 * e, 3 + 6 * e, -0.5, 0, TAU); x.fill();
    x.fillStyle = '#ffd08a';
    x.beginPath(); x.ellipse(-1, -1.5, 2 + 4 * e, 1.5 + 3 * e, -0.5, 0, TAU); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 1; x.globalAlpha = 0.8 * out;
    x.beginPath(); x.arc(0, 0, 9 * e + 2, -2.4, -0.6); x.stroke();
    x.restore();
  },
};
void [N, ball, boom];
