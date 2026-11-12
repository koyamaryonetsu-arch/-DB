// 第37回 A: サファラ闘技場の 王者たちの しかけ（battle.js・ai.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・チームの 合体技（monsters の arena.team。ランク2 砂嵐三兄弟・ランク8 伝説のチャンピオン・第65回 ランク10 星の大王者）
//   リーダー（arena.lead）が 合図（前ぶれ。cond 'c5:arTeam2' … 組の 2人いじょうが 生きている）→ 次の 番に 合体技（効果 arCombo）。
//   ダメージは 生きている 組の 数 ÷ はじめの 組の 数 ばい（3人 そろえば そのまま・2人なら 3分の2）。1人だけに なると くずれて 出せない
// ・属性の よろい（monsters の arena.armor。ランク7 七色の魔導王・第65回 ランク10 星の大王者〈合体技の 組の リーダーでも ある〉）
//   炎・氷・雷・風の どれかを まとう（効果 arArmor。はじめから 1つ まとっている）。よろいと おなじ 属性の 攻撃は すいこんで HPが ふえる
//   （absorb ばい）。弱点（weak）の 属性で 当てると weakMult ばいの ダメージで よろいが くだける。くだけて から wait 回 動くと また まとう
//   （cond 'c5:arNoArmor'）。よろいの 大呪文（効果 arSpell）は まとっている よろいと おなじ 属性
// ・オートの 仲間（ふつう）は 何も かわらない。シミュレーター（tools/sim-arena.mjs）の 知っている 人（b.knowsArena）は、
//   大技の 前に 身を 守る（arenaPlan）・合体技の 組の 子分を 先に ねらう・よろいの 属性を さけて 弱点を ねらう・
//   ふたごの 剣士は HPの 多い ほうを ねらって 2人を そろえて たおす（arenaAdjust）
// ・第68回 C: こおる・とける（monsters の arena.frost。ランク11 白銀の大王者ボレアス）
//   はじめは 体が こおっている（arFrozen）。こおっている 間は 炎 いがいの ダメージが cut ばい（ほとんど 効かない）。
//   炎の ダメージが 最大HPの melt ぶん たまると とける（大ふぶきの 前ぶれも 止まる）。とけている 間は thawMult ばいの ダメージ。
//   とけて から wait 回 動くと 自分で また こおる（cond 'c5:arThawWait'・効果 arFreeze）。おともの 雪の子（arena.frostHelp）は、
//   王者が とけていると すぐに こおらせる（cond 'c5:arKingThawed'）→ 雪の子を 先に たおすと、とけている 時間が 長い
//   知っている 人: こおっている 王者には 炎・とけたら みんなで 王者・雪の子が いる 間は 雪の子を 先に
// ・第74回 C: あわの よろい（monsters の arena.bubble。ランク12 深海の大王者リヴァイアス）
//   はじめは あわの よろいを まとっている（arBubble … のこりの あわの 数。max こ）。あわが ある 間は、どんな 攻撃も
//   1回 当たるごとに あわが 1つ はじけて ダメージは 0（強い 技でも 弱い 技でも おなじ 1つ。みんなを ねらう 技・何回も 打つ 技が とくい）。
//   あわが ぜんぶ はじけると、openMult ばいの ダメージ（大チャンス）。はじけて から wait 回 動くと、また あわを まとう
//   （cond 'c5:arBubbleWait'・効果 arBubble）。あわを まとっている 間に うずを まき始めると、次の 番に 大うずしお（ARENA_BIG）。
//   大うずしおは、のこりの あわが 多いほど 強い（bigBase ＋ bigPer × あわの 数 ばい）→ 前ぶれの 間に あわを わると 弱く なる
//   知っている 人: あわが ある 間は 王者に 強い 技を 使わない（ふつうの 攻撃・みんなを ねらう 技・何回も 打つ 技で あわを わる）・
//   あわが なくなったら みんなで 王者（合体技も その 時だけ）
import { MONSTERS } from './data/monsters.js?v=ddd62e12d679';
import { ABILITIES, ELEMENT_NAMES } from './data/abilities.js?v=ddd62e12d679';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=ddd62e12d679';

