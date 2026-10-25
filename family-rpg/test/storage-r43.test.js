// 第43回 C: 仲間が いっぱい（40）の 時の「配合してあける」と、魔物あずかり所
//   world/farewell.js（befriendFullSteps）・world/scripts.js（'breedOpen'・'befriendFull'・'befriend' の あずける）
//   world/storage.js（あずける・ひきとる）・world/breed.js（あずかり中の 親）・save.js・transfer.js・merge.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ROSTER_MAX, BREED_MIN_LEVEL } from '../public/js/shared/data/companions.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { addMonsterEntry, tavernInfo, ensureStorage, STORAGE_MAX } from '../public/js/shared/world/party.js';
import { befriendFullSteps, befriendFarewellSteps, canBreedRoom, canStore, storeList } from '../public/js/shared/world/farewell.js';
import { depositMonster, withdrawMonster, storageInfo } from '../public/js/shared/world/storage.js';
import { breedPreview } from '../public/js/shared/world/breed.js';
import { upgradeSave, repairChar } from '../public/js/shared/world/save.js';
import { exportCode, parseCode, LINE_MAX } from '../public/js/shared/world/transfer.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { MAPS, BOARD_NAMES } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const NAME = (sp) => MONSTERS[sp].name;
const QUESTION = (sp) => `${NAME(sp)}のために、どうする？`;

async function solo(seed = 43) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ミオ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(30) - c.exp);
  c.flags.monster_bond = true;
  return { world, bot, c };
}

// 仲間を n まで ふやす（low … みんな Lv9 まで。配合できない）
const fill = (c, n, { low = false } = {}) => {
  while (c.companions.length < n) {
    const i = c.companions.length;
    assert.ok(addMonsterEntry(c, i % 2 ? 'pururin' : 'wolf', low ? 1 + (i % 9) : 1 + (i % 7)).ok);
  }
};
// 配合できる 2ひき（Lv12）を 先に 入れる
const addPair = (c) => [addMonsterEntry(c, 'wolf', 12).key, addMonsterEntry(c, 'frog', 12).key];

const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const scripts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script' && !m.spectator);
const choicesOf = (bot, from = 0) => scripts(bot, from).flatMap((m) => m.steps.filter((st) => st[0] === 'choice'));
const said = (bot, re, from = 0) => scripts(bot, from).some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));

// 台本の えらぶ文に こたえる（answers … えらぶ 文字。関数なら (question, options) → 文字）・酒場の 画面が 開いたら onUi
function drive(bot, answers, onUi = null) {
  const orig = bot.onMsg.bind(bot);
  const log = [];
  bot.onMsg = (m) => {
    if (m.t === 'script' && !m.spectator) {
      const last = m.steps.at(-1);
      if (last?.[0] === 'choice') {
        const a = answers.shift();
        const want = typeof a === 'function' ? a(last[1], last[2]) : a;
        const idx = last[2].indexOf(want);
        log.push([last[1], last[2], want]);
        bot.choice = idx >= 0 ? idx : last[2].length - 1;
      }
      const ui = m.steps.find((st) => st[0] === 'ui');
      if (ui && onUi && onUi(ui[1], ui[2]) === 'drop') {
        bot.msgs.push(m);
        return; // へんじを しない（通信が 切れた）
      }
    }
    orig(m);
  };
  return { log, done: () => { bot.onMsg = orig; } };
}

test('いっぱい → はい → 配合してあける → 酒場の 配合の 画面（あける モード）→ 配合 → まっていた 魔物が 仲間に なる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(1);
  const [a, b] = addPair(c);
  fill(c, ROSTER_MAX);
  assert.ok(canBreedRoom(c));
  let ui = null;
  const d = drive(bot, ['はい', '配合してあける'], (kind, data) => {
    ui = { kind, data };
    bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b });
  });
  const n = bot.msgs.length;
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  assert.equal(ui?.kind, 'tavern', '酒場の 画面が 開いた');
  assert.equal(ui.data.makeRoom.name, NAME('koumorin'), '画面の 上に まっている 魔物');
  assert.ok(ui.data.roster.length === ROSTER_MAX);
  assert.ok(lastRes(bot).ok, lastRes(bot).text);
  assert.equal(d.log[1][0], QUESTION('koumorin'));
  assert.deepEqual(d.log[1][1], ['配合してあける', 'あずかり所へ送る', 'だれかとさよならする', 'やめる']);
  assert.ok(said(bot, /仲間がいっぱいだ/, n));
  assert.ok(!c.companions.some((e) => e.key === a || e.key === b), '親は 旅立った');
  assert.ok(c.companions.some((e) => e.species === 'koumorin'), 'まっていた 魔物が 入った');
  assert.equal(c.companions.length, ROSTER_MAX);
  assert.ok(said(bot, new RegExp(`${c.companions.find((e) => e.species === 'koumorin').char.name}が仲間`), n));
  assert.ok(!bot.s.busy && !bot.s.befriendOffer);
});

