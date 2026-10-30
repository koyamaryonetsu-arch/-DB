// 第51回 W（天気の 職業）: え で つかう 小さな どうぐ（つぶ o10〜 を 足す）と つぶの かずの あわせ（balance）。この ファイルは W だけが さわる
// しくみは axfx-o5-kit.js と おなじ（段の 予算 AX_BUDGET_ORIG に あわせて こまかい つぶを へらす・足す）
import { rnd } from './axkit.js?v=e9f7d3379e55';
import { AX_BUDGET_ORIG } from '../../shared/ax-time.js?v=e9f7d3379e55';

// つぶを 1つ 足す（kind は o10〜）。x,y は 画面の 中の いち（とおい つぶの しらべに つかう）
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? (o.pts ? o.pts[0][0] : 0), y = o.y ?? o.y0 ?? (o.pts ? o.pts[0][1] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// 小物（shape は axfx-o10-fine.js の OBJ）
export const obj = (c, shape, o) => add(c, 'o10Obj', { shape, ...o });
// カタカナの 擬音（画面の 中に おさめる）
export const text = (c, x, y, t, o = {}) => add(c, 'o10Text', { x: Math.max(24, Math.min(c.W - 24, x)), y: Math.max(11, Math.min(c.H - 10, y)), text: t, life: 560, ...o });
// 小物が x0,y0 → x1,y1 へ とぶ（travel … とぶ 時間。あとは stay だけ のこる）
export const fly = (c, shape, x0, y0, x1, y1, o = {}) => obj(c, shape, { x0, y0, x1, y1, travel: o.travel ?? c.hit, life: (o.travel ?? c.hit) + (o.stay ?? 120), fout: o.fout ?? 100, ...o });
// 雨の カーテン（x … まん中、w … はば、y0 → y1）
export const rain = (c, x, w, y0, y1, o = {}) => add(c, 'o10Rain', { x, w, y0, y1, life: 600, ...o });
// 太陽の 光の すじ
export const rays = (c, x, y, o = {}) => add(c, 'o10Rays', { x, y, life: 600, ...o });
// 台風の うず
export const spiral = (c, x, y, o = {}) => add(c, 'o10Spiral', { x, y, life: 700, ...o });
// にじ
export const rainbow = (c, x, y, o = {}) => add(c, 'o10Rainbow', { x, y, life: 800, ...o });
// 前線
export const front = (c, pts, o = {}) => add(c, 'o10Front', { pts, life: 700, ...o });
// 空の 色（うすく a 0.35 まで・0.6s まで。画面を くらく する dim は つかわない）
export const sky = (c, v, o = {}) => add(c, 'o10Sky', { v, x: 0, y: 0, life: Math.min(600, o.life ?? 560), fin: 120, fout: 220, ...o, a: Math.min(0.35, o.a ?? 0.3) });
// 上向きの 矢印
export const arrow = (c, x, y, color, o = {}) => obj(c, 'arrow', { x, y, color, s: 6, pop: 160, life: 620, ...o });
export const UP = { atk: '#ff4a4a', def: '#3a8aff', spd: '#3ad860', mag: '#b45aff' };

// 的の 上の 空（画面の そとに 出ない）。敵が 味方に つかう ときは 味方の 上
export const above = (c, t, dy = 34) => Math.max(14, t.y - dy);
// 的の 下の じめん
export const ground = (c, t, dy = 16) => Math.min(c.H - 4, t.y + dy);
// つかう 人の 手もと（味方は 画面の 下・すこし 左。敵は その まん中）
export const hands = (c, up = 20) => (c.fromAlly ? { x: Math.max(24, c.from.x - 44), y: Math.max(c.H - 46, c.H - 18 - up * 0.6) } : { x: c.from.x, y: c.from.y + 4 });
// 味方 ぜんいんの まん中の 上
export const partyTop = (c, dy = 46) => ({ x: c.center.x, y: Math.max(16, c.center.y - dy) });
// 敵の かずで つぶを へらす（5体でも 上限を こえない）
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.3) / c.n)));
export const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