// 知っている 人が 身を 守る 大技（前ぶれの つぎ）
export const ARENA_BIG = new Set(['m_ar1_bomb', 'm_ar2_combo', 'm_ar5_finish', 'm_ar7_rainbow', 'm_ar8_combo', 'm_ar9_fire_blast', 'm_ar9_ice_blast', 'm_ar10_combo', 'm_ar11_blizzard', 'm_ar12_maelstrom']);
const confOf = (m) => MONSTERS[m?.species]?.arena || null;
const teamOf = (m) => confOf(m)?.team || null;
const armorConf = (m) => confOf(m)?.armor || null;
const frostConf = (m) => confOf(m)?.frost || null;
// 第74回 C: あわの よろい（王者だけ）
export const bubbleConf = (m) => confOf(m)?.bubble || null;
const prim = (a) => (a?.effect?.type === 'multi' ? a.effect.parts?.[0] || a.effect : a?.effect || {});
const actsOf = (m) => Object.values(m.used || {}).reduce((s, n) => s + n, 0);
// 組の 人（たおれた 人も ふくむ・にげた 人は のぞく）
export function teamMembers(b, m) {
  const team = teamOf(m);
  return team ? b.enemies.filter((e) => teamOf(e) === team) : [];
}
export const teamAlive = (b, m) => teamMembers(b, m).filter((e) => e.alive);

// ───────────── はじめ（battle.js の constructor）─────────────
// 属性の よろいを まとった まま 始まる
export function setupArena(b) {
  for (const e of b.enemies) {
    if (armorConf(e) && !e.arArmor) wearArmor(b, e, null);
    if (frostConf(e) && e.arFrozen === undefined) freeze(b, e, null);
    if (bubbleConf(e) && e.arBubble === undefined) wearBubbles(b, e, null);
  }
}

// ───────────── 魔物の こうどうの じょうけん（battle-ch5.js の towerCond から。'c5:' の あと）─────────────
export function arenaCond(b, m, cond) {
  if (cond === 'arTeam2') return teamAlive(b, m).length >= 2;
  if (cond === 'arNoArmor') {
    const conf = armorConf(m);
    return !!conf && !m.arArmor && actsOf(m) - (m.arBreakAt ?? -99) >= (conf.wait ?? 2);
  }
  if (cond === 'arArmored') return !!m.arArmor;
  // 第68回 C: こおる・とける
  if (cond === 'arFrozen') return !!frostConf(m) && !!m.arFrozen;
  if (cond === 'arThawWait') {
    const conf = frostConf(m);
    return !!conf && !m.arFrozen && actsOf(m) - (m.arThawAt ?? -99) >= (conf.wait ?? 3);
  }
  if (cond === 'arKingThawed') return !!thawedKing(b, m);
  // 第74回 C: あわの よろい
  if (cond === 'arBubbled') return !!bubbleConf(m) && m.arBubble > 0;
  if (cond === 'arBubbleWait') {
    const conf = bubbleConf(m);
    return !!conf && !(m.arBubble > 0) && actsOf(m) - (m.arPopAt ?? -99) >= (conf.wait ?? 3);
  }
  return null;
}

// ───────────── 技の こうか（battle-ch5.js の towerEffect から）─────────────
export function arenaEffect(b, c, a, eff, ev, targets = []) {
  switch (eff.type) {
    case 'arCombo': combo(b, c, a, eff, ev, targets); return true;
    case 'arArmor': {
      wearArmor(b, c, ev);
      return true;
    }
    case 'arFreeze': {
      // 自分（王者）か、とけている 王者を こおらせる（雪の子）
      const k = frostConf(c) ? c : thawedKing(b, c);
      if (k && !k.arFrozen) freeze(b, k, ev, k === c ? null : c);
      else ev.lines.push('しかし、何もおこらなかった。');
      return true;
    }
    case 'arBubble': {
      // 第74回 C: あわの よろいを まとい直す（もう ぜんぶ ある ときは 何も おこらない）
      if (bubbleConf(c) && c.arBubble < bubbleConf(c).max) wearBubbles(b, c, ev);
      else ev.lines.push('しかし、何もおこらなかった。');
      return true;
    }
    case 'arSpell': {
      const conf = armorConf(c);
      const el = c.arArmor || (conf ? b.rng.pick(conf.els) : 'fire');
      ev.lines.push(`${ELEMENT_NAMES[el]}の力が、うずをまいた！`);
      b.applyAbility(c, { ...a, anim: a.anim, effect: { type: 'magic', element: el, base: eff.base, thr: eff.thr ?? 99 } }, {}, ev, 1, targets);
      return true;
    }
    default: return false;
  }
}

