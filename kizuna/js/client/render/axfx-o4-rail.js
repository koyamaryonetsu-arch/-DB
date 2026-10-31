// 第49回 O4: 鉄道員・運転士 の 技の え（電車・信号・指さし・警笛・メーター）
// ・時間は shared/data/ax-time-o4.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { obj, car, rings, txt, line, bg, pow, boom, blessing, arrows, N, org, ground, rnd } from './axfx-o4-kit.js?v=7040d8c7ec18';

const PI = Math.PI;
const SPARK = ['#ffffff', '#fff6b0', '#ffd23a'];
const CYAN = ['#ffffff', '#bfeaff', '#5ac8ff'];

// 電車が 左から 的を じゅんに つきぬける。へんじ: x に いる 時間（ms）
function pass(c, o = {}) {
  const xs = c.targets.map((t) => t.x);
  const x0 = Math.min(...xs), xN = Math.max(...xs);
  const spread = c.all ? Math.min(300, c.stagger * (c.n - 1)) : 0;
  const y = o.y ?? c.targets.reduce((s, t) => s + t.y, 0) / c.n + 4;
  const at = (x) => c.hit + (xN > x0 ? ((x - x0) / (xN - x0)) * spread : 0);
  const stop = o.stop;
  const keys = stop
    ? [[0, Math.max(-120, x0 - (o.lead || 150)), y], [c.hit, x0 - 4, y], [c.hit + 140, x0 + 6, y]]
    : [[0, Math.max(-125, x0 - (o.lead || 150)), y], [c.hit, x0, y], [c.hit + spread, xN, y], [c.hit + spread + (o.exit || 240), c.W + 96, y]];
  car(c, 'train', { keys, ease: 'lin', life: o.life || c.len - 40, s: o.s || 1, cars: o.cars || 2, body: o.body, stripe: o.stripe, stripe2: o.stripe2, nose: o.nose, win: o.win, tail: o.tail, pan: o.pan, streak: o.streak, beamCol: o.beamCol, delay: o.delay || 0, fout: o.fout });
  return { at, y, x0, xN, spread };
}
// すぐ 次の 番（つかった 人に 青い 時計の 輪）
function quick(c, delay) {
  const o = org(c);
  obj(c, 'gaugering', { x: o.x, y: o.y - 14, size: 7, t0: 0, sweep: 240, delay, life: 420, glow: '#5ab8ff' });
  c.fx.glow(o.x, o.y - 10, { color: '#5ab8ff', r: 16, delay, life: 300, alpha: 0.8 });
}
// 線路の 火花（y の 高さで よこに）
function railSparks(c, x0, x1, y, delay, n = 10) {
  for (let i = 0; i < n; i++) c.fx.sparks(c.lerp(x0, x1, i / Math.max(1, n - 1)), y + 6, { colors: SPARK, n: 3, speed: 90, ang: -PI * 0.75, spread: 0.5, delay: delay + i * 18, life: 260 });
}

