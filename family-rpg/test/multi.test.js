// マルチプレイの ルール: ちかくの なかまだけ たたかう・とちゅうさんか・つなぎなおし・ついていく
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { CAVE_ENTRANCE, PLACES } from '../public/js/shared/maps/overworld.js';
import { Bot, tickN } from './helpers.js';

async function family(opts = {}) {
  const world = new GameWorld({ offline: false, rng: makeRng(11), checkPassword: (pw) => pw === 'ほし', rateLimit: false, ...opts });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await kid.login('ほし');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  return { world, papa, kid };
}

// まものの シンボルを つくって ふれさせる（テスト用）
function fightAt(world, bot, x, y) {
  const ms = world.mapStates.get('overworld') || (world.tick(1), world.mapStates.get('overworld'));
  const sym = { id: 'sym' + Math.random(), sp: 'pururin', group: ['pururin', 'pururin', 'pururin'], table: 'outskirts', zone: 'outskirts', x, y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.s.x = x;
  bot.s.y = y;
  bot.send({ t: 'touch', id: sym.id });
  return sym;
}

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

test('はなれている なかまは たたかいに ひきこまれず、かけつけると とちゅうから さんか できる', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  kid.s.x = FIELD.x + 20;
  kid.s.y = FIELD.y;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle, 'パパは たたかう');
  assert.ok(!kid.inBattle, 'とおくの ユイは ひきこまれない');
  const start = papa.msgs.find((m) => m.t === 'battleStart');
  assert.equal(start.snap.combatants.filter((c) => c.side === 'ally').length, 1);

  // とおすぎると さんか できない
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle);
  // かけつける
  kid.s.x = FIELD.x + 1.2;
  kid.s.y = FIELD.y;
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(kid.inBattle, 'ちかづくと さんか できる');
  const js = kid.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.ok(js.joined);
  assert.equal(js.snap.combatants.filter((c) => c.side === 'ally').length, 2);
  await tickN(world, 2);
  assert.ok(papa.msgs.some((m) => m.t === 'battleEv' && m.evs.some((e) => (e.joined || []).some((j) => j.name === 'ユイ'))), 'パパの がめんにも ユイが くわわる');
  await papa.settle(6000);
  await kid.settle(200);
  assert.ok(!papa.inBattle && !kid.inBattle);
  const pe = papa.battles[0], ke = kid.battles[0];
  assert.equal(pe.outcome, ke.outcome, 'いっしょに おわる');
});

test('ちかくに いる なかまは いっしょに たたかいを はじめる', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  kid.s.x = FIELD.x + 6;
  kid.s.y = FIELD.y + 3;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle && kid.inBattle);
  await papa.settle(6000);
  await kid.settle(200);
});

test('つうしんが きれても しばらくは パーティーに のこり、つなぎなおすと つづきから あそべる', { timeout: 60000 }, async () => {
  let now = 1_000_000;
  const { world, papa, kid } = await family({ now: () => now });
  const kidSid = kid.s.id;
  const charId = kid.char.id;
  // たたかいの とちゅうで きれる
  kid.s.x = FIELD.x + 1;
  kid.s.y = FIELD.y;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(kid.inBattle);
  world.disconnect(kid.s, kid.conn);
  const ks = world.sessions.get(kidSid);
  assert.ok(ks && ks.away, 'セッションは のこっている');
  assert.equal(world.parties.get(papa.s.partyId).members.length, 2, 'パーティーにも のこる');
  const ctx = world.battles.get(papa.s.battleId);
  assert.ok(ctx.battle.allies.find((a) => a.controller === kidSid).auto, 'きれている あいだは オート');
  assert.ok(papa.msgs.some((m) => m.t === 'party' && m.party.members.some((x) => x.away)));

  // つなぎなおす（あたらしい つなぎで おなじ キャラを えらぶ）
  const kid2 = new Bot(world, 'ユイ');
  await kid2.login('ほし');
  kid2.send({ t: 'play', id: charId });
  assert.ok(kid2.resumed, 'つづきから');
  assert.equal(kid2.sid, kidSid, 'おなじ セッションを ひきつぐ');
  assert.equal(world.parties.get(papa.s.partyId).members.length, 2);
  const resumeStart = kid2.msgs.find((m) => m.t === 'battleStart');
  assert.ok(resumeStart && resumeStart.resume, 'たたかいの とちゅうから');
  assert.ok(!world.sessions.get(kidSid).away);
  // まえの つなぎからの メッセージは むし
  const before = papa.msgs.length;
  world.handle(kid.s, { t: 'chat', text: 'ふるい つなぎ' }, kid.conn);
  assert.ok(!papa.msgs.slice(before).some((m) => m.t === 'chat'));
  kid2.send({ t: 'chat', text: 'もどったよ' });
  assert.ok(papa.msgs.some((m) => m.t === 'chat' && m.text === 'もどったよ'));
  await papa.settle(6000);
  await kid2.settle(200);

  // ながく もどらないと ぬける
  world.disconnect(kid2.s, kid2.conn);
  assert.ok(world.sessions.get(kidSid)?.away);
  now += 4 * 60 * 1000;
  await tickN(world, 2);
  assert.ok(!world.sessions.has(kidSid), 'じかんぎれで ぬける');
  assert.equal(world.parties.get(papa.s.partyId).members.length, 1);
});

