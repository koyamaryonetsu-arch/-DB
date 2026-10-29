// 第48回 G3: るろうに剣心（るろうに剣士・人斬りばっ刀さい・ひ村ばっ刀さい・飛天御剣流けい承者）の 大技の え
// 飛天御剣流 … 白い 神速の 太刀すじ。竜巻閃の なかまは 白い 回転 → 竜巻 → 大竜巻、縦の 技は 真上から → 上下 → 天翔る 竜
// 九頭竜閃は 9本の 白い すじ（真は 9ひきの 金の 竜）。天翔龍閃は 1撃目（神速の 金白の 弧＋竜）→ 真空 → 2撃目
// 時間は shared/data/ax-time-g3.js（ここは 見た目だけ）。画面の 文字は ひらがな・記号だけ
import { ribbon, dragon, line, tornado, bg, prop, text, embers, arcPts, per, hitBurst, blast, glitter, rich } from './axfx-g3-kit.js?v=0e454fdbf852';

const WHITE = ['#ffffff', '#e8f4ff', '#bfe4ff'];
const GOLD = ['#ffffff', '#fff0a0', '#ffd23a'];
const HEAL = ['#c8ffe0', '#7dffb0', '#ffffff'];
const ROCK = ['#a08060', '#6a5040', '#d8c0a0'];
const RED = ['#ff5a5a', '#c8202a', '#ffd0d0'];
const COLD = ['#ffffff', '#9ae6ff', '#e6fbff'];
const blade = { color: '#9ad8ff', color2: '#ffffff' };
const red = { color: '#c8102a', color2: '#ffb0b0' };

const src = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 10 : c.from.y });
const lerpN = (a, b, t) => a + (b - a) * t;
const hdir = (c, t) => (t.x >= c.from.x - 4 ? 1 : -1);
// 飛天の 白い あたり
const hitW = (fx, c, t, i, delay, o = {}) => hitBurst(fx, t.x, t.y, { r: (o.r || 14) * c.sz, glow: o.glow || '#9ad8ff', colors: o.colors || WHITE, n: per(c, o.n || 18), delay, heavy: i === 0 && o.heavy !== false, rings: o.rings || 1 });
// 刀を ふる 剣士の かげ（ざんぞう）
const ghost = (fx, x, y, o = {}) => prop(fx, 'swordsman', x, y, { s: o.s || 1, pose: o.pose || 'slash', color: o.color || '#e8f4ff', blade: '#ffffff', add: true, alpha: o.alpha ?? 0.55, life: o.life || 260, fout: o.fout || 160, delay: o.delay || 0, flipX: !!o.flip, ...(o.to ? { to: o.to, travel: o.travel || 160, ease: 'lin' } : {}) });

