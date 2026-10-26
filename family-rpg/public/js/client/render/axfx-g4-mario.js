// 第48回 G4: マリオ（ももの姫/配管工・おてんば姫/ひげおやじ・ピーチ/マリオ）の 大技の え。この ファイルは G4 だけが さわる
// 女の子は ピンクの ドレスと 金の かんむり、男の子（c.masc）は 赤い ぼうしと 青い ふく の かげ
// 時間は shared/data/ax-time-g4.js。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js';
import { add, obj, darken, ground, per, solo } from './axfx-g4-kit.js';

const STAR = ['#ffe066', '#ffffff', '#ffd23a'];
const RAINBOW = ['#ff5a5a', '#ffb03a', '#ffe066', '#5ae07a', '#5ab8ff', '#b07aff'];
const FIREB = ['#ff4a1a', '#ffa020', '#fff27a'];
// つかう 人の かげ（男の子 マリオ・女の子 ピーチ）
const look = (c) => (c.masc ? { color: '#2a3a9a', cap: '#e83a2a', hair: false, glow: '#ff7a5a', outline: '#1a1020' } : { color: '#ff6ab0', cap: '#ffd23a', hair: true, glow: '#ffb0dc', outline: '#3a1028' });
const from = (c, up = 12) => ({ x: c.from.x, y: c.fromAlly ? c.from.y - up : c.from.y });
// ほしと コインが はじける
function starPop(c, x, y, d, n = 8, coins = 1) {
  c.k.shapes(x, y, { shape: 'star', n, colors: STAR, speed: 90, g: 120, size: 2.6, delay: d, life: 520 });
  for (let j = 0; j < coins; j++) obj(c, 'coin', { x0: x + rnd(-6, 6), y0: y, x1: x + rnd(-16, 16), y1: y - 6, hop: 26, travel: 360, s: 5.4, delay: d + j * 40, life: 420, seed: j });
}

