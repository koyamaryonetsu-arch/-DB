// たたかいの はじまりと おわり（ほうしゅう・ぜんめつ）
import { Battle } from '../battle.js';
import { MONSTERS } from '../data/monsters.js';
import { ITEMS } from '../data/items.js';
import { ABILITIES } from '../data/abilities.js';
import { JOBS } from '../data/jobs.js';
import { FIXED_ENCOUNTERS, ZONE_BG } from '../data/encounters.js';
import { gainExp, gainJobExp, itemCount, removeItem, addItem, computeStats, STAT_NAMES, fullHeal } from '../stats.js';
import { partyOf, creditSupportOwner, growCompanion, rollBefriend, befriendLevel } from './party.js';
import { MAPS } from '../maps/index.js';

let battleSeq = 1;

// いっしょに たたかいを はじめる きょり（がめんに うつるくらい）
export const JOIN_RADIUS = 10;
// とちゅうから さんか できる きょり（たたかっている なかまに ちかづく）
export const LATE_JOIN_RADIUS = 2.4;

// いっしょに たたかう 人（おなじ マップの ちかくに いて、ほかの ことを していない パーティーの 人）
export function battleSessions(world, s) {
  const p = partyOf(world, s);
  const out = [s];
  for (const sid of p?.members || []) {
    if (sid === s.id) continue;
    const m = world.sessions.get(sid);
    if (!m || !m.inWorld || m.busy || m.away || m.map !== s.map) continue;
    if (Math.hypot(m.x - s.x, m.y - s.y) > JOIN_RADIUS) continue;
    out.push(m);
  }
  return out;
}

// たたかっている なかまの ところへ かけつけて さんかする（ふつうの たたかい だけ）
export function joinBattle(world, s, targetSid) {
  if (s.busy || s.away || !s.inWorld) return { ok: false };
  const t = world.sessions.get(targetSid);
  if (!t || t === s || t.busy !== 'battle' || t.partyId !== s.partyId || t.map !== s.map) return { ok: false };
  const ctx = world.battles.get(t.battleId);
  if (!ctx || ctx.opts.fixed || ctx.battle.over || ctx.battle.pendingEnd) return { ok: false };
  if (Math.hypot(t.x - s.x, t.y - s.y) > LATE_JOIN_RADIUS) return { ok: false };
  if (ctx.sids.includes(s.id)) return { ok: false };
  if (ctx.battle.allies.length >= 4) return { ok: false, reason: 'たたかいの ばしょが いっぱいだ…' };
  const a = ctx.battle.joinAlly({ char: s.char, kind: 'player', controller: s.id, auto: !!s.char.battleSettings?.auto });
  ctx.actorMap[a.id] = { type: 'human', sid: s.id, char: s.char };
  ctx.sids.push(s.id);
  s.busy = 'battle';
  s.battleId = ctx.id;
  s.moving = false;
  // じぶんの なかまで「めいれいさせろ」の なかまは、かけつけた じぶんが うごかす
  for (const ally of ctx.battle.allies) {
    const who = ctx.actorMap[ally.id];
    if (who?.type === 'support' && who.owner === s.charId && who.manual && !ally.controller) {
      ally.controller = s.id;
      ctx.battle.setAuto(ally.id, !!s.char.battleSettings?.auto);
    }
  }
  world.send(s, { t: 'battleStart', snap: ctx.battle.snapshot(), mine: mineOf(ctx, s.id), boss: !!ctx.opts.boss, story: false, joined: true });
  world.broadcastPositions = true;
  return { ok: true };
}

// その 人が うごかす キャラ（じぶん＋「めいれいさせろ」の なかま）。じぶんが さいしょ
export function mineOf(ctx, sid) {
  const out = ctx.battle.allies.filter((a) => a.controller === sid);
  out.sort((x, y) => (x.kind === 'player' ? 0 : 1) - (y.kind === 'player' ? 0 : 1));
  return out.map((a) => a.id);
}

