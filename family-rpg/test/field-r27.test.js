// 第27回 D: 仲間・馬車・帰る 魔法・ひみつのダンジョン
//   1. 仲間は 40ひきまで（酒場の ならび・家族の 酒場・配合・引っこしコード・データ合わせ）
//   2. 馬車の 経験値（フィールドは 戦った 仲間と 同じ・馬車が 入れない 所は 半分）
//   3. リレミト・トヘロス・マモノヨセ・魔物よせの笛（効き目・使えない 所・家族）
//   4. ひみつのダンジョンの 記録と とちゅうから 始める（ひとり・家族）・古い セーブ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS, itemKana } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ROSTER_MAX } from '../public/js/shared/data/companions.js';
import { WAGON_EXP_RATE, WAGON_EXP_RATE_WITH, wagonExpRate } from '../public/js/shared/data/wagon.js';
import { wagonHere } from '../public/js/shared/world/wagon.js';
import {
  FIELD27_ABILITIES, FIELD27_LEARN, LURE, LURE_ITEM, LURE_SECONDS, REPEL_SECONDS, FIELD27_SHOPS, auraLabel,
} from '../public/js/shared/data/abilities-field27.js';
import { lureGroup, auraOf } from '../public/js/shared/world/field27.js';
import { mapState, spawnSymbols, moveSymbols, rollGroup } from '../public/js/shared/world/monsters.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { addMonsterEntry, recruitNpc, noteSeen } from '../public/js/shared/world/party.js';
import { breedMonsters } from '../public/js/shared/world/breed.js';
import { shareBefriend } from '../public/js/shared/world/recruit-share.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode, LINE_MAX } from '../public/js/shared/world/transfer.js';
import { repairChar, upgradeSave } from '../public/js/shared/world/save.js';
import { runScript } from '../public/js/shared/world/scripts.js';
import { fieldUsableAbilities } from '../public/js/shared/fieldskills.js';
import { sortRoster, nextRosterSort } from '../public/js/shared/roster-sort.js';
import { gainExp, expForLevel, computeStats, mpCost, learnedAbilities, itemCount, addItem } from '../public/js/shared/stats.js';
import {
  SD_GATE, SD_OPEN_FLAG, sdFloorId, sdFloorOf, sdSaveOf, sdStartFloors, sdStartText, noteSdSave, repairSecret, mergeSecret, sdBoardRows,
} from '../public/js/shared/data/secret.js';
import { REST_DOWN } from '../public/js/shared/maps/secret-dungeon.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const menu = (bot, msg) => {
  bot.send({ t: 'menu', ...msg });
  return lastMenu(bot);
};
const sayTexts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say').map((s) => s[2]));
// さいごに 出た「えらぶ」（[文, えらぶ物]）
const lastChoice = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'choice')).map((s) => [s[1], s[2]]);
function answers(bot, list) {
  const q = list.slice();
  Object.defineProperty(bot, 'choice', { get: () => (q.length ? q.shift() : 0), set: () => {}, configurable: true });
}

async function solo(seed = 27, job = 'warrior', name = 'ソラ') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(20) - c.exp);
  c.hp = computeStats(c).maxHp;
  c.mp = computeStats(c).maxMp;
  world.placeSession(bot.s, 'overworld', FIELD.x, FIELD.y, 'down', true);
  await bot.settle();
  return { world, bot, c };
}

// 家族の サーバー（2〜3人）
async function family(names, seed = 27) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false });
  const bots = [];
  for (const n of names) {
    const b = new Bot(world, n);
    await b.login('x');
    await b.createAndPlay('warrior');
    await b.settle();
    const c = world.data.characters[b.char.id];
    gainExp(c, expForLevel(40) - c.exp);
    c.hp = 9999;
    c.mp = 9999;
    c.jobs[c.job] = { lv: 10, b: 999 };
    c.equip.weapon = 'thunder_sword';
    c.equip.armor = 'silver_mail';
    for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf(SD_OPEN_FLAG) + 1)) c.flags[f] = true;
    bots.push(b);
  }
  return { world, bots };
}
async function join(leader, member) {
  leader.send({ t: 'party', action: 'invite', sid: member.s.id });
  member.send({ t: 'party', action: 'accept' });
  await leader.settle();
  await member.settle();
}

async function winNow(world, bot, ctx) {
  ctx.battle.allyActs = 2;
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 200 && !ctx.battle.over; i++) await tickN(world, 1);
  await tickN(world, 2);
  bot.flushQueue();
}
const sym = (group, table = 'outskirts') => ({ id: 'r27' + Math.random(), sp: group[0], group, zone: table, table, busy: false });

