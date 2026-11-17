// 第88回 G3班: まぼろしの回ろう（ライバルの まぼろし。docs/plan-r88-anime-gear.md の 7-1）
//   データ・場所（星の神殿の 階段 → 回ろう → とびら）・とびらは 作品の 品を 3つで 開く・順番・勝つと 品（2回めは もらわない）・
//   家族も いっしょ・負けても お金は へらない・ライバルは 大技を 1回（前ぶれ → 身を 守ると たえられる）・セーブと 引っこし・しおり・番人の 案内
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, effectiveTile } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { T } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import {
  RIVAL_DOORS, RIVALS, RIVAL_BY_ID, DOOR_NEED, rivalsOf, rivalOpen, rivalWon, nextRival, rivalTier, rivalEnc, sigId, sigChargeId, doorFlag,
  repairRivals, mergeRivals, RIVAL_GOLD_PER_LV,
} from '../public/js/shared/data/rivals-r88.js';
import { workOwned, doorOpen, refreshDoorFlags, rivalPaper, rivalButtons, rivalTrack } from '../public/js/shared/rivals-r88.js';
import { HALL_ID, HALL_STAIRS, hallLayout, doorFront, roomId } from '../public/js/shared/maps/rivals-r88.js';
import { setupRivalPhantom } from '../public/js/shared/battle-rival-r88.js';
import { rivalSigEffect } from '../public/js/shared/battle-rival-fx-r88.js';
import { giveRivalRewards } from '../public/js/shared/world/rivals-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { shioriOf, TRACK_IDS } from '../public/js/shared/world/shiori.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const lastChoice = (bot, from = 0) => {
  for (const m of bot.msgs.slice(from).reverse()) {
    if (m.t !== 'script') continue;
    const st = m.steps.find((s) => s[0] === 'choice');
    if (st) return st;
  }
  return null;
};
const YAIBA_DOOR = () => hallLayout().doors.find((d) => d.work === 'yaiba');

function choices(bot, list) {
  const q = [...list];
  Object.defineProperty(bot, 'choice', { configurable: true, get: () => (q.length ? q.shift() : 0), set: () => {} });
}

// 戦いを すすめる（how(ctx) が 'lose' なら 負け・ほかは 勝ち。test/job-trials.test.js と おなじ）
async function play(bot, { how = () => 'win', others = [], max = 20000 } = {}) {
  const world = bot.world;
  const fought = [];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      const b = c2.battle;
      fought.push({ id: c2.opts.fixed, sids: c2.sids.slice(), enemies: b.enemies.map((e) => ({ ...e })), bg: c2.opts.bg, b });
      if (how(c2) === 'lose') {
        for (const a of b.allies) if (a.alive) b.kill(a);
      } else {
        for (const e of b.enemies) if (e.alive) b.kill(e);
      }
      b.checkEnd();
    }
    for (const x of [bot, ...others]) x.flushQueue();
    await tickN(world, 1);
    for (const x of [bot, ...others]) x.flushQueue();
    const idle = (x) => !x.s.busy && !x.queue.length && !x.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const x of [bot, ...others]) x.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return fought;
    }
  }
  throw new Error('終わらない');
}

async function setup(seed = 1, { name = 'ソラ', world = null, job = 'hero' } = {}) {
  const w = world || new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(w, name);
  await bot.login(world ? 'x' : '');
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = w.data.characters[bot.char.id];
  gainExp(c, expForLevel(60) - c.exp);
  c.job = job;
  c.jobs[job] = { lv: 10, b: jobBattlesForLevel(10, JOBS[job].tier) };
  fullHeal(c);
  c.gold = 5000;
  bot.s.repelUntil = 1e15;
  return { world: w, bot, c };
}
// YAIBA の 品を 3つ（ふくろ・預かり所・装備）
function giveYaiba(c) {
  c.items.push({ id: 'r88_bokuto', n: 1 });
  c.bank = { gold: 0, items: [{ id: 'r88_oni_horn', n: 1 }] };
  c.equip.acc = 'r88_eyepatch';
}
async function toHall(bot, work = 'yaiba') {
  const f = doorFront(work);
  bot.world.placeSession(bot.s, HALL_ID, f.x, f.y, 'up', true);
  bot.world.sendSelf(bot.s);
  await bot.settle();
}
const examine = (bot, work = 'yaiba') => {
  const d = hallLayout().doors.find((x) => x.work === work);
  bot.send({ t: 'interact', kind: 'tile', x: d.x, y: d.y });
};

