// 第48回: 大技（ax_〜）の 時間と 技の つなぎ。サーバー（shared/battle.js）と クライアント（render/axfx.js）が おなじ 数を 見る
// ・グループの 表（shared/data/ax-time-g1.js 〜 g6.js）を まぜる。canvas・DOM は つかわない（サーバーも 読む）
// ・時間は ms（エフェクトの 時計。たたかいの 速さ 1 の とき）
//   charge … ためる、release … はなって あたる まで（表の hit）、len … はなって おわる まで（表の len）
//   hit = charge + release、total = charge + len、spread … 敵全体の ずらし（stagger × (n-1)。300 まで）、end = total + spread
// ・2回目（おなじ 戦い・おなじ 人・おなじ 技）は ため 半分。合体技は ため なし
// ・第49回（家族の 声）: ちゃんと「ためる」のは ドラゴンボールの 気（kind 'ki'）だけ。ほかの ためかたは みじかい 構え（300ms まで）。
//   表の charge.ms は 読む とき（axChargeMs）に 段の 上限で きる → サーバーの 待ち時間も クライアントの 時間も いっしょに みじかく なる。
//   伝説の カットインの 帯・はなつ 前の スローの ひかり・ためる あいだの 画面の くらさは なし（render/axcharge.js）
// ・おそい 設定（速さ 0.85 より 下）でも 大技は 0.85 の 速さ（ts … エフェクトの 時計を 何ばい 速める か）
// ・サーバーは lockMs だけ つぎの 行動を まつ（ev.extraLock。ほかの extraLock と おなじく ÷ 速さ）
// きまりは docs/plan-r48-fx.md の「G0 の 決めごと」
import { AX_TIME_G1, AX_SKILLS_G1, AX_FAMILIES_G1 } from './data/ax-time-g1.js';
import { AX_TIME_G2, AX_SKILLS_G2, AX_FAMILIES_G2 } from './data/ax-time-g2.js';
import { AX_TIME_G3, AX_SKILLS_G3, AX_FAMILIES_G3 } from './data/ax-time-g3.js';
import { AX_TIME_G4, AX_SKILLS_G4, AX_FAMILIES_G4 } from './data/ax-time-g4.js';
import { AX_TIME_G5, AX_SKILLS_G5, AX_FAMILIES_G5 } from './data/ax-time-g5.js';
import { AX_TIME_G6, AX_SKILLS_G6, AX_FAMILIES_G6 } from './data/ax-time-g6.js';

// 段階（B 基本・A 上級・S 超級・L 伝説）
export const AX_TIERS = ['basic', 'advanced', 'super', 'legend'];
// ためる 時間の 上限（ms）。charge.ms を 書かなければ この 長さ、書いても これより 長く ならない
// 構え（ki の ほか 13しゅるい）… 作品らしい みじかい 構え（剣の きらり・まほうじん・チャクラ・呼吸の わ…）
export const AX_TIER_CHARGE_MS = { basic: 200, advanced: 300, super: 300, legend: 300 };
// 気（ki。ドラゴンボールだけ）… 黄色い オーラが もえあがる（段で すこし 大きく。legend は 小さく ゆれて 小石が うく）
export const AX_KI_CHARGE_MS = { basic: 300, advanced: 450, super: 650, legend: 900 };
// ためかた（render/axcharge.js が かく）
export const AX_CHARGE_KINDS = ['ki', 'chakra', 'gomu', 'breath', 'sword', 'dragon', 'holy', 'magic', 'alchemy', 'idol', 'tech', 'ice', 'star', 'generic'];
// 段の 予算（plan-r48-fx.md 2章 → 第49回で ため を みじかく）。len … はなって おわる まで、charge … 構えの ため、chargeKi … 気の ため、
// total … ため こみの 合計（構え）、totalKi … ため こみの 合計（気）、parts … 同時の つぶの [下限, 上限]（ms・こ）
// 合体技は ため なしで AX_DUAL_TOTAL（len だけで）
const budget = (len, charge, chargeKi, parts) => ({
  len, charge, chargeKi, parts,
  total: [len[0] + charge[0], len[1] + charge[1]], totalKi: [len[0] + chargeKi[0], len[1] + chargeKi[1]],
});
export const AX_BUDGET = {
  basic: budget([450, 800], [0, 200], [0, 300], [52, 140]),
  advanced: budget([700, 1000], [100, 300], [300, 450], [90, 200]),
  super: budget([900, 1400], [150, 300], [500, 650], [140, 280]),
  legend: budget([1200, 1800], [150, 300], [800, 900], [200, 360]),
};
export const AX_DUAL_TOTAL = [1500, 2200];
// 段と ためかたの 予算 { len, charge, total, parts }（ki だけ 気の ため）
export function axBudget(tier, kind) {
  const B = AX_BUDGET[tier] || AX_BUDGET.advanced;
  const ki = kind === 'ki';
  return { len: B.len, charge: ki ? B.chargeKi : B.charge, total: ki ? B.totalKi : B.total, parts: B.parts };
}
// 予算の ゆるみ（ms）
export const AX_BUDGET_TOL = 150;
// これより おそい 速さでも 大技は この 速さ
export const AX_SLOW = 0.85;
// 敵全体の ずらしの 合計の 上限（ms）
export const AX_SPREAD_MAX = 300;
// サーバーの 行動の 時間（pace）が もともと もつ ぶん（pace は 900 ÷ 速さ より 短く ならない。のこり 100 は 余韻の さいご）
export const AX_LOCK_BASE = 1000;
// 大技の 前に 見せる もの（クライアントと おなじ 数）: 合体技の カットイン（人数ごと）・ひらめきの 電球
export const AX_DUAL_CUT_MS = { 2: 1000, 3: 1300, 4: 1600 };
export const AX_HIRA_PRE_MS = 700;
export const AX_GROUP_IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6'];