export const AX_O4_RAIL = {
  // 指さし確認: 白い 手ぶくろが ピシッ → 指先に 緑の 光 → ✓ → 赤い 力の 光
  ox_yubisashi: {
    sfx: 'ax_o4_yoshi',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const hx = t.x - 4, hy = t.y - 26;
      obj(c, 'glove', { keys: [[0, hx - 18, hy + 12, 0.4, -0.5], [120, hx, hy, 1.15, -0.55], [c.len - 80, hx, hy - 3, 1.1, -0.55]], size: 11, life: c.len - 40 });
      const fx0 = hx + Math.cos(-0.55) * 12, fy0 = hy + Math.sin(-0.55) * 12;
      fx.glow(fx0, fy0, { color: '#5affb0', r: 14, delay: 120, life: 300, alpha: 0.9 });
      fx.sparks(fx0, fy0, { colors: ['#ffffff', '#5affb0'], n: 12, speed: 120, delay: 130, life: 320 });
      k.shockwave(fx0, fy0, { r0: 3, r1: 24, color: '#5affb0', w: 2, delay: 130 });
      obj(c, 'check', { keys: [[0, t.x + 16, t.y - 30, 0.3], [120, t.x + 16, t.y - 34, 1.2], [220, t.x + 16, t.y - 34, 1]], size: 7, delay: c.hit - 120, life: 420 });
      txt(c, 'ヨシ！', t.x - 16, t.y - 44, { size: 12, color: '#ffffff', ink: '#1a6a3a', delay: c.hit - 100, life: 420 });
      fx.glow(t.x, t.y - 6, { color: '#ff5a4a', r: 26, delay: c.hit, life: 360, alpha: 0.7 });
      k.particles(t.x, t.y, { colors: ['#ff5a4a', '#ffd23a', '#ffffff'], n: 16, speed: 70, ang: -PI / 2, spread: 0.8, g: -60, delay: c.hit, life: 380 });
      arrows(c, t, c.hit + 40, ['#ff4a4a']);
    },
  },
  // 出発進行: 信号が 赤 → 青、発車ベルの 輪、味方に 緑の 矢印と 線路の すじ
  ox_shuppatsu_shinkou: {
    charge: { color: '#5affb0', color2: '#ffffff' },
    sfx: 'ax_o4_bell',
    play(fx, c) {
      const { k } = c;
      const sx = 26, sy = 44;
      obj(c, 'signal', { keys: [[0, sx, sy + 8, 0.6], [120, sx, sy, 1.15]], size: 13, swap: 140, life: c.len - 40 });
      rings(c, sx, sy - 10, { ang: 0, span: 0.7, n: 3, gap: 80, r0: 8, r1: 70, color: '#fff6b0', life: 520 });
      fx.sparks(sx, sy - 12, { colors: ['#5affb0', '#ffffff'], n: 10, speed: 100, delay: 140, life: 300 });
      c.each((t, i, d) => {
        const g = ground(c, t, 6);
        line(c, [[t.x - 26, g], [t.x + 26, g]], { color: '#ffffff', glow: '#5affb0', w: 1.2, travel: 140, delay: c.hit - 60 + i * 40, life: 360 });
        line(c, [[t.x - 26, g - 5], [t.x + 26, g - 5]], { color: '#ffffff', glow: '#5affb0', w: 1.2, travel: 140, delay: c.hit - 40 + i * 40, life: 340 });
        arrows(c, t, c.hit + i * 40, ['#3ad87a']);
        blessing(c, t, c.hit + i * 40, ['#7dffb0', '#ffffff'], 5);
      });
    },
  },
  // 車内アナウンス: マイクの 光から 音の 輪 → 味方の うずまき・Zz が ぽんっと 消える → きらきら
  ox_shanai_announce: {
    sfx: 'ax_o4_announce',
    play(fx, c) {
      const { k } = c;
      const mx = c.W / 2, my = 40;
      obj(c, 'mic', { keys: [[0, mx, my + 10, 0.5], [140, mx, my, 1.2]], size: 11, life: c.len - 40, glow: '#fff6c8' });
      rings(c, mx, my - 6, { ang: PI / 2, span: 1.2, n: 4, gap: 70, r0: 6, r1: 60, color: '#ffffff', edge: '#3a5ab8', life: 560 });
      c.each((t, i, d) => {
        const dl = c.hit - 140 + i * 30;
        txt(c, i % 2 ? 'Zz' : '@', t.x + 10, t.y - 24, { size: 10, color: i % 2 ? '#bfe6ff' : '#ffd8ff', ink: '#3a3a6a', delay: dl - 60, life: 200, pop: false });
        pow(c, t.x + 10, t.y - 24, { r: 9, delay: dl + 140, color: '#ffffff', edge: '#9ad8ff', life: 200 });
        k.sparkles(t.x, t.y - 14, { n: 5, r: 16, colors: ['#ffffff', '#fff6b0'], delay: c.hit + i * 30 });
        fx.glow(t.x, t.y - 8, { color: '#ffffff', r: 20, delay: c.hit + i * 30, life: 300, alpha: 0.6 });
        k.particles(t.x, t.y - 4, { colors: ['#ffffff', '#fff6b0', '#bfe6ff'], n: c.n > 2 ? 4 : 10, speed: 60, ang: -PI / 2, spread: 0.9, g: -40, delay: c.hit + i * 30, life: 420 });
      });
      k.particles(mx, my - 10, { colors: ['#ffffff', '#fff6c8'], n: 8, speed: 80, delay: 60, life: 320 });
    },
  },
  // 非常ブレーキ: キキーッ！ 白い 火花が 線路に 長く → 敵が つんのめる → 青い 時計の 輪（ゲージ↓）
  ox_hijou_brake: {
    sfx: 'ax_o4_brake',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = c.targets.reduce((s, t) => s + t.y, 0) / c.n + 8;
      const xs = c.targets.map((t) => t.x);
      const x0 = Math.min(...xs) - 30;
      car(c, 'train', { keys: [[0, -60, y], [c.hit, x0, y], [c.hit + 200, x0 + 4, y]], ease: 'out', life: c.len - 40, cars: 2, body: '#f0f0e8', stripe: '#3aa84a', beamCol: '#ffffff' });
      railSparks(c, -40, x0, y, 40, c.all ? 6 : 9);
      txt(c, 'キキーッ！', x0 - 30, y - 22, { size: 12, color: '#ffffff', ink: '#c82a2a', delay: 60, life: c.hit + 200, rot: -0.08 });
      c.each((t, i, d) => {
        line(c, [[t.x - 20, t.y - 6], [t.x + 14, t.y - 6]], { color: '#ffffff', glow: '#9ad8ff', w: 1.5, travel: 90, delay: c.hit + d, life: 220 });
        boom(c, t, c.hit + d, { i, r: 11, colors: ['#ffffff', '#bfe6ff', '#ffd23a'], n: 10 });
        obj(c, 'gaugering', { x: t.x + 14, y: t.y - 22, size: 8, drain: true, t0: 0, sweep: 300, delay: c.hit + d + 60, life: 420 });
      });
      k.debris(x0, y + 8, { n: c.all ? 3 : 6, delay: c.hit - 40, up: 70, colors: ['#ffffff', '#c8d0dc', '#ffd23a'], size: 1.2 });
      k.shake(220, 1.4, c.hit);
    },
  },
  // 定刻運転: 駅の 時計が ぴったり → 小さな 電車が 正確に 一撃 → 時計の 針が カチッ
  ox_teikoku_unten: {
    charge: { color: '#ffffff', color2: '#bfeaff' },
    sfx: 'ax_o4_teikoku',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const cx = c.fromAlly ? t.x + 40 : t.x - 40, cy = c.fromAlly ? t.y - 34 : t.y - 30;
      obj(c, 'clock', { keys: [[0, cx, cy, 0.5], [120, cx, cy, 1.1]], size: 11, stop: c.hit - 40, life: c.len - 40 });
      fx.glow(cx, cy, { color: '#ffffff', r: 18, delay: c.hit - 40, life: 220, alpha: 0.9 });
      txt(c, 'カチッ', cx, cy - 18, { size: 9, delay: c.hit - 40, life: 300, color: '#ffe040' });
      pass(c, { cars: 1, body: '#ff8a1a', stripe: '#ffffff', stop: true, lead: 120, s: 0.95 });
      boom(c, t, c.hit, { r: 13, heavy: true, colors: ['#ffffff', '#ffd23a', '#ff8a1a'], n: 16 });
      k.debris(t.x, t.y + 6, { n: 6, delay: c.hit, up: 90 });
      quick(c, c.hit + 120);
    },
  },
  // 回送電車: 灰色の 電車が 来て 敵が 光に なって すいこまれる → 電車が 画面の 外へ
  ox_kaisou_densha: {
    sfx: 'ax_o4_kaisou',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const y = t.y + 6;
      car(c, 'train', { keys: [[0, -80, y], [c.hit - 60, t.x + 22, y], [c.hit + 220, t.x + 24, y], [c.len - 40, c.W + 96, y]], ease: 'io', life: c.len - 20, cars: 2, body: '#b8bcc4', stripe: '#6a7080', win: '#4a5060', streak: '#ffffff' });
      fx.glow(t.x, t.y, { color: '#ffffff', r: 30, delay: c.hit, life: 320, alpha: 0.9 });
      k.gather(t.x + 10, t.y + 2, { colors: ['#ffffff', '#bfe6ff'], n: 16, r: 34, delay: c.hit - 40, waves: 2, gap: 90 });
      k.particles(t.x, t.y, { colors: ['#ffffff', '#c8d0dc', '#bfe6ff'], n: 16, speed: 60, ang: 0, spread: 0.6, g: 0, delay: c.hit + 40, life: 300 });
      txt(c, 'プシュー', t.x + 6, t.y - 28, { size: 10, color: '#ffffff', ink: '#5a6478', delay: c.hit + 80, life: 320 });
      line(c, [[t.x - 30, y + 12], [c.W, y + 12]], { color: '#ffffff', glow: '#c8d0dc', w: 1, delay: c.hit + 260, travel: 160, life: 260 });
      pow(c, t.x, t.y, { r: 12, delay: c.hit, color: '#ffffff', edge: '#7a8494', life: 240 });
    },
  },
  // 新幹線アタック: 白と 青の 長い 新幹線が 左から ものすごい 速さで → ドーン 衝撃波 2重 → 風の うず
  ox_shinkansen: {
    charge: { color: '#ffffff', color2: '#5ac8ff' },
    sfx: 'ax_o4_shinkansen',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      pass(c, { cars: 3, nose: 'bullet', body: '#ffffff', stripe: '#1a4ad8', stripe2: '#1a4ad8', lead: 170, s: 1.05, streak: '#bfeaff', exit: 200 });
      k.streaks({ ang: 0, color: '#ffffff', n: 8, delay: c.hit - 120, life: 260 });
      boom(c, t, c.hit, { r: 16, heavy: true, colors: CYAN, n: 22, ringCol: '#bfeaff', amp: 1.6 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 54, color: '#5ac8ff', w: 2.4, delay: c.hit + 80 });
      fx.swirl(t.x + 8, t.y + 4, ['#ffffff', '#bfeaff', '#5ac8ff'], { n: 12, rad: 16, h: 30, delay: c.hit + 60, life: 420 });
      txt(c, 'ドーン', t.x + 4, t.y - 30, { size: 13, color: '#ffffff', ink: '#1a4ad8', delay: c.hit, life: 380 });
    },
  },
  // 終電: 夜空 → ライトの 最終電車が 敵全体を はねとばす → 星が 散る → 赤い テールランプの すじ
  ox_shuuden: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_shuuden',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      bg(c, 'night', { a: 0.32, life: c.len - 60, fin: 80 });
      const P = pass(c, { cars: 3, body: '#e8e4d8', stripe: '#e8a01a', stripe2: '#c83a1a', lead: 160, tail: true, pan: true, streak: '#ff6a5a', s: 1.05, exit: 220 });
      c.each((t, i, d) => {
        const at = P.at(t.x);
        boom(c, t, at, { i, pow: true, r: 13, colors: ['#ffffff', '#fff6b0', '#ffd23a'], n: 22, heavy: i === 0, color: '#fff6b0', edge: '#e8a01a' });
        k.shapes(t.x, t.y - 6, { shape: 'star', n: N(c, 10), colors: ['#fff6b0', '#ffffff', '#ffd23a'], speed: 110, g: 160, size: 2.4, delay: at + 30, life: 460 });
      });
      line(c, [[P.xN - 20, P.y + 2], [c.W + 10, P.y + 2]], { color: '#ff5a4a', glow: '#ff2a2a', w: 1.6, delay: c.hit + P.spread + 160, travel: 120, life: 280 });
      k.sparkles(c.W / 2, 30, { n: 8, r: 90, colors: ['#ffffff', '#fff6b0'], delay: 40, life: 500 });
      txt(c, 'ファーン', 40, 30, { size: 11, color: '#fff6c8', ink: '#2a2a5a', delay: 0, life: 360 });
      k.shake(260, 1.6, c.hit);
    },
  },
  // 安全確認ヨシ！（ひらめき）: 味方全員の 指さしの 光が いっせいに → ✓ → 青と 白の 矢印
  ox_anzen_kakunin: {
    sfx: 'ax_o4_anzen',
    play(fx, c) {
      const { k } = c;
      c.each((t, i) => {
        const dl = i * 50;
        obj(c, 'glove', { keys: [[0, t.x - 6, t.y - 10, 0.4, -1.2], [120, t.x - 2, t.y - 26, 1, -1.25], [c.len - 80, t.x - 2, t.y - 28, 1, -1.25]], size: 8, delay: dl, life: c.len - 60 - dl });
        fx.glow(t.x + 3, t.y - 40, { color: '#5affb0', r: 12, delay: dl + 120, life: 260, alpha: 0.9 });
        fx.sparks(t.x + 3, t.y - 40, { colors: ['#ffffff', '#5affb0'], n: c.n > 2 ? 4 : 10, speed: 90, delay: dl + 120, life: 260 });
        blessing(c, t, c.hit + dl, ['#5ab8ff', '#ffffff'], 5);
        obj(c, 'check', { keys: [[0, t.x + 14, t.y - 30, 0.3], [120, t.x + 14, t.y - 34, 1.15], [220, t.x + 14, t.y - 34, 1]], size: 6, delay: c.hit - 100 + dl, life: 380 });
        arrows(c, t, c.hit + dl + 40, ['#3a8cff', '#ffffff']);
      });
      txt(c, 'ヨシ！', c.W / 2, 36, { size: 18, color: '#ffffff', ink: '#1a6a3a', delay: c.hit - 120, life: 520 });
      k.shockwave(c.W / 2, 36, { r0: 6, r1: 50, color: '#5affb0', w: 2, delay: c.hit - 100 });
      k.sparkles(c.W / 2, 36, { n: 8, r: 34, colors: ['#ffffff', '#5affb0'], delay: c.hit - 80 });
    },
  },
  // 特急列車（ひらめき）: 赤い 特急が 一しゅんで → 体当たり → すぐ 消える すじ → すぐ 次の 番の 青い 光
  ox_tokkyu_ressha: {
    charge: { color: '#ff3a3a', color2: '#ffffff' },
    sfx: 'ax_o4_tokkyu',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      pass(c, { cars: 3, nose: 'bullet', body: '#e8202a', stripe: '#ffffff', stripe2: '#ffd23a', win: '#2a1a1a', lead: 150, s: 1.1, streak: '#ff8a8a', beamCol: '#ffd0d0', exit: 160 });
      k.streaks({ ang: 0, color: '#ff8a8a', n: 9, delay: c.hit - 100, life: 240 });
      boom(c, t, c.hit, { r: 17, heavy: true, colors: ['#ffffff', '#ff8a8a', '#ffd23a'], n: 26, color: '#ffe040', edge: '#e8202a', amp: 1.6 });
      k.shockwave(t.x, t.y, { r0: 8, r1: 50, color: '#ff5a5a', w: 2.2, delay: c.hit + 70 });
      k.speedLines(t.x, t.y, { delay: c.hit - 40, life: 220, r1: 80, n: 16 });
      txt(c, 'ドン！', t.x, t.y - 30, { size: 14, color: '#ffffff', ink: '#c81a1a', delay: c.hit, life: 360 });
      k.debris(t.x, t.y + 6, { n: 6, delay: c.hit, up: 100 });
      quick(c, c.hit + 160);
      k.sparkles(org(c).x, org(c).y - 14, { n: 6, r: 14, colors: ['#5ab8ff', '#ffffff'], delay: c.hit + 220 });
    },
  },
  // ───── 運転士
  // 警笛: ライトが ピカッ → ファーン！ 大きな 黄色い 音の 輪が 3重 → 敵が びっくり（！）→ 下向き矢印
  ox_keiteki: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_horn',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      fx.glow(o.x, o.y - 10, { color: '#fff6c8', r: 34, life: 260, alpha: 1 });
      k.flash('#fff6c8', 80, 0);
      const ang = c.fromAlly ? -PI / 2 : PI / 2;
      for (let j = 0; j < 3; j++) rings(c, o.x, o.y - 8, { ang, span: 1.05 + j * 0.15, n: 4, gap: 90, per: 420, r0: 10, r1: 150 + j * 30, w: 4 - j, color: ['#ffe040', '#fff6b0', '#ffd23a'][j], delay: j * 60, life: 820 });
      txt(c, 'ファーン！', c.W / 2, c.fromAlly ? 26 : c.H - 30, { size: 15, color: '#ffe040', ink: '#5a3a0a', delay: 40, life: 520 });
      c.each((t, i, d) => {
        txt(c, '！', t.x + 10, t.y - 26, { size: 13, color: '#ffffff', ink: '#c81a1a', delay: c.hit + d, life: 380 });
        boom(c, t, c.hit + d, { i, r: 11, colors: ['#ffffff', '#ffe040'], n: 18, color: '#fff6b0', edge: '#e8a01a' });
        k.shapes(t.x, t.y - 10, { shape: 'note', n: N(c, 6), colors: ['#ffe040', '#ffffff'], speed: 70, size: 2.2, delay: c.hit + d, life: 420 });
        arrows(c, t, c.hit + d + 120, ['#3ad87a'], true);
      });
      k.particles(o.x, o.y - 10, { colors: ['#ffffff', '#fff6c8', '#ffe040'], n: 14, speed: 120, ang: c.ang, spread: 0.6, delay: 20, life: 360 });
      k.shake(300, 1.2, 60);
    },
  },
  // 安全運転: 線路の 上に 青い 信号と 緑の 旗 → 味方に 青い 盾
  ox_anzen_unten: {
    sfx: 'ax_o4_anzen_unten',
    play(fx, c) {
      const { k } = c;
      obj(c, 'signal', { keys: [[0, 24, 50, 0.5], [140, 24, 44, 1.1]], size: 12, swap: 0, life: c.len - 40 });
      obj(c, 'flag', { keys: [[0, c.W - 30, 50, 0.5], [140, c.W - 30, 42, 1.1]], size: 11, color: '#2ac86a', life: c.len - 40 });
      line(c, [[0, c.H - 6], [c.W, c.H - 6]], { color: '#c8d0dc', glow: '#5ac8ff', w: 1.2, travel: 220, life: c.len - 60 });
      k.particles(24, 26, { colors: ['#5ab8ff', '#ffffff'], n: 8, speed: 70, delay: 120, life: 300 });
      line(c, [[0, c.H - 12], [c.W, c.H - 12]], { color: '#c8d0dc', glow: '#5ac8ff', w: 1.2, travel: 220, delay: 40, life: c.len - 100 });
      c.each((t, i) => {
        obj(c, 'shield', { keys: [[0, t.x, t.y - 10, 0.4], [140, t.x, t.y - 14, 1.15], [260, t.x, t.y - 14, 1]], size: 9, delay: c.hit - 100 + i * 40, life: 480, glow: '#5ab8ff' });
        blessing(c, t, c.hit + i * 40, ['#5ab8ff', '#ffffff'], c.n > 2 ? 8 : 14);
        arrows(c, t, c.hit + 60 + i * 40, ['#3a8cff']);
        k.sparkles(t.x, t.y - 16, { n: c.n > 2 ? 3 : 6, r: 14, colors: ['#ffffff', '#9ad8ff'], delay: c.hit + i * 40 });
      });
    },
  },
  // 通過列車: ホームの 白い 線の 横を 列車が すりぬける → 一撃 → 風で 葉が 舞う
  ox_tsuuka_ressha: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_tsuuka',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const P = pass(c, { cars: 3, body: '#d8dce4', stripe: '#1a8a4a', stripe2: '#ff8a1a', lead: 170, s: 1.1, streak: '#ffffff', exit: 200 });
      line(c, [[0, P.y + 14], [c.W, P.y + 14]], { color: '#ffffff', glow: '#ffffff', w: 2, travel: 160, life: c.len - 80, dash: [10, 6] });
      line(c, [[0, P.y + 18], [c.W, P.y + 18]], { color: '#ffd23a', glow: '#ffd23a', w: 1.2, travel: 160, delay: 40, life: c.len - 120 });
      boom(c, t, c.hit, { r: 15, heavy: true, colors: ['#ffffff', '#c8ffd8', '#ffd23a'], n: 18 });
      k.shapes(t.x, t.y, { shape: 'petal', n: 12, colors: ['#5ad85a', '#8af08a', '#3aa84a'], speed: 110, ang: 0, spread: 1.2, g: 30, spin: 8, size: 2.4, delay: c.hit + 40, life: 600 });
      fx.gust(t.x - 10, t.y - 10, { len: 70, amp: 5, color: '#e8fff0', w: 1.2, delay: c.hit + 20, life: 380 });
      fx.gust(t.x - 10, t.y + 6, { len: 60, amp: 4, color: '#e8fff0', w: 1, delay: c.hit + 60, life: 360 });
      quick(c, c.hit + 160);
    },
  },
  // 連結: 車両が 1両ずつ ガチャン・ガチャンと つながって のびる → 4回 体当たり → 連結の 火花
  ox_renketsu: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_renketsu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = c.targets.reduce((s, t) => s + t.y, 0) / c.n + 6;
      const gap = 90, sc = 0.9;
      const keys = [[0, -50, y]], addAt = [];
      for (let j = 0; j < 4; j++) {
        const t = c.targets[j % c.n];
        const dl = c.hit + j * gap;
        keys.push([dl - 55, Math.max(-20, t.x - 20), y], [dl, t.x - 2, y]);
        if (j) {
          addAt.push(dl - 70);
          // 連結の 火花（うしろの つなぎめ）
          const cx = t.x - 20 - j * 35.5 * sc;
          fx.sparks(Math.max(4, cx), y, { colors: SPARK, n: c.all ? 4 : 6, speed: 120, delay: dl - 70, life: 260 });
          txt(c, 'ガチャン', Math.max(20, cx), y - 16, { size: 8, color: '#ffffff', ink: '#5a4a0a', delay: dl - 70, life: 200, pop: false });
        }
        boom(c, t, dl, { i: j === 0 ? 0 : 1, pow: true, r: 10 + j * 1.5, colors: ['#ffffff', '#ffe040'], n: 9, ring: j === 3, heavy: j === 3, color: '#ffe040', edge: '#3a3e4a' });
      }
      keys.push([c.hit + 3 * gap + 200, c.targets[3 % c.n].x + 4, y]);
      car(c, 'train', { keys, ease: 'io', life: c.len - 40, cars: 4, addAt, s: sc, body: '#f0d020', stripe: '#3a3e4a', streak: '#fff6b0' });
      k.debris(c.center.x, c.center.y + 6, { n: 6, delay: c.hit + 3 * gap, up: 100 });
      k.shake(200, 1.2, c.hit + 270);
    },
  },
  // 最高速度: メーターの 針が ふりきれる → 光の 列車が 画面いっぱいの すじで 敵全体を つきぬける → 大きな 衝撃波・線路の 火花
  ox_saikou_sokudo: {
    charge: { color: '#ffe040', color2: '#ffffff' },
    sfx: 'ax_o4_saikou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const o = org(c);
      const mx = c.fromAlly ? 34 : o.x, my = c.fromAlly ? 30 : o.y - 30;
      obj(c, 'meter', { keys: [[0, mx, my, 0.6], [100, mx, my, 1.1]], size: 13, n0: 0.1, n1: 1, sweep: 220, life: c.hit + 160 });
      txt(c, 'MAX', mx, my - 18, { size: 9, color: '#ff4a3a', delay: 220, life: 300 });
      const P = pass(c, { cars: 4, nose: 'bullet', body: '#fffbe0', stripe: '#ffd23a', stripe2: '#ff8a1a', lead: 170, s: 1.15, streak: '#fff6b0', beamCol: '#ffffff', exit: 200 });
      k.streaks({ ang: 0, color: '#fff6b0', n: 12, delay: c.hit - 160, life: 360 });
      railSparks(c, 0, c.W, P.y, c.hit - 60, c.all ? 7 : 10);
      c.each((t, i, d) => {
        const at = P.at(t.x);
        boom(c, t, at, { i, pow: true, r: 15, heavy: i === 0, colors: ['#ffffff', '#fff6b0', '#ffa02a'], n: 26, amp: 1.8, shake: 240 });
      });
      k.shockwave(c.center.x, c.center.y, { r0: 10, r1: 110, color: '#fff6b0', w: 3, delay: c.hit + 60, n: 2 });
      k.debris(c.center.x, c.center.y + 8, { n: c.all ? 6 : 10, delay: c.hit + 40, up: 120 });
      k.flash('#fffbe0', 90, c.hit);
    },
  },
  // 快速運転（ひらめき）: 駅の 看板が 次々 うしろへ → 列車の すじが 敵全体に → すぐ 次の 番の 青い 光
  ox_kaisoku_unten: {
    charge: { color: '#fff6c8', color2: '#ffffff' },
    sfx: 'ax_o4_kaisoku',
    allyFx: 'wind',
    play(fx, c) {
      const { k } = c;
      const top = c.fromAlly ? 22 : 30;
      for (let j = 0; j < 4; j++) obj(c, 'sign', { keys: [[0, c.W + 30, top], [260, -30, top]], ease: 'lin', size: 12, delay: j * 70, life: 260, fin: 20, fout: 40, color: ['#2a6ad8', '#e8202a', '#1a8a4a', '#ff8a1a'][j] });
      railSparks(c, 0, c.W, c.center.y + 6, c.hit - 80, c.all ? 6 : 9);
      txt(c, 'タタン タタン', c.W / 2, top + 18, { size: 9, color: '#ffffff', ink: '#2a3a6a', delay: 60, life: 320, pop: false });
      const P = pass(c, { cars: 4, body: '#ffffff', stripe: '#ff7a1a', stripe2: '#2a6ad8', lead: 170, s: 1.1, streak: '#ffd0a0', exit: 220 });
      k.streaks({ ang: 0, color: '#ffe0c0', n: 9, delay: c.hit - 120, life: 300 });
      c.each((t, i, d) => {
        boom(c, t, P.at(t.x), { i, pow: true, r: 14, heavy: i === 0, colors: ['#ffffff', '#ffd0a0', '#ff8a1a'], n: 26 });
        k.debris(t.x, t.y + 6, { n: N(c, 6), delay: P.at(t.x), up: 90 });
      });
      quick(c, c.hit + P.spread + 140);
      k.sparkles(org(c).x, org(c).y - 14, { n: 6, r: 14, colors: ['#5ab8ff', '#ffffff'], delay: c.hit + P.spread + 200 });
    },
  },
};
void rnd;