// ───────────── 1. 仲間は 40ひきまで ─────────────
test('仲間の 上限: 40ひき（酒場の 知らせ・家族の 酒場・配合は へらない・データ合わせ）', async () => {
  assert.equal(ROSTER_MAX, 40);
  const { world, bot, c } = await solo(1);
  c.flags.monster_bond = true;
  for (let i = 0; i < 39; i++) assert.ok(addMonsterEntry(c, i % 2 ? 'pururin' : 'wolf', 1 + (i % 7)).ok);
  assert.equal(c.companions.length, 39);
  assert.ok(addMonsterEntry(c, 'pururin', 1).ok, '40ひきめ');
  const full = addMonsterEntry(c, 'pururin', 1);
  assert.equal(full.ok, false);
  assert.ok(full.full && /40ひきまで/.test(full.reason), full.reason);
  // 家族の 酒場（recruit-share.js）: 40ひきの 人には 入らない・39ひきの 人には 入る
  const other = { id: 'o1', name: 'ママ', level: 5, companions: [] };
  world.data.characters.o1 = repairChar(other);
  for (let i = 0; i < 39; i++) addMonsterEntry(other, 'pururin', 1);
  let sh = shareBefriend(world, bot.s, 'wolf', 1, ['o1']);
  assert.deepEqual(sh.got, ['ママ']);
  sh = shareBefriend(world, bot.s, 'wolf', 1, ['o1']);
  assert.deepEqual(sh.full, ['ママ'], '40ひきで いっぱい');
  // 配合: 2ひきが 1ぴきに（いっぱいでも 配合できる）
  const lv10 = c.companions.filter((e) => e.kind === 'monster').slice(0, 2);
  for (const e of lv10) { e.char.level = 20; e.char.exp = expForLevel(20); }
  const br = breedMonsters(world, bot.s, { a: lv10[0].key, b: lv10[1].key, name: 'ハイゴ' });
  assert.ok(br.ok, br.reason);
  assert.equal(c.companions.length, 39);
  // データ合わせ: 両方で ふえた 仲間は のこす（40ひきを こえても 消さない。ふやせるのは 40より 少なく なってから）
  const base = JSON.parse(JSON.stringify(c));
  const a = JSON.parse(JSON.stringify(c));
  const t = JSON.parse(JSON.stringify(c));
  a.companions.push({ key: 'mA', kind: 'monster', species: 'pururin', char: { ...a.companions[2].char, id: `${c.id}:mA` } });
  t.companions.push({ key: 'mT', kind: 'monster', species: 'wolf', char: { ...t.companions[3].char, id: `${c.id}:mT`, species: 'wolf' } });
  a.lastPlayed = 10;
  t.lastPlayed = 20;
  const m = mergeChars(base, a, t);
  assert.equal(m.companions.length, 41);
});