// ───────────── データ ─────────────
test('データ: とびらは 作品ごと（ほう神演義・YAIBA）。ライバルは 作品の 中で じゅん番。ごほうびの 品・大技・まぼろしが ある', () => {
  assert.deepEqual(RIVAL_DOORS.map((d) => d.work), ['houshin', 'yaiba']);
  for (const d of RIVAL_DOORS) {
    assert.ok(WORKS[d.work], d.work);
    const list = rivalsOf(d.work);
    assert.ok(list.length >= 5, d.work);
    assert.deepEqual(list.map((r) => r.n), list.map((_, i) => i + 1), `${d.work}: 1から じゅんに`);
    // 強さは 3だん（60・80・100）。さいごの 人が いちばん 強い
    assert.equal(rivalTier(list[list.length - 1].lv), 100, `${d.work}: さいごは Lv100 ごろ`);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv, `${d.work}: 後の 人ほど 強い`);
  }
  // ほう神演義: ちょう公明 → だっき → 聞仲 → 三人の大せん人 → 申公ひょう（雷公べん）。太極図は 出さない
  assert.deepEqual(rivalsOf('houshin').map((r) => r.reward), [['r88_kinkosen'], ['r88_keisei'], ['r88_kinben'], ['r88_banko', 'r88_rokkon'], ['r88_raikoben']]);
  assert.ok(!RIVALS.some((r) => r.reward.includes('r88_taikyoku')), '太極図は 主人公の 品');
  // YAIBA: さいごは おに丸（おにの王）→ 魔王剣・その 前の おに丸 → 風神剣・小次ろう → 物ほしざお
  const y = rivalsOf('yaiba');
  assert.deepEqual(y[y.length - 1].reward, ['r88_maou_sword']);
  assert.deepEqual(RIVAL_BY_ID.y_oni.reward, ['r88_fujin_sword']);
  assert.deepEqual(RIVAL_BY_ID.y_kojiro.reward, ['r88_monohoshi']);
  for (const rv of RIVALS) {
    for (const id of rv.reward) {
      assert.ok(ITEMS[id], `${rv.id}: ${id}`);
      assert.equal(ITEMS[id].work, rv.work, `${rv.id}: ${id} は その 作品の 品`);
    }
    assert.equal(ITEMS[rv.use]?.work, rv.work, `${rv.id}: 使う 品`);
    for (const m of rv.members || [rv]) assert.ok(JOBS[m.job], `${rv.id}: 借りる 職業 ${m.job}`);
    assert.ok(rv.words && rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
    // 戦い・まぼろし・大技
    const enc = FIXED_ENCOUNTERS[rivalEnc(rv.id)];
    assert.ok(enc && enc.loseOk && !enc.canFlee && enc.boss, rv.id);
    assert.ok(MONSTERS[enc.group[0][0]], rv.id);
    assert.equal(enc.group[0][1], (rv.members || [rv]).length);
    assert.equal(ABILITIES[sigChargeId(rv.id)].effect.type, 'telegraph');
    assert.equal(ABILITIES[sigChargeId(rv.id)].effect.next, sigId(rv.id));
    assert.equal(ABILITIES[sigId(rv.id)].effect.type, 'r88Rival');
  }
  // 戦いの 背景: ほう神演義は 雲の上・YAIBA は 和風に 近い 物（今 ある 背景）
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('h_chou')].bg, 'kumoi');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('y_goemon')].bg, 'hoshiyomi');
  // まぼろしは 図鑑・魔物の 数に 出ない
  assert.ok(!Object.keys(MONSTERS).some((k) => k.startsWith('rival_phantom')));
});

test('データ: 名前・文は 使える 漢字だけ（新しい ファイルは gameFiles に ある）', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['shared/data/rivals-r88.js', 'shared/world/rivals-r88.js', 'shared/maps/rivals-r88.js', 'shared/rivals-r88.js', 'client/ui/rivals-r88.js', 'shared/battle-rival-r88.js']) {
    const full = files.find((x) => x.endsWith(f));
    assert.ok(full, f);
    const r = checkFile(full);
    assert.equal((r.bad || r.kanji || []).length || 0, 0, `${f}: ${JSON.stringify(r).slice(0, 300)}`);
  }
});