function makeBattle(world, sessions, party, enemies, opts) {
  const leader = world.sessions.get(party.leader) || sessions[0];
  const settings = leader.char.battleSettings || {};
  const allies = [];
  const actorMap = {};
  for (const m of sessions) {
    allies.push({ char: m.char, kind: 'player', controller: m.id, auto: !!m.char.battleSettings?.auto });
  }
  // なかま: さくせんが「めいれいさせろ」なら もちぬしが コマンドを えらぶ（もちぬしが いない ときは AI）
  const supInfo = [];
  for (const sup of party.supports) {
    const tac = sup.char.tactics || 'balanced';
    const owner = tac === 'manual' ? sessions.find((m) => m.charId === sup.owner) : null;
    supInfo.push({ manual: tac === 'manual' });
    allies.push({
      char: sup.char, kind: sup.kind === 'monster' ? 'monster' : 'support',
      controller: owner ? owner.id : null, auto: owner ? !!owner.char.battleSettings?.auto : true,
      tactics: tac === 'manual' ? 'balanced' : tac,
    });
  }
  for (const g of party.guests) allies.push({ char: g.char, kind: 'guest', auto: true, tactics: g.char.tactics });
  const b = new Battle({
    id: 'b' + (battleSeq++),
    rng: world.rng,
    allies,
    enemies,
    speed: settings.speed || 1,
    wait: !!settings.wait,
    canFlee: opts.canFlee !== false,
    boss: !!opts.boss,
    bg: opts.bg,
    bgm: opts.bgm,
    bond: party.bond || 0,
    preemptive: opts.preemptive || null,
    hooks: {
      hasItem: (actor, id) => {
        const m = actor.controller && world.sessions.get(actor.controller);
        return m ? itemCount(m.char, id) > 0 : false;
      },
      consumeItem: (actor, id) => {
        const m = actor.controller && world.sessions.get(actor.controller);
        if (!m) return false;
        const ok = removeItem(m.char, id, 1);
        if (ok) world.sendSelf(m);
        return ok;
      },
    },
  });
  // だれが どの キャラか
  let i = 0;
  for (const m of sessions) actorMap[b.allies[i++].id] = { type: 'human', sid: m.id, char: m.char };
  party.supports.forEach((sup, k) => {
    actorMap[b.allies[i++].id] = { type: 'support', key: sup.key, owner: sup.owner, kind: sup.kind, char: sup.char, manual: supInfo[k].manual };
  });
  for (const g of party.guests) actorMap[b.allies[i++].id] = { type: 'guest', id: g.id, char: g.char };
  const ctx = { id: b.id, battle: b, sids: sessions.map((m) => m.id), partyId: party.id, map: sessions[0].map, actorMap, opts };
  world.battles.set(ctx.id, ctx);
  for (const m of sessions) {
    m.busy = 'battle';
    m.battleId = ctx.id;
    world.send(m, { t: 'battleStart', snap: b.snapshot(), mine: mineOf(ctx, m.id), boss: !!opts.boss, story: !!opts.fixed, preemptive: opts.preemptive || null });
  }
  world.broadcastPositions = true;
  return ctx;
}

export function startFieldBattle(world, s, sym) {
  const party = partyOf(world, s);
  const sessions = battleSessions(world, s);
  sym.busy = true;
  const zone = sym.zone;
  // うしろから ふれたら せんせいこうげき、おいかけられて ぶつかったら ふいうち
  let preemptive = null;
  const r = world.rng.next();
  if (sym.state !== 'chase' && r < 0.12) preemptive = 'ally';
  else if (sym.state === 'chase' && r < 0.06) preemptive = 'enemy';
  const ctx = makeBattle(world, sessions, party, sym.group, {
    bg: ZONE_BG[sym.table] || (MAPS[s.map].kind === 'dungeon' ? 'cave' : 'grass'),
    bgm: sym.table === 'rare' ? 'battle' : 'battle',
    canFlee: true,
    preemptive,
    symbolId: sym.id,
    mapId: s.map,
  });
  return ctx;
}

