// 第48回 G3: 暴れん坊将軍 ＋ G3 の 合体技の 大技の え
// 将軍 … 金の 刀の 光・みね打ちの 太い 白い 弧と 星・夜の ちょうちん・金の 丸い 紋（丸に 3まいの 葉。本物の 家紋では ない）・
//         白馬の かげ・お庭番（黒い かげ）・桜の 花びら
// 合体技 … せんたく日和（たらい・あわ・ものほし・お日さま）・三剣士（白・金・赤の 3方向）・め組（まとい・火の粉）
// 時間は shared/data/ax-time-g3.js（ここは 見た目だけ）。画面の 文字は ひらがな・記号だけ
import { ribbon, line, bg, prop, text, embers, arcPts, per, hitBurst, blast, glitter, rich } from './axfx-g3-kit.js?v=847e4bcd6ab2';

const WHITE = ['#ffffff', '#e8f4ff', '#bfe4ff'];
const GOLD = ['#ffffff', '#fff0a0', '#ffd23a'];
const HEAL = ['#c8ffe0', '#7dffb0', '#ffffff'];
const SAKURA = ['#f7a1c4', '#ffd0e4', '#ffffff'];
const STARS = ['#ffe066', '#ffffff', '#ffd23a'];
const gold = { color: '#ffd23a', color2: '#fff6d0' };

const src = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 10 : c.from.y });
const lerpN = (a, b, t) => a + (b - a) * t;
const hdir = (c, t) => (t.x >= c.from.x - 4 ? 1 : -1);
// みね打ち（太い 白い 弧 ＋ 星と ひよこ）
function mine(fx, c, t, i, at, o = {}) {
  const s = (o.s || 1) * c.sz;
  const dir = o.dir || 1;
  ribbon(fx, arcPts(t.x - dir * 6, t.y + 30 * s, 34 * s, dir > 0 ? -2.4 : -0.74, dir > 0 ? -0.5 : -2.64, 14), { style: o.style || 'blade', w: (o.w || 9) * s, draw: 100, hold: 90, life: 320, delay: at - 50 });
  hitBurst(fx, t.x, t.y, { r: 14 * s, glow: o.glow || '#ffe066', colors: STARS, n: per(c, o.n || 14), delay: at, heavy: i === 0 && o.heavy !== false });
  fx.star(t.x, t.y, '#ffffff', 18 * s, at, 200);
}
// あたまの 上を まわる 星と ひよこ
function dizzy(fx, c, t, at, life = 500) {
  const hy = t.y - 22 * c.sz;
  for (let j = 0; j < 3; j++) {
    const a = (j / 3) * Math.PI * 2;
    prop(fx, j === 1 ? 'chick' : 'text', t.x + Math.cos(a) * 10, hy + Math.sin(a) * 3, { text: j === 1 ? '' : '★', size: 7, color: '#ffe066', color2: '#8a5a08', s: 1.1, life, fout: 160, delay: at + j * 40 });
  }
}