// ───────────── 場所 ─────────────
test('場所: 星の神殿の 試練の番人の となりに 下り階段 → 回ろう（とびらと 作品の しるし）・とびらの 中の 部屋', () => {
  const ow = MAPS.overworld;
  assert.equal(HALL_STAIRS.x, PLACES.town.x + 28);
  assert.equal(HALL_STAIRS.y, PLACES.town.y + 7);
  const keeper = ow.npcs.find((n) => n.id === 'trial_keeper');
  assert.equal(Math.abs(keeper.x - HALL_STAIRS.x) + Math.abs(keeper.y - HALL_STAIRS.y), 1, '番人の となり');
  assert.equal(ow.tiles[HALL_STAIRS.y * ow.w + HALL_STAIRS.x], T.STAIRS_DOWN);
  const warp = ow.warps.find((w) => w.x === HALL_STAIRS.x && w.y === HALL_STAIRS.y);
  assert.equal(warp.to.map, HALL_ID);
  const hall = MAPS[HALL_ID];
  assert.equal(hall.name, 'まぼろしの回ろう');
  assert.ok(hall.warps.some((w) => w.to.map === 'overworld'), '階段で もどれる');
  const L = hallLayout();
  assert.equal(L.doors.length, RIVAL_DOORS.length, 'とびらは データから ならぶ');
  for (const d of L.doors) {
    assert.equal(hall.tiles[d.y * hall.w + d.x], T.STAR_DOOR);
    assert.ok(hall.actions.some((a) => a.x === d.x && a.y === d.y && SCRIPTS[a.script]), `${d.work}: 調べる`);
    assert.ok(hall.boards.some((b) => b.x === d.x && b.y === d.y - 1 && b.kind === d.mark), `${d.work}: とびらの 上の しるし`);
    const gate = hall.gates.find((g) => g.flag === doorFlag(d.work));
    assert.ok(gate, `${d.work}: 光る わ`);
    assert.equal(effectiveTile(hall, gate.x, gate.y, () => false), T.WARP_RING_OFF, '開かない とびらは 光って いない');
    assert.equal(effectiveTile(hall, gate.x, gate.y, () => true), T.WARP_RING, '開くと 光る');
    // とびらの 中の 部屋（1つの 形を 使い回す）
    const room = MAPS[roomId(d.work)];
    assert.ok(room && room.w === MAPS[roomId(L.doors[0].work)].w, d.work);
    assert.ok(room.warps.some((w) => w.to.map === HALL_ID), '部屋から 出られる');
  }
  // 作品が ふえても 回ろうが のびるだけ
  assert.ok(hallLayout(8).w > L.w);
});

test('場所: 町の 階段を おりると 回ろうへ。入ると とびらの 光が 持ち物に 合う', async () => {
  const { world, bot, c } = await setup(3);
  giveYaiba(c);
  world.placeSession(bot.s, 'overworld', HALL_STAIRS.x + 0.5, HALL_STAIRS.y + 1.6, 'up', true);
  await bot.settle();
  world.onEnterTile(bot.s, HALL_STAIRS.x, HALL_STAIRS.y);
  await bot.settle();
  assert.equal(bot.s.map, HALL_ID);
  assert.equal(c.flags[doorFlag('yaiba')], true, 'YAIBA の とびらが 光る');
  assert.ok(!c.flags[doorFlag('houshin')], 'ほう神演義の とびらは 光らない');
  assert.equal(bot.char.flags[doorFlag('yaiba')], true, '画面にも とどく');
});

// ───────────── とびらが 開く ─────────────
test('とびら: その 作品の 品を 3つ（ふくろ・預かり所・装備。同じ 品は 1つ）で 開く。職業は 問わない', () => {
  const c = newCharacter({ id: 'a', name: 'ア', job: 'warrior', look: {} });
  assert.equal(workOwned(c, 'yaiba'), 0);
  c.items.push({ id: 'r88_bokuto', n: 3 });
  c.items.push({ id: 'r88_raikoben', n: 1 });
  assert.equal(workOwned(c, 'yaiba'), 1, '同じ 品は 1つ・ほかの 作品は 数えない');
  c.bank = { gold: 0, items: [{ id: 'r88_bokuto', n: 1 }, { id: 'r88_oni_horn', n: 1 }] };
  assert.equal(workOwned(c, 'yaiba'), 2, '預かり所も 数える');
  assert.equal(doorOpen(c, 'yaiba'), false);
  c.equip.acc = 'r88_eyepatch';
  assert.equal(workOwned(c, 'yaiba'), DOOR_NEED, '装備も 数える');
  assert.equal(doorOpen(c, 'yaiba'), true);
  assert.equal(refreshDoorFlags(c), true);
  assert.equal(c.flags[doorFlag('yaiba')], true);
  assert.equal(refreshDoorFlags(c), false, 'かわらない ときは false');
  c.equip.acc = null;
  refreshDoorFlags(c);
  assert.ok(!c.flags[doorFlag('yaiba')], '品が へると 光が 消える');
});