// ストーリーの たたかい（まけると だいほんが とまる）
export function startFixedBattle(world, initiator, participants, encId) {
  const enc = FIXED_ENCOUNTERS[encId];
  const party = partyOf(world, initiator);
  const sessions = participants.filter((m) => m && m.inWorld);
  const enemies = [];
  for (const [sp, mn] of enc.group) for (let i = 0; i < mn; i++) enemies.push(sp);
  return new Promise((resolve) => {
    for (const m of sessions) m.busy = null; // だいほんの あいだは busy='script' だが たたかいに きりかえる
    const ctx = makeBattle(world, sessions, party, enemies, { bg: enc.bg, bgm: enc.bgm, canFlee: enc.canFlee, boss: enc.boss, fixed: encId });
    ctx.resolve = resolve;
  });
}

export function battleTick(world, ctx, dt) {
  const evs = ctx.battle.tick(dt);
  if (evs.length) {
    for (const sid of ctx.sids) {
      const m = world.sessions.get(sid);
      if (m) world.send(m, { t: 'battleEv', id: ctx.id, evs });
    }
  }
  if (ctx.battle.over) finishBattle(world, ctx);
}

export function battleCommand(world, s, msg) {
  const ctx = world.battles.get(s.battleId);
  if (!ctx) return;
  const b = ctx.battle;
  if (msg.auto !== undefined) {
    const a = b.get(msg.actor);
    if (a && a.controller === s.id) {
      b.setAuto(msg.actor, !!msg.auto);
      if (a.kind === 'player') s.char.battleSettings = { ...(s.char.battleSettings || {}), auto: !!msg.auto };
    }
    return;
  }
  const r = b.command(msg.actor, msg.cmd, s.id);
  if (!r.ok) world.send(s, { t: 'battleRej', reason: r.reason || 'できません' });
}

// サーバーから プレイヤーが ぬけたとき
export function battleLeave(world, s) {
  const ctx = world.battles.get(s.battleId);
  if (!ctx) return;
  for (const a of ctx.battle.allies) if (a.controller === s.id) ctx.battle.setAuto(a.id, true);
}

