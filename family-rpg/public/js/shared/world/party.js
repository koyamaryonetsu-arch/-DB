// パーティー・サポートなかま・ゲスト
import { newCharacter, computeStats, fullHeal, gainExp, gainJobExp, expForLevel } from '../stats.js';
import { jobExpForLevel } from '../data/jobs.js';
import { NPC_SUPPORTS, GUESTS } from '../data/shops.js';

export const PARTY_MAX = 4;
// パーティーの だれかが もっていれば みんなが とおれる フラグ
export const GATE_FLAGS = ['bridge_fixed', 'c1_door'];

let partySeq = 1;

export function newParty(world, leaderSid) {
  const p = { id: 'p' + (partySeq++), leader: leaderSid, members: [leaderSid], supports: [], guests: [], bond: 0 };
  world.parties.set(p.id, p);
  return p;
}

export function partyOf(world, s) {
  return world.parties.get(s.partyId);
}

export function partySize(p) {
  return p.members.length + p.supports.length;
}

// 酒場で えらべる なかま
export function tavernList(world, s) {
  const c = s.char;
  const p = partyOf(world, s);
  const out = [];
  for (const n of NPC_SUPPORTS) {
    if (n.unlock && !c.flags[n.unlock]) continue;
    out.push({ key: n.id, name: n.name, job: n.job, level: npcLevel(c), look: n.look, desc: n.desc, family: false, hired: p.supports.some((x) => x.key === n.id) });
  }
  for (const other of Object.values(world.data.characters)) {
    if (other.id === c.id) continue;
    const onlineInParty = p.members.some((sid) => world.sessions.get(sid)?.charId === other.id);
    if (onlineInParty) continue;
    out.push({
      key: 'fam:' + other.id, name: other.name, job: other.job, level: other.level, look: other.look,
      desc: `かぞくの キャラクター（${other.name}）`, family: true, hired: p.supports.some((x) => x.key === 'fam:' + other.id),
    });
  }
  return out;
}

function npcLevel(c) {
  return Math.max(1, c.level);
}

