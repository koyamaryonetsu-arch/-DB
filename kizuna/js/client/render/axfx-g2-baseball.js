// 第48回 G2: 野球（二刀流スター・野球界の殿堂入り）の 大技の え
// ・球（g2Ball）・バット（g2Bat）・光の 人かげ（g2Batter）・花火（g2Firework）・ナイターの 背景（g2Bg stadium）
// ・時間は shared/data/ax-time-g2.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { rnd, lerp } from './axkit.js?v=cc4d7c14aec3';
import { darken, bg, blow, icon, text, firework } from './axfx-g2-kit.js?v=cc4d7c14aec3';

const PI = Math.PI;
const GOLD = ['#ffffff', '#ffd23a', '#ffa00a'];
const FIRE = ['#ffffff', '#ffa02a', '#ff4a0a'];
const CONF = ['#ff4a4a', '#ffd23a', '#4ab8ff', '#5ad85a', '#ff7ad8', '#ffffff'];
const org = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 14 : c.from.y });
function ball(fx, keys, o = {}) {
  const last = keys[keys.length - 1];
  fx.add({ kind: 'g2Ball', x: last[1], y: last[2], keys, delay: o.delay || 0, life: o.life || last[0] + 40, trail: o.trail === undefined ? 'white' : o.trail, s: o.s || 1, tlen: o.tlen, vanish: o.vanish, ease: o.ease });
}
// バット（pv … にぎり、a0 → a1 を t0 〜 t1 で ふる）
function bat(fx, pv, t0, t1, o = {}) {
  const a0 = o.a0 ?? PI * 1.02, a1 = o.a1 ?? PI * 2.05;
  fx.add({ kind: 'g2Bat', x: pv.x, y: pv.y, keys: [[0, a0 - 0.15], [t0, a0], [t1, a1], [t1 + 200, a1 + 0.08]], len: o.len || 26, gold: !!o.gold, delay: o.delay || 0, life: t1 + (o.hold ?? 300) });
  return { x: pv.x + Math.cos((a0 + a1) / 2) * (o.len || 26), y: pv.y + Math.sin((a0 + a1) / 2) * (o.len || 26) };
}
// カキーン（バットに あたった ところ）
function kakiin(fx, k, x, y, delay, gold = false) {
  fx.glow(x, y, { color: gold ? '#ffd23a' : '#ffffff', r: 26, delay, life: 220, alpha: 0.9 });
  fx.star(x, y, '#ffffff', 14, delay, 200);
  fx.sparks(x, y, { colors: gold ? GOLD : ['#ffffff', '#fff6b0'], n: 12, speed: 170, delay, life: 300 });
  k.shockwave(x, y, { r0: 4, r1: 30, color: gold ? '#ffd23a' : '#ffffff', w: 2, delay });
}
function confetti(k, x, y, o = {}) {
  k.shapes(x, y, { shape: 'card', n: o.n || 16, colors: CONF, speed: o.speed || 60, ang: PI / 2, spread: 1.2, g: 70, drag: 0.96, spin: 9, size: 1.6, delay: o.delay || 0, life: o.life || 900, add: false, pop: false });
}

