// 第48回: 大技の まえの「ためる」えんしゅつ（axcharge）。だれが つかっても（味方・敵）その 人の ところに かく
// ・kind（ためかた）: ki・chakra・gomu・breath・sword・dragon・holy・magic・alchemy・idol・tech・ice・star・generic
// ・第49回（家族の 声）: 「気を ためる」のは ドラゴンボールだけ。顔の カットインは わかりにくい
//   ki … 黄色い オーラが つかった 人の まわりで もえあがる・火花・すこし ゆれる（段で すこし 大きく。legend は 小石が うく）
//   ほか … 作品らしい みじかい 構え（300ms まで。剣の きらり・まほうじん・チャクラ・呼吸の わ・アイドルの きらきら…）
//          つかった 人の まわりだけ（画面ぜんたいの くらさ・帯・ゆれ は なし）
//   どの 段でも カットインの 帯・かげ・はなつ 前の スローの ひかり・白い ひかりは なし
// ・時間は ms（エフェクトの 時計。たたかいの 速さは Effects.tempo が かける）
import { aura, gather, bolt, shapes, rnd } from './axkit.js?v=cc4d7c14aec3';
// 段階・ためかたの なまえ・ためる 時間は サーバーと おなじ 表（shared/ax-time.js）
import { AX_CHARGE_KINDS, AX_TIERS, AX_TIER_CHARGE_MS, AX_KI_CHARGE_MS, axTierOf, axKindOf, axChargeMs } from '../../shared/ax-time.js?v=cc4d7c14aec3';

export const CHARGE_KINDS = AX_CHARGE_KINDS;
export const TIERS = AX_TIERS;
// ためる 時間の 上限（ms）。構え（ki の ほか）と 気（ki）
export const TIER_CHARGE_MS = AX_TIER_CHARGE_MS;
export const KI_CHARGE_MS = AX_KI_CHARGE_MS;
// 段階の つよさ（つぶの かず・大きさ）
export const TIER_K = { basic: 0.75, advanced: 1, super: 1.3, legend: 1.65 };

// 気の 色（黄色・金。技の charge.color は 火花の さし色だけ）
export const KI_GOLD = { color: '#ffd23a', color2: '#fff6c8', deep: '#ff9a1a' };

