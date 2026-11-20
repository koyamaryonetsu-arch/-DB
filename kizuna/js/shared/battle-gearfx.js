// 第64回 ⑥c・第65回: れん金で つけた 装備の 効果（data/gear-fx.js）を 戦いで うごかす
//   攻撃力・守備力・HP・素早さ・会心・属性に 強い・状態を 防ぐ … 強さの まど（stats.js の computeStats）で 足して ある
//   ここで うごかす もの:
//   属性・キラー（ふつうの 攻撃の 強さと 属性）… attackMods（battle.js の perform 'attack'・multiAttack）
//   追撃・HP吸収・MP吸収・毒／ねむり／マヒの 刃 … ふつうの 攻撃の あと（gearAfterAttack）
//   いやし・MPの いずみ … 行動の おわり（gearRegen）
//   反撃 … ふつうの 攻撃を された とき（gearCounterNote。反撃の構えと 同じ しくみ）
//   みかわし … 物理の 当たりやすさ（calcPhys の eva に gearEva）
//   イオの 力 … 「道具」の コマンドで id 'gear:weapon'（何回でも。MP は いらない）
import { ABILITIES } from './data/abilities.js?v=6f2d42a85ac3';
import { ITEMS } from './data/items.js?v=6f2d42a85ac3';
import { gearFxTotals, gearUses, fxPower } from './data/gear-fx.js?v=6f2d42a85ac3';
// 第88回: 作品の 品の とどく 広さ・玉・1回だけの「使う」（battle-r88.js）
import { r88Actor, orbMods, onceBlock, useHpCost, useAbilityOf, useWet } from './battle-r88.js?v=6f2d42a85ac3';
import { r88dqAtkMult } from './battle-r88-dq.js?v=6f2d42a85ac3'; // 第88回 G15班
// 第88回 G13班: 使った あと（スーパースター）
import { r88AfterUse } from './battle-r88.js?v=6f2d42a85ac3';
// 第88回 G19班: 変装のマスク（battle-r88-g19.js）
import { r88g19AfterUse } from './battle-r88-g19.js?v=6f2d42a85ac3';

export const GEAR_USE_PREFIX = 'gear:';

// 戦いの 味方に もたせる もの（battle.js の makeActor）
export function gearFxActor(char) {
  const t = gearFxTotals(char);
  const fx = Object.entries(t).map(([k, v]) => ({ kind: k, v, ...fxPower(k, v) }));
  const ev = fx.find((x) => x.kind === 'evade');
  return { gearFx: fx.length ? fx : null, gearUses: gearUses(char), ...(ev ? { gearEva: ev.eva } : {}), ...r88Actor(char) };
}
const fxOf = (c, kind) => (c?.side === 'ally' && Array.isArray(c.gearFx) ? c.gearFx.find((x) => x.kind === kind) : null);
const fxAll = (c, pred) => (c?.side === 'ally' && Array.isArray(c.gearFx) ? c.gearFx.filter(pred) : []);

// ふつうの 攻撃の 属性と 倍率（属性の 力・キラー）。{ element, mult }
export function attackMods(c, t) {
  let element = 'phys', mult = 1;
  const el = fxAll(c, (x) => x.el && x.kind.startsWith('el_')).sort((a, b) => b.v - a.v)[0];
  if (el) { element = el.el; mult *= el.mult; }
  else {
    // 第88回: 玉（武器に 属性が ない ときだけ）
    const o = orbMods(c);
    if (o) { element = o.element; mult *= o.mult; }
  }
  for (const s of fxAll(c, (x) => x.race && x.kind.startsWith('slay_'))) if (t?.race === s.race) mult *= s.mult;
  mult *= r88dqAtkMult(c); // 第88回 G15班: 光魔のつえ（MP）・ブラックロッド（攻撃魔力）
  return { element, mult };
}

// ふつうの 攻撃の あと（dmg … 与えた ダメージ。single … 1体への 攻撃。追撃は その 時だけ）
export function gearAfterAttack(b, c, t, dmg, ev, single = true) {
  if (!c?.gearFx || !c.alive) return;
  let total = dmg || 0;
  const ch = fxOf(c, 'chase');
  if (single && ch && t?.alive && b.rng.chance(ch.chance)) {
    ev.lines.push(`${c.name}の追撃！`);
    const m = attackMods(c, t);
    total += b.physHit(c, t, { mult: ch.mult * m.mult }, ev, m.element) || 0;
  }
  // 毒・ねむり・マヒの 刃（当たった 時）
  if (t?.alive && total > 0) {
    for (const st of ['poison', 'sleep', 'paralyze']) {
      const f = fxOf(c, st);
      if (f) b.tryStatus(c, t, { status: st, chance: f.chance, turns: [2, 3] }, ev, 1);
    }
  }
  const dr = fxOf(c, 'drain');
  if (dr && total > 0 && c.hp < c.maxHp) {
    const n = Math.min(c.maxHp - c.hp, Math.max(1, Math.round(total * dr.rate)));
    c.hp += n;
    ev.lines.push(`${c.name}のHPが${n}回復した！`);
    if (!ev.upd.includes(c)) ev.upd.push(c);
  }
  const mp = fxOf(c, 'mana');
  if (mp && total > 0 && c.mp < c.maxMp) {
    const n = Math.min(c.maxMp - c.mp, mp.mp);
    c.mp += n;
    ev.lines.push(`${c.name}のMPが${n}回復した！`);
    if (!ev.upd.includes(c)) ev.upd.push(c);
  }
}

