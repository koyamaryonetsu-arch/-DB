// 第48回 G2: ナルト（木の葉の忍び・七代目火影）と 合体技「忍びの影分身」の 大技の え
// ・時間は shared/data/ax-time-g2.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { rnd, lerp } from './axkit.js';
import { darken, bg, pop, ninja, blow, icon } from './axfx-g2-kit.js';

const BLUE = { deep: '#1a4ad8', mid: '#3a8cff', light: '#9ad8ff', core: '#ffffff' };
const RCOL = [BLUE.deep, BLUE.mid, BLUE.light, BLUE.core];
const BLUES = ['#ffffff', '#9ad8ff', '#3a8cff'];
const ORANGE = ['#ff8a1a', '#ffd06a', '#ffffff'];
const LEAF = ['#5ac85a', '#9ae66a', '#2a8a3a'];
// はなつ ところ（味方は 画面の 下、敵は え の まん中）
const org = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 12 : c.from.y });
const sgn = (v) => (v < 0 ? -1 : 1);
// らせん丸
function spiral(fx, keys, o = {}) {
  const last = keys[keys.length - 1];
  fx.add({ kind: 'g2Spiral', x: last[1], y: last[2], keys, delay: o.delay || 0, life: o.life || last[0] + 100, cols: o.cols || RCOL, blades: o.blades || 0, spin: o.spin || 3, lines: o.lines, rim: o.rim, fout: o.fout, sy: o.sy });
}
// 木の葉（みどりの はっぱが まう）
function leaves(k, x, y, o = {}) {
  k.shapes(x, y, { shape: 'petal', n: o.n || 10, colors: LEAF, speed: o.speed || 70, g: o.g ?? 40, drag: 0.95, spin: 8, size: 2.2, delay: o.delay || 0, life: o.life || 800, add: false, ang: o.ang ?? null, spread: o.spread ?? Math.PI });
}