test('とびら: 開かない とびらを 調べると「○○の品を、あと△つ集めると開く」・開くと まど（ライバルの ならび・もらえる 品）', async () => {
  const { bot, c } = await setup(5);
  c.items.push({ id: 'r88_bokuto', n: 1 });
  await toHall(bot);
  let from = bot.msgs.length;
  examine(bot);
  await play(bot);
  assert.ok(said(bot, 'YAIBAの品を、あと2つ集めると開く', from));
  assert.ok(said(bot, '光っていない', from));
  assert.equal(lastChoice(bot, from), null, 'まどは 出ない');
  // 3つ そろえると 開く
  giveYaiba(c);
  from = bot.msgs.length;
  choices(bot, [2]); // やめる
  examine(bot);
  await play(bot);
  assert.ok(said(bot, 'かがやき始めた', from), 'はじめて 開いた ときは 光る');
  const ch = lastChoice(bot, from);
  assert.ok(ch, 'まど');
  const paper = ch[4];
  assert.equal(paper.kind, 'rival');
  assert.equal(paper.workName, 'YAIBA');
  assert.equal(paper.rivals.length, rivalsOf('yaiba').length);
  assert.deepEqual(paper.rivals.map((r) => r.state), ['next', ...rivalsOf('yaiba').slice(1).map(() => 'lock')]);
  assert.deepEqual(paper.rivals[0].rewards.map((r) => r.id), RIVAL_BY_ID.y_hakki.reward);
  assert.deepEqual(ch[2], ['八おにと戦う', 'やめる']);
  assert.ok(!bot.s.busy);
});

// ───────────── 順番・勝つ・2回め ─────────────
test('順番: 前の 人に 勝つと 次の 人に ちょうせん できる。勝った 人には 何回でも', () => {
  const c = newCharacter({ id: 'a', name: 'ア', job: 'warrior', look: {} });
  const [a, b, d] = rivalsOf('yaiba');
  assert.equal(rivalOpen(c, a.id), true);
  assert.equal(rivalOpen(c, b.id), false);
  assert.equal(nextRival(c, 'yaiba').id, a.id);
  giveRivalRewards([c], a);
  assert.equal(rivalWon(c, a.id), true);
  assert.equal(rivalOpen(c, b.id), true);
  assert.equal(rivalOpen(c, d.id), false);
  assert.equal(nextRival(c, 'yaiba').id, b.id);
  const p = rivalPaper(c, 'yaiba');
  assert.deepEqual(p.rivals.slice(0, 3).map((r) => r.state), ['won', 'next', 'lock']);
  assert.equal(p.rivals[2].name, d.name);
  assert.deepEqual(rivalButtons(p).map((x) => x.id), [b.id, a.id], 'つぎの 人が 先。勝った 人とも 戦える');
});

