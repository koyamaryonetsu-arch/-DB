// 第48回 G5: アナと雪の女王（雪の女王・第5のせいれい）の 大技の え
// ・雪の 結晶・氷の 城・ありのままの 雪の うず と 氷の かいだん・4つの せいれい（風・火・水・大地）と 5つめ の しるし
// ・時間は shared/data/ax-time-g5.js（ここには 見た目だけ）。c の 時間は はなつ しゅんかんが 0
// ・画面の 文字は かかない（文字の 中に 漢字を 入れない。コメントは よい）
import { rnd, lerp, clamp01, easeOut, easeInOut, softGlow } from './axkit.js?v=e9f7d3379e55';
import { wrapPlay, sparkleFill, arrows, AX_G5_FINE_KIT } from './axfx-g5-kit.js?v=e9f7d3379e55';

const TAU = Math.PI * 2;
const ICE = '#9ae6ff', ICE2 = '#bfeaff', ICE3 = '#e6f8ff', WHITE = '#ffffff', DEEP = '#2a6ab0';
const ICE_COLS = [WHITE, ICE2, ICE, ICE3];
// せいれいの 色（風・火・水・大地）
const SPIRIT = { wind: '#5ae0a0', fire: '#9a6aff', water: '#3a9aff', earth: '#d8963a', five: '#ffffff' };
const SPIRIT_COLS = [SPIRIT.wind, SPIRIT.fire, SPIRIT.water, SPIRIT.earth];
const FIRE_COLS = ['#4a2ad8', '#8a7aff', '#e0d8ff'];

// ───────────── この ファイルの つぶ ─────────────
export const AX_G5_FINE_ICE = {
  // せいれいの しるしが まわる（cx, cy の まわりを r で。mergeAt から まん中へ あつまる）
  g5Orbit(x, p, t, fx) {
    const a = clamp01(p.age / 120) * clamp01((p.life - p.age) / 200);
    if (a <= 0) return;
    const m = p.mergeAt ? easeInOut(clamp01((p.age - p.mergeAt) / Math.max(1, p.mergeMs || 260))) : 0;
    const an = p.a0 + (p.age / 1000) * (p.spd || 2.4);
    const r = p.r * (1 - m) * (0.6 + 0.4 * easeOut(clamp01(p.age / 260)));
    const px = p.cx + Math.cos(an) * r, py = p.cy + Math.sin(an) * r * (p.ry ?? 0.45);
    x.save();
    x.globalCompositeOperation = 'lighter';
    // ひかりの しっぽ
    for (let i = 1; i <= 4; i++) {
      const b = an - i * 0.16;
      x.globalAlpha = a * 0.16 * (5 - i);
      softGlow(x, p.cx + Math.cos(b) * r, p.cy + Math.sin(b) * r * (p.ry ?? 0.45), p.s * 0.9, p.col, 0.8);
    }
    x.restore();
    p.x = px; p.y = py;
    // しるしの かきかたは g5Sigil を つかう
    AX_G5_FINE_KIT.g5Sigil(x, { ...p, x0: px, y0: py, x1: undefined }, t, fx);
  },
  // 光の 線（2点を むすぶ。grow で のびる）
  g5Line(x, p) {
    const a = clamp01(p.age / 80) * clamp01((p.life - p.age) / 200);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.grow || 200)));
    const ex = lerp(p.x0, p.x1, e), ey = lerp(p.y0, p.y1, e);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    for (const [w, col, al] of [[p.w * 3, p.col, 0.3], [p.w, p.col, 0.9], [p.w * 0.4, WHITE, 1]]) {
      x.globalAlpha = a * al; x.strokeStyle = col; x.lineWidth = Math.max(0.4, w);
      x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    }
    softGlow(x, ex, ey, p.w * 4, p.col, a);
    x.restore();
  },
};