function combo(b, c, a, eff, ev, targets) {
  const all = teamMembers(b, c);
  const alive = all.filter((e) => e.alive);
  if (alive.length < 2 || !all.length) {
    ev.lines.push('しかし、仲間がいない…。\n合体技のかまえが、くずれてしまった！');
    ev.arBroken = true;
    ev.fx = { type: 'ability', anim: 'none', actor: c.id, targets: [], side: c.side };
    return;
  }
  const k = alive.length / all.length;
  if (alive.length < all.length) ev.lines.push(`（${alive.length}人だけの合体技だ！いきおいが弱い…！）`);
  ev.arCombo = alive.length;
  b.applyAbility(c, { ...a, effect: { type: 'phys', mult: (eff.mult ?? 1.5) * k, ignoreDef: eff.ignoreDef || 0 } }, {}, ev, 1, targets);
}

// よろいを まとう（ev が null … 戦いの はじめ。ことばは 出さない）
function wearArmor(b, c, ev) {
  const conf = armorConf(c);
  if (!conf) return;
  const pool = conf.els.filter((e) => e !== c.arLast);
  const el = b.rng.pick(pool.length ? pool : conf.els);
  c.arArmor = el;
  c.arLast = el;
  const weak = conf.weak?.[el];
  // 弱点の ダメージは arenaDamage（resist には 入れない。オートの みつもりには 見えない）
  c.arBase = c.arBase || { ...c.resist };
  c.resist = { ...c.arBase, [el]: Math.min(c.arBase[el] ?? 1, 1) };
  if (weak) c.resist[weak] = Math.max(c.arBase[weak] ?? 1, 1);
  if (!ev) return;
  ev.lines.push(`${c.name}は、${ELEMENT_NAMES[el]}のよろいをまとった！`, `（${ELEMENT_NAMES[el]}の攻撃は、すいこまれてしまう！${weak ? `${ELEMENT_NAMES[weak]}が弱点だ！` : ''}）`);
  ev.fx = { type: 'ability', anim: 'buff', actor: c.id, targets: [c.id], side: c.side, element: el };
  ev.arArmor = el;
  ev.upd.push(c);
}

// ───────────── 第68回 C: こおる・とける ─────────────
// 雪の子（arena.frostHelp）から見て、とけている 王者（いなければ null）
function thawedKing(b, m) {
  if (!confOf(m)?.frostHelp) return null;
  return b.enemies.find((e) => e.alive && e.side === m.side && frostConf(e) && !e.arFrozen) || null;
}
// こおる（ev が null … 戦いの はじめ。by … こおらせた 雪の子）
function freeze(b, c, ev, by = null) {
  const conf = frostConf(c);
  if (!conf) return;
  c.arFrozen = true;
  c.arMelt = 0;
  // 炎が よく 効く（オートの みつもりにも 見える）。とけたら もとに もどす
  c.frBase = c.frBase || { ...c.resist };
  c.resist = { ...c.frBase, fire: Math.max(c.frBase.fire ?? 1, conf.fireRes ?? 1.5) };
  if (!ev) return;
  if (by) ev.lines.push(`${by.name}は、${c.name}に、つめたいいきをふきかけた！`);
  ev.lines.push(`${c.name}の体が、かちかちにこおりついた！`, '（こおった体には、炎いがいは、ほとんど効かない！炎でとかそう！）');
  ev.fx = { type: 'ability', anim: 'guard', actor: (by || c).id, targets: [c.id], side: c.side, element: 'ice' };
  ev.arFreeze = c.id;
  ev.upd.push(c);
}
function thaw(b, t, ev) {
  t.arFrozen = false;
  t.arMelt = 0;
  t.arThawAt = actsOf(t);
  if (t.frBase) t.resist = { ...t.frBase };
  ev.postLines = ev.postLines || [];
  ev.postLines.push(`${t.name}のこおりが、とけた！今が大チャンスだ！`);
  if (t.telegraph && ARENA_BIG.has(t.telegraph)) {
    t.telegraph = null;
    ev.postLines.push('大ふぶきの前ぶれが、止まった！');
  }
  ev.arThaw = t.id;
  ev.upd.push(t);
}
// ダメージ（arenaDamage から）。こおっている … 炎は とかす・ほかは cut ばい / とけている … thawMult ばい
function frostDamage(b, c, t, dmg, info, ev) {
  const conf = frostConf(t);
  if (!t.arFrozen) return Math.round(dmg * (conf.thawMult ?? 1.3));
  if (info?.element === 'fire') {
    t.arMelt = (t.arMelt || 0) + dmg;
    if (t.arMelt >= t.maxHp * (conf.melt ?? 0.05)) thaw(b, t, ev);
    return dmg;
  }
  const line = `こおった体に、はばまれた…！`;
  if (!ev.lines.includes(line)) ev.lines.push(line);
  return Math.max(1, Math.round(dmg * (conf.cut ?? 0.35)));
}

