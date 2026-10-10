// ひみつのダンジョン: 入口・同じ形の 階・下りる・強さ・仲間に ならない・糸と ルーラ・5階ごとの ごほうび・休み所から 出る・
// 全滅・家族の パーティー・記録の 板・セーブ・文字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, condOk, tileAt } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ESCAPE_ITEM } from '../public/js/shared/data/escape.js';
import { scaleEnemy } from '../public/js/shared/data/treasure.js';
import { enemyFromSpecies } from '../public/js/shared/battle.js';
import { upgradeSave, repairChar, SAVE_VERSION } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { gainExp, expForLevel, addItem, itemCount } from '../public/js/shared/stats.js';
import { medalsFound } from '../public/js/shared/data/casino.js';
import {
  SD_GATE, SD_OPEN_FLAG, sdFloorId, sdFloorOf, sdEnemyLv, sdPower, sdRecommendLv, sdBand, ensureSdTable, sdZone, isRestFloor, isGuardFloor,
  sdGuardian, sdGuardEncounter, sdBigReward, sdSmallReward, repairSecret, mergeSecret, sdBoardRows, sdRecordText, noteSdFloor, SD_GUARDS, sdMonsterPool,
} from '../public/js/shared/data/secret.js';
import { SD_DOOR, GATE_DOWN, GATE_ARRIVE, GATE_BOARD, GATE_GUIDE, REST_CHEST, REST_KEEPER, REST_GUARD, REST_DOWN, REST_SPRING } from '../public/js/shared/maps/secret-dungeon.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const sayTexts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say').map((s) => s[2]));
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);

// じゅんばんに 答える（はじめの「どうする？」→ 次の「もどる？」など）
function answers(bot, list) {
  const q = list.slice();
  Object.defineProperty(bot, 'choice', { get: () => (q.length ? q.shift() : 0), set: () => {}, configurable: true });
}

function strong(c, level = 60) {
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
}

async function hero(seed = 7, { upto = SD_OPEN_FLAG, name = 'ソラ', level = 60 } = {}) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  if (upto) for (const f of UPTO(upto)) c.flags[f] = true;
  if (level) strong(c, level);
  return { world, bot, c };
}

const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x, y, dir, true);
  await bot.settle();
};
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}
// ちょうせん中に して その 階へ（テスト用。ふつうは 1階から 1つずつ 下りる）
async function onFloor(bot, f, { run = true } = {}) {
  const m = MAPS[sdFloorId(f)];
  await place(bot, m.id, m.sd.arrive.x, m.sd.arrive.y);
  const c = bot.world.data.characters[bot.char.id];
  if (run) c.sd = { ...(c.sd || { best: 0, got: [], tries: 1 }), run: { f, took: [] } };
  return m;
}
// その 人の そば（下）へ 行ってから 話す
async function talkTo(bot, id) {
  const m = MAPS[bot.map];
  const n = m.npcs.find((x) => x.id === id);
  await place(bot, m.id, n.x + 0.5, n.y + (n.big ? 2.5 : 1.5));
  return bot.talk(id);
}
// 下り階段の 1つ下から 階段を ふむ
async function goDown(bot) {
  const m = MAPS[bot.map];
  const d = m.sd.down || REST_DOWN;
  await place(bot, m.id, d.x + 0.5, d.y + 1.5);
  await stepOn(bot, d.x, d.y);
}

