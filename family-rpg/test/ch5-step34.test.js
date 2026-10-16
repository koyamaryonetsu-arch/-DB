// 第5章「空にうかぶ大地」Step 3・4（A: 世界と物語）
// 天のとばりが 開いた あと（c5_sky）→ 竜で「雲の上」→ クモイ地方（c5_kumoi）→ ハネノの町 → 長ソラネ（c5_hanono）→ ピピ（c5_pipi。ノクトの 名前）
// → 風の道と 風見の石 → しずみゆく島の 古い 神殿（c5_ruin。7階・下へ 下へ）→ ガイアイーター（c5_gaia）→ 守り星の かけら（c5_shard）
// 島と 神殿の 魔物・gaia_eater の 戦いの しくみ・品は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach, carry } from '../public/js/shared/maps/flow.js';
import {
  K5, HANONO_SEEN, KUMOI_VANES, KUMOI_JUNCTIONS, KUMOI_WINDS, KUMOI_POS, KUMOI_SKY, KUMOI_ISLES, KUMOI_TOWNS, HANONO_POS, KUMOI_MAPS,
} from '../public/js/shared/maps/kumoi.js';
import {
  RF, RUIN_FLOORS, RUIN_MAPS, RUIN_POS, RUIN_OUT, RUIN_SIGHTS, RUIN_REST, TILTS, SCALES, LADDER_FLAG, ruinMapId, ruinTable, ruinTheme,
} from '../public/js/shared/maps/sink-ruin.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH5_STEPS, C5_OBJ, OLD_C5_OBJ, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch5.js';
import { KUMOI_STEPS, KUMOI_OBJ, KUMOI_STORY_SCRIPTS } from '../public/js/shared/data/story-kumoi.js';
import { KUMOI_SHOP_WEAPONS, KUMOI_SHOP_ARMOR, KUMOI_SHOP_TOOLS, RUIN_TREASURE } from '../public/js/shared/data/items-kumoi.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { SKY_MAPS, veilState, regionsFrom, skyBox, inSkyBox, regionOpen } from '../public/js/shared/data/sky.js';
import { DAY_MS, isNightFor } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { warpPlaces } from '../public/js/shared/world/travel.js';
import { warpDest } from '../public/js/shared/world/services.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h) => (h - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const toast = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'toast' && m.text.includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const ALL_K = [...Object.values(KUMOI_VANES)];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto, extra = [], frac = hour(10)) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (!c.keyItems.includes('wind_flute')) c.keyItems.push('wind_flute');
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 45);
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

// 戦いは テストの 中で きめる（win … 敵を ぜんぶ たおす / lose … みかたが ぜんぶ たおれる）
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
async function play(bot, { lose = () => false, fought = null, max = 40000, others = [] } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
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
// その 世界で 歩いて 行ける マス（ふさがった ワープの マスには 入れない。ワープの 先へは 行かない）
function reach(id, start, flags) {
  const m = MAPS[id];
  const has = (f) => flags.includes(f);
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k)) continue;
      if (isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r(p.x + dx, p.y + dy));
// 神殿の 階の 入口（上の 階から 下りてきた ところ。1階は 外からの 入口）
const arrive = (n) => (n === 1 ? [14, 19] : [RUIN_POS[n].up.x, RUIN_POS[n].up.y + 1]);
const ALL_RUIN = [...Object.values(SCALES).map((s) => s.flag), LADDER_FLAG];
const kumoiStops = (flags, start = [59, 33]) => flowReach(MAPS.kumoi, start, (f) => flags.includes(f)).stops;

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c5_sky → c5_kumoi … c5_shard（名前の 約束）。目標・仲間会話・地図の しるし・Step 2 の さいごの 文の なおし', () => {
  assert.deepEqual(KUMOI_STEPS, ['c5_kumoi', 'c5_hanono', 'c5_pipi', 'c5_ruin', 'c5_gaia', 'c5_shard'], '名前の 約束（plan-ch5.md の 13）');
  const si = CH5_STEPS.indexOf('c5_sky');
  assert.deepEqual(CH5_STEPS.slice(si + 1), KUMOI_STEPS, 'c5_sky の うしろに つづく');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c5_sky') + 1, STORY_STEPS.indexOf('c5_sky') + 7), KUMOI_STEPS);
  const f = (...l) => ({ flags: flagsOf(...UPTO('c5_sky'), ...l) });
  // Step 2 の さいごの 文（「第5章の続きはアップデートで！…」）は Step 3 の 文に なおる
  assert.equal(objectiveFromFlags(f()), C5_OBJ.sky);
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C5_OBJ.sky));
  const old = { flags: f().flags, objective: OLD_C5_OBJ.sky };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C5_OBJ.sky);
  // フラグごとの 目標
  const seq = [
    [['c5_kumoi'], 'kumoi'], [['c5_kumoi', HANONO_SEEN], 'town'], [['c5_hanono'], 'hanono'], [['c5_pipi'], 'pipi'], [['c5_ruin', RF(1)], 'ruin'],
    ...[2, 3, 4, 5, 6, 7].map((n) => [['c5_ruin', ...[2, 3, 4, 5, 6, 7].filter((k) => k <= n).map(RF)], `r${n}`]),
    [['c5_gaia'], 'gaia'], [['c5_shard'], 'shard'],
  ];
  for (const [fl, k] of seq) assert.equal(objectiveFromFlags(f(...UPTO(fl[0]).filter((x) => x.startsWith('c5_')), ...fl)), KUMOI_OBJ[k], k);
  // Step 4 の さいごは「第5章の続きはアップデートで！」
  assert.ok(KUMOI_OBJ.shard.startsWith('第5章の続きはアップデートで！'));
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries(KUMOI_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  assert.ok(talkFor(C5_OBJ.sky, 'self').includes('雲の上'), 'c5_sky の あとの ヒント');
  // ヒント: 風見の石・かたむきの石・てんびん（岩・仲間）・縄ばしご
  assert.ok(talkFor(KUMOI_OBJ.pipi, 'self').includes('風見の石'));
  assert.ok(talkFor(KUMOI_OBJ.r2, 'self').includes('かたむきの石'));
  assert.ok(talkFor(KUMOI_OBJ.r3, 'self').includes('岩') && talkFor(KUMOI_OBJ.r6, 'self').includes('仲間'));
  assert.ok(talkFor(KUMOI_OBJ.r5, 'self').includes('縄ばしご'));
  // 地図の しるし: クモイ地方では 町の 門・風の道の のりばと 風見の石（すんだら 消える）、町では 長・ピピ、神殿では しかけと かいだん
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c5_sky'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(KUMOI_OBJ.kumoi, 'kumoi').some((m) => m.x === KUMOI_POS.gate[0].x && m.y === KUMOI_POS.gate[0].y), '町の 門');
  assert.ok(mark(KUMOI_OBJ.town, 'hanono').some((m) => m.x === HANONO_POS.sorane.x), '長ソラネ');
  assert.ok(mark(KUMOI_OBJ.hanono, 'hanono').some((m) => m.x === HANONO_POS.pipi.x), 'ピピ');
  const v1 = KUMOI_POS[KUMOI_JUNCTIONS.j1.vane];
  assert.ok(mark(KUMOI_OBJ.pipi, 'kumoi').some((m) => m.x === v1.x && m.y === v1.y), '風見の石');
  assert.ok(!mark(KUMOI_OBJ.pipi, 'kumoi', [KUMOI_VANES.v1]).some((m) => m.x === v1.x && m.y === v1.y), '回した 風見の石の しるしは 消える');
  assert.ok(mark(KUMOI_OBJ.pipi, 'hanono').length, '町の 中からも 門へ');
  assert.ok(mark(KUMOI_OBJ.r2, ruinMapId(2)).some((m) => m.x === TILTS.f2.lever.x), 'かたむきの石');
  assert.ok(mark(KUMOI_OBJ.r6, ruinMapId(6)).some((m) => m.x === SCALES.f6.a.x), 'てんびんの 皿');
  assert.ok(mark(KUMOI_OBJ.r7, ruinMapId(7)).length, 'ガイアイーター');
  assert.ok(mark(KUMOI_OBJ.ruin, 'kumoi').length, 'クモイ地方から 神殿へ');
  // パーティー全員で 見る だいほん
  for (const id of KUMOI_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
});

