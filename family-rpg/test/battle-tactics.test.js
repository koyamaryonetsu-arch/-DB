// たたかいの 中で さくせんを かえる（つよさの まどを タップ。world/tactics.js）と、たたかいで 使える 技（stats.js の battleAbilityOk）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel, computeStats, newCharacter, battleAbilityOk } from '../public/js/shared/stats.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { Battle } from '../public/js/shared/battle.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

function level(world, bot, lv) {
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(lv) - c.exp);
  c.hp = computeStats(c).maxHp;
  world.sendSelf(bot.s);
}

function fieldBattle(world, bot, group = ['golem']) {
  const sym = { id: 'w' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false };
  const ctx = startFieldBattle(world, bot.s, sym);
  // さいごまで たたかいが おわらない ように（さくせんを ためす あいだ）
  for (const e of ctx.battle.enemies) { e.atk = 1; e.hp = e.maxHp = 99999; }
  return ctx;
}

const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const tacEvents = (bot) => bot.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).filter((e) => e.t === 'tactics');

test('たたかいの さくせん: 自分の 仲間は その場で かえられて、すぐ AIに つかわれ、仲間にも のこる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(31), rateLimit: false });
  const bot = new Bot(world, 'アル');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  level(world, bot, 12);
  const c = world.data.characters[bot.char.id];
  for (const k of ['npc_gard', 'npc_mina']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k });
  bot.s.map = 'overworld';
  bot.s.x = FIELD.x;
  bot.s.y = FIELD.y;
  const ctx = fieldBattle(world, bot);
  bot.queue = []; // オートに しない
  const b = ctx.battle;
  const me = b.allies.find((a) => a.kind === 'player');
  const gard = b.allies.find((a) => a.name === 'ガルド');
  const start = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  // 画面には だれが かえられるかと 今の さくせんが とどく
  const pg = start.snap.combatants.find((x) => x.id === gard.id);
  assert.equal(pg.tacBy, c.id, '自分の 仲間は 自分が かえられる');
  assert.equal(pg.tactics, 'balanced');
  assert.equal(start.snap.combatants.find((x) => x.id === me.id).tacBy, c.id);
  assert.equal(start.snap.combatants.find((x) => x.side === 'enemy').tacBy, undefined);

  // ガンガンいこうぜ
  bot.send({ t: 'battle', actor: gard.id, tactics: 'aggressive' });
  assert.equal(lastRes(bot).ok, true);
  assert.equal(gard.tactics, 'aggressive', 'たたかいの 中の 仲間に すぐ');
  assert.equal(c.companions.find((e) => e.key === 'npc_gard').char.tactics, 'aggressive', '仲間に のこる');
  assert.equal(bot.party.supports.find((x) => x.key === 'npc_gard').tactics, 'aggressive', 'パーティーの じょうほうも');
  await tickN(world, 2);
  assert.ok(tacEvents(bot).some((e) => e.id === gard.id && e.tactics === 'aggressive'), '画面にも しらせる');

  // めいれいさせろ: 自分が コマンドを えらぶ
  bot.send({ t: 'battle', actor: gard.id, tactics: 'manual' });
  assert.equal(gard.controller, bot.s.id);
  assert.equal(gard.auto, false);
  assert.equal(gard.tactics, 'balanced', 'オートの ときは バッチリがんばれ');
  assert.equal(c.companions.find((e) => e.key === 'npc_gard').char.tactics, 'manual');
  await tickN(world, 2);
  assert.equal(tacEvents(bot).pop().controller, bot.s.id);
  for (let i = 0; i < 800 && !gard.ready; i++) await tickN(world, 1);
  assert.ok(gard.ready, 'コマンドを まっている');
  // AIに もどすと まっていた 番で すぐ うごく
  bot.send({ t: 'battle', actor: gard.id, tactics: 'heal' });
  assert.equal(gard.controller, null);
  assert.equal(gard.auto, true);
  assert.equal(gard.ready, false);
  assert.equal(gard.tactics, 'heal');
  assert.ok(gard.queued, 'AIの コマンドが はいった');

  // 自分: オートの ときの さくせん（めいれいさせろ は ない）
  bot.send({ t: 'battle', actor: me.id, tactics: 'manual' });
  assert.equal(lastRes(bot).ok, false);
  bot.send({ t: 'battle', actor: me.id, tactics: 'nomp' });
  assert.equal(lastRes(bot).ok, true);
  assert.equal(me.tactics, 'nomp');
  assert.equal(c.tactics, 'nomp');
  // へんな さくせん・敵は だめ
  bot.send({ t: 'battle', actor: gard.id, tactics: 'yolo' });
  assert.equal(lastRes(bot).ok, false);
  assert.equal(gard.tactics, 'heal');
  bot.send({ t: 'battle', actor: b.enemies[0].id, tactics: 'aggressive' });
  assert.equal(lastRes(bot).ok, false);
});

