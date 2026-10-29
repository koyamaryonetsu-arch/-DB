// 第48回 G3: 鬼滅の刃（きさつ隊・炎柱・日の呼吸の使い手）の 大技の え
// 水の呼吸 … 青い 浮世絵の 波（しぶきの つめ・すじ）、炎の呼吸 … 赤〜オレンジの 炎の 刃と 炎の 竜・虎、
// 日の呼吸 … 赤い 日輪と 金の ふち（ヒノカミ神楽は 型を つなげて 最後に 大きな 日輪）
// 時間は shared/data/ax-time-g3.js（ここは 見た目だけ）。画面の 文字は ひらがな・記号だけ
import { G3_STYLE as ST, ribbon, dragon, line, sun, wheel, bg, prop, text, rain, embers, arcPts, spiralPts, per, hitBurst, blast, splashN, glitter } from './axfx-g3-kit.js?v=824fd873af63';

const WATER = ['#ffffff', '#8fd8ff', '#2f6fe8'];
const FIRE = ['#fff2a0', '#ffb040', '#ff6a1a', '#ff3a14'];
const SUN = ['#fff4b0', '#ffd23a', '#ff6a1a', '#e8201a'];
const HEAL = ['#c8ffe0', '#7dffb0', '#ffffff'];

// 出した 人の いち（味方は 画面の 下）
const src = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 10 : c.from.y });
// 横に 切る むき（出した 人から 見て）
const hdir = (c, t) => (t.x >= c.from.x - 4 ? 1 : -1);

const water = { color: '#3a8cff', color2: '#e0f4ff' };
const flame = { color: '#ff6a1a', color2: '#ffe08a' };
const sunC = { color: '#ff3a1a', color2: '#ffd23a' };