test('配合の 画面を とじる（やめる）→ もとの えらぶ文に もどる → やめる で 去っていく', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(2);
  addPair(c);
  fill(c, ROSTER_MAX);
  const keys = c.companions.map((e) => e.key).join();
  let opened = 0;
  const d = drive(bot, ['はい', '配合してあける', 'やめる'], () => { opened++; });
  const n = bot.msgs.length;
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  assert.equal(opened, 1);
  const qs = choicesOf(bot, n).filter((st) => st[1] === QUESTION('koumorin'));
  assert.equal(qs.length, 2, 'えらぶ文に もどった');
  assert.equal(scripts(bot, n).filter((m) => m.steps.some((st) => st[0] === 'say' && /仲間がいっぱいだ/.test(st[2]))).length, 1, 'さいしょの ことばは 1回だけ');
  assert.ok(said(bot, /さびしそうに去っていった/, n));
  assert.equal(c.companions.map((e) => e.key).join(), keys, 'だれも かわらない');
  assert.ok(!bot.s.busy);
});

test('配合できる 組が ない 時は「配合してあける」を 出さない（あずかり中の 魔物も 親に 数える）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(3);
  fill(c, ROSTER_MAX, { low: true });
  assert.ok(c.companions.every((e) => e.char.level < BREED_MIN_LEVEL));
  assert.ok(!canBreedRoom(c));
  const opts = befriendFullSteps(c, 'x', 'テスト').find((st) => st[0] === 'choice')[2];
  assert.deepEqual(opts, ['あずかり所へ送る', 'だれかとさよならする', 'やめる']);
  // 台本でも
  const d = drive(bot, ['はい', 'やめる']);
  const n = bot.msgs.length;
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  assert.deepEqual(choicesOf(bot, n).find((st) => st[1] === QUESTION('koumorin'))[2], opts);
  // 仲間に Lv10 が 1ぴき・あずかり所に Lv10 が 1ぴき → 出す
  ensureStorage(c);
  c.storage.push({ key: 'm900', kind: 'monster', species: 'frog', char: { ...c.companions[0].char, id: `${c.id}:m900`, name: 'カエル', species: 'frog', level: 15 } });
  assert.ok(!canBreedRoom(c), '仲間に Lv10 が いない');
  c.companions[0].char.level = 12;
  assert.ok(canBreedRoom(c));
  // あずかり所に 2ひき いても、仲間に いなければ 出さない（あずかり中 どうしでは 仲間は あかない）
  c.companions[0].char.level = 3;
  c.storage.push({ key: 'm901', kind: 'monster', species: 'wolf', char: { ...c.storage[0].char, id: `${c.id}:m901`, name: 'ウルフ', species: 'wolf' } });
  assert.ok(!canBreedRoom(c));
  // 前の 名前も つかえる
  assert.equal(befriendFarewellSteps, befriendFullSteps);
});

test('家族で 遊んでいる 時は、なつかれた 人だけが 配合の 画面を 開く', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(4), rateLimit: false });
  const ken = new Bot(world, 'ケン');
  const mama = new Bot(world, 'ママ');
  for (const b of [ken, mama]) {
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
  }
  ken.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  assert.equal(ken.party.members.length, 2);
  const c = world.data.characters[ken.char.id];
  c.flags.monster_bond = true;
  const [a, b] = addPair(c);
  fill(c, ROSTER_MAX);
  const mamaChar = world.data.characters[mama.char.id];
  const mamaBefore = (mamaChar.companions || []).length;
  const nm = mama.msgs.length;
  let opened = 0;
  const d = drive(ken, ['はい', '配合してあける'], () => {
    opened++;
    ken.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b });
  });
  world.offerBefriend(ken.s, 'koumorin');
  await ken.settle();
  await mama.settle();
  d.done();
  assert.equal(opened, 1);
  assert.ok(c.companions.some((e) => e.species === 'koumorin'));
  const mamaUi = mama.msgs.slice(nm).filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui' || st[0] === 'choice');
  assert.equal(mamaUi.length, 0, 'ママには 画面も えらぶ文も 出ない');
  assert.ok(mama.msgs.slice(nm).some((m) => m.t === 'toast' && /仲間になりたそう/.test(m.text)), 'ママには お知らせだけ');
  assert.equal((mamaChar.companions || []).length, mamaBefore, 'ママの 仲間は かわらない');
  assert.ok(!mama.s.busy);
});

