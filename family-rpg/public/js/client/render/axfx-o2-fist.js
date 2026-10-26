// 第49回 O2: こぶしと 守りの 技（武闘家・聖拳士・ゴッドハンド・ガーディアン）の え。この ファイルは O2 だけが さわる
// 時間は shared/data/ax-time-o2.js。play の 時間は はなつ しゅんかんが 0。下の 段ほど 小さく・上の 段ほど 大きく 長く 色が ふえる
import { rnd } from './axkit.js';
import { obj, txt, bg, claw, rays, hands, ground, above, per, solo, upMark, downMark, fist, punchHit } from './axfx-o2-kit.js';

const ORANGE = ['#ffffff', '#ffa040', '#ffe080'];
const HOLY = ['#ffffff', '#fff0a0', '#ffe08a'];
const GOLD = ['#ffd23a', '#fff6b0', '#ffffff'];
const STONE = ['#a8a8b8', '#6a6a7a', '#d0d0dc'];
const EARTH = ['#a08060', '#6a5040', '#d8c0a0'];
const SHIELD = { color: '#3a6ad8', edge: '#ffd23a' };

export const AX_O2_FIST = {
  // ───── 武闘家（基本職） ─────
  // せいけんづき: オレンジの こぶしが まっすぐ → 丸い 衝撃波＋火花 → こぶしの 光が のこる
  ox_seiken_zuki: {
    sfx: 'ax_o2_punch',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.fx.glow(h.x, h.y, { color: '#ffa040', r: 14, life: 160 });
      c.each((t, i, d) => {
        fist(c, h.x, h.y, t.x, t.y + 4, { travel: c.hit, delay: d, s: 6.5 * c.sz, hold: 140 });
        k.dash(h.x, h.y, t.x, t.y, { color: '#ffa040', travel: c.hit, w: 4, delay: d, n: 2 });
        punchHit(c, t, d + c.hit, { r: 14, heavy: i === 0 });
        k.particles(t.x, t.y, { n: per(c, 14), colors: ORANGE, speed: 150, delay: d + c.hit, life: 380 });
        obj(c, 'fist', { x: t.x, y: t.y, s: 9 * c.sz, glow: '#ffd080', alpha: 0.55, add: true, delay: d + c.hit + 40, life: 260, fout: 200 });
      });
      txt(c, 'ドン！', c.t.x + 18, c.t.y - 22, { delay: c.hit, fill: '#ffe080' });
      k.shake(90, 1.1, c.hit);
    },
  },
  // みかわしきゃく: 左右に ゆれる 残像 → 足もとに 白い 風の 輪 → 風の すじ
  ox_mikawashi: {
    sfx: 'ax_o2_swish',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) obj(c, 'person', { x0: t.x, y0: t.y - 8, x1: t.x + (j % 2 ? -14 : 14), y1: t.y - 8, travel: 120, s: 10, color: '#c8fff0', add: true, alpha: 0.55, delay: d + j * 90, life: 200, fout: 120 });
        k.shockwave(t.x, ground(c, t, 10), { r0: 4, r1: 34, sy: 0.32, color: '#ffffff', w: 2, delay: d + c.hit - 60, n: 2, gap: 90 });
        for (let j = 0; j < 3; j++) c.fx.gust(t.x - 30, t.y - 16 + j * 9, { len: 60, color: '#e8fff0', w: 1.2, dir: 1, delay: d + 100 + j * 60, life: 320 });
        k.shapes(t.x, t.y - 4, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#9af0b0'], speed: 50, size: 3, delay: d + c.hit, life: 300 });
        upMark(c, t, '#5ae07a', d + c.hit, 2);
      });
    },
  },
  // 爆裂拳: こぶしの 光が 4つ 連続 → 当たる たびに 小さな 爆発 → けむり
  ox_bakuretsu_ken: {
    charge: { color: '#ff7a2a', color2: '#ffe080' },
    sfx: 'ax_o2_rapid4',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      for (let j = 0; j < 4; j++) {
        const t = c.targets[j % c.n];
        const d = j * 100;
        const sx = h.x + (j % 2 ? 10 : -10);
        fist(c, sx, h.y, t.x + rnd(-5, 5), t.y + rnd(-6, 6), { travel: c.hit, delay: d, s: 5 * c.sz, trail: 2, hold: 40 });
        c.fx.glow(t.x, t.y, { color: '#ff8a2a', r: 14, delay: d + c.hit, life: 200 });
        k.shockwave(t.x, t.y, { r0: 3, r1: 24 * c.sz, color: '#ffa040', w: 2.2, delay: d + c.hit, life: 260 });
        k.particles(t.x, t.y, { n: c.all ? 5 : 10, colors: ORANGE, speed: 120, delay: d + c.hit, life: 300 });
        c.fx.impact(t.x, t.y, { r: 9, delay: d + c.hit });
      }
      c.each((t, i, d) => { for (let j = 0; j < (c.all ? 1 : 3); j++) c.fx.puff(t.x + rnd(-8, 8), t.y + rnd(-4, 6), { color: '#7a6a60', r0: 3, r1: 10, vy: -16, delay: d + c.hit + 320, life: 300, alpha: 0.5 }); });
      txt(c, 'ドドドドン', c.t.x, c.t.y - 26, { delay: c.hit + 120, fill: '#ffb060' });
      k.shake(80, 1, c.hit + 300);
    },
  },
  // 気合いため: オレンジの 光の 輪が 2回 → 足もとの 小石が 浮く → 体が オレンジに 光る
  ox_kiaitame: {
    charge: { color: '#ff8a2a', color2: '#ffe080' },
    sfx: 'ax_o2_kiai',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        k.shockwave(t.x, t.y - 6, { r0: 6, r1: 34, color: '#ffa040', w: 2.6, delay: d, n: 2, gap: 140, life: 320 });
        k.shapes(t.x, ground(c, t, 8), { shape: 'rock', n: 7, colors: EARTH, speed: 26, ang: -Math.PI / 2, spread: 0.5, g: -50, size: 1.8, delay: d + 60, life: 420, add: false });
        c.fx.glow(t.x, t.y - 8, { color: '#ff9a3a', r: 26, delay: d + c.hit, life: 260 });
        k.particles(t.x, t.y - 4, { n: 12, colors: ORANGE, speed: 70, ang: -Math.PI / 2, spread: 0.9, g: -60, delay: d + c.hit, life: 300 });
        upMark(c, t, '#ff5a3a', d + c.hit, 3);
      });
      txt(c, 'フンッ', c.t.x, c.t.y - 30, { delay: 40, fill: '#ffb060', life: 360 });
    },
  },
  // 猛虎破砕拳: こぶしの うしろに 虎の 顔 → ガオッと とびかかる → 爪あと 3本＋岩の 欠片
  ox_mouko_hasai: {
    charge: { color: '#ff9a2a', color2: '#ffe080' },
    sfx: 'ax_o2_tiger',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        obj(c, 'tiger', { x0: h.x, y0: h.y - 8, x1: t.x, y1: t.y - 6, travel: c.hit, ease: 'in', s: 15 * c.sz, pop: 120, delay: d, life: c.hit + 130, fout: 120, glow: '#ff9a2a', glowA: 0.5 });
        fist(c, h.x, h.y, t.x, t.y + 4, { travel: c.hit, delay: d, s: 5.5 * c.sz, trail: 2 });
        claw(c, t.x, t.y, { ang: 1.05, len: 50 * c.sz, n: 3, gap: 10 * c.sz, w: 3, glow: '#ff7a1a', delay: d + c.hit - 20, life: 380 });
        punchHit(c, t, d + c.hit, { r: 13, heavy: i === 0 });
        k.debris(t.x, t.y + 6, { n: per(c, 8), colors: EARTH, up: 120, delay: d + c.hit });
      });
      txt(c, 'ガオッ', c.from.x + 20, hands(c).y - 26, { delay: 30, fill: '#ffb040' });
      k.shake(110, 1.2, c.hit);
    },
  },
  // まわしげり: 白い 大きな 円弧が 敵全体を なぎはらう → 星の 火花 → 風の 輪
  ox_mawashi_geri: {
    sfx: 'ax_o2_kick',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const cx = c.center.x, cy = c.center.y + 6;
      const r = c.all ? Math.min(110, Math.max(40, (Math.max(...c.targets.map((t) => Math.abs(t.x - cx))) + 16))) : 30;
      const down = c.dir === 'down';
      k.crescent(cx, cy, { r, a0: down ? -0.2 : Math.PI + 0.2, a1: down ? Math.PI + 0.2 : -0.2, sy: 0.45, w: 8, color: '#ffffff', glow: '#9ad8ff', swing: c.hit, life: c.hit + 220, after: 3 });
      c.each((t, i, d) => {
        c.fx.impact(t.x, t.y, { r: 10 * c.sz, delay: d + c.hit });
        k.shapes(t.x, t.y, { shape: 'star', n: per(c, 8, 3), colors: ['#ffffff', '#ffe066'], speed: 90, size: 2.6, delay: d + c.hit, life: 380 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 22 * c.sz, color: '#c8ffff', w: 1.8, delay: d + c.hit + 30 });
      });
      for (let j = 0; j < 3; j++) c.fx.gust(cx - 50, cy - 20 + j * 12, { len: 100, color: '#e8fff0', w: 1.2, dir: 1, delay: c.hit + j * 50, life: 300 });
      txt(c, 'バシバシ', cx, cy - 34, { delay: c.hit, fill: '#e8f8ff' });
      k.shake(80, 1, c.hit);
    },
  },
  // いっせんづき: 一しゅん しずか → 細く 長い 白い 光の 線が つらぬく → 大きな 白い 星の フラッシュ
  ox_issen_zuki: {
    sfx: 'ax_o2_issen',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.fx.twinkle(h.x, h.y - 4, { color: '#ffffff', size: 8, life: 200 });
      c.each((t, i, d) => {
        const L = Math.hypot(t.x - h.x, t.y - h.y) || 1;
        const ex = t.x + (t.x - h.x) / L * 40, ey = t.y + (t.y - h.y) / L * 40;
        k.beam(h.x, h.y, ex, ey, { w: 2.2, color: '#ffffff', glow: '#bfe6ff', core: '#ffffff', delay: d + c.hit - 90, grow: 90, life: 280, rise: 20, fall: 160, streaks: false, burst: false });
        c.fx.star(t.x, t.y, '#ffffff', 26 * c.sz, d + c.hit + 40, 300);
        c.fx.star(t.x, t.y, '#fff6b0', 14 * c.sz, d + c.hit + 60, 260);
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#bfe6ff', delay: d + c.hit + 30, heavy: true });
        k.particles(t.x, t.y, { n: 18, colors: ['#ffffff', '#bfe6ff'], speed: 170, delay: d + c.hit + 30, life: 380 });
      });
      k.flash('#ffffff', 80, c.hit + 30);
      txt(c, 'ズドン', c.t.x + 16, c.t.y - 24, { delay: c.hit + 40 });
    },
  },
  // 百裂拳: 左右から こぶしの 残像が たくさん → 6回 光 → 最後の 1発で 大きな 衝撃波
  ox_hyakuretsu_ken: {
    charge: { color: '#ffb040', color2: '#ffffff' },
    sfx: 'ax_o2_rapid6',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        for (let j = 0; j < (c.all ? 3 : 10); j++) {
          const sx = h.x + (j % 2 ? 1 : -1) * rnd(8, 26), sy = h.y + rnd(-6, 4);
          fist(c, sx, sy, t.x + rnd(-10, 10), t.y + rnd(-10, 8), { travel: 110, delay: d + c.hit - 110 + j * 40, s: 4.2, trail: 1, hold: 30 });
        }
        for (let j = 0; j < (c.all ? 2 : 6); j++) {
          const x = t.x + rnd(-9, 9), y = t.y + rnd(-9, 7);
          c.fx.impact(x, y, { r: 9, delay: d + c.hit + j * 60 });
          c.fx.glow(x, y, { color: '#ffa040', r: 12, delay: d + c.hit + j * 60, life: 140 });
        }
        const fin = d + c.hit + 380;
        fist(c, h.x, h.y, t.x, t.y + 2, { travel: 120, delay: fin - 120, s: 7.5, hold: 100 });
        punchHit(c, t, fin, { r: 16, heavy: true, rings: 2 });
        k.particles(t.x, t.y, { n: per(c, 16, 4), colors: ORANGE, speed: 180, delay: fin, life: 360 });
        for (let j = 0; j < (c.all ? 1 : 3); j++) c.fx.puff(t.x + rnd(-10, 10), t.y + rnd(-4, 8), { color: '#7a6a60', r0: 3, r1: 11, vy: -16, delay: fin + 80, life: 300, alpha: 0.5 });
      });
      txt(c, 'アタタタ', c.t.x, c.t.y - 30, { delay: c.hit, life: 360, fill: '#ffe080' });
      txt(c, 'ドーン', c.t.x + 14, c.t.y - 20, { delay: c.hit + 400, size: 13, fill: '#ffb040' });
      k.shake(140, 1.4, c.hit + 380);
    },
  },
  // 三段づき: 上・中・下の 3つの つき → 3つの 衝撃波が たてに ならぶ → 会心の 星
  ox_sandan_zuki: {
    sfx: 'ax_o2_sandan',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        [-14, 0, 14].forEach((dy, j) => {
          const at = d + c.hit + j * 130;
          fist(c, h.x + (j - 1) * 8, h.y, t.x, t.y + dy * c.sz, { travel: c.hit, delay: at - c.hit, s: 5.5 * c.sz, trail: 2 });
          punchHit(c, { x: t.x, y: t.y + dy * c.sz }, at, { r: 10, heavy: j === 2 && i === 0 });
          k.particles(t.x, t.y + dy * c.sz, { n: per(c, 8, 3), colors: ORANGE, speed: 120, delay: at, life: 300 });
        });
        c.fx.star(t.x, t.y, '#fff6b0', 22 * c.sz, d + c.hit + 300, 300);
        k.shapes(t.x, t.y, { shape: 'star', n: 6, colors: ['#ffe066', '#ffffff'], speed: 80, size: 2.6, delay: d + c.hit + 300, life: 360 });
      });
      txt(c, 'ハッハッハッ', c.t.x, c.t.y - 34, { delay: c.hit + 80, fill: '#ffe080', life: 480 });
      k.shake(100, 1.2, c.hit + 260);
    },
  },
  // 旋風きゃく: 緑の 竜巻の 足技 → 竜巻が 敵全体を よこぎる → 葉っぱと 風の すじ
  ox_senpuu_kyaku: {
    sfx: 'ax_o2_senpuu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const xs = c.targets.map((t) => t.x);
      const y = c.center.y - 4;
      const pts = c.all ? [[h.x, h.y], [Math.min(...xs) - 20, y], [Math.max(...xs) + 20, y]] : [[h.x, h.y], [c.t.x, c.t.y - 4], [c.t.x + 6, c.t.y - 6]];
      obj(c, 'tornado', { pts, travel: c.all ? c.hit + (c.n - 1) * c.stagger + 160 : c.hit + 200, s: 16 * (c.all ? 1 : 1.15), color: '#9af0b0', add: true, glow: '#7af0a0', glowA: 0.35, life: c.hit + (c.n - 1) * c.stagger + 360, fout: 160, fin: 80 });
      c.each((t, i, d) => {
        c.fx.impact(t.x, t.y, { r: 10 * c.sz, delay: d + c.hit });
        k.shockwave(t.x, t.y, { r0: 4, r1: 24 * c.sz, color: '#9af0b0', w: 2, delay: d + c.hit });
        k.petals(t.x, t.y, { n: per(c, 8, 2), colors: ['#7ad86a', '#b8f08a', '#4aa84a'], spread: 14, delay: d + c.hit, life: 520 });
        k.particles(t.x, t.y, { n: per(c, 8, 2), colors: ['#ffffff', '#9af0b0'], speed: 110, delay: d + c.hit, life: 320 });
      });
      for (let j = 0; j < 3; j++) c.fx.gust(c.center.x - 60, y - 14 + j * 12, { len: 120, color: '#d8ffe0', w: 1.2, dir: 1, delay: 120 + j * 60, life: 360 });
      txt(c, 'ヒュオォ', h.x + 20, h.y - 24, { delay: 20, fill: '#c8ffd8' });
      k.shake(90, 1, c.hit);
    },
  },

  // ───── 聖拳士（上級職） ─────
  // 聖光拳: 光の こぶし → 十字の 光が はじける → 白い 羽
  ox_seikou_ken: {
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_o2_holyfist',
    allyFx: 'holy',
    minParts: 110,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        fist(c, h.x, h.y, t.x, t.y + 4, { travel: c.hit, delay: d, s: 7 * c.sz, color: '#fff4d0', color2: '#ffd23a', color3: '#ffffff', edge: '#b08a2a', glow: '#fff0a0', hold: 120 });
        const at = d + c.hit;
        k.beam(t.x, t.y - 34 * c.sz, t.x, t.y + 30 * c.sz, { w: 4, color: '#fff6c8', glow: '#ffe08a', delay: at, grow: 60, life: 420, burst: false, streaks: false });
        k.beam(t.x - 32 * c.sz, t.y - 4, t.x + 32 * c.sz, t.y - 4, { w: 4, color: '#fff6c8', glow: '#ffe08a', delay: at + 30, grow: 60, life: 400, burst: false, streaks: false });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#fff0a0', colors: HOLY, delay: at, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 40 * c.sz, color: '#fff6c8', w: 2.2, delay: at, n: 2 });
        for (let j = 0; j < per(c, 6, 2); j++) c.fx.petal(t.x + rnd(-18, 18), t.y + rnd(-14, 4), { color: '#ffffff', vx: rnd(-30, 30), vy: rnd(-40, -10), size: 2.2, delay: at + 60 + j * 30, life: 600 });
      });
      txt(c, 'パァン', c.t.x + 18, c.t.y - 26, { delay: c.hit, fill: '#fff6c8' });
      k.shake(140, 1.3, c.hit);
    },
  },
  // めいそう: 座禅の 白い 光の 輪 → 頭の 上に はすの 花 → 緑の つぶ
  ox_meisou: {
    charge: { color: '#ffffff', color2: '#c8ffe0' },
    sfx: 'ax_o2_meisou',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) k.shockwave(t.x, ground(c, t, 8), { r0: 30, r1: 8, sy: 0.32, color: '#ffffff', w: 1.8, delay: d + j * 110, life: 360 });
        obj(c, 'lotus', { x0: t.x, y0: above(c, t, 10), x1: t.x, y1: above(c, t, 30), travel: 300, ease: 'out', s: 11, openMs: 320, glow: '#ffd0e4', glowA: 0.6, delay: d + 80, life: c.len - 120, fout: 200 });
        c.fx.glow(t.x, t.y - 8, { color: '#7dffb0', r: 26, delay: d + c.hit, life: 300 });
        k.particles(t.x, t.y, { n: 16, colors: ['#7dffb0', '#ffffff', '#c8ffe0'], speed: 50, ang: -Math.PI / 2, spread: 1, g: -50, delay: d + c.hit, life: 380 });
        k.sparkles(t.x, t.y - 10, { n: 5, colors: ['#ffffff', '#c8ffe0'], r: 16, delay: d + c.hit, life: 300 });
      });
      txt(c, 'ポーン', c.t.x, c.t.y - 44, { delay: c.hit, fill: '#c8ffe0' });
    },
  },
  // 見切り: 目の 位置に きらっ → 時間が ゆっくりに なる 白い 輪 → 残像
  ox_mikiri: {
    sfx: 'ax_o2_mikiri',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        c.fx.twinkle(t.x + 4, t.y - 20, { color: '#ffffff', size: 12, delay: d, life: 260 });
        c.fx.glow(t.x + 4, t.y - 20, { color: '#bfe6ff', r: 12, delay: d, life: 220 });
        for (let j = 0; j < 3; j++) c.fx.ring(t.x, t.y - 6, '#e8f4ff', 2.4, d + 160 + j * 160, 520, 36);
        for (let j = 0; j < 4; j++) obj(c, 'person', { x0: t.x, y0: t.y - 6, x1: t.x + (j - 1.5) * 12, y1: t.y - 6, travel: 260, ease: 'out', s: 10, color: '#bfe6ff', add: true, alpha: 0.5, delay: d + c.hit - 100 + j * 50, life: 420, fout: 240 });
        k.shapes(t.x, t.y - 6, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#bfe6ff'], speed: 40, size: 3, delay: d + c.hit, life: 400 });
        upMark(c, t, '#5ae07a', d + c.hit + 100, 2);
      });
      txt(c, 'キラン', c.t.x + 24, c.t.y - 28, { delay: 20, fill: '#e8f4ff' });
    },
  },
  // てんしょうれっぱ: 地面から 天へ のぼる 白い 光の 波が れんぞくで → 光の 羽
  ox_tenshou_reppa: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o2_tenshou',
    allyFx: 'holy',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = ground(c, t, 16);
        k.shockwave(t.x, gy, { r0: 4, r1: 30 * c.sz, sy: 0.3, color: '#fff6c8', w: 2.2, delay: d + c.hit - 120 });
        for (let j = 0; j < 3; j++) {
          k.beam(t.x + (j - 1) * 5, gy, t.x + (j - 1) * 5, Math.max(-6, t.y - 70), { w: (8 - j * 2) * c.sz, color: '#fff6c8', glow: '#ffe8a0', core: '#ffffff', delay: d + c.hit - 60 + j * 110, grow: 90, life: 360, fall: 200, streaks: true, burst: false, widths: [0.4, 1, 0.8, 0] });
        }
        k.impact(t.x, t.y, { r: 12 * c.sz, glow: '#fff0a0', colors: HOLY, delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { n: per(c, 10, 3), colors: HOLY, speed: 90, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d + c.hit, life: 420 });
        for (let j = 0; j < per(c, 4, 1); j++) c.fx.petal(t.x + rnd(-14, 14), t.y - 20 - rnd(0, 20), { color: '#ffffff', vx: rnd(-20, 20), vy: rnd(-30, -6), size: 2.2, delay: d + c.hit + 140 + j * 40, life: 520 });
      });
      txt(c, 'ゴォォ', c.center.x, c.center.y - 40, { delay: c.hit, fill: '#fff6c8' });
      k.shake(160, 1.3, c.hit);
    },
  },
  // 聖なる百烈拳: 光の こぶしの 残像が 7回 → 当たる たびに 白い 十字 → 最後に 大きな 光の 柱 → 白い 羽
  ox_seinaru_hyakuretsu: {
    charge: { color: '#fff0a0', color2: '#ffffff' },
    sfx: 'ax_o2_holyrapid',
    allyFx: 'holy',
    minParts: 120,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.each((t, i, d) => {
        for (let j = 0; j < 7; j++) {
          const at = d + c.hit + j * 75;
          const x = t.x + rnd(-11, 11), y = t.y + rnd(-11, 8);
          fist(c, h.x + (j % 2 ? 14 : -14), h.y, x, y, { travel: c.hit, delay: at - c.hit, s: 5, trail: 1, hold: 30, color: '#fff4d0', color2: '#ffd23a', color3: '#ffffff', edge: '#b08a2a', glow: '#fff0a0' });
          c.fx.twinkle(x, y, { color: '#ffffff', size: 11, delay: at, life: 200 });
          c.fx.glow(x, y, { color: '#fff0a0', r: 13, delay: at, life: 160 });
          k.particles(x, y, { n: 4, colors: HOLY, speed: 110, delay: at, life: 260 });
        }
        const fin = d + c.hit + 560;
        k.pillar(t.x, t.y + 10, { w: 14 * c.sz, color: '#fff6c8', glow: '#ffe8a0', delay: fin, life: 420 });
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#fff0a0', colors: HOLY, delay: fin, heavy: true });
        k.shockwave(t.x, t.y, { r0: 4, r1: 46 * c.sz, color: '#ffffff', w: 2.6, delay: fin, n: 2 });
        for (let j = 0; j < 7; j++) c.fx.petal(t.x + rnd(-22, 22), t.y + rnd(-24, 0), { color: '#ffffff', vx: rnd(-30, 30), vy: rnd(-40, -10), size: 2.4, delay: fin + 60 + j * 25, life: 380 });
      });
      txt(c, 'パパパパ', c.t.x, c.t.y - 32, { delay: c.hit + 60, fill: '#fff6c8', life: 380 });
      txt(c, 'シャーン', c.t.x + 14, c.t.y - 24, { delay: c.hit + 580, fill: '#ffe08a' });
      k.shake(200, 1.5, c.hit + 560);
    },
  },

  // ───── ゴッドハンド（超級職） ─────
  // 神速の拳: 一しゅんで 敵の 前へ（白い すじ）→ こぶしと 衝撃波 2重 → すじが もとの 位置へ もどる
  ox_shinsoku_ken: {
    sfx: 'ax_o2_shinsoku',
    allyFx: 'claw',
    minParts: 150,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      c.fx.glow(h.x, h.y, { color: '#ffffff', r: 18, life: 120 });
      c.each((t, i, d) => {
        k.dash(h.x, h.y, t.x, t.y + 10, { color: '#e8f4ff', travel: c.hit, w: 6, delay: d, n: 4 });
        k.streaks({ ang: Math.atan2(t.y - h.y, t.x - h.x), color: '#ffffff', n: 22, delay: d, life: 300, alpha: 0.6, speed: 1.6 });
        obj(c, 'fist', { x: t.x, y: t.y + 6, s: 10 * c.sz, pop: 100, glow: '#ffffff', glowA: 0.7, delay: d + c.hit - 20, life: 340, fout: 200 });
        k.speedLines(t.x, t.y, { delay: d + c.hit, life: 260, r0: 14, r1: 90, n: 22 });
        for (const dt of [0, 110]) {
          k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#bfe6ff', colors: ['#ffffff', '#bfe6ff', '#ffe080'], delay: d + c.hit + dt, heavy: dt === 0 && i === 0 });
          k.shockwave(t.x, t.y, { r0: 4, r1: 54 * c.sz, color: dt ? '#ffe080' : '#ffffff', w: 2.6, delay: d + c.hit + dt, life: 380 });
        }
        k.particles(t.x, t.y, { n: 30, colors: ['#ffffff', '#bfe6ff', '#ffe080'], speed: 200, delay: d + c.hit, life: 460 });
        k.dash(t.x, t.y + 10, h.x, h.y, { color: '#bfe6ff', travel: 160, w: 4, delay: d + c.hit + 560, n: 3 });
        c.fx.glow(h.x, h.y, { color: '#bfe6ff', r: 16, delay: d + c.hit + 720, life: 260 });
      });
      txt(c, 'シュン', h.x, h.y - 26, { delay: 0, life: 300 });
      txt(c, 'ドドン', c.t.x + 18, c.t.y - 26, { delay: c.hit + 40, size: 13, fill: '#ffe080' });
      k.flash('#ffffff', 90, c.hit);
      k.shake(240, 1.7, c.hit);
    },
  },
  // 天地の構え: 上に 天（青い 円）、下に 地（茶色い 円）→ 2つの 円が 体で まじわる → 金の 光
  ox_tenchi_kamae: {
    charge: { color: '#7ab8ff', color2: '#e8c89a' },
    sfx: 'ax_o2_tenchi',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const top = above(c, t, 46), gy = ground(c, t, 14);
        obj(c, 'hex', { x0: t.x, y0: top, x1: t.x, y1: t.y - 8, travel: c.hit, ease: 'in', s: 18, sy: 0.35, color: '#7ab8ff', color2: 'rgba(90,150,255,0.25)', delay: d, life: c.hit + 80, fout: 80, add: true });
        obj(c, 'hex', { x0: t.x, y0: gy, x1: t.x, y1: t.y - 8, travel: c.hit, ease: 'in', s: 18, sy: 0.35, color: '#e8b070', color2: 'rgba(200,140,80,0.25)', delay: d, life: c.hit + 80, fout: 80, add: true });
        k.glyph(t.x, top, { r: 22, color: '#7ab8ff', color2: '#ffffff', variant: 'rune', delay: d, life: c.hit + 60 });
        k.glyph(t.x, gy, { r: 22, color: '#c08a50', color2: '#ffe8c0', variant: 'rune', delay: d, life: c.hit + 60 });
        rays(c, t.x, t.y - 8, { r: 56, n: 14, color: '#ffd23a', delay: d + c.hit, life: 520, a: 0.4 });
        c.fx.glow(t.x, t.y - 8, { color: '#ffd23a', r: 34, delay: d + c.hit, life: 380 });
        k.shockwave(t.x, t.y - 8, { r0: 6, r1: 48, color: '#ffe680', w: 2.6, delay: d + c.hit, n: 2 });
        k.particles(t.x, t.y - 8, { n: 20, colors: GOLD, speed: 120, delay: d + c.hit, life: 420 });
        upMark(c, { x: t.x - 10, y: t.y }, '#ff5a3a', d + c.hit + 60, 2);
        upMark(c, { x: t.x + 10, y: t.y }, '#3a8aff', d + c.hit + 120, 2);
      });
      txt(c, 'ゴォン', c.t.x, c.t.y - 40, { delay: c.hit, fill: '#ffe680' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // むそうけん: 左右上下 4方向の 光の こぶし → 4つの 衝撃波が 重なって 大きく 光る → 火花
  ox_musou_ken: {
    charge: { color: '#ffe080', color2: '#ffffff' },
    sfx: 'ax_o2_musou',
    allyFx: 'claw',
    minParts: 170,
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const R = 56 * c.sz;
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        dirs.forEach(([dx, dy], j) => {
          const at = d + c.hit + j * 90;
          fist(c, t.x + dx * R, t.y + dy * R * 0.7, t.x + dx * 4, t.y + dy * 4, { travel: c.hit, delay: at - c.hit, s: 7 * c.sz, color: '#ffe8a0', color2: '#ff7a2a', glow: '#ffe080', trail: 3, hold: 60 });
          k.shockwave(t.x, t.y, { r0: 4, r1: (26 + j * 8) * c.sz, color: ['#ffffff', '#ffe080', '#ffa040', '#ffffff'][j], w: 2.4, delay: at, life: 320 });
          c.fx.impact(t.x + dx * 4, t.y + dy * 4, { r: 11, delay: at });
          k.particles(t.x, t.y, { n: 8, colors: ORANGE, speed: 140, delay: at, life: 300 });
        });
        const fin = d + c.hit + 380;
        c.fx.glow(t.x, t.y, { color: '#ffe080', r: 52 * c.sz, delay: fin, life: 420 });
        k.impact(t.x, t.y, { r: 20 * c.sz, glow: '#ffe080', colors: ORANGE, delay: fin, heavy: true });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#ffffff', w: 3, delay: fin, n: 2 });
        rays(c, t.x, t.y, { r: 70 * c.sz, n: 16, color: '#ffe080', delay: fin, life: 460, a: 0.35 });
        k.particles(t.x, t.y, { n: 26, colors: ORANGE, speed: 220, delay: fin, life: 480 });
      });
      txt(c, 'ドドドド', c.t.x, c.t.y - 36, { delay: c.hit + 80, fill: '#ffe080', life: 360 });
      txt(c, 'バァン', c.t.x + 16, c.t.y - 24, { delay: c.hit + 400, size: 14, fill: '#ffb040' });
      k.flash('#fff6d0', 100, c.hit + 380);
      k.shake(260, 1.8, c.hit + 380);
    },
  },
  // いかずちの拳: こぶしで 地面を うつ → 地面から 敵全体へ いなずまが 走って 下から つき上げる → 黄色い 火花
  ox_ikazuchi_kobushi: {
    charge: { color: '#ffe040', color2: '#ffffff' },
    sfx: 'ax_o2_ikazuchi',
    allyFx: 'bolt',
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const gy0 = c.fromAlly ? c.H - 8 : Math.min(c.H - 4, c.from.y + 20);
      obj(c, 'fist', { x0: h.x, y0: gy0 - 30, x1: h.x, y1: gy0 - 4, travel: 120, ease: 'in', s: 8, rot0: Math.PI, glow: '#ffe040', life: 260, fout: 100 });
      k.impact(h.x, gy0 - 2, { r: 14, glow: '#ffe040', delay: 120 });
      k.shockwave(h.x, gy0 - 2, { r0: 4, r1: 40, sy: 0.3, color: '#fff6b0', w: 2.4, delay: 120 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 14);
        k.bolt(h.x, gy0 - 2, t.x, gy, { w: 2, amp: 6, n: 10, forks: 1, color: '#fff6b0', glow: '#ffd83a', delay: d + 150, grow: c.hit - 150, life: 340 });
        k.bolt(t.x, gy, t.x + rnd(-4, 4), t.y - 26, { w: 2.8 * c.sz, amp: 7, forks: 2, color: '#ffffff', glow: '#ffe040', delay: d + c.hit, grow: 50, life: 360 });
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe040', colors: ['#ffffff', '#ffe040', '#fff6b0'], delay: d + c.hit, heavy: i === 0 });
        for (let j = 0; j < per(c, 3, 1); j++) c.fx.zap(t.x + rnd(-14, 14), t.y + rnd(-14, 8), t.x + rnd(-14, 14), t.y + rnd(-14, 8), { color: '#fff6b0', glow: '#ffd83a', delay: d + c.hit + 80 + j * 70, life: 200 });
        k.particles(t.x, t.y, { n: per(c, 16, 4), colors: ['#ffffff', '#ffe040', '#fff6b0'], speed: 160, delay: d + c.hit, life: 380 });
      });
      txt(c, 'バリバリッ', c.center.x, c.center.y - 36, { delay: c.hit, fill: '#fff27a' });
      k.flash('#fff6b0', 90, c.hit);
      k.shake(240, 1.7, c.hit);
    },
  },
  // ゴッドハンド: 背中に 大きな 金の 手 → 金の 手と いっしょに こぶし → 大きな 金の 衝撃波＋十字＋がれき → 金の 羽
  ox_god_hand: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o2_godhand',
    allyFx: 'holy',
    minParts: 170,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const back = { x: h.x, y: c.fromAlly ? h.y - 34 : h.y - 20 };
      obj(c, 'hand', { x0: back.x, y0: back.y + 20, x1: back.x, y1: back.y, travel: 200, ease: 'out', s: 22, glow: '#ffe680', glowA: 0.6, alpha: 0.9, life: 260, fout: 80, rot0: c.fromAlly ? 0 : Math.PI });
      rays(c, back.x, back.y, { r: 70, n: 14, color: '#ffe680', life: 360, a: 0.3 });
      c.each((t, i, d) => {
        const ang = Math.atan2(t.y - back.y, t.x - back.x) + Math.PI / 2;
        obj(c, 'hand', { x0: back.x, y0: back.y, x1: t.x, y1: t.y + 8, travel: c.hit - 200, start: 0, ease: 'in', s: 20 * c.sz, rot0: ang, glow: '#ffe680', glowA: 0.6, trail: 3, delay: d + 200, life: c.hit, fout: 60 });
        fist(c, h.x, h.y, t.x, t.y + 4, { travel: c.hit - 160, delay: d + 160, s: 7 * c.sz, color: '#ffe8a0', color2: '#ffd23a', glow: '#ffe680' });
        const at = d + c.hit;
        obj(c, 'hand', { x: t.x, y: t.y + 4, s: 26 * c.sz, rot0: ang, alpha: 0.55, add: true, glow: '#ffe680', delay: at, life: 380, fout: 300 });
        k.explosion(t.x, t.y, { r: 22 * c.sz, pal: { main: '#ffd23a', glow: '#ffe680', core: '#ffffff', dark: '#a06a0a', list: GOLD }, delay: at, heavy: i === 0, smoke: '#a08a5a' });
        k.beam(t.x, t.y - 50 * c.sz, t.x, t.y + 40 * c.sz, { w: 6, color: '#fff6c8', glow: '#ffd23a', delay: at, grow: 60, life: 480, burst: false, streaks: false });
        k.beam(t.x - 46 * c.sz, t.y - 6, t.x + 46 * c.sz, t.y - 6, { w: 6, color: '#fff6c8', glow: '#ffd23a', delay: at + 40, grow: 60, life: 460, burst: false, streaks: false });
        k.shockwave(t.x, t.y, { r0: 6, r1: 80 * c.sz, color: '#ffe680', w: 3, delay: at, n: 2 });
        k.debris(t.x, t.y + 10, { n: per(c, 10, 3), colors: STONE, up: 160, delay: at });
        for (let j = 0; j < per(c, 8, 2); j++) c.fx.petal(t.x + rnd(-26, 26), t.y + rnd(-24, 4), { color: j % 2 ? '#ffd23a' : '#fff6b0', vx: rnd(-30, 30), vy: rnd(-46, -10), size: 2.4, delay: at + 140 + j * 30, life: 640 });
      });
      bg(c, 'gold', { delay: c.hit - 60, life: 520, a: 0.25 });
      txt(c, 'ズドォン', c.t.x + 18, c.t.y - 30, { delay: c.hit + 40, size: 14, fill: '#ffe680' });
      k.flash('#fff6d0', 120, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // 天地を砕く拳: 地面を うつ → 大きな ひび、岩の 柱が 敵全体の 下から つき上がる → 空にも 光の ひび → がれきの 雨
  ox_tenchi_kudaki: {
    charge: { color: '#ffd23a', color2: '#c08a50' },
    sfx: 'ax_o2_kudaki',
    allyFx: 'quake',
    minParts: 150,
    play(fx, c) {
      const { k } = c;
      const h = hands(c);
      const gy0 = c.fromAlly ? c.H - 8 : Math.min(c.H - 4, c.from.y + 20);
      obj(c, 'fist', { x0: h.x, y0: gy0 - 34, x1: h.x, y1: gy0 - 4, travel: 140, ease: 'in', s: 9, rot0: Math.PI, glow: '#ffd23a', life: 280, fout: 100 });
      k.impact(h.x, gy0 - 2, { r: 16, glow: '#ffd23a', delay: 140, heavy: true });
      c.fx.crack(c.W / 2, Math.min(c.H - 10, c.center.y + 24), { n: 7, len: 90, color: '#2a1a10', hi: '#ffd66b', delay: 200, life: c.len - 300, sy: 0.3 });
      for (let j = 0; j < 3; j++) k.bolt(30 + j * 90 + rnd(-10, 10), -4, 50 + j * 90 + rnd(-10, 10), 26 + rnd(0, 10), { w: 1.4, amp: 6, n: 6, forks: 1, color: '#ffffff', glow: '#ffd23a', delay: c.hit + 120 + j * 70, grow: 60, life: 420 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 18);
        for (const [dx, sc] of [[0, 1], [-14, 0.65], [14, 0.7]]) obj(c, 'spire', { x0: t.x + dx * c.sz, y0: gy + 30, x1: t.x + dx * c.sz, y1: gy - 18 * sc, travel: 120, ease: 'out', s: 22 * sc * c.sz, delay: d + c.hit - 100, life: 560, fout: 220 });
        c.fx.glow(t.x, gy - 20, { color: '#ffd23a', r: 26 * c.sz, delay: d + c.hit, life: 260 });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffd23a', colors: ['#ffffff', '#ffd23a', '#e8c89a'], delay: d + c.hit, heavy: i === 0 });
        k.debris(t.x, t.y, { n: per(c, 10, 3), colors: EARTH, up: 170, delay: d + c.hit });
        k.shockwave(t.x, gy, { r0: 4, r1: 40 * c.sz, sy: 0.3, color: '#e8c89a', w: 2.4, delay: d + c.hit });
      });
      for (let j = 0; j < 10; j++) k.shapes(rnd(10, c.W - 10), -4, { shape: 'rock', n: 1, colors: EARTH, speed: 30, ang: Math.PI / 2, spread: 0.2, g: 260, size: 2.2, delay: c.hit + 300 + j * 50, life: 520, add: false });
      txt(c, 'ドガァン', c.center.x, c.center.y - 40, { delay: c.hit, size: 14, fill: '#ffd23a' });
      k.flash('#fff0c0', 100, c.hit);
      k.shake(300, 2, 140);
    },
  },

  // ───── ガーディアン（超級職） ─────
  // てっぺきの構え: 石の かべが 下から せり上がる → 青い 光の ふち → かべが すける
  ox_teppeki: {
    charge: { color: '#7ab8ff', color2: '#ffffff' },
    sfx: 'ax_o2_wall',
    allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      c.each((t, i, d) => {
        const gy = ground(c, t, 10);
        for (const [dx, sc] of [[-22, 1], [22, 1], [0, 1.15]]) {
          obj(c, 'bricks', { x0: t.x + dx, y0: gy + 16, x1: t.x + dx, y1: gy - 12 * sc, travel: c.hit, ease: 'out', s: 12 * sc, bw: dx ? 1.1 : 1.8, alpha: dx ? 0.95 : 0.7, delay: d, life: c.len - 80, fout: 360 });
        }
        k.shockwave(t.x, gy, { r0: 10, r1: 40, sy: 0.3, color: '#7ab8ff', w: 2.6, delay: d + c.hit, n: 2 });
        obj(c, 'hex', { x: t.x, y: t.y - 10, s: 26, pop: 160, color: '#9ad8ff', delay: d + c.hit, life: 460, fout: 240, add: true });
        k.shapes(t.x, t.y - 4, { shape: 'rock', n: 8, colors: STONE, speed: 40, ang: -Math.PI / 2, spread: 1, g: 120, size: 1.8, delay: d + 60, life: 400, add: false });
        k.particles(t.x, t.y - 8, { n: 14, colors: ['#ffffff', '#9ad8ff'], speed: 90, delay: d + c.hit, life: 360 });
        upMark(c, t, '#3a8aff', d + c.hit + 100, 3);
      });
      txt(c, 'ガチン', c.t.x + 24, c.t.y - 32, { delay: c.hit, fill: '#bfe0ff' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // ようさいの一撃: 体の うしろに 石の とりで → とりでごと ドーンと 体当たり → 石の 欠片
  ox_youzai_ichigeki: {
    sfx: 'ax_o2_youzai',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 20);
      c.each((t, i, d) => {
        obj(c, 'castle', { x0: h.x, y0: h.y, x1: t.x, y1: t.y + 4, travel: c.hit - 160, start: 160, ease: 'in', s: 19 * c.sz, bw: 2.2, pop: 140, glow: '#c8c8e0', glowA: 0.25, trail: 2, delay: d, life: c.hit + 120, fout: 120 });
        k.dash(h.x, h.y, t.x, t.y, { color: '#c8c8e0', travel: c.hit - 160, w: 7, delay: d + 160, n: 3 });
        const at = d + c.hit;
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#d0d0e0', colors: ['#ffffff', '#c8c8d8', '#ffe080'], delay: at, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#d0d0e0', w: 3.2, delay: at, n: 2 });
        k.debris(t.x, t.y, { n: 14, colors: STONE, up: 170, size: 2, delay: at });
        for (let j = 0; j < 4; j++) c.fx.puff(t.x + rnd(-16, 16), t.y + rnd(0, 10), { color: '#8a8a9a', r0: 4, r1: 14, vy: -14, delay: at + 60, life: 420, alpha: 0.5 });
      });
      txt(c, 'ズシン', h.x, h.y - 30, { delay: 60, fill: '#d8d8e8', life: 300 });
      txt(c, 'ドーン', c.t.x + 18, c.t.y - 28, { delay: c.hit + 30, size: 14 });
      k.flash('#ffffff', 80, c.hit);
      k.shake(280, 1.9, c.hit);
    },
  },
  // シールドアタック: 盾を かまえて ダッシュ → ガツン！ 盾の 形の 衝撃 → 黄色い しびれ
  ox_shield_attack: {
    sfx: 'ax_o2_shieldbash',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 18);
      c.each((t, i, d) => {
        obj(c, 'shield', { ...SHIELD, x0: h.x, y0: h.y, x1: t.x, y1: t.y + 6, travel: c.hit, ease: 'in', s: 11 * c.sz, glow: '#9ad8ff', trail: 3, delay: d, life: c.hit + 60, fout: 60 });
        k.dash(h.x, h.y, t.x, t.y, { color: '#9ad8ff', travel: c.hit, w: 6, delay: d, n: 3 });
        const at = d + c.hit;
        obj(c, 'shield', { ...SHIELD, x: t.x, y: t.y, s: 20 * c.sz, grow: 1.6, alpha: 0.6, add: true, delay: at, life: 340, fout: 260 });
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#9ad8ff', colors: ['#ffffff', '#9ad8ff', '#ffe040'], delay: at, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#ffffff', w: 2.8, delay: at, n: 2 });
        for (let j = 0; j < 5; j++) c.fx.zap(t.x + rnd(-18, 18), t.y + rnd(-18, 10), t.x + rnd(-18, 18), t.y + rnd(-18, 10), { color: '#fff6b0', glow: '#ffd83a', w: 1.4, delay: at + 120 + j * 90, life: 220 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: 10, colors: ['#ffe066', '#ffffff'], speed: 90, size: 2.6, delay: at, life: 520 });
        k.particles(t.x, t.y, { n: 20, colors: ['#ffffff', '#9ad8ff', '#ffe040'], speed: 170, delay: at, life: 420 });
      });
      txt(c, 'ガツン', c.t.x + 18, c.t.y - 28, { delay: c.hit + 20, size: 14, fill: '#ffe040' });
      k.flash('#ffffff', 80, c.hit);
      k.shake(240, 1.7, c.hit);
    },
  },
  // みんなを守る: 大きな 光の 盾が 仲間全員の 前に 4つ → 1つに つながって 光の かべ → うすれる
  ox_minna_mamoru: {
    charge: { color: '#7ab8ff', color2: '#ffffff' },
    sfx: 'ax_o2_protect',
    allyFx: 'guard',
    play(fx, c) {
      const { k } = c;
      const y = c.fromAlly ? c.H - 34 : c.t.y - 10;
      const xs = c.fromAlly ? [0, 1, 2, 3].map((i) => c.W / 2 + (i - 1.5) * 58) : c.targets.map((t) => t.x);
      xs.forEach((x, j) => {
        const at = j * 90;
        obj(c, 'shield', { ...SHIELD, color: '#5a8ae8', x, y, s: 13, pop: 160, glow: '#9ad8ff', glowA: 0.6, delay: at, life: c.len - 80 - at, fout: 320 });
        k.particles(x, y, { n: 8, colors: ['#ffffff', '#9ad8ff'], speed: 100, delay: at + 40, life: 300 });
        c.fx.ring(x, y, '#bfe0ff', 2.4, at, 360, 30);
      });
      k.beam(Math.min(...xs) - 20, y - 2, Math.max(...xs) + 20, y - 2, { w: 9, color: '#9ad8ff', glow: '#bfe0ff', core: '#ffffff', delay: c.hit, grow: 140, life: c.len - c.hit - 80, fall: 300, streaks: true, burst: false, alpha: 0.75 });
      c.each((t, i, d) => {
        obj(c, 'hex', { x: t.x, y: t.y - 10, s: 22, pop: 140, color: '#9ad8ff', delay: d + c.hit, life: 420, fout: 220, add: true });
        upMark(c, t, '#3a8aff', d + c.hit + 120, 3);
      });
      txt(c, 'キィン', c.W / 2, y - 30, { delay: c.hit + 60, fill: '#bfe0ff' });
      k.shake(200, 1.5, c.hit);
    },
  },
  // 大地のたて: 盾を 地面に たたきつける → 土の 輪の 波が 敵全体へ → 敵が はねる＋黄色い しびれ → 土けむり
  ox_daichi_tate: {
    sfx: 'ax_o2_daichi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 18);
      const gy0 = c.fromAlly ? c.H - 10 : Math.min(c.H - 4, c.from.y + 20);
      obj(c, 'shield', { ...SHIELD, x0: h.x, y0: gy0 - 40, x1: h.x, y1: gy0 - 12, travel: 140, ease: 'in', s: 13, glow: '#e8c89a', life: c.hit + 260, fout: 200 });
      k.impact(h.x, gy0 - 4, { r: 16, glow: '#e8c89a', colors: EARTH, delay: 140, heavy: true });
      for (let j = 0; j < 3; j++) k.shockwave(h.x, gy0 - 4, { r0: 10, r1: 150, sy: 0.3, color: j % 2 ? '#e8c89a' : '#c08a50', w: 3, delay: 140 + j * 90, life: 520 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 16), at = d + c.hit;
        k.shockwave(t.x, gy, { r0: 6, r1: 34 * c.sz, sy: 0.3, color: '#e8c89a', w: 2.4, delay: at });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#e8c89a', colors: EARTH, delay: at, heavy: i === 0 });
        k.debris(t.x, gy, { n: per(c, 8, 3), colors: EARTH, up: 130, delay: at });
        for (let j = 0; j < per(c, 3, 1); j++) c.fx.zap(t.x + rnd(-14, 14), t.y + rnd(-14, 8), t.x + rnd(-14, 14), t.y + rnd(-14, 8), { color: '#fff6b0', glow: '#ffd83a', delay: at + 120 + j * 90, life: 200 });
        for (let j = 0; j < per(c, 3, 1); j++) c.fx.puff(t.x + rnd(-14, 14), gy - 2, { color: '#a08a6a', r0: 4, r1: 13, vy: -16, delay: at + 80, life: 460, alpha: 0.5 });
      });
      txt(c, 'ゴゴゴ', c.center.x, c.center.y - 36, { delay: c.hit, fill: '#e8c89a' });
      k.shake(300, 1.9, 140);
    },
  },
  // 不動のようさい: 石の 城壁が 左右から せり上がる → 城壁の 上に 青い 光の 旗 → 城壁が 光の まくに かわる
  ox_fudou_youzai: {
    charge: { color: '#7ab8ff', color2: '#ffffff' },
    sfx: 'ax_o2_fortress',
    allyFx: 'guard',
    minParts: 110,
    play(fx, c) {
      const { k } = c;
      const gy = c.fromAlly ? c.H + 2 : ground(c, c.t, 14);
      const L = Math.max(4, Math.min(...c.targets.map((t) => t.x)) - 34), R = Math.min(c.W - 4, Math.max(...c.targets.map((t) => t.x)) + 34);
      for (const [x, side] of [[L, -1], [R, 1]]) {
        obj(c, 'castle', { x0: x, y0: gy + 30, x1: x, y1: gy - 20, travel: c.hit - 80, ease: 'out', s: 22, bw: 1.1, flagCol: '#3a8aff', delay: 0, life: c.len - 40, fout: 340, glow: '#7ab8ff', glowA: 0.3 });
        k.debris(x, gy - 4, { n: 6, colors: STONE, up: 90, delay: 60 });
        for (let j = 0; j < 2; j++) c.fx.puff(x + side * rnd(0, 10), gy - 6, { color: '#9a9aaa', r0: 4, r1: 14, vy: -18, delay: 80 + j * 80, life: 420, alpha: 0.5 });
      }
      obj(c, 'castle', { x0: (L + R) / 2, y0: gy + 40, x1: (L + R) / 2, y1: gy - 6, travel: c.hit, ease: 'out', s: 14, bw: (R - L) / 14 - 1.4, alpha: 0.55, delay: 100, life: c.len - 140, fout: 360 });
      k.beam(L, gy - 40, R, gy - 40, { w: 14, color: '#7ab8ff', glow: '#bfe0ff', core: '#ffffff', delay: c.hit + 120, grow: 160, life: c.len - c.hit - 160, fall: 320, streaks: true, burst: false, alpha: 0.5 });
      c.each((t, i, d) => {
        obj(c, 'hex', { x: t.x, y: t.y - 10, s: 22, pop: 140, color: '#9ad8ff', delay: d + c.hit, life: 460, fout: 240, add: true });
        k.particles(t.x, t.y - 8, { n: 10, colors: ['#ffffff', '#9ad8ff'], speed: 90, delay: d + c.hit, life: 380 });
        upMark(c, t, '#3a8aff', d + c.hit + 140, 3);
      });
      txt(c, 'キィーン', c.W / 2, Math.max(16, gy - 70), { delay: c.hit + 100, fill: '#bfe0ff' });
      k.flash('#dff0ff', 90, c.hit);
      k.shake(260, 1.6, 40);
    },
  },
  // シールドスロー: 丸い 盾が 回転して とぶ → 敵に 当たって 星 → ブーメランの ように もどる
  ox_shield_throw: {
    sfx: 'ax_o2_shieldthrow',
    allyFx: 'quake',
    minParts: 120,
    play(fx, c) {
      const { k } = c;
      const h = hands(c, 18);
      c.each((t, i, d) => {
        const side = t.x >= h.x ? 1 : -1;
        const mid = [(h.x + t.x) / 2 - side * 40, Math.min(h.y, t.y) - 6];
        obj(c, 'rshield', { pts: [[h.x, h.y], mid, [t.x, t.y]], travel: c.hit, s: 14 * c.sz, spin: 22, sy: 0.75, glow: '#9ad8ff', glowA: 0.6, trail: 4, delay: d, life: c.hit, fout: 20, fin: 40 });
        const at = d + c.hit;
        k.impact(t.x, t.y, { r: 18 * c.sz, glow: '#9ad8ff', colors: ['#ffffff', '#ffd23a', '#9ad8ff'], delay: at, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 60 * c.sz, color: '#ffffff', w: 3, delay: at, n: 2 });
        c.fx.star(t.x, t.y, '#ffe066', 26 * c.sz, at, 320);
        k.shapes(t.x, t.y, { shape: 'star', n: 12, colors: ['#ffe066', '#ffffff'], speed: 120, size: 2.8, delay: at, life: 560 });
        k.particles(t.x, t.y, { n: 20, colors: ['#ffffff', '#ffd23a', '#9ad8ff'], speed: 190, delay: at, life: 420 });
        const back = [(h.x + t.x) / 2 + side * 46, Math.min(h.y, t.y) + 4];
        obj(c, 'rshield', { pts: [[t.x, t.y], back, [h.x, h.y]], travel: 520, s: 14 * c.sz, spin: 22, sy: 0.75, glow: '#9ad8ff', glowA: 0.6, trail: 4, delay: at, life: 560, fout: 80, fin: 10 });
        c.fx.glow(h.x, h.y, { color: '#9ad8ff', r: 18, delay: at + 520, life: 240 });
      });
      txt(c, 'ギュイーン', h.x + 20, h.y - 30, { delay: 0, life: 360, fill: '#bfe0ff' });
      txt(c, 'ガン！', c.t.x + 18, c.t.y - 28, { delay: c.hit + 20, size: 14, fill: '#ffe066' });
      k.flash('#ffffff', 90, c.hit);
      k.shake(260, 1.8, c.hit);
    },
  },
};
void downMark;
void solo;
