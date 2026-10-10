// 家族の パーティーで まものが 仲間に なると、いっしょに 戦った 家族の 酒場にも 入る（world/recruit-share.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel, computeStats, newMonsterCompanion } from '../public/js/shared/stats.js';
import { ROSTER_MAX } from '../public/js/shared/data/companions.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { befriendShare, shareBefriend, takeTavernNews, tavernNewsText } from '../public/js/shared/world/recruit-share.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const clone = (x) => JSON.parse(JSON.stringify(x));

function level(world, bot, lv) {
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(lv) - c.exp);
  c.hp = computeStats(c).maxHp;
  world.sendSelf(bot.s);
}

// 家族 n人（はじめの 人が リーダー。みんな 同じ パーティー）
async function family(names = ['パパ', 'ユイ', 'ケン'], { offline = false, seed = 11 } = {}) {
  const world = new GameWorld({ offline, rng: makeRng(seed), checkPassword: () => true, rateLimit: false });
  const bots = [];
  for (const [i, name] of names.entries()) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay(['warrior', 'mage', 'priest'][i % 3]);
    await b.settle();
    level(world, b, 12);
    bots.push(b);
  }
  for (const b of bots.slice(1)) {
    bots[0].send({ t: 'party', action: 'invite', sid: b.s.id });
    b.send({ t: 'party', action: 'accept' });
  }
  for (const b of bots) {
    b.s.map = 'overworld';
    b.s.x = FIELD.x;
    b.s.y = FIELD.y;
  }
  const chars = bots.map((b) => world.data.characters[b.char.id]);
  // 紋章の 力に めざめているのは リーダーだけ（家族の 人は まだでも よい）
  chars[0].flags.monster_bond = true;
  return { world, bots, chars };
}

