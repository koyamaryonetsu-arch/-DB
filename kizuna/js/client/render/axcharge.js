// 第48回: 大技の まえの「気を ためる」えんしゅつ（axcharge）。だれが つかっても（味方・敵）その 人の ところに かく
// ・kind（ためかた）: ki・chakra・gomu・breath・sword・dragon・holy・magic・alchemy・idol・tech・ice・star・generic
// ・tier（段階）: basic（みじかい）→ advanced → super（画面が くらく・すこし ゆれる・じめんの いしが うく）
//                → legend（さらに カットインの 帯・つよい ゆれ・はなつ 直前の スローモーションの ひかり）
// ・時間は ms（エフェクトの 時計。たたかいの 速さは Effects.tempo が かける）
import { aura, gather, bolt, tint, cutIn, shapes, pillar, rnd, mixHex } from './axkit.js?v=f7adbedf412d';
// 段階・ためかたの なまえ・ためる 時間は サーバーと おなじ 表（shared/ax-time.js）
import { AX_CHARGE_KINDS, AX_TIERS, AX_TIER_CHARGE_MS, axTierOf, axKindOf, axChargeMs } from '../../shared/ax-time.js?v=f7adbedf412d';

export const CHARGE_KINDS = AX_CHARGE_KINDS;
export const TIERS = AX_TIERS;
// ためる 時間（ms。def.charge.ms で かえられる）
export const TIER_CHARGE_MS = AX_TIER_CHARGE_MS;
// 段階の つよさ（つぶの かず・大きさ）
export const TIER_K = { basic: 0.75, advanced: 1, super: 1.3, legend: 1.65 };

// ためかたごとの 見た目（style … オーラの かたち、color … おもな 色、color2 … しんの 色、gather … あつまる つぶの 色）
export const KIND_LOOK = {
  ki: { style: 'flame', color: '#4ab8ff', color2: '#e8f8ff', gather: ['#ffffff', '#a8e4ff', '#4ab8ff'] },
  chakra: { style: 'swirl', color: '#3a8cff', color2: '#c8f0ff', gather: ['#c8f0ff', '#6ab8ff', '#ffffff'] },
  gomu: { style: 'gomu', color: '#ff6a8a', color2: '#ffd0dc', gather: ['#ffd0dc', '#ff9ab0', '#ffffff'] },
  breath: { style: 'rings', color: '#ff8a3a', color2: '#ffe0a0', gather: ['#ffffff', '#ffe0a0', '#ffb070'] },
  sword: { style: 'glint', color: '#9ad8ff', color2: '#e8f6ff', gather: ['#ffffff', '#cfeaff'] },
  dragon: { style: 'crest', color: '#5ad0ff', color2: '#e8fbff', gather: ['#e8fbff', '#5ad0ff', '#ffffff'] },
  holy: { style: 'ribbons', color: '#ffe08a', color2: '#ffffff', gather: ['#ffffff', '#fff6c8', '#ffe08a'] },
  magic: { style: 'glyph', variant: 'magic', color: '#b08aff', color2: '#f0e8ff', gather: ['#f0e8ff', '#c8a8ff', '#ffffff'] },
  alchemy: { style: 'glyph', variant: 'alchemy', color: '#4ad8ff', color2: '#e8fbff', gather: ['#e8fbff', '#7ae0ff', '#ffffff'] },
  idol: { style: 'spot', color: '#ff7ad8', color2: '#9ad1ff', gather: ['#ffffff', '#ffb0ec', '#ffe066'] },
  tech: { style: 'cards', color: '#e04848', color2: '#2a2a6a', gather: ['#ffffff', '#ffd66b'] },
  ice: { style: 'snow', color: '#9ae6ff', color2: '#ffffff', gather: ['#ffffff', '#c8f0ff', '#9ae6ff'] },
  star: { style: 'star', color: '#ffe066', color2: '#ffffff', gather: ['#ffffff', '#fff6b0', '#ffe066'] },
  generic: { style: 'pulse', color: '#fff6b0', color2: '#ffffff', gather: ['#ffffff', '#fff6b0'] },
};

// ms の あいだ step ごとに fn(t)（さいごの 60ms は あける）
const every = (ms, step, fn, from = 0) => { for (let t = from; t < ms - 60; t += step) fn(t); };