// あたった ところ（i … 何番め、d … 時間）。1体目・2体目は 光の まる、3体目から きまりの しるし
export function hitFx(c, t, i, d, o = {}) {
  const { k } = c;
  const glow = o.glow || '#ffffff', cols = o.colors || ['#ffffff', glow];
  const heavy = o.heavy ?? (c.tier !== 'basic' && i === 0);
  if (i < 2) k.impact(t.x, t.y + (o.dy || 0), { r: (o.r || 13) * c.sz, glow, colors: cols, delay: d, heavy });
  else c.hitMark({ x: t.x, y: t.y + (o.dy || 0) }, d, [glow]);
  if (o.n !== 0) k.particles(t.x, t.y + (o.dy || 0), { n: per(c, o.n ?? 12), colors: cols, speed: o.speed || 130, delay: d, life: 420 });
  if (o.ring) k.shockwave(t.x, t.y, { r0: 4, r1: (o.ring === true ? 34 : o.ring) * c.sz, color: o.ringColor || glow, w: 2, delay: d + 10, life: 360 });
}
// かみなりが 1本 落ちる（空の 上から 的へ。w … ふとさ）。へんじ: あたる 時間
export function strike(c, t, d, o = {}) {
  const { k, fx } = c;
  const top = o.top ?? (c.dir === 'down' ? Math.max(10, t.y - 70) : -10);
  const x0 = t.x + (o.dx ?? rnd(-14, 14));
  const w = o.w || 2.4;
  const grow = o.grow ?? 60;
  k.bolt(x0, top, t.x, t.y - 2, { w, color: o.color || '#fff6b0', glow: o.glow || '#ffd83a', amp: o.amp || 9, forks: o.forks ?? 2, delay: d - grow, grow, life: o.life || 320 });
  fx.glow(t.x, t.y, { color: '#fff6b0', r: 26 * c.sz * (o.big || 1), delay: d, life: 300, alpha: 0.95 });
  return d;
}
// 段ごとの 命中の ゆれ（B 小さな 止まり・A 止まり・S ゆれ＋フラッシュ）
export function tierShake(c, d, o = {}) {
  const { k } = c;
  if (c.tier === 'basic') k.shake(o.ms || 80, o.amp || 0.9, d);
  else if (c.tier === 'advanced') k.shake(o.ms || 150, o.amp || 1.3, d);
  else { k.shake(o.ms || 260, o.amp || 1.8, d); if (o.flash !== false) k.flash(o.flash || '#ffffff', 90, d); }
}
// 味方に かける 技の しるし（回復の 緑 など）
export function allyGlow(c, t, d, color = '#7dffb0', o = {}) {
  const { fx, k } = c;
  fx.glow(t.x, t.y - 8, { color, r: o.r || 22, delay: d, life: o.life || 480, alpha: 0.85 });
  k.shockwave(t.x, t.y, { r0: 4, r1: o.ring || 26, sy: 0.35, color, w: 1.8, delay: d, life: 420 });
  if (o.drops !== 0) for (let j = 0; j < (o.drops ?? 5); j++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(4, 24), { color: j % 2 ? '#ffffff' : color, size: rnd(2.5, 4.5), vy: rnd(-26, -8), delay: d + j * 40, life: 420 });
}
// 水しぶき（的の 足もと）
export function splashAt(c, t, d, o = {}) {
  c.k.splash(t.x, ground(c, t, o.dy ?? 4), { n: per(c, o.n ?? 14), power: o.power || 1, delay: d });
}

// へらして よい つぶ（こまかい もの から）。大きな 絵（o10Obj・o10Text・o10Rain・ビーム・わ）や 時計（call）・ゆれ・ひかりは へらさない
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];

// 段の つぶの かず に あわせる（もとからの 技の 予算 AX_BUDGET_ORIG）
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.tier] || AX_BUDGET_ORIG.basic;
  const support = !!c.party;
  const lo = Math.max(Math.ceil(B.parts[0] * (support ? 0.5 : 1) * 1.1), o.minParts || 0);
  const hi = Math.floor(B.parts[1] * 0.97);
  // 余韻は 技の おわり（len ＋ 敵全体の ずらし）の すこし あと までに きえる
  const limit = c.len + (c.n - 1) * c.stagger + 220;
  for (let i = fx.parts.length - 1; i >= start; i--) {
    const p = fx.parts[i];
    const d = p.delay > 0 ? p.delay : 0;
    if (d >= limit) fx.parts.splice(i, 1);
    else if (d + (p.life - (p.age || 0)) > limit) p.life = (p.age || 0) + limit - d;
  }
  let over = fx.parts.length - hi;
  for (const kind of TRIM) {
    if (over <= 0) break;
    for (let i = fx.parts.length - 1; i >= start && over > 0; i--) {
      if (fx.parts[i].kind === kind) { fx.parts.splice(i, 1); over--; }
    }
  }
  const need = Math.min(lo - fx.parts.length, hi - fx.parts.length);
  if (need <= 0) return;
  const cols = [o.color || '#ffffff', o.color2 || '#bfe8ff', '#ffffff'];
  const t0 = c.hit, t1 = Math.max(c.hit + 60, c.len - 420);
  for (let i = 0; i < need; i++) {
    const t = c.targets[i % c.n];
    const x = Math.max(4, Math.min(c.W - 4, t.x + rnd(-30, 30))), y = Math.max(4, Math.min(c.H - 4, t.y + rnd(-26, 14)));
    fx.twinkle(x, y, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(t0, t1), life: rnd(220, 340), vy: rnd(-24, -6) });
  }
}

export function withBalance(defs) {
  const out = {};
  for (const [anim, def] of Object.entries(defs)) {
    const { minParts, ...rest } = def;
    out[anim] = {
      ...rest,
      play(fx, c) {
        const start = fx.parts.length;
        def.play(fx, c);
        balance(fx, c, start, { minParts, color: def.charge?.color, color2: def.charge?.color2 });
      },
    };
  }
  return out;
}
