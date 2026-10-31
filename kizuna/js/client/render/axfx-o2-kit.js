// 第49回 O2: もとからの 技の え で つかう 小さな どうぐ（つぶ o2〜 を 足す・段の つぶの かず に あわせる）。この ファイルは O2 だけが さわる
import { rnd } from './axkit.js?v=a5c15ff5e061';
import { AX_BUDGET_ORIG, AX_DUAL_PARTS_ORIG } from '../../shared/ax-time.js?v=a5c15ff5e061';

// つぶを 1つ 足す（kind は o2〜）
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? (o.pts ? o.pts[0][0] : 0), y = o.y ?? o.y0 ?? (o.pts ? o.pts[0][1] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// 大きな え（shape は axfx-o2-fine.js の O2_SHAPES）
export const obj = (c, shape, o) => add(c, 'o2Obj', { shape, ...o });
// カタカナの 音
export const txt = (c, text, x, y, o = {}) => add(c, 'o2Text', { text, x: Math.max(18, Math.min(c.W - 18, x)), y: Math.max(10, Math.min(c.H - 10, y)), life: 420, size: 11, rise: 8, ...o });
// 一しゅんの 背景（はなった あと。a 0.35 まで）
export const bg = (c, v, o = {}) => add(c, 'o2Bg', { v, x: 0, y: 0, life: Math.min(600, c.len - 200), a: 0.28, ...o });
// つめあと
export const claw = (c, x, y, o = {}) => add(c, 'o2Claw', { x, y, ang: 0.9, len: 40, n: 3, gap: 7, w: 2.2, color: '#ffffff', glow: '#ff5a3a', swing: 110, life: 420, ...o });
// うず
export const whirl = (c, x, y, o = {}) => add(c, 'o2Whirl', { x, y, r: 30, sy: 0.4, life: 700, ...o });
// 光の すじ
export const rays = (c, x, y, o = {}) => add(c, 'o2Rays', { x, y, r: 60, life: 600, ...o });

// つかう 人の 手もと（味方は 画面の 下・敵は え の まん中）
export const hands = (c, up = 16) => ({ x: c.from.x, y: c.fromAlly ? Math.min(c.H - 20, c.from.y - up) : c.from.y + 4 });
// 的の 下の じめん（画面の そとに 出ない）
export const ground = (c, t, dy = 18) => Math.min(c.H - 4, t.y + dy);
// 的の 上（画面の そとに 出ない）
export const above = (c, t, dy = 26) => Math.max(10, t.y - dy);
// 敵の かずで つぶを へらす（5体でも 上限を こえない）
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.4) / c.n)));
// 敵1体の ときだけ
export const solo = (c, n) => (c.all ? 0 : n);
// むき（つかう 人 → 的）。上むき（味方→敵）なら 負
export const angTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
// 状態の しるし（上むき・下むきの やじるし）
export const upMark = (c, t, color, d, n = 3) => c.fx.arrows(t.x, t.y - 6, color, true, n, d);
export const downMark = (c, t, color, d, n = 3) => c.fx.arrows(t.x, t.y - 6, color, false, n, d);

// こぶしが とぶ（from → to）。へんじ: あたる 時間
export function fist(c, x0, y0, x1, y1, o = {}) {
  const travel = o.travel ?? 120;
  const ang = Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2;
  obj(c, 'fist', { x0, y0, x1, y1, travel, ease: 'in', s: o.s ?? 6, rot0: ang, glow: o.glow || '#ffb040', glowA: 0.7, trail: o.trail ?? 3, delay: o.delay || 0, life: travel + (o.hold ?? 90), fout: 80, color: o.color, color2: o.color2, color3: o.color3, edge: o.edge });
  return (o.delay || 0) + travel;
}
// こぶしが あたった（丸い 衝撃波＋火花）
export function punchHit(c, t, d, o = {}) {
  const { k } = c;
  const r = (o.r || 12) * c.sz;
  const glow = o.glow || '#ffa040';
  k.impact(t.x, t.y, { r, glow, colors: o.colors || ['#ffffff', glow, '#ffe080'], delay: d, heavy: !!o.heavy });
  k.shockwave(t.x, t.y, { r0: 3, r1: r * 2.6, color: o.ring || '#ffffff', w: 2.2, delay: d, n: o.rings || 1, life: 300 });
}

// へらして よい つぶ（こまかい もの から）。大きな 絵（o2〜・ビーム・わ）・時計（call）・ゆれ・ひかりは へらさない
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal2', 'axShape', 'converge'];
// 段の つぶの かず に あわせる（もとからの 技の 予算 AX_BUDGET_ORIG）。minParts … なかまの 技で 下の 技より へらさない
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.tier] || AX_BUDGET_ORIG.advanced;
  const parts = c.dual ? AX_DUAL_PARTS_ORIG[2] : B.parts;
  const support = !!c.party;
  const lo = Math.max(Math.ceil(parts[0] * (support ? 0.5 : 1) * 1.1), o.minParts || 0);
  const hi = Math.floor(parts[1] * 0.97);
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
  // 少なすぎ: 余韻の きらきら（的の まわり）
  const cols = [o.color || '#ffffff', o.color2 || '#fff6b0', '#ffffff'];
  const t0 = c.hit, t1 = Math.max(c.hit + 60, c.len - 400);
  for (let i = 0; i < need; i++) {
    const t = c.targets[i % c.n];
    const x = Math.max(4, Math.min(c.W - 4, t.x + rnd(-30, 30))), y = Math.max(4, Math.min(c.H - 4, t.y + rnd(-26, 18)));
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