// ためかたごとの つぶ（オーラの ほかに）。o: { ms, color, color2, k, r, h, foot, ti }
const KIND_FX = {
  ki(fx, P, o) {
    every(o.ms, 80, (t) => fx.sparks(P.x + rnd(-o.r, o.r), P.y + o.h * 0.4, { colors: [o.color2, o.color], n: Math.round(1 + o.k * 1.5), speed: 80, ang: -Math.PI / 2, spread: 0.25, g: -140, drag: 0.98, life: 420, delay: t, len: 7 }));
    // 金色の 気が バチバチ（super から）
    if (o.ti >= 2) every(o.ms, 170, (t) => {
      const ax = P.x + rnd(-o.r, o.r) * 1.1, ay = P.y + rnd(-o.h * 0.5, o.h * 0.4);
      bolt(fx, ax, ay, ax + rnd(-8, 8), ay + rnd(-10, 6), { w: 0.7, color: '#ffffff', glow: o.color, forks: 0, n: 4, amp: 3, life: 120, grow: 20, delay: t });
    }, o.ms * 0.3);
  },
  chakra(fx, P, o) {
    fx.swirl(P.x, P.y + o.h * 0.1, [o.color, o.color2, '#ffffff'], { n: Math.round(12 + 8 * o.k), rad: o.r * 1.2, h: o.h * 1.1, life: o.ms * 0.85, size: 1.3 });
  },
  gomu(fx, P, o) {
    // 湯気（シュウウ）と どくん どくん
    every(o.ms, 70, (t) => fx.puff(P.x + rnd(-o.r, o.r), P.y + rnd(-o.h * 0.3, o.h * 0.4), { color: '#ffe8ee', r0: 2, r1: 7 + 2 * o.k, vx: rnd(-10, 10), vy: rnd(-40, -20), life: 520, alpha: 0.42, delay: t }));
    every(o.ms, Math.max(160, o.ms / 3), (t) => fx.shock(P.x, P.y, { r0: o.r * 0.6, r1: o.r * 2, color: o.color, w: 1.6, delay: t + 60, life: 300 }));
  },
  breath(fx, P, o) {
    // すいこむ 空気（口もとに あつまる）
    every(o.ms, 70, (t) => fx.converge(P.x, P.y - o.h * 0.35, { colors: [o.color2, '#ffffff'], n: 3, r: 50, life: 260, delay: t, size: 0.7 }));
    every(o.ms, 260, (t) => fx.puff(P.x, P.y - o.h * 0.3, { color: o.color2, r0: 2, r1: 9, vy: -18, life: 420, alpha: 0.35, delay: t }), o.ms * 0.4);
  },
  sword(fx, P, o) {
    every(o.ms, 150, (t) => fx.cut(P.x + rnd(-o.r, o.r) * 1.3, P.y + rnd(-o.h * 0.6, o.h * 0.2), { ang: rnd(-1.2, 1.2), len: 12 + 4 * o.k, w: 0.8, color: '#ffffff', glow: o.color, life: 170, delay: t }), o.ms * 0.2);
    every(o.ms, 120, (t) => fx.gust(P.x - 30, P.y + rnd(-o.h * 0.4, o.h * 0.3), { len: 60, amp: 2, color: o.color2, w: 0.7, dir: 1, delay: t, life: 300 }));
  },
  dragon(fx, P, o) {
    every(o.ms, 90, (t) => fx.sparks(P.x + rnd(-o.r, o.r), P.y + o.h * 0.3, { colors: [o.color2, o.color], n: 2, speed: 60, ang: -Math.PI / 2, spread: 0.4, g: -90, life: 460, delay: t, len: 5 }));
    fx.shock(P.x, P.y - o.h * 0.6, { r0: 4, r1: 40 * o.k, color: o.color, w: 1.6, delay: o.ms * 0.5, life: 380 });
  },
  holy(fx, P, o) {
    every(o.ms, 80, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.6, P.y - o.h * 0.9 - rnd(0, 18), { color: Math.random() < 0.5 ? '#ffffff' : o.color, size: rnd(2.5, 4.5), vy: rnd(18, 34), life: 520, delay: t }));
    if (o.ti >= 2) pillar(fx, P.x, P.y + o.h * 0.5, { w: 3 + 2 * o.k, color: o.color, glow: o.color2, delay: o.ms * 0.25, life: o.ms * 0.75, burst: false, alpha: 0.4, widths: [0.3, 1, 0.8, 1, 0.6] });
  },
  magic(fx, P, o) {
    every(o.ms, 110, (t) => shapes(fx, P.x + rnd(-o.r, o.r), P.y + o.h * 0.45, { shape: 'diamond', n: 1, colors: [o.color, o.color2], speed: 30, ang: -Math.PI / 2, spread: 0.3, g: -40, size: 1.4, life: 600, delay: t }));
  },
  alchemy(fx, P, o) {
    every(o.ms, 110, (t) => {
      const ax = P.x + rnd(-o.r, o.r) * 1.4, ay = P.y + o.h * 0.5;
      bolt(fx, ax, ay, ax + rnd(-10, 10), ay - rnd(8, 22), { w: 0.9, color: '#e8fbff', glow: o.color, forks: 1, n: 5, amp: 4, life: 150, grow: 25, delay: t });
    }, o.ms * 0.15);
  },
  idol(fx, P, o) {
    every(o.ms, 110, (t) => shapes(fx, P.x + rnd(-o.r, o.r), P.y, { shape: Math.random() < 0.7 ? 'heart' : 'note', n: 1, colors: [o.color, '#ffe066', o.color2], speed: 26, ang: -Math.PI / 2, spread: 0.5, g: -30, size: 2.2, life: 700, delay: t, add: false }));
    every(o.ms, 140, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.6, P.y + rnd(-o.h, o.h * 0.3), { color: '#ffffff', size: rnd(3, 5), life: 300, delay: t }));
  },
  tech(fx, P, o) {
    every(o.ms, 120, (t) => fx.puff(P.x + rnd(-o.r, o.r) * 1.3, P.y + o.h * 0.4, { color: '#c8c8d8', r0: 3, r1: 11, vx: rnd(-14, 14), vy: rnd(-22, -8), life: 600, alpha: 0.45, delay: t }));
    fx.puff(P.x, P.y, { color: '#e8e8f0', r0: 4, r1: 22 * o.k, life: 420, alpha: 0.6, delay: Math.max(0, o.ms - 320) });
  },
  ice(fx, P, o) {
    every(o.ms, 100, (t) => fx.puff(P.x + rnd(-o.r, o.r) * 1.4, P.y + o.h * 0.45, { color: '#e6fbff', r0: 2, r1: 9, vx: rnd(-12, 12), vy: rnd(-12, -4), life: 560, alpha: 0.35, delay: t }));
    every(o.ms, 90, (t) => shapes(fx, P.x + rnd(-o.r, o.r) * 1.8, P.y - o.h * 0.8, { shape: 'flake', n: 1, colors: ['#ffffff', o.color], speed: 16, ang: Math.PI / 2, spread: 0.4, g: 10, size: 2.2, life: 700, delay: t }));
  },
  star(fx, P, o) {
    every(o.ms, 100, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 2, P.y + rnd(-o.h, o.h * 0.4), { color: Math.random() < 0.5 ? '#ffffff' : o.color, size: rnd(3, 6), life: 360, delay: t }));
    every(o.ms, 240, (t) => shapes(fx, P.x, P.y, { shape: 'star', n: 3, colors: [o.color, '#ffffff'], speed: 50, size: 2, life: 500, delay: t }));
  },
  generic(fx, P, o) {
    every(o.ms, 120, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.5, P.y + rnd(-o.h * 0.6, o.h * 0.3), { color: o.color2, size: rnd(2.5, 4), life: 300, delay: t }));
  },
};