// 階の 中で 歩ける マス（大きな 人は とおれない）
function reachFrom(m, sx, sy) {
  const block = new Set();
  for (const n of m.npcs) {
    if (!n.big) continue;
    for (let y = n.y - 1; y <= n.y; y++) for (let x = n.x - 1; x <= n.x + 1; x++) block.add(y * m.w + x);
  }
  for (const n of m.npcs) if (n.solid !== false) block.add(Math.floor(n.y) * m.w + Math.floor(n.x));
  const seen = new Uint8Array(m.w * m.h);
  const q = [[sx, sy]];
  seen[sy * m.w + sx] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = ny * m.w + nx;
      if (seen[k] || block.has(k) || isBlocked(m, nx, ny, () => false)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !!seen[y * m.w + x];
}
const nextTo = (reach, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(x + dx, y + dy));

// ───────────── 入口 ─────────────
test('入口: ルミナの町に 着く 前は しまっていて、着くと 開く。入口の 広間から 地下1階へ', async () => {
  const ow = MAPS.overworld;
  const closed = ow.npcs.find((n) => n.id === 'sd_door_closed'), open = ow.npcs.find((n) => n.id === 'sd_door');
  const has = (flags) => (f) => flags.includes(f);
  assert.ok(condOk(closed.show, has([])) && !condOk(open.show, has([])), 'はじめは しまっている');
  assert.ok(!condOk(closed.show, has([SD_OPEN_FLAG])) && condOk(open.show, has([SD_OPEN_FLAG])), 'ルミナの町に 着くと 開く');
  assert.equal(SD_OPEN_FLAG, 'c1_town');
  // ルミナの町の 南門の 外（町の かべの 外・歩ける 草地・村から 町への 道の そば）
  assert.ok(!isBlocked(ow, SD_DOOR.x, SD_DOOR.y + 1, () => true), '入口の 前に 立てる');
  assert.ok(ow.zoneAt(SD_DOOR.x, SD_DOOR.y) === 'plains');

  // まだ 町に 着いていない（見張りは 通った）: とびらは 開かない
  const a = await hero(11, { upto: 'p_attack', level: 5 });
  await place(a.bot, 'overworld', SD_DOOR.x + 0.5, SD_DOOR.y + 1.5);
  await stepOn(a.bot, SD_DOOR.x, SD_DOOR.y - 0 + 0);
  assert.equal(a.bot.map, 'overworld');
  const from = a.bot.msgs.length;
  await a.bot.talk('sd_door_closed');
  assert.ok(sayTexts(a.bot, from).some((t) => t.includes('かたくとざされて')));

  // 町に 着いた: 入口を ふむと 広間へ
  const { bot, c } = await hero(12, { level: 5 });
  await place(bot, 'overworld', SD_DOOR.x + 0.5, SD_DOOR.y + 1.5);
  await stepOn(bot, SD_DOOR.x, SD_DOOR.y);
  assert.equal(bot.map, SD_GATE);
  const gate = MAPS[SD_GATE];
  assert.ok(gate.npcs.some((n) => n.id === 'sd_guide') && gate.npcs.some((n) => n.id === 'sd_board'), '案内人と 記録の 板');
  const reach = reachFrom(gate, Math.floor(GATE_ARRIVE.x), Math.floor(GATE_ARRIVE.y));
  assert.ok(nextTo(reach, GATE_BOARD.x, GATE_BOARD.y) && nextTo(reach, GATE_GUIDE.x, GATE_GUIDE.y), '板と 案内人に 話せる');
  assert.ok(reach(GATE_DOWN.x, GATE_DOWN.y + 1), '下り階段へ 行ける');
  // 案内人の 話（終わりが ない・5階ごと・仲間に ならない・お金は へらない）
  answers(bot, [0]);
  let f0 = bot.msgs.length;
  await talkTo(bot, 'sd_guide');
  const talk = sayTexts(bot, f0).join('\n');
  for (const w of ['終わりがない', '5階ごとに休み所', '仲間にならん', 'お金はへらん', '記録の板']) assert.ok(talk.includes(w), w);
  // 地下1階へ（やめる → 下りる）
  await place(bot, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
  answers(bot, [1]);
  await stepOn(bot, GATE_DOWN.x, GATE_DOWN.y);
  assert.equal(bot.map, SD_GATE, 'やめた');
  await place(bot, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
  answers(bot, [0]);
  f0 = bot.msgs.length;
  await stepOn(bot, GATE_DOWN.x, GATE_DOWN.y);
  assert.equal(bot.map, 'sd_1');
  assert.equal(c.sd.best, 1);
  assert.deepEqual(c.sd.run, { f: 1, took: [] });
  assert.equal(c.sd.tries, 1);
  assert.ok(toasts(bot, f0).some((t) => t.includes('地下1階') && t.includes('新記録')));
  // 入口の 広間から 地上へ もどる 階段
  await place(bot, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y);
  assert.equal(c.sd.run, undefined, '外へ 出ると ちょうせんは 終わり');
  const exit = gate.warps[0];
  await stepOn(bot, exit.x, exit.y);
  assert.equal(bot.map, 'overworld');
  assert.ok(Math.abs(bot.x - (SD_DOOR.x + 0.5)) < 1 && bot.y > SD_DOOR.y);
});

// ───────────── 階の 形 ─────────────
test('階の 形: 同じ 階は いつも 同じ形（家族みんな）。どの 階も 着いた 所から 下り階段へ 行ける', async () => {
  const a = await import('../public/js/shared/maps/secret-dungeon.js?build=a');
  const b = await import('../public/js/shared/maps/secret-dungeon.js?build=b');
  for (const f of [1, 2, 7, 13, 26, 49, 88]) {
    const x = a.buildSecretFloor(sdFloorId(f)), y = b.buildSecretFloor(sdFloorId(f));
    assert.deepEqual([...x.tiles], [...y.tiles], `${f}階: おなじ 形`);
    assert.deepEqual(x.sd, y.sd);
  }
  const t2 = [...MAPS.sd_2.tiles].join(''), t3 = [...MAPS.sd_3.tiles].join('');
  assert.notEqual(t2, t3, 'ちがう 階は ちがう 形');
  assert.equal(MAPS.sd_0, undefined);
  assert.equal(sdFloorOf('sd_12'), 12);
  assert.equal(sdFloorOf('sd_gate'), 0);
  for (let f = 1; f <= 120; f++) {
    const m = MAPS[sdFloorId(f)];
    assert.ok(m && m.kind === 'dungeon' && m.noEscape && m.noBefriend, `${f}階`);
    const ax = Math.floor(m.sd.arrive.x), ay = Math.floor(m.sd.arrive.y);
    assert.ok(!isBlocked(m, ax, ay, () => false), `${f}階: 着いた 所`);
    const reach = reachFrom(m, ax, ay);
    if (isRestFloor(f)) {
      assert.ok(m.sd.rest);
      for (const p of [REST_CHEST, REST_SPRING, REST_KEEPER]) assert.ok(nextTo(reach, p.x, p.y), `${f}階: 休み所の ${p.x},${p.y}`);
      if (isGuardFloor(f)) {
        assert.ok(!reach(REST_DOWN.x, REST_DOWN.y + 1), `${f}階: 番人が 階段を ふさぐ`);
        const g = m.npcs.find((n) => n.id === 'sd_guard');
        assert.equal(g.sprite, `mon:${sdGuardian(f)}`);
        assert.ok([[0, 2], [-2, 1], [2, 1], [0, 1]].some(([dx, dy]) => reach(g.x + dx, g.y + dy)), `${f}階: 番人に 話せる`);
      } else {
        assert.ok(reach(REST_DOWN.x, REST_DOWN.y + 1), `${f}階: 下り階段`);
        assert.ok(!m.npcs.some((n) => n.id === 'sd_guard'));
      }
      assert.equal(m.spawnCounts, undefined, '休み所に 魔物は 出ない');
      continue;
    }
    const d = m.sd.down;
    assert.equal(tileAt(m, d.x, d.y), T.STAIRS_DOWN);
    assert.ok(reach(d.x, d.y + 1), `${f}階: 下り階段へ 行ける`);
    assert.ok(m.triggers.some((t) => t.script === 'sd_down' && t.x === d.x && t.y === d.y));
    // 小さめ〜ふつう（宝の洞窟の 地図 Lv1〜4 くらい）
    assert.ok(m.w <= 52 && m.h <= 42, `${f}階: ${m.w}x${m.h}`);
    assert.ok(Object.values(m.spawnCounts)[0] >= 4);
    // 階の 色（10階ごとに かわる）
    assert.equal(m.theme, sdBand(f).theme);
  }
  assert.notEqual(MAPS.sd_1.theme, MAPS.sd_31.theme);
});

// ───────────── 下りる・強さ ─────────────
test('下りる: 階段を ふむと 次の 階へ。記録が のびる。上り階段は ふさがっている', async () => {
  const { bot, c } = await hero(21);
  await onFloor(bot, 1);
  for (let f = 1; f < 4; f++) {
    await goDown(bot);
    assert.equal(bot.map, sdFloorId(f + 1));
    assert.equal(c.sd.best, f + 1);
    assert.equal(c.sd.run.f, f + 1);
  }
  // 上り階段（ふさがっている）
  const m = MAPS.sd_4;
  const up = m.triggers.find((t) => t.script === 'sd_up');
  const from = bot.msgs.length;
  await place(bot, m.id, up.x + 0.5, up.y + 1.5);
  await stepOn(bot, up.x, up.y);
  assert.equal(bot.map, 'sd_4');
  assert.ok(sayTexts(bot, from).some((t) => t.includes('ふさがっている')));
  // 4階から 5階（休み所）へ
  await goDown(bot);
  assert.equal(bot.map, 'sd_5');
  assert.equal(c.sd.best, 5);
});

test('強さ: 下へ 行くほど 魔物が 強くなる（1階は おすすめ Lv5 くらい。深い 階は 倍率）', () => {
  assert.equal(sdRecommendLv(1), 5);
  for (let f = 1; f < 150; f++) {
    assert.ok(sdEnemyLv(f + 1) > sdEnemyLv(f));
    assert.ok(sdPower(f + 1) >= sdPower(f));
  }
  assert.equal(sdPower(10), 1);
  assert.ok(sdPower(50) > 1.5 && sdPower(70) > 2);
  // 出現表の 魔物の 強さ（強くした あと）
  const strength = (f) => {
    const zone = ensureSdTable(f);
    assert.equal(zone, sdZone(f));
    const list = ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map((g) => g[0]));
    for (const sp of list) {
      assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss && !MONSTERS[sp].breedOnly, `${f}階: ${sp}`);
    }
    const hp = list.map((sp) => scaleEnemy(enemyFromSpecies(sp), sdEnemyLv(f), sdPower(f)));
    return {
      hp: hp.reduce((s, m) => s + m.maxHp, 0) / hp.length,
      atk: hp.reduce((s, m) => s + m.atk, 0) / hp.length,
      lv: list.reduce((s, sp) => s + MONSTERS[sp].lv, 0) / list.length,
    };
  };
  const s1 = strength(1), s10 = strength(10), s30 = strength(30), s60 = strength(60), s90 = strength(90);
  assert.ok(s1.lv <= 6, `1階の 魔物は 弱い（${s1.lv}）`);
  for (const [a, b] of [[s1, s10], [s10, s30], [s30, s60], [s60, s90]]) {
    assert.ok(b.hp > a.hp && b.atk > a.atk, `${a.hp}→${b.hp}`);
  }
  // 今の 章の 魔物を まぜて 使う（いろいろな 章の 魔物が 出る）
  const all = new Set();
  for (let f = 1; f <= 45; f++) {
    if (isRestFloor(f)) continue;
    ensureSdTable(f);
    for (const e of ENCOUNTER_TABLES[sdZone(f)]) for (const g of e.group) all.add(g[0]);
  }
  for (const sp of ['pururin', 'sea_serpent', 'frost_wolf', 'mummy_soldier', 'water_dragon']) assert.ok(sdMonsterPool().includes(sp), sp);
  assert.ok(all.size >= 40, `出る 魔物 ${all.size}種`);
  // 番人（10階ごと）: しかけの いらない ボスを じゅんばんに。深いほど 強い
  for (const sp of SD_GUARDS) assert.ok(MONSTERS[sp]?.boss, sp);
  const g10 = FIXED_ENCOUNTERS[sdGuardEncounter(10)], g40 = FIXED_ENCOUNTERS[sdGuardEncounter(40)];
  assert.ok(g10.boss && !g10.canFlee && g40.enemyLv > g10.enemyLv && g40.enemyPow > g10.enemyPow);
  assert.equal(g10.group[0][0], sdGuardian(10));
});

// ───────────── 仲間に ならない ─────────────
test('魔物は 仲間に ならない（ひみつのダンジョンの 中だけ。図鑑には のる）', async () => {
  const { world, bot, c } = await hero(31);
  c.flags.monster_bond = true;
  const rng = world.rng;
  rng.chance = () => true; // 外なら かならず 仲間に なりたがる
  const fight = async (map, x, y) => {
    await place(bot, map, x, y);
    const s = world.sessions.get(bot.sid);
    const from = bot.msgs.length;
    startFieldBattle(world, s, { id: 'test', group: ['pururin'], zone: 'x', table: 'x', busy: false });
    for (let i = 0; i < 400 && bot.inBattle !== false; i++) { bot.flushQueue(); await tickN(world, 1); }
    answers(bot, [1]);
    await bot.settle();
    return sayTexts(bot, from).some((t) => t.includes('仲間になりたそう'));
  };
  const m = MAPS.sd_3;
  assert.equal(await fight(m.id, m.sd.arrive.x, m.sd.arrive.y), false, 'ダンジョンの 中では ならない');
  assert.ok(c.bestiary?.pururin?.seen > 0, '図鑑には のる');
  assert.equal(await fight('overworld', SD_DOOR.x + 0.5, SD_DOOR.y + 3.5), true, '外では なる（しくみは そのまま）');
});

// ───────────── 糸・羽・ルーラ ─────────────
test('糸・帰り道の羽・ルーラは 使えない（道具も MPも へらない）', async () => {
  const { bot, c } = await hero(41);
  addItem(c, ESCAPE_ITEM, 1);
  addItem(c, 'return_wing', 1);
  c.visited = { ...(c.visited || {}), village: true };
  for (const f of [2, 5, 10]) {
    await onFloor(bot, f);
    bot.send({ t: 'menu', action: 'useItem', id: ESCAPE_ITEM });
    await bot.settle();
    assert.equal(bot.map, sdFloorId(f));
    assert.equal(itemCount(c, ESCAPE_ITEM), 1);
    assert.ok(lastMenu(bot).text.includes('5階ごとの休み所'), lastMenu(bot).text);
    bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'village' });
    await bot.settle();
    assert.equal(bot.map, sdFloorId(f));
    assert.equal(itemCount(c, 'return_wing'), 1);
  }
  const rura = Object.keys(ABILITIES).find((id) => ABILITIES[id].effect?.type === 'warp' && ABILITIES[id].field);
  c.abilities = [...new Set([...(c.abilities || []), rura])];
  const mp0 = c.mp;
  bot.send({ t: 'menu', action: 'cast', id: rura, place: 'village', who: 'self' });
  await bot.settle();
  assert.equal(bot.map, 'sd_10');
  assert.equal(c.mp, mp0);
});