// まものに ふれる（かならず 仲間に なりたがる）
function fight(world, bot, group = ['pururin']) {
  const ms = world.mapStates.get(bot.s.map) || (world.tick(1), world.mapStates.get(bot.s.map));
  const sym = { id: 'sr' + Math.random(), sp: group[0], group, table: 'outskirts', zone: 'outskirts', x: bot.s.x, y: bot.s.y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.send({ t: 'touch', id: sym.id });
  return sym;
}

function forceBefriend(world) {
  const chance = world.rng.chance;
  world.rng.chance = (p) => (p >= 1 / 40 && p <= 0.5 && p !== 0.25 ? true : chance.call(world.rng, p));
  return () => { world.rng.chance = chance; };
}

async function settleAll(world, bots, max = 8000) {
  for (let i = 0; i < max; i++) {
    for (const b of bots) b.flushQueue();
    await tickN(world, 1);
    for (const b of bots) b.flushQueue();
    if (bots.every((b) => !b.s.busy && !b.queue.length && !b.inBattle)) {
      await tickN(world, 3);
      for (const b of bots) b.flushQueue();
      if (bots.every((b) => !b.s.busy && !b.queue.length && !b.inBattle)) return true;
    }
  }
  return false;
}

const monsters = (c) => (c.companions || []).filter((e) => e.kind === 'monster');
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);
const said = (bot, re, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script' && !m.spectator).some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));

test('家族3人: リーダーが 仲間に すると、いっしょに 戦った 2人の 酒場にも 同じ まものが 入る（図鑑・知らせ）', { timeout: 90000 }, async () => {
  const { world, bots, chars } = await family();
  const [papa, yui, ken] = bots;
  const [pc, yc, kc] = chars;
  // ユイは もう「ぷるる」を 仲間に している（名前は かさならない）
  yc.companions = [{ key: 'm1', kind: 'monster', species: 'pururin', char: newMonsterCompanion({ id: `${yc.id}:m1`, name: 'ぷるる', species: 'pururin', level: 5 }) }];
  yc.monsterSeq = 2;
  yc.partyKeys = ['m1'];
  const yuiParty = [...yc.partyKeys];
  const restore = forceBefriend(world);
  papa.choice = 0;
  fight(world, papa);
  assert.ok(papa.inBattle && yui.inBattle && ken.inBattle, '3人で 戦う');
  assert.ok(await settleAll(world, bots));
  restore();
  // リーダー（受け取る 人）は 今の まま: パーティーに 入る
  const pm = monsters(pc);
  assert.equal(pm.length, 1);
  assert.ok(pc.partyKeys.includes(pm[0].key), 'リーダーは パーティーへ');
  assert.equal(pm[0].species, 'pururin');
  // ユイと ケン: 酒場に 入る（パーティー・馬車は かわらない）
  for (const [c, before] of [[yc, yuiParty], [kc, []]]) {
    const e = monsters(c).filter((x) => x.species === 'pururin').at(-1);
    assert.ok(e, `${c.name}の 酒場に 入った`);
    assert.equal(e.char.level, 1, 'レベル1（ふつうに 仲間に なった 時と 同じ）');
    assert.equal(e.char.plus || 0, 0);
    assert.equal(e.char.hp, computeStats(e.char).maxHp);
    assert.ok(!c.partyKeys.includes(e.key) && !(c.wagonKeys || []).includes(e.key), '酒場で 待つ');
    assert.deepEqual(c.partyKeys, before, 'パーティーは かってに かえない');
    assert.ok(c.bestiary.pururin.friend >= 1, '図鑑の「仲間にした」');
    assert.equal(e.char.id, `${c.id}:${e.key}`);
  }
  const yNew = monsters(yc).at(-1);
  assert.notEqual(yNew.char.name, 'ぷるる', '名前は その人の 仲間と かさならない');
  assert.notEqual(yNew.key, 'm1');
  assert.equal(yc.bestiary.pururin.friend, 1);
  // 知らせ
  assert.ok(toasts(yui).some((t) => /ルミナの町の酒場で待っている！/.test(t) && /ユイの仲間にもなった/.test(t)), 'ユイに 知らせ');
  assert.ok(toasts(ken).some((t) => /酒場で待っている！/.test(t) && /パパといっしょに戦った/.test(t)), 'ケンに 知らせ');
  assert.ok(said(papa, /ユイとケンの酒場にも/), 'リーダーにも');
  assert.ok(yui.msgs.some((m) => m.t === 'self' && m.char.companions.length === 2), 'ユイの 画面の データも 新しく');
  // 二重に ならない（もう一度 たしかめる）
  assert.equal(monsters(kc).length, 1);
  assert.equal(monsters(pc).length, 1);
});

test('招待された 人が 受け取る 時（リーダーが 戦いに 出ていない）: その人は 今の まま、いっしょに 戦った 家族は 酒場、戦っていない リーダーには 入らない', { timeout: 90000 }, async () => {
  const { world, bots, chars } = await family();
  const [papa, yui, ken] = bots;
  const [pc, yc, kc] = chars;
  yc.flags.monster_bond = true;
  papa.s.x = FIELD.x + 30; // はなれている
  const restore = forceBefriend(world);
  yui.choice = 0;
  fight(world, yui);
  assert.ok(yui.inBattle && ken.inBattle && !papa.inBattle);
  assert.ok(await settleAll(world, bots));
  restore();
  assert.equal(monsters(yc).length, 1, 'ユイが 受け取る');
  assert.ok(yc.partyKeys.includes(monsters(yc)[0].key), 'ユイは 今の まま（パーティーへ）');
  assert.equal(monsters(kc).length, 1, 'ケンの 酒場に');
  assert.ok(!kc.partyKeys.includes(monsters(kc)[0].key));
  assert.equal(monsters(pc).length, 0, '戦っていない リーダーには 入らない');
  assert.ok(toasts(ken).some((t) => /ユイといっしょに戦った/.test(t)));
  assert.ok(!toasts(papa).some((t) => /酒場で待っている/.test(t)));
});

test('「いいえ」の 時は だれにも 入らない', { timeout: 90000 }, async () => {
  const { world, bots, chars } = await family(['パパ', 'ユイ']);
  const restore = forceBefriend(world);
  bots[0].choice = 1;
  fight(world, bots[0]);
  assert.ok(await settleAll(world, bots));
  restore();
  assert.equal(monsters(chars[0]).length, 0);
  assert.equal(monsters(chars[1]).length, 0);
});

test('オフライン: パーティーを ぬけた 人・はなれて 戦っていない 人には 入らない。通信が とぎれて オートで 戦った 人には 入り、もどった 時に 知らせ', { timeout: 90000 }, async () => {
  const { world, bots, chars } = await family(['パパ', 'ユイ', 'ケン', 'ソラ']);
  const [papa, yui, ken, sora] = bots;
  const [, yc, kc, sc] = chars;
  // ソラは ログアウト（オフライン）
  sora.send({ t: 'quit' });
  // ケンは はなれている
  ken.s.x = FIELD.x + 30;
  const restore = forceBefriend(world);
  papa.choice = 0;
  fight(world, papa);
  assert.ok(yui.inBattle && !ken.inBattle);
  // ユイは 戦いの とちゅうで 通信が とぎれる（オートで 戦う）
  const yuiSid = yui.s.id;
  world.disconnect(yui.s, yui.conn);
  yui.inBattle = false;
  assert.ok(world.sessions.get(yuiSid).away);
  assert.ok(await settleAll(world, [papa, ken]));
  restore();
  assert.equal(monsters(kc).length, 0, 'はなれていた ケンには 入らない');
  assert.equal(monsters(sc).length, 0, 'オフラインの ソラには 入らない');
  assert.equal(monsters(yc).length, 1, 'オートで 戦った ユイには 入る');
  assert.equal(yc.tavernNews.length, 1, 'もどった 時の 知らせを のこす');
  assert.ok(said(papa, /ユイの酒場にも/));
  // つなぎなおすと 知らせが 出て、けえる
  const yui2 = new Bot(world, 'ユイ');
  await yui2.login();
  yui2.send({ t: 'play', id: yc.id });
  const enter = yui2.msgs.find((m) => m.t === 'enter');
  assert.ok(enter.resumed);
  assert.equal(enter.tavernNews.length, 1);
  assert.match(enter.tavernNews[0], /ルミナの町の酒場で待っている！/);
  assert.equal(yc.tavernNews, undefined);
  // 次に 入った 時は もう 出ない
  yui2.send({ t: 'quit' });
  const yui3 = new Bot(world, 'ユイ');
  await yui3.login();
  yui3.send({ t: 'play', id: yc.id });
  assert.deepEqual(yui3.msgs.find((m) => m.t === 'enter').tavernNews, []);
});

test('酒場が いっぱいの 人には 入らない（こわれない・知らせ）。ほかの 人には 入る', { timeout: 90000 }, async () => {
  const { world, bots, chars } = await family();
  const [papa, yui, ken] = bots;
  const [pc, yc, kc] = chars;
  kc.companions = [];
  for (let i = 1; i <= ROSTER_MAX; i++) kc.companions.push({ key: `m${i}`, kind: 'monster', species: 'goblin', char: newMonsterCompanion({ id: `${kc.id}:m${i}`, name: `ゴブ${i}`, species: 'goblin', level: 1 }) });
  kc.monsterSeq = ROSTER_MAX + 1;
  const before = clone(kc.companions);
  const restore = forceBefriend(world);
  papa.choice = 0;
  fight(world, papa);
  assert.ok(await settleAll(world, bots));
  restore();
  assert.equal(monsters(pc).length, 1);
  assert.equal(monsters(yc).length, 1);
  assert.deepEqual(kc.companions, before, 'ケンの 仲間は そのまま');
  assert.ok(!kc.bestiary?.pururin?.friend, '入らなかった ので 図鑑の「仲間にした」も ふえない');
  assert.ok(toasts(ken).some((t) => /酒場がいっぱいで入れなかった/.test(t)));
  assert.ok(said(papa, /ケンの酒場はいっぱいで/));
  assert.ok(said(papa, /ユイの酒場にも/));
});

test('ひとりの 時は 今と まったく 同じ（家族の キャラを サポートで 連れていても、その 人には 入らない）', { timeout: 90000 }, async () => {
  // ひとりで遊ぶサイト（offline）
  {
    const { world, bots, chars } = await family(['ハル'], { offline: true });
    const restore = forceBefriend(world);
    bots[0].choice = 0;
    fight(world, bots[0]);
    assert.ok(await settleAll(world, bots));
    restore();
    assert.equal(monsters(chars[0]).length, 1);
    assert.ok(chars[0].partyKeys.includes(monsters(chars[0])[0].key));
    assert.ok(!said(bots[0], /酒場にも/), 'ほかの 知らせは 出ない');
    assert.ok(!toasts(bots[0]).some((t) => /酒場で待っている/.test(t)));
    assert.equal(chars[0].tavernNews, undefined);
  }
  // 家族サーバーで ひとり（ママの キャラを サポートで 連れている）
  {
    const { world, bots, chars } = await family(['ママ', 'ケン'], { seed: 21 });
    const [mama, ken] = bots;
    const [mc, kc] = chars;
    ken.send({ t: 'party', action: 'leave' });
    mama.send({ t: 'quit' });
    kc.flags.monster_bond = true;
    ken.send({ t: 'svc', kind: 'tavern', action: 'join', key: `fam:${mc.id}` });
    assert.ok(ken.party.supports.some((x) => x.family), 'ママを サポートで 連れている');
    ken.s.x = FIELD.x;
    ken.s.y = FIELD.y;
    const restore = forceBefriend(world);
    ken.choice = 0;
    fight(world, ken);
    const start = ken.msgs.filter((m) => m.t === 'battleStart').pop();
    assert.ok(start.snap.combatants.some((x) => x.side === 'ally' && x.name === mc.name), 'ママの うつしも 戦いに 出ている');
    assert.ok(await settleAll(world, [ken]));
    restore();
    assert.equal(monsters(kc).length, 1, 'ケンは 今の まま');
    assert.equal(monsters(mc).length, 0, 'サポートの ママには 入らない');
    assert.equal(mc.tavernNews, undefined);
  }
});

test('befriendShare: 受け取る 人と 同じ キャラ・かさなりを のぞく', () => {
  const a = { charId: 'a' }, b = { charId: 'b' }, b2 = { charId: 'b' }, n = { charId: null };
  assert.deepEqual(befriendShare([a, b, b2, n], a), ['b']);
  assert.deepEqual(befriendShare([a], a), []);
  assert.deepEqual(befriendShare(null, a), []);
});

test('知らせの 文と、のこった 知らせ（けしても こわれない）', () => {
  assert.match(tavernNewsText({ species: 'pururin', name: 'ぷるる', from: 'パパ', who: 'ユイ' }), /^ぷるるが、ルミナの町の酒場で待っている！/);
  assert.match(tavernNewsText({ species: 'pururin', who: 'ユイ', full: true }), /いっぱい/);
  assert.deepEqual(takeTavernNews({}), []);
  assert.deepEqual(takeTavernNews({ tavernNews: 'こわれた' }), []);
  const c = { tavernNews: [{ species: 'pururin', name: 'ぷるる', who: 'ユイ' }, null] };
  assert.equal(takeTavernNews(c).length, 1);
  assert.equal(c.tavernNews, undefined);
});

test('データ合わせ（merge.js）: 酒場に 来た まものは きえない・二重に ならない（あとで 遊んだ ほう でも）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const yc = world.data.characters[bot.char.id];
  const base = clone(yc);
  // 家族サーバー: パーティーで ぷるりんが 酒場に 来た（ユイは いない ので 知らせを のこす）
  const server = clone(base);
  world.data.characters.server = server;
  const sh = shareBefriend(world, { char: { name: 'パパ' } }, 'pururin', 1, ['server']);
  delete world.data.characters.server;
  assert.deepEqual(sh.got, [server.name]);
  assert.equal(server.tavernNews.length, 1);
  const key = monsters(server)[0].key;
  // スマホ: ひとりで 遊んで、べつの まもの（同じ 番号）を 仲間に した。あとで 遊んだ のは スマホ
  const phone = clone(base);
  phone.companions = [{ key, kind: 'monster', species: 'goblin', char: newMonsterCompanion({ id: `${phone.id}:${key}`, name: 'ゴブりん', species: 'goblin', level: 1 }) }];
  phone.monsterSeq = (phone.monsterSeq || 1) + 1;
  phone.bestiary = { ...(phone.bestiary || {}), goblin: { friend: 1 } };
  phone.lastPlayed = (server.lastPlayed || 0) + 1000;
  for (const [a, t] of [[server, phone], [phone, server]]) {
    const m = mergeChars(base, a, t);
    const sp = monsters(m).map((e) => e.species).sort();
    assert.deepEqual(sp, ['goblin', 'pururin'], '両方 のこる・二重に ならない');
    assert.equal(new Set(monsters(m).map((e) => e.key)).size, 2, '番号も かさならない');
    assert.equal(m.bestiary.pururin.friend, 1);
    assert.equal(m.bestiary.goblin.friend, 1);
    assert.equal(m.tavernNews.length, 1, 'まだ 見ていない 知らせは のこる');
    // もう一度 合わせても ふえない（合わせた ものを「わかれる まえ」に）
    const again = mergeChars(m, m, clone(m));
    assert.equal(monsters(again).length, 2);
  }
  // スマホが サーバーの データを もらった あと（base に 入った）で、スマホで 知らせを 見た → サーバーと 合わせても もう 出ない
  const merged = mergeChars(base, phone, server);
  const seen = clone(merged);
  takeTavernNews(seen);
  const back = mergeChars(merged, merged, seen);
  assert.equal(back.tavernNews, undefined);
  assert.equal(monsters(back).length, 2);
  // まもの だけ サーバーで ふえた（スマホは かわっていない）→ 1ぴき
  const only = mergeChars(base, base, server);
  assert.equal(monsters(only).length, 1);
  // セーブを 読みなおしても のこる
  const saved = upgradeSave(clone({ version: 4, characters: { [server.id]: server } }));
  assert.equal(monsters(saved.data.characters[server.id]).length, 1);
});