// ───────────── どうぐ ─────────────
function burst(c, t, d, { glow = ICE, cols = ICE_COLS, r = 16, heavy = false, flakes = 8, ring = 46 } = {}) {
  c.k.impact(t.x, t.y, { r: r * c.sz, glow, colors: cols, delay: d, heavy });
  c.k.shockwave(t.x, t.y, { r0: 6, r1: ring * c.sz, color: glow, w: 2.2, n: 2, gap: 100, delay: d + 30, life: 380 });
  if (flakes) c.k.shapes(t.x, t.y, { shape: 'flake', n: flakes, colors: cols, speed: 90, size: 3.2, delay: d + 20, life: 480, spin: 3 });
}
// こおる（氷の かけらが はえる → くだける）
function freeze(c, t, d, { w = 30, h = 34, n = 5, hold = 360, shatter = true } = {}) {
  c.add('g5Shards', { x: t.x, y: t.y + 14 * c.sz, w: w * c.sz, h: h * c.sz, n, grow: 140, delay: d, life: hold + 140, fout: 120 });
  if (shatter) c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 6 : 12, colors: [ICE3, ICE, WHITE], speed: 130, ang: -Math.PI / 2, spread: 1.3, g: 340, size: 2.4, delay: d + hold, life: 380, spin: 8 });
}
// ふる 雪（画面の 上から）
function snowfall(c, d, life, n = 24, xs = null) {
  for (let i = 0; i < n; i++) {
    const sx = xs ? xs[i % xs.length] + rnd(-30, 30) : rnd(0, c.W);
    c.add('g5Flake', { x0: sx, y0: rnd(-10, 20), x1: sx + rnd(-20, 20), y1: rnd(80, 130), travel: life - i * 12, ease: 'lin', s: rnd(1.8, 3.2), grow: 1, spin: rnd(-2, 2), lw: 1.6, delay: d + i * 12, life: life - i * 12, fout: 220 });
  }
}
// しぶき（みじかい）
function spray(c, x, y, d, n = 8, power = 1) {
  for (let i = 0; i < n; i++) c.fx.drop(x + rnd(-10, 10), y + rnd(-3, 3), { color: ['#2a78d8', '#6ac8ff', '#eaf8ff'][i % 3], vx: rnd(-110, 110) * power, vy: rnd(-190, -60) * power, g: 380, size: rnd(1.1, 2.1), delay: d + (i % 3) * 20, life: 420 });
  c.fx.shock(x, y + 4, { r0: 3, r1: 30 * power, sy: 0.35, color: '#bfe6ff', w: 1.6, delay: d, life: 340 });
}
function darken(c, a, life, color = '#020a1a') { c.k.tint(color, { a, life, fin: 40, fout: Math.min(320, life * 0.4) }); }
function sky(c, style, a, life, o = {}) { c.add('g5Sky', { style, a, life, fin: o.fin ?? 160, fout: o.fout ?? 320, ...o }); }
function healGlow(c, t, d, { col = ICE, cols = [WHITE, ICE2, ICE] } = {}) {
  c.fx.glow(t.x, t.y - 6, { color: col, r: 22 * c.sz, delay: d, life: 520, alpha: 0.9 });
  c.k.shockwave(t.x, t.y + 6, { r0: 4, r1: 26, sy: 0.32, color: col, w: 1.6, delay: d, life: 420 });
  c.k.shapes(t.x, t.y, { shape: 'flake', n: 5, colors: cols, speed: 26, ang: -Math.PI / 2, spread: 0.7, g: -30, size: 2.8, delay: d + 40, life: 560 });
}
const src = (c, dy = 14) => ({ x: c.from.x, y: c.fromAlly ? c.from.y - dy : c.from.y - 6 });
const bend = (a, b, k = 0.35) => ({ cx: (a.x + b.x) / 2 - (b.y - a.y) * k, cy: (a.y + b.y) / 2 + (b.x - a.x) * k });
// 敵ぜんぶの うしろの じめん（城・大男を たてる ところ）
const groundOf = (c) => (c.fromAlly ? { x: c.center.x, y: Math.max(...c.targets.map((t) => t.y)) + 14 } : { x: c.from.x, y: c.from.y + 22 });

