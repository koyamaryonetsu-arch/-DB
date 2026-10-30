// 第48回 G2: 京急（京急の運転士・京急の社長）の 大技の え
// ・赤い 電車は 1つの つぶ（g2Train。赤い 車体・白い 帯・まど・ライト・パンタグラフ）。車両の かずで 120キロ（4両）→ 赤い快特（8両）→ 12両
// ・本物の 会社の マークは かかない（赤い 車体＋白い 帯 まで）
// ・時間は shared/data/ax-time-g2.js。ここは 見た目だけ（play の 時間は はなつ しゅんかんが 0）
import { rnd, lerp } from './axkit.js?v=e9f7d3379e55';
import { darken, bg, blow, icon, train } from './axfx-g2-kit.js?v=e9f7d3379e55';

const CAR = 30; // 1両の 長さ（s=1）
const REDS = ['#ffffff', '#ff6a5a', '#ffd23a'];
const NOTE_COLS = ['#ff4a4a', '#ff9a2a', '#ffe040', '#5ad85a', '#4ab8ff', '#4a6aff', '#b06aff', '#ff7ad8'];
// 線路の 高さ（的の 足もと）
const rowOf = (c) => Math.min(c.H - 4, Math.max(...c.targets.map((t) => t.y)) + 12);
function rails(fx, y, life, o = {}) {
  fx.add({ kind: 'g2Rails', x: 128, y, life, delay: o.delay || 0, color: o.color, scroll: o.scroll || 0 });
}
// 車輪の 火花（あたまの いちを なぞる）
function wheelSparks(fx, keys, y, t0, t1, step = 50) {
  for (let t = t0; t < t1; t += step) {
    let hx = null;
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const a = keys[i - 1], b = keys[i]; hx = lerp(a[1], b[1], (t - a[0]) / Math.max(1, b[0] - a[0])); break; }
    if (hx === null || hx < -10 || hx > 266) continue;
    fx.sparks(hx - 6, y - 1, { colors: ['#fff6b0', '#ffd23a', '#ff8a2a'], n: 3, speed: 90, ang: Math.PI + 0.4, spread: 0.5, g: 200, delay: t, life: 260, len: 4 });
  }
}
// よこに 走る 電車の キー（fromLeft … 左から。xa に at で つく。v … px/ms）
function runKeys(fromLeft, y, xa, at, v, life) {
  const x0 = fromLeft ? -70 : 326;
  const sg = fromLeft ? 1 : -1;
  const t0 = at - Math.abs(xa - x0) / v;
  const end = [life, xa + sg * v * (life - at), y];
  if (t0 > 0) return [[0, x0, y], [t0, x0, y], [at, xa, y], end];
  return [[0, xa - sg * v * at, y], [at, xa, y], end];
}
// 電車が 来る まえの ライトの 光（画面の はしが 光る・レールが ふるえる）
function approach(fx, y, fromLeft, t0, t1) {
  const ex = fromLeft ? -4 : 260;
  for (let t = t0; t < t1; t += 90) {
    const u = (t - t0) / Math.max(1, t1 - t0);
    fx.glow(ex, y - 6, { color: '#fff6c8', r: 14 + 30 * u, delay: t, life: 140, alpha: 0.4 + 0.5 * u });
    fx.sparks(ex + (fromLeft ? 20 : -20) + Math.random() * 60 * (fromLeft ? 1 : -1), y, { colors: ['#ffd23a', '#ffffff'], n: 2, speed: 50, ang: -Math.PI / 2, spread: 0.6, delay: t, life: 200, len: 3 });
  }
}
// 的に あたる（火花・衝撃）
function trainHit(fx, k, t, d, c, heavy) {
  blow(fx, t.x, t.y, { r: 15 * c.sz, delay: d, colors: REDS, n: 18, heavy });
  k.shockwave(t.x, t.y, { r0: 8, r1: 50 * c.sz, color: '#ffd0c8', w: 2.4, n: 2, gap: 80, delay: d });
  k.particles(t.x, t.y, { colors: ['#ffffff', '#ffd23a'], n: 12, speed: 200, ang: 0, spread: 0.7, delay: d, life: 360 });
}