test('配合の 画面の とちゅうで 通信が 切れたら、魔物は 今までと 同じく 去っていく', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(5);
  addPair(c);
  fill(c, ROSTER_MAX);
  const keys = c.companions.map((e) => e.key).join();
  const d = drive(bot, ['はい', '配合してあける'], () => 'drop');
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle(30);
  d.done();
  assert.ok(bot.s.busy === 'script' && world.runs.size === 1, '画面を 開いて まっている');
  world.disconnect(bot.s, bot.conn);
  await new Promise((r) => setImmediate(r));
  assert.equal(world.runs.size, 0, '台本は おわった');
  assert.equal(c.companions.map((e) => e.key).join(), keys, 'だれも かわらない（魔物は 去った）');
  assert.ok(!c.companions.some((e) => e.species === 'koumorin'));
});

test('あずかり所へ送る（戦いの あと）: 魔物を 1ぴき 送ると、あいた 所に 新しい 魔物。もどる で えらぶ文に もどる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(6);
  fill(c, ROSTER_MAX);
  const list = storeList(c);
  assert.equal(list.length, ROSTER_MAX);
  assert.ok(list.every((x) => !x.human));
  const sent = list[0];
  const d = drive(bot, ['はい', 'あずかり所へ送る', 'もどる', 'あずかり所へ送る', sent.label]);
  const n = bot.msgs.length;
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  const sub = choicesOf(bot, n).filter((st) => st[1] === 'だれをあずかり所へ送る？');
  assert.equal(sub.length, 2, 'もどる → もう一度');
  assert.equal(sub[0][2].length, ROSTER_MAX + 1, 'みんな ＋ もどる');
  assert.equal(choicesOf(bot, n).filter((st) => st[1] === QUESTION('koumorin')).length, 2);
  assert.ok(said(bot, /あずかり所へ送った/, n));
  assert.ok(c.storage.some((e) => e.key === sent.key), 'あずかり所に いる');
  assert.ok(!c.companions.some((e) => e.key === sent.key));
  assert.ok(c.companions.some((e) => e.species === 'koumorin'));
  assert.equal(c.companions.length, ROSTER_MAX);
  // あずかり所が いっぱいなら「あずかり所へ送る」は 出ない
  while (c.storage.length < STORAGE_MAX) c.storage.push({ ...c.storage[0], key: `m${800 + c.storage.length}` });
  assert.ok(!canStore(c));
  assert.ok(!befriendFullSteps(c, 'x', 'テスト').find((st) => st[0] === 'choice')[2].includes('あずかり所へ送る'));
});

test('さよなら も これまでどおり（もどる で えらぶ文に もどる）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(7);
  fill(c, ROSTER_MAX, { low: true });
  const d = drive(bot, ['はい', 'だれかとさよならする', (q, o) => o[0]]);
  const n = bot.msgs.length;
  const first = c.companions.slice().sort((x, y) => x.char.level - y.char.level)[0];
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  const ch = choicesOf(bot, n).find((st) => st[1] === 'だれとさよならする？');
  assert.equal(ch[2].at(-1), 'もどる');
  assert.ok(said(bot, /さよならした/, n));
  assert.ok(!c.companions.some((e) => e.key === first.key));
  assert.ok(c.companions.some((e) => e.species === 'koumorin'));
});

