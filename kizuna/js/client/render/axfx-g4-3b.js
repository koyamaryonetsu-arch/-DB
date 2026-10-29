// 第48回 G4: 3年B組の担任（人という字は・出席・チョーク・家庭訪問・体育・愛のお説教・卒業式・夕日に向かって走れ・旅立ちの日に）の 大技の え
// こわく ない、あたたかい「この、ばかちんが！」の えんしゅつ（ハートの 波・なみだ・夕日）。この ファイルは G4 だけが さわる
// 時間は shared/data/ax-time-g4.js。play の 時間は はなつ しゅんかんが 0
import { rnd } from './axkit.js?v=7c37ebe89b7f';
import { add, obj, bg, darken, ground, per, solo } from './axfx-g4-kit.js?v=7c37ebe89b7f';

const SUN = ['#ffb050', '#ffd070', '#fff2c0', '#ff8a3a'];
const KIDS = ['#2a1a2a', '#1a2030', '#2a1820', '#1a1a28'];
const from = (c, up = 16) => ({ x: c.from.x, y: c.fromAlly ? c.from.y - up : c.from.y });

export const AX_G4_3B = {
  // 人という字は: 夕日 → 2本の 光の 線が ななめに ささえあって「人」の 字 → あたたかい オレンジの 光が 味方へ
  ax_hito_to_iu_ji: {
    charge: { color: '#ffb050', color2: '#fff2c0' },
    sfx: 'ax_g4_hito',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sunset', { a: 0.6 });
      const P = { x: c.W / 2, y: 48 };
      add(c, 'g4Hito', { x: P.x, y: P.y, s: 34, glow: '#ff9a3a', color: '#fff6e0', life: c.len - 40 });
      k.sparkles(P.x, P.y, { n: 12, r: 34, colors: ['#ffffff', '#ffe0a0'], delay: 560, gap: 30, life: 360 });
      k.shockwave(P.x, P.y + 10, { r0: 8, r1: 90, color: '#ffd070', w: 3, n: 2, gap: 120, delay: 580 });
      c.each((t, i, d) => {
        k.dash(P.x, P.y + 14, t.x, t.y - 12, { color: '#ffb050', travel: 150, w: 5, delay: d + c.hit - 150, n: 3 });
        c.fx.glow(t.x, t.y - 12, { color: '#ffb050', r: 30, delay: d + c.hit, life: 460, alpha: 0.9 });
        c.fx.swirl(t.x, t.y - 4, SUN, { n: 14, rad: 16, h: 36, delay: d + c.hit, life: 520 });
        k.shapes(t.x, t.y - 10, { shape: 'heart', n: 5, colors: ['#ffb050', '#ffe0a0'], speed: 30, ang: -Math.PI / 2, spread: 0.7, g: -20, size: 2.2, delay: d + c.hit + 60, life: 480 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 34, sy: 0.4, color: '#ffd070', delay: d + c.hit });
      });
      k.flash('#fff2c0', 110, c.hit);
      k.shake(500, 3, 560);
    },
  },
  // 出席をとる: 黒い 出席簿が ひらいて、敵 1体ずつの 上に「はい！」の ふきだし → 敵の うごきが とまる（灰色の 時計）
  ax_shusseki: {
    charge: { color: '#5ac88a', color2: '#e8fff0' },
    sfx: 'ax_g4_hai',
    allyFx: 'dark',
    play(fx, c) {
      const { k } = c;
      bg(c, 'board', { a: 0.5 });
      darken(c, 0.15);
      const f = from(c, 28);
      obj(c, 'book', { x: f.x, y: f.y, s: 15, pop: 160, openAt: 120, life: c.len - 120 });
      k.sparkles(f.x, f.y, { n: 8, r: 20, delay: 200, life: 300 });
      c.each((t, i, d) => {
        add(c, 'g4Text', { x: t.x, y: t.y - 30, text: 'はい！', size: 13, bubble: '#ffffff', fill: '#2a1a10', edge: '#2a1a10', delay: d + c.hit, life: 560 });
        k.dash(f.x, f.y - 6, t.x, t.y, { color: '#e8fff0', travel: c.hit, w: 2.4, delay: d, n: 2 });
        obj(c, 'clock', { x: t.x + 14, y: t.y + 4, s: 7, pop: 160, delay: d + c.hit + 160, life: c.len - c.hit - d - 200 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 40 * c.sz, color: '#c8c8d8', w: 2.4, n: 3, gap: 110, delay: d + c.hit + 160 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#e8fff0', colors: ['#ffffff', '#c8c8d8'], delay: d + c.hit, heavy: i === 0 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#e8fff0', '#c8c8d8'], n: per(c, 20) + solo(c, 30), speed: 140, delay: d + c.hit, life: 460 });
        k.shapes(t.x, t.y - 10, { shape: 'note', n: per(c, 6) + solo(c, 6), colors: ['#ffffff', '#e8fff0'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -20, size: 2.4, delay: d + c.hit + 80, life: 520, add: false });
      });
      k.shake(560, 3, c.hit);
    },
  },
  // チョーク投げ: 白い チョークが 回転しながら まっすぐ（白い こなの すじ）→ ひたいに ピシッ・白い こなが ぱっ
  ax_chalk_nage: {
    charge: { color: '#ffffff', color2: '#e8e8f0' },
    sfx: 'ax_g4_chalk',
    allyFx: 'claw',
    play(fx, c) {
      const { k } = c;
      darken(c, 0.38);
      const f = from(c, 18);
      c.each((t, i, d) => {
        const hy = t.y - 10;
        obj(c, 'chalk', { x0: f.x, y0: f.y, x1: t.x, y1: hy, travel: c.hit, spin: 34, s: 5.5, trail: 4, glow: '#ffffff', delay: d, life: c.hit + 10, fout: 10 });
        add(c, 'g4Cleave', { x0: f.x, y0: f.y, x1: t.x, y1: hy, w: 1.6, color: '#ffffff', glow: '#e8e8f0', core: '#ffffff', edge: '#8a8aa0', grow: c.hit, delay: d, life: c.hit + 220 });
        for (let j = 0; j < 6; j++) {
          const u = j / 6;
          c.fx.puff(f.x + (t.x - f.x) * u, f.y + (hy - f.y) * u, { color: '#f0f0f8', r0: 1, r1: 4, life: 300, alpha: 0.6, delay: d + c.hit * u });
        }
        add(c, 'g4Text', { x: t.x + 14, y: hy - 14, text: 'ピシッ！', size: 13, fill: '#ffffff', edge: '#3a3a4a', delay: d + c.hit, life: 520 });
        k.impact(t.x, hy, { r: 12 * c.sz, glow: '#ffffff', colors: ['#ffffff', '#e8e8f0'], delay: d + c.hit, heavy: i === 0 });
        for (let j = 0; j < per(c, 10) + solo(c, 4); j++) c.fx.puff(t.x + rnd(-6, 6), hy + rnd(-4, 4), { color: '#f8f8ff', r0: 2, r1: rnd(6, 12), vx: rnd(-60, 60), vy: rnd(-50, 10), drag: 0.92, life: 560, alpha: 0.65, delay: d + c.hit });
        k.particles(t.x, hy, { colors: ['#ffffff', '#e8e8f0'], n: per(c, 30) + solo(c, 40), speed: 160, delay: d + c.hit, life: 480 });
        k.shapes(t.x, hy, { shape: 'star', n: per(c, 8) + solo(c, 6), colors: ['#ffffff', '#ffe066'], speed: 60, size: 2, delay: d + c.hit + 60, life: 520 });
        k.shockwave(t.x, hy, { r0: 3, r1: 36 * c.sz, color: '#ffffff', w: 2, n: 2, gap: 90, delay: d + c.hit });
      });
      k.flash('#ffffff', 80, c.hit);
      k.shake(320, 2.2, c.hit);
    },
  },
  // 家庭訪問: 家の かたちの 光・とびらが ひらいて あたたかい 光 → 回復
  ax_katei_houmon: {
    charge: { color: '#ffb050', color2: '#fff2c0' },
    sfx: 'ax_g4_pinpon',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sunset', { a: 0.7, sx: 200 });
      const H = { x: c.W / 2, y: 58 };
      obj(c, 'house', { x: H.x, y: H.y, s: 20, pop: 220, openAt: 300, glow: '#ffb050', life: c.len - 60 });
      k.sparkles(H.x - 5, H.y + 12, { n: 10, r: 14, colors: ['#ffffff', '#ffe0a0'], delay: 420, gap: 30, life: 360 });
      c.each((t, i, d) => {
        k.dash(H.x - 5, H.y + 14, t.x, t.y - 12, { color: '#ffd070', travel: 180, w: 5, delay: d + c.hit - 180, n: 3 });
        c.fx.glow(t.x, t.y - 12, { color: '#ffb050', r: 28, delay: d + c.hit, life: 460, alpha: 0.9 });
        k.shapes(t.x, t.y - 8, { shape: 'twinkle', n: 8, colors: ['#ffffff', '#ffe0a0'], speed: 30, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit, life: 420 });
        k.shapes(t.x, t.y - 10, { shape: 'heart', n: 4, colors: ['#ffb050', '#ff8ab0'], speed: 30, ang: -Math.PI / 2, spread: 0.6, g: -20, size: 2.2, delay: d + c.hit + 80, life: 420 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 32, sy: 0.4, color: '#ffd070', delay: d + c.hit });
      });
      k.flash('#fff2c0', 100, c.hit);
      k.shake(500, 3, 280);
    },
  },
  // 体育の授業: ふえの 音の わ → 敵ぜんぶが 校庭を はしらされる（土けむりの 線が 1しゅう）→ ばてて ほし
  ax_taiiku: {
    charge: { color: '#5ae07a', color2: '#ffffff' },
    sfx: 'ax_g4_whistle',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'ground', { a: 0.5 });
      darken(c, 0.1);
      const f = from(c, 24);
      for (let j = 0; j < 3; j++) k.shockwave(f.x, f.y, { r0: 4, r1: 70, color: '#ffffff', w: 2.4, delay: j * 90, life: 360 });
      add(c, 'g4Text', { x: f.x + 22, y: f.y - 18, text: 'ピーッ！', size: 10, fill: '#ffffff', edge: '#1a5a2a', life: 520 });
      c.each((t, i, d) => {
        // 土けむりが ぐるっと 1しゅう
        const N = per(c, 14, 6);
        for (let j = 0; j < N; j++) {
          const a = (j / N) * Math.PI * 2;
          c.fx.puff(t.x + Math.cos(a) * 30 * c.sz, t.y + 8 + Math.sin(a) * 10 * c.sz, { color: '#d8b880', r0: 2, r1: 8, vx: -Math.sin(a) * 30, vy: -8, life: 420, alpha: 0.6, delay: d + 260 + j * 22 });
        }
        add(c, 'g4Thread', { pts: Array.from({ length: 8 }, (_, j) => [t.x + Math.cos((j / 8) * Math.PI * 2) * 30 * c.sz, t.y + 8 + Math.sin((j / 8) * Math.PI * 2) * 10 * c.sz]), loop: true, grow: 320, sag: 0, w: 1.4, color: '#fff0d0', glow: '#d8b880', delay: d + 260, life: 520 });
        k.impact(t.x, t.y, { r: 13 * c.sz, glow: '#ffe066', colors: ['#ffffff', '#ffe066'], delay: d + c.hit, heavy: i === 0 });
        c.fx.swirl(t.x, t.y - 18, ['#ffe066', '#ffffff'], { n: per(c, 10, 4) + solo(c, 6), rad: 10, h: 6, delay: d + c.hit, life: 640, size: 2 });
        k.shapes(t.x, t.y - 18, { shape: 'star', n: per(c, 6) + solo(c, 6), colors: ['#ffe066', '#ffffff'], speed: 30, size: 2.4, delay: d + c.hit + 60, life: 600 });
        for (let j = 0; j < 3 + solo(c, 3); j++) c.fx.drop(t.x + rnd(-8, 8), t.y - 12, { color: '#9ad8ff', vx: rnd(-40, 40), vy: rnd(-80, -40), g: 260, size: 1.6, delay: d + c.hit + 100 + j * 30, life: 460 });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#d8b880'], n: per(c, 20) + solo(c, 30), speed: 140, delay: d + c.hit, life: 460 });
      });
      k.shake(560, 3, c.hit);
    },
  },
  // 愛のお説教: 夕日と 土手 → かみを かきあげる 光 →「コラ！」→ 大きな ハートの しょうげき波が 敵ぜんぶを つつむ → なみだで はんせい → 夕日の 光の よいん
  ax_ai_no_sekkyou: {
    charge: { color: '#ffb050', color2: '#fff2c0', power: 1.1 },
    sfx: 'ax_g4_kora',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sunset', { a: 0.45 });
      const f = from(c, 30);
      // かみを かきあげる（ななめの 光）
      add(c, 'g4Cleave', { x0: f.x - 26, y0: f.y + 6, x1: f.x + 18, y1: f.y - 30, w: 2.4, color: '#fff2c0', glow: '#ffb050', core: '#ffffff', edge: false, grow: 160, life: 360 });
      for (let j = 0; j < 3; j++) add(c, 'g4Cleave', { x0: f.x - 30 + j * 6, y0: f.y + 2 + j * 3, x1: f.x + 12 + j * 6, y1: f.y - 26 + j * 3, w: 0.8, color: '#ffe0a0', glow: '#ff9a3a', core: '#ffffff', edge: false, grow: 160, delay: 30 + j * 30, life: 300 });
      add(c, 'g4Text', { x: c.W / 2, y: 40, text: 'この、ばかちんが！', size: 16, fill: '#ffffff', edge: '#a03a1a', delay: 240, life: 560 });
      k.speedLines(c.W / 2, 40, { delay: 240, life: 300, r0: 30, r1: 150, color: '#fff2c0' });
      k.shake(200, 2.4, 260);
      const o = { x: c.fromAlly ? c.center.x : c.from.x, y: c.fromAlly ? c.H - 6 : c.from.y };
      for (let j = 0; j < 3; j++) add(c, 'g4HeartWave', { x: o.x, y: o.y - 10, r0: 6, r1: 120 + j * 20, w: 4 - j, color: '#ffe0ec', glow: '#ff6a9a', fill: j === 0 ? '#ff8ab0' : null, delay: c.hit - 200 + j * 110, life: 560 });
      c.each((t, i, d) => {
        add(c, 'g4HeartWave', { x: t.x, y: t.y, r0: 4, r1: 30 * c.sz, w: 2.6, color: '#ffffff', glow: '#ff8ab0', fill: '#ffb0cc', delay: d + c.hit, life: 520 });
        k.impact(t.x, t.y, { r: 15 * c.sz, glow: '#ffb0cc', colors: ['#ffffff', '#ffb0cc', '#ffd070'], delay: d + c.hit, heavy: i === 0 });
        // なみだ（はんせい）
        for (let j = 0; j < 4 + solo(c, 4); j++) c.fx.drop(t.x + (j % 2 ? 6 : -6), t.y - 6, { color: '#7ac8ff', vx: (j % 2 ? 1 : -1) * rnd(14, 34), vy: rnd(-40, -10), g: 200, size: 2.6, delay: d + c.hit + 200 + j * 60, life: 560 });
        k.shapes(t.x, t.y - 4, { shape: 'petal', n: per(c, 4) + solo(c, 4), colors: ['#9ad8ff', '#e0f4ff'], speed: 20, ang: Math.PI / 2, spread: 0.6, g: 120, size: 2.4, delay: d + c.hit + 240, life: 520, add: false });
        c.fx.arrows(t.x, t.y - 4, '#9ad8ff', false, 2, d + c.hit + 360);
        k.shapes(t.x, t.y - 12, { shape: 'heart', n: per(c, 8) + solo(c, 8), colors: ['#ff8ab0', '#ffd0e0', '#ffffff'], speed: 50, g: -20, size: 2.4, delay: d + c.hit + 120, life: 700, add: false });
        k.particles(t.x, t.y, { colors: ['#ffffff', '#ffb0cc', '#ffd070'], n: per(c, 20) + solo(c, 30), speed: 160, delay: d + c.hit, life: 520 });
      });
      add(c, 'g4Rays', { x: c.W / 2, y: 92, r: 170, n: 14, colors: SUN, alpha: 0.28, spin: 0.3, delay: c.hit + 300, life: c.len - c.hit - 320 });
      k.sparkles(c.center.x, c.center.y, { n: 14, r: 70, colors: ['#ffffff', '#ffe0a0'], delay: c.hit + 500, gap: 40, life: 420 });
      k.flash('#fff2c0', 160, c.hit);
      k.shake(560, 3.2, c.hit);
    },
  },
  // なみだの卒業式: さくらの 花びら・卒業証書の つつ・なみだの しずく → 回復
  ax_namida_sotsugyou: {
    charge: { color: '#ffb0cc', color2: '#ffffff' },
    sfx: 'ax_g4_sakura',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sakura', { a: 0.35 });
      darken(c, 0.15, { color: '#3a0a20' });
      k.petals(c.W / 2, -6, { n: 30, colors: ['#ff7aa8', '#ffb0cc', '#ffffff'], spread: 130, rise: -20, life: c.len - 160 });
      obj(c, 'tube', { x0: c.W / 2 - 40, y0: 40, x1: c.W / 2 + 40, y1: 36, hop: 10, travel: c.len - 200, spin: 1.2, s: 12, glow: '#ffd23a', pop: 200, life: c.len - 160 });
      c.each((t, i, d) => {
        c.fx.glow(t.x, t.y - 12, { color: '#ffb0cc', r: 28, delay: d + c.hit, life: 460, alpha: 0.9 });
        k.shapes(t.x, t.y - 10, { shape: 'twinkle', n: 6, colors: ['#ffffff', '#ffd0e0'], speed: 26, ang: -Math.PI / 2, spread: 0.8, g: -30, size: 3, delay: d + c.hit, life: 420 });
        for (let j = 0; j < 3; j++) c.fx.drop(t.x + rnd(-6, 6), t.y - 20, { color: '#9ad8ff', vx: rnd(-10, 10), vy: rnd(-20, 0), g: 160, size: 1.5, delay: d + c.hit + j * 90, life: 440 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 32, sy: 0.4, color: '#ffd0e0', delay: d + c.hit });
      });
      k.flash('#fff0f4', 100, c.hit);
      k.shake(500, 3, c.hit - 100);
    },
  },
  // 夕日に向かって走れ: 夕日 → 生徒の かげ 4人が 夕日に むかって はしり、そのまま 敵ぜんぶを はねとばす → オレンジの 光
  ax_yuuhi_hashire: {
    charge: { color: '#ff9a3a', color2: '#fff2c0' },
    sfx: 'ax_g4_run',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'sunset', { a: 0.48 });
      darken(c, 0.1);
      const m = c.center;
      for (let j = 0; j < 4; j++) {
        const sx = 30 + j * 60, sy = c.fromAlly ? c.H + 10 : -10;
        const ex = m.x + (j - 1.5) * 26, ey = m.y + 6;
        obj(c, 'runner', { color: KIDS[j], hair: j % 2 === 1, x0: sx, y0: sy, x1: ex, y1: ey, travel: c.hit, s: 7 + (j % 2), glow: '#ff9a3a', delay: j * 30, life: c.hit + 140, fout: 140 });
        for (let q = 0; q < 5; q++) {
          const u = q / 5;
          c.fx.puff(sx + (ex - sx) * u, sy + (ey - sy) * u + 6, { color: '#d8a070', r0: 2, r1: 7, vy: -6, life: 360, alpha: 0.5, delay: j * 30 + c.hit * u });
        }
      }
      k.streaks({ ang: Math.atan2(m.y - c.H, 0), color: '#ffd070', n: 18, life: c.hit, alpha: 0.4, speed: 1.6 });
      c.each((t, i, d) => {
        k.impact(t.x, t.y, { r: 16 * c.sz, glow: '#ffb050', colors: SUN, delay: d + c.hit, heavy: i === 0 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 56 * c.sz, color: '#ffd070', w: 2.6, n: 2, gap: 110, delay: d + c.hit });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: per(c, 10) + solo(c, 8), colors: ['#ffe066', '#ffffff', '#ffb050'], speed: 110, g: 90, size: 2.4, delay: d + c.hit, life: 560 });
        k.debris(t.x, ground(c, t, 16), { n: per(c, 10) + solo(c, 6), up: 150, delay: d + c.hit });
        k.particles(t.x, t.y, { colors: SUN, n: per(c, 22) + solo(c, 30), speed: 200, delay: d + c.hit, life: 520 });
      });
      add(c, 'g4Rays', { x: c.W / 2, y: 92, r: 170, n: 14, colors: SUN, alpha: 0.45, spin: 0.3, delay: c.hit, life: c.len - c.hit - 40 });
      k.flash('#ffd070', 160, c.hit);
      k.shake(600, 3.4, c.hit);
    },
  },
  // 旅立ちの日に（合体技）: さくらの 花びら・音ぷ・黒板の 光 → 味方の 回復
  ax_tabidachi: {
    sfx: 'ax_g4_tabidachi',
    allyFx: 'heal',
    play(fx, c) {
      const { k } = c;
      bg(c, 'board', { a: 0.45 });
      k.petals(c.W / 2, -6, { n: 24, spread: 130, rise: -20, life: c.len - 200 });
      k.shapes(c.W / 2, 60, { shape: 'note', n: 14, colors: ['#ffffff', '#ffd0e0', '#fff2c0'], speed: 40, ang: -Math.PI / 2, spread: 1.4, g: -20, size: 2.8, life: c.len - 300, r: 60, add: false });
      add(c, 'g4Rays', { x: c.W / 2, y: 30, r: 160, n: 12, color: '#fff2c0', alpha: 0.3, life: c.len - 100 });
      c.each((t, i, d) => {
        k.dash(c.W / 2, 50, t.x, t.y - 12, { color: '#ffd0e0', travel: 200, w: 4, delay: d + c.hit - 200 });
        c.fx.glow(t.x, t.y - 12, { color: '#ffb0cc', r: 28, delay: d + c.hit, life: 460, alpha: 0.9 });
        c.fx.swirl(t.x, t.y - 4, ['#ffd0e0', '#ffffff', '#fff2c0'], { n: 12, rad: 14, h: 34, delay: d + c.hit, life: 520 });
        k.shockwave(t.x, t.y, { r0: 4, r1: 32, sy: 0.4, color: '#ffd0e0', delay: d + c.hit });
      });
      k.flash('#fff0f4', 100, c.hit);
    },
  },
};
void [obj, ground];
