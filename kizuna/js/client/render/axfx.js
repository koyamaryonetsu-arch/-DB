// 第48回: 大技の エフェクトの とうろく（axfx）。「ためる → はなつ」の 2だんの えんしゅつを まとめて うごかす
// ・グループの ファイル（render/ax-〜.js）は { anim: def } の かたまりを export する。この ファイルで
//   「import 1行 ＋ useAxGroup 1行」で とうろく（いちばん 下）
// ・def: { tier, charge: { kind, ms, color, color2, power, sfx }, hit, len, stagger, sfx, allyFx, party, pal, vars, abilities, play(fx, ctx) }
//   tier … 'basic' | 'advanced' | 'super' | 'legend'（ためかたの つよさ・長さ。abilities で 技ごとに かえられる）
//   charge … ためかた（axcharge.js）。false で ためない
//   hit … はなってから あたる まで（ms）。len … はなってから おわる まで（ms）。数 か ({ tier, n, all, crit, vars }) => 数
//   play(fx, ctx) … はなつ ところ。ctx の 時間は はなつ しゅんかんが 0（ためる 時間は 気に しない）
// ・battlefx.js の play() の いちばん はじめに playAxFx を よぶ。battle.js は axTiming で ダメージの 数を 出す 時間を きめる
// つかいかたは docs/plan-r48-fx-engine.md の「エンジンの使い方」。
import { playCharge, chargeMs, tierOf, kindOf, TIERS, TIER_K, CHARGE_KINDS, KIND_LOOK } from './axcharge.js?v=961a15d6120a';
import { bindKit, pal, rnd, lerp, clamp01, angleOf, centerOf, hitMark } from './axkit.js?v=961a15d6120a';

const AX = new Map();
// 技の id → { anim, over }（over … その 技だけの tier・charge・vars・element）
const BY_ABILITY = new Map();

const finite = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
const num = (v, info, d) => (typeof v === 'function' ? v(info) : v ?? d);

// 技の エフェクトを 1つ とうろく
export function registerAx(anim, def) {
  if (typeof anim !== 'string' || !anim) throw new Error('registerAx: anim の なまえが ない');
  if (!def || typeof def.play !== 'function') throw new Error(`registerAx(${anim}): play(fx, ctx) が ない`);
  if (AX.has(anim)) throw new Error(`registerAx(${anim}): おなじ なまえが もう ある`);
  if (def.tier && !TIERS.includes(def.tier)) throw new Error(`registerAx(${anim}): tier '${def.tier}' は ない（${TIERS.join('・')}）`);
  if (def.charge && def.charge.kind && !CHARGE_KINDS.includes(def.charge.kind)) throw new Error(`registerAx(${anim}): charge.kind '${def.charge.kind}' は ない（${CHARGE_KINDS.join('・')}）`);
  const d = {
    hit: 300, stagger: 60, ...def, anim, tier: def.tier || 'advanced',
    // charge を 書かなければ ふつうの ため（generic）。false で ためない
    charge: def.charge === false || def.charge === null ? null : { kind: 'generic', ...(def.charge || {}) },
  };
  const abil = def.abilities ? (Array.isArray(def.abilities) ? Object.fromEntries(def.abilities.map((id) => [id, {}])) : def.abilities) : {};
  for (const [id, o] of Object.entries(abil)) {
    if (BY_ABILITY.has(id)) throw new Error(`registerAx(${anim}): 技 ${id} は もう ${BY_ABILITY.get(id).anim} に ある`);
    const over = typeof o === 'string' ? { tier: o } : { ...(o || {}) };
    if (over.tier && !TIERS.includes(over.tier)) throw new Error(`registerAx(${anim}): 技 ${id} の tier '${over.tier}' は ない`);
    BY_ABILITY.set(id, { anim, over });
  }
  AX.set(anim, d);
  return d;
}
// グループ（{ anim: def, … }）を まとめて とうろく。へんじ: とうろくした anim の ならび
export function useAxGroup(name, defs) {
  const out = [];
  for (const [anim, def] of Object.entries(defs || {})) {
    registerAx(anim, { ...def, group: name });
    out.push(anim);
  }
  return out;
}