// ───────────── 雲の上へ・クモイ地方 ─────────────
test('雲の上: とばりが 開くと 竜で「雲の上」→ クモイ地方（はじめは だいほん c5_kumoi）。竜が 飛べるのは ハネノの島の 上だけ（c5_shard から どこでも）。地上へも もどれる', { timeout: 60000 }, async () => {
  assert.ok(SKY_MAPS.kumoi && SKY_MAPS.kumoi.aboveVeil, 'とばりの 上の 地方');
  assert.ok(regionOpen('kumoi', (f) => f === 'c5_sky'));
  assert.ok(!regionsFrom('overworld', () => true).includes('kumoi'), '地上の 地方の ならびには 出ない（「雲の上」で 行く）');
  assert.deepEqual(regionsFrom('kumoi', () => true), ['overworld', 'sea', 'north', 'south'], '雲の上から 地上へ');
  assert.equal(veilState((f) => ['c5_wings', 'c5_veil', 'c5_sky'].includes(f)), 'open');
  // 竜が 飛べる 所
  const box0 = skyBox('kumoi', () => false);
  assert.deepEqual([box0.x, box0.y, box0.w, box0.h], [KUMOI_SKY.x, KUMOI_SKY.y, KUMOI_SKY.w, KUMOI_SKY.h]);
  assert.ok(inSkyBox(box0, KUMOI_POS.arrive.x, KUMOI_POS.arrive.y), '来た 所は ハネノの島の 上');
  assert.ok(!inSkyBox(box0, KUMOI_ISLES.sink.cx, KUMOI_ISLES.sink.cy), 'しずみゆく島の 上は 風が あれて 飛べない');
  assert.equal(skyBox('kumoi', (f) => f === 'c5_shard'), null, 'かけらの あとは どこでも');

  const { world, bot, c } = await setup(6101, 'c5_sky');
  await place(bot, 'overworld', 28, 84);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying);
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot);
  assert.equal(bot.s.map, 'kumoi', 'クモイ地方へ');
  assert.ok(bot.s.flying, '竜の 上');
  assert.ok(c.flags.c5_kumoi, 'c5_kumoi');
  assert.ok(said(bot, '雲の海') && said(bot, 'しずんでいる'));
  assert.equal(c.objective, KUMOI_OBJ.kumoi);
  assert.ok(Math.abs(bot.s.x - KUMOI_POS.arrive.x) < 1.5 && Math.abs(bot.s.y - KUMOI_POS.arrive.y) < 1.5);
  // 2回目は ことばだけ（だいほんは 出ない）
  bot.send({ t: 'fly', action: 'region', to: 'overworld' });
  await play(bot);
  assert.equal(bot.s.map, 'overworld', '地上へ もどれる');
  const from = bot.msgs.length;
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot);
  assert.equal(bot.s.map, 'kumoi');
  assert.ok(toast(bot, '雲の上', from) && !said(bot, '雲の海が広がっていた', from));
  // 竜で おりられるのは 島の 上（雲の 海の 上は だめ）。町の 中では 笛を ふけない
  bot.send({ t: 'fly', action: 'land' });
  await play(bot);
  assert.ok(!bot.s.flying, 'ハネノの島の 降り場に おりた');
  assert.equal(TILE_INFO[MAPS.kumoi.tiles[Math.floor(bot.s.y) * MAPS.kumoi.w + Math.floor(bot.s.x)]].solid, false);
  await place(bot, 'hanono', HANONO_POS.arrive.x, HANONO_POS.arrive.y - 2);
  const f2 = bot.msgs.length;
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying && toast(bot, '町の中にはおりられない', f2), '町の 中では よべない');
  // しずみゆく島の 上では 笛を ふいても 竜は 来られない（c5_shard まで）
  await place(bot, 'kumoi', 16, 38);
  const f3 = bot.msgs.length;
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying && toast(bot, 'ハネノの島', f3));
  c.flags.c5_shard = true;
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, 'かけらの あとは どこでも');
});