// ───────────── 休み所 ─────────────
test('5階ごとの ごほうび: 初めて 着いた 時は 大きな ごほうび、2回目からは 小さな ごほうび。1回の ちょうせんで 1人1回', async () => {
  const { world, bot, c } = await hero(51);
  // 大きな ごほうびの 中みは 階の 番号で きまる（家族みんな おなじ）・深いほど よい
  assert.deepEqual(sdBigReward(15), sdBigReward(15));
  const gold = (f) => sdBigReward(f).find((e) => e.gold).gold;
  assert.ok(gold(10) > gold(5) && gold(30) > gold(10));
  assert.ok(sdBigReward(10).some((e) => e.medal) && sdBigReward(20).some((e) => e.medal), '10階ごとに 小さなメダル');
  assert.ok(sdBigReward(15).some((e) => ITEMS[e.item]?.rank), '15階は 装備');
  assert.ok(sdBigReward(20).some((e) => ITEMS[e.item]?.star), '20階ごとに ★の 装備');
  for (let f = 5; f <= 200; f += 5) for (const e of sdBigReward(f)) assert.ok(e.gold > 0 || e.medal || ITEMS[e.item], `${f}階`);
  for (let i = 0; i < 200; i++) {
    const e = sdSmallReward(5 + (i % 20) * 5, world.rng);
    assert.ok(e.gold > 0 || ITEMS[e.item]);
  }
  // 5階: 初めて
  await onFloor(bot, 5);
  const g0 = c.gold;
  let from = bot.msgs.length;
  await talkTo(bot, 'sd_chest');
  assert.ok(sayTexts(bot, from).some((t) => t.includes('初めて着いたごほうび')));
  assert.equal(c.gold, g0 + gold(5));
  assert.deepEqual(c.sd.got, [5]);
  // もう一度 開けても からっぽ（同じ ちょうせん）
  from = bot.msgs.length;
  await talkTo(bot, 'sd_chest');
  assert.ok(sayTexts(bot, from).some((t) => t.includes('からっぽ')));
  assert.equal(c.gold, g0 + gold(5));
  // 次の ちょうせん: 小さな ごほうび（1つ）
  c.sd.run = { f: 5, took: [] };
  const items0 = JSON.stringify(c.items), g1 = c.gold;
  from = bot.msgs.length;
  await talkTo(bot, 'sd_chest');
  const t2 = sayTexts(bot, from);
  assert.ok(!t2.some((t) => t.includes('初めて')) && t2.some((t) => t.includes('を手に入れた')));
  assert.ok(c.gold !== g1 || JSON.stringify(c.items) !== items0);
  assert.ok(c.gold - g1 < gold(5), '小さい');
  assert.deepEqual(c.sd.got, [5]);
  // 10階: 小さなメダル（メダル王に わたせる）
  const m0 = medalsFound(c);
  await onFloor(bot, 10);
  await talkTo(bot, 'sd_chest');
  assert.equal(medalsFound(c), m0 + 1);
  assert.deepEqual(c.sd.got, [5, 10]);
  // 回復の泉
  c.hp = 1;
  answers(bot, [0]);
  await talkTo(bot, 'sd_spring');
  assert.ok(c.hp > 1);
});