export const AX_G3_RUROUNI = {
  // ───── ばっ刀術: さやから 抜きざまに 目にも とまらない 横の 一閃 → あとから 光る 白い 切れ目 ─────
  ax_battou: {
    charge: blade,
    sfx: 'ax_g3_battou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t), L = 44 * s;
        line(fx, t.x - dir * L, t.y + 4, t.x + dir * L, t.y - 3, { w: 1.6, color: '#ffffff', glow: '#9ad8ff', draw: 45, hold: 160, life: 380, flare: 150, delay: d + c.hit - 30 });
        k.streaks({ ang: dir > 0 ? 0 : Math.PI, color: '#ffffff', n: 10, delay: d + c.hit - 40, life: 160, alpha: 0.45 });
        fx.cut(t.x, t.y, { ang: dir > 0 ? -0.15 : 0.15, len: 34 * s, w: 2.4, color: '#ffffff', glow: '#9ad8ff', delay: d + c.hit + 100, life: 240 });
        hitW(fx, c, t, i, d + c.hit, { n: 22 });
        glitter(fx, t.x, t.y, { n: per(c, 8), spread: L, sy: 0.2, colors: WHITE, dur: 160, delay: d + c.hit + 100, life: 220 });
      });
      k.shake(100, 1.1, c.hit);
    },
  },
  // ───── おろ？（自分）: 頭の 上に ぐるぐる と あせ → 小さな 上向きの やじるし ─────
  ax_oro: {
    charge: { ...blade, power: 0.6 },
    sfx: 'ax_g3_oro',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const hy = t.y - 32;
        prop(fx, 'spiral', t.x - 4, hy, { s: 1.6, life: 420, fout: 140, delay: d });
        prop(fx, 'spiral', t.x + 6, hy - 3, { s: 1.1, life: 380, fout: 140, delay: d + 60 });
        prop(fx, 'drop', t.x + 14, hy + 4, { s: 1.3, life: 380, vy: 16, delay: d + 80 });
        text(fx, '?', t.x - 14, hy - 6, { size: 10, color: '#ffffff', color2: '#3a2a8a', life: 360, delay: d + 40 });
        prop(fx, 'arrow', t.x, t.y - 8, { s: 1.4, dir: -1, color: '#7dffb0', life: 260, vy: -30, delay: d + c.hit });
        k.sparkles(t.x, hy, { n: per(c, 8), r: 14, delay: d + c.hit, life: 260 });
        k.particles(t.x, t.y - 8, { colors: HEAL, n: per(c, 12), speed: 50, ang: -Math.PI / 2, spread: 0.6, delay: d + c.hit, life: 300 });
      });
    },
  },
  // ───── 土竜閃: 刀が 地面を たたく → 土と 石が 扇形に 敵ぜんぶへ → ちり ─────
  ax_doryusen: {
    charge: blade,
    sfx: 'ax_g3_doryu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const gx = o.x, gy = c.fromAlly ? o.y - 4 : o.y + 16;
      fx.crack(gx, gy, { n: 5, len: 20, delay: 30 });
      line(fx, gx - 10, gy - 14, gx + 6, gy + 4, { w: 2, color: '#ffffff', glow: '#c8a880', draw: 40, hold: 60, life: 200 });
      k.shockwave(gx, gy, { r0: 4, r1: 30, sy: 0.35, color: '#d8c0a0', w: 2, n: 2, gap: 70, delay: 40 });
      c.each((t, i, d) => {
        const travel = c.hit - 40;
        const n = per(c, 16);
        for (let j = 0; j < n; j++) {
          const sp = travel / 1000;
          const tx = t.x + (Math.random() - 0.5) * 22, ty = t.y + (Math.random() - 0.5) * 14;
          fx.add({ kind: 'axShape', shape: 'rock', x: gx + (Math.random() - 0.5) * 10, y: gy, vx: (tx - gx) / sp, vy: (ty - gy) / sp - 60, g: 120, color: ROCK[j % 3], size: 2.2 + Math.random() * 2, rot0: Math.random() * 6, spin: 8, delay: d + 40 + (j % 4) * 10, life: travel + 60, add: false });
        }
        hitBurst(fx, t.x, t.y, { r: 13 * c.sz, glow: '#e8c89a', colors: ['#ffffff', '#d8c0a0', '#a08060'], n: per(c, 14), delay: d + c.hit, heavy: i === 0 });
        k.debris(t.x, t.y + 8, { n: per(c, 8), up: 90, delay: d + c.hit + 20 });
        for (let j = 0; j < 3; j++) fx.puff(t.x + (j - 1) * 8, t.y + 10, { color: '#c8b090', r0: 3, r1: 11, vy: -12, life: 360, alpha: 0.5, delay: d + c.hit + 40 });
      });
      k.shake(140, 1.3, c.hit);
    },
  },
  // ───── 竜巻閃: 体を まわして（白い 回転の 輪）→ 背中から 一閃 ─────
  ax_ryukansen: {
    charge: blade,
    sfx: 'ax_g3_ryukan',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t);
        const R = 24 * s;
        ribbon(fx, arcPts(t.x - dir * 6, t.y + 4, R, dir > 0 ? Math.PI * 0.5 : Math.PI * 0.5, dir > 0 ? Math.PI * 2.4 : -Math.PI * 1.4, 26, 0.45), { style: 'wind', w: 5 * s, draw: c.hit - 60, hold: 80, life: c.hit + 200, delay: d });
        ribbon(fx, arcPts(t.x, t.y, 26 * s, dir > 0 ? -2.4 : -0.74, dir > 0 ? 0.7 : 2.44 - Math.PI * 2 + Math.PI * 2, 14), { style: 'blade', w: 5.5 * s, draw: 120, hold: 100, life: 360, delay: d + c.hit - 50 });
        hitW(fx, c, t, i, d + c.hit, { n: 22 });
        fx.gust(t.x - 30, t.y, { len: 60, amp: 3, color: '#e8fff0', w: 0.8, dir: 1, delay: d + 40, life: 300 });
        glitter(fx, t.x, t.y, { n: per(c, 10), spread: R, colors: WHITE, dur: 200, delay: d + c.hit, life: 240 });
      });
      k.shake(120, 1.2, c.hit);
    },
  },
  // ───── おせんたくでござる（味方）: 木の たらい・白い あわ → きらきら → 回復 ─────
  ax_osentaku: {
    charge: { ...blade, power: 0.6 },
    sfx: 'ax_g3_wash',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      prop(fx, 'tub', C.x, C.y - 26, { s: 1.5, life: c.len - 100, fout: 160 });
      k.shapes(C.x, C.y - 34, { shape: 'circle', n: 12, colors: ['#ffffff', '#e8f6ff'], speed: 30, ang: -Math.PI / 2, spread: 0.9, g: -20, size: 2, life: 500, add: false });
      c.each((t, i, d) => {
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 24, delay: d + c.hit, life: 300, alpha: 0.8 });
        k.sparkles(t.x, t.y - 10, { n: per(c, 8), r: 16, colors: ['#ffffff', '#c8ffe0'], delay: d + c.hit, life: 260 });
        k.particles(t.x, t.y - 4, { colors: HEAL, n: per(c, 10), speed: 50, ang: -Math.PI / 2, spread: 0.7, delay: d + c.hit, life: 300 });
      });
    },
  },
  // ───── 竜つい閃（Lv10）: 高く とび上がり 真上から まっすぐ おちる 縦の 一閃 → 地面まで 斬って ひび ─────
  ax_ryutsuisen: {
    charge: blade,
    sfx: 'ax_g3_ryutsui',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      line(fx, o.x, o.y, o.x, -20, { w: 2, color: '#ffffff', glow: '#9ad8ff', draw: 120, hold: 40, life: 240 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 14, WHITE);
        const s = c.sz;
        const foot = t.y + 16 * s;
        ghost(fx, t.x - 4, 6, { pose: 'up', s: 0.9, delay: d + 110, life: 200, to: { x: t.x - 4, y: t.y - 10 }, travel: c.hit - 120, alpha: 0.7 });
        line(fx, t.x, -6, t.x, foot + 6, { w: 2.6 * s, color: '#ffffff', glow: '#7ac8ff', draw: 70, hold: 160, life: 380, flare: 120, delay: d + c.hit - 50 });
        fx.crack(t.x, foot, { n: 6, len: 22 * s, delay: d + c.hit + 20 });
        hitW(fx, c, t, i, d + c.hit, { n: 22 });
        k.shockwave(t.x, foot, { r0: 4, r1: 34 * s, sy: 0.3, color: '#e8f4ff', w: 2, n: 2, gap: 70, delay: d + c.hit + 20 });
        k.debris(t.x, foot, { n: per(c, 8), up: 100, delay: d + c.hit + 30 });
      });
      k.shake(160, 1.3, c.hit);
    },
  },
  // ───── 竜しょう閃: 下から 上へ 縦の 斬り上げ → 敵が 浮く 光 ─────
  ax_ryushousen: {
    charge: blade,
    sfx: 'ax_g3_ryusho',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 22, WHITE);
        const s = c.sz, dir = hdir(c, t);
        ribbon(fx, arcPts(t.x - dir * 34 * s, t.y, 36 * s, dir > 0 ? 0.9 : Math.PI - 0.9, dir > 0 ? -0.9 : Math.PI + 0.9, 14), { style: 'blade', w: 6.5 * s, draw: 130, hold: 120, life: 420, delay: d + c.hit - 60 });
        line(fx, t.x + dir * 2, t.y + 30 * s, t.x - dir * 4, t.y - 42 * s, { w: 2, color: '#ffffff', glow: '#9ad8ff', draw: 60, hold: 140, life: 340, flare: 90, delay: d + c.hit - 30 });
        hitW(fx, c, t, i, d + c.hit, { n: 24, rings: 2 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 22), speed: 170, ang: -Math.PI / 2, spread: 0.35, delay: d + c.hit, life: 420, len: 9 });
        glitter(fx, t.x, t.y - 16, { n: per(c, 14), spread: 16, colors: WHITE, dur: 300, delay: d + c.hit + 60, vy: -40 });
      });
      k.shake(200, 1.7, c.hit);
    },
  },
  // ───── 人斬りの剣気（自分）: 暗い 赤の オーラ・目の 位置に 金の 光 → 刀の 冷たい きらり ─────
  ax_hitokiri_kenki: {
    charge: red,
    sfx: 'ax_g3_kenki',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#2a0008', { a: 0.35, life: c.len - 60, fin: 100, fout: 300 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 18, RED);
        k.flames(t.x, t.y + 14, { w: 34, h: 40, n: 6, cols: ['#3a0010', '#8a0a1a', '#c8202a'], delay: d, life: c.len - 160, embers: false });
        fx.sparks(t.x, t.y + 6, { colors: ['#c8202a', '#5a0010', '#ff5a5a'], n: per(c, 16), speed: 40, ang: -Math.PI / 2, spread: 0.6, g: -60, drag: 0.97, delay: d + 60, life: 500, len: 4 });
        prop(fx, 'eye', t.x, t.y - 26, { s: 1.1, color: '#ffd23a', life: 380, fout: 140, delay: d + 120, glow: '#ffd23a', glowR: 8 });
        line(fx, t.x + 6, t.y + 4, t.x + 26, t.y - 26, { w: 1.4, color: '#e8f4ff', glow: '#9ad8ff', draw: 60, hold: 140, life: 320, flare: 100, delay: d + c.hit });
        glitter(fx, t.x + 18, t.y - 14, { n: per(c, 6), spread: 10, colors: WHITE, dur: 120, delay: d + c.hit + 60 });
        k.shockwave(t.x, t.y, { r0: 30, r1: 4, color: '#c8202a', w: 1.6, n: 2, gap: 100, delay: d + 40 });
      });
    },
  },
  // ───── そう竜閃: 白い 一閃 → すぐ さやの 黒い 一撃（太い 黒の 弧）→ 2回 当たる ─────
  ax_souryusen: {
    charge: blade,
    sfx: 'ax_g3_souryu',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 42, WHITE);
        const s = c.sz, dir = hdir(c, t);
        ribbon(fx, arcPts(t.x - dir * 8, t.y + 28 * s, 34 * s, dir > 0 ? -2.3 : -0.84, dir > 0 ? -0.6 : -2.54, 14), { style: 'blade', w: 5.5 * s, draw: 110, hold: 100, life: 360, delay: d + c.hit - 50 });
        hitW(fx, c, t, i, d + c.hit, { n: 16 });
        const h2 = d + c.hit + 200;
        ribbon(fx, arcPts(t.x + dir * 6, t.y - 26 * s, 32 * s, dir > 0 ? 2.4 : 0.74, dir > 0 ? 0.6 : 2.54, 14), { style: 'ink', w: 8 * s, draw: 100, hold: 120, life: 380, side: -1, delay: h2 - 50 });
        hitBurst(fx, t.x, t.y, { r: 15 * c.sz, glow: '#8a8aa8', colors: ['#ffffff', '#c8c8d8', '#5a5a70'], n: per(c, 22), delay: h2, heavy: i === 0, rings: 2 });
        fx.star(t.x, t.y, '#ffffff', 20, h2, 200);
      });
      k.shake(120, 1.3, c.hit);
      k.shake(220, 2, c.hit + 200);
    },
  },
  // ───── 闇夜の太刀: 暗く → 闇から 白い 刃が 敵ぜんぶを（細い 線 いくつも）→ 月の 光で 光る ─────
  ax_yamiyo_tachi: {
    charge: { color: '#5a5a8a', color2: '#e8e8ff' },
    sfx: 'ax_g3_yamiyo',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      k.tint('#02020a', { a: 0.68, life: c.len - 60, fin: 120, fout: 260 });
      // 細い 月
      prop(fx, 'moon', c.W * 0.8, 20, { s: 1.4, life: c.len - 80, fout: 300, glow: '#c8c8ff', glowR: 14 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 46, WHITE);
        const s = c.sz;
        const n = c.n > 2 ? 3 : 5;
        for (let j = 0; j < n; j++) {
          const a = -1.2 + j * (2.4 / Math.max(1, n - 1)) + (j % 2 ? 0.2 : -0.1), L = 30 * s;
          line(fx, t.x - Math.cos(a) * L, t.y - Math.sin(a) * L, t.x + Math.cos(a) * L, t.y + Math.sin(a) * L, { w: 1.2, color: '#ffffff', glow: '#8a8ac8', draw: 40, hold: 200, life: 420, flare: c.hit + 60 - (c.hit - 120 + j * 40), delay: d + c.hit - 120 + j * 40 });
        }
        hitBurst(fx, t.x, t.y, { r: 13 * s, glow: '#c8c8ff', colors: ['#ffffff', '#c8c8ff'], n: per(c, 22), delay: d + c.hit, heavy: i === 0 });
        glitter(fx, t.x, t.y, { n: per(c, 14), spread: 26, colors: ['#ffffff', '#e8e8ff'], dur: 300, delay: d + c.hit + 60 });
      });
      k.shake(180, 1.6, c.hit);
    },
  },
  // ───── 竜鳴閃: 刀を さやに「チンッ」→ 白い 音の 輪が 何重にも ひろがって 敵ぜんぶを ゆらす → ぐるぐる ─────
  ax_ryumeisen: {
    charge: blade,
    sfx: 'ax_g3_ryumei',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const cy = c.fromAlly ? o.y - 16 : o.y;
      glitter(fx, o.x + 6, cy, { n: 6, spread: 6, colors: ['#ffffff'], dur: 60, size: 5 });
      fx.star(o.x + 6, cy, '#ffffff', 18, 40, 200);
      for (let j = 0; j < 7; j++) fx.shock(o.x, cy, { r0: 6, r1: 200, color: j % 2 ? '#bfe4ff' : '#ffffff', w: 1.4, delay: 60 + j * 70, life: 520, sy: 0.7 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 34, WHITE);
        const s = c.sz;
        hitBurst(fx, t.x, t.y, { r: 12 * s, glow: '#bfe4ff', colors: WHITE, n: per(c, 16), delay: d + c.hit, heavy: i === 0, star: false });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 4, r1: 26 * s, color: '#ffffff', w: 1, delay: d + c.hit + j * 80, life: 280 });
        prop(fx, 'spiral', t.x, t.y - 22 * s, { s: 1.6, color: '#ffe066', life: 420, fout: 140, delay: d + c.hit + 120 });
        glitter(fx, t.x, t.y - 22 * s, { n: per(c, 10), spread: 12, colors: ['#ffe066', '#ffffff'], dur: 300, delay: d + c.hit + 140, life: 220, size: 2.4 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 12), speed: 90, delay: d + c.hit, life: 300 });
      });
      k.shake(300, 1.6, c.hit);
    },
  },
  // ───── 竜巣閃（Lv10）: 敵ごとに 短い 斬撃の 線 12本が ばらばらの 角度で（巣の ように）→ 白い 火花 → 線が いっしょに 光って 消える ─────
  ax_ryusousen: {
    charge: { ...blade, power: 1.2 },
    sfx: 'ax_g3_ryusou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 20, WHITE);
        const s = c.sz;
        const n = c.n > 2 ? 6 : 12;
        const flash = d + c.hit;
        for (let j = 0; j < n; j++) {
          const a = (j / n) * Math.PI + (j % 3) * 0.3, L = (16 + (j % 4) * 4) * s;
          const ox = ((j * 7) % 11 - 5) * 1.6 * s, oy = ((j * 5) % 9 - 4) * 1.6 * s;
          const at = d + 20 + j * Math.round((c.hit - 80) / n);
          line(fx, t.x + ox - Math.cos(a) * L, t.y + oy - Math.sin(a) * L, t.x + ox + Math.cos(a) * L, t.y + oy + Math.sin(a) * L, { w: 1.3, color: '#ffffff', glow: '#9ad8ff', draw: 30, hold: flash - at + 60, life: flash - at + 260, flare: flash - at, delay: at });
          if (j % 2 === 0) fx.sparks(t.x + ox, t.y + oy, { colors: WHITE, n: 3, speed: 110, delay: at + 20, life: 220 });
        }
        hitW(fx, c, t, i, flash, { n: 24, rings: 2, r: 16 });
        glitter(fx, t.x, t.y, { n: per(c, 12), spread: 24, colors: WHITE, dur: 240, delay: flash + 40 });
      });
      k.flash('#ffffff', 80, c.hit);
      k.shake(220, 1.9, c.hit);
    },
  },
  // ───── 竜ついしょう閃（ひらめき）: 真上から 落ちる 一閃 → そのまま 下から 斬り上げる 一閃（上下 2本が つながる） ─────
  ax_ryutsuishousen: {
    charge: blade,
    sfx: 'ax_g3_ryutsuishou',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      line(fx, o.x, o.y, o.x, -20, { w: 2, color: '#ffffff', glow: '#9ad8ff', draw: 100, hold: 40, life: 220 });
      c.each((t, i, d) => {
        const s = c.sz;
        const foot = t.y + 18 * s;
        ghost(fx, t.x - 4, 4, { pose: 'up', s: 0.9, delay: d + 80, life: 180, to: { x: t.x - 4, y: t.y - 10 }, travel: c.hit - 100, alpha: 0.7 });
        line(fx, t.x - 3, -6, t.x - 3, foot + 4, { w: 2.6 * s, color: '#ffffff', glow: '#7ac8ff', draw: 70, hold: 260, life: 480, flare: 100, delay: d + c.hit - 50 });
        hitW(fx, c, t, i, d + c.hit, { n: 18 });
        fx.crack(t.x, foot, { n: 5, len: 18 * s, delay: d + c.hit + 10 });
        // そのまま 斬り上げ（U の 字で つながる）
        const h2 = d + c.hit + 230;
        ribbon(fx, [[t.x - 3, foot], [t.x + 6 * s, foot + 3], [t.x + 14 * s, t.y], [t.x + 10 * s, t.y - 40 * s]], { style: 'blade', w: 5.5 * s, draw: 120, hold: 120, life: 380, delay: h2 - 60 });
        hitBurst(fx, t.x + 6, t.y - 4, { r: 15 * s, glow: '#9ad8ff', colors: WHITE, n: per(c, 24), delay: h2, heavy: i === 0, rings: 2 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 18), speed: 170, ang: -Math.PI / 2, spread: 0.35, delay: h2, life: 380, len: 9 });
        glitter(fx, t.x, t.y - 20, { n: per(c, 10), spread: 16, colors: WHITE, dur: 240, delay: h2 + 40, vy: -40 });
      });
      k.shake(160, 1.5, c.hit);
      k.shake(220, 1.9, c.hit + 230);
    },
  },
  // ───── 飛竜閃: さやの 刀を 親指で はじいて 飛ばす（つかが 先・まわる）→ ガン → はね返る ─────
  ax_hiryusen: {
    charge: blade,
    sfx: 'ax_g3_hiryu',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const oy = c.fromAlly ? o.y - 10 : o.y;
      glitter(fx, o.x, oy, { n: 4, spread: 4, colors: ['#ffffff'], dur: 40, size: 5 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 46, WHITE);
        const s = c.sz;
        const ang = Math.atan2(t.y - oy, t.x - o.x);
        prop(fx, 'katana', o.x, oy, { s: 2.3 * s, rot0: ang + Math.PI, spin: 0, glow: '#bfe4ff', glowR: 8, life: c.hit + 10, fout: 10, delay: d, to: { x: t.x, y: t.y }, travel: c.hit, ease: 'in', pop: false });
        line(fx, o.x, oy, t.x, t.y, { w: 1, color: '#e8f4ff', glow: '#9ad8ff', draw: c.hit, hold: 40, life: c.hit + 160, alpha: 0.6, delay: d });
        fx.star(t.x, t.y, '#ffffff', 22, d + c.hit, 220);
        hitW(fx, c, t, i, d + c.hit, { n: 26, rings: 2, r: 15 });
        // はね返る 刀
        prop(fx, 'katana', t.x, t.y, { s: 2 * s, rot0: ang, spin: 22, life: 420, fout: 160, delay: d + c.hit, vx: (o.x - t.x) * 0.5, vy: -150, g: 380 });
        glitter(fx, t.x, t.y, { n: per(c, 10), spread: 18, colors: WHITE, dur: 200, delay: d + c.hit + 40 });
      });
      k.shake(200, 1.7, c.hit);
    },
  },
  // ───── 不殺のちかい（味方）: 逆刃刀の きらり → 味方を つつむ 白い 光の たて ─────
  ax_fusatsu: {
    charge: blade,
    sfx: 'ax_g3_fusatsu',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      k.dim({ a: 0.35, life: c.len - 80, fin: 0, fout: 300 });
      // 逆刃の 刀（刃が うちがわ）が きらり
      prop(fx, 'katana', C.x, C.y - 46, { s: 3, rot0: Math.PI, life: c.len - 160, fout: 200, glow: '#bfe4ff', glowR: 16 });
      line(fx, C.x - 18, C.y - 47, C.x + 18, C.y - 47, { w: 1.2, color: '#ffffff', glow: '#9ad8ff', draw: 160, hold: 80, life: 340, flare: 120, delay: 80 });
      glitter(fx, C.x + 18, C.y - 47, { n: 5, spread: 4, colors: ['#ffffff'], dur: 80, delay: 200, size: 6 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 22, WHITE);
        prop(fx, 'shield', t.x, t.y - 12, { s: 1.4, color: '#bfe4ff', life: c.len - c.hit - 40, fout: 260, delay: d + c.hit - 60 });
        k.shockwave(t.x, t.y - 10, { r0: 30, r1: 6, color: '#ffffff', w: 1.6, delay: d + c.hit - 80, life: 260 });
        glitter(fx, t.x, t.y - 12, { n: per(c, 18), spread: 18, colors: ['#ffffff', '#bfe4ff'], dur: 400, delay: d + c.hit });
        k.particles(t.x, t.y - 8, { colors: WHITE, n: per(c, 14), speed: 50, ang: -Math.PI / 2, spread: 0.7, delay: d + c.hit, life: 380 });
      });
    },
  },
  // ───── 竜巻閃・嵐: 回転の 斬撃が 3回 つづいて 白い 竜巻に なり 敵ぜんぶを まきこむ → 木の葉と ちり ─────
  ax_ryukansen_arashi: {
    charge: blade,
    sfx: 'ax_g3_arashi',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.38, life: c.len - 80, fin: 0, fout: 300 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 58, WHITE);
        const s = c.sz;
        for (let j = 0; j < 3; j++) ribbon(fx, arcPts(t.x, t.y + 10 - j * 10 * s, (18 + j * 6) * s, Math.PI * 0.5 + j, Math.PI * 2.4 + j, 22, 0.35), { style: 'wind', w: 4.5, draw: 160, hold: 60, life: 320, delay: d + j * 110 });
        tornado(fx, t.x, t.y + 18 * s, { h: 64 * s, r0: 6 * s, r1: 24 * s, rise: 200, life: c.len - 200 - d, fout: 300, leaves: c.n > 2 ? 6 : 12, rings: 9, delay: d + 260 });
        hitW(fx, c, t, i, d + c.hit, { n: 22 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 20), speed: 150, delay: d + c.hit, life: 380 });
        k.debris(t.x, t.y + 12, { n: per(c, 10), colors: ['#6ab040', '#c8a040', '#a08060'], shape: 'petal', up: 140, g: 160, delay: d + c.hit + 100 });
        glitter(fx, t.x, t.y - 10, { n: per(c, 16), spread: 26, colors: WHITE, dur: 500, delay: d + 260 });
      });
      k.shake(380, 2.2, c.hit);
    },
  },
  // ───── お茶にするでござる（味方）: 湯のみと 湯気・桜の 花びら → 回復 ─────
  ax_ocha: {
    charge: { color: '#7ac87a', color2: '#ffffff' },
    sfx: 'ax_g3_tea',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      prop(fx, 'cup', C.x, C.y - 34, { s: 2.5, life: c.len - 100, fout: 200, glow: '#ffe8c8', glowR: 14 });
      k.petals(C.x, C.y - 40, { n: 16, spread: 70, delay: 60, life: 700 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 14, HEAL);
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 26, delay: d + c.hit, life: 360, alpha: 0.8 });
        k.petals(t.x, t.y - 20, { n: per(c, 8), spread: 18, delay: d + c.hit, life: 460 });
        glitter(fx, t.x, t.y - 12, { n: per(c, 12), spread: 16, colors: ['#ffffff', '#ffd0e4', '#c8ffe0'], dur: 300, delay: d + c.hit });
        k.particles(t.x, t.y - 6, { colors: HEAL, n: per(c, 14), speed: 50, ang: -Math.PI / 2, spread: 0.7, delay: d + c.hit, life: 380 });
      });
    },
  },
  // ───── 竜巻閃・旋: 回転の 輪（つむじ風）が 敵から 敵へ うつる → 敵ごとに 弧の 斬撃 ─────
  ax_ryukansen_tsumuji: {
    charge: blade,
    sfx: 'ax_g3_tsumuji',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      k.dim({ a: 0.38, life: c.len - 80, fin: 0, fout: 300 });
      let px = o.x, py = o.y;
      // つむじ風の 通り道（敵から 敵へ）
      const way = [[o.x, o.y], ...[...c.targets].map((t, j) => [t.x + (j % 2 ? 6 : -6), t.y + 10])];
      ribbon(fx, way, { style: 'wind', w: 5, draw: c.hit + c.stagger * (c.n - 1), hold: 120, life: c.hit + c.stagger * (c.n - 1) + 360 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 64, WHITE);
        const s = c.sz;
        const st = i === 0 ? 0 : d - c.stagger;
        tornado(fx, px, py + 12, { to: { x: t.x, y: t.y + 14 }, travel: i === 0 ? c.hit - 20 : c.stagger, moveAt: 0, h: 34 * s, r0: 5, r1: 16 * s, rise: 80, life: (i === 0 ? c.hit : c.stagger) + 160, fout: 160, rings: 7, leaves: 4, delay: st });
        ribbon(fx, arcPts(t.x, t.y, 24 * s, i % 2 ? 0.7 : -2.4, i % 2 ? 2.8 : -0.3, 14), { style: 'blade', w: 5.5 * s, draw: 110, hold: 100, life: 340, delay: d + c.hit - 50 });
        ribbon(fx, arcPts(t.x, t.y + 6, 20 * s, Math.PI * 0.5, Math.PI * 2.5, 20, 0.4), { style: 'wind', w: 3.5, draw: 160, hold: 60, life: 320, delay: d + c.hit - 100 });
        hitW(fx, c, t, i, d + c.hit, { n: 24, rings: 2 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 22), speed: 160, delay: d + c.hit, life: 380 });
        glitter(fx, t.x, t.y, { n: per(c, 14), spread: 22, colors: WHITE, dur: 300, delay: d + c.hit + 40 });
        px = t.x; py = t.y;
      });
      k.shake(300, 2.1, c.hit);
    },
  },
  // ───── 九頭竜閃（Lv10）: 9つの 方向から 同時に 白い すじが 中心へ（先に 小さな 竜の あたまの 光）→ 大きな 白い 星 ─────
  ax_kuzuryusen: {
    charge: { ...blade, power: 1.25 },
    sfx: 'ax_g3_kuzu',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.45, life: c.len - 60, fin: 0, fout: 320 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 32, WHITE);
        const s = c.sz * (i ? 0.75 : 1);
        const R = 58 * s;
        const h = d + c.hit;
        // 上・右上・右・右下・下・左下・左・左上・まっすぐ 突き
        for (let j = 0; j < 9; j++) {
          const a = j < 8 ? -Math.PI / 2 + (j / 8) * Math.PI * 2 : Math.PI * 0.62;
          const rr = j < 8 ? R : R * 1.25;
          const x0 = t.x + Math.cos(a) * rr, y0 = t.y + Math.sin(a) * rr * 0.85;
          line(fx, x0, y0, t.x, t.y, { w: (j === 8 ? 3 : 2.2) * s, color: '#ffffff', glow: '#7ac8ff', draw: c.hit - 40, hold: 160 + j * 70, life: c.hit + 240 + j * 80, delay: d + 40, tip: 'blade', tipS: 3.4 * s, keepTail: true });
        }
        fx.star(t.x, t.y, '#ffffff', 40 * s, h, 320);
        hitW(fx, c, t, i, h, { n: 30, rings: 3, r: 18 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 30), speed: 220, delay: h, life: 460, len: 9 });
        glitter(fx, t.x, t.y, { n: per(c, 24), spread: R * 0.7, colors: WHITE, dur: 600, delay: h + 60 });
      });
      k.speedLines(c.t.x, c.t.y, { color: '#e8f4ff', delay: c.hit - 120, life: 220, r1: 170, n: 22 });
      k.flash('#ffffff', 120, c.hit);
      k.shake(440, 3, c.hit);
    },
  },
  // ───── 竜巻閃・こがらし（ひらめき）: 回転の 斬撃に 冷たい 風（水色の すじ・枯れ葉）→ 水色の 弧 ─────
  ax_ryukansen_kogarashi: {
    charge: { color: '#7ad8ff', color2: '#e6fbff' },
    sfx: 'ax_g3_kogarashi',
    allyFx: 'ice',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.38, life: c.len - 80, fin: 0, fout: 300 });
      k.streaks({ ang: 0.15, color: '#9ae6ff', n: 30, delay: 0, life: c.len - 200, speed: 0.6, alpha: 0.55 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 62, COLD);
        const s = c.sz;
        ribbon(fx, arcPts(t.x, t.y + 6, 30 * s, Math.PI * 0.5, Math.PI * 2.6, 28, 0.42), { style: 'cold', w: 6, draw: c.hit - 100, hold: 80, life: c.hit + 200, delay: d });
        tornado(fx, t.x, t.y + 16 * s, { h: 46 * s, r0: 6, r1: 22 * s, rise: 200, life: c.len - 160, fout: 300, style: 'cold', leaves: c.n > 2 ? 6 : 14, leafCols: ['#c8803a', '#a0602a', '#e8a050'], rings: 8, delay: d + 60 });
        ribbon(fx, arcPts(t.x, t.y, 28 * s, -2.5, 0.6, 16), { style: 'cold', w: 7 * s, draw: 130, hold: 120, life: 420, delay: d + c.hit - 60 });
        hitBurst(fx, t.x, t.y, { r: 15 * s, glow: '#7ad8ff', colors: ['#ffffff', '#9ae6ff', '#e6fbff'], n: per(c, 26), delay: d + c.hit, heavy: i === 0, rings: 2 });
        k.shapes(t.x, t.y, { shape: 'flake', n: per(c, 10), colors: ['#ffffff', '#9ae6ff'], speed: 70, size: 2.4, delay: d + c.hit, life: 500 });
        k.debris(t.x, t.y - 20, { n: per(c, 12), colors: ['#c8803a', '#a0602a', '#e8a050'], shape: 'petal', up: 60, g: 80, spread: 2.5, delay: d + c.hit + 60 });
        glitter(fx, t.x, t.y, { n: per(c, 14), spread: 30, colors: ['#ffffff', '#9ae6ff'], dur: 500, delay: d + c.hit + 60 });
      });
      k.shake(340, 2.2, c.hit);
    },
  },
  // ───── 神速の太刀（飛天 Lv1）: 一しゅん 画面が とまって → 画面の はしから はしまで 長い 一閃 → あとから 白い 線が 光る ─────
  ax_shinsoku_tachi: {
    charge: blade,
    sfx: 'ax_g3_shinsoku',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.45, life: c.len - 60, fin: 0, fout: 300 });
      k.tint('#ffffff', { a: 0.25, life: 180, fin: 20, fout: 80 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 48, WHITE);
        const s = c.sz;
        const y0 = t.y + 10, y1 = t.y - 8;
        const h = d + c.hit;
        line(fx, -10, y0 + 10, c.W + 10, y1 - 10, { w: 2.4 * s, color: '#ffffff', glow: '#9ad8ff', draw: 60, hold: 360, life: 760, flare: 300, delay: h - 30 });
        // 残像 3つ
        for (let j = 0; j < 3; j++) ghost(fx, lerpN(20, c.W - 20, (j + 0.5) / 3), lerpN(y0 + 10, y1 - 10, (j + 0.5) / 3) + 14, { s: 1.1, pose: 'iai', alpha: 0.45 - j * 0.1, life: 360, fout: 260, delay: h - 30 + j * 20 });
        k.streaks({ ang: Math.atan2(y1 - y0 - 20, c.W + 20), color: '#ffffff', n: 16, delay: h - 30, life: 200, alpha: 0.5 });
        hitW(fx, c, t, i, h, { n: 28, rings: 2, r: 16 });
        fx.cut(t.x, t.y, { ang: -0.12, len: 50 * s, w: 3, color: '#ffffff', glow: '#9ad8ff', delay: h + 290, life: 260 });
        hitBurst(fx, t.x, t.y, { r: 12 * s, glow: '#ffffff', colors: WHITE, n: per(c, 20), delay: h + 300, star: false });
        glitter(fx, t.x, t.y, { n: per(c, 20), spread: 60, sy: 0.15, colors: WHITE, dur: 400, delay: h + 300 });
      });
      k.shake(160, 1.6, c.hit);
      k.shake(300, 2.4, c.hit + 300);
    },
  },
  // ───── 白いマントをぬぐ（自分）: 白い マント（赤い うら）が ひるがえって 画面の 上へ → 白い 衝撃の 輪・地面の 石が 浮く ─────
  ax_mantle_nugu: {
    charge: blade,
    sfx: 'ax_g3_mantle',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'night', { a: 0.6, life: c.len - 60, fin: 160, fout: 360 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 22, WHITE);
        const my = t.y - 22;
        prop(fx, 'mantle', t.x, my, { s: 1.6, life: c.hit + 300, fout: 200, delay: d, to: { x: t.x + 40, y: -40 }, travel: c.hit + 300, ease: 'in', spin: 1.2 });
        ghost(fx, t.x, t.y + 10, { s: 1.6, pose: 'stand', color: '#ffffff', alpha: 0.5, life: c.len - c.hit, fout: 300, delay: d + c.hit - 100 });
        fx.glow(t.x, t.y - 8, { color: '#bfe4ff', r: 44, delay: d + c.hit, life: 500, alpha: 0.9 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 150, color: '#ffffff', w: 3, n: 3, gap: 110, delay: d + c.hit, life: 520 });
        k.shockwave(t.x, t.y + 12, { r0: 8, r1: 90, sy: 0.3, color: '#e8f4ff', w: 2, n: 2, gap: 120, delay: d + c.hit });
        for (let j = 0; j < per(c, 14); j++) fx.add({ kind: 'axShape', shape: 'rock', x: t.x + (j - 7) * 9 + Math.sin(j) * 4, y: t.y + 14, vx: 0, vy: -20 - (j % 4) * 8, g: 0, drag: 1, color: ROCK[j % 3], size: 1.4 + (j % 3) * 0.6, rot0: j, spin: 2, delay: d + c.hit + 40, life: 700, add: false, pop: false });
        glitter(fx, t.x, t.y - 20, { n: per(c, 24), spread: 50, colors: ['#ffffff', '#bfe4ff'], dur: 700, delay: d + c.hit });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 24), speed: 150, delay: d + c.hit, life: 420 });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(500, 3, c.hit);
    },
  },
  // ───── 飛天の大竜巻: 画面の まん中に 大きな 白い 竜巻が 立って 敵ぜんぶを もちあげる → おとす（地面に 輪） ─────
  ax_hiten_ootatsumaki: {
    charge: { ...blade, power: 1.2 },
    sfx: 'ax_g3_ootatsu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'wind', { a: 0.6, life: c.len - 60, fin: 160, fout: 360 });
      const base = c.fromAlly ? Math.min(c.H - 4, C.y + 40) : c.H - 2;
      tornado(fx, C.x, base, { h: base + 8, r0: 10, r1: Math.max(70, 40 + c.n * 16), rise: 360, life: c.len - 100, fout: 400, rings: 14, lw: 2, leaves: 24, spin: 2.6 });
      tornado(fx, C.x, base, { h: base * 0.8, r0: 6, r1: Math.max(44, 26 + c.n * 10), rise: 300, life: c.len - 200, fout: 360, rings: 10, lw: 1.2, spin: -3.2, alpha: 0.7, delay: 80 });
      k.streaks({ ang: -Math.PI / 2, color: '#e8f4ff', n: 26, delay: 100, life: c.len - 400, speed: 1.2, alpha: 0.4 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 80, WHITE);
        const s = c.sz;
        const h = d + c.hit;
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 22), speed: 160, ang: -Math.PI / 2, spread: 0.5, delay: h - 200, life: 400, len: 9 });
        hitW(fx, c, t, i, h, { n: 24, rings: 2, r: 15 });
        // おちて 地面に 輪
        const foot = t.y + 18 * s;
        hitBurst(fx, t.x, foot, { r: 12 * s, glow: '#e8f4ff', colors: ROCK, n: per(c, 20), delay: h + 520, heavy: i === 0, star: false });
        k.shockwave(t.x, foot, { r0: 6, r1: 50 * s, sy: 0.3, color: '#e8f4ff', w: 2.4, n: 2, gap: 90, delay: h + 520 });
        k.debris(t.x, foot, { n: per(c, 14), up: 120, delay: h + 530 });
        glitter(fx, t.x, t.y - 20, { n: per(c, 16), spread: 30, colors: WHITE, dur: 600, delay: h - 100 });
      });
      k.shake(400, 2.2, c.hit);
      k.shake(500, 3.4, c.hit + 520);
    },
  },
  // ───── 生きようとする心（味方）: 味方 1人ずつの むねに 白い 光が ともり 強く 光る → 回復 ─────
  ax_ikiyou_kokoro: {
    charge: { color: '#ffe8c8', color2: '#ffffff' },
    sfx: 'ax_g3_ikiyou',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'night', { a: 0.5, life: c.len - 60, fin: 200, fout: 380, mx: c.W * 0.5, my: 26, mr: 15 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 50, HEAL);
        const cy = t.y - 10;
        for (let j = 0; j < 3; j++) fx.glow(t.x, cy, { color: '#ffffff', r: 10 + j * 8, delay: d + j * 160, life: 220, alpha: 0.9 });
        k.shockwave(t.x, cy, { r0: 4, r1: 24, color: '#ffffff', w: 1.4, n: 2, gap: 160, delay: d });
        fx.glow(t.x, cy, { color: '#ffe8c8', r: 46, delay: d + c.hit, life: 520, alpha: 1 });
        k.pillar(t.x, t.y + 6, { w: 8, color: '#ffffff', glow: '#ffe8c8', delay: d + c.hit, life: 420, burst: false, alpha: 0.55 });
        glitter(fx, t.x, cy, { n: per(c, 26), spread: 22, colors: ['#ffffff', '#ffe8c8', '#c8ffe0'], dur: 600, delay: d + c.hit, vy: -20 });
        k.particles(t.x, cy, { colors: HEAL, n: per(c, 22), speed: 70, delay: d + c.hit, life: 420 });
      });
    },
  },
  // ───── 先を読む目: 目の きらり → 敵ぜんぶの 前に 次の 動きの 白い 点線（よそくの 線）→ 下向きの やじるし ─────
  ax_saki_wo_yomu: {
    charge: blade,
    sfx: 'ax_g3_yomi',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'night', { a: 0.55, life: c.len - 60, fin: 160, fout: 360, cloud: true });
      prop(fx, 'eye', c.W / 2, 26, { s: 3, color: '#7ac8ff', life: 600, fout: 200, glow: '#9ad8ff', glowR: 10 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 112, WHITE);
        const s = c.sz;
        // よそくの 点線（まえに のびて 消える）
        for (let k2 = 0; k2 < 2; k2++) {
          const a = (k2 ? -0.5 : 0.6) + (i % 2 ? 0.3 : 0);
          for (let j = 0; j < 5; j++) {
            const u0 = 12 + j * 10, u1 = u0 + 6;
            line(fx, t.x + Math.cos(a) * u0 * s, t.y + Math.sin(a) * u0 * s, t.x + Math.cos(a) * u1 * s, t.y + Math.sin(a) * u1 * s, { w: 1.8, color: '#ffffff', glow: '#7ac8ff', draw: 30, hold: 260, life: 440, delay: d + 200 + j * 40 + k2 * 60, keepTail: true });
          }
        }
        hitBurst(fx, t.x, t.y, { r: 12 * s, glow: '#9ad8ff', colors: WHITE, n: per(c, 22), delay: d + c.hit, heavy: i === 0 });
        prop(fx, 'arrow', t.x, t.y - 22 * s, { s: 1.6, dir: 1, color: '#8a9aff', life: 420, fout: 160, vy: 20, delay: d + c.hit + 40 });
        prop(fx, 'arrow', t.x + 10, t.y - 14 * s, { s: 1.1, dir: 1, color: '#8a9aff', life: 380, fout: 160, vy: 24, delay: d + c.hit + 120 });
        glitter(fx, t.x, t.y, { n: per(c, 22), spread: 26, colors: ['#ffffff', '#9ad8ff'], dur: 500, delay: d + 100 });
        fx.sparks(t.x, t.y, { colors: ['#8a9aff', '#ffffff'], n: per(c, 20), speed: 60, ang: Math.PI / 2, spread: 0.6, delay: d + c.hit + 40, life: 420 });
      });
      k.shake(240, 1.6, c.hit);
    },
  },
  // ───── 天翔龍閃（看板・伝説）: 左足の ふみこみ → 神速の 一閃（金白の 巨大な 弧。先に 竜）→ 真空に すいよせ → 2撃目 ─────
  ax_amakakeru: {
    charge: { color: '#ffe8a0', color2: '#ffffff', power: 1.25 },
    sfx: 'ax_g3_amakakeru',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const C = c.center;
      const T = c.targets;
      const xs = T.map((t) => t.x);
      const x0 = Math.min(...xs) - 60, x1 = Math.max(...xs) + 60;
      const up = c.fromAlly ? 1 : -1;
      const first = 120, second = c.hit;
      bg(fx, 'night', { a: 0.66, life: c.len - 40, fin: 120, fout: 380, mr: 16, cloud: true });
      // 左足の ふみこみ
      fx.glow(o.x - 6, o.y + 4, { color: '#ffe8a0', r: 20, life: 260, alpha: 1 });
      k.shockwave(o.x - 6, o.y + 6, { r0: 4, r1: 46, sy: 0.3, color: '#ffffff', w: 2.4, n: 2, gap: 60 });
      // 1撃目: 神速の 金白の 弧（先に 竜の あたま）。敵の まえを とおる
      const arc = [[x0 - 30, C.y + up * 30], [x0 + 20, C.y + up * 14], [C.x, C.y + up * 4], [x1 - 20, C.y - up * 10], [x1 + 30, C.y - up * 34]];
      ribbon(fx, arc, { style: { dark: '#c89a30', main: '#fff0b0', light: '#ffffff', core: '#ffffff', glow: '#ffd66b' }, w: 9, draw: 160, hold: 220, life: 560, delay: first - 60 });
      dragon(fx, arc.map(([x, y]) => [x, y - up * 8]), { style: { dark: '#a07818', main: '#ffe8a0', light: '#ffffff', core: '#ffffff', glow: '#fff0b0', eye: '#ff6a2a' }, w: 9, hs: 1.35, body: 150, travel: 260, life: 520, fout: 200, amp: 4, wl: 44, ease: 'lin', delay: first - 70 });
      // 真空の うず
      ribbon(fx, arcPts(C.x, C.y, 80, 0, -Math.PI * 3.2, 40, 0.5).map(([x, y], j) => [lerpN(x, C.x, j / 40 * 0.85), lerpN(y, C.y, j / 40 * 0.85)]), { style: 'wind', w: 6, draw: second - first - 260, hold: 60, life: second - first - 160, delay: first + 220 });
      k.streaks({ ang: Math.atan2(-up * 64, x1 - x0), color: '#ffffff', n: 20, delay: first - 60, life: 220, alpha: 0.55 });
      k.flash('#fff6d0', 90, first);
      // 真空: 内向きの すじ・すいよせ
      k.speedLines(C.x, C.y, { color: '#e8f4ff', delay: first + 220, life: second - first - 220, r0: 10, r1: 170, n: 26 });
      c.each((t, i, d) => {
        fx.converge(C.x, C.y, { colors: ['#ffffff', '#bfe4ff'], n: per(c, 12), r: 70, delay: first + 260 + d, life: 300 });
        fx.sparks(t.x, t.y, { colors: WHITE, n: per(c, 6), speed: 60, ang: Math.atan2(C.y - t.y, C.x - t.x), spread: 0.3, delay: first + 300, life: 300 });
      });
      fx.swirl(C.x, C.y, ['#ffffff', '#bfe4ff', '#9ad8ff'], { n: 20, rad: 34, h: 10, delay: first + 280, life: second - first - 280 });
      // 2撃目: 白い 大きな 斬撃
      const R2 = Math.max(70, (x1 - x0) / 2);
      const sw = Math.max(40, R2 * 0.5);
      ribbon(fx, [[x1 + 30, C.y - up * 34], [C.x + sw * 0.5, C.y + up * 6], [C.x - sw * 0.5, C.y + up * 8], [x0 - 30, C.y - up * 26]], { style: 'blade', w: 9, draw: 120, hold: 220, life: 560, flare: 140, delay: second - 70 });
      line(fx, x0 - 20, C.y + 6, x1 + 20, C.y - 6, { w: 3, color: '#ffffff', glow: '#bfe4ff', draw: 60, hold: 200, life: 420, flare: 100, delay: second - 30 });
      c.each((t, i, d) => {
        const s = c.sz;
        const h = second + d;
        blast(fx, t.x, t.y, { r: 22 * s, glow: '#bfe4ff', core: '#ffffff', colors: WHITE, n: per(c, 34), smoke: '#c8d8e8', heavy: i === 0, delay: h, flash: false });
        k.shockwave(t.x, t.y, { r0: 10, r1: 90 * s, color: '#ffffff', w: 3, n: 3, gap: 80, delay: h });
        fx.sparks(t.x, t.y, { colors: GOLD, n: per(c, 24), speed: 220, delay: h, life: 440, len: 9 });
      });
      // 余韻: 桜の 花びらと 白い 羽
      k.petals(C.x, 10, { n: c.n > 2 ? 14 : 22, spread: 110, delay: second + 120, life: 700, rise: 10 });
      k.shapes(C.x, 6, { shape: 'petal', n: c.n > 2 ? 10 : 18, colors: ['#ffffff', '#f0f4ff'], speed: 30, ang: Math.PI / 2, spread: 1.2, g: 30, size: 2.6, spin: 6, delay: second + 160, life: 640, add: false });
      glitter(fx, C.x, C.y, { n: c.n > 2 ? 20 : 34, spread: 100, colors: ['#ffffff', '#fff0a0'], dur: 600, delay: second + 80 });
      k.flash('#ffffff', 180, second);
      k.shake(700, 3.8, second);
    },
  },
  // ───── 真・九頭竜閃（ひらめき）: 9方向の すじが 金色の 9ひきの 竜に なって いっせいに → 中心で 金の 大爆発 → 金の すじ ─────
  ax_kuzuryusen_shin: {
    charge: { color: '#ffd23a', color2: '#fff6d0', power: 1.25 },
    sfx: 'ax_g3_shinkuzu',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'night', { a: 0.66, life: c.len - 40, fin: 120, fout: 380, cloud: true });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 64, GOLD);
        const s = c.sz * (i ? 0.7 : 1);
        const R = 70 * s;
        const h = d + c.hit;
        for (let j = 0; j < 9; j++) {
          if (c.n > 2 && i > 0 && j % 2) continue;
          const a = j < 8 ? -Math.PI / 2 + (j / 8) * Math.PI * 2 : Math.PI * 0.62;
          const rr = j < 8 ? R : R * 1.2;
          const sx = t.x + Math.cos(a) * rr, sy = t.y + Math.sin(a) * rr * 0.8;
          const bend = (j % 2 ? 1 : -1) * 10 * s;
          const mx = (sx + t.x) / 2 - Math.sin(a) * bend, my = (sy + t.y) / 2 + Math.cos(a) * bend;
          dragon(fx, [[sx, sy], [mx, my], [t.x, t.y]], { style: 'gold', w: 4.4 * s, hs: 1.3, body: 46 * s, travel: c.hit - 40, life: c.hit + 60, fout: 80, amp: 2, wl: 24, ease: 'in', delay: d + 40 });
          line(fx, sx, sy, t.x, t.y, { w: 1.2, color: '#fff0a0', glow: '#ffd23a', draw: c.hit - 40, hold: 120 + j * 60, life: c.hit + 200 + j * 60, delay: d + 40, alpha: 0.6, keepTail: true });
        }
        blast(fx, t.x, t.y, { r: 30 * s, glow: '#ffd23a', core: '#ffffff', colors: GOLD, n: per(c, 40), smoke: '#8a6a20', heavy: i === 0, delay: h });
        k.shockwave(t.x, t.y, { r0: 10, r1: 110 * s, color: '#ffd23a', w: 3.4, n: 3, gap: 80, delay: h });
        fx.star(t.x, t.y, '#fff6b0', 50 * s, h, 320);
        fx.sparks(t.x, t.y, { colors: GOLD, n: per(c, 30), speed: 240, delay: h, life: 480, len: 10 });
        glitter(fx, t.x, t.y, { n: per(c, 20), spread: R * 0.8, colors: GOLD, dur: 700, delay: h + 80 });
      });
      k.streaks({ ang: -0.3, color: '#ffd23a', n: 20, delay: c.hit + 100, life: 500, speed: 1, alpha: 0.5 });
      k.flash('#fff6d0', 160, c.hit);
      k.shake(640, 3.8, c.hit);
    },
  },
  // ───── 大土竜閃（ひらめき）: 刀が 地面を 斬り、地面が 割れて 岩の 柱が 順番に 立つ 波が 敵ぜんぶへ → がれき・ゆれ ─────
  ax_dai_doryusen: {
    charge: blade,
    sfx: 'ax_g3_daidoryu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      bg(fx, 'night', { a: 0.6, life: c.len - 40, fin: 120, fout: 380 });
      const gx = o.x, gy = c.fromAlly ? o.y - 2 : o.y + 18;
      line(fx, gx - 14, gy - 20, gx + 8, gy + 4, { w: 2.4, color: '#ffffff', glow: '#e8c89a', draw: 50, hold: 80, life: 240 });
      fx.crack(gx, gy, { n: 7, len: 26, delay: 40 });
      k.shockwave(gx, gy, { r0: 6, r1: 60, sy: 0.3, color: '#e8c89a', w: 2.4, n: 2, gap: 80, delay: 40 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 94, ROCK);
        const s = c.sz;
        const foot = t.y + 16 * s;
        const n = 5;
        for (let j = 0; j < n; j++) {
          const u = (j + 1) / n;
          const px = lerpN(gx, t.x, u), py = lerpN(gy, foot, u);
          const at = d + 60 + Math.round((c.hit - 60) * u);
          prop(fx, 'rockpillar', px, py, { s: 0.8 + u * 0.7 * s, h: 18 + u * 14, w: 6 + u * 4, life: c.len - at - 120, fout: 260, delay: at, pop: false });
          fx.puff(px, py, { color: '#b8a890', r0: 3, r1: 12, vy: -16, life: 420, alpha: 0.5, delay: at });
          if (j % 2) fx.crack(px, py, { n: 3, len: 14, delay: at, life: 700 });
        }
        blast(fx, t.x, t.y, { r: 24 * s, glow: '#e8c89a', core: '#fff0d0', colors: ['#ffffff', '#e8c89a', '#a08060'], n: per(c, 30), smoke: '#6a5a4a', heavy: i === 0, delay: d + c.hit });
        k.debris(t.x, foot, { n: per(c, 22), up: 180, delay: d + c.hit + 20, size: 2 });
        k.shockwave(t.x, foot, { r0: 6, r1: 60 * s, sy: 0.3, color: '#e8c89a', w: 2.6, n: 2, gap: 90, delay: d + c.hit });
        glitter(fx, t.x, t.y, { n: per(c, 16), spread: 30, colors: ['#fff0d0', '#e8c89a'], dur: 500, delay: d + c.hit + 80 });
      });
      for (let j = 0; j < 4; j++) k.shake(120, 1.4 + j * 0.3, 80 + j * Math.round(c.hit / 4));
      k.shake(600, 3.6, c.hit);
    },
  },
};