// まぜた 表
export const AX_TIME = {};
export const AX_SKILLS = {};
export const AX_FAMILIES = {};
export const AX_GROUPS = {};
const OWNER = {};

const TIME_KEYS = new Set(['tier', 'charge', 'hit', 'len', 'stagger', 'party', 'vars']);
const SKILL_KEYS = new Set(['anim', 'tier', 'charge', 'vars', 'element']);
const isMs = (v) => typeof v === 'function' || (Number.isFinite(v) && v >= 0);

function checkCharge(where, ch) {
  if (ch === undefined || ch === false || ch === null) return;
  if (typeof ch !== 'object') throw new Error(`${where}: charge は { kind, ms } か false`);
  if (ch.kind !== undefined && !AX_CHARGE_KINDS.includes(ch.kind)) throw new Error(`${where}: charge.kind '${ch.kind}' は ない（${AX_CHARGE_KINDS.join('・')}）`);
  if (ch.ms !== undefined && !(Number.isFinite(ch.ms) && ch.ms >= 0)) throw new Error(`${where}: charge.ms が 数で ない`);
}

// グループの 表を まぜる（グループの ファイルを 読んだ とき。テストは 'test' などで ためしに 足す）
export function axAddTimes(group, time = {}, skills = {}, families = {}) {
  const g = AX_GROUPS[group] || (AX_GROUPS[group] = { time: {}, skills: {}, families: {} });
  for (const [anim, e] of Object.entries(time)) {
    const where = `ax-time ${group} ${anim}`;
    if (!/^ax_[a-z0-9_]+$/.test(anim)) throw new Error(`${where}: なまえは ax_〜（小文字・数字・_）`);
    if (AX_TIME[anim]) throw new Error(`${where}: もう ${OWNER[anim]} に ある`);
    for (const k of Object.keys(e)) if (!TIME_KEYS.has(k)) throw new Error(`${where}: しらない キー ${k}（${[...TIME_KEYS].join('・')}）`);
    if (!AX_TIERS.includes(e.tier)) throw new Error(`${where}: tier '${e.tier}' は ない（${AX_TIERS.join('・')}）`);
    checkCharge(where, e.charge);
    if (!isMs(e.hit) || !isMs(e.len)) throw new Error(`${where}: hit・len（ms）が いる`);
    if (e.stagger !== undefined && !isMs(e.stagger)) throw new Error(`${where}: stagger が 数で ない`);
    AX_TIME[anim] = e;
    OWNER[anim] = group;
    g.time[anim] = e;
  }
  for (const [key, v] of Object.entries(skills)) {
    const where = `ax-skills ${group} ${key}`;
    if (AX_SKILLS[key]) throw new Error(`${where}: もう ${AX_SKILLS[key].group} に ある`);
    const s = typeof v === 'string' ? { anim: v } : { ...(v || {}) };
    for (const k of Object.keys(s)) if (!SKILL_KEYS.has(k)) throw new Error(`${where}: しらない キー ${k}（${[...SKILL_KEYS].join('・')}）`);
    if (typeof s.anim !== 'string' || !s.anim.startsWith('ax_')) throw new Error(`${where}: anim（ax_〜）が いる`);
    if (s.tier !== undefined && !AX_TIERS.includes(s.tier)) throw new Error(`${where}: tier '${s.tier}' は ない`);
    checkCharge(where, s.charge);
    const { anim, ...over } = s;
    AX_SKILLS[key] = { key, anim, over, group };
    g.skills[key] = AX_SKILLS[key];
  }
  for (const [name, list] of Object.entries(families || {})) {
    if (AX_FAMILIES[name]) throw new Error(`ax-families ${group} ${name}: もう ある`);
    AX_FAMILIES[name] = list;
    g.families[name] = list;
  }
  return g;
}