test('あずかり所: ルミナの町の 小屋に 人と かんばん。話しかけると まどが 開く', { timeout: 60000 }, async () => {
  const map = MAPS.overworld;
  const npc = map.npcById.monster_keeper;
  assert.ok(npc);
  assert.equal(map.areaName(npc.x, npc.y), 'ルミナの町');
  assert.deepEqual(SCRIPTS[npc.script]({}), [['storage']]);
  assert.equal(BOARD_NAMES.monster, '魔物あずかり所');
  const board = map.boards.find((x) => x.kind === 'monster');
  assert.ok(board && Math.abs(board.x - npc.x) <= 3 && Math.abs(board.y - npc.y) <= 4, 'かんばんは 小屋の 前');
  assert.ok(map.roofs.some((r) => npc.x >= r.x && npc.x < r.x + r.w && npc.y >= r.y && npc.y < r.y + r.h), 'やねが ある');
  // カウンターごしに 話す・とびらの 下は 草地（その 下は 町の 道）
  assert.equal(map.tiles[(npc.y + 1) * map.w + npc.x], T.COUNTER);
  assert.equal(map.tiles[(npc.y + 4) * map.w + npc.x], T.DOOR);
  assert.equal(map.tiles[(npc.y + 6) * map.w + npc.x], T.STONE_PATH);
  const { world, bot } = await solo(8);
  world.placeSession(bot.s, 'overworld', npc.x + 0.5, npc.y + 2.5, 'up');
  bot.send({ t: 'interact', kind: 'npc', id: 'monster_keeper' });
  await new Promise((r) => setImmediate(r));
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'ui');
  assert.ok(ui && ui[1] === 'storage', JSON.stringify(ui));
  assert.equal(ui[2].storageMax, STORAGE_MAX);
  assert.equal(ui[2].rosterMax, ROSTER_MAX);
  await bot.settle();
  // 小屋の 中から 町の 道へ 歩いて 出られる
  await bot.walkTo(npc.x, npc.y + 6);
  assert.ok(Math.abs(bot.s.y - (npc.y + 6.5)) < 1.2, `${bot.s.x},${bot.s.y}`);
});

test('あずける・ひきとる: 魔物だけ・パーティーから はなれる・装備は ふくろへ・60 まで・40 いっぱいなら ひきとれない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(9);
  // まどを 開かないと できない
  const m1 = addMonsterEntry(c, 'wolf', 5).key;
  bot.send({ t: 'svc', kind: 'storage', action: 'deposit', key: m1 });
  assert.ok(!lastRes(bot).ok);
  bot.send({ t: 'interact', kind: 'npc', id: 'monster_keeper' });
  world.placeSession(bot.s, 'overworld', MAPS.overworld.npcById.monster_keeper.x + 0.5, MAPS.overworld.npcById.monster_keeper.y + 2.5, 'up');
  bot.send({ t: 'interact', kind: 'npc', id: 'monster_keeper' });
  await bot.settle();
  // パーティーの 魔物（装備つき）
  bot.send({ t: 'svc', kind: 'tavern', action: 'join', key: m1 });
  assert.ok(c.partyKeys.includes(m1));
  const wolf = c.companions.find((e) => e.key === m1);
  const gear = Object.keys(ITEMS).find((id) => ITEMS[id].type === 'acc');
  wolf.char.equip.acc = gear;
  const had = itemCount(c, gear);
  bot.send({ t: 'svc', kind: 'storage', action: 'deposit', key: m1 });
  let r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /おあずかり/);
  assert.ok(!c.partyKeys.includes(m1) && !c.companions.some((e) => e.key === m1));
  assert.ok(c.storage.some((e) => e.key === m1));
  assert.equal(itemCount(c, gear), had + 1, '装備は ふくろへ');
  assert.equal(r.storage.stored.length, 1);
  // 人間の 仲間は あずけられない
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false });
  bot.send({ t: 'svc', kind: 'storage', action: 'deposit', key: 'npc_gard' });
  assert.ok(!lastRes(bot).ok);
  assert.match(lastRes(bot).text, /魔物の仲間だけ/);
  // あずけた 魔物は tavernInfo の stored（配合の 親）・roster には いない
  const ti = tavernInfo(world, bot.s);
  assert.ok(ti.stored.some((e) => e.key === m1 && e.stored));
  assert.ok(!ti.roster.some((e) => e.key === m1));
  // 40 いっぱいなら ひきとれない
  fill(c, ROSTER_MAX);
  bot.send({ t: 'svc', kind: 'storage', action: 'withdraw', key: m1 });
  r = lastRes(bot);
  assert.ok(!r.ok);
  assert.match(r.text, /いっぱい/);
  assert.ok(c.storage.some((e) => e.key === m1));
  // あければ ひきとれる（酒場で 待つ・げんき いっぱい）
  bot.send({ t: 'svc', kind: 'tavern', action: 'release', key: c.companions.at(-1).key });
  wolf.char.hp = 1;
  bot.send({ t: 'svc', kind: 'storage', action: 'withdraw', key: m1 });
  r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.ok(c.companions.some((e) => e.key === m1) && !c.storage.some((e) => e.key === m1));
  assert.ok(!c.partyKeys.includes(m1), '酒場で 待つ');
  assert.equal(wolf.char.hp, computeStats(wolf.char).maxHp);
  // 60 まで
  const base = c.companions.find((e) => e.kind === 'monster');
  while (c.storage.length < STORAGE_MAX) c.storage.push({ ...base, key: `m${700 + c.storage.length}`, char: { ...base.char } });
  const before = c.companions.length;
  bot.send({ t: 'svc', kind: 'storage', action: 'deposit', key: m1 });
  assert.ok(!lastRes(bot).ok);
  assert.match(lastRes(bot).text, /いっぱい/);
  assert.equal(c.companions.length, before);
  assert.equal(storageInfo(world, bot.s).stored.length, STORAGE_MAX);
});

