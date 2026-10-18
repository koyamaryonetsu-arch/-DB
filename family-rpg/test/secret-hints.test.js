// 第35回 B: かくし要素の ヒント（町の 人・本だな・宝箱の メモ・仲間の「はなす」）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_HINTS, SHELF_HINTS, MEMO_HINTS, PARTY_HINTS, PARTY_EVERY, MEMO_RATE, applyTownHints, shelfHint, chestMemo, nextPartyHint } from '../public/js/shared/data/secret-hints.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { MAPS, searchLoot } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { REBIRTH_START } from '../public/js/shared/data/items-alchemy.js';
import { memberTalk, objectiveChapter } from '../public/js/shared/data/party-talk.js';
import { CH4_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch4.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const ctx = (flags = {}) => ({ name: 'ソラ', flag: (f) => !!flags[f], has: () => false, count: () => 0, kills: () => 0, quest: () => null, char: { flags } });
const npcsWith = (script) => Object.values(MAPS).flatMap((m) => (m.npcs || []).filter((n) => n.script === script));
const allText = () => [...TOWN_HINTS, ...Object.values(SHELF_HINTS).flat(), ...Object.values(MEMO_HINTS).flat(), ...PARTY_HINTS].map((h) => h.text);

test('町の 人: 第1〜5章に 3つ以上ずつ。いる 人の だいほんの さいごに 1行（話すだけの 人）', () => {
  for (let ch = 1; ch <= 5; ch++) assert.ok(TOWN_HINTS.filter((h) => h.ch === ch).length >= 3, `第${ch}章`);
  assert.equal(new Set(TOWN_HINTS.map((h) => h.script)).size, TOWN_HINTS.length, '1人に 1つ');
  for (const h of TOWN_HINTS) {
    assert.ok(npcsWith(h.script).length, `${h.script}: 町に いる`);
    const steps = SCRIPTS[h.script](ctx());
    assert.deepEqual(steps.at(-1).slice(2), [h.text], `${h.script}: さいごに ヒント`);
    assert.equal(steps.filter((st) => st[2] === h.text).length, 1, '1回だけ');
    assert.ok(steps.every((st) => st[0] === 'say'), '話すだけ');
  }
  // なんど よんでも 2回 足さない
  applyTownHints(SCRIPTS);
  const h = TOWN_HINTS[0];
  assert.equal(SCRIPTS[h.script](ctx()).filter((st) => st[2] === h.text).length, 1);
  // 買い物・えらぶ などが ある だいほんには 足さない
  const S2 = { a: () => [['say', 'x', 'こんにちは'], ['shop', 'y']] };
  const hint0 = { ...TOWN_HINTS[0] };
  TOWN_HINTS.push({ ...hint0, script: 'a' });
  try {
    applyTownHints(S2);
    assert.deepEqual(S2.a(), [['say', 'x', 'こんにちは'], ['shop', 'y']]);
  } finally {
    TOWN_HINTS.pop();
  }
});

test('ヒントの 中み: 職業・れん金・生まれ変わり・配合が ぜんぶ ある。生まれ変わりの 5つの もとの 武器に それぞれ ヒント', () => {
  for (const kind of ['job', 'alchemy', 'reborn', 'breed']) assert.ok(TOWN_HINTS.some((h) => h.kind === kind), kind);
  for (const x of REBIRTH_START) {
    const name = ITEMS[x.from].name;
    assert.ok(TOWN_HINTS.some((h) => h.kind === 'reborn' && h.about.startsWith(name)), `${name} の 町の ヒント`);
  }
  // 答えを そのまま 言わない（「れん金がま」と「材料 ぜんぶの 名前」を 1つの 文で 言わない）
  for (const x of REBIRTH_START) {
    const names = [x.from, x.mat, 'star_shard'].map((id) => ITEMS[id].name);
    for (const t of allText()) assert.ok(!names.every((n) => t.includes(n)) || !t.includes('れん金がま'), t);
  }
  // ネタバレ（第5章の 物語）に ふれない
  for (const t of allText()) assert.ok(!/ノクト|ソリトゥス/.test(t), t);
});

test('本だな: 本だなの ある マップだけ。同じ 本だなは いつも 同じ 本。物が 入っていない 本だな・調べた あとで 読める', async () => {
  for (const [mid, list] of Object.entries(SHELF_HINTS)) {
    const m = MAPS[mid];
    assert.ok(m, mid);
    assert.ok(list.length, mid);
    let n = 0;
    for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.BOOKSHELF) n++;
    assert.ok(n > 0, `${mid} に 本だな`);
  }
  assert.equal(shelfHint('overworld', 37, 25), shelfHint('overworld', 37, 25));
  assert.equal(shelfHint('cave_b1', 1, 1), null);
  // 物が 入っていない 本だな（ホシフル村 37,25）
  assert.equal(MAPS.overworld.tiles[25 * MAPS.overworld.w + 37], T.BOOKSHELF);
  assert.ok(!searchLoot('overworld', 37, 25));
  const world = new GameWorld({ offline: true, rng: makeRng(35), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const says = () => bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]);
  world.searchTile(bot.s, 37, 25, T.BOOKSHELF);
  await bot.settle();
  assert.ok(says().includes(shelfHint(bot.s.map, 37, 25)), JSON.stringify(says().slice(-2)));
  // 物が 入っている 本だなは、取った あとで 読める
  const [x, y] = [41, 25];
  assert.ok(searchLoot('overworld', x, y));
  world.searchTile(bot.s, x, y, T.BOOKSHELF);
  await bot.settle();
  assert.ok(says().at(-1).includes('見つけた'), says().at(-1));
  world.searchTile(bot.s, x, y, T.BOOKSHELF);
  await bot.settle();
  assert.equal(says().at(-1), shelfHint(bot.s.map, x, y));
});