test('酒場の ならび: 仲間に なった順・種類順（人が 先・図鑑の 順・レベルの 高い 順）・レベル順', () => {
  const list = [
    { key: 'a', species: 'wolf', level: 3 },
    { key: 'b', level: 10, job: 'priest' },
    { key: 'c', species: 'pururin', level: 8 },
    { key: 'd', species: 'wolf', level: 12 },
    { key: 'e', species: 'pururin', level: 2 },
  ];
  assert.deepEqual(sortRoster(list, 'got').map((e) => e.key), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(sortRoster(list, 'level').map((e) => e.key), ['d', 'b', 'c', 'a', 'e']);
  const dex = Object.keys(MONSTERS);
  assert.ok(dex.indexOf('pururin') < dex.indexOf('wolf'));
  const first = ['c', 'e', 'd', 'a'];
  assert.deepEqual(sortRoster(list, 'kind').map((e) => e.key), ['b', ...first]);
  assert.equal(nextRosterSort('got'), 'kind');
  assert.equal(nextRosterSort('kind'), 'level');
  assert.equal(nextRosterSort('level'), 'got');
  assert.equal(list[0].key, 'a', 'もとの ならびは かえない');
});

test('引っこしコード: 仲間 40人（いっぱい）でも LINE で 1回（KIZUNA-3）。読むと もとどおり', async () => {
  const { world, bot, c } = await solo(2);
  c.flags.monster_bond = true;
  for (const f of STORY_STEPS) c.flags[f] = true;
  for (const id of Object.keys(ITEMS).slice(0, 60)) addItem(c, id, 9);
  gainExp(c, expForLevel(40) - c.exp);
  for (const m of Object.keys(MONSTERS)) { c.kills[m] = 99; noteSeen(c, m); }
  for (let i = 0; i < 80; i++) c.chests['chest' + i] = true;
  for (const id of ['npc_gard', 'npc_mina', 'npc_rin', 'npc_tina', 'npc_luca']) recruitNpc(world, bot.s, id, { join: false });
  for (const sp of Object.keys(MONSTERS)) {
    if (c.companions.length >= ROSTER_MAX) break;
    addMonsterEntry(c, sp, 40);
  }
  assert.equal(c.companions.length, 40);
  c.companions[8].char.equip.weapon = 'iron_sword';
  const code = exportCode(c);
  assert.ok(code.length < LINE_MAX, `コードの 長さ ${code.length}`);
  assert.ok(code.startsWith('KIZUNA-3-'));
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const want = repairChar(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(r.char.companions, want.companions, '仲間は もとどおり');
  // 少ない ときは 今までどおり KIZUNA-2（前の 版でも 読める）
  const few = { ...JSON.parse(JSON.stringify(c)), companions: c.companions.slice(0, 3) };
  assert.ok(exportCode(few).startsWith('KIZUNA-2-'));
});

// ───────────── 2. 馬車の 経験値 ─────────────
test('馬車の 経験値: 馬車が いっしょの 所は 戦った 仲間と 同じ、入口で 待つ 所（洞窟・ひみつのダンジョン）は 半分', async () => {
  assert.equal(WAGON_EXP_RATE_WITH, 1);
  assert.equal(WAGON_EXP_RATE, 0.5);
  assert.equal(wagonExpRate(true), 1);
  assert.equal(wagonExpRate(false), 0.5);
  for (const id of ['overworld', 'sea']) assert.ok(wagonHere(id), id);
  for (const id of ['cave_b1', 'tower_2f', 'sd_3', SD_GATE, 'pyramid1']) assert.ok(!wagonHere(id), id);
  // 馬車も 入れる 大迷宮（フィールドの マップ）は「いっしょ」
  const { world, bot, c } = await solo(3);
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k });
  bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_rin', join: false });
  c.flags.c1_clear = true;
  runScript(world, bot.s, 'tavern');
  await bot.settle();
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  const rin = c.companions.find((e) => e.key === 'npc_rin').char;
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  for (const ch of [rin, gard]) { ch.level = 10; ch.exp = expForLevel(10); ch.jobs[ch.job] = { lv: 1, b: 0 }; }
  const fight = async (map) => {
    bot.s.map = map;
    const e0 = { rin: rin.exp, gard: gard.exp };
    const ctx = startFieldBattle(world, bot.s, sym(['wolf', 'wolf']));
    bot.flushQueue();
    await winNow(world, bot, ctx);
    return { rin: rin.exp - e0.rin, gard: gard.exp - e0.gard, end: bot.battles.pop() };
  };
  const f = await fight('overworld');
  assert.ok(f.gard > 0 && f.rin === f.gard, `フィールド: ${f.rin} / ${f.gard}`);
  assert.equal(rin.jobs[rin.job].b, gard.jobs[gard.job].b, '職業の 修行も 同じ');
  const d = await fight('cave_b1');
  assert.ok(d.gard > 0 && d.rin === Math.floor(d.gard / 2), `洞窟: ${d.rin} / ${d.gard}`);
  assert.ok(d.end.lines.some((l) => /入り口で待つ馬車の仲間は/.test(l)));
  assert.equal(rin.wagonTrain, 0.5, '洞窟の 修行は 半分（はんぱは 次へ）');
});

// ───────────── 3. リレミト・トヘロス・マモノヨセ ─────────────
test('呪文の データ: 覚える 職業・MP・使える 場所（今使える の 一覧）', () => {
  for (const id of ['riremito', 'toheros', 'mamonoyose']) {
    const a = ABILITIES[id];
    assert.ok(a && a.kind === 'spell' && a.field && a.fieldOnly && a.hidden, id);
    assert.ok(a.mp >= 2 && a.mp <= 5, id);
  }
  assert.equal(ABILITIES.riremito.effect.type, 'exit');
  assert.equal(ABILITIES.toheros.effect.type, 'repel');
  assert.equal(ABILITIES.toheros.effect.seconds, ITEMS.holy_water.effect.seconds, 'トヘロスは 聖水と 同じ');
  assert.equal(REPEL_SECONDS, ITEMS.holy_water.effect.seconds);
  assert.equal(ABILITIES.mamonoyose.effect.type, 'lure');
  const learns = (job, id) => JOBS[job].learn.find((e) => e[1] === id)?.[0];
  assert.equal(learns('mage', 'riremito'), 3);
  assert.equal(learns('priest', 'riremito'), 4);
  assert.equal(learns('priest', 'toheros'), 5);
  assert.equal(learns('sage', 'riremito'), 1);
  assert.equal(learns('sage', 'toheros'), 2);
  assert.equal(learns('sage', 'mamonoyose'), 3);
  assert.equal(learns('jester', 'mamonoyose'), 5);
  assert.equal(learns('tamer', 'mamonoyose'), 2);
  for (const [job, list] of Object.entries(FIELD27_LEARN)) {
    const lv = JOBS[job].learn.map((e) => e[0]);
    assert.deepEqual(lv, [...lv].sort((x, y) => x - y), `${job} は レベルの じゅん`);
    for (const [, id] of list) assert.ok(FIELD27_ABILITIES[id]);
  }
  const mage = { job: 'mage', jobs: { mage: { lv: 3, b: 0 } }, hp: 10, mp: 99, equip: {} };
  assert.ok(learnedAbilities(mage).includes('riremito'));
  assert.ok(!learnedAbilities({ ...mage, jobs: { mage: { lv: 2, b: 0 } } }).includes('riremito'));
  // リレミトは フィールドでは 出さない（洞窟の 中だけ）
  assert.ok(!fieldUsableAbilities(mage, { mapKind: 'field' }).some((x) => x.id === 'riremito'));
  assert.ok(fieldUsableAbilities(mage, { mapKind: 'dungeon' }).some((x) => x.id === 'riremito'));
  // 魔物よせの笛（道具屋）
  const it = ITEMS[LURE_ITEM];
  assert.equal(it.name, '魔物よせの笛');
  assert.equal(it.effect.type, 'lure');
  assert.equal(it.effect.seconds, LURE_SECONDS);
  assert.ok(it.price > ITEMS.holy_water.price && it.field && !it.battle);
  assert.equal(itemKana(LURE_ITEM), 'まものよせのふえ');
  for (const id of FIELD27_SHOPS) assert.ok(shopItems(SHOPS[id]).includes(LURE_ITEM), id);
});