// レベルに あった そうび
const TIER_GEAR = [
  [1, { warrior: ['wood_sword', 'cloth'], monk: [null, 'cloth'], priest: ['oak_staff', 'cloth'], mage: ['oak_staff', 'cloth'], performer: ['feather_fan', 'cloth'] }],
  [4, { warrior: ['bronze_sword', 'travel_clothes', 'leather_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'leather_hat'], priest: ['bronze_spear', 'travel_clothes', 'leather_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'leather_hat'], performer: ['feather_fan', 'travel_clothes', 'leather_shield', 'leather_hat'] }],
  [8, { warrior: ['bronze_sword', 'chain_mail', 'scale_shield', 'leather_hat'], monk: ['bronze_knuckle', 'martial_gi', null, 'bandana'], priest: ['bronze_spear', 'leather_armor', 'scale_shield', 'leather_hat'], mage: ['oak_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['feather_fan', 'leather_armor', 'scale_shield', 'bandana'] }],
  [12, { warrior: ['iron_sword', 'iron_armor', 'iron_shield', 'iron_helm'], monk: ['iron_claw', 'dragon_gi', null, 'bandana'], priest: ['healing_staff', 'holy_robe', 'scale_shield', 'leather_hat'], mage: ['wizard_staff', 'wizard_robe', null, 'pointy_hat'], performer: ['dancer_fan', 'leather_armor', 'scale_shield', 'bandana'] }],
];

export function makeNpcSupportChar(def, level) {
  const c = newCharacter({ id: def.id, name: def.name, look: def.look, job: def.job });
  c.level = level;
  c.exp = expForLevel(level);
  const jl = Math.max(1, Math.min(14, Math.floor(level * 0.8)));
  c.jobs[def.job] = { lv: jl, exp: jobExpForLevel(jl) };
  let gear = TIER_GEAR[0][1];
  for (const [lv, g] of TIER_GEAR) if (level >= lv) gear = g;
  const [w, a, s, h] = gear[def.job];
  c.equip = { weapon: w || null, armor: a || null, shield: s || null, head: h || null, acc: null };
  c.tactics = def.tactics || 'balanced';
  fullHeal(c);
  return c;
}

export function hireSupport(world, s, key) {
  const p = partyOf(world, s);
  if (p.leader !== s.id) return { ok: false, reason: 'サポートなかまを つれていけるのは リーダー だけです' };
  if (partySize(p) >= PARTY_MAX) return { ok: false, reason: 'パーティーが いっぱいです（4人まで）' };
  if (p.supports.some((x) => x.key === key)) return { ok: false, reason: 'もう パーティーに いるよ' };
  let snap;
  if (key.startsWith('fam:')) {
    const other = world.data.characters[key.slice(4)];
    if (!other) return { ok: false, reason: 'みつかりません' };
    snap = JSON.parse(JSON.stringify(other));
    snap.status = {};
    fullHeal(snap);
    snap.ownerId = other.id;
  } else {
    const def = NPC_SUPPORTS.find((n) => n.id === key);
    if (!def) return { ok: false, reason: 'みつかりません' };
    if (def.unlock && !s.char.flags[def.unlock]) return { ok: false, reason: 'まだ なかまに できません' };
    snap = makeNpcSupportChar(def, npcLevel(s.char));
  }
  p.supports.push({ key, char: snap, tactics: snap.tactics || 'balanced' });
  return { ok: true, name: snap.name };
}

export function dismissSupport(world, s, key) {
  const p = partyOf(world, s);
  if (p.leader !== s.id) return { ok: false, reason: 'リーダーだけが できます' };
  const i = p.supports.findIndex((x) => x.key === key);
  if (i < 0) return { ok: false };
  const [sup] = p.supports.splice(i, 1);
  return { ok: true, name: sup.char.name };
}

export function guestChar(world, id, heroLevel) {
  const def = GUESTS[id];
  if (!def) return null;
  return makeNpcSupportChar({ ...def, id: def.id }, Math.max(def.minLevel || 1, heroLevel));
}

// サポートで たたかった 家族キャラへの おれい
export function creditSupportOwner(world, ownerId, exp, gold, helperName) {
  const c = world.data.characters[ownerId];
  if (!c) return;
  const e = Math.floor(exp / 2);
  const g = Math.floor(gold / 4);
  const ups = gainExp(c, e);
  gainJobExp(c, Math.floor(e * 0.6));
  c.gold = Math.min(9999999, c.gold + g);
  c.supportLog = c.supportLog || [];
  const last = c.supportLog[c.supportLog.length - 1];
  if (last && last.helper === helperName) {
    last.exp += e;
    last.gold += g;
    last.count++;
    if (ups.length) last.level = c.level;
  } else {
    c.supportLog.push({ helper: helperName, exp: e, gold: g, count: 1, level: ups.length ? c.level : null });
    if (c.supportLog.length > 10) c.supportLog.shift();
  }
}

export function partyState(world, p) {
  if (!p) return null;
  const gateFlags = new Set();
  for (const sid of p.members) {
    const c = world.sessions.get(sid)?.char;
    for (const f of GATE_FLAGS) if (c?.flags?.[f]) gateFlags.add(f);
  }
  return {
    id: p.id,
    leader: p.leader,
    bond: p.bond,
    gateFlags: [...gateFlags],
    members: p.members.map((sid) => {
      const m = world.sessions.get(sid);
      if (!m) return null;
      const st = computeStats(m.char);
      return { sid, charId: m.charId, name: m.char.name, job: m.char.job, level: m.char.level, hp: m.char.hp, maxHp: st.maxHp, mp: m.char.mp, maxMp: st.maxMp, look: m.char.look, map: m.map, follow: !!m.follow, away: !!m.away };
    }).filter(Boolean),
    supports: p.supports.map((x) => {
      const st = computeStats(x.char);
      return { key: x.key, name: x.char.name, job: x.char.job, level: x.char.level, hp: x.char.hp, maxHp: st.maxHp, mp: x.char.mp, maxMp: st.maxMp, look: x.char.look, tactics: x.tactics, family: x.key.startsWith('fam:') };
    }),
    guests: p.guests.map((g) => ({ id: g.id, name: g.char.name, job: g.char.job, level: g.char.level, look: g.char.look, hp: g.char.hp, maxHp: computeStats(g.char).maxHp })),
  };
}