test('休み所: 「地上へもどる」で 入口の 広間へ（記録は のこる）。「先へ進む」で 次の 階。10階ごとの 番人を たおすと 下へ', async () => {
  const { bot, c } = await hero(61);
  c.sd = { best: 5, got: [], tries: 1 };
  await onFloor(bot, 5);
  // 先へ 進む
  answers(bot, [0]);
  await talkTo(bot, 'sd_keeper');
  assert.equal(bot.map, 'sd_6');
  assert.equal(c.sd.best, 6);
  // 地上へ もどる（やめる → もどる）
  await onFloor(bot, 5);
  answers(bot, [1, 1]);
  await talkTo(bot, 'sd_keeper');
  assert.equal(bot.map, 'sd_5');
  answers(bot, [1, 0]);
  await talkTo(bot, 'sd_keeper');
  assert.equal(bot.map, SD_GATE);
  assert.equal(c.sd.run, undefined);
  assert.equal(c.sd.best, 6, '記録は のこる');
  // 10階の 番人（たおすと 11階へ）
  await onFloor(bot, 10);
  const from = bot.msgs.length;
  await talkTo(bot, 'sd_guard');
  assert.ok(bot.battles.some((b) => b.outcome === 'win'));
  assert.equal(bot.map, 'sd_11');
  assert.equal(c.sd.best, 11);
  assert.ok(sayTexts(bot, from).some((t) => t.includes('番人')));
});