test('たたかいの さくせん: 家族の キャラと 家族の 仲間は かえられない', { timeout: 60000 }, async () => {
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(26), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login();
  await kid.login();
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  level(world, papa, 12);
  level(world, kid, 12);
  const pc = world.data.characters[papa.char.id];
  const kc = world.data.characters[kid.char.id];
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard' });
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  for (const x of [papa, kid]) { x.s.map = 'overworld'; x.s.x = FIELD.x; x.s.y = FIELD.y; }
  const ctx = fieldBattle(world, papa);
  papa.queue = [];
  kid.queue = [];
  const b = ctx.battle;
  const papaA = b.allies.find((a) => a.charId === pc.id);
  const kidA = b.allies.find((a) => a.charId === kc.id);
  const gard = b.allies.find((a) => a.name === 'ガルド');
  assert.ok(papaA && kidA && gard);
  const snap = kid.msgs.filter((m) => m.t === 'battleStart').pop().snap;
  assert.equal(snap.combatants.find((x) => x.id === gard.id).tacBy, pc.id, 'ガルドは パパの 仲間');
  // ユイは パパと パパの 仲間を かえられない
  kid.send({ t: 'battle', actor: gard.id, tactics: 'aggressive' });
  assert.equal(lastRes(kid).ok, false);
  kid.send({ t: 'battle', actor: gard.id, tactics: 'manual' });
  assert.equal(lastRes(kid).ok, false);
  kid.send({ t: 'battle', actor: papaA.id, tactics: 'aggressive' });
  assert.equal(lastRes(kid).ok, false);
  assert.equal(gard.tactics, 'balanced');
  assert.equal(gard.controller, null);
  assert.equal(papaA.tactics, 'balanced');
  assert.equal(pc.companions.find((e) => e.key === 'npc_gard').char.tactics, 'balanced');
  // 自分の ぶんは かえられる
  kid.send({ t: 'battle', actor: kidA.id, tactics: 'heal' });
  assert.equal(lastRes(kid).ok, true);
  assert.equal(kidA.tactics, 'heal');
  assert.equal(kc.tactics, 'heal');
  // パパは 自分の 仲間を めいれいさせろ に（パパが うごかす）
  papa.send({ t: 'battle', actor: gard.id, tactics: 'manual' });
  assert.equal(lastRes(papa).ok, true);
  assert.equal(gard.controller, papa.s.id);
  await tickN(world, 2);
  const ev = tacEvents(kid).pop();
  assert.equal(ev.id, gard.id, 'ユイの 画面にも とどく（だれが うごかすか）');
  assert.equal(ev.controller, papa.s.id);
});

test('たたかいで 使える 技: 転職して ぶきや 職業が あわない 技・フィールドだけの 呪文は 使えない（サーバーも おなじ）', () => {
  const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
  // 剣が いる 技
  assert.equal(battleAbilityOk(c, 'mahouken', 'sword'), false, '戦士では 掛け合わせ技は 使えない');
  assert.equal(battleAbilityOk({ job: 'magic_knight' }, 'mahouken', 'sword'), true, '魔法戦士なら 使える');
  const blade = Object.keys(ABILITIES).find((id) => ABILITIES[id].weapon === 'blade' && ABILITIES[id].kind === 'skill');
  assert.ok(blade);
  assert.equal(battleAbilityOk(c, blade, 'sword'), true);
  assert.equal(battleAbilityOk(c, blade, 'staff'), false, '剣を もっていないと 出さない');
  assert.equal(battleAbilityOk(c, 'rura', 'sword'), false, 'ルーラは フィールドだけ');
  assert.equal(battleAbilityOk(c, 'minadein', 'sword'), false, 'きずな技は コマンドの ミナデインから');
  assert.equal(battleAbilityOk(c, 'mera', 'staff'), true, '呪文は ぶきに かんけいない');
  // サーバーも おなじ: 剣の 技は 剣が ないと ことわる
  const ch = newCharacter({ id: 'y', name: 'y', job: 'warrior' });
  gainExp(ch, expForLevel(20));
  ch.jobs.warrior = { lv: 10, b: 999 };
  ch.equip.weapon = 'oak_staff';
  const bt = new Battle({ rng: makeRng(1), allies: [{ char: ch, controller: 's1' }], enemies: ['pururin'], canFlee: false });
  const a = bt.allies[0];
  a.abilities = [...a.abilities, blade];
  for (let i = 0; i < 600 && !a.ready; i++) bt.tick(50);
  assert.equal(bt.command(a.id, { type: 'ability', id: blade, target: bt.enemies[0].id }, 's1').ok, false);
  a.abilities.push('rura');
  assert.equal(bt.command(a.id, { type: 'ability', id: 'rura' }, 's1').ok, false);
});
