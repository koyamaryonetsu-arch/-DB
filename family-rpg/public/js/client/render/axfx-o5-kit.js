// 第49回 O5（家・学校・料理）: え で つかう 小さな どうぐ（O5 の つぶ o5〜 を 足す）と つぶの かずの あわせ（balance）。この ファイルは O5 だけが さわる
import { rnd } from './axkit.js';
import { AX_BUDGET_ORIG } from '../../shared/ax-time.js';

// つぶを 1つ 足す（kind は o5〜）。x,y は 画面の 中の いち（とおい つぶの しらべに つかう）
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? (o.pts ? o.pts[0][0] : 0), y = o.y ?? o.y0 ?? (o.pts ? o.pts[0][1] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// 小物（shape は axfx-o5-fine.js の OBJ）
export const obj = (c, shape, o) => add(c, 'o5Obj', { shape, ...o });
// カタカナの 擬音
export const text = (c, x, y, t, o = {}) => add(c, 'o5Text', { x: Math.max(22, Math.min(c.W - 22, x)), y: Math.max(11, Math.min(c.H - 10, y)), text: t, life: 560, ...o });
// 小物が x0,y0 → x1,y1 へ とぶ（d … 出る 時間、travel … とぶ 時間。あとは life まで 的の ところに のこる）
export const fly = (c, shape, x0, y0, x1, y1, o = {}) => obj(c, shape, { x0, y0, x1, y1, travel: o.travel ?? c.hit, life: (o.travel ?? c.hit) + (o.stay ?? 120), fout: o.fout ?? 100, ...o });
// 小物が はじけ とぶ（じゅうりょくで おちる）
export const toss = (c, shape, x, y, o = {}) => obj(c, shape, { x, y, vx: o.vx ?? rnd(-90, 90), vy: o.vy ?? rnd(-160, -80), g: o.g ?? 420, spin: o.spin ?? rnd(-8, 8), rot0: rnd(0, 6), life: 620, fout: 160, ...o });
// 矢印（color: 赤 攻撃・青 守備・緑 素早さ・むらさき 魔力。down … 下向き）
export const arrow = (c, x, y, color, o = {}) => add(c, 'o5Arrow', { x, y, color, life: 620, ...o });
export const UP = { atk: '#ff4a4a', def: '#3a8aff', spd: '#3ad860', mag: '#b45aff' };
// のびる 線
export const line = (c, pts, o = {}) => add(c, 'o5Line', { pts, ...o });
// 湯気
export const steam = (c, x, y, o = {}) => add(c, 'o5Steam', { x, y, life: 700, ...o });
// 背景（発射の あと 一しゅん。うすく a 0.35 まで・0.6s まで）
export const bg = (c, v, o = {}) => add(c, 'o5Bg', { v, x: 0, y: 0, life: Math.min(600, o.life ?? 560), fin: 120, fout: 220, ...o, a: Math.min(0.35, o.a ?? 0.3) });
// 竜巻
export const twister = (c, o) => add(c, 'o5Twister', o);

// 画面の 下に いる 味方の 手もと（つかう 人の 前）。敵なら その まん中
// 味方は 画面の 下（敵の 足もとと おなじ 高さ）なので、すこし 左下に はなして 小物を 出す（とぶ ところが 見える）
export const hands = (c, up = 20) => (c.fromAlly ? { x: Math.max(22, c.from.x - 46), y: Math.max(c.H - 44, c.H - 18 - up * 0.6) } : { x: c.from.x, y: c.from.y + 4 });
// 炎の すじ（x0,y0 → x1,y1 へ 小さな 炎が じゅんに もえて すすむ）
export function fireTrail(c, x0, y0, x1, y1, d, travel, o = {}) {
  const n = o.n || (c.all ? 3 : 5);
  for (let j = 1; j <= n; j++) {
    const u = j / n;
    c.k.flames(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u + 6, { w: (o.w || 15) * (0.6 + 0.5 * u), h: (o.h || 20) * (0.6 + 0.5 * u), cols: o.cols, delay: d + travel * u - 40, life: o.life || 360, embers: false });
  }
}
// 的の 下の じめん（画面の そとに 出ない）
export const ground = (c, t, dy = 18) => Math.min(c.H - 4, t.y + dy);
// 的の 上（画面の そとに 出ない）
export const above = (c, t, dy = 30) => Math.max(10, t.y - dy);
export const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
// 敵の かずで つぶを へらす（5体でも 上限を こえない）
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.3) / c.n)));
// 敵1体の ときだけ ふやす（敵全体の ときは 0）
export const solo = (c, n) => (c.all ? 0 : n);
export const jit = (v, a) => v + rnd(-a, a);
// 下向き（敵が 味方に つかう）なら 上下を ひっくり返す むき
export const vdir = (c) => (c.dir === 'down' ? 1 : -1);
// 味方 ぜんいんの まん中の 上（味方に かける 技の 大きな 絵の いち）
export const partyTop = (c, dy = 44) => ({ x: c.center.x, y: Math.max(16, c.center.y - dy) });

