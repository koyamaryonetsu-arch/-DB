// 第48回: 大技の エフェクトの とうろく（axfx）。「ためる → はなつ」の 2だんの えんしゅつを まとめて うごかす
// ・グループの ファイル（render/axfx-g1.js 〜 g6.js。第49回の もとからの 技は axfx-o1.js 〜 o6.js・anim は ox_〜）は { anim: def } の かたまりを export する。この ファイルの いちばん 下で とうろく
//   （G0 が 6行 書いて ある。グループは この ファイルを さわらない）
// ・def: { tier, charge: { kind, ms, color, color2, power, sfx }, hit, len, stagger, sfx, allyFx, party, pal, vars, abilities, play(fx, ctx) }
//   tier … 'basic' | 'advanced' | 'super' | 'legend'（ためかたの つよさ・長さ。abilities で 技ごとに かえられる）
//   charge … ためかた（axcharge.js）。false で ためない
//   hit … はなってから あたる まで（ms）。len … はなってから おわる まで（ms）。数 か ({ tier, n, all, crit, vars }) => 数
//   play(fx, ctx) … はなつ ところ。ctx の 時間は はなつ しゅんかんが 0（ためる 時間は 気に しない）
// ・グループ（g1〜g6）の anim は 時間（tier・charge.kind/ms・hit・len・stagger・party）と 技の つなぎを shared/data/ax-time-gN.js に 書く
//   （サーバーも おなじ 数で 待つ。shared/ax-time.js）。def には 見た目だけ（charge の 色・sfx・allyFx・pal・vars・play）
// ・battlefx.js の play() の いちばん はじめに playAxFx を よぶ。battle.js は axTiming で ダメージの 数を 出す 時間を きめる
// つかいかたは docs/plan-r48-fx-engine.md の「エンジンの使い方」と docs/plan-r48-fx.md の「G0 の 決めごと」。
import { playCharge, TIERS, TIER_K, CHARGE_KINDS, KIND_LOOK } from './axcharge.js?v=acb97b73a32c';
import { bindKit, pal, rnd, lerp, clamp01, angleOf, centerOf, hitMark, AX_FINE } from './axkit.js?v=acb97b73a32c';
import { AX_TIME, AX_SPREAD_MAX, axSkill, axTimes, axTs, axResolveCharge, axKindOf, axGroupOf, AX_GROUP_IDS } from '../../shared/ax-time.js?v=acb97b73a32c';

const AX = new Map();
// 技の id → { anim, over }（over … その 技だけの tier・charge・vars・element）。def の abilities（shared に ない もの）
const BY_ABILITY = new Map();
// グループごとの つぶの かきかた（なまえ → グループ）
const FINE_OWNER = new Map();

const finite = (p) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y);
// 時間の キー（グループの anim は shared/data/ax-time-gN.js に 書く）
const TIME_KEYS = ['tier', 'hit', 'len', 'stagger', 'party', 'abilities'];

