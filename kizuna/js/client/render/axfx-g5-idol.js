// 第48回 G5: アイドル・フルーツジッパー・アラシ の 大技の え
// ・ステージの ライト・ファンの ペンライト・ハート・音符・紙ふぶき。フルーツは パステル 7色、アラシは 5色（赤・黄・緑・青・紫）
// ・時間は shared/data/ax-time-g5.js（ここには 見た目だけ）。c の 時間は はなつ しゅんかんが 0
// ・画面の 文字は かかない（文字の 中に 漢字を 入れない。コメントは よい）
import { rnd, lerp } from './axkit.js?v=0e454fdbf852';
import { wrapPlay, sparkleFill, arrows, lifeFor, FRUITS, FRUIT_COL } from './axfx-g5-kit.js?v=0e454fdbf852';

const TAU = Math.PI * 2;
const PINK = '#ff7ad8', HOT = '#ff3a9a', LIGHT = '#ffb0ec', YEL = '#ffe066', SKY = '#9ad1ff', WHITE = '#ffffff', GOLD = '#ffd23a';
const IDOL_COLS = [WHITE, LIGHT, PINK, YEL];
const PENS = ['#ff4a8a', '#ffe040', '#4ad8ff', '#7aff7a', '#c08aff', '#ff9a3a'];
const FRUIT7 = ['#ff8ab0', '#ffb070', '#ffe880', '#a8f0a0', '#9ad8ff', '#c8a8ff', '#ffa8d8'];
const ARASHI = ['#ff3a3a', '#ffe040', '#3ad870', '#3a8aff', '#a85aff'];
const CONFETTI = ['#ff4a8a', '#ffe040', '#4ad8ff', '#7aff7a', '#c08aff', '#ffffff'];

export const AX_G5_FINE_IDOL = {};

// ───────────── どうぐ ─────────────
function burst(c, t, d, { glow = PINK, cols = IDOL_COLS, r = 14, heavy = false, n = 8, shape = 'heart', ring = 42 } = {}) {
  c.k.impact(t.x, t.y, { r: r * c.sz, glow, colors: cols, delay: d, heavy });
  c.k.shockwave(t.x, t.y, { r0: 5, r1: ring * c.sz, color: glow, w: 2, n: 2, gap: 90, delay: d + 30, life: 360 });
  if (n) c.k.shapes(t.x, t.y, { shape, n, colors: cols, speed: 100, size: 2.8, delay: d + 20, life: lifeFor(c, d + 20, 440), add: shape !== 'heart' });
}
// 紙ふぶき（上から ひらひら）
function confetti(c, x, y, d, { n = 16, r = 60, life = 600, cols = CONFETTI, up = false } = {}) {
  for (let i = 0; i < n; i++) c.fx.add({ kind: 'axShape', shape: i % 3 ? 'card' : 'diamond', x: x + rnd(-r, r), y: y + rnd(-10, 10), vx: rnd(-40, 40), vy: up ? rnd(-150, -70) : rnd(10, 50), g: up ? 160 : 40, drag: 0.97, color: cols[i % cols.length], size: rnd(1.1, 1.8), rot0: rnd(0, 6), spin: rnd(-10, 10), delay: d + rnd(0, 120), life: life * rnd(0.8, 1), add: false, pop: false });
}
function notes(c, x, y, d, { n = 6, cols = [WHITE, LIGHT, YEL], r = 30, life = 520 } = {}) {
  c.k.shapes(x, y, { shape: 'note', n, colors: cols, speed: 34, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d, life, add: false, r });
}
function darken(c, a, life, color = '#0c0414') { c.k.tint(color, { a, life, fin: 40, fout: Math.min(320, life * 0.4) }); }
function sky(c, style, a, life, o = {}) { c.add('g5Sky', { style, a, life, fin: o.fin ?? 160, fout: o.fout ?? 320, ...o }); }
function healGlow(c, t, d, { col = LIGHT, cols = [WHITE, LIGHT, PINK], shape = 'heart' } = {}) {
  c.fx.glow(t.x, t.y - 6, { color: col, r: 20 * c.sz, delay: d, life: lifeFor(c, d, 480), alpha: 0.9 });
  c.k.shockwave(t.x, t.y + 6, { r0: 4, r1: 24, sy: 0.32, color: col, w: 1.6, delay: d, life: 400 });
  c.k.shapes(t.x, t.y - 4, { shape, n: 5, colors: cols, speed: 28, ang: -Math.PI / 2, spread: 0.7, g: -30, size: 2.6, delay: d + 40, life: lifeFor(c, d + 40, 480), add: shape !== 'heart' });
}
const src = (c, dy = 14) => ({ x: c.from.x, y: c.fromAlly ? c.from.y - dy : c.from.y - 6 });
const bend = (a, b, k = 0.35) => ({ cx: (a.x + b.x) / 2 - (b.y - a.y) * k, cy: (a.y + b.y) / 2 + (b.x - a.x) * k });
// スポットライト（上から 的へ）
function spot(c, x0, t, d, life, col = WHITE, o = {}) { c.add('g5Spot', { x0, y0: -6, x1: t.x, y1: t.y + 14, w: o.w ?? 16, col, sway: o.sway ?? 0, swayMs: o.swayMs ?? 300, phase: o.phase ?? 0, delay: d, life, alpha: o.alpha ?? 1 }); }