// ───────────── 全滅 ─────────────
test('全滅: 入口の 広間で 目を覚ます。お金は へらない。記録は のこる', async () => {
  const { world, bot, c } = await hero(71, { level: 1 });
  c.gold = 1234;
  c.sd = { best: 19, got: [5, 10, 15], tries: 3 };
  await onFloor(bot, 20);
  await talkTo(bot, 'sd_guard');
  assert.ok(bot.battles.some((b) => b.outcome === 'lose'));
  assert.equal(bot.map, SD_GATE);
  assert.equal(c.gold, 1234, 'お金は へらない');
  assert.ok(c.hp > 0);
  assert.equal(c.sd.best, 19, '記録は のこる（全滅しても へらない）');
  assert.equal(c.sd.run, undefined);
  assert.ok(bot.battles.at(-1).lines.some((l) => l.includes('お金はへらない')));
  assert.ok(toasts(bot).some((t) => t.includes('入口で目を覚ました')));
  // ふつうの 場所の 全滅は 今までどおり（お金が 半分）
  void world;
});

// ───────────── 家族の パーティー ─────────────
test('家族の パーティー: いっしょに 入って 下りると みんなに 記録（いっしょに いた 家族の 名前も）。とちゅうから 来た 人は 記録に ならない', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(81), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  const ken = new Bot(world, 'ケン');
  for (const b of [papa, yui, ken]) { await b.login('x'); await b.createAndPlay('warrior'); await b.settle(); }
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid), K = world.sessions.get(ken.sid);
  for (const f of UPTO(SD_OPEN_FLAG)) P.char.flags[f] = true;
  strong(P.char);
  strong(Y.char, 8); // ユイは まだ 町に 着いていない（リーダーの 世界で 入れる）
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  // 入口の 広間へ（ついていく）
  Y.follow = true;
  await place(papa, 'overworld', SD_DOOR.x + 0.5, SD_DOOR.y + 1.5);
  world.placeSession(Y, 'overworld', SD_DOOR.x + 0.5, SD_DOOR.y + 2.5, 'up');
  await yui.settle();
  await stepOn(papa, SD_DOOR.x, SD_DOOR.y);
  await yui.settle();
  assert.equal(papa.map, SD_GATE);
  assert.equal(yui.map, SD_GATE, 'ユイも いっしょに');
  // 地下1階へ（同じ 広間に いる 家族は みんな いっしょ）
  Y.follow = false;
  world.placeSession(Y, SD_GATE, 10.5, 9.5, 'up');
  await yui.settle();
  await place(papa, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
  answers(papa, [0]);
  await stepOn(papa, GATE_DOWN.x, GATE_DOWN.y);
  await yui.settle();
  assert.equal(papa.map, 'sd_1');
  assert.equal(yui.map, 'sd_1', 'はなれていても 同じ 広間なら いっしょ');
  // 2階・3階へ（ユイが 階段を ふんでも みんなで）
  await goDown(papa);
  await yui.settle();
  assert.equal(yui.map, 'sd_2');
  const m2 = MAPS.sd_2;
  world.placeSession(Y, 'sd_2', m2.sd.down.x + 0.5, m2.sd.down.y + 1.5, 'up');
  await yui.settle();
  await stepOn(yui, m2.sd.down.x, m2.sd.down.y);
  await papa.settle();
  assert.equal(papa.map, 'sd_3');
  assert.equal(yui.map, 'sd_3');
  for (const [c, other] of [[P.char, 'ユイ'], [Y.char, 'パパ']]) {
    assert.equal(c.sd.best, 3);
    assert.deepEqual(c.sd.with, [other]);
  }
  // 記録の 板（家族サーバー: 家族みんな）
  const rows = sdBoardRows(world.data.characters);
  assert.deepEqual(rows.map((r) => r.name).sort(), ['パパ', 'ユイ']);
  assert.ok(rows.every((r) => r.best === 3 && r.rank >= 1));
  // ケンが とちゅうから（3階に いる パパに さそわれて 来た）: 記録に ならない
  for (const f of UPTO(SD_OPEN_FLAG)) K.char.flags[f] = true;
  strong(K.char);
  papa.send({ t: 'party', action: 'invite', sid: ken.s.id });
  ken.send({ t: 'party', action: 'accept' });
  await ken.settle();
  assert.equal(ken.map, 'sd_3');
  assert.ok(K.char.sd.run.mid);
  await goDown(papa);
  await ken.settle();
  await yui.settle();
  assert.equal(ken.map, 'sd_4');
  assert.equal(P.char.sd.best, 4);
  assert.equal(Y.char.sd.best, 4);
  assert.deepEqual(P.char.sd.with.sort(), ['ケン', 'ユイ'].sort());
  assert.equal(K.char.sd.best || 0, 0, 'とちゅうから 来た 人は 記録に ならない');
  assert.ok(toasts(ken).some((t) => t.includes('今回は記録にならない')));
  // パーティーを ぬけると 自分の 冒険の 場所へ（ちょうせんは 終わり）
  ken.send({ t: 'party', action: 'leave' });
  await tickN(world, 3);
  await ken.settle();
  assert.notEqual(ken.map, 'sd_4');
  assert.equal(K.char.sd.run, undefined);
});

