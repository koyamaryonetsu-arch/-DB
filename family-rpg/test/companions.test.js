import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel, computeStats, learnedAbilities, newMonsterCompanion, mpCost } from '../public/js/shared/stats.js';
import { MONSTER_FRIENDS } from '../public/js/shared/data/companions.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { Bot, tickN } from './helpers.js';

const V = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];

// セーブデータを もったまま つなぎなおす（アプリを おとして また ひらく）
function reopen(world, oldBot) {
  oldBot.send({ t: 'quit' });
  const bot = new Bot(world, oldBot.name);
  bot.send({ t: 'hello' });
  bot.send({ t: 'play', id: oldBot.char.id });
  return bot;
}

function level(bot, lv) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(lv) - c.exp);
  c.hp = computeStats(c).maxHp;
  bot.world.sendSelf(bot.s);
}

function fieldBattle(world, bot, group) {
  const sym = { id: 'test' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false };
  return startFieldBattle(world, bot.s, sym);
}

test('ルカは アプリを おとして ひらきなおしても パーティーに いる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(3), rateLimit: false });
  let bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  await bot.walkTo(...V(24, 18));
  await bot.talk('elder');
  assert.equal(bot.party.guests.length, 1);
  assert.deepEqual(world.data.characters[bot.char.id].guests, ['luca'], 'ゲストが セーブデータに のこる');
  // セーブデータを いったん JSON に して よみなおす（ほんとうの きどうと おなじ）
  const saved = JSON.parse(JSON.stringify(world.data));
  const world2 = new GameWorld({ offline: true, rng: makeRng(4), rateLimit: false, data: saved });
  bot = new Bot(world2, 'ソラ');
  bot.send({ t: 'hello' });
  bot.send({ t: 'play', id: Object.keys(saved.characters)[0] });
  await bot.settle();
  assert.equal(bot.party.guests.length, 1, 'ひらきなおしても ルカが いる');
  assert.equal(bot.party.guests[0].name, 'ルカ');
});

test('まえの バージョンの セーブ（ゲストの きろく なし）でも ルカが もどる', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ミナ');
  await bot.login();
  await bot.createAndPlay('priest');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.p_start = true;
  delete c.guests;
  const b2 = reopen(world, bot);
  await b2.settle();
  assert.equal(b2.party.guests.length, 1, 'フラグから ルカを もどす');
  // まつりの あとなら もどらない
  const c2 = world.data.characters[bot.char.id];
  c2.flags.p_attack = true;
  delete c2.guests;
  const b3 = reopen(world, b2);
  await b3.settle();
  assert.equal(b3.party.guests.length, 0);
});

test('酒場: なかまを さがして つれていく・いれかえ・ひらきなおしても いる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(6), rateLimit: false });
  let bot = new Bot(world, 'ケン');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  level(bot, 6);
  const svc = (msg) => {
    bot.send({ t: 'svc', kind: 'tavern', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let r = svc({ action: 'recruit', key: 'npc_gard' });
  assert.ok(r.ok, r.text);
  assert.equal(bot.party.supports.length, 1);
  assert.equal(bot.party.supports[0].level, 5, 'レベルは じぶんより すこし ひくい');
  svc({ action: 'recruit', key: 'npc_mina' });
  svc({ action: 'recruit', key: 'npc_poporo' });
  assert.equal(bot.party.supports.length, 3);
  // 4人め: パーティーは いっぱいなので 酒場で まつ
  r = svc({ action: 'recruit', key: 'npc_rin' });
  assert.ok(r.ok);
  assert.equal(bot.party.supports.length, 3);
  assert.ok(r.tavern.roster.find((e) => e.key === 'npc_rin' && !e.inParty));
  // いれかえ: いっぱいなら だれかを 酒場へ
  r = svc({ action: 'join', key: 'npc_rin' });
  assert.ok(!r.ok && r.full);
  r = svc({ action: 'join', key: 'npc_rin', swap: 'npc_poporo' });
  assert.ok(r.ok, r.text);
  assert.deepEqual(bot.party.supports.map((x) => x.key), ['npc_gard', 'npc_mina', 'npc_rin']);
  // なかまは わかれられない（酒場で まつ）
  r = svc({ action: 'release', key: 'npc_gard' });
  assert.ok(!r.ok);
  // なまえを かえる
  r = svc({ action: 'rename', key: 'npc_gard', name: 'ガルドン' });
  assert.ok(r.ok);
  // ひらきなおす
  bot = reopen(world, bot);
  await bot.settle();
  assert.deepEqual(bot.party.supports.map((x) => x.name), ['ガルドン', 'ミーナ', 'リン'], 'なかまが のこっている');
  // フィールドの メニューから 酒場へ もどってもらう
  bot.send({ t: 'party', action: 'dismiss', key: 'npc_mina' });
  assert.equal(bot.party.supports.length, 2);
});

test('なかまは たたかいで それぞれ そだつ（酒場で まつ なかまは そだたない）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'リオ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  level(bot, 8);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina' });
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false });
  const c = world.data.characters[bot.char.id];
  const mina = c.companions.find((e) => e.key === 'npc_mina').char;
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  const minaExp = mina.exp, gardExp = gard.exp;
  fieldBattle(world, bot, ['wolf', 'wolf']);
  await bot.settle(8000);
  assert.equal(bot.battles.length, 1);
  assert.equal(bot.battles[0].outcome, 'win');
  assert.ok(mina.exp > minaExp, 'たたかった なかまは けいけんちを もらう');
  assert.equal(gard.exp, gardExp, '酒場の なかまは そだたない');
});

