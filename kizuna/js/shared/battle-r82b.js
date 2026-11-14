// 第82回 B班: YAIBA の 系統の 戦いの しかけ（data/jobs-r82b.js・data/abilities-r82b.js。docs/plan-r82-jobs-b.md）
//
// ■ 玉がえ（今の 玉）
//   ・c.tama … 戦いの 中だけの「刀に はまっている 玉」（属性の 名前）。キャラ（セーブ・引っこしコード）には のこさない。
//     戦いの 人（combatant）は 戦いごとに 作りなおすので、いつも 雷の玉から 始まる
//   ・持てる 玉（tamaSet）は 今の 職業の 段で きまる
//       サムライ小ぞう … なし（剣の 技は 属性なし）／雷神けんの剣士 … 雷だけ／ヤイバ … 雷・火・水・氷／竜神けんのサムライ … ＋風・竜神（光）
//     ほかの 職業に 転職した あとで この 系統の 技を 使う とき（覚えた 技は どの 職業でも 使える）:
//       玉がえを 覚えて いれば 雷・火・水・氷（竜神けんのサムライの 技も 覚えて いれば ＋風・竜神）／覚えて いなければ 雷だけ
//       （この 系統の 技を 1つも 覚えて いない 人は なし）
//   ・effect.yb が 'tama' の 技は 今の 玉の 属性に なる（battle.js の 'phys' の はじめで r82bPhys。オートの みつもりは calcPhys の r82bElement）
// ■ 金色の玉・きょだい化（c.kyodai = { left }）… その 間 この 系統の 剣の 技（effect.yb）が 敵全体に とどく（1体・グループの 技は 少し 弱く）
// ■ 雷神の守り（c.raiGuard = { left }）… その 間 敵の 雷の 攻撃を 受けると、ダメージの かわりに 半分 回復（battle.js の damage）
// ■ 四つ玉斬り・七つ玉（effect.yb 'strike'）… balls の 属性で 1回ずつ。弱点なら weakBonus 倍。
//   効かない（0倍）・すいこむ（闘技場の 王者の よろいと おなじ 属性）玉は 使わない（回復させない）
// ■ 雷の 天気: ふつうの 雷の 技は 天気の しくみ（battle-weather.js）で 1.3倍。effect.thunderMult が ある 技は ぜんぶで その 倍
// ■ オート（ai.js の decideAlly から r82bPlan）: 弱点が 分かって いれば その 玉に・分からなければ 雷の まま・
//   雷の 天気なら 雷（天気の 倍率も 数える）。かみなり雲は 味方の 天気が ない ときだけ（天候の 職業の 天気を 上書きしない）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { ELEMENT_NAMES } from './data/abilities.js?v=5e5310169c06';
import { weatherMult, WEATHER_UP } from './battle-weather.js?v=5e5310169c06';
import { YB_TAMAGAE_ATB } from './data/abilities-r82b.js?v=5e5310169c06';

// 玉の 表（ならびは 玉がえの メニューの じゅん）。金色の玉は 七つ玉の 1回と きょだい化だけ（玉がえでは えらばない）
export const TAMA = {
  bolt: { name: '雷の玉', mark: '雷', color: '#ffe040' },
  fire: { name: '火の玉', mark: '火', color: '#ff6a2a' },
  water: { name: '水の玉', mark: '水', color: '#3aa0ff' },
  ice: { name: '氷の玉', mark: '氷', color: '#a8e8ff' },
  wind: { name: '風の玉', mark: '風', color: '#6ae0a0' },
  light: { name: '竜神の玉', mark: '竜', color: '#fff2a8' },
  blast: { name: '金色の玉', mark: '金', color: '#ffc830' },
};
export const TAMA_ORDER = ['bolt', 'fire', 'water', 'ice', 'wind', 'light'];
const FOUR = TAMA_ORDER.slice(0, 4);
export const TAMA_BY_JOB = { samurai_kid: [], raijin_sword: ['bolt'], yaiba: FOUR, ryujin_samurai: TAMA_ORDER };
export const R82B_LINE = Object.keys(TAMA_BY_JOB);
// きょだい化で 1体・グループの 技が 敵全体に ひろがった ときの 強さ
export const KYODAI_SPREAD = 0.85;
// 雷神の守りで 回復する わりあい
export const RAI_GUARD_HEAL = 0.5;
// オートが 玉を かえる めやす（今の 玉より この 倍 いじょう よい とき）
export const TAMA_SWITCH = 1.15;

const knows = (c, re) => (c?.abilities || []).some((id) => re.test(id));