// ───────────── 記録の 板 ─────────────
test('記録の 板: 深い じゅん（同じ 階なら 先に 着いた 人）。ひとりの サイトでは 自分の キャラたち。メニューでも 見える', async () => {
  const chars = {
    a: { id: 'a', name: 'ママ', sd: { best: 12, at: 2000, with: ['ユウ'] } },
    b: { id: 'b', name: 'ユウ', sd: { best: 12, at: 1000, with: [] } },
    c: { id: 'c', name: 'パパ', sd: { best: 30, at: 5000, with: [] } },
    d: { id: 'd', name: 'ねこ', sd: { best: 0 } },
    e: { id: 'e', name: 'じい' },
  };
  const rows = sdBoardRows(chars);
  assert.deepEqual(rows.map((r) => [r.rank, r.name, r.best]), [[1, 'パパ', 30], [2, 'ユウ', 12], [3, 'ママ', 12]]);
  const many = Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`x${i}`, { id: `x${i}`, name: `x${i}`, sd: { best: i + 1, at: i } }]));
  assert.equal(sdBoardRows(many).length, 10, '上位 10人');
  assert.ok(sdRecordText({ best: 12, at: new Date(2026, 9, 9).getTime(), with: ['ユウ'] }).includes('地下12階（10月9日・ユウといっしょ）'));
  assert.equal(sdRecordText({ best: 0 }), 'まだ記録がない');
  // 板を 見る（ひとりの サイト: 自分の キャラたち）
  const { world, bot, c } = await hero(91);
  c.sd = { best: 7, at: Date.now(), with: [], got: [5], tries: 2 };
  await place(bot, SD_GATE, GATE_ARRIVE.x, GATE_ARRIVE.y);
  await talkTo(bot, 'sd_board');
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((s) => s[0] === 'ui' && s[1] === 'sdBoard');
  assert.ok(ui, '板の まど');
  assert.equal(ui[2].offline, true);
  assert.deepEqual(ui[2].rows.map((r) => r.name), [c.name]);
  assert.equal(ui[2].me.best, 7);
  void world;
  // 画面の 文（メニュー・板）
  const menuSrc = await import('node:fs').then((fs) => fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8'));
  assert.ok(menuSrc.includes('sdRecordText(sd)') && menuSrc.includes('最高は地下'), 'クエストと 強さに 自分の 最高の 階');
  const services = await import('node:fs').then((fs) => fs.readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8'));
  assert.ok(services.includes("case 'sdBoard'"));
});