test('さくせん「めいれいさせろ」: なかまにも じぶんで コマンドを えらべる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(8), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  level(bot, 6);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard' });
  bot.send({ t: 'menu', action: 'tactics', key: 'npc_gard', tactics: 'manual' });
  assert.equal(bot.party.supports[0].tactics, 'manual');
  // ロボットの オートを とめて、じぶんで えらぶ
  const ctx = fieldBattle(world, { s: bot.s }, ['pururin']);
  const start = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.equal(start.mine.length, 2, 'じぶんと ガルドを うごかす');
  bot.queue = [];
  const gardId = start.mine[1];
  assert.equal(ctx.battle.get(gardId).name, 'ガルド');
  assert.equal(ctx.battle.get(gardId).auto, false);
  // ガルドの じゅんばんが くるまで まつ
  for (let i = 0; i < 400 && !ctx.battle.get(gardId).ready && !ctx.battle.over; i++) await tickN(world, 1);
  assert.ok(ctx.battle.get(gardId).ready, 'ガルドの コマンドを まっている');
  const enemy = ctx.battle.enemies[0];
  bot.send({ t: 'battle', actor: gardId, cmd: { type: 'attack', target: enemy.id } });
  assert.ok(!bot.msgs.some((m) => m.t === 'battleRej'), 'コマンドが とおる');
  // あとは オート
  for (const id of start.mine) bot.send({ t: 'battle', actor: id, auto: true });
  await bot.settle(8000);
  assert.ok(bot.battles.length === 1);
  assert.ok(!world.data.characters[bot.char.id].battleSettings.auto || true);
});

test('モンスターの なかま: つよさ・わざ・MP', () => {
  for (const [sp, f] of Object.entries(MONSTER_FRIENDS)) {
    assert.ok(MONSTERS[sp], sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    const m = newMonsterCompanion({ id: 'x', species: sp, level: 10 });
    const st = computeStats(m);
    assert.ok(st.maxHp > 30 && st.maxHp < 200, `${sp} HP ${st.maxHp}`);
    assert.ok(st.atk > 15 && st.atk < 80, `${sp} atk ${st.atk}`);
    assert.ok(learnedAbilities(m).length >= 2, sp);
    for (const id of learnedAbilities(m)) assert.equal(mpCost(m, id), ABILITIES[id].mp || 0);
  }
  const p = newMonsterCompanion({ id: 'x', species: 'pururin', level: 1 });
  assert.deepEqual(learnedAbilities(p), ['m_tackle']);
  gainExp(p, expForLevel(3));
  assert.ok(learnedAbilities(p).includes('hoimi'), 'レベル3で ホイミ');
});

test('紋章の ちから: たおした まものが なかまに なりたがる → 酒場へ いれかえ', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(11), rateLimit: false });
  const bot = new Bot(world, 'ハル');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  level(bot, 10);
  const c = world.data.characters[bot.char.id];
  // めざめる まえは なかまに ならない
  const chance = world.rng.chance;
  world.rng.chance = (p) => (p >= 1 / 40 && p <= 0.5 && p !== 0.25 ? true : chance.call(world.rng, p));
  fieldBattle(world, bot, ['pururin']);
  await bot.settle(6000);
  assert.equal(c.companions.length, 0, 'めざめる まえは なかまに ならない');
  // めざめた あと
  c.flags.monster_bond = true;
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k });
  assert.equal(bot.party.supports.length, 3);
  bot.choice = 0; // はい → いっぱいなので さいしょの なかま（ガルド）が 酒場へ
  fieldBattle(world, bot, ['pururin']);
  await bot.settle(6000);
  world.rng.chance = chance;
  const mon = c.companions.find((e) => e.kind === 'monster');
  assert.ok(mon, 'モンスターが なかまに なった');
  assert.equal(mon.species, 'pururin');
  assert.equal(mon.char.name, 'ぷるる');
  assert.ok(c.partyKeys.includes(mon.key), 'パーティーに はいる');
  assert.ok(!c.partyKeys.includes('npc_gard'), 'ガルドは 酒場へ もどった');
  assert.ok(bot.party.supports.some((x) => x.species === 'pururin'));
  assert.ok(bot.msgs.some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'say' && /仲間になりたそう/.test(st[2]))));
  // モンスターの なかまは わかれられる（そうびは ふくろへ）
  c.items.push({ id: 'power_ring', n: 1 });
  bot.send({ t: 'menu', action: 'equip', id: 'power_ring', who: mon.key });
  assert.equal(mon.char.equip.acc, 'power_ring');
  bot.send({ t: 'menu', action: 'equip', id: 'cloth', who: mon.key });
  assert.ok(!mon.char.equip.armor, 'モンスターは アクセサリー だけ');
  bot.send({ t: 'svc', kind: 'tavern', action: 'release', key: mon.key });
  assert.ok(!c.companions.some((e) => e.kind === 'monster'));
  assert.equal(c.items.find((e) => e.id === 'power_ring')?.n, 1, 'そうびは もどる');
});

