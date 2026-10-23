// 第2部 第6章「時の砂時計」Step 3・4（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c6_flow → 千年前の ミナモ「星が ゆがんでいる」（c6_omen）→ 星読みの社の オリハ（c6_orih）→ 星めぐりの古道（c6_road）
// → 4階の 星くいのよる鳥（c6_bird）→ 8階の ペンデュラ（c6_pendula）→ オリハの 星読み → 今の カナタ（c6_kanata）
// 戦いの しくみ（星くいのよる鳥・ペンデュラ）と 魔物・品は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { FOREST_CLEARING, PLACES } from '../public/js/shared/maps/overworld.js';
import { CH6_MAPS, CH6B_MAPS } from '../public/js/shared/maps/ch6.js';
import { PAST_ID } from '../public/js/shared/maps/past.js';
import {
  C6B, HF, STARSIGHT, SAP_DIRS, SAP_FLAG, SAP_GOOD, CATCH5, OPEN6, WAIT6, END_P6, HM_POS, HM_STONES, HM_FLOORS, HM_MAPS, HM_RESTS,
  HM_BIRD_FLOOR, HM_BOSS_FLOOR, SHA, hmMapId, hmArrive, stoneIndex, ROUTE_LEVELS,
} from '../public/js/shared/maps/hoshimichi.js';
import { HM_ROWS, MIST_ROUTES } from '../public/js/shared/maps/hoshimichi-rows.js';
import { TC, RC, CT, TC_SPOTS, TC_ASKERS, KIRA_SPOTS, ASTEL_SPOT } from '../public/js/shared/maps/ch6-side.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH6_STEPS, C6_OBJ, OLD_C6_OBJ, CH6_OBJECTIVE_TARGETS, CH6_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch6.js';
import { CH6B_STEPS, C6B_OBJ, CH6B_STORY_SCRIPTS, endingFromP } from '../public/js/shared/data/story-ch6b.js';
import { ch6SubQuests, CH6_SIDE_QUESTS } from '../public/js/shared/data/sidequests-ch6.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { SHOPS, GUESTS, shopItems } from '../public/js/shared/data/shops.js';
// 作業中の 仮の データ（B の ROAD_TREASURE_FLOORS・ROAD_FIELD_TREASURE。まとめる 時に '../public/js/shared/data/items-road.js' に かえる）
import { ROAD_TREASURE_FLOORS, ROAD_FIELD_TREASURE } from '../public/js/shared/data/ch6b-stub.js';
import { TIME_GLASS } from '../public/js/shared/world/time-glass.js';
import { STAR_ITEM, STAR_STEPS, STAR_TEXT } from '../public/js/shared/world/star-sight.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const toasted = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => (m.t === 'toast' || m.t === 'menuRes') && String(m.text || '').includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const HM_STEP_FLAGS = ['c6_omen', 'c6_orih', 'c6_road', 'c6_bird', 'c6_pendula', 'c6_kanata'];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで。minamo … ミナモが ゲスト（c6_omen から c6_kanata まで）。star … ミナモの 星読みを もつ
async function setup(seed, upto = 'c6_flow', { extra = [], minamo = null, star = null, frac = 0.2 } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  const inGuest = minamo ?? (!!c.flags.c6_omen && !c.flags.c6_kanata);
  c.guests = inGuest ? ['minamo'] : [];
  if (star ?? (!!c.flags.c6_orih && !c.flags.c6_kanata)) c.keyItems.push(STAR_ITEM);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 62);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await play(bot);
};
async function stepOn(bot, x, y, opts) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot, opts);
}
const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };
const useGlass = (bot, opts) => { bot.send({ t: 'menu', action: 'timeGlass' }); return play(bot, opts); };
const useStars = (bot, opts) => { bot.send({ t: 'menu', action: 'starSight' }); return play(bot, opts); };

