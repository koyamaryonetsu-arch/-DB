// 第85回 A班: スレイヤーズの 系統（ためて うつ 大砲）の 戦いの しかけ（data/jobs-r85a.js・data/abilities-r85a.js。docs/plan-r85-jobs-a.md）
// どれも 戦いの 中だけ（戦いの 人〈combatant〉に つける。キャラ・セーブ・引っこしコードには 何も 足さない）
//
// ■ となえる（c.r85aChant = { left }。type 'r85aChant'）
//   ・となえて いる 間だけ、大砲の 呪文（effect.r85aBig: ドラグ・スレイブ・ラグナ・ブレード・ギガ・スレイブ）が えらべる。
//     となえて いないと 命令の 一覧で うすく なり（client/battle-r85a.js）、battle.js の validate も ことわる・オートも えらばない（ai.js の canUse）
//   ・大砲の 呪文を うつと 消える。**ふつうの 呪文（magic）を うった 時は、その 呪文が CHANT_BOOST 倍に なって 消える**（設計の「次の 呪文も 強く なる」）
//   ・つづく 長さ: となえた あと、自分が CHANT_LEFT 回 行動する まで（3回めの 行動の おわりに 消える）。
//     呪文で ない 行動（攻撃・特技・道具・身を 守る・食べる）では 消えない。ほかの 呪文を うつまで、または 3回 動くまで つづく
//   ・消える とき: たおれた（damage で HP が 0）・ねむり・マヒ・混乱・呪文ふうじ・水のろう・地われ の まま 自分の 番が 来た
//     （ねむり・マヒ・呪文ふうじの 間は 大砲も えらべない）
//   ・身を 守れない わけでは ない（ふつうに 動ける。身を 守るのも 1回の 行動に かぞえる）
//   ・ほかの 職業に 転職した あと: 「となえる」と 大砲の 呪文を 覚えて いれば、だれでも おなじ きまりで 使える（強さは 今 ある 転職の ペナルティ）
//   ・早口（ドラまたの とくせい passive.hayakuchi）: となえた ターンに この わりあいで すぐ もう 1回 動ける（行動ゲージ HAYAKUCHI_ATB）
//   ・敵の がわ（職業の試練の まぼろし・鏡の うつし身）は となえずに うつ かわり、力は ENEMY_BIG 倍（2ターンで ならした 強さ）
// ■ 大砲の 呪文は「2ターンで 1発」。となえる ターンは 何も 与えない ので、ならすと 同じ 段の 呪文の まん中に なる 数（tools/sim-r85a.mjs）
// ■ ギガ・スレイブ（effect.r85aGiga）: のこりの MP を 全部 使う（はらった MP ＋ のこり）。1体ごとの ダメージ ＝ 使った MP × GIGA_PER × 魔力の 倍、
//   上限 GIGA_CAP・ボスは 最大HP の GIGA_BOSS（MP 999 の キャラでも ボスを 1発で たおせない）。属性 なし。うった あと MP は 0（定食で 回復と 組に なる）
// ■ ラグナ・ブレード（effect.r85aPierce）: 敵の「ききにくい」（属性が 1 より 小さい）と 身を 守るを むしする。
//   効かない 属性（0）と、ボスの しかけ（かまえ・前ぶれ・形態・水の衣 など damage の 中の しかけ）は そのまま
//   （呪文には もともと 守備力が きかないので、「守りを 無視」は 呪文の 守り〈ききにくい・身を 守る〉を むしする 形に した）
// ■ フレア・アロー（effect.r85aHits）: ばらばらの 敵に その 回数
// ■ とう賊たいじ（effect.r85aGold）: 当てた 敵の お金の その 倍が、たおさなくても 手に 入る（今 ある hooks.gainGold。楽天カードの ポイントバックと おなじ しくみ）
// ■ 定食（大もり定食・特もり定食）は 今 ある heal ＋ mpHeal の multi（データだけ）
// battle.js から よぶ: r85aLocked（validate）・r85aMagic（'magic' の はじめ）・r85aEffect（switch）・r85aTurnStart（行動の はじめ・身を 守る）・
//   r85aAfter（行動の あと・身を 守る）・r85aDamage（damage）・r85aPub（pub）
// ai.js から よぶ: r85aLocked（canUse）・r85aPlan（オートの 動き）
// サーバーでも ブラウザでも 使う（canvas・DOM なし）
import { JOBS } from './data/jobs.js?v=793d200b699f';
import { ABILITIES } from './data/abilities.js?v=793d200b699f';
import { mpCost, weaponOk } from './stats.js?v=793d200b699f';