test('ボスや ものがたりの たたかいでは なかまに ならない', () => {
  for (const [sp, m] of Object.entries(MONSTERS)) {
    if (m.boss || ['shadow_soldier', 'rock_shard'].includes(sp)) assert.ok(!MONSTER_FRIENDS[sp], sp);
  }
});

test('はいごう: レベル10いじょうの 2ひきから レベル1の こが うまれ、わざと つよさを うけつぐ', { timeout: 60000 }, async () => {
  const { breedPreview } = await import('../public/js/shared/world/breed.js');
  const world = new GameWorld({ offline: true, rng: makeRng(31), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('performer');
  await bot.settle();
  level(bot, 14);
  const c = world.data.characters[bot.char.id];
  c.flags.monster_bond = true;
  const { addMonsterCompanion } = await import('../public/js/shared/world/party.js');
  const a = addMonsterCompanion(world, bot.s, 'pururin', 12);
  const b = addMonsterCompanion(world, bot.s, 'koumorin', 8);
  c.items.push({ id: 'power_ring', n: 1 });
  bot.send({ t: 'menu', action: 'equip', id: 'power_ring', who: a.key });
  // レベルが たりない
  assert.equal(breedPreview(c, a.key, b.key).ok, false);
  const kb = c.companions.find((e) => e.key === b.key).char;
  gainExp(kb, expForLevel(10) - kb.exp);
  const pv = breedPreview(c, a.key, b.key);
  assert.ok(pv.ok, pv.reason);
  assert.equal(pv.child, 'fuwari', 'ぷるりん＋そらを とぶ まもの＝ふわりん');
  assert.ok(pv.skills.includes('m_drain'), 'おやの わざを うけつげる');
  // みるだけの よこく（なにも かわらない）
  const before = JSON.stringify(c.companions);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: a.key, b: b.key });
  const pr = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(pr.ok && pr.preview?.child === 'fuwari' && pr.preview.special, 'よこく: めずらしい くみあわせ');
  assert.ok(pr.preview.auto.length <= pr.preview.max);
  assert.equal(JSON.stringify(c.companions), before, 'よこくでは かわらない');
  bot.send({ t: 'svc', kind: 'tavern', action: 'breedPreview', a: a.key, b: a.key });
  assert.equal(bot.msgs.filter((m) => m.t === 'svcRes').pop().ok, false, 'おなじ まものどうしは だめ');
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, inherit: ['m_drain', 'mera'], name: 'ふわこ' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.find((e) => e.species === 'fuwari');
  assert.ok(kid, 'うまれた');
  assert.equal(kid.char.level, 1);
  assert.equal(kid.char.name, 'ふわこ');
  assert.ok(kid.char.plus >= 2, `＋${kid.char.plus}`);
  assert.ok(learnedAbilities(kid.char).includes('m_drain') && learnedAbilities(kid.char).includes('mera'), 'わざを うけついだ');
  const plain = newMonsterCompanion({ id: 'p', species: 'fuwari', level: 1 });
  assert.ok(computeStats(kid.char).maxHp > computeStats(plain).maxHp, 'おやの つよさを すこし うけつぐ');
  assert.ok(!c.companions.some((e) => e.key === a.key || e.key === b.key), 'おやは いなくなる');
  assert.equal(c.items.find((e) => e.id === 'power_ring')?.n, 1, 'おやの そうびは ふくろへ');
  assert.equal(c.bestiary.fuwari.bred, 1);
  assert.ok(c.partyKeys.includes(kid.key), 'おやが パーティーに いたので こも パーティーへ');
  // パーティーの じょうほうにも ＋と うけついだ わざが のる（メニューの つよさ・じゅもんで つかう）
  const pmsg = bot.msgs.filter((m) => m.t === 'party').pop();
  const sup = pmsg?.party?.supports.find((x) => x.key === kid.key);
  assert.ok(sup && sup.plus === kid.char.plus && sup.inherit.includes('m_drain'), 'パーティーの じょうほう');
});