export const AX_G2_NARUTO = {
  // クナイ投げ: 黒い クナイ 3本が 青い すじを ひいて とぶ → 金の 火花「カキン」・ささって のこる
  ax_kunai: {
    charge: { color: '#5aa8ff', color2: '#e0f4ff' },
    sfx: 'ax_g2_kunai',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      fx.swirl(o.x, o.y - 4, BLUES, { n: 14, rad: 10, h: 18, life: 300 });
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) {
          const sx = o.x + (j - 1) * 5, sy = o.y - 4;
          const ex = t.x + (j - 1) * 7 * c.sz + rnd(-2, 2), ey = t.y + (j - 1) * 4 * c.sz + rnd(-2, 2);
          const arr = d + c.hit - 40 + j * 30, travel = 170;
          fx.add({ kind: 'g2Kunai', x: ex, y: ey, keys: [[0, sx, sy], [travel, ex, ey]], s: 1.15 * c.sz, delay: arr - travel, life: travel + 420 });
          for (let m = 1; m <= 4; m++) fx.sparks(lerp(sx, ex, m / 5), lerp(sy, ey, m / 5), { colors: ['#9ad8ff', '#ffffff'], n: 3, speed: 30, delay: arr - travel + travel * m / 5, life: 260, len: 4 });
          // カキン（金の 火花）
          fx.sparks(ex, ey, { colors: ['#fff6b0', '#ffd23a', '#ffffff'], n: 9, speed: 150, delay: arr, life: 320, len: 6 });
          fx.twinkle(ex, ey, { color: '#fff6b0', size: 6, delay: arr, life: 220 });
        }
        blow(fx, t.x, t.y, { r: 12 * c.sz, delay: d + c.hit, colors: ['#9ad8ff', '#ffffff'], n: 18, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 30 * c.sz, color: '#9ad8ff', w: 1.6, delay: d + c.hit + 40, n: 2, gap: 70 });
        k.particles(t.x, t.y, { colors: BLUES, n: 14, speed: 80, delay: d + c.hit + 160, life: 380 });
      });
      k.shake(160, 1.6, c.hit);
    },
  },
  // 影分身の術: 十字の 印が 2回 光る → 「ボン」の けむりが よこに ならび、オレンジの 分身が あらわれる → また ボン で 消える
  ax_kagebunshin: {
    charge: { color: '#ff9a2a', color2: '#ffe8c0' },
    sfx: 'ax_g2_pop',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      icon(fx, 'mark', me.x, me.y - 26, { s: 1.4, life: 260 });
      icon(fx, 'mark', me.x, me.y - 26, { s: 1.8, life: 260, delay: 150 });
      const xs = [-72, -38, 38, 72].map((dx) => Math.max(14, Math.min(c.W - 14, me.x + dx)));
      xs.push(me.x);
      xs.forEach((px, i) => {
        const t0 = 180 + i * 50;
        const py = c.H - 3;
        pop(fx, px, py - 12, { r: 12, delay: t0, life: 420 });
        for (let m = 0; m < 4; m++) fx.puff(px + rnd(-8, 8), py - 10 + rnd(-5, 5), { color: '#ffffff', r0: 3, r1: 10, vx: rnd(-30, 30), vy: rnd(-30, -6), life: 520, alpha: 0.6, delay: t0 + 40 });
        ninja(fx, px, py, { s: 1.5, dir: px < me.x ? 1 : -1, delay: t0 + 40, life: 840 - t0, pose: i === 4 ? 'seal' : 'stand', fin: 30, fout: 60 });
        pop(fx, px, py - 12, { r: 11, delay: 860 + i * 20, life: 300 });
        k.sparkles(px, py - 14, { n: 3, r: 10, colors: ['#ffffff', '#ffd06a'], delay: t0 + 60 });
      });
      for (const t of c.targets) k.particles(t.x, t.y - 8, { colors: ORANGE, n: 12, speed: 70, ang: -Math.PI / 2, spread: 0.8, delay: c.hit, life: 500 });
      k.shockwave(me.x, c.H - 6, { r0: 6, r1: 90, sy: 0.3, color: '#ffd06a', w: 1.6, delay: c.hit, n: 2 });
    },
  },
  // らせん丸: 青い 玉を かかえて 敵へ 走る → らせんを 描いて えぐる（うずが 大きく）→ 青い 大うずの 衝撃波
  ax_rasengan: {
    charge: { color: '#3a8cff', color2: '#c8f0ff', power: 1.2 },
    sfx: 'ax_g2_rasengan',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const t = c.t;
      const dir = sgn(t.x - o.x + 0.1);
      darken(fx, 0.4, c.hit + 520);
      // 手を そえる 分身
      ninja(fx, o.x + 14, c.fromAlly ? c.H + 2 : o.y + 16, { s: 1.4, dir: -1, pose: 'seal', life: 260 });
      pop(fx, o.x + 14, (c.fromAlly ? c.H : o.y + 16) - 12, { r: 10, delay: 230, life: 320 });
      // かかえて 走る
      ninja(fx, 0, 0, { keys: [[0, o.x, c.fromAlly ? c.H + 4 : o.y + 16], [c.hit, t.x - 9 * dir, t.y + 16]], s: 1.3, dir, pose: 'run', life: c.hit + 60, ease: 'in' });
      const r = 10 * c.sz;
      spiral(fx, [[0, o.x + 4 * dir, o.y - 10, 5], [110, o.x + 6 * dir, o.y - 14, r], [c.hit, t.x, t.y, r], [c.hit + 80, t.x, t.y, r * 1.5], [c.hit + 360, t.x, t.y, r * 2.4], [c.hit + 560, t.x, t.y, 3]], { spin: 4.5, life: c.hit + 560 });
      k.dash(o.x, o.y - 10, t.x, t.y, { color: '#6ab8ff', travel: c.hit, w: 6, delay: 0 });
      k.gather(o.x, o.y - 12, { colors: BLUES, n: 12, r: 40, life: 260, waves: 1 });
      k.speedLines(t.x, t.y, { delay: c.hit - 120, life: 300, r1: 150, n: 24 });
      // えぐる
      blow(fx, t.x, t.y, { r: 16 * c.sz, delay: c.hit, colors: BLUES, n: 22, heavy: true });
      k.flash('#e8f8ff', 90, c.hit);
      fx.swirl(t.x, t.y - 4, BLUES, { n: 30, rad: 28 * c.sz, h: 30, delay: c.hit, life: 560, size: 1.6 });
      k.shockwave(t.x, t.y, { r0: 10, r1: 72 * c.sz, color: '#9ad8ff', w: 2.8, n: 3, gap: 110, delay: c.hit + 60, life: 420 });
      k.shockwave(t.x, t.y + 10, { r0: 6, r1: 60 * c.sz, sy: 0.3, color: '#6ab8ff', w: 2, n: 2, delay: c.hit + 120 });
      k.particles(t.x, t.y, { colors: BLUES, n: 30, speed: 180, delay: c.hit + 300, life: 520 });
      k.sparkles(t.x, t.y, { n: 8, r: 30, colors: ['#ffffff', '#9ad8ff'], delay: c.hit + 400 });
      k.shake(420, 2.4, c.hit);
    },
  },
  // せん人モード: 草・木の葉の 緑と 黄の つぶが 集まる → オレンジの くまと 黄色い 目・カエルの 光が ぴょん
  ax_sennin_mode: {
    charge: { color: '#7ad84a', color2: '#ffe066' },
    sfx: 'ax_g2_sennin',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      fx.swirl(me.x, me.y - 6, [...LEAF, '#ffe066'], { n: 26, rad: 34, h: 40, life: 520 });
      k.gather(me.x, me.y - 14, { colors: ['#9ae66a', '#ffe066', '#ffffff'], n: 16, r: 60, life: 280, waves: 2, gap: 120 });
      leaves(k, me.x, me.y - 30, { n: 10, speed: 40, life: 700 });
      icon(fx, 'sage', me.x, me.y - 30, { keys: [[0, me.x, me.y - 30, 0.4], [180, me.x, me.y - 30, 1.7]], delay: c.hit - 100, life: 620 });
      k.aura(me.x, me.y - 10, { style: 'flame', r: 16, h: 30, color: '#ffb02a', color2: '#ffe066', delay: c.hit - 60, life: 560, k: 1.2 });
      k.flash('#fff6b0', 80, c.hit);
      k.shockwave(me.x, me.y - 10, { r0: 6, r1: 60, color: '#ffe066', w: 2, n: 2, delay: c.hit });
      for (const [dx, dl] of [[-34, 0], [32, 120]]) icon(fx, 'frog', me.x + dx, me.y - 4, { vy: -110, g: 320, delay: c.hit + dl, life: 560 });
      k.sparkles(me.x, me.y - 16, { n: 10, r: 26, colors: ['#ffe066', '#ffffff'], delay: c.hit + 60 });
      for (const t of c.targets) k.particles(t.x, t.y - 6, { colors: ['#ffe066', '#ffb02a', '#ffffff'], n: 14, speed: 60, ang: -Math.PI / 2, spread: 0.7, delay: c.hit + 100, life: 520 });
    },
  },
  // 木の葉旋風: 回し げりの 旋風。横の 弧と 緑の 木の葉の うずが 敵ぜんぶを けりとばす → 木の葉が 舞い 落ちる
  ax_konoha_senpuu: {
    charge: { color: '#5ad87a', color2: '#e0ffe8' },
    sfx: 'ax_g2_senpuu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const C = c.center;
      const xs = c.targets.map((t) => t.x);
      const span = Math.max(...xs) - Math.min(...xs);
      const R = span / 2 + 34 * c.sz;
      darken(fx, 0.38, c.hit + 520);
      ninja(fx, 0, 0, { keys: [[0, o.x, c.fromAlly ? c.H + 4 : o.y + 16], [c.hit - 60, C.x, C.y + 22]], s: 1.4, dir: sgn(C.x - o.x + 0.1), pose: 'run', life: c.hit - 40 });
      ninja(fx, C.x, C.y + 22, { s: 1.5, pose: 'kick', delay: c.hit - 60, life: 520 });
      for (const [dl, rr] of [[c.hit - 180, R], [c.hit - 60, R * 1.12]]) {
        k.crescent(C.x, C.y + 6, { r: rr, a0: Math.PI * 0.98, a1: Math.PI * 0.02, w: 9 * c.sz, sy: 0.38, swing: 300 + c.stagger * (c.n - 1), life: 520, color: '#e8ffe8', glow: '#5ad87a', core: '#ffffff', delay: dl, after: 3 });
      }
      fx.swirl(C.x, C.y + 4, LEAF, { n: 30, rad: R * 0.8, h: 20, delay: c.hit - 150, life: 620, size: 1.8 });
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 13 * c.sz, delay: d + c.hit, colors: ['#c8ffd8', '#ffffff', '#5ad87a'], n: 14, heavy: i === 0 });
        leaves(k, t.x, t.y, { n: 8, speed: 110, delay: d + c.hit, life: 700 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#c8ffd8'], n: 10, speed: 150, ang: (t.x < C.x ? Math.PI : 0) - Math.PI / 2 * 0.3, spread: 0.6, delay: d + c.hit, life: 360 });
      });
      for (let i = 0; i < 4; i++) leaves(k, rnd(20, c.W - 20), -6, { n: 4, speed: 20, g: 50, delay: c.hit + 200 + i * 100, life: 900, ang: Math.PI / 2, spread: 0.6 });
      k.shake(320, 2.2, c.hit);
      c.each((t, i, d) => leaves(k, t.x, t.y - 6, { n: 8, speed: 60, delay: d + c.hit + 60, life: 600 }));
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: ['#ffffff', '#c8ffd8', '#5ad87a'], n: 18, speed: 170, delay: d + c.hit, life: 400 }));
    },
  },
  // らせん手裏剣: らせん丸に 白い 風の 刃 4まい → 回りながら 敵の まん中へ → 白い 風の 大ドーム（細い 白い 針）
  ax_rasenshuriken: {
    charge: { color: '#6ac8ff', color2: '#ffffff', power: 1.3 },
    sfx: 'ax_g2_shuriken',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const C = c.center;
      darken(fx, 0.45, c.len - 80);
      const r = 9;
      spiral(fx, [[0, o.x, o.y - 8, 5], [160, o.x, o.y - 18, r], [c.hit, C.x, C.y, r * 1.1]], { blades: 1, spin: 6, life: c.hit + 60 });
      k.gather(o.x, o.y - 18, { colors: ['#ffffff', '#c8ffd8', '#9ad8ff'], n: 16, r: 60, life: 260, waves: 2, gap: 100 });
      for (let m = 1; m <= 4; m++) fx.gust(lerp(o.x, C.x, m / 5) - 20, lerp(o.y, C.y, m / 5), { len: 50, amp: 3, color: '#ffffff', w: 0.9, delay: c.hit * m / 5, life: 300 });
      const xs = c.targets.map((t) => t.x);
      const R = Math.min(96, Math.max(46 * c.sz, (Math.max(...xs) - Math.min(...xs)) / 2 + 30));
      fx.add({ kind: 'g2Dome', x: C.x, y: C.y, keys: [[0, 6], [170, R], [560, R * 1.04], [720, R * 0.35]], life: 720, delay: c.hit, n: 90 });
      k.flash('#ffffff', 120, c.hit);
      k.shockwave(C.x, C.y, { r0: R * 0.5, r1: R * 1.5, color: '#ffffff', w: 2.4, n: 2, gap: 160, delay: c.hit + 60, life: 420 });
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 14 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#c8f0ff'], n: 16, heavy: i === 0 }));
      for (let m = 0; m < 4; m++) k.particles(C.x + rnd(-R, R) * 0.6, C.y + rnd(-R, R) * 0.4, { colors: ['#ffffff', '#c8f0ff'], n: 10, speed: 140, delay: c.hit + 120 + m * 120, life: 380 });
      k.shapes(C.x, C.y, { shape: 'twinkle', n: 14, colors: ['#ffffff', '#c8f0ff'], speed: 90, size: 2.6, delay: c.hit + 640, life: 520, r: R * 0.5 });
      k.shake(460, 3, c.hit);
    },
  },
  // 影分身・クナイの雨: 上空に オレンジの 分身 3つ（ボン）→ クナイが 雨の ように → 地面に ささって 金の 火花
  ax_kunai_ame: {
    charge: { color: '#ff9a2a', color2: '#ffe8c0' },
    sfx: 'ax_g2_kunai_ame',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.38, c.len - 60);
      const ys = c.fromAlly ? 30 : c.from.y - 6;
      const tops = [0.22, 0.5, 0.78].map((u, i) => ({ x: c.W * u, y: ys + (i === 1 ? -6 : 0) }));
      tops.forEach((p, i) => {
        pop(fx, p.x, p.y - 8, { r: 11, delay: i * 60 });
        ninja(fx, p.x, p.y, { s: 1.3, pose: 'throw', dir: p.x < c.W / 2 ? 1 : -1, delay: i * 60 + 40, life: 820 - i * 60 });
        pop(fx, p.x, p.y - 8, { r: 10, delay: 860 + i * 30, life: 240 });
      });
      for (let m = 0; m < 20; m++) {
        const tg = c.targets[m % c.n];
        const thr = tops[m % 3];
        const ex = tg.x + rnd(-16, 16) * c.sz, ey = tg.y + rnd(-10, 12) * c.sz;
        const arr = c.hit - 60 + m * 24 + (m % c.n) * c.stagger * 0.3;
        const travel = 170;
        fx.add({ kind: 'g2Kunai', x: ex, y: ey, keys: [[0, thr.x, thr.y - 12], [travel, ex, ey]], s: 1, delay: arr - travel, life: travel + 300 });
        fx.sparks(ex, ey, { colors: ['#fff6b0', '#ffd23a'], n: 4, speed: 110, delay: arr, life: 280, len: 5 });
      }
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 13 * c.sz, delay: d + c.hit, colors: ['#ffd23a', '#ffffff'], n: 16, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#9ad8ff', '#ffffff'], n: 12, speed: 90, delay: d + c.hit + 220, life: 360 });
      });
      k.shake(360, 2, c.hit);
    },
  },
  // 大玉らせん丸: 分身と 2人で 大きな 青い 玉を 上から たたきつける → 地面が すりばち形に へこむ
  ax_oodama_rasengan: {
    charge: { color: '#3a8cff', color2: '#c8f0ff', power: 1.3 },
    sfx: 'ax_g2_oodama',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const t = c.t;
      darken(fx, 0.45, c.len - 60);
      const R = 22 * c.sz;
      const upY = Math.max(R + 6, t.y - 52);
      for (const sd of [-1, 1]) {
        ninja(fx, 0, 0, { keys: [[0, o.x + sd * 12, c.fromAlly ? c.H + 4 : o.y + 16], [320, t.x + sd * (R + 4), upY + R], [c.hit, t.x + sd * (R + 2), t.y + R * 0.6]], s: 1.4, dir: -sd, pose: 'jump', life: c.hit + 160, ease: 'smooth' });
      }
      spiral(fx, [[0, o.x, o.y - 10, 6], [200, lerp(o.x, t.x, 0.5), lerp(o.y, upY, 0.6), R * 0.75], [340, t.x, upY, R], [c.hit, t.x, t.y, R], [c.hit + 360, t.x, t.y + 4, R * 1.3], [c.hit + 600, t.x, t.y + 6, 4]], { spin: 4, life: c.hit + 600, lines: 14 });
      k.gather(o.x, o.y - 12, { colors: BLUES, n: 16, r: 50, life: 260, waves: 1 });
      k.speedLines(t.x, t.y, { delay: c.hit - 140, life: 320, r1: 160, n: 26 });
      fx.add({ kind: 'g2Crater', x: t.x, y: t.y + R * 0.9, r: R * 2.1, delay: c.hit, life: 820, glow: '#6ab8ff' });
      blow(fx, t.x, t.y, { r: 18 * c.sz, delay: c.hit, colors: BLUES, n: 24, heavy: true });
      k.flash('#e8f8ff', 110, c.hit);
      k.debris(t.x, t.y + R * 0.8, { n: 16, delay: c.hit, up: 160 });
      k.shockwave(t.x, t.y + R * 0.8, { r0: 10, r1: 90 * c.sz, sy: 0.32, color: '#9ad8ff', w: 2.6, n: 3, gap: 100, delay: c.hit });
      fx.swirl(t.x, t.y, BLUES, { n: 34, rad: R * 1.4, h: 30, delay: c.hit, life: 620, size: 1.7 });
      k.particles(t.x, t.y, { colors: BLUES, n: 30, speed: 170, ang: -Math.PI / 2, spread: 1.2, delay: c.hit + 360, life: 560 });
      k.shake(460, 3, c.hit);
    },
  },
  // きつねの衣: オレンジの 炎の 衣・背中から 9本の しっぽの 炎・黒い しるし（胸の うずまき）→ 金の 光で 落ち着く
  ax_kyuubi_koromo: {
    charge: { color: '#ff8a1a', color2: '#ffe08a', power: 1.2 },
    sfx: 'ax_g2_kyuubi',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      darken(fx, 0.5, c.len - 100);
      for (let m = 0; m < 5; m++) fx.glow(c.W * (0.1 + 0.2 * m), c.H - 4, { color: '#ffb02a', r: 40, delay: m * 40, life: c.len - 200, alpha: 0.45 });
      fx.add({ kind: 'g2Tails', x: me.x, y: c.H - 36, len: 74, w: 6.5, n: 9, spread: 2.9, life: c.len - 120 });
      for (const dl of [0, 320, 640]) k.flames(me.x, c.H + 4, { w: 60, h: 26, n: 7, cols: ['#ff6a0a', '#ffa02a', '#ffe08a'], delay: dl, life: 700 });
      ninja(fx, me.x, c.H + 8, { s: 2.6, look: 'kyuubi', pose: 'stand', life: c.len - 140, fin: 180 });
      k.flash('#ffb02a', 120, c.hit);
      k.shockwave(me.x, c.H - 30, { r0: 10, r1: 110, color: '#ffa02a', w: 3, n: 2, gap: 140, delay: c.hit });
      k.particles(me.x, c.H - 20, { colors: ['#ffe08a', '#ffa02a', '#ffffff'], n: 30, speed: 120, ang: -Math.PI / 2, spread: 1, g: -40, delay: c.hit, life: 700 });
      k.sparkles(me.x, c.H - 40, { n: 12, r: 50, colors: ['#ffe08a', '#ffffff'], delay: c.len - 600, gap: 30 });
      for (const t of c.targets) k.particles(t.x, t.y - 8, { colors: ['#ffe08a', '#ffffff'], n: 12, speed: 60, ang: -Math.PI / 2, spread: 0.7, delay: c.hit + 400, life: 500 });
    },
  },
  // 火影の守り: 白い 火影の マントが 画面の 下に ひるがえる（すそに 赤い 炎）→ 味方 1人ずつに オレンジの 六角の たて
  ax_hokage_mamori: {
    charge: { color: '#ffb04a', color2: '#ffffff' },
    sfx: 'ax_g2_mamori',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.3, c.len - 100);
      fx.add({ kind: 'g2Mantle', x: c.W / 2, y: c.H - 50, w: 220, h: 44, life: c.len - 200 });
      k.streaks({ ang: 0, color: '#ffffff', n: 14, life: 400, alpha: 0.4 });
      c.each((t, i, d) => {
        fx.add({ kind: 'g2Hex', x: t.x, y: t.y - 6, r: 16, delay: d + c.hit, life: 700 });
        k.shapes(t.x, t.y, { shape: 'petal', n: 6, colors: ['#9ae66a', '#ffd06a'], speed: 40, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 2, delay: d + c.hit + 80, life: 700 });
        k.sparkles(t.x, t.y - 8, { n: 4, r: 14, colors: ['#ffe0a0', '#ffffff'], delay: d + c.hit + 100 });
      });
      k.shockwave(c.W / 2, c.H - 8, { r0: 10, r1: 130, sy: 0.25, color: '#ffd06a', w: 2, delay: c.hit });
      // マントの すその 赤い 炎の 火の粉（第49回: ため が みじかく なった ぶん、守りの 光を 足す）
      k.particles(c.W / 2, c.H - 30, { colors: ['#ff6a1a', '#ffd06a', '#ffffff'], n: 36, speed: 70, ang: -Math.PI / 2, spread: 1.6, g: -30, delay: c.hit - 80, life: 620 });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 6, { n: 8, r: 20, colors: ['#ffd06a', '#ffffff'], delay: d + c.hit + 40 }));
    },
  },
  // びじゅう玉: 九尾の 口に 赤と 青の つぶが 集まり 黒い 玉に → 一しゅん 静か → 白い ドームの 大爆発（ふちが 赤と 青）
  ax_bijuudama: {
    charge: { color: '#ff6a1a', color2: '#ffd08a', power: 1.2 },
    sfx: 'ax_g2_bijuu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const M = c.fromAlly ? { x: c.W / 2, y: 24 } : { x: c.from.x, y: c.from.y - 6 };
      darken(fx, 0.6, c.len - 80);
      icon(fx, 'foxmaw', M.x, M.y, { s: 1, life: c.hit + 60, fin: 160, fout: 120 });
      k.gather(M.x, M.y + 8, { colors: ['#ff2a2a', '#ff8a8a'], n: 14, r: 80, life: 300, waves: 3, gap: 110 });
      k.gather(M.x, M.y + 8, { colors: ['#3a8aff', '#9ad8ff'], n: 14, r: 80, life: 300, waves: 3, gap: 110, delay: 50 });
      const B = 18 * c.sz;
      spiral(fx, [[0, M.x, M.y + 8, 3], [420, M.x, M.y + 8, B], [c.hit - 260, M.x, M.y + 8, B * 1.1], [c.hit - 30, C.x, C.y, B], [c.hit + 60, C.x, C.y, B * 0.6]], { cols: ['#12061e', '#2a0e40', '#7a4ab8', '#ffffff'], rim: ['#ff2a2a', '#3a8aff'], spin: 2.5, life: c.hit + 80 });
      const xs = c.targets.map((t) => t.x);
      const R = Math.min(110, Math.max(56 * c.sz, (Math.max(...xs) - Math.min(...xs)) / 2 + 36));
      const boom = c.hit + 80;
      fx.add({ kind: 'g2Dome', x: C.x, y: C.y, keys: [[0, 8], [200, R], [560, R * 1.08], [760, R * 0.4]], life: 760, delay: boom, cols: ['#ffffff', '#ffffff', '#c04a7a'], rim2: ['#ff3a3a', '#4a9aff'], n: 50, sy: 0.8 });
      k.flash('#ffffff', 180, boom);
      fx.add({ kind: 'g2Crater', x: C.x, y: C.y + 22, r: R * 0.8, delay: boom, life: 800, glow: '#ff6a3a' });
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#ff8a8a', '#9ad8ff'], n: 16, heavy: i === 0 }));
      k.shockwave(C.x, C.y, { r0: R * 0.6, r1: R * 1.8, color: '#ffffff', w: 3, n: 2, gap: 160, delay: boom + 120, life: 460 });
      k.debris(C.x, C.y + 20, { n: 16, delay: boom, up: 170 });
      for (let m = 0; m < 8; m++) fx.puff(C.x + rnd(-R, R) * 0.7, C.y + rnd(-10, 14), { color: '#2a2030', r0: 4, r1: 18, vx: rnd(-30, 30), vy: rnd(-40, -14), life: 760, alpha: 0.55, delay: boom + 420 + m * 30 });
      k.particles(C.x, C.y, { colors: ['#ff8a2a', '#ffd06a', '#ff4a1a'], n: 34, speed: 160, ang: -Math.PI / 2, spread: 1.4, g: 40, delay: boom + 460, life: 620 });
      k.shake(700, 3.5, boom);
    },
  },
  // 火の意志: 味方 1人ずつの 胸に オレンジの 炎・木の葉の 光が 上へ → 炎が つながって 輪に
  ax_hi_no_ishi: {
    charge: { color: '#ff8a2a', color2: '#ffe0a0' },
    sfx: 'ax_g2_ishi',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.3, c.len - 100);
      const C = c.center;
      c.each((t, i, d) => {
        k.flames(t.x, t.y - 2, { w: 14, h: 22, n: 4, cols: ['#ff6a0a', '#ffa02a', '#ffe08a'], delay: d, life: 800 });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: 5, colors: ['#ffd06a', '#9ae66a'], speed: 40, ang: -Math.PI / 2, spread: 0.6, g: -40, size: 2.2, delay: d + 120, life: 700 });
        k.sparkles(t.x, t.y - 10, { n: 4, r: 12, colors: ['#ffe08a', '#ffffff'], delay: d + c.hit });
      });
      const RX = Math.max(36, (Math.max(...c.targets.map((t) => t.x)) - Math.min(...c.targets.map((t) => t.x))) / 2 + 26);
      for (let m = 0; m < 10; m++) {
        const an = (m / 10) * Math.PI * 2;
        k.flames(C.x + Math.cos(an) * RX, C.y - 6 + Math.sin(an) * 10, { w: 9, h: 14, n: 3, cols: ['#ff6a0a', '#ffa02a', '#ffe08a'], delay: c.hit + 100 + m * 30, life: 600, embers: false });
      }
      fx.shock(C.x, C.y - 6, { r0: RX * 0.9, r1: RX * 1.25, sy: 0.28, color: '#ffa02a', w: 2.4, delay: c.hit + 100, life: 600 });
      // 輪から のぼる 火の粉（第49回: ため が みじかく なった ぶん）
      k.particles(C.x, C.y - 6, { colors: ['#ff6a0a', '#ffe08a', '#ffffff'], n: 26, speed: 60, ang: -Math.PI / 2, spread: 1.5, g: -40, delay: c.hit + 60, life: 560 });
      k.flash('#ffb04a', 80, c.hit);
    },
  },
  // 多重影分身の術: 十字の 印 → 画面の 下と 左右に けむり「ボン」が 30こ・オレンジの 分身の 列 → いっせいに 敵へ → 大きな らせん丸
  ax_tajuu_kagebunshin: {
    charge: { color: '#ff9a2a', color2: '#ffe8c0', power: 1.2 },
    sfx: 'ax_g2_tajuu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const C = c.center;
      bg(fx, 'sky', { a: 0.55, life: c.len - 60 });
      icon(fx, 'mark', o.x, c.fromAlly ? c.H - 40 : o.y - 20, { s: 2.4, life: 420 });
      k.flash('#ffffff', 70, 0);
      const N = 30;
      for (let i = 0; i < N; i++) {
        const row = i % 3;
        const px = 12 + ((i * 37) % 23) / 23 * (c.W - 24) + rnd(-4, 4);
        const py = c.fromAlly ? c.H + 2 - row * 13 : Math.max(24, c.from.y - 6 - row * 12) + (row ? 0 : 0);
        const side = i % 10 === 9 ? 1 : 0;
        const fx0 = side ? (i % 20 === 9 ? 10 : c.W - 10) : px, fy0 = side ? 50 + row * 18 : py;
        const tp = 60 + i * 17;
        const s = 1.1 - row * 0.12;
        pop(fx, fx0, fy0 - 10 * s, { r: 8 + 2 * s, delay: tp, life: 360 });
        const tg = c.targets[i % c.n];
        const rs = 580 + ((i * 7) % 11) * 16;
        const arr = Math.min(c.hit + 380, c.hit - 40 + ((i * 5) % 13) * 32);
        ninja(fx, fx0, fy0, { s, dir: fx0 < C.x ? 1 : -1, delay: tp + 40, life: Math.max(60, rs - tp - 40), fout: 20 });
        ninja(fx, 0, 0, { keys: [[0, fx0, fy0], [Math.max(80, arr - rs), tg.x + rnd(-12, 12), tg.y + 14]], s, dir: tg.x > fx0 ? 1 : -1, pose: 'run', delay: rs, life: Math.max(100, arr - rs + 40), ease: 'in', fin: 10, fout: 40 });
      }
      k.streaks({ ang: c.fromAlly ? -Math.PI / 2 : Math.PI / 2, color: '#ffb04a', n: 30, delay: 580, life: 520, speed: 1.4, w: 1.4, alpha: 0.6 });
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 15 * c.sz, delay: d + c.hit, colors: ['#ffd06a', '#ffffff'], n: 16, heavy: i === 0 });
        for (let j = 1; j < 6; j++) {
          const sx = t.x + rnd(-12, 12), sy = t.y + rnd(-10, 10);
          fx.star(sx, sy, '#ffffff', 9, d + c.hit + j * 64, 200);
          fx.sparks(sx, sy, { colors: ['#ffd06a', '#ffffff'], n: 5, speed: 120, delay: d + c.hit + j * 64, life: 300 });
        }
      });
      // さいごに 大きな らせん丸
      const F = c.hit + 420;
      spiral(fx, [[0, C.x, C.y, 6], [260, C.x, C.y, 36 * c.sz], [460, C.x, C.y, 40 * c.sz], [620, C.x, C.y, 6]], { delay: F, spin: 4, life: 620, lines: 14 });
      k.flash('#e8f8ff', 120, F + 220);
      k.shockwave(C.x, C.y, { r0: 20, r1: 130, color: '#9ad8ff', w: 3, n: 3, gap: 110, delay: F + 220, life: 460 });
      fx.swirl(C.x, C.y, BLUES, { n: 30, rad: 44, h: 30, delay: F + 200, life: 560, size: 1.6 });
      k.shake(600, 3.4, F + 220);
      for (let m = 0; m < 10; m++) pop(fx, 20 + m * 24, c.fromAlly ? c.H - 14 - (m % 2) * 10 : C.y + rnd(-20, 20), { r: 10, delay: F + 560 + m * 20, life: 380, color: '#f0f0f4' });
    },
  },
  // 多重らせん丸: 分身 6人が 青い 玉を 持って 弧を 描いて 敵へ → 敵ごとに うずが 次々 → 6つの うずが 1つの 大うずに
  ax_tajuu_rasengan: {
    charge: { color: '#3a8cff', color2: '#c8f0ff', power: 1.2 },
    sfx: 'ax_g2_tajuu_rasen',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'sky', { a: 0.42, life: c.len - 60 });
      darken(fx, 0.3, c.len - 80);
      const M = c.hit + 560;
      for (let i = 0; i < 6; i++) {
        const tg = c.targets[i % c.n];
        const sx = c.W * (0.12 + 0.152 * i), sy = c.fromAlly ? c.H + 4 : c.from.y + 10;
        const arr = c.hit + i * 70;
        const mid = { x: lerp(sx, tg.x, 0.5), y: Math.min(sy, tg.y) - 40 };
        pop(fx, sx, (c.fromAlly ? c.H - 12 : sy - 12), { r: 10, delay: i * 40, life: 320 });
        const dir = sgn(tg.x - sx + 0.1);
        ninja(fx, 0, 0, { keys: [[0, sx, sy], [arr * 0.5, mid.x, mid.y + 14], [arr, tg.x - 9 * dir, tg.y + 16]], s: 1.2, dir, pose: 'jump', delay: i * 40, life: arr - i * 40 + 140 });
        const r = 7 * c.sz;
        spiral(fx, [[0, sx + 5 * dir, sy - 14, 3], [120, sx + 5 * dir, sy - 14, r], [arr * 0.5 - i * 20, mid.x, mid.y, r], [arr - i * 40, tg.x, tg.y, r], [arr - i * 40 + 200, tg.x, tg.y, r * 2.1], [M - i * 40, tg.x, tg.y, r * 1.6], [M - i * 40 + 160, C.x, C.y, r]], { delay: i * 40, life: M - i * 40 + 180, spin: 4.5 });
        blow(fx, tg.x, tg.y, { r: 12 * c.sz, delay: arr, colors: BLUES, n: 12, heavy: i === 0 });
        fx.swirl(tg.x, tg.y, BLUES, { n: 14, rad: 18, h: 20, delay: arr, life: 420 });
      }
      spiral(fx, [[0, C.x, C.y, 8], [260, C.x, C.y, 40 * c.sz], [c.len - M - 360, C.x, C.y, 44 * c.sz], [c.len - M - 120, C.x, C.y, 4]], { delay: M + 140, life: c.len - M - 120, lines: 16, spin: 4 });
      k.flash('#e8f8ff', 130, M + 200);
      k.shockwave(C.x, C.y, { r0: 20, r1: 120, color: '#9ad8ff', w: 3, n: 3, gap: 110, delay: M + 200, life: 460 });
      c.each((t, i, d) => blow(fx, t.x, t.y, { r: 14 * c.sz, delay: M + 200 + d, colors: BLUES, n: 12 }));
      k.particles(C.x, C.y, { colors: BLUES, n: 30, speed: 190, delay: M + 420, life: 520 });
      k.shake(620, 3.4, M + 200);
    },
  },
  // 合体技 忍びの影分身: けむり ボン×6・オレンジと 黒の 分身が 敵ぜんぶを きりつける → けむりで 消える
  ax_shinobi_kagebunshin: {
    sfx: 'ax_g2_pop',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 80);
      for (let i = 0; i < 6; i++) {
        const sx = c.W * (0.1 + 0.16 * i), sy = c.fromAlly ? c.H + 2 : c.from.y + 14;
        const tg = c.targets[i % c.n];
        const look = i % 2 ? 'shinobi' : 'naruto';
        pop(fx, sx, sy - 12, { r: 11, delay: i * 40, life: 360 });
        const arr = c.hit + i * 60;
        const dir = sgn(tg.x - sx + 0.1);
        ninja(fx, sx, sy, { s: 1.3, look, dir, delay: i * 40 + 30, life: 200 - i * 20 + 40, fout: 20 });
        ninja(fx, 0, 0, { keys: [[0, sx, sy], [arr - 200, tg.x - 12 * dir, tg.y + 14]], s: 1.3, look, dir, pose: 'run', delay: 200, life: arr - 200 + 520, ease: 'in' });
        k.dash(sx, sy - 10, tg.x, tg.y, { color: look === 'naruto' ? '#ff9a2a' : '#8a7ab0', travel: arr - 200, w: 4, delay: 200 });
        k.multiSlash(tg.x, tg.y, { n: 2, gap: 60, r: 22 * c.sz, w: 5, color: '#ffffff', glow: look === 'naruto' ? '#ff9a2a' : '#8a7ab0', core: '#ffffff', delay: arr - 40 });
        pop(fx, tg.x - 12 * dir, tg.y + 2, { r: 12, delay: arr + 520 + i * 30, life: 420 });
      }
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 14 * c.sz, delay: d + c.hit, colors: ['#ffd06a', '#ffffff'], n: 16, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ff9a2a'], n: 14, speed: 130, delay: d + c.hit + 380, life: 420 });
      });
      for (let m = 0; m < 6; m++) fx.puff(rnd(30, c.W - 30), c.center.y + rnd(-20, 30), { color: '#ffffff', r0: 4, r1: 16, vx: rnd(-20, 20), vy: -12, life: 700, alpha: 0.5, delay: c.len - 760 + m * 40 });
      k.shake(360, 2.2, c.hit);
    },
  },
};