const defs = {
  // ── アイドル（基本） ──
  // 投げキッス: 口もとの 光 → ピンクの ハートが ふわふわ 敵へ → はじけて 小さな ハート
  ax_nage_kiss: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_chu', allyFx: 'down',
    play(fx, c) {
      const o = src(c, 18);
      c.add('g5Mark', { mark: 'lips', x0: o.x, y0: o.y, s: 6, glow: LIGHT, life: 300, fout: 160 });
      c.each((t, i, d) => {
        const n = c.n > 2 ? 2 : 3;
        for (let k = 0; k < n; k++) c.add('g5Heart', { x0: o.x, y0: o.y - 4, x1: t.x + (k - 1) * 6, y1: t.y, hop: 16 + k * 8, start: k * 40, travel: c.hit - k * 40, s: (5 - k) * c.sz, col: k === 1 ? HOT : PINK, beat: 0.18, delay: d, life: c.hit + 20, ease: 'lin' });
        burst(c, t, d + c.hit, { heavy: i === 0, n: 8 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 6, r1: 26 * c.sz, n: 6, s: 2.4, cols: [PINK, HOT, LIGHT], delay: d + c.hit, life: 320 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: IDOL_COLS, r: 24 });
    },
  },
  // ファンサ: 指ハートの 小さな 光 → 味方へ ハート → 回復
  ax_fansa: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_kya', allyFx: 'heal',
    play(fx, c) {
      const o = src(c, 22);
      c.add('g5Heart', { x0: o.x, y0: o.y, s: 4, col: HOT, beat: 0.3, life: 260, fout: 100 });
      c.k.sparkles(o.x, o.y, { n: 3, colors: [WHITE], size: 6, r: 4, life: 220 });
      c.each((t, i, d) => {
        c.add('g5Heart', { x0: o.x, y0: o.y, x1: t.x, y1: t.y - 14, hop: 26, start: 60, travel: c.hit - 60, s: 5, col: PINK, delay: d, life: c.hit + 160, fout: 140 });
        healGlow(c, t, d + c.hit);
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y - 12, { cols: IDOL_COLS, r: 26, want: 40 });
    },
  },
  // キラキラビーム: ピンクと 白の 細い ビームに 星が ちりばめられて → 星の 爆発
  ax_kirakira_beam: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_kirarin', allyFx: 'bolt',
    play(fx, c) {
      const o = src(c, 16);
      c.each((t, i, d) => {
        c.k.beam(o.x, o.y, t.x, t.y, { w: 3.6 * c.sz, color: PINK, glow: LIGHT, core: WHITE, delay: d, life: 420, grow: c.hit, widths: [0.5, 1, 1, 0.6, 0], burst: false });
        for (let k = 1; k <= 5; k++) c.fx.twinkle(lerp(o.x, t.x, k / 6) + rnd(-4, 4), lerp(o.y, t.y, k / 6) + rnd(-4, 4), { color: k % 2 ? YEL : WHITE, size: 5, delay: d + c.hit * (k / 6), life: 300 });
        burst(c, t, d + c.hit, { glow: YEL, cols: [WHITE, YEL, LIGHT], heavy: i === 0, n: 10, shape: 'star' });
        c.add('g5Mark', { mark: 'star', x0: t.x, y0: t.y, s: 8 * c.sz, color: YEL, rim: WHITE, glow: YEL, spin: 5, delay: d + c.hit, life: 300, fout: 140 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, YEL, LIGHT], r: 24 });
    },
  },
  // ウインク: 片目の 星の きらり → 星が 敵へ → ドキッ（ハートの 輪）→ 止まる
  ax_wink: {
    charge: { color: PINK, color2: YEL }, sfx: 'ax_g5_pachi', allyFx: 'down',
    play(fx, c) {
      const o = src(c, 20);
      c.add('g5Mark', { mark: 'wink', x0: o.x, y0: o.y, s: 6, color: '#4a8aff', glow: LIGHT, life: 260, fout: 100 });
      c.k.sparkles(o.x + 6, o.y - 2, { n: 2, colors: [WHITE, YEL], size: 8, r: 2, delay: 60, life: 220 });
      c.each((t, i, d) => {
        c.add('g5Mark', { mark: 'star', x0: o.x + 6, y0: o.y, x1: t.x, y1: t.y, travel: c.hit - 40, start: 40, s: 5 * c.sz, color: YEL, rim: WHITE, glow: YEL, spin: 10, delay: d, life: c.hit + 10, ease: 'lin', pop: false });
        burst(c, t, d + c.hit, { glow: PINK, heavy: i === 0, n: 6 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 22 * c.sz, r1: 12 * c.sz, n: 6, s: 2.6, cols: [HOT, PINK, LIGHT], spinMs: 400, delay: d + c.hit, life: c.len - c.hit - 60 - d });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: IDOL_COLS, r: 24 });
    },
  },
  // ハイタッチ会: 味方 1人ずつに 手の ひらの 光が パン → ハート
  ax_hightouch: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_pan', allyFx: 'heal',
    play(fx, c) {
      const gap = c.n > 1 ? Math.min(90, 300 / c.n) : 0;
      c.targets.forEach((t, i) => {
        const d = c.hit - 140 + i * gap - (c.n - 1) * gap / 2;
        c.add('g5Mark', { mark: 'hand', x0: t.x - 12, y0: t.y - 22, x1: t.x - 4, y1: t.y - 22, travel: 120, s: 7, color: '#ffe0d0', color2: PINK, glow: LIGHT, delay: Math.max(0, d), life: 300, fout: 120, rot: 0.25 });
        c.add('g5Mark', { mark: 'hand', x0: t.x + 12, y0: t.y - 22, x1: t.x + 4, y1: t.y - 22, travel: 120, s: 7, color: '#ffe0d0', color2: SKY, glow: LIGHT, flip: true, delay: Math.max(0, d), life: 300, fout: 120, rot: -0.25 });
        c.at(Math.max(0, d) + 120, () => {
          c.fx.glow(t.x, t.y - 22, { color: WHITE, r: 18, life: 200, alpha: 1 });
          c.k.shockwave(t.x, t.y - 22, { r0: 3, r1: 22, color: YEL, w: 2, life: 260 });
          c.k.shapes(t.x, t.y - 22, { shape: 'heart', n: 5, colors: [PINK, HOT, LIGHT], speed: 70, size: 2.6, life: 380, add: false });
        });
        healGlow(c, t, c.hit);
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 20, { cols: IDOL_COLS, r: 60, want: 40 });
    },
  },
  // センター: 上から スポットライトが 自分だけに → たての 光
  ax_center: {
    charge: { color: PINK, color2: YEL }, sfx: 'ax_g5_jan', allyFx: 'up',
    play(fx, c) {
      const t = c.t;
      darken(c, 0.3, c.len - 40);
      spot(c, t.x, t, 0, c.len - 40, '#fff6c8', { w: 22 });
      c.k.pillar(t.x, t.y + 6, { w: 8, color: '#fff6c8', glow: WHITE, delay: c.hit - 60, life: 360, burst: false, alpha: 0.7 });
      c.k.sparkles(t.x, t.y - 20, { n: 6, colors: [WHITE, YEL, LIGHT], size: 7, r: 18, delay: c.hit, life: 280 });
      c.k.shapes(t.x, t.y - 10, { shape: 'star', n: 8, colors: [YEL, WHITE, LIGHT], speed: 70, ang: -Math.PI / 2, spread: 1.1, size: 2.6, delay: c.hit, life: 380 });
      arrows(c, t.x, t.y - 6, YEL, true, 3, c.hit + 40);
      sparkleFill(c, c.hit, t.x, t.y - 24, { cols: [WHITE, YEL, LIGHT], r: 24, want: 40 });
    },
  },
  // ペンライトの海: 画面の 下に 色とりどりの ペンライトが 左右に ゆれる → 上向きの やじるし
  ax_penlight_umi: {
    charge: { color: PINK, color2: SKY }, sfx: 'ax_g5_waa', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.32, end);
      c.add('g5Penlights', { y: c.H - 10, n: 26, rows: 2, cols: PENS, tempo: 140, life: end });
      c.each((t, i, d) => {
        healGlow(c, t, d + c.hit, { col: PENS[i % PENS.length], cols: [WHITE, ...PENS], shape: 'twinkle' });
        arrows(c, t.x, t.y - 12, PENS[(i + 2) % PENS.length], true, 2, d + c.hit + 40);
      });
      sparkleFill(c, c.hit, c.W / 2, c.H - 24, { cols: PENS, r: 110, want: 40 });
    },
  },
  // ハートのシャワー: 敵の 上から ピンクの ハートが 雨の ように → はじける
  ax_heart_shower: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_heart', allyFx: 'down',
    play(fx, c) {
      c.each((t, i, d) => {
        const n = c.n > 2 ? 4 : 10;
        for (let k = 0; k < n; k++) {
          const sx = t.x + rnd(-22, 22) * c.sz;
          c.add('g5Heart', { x0: sx, y0: t.y - 60 - rnd(0, 20), x1: sx + rnd(-6, 6), y1: t.y + rnd(-6, 8), start: k * 22, travel: c.hit - k * 18, s: rnd(2.6, 4) * c.sz, col: [PINK, HOT, LIGHT][k % 3], beat: 0, delay: d, life: c.hit + 20 + k * 4, ease: 'in', pop: false });
        }
        burst(c, t, d + c.hit, { heavy: i === 0, n: 8 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: IDOL_COLS, r: 26, shape: 'heart' });
    },
  },
  // もう1曲: 音符と 紙ふぶき → 味方の ゲージが ひかる
  ax_mou_ikkyoku: {
    charge: { color: YEL, color2: PINK }, sfx: 'ax_g5_encore', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      for (let k = 0; k < 3; k++) spot(c, 40 + k * 88, { x: c.W / 2 + (k - 1) * 70, y: c.H - 20 }, 0, end, [LIGHT, YEL, SKY][k], { sway: 0.3, phase: k });
      confetti(c, c.W / 2, -4, 60, { n: 24, r: 120, life: end - 120 });
      c.each((t, i, d) => {
        notes(c, t.x, t.y - 10, d + 40, { n: 3 });
        healGlow(c, t, d + c.hit, { col: YEL, cols: [WHITE, YEL, LIGHT], shape: 'note' });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 20, { cols: CONFETTI, r: 80, want: 40 });
    },
  },
  // 神対応: 金の 光の 輪と ハート → 大きな 回復
  ax_kami_taiou: {
    charge: { color: GOLD, color2: PINK }, sfx: 'ax_g5_kiran', allyFx: 'heal',
    play(fx, c) {
      c.each((t, i, d) => {
        c.add('g5Mark', { mark: 'crown', x0: t.x, y0: t.y - 40, x1: t.x, y1: t.y - 30, travel: 200, s: 6, glow: GOLD, delay: d, life: c.len - 40 - d, fout: 160 });
        c.k.shockwave(t.x, t.y - 26, { r0: 10, r1: 12, sy: 0.35, color: GOLD, w: 2.4, delay: d + 60, life: c.hit });
        c.k.pillar(t.x, t.y, { w: 9, color: '#fff0a0', glow: WHITE, delay: d + c.hit - 60, life: 360, burst: false, alpha: 0.7 });
        c.add('g5HeartRing', { x: t.x, y: t.y - 6, r0: 4, r1: 26, n: 6, s: 2.6, cols: [PINK, HOT, GOLD], delay: d + c.hit, life: 320 });
        healGlow(c, t, d + c.hit, { col: GOLD, cols: [WHITE, GOLD, LIGHT] });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y - 20, { cols: [WHITE, GOLD, LIGHT], r: 30, want: 40 });
    },
  },
  // ドームライブ: ドームの やねの 弧・スポットライト 4本・ペンライトの 海・紙ふぶき → 敵ぜんぶに 光の はしら
  ax_dome_live: {
    charge: { color: PINK, color2: SKY }, sfx: 'ax_g5_dome', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.4, end, '#0a0420');
      c.add('g5Dome', { cols: PENS, col: '#c8b8ff', life: end });
      if (c.fromAlly) c.add('g5Penlights', { y: c.H - 2, n: 28, rows: 1, cols: PENS, tempo: 120, life: end });
      for (let k = 0; k < 4; k++) spot(c, 24 + k * 70, c.targets[k % c.n], k * 30, end - k * 30, [LIGHT, YEL, SKY, PINK][k], { sway: 0.35, swayMs: 220, phase: k * 1.3 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y + 8, { w: 9 * c.sz, color: LIGHT, glow: WHITE, delay: d + c.hit - 40, life: 320 });
        burst(c, t, d + c.hit, { glow: YEL, cols: [WHITE, YEL, LIGHT], heavy: i === 0, n: 6, shape: 'star' });
      });
      confetti(c, c.W / 2, -4, c.hit - 100, { n: 22, r: 120, life: end - c.hit + 60 });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: CONFETTI, r: 30 });
    },
  },
  // 総選挙: ドラムロールの 光（てんめつ）→ 1位の しるしが ポン・王冠
  ax_sousenkyo: {
    charge: { color: GOLD, color2: PINK }, sfx: 'ax_g5_drumroll', allyFx: 'up',
    play(fx, c) {
      const t = c.t;
      const end = c.len - 40;
      darken(c, 0.38, end);
      // ドラムロール（ライトが あちこち → さいごに 自分へ）
      for (let k = 0; k < 5; k++) {
        const tx = k < 4 ? 30 + ((k * 67) % 200) : t.x;
        spot(c, tx, { x: tx + (k < 4 ? rnd(-10, 10) : 0), y: c.H - 18 }, k * 60, k < 4 ? 80 : end - 240, k < 4 ? WHITE : '#fff6c8', { w: k < 4 ? 12 : 20 });
      }
      c.add('g5Mark', { mark: 'one', x0: t.x, y0: t.y - 40, s: 8, glow: GOLD, delay: c.hit - 40, life: end - c.hit + 40, fout: 200 });
      c.add('g5Mark', { mark: 'crown', x0: t.x, y0: t.y - 62, x1: t.x, y1: t.y - 56, travel: 160, s: 7, glow: GOLD, delay: c.hit, life: end - c.hit, fout: 200 });
      c.fx.flashAt(80, '#fff6c8', c.hit);
      c.k.shapes(t.x, t.y - 40, { shape: 'star', n: 10, colors: [GOLD, WHITE, LIGHT], speed: 90, size: 2.6, delay: c.hit, life: 360 });
      confetti(c, t.x, -4, c.hit, { n: 16, r: 50, life: end - c.hit });
      sparkleFill(c, c.hit, t.x, t.y - 30, { cols: [WHITE, GOLD, LIGHT], r: 30, want: 40 });
    },
  },
  // ラブリービーム: ハートが つながった 太い ピンクの ビーム → 大きな ハートの 爆発
  ax_lovely_beam: {
    charge: { color: PINK, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_lovely', allyFx: 'bolt',
    play(fx, c) {
      const o = src(c, 18);
      c.add('g5Heart', { x0: o.x - 5, y0: o.y, s: 4, col: HOT, beat: 0.3, life: 300, fout: 120 });
      c.add('g5Heart', { x0: o.x + 5, y0: o.y, s: 4, col: HOT, beat: 0.3, life: 300, fout: 120 });
      c.each((t, i, d) => {
        c.k.beam(o.x, o.y, t.x, t.y, { w: 6 * c.sz, color: PINK, glow: LIGHT, core: WHITE, delay: d, life: 460, grow: c.hit, widths: [0.5, 1, 1.05, 0.8, 0], burst: false, alpha: 0.7 });
        c.add('g5HeartBeam', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, s: 4.4 * c.sz, gap: 12, cols: [HOT, PINK, LIGHT], grow: c.hit, delay: d, life: 460 });
        c.add('g5Heart', { x0: t.x, y0: t.y, s: 9 * c.sz, col: PINK, glow: LIGHT, grow: 200, growTo: 1.2, beat: 0.1, delay: d + c.hit, life: 340, fout: 180 });
        burst(c, t, d + c.hit, { heavy: i === 0, n: 8, ring: 50 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 8, r1: 34 * c.sz, n: 7, s: 2.6, cols: [HOT, PINK, LIGHT], delay: d + c.hit + 40, life: 340 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: IDOL_COLS, r: 26, shape: 'heart' });
    },
  },
  // ファンの大声えん: 画面の 下から うちわの 光の 波 → 回復
  ax_fan_daiseien: {
    charge: { color: PINK, color2: YEL }, sfx: 'ax_g5_ganbare', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      c.add('g5Wave', { y0: c.H + 10, y1: c.H - 40, cols: [LIGHT, YEL, SKY], travel: c.hit, amp: 4, alpha: 0.3, life: end });
      for (let k = 0; k < 9; k++) {
        const ux = 14 + k * 29;
        c.add('g5Mark', { mark: 'uchiwa', x0: ux, y0: c.H + 14, x1: ux, y1: c.H - 30 - (k % 2) * 8, travel: c.hit - 60, s: 6, color: PENS[k % PENS.length], wobble: 0.35, delay: k * 18, life: end - k * 18, fout: 200, pop: false });
      }
      c.each((t, i, d) => healGlow(c, t, d + c.hit));
      sparkleFill(c, c.hit, c.W / 2, c.H - 40, { cols: [WHITE, ...PENS], r: 110, want: 40 });
    },
  },

  // ── フルーツジッパー ──
  // ミックスジュース: 7色の くだものが ミキサーで うず → グラスが 味方へ → 回復
  ax_mix_juice: {
    charge: { color: '#ffb070', color2: '#ffe880' }, sfx: 'ax_g5_mixer', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      const mx = c.W / 2, my = 52;
      c.add('g5Tornado', { x0: mx, y0: my + 30, w: 44, h: 60, cols: FRUIT7, grow: 200, life: c.hit - 40 });
      FRUITS.slice(0, 7).forEach((f, k) => {
        const a0 = (k / 7) * TAU;
        c.add('g5Fruit', { fruit: f, x0: mx + Math.cos(a0) * 34, y0: my + Math.sin(a0) * 14, x1: mx, y1: my + 6, cx: mx + Math.cos(a0 + 2) * 34, cy: my + Math.sin(a0 + 2) * 14, travel: c.hit - 160, s: 6, spin: 8, delay: k * 20, life: c.hit - 120, pop: true, fout: 80 });
      });
      c.each((t, i, d) => {
        c.add('g5Mark', { mark: 'cup', x0: mx, y0: my + 6, x1: t.x, y1: t.y - 18, hop: 20, start: c.hit - 160, travel: 160, s: 8, cols: FRUIT7, delay: d, life: end - d, fout: 200 });
        c.at(d + c.hit + 20, () => { for (let k = 0; k < 5; k++) c.fx.bubble(t.x + rnd(-8, 8), t.y - 16, { color: FRUIT7[k], size: rnd(1.2, 2), vy: rnd(-30, -14), life: 420 }); });
        healGlow(c, t, d + c.hit, { col: '#ffd0a0', cols: FRUIT7, shape: 'heart' });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: FRUIT7, r: 80, want: 80 });
    },
  },
  // チェリーボム: 2つ つながった 赤い さくらんぼが 敵へ → ピンクと 赤の 爆発・ハート
  ax_cherry_bomb: {
    charge: { color: '#ff4a6a', color2: '#ffd0e0' }, sfx: 'ax_g5_bomb', allyFx: 'fire',
    play(fx, c) {
      const o = src(c, 16);
      darken(c, 0.36, c.hit + 300);
      c.each((t, i, d) => {
        c.add('g5Fruit', { fruit: 'cherry', x0: o.x, y0: o.y, x1: t.x, y1: t.y, hop: 40, travel: c.hit, s: 7 * c.sz, spin: 6, delay: d, life: c.hit + 10, ease: 'lin', tail: '#ff8ab0' });
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ff2a4a', glow: '#ff8ab0', core: WHITE, list: ['#ff2a4a', '#ff8ab0', WHITE] }, delay: d + c.hit, heavy: i === 0, smoke: '#ffb0c8' });
        c.k.shapes(t.x, t.y, { shape: 'heart', n: c.n > 2 ? 6 : 12, colors: [HOT, PINK, '#ff2a4a'], speed: 120, size: 3, delay: d + c.hit + 40, life: 520, add: false });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 8, r1: 40 * c.sz, n: 6, s: 2.8, cols: ['#ff2a4a', PINK, HOT], delay: d + c.hit + 60, life: 420 });
      });
      c.k.shake(360, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, LIGHT, '#ff8ab0'], r: 30 });
    },
  },
  // バナナのかわ: 黄色い バナナの かわが 足もとに → すべる（くるっと まわる 線）→ 星
  ax_banana_kawa: {
    charge: { color: '#ffe040', color2: WHITE }, sfx: 'ax_g5_slip', allyFx: 'down',
    play(fx, c) {
      const o = src(c, 16);
      const end = c.len - 40;
      c.each((t, i, d) => {
        const fy = t.y + 14 * c.sz;
        c.add('g5Fruit', { fruit: 'banana', x0: o.x, y0: o.y, x1: t.x, y1: fy, hop: 34, travel: c.hit - 120, s: 6 * c.sz, spin: 10, delay: d, life: end - d, ease: 'lin', fout: 200 });
        c.k.crescent(t.x, t.y, { r: 20 * c.sz, a0: 0.8, a1: 0.8 + TAU * 0.9, w: 3, color: '#fff6a0', glow: '#ffe040', core: WHITE, delay: d + c.hit - 120, swing: 220, life: 360, after: 2, sy: 0.6 });
        burst(c, { x: t.x, y: t.y + 6 }, d + c.hit, { glow: '#ffe040', cols: [WHITE, '#ffe040', '#fff6a0'], heavy: i === 0, n: 10, shape: 'star' });
        c.add('g5HeartRing', { x: t.x, y: t.y - 18 * c.sz, r0: 10, r1: 12, n: 4, s: 2.2, cols: ['#ffe040', WHITE], spinMs: 200, sy: 0.4, delay: d + c.hit + 100, life: end - c.hit - 100 - d });
        c.k.shockwave(t.x, fy, { r0: 4, r1: 40 * c.sz, sy: 0.3, color: '#ffe040', w: 2, delay: d + c.hit, life: 360 });
      });
      c.k.shake(340, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, '#ffe040'], r: 30, shape: 'star' });
    },
  },
  // フルーツバスケット: バスケットから くだものが 飛びだして 敵の 上で はねまわる → 目を まわす
  ax_fruits_basket: {
    charge: { color: '#ffb070', color2: '#a8f0a0' }, sfx: 'ax_g5_pop', allyFx: 'down',
    play(fx, c) {
      const o = src(c, 18);
      const end = c.len - 40;
      c.add('g5Mark', { mark: 'basket', x0: o.x, y0: o.y, s: 9, glow: '#ffd0a0', life: c.hit + 100, fout: 160 });
      c.each((t, i, d) => {
        const n = c.n > 2 ? 3 : 6;
        for (let k = 0; k < n; k++) {
          const f = FRUITS[(k + i * 2) % FRUITS.length];
          c.add('g5Fruit', { fruit: f, x0: o.x, y0: o.y - 6, x1: t.x + (k - n / 2) * 6, y1: t.y - 14 - (k % 2) * 8, hop: 30 + k * 6, start: k * 30, travel: c.hit - k * 30, s: 4.2 * c.sz, spin: 8, delay: d, life: c.hit + 20, ease: 'lin' });
          // はねまわる
          c.add('g5Fruit', { fruit: f, x0: t.x + (k - n / 2) * 6, y0: t.y - 14, x1: t.x + rnd(-26, 26), y1: t.y + rnd(-4, 10), hop: 22, start: 0, travel: 340, s: 4.2 * c.sz, spin: -8, delay: d + c.hit, life: 420, ease: 'lin', fout: 120 });
        }
        burst(c, t, d + c.hit, { glow: '#ffd0a0', cols: FRUIT7, heavy: i === 0, n: 8, shape: 'star' });
        c.add('g5HeartRing', { x: t.x, y: t.y - 18 * c.sz, r0: 10, r1: 12, n: 4, s: 2.2, cols: ['#ffe040', WHITE], spinMs: 200, sy: 0.4, delay: d + c.hit + 160, life: end - c.hit - 160 - d });
      });
      c.k.shake(300, 2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: FRUIT7, r: 30 });
    },
  },
  // トロピカルステージ: ヤシの 葉の かげ・パステルの ライト・紙ふぶき → 上向きの やじるし
  ax_tropical_stage: {
    charge: { color: '#ffb070', color2: '#9ad8ff' }, sfx: 'ax_g5_tropical', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'tropical', 0.42, end, { lights: FRUIT7 });
      confetti(c, c.W / 2, -4, 80, { n: 26, r: 120, life: end - 120, cols: FRUIT7 });
      for (let k = 0; k < 8; k++) c.at(k * 60, () => c.k.petals(rnd(20, c.W - 20), rnd(20, 60), { n: 2, colors: ['#ff6a8a', '#ffb070', '#ffe880'], spread: 8, life: 600 }));
      c.each((t, i, d) => {
        healGlow(c, t, d + c.hit, { col: FRUIT7[i % 7], cols: FRUIT7, shape: 'star' });
        arrows(c, t.x, t.y - 12, FRUIT7[(i + 3) % 7], true, 3, d + c.hit + 40);
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: FRUIT7, r: 100, want: 80 });
    },
  },
  // パイナップルアタック: 大きな パイナップルが 回転しながら とびこむ → 黄色い 爆発
  ax_pine_attack: {
    charge: { color: '#ffc020', color2: '#a8f0a0', power: 1.1 }, sfx: 'ax_g5_roll', allyFx: 'quake',
    play(fx, c) {
      const o = src(c, 16);
      darken(c, 0.38, c.hit + 400);
      c.each((t, i, d) => {
        c.add('g5Fruit', { fruit: 'pine', x0: o.x, y0: o.y, x1: t.x, y1: t.y, hop: 30, travel: c.hit, s: 13 * c.sz, spin: 14, delay: d, life: c.hit + 20, ease: 'in', tail: '#ffe040' });
        c.k.speedLines(t.x, t.y, { delay: d + c.hit - 60, life: 260, r1: 120, color: '#fff6a0' });
        c.k.explosion(t.x, t.y, { r: 26 * c.sz, pal: { main: '#ffc020', glow: '#ffe880', core: WHITE, list: ['#ffc020', '#ffe880', '#3ab84a'] }, delay: d + c.hit, heavy: i === 0, smoke: '#c8a060' });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 8 : 16, colors: ['#ffc020', '#ffe880', '#3ab84a'], speed: 150, ang: -Math.PI / 2, spread: 1.3, g: 300, size: 2.4, delay: d + c.hit + 20, life: 520 });
      });
      c.k.shake(420, 3, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, '#ffe880', '#ffc020'], r: 30 });
    },
  },
  // フルーツメテオ: 7色の ライトが 空へ → 空から 7色の くだものが 流れ星の ように 光の しっぽを ひいて 敵ぜんぶへ → 色とりどりの 爆発・ハート・紙ふぶき
  ax_fruits_meteor: {
    charge: { color: '#ff8ab0', color2: '#ffe880', power: 1.2 }, sfx: 'ax_g5_meteor', allyFx: 'fire',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'stage', 0.5, end, { lights: FRUIT7, cols: ['#1a0a30', '#3a1a50', '#5a2a60', '#6a3a70'] });
      // 7色の ライトが 空へ
      FRUIT7.forEach((col, k) => c.add('g5Laser', { x: 18 + k * 37, y: c.H + 4, ang0: -Math.PI / 2 - 0.4 + k * 0.02, ang1: -Math.PI / 2 + 0.4 - k * 0.02, len: 180, w: 1.6, col, delay: k * 30, life: c.hit + 200 }));
      c.each((t, i, d) => {
        const n = c.n > 2 ? 3 : 7;
        for (let k = 0; k < n; k++) {
          const f = FRUITS[(k + i * 3) % FRUITS.length];
          const sx = t.x - 90 + k * 10, sy = -20 - k * 6;
          c.add('g5Fruit', { fruit: f, x0: sx, y0: sy, x1: t.x + rnd(-12, 12) * c.sz, y1: t.y + rnd(-8, 8), start: 160 + k * 30, travel: c.hit - 160 - k * 10, s: 5.2 * c.sz, spin: 6, delay: d, life: c.hit + 30 + k * 20, ease: 'in', tail: FRUIT_COL[f] });
        }
        c.k.explosion(t.x, t.y, { r: 24 * c.sz, pal: { main: '#ff8ab0', glow: '#ffe880', core: WHITE, list: FRUIT7 }, delay: d + c.hit, heavy: i === 0, smoke: '#c8a0d0' });
        c.k.shapes(t.x, t.y, { shape: 'heart', n: c.n > 2 ? 5 : 10, colors: FRUIT7, speed: 120, size: 3, delay: d + c.hit + 40, life: 520, add: false });
        c.k.shockwave(t.x, t.y + 10, { r0: 6, r1: 70 * c.sz, sy: 0.3, color: '#ffe880', w: 2.2, n: 2, gap: 100, delay: d + c.hit + 30, life: 420 });
      });
      c.fx.flashAt(140, '#fff0f8', c.hit);
      c.k.shake(440, 2.8, c.hit);
      confetti(c, c.center.x, -4, c.hit + 80, { n: 30, r: 120, life: end - c.hit - 100, cols: FRUIT7 });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: FRUIT7, r: 30 });
    },
  },
  // フルーツパフェ: グラスに クリームと くだものが つみあがる → 回復
  ax_fruits_parfait: {
    charge: { color: '#ffa8d8', color2: '#ffe880' }, sfx: 'ax_g5_tropical', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      const px = c.W / 2, py = c.t.y - 2;
      c.add('g5Parfait', { x: px, y: py, s: 11, grow: c.hit - 60, life: end });
      for (let k = 0; k < 6; k++) c.at(k * (c.hit / 6), () => c.k.shapes(px + rnd(-18, 18), py - 20 - k * 6, { shape: 'twinkle', n: 3, colors: [WHITE, ...FRUIT7], speed: 30, size: 2.6, life: 360 }));
      c.fx.flashAt(80, '#fff6fa', c.hit);
      c.each((t, i, d) => {
        c.add('g5Heart', { x0: px, y0: py - 50, x1: t.x, y1: t.y - 10, hop: 20, start: c.hit - 40, travel: 200, s: 4, col: FRUIT7[i % 7], delay: d, life: c.hit + 260, fout: 100 });
        healGlow(c, t, d + c.hit + 140, { col: '#ffd0e8', cols: FRUIT7 });
      });
      confetti(c, px, -4, c.hit, { n: 18, r: 100, life: end - c.hit, cols: FRUIT7 });
      sparkleFill(c, c.hit, px, py - 40, { cols: FRUIT7, r: 60, want: 80 });
    },
  },

  // ── アラシ ──
  // 旋風ステップ: 5色の 光の すじが まわる ステップの うず → 風の うずが 敵ぜんぶへ
  ax_senpu_step: {
    charge: { color: '#3a8aff', color2: '#ffe040' }, sfx: 'ax_g5_step', allyFx: 'wind',
    play(fx, c) {
      const o = c.fromAlly ? { x: c.from.x, y: c.H - 12 } : { x: c.from.x, y: c.from.y + 14 };
      darken(c, 0.36, c.len - 40);
      ARASHI.forEach((col, k) => c.add('g5Ribbon', { x: o.x, y: o.y + 4, r: 26, h: 14, turns: 1.2, phase: (k / 5) * TAU, cols: [col, WHITE], w: 2.6, grow: 260, len: 0.6, spinMs: 120, flat: 0.3, taper: 0, life: 420 }));
      c.each((t, i, d) => {
        c.add('g5Tornado', { x0: o.x, y0: o.y, x1: t.x, y1: t.y + 16, travel: c.hit - 120, start: 120, w: 24 * c.sz, h: 50 * c.sz, cols: ARASHI, grow: 200, delay: d, life: c.hit + 360 });
        c.k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#9ad1ff', colors: ARASHI, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 6, r1: 50 * c.sz, color: WHITE, w: 2, n: 2, gap: 90, delay: d + c.hit + 30, life: 360 });
        for (let k = 0; k < 3; k++) c.fx.gust(t.x - 30, t.y - 12 + k * 10, { len: 60, amp: 4, color: ARASHI[(k + i) % 5], w: 1.2, dir: 1, delay: d + c.hit - 60 + k * 50, life: 380 });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 6 : 12, colors: ARASHI, speed: 120, size: 2.2, delay: d + c.hit + 40, life: 480 });
      });
      c.k.shake(360, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, ...ARASHI], r: 30 });
    },
  },
  // スピンキック: 5色の 回転の 線 → キック → 星
  ax_arashi_spin: {
    charge: { color: '#ff3a3a', color2: '#ffe040' }, sfx: 'ax_g5_step', allyFx: 'claw',
    play(fx, c) {
      const o = src(c, 14);
      darken(c, 0.34, c.hit + 300);
      c.each((t, i, d) => {
        c.k.dash(o.x, o.y, t.x - 10, t.y + 2, { color: '#9ad1ff', travel: c.hit - 160, w: 4, delay: d });
        ARASHI.forEach((col, k) => c.k.crescent(t.x, t.y, { r: (16 + k * 4) * c.sz, a0: k * 1.3, a1: k * 1.3 + 4.2, w: 3, color: col, glow: col, core: WHITE, delay: d + c.hit - 200 + k * 30, swing: 160, life: 320, after: 2, sy: 0.7 }));
        burst(c, t, d + c.hit, { glow: '#ffe040', cols: [WHITE, ...ARASHI], heavy: i === 0, n: 12, shape: 'star', r: 18, ring: 52 });
        c.add('g5Mark', { mark: 'star', x0: t.x + 8, y0: t.y - 8, s: 9 * c.sz, color: '#ffe040', rim: WHITE, glow: '#ffe040', spin: 6, delay: d + c.hit, life: 360, fout: 160 });
      });
      c.k.shake(340, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, ...ARASHI], r: 30, shape: 'star' });
    },
  },
  // クールなまなざし: 目の きらり（青白）→ 敵ぜんぶに 光の 線 → ハートの 目で 止まる
  ax_cool_manazashi: {
    charge: { color: '#9ad1ff', color2: WHITE }, sfx: 'ax_g5_cool', allyFx: 'down',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 24);
      darken(c, 0.42, end, '#020818');
      c.add('g5Mark', { mark: 'eye', x0: o.x, y0: o.y, s: 9, color: '#3a6aff', glow: '#9ad1ff', life: c.hit + 200, fout: 160 });
      c.k.sparkles(o.x + 4, o.y - 3, { n: 3, colors: [WHITE, '#9ad1ff'], size: 10, r: 2, delay: 80, life: 260 });
      c.k.streaks({ ang: 0, color: '#9ad1ff', n: 14, life: c.hit + 200, alpha: 0.4 });
      c.each((t, i, d) => {
        c.add('g5Line', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, w: 1.6, col: '#9ad1ff', grow: c.hit - 60, delay: d + 40, life: c.hit + 140 });
        c.k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#9ad1ff', colors: [WHITE, '#9ad1ff'], delay: d + c.hit, heavy: i === 0 });
        c.k.shapes(t.x, t.y, { shape: 'twinkle', n: 8, colors: [WHITE, '#9ad1ff'], speed: 80, size: 3, delay: d + c.hit, life: 420 });
        for (const dx of [-5, 5]) c.add('g5Heart', { x0: t.x + dx * c.sz, y0: t.y - 16 * c.sz, s: 3.2, col: HOT, beat: 0.25, delay: d + c.hit + 120, life: end - c.hit - 120 - d, fout: 160 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 4, r1: 30 * c.sz, n: 5, s: 2.4, cols: [PINK, HOT], delay: d + c.hit + 60, life: 360 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, '#9ad1ff', PINK], r: 30 });
    },
  },
  // 5人のハーモニー: 5色の 音符が かさなって 和音の 輪 → 回復
  ax_5nin_harmony: {
    charge: { color: '#3ad870', color2: WHITE }, sfx: 'ax_g5_chord', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      const cx = c.W / 2, cy = 46;
      ARASHI.forEach((col, k) => {
        const a0 = -Math.PI / 2 + (k / 5) * TAU;
        c.add('g5Mark', { mark: 'note', x0: cx + Math.cos(a0) * 70, y0: cy + Math.sin(a0) * 30, x1: cx, y1: cy, travel: c.hit - 120, s: 6, color: col, glow: col, wobble: 0.3, delay: k * 30, life: c.hit - 80 - k * 30, fout: 80 });
      });
      ARASHI.forEach((col, k) => c.k.shockwave(cx, cy, { r0: 6, r1: 60 + k * 14, color: col, w: 2.2, delay: c.hit - 120 + k * 40, life: 420 }));
      c.fx.glow(cx, cy, { color: WHITE, r: 26, delay: c.hit - 120, life: 360, alpha: 1 });
      c.each((t, i, d) => {
        c.add('g5Line', { x0: cx, y0: cy, x1: t.x, y1: t.y - 6, w: 1.8, col: ARASHI[i % 5], grow: 160, delay: d + c.hit - 100, life: 420 });
        healGlow(c, t, d + c.hit, { col: ARASHI[(i + 2) % 5], cols: [WHITE, ...ARASHI], shape: 'note' });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 40, { cols: [WHITE, ...ARASHI], r: 90, want: 80 });
    },
  },
  // 嵐を呼ぶステージ: 5色の スポットライト・風と 紙ふぶき → 上向きの やじるし
  ax_arashi_stage: {
    charge: { color: '#a85aff', color2: '#ffe040' }, sfx: 'ax_g5_storm', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'stage', 0.45, end, { lights: ARASHI });
      ARASHI.forEach((col, k) => spot(c, 26 + k * 51, c.targets[k % c.n], k * 40, end - k * 40, col, { sway: 0.4, swayMs: 200, phase: k }));
      for (let k = 0; k < 6; k++) c.fx.gust(-10, 30 + k * 14, { len: 80, amp: 5, color: ARASHI[k % 5], w: 1.2, dir: 1, delay: k * 60, life: 520 });
      confetti(c, c.W / 2, -4, 120, { n: 28, r: 120, life: end - 140, cols: ARASHI });
      c.each((t, i, d) => {
        healGlow(c, t, d + c.hit, { col: ARASHI[i % 5], cols: [WHITE, ...ARASHI], shape: 'star' });
        arrows(c, t.x, t.y - 12, ARASHI[i % 5], true, 3, d + c.hit + 40);
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: [WHITE, ...ARASHI], r: 100, want: 80 });
    },
  },
  // いなずまステップ: ジグザグの いなずまの 足あとが 敵へ → かみなり
  ax_inazuma_step: {
    charge: { color: '#ffe040', color2: WHITE }, sfx: 'ax_g5_thunder', allyFx: 'bolt',
    play(fx, c) {
      const o = c.fromAlly ? { x: c.from.x, y: c.H - 10 } : { x: c.from.x, y: c.from.y + 14 };
      darken(c, 0.42, c.len - 40, '#04040c');
      c.each((t, i, d) => {
        const steps = 5;
        let px = o.x, py = o.y;
        for (let k = 1; k <= steps; k++) {
          const u = k / steps;
          const nx = lerp(o.x, t.x, u) + (k % 2 ? 12 : -12) * (k < steps ? 1 : 0), ny = lerp(o.y, t.y + 12, u);
          const at = d + (c.hit - 100) * (k - 1) / steps;
          c.k.bolt(px, py, nx, ny, { w: 1.6, color: '#fff6b0', glow: '#ffe040', forks: 0, n: 4, amp: 3, delay: at, life: 260, grow: 40 });
          c.k.shockwave(nx, ny, { r0: 2, r1: 12, sy: 0.4, color: '#ffe040', w: 1.4, delay: at + 40, life: 240 });
          px = nx; py = ny;
        }
        c.k.boltRain(t.x, t.y, { n: 2, w: 3, color: '#fff6b0', glow: '#ffe040', delay: d + c.hit - 60, life: 360, forks: 3 });
        burst(c, t, d + c.hit, { glow: '#ffe040', cols: [WHITE, '#ffe040', '#fff6b0'], heavy: i === 0, n: 10, shape: 'star', r: 18, ring: 54 });
      });
      c.fx.flashAt(100, '#fff6b0', c.hit);
      c.k.shake(380, 2.6, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, '#ffe040'], r: 30 });
    },
  },
  // 雷鳴ライブ: 雷雲と ライト → 5色の レーザーが 交差、いなずま 5本が 敵ぜんぶに → 紙ふぶきと 5色の 爆発
  ax_raimei_live: {
    charge: { color: '#ffe040', color2: '#a85aff', power: 1.2 }, sfx: 'ax_g5_thunder', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'storm', 0.55, end, { lights: ARASHI });
      ARASHI.forEach((col, k) => {
        const left = k % 2 === 0;
        c.add('g5Laser', { x: left ? -4 : c.W + 4, y: c.H - 6 - k * 4, ang0: left ? -0.9 : -Math.PI + 0.9, ang1: left ? -0.15 : -Math.PI + 0.15, len: 300, w: 1.6, col, delay: k * 40, life: c.hit + 260 });
      });
      c.each((t, i, d) => {
        const n = c.n > 2 ? 2 : 5;
        for (let k = 0; k < n; k++) {
          const col = ARASHI[(k + i) % 5];
          c.k.bolt(t.x + rnd(-40, 40), -10, t.x + rnd(-6, 6), t.y, { w: 2.6, color: WHITE, glow: col, forks: 2, n: 9, amp: 10, delay: d + c.hit - 60 + k * 40, life: 360, grow: 60 });
        }
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ffe040', glow: '#fff6b0', core: WHITE, list: ARASHI }, delay: d + c.hit, heavy: i === 0, smoke: '#3a3a50' });
        c.k.shockwave(t.x, t.y + 10, { r0: 6, r1: 70 * c.sz, sy: 0.3, color: '#ffe040', w: 2.2, n: 2, gap: 100, delay: d + c.hit + 30, life: 420 });
      });
      c.fx.flashAt(160, '#ffffff', c.hit);
      c.at(c.hit + 220, () => c.fx.flashAt(80, '#fff6b0', 0));
      c.k.shake(480, 3, c.hit);
      confetti(c, c.center.x, -4, c.hit + 100, { n: 30, r: 120, life: end - c.hit - 120, cols: ARASHI });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, ...ARASHI], r: 30 });
    },
  },
  // 5人の大嵐: 5色の 風の 帯が かさなって 大きな たつまき → 敵ぜんぶを まきこむ → 紙ふぶき
  ax_5nin_ooarashi: {
    charge: { color: '#3a8aff', color2: WHITE, power: 1.2 }, sfx: 'ax_g5_storm', allyFx: 'wind',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.42, end, '#06040e');
      const gx = c.center.x, gy = (c.fromAlly ? Math.max(...c.targets.map((t) => t.y)) : c.center.y) + 18;
      ARASHI.forEach((col, k) => c.add('g5Ribbon', { x: gx, y: gy, r: 70 - k * 6, h: 90, turns: 2, phase: (k / 5) * TAU, cols: [col, WHITE], w: 3, grow: c.hit, len: 0.8, spinMs: 110, flat: 0.25, taper: 0.55, delay: k * 30, life: c.hit + 420 - k * 30 }));
      c.add('g5Tornado', { x0: gx, y0: gy, w: 70, h: 100, cols: ARASHI, grow: c.hit, delay: 100, life: c.hit + 560 });
      c.each((t, i, d) => {
        fx.swirl(t.x, t.y - 4, ARASHI, { n: c.n > 2 ? 8 : 16, rad: 22 * c.sz, h: 40, delay: d + c.hit - 160, life: 520, size: 1.6 });
        c.k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#9ad1ff', colors: ARASHI, delay: d + c.hit, heavy: i === 0 });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 6 : 12, colors: ARASHI, speed: 140, size: 2.4, delay: d + c.hit + 40, life: 480 });
      });
      c.k.shake(520, 2.8, c.hit);
      confetti(c, gx, -4, c.hit + 120, { n: 30, r: 120, life: end - c.hit - 140, cols: ARASHI });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, ...ARASHI], r: 30 });
    },
  },
};

export const AX_G5_IDOL = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { ...d, play: wrapPlay(d.play) }]));
void [SKY];
