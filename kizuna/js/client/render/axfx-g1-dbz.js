// 第48回 G1: ドラゴンボール（サイヤ人・スーパーサイヤ人・2・3）＋ はかい神 ＋ 合体技 ゴムゴムのかめはめ波 の え
// 時間は shared/data/ax-time-g1.js。c の 時間は はなつ しゅんかんが 0
import { org, selfAt, N, darken, bg, ball, kbeam, dome, mark, prop, fist, boom, path, ghost, hakaiFilm, dragon, disk, monkey, wind, fan, TAU, hash, lerp, clamp01 } from './axfx-g1-lib.js?v=824fd873af63';
import { softGlow, disc } from './axkit.js?v=824fd873af63';

// 気の 色
const BLUE = { main: '#3aa8ff', glow: '#a8e4ff', core: '#ffffff', list: ['#ffffff', '#a8e4ff', '#3aa8ff'] };
const GOLD = { main: '#ffb21a', glow: '#ffe8a0', core: '#ffffff', list: ['#ffffff', '#fff0a0', '#ffb21a'] };
const YEL = { main: '#ffe23a', glow: '#fff8a8', core: '#ffffff', list: ['#ffffff', '#fff8a8', '#ffe23a'] };
const RED = { main: '#ff3a2a', glow: '#ff9a7a', core: '#fff0e0', list: ['#fff0e0', '#ff9a7a', '#ff3a2a'] };
const PUR = { main: '#a86aff', glow: '#e0c8ff', core: '#ffffff', list: ['#ffffff', '#e0c8ff', '#a86aff'] };
const SMOKE = '#5a5058';

// 気が あたった（ひかり・わ・火花・けむり）。o: { r, n, smoke, ring, debris, heavy }
export function kiHit(c, x, y, d, P, o = {}) {
  const { fx, k } = c;
  const r = (o.r || 16) * c.sz;
  fx.glow(x, y, { color: P.glow, r: r * 2.4, delay: d, life: o.life || 380, alpha: 1 });
  fx.impact(x, y, { r: r * 0.9, color: P.core, delay: d });
  fx.star(x, y, P.glow, r, d + 10, 260);
  fx.shock(x, y, { r0: r * 0.3, r1: r * 2.8, color: P.glow, w: 2.2, delay: d, life: 360 });
  if (o.ring) fx.shock(x, y, { r0: r * 0.5, r1: r * 4, color: o.ring, w: 1.6, delay: d + 70, life: 420 });
  fx.sparks(x, y, { colors: P.list, n: N(c, o.n ?? 14), speed: 170, delay: d, life: 420, len: 7, size: 1.1 });
  if (o.smoke) for (let i = 0, m = N(c, o.smoke); i < m; i++) fx.puff(x + c.rnd(-8, 8), y + c.rnd(-4, 6), { color: SMOKE, r0: 3, r1: r * 0.9, vx: c.rnd(-16, 16), vy: c.rnd(-34, -12), life: o.smokeLife || 520, alpha: 0.45, delay: d + 60 });
  if (o.debris) k.debris(x, y + 10, { n: N(c, o.debris), delay: d + 40, up: 120 });
  if (o.heavy) fx.hitStop(o.heavy[0], d, o.heavy[1]);
}
// 手もとに あつまる ひかり（はなつ 前の 「か・め・は・め…」）
function gatherAt(c, x, y, P, ms, n = 8) {
  c.fx.converge(x, y, { colors: P.list, n, r: 26, life: Math.max(120, ms), delay: 0, size: 0.9 });
}
// 的の まわりに ちらばる 光の つぶ（余韻）
export function afterglow(c, x, y, P, d, n, life = 500, rise = 30) {
  c.fx.sparks(x, y, { colors: P.list, n: N(c, n), speed: 40, g: -rise, drag: 0.95, delay: d, life, len: 3, size: 1 });
}
// 画面に ただよう 光の つぶ・火の粉（余韻）。area … { x0, x1, y0, y1 }、from〜to … 出る 時間、vy … のぼる（マイナス）/ ふる（プラス）
export function ambient(c, cols, n, o = {}) {
  const { x0 = 0, x1 = c.W, y0 = 10, y1 = c.H - 10, from = 0, to = c.len * 0.6, vy = -24, life = 520, size = 1.1, kind = 'spark' } = o;
  for (let j = 0; j < n; j++) {
    const d = c.rnd(from, to);
    if (kind === 'twinkle') c.fx.twinkle(c.rnd(x0, x1), c.rnd(y0, y1), { color: cols[j % cols.length], size: c.rnd(2.5, 4.5), vy, delay: d, life: life * c.rnd(0.7, 1) });
    else c.fx.add({ kind: 'spark', x: c.rnd(x0, x1), y: c.rnd(y0, y1), vx: c.rnd(-8, 8), vy: vy * c.rnd(0.6, 1.3), g: 0, drag: 0.99, len: 3, color: cols[j % cols.length], size, life: life * c.rnd(0.7, 1), delay: d, add: true });
  }
}
// 敵ぜんぶを 左 → 右 に（ビームが なぎはらう みち）
const sweepPath = (c) => c.targets.map((t) => ({ x: t.x, y: t.y }));

// かめはめ波の なかま（段ごとに はば・色・もよう）
function kameCore(c, o) {
  const { fx, k } = c;
  const P = o.P || BLUE;
  const o0 = org(c, o.up || 0);
  const pre = o.pre ?? 110;
  // 腰の 青い 玉が ふくらむ（手の すきまから 光の すじ）
  ball(c, o0.x, o0.y, { r: o.ballR * c.sz, color: P.main, glow: P.glow, core: P.core, rim: o.ballRim, swirl: o.swirl, zap: o.ballZap, grow: pre, life: pre + 140 });
  gatherAt(c, o0.x, o0.y, P, pre, o.gatherN || 8);
  const life = c.len - pre - (o.endPad ?? 60);
  const t = c.t;
  // 的が 2つ いじょう（敵が まねて 味方 みんなに）なら なぎはらう
  const multi = c.n > 1;
  const end = kbeam(c, o0.x, o0.y, t.x, t.y, { w: o.w * c.sz, color: P.main, glow: P.glow, core: P.core, rim: o.rim, rim2: o.rim2, spiral: o.spiral, zap: o.zap, through: o.through || multi, path: multi ? sweepPath(c) : null, sweep: [c.hit - pre, c.hit - pre + c.stagger * (c.n - 1)], delay: pre, grow: c.hit - pre, life, fall: o.fall ?? 240, widths: o.widths, head: o.head ?? 1 });
  if (multi) c.each((q, i, d) => { if (i) kiHit(c, q.x, q.y, c.hit + d, P, { r: 16, n: 16, ring: o.rim || '#ffffff' }); });
  return { o0, end, pre, life };
}