test('あずかり中の 魔物も 配合の 親に なれる。子は あずかり所に 入る（仲間の 親の ぶん 1つ あく）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(10);
  const [a, b] = addPair(c);
  const [a2, b2] = addPair(c);
  fill(c, ROSTER_MAX);
  assert.ok(depositMonster(world, bot.s, b).ok);
  assert.ok(depositMonster(world, bot.s, a2).ok);
  assert.ok(depositMonster(world, bot.s, b2).ok);
  assert.equal(c.companions.length, ROSTER_MAX - 3);
  fill(c, ROSTER_MAX);
  assert.ok(breedPreview(c, a, b).ok, 'あずかり中と 仲間');
  // 仲間 ＋ あずかり中
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b });
  let r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /あずかり所にいる/);
  assert.doesNotMatch(r.text, /酒場で待っている/);
  assert.equal(c.companions.length, ROSTER_MAX - 1, '1つ あいた');
  assert.ok(!c.storage.some((e) => e.key === b), 'あずかり中の 親も 旅立った');
  const child = c.storage.at(-1);
  assert.ok(child.char.parents?.length === 2);
  assert.equal(c.storage.length, 3);
  // あずかり中 どうし: 子は あずかり所・仲間の 数は かわらない
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a2, b: b2 });
  r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.equal(c.companions.length, ROSTER_MAX - 1);
  assert.equal(c.storage.length, 2);
  // 番号は かさならない
  const keys = [...c.companions, ...c.storage].map((e) => e.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('戦いの あと: あずかり中の 魔物と 配合しても あく。あずかり中 どうしでは あかない（えらぶ文に もどる）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(11);
  const [a, b] = addPair(c);
  const [a2, b2] = addPair(c);
  fill(c, ROSTER_MAX);
  for (const k of [b, a2, b2]) assert.ok(depositMonster(world, bot.s, k).ok);
  fill(c, ROSTER_MAX);
  // 1回め: あずかり中 どうし（あかない）→ えらぶ文 → 2回め: 仲間 ＋ あずかり中（あく）
  const pairs = [[a2, b2], [a, b]];
  const d = drive(bot, ['はい', '配合してあける', '配合してあける'], () => {
    const [x, y] = pairs.shift();
    bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: x, b: y });
  });
  const n = bot.msgs.length;
  world.offerBefriend(bot.s, 'koumorin');
  await bot.settle();
  d.done();
  assert.ok(said(bot, /あずかり中の魔物どうしの配合では/, n));
  assert.ok(c.companions.some((e) => e.species === 'koumorin'));
  assert.equal(c.companions.length, ROSTER_MAX);
});

test('酒場で 人間の 仲間を さそう 時も: あずかり所へ送ってから・配合して あけてから 入る', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(12);
  const [a, b] = addPair(c);
  fill(c, ROSTER_MAX);
  // あずかり所へ 送ってから（world/services.js の 'recruit' の store）
  const m = storeList(c)[0];
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina', join: false, store: m.key });
  let r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /あずかり所へ送った/);
  assert.ok(c.companions.some((e) => e.key === 'npc_mina'));
  assert.ok(c.storage.some((e) => e.key === m.key));
  assert.equal(c.companions.length, ROSTER_MAX);
  // 人間は 送れない
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false, store: 'npc_mina' });
  assert.ok(!lastRes(bot).ok);
  assert.ok(!c.companions.some((e) => e.key === 'npc_gard'));
  // 配合して あけてから（酒場の 画面で 配合 → さそう）
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a, b });
  assert.ok(lastRes(bot).ok);
  assert.equal(c.companions.length, ROSTER_MAX - 1);
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard', join: false });
  r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.equal(c.companions.length, ROSTER_MAX);
});