// その 人が 持てる 玉（c … 戦いの 人・pub・キャラ。job と abilities を 見る）
export function tamaSet(c) {
  if (!c || c.mon) return [];
  if (TAMA_BY_JOB[c.job]) return TAMA_BY_JOB[c.job];
  if (knows(c, /^yb_tamagae$/)) return knows(c, /^ry_|^ryujin_samurai_sig$/) ? TAMA_ORDER : FOUR;
  if (knows(c, /^(rj_|yb_|ry_|raijin_sword_sig$|yaiba_sig$|ryujin_samurai_sig$)/)) return ['bolt'];
  return [];
}
// 今の 玉（持てない 人は null。はじめは 雷）
export function tamaOf(c) {
  const set = tamaSet(c);
  if (!set.length) return null;
  return set.includes(c.tama) ? c.tama : set[0];
}
// 技の 属性（オートの みつもり。calcPhys の はじめ）: 今の 玉に なる 技は その 属性
export function r82bElement(c, eff, element) {
  if (eff?.yb !== 'tama' || (element && element !== 'phys')) return element;
  return tamaOf(c) || element;
}
// 味方の 雷の 天気か
const thunderOn = (b, c) => b?.weather?.kind === 'thunder' && b.weather.side === c.side;

// ───────────── 剣の 技（battle.js の applyAbility の 'phys' の はじめ） ─────────────
export function r82bPhys(b, c, a, cmd, ev, powMult, targets) {
  const { yb, balls, weakBonus, thunderMult, ...rest } = a.effect;
  let ts = targets;
  let target = a.target;
  // 金色の玉・きょだい化: 敵全体に とどく
  if (c.kyodai && ['enemy', 'group'].includes(a.target)) {
    const all = b.sideOf(c, false).filter((x) => x.alive);
    if (all.length > ts.length) {
      ts = all;
      target = 'enemies';
      rest.mult = (rest.mult ?? 1) * KYODAI_SPREAD;
      ev.lines.push('きょだい化した大きな刀が、敵全体にとどいた！');
    }
  }
  if (yb === 'strike') return strike(b, c, { ...a, target }, rest, balls || [], weakBonus || 1, ev, powMult, ts);
  if (yb === 'tama') {
    const el = tamaOf(c);
    if (el) rest.element = el;
  }
  // 雷神のいかり: 味方の 雷の 天気で ぜんぶで thunderMult 倍（天気の しくみの 1.3倍を ふくめる）
  if (thunderMult && rest.element === 'bolt' && thunderOn(b, c)) {
    rest.mult = (rest.mult ?? 1) * (thunderMult / WEATHER_UP);
    ev.lines.push('雷の天気で、雷神のいかりが大きくなった！');
  }
  b.applyAbility(c, { ...a, target, effect: rest }, cmd, ev, powMult, ts);
}

// 玉が その 敵に つかえるか（0倍・すいこむ よろいは つかわない）
const ballOk = (t, el) => (t.resist?.[el] ?? 1) !== 0 && t.arArmor !== el;