export const AX_G3_SHOGUN = {
  // ───── みね打ちじゃ（将軍 Lv1）: 刀を くるりと 返す きらり → みねの 一撃（太い 白い 弧）→ 星と ひよこ ─────
  ax_mineuchi_ja: {
    charge: gold,
    sfx: 'ax_g3_mineuchi',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      k.dim({ a: 0.38, life: c.len - 80, fin: 0, fout: 300 });
      const oy = c.fromAlly ? o.y - 16 : o.y;
      prop(fx, 'katana', o.x, oy, { s: 1.6, spin: 16, life: c.hit - 60, fout: 60, glow: '#ffe066', glowR: 10 });
      glitter(fx, o.x, oy, { n: 6, spread: 8, colors: GOLD, dur: 200, size: 4 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 70, STARS);
        const dir = hdir(c, t);
        mine(fx, c, t, i, d + c.hit, { dir, w: 11, n: 30 });
        k.shockwave(t.x, t.y, { r0: 8, r1: 46 * c.sz, color: '#ffffff', w: 2.6, n: 2, gap: 90, delay: d + c.hit });
        dizzy(fx, c, t, d + c.hit + 120, c.len - c.hit - 220);
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 10), colors: STARS, speed: 90, size: 2.6, delay: d + c.hit, life: 500 });
      });
      k.flash('#fff6d0', 80, c.hit);
      k.shake(340, 2.3, c.hit);
    },
  },
  // ───── 余の顔を見忘れたか: 夜 → 上様の 顔の 位置に 光・金の 丸い 紋 → 敵ぜんぶが 下へ おされる（ひれふす） ─────
  ax_yo_no_kao: {
    charge: gold,
    sfx: 'ax_g3_kao',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      const o = src(c);
      bg(fx, 'lantern', { a: 0.6, life: c.len - 40, fin: 140, fout: 380 });
      const fy = c.fromAlly ? o.y - 24 : o.y - 12;
      fx.glow(o.x, fy, { color: '#fff0a0', r: 26, life: 500, alpha: 1 });
      glitter(fx, o.x, fy, { n: 8, spread: 12, colors: GOLD, dur: 300, size: 4 });
      // 金の 丸い 紋
      prop(fx, 'crest', c.W / 2, 34, { s: 2.6, life: c.len - 120, fout: 300, delay: 120, glow: '#ffd23a', glowR: 18 });
      k.shockwave(c.W / 2, 34, { r0: 10, r1: 80, color: '#ffd23a', w: 2.4, n: 3, gap: 120, delay: 200 });
      k.speedLines(c.W / 2, 34, { color: '#fff0a0', delay: 160, life: 360, r0: 30, r1: 170, n: 22 });
      c.each((t, i, d) => {
        const s = c.sz;
        const h = d + c.hit;
        rich(fx, c, t, h, 150, GOLD);
        // 上から おされる すじ
        for (let j = 0; j < 4; j++) line(fx, t.x + (j - 1.5) * 9 * s, t.y - 40 * s, t.x + (j - 1.5) * 9 * s, t.y - 6, { w: 1.4, color: '#fff0a0', glow: '#ffd23a', draw: 120, hold: 80, life: 320, delay: h - 120 + j * 20 });
        hitBurst(fx, t.x, t.y + 6, { r: 13 * s, glow: '#ffd23a', colors: GOLD, n: per(c, 20), delay: h, heavy: i === 0, star: false });
        for (let j = 0; j < 4; j++) fx.puff(t.x + (j - 1.5) * 8, t.y + 16 * s, { color: '#c8b090', r0: 3, r1: 10, vx: (j - 1.5) * 20, vy: -6, life: 420, alpha: 0.5, delay: h + 20 });
        prop(fx, 'arrow', t.x, t.y - 26 * s, { s: 1.6, dir: 1, color: '#8a9aff', life: 460, fout: 160, vy: 18, delay: h + 60 });
        k.shockwave(t.x, t.y + 16 * s, { r0: 6, r1: 40 * s, sy: 0.3, color: '#ffd23a', w: 2, n: 2, gap: 90, delay: h });
      });
      text(fx, 'ははーっ', c.center.x, c.center.y - 40, { size: 9, color: '#ffffff', color2: '#3a2a10', life: 520, fout: 160, delay: c.hit + 80 });
      k.shake(500, 2.6, c.hit);
    },
  },
  // ───── 白馬の早がけ: 夕方の 浜辺 → 白馬の かげが 画面を よこぎって 敵ぜんぶを けちらす・砂けむり・波しぶき ─────
  ax_hakuba_hayagake: {
    charge: gold,
    sfx: 'ax_g3_horse',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'sea', { a: 0.66, life: c.len - 40, fin: 140, fout: 380, hor: 52 });
      const ys = c.targets.map((t) => t.y);
      const hy = Math.max(...ys) + 18 * c.sz;
      const x0 = -40, x1 = c.W + 40;
      const xs = c.targets.map((t) => t.x);
      // 最初の 的に とどく 時間が hit
      const firstX = Math.min(...xs);
      const speed = (firstX - x0) / c.hit;
      const travel = (x1 - x0) / speed;
      prop(fx, 'horse', x0, hy, { s: 2 * c.sz, rider: '#2a1a3a', color: '#ffffff', color2: '#e8e0d0', life: travel + 60, fout: 60, to: { x: x1, y: hy }, travel, ease: 'lin', pop: false, glow: '#fff6d0', glowR: 14 });
      k.streaks({ ang: 0, color: '#fff6d0', n: 20, delay: 0, life: travel, speed: 1.4, alpha: 0.4 });
      // 砂けむり（馬の あと）
      for (let j = 0; j < 10; j++) {
        const at = (travel * j) / 10;
        fx.puff(x0 + speed * at, hy + 4, { color: '#e8d0a0', r0: 3, r1: 12, vx: -20, vy: -10, life: 420, alpha: 0.6, delay: at });
      }
      c.each((t, i) => {
        const h = (t.x - x0) / speed;
        rich(fx, c, t, h, 110, GOLD);
        hitBurst(fx, t.x, t.y, { r: 15 * c.sz, glow: '#fff0a0', colors: GOLD, n: per(c, 26), delay: h, heavy: i === 0, rings: 2 });
        k.debris(t.x, t.y + 14, { n: per(c, 10), colors: ['#e8d0a0', '#c8a870', '#ffffff'], up: 140, delay: h });
        // 波しぶき
        for (let j = 0; j < per(c, 12); j++) fx.drop(t.x + (j - 6) * 3, t.y + 10, { color: j % 2 ? '#bfe6ff' : '#ffffff', vx: (j - 6) * 14, vy: -160 - (j % 3) * 30, g: 380, size: 1.6, delay: h + 20, life: 520 });
      });
      text(fx, 'ヒヒーン!', C.x, 30, { size: 9, color: '#ffffff', color2: '#7a3a10', life: 420, fout: 140, delay: travel * 0.55 });
      k.petals(C.x, 20, { n: 12, spread: 110, delay: travel * 0.6, life: 700, rise: 10 });
      k.shake(travel, 1.4, 0);
      k.shake(300, 2.8, c.hit);
    },
  },
  // ───── 目安箱（味方）: 木の 箱から 手紙が ひらひら 味方へ → 光に なって 回復 ─────
  ax_meyasubako: {
    charge: { ...gold, power: 0.9 },
    sfx: 'ax_g3_meyasu',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const bx = c.W / 2, by = 46;
      bg(fx, 'lantern', { a: 0.45, life: c.len - 40, fin: 160, fout: 360 });
      prop(fx, 'box', bx, by, { s: 2, life: c.len - 100, fout: 240, glow: '#ffe8a0', glowR: 14 });
      glitter(fx, bx, by, { n: 10, spread: 20, colors: GOLD, dur: 400, size: 3 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 24, HEAL);
        for (let j = 0; j < 3; j++) {
          const at = 120 + i * 50 + j * 70;
          prop(fx, 'letter', bx + (j - 1) * 6, by - 4, { s: 2.3, glow: '#fff6d0', glowR: 5, seed: j + i, life: c.hit - at + 60, fout: 60, delay: at, to: { x: t.x + (j - 1) * 8, y: t.y - 14 }, travel: c.hit - at, hop: 18, ease: 'io', spin: 2, pop: false });
        }
        fx.glow(t.x, t.y - 10, { color: '#fff0a0', r: 30, delay: d + c.hit, life: 420, alpha: 0.9 });
        glitter(fx, t.x, t.y - 12, { n: per(c, 22), spread: 18, colors: ['#ffffff', '#fff0a0', '#c8ffe0'], dur: 500, delay: d + c.hit, vy: -20 });
        k.particles(t.x, t.y - 6, { colors: HEAL, n: per(c, 22), speed: 60, ang: -Math.PI / 2, spread: 0.7, delay: d + c.hit, life: 420 });
        k.shockwave(t.x, t.y + 6, { r0: 6, r1: 30, sy: 0.35, color: '#ffe8a0', w: 1.8, n: 2, gap: 100, delay: d + c.hit });
      });
    },
  },
  // ───── 上様のおなり（味方）: 左右から 金の ふすまが ひらいて 光 → 金の 光と 上向きの やじるし ─────
  ax_uesama_onari: {
    charge: gold,
    sfx: 'ax_g3_onari',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const cx = c.W / 2, cy = 48;
      k.dim({ a: 0.5, life: c.len - 60, fin: 60, fout: 300 });
      fx.glow(cx, cy, { color: '#fff0a0', r: 50, delay: 260, life: 700, alpha: 1 });
      k.pillar(cx, cy + 40, { w: 30, color: '#fff0a0', glow: '#ffffff', delay: 260, life: 600, burst: false, alpha: 0.6 });
      prop(fx, 'fusuma', cx, cy, { side: -1, wait: 120, s: 1, life: c.len - 80, fout: 300, pop: false });
      prop(fx, 'fusuma', cx, cy, { side: 1, wait: 120, s: 1, life: c.len - 80, fout: 300, pop: false });
      prop(fx, 'crest', cx, cy - 6, { s: 1.6, life: c.len - 300, fout: 260, delay: 300, glow: '#ffd23a', glowR: 16 });
      k.speedLines(cx, cy, { color: '#fff0a0', delay: 300, life: 400, r0: 20, r1: 170, n: 20 });
      c.each((t, i, d) => {
        rich(fx, c, t, d + c.hit, 40, GOLD);
        prop(fx, 'arrow', t.x, t.y - 16, { s: 1.8, dir: -1, color: '#ffd23a', life: 520, fout: 200, vy: -26, delay: d + c.hit });
        fx.glow(t.x, t.y - 8, { color: '#ffd23a', r: 28, delay: d + c.hit, life: 420, alpha: 0.85 });
        glitter(fx, t.x, t.y - 10, { n: per(c, 24), spread: 18, colors: GOLD, dur: 500, delay: d + c.hit, vy: -24 });
        k.particles(t.x, t.y - 6, { colors: GOLD, n: per(c, 20), speed: 70, ang: -Math.PI / 2, spread: 0.6, delay: d + c.hit, life: 420 });
      });
      text(fx, 'ははーっ', cx, cy + 46, { size: 8, color: '#fff0a0', color2: '#3a2a10', life: 520, fout: 160, delay: c.hit });
      k.shake(160, 1.4, 120);
      k.shake(160, 1.6, 300);
    },
  },
  // ───── 成敗！（看板・伝説）: 夜の ちょうちん → 大きな「！」と 刀の 光 → お庭番 2人が 左右から → 上様が 敵ぜんぶを 順に みね打ち → 刀を さやに「チン」→ 桜 ─────
  ax_seibai: {
    charge: { ...gold, power: 1.2 },
    sfx: 'ax_g3_seibai',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'lantern', { a: 0.66, life: c.len - 40, fin: 120, fout: 380 });
      prop(fx, 'bang', C.x, 40, { s: 2.2, life: 520, fout: 160, glow: '#ffd23a', glowR: 16 });
      line(fx, C.x - 40, 52, C.x + 40, 30, { w: 2, color: '#ffffff', glow: '#ffd23a', draw: 100, hold: 120, life: 360, flare: 160, delay: 60 });
      // お庭番 2人（黒い かげ）が 左右から
      for (const sd of [-1, 1]) {
        prop(fx, 'swordsman', sd < 0 ? -20 : c.W + 20, C.y + 18, { s: 1.4, pose: 'ninja', color: '#14141c', life: c.len - 300, fout: 300, delay: 200, to: { x: C.x + sd * 80, y: C.y + 18 }, travel: 220, flipX: sd > 0, pop: false });
      }
      // 上様が 順に みね打ち
      const n = c.n;
      const step = Math.min(160, Math.round(480 / Math.max(1, n)));
      const ts = [...c.targets].map((t, i) => ({ t, i })).sort((a, b) => a.t.x - b.t.x);
      const start = c.hit - 120 - step * (n - 1);
      ts.forEach(({ t, i }, j) => {
        const at = Math.max(380, start + j * step);
        prop(fx, 'swordsman', t.x - 18, t.y + 16, { s: 1.2, pose: 'slash', color: '#ffe8a0', blade: '#ffffff', add: true, alpha: 0.6, life: 220, fout: 140, delay: at - 60 });
        mine(fx, c, t, 1, at, { dir: j % 2 ? -1 : 1, w: 9, n: 8, heavy: false });
      });
      c.each((t, i, d) => {
        const h = d + c.hit;
        rich(fx, c, t, h, 60, GOLD);
        blast(fx, t.x, t.y, { r: 20 * c.sz, glow: '#ffd23a', core: '#ffffff', colors: STARS, n: per(c, 26), smoke: '#3a2a20', heavy: i === 0, delay: h, puffs: 2 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 10), colors: STARS, speed: 100, size: 2.6, delay: h, life: 520 });
        dizzy(fx, c, t, h + 100, 520);
      });
      // さやに「チン」
      glitter(fx, C.x, C.y + 30, { n: 6, spread: 8, colors: ['#ffffff'], dur: 80, delay: c.hit + 40, size: 6 });
      fx.star(C.x, C.y + 30, '#ffffff', 26, c.hit + 40, 260);
      k.petals(C.x, 10, { n: c.n > 2 ? 14 : 24, spread: 120, delay: c.hit + 120, life: 700, rise: 10 });
      glitter(fx, C.x, C.y, { n: c.n > 2 ? 16 : 30, spread: 110, colors: SAKURA, dur: 600, delay: c.hit + 100 });
      k.flash('#fff6d0', 160, c.hit);
      k.shake(600, 3.4, c.hit);
    },
  },
  // ───── お庭番、参れ！（ひらめき）: 空から 黒い 忍びの かげ 2人が すとんと → 黒い 手裏剣 → 敵ぜんぶ → けむりで 消える ─────
  ax_oniwaban_maire: {
    charge: { color: '#5a5a8a', color2: '#e8e8ff' },
    sfx: 'ax_g3_oniwaban',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'night', { a: 0.62, life: c.len - 40, fin: 120, fout: 380 });
      const land = c.fromAlly ? Math.min(c.H - 8, C.y + 44) : C.y - 30;
      const spots = [C.x - 70, C.x + 70];
      spots.forEach((sx, j) => {
        prop(fx, 'swordsman', sx, -20, { s: 1.5, pose: 'ninja', color: '#14141c', life: c.len - 260, fout: 10, to: { x: sx, y: land }, travel: 160, ease: 'in', flipX: j === 1, pop: false, delay: j * 60 });
        fx.puff(sx, land, { color: '#c8c8d8', r0: 4, r1: 14, vy: -10, life: 360, alpha: 0.5, delay: 160 + j * 60 });
        // けむりで きえる
        for (let m = 0; m < 4; m++) fx.puff(sx + (m - 1.5) * 6, land - 12, { color: '#e8e8f0', r0: 4, r1: 16, vx: (m - 1.5) * 12, vy: -16, life: 460, alpha: 0.7, delay: c.len - 320 });
      });
      c.each((t, i, d) => {
        const h = d + c.hit;
        rich(fx, c, t, h, 140, ['#ffffff', '#c8c8d8', '#8a8aa8']);
        spots.forEach((sx, j) => {
          const at = 220 + j * 80 + d;
          prop(fx, 'shuriken', sx, land - 14, { s: 1.6, spin: 30, life: h - at + 40, fout: 40, delay: at, to: { x: t.x + (j ? 5 : -5), y: t.y }, travel: h - at, ease: 'lin', pop: false });
        });
        hitBurst(fx, t.x, t.y, { r: 13 * c.sz, glow: '#c8c8ff', colors: ['#ffffff', '#c8c8d8'], n: per(c, 24), delay: h, heavy: i === 0, rings: 2 });
        fx.cut(t.x, t.y, { ang: 0.8, len: 22, w: 2, color: '#ffffff', glow: '#8a8aa8', delay: h, life: 220 });
        fx.cut(t.x, t.y, { ang: -0.8, len: 22, w: 2, color: '#ffffff', glow: '#8a8aa8', delay: h + 40, life: 220 });
      });
      k.shake(300, 2.2, c.hit);
    },
  },
  // ───── 天下ごめんの大あばれ（ひらめき）: 金の 弧の 斬撃が 敵ぜんぶを 8本・ちょうちんが ゆれる → 最後の 大きな 一撃 ─────
  ax_tenka_gomen: {
    charge: gold,
    sfx: 'ax_g3_tenka',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      bg(fx, 'lantern', { a: 0.64, life: c.len - 40, fin: 120, fout: 380 });
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40;
      for (let j = 0; j < 8; j++) {
        const at = 60 + j * 95;
        const dir = j % 2 ? -1 : 1;
        const yy = C.y + (j % 3 - 1) * 10;
        ribbon(fx, [[dir > 0 ? x0 : x1, yy - 20 + (j % 2) * 30], [C.x, yy + (j % 2 ? -8 : 8)], [dir > 0 ? x1 : x0, yy + 18 - (j % 2) * 30]], { style: 'gold', w: 6, draw: 110, hold: 60, life: 260, delay: at });
        c.targets.forEach((t) => fx.sparks(t.x, t.y, { colors: GOLD, n: per(c, 5), speed: 120, delay: at + 50, life: 260 }));
        k.shake(80, 1.2, at + 50);
      }
      // さいごの 大きな 一撃
      ribbon(fx, [[x0 - 20, C.y - 40], [C.x, C.y + 4], [x1 + 20, C.y + 30]], { style: 'gold', w: 13, draw: 120, hold: 160, life: 440, flare: 140, delay: c.hit - 70 });
      line(fx, x0 - 20, C.y - 30, x1 + 20, C.y + 24, { w: 2.6, color: '#ffffff', glow: '#ffd23a', draw: 60, hold: 140, life: 360, flare: 100, delay: c.hit - 30 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        rich(fx, c, t, h, 72, GOLD);
        blast(fx, t.x, t.y, { r: 24 * c.sz, glow: '#ffd23a', core: '#ffffff', colors: GOLD, n: per(c, 30), smoke: '#4a3010', heavy: i === 0, delay: h });
        k.shockwave(t.x, t.y, { r0: 10, r1: 80 * c.sz, color: '#ffd23a', w: 3, n: 2, gap: 90, delay: h });
      });
      k.petals(C.x, 10, { n: c.n > 2 ? 10 : 18, spread: 110, delay: c.hit + 100, life: 600, rise: 10 });
      k.flash('#fff6d0', 140, c.hit);
      k.shake(560, 3.4, c.hit);
    },
  },
  // ───── 合体技 せんたく日和でござる: 大きな たらいと あわの 輪・せんたく物が はためいて お日さま → 味方 全員 回復 ─────
  ax_sentaku_biyori: {
    sfx: 'ax_g3_sentaku',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      fx.glow(c.W * 0.82, 22, { color: '#fff0a0', r: 40, life: c.len - 200, alpha: 0.8, grow: 0 });
      fx.glow(c.W * 0.82, 22, { color: '#ffffff', r: 14, life: c.len - 200, alpha: 0.9, grow: 0 });
      glitter(fx, c.W * 0.82, 22, { n: 10, ring: 18, sy: 1, colors: ['#fff6b0', '#ffffff'], dur: 900, life: 400, size: 3 });
      prop(fx, 'laundry', C.x, 22, { w: 150, s: 1.2, life: c.len - 160, fout: 300, delay: 100 });
      prop(fx, 'tub', C.x, C.y - 30, { s: 2.2, life: c.len - 200, fout: 260 });
      for (let j = 0; j < 3; j++) k.shockwave(C.x, C.y - 34, { r0: 10, r1: 70, sy: 0.4, color: '#e8f6ff', w: 2, delay: 200 + j * 200, life: 460 });
      k.shapes(C.x, C.y - 40, { shape: 'circle', n: 22, colors: ['#ffffff', '#e8f6ff', '#bfe6ff'], speed: 40, ang: -Math.PI / 2, spread: 1.2, g: -16, size: 2.4, life: 900, add: false });
      c.each((t, i, d) => {
        const h = d + c.hit;
        fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 30, delay: h, life: 460, alpha: 0.85 });
        glitter(fx, t.x, t.y - 12, { n: per(c, 26), spread: 18, colors: ['#ffffff', '#c8ffe0', '#fff0a0'], dur: 600, delay: h, vy: -18 });
        k.particles(t.x, t.y - 6, { colors: HEAL, n: per(c, 26), speed: 60, ang: -Math.PI / 2, spread: 0.7, delay: h, life: 420 });
        k.shapes(t.x, t.y - 6, { shape: 'circle', n: per(c, 10), colors: ['#ffffff', '#e8f6ff'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -20, size: 1.8, delay: h, life: 600, add: false });
      });
    },
  },
  // ───── 合体技 天下無敵の三剣士: 3色の 斬撃（白・金・赤）が 3方向から 敵ぜんぶへ → 交わった 所で 三角の 光 ─────
  ax_sanken: {
    sfx: 'ax_g3_sanken',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      k.dim({ a: 0.42, life: c.len - 60, fin: 60, fout: 320 });
      const cols = [
        { s: 'blade', g: '#9ad8ff', from: [-20, C.y - 50] },
        { s: 'gold', g: '#ffd23a', from: [c.W + 20, C.y - 50] },
        { s: 'red', g: '#ff3a3a', from: [C.x, c.H + 20] },
      ];
      // 3人の 剣士の かげ
      prop(fx, 'swordsman', 30, c.H - 8, { s: 1.6, pose: 'slash', color: '#bfe4ff', add: true, alpha: 0.55, life: 600, fout: 200 });
      prop(fx, 'swordsman', c.W - 30, c.H - 8, { s: 1.6, pose: 'slash', color: '#ffe8a0', add: true, alpha: 0.55, life: 600, fout: 200, flipX: true, delay: 80 });
      prop(fx, 'swordsman', C.x, c.H + 4, { s: 1.6, pose: 'up', color: '#ffb0b0', add: true, alpha: 0.55, life: 600, fout: 200, delay: 160 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        rich(fx, c, t, h, 70, GOLD);
        cols.forEach((cl, j) => {
          const at = d + 120 + j * 130;
          const [fx0, fy0] = cl.from;
          ribbon(fx, [[fx0, fy0], [lerpN(fx0, t.x, 0.6), lerpN(fy0, t.y, 0.6) + (j - 1) * 10], [t.x + (t.x - fx0) * 0.25, t.y + (t.y - fy0) * 0.25]], { style: cl.s, w: 7 * c.sz, draw: 160, hold: 140, life: 440, delay: at });
          hitBurst(fx, t.x, t.y, { r: 11 * c.sz, glow: cl.g, colors: ['#ffffff', cl.g], n: per(c, 8), delay: at + 120, heavy: false, star: false });
        });
        // 三角の 光
        const R = 22 * c.sz;
        const tri = [0, 1, 2, 0].map((m) => [t.x + Math.cos(-Math.PI / 2 + (m / 3) * Math.PI * 2) * R, t.y + Math.sin(-Math.PI / 2 + (m / 3) * Math.PI * 2) * R]);
        ribbon(fx, tri, { style: 'gold', w: 3, draw: 140, hold: 160, life: 420, delay: h - 40 });
        blast(fx, t.x, t.y, { r: 22 * c.sz, glow: '#ffe8a0', core: '#ffffff', colors: GOLD, n: per(c, 30), smoke: '#4a3a30', heavy: i === 0, delay: h });
      });
      glitter(fx, C.x, C.y, { n: c.n > 2 ? 14 : 26, spread: 80, colors: GOLD, dur: 600, delay: c.hit + 80 });
      k.flash('#fff6d0', 140, c.hit);
      k.shake(420, 2.8, c.hit);
    },
  },
  // ───── 合体技 め組の大立ち回り: 火消しの まといが まわって 火の粉・赤い はっぴ → 斬撃が 敵ぜんぶへ ─────
  ax_megumi: {
    sfx: 'ax_g3_megumi',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      k.dim({ a: 0.4, life: c.len - 60, fin: 60, fout: 320 });
      const mx = c.fromAlly ? 40 : c.W - 40;
      prop(fx, 'matoi', mx, 40, { s: 2, life: c.len - 160, fout: 260, rot0: -0.15, glow: '#ff8a3a', glowR: 16 });
      prop(fx, 'matoi', c.W - mx, 44, { s: 1.6, life: c.len - 220, fout: 260, rot0: 0.15, delay: 120 });
      embers(fx, mx, 30, { n: 18, spread: 20, delay: 100, life: 800 });
      embers(fx, c.W - mx, 34, { n: 12, spread: 18, delay: 200, life: 800 });
      text(fx, 'ワッショイ!', C.x, 22, { size: 9, color: '#ffffff', color2: '#a01810', life: 520, fout: 160, delay: 160 });
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 40, x1 = Math.max(...xs) + 40;
      // 赤い はっぴの 人たちの かげ が かけぬける
      for (let j = 0; j < 3; j++) prop(fx, 'swordsman', -20, C.y + 20 + j * 4, { s: 1.2, pose: 'slash', color: j % 2 ? '#c8202a' : '#e8302a', life: 420, fout: 120, delay: 240 + j * 90, to: { x: c.W + 20, y: C.y + 20 + j * 4 }, travel: 420, ease: 'lin', pop: false, alpha: 0.85 });
      ribbon(fx, [[x0, C.y - 26], [C.x, C.y + 4], [x1, C.y - 16]], { style: 'flame', w: 7, draw: 150, hold: 140, life: 440, delay: c.hit - 120 });
      ribbon(fx, [[x1, C.y - 30], [C.x, C.y - 6], [x0, C.y + 16]], { style: 'blade', w: 7, draw: 130, hold: 140, life: 420, delay: c.hit - 40 });
      c.each((t, i, d) => {
        const h = d + c.hit;
        rich(fx, c, t, h, 70, ['#fff2a0', '#ffb040', '#ff6a1a']);
        blast(fx, t.x, t.y, { r: 22 * c.sz, glow: '#ffa040', core: '#fff2a0', colors: ['#fff2a0', '#ffb040', '#ff6a1a'], n: per(c, 30), smoke: '#4a2010', heavy: i === 0, delay: h });
        k.flames(t.x, t.y + 12, { w: 26 * c.sz, h: 24 * c.sz, n: 5, delay: h + 40, life: 460, embers: c.n < 3 });
      });
      k.flash('#ffe0b0', 120, c.hit);
      k.shake(420, 2.8, c.hit);
    },
  },
};