test('クモイ地方の マップ: 雲の 海に うかぶ 島・しずむ 見た目・風の道と 風見の石で 島めぐり（どこへ 流されても ハネノの島へ 帰れる）', () => {
  const m = MAPS.kumoi;
  assert.equal(m.kind, 'field');
  assert.equal(m.bgm, 'kumoi');
  assert.equal(m.outside, 'cloud');
  assert.ok(ENCOUNTER_TABLES.t5_kumoi && m.spawnCounts.t5_kumoi > 0, '島の 魔物（B の t5_kumoi）');
  // 島が しずんでいる 見た目（ふちが 雲に とける・かたむいた 木と 柱）
  for (const t of [T.CLOUD_SEA, T.CLOUD_RIM, T.TILT_TREE, T.TILT_PILLAR, T.RUIN_WALL]) assert.ok(m.tiles.includes(t), TILE_INFO[t].name);
  const S = KUMOI_ISLES.sink;
  let tilt = 0;
  for (let y = S.cy - S.ry; y < S.cy + S.ry; y++) for (let x = S.cx - S.rx; x < S.cx + S.rx; x++) if ([T.TILT_TREE, T.TILT_PILLAR].includes(m.tiles[y * m.w + x])) tilt++;
  assert.ok(tilt >= 5, `しずみゆく島に かたむいた 木と 柱 ${tilt}`);
  // 雲の 海は 歩けない・風の道は 流される
  assert.ok(TILE_INFO[T.CLOUD_SEA].solid);
  for (const id of [T.SKYWIND_N, T.SKYWIND_E, T.SKYWIND_S, T.SKYWIND_W]) assert.ok(TILE_INFO[id].flow && !TILE_INFO[id].solid);
  // 流された 先は いつも 島の 地面（ぐるぐる まわらない）
  for (const fl of [[], [KUMOI_VANES.v1], [KUMOI_VANES.v2], ALL_K]) {
    const has = (f) => fl.includes(f);
    for (const cells of Object.values(KUMOI_WINDS)) for (const [x, y] of cells) {
      const r = carry(m, x, y, has);
      assert.ok(!r.loop, `${x},${y}`);
      assert.ok(!TILE_INFO[effectiveTile(m, r.x, r.y, has)].flow, `${x},${y} → ${r.x},${r.y} は 島の 上 (${fl})`);
    }
  }
  // 島めぐり: ハネノの島 → 風見の小島（石1）→ 西の風見の小島（石2）→ しずみゆく島
  const door = [RUIN_OUT.door.x, RUIN_OUT.door.y + 1];
  const has1 = (p) => `${p[0]},${p[1]}`;
  const v1 = KUMOI_POS.vane1, v2 = KUMOI_POS.vane2;
  assert.ok(!kumoiStops([]).has(has1(door)), '風見の石を 回さないと しずみゆく島へ 行けない');
  assert.ok(near((x, y) => kumoiStops([]).has(`${x},${y}`), v1), '風見の小島へは 行ける');
  assert.ok(!near((x, y) => kumoiStops([]).has(`${x},${y}`), v2), '石1を 回すまで 西の小島へは 行けない');
  assert.ok(near((x, y) => kumoiStops([KUMOI_VANES.v1]).has(`${x},${y}`), v2), '石1で 西の風見の小島へ');
  assert.ok(!kumoiStops([KUMOI_VANES.v1]).has(has1(door)), '石2を 回すまで しずみゆく島へは 行けない');
  assert.ok(!kumoiStops([KUMOI_VANES.v2]).has(has1(door)), '石2だけでは 行けない');
  assert.ok(kumoiStops(ALL_K).has(has1(door)), '2つ 回すと しずみゆく島の 神殿の 前へ');
  assert.ok(kumoiStops([]).has('34,11') || near((x, y) => kumoiStops([]).has(`${x},${y}`), { x: 34, y: 11 }), '小さなうき島の 宝箱');
  // どこへ 流されても、ハネノの島へ 帰れる（とじこめられない）
  for (const fl of [[], [KUMOI_VANES.v1], [KUMOI_VANES.v2], ALL_K]) {
    const all = kumoiStops(ALL_K);
    for (const k of all) {
      const [x, y] = k.split(',').map(Number);
      // その 場所から、風見の石を 回しながら（どの 向きでも）帰れる
      const back = [[], [KUMOI_VANES.v1], [KUMOI_VANES.v2], ALL_K].some((g) => kumoiStops(g, [x, y]).has('59,33'));
      assert.ok(back, `${k} から 帰れる (${fl})`);
    }
  }
  // 町の 門 → ハネノの町・神殿の 入口 → 1階
  for (const g of KUMOI_POS.gate) assert.equal(m.warps.find((w) => w.x === g.x && w.y === g.y).to.map, 'hanono');
  assert.equal(m.warps.find((w) => w.x === RUIN_OUT.door.x && w.y === RUIN_OUT.door.y).to.map, ruinMapId(1));
  // 雲から 出てくる 島（c5_shard）・魔物の 出ない 所
  const R = KUMOI_ISLES.rise;
  assert.equal(effectiveTile(m, R.cx, R.cy, () => false), T.CLOUD_SEA);
  assert.ok(!TILE_INFO[effectiveTile(m, R.cx, R.cy, (f) => f === 'c5_shard')].solid, 'かけらの あと 雲から 出てくる');
  assert.ok(m.zoneAt(KUMOI_POS.gate[0].x, KUMOI_POS.gate[0].y + 2).startsWith('safe'));
  assert.ok(m.zoneAt(RUIN_OUT.door.x, RUIN_OUT.door.y + 1).startsWith('safe'));
  assert.equal(m.zoneAt(KUMOI_ISLES.vane1.cx - 2, KUMOI_ISLES.vane1.cy + 2), 't5_kumoi');
  assert.deepEqual(KUMOI_MAPS, ['kumoi', 'hanono']);
});

test('風見の石: 回すと 曲がり角の 風の 向きが かわる（もう 1回で もどる）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(6201, 'c5_pipi');
  const J = KUMOI_JUNCTIONS.j1, V = KUMOI_POS.vane1;
  assert.equal(effectiveTile(MAPS.kumoi, J.x, J.y, () => false), T.SKYWIND_N);
  await place(bot, 'kumoi', V.x, V.y + 1);
  await examine(bot, V.x, V.y);
  assert.ok(c.flags[J.flag], '回した');
  assert.equal(effectiveTile(MAPS.kumoi, J.x, J.y, world.hasFlagFn(bot.s)), T.SKYWIND_W);
  assert.equal(effectiveTile(MAPS.kumoi, V.x, V.y, world.hasFlagFn(bot.s)), T.VANE_ON);
  assert.ok(said(bot, '北から西へ'));
  await examine(bot, V.x, V.y);
  assert.ok(!c.flags[J.flag], 'もう 1回で もどる');
  assert.equal(effectiveTile(MAPS.kumoi, J.x, J.y, world.hasFlagFn(bot.s)), T.SKYWIND_N);
});