export const isAx = (anim) => typeof anim === 'string' && AX.has(anim);
export const axDef = (anim) => AX.get(anim) || null;
// とうろくした anim（prefix で しぼる）
export const axList = (prefix = '') => [...AX.keys()].filter((a) => a.startsWith(prefix));
// 技の id から anim（abilities に 書いた 技だけ）
export const axAnimFor = (ability) => (ability && BY_ABILITY.get(ability)?.anim) || null;
// 敵が 味方に つかった ときの 味方の まどの えんしゅつ（battle.js の allyFxKind）。ない ときは null
export const axAllyFx = (anim) => AX.get(anim)?.allyFx || null;
// 味方や 自分に かける 大わざ（画面の 下に 出す）
export const axIsParty = (anim) => !!AX.get(anim)?.party;

// 技ごとの ちがいを まぜた せってい { def, tier, charge, vars, element }
export function axResolve(anim, o = {}) {
  const d = AX.get(anim);
  if (!d) return null;
  const b = o.ability ? BY_ABILITY.get(o.ability) : null;
  const over = b && b.anim === anim ? b.over : {};
  const tier = tierOf(o.tier || over.tier || d.tier);
  let charge = d.charge ? { ...d.charge } : null;
  if (over.charge === false) charge = null;
  else if (over.charge) charge = { kind: 'generic', ...(charge || {}), ...over.charge };
  // ためしに ためかたを かえる（tools/fx-preview.mjs の --charge）
  if (o.chargeKind && CHARGE_KINDS.includes(o.chargeKind)) charge = { ...(charge || {}), kind: o.chargeKind, color: undefined, color2: undefined };
  return { def: d, tier, charge, vars: { ...(d.vars || {}), ...(over.vars || {}) }, element: over.element || d.element || null };
}