function finish(ctx2, lose) {
  const b = ctx2.battle;
  if (lose) {
    for (const a of b.allies) if (a.alive) b.kill(a);
  } else {
    for (let k = 0; k < 20; k++) {
      const alive = b.enemies.filter((e) => e.alive);
      if (!alive.length) break;
      for (const e of alive) b.kill(e);
    }
  }
  b.checkEnd();
}
async function play(bot, { lose = () => false, fought = null, max = 40000, others = [], stopAt = null, from = 0 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    if (stopAt && said(bot, stopAt, from)) {
      bot.queue = [];
      world.disconnect(bot.s, bot.conn);
      await tickN(world, 2);
      return 'cut';
    }
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
    }
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      for (const o of others) o.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
async function reconnect(world, old) {
  const id = old.char.id;
  const bot = new Bot(world, old.name);
  await bot.login();
  bot.send({ t: 'play', id });
  await bot.settle();
  bot.s.repelUntil = 1e15;
  return bot;
}
// その 人の いる マップで (tx, ty) まで 歩く（とびら・宝箱・星の もやの まちがい・人を さける。サーバーの フラグで）
async function walkTo(bot, tx, ty, opts = {}) {
  const w = bot.world;
  const s = bot.s;
  const map = MAPS[s.map];
  const has = w.hasFlagFn(s);
  const ok = (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has)) return false;
    const k = y * map.w + x;
    if (map.mist?.lost.has(k) || (map.warpAt.has(k) && !(x === tx && y === ty))) return false;
    const ch = map.chestAt.get(k);
    if (ch && condOk(ch.show, has)) return false;
    return !map.npcs.some((n) => n.solid && condOk(n.show, has) && Math.floor(n.x) === x && Math.floor(n.y) === y);
  };
  const sx = Math.floor(s.x), sy = Math.floor(s.y);
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (prev.has(k) || !ok(nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  assert.ok(prev.has(ty * map.w + tx), `${s.map}: (${sx},${sy}) → (${tx},${ty}) へ 歩いて 行ける`);
  const path = [];
  for (let cur = [tx, ty]; cur; cur = prev.get(cur[1] * map.w + cur[0])) path.unshift(cur);
  for (const [x, y] of path.slice(1)) await stepOn(bot, x, y, opts);
}
// ふたりで あそぶ（さそう・うける）
async function family(seed, upto = 'c6_flow', extraFlags = []) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false, now: () => at(0.2) });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO(upto), ...extraFlags]) Pa.char.flags[f] = true;
  Pa.char.keyItems.push(TIME_GLASS);
  if (Pa.char.flags.c6_omen && !Pa.char.flags.c6_kanata) Pa.char.guests = ['minamo'];
  if (Pa.char.flags.c6_orih && !Pa.char.flags.c6_kanata) Pa.char.keyItems.push(STAR_ITEM);
  boost(Pa.char, 62);
  boost(Y.char, 62);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 12-1）: 物語の すすみ・マップの ID・出現表・きまった 戦い・曲・宝箱・ゲスト・大事な物・タイル', async () => {
  const fi = CH6_STEPS.indexOf('c6_flow');
  assert.deepEqual(CH6_STEPS.slice(fi + 1), HM_STEP_FLAGS);
  assert.deepEqual(CH6B_STEPS, HM_STEP_FLAGS);
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c6_flow') + 1, STORY_STEPS.indexOf('c6_flow') + 7), HM_STEP_FLAGS, 'c6_flow の うしろ');
  const want = [...Array.from({ length: 8 }, (_, i) => `hoshimichi_${i + 1}f`), ...Array.from({ length: 8 }, (_, i) => `hoshimichi_${i + 1}f_past`)];
  assert.deepEqual([...HM_MAPS].sort(), want.sort());
  assert.deepEqual([...CH6B_MAPS].sort(), want.sort());
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.kind === 'dungeon' && !m.indoor, id);
    assert.equal(m.timePair, id.endsWith('_past') ? id.slice(0, -5) : `${id}_past`, `${id}: 時の 組`);
    assert.ok(m.tiles instanceof Uint16Array, `${id}: 256 いじょうの タイル`);
  }
  assert.ok(!CH6_MAPS.some((id) => id.startsWith('hoshimichi')), 'Step 1・2 の 一らんは そのまま');
  // 出現表（B）: 1〜4階 t6_road_up・5〜8階 t6_road_low（ボスの 8階は 出ない）
  for (let n = 1; n <= HM_FLOORS; n++) for (const past of [false, true]) {
    const m = MAPS[hmMapId(n, past)];
    const table = n <= 4 ? 't6_road_up' : 't6_road_low';
    if (n === HM_BOSS_FLOOR) assert.deepEqual(m.spawnCounts, {});
    else assert.ok(m.spawnCounts[table] > 0, `${m.id} の 出現表`);
  }
  for (const z of ['t6_road_up', 't6_road_low']) assert.ok(ENCOUNTER_TABLES[z]?.length, z);
  // きまった 戦い（B）・曲
  for (const id of ['star_eater', 'pendula']) {
    const fx = FIXED_ENCOUNTERS[id];
    assert.ok(fx && fx.boss && !fx.canFlee && !fx.loseOk, id);
  }
  const { _TRACKS } = await import('../public/js/client/audio.js');
  for (const id of ['hoshimichi', 'boss6', 'past_village', 'zenmai']) assert.ok(_TRACKS[id], `曲 ${id}`);
  assert.equal(MAPS.hoshimichi_1f.bgm, 'hoshimichi');
  // 休み所（3階・7階の さいご。4階と 8階の 前）
  assert.deepEqual(HM_RESTS, [3, 7]);
  for (const n of HM_RESTS) for (const past of [false, true]) {
    const m = MAPS[hmMapId(n, past)];
    const F = HM_POS[n].font;
    assert.ok(F && m.actionAt.get(F.y * m.w + F.x)?.script === 'c6_hfont', `${m.id}: 星の いずみ`);
    assert.equal(m.zoneAt(F.x, F.y + 1), 'safe:rest');
    assert.ok(F.y > HM_POS[n].up.y || n === 3, '休み所は 下りかいだんの 近く');
    const d = HM_POS[n].down;
    assert.equal(m.zoneAt(d.x, d.y - 1), 'safe:rest', '下りかいだんは 休み所の 中');
  }
  // 宝箱（B の ROAD_TREASURE_FLOORS を 1階ごとに 2つ・ROAD_FIELD_TREASURE を 社の まわりに 3つ）
  const chests = HM_MAPS.flatMap((id) => MAPS[id].chests);
  for (let n = 1; n <= HM_FLOORS; n++) {
    const mine = chests.filter((c) => c.id.startsWith(`h6_${n}c`)).map((c) => c.item).sort();
    assert.deepEqual(mine, [...ROAD_TREASURE_FLOORS[n]].sort(), `${n}階の 宝箱`);
  }
  assert.equal(ROAD_FIELD_TREASURE.length, 3);
  assert.deepEqual(MAPS[PAST_ID].chests.filter((c) => c.id.startsWith('h6_ow')).map((c) => c.item), ROAD_FIELD_TREASURE);
  // ゲスト・大事な物・より道の 品
  assert.ok(GUESTS.minamo?.name === 'ミナモ');
  for (const id of [STAR_ITEM, 'c6s_old_recipe']) assert.equal(ITEMS[id]?.type, 'key', id);
  assert.equal(ITEMS[STAR_ITEM].menuUse, 'starSight');
  for (const id of ['c6s_hoshi_charm', 'c6s_star_hairpin', 'c6s_locket', 'c6s_astel_scale']) {
    assert.ok(ITEMS[id]?.type === 'acc' && ITEMS[id].rank === 10 && ITEMS[id].src === 'gift' && ITEM_KANA[id], `★5 の アクセ ${id}`);
  }
  assert.ok(ITEMS.c6s_feast.battle && ITEMS.c6s_feast.target === 'allies' && ITEMS.c6s_feast.effect.type === 'heal' && ITEM_KANA.c6s_feast, '回復の 料理');
  // タイル（280〜288。266〜279 は ほかの 人の ために あけておく）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  assert.deepEqual([T.HM_MIST, T.HM_ROUTE, T.DRY_VALLEY, T.YOUNG_TREE, T.METEOR, T.STAR_POST, T.STAR_CATCH, T.STAR_STONE, T.STAR_STONE_ON], [280, 281, 282, 283, 284, 285, 286, 287, 288]);
  assert.ok(!ids.some((v) => v >= 266 && v < 280));
  // パーティー全員で 見る だいほん
  for (const id of CH6B_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  assert.ok(STORY_SCRIPTS.has('c5_kanata'));
});

// ───────────── 目標 ─────────────
test('目標: c6_flow の あとの 目標・フラグごとの 目標・前の 版の「続きはアップデート」は なおる・仲間会話・地図の しるし', () => {
  assert.equal(OLD_C6_OBJ.flow, '第6章の続きはアップデートで！');
  assert.equal(C6B_OBJ.kanata, '第6章の続きはアップデートで！', 'さいごは また「続きはアップデート」');
  assert.equal(C6_OBJ.flow, C6B_OBJ.flow);
  // 前の 版で c6_flow まで 遊んだ セーブ（目標の 文は「続きはアップデート」）は、ミナモへの 目標に なおる
  const old = { flags: flagsOf(...UPTO('c6_flow')), objective: OLD_C6_OBJ.flow };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C6_OBJ.flow);
  const done = { flags: flagsOf(...UPTO('c6_kanata')), objective: C6B_OBJ.kanata };
  assert.ok(!repairObjective(done), 'c6_kanata の あとは そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const table = [
    [['c6_flow'], C6B_OBJ.flow], [['c6_omen'], C6B_OBJ.omen], [['c6_orih'], C6B_OBJ.orih], [['c6_road'], C6B_OBJ.road],
    [['c6_road', HF(2)], C6B_OBJ.hf2], [['c6_road', HF(3)], C6B_OBJ.hf3], [['c6_road', HF(4)], C6B_OBJ.hf4], [['c6_bird', HF(4)], C6B_OBJ.bird],
    [['c6_bird', HF(5)], C6B_OBJ.hf5], [['c6_bird', HF(6)], C6B_OBJ.hf6], [['c6_bird', HF(7)], C6B_OBJ.hf7], [['c6_bird', HF(8)], C6B_OBJ.hf8],
    [['c6_pendula'], C6B_OBJ.pendula], [['c6_pendula', END_P6], C6B_OBJ.endP], [['c6_kanata'], C6B_OBJ.kanata],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of Object.entries(C6B_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH6_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH6_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  assert.ok(C6B_OBJ.hf2.includes('千年前') && C6B_OBJ.hf5.includes('千年前') && C6B_OBJ.endP.includes('今の時代'), '時代を はっきり');
  // 地図の しるし（その 時代の マップの しるし だけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const O = MAPS[PAST_ID].npcById.oriha;
  assert.ok(mark(C6B_OBJ.omen, PAST_ID).some((m) => m.x === Math.floor(O.x) && m.y === Math.floor(O.y)), 'オリハ（千年前）');
  assert.ok(mark(C6B_OBJ.orih, 'overworld').some((m) => m.x === SHA.door.x && m.y === SHA.door.y), '今の 森のひろばの 古道の 入口');
  const Q = HM_POS[5].catcher;
  assert.ok(mark(C6B_OBJ.hf5, hmMapId(5, true)).some((m) => m.x === Q.x && m.y === Q.y), '星受けの台（千年前）');
  assert.ok(!mark(C6B_OBJ.hf5, hmMapId(5, false)).some((m) => m.x === Q.x && m.y === Q.y), '今の 階には 出ない');
  assert.ok(!mark(C6B_OBJ.hf5, hmMapId(5, true), [CATCH5]).some((m) => m.x === Q.x && m.y === Q.y), '受けとめたら 消える');
  const P1 = HM_POS[6].plate1, P2 = HM_POS[6].plate2;
  assert.ok(mark(C6B_OBJ.hf6, hmMapId(6, false)).some((m) => m.x === P1.x && m.y === P1.y) && mark(C6B_OBJ.hf6, hmMapId(6, true)).some((m) => m.x === P2.x && m.y === P2.y), '星の石');
  const K = MAPS.hoshiyomi.npcById.kanata;
  assert.ok(mark(C6B_OBJ.endP, 'hoshiyomi').some((m) => m.x === Math.floor(K.x)), '今の カナタ');
});

// ───────────── 星読みの社・古道の 入口 ─────────────
test('星読みの社（千年前の 森のひろば）と 今の 石の 台・古道の 入口（c6_orih で 開く。今も 千年前も）', () => {
  const past = MAPS[PAST_ID], now = MAPS.overworld;
  const H = SHA.hall;
  assert.ok(Math.abs(SHA.oriha.x - FOREST_CLEARING.x) <= 1 && Math.abs(SHA.oriha.y - FOREST_CLEARING.y) <= 2, '森のひろばの 所');
  for (let y = H.y0; y <= H.y1; y++) for (let x = H.x0; x <= H.x1; x++) {
    assert.equal(past.tiles[y * past.w + x], T.WALL_WOOD, '千年前は 社');
    assert.notEqual(now.tiles[y * now.w + x], T.WALL_WOOD, '今は 社は ない');
  }
  assert.equal(now.tiles[SHA.platform.y * now.w + SHA.platform.x], T.STAR_ALTAR, '今は 石の 台だけ');
  assert.ok(past.npcById.oriha && past.npcById.kotoha, 'オリハ・コトハ');
  assert.ok(!now.npcById.oriha, '今は いない');
  const D = SHA.door;
  for (const m of [now, past]) {
    assert.ok(isBlocked(m, D.x, D.y, () => false) && !isBlocked(m, D.x, D.y, (fl) => fl === C6B.orih), `${m.id}: 古道の 入口`);
    assert.equal(m.warps.find((q) => q.x === D.x && q.y === D.y).to.map, m === now ? 'hoshimichi_1f' : 'hoshimichi_1f_past');
  }
  // 千年前の 里・今の 村から 歩いて 行ける（入口の 前・オリハの 前・社の 宝箱）
  const reach = (id, start) => {
    const m = MAPS[id];
    const seen = new Set([start[1] * m.w + start[0]]);
    const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
        if (seen.has(k) || isBlocked(m, nx, ny, () => true)) continue;
        seen.add(k);
        if (!m.warpAt.has(k)) q.push([nx, ny]);
      }
    }
    return (x, y) => seen.has(y * m.w + x);
  };
  const rp = reach(PAST_ID, [27, 104]);
  const rn = reach('overworld', [PLACES.village.x + 16, PLACES.village.y + 13]);
  assert.ok(rp(D.x, D.y + 1) && rn(D.x, D.y + 1), '入口の 前');
  assert.ok(rp(SHA.oriha.x, SHA.oriha.y + 1), 'オリハの 前');
  for (const c of past.chests.filter((q) => q.id.startsWith('h6_ow'))) assert.ok(D4.some(([dx, dy]) => rp(c.x + dx, c.y + dy)), c.id);
  // 古道から 出ると その 時代の 森のひろば（みちびきの糸も）
  for (const past0 of [false, true]) {
    const ex = dungeonExit(null, { map: hmMapId(3, past0), char: {} });
    assert.ok(ex && ex.map === (past0 ? PAST_ID : 'overworld') && Math.abs(ex.y - SHA.out.y) < 1, `${past0 ? '千年前' : '今'}: 糸で 森のひろばへ`);
  }
});