test('古い セーブ（storage が ない）は 空。知らない 魔物は しまって、わかる 版で もどる', () => {
  const old = { version: 4, characters: { k1: { id: 'k1', name: 'ケン', level: 5, job: 'warrior', companions: [] } } };
  const up = upgradeSave(old).data.characters.k1;
  assert.equal(up.storage, undefined, 'ない ままで よい');
  assert.deepEqual(ensureStorage(up).storage, []);
  const c = repairChar({
    id: 'k2', name: 'ミオ', job: 'warrior', companions: [],
    storage: [
      { key: 'm3', kind: 'monster', species: 'wolf', char: { name: 'ウルフ', species: 'wolf', level: 12 } },
      { key: 'm4', kind: 'monster', species: 'mirai_dragon_x', char: { name: 'ミライ', species: 'mirai_dragon_x', level: 9 } },
      null,
    ],
  }, 'k2');
  assert.deepEqual(c.storage.map((e) => e.key), ['m3']);
  assert.deepEqual(c.stash.storage.map((e) => e.key), ['m4'], '知らない 魔物は しまう');
  // また 読んでも かわらない
  repairChar(c, 'k2');
  assert.deepEqual(c.storage.map((e) => e.key), ['m3']);
  assert.equal(c.stash.storage.length, 1);
  // 番号は あずかり中の 魔物より 先へ
  c.monsterSeq = 2;
  ensureStorage(c);
  assert.ok(c.monsterSeq > 3);
});

test('引っこしコード: あずかり所の 魔物も のる（KIZUNA-2 も 3 も）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(13);
  fill(c, 6);
  for (const e of c.companions.slice(0, 3)) assert.ok(depositMonster(world, bot.s, e.key).ok);
  const want = c.storage.map((e) => [e.key, e.species, e.char.level, e.char.name]);
  let r = parseCode(exportCode(c));
  assert.ok(r.ok, r.reason);
  assert.deepEqual(r.char.storage.map((e) => [e.key, e.species, e.char.level, e.char.name]), want);
  // 仲間 40 ＋ あずかり所 60（大きい）: KIZUNA-3 でも もどる
  fill(c, ROSTER_MAX);
  const base = c.companions.find((e) => e.kind === 'monster');
  while (c.storage.length < STORAGE_MAX) {
    const k = `m${500 + c.storage.length}`;
    c.storage.push({ key: k, kind: 'monster', species: base.species, char: { ...JSON.parse(JSON.stringify(base.char)), id: `${c.id}:${k}` } });
  }
  const code = exportCode(c);
  assert.ok(code.startsWith('KIZUNA-3-'), `${code.slice(0, 10)} ${code.length}`);
  r = parseCode(code);
  assert.ok(r.ok, r.reason);
  assert.equal(r.char.storage.length, STORAGE_MAX);
  assert.equal(r.char.storage.at(-1).char.id, c.storage.at(-1).char.id);
  assert.deepEqual(r.char.storage.at(-1).char.equip, c.storage.at(-1).char.equip);
  assert.ok(LINE_MAX > 0);
});

test('データを 合わせる（ひとりモード ⇄ 家族サーバー）: あずけた・ひきとった 魔物が ふえたり 消えたり しない', () => {
  const mon = (k, sp = 'wolf') => ({ key: k, kind: 'monster', species: sp, char: { id: `x:${k}`, name: k, species: sp, level: 12, equip: {} } });
  const base = { id: 'x', name: 'ミオ', lastPlayed: 1, monsterSeq: 10, companions: [mon('m1'), mon('m2')], storage: [mon('m3')] };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  // こちら: m1 を あずけた / むこう: m3 を ひきとった
  const a = clone(base);
  a.lastPlayed = 2;
  a.storage.push(a.companions.shift());
  const t = clone(base);
  t.lastPlayed = 3;
  t.companions.push(t.storage.shift());
  const out = mergeChars(base, a, t);
  const roster = out.companions.map((e) => e.key).sort();
  const stored = out.storage.map((e) => e.key).sort();
  assert.deepEqual(roster, ['m2', 'm3']);
  assert.deepEqual(stored, ['m1']);
  // 片方だけ storage が ある（古い 版）
  const old = clone(base);
  delete old.storage;
  const out2 = mergeChars(null, clone(base), old);
  assert.ok(out2.storage.some((e) => e.key === 'm3'));
});

test('画面の 文字（漢字の きまり・スペース）。storage.js は kanji-check の 対象', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['public/js/shared/world/storage.js', 'public/js/client/ui/storage.js', 'public/js/shared/world/farewell.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
    assert.deepEqual(checkFile(f).filter((x) => x.kind !== 'kana'), [], f);
  }
});