// 行動の おわり: いやし・MPの いずみ（しずかに。数は ステータスの まどで わかる）
export function gearRegen(b, c, ev) {
  if (!c?.alive) return;
  const r = fxOf(c, 'regen');
  const m = fxOf(c, 'mpregen');
  if (r && c.hp < c.maxHp) c.hp = Math.min(c.maxHp, c.hp + Math.max(1, Math.round(c.maxHp * r.rate)));
  if (m && c.mp < c.maxMp) c.mp = Math.min(c.maxMp, c.mp + m.mp);
  if ((r || m) && !ev.upd.includes(c)) ev.upd.push(c);
}

// ふつうの 攻撃を された（反撃の しるし。1回の 行動に 1回だけ）
export function gearCounterNote(b, c, t, ev) {
  const k = fxOf(t, 'counter');
  if (!k || c.side === t.side || !t.alive) return;
  if ((ev.counters || []).some((x) => x.by === t.id && x.on === c.id)) return;
  if (!b.rng.chance(k.chance)) return;
  ev.counters = ev.counters || [];
  ev.counters.push({ by: t.id, on: c.id, gear: k.mult });
}

// 「道具」で 使う（武器の イオの 力）
export function gearUseOf(c, id) {
  if (typeof id !== 'string' || !id.startsWith(GEAR_USE_PREFIX)) return null;
  const slot = id.slice(GEAR_USE_PREFIX.length);
  return (c?.gearUses || []).find((x) => x.slot === slot) || null;
}
export function gearUseCheck(b, c, id) {
  if (typeof id !== 'string' || !id.startsWith(GEAR_USE_PREFIX)) return null;
  const u = gearUseOf(c, id);
  if (!u || !ABILITIES[useAbilityOf(b, c, u)]) return { ok: false, reason: '使えない' };
  const once = onceBlock(u); // 第88回: 1つの 戦いで その 品 1回
  if (once) return { ok: false, reason: once };
  const a = ABILITIES[useAbilityOf(b, c, u)]; // G9班: 天候棒は 天気で かわる
  if (b.noSpells && (a.kind === 'spell' || a.spellLike)) return { ok: false, reason: '呪文の力がすいこまれる' };
  return { ok: true };
}
export function gearUse(b, c, cmd, ev) {
  const u = gearUseOf(c, cmd.id);
  if (!u) return false;
  const abId = useAbilityOf(b, c, u); // G9班: 天候棒は 天気で かわる（shared/battle-r88.js）
  const a = ABILITIES[abId];
  ev.name = a?.name || '';
  ev.lines.push(`${c.name}は${ITEMS[u.id]?.name || '装備'}をかかげた！`);
  if (!a || onceBlock(u)) {
    ev.lines.push('しかし、何も起こらなかった！');
    return true;
  }
  if (useWet(b, c, u, ev)) return true; // G14班: 発火布の手ぶくろは 雨だと しめって 火が 出ない（1回は へらない）
  // 第88回: 作品の 品は 1つの 戦いで 1回（ふうじられて いても 使った ことに なる）
  if (u.once) {
    u.used = true;
    if (u.group) for (const x of c.gearUses || []) if (x.group === u.group) x.used = true; // G12班: もしもボックス（えらんで 使う 品）
    if (!ev.upd.includes(c)) ev.upd.push(c);
  }
  if (c.status?.silence && (a.kind === 'spell' || a.spellLike)) {
    ev.lines.push('しかし呪文はふうじこめられている！');
    ev.fx = { type: 'fizzle', actor: c.id };
    return true;
  }
  ev.ability = abId;
  // G7班: 仲間 1人の 技（暗黒鏡）は、自分 いがいで HPの わりあいが いちばん 少ない 仲間（いなければ 自分）
  const target = a.target === 'ally' ? (b.sideOf(c, true).filter((x) => x.alive && x !== c).sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0]?.id ?? c.id) : a.target === 'enemy' || a.target === 'group' ? b.aliveEnemies()[0]?.id : undefined;
  const sub = { type: 'ability', id: abId, target };
  const targets = b.targetsFor(c, a, sub);
  // 第88回 G18班: 技に useSay（使った 時の ことば）が あれば、それを 出す（おしり探ていの スーツ）
  ev.lines.push(...(a.useSay ? a.useSay.replace(/\{a\}/g, c.name).split('\n') : [`${a.name}の力が、はなたれた！`]));
  b.applyAbility(c, a, sub, ev, 1, targets);
  useHpCost(c, u, ev); // 第88回 G2班: 使うと HPが 少し へる 品（雷神）
  r88AfterUse(b, c, a, ev); // 第88回 G13班: スーパースター
  r88g19AfterUse(b, c, a, ev); // 第88回 G19班: 変装のマスク（次に 受ける 1回の 攻撃を かわす）
  return true;
}