test('「ついていく」に している なかまは でいりぐちも いっしょに とおる', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  const ex = CAVE_ENTRANCE.x + 0.5, ey = CAVE_ENTRANCE.y + 2.5;
  papa.s.x = ex; papa.s.y = ey; papa.x = ex; papa.y = ey;
  kid.s.x = ex; kid.s.y = ey + 2; kid.x = ex; kid.y = ey + 2;
  kid.send({ t: 'move', x: ex, y: ey + 1.8, dir: 'up', moving: true, seq: kid.seq, follow: true });
  assert.ok(world.sessions.get(kid.s.id).follow);
  papa.send({ t: 'move', x: ex, y: ey - 1, dir: 'up', moving: true, seq: papa.seq });
  papa.send({ t: 'move', x: ex, y: CAVE_ENTRANCE.y + 0.5, dir: 'up', moving: true, seq: papa.seq });
  assert.equal(world.sessions.get(papa.s.id).map, 'cave_b1', 'リーダーが どうくつに はいる');
  assert.equal(world.sessions.get(kid.s.id).map, 'cave_b1', 'ついていく なかまも いっしょ');
  assert.ok(kid.msgs.some((m) => m.t === 'setPos' && m.map === 'cave_b1'));
});

test('5人まで: 家族 5人で パーティーを くんで、いっしょに 歩いて いっしょに 戦える（6人目は 入れない）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(31), checkPassword: () => true, rateLimit: false });
  const names = ['パパ', 'ママ', 'ユイ', 'ソラ', 'ハル', 'ミオ'];
  const bots = [];
  for (const n of names) {
    const b = new Bot(world, n);
    await b.login('x');
    await b.createAndPlay(['warrior', 'priest', 'mage', 'monk', 'performer', 'warrior'][bots.length]);
    await b.settle();
    bots.push(b);
  }
  const [papa, ...rest] = bots;
  for (const b of rest.slice(0, 4)) {
    papa.send({ t: 'party', action: 'invite', sid: b.s.id });
    b.send({ t: 'party', action: 'accept' });
  }
  const p = world.parties.get(papa.s.partyId);
  assert.equal(p.members.length, 5, '5人 そろった');
  assert.equal(p.supports.length, 0, '酒場の なかまは 入らない（人で いっぱい）');
  // 6人目は さそえない
  const sixth = bots[5];
  papa.send({ t: 'party', action: 'invite', sid: sixth.s.id });
  assert.ok(papa.msgs.some((m) => m.t === 'toast' && /いっぱい/.test(m.text)));
  sixth.send({ t: 'party', action: 'accept' });
  assert.equal(p.members.length, 5);
  // みんな ちかくに いて、まものに ふれると 5人で 戦う
  bots.slice(0, 5).forEach((b, i) => { b.s.map = 'overworld'; b.s.x = FIELD.x + (i % 3) * 0.6; b.s.y = FIELD.y + Math.floor(i / 3) * 0.6; });
  fightAt(world, papa, FIELD.x, FIELD.y);
  const ctx = world.battles.get(papa.s.battleId);
  assert.ok(ctx, 'たたかいが はじまった');
  assert.equal(ctx.battle.allies.filter((a) => a.kind !== 'guest').length, 5, '5人で 戦う');
  for (const b of bots.slice(0, 5)) assert.equal(b.s.busy, 'battle');
});

test('5人まで: 2人の パーティーでは 酒場の なかまは 今までどおり 4人に なるまで', { timeout: 60000 }, async () => {
  const { world, papa } = await family();
  const p = world.parties.get(papa.s.partyId);
  assert.ok(p.members.length + p.supports.length <= 4);
});

test('「だれで遊ぶ？」には いつ 遊んだか・今 遊んでいるかを 送らない（遊んでいる 間の「やって来た」などは 今までどおり）', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  // ママが あとから つなぐ: パパと ユイは 遊んでいる とちゅう
  const mama = new Bot(world, 'ママ');
  await mama.login('ほし');
  const noStatus = (chars, when) => {
    for (const c of chars) {
      assert.ok(!('online' in c), `${when}: ${c.name}の 今 遊んでいるか`);
      assert.ok(!('lastPlayed' in c), `${when}: ${c.name}の いつ 遊んだか`);
    }
  };
  assert.deepEqual(mama.welcome.chars.map((c) => c.name).sort(), ['パパ', 'ユイ'].sort());
  noStatus(mama.welcome.chars, 'つないだ とき');
  // ユイが やめた あと（セーブには いつ 遊んだかが 残る）も、一覧には 入れない
  const kidId = kid.char.id;
  kid.send({ t: 'quit' });
  assert.ok(world.data.characters[kidId].lastPlayed > 0);
  noStatus(kid.msgs.filter((m) => m.t === 'chars').pop().chars, 'やめた あと');
  // 遊んでいる 間の お知らせは 今までどおり（やめた・やって来た・今 遊んでいる 家族）
  assert.ok(papa.msgs.some((m) => m.t === 'left' && m.name === 'ユイ'));
  await mama.createAndPlay('priest');
  await mama.settle();
  assert.ok(papa.msgs.some((m) => m.t === 'joined' && m.name === 'ママ'));
  assert.ok(papa.msgs.filter((m) => m.t === 'players').pop().players.some((x) => x.name === 'ママ'));
  noStatus(papa.msgs.filter((m) => m.t === 'chars').pop().chars, 'キャラを 作った とき');
});
