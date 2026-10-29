// 第49回 O1: 掛け合わせ技（ひらめき）と 合体技の え
// 掛け合わせ … 属性を 宿す 魔法剣・こぶしから 白い 花の 光・炎の 竜巻・仁王立ちの 青い 盾・緑の リボンの まい・風の つき・音符と 三日月・赤と 青の 玉が 合わさる 白い 矢
// 合体技（ため なし。顔の カットインの あと）… クロス魔法剣・クロスブレイク・指さしと スポットライト・日輪・赤と 青の ライバル・いかずちの 剣・光の 三角形・3本の 剣・4色の 光の 槍・手がかりカードと 虫めがね
import {
  COL, ELEM, elemOf, src, above, prop, spot, tri, shatter, reticle, arrows, zzz, strike, swing, figure, dust, text, pick,
  hitBurst, blast, glitter, rich, per, line, ribbon, arcPts, g3prop,
} from './axfx-o1-kit.js?v=7c37ebe89b7f';
import { sun as g3sun, tornado as g3tornado } from './axfx-g3-kit.js?v=7c37ebe89b7f';

const TAU = Math.PI * 2;

// 属性の 形（魔法剣・クロス魔法剣・デルタストライク）。s … 大きさ
function elemFx(fx, c, t, at, E, s = 1) {
  const { k } = c;
  const z = c.sz * s;
  const few = c.all;
  switch (E.shape) {
    case 'fire':
      k.flames(t.x, t.y + 16 * z, { w: 26 * z, h: 32 * z, cols: [E.main, E.glow, E.core], n: 5, delay: at, life: 460, embers: !few });
      break;
    case 'ice':
      for (let j = 0; j < (few ? 3 : 6); j++) {
        const a = (j / 6) * TAU;
        fx.add({ kind: 'axShape', shape: 'diamond', x: t.x + Math.cos(a) * 14 * z, y: t.y + Math.sin(a) * 12 * z, vx: 0, vy: 0, color: j % 2 ? '#e6fbff' : '#9ae6ff', size: 4.4 * z, rot0: a, spin: 0, delay: at + j * 30, life: 300, add: true, pop: true });
      }
      shatter(fx, t.x, t.y, { r: 16 * z, n: per(c, 10), colors: E.list, delay: at + 300, speed: 110 });
      break;
    case 'bolt':
      k.bolt(t.x, -10, t.x, t.y, { w: 2.4, color: '#fff6b0', glow: '#ffd83a', amp: 7, forks: 2, delay: at - 30, life: 220, grow: 30 });
      for (let j = 0; j < (few ? 2 : 4); j++) { const a = j * 1.57 + 0.4; k.bolt(t.x, t.y, t.x + Math.cos(a) * 24 * z, t.y + Math.sin(a) * 20 * z, { w: 1.3, amp: 4, forks: 1, delay: at + 40 + j * 40, life: 160, grow: 30 }); }
      break;
    case 'wind':
      fx.swirl(t.x, t.y + 8, [E.core, E.glow, E.main], { n: per(c, 18), rad: 18 * z, h: 34, delay: at, life: 520 });
      fx.gust(t.x, t.y, { len: 50, amp: 5, color: '#e8fff0', w: 1.2, dir: 1, delay: at + 60, life: 380 });
      break;
    case 'water':
      for (let j = 0; j < per(c, 14); j++) fx.drop(t.x + ((j * 7) % 20) - 10, t.y, { color: E.list[j % 3], vx: ((j % 7) - 3) * 30, vy: -150 - (j % 3) * 30, g: 380, size: 1.8, delay: at + (j % 3) * 30, life: 520 });
      fx.shock(t.x, t.y + 8, { r0: 4, r1: 36 * z, sy: 0.35, color: '#8fd8ff', w: 1.8, delay: at, life: 380 });
      break;
    case 'earth':
      for (let j = 0; j < (few ? 1 : 3); j++) g3prop(fx, 'rockpillar', t.x + (j - 1) * 10 * z, t.y + 18 * z, { s: 1, h: (22 + j * 6) * z, w: 7 * z, life: 380, fout: 160, delay: at + j * 30, pop: false });
      k.debris(t.x, t.y + 10, { n: per(c, 12), up: 160, delay: at });
      break;
    case 'dark':
      fx.swirl(t.x, t.y, ['#6a3ab8', '#2a1040', '#b48aff'], { n: per(c, 18), rad: 18 * z, h: 30, delay: at, life: 520, size: 1.8 });
      break;
    case 'light':
      k.pillar(t.x, t.y + 12, { w: 16 * z, color: '#fff6d0', glow: '#ffd23a', delay: at, life: 420, burst: false });
      break;
    case 'blast':
      blast(fx, t.x, t.y, { r: 14 * z, glow: E.main, colors: E.list, n: per(c, 14), delay: at + 60, heavy: false, puffs: few ? 0 : 2, flash: false });
      break;
    default:
      k.shockwave(t.x, t.y, { r0: 6, r1: 40 * z, color: E.glow, w: 2, n: 2, gap: 80, delay: at });
  }
}
// 属性の 色の 光が とんで くる 玉
function elemOrb(c, x0, y0, x1, y1, at, travel, E, r = 6) {
  return c.k.orb(x0, y0, { r, color: E.main, glow: E.glow, rim: E.core, arms: 3, grow: 100, to: { x: x1, y: y1 }, start: 100, travel, delay: at });
}

