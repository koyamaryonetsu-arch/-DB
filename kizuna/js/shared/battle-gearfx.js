// 第64回 ⑥c: れん金で つけた 装備の 効果（data/gear-fx.js）を 戦いで うごかす
//   追撃・HP吸収・MP吸収 … ふつうの 攻撃の あと（battle.js の perform 'attack'・multiAttack）
//   いやし … 行動の おわり（MP回復の 装備と 同じ ところ）
//   反撃 … ふつうの 攻撃を された とき（noteCounter・resolveCounters。反撃の構えと 同じ しくみ）
//   使う … 「道具」の コマンドで id 'gear:<部位>'（何回でも。MP は いらない）
import { ABILITIES } from './data/abilities.js?v=49f690cedd1e';
import { ITEMS } from './data/items.js?v=49f690cedd1e';
import { gearFxOf, gearUses, fxPower } from './data/gear-fx.js?v=49f690cedd1e';

export const GEAR_USE_PREFIX = 'gear:';

// 戦いの 味方に もたせる もの（battle.js の makeActor）
export function gearFxActor(char) {
  const fx = gearFxOf(char).map((x) => ({ kind: x.kind, slot: x.slot, ...fxPower(x.kind, x.plus) }));
  return { gearFx: fx.length ? fx : null, gearUses: gearUses(char) };
}
const fxOf = (c, kind) => (c?.side === 'ally' && Array.isArray(c.gearFx) ? c.gearFx.find((x) => x.kind === kind) : null);

// ふつうの 攻撃の あと（dmg … 与えた ダメージ。single … 1体への 攻撃。追撃は その 時だけ）
export function gearAfterAttack(b, c, t, dmg, ev, single = true) {
  if (!c?.gearFx || !c.alive) return;
  let total = dmg || 0;
  const ch = fxOf(c, 'chase');
  if (single && ch && t?.alive && b.rng.chance(ch.chance)) {
    ev.lines.push(`${c.name}の追撃！`);
    total += b.physHit(c, t, { mult: ch.mult }, ev, 'phys') || 0;
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

// 行動の おわり: いやし（しずかに。数は ステータスの まどで わかる）
export function gearRegen(b, c, ev) {
  const r = fxOf(c, 'regen');
  if (!r || !c.alive || c.hp >= c.maxHp) return;
  c.hp = Math.min(c.maxHp, c.hp + Math.max(1, Math.round(c.maxHp * r.rate)));
  if (!ev.upd.includes(c)) ev.upd.push(c);
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

// 「道具」で 使う 装備の 効果
export function gearUseOf(c, id) {
  if (typeof id !== 'string' || !id.startsWith(GEAR_USE_PREFIX)) return null;
  const slot = id.slice(GEAR_USE_PREFIX.length);
  return (c?.gearUses || []).find((x) => x.slot === slot) || null;
}
export function gearUseCheck(b, c, id) {
  if (typeof id !== 'string' || !id.startsWith(GEAR_USE_PREFIX)) return null;
  const u = gearUseOf(c, id);
  if (!u || !ABILITIES[u.ability]) return { ok: false, reason: '使えない' };
  const a = ABILITIES[u.ability];
  if (b.noSpells && (a.kind === 'spell' || a.spellLike)) return { ok: false, reason: '呪文の力がすいこまれる' };
  return { ok: true };
}
export function gearUse(b, c, cmd, ev) {
  const u = gearUseOf(c, cmd.id);
  if (!u) return false;
  const a = ABILITIES[u.ability];
  ev.name = a?.name || '';
  ev.lines.push(`${c.name}は${ITEMS[u.id]?.name || '装備'}をかかげた！`);
  if (!a) {
    ev.lines.push('しかし、何も起こらなかった！');
    return true;
  }
  if (c.status?.silence && (a.kind === 'spell' || a.spellLike)) {
    ev.lines.push('しかし呪文はふうじこめられている！');
    ev.fx = { type: 'fizzle', actor: c.id };
    return true;
  }
  ev.ability = u.ability;
  // 1人に かける 回復は 自分に。敵 1体・1グループは いちばん 前の 敵
  const target = a.target === 'ally' ? c.id : a.target === 'enemy' || a.target === 'group' ? b.aliveEnemies()[0]?.id : undefined;
  const sub = { type: 'ability', id: u.ability, target };
  const targets = b.targetsFor(c, a, sub);
  ev.lines.push(`${a.name}の力が、はなたれた！`);
  b.applyAbility(c, a, sub, ev, 1, targets);
  return true;
}