// 技の エフェクトを 1つ とうろく
export function registerAx(anim, def) {
  if (typeof anim !== 'string' || !anim) throw new Error('registerAx: anim の なまえが ない');
  if (!def || typeof def.play !== 'function') throw new Error(`registerAx(${anim}): play(fx, ctx) が ない`);
  if (AX.has(anim)) throw new Error(`registerAx(${anim}): おなじ なまえが もう ある`);
  const time = AX_TIME[anim];
  if (time) {
    // 時間は 表（サーバーと おなじ）から。def に 書いて あったら まちがい
    const where = `shared/data/ax-time-${axGroupOf(anim)}.js`;
    for (const k of TIME_KEYS) if (def[k] !== undefined) throw new Error(`registerAx(${anim}): ${k} は ${where} に 書く（def には 書かない）`);
    if (def.charge === false || (def.charge && (def.charge.ms !== undefined || def.charge.kind !== undefined))) throw new Error(`registerAx(${anim}): charge の kind・ms・false は ${where} に 書く（def の charge は 色・power・sfx だけ）`);
    if (def.group && axGroupOf(anim) !== def.group) throw new Error(`registerAx(${anim}): 時間の 表は ${axGroupOf(anim)}、え は ${def.group}`);
    def = {
      ...def, tier: time.tier, hit: time.hit, len: time.len, stagger: time.stagger, party: !!time.party,
      vars: { ...(time.vars || {}), ...(def.vars || {}) },
      charge: time.charge === false || time.charge === null ? false : { ...(time.charge || {}), ...(def.charge || {}) },
    };
  } else if (def.group && AX_GROUP_IDS.includes(def.group)) {
    throw new Error(`registerAx(${anim}): グループ ${def.group} の anim は shared/data/ax-time-${def.group}.js の AX_TIME_${def.group.toUpperCase()} に 時間が いる`);
  }
  if (def.tier && !TIERS.includes(def.tier)) throw new Error(`registerAx(${anim}): tier '${def.tier}' は ない（${TIERS.join('・')}）`);
  if (def.charge && def.charge.kind && !CHARGE_KINDS.includes(def.charge.kind)) throw new Error(`registerAx(${anim}): charge.kind '${def.charge.kind}' は ない（${CHARGE_KINDS.join('・')}）`);
  const d = {
    hit: 300, stagger: 60, ...def, anim, tier: def.tier || 'advanced', stagger: def.stagger ?? 60,
    // charge を 書かなければ ふつうの ため（generic）。false で ためない
    charge: def.charge === false || def.charge === null ? null : { kind: 'generic', ...(def.charge || {}) },
  };
  const abil = def.abilities ? (Array.isArray(def.abilities) ? Object.fromEntries(def.abilities.map((id) => [id, {}])) : def.abilities) : {};
  for (const [id, o] of Object.entries(abil)) {
    if (BY_ABILITY.has(id) || axSkill(id)) throw new Error(`registerAx(${anim}): 技 ${id} は もう ${BY_ABILITY.get(id)?.anim || axSkill(id).anim} に ある`);
    const over = typeof o === 'string' ? { tier: o } : { ...(o || {}) };
    if (over.tier && !TIERS.includes(over.tier)) throw new Error(`registerAx(${anim}): 技 ${id} の tier '${over.tier}' は ない`);
    BY_ABILITY.set(id, { anim, over });
  }
  AX.set(anim, d);
  return d;
}
// グループ（{ anim: def, … }）を まとめて とうろく。fine … つぶの かきかた（なまえは グループの なまえで はじめる。g1 なら g1〜、o1 なら o1〜）
// へんじ: とうろくした anim の ならび
export function useAxGroup(name, defs, fine = null) {
  const pre = /^[go]\d+$/.test(name) ? name : 'ax';
  for (const [kind, fn] of Object.entries(fine || {})) {
    if (!kind.startsWith(pre)) throw new Error(`useAxGroup(${name}): つぶの なまえ ${kind} は '${pre}' で はじめる`);
    if (typeof fn !== 'function') throw new Error(`useAxGroup(${name}): つぶ ${kind} が 関数で ない`);
    if (AX_FINE[kind]) throw new Error(`useAxGroup(${name}): つぶ ${kind} は もう ${FINE_OWNER.get(kind) || 'axkit'} に ある`);
    AX_FINE[kind] = fn;
    FINE_OWNER.set(kind, name);
  }
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
// グループの anim（とうろくした じゅん）
export const axGroupList = (group) => [...AX.values()].filter((d) => d.group === group).map((d) => d.anim);
// グループの つぶの なまえ
export const axGroupFine = (group) => [...FINE_OWNER].filter(([, g]) => g === group).map(([k]) => k);
// 技の id から anim（shared の 表 → def の abilities。え が とうろく されて いる ものだけ）。o.masc … 男の子の 版
export function axAnimFor(ability, o = {}) {
  if (!ability) return null;
  const s = axSkill(ability, o);
  if (s && AX.has(s.anim)) return s.anim;
  return BY_ABILITY.get(ability)?.anim || null;
}
// 敵が 味方に つかった ときの 味方の まどの えんしゅつ（battle.js の allyFxKind）。ない ときは null
export const axAllyFx = (anim) => AX.get(anim)?.allyFx || null;
// 味方や 自分に かける 大わざ（画面の 下に 出す）
export const axIsParty = (anim) => !!AX.get(anim)?.party;

// 技ごとの ちがい（shared の 表 か def の abilities）
function overOf(anim, o) {
  const s = o.ability ? axSkill(o.ability, o) : null;
  if (s && s.anim === anim) return s.over;
  const b = o.ability ? BY_ABILITY.get(o.ability) : null;
  return b && b.anim === anim ? b.over : {};
}

// 技ごとの ちがいを まぜた せってい { def, tier, charge, vars, element }
// o: { ability（技の id か 'id@masc'・'dt_〜'）, masc, tier・chargeKind（ためしに かえる） }
export function axResolve(anim, o = {}) {
  const d = AX.get(anim);
  if (!d) return null;
  const over = overOf(anim, o);
  const tier = TIERS.includes(o.tier) ? o.tier : TIERS.includes(over.tier) ? over.tier : d.tier;
  const charge = axResolveCharge(d.charge, over, o);
  return { def: d, over, tier, charge, vars: { ...(d.vars || {}), ...(over.vars || {}) }, element: over.element || d.element || null };
}

// 時間の けいさん（ms）。charge … ためる、hit … はじめから あたる まで、len … はなってから おわる まで、total … ぜんぶ
// end … total ＋ 敵全体の ずらし。ts … おそい 設定の しぼり（エフェクトの 時計を 速める）。hitAt … エフェクトの 時計で あたる 時間
// 〜Real … たたかいの 速さ（tempo）と ts で わった ほんとうの 時間。数は サーバー（shared/ax-time.js の axPlan）と おなじ
// o: { tempo, ability, masc, tier, chargeKind, targets（かず か ならび）, crit, repeat, dual }
export function axTiming(anim, o = {}) {
  const R = axResolve(anim, o);
  if (!R) return null;
  const n = Math.max(1, Array.isArray(o.targets) ? o.targets.length : (o.targets | 0) || 1);
  const entry = AX_TIME[anim] || R.def;
  const T = axTimes(entry, R.over, { tier: o.tier, chargeKind: o.chargeKind, n, crit: o.crit, repeat: o.repeat, dual: o.dual });
  const tempo = Math.max(0.25, Math.min(4, o.tempo || 1));
  const ts = axTs(tempo);
  const k = tempo * ts;
  return {
    tier: T.tier, kind: T.kind, charge: T.charge, release: T.release, hit: T.hit, len: T.len, total: T.total, stagger: T.stagger, spread: T.spread, end: T.end, cutin: T.cutin,
    tempo, ts, hitAt: Math.round(T.hit / ts), chargeAt: Math.round(T.charge / ts),
    chargeReal: Math.round(T.charge / k), hitReal: Math.round(T.hit / k), totalReal: Math.round(T.total / k), endReal: Math.round(T.end / k),
  };
}
// 行動の 名前の ふだと メッセージの じゅんばんを まつ 時間（ほんとうの ms）。ダメージが 出て すこし あと まで
export function axHoldMs(anim, o = {}) {
  const T = axTiming(anim, o);
  return T ? Math.round(T.hitReal + 350 / T.tempo) : 0;
}
// たたかいの 行動（ev）が つかう 大技の anim（なければ null）。サーバーが きめた ev.fx.ax → 技の id の とうろく → データの anim
export function axEventAnim(ev) {
  if (!ev || ev.t !== 'act' || !ev.fx || ev.fx.type === 'attack') return null;
  if (isAx(ev.fx.ax)) return ev.fx.ax;
  return axAnimFor(ev.ability) || axAnimFor(ev.dual?.id) || (isAx(ev.fx.anim) ? ev.fx.anim : null);
}
// 大技の 技ごとの ちがいを さがす キー（男の子の 版 'id@masc'・合体技 'dt_〜'）と オプション（battle.js が play と axTiming に わたす）
export function axEventOpts(ev) {
  const fx = ev?.fx || {};
  return { ability: fx.axKey || ev?.ability || ev?.dual?.id || undefined, repeat: !!fx.axRepeat, dual: fx.type === 'dual' || !!ev?.dual, n: Math.max(1, (fx.targets || []).length) };
}
// 敵が ためる ときの すがた（enemyfx.js の うごき 'buff' を ためる 時間 だけ）。へんじ: 0（まつ 時間は ためる ほうで）
export function axEnemyPose(actor, anim, o = {}) {
  const R = axResolve(anim, o);
  const T = axTiming(anim, o);
  if (!actor || !T || !T.charge) return 0;
  // 気（ki）は いつも 黄色い オーラ（第49回）
  const kind = axKindOf(R.charge?.kind);
  const col = kind === 'ki' ? KIND_LOOK.ki.color : R.charge?.color || KIND_LOOK[kind].color;
  actor.act = { kind: 'buff', age: 0, dur: T.chargeAt + 120, color: /^#[0-9a-f]{6}$/i.test(col) ? col : '#ffd66b', boss: !!actor.boss };
  return 0;
}

// おそい 設定: この あいだに 足す つぶ（あとで よばれる fx.at の 中も）は ts ばい 速く すすむ（battlefx.js の update が p.ts を 見る）
export function withTs(fx, ts, fn) {
  if (!(ts > 1)) return fn();
  const own = Object.prototype.hasOwnProperty.call(fx, 'add');
  const prev = fx.add;
  fx.add = function addTs(p) {
    let q = p && p.ts ? p : { ...p, ts };
    if (q.kind === 'call' && typeof q.fn === 'function' && !q.tsWrapped) {
      const f = q.fn;
      q = { ...q, tsWrapped: true, fn: () => withTs(fx, ts, f) };
    }
    return prev.call(this, q);
  };
  try {
    return fn();
  } finally {
    if (own) fx.add = prev;
    else delete fx.add;
  }
}

// ctx（play の 2ばんめ）を つくる
function makeCtx(fx, anim, R, T, actor, pts, element, opts, W, H) {
  const d = R.def;
  const fromAlly = opts.fromAlly !== false;
  const n = pts.length, all = n > 1;
  const crit = !!opts.crit;
  const center = centerOf(pts);
  // 敵全体の ずらしは ぜんぶで AX_SPREAD_MAX まで（サーバーの 待ち時間と おなじ）
  const stagger = n > 1 ? Math.min(T.stagger, Math.floor(AX_SPREAD_MAX / (n - 1))) : T.stagger;
  const P = d.pal ? (typeof d.pal === 'string' ? pal(d.pal) : d.pal) : pal(element || R.element || 'light');
  const key = typeof opts.ability === 'string' ? opts.ability : '';
  const ctx = {
    fx, k: bindKit(fx), anim, tier: R.tier, T: TIER_K[R.tier], power: TIER_K[R.tier] * (crit ? 1.15 : 1),
    vars: R.vars, ability: key ? key.replace(/@masc$/, '') : null, masc: key.endsWith('@masc') || !!opts.masc, crit,
    repeat: !!opts.repeat, dual: !!opts.dual, party: !!d.party, toParty: !fromAlly && !!opts.toParty,
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
// opts: { crit, fromAlly, from: { x, y, w, h, foot }, ability（'id@masc'・'dt_〜' も）, masc, repeat（2回目: ため 半分）, dual（合体技: ため なし）,
//         n（時間を きめる 的の かず。サーバーと おなじ）, tier・chargeKind（ためしに かえる）, sfx(id)（音を ならす）, actorImg（第49回から つかわない） }
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
  const n = Math.max(1, opts.n || pts.length);
  const T = axTiming(anim, { ability: opts.ability, masc: opts.masc, tier: opts.tier, chargeKind: opts.chargeKind, targets: n, crit: opts.crit, repeat: opts.repeat, dual: opts.dual, tempo: typeof fx.tempo === 'number' && fx.tempo > 0 ? fx.tempo : 1 });
  const sfx = typeof opts.sfx === 'function' ? opts.sfx : null;
  const sound = (id, at) => {
    if (!sfx || !id) return;
    if (at > 0) fx.at(at, () => sfx(id));
    else sfx(id);
  };
  withTs(fx, T.ts, () => {
    if (T.charge > 0) {
      const c = R.charge;
      playCharge(fx, actor, { kind: c.kind, tier: R.tier, ms: T.charge, color: c.color, color2: c.color2, power: c.power, foe: !fromAlly, n });
      sound(c.sfx || `ax_c_${axKindOf(c.kind)}`, 0);
      // 伝説の 気だけ ゴゴゴ（構えは みじかいので ならさない）
      if (R.tier === 'legend' && T.kind === 'ki' && !opts.repeat) sound('ax_c_legend', T.charge * 0.2);
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
  });
  return true;
}

// ───────────── グループの とうろく（G0 が 書いた。グループは この 下を さわらない） ─────────────
// 1グループ … import 1行 ＋ useAxGroup 1行（え・つぶ）。時間と 技の つなぎは shared/data/ax-time-gN.js、音は client/sfx-ax-gN.js
import { AX_DEMO } from './ax-demo.js?v=acb97b73a32c';
import { AX_G1, AX_G1_FINE } from './axfx-g1.js?v=acb97b73a32c';
import { AX_G2, AX_G2_FINE } from './axfx-g2.js?v=acb97b73a32c';
import { AX_G3, AX_G3_FINE } from './axfx-g3.js?v=acb97b73a32c';
import { AX_G4, AX_G4_FINE } from './axfx-g4.js?v=acb97b73a32c';
import { AX_G5, AX_G5_FINE } from './axfx-g5.js?v=acb97b73a32c';
import { AX_G6, AX_G6_FINE } from './axfx-g6.js?v=acb97b73a32c';
useAxGroup('demo', AX_DEMO);
useAxGroup('g1', AX_G1, AX_G1_FINE);
useAxGroup('g2', AX_G2, AX_G2_FINE);
useAxGroup('g3', AX_G3, AX_G3_FINE);
useAxGroup('g4', AX_G4, AX_G4_FINE);
useAxGroup('g5', AX_G5, AX_G5_FINE);
useAxGroup('g6', AX_G6, AX_G6_FINE);
// 第49回: もとからの 技（ふつうの 職業・ひらめき・合体技）。anim は ox_〜、つぶは o1〜、時間は shared/data/ax-time-oN.js、音は client/sfx-ax-oN.js
import { AX_O1, AX_O1_FINE } from './axfx-o1.js?v=acb97b73a32c';
import { AX_O2, AX_O2_FINE } from './axfx-o2.js?v=acb97b73a32c';
import { AX_O3, AX_O3_FINE } from './axfx-o3.js?v=acb97b73a32c';
import { AX_O4, AX_O4_FINE } from './axfx-o4.js?v=acb97b73a32c';
import { AX_O5, AX_O5_FINE } from './axfx-o5.js?v=acb97b73a32c';
import { AX_O6, AX_O6_FINE } from './axfx-o6.js?v=acb97b73a32c';
useAxGroup('o1', AX_O1, AX_O1_FINE);
useAxGroup('o2', AX_O2, AX_O2_FINE);
useAxGroup('o3', AX_O3, AX_O3_FINE);
useAxGroup('o4', AX_O4, AX_O4_FINE);
useAxGroup('o5', AX_O5, AX_O5_FINE);
useAxGroup('o6', AX_O6, AX_O6_FINE);