test('リレミト: 洞窟の 中から 入り口の 外へ（MPが へる）。フィールド・たてもの・ピラミッド・神殿・ひみつのダンジョンでは 使えない（MPは へらない）', async () => {
  const { world, bot, c } = await solo(4, 'mage');
  c.jobs.mage = { lv: 3, b: 0 };
  c.mp = 50;
  const cost = mpCost(c, 'riremito');
  assert.equal(cost, ABILITIES.riremito.mp);
  // フィールド
  let r = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.equal(r.ok, false);
  assert.match(r.text, /洞窟や塔の中で使う呪文/);
  assert.equal(c.mp, 50);
  // ピラミッド・神殿・ひみつのダンジョン（糸が 使えない 所）
  for (const id of ['pyramid1', 'temple_b1', 'sd_3', 'sd_10']) {
    const m = MAPS[id];
    world.placeSession(bot.s, id, (m.sd?.arrive.x ?? 5.5), (m.sd?.arrive.y ?? 5.5), 'down', true);
    r = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
    assert.equal(r.ok, false, id);
    assert.match(r.text, /はばまれて/);
    assert.equal(bot.s.map, id);
    assert.equal(c.mp, 50);
  }
  assert.match(r.text, /5階ごとの休み所/, 'ひみつのダンジョンの ヒント');
  // ひみつのダンジョンの 入口の 広間（たてもの あつかい）
  world.placeSession(bot.s, SD_GATE, 4.5, 3.5, 'down', true);
  r = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.equal(r.ok, false);
  // なげきの洞窟 地下2階 → 外へ
  world.placeSession(bot.s, 'cave_b2', 21.5, 20.5, 'down', true);
  r = menu(bot, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.equal(bot.s.map, 'overworld');
  assert.equal(c.mp, 50 - cost);
  assert.match(r.text, /外へもどってきた/);
  // 仲間（僧侶の ミーナ。職業レベル 4 で 覚える）が 唱えても 同じ
  recruitNpc(world, bot.s, 'npc_mina', { join: true });
  const mina = c.companions.find((e) => e.key === 'npc_mina').char;
  mina.jobs.priest = { lv: 4, b: 0 };
  mina.mp = 30;
  world.placeSession(bot.s, 'tower_2f', 10, 12, 'down', true);
  r = menu(bot, { action: 'cast', id: 'riremito', who: 'npc_mina', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.notEqual(bot.s.map, 'tower_2f');
  assert.ok(mina.mp < 30);
});

test('リレミト: 家族と いっしょ（ついていく 家族も 外へ）。だれが 唱えても 糸と 同じ', async () => {
  const { world, bots: [papa, yui] } = await family(['パパ', 'ユイ'], 5);
  await join(papa, yui);
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  P.char.job = 'sage';
  P.char.jobs.sage = { lv: 1, b: 0 };
  world.placeSession(P, 'cave_b2', 21.5, 20.5, 'down', true);
  world.placeSession(Y, 'cave_b2', 21.5, 21.5, 'down', true);
  Y.follow = true;
  const r = menu(papa, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.equal(P.map, 'overworld');
  assert.equal(Y.map, 'overworld', 'ついていく 家族も いっしょ');
  // ユイ（ついていく 人）が 唱えると、ユイ だけ（糸と 同じ）
  Y.char.job = 'sage';
  Y.char.jobs.sage = { lv: 1, b: 0 };
  world.placeSession(P, 'cave_b2', 21.5, 20.5, 'down', true);
  world.placeSession(Y, 'cave_b2', 21.5, 21.5, 'down', true);
  const r2 = menu(yui, { action: 'cast', id: 'riremito', who: 'self', ref: 'self' });
  assert.ok(r2.ok, r2.text);
  assert.equal(Y.map, 'overworld');
});

test('トヘロス・聖水: 弱い 魔物が にげる。マモノヨセ・笛: 強い 魔物も 弱い 魔物も おいかけてくる。あとから 使った ほうが 勝つ', async () => {
  const { world, bot, c } = await solo(6, 'priest');
  c.jobs.priest = { lv: 5, b: 0 };
  c.mp = 50;
  const s = bot.s;
  const ms = mapState(world, 'overworld');
  const mon = (level, aggro = true) => {
    const x = s.x + 2, y = s.y;
    const m = { id: 'tm' + Math.random(), sp: 'wolf', group: ['wolf'], table: 'outskirts', zone: 'outskirts', x, y, hx: x, hy: y, dir: 'down', vx: 0, vy: 0, t: 5000, state: 'wander', busy: false, stun: 0, speed: 1, aggro, level };
    ms.symbols.clear();
    ms.symbols.set(m.id, m);
    s.invuln = 0;
    moveSymbols(world, ms, 10, [s]);
    return m.state;
  };
  assert.equal(mon(3), 'chase', 'ふつうは おいかけてくる');
  // トヘロス
  let r = menu(bot, { action: 'cast', id: 'toheros', who: 'self', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.equal(c.mp, 50 - mpCost(c, 'toheros'));
  assert.equal(auraOf(s, world.now()), 'repel');
  assert.ok(s.repelUntil > world.now() + (REPEL_SECONDS - 2) * 1000);
  assert.equal(c.aura.kind, 'repel');
  assert.equal(mon(3), 'flee', '弱い 魔物は にげる');
  assert.equal(mon(c.level + 5), 'chase', '強い 魔物は 来る');
  assert.match(auraLabel(c.aura, world.now()), /トヘロス\nのこり2分/);
  // マモノヨセ（僧侶は 覚えない → 笛で）
  addItem(c, LURE_ITEM, 2);
  r = menu(bot, { action: 'useItem', id: LURE_ITEM, ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /魔物よけの力は消えた/);
  assert.equal(itemCount(c, LURE_ITEM), 1);
  assert.equal(auraOf(s, world.now()), 'lure');
  assert.equal(s.repelUntil, 0, 'トヘロスは 消える');
  assert.equal(c.aura.kind, 'lure');
  assert.equal(mon(3), 'chase', '弱い 魔物も 来る');
  assert.equal(mon(1, false), 'chase', 'ふだん おいかけない 魔物も 来る');
  // 遠くからでも 気づく
  const far = () => {
    const x = s.x + LURE.chase - 0.5, y = s.y;
    const m = { id: 'tf', sp: 'wolf', group: ['wolf'], table: 'outskirts', zone: 'outskirts', x, y, hx: x, hy: y, dir: 'down', vx: 0, vy: 0, t: 5000, state: 'wander', busy: false, stun: 0, speed: 1, aggro: true, level: 3 };
    ms.symbols.clear();
    ms.symbols.set(m.id, m);
    s.invuln = 0;
    moveSymbols(world, ms, 10, [s]);
    return m.state;
  };
  assert.equal(far(), 'chase');
  // 聖水を あとから 使うと 魔物よけ
  addItem(c, 'holy_water', 1);
  r = menu(bot, { action: 'useItem', id: 'holy_water', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /魔物よせの力は消えた/);
  assert.equal(auraOf(s, world.now()), 'repel');
  assert.equal(s.lureUntil, 0);
  assert.equal(far(), 'wander', '魔物よけの 時は 遠くの 魔物は 気づかない');
  // 切れる
  c.aura.until = world.now() - 1;
  assert.equal(auraLabel(c.aura, world.now()), '');
  // 戦いの 中では 使えない 呪文（戦いの 一覧に 出ない）
  assert.ok(ABILITIES.toheros.fieldOnly);
});

test('マモノヨセ: 魔物が 多く 出て、強い 組が 出やすい。地図の 上の しるし', async () => {
  const { world, bot, c } = await solo(7, 'jester');
  c.jobs.jester = { lv: 5, b: 0 };
  c.mp = 50;
  const s = bot.s;
  // 出てくる 数（ちいきの 数の 1.5倍まで）
  const count = (lure) => {
    const w2 = new GameWorld({ offline: true, rng: makeRng(70), rateLimit: false });
    const p = { x: FIELD.x, y: FIELD.y, night: false, lureUntil: lure ? Infinity : 0, repelUntil: 0 };
    const ms2 = mapState(w2, 'overworld');
    for (let i = 0; i < 1500; i++) spawnSymbols(w2, ms2, 1000, [p]);
    return ms2.symbols.size;
  };
  const base = Object.values(MAPS.overworld.spawnCounts).reduce((a, b) => a + b, 0);
  const n0 = count(false), n1 = count(true);
  assert.ok(n0 <= base + 2, `${n0} / ${base}`);
  assert.ok(n1 > n0 * 1.3, `魔物よせ ${n1} / ふつう ${n0}`);
  // 強い 組（経験値の 合計が 多い ほう）
  const power = (g) => g.reduce((a, sp) => a + (MONSTERS[sp]?.exp || 0), 0);
  let more = 0;
  for (let i = 0; i < 200; i++) {
    const g = rollGroup(world.rng, 'outskirts');
    const g2 = lureGroup(world, { sp: g[0], group: g, table: 'outskirts' });
    assert.ok(power(g2) >= power(g));
    if (power(g2) > power(g)) more++;
  }
  assert.ok(more > 30, `強く なった 回数 ${more}`);
  assert.deepEqual(lureGroup(world, { sp: 'kirakira', group: ['kirakira'], table: 'outskirts' }), ['kirakira'], 'にげる 魔物は そのまま');
  // 呪文で（遊び人 Lv5）
  const r = menu(bot, { action: 'cast', id: 'mamonoyose', who: 'self', ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.equal(auraOf(s, world.now()), 'lure');
  assert.match(auraLabel(c.aura, world.now()), /^マモノヨセ\nのこり2分$/);
  assert.match(auraLabel({ ...c.aura, until: world.now() + 30000 }, world.now()), /のこり30秒/);
  // 戦いでは 強い ほうの 組
  const g = ['pururin'];
  const sy = sym(g);
  const before = power(g);
  const ctx = startFieldBattle(world, s, sy);
  assert.ok(power(sy.group) >= before);
  assert.deepEqual(ctx.battle.enemies.map((e) => e.species).sort(), [...sy.group].sort());
  await winNow(world, bot, ctx);
  // セーブ・読みこみ: しるしは のこっても 時こくで 切れる（こわれない）
  const cc = repairChar(JSON.parse(JSON.stringify(c)));
  assert.equal(cc.aura.kind, 'lure');
});

test('トヘロス・マモノヨセ: 家族と いっしょ（同じ 場所の パーティーの 家族にも 効く。はなれた 家族には 効かない）', async () => {
  const { world, bots: [papa, yui, ken] } = await family(['パパ', 'ユイ', 'ケン'], 8);
  await join(papa, yui);
  await join(papa, ken);
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid), K = world.sessions.get(ken.sid);
  for (const x of [P, Y]) world.placeSession(x, 'overworld', FIELD.x, FIELD.y, 'down', true);
  world.placeSession(K, 'cave_b1', 10.5, 10.5, 'down', true);
  addItem(Y.char, LURE_ITEM, 1);
  const from = papa.msgs.length;
  const r = menu(yui, { action: 'useItem', id: LURE_ITEM, ref: 'self' });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /家族にも効く/);
  assert.equal(auraOf(Y, world.now()), 'lure');
  assert.equal(auraOf(P, world.now()), 'lure', 'いっしょの パパにも');
  assert.equal(P.char.aura.kind, 'lure');
  assert.equal(auraOf(K, world.now()), null, 'はなれた ケンには 効かない');
  assert.ok(papa.msgs.slice(from).some((m) => m.t === 'toast' && /ユイの魔物よせの笛/.test(m.text)));
  // パパの トヘロス（賢者）で 上書き
  P.char.job = 'sage';
  P.char.jobs.sage = { lv: 2, b: 0 };
  const r2 = menu(papa, { action: 'cast', id: 'toheros', who: 'self', ref: 'self' });
  assert.ok(r2.ok, r2.text);
  assert.equal(auraOf(Y, world.now()), 'repel');
  assert.equal(auraOf(P, world.now()), 'repel');
});

// ───────────── 4. ひみつのダンジョン ─────────────
async function sdHero(seed) {
  const { world, bots: [bot] } = await family(['ソラ'], seed);
  return { world, bot, c: world.data.characters[bot.char.id] };
}
const place = async (bot, map, x, y) => {
  bot.world.placeSession(bot.s, map, x, y, 'up', true);
  await bot.settle();
};
async function talkTo(bot, id) {
  const m = MAPS[bot.s.map];
  const n = m.npcs.find((x) => x.id === id);
  await place(bot, m.id, n.x + 0.5, n.y + (n.big ? 2.5 : 1.5));
  return bot.talk(id);
}
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}
async function goDown(bot) {
  const m = MAPS[bot.s.map];
  const d = m.sd.down || REST_DOWN;
  await place(bot, m.id, d.x + 0.5, d.y + 1.5);
  await stepOn(bot, d.x, d.y);
}

test('ひみつのダンジョン: 休み所で 記録して 地上へ → 案内人で その 階から 始める（ひとり）。記録の 板は いちばん 深い 階', { timeout: 60000 }, async () => {
  const { world, bot, c } = await sdHero(31);
  // 4階まで 来ている ちょうせん → 5階の 休み所へ
  c.sd = { best: 4, got: [], tries: 1, save: 0 };
  const m4 = MAPS.sd_4;
  await place(bot, 'sd_4', m4.sd.arrive.x, m4.sd.arrive.y);
  c.sd.run = { f: 4, took: [] };
  await goDown(bot);
  assert.equal(sdFloorOf(bot.s.map), 5);
  assert.equal(c.sd.best, 5);
  // 休み所の ようせい: この階を記録して地上へもどる
  let from = bot.msgs.length;
  answers(bot, [1, 0]);
  await talkTo(bot, 'sd_keeper');
  assert.ok(lastChoice(bot, from)[0][1].includes('この階を記録して地上へもどる'));
  assert.equal(bot.s.map, SD_GATE);
  assert.equal(c.sd.save, 5);
  assert.equal(c.sd.run, undefined);
  assert.ok(sayTexts(bot, from).some((t) => t.includes('地下5階を記録した')));
  // 案内人: ちょうせんを始める → 何階から（1階・5階）
  from = bot.msgs.length;
  answers(bot, [0, 1]);
  await talkTo(bot, 'sd_guide');
  const ch = lastChoice(bot, from);
  const pick = ch.find(([q]) => q.startsWith('何階から始める'));
  assert.ok(pick, ch.map((x) => x[0]).join('/'));
  assert.deepEqual(pick[1].length, 3);
  assert.match(pick[1][0], /地下1階から/);
  assert.match(pick[1][1], /地下5階の休み所から/);
  assert.equal(sdFloorOf(bot.s.map), 5);
  assert.deepEqual({ ...c.sd.run, seed: undefined }, { f: 5, took: [], seed: undefined }, 'とちゅうからでも ちょうせん中（記録に なる）');
  assert.ok(c.sd.run.seed > 0 && bot.s.map === sdFloorId(5, c.sd.run.seed), 'ちょうせんの seed（第32回）');
  assert.equal(c.sd.tries, 2);
  // 初めて 開ける 5階の 宝箱は 大きな ごほうび
  from = bot.msgs.length;
  await talkTo(bot, 'sd_chest');
  assert.ok(sayTexts(bot, from).some((t) => t.includes('初めて着いたごほうび')));
  // 下りると 記録が のびる（記録の 板）
  await goDown(bot);
  assert.equal(sdFloorOf(bot.s.map), 6);
  assert.equal(c.sd.best, 6);
  assert.equal(sdBoardRows(world.data.characters)[0].best, 6);
  // 下り階段（入口の 広間）でも 選べる
  await place(bot, SD_GATE, 4.5, 3.5);
  from = bot.msgs.length;
  answers(bot, [2]);
  const gate = MAPS[SD_GATE];
  const down = gate.triggers.find((t) => t.script === 'sd_enter');
  await place(bot, SD_GATE, down.x + 0.5, down.y + 1.5);
  await stepOn(bot, down.x, down.y);
  assert.equal(bot.s.map, SD_GATE, 'やめる');
  assert.ok(lastChoice(bot, from).some(([q, o]) => q.startsWith('何階から始める') && o.length === 3));
  // 深い 階で 記録しても 浅い 階で 記録しても、のこるのは 深い ほう
  noteSdSave(c, 20);
  noteSdSave(c, 10);
  assert.equal(sdSaveOf(c), 20);
  assert.deepEqual(sdStartFloors(sdSaveOf(c)), [1, 5, 10, 15, 20]);
  assert.match(sdStartText(20), /5〜20階/);
  assert.match(sdStartText(0), /地下1階から/);
});

test('ひみつのダンジョン: 家族で 入る ときは リーダーが 選ぶ。選べるのは 全員が 記録した 階まで。さそわれて 来た 人は 記録できない', { timeout: 120000 }, async () => {
  const { world, bots: [papa, yui, ken] } = await family(['パパ', 'ユイ', 'ケン'], 32);
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid), K = world.sessions.get(ken.sid);
  P.char.sd = { best: 22, got: [5, 10, 15, 20], tries: 3, save: 20 };
  Y.char.sd = { best: 12, got: [5, 10], tries: 2, save: 10 };
  await join(papa, yui);
  world.placeSession(P, SD_GATE, 4.5, 3.5, 'down', true);
  world.placeSession(Y, SD_GATE, 6.5, 8.5, 'down', true);
  await yui.settle();
  // ユイ（リーダーでない）: 1階だけ（リーダーが 選ぶ）
  let from = yui.msgs.length;
  answers(yui, [0, 1]);
  await talkTo(yui, 'sd_guide');
  const yq = lastChoice(yui, from).map(([q]) => q).join('/');
  assert.match(yq, /地下1階へ下りますか/);
  assert.match(yq, /リーダーが選ぶ/);
  assert.equal(Y.map, SD_GATE);
  // パパ（リーダー）: ユイが 記録した 10階まで
  world.placeSession(Y, SD_GATE, 6.5, 8.5, 'down', true);
  await yui.settle();
  from = papa.msgs.length;
  answers(papa, [0, 2]);
  await talkTo(papa, 'sd_guide');
  await yui.settle();
  const pick = lastChoice(papa, from).find(([q]) => q.startsWith('何階から始める'));
  assert.ok(pick);
  assert.equal(pick[1].length, 4, '1階・5階・10階・やめる');
  assert.match(pick[0], /ユイは地下10階/);
  assert.equal(sdFloorOf(P.map), 10);
  assert.equal(sdFloorOf(Y.map), 10, 'ユイも いっしょ');
  for (const x of [P, Y]) assert.deepEqual({ ...x.char.sd.run, seed: undefined }, { f: 10, took: [], seed: undefined });
  assert.equal(P.char.sd.run.seed, Y.char.sd.run.seed, 'いっしょに 入った 家族は おなじ seed（第32回）');
  assert.equal(P.map, Y.map);
  // 番人を たおして 11階へ → 2人とも 記録（ユイは 12階が 最高なので かわらない）
  await talkTo(papa, 'sd_guard');
  await yui.settle();
  assert.equal(sdFloorOf(P.map), 11);
  assert.equal(sdFloorOf(Y.map), 11);
  // 15階まで 下りる
  for (let f = 11; f < 15; f++) {
    await goDown(papa);
    await yui.settle();
  }
  assert.equal(sdFloorOf(P.map), 15);
  assert.equal(Y.char.sd.best, 15, 'とちゅうから 始めても いちばん 深い 階を 数える');
  assert.deepEqual(Y.char.sd.with, ['パパ']);
  // ケンが とちゅうから（さそわれて 来た）: 記録できない
  await join(papa, ken);
  assert.equal(sdFloorOf(K.map), 15);
  assert.ok(K.char.sd.run.mid);
  from = papa.msgs.length;
  answers(papa, [1, 0]);
  await talkTo(papa, 'sd_keeper');
  await yui.settle();
  await ken.settle();
  assert.equal(P.map, SD_GATE);
  assert.equal(Y.map, SD_GATE);
  assert.equal(K.map, SD_GATE);
  assert.equal(P.char.sd.save, 20, 'パパは 20階の 記録の まま（深い ほう）');
  assert.equal(Y.char.sd.save, 15, 'ユイは 15階を 記録');
  assert.equal(K.char.sd.save || 0, 0, 'さそわれて 来た ケンは 記録できない');
  const said = sayTexts(papa, from).join('\n');
  assert.match(said, /ケン: （とちゅうから来たので、記録できなかった）/);
  assert.match(said, /パパ: 地下15階を記録した！（記録は地下20階まであるよ）/);
  // 次は パパと ユイで 15階まで
  from = papa.msgs.length;
  answers(papa, [0, 3]);
  K.char.sd = { best: 0, got: [], tries: 0, save: 0 };
  ken.send({ t: 'party', action: 'leave' });
  await tickN(world, 3);
  await ken.settle();
  world.placeSession(Y, SD_GATE, 6.5, 8.5, 'down', true);
  await yui.settle();
  await talkTo(papa, 'sd_guide');
  await yui.settle();
  const pick2 = lastChoice(papa, from).find(([q]) => q.startsWith('何階から始める'));
  assert.equal(pick2[1].length, 5, '1・5・10・15・やめる');
  assert.equal(sdFloorOf(P.map), 15);
  assert.equal(sdFloorOf(Y.map), 15);
});

test('ひみつのダンジョン: 古い セーブ（記録した 階が ない）は 行けた 階までの 休み所から 始められる。データ合わせは 深い ほう', () => {
  const c = { id: 'x', name: 'むかし', level: 30, flags: {}, items: [], equip: {}, sd: { best: 23, at: 5, with: [], got: [5, 10], tries: 4 } };
  repairChar(c);
  assert.equal(c.sd.save, 20);
  assert.deepEqual(sdStartFloors(c.sd.save), [1, 5, 10, 15, 20]);
  const once = JSON.stringify(c.sd);
  repairChar(c);
  assert.equal(JSON.stringify(c.sd), once, '何回 ととのえても 同じ');
  const low = { sd: { best: 3, got: [], tries: 1 } };
  repairSecret(low);
  assert.equal(low.sd.save, 0);
  const bad = { sd: { best: 30, got: [], tries: 1, save: 'x' } };
  repairSecret(bad);
  assert.equal(bad.sd.save, 0);
  const odd = { sd: { best: 30, got: [], tries: 1, save: 17 } };
  repairSecret(odd);
  assert.equal(odd.sd.save, 15, '5の 倍数に');
  assert.equal(mergeSecret({ best: 5, save: 5 }, { best: 9, save: 5 }, { best: 12, save: 10 }).save, 10);
  assert.equal(mergeSecret(undefined, { best: 12 }, undefined).save, 10, 'かたほうが 古い 形');
  // 記録の ない セーブ・古い 版の セーブ
  const up = upgradeSave({ version: 3, characters: { a: { id: 'a', name: 'むかし', level: 3, flags: {}, items: [], equip: {} } } });
  assert.equal(up.data.characters.a.sd, undefined);
  assert.equal(sdSaveOf(up.data.characters.a), 0);
});

// ───────────── 文字 ─────────────
test('文字: 新しい 文に 使えない 漢字・スペースが ない', () => {
  const files = gameFiles();
  for (const f of ['public/js/shared/data/abilities-field27.js', 'public/js/shared/world/field27.js', 'public/js/shared/roster-sort.js']) {
    assert.ok(files.some((x) => x.endsWith(f)), f);
  }
  for (const f of files.filter((x) => /field27|roster-sort|secret|wagon|services|transfer/.test(x))) {
    const bad = checkFile(f).filter((x) => x.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
});