// ───────────── セーブ ─────────────
test('セーブ: 古い セーブも 読める・こわれた 記録は ととのえる・家族サーバーと 合わせる・ログインしなおし', async () => {
  const old = { version: 3, characters: { a: { id: 'a', name: 'むかし', level: 3, flags: {}, items: [], equip: {} } } };
  const up = upgradeSave(old);
  assert.equal(up.data.characters.a.sd, undefined, '記録の ない セーブも 読める');
  assert.equal(up.data.version, SAVE_VERSION);
  const bad = { id: 'b', name: 'こわれ', level: 1, flags: {}, items: [], equip: {}, sd: { best: '12', with: ['ママ', 3, '', 'ママ'], got: [5, 7, 10, -5, 'x'], tries: -2, run: { f: 3, took: [5, 'a'], mid: 1 }, junk: 1 } };
  repairChar(bad);
  assert.deepEqual(bad.sd, { best: 12, with: ['ママ'], got: [5, 10], tries: 0, run: { f: 3, took: [5], mid: true } });
  const once = JSON.stringify(bad.sd);
  repairChar(bad);
  assert.equal(JSON.stringify(bad.sd), once, '何回 ととのえても 同じ');
  const broken = { id: 'c', name: 'x', flags: {}, items: [], equip: {}, sd: 'abc' };
  repairChar(broken);
  assert.equal(broken.sd, undefined);
  const c0 = { sd: undefined };
  repairSecret(c0);
  assert.ok(!('sd' in c0) || c0.sd === undefined);
  // 合わせる: 深い ほうの 記録・ごほうびは 両方・ちょうせんの 回数
  const base = { best: 5, at: 10, with: [], got: [5], tries: 2 };
  const ours = { best: 8, at: 30, with: ['ママ'], got: [5], tries: 4 };
  const theirs = { best: 12, at: 20, with: [], got: [5, 10], tries: 3 };
  assert.deepEqual(mergeSecret(base, ours, theirs), { best: 12, at: 20, with: [], got: [5, 10], tries: 5 });
  const cb = { id: 'z', name: 'Z', level: 5, exp: 100, gold: 0, flags: {}, items: [], equip: {}, sd: base };
  const r = mergeChars(cb, { ...cb, sd: ours, lastPlayed: 2 }, { ...cb, sd: theirs, lastPlayed: 1 });
  assert.equal(r.sd.best, 12);
  // ダンジョンの 中で 終わって また 遊ぶ: 同じ 階から（ちょうせんも つづく）。知らない 階は 入口の 広間
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  const id = await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[id];
  const m = MAPS.sd_7;
  const s = world.sessions.get(bot.sid);
  world.leaveWorld(s);
  c.pos = { map: 'sd_7', x: m.sd.arrive.x, y: m.sd.arrive.y, dir: 'down' };
  c.sd = { best: 7, got: [5], tries: 1, run: { f: 7, took: [5] } };
  bot.send({ t: 'play', id });
  await bot.settle();
  assert.equal(bot.map, 'sd_7');
  assert.deepEqual(c.sd.run, { f: 7, took: [5] });
  world.leaveWorld(world.sessions.get(bot.sid));
  c.pos = { map: 'sd_0', x: 3, y: 3, dir: 'down' };
  bot.send({ t: 'play', id });
  await bot.settle();
  assert.equal(bot.map, SD_GATE);
});

