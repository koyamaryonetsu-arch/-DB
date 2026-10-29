// 第49回 O1: 超級の 剣（魔剣士・ソードマスター）の え
// 魔剣士 … むらさき黒の 太い 刃・闇の うず・たましいの 光の 玉・むらさきの 鎖・黒い マントの もや・青むらさきの 鬼火・闇の 十字
// ソードマスター … 光の 斬り上げと 光の 柱・よろいが くだける・赤い 命の 糸・天の いなずまの 一閃・4色の 剣技・千の 白い すじ
import {
  COL, src, above, prop, chain, arrows, strike, swing, figure, pick, dust,
  hitBurst, blast, glitter, rich, per, line, g3prop,
} from './axfx-o1-kit.js?v=0e454fdbf852';

const DARK = { color: '#b48aff', glow: '#6a2ab8', core: '#f0e0ff' };
const DARKCOL = ['#f0e0ff', '#b48aff', '#6a3ab8', '#2a1040'];
const ONI = ['#e0e8ff', '#8a9aff', '#6a5aff', '#b48aff'];
const LIGHT = { color: '#fff6d0', glow: '#ffd23a', core: '#ffffff' };

// 闇の うず（黒い もやが まわる）
function darkSwirl(fx, c, x, y, at, n = 18) {
  fx.swirl(x, y, ['#6a3ab8', '#2a1040', '#b48aff'], { n: per(c, n), rad: 18 * c.sz, h: 30, delay: at, life: 520, size: 1.8 });
}
// のぼる 黒い つぶ
function darkRise(fx, c, x, y, at, n = 12) {
  fx.sparks(x, y, { colors: ['#2a1040', '#6a3ab8', '#b48aff'], n: per(c, n), speed: 40, ang: -Math.PI / 2, spread: 0.9, g: -50, drag: 0.97, delay: at, life: 560, len: 3, size: 1.2, add: false });
}

