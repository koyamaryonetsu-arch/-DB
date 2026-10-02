// 入れかえの くみあわせ ぜんぶ: 酒場の 仲間・モンスター・家族 × パーティー・馬車・酒場 × メニュー・たたかい・酒場
//   （まえは 家族の キャラが 馬車に 乗れず、いくつかの 入れかえが できなかった）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { runScript } from '../public/js/shared/world/scripts.js';
import { addMonsterCompanion } from '../public/js/shared/world/party.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const last = (bot, t) => bot.msgs.filter((m) => m.t === t).pop();

async function setup(seed) {
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const mama = new Bot(world, 'ママ');
  await mama.login();
  await mama.createAndPlay('priest');
  await mama.settle();
  const mamaId = mama.char.id;
  mama.send({ t: 'quit' });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  const c = world.data.characters[ken.char.id];
  gainExp(c, expForLevel(12) - c.exp);
  c.hp = computeStats(c).maxHp;
  c.flags.c1_clear = true;
  c.flags.monster_bond = true;
  runScript(world, ken.s, 'tavern');
  await ken.settle();
  Object.assign(ken.s, { map: 'overworld', x: FIELD.x, y: FIELD.y });
  // 酒場の 仲間（入れかわり 用）と、ためす 3人（酒場の 仲間・モンスター・家族）
  for (const k of ['npc_mina', 'npc_poporo', 'npc_rin', 'npc_tina']) ken.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k, join: false });
  ken.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false });
  addMonsterCompanion(world, ken.s, 'pururin', 1, '__tavern');
  const mon = c.companions.find((e) => e.kind === 'monster').key;
  return { world, ken, c, kinds: { support: 'npc_gard', monster: mon, family: 'fam:' + mamaId } };
}