// ───────────── ハネノの 町 ─────────────
test('ハネノの町: 門番 → 長ソラネ（c5_hanono）→ ピピ（c5_pipi。ノクトの 名前は ここで 初めて）・宿屋・教会・店（ランク8の ならび）・ルーラの 行き先', { timeout: 60000 }, async () => {
  const m = MAPS.hanono;
  assert.equal(m.kind, 'field');
  assert.equal(m.bgm, 'hanono');
  assert.ok(!SKY_MAPS.hanono, '町の 中は 竜が 来ない');
  // 店（B の ならび。data/items-kumoi.js）
  assert.deepEqual(SHOPS.hanono_weapon.items, KUMOI_SHOP_WEAPONS);
  assert.deepEqual(SHOPS.hanono_armor.items, KUMOI_SHOP_ARMOR);
  assert.deepEqual(SHOPS.hanono_item.items, KUMOI_SHOP_TOOLS);
  for (const k of ['hanono_weapon', 'hanono_armor', 'hanono_item']) for (const id of shopItems(SHOPS[k])) assert.ok(ITEMS[id]?.price > 0, `${k}: ${id}`);
  assert.deepEqual(SCRIPTS.c5_shop_hw(ctx({})), [['shop', 'hanono_weapon']]);
  assert.deepEqual(SCRIPTS.c5_shop_ha(ctx({})), [['shop', 'hanono_armor']]);
  assert.deepEqual(SCRIPTS.c5_shop_hi(ctx({})), [['shop', 'hanono_item']]);
  assert.ok(JSON.stringify(SCRIPTS.c5_inn_hanono(ctx({}))).includes('"inn"'));
  for (const kind of ['inn', 'church', 'arms', 'item']) assert.ok(m.boards.some((b) => b.kind === kind), kind);
  assert.ok(m.npcs.some((n) => n.script === 'church'));
  // ハネビトの 人の え（羽）
  for (const id of ['sorane', 'pipi', 'c5_h_old', 'c5_h_kid']) assert.ok(m.npcById[id]?.sprite, id);
  // ルーラ・帰り道の羽（行った ことが あれば）
  assert.ok(KUMOI_TOWNS.hanono);
  assert.ok(warpPlaces({ visited: { hanono: true } }).includes('hanono'));
  const d = warpDest('hanono');
  assert.equal(d.map, 'hanono');
  assert.ok(!isBlocked(m, Math.floor(d.x), Math.floor(d.y), () => true));
  // 南の 門 → クモイ地方の 町の 門の 前
  for (const e of HANONO_POS.exit) assert.equal(m.warps.find((w) => w.x === e.x && w.y === e.y).to.map, 'kumoi');

  const { world, bot, c } = await setup(6301, 'c5_kumoi');
  await place(bot, 'kumoi', KUMOI_POS.gate[0].x, KUMOI_POS.gate[0].y + 1);
  await stepOn(bot, KUMOI_POS.gate[0].x, KUMOI_POS.gate[0].y);
  assert.equal(bot.s.map, 'hanono', '町に 入った');
  await stepOn(bot, 23, 31);
  assert.ok(c.flags[HANONO_SEEN] && said(bot, 'ソラネさま'), '門番の あいさつ');
  await stepOn(bot, 23, 28);
  assert.ok(c.visited?.hanono, 'ルーラの 行き先に なった');
  assert.equal(c.objective, KUMOI_OBJ.town);
  // ピピは 長の 話の 前は ノクトの 話を しない
  assert.ok(!JSON.stringify(SCRIPTS.c5_pipi(ctx(c.flags))).includes('ノクト'));
  const from = bot.msgs.length;
  await place(bot, 'hanono', HANONO_POS.sorane.x, HANONO_POS.sorane.y + 1);
  await talk(bot, 'sorane');
  assert.ok(c.flags.c5_hanono, '長ソラネの 話');
  assert.ok(said(bot, '大地の守り星', from) && said(bot, 'しずみ始めました', from) && said(bot, 'フード', from));
  assert.ok(!said(bot, 'ノクト', from), 'ソラネは まだ 名前を 知らない');
  assert.equal(c.objective, KUMOI_OBJ.hanono);
  const f2 = bot.msgs.length;
  await place(bot, 'hanono', HANONO_POS.pipi.x - 1, HANONO_POS.pipi.y);
  await talk(bot, 'pipi');
  assert.ok(c.flags.c5_pipi, 'ピピの 話');
  assert.ok(said(bot, 'ノクト兄ちゃんは、悪い人じゃないよ。', f2), 'ノクトの 名前');
  assert.ok(said(bot, '風見の石', f2) && said(bot, '飛べ', f2), '風の道の ヒント・飛べない 羽');
  assert.equal(c.objective, KUMOI_OBJ.pipi);
  // 町の 人の ことばも かわる（ノクトの うわさ）
  assert.ok(JSON.stringify(SCRIPTS.c5_h_woman(ctx(c.flags))).includes('ノクト'));
  // ばあちゃんの ヒント（ノクトの 名前に こたえる）
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('ノクト'));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(flagsOf(...UPTO('c5_sky'))))).includes('雲の上'));
  // 宿屋（夜まで 休める）
  c.gold = 1000;
  await place(bot, 'hanono', 8, 15);
  bot.choice = 2;
  await talk(bot, 'c5_h_inn');
  bot.choice = 0;
  assert.ok(isNightFor(world, bot.s), '夜まで 休んだ');
});

// ───────────── しずみゆく島の 古い 神殿 ─────────────
test('神殿の マップ: 7階（1階が 上・下へ 下へ）。かいだんの つながり・4階の 休み所・下の 階ほど 雲・宝箱は B の ★・糸が 使える', () => {
  assert.equal(RUIN_MAPS.length, 7);
  assert.deepEqual(RUIN_MAPS, ['sink_ruin_1f', 'sink_ruin_2f', 'sink_ruin_3f', 'sink_ruin_4f', 'sink_ruin_5f', 'sink_ruin_6f', 'sink_ruin_7f'], '名前の 約束');
  assert.equal(new Set(RUIN_SIGHTS.slice(1)).size, RUIN_FLOORS, '1つの 階に 1つの 見どころ');
  for (let n = 1; n <= RUIN_FLOORS; n++) {
    const m = MAPS[ruinMapId(n)];
    assert.equal(m.kind, 'dungeon');
    assert.ok(!m.noEscape, `${n}階: 糸・リレミトが 使える`);
    assert.equal(m.bgm, 'sink_ruin');
    assert.equal(m.theme, ruinTheme(n));
    const table = ruinTable(n);
    assert.equal(table, n <= 3 ? 't5_ruin_up' : 't5_ruin_low');
    assert.ok(ENCOUNTER_TABLES[table], table);
    if (n < 7 && n !== RUIN_REST) assert.ok(m.spawnCounts[table] > 0, `${n}階: 魔物が 出る`);
    if (n === RUIN_REST) assert.deepEqual(m.spawnCounts, {}, '休み所の 階は 魔物が 出ない');
    const P = RUIN_POS[n];
    // かいだん: 下りは 1つ 下の 階・上りは 1つ 上の 階
    if (P.down) assert.equal(m.warps.find((w) => w.x === P.down.x && w.y === P.down.y).to.map, ruinMapId(n + 1), `${n}階の 下り`);
    if (n > 1) assert.equal(m.warps.find((w) => w.x === P.up.x && w.y === P.up.y).to.map, ruinMapId(n - 1), `${n}階の 上り`);
    // しかけを ぜんぶ といた 世界（かたむきは 東）では、入口から 下り・宝箱に 行ける
    const tilted = Object.values(TILTS).filter((K) => K.floor === n).map((K) => K.flag);
    const r = reach(m.id, arrive(n), [...ALL_RUIN, ...tilted]);
    if (P.down) assert.ok(r(P.down.x, P.down.y), `${n}階: 下りかいだん`);
    const r0 = reach(m.id, arrive(n), ALL_RUIN);
    for (const ch of m.chests) assert.ok(near(r, ch) || near(r0, ch), `${n}階: 宝箱 ${ch.id}`);
    assert.ok(m.zoneAt(arrive(n)[0], arrive(n)[1]).startsWith('safe'), `${n}階: かいだんの まわりは 魔物が 出ない`);
    // 宝箱の 中み（B の RUIN_TREASURE[階]。data/items-kumoi.js）
    for (const [i, id] of (RUIN_TREASURE[n] || []).entries()) assert.ok(m.chests.some((ch) => ch.id === `r5_${n}${'ab'[i]}` && ch.item === id), `${n}階の ★の 宝箱 ${id}`);
  }
  // 下の 階ほど 雲が 入りこんでいる（雲の 中は t5_ruin_cloud）
  const clouds = RUIN_MAPS.map((id) => MAPS[id].tiles.filter((t) => t === T.CLOUD_FLOOR).length);
  assert.ok(clouds.slice(0, 4).every((k) => k === 0) && clouds[4] > 0 && clouds[5] > clouds[4], `雲 ${clouds}`);
  assert.ok(ENCOUNTER_TABLES.t5_ruin_cloud);
  const m6 = MAPS[ruinMapId(6)];
  const ci = m6.tiles.indexOf(T.CLOUD_FLOOR);
  assert.equal(m6.zoneAt(ci % m6.w, Math.floor(ci / m6.w)), 't5_ruin_cloud');
  // 1階の 出口 → クモイ地方の 神殿の 前・糸も
  const f1 = MAPS[ruinMapId(1)];
  for (const p of RUIN_POS[1].exit) assert.equal(f1.warps.find((w) => w.x === p.x && w.y === p.y).to.map, 'kumoi');
  const out = dungeonExit({}, { char: { dungeonFrom: null }, map: ruinMapId(6) });
  assert.equal(out.map, 'kumoi');
  assert.ok(Math.abs(out.x - RUIN_OUT.outside.x) < 1 && Math.abs(out.y - RUIN_OUT.outside.y) < 1, '糸で 神殿の 前へ');
  // 4階の 休み所（魔物の 出ない へやに いずみ。回復と 記録・夜まで）
  const f4 = MAPS[ruinMapId(RUIN_REST)];
  assert.ok(f4.actions.some((a) => a.script === 'c5_r_rest' && a.x === RUIN_POS[4].font.x));
  assert.ok(f4.zoneAt(RUIN_POS[4].font.x, RUIN_POS[4].font.y + 1).startsWith('safe'));
  const opts = SCRIPTS.c5_r_rest(ctx({})).find((s) => s[0] === 'choice')[3];
  assert.ok(opts[0].some((s) => s[0] === 'heal') && opts[0].some((s) => s[0] === 'church'), '回復と 記録');
  assert.ok(opts[1].some((s) => s[0] === 'inn' && s[3] === 'night'), '夜まで 休める');
  // 7階: ガイアイーター（大きな 人の え）・かけらの 台
  const f7 = MAPS[ruinMapId(7)];
  assert.ok(f7.npcs.some((n) => n.id === 'gaia_npc' && n.sprite === 'mon:gaia_eater' && n.big));
  assert.ok(f7.actions.some((a) => a.script === 'c5_r_altar'));
});