// 段階を たしかめる（しらない ものは advanced）
export const tierOf = axTierOf;
export const kindOf = axKindOf;
// ためる 時間（ms。エフェクトの 時計）。charge が ない・false なら 0
export const chargeMs = axChargeMs;

// ためる えんしゅつを はじめる。P … ためる 人の いち { x, y, w, h, foot }（y は からだの まん中）
// o: { kind, tier, ms, color, color2, foe（敵が ためる）, img（カットインの かげ）, power（つよさの かけざん）, repeat（2回目: カットイン なし） }
// へんじ: ためる 時間（ms。この 時間に はなつ）
export function playCharge(fx, P, o = {}) {
  const kind = kindOf(o.kind);
  const tier = tierOf(o.tier);
  const ti = TIERS.indexOf(tier);
  const ms = Math.max(0, Math.round(o.ms ?? TIER_CHARGE_MS[tier]));
  if (!ms || !P || !Number.isFinite(P.x) || !Number.isFinite(P.y)) return 0;
  const L = KIND_LOOK[kind];
  const color = o.color || L.color, color2 = o.color2 || L.color2;
  const k = TIER_K[tier] * (o.power || 1);
  const H = fx.H || 144;
  const foe = !!o.foe;
  const h = P.h || 30;
  const r = Math.max(10, Math.min(36, (P.w || 22) * 0.55));
  const foot = Math.min(H - 3, P.foot ?? P.y + h * 0.5);
  const oo = { ms, color, color2, k, r, h, foot, ti };
  // super から: 画面が くらく（オーラより 先に たして 下に かく）
  if (ti >= 2) tint(fx, '#04020c', { a: ti === 3 ? 0.62 : 0.46, life: ms + 60, fin: ms * 0.3, fout: 140 });
  // 味方は 画面に からだが ないので、うしろ すがたの かげを 出す（advanced から）
  if (!foe && ti >= 1) fx.add({ kind: 'axFigure', x: P.x, y: P.y + h * 0.2, color, dark: mixHex(color, '#05050c', 0.86), s: 1.4 + 0.15 * ti, k, life: ms + 80, seed: Math.random() * 100 });
  aura(fx, P.x, P.y, { style: L.style, variant: L.variant, r, h, color, color2, life: ms + 40, k });
  KIND_FX[kind](fx, P, oo);
  // あつまる ひかり
  const waves = Math.max(1, Math.floor((ms - 260) / 150));
  gather(fx, P.x, P.y, { colors: L.gather, n: Math.round(5 + 5 * k), r: 30 + 14 * k, life: 300, waves, gap: 150 });
  // advanced から: あしもとに ひろがる わ
  if (ti >= 1) every(ms, 300, (t) => fx.shock(P.x, foot, { r0: 4, r1: r * 2.4, sy: 0.3, color, w: 1.2, delay: t, life: 420 }), ms * 0.2);
  // super から: 小さく ゆれる・じめんの いしが うく
  if (ti >= 2) {
    if (ti === 2) fx.hitStop(ms * 0.85, ms * 0.12, 0.35);
    else { fx.hitStop(ms * 0.3, ms * 0.08, 0.45); fx.hitStop(ms * 0.32, ms * 0.38, 0.85); fx.hitStop(ms * 0.3, ms * 0.7, 1.35); }
    const n = Math.round(5 * k);
    for (let i = 0; i < n; i++) {
      const t = rnd(0, ms * 0.5);
      fx.add({ kind: 'axShape', shape: 'rock', x: P.x + rnd(-r * 2.6, r * 2.6), y: foot - rnd(0, 3), vx: rnd(-4, 4), vy: rnd(-30, -12), g: 0, drag: 1, color: ['#a08060', '#6a5040', '#d8c0a0'][i % 3], size: rnd(1, 2.3), rot0: rnd(0, 6), spin: rnd(-2, 2), delay: t, life: ms - t + 160, add: false, pop: false });
    }
    every(ms, 260, (t) => fx.puff(P.x + rnd(-r, r) * 2, foot, { color: '#b8a890', r0: 2, r1: 9, vx: rnd(-20, 20), vy: -6, life: 500, alpha: 0.35, delay: t }), ms * 0.15);
  }
  // legend: カットインの 帯・はなつ 直前の スローモーションの ひかり・はなつ ときに 白く ひかる
  if (ti === 3) {
    const band = mixHex(/^#[0-9a-f]{6}$/i.test(color) ? color : '#4ab8ff', '#02030a', 0.8);
    if (!o.repeat) cutIn(fx, { color, color2: band, dark: mixHex(band, '#000000', 0.5), img: o.img || null, delay: ms * 0.2, life: ms * 0.5, y: H * 0.4, h: 46, dir: foe ? -1 : 1 });
    const fz = Math.min(240, ms * 0.2);
    fx.add({ kind: 'axFreeze', x: P.x, y: P.y, color, delay: ms - fz, life: fz, top: true, seed: Math.random() * 100 });
    fx.flashAt(150, '#ffffff', ms);
    fx.shock(P.x, P.y, { r0: r, r1: 130, color, w: 3, delay: ms, life: 420 });
  }
  // はなつ しゅんかん（どの 段階でも）
  fx.glow(P.x, P.y, { color, r: r * 2.6, delay: Math.max(0, ms - 50), life: 240, alpha: 0.95 });
  return ms;
}