axAddTimes('g1', AX_TIME_G1, AX_SKILLS_G1, AX_FAMILIES_G1);
axAddTimes('g2', AX_TIME_G2, AX_SKILLS_G2, AX_FAMILIES_G2);
axAddTimes('g3', AX_TIME_G3, AX_SKILLS_G3, AX_FAMILIES_G3);
axAddTimes('g4', AX_TIME_G4, AX_SKILLS_G4, AX_FAMILIES_G4);
axAddTimes('g5', AX_TIME_G5, AX_SKILLS_G5, AX_FAMILIES_G5);
axAddTimes('g6', AX_TIME_G6, AX_SKILLS_G6, AX_FAMILIES_G6);

export const axTimeOf = (anim) => (typeof anim === 'string' && AX_TIME[anim]) || null;
export const axGroupOf = (anim) => OWNER[anim] || null;
// 技の id（男の子は 'id@masc' が あれば そちら。合体技は 'dt_〜'）→ { key, anim, over, group }（なければ null）
export function axSkill(id, o = {}) {
  if (typeof id !== 'string' || !id) return null;
  return (o.masc && AX_SKILLS[`${id}@masc`]) || AX_SKILLS[id] || null;
}
export const axTierOf = (t) => (AX_TIERS.includes(t) ? t : 'advanced');
export const axKindOf = (k) => (AX_CHARGE_KINDS.includes(k) ? k : 'generic');
// ためる 時間の 上限（ms）。ki … 気、ほか … 構え
export const axChargeCap = (kind, tier) => (kind === 'ki' ? AX_KI_CHARGE_MS : AX_TIER_CHARGE_MS)[axTierOf(tier)];
// ためる 時間（ms）。charge が ない・false なら 0。表の charge.ms は 上限で きる（ki の ほかは 300ms まで）
export function axChargeMs(charge, tier) {
  if (!charge) return 0;
  const cap = axChargeCap(axKindOf(charge.kind), tier);
  return Math.max(0, Math.min(cap, Math.round(charge.ms ?? cap)));
}
// おそい 設定の しぼり（エフェクトの 時計を 何ばい 速める か）
export const axTs = (speed) => (Number.isFinite(speed) && speed > 0 && speed < AX_SLOW ? AX_SLOW / speed : 1);

// ためかた: 表（か def）の charge ＋ 技ごとの charge。書かなければ generic、false で ためない
export function axResolveCharge(base, over = {}, o = {}) {
  let ch = base === false || base === null ? null : { kind: 'generic', ...(base || {}) };
  if (over.charge === false) ch = null;
  else if (over.charge) ch = { kind: 'generic', ...(ch || {}), ...over.charge };
  if (o.chargeKind && AX_CHARGE_KINDS.includes(o.chargeKind)) ch = { ...(ch || {}), kind: o.chargeKind, color: undefined, color2: undefined };
  return ch;
}

const num = (v, info, d) => (typeof v === 'function' ? v(info) : v ?? d);