// ───────────── 第74回 C: あわの よろい ─────────────
// あわを まとう（ev が null … 戦いの はじめ）
function wearBubbles(b, c, ev) {
  const conf = bubbleConf(c);
  if (!conf) return;
  c.arBubble = conf.max ?? 4;
  if (!ev) return;
  ev.lines.push(`${c.name}の体が、${c.arBubble}つの大きなあわに、つつまれた！`, '（あわは、どんな攻撃でも、1回当たると1つはじける！）');
  ev.fx = { type: 'ability', anim: 'guard', actor: c.id, targets: [c.id], side: c.side, element: 'water' };
  ev.arBubble = c.id;
  ev.upd.push(c);
}
// ダメージ（arenaDamage から）。あわが ある … 1つ はじけて ダメージは なし（null）/ ない … openMult ばい
function bubbleDamage(b, c, t, dmg, ev) {
  const conf = bubbleConf(t);
  if (!(t.arBubble > 0)) return Math.round(dmg * (conf.openMult ?? 1.3));
  t.arBubble -= 1;
  ev.lines.push(t.arBubble > 0 ? `あわが1つはじけて、攻撃をうけとめた！（のこりのあわ ${t.arBubble}つ）` : '最後のあわがはじけて、攻撃をうけとめた！');
  ev.results = ev.results || [];
  ev.results.push({ id: t.id, dmg: 0, pop: true });
  if (t.arBubble <= 0) {
    t.arPopAt = actsOf(t);
    ev.postLines = ev.postLines || [];
    ev.postLines.push(`${t.name}のあわのよろいが、全部はじけた！今が大チャンスだ！`);
    ev.arPop = t.id;
  }
  ev.upd.push(t);
  return null;
}

// あわの 王者の 大技（大うずしお）: のこりの あわが 多いほど 強い
function bubbleBig(c, dmg, ev) {
  const conf = bubbleConf(c);
  const n = Math.max(0, c.arBubble || 0);
  if (!ev.arBigNote) {
    ev.arBigNote = true;
    ev.lines.push(n > 0 ? `（あわが${n}つのこっていて、うずがとても大きい！）` : '（あわが全部はじけていて、うずが小さい！）');
  }
  return Math.max(1, Math.round(dmg * ((conf.bigBase ?? 0.4) + (conf.bigPer ?? 0.2) * n)));
}

function breakArmor(b, t, ev) {
  const el = t.arArmor;
  t.arArmor = null;
  t.arBreakAt = actsOf(t);
  if (t.arBase) t.resist = { ...t.arBase };
  ev.postLines = ev.postLines || [];
  const line = `弱点をついた！${ELEMENT_NAMES[el]}のよろいが、くだけちった！`;
  if (!ev.postLines.includes(line)) ev.postLines.push(line);
  ev.arBreak = t.id;
  ev.upd.push(t);
}

// ───────────── ダメージ（battle.js の damage）─────────────
// よろいと おなじ 属性 … すいこむ（null を かえすと ダメージは なし）/ 弱点 … 大きく 当たって よろいが くだける
export function arenaDamage(b, c, t, dmg, info, ev) {
  if (c && t && c.side !== t.side && bubbleConf(c) && ARENA_BIG.has(ev.ability) && dmg > 0) return bubbleBig(c, dmg, ev);
  if (t && c && c.side !== t.side && bubbleConf(t) && t.alive !== false && dmg > 0) return bubbleDamage(b, c, t, dmg, ev);
  if (t && c && c.side !== t.side && frostConf(t) && t.alive !== false && dmg > 0) return frostDamage(b, c, t, dmg, info, ev);
  if (!t?.arArmor || !c || c.side === t.side) return dmg;
  const conf = armorConf(t);
  const el = info?.element;
  if (!conf || !el || el === 'phys') return dmg;
  if (el === t.arArmor) {
    const heal = Math.max(0, Math.min(t.maxHp - t.hp, Math.round(dmg * (conf.absorb ?? 0.5))));
    t.hp += heal;
    ev.lines.push(`${ELEMENT_NAMES[el]}のよろいが、${ELEMENT_NAMES[el]}の力をすいこんだ！`, heal > 0 ? `${t.name}のHPが${heal}回復した！` : `${t.name}はダメージを受けない！`);
    ev.results = ev.results || [];
    ev.results.push({ id: t.id, heal, absorb: true, element: el });
    ev.upd.push(t);
    return null;
  }
  if (el === conf.weak?.[t.arArmor]) {
    breakArmor(b, t, ev);
    return Math.round(dmg * (conf.weakMult ?? 1.5));
  }
  return dmg;
}