export const AX_G2_KEIKYU = {
  // ドレミファ発車: 音符 8こが ドレミの 高さで 階段の ように 上へ・赤い 電車の 光が 右へ すべり出す
  ax_doremi_hassha: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0' },
    sfx: 'ax_g2_doremi',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.3, c.len - 100);
      rails(fx, c.H - 4, c.len - 80);
      train(fx, runKeys(true, c.H - 4, 30, 0, 0.32, c.len - 60), { cars: 2, s: 0.85, life: c.len - 60 });
      for (let i = 0; i < 8; i++) {
        const x = c.W / 2 - 88 + i * 25, y = c.H - 34 - i * 9;
        fx.add({ kind: 'axShape', shape: 'note', x, y, vx: 0, vy: -8, color: NOTE_COLS[i], size: 6, rot0: 0, spin: 0, delay: i * 62, life: c.len - i * 62 - 120, add: false, pop: true });
        fx.twinkle(x + 2, y - 2, { color: '#ffffff', size: 5, delay: i * 62, life: 260 });
        fx.sparks(x, y, { colors: [NOTE_COLS[i], '#ffffff'], n: 4, speed: 50, delay: i * 62, life: 300 });
      }
      c.each((t, i, d) => {
        k.sparkles(t.x, t.y - 10, { n: 5, r: 14, colors: ['#ffffff', '#ffe066'], delay: d + c.hit });
        fx.arrows(t.x, t.y - 4, '#ff6a6a', true, 3, d + c.hit);
      });
      k.streaks({ ang: 0, color: '#ffd0d0', n: 16, delay: 100, life: c.len - 300, alpha: 0.35 });
    },
  },
  // 120キロ運転: 赤い 電車（白い 帯・前の 顔と ライト）が 左から 速さの すじと 一気に 敵へ → ドーン → 右へ 走りぬける
  ax_keikyu_120: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0', power: 1.2 },
    sfx: 'ax_g2_train',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const xs = c.targets.map((t) => t.x);
      const xa = Math.min(...xs);
      const v = c.n > 1 ? Math.max(0.8, (Math.max(...xs) - xa) / Math.max(1, c.stagger * (c.n - 1))) : 0.85;
      darken(fx, 0.4, c.len - 80);
      rails(fx, y, c.len - 60);
      icon(fx, 'signal', 16, y - 12, { s: 0.9, go: 0, life: c.hit + 200 });
      const keys = runKeys(true, y, xa, c.hit, v, c.len - 60);
      train(fx, keys, { cars: 4, s: 1.35, life: c.len - 60 });
      wheelSparks(fx, keys, y, 0, c.len - 300);
      k.streaks({ ang: 0, color: '#ffffff', n: 24, delay: Math.max(0, c.hit - 200), life: 600, speed: 1.6, alpha: 0.55 });
      c.each((t, i, d) => trainHit(fx, k, t, d + c.hit, c, i === 0));
      k.flash('#ffffff', 80, c.hit);
      k.shake(360, 2.5, c.hit);
      c.each((t, i, d) => { k.debris(t.x, t.y + 8, { n: 10, delay: d + c.hit, up: 120 }); k.particles(t.x, t.y, { colors: REDS, n: 20, speed: 160, delay: d + c.hit + 60, life: 400 }); });
    },
  },
  // がんじょうな先頭車: 赤い 先頭車の 顔が 画面の 下に どーん・たての 光 → 跳ね返す 光
  ax_ganjou_sentousha: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0' },
    sfx: 'ax_g2_gashin',
    play(fx, c) {
      const { k } = c;
      const me = c.t;
      darken(fx, 0.35, c.len - 100);
      const y = c.H - 34;
      icon(fx, 'front', me.x, y, { keys: [[0, me.x, c.H + 30, 0.9], [200, me.x, y - 4, 1.4], [280, me.x, y, 1.3]], life: c.len - 80 });
      for (const dx of [-26, 26]) k.pillar(me.x + dx, c.H, { w: 5, color: '#ffd0c8', glow: '#ffffff', delay: c.hit - 100, life: 500, burst: false, alpha: 0.6 });
      k.shockwave(me.x, c.H - 6, { r0: 10, r1: 90, sy: 0.28, color: '#ff6a6a', w: 2.4, n: 2, delay: 200 });
      k.flash('#ffd0c8', 80, 200);
      for (let j = 0; j < 8; j++) {
        const an = -Math.PI / 2 + (j / 7 - 0.5) * 2.2;
        const hx = me.x + Math.cos(an) * 26, hy = y + Math.sin(an) * 26;
        const td = c.hit + j * 40;
        fx.add({ kind: 'axShape', shape: 'circle', x: hx + Math.cos(an) * 50, y: hy + Math.sin(an) * 50, vx: -Math.cos(an) * 420, vy: -Math.sin(an) * 420, color: '#ffffff', size: 1.4, delay: td - 120, life: 120, add: true });
        fx.add({ kind: 'axShape', shape: 'circle', x: hx, y: hy, vx: Math.cos(an) * 300, vy: Math.sin(an) * 300, color: '#ffd23a', size: 1.6, delay: td, life: 240, add: true });
        fx.sparks(hx, hy, { colors: ['#ffffff', '#ffd23a'], n: 4, speed: 100, delay: td, life: 240 });
      }
      for (const t of c.targets) k.sparkles(t.x, t.y - 10, { n: 5, r: 14, colors: ['#ffffff', '#ff9a8a'], delay: c.hit });
    },
  },
  // ダイヤ回復: 時刻表の 白い 線が 何本も ならんで まっすぐに → 時計の 針が 進む → 青い 光
  ax_daiya_kaifuku: {
    charge: { color: '#4ab8ff', color2: '#e0f4ff' },
    sfx: 'ax_g2_clock',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.35, c.len - 100);
      icon(fx, 'diagram', c.W / 2, 46, { s: 1, life: c.len - 120 });
      icon(fx, 'clock', c.W / 2, c.H - 44, { keys: [[0, c.W / 2, c.H - 40, 0.6], [200, c.W / 2, c.H - 44, 1.6]], life: c.len - 120 });
      k.shockwave(c.W / 2, c.H - 44, { r0: 14, r1: 50, color: '#9ad8ff', w: 2, n: 2, delay: c.hit });
      c.each((t, i, d) => {
        k.particles(t.x, t.y - 4, { colors: ['#9ad8ff', '#ffffff', '#4ab8ff'], n: 12, speed: 70, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d + c.hit, life: 500 });
        fx.arrows(t.x, t.y - 4, '#4ab8ff', true, 3, d + c.hit);
        k.sparkles(t.x, t.y - 12, { n: 4, r: 12, colors: ['#ffffff', '#9ad8ff'], delay: d + c.hit + 60 });
      });
      k.sparkles(c.W / 2, c.H - 44, { n: 12, r: 26, colors: ['#ffffff', '#9ad8ff'], delay: 100, gap: 40 });
      for (let m = 0; m < 8; m++) fx.twinkle(c.W / 2 - 100 + m * 28, 46 + rnd(-30, 30), { color: '#ffffff', size: 4, delay: 200 + m * 50, life: 240 });
      k.particles(c.W / 2, c.H - 44, { colors: ['#9ad8ff', '#ffffff'], n: 20, speed: 90, delay: c.hit, life: 420 });
    },
  },
  // 快特れんけつ: 前の 電車に うしろの 電車が おいついて「ガチャン」（火花）→ 長く なった 電車が 敵ぜんぶを なぎはらう
  ax_kaitoku_renketsu: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0', power: 1.2 },
    sfx: 'ax_g2_renketsu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const s = 1.05, L3 = CAR * s * 3;
      const xs = c.targets.map((t) => t.x);
      const xa = Math.min(...xs), xb = Math.max(...xs);
      const P = Math.max(40, xa - 40);
      const v = Math.max(1, (xb - xa) / Math.max(1, c.stagger * (c.n - 1) || 1));
      darken(fx, 0.4, c.len - 80);
      rails(fx, y, c.len - 60);
      const T = 280, life = c.len - 60;
      const end = (x0) => x0 + v * (life - c.hit);
      // 前の 電車（とまって まつ）
      const keysA = [[0, -6, y], [180, P, y], [T, P, y], [c.hit, xa + 6, y], [life, end(xa + 6), y]];
      train(fx, keysA, { cars: 3, s, life, ease: 'out' });
      // うしろの 電車（おいついて れんけつ）
      const gap = L3 + 1;
      const keysB = [[0, P - gap - 140, y], [T, P - gap, y], [c.hit, xa + 6 - gap, y], [life, end(xa + 6) - gap, y]];
      train(fx, keysB, { cars: 3, s, life, ease: 'in' });
      const cx = P - L3 + 1;
      k.flash('#ffffff', 80, T);
      fx.sparks(cx, y - 8, { colors: ['#ffffff', '#ffd23a', '#ff8a2a'], n: 22, speed: 170, delay: T, life: 380 });
      fx.star(cx, y - 8, '#ffffff', 14, T, 220);
      k.shake(140, 1.4, T);
      wheelSparks(fx, keysA, y, T, c.len - 300, 60);
      k.streaks({ ang: 0, color: '#ffffff', n: 22, delay: T, life: 620, speed: 1.6, alpha: 0.55 });
      c.each((t, i, d) => trainHit(fx, k, t, d + c.hit, c, i === 0));
      k.shake(360, 2.6, c.hit);
      c.each((t, i, d) => k.particles(t.x, t.y, { colors: REDS, n: 20, speed: 160, delay: d + c.hit + 60, life: 400 }));
    },
  },
  // 赤い快特: 行き先の 赤い 光・レールが 赤く 光る → 8両の 赤い 電車が 画面を 横に 2回 走りぬける（2回目は 反対から）
  ax_akai_kaitoku: {
    charge: { color: '#ff2a2a', color2: '#ffd0d0', power: 1.3 },
    sfx: 'ax_g2_kaitoku',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const xs = c.targets.map((t) => t.x);
      const xa = Math.min(...xs), xb = Math.max(...xs);
      const v = 1.45;
      bg(fx, 'rails', { a: 0.42, life: c.len - 60 });
      rails(fx, y, c.len - 60, { color: '#ff2a2a' });
      const k1 = runKeys(true, y, xa, c.hit, v, c.hit + 420);
      approach(fx, y, true, 60, k1[1][0]);
      train(fx, k1, { cars: 8, s: 1.3, life: c.hit + 420, sign: '#ff2a2a' });
      const back = c.hit + 330;
      const k2 = runKeys(false, y, xb, back + 50, v, c.len - 60);
      train(fx, k2, { cars: 8, s: 1.3, ang: Math.PI, life: c.len - 60, sign: '#ff2a2a' });
      wheelSparks(fx, k1, y, 0, c.hit + 300, 45);
      k.streaks({ ang: 0, color: '#ffd0d0', n: 26, delay: c.hit - 160, life: 460, speed: 1.8, alpha: 0.55 });
      k.streaks({ ang: Math.PI, color: '#ffd0d0', n: 26, delay: back, life: 460, speed: 1.8, alpha: 0.55 });
      c.each((t, i, d) => {
        trainHit(fx, k, t, d + c.hit, c, i === 0);
        blow(fx, t.x, t.y, { r: 13 * c.sz, delay: back + 60 + (c.n - 1 - i) * c.stagger, colors: REDS, n: 12 });
      });
      k.flash('#ff8a8a', 80, c.hit);
      k.shake(340, 2.6, c.hit);
      k.shake(300, 2.2, back + 60);
      c.each((t, i, d) => k.debris(t.x, t.y + 8, { n: 10, delay: d + c.hit, up: 120 }));
    },
  },
  // エアポート快特: 空を 白い 飛行機が よこぎり、下を 赤い 電車が 走って 敵に → 白い 飛行機雲が のこる
  ax_airport_kaitoku: {
    charge: { color: '#ff3a3a', color2: '#e0f0ff', power: 1.2 },
    sfx: 'ax_g2_airport',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const t = c.t;
      darken(fx, 0.3, c.len - 80);
      const py = c.fromAlly ? 16 : Math.max(12, c.from.y - 44);
      icon(fx, 'plane', -20, py, { keys: [[0, -24, py + 8, 1.2], [c.len - 200, c.W + 24, py - 4, 1.2]], ease: 'lin', life: c.len - 160 });
      for (let m = 0; m < 22; m++) {
        const u = (m * 40) / (c.len - 200);
        fx.puff(lerp(-24, c.W + 24, u) - 14, lerp(py + 8, py - 4, u) + 1, { color: '#ffffff', r0: 1.5, r1: 4, vx: 0, vy: 0, life: Math.max(160, c.len - 60 - m * 40), alpha: 0.7, delay: m * 40 });
      }
      rails(fx, y, c.len - 60);
      const keys = runKeys(true, y, t.x, c.hit, 0.95, c.len - 60);
      train(fx, keys, { cars: 5, s: 1.15, life: c.len - 60 });
      wheelSparks(fx, keys, y, 0, c.len - 300);
      c.each((t2, i, d) => trainHit(fx, k, t2, d + c.hit, c, i === 0));
      k.streaks({ ang: 0, color: '#ffffff', n: 20, delay: c.hit - 150, life: 500, speed: 1.5, alpha: 0.5 });
      k.shake(360, 2.5, c.hit);
      c.each((t2, i, d) => { k.debris(t2.x, t2.y + 8, { n: 10, delay: d + c.hit, up: 120 }); k.particles(t2.x, t2.y, { colors: REDS, n: 16, speed: 160, delay: d + c.hit + 60, life: 400 }); });
    },
  },
  // 出発進行の号令: 信号機が 赤 → 青・指さしの 白い 光の 線 → 味方の 上に 赤い 光の 帯
  ax_shuppatsu_gourei: {
    charge: { color: '#ff3a3a', color2: '#e0ffe8' },
    sfx: 'ax_g2_gourei',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 100);
      const S = { x: c.W * 0.16, y: c.H - 44 };
      icon(fx, 'signal', S.x, S.y, { s: 1.6, go: 260, life: c.len - 120 });
      const Hn = { x: c.W * 0.5, y: c.H - 20 };
      icon(fx, 'hand', Hn.x, Hn.y, { keys: [[0, Hn.x + 20, Hn.y + 10, 1.4], [200, Hn.x, Hn.y, 1.6]], rot: Math.atan2(S.y - 28 - Hn.y, S.x - Hn.x), life: c.len - 200 });
      k.beam(Hn.x, Hn.y, S.x, S.y - 28, { w: 2, color: '#ffffff', glow: '#e0ffe8', core: '#ffffff', delay: 180, life: 380, grow: 80, burst: false });
      k.shockwave(S.x, S.y - 8, { r0: 6, r1: 40, color: '#3aff9a', w: 2.4, n: 2, delay: 260 });
      k.flash('#3aff9a', 70, 260);
      fx.add({ kind: 'g2Band', x: c.W / 2, y: c.H - 22, h: 34, color: '#ff3a3a', a: 0.4, delay: c.hit, life: c.len - c.hit - 60 });
      c.each((t, i, d) => {
        fx.arrows(t.x, t.y - 4, '#ff6a6a', true, 3, d + c.hit);
        k.sparkles(t.x, t.y - 12, { n: 5, r: 14, colors: ['#ffffff', '#ff9a8a'], delay: d + c.hit + 60 });
        k.particles(t.x, t.y, { colors: ['#ff6a6a', '#ffffff'], n: 10, speed: 70, ang: -Math.PI / 2, spread: 0.6, g: -30, delay: d + c.hit, life: 500 });
      });
      k.streaks({ ang: 0, color: '#ffd0d0', n: 18, delay: c.hit, life: 500, alpha: 0.4 });
      k.sparkles(S.x, S.y - 8, { n: 12, r: 18, colors: ['#3aff9a', '#ffffff'], delay: 260, gap: 30 });
      k.particles(S.x, S.y - 8, { colors: ['#3aff9a', '#ffffff'], n: 16, speed: 100, delay: 260, life: 400 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffffff', '#ff8a8a'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffffff', '#ff8a8a'], gap: 20 });
    },
  },
  // ノンストップ特急: ホームの 柱が 右から 左へ 何本も 流れる（通過）→ 赤い 電車が 敵を はねて 走りぬける
  ax_nonstop_tokkyu: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0', power: 1.2 },
    sfx: 'ax_g2_tokkyu',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const t = c.t;
      darken(fx, 0.4, c.len - 80);
      icon(fx, 'platform', c.W / 2, c.fromAlly ? c.H - 14 : Math.min(c.H - 14, y + 22), { s: 1, life: c.len - 100, fin: 140 });
      rails(fx, y, c.len - 60);
      const keys = runKeys(true, y, t.x, c.hit, 1.2, c.len - 60);
      train(fx, keys, { cars: 6, s: 1.15, life: c.len - 60, sign: '#ffd23a' });
      wheelSparks(fx, keys, y, 0, c.len - 300);
      k.streaks({ ang: Math.PI, color: '#ffffff', n: 28, delay: 0, life: c.len - 200, speed: 1.8, alpha: 0.5 });
      c.each((t2, i, d) => trainHit(fx, k, t2, d + c.hit, c, i === 0));
      for (let m = 0; m < 6; m++) fx.gust(rnd(0, c.W), y - rnd(10, 40), { len: 70, amp: 3, color: '#ffffff', w: 1, dir: 1, delay: c.hit + m * 60, life: 360 });
      k.shake(380, 2.6, c.hit);
      c.each((t2, i, d) => { k.debris(t2.x, t2.y + 8, { n: 10, delay: d + c.hit, up: 120 }); k.particles(t2.x, t2.y, { colors: REDS, n: 20, speed: 160, delay: d + c.hit + 60, life: 400 }); });
    },
  },
  // 全線安全点検: 点検ハンマーで レールを「カーン」・ライトが 走る → 味方に ○の 光
  ax_zensen_tenken: {
    charge: { color: '#ff3a3a', color2: '#fff6c8' },
    sfx: 'ax_g2_kan',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.4, c.len - 100);
      const y = c.H - 6;
      rails(fx, y, c.len - 80);
      [0.22, 0.5, 0.78].forEach((u, i) => {
        const x = c.W * u;
        icon(fx, 'hammer', x + 4, y - 14, { s: 1.4, delay: i * 150, life: 420 });
        fx.shock(x, y, { r0: 3, r1: 22, color: '#ffffff', w: 1.6, delay: i * 150 + 120, life: 280 });
        fx.sparks(x, y - 2, { colors: ['#ffffff', '#fff6b0'], n: 8, speed: 120, ang: -Math.PI / 2, spread: 1, delay: i * 150 + 120, life: 300 });
        fx.twinkle(x, y - 2, { color: '#ffffff', size: 7, delay: i * 150 + 120, life: 220 });
      });
      k.dash(-10, y - 3, c.W + 10, y - 3, { color: '#fff6c8', travel: 560, w: 7, delay: 80 });
      c.each((t, i, d) => {
        fx.ring(t.x, t.y - 8, '#ffffff', 3, d + c.hit, 600, 18);
        fx.shock(t.x, t.y - 8, { r0: 8, r1: 18, color: '#c8ffe0', w: 2.6, delay: d + c.hit, life: 520 });
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#ffffff'], n: 12, speed: 60, ang: -Math.PI / 2, spread: 0.7, g: -40, delay: d + c.hit, life: 560 });
        k.sparkles(t.x, t.y - 10, { n: 4, r: 12, colors: ['#ffffff', '#c8ffe0'], delay: d + c.hit + 80 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 30, { colors: ['#ffffff', '#ffd23a'], n: 16, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
    },
  },
  // ダイヤ大改正: 時刻表の 線が 画面いっぱいに 書きかわる・速い 電車の 線 → 味方の ゲージが 光る
  ax_daiya_kaisei: {
    charge: { color: '#ff3a3a', color2: '#e0f4ff' },
    sfx: 'ax_g2_daiya',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.45, c.len - 100);
      icon(fx, 'diagram', c.W / 2, 52, { s: 1.12, life: c.len - 100 });
      train(fx, runKeys(true, 18, 20, 0, 0.36, c.len - 80), { cars: 2, s: 0.7, life: c.len - 80, light: false });
      k.streaks({ ang: 0.35, color: '#ff8a8a', n: 20, delay: 300, life: 600, speed: 1.6, alpha: 0.5 });
      k.flash('#ffffff', 70, c.hit);
      c.each((t, i, d) => {
        fx.arrows(t.x, t.y - 4, '#ffd23a', true, 3, d + c.hit);
        k.particles(t.x, t.y - 4, { colors: ['#ffd23a', '#ffffff', '#ff6a6a'], n: 12, speed: 80, ang: -Math.PI / 2, spread: 0.6, g: -40, delay: d + c.hit, life: 520 });
        k.sparkles(t.x, t.y - 12, { n: 5, r: 14, colors: ['#ffffff', '#ffd23a'], delay: d + c.hit + 60 });
      });
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 30, { colors: ['#ffffff', '#ffd23a'], n: 16, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffffff', '#ff8a8a'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffffff', '#ff8a8a'], gap: 20 });
    },
  },
  // 12両の大連結: 画面の はしから はしまで つづく 12両が 敵ぜんぶを 長く なぎはらう（つなぎめ ごとに 火花）→ 赤い 尾灯
  ax_12ryou_renketsu: {
    charge: { color: '#ff2a2a', color2: '#ffd0d0', power: 1.3 },
    sfx: 'ax_g2_12ryou',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const y = rowOf(c);
      const xs = c.targets.map((t) => t.x);
      const xa = Math.min(...xs);
      const s = 1.3, v = 0.7;
      bg(fx, 'rails', { a: 0.55, life: c.len - 60 });
      rails(fx, y, c.len - 60, { color: '#ff2a2a' });
      const keys = runKeys(true, y, xa, c.hit, v, c.len - 60);
      approach(fx, y, true, 60, keys[1][0]);
      train(fx, keys, { cars: 12, s, life: c.len - 60, tail: true, sign: '#ff2a2a' });
      wheelSparks(fx, keys, y, 0, c.len - 300, 45);
      c.each((t, i, d) => {
        trainHit(fx, k, t, d + c.hit, c, i === 0);
        for (let j = 1; j < 12; j++) {
          const td = c.hit + (t.x - xa + j * CAR * s) / v;
          if (td > c.len - 320) break;
          fx.sparks(t.x, y - 7, { colors: ['#ffffff', '#ffd23a'], n: c.n > 2 ? 3 : 5, speed: 140, ang: -Math.PI / 2, spread: 1.2, delay: td, life: 260 });
          if (j % 3 === 0) fx.star(t.x, t.y, '#ffd0c8', 9, td, 180);
        }
      });
      k.streaks({ ang: 0, color: '#ffd0d0', n: 26, delay: c.hit - 200, life: c.len - c.hit - 100, speed: 1.6, alpha: 0.5 });
      k.shake(700, 2.8, c.hit);
      fx.glow(c.W - 10, y - 8, { color: '#ff2a2a', r: 22, delay: c.len - 420, life: 300, alpha: 0.8 });
    },
  },
  // 全線大快特: 左・右・空中の レールから 赤い 電車が 3本 つぎつぎに 敵へ → まん中で 交わって 赤い 大爆発 → ドレミの 音符
  ax_zensen_daikaitoku: {
    charge: { color: '#ff2a2a', color2: '#ffd0d0', power: 1.4 },
    sfx: 'ax_g2_zensen',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const C = c.center;
      const y = rowOf(c);
      bg(fx, 'rails', { a: 0.6, life: c.len - 60, sky: true });
      rails(fx, y, c.hit + 400, { color: '#ff2a2a' });
      const s = 1.1;
      const life = c.hit + 140;
      const kA = runKeys(true, y, C.x - 14, c.hit, 0.5, life);
      const kB = runKeys(false, y, C.x + 14, c.hit, 0.5, life);
      approach(fx, y, true, 60, kA[1][0]);
      approach(fx, y, false, 60, kB[1][0]);
      train(fx, kA, { cars: 6, s, life, sign: '#ff2a2a' });
      train(fx, kB, { cars: 6, s, ang: Math.PI, life, sign: '#ff2a2a' });
      // 空中の レールから
      const S0 = { x: c.fromAlly ? -6 : 262, y: -8 };
      const ang = Math.atan2(C.y - 6 - S0.y, C.x - S0.x);
      const dist = Math.hypot(C.x - S0.x, C.y - 6 - S0.y);
      train(fx, [[0, S0.x - Math.cos(ang) * 60, S0.y - Math.sin(ang) * 60], [c.hit - 200, S0.x + Math.cos(ang) * (dist - 120), S0.y + Math.sin(ang) * (dist - 120)], [c.hit, C.x, C.y - 6]], { cars: 4, s, ang, life, ease: 'in', sign: '#ff2a2a' });
      wheelSparks(fx, kA, y, 0, c.hit, 60);
      wheelSparks(fx, kB.map(([t, x, yy]) => [t, x, yy]), y, 0, c.hit, 60);
      k.speedLines(C.x, C.y, { delay: c.hit - 220, life: 300, r1: 170, n: 30 });
      const P = { main: '#ff2a2a', glow: '#ff8a6a', core: '#ffffff', dark: '#5a0a10', list: ['#ffffff', '#ff6a5a', '#ffd23a'] };
      k.explosion(C.x, C.y, { r: 30, pal: P, delay: c.hit, heavy: true });
      k.explosion(C.x, C.y - 8, { r: 22, pal: P, delay: c.hit + 140, heavy: false });
      fx.glow(C.x, C.y, { color: '#ff4a3a', r: 90, delay: c.hit, life: 520, alpha: 0.85 });
      k.tint('#ff2a2a', { a: 0.28, delay: c.hit + 60, life: 360, fin: 40, fout: 200 });
      for (const dx of [-30, 0, 30]) k.flames(C.x + dx, C.y + 14, { w: 34, h: 40, n: 6, cols: ['#ff2a2a', '#ff8a2a', '#ffe08a'], delay: c.hit + 40, life: 600 });
      k.flash('#ffffff', 200, c.hit);
      k.shockwave(C.x, C.y, { r0: 20, r1: 170, color: '#ff8a6a', w: 3.6, n: 3, gap: 110, delay: c.hit, life: 460 });
      c.each((t, i, d) => trainHit(fx, k, t, d + c.hit, c, i === 0));
      k.debris(C.x, C.y + 10, { n: 16, delay: c.hit, up: 170 });
      for (let i = 0; i < 8; i++) fx.add({ kind: 'axShape', shape: 'note', x: C.x + (i - 3.5) * 16, y: C.y - 10 - Math.abs(i - 3.5) * 3, vx: 0, vy: -36, color: NOTE_COLS[i], size: 5, rot0: 0, spin: 0, delay: c.hit + 400 + i * 50, life: c.len - c.hit - 460 - i * 50, add: false, pop: true });
      k.shake(700, 3.8, c.hit);
    },
  },
  // 社長の大ボーナス: 金の ふうとうが 空から ひらひら 味方へ → 金の きらきら＋回復
  ax_shachou_bonus: {
    charge: { color: '#ffd23a', color2: '#fff6c8' },
    sfx: 'ax_g2_bonus',
    play(fx, c) {
      const { k } = c;
      darken(fx, 0.35, c.len - 100);
      c.each((t, i, d) => {
        for (let j = 0; j < 3; j++) {
          const sx = t.x + (j - 1) * 14 + rnd(-6, 6);
          icon(fx, 'envelope', sx, -10, { keys: [[0, sx - 16, -10, 1.3], [c.hit * 0.5, sx + 10, (t.y - 16) * 0.45, 1.3], [c.hit, sx, t.y - 14 + j * 2, 1.3]], ease: 'smooth', delay: d + j * 50, life: c.hit + 260 - j * 50, fout: 120 });
        }
        k.sparkles(t.x, t.y - 12, { n: 8, r: 18, colors: ['#ffd23a', '#ffffff', '#fff6c8'], delay: d + c.hit, gap: 30 });
        k.shapes(t.x, t.y - 12, { shape: 'diamond', n: 6, colors: ['#ffd23a', '#fff6c8'], speed: 80, size: 2, delay: d + c.hit, life: 520, g: 120 });
        k.particles(t.x, t.y, { colors: ['#c8ffe0', '#ffffff', '#ffd23a'], n: 12, speed: 60, ang: -Math.PI / 2, spread: 0.7, g: -40, delay: d + c.hit + 60, life: 560 });
        fx.glow(t.x, t.y - 8, { color: '#ffd23a', r: 20, delay: d + c.hit, life: 400, alpha: 0.7 });
      });
      k.flash('#ffd23a', 80, c.hit);
      c.each((t, i, d) => k.sparkles(t.x, t.y - 14, { n: 10, r: 22, colors: ['#ffffff', '#ffd23a', '#c8ffe0'], delay: d + c.hit - 60, gap: 30 }));
      k.particles(c.W / 2, c.H - 30, { colors: ['#ffffff', '#ffd23a'], n: 16, speed: 110, ang: -Math.PI / 2, spread: 1.2, delay: c.hit - 60, life: 460 });
      k.particles(c.from.x, c.fromAlly ? c.H - 20 : c.from.y, { colors: ['#ffd23a', '#fff6c8'], n: 34, speed: 150, ang: -Math.PI / 2, spread: 1.3, g: -20, life: 480 });
      k.sparkles(c.from.x, c.fromAlly ? c.H - 30 : c.from.y, { n: 10, r: 30, colors: ['#ffd23a', '#fff6c8'], gap: 20 });
    },
  },
  // 快特のおいこし: 灰色の 電車の 横を 赤い 快特が 追いこして そのまま 敵に → 追いこしの 風の すじ
  ax_kaitoku_oikoshi: {
    charge: { color: '#ff3a3a', color2: '#ffe0e0', power: 1.3 },
    sfx: 'ax_g2_oikoshi',
    allyFx: 'quake',
    play(fx, c) {
      const { k } = c;
      const t = c.t;
      const y = rowOf(c);
      const y2 = Math.min(c.H + 6, y + 18);
      bg(fx, 'rails', { a: 0.45, life: c.len - 60 });
      rails(fx, y, c.len - 60);
      rails(fx, y2, c.len - 60, { color: '#8a8aa0' });
      const life = c.len - 60;
      const keysR = runKeys(true, y, t.x, c.hit, 1.0, life);
      train(fx, keysR, { cars: 6, s: 1.1, life, sign: '#ff2a2a' });
      train(fx, [[0, c.W * 0.55, y2], [life, c.W * 0.55 + 0.22 * life, y2]], { cars: 5, s: 1.0, life, body: '#a8acb8', band: '#4a6ad8', dark: '#6a6e7a', light: false, sign: '#ffffff' });
      wheelSparks(fx, keysR, y, 0, c.len - 300);
      k.streaks({ ang: 0, color: '#ffffff', n: 24, delay: c.hit - 300, life: 700, speed: 1.8, alpha: 0.55 });
      for (let m = 0; m < 6; m++) fx.gust(c.W * 0.35 + m * 20, y + 6, { len: 60, amp: 3, color: '#ffffff', w: 1, dir: 1, delay: c.hit - 260 + m * 40, life: 300 });
      c.each((t2, i, d) => trainHit(fx, k, t2, d + c.hit, c, i === 0));
      blow(fx, t.x, t.y, { r: 13 * c.sz, delay: c.hit + 160, colors: REDS, n: 12 });
      k.flash('#ffffff', 90, c.hit);
      k.shake(420, 2.8, c.hit);
      k.debris(t.x, t.y + 8, { n: 14, delay: c.hit, up: 130 });
      k.particles(t.x, t.y, { colors: REDS, n: 34, speed: 200, delay: c.hit, life: 440 });
    },
  },
};