export const R85A_LINE = ['tabi_madoshi', 'lina', 'doramata'];
// となえて いられる 行動の 回数・ふつうの 呪文の 倍・早口の 行動ゲージ
export const CHANT_LEFT = 3;
export const CHANT_BOOST = 1.5;
export const HAYAKUCHI_ATB = 100;
// ギガ・スレイブ（使った MP 1 あたり・1体の 上限・ボスは その 最大HP の GIGA_BOSS まで ＝ MP 999 でも ボスを 1発で たおせない）
export const GIGA_PER = 4;
export const GIGA_CAP = 4000;
export const GIGA_BOSS = 0.3;
// 敵の がわ（まぼろし）が となえずに うつ ときの 力
export const ENEMY_BIG = 0.5;
export const LOCK_REASON = '先に「となえる」を使おう';

export const isBig = (a) => !!a?.effect?.r85aBig;
const st = (c) => c?.status || {};
// となえて いる（うてる）か
export function chanting(c) {
  if (!c?.r85aChant || c.alive === false) return false;
  const s = st(c);
  return !s.sleep && !s.paralyze && !s.silence && !s.prison && !s.rift;
}
// 合体技の 強さに 数える 時の 大砲の 呪文の 倍（battle-dual.js の memberPower。R85A_DUAL.mult を かえて ためせる）
//   ボスの しらべ（tools/sim-r85a.mjs の R85A_DUAL）: そのまま（1）で ドラまた 58%・618びょう（魔法の 伝説 5つの 平均 58%・592）／
//   0.75 で 38%・692／0.5 で 34%・702。そのままでも ほかの 伝説と ならぶ（強すぎない）ので 1。強すぎたら ここを 下げる
export const R85A_DUAL = { mult: 1 };
export const bigDualMult = (a) => (isBig(a) ? R85A_DUAL.mult : 1);
// 大砲の 呪文が えらべない（仲間で となえて いない）
export function r85aLocked(c, a) {
  return isBig(a) && c?.side !== 'enemy' && !chanting(c);
}

// ───────────── 呪文（battle.js の applyAbility の 'magic' の はじめ）。へんじ: ここで おわったら true ─────────────
export function r85aMagic(b, c, a, cmd, ev, powMult, targets) {
  const eff = a.effect || {};
  const special = eff.r85aBig || eff.r85aGiga || eff.r85aHits || eff.r85aGold || eff.r85aPierce;
  const ch = c.r85aChant;
  if (!special && !ch) return false;
  const { r85aBig, r85aGiga, r85aHits, r85aGold, r85aPierce, ...rest } = eff;
  let pow = powMult;
  if (r85aBig && !ch) {
    if (c.side !== 'enemy') {
      ev.lines.push('しかし、となえていないので、呪文が形にならなかった…');
      return true;
    }
    pow *= ENEMY_BIG;
  }
  if (ch) {
    delete c.r85aChant;
    ev.r85aChantEnd = c.id;
    ev.upd.push(c);
    if (!r85aBig) {
      pow *= CHANT_BOOST;
      ev.lines.push('となえておいた力がのって、呪文が強くなった！');
    }
  }
  const ab = { ...a, effect: rest };
  if (r85aGiga) giga(b, c, ab, ev, pow, targets);
  else if (r85aHits) {
    for (let i = 0; i < r85aHits; i++) {
      const pool = b.sideOf(c, false).filter((x) => x.alive);
      if (!pool.length) break;
      b.magicHit(c, b.rng.pick(pool), rest, ev, pow);
    }
    b.afterDamage(c, ev, rest.element);
  } else if (r85aPierce) {
    for (const t of targets) pierceHit(b, c, t, rest, ev, pow);
    b.afterDamage(c, ev, rest.element);
  } else b.applyAbility(c, ab, cmd, ev, pow, targets);
  if (r85aGold) takeGold(b, c, targets, r85aGold, ev);
  if (r85aBig) ev.r85aBig = { by: c.id, anim: a.anim };
  return true;
}