function finishBattle(world, ctx) {
  world.battles.delete(ctx.id);
  const b = ctx.battle;
  const res = b.result;
  const party = world.parties.get(ctx.partyId);
  const sessions = ctx.sids.map((sid) => world.sessions.get(sid)).filter(Boolean);
  // HP・MPを もどす
  for (const a of b.allies) {
    const who = ctx.actorMap[a.id];
    const ch = who?.char;
    if (!ch) continue;
    ch.hp = a.alive ? a.hp : 0;
    ch.mp = a.mp;
    ch.status = a.status.poison && a.alive ? { poison: true } : {};
  }
  if (party) party.bond = b.bond;

  const outcome = res.outcome;
  const perSession = {};
  let befriend = null;
  if (outcome === 'win') {
    let exp = 0, gold = 0, jexp = 0;
    for (const sp of res.killed) {
      const m = MONSTERS[sp];
      exp += m.exp;
      gold += m.gold;
      jexp += m.jexp ?? Math.ceil(m.exp * 0.6);
    }
    const leaderName = sessions[0]?.char.name || '';
    for (const m of sessions) {
      const c = m.char;
      const lines = [];
      lines.push(res.killed.length ? 'まものたちを やっつけた！' : 'たたかいに かった！');
      if (exp > 0) lines.push(`${c.name}は ${exp}ポイントの けいけんちを かくとく！`);
      if (gold > 0) lines.push(`${gold}ゴールドを てにいれた！`);
      c.gold = Math.min(9999999, c.gold + gold);
      for (const sp of res.killed) c.kills[sp] = (c.kills[sp] || 0) + 1;
      // ドロップ
      const drops = [];
      for (const sp of res.killed) {
        for (const d of MONSTERS[sp].drops || []) {
          if (world.rng.chance(d.rate)) {
            addItem(c, d.item, 1);
            drops.push(d.item);
            lines.push(`${MONSTERS[sp].name}は ${ITEMS[d.item].name}を もっていた！`, `${c.name}は ${ITEMS[d.item].name}を てにいれた！`);
            break;
          }
        }
      }
      const ups = gainExp(c, exp);
      for (const u of ups) {
        lines.push(`${c.name}の レベルが ${u.level}に あがった！`);
        const g = Object.entries(u.gains).map(([k, v]) => `${statShort(k)}+${v}`).join('　');
        if (g) lines.push(g);
        for (const id of u.learned) lines.push(learnLine(c, id));
      }
      const jups = gainJobExp(c, jexp);
      for (const u of jups) {
        lines.push(`${JOBS[u.job].name}の しょくぎょうレベルが ${u.lv}に あがった！`);
        for (const id of u.learned) lines.push(learnLine(c, id));
      }
      perSession[m.id] = { lines, levelUp: ups.length > 0, jobUp: jups.length > 0, drops };
    }
    // なかま: たたかいに でた なかまだけ そだつ。家族の キャラには おれいが とどく
    const compLines = [];
    for (const a of b.allies) {
      const who = ctx.actorMap[a.id];
      if (who?.type !== 'support' || !who.char) continue;
      if (who.kind === 'family') {
        if (who.char.ownerId) creditSupportOwner(world, who.char.ownerId, exp, gold, leaderName);
        continue;
      }
      for (const l of growCompanion(who.char, exp, jexp)) {
        compLines.push(typeof l === 'string' ? l : learnLine({ name: l.who }, l.learn));
      }
    }
    if (compLines.length) for (const m of sessions) perSession[m.id].lines.push(...compLines);
    // まものが なかまに なりたがる（ふつうの たたかい だけ）
    if (!ctx.resolve && !b.boss && res.killed.length) {
      const target = sessions.find((m) => m.id === party?.leader) || sessions[0];
      const sp = target && rollBefriend(world, target.char, res.killed);
      if (sp) befriend = { s: target, species: sp, level: befriendLevel(target.char, sp) };
    }
  } else if (outcome === 'lose') {
    for (const m of sessions) {
      perSession[m.id] = { lines: [`${m.char.name}たちは ぜんめつ してしまった…`] };
    }
  } else if (outcome === 'flee') {
    for (const m of sessions) perSession[m.id] = { lines: [] };
  }

  // シンボル
  if (ctx.opts.symbolId) {
    const ms = world.mapStates.get(ctx.opts.mapId);
    const sym = ms?.symbols.get(ctx.opts.symbolId);
    if (sym) {
      if (outcome === 'win') ms.symbols.delete(sym.id);
      else {
        sym.busy = false;
        sym.stun = 3000;
      }
    }
  }
  for (const m of sessions) {
    m.busy = ctx.resolve ? 'script' : null;
    m.battleId = null;
    m.invuln = 3000;
    const r = perSession[m.id] || { lines: [] };
    world.send(m, { t: 'battleEnd', id: ctx.id, outcome, lines: r.lines, levelUp: !!r.levelUp, story: !!ctx.resolve });
  }
  if (outcome === 'lose') {
    for (const m of sessions) world.respawn(m);
    for (const a of b.allies) {
      const who = ctx.actorMap[a.id];
      if (who && who.type !== 'human' && who.char) fullHeal(who.char);
    }
  }
  for (const m of sessions) world.sendSelf(m);
  if (party) world.sendParty(party);
  world.markDirty();
  if (ctx.resolve) ctx.resolve(outcome);
  if (befriend && world.sessions.has(befriend.s.id) && !befriend.s.away) world.offerBefriend(befriend.s, befriend.species, befriend.level);
}

function statShort(k) {
  return { maxHp: 'HP', maxMp: 'MP', str: 'ちから', def: 'まもり', agi: 'すばやさ', mag: 'まりょく', heal: 'かいふく' }[k] || STAT_NAMES[k] || k;
}

function learnLine(c, id) {
  const a = ABILITIES[id];
  if (!a) return '';
  if (a.kind === 'combo') return `${c.name}は 掛け合わせ技「${a.name}」を ひらめいた！`;
  return `${c.name}は ${a.name}を おぼえた！`;
}