test('しかけ: かたむく ゆか（2階 岩・5階 水）。かたむきの石で 東 ⇔ 西。岩と 水が ころがる・流れる', { timeout: 60000 }, async () => {
  // 2階: 西に かたむいていると 岩が 通路を ふさぐ。東へ かたむけると 通れる（そのかわり 東の 小べやが ふさがる）
  const K = TILTS.f2, m2 = MAPS[ruinMapId(2)], P2 = RUIN_POS[2];
  const chest2 = m2.chests.find((ch) => ch.x === 28);
  assert.ok(!reach(m2.id, arrive(2), [])(P2.down.x, P2.down.y), '岩で 下りかいだんへ 行けない');
  assert.ok(near(reach(m2.id, arrive(2), []), chest2), '東の 小べやの 宝箱は 行ける');
  assert.ok(reach(m2.id, arrive(2), [K.flag])(P2.down.x, P2.down.y), '東へ かたむけると 通れる');
  assert.ok(!near(reach(m2.id, arrive(2), [K.flag]), chest2), '東の 小べやは 岩で ふさがる');
  for (const p of K.rocks) assert.equal(effectiveTile(m2, p.x, p.y, () => false), T.BOULDER);
  for (const p of K.rolled) assert.equal(effectiveTile(m2, p.x, p.y, (f) => f === K.flag), T.BOULDER);
  assert.equal(effectiveTile(m2, 12, 4, (f) => f === K.flag), T.TILT_FLOOR_E, 'ゆかの 絵も かたむく');
  // 5階: 西の 水路の 水が 東へ 流れる。縄ばしごは 東の 水路の 先
  const W = TILTS.f5, m5 = MAPS[ruinMapId(5)], P5 = RUIN_POS[5];
  assert.ok(!reach(m5.id, arrive(5), [])(P5.down.x, P5.down.y), '水で 下りかいだんへ 行けない');
  assert.ok(near(reach(m5.id, arrive(5), []), P5.coil), '縄ばしごへは 行ける');
  assert.ok(reach(m5.id, arrive(5), [W.flag])(P5.down.x, P5.down.y), '水を 流すと 下りかいだんへ');
  assert.ok(!near(reach(m5.id, arrive(5), [W.flag]), P5.coil), '東の 水路は 水で いっぱい');
  // だいほん（おす → 東へ。もう 1回で 西へ）
  const { world, bot, c } = await setup(6401, 'c5_ruin', [RF(2)]);
  await place(bot, ruinMapId(2), K.lever.x, K.lever.y + 1);
  await examine(bot, K.lever.x, K.lever.y);
  assert.ok(c.flags[K.flag] && said(bot, '東へかたむいた'));
  assert.equal(effectiveTile(m2, K.lever.x, K.lever.y, world.hasFlagFn(bot.s)), T.TILT_LEVER_ON);
  await examine(bot, K.lever.x, K.lever.y);
  assert.ok(!c.flags[K.flag] && said(bot, '西へかたむいた'));
});

test('しかけ: 重さの てんびん（3階）。ひとりでも 岩を ころがして 左の 皿へ → 右の 皿に のると つりあって とびらが 開く', { timeout: 60000 }, async () => {
  const S = SCALES.f3, m3 = MAPS[ruinMapId(3)], P3 = RUIN_POS[3];
  assert.ok(!reach(m3.id, arrive(3), [TILTS.f3.flag])(P3.down.x, P3.down.y), 'とびらが しまっている');
  assert.ok(reach(m3.id, arrive(3), [S.flag])(P3.down.x, P3.down.y), 'つりあうと 開く');
  assert.equal(effectiveTile(m3, S.a.x, S.a.y, (f) => f === TILTS.f3.flag), T.PAN_ROCK, '岩が 左の 皿に');
  const { world, bot, c } = await setup(6501, 'c5_ruin', [RF(3)]);
  // 岩なし・仲間なし: 右の 皿に のっても 動かない（ヒント）
  await place(bot, m3.id, S.b.x, S.b.y + 1);
  const from = bot.msgs.length;
  await stepOn(bot, S.b.x, S.b.y);
  assert.ok(!c.flags[S.flag] && said(bot, '仲間を連れてこよう', from) && said(bot, 'かたむきの石', from));
  // かたむきの石で 岩を 左の 皿へ → 右の 皿に のる
  await place(bot, m3.id, TILTS.f3.lever.x, TILTS.f3.lever.y + 1);
  await examine(bot, TILTS.f3.lever.x, TILTS.f3.lever.y);
  assert.ok(c.flags[TILTS.f3.flag] && said(bot, '左の皿にのった'));
  assert.ok(!c.flags[S.flag], 'まだ 右の 皿が 上がっている');
  await place(bot, m3.id, S.b.x, S.b.y + 1);
  await stepOn(bot, S.b.x, S.b.y);
  assert.ok(c.flags[S.flag], 'つりあった');
  assert.ok(said(bot, 'とびらが開いた'));
  for (const p of S.door) assert.equal(effectiveTile(m3, p.x, p.y, world.hasFlagFn(bot.s)), T.CAVE_FLOOR);
  // 岩を もどしても とびらは 開いたまま
  await place(bot, m3.id, TILTS.f3.lever.x, TILTS.f3.lever.y + 1);
  await examine(bot, TILTS.f3.lever.x, TILTS.f3.lever.y);
  assert.ok(!c.flags[TILTS.f3.flag] && c.flags[S.flag]);
});