test('勝つと 品を もらう（3つ くれる 人は 3つ）。2回めは もらわない（かわりに 少しの お金）', async () => {
  const { bot, c } = await setup(7);
  giveYaiba(c);
  await toHall(bot);
  let from = bot.msgs.length;
  choices(bot, [0]);
  examine(bot);
  let fought = await play(bot);
  assert.equal(fought.length, 1);
  assert.equal(fought[0].id, rivalEnc('y_hakki'));
  assert.equal(fought[0].bg, 'hoshiyomi');
  assert.deepEqual(fought[0].enemies.map((e) => e.name), ['バットマン', 'へび男', 'カエル男']);
  assert.ok(fought[0].enemies.every((e) => e.mirrorOf === 'rival'));
  assert.deepEqual(fought[0].enemies.map((e) => e.job), ['black_org', 'dragon_knight', 'kinniku_kappa'], '今 ある 職業の 技を 借りる');
  for (const id of RIVAL_BY_ID.y_hakki.reward) assert.equal(c.items.find((e) => e.id === id)?.n, 1, id);
  assert.equal(rivalWon(c, 'y_hakki'), true);
  assert.ok(said(bot, '八おにのまぼろしに勝った', from));
  assert.ok(said(bot, '西洋サーベルを手に入れた', from));
  assert.equal(bot.s.map, HALL_ID, '回ろうに もどる');
  assert.ok(Math.hypot(bot.s.x - doorFront('yaiba').x, bot.s.y - doorFront('yaiba').y) < 1.5, 'とびらの 前');
  assert.ok(!bot.s.busy);
  // もう一度 八おに（ボタンは つぎの 人が 先 → 2つめ）
  const gold = c.gold;
  from = bot.msgs.length;
  choices(bot, [1]);
  examine(bot);
  fought = await play(bot);
  assert.equal(fought[0].id, rivalEnc('y_hakki'));
  for (const id of RIVAL_BY_ID.y_hakki.reward) assert.equal(c.items.find((e) => e.id === id)?.n, 1, `${id}: 2回めは もらわない`);
  assert.equal(c.gold, gold + RIVAL_BY_ID.y_hakki.reward.length * RIVAL_BY_ID.y_hakki.lv * RIVAL_GOLD_PER_LV, 'かわりに お金');
  assert.ok(said(bot, 'もう持っている', from));
});

test('負けても お金は へらない・回ろうで 立ち上がる。何回でも ちょうせん できる', async () => {
  const { bot, c } = await setup(9);
  giveYaiba(c);
  await toHall(bot);
  const gold = c.gold;
  const from = bot.msgs.length;
  choices(bot, [0]);
  examine(bot);
  const fought = await play(bot, { how: () => 'lose' });
  assert.equal(fought.length, 1);
  assert.equal(c.gold, gold, 'お金は へらない');
  assert.ok(c.hp > 0);
  assert.equal(rivalWon(c, 'y_hakki'), false);
  assert.ok(!c.items.some((e) => e.id === 'r88_saber'));
  assert.ok(said(bot, 'お金はへっていない', from));
  assert.equal(bot.s.map, HALL_ID);
  // もう一度
  choices(bot, [0]);
  examine(bot);
  await play(bot);
  assert.equal(rivalWon(c, 'y_hakki'), true);
});

test('家族: そばに いる 家族も いっしょに 入る。勝つと 戦った 家族 ぜんいんが 品を 1つずつ・記録は 1人ずつ', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(41), checkPassword: () => true, rateLimit: false });
  const a = await setup(0, { name: 'パパ', world });
  const y = await setup(0, { name: 'ユイ', world, job: 'daikenja' });
  const papa = a.bot, yui = y.bot, P = a.c, Y = y.c;
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  giveYaiba(P);
  // ユイは 前から 西洋サーベルを 持って いる（とびらは 開いて いない）
  Y.items.push({ id: 'r88_saber', n: 1 });
  await toHall(papa);
  const f = doorFront('yaiba');
  world.placeSession(yui.s, HALL_ID, f.x + 1, f.y, 'up', true);
  await yui.settle();
  const yGold = Y.gold;
  const from = yui.msgs.length;
  choices(papa, [0]);
  examine(papa);
  const fought = await play(papa, { others: [yui] });
  assert.equal(fought.length, 1);
  assert.ok(fought[0].sids.includes(yui.s.id), 'ユイも いっしょに 戦う');
  assert.equal(yui.s.map, HALL_ID);
  assert.equal(rivalWon(P, 'y_hakki'), true);
  assert.equal(rivalWon(Y, 'y_hakki'), true, 'ユイの 記録も');
  for (const id of RIVAL_BY_ID.y_hakki.reward) {
    assert.equal(P.items.find((e) => e.id === id)?.n, 1, `パパ ${id}`);
    assert.equal(Y.items.find((e) => e.id === id)?.n, 1, `ユイ ${id}`);
  }
  assert.equal(Y.gold, yGold + RIVAL_BY_ID.y_hakki.lv * RIVAL_GOLD_PER_LV, '持って いた 品は お金に');
  assert.ok(said(yui, 'ユイもいっしょに来てくれた', from) || said(papa, 'ユイも、いっしょに来てくれた') || said(yui, 'ユイも、いっしょに来てくれた', from));
  assert.ok(!papa.s.busy && !yui.s.busy, '2人とも うごける');
});