export const AX_O1_KEN2 = {
  // ───── ダークネスブレード（魔剣士 Lv1）: むらさき黒の 太い 斬げき＋闇の うず → 黒い ひびの 光 → 黒い つぶが のぼる ─────
  ox_darkness_blade: {
    charge: { color: '#8a5ad8', color2: '#2a1040' },
    sfx: 'ax_o1_darkblade',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 44, ang: -0.8, w: 14, ...DARK, swing: 140, after: 4 });
        darkSwirl(fx, c, t.x, t.y, h - 60, 22);
        fx.crack(t.x, t.y, { n: 6, len: 26 * c.sz, color: '#1a0830', hi: '#b48aff', delay: h, life: 700, sy: 0.7 });
        strike(fx, c, t, h, { r: 17, glow: '#8a5ad8', colors: DARKCOL, n: 28, heavy: i === 0, rings: 2, extra: 12, extraCols: COL.dark });
        k.shockwave(t.x, t.y, { r0: 8, r1: 56 * c.sz, color: '#6a3ab8', w: 2.6, n: 2, gap: 90, delay: h + 30 });
        darkRise(fx, c, t.x, t.y + 10, h + 160, 14);
      });
      k.tint('#2a0a40', { a: 0.12, life: 300, fin: 60, fout: 180, delay: c.hit });
      k.shake(280, 2, c.hit);
    },
  },
  // ───── ソウルイーター（魔剣士 Lv3）: 闇の 斬げき → 白い 光の 玉が 3つ ゆらゆら 自分へ → 自分が むらさきと 緑に 光る ─────
  ox_soul_eater: {
    charge: { color: '#8a5ad8', color2: '#c8ffe0' },
    sfx: 'ax_o1_soul',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const oy = c.fromAlly ? c.H - 16 : o.y;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 40, ang: 0.8, w: 12, ...DARK, swing: 130, after: 3, flip: true });
        darkSwirl(fx, c, t.x, t.y, h - 40, 16);
        strike(fx, c, t, h, { r: 16, glow: '#8a5ad8', colors: DARKCOL, n: 30, heavy: i === 0, rings: 2, extra: 18, extraCols: COL.dark });
        for (let j = 0; j < (c.all ? 1 : 3); j++) {
          const at = h + 120 + j * 90;
          k.orb(t.x + (j - 1) * 10, t.y - 6, { r: 4.5, color: '#ffffff', glow: '#c8ffe0', rim: '#ffffff', arms: 0, grow: 80, to: { x: o.x + (j - 1) * 8, y: oy - 10 }, start: 80, travel: 380, hop: 26 + j * 10, delay: at });
        }
      });
      const at = c.hit + 560;
      fx.glow(o.x, oy - 10, { color: '#b48aff', r: 26, delay: at, life: 360, alpha: 0.9 });
      fx.glow(o.x, oy - 10, { color: '#7dffb0', r: 20, delay: at + 80, life: 360, alpha: 0.9 });
      glitter(fx, o.x, oy - 14, { n: 14, spread: 18, colors: COL.heal, dur: 300, delay: at, vy: -20 });
      k.shockwave(o.x, oy - 6, { r0: 6, r1: 30, color: '#7dffb0', w: 1.8, delay: at });
      k.shake(240, 1.8, c.hit);
    },
  },
  // ───── じゅばくのやいば（魔剣士 Lv5）: 黒い 刃 → むらさきの 鎖が ぐるぐる まきつく → 鎖が 光って 消える ─────
  ox_jubaku_yaiba: {
    charge: { color: '#8a5ad8', color2: '#e0c8ff' },
    sfx: 'ax_o1_jubaku',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 40, ang: -0.6, w: 12, ...DARK, swing: 130, after: 3 });
        strike(fx, c, t, h, { r: 16, glow: '#8a5ad8', colors: DARKCOL, n: 30, heavy: i === 0, rings: 2, extra: 14, extraCols: COL.dark });
        chain(fx, t.x, t.y, { r0: 40 * c.sz, r1: 17 * c.sz, n: c.all ? 10 : 14, rows: 2, h: 16 * c.sz, color: '#d8b8ff', color2: '#4a1a7a', wrap: 300, life: c.len - c.hit - 40, fout: 200, delay: h + 60 });
        fx.glow(t.x, t.y, { color: '#b48aff', r: 30 * c.sz, delay: c.len - 300 + d, life: 260, alpha: 0.8 });
        glitter(fx, t.x, t.y, { n: per(c, 16), ring: 18 * c.sz, sy: 0.5, colors: COL.dark, dur: 160, delay: c.len - 300 + d, size: 3 });
        g3prop(fx, 'spiral', t.x, t.y - 24 * c.sz, { s: 2, color: '#d8b8ff', life: 420, fout: 160, delay: h + 360 });
        k.particles(t.x, t.y, { colors: COL.dark, n: per(c, 14), speed: 90, delay: h + 360, life: 360 });
      });
      k.shake(240, 1.8, c.hit);
    },
  },
  // ───── 暗黒の衣（魔剣士 Lv7・自分）: 黒い マントの もやが 体を つつむ → 赤い 目の 光 → もやが すいこまれる ─────
  ox_ankoku_koromo: {
    charge: { color: '#6a3ab8', color2: '#2a1040' },
    sfx: 'ax_o1_ankoku',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.glyph(t.x, t.y + 8, { r: 24, color: '#8a5ad8', color2: '#2a1040', delay: d, life: c.len - 100 });
        for (let j = 0; j < (c.all ? 4 : 9); j++) {
          const a = (j / 9) * Math.PI * 2;
          fx.puff(t.x + Math.cos(a) * 16, t.y + 6, { color: j % 2 ? '#2a1040' : '#4a2a7a', r0: 4, r1: 14, vx: -Math.cos(a) * 10, vy: -26 - (j % 3) * 8, life: 520, alpha: 0.7, delay: d + j * 25 });
        }
        k.aura(t.x, t.y + 8, { style: 'flame', r: 16, h: 36, color: '#6a3ab8', color2: '#b48aff', delay: d + 80, life: c.len - 160, alpha: 0.55 });
        prop(fx, 'eyes', t.x, t.y - 18, { s: 1.6, life: 420, fout: 200, delay: h - 80 });
        k.gather(t.x, t.y - 4, { colors: ['#b48aff', '#2a1040', '#ffffff'], n: per(c, 18), r: 36, life: 260, delay: h, waves: 2, gap: 120 });
        hitBurst(fx, t.x, t.y - 4, { r: 12, glow: '#8a5ad8', colors: DARKCOL, n: per(c, 20), delay: h + 300, star: false });
        arrows(fx, t.x + 20, t.y - 8, { color: '#ff5a5a', up: true, n: 3, delay: h + 300, life: 340 });
      });
      k.tint('#1a0830', { a: 0.12, life: 400, fin: 100, fout: 200, delay: 0 });
      k.shake(200, 1.4, c.hit + 300);
    },
  },
  // ───── ハデスブレイド（魔剣士 Lv10）: 地面から 青むらさきの 炎 → 大きな 横なぎの 闇の 三日月 → 地面の ひび・鬼火の 火の粉 ─────
  ox_hades_blade: {
    charge: { color: '#6a5aff', color2: '#e0e8ff', power: 1.3 },
    sfx: 'ax_o1_hades',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const gy = Math.max(...c.targets.map((t) => t.y)) + 16 * c.sz;
      // 青むらさきの 炎が ならぶ
      for (let j = 0; j < 7; j++) k.flames(c.W / 2 + (j - 3) * 34, gy + (j % 2) * 4, { w: 22, h: 34, cols: ['#3a2aa8', '#6a5aff', '#c8d0ff'], n: 3, delay: j * 25, life: c.hit + 360, embers: false });
      k.tint('#1a0a3a', { a: 0.14, life: 420, fin: 80, fout: 220, delay: c.hit - 60 });
      // 大きな 横なぎ（画面の はばの 三日月）
      const dn = c.dir === 'down';
      k.crescent(C.x, dn ? C.y - 70 : C.y + 70, { r: 120, a0: dn ? 2.6 : -2.6, a1: dn ? 0.55 : -0.55, w: 16, color: '#c8b0ff', glow: '#6a2ab8', core: '#ffffff', delay: c.hit - 120, swing: 200, life: 460, after: 4 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        strike(fx, c, t, h, { r: 18, glow: '#6a5aff', colors: ONI, n: 40, heavy: i === 0, rings: 2, extra: 36, extraCols: ONI });
        fx.crack(t.x, t.y + 18 * c.sz, { n: 6, len: 26 * c.sz, color: '#0a0420', hi: '#8a9aff', delay: h, life: 800, sy: 0.4 });
        k.pillar(t.x, t.y + 16, { w: 8 * c.sz, color: '#8a9aff', glow: '#6a5aff', delay: h + 80, life: 360, burst: false, from: t.y + 16 - 60 });
        // 鬼火（ふわふわ のぼる 青い 火）
        for (let j = 0; j < (c.all ? 2 : 5); j++) fx.twinkle(t.x + (j - 2) * 10, t.y + 6, { color: j % 2 ? '#8a9aff' : '#c8d0ff', size: 4, delay: h + 200 + j * 60, life: 600, vy: -24 });
        darkRise(fx, c, t.x, t.y + 14, h + 200, 22);
      });
      k.flash('#c8d0ff', 90, c.hit);
      k.shake(340, 2.4, c.hit);
    },
  },
  // ───── やみの十字（ひらめき）: 縦・横 2本の 闇の 斬げきで 十字 → 十字が 黒く 光って 爆ぜる → むらさきの 十字が うすれる ─────
  ox_yami_juuji: {
    charge: { color: '#8a5ad8', color2: '#2a1040', power: 1.2 },
    sfx: 'ax_o1_yamijuuji',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        const L = 44 * c.sz;
        line(fx, t.x, t.y - L, t.x, t.y + L, { w: 5, color: '#b48aff', glow: '#6a2ab8', core: '#ffffff', draw: 70, hold: 360, life: 700, delay: h - 130 });
        line(fx, t.x - L, t.y, t.x + L, t.y, { w: 5, color: '#b48aff', glow: '#6a2ab8', core: '#ffffff', draw: 70, hold: 260, life: 600, delay: h - 20 });
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#8a5ad8', colors: DARKCOL, n: per(c, 16), delay: h - 60, star: false });
        blast(fx, t.x, t.y, { r: 18 * c.sz, glow: '#8a5ad8', core: '#f0e0ff', colors: DARKCOL, n: per(c, 36), delay: h + 120, heavy: i === 0, smoke: '#2a1040', puffs: c.all ? 1 : 4 });
        prop(fx, 'cross', t.x, t.y, { s: 2.6 * c.sz, color: '#8a5ad8', life: 640, fout: 360, delay: h + 120, add: true });
        darkSwirl(fx, c, t.x, t.y, h + 120, 22);
        k.shockwave(t.x, t.y, { r0: 8, r1: 60 * c.sz, color: '#b48aff', w: 2.6, n: 2, gap: 100, delay: h + 120 });
        darkRise(fx, c, t.x, t.y + 6, h + 300, 18);
      });
      k.tint('#2a0a40', { a: 0.13, life: 300, fin: 60, fout: 180, delay: c.hit + 120 });
      k.shake(160, 1.4, c.hit);
      k.shake(300, 2.4, c.hit + 120);
    },
  },

  // ───── 聖剣・光明斬（ソードマスター Lv1）: 光の 剣で 斬り上げる → 光の 柱＋ゆうれいを はらう 白い 波 → 金の 羽 ─────
  ox_koumyou_zan: {
    charge: { color: '#ffe08a', color2: '#ffffff' },
    sfx: 'ax_o1_koumyou',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 44, ang: 1.4, w: 13, ...LIGHT, swing: 140, after: 4, flip: true });
        k.pillar(t.x, t.y + 14, { w: 20 * c.sz, color: '#fff6d0', glow: '#ffd23a', delay: h + 40, life: 560, burst: false });
        for (let j = 0; j < 3; j++) fx.shock(t.x, t.y, { r0: 10, r1: (50 + j * 22) * c.sz, color: '#ffffff', w: 2.4 - j * 0.5, delay: h + 60 + j * 90, life: 460 });
        strike(fx, c, t, h, { r: 18, glow: '#ffd23a', colors: COL.holy, n: 34, heavy: i === 0, rings: 2, extra: 26, extraCols: COL.gold });
        k.shapes(t.x, t.y - 10, { shape: 'petal', n: per(c, 18), colors: ['#fff6d0', '#ffd23a', '#ffffff'], speed: 60, g: 26, size: 3.2, delay: h + 120, life: 760 });
      });
      k.flash('#fff6d0', 100, c.hit);
      k.shake(280, 2, c.hit);
    },
  },
  // ───── 破剣・よろいくだき（ソードマスター Lv3）: 重い 斬げき → 灰色の よろいの 板が ガシャンと くだける → 鉄の 欠片と 火花 ─────
  ox_yoroi_kudaki: {
    charge: { color: '#c8d8f0', color2: '#ffffff' },
    sfx: 'ax_o1_yoroi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const h = d + c.hit;
        prop(fx, 'armor', t.x, t.y, { s: 2.2 * c.sz, life: c.hit + 20, fout: 30, delay: d });
        swing(fx, c, t, h, { r: 44, ang: -1.2, w: 14, color: '#e8f0ff', glow: '#7a9ac8', core: '#ffffff', swing: 140, after: 4 });
        for (const s of [-1, 1]) prop(fx, 'armor', t.x + s * 3, t.y, { half: s, s: 2.2 * c.sz, life: 520, fout: 200, delay: h, vx: s * 80, vy: -50, g: 300, spin: s * 4, pop: false });
        k.debris(t.x, t.y, { n: per(c, 22), colors: ['#9aa8bc', '#6a7484', '#e8f0ff'], up: 170, delay: h, shape: 'diamond', size: 2 });
        strike(fx, c, t, h, { r: 18, glow: '#ffe066', colors: ['#ffffff', '#ffe066', '#ffb040'], n: 40, heavy: i === 0, rings: 2 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 56 * c.sz, color: '#e8f0ff', w: 2.6, n: 2, gap: 90, delay: h });
        arrows(fx, t.x + 22 * c.sz, t.y - 8, { color: '#5a9aff', up: false, n: 3, delay: h + 160, life: 420, dx: 10 });
      });
      k.flash('#ffffff', 80, c.hit);
      k.shake(300, 2.2, c.hit);
    },
  },
  // ───── 暗黒剣・命吸い（ソードマスター Lv5）: 黒い 剣で 斬る → 赤い 光の つぶが 糸の ように 自分へ → 自分が 緑に 光る ─────
  ox_inochi_sui: {
    charge: { color: '#3a1a4a', color2: '#ff5a5a' },
    sfx: 'ax_o1_inochi',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const oy = c.fromAlly ? c.H - 16 : o.y;
      c.each((t, i, d) => {
        const h = d + c.hit;
        swing(fx, c, t, h, { r: 42, ang: -0.9, w: 13, color: '#4a2a5a', glow: '#1a0820', core: '#ff8a8a', swing: 130, after: 4 });
        strike(fx, c, t, h, { r: 16, glow: '#ff3a5a', colors: ['#ffffff', '#ff8a8a', '#3a1a4a'], n: 32, heavy: i === 0, rings: 2 });
        // 赤い 命の 糸（3本）と ながれる つぶ
        for (let j = 0; j < (c.all ? 1 : 3); j++) {
          const at = h + 100 + j * 70;
          line(fx, t.x + (j - 1) * 6, t.y, o.x + (j - 1) * 6, oy - 10, { w: 1.2, color: '#ff8a8a', glow: '#ff3a5a', core: '#ffd0d0', draw: 240, hold: 120, life: 520, delay: at });
          for (let q = 0; q < 6; q++) {
            const u = q / 6;
            fx.twinkle(t.x + (o.x - t.x) * u, t.y + (oy - 10 - t.y) * u - Math.sin(u * Math.PI) * 6, { color: q % 2 ? '#ff5a5a' : '#ffd0d0', size: 3, delay: at + q * 45, life: 260 });
          }
        }
        darkRise(fx, c, t.x, t.y + 8, h + 120, 14);
      });
      const at = c.hit + 480;
      fx.glow(o.x, oy - 10, { color: '#7dffb0', r: 28, delay: at, life: 420, alpha: 0.9 });
      glitter(fx, o.x, oy - 14, { n: 16, spread: 20, colors: COL.heal, dur: 320, delay: at, vy: -24 });
      k.particles(o.x, oy - 6, { colors: COL.heal, n: 14, speed: 60, ang: -Math.PI / 2, spread: 0.6, delay: at, life: 380 });
      k.shake(260, 2, c.hit);
    },
  },
  // ───── 雷神一閃（ソードマスター Lv7）: 空から 太い いなずまが 剣に → 横一文字の 黄色い 一閃が 画面を はしる → 敵全体に いなずまの えだ ─────
  ox_raijin_issen: {
    charge: { color: '#ffd83a', color2: '#ffffff', power: 1.2 },
    sfx: 'ax_o1_raijin',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      const sy = c.fromAlly ? c.H - 24 : o.y - 16;
      k.bolt(o.x + 4, -10, o.x + 4, sy, { w: 4, amp: 10, forks: 3, delay: 0, life: 260, grow: 70 });
      k.bolt(o.x - 6, -10, o.x + 2, sy, { w: 2, amp: 8, forks: 1, delay: 50, life: 200, grow: 60 });
      fx.glow(o.x, sy, { color: '#ffd83a', r: 28, delay: 70, life: 260, alpha: 1 });
      k.tint('#2a2a6a', { a: 0.12, life: 260, fin: 40, fout: 140, delay: 0 });
      const C = c.center;
      line(fx, -10, C.y, c.W + 10, C.y, { w: 5, color: '#fff6b0', glow: '#ffd83a', core: '#ffffff', draw: 90, hold: 160, life: 420, delay: c.hit - 90 });
      k.streaks({ ang: 0, color: '#fff6b0', n: 16, delay: c.hit - 90, life: 260, speed: 1.6, alpha: 0.5 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        k.bolt(t.x, -10, t.x, t.y, { w: 2.6, amp: 7, forks: 2, delay: h, life: 240, grow: 40 });
        for (let j = 0; j < (c.all ? 2 : 4); j++) {
          const a = j * 1.57 + 0.6;
          k.bolt(t.x, t.y, t.x + Math.cos(a) * 30 * c.sz, t.y + Math.sin(a) * 24 * c.sz, { w: 1.4, amp: 5, forks: 1, delay: h + 60 + j * 40, life: 180, grow: 30 });
        }
        strike(fx, c, t, h, { r: 18, glow: '#ffd83a', colors: COL.bolt, n: 36, heavy: i === 0, rings: 2, extra: 22, extraCols: COL.bolt });
      });
      k.flash('#fff6b0', 100, c.hit);
      k.shake(300, 2.2, c.hit);
    },
  },
  // ───── 全剣技（ソードマスター Lv10）: 炎・氷・雷・光の 4色の 斬げきが 敵全体を 2回ずつ → 4色が まざった 白い 十字 → 4色の 火の粉 ─────
  ox_zenkengi: {
    charge: { color: '#ffffff', color2: '#ffd23a', power: 1.3 },
    sfx: 'ax_o1_zenken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const S = [
        { color: '#ffb040', glow: '#ff5a1a', core: '#fff2a0' },
        { color: '#e6fbff', glow: '#7ad8ff', core: '#ffffff' },
        { color: '#fff6b0', glow: '#ffd83a', core: '#ffffff' },
        { color: '#fff6d0', glow: '#ffd23a', core: '#ffffff' },
      ];
      const MIX = ['#ff8a3a', '#7ad8ff', '#ffd83a', '#ffffff'];
      c.each((t, i, d) => {
        for (let j = 0; j < 8; j++) {
          if (c.all && j % 2) continue;
          const at = d + c.hit + j * 70;
          const s = S[j % 4];
          swing(fx, c, t, at, { r: 34 + (j % 3) * 4, ang: (j % 2 ? 0.9 : -0.9) + (j % 3) * 0.2, w: 9, ...s, swing: 90, after: 2, flip: j % 2 === 1, spark: false, rush: false });
          if (!c.all) fx.sparks(t.x, t.y, { colors: [s.core, s.color, s.glow], n: 8, speed: 150, delay: at, life: 320, len: 6 });
        }
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#ffffff', colors: MIX, n: per(c, 14), delay: d + c.hit, heavy: i === 0 });
        const f = d + c.hit + 620;
        const L = 46 * c.sz;
        line(fx, t.x - L, t.y, t.x + L, t.y, { w: 4, color: '#ffffff', glow: '#ffd23a', draw: 60, hold: 220, life: 460, delay: f });
        line(fx, t.x, t.y - L, t.x, t.y + L, { w: 4, color: '#ffffff', glow: '#7ad8ff', draw: 60, hold: 220, life: 460, delay: f });
        strike(fx, c, t, f, { r: 18, glow: '#ffffff', colors: MIX, n: 34, heavy: i === 0, rings: 2, extra: 20, extraCols: MIX });
        if (!c.all || i < 2) {
          k.pillar(t.x, t.y + 14, { w: 18 * c.sz, color: '#ffffff', glow: '#ffd23a', delay: f, life: 420, burst: false });
          S.forEach((s, j) => { const a = Math.PI / 4 + j * Math.PI / 2; line(fx, t.x, t.y, t.x + Math.cos(a) * 60 * c.sz, t.y + Math.sin(a) * 50 * c.sz, { w: 3, color: s.color, glow: s.glow, core: s.core, draw: 90, hold: 160, life: 420, delay: f + 40 }); fx.shock(t.x, t.y, { r0: 10, r1: (50 + j * 12) * c.sz, color: s.glow, w: 2, delay: f + 60 + j * 50, life: 380 }); });
        }
        k.particles(t.x, t.y, { colors: MIX, n: per(c, 18), speed: 60, ang: -Math.PI / 2, spread: 1, g: -40, delay: f + 100, life: 460 });
      });
      k.flash('#ffffff', 100, c.hit + 620);
      k.shake(500, 1.4, c.hit);
      k.shake(320, 2.4, c.hit + 620);
    },
  },
  // ───── 剣聖・千の太刀（ひらめき）: 画面いっぱいに 白い 細い すじ → 6回 ヒット → 一しゅん 止まって 全部の すじが 同時に 光る → 花びら ─────
  ox_sen_no_tachi: {
    charge: { color: '#ffffff', color2: '#bfe4ff', power: 1.2 },
    sfx: 'ax_o1_sennotachi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const N = 18;
      const flare = c.hit + 560;
      for (let j = 0; j < N; j++) {
        const a = (j * 2.399) % Math.PI;
        const cx = C.x + Math.cos(j * 1.7) * 30, cy = C.y + Math.sin(j * 2.3) * 16;
        const L = 90;
        const at = c.hit - 120 + j * 26;
        line(fx, cx - Math.cos(a) * L, cy - Math.sin(a) * L, cx + Math.cos(a) * L, cy + Math.sin(a) * L, { w: 1.2, color: '#ffffff', glow: '#9ad8ff', draw: 40, hold: Math.max(60, flare - at + 60), life: flare - at + 300, flare: j % 4 === 0 ? flare - at : -1, delay: at });
      }
      for (let j = 0; j < 6; j++) {
        const t = pick(c, j);
        const h = c.hit + j * 75;
        hitBurst(fx, t.x, t.y, { r: 12 * c.sz, glow: '#bfe4ff', colors: COL.white, n: c.all ? 6 : 10, delay: h, heavy: j === 0 });
      }
      c.each((t, i) => {
        fx.star(t.x, t.y, '#ffffff', (c.all ? 18 : 30) * c.sz, flare, 260);
        strike(fx, c, t, flare, { r: c.all ? 12 : 16, glow: '#9ad8ff', colors: COL.white, n: 24, heavy: i === 0, rings: 2 });
        k.petals(t.x, t.y - 20, { n: per(c, 14), colors: ['#ffffff', '#f7a1c4', '#ffd0e4'], delay: flare + 60, life: 700, spread: 30 });
      });
      k.flash('#e8f4ff', 60, flare);
      k.shake(400, 1.2, c.hit);
      k.shake(300, 2.4, flare);
    },
  },
};
void [above, figure, dust, rich];