// ラグナ・ブレード: ききにくい 属性と 身を 守るを むしする（効かない〈0〉は そのまま）
function pierceHit(b, c, t, eff, ev, pow) {
  if (!t?.alive) return 0;
  const el = eff.element;
  const r = el ? t.resist?.[el] ?? 1 : 1;
  const view = Object.assign(Object.create(Object.getPrototypeOf(t)), t, { resist: { ...(t.resist || {}), ...(el && r > 0 && r < 1 ? { [el]: 1 } : {}) }, defending: false });
  const res = b.calcMagic(c, view, eff, pow);
  if (res.resisted || res.dmg === 0) {
    ev.lines.push(t.side === 'enemy' ? `しかし${t.name}には効かなかった！` : `${t.name}はダメージを受けない！`);
    (ev.results = ev.results || []).push({ id: t.id, miss: true, element: el });
    return 0;
  }
  if (r > 0 && r < 1) ev.lines.push(`闇のやいばが、${t.name}の守りを切りさいた！`);
  b.damage(c, t, res.dmg, ev, { element: el });
  return res.dmg;
}

// ギガ・スレイブ: のこりの MP を 全部 使う（はらった MP ＋ のこり）
function giga(b, c, a, ev, pow, targets) {
  const paid = c.side === 'ally' && c.penChar && ev.ability ? mpCost(c.penChar, ev.ability) : a.mp || 0;
  const used = Math.max(0, (c.mp || 0) + paid);
  c.mp = 0;
  ev.upd.push(c);
  ev.lines.push(`${c.name}は、のこりのMPを全部ときはなった！（MP${used}）`);
  const base = used * GIGA_PER;
  for (const t of targets) {
    if (!t.alive) continue;
    const res = b.calcMagic(c, t, { ...a.effect, base: [base, base] }, pow);
    const d = Math.min(gigaCap(t, pow), res.dmg);
    if (d <= 0) {
      ev.lines.push(`しかし${t.name}には効かなかった！`);
      (ev.results = ev.results || []).push({ id: t.id, miss: true });
      continue;
    }
    b.damage(c, t, d, ev, {});
  }
  b.afterDamage(c, ev, null);
  ev.r85aGiga = { by: c.id, used };
}

// ギガ・スレイブの 1体の 上限（ボスは 最大HP の GIGA_BOSS まで）
export function gigaCap(t, pow = 1) {
  const cap = Math.round(GIGA_CAP * Math.min(1, pow));
  return t?.boss ? Math.min(cap, Math.max(1, Math.round((t.maxHp || 0) * GIGA_BOSS))) : cap;
}

// とう賊たいじ: 当てた 敵の お金を 少し いただく（分身・にげた 敵は のぞく）
function takeGold(b, c, targets, mult, ev) {
  if (c.side !== 'ally' || !b.hooks?.gainGold) return 0;
  let g = 0;
  for (const t of targets) if (t.side === 'enemy' && t.species && !t.clone && !t.fled) g += b.hooks.gainGold(c, t.species, mult) || 0;
  if (g > 0) ev.lines.push(`敵の持っていたお金を、${g}ゴールドいただいた！`);
  return g;
}

// ───────────── 技の こうか（battle.js の applyAbility の switch） ─────────────
export const R85A_TYPES = ['r85aChant'];
export function r85aEffect(b, c, a, eff, ev) {
  if (eff.type !== 'r85aChant') return false;
  const again = !!c.r85aChant;
  c.r85aChant = { left: CHANT_LEFT };
  ev.r85aChant = c.id;
  ev.upd.push(c);
  if (again) ev.lines.push(`${c.name}は、もう一度となえなおした。`);
  ev.lines.push('（となえている：いちばん強い呪文がうてる。ふつうの呪文なら強くなる）');
  // 早口（ドラまた）: すぐに もう 1回 動ける
  const hk = JOBS[c.job]?.passive?.hayakuchi;
  if (hk && b.rng.chance(hk)) {
    ev.atbAfter = HAYAKUCHI_ATB;
    ev.r85aHaya = c.id;
    ev.lines.push('早口で、あっというまにとなえ終わった！すぐに動ける！');
  }
  return true;
}