// ───────────── 戦い（大技を 1回） ─────────────
function rivalBattle(id, seed = 1) {
  const chars = ['hero', 'god_hand'].map((job, i) => {
    const c = newCharacter({ id: `p${i}`, name: `p${i}`, job: 'warrior', look: {} });
    gainExp(c, expForLevel(60));
    c.job = job;
    c.jobs[job] = { lv: 10, b: 999 };
    fullHeal(c);
    return c;
  });
  const enc = FIXED_ENCOUNTERS[rivalEnc(id)];
  const b = new Battle({
    rng: makeRng(seed), boss: true, canFlee: false,
    allies: chars.map((char) => ({ char, kind: 'support', controller: 'sim', auto: true, tactics: 'balanced' })),
    enemies: enc.group.flatMap(([sp, k]) => Array(k).fill(sp)),
  });
  return b;
}

test('戦い: ライバルは 借りた 職業の 技 ＋ 自分の 品の 大技を 1回（前ぶれの つぎの 番）', () => {
  const b = rivalBattle('h_shinkou');
  const [m] = setupRivalPhantom(b, RIVAL_BY_ID.h_shinkou);
  assert.equal(m.name, '申公ひょう');
  assert.equal(m.job, 'summoner');
  assert.equal(m.lv, 100);
  assert.ok(m.abilities.length > 0, '職業の 技');
  assert.equal(m.look.hcol, 'white', '見た目は ライバルの 色');
  // 家族は たおれない ように（大技を 何回 使うか 見る）
  for (const a of b.allies) a.hp = 9e6; // 大技は 最大HPの わりあいなので、HPだけ 多く
  m.maxHp = m.hp = 9e7;
  m.hp = Math.round(m.maxHp * 0.5);
  const order = [];
  for (let t = 0; t < 8 * 60 * 1000 && !b.over; t += 50) {
    for (const ev of b.tick(50)) if (ev.t === 'act' && ev.id === m.id) order.push(ev.ability || 'attack');
  }
  const sig = order.filter((x) => x === sigId('h_shinkou')).length;
  const charge = order.filter((x) => x === sigChargeId('h_shinkou')).length;
  assert.equal(charge, 1, `前ぶれは 1回 ${order.join(',')}`);
  assert.equal(sig, 1, '大技は 1回');
  const i = order.indexOf(sigChargeId('h_shinkou'));
  assert.equal(order[i + 1], sigId('h_shinkou'), '前ぶれの つぎの 番に 大技');
  assert.ok(order.filter((x) => !/^r88r_/.test(x)).length > 4, `ほかの 番は ふつうの 攻撃と 職業の 技 ${order.join(',')}`);
});

test('戦い: 大技は 身を 守ると たえられる（最大HPの わりあい）・何人かの ライバルは 1人めだけ 大技', () => {
  const b = rivalBattle('y_hakki');
  const ms = setupRivalPhantom(b, RIVAL_BY_ID.y_hakki);
  assert.equal(ms.length, 3);
  assert.ok(ms[0].rivalSig && !ms[1].rivalSig && !ms[2].rivalSig);
  assert.ok(ms[1].maxHp < ms[0].maxHp * 1.5, '1人ぶんは 弱め');
  const [x, y] = b.allies;
  x.defending = true;
  y.defending = false;
  const a = ABILITIES[sigId('y_hakki')];
  const ev = { lines: [], upd: [], results: [] };
  rivalSigEffect(b, ms[0], a, a.effect, ev, [x, y]);
  const dx = ev.results.find((r) => r.id === x.id).dmg, dy = ev.results.find((r) => r.id === y.id).dmg;
  assert.ok(dx < x.maxHp * 0.55 && dx > x.maxHp * 0.3, `守った 人 ${dx}/${x.maxHp}`);
  assert.ok(!y.alive || dy >= y.maxHp, `守らない 人は たおれる ${dy}/${y.maxHp}`);
  assert.ok(x.alive);
});

test('戦い: その 作品の 職業の 家族が いると ひとことが かわる', () => {
  const b = rivalBattle('y_goemon');
  b.allies[0].job = 'yaiba';
  const evs = [];
  const emit = b.emit.bind(b);
  b.emit = (e) => { evs.push(e); return emit(e); };
  setupRivalPhantom(b, RIVAL_BY_ID.y_goemon);
  assert.ok(JSON.stringify(evs).includes('同じ道を行く者'));
});

