// 第51回 C3（o9）: 夢のスタジアム鉄道 の え（8技）。c の 時間は はなつ しゅんかんが 0
// ・電車は axfx-o4 の o4Car（よこ向きの 赤い 電車）、ボール・バット・信号・メガホンは o4Obj を かりる
// ・観客（o9Crowd の 頭の ならび・ウェーブ）と 球場まるごと（o9Stadium）は axfx-o9-kit.js
// ・観客が ふえる 技は スタンドが にぎやかに、看板の 技は 球場ごと 電車が つっこむ
import { obj as o4, car, txt, line, bg, boom, blessing, arrows, N, org } from './axfx-o4-kit.js';
import { obj as o5 } from './axfx-o5-kit.js';
import { crowd, stadium, party } from './axfx-o9-kit.js';

const RED = ['#ffffff', '#ffd23a', '#ff4a3a', '#c8141e'];
const BALL = ['#ffffff', '#fff6b0', '#ffd23a'];
const GREEN = ['#ffffff', '#c8ffe0', '#7dffb0'];
const top = (c, t, dy = 40) => Math.max(12, t.y - dy);
// 電車が 画面の はしから はしへ（y … 線路の 高さ、dir … 1 右へ）
function train(c, y, o = {}) {
  const dir = o.dir ?? 1, cars = o.cars ?? 3;
  const x0 = dir > 0 ? -16 : c.W + 16, x1 = dir > 0 ? c.W + 130 : -130;
  car(c, 'train', { keys: [[0, x0, y, o.s ?? 1], [o.travel ?? 640, x1, y, o.s ?? 1]], ease: 'lin', dir, cars, body: o.color || '#d8202c', stripe: '#ffffff', streak: '#ffffff', delay: o.delay || 0, life: (o.travel ?? 640) + 40, s: o.s ?? 1, beamCol: '#fff6c8' });
  line(c, [[0, y + 7 * (o.s ?? 1)], [c.W, y + 7 * (o.s ?? 1)]], { color: '#c8c8d8', glow: '#8a8aa8', w: 1.2, travel: 120, delay: (o.delay || 0) - 80, life: (o.travel ?? 640) + 120 });
}
// 球の すじ（x0,y0 → x1,y1。速い 白い 線 と ボール）
function pitch(c, x0, y0, x1, y1, d, travel, o = {}) {
  o4(c, 'ball', { keys: [[0, x0, y0, 0.6], [travel, x1, y1, 1.1, 8]], ease: o.ease || 'in', size: (o.size || 5) * c.sz, glow: '#ffffff', delay: d, life: travel + 60 });
  line(c, [[x0, y0], [x1, y1]], { color: '#ffffff', glow: o.glow || '#ffd23a', w: 2.4, travel, delay: d, life: travel + 160 });
}