// あたった ところ（i … 何番め、d … ずらし込みの 時間）。1体目・2体目は 光の まる、3体目から きまりの しるし。段で 命中の 強さが かわる
export function hitFx(c, t, i, d, o = {}) {
  const { k } = c;
  const glow = o.glow || '#ffffff', cols = o.colors || ['#ffffff', glow];
  const heavy = o.heavy ?? (c.tier !== 'basic' && i === 0);
  if (i < 2) k.impact(t.x, t.y + (o.dy || 0), { r: (o.r || 13) * c.sz, glow, colors: cols, delay: d, heavy });
  else c.hitMark({ x: t.x, y: t.y + (o.dy || 0) }, d, [glow]);
  if (o.n !== 0) k.particles(t.x, t.y + (o.dy || 0), { n: per(c, o.n ?? 14), colors: cols, speed: o.speed || 130, delay: d, life: 420 });
  if (o.stars) k.shapes(t.x, t.y - 6, { shape: o.shape || 'star', n: per(c, o.stars), colors: o.starCols || ['#ffe060', '#ffffff'], speed: o.starSpeed || 60, size: o.size || 2.2, delay: d + 40, life: 560, g: o.g || 0 });
  if (o.ring) k.shockwave(t.x, t.y, { r0: 4, r1: (o.ring === true ? 34 : o.ring) * c.sz, color: o.ringColor || glow, w: 2, delay: d + 10, life: 360 });
}
// 段ごとの 命中の ゆれ（B 小さな 止まり・A 止まり＋輪・S ゆれ＋フラッシュ・合体技 S）
export function tierShake(c, d, o = {}) {
  const { k } = c;
  const t = c.dual ? 'super' : c.tier;
  if (t === 'basic') k.shake(o.ms || 80, o.amp || 0.9, d);
  else if (t === 'advanced') k.shake(o.ms || 150, o.amp || 1.3, d);
  else { k.shake(o.ms || 260, o.amp || 1.8, d); if (o.flash !== false) k.flash(o.flash || '#ffffff', 90, d); }
}
// 味方に かける 技の しるし（回復の 緑・MPの 青 など）。t … 味方
export function allyGlow(c, t, d, color = '#7dffb0', o = {}) {
  const { fx, k } = c;
  fx.glow(t.x, t.y - 8, { color, r: (o.r || 22), delay: d, life: o.life || 480, alpha: 0.85 });
  k.shockwave(t.x, t.y, { r0: 4, r1: o.ring || 26, sy: 0.35, color, w: 1.8, delay: d, life: 420 });
  if (o.drops !== 0) for (let j = 0; j < (o.drops ?? 5); j++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(4, 24), { color: j % 2 ? '#ffffff' : color, size: rnd(2.5, 4.5), vy: rnd(-26, -8), delay: d + j * 40, life: 420 });
}

// へらして よい つぶ（こまかい もの から）。大きな 絵（o5Obj・o5Text・o5Bg・ビーム・わ）や 時計（call）・ゆれ・ひかりは へらさない
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];

// 段の つぶの かず に あわせる（もとからの 技の 予算 AX_BUDGET_ORIG。合体技は super の [90, 230]）
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.dual ? 'super' : c.tier] || AX_BUDGET_ORIG.basic;
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
  const cols = [o.color || '#ffffff', o.color2 || '#fff6b0', '#ffffff'];
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