export const AX_O1_COMBO = {
  // ───── 魔法剣（ひらめき）: 呪文の 属性を 剣に 宿し、その 形を まとった 斬げき → 属性の 余韻 ─────
  ox_mahouken: {
    charge: { color: '#ff8a3a', color2: '#ffffff' },
    sfx: 'ax_o1_mahouken',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const E = elemOf(c.element || 'fire');
      const o = src(c);
      const sy = c.fromAlly ? c.H - 26 : o.y - 14;
      k.gather(o.x + 6, sy, { colors: [E.core, E.glow, E.main], n: 12, r: 26, life: 200 });
      fx.glow(o.x + 6, sy, { color: E.main, r: 18, delay: 120, life: 220, alpha: 0.9 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 38, ang: -0.8, w: 11, color: E.glow, glow: E.main, core: E.core, swing: 130, after: 4 });
        elemFx(fx, c, t, h, E);
        strike(fx, c, t, h, { r: 16, glow: E.main, colors: E.list, n: 30, heavy: i === 0, rings: 2, extra: 24, extraCols: E.list });
      });
      k.flash(E.core, 70, c.hit);
      k.shake(240, 1.9, c.hit);
    },
  },
  // ───── 閃華裂光拳（ひらめき）: ホイミの 緑の 光を こぶしに → うつ → 中から 白い 花が ぱあっと ひらく 光 → 緑と 白の つぶ ─────
  ox_senka_rekkouken: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_o1_senka',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const sy = c.fromAlly ? c.H - 26 : o.y - 10;
      fx.glow(o.x + 6, sy, { color: '#7dffb0', r: 16, delay: 0, life: c.hit, alpha: 0.9 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, o.x + 6, sy, t.x, t.y, { w: 4, color: '#c8ffe0', glow: '#3ad87a', core: '#ffffff', draw: c.hit - 20, hold: 60, life: c.hit + 160, delay: d });
        if (!c.all) k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#7dffb0', delay: h, heavy: true });
        // 白い 花（8まいの 花びらの 光が ひらく）
        for (let j = 0; j < (c.all ? 4 : 8); j++) {
          const a = (j / (c.all ? 4 : 8)) * TAU;
          fx.add({ kind: 'axShape', shape: 'petal', x: t.x, y: t.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, drag: 0.9, color: j % 2 ? '#ffffff' : '#e8fff0', size: 5 * c.sz, rot0: a, spin: 0, delay: h + 40, life: 520, add: true, pop: true });
        }
        fx.glow(t.x, t.y, { color: '#ffffff', r: 34 * c.sz, delay: h + 60, life: 360, alpha: 0.9 });
        strike(fx, c, t, h, { r: 15, glow: '#7dffb0', colors: COL.heal, n: 28, rings: 2, extra: 24, extraCols: ['#ffffff', '#c8ffe0', '#7dffb0'] });
      });
      k.flash('#e8fff0', 70, c.hit + 60);
      k.shake(220, 1.8, c.hit);
    },
  },
  // ───── 火炎旋風（ひらめき）: 炎の 波が はしり → 緑の 風の うずが 炎を まきこんで 赤い 竜巻 → 敵全体を 横切る → 火の粉 ─────
  ox_kaen_senpu: {
    charge: { color: '#ff6a1a', color2: '#6ad89a' },
    sfx: 'ax_o1_kaensenpu',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const C = c.center;
      const gy = Math.max(...c.targets.map((t) => t.y)) + 18 * c.sz;
      for (let j = 0; j < 4; j++) k.flames(o.x + (C.x - o.x) * (j / 4), (c.fromAlly ? c.H - 12 : o.y + 16) + (gy - (c.fromAlly ? c.H - 12 : o.y + 16)) * (j / 4), { w: 16, h: 18, n: 3, delay: j * 40, life: 360, embers: false });
      fx.swirl(C.x, gy - 10, ['#c8ffd8', '#6ad89a'], { n: 14, rad: 20, h: 40, delay: 120, life: 400 });
      const x0 = c.targets.length > 1 ? Math.min(...c.targets.map((t) => t.x)) - 30 : C.x - 30;
      const x1 = c.targets.length > 1 ? Math.max(...c.targets.map((t) => t.x)) + 30 : C.x + 30;
      g3tornado(fx, x0, gy, { h: 62, r0: 6, r1: 24, rise: 200, life: c.len - 160, fout: 260, spin: 3, style: 'flame', rings: 10, delay: 160, to: { x: x1, y: gy }, travel: c.len - 400, moveAt: 200 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.flames(t.x, t.y + 16 * c.sz, { w: 22 * c.sz, h: 30 * c.sz, n: 4, delay: h, life: 420, embers: !c.all });
        strike(fx, c, t, h, { r: 15, glow: '#ff6a1a', colors: COL.fire, n: 30, heavy: i === 0, extra: 22, extraCols: COL.fire });
        k.particles(t.x, t.y, { colors: COL.fire, n: per(c, 16), speed: 60, ang: -Math.PI / 2, spread: 1, g: -50, delay: h + 140, life: 480 });
      });
      k.shake(380, 1.6, c.hit);
    },
  },
  // ───── 仁王立ち（ひらめき・自分）: 両手を 広げて 仁王立ち → 背中に 大きな 青い 盾、仲間全員の 前へ 光の 線 → どっしり 土けむり ─────
  ox_nioudachi: {
    charge: { color: '#5a9aff', color2: '#ffffff' },
    sfx: 'ax_o1_niou',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        prop(fx, 'hexshield', t.x, t.y - 22, { s: 3.2, color: '#5a9aff', life: c.len - c.hit + 40, fout: 260, delay: h - 60 });
        for (const s of [-2, -1, 1, 2]) line(fx, t.x, t.y - 20, t.x + s * 50, t.y - 10, { w: 1.6, color: '#bfe4ff', glow: '#5a9aff', draw: 120, hold: 200, life: 460, delay: h + 40 + Math.abs(s) * 30 });
        hitBurst(fx, t.x, t.y - 20, { r: 13, glow: '#5a9aff', colors: COL.blue, n: per(c, 24), delay: h, star: true, rings: 2 });
        dust(fx, t.x, t.y + 6, { n: c.all ? 3 : 6, delay: h, r1: 14 });
        k.shockwave(t.x, t.y + 8, { r0: 8, r1: 46, sy: 0.3, color: '#c8b090', w: 2, n: 2, gap: 80, delay: h });
        arrows(fx, t.x + 26, t.y - 14, { color: '#5a9aff', up: true, n: 2, delay: h + 120 });
      });
      k.shake(220, 2, c.hit);
    },
  },
  // ───── いやしのまい（ひらめき・味方全員）: 緑の 光の リボンを ひいて くるくる おどる → 緑の 葉っぱと 光が ふる → きらきら ─────
  ox_iyashi_mai: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_o1_iyashimai',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const cy = Math.max(40, C.y - 50);
      const heal = { dark: '#1a8a4a', main: '#7dffb0', light: '#e8fff0', core: '#ffffff', glow: '#7dffb0', eye: '#ffffff' };
      ribbon(fx, [...arcPts(C.x, cy, 34, -Math.PI / 2, Math.PI * 1.5, 18, 0.5)], { style: heal, w: 3, draw: 300, hold: 200, life: 700 });
      ribbon(fx, [...arcPts(C.x, cy + 6, 26, Math.PI / 2, Math.PI * 2.5, 18, 0.5)], { style: heal, w: 2.4, draw: 300, hold: 200, life: 700, delay: 80 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (let j = 0; j < per(c, 8); j++) prop(fx, 'leaf', t.x + ((j * 11) % 30) - 15, t.y - 40 - (j % 3) * 6, { s: 1.4, life: 600, fout: 200, delay: h - 200 + j * 30, vx: ((j % 3) - 1) * 14, vy: 50, g: 10, spin: 4, color: j % 2 ? '#7dffb0' : '#3ad87a' });
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 26, delay: h, life: 420, alpha: 0.9 });
        glitter(fx, t.x, t.y - 10, { n: per(c, 18), spread: 18, colors: COL.heal, dur: 400, delay: h, vy: -20 });
        k.particles(t.x, t.y - 4, { colors: COL.heal, n: per(c, 16), speed: 60, ang: -Math.PI / 2, spread: 0.7, delay: h, life: 420 });
      });
    },
  },
  // ───── はやてづき（ひらめき・構え なし）: 風の すじが 一しゅんで 敵へ → こぶしの 光 → 風の うずが うしろへ ぬける ─────
  ox_hayatezuki: {
    charge: { color: '#6ad89a' },
    sfx: 'ax_o1_hayate',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (let j = 0; j < (c.all ? 1 : 3); j++) line(fx, o.x + (j - 1) * 8, o.y - 6, t.x + (j - 1) * 4, t.y, { w: 2 - j * 0.4, color: '#c8ffd8', glow: '#3aa86a', core: '#ffffff', draw: c.hit, hold: 60, life: c.hit + 220, delay: d + j * 10 });
        if (!c.all) k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#6ad89a', delay: h, heavy: true });
        if (i === 0) k.speedLines(t.x, t.y, { color: '#e8fff0', n: 16, delay: h, life: 240, r0: 18, r1: 110 });
        strike(fx, c, t, h, { r: 15, glow: '#6ad89a', colors: COL.wind, n: 30, rings: 2, extra: 20, extraCols: COL.wind });
        const dx = t.x - o.x, dy = t.y - o.y, L = Math.hypot(dx, dy) || 1;
        fx.swirl(t.x + (dx / L) * 20, t.y + (dy / L) * 20, ['#e8fff0', '#6ad89a'], { n: per(c, 14), rad: 14 * c.sz, h: 20, delay: h + 80, life: 460 });
        fx.gust(t.x + (dx / L) * 30, t.y, { len: 60, amp: 5, color: '#e8fff0', w: 1.2, dir: dx >= 0 ? 1 : -1, delay: h + 100, life: 420 });
      });
      k.shake(220, 1.8, c.hit);
    },
  },
  // ───── まどろみの歌（ひらめき）: うすむらさきの 音符が ふわふわ 敵全体へ → 三日月と Zz → 音符が とけて 消える ─────
  ox_madoromi_uta: {
    charge: { color: '#c8a8ff', color2: '#ffffff' },
    sfx: 'ax_o1_madoromi',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const at = d + j * 60;
          prop(fx, 'note', o.x + (j - 1.5) * 10, o.y - 14, { s: 2, color: j % 2 ? '#d8b0ff' : '#ffc8f0', life: c.hit - j * 60 + 160, fout: 160, delay: at, to: { x: t.x + (j - 1.5) * 9, y: t.y - 14 }, travel: c.hit - j * 60, hop: 24 + j * 6, pop: true, glow: '#d8b0ff', glowR: 6 });
        }
        const top = above(c, t, 24);
        prop(fx, 'moon', top.x - 10, top.y, { s: 1.6, color: '#fff0c0', life: c.len - c.hit - 60, fout: 200, delay: h, glow: '#fff0c0', glowR: 10 });
        zzz(fx, top.x, top.y, { delay: h + 80, life: 480 });
        hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: '#c8a8ff', colors: ['#ffffff', '#e0c8ff', '#c8a8ff'], n: per(c, 22), delay: h, star: false });
        glitter(fx, t.x, t.y - 8, { n: per(c, 16), spread: 24, colors: ['#e0c8ff', '#ffffff', '#ffc8f0'], dur: 400, delay: h + 60, size: 3, vy: -10 });
      });
      k.shapes(c.center.x, c.center.y - 30, { shape: 'note', n: 10, colors: ['#d8b0ff', '#ffc8f0', '#ffffff'], speed: 30, g: -10, size: 3, delay: 100, life: 700 });
    },
  },
  // ───── メドロ（ひらめき）: 右に 赤い 火の玉、左に 青い 氷の 玉 → 合わさって 白い 光の 矢 → つらぬいて 白い 球が ふくらむ → 光の ちり ─────
  ox_medoro: {
    charge: { color: '#ff5a3a', color2: '#5ab8ff' },
    sfx: 'ax_o1_medoro',
    allyFx: 'blast',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const sy = c.fromAlly ? c.H - 32 : o.y - 16;
      k.orb(o.x + 18, sy, { r: 7, color: '#ff5a1a', glow: '#ffb040', rim: '#fff2a0', arms: 3, grow: 120, to: { x: o.x, y: sy - 6 }, start: 140, travel: 120 });
      k.orb(o.x - 18, sy, { r: 7, color: '#3a8aff', glow: '#9ad8ff', rim: '#ffffff', arms: 3, grow: 120, to: { x: o.x, y: sy - 6 }, start: 140, travel: 120 });
      fx.glow(o.x, sy - 6, { color: '#ffffff', r: 18, delay: 260, life: 200, alpha: 1 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, o.x, sy - 6, t.x, t.y, { w: 3.6, color: '#ffffff', glow: '#e0d0ff', core: '#ffffff', draw: c.hit - 280, hold: 120, life: c.hit - 120, delay: d + 280, tip: null });
        k.orb(t.x, t.y, { r: 16 * c.sz, color: '#ffffff', glow: '#e8e0ff', rim: '#ffffff', arms: 0, grow: 220, hold: 120, delay: h, life: 460 });
        fx.shock(t.x, t.y, { r0: 8, r1: 50 * c.sz, color: '#ffffff', w: 2.4, delay: h + 200, life: 380 });
        strike(fx, c, t, h, { r: 16, glow: '#e8e0ff', colors: ['#ffffff', '#ffb0a0', '#9ad8ff'], n: 30, heavy: i === 0, extra: 24, extraCols: ['#ffffff', '#e8e0ff'] });
      });
      k.flash('#ffffff', 90, c.hit + 200);
      k.shake(260, 2, c.hit + 200);
    },
  },

  // ════════ 合体技（ため なし） ════════
  // ───── クロス魔法剣（2人）: 仲間の 呪文の 光が 剣に とびこむ → 2本の 属性の 斬げきが ×字 → 大きな ×の 光と 属性の 爆ぜ ─────
  ox_cross_mahouken: {
    sfx: 'ax_o1_xmahouken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const E = elemOf(c.element || 'fire');
      const o = src(c);
      const sy = c.fromAlly ? c.H - 26 : o.y - 14;
      elemOrb(c, o.x + 60, sy - 20, o.x + 6, sy, 0, 240, E, 7);
      fx.glow(o.x + 6, sy, { color: E.main, r: 22, delay: 340, life: 260, alpha: 1 });
      k.gather(o.x + 6, sy, { colors: [E.core, E.glow, E.main], n: 14, r: 30, life: 200, delay: 180 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h - 60, { r: 44, ang: -0.8, w: 13, color: E.glow, glow: E.main, core: E.core, swing: 140, after: 4 });
        swing(fx, c, t, h, { r: 44, ang: 0.8, w: 13, color: E.glow, glow: E.main, core: E.core, swing: 140, after: 4, flip: true, rush: false });
        for (const s of [-1, 1]) line(fx, t.x - 40 * c.sz, t.y + s * 40 * c.sz, t.x + 40 * c.sz, t.y - s * 40 * c.sz, { w: 4, color: E.core, glow: E.main, draw: 60, hold: 260, life: 520, delay: h + 40 });
        elemFx(fx, c, t, h + 60, E, 1.3);
        strike(fx, c, t, h, { r: 20, glow: E.main, colors: E.list, n: 44, heavy: i === 0, rings: 2, extra: 36, extraCols: E.list });
        k.shockwave(t.x, t.y, { r0: 10, r1: 70 * c.sz, color: E.glow, w: 2.8, n: 2, gap: 100, delay: h + 60 });
      });
      k.flash(E.core, 100, c.hit);
      k.shake(320, 2.4, c.hit);
    },
  },
  // ───── クロスブレイク（2人）: 左右から 剣の 白・こぶしの オレンジの すじが 交互に 4回 → ×字の 大きな 光と 衝撃波 ─────
  ox_cross_break: {
    sfx: 'ax_o1_xbreak',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 4; j++) {
          const h = d + c.hit - 300 + j * 100;
          const s = j % 2 ? 1 : -1;
          const col = j % 2 ? { color: '#ffd0a0', glow: '#ff8a1a', core: '#ffffff' } : { color: '#e8f4ff', glow: '#7ac8ff', core: '#ffffff' };
          line(fx, t.x + s * 80, t.y - 20 + j * 10, t.x - s * 20, t.y + 4 - j * 2, { w: 3, ...col, draw: 60, hold: 60, life: 220, delay: h - 60 });
          if (!c.all || j === 3) hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: col.glow, colors: [col.core, col.color, col.glow], n: c.all ? 4 : 14, delay: h, heavy: j === 0 && i === 0, star: false });
        }
        const h = d + c.hit + 140;
        for (const s of [-1, 1]) line(fx, t.x - 46 * c.sz, t.y + s * 46 * c.sz, t.x + 46 * c.sz, t.y - s * 46 * c.sz, { w: 5, color: s < 0 ? '#e8f4ff' : '#ffd0a0', glow: s < 0 ? '#7ac8ff' : '#ff8a1a', draw: 70, hold: 260, life: 540, delay: h - 60 });
        fx.star(t.x, t.y, '#ffffff', 40 * c.sz, h, 300);
        strike(fx, c, t, h, { r: 20, glow: '#ffb060', colors: ['#ffffff', '#ffd0a0', '#bfe4ff'], n: 44, heavy: i === 0, rings: 2, extra: 34, extraCols: ['#ffffff', '#ffd0a0', '#bfe4ff'] });
        k.shockwave(t.x, t.y, { r0: 10, r1: 76 * c.sz, color: '#ffffff', w: 3, n: c.all ? 1 : 3, gap: 90, delay: h });
        k.debris(t.x, t.y + 12, { n: per(c, 12), up: 150, delay: h });
      });
      k.flash('#ffffff', 100, c.hit + 140);
      k.shake(300, 1.4, c.hit - 300);
      k.shake(320, 2.6, c.hit + 140);
    },
  },
  // ───── おまえが犯人だ！（2人）: 下から 大きな 指さしの 手が ビシッ → スポットライト＋「！」→ 弱点の 赤い 照準と ガラスの 割れる 光 ─────
  ox_omae_ga_hannin: {
    sfx: 'ax_o1_hannin',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t0 = c.t;
      const fy = c.dir === 'down' ? 20 : c.H + 20;
      const ty = c.dir === 'down' ? t0.y - 40 : t0.y + 34;
      const ang = Math.atan2(t0.y - ty, t0.x - (t0.x - 60));
      prop(fx, 'finger', t0.x - 80, fy, { s: 3, rot0: ang, life: c.len - 200, fout: 300, to: { x: t0.x - 50, y: ty }, travel: 260, ease: 'out', pop: false });
      k.speedLines(t0.x, t0.y, { color: '#fff6d0', n: 22, delay: 260, life: 320, r0: 24, r1: 160 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        spot(fx, t.x, t.y, { w: 26 * c.sz, life: c.len - 300, fout: 300, delay: 220 + d });
        const top = above(c, t, 30);
        text(fx, '!', top.x + 14, top.y - 4, { size: 22, color: '#ffe066', color2: '#7a1a0a', life: 560, fout: 160, delay: 300 + d });
        reticle(fx, t.x, t.y, { r0: 34 * c.sz, r1: 12 * c.sz, lock: c.hit - 300, life: c.hit - 160 + 200, fout: 160, delay: 300 + d });
        shatter(fx, t.x, t.y, { r: 20 * c.sz, n: per(c, 20), colors: ['#ffffff', '#e8f4ff', '#bfe4ff'], delay: h, speed: 160 });
        strike(fx, c, t, h, { r: 20, glow: '#ff5a5a', colors: ['#ffffff', '#ffe066', '#ff5a5a'], n: 46, heavy: i === 0, rings: 2, extra: 34, extraCols: ['#ffffff', '#ffe066'] });
        arrows(fx, t.x + 22 * c.sz, t.y - 4, { color: '#5a9aff', up: false, n: 3, delay: h + 120, life: 460, dx: 10 });
      });
      k.flash('#fff6d0', 90, c.hit);
      k.shake(280, 2.2, c.hit);
    },
  },
  // ───── 日輪の大ほのお（2人）: 仲間の 炎が 剣に → 剣先で 大きな 赤い 日輪が 回る → 日輪ごと 斬りおろす → 炎の 柱＋火の粉 ─────
  ox_nichirin_honoo: {
    sfx: 'ax_o1_nichirin',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const t0 = c.t;
      const sy = c.fromAlly ? c.H - 26 : o.y - 14;
      elemOrb(c, o.x + 60, sy - 24, o.x, sy, 0, 180, ELEM.fire, 7);
      k.flames(o.x, sy + 10, { w: 18, h: 22, n: 3, delay: 200, life: 400, embers: true });
      const sx = c.dir === 'down' ? t0.x : t0.x, syy = c.dir === 'down' ? t0.y + 30 : Math.max(26, t0.y - 34);
      g3sun(fx, sx, syy, { r: 26, grow: 260, life: c.hit + 160, fout: 160, delay: 220, spin: 2, rays: 14 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 46, ang: -1.4, w: 14, color: '#ffb040', glow: '#ff3414', core: '#fff4b0', swing: 150, after: 4, rush: false });
        k.pillar(t.x, t.y + 16, { w: 18 * c.sz, color: '#ffb040', glow: '#ff5a1a', core: '#fff2a0', delay: h + 40, life: 520, burst: false });
        k.flames(t.x, t.y + 18 * c.sz, { w: 34 * c.sz, h: 44 * c.sz, n: 6, delay: h, life: 620, embers: !c.all });
        strike(fx, c, t, h, { r: 20, glow: '#ff5a1a', colors: COL.fire, n: 44, heavy: i === 0, rings: 2, extra: 34, extraCols: COL.fire });
        k.particles(t.x, t.y, { colors: COL.fire, n: per(c, 24), speed: 60, ang: -Math.PI / 2, spread: 1, g: -50, delay: h + 160, life: 560 });
      });
      k.flash('#fff2a0', 100, c.hit);
      k.shake(320, 2.4, c.hit);
    },
  },
  // ───── 永遠のライバル（2人）: 赤と 青の 2本の すじが 左右から 走って 敵の 前で ガキンと 交わる → 赤と 青の 十字の 光 → 2色の 火花 ─────
  ox_eien_rival: {
    sfx: 'ax_o1_rival',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const RED = { color: '#ff8a8a', glow: '#ff2a2a', core: '#ffffff' }, BLUE = { color: '#9ad8ff', glow: '#2a6aff', core: '#ffffff' };
      c.each((t, i, d) => {
        const h = d + c.hit;
        for (const [s, col] of [[-1, RED], [1, BLUE]]) {
          k.dash(t.x + s * 110, t.y + 14, t.x + s * 6, t.y, { color: col.color, travel: c.hit, w: 5, h: 22, n: 4, delay: d });
          line(fx, t.x + s * 120, t.y + 16, t.x + s * 4, t.y, { w: 3, ...col, draw: c.hit, hold: 120, life: c.hit + 300, delay: d });
          k.crescent(t.x + s * 10, t.y, { r: 30 * c.sz, a0: s < 0 ? -2.2 : -0.9, a1: s < 0 ? 0.4 : -3.5, w: 9, ...col, delay: h - 60, swing: 110, life: 380, after: 3 });
        }
        line(fx, t.x - 40 * c.sz, t.y, t.x + 40 * c.sz, t.y, { w: 4, ...RED, draw: 60, hold: 260, life: 520, delay: h + 30 });
        line(fx, t.x, t.y - 40 * c.sz, t.x, t.y + 40 * c.sz, { w: 4, ...BLUE, draw: 60, hold: 260, life: 520, delay: h + 30 });
        fx.star(t.x, t.y, '#ffffff', 36 * c.sz, h, 280);
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff5a5a'], n: per(c, 22), speed: 190, ang: Math.PI, spread: 1.2, delay: h, life: 460, len: 7 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#5a9aff'], n: per(c, 22), speed: 190, ang: 0, spread: 1.2, delay: h, life: 460, len: 7 });
        strike(fx, c, t, h, { r: 20, glow: '#ffffff', colors: ['#ffffff', '#ff8a8a', '#9ad8ff'], n: 34, heavy: i === 0, rings: 2, extra: 26 });
      });
      k.flash('#ffffff', 90, c.hit);
      k.shake(300, 2.4, c.hit);
    },
  },
  // ───── いかずちの剣（2人）: 空から いなずまが 剣に → 剣が 黄色く 光る → いなずまの 剣で 縦に 斬る → 電気の 輪 ─────
  ox_ikazuchi_ken: {
    sfx: 'ax_o1_ikazuchi',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const sy = c.fromAlly ? c.H - 26 : o.y - 14;
      k.bolt(o.x + 6, -10, o.x + 6, sy, { w: 4, amp: 10, forks: 3, delay: 100, life: 300, grow: 80 });
      k.bolt(o.x - 4, -10, o.x + 6, sy, { w: 2, amp: 8, forks: 1, delay: 160, life: 220, grow: 60 });
      fx.glow(o.x + 6, sy, { color: '#ffd83a', r: 26, delay: 180, life: 360, alpha: 1 });
      line(fx, o.x + 6, sy, o.x + 14, sy - 30, { w: 4, color: '#fff6b0', glow: '#ffd83a', draw: 80, hold: 200, life: 400, delay: 200 });
      k.tint('#2a2a6a', { a: 0.12, life: 300, fin: 40, fout: 160, delay: 80 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 46, ang: -1.45, w: 14, color: '#fff6b0', glow: '#ffd83a', core: '#ffffff', swing: 140, after: 4 });
        k.bolt(t.x, t.y - 50 * c.sz, t.x, t.y + 30 * c.sz, { w: 3, amp: 6, forks: 2, delay: h, life: 260, grow: 40 });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 10, r1: (40 + j * 14) * c.sz, color: j % 2 ? '#ffffff' : '#ffd83a', w: 2.4, delay: h + 60 + j * 90, life: 380 });
        for (let j = 0; j < (c.all ? 3 : 6); j++) { const a = (j / 6) * TAU; k.bolt(t.x + Math.cos(a) * 30 * c.sz, t.y + Math.sin(a) * 26 * c.sz, t.x + Math.cos(a + 0.9) * 30 * c.sz, t.y + Math.sin(a + 0.9) * 26 * c.sz, { w: 1.3, amp: 4, forks: 0, delay: h + 100 + j * 30, life: 160, grow: 30 }); }
        strike(fx, c, t, h, { r: 20, glow: '#ffd83a', colors: COL.bolt, n: 44, heavy: i === 0, rings: 2, extra: 34, extraCols: COL.bolt });
      });
      k.flash('#fff6b0', 100, c.hit);
      k.shake(320, 2.4, c.hit);
    },
  },
  // ───── デルタストライク（3人）: 剣の 白・こぶしの オレンジ・呪文の 属性色の 3つの 光が 三角形の 頂点から → 1点に あつまって 大爆発 → 三角形が のこる ─────
  ox_delta_strike: {
    sfx: 'ax_o1_delta',
    allyFx: 'blast',
    play(fx, c) {
      const { k } = c;
      const E = elemOf(c.element || 'none');
      const t0 = c.t;
      const cols = ['#ffffff', '#ff8a3a', E.main];
      const R = 46;
      tri(fx, t0.x, t0.y, { r: R, cols, draw: 300, shrink: c.hit - 160, life: c.hit + 40, fout: 40, delay: 0 });
      for (let j = 0; j < 3; j++) {
        const a = -Math.PI / 2 + j * TAU / 3;
        const vx = t0.x + Math.cos(a) * R, vy = t0.y + Math.sin(a) * R;
        fx.glow(vx, vy, { color: cols[j], r: 14, delay: 100 + j * 160, life: 400, alpha: 1 });
        glitter(fx, vx, vy, { n: 6, spread: 8, colors: [cols[j], '#ffffff'], dur: 200, delay: 100 + j * 160, size: 4 });
        k.orb(vx, vy, { r: 5, color: cols[j], glow: cols[j], rim: '#ffffff', arms: 2, grow: 80, to: { x: t0.x, y: t0.y }, start: c.hit - 300 - 100 - j * 160 > 80 ? c.hit - 300 - (100 + j * 160) : 80, travel: 260, delay: 100 + j * 160 });
      }
      tri(fx, t0.x, t0.y, { r: R * 1.2, cols, draw: 120, life: 700, fout: 400, delay: c.hit + 100 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        blast(fx, t.x, t.y, { r: 24 * c.sz, glow: E.main === '#bfe4ff' ? '#ffb060' : E.main, colors: ['#ffffff', '#ffb060', E.main], n: per(c, 40), delay: h, heavy: i === 0, puffs: c.all ? 1 : 4 });
        if (!c.all) elemFx(fx, c, t, h + 80, E, 1.2);
        strike(fx, c, t, h, { r: 20, glow: '#ffffff', colors: ['#ffffff', '#ffb060', E.main], n: 36, rings: c.all ? 1 : 2, extra: 30, extraCols: cols });
        k.shockwave(t.x, t.y, { r0: 10, r1: 80 * c.sz, color: '#ffffff', w: 3, n: c.all ? 1 : 3, gap: 90, delay: h });
      });
      k.flash('#ffffff', 120, c.hit);
      k.shake(380, 2.8, c.hit);
    },
  },
  // ───── 三剣士の大一番（3人）: 白・金・青の 3本の 剣の すじが 敵全体を 3回ずつ → 3本の 縦斬りが 同時に → 花びら・火花 ─────
  ox_sanken_ooichiban: {
    sfx: 'ax_o1_sanken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const S = [
        { color: '#ffffff', glow: '#9ad8ff', core: '#ffffff' },
        { color: '#fff0a0', glow: '#ffd23a', core: '#ffffff' },
        { color: '#bfe4ff', glow: '#3a7aff', core: '#ffffff' },
      ];
      // 3人の 剣士の かげ（下に ならぶ）
      for (let j = 0; j < 3; j++) figure(fx, c.W / 2 + (j - 1) * 80, c.dir === 'down' ? 40 : c.H + 4, { s: 1.3, pose: 'up', color: S[j].glow, blade: S[j].color, alpha: 0.7, life: c.hit + 200, fout: 200, delay: j * 60 });
      c.each((t, i, d) => {
        for (let j = 0; j < 9; j++) {
          if (c.all && j % 3 === 1) continue;
          const s = S[j % 3];
          const at = d + c.hit - 160 + j * 55;
          swing(fx, c, t, at, { r: 30 + (j % 3) * 4, ang: (j % 2 ? 0.8 : -0.8) + (j % 3) * 0.15, w: 8, ...s, swing: 90, after: 2, flip: j % 2 === 1, spark: false, rush: false });
          if (!c.all) fx.sparks(t.x, t.y, { colors: [s.core, s.color, s.glow], n: 6, speed: 150, delay: at, life: 300, len: 6 });
        }
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#ffffff', colors: COL.white, n: per(c, 14), delay: d + c.hit - 160, heavy: i === 0 });
        const f = d + c.hit + 420;
        for (let j = 0; j < 3; j++) line(fx, t.x + (j - 1) * 14 * c.sz, t.y - 46 * c.sz, t.x + (j - 1) * 14 * c.sz, t.y + 46 * c.sz, { w: 3.6, color: S[j].color, glow: S[j].glow, draw: 70, hold: 240, life: 520, delay: f - 60 });
        strike(fx, c, t, f, { r: 20, glow: '#ffd23a', colors: ['#ffffff', '#fff0a0', '#bfe4ff'], n: 40, heavy: i === 0, rings: 2, extra: 24 });
        k.petals(t.x, t.y - 24, { n: per(c, 18), colors: ['#ffffff', '#f7a1c4', '#ffd0e4'], delay: f + 80, life: 760, spread: 34 });
      });
      k.flash('#ffffff', 100, c.hit + 420);
      k.shake(500, 1.4, c.hit - 160);
      k.shake(320, 2.6, c.hit + 420);
    },
  },
  // ───── グランドフィナーレ（4人）: 白・赤・青・緑の 光が 4方から あつまり 1本の 金の 光の 槍 → つらぬく → 大きな 光の 柱＋金の 紙ふぶき ─────
  ox_grand_finale: {
    sfx: 'ax_o1_finale',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const t0 = c.t;
      const cols = ['#ffffff', '#ff5a5a', '#5a9aff', '#7dffb0'];
      const meet = { x: c.W / 2, y: 22 };
      const from = [[-20, 20], [c.W + 20, 20], [-20, 110], [c.W + 20, 110]];
      for (let j = 0; j < 4; j++) {
        const [x0, y0] = from[j];
        k.orb(x0, y0, { r: 7, color: cols[j], glow: cols[j], rim: '#ffffff', arms: 3, grow: 100, to: meet, start: 100 + j * 60, travel: 300, delay: 0 });
        line(fx, x0, y0, meet.x, meet.y, { w: 2, color: cols[j], glow: cols[j], core: '#ffffff', draw: 400 + j * 60, hold: 60, life: 560 + j * 60, alpha: 0.7 });
      }
      fx.glow(meet.x, meet.y, { color: '#ffd23a', r: 30, delay: 560, life: 400, alpha: 1 });
      k.gather(meet.x, meet.y, { colors: ['#ffffff', '#ffd23a', ...cols], n: 18, r: 40, life: 240, delay: 500 });
      k.shockwave(meet.x, meet.y, { r0: 6, r1: 50, color: '#ffd23a', w: 2.4, n: 2, gap: 90, delay: 620 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        line(fx, meet.x, meet.y, t.x, t.y, { w: 7, color: '#fff0a0', glow: '#ffd23a', core: '#ffffff', draw: c.hit - 700, hold: 300, life: c.hit - 700 + 560, delay: 700 + d });
        k.pillar(t.x, t.y + 14, { w: 26 * c.sz, color: '#fff6d0', glow: '#ffd23a', delay: h, life: 700, burst: false });
        strike(fx, c, t, h, { r: 22, glow: '#ffd23a', colors: ['#ffffff', '#fff0a0', '#ffd23a'], n: 50, heavy: i === 0, rings: 3, extra: 40, extraCols: COL.gold });
        k.shockwave(t.x, t.y, { r0: 10, r1: 90 * c.sz, color: '#ffd23a', w: 3, n: 3, gap: 100, delay: h + 40 });
        k.shapes(t.x, t.y - 40, { shape: 'card', n: per(c, 30), colors: ['#ffd23a', '#ff5a5a', '#5a9aff', '#7dffb0', '#ffffff'], speed: 90, g: 60, size: 2.6, delay: h + 200, life: 900 });
      });
      k.flash('#fff6d0', 140, c.hit);
      k.shake(420, 2.8, c.hit);
    },
  },
  // ───── なぞはすべて解けた！（4人）: 手がかりカードが 4まい 回って 1つに → 大きな 虫めがねの 光が 敵全体を なめる → 電球の ピカーン → 金の きらきら ─────
  ox_nazo_toketa: {
    sfx: 'ax_o1_nazo',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const cx = c.W / 2, cy = c.dir === 'down' ? 40 : 34;
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * TAU;
        prop(fx, 'clue', cx + Math.cos(a) * 50, cy + Math.sin(a) * 20, { v: j, s: 2, spin: 3, life: 520, fout: 80, delay: j * 80, to: { x: cx, y: cy }, travel: 420 - j * 40, moveAt: 100, pop: true });
      }
      glitter(fx, cx, cy, { n: 12, ring: 26, sy: 0.6, colors: COL.gold, dur: 400, size: 3 });
      fx.glow(cx, cy, { color: '#fff6d0', r: 26, delay: 500, life: 260, alpha: 1 });
      // 虫めがねが 左から 右へ なめる
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40;
      prop(fx, 'magnifier', x0, C.y - 6, { s: 2.6, life: c.hit - 300, fout: 120, delay: 560, to: { x: x1, y: C.y - 6 }, travel: c.hit - 560 - 120, ease: 'io', pop: true });
      prop(fx, 'bulb', cx, cy + 4, { s: 2.6, life: c.len - c.hit + 100, fout: 300, delay: c.hit - 60 });
      text(fx, 'ピカーン', cx, cy + 32, { size: 9, color: '#fff6b0', color2: '#5a3a08', life: 600, fout: 200, delay: c.hit });
      c.each((t, i, d) => {
        const h = d + c.hit;
        spot(fx, t.x, t.y, { w: 22 * c.sz, life: c.len - c.hit, fout: 300, delay: h - 100 });
        strike(fx, c, t, h, { r: 20, glow: '#ffd23a', colors: COL.gold, n: 46, heavy: i === 0, rings: 2, extra: 36, extraCols: ['#ffffff', '#fff6b0', '#ffd23a'] });
        k.shapes(t.x, t.y - 20, { shape: 'star', n: per(c, 18), colors: COL.gold, speed: 70, size: 3, delay: h + 120, life: 700 });
        arrows(fx, t.x + 22 * c.sz, t.y - 6, { color: '#5a9aff', up: false, n: 2, delay: h + 160 });
      });
      k.flash('#fff6d0', 120, c.hit);
      k.shake(300, 2.2, c.hit);
    },
  },
};
void [ELEM, src, figure, rich, pick, dust, zzz, swing];