test('宝箱の メモ: フィールドの マップごと。ときどき（1/8）', () => {
  for (const mid of Object.keys(MEMO_HINTS)) assert.ok(MAPS[mid], mid);
  const rng = makeRng(8);
  let n = 0;
  for (let i = 0; i < 800; i++) {
    const m = chestMemo('overworld', rng);
    if (m) {
      n++;
      assert.match(m, /古いメモ/);
    }
  }
  assert.ok(n > 800 * MEMO_RATE * 0.6 && n < 800 * MEMO_RATE * 1.4, `${n}`);
  assert.equal(chestMemo('cave_b1', rng), null);
});

test('仲間の「はなす」: 人の 仲間が 5回に 1回、じゅんばんに ヒント（章に 合わせて）。魔物は しぐさ', () => {
  const obj = Object.keys(CH4_OBJECTIVE_TALK)[0];
  assert.equal(objectiveChapter(obj), 4);
  assert.equal(objectiveChapter('ホシミばあちゃんの家（村の南東）へ行こう'), 2);
  const out = [];
  for (let i = 0; i < PARTY_EVERY * 4; i++) out.push(memberTalk({ key: 'npc_gard', name: 'ガルド' }, obj));
  const hints = out.filter((t) => t.hint);
  assert.equal(hints.length, 4);
  assert.ok(hints.every((t) => PARTY_HINTS.some((h) => h.text === t.text && h.ch <= 4)));
  assert.ok(new Set(hints.map((t) => t.text)).size > 1, 'じゅんばんに かわる');
  assert.ok(memberTalk({ key: 'x', name: 'スラ', species: 'pururin' }, obj).mon);
  // nextPartyHint は 章より 先の ヒントを 出さない
  for (let i = 0; i < PARTY_EVERY * 10; i++) {
    const t = nextPartyHint(1);
    if (t) assert.ok(PARTY_HINTS.find((h) => h.text === t).ch <= 1);
  }
});

test('文字: secret-hints.js は gameFiles に 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().filter((f) => f.endsWith('secret-hints.js'));
  assert.equal(files.length, 1);
  assert.deepEqual(checkFile(files[0]), []);
});