// ───────────── 行動の はじめ・あと（battle.js の executeNext・身を 守る） ─────────────
export function r85aTurnStart(b, c, ev) {
  const ch = c.r85aChant;
  if (!ch) return;
  const s = st(c);
  if (!c.alive || c.hp <= 0 || s.sleep || s.paralyze || s.confuse || s.silence || s.prison || s.rift) {
    delete c.r85aChant;
    ev.r85aChantEnd = c.id;
    ev.upd.push(c);
    if (c.alive) ev.lines.push(`${c.name}のとなえていた呪文が、消えてしまった…`);
    return;
  }
  ch.left--;
  ev.upd.push(c);
}
// 行動の おわり: 3回 動いたら 消える（となえた 行動 そのものは かぞえない ＝ r85aTurnStart で へらした 時だけ）
export function r85aAfter(b, c, ev) {
  const ch = c.r85aChant;
  if (!ch || ch.left > 0) return;
  delete c.r85aChant;
  ev.r85aChantEnd = c.id;
  ev.upd.push(c);
  if (c.alive) ev.lines.push(`${c.name}のとなえた力が、消えてしまった…`);
}

// ───────────── ダメージ（battle.js の damage）: たおれると 消える ─────────────
export function r85aDamage(b, c, t, dmg, info, ev) {
  if (t?.r85aChant && dmg > 0 && dmg >= t.hp) {
    delete t.r85aChant;
    ev.r85aChantEnd = t.id;
    ev.upd.push(t);
  }
  return dmg;
}

// クライアントに 見せる（pub）。画面は 前の 中みに かさねるので、仲間には いつも r85aChant を のせる（なし は 0）
export function r85aPub(c) {
  if (c.side !== 'ally') return {};
  return { r85aChant: c.r85aChant ? Math.max(1, c.r85aChant.left) : 0 };
}