test('入れかえの くみあわせ: 3しゅるいの 仲間 × パーティー・馬車・酒場 × メニュー・酒場・たたかい', { timeout: 120000 }, async () => {
  const fails = [];
  let seed = 80;
  for (const [kind, key0] of Object.entries({ support: 0, monster: 0, family: 0 })) {
    void key0;
    const { world, ken, c, kinds } = await setup(seed++);
    const K = kinds[kind];
    const tav = (msg) => { ken.send({ t: 'svc', kind: 'tavern', ...msg }); return last(ken, 'svcRes'); };
    const menu = (msg) => { ken.send({ t: 'menu', ...msg }); return last(ken, 'menuRes'); };
    const where = (k) => (c.partyKeys.includes(k) ? 'party' : (c.wagonKeys || []).includes(k) ? 'wagon' : 'tavern');
    const step = (label, fn, want) => {
      let r;
      try { r = fn(); } catch (e) { r = { ok: false, text: e.message }; }
      const got = where(K);
      if (got !== want) fails.push(`${kind} × ${label}: ${got}（${r?.text || r?.reason || ''}）`);
    };
    const fill = (keys) => { for (const k of keys) tav({ action: 'join', key: k }); };
    // 酒場 → パーティー → 馬車 → パーティー（メニュー）
    step('酒場→パーティー（酒場）', () => tav({ action: 'join', key: K }), 'party');
    step('パーティー→馬車（メニュー）', () => menu({ action: 'wagon', op: 'in', key: K }), 'wagon');
    step('馬車→パーティー（メニュー）', () => menu({ action: 'wagon', op: 'out', key: K }), 'party');
    // パーティー→馬車→パーティー（酒場）
    step('パーティー→馬車（酒場）', () => tav({ action: 'toWagon', key: K }), 'wagon');
    step('馬車→パーティー（酒場）', () => tav({ action: 'fromWagon', key: K }), 'party');
    // パーティーが いっぱいの ときの 入れかえ（パーティーの K ⇄ 馬車の 仲間）
    fill(['npc_mina', 'npc_poporo']);
    tav({ action: 'toWagon', key: 'npc_rin' });
    step('パーティー⇄馬車 入れかえ（メニュー・K が 馬車へ）', () => menu({ action: 'wagon', op: 'out', key: 'npc_rin', with: K }), 'wagon');
    step('馬車⇄パーティー 入れかえ（メニュー・K が パーティーへ）', () => menu({ action: 'wagon', op: 'out', key: K, with: 'npc_rin' }), 'party');
    step('パーティー⇄馬車 入れかえ（酒場・K が 馬車へ）', () => tav({ action: 'fromWagon', key: 'npc_rin', swap: K }), 'wagon');
    step('馬車⇄パーティー 入れかえ（酒場・K が パーティーへ）', () => tav({ action: 'fromWagon', key: K, swap: 'npc_rin' }), 'party');
    // 馬車 → 酒場 → 馬車、パーティー → 酒場
    tav({ action: 'toWagon', key: K, swap: null });
    step('馬車→酒場（酒場）', () => tav({ action: 'wagonWait', key: K }), 'tavern');
    step('酒場→馬車（酒場）', () => tav({ action: 'toWagon', key: K }), 'wagon');
    step('総入れかえ（メニュー・K を 1番目）', () => menu({ action: 'wagon', op: 'arrange', party: [K, 'self', 'npc_mina', 'npc_poporo'], wagon: c.wagonKeys.filter((k) => k !== K).concat(c.partyKeys.filter((k) => ![K, 'npc_mina', 'npc_poporo'].includes(k))) }), 'party');
    step('パーティー→酒場（酒場）', () => tav({ action: 'wait', key: K }), 'tavern');
    // パーティーが いっぱい → 酒場から つれていくと 馬車へ
    tav({ action: 'join', key: 'npc_tina' });
    step('酒場→（パーティーが いっぱいなので）馬車（酒場）', () => tav({ action: 'join', key: K }), 'wagon');
    // たたかい: 馬車の K ⇄ パーティーの 仲間、パーティーの K → 馬車
    const ctx = startFieldBattle(world, ken.s, { id: 'mx' + seed, sp: 'golem', group: ['golem'], zone: 'outskirts', table: 'outskirts', busy: false });
    for (const e of ctx.battle.enemies) e.atk = 1;
    ken.queue = [];
    const me = last(ken, 'battleStart').mine[0];
    const ready = async () => { const a = ctx.battle.get(me); for (let i = 0; i < 800 && !a.ready; i++) await tickN(world, 1); };
    const actorOf = (k) => ctx.battle.allies.find((a) => ctx.actorMap[a.id]?.key === k);
    await ready();
    const out1 = actorOf(c.partyKeys[0]);
    step('馬車→たたかい（いれかえ）', () => ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: out1.id, key: K } }), 'party');
    if (!actorOf(K)) fails.push(`${kind} × 馬車→たたかい: 戦いに 出てこない`);
    await ready();
    const back = c.wagonKeys[0];
    step('たたかい→馬車（いれかえ）', () => ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: actorOf(K)?.id, key: back } }), 'wagon');
    await ready();
    const seats = ctx.battle.allies.filter((a) => ctx.actorMap[a.id]?.type === 'support').map((a) => ctx.actorMap[a.id].key);
    step('馬車→たたかい（総入れかえ）', () => ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', all: [K, ...seats.slice(1)] } }), 'party');
    for (const a of ctx.battle.allies) if (a.controller === ken.s.id) ken.send({ t: 'battle', actor: a.id, auto: true });
    for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
    ctx.battle.checkEnd();
    for (let i = 0; i < 200 && !ctx.battle.over; i++) await tickN(world, 1);
    await tickN(world, 2);
    ken.flushQueue();
    step('たたかいの あとも そのまま', () => ({ ok: true }), 'party');
    // かさならない（パーティーと 馬車に 2回 いない）
    if (c.partyKeys.includes(K) && c.wagonKeys.includes(K)) fails.push(`${kind}: パーティーと 馬車の 両方に いる`);
  }
  assert.deepEqual(fails, [], `できなかった 入れかえ:\n${fails.join('\n')}`);
});