// 時間の けいさん（ms・エフェクトの 時計・速さ 1）。entry … 表の 1行（クライアントは def でも おなじ キー）、over … 技ごと
// o: { tier（ためしに かえる）, chargeKind, n（的の かず）, crit, repeat（2回目）, dual（合体技） }
export function axTimes(entry, over = {}, o = {}) {
  if (!entry) return null;
  const tier = axTierOf(o.tier || over.tier || entry.tier);
  const chargeDef = axResolveCharge(entry.charge, over, o);
  const n = Math.max(1, Math.round(o.n || 1));
  const vars = { ...(entry.vars || {}), ...(over.vars || {}) };
  const info = { tier, n, all: n > 1, crit: !!o.crit, vars };
  let charge = o.dual ? 0 : axChargeMs(chargeDef, tier);
  if (o.repeat && charge) charge = Math.round(charge * 0.5);
  const release = Math.max(0, Math.round(num(entry.hit, info, 300)));
  const len = Math.max(release + 120, Math.round(num(entry.len, info, release + 500)));
  const stagger = Math.max(0, Math.round(num(entry.stagger, info, 60)));
  const spread = n > 1 ? Math.min(AX_SPREAD_MAX, stagger * (n - 1)) : 0;
  const total = charge + len;
  return {
    tier, kind: chargeDef ? axKindOf(chargeDef.kind) : null, chargeDef, charge, release, hit: charge + release, len, total, stagger, spread, end: total + spread,
    // cutin … 第49回で カットインの 帯は なくした（いつも false。前の よびかたの ために のこす）
    repeat: !!o.repeat, dual: !!o.dual, cutin: false, vars,
  };
}

// サーバーと クライアントの 計算（anim は 表に ある もの）。o: { key か ability, masc, n, crit, repeat, dual, speed, pre（カットインなど 前に 見せる ms） }
// へんじ: axTimes ＋ { anim, key, ts, realMs（速さ 1 に なおした 見える 長さ ＝ pre + end ÷ ts）, lockMs（ev.extraLock に つかう） }
export function axPlan(anim, o = {}) {
  const e = axTimeOf(anim);
  if (!e) return null;
  const s = axSkill(o.key || o.ability, { masc: o.masc });
  const over = s && s.anim === anim ? s.over : {};
  const T = axTimes(e, over, o);
  const ts = axTs(o.speed);
  const realMs = Math.ceil((o.pre || 0) + T.end / ts);
  return { ...T, anim, key: s && s.anim === anim ? s.key : null, ts, realMs, lockMs: Math.max(0, realMs - AX_LOCK_BASE) };
}

// サーバー: 行動（ev）が 大技なら ev.fx.ax・ev.fx.axKey・ev.fx.axRepeat を つけて ev.extraLock を のばす（shared/battle.js の executeNext）
// who … 男の子か（isMasc）、used … その 戦いで 使った 技の Set（'人|技'）、speed … たたかいの 速さ
export function axMarkEvent(ev, c, { masc = false, used = null, speed = 1 } = {}) {
  const fx = ev && ev.fx;
  if (!fx || !c || fx.type === 'attack' || fx.type === 'item') return null;
  const id = ev.dual?.id || ev.ability;
  const s = axSkill(id, { masc });
  const anim = s ? s.anim : axTimeOf(fx.anim) ? fx.anim : null;
  if (!anim) return null;
  const key = s ? s.key : id || anim;
  const tag = `${c.id}|${key}`;
  const repeat = !!(used && used.has(tag)) && !ev.hirameki;
  if (used) used.add(tag);
  const n = Math.max(1, (fx.targets || []).length);
  const crit = (ev.results || []).some((r) => r.crit);
  const pre = ev.dual ? AX_DUAL_CUT_MS[ev.dual.n] || AX_DUAL_CUT_MS[2] : ev.hirameki ? AX_HIRA_PRE_MS : 0;
  const P = axPlan(anim, { key, n, crit, repeat, dual: !!ev.dual, speed, pre });
  fx.ax = anim;
  if (s && s.key !== ev.ability) fx.axKey = s.key;
  if (repeat) fx.axRepeat = 1;
  ev.extraLock = Math.max(ev.extraLock || 0, P.lockMs);
  return P;
}