export const AX_G1_DBZ = {
  // ───────────── サイヤ人 ─────────────
  ax_kidan: {
    charge: { color: '#ffe84a', color2: '#ffffff' },
    sfx: 'ax_g1_kidan', allyFx: 'bolt',
    play(fx, c) {
      const o = org(c);
      c.each((t, i, d) => {
        ball(c, o.x, o.y, { r: 4.5 * c.sz, color: '#fff27a', glow: '#ffe84a', core: '#ffffff', grow: 50, start: 50, travel: c.hit - 50, to: t, life: c.hit + 30, rays: false, delay: d });
        kiHit(c, t.x, t.y, d + c.hit, YEL, { r: 13, n: 16, smoke: 3, ring: '#ffffff', smokeLife: 480 });
        afterglow(c, t.x, t.y, YEL, d + c.hit + 60, 10, 380);
      });
      fx.converge(o.x, o.y, { colors: YEL.list, n: 10, r: 18, life: 90 });
      fx.sparks(o.x, o.y, { colors: YEL.list, n: 8, speed: 90, ang: c.ang, spread: 0.5, life: 200 });
    },
  },
  ax_kiai: {
    charge: { color: '#4ab8ff', color2: '#e8f8ff' },
    sfx: 'ax_g1_kiai', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        k.aura(a.x, a.y - 6, { style: 'flame', r: 15, h: 40, color: BLUE.main, color2: '#e8f8ff', life: 260, k: 1.1, delay: d });
        k.aura(a.x, a.y - 10, { style: 'flame', r: 20, h: 54, color: BLUE.main, color2: '#ffffff', life: 300, k: 1.4, delay: d + 170 });
        fx.shock(a.x, a.foot - 2, { r0: 6, r1: 46, sy: 0.3, color: BLUE.glow, w: 1.8, delay: d, life: 360 });
        fx.shock(a.x, a.foot - 2, { r0: 6, r1: 60, sy: 0.3, color: '#ffffff', w: 1.4, delay: d + 170, life: 360 });
        k.debris(a.x, a.foot - 4, { n: N(c, 6), up: 90, delay: d + 20 });
        fx.sparks(a.x, a.y, { colors: BLUE.list, n: N(c, 12), speed: 60, ang: -Math.PI / 2, spread: 0.6, g: -120, delay: d + 60, life: 420, len: 7 });
        // オーラが 体に すいこまれて ひかる
        fx.converge(a.x, a.y - 8, { colors: BLUE.list, n: N(c, 10), r: 30, delay: d + 300, life: 160 });
        fx.glow(a.x, a.y - 8, { color: '#ffffff', r: 26, delay: d + c.hit + 200, life: 240 });
        k.sparkles(a.x, a.y - 14, { n: 4, r: 14, delay: d + c.hit + 220, life: 260 });
      });
    },
  },
  ax_renzoku_kidan: {
    charge: { color: '#ffe84a', color2: '#ffffff', power: 0.8 },
    sfx: 'ax_g1_renzoku', allyFx: 'bolt',
    play(fx, c) {
      const o = org(c);
      const shots = 10;
      const per = N(c, 1, 0.7);
      for (let i = 0; i < shots; i++) {
        const t = c.targets[i % c.n];
        const sx = o.x + (i % 2 ? 11 : -11), sy = o.y;
        const tx = t.x + c.rnd(-9, 9), ty = t.y + c.rnd(-9, 7);
        const d = c.hit - 130 + i * 42;
        ball(c, sx, sy, { r: 3.6 * c.sz, color: '#fff27a', glow: '#ffe84a', grow: 30, start: 30, travel: 100, to: { x: tx, y: ty }, life: 150, rays: false, delay: d - 30 });
        fx.glow(tx, ty, { color: '#ffe84a', r: 14, delay: d + 100, life: 200 });
        fx.impact(tx, ty, { r: 9, color: '#ffffff', delay: d + 100 });
        fx.sparks(tx, ty, { colors: YEL.list, n: 5 * per, speed: 140, delay: d + 100, life: 280, len: 5 });
      }
      // さいごに「やったか!?」の けむり
      c.each((t, i, d) => {
        for (let j = 0; j < N(c, 5); j++) fx.puff(t.x + c.rnd(-12, 12), t.y + c.rnd(-10, 8), { color: j % 2 ? '#7a7078' : '#5a5058', r0: 6, r1: 18, vx: c.rnd(-8, 8), vy: c.rnd(-8, -2), life: 380, alpha: 0.75, delay: c.hit + 300 + j * 20 });
        c.k.shake(120, 1, c.hit + d);
      });
      c.k.shake(160, 1.2, c.hit + 300);
    },
  },
  ax_taiyoken: {
    charge: { color: '#ffffff', color2: '#fff6b0' },
    sfx: 'ax_g1_taiyo', allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const o = org(c, 10);
      // ひたいの 前に 手の 光 2つ
      fx.glow(o.x - 5, o.y, { color: '#fff6b0', r: 10, life: 120 });
      fx.glow(o.x + 5, o.y, { color: '#fff6b0', r: 10, life: 120 });
      // 画面ぜんたいが 真っ白
      k.tint('#ffffff', { a: 0.95, life: 360, fin: 40, fout: 260, delay: 80, top: true });
      bg(c, 'rays', { x: o.x, y: o.y, color: '#fffbe0', color2: null, a: 0.9, delay: 60, life: 420, fin: 40, fout: 200 });
      fx.glow(o.x, o.y, { color: '#ffffff', r: 60, delay: 70, life: 400 });
      fx.sparks(o.x, o.y, { colors: ['#ffffff', '#fff6b0'], n: 24, speed: 260, delay: 80, life: 360, len: 10 });
      c.each((t, i, d) => {
        fx.glow(t.x, t.y, { color: '#ffffff', r: 22, delay: d + c.hit, life: 260 });
        // 目が くらんで ぐるぐる と 星
        mark(c, 'dizzy', t.x, t.y - 22 * c.sz, { size: 8 * c.sz, color: '#ffe066', color2: '#3a2a10', delay: d + c.hit + 120, life: c.len - c.hit - 160 - d, spin: 6 });
        for (let j = 0; j < 3; j++) fx.twinkle(t.x + Math.cos(j * 2.1) * 12, t.y - 22 * c.sz + Math.sin(j * 2.1) * 4, { color: '#fff27a', size: 4, delay: d + c.hit + 160 + j * 60, life: 300 });
        k.shapes(t.x, t.y - 20, { shape: 'star', n: N(c, 6), colors: ['#fff27a', '#ffffff'], speed: 30, size: 2, delay: d + c.hit + 100, life: 360 });
      });
    },
  },
  ax_kamehameha: {
    charge: { color: '#4ab8ff', color2: '#e8f8ff' },
    sfx: 'ax_g1_kame', allyFx: 'bolt', beamW: 10,
    play(fx, c) {
      const { o0, pre } = kameCore(c, { w: 10, ballR: 7, pre: 110, widths: [0.9, 1, 1, 0.75, 0.25] });
      const t = c.t;
      kiHit(c, t.x, t.y, c.hit, BLUE, { r: 16, n: 18, ring: '#ffffff' });
      fx.glow(t.x, t.y, { color: BLUE.main, r: 26 * c.sz, delay: c.hit, life: c.len - c.hit - 80, alpha: 0.8 });
      afterglow(c, t.x, t.y, BLUE, c.hit + 160, 16, 380, 40);
      fx.sparks(o0.x, o0.y, { colors: BLUE.list, n: 10, speed: 70, delay: pre, life: 300 });
      c.k.shake(160, 1.2, c.hit);
    },
  },
  ax_bukuu: {
    charge: { color: '#e8f8ff', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_bukuu', allyFx: 'wind',
    play(fx, c) {
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        for (let j = 0; j < 3; j++) fx.shock(a.x, a.foot - 4 + j * 3, { r0: 6, r1: 36 + j * 12, sy: 0.28, color: '#ffffff', w: 1.6, delay: d + j * 90, life: 360 });
        wind(c, a.x, a.y - 4, { w: 30, h: 36, dir: 1, n: 12, delay: d, life: 440 });
        c.k.aura(a.x, a.y - 14, { style: 'pulse', r: 18, h: 30, color: '#e8f8ff', color2: '#ffffff', delay: d + 80, life: 400 });
        fx.puff(a.x - 14, a.foot - 2, { color: '#d8d0c0', r0: 3, r1: 10, vx: -30, vy: -4, life: 400, alpha: 0.5, delay: d });
        fx.puff(a.x + 14, a.foot - 2, { color: '#d8d0c0', r0: 3, r1: 10, vx: 30, vy: -4, life: 400, alpha: 0.5, delay: d });
        fx.sparks(a.x, a.foot - 4, { colors: ['#ffffff', '#e8f8ff'], n: 10, speed: 70, ang: Math.PI / 2, spread: 0.9, g: 40, delay: d + 40, life: 360 });
        fx.glow(a.x, a.y - 16, { color: '#ffffff', r: 20, delay: d + c.hit, life: 260 });
      });
    },
  },
  ax_ozaru: {
    charge: { color: '#ffffff', color2: '#fff6d8' },
    sfx: 'ax_g1_ozaru', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const a = selfAt(c, c.t);
      // 空の 白い 満月（パワーボール）
      ball(c, a.x + (a.x < c.W / 2 ? 34 : -34), 24, { r: 13, color: '#fffbe0', glow: '#fff6c8', core: '#ffffff', rays: true, grow: 80, life: c.len - 80 });
      k.tint('#ff2a1a', { a: 0.32, life: c.len - 40, fin: 140, fout: 220 });
      monkey(c, a.x, a.ally ? c.H - 36 : a.y - 6, { s: a.ally ? 2.1 : 1.2, rise: 220, delay: 30, life: c.len - 30 });
      // ゴアアッ（ほえる）
      fx.shock(a.x, a.ally ? c.H - 20 : a.y, { r0: 10, r1: 90, color: '#ff9a7a', w: 2.4, delay: c.hit, life: 360 });
      fx.shock(a.x, a.ally ? c.H - 20 : a.y, { r0: 10, r1: 120, color: '#ffffff', w: 1.4, delay: c.hit + 90, life: 360 });
      k.shake(300, 2, c.hit);
      k.debris(a.x, a.foot - 4, { n: 10, up: 120, delay: c.hit });
      fx.sparks(a.x, a.y - 10, { colors: ['#ff4a2a', '#ffb07a', '#ffffff'], n: 20, speed: 120, ang: -Math.PI / 2, spread: 1.2, delay: c.hit, life: 420 });
    },
  },
  ax_saiyan_rush: {
    charge: { color: '#4ab8ff', color2: '#ffffff', power: 0.8 },
    sfx: 'ax_g1_rush', allyFx: 'claw',
    play(fx, c) {
      const t = c.t;
      const n = 10, gap = 38, first = c.hit - 60;
      for (let i = 0; i < n; i++) {
        const ang = i * 2.4 + c.rnd(-0.3, 0.3);
        const hx = t.x + c.rnd(-8, 8), hy = t.y + c.rnd(-8, 6);
        fist(c, hx + Math.cos(ang) * 34, hy + Math.sin(ang) * 26, hx, hy, { s: 0.9 * c.sz, color: '#ffffff', glow: '#a8e4ff', travel: 60, life: 130, delay: first + i * gap });
        fx.star(hx, hy, '#ffffff', 7, first + i * gap + 60, 160);
        fx.sparks(hx, hy, { colors: ['#ffffff', '#a8e4ff'], n: 4, speed: 120, delay: first + i * gap + 60, life: 220, len: 5 });
        c.k.speedLines(hx, hy, { n: 6, delay: first + i * gap, life: 90, r0: 14, r1: 50, color: '#e8f8ff' });
      }
      // さいごに 上から キック
      const dk = first + n * gap + 30;
      fist(c, t.x + 10, t.y - 46, t.x, t.y - 4, { s: 1.4 * c.sz, color: '#ffffff', glow: '#a8e4ff', travel: 70, life: 170, delay: dk });
      kiHit(c, t.x, t.y, dk + 70, { ...BLUE, glow: '#ffffff' }, { r: 18, n: 16, smoke: 3, debris: 6, heavy: [140, 1.6] });
    },
  },
  ax_bigbang: {
    charge: { color: '#a8e4ff', color2: '#ffffff' },
    sfx: 'ax_g1_bigbang', allyFx: 'bolt',
    play(fx, c) {
      const o = org(c, 6);
      // つき出した 手の 先で 白い 光が ちぢむ
      fx.glow(o.x, o.y, { color: '#ffffff', r: 22, life: 120 });
      fx.converge(o.x, o.y, { colors: BLUE.list, n: 12, r: 30, life: 110 });
      const cx = c.center.x, cy = c.center.y;
      ball(c, o.x, o.y, { r: 11 * c.sz, color: '#bfe8ff', glow: BLUE.glow, core: '#ffffff', rim: '#ffffff', grow: 110, start: 120, travel: c.hit - 120, to: { x: cx, y: cy }, life: c.hit + 40, ease: 'lin' });
      const gy = Math.max(...c.targets.map((t) => t.y)) + 12;
      dome(c, cx, gy, { r: (c.all ? 42 : 34) * c.sz, sx: c.all ? 2.2 : 1.4, color: BLUE.main, glow: BLUE.glow, delay: c.hit, grow: 200, life: c.len - c.hit - 30 });
      c.k.flash('#ffffff', 90, c.hit);
      c.k.shake(220, 1.4, c.hit);
      fx.shock(cx, gy, { r0: 10, r1: c.all ? 120 : 80, sy: 0.26, color: '#c8d8e8', w: 2.4, delay: c.hit + 80, life: 420 });
      c.each((t, i, d) => {
        kiHit(c, t.x, t.y, c.hit + d, BLUE, { r: 12, n: 14, smoke: 2 });
      });
      afterglow(c, cx, cy, BLUE, c.hit + 200, 12, 300, 30);
    },
  },
  ax_kaiouken: {
    charge: { color: '#ff3a2a', color2: '#ffd0a0' },
    sfx: 'ax_g1_kaiouken', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        k.aura(a.x, a.y - 8, { style: 'flame', r: 16, h: 44, color: RED.main, color2: '#ffd0a0', life: 300, k: 1.2, delay: d });
        k.aura(a.x, a.y - 14, { style: 'flame', r: 23, h: 62, color: '#ff2a1a', color2: '#ffe0c0', life: c.len - 120 - d, k: 1.6, delay: d + 150 });
        fx.shock(a.x, a.foot - 3, { r0: 6, r1: 60, sy: 0.3, color: '#ff6a4a', w: 2, delay: d + 150, life: 380 });
        mark(c, 'x2', a.x + 22, a.y - 34, { size: 6, color: '#ff3a2a', color2: '#ffffff', delay: d + c.hit, life: 300 });
        fx.sparks(a.x, a.y, { colors: RED.list, n: 16, speed: 70, ang: -Math.PI / 2, spread: 0.7, g: -120, delay: d + 160, life: 420, len: 6 });
      });
      k.tint('#ff2a1a', { a: 0.18, life: c.len - 80, fin: 120, fout: 200 });
    },
  },
  ax_kienzan: {
    charge: { color: '#ffe84a', color2: '#ffffff' },
    sfx: 'ax_g1_kienzan', allyFx: 'claw',
    play(fx, c) {
      const t = c.t;
      const o = org(c, c.fromAlly ? 22 : 22);
      // 頭の 上で 円盤が 回りながら 大きく なる → カーブして とぶ
      const pre = 140;
      disk(c, o.x, o.y, t.x, t.y, { r: 13 * c.sz, grow: pre, travel: (c.hit - pre) / 0.62, bend: c.fromAlly ? 60 : -60, life: c.len - 80 });
      fx.converge(o.x, o.y, { colors: YEL.list, n: 10, r: 24, life: pre });
      // 敵を すっと 横切る 細い 切れ目（あとから 光る）
      fx.cut(t.x, t.y, { ang: -0.15, len: 46 * c.sz, w: 1, color: '#ffffff', glow: '#ffe84a', delay: c.hit, life: 220 });
      fx.cut(t.x, t.y, { ang: -0.15, len: 56 * c.sz, w: 2.4, color: '#fff8b0', glow: '#ffe84a', delay: c.hit + 140, life: 280 });
      fx.glow(t.x, t.y, { color: '#ffe84a', r: 26, delay: c.hit + 140, life: 260 });
      fx.sparks(t.x, t.y, { colors: YEL.list, n: 18, speed: 150, ang: -0.15, spread: 0.3, delay: c.hit, life: 360, len: 8 });
      fx.sparks(t.x, t.y, { colors: YEL.list, n: 14, speed: 100, delay: c.hit + 140, life: 300, len: 5 });
    },
  },
  // ───────────── スーパーサイヤ人 ─────────────
  ax_kamehameha_super: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_kame2', allyFx: 'bolt', beamW: 15,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.18, c.len - 60);
      const { o0 } = kameCore(c, { w: 15, ballR: 11, pre: 130, rim: '#ffb21a', ballRim: '#ffb21a', through: true, head: 0.7, widths: [0.8, 1, 1.05, 0.9, 0.4] });
      k.aura(o0.x, o0.y - 6, { style: 'flame', r: 16, h: 34, color: GOLD.main, color2: '#fff6c8', life: 380, k: 1.2 });
      const t = c.t;
      // ビームの まわりを 金の 火花が ながれる
      for (let i = 0; i < 6; i++) fx.sparks(lerp(o0.x, t.x, 0.2 + i * 0.13), lerp(o0.y, t.y, 0.2 + i * 0.13), { colors: GOLD.list, n: 4, speed: 80, ang: Math.atan2(t.y - o0.y, t.x - o0.x), spread: 0.4, delay: c.hit + i * 30, life: 300, len: 6 });
      kiHit(c, t.x, t.y, c.hit, BLUE, { r: 20, n: 22, ring: '#ffb21a', debris: 8, heavy: [180, 1.7] });
      fx.shock(t.x, t.y, { r0: 8, r1: 70, color: '#ffb21a', w: 2, delay: c.hit + 160, life: 380 });
      fx.glow(t.x, t.y, { color: BLUE.main, r: 32 * c.sz, delay: c.hit, life: c.len - c.hit - 80, alpha: 0.8 });
      afterglow(c, t.x, t.y, GOLD, c.hit + 220, 18, 420, 30);
    },
  },
  ax_ssj_aura: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_ssj', allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      k.flash('#ffe066', 120, 0);
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        k.aura(a.x, a.y - 16, { style: 'flame', r: 26, h: 72, color: GOLD.main, color2: '#fffbe0', life: c.len - 80 - d, k: 1.6, delay: d });
        fx.shock(a.x, a.y - 14, { r0: 10, r1: 70, color: '#ffe066', w: 2.6, delay: d + 20, life: 380 });
        fx.shock(a.x, a.foot - 3, { r0: 10, r1: 80, sy: 0.28, color: '#fff6c8', w: 2, delay: d + 40, life: 420 });
        for (let j = 0; j < 8; j++) fx.add({ kind: 'axShape', shape: 'rock', x: a.x + c.rnd(-40, 40), y: a.foot - c.rnd(2, 8), vx: c.rnd(-6, 6), vy: c.rnd(-70, -30), g: -10, drag: 0.98, color: ['#a08060', '#6a5040', '#d8c0a0'][j % 3], size: c.rnd(1.2, 2.4), rot0: c.rnd(0, 6), spin: c.rnd(-4, 4), delay: d + c.rnd(0, 200), life: 480 });
        fx.sparks(a.x, a.y - 10, { colors: GOLD.list, n: 26, speed: 90, ang: -Math.PI / 2, spread: 0.8, g: -100, delay: d + 30, life: 520, len: 7 });
        k.boltRain(a.x, a.y - 20, { n: 2, w: 1.2, color: '#ffffff', glow: '#ffb21a', spread: 20, delay: d + 120, life: 200 });
      });
      k.tint('#ffb21a', { a: 0.12, life: c.len - 100, fin: 60, fout: 200 });
    },
  },
  ax_kikouha: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_kikouha', allyFx: 'bolt',
    play(fx, c) {
      const o = org(c);
      const angs = c.targets.map((t) => Math.atan2(t.y - o.y, t.x - o.x));
      const amin = Math.min(...angs), amax = Math.max(...angs);
      const R = Math.max(...c.targets.map((t) => Math.hypot(t.x - o.x, t.y - o.y))) + 30;
      fan(c, o.x, o.y, { ang: (amin + amax) / 2, spread: Math.max(0.35, (amax - amin) / 2 + 0.3), r: R, color: '#ffe84a', glow: '#fff8b0', grow: c.hit, life: c.len - 120 });
      fx.glow(o.x, o.y, { color: '#fff8b0', r: 30, life: 300 });
      // 扇の なかを 光の つぶが ながれる
      for (let j = 0; j < 3; j++) fx.sparks(o.x, o.y, { colors: YEL.list, n: N(c, 14, 0.8), speed: 240, ang: (amin + amax) / 2, spread: Math.max(0.3, (amax - amin) / 2 + 0.2), g: 0, drag: 0.98, delay: j * 70, life: 480, len: 9 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y + 6, { w: 10 * c.sz, color: '#fff27a', glow: '#ffe84a', delay: c.hit + d, life: 420, burst: c.n < 3 });
        kiHit(c, t.x, t.y, c.hit + d, YEL, { r: 14, n: 18, smoke: 2 });
        afterglow(c, t.x, t.y, GOLD, c.hit + d + 150, 10, 360);
      });
      c.k.shake(200, 1.6, c.hit);
    },
  },
  ax_zanzouken: {
    charge: { color: '#ffb21a', color2: '#ffffff', power: 0.7 },
    sfx: 'ax_g1_zanzou', allyFx: 'wind',
    play(fx, c) {
      const t = c.t;
      const a = selfAt(c, t);
      const s = a.ally ? 1.5 : 1.1;
      const hy = a.ally ? c.H - 52 : a.y - 18;
      // 本物は シュンッと 消える（たての すじ）
      c.k.beam(a.x, hy + 50, a.x, hy - 30, { w: 4, color: '#ffffff', glow: '#fff6c8', life: 140, grow: 60, burst: false });
      fx.sparks(a.x, hy + 10, { colors: ['#ffffff', '#fff6c8'], n: 12, speed: 120, delay: 40, life: 260 });
      // ざんぞう 3つ（左右に ずれて ちらつき、1つずつ 消える）
      [-16, 16, 0].forEach((dx, j) => {
        ghost(c, a.x + dx, hy, { s, color: j === 2 ? '#fff6c8' : '#cfe8ff', delay: 60 + j * 40, life: c.len - 160 - (2 - j) * 120 });
        c.k.sparkles(a.x + dx, hy + 12 * s, { n: 3, r: 8, delay: c.len - 200 - (2 - j) * 120, life: 200 });
      });
      for (let j = 0; j < 4; j++) c.k.streaks({ ang: j % 2 ? 0 : Math.PI, color: '#ffffff', n: 8, delay: 80 + j * 100, life: 140, alpha: 0.4 });
      fx.puff(a.x, a.foot - 4, { color: '#e0d8c8', r0: 4, r1: 16, life: 380, alpha: 0.5 });
      fx.sparks(a.x, hy + 20, { colors: ['#ffffff', '#cfe8ff'], n: 12, speed: 160, ang: 0, spread: Math.PI, g: 0, delay: 60, life: 260, len: 8 });
    },
  },
  ax_ikari_kakusei: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_ikari', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const a = selfAt(c, c.t);
      bg(c, 'sky', { x: a.x, y: a.y - 30, color: '#ffb21a', color2: '#141020', a: 0.6, life: c.len - 40, fin: 80, fout: 260 });
      // 空から 白い いなずまが 2本
      k.bolt(a.x - 20, -10, a.x - 2, a.y - 16, { w: 2.4, color: '#ffffff', glow: '#bfe0ff', forks: 2, delay: 40, life: 260, grow: 60 });
      k.bolt(a.x + 24, -10, a.x + 2, a.y - 16, { w: 2.2, color: '#ffffff', glow: '#ffe066', forks: 2, delay: 140, life: 240, grow: 60 });
      k.flash('#ffffff', 100, 100);
      k.aura(a.x, a.y - 16, { style: 'flame', r: 26, h: 70, color: GOLD.main, color2: '#ffffff', delay: c.hit - 40, life: c.len - c.hit - 40, k: 1.6 });
      fx.shock(a.x, a.y - 14, { r0: 10, r1: 90, color: '#ffe066', w: 2.6, delay: c.hit, life: 400 });
      k.shake(300, 2, c.hit);
      k.debris(a.x, a.foot - 4, { n: 12, up: 150, delay: c.hit });
      // 金の 火花が 雨の ように
      for (let j = 0; j < 22; j++) fx.add({ kind: 'spark', x: a.x + c.rnd(-60, 60), y: c.rnd(-4, 30), vx: 0, vy: c.rnd(40, 80), g: 60, drag: 0.99, len: 5, color: GOLD.list[j % 3], size: 1, life: 420, delay: c.hit + 100 + c.rnd(0, 200), add: true });
    },
  },
  ax_final_flash: {
    charge: { color: '#ffe23a', color2: '#ffffff' },
    sfx: 'ax_g1_final', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const t = c.t;
      const pre = 150;
      darken(c, 0.25, c.len - 60);
      // 両腕を 広げて 閉じる（左右の 黄色い 光が まん中へ）
      for (const sx of [-1, 1]) ball(c, o.x + sx * 34, o.y - 6, { r: 6, color: YEL.main, glow: YEL.glow, rays: false, grow: 40, start: 40, travel: pre - 40, to: { x: o.x, y: o.y }, life: pre + 20 });
      fx.glow(o.x, o.y, { color: '#ffffff', r: 26, delay: pre - 30, life: 160 });
      kbeam(c, o.x, o.y, t.x, t.y, { w: 18 * c.sz, color: '#ffd400', glow: '#ffb800', core: '#fffbe0', coreW: 0.22, rim: '#ffea4a', zap: '#ffffff', through: true, delay: pre, grow: c.hit - pre, life: c.len - pre - 60, fall: 400, widths: [1, 1, 1, 0.75, 0.4], head: 0.8 });
      kiHit(c, t.x, t.y, c.hit, YEL, { r: 22, n: 24, ring: '#ffffff', debris: 8, heavy: [200, 1.9] });
      k.explosion(t.x, t.y, { r: 20 * c.sz, pal: { main: '#ffe23a', glow: '#fff8a8', core: '#ffffff', list: YEL.list }, delay: c.hit + 120, heavy: false });
      k.pillar(t.x, t.y + 8, { w: 10 * c.sz, color: '#ffd400', glow: '#ffb800', core: '#fff6b0', delay: c.hit + 160, life: 420, burst: false });
    },
  },
  ax_renzoku_kikouha: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_renzoku2', allyFx: 'bolt',
    play(fx, c) {
      const o = org(c);
      const shots = 18;
      let tm = c.hit - 110;
      for (let i = 0; i < shots; i++) {
        const t = c.targets[(i * 7 + (i >> 1)) % c.n];
        const tx = t.x + c.rnd(-12, 12), ty = t.y + c.rnd(-12, 8);
        ball(c, o.x + (i % 2 ? 12 : -12), o.y, { r: 4.2 * c.sz, color: GOLD.main, glow: GOLD.glow, grow: 20, start: 20, travel: 90, to: { x: tx, y: ty }, life: 120, rays: false, delay: tm - 20 });
        fx.glow(tx, ty, { color: '#ffb21a', r: 16, delay: tm + 90, life: 220 });
        fx.impact(tx, ty, { r: 10, color: '#ffffff', delay: tm + 90 });
        fx.sparks(tx, ty, { colors: GOLD.list, n: N(c, 4, 0.8), speed: 140, delay: tm + 90, life: 260, len: 5 });
        tm += Math.max(18, 44 - i * 1.8);
      }
      // 大きな けむりの 雲 → 金の 火花
      const cy = c.center.y, cx = c.center.x;
      const wide = c.all ? 70 : 24;
      for (let j = 0; j < 12; j++) fx.puff(cx + c.rnd(-wide, wide), cy + c.rnd(-12, 10), { color: j % 2 ? '#7a7078' : '#5a5058', r0: 6, r1: 22, vx: c.rnd(-10, 10), vy: c.rnd(-10, -3), life: 380, alpha: 0.7, delay: tm + 40 + j * 10 });
      fx.sparks(cx, cy, { colors: GOLD.list, n: 20, speed: 120, delay: tm + 120, life: 320 });
      c.k.shake(300, 1.5, c.hit);
    },
  },
  ax_bigbang_kame: {
    charge: { color: '#ffb21a', color2: '#ffffff' },
    sfx: 'ax_g1_bbkame', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const pre = 150;
      // 前に 白い 玉・腰に 青い 玉、2つの 光が まわる
      for (let j = 0; j < 2; j++) {
        const a0 = j * Math.PI;
        ball(c, o.x + Math.cos(a0) * 14, o.y + Math.sin(a0) * 5, { r: 7, color: j ? '#ffffff' : BLUE.main, glow: j ? '#fff0a0' : BLUE.glow, rays: false, grow: 60, start: 60, travel: pre - 60, to: { x: o.x, y: o.y }, hop: j ? 8 : -8, life: pre + 20 });
      }
      const pts = sweepPath(c);
      const sweepMs = c.stagger * (c.n - 1);
      kbeam(c, o.x, o.y, pts[0].x, pts[0].y, { w: 15 * c.sz, color: '#bfe8ff', glow: '#fff0a0', core: '#ffffff', twist: [BLUE.main, GOLD.main], path: c.n > 1 ? pts : null, sweep: [c.hit - pre, c.hit - pre + sweepMs], delay: pre, grow: c.hit - pre, life: c.len - pre - 60, fall: 260, through: true, head: 0.8 });
      c.each((t, i, d) => {
        dome(c, t.x, t.y + 12, { r: 24 * c.sz, sx: 1.3, color: BLUE.main, glow: '#e0f4ff', delay: c.hit + d, grow: 180, life: 520 });
        kiHit(c, t.x, t.y, c.hit + d, { ...BLUE, list: ['#ffffff', '#fff0a0', '#3aa8ff'] }, { r: 18, n: 26, debris: 8, ring: '#ffb21a' });
        if (c.n === 1) k.explosion(t.x, t.y, { r: 16 * c.sz, pal: { main: BLUE.main, glow: '#e0f4ff', core: '#ffffff', list: ['#ffffff', '#ffb21a', '#3aa8ff'] }, delay: c.hit + d + 100, heavy: false });
        afterglow(c, t.x, t.y, { list: ['#3aa8ff', '#ffb21a', '#ffffff'] }, c.hit + d + 220, 16, 420);
      });
      fx.converge(o.x, o.y, { colors: ['#ffffff', '#ffb21a', '#3aa8ff'], n: 18, r: 34, life: pre });
      k.shake(300, 1.8, c.hit);
    },
  },
  ax_ss2_spark: {
    charge: { color: '#ffb21a', color2: '#bfe8ff' },
    sfx: 'ax_g1_spark', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const t = c.t, o = org(c);
      k.dash(o.x, o.y, t.x, t.y, { color: '#ffb21a', travel: c.hit - 40, w: 5 });
      fist(c, o.x, o.y, t.x, t.y, { s: 1.5 * c.sz, color: '#ffe066', glow: '#ffb21a', zap: '#bfe8ff', travel: c.hit, life: c.hit + 200 });
      for (let j = 0; j < 6; j++) {
        const a = j / 6 * TAU + c.rnd(-0.3, 0.3);
        k.bolt(t.x, t.y, t.x + Math.cos(a) * 34 * c.sz, t.y + Math.sin(a) * 26 * c.sz, { w: 1.4, color: '#ffffff', glow: '#9ad8ff', forks: 1, n: 6, amp: 6, delay: c.hit + j * 30, life: 220, grow: 40 });
      }
      kiHit(c, t.x, t.y, c.hit, GOLD, { r: 18, n: 22, ring: '#bfe8ff', heavy: [180, 1.8] });
      k.shapes(t.x, t.y, { shape: 'star', n: 8, colors: ['#ffe066', '#ffffff'], speed: 90, size: 2.6, delay: c.hit + 40, life: 420 });
      afterglow(c, t.x, t.y, { list: ['#bfe8ff', '#ffe066', '#ffffff'] }, c.hit + 200, 20, 380);
      // とびこむ すじに 金の 火花・いなずまの こな
      for (let j = 0; j < 5; j++) fx.sparks(lerp(o.x, t.x, j / 5), lerp(o.y, t.y, j / 5), { colors: ['#ffe066', '#bfe8ff', '#ffffff'], n: 5, speed: 60, delay: j * (c.hit / 5), life: 300, len: 4 });
      fx.shock(t.x, t.y, { r0: 6, r1: 64, color: '#ffe066', w: 2.4, delay: c.hit + 60, life: 380 });
      fx.sparks(t.x, t.y, { colors: ['#bfe8ff', '#ffffff'], n: 16, speed: 200, delay: c.hit + 30, life: 300, len: 8 });
    },
  },
  // ───────────── 超サイヤ人2 ─────────────
  ax_kamehameha_spark: {
    charge: { color: '#ffb21a', color2: '#bfe8ff' },
    sfx: 'ax_g1_kame3', allyFx: 'bolt', beamW: 20,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4, c.len - 60);
      const { o0 } = kameCore(c, { w: 20, ballR: 14, pre: 140, through: true, head: 0.75, rim: '#ffb21a', zap: '#fff27a', ballRim: '#ffb21a', ballZap: '#fff27a', widths: [0.8, 1, 1.08, 1, 0.5] });
      k.aura(o0.x, o0.y - 8, { style: 'flame', r: 18, h: 40, color: GOLD.main, color2: '#fff6c8', life: 420, k: 1.4 });
      for (let j = 0; j < 3; j++) k.bolt(o0.x + c.rnd(-16, 16), o0.y - c.rnd(4, 24), o0.x + c.rnd(-16, 16), o0.y + c.rnd(-4, 6), { w: 1, color: '#ffffff', glow: '#9ad8ff', forks: 0, n: 5, amp: 4, delay: j * 50, life: 120, grow: 20 });
      const t = c.t;
      kiHit(c, t.x, t.y, c.hit, BLUE, { r: 24, n: 26, ring: '#fff27a', debris: 10 });
      k.explosion(t.x, t.y, { r: 24 * c.sz, pal: { main: BLUE.main, glow: '#bfe8ff', core: '#ffffff', list: ['#ffffff', '#fff27a', '#3aa8ff'] }, delay: c.hit + 140, heavy: false });
      // 電気が 地面に ちる
      for (let j = 0; j < 5; j++) k.bolt(t.x, t.y, t.x + c.rnd(-60, 60), t.y + c.rnd(16, 34), { w: 1.4, color: '#ffffff', glow: '#fff27a', forks: 1, n: 7, amp: 7, delay: c.hit + 60 + j * 50, life: 220, grow: 40 });
      k.shake(400, 2.4, c.hit);
      k.flash('#ffffff', 90, c.hit);
      afterglow(c, t.x, t.y, { list: ['#3aa8ff', '#fff27a', '#ffffff'] }, c.hit + 260, 24, 460, 30);
    },
  },
  ax_ss2_aura: {
    charge: { color: '#ffb21a', color2: '#bfe8ff' },
    sfx: 'ax_g1_ss2aura', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35, c.len - 60);
      k.flash('#ffe066', 120, 0);
      c.each((t, i, d) => {
        const a = selfAt(c, t);
        k.aura(a.x, a.y - 18, { style: 'flame', r: 28, h: 78, color: GOLD.main, color2: '#ffffff', life: c.len - 80 - d, k: 1.9, delay: d });
        fx.shock(a.x, a.y - 16, { r0: 10, r1: 90, color: '#ffe066', w: 2.8, delay: d + 20, life: 420 });
        // いなずまが 体の まわりを はしり つづける
        for (let j = 0; j < 10; j++) {
          const bx = a.x + c.rnd(-26, 26), by = a.y - c.rnd(0, 56);
          k.bolt(bx, by, bx + c.rnd(-14, 14), by + c.rnd(-14, 14), { w: 1.1, color: '#ffffff', glow: '#9ad8ff', forks: 1, n: 5, amp: 5, delay: d + 40 + j * 70, life: 140, grow: 20 });
        }
        for (let j = 0; j < 8; j++) fx.add({ kind: 'axShape', shape: 'rock', x: a.x + c.rnd(-50, 50), y: a.foot - c.rnd(2, 8), vx: c.rnd(-8, 8), vy: c.rnd(-80, -40), g: 30, drag: 0.98, color: ['#a08060', '#6a5040', '#d8c0a0'][j % 3], size: c.rnd(1.4, 2.8), rot0: c.rnd(0, 6), spin: c.rnd(-6, 6), delay: d + c.rnd(0, 300), life: 520 });
        // 画面の 下に 金の 光の 波
        fx.shock(a.x, a.foot - 3, { r0: 10, r1: 130, sy: 0.22, color: '#ffe066', w: 3, delay: d + c.hit, life: 460 });
        fx.sparks(a.x, a.y - 10, { colors: GOLD.list, n: 30, speed: 100, ang: -Math.PI / 2, spread: 0.8, g: -110, delay: d + 40, life: 560, len: 8 });
        fx.sparks(a.x, a.y - 10, { colors: ['#bfe8ff', '#ffffff'], n: 16, speed: 140, delay: d + c.hit, life: 400, len: 5 });
      });
      k.shake(300, 1.5, c.hit);
    },
  },
  ax_ss2_rush: {
    charge: { color: '#ffb21a', color2: '#bfe8ff' },
    sfx: 'ax_g1_rush2', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35, c.len - 60);
      const t = c.t;
      const n = 16, gap = 32, first = c.hit - 60;
      for (let i = 0; i < n; i++) {
        const ang = i * 2.39 + c.rnd(-0.2, 0.2);
        const hx = t.x + c.rnd(-10, 10), hy = t.y + c.rnd(-10, 8);
        fist(c, hx + Math.cos(ang) * 38, hy + Math.sin(ang) * 30, hx, hy, { s: 1 * c.sz, color: '#ffe066', glow: '#ffb21a', zap: i % 3 ? null : '#bfe8ff', travel: 55, life: 120, delay: first + i * gap });
        fx.star(hx, hy, '#fff6b0', 8, first + i * gap + 55, 160);
        fx.sparks(hx, hy, { colors: GOLD.list, n: 4, speed: 130, delay: first + i * gap + 55, life: 220, len: 5 });
        if (i % 4 === 0) k.bolt(hx, hy, hx + c.rnd(-24, 24), hy + c.rnd(-20, 20), { w: 1.1, color: '#ffffff', glow: '#9ad8ff', forks: 0, n: 5, amp: 5, delay: first + i * gap + 55, life: 140, grow: 20 });
      }
      // さいごに 下から 突き上げ
      const du = first + n * gap + 40;
      fist(c, t.x, t.y + 50, t.x, t.y - 4, { s: 1.8 * c.sz, color: '#ffe066', glow: '#ffb21a', zap: '#bfe8ff', travel: 70, life: 200, delay: du });
      kiHit(c, t.x, t.y - 4, du + 70, GOLD, { r: 22, n: 24, debris: 8, ring: '#bfe8ff' });
      k.speedLines(t.x, t.y, { n: 18, delay: du + 70, life: 220, color: '#fff6c8' });
      k.shake(300, 2.4, du + 70);
      k.flash('#fff6c8', 80, du + 70);
    },
  },
  ax_kiaihou: {
    charge: { color: '#ffb21a', color2: '#ffffff' },
    sfx: 'ax_g1_kiaihou', allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.3, c.len - 60);
      const o = org(c, 6);
      // 透明な 衝撃の 輪（白い ふちだけ）が 3重
      for (let j = 0; j < 3; j++) {
        fx.shock(o.x, o.y, { r0: 8, r1: 230, color: '#ffffff', w: 2.6 - j * 0.5, delay: j * 90, life: 560 });
        fx.shock(o.x, o.y, { r0: 6, r1: 210, color: '#cfe8ff', w: 6, delay: j * 90 + 10, life: 520, add: true });
      }
      fx.glow(o.x, o.y, { color: '#ffffff', r: 34, life: 220 });
      k.shake(500, 2.2, 60);
      // 空気が ふきとぶ（白い つぶ・ちり が 外へ）
      fx.sparks(o.x, o.y, { colors: ['#ffffff', '#cfe8ff'], n: 36, speed: 260, g: 0, drag: 0.97, life: 520, len: 10 });
      ambient(c, ['#ffffff', '#cfe8ff', '#e0d8c8'], 44, { from: 60, to: 500, vy: -14, life: 480 });
      c.each((t, i, d) => {
        const ang = Math.atan2(t.y - o.y, t.x - o.x);
        kiHit(c, t.x, t.y, c.hit + d, { main: '#ffffff', glow: '#cfe8ff', core: '#ffffff', list: ['#ffffff', '#cfe8ff', '#e0d8c8'] }, { r: 14, n: 16 });
        // 敵が いっせいに 後ろに はねる すじ
        for (let j = 0; j < 5; j++) fx.cut(t.x + Math.cos(ang) * 14 + c.rnd(-10, 10), t.y + Math.sin(ang) * 10 + c.rnd(-10, 10), { ang, len: 22, w: 1.2, color: '#ffffff', glow: '#cfe8ff', delay: c.hit + d + 30 + j * 20, life: 220, speed: 80 });
        for (let j = 0; j < N(c, 6); j++) fx.puff(t.x + c.rnd(-16, 16), t.y + 16, { color: '#c8b8a0', r0: 3, r1: 12, vx: Math.cos(ang) * 40 + c.rnd(-10, 10), vy: c.rnd(-20, -6), life: 560, alpha: 0.5, delay: c.hit + d + 60 });
      });
      c.k.sparkles(c.center.x, c.center.y, { n: 12, r: 60, delay: c.hit + 200, life: 300 });
    },
  },
  ax_final_kamehameha: {
    charge: { color: '#ffe23a', color2: '#3aa8ff' },
    sfx: 'ax_g1_finalkame', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.45, c.len - 60);
      const o = org(c);
      const pre = 190;
      // 左右に 黄色・まん中に 青の 光 → らせんで 1つに
      for (const sx of [-1, 1]) ball(c, o.x + sx * 38, o.y - 8, { r: 7, color: YEL.main, glow: YEL.glow, rays: false, grow: 60, start: 60, travel: pre - 60, to: { x: o.x, y: o.y }, hop: sx * 10, life: pre + 20 });
      ball(c, o.x, o.y, { r: 10, color: BLUE.main, glow: BLUE.glow, swirl: ['#ffe23a', '#ffffff'], zap: '#fff27a', grow: pre, life: pre + 80 });
      const pts = sweepPath(c);
      kbeam(c, o.x, o.y, pts[0].x, pts[0].y, { w: 20 * c.sz, color: BLUE.main, glow: '#fff8a8', core: '#ffffff', rim: '#ffe23a', zap: '#fff27a', path: c.n > 1 ? pts : null, sweep: [c.hit - pre, c.hit - pre + c.stagger * (c.n - 1)], through: true, delay: pre, grow: c.hit - pre, life: c.len - pre - 80, fall: 360, widths: [0.8, 1, 1.1, 1, 0.6], head: 0.9 });
      c.each((t, i, d) => {
        kiHit(c, t.x, t.y, c.hit + d, { main: BLUE.main, glow: '#fff8a8', core: '#ffffff', list: ['#ffffff', '#ffe23a', '#3aa8ff'] }, { r: 22, n: 24, debris: 8, ring: '#ffe23a' });
        k.pillar(t.x, t.y + 8, { w: 12 * c.sz, color: '#fff27a', glow: '#bfe8ff', delay: c.hit + d + 100, life: 400, burst: false });
        afterglow(c, t.x, t.y, { list: ['#3aa8ff', '#ffe23a', '#ffffff'] }, c.hit + d + 300, 14, 500, 30);
      });
      k.shake(450, 2.6, c.hit);
      k.flash('#ffffff', 100, c.hit);
      ambient(c, ['#3aa8ff', '#ffe23a', '#ffffff'], 44, { from: c.hit + 100, to: c.len - 500, vy: -26, life: 480 });
      fx.converge(o.x, o.y, { colors: ['#ffe23a', '#3aa8ff', '#ffffff'], n: 18, r: 46, life: pre });
    },
  },
  ax_masenkou: {
    charge: { color: '#ffe23a', color2: '#fffbe0' },
    sfx: 'ax_g1_masenkou', allyFx: 'bolt', beamW: 7,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35, c.len - 60);
      const o = org(c, 18);
      const t = c.t;
      // ひたいの 前で 光が ちぢむ
      fx.converge(o.x, o.y, { colors: ['#ffffff', '#fff6b0'], n: 16, r: 30, life: 60 });
      fx.glow(o.x, o.y, { color: '#fff8b0', r: 20, life: 100 });
      // とても 速い 細い 光線（つらぬいて 先へ）。1本の 線が のこる
      kbeam(c, o.x, o.y, t.x, t.y, { w: 7 * c.sz, color: '#fff6a0', glow: '#fffbe0', core: '#ffffff', through: true, grow: c.hit, life: c.len - 80, rise: 20, fall: 300, widths: [1.2, 1, 0.5, 0.35, 0.3, 0.2], head: 0.5 });
      // 光の 十字 ＋ 細い 輪 3つ
      const cross = (ang, len) => fx.cut(t.x, t.y, { ang, len, w: 2, color: '#ffffff', glow: '#fff27a', delay: c.hit, life: 380, speed: 0 });
      cross(0, 70 * c.sz); cross(Math.PI / 2, 56 * c.sz);
      for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 4, r1: 40 + j * 22, color: '#fff8b0', w: 1.2, delay: c.hit + j * 70, life: 400 });
      kiHit(c, t.x, t.y, c.hit, { main: '#fff6a0', glow: '#fffbe0', core: '#ffffff', list: ['#ffffff', '#fff6a0', '#ffe23a'] }, { r: 16, n: 28 });
      afterglow(c, t.x, t.y, { list: ['#ffffff', '#fff6a0'] }, c.hit + 200, 20, 500, 20);
      k.shake(200, 1.6, c.hit);
      fx.sparks(o.x, o.y, { colors: ['#ffffff', '#fff6a0'], n: 18, speed: 120, delay: 0, life: 300 });
      // 光線に そって のこる 光の こな
      for (let j = 1; j < 8; j++) fx.sparks(lerp(o.x, t.x, j / 8), lerp(o.y, t.y, j / 8), { colors: ['#ffffff', '#fff6a0'], n: 4, speed: 30, g: -20, delay: c.hit * j / 8 + 60, life: 520, len: 3 });
    },
  },
  // ───────────── 超サイヤ人3 ─────────────
  ax_ryuuken: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_ryuuken', allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const t = c.t, o = org(c);
      darken(c, 0.6, c.len - 60);
      bg(c, 'lines', { x: t.x, y: t.y, color: '#ffb21a', color2: '#1a1004', a: 0.55, life: c.len - 60 });
      // 金の すじに なって とびこむ
      k.dash(o.x, o.y, t.x, t.y + 6, { color: '#ffb21a', travel: c.hit - 60, w: 7 });
      fist(c, o.x, o.y, t.x, t.y + 4, { s: 1.6 * c.sz, color: '#ffe066', glow: '#ffb21a', travel: c.hit, life: c.hit + 160 });
      kiHit(c, t.x, t.y, c.hit, GOLD, { r: 20, n: 26, heavy: [200, 2.2] });
      // こぶしから 金の 竜が 飛び出し まきついて 上へ
      const top = Math.max(16, t.y - 70);
      dragon(c, t.x, t.y + 40, t.x, t.y, { r: 32 * c.sz, rise: t.y + 6 - top, w: 6.2 * c.sz, travel: 820, delay: c.hit - 40, life: c.len - c.hit - 60 });
      fx.sparks(t.x, t.y, { colors: GOLD.list, n: 40, speed: 60, g: -60, delay: c.hit + 100, life: 900, len: 4 });
      // 竜の あたまで 大爆発・金の 柱
      const db = c.hit + 760;
      k.explosion(t.x, top, { r: 26, pal: { main: '#ffb21a', glow: '#fff0a0', core: '#ffffff', list: GOLD.list }, delay: db, heavy: true });
      k.pillar(t.x, t.y + 10, { w: 16 * c.sz, color: '#ffb21a', glow: '#ff9a10', core: '#fff6c8', delay: db, life: 420 });
      k.shake(560, 3.2, db);
      k.flash('#fff6c8', 120, db);
      // 金の うろこの 光が ひらひら
      ambient(c, GOLD.list, 34, { from: c.hit, to: c.len - 520, vy: -30, life: 500 });
      k.shapes(t.x, top + 20, { shape: 'diamond', n: 26, colors: ['#ffb21a', '#fff6c8', '#ffffff'], speed: 70, g: 50, drag: 0.96, size: 2, delay: db + 80, life: c.len - db - 140 });
    },
  },
  ax_kamehameha_kiwami: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_kame4', allyFx: 'bolt', beamW: 36,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.62, c.len - 60);
      const t = c.t;
      const o0 = org(c);
      bg(c, 'lines', { x: t.x, y: t.y, color: '#6ac8ff', color2: '#020818', a: 0.6, life: c.len - 60 });
      // 地面が 割れて 光が もれる・大岩が 浮く
      fx.crack(o0.x, c.fromAlly ? c.H - 4 : c.from.foot, { n: 7, len: 40, color: '#1a1020', hi: '#ffe066', life: 900 });
      for (let j = 0; j < 6; j++) fx.add({ kind: 'axShape', shape: 'rock', x: o0.x + c.rnd(-80, 80), y: (c.fromAlly ? c.H - 6 : c.from.foot) - c.rnd(0, 10), vx: c.rnd(-10, 10), vy: c.rnd(-60, -24), g: 20, drag: 0.98, color: ['#8a7058', '#5a4a3a'][j % 2], size: c.rnd(3, 5.5), rot0: c.rnd(0, 6), spin: c.rnd(-2, 2), delay: c.rnd(0, 120), life: 900, add: false });
      const { pre } = kameCore(c, { w: 36, ballR: 22, pre: 220, rim: '#ffb21a', spiral: '#ffe066', ballRim: '#ffb21a', swirl: ['#3aa8ff', '#ffb21a'], through: true, widths: [0.7, 1, 1.08, 1.1, 1, 0.75, 0.3], fall: 420, head: 1.1, gatherN: 18 });
      k.aura(o0.x, o0.y - 10, { style: 'flame', r: 30, h: 70, color: GOLD.main, color2: '#ffffff', life: 700, k: 2 });
      // ビームに おされて とぶ 光の つぶ・まわりの 風
      ambient(c, ['#ffffff', '#a8e4ff', '#ffb21a'], 50, { from: c.hit - 100, to: c.len - 600, vy: -40, life: 460 });
      fx.sparks(t.x, t.y, { colors: ['#ffffff', '#a8e4ff'], n: 30, speed: 260, ang: Math.atan2(t.y - o0.y, t.x - o0.x), spread: 0.6, g: 0, delay: c.hit, life: 600, len: 10 });
      // 白フラッシュ・青い 大ドーム・がれき
      k.flash('#ffffff', 160, c.hit);
      k.shake(700, 3.6, c.hit);
      dome(c, t.x, t.y + 16, { r: 54 * c.sz, sx: 1.6, color: BLUE.main, glow: '#bfe8ff', delay: c.hit + 60, grow: 300, life: 900 });
      kiHit(c, t.x, t.y, c.hit, BLUE, { r: 30, n: 36, ring: '#ffb21a', debris: 16 });
      fx.shock(t.x, t.y + 16, { r0: 14, r1: 160, sy: 0.25, color: '#bfe8ff', w: 3, delay: c.hit + 120, life: 500 });
      // ビームの あとが 青い 光の 川で のこる・青い つぶが 雪の ように
      kbeam(c, o0.x, o0.y, t.x, t.y, { w: 10, color: '#3aa8ff', glow: '#bfe8ff', core: '#e8f8ff', through: true, delay: c.len - 640, grow: 1, rise: 60, fall: 400, life: 560, head: 0 });
      for (let j = 0; j < 40; j++) fx.add({ kind: 'spark', x: c.rnd(0, c.W), y: c.rnd(-6, c.H * 0.4), vx: c.rnd(-6, 6), vy: c.rnd(14, 30), g: 4, drag: 1, len: 1.5, color: j % 3 ? '#a8e4ff' : '#ffffff', size: 1.2, life: 560, delay: c.len - 680 + c.rnd(0, 80), add: true });
      void pre;
    },
  },
  ax_ss3_aura: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_ss3', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.55, c.len - 60);
      const a = selfAt(c, c.t);
      bg(c, 'lines', { x: a.x, y: a.y - 30, color: '#ffb21a', color2: '#140c02', a: 0.45, life: c.len - 60 });
      // 金の 炎の 柱が 画面の 上まで
      kbeam(c, a.x, a.foot, a.x, -12, { w: 30, color: '#ffb21a', glow: '#fff0a0', core: '#ffffff', spiral: '#fff6c8', grow: 160, life: c.len - 200, fall: 300, widths: [0.6, 1, 1.1, 1, 0.9, 0.4], head: 0 });
      k.aura(a.x, a.y - 20, { style: 'flame', r: 32, h: 90, color: GOLD.main, color2: '#ffffff', life: c.len - 120, k: 2.2 });
      for (let j = 0; j < 14; j++) {
        const bx = a.x + c.rnd(-40, 40), by = c.rnd(10, a.y);
        k.bolt(bx, by - 30, bx + c.rnd(-10, 10), by + 10, { w: 1.3, color: '#ffffff', glow: j % 2 ? '#9ad8ff' : '#ffb21a', forks: 1, n: 6, amp: 6, delay: j * 70, life: 160, grow: 30 });
      }
      // 岩が くだけて 舞い上がる
      for (let j = 0; j < 14; j++) fx.add({ kind: 'axShape', shape: 'rock', x: a.x + c.rnd(-90, 90), y: a.foot - c.rnd(2, 10), vx: c.rnd(-14, 14), vy: c.rnd(-120, -60), g: 40, drag: 0.98, color: ['#a08060', '#6a5040', '#d8c0a0'][j % 3], size: c.rnd(1.6, 3.6), rot0: c.rnd(0, 6), spin: c.rnd(-6, 6), delay: c.rnd(0, 400), life: 700 });
      for (let j = 0; j < 4; j++) k.shake(260, 1.6 + j * 0.5, j * 260);
      fx.shock(a.x, a.y - 20, { r0: 10, r1: 150, color: '#ffe066', w: 3, delay: c.hit, life: 460 });
      fx.shock(a.x, a.y - 20, { r0: 10, r1: 110, color: '#ffffff', w: 2, delay: c.hit + 120, life: 420 });
      k.flash('#fff6c8', 120, c.hit);
      fx.sparks(a.x, a.y - 20, { colors: GOLD.list, n: 50, speed: 120, ang: -Math.PI / 2, spread: 1, g: -80, delay: c.hit, life: 800, len: 8 });
      fx.sparks(a.x, a.y - 20, { colors: GOLD.list, n: 40, speed: 60, g: -40, delay: c.hit + 400, life: 700, len: 4 });
    },
  },
  ax_shunkan_ido: {
    charge: { color: '#ffb21a', color2: '#ffffff' },
    sfx: 'ax_g1_shunkan', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38, c.len - 60);
      const t = c.t, o = org(c, 14);
      // 2本の 指を ひたいに（白い 点 2つ）
      fx.twinkle(o.x - 2, o.y, { color: '#ffffff', size: 6, life: 140 });
      fx.twinkle(o.x + 2, o.y, { color: '#ffffff', size: 6, life: 140 });
      // シュン と 消える（たての 白い すじ）
      k.beam(o.x, o.y + 40, o.x, o.y - 40, { w: 5, color: '#ffffff', glow: '#fff6c8', delay: 120, life: 140, grow: 40, burst: false, streaks: false });
      fx.sparks(o.x, o.y, { colors: ['#ffffff', '#fff6c8'], n: 16, speed: 140, delay: 130, life: 260 });
      // 敵の 後ろに 金の 光で あらわれ
      const bx = t.x + 16 * c.sz, by = t.y - (c.fromAlly ? 16 : -16) * c.sz;
      fx.glow(bx, by, { color: '#ffb21a', r: 30, delay: 240, life: 360 });
      k.beam(bx, by - 40, bx, by + 30, { w: 5, color: '#ffffff', glow: '#ffb21a', delay: 240, life: 140, grow: 40, burst: false, streaks: false });
      ghost(c, bx, by - 12, { s: 1.1 * c.sz, color: '#ffb21a', delay: 240, life: 300, flick: false });
      // 後ろから 金の 一撃
      fist(c, bx, by, t.x, t.y, { s: 1.5 * c.sz, color: '#ffe066', glow: '#ffb21a', travel: c.hit - 300, life: c.hit - 300 + 160, delay: 300 });
      kiHit(c, t.x, t.y, c.hit, GOLD, { r: 22, n: 28, ring: '#ffffff', heavy: [220, 2.4] });
      k.shapes(t.x, t.y, { shape: 'star', n: 10, colors: ['#ffe066', '#ffffff'], speed: 110, size: 3, delay: c.hit, life: 460 });
      // 敵が 前に はねる（すじ）
      k.speedLines(t.x, t.y, { n: 22, delay: c.hit, life: 280, color: '#fff6c8' });
      for (let j = 0; j < 6; j++) fx.cut(t.x + c.rnd(-14, 14), t.y + c.rnd(-10, 10), { ang: Math.atan2(t.y - by, t.x - bx), len: 26, w: 1.4, color: '#ffffff', glow: '#ffb21a', delay: c.hit + 40 + j * 25, life: 220 });
      afterglow(c, t.x, t.y, GOLD, c.hit + 240, 24, 500);
      k.shake(300, 2.4, c.hit);
      fx.sparks(o.x, o.y, { colors: ['#ffffff', '#fff6c8'], n: 14, speed: 40, g: -60, delay: 140, life: 400, len: 3 });
      fx.sparks(bx, by, { colors: GOLD.list, n: 16, speed: 90, delay: 240, life: 360 });
    },
  },
  ax_ss3_rengeki: {
    charge: { color: '#ffb21a', color2: '#fff6c8' },
    sfx: 'ax_g1_rengeki', allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.6, c.len - 60);
      const o = org(c);
      bg(c, 'lines', { x: c.center.x, y: c.center.y, color: '#ffb21a', color2: '#140c02', a: 0.5, life: c.len - 60 });
      // 金の すじが 敵から 敵へ ジグザグに 3周
      const pts = [{ x: o.x, y: o.y }];
      const ring = c.n > 1 ? c.targets : [0, 1, 2].map((j) => ({ x: c.t.x + Math.cos(j * 2.1) * 26, y: c.t.y + Math.sin(j * 2.1) * 18 }));
      for (let lap = 0; lap < 3; lap++) {
        const order = lap % 2 ? [...ring].reverse() : ring;
        for (const q of order) pts.push({ x: q.x + c.rnd(-10, 10), y: q.y + c.rnd(-12, 8) });
      }
      const travel = 860;
      path(c, pts, { color: '#ffb21a', glow: '#fff0a0', w: 3.2, travel, tail: 0.25, life: travel + 260 });
      const seg = travel / (pts.length - 1);
      for (let j = 1; j < pts.length; j++) {
        const q = pts[j], dd = seg * j;
        fx.star(q.x, q.y, '#fff6b0', 10, dd, 180);
        fx.glow(q.x, q.y, { color: '#ffb21a', r: 18, delay: dd, life: 200 });
        fx.sparks(q.x, q.y, { colors: GOLD.list, n: N(c, 6, 0.8), speed: 150, delay: dd, life: 260, len: 5 });
        if (j % 2) k.bolt(q.x, q.y, q.x + c.rnd(-22, 22), q.y + c.rnd(-18, 18), { w: 1.2, color: '#ffffff', glow: '#9ad8ff', forks: 0, n: 5, amp: 5, delay: dd, life: 140, grow: 20 });
      }
      // さいごに 全員の 上で 大爆発
      const db = travel + 80;
      c.each((t, i, d) => {
        kiHit(c, t.x, t.y, db + d, GOLD, { r: 24, n: 24, debris: 8, ring: '#ffffff' });
        if (c.n < 4 || i % 2 === 0) k.explosion(t.x, t.y - 4, { r: 20 * c.sz, pal: { main: '#ffb21a', glow: '#fff0a0', core: '#ffffff', list: GOLD.list }, delay: db + d + 40, heavy: false });
      });
      k.shake(600, 3.2, db);
      k.flash('#fff6c8', 120, db);
      afterglow(c, c.center.x, c.center.y, GOLD, db + 300, 30, 400, 40);
    },
  },
  ax_genkidama: {
    charge: { color: '#a8e4ff', color2: '#ffffff' },
    sfx: 'ax_g1_genki', allyFx: 'holy', ballR: 54,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.6, c.len - 60, { color: '#02061a' });
      bg(c, 'space', { color: '#6ac8ff', color2: '#040a24', a: 0.75, life: c.len - 60 });
      // 頭上の 玉（みんなの 元気が あつまる）
      const gb = c.fromAlly ? { x: c.lerp(c.from.x, c.W / 2, 0.5), y: 34 } : { x: c.from.x, y: Math.max(26, c.from.y - 46) };
      const R = 54;
      const grow = 520;
      const cx = c.center.x, cy = c.center.y;
      ball(c, gb.x, gb.y, { r: R, style: 'genki', color: '#5ab8ff', glow: '#8ad4ff', core: '#ffffff', rays: true, grow, start: grow, travel: c.hit - grow, to: { x: cx, y: cy }, ease: 'in', life: c.hit + 60 });
      // 画面の すみずみから 光の つぶが 空へ ながれる
      for (let j = 0; j < 60; j++) {
        const side = j % 4;
        const sx = side === 0 ? c.rnd(0, c.W) : side === 1 ? c.rnd(0, c.W) : side === 2 ? -4 : c.W + 4;
        const sy = side === 0 ? c.H + 4 : side === 1 ? c.rnd(c.H * 0.6, c.H) : c.rnd(10, c.H);
        const tm = c.rnd(240, 420);
        fx.add({ kind: 'spark', x: sx, y: sy, vx: (gb.x - sx) / tm * 1000, vy: (gb.y - sy) / tm * 1000, g: 0, drag: 1, len: 6, color: j % 3 ? '#a8e4ff' : '#ffffff', size: 1.2, life: tm, delay: c.rnd(0, grow - tm + 60), add: true });
      }
      // 白い 光の ドーム（横に のびる）
      k.flash('#ffffff', 220, c.hit);
      k.shake(700, 3.6, c.hit);
      const gy = Math.max(...c.targets.map((t) => t.y)) + 14;
      dome(c, cx, gy, { r: 62, sx: 2.2, color: '#a8e4ff', glow: '#e8f8ff', core: '#ffffff', delay: c.hit, grow: 320, life: 820 });
      fx.shock(cx, gy, { r0: 20, r1: 200, sy: 0.25, color: '#ffffff', w: 3.4, delay: c.hit + 60, life: 520 });
      c.each((t, i, d) => kiHit(c, t.x, t.y, c.hit + d, { main: '#bfeaff', glow: '#e8f8ff', core: '#ffffff', list: ['#ffffff', '#a8e4ff', '#e8f8ff'] }, { r: 22, n: 22, debris: 10 }));
      ambient(c, ['#ffffff', '#a8e4ff'], 40, { from: c.hit, to: c.hit + 400, vy: -40, life: 460, y0: c.H * 0.3 });
      // きらきらの 光の つぶが 空から ふる
      for (let j = 0; j < 34; j++) fx.twinkle(c.rnd(10, c.W - 10), c.rnd(-4, 50), { color: j % 2 ? '#ffffff' : '#a8e4ff', size: c.rnd(2.5, 4.5), vy: c.rnd(20, 40), delay: c.hit + 400 + c.rnd(0, 360), life: c.len - c.hit - 820 });
    },
  },
  ax_kamehameha_x10: {
    charge: { color: '#ff3a2a', color2: '#ffd0a0' },
    sfx: 'ax_g1_kame10', allyFx: 'fire', beamW: 30,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.6, c.len - 60);
      bg(c, 'lines', { x: c.center.x, y: c.center.y, color: '#ff3a2a', color2: '#1a0404', a: 0.55, life: c.len - 60 });
      const o = org(c);
      const pre = 220;
      ball(c, o.x, o.y, { r: 20, color: BLUE.main, glow: BLUE.glow, rim: '#ff3a2a', zap: '#ff6a4a', grow: pre, life: pre + 120 });
      k.aura(o.x, o.y - 10, { style: 'flame', r: 28, h: 64, color: RED.main, color2: '#ffd0a0', life: 640, k: 1.9 });
      for (let j = 0; j < 4; j++) k.bolt(o.x + c.rnd(-30, 30), o.y - c.rnd(10, 40), o.x + c.rnd(-10, 10), o.y, { w: 1.4, color: '#ffe0d0', glow: '#ff3a2a', forks: 1, n: 6, amp: 6, delay: j * 50, life: 160, grow: 30 });
      fx.converge(o.x, o.y, { colors: ['#ffffff', '#a8e4ff', '#ff6a4a'], n: 18, r: 40, life: pre });
      const pts = sweepPath(c);
      kbeam(c, o.x, o.y, pts[0].x, pts[0].y, { w: 30 * c.sz, color: BLUE.main, glow: '#ff9a7a', core: '#ffffff', rim: '#ff3a2a', rim2: '#a01a10', zap: '#ff6a4a', path: c.n > 1 ? pts : null, sweep: [c.hit - pre, c.hit - pre + c.stagger * (c.n - 1)], through: true, delay: pre, grow: c.hit - pre, life: c.len - pre - 100, fall: 420, widths: [0.7, 1, 1.1, 1.05, 0.8, 0.3], head: 1 });
      c.each((t, i, d) => {
        kiHit(c, t.x, t.y, c.hit + d, { main: BLUE.main, glow: '#ff9a7a', core: '#ffffff', list: ['#ffffff', '#ff3a2a', '#3aa8ff'] }, { r: 26, n: 28, debris: 10, ring: '#ff3a2a' });
        if (c.n < 4 || i % 2 === 0) k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ff3a2a', glow: '#ff9a7a', core: '#ffffff', list: ['#ffffff', '#ff6a4a', '#3aa8ff'] }, delay: c.hit + d + 140, heavy: false });
      });
      k.flash('#ffffff', 140, c.hit);
      k.shake(700, 3.4, c.hit);
      fx.sparks(o.x, o.y, { colors: ['#ff6a4a', '#ffffff', '#a8e4ff'], n: 30, speed: 260, ang: c.ang, spread: 0.5, g: 0, delay: pre, life: 520, len: 10 });
      ambient(c, ['#ff6a4a', '#ffd0a0', '#a8e4ff'], 40, { from: c.hit, to: c.hit + 500, vy: -50, life: 480 });
      // 赤い 火の粉と 青い 光
      for (let j = 0; j < 40; j++) fx.add({ kind: 'spark', x: c.center.x + c.rnd(-90, 90), y: c.center.y + c.rnd(-20, 30), vx: c.rnd(-10, 10), vy: c.rnd(-40, -16), g: -10, drag: 0.98, len: 3, color: j % 3 ? '#ff6a4a' : '#a8e4ff', size: 1.1, life: 600, delay: c.len - 760 + c.rnd(0, 80), add: true });
    },
  },
  // ───────────── はかい神 ─────────────
  ax_hakai: {
    charge: { color: '#a86aff', color2: '#f0e0ff' },
    sfx: 'ax_g1_hakai', allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.62, c.len - 60, { color: '#08041a', fin: 260 });
      bg(c, 'space', { color: '#a86aff', color2: '#0a0620', a: 0.45, life: c.len - 60, fin: 300 });
      const t = c.t, o = org(c, 6);
      // 手のひらを 向けて（うすむらさきの 光）
      fx.glow(o.x, o.y, { color: '#e0c8ff', r: 18, life: 360 });
      fx.converge(o.x, o.y, { colors: PUR.list, n: 10, r: 24, life: 300 });
      const rx = 14 * c.sz, ry = 18 * c.sz;
      hakaiFilm(c, t.x, t.y, { rx, ry, cAt: c.hit, cDur: 620, delay: 120, life: c.len - 180 });
      fx.shock(t.x, t.y, { r0: rx * 2.2, r1: rx * 1.2, color: '#e0c8ff', w: 1.4, delay: 120, life: 300 });
      // 下から 上へ 光の 粉に くずれて 舞い上がる
      for (let j = 0; j < 160; j++) {
        const u = j / 160;
        const yy = t.y + ry - u * ry * 2.1;
        const half = Math.sqrt(Math.max(0, 1 - ((yy - t.y) / ry) ** 2)) * rx;
        fx.add({ kind: 'spark', x: t.x + c.rnd(-half, half), y: yy, vx: c.rnd(-10, 10), vy: c.rnd(-40, -16), g: -18, drag: 0.97, len: 2, color: j % 3 === 0 ? '#ffffff' : j % 3 === 1 ? '#e0c8ff' : '#a86aff', size: c.rnd(0.9, 1.5), life: c.rnd(560, 760), delay: c.hit - 120 + u * 620, add: true });
      }
      fx.glow(t.x, t.y, { color: '#ffffff', r: 26 * c.sz, delay: c.hit - 40, life: 260 });
      fx.impact(t.x, t.y, { r: 10, color: '#ffffff', delay: c.hit });
      // むらさきの 粉が ただよう
      k.sparkles(t.x, t.y - 10, { n: 10, r: 26, colors: ['#e0c8ff', '#ffffff'], delay: c.hit + 400, life: 400, gap: 40 });
    },
  },
  ax_kimagure: {
    charge: { color: '#a86aff', color2: '#f0e0ff', power: 0.7 },
    sfx: 'ax_g1_kimagure', allyFx: 'dark',
    play(fx, c) {
      const a = selfAt(c, c.t);
      const lucky = Math.floor(c.rnd(0, 3));
      for (let j = 0; j < 3; j++) {
        const sx = a.x + (j - 1) * 22, sy = a.y - 34;
        ball(c, a.x, a.y - 10, { r: 5, color: '#a86aff', glow: '#e0c8ff', core: '#ffffff', rays: false, grow: 120, start: 100, travel: 220, to: { x: sx, y: sy }, hop: 10, life: c.len - 80, delay: j * 40 });
        if (j === lucky) {
          fx.glow(sx, sy, { color: '#ffffff', r: 18, delay: c.hit + 160, life: 300 });
          c.k.sparkles(sx, sy, { n: 6, r: 10, delay: c.hit + 160, life: 280 });
        }
      }
      mark(c, '?', a.x + 4, a.y - 54, { size: 7, color: '#ffe066', color2: '#3a1a5a', delay: c.hit - 80, life: c.len - c.hit + 40, vy: -6 });
      fx.sparks(a.x, a.y - 10, { colors: PUR.list, n: 16, speed: 60, g: -40, delay: 0, life: 500 });
      c.k.sparkles(a.x, a.y - 30, { n: 8, r: 28, colors: ['#e0c8ff', '#ffffff'], delay: 120, life: 300, gap: 50 });
      c.k.aura(a.x, a.y - 10, { style: 'pulse', r: 18, h: 30, color: '#a86aff', color2: '#e0c8ff', life: 600 });
    },
  },
  ax_hirune: {
    charge: { color: '#b08aff', color2: '#e8dcff' },
    sfx: 'ax_g1_hirune', allyFx: 'buff',
    play(fx, c) {
      const a = selfAt(c, c.t);
      for (let j = 0; j < 3; j++) mark(c, 'Z', a.x + 12 + j * 8, a.y - 26 - j * 10, { size: 3 + j * 1.4, color: '#e8dcff', color2: '#4a2a8a', vx: 6, vy: -14, delay: j * 160, life: c.len - j * 160 - 80 });
      for (let j = 0; j < 8; j++) fx.puff(a.x + c.rnd(-20, 20), a.y - c.rnd(0, 20), { color: '#c8a8ff', r0: 4, r1: 14, vx: c.rnd(-8, 8), vy: -6, life: 600, alpha: 0.35, delay: j * 50 });
      c.k.aura(a.x, a.y - 10, { style: 'pulse', r: 20, h: 30, color: '#b08aff', color2: '#e8dcff', life: c.len - 80 });
      fx.twinkle(a.x - 14, a.y - 30, { color: '#fff6b0', size: 6, delay: c.hit + 200, life: 300 });
      c.k.sparkles(a.x, a.y - 16, { n: 6, r: 18, colors: ['#e8dcff', '#ffffff'], delay: c.hit, life: 300 });
      // ねむりの もやに ただよう 星くず
      fx.sparks(a.x, a.y - 14, { colors: ['#e8dcff', '#c8a8ff', '#fff6b0'], n: 20, speed: 24, g: -16, drag: 0.97, delay: 100, life: 600, len: 2 });
    },
  },
  ax_kami_no_ki: {
    charge: { color: '#a86aff', color2: '#e0c8ff' },
    sfx: 'ax_g1_kami', allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.6, c.len - 60);
      bg(c, 'space', { color: '#7a6aff', color2: '#0a0620', a: 0.7, life: c.len - 60 });
      const cy = c.center.y - 12;
      const top = Math.min(...c.targets.map((t) => t.y)) - 22;
      // むらさきと 青の 炎の 大きな 帯が 敵の 上を 通る（左から 右へ 炎の したが つぎつぎ ゆらめく）
      for (let j = 0; j < 14; j++) {
        const fxx = -10 + j * 21;
        k.flames(fxx, top + 26, { w: 34, h: 40, cols: j % 2 ? ['#3a2ab0', '#8a5aff', '#e0c8ff'] : ['#5a2ab0', '#a86aff', '#c8d8ff'], n: 4, delay: j * 26, life: c.hit + 160 - j * 10, embers: false });
      }
      k.streaks({ ang: 0, color: '#c8a8ff', n: 24, life: c.hit + 400, alpha: 0.5 });
      k.streaks({ ang: Math.PI / 2, color: '#e0c8ff', n: 18, delay: c.hit, life: 500, alpha: 0.45, speed: 1.4 });      // 帯から こぼれる むらさきの 火の粉（よこへ ながれる）
      for (let j = 0; j < 70; j++) fx.add({ kind: 'spark', x: c.rnd(-10, c.W), y: cy + c.rnd(-34, 34), vx: c.rnd(120, 220), vy: c.rnd(-10, 20), g: 0, drag: 0.99, len: 6, color: ['#a86aff', '#e0c8ff', '#6a8aff'][j % 3], size: 1.1, life: c.rnd(300, 460), delay: c.rnd(0, c.hit + 260), add: true });
      ambient(c, PUR.list, 50, { from: c.hit + 200, to: c.len - 500, vy: -24, life: 460 });
      c.each((t, i, d) => {
        // 下に 押しつけられる（下向きの すじ・地面の ひび）
        wind(c, t.x, t.y - 34, { w: 40, h: 40, dir: 1, n: 14, color: '#e0c8ff', delay: c.hit + d, life: 600 });
        fx.crack(t.x, t.y + 18, { n: 6, len: 30, color: '#1a0a2a', hi: '#c8a8ff', delay: c.hit + d, life: 800 });
        kiHit(c, t.x, t.y, c.hit + d, PUR, { r: 18, n: 20, debris: 6 });
        fx.shock(t.x, t.y + 18, { r0: 8, r1: 60, sy: 0.3, color: '#c8a8ff', w: 2.4, delay: c.hit + d + 40, life: 420 });
        fx.sparks(t.x, t.y, { colors: PUR.list, n: N(c, 20), speed: 50, g: -50, delay: c.hit + d + 300, life: 600, len: 4 });
      });
      k.shake(600, 3, c.hit);
    },
  },
  ax_hakai_ikari: {
    charge: { color: '#a86aff', color2: '#f0e0ff' },
    sfx: 'ax_g1_ikari2', allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.55, c.len - 60);
      bg(c, 'space', { color: '#a86aff', color2: '#0a0418', a: 0.7, life: c.len - 60 });
      const a = selfAt(c, c.t);
      k.aura(a.x, a.y - 22, { style: 'flame', r: 36, h: 96, color: '#8a4ae0', color2: '#e0c8ff', life: c.len - 360, k: 2.2 });
      // 空に 流れ星
      for (let j = 0; j < 5; j++) { const sx = c.rnd(20, c.W - 20); k.dash(sx, c.rnd(4, 20), sx - 60, c.rnd(40, 60), { color: '#e0c8ff', travel: 260, w: 2, n: 2, delay: j * 160 }); }
      fx.crack(a.x, a.foot - 4, { n: 8, len: 50, color: '#1a0a2a', hi: '#c8a8ff', delay: c.hit, life: 900 });
      k.shake(600, 2.6, c.hit);
      fx.shock(a.x, a.y - 20, { r0: 10, r1: 140, color: '#c8a8ff', w: 3, delay: c.hit, life: 460 });
      // オーラが うずに なって おさまる
      fx.swirl(a.x, a.y - 10, PUR.list, { n: 30, rad: 30, h: 40, delay: c.len - 640, life: 560, size: 1.6 });
      fx.converge(a.x, a.y - 16, { colors: PUR.list, n: 20, r: 50, delay: c.len - 500, life: 300 });
      fx.sparks(a.x, a.y - 20, { colors: PUR.list, n: 50, speed: 110, ang: -Math.PI / 2, spread: 1, g: -70, delay: c.hit, life: 700, len: 7 });
      k.debris(a.x, a.foot - 4, { n: 12, up: 140, delay: c.hit });
    },
  },
  ax_hakaidama: {
    charge: { color: '#a86aff', color2: '#ffb03a' },
    sfx: 'ax_g1_hakaidama', allyFx: 'fire', sunR: 56,
    play(fx, c) {
      const { k } = c;
      darken(c, 0.62, c.len - 60);
      bg(c, 'space', { color: '#ff8a1a', color2: '#0a0418', a: 0.7, life: c.len - 60 });
      const top = c.fromAlly ? { x: c.lerp(c.from.x, c.W / 2, 0.5), y: 34 } : { x: c.from.x, y: Math.max(28, c.from.y - 40) };
      const grow = 460;
      const cx = c.center.x, cy = c.center.y;
      // 指先の オレンジの 点 → 太陽の ような 玉
      ball(c, top.x, top.y, { r: 56, style: 'sun', grow, start: grow, travel: c.hit - grow, to: { x: cx, y: cy }, ease: 'in', life: c.hit + 40 });
      for (let j = 0; j < 14; j++) {
        const sx = top.x + c.rnd(-120, 120), sy = c.rnd(c.H * 0.6, c.H);
        fx.add({ kind: 'axShape', shape: 'rock', x: sx, y: sy, vx: (top.x - sx) * 2.2, vy: (top.y - sy) * 2.2, g: 0, drag: 1, color: ['#8a7058', '#5a4a3a'][j % 2], size: c.rnd(1.2, 2.4), rot0: 0, spin: 3, delay: c.rnd(0, 80), life: 400, add: false });
      }
      // 白 → オレンジの 大爆発（ふちに むらさきの 光）
      k.flash('#ffffff', 240, c.hit);
      k.shake(700, 3.8, c.hit);
      const gy = Math.max(...c.targets.map((t) => t.y)) + 14;
      dome(c, cx, gy, { r: 66, sx: 2.3, color: '#ff6a10', glow: '#ffb03a', core: '#fff6c8', delay: c.hit, grow: 300, life: 860 });
      fx.shock(cx, cy, { r0: 30, r1: 220, color: '#c86aff', w: 4, delay: c.hit + 40, life: 560 });
      c.each((t, i, d) => k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ff7a10', glow: '#ffb03a', core: '#ffffff', list: ['#ffffff', '#ffb03a', '#ff6a10'] }, delay: c.hit + d, heavy: false }));
      k.debris(cx, gy, { n: 16, up: 180, delay: c.hit + 40 });
      ambient(c, ['#ff8a1a', '#ffd06a', '#ffffff'], 46, { from: c.hit, to: c.hit + 300, vy: -60, life: 420 });
      // 玉に すいこまれる 光の すじ
      for (let j = 0; j < 30; j++) { const a = c.rnd(0, TAU), r = c.rnd(50, 90), tm = c.rnd(200, 320); fx.add({ kind: 'spark', x: top.x + Math.cos(a) * r, y: top.y + Math.sin(a) * r * 0.7, vx: -Math.cos(a) * r / tm * 1000, vy: -Math.sin(a) * r * 0.7 / tm * 1000, g: 0, drag: 1, len: 6, color: j % 2 ? '#ffb02a' : '#e0a8ff', size: 1.1, life: tm, delay: c.rnd(0, grow - tm), add: true }); }
      // オレンジの 火の粉が 長く
      for (let j = 0; j < 46; j++) fx.add({ kind: 'spark', x: cx + c.rnd(-110, 110), y: cy + c.rnd(-20, 30), vx: c.rnd(-12, 12), vy: c.rnd(-40, -14), g: -8, drag: 0.98, len: 3, color: ['#ff8a1a', '#ffd06a', '#c86aff'][j % 3], size: 1.1, life: c.rnd(500, 700), delay: c.hit + 260 + c.rnd(0, 240), add: true });
    },
  },
  ax_pudding: {
    charge: { color: '#a86aff', color2: '#ffe06a' },
    sfx: 'ax_g1_pudding', allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.55, c.len - 60);
      bg(c, 'rays', { x: c.center.x, y: c.center.y - 30, color: '#c86aff', color2: '#1a0a2a', a: 0.6, life: c.len - 60 });
      const a = org(c, 20);
      // 頭の 上の プリンに ヒビ → いかり
      prop(c, 'pudding', a.x, a.y - 8, { s: 1.4, life: 300, pop: 80 });
      mark(c, 'anger', a.x + 14, a.y - 18, { size: 5, color: '#ff3a3a', color2: '#ffffff', life: 400 });
      c.k.flames(a.x, a.y + 10, { w: 40, h: 34, cols: ['#5a2ab0', '#a86aff', '#e0c8ff'], life: 600 });
      // 空から 大きな プリンが ドスン
      const cx = c.center.x, cy = c.center.y;
      prop(c, 'pudding', cx, -40, { to: { x: cx, y: cy - 4 }, travel: c.hit - 120, start: 120, s: c.all ? 3.6 : 3, life: c.hit + 420, pop: 0, fade: 60 });
      k.shake(300, 2.6, c.hit);
      fx.shock(cx, cy + 20, { r0: 10, r1: 110, sy: 0.3, color: '#ffe06a', w: 3, delay: c.hit, life: 420 });
      c.each((t, i, d) => kiHit(c, t.x, t.y, c.hit + d, { main: '#ffd86a', glow: '#fff2b0', core: '#ffffff', list: ['#ffd86a', '#8a4a1a', '#ffffff'] }, { r: 16, n: 16 }));
      // ぷるぷる → 爆発して 黄色い つぶ
      const db = c.hit + 400;
      boom(c, cx, cy, { r: c.all ? 60 : 44, cols: ['#ffffff', '#fff2b0', '#ffd86a', '#a86aff'], delay: db, life: 560 });
      for (let j = 0; j < 40; j++) fx.add({ kind: 'spark', x: cx, y: cy, vx: c.rnd(-160, 160), vy: c.rnd(-180, -40), g: 260, drag: 0.98, len: 3, color: j % 3 ? '#ffd86a' : '#8a4a1a', size: 1.6, life: c.rnd(500, 700), delay: db, add: false });
      k.flames(cx, cy + 20, { w: 120, h: 40, cols: ['#5a2ab0', '#a86aff', '#e0c8ff'], n: 7, delay: db + 100, life: 560 });
      mark(c, '!', cx + 30, cy - 34, { size: 8, color: '#ffe066', color2: '#3a1a5a', delay: db + 140, life: 560 });
      k.shake(400, 3, db);
      // ぷるぷるの しずく・カラメル・むらさきの 怒りの 火の粉
      for (let j = 0; j < 30; j++) fx.drop(cx + c.rnd(-20, 20), cy - c.rnd(0, 20), { color: j % 3 ? '#ffd86a' : '#8a4a1a', vx: c.rnd(-140, 140), vy: c.rnd(-200, -60), g: 380, size: c.rnd(1.2, 2.2), delay: c.hit + c.rnd(0, 60), life: 520 });
      ambient(c, PUR.list, 60, { from: 0, to: c.len - 600, vy: -30, life: 460 });
    },
  },
  // ───────────── 合体技 ─────────────
  ax_gomu_kame: {
    sfx: 'ax_g1_gomukame', allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38, c.len - 60);
      const o = org(c);
      const t = c.t;
      const reach = 350;
      // ゴムの 腕が 青い 玉を かかえて ぐーんと（目の前まで）
      const near = { x: lerp(o.x, t.x, 0.78), y: lerp(o.y, t.y, 0.78) };
      for (const sx of [-1, 1]) fx.add({ kind: 'g1Arm', x: near.x, y: near.y, x0: o.x + sx * 12, y0: o.y + 6, x1: near.x + sx * 5, y1: near.y + 3, reach, hold: c.hit + 200, back: 220, w: 4.2, life: c.hit + 420 });
      ball(c, o.x, o.y, { r: 9, color: BLUE.main, glow: BLUE.glow, grow: 120, start: 0, travel: reach, to: near, life: c.hit + 60 });
      k.streaks({ ang: Math.atan2(t.y - o.y, t.x - o.x), color: '#ffffff', n: 16, life: 300, alpha: 0.5 });
      // 目の前で ビーム
      kbeam(c, near.x, near.y, t.x, t.y, { w: 18 * c.sz, color: BLUE.main, glow: BLUE.glow, core: '#ffffff', delay: reach, grow: c.hit - reach, through: true, life: 600, fall: 260, head: 1.2 });
      kiHit(c, t.x, t.y, c.hit, BLUE, { r: 26, n: 30, ring: '#ffffff', debris: 12, heavy: [240, 2.6] });
      k.explosion(t.x, t.y, { r: 24 * c.sz, pal: { main: BLUE.main, glow: BLUE.glow, core: '#ffffff', list: BLUE.list }, delay: c.hit + 120, heavy: false });
      // 腕が ばちーんと もどる
      fx.star(o.x, o.y, '#ffd8b0', 10, c.hit + 420, 200);
      afterglow(c, t.x, t.y, BLUE, c.hit + 400, 24, 500);
      k.flash('#ffffff', 90, c.hit);
      // ゴムが のびる ブルブルの すじ・青い 光の つぶ
      for (let j = 1; j < 6; j++) fx.sparks(lerp(o.x, near.x, j / 6), lerp(o.y, near.y, j / 6), { colors: ['#ffffff', '#ffd8b0', '#a8e4ff'], n: 6, speed: 50, delay: reach * j / 6, life: 300, len: 4 });
      fx.sparks(t.x, t.y, { colors: BLUE.list, n: 24, speed: 240, delay: c.hit, life: 420, len: 9 });
    },
  },
};