export const AX_G2_BASEBALL = {
  // 二刀流: 投げた 白い 球が ズバッと 敵へ → すぐ バットで もう1球 打ちかえして 当てる（2回 光る）
  ax_nitoryu: {
    charge: { color: '#ffffff', color2: '#e0ecff' },
    sfx: 'ax_g2_nitoryu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        ball(fx, [[0, o.x + 8, o.y - 10, 1.1], [c.hit, t.x, t.y, 1.5]], { delay: d, s: c.sz });
        blow(fx, t.x, t.y, { r: 12 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#c8dcff'], n: 18, heavy: i === 0 });
        k.speedLines(t.x, t.y, { delay: d + c.hit - 60, life: 200, r1: 90, n: 18 });
        // 打ちかえす
        const pv = { x: o.x - 8, y: o.y - 2 };
        const hitp = bat(fx, pv, d + 230, d + 330, { len: 24 });
        const contact = { x: pv.x + Math.cos(PI * 1.5) * 24, y: pv.y + Math.sin(PI * 1.5) * 24 };
        ball(fx, [[0, t.x, t.y + 6, 1.2], [110, contact.x, contact.y, 1.3]], { delay: d + c.hit + 20, trail: false });
        kakiin(fx, k, contact.x, contact.y, d + 330);
        ball(fx, [[0, contact.x, contact.y, 1.3], [170, t.x, t.y, 1.5]], { delay: d + 330, trail: 'gold', s: c.sz });
        blow(fx, t.x, t.y, { r: 14 * c.sz, delay: d + 500, colors: GOLD, n: 18, heavy: true });
        k.particles(t.x, t.y, { colors: GOLD, n: 14, speed: 160, delay: d + 520, life: 340 });
        void hitp;
      });
      k.shake(160, 1.6, c.hit);
    },
  },
  // フィフティ・フィフティ: ベースを 走る 速さの すじ（土けむり）→ バットを ふって 球が 敵へ →「50」が 2つ ポン
  ax_fifty_fifty: {
    charge: { color: '#ffffff', color2: '#ffe8b0', power: 1.2 },
    sfx: 'ax_g2_5050',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const t = c.t;
      darken(fx, 0.38, c.len - 80);
      const B = { x: c.W / 2, y: c.fromAlly ? c.H - 22 : Math.min(c.H - 22, o.y + 24) };
      const bases = [[0, 14], [56, 0], [0, -14], [-56, 0]].map(([dx, dy]) => ({ x: B.x + dx, y: B.y + dy }));
      bases.forEach((b) => fx.add({ kind: 'axShape', shape: 'diamond', x: b.x, y: b.y, vx: 0, vy: 0, color: '#ffffff', size: 3.2, rot0: PI / 2, spin: 0, life: c.len - 120, add: false, pop: true }));
      for (let j = 0; j < 4; j++) {
        const a = bases[j], b = bases[(j + 1) % 4];
        k.dash(a.x, a.y - 4, b.x, b.y - 4, { color: '#ffe8b0', travel: 70, w: 4, delay: j * 70 });
        for (let m = 0; m < 3; m++) fx.puff(lerp(a.x, b.x, m / 3), lerp(a.y, b.y, m / 3), { color: '#c8a070', r0: 2, r1: 7, vx: rnd(-14, 14), vy: -10, life: 420, alpha: 0.55, delay: j * 70 + m * 20 });
      }
      const pv = { x: o.x - 8, y: o.y - 2 };
      bat(fx, pv, 280, 370, { len: 24 });
      const cp = { x: pv.x, y: pv.y - 24 };
      kakiin(fx, k, cp.x, cp.y, 370);
      ball(fx, [[0, cp.x, cp.y, 1.2], [c.hit - 370, t.x, t.y, 1.6]], { delay: 370, trail: 'gold', s: c.sz });
      c.each((t2, i, d) => {
        blow(fx, t2.x, t2.y, { r: 15 * c.sz, delay: d + c.hit, colors: GOLD, n: 20, heavy: i === 0 });
        k.shockwave(t2.x, t2.y, { r0: 6, r1: 46 * c.sz, color: '#ffd23a', w: 2.4, n: 2, delay: d + c.hit });
      });
      text(fx, '50', t.x - 18, t.y - 26, { size: 13, delay: c.hit + 120, life: 520 });
      text(fx, '50', t.x + 18, t.y - 30, { size: 13, delay: c.hit + 270, life: 380, color: '#ffd23a' });
      for (let m = 0; m < 5; m++) fx.add({ kind: 'axShape', shape: 'diamond', x: t.x, y: t.y, vx: (o.x - t.x) * 1.6 + rnd(-30, 30), vy: (o.y - t.y) * 1.6 + rnd(-30, 30), color: '#ffd23a', size: 2, rot0: 0, spin: 6, delay: c.hit + 200 + m * 40, life: 420, add: true });
      k.shake(300, 2.2, c.hit);
      k.debris(t.x, t.y + 8, { n: 8, delay: c.hit, up: 110 });
      k.particles(t.x, t.y, { colors: GOLD, n: 22, speed: 170, delay: c.hit + 40, life: 400 });
    },
  },
  // ねむりファースト: 白い まくら・Z・星 → 回復
  ax_nemuri_first: {
    charge: { color: '#9ad8ff', color2: '#ffffff' },
    sfx: 'ax_g2_sleep',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      darken(fx, 0.4, c.len - 100);
      icon(fx, 'pillow', me.x, c.H - 22, { keys: [[0, me.x, c.H - 14, 0.6], [200, me.x, c.H - 24, 1.7]], life: c.len - 80 });
      [[6, 0], [8, 150], [11, 300]].forEach(([sz, dl], j) => text(fx, 'Z', me.x + 12 + j * 10, c.H - 40, { keys: [[0, me.x + 10 + j * 8, c.H - 34], [500, me.x + 24 + j * 14, c.H - 60 - j * 12]], size: sz, delay: dl, life: c.len - dl - 120, color: '#cfe8ff', ink: '#2a3a6a', pop: true }));
      k.shapes(me.x, c.H - 40, { shape: 'star', n: 8, colors: ['#fff6b0', '#ffffff', '#9ad8ff'], speed: 40, size: 2.4, delay: 100, life: 700 });
      for (const t of c.targets) {
        fx.glow(t.x, t.y - 6, { color: '#9ad8ff', r: 24, delay: c.hit, life: 500, alpha: 0.6 });
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#9ad8ff', '#ffffff'], n: 16, speed: 60, ang: -PI / 2, spread: 0.7, g: -40, delay: c.hit, life: 560 });
      }
      k.sparkles(me.x, c.H - 34, { n: 12, r: 26, colors: ['#ffffff', '#fff6b0', '#9ad8ff'], delay: 80, gap: 40 });
      k.particles(me.x, c.H - 24, { colors: ['#9ad8ff', '#ffffff'], n: 14, speed: 60, ang: -Math.PI / 2, spread: 1, g: -30, delay: c.hit - 100, life: 520 });
    },
  },
  // 満票MVP: 金の トロフィーが 光って 上がる・紙ふぶき → 金の 光
  ax_manpyou_mvp: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g2_fanfare',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.38, c.len - 100);
      const X = c.W / 2;
      icon(fx, 'trophy', X, c.H - 40, { keys: [[0, X, c.H + 16, 1], [c.hit, X, c.H - 44, 1.9]], life: c.len - 80 });
      for (let j = 0; j < 6; j++) fx.twinkle(X + rnd(-18, 18), c.H - 60 + rnd(-14, 14), { color: '#ffffff', size: 7, delay: c.hit + j * 60, life: 240 });
      k.shockwave(X, c.H - 50, { r0: 10, r1: 70, color: '#ffd23a', w: 2.4, n: 2, delay: c.hit });
      for (let j = 0; j < 4; j++) confetti(k, rnd(30, c.W - 30), -6, { n: 8, delay: 100 + j * 80, life: c.len - 220 - j * 80 });
      c.each((t, i, d) => {
        fx.arrows(t.x, t.y - 4, '#ffd23a', true, 3, d + c.hit);
        k.sparkles(t.x, t.y - 10, { n: 5, r: 14, colors: ['#ffd23a', '#ffffff'], delay: d + c.hit });
      });
      k.particles(X, c.H - 50, { colors: GOLD, n: 18, speed: 120, delay: c.hit, life: 460 });
    },
  },
  // リアル二刀流: 投げた 球（火の すじ）が おくへ → 自分で バットを ふり、打ちかえした 球が 光って 敵ぜんぶを つらぬく
  ax_real_nitoryu: {
    charge: { color: '#ffffff', color2: '#ffe8b0', power: 1.3 },
    sfx: 'ax_g2_real',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const C = c.center;
      bg(fx, 'stadium', { a: 0.42, life: c.len - 60 });
      const far = { x: C.x, y: C.y - 30 };
      ball(fx, [[0, o.x + 8, o.y - 12, 1.3], [220, far.x, far.y, 0.5]], { trail: 'fire', life: 240 });
      const pv = { x: o.x - 10, y: o.y - 2 };
      const cp = { x: pv.x, y: pv.y - 28 };
      ball(fx, [[0, far.x, far.y, 0.5], [160, cp.x, cp.y, 1.3]], { delay: 240, trail: 'white', life: 170 });
      if (c.fromAlly) fx.add({ kind: 'g2Batter', x: pv.x - 5, y: pv.y + 24, s: 2, nobat: true, col: '#ffffff', life: 900 });
      bat(fx, pv, 320, 400, { len: 28 });
      kakiin(fx, k, cp.x, cp.y, 400, true);
      k.flash('#ffffff', 80, 400);
      const keys = [[0, cp.x, cp.y, 1.4]];
      c.each((t, i, d) => keys.push([c.hit - 400 + d, t.x, t.y, 1.7]));
      const lt = keys[keys.length - 1];
      keys.push([lt[0] + 120, lt[1] + (lt[1] - cp.x) * 0.3, lt[2] + (lt[2] - cp.y) * 0.3, 1.7]);
      ball(fx, keys, { delay: 400, trail: 'gold', tlen: 160, life: keys[keys.length - 1][0] + 20 });
      const lastT = c.targets[c.n - 1];
      const L2 = Math.hypot(lastT.x - cp.x, lastT.y - cp.y) || 1;
      const far2 = { x: lastT.x + (lastT.x - cp.x) / L2 * 40, y: lastT.y + (lastT.y - cp.y) / L2 * 40 };
      k.beam(cp.x, cp.y, far2.x, far2.y, { w: 6, color: '#ffd23a', glow: '#fff0a0', core: '#ffffff', delay: 400, life: c.hit - 400 + c.stagger * (c.n - 1) + 380, grow: c.hit - 400 + c.stagger * (c.n - 1) + 80, burst: false, widths: [0.3, 1, 1, 0.8, 0] });
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: GOLD, n: 18, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 52 * c.sz, color: '#ffd23a', w: 2.6, n: 2, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: GOLD, n: 12, speed: 160, delay: d + c.hit + 160, life: 360 });
      });
      k.shake(420, 2.6, c.hit);
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: GOLD, n: 26, speed: 200, delay: d + c.hit, life: 420 }));
      k.particles(cp.x, cp.y, { colors: GOLD, n: 16, speed: 150, delay: 400, life: 360 });
    },
  },
  // 100マイルの直球: 大きく ふりかぶる 光 → 球が 火の すじを ひいて 一直線（空気が ゆがむ 輪）→ ズドン・炎の 輪
  ax_100mile: {
    charge: { color: '#ffa02a', color2: '#fff0c8', power: 1.2 },
    sfx: 'ax_g2_100mile',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      darken(fx, 0.4, c.len - 80);
      k.gather(o.x + 8, o.y - 14, { colors: ['#ffffff', '#ffd06a'], n: 14, r: 40, life: 200 });
      c.each((t, i, d) => {
        ball(fx, [[0, o.x + 8, o.y - 14, 1.4], [c.hit, t.x, t.y, 1.8]], { delay: d, trail: 'fire', tlen: 140, s: c.sz, ease: 'lin' });
        for (let m = 1; m <= 4; m++) fx.shock(lerp(o.x + 8, t.x, m / 5), lerp(o.y - 14, t.y, m / 5), { r0: 3, r1: 14, color: '#ffffff', w: 1.2, delay: d + c.hit * m / 5, life: 240 });
        blow(fx, t.x, t.y, { r: 16 * c.sz, delay: d + c.hit, colors: FIRE, n: 22, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 60 * c.sz, color: '#ff8a2a', w: 3, n: 3, gap: 90, delay: d + c.hit });
        k.flames(t.x, t.y + 12, { w: 30, h: 26, n: 5, delay: d + c.hit + 40, life: 600 });
        k.particles(t.x, t.y, { colors: FIRE, n: 16, speed: 170, delay: d + c.hit + 100, life: 420 });
      });
      k.speedLines(c.t.x, c.t.y, { delay: c.hit - 80, life: 240, r1: 140, n: 24 });
      k.flash('#ffd06a', 70, c.hit);
      k.shake(400, 2.6, c.hit);
      c.each((t, i, d) => k.debris(t.x, t.y + 8, { n: 10, delay: d + c.hit, up: 120 }));
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: FIRE, n: 20, speed: 200, delay: d + c.hit, life: 400 }));
    },
  },
  // 予告ホームラン: バットの 先が 空（スタンド）を 指して 光の 線・スポットライト → 金の 光
  ax_yokoku_homerun: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g2_yokoku',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      bg(fx, 'stadium', { a: 0.5, life: c.len - 60 });
      k.pillar(me.x, c.H, { w: 20, color: '#fff6c8', glow: '#ffffff', life: c.len - 160, burst: false, alpha: 0.35 });
      const s = 2.4;
      fx.add({ kind: 'g2Batter', x: me.x, y: c.H - 2, s, keys: [[0, PI * 0.75], [260, -1.05]], col: '#ffd23a', life: c.len - 100 });
      const tip = { x: me.x + 2.5 * s + Math.cos(-1.05) * 15 * s, y: c.H - 2 - 12 * s + Math.sin(-1.05) * 15 * s };
      const sky = { x: Math.min(c.W - 12, tip.x + 90), y: 10 };
      k.beam(tip.x, tip.y, sky.x, sky.y, { w: 2.4, color: '#ffd23a', glow: '#fff0a0', core: '#ffffff', delay: 280, life: 520, grow: 120, burst: false });
      fx.twinkle(sky.x, sky.y, { color: '#ffffff', size: 16, delay: 400, life: 500 });
      fx.glow(sky.x, sky.y, { color: '#ffd23a', r: 26, delay: 400, life: 500, alpha: 0.9 });
      k.flash('#fff6c8', 70, 280);
      c.each((t, i, d) => {
        fx.arrows(t.x, t.y - 4, '#ffd23a', true, 3, d + c.hit);
        k.sparkles(t.x, t.y - 10, { n: 6, r: 14, colors: ['#ffd23a', '#ffffff'], delay: d + c.hit });
        k.particles(t.x, t.y, { colors: GOLD, n: 12, speed: 70, ang: -PI / 2, spread: 0.6, g: -30, delay: d + c.hit, life: 520 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 34, { colors: ['#ffffff', '#ffd23a'], n: 18, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffd23a', '#fff6c8'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffd23a', '#fff6c8'], gap: 20 });
    },
  },
  // 消える魔球: 投げた 球が とちゅうで 3回 ちらついて 消える → 敵の 目の前で 急に あらわれて ズドン
  ax_kieru_makyu: {
    charge: { color: '#ffffff', color2: '#e0d8ff', power: 1.2 },
    sfx: 'ax_g2_makyu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      bg(fx, 'stadium', { a: 0.45, life: c.len - 60 });
      darken(fx, 0.2, c.len - 80);
      c.each((t, i, d) => {
        const keys = [[0, o.x + 8, o.y - 12, 1.3], [c.hit, t.x, t.y, 1.7]];
        ball(fx, keys, { delay: d, trail: 'white', s: c.sz, ease: 'lin', vanish: [[110, 170], [230, 280], [340, c.hit - 90]] });
        for (let m = 1; m <= 10; m++) {
          const u = m / 11;
          fx.twinkle(lerp(o.x + 8, t.x, u), lerp(o.y - 12, t.y, u), { color: '#c8c0ff', size: 2.5, delay: d + c.hit * u, life: 200 });
        }
        const ap = { x: lerp(o.x + 8, t.x, 0.85), y: lerp(o.y - 12, t.y, 0.85) };
        fx.glow(ap.x, ap.y, { color: '#ffffff', r: 16, delay: d + c.hit - 90, life: 160, alpha: 1 });
        fx.star(ap.x, ap.y, '#e0d8ff', 10, d + c.hit - 90, 140);
        blow(fx, t.x, t.y, { r: 18 * c.sz, delay: d + c.hit, colors: ['#ffffff', '#c8c0ff'], n: 22, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 64 * c.sz, color: '#e0d8ff', w: 3, n: 3, gap: 90, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#c8c0ff', '#8a7aff'], n: 22, speed: 180, delay: d + c.hit + 120, life: 460 });
      });
      k.speedLines(c.t.x, c.t.y, { delay: c.hit - 100, life: 260, r1: 150, n: 26 });
      k.flash('#ffffff', 90, c.hit);
      k.shake(520, 3, c.hit);
      c.each((t, i, d) => { k.debris(t.x, t.y + 8, { n: 12, delay: d + c.hit, up: 130 }); k.particles(t.x, t.y, { colors: ['#ffffff', '#c8c0ff'], n: 30, speed: 220, delay: d + c.hit, life: 440 }); });
    },
  },
  // 声出し円じん: 白い 円じんの 輪（頭の 点の 輪）→「オー！」の 輪が 上へ
  ax_koedashi_enjin: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g2_oo',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 100);
      const X = c.W / 2, Y = c.H - 26;
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * PI * 2;
        fx.add({ kind: 'axShape', shape: 'circle', x: X + Math.cos(an) * 46, y: Y + Math.sin(an) * 11, vx: 0, vy: 0, color: Math.sin(an) > 0 ? '#ffffff' : '#c8c8d8', size: 3.4, rot0: 0, spin: 0, delay: i * 30, life: c.len - 160, add: false, pop: true });
      }
      fx.shock(X, Y, { r0: 30, r1: 48, sy: 0.25, color: '#ffd23a', w: 2.4, delay: 200, life: 500 });
      for (let j = 0; j < 5; j++) fx.shock(X, Y - j * 16, { r0: 20 + j * 4, r1: 40 + j * 8, sy: 0.25, color: '#fff6c8', w: 2, delay: c.hit - 100 + j * 70, life: 360 });
      text(fx, 'オー!', X, Y - 20, { keys: [[0, X, Y - 10], [400, X, 34]], size: 17, delay: c.hit - 120, life: c.len - c.hit - 40, color: '#ffd23a' });
      c.each((t, i, d) => {
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#ffffff', '#ffd23a'], n: 14, speed: 60, ang: -PI / 2, spread: 0.7, g: -40, delay: d + c.hit, life: 560 });
        k.sparkles(t.x, t.y - 10, { n: 5, r: 14, colors: ['#ffffff', '#c8ffe0'], delay: d + c.hit + 60 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 34, { colors: ['#ffffff', '#ffd23a'], n: 18, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffd23a', '#fff6c8'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffd23a', '#fff6c8'], gap: 20 });
    },
  },
  // 三者三しん: 球が 敵ごとに ズバッ → 敵の 上に 赤い「K」が 3つ ならぶ
  ax_sansha_sanshin: {
    charge: { color: '#ffffff', color2: '#ffd0d0', power: 1.2 },
    sfx: 'ax_g2_sanshin',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      bg(fx, 'stadium', { a: 0.45, life: c.len - 60 });
      const shots = c.n === 1 ? [0, 1, 2].map((j) => ({ t: c.t, at: c.hit + j * 150, kx: (j - 1) * 18 })) : c.targets.map((t, i) => ({ t, at: c.hit + i * c.stagger, kx: 0 }));
      shots.forEach(({ t, at, kx }, j) => {
        ball(fx, [[0, o.x + 8, o.y - 12, 1.2], [200, t.x + rnd(-4, 4), t.y + rnd(-4, 4), 1.6]], { delay: at - 200, trail: 'white', s: c.sz, ease: 'lin' });
        blow(fx, t.x, t.y, { r: 14 * c.sz, delay: at, colors: ['#ffffff', '#ff8a8a'], n: 16, heavy: j === 0 });
        k.speedLines(t.x, t.y, { delay: at - 40, life: 180, r1: 90, n: 16 });
        text(fx, 'K', t.x + kx, t.y - 40, { size: 14, delay: at + 60, life: c.len - at - 140, color: '#ff3a3a', ink: '#ffffff' });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ff6a6a'], n: 12, speed: 140, delay: at + 100, life: 360 });
      });
      k.shake(300, 2.4, c.hit);
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: ['#ffffff', '#ff6a6a'], n: 14, speed: 180, delay: d + c.hit, life: 380 }));
    },
  },
  // 夢のオールスター: 光の 人影 4人が いっせいに バットを ふる → 4つの 打球が 敵ぜんぶへ → 花火
  ax_yume_allstar: {
    charge: { color: '#ffd23a', color2: '#ffffff', power: 1.2 },
    sfx: 'ax_g2_allstar',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'stadium', { a: 0.55, life: c.len - 60 });
      const cols = ['#ffd23a', '#9ad8ff', '#ff9ad8', '#9affb0'];
      const yb = c.fromAlly ? c.H - 2 : Math.min(c.H - 2, c.from.y + 30);
      for (let j = 0; j < 4; j++) {
        const bx = c.W * (0.17 + 0.22 * j);
        const s = 1.8;
        fx.add({ kind: 'g2Batter', x: bx, y: yb, s, keys: [[0, PI * 0.95], [250, PI * 0.95], [380, PI * 2]], col: cols[j], life: c.len - 300, delay: j * 30 });
        const cp = { x: bx + 2.5 * s, y: yb - 12 * s - 15 * s };
        kakiin(fx, k, cp.x, cp.y, 330 + j * 30, j === 0);
        const tg = c.targets[j % c.n];
        ball(fx, [[0, cp.x, cp.y, 1.2], [c.hit - 340 + j * 60, tg.x + rnd(-6, 6), tg.y + rnd(-6, 6), 1.6]], { delay: 340 + j * 30 - j * 30, trail: 'gold', s: c.sz });
      }
      c.each((t, i, d) => {
        blow(fx, t.x, t.y, { r: 15 * c.sz, delay: d + c.hit, colors: GOLD, n: 16, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 44 * c.sz, color: '#ffd23a', w: 2.4, delay: d + c.hit + 60 });
      });
      firework(fx, c.W * 0.25, 26, { r: 24, cols: ['#ff6a8a', '#ffd23a'], delay: c.hit + 260, sparks: 18 });
      firework(fx, c.W * 0.75, 30, { r: 24, cols: ['#4ab8ff', '#ffffff'], delay: c.hit + 420, sparks: 18 });
      firework(fx, c.W * 0.5, 18, { r: 28, cols: ['#ffd23a', '#9affb0'], delay: c.hit + 560, sparks: 18 });
      k.shake(380, 2.4, c.hit);
    },
  },
  // 黄金のサヨナラホームラン: ナイターの ライト・観客の 光 → 金の バットが 光り、金の 弧の 打球が 敵ぜんぶの 上で はじける → 花火 3発 → 紙ふぶき
  ax_ougon_sayonara: {
    charge: { color: '#ffd23a', color2: '#fffbe0', power: 1.4 },
    sfx: 'ax_g2_sayonara',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const C = c.center;
      bg(fx, 'stadium', { a: 0.62, life: c.len - 60, wave: true });
      const pv = { x: o.x - 14, y: o.y - 2 };
      if (c.fromAlly) fx.add({ kind: 'g2Batter', x: pv.x - 5.75, y: pv.y + 27.6, s: 2.3, nobat: true, col: '#ffd23a', life: 900 });
      bat(fx, pv, 300, 440, { len: 40, gold: true, hold: 360 });
      const cp = { x: pv.x, y: pv.y - 40 };
      kakiin(fx, k, cp.x, cp.y, 430, true);
      k.flash('#fff6c8', 120, 430);
      k.speedLines(cp.x, cp.y, { delay: 430, life: 260, r1: 160, n: 30, color: '#ffe08a' });
      const top = { x: lerp(cp.x, C.x, 0.6), y: 6 };
      const burst = { x: C.x, y: Math.max(14, C.y - 40) };
      ball(fx, [[0, cp.x, cp.y, 1.4], [200, top.x, top.y, 1.1], [c.hit - 430, burst.x, burst.y, 1.5]], { delay: 430, trail: 'gold', tlen: 180, ease: 'lin' });
      k.flash('#ffd23a', 140, c.hit);
      firework(fx, burst.x, burst.y, { r: 34, cols: ['#ffd23a', '#ffffff'], delay: c.hit, sparks: 26 });
      c.each((t, i, d) => {
        k.pillar(t.x, t.y, { w: 8, color: '#ffd23a', glow: '#fff6c8', delay: d + c.hit - 60, life: 420, burst: false, alpha: 0.85 });
        blow(fx, t.x, t.y, { r: 17 * c.sz, delay: d + c.hit, colors: GOLD, n: 18, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 56 * c.sz, color: '#ffd23a', w: 2.8, n: 2, delay: d + c.hit + 40 });
      });
      firework(fx, c.W * 0.22, 24, { r: 30, cols: ['#ff4a6a', '#ffd23a'], delay: c.hit + 220, sparks: 22 });
      firework(fx, c.W * 0.78, 22, { r: 30, cols: ['#4ab8ff', '#ffffff'], delay: c.hit + 400, sparks: 22 });
      for (let j = 0; j < 5; j++) confetti(k, rnd(20, c.W - 20), -6, { n: 10, delay: c.hit + 300 + j * 70, life: c.len - c.hit - 400 - j * 70 });
      k.shake(620, 3.4, c.hit);
    },
  },
  // 3打席連続ホームラン: ふる → 打球 → ふる → 打球 → ふる → 金の 打球（3回目が いちばん 大きい）
  ax_3daseki_renzoku: {
    charge: { color: '#ffd23a', color2: '#ffffff', power: 1.2 },
    sfx: 'ax_g2_3daseki',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      bg(fx, 'stadium', { a: 0.45, life: c.len - 60 });
      const pv = { x: o.x - 10, y: o.y - 2 };
      for (let j = 0; j < 3; j++) {
        const at = c.hit + j * 400;
        const sw = at - 160;
        const big = j === 2;
        bat(fx, pv, sw - 90, sw, { len: big ? 32 : 26, gold: big, hold: 160 });
        const cp = { x: pv.x, y: pv.y - (big ? 32 : 26) };
        kakiin(fx, k, cp.x, cp.y, sw, big);
        c.each((t, i, d) => {
          ball(fx, [[0, cp.x, cp.y, 1.2], [160, t.x, t.y, big ? 2.2 : 1.5]], { delay: sw + d, trail: big ? 'gold' : 'white', s: c.sz, tlen: big ? 160 : 90 });
          blow(fx, t.x, t.y, { r: (big ? 20 : 13) * c.sz, delay: at + d, colors: big ? GOLD : ['#ffffff', '#c8dcff'], n: big ? 24 : 14, heavy: i === 0 });
          if (big) k.shockwave(t.x, t.y, { r0: 8, r1: 70 * c.sz, color: '#ffd23a', w: 3, n: 3, gap: 90, delay: at + d });
        });
        k.shake(big ? 480 : 220, big ? 3 : 1.8, at);
      }
      firework(fx, c.t.x, Math.max(16, c.t.y - 40), { r: 30, cols: ['#ffd23a', '#ffffff'], delay: c.hit + 860, sparks: 22 });
    },
  },
  // 感動のスピーチ: マイク・金の 光の 輪・なみだの しずく → 回復
  ax_kandou_speech: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g2_speech',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.42, c.len - 100);
      const X = c.W / 2, Y = c.H - 40;
      icon(fx, 'mic', X, Y, { keys: [[0, X, Y + 20, 0.8], [220, X, Y, 1.7]], life: c.len - 80 });
      for (let j = 0; j < 5; j++) fx.shock(X, Y - 14, { r0: 8, r1: 70, color: '#ffd23a', w: 2, delay: 100 + j * 150, life: 420 });
      for (let j = 0; j < 8; j++) fx.drop(X + rnd(-30, 30), Y - 30 + rnd(-10, 10), { color: '#9ad8ff', vx: rnd(-10, 10), vy: rnd(-20, 10), g: 160, size: 1.6, delay: 200 + j * 60, life: 520 });
      for (let j = 0; j < 10; j++) fx.twinkle(rnd(16, c.W - 16), c.H - rnd(8, 40), { color: '#fff6c8', size: 5, delay: c.hit + j * 40, life: 220 });
      c.each((t, i, d) => {
        fx.glow(t.x, t.y - 6, { color: '#ffd23a', r: 22, delay: d + c.hit, life: 500, alpha: 0.6 });
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#ffffff', '#ffd23a'], n: 14, speed: 60, ang: -PI / 2, spread: 0.7, g: -40, delay: d + c.hit, life: 560 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 34, { colors: ['#ffffff', '#ffd23a'], n: 18, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffd23a', '#fff6c8'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffd23a', '#fff6c8'], gap: 20 });
    },
  },
};
