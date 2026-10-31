// 第48回 G5: セーラームーン（美少女戦士・セーラームーン）と ネオ・クイーン・セレニティ の 大技の え
// ・男の子の 版（タキシード仮面ふう）は 赤い バラ・黒い マント・白い 仮面・満月。キング・エンディミオンふうは 金
// ・時間は shared/data/ax-time-g5.js（ここには 見た目だけ）。c の 時間は はなつ しゅんかんが 0
// ・画面の 文字は かかない（文字の 中に 漢字を 入れない。コメントは よい）
import { rnd, lerp, clamp01, easeOut, softGlow, disc, mixHex } from './axkit.js?v=a5c15ff5e061';
import { wrapPlay, sparkleFill, crescentPath, arrows } from './axfx-g5-kit.js?v=a5c15ff5e061';

const TAU = Math.PI * 2;
// 色
const PINK = '#ff7ad8', PINK2 = '#ffb8ec', GOLD = '#ffd23a', GOLD2 = '#fff0a0', WHITE = '#ffffff', SILVER = '#e8f0ff', SILVER2 = '#a8c0ff';
const RED = '#e8143a', RED2 = '#ff6a8a', BLACK = '#14141e', MOONBLUE = '#c8d8ff';
const MOON_COLS = [WHITE, PINK2, GOLD2, PINK];
const TUX_COLS = [WHITE, RED2, RED, '#ffe8f0'];
const KING_COLS = [WHITE, GOLD2, GOLD, '#ffe8a0'];
const SILVER_COLS = [WHITE, SILVER, SILVER2, '#fff6dc'];
const KIZUNA = ['#ff7ad8', '#4ab8ff', '#ff4a4a', '#5ae07a', '#ffa03a'];

// ───────────── この ファイルの つぶ ─────────────
export const AX_G5_FINE_MOON = {
  // 黒い マント（うらは 赤）。x, y … まん中、a0 → a1 … ひるがえる むき、r … 大きさ
  g5Cape(x, p) {
    const life = p.life;
    const a = clamp01(p.age / 60) * clamp01((life - p.age) / 200);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.swing)));
    const a1 = lerp(p.a0, p.a1, e);
    const lo = Math.min(p.a0, a1), hi = Math.max(p.a0, a1);
    if (hi - lo < 0.02) return;
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'source-over';
    const wave = (an, r) => r * (1 + 0.08 * Math.sin(an * 5 + p.age / 60));
    const sector = (r0, r1, col, al) => {
      x.globalAlpha = a * al;
      x.fillStyle = col;
      x.beginPath();
      const N = 16;
      for (let i = 0; i <= N; i++) { const an = lo + (hi - lo) * (i / N); const r = wave(an, r1); i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r * (p.sy ?? 1)) : x.moveTo(Math.cos(an) * r, Math.sin(an) * r * (p.sy ?? 1)); }
      for (let i = N; i >= 0; i--) { const an = lo + (hi - lo) * (i / N); x.lineTo(Math.cos(an) * r0, Math.sin(an) * r0 * (p.sy ?? 1)); }
      x.closePath(); x.fill();
    };
    sector(p.r * 0.15, p.r, p.out || BLACK, 0.95);
    sector(p.r * 0.12, p.r * 0.58, p.lining || '#c8102e', 0.9);
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#ff8aa0';
    x.globalAlpha = a * 0.7;
    x.lineWidth = 1;
    x.beginPath();
    for (let i = 0; i <= 16; i++) { const an = lo + (hi - lo) * (i / 16); const r = wave(an, p.r); i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r * (p.sy ?? 1)) : x.moveTo(Math.cos(an) * r, Math.sin(an) * r * (p.sy ?? 1)); }
    x.stroke();
    x.restore();
  },
  // シャボンの あわ（x0,y0 → x1,y1 へ ふわふわ）
  g5Bubble(x, p) {
    const a = clamp01(p.age / 80) * clamp01((p.life - p.age) / 160);
    if (a <= 0) return;
    const k = clamp01(p.age / Math.max(1, p.travel));
    const e = k * (2 - k);
    const bx = lerp(p.x0, p.x1, e) + Math.sin(p.age / 90 + p.seed) * 4;
    const by = lerp(p.y0, p.y1, e) + Math.cos(p.age / 110 + p.seed) * 3;
    const r = p.r * (0.6 + 0.4 * e);
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, bx, by, r * 2, '#9ae6ff', a * 0.4);
    x.globalAlpha = a * 0.25;
    disc(x, bx, by, r, '#bfeaff');
    x.globalAlpha = a * 0.9;
    x.strokeStyle = p.col || '#d8f4ff';
    x.lineWidth = 0.8;
    x.beginPath(); x.arc(bx, by, r, 0, TAU); x.stroke();
    x.strokeStyle = '#ff9ad8';
    x.globalAlpha = a * 0.5;
    x.beginPath(); x.arc(bx, by, r * 0.8, 0.4, 1.6); x.stroke();
    disc(x, bx - r * 0.35, by - r * 0.35, r * 0.22, '#ffffff');
    x.restore();
  },
  // 三日月の 光の 波（x0,y0 → x1,y1 へ とぶ。うしろに ざんぞう）
  g5MoonWave(x, p) {
    const a = clamp01(p.age / 60) * clamp01((p.life - p.age) / 140);
    if (a <= 0) return;
    const k = clamp01((p.age - (p.start || 0)) / Math.max(1, p.travel));
    if (p.age < (p.start || 0)) return;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (let i = 4; i >= 0; i--) {
      const kk = Math.max(0, k - i * 0.07);
      const cx = lerp(p.x0, p.x1, kk), cy = lerp(p.y0, p.y1, kk);
      const s = p.s * (0.6 + 0.4 * kk);
      x.save(); x.translate(cx, cy); x.rotate(ang + Math.PI);
      x.globalAlpha = a * (i ? 0.18 * (5 - i) / 5 : 1);
      if (!i) softGlow(x, 0, 0, s * 2.2, p.glow, a * 0.8);
      x.fillStyle = i ? p.glow : p.col;
      crescentPath(x, s, 0.45); x.fill();
      x.restore();
    }
    x.restore();
  },
};

// ───────────── どうぐ ─────────────
// あたった ところ（ひかり・わ・ほし）
function burst(c, t, d, { glow = GOLD, cols = MOON_COLS, r = 16, heavy = false, stars = 10, ring = 46, shape = 'star' } = {}) {
  c.k.impact(t.x, t.y, { r: r * c.sz, glow, colors: cols, delay: d, heavy });
  c.k.shockwave(t.x, t.y, { r0: 6, r1: ring * c.sz, color: glow, w: 2.2, n: 2, gap: 100, delay: d + 30, life: 380 });
  if (stars) c.k.shapes(t.x, t.y, { shape, n: stars, colors: cols, speed: 110, size: 2.6, delay: d + 20, life: 480 });
}
// 光の こな（ゆっくり おちる きらきら）
function dust(c, x, y, d, { n = 14, cols = [WHITE, GOLD2], r = 22, life = 520, fall = 18 } = {}) {
  for (let i = 0; i < n; i++) c.fx.twinkle(x + rnd(-r, r), y + rnd(-r, r) * 0.7, { color: cols[i % cols.length], size: rnd(2.2, 4.4), vy: rnd(fall * 0.3, fall), delay: d + rnd(0, 140), life: life * rnd(0.7, 1) });
}
// 画面を くらく（はなつ あいだ）
function darken(c, a, life, color = '#06041a') { c.k.tint(color, { a, life, fin: 40, fout: Math.min(320, life * 0.4) }); }
// はいけい（伝説）
function sky(c, style, a, life, o = {}) { c.add('g5Sky', { style, a, life, fin: o.fin ?? 160, fout: o.fout ?? 320, ...o }); }
// ふる はね（白い 羽）
function feathers(c, d, { n = 8, cols = [WHITE, '#f0f4ff'], life = 900, y0 = -6, xs = null } = {}) {
  for (let i = 0; i < n; i++) {
    const fx0 = xs ? xs[i % xs.length] + rnd(-20, 20) : rnd(10, c.W - 10);
    c.add('g5Mark', { mark: 'feather', x0: fx0, y0: y0 - rnd(0, 20), x1: fx0 + rnd(-24, 24), y1: y0 + rnd(70, 110), travel: life - i * 40, ease: 'lin', s: rnd(2.6, 3.6), color: cols[i % cols.length], color2: '#c8d0e8', wobble: 0.6, rot: rnd(-0.5, 0.5), delay: d + i * 40, life: life - 40 - i * 40, fout: 260, pop: false });
  }
}
// 味方の 回復の ひかり（下に）
function healGlow(c, t, d, { col = '#7dffb0', cols = [WHITE, '#c8ffe0', '#7dffb0'], up = true } = {}) {
  c.fx.glow(t.x, t.y - 6, { color: col, r: 22 * c.sz, delay: d, life: 520, alpha: 0.9 });
  c.k.shockwave(t.x, t.y + 6, { r0: 4, r1: 26, sy: 0.32, color: col, w: 1.6, delay: d, life: 420 });
  c.k.shapes(t.x, t.y, { shape: 'twinkle', n: 6, colors: cols, speed: 26, ang: -Math.PI / 2, spread: 0.7, g: -30, size: 2.8, delay: d + 40, life: 560 });
  if (up) arrows(c, t.x, t.y - 4, col, true, 2, d + 80);
}
// 出どころ（味方は 画面の 下の その 人の 上、敵は え の まん中）
const src = (c, dy = 14) => ({ x: c.from.x, y: c.fromAlly ? c.from.y - dy : c.from.y - 6 });
// 2点の あいだを まがって とぶ ときの まがりの てん
const bend = (a, b, k = 0.35) => ({ cx: (a.x + b.x) / 2 - (b.y - a.y) * k, cy: (a.y + b.y) / 2 + (b.x - a.x) * k });