test('しかけ: はなれた 重さの てんびん（6階）。ひとりは 仲間に のってもらう・だれも いなければ 動かない', { timeout: 60000 }, async () => {
  const S = SCALES.f6;
  assert.ok(Math.hypot(S.a.x - S.b.x, S.a.y - S.b.y) >= 12, 'はなれた 皿');
  assert.ok(!reach(S.map, arrive(6), [])(RUIN_POS[6].down.x, RUIN_POS[6].down.y));
  {
    const { bot, c } = await setup(6601, 'c5_ruin', [RF(6)]);
    await place(bot, S.map, S.a.x, S.a.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, S.a.x, S.a.y);
    assert.ok(!c.flags[S.flag] && said(bot, '仲間を連れてこよう', from));
    assert.ok(!said(bot, 'かたむきの石', from), '6階は 岩が ない');
  }
  {
    const { world, bot, c } = await setup(6602, 'c5_ruin', [RF(6)]);
    assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
    await play(bot);
    await place(bot, S.map, S.b.x, S.b.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, S.b.x, S.b.y);
    assert.ok(c.flags[S.flag], 'つりあった');
    assert.ok(said(bot, 'ガルドに、もう1つの皿にのってもらう？', from));
    assert.ok(reach(S.map, arrive(6), [S.flag])(RUIN_POS[6].down.x, RUIN_POS[6].down.y));
  }
});

async function familyAt(seed, flags) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of flags) Pa.char.flags[f] = true;
  Pa.char.objective = objectiveFromFlags(Pa.char);
  boost(Pa.char, 45);
  boost(Y.char, 45);
  world.sendSelf(Pa);
  world.sendSelf(Y);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y };
}
async function settleBoth(a, b) {
  for (let i = 0; i < 4; i++) {
    await a.settle();
    await b.settle();
  }
}
function walk1(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
}

test('しかけ: 重さの てんびん（家族 2人）: 1人ずつ 皿に のると つりあう（リーダーの 世界）', { timeout: 120000 }, async () => {
  const S = SCALES.f6;
  const { world, papa, yui, Pa, Y } = await familyAt(6701, [...UPTO('c5_ruin'), RF(6)]);
  world.placeSession(Pa, S.map, S.a.x + 0.5, S.a.y + 1.5, 'up', true);
  world.placeSession(Y, S.map, S.b.x + 0.5, S.b.y + 1.5, 'up', true);
  await settleBoth(papa, yui);
  walk1(papa, S.a.x, S.a.y);
  await settleBoth(papa, yui);
  assert.ok(!Pa.char.flags[S.flag]);
  assert.ok(said(papa, '家族のだれか'));
  walk1(yui, S.b.x, S.b.y);
  await settleBoth(papa, yui);
  assert.ok(Pa.char.flags[S.flag], 'つりあった');
  assert.ok(!Y.char.flags[S.flag], 'ユイの 世界は かわらない');
});

test('近道: 5階の 縄ばしごを かけると 2階 ⇔ 5階（下から 開く）', { timeout: 60000 }, async () => {
  const m2 = MAPS[ruinMapId(2)], m5 = MAPS[ruinMapId(5)];
  const H = RUIN_POS[2].shaft, C = RUIN_POS[5].coil;
  assert.ok(isBlocked(m2, H.x, H.y, () => false), '2階の たて穴は まだ 下りられない');
  assert.ok(!isBlocked(m2, H.x, H.y, (f) => f === LADDER_FLAG));
  assert.equal(m2.warps.find((w) => w.x === H.x && w.y === H.y).to.map, m5.id);
  assert.equal(m5.warps.find((w) => w.x === C.x && w.y === C.y).to.map, m2.id);
  assert.ok(reach(m2.id, arrive(2), [TILTS.f2.flag])(RUIN_POS[2].ladderOut.x, RUIN_POS[2].ladderOut.y), '2階の 下の へやから たて穴へ');
  // 2階の たて穴を 調べても 何も できない（下から）
  assert.ok(!JSON.stringify(SCRIPTS.c5_shaft(ctx({}))).includes(LADDER_FLAG));
  const { world, bot, c } = await setup(6801, 'c5_ruin', [RF(5)]);
  await place(bot, m5.id, C.x - 1, C.y);
  await examine(bot, C.x, C.y);
  assert.ok(c.flags[LADDER_FLAG], '縄ばしごを かけた');
  assert.equal(effectiveTile(m5, C.x, C.y, world.hasFlagFn(bot.s)), T.ROPE_LADDER);
  await stepOn(bot, C.x, C.y);
  assert.equal(bot.s.map, m2.id, '2階へ');
  await place(bot, m2.id, RUIN_POS[2].ladderOut.x, RUIN_POS[2].ladderOut.y);
  await stepOn(bot, H.x, H.y);
  assert.equal(bot.s.map, m5.id, '5階へ');
});

// ───────────── ガイアイーター・守り星の かけら ─────────────
test('ガイアイーターの 台本: showMon → battle（gaia_eater）。負けたら 止まり やり直せる。勝つと c5_gaia → 守り星の かけら（泣いている 子の 思い出）→ c5_shard', { timeout: 60000 }, async () => {
  const fx = FIXED_ENCOUNTERS.gaia_eater;
  assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === 'gaia', 'きまった 戦い gaia_eater（B。まだ ない 時は 仮の データ）');
  const steps = SCRIPTS.c5_gaia_event(ctx(flagsOf(...UPTO('c5_ruin'))));
  const iMon = steps.findIndex((s) => s[0] === 'showMon' && s[1] === 'gaia_eater');
  const iBat = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'gaia_eater');
  assert.ok(iMon >= 0 && iBat > iMon, 'showMon → battle');
  assert.ok(steps.findIndex((s) => s[0] === 'flag' && s[1] === 'c5_gaia') > iBat);
  assert.ok(steps.some((s) => s[0] === 'bgm' && s[1] === 'gaia'));
  assert.deepEqual(SCRIPTS.c5_gaia_event(ctx(flagsOf(...UPTO('c5_gaia')))), []);
  // 台は ガイアイーターの あと（かけらの 場面を もう 1度 見られる）
  assert.ok(!JSON.stringify(SCRIPTS.c5_r_altar(ctx(flagsOf(...UPTO('c5_ruin'))))).includes('c5_shard'));
  assert.ok(JSON.stringify(SCRIPTS.c5_r_altar(ctx(flagsOf(...UPTO('c5_gaia'))))).includes('c5_shard'));

  const { bot, c } = await setup(6901, 'c5_ruin', [RF(7)]);
  const T7 = RUIN_POS[7].trigger;
  const fought = [];
  await place(bot, ruinMapId(7), 14, T7.y - 1);
  await stepOn(bot, 14, T7.y, { lose: (id) => id === 'gaia_eater', fought });
  assert.ok(fought.includes('gaia_eater'));
  assert.ok(!c.flags.c5_gaia, '負けたら すすまない');
  await place(bot, ruinMapId(7), 14, T7.y - 1);
  const from = bot.msgs.length;
  await stepOn(bot, 14, T7.y, { fought });
  assert.ok(c.flags.c5_gaia && c.flags.c5_shard, '勝った → かけら');
  assert.ok(said(bot, 'ひとりでひざをかかえている', from) && said(bot, '…どうして、ぼくだけ…。', from), '泣いている 子の 思い出');
  assert.ok(said(bot, '島のしずみが、少し止まった', from));
  assert.ok(said(bot, '第5章の続きはアップデートで！', from));
  assert.ok(c.keyItems.includes('earth_shard'), '大地の守り星のかけら');
  assert.equal(c.objective, KUMOI_OBJ.shard);
});