// ───────────── 古道の とき方（どちらの 時代から 入っても）─────────────
// 階の しかけを ぜんぶ ためす さがし（時代・場所・フラグ）。shift … 時の砂時計を 使えるか / start … はじめの フラグ
function hmSolve(n, startPast, { shift = true, start = [], mist = 'route' } = {}) {
  const P = HM_POS[n];
  const st = HM_STONES[n];
  const a = hmArrive(n, startPast);
  const s0 = { past: startPast, x: Math.floor(a.x), y: Math.floor(a.y), flags: [...start] };
  const key = (s) => `${s.past ? 1 : 0}:${s.x},${s.y}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  while (q.length) {
    const s = q.shift();
    const has = (f) => s.flags.includes(f) || (mist === 'route' && f === STARSIGHT);
    const map = MAPS[hmMapId(n, s.past)];
    const push = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    for (const [dx, dy] of D4) {
      const nx = x(s) + dx, ny = s.y + dy;
      if (isBlocked(map, nx, ny, has)) continue;
      if (map.mist?.lost.has(ny * map.w + nx)) continue; // まちがった もやは ふまない（ふむと 入口へ もどる）
      if (mist === 'none' && HM_ROWS[n][ny][nx] === 'r') continue;
      const w = map.warpAt.get(ny * map.w + nx);
      if (w) { if (P.down && nx === P.down.x && ny === P.down.y) goals.push(s.past); continue; }
      push({ ...s, x: nx, y: ny });
    }
    const other = MAPS[hmMapId(n, !s.past)];
    if (shift && canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, past: !s.past });
    if (s.past) {
      const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) === 1;
      if (st) {
        const i = stoneIndex(st, has);
        const c = st.track[i];
        const [dx, dy] = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }[st.dir];
        if (s.x === c.x - dx && s.y === c.y - dy && st.track[i + 1]) push({ ...s, flags: [...s.flags.filter((f) => !st.flags.includes(f)), st.flags[i + 1]] });
      }
      if (near(P.tree) && !has(SAP_FLAG(SAP_GOOD))) push({ ...s, flags: [...s.flags.filter((f) => !f.startsWith('c6_h3_sap_')), SAP_FLAG(SAP_GOOD)] });
      if (near(P.catcher) && !has(CATCH5)) push({ ...s, flags: [...s.flags, CATCH5] });
    }
  }
  return { goals, seen };
  function x(s) { return s.x; }
}
test('星めぐりの古道: どの 階も 今と 千年前で おなじ 形（40×30）。どちらの 時代から 入っても 下へ 行ける・時の砂時計が いる 階', () => {
  for (let n = 1; n <= HM_FLOORS; n++) {
    const now = MAPS[hmMapId(n, false)], past = MAPS[hmMapId(n, true)];
    assert.ok(now.w === past.w && now.h === past.h && now.w >= 40 && now.h >= 30, `${n}階: おなじ 大きさ（広め）`);
    for (const m of [now, past]) {
      const ex = dungeonExit(null, { map: m.id, char: {} });
      assert.ok(ex && ex.map === (m.past ? PAST_ID : 'overworld'), `${m.id}: みちびきの糸で その 時代の 外へ`);
    }
    let same = 0;
    for (let i = 0; i < now.tiles.length; i++) if (now.tiles[i] === past.tiles[i]) same++;
    assert.ok(same > now.tiles.length * 0.8, `${n}階: かべの 形は おなじ`);
    if (n === HM_BOSS_FLOOR) continue;
    const start = n === HM_BIRD_FLOOR ? [C6B.bird] : [];
    for (const past0 of [false, true]) assert.ok(hmSolve(n, past0, { start }).goals.length, `${n}階（${past0 ? '千年前' : '今'}から）: 下りかいだんへ 行ける`);
  }
  // 時の砂時計を 使わないと 行けない 階（今は川・千年前は谷／なえと 大木／落ちた星）
  for (const n of [2, 3, 5, 7]) for (const past0 of [false, true]) assert.equal(hmSolve(n, past0, { shift: false }).goals.length, 0, `${n}階（${past0 ? '千年前' : '今'}）: 時を こえないと 行けない`);
  // 星の もや: 夜空が 見えないと（本当の 道を 知らないと）通れない。6階は 近道（星の石）でも 行ける
  for (const n of [1, 3]) for (const past0 of [false, true]) assert.equal(hmSolve(n, past0, { mist: 'none' }).goals.length, 0, `${n}階: もやは 星の 道しるべが ないと 通れない`);
  assert.equal(hmSolve(6, false, { mist: 'none' }).goals.length, 0, '6階: もやも 近道も なしでは 行けない');
  assert.ok(hmSolve(6, false, { mist: 'none', start: [OPEN6] }).goals.length, '6階: 近道で 行ける');
  // 4階は 星くいのよる鳥を たおすまで 先へ 行けない・8階の ペンデュラは 千年前だけ
  for (const past0 of [false, true]) assert.equal(hmSolve(HM_BIRD_FLOOR, past0).goals.length, 0, '4階: 鳥の 前は とびらが しまっている');
  assert.ok(MAPS[hmMapId(8, true)].npcById.pendula_npc && !MAPS[hmMapId(8, false)].npcById.pendula_npc);
  for (const past0 of [false, true]) assert.ok(MAPS[hmMapId(4, past0)].npcById.star_eater_npc, '鳥は どちらの 時代にも');
  // もやの 本当の 道は つながっている・昼は もやと おなじ・夜と 星読みで 光る
  for (const n of [1, 3, 6]) {
    const R = MIST_ROUTES[n];
    const m = MAPS[hmMapId(n, false)];
    const [rx, ry] = R[1];
    assert.equal(effectiveTile(m, rx, ry, () => false), T.HM_MIST, `${n}階: 昼は もや`);
    assert.equal(effectiveTile(m, rx, ry, (f) => f === STARSIGHT), T.HM_ROUTE, '星読みで 光る');
    assert.equal(effectiveTile(m, rx, ry, (f) => f === '@night'), T.HM_ROUTE, '夜も 光る');
    assert.deepEqual(ROUTE_LEVELS.map(([f]) => f), [STARSIGHT, '@night']);
    assert.ok(m.mist.lost.size > 20 && !m.mist.lost.has(ry * m.w + rx));
  }
  // 宝箱は その 時代の どこかから 行ける
  for (let n = 1; n <= HM_FLOORS; n++) for (const past of [false, true]) {
    const cells = new Set();
    for (const past0 of [false, true]) for (const k of hmSolve(n, past0, { start: n === HM_BIRD_FLOOR ? [C6B.bird] : [] }).seen) cells.add(k.split(':').slice(0, 2).join(':'));
    for (const c of MAPS[hmMapId(n, past)].chests) assert.ok(D4.some(([dx, dy]) => cells.has(`${past ? 1 : 0}:${c.x + dx},${c.y + dy}`)), `${n}階 ${past ? '千年前' : '今'} 宝箱 ${c.id}`);
  }
});

test('過去で したことが 今に のこる: 2・7階の 石・3階の なえの 向き（今の 根の 橋）・5階の 星（今の 落ちた星が 消えて 光る 道しるべ）', () => {
  for (const n of [2, 7]) {
    const o = HM_STONES[n];
    const has = (f) => f === o.flags[1];
    for (const past of [false, true]) {
      const m = MAPS[hmMapId(n, past)];
      assert.equal(effectiveTile(m, o.track[0].x, o.track[0].y, () => false), T.BOULDER, `${n}階: はじめは ここ`);
      assert.equal(effectiveTile(m, o.track[1].x, o.track[1].y, has), T.BOULDER, `${n}階 ${past ? '千年前' : '今'}も おした 場所に`);
      assert.ok(!isBlocked(m, o.track[0].x, o.track[0].y, has));
    }
    assert.equal(effectiveTile(MAPS[hmMapId(n, false)], HM_POS[n].doors[0].x, HM_POS[n].doors[0].y, () => false), T.RUBBLE, '今は くずれた とびら');
    assert.ok(isBlocked(MAPS[hmMapId(n, true)], HM_POS[n].doors[0].x, HM_POS[n].doors[0].y, () => true), '千年前は しまった とびら');
    const w = HM_POS[n].doors[0];
    void w;
  }
  // 川と 谷
  const [wx, wy] = [5, 19];
  assert.equal(effectiveTile(MAPS.hoshimichi_2f, wx, wy, () => false), T.CAVE_WATER);
  assert.equal(effectiveTile(MAPS.hoshimichi_2f_past, wx, wy, () => false), T.DRY_VALLEY);
  assert.ok(isBlocked(MAPS.hoshimichi_2f, wx, wy, () => false) && !isBlocked(MAPS.hoshimichi_2f_past, wx, wy, () => false));
  // なえの 向き: 谷の 向き（南）の ときだけ 今の 根が 橋
  const B = HM_POS[3].bridge[1];
  for (const d of SAP_DIRS) {
    const has = (f) => f === SAP_FLAG(d);
    assert.equal(!isBlocked(MAPS.hoshimichi_3f, B.x, B.y, has), d === SAP_GOOD, `なえ ${d}`);
    assert.ok(isBlocked(MAPS.hoshimichi_3f_past, B.x, B.y, has), '千年前は 谷の まま');
  }
  assert.ok(MAPS.hoshimichi_3f.npcById.hm_big_tree?.big && !MAPS.hoshimichi_3f_past.npcById.hm_big_tree, '今は 大木');
  assert.equal(MAPS.hoshimichi_3f_past.tiles[HM_POS[3].tree.y * 40 + HM_POS[3].tree.x], T.YOUNG_TREE, '千年前は なえ');
  // 落ちた星
  const [q1] = HM_POS[5].meteor, P = HM_POS[5].post;
  const h5 = (f) => f === CATCH5;
  assert.equal(effectiveTile(MAPS.hoshimichi_5f, q1.x, q1.y, () => false), T.METEOR);
  assert.ok(!isBlocked(MAPS.hoshimichi_5f, q1.x, q1.y, h5), '星を 受けとめると 今は 通れる');
  assert.equal(effectiveTile(MAPS.hoshimichi_5f, P.x, P.y, h5), T.STAR_POST, '光る 道しるべ');
  assert.ok(!isBlocked(MAPS.hoshimichi_5f_past, q1.x, q1.y, () => false), '千年前は まだ 空');
  assert.equal(MAPS.hoshimichi_5f_past.tiles[HM_POS[5].catcher.y * 40 + HM_POS[5].catcher.x], T.STAR_CATCH);
});

// ───────────── ミナモの 星読み・星の もや（サーバー）─────────────
test('ミナモの 星読み: ミナモが いる ときだけ・しばらく 夜空が 見える（歩くと 消える）・星の もやの まちがいは 入口へ・夜は 星読みなしでも', { timeout: 120000 }, async () => {
  const { world, bot, c } = await setup(6501, 'c6_road');
  const P = HM_POS[1];
  const map = hmMapId(1, false);
  await place(bot, map, P.mistBack.x, P.mistBack.y);
  // まちがった もやを ふむと 入口へ
  const f0 = bot.msgs.length;
  const wrong = [P.mistBack.x + 1, P.mistBack.y - 1];
  assert.ok(MAPS[map].mist.lost.has(wrong[1] * 40 + wrong[0]));
  await stepOn(bot, P.mistBack.x, P.mistBack.y - 1);
  await stepOn(bot, ...wrong);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [P.mistBack.x, P.mistBack.y], 'もやの 入口へ もどる');
  assert.ok(toasted(bot, 'もやの中で、道にまよった', f0));
  // ミナモが いないと 使えない
  c.guests = [];
  world.sendSelf(bot.s);
  const f1 = bot.msgs.length;
  await useStars(bot);
  assert.ok(!c.flags[STARSIGHT] && toasted(bot, 'ミナモがいないと', f1), 'ミナモが いない');
  c.guests = ['minamo'];
  world.sendSelf(bot.s);
  // 使うと 夜空が 見える
  const f2 = bot.msgs.length;
  await useStars(bot);
  assert.ok(c.flags[STARSIGHT] && said(bot, 'ミナモが星を読んだ', f2), '星読み');
  const has = world.hasFlagFn(bot.s);
  const [rx, ry] = MIST_ROUTES[1][2];
  assert.equal(effectiveTile(MAPS[map], rx, ry, has), T.HM_ROUTE, '星の 道しるべが 光る');
  // 光る 道を 歩いて もやを ぬける
  await walkTo(bot, 20, 10);
  assert.ok(bot.s.y < 11.5, 'もやを ぬけた');
  // 歩くと 消える
  const f3 = bot.msgs.length;
  for (let i = 0; i < STAR_STEPS; i++) await stepOn(bot, 20 + (i % 2), 9);
  assert.ok(!c.flags[STARSIGHT] && toasted(bot, '夜空の星が、見えなくなった', f3), 'しばらくで 消える');
  // のこった フラグ（とちゅうで 切れた など）は 古道を 歩くと 消える
  c.flags[STARSIGHT] = true;
  bot.s.starSight = null;
  await stepOn(bot, 21, 8);
  assert.ok(!c.flags[STARSIGHT], 'のこった フラグは 消える');
  // 夜は 星読みが なくても 光る
  const { world: w2, bot: b2 } = await setup(6502, 'c6_road', { frac: 0.8 });
  await place(b2, map, P.mistBack.x, P.mistBack.y);
  assert.equal(effectiveTile(MAPS[map], rx, ry, w2.hasFlagFn(b2.s)), T.HM_ROUTE, '夜');
  for (const k of ['leader', 'busy', 'fly', 'none', 'lost', 'half', 'end']) assert.ok(STAR_TEXT[k], k);
});

// ───────────── ひとりで とく（サーバー。歩いて・時の砂時計で・しらべて）─────────────
test('ひとりで とく: 2階（千年前で 谷を わたって 石を おす → 今で とびらを ぬける）・3階（なえ → 根の 橋）・5階（星読みで 星を 受けとめる）', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(6511, 'c6_road');
  // 2階: 今から 入る → 千年前へ → 谷を わたって 石の 東へ → おす → 今へ → くずれた とびら → 下りかいだん
  {
    const a = hmArrive(2, false);
    await place(bot, a.map, Math.floor(a.x), Math.floor(a.y));
    await useGlass(bot);
    assert.equal(bot.s.map, hmMapId(2, true));
    const o = HM_STONES[2];
    await walkTo(bot, o.track[0].x + 1, o.track[0].y);
    await examine(bot, o.track[0].x, o.track[0].y);
    assert.ok(c.flags[o.flags[1]], '石を おした');
    await walkTo(bot, 20, 8);
    await useGlass(bot);
    assert.equal(bot.s.map, hmMapId(2, false), '今へ');
    const d = HM_POS[2].down;
    await walkTo(bot, d.x, d.y);
    assert.equal(bot.s.map, hmMapId(3, false), '3階へ');
  }
  // 3階: 千年前で なえを 南へ → 今の 根の 橋を わたる（もやは 星読みで）→ 休み所 → 下りかいだん
  {
    await useGlass(bot);
    const t = HM_POS[3].tree;
    await walkTo(bot, t.x - 1, t.y);
    bot.choice = 2; // 南へ
    await examine(bot, t.x, t.y);
    assert.ok(c.flags[SAP_FLAG('s')], 'なえを 南へ');
    // なえの となりは、今は 大木の 中（時を こえられない）。少し はなれてから
    const f0 = bot.msgs.length;
    await useGlass(bot);
    assert.ok(bot.s.map === hmMapId(3, true) && toasted(bot, 'かべの中', f0), '大木の 中には 出られない');
    await walkTo(bot, t.x - 3, t.y);
    await useGlass(bot);
    assert.equal(bot.s.map, hmMapId(3, false));
    await walkTo(bot, t.x, t.y + 6);
    assert.ok(bot.s.y > 11, '根の 橋を わたった');
    await useStars(bot);
    const d = HM_POS[3].down;
    await walkTo(bot, d.x, d.y);
    assert.equal(bot.s.map, hmMapId(4, false), '4階へ');
  }
  // 5階: 千年前の 星受けの台（昼は 星が 見えない → 星読みで 受けとめる）→ 今の 落ちた星が 消える → 下りかいだん
  {
    const a = hmArrive(5, true);
    await place(bot, a.map, Math.floor(a.x), Math.floor(a.y));
    delete c.flags[STARSIGHT];
    bot.s.starSight = null;
    const q = HM_POS[5].catcher;
    await walkTo(bot, q.x + 1, q.y);
    bot.choice = 0;
    const f0 = bot.msgs.length;
    await examine(bot, q.x, q.y);
    assert.ok(!c.flags[CATCH5] && said(bot, '昼の空には、星が見えない', f0), '昼は 受けとめられない');
    await useStars(bot);
    await examine(bot, q.x, q.y);
    assert.ok(c.flags[CATCH5], '星を 受けとめた');
    await walkTo(bot, 20, 10);
    await useGlass(bot);
    assert.equal(bot.s.map, hmMapId(5, false));
    const d = HM_POS[5].down;
    await walkTo(bot, d.x, d.y);
    assert.equal(bot.s.map, hmMapId(6, false), '6階へ');
  }
  // 今で 石を しらべても 動かない
  const { bot: b2 } = await setup(6512, 'c6_road');
  const o = HM_STONES[7];
  await place(b2, hmMapId(7, false), o.track[0].x - 1, o.track[0].y);
  const f1 = b2.msgs.length;
  await examine(b2, o.track[0].x, o.track[0].y);
  assert.ok(said(b2, 'びくともしない', f1) && !o.flags.some((f) => f && b2.s.char.flags[f]), '今は 動かない');
});

test('6階の 星の石: ひとり（千年前の 石で ミナモに 待ってもらう）・家族 2人（1人ずつ 別の 時代で。どちらが 先でも。ものがたりは リーダーだけ）', { timeout: 200000 }, async () => {
  const P = HM_POS[6];
  // ひとり
  {
    const { bot, c } = await setup(6521, 'c6_road');
    await place(bot, hmMapId(6, false), P.plate1.x, P.plate1.y - 1);
    const f0 = bot.msgs.length;
    await stepOn(bot, P.plate1.x, P.plate1.y);
    assert.ok(!c.flags[OPEN6] && said(bot, '千年前の、もう1つの星の石', f0), 'ひとりでは 開かない');
    await place(bot, hmMapId(6, true), P.plate2.x, P.plate2.y - 1);
    bot.choice = 0;
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(c.flags[WAIT6] && !c.flags[OPEN6], 'ミナモが 待つ');
    await useGlass(bot);
    await walkTo(bot, P.plate1.x, P.plate1.y);
    assert.ok(c.flags[OPEN6] && !c.flags[WAIT6], 'ミナモが 千年前の 石を おさえて 開いた');
    assert.ok(!isBlocked(MAPS.hoshimichi_6f, P.z.x, P.z.y, (f) => !!c.flags[f]) && !isBlocked(MAPS.hoshimichi_6f_past, P.z.x, P.z.y, (f) => !!c.flags[f]), 'どちらの 時代も 開く');
    await walkTo(bot, P.down.x, P.down.y);
    assert.equal(bot.s.map, hmMapId(7, false), '近道で 7階へ');
  }
  // ミナモが いない ひとりは 待ってもらえない（家族 2人か、ほかの 時代の 石を ふむ）
  {
    const { bot, c } = await setup(6522, 'c6_road', { minamo: false });
    await place(bot, hmMapId(6, true), P.plate2.x, P.plate2.y - 1);
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(!c.flags[WAIT6]);
  }
  // 家族: ユイが 今の 1、パパが 千年前の 2（ミナモには たのまない）
  for (const first of ['yui', 'papa']) {
    const { world, papa, yui, Pa, Y } = await family(first === 'yui' ? 6523 : 6524, 'c6_road');
    world.placeSession(Pa, hmMapId(6, true), P.plate2.x + 0.5, P.plate2.y - 0.5, 'down', true);
    world.placeSession(Y, hmMapId(6, false), P.plate1.x + 0.5, P.plate1.y - 0.5, 'down', true);
    await play(papa, { others: [yui] });
    papa.choice = 1; // ミナモに たのまない
    yui.choice = 1;
    const yFlags = JSON.stringify(Y.char.flags);
    const steps = first === 'yui' ? [[yui, P.plate1], [papa, P.plate2]] : [[papa, P.plate2], [yui, P.plate1]];
    for (const [b, p] of steps) await stepOn(b, p.x, p.y, { others: [b === papa ? yui : papa] });
    assert.ok(Pa.char.flags[OPEN6] && !Pa.char.flags[WAIT6], `${first}が 先: 2人で 開いた`);
    assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは かわらない');
  }
});

test('家族 2人で 古道の しかけ: 千年前の パパが 石を おすと、今の ユイの 前の とびらも 通れる（ものがたりは リーダーの 世界）', { timeout: 120000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(6531, 'c6_road');
  const o = HM_STONES[2];
  world.placeSession(Pa, hmMapId(2, true), o.track[0].x + 1.5, o.track[0].y + 0.5, 'left', true);
  world.placeSession(Y, hmMapId(2, false), 20.5, 27.5, 'up', true);
  await play(papa, { others: [yui] });
  await examine(papa, o.track[0].x, o.track[0].y, { others: [yui] });
  assert.ok(Pa.char.flags[o.flags[1]] && !Y.char.flags[o.flags[1]], 'リーダーの 世界で 石が 動く');
  assert.ok(yui.gateFlags.includes(o.flags[1]) || world.hasFlagFn(Y)(o.flags[1]), 'ユイの 世界でも 石が 動いた');
  // 時の砂時計「ひとりで」: パパだけ 今へ（ユイは のこる）・「みんなで」
  papa.choice = 1;
  world.placeSession(Y, hmMapId(2, true), o.track[0].x + 1.5, o.track[0].y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  await useGlass(papa, { others: [yui] });
  assert.equal(Pa.map, hmMapId(2, false));
  assert.equal(Y.map, hmMapId(2, true), 'ユイは 千年前に のこる');
});

// ───────────── 通しで ─────────────
async function fullRun(bot, c, fought) {
  const opts = { fought };
  const W = bot.world;
  // 千年前の 泉の里の ミナモ（c6_omen。夜・ゲスト）
  const M = MAPS[PAST_ID].npcById.minamo_home;
  await place(bot, PAST_ID, Math.floor(M.x), Math.floor(M.y) + 1);
  await talk(bot, 'minamo_home', opts);
  assert.ok(c.flags.c6_omen && c.guests.includes('minamo'), 'c6_omen・ミナモが ゲスト');
  // 星読みの社（c6_orih。ミナモの 星読み）
  const T0 = SHA.trigger;
  await place(bot, PAST_ID, T0.x + 4, T0.y + T0.h);
  await stepOn(bot, T0.x + 4, T0.y + T0.h - 1, opts);
  assert.ok(c.flags.c6_orih && c.keyItems.includes(STAR_ITEM), 'c6_orih・星読み');
  // 古道の 入口 → 1階（c6_road）
  await place(bot, PAST_ID, SHA.door.x, SHA.door.y + 1);
  await stepOn(bot, SHA.door.x, SHA.door.y, opts);
  assert.equal(bot.s.map, hmMapId(1, true));
  const a1 = hmArrive(1, true);
  await stepOn(bot, Math.floor(a1.x), Math.floor(a1.y) - 1, opts);
  assert.ok(c.flags.c6_road, 'c6_road');
  // 4階: 星くいのよる鳥（c6_bird）
  const B4 = HM_POS[4].trigger;
  await place(bot, hmMapId(4, false), 20, B4.y + 1);
  await stepOn(bot, 20, B4.y, opts);
  assert.ok(c.flags.c6_bird, 'c6_bird');
  assert.ok(!isBlocked(MAPS.hoshimichi_4f, HM_POS[4].g.x, HM_POS[4].g.y, W.hasFlagFn(bot.s)), '4階の とびらが 開いた');
  // 8階（千年前）: ペンデュラ（c6_pendula）→ 社で オリハの 星読み
  const B8 = HM_POS[8].trigger;
  await place(bot, hmMapId(8, true), 20, B8.y + 1);
  await stepOn(bot, 20, B8.y, opts);
  assert.ok(c.flags.c6_pendula && c.flags[END_P6], 'c6_pendula・オリハの 星読み');
  assert.equal(bot.s.map, PAST_ID, '社へ もどった');
  // 今の 星読みの里の カナタ（c6_kanata。ミナモは 千年前へ）
  const K = MAPS.hoshiyomi.npcById.kanata;
  await place(bot, 'hoshiyomi', Math.floor(K.x), Math.floor(K.y) + 1);
  await talk(bot, 'kanata', opts);
}
test('通しで: c6_flow → ミナモ → 星読みの社 → 古道 → 星くいのよる鳥 → ペンデュラ → オリハの 星読み → 今の カナタ（c6_kanata）', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(6601, 'c6_flow', { minamo: false, star: false });
  assert.equal(c.objective, C6_OBJ.flow);
  const fought = [];
  const from = bot.msgs.length;
  await fullRun(bot, c, fought);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['star_eater', 'pendula'], '戦い');
  for (const f of HM_STEP_FLAGS) assert.ok(c.flags[f], f);
  assert.equal(c.objective, C6B_OBJ.kanata);
  assert.equal(c.objective, '第6章の続きはアップデートで！');
  assert.ok(!c.guests.includes('minamo'), 'ミナモは はなれる（千年前へ 帰る）');
  assert.ok(!c.keyItems.includes(STAR_ITEM), '星読みも ミナモと いっしょに');
  for (const w of ['星と星をつなぐ線が、ぐにゃりと', 'ミナモが仲間に加わった', '星めぐりの古道', '星の道しるべを、食べている', 'ふりこの魔女ペンデュラ',
    'ひとつの紋章が、ひとりぼっちの星になる', '千年前の、星読みのむすめです', 'ミナモは、光の砂につつまれて', '第6章の続きはアップデートで！']) {
    assert.ok(said(bot, w, from), w);
  }
  for (const id of ['zenmai', 'boss6', 'hoshimichi', 'past_village']) assert.ok(said(bot, `"${id}"`, from), `曲 ${id}`);
  assert.ok(said(bot, '"showMon","star_eater"', from) && said(bot, '"showMon","pendula"', from), 'showMon');
  // クリアの あと: ミナモは 千年前の 家に もどる・ばあちゃん
  const has = (f) => !!c.flags[f];
  assert.ok(!condOk(MAPS[PAST_ID].npcById.minamo_home.show, has) && condOk(MAPS[PAST_ID].npcById.minamo_back.show, has));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('ひとりぼっちの星'));
});

test('負けた とき: 星くいのよる鳥・ペンデュラに 負けたら すすまない', { timeout: 120000 }, async () => {
  {
    const { bot, c } = await setup(6602, 'c6_road');
    const B4 = HM_POS[4].trigger;
    await place(bot, hmMapId(4, true), 20, B4.y + 1);
    const fought = [];
    await stepOn(bot, 20, B4.y, { fought, lose: () => true });
    assert.ok(fought.includes('star_eater') && !c.flags.c6_bird);
  }
  const { bot, c } = await setup(6603, 'c6_bird');
  const B8 = HM_POS[8].trigger;
  await place(bot, hmMapId(8, true), 20, B8.y + 1);
  const fought = [];
  await stepOn(bot, 20, B8.y, { fought, lose: () => true });
  assert.ok(fought.includes('pendula') && !c.flags.c6_pendula);
  assert.ok(condOk(MAPS.hoshimichi_8f_past.npcById.pendula_npc.show, (f) => !!c.flags[f]), 'ペンデュラは まだ いる');
  // 今の 8階には ペンデュラは いない（千年前へ）
  await place(bot, hmMapId(8, false), 20, B8.y + 2);
  const f0 = bot.msgs.length;
  await stepOn(bot, 20, B8.y + 1);
  assert.ok(said(bot, '千年前のほうから', f0));
});

// ───────────── とちゅうで 切れた とき ─────────────
test('とちゅうで 切れても だいじょうぶ: ペンデュラの あとの オリハの 場面・カナタの 場面の とちゅうで 切れても 続きが 見られる', { timeout: 300000 }, async () => {
  for (const [seed, where] of [[6701, 'altar'], [6702, 'oriha']]) {
    const { world, bot } = await setup(seed, 'c6_bird');
    const B8 = HM_POS[8].trigger;
    await place(bot, hmMapId(8, true), 20, B8.y + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = 20.5; bot.y = B8.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: 'ひとつの紋章が、ひとりぼっちの星になる', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags.c6_pendula && !c.flags[END_P6], `${where}: ペンデュラの あと・場面の とちゅう`);
    assert.equal(c.objective, C6B_OBJ.pendula);
    const f2 = b2.msgs.length;
    const fought = [];
    if (where === 'altar') {
      const A = HM_POS[8].altar;
      await place(b2, hmMapId(8, true), A.x, A.y + 1);
      await examine(b2, A.x, A.y, { fought });
    } else {
      const O = MAPS[PAST_ID].npcById.oriha;
      await place(b2, PAST_ID, Math.floor(O.x), Math.floor(O.y) + 1);
      await talk(b2, 'oriha', { fought });
    }
    assert.equal(fought.length, 0, 'もう 戦わない');
    assert.ok(said(b2, 'ひとつの紋章が、ひとりぼっちの星になる', f2), `${where}: 続き`);
    assert.ok(c.flags[END_P6] && c.objective === C6B_OBJ.endP && c.guests.includes('minamo'), 'ミナモは まだ いっしょ');
  }
  // カナタの 場面の とちゅう
  {
    const { world, bot } = await setup(6703, 'c6_pendula', { extra: [END_P6] });
    const K = MAPS.hoshiyomi.npcById.kanata;
    await place(bot, 'hoshiyomi', Math.floor(K.x), Math.floor(K.y) + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.send({ t: 'interact', kind: 'npc', id: 'kanata' });
    assert.equal(await play(bot, { stopAt: '時をこえて来た子らが', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(!c.flags.c6_kanata, `まだ c6_kanata の 前 ${JSON.stringify(c.guests)}`);
    assert.ok(c.guests.includes('minamo'), `ミナモは まだ いっしょ ${JSON.stringify(c.guests)}`);
    await place(b2, 'hoshiyomi', Math.floor(K.x), Math.floor(K.y) + 1);
    await talk(b2, 'kanata');
    assert.ok(c.flags.c6_kanata && !c.guests.includes('minamo') && c.objective === C6B_OBJ.kanata, 'もう一度 話すと 続き');
  }
  // どこからでも おなじ 続き
  const x = ctx(flagsOf(...UPTO('c6_pendula')));
  const want = JSON.stringify(endingFromP(x));
  assert.ok(want.length > 20);
  for (const id of ['c6_haltar', 'c6_oriha']) assert.ok(JSON.stringify(SCRIPTS[id](x)).includes(want.slice(1, -1)), id);
  assert.deepEqual(endingFromP(ctx(flagsOf(...UPTO('c6_pendula'), END_P6))), []);
});

test('家族で: ミナモの 場面・社・鳥の 戦いは いっしょに。ものがたりは リーダーだけ すすむ', { timeout: 200000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(6801, 'c6_flow');
  const yFlags = JSON.stringify(Y.char.flags);
  const M = MAPS[PAST_ID].npcById.minamo_home;
  world.placeSession(Pa, PAST_ID, M.x + 0.5, M.y + 1.5, 'up', true);
  world.placeSession(Y, PAST_ID, M.x + 1.5, M.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fy = yui.msgs.length;
  await talk(yui, 'minamo_home', { others: [papa] });
  assert.ok(Pa.char.flags.c6_omen && Pa.char.guests.includes('minamo') && !Y.char.flags.c6_omen, 'リーダーの ものがたり');
  assert.ok(yui.msgs.slice(fy).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('ぐにゃりと')), 'ユイも 見た');
  // 4階の 鳥: いっしょに 戦う
  Pa.char.flags.c6_orih = true; Pa.char.flags.c6_road = true;
  const B4 = HM_POS[4].trigger;
  world.placeSession(Pa, hmMapId(4, false), 20.5, B4.y + 1.5, 'up', true);
  world.placeSession(Y, hmMapId(4, false), 21.5, B4.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fought = [];
  await stepOn(papa, 20, B4.y, { others: [yui], fought });
  assert.ok(fought.includes('star_eater') && yui.battles.length >= 1 && Pa.char.flags.c6_bird, 'いっしょに 戦った');
  assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは そのまま');
});

// ───────────── より道（サブクエスト）─────────────
test('より道: c6_flow の あとから。時のタイムカプセル 3つ（千年前で うめる → 今で ほる → ばあちゃん）', { timeout: 300000 }, async () => {
  // c6_flow の 前は たのまれない
  assert.equal(JSON.stringify(SCRIPTS.c6_p_vil2(ctx(flagsOf(...UPTO('c6_gear'))))).includes('うめたい'), false);
  const { world, bot, c } = await setup(6901, 'c6_flow');
  const items = (id) => (c.items || []).filter((i) => i.id === id).reduce((s, i) => s + i.n, 0);
  for (const k of [1, 2, 3]) {
    const ask = MAPS[PAST_ID].npcById[TC_ASKERS[k]];
    // たのむ 人は うろうろ するので、その 人の となりへ
    const st = world.npcStates?.get?.(`${PAST_ID}:${ask.id}`);
    void st;
    await place(bot, PAST_ID, Math.floor(ask.x), Math.floor(ask.y) + 1);
    bot.choice = 0;
    await talk(bot, ask.id);
    assert.ok(c.flags[TC.start(k)], `${k}: たのまれた`);
    // クエストの 画面・しるし（千年前の うめる 所）
    const q = ch6SubQuests(c, (f) => !!c.flags[f], (id) => c.keyItems.includes(id)).find((x) => x.name.includes('タイムカプセル'));
    assert.ok(q && q.find === `tc_bury_${k}`, `${k}: うめる 所の しるし`);
    const sp = TC_SPOTS[k];
    assert.ok(questMarks(c, PAST_ID).some((m) => m.x === sp.x && m.y === sp.y && m.kind === 'sub'), `${k}: 地図の しるし（千年前）`);
    await place(bot, PAST_ID, sp.x, sp.y + 1);
    bot.choice = 0;
    await talk(bot, `tc_bury_${k}`);
    assert.ok(c.flags[TC.bury(k)], `${k}: うめた`);
    assert.ok(questMarks(c, 'overworld').some((m) => m.x === sp.x && m.y === sp.y && m.kind === 'subReady'), `${k}: 今の ほる 所の しるし`);
    assert.ok(!MAPS[PAST_ID].npcById[`tc_dig_${k}`] && MAPS.overworld.npcById[`tc_dig_${k}`], 'ほる 所は 今だけ');
    await place(bot, 'overworld', sp.x, sp.y + 1);
    bot.choice = 0;
    await talk(bot, `tc_dig_${k}`);
    assert.ok(c.flags[TC.dug(k)], `${k}: ほった`);
  }
  assert.ok(items('c6s_hoshi_charm') === 1 && items('c6s_star_hairpin') === 1 && items('seed_hp') >= 2, 'カプセルの 品');
  assert.ok(sideQuestHint(c)?.includes('ばあちゃん'), '「はなす」の ヒント');
  const E = MAPS.overworld.npcById.elder;
  await place(bot, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
  await talk(bot, 'elder');
  assert.ok(c.flags[TC.done] && items('c6s_locket') === 1, 'ばあちゃんの ごほうび');
  const done = labDoneQuests(c);
  for (const n of ['時のタイムカプセル（ホシフルの里）', '時のタイムカプセル（泉の里）', '時のタイムカプセル（星読みの社）', '時のタイムカプセル（ばあちゃんのごほうび）']) assert.ok(done.includes(n), n);
  assert.ok(!subQuests(c).some((q) => q.name.includes('タイムカプセル')), 'クエストの 画面から 消える');
});

test('より道: 千年前のレシピ（今の コック → 千年前の おくさん → 今の コック → 道具屋に 星祭りのごちそう）・ちびアステルのたからもの（きらきらの石 5つ → 今の アステル）', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(6902, 'c6_flow');
  const items = (id) => (c.items || []).filter((i) => i.id === id).reduce((s, i) => s + i.n, 0);
  // レシピ
  const cook = MAPS.overworld.npcById.cook;
  await place(bot, 'overworld', Math.floor(cook.x) - 1, Math.floor(cook.y));
  bot.choice = 0;
  await talk(bot, 'cook');
  assert.ok(c.flags[RC.start], 'コックに たのまれた');
  assert.ok(subQuests(c).some((q) => q.name === '千年前のレシピ' && q.find === 's_w1'), '千年前の おくさんの しるし');
  const W1 = MAPS[PAST_ID].npcById.s_w1;
  await place(bot, PAST_ID, Math.floor(W1.x), Math.floor(W1.y) + 1);
  await talk(bot, 's_w1');
  assert.ok(c.flags[RC.learn] && c.keyItems.includes('c6s_old_recipe'), 'レシピを 教わった');
  assert.ok(subQuests(c).some((q) => q.name === '千年前のレシピ' && q.ready));
  assert.ok(!shopItems(SHOPS.item, (f) => !!c.flags[f]).includes('c6s_feast'), 'まだ 店に ない');
  await place(bot, 'overworld', Math.floor(cook.x) - 1, Math.floor(cook.y));
  await talk(bot, 'cook');
  assert.ok(c.flags[RC.done] && !c.keyItems.includes('c6s_old_recipe') && items('c6s_feast') === 3, 'ごちそう');
  assert.ok(shopItems(SHOPS.item, (f) => !!c.flags[f]).includes('c6s_feast'), 'ルミナの町の 道具屋に ならぶ');
  // ちびアステル
  const ch = MAPS[PAST_ID].npcById.chibi_astel;
  await place(bot, PAST_ID, Math.floor(ch.x), Math.floor(ch.y) + 1);
  await talk(bot, 'chibi_astel');
  assert.ok(c.flags[CT.start]);
  for (let i = 1; i <= KIRA_SPOTS.length; i++) {
    const q = subQuests(c).find((x) => x.name === 'ちびアステルのたからもの');
    assert.equal(q.find, `kira_${i}`, `しるしは つぎの 石 ${i}`);
    const p = KIRA_SPOTS[i - 1];
    await place(bot, PAST_ID, p.x, p.y + 1);
    await talk(bot, `kira_${i}`);
    assert.ok(c.flags[CT.stone(i)], `石 ${i}`);
  }
  await place(bot, PAST_ID, Math.floor(ch.x), Math.floor(ch.y) + 1);
  await talk(bot, 'chibi_astel');
  assert.ok(c.flags[CT.given], 'わたした');
  assert.ok(questMarks(c, 'overworld').some((m) => m.kind === 'subReady' && Math.abs(m.x - ASTEL_SPOT.x) <= 1), '今の アステルの しるし');
  await place(bot, 'overworld', ASTEL_SPOT.x - 2, ASTEL_SPOT.y + 1);
  await talk(bot, 'astel_c6');
  assert.ok(c.flags[CT.done] && items('c6s_astel_scale') === 1, '竜の うろこ');
  for (const n of ['千年前のレシピ', 'ちびアステルのたからもの']) assert.ok(labDoneQuests(c).includes(n), n);
  assert.equal(CH6_SIDE_QUESTS.length, 6);
});

test('より道は 家族でも: ユイが 話しかけても リーダーの 世界で すすむ', { timeout: 120000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(6903, 'c6_flow');
  const ask = MAPS[PAST_ID].npcById.kotoha;
  world.placeSession(Pa, PAST_ID, Math.floor(ask.x) + 0.5, Math.floor(ask.y) + 1.5, 'up', true);
  world.placeSession(Y, PAST_ID, Math.floor(ask.x) + 1.5, Math.floor(ask.y) + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  yui.choice = 0;
  await talk(yui, 'kotoha', { others: [papa] });
  assert.ok(Pa.char.flags[TC.start(3)] && !Y.char.flags[TC.start(3)]);
});

// ───────────── 文字・絵・音 ─────────────
test('文字: 第6章 Step 3・4 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-ch6b.js', 'public/js/shared/data/sidequests-ch6.js', 'public/js/shared/data/items-ch6-side.js', 'public/js/shared/data/ch6b-stub.js',
    'public/js/shared/maps/hoshimichi.js', 'public/js/shared/maps/hoshimichi-rows.js', 'public/js/shared/maps/ch6-side.js', 'public/js/shared/world/star-sight.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => k.startsWith('c6_')).map(([, fn]) => { try { return fn(ctx(flagsOf(...UPTO('c6_pendula')))); } catch { return []; } }));
  assert.ok(!/\d+さい|\d+年生/.test(all), '年を 言わない');
  assert.ok(!/[祠跡苗扉苔]/.test(all), '使えない 漢字');
  assert.ok(all.includes('星読みの社'), '社は 使える 漢字');
});

test('絵と 音: 古道の タイル（2D は 16×16 を ぬる・2.5D）・テーマ・人の え・古道の 曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec } = await import('../public/js/client/render/tiles-ch6.js');
  const { HM_PAINTERS } = await import('../public/js/client/render/tiles-hoshimichi.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { paintHuman, npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const mine = Object.keys(HM_PAINTERS).map(Number);
  assert.deepEqual(mine.sort((a, b) => a - b), [280, 281, 282, 283, 284, 285, 286, 287, 288]);
  for (const id of mine) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id) && TILE_INFO[id], `${id}`);
    assert.equal(partOfTile(id), 'none', '色を かえない');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  for (const id of [T.HM_ROUTE, T.STAR_POST]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name} が 動く`);
  }
  for (const id of [T.YOUNG_TREE, T.STAR_POST, T.STAR_CATCH]) assert.ok(CH6_PROPS[id] && PROP_TILES.has(id), `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(ch6BlockSpec(T.METEOR, 0)?.h > 0.5, '2.5D の 落ちた星');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...HM_MAPS, PAST_ID, 'overworld']) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const th of ['hoshimichi', 'hoshimichi_past']) assert.notDeepEqual(themeRgb(0x80, 0x80, 0x80, th, 'wall'), [0x80, 0x80, 0x80], th);
  assert.ok(MAPS.hoshimichi_1f.dusk?.flag === STARSIGHT, '星読みの 間は 夜空の 色');
  // 人の え
  for (const k of ['oriha', 'kotoha']) for (const dir of ['down', 'up', 'left']) assert.ok(npcOpts(k) && paintHuman(dir, 0, npcOpts(k)).px.some(Boolean), `${k} ${dir}`);
  for (const k of ['star_eater_npc', 'pendula_npc', 'capsule_hole', 'capsule_spot', 'kira_stone']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  assert.notEqual(paintSpecial('pendula_npc', 'down', 0).px.join(), paintSpecial('pendula_npc', 'down', 1).px.join(), 'ふりこが ゆれる');
  const sprites = new Set();
  for (const id of [...HM_MAPS, PAST_ID, 'overworld']) for (const n of MAPS[id].npcs) if (/^(oriha|kotoha|star_eater|pendula|tc_|kira|astel_c6|hm_)/.test(n.id)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0) || s.startsWith('mon:'), `人の え ${s}`);
  // 曲
  const tr = _TRACKS.hoshimichi;
  assert.ok(tr && tr.ch.length >= 3 && tr.ch.length <= 4);
  const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
  assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${lens}`);
  for (const ch of tr.ch) {
    if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum));
    else assert.ok(_parse(ch.n).every((n) => n.f === 0 || n.f > 20));
  }
  const mel = Object.values(_TRACKS).map((t) => t.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
});