// ためかたごとの 見た目（style … オーラの かたち、color … おもな 色、color2 … しんの 色、gather … あつまる つぶの 色）
export const KIND_LOOK = {
  ki: { style: 'flame', color: KI_GOLD.color, color2: KI_GOLD.color2, gather: ['#ffffff', '#fff6c8', '#ffd23a'] },
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

// ms の あいだ step ごとに fn(t)（さいごの 40ms は あける）
const every = (ms, step, fn, from = 0) => { for (let t = from; t < ms - 40; t += step) fn(t); };

// 構えの つぶ（オーラの ほかに。つかった 人の まわりだけ）。o: { ms, color, color2, k, r, h, foot, ti }
const STANCE_FX = {
  chakra(fx, P, o) {
    // からだの まわりを まわる チャクラ（ちらちら）
    fx.swirl(P.x, P.y + o.h * 0.1, [o.color, o.color2, '#ffffff'], { n: Math.round(8 + 4 * o.k), rad: o.r * 1.1, h: o.h, life: o.ms + 60, size: 1.2 });
  },
  gomu(fx, P, o) {
    // 湯気（シュウウ）と どくん（わ 1つ）
    every(o.ms, 60, (t) => fx.puff(P.x + rnd(-o.r, o.r), P.y + rnd(-o.h * 0.3, o.h * 0.4), { color: '#ffe8ee', r0: 2, r1: 6 + 2 * o.k, vx: rnd(-10, 10), vy: rnd(-40, -20), life: 360, alpha: 0.42, delay: t }));
    fx.shock(P.x, P.y, { r0: o.r * 0.6, r1: o.r * 1.8, color: o.color, w: 1.6, delay: o.ms * 0.3, life: 260 });
  },
  breath(fx, P, o) {
    // すいこむ 空気（口もとに あつまる）＋ 白い 息
    every(o.ms, 60, (t) => fx.converge(P.x, P.y - o.h * 0.35, { colors: [o.color2, '#ffffff'], n: 3, r: 30, life: 220, delay: t, size: 0.7 }));
    fx.puff(P.x, P.y - o.h * 0.3, { color: o.color2, r0: 2, r1: 8, vy: -18, life: 320, alpha: 0.35, delay: o.ms * 0.4 });
  },
  sword(fx, P, o) {
    // 刀身の きらり（ななめの 光）
    every(o.ms, 110, (t) => fx.cut(P.x + rnd(-o.r, o.r), P.y + rnd(-o.h * 0.5, o.h * 0.2), { ang: rnd(-1.2, 1.2), len: 10 + 3 * o.k, w: 0.8, color: '#ffffff', glow: o.color, life: 150, delay: t }), o.ms * 0.15);
    fx.gust(P.x - 18, P.y + rnd(-o.h * 0.3, o.h * 0.2), { len: 36, amp: 2, color: o.color2, w: 0.7, dir: 1, delay: 0, life: Math.min(300, o.ms + 80) });
  },
  dragon(fx, P, o) {
    every(o.ms, 80, (t) => fx.sparks(P.x + rnd(-o.r, o.r), P.y + o.h * 0.3, { colors: [o.color2, o.color], n: 2, speed: 50, ang: -Math.PI / 2, spread: 0.4, g: -90, life: 360, delay: t, len: 5 }));
    fx.shock(P.x, P.y - o.h * 0.6, { r0: 4, r1: 26 * o.k, color: o.color, w: 1.4, delay: o.ms * 0.4, life: 260 });
  },
  holy(fx, P, o) {
    every(o.ms, 60, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.3, P.y - o.h * 0.6 - rnd(0, 12), { color: Math.random() < 0.5 ? '#ffffff' : o.color, size: rnd(2.5, 4), vy: rnd(18, 34), life: 380, delay: t }));
  },
  magic(fx, P, o) {
    every(o.ms, 80, (t) => shapes(fx, P.x + rnd(-o.r, o.r), P.y + o.h * 0.4, { shape: 'diamond', n: 1, colors: [o.color, o.color2], speed: 30, ang: -Math.PI / 2, spread: 0.3, g: -40, size: 1.3, life: 420, delay: t }));
  },
  alchemy(fx, P, o) {
    every(o.ms, 80, (t) => {
      const ax = P.x + rnd(-o.r, o.r) * 1.2, ay = P.y + o.h * 0.45;
      bolt(fx, ax, ay, ax + rnd(-8, 8), ay - rnd(6, 16), { w: 0.9, color: '#e8fbff', glow: o.color, forks: 1, n: 5, amp: 3, life: 130, grow: 25, delay: t });
    }, o.ms * 0.1);
  },
  idol(fx, P, o) {
    every(o.ms, 80, (t) => shapes(fx, P.x + rnd(-o.r, o.r), P.y, { shape: Math.random() < 0.7 ? 'heart' : 'note', n: 1, colors: [o.color, '#ffe066', o.color2], speed: 26, ang: -Math.PI / 2, spread: 0.5, g: -30, size: 2, life: 480, delay: t, add: false }));
    every(o.ms, 70, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.3, P.y + rnd(-o.h * 0.7, o.h * 0.3), { color: '#ffffff', size: rnd(3, 4.5), life: 240, delay: t }));
  },
  tech(fx, P, o) {
    every(o.ms, 90, (t) => fx.puff(P.x + rnd(-o.r, o.r), P.y + o.h * 0.4, { color: '#c8c8d8', r0: 3, r1: 9, vx: rnd(-14, 14), vy: rnd(-22, -8), life: 420, alpha: 0.45, delay: t }));
    fx.twinkle(P.x + rnd(-o.r, o.r) * 0.6, P.y - o.h * 0.3, { color: '#ffffff', size: 4, life: 220, delay: o.ms * 0.4 });
  },
  ice(fx, P, o) {
    every(o.ms, 80, (t) => fx.puff(P.x + rnd(-o.r, o.r) * 1.2, P.y + o.h * 0.45, { color: '#e6fbff', r0: 2, r1: 8, vx: rnd(-12, 12), vy: rnd(-12, -4), life: 400, alpha: 0.35, delay: t }));
    every(o.ms, 70, (t) => shapes(fx, P.x + rnd(-o.r, o.r) * 1.4, P.y - o.h * 0.6, { shape: 'flake', n: 1, colors: ['#ffffff', o.color], speed: 16, ang: Math.PI / 2, spread: 0.4, g: 10, size: 2, life: 460, delay: t }));
  },
  star(fx, P, o) {
    every(o.ms, 70, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.5, P.y + rnd(-o.h * 0.8, o.h * 0.4), { color: Math.random() < 0.5 ? '#ffffff' : o.color, size: rnd(3, 5), life: 280, delay: t }));
    shapes(fx, P.x, P.y, { shape: 'star', n: 3, colors: [o.color, '#ffffff'], speed: 40, size: 1.8, life: 380, delay: o.ms * 0.3 });
  },
  generic(fx, P, o) {
    every(o.ms, 80, (t) => fx.twinkle(P.x + rnd(-o.r, o.r) * 1.3, P.y + rnd(-o.h * 0.5, o.h * 0.3), { color: o.color2, size: rnd(2.5, 4), life: 260, delay: t }));
  },
};