// 時間の けいさん（ms）。charge … ためる、hit … はじめから あたる まで、len … はなってから おわる まで、total … ぜんぶ
// 〜Real … たたかいの 速さ（tempo）で わった ほんとうの 時間
export function axTiming(anim, o = {}) {
  const R = axResolve(anim, o);
  if (!R) return null;
  const n = Math.max(1, Array.isArray(o.targets) ? o.targets.length : (o.targets | 0) || 1);
  const info = { tier: R.tier, n, all: n > 1, crit: !!o.crit, vars: R.vars };
  const charge = chargeMs(R.charge, R.tier);
  const release = Math.max(0, Math.round(num(R.def.hit, info, 300)));
  const len = Math.max(release + 120, Math.round(num(R.def.len, info, release + 500)));
  const tempo = Math.max(0.25, Math.min(4, o.tempo || 1));
  return {
    tier: R.tier, kind: R.charge ? kindOf(R.charge.kind) : null, charge, release, hit: charge + release, len, total: charge + len, tempo,
    chargeReal: Math.round(charge / tempo), hitReal: Math.round((charge + release) / tempo), totalReal: Math.round((charge + len) / tempo),
  };
}
// 行動の 名前の ふだと メッセージの じゅんばんを まつ 時間（ほんとうの ms）。ダメージが 出て すこし あと まで
export function axHoldMs(anim, o = {}) {
  const T = axTiming(anim, o);
  return T ? Math.round((T.hit + 350) / T.tempo) : 0;
}
// たたかいの 行動（ev）が つかう 大技の anim（なければ null）。技の id の とうろく → データの anim の じゅん
export function axEventAnim(ev) {
  if (!ev || ev.t !== 'act' || ev.fx?.type === 'attack') return null;
  return axAnimFor(ev.ability) || (isAx(ev.fx?.anim) ? ev.fx.anim : null);
}
// 敵が ためる ときの すがた（enemyfx.js の うごき 'buff' を ためる 時間 だけ）。へんじ: 0（まつ 時間は ためる ほうで）
export function axEnemyPose(actor, anim, o = {}) {
  const R = axResolve(anim, o);
  const T = axTiming(anim, o);
  if (!actor || !T || !T.charge) return 0;
  const col = R.charge?.color || KIND_LOOK[kindOf(R.charge?.kind)].color;
  actor.act = { kind: 'buff', age: 0, dur: T.charge + 120, color: /^#[0-9a-f]{6}$/i.test(col) ? col : '#ffd66b', boss: !!actor.boss };
  return 0;
}

// ctx（play の 2ばんめ）を つくる
function makeCtx(fx, anim, R, T, actor, pts, element, opts, W, H) {
  const d = R.def;
  const fromAlly = opts.fromAlly !== false;
  const n = pts.length, all = n > 1;
  const crit = !!opts.crit;
  const center = centerOf(pts);
  const stagger = d.stagger ?? 60;
  const P = d.pal ? (typeof d.pal === 'string' ? pal(d.pal) : d.pal) : pal(element || R.element || 'light');
  const ctx = {
    fx, k: bindKit(fx), anim, tier: R.tier, T: TIER_K[R.tier], power: TIER_K[R.tier] * (crit ? 1.15 : 1),
    vars: R.vars, ability: opts.ability || null, crit,
    from: actor, targets: pts, t: pts[0], center, n, all,
    element: element || R.element || null, pal: P,
    fromAlly, foe: !fromAlly, dir: fromAlly ? 'up' : 'down', ang: angleOf(actor, center),
    sz: (all ? 0.85 : 1) * (fromAlly ? 1 : 1.2) * (crit ? 1.15 : 1),
    hit: T.release, len: T.len, stagger, W, H,
    // fn(的, 何番め, ずらす ms)
    each(fn) { pts.forEach((t, i) => fn(t, i, all ? i * stagger : 0)); },
    at(ms, fn) { fx.at(ms, fn); },
    hitMark(t, delay = 0, colors = [P.glow], r = 14) { hitMark(fx, t.x, t.y, { r: r * ctx.sz, colors, delay }); },
    rnd, lerp, clamp01,
  };
  return ctx;
}

// battlefx.js の play() から よぶ。ax の anim で なければ false
// opts: { crit, fromAlly, from: { x, y, w, h, foot }, ability, tier・chargeKind（ためしに かえる）, sfx(id)（音を ならす）, actorImg（カットインの かげ） }
export function playAxFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const R = axResolve(anim, opts);
  if (!R) return false;
  const d = R.def;
  let pts = (targets || []).filter(finite).map((p) => ({ ...p }));
  if (!pts.length) {
    if (!d.party) return false;
    pts = [{ x: W / 2, y: H * 0.62 }];
  }
  const fromAlly = opts.fromAlly !== false;
  const src = finite(opts.from) ? opts.from : (fromAlly ? { x: W / 2, y: H - 10 } : { x: W / 2, y: H * 0.42 });
  // 味方は 画面の 下（からだは 画面の そと）。敵は え の まん中
  const actor = fromAlly
    ? { x: src.x, y: Math.min(H - 16, src.y - 4), w: 30, h: 32, foot: H + 2 }
    : { x: src.x, y: src.y, w: src.w || 32, h: src.h || 36, foot: src.foot ?? src.y + (src.h || 36) / 2 };
  const T = axTiming(anim, { ability: opts.ability, tier: opts.tier, chargeKind: opts.chargeKind, targets: pts.length, crit: opts.crit });
  const sfx = typeof opts.sfx === 'function' ? opts.sfx : null;
  const sound = (id, at) => {
    if (!sfx || !id) return;
    if (at > 0) fx.at(at, () => sfx(id));
    else sfx(id);
  };
  if (T.charge > 0) {
    const c = R.charge;
    playCharge(fx, actor, { kind: c.kind, tier: R.tier, ms: T.charge, color: c.color, color2: c.color2, power: c.power, foe: !fromAlly, img: opts.actorImg || null });
    sound(c.sfx || `ax_c_${kindOf(c.kind)}`, 0);
    if (R.tier === 'legend') sound('ax_c_legend', T.charge * 0.2);
  }
  const release = () => {
    const ctx = makeCtx(fx, anim, R, T, actor, pts, element, opts, W, H);
    try {
      d.play(fx, ctx);
    } catch (e) {
      console.error(`[axfx] ${anim}`, e);
      pts.forEach((t) => hitMark(fx, t.x, t.y, { delay: T.release }));
    }
  };
  sound(typeof d.sfx === 'string' ? d.sfx : d.sfx?.release, T.charge);
  if (T.charge > 0) fx.at(T.charge, release);
  else release();
  return true;
}

// ───────────── グループの とうろく（1グループ … import 1行 ＋ useAxGroup 1行。ほかの 行は さわらない） ─────────────
import { AX_DEMO } from './ax-demo.js?v=961a15d6120a';
useAxGroup('demo', AX_DEMO);