// ───────────── 文字・絵・音 ─────────────
test('文字・絵・音: 使えない 漢字・スペースが ない。絵と 曲と 戦いの 背景が ある', async () => {
  const files = gameFiles();
  for (const f of ['data/secret.js', 'data/story-secret.js', 'maps/secret-dungeon.js', 'world/secret.js', 'client/ui/secret.js', 'client/render/secret-art.js']) {
    const file = files.find((x) => x.endsWith(f));
    assert.ok(file, `${f} が gameFiles に ある`);
    const bad = checkFile(file).filter((p) => p.kind !== 'kana');
    assert.deepEqual(bad, [], f);
  }
  for (const id of ['sd_door', 'sd_guide', 'sd_board', 'sd_enter', 'sd_down', 'sd_up', 'sd_rest', 'sd_chest', 'sd_spring', 'sd_guard']) assert.ok(SCRIPTS[id], id);
  const { _TRACKS } = await import('../public/js/client/audio.js');
  for (const id of new Set([MAPS.sd_gate.bgm, MAPS.sd_1.bgm, MAPS.sd_5.bgm])) assert.ok(_TRACKS[id], id);
  const art = await import('../public/js/client/render/secret-art.js');
  for (const f of [0, 1]) {
    for (const p of [art.paintSdDoor(f), art.paintSdDoorClosed(f), art.paintSdBoard(f), art.paintSdChest(f)]) {
      assert.equal(p.w, 16);
      assert.ok(p.px.filter(Boolean).length > 80, 'え が ある');
    }
  }
  for (let f = 1; f <= 70; f += 3) assert.ok(art.SECRET_BG[sdBand(f).bg], `${f}階の 背景`);
  assert.ok(art.SECRET_BG.sd_guard);
  const themes = await import('node:fs').then((fs) => fs.readFileSync(new URL('../public/js/client/render/themes.js', import.meta.url), 'utf8'));
  for (let f = 1; f <= 70; f += 3) assert.ok(themes.includes(`${sdBand(f).theme}: {`), sdBand(f).theme);
  assert.ok(themes.includes('sd_gate: {'));
  void noteSdFloor;
});