export const AX_G4_MARIO = {
  // ジャンプふみつけ: 弧を えがいて とび上がる かげ → 敵の 上に ふみつけ（つぶれる 光の 線）→ ほし・コイン 1まい
  ax_jump_fumitsuke: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_jump',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const L = look(c), f = from(c);
      c.each((t, i, d) => {
        const top = t.y - 24 * c.sz;
        obj(c, 'runner', { ...L, jump: true, x0: f.x, y0: f.y, x1: t.x, y1: top, hop: 36, travel: c.hit, ease: 'io', s: 9 * c.sz, delay: d, life: c.hit + 10, fout: 10 });
        obj(c, 'runner', { ...L, jump: true, x0: t.x, y0: top, x1: t.x + 22, y1: top + 8, hop: 22, travel: 260, s: 9 * c.sz, delay: d + c.hit, life: 260, fout: 100 });
        k.speedLines(t.x, t.y - 4, { delay: d + c.hit, life: 160, r0: 10, r1: 34, n: 12 });
        k.impact(t.x, t.y - 8, { r: 13 * c.sz, glow: '#ffe066', colors: STAR, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y - 8, { r0: 4, r1: 30 * c.sz, sy: 0.4, color: '#ffffff', w: 2.4, delay: d + c.hit });
        starPop(c, t.x, t.y - 12, d + c.hit, per(c, 8) + solo(c, 4), 1);
      });
      k.shake(100, 1.2, c.hit);
    },
  },
  // スパナで配管なおし: スパナが くるくる → 緑の 土管の 光 → 回復
  ax_spanner_heal: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_spanner',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 20);
      c.each((t, i, d) => {
        obj(c, 'spanner', { x0: f.x, y0: f.y, x1: t.x, y1: t.y - 22, hop: 20, travel: 180, spin: 16, s: 8.1, delay: d, life: c.len - 60 });
        obj(c, 'pipe', { x: t.x, y: t.y - 4, s: 7, pop: 140, glow: '#7af08a', delay: d + 120, life: 360, alpha: 0.85 });
        for (const dt of [140, 220]) c.fx.sparks(t.x, t.y - 22, { colors: ['#ffffff', '#ffe066'], n: 5, speed: 90, delay: d + dt, life: 220 });
        c.fx.glow(t.x, t.y - 10, { color: '#7af08a', r: 22, delay: d + c.hit, life: 220, alpha: 0.9 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#7af08a', '#c8ffd8'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit, life: 200 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 28, sy: 0.4, color: '#7af08a', delay: d + c.hit, life: 200 });
      });
    },
  },
  // 土管ワープ: 画面の 下に 緑の 土管が にゅっと 出て すいこまれる（下むきの 線）→ ひっこむ
  ax_dokan_warp: {
    charge: { color: '#5ae07a', color2: '#ffffff' },
    sfx: 'ax_g4_pipe',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const L = look(c);
      c.each((t, i, d) => {
        const by = c.H + 30, py = c.H - 30;
        obj(c, 'pipe', { pts: [[t.x, by], [t.x, py], [t.x, py], [t.x, by]], travel: c.len - 40, s: 13, delay: d, life: c.len - 20, fout: 30 });
        obj(c, 'runner', { ...L, x0: t.x, y0: py - 30, x1: t.x, y1: py + 14, travel: 220, start: 120, ease: 'in', s: 6, delay: d, life: 340, fout: 60 });
        c.fx.arrows(t.x, py - 20, '#7af08a', false, 3, d + 120);
        k.streaks({ ang: Math.PI / 2, color: '#c8ffd8', n: 12, delay: d + 120, life: 260, alpha: 0.5, speed: 1.4 });
        c.fx.glow(t.x, py - 6, { color: '#7af08a', r: 24, delay: d + c.hit, life: 220, alpha: 0.9 });
        k.shapes(t.x, py - 8, { shape: 'star', n: 8, colors: ['#ffffff', '#7af08a'], speed: 60, size: 2, delay: d + c.hit, life: 240 });
        k.particles(t.x, py - 8, { colors: ['#ffffff', '#7af08a'], n: 12, speed: 90, delay: d + 80, life: 260 });
      });
    },
  },
  // Bダッシュ: 速さの すじ・土けむり → 上むきの やじるし
  ax_b_dash: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_dash',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const L = look(c);
      k.streaks({ ang: Math.PI, color: '#ffffff', n: 20, life: c.len - 80, alpha: 0.6, speed: 2.2 });
      c.each((t, i, d) => {
        const y = t.y - 14;
        obj(c, 'runner', { ...L, x0: t.x - 50, y0: y, x1: t.x + 40, y1: y, travel: 300, s: 7, delay: d, life: 330, fout: 60 });
        for (let j = 0; j < 6; j++) c.fx.puff(t.x - 50 + j * 15, t.y - 2, { color: '#d8c8a8', r0: 2, r1: 7, vx: -30, vy: -10, life: 240, alpha: 0.5, delay: d + j * 45 });
        c.fx.arrows(t.x, t.y - 16, '#ffe066', true, 3, d + c.hit);
        c.fx.glow(t.x, t.y - 12, { color: '#ffe066', r: 18, delay: d + c.hit, life: 220, alpha: 0.8 });
        k.particles(t.x, t.y - 10, { colors: STAR, n: 10, speed: 80, delay: d + c.hit, life: 240 });
      });
    },
  },
  // ハンマーなげ: 木づちが 弧を えがいて まわりながら → ゴンッ
  ax_hammer_nage: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_hammer',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 16);
      const N = c.all ? 2 : 4;
      c.each((t, i, d) => {
        for (let j = 0; j < N; j++) {
          const dj = d + j * 50;
          obj(c, 'hammer', { x0: f.x + rnd(-6, 6), y0: f.y, x1: t.x + (j - N / 2) * 5, y1: t.y, hop: 34 + j * 6, travel: c.hit - j * 50, spin: 18, s: 7.4 * c.sz, delay: dj, life: c.hit - j * 50 + 40, fout: 40 });
        }
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe066', colors: STAR, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 30 * c.sz, color: '#ffffff', w: 2.2, n: 2, gap: 70, delay: d + c.hit });
        starPop(c, t.x, t.y - 8, d + c.hit, per(c, 8) + solo(c, 4), 0);
        k.particles(t.x, t.y, { colors: ['#ffffff', '#c8c8d8'], n: per(c, 12), speed: 150, delay: d + c.hit, life: 260 });
      });
      k.shake(110, 1.2, c.hit);
    },
  },
  // 三だんジャンプ: 小 → 中 → 大の ジャンプ（3回目は ちゅうがえり）→ 敵ぜんぶに ドスン・ほしと コイン
  ax_sandan_jump: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_sandan',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const L = look(c), f = from(c, 8), m = c.center;
      const p1 = { x: f.x + (m.x - f.x) * 0.25, y: f.y + (m.y - f.y) * 0.2 }, p2 = { x: f.x + (m.x - f.x) * 0.55, y: f.y + (m.y - f.y) * 0.45 };
      const top = { x: m.x, y: m.y - 18 };
      obj(c, 'runner', { ...L, jump: true, pts: [[f.x, f.y], [p1.x, p1.y], [p2.x, p2.y]], hops: [12, 22], travel: 220, s: 8.5, life: 230, fout: 10 });
      obj(c, 'runner', { ...L, jump: true, x0: p2.x, y0: p2.y, x1: top.x, y1: top.y, hop: 44, travel: c.hit - 220, spin: -14, s: 9.5, delay: 220, life: c.hit - 220 + 120, fout: 110 });
      for (const [px, py, dd] of [[p1.x, p1.y, 110], [p2.x, p2.y, 220]]) {
        k.shockwave(px, py + 8, { r0: 2, r1: 16, sy: 0.4, color: '#ffffff', delay: dd });
        k.shapes(px, py, { shape: 'star', n: 3, colors: STAR, speed: 40, size: 1.8, delay: dd, life: 220 });
      }
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 14 * c.sz, glow: '#ffe066', colors: STAR, delay: d + c.hit, heavy: i === 0 });
        starPop(c, t.x, t.y - 10, d + c.hit, per(c, 8) + solo(c, 4), c.all ? 1 : 2);
      });
      k.shockwave(m.x, Math.min(c.H - 6, m.y + 14), { r0: 6, r1: 110, sy: 0.32, color: '#ffe066', w: 3, n: 2, gap: 80, delay: c.hit });
      k.debris(m.x, Math.min(c.H - 6, m.y + 14), { n: 8, up: 120, delay: c.hit });
      k.shake(120, 1.3, c.hit);
    },
  },
  // ファイアボール: 火の たま 3つが ぽよん ぽよんと じめんを はねて 敵へ → ほのおの 小爆発
  ax_fireball_bound: {
    charge: { color: '#ff7a1a', color2: '#ffe066' },
    sfx: 'ax_g4_fireball',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 14);
      c.each((t, i, d) => {
        const N = c.all ? 2 : 3;
        for (let j = 0; j < N; j++) {
          const dj = d + j * 70, tr = c.hit - j * 70;
          obj(c, 'fireball', { x0: f.x + j * 3, y0: f.y, x1: t.x + (j - 1) * 6, y1: t.y + 6, hop: 16, bounces: 3, decay: 0.85, travel: tr, spin: 14, s: 4.9 * c.sz, trail: 3, glow: '#ff7a1a', delay: dj, life: tr + 30, fout: 30 });
          k.explosion(t.x + (j - 1) * 6, t.y + 4, { r: 9 * c.sz, pal: { main: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', list: FIREB }, delay: dj + tr, heavy: i === 0 && j === 0 });
        }
        k.flames(t.x, ground(c, t, 16), { w: 26 * c.sz, h: 24, n: 5, delay: d + c.hit, life: 420 });
        k.particles(t.x, t.y, { colors: FIREB, n: per(c, 16) + solo(c, 10), speed: 160, delay: d + c.hit, life: 320 });
      });
      k.shake(180, 1.6, c.hit);
    },
  },
  // スーパーキノコ: 赤い 白水玉の キノコ → からだの 光の わくが 3回 大小 → 大きく
  ax_super_kinoko: {
    charge: { color: '#ff5a4a', color2: '#ffffff' },
    sfx: 'ax_g4_powerup',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      const L = look(c);
      c.each((t, i, d) => {
        const y = t.y - 16;
        obj(c, 'mush', { x0: t.x - 30, y0: y - 20, x1: t.x, y1: y, hop: 14, bounces: 2, travel: c.hit - 40, s: 12, pop: 120, color: '#e83a2a', delay: d, life: c.hit, fout: 40 });
        const sizes = [10, 8, 12, 9, 14];
        sizes.forEach((s, j) => obj(c, 'runner', { ...L, x: t.x, y: y + 6, s, glow: j % 2 ? null : L.glow, delay: d + c.hit + j * 70, life: j === sizes.length - 1 ? c.len - c.hit - j * 70 - 40 : 72, fin: 1, fout: j === sizes.length - 1 ? 160 : 1 }));
        k.shockwave(t.x, y, { r0: 6, r1: 40, color: '#ffffff', w: 2, n: 2, gap: 120, delay: d + c.hit });
        c.fx.arrows(t.x + 14, y, '#ff7a5a', true, 3, d + c.hit + 200);
        k.sparkles(t.x, y, { n: 10, r: 20, colors: ['#ffffff', '#ffe066'], delay: d + c.hit, life: 300 });
        k.particles(t.x, y, { colors: ['#ffffff', '#ff7a5a', '#ffe066'], n: 18, speed: 120, delay: d + c.hit, life: 320 });
      });
    },
  },
  // こうらなげ: 緑の こうらを けって すべらせる → 敵から 敵へ はねかえる → ほし
  ax_koura_nage: {
    charge: { color: '#5ae07a', color2: '#ffffff' },
    sfx: 'ax_g4_shell',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 6);
      let px = f.x, py = f.y;
      c.each((t, i, d) => {
        const tr = i === 0 ? c.hit : Math.max(40, c.stagger);
        const st = i === 0 ? 0 : c.hit + (i - 1) * c.stagger;
        obj(c, 'shell', { x0: px, y0: py, x1: t.x, y1: t.y + 4, travel: tr, s: 10.5 * c.sz, color: '#2ab84a', trail: 2, glow: '#c8ffd8', delay: st, life: tr + 10, fout: 10 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#7af08a', colors: ['#ffffff', '#7af08a', '#ffe066'], delay: d + c.hit, heavy: i === 0 });
        starPop(c, t.x, t.y - 8, d + c.hit, per(c, 8) + solo(c, 6), 0);
        k.particles(t.x, t.y, { colors: ['#ffffff', '#7af08a'], n: per(c, 14) + solo(c, 12), speed: 150, delay: d + c.hit, life: 320 });
        for (let j = 0; j < 3; j++) c.fx.puff(t.x + rnd(-10, 10), t.y + 10, { color: '#d8e8d0', r0: 2, r1: 7, vx: rnd(-30, 30), vy: -10, life: 300, alpha: 0.5, delay: d + c.hit });
        px = t.x; py = t.y + 4;
      });
      // さいごは 画面の そとへ
      const last = c.hit + (c.n - 1) * c.stagger;
      obj(c, 'shell', { x0: px, y0: py, x1: px < c.W / 2 ? -14 : c.W + 14, y1: py - 10, travel: 220, s: 10.5 * c.sz, color: '#2ab84a', trail: 2, glow: '#c8ffd8', delay: last, life: 230, fout: 40 });
      k.shake(200, 1.6, c.hit);
    },
  },
  // POWブロック: 青い POW ブロックを 下から ガン → 画面ぜんたいが ドンと ゆれ、敵ぜんぶが ひっくりかえる
  ax_pow_block: {
    charge: { color: '#5a8aff', color2: '#ffffff' },
    sfx: 'ax_g4_pow',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const b = c.fromAlly ? { x: c.from.x, y: c.from.y - 34 } : { x: c.from.x, y: c.from.y - 30 };
      obj(c, 'block', { pts: [[b.x, b.y], [b.x, b.y], [b.x, b.y - 6], [b.x, b.y]], travel: c.hit + 40, s: 12.2, pop: 120, delay: 0, life: c.hit + 220 });
      c.fx.sparks(b.x, b.y + 10, { colors: ['#ffffff', '#ffe066'], n: 10, speed: 120, ang: Math.PI / 2, spread: 1, delay: c.hit - 60, life: 260 });
      k.shockwave(b.x, b.y, { r0: 8, r1: 60, color: '#9ab8ff', w: 3, n: 2, gap: 80, delay: c.hit - 40 });
      k.flash('#e8f0ff', 140, c.hit);
      k.shockwave(c.W / 2, c.H * 0.6, { r0: 20, r1: 200, sy: 0.4, color: '#ffffff', w: 4, n: 2, gap: 100, delay: c.hit });
      add(c, 'g4Text', { x: b.x, y: b.y - 22, text: 'ドン！', size: 14, fill: '#ffffff', edge: '#1a3a9a', delay: c.hit - 20, life: 460 });
      c.each((t, i, d) => {
        const gy = ground(c, t, 18);
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#9ab8ff', colors: ['#ffffff', '#5a8aff', '#ffe066'], delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 4, r1: 44 * c.sz, sy: 0.3, color: '#ffffff', w: 2.4, n: 2, gap: 90, delay: d + c.hit });
        c.fx.arrows(t.x, t.y - 6, '#ffe066', true, 2, d + c.hit + 60);
        k.shapes(t.x, t.y - 14, { shape: 'star', n: per(c, 6) + solo(c, 4), colors: STAR, speed: 70, ang: -Math.PI / 2, spread: 0.9, g: 160, size: 2.2, delay: d + c.hit + 40, life: 460 });
        k.debris(t.x, gy, { n: per(c, 8) + solo(c, 6), up: 150, delay: d + c.hit });
        for (let j = 0; j < 3; j++) c.fx.puff(t.x + rnd(-18, 18), gy, { color: '#d8c8a8', r0: 2, r1: 9, vx: rnd(-30, 30), vy: -12, life: 360, alpha: 0.45, delay: d + c.hit });
      });
      k.shake(220, 2, c.hit);
    },
  },
  // 1UPキノコ: 緑の キノコが ぴょん → 味方へ →「1UP」の 文字 → 光
  ax_1up_kinoko: {
    charge: { color: '#5ae07a', color2: '#ffffff' },
    sfx: 'ax_g4_1up',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 24);
      c.each((t, i, d) => {
        obj(c, 'mush', { x0: f.x, y0: f.y, x1: t.x, y1: t.y - 14, hop: 26, bounces: 2, travel: c.hit, s: 12, pop: 140, color: '#2ab84a', delay: d, life: c.hit + 30, fout: 30 });
        add(c, 'g4Text', { x: t.x, y: t.y - 30, text: '1UP', size: 11, fill: '#ffffff', edge: '#1a7a2a', rise: 14, delay: d + c.hit, life: c.len - c.hit - 30 });
        c.fx.glow(t.x, t.y - 12, { color: '#7af08a', r: 28, delay: d + c.hit, life: 320, alpha: 0.9 });
        k.pillar(t.x, t.y, { w: 7, color: '#c8ffd8', glow: '#7af08a', delay: d + c.hit - 40, life: 340, burst: false, alpha: 0.7 });
        k.sparkles(t.x, t.y - 14, { n: 10, r: 20, colors: ['#ffffff', '#7af08a'], delay: d + c.hit, life: 300 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, sy: 0.4, color: '#7af08a', n: 2, gap: 80, delay: d + c.hit });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: 8, colors: ['#ffffff', '#7af08a', '#ffe066'], speed: 60, size: 2, delay: d + c.hit, life: 300 });
      });
    },
  },
  // ファイアフラワー: 花が ひかって からだが 白と 赤に 点めつ → 火の たま 8つが れんぞくで はねて 敵ぜんぶへ → ほのおの 爆発
  ax_fire_flower: {
    charge: { color: '#ff7a1a', color2: '#ffe066' },
    sfx: 'ax_g4_flower',
    allyFx: 'fire',
    play(fx, c) {
      const { k } = c;
      const L = look(c), f = from(c, 16);
      obj(c, 'flower', { x: f.x + 24, y: f.y - 26, s: 14.9, pop: 160, glow: '#ffa040', life: 360 });
      add(c, 'g4Rays', { x: f.x + 24, y: f.y - 26, r: 50, n: 10, colors: ['#ff5a1a', '#ffe066', '#ffffff'], alpha: 0.5, spin: 1.5, life: 360 });
      obj(c, 'runner', { ...L, cols: ['#ffffff', '#e83a2a'], colMs: 50, cap: '#e83a2a', outline: '#ffffff', x: f.x, y: f.y + 2, s: 10, glow: '#ff9a4a', life: c.hit + 100 });
      const N = 8;
      for (let j = 0; j < N; j++) {
        const t = c.targets[j % c.n];
        const dj = 60 + j * 45, tr = c.hit - 60 - (j % 3) * 20;
        obj(c, 'fireball', { x0: f.x + 6, y0: f.y - 6, x1: t.x + rnd(-10, 10), y1: t.y + 6, hop: 18 + (j % 3) * 6, bounces: 2 + (j % 2), decay: 0.8, travel: tr, spin: 14, s: 5.4 * c.sz, trail: 3, glow: '#ff7a1a', delay: dj, life: tr + 20, fout: 20 });
        k.explosion(t.x + rnd(-8, 8), t.y + rnd(-4, 6), { r: 9 * c.sz, pal: { main: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', list: FIREB }, delay: dj + tr, heavy: j === 0 });
      }
      c.each((t, i, d) => {
        k.flames(t.x, ground(c, t, 16), { w: 30 * c.sz, h: 28, n: 5, delay: c.hit + i * 40, life: 460 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffa040', colors: FIREB, delay: d + c.hit, heavy: false });
      });
      k.shake(220, 1.8, c.hit);
    },
  },
  // 赤いこうら: 赤い こうらが まがりながら 敵を おいかけて あたる → 爆発
  ax_aka_koura: {
    charge: { color: '#ff4a4a', color2: '#ffffff' },
    sfx: 'ax_g4_redshell',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const f = from(c, 6);
      c.each((t, i, d) => {
        const side = (i % 2 ? -1 : 1) * 60;
        const mid1 = [Math.max(10, Math.min(c.W - 10, f.x + side)), (f.y + t.y) / 2 + 10], mid2 = [Math.max(10, Math.min(c.W - 10, t.x - side * 0.6)), t.y - 6];
        obj(c, 'shell', { pts: [[f.x, f.y], mid1, mid2, [t.x, t.y + 4]], hops: [6, 10, 4], travel: c.hit, s: 10.5 * c.sz, color: '#e83a2a', color2: '#ffd0d0', trail: 4, glow: '#ff8a6a', delay: d, life: c.hit + 10, fout: 10 });
        k.explosion(t.x, t.y, { r: 17 * c.sz, pal: { main: '#ff4a2a', glow: '#ffa040', core: '#ffffff', list: ['#ffffff', '#ff7a5a', '#ffe066'] }, delay: d + c.hit, heavy: i === 0 });
        starPop(c, t.x, t.y - 8, d + c.hit + 60, per(c, 8) + solo(c, 6), 0);
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ff7a5a'], n: per(c, 14) + solo(c, 16), speed: 160, delay: d + c.hit, life: 340 });
      });
      k.shake(200, 1.8, c.hit);
    },
  },
  // ヒップドロップ: 上へ とんで くるっと 回転 → 真下へ ドスン → じめんの しょうげきの わ・ほし
  ax_hip_drop: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_hip',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const L = look(c), f = from(c, 8);
      c.each((t, i, d) => {
        const top = { x: t.x, y: t.y - 52 * c.sz };
        obj(c, 'runner', { ...L, jump: true, x0: f.x, y0: f.y, x1: top.x, y1: top.y, hop: 20, travel: 220, ease: 'out', s: 9 * c.sz, delay: d, life: 222, fout: 2 });
        obj(c, 'runner', { ...L, jump: true, x: top.x, y: top.y, spin: 20, s: 9 * c.sz, delay: d + 220, life: 130, fin: 1, fout: 2 });
        obj(c, 'runner', { ...L, jump: true, x0: top.x, y0: top.y, x1: t.x, y1: t.y - 6, travel: c.hit - 350, ease: 'in', rot0: Math.PI, s: 9 * c.sz, delay: d + 350, life: c.hit - 350 + 100, fout: 100 });
        k.streaks({ ang: Math.PI / 2, color: '#ffffff', n: 10, delay: d + 350, life: 160, alpha: 0.5, speed: 2 });
        const gy = ground(c, t, 16);
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffe066', colors: STAR, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, gy, { r0: 4, r1: 54 * c.sz, sy: 0.3, color: '#ffffff', w: 2.6, n: 3, gap: 80, delay: d + c.hit });
        starPop(c, t.x, t.y - 6, d + c.hit, per(c, 10) + solo(c, 6), 0);
        if (!c.masc) k.shapes(t.x, t.y - 10, { shape: 'heart', n: per(c, 6) + solo(c, 4), colors: ['#ff7ab8', '#ffb0dc'], speed: 70, size: 2.4, g: 40, delay: d + c.hit + 40, life: 420, add: false });
        k.debris(t.x, gy, { n: per(c, 8) + solo(c, 8), up: 140, delay: d + c.hit });
        for (let j = 0; j < 4; j++) c.fx.puff(t.x + rnd(-20, 20), gy, { color: '#d8c8a8', r0: 2, r1: 9, vx: rnd(-40, 40), vy: -10, life: 360, alpha: 0.45, delay: d + c.hit });
      });
      k.shake(200, 1.8, c.hit);
    },
  },
  // スター: 黄色い スターが はねて 来て とると、からだが 虹色に 点めつ・きらきら・音ぷ
  ax_super_star: {
    charge: { color: '#ffe066', color2: '#ffffff' },
    sfx: 'ax_g4_star',
    allyFx: 'buff',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.36);
      const L = look(c);
      c.each((t, i, d) => {
        const y = t.y - 18;
        obj(c, 'star', { x0: t.x - 70, y0: y - 10, x1: t.x, y1: y, hop: 26, bounces: 3, decay: 0.8, travel: c.hit, spin: 8, s: 10.8, glow: '#ffe066', trail: 3, delay: d, life: c.hit + 20, fout: 20 });
        obj(c, 'runner', { ...L, rainbow: true, cols: RAINBOW, colMs: 45, x: t.x, y: y + 6, s: 8, glow: '#ffffff', delay: d + c.hit, life: c.len - c.hit - 40 });
        add(c, 'g4Prism', { x: t.x, y, r: 20, delay: d + c.hit, life: c.len - c.hit - 30 });
        add(c, 'g4Rays', { x: t.x, y, r: 60, n: 12, colors: RAINBOW, alpha: 0.4, spin: 1.5, delay: d + c.hit, life: c.len - c.hit - 60 });
        k.shapes(t.x, y, { shape: 'note', n: 8, colors: ['#ffffff', '#ffe066', '#5ab8ff'], speed: 34, ang: -Math.PI / 2, spread: 1, g: -20, size: 2.6, delay: d + c.hit + 60, life: 560, add: false });
        k.sparkles(t.x, y, { n: 14, r: 26, colors: RAINBOW, delay: d + c.hit, gap: 30, life: 320 });
        k.shapes(t.x, y, { shape: 'star', n: 12, colors: RAINBOW, speed: 80, size: 2.2, delay: d + c.hit, life: 460 });
        k.shockwave(t.x, y, { r0: 6, r1: 50, color: '#ffe066', w: 2.6, n: 2, gap: 100, delay: d + c.hit });
      });
      k.flash('#fff6b0', 100, c.hit);
      k.shake(300, 2, c.hit);
    },
  },
  // ヨッシーのたまご: 白に 緑の 水玉の たまご 5こが はねながら 敵へ → パカッ・ほし
  ax_yoshi_tamago: {
    charge: { color: '#5ae07a', color2: '#ffffff' },
    sfx: 'ax_g4_egg',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.36);
      const f = from(c, 16);
      for (let j = 0; j < 5; j++) {
        const t = c.targets[j % c.n];
        const dj = j * 55 + (j >= c.n ? 0 : 0), tr = c.hit - 60;
        const ex = t.x + (c.n === 1 ? (j - 2) * 8 : rnd(-5, 5)), ey = t.y + 2;
        obj(c, 'egg', { x0: f.x, y0: f.y, x1: ex, y1: ey, hop: 30, bounces: 2, decay: 0.6, travel: tr, spin: 10, s: 6.8 * c.sz, trail: 2, glow: '#c8ffd8', delay: dj, life: tr + 10, fout: 10 });
        const at = dj + tr;
        k.debris(ex, ey, { n: 6, colors: ['#ffffff', '#3ac83a', '#fffaf0'], up: 110, shape: 'rock', size: 1.6, delay: at });
        k.impact(ex, ey, { r: 12 * c.sz, glow: '#7af08a', colors: ['#ffffff', '#7af08a', '#ffe066'], delay: at, heavy: j === 0 });
        k.shapes(ex, ey - 6, { shape: 'star', n: 5, colors: STAR, speed: 80, g: 100, size: 2.2, delay: at, life: 460 });
      }
      c.each((t, i, d) => {
        k.shockwave(t.x, t.y, { r0: 4, r1: 46 * c.sz, color: '#c8ffd8', w: 2.4, n: 2, gap: 100, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#7af08a'], n: per(c, 20) + solo(c, 20), speed: 170, delay: d + c.hit, life: 420 });
      });
      k.flash('#f0fff0', 90, c.hit);
      k.shake(340, 2.2, c.hit);
    },
  },
  // キノコ王国のおくりもの: 赤・緑・黄の キノコが 空から 味方へ → 回復
  ax_kinoko_okurimono: {
    charge: { color: '#ff7a5a', color2: '#ffffff' },
    sfx: 'ax_g4_kinoko',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35);
      const MC = ['#e83a2a', '#2ab84a', '#ffc81a', '#3a8aff'];
      c.each((t, i, d) => {
        for (let j = 0; j < 2; j++) {
          const col = MC[(i + j) % MC.length];
          obj(c, 'mush', { x0: t.x + (j ? 14 : -10), y0: -12, x1: t.x + (j ? 8 : -6), y1: t.y - 14, travel: c.hit - j * 60, ease: 'in', spin: 3, s: 8.8, color: col, glow: '#ffffff', delay: d + j * 60, life: c.hit - j * 60 + 120, fout: 120 });
        }
        c.fx.glow(t.x, t.y - 12, { color: '#ffe8a0', r: 26, delay: d + c.hit, life: 360, alpha: 0.9 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#7af08a', '#ffe066'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit, life: 380 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.4, color: '#ffffff', delay: d + c.hit });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: 5, colors: STAR, speed: 50, size: 2, delay: d + c.hit, life: 360 });
      });
      k.shake(320, 2, c.hit - 80);
    },
  },
  // カートでダッシュ: カートの かたちが 画面の 下を はしり、青い ダッシュの ほのお → 速さの やじるし
  ax_kart_dash: {
    charge: { color: '#5ab8ff', color2: '#ffffff' },
    sfx: 'ax_g4_kart',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.35);
      const y = Math.min(c.H - 22, Math.max(...c.targets.map((t) => t.y)) - 24);
      const tr = c.hit + 140;
      obj(c, 'kart', { x0: -20, y0: y, x1: c.W + 20, y1: y, travel: tr, s: 13, color: c.masc ? '#e83a2a' : '#ff6ab0', color2: c.masc ? '#e83a2a' : '#ffd23a', squash: true, life: tr + 10, fout: 10 });
      for (let j = 0; j < 9; j++) {
        const u = j / 9, px = -20 + (c.W + 40) * u;
        c.fx.sparks(px - 10, y + 2, { colors: ['#ffffff', '#5ab8ff', '#3a6aff'], n: 5, speed: 90, ang: Math.PI, spread: 0.4, g: 0, delay: tr * u, life: 220 });
      }
      k.streaks({ ang: 0, color: '#bfe8ff', n: 22, life: c.len - 100, alpha: 0.55, speed: 2.4 });
      c.each((t, i, d) => {
        c.fx.arrows(t.x, t.y - 14, '#5ab8ff', true, 3, d + c.hit);
        c.fx.glow(t.x, t.y - 12, { color: '#5ab8ff', r: 22, delay: d + c.hit, life: 320, alpha: 0.85 });
        k.particles(t.x, t.y - 10, { colors: ['#ffffff', '#5ab8ff'], n: 10, speed: 90, delay: d + c.hit, life: 300 });
      });
      k.shake(300, 2, c.hit);
    },
  },
  // スーパースターラッシュ: 虹色の スターが まわって からだに 入る → 虹色に ひかる かげが 敵ぜんぶを ジグザグに 体当たり → ほしと コインが はじける → コインの 雨
  ax_superstar_rush: {
    charge: { color: '#ffe066', color2: '#ffffff', power: 1.1 },
    sfx: 'ax_g4_rush',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4);
      const L = look(c), f = from(c, 14);
      obj(c, 'star', { rainbow: true, x0: f.x + 40, y0: f.y - 40, x1: f.x, y1: f.y, travel: 180, spin: 12, s: 12.2, glow: '#ffffff', life: 190, fout: 20 });
      // ジグザグの みち（敵1体なら その まわりを なんども つきぬける）
      const segs = [];
      let px = f.x, py = f.y;
      const pass = (tx, ty, st, tr) => { segs.push([px, py, tx, ty, st, tr]); px = tx; py = ty; };
      c.each((t, i) => {
        const st = i === 0 ? 180 : c.hit + (i - 1) * c.stagger, tr = i === 0 ? c.hit - 180 : Math.max(40, c.stagger);
        pass(t.x, t.y, st, tr);
      });
      if (!c.all) {
        const t = c.t;
        [[-46, -26], [44, 20], [-40, 24], [42, -30]].forEach(([dx, dy], j) => {
          const st = c.hit + j * 120;
          pass(t.x + dx, t.y + dy, st, 60);
          pass(t.x - dx * 0.2, t.y - dy * 0.2, st + 60, 60);
        });
      }
      segs.forEach(([x0, y0, x1, y1, st, tr], j) => {
        obj(c, 'runner', { ...L, rainbow: true, cols: RAINBOW, colMs: 40, outline: '#ffffff', x0, y0, x1, y1, travel: tr, s: 10, glow: '#ffffff', trail: 3, delay: st, life: tr + 8, fin: 1, fout: 8 });
        k.dash(x0, y0, x1, y1, { color: RAINBOW[j % RAINBOW.length], travel: tr, w: 8, delay: st, n: 4, life: tr + 220 });
      });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffe066', colors: RAINBOW, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 50 * c.sz, color: RAINBOW[(i + 2) % 6], w: 2.4, n: 2, gap: 90, delay: d + c.hit });
        starPop(c, t.x, t.y - 8, d + c.hit, per(c, 12) + solo(c, 8), c.all ? 1 : 3);
        k.particles(t.x, t.y, { colors: RAINBOW, n: per(c, 22) + solo(c, 20), speed: 200, delay: d + c.hit, life: 420 });
        if (!c.all) for (let j = 1; j <= 4; j++) { k.impact(t.x + (j % 2 ? 6 : -6), t.y, { r: 12, glow: RAINBOW[j], colors: RAINBOW, delay: c.hit + j * 120 - 10 }); k.shapes(t.x, t.y, { shape: 'star', n: 4, colors: STAR, speed: 90, size: 2.4, delay: c.hit + j * 120, life: 360 }); }
      });
      add(c, 'g4Rays', { x: c.center.x, y: c.center.y, r: 120, n: 12, colors: RAINBOW, alpha: 0.35, spin: 1.4, delay: c.hit, life: 700 });
      const last = segs[segs.length - 1][4] + segs[segs.length - 1][5];
      obj(c, 'runner', { ...L, rainbow: true, cols: RAINBOW, colMs: 40, outline: '#ffffff', x0: px, y0: py, x1: px + (px < c.W / 2 ? -60 : 60), y1: py - 40, hop: 20, travel: 220, s: 10, glow: '#ffffff', delay: last, life: 230, fout: 60 });
      // コインの 雨
      for (let j = 0; j < 14; j++) {
        const x = 16 + rnd(0, c.W - 32);
        obj(c, 'coin', { x0: x, y0: -8, x1: x + rnd(-10, 10), y1: c.H - 30 + rnd(-10, 10), travel: 520, ease: 'in', s: 6.2, delay: last + 60 + j * 26, life: 540, fout: 140, seed: j });
      }
      k.flash('#fff6b0', 90, c.hit);
      k.shake(420, 2.6, c.hit);
    },
  },
  // メガキノコ: 大きな キノコ → 画面の 半分の 大きな 足の かげが ドスン ドスン → ひび・ゆれ
  ax_mega_kinoko: {
    charge: { color: '#ffa03a', color2: '#ffffff' },
    sfx: 'ax_g4_mega',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.4);
      const f = from(c, 30);
      obj(c, 'mush', { x: f.x, y: f.y, s: 17.6, pop: 220, color: '#ff8a1a', color2: '#ffe066', glow: '#ffe066', life: 340 });
      k.sparkles(f.x, f.y, { n: 10, r: 24, delay: 100, life: 280 });
      const xs = c.targets.map((t) => t.x);
      const spots = c.n === 1 ? [c.t, { x: c.t.x + 24, y: c.t.y }] : [c.targets[0], c.targets[c.n - 1]];
      spots.forEach((t, j) => {
        const at = c.hit + j * 300;
        const gy = ground(c, t, 16);
        obj(c, 'foot', { x0: t.x, y0: -60, x1: t.x, y1: gy - 12, travel: 180, ease: 'in', s: 22, color: c.masc ? '#8a3a1a' : '#ff6ab0', color2: c.masc ? '#3a5ae8' : '#ffffff', delay: at - 180, life: 360, fout: 120 });
        c.fx.crack(t.x, gy, { n: 7, len: 40, color: '#2a1a10', hi: '#ffd66b', delay: at, life: 600 });
        k.shockwave(t.x, gy, { r0: 8, r1: 90, sy: 0.3, color: '#ffe8c0', w: 3, n: 2, gap: 90, delay: at });
        k.debris(t.x, gy, { n: 12, up: 180, delay: at });
        for (let q = 0; q < 5; q++) c.fx.puff(t.x + rnd(-30, 30), gy, { color: '#c8b090', r0: 3, r1: 12, vx: rnd(-50, 50), vy: -12, life: 420, alpha: 0.5, delay: at });
      });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffd66b', colors: STAR, delay: d + c.hit, heavy: i === 0 });
        k.shapes(t.x, t.y - 10, { shape: 'star', n: per(c, 8) + solo(c, 8), colors: STAR, speed: 80, g: 80, size: 2.4, delay: d + c.hit + 300, life: 400 });
      });
      void xs;
      k.shake(420, 2.8, c.hit);
      k.shake(300, 2.4, c.hit + 300);
    },
  },
};