// 段階を たしかめる（しらない ものは advanced）
export const tierOf = axTierOf;
export const kindOf = axKindOf;
// ためる 時間（ms。エフェクトの 時計）。charge が ない・false なら 0。上限で きる（ki の ほかは 300ms まで）
export const chargeMs = axChargeMs;

// 気（ドラゴンボール）: 黄色い オーラ・のぼる 火花・足もとの 気の わ・すこし ゆれる（legend は 小石が うく）
function playKi(fx, P, o) {
  const { ms, ti, r, h, foot, accent } = o;
  const g = 0.85 + 0.12 * ti; // 段で すこし 大きく（advanced < super < legend）
  const R = r * g, HH = h * g;
  const ak = 0.7 + 0.15 * ti;
  // からだが すけて 見える うすさ（味方は まどの 上、敵は え に かさなる）
  aura(fx, P.x, P.y, { style: 'flame', r: R, h: HH, color: KI_GOLD.color, color2: KI_GOLD.color2, life: ms + 40, k: ak, alpha: 0.5 + 0.05 * ti });
  // 外がわの うすい ゆらめき（super から）
  if (ti >= 2) aura(fx, P.x, P.y, { style: 'flame', r: R * 1.2, h: HH * 1.08, color: KI_GOLD.deep, color2: KI_GOLD.color, life: ms + 20, k: ak * 0.8, alpha: 0.3 });
  // のぼる 火花（黄色・白）。技の 色は さし色に すこし
  every(ms, 60, (t) => fx.sparks(P.x + rnd(-R, R) * 0.9, P.y + HH * 0.35, { colors: ['#ffffff', KI_GOLD.color2, KI_GOLD.color], n: 1 + ti, speed: 70 + 10 * ti, ang: -Math.PI / 2, spread: 0.25, g: -140, drag: 0.98, life: 380, delay: t, len: 6 }));
  if (accent) every(ms, 150, (t) => fx.sparks(P.x + rnd(-R, R) * 0.7, P.y + HH * 0.3, { colors: [accent, '#ffffff'], n: 1, speed: 60, ang: -Math.PI / 2, spread: 0.3, g: -120, life: 340, delay: t, len: 5 }), 60);
  // 足もとに ひろがる 気の わ
  every(ms, 240, (t) => fx.shock(P.x, foot, { r0: 4, r1: R * 2.2, sy: 0.3, color: KI_GOLD.color, w: 1.2, delay: t, life: 360 }), ms * 0.15);
  // バチバチ（super から。からだの まわりだけ）
  if (ti >= 2) every(ms, 160, (t) => {
    const ax = P.x + rnd(-R, R), ay = P.y + rnd(-HH * 0.5, HH * 0.3);
    bolt(fx, ax, ay, ax + rnd(-7, 7), ay + rnd(-9, 5), { w: 0.7, color: '#ffffff', glow: KI_GOLD.color, forks: 0, n: 4, amp: 3, life: 110, grow: 20, delay: t });
  }, ms * 0.3);
  // あつまる ひかり（小さく）
  gather(fx, P.x, P.y, { colors: KIND_LOOK.ki.gather, n: Math.round(5 + 2 * ti), r: 22 + 5 * ti, life: 260, waves: Math.max(1, Math.floor((ms - 200) / 200)), gap: 200 });
  // すこし ゆれる（advanced から。legend は もうすこし）
  const amp = [0, 0.25, 0.35, 0.6][ti];
  if (amp) fx.hitStop(Math.round(ms * 0.85), Math.round(ms * 0.1), amp);
  // legend: 小石が すこし うく
  if (ti === 3) {
    for (let i = 0; i < 4; i++) {
      const t = rnd(0, ms * 0.4);
      fx.add({ kind: 'axShape', shape: 'rock', x: P.x + rnd(-R * 1.6, R * 1.6), y: foot - rnd(0, 3), vx: rnd(-3, 3), vy: rnd(-26, -12), g: 0, drag: 1, color: ['#a08060', '#6a5040', '#d8c0a0'][i % 3], size: rnd(1, 1.8), rot0: rnd(0, 6), spin: rnd(-2, 2), delay: t, life: ms - t + 120, add: false, pop: false });
    }
  }
  // はなつ しゅんかん
  fx.glow(P.x, P.y, { color: KI_GOLD.color, r: R * 2.2, delay: Math.max(0, ms - 50), life: 220, alpha: 0.9 });
  burst(fx, P, ms, ti, ['#ffffff', KI_GOLD.color2, KI_GOLD.color], R, o.bk);
}