// ───────────── 知っている 人（シミュレーター）─────────────
// 大技が 自分の 次の 番より 先に 来るなら 身を 守る（合体技は 組が 2人いじょう いる とき）
export function arenaPlan(b, c) {
  if (c.side !== 'ally' || !b.knowsArena) return null;
  const mine = 100 / atbRate(c);
  for (const e of b.aliveEnemies()) {
    if (!ARENA_BIG.has(e.telegraph)) continue;
    if (teamOf(e) && teamAlive(b, e).length < 2) continue;
    if ((100 - e.atb) / atbRate(e) <= mine) return { type: 'defend' };
  }
  return null;
}

// 第74回 C: 知っている 人が あわを 1つ わる ことの ねうち（ダメージの 点数と くらべる）
const ARENA_POP_VALUE = 900;
// えらぶ 技の 点数を かえる（ai.js の chooseAttack。opts … { cmd, final }）
export function arenaAdjust(b, c, opts) {
  if (c.side !== 'ally' || !b.knowsArena) return;
  const foes = b.aliveEnemies();
  if (!foes.some((f) => confOf(f))) return;
  for (const o of opts) {
    const cmd = o.cmd;
    const t = b.get(cmd.target);
    const a = cmd.type === 'ability' ? ABILITIES[cmd.id] : null;
    const all = a?.target === 'enemies';
    const el = a ? prim(a).element : null;
    const hit = all ? foes : t ? [t] : [];
    // よろい: おなじ 属性は さける・弱点は ねらう
    for (const f of hit) {
      if (!f.arArmor || !el) continue;
      const conf = armorConf(f);
      if (el === f.arArmor) o.final *= 0.02;
      else if (el === conf?.weak?.[f.arArmor]) o.final *= 1.8;
    }
    // 第68回 C: こおっている 王者には 炎・ほかの 攻撃は さける。とけたら 王者を ねらう
    for (const f of hit) {
      if (!frostConf(f)) continue;
      if (f.arFrozen) o.final *= el === 'fire' ? 2.5 : 0.25;
      else o.final *= foes.some((x) => confOf(x)?.frostHelp) ? 1.3 : 1.8;
    }
    // 第74回 C: あわの よろい。あわが ある 間は 王者に 強い 技を 使わない（1回 当たれば 1つ われる。ふつうの 攻撃・何回も 打つ 技で わる）。
    //   みんなを ねらう 技は、あわを わりながら おとも にも 当たるので よい。あわが なくなったら 王者を ねらう
    for (const f of hit) {
      if (!bubbleConf(f)) continue;
      if (f.arBubble > 0) {
        if (all) o.final *= 1.3;
        else o.final = (cmd.type === 'attack' ? 1 : o.mp > 0 ? 0.25 : 0.6) * ARENA_POP_VALUE * Math.min(f.arBubble, prim(a).hits || 1);
      } else o.final *= 1.8;
    }
    if (!t || all) continue;
    const tc = confOf(t);
    // 雪の子（王者を こおらせる）を 先に（王者が こおっている 間）
    if (tc?.frostHelp) {
      const king = foes.find((f) => frostConf(f));
      if (king?.arFrozen && el !== 'fire') o.final *= 2.4;
    }
    // 合体技の 組の 子分を 先に（リーダーより）
    if (tc?.team && !tc.lead && teamAlive(b, t).length >= 2) o.final *= 2.4;
    // ふたご: HPの 多い ほうを ねらう。もう片方が 元気な うちに たおして しまう 一撃は さける
    if (tc?.twin) {
      const p = foes.find((f) => f.species === tc.twin);
      if (p) {
        const ratio = t.hp / t.maxHp, pr = p.hp / p.maxHp;
        o.final *= ratio >= pr ? 1.6 : 0.6;
        if (pr > 0.3 && o.score >= t.hp) o.final *= 0.3;
      }
    }
  }
}