// ───────────── え ─────────────
const defs = {
  // ── 美少女戦士 ──
  // ハイヒールキック: ピンクの リボンを ひく 回しげり → ハートと 星
  ax_highheel_kick: {
    charge: { color: PINK, color2: GOLD2 }, sfx: 'ax_g5_kick', allyFx: 'claw',
    play(fx, c) {
      const o = src(c);
      c.each((t, i, d) => {
        c.k.dash(o.x, o.y, t.x - 12, t.y + 4, { color: PINK, travel: c.hit - 100, w: 4, delay: d });
        c.k.crescent(t.x - 4, t.y - 2, { r: 24 * c.sz, a0: -2.8, a1: 0.5, w: 7, color: PINK2, glow: PINK, core: WHITE, delay: d + c.hit - 110, swing: 150, life: 420, after: 4 });
        c.add('g5Link', { x0: t.x - 30 * c.sz, y0: t.y + 10, x1: t.x + 24 * c.sz, y1: t.y - 14, bow: 18, col: PINK, w: 3, grow: 160, delay: d + c.hit - 120, life: 520 });
        c.add('g5Mark', { mark: 'boot', x0: t.x + 20 * c.sz, y0: t.y - 10, s: 6 * c.sz, color: RED, glow: PINK, rot: -0.7, delay: d + c.hit - 40, life: 300, fout: 120 });
        burst(c, t, d + c.hit, { glow: PINK, cols: MOON_COLS, heavy: i === 0, stars: 8 });
        c.k.shapes(t.x, t.y - 6, { shape: 'heart', n: 8, colors: [PINK, PINK2, '#ff4a9a'], speed: 80, size: 3, delay: d + c.hit + 40, life: 460, add: false });
        dust(c, t.x, t.y - 10, d + c.hit + 120, { n: 8, cols: [WHITE, PINK2], life: 380 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, PINK2, GOLD2] });
    },
  },
  // タキシードキック: 黒い マント（赤い うら）の 弧 → 白い 星
  ax_tuxedo_kick: {
    charge: { color: RED, color2: WHITE }, sfx: 'ax_g5_cape', allyFx: 'claw',
    play(fx, c) {
      const o = src(c);
      c.each((t, i, d) => {
        c.k.dash(o.x, o.y, t.x - 10, t.y + 4, { color: '#ff4a6a', travel: c.hit - 100, w: 4, delay: d });
        c.add('g5Cape', { x: t.x - 6, y: t.y + 2, r: 30 * c.sz, a0: -2.6, a1: 0.6, swing: 200, sy: 0.8, delay: d + c.hit - 160, life: 460 });
        c.k.crescent(t.x - 4, t.y - 2, { r: 22 * c.sz, a0: -2.6, a1: 0.4, w: 5, color: WHITE, glow: '#ff4a6a', core: WHITE, delay: d + c.hit - 80, swing: 120, life: 360, after: 3 });
        burst(c, t, d + c.hit, { glow: '#ff6a8a', cols: TUX_COLS, heavy: i === 0, stars: 12 });
        c.k.shapes(t.x, t.y - 8, { shape: 'star', n: 6, colors: [WHITE], speed: 60, size: 3.4, delay: d + c.hit + 80, life: 420 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2] });
    },
  },
  // メイクアップ！: リボンが らせんで からだを まき、三日月の 光・きらきら → 光が はじけて 決めポーズの 星
  ax_makeup: {
    charge: { color: PINK, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_makeup', allyFx: 'up',
    play(fx, c) {
      const t = c.t;
      const end = c.len - 40;
      c.add('g5Moon', { x: t.x, y: t.y - 74, r: 12, phase: 'crescent', rot: -Math.PI / 2, color: GOLD, glow: GOLD2, rise: 260, dy: 24, life: end, alpha: 0.95 });
      c.add('g5Ribbon', { x: t.x, y: t.y + 10, r: 16, h: 74, turns: 2.2, cols: [PINK, WHITE], w: 4, grow: c.hit, len: 0.9, life: c.hit + 220 });
      c.add('g5Ribbon', { x: t.x, y: t.y + 10, r: 16, h: 74, turns: 2.2, phase: Math.PI, cols: [WHITE, PINK2], w: 3, grow: c.hit, len: 0.9, life: c.hit + 220 });
      c.add('g5Ribbon', { x: t.x, y: t.y + 6, r: 22, h: 50, turns: 1.4, phase: 1.2, cols: [GOLD, GOLD2], w: 2, grow: c.hit, len: 0.6, life: c.hit + 180 });
      for (let k = 0; k < 5; k++) c.fx.twinkle(t.x + rnd(-24, 24), t.y - rnd(10, 70), { color: k % 2 ? GOLD2 : WHITE, size: rnd(3, 5), delay: k * 70, life: 340 });
      c.k.gather(t.x, t.y - 34, { colors: [WHITE, PINK2, GOLD2], n: 14, r: 50, waves: 2, gap: 140, life: 260 });
      // 光が はじける
      c.fx.flashAt(120, '#ffe8fa', c.hit);
      c.fx.glow(t.x, t.y - 34, { color: PINK2, r: 46, delay: c.hit, life: 420, alpha: 1 });
      c.k.shockwave(t.x, t.y - 34, { r0: 8, r1: 80, color: PINK, w: 2.6, n: 2, gap: 90, delay: c.hit, life: 420 });
      c.k.shapes(t.x, t.y - 34, { shape: 'star', n: 14, colors: [GOLD, WHITE, PINK2], speed: 120, size: 3, delay: c.hit, life: 440 });
      c.k.shapes(t.x, t.y - 34, { shape: 'heart', n: 6, colors: [PINK, PINK2], speed: 70, size: 3, delay: c.hit + 40, life: 400, add: false });
      // 決めポーズの 大きな 星
      c.add('g5Mark', { mark: 'star', x0: t.x + 16, y0: t.y - 48, s: 9, color: GOLD, rim: WHITE, glow: GOLD2, spin: 2, delay: c.hit + 60, life: end - c.hit - 60, fout: 200 });
      arrows(c, t.x, t.y - 4, PINK, true, 3, c.hit + 80);
      sparkleFill(c, c.hit, t.x, t.y - 34, { cols: [WHITE, PINK2, GOLD2], r: 34, want: 70 });
    },
  },
  // 仮面のしんし: 黒い マントが ばさっと つつむ → 白い 仮面の きらり・赤い バラの 花びら → 月の 光
  ax_tuxedo_henshin: {
    charge: { color: RED, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_cape', allyFx: 'up',
    play(fx, c) {
      const t = c.t;
      const end = c.len - 40;
      c.add('g5Moon', { x: t.x, y: t.y - 76, r: 13, phase: 'full', color: '#fff6dc', glow: '#fff0c0', rise: 300, life: end, alpha: 0.95 });
      c.add('g5Cape', { x: t.x, y: t.y - 22, r: 34, a0: Math.PI * 0.5, a1: Math.PI * 1.45, swing: c.hit - 40, sy: 1.15, life: c.hit + 160 });
      c.add('g5Cape', { x: t.x, y: t.y - 22, r: 34, a0: Math.PI * 0.5, a1: -Math.PI * 0.45, swing: c.hit - 40, sy: 1.15, life: c.hit + 160 });
      c.add('g5Mark', { mark: 'hat', x0: t.x, y0: t.y - 70, x1: t.x, y1: t.y - 44, travel: c.hit - 60, s: 7, delay: 80, life: end - 80, fout: 220, glow: '#ff6a8a' });
      c.add('g5Mark', { mark: 'mask', x0: t.x, y0: t.y - 32, s: 8, delay: c.hit - 20, life: end - c.hit, fout: 220, glow: WHITE });
      c.fx.flashAt(110, '#ffe0e8', c.hit);
      c.k.shockwave(t.x, t.y - 30, { r0: 8, r1: 70, color: '#ff6a8a', w: 2.4, n: 2, gap: 90, delay: c.hit, life: 420 });
      c.k.sparkles(t.x - 8, t.y - 32, { n: 3, colors: [WHITE], size: 9, delay: c.hit + 40, life: 300, r: 4 });
      for (let i = 0; i < 14; i++) c.fx.petal(t.x + rnd(-34, 34), t.y - rnd(20, 70), { color: [RED, RED2, '#c8102e'][i % 3], vx: rnd(-30, 30), vy: rnd(-20, 10), size: rnd(1.6, 2.4), delay: c.hit + rnd(0, 160), life: 440 });
      arrows(c, t.x, t.y - 4, RED2, true, 3, c.hit + 80);
      sparkleFill(c, c.hit, t.x, t.y - 34, { cols: [WHITE, RED2], r: 34, want: 70 });
    },
  },
  // 月にかわっておしおきよ！: 大きな 三日月の 帯 → 決めポーズの 星・ハートの 輪 → 見とれて 止まる（ハートの 目）
  ax_oshiokiyo: {
    charge: { color: PINK, color2: GOLD2 }, sfx: 'ax_g5_kiran', allyFx: 'bolt',
    play(fx, c) {
      const o = src(c, 20);
      const end = c.len - 40;
      // 画面を よこぎる 大きな 三日月
      c.k.crescent(c.center.x, c.center.y + 60, { r: 92, a0: -2.9, a1: -0.25, w: 14, color: GOLD2, glow: PINK, core: WHITE, swing: c.hit - 40, life: c.hit + 260, after: 3 });
      c.k.streaks({ ang: -0.35, color: PINK2, n: 20, life: c.hit + 200, alpha: 0.5 });
      c.add('g5Mark', { mark: 'star', x0: o.x, y0: o.y - 8, s: 8, color: GOLD, rim: WHITE, glow: PINK2, spin: 3, life: 520, fout: 200 });
      c.k.sparkles(o.x, o.y - 8, { n: 4, colors: [WHITE, GOLD2], size: 8, r: 10, life: 300 });
      c.each((t, i, d) => {
        burst(c, t, d + c.hit, { glow: PINK, cols: MOON_COLS, heavy: i === 0, stars: 6 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 6, r1: 26 * c.sz, n: 6, s: 3.2, cols: [PINK, '#ff4a9a', PINK2], delay: d + c.hit + 40, life: 520 });
        // ハートの 目（見とれて 止まる）
        for (const dx of [-5, 5]) c.add('g5Heart', { x0: t.x + dx * c.sz, y0: t.y - 18 * c.sz, s: 3.4, col: '#ff3a8a', beat: 0.25, delay: d + c.hit + 160, life: end - c.hit - 160 - d, fout: 160 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, PINK2, GOLD2] });
    },
  },
  // 月の光が見ているぞ！: 満月を 背に → 赤い バラが 1本 ささる・花びら → 下向きの やじるし
  ax_tsuki_no_hikari: {
    charge: { color: RED, color2: WHITE }, sfx: 'ax_g5_rose', allyFx: 'dark',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.35, end, '#040818');
      c.add('g5Moon', { x: c.W * 0.8, y: 30, r: 20, phase: 'full', rise: 300, life: end, alpha: 0.95 });
      const o = { x: c.W * 0.8, y: 34 };
      c.each((t, i, d) => {
        const p0 = { x: o.x - 8, y: o.y + 6 }, p1 = { x: t.x, y: t.y + 14 * c.sz };
        c.add('g5Rose', { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, travel: c.hit, s: 4.4, ease: 'in', stickAng: Math.PI / 2 + 0.25, delay: d, life: end - d, trail: '#ff4a6a' });
        burst(c, { x: t.x, y: t.y + 8 }, d + c.hit, { glow: '#ff4a6a', cols: TUX_COLS, heavy: i === 0, stars: 4, r: 12 });
        c.k.petals(t.x, t.y, { n: 10, colors: [RED, RED2, '#c8102e'], spread: 18, delay: d + c.hit + 20, life: 560 });
        arrows(c, t.x, t.y - 10, '#7a8aff', false, 2, d + c.hit + 160);
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2, MOONBLUE] });
    },
  },
  // 友情のきずな: 5色の リボンが 味方を つなぐ → 回復
  ax_yuujou_kizuna: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_ribbon', allyFx: 'heal',
    play(fx, c) {
      const top = { x: c.W / 2, y: 26 };
      const end = c.len - 40;
      c.add('g5Mark', { mark: 'star', x0: top.x, y0: top.y, s: 7, color: GOLD, rim: WHITE, glow: GOLD2, spin: 1.5, life: end, fout: 240 });
      KIZUNA.forEach((col, k) => {
        const t = c.targets[k % c.n];
        c.add('g5Link', { x0: top.x + (k - 2) * 6, y0: top.y + 4, x1: t.x + (k - 2) * 3, y1: t.y - 8, bow: -10 - k * 4, col, w: 3, grow: c.hit - 40, delay: k * 30, life: end - k * 30 });
      });
      for (let i = 0; i + 1 < c.n; i++) c.add('g5Link', { x0: c.targets[i].x, y0: c.targets[i].y - 10, x1: c.targets[i + 1].x, y1: c.targets[i + 1].y - 10, bow: 14, col: KIZUNA[i % 5], w: 2.6, grow: 200, delay: c.hit - 100, life: end - c.hit + 100 });
      c.each((t, i, d) => {
        c.add('g5Ribbon', { x: t.x, y: t.y + 6, r: 12, h: 30, turns: 1.4, cols: [KIZUNA[i % 5], WHITE], w: 2.2, grow: 300, len: 0.8, delay: d + c.hit - 100, life: 520 });
        healGlow(c, t, d + c.hit, { col: '#ffb0ec', cols: [WHITE, ...KIZUNA] });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 20, { cols: KIZUNA, r: 50, want: 60 });
    },
  },
  // シャボンスプレー: 水色の あわと 白い きりが 敵ぜんぶを つつむ → きりの 中で ふらふら
  ax_shabon_spray: {
    charge: { color: '#7ad8ff', color2: WHITE }, sfx: 'ax_g5_shabon', allyFx: 'ice',
    play(fx, c) {
      const o = src(c);
      const end = c.len - 40;
      c.each((t, i, d) => {
        const n = c.n > 2 ? 6 : 12;
        for (let k = 0; k < n; k++) {
          const tt = k * 22;
          c.add('g5Bubble', { x0: o.x + rnd(-6, 6), y0: o.y, x1: t.x + rnd(-18, 18) * c.sz, y1: t.y + rnd(-14, 12) * c.sz, travel: c.hit - tt + rnd(0, 120), r: rnd(2.5, 5) * c.sz, delay: d + tt, life: end - d - tt });
        }
        for (let k = 0; k < 4; k++) c.fx.puff(t.x + rnd(-14, 14), t.y + rnd(-8, 8), { color: '#e6f8ff', r0: 6, r1: 22 * c.sz, vx: rnd(-8, 8), vy: rnd(-6, 2), delay: d + c.hit - 60 + k * 50, life: end - c.hit - k * 50 - d, alpha: 0.45 });
        c.k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#9ae6ff', colors: ['#ffffff', '#bfeaff'], delay: d + c.hit });
        c.add('g5HeartRing', { x: t.x, y: t.y - 16 * c.sz, r0: 8, r1: 10, n: 3, s: 2.2, cols: ['#bfeaff', '#ffffff'], spinMs: 220, sy: 0.4, delay: d + c.hit + 120, life: end - c.hit - 120 - d });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ['#ffffff', '#bfeaff'], shape: 'circle' });
    },
  },
  // ムーン・ティアラ・アクション: ひたいの ティアラが ひかって はずれ → 金の 光の 円ばんが まわりながら 敵へ → 光の こな → 金の 星
  ax_moon_tiara: {
    charge: { color: GOLD, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_tiara', allyFx: 'bolt',
    play(fx, c) {
      const o = src(c, 18);
      const start = 160;
      c.each((t, i, d) => {
        const b = bend(o, t, i % 2 ? -0.6 : 0.6);
        c.add('g5Tiara', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start, travel: c.hit - start, r: 14 * c.sz, color: GOLD, glow: GOLD2, core: '#fffbe8', tilt: -0.25, delay: d, life: c.hit + 60, ease: 'lin' });
        for (let s = 0; s < 6; s++) {
          const k = (s + 1) / 7;
          const u = 1 - k;
          const px = u * u * o.x + 2 * u * k * b.cx + k * k * t.x, py = u * u * o.y + 2 * u * k * b.cy + k * k * t.y;
          c.fx.twinkle(px, py, { color: s % 2 ? GOLD2 : WHITE, size: 4, delay: d + start + (c.hit - start) * k, life: 360, vy: 12 });
        }
        burst(c, t, d + c.hit, { glow: GOLD, cols: [WHITE, GOLD2, GOLD], heavy: i === 0, stars: 12, ring: 52 });
        c.add('g5Mark', { mark: 'star', x0: t.x, y0: t.y - 4, s: 8 * c.sz, color: GOLD, rim: WHITE, glow: GOLD2, spin: 4, delay: d + c.hit + 40, life: 420, fout: 200 });
        dust(c, t.x, t.y, d + c.hit + 60, { n: 16, cols: [WHITE, GOLD2, GOLD], r: 24, life: 460, fall: 24 });
      });
      c.fx.glow(o.x, o.y, { color: GOLD2, r: 22, life: 260, alpha: 1 });
      c.k.sparkles(o.x, o.y, { n: 3, colors: [WHITE], size: 9, r: 3, life: 260 });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, GOLD2, GOLD] });
    },
  },
  // ローズ・ブーメラン: 光る 赤い バラが 光の 輪を ひいて 弧を えがいて 敵へ → もどる → 赤い 花びら
  ax_rose_boomerang: {
    charge: { color: RED, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_rose', allyFx: 'claw',
    play(fx, c) {
      const o = src(c, 18);
      const back = 380;
      c.each((t, i, d) => {
        const b = bend(o, t, 0.42);
        c.add('g5Tiara', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start: 40, travel: c.hit - 40, back, hold: 30, r: 9 * c.sz, color: '#ff3a5a', glow: '#ff8aa0', core: '#ffd0d8', gem: RED, tilt: 0.3, delay: d, life: c.hit + back + 60, ease: 'lin' });
        c.add('g5Rose', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, travel: c.hit, s: 3 * c.sz, spin: 14, delay: d, life: c.hit + 20, trail: '#ff4a6a' });
        const rb = bend(t, o, 0.42);
        c.add('g5Rose', { x0: t.x, y0: t.y, x1: o.x, y1: o.y, ...rb, travel: back, s: 3 * c.sz, spin: 14, delay: d + c.hit + 30, life: back - 20, trail: '#ff4a6a' });
        c.k.slash(t.x, t.y, { r: 22 * c.sz, w: 5, ang: -0.6, color: WHITE, glow: '#ff4a6a', delay: d + c.hit - 40, life: 300 });
        burst(c, t, d + c.hit, { glow: '#ff4a6a', cols: TUX_COLS, heavy: i === 0, stars: 6 });
        c.k.petals(t.x, t.y, { n: 14, colors: [RED, RED2, '#c8102e'], spread: 22, delay: d + c.hit + 20, life: 520 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2] });
    },
  },
  // シャイン・アクア・イリュージョン: 青い 水の 帯が うずを まいて 敵ぜんぶへ → 白く こおる → くだける
  ax_aqua_illusion: {
    charge: { color: '#4ab8ff', color2: '#e0f4ff' }, sfx: 'ax_g5_aqua', allyFx: 'ice',
    play(fx, c) {
      const o = src(c);
      const end = c.len - 40;
      c.each((t, i, d) => {
        c.k.wave(o.x, o.y, t.x, t.y, { span: 36 * c.sz, h: 10, travel: c.hit, delay: d, life: c.hit + 160, splash: false });
        c.add('g5Ribbon', { x: t.x, y: t.y + 14, r: 18 * c.sz, h: 34, turns: 1.6, cols: ['#4ab8ff', '#bfeaff'], w: 3, grow: 280, len: 0.8, delay: d + c.hit - 160, life: 460 });
        c.add('g5Shards', { x: t.x, y: t.y + 14 * c.sz, w: 30 * c.sz, h: 34 * c.sz, n: 5, grow: 140, delay: d + c.hit + 40, life: 420, fout: 120 });
        c.k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#9ae6ff', colors: ['#ffffff', '#9ae6ff'], delay: d + c.hit, heavy: i === 0 });
        c.k.shapes(t.x, t.y, { shape: 'flake', n: 6, colors: ['#ffffff', '#bfeaff'], speed: 60, size: 3.2, delay: d + c.hit + 60, life: 480 });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 6 : 12, colors: ['#e6f8ff', '#9ae6ff', '#ffffff'], speed: 120, ang: -Math.PI / 2, spread: 1.2, g: 340, size: 2.2, delay: d + c.hit + 300, life: 360 });
        for (let k = 0; k < 8; k++) c.fx.drop(t.x + rnd(-10, 10), t.y + 6, { color: ['#2a78d8', '#6ac8ff', '#eaf8ff'][k % 3], vx: rnd(-110, 110), vy: rnd(-180, -60), g: 380, size: rnd(1.1, 2), delay: d + c.hit, life: 420 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ['#ffffff', '#bfeaff'] });
      void end;
    },
  },
  // 氷のバラふぶき: 白い バラの 花びらの ふぶき → 敵が こおる
  ax_koori_bara_fubuki: {
    charge: { color: '#bfeaff', color2: WHITE }, sfx: 'ax_g5_aqua', allyFx: 'ice',
    play(fx, c) {
      const o = src(c);
      const ang = Math.atan2(c.center.y - o.y, c.center.x - o.x);
      c.k.streaks({ ang, color: '#e6f8ff', n: 30, life: c.hit + 260, alpha: 0.55 });
      c.each((t, i, d) => {
        for (let k = 0; k < 3; k++) c.add('g5Rose', { x0: o.x + (k - 1) * 14, y0: o.y, x1: t.x + (k - 1) * 10, y1: t.y + 4, travel: c.hit - k * 30, s: 2.6 * c.sz, col: '#f4fbff', dark: '#9ac8e8', glow: '#bfeaff', trail: '#bfeaff', spin: 10, delay: d + k * 30, life: c.hit + 10 - k * 30 });
        for (let k = 0; k < 10; k++) c.fx.petal(lerp(o.x, t.x, k / 10) + rnd(-16, 16), lerp(o.y, t.y, k / 10) + rnd(-10, 10), { color: k % 2 ? '#ffffff' : '#d8f0ff', vx: (t.x - o.x) * 0.4, vy: (t.y - o.y) * 0.4, size: rnd(1.6, 2.4), delay: d + k * 22, life: 460 });
        c.add('g5Shards', { x: t.x, y: t.y + 14 * c.sz, w: 28 * c.sz, h: 30 * c.sz, n: 5, grow: 140, delay: d + c.hit + 20, life: 480, fout: 140 });
        c.k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#bfeaff', colors: ['#ffffff', '#bfeaff'], delay: d + c.hit, heavy: i === 0 });
        c.k.shapes(t.x, t.y, { shape: 'flake', n: 6, colors: ['#ffffff', '#bfeaff'], speed: 60, size: 3, delay: d + c.hit + 60, life: 460 });
        c.k.shapes(t.x, t.y, { shape: 'petal', n: c.n > 2 ? 5 : 10, colors: ['#e6f8ff', '#9ae6ff', '#ffffff'], speed: 110, ang: -Math.PI / 2, spread: 1.2, g: 300, size: 2.2, delay: d + c.hit + 300, life: 360 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ['#ffffff', '#bfeaff'] });
    },
  },

  // ── セーラームーン（超級） ──
  // ムーンスティック: 杖の 先の 三日月が ひかって くるくる → 金白の 三日月の 波が 敵へ → 光の はしら
  ax_moon_stick: {
    charge: { color: GOLD, color2: PINK2, power: 1.1 }, sfx: 'ax_g5_wand', allyFx: 'bolt',
    play(fx, c) {
      const o = src(c, 30);
      const end = c.len - 40;
      darken(c, 0.38, c.hit + 300);
      c.add('g5Wand', { x0: o.x, y0: o.y + 8, s: 6.5, variant: 'moon', rot: -0.2, spin: 6, glow: GOLD2, life: c.hit + 180 });
      c.k.gather(o.x, o.y - 4, { colors: [WHITE, GOLD2, PINK2], n: 16, r: 46, waves: 2, gap: 100, life: 200 });
      c.each((t, i, d) => {
        for (let k = 0; k < 3; k++) c.add('g5MoonWave', { x0: o.x, y0: o.y - 6, x1: t.x, y1: t.y, start: 60 + k * 50, travel: c.hit - 60 - k * 40, s: (10 - k * 2) * c.sz, col: k ? GOLD2 : WHITE, glow: k === 1 ? PINK : GOLD, delay: d, life: c.hit + 80 });
        c.k.beam(o.x, o.y - 6, t.x, t.y, { w: 4 * c.sz, color: GOLD2, glow: PINK2, core: WHITE, delay: d + 60, life: c.hit + 120, grow: c.hit - 60, burst: false, streaks: true, alpha: 0.7 });
        c.k.pillar(t.x, t.y + 10, { w: 12 * c.sz, color: GOLD2, glow: WHITE, delay: d + c.hit, life: 460 });
        burst(c, t, d + c.hit, { glow: GOLD, cols: MOON_COLS, heavy: i === 0, stars: 12, ring: 56 });
        c.add('g5Mark', { mark: 'crescent', x0: t.x, y0: t.y - 4, s: 10 * c.sz, color: GOLD, glow: GOLD2, crot: -0.4, delay: d + c.hit + 40, life: 420, fout: 200 });
        dust(c, t.x, t.y - 10, d + c.hit + 140, { n: 16, cols: [WHITE, GOLD2, PINK2], r: 26, life: end - c.hit - 240 });
      });
      c.fx.flashAt(90, '#fff6d0', c.hit);
      c.k.shake(320, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, GOLD2, PINK2] });
    },
  },
  // ステッキさばき: ステッキが くるりと まわって 月光の 弧で 打つ → 白い 星
  ax_stick_sabaki: {
    charge: { color: RED, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_smasher', allyFx: 'claw',
    play(fx, c) {
      const o = src(c, 30);
      const end = c.len - 40;
      darken(c, 0.4, end, '#040818');
      c.add('g5Moon', { x: c.W * 0.78, y: 28, r: 18, phase: 'full', rise: 300, life: end, alpha: 0.9 });
      c.add('g5Wand', { x0: o.x, y0: o.y + 6, x1: c.t.x - 18, y1: c.t.y + 10, travel: c.hit - 80, s: 6, variant: 'cane', spin: 16, glow: MOONBLUE, life: c.hit + 120 });
      c.each((t, i, d) => {
        c.k.crescent(t.x, t.y, { r: 26 * c.sz, a0: -2.6, a1: 0.7, w: 8, color: MOONBLUE, glow: '#7a9aff', core: WHITE, delay: d + c.hit - 100, swing: 140, life: 420, after: 4 });
        c.k.crescent(t.x, t.y, { r: 22 * c.sz, a0: 0.9, a1: -2.2, w: 6, color: WHITE, glow: '#7a9aff', core: WHITE, delay: d + c.hit + 80, swing: 120, life: 380, after: 3 });
        burst(c, t, d + c.hit, { glow: MOONBLUE, cols: [WHITE, MOONBLUE, '#fff6dc'], heavy: i === 0, stars: 14, ring: 50 });
        c.k.shapes(t.x, t.y - 6, { shape: 'star', n: 8, colors: [WHITE], speed: 70, size: 3.6, delay: d + c.hit + 160, life: 480 });
        dust(c, t.x, t.y, d + c.hit + 200, { n: 10, cols: [WHITE, MOONBLUE], life: 420 });
      });
      c.k.shake(340, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, MOONBLUE] });
    },
  },
  // タキシード仮面のバラ: 画面の そとから 赤い バラが ヒュッと とんで 敵の 前に ささる・花びら → 止まる
  ax_tuxedo_bara: {
    charge: { color: PINK, color2: WHITE }, sfx: 'ax_g5_rose', allyFx: 'claw',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.35, end, '#040818');
      c.add('g5Moon', { x: 30, y: 26, r: 17, phase: 'full', rise: 260, life: end, alpha: 0.9 });
      c.add('g5Mark', { mark: 'mask', x0: 46, y0: 48, s: 9, glow: WHITE, delay: 0, life: c.hit + 200, fout: 200 });
      c.k.sparkles(40, 47, { n: 3, colors: [WHITE], size: 10, r: 3, delay: 80, life: 280 });
      c.each((t, i, d) => {
        const p0 = { x: -10, y: 16 + i * 6 }, p1 = { x: t.x - 6 * c.sz, y: t.y + 16 * c.sz };
        c.add('g5Rose', { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, travel: c.hit, ease: 'in', s: 4.4 * c.sz, stickAng: Math.atan2(p1.y - p0.y, p1.x - p0.x), delay: d, life: end - d, trail: '#ff4a6a' });
        c.k.streaks({ ang: Math.atan2(p1.y - p0.y, p1.x - p0.x), color: '#ff8aa0', n: 10, delay: d, life: c.hit + 80, alpha: 0.4 });
        burst(c, { x: t.x, y: t.y + 10 }, d + c.hit, { glow: '#ff4a6a', cols: TUX_COLS, heavy: i === 0, stars: 6, r: 14 });
        c.k.petals(t.x, t.y + 6, { n: 16, colors: [RED, RED2, '#c8102e'], spread: 20, delay: d + c.hit, life: 600 });
        c.add('g5HeartRing', { x: t.x, y: t.y - 18 * c.sz, r0: 9, r1: 11, n: 3, s: 2, cols: [WHITE, '#ffd0e0'], spinMs: 240, sy: 0.4, delay: d + c.hit + 160, life: end - c.hit - 160 - d });
      });
      c.k.shake(300, 2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2] });
    },
  },
  // 赤いバラの一撃: むねの 赤い バラを なげる（光の すじ）→ ささって 花びら
  ax_aka_bara: {
    charge: { color: RED, color2: WHITE }, sfx: 'ax_g5_rose', allyFx: 'claw',
    play(fx, c) {
      const o = src(c, 22);
      const end = c.len - 40;
      darken(c, 0.32, c.hit + 400, '#140410');
      c.each((t, i, d) => {
        c.add('g5Rose', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, travel: c.hit, ease: 'in', s: 4.6 * c.sz, stickAng: Math.atan2(t.y - o.y, t.x - o.x), delay: d, life: c.hit + 320, trail: '#ff2a4a', glow: '#ff2a4a' });
        c.k.beam(o.x, o.y, t.x, t.y, { w: 2.4, color: '#ff4a6a', glow: '#ff8aa0', core: WHITE, delay: d, life: c.hit + 100, grow: c.hit, burst: false, streaks: false, alpha: 0.6 });
        burst(c, t, d + c.hit, { glow: '#ff2a4a', cols: TUX_COLS, heavy: i === 0, stars: 10, r: 18, ring: 54 });
        c.k.speedLines(t.x, t.y, { delay: d + c.hit, life: 260, r1: 120, color: '#ffd0d8' });
        for (let k = 0; k < 3; k++) c.k.petals(t.x, t.y, { n: 8, colors: [RED, RED2, '#c8102e'], spread: 20 + k * 10, delay: d + c.hit + k * 100, life: end - c.hit - k * 100 - 120 });
      });
      c.k.shake(320, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2] });
    },
  },
  // ルナのはげまし: 黒ねこの かげ（ひたいに 金の 三日月）が ぴょん → 金の 光
  ax_luna_hagemashi: {
    charge: { color: GOLD, color2: WHITE }, sfx: 'ax_g5_luna', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40;
      c.add('g5Mark', { mark: 'cat', x0, y0: 104, x1, y1: 104, hop: 58, travel: c.hit + 200, ease: 'lin', s: 9, glow: GOLD2, life: c.hit + 300, fout: 160 });
      c.add('g5Moon', { x: c.W / 2, y: 28, r: 11, phase: 'crescent', rot: -0.6, color: GOLD, glow: GOLD2, rise: 260, life: end, alpha: 0.9 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 6, color: GOLD2, glow: WHITE, delay: d + c.hit - 60, life: 420, burst: false, alpha: 0.7 });
        healGlow(c, t, d + c.hit, { col: GOLD, cols: [WHITE, GOLD2, GOLD] });
        arrows(c, t.x, t.y - 14, GOLD, true, 2, d + c.hit + 120);
      });
      for (let k = 0; k < 8; k++) c.fx.twinkle(lerp(x0, x1, k / 8), 70 + Math.sin(k) * 10, { color: k % 2 ? GOLD2 : WHITE, size: 4, delay: 60 + k * 50, life: 360 });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 20, { cols: [WHITE, GOLD2], r: 50, want: 80 });
    },
  },
  // ムーン・ヒーリング・エスカレーション: 金の 三日月の 杖 → 金と ピンクの 光の 帯が 味方を つつむ・羽 → 回復
  ax_moon_healing: {
    charge: { color: GOLD, color2: PINK2, power: 1.1 }, sfx: 'ax_g5_heal', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      const top = { x: c.W / 2, y: 34 };
      c.add('g5Moon', { x: top.x, y: top.y - 6, r: 16, phase: 'crescent', rot: -Math.PI / 2, color: GOLD, glow: GOLD2, rise: 300, life: end, alpha: 0.9 });
      c.add('g5Wand', { x0: top.x, y0: top.y + 22, s: 7, variant: 'moon', rot: 0, glow: GOLD2, life: c.hit + 360 });
      c.add('g5Curtain', { cols: [GOLD2, PINK2, WHITE], n: 14, grow: c.hit, reach: 1, life: end });
      c.add('g5Wave', { y0: c.H + 10, y1: c.H - 46, cols: [GOLD2, PINK2, WHITE], travel: c.hit + 120, amp: 4, alpha: 0.26, delay: 80, life: end - 80 });
      c.each((t, i, d) => {
        c.add('g5Ribbon', { x: t.x, y: t.y + 10, r: 14, h: 44, turns: 1.8, cols: [GOLD, PINK2], w: 2.6, grow: 380, len: 0.8, delay: d + c.hit - 200, life: 620 });
        healGlow(c, t, d + c.hit, { col: '#ffd8a8', cols: [WHITE, GOLD2, PINK2] });
      });
      feathers(c, c.hit - 100, { n: 8, life: end - c.hit + 60, xs: c.targets.map((t) => t.x) });
      c.k.gather(top.x, top.y + 6, { colors: [WHITE, GOLD2], n: 12, r: 40, life: 260 });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: [WHITE, GOLD2, PINK2], r: 60, want: 110 });
    },
  },
  // いやしのバラ: 赤い バラの 花びらが 味方に ふりそそぐ → 回復
  ax_iyashi_bara: {
    charge: { color: RED, color2: WHITE }, sfx: 'ax_g5_heal', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      c.add('g5Moon', { x: c.W * 0.8, y: 26, r: 15, phase: 'full', rise: 300, life: end, alpha: 0.85 });
      c.add('g5Mark', { mark: 'rose', x0: c.W / 2, y0: 34, s: 12, color: RED, glow: '#ff6a8a', spin: 0.8, life: end, fout: 260 });
      c.k.sparkles(c.W / 2, 34, { n: 6, colors: [WHITE, '#ffd0d8'], size: 6, r: 14, life: 340 });
      c.each((t, i, d) => {
        for (let k = 0; k < 10; k++) c.fx.petal(t.x + rnd(-26, 26), rnd(30, 70), { color: [RED, RED2, '#c8102e', '#ffd0d8'][k % 4], vx: rnd(-12, 12), vy: rnd(40, 70), size: rnd(1.8, 2.6), delay: d + k * 40, life: end - k * 40 - d - 60 });
        healGlow(c, t, d + c.hit, { col: '#ff9ab0', cols: [WHITE, '#ffd0d8', RED2] });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 20, { cols: [WHITE, '#ffd0d8', RED2], r: 60, want: 100 });
    },
  },
  // 銀水しょうのいのり: 銀の クリスタルが ひかり、白い 光の はしら → 羽（生き返り）
  ax_ginzuishou_inori: {
    charge: { color: SILVER, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_crystal', allyFx: 'revive',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.25, end, '#0a0a24');
      c.each((t, i, d) => {
        c.add('g5Crystal', { x0: t.x, y0: t.y - 60, x1: t.x, y1: t.y - 50, travel: c.hit, s: 10, grow: 360, delay: d, life: end - d });
        c.k.gather(t.x, t.y - 50, { colors: [WHITE, SILVER, SILVER2], n: 14, r: 46, waves: 2, gap: 120, delay: d, life: 260 });
        c.k.pillar(t.x, t.y + 8, { w: 10, color: SILVER, glow: SILVER2, core: WHITE, delay: d + c.hit - 40, life: 520 });
        c.k.shockwave(t.x, t.y + 6, { r0: 6, r1: 50, sy: 0.35, color: SILVER2, w: 2, n: 2, gap: 120, delay: d + c.hit, life: 420 });
        healGlow(c, t, d + c.hit, { col: WHITE, cols: [WHITE, SILVER, '#fff6dc'] });
      });
      feathers(c, c.hit - 200, { n: 8, life: end - c.hit + 160, xs: c.targets.map((t) => t.x) });
      sparkleFill(c, c.hit, c.t.x, c.t.y - 40, { cols: [WHITE, SILVER], r: 40, want: 100 });
    },
  },
  // ムーン・プリンセス・ハレーション: 杖の 先の ハートと 三日月 → ピンク・金・白の 大きな 光の 波が 敵ぜんぶを つつむ → 白フラッシュ → 羽と きらきら
  ax_moon_princess_halation: {
    charge: { color: PINK, color2: GOLD2, power: 1.2 }, sfx: 'ax_g5_halation', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      const o = c.fromAlly ? { x: c.W / 2, y: 40 } : { x: c.from.x, y: c.from.y - 30 };
      darken(c, 0.42, end, '#1a0420');
      c.k.streaks({ ang: -0.3, color: PINK2, n: 26, life: c.hit + 300, alpha: 0.45 });
      c.k.streaks({ ang: -0.3, color: GOLD2, n: 14, delay: 60, life: c.hit + 240, alpha: 0.4 });
      c.add('g5Wand', { x0: o.x, y0: o.y + 14, s: 10, variant: 'heart', glow: PINK2, life: c.hit + 300 });
      c.add('g5Moon', { x: o.x, y: o.y - 2, r: 25, phase: 'crescent', rot: -Math.PI / 2, color: GOLD2, glow: GOLD, life: c.hit + 360, alpha: 0.7 });
      c.k.gather(o.x, o.y - 4, { colors: [WHITE, PINK2, GOLD2], n: 18, r: 56, waves: 2, gap: 110, life: 220 });
      const y1 = c.fromAlly ? Math.min(...c.targets.map((t) => t.y)) - 34 : Math.max(...c.targets.map((t) => t.y)) - 40;
      if (c.fromAlly) c.add('g5Wave', { y0: c.H + 14, y1, cols: [PINK, GOLD, PINK2], body: '#ff8ae0', travel: c.hit + 160, amp: 6, gap: 12, alpha: 0.36, life: end, fout: 400 });
      else c.add('g5Curtain', { cols: [PINK, GOLD2, WHITE], n: 16, grow: c.hit, reach: 1, life: end });
      c.each((t, i, d) => {
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 30 * c.sz, r1: 8, n: 6, s: 3, cols: [PINK, PINK2, GOLD], spinMs: 300, delay: d + c.hit - 220, life: 360 });
        burst(c, t, d + c.hit, { glow: PINK, cols: MOON_COLS, heavy: i === 0, stars: 10, ring: 60, shape: 'heart' });
        c.k.pillar(t.x, t.y + 8, { w: 10 * c.sz, color: PINK2, glow: PINK, delay: d + c.hit + 40, life: 420, burst: false, alpha: 0.5 });
        c.k.shapes(t.x, t.y, { shape: 'star', n: 8, colors: [GOLD, WHITE], speed: 90, size: 2.6, delay: d + c.hit + 120, life: 480 });
      });
      c.fx.flashAt(160, '#ffffff', c.hit);
      c.k.shake(400, 2.6, c.hit);
      feathers(c, c.hit + 100, { n: 8, life: end - c.hit - 120 });
      c.at(c.hit + 200, () => dust(c, c.center.x, c.center.y, 0, { n: 30, cols: [WHITE, PINK2, GOLD2], r: 90, life: end - c.hit - 400 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, PINK2, GOLD2], r: 40 });
    },
  },
  // タキシード・ラ・スマッシャー: 月を 背に ステッキから 白い 三日月の 光の 波が 連続で → 白い 爆発 → 赤い 花びら
  ax_tuxedo_la_smasher: {
    charge: { color: RED, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_smasher', allyFx: 'claw',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 30);
      darken(c, 0.44, end, '#030616');
      c.add('g5Moon', { x: c.W / 2, y: 30, r: 26, phase: 'full', rise: 260, life: end, alpha: 0.85 });
      c.k.streaks({ ang: 0, color: MOONBLUE, n: 18, life: c.hit + 200, alpha: 0.35 });
      c.add('g5Wand', { x0: o.x, y0: o.y + 8, s: 6.5, variant: 'cane', rot: 0.5, glow: MOONBLUE, life: c.hit + 300 });
      c.each((t, i, d) => {
        for (let k = 0; k < 4; k++) c.add('g5MoonWave', { x0: o.x, y0: o.y - 8, x1: t.x, y1: t.y, start: k * 70, travel: c.hit - 40, s: 11 * c.sz, col: WHITE, glow: k % 2 ? MOONBLUE : '#ff8aa0', delay: d, life: c.hit + k * 70 + 40 });
        for (let k = 0; k < 3; k++) burst(c, t, d + c.hit + k * 70, { glow: MOONBLUE, cols: [WHITE, MOONBLUE, '#ffd0d8'], heavy: i === 0 && k === 0, stars: 6, ring: 40 + k * 10 });
        c.k.explosion(t.x, t.y, { r: 20 * c.sz, pal: { main: WHITE, glow: MOONBLUE, core: WHITE, list: [WHITE, MOONBLUE, '#fff6dc'] }, delay: d + c.hit + 220, heavy: i === 0, smoke: '#a8b0d0' });
        c.k.petals(t.x, t.y, { n: 12, colors: [RED, RED2, '#c8102e'], spread: 26, delay: d + c.hit + 300, life: end - c.hit - 360 - d });
      });
      c.fx.flashAt(140, '#ffffff', c.hit + 220);
      c.k.shake(420, 2.8, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, MOONBLUE] });
    },
  },
  // ムーン・スパイラル・ハート・アタック: 杖を まわして ハートの 光が らせんを えがいて 敵へ → 大きな ハートの 爆発 → ハートの 雨
  ax_spiral_heart: {
    charge: { color: PINK, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_spiral', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 30);
      darken(c, 0.4, end, '#1a0420');
      c.add('g5Wand', { x0: o.x, y0: o.y + 8, s: 7, variant: 'heart', spin: 10, glow: PINK2, life: c.hit + 160 });
      c.each((t, i, d) => {
        const n = c.n > 2 ? 4 : 7;
        for (let k = 0; k < n; k++) {
          const side = k % 2 ? 1 : -1;
          const b = bend(o, t, side * (0.25 + 0.12 * (k >> 1)));
          c.add('g5Heart', { x0: o.x, y0: o.y - 6, x1: t.x, y1: t.y, ...b, start: k * 30, travel: c.hit - k * 30, s: (4.6 - k * 0.3) * c.sz, col: k % 3 === 2 ? '#ff4a9a' : PINK, rot: 0, delay: d, life: c.hit + 20, ease: 'lin' });
        }
        c.add('g5Heart', { x0: t.x, y0: t.y, s: 10 * c.sz, col: PINK, glow: PINK2, grow: 260, growTo: 1.4, beat: 0.15, delay: d + c.hit, life: 440, fout: 220 });
        burst(c, t, d + c.hit, { glow: PINK, cols: MOON_COLS, heavy: i === 0, stars: 6, ring: 64, shape: 'heart' });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 8, r1: 46 * c.sz, n: 8, s: 3, cols: [PINK, PINK2, '#ff4a9a'], delay: d + c.hit + 60, life: 520 });
        for (let k = 0; k < (c.n > 2 ? 5 : 10); k++) c.add('g5Heart', { x0: t.x + rnd(-30, 30), y0: t.y - 60 - rnd(0, 30), x1: t.x + rnd(-30, 30), y1: t.y + 20, travel: 520, ease: 'lin', s: rnd(2, 3.2), col: [PINK, PINK2, '#ff4a9a'][k % 3], rim: null, beat: 0, delay: d + c.hit + 200 + k * 30, life: end - c.hit - 220 - k * 30 - d, fout: 200 });
      });
      c.fx.flashAt(120, '#ffe0f4', c.hit);
      c.k.shake(380, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, PINK2], shape: 'heart' });
    },
  },
  // ローズ・スパイラル・アタック: 赤い 光の らせん（花びら）→ 爆発
  ax_rose_spiral: {
    charge: { color: RED, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_spiral', allyFx: 'claw',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 24);
      darken(c, 0.4, end, '#140410');
      c.each((t, i, d) => {
        const n = c.n > 2 ? 3 : 5;
        for (let k = 0; k < n; k++) {
          const b = bend(o, t, (k % 2 ? 1 : -1) * (0.2 + 0.1 * k));
          c.add('g5Rose', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start: k * 35, travel: c.hit - k * 35, s: 2.8 * c.sz, spin: 12, delay: d, life: c.hit + 10, trail: '#ff2a4a', ease: 'lin' });
        }
        c.add('g5Ribbon', { x: t.x, y: t.y + 20, r: 20 * c.sz, h: 44, turns: 2, cols: ['#ff2a4a', '#ffd0d8'], w: 3, grow: 300, len: 0.7, delay: d + c.hit - 120, life: 520 });
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: RED, glow: '#ff6a8a', core: WHITE, list: [WHITE, RED2, RED] }, delay: d + c.hit, heavy: i === 0, smoke: '#5a2030' });
        for (let k = 0; k < 2; k++) c.k.petals(t.x, t.y, { n: 12, colors: [RED, RED2, '#c8102e'], spread: 30, delay: d + c.hit + 60 + k * 140, life: end - c.hit - 120 - k * 140 - d });
      });
      c.k.shake(380, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, RED2], shape: 'petal' });
    },
  },

  // ── ネオ・クイーン・セレニティ ──
  // 銀水しょうの光: むねの 前で 銀の クリスタルが ひかり、白銀の 光線 → 光の 結晶の 爆発
  ax_ginzuishou_hikari: {
    charge: { color: SILVER, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_crystal', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 30);
      darken(c, 0.42, end, '#060a20');
      c.add('g5Crystal', { x0: o.x, y0: o.y, s: 9, grow: 200, life: c.hit + 420 });
      c.each((t, i, d) => {
        c.k.beam(o.x, o.y, t.x, t.y, { w: 7 * c.sz, color: SILVER, glow: SILVER2, core: WHITE, delay: d, life: 620, grow: c.hit, widths: [0.4, 1, 1.1, 0.9, 0.5, 0] });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 10 : 18, colors: [WHITE, SILVER, SILVER2, '#c8f0ff'], speed: 130, size: 3.4, delay: d + c.hit + 40, life: 520, spin: 6 });
        c.add('g5Crystal', { x0: t.x, y0: t.y, s: 12 * c.sz, grow: 160, delay: d + c.hit, life: 420 });
        burst(c, t, d + c.hit, { glow: SILVER2, cols: SILVER_COLS, heavy: i === 0, stars: 0, ring: 62 });
        dust(c, t.x, t.y, d + c.hit + 200, { n: 14, cols: SILVER_COLS, r: 30, life: end - c.hit - 260 });
      });
      c.fx.flashAt(120, '#eef4ff', c.hit);
      c.k.shake(380, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: SILVER_COLS });
    },
  },
  // 王の剣の光: 王の 剣を かかげて 金の 光線 → 金の 爆発
  ax_ou_no_ken_hikari: {
    charge: { color: GOLD, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_sword', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      const o = src(c, 34);
      darken(c, 0.4, end, '#0e0a02');
      c.add('g5Wand', { x0: o.x, y0: o.y + 14, s: 6, variant: 'sword', glow: GOLD2, life: c.hit + 400 });
      c.each((t, i, d) => {
        c.k.beam(o.x, o.y - 16, t.x, t.y, { w: 7 * c.sz, color: GOLD, glow: GOLD2, core: WHITE, delay: d, life: 620, grow: c.hit, widths: [0.4, 1, 1.1, 0.9, 0.5, 0] });
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: GOLD, glow: GOLD2, core: WHITE, list: KING_COLS }, delay: d + c.hit, heavy: i === 0, smoke: '#8a6a2a' });
        c.k.shapes(t.x, t.y, { shape: 'star', n: c.n > 2 ? 6 : 12, colors: KING_COLS, speed: 110, size: 3, delay: d + c.hit + 80, life: 500 });
        dust(c, t.x, t.y, d + c.hit + 220, { n: 12, cols: KING_COLS, r: 30, life: end - c.hit - 280 });
      });
      c.fx.flashAt(120, '#fff6d0', c.hit);
      c.k.shake(380, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: KING_COLS });
    },
  },
  // クリスタルの結界: 味方の 前に すきとおった クリスタルの かべ（ふちが にじ色）→ ひかる
  ax_crystal_kekkai: {
    charge: { color: SILVER, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_crystal', allyFx: 'shield',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.35, end);
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30;
      c.add('g5Crystal', { x0: c.W / 2, y0: 30, s: 10, grow: 300, life: end });
      c.add('g5Wall', { x: (x0 + x1) / 2, y: c.t.y + 4, w: Math.max(90, x1 - x0), n: Math.max(4, c.n * 2 + 1), grow: c.hit, delay: 60, life: end - 60 });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 6, color: SILVER, glow: WHITE, delay: d + c.hit - 100, life: 420, burst: false, alpha: 0.6 });
        healGlow(c, t, d + c.hit, { col: '#c8e8ff', cols: [WHITE, SILVER, '#c8f0ff'] });
      });
      c.at(c.hit, () => { for (let k = 0; k < 8; k++) c.k.bolt(c.W / 2, 34, lerp(x0, x1, k / 7), c.t.y - 20, { w: 0.8, color: WHITE, glow: SILVER2, forks: 0, n: 6, amp: 4, life: 200, grow: 60, delay: k * 18 }); });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 24, { cols: [WHITE, SILVER, '#ffe8a0'], r: 70, want: 140 });
    },
  },
  // 月の女王のいやし: 大きな 満月が 画面の 上に、白銀の 光が 味方に ふりそそぐ・羽 → 回復
  ax_joou_iyashi: {
    charge: { color: SILVER, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_heal', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.45, end);
      c.add('g5Moon', { x: c.W / 2, y: 32, r: 24, phase: 'full', rise: 360, life: end });
      c.add('g5Curtain', { cols: [SILVER, WHITE, '#fff6dc'], n: 18, grow: c.hit, reach: 1, life: end });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 9, color: SILVER, glow: WHITE, delay: d + c.hit - 80, life: 520, burst: false, alpha: 0.7 });
        c.add('g5Ribbon', { x: t.x, y: t.y + 8, r: 13, h: 40, turns: 1.6, cols: [WHITE, SILVER2], w: 2.4, grow: 360, len: 0.8, delay: d + c.hit - 140, life: 580 });
        healGlow(c, t, d + c.hit, { col: '#d8ffe8', cols: [WHITE, SILVER, '#c8ffe0'] });
      });
      feathers(c, 100, { n: 12, life: end - 140 });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: [WHITE, SILVER, '#fff6dc'], r: 80, want: 150 });
    },
  },
  // 地球の王のいやし: 青い 地球の 光と 金の 光が 味方を つつむ → 回復
  ax_chikyuu_ou_iyashi: {
    charge: { color: GOLD, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_heal', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'sky', 0.4, end);
      c.add('g5Mark', { mark: 'globe', x0: c.W / 2, y0: 36, s: 20, glow: '#7ab8ff', life: end, fout: 300, pop: true });
      c.add('g5Curtain', { cols: [GOLD2, '#9ad0ff', WHITE], n: 16, grow: c.hit, reach: 1, life: end });
      c.add('g5Wave', { y0: c.H + 10, y1: c.H - 44, cols: [GOLD2, '#7ab8ff', WHITE], travel: c.hit + 100, amp: 4, alpha: 0.16, life: end });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 9, color: GOLD2, glow: WHITE, delay: d + c.hit - 80, life: 520, burst: false, alpha: 0.7 });
        healGlow(c, t, d + c.hit, { col: GOLD2, cols: [WHITE, GOLD2, '#9ad0ff'] });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: KING_COLS, r: 80, want: 150 });
    },
  },
  // よみがえりの銀水しょう: 銀の クリスタルが 大きく なり、光の はしら → 羽 → 生き返る 光（男の子は 金）
  ax_ginzuishou_fukkatsu: {
    charge: { color: SILVER, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_crystal', allyFx: 'revive',
    play(fx, c) {
      const end = c.len - 40;
      const gold = !!c.vars.gold;
      const col = gold ? GOLD2 : SILVER, edge = gold ? '#c8901a' : '#8aa8ff', glow = gold ? '#ffe8a0' : '#d8e8ff';
      sky(c, gold ? 'sky' : 'moon', 0.45, end);
      c.each((t, i, d) => {
        c.add('g5Crystal', { x0: t.x, y0: t.y - 56, s: 16, grow: c.hit, col: gold ? '#fff0b0' : SILVER, edge, glow, delay: d, life: end - d });
        c.k.gather(t.x, t.y - 56, { colors: [WHITE, col], n: 16, r: 60, waves: 3, gap: 140, delay: d, life: 260 });
        c.k.pillar(t.x, t.y + 8, { w: 11, color: col, glow, core: WHITE, delay: d + c.hit - 40, life: 620 });
        c.k.shockwave(t.x, t.y + 8, { r0: 6, r1: 70, sy: 0.35, color: col, w: 2.4, n: 3, gap: 120, delay: d + c.hit, life: 460 });
        c.k.shapes(t.x, t.y, { shape: 'twinkle', n: 14, colors: [WHITE, col], speed: 40, ang: -Math.PI / 2, spread: 0.5, g: -50, size: 3.4, delay: d + c.hit + 60, life: 640 });
        healGlow(c, t, d + c.hit + 100, { col: WHITE, cols: [WHITE, col] });
      });
      c.fx.flashAt(140, '#ffffff', c.hit);
      feathers(c, c.hit - 300, { n: 12, life: end - c.hit + 260, cols: gold ? ['#fff6d0', '#ffe8a0'] : [WHITE, '#f0f4ff'] });
      sparkleFill(c, c.hit, c.t.x, c.t.y - 40, { cols: [WHITE, col], r: 50, want: 160 });
    },
  },
  // やすらぎの月光: 白銀の 月光の カーテンが 敵ぜんぶに おり、敵が ねむそうに（Z）・下向きの やじるし
  ax_yasuragi_gekkou: {
    charge: { color: SILVER, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_sleep', allyFx: 'sleep',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.55, end);
      c.add('g5Moon', { x: c.W / 2, y: 26, r: 22, phase: 'full', rise: 300, life: end });
      c.add('g5Curtain', { cols: [SILVER, MOONBLUE, WHITE, '#d8c8ff'], n: 20, grow: c.hit + 100, reach: 1, life: end });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y + 10, { w: 9 * c.sz, color: MOONBLUE, glow: '#a8b8ff', core: WHITE, delay: d + c.hit - 80, life: 560, burst: false, alpha: 0.7 });
        burst(c, t, d + c.hit, { glow: MOONBLUE, cols: SILVER_COLS, heavy: false, stars: 6, ring: 48 });
        for (let k = 0; k < 3; k++) c.add('g5Mark', { mark: 'z', x0: t.x + 8 + k * 4, y0: t.y - 12 - k * 8, x1: t.x + 16 + k * 6, y1: t.y - 30 - k * 10, travel: 600, s: 3 + k, color: '#e8f0ff', glow: '#a8c0ff', delay: d + c.hit + 120 + k * 160, life: end - c.hit - 140 - k * 160 - d, fout: 200 });
        arrows(c, t.x - 6, t.y - 6, '#a8b8ff', false, 2, d + c.hit + 200);
      });
      feathers(c, 200, { n: 8, life: end - 240 });
      c.at(c.hit + 100, () => dust(c, c.center.x, c.center.y - 20, 0, { n: 24, cols: SILVER_COLS, r: 90, life: end - c.hit - 300 }));
      c.k.shake(300, 1.6, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: SILVER_COLS, r: 40 });
    },
  },
  // よみがえる月の王国: 大きな 満月の 中から 白銀の 宮殿の 光の シルエットが うかび、光の はしらが 敵ぜんぶに → 白フラッシュ・ゆれ → 羽と 白銀の きらきら・味方も 回復の 光
  ax_tsuki_no_oukoku: {
    charge: { color: SILVER, color2: '#fff6dc', power: 1.3 }, sfx: 'ax_g5_kingdom', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.66, end, { fout: 420 });
      const mx = c.W / 2, my = 50;
      c.add('g5Moon', { x: mx, y: my, r: 40, phase: 'full', rise: 520, dy: 50, life: end, alpha: 0.95, color: '#fff0b8', dark: '#d8b860' });
      c.add('g5Palace', { x: mx, y: my + 40, w: 110, h: 74, style: 'moon', grow: 560, delay: 160, life: end - 160, glow: '#b8c8ff', fill: '#a8b8f0', edge: '#ffffff', solid: 0.92 });
      c.k.gather(mx, my, { colors: [WHITE, SILVER, '#fff6dc'], n: 18, r: 90, waves: 3, gap: 140, life: 260 });
      for (let k = 0; k < 5; k++) c.fx.twinkle(mx + rnd(-50, 50), my + rnd(-30, 30), { color: WHITE, size: rnd(4, 7), delay: 200 + k * 90, life: 360 });
      c.each((t, i, d) => {
        c.k.beam(mx + (t.x - mx) * 0.2, my + 20, t.x, t.y, { w: 6 * c.sz, color: SILVER, glow: '#d8e0ff', core: WHITE, delay: d + c.hit - 180, life: 640, grow: 180, widths: [0.3, 1, 1.15, 1, 0.6, 0], burst: false });
        c.k.pillar(t.x, t.y + 10, { w: 10 * c.sz, color: '#c8d0ff', glow: '#a8b8ff', core: WHITE, delay: d + c.hit, life: 620 });
        burst(c, t, d + c.hit, { glow: SILVER2, cols: SILVER_COLS, heavy: i === 0, stars: 10, ring: 70 });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 80 * c.sz, sy: 0.3, color: SILVER, w: 2.4, n: 2, gap: 120, delay: d + c.hit + 40, life: 460 });
        c.k.debris(t.x, t.y + 10, { n: c.n > 2 ? 4 : 10, colors: [WHITE, SILVER, SILVER2], shape: 'diamond', up: 140, delay: d + c.hit + 60, size: 2 });
      });
      c.fx.flashAt(220, '#ffffff', c.hit);
      c.k.shake(620, 3.4, c.hit);
      // 味方も 回復の ひかり
      for (let k = 0; k < 4; k++) c.at(c.hit + 260 + k * 50, () => { const ax = c.W / 2 + (k - 1.5) * 58; c.fx.glow(ax, c.H - 22, { color: '#c8ffe0', r: 20, life: 520, alpha: 0.8 }); c.k.shapes(ax, c.H - 22, { shape: 'twinkle', n: 4, colors: [WHITE, '#c8ffe0'], speed: 26, ang: -Math.PI / 2, spread: 0.6, g: -30, size: 3, life: 520 }); });
      feathers(c, c.hit + 60, { n: 12, life: end - c.hit - 80 });
      c.at(c.hit + 240, () => dust(c, c.center.x, c.center.y, 0, { n: 40, cols: SILVER_COLS, r: 110, life: end - c.hit - 420 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: SILVER_COLS, r: 60 });
    },
  },
  // ゴールデン・クリスタル: 金の クリスタルが 大地を つつむ 金の 光の 波 → 金の 大爆発 → 金の きらきら
  ax_golden_crystal: {
    charge: { color: GOLD, color2: WHITE, power: 1.3 }, sfx: 'ax_g5_golden', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'sky', 0.62, end, { fout: 420, cols: ['#0a0820', '#2a1a40', '#6a4a30', '#a87a28'] });
      const mx = c.W / 2, my = 40;
      c.add('g5Crystal', { x0: mx, y0: my + 20, x1: mx, y1: my, travel: 500, s: 22, grow: 520, col: '#fff0b0', edge: '#c8901a', glow: '#ffe08a', life: end });
      c.k.gather(mx, my, { colors: [WHITE, GOLD2, GOLD], n: 18, r: 90, waves: 3, gap: 140, life: 260 });
      if (c.fromAlly) c.add('g5Wave', { y0: c.H + 12, y1: Math.min(...c.targets.map((t) => t.y)) - 30, cols: [GOLD, GOLD2, WHITE], body: '#a87a10', travel: c.hit + 100, amp: 7, gap: 12, alpha: 0.3, delay: 120, life: end - 120, fout: 400 });
      else c.add('g5Curtain', { cols: [GOLD, GOLD2, WHITE], n: 18, grow: c.hit, reach: 1, life: end });
      c.each((t, i, d) => {
        c.k.explosion(t.x, t.y, { r: 26 * c.sz, pal: { main: GOLD, glow: GOLD2, core: WHITE, list: KING_COLS }, delay: d + c.hit, heavy: i === 0, smoke: '#8a6a2a' });
        c.k.pillar(t.x, t.y + 10, { w: 16 * c.sz, color: GOLD2, glow: WHITE, delay: d + c.hit + 60, life: 560, burst: false });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 80 * c.sz, sy: 0.3, color: GOLD, w: 2.4, n: 2, gap: 120, delay: d + c.hit + 40, life: 460 });
        c.k.debris(t.x, t.y + 10, { n: c.n > 2 ? 4 : 10, colors: KING_COLS, shape: 'diamond', up: 140, delay: d + c.hit + 60, size: 2 });
      });
      c.fx.flashAt(220, '#fff6d0', c.hit);
      c.k.shake(620, 3.4, c.hit);
      c.at(c.hit + 240, () => dust(c, c.center.x, c.center.y, 0, { n: 40, cols: KING_COLS, r: 110, life: end - c.hit - 420 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: KING_COLS, r: 60 });
    },
  },
  // クリスタルの都の夜明け: 夜明けの 色（青 → ピンク → 金）・クリスタルの 塔の 光 → 回復
  ax_crystal_yoake: {
    charge: { color: SILVER, color2: '#ffd8a0', power: 1.1 }, sfx: 'ax_g5_dawn', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'night', 0.55, end, { to: 'dawn' });
      c.add('g5Palace', { x: c.W / 2, y: c.H - 20, w: 200, h: 90, style: 'crystal', grow: c.hit + 100, life: end, alpha: 0.75, glow: '#ffd8e8' });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 8, color: '#ffd8e8', glow: WHITE, delay: d + c.hit - 60, life: 520, burst: false, alpha: 0.7 });
        healGlow(c, t, d + c.hit, { col: '#ffd8a8', cols: [WHITE, '#ffd8e8', '#ffe8a0'] });
      });
      c.at(c.hit + 100, () => dust(c, c.W / 2, 60, 0, { n: 30, cols: [WHITE, '#ffd8e8', '#ffe8a0'], r: 110, life: end - c.hit - 260, fall: 10 }));
      sparkleFill(c, c.hit, c.center.x, c.center.y - 40, { cols: [WHITE, '#ffd8e8', '#ffe8a0'], r: 90, want: 150 });
    },
  },
  // 地球の王国の夜明け: 青い 空に 金の 朝日 → 回復
  ax_chikyuu_yoake: {
    charge: { color: GOLD, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_dawn', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'dawn', 0.55, end, { to: 'sky' });
      c.add('g5Curtain', { cols: [GOLD2, '#fff6d0', '#ffd8a0'], n: 12, grow: c.hit, reach: 1, life: end });
      c.each((t, i, d) => {
        c.k.pillar(t.x, t.y, { w: 8, color: GOLD2, glow: WHITE, delay: d + c.hit - 60, life: 520, burst: false, alpha: 0.7 });
        healGlow(c, t, d + c.hit, { col: GOLD2, cols: [WHITE, GOLD2, '#9ad0ff'] });
      });
      for (let k = 0; k < 6; k++) c.add('g5Mark', { mark: 'feather', x0: rnd(20, c.W - 20), y0: 20, x1: rnd(20, c.W - 20), y1: 90, travel: end - 300, ease: 'lin', s: 3, color: '#fff6d0', glow: GOLD2, wobble: 0.5, delay: 200 + k * 60, life: end - 260 - k * 60, pop: false });
      c.at(c.hit + 100, () => dust(c, c.W / 2, 70, 0, { n: 30, cols: KING_COLS, r: 110, life: end - c.hit - 260, fall: 10 }));
      sparkleFill(c, c.hit, c.center.x, c.center.y - 40, { cols: KING_COLS, r: 90, want: 150 });
    },
  },
  // 銀色の月のかがやき: 銀色の 三日月の 刃の 光が 敵へ → 銀の 大きな 光の はしら
  ax_gin_no_tsuki: {
    charge: { color: SILVER, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_crystal', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.6, end);
      const mx = c.W / 2, my = 30;
      c.add('g5Moon', { x: mx, y: my, r: 28, phase: 'crescent', rot: -0.5, color: SILVER, glow: '#d8e0ff', rise: 300, life: c.hit + 120 });
      c.each((t, i, d) => {
        c.add('g5MoonWave', { x0: mx, y0: my, x1: t.x, y1: t.y, start: 120, travel: c.hit - 120, s: 22 * c.sz, col: WHITE, glow: SILVER2, delay: d, life: c.hit + 40 });
        c.k.crescent(t.x, t.y, { r: 34 * c.sz, a0: -2.8, a1: 0.6, w: 10, color: SILVER, glow: SILVER2, core: WHITE, delay: d + c.hit - 60, swing: 160, life: 460, after: 4 });
        c.k.pillar(t.x, t.y + 10, { w: 15 * c.sz, color: SILVER, glow: SILVER2, core: WHITE, delay: d + c.hit + 40, life: 700 });
        burst(c, t, d + c.hit, { glow: SILVER2, cols: SILVER_COLS, heavy: i === 0, stars: 10, ring: 74 });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 90 * c.sz, sy: 0.3, color: SILVER, w: 2.6, n: 2, gap: 140, delay: d + c.hit + 60, life: 500 });
        c.k.debris(t.x, t.y + 10, { n: c.n > 2 ? 4 : 10, colors: SILVER_COLS, shape: 'diamond', up: 150, delay: d + c.hit + 80, size: 2.2 });
      });
      c.fx.flashAt(200, '#ffffff', c.hit);
      c.k.shake(600, 3.2, c.hit);
      feathers(c, c.hit + 80, { n: 8, life: end - c.hit - 100 });
      c.at(c.hit + 200, () => dust(c, c.center.x, c.center.y, 0, { n: 36, cols: SILVER_COLS, r: 100, life: end - c.hit - 380 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: SILVER_COLS, r: 50 });
    },
  },
  // 地球の王のつるぎ: 剣に 青と 金の 光が あつまり 切りおろす → 金の 光の はしら
  ax_chikyuu_ou_tsurugi: {
    charge: { color: GOLD, color2: '#9ad0ff', power: 1.2 }, sfx: 'ax_g5_sword', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'sky', 0.55, end);
      const sx = c.W / 2, sy = 58;
      c.add('g5Wand', { x0: sx, y0: sy, s: 10, variant: 'sword', glow: GOLD2, life: c.hit + 120 });
      c.k.gather(sx, sy - 14, { colors: [WHITE, '#7ab8ff', GOLD2], n: 20, r: 70, waves: 3, gap: 110, life: 240 });
      c.add('g5Mark', { mark: 'globe', x0: sx - 60, y0: 30, s: 9, glow: '#7ab8ff', life: c.hit + 200, fout: 200 });
      c.each((t, i, d) => {
        c.k.slash(t.x, t.y, { r: 46 * c.sz, w: 11, ang: 1.25, span: 2.4, color: GOLD2, glow: GOLD, core: WHITE, delay: d + c.hit - 100, swing: 150, life: 460, after: 4 });
        c.k.pillar(t.x, t.y + 10, { w: 15 * c.sz, color: GOLD2, glow: GOLD, core: WHITE, delay: d + c.hit + 40, life: 700 });
        burst(c, t, d + c.hit, { glow: GOLD, cols: KING_COLS, heavy: i === 0, stars: 10, ring: 74 });
        c.k.shockwave(t.x, t.y + 12, { r0: 8, r1: 90 * c.sz, sy: 0.3, color: '#9ad0ff', w: 2.6, n: 2, gap: 140, delay: d + c.hit + 60, life: 500 });
        c.k.debris(t.x, t.y + 10, { n: c.n > 2 ? 4 : 10, delay: d + c.hit + 80, up: 150 });
      });
      c.fx.flashAt(200, '#fff6d0', c.hit);
      c.k.shake(600, 3.2, c.hit);
      c.at(c.hit + 200, () => dust(c, c.center.x, c.center.y, 0, { n: 36, cols: KING_COLS, r: 100, life: end - c.hit - 380 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: KING_COLS, r: 50 });
    },
  },
  // ── 合体技 ──
  // ムーンライト・ステージ: 満月の はいけい・スポットライト・ハートと 三日月の 光が 敵ぜんぶへ → きらきら
  ax_moonlight_stage: {
    sfx: 'ax_g5_moonlight', allyFx: 'bolt',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'moon', 0.5, end);
      c.add('g5Moon', { x: c.W / 2, y: 28, r: 24, phase: 'full', rise: 360, life: end });
      for (let k = 0; k < 4; k++) c.add('g5Spot', { x0: 20 + k * 72, y0: -6, x1: c.targets[k % c.n].x, y1: c.targets[k % c.n].y + 16, w: 20, col: [PINK2, GOLD2, MOONBLUE, PINK][k], sway: 0.25, swayMs: 260, phase: k, delay: k * 60, life: end - k * 60 });
      const o = { x: c.W / 2, y: c.H + 6 };
      c.each((t, i, d) => {
        for (let k = 0; k < (c.n > 2 ? 3 : 6); k++) {
          const b = bend(o, t, (k % 2 ? 1 : -1) * (0.15 + 0.1 * k));
          if (k % 2) c.add('g5Heart', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start: k * 40, travel: c.hit - k * 40, s: 4 * c.sz, col: PINK, delay: d, life: c.hit + 20, ease: 'lin' });
          else c.add('g5Mark', { mark: 'crescent', x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start: k * 40, travel: c.hit - k * 40, s: 5 * c.sz, color: GOLD, glow: GOLD2, spin: 8, delay: d, life: c.hit + 20, ease: 'lin', pop: false });
        }
        burst(c, t, d + c.hit, { glow: PINK, cols: MOON_COLS, heavy: i === 0, stars: 10, ring: 60 });
        c.add('g5HeartRing', { x: t.x, y: t.y, r0: 8, r1: 40 * c.sz, n: 6, s: 3, cols: [PINK, GOLD, PINK2], delay: d + c.hit + 40, life: 520 });
      });
      c.k.shake(380, 2.2, c.hit);
      for (let k = 0; k < 5; k++) c.at(c.hit + 300 + k * 160, () => c.k.shapes(rnd(30, c.W - 30), rnd(20, 70), { shape: k % 2 ? 'note' : 'star', n: 6, colors: [PINK2, GOLD2, WHITE], speed: 50, size: 3, g: 20, life: 520 }));
      c.at(c.hit + 200, () => dust(c, c.center.x, c.center.y, 0, { n: 30, cols: MOON_COLS, r: 100, life: end - c.hit - 400 }));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: MOON_COLS, r: 40 });
    },
  },
};

export const AX_G5_MOON = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { ...d, play: wrapPlay(d.play) }]));
void [easeOut, mixHex, TAU];