// ───────────── セーブ・引っこし ─────────────
test('セーブ: 勝った 記録は 1人ずつ（rivals）。ととのえる・家族の セーブを 合わせる・引っこしコードで 運べる', () => {
  const c = newCharacter({ id: 'u1', name: 'ユイ', job: 'warrior', look: {} });
  giveRivalRewards([c], RIVAL_BY_ID.y_hakki);
  giveRivalRewards([c], RIVAL_BY_ID.h_chou);
  assert.deepEqual(c.rivals, { y_hakki: 1, h_chou: 1 });
  // ととのえる（こわれた 形・知らない id は のこす〈あとで 足す 作品〉）
  const r = repairChar(JSON.parse(JSON.stringify({ ...c, rivals: { y_hakki: 1, s_naga: true, 'bad key!': 1 } })));
  assert.deepEqual(r.rivals, { y_hakki: 1, s_naga: 1 });
  assert.equal(repairChar(JSON.parse(JSON.stringify({ ...c, rivals: [1, 2] }))).rivals, undefined);
  const plain = newCharacter({ id: 'u2', name: 'パパ', job: 'warrior', look: {} });
  assert.equal(repairChar(JSON.parse(JSON.stringify(plain))).rivals, undefined, 'ない 人には 足さない');
  // 合わせる（どちらかで 勝って いれば 勝った）
  assert.deepEqual(mergeRivals(undefined, { a: 1 }, { b: 1 }), { a: 1, b: 1 });
  const base = JSON.parse(JSON.stringify(c));
  const ours = JSON.parse(JSON.stringify(c));
  const theirs = JSON.parse(JSON.stringify(c));
  ours.rivals.y_goemon = 1;
  theirs.rivals.h_dakki = 1;
  const m = mergeChars(base, ours, theirs);
  assert.deepEqual(Object.keys(m.rivals).sort(), ['h_chou', 'h_dakki', 'y_goemon', 'y_hakki']);
  // 引っこしコード
  const code = exportCode(c);
  const back = parseCode(code);
  assert.ok(back.ok, back.reason);
  assert.deepEqual(back.char.rivals, { y_hakki: 1, h_chou: 1 });
  for (const id of RIVAL_BY_ID.y_hakki.reward) assert.ok(back.char.items.some((e) => e.id === id), id);
});

// ───────────── しおり・番人 ─────────────
test('しおり: まぼろしの回ろうの 1行（品を 持つと 出る）。ちょうせん できる 時は おすすめ', () => {
  const c = newCharacter({ id: 'a', name: 'ア', job: 'warrior', look: {} });
  assert.equal(rivalTrack(c), null, '何も 知らない 人には 出さない');
  assert.ok(TRACK_IDS.includes('rival'));
  c.items.push({ id: 'r88_bokuto', n: 1 });
  const t = rivalTrack(c);
  assert.ok(t.note.includes('星の神殿に、まぼろしの回ろうがある'));
  assert.equal(t.items.length, RIVAL_DOORS.length);
  assert.ok(t.items.find((x) => x.name === 'YAIBAのとびら').where.includes('あと2つ'));
  giveYaiba(c);
  const s = shioriOf(c);
  assert.ok(s.tracks.some((x) => x.id === 'rival'));
  const sc = shioriOf({ ...c, flags: { ...c.flags, p_attack: true, c1_clear: true, c2_clear: true, c3_clear: true, c4_clear: true, c5_clear: true, c6_clear: true, c7_clear: true, c8_clear: true } });
  assert.ok(sc.recs.some((r) => r.go === 'rival') || sc.recs.length >= 3, JSON.stringify(sc.recs));
});

test('試練の番人: 回ろうの 案内を はじめの 1回だけ（今の 試練の 話は そのまま）', async () => {
  const { world, bot, c } = await setup(11);
  const KEEPER = { x: PLACES.town.x + 27, y: PLACES.town.y + 7 };
  world.placeSession(bot.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 1.5, 'up', true);
  await bot.settle();
  let from = bot.msgs.length;
  choices(bot, [1]);
  bot.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  await play(bot);
  assert.ok(said(bot, 'わしは試練の番人', from), '試練の 話は そのまま');
  assert.ok(said(bot, 'まぼろしの回ろう', from));
  assert.equal(c.flags.r88hall_seen, true);
  from = bot.msgs.length;
  choices(bot, [1]);
  bot.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  await play(bot);
  assert.ok(!said(bot, 'となりの階段の下', from), '2回めは 言わない');
});