// 四つ玉斬り・七つ玉: 玉の 属性で 1回ずつ
function strike(b, c, a, eff, balls, weakBonus, ev, powMult, ts) {
  ev.fx = { type: 'ability', anim: a.anim, actor: c.id, targets: ts.map((t) => t.id), side: c.side, element: balls[0], balls };
  ev.lines.push(`${balls.map((el) => TAMA[el]?.mark || '').join('・')}の玉を、つぎつぎにはめかえて切りつけた！`);
  const { hits, ...one } = eff;
  let weak = 0;
  const skipped = new Set();
  for (const t of ts) {
    for (const el of balls) {
      if (!t.alive) break;
      if (!ballOk(t, el)) {
        skipped.add(el);
        continue;
      }
      const isWeak = (t.resist?.[el] ?? 1) >= 1.2;
      b.physHit(c, t, { ...one, mult: (one.mult ?? 1) * (isWeak ? weakBonus : 1) }, ev, el, powMult);
      if (isWeak) weak++;
    }
  }
  if (skipped.size) ev.lines.push(`（${[...skipped].map((el) => TAMA[el]?.mark).join('・')}の玉は、効かないので使わなかった）`);
  if (weak) ev.lines.push(`弱点に${weak}回当たった！`);
  b.afterDamage(c, ev, 'phys');
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export function r82bEffect(b, c, a, eff, ev, cmd) {
  switch (eff.type) {
    case 'tamagae': {
      const set = tamaSet(c);
      if (set.length < 2) {
        ev.lines.push('しかし、はめかえる玉がない！');
        return true;
      }
      const was = tamaOf(c);
      let want = cmd?.tama;
      if (!set.includes(want)) want = bestTama(b, c) || set[(set.indexOf(was) + 1) % set.length];
      c.tama = want;
      ev.atbAfter = YB_TAMAGAE_ATB;
      if (ev.fx) {
        ev.fx.element = want;
        ev.fx.tama = want;
      }
      const T = TAMA[want];
      if (want === was) ev.lines.push(`${c.name}の刀には、${T.name}がはまっている。`);
      else ev.lines.push(`${c.name}は、刀に${T.name}をはめた！`, `剣の技が、${ELEMENT_NAMES[want]}の力になった！`);
      ev.upd.push(c);
      return true;
    }
    case 'kyodai': {
      c.kyodai = { left: eff.left || 4 };
      ev.lines.push(`${c.name}は、きょだい化した！剣の技が、敵全体にとどく！`);
      ev.upd.push(c);
      return true;
    }
    case 'raiGuard': {
      c.raiGuard = { left: eff.left || 4 };
      ev.lines.push(`${c.name}は、雷の攻撃をすいこむかまえになった！`);
      ev.upd.push(c);
      return true;
    }
    default: return false;
  }
}

// ───────────── 行動の はじめ（battle.js の executeNext） ─────────────
export function r82bTurnStart(b, c, ev) {
  if (c.kyodai) {
    c.kyodai.left--;
    if (c.kyodai.left <= 0) {
      delete c.kyodai;
      if (c.alive) ev.lines.push(`${c.name}の体が、元の大きさにもどった。`);
      ev.upd.push(c);
    }
  }
  if (c.raiGuard) {
    c.raiGuard.left--;
    if (c.raiGuard.left <= 0) {
      delete c.raiGuard;
      ev.upd.push(c);
    }
  }
}

// ───────────── ダメージ（battle.js の damage）: 雷神の守り ─────────────
// null … ダメージなし（回復した）
export function r82bDamage(b, c, t, dmg, info, ev) {
  if (!t?.raiGuard || info?.element !== 'bolt' || !c || c.side === t.side || !(dmg > 0)) return dmg;
  const heal = Math.max(0, Math.min(t.maxHp - t.hp, Math.round(dmg * RAI_GUARD_HEAL)));
  t.hp += heal;
  ev.lines.push(`${t.name}の雷神の守りが、雷の力をすいこんだ！`, heal > 0 ? `${t.name}のHPが${heal}回復した！` : `${t.name}はダメージを受けない！`);
  ev.results = ev.results || [];
  ev.results.push({ id: t.id, heal, absorb: true, element: 'bolt' });
  ev.upd.push(t);
  return null;
}

// クライアントに 見せる（pub）
export function r82bPub(c) {
  const out = {};
  const el = tamaOf(c);
  if (el) out.tama = el;
  if (c.kyodai) out.kyodai = c.kyodai.left;
  if (c.raiGuard) out.raiGuard = c.raiGuard.left;
  return out;
}

// ───────────── オート ─────────────
// 分かっている 効きぐあい（この 戦いで ためした 属性。四つ玉斬りで 4つ わかる）。分からない 属性は 1倍と みる
function knownResist(b, t, el) {
  if (t.arArmor === el) return -0.5;
  if (!t.species || !b?.tried?.has(`${t.species}|${el}`)) return 1;
  return t.resist?.[el] ?? 1;
}
// その 玉の よさ（ボスは 2倍に 数える。味方の 天気の 倍率も かける）
export function tamaScore(b, c, el, foes = null) {
  const list = foes || b.sideOf(c, false).filter((x) => x.alive);
  let s = 0;
  for (const t of list) s += knownResist(b, t, el) * (t.boss ? 2 : 1);
  return s * weatherMult(b, c.side, el);
}
// いちばん よい 玉（今の 玉より TAMA_SWITCH 倍 いじょう よい 時だけ。なければ null）
export function bestTama(b, c, foes = null) {
  const set = tamaSet(c);
  if (set.length < 2) return null;
  const cur = tamaOf(c);
  const base = tamaScore(b, c, cur, foes);
  let best = null, top = base * TAMA_SWITCH + 0.01;
  for (const el of set) {
    if (el === cur) continue;
    const s = tamaScore(b, c, el, foes);
    if (s > top) {
      top = s;
      best = el;
    }
  }
  return best;
}

// decideAlly の 補助の 前（mine … 使える 技 [{ id, a }]、hard … 強い 敵か〈ai.js の fightWeight〉）
export function r82bPlan(b, c, foes, mine, hard) {
  if (!foes.length) return null;
  const has = (type) => mine.find(({ a }) => a.effect?.type === type || (a.effect?.type === 'multi' && a.effect.parts?.some((p) => p.type === type)));
  // かみなり雲: 味方の 天気が ない（天候の 職業の 天気を 上書きしない）・強い 敵・雷の 技が ある
  const cloud = mine.find(({ a }) => a.effect?.type === 'weather' && a.effect.kind === 'thunder' && R82B_JOBS_SKILL.has(a.job));
  //   （MP が 4わり いじょう ある 時だけ。何回も よびすぎない）
  if (cloud && hard && b.weather?.side !== c.side && tamaOf(c) === 'bolt' && c.mp >= c.maxMp * 0.4 && b.rng.chance(0.25)) return { type: 'ability', id: cloud.id };
  // 玉がえ
  const swap = has('tamagae');
  if (swap) {
    const el = bestTama(b, c, foes);
    if (el) return { type: 'ability', id: swap.id, tama: el };
  }
  // きょだい化: 敵が 3体 いじょう（1体の ボスには 全体に とどく よさが ない。強く なる ぶんは 補助の えらび方〈chooseBuff〉で）
  const big = has('kyodai');
  if (big && !c.kyodai && hard && foes.length >= 3 && c.mp >= c.maxMp * 0.3 && b.rng.chance(0.3)) return { type: 'ability', id: big.id };
  return null;
}
const R82B_JOBS_SKILL = new Set(['yaiba', 'ryujin_samurai']);