// ゴムの 腕（のびる → もつ → ばちーんと もどる）
export const G1_DBZ_FINE = {
  g1Arm(x, p) {
    let k;
    if (p.age < p.reach) { const e = p.age / p.reach; k = 1 - (1 - e) * (1 - e); }
    else if (p.age < p.hold) k = 1 + 0.03 * Math.sin((p.age - p.reach) / 30);
    else { const e = clamp01((p.age - p.hold) / p.back); k = Math.max(0, 1 - e * e) - 0.12 * Math.sin(e * Math.PI); }
    k = Math.max(0, k);
    const hx = lerp(p.x0, p.x1, k), hy = lerp(p.y0, p.y1, k);
    const L = Math.hypot(hx - p.x0, hy - p.y0);
    const thin = Math.max(0.45, 1 - L / 260);
    x.save();
    x.lineCap = 'round';
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 1;
    // うで（はだの 色。のびる ほど 細い）＋ 赤い そで
    x.strokeStyle = '#8a4a2a'; x.lineWidth = p.w * thin + 1.2;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(hx, hy); x.stroke();
    x.strokeStyle = '#ffc89a'; x.lineWidth = p.w * thin;
    x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(hx, hy); x.stroke();
    x.fillStyle = '#e8342a'; disc(x, p.x0, p.y0, p.w * 1.1, '#e8342a');
    // 手
    x.fillStyle = '#ffc89a'; disc(x, hx, hy, p.w * 0.9, '#ffc89a');
    x.strokeStyle = '#8a4a2a'; x.lineWidth = 0.7; x.beginPath(); x.arc(hx, hy, p.w * 0.9, 0, TAU); x.stroke();
    // ブルブル（ゴムの ふるえ）
    if (p.age < p.reach) { x.globalCompositeOperation = 'lighter'; softGlow(x, hx, hy, 10, '#a8e4ff', 0.5); }
    x.restore();
    void hash;
  },
};