// はなつ しゅんかんに つかった 人の まわりで はじける 火花・きらきら（からだの まわりだけ。はなつ えんしゅつの はじまり）
function burst(fx, P, ms, ti, colors, r, bk = 1) {
  if (!(bk > 0)) return;
  const d = Math.max(0, ms - 30);
  fx.sparks(P.x, P.y, { colors, n: Math.round((9 + 5 * ti) * bk), speed: 90 + 20 * ti, ang: -Math.PI / 2, spread: 1.4, g: 60, drag: 0.94, life: 340, delay: d, len: 6 });
  for (let i = 0; i < Math.round((2 + ti) * bk); i++) fx.twinkle(P.x + rnd(-r, r) * 1.2, P.y + rnd(-r, r * 0.4), { color: colors[i % colors.length], size: rnd(2.5, 4), life: 320, delay: d + i * 20 });
}

// 構え（ki の ほか）: みじかい オーラ＋作品らしい つぶ。つかった 人の まわりだけ
function playStance(fx, P, o) {
  const { ms, ti, r, foot, color, color2, kind } = o;
  const L = KIND_LOOK[kind];
  aura(fx, P.x, P.y, { style: L.style, variant: L.variant, r: o.r, h: o.h, color, color2, life: ms + 40, k: o.k });
  STANCE_FX[kind](fx, P, o);
  if (ms >= 150) gather(fx, P.x, P.y, { colors: L.gather, n: Math.round(4 + 2 * ti), r: 20 + 4 * ti, life: Math.min(240, ms), waves: 1 });
  // advanced から: あしもとに わ 1つ
  if (ti >= 1) fx.shock(P.x, foot, { r0: 4, r1: r * 2, sy: 0.3, color, w: 1, delay: 0, life: Math.min(320, ms + 60) });
  // はなつ しゅんかん
  fx.glow(P.x, P.y, { color, r: r * 2, delay: Math.max(0, ms - 50), life: 200, alpha: 0.8 });
  burst(fx, P, ms, ti, ['#ffffff', color2, color], r, o.bk);
}

// ためる えんしゅつを はじめる。P … ためる 人の いち { x, y, w, h, foot }（y は からだの まん中）
// o: { kind, tier, ms, color, color2, foe（敵が ためる）, power（つよさの かけざん）, n（的の かず） }
// へんじ: ためる 時間（ms。この 時間に はなつ。上限で きる）
export function playCharge(fx, P, o = {}) {
  const kind = kindOf(o.kind);
  const tier = tierOf(o.tier);
  const ti = TIERS.indexOf(tier);
  const ms = axChargeMs({ kind, ms: o.ms }, tier);
  if (!ms || !P || !Number.isFinite(P.x) || !Number.isFinite(P.y)) return 0;
  const L = KIND_LOOK[kind];
  const H = fx.H || 144;
  const h = P.h || 30;
  const r = Math.max(10, Math.min(30, (P.w || 22) * 0.5));
  const foot = Math.min(H - 3, P.foot ?? P.y + h * 0.5);
  // はなつ ときの 火花は 的が おおい ほど ひかえめ（はなつ えんしゅつが にぎやかな ので）
  const n = Math.max(1, o.n || 1);
  const bk = n >= 3 ? 0 : n === 2 ? 0.6 : 1;
  if (kind === 'ki') {
    const accent = /^#[0-9a-f]{6}$/i.test(o.color || '') && o.color.toLowerCase() !== KI_GOLD.color ? o.color : null;
    playKi(fx, P, { ms, ti, r, h, foot, accent, bk });
  } else {
    // 構えは 段で ほとんど かわらない（すこし だけ つよく）
    const k = Math.min(1.15, 0.8 + 0.12 * ti) * Math.min(1.3, o.power || 1);
    playStance(fx, P, { kind, ms, ti, k, r, h, foot, bk, color: o.color || L.color, color2: o.color2 || L.color2 });
  }
  return ms;
}
