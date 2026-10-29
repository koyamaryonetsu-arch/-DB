// 第37回 A: サファラ闘技場の 王者たちの しかけ（battle.js・ai.js・battle-ch5.js から 短い よびだしで よぶ。ほかの たたかいは かわらない）
//
// ・チームの 合体技（monsters の arena.team。ランク2 砂嵐三兄弟・ランク8 伝説のチャンピオン）
//   リーダー（arena.lead）が 合図（前ぶれ。cond 'c5:arTeam2' … 組の 2人いじょうが 生きている）→ 次の 番に 合体技（効果 arCombo）。
//   ダメージは 生きている 組の 数 ÷ はじめの 組の 数 ばい（3人 そろえば そのまま・2人なら 3分の2）。1人だけに なると くずれて 出せない
// ・属性の よろい（monsters の arena.armor。ランク7 七色の魔導王）
//   炎・氷・雷・風の どれかを まとう（効果 arArmor。はじめから 1つ まとっている）。よろいと おなじ 属性の 攻撃は すいこんで HPが ふえる
//   （absorb ばい）。弱点（weak）の 属性で 当てると weakMult ばいの ダメージで よろいが くだける。くだけて から wait 回 動くと また まとう
//   （cond 'c5:arNoArmor'）。よろいの 大呪文（効果 arSpell）は まとっている よろいと おなじ 属性
// ・オートの 仲間（ふつう）は 何も かわらない。シミュレーター（tools/sim-arena.mjs）の 知っている 人（b.knowsArena）は、
//   大技の 前に 身を 守る（arenaPlan）・合体技の 組の 子分を 先に ねらう・よろいの 属性を さけて 弱点を ねらう・
//   ふたごの 剣士は HPの 多い ほうを ねらって 2人を そろえて たおす（arenaAdjust）
import { MONSTERS } from './data/monsters.js?v=894e2368ad04';
import { ABILITIES, ELEMENT_NAMES } from './data/abilities.js?v=894e2368ad04';
// たがいに よびあうが、つかうのは たたかいの 中だけ
import { atbRate } from './battle.js?v=894e2368ad04';

// 知っている 人が 身を 守る 大技（前ぶれの つぎ）
export const ARENA_BIG = new Set(['m_ar1_bomb', 'm_ar2_combo', 'm_ar5_finish', 'm_ar7_rainbow', 'm_ar8_combo']);
const confOf = (m) => MONSTERS[m?.species]?.arena || null;
const teamOf = (m) => confOf(m)?.team || null;
const armorConf = (m) => confOf(m)?.armor || null;
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
    if (!t || all) continue;
    const tc = confOf(t);
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