// ───────────── 通しで ─────────────
test('通しで あそべる: c5_sky → 雲の上 → ハネノ（ソラネ・ピピ）→ 風の道 → 古い 神殿 1〜7階（ひとりと 仲間）→ ガイアイーター → かけら（c5_shard）', { timeout: 240000 }, async () => {
  const { world, bot, c } = await setup(7001, 'c5_sky');
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok, '酒場の 仲間（6階の てんびん）');
  const fought = [];
  const opts = { fought };
  const got = (f) => assert.ok(c.flags[f], f);
  // ── Step 3: 雲の上へ ──
  await place(bot, 'overworld', 28, 84);
  bot.send({ t: 'fly', action: 'call' });
  bot.send({ t: 'fly', action: 'region', to: 'veil' });
  await play(bot, opts);
  got('c5_kumoi');
  bot.send({ t: 'fly', action: 'land' });
  await play(bot, opts);
  assert.equal(bot.s.map, 'kumoi');
  assert.ok(!bot.s.flying);
  // ハネノの 町
  await place(bot, 'kumoi', KUMOI_POS.gate[0].x, KUMOI_POS.gate[0].y + 1);
  await stepOn(bot, KUMOI_POS.gate[0].x, KUMOI_POS.gate[0].y, opts);
  assert.equal(bot.s.map, 'hanono');
  await stepOn(bot, 23, 31, opts);
  got(HANONO_SEEN);
  await place(bot, 'hanono', HANONO_POS.sorane.x, HANONO_POS.sorane.y + 1);
  await talk(bot, 'sorane', opts);
  got('c5_hanono');
  await place(bot, 'hanono', HANONO_POS.pipi.x - 1, HANONO_POS.pipi.y);
  await talk(bot, 'pipi', opts);
  got('c5_pipi');
  // 南の 門から 町の 外へ
  await place(bot, 'hanono', HANONO_POS.exit[1].x, HANONO_POS.exit[1].y - 1);
  await stepOn(bot, HANONO_POS.exit[1].x, HANONO_POS.exit[1].y, opts);
  assert.equal(bot.s.map, 'kumoi', '町の 外へ');
  // 風の道: 西の 船着き場 → 風見の小島（石1）→ 西の風見の小島（石2）→ しずみゆく島
  const V1 = KUMOI_POS.vane1, V2 = KUMOI_POS.vane2;
  for (const [V, k] of [[V1, 'v1'], [V2, 'v2']]) {
    await place(bot, 'kumoi', V.x, V.y + 1);
    await examine(bot, V.x, V.y, opts);
    got(KUMOI_VANES[k]);
  }
  assert.ok(kumoiStops(ALL_K).has(`${RUIN_OUT.door.x},${RUIN_OUT.door.y + 1}`), '風の道で 神殿の 前へ');
  // ── Step 4: 古い 神殿 ──
  await place(bot, 'kumoi', RUIN_OUT.door.x, RUIN_OUT.door.y + 1);
  await stepOn(bot, RUIN_OUT.door.x, RUIN_OUT.door.y, opts);
  assert.equal(bot.s.map, ruinMapId(1));
  await stepOn(bot, 14, 17, opts);
  got('c5_ruin');
  assert.equal(c.objective, KUMOI_OBJ.ruin);
  const downTo = async (n) => {
    const D = RUIN_POS[n].down;
    await place(bot, ruinMapId(n), D.x, D.y - 1);
    await stepOn(bot, D.x, D.y, opts);
    assert.equal(bot.s.map, ruinMapId(n + 1), `${n + 1}階へ`);
    // かいだんの 下で 階に 入った ことばを 見る
    const A = arrive(n + 1);
    await stepOn(bot, A[0], A[1], opts);
    got(RF(n + 1));
  };
  await downTo(1);
  assert.equal(c.objective, KUMOI_OBJ.r2);
  // 2階: かたむきの石（東へ）
  await place(bot, ruinMapId(2), TILTS.f2.lever.x, TILTS.f2.lever.y + 1);
  await examine(bot, TILTS.f2.lever.x, TILTS.f2.lever.y, opts);
  got(TILTS.f2.flag);
  await downTo(2);
  // 3階: 岩を 左の 皿へ → 右の 皿に のる
  await place(bot, ruinMapId(3), TILTS.f3.lever.x, TILTS.f3.lever.y + 1);
  await examine(bot, TILTS.f3.lever.x, TILTS.f3.lever.y, opts);
  await place(bot, ruinMapId(3), SCALES.f3.b.x, SCALES.f3.b.y + 1);
  await stepOn(bot, SCALES.f3.b.x, SCALES.f3.b.y, opts);
  got(SCALES.f3.flag);
  await downTo(3);
  // 4階: 休み所
  assert.equal(c.objective, KUMOI_OBJ.r4);
  await place(bot, ruinMapId(4), RUIN_POS[4].font.x, RUIN_POS[4].font.y + 1);
  await examine(bot, RUIN_POS[4].font.x, RUIN_POS[4].font.y, opts);
  await downTo(4);
  // 5階: 縄ばしごを かけてから、水を 流す
  await place(bot, ruinMapId(5), RUIN_POS[5].coil.x - 1, RUIN_POS[5].coil.y);
  await examine(bot, RUIN_POS[5].coil.x, RUIN_POS[5].coil.y, opts);
  got(LADDER_FLAG);
  await place(bot, ruinMapId(5), TILTS.f5.lever.x, TILTS.f5.lever.y + 1);
  await examine(bot, TILTS.f5.lever.x, TILTS.f5.lever.y, opts);
  got(TILTS.f5.flag);
  await downTo(5);
  // 6階: はなれた てんびん（仲間）
  await place(bot, ruinMapId(6), SCALES.f6.a.x, SCALES.f6.a.y + 1);
  await stepOn(bot, SCALES.f6.a.x, SCALES.f6.a.y, opts);
  got(SCALES.f6.flag);
  await downTo(6);
  assert.equal(c.objective, KUMOI_OBJ.r7);
  // 7階: ガイアイーター → かけら
  await place(bot, ruinMapId(7), 14, RUIN_POS[7].trigger.y - 1);
  await stepOn(bot, 14, RUIN_POS[7].trigger.y, opts);
  for (const f of KUMOI_STEPS) got(f);
  for (let n = 1; n <= RUIN_FLOORS; n++) got(RF(n));
  assert.equal(c.objective, KUMOI_OBJ.shard);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['gaia_eater'], 'きまった 戦いは ガイアイーターだけ');
  // かけらの あとは 竜で クモイ地方の どこへでも・雲から 島が 出てくる
  await place(bot, 'kumoi', 16, 38);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, 'しずみゆく島からも 竜を 呼べる');
  assert.ok(!isBlocked(MAPS.kumoi, KUMOI_ISLES.rise.cx, KUMOI_ISLES.rise.cy, world.hasFlagFn(bot.s)));
  // 長ソラネ・ピピ・ばあちゃんの ことばも かわる
  assert.ok(JSON.stringify(SCRIPTS.c5_sorane(ctx(c.flags))).includes('ありがとう'));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('泣いている子'));
});