export const AX_O9_STADIUM = {
  // 満員の観客電車: 夜の 球場の 空 → 窓まで 観客で いっぱいの 赤い 電車が 敵の 前を かけぬける →「ワー!!」
  ox_o9_kankyaku_densha: {
    charge: { color: '#ff4a3a', color2: '#ffffff' },
    sfx: 'ax_o9_densha',
    allyFx: 'quake',
    rich: RED,
    play(fx, c) {
      const { k } = c;
      bg(c, 'stadium', { a: 0.28, life: 560 });
      const ty = Math.min(c.H - 14, c.center.y + 10);
      train(c, ty, { cars: 4, travel: c.hit + 260, delay: 0, s: 1.15 });
      crowd(c, { x0: 20, x1: c.W - 20, y: 12, n: 18, rows: 2, life: c.len - 200 });
      txt(c, 'ワー!!', c.W / 2, 34, { size: 14, color: '#ffe040', ink: '#8a1a1a', delay: 120, life: 520 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 17, heavy: i === 0, colors: RED, n: 14, color: '#ffe8a0', edge: '#d8202c', amp: 2.6, shake: 420 });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: N(c, 8), colors: ['#ffe060', '#ffffff', '#ff6a6a'], speed: 90, size: 2, delay: c.hit + d + 40, life: 520 });
      });
      txt(c, 'ガタンゴトン', c.center.x, Math.max(14, ty - 30), { size: 11, color: '#ffffff', ink: '#8a1a1a', delay: 40, life: c.hit, pop: false });
    },
  },
  // 大観衆のエール: スタンドの 頭が 2れつ・メガホン → 「カットバセー!」の 大合唱 → 家族に 力の 矢印
  ox_o9_daikanshuu_yell: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_yell',
    allyFx: 'wind',
    rich: BALL,
    play(fx, c) {
      const yTop = c.dir === 'down' ? 14 : 14;
      crowd(c, { x0: 14, x1: c.W - 14, y: yTop, n: 22, rows: 3, life: c.len - 160 });
      for (const sx of [40, c.W - 40]) o4(c, 'megaphone', { keys: [[0, sx, 52, 0.4], [160, sx, 52, 1.1, sx < 128 ? -0.3 : 0.3]], size: 9, flip: sx > 128, delay: 60, life: c.len - 300 });
      txt(c, 'カットバセー!', c.W / 2, 50, { size: 14, color: '#ffe040', ink: '#8a1a1a', delay: 140, life: 600 });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, BALL, 9);
        arrows(c, t, c.hit + d + 60, ['#ff4a4a', '#3ad860']);
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 30, sy: 0.35, color: '#ffd23a', w: 2, delay: c.hit + d, life: 420 });
      });
    },
  },
  // 快速ストレート: 白い 線を ひいて ボールが うなる →「ズバーン!」→ スピードガンの 数
  ox_o9_kaisoku_straight: {
    charge: { color: '#ffffff', color2: '#ffd23a' },
    sfx: 'ax_o9_straight',
    allyFx: 'claw',
    rich: BALL,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      c.each((t, i, d) => {
        pitch(c, o.x, o.y - 18, t.x, t.y, d, c.hit, { size: 5 });
        k.speedLines(t.x, t.y, { color: '#ffffff', n: N(c, 18), r0: 20, r1: 100, delay: c.hit + d - 40, life: 260 });
        boom(c, t, c.hit + d, { i, r: 18, heavy: i === 0, colors: BALL, n: 16, color: '#ffffff', edge: '#ffb020', amp: 2.8, shake: 420 });
        if (i < 3) txt(c, 'ズバーン!', t.x, top(c, t, 30), { size: 14, color: '#ffffff', ink: '#c81a2a', delay: c.hit + d, life: 480 });
      });
      txt(c, '200km/h', c.W - 44, 18, { size: 12, color: '#7dffb0', ink: '#0a2a1a', delay: c.hit + 120, life: 700, pop: false });
      k.flash('#ffffff', 80, c.hit);
    },
  },
  // スタンドのウェーブ: 観客の 頭の 波が 左から 右へ 1しゅう → 家族に 緑の 光
  ox_o9_stand_wave: {
    charge: { color: '#7dffb0', color2: '#ffffff' },
    sfx: 'ax_o9_wave',
    allyFx: 'heal',
    rich: GREEN,
    play(fx, c) {
      crowd(c, { x0: 10, x1: c.W - 10, y: 16, n: 24, rows: 3, wave: 520, life: c.len - 120 });
      txt(c, 'ウェーブ!', c.W / 2, 50, { size: 13, color: '#ffffff', ink: '#1a5a3a', delay: 200, life: 560 });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, GREEN, 10);
        c.k.shockwave(t.x, t.y, { r0: 4, r1: 32, sy: 0.35, color: '#7dffb0', w: 2, delay: c.hit + d, life: 420, n: 2, gap: 140 });
      });
    },
  },
  // スタジアム直通特急: 信号が 青 → 赤い 特急が 2回 かけぬけて（行きと 帰り）、敵に つぎつぎ ぶつかる
  ox_o9_chokutsu_tokkyu: {
    charge: { color: '#ff4a3a', color2: '#ffffff' },
    sfx: 'ax_o9_tokkyu',
    allyFx: 'quake',
    rich: RED,
    play(fx, c) {
      const { k } = c;
      bg(c, 'stadium', { a: 0.26, life: 580 });
      o4(c, 'signal', { keys: [[0, 16, 40, 0.4], [140, 16, 40, 1]], size: 10, swap: 160, delay: 0, life: 700 });
      const ty = Math.min(c.H - 14, c.center.y + 8);
      train(c, ty, { cars: 5, travel: c.hit + 200, delay: 0 });
      train(c, ty - 16, { cars: 5, travel: 640, delay: c.hit + 260, dir: -1 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 16, heavy: i === 0, colors: RED, n: 12, color: '#ffe8a0', edge: '#d8202c', amp: 2.4, shake: 380 });
        boom(c, t, c.hit + d + 520, { i: 1, r: 13, colors: RED, n: 8, color: '#ffe8a0', edge: '#d8202c', ring: false });
      });
      txt(c, 'ファーン!', 36, 22, { size: 12, color: '#ffffff', ink: '#8a1a1a', delay: 40, life: 460 });
    },
  },
  // 通過列車と消える魔球: 電車が 自分と 敵の あいだを とおる → ボールが かげに きえて「?」→ 敵の 前に 出てくる
  ox_o9_tsuuka_makyu: {
    charge: { color: '#ffffff', color2: '#ffd23a' },
    sfx: 'ax_o9_makyu',
    allyFx: 'claw',
    rich: BALL,
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const ty = c.dir === 'down' ? Math.min(c.H - 40, c.center.y - 30) : Math.min(c.H - 36, c.center.y + 30);
      train(c, ty, { cars: 4, travel: 620, delay: 40 });
      c.each((t, i, d) => {
        const mx = (o.x + t.x) / 2, my = ty;
        o4(c, 'ball', { keys: [[0, o.x, o.y - 18, 0.6], [200, mx, my, 1, 6]], ease: 'out', size: 5 * c.sz, glow: '#ffffff', delay: d, life: 220 });
        if (i < 3) txt(c, '?', mx, Math.max(12, my - 22), { size: 16, color: '#ffe040', ink: '#1a1a3a', delay: 260 + d, life: 300 });
        o4(c, 'ball', { keys: [[0, t.x, t.y - 26, 0.3], [c.hit - 520, t.x, t.y, 1.2, 8]], ease: 'in', size: 5 * c.sz, glow: '#fff6b0', delay: 520 + d, life: c.hit - 500 });
        boom(c, t, c.hit + d, { i, r: 17, heavy: i === 0, colors: BALL, n: 14, color: '#ffffff', edge: '#ffb020', amp: 2.6, shake: 400 });
        k.shapes(t.x, t.y, { shape: 'star', n: N(c, 10), colors: ['#ffe060', '#ffffff'], speed: 100, size: 2.2, delay: c.hit + d + 30, life: 520 });
      });
      txt(c, 'キエタ!?', c.center.x, Math.max(14, c.center.y - 48), { size: 12, color: '#ffffff', ink: '#1a1a3a', delay: 300, life: 420 });
    },
  },
  // ラッキーセブン: 7色の 風船が いっせいに 空へ・大きな「7」→ 家族に 緑の 光と はやい 矢印
  ox_o9_lucky_seven: {
    charge: { color: '#ffd23a', color2: '#ffffff' },
    sfx: 'ax_o9_lucky7',
    allyFx: 'wind',
    rich: GREEN,
    play(fx, c) {
      const cols = ['#ff4a4a', '#ff9a2a', '#ffe040', '#5ad84a', '#3aa8ff', '#3a5ad8', '#a85ad8'];
      for (let j = 0; j < 14; j++) {
        const x = 14 + j * ((c.W - 28) / 13);
        o5(c, 'balloon', { x0: x, y0: c.H + 10, x1: x + (j % 2 ? 10 : -10), y1: -16, travel: c.len - 200, ease: 'out', s: 6, wob: 0.2, color: cols[j % 7], delay: j * 30, life: c.len - 160 });
      }
      txt(c, '7', c.W / 2, 44, { size: 34, color: '#ffe040', ink: '#c81a2a', delay: 120, life: 680 });
      txt(c, 'ラッキーセブン!', c.W / 2, 70, { size: 12, color: '#ffffff', ink: '#c81a2a', delay: 220, life: 600, pop: false });
      c.each((t, i, d) => {
        blessing(c, t, c.hit + d, GREEN, 9);
        arrows(c, t, c.hit + d + 60, ['#3ad860']);
      });
    },
  },
  // 満員御礼スタジアム特急（看板）: 夜の 球場の 空 → 左から 球場まるごと（スタンド・観客・ライト）と 電車が いっしょに つっこむ → 大しょうげき → 花火
  ox_o9_manin_onrei: {
    charge: { color: '#ff4a3a', color2: '#ffd23a' },
    sfx: 'ax_o9_onrei',
    allyFx: 'quake',
    rich: RED,
    play(fx, c) {
      const { k } = c;
      bg(c, 'stadium', { a: 0.32, life: 600 });
      const cy = Math.max(30, Math.min(c.H - 30, c.center.y - 4));
      stadium(c, { keys: [[0, -110, cy, 0.7, 0, 1], [c.hit, c.center.x, cy, 1, 0, 1], [c.hit + 220, c.center.x, cy, 1.05, 0, 0.45]], ease: 'in', w: 210, h: 70, cheer: 1.5, life: c.hit + 560 });
      car(c, 'train', { keys: [[0, -120, cy + 26, 1.2], [c.hit, c.center.x + 40, cy + 26, 1.2]], ease: 'in', dir: 1, cars: 4, body: '#d8202c', stripe: '#ffffff', streak: '#ffffff', life: c.hit + 120, s: 1.2 });
      txt(c, 'マンインオンレイ!!', c.W / 2, 16, { size: 15, color: '#ffe040', ink: '#8a1a1a', delay: 160, life: c.hit - 100 });
      k.speedLines(c.center.x, cy, { color: '#ffe8a0', n: 26, r0: 30, r1: 170, delay: c.hit - 160, life: 320 });
      c.each((t, i, d) => {
        boom(c, t, c.hit + d, { i, r: 22, heavy: i === 0, colors: RED, n: 16, color: '#ffe8a0', edge: '#d8202c', amp: 3.2, shake: 520 });
        k.shockwave(t.x, t.y, { r0: 6, r1: 70 * c.sz, color: '#ffd23a', w: 3, delay: c.hit + d + 40, n: 2, gap: 120 });
      });
      // 花火
      for (let j = 0; j < 3; j++) {
        const fx0 = 50 + j * 78, fy = 22 + (j % 2) * 12;
        k.shapes(fx0, fy, { shape: 'star', n: c.all ? 6 : 12, colors: [['#ff6a6a', '#ffe060', '#ffffff'], ['#6ac8ff', '#ffffff', '#ffe060'], ['#7dffb0', '#ffffff', '#ff9ad8']][j], speed: 90, size: 2, delay: c.hit + 420 + j * 120, life: 520 });
        fx.glow(fx0, fy, { color: '#ffffff', r: 16, delay: c.hit + 420 + j * 120, life: 240, alpha: 0.8 });
      }
      k.flash('#fff6c8', 140, c.hit);
      if (party(c).length) txt(c, 'バンザーイ!', c.W / 2, c.H - 46, { size: 12, color: '#ffffff', ink: '#8a1a1a', delay: c.hit + 700, life: 520, pop: false });
    },
  },
};