export const AX_G3_KIMETSU = {
  // ───── 壱ノ型 水面斬り: 水平の 一閃 ＋ 浮世絵の 波（先が くるりと まく） ─────
  ax_minamo_giri: {
    charge: water,
    sfx: 'ax_g3_water',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t), L = 54 * s;
        k.dash(o.x, o.y - 4, t.x - dir * L * 0.8, t.y + 4, { color: '#6ac8ff', travel: 160, w: 4, delay: d });
        ribbon(fx, [[t.x - dir * L, t.y + 1], [t.x - dir * L * 0.4, t.y + 5], [t.x + dir * L * 0.35, t.y + 3], [t.x + dir * L, t.y - 7]], { style: 'water', w: 7 * s, draw: 200, hold: 150, life: 500, side: -dir, curl: true, delay: d + c.hit - 40 });
        ribbon(fx, [[t.x - dir * L * 0.9, t.y + 10], [t.x, t.y + 13], [t.x + dir * L * 0.8, t.y + 8]], { style: 'water', w: 3.4 * s, draw: 240, hold: 120, life: 460, side: -dir, alpha: 0.75, clawGap: 15, delay: d + c.hit - 10 });
        line(fx, t.x - dir * L * 0.85, t.y + 3, t.x + dir * L * 0.85, t.y + 1, { w: 1.4, color: '#e8f8ff', glow: '#6ac8ff', draw: 60, hold: 120, life: 330, flare: 90, delay: d + c.hit - 25 });
        hitBurst(fx, t.x, t.y, { r: 14 * s, glow: '#6ac8ff', colors: WATER, n: per(c, 18), delay: d + c.hit, heavy: i === 0 });
        splashN(fx, t.x, t.y + 4, { delay: d + c.hit + 30, power: 1.1, n: per(c, 18) });
        k.shockwave(t.x, t.y + 10, { r0: 6, r1: 42 * s, sy: 0.3, color: '#bfe6ff', n: 2, gap: 100, delay: d + c.hit + 30 });
        k.particles(t.x, t.y, { colors: WATER, n: per(c, 26), speed: 150, delay: d + c.hit, life: 380 });
        rain(fx, t.x, t.y, { n: per(c, 8), delay: d + c.hit + 160, life: 420 });
      });
      k.shake(200, 1.6, c.hit);
    },
  },
  // ───── 全集中の呼吸: 白い 息・青い 波の 輪が 2重に ひろがって ちぢむ → 体の まわりに 水の 線 ─────
  ax_zenshuu: {
    charge: water,
    sfx: 'ax_g3_breath',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const s = c.fromAlly ? 1 : 0.8;
        const cy = t.y - 10;
        for (let b = 0; b < 3; b++) fx.puff(t.x + 2, cy - 12, { color: '#ffffff', r0: 2, r1: 10, vx: 12 + b * 6, vy: -16, life: 520, alpha: 0.55, delay: d + b * 90 });
        ribbon(fx, arcPts(t.x, cy + 6, 30 * s, Math.PI * 0.6, Math.PI * 2.55, 26, 0.42), { style: 'water', w: 4.6, draw: 220, hold: 140, life: 520, side: 1, delay: d + 40 });
        ribbon(fx, arcPts(t.x, cy + 6, 46 * s, Math.PI * 1.6, Math.PI * 3.55, 30, 0.42), { style: 'water', w: 3.6, draw: 240, hold: 120, life: 520, side: 1, alpha: 0.8, delay: d + 120 });
        ribbon(fx, spiralPts(t.x, cy + 14, 20 * s, 12 * s, 0, 1.6, 30, 0.38).map(([x, y], j) => [x, y - j * 1.2]), { style: 'water', w: 3, draw: 260, hold: 120, life: 480, side: -1, delay: d + c.hit - 60 });
        k.shockwave(t.x, cy + 6, { r0: 50 * s, r1: 8, sy: 0.42, color: '#8fd8ff', w: 1.6, n: 2, gap: 120, delay: d + 60, life: 380 });
        k.shockwave(t.x, cy + 6, { r0: 6, r1: 60 * s, sy: 0.42, color: '#e0f4ff', w: 2, delay: d + c.hit, life: 380 });
        fx.glow(t.x, cy, { color: '#6ac8ff', r: 30, delay: d + c.hit, life: 380, alpha: 0.8 });
        k.sparkles(t.x, cy - 6, { n: per(c, 8), r: 20, colors: ['#ffffff', '#8fd8ff'], delay: d + c.hit, life: 320 });
        k.particles(t.x, cy, { colors: WATER, n: per(c, 22), speed: 90, delay: d + c.hit, life: 360 });
      });
    },
  },
  // ───── ひょうたんふき: ひょうたんが ふくらんで パン！ → 回復 ─────
  ax_hyoutan: {
    charge: { ...water, power: 0.7 },
    sfx: 'ax_g3_pop',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gx = t.x + 4, gy = t.y - 34;
        prop(fx, 'gourd', gx, gy, { s: 1.6, inflate: 0.9, life: c.hit + 10, fout: 10, delay: d });
        for (let b = 0; b < 4; b++) fx.puff(t.x - 6, t.y - 20, { color: '#ffffff', r0: 1.5, r1: 6, vx: 30, vy: -40, life: 260, alpha: 0.5, delay: d + b * 80 });
        k.debris(gx, gy, { n: per(c, 10), colors: ['#f0902a', '#c86a10', '#ffd08a'], up: 120, g: 260, delay: d + c.hit, size: 1.8 });
        fx.star(gx, gy, '#ffffff', 16, d + c.hit, 240);
        k.shockwave(gx, gy, { r0: 4, r1: 30, color: '#ffd08a', w: 2, delay: d + c.hit, life: 300 });
        k.particles(gx, gy, { colors: ['#ffffff', '#ffd08a'], n: per(c, 12), speed: 140, delay: d + c.hit, life: 300 });
        text(fx, 'パン!', gx, gy - 12, { size: 9, color: '#fff2a0', color2: '#8a3a0a', life: 300, delay: d + c.hit });
        k.sparkles(t.x, t.y - 12, { n: per(c, 8), colors: HEAL, r: 16, delay: d + c.hit + 80, life: 300 });
        k.particles(t.x, t.y - 6, { colors: HEAL, n: per(c, 10), speed: 50, ang: -Math.PI / 2, spread: 0.7, delay: d + c.hit + 60, life: 380 });
      });
    },
  },
  // ───── 打ち潮: 波の 帯が 弧を つないで 3回（つながった 刀の すじ）→ 敵ごとに しぶき ─────
  ax_uchishio: {
    charge: water,
    sfx: 'ax_g3_water3',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t), L = 50 * s;
        const pts = [];
        for (let j = 0; j <= 12; j++) { const u = j / 12; pts.push([t.x + dir * lerpN(-L, L, u), t.y - 14 * s * Math.sin(u * Math.PI * 3) + 2]); }
        ribbon(fx, pts, { style: 'water', w: 6 * s, draw: 320, hold: 120, life: 560, side: -dir, curl: true, delay: d + c.hit - 50 });
        ribbon(fx, pts.map(([x, y], j) => [x, y + 9 + Math.sin(j) * 1.5]), { style: 'water', w: 2.6 * s, draw: 360, hold: 80, life: 520, side: -dir, alpha: 0.7, clawGap: 14, delay: d + c.hit - 20 });
        for (let j = 0; j < 3; j++) {
          const u = (j + 0.5) / 3;
          const sx = t.x + dir * lerpN(-L, L, u) * 0.7, sy = t.y + (j % 2 ? 6 : -6) * s;
          const at = d + c.hit + j * 95;
          hitBurst(fx, sx, sy, { r: 10 * s, glow: '#6ac8ff', colors: WATER, n: per(c, 11), delay: at, heavy: i === 0 && j === 2 });
          splashN(fx, sx, sy + 4, { delay: at + 20, n: per(c, 9), power: 0.8 });
        }
        rain(fx, t.x, t.y, { n: per(c, 6), delay: d + c.hit + 320, life: 380 });
      });
      k.shake(160, 1.4, c.hit);
      k.shake(200, 1.7, c.hit + 190);
    },
  },
  // ───── ねじれ渦: 水の 大きな 渦巻きの 帯が 敵ぜんぶを まきこむ → しぶきの 輪 ─────
  ax_nejire_uzu: {
    charge: water,
    sfx: 'ax_g3_whirl',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const C = c.center;
      const R = c.all ? Math.min(96, 30 + c.n * 22) : 44 * c.sz;
      ribbon(fx, [[o.x, o.y], [lerpN(o.x, C.x, 0.5) - 20, lerpN(o.y, C.y, 0.5)], [C.x - R * 0.3, C.y + R * 0.2]], { style: 'water', w: 4, draw: 160, hold: 60, life: 300, side: 1 });
      ribbon(fx, spiralPts(C.x, C.y + 4, 8, R, Math.PI * 0.5, 1.7, 46, 0.45), { style: 'water', w: 7, draw: c.hit + 40, hold: 160, life: c.hit + 420, side: 1, curl: true, delay: 60 });
      ribbon(fx, spiralPts(C.x, C.y + 4, 6, R * 0.82, Math.PI * 1.5, 1.6, 40, 0.45), { style: 'water', w: 4.5, draw: c.hit + 60, hold: 120, life: c.hit + 380, side: 1, alpha: 0.85, delay: 110 });
      k.shockwave(C.x, C.y + 6, { r0: R, r1: 6, sy: 0.45, color: '#8fd8ff', w: 2, n: 2, gap: 120, delay: 60, life: 300 });
      c.each((t, i, d) => {
        const s = c.sz;
        hitBurst(fx, t.x, t.y, { r: 13 * s, glow: '#6ac8ff', colors: WATER, n: per(c, 30), delay: d + c.hit, heavy: i === 0 });
        splashN(fx, t.x, t.y + 6, { delay: d + c.hit + 30, n: per(c, 14), power: 1.1 });
        k.shockwave(t.x, t.y + 8, { r0: 6, r1: 34 * s, sy: 0.35, color: '#bfe6ff', n: 2, gap: 90, delay: d + c.hit + 50 });
        fx.swirl(t.x, t.y + 4, ['#ffffff', '#8fd8ff', '#2f6fe8'], { n: per(c, 14), rad: 18 * s, h: 26, delay: d + c.hit - 120, life: 460 });
      });
      rain(fx, C.x, C.y, { n: per(c, 12), spread: R, delay: c.hit + 220, life: 420 });
      k.shake(260, 1.8, c.hit);
    },
  },
  // ───── 生生流転（看板）: 青い 水の 竜が 2回 まわって 大きく なり かみつく → 大きな 水の 爆発 → しぶきの 雨 ─────
  ax_seisei_ruten: {
    charge: { ...water, power: 1.2 },
    sfx: 'ax_g3_wdragon',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.75 : 1);
        const side = t.x >= c.W / 2 ? -1 : 1;
        // 的の よこで 2回 まわって（大きく なりながら）かみつく
        const mx = t.x + side * 46 * s, my = c.fromAlly ? Math.min(t.y + 14, (o.y + t.y) / 2) : t.y - 30;
        const path = [[o.x, o.y], ...spiralPts(mx, my, 8 * s, 30 * s, Math.PI * 0.5, 2, 34, 0.7), [lerpN(mx, t.x, 0.5), my - 16], [t.x, t.y]];
        dragon(fx, path, { style: 'water', w: 9 * s, hs: 1.2, body: 100 * s, travel: c.hit - 20, life: c.hit + 160, fout: 140, amp: 3, wl: 34, grow: 0.45, ease: 'in', delay: d });
        ribbon(fx, spiralPts(mx, my, 12 * s, 36 * s, Math.PI * 0.5, 2, 30, 0.7), { style: 'water', w: 3 * s, draw: c.hit - 120, hold: 60, life: c.hit + 60, side: -1, alpha: 0.5, delay: d + 40 });
        const h = d + c.hit;
        blast(fx, t.x, t.y, { r: 20 * s, glow: '#6ac8ff', core: '#eaf8ff', colors: WATER, n: per(c, 24), smoke: '#bfe6ff', delay: h, heavy: i === 0 });
        splashN(fx, t.x, t.y, { delay: h + 20, n: per(c, 22), power: 1.6 });
        k.shockwave(t.x, t.y + 6, { r0: 8, r1: 64 * s, sy: 0.4, color: '#8fd8ff', w: 2.4, n: 3, gap: 90, delay: h + 40 });
        k.particles(t.x, t.y, { colors: WATER, n: per(c, 14), speed: 200, delay: h, life: 380 });
        rain(fx, t.x, t.y, { n: per(c, 16), spread: 50, delay: h + 180, life: 520 });
      });
      k.flash('#e0f4ff', 100, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // ───── 流流舞い（ひらめき）: 水の 帯が 敵から 敵へ ながれる（リボン）→ 敵ごとに 斬撃と しぶき・ながれる 足さばきの かげ ─────
  ax_ryuuryuu_mai: {
    charge: water,
    sfx: 'ax_g3_flow',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const ts = [...c.targets].map((t, i) => ({ ...t, i })).sort((a, b) => a.x - b.x);
      const pts = [[o.x, o.y - 4]];
      const first = ts[0], last = ts[ts.length - 1];
      pts.push([first.x - 34, first.y + 8]);
      ts.forEach((t, j) => { pts.push([t.x - 12, t.y - 12]); pts.push([t.x + 12, t.y + 10]); if (j < ts.length - 1) pts.push([(t.x + ts[j + 1].x) / 2, (t.y + ts[j + 1].y) / 2 - 16]); });
      pts.push([last.x + 36, last.y - 8]);
      const span = Math.max(1, ts.length);
      const draw = c.hit + c.stagger * (span - 1) + 120;
      ribbon(fx, pts, { style: 'water', w: 5.5, draw, hold: 140, life: draw + 360, side: -1, curl: true, delay: 0 });
      ribbon(fx, pts.map(([x, y]) => [x, y + 8]), { style: 'water', w: 2.4, draw: draw + 40, hold: 100, life: draw + 300, side: -1, alpha: 0.6, clawGap: 15, delay: 30 });
      c.each((t, i, d) => {
        const s = c.sz;
        const h = d + c.hit;
        prop(fx, 'swordsman', t.x - 22, t.y + 14, { s: 1, pose: 'slash', color: '#8fd8ff', blade: '#ffffff', add: true, alpha: 0.6, life: 260, fout: 160, delay: h - 80, to: { x: t.x + 20, y: t.y + 14 }, travel: 200, ease: 'lin' });
        k.slash(t.x, t.y, { r: 22 * s, w: 5, ang: i % 2 ? 0.7 : -0.6, color: '#bfe6ff', glow: '#3a8cff', core: '#ffffff', delay: h - 40, life: 300, after: 2 });
        hitBurst(fx, t.x, t.y, { r: 12 * s, glow: '#6ac8ff', colors: WATER, n: per(c, 26), delay: h, heavy: i === 0 });
        k.sparkles(t.x, t.y, { n: per(c, 12), r: 22, colors: ['#ffffff', '#8fd8ff'], delay: h + 60, life: 320 });
        splashN(fx, t.x, t.y + 4, { delay: h + 30, n: per(c, 14), power: 1 });
      });
      rain(fx, c.center.x, c.center.y, { n: per(c, 10), spread: 60, delay: draw, life: 380 });
      k.shake(180, 1.5, c.hit);
    },
  },
  // ───── 不知火（炎柱）: 地を はう 炎の すじ → 炎の 一閃（赤と 金）→ 炎の 輪 ─────
  ax_shiranui: {
    charge: flame,
    sfx: 'ax_g3_fire',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t);
        const gy = t.y + 14 * s;
        ribbon(fx, [[o.x, o.y + 2], [lerpN(o.x, t.x, 0.5), lerpN(o.y, gy, 0.6) + 4], [t.x - dir * 14, gy]], { style: 'flame', w: 4, draw: 180, hold: 80, life: 420, both: true, delay: d });
        for (let j = 0; j < 4; j++) { const u = (j + 1) / 5; k.flames(lerpN(o.x, t.x, u), lerpN(o.y, gy, u) + 4, { w: 10, h: 12, n: 3, delay: d + 40 + j * 40, life: 420, embers: false }); }
        ribbon(fx, arcPts(t.x - dir * 4, t.y + 30 * s, 36 * s, dir > 0 ? -2.5 : -0.64, dir > 0 ? -0.5 : -2.64, 14), { style: 'flame', w: 7.5 * s, draw: 150, hold: 120, life: 460, delay: d + c.hit - 50 });
        line(fx, t.x - dir * 30 * s, t.y + 12 * s, t.x + dir * 30 * s, t.y - 14 * s, { w: 1.6, color: '#fff2a0', glow: '#ff6a1a', draw: 50, hold: 120, life: 300, flare: 80, delay: d + c.hit - 20 });
        hitBurst(fx, t.x, t.y, { r: 14 * s, glow: '#ffa040', colors: FIRE, n: per(c, 28), delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y + 6, { r0: 6, r1: 40 * s, sy: 0.45, color: '#ff8a2a', w: 2.6, n: 2, gap: 90, delay: d + c.hit + 30 });
        k.flames(t.x, t.y + 12, { w: 26 * s, h: 26 * s, n: 5, delay: d + c.hit + 40, life: 460 });
        k.particles(t.x, t.y, { colors: FIRE, n: per(c, 16), speed: 160, delay: d + c.hit, life: 380 });
        embers(fx, t.x, t.y, { n: per(c, 10), delay: d + c.hit + 160, life: 420 });
      });
      k.shake(200, 1.7, c.hit);
    },
  },
  // ───── うまい！: お弁当・「うまい！」の 文字 2回・炎の きらきら → 回復 ─────
  ax_umai: {
    charge: { ...flame, power: 0.8 },
    sfx: 'ax_g3_umai',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const bx = t.x, by = t.y - 30;
        prop(fx, 'bento', bx, by, { s: 1.5, life: c.len - 120, fout: 200, delay: d, glow: '#ffd08a', glowR: 14 });
        text(fx, 'うまい!', bx - 26, by - 16, { size: 10, color: '#fff2a0', color2: '#a02a08', life: 420, fout: 120, delay: d + 80, rot0: -0.15 });
        text(fx, 'うまい!', bx + 26, by - 22, { size: 11, color: '#ffffff', color2: '#c83a08', life: 420, fout: 120, delay: d + c.hit, rot0: 0.15 });
        k.flames(bx, t.y + 6, { w: 40, h: 22, n: 6, delay: d + c.hit - 40, life: 460 });
        embers(fx, bx, by, { n: per(c, 14), spread: 24, delay: d + 60, life: 520 });
        k.sparkles(bx, by - 8, { n: per(c, 10), colors: ['#ffffff', '#ffd23a', '#ff8a2a'], r: 26, delay: d + c.hit, life: 320 });
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 30, delay: d + c.hit + 80, life: 380, alpha: 0.8 });
        k.particles(t.x, t.y - 4, { colors: HEAL, n: per(c, 14), speed: 60, ang: -Math.PI / 2, spread: 0.8, delay: d + c.hit + 80, life: 420 });
        k.shockwave(t.x, t.y + 6, { r0: 6, r1: 40, sy: 0.35, color: '#ffa040', delay: d + c.hit, n: 2 });
      });
    },
  },
  // ───── のぼり炎天: 下から 上へ 大きな 半円の 炎の 刃 → 炎が 上へ → 火の粉が ふる ─────
  ax_nobori_enten: {
    charge: flame,
    sfx: 'ax_g3_fireup',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.4, life: c.len - 100, fin: 0, fout: 300 });
      c.each((t, i, d) => {
        const s = c.sz, dir = hdir(c, t);
        const R = 40 * s;
        // 下 → まえ → 上（半円）
        const a0 = Math.PI / 2, a1 = dir > 0 ? -Math.PI / 2 : Math.PI * 1.5;
        ribbon(fx, arcPts(t.x - dir * 10 * s, t.y, R, dir > 0 ? a0 : a0, dir > 0 ? a1 - 0.2 : a1 + 0.2, 20), { style: 'flame', w: 11 * s, draw: 230, hold: 160, life: 600, delay: d + c.hit - 90 });
        ribbon(fx, arcPts(t.x - dir * 10 * s, t.y, R * 0.7, a0, dir > 0 ? a1 : a1, 16), { style: 'flame', w: 5 * s, draw: 260, hold: 100, life: 540, alpha: 0.7, delay: d + c.hit - 60 });
        const h = d + c.hit;
        hitBurst(fx, t.x, t.y, { r: 16 * s, glow: '#ffa040', colors: FIRE, n: per(c, 18), delay: h, heavy: i === 0 });
        k.flames(t.x, t.y + 12, { w: 30 * s, h: 44 * s, n: 6, delay: h + 30, life: 560 });
        fx.sparks(t.x, t.y, { colors: FIRE, n: per(c, 36), speed: 190, ang: -Math.PI / 2, spread: 0.45, g: 40, delay: h, life: 480, len: 9 });
        glitter(fx, t.x, t.y - 30 * s, { n: per(c, 12), spread: 30, colors: ['#fff2a0', '#ffb040'], dur: 400, delay: h + 80 });
        k.shockwave(t.x, t.y + 10, { r0: 8, r1: 54 * s, sy: 0.35, color: '#ff8a2a', w: 2.6, n: 2, gap: 100, delay: h + 40 });
        embers(fx, t.x, t.y - 50, { n: per(c, 29), spread: 40, up: false, life: 560 , delay: h + 260 });
      });
      k.flash('#ffd0a0', 90, c.hit);
      k.shake(340, 2.3, c.hit);
    },
  },
  // ───── 盛炎のうねり: 体の 前で 大きな 炎の うずが まわりながら 横に ひろがり 敵ぜんぶを のみこむ → 炎の 壁 ─────
  ax_seien_uneri: {
    charge: flame,
    sfx: 'ax_g3_firewhirl',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const R = c.all ? Math.min(104, 34 + c.n * 22) : 50 * c.sz;
      k.dim({ a: 0.42, life: c.len - 100, fin: 0, fout: 300 });
      ribbon(fx, spiralPts(C.x, C.y + 6, 6, R, -Math.PI * 0.5, 1.5, 44, 0.42), { style: 'flame', w: 9, draw: c.hit + 40, hold: 200, life: c.hit + 520 });
      ribbon(fx, spiralPts(C.x, C.y + 6, 4, R * 0.85, Math.PI * 0.5, 1.4, 40, 0.42), { style: 'flame', w: 6, draw: c.hit + 80, hold: 140, life: c.hit + 460, alpha: 0.85, delay: 40 });
      fx.glow(C.x, C.y, { color: '#ff6a1a', r: R, delay: c.hit, life: 520, alpha: 0.7 });
      // 炎の 壁
      const n = c.all ? 8 : 5;
      for (let j = 0; j < n; j++) {
        const u = n > 1 ? j / (n - 1) : 0.5;
        k.flames(C.x + (u - 0.5) * R * 2, C.y + 14, { w: 22, h: 36 + 10 * Math.sin(j * 1.7), n: 4, delay: c.hit + 40 + Math.abs(u - 0.5) * 160, life: 600, embers: j % 2 === 0 });
      }
      c.each((t, i, d) => {
        const s = c.sz, h = d + c.hit;
        hitBurst(fx, t.x, t.y, { r: 14 * s, glow: '#ffa040', colors: FIRE, n: per(c, 18), delay: h, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: FIRE, n: per(c, 34), speed: 170, delay: h, life: 420 });
        k.shockwave(t.x, t.y + 8, { r0: 6, r1: 40 * s, sy: 0.4, color: '#ff8a2a', w: 2.4, n: 2, gap: 90, delay: h + 30 });
      });
      embers(fx, C.x, C.y - 10, { n: per(c, 32), spread: R, life: 520 , delay: c.hit + 380 });
      k.flash('#ffd0a0', 90, c.hit);
      k.shake(380, 2.4, c.hit);
    },
  },
  // ───── 心を燃やせ（味方）: 味方の むねに 炎・大きな 炎の 柱が 上へ・金の 火の粉 → 炎の 輪で つながる ─────
  ax_kokoro_moyase: {
    charge: { ...flame, power: 1.1 },
    sfx: 'ax_g3_kokoro',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      k.dim({ a: 0.36, life: c.len - 80, fin: 0, fout: 300 });
      c.each((t, i, d) => {
        const cy = t.y - 10, dd = d + i * 60;
        prop(fx, 'flame', t.x, cy, { s: 1.8, life: c.len - 200, fout: 240, delay: dd + 40, add: true, glow: '#ff6a1a', glowR: 10 });
        k.flames(t.x, t.y + 10, { w: 22, h: 50, n: 4, delay: dd + c.hit - 120, life: 640 });
        k.pillar(t.x, t.y + 6, { w: 8, color: '#ff4a10', glow: '#ff8a2a', core: '#ffd060', delay: dd + c.hit - 60, life: 480, burst: false, alpha: 0.55, widths: [0.4, 1, 0.8, 1, 0.5] });
        embers(fx, t.x, cy, { n: per(c, 16), spread: 14, colors: ['#ffd23a', '#fff2a0', '#ff8a2a'], delay: dd + c.hit, life: 560 });
        k.shockwave(t.x, t.y + 8, { r0: 6, r1: 30, sy: 0.35, color: '#ffd23a', w: 2, n: 2, gap: 100, delay: dd + c.hit });
        fx.glow(t.x, cy, { color: '#ff8a2a', r: 22, delay: dd + c.hit, life: 420, alpha: 0.9 });
      });
      // 炎の 輪で つながる
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 26, x1 = Math.max(...xs) + 26, y = c.center.y + 4;
      const rx = Math.max(30, (x1 - x0) / 2);
      ribbon(fx, arcPts((x0 + x1) / 2, y, rx, Math.PI, Math.PI * 3.05, 40, 0.28), { style: 'flame', w: 5, draw: 320, hold: 180, life: 680, delay: c.hit + 60 });
    },
  },
  // ───── 九の型 れんごく（Lv10）: 巨大な 炎の 竜（虎の ような あたま）が 刀と いっしょに 突進 → 炎の 大爆発 → 火の粉の 雨 ─────
  ax_rengoku: {
    charge: { ...flame, power: 1.25 },
    sfx: 'ax_g3_rengoku',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      k.dim({ a: 0.45, life: c.len - 60, fin: 0, fout: 320 });
      bg(fx, 'flame', { a: 0.55, life: c.len - 80, fin: 120, fout: 320 });
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.7 : 1);
        const side = t.x >= c.W / 2 ? 1 : -1;
        const up = c.fromAlly ? 1 : -1;
        // 画面の はしから 大きく まわりこんで 突進
        const path = [[t.x - side * 150, o.y + up * 26], [t.x - side * 110, t.y + up * 34], [t.x - side * 60, t.y + up * 10], [t.x - side * 24, t.y], [t.x, t.y]];
        dragon(fx, path, { style: 'flame', head: 'tiger', w: 14 * s, hs: 1.15, body: 170 * s, travel: c.hit - 40, life: c.hit + 160, fout: 140, amp: 6, wl: 50, ease: 'in', delay: d + 30 });
        line(fx, o.x, o.y, t.x + (t.x - o.x) * 0.3, t.y + (t.y - o.y) * 0.3, { w: 2.4, color: '#fff2a0', glow: '#ff6a1a', draw: 90, hold: 160, life: 420, flare: 130, delay: d + c.hit - 60 });
        const h = d + c.hit;
        blast(fx, t.x, t.y, { r: 26 * s, glow: '#ffa040', core: '#fff2a0', colors: FIRE, n: per(c, 24), smoke: '#4a2010', delay: h, heavy: i === 0 });
        k.flames(t.x, t.y + 14, { w: 46 * s, h: 50 * s, n: 7, delay: h + 40, life: 640 });
        k.shockwave(t.x, t.y + 10, { r0: 10, r1: 80 * s, sy: 0.4, color: '#ff8a2a', w: 3, n: 3, gap: 90, delay: h + 30 });
        k.particles(t.x, t.y, { colors: FIRE, n: per(c, 34), speed: 230, delay: h, life: 460, len: 9 });
        embers(fx, t.x, t.y - 46, { n: per(c, 35), spread: 60, up: false, life: 620 , delay: h + 360 });
      });
      k.speedLines(c.center.x, c.center.y, { color: '#ffd0a0', delay: c.hit - 80, life: 300, r1: 170, n: 24 });
      k.flash('#ffe0b0', 140, c.hit);
      k.shake(440, 3, c.hit);
    },
  },
  // ───── 伍ノ型 炎虎（ひらめき）: 炎で できた 虎の あたまが 弧を えがいて かみつく → 炎の 爆発 ─────
  ax_enko: {
    charge: flame,
    sfx: 'ax_g3_enko',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      k.dim({ a: 0.4, life: c.len - 100, fin: 0, fout: 300 });
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.75 : 1);
        const up = c.fromAlly ? -1 : 1;
        const path = [[o.x, o.y], [lerpN(o.x, t.x, 0.3) - 30, Math.min(o.y, t.y) + up * 46], [lerpN(o.x, t.x, 0.75) + 10, Math.min(o.y, t.y) + up * 52 + (c.fromAlly ? 0 : 30)], [t.x, t.y]];
        dragon(fx, path, { style: 'flame', head: 'tiger', w: 13 * s, hs: 1.25, body: 46 * s, travel: c.hit - 10, life: c.hit + 110, fout: 100, amp: 2, wl: 30, delay: d });
        const h = d + c.hit;
        // かみつきの きずの すじ（3本）
        for (let j = -1; j <= 1; j++) ribbon(fx, [[t.x - 12 * s + j * 7, t.y - 16 * s], [t.x + j * 7, t.y], [t.x + 10 * s + j * 7, t.y + 14 * s]], { style: 'flame', w: 3.2, draw: 80, hold: 100, life: 320, delay: h + 10 + (j + 1) * 30 });
        blast(fx, t.x, t.y, { r: 22 * s, glow: '#ffa040', core: '#fff2a0', colors: FIRE, n: per(c, 24), smoke: '#4a2010', delay: h, heavy: i === 0 });
        k.flames(t.x, t.y + 12, { w: 34 * s, h: 36 * s, n: 6, delay: h + 40, life: 560 });
        k.particles(t.x, t.y, { colors: FIRE, n: per(c, 34), speed: 200, delay: h, life: 420 });
        embers(fx, t.x, t.y, { n: per(c, 26), spread: 30, life: 560 , delay: h + 300 });
      });
      k.flash('#ffd0a0', 100, c.hit);
      k.shake(360, 2.4, c.hit);
    },
  },
  // ───── 火車（日の呼吸）: たてに まわる 炎の 車輪が とんで 敵を 真上から → 赤と 金の 火花 ─────
  ax_kasha: {
    charge: sunC,
    sfx: 'ax_g3_kasha',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      k.dim({ a: 0.42, life: c.len - 100, fin: 0, fout: 300 });
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.8 : 1);
        const top = t.y - 30 * s;
        wheel(fx, o.x, o.y - 10, { to: { x: t.x, y: top }, r: 14 * s, travel: c.hit - 120, hop: c.fromAlly ? 40 : -10, spin: 3.2, dir: t.x >= o.x ? 1 : -1, life: c.hit + 40, fout: 80, delay: d });
        // 真上から 縦の 一閃
        ribbon(fx, arcPts(t.x, top + 6 * s, 20 * s, -Math.PI * 1.3, Math.PI * 0.5, 22), { style: 'sun', w: 7 * s, draw: 150, hold: 120, life: 460, delay: d + c.hit - 110 });
        line(fx, t.x, top - 18 * s, t.x, t.y + 26 * s, { w: 2.2, color: '#fff4b0', glow: '#ff3a14', draw: 70, hold: 120, life: 360, flare: 110, delay: d + c.hit - 30 });
        const h = d + c.hit;
        hitBurst(fx, t.x, t.y, { r: 16 * s, glow: '#ff6a1a', colors: SUN, n: per(c, 18), delay: h, heavy: i === 0 });
        fx.sparks(t.x, t.y, { colors: SUN, n: per(c, 40), speed: 210, delay: h, life: 460, len: 8 });
        glitter(fx, t.x, t.y - 20 * s, { n: per(c, 14), spread: 26, colors: ['#ffffff', '#ffd23a', '#ff6a1a'], dur: 400, delay: h + 60 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 50 * s, color: '#ffd23a', w: 2.4, n: 2, gap: 90, delay: h + 20 });
        k.flames(t.x, t.y + 12, { w: 28 * s, h: 28 * s, n: 5, cols: ['#e8201a', '#ff6a1a', '#ffd23a'], delay: h + 40, life: 500 });
        embers(fx, t.x, t.y - 20, { n: per(c, 22), colors: SUN, spread: 30, up: false, life: 520 , delay: h + 300 });
      });
      k.flash('#ffd0a0', 100, c.hit);
      k.shake(360, 2.3, c.hit);
    },
  },
  // ───── すきとおる世界（自分）: 画面が 白っぽく → 敵の いる あたりに 白い 線（中の 骨組み）が 光る → もどる ─────
  ax_sukitooru_sekai: {
    charge: { color: '#ffd0b0', color2: '#ffffff' },
    sfx: 'ax_g3_clear',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t0 = c.t;
      bg(fx, 'white', { a: 0.7, life: c.len - 60, fin: 220, fout: 360, my: 64 });
      k.flash('#ffffff', 120, 0);
      // 目の きらり
      prop(fx, 'eye', t0.x, t0.y - 26, { s: 1.6, life: 520, fout: 160, add: false, glow: '#ff8a5a', glowR: 10 });
      // 敵の いる あたり（画面の まん中）に すける 線
      const spots = [[c.W * 0.27, 70], [c.W * 0.5, 64], [c.W * 0.73, 70]];
      spots.forEach(([x, y], j) => {
        prop(fx, 'frame', x, y, { s: 1.6, color: '#ffffff', color2: '#ff6a3a', life: c.len - 260 - j * 40, fout: 300, delay: 180 + j * 80, add: true, pop: false });
        k.shockwave(x, y, { r0: 30, r1: 4, color: '#ffffff', w: 1.4, delay: c.hit - 60 + j * 40, life: 300 });
        fx.glow(x, y - 4, { color: '#ff6a3a', r: 10, delay: c.hit + j * 40, life: 360, alpha: 0.9 });
        k.sparkles(x, y, { n: 6, r: 18, colors: ['#ffffff', '#ffe0d0'], delay: c.hit + j * 40, life: 320 });
      });
      c.each((t, i, d) => {
        k.shockwave(t.x, t.y - 10, { r0: 6, r1: 60, sy: 0.5, color: '#ffffff', w: 1.6, n: 3, gap: 150, delay: d + 100 });
        fx.glow(t.x, t.y - 10, { color: '#ffd0b0', r: 34, delay: d + c.hit, life: 480, alpha: 0.9 });
        k.particles(t.x, t.y - 10, { colors: ['#ffffff', '#ffd0b0'], n: per(c, 16), speed: 70, delay: d + c.hit, life: 420 });
      });
      k.sparkles(c.W / 2, 60, { n: 14, r: 100, colors: ['#ffffff', '#ffe8d8'], delay: 200, life: 420, gap: 40 });
    },
  },
  // ───── 烈日紅鏡: 左に 1つ、右に 1つ 赤い 日輪を えがく 水平の 2連撃 → 太陽の 光の 爆発 ─────
  ax_retsujitsu_koukyou: {
    charge: { ...sunC, power: 1.2 },
    sfx: 'ax_g3_koukyou',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'dawn', { a: 0.62, life: c.len - 60, fin: 120, fout: 360 });
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.8 : 1);
        const R = 15 * s, off = 34 * s;
        for (const [sd, dl] of [[-1, 0], [1, 230]]) {
          const cx = t.x + sd * off, cy = t.y - 2;
          // まん中から 横へ 切って その まま 円を えがく
          const ang0 = sd < 0 ? 0 : Math.PI;
          const pts = [[t.x - sd * 14 * s, t.y + 2], [t.x, t.y], ...arcPts(cx, cy, R, ang0 + sd * 0.1, ang0 + sd * (Math.PI * 2 + 0.2), 22)];
          ribbon(fx, pts, { style: 'sun', w: 6.5 * s, draw: 220, hold: 220, life: 620, delay: d + dl + c.hit - 40 });
          sun(fx, cx, cy, { r: R * 0.85, grow: 180, life: 1000 - dl, fout: 200, burst: 660 - dl, rays: 10, delay: d + dl + c.hit + 120 });
          hitBurst(fx, t.x, t.y, { r: 13 * s, glow: '#ff6a1a', colors: SUN, n: per(c, 18), delay: d + dl + c.hit, heavy: i === 0 });
          fx.sparks(cx, cy, { colors: SUN, n: per(c, 26), speed: 150, delay: d + dl + c.hit + 120, life: 420 });
        }
        const b = d + c.hit + 800;
        blast(fx, t.x, t.y, { r: 24 * s, glow: '#ffa040', core: '#fff4b0', colors: SUN, n: per(c, 30), smoke: '#5a1010', heavy: i === 0, delay: b });
        k.shockwave(t.x, t.y, { r0: 10, r1: 90 * s, color: '#ffd23a', w: 3, n: 3, gap: 90, delay: b });
        embers(fx, t.x, t.y, { n: per(c, 30), colors: SUN, spread: 50, life: 560, delay: b + 60 });
      });
      k.shake(220, 2, c.hit);
      k.shake(560, 3.4, c.hit + 800);
      k.flash('#fff0d0', 160, c.hit + 800);
    },
  },
  // ───── 飛輪陽炎: 太刀すじが ゆらゆら ゆがむ 炎の 帯（位置が ずれる）→ 当たる しゅんかん だけ はっきり 赤く ひかる ─────
  ax_hirin_kagerou: {
    charge: sunC,
    sfx: 'ax_g3_hirin',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      bg(fx, 'dawn', { a: 0.55, life: c.len - 60, fin: 160, fout: 360 });
      k.streaks({ ang: 0, color: '#ffb080', n: 22, delay: 0, life: c.len - 200, speed: 0.15, alpha: 0.35 });
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 50, x1 = Math.max(...xs) + 50, cy = c.center.y;
      const mk = (oy) => [[x0, cy + 12 + oy], [(x0 + x1) / 2, cy - 2 + oy], [x1, cy - 14 + oy]];
      const draw = c.hit + c.stagger * (c.n - 1);
      // ゆらぐ 幻の すじ（ずれて 見える）
      ribbon(fx, mk(-10), { style: 'sun', w: 6, draw, hold: 300, life: draw + 600, wob: 6, alpha: 0.45 });
      ribbon(fx, mk(9), { style: 'sun', w: 5, draw: draw + 60, hold: 280, life: draw + 560, wob: 7, alpha: 0.4, delay: 40 });
      ribbon(fx, [[o.x, o.y], [lerpN(o.x, x0, 0.5), lerpN(o.y, cy, 0.6) + 20], [x0, cy + 12]], { style: 'sun', w: 4, draw: 200, hold: 80, life: 420, wob: 4, alpha: 0.6 });
      c.each((t, i, d) => {
        const s = c.sz, h = d + c.hit;
        // あたる しゅんかんだけ はっきり
        line(fx, t.x - 30 * s, t.y + 8, t.x + 30 * s, t.y - 6, { w: 2.6, color: '#ff3414', glow: '#ff6a2a', core: '#fff4b0', draw: 40, hold: 140, life: 320, flare: 60, delay: h - 30 });
        hitBurst(fx, t.x, t.y, { r: 15 * s, glow: '#ff3a14', colors: SUN, n: per(c, 18), delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 46 * s, sy: 0.6, color: '#ff6a2a', w: 2.4, n: 2, gap: 100, delay: h + 20 });
        fx.sparks(t.x, t.y, { colors: SUN, n: per(c, 40), speed: 180, delay: h, life: 440 });
        k.flames(t.x, t.y + 12, { w: 24 * s, h: 26 * s, n: 5, cols: ['#e8201a', '#ff6a1a', '#ffd23a'], delay: h + 30, life: 520 });
        ribbon(fx, [[t.x - 36, t.y + 6], [t.x, t.y - 2], [t.x + 36, t.y - 8]], { style: 'sun', w: 3, draw: 200, hold: 160, life: 560, wob: 8, alpha: 0.4, delay: h + 380 });
        embers(fx, t.x, t.y, { n: per(c, 34), colors: SUN, spread: 30, life: 560, delay: h + 300 });
        k.sparkles(t.x, t.y, { n: per(c, 14), r: 26, colors: ['#ffffff', '#ffd23a'], delay: h + 80, life: 340 });
        glitter(fx, t.x, t.y, { n: per(c, 36), spread: 44, colors: ['#ffb080', '#ffd23a', '#ff6a1a'], dur: 700, delay: h + 100, vy: -14 });
      });
      k.flash('#ffd0b0', 120, c.hit);
      k.shake(560, 3.2, c.hit);
    },
  },
  // ───── 日の出のあざ（自分）: ひたいに 赤い 炎の あざ・朝日の すじ → 体が 赤く あたたかく ひかる ─────
  ax_hinode_aza: {
    charge: sunC,
    sfx: 'ax_g3_aza',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const t0 = c.t;
      bg(fx, 'dawn', { a: 0.6, life: c.len - 60, fin: 220, fout: 360, mx: t0.x, my: 64, mr: 30 });
      c.each((t, i, d) => {
        const fy = t.y - 30;
        prop(fx, 'flame', t.x - 4, fy, { s: 1.5, color: '#c8101a', color2: '#ff6a2a', life: c.len - 160, fout: 300, delay: d + 120, glow: '#ff3a14', glowR: 10, rot0: -0.3 });
        fx.glow(t.x, fy, { color: '#ff3a14', r: 18, delay: d + c.hit - 60, life: 500, alpha: 1 });
        k.shockwave(t.x, fy, { r0: 4, r1: 36, color: '#ff6a2a', w: 1.8, n: 2, gap: 120, delay: d + c.hit });
        fx.glow(t.x, t.y - 6, { color: '#ff6a1a', r: 40, delay: d + c.hit, life: 560, alpha: 0.75 });
        k.flames(t.x, t.y + 14, { w: 40, h: 34, n: 6, cols: ['#e8201a', '#ff6a1a', '#ffd23a'], delay: d + c.hit, life: 600 });
        embers(fx, t.x, t.y - 10, { n: per(c, 18), colors: SUN, spread: 26, delay: d + c.hit + 40, life: 560 });
        k.sparkles(t.x, t.y - 20, { n: per(c, 10), colors: ['#ffffff', '#ffd23a'], r: 24, delay: d + c.hit + 100, life: 360 });
        // あたたかい 光の 火の粉（第49回: ため が みじかく なった ぶん）
        embers(fx, t.x, t.y, { n: per(c, 12), colors: SUN, spread: 20, delay: d + c.hit - 60, life: 520 });
      });
      // 朝日の すじ
      k.streaks({ ang: -Math.PI / 2 + 0.25, color: '#ffd08a', n: 18, delay: c.hit - 100, life: 600, speed: 0.5, alpha: 0.5 });
    },
  },
  // ───── ヒノカミ神楽（看板・伝説）: 夜明けの 日輪 → 円舞・碧羅の天・烈日紅鏡・火車・陽華突を つぎつぎ → 大きな 日輪が かかって はじける ─────
  ax_hinokami_kagura: {
    charge: { ...sunC, power: 1.2 },
    sfx: 'ax_g3_kagura',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const C = c.center;
      const T = c.targets;
      const big = c.hit; // 大きな 日輪が はじける（数が 出る）
      bg(fx, 'dawn', { a: 0.66, life: c.len - 40, fin: 120, fout: 380 });
      // 花札の 耳かざり（帯）
      prop(fx, 'earring', o.x + 10, o.y - (c.fromAlly ? 30 : 18), { s: 1.3, life: 700, fout: 200, glow: '#ff6a1a', glowR: 8, spin: 1.5 });
      const xs = T.map((t) => t.x);
      const x0 = Math.min(...xs) - 34, x1 = Math.max(...xs) + 34;
      const s = c.sz;
      // 1. 円舞（敵ごとに 円）
      c.each((t, i, d) => {
        ribbon(fx, arcPts(t.x, t.y, 22 * s, -Math.PI / 2, Math.PI * 1.55, 24, 0.6), { style: 'sun', w: 5.5 * s, draw: 160, hold: 80, life: 360, delay: 60 + d });
        fx.sparks(t.x, t.y, { colors: SUN, n: per(c, 10), speed: 140, delay: 200 + d, life: 320 });
      });
      // 2. 碧羅の天（上の 大きな 弧）
      c.at(260, () => {
        ribbon(fx, arcPts(C.x, C.y + 20, Math.max(40, (x1 - x0) / 2), Math.PI * 1.02, Math.PI * 1.98, 26), { style: 'sun', w: 7, draw: 170, hold: 90, life: 380 });
        T.forEach((t) => fx.sparks(t.x, t.y - 10, { colors: SUN, n: per(c, 8), speed: 120, delay: 120, life: 300 }));
      });
      // 3. 烈日紅鏡（左右の 太陽）
      c.at(460, () => {
        for (const sd of [-1, 1]) {
          const cx = C.x + sd * Math.max(36, (x1 - x0) / 2 - 6);
          ribbon(fx, [[C.x, C.y], ...arcPts(cx, C.y - 4, 13, sd < 0 ? 0 : Math.PI, sd < 0 ? Math.PI * 2 : Math.PI * 3, 16)], { style: 'sun', w: 5, draw: 170, hold: 60, life: 330 });
          sun(fx, cx, C.y - 4, { r: 11, grow: 120, life: 360, fout: 120, rays: 8, delay: 130 });
        }
      });
      // 4. 火車（たての 車輪が 上から）
      c.at(640, () => {
        wheel(fx, C.x - 30, C.y - 50, { to: { x: C.x, y: C.y - 16 }, r: 15, travel: 160, hop: 10, spin: 3.4, life: 220, fout: 60 });
        line(fx, C.x, C.y - 40, C.x, C.y + 24, { w: 2.2, color: '#fff4b0', glow: '#ff3a14', draw: 50, hold: 80, life: 220, delay: 150 });
      });
      // 5. 陽華突（まっすぐな 突き）
      c.at(820, () => {
        T.forEach((t, i) => {
          line(fx, o.x, o.y, t.x, t.y, { w: 3, color: '#ffd23a', glow: '#ff6a1a', core: '#fff8d0', draw: 70, hold: 90, life: 260, delay: i * 20 });
          fx.glow(t.x, t.y, { color: '#ffd23a', r: 14, delay: 70 + i * 20, life: 200 });
        });
        // 6. 大きな 日輪が かかる
        sun(fx, C.x, C.y - 6, { r: Math.min(44, 26 + 6 * c.n), grow: 240, life: 640, fout: 300, burst: big - 820, rays: 16, spin: 1.6 });
      });
      k.speedLines(C.x, C.y, { color: '#ffd0a0', delay: big - 160, life: 220, r1: 170, n: 22 });
      // はじける（数）
      c.each((t, i, d) => {
        const ss = s * (i ? 0.8 : 1), h = big + d;
        blast(fx, t.x, t.y, { r: 24 * ss, glow: '#ffa040', core: '#fff4b0', colors: SUN, n: per(c, 30), smoke: '#5a1010', heavy: i === 0, delay: h });
        k.shockwave(t.x, t.y, { r0: 10, r1: 90 * ss, color: '#ffd23a', w: 3, n: 3, gap: 80, delay: h });
        fx.sparks(t.x, t.y, { colors: SUN, n: per(c, 30), speed: 230, life: 460, len: 9, delay: h });
        k.flames(t.x, t.y + 12, { w: 30 * ss, h: 30 * ss, n: 5, cols: ['#e8201a', '#ff6a1a', '#ffd23a'], delay: h + 40, life: 460, embers: c.n < 3 });
      });
      // 余韻: 金の 火の粉と 朝の 光
      embers(fx, C.x, C.y - 30, { n: per(c, 40), colors: ['#ffd23a', '#fff4b0', '#ff8a2a'], spread: 90, up: false, life: 440, delay: big + 240 });
      glitter(fx, C.x, C.y - 10, { n: 40, spread: 110, colors: ['#ffd23a', '#fff4b0', '#ff6a1a'], dur: 600, delay: big + 60, vy: 18 });
      k.streaks({ ang: -Math.PI / 2 + 0.3, color: '#ffe0a0', n: 16, life: 400, speed: 0.5, alpha: 0.45, delay: big + 260 });
      for (const [t, a] of [[200, 1.3], [380, 1.3], [580, 1.5], [800, 1.6]]) k.shake(110, a, t);
      k.flash('#fff4d8', 200, big);
      k.shake(640, 3.8, big);
    },
  },
  // ───── 円舞（ひらめき）: 敵の まわりに 完全な 円の 炎の 刃（赤い 円・金の ふち）が ぐるりと 一周 → 円が 光って はじける ─────
  ax_enbu: {
    charge: sunC,
    sfx: 'ax_g3_enbu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      bg(fx, 'dawn', { a: 0.55, life: c.len - 60, fin: 160, fout: 360 });
      c.each((t, i, d) => {
        const s = c.sz * (i ? 0.75 : 1);
        const R = 30 * s;
        ribbon(fx, arcPts(t.x, t.y, R, -Math.PI / 2 - 0.2, Math.PI * 1.5 + 0.15, 36, 0.82), { style: 'sun', w: 8 * s, draw: 380, hold: 220, life: 820, flare: c.hit, delay: d + 40 });
        ribbon(fx, arcPts(t.x, t.y, R * 1.18, -Math.PI / 2, Math.PI * 1.5, 30, 0.82), { style: 'gold', w: 2.4 * s, draw: 420, hold: 160, life: 780, alpha: 0.8, delay: d + 70 });
        sun(fx, t.x, t.y, { r: R * 0.8, grow: 160, life: 560, fout: 240, burst: 160, rays: 14, sy: 0.82, alpha: 0.75, delay: d + c.hit - 160 });
        const h = d + c.hit;
        hitBurst(fx, t.x, t.y, { r: 16 * s, glow: '#ff6a1a', colors: SUN, n: per(c, 18), delay: h, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: R, r1: R * 3, sy: 0.82, color: '#ffd23a', w: 3, n: 3, gap: 90, delay: h });
        fx.sparks(t.x, t.y, { colors: SUN, n: per(c, 44), speed: 220, delay: h, life: 480, len: 9 });
        // 円が 光る（円の 上に きらめき）
        glitter(fx, t.x, t.y, { n: per(c, 30), ring: R, sy: 0.82, colors: ['#ffffff', '#ffd23a', '#ff6a1a'], dur: 380, delay: d + 40, life: 340, size: 3.4 });
        glitter(fx, t.x, t.y, { n: per(c, 34), spread: R * 1.6, colors: ['#ffd23a', '#fff4b0'], dur: 500, delay: h + 120, vy: -16 });
        embers(fx, t.x, t.y, { n: per(c, 29), colors: SUN, spread: R, life: 560 , delay: h + 300 });
      });
      k.flash('#fff0d0', 150, c.hit);
      k.shake(520, 3.2, c.hit);
    },
  },
};

function lerpN(a, b, t) { return a + (b - a) * t; }
void ST;