// ───────────── オート（ai.js の decideAlly。この 系統の 技だけを 見る） ─────────────
// オートが その 技を えらぶ わりあい（tools/sim-r85a.mjs で 合わせた。R85A_AI=chant:0.6 などで ためせる）
//   threat … ボスで ない 時に となえる こわさ（ai.js の fightWeight の threat。HP が 多い だけの 敵〈かかし など〉には となえない）
//   lowMp・lowHp … 定食を 食べる MP・HP の わりあい
//   mealCap … 1回の 戦いで オートが 食べる 回数の 上限
export const R85A_AI = { chant: 0.85, meal: 0.6, gigaMp: 0.8, threat: 0.13, lowMp: 0.3, lowHp: 0.3, mealCap: 30 };
const partsOf = (e) => (e?.type === 'multi' ? e.parts || [] : [e || {}]);
const isMeal = (a) => {
  const ps = partsOf(a?.effect);
  return ps.some((p) => p.type === 'heal') && ps.some((p) => p.type === 'mpHeal');
};
// 大砲の 呪文が うてるか（となえて いるか どうかは 見ない）
function bigOk(b, c, id) {
  const a = ABILITIES[id];
  if (!isBig(a) || c.autoOff?.includes(id) || a.noAuto) return false;
  if (c.status?.silence || b?.noSpells) return false;
  if (!weaponOk(a, c.weaponCat)) return false;
  return mpCost(c.penChar, id) <= c.mp;
}
// ギガ・スレイブの みつもり（t … いちばん 大きい 敵）
function gigaEst(b, c, t, id) {
  const used = c.mp;
  const res = b.calcMagic(c, t, { ...ABILITIES[id].effect, base: [used * GIGA_PER, used * GIGA_PER] }, 1, true);
  return Math.min(gigaCap(t), res.dmg);
}
// mine … 使える 技 [{ id, a }]、fw … ai.js の fightWeight
export function r85aPlan(b, c, foes, mine, allies, fw) {
  if (!foes.length || c.side !== 'ally') return null;
  const chantA = mine.find(({ a }) => a.effect?.type === 'r85aChant');
  const bigIds = (c.abilities || []).filter((id) => isBig(ABILITIES[id]));
  // 定食は noAuto（ふつうの 回復には 入れない）なので、ここで 自分の 技から さがす（作戦で「使わない」に した 物は のぞく）
  const meal = (c.abilities || []).filter((id) => isMeal(ABILITIES[id]) && !c.autoOff?.includes(id) && weaponOk(ABILITIES[id], c.weaponCat) && mpCost(c.penChar, id) <= c.mp).map((id) => ({ id, a: ABILITIES[id] }));
  if (!chantA && !bigIds.length && !meal.length) return null;
  const boss = foes.find((f) => f.boss);
  // 強い 敵: ボス・こわい 敵（HP が 多い だけの 敵には ふつうの 呪文）
  const hard = !!(b.boss || boss || (fw?.hard && (fw.threat ?? 0) >= R85A_AI.threat));
  // 1) となえて いる: 大砲を うつ（ボスで MP が 多ければ ギガ・スレイブ・1体なら ラグナ・ブレード・ほかは ドラグ・スレイブ）
  if (chanting(c)) {
    const ok = bigIds.filter((id) => bigOk(b, c, id));
    if (!ok.length) return null;
    const giga = ok.find((id) => ABILITIES[id].effect.r85aGiga);
    const single = ok.find((id) => ABILITIES[id].target === 'enemy');
    const wide = ok.find((id) => ABILITIES[id].target !== 'enemy' && !ABILITIES[id].effect.r85aGiga);
    const t = boss || foes.slice().sort((x, y) => y.hp - x.hp)[0];
    // ギガ・スレイブ: ボスに とどめが させる 時・敵が 多くて MP が たっぷり ある 時（MP を 全部 使うので、ふだんは ドラグ・スレイブか ラグナ・ブレード）
    if (giga) {
      const est = gigaEst(b, c, t, giga);
      if ((boss && est >= boss.hp) || (foes.length >= 2 && c.maxMp > 0 && c.mp >= c.maxMp * R85A_AI.gigaMp)) return { type: 'ability', id: giga };
    }
    if (single && (foes.length === 1 || (boss && !wide))) return { type: 'ability', id: single, target: t.id };
    if (wide) return { type: 'ability', id: wide, target: t.id };
    if (single) return { type: 'ability', id: single, target: t.id };
    return { type: 'ability', id: ok[0] };
  }
  // 2) MP が 少ない: 定食（大砲 ＋ となえる ぶんが ない とき）
  const need = chantA && bigIds.length ? mpCost(c.penChar, chantA.id) + Math.min(...bigIds.map((id) => mpCost(c.penChar, id))) : Infinity;
  //    （HP が 少ない 時は 自分の 大もり定食。みんなの MP が 少ない 時だけ 特もり定食）
  const lowMp = c.maxMp > 0 && c.mp < need && c.mp / c.maxMp < R85A_AI.lowMp;
  const lowHp = c.maxHp > 0 && c.hp / c.maxHp < R85A_AI.lowHp;
  const self = meal.find(({ a }) => a.target === 'self');
  const all = meal.find(({ a }) => a.target === 'allies');
  //    （1回の 戦いで MEAL_CAP 回まで。オートが 食べて ばかりに ならない ように。c.r85aMeals は 戦いの 人だけ）
  if ((lowMp || (lowHp && self)) && meal.length && (c.r85aMeals || 0) < R85A_AI.mealCap && b.rng.chance(R85A_AI.meal)) {
    const thirsty = allies.filter((x) => x.maxMp > 0 && x.mp / x.maxMp < R85A_AI.lowMp).length >= 2;
    const pick = lowMp && all && (thirsty || !self) ? all : self || all;
    if (pick) {
      c.r85aMeals = (c.r85aMeals || 0) + 1;
      return { type: 'ability', id: pick.id };
    }
  }
  // 3) ボスや 強い 敵: となえる（前ぶれが 見えて いる 時は、今の きまり〈身を 守る〉に まかせる）。ざこには ふつうの 呪文
  const tele = foes.some((f) => f.telegraph);
  if (chantA && hard && !tele && bigIds.some((id) => mpCost(c.penChar, id) + mpCost(c.penChar, chantA.id) <= c.mp) && b.rng.chance(R85A_AI.chant)) return { type: 'ability', id: chantA.id };
  return null;
}