const defs = {
  // ── 雪の女王 ──
  // 雪の花のつぶて: 手の ひらから 6かくの 雪の 結晶が まわりながら → 氷の 花
  ax_yuki_tsubute: {
    charge: { color: ICE, color2: WHITE }, sfx: 'ax_g5_crack', allyFx: 'ice',
    play(fx, c) {
      const o = src(c, 16);
      const end = c.len - 40;
      darken(c, 0.36, c.hit + 400);
      c.each((t, i, d) => {
        const n = c.n > 2 ? 3 : 5;
        for (let k = 0; k < n; k++) {
          const b = bend(o, t, (k - (n - 1) / 2) * 0.22);
          c.add('g5Flake', { x0: o.x, y0: o.y, x1: t.x, y1: t.y, ...b, start: k * 40, travel: c.hit - k * 40, s: 6 * c.sz, grow: 120, spin: 9, lw: 1.3, delay: d, life: c.hit + 30, ease: 'lin', fout: 60 });
        }
        // 氷の 花（大きな 結晶が ひらく）
        c.add('g5Flake', { x0: t.x, y0: t.y, s: 20 * c.sz, grow: 260, spin: 0.8, lw: 1.2, delay: d + c.hit, life: 560, fout: 260 });
        burst(c, t, d + c.hit, { heavy: i === 0, flakes: 10 });
        freeze(c, t, d + c.hit + 60, { w: 24, h: 24, hold: 300 });
      });
      c.k.shake(320, 2, c.hit);
      snowfall(c, c.hit + 100, end - c.hit - 120, 12, c.targets.map((t) => t.x));
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ICE_COLS, shape: 'flake' });
    },
  },
  // 氷のかべ: 味方の 前に 青白い 氷の はしらが ならぶ → ひかる
  ax_koori_kabe: {
    charge: { color: ICE, color2: WHITE }, sfx: 'ax_g5_wall', allyFx: 'shield',
    play(fx, c) {
      const end = c.len - 40;
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 34, x1 = Math.max(...xs) + 34;
      const n = Math.max(5, Math.round((x1 - x0) / 14));
      for (let k = 0; k < 3; k++) c.add('g5Shards', { x: (x0 + x1) / 2 + (k - 1) * 4, y: c.t.y + 6 - k * 3, w: x1 - x0 - k * 10, h: 34 - k * 6, n: n - k, fan: 0.15, grow: 160 + k * 80, delay: k * 80, life: end - k * 80, fout: 220, col: k ? ICE3 : ICE2 });
      for (let k = 0; k < 6; k++) c.at(k * 50, () => c.k.shockwave(lerp(x0, x1, k / 5), c.t.y + 6, { r0: 2, r1: 16, sy: 0.35, color: WHITE, w: 1.4, life: 260 }));
      c.each((t, i, d) => {
        c.k.shapes(t.x, t.y - 6, { shape: 'diamond', n: 6, colors: ICE_COLS, speed: 70, ang: -Math.PI / 2, spread: 1, g: 120, size: 2.2, delay: d + 60, life: 420 });
        healGlow(c, t, d + c.hit, { col: ICE2 });
      });
      c.at(c.hit, () => c.k.sparkles((x0 + x1) / 2, c.t.y - 14, { n: 8, colors: [WHITE, ICE2], size: 7, r: (x1 - x0) / 2, life: 320 }));
      sparkleFill(c, c.hit, c.center.x, c.center.y - 18, { cols: ICE_COLS, r: (x1 - x0) / 2, want: 80 });
    },
  },
  // ゆかいな雪だるま: 雪が あつまって 白い 雪だるま（にんじんの 鼻・木の 枝の 手）が 手を ふる・ハグ → 回復
  ax_yukidaruma: {
    charge: { color: ICE2, color2: WHITE }, sfx: 'ax_g5_snowman', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      const sx = c.center.x, sy = c.t.y - 4;
      c.k.gather(sx, sy - 20, { colors: [WHITE, ICE3], n: 16, r: 50, waves: 2, gap: 120, life: 240 });
      for (let k = 0; k < 10; k++) c.fx.puff(sx + rnd(-20, 20), sy - rnd(0, 30), { color: WHITE, r0: 2, r1: 8, vx: rnd(-10, 10), vy: rnd(-10, 6), delay: k * 25, life: 380, alpha: 0.6 });
      c.add('g5Snowman', { x: sx, y: sy, s: 8, delay: 200, life: end - 200 });
      c.each((t, i, d) => {
        c.add('g5Heart', { x0: sx, y0: sy - 30, x1: t.x, y1: t.y - 10, hop: 24, travel: c.hit - 260, s: 4, col: '#ff8ab8', delay: d + 280, life: c.hit - 220, fout: 80 });
        healGlow(c, t, d + c.hit, { col: '#c8ffe8', cols: [WHITE, ICE2, '#ffb0d0'] });
      });
      snowfall(c, 100, end - 120, 14);
      sparkleFill(c, c.hit, sx, sy - 24, { cols: ICE_COLS, r: 50, want: 80 });
    },
  },
  // 雪の大男: 雪が あつまって 大きな 雪の 大男（とげの ある 氷の からだ）→ うでを ふりおろす → 雪の 大爆発
  ax_yuki_ootoko: {
    charge: { color: ICE, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_giant', allyFx: 'ice',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.42, end);
      const g = groundOf(c);
      const gx = c.fromAlly ? Math.max(30, Math.min(...c.targets.map((t) => t.x)) - 26) : g.x;
      c.add('g5Giant', { x: gx, y: g.y + 14, s: 11, smash: c.hit, life: c.hit + 380 });
      c.k.gather(gx, g.y - 24, { colors: [WHITE, ICE2], n: 18, r: 60, waves: 2, gap: 120, life: 240 });
      c.k.streaks({ ang: 0.3, color: ICE3, n: 18, life: end, alpha: 0.4 });
      c.each((t, i, d) => {
        burst(c, t, d + c.hit, { heavy: i === 0, flakes: 8, ring: 58, r: 20 });
        for (let k = 0; k < 5; k++) c.fx.puff(t.x + rnd(-18, 18), t.y + rnd(-8, 12), { color: WHITE, r0: 4, r1: 18 * c.sz, vx: rnd(-40, 40), vy: rnd(-30, -6), delay: d + c.hit + k * 30, life: 520, alpha: 0.65 });
        c.k.shapes(t.x, t.y + 6, { shape: 'circle', n: c.n > 2 ? 8 : 16, colors: [WHITE, ICE3], speed: 150, ang: -Math.PI / 2, spread: 1.3, g: 320, size: 1.8, delay: d + c.hit, life: 520, add: false });
        c.k.shockwave(t.x, t.y + 12, { r0: 6, r1: 70 * c.sz, sy: 0.3, color: WHITE, w: 2.4, n: 2, gap: 100, delay: d + c.hit, life: 420 });
      });
      c.fx.flashAt(120, '#e6f8ff', c.hit);
      c.k.shake(420, 2.8, c.hit);
      snowfall(c, c.hit + 60, end - c.hit - 80, 14);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ICE_COLS, shape: 'flake' });
    },
  },
  // ありのままの歌: 雪の 結晶が うずを まいて 広がり、氷の かいだんの 光・音符・ケープが ひるがえる → 青白い 光
  ax_arinomama: {
    charge: { color: ICE, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_song', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      const cx = c.W / 2, base = c.H - 16;
      c.add('g5Ribbon', { x: cx, y: base, r: 46, h: 96, turns: 2.4, cols: [WHITE, ICE], w: 3, grow: c.hit, len: 0.85, spinMs: 160, flat: 0.3, life: c.hit + 300 });
      c.add('g5Ribbon', { x: cx, y: base, r: 40, h: 90, turns: 2.4, phase: Math.PI, cols: [ICE2, '#c8a8ff'], w: 2.4, grow: c.hit, len: 0.85, spinMs: 160, flat: 0.3, life: c.hit + 300 });
      c.add('g5Stairs', { x: cx + 30, y: base - 4, n: 11, w: 26, step: 8, grow: c.hit, life: end });
      c.add('g5Cape', { x: cx - 30, y: base - 40, r: 30, a0: 1.2, a1: 2.9, swing: c.hit, out: '#7ad8ff', lining: '#e6f8ff', sy: 1.2, life: c.hit + 300 });
      c.add('g5Flake', { x0: cx, y0: 34, s: 30, grow: c.hit, spin: 0.6, lw: 1.1, delay: 60, life: end - 60, fout: 300 });
      for (let k = 0; k < 6; k++) c.at(k * 90, () => c.k.shapes(cx + rnd(-50, 50), base - rnd(10, 70), { shape: 'note', n: 2, colors: [WHITE, ICE2], speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -30, size: 3, life: 520, add: false }));
      c.each((t, i, d) => healGlow(c, t, d + c.hit, { col: ICE2 }));
      c.each((t, i, d) => arrows(c, t.x, t.y - 10, ICE, true, 2, d + c.hit + 100));
      snowfall(c, 0, end - 20, 22);
      sparkleFill(c, c.hit, cx, base - 50, { cols: ICE_COLS, r: 70, want: 90 });
    },
  },
  // 氷の城の大ふぶき: じめんから 氷の 城が たちあがる → 城から ふぶきが 敵ぜんぶへ → 白く こおって パキン・ゆれ → 雪が ふる
  ax_koori_no_shiro: {
    charge: { color: ICE, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_castle', allyFx: 'ice',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'snow', 0.5, end);
      // 敵の うしろの じめんから（敵が かくれない ように すこし 上）
      const g = c.fromAlly ? { x: c.center.x, y: Math.min(...c.targets.map((t) => t.y)) - 10 } : { x: c.from.x, y: c.from.y + 22 };
      c.add('g5Palace', { x: g.x, y: g.y, w: c.fromAlly ? 180 : 110, h: c.fromAlly ? 70 : 64, style: 'ice', grow: 460, life: end, alpha: 0.72, glow: '#9ae6ff' });
      c.k.shockwave(g.x, g.y, { r0: 10, r1: 120, sy: 0.25, color: ICE2, w: 2.6, n: 2, gap: 120, life: 460 });
      c.k.shapes(g.x, g.y, { shape: 'diamond', n: 14, colors: ICE_COLS, speed: 110, ang: -Math.PI / 2, spread: 1.3, g: 260, size: 2.2, life: 520 });
      c.k.shake(460, 1.6, 0);
      c.at(380, () => c.k.streaks({ ang: c.fromAlly ? 1.2 : 1.9, color: WHITE, n: 34, life: end - 420, alpha: 0.6, speed: 1.4 }));
      c.each((t, i, d) => {
        for (let k = 0; k < (c.n > 2 ? 3 : 6); k++) c.add('g5Flake', { x0: g.x + rnd(-40, 40), y0: g.y - 50, x1: t.x + rnd(-10, 10), y1: t.y, travel: c.hit - 380, start: 380 + k * 20, s: 4 * c.sz, grow: 1, spin: 8, lw: 1.4, delay: d, life: c.hit + 20 + k * 20, ease: 'lin', fout: 60 });
        burst(c, t, d + c.hit, { heavy: i === 0, flakes: 8, ring: 60, r: 18 });
        freeze(c, t, d + c.hit + 40, { w: 34, h: 40, n: 6, hold: 380 });
      });
      c.fx.flashAt(150, '#ffffff', c.hit + 40);
      c.k.shake(420, 2.8, c.hit);
      snowfall(c, c.hit + 60, end - c.hit - 80, 22);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ICE_COLS, shape: 'flake' });
    },
  },
  // つららの雨: 空に つららが ならび、いっせいに 敵ぜんぶへ → 氷の かけら
  ax_tsurara_ame: {
    charge: { color: ICE, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_icicle', allyFx: 'ice',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.4, end);
      const per = Math.max(3, Math.round(20 / c.n));
      c.each((t, i, d) => {
        for (let k = 0; k < per; k++) {
          const sx = t.x + (k - (per - 1) / 2) * (26 / per) * 2 * c.sz, sy = 8 + (k % 2) * 6;
          const tx = t.x + rnd(-12, 12) * c.sz, ty = t.y + rnd(-6, 10);
          c.add('g5Icicle', { x0: sx, y0: sy, x1: tx, y1: ty, start: 200 + k * 14, travel: c.hit - 200, len: 12, w: 2.6, delay: d, life: c.hit + 40 + k * 14, ease: 'in' });
          c.fx.twinkle(sx, sy, { color: WHITE, size: 4, delay: d + k * 14, life: 220 });
        }
        burst(c, t, d + c.hit, { heavy: i === 0, flakes: 4, ring: 50 });
        c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 8 : 14, colors: [ICE3, ICE, WHITE], speed: 140, ang: -Math.PI / 2, spread: 1.3, g: 320, size: 2.4, delay: d + c.hit + 30, life: 440, spin: 8 });
        for (let k = 0; k < 3; k++) c.k.shockwave(t.x + rnd(-10, 10), t.y + 8, { r0: 2, r1: 18, sy: 0.35, color: WHITE, w: 1.4, delay: d + c.hit + k * 50, life: 260 });
      });
      c.k.shake(420, 2.4, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ICE_COLS });
    },
  },
  // ── 第5のせいれい ──
  // 風のせいれいのつむじ風: 木の葉と 白い 風の うずが 敵ぜんぶの まわりを まわる → もちあげて おとす
  ax_seirei_kaze: {
    charge: { color: SPIRIT.wind, color2: WHITE }, sfx: 'ax_g5_wind', allyFx: 'wind',
    play(fx, c) {
      const end = c.len - 40;
      darken(c, 0.36, end, '#04140c');
      c.add('g5Sigil', { x0: c.W / 2, y0: 26, s: 11, sigil: 'wind', col: '#7af0a0', life: end });
      c.each((t, i, d) => {
        c.add('g5Tornado', { x0: t.x, y0: t.y + 16, s: 1, w: 26 * c.sz, h: 54 * c.sz, cols: [WHITE, '#c8ffd8', '#7af0a0', '#e8fff0'], grow: 300, delay: d + 80, life: c.hit + 360 });
        fx.swirl(t.x, t.y - 4, ['#7ac850', '#a8e070', '#e8fff0'], { n: c.n > 2 ? 10 : 18, rad: 24 * c.sz, h: 44, delay: d + 60, life: c.hit + 200, size: 1.8 });
        for (let k = 0; k < (c.n > 2 ? 4 : 8); k++) c.fx.petal(t.x + rnd(-20, 20), t.y + rnd(0, 14), { color: ['#6ac850', '#a8d860', '#d8f090'][k % 3], vx: rnd(-50, 50), vy: rnd(-90, -50), size: rnd(1.6, 2.4), delay: d + 120 + k * 30, life: 600 });
        for (let k = 0; k < 3; k++) c.fx.gust(t.x - 30, t.y - 10 + k * 8, { len: 60, amp: 4, color: WHITE, w: 1, dir: 1, delay: d + k * 70, life: 380 });
        // おとす
        c.k.impact(t.x, t.y + 6, { r: 16 * c.sz, glow: '#c8ffd8', colors: [WHITE, '#7af0a0'], delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y + 14, { r0: 4, r1: 46 * c.sz, sy: 0.3, color: '#c8ffd8', w: 2, n: 2, gap: 90, delay: d + c.hit, life: 380 });
        c.k.debris(t.x, t.y + 12, { n: c.n > 2 ? 4 : 8, colors: ['#6ac850', '#a8d860', '#a08060'], shape: 'petal', up: 100, delay: d + c.hit, size: 1.8 });
      });
      c.k.shake(360, 2.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, '#c8ffd8'], shape: 'petal' });
    },
  },
  // 火のせいれいのほのお: 小さな トカゲが ちょろちょろ 走り、青むらさきの 炎の すじを のこして 敵へ → 青い 炎の 爆発
  ax_seirei_hi: {
    charge: { color: SPIRIT.fire, color2: '#e0d8ff', power: 1.2 }, sfx: 'ax_g5_bluefire', allyFx: 'fire',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'cosmos', 0.5, end);
      c.add('g5Sigil', { x0: c.W / 2, y0: 24, s: 11, sigil: 'fire', col: SPIRIT.fire, life: end });
      const o = c.fromAlly ? { x: c.from.x, y: c.H - 10 } : { x: c.from.x, y: c.from.y + 16 };
      c.each((t, i, d) => {
        const p1 = { x: t.x, y: t.y + 12 * c.sz };
        c.add('g5Lizard', { x0: o.x, y0: o.y, x1: p1.x, y1: p1.y, cx: (o.x + p1.x) / 2 + 40, cy: (o.y + p1.y) / 2, travel: c.hit, s: 5 * c.sz, delay: d, life: c.hit + 140, ease: 'lin' });
        for (let k = 1; k <= 5; k++) {
          const u = k / 6, w = 1 - u;
          const px = w * w * o.x + 2 * w * u * ((o.x + p1.x) / 2 + 40) + u * u * p1.x, py = w * w * o.y + 2 * w * u * ((o.y + p1.y) / 2) + u * u * p1.y;
          c.k.flames(px, py + 2, { w: 10, h: 12, cols: FIRE_COLS, n: 3, delay: d + c.hit * u, life: 520, embers: k % 2 === 0 });
        }
        c.k.flames(t.x, t.y + 14, { w: 40 * c.sz, h: 44 * c.sz, cols: FIRE_COLS, n: 6, delay: d + c.hit, life: 700 });
        c.k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#6a4ae0', glow: '#a898ff', core: WHITE, list: ['#8a7aff', '#e0d8ff', '#4a2ad8'] }, delay: d + c.hit, heavy: i === 0, smoke: '#2a2050' });
        c.k.shockwave(t.x, t.y + 12, { r0: 6, r1: 80 * c.sz, sy: 0.3, color: '#a898ff', w: 2.4, n: 2, gap: 120, delay: d + c.hit, life: 460 });
      });
      c.fx.flashAt(180, '#d8d0ff', c.hit);
      c.k.shake(560, 3.2, c.hit);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ['#e0d8ff', '#a898ff', WHITE] });
    },
  },
  // 水のせいれいのいやし: すきとおる 青い 水の 馬が 画面の 下を かけ、しぶきが 味方へ → 回復
  ax_seirei_mizu: {
    charge: { color: SPIRIT.water, color2: WHITE, power: 1.1 }, sfx: 'ax_g5_horse', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'sea', 0.42, end);
      c.add('g5Sigil', { x0: c.W / 2, y0: 24, s: 11, sigil: 'water', col: SPIRIT.water, life: end });
      const y = c.t.y - 12;
      c.add('g5Horse', { x0: -30, y0: y, x1: c.W + 30, y1: y, travel: c.hit + 280, ease: 'lin', s: 34, delay: 0, life: c.hit + 300 });
      for (let k = 0; k < 8; k++) c.at((c.hit + 280) * (k / 8), () => spray(c, lerp(-30, c.W + 30, k / 8), y + 14, 0, 8, 0.7));
      c.each((t, i, d) => {
        spray(c, t.x, t.y, d + c.hit - 40, 6, 0.6);
        healGlow(c, t, d + c.hit, { col: '#6ac8ff', cols: [WHITE, '#bfe6ff', '#6ac8ff'] });
      });
      sparkleFill(c, c.hit, c.center.x, c.center.y - 30, { cols: [WHITE, '#bfe6ff', '#6ac8ff'], r: 80, want: 140 });
    },
  },
  // 大地のせいれいのあしぶみ: 画面の 上から 大きな 岩の 足が ドスン ドスン → ひび・岩・ゆれ
  ax_seirei_daichi: {
    charge: { color: SPIRIT.earth, color2: '#fff0d0', power: 1.2 }, sfx: 'ax_g5_stomp', allyFx: 'quake',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'earth', 0.55, end, { cols: ['#120a04', '#2a1a0c', '#3a2814', '#4a3a24'] });
      c.add('g5Sigil', { x0: c.W / 2, y0: 24, s: 11, sigil: 'earth', col: SPIRIT.earth, life: end });
      const step = (x, y, at, big) => {
        c.add('g5Foot', { x, y, s: (big ? 26 : 22) * (c.n > 2 ? 0.75 : 1), drop: c.hit, hold: 220, delay: at - c.hit, life: c.hit + 560 });
        c.at(at, () => {
          c.fx.crack(x, y + 2, { n: 6, len: 40, delay: 0, life: 700 });
          c.k.debris(x, y, { n: c.n > 2 ? 6 : 12, up: 160, size: 2 });
          c.k.shockwave(x, y + 2, { r0: 8, r1: 90, sy: 0.28, color: '#e8c89a', w: 2.6, n: 2, gap: 100, life: 440 });
          for (let k = 0; k < 5; k++) c.fx.puff(x + rnd(-30, 30), y, { color: '#b8a890', r0: 4, r1: 14, vx: rnd(-40, 40), vy: rnd(-20, -4), life: 560, alpha: 0.5 });
          c.k.shake(360, big ? 3.6 : 3, 0);
        });
      };
      const gy = (t) => t.y + 14 * c.sz;
      if (c.n === 1) { step(c.t.x - 14, gy(c.t), c.hit, false); step(c.t.x + 14, gy(c.t), c.hit + 380, true); }
      else c.each((t, i, d) => step(t.x, gy(t), c.hit + d * 2, i === c.n - 1));
      c.each((t, i, d) => {
        c.k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#e8c89a', colors: ['#fff0d0', '#c08a50'], delay: d + c.hit, heavy: i === 0 });
      });
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ['#fff0d0', '#e8c89a', WHITE], shape: 'rock' });
    },
  },
  // 4つのせいれいの心: 4つの しるしが 味方の まわりを まわり、5つめの 光（まん中）で 1つに
  ax_yottsu_kokoro: {
    charge: { color: WHITE, color2: ICE, power: 1.2 }, sfx: 'ax_g5_spirit4', allyFx: 'up',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'snow', 0.45, end);
      const cx = c.center.x, cy = c.center.y - 34;
      ['wind', 'fire', 'water', 'earth'].forEach((k, i) => c.add('g5Orbit', { cx, cy, r: 70, ry: 0.4, a0: (i / 4) * TAU, spd: 3, s: 9, sigil: k, col: SPIRIT[k], mergeAt: c.hit - 260, mergeMs: 260, delay: i * 80, life: c.hit + 40 - i * 80 }));
      c.add('g5Sigil', { x0: cx, y0: cy, s: 16, sigil: 'five', col: WHITE, delay: c.hit - 40, life: end - c.hit + 40 });
      c.fx.flashAt(140, '#ffffff', c.hit);
      c.k.shockwave(cx, cy, { r0: 8, r1: 110, color: WHITE, w: 2.6, n: 3, gap: 90, delay: c.hit, life: 460 });
      SPIRIT_COLS.forEach((col, i) => c.k.shockwave(cx, cy, { r0: 6, r1: 70 + i * 10, color: col, w: 1.8, delay: c.hit + 60 + i * 40, life: 420 }));
      c.each((t, i, d) => {
        c.add('g5Line', { x0: cx, y0: cy, x1: t.x, y1: t.y - 6, w: 2, col: SPIRIT_COLS[i % 4], grow: 160, delay: d + c.hit, life: 520 });
        healGlow(c, t, d + c.hit + 120, { col: WHITE, cols: [WHITE, ...SPIRIT_COLS] });
        arrows(c, t.x, t.y - 10, WHITE, true, 3, d + c.hit + 200);
      });
      sparkleFill(c, c.hit, cx, cy + 10, { cols: [WHITE, ...SPIRIT_COLS], r: 80, want: 150 });
    },
  },
  // せいれいをつなぐ光: 空に 4つの しるしが ひしがたに、まん中に 5つめ → 光の 線で つながって 大きな 雪の 結晶の もように → 白い 光の はしらが 敵ぜんぶに
  ax_seirei_tsunagu: {
    charge: { color: WHITE, color2: ICE, power: 1.3 }, sfx: 'ax_g5_tsunagu', allyFx: 'ice',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'snow', 0.64, end, { fout: 420 });
      const cx = c.W / 2, cy = 46;
      const pos = { wind: [cx, cy - 32], fire: [cx + 56, cy], water: [cx, cy + 32], earth: [cx - 56, cy] };
      Object.entries(pos).forEach(([k, [x, y]], i) => {
        c.add('g5Sigil', { x0: x, y0: y, s: 13, sigil: k, col: SPIRIT[k], delay: i * 110, life: end - i * 110 });
        c.k.sparkles(x, y, { n: 3, colors: [WHITE, SPIRIT[k]], size: 8, r: 4, delay: i * 110, life: 300 });
      });
      c.add('g5Sigil', { x0: cx, y0: cy, s: 13, sigil: 'five', col: WHITE, delay: 440, life: end - 440 });
      // つなぐ 光の 線
      const ks = Object.keys(pos);
      ks.forEach((k, i) => {
        const [x, y] = pos[k], [x2, y2] = pos[ks[(i + 1) % 4]];
        c.add('g5Line', { x0: x, y0: y, x1: cx, y1: cy, w: 1.6, col: SPIRIT[k], grow: 140, delay: 480 + i * 30, life: end - 480 - i * 30 });
        c.add('g5Line', { x0: x, y0: y, x1: x2, y1: y2, w: 1.2, col: WHITE, grow: 160, delay: 520 + i * 30, life: end - 520 - i * 30 });
      });
      // 大きな 雪の 結晶の もよう
      c.add('g5Flake', { x0: cx, y0: cy, s: 58, grow: 260, spin: 0.4, lw: 0.7, delay: 560, life: end - 560, fout: 400 });
      c.k.shockwave(cx, cy, { r0: 10, r1: 120, color: WHITE, w: 2.4, n: 2, gap: 100, delay: 560, life: 460 });
      c.each((t, i, d) => {
        c.k.beam(cx, cy + 10, t.x, t.y, { w: 5 * c.sz, color: ICE2, glow: ICE, core: WHITE, delay: d + c.hit - 120, life: 560, grow: 120, burst: false, widths: [0.3, 1, 1.1, 0.8, 0.4, 0] });
        c.k.pillar(t.x, t.y + 10, { w: 10 * c.sz, color: ICE2, glow: ICE, core: WHITE, delay: d + c.hit, life: 620 });
        burst(c, t, d + c.hit, { heavy: i === 0, flakes: 8, ring: 70, r: 20 });
        freeze(c, t, d + c.hit + 60, { w: 30, h: 34, hold: 420 });
      });
      c.fx.flashAt(220, '#ffffff', c.hit);
      c.k.shake(620, 3.4, c.hit);
      c.at(c.hit + 220, () => { for (let k = 0; k < 30; k++) c.fx.twinkle(rnd(10, c.W - 10), rnd(10, 110), { color: [WHITE, ...SPIRIT_COLS][k % 5], size: rnd(2.5, 4.5), vy: rnd(6, 20), delay: rnd(0, 200), life: rnd(400, Math.max(420, end - c.hit - 460)) }); });
      snowfall(c, c.hit + 100, end - c.hit - 120, 20);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: [WHITE, ...SPIRIT_COLS], r: 50 });
    },
  },
  // こおりつく大波: 暗い 海の 大波が 立ちあがって 敵ぜんぶに → 波が そのまま こおって 氷の ちょうこくに → くだける
  ax_koori_ookinami: {
    charge: { color: ICE, color2: WHITE, power: 1.2 }, sfx: 'ax_g5_bigwave', allyFx: 'ice',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'sea', 0.62, end, { fout: 400 });
      const top = c.fromAlly ? Math.min(...c.targets.map((t) => t.y)) - 30 : Math.min(...c.targets.map((t) => t.y)) - 26;
      // くらい 海の 大波が 下から たちあがる → そのまま こおる
      c.add('g5Wave', { y0: c.H + 12, y1: top, cols: ['#1a5aa8', '#2a78d8', '#4a9ae8'], body: '#0a2a5a', solid: 0.72, travel: c.hit, amp: 7, wl: 14, gap: 10, life: c.hit + 120, fout: 120 });
      c.add('g5Wave', { y0: top, y1: top, cols: [ICE2, WHITE, ICE], body: '#a8dcff', solid: 0.5, travel: 1, amp: 7, wl: 14, gap: 10, delay: c.hit, life: 700, fout: 260 });
      c.each((t, i, d) => {
        spray(c, t.x, t.y, d + c.hit - 40, c.n > 2 ? 8 : 14, 1.2);
        // こおる（大きな 氷の ちょうこく）
        c.add('g5Shards', { x: t.x, y: t.y + 16 * c.sz, w: 50 * c.sz, h: 54 * c.sz, n: 7, fan: 0.9, grow: 120, delay: d + c.hit + 60, life: 560, fout: 100, col: '#a8dcff', col2: '#e6f8ff' });
        c.k.impact(t.x, t.y, { r: 18 * c.sz, glow: ICE, colors: ICE_COLS, delay: d + c.hit, heavy: i === 0 });
        c.k.shockwave(t.x, t.y, { r0: 8, r1: 70 * c.sz, color: WHITE, w: 2.4, n: 2, gap: 100, delay: d + c.hit + 80, life: 420 });
        // くだける
        c.at(d + c.hit + 600, () => {
          c.k.shapes(t.x, t.y, { shape: 'diamond', n: c.n > 2 ? 10 : 20, colors: [ICE3, ICE, WHITE, '#a8dcff'], speed: 170, ang: -Math.PI / 2, spread: 1.4, g: 360, size: 2.8, life: 480, spin: 10 });
          c.k.shockwave(t.x, t.y, { r0: 6, r1: 50, color: ICE2, w: 2, life: 340 });
        });
      });
      c.fx.flashAt(160, '#e6f8ff', c.hit + 60);
      c.k.shake(560, 3.2, c.hit);
      c.at(c.hit + 600, () => c.k.shake(300, 2.4, 0));
      snowfall(c, c.hit + 600, end - c.hit - 620, 14);
      sparkleFill(c, c.hit, c.t.x, c.t.y, { cols: ICE_COLS, r: 40 });
    },
  },
  // せいれいたちの輪: 4色の 光が 輪に なって 味方の まわりを まわる → 回復
  ax_seirei_wa: {
    charge: { color: WHITE, color2: ICE, power: 1.1 }, sfx: 'ax_g5_spirit4', allyFx: 'heal',
    play(fx, c) {
      const end = c.len - 40;
      sky(c, 'snow', 0.45, end);
      const cx = c.center.x, cy = c.center.y - 14;
      const rr = Math.max(50, (Math.max(...c.targets.map((t) => t.x)) - Math.min(...c.targets.map((t) => t.x))) / 2 + 30);
      ['wind', 'fire', 'water', 'earth'].forEach((k, i) => {
        c.add('g5Orbit', { cx, cy, r: rr, ry: 0.32, a0: (i / 4) * TAU, spd: 2.6, s: 8, sigil: k, col: SPIRIT[k], delay: i * 60, life: end - i * 60 });
        c.add('g5Ribbon', { x: cx, y: cy + 18, r: rr * 0.9, h: 20, turns: 1, phase: (i / 4) * TAU, cols: [SPIRIT[k], WHITE], w: 2.4, grow: c.hit, len: 0.5, spinMs: 300, flat: 0.32, taper: 0, delay: i * 60, life: end - i * 60 });
      });
      c.each((t, i, d) => healGlow(c, t, d + c.hit, { col: '#d8ffe8', cols: [WHITE, ...SPIRIT_COLS] }));
      c.k.shockwave(cx, cy + 12, { r0: 10, r1: rr * 1.2, sy: 0.32, color: WHITE, w: 2, n: 2, gap: 120, delay: c.hit, life: 460 });
      snowfall(c, 100, end - 120, 16);
      sparkleFill(c, c.hit, cx, cy, { cols: [WHITE, ...SPIRIT_COLS], r: rr, want: 140 });
    },
  },
};

export const AX_G5_ICE = Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { ...d, play: wrapPlay(d.play) }]));
void [ICE, DEEP];