// ───────────── 文字 ─────────────
test('文字: 第5章 Step 3・4 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない。ノクトの 名前は ピピから', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-kumoi.js', 'public/js/shared/maps/kumoi.js', 'public/js/shared/maps/sink-ruin.js', 'public/js/shared/maps/sink-ruin-rows.js', 'public/js/shared/data/shops-kumoi.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  // ノクトの 名前は ピピの 話と、その あとの ことばだけ
  const before = flagsOf(...UPTO('c5_hanono'));
  for (const id of ['c5_sorane', 'c5_h_woman', 'c5_h_old', 'c5_h_scholar', 'c5_k_guard', 'elder']) assert.ok(!JSON.stringify(SCRIPTS[id](ctx(before))).includes('ノクト'), id);
  const last = flagsOf(...UPTO('c5_sky'));
  assert.ok(!JSON.stringify(SCRIPTS.c5_kumoi_event(ctx(last))).includes('ノクト'));
});

// ───────────── 絵と 音 ─────────────
test('絵と 音: クモイ地方・神殿の タイル（2D は 16×16 を ぬる・2.5D）・神殿の 色・ハネビトの 羽・4きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { KUMOI_PAINTERS, KUMOI_TILES, KUMOI_PROPS, kumoiBlockSpec, KUMOI_FLOOR_H, KUMOI_LIQUIDS } = await import('../public/js/client/render/tiles-kumoi.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintHuman } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const ids = [...Array.from({ length: T.RUIN_DOOR - T.CLOUD_SEA + 1 }, (_, i) => T.CLOUD_SEA + i), ...Array.from({ length: T.GAIA_ROOT - T.TILT_FLOOR_W + 1 }, (_, i) => T.TILT_FLOOR_W + i)];
  assert.deepEqual([...KUMOI_TILES].sort((a, b) => a - b), ids);
  for (const id of ids) {
    assert.ok(KUMOI_PAINTERS[id] && hasTileArt(id), TILE_INFO[id].name);
    assert.equal(partOfTile(id), 'none', `${TILE_INFO[id].name}: 色を かえない`);
    for (const m of [0, 1, 2, 8, 10]) for (const f of [0, 1, 2, 3]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((c) => !c).length, 0, `${TILE_INFO[id].name} m${m} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((c) => HEX.test(c)), TILE_INFO[id].name);
    }
  }
  for (const id of [T.CLOUD_SEA, T.SKYWIND_N, T.SKYWIND_E, T.CLOUD_FLOOR]) {
    assert.ok(isAnimated(id), TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
  }
  // 風の道は 向きで ちがう え・しかけの まえと あとは ちがう え
  const dirs = [T.SKYWIND_N, T.SKYWIND_E, T.SKYWIND_S, T.SKYWIND_W].map((id) => paintTile(id, 0, 0, 0).px.join());
  assert.equal(new Set(dirs).size, 4);
  for (const [a, b] of [[T.TILT_FLOOR_W, T.TILT_FLOOR_E], [T.TILT_LEVER, T.TILT_LEVER_ON], [T.SCALE_PAN, T.SCALE_PAN_ON], [T.SCALE_PAN_ON, T.PAN_ROCK], [T.RUIN_SHAFT, T.ROPE_LADDER], [T.ROPE_COIL, T.ROPE_LADDER]]) {
    assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join(), `${TILE_INFO[a].name} / ${TILE_INFO[b].name}`);
  }
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...KUMOI_MAPS, ...RUIN_MAPS]) {
    const m = MAPS[id];
    const all = new Set(m.tiles);
    for (const g of m.gates) { all.add(g.open); all.add(g.closed); for (const [, t] of g.levels || []) all.add(t); }
    for (const t of all) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 2.5D: 雲の 海は ずっと 下・風の道は 少し ひくい・かべの かお・たてた もの
  assert.ok(KUMOI_LIQUIDS[T.CLOUD_SEA].y < -0.9, '島が うかんで 見える');
  assert.ok(KUMOI_FLOOR_H[T.SKYWIND_E] < 0 && KUMOI_FLOOR_H[T.RUIN_SHAFT] < -1);
  for (const id of [T.RUIN_WALL, T.RUIN_MURAL, T.SCALE_DOOR, T.GAIA_ROOT]) assert.ok(kumoiBlockSpec(id, 0), TILE_INFO[id].name);
  for (const id of [T.TILT_TREE, T.TILT_PILLAR, T.BOULDER, T.TILT_LEVER, T.TILT_LEVER_ON, T.SCALE_BEAM, T.PAN_ROCK, T.ROPE_COIL, T.SHARD_ALTAR]) assert.ok(KUMOI_PROPS[id] && PROP_TILES.has(id), TILE_INFO[id].name);
  // 神殿の 色: 上は 白っぽい 砂色、下は 雲の あおい 灰色
  const up = themeRgb(0x80, 0x80, 0x80, 'sky_ruin', 'floor'), deep = themeRgb(0x80, 0x80, 0x80, 'sky_ruin_deep', 'floor');
  assert.ok(up[0] > up[2] && deep[2] > deep[0], '上は あたたかい 色・下は あおい 色');
  // ハネビトの 羽（まえ・うしろ・よこ。ピピは 小さな 羽）
  for (const kind of ['sorane', 'pipi', 'hanebito_m', 'hanebito_f', 'hanebito_f2', 'hanebito_old', 'hanebito_kid', 'hanebito_guard', 'hanebito_priest']) {
    const o = npcOpts(kind);
    assert.ok(o && o.wings, kind);
    const plain = { ...o, wings: null };
    for (const dir of ['down', 'up', 'left']) assert.notEqual(paintHuman(dir, 0, o).px.join(), paintHuman(dir, 0, plain).px.join(), `${kind} ${dir}: 羽が ある`);
  }
  const count = (o) => paintHuman('down', 0, o).px.filter(Boolean).length;
  const pip = npcOpts('pipi');
  assert.equal(pip.wingSize, 'small');
  assert.ok(count(pip) - count({ ...pip, wings: null }) < count(npcOpts('hanebito_m')) - count({ ...npcOpts('hanebito_m'), wings: null }), 'ピピの 羽は 小さい');
  for (const n of [...MAPS.hanono.npcs, ...MAPS.kumoi.npcs]) assert.ok(npcOpts(n.sprite), n.id);
  // 曲（フィールド・町・ダンジョン・ボス）
  for (const id of ['kumoi', 'hanono', 'sink_ruin', 'gaia']) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) {
      if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこ`);
      else assert.ok(_parse(ch.n).every((n) => n.f === 0 || n.f > 20), `${id}: 音の 名前`);
    }
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  assert.equal(MAPS.kumoi.bgm, 'kumoi');
  assert.equal(MAPS.hanono.bgm, 'hanono');
});
