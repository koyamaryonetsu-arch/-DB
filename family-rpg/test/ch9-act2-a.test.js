// 第3部 第1章 第2幕「鉱山の底の先」（第91回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c9_act1 → くぼ地で 星の音さ（c9_ring2）→ カナトコ鉱山の さいおく（c9_mine）→ たてあな → 大地の下（c9_under）→ 水しょうの 柱 6本
// → ヒカリゴケの里（c9_village）→ やしきの 門（c9_gate）→ 大王のやしき（はこ 3つ・もぐら兵）→ デデドン大王（c9b_king）→ c9_king → いかだ（c9_raft）→ 船着き場（c9_act2）
// 戦いの 中みは B班。ここでは かりの 戦い（data/c9b-stub.js）を テストの 中で 勝たせる（本当の 戦いは test/ch9-act2.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import '../public/js/shared/data/c9b-stub.js';
import {
  C9B, C9B_LINE, C9B_PILLARS, C9B_BOXES, C9B_MAP, C9B_MAP_IDS, C9B_BATTLE, C9B_GUARDS, C9B_CHEST_IDS, C9B_CHEST_ALL, C9B_TABLE,
  C9B_TRACK_IDS, C9B_TILE_FIRST, C9B_TILE_LAST, UNDER_RAFT, C9B_PILLAR_RADIUS, C9B_MOSS_STEPS, C9B_SPICA_LIGHT,
} from '../public/js/shared/maps/c9b-flags.js';
import { STAR_FORK, C9A } from '../public/js/shared/maps/c9a-flags.js';
import { CH9B_MAPS, MINE_STAIRS9B, MINER9B, MINE_EVENT9B, TENT4_9B, c9bGuardFlag, C9B_SHAFT_SEEN } from '../public/js/shared/maps/c9b.js';
import { UNDER_POS, HALL_POS, SHAFT_POS, UNDER_DECOR } from '../public/js/shared/maps/c9b-rows.js';
import { FOLK9B } from '../public/js/shared/maps/c9b-under.js';
import { litByFlags, brightCells9b, mapCells9b, pillarStage, underCenters } from '../public/js/shared/maps/c9b-light.js';
import { lightFor, c9aSnap, pruneC9a } from '../public/js/shared/world/c9a-steps.js';
import { underBlocked, underBrightAt } from '../public/js/shared/world/c9b-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH9_STEPS, CH9_PROGRESS, CH9_OBJECTIVE_TARGETS, CH9_OBJECTIVE_TALK, PART3_ACT2_OPEN, act1ClearObjective, ACT1_END_OLD, c9bTitleSteps } from '../public/js/shared/data/story-c9.js';
import { C9B_OBJ, CH9B_STORY_SCRIPTS, CH9B_PROGRESS, CH9B_OBJECTIVE_TARGETS, CH9B_OBJECTIVE_TALK, c9bScripts, C9B_SHOPS } from '../public/js/shared/data/story-c9b.js';
import { C9A_OBJ } from '../public/js/shared/data/story-c9a.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { retrySpot } from '../public/js/shared/world/boss-hints.js';
import { stairsPair } from '../public/js/shared/world/stairs.js';
import { storyPlace, storyNext } from '../public/js/shared/world/shiori.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, walkTo, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const FILES9B = ['public/js/shared/maps/c9b-flags.js', 'public/js/shared/data/story-c9b.js', 'public/js/shared/maps/c9b.js', 'public/js/shared/maps/c9b-rows.js',
  'public/js/shared/maps/c9b-under.js', 'public/js/shared/maps/c9b-light.js', 'public/js/shared/world/c9b-steps.js',
  'public/js/client/c9b-light.js', 'public/js/client/render/tiles-c9b.js', 'public/js/client/render/c9b-npc-art.js'];
// 柱を しらべる（となりへ 歩いて）
async function lightPillar(bot, i, opts) {
  const p = UNDER_POS.pillars[i];
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => canStand(map, x + 0.5, y + 0.5, has))
    .map(([x, y]) => [x, y, pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has)]).filter((s) => s[2]).sort((a, b) => a[2].length - b[2].length)[0];
  assert.ok(side, `柱 ${i + 1} の となりへ 歩ける`);
  await walkTo(bot, side[0], side[1], opts);
  await examine(bot, p.x, p.y, opts);
}
async function act1Player(world, name, upto = 'c9_act1', extra = []) {
  const P = await addPlayer(world, name, upto, extra);
  P.c.keyItems = [...(P.c.keyItems || []), STAR_FORK];
  return P;
}
const openRing = () => c9bScripts(c9bTitleSteps, true).c9b_ring;

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: マップ 3まい・タイル 427〜446・宝箱の id・一本の 線・決まった 戦い・台本・やり直しの 行き先・しおり', () => {
  assert.deepEqual(CH9B_MAPS, ['c9b_shaft', 'c9b_under', 'c9b_hall']);
  for (const id of C9B_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
  }
  assert.equal(MAPS.c9b_under.name, '大地の下');
  assert.equal(MAPS.c9b_hall.name, '大王のやしき');
  assert.deepEqual([MAPS.c9b_under.w, MAPS.c9b_under.h], [80, 60]);
  // タイル（427 から 446。かさならない）
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9B_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C9B_TILE_FIRST);
  assert.equal(ids[ids.length - 1], C9B_TILE_LAST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C9B_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  // 一本の 線（第1幕の うしろ）
  assert.deepEqual(C9B_LINE, ['c9_ring2', 'c9_mine', 'c9_under', 'c9_village', 'c9_gate', 'c9_king', 'c9_raft', 'c9_act2']);
  assert.deepEqual(CH9_STEPS.slice(-9), ['c9_act1', ...C9B_LINE]);
  assert.deepEqual(STORY_STEPS.slice(-9), ['c9_act1', ...C9B_LINE]);
  // 宝箱（10こ。大地の下 6・村 1・やしき 3）
  const chests = C9B_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual(chests.sort(), [...C9B_CHEST_ALL].sort());
  assert.equal(C9B_CHEST_ALL.length, 10);
  // 決まった 戦い（B班。今は かり）・やり直しの 行き先・ヒントを 言う 人
  for (const id of [C9B_BATTLE.king, ...C9B_GUARDS]) assert.ok(FIXED_ENCOUNTERS[id], id);
  assert.equal(BOSS_RETRY.c9b_king, 'c9b_king_event');
  assert.equal(BOSS_HINT_WHO.c9b_king, 'ノクト');
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある
  for (const id of [...C9B_MAP_IDS, 'mine3', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c9b_/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH9B_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  for (const id of ['c9b_pillar1', 'c9b_box1', 'c9b_inn', 'c9b_shop', 'c9b_armorer']) assert.ok(SCRIPTS[id] && !STORY_SCRIPTS.has(id), `${id} は ひとりでも`);
  // 魔物の 出る 表（B班の 名前）
  assert.deepEqual(C9B_TABLE, { shaft: 't9b_shaft', light: 't9b_light', hall: 't9b_hall' });
  assert.ok(MAPS.c9b_under.spawnCounts.t9b_light > 0 && MAPS.c9b_shaft.spawnCounts.t9b_shaft > 0 && MAPS.c9b_hall.spawnCounts.t9b_hall > 0);
  for (const z of Object.values(C9B_TABLE)) assert.ok(ENCOUNTER_TABLES[z]?.length, z);
  // 曲の id（F班）・お店
  assert.deepEqual(C9B_TRACK_IDS, ['c9b_under', 'c9b_village', 'c9b_hall', 'c9b_king']);
  assert.equal(MAPS.c9b_under.bgm, 'c9b_under');
  assert.equal(MAPS.c9b_hall.bgm, 'c9b_hall');
  assert.ok(SHOPS[C9B_SHOPS.crater] && SHOPS[C9B_SHOPS.village]);
  // 新しい ファイルは gameFiles に ある・字の きまり
  for (const f of FILES9B) {
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
});

// ───────────── 第3章を 遊んで いる 人の 鉱山・第1幕の くぼ地 ─────────────
test('第3章を 遊んで いる 人の カナトコ鉱山は かわらない（階段・鉱山の 人・場面が 見えない）・くぼ地の テントは 3つの まま', () => {
  const m = MAPS.mine3;
  const ch3 = (f) => UPTO('c3_mine').includes(f);
  const S = MINE_STAIRS9B;
  assert.equal(effectiveTile(m, S.x, S.y, ch3), m.tiles[S.y * m.w + S.x]);
  assert.equal(m.tiles[S.y * m.w + S.x], T.CAVE_FLOOR, 'もとは ゆか');
  assert.ok(!isBlocked(m, S.x, S.y, ch3));
  const w = m.warpAt.get(S.y * m.w + S.x);
  assert.ok(w && !condOk(w.show, ch3) && condOk(w.show, (f) => f === C9B.mine));
  assert.ok(!condOk(m.npcById.c9b_miner.show, ch3));
  assert.ok(!m.triggers.filter((t) => /^c9b_/.test(t.script)).some((t) => condOk(t.show, ch3)));
  assert.equal(m.zoneAt(14, 10), 'safe:boss', '魔物も 今の まま');
  assert.deepEqual(m.spawnCounts, {});
  // 階段は ゴーレムを たおした 後の 広間の おく（ゴーレムの 前でも 見えない）
  assert.equal(effectiveTile(m, S.x, S.y, () => false), T.CAVE_FLOOR);
  // くぼ地: 第1幕を クリアした 人も 音さを 鳴らすまでは テント 3つ
  const C = MAPS.c9a_crater;
  const a1 = (f) => UPTO('c9_act1').includes(f);
  assert.equal(effectiveTile(C, TENT4_9B.x, TENT4_9B.y, a1), C.tiles[TENT4_9B.y * C.w + TENT4_9B.x]);
  assert.equal(effectiveTile(C, TENT4_9B.x, TENT4_9B.y, (f) => a1(f) || f === C9B.ring2), T.C9A_TENT);
  assert.ok(!condOk(C.npcById.c9b_armorer.show, a1));
  const tents = (has) => { let n = 0; for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) if (effectiveTile(C, x, y, has) === T.C9A_TENT) n++; return n; };
  assert.equal(tents(a1), 3);
  assert.equal(tents((f) => a1(f) || f === C9B.ring2), 4);
});

// ───────────── 幕が 開く 前 ─────────────
test('幕を 開ける 切りかえ（PART3_ACT2_OPEN）: 開く 前は くぼ地で 鳴らしても 何も 起きない・目標は 今の まま', () => {
  const a1 = flagsOf(...UPTO('c9_act1'));
  const x = ctx(a1, { has: (id) => id === STAR_FORK });
  // 開いて いない 台本は から・開いた 台本は 幕の はじまり
  assert.deepEqual(c9bScripts(() => [], false).c9b_ring(x), []);
  const on = JSON.stringify(openRing()(x));
  assert.ok(on.includes('"flag","c9_ring2"') && on.includes('第2幕　鉱山の底の先') && on.includes(C9B_OBJ.ring2));
  assert.equal(act1ClearObjective(false), C9A_OBJ.act1);
  assert.equal(act1ClearObjective(true), C9B_OBJ.start);
  assert.equal(ACT1_END_OLD, '第3部　第1章　第2幕へ（続きはアップデートで！）');
  if (!PART3_ACT2_OPEN) {
    assert.deepEqual(SCRIPTS.c9b_ring(x), [], '幕が 開く 前は 始まらない');
    assert.equal(objectiveFromFlags({ flags: a1 }), C9A_OBJ.act1, '第1幕 クリアの 目標は 今の まま');
    assert.ok(!KNOWN_OBJECTIVES.has(C9B_OBJ.start));
    assert.ok(CH9_PROGRESS.every(([, t]) => !Object.values(C9B_OBJ).includes(t)));
  } else {
    assert.ok(SCRIPTS.c9b_ring(x).length > 0);
    assert.equal(objectiveFromFlags({ flags: a1 }), C9B_OBJ.start);
    assert.ok(!KNOWN_OBJECTIVES.has(ACT1_END_OLD), '前の 文は 知らない 文（なおる）');
    const c = { flags: a1, objective: ACT1_END_OLD };
    assert.ok(repairObjective(c));
    assert.equal(c.objective, C9B_OBJ.start);
  }
  // 星の音さが ない 人・第1幕の 前は 何も 起きない
  assert.deepEqual(openRing()(ctx(a1)), []);
  assert.deepEqual(openRing()(ctx(flagsOf(...UPTO('c9_fork')), { has: (id) => id === STAR_FORK })), []);
});

// ───────────── 明かりの 計算 ─────────────
test('明かりの 計算: スピカ 4マス・柱 9マス（フラグで ずっと）・村の 明かり・柱の 数（pillarStage）・地図の マス', () => {
  assert.equal(C9B_SPICA_LIGHT, 4);
  assert.equal(C9B_PILLAR_RADIUS, 9);
  assert.equal(C9B_MOSS_STEPS, 40);
  const none = () => false;
  const P = UNDER_POS.pillars;
  const W = MAPS.c9b_under.w;
  const k = (p) => p.y * W + p.x;
  assert.ok(!brightCells9b(none).has(k({ x: P[0].x + 3, y: P[0].y })));
  const one = (f) => f === C9B_PILLARS[0];
  assert.ok(brightCells9b(one).has(k({ x: P[0].x + 9, y: P[0].y })));
  assert.ok(!brightCells9b(one).has(k({ x: P[0].x + 10, y: P[0].y })));
  assert.equal(pillarStage(none), 0);
  assert.equal(pillarStage(one), 1);
  assert.equal(pillarStage((f) => C9B_PILLARS.includes(f)), 6);
  // 村の 小さな 明かりは いつも（地図にも 出る）・魔物の 明るさには ならない
  const lamp = underCenters(none).find((c) => c[3] === 'lamp');
  assert.ok(mapCells9b(none).has(lamp[1] * W + lamp[0]));
  assert.ok(!brightCells9b(none).has(lamp[1] * W + lamp[0]));
  // 大王に 勝つと 村の 明かりが 大きく
  const L = UNDER_POS.lump;
  assert.ok(!brightCells9b(none).has(k({ x: L.x + 6, y: L.y })));
  assert.ok(brightCells9b((f) => f === C9B.king).has(k({ x: L.x + 6, y: L.y })));
  // 同じ フラグなら 同じ 物（作り直さない）
  assert.equal(litByFlags(one), litByFlags(one));
  // 宝箱は その 番号の 柱の 明かりの 中・柱を ともすと 見える
  UNDER_POS.chests.forEach((c, i) => {
    assert.ok(Math.hypot(c.x - P[i].x, c.y - P[i].y) <= 9, `宝箱 ${i + 1}`);
    const ch = MAPS.c9b_under.chests.find((x) => x.id === C9B_CHEST_IDS.under[i]);
    assert.ok(!condOk(ch.show, none) && condOk(ch.show, (f) => f === C9B_PILLARS[i]));
  });
  // 大地の下は「行った 所」を 取らない
  assert.equal(MAPS.c9b_under.noExplore, true);
  assert.ok(!MAPS.c9b_shaft.noExplore && !MAPS.c9b_hall.noExplore);
  // 天じょうの かざり（鉱山・ピラミッド・神殿・さかさの 町）
  assert.deepEqual(UNDER_DECOR.map((d) => d.kind).sort(), ['mine', 'pyramid', 'temple', 'town']);
  assert.ok(MAPS.c9b_shaft.c9bDecor.length >= 3);
});

// ───────────── 階段・たてあな ─────────────
test('階段: 鉱山の さいおくの 下り 階段 ⇄ たてあなの 上り 階段（真上に 着く）・たてあなの 出口 ⇄ 大地の下・やしきの 門', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9601), rateLimit: false });
  const { bot } = await act1Player(world, 'ソラ', 'c9_mine');
  const S = MINE_STAIRS9B;
  const has = (f) => UPTO('c9_mine').includes(f);
  assert.equal(effectiveTile(MAPS.mine3, S.x, S.y, has), T.STAIRS_DOWN);
  const w = MAPS.mine3.warpAt.get(S.y * MAPS.mine3.w + S.x);
  assert.ok(stairsPair('mine3', w, has), '鉱山の 階段 → たてあなの 階段');
  await place(bot, 'mine3', S.x, S.y + 1);
  await stepOn(bot, S.x, S.y);
  assert.equal(bot.s.map, C9B_MAP.shaft);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [SHAFT_POS.up.x, SHAFT_POS.up.y], '上り 階段の 真上に 着く');
  await stepOn(bot, SHAFT_POS.up.x, SHAFT_POS.up.y + 1);
  await stepOn(bot, SHAFT_POS.up.x, SHAFT_POS.up.y);
  assert.equal(bot.s.map, 'mine3');
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [S.x, S.y], '下り 階段の 真上に 着く');
  // たてあなの 上から 出口まで 歩ける・出口 → 大地の下 → もどる 道
  await place(bot, C9B_MAP.shaft, SHAFT_POS.up.x, SHAFT_POS.up.y + 1);
  await walkTo(bot, SHAFT_POS.exit.x, SHAFT_POS.exit.y);
  assert.equal(bot.s.map, C9B_MAP.under);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [UNDER_POS.arrive.x, UNDER_POS.arrive.y]);
  await walkTo(bot, UNDER_POS.up.x, UNDER_POS.up.y);
  assert.equal(bot.s.map, C9B_MAP.shaft);
  // やしきの 門は c9_gate から
  const G = UNDER_POS.gate, U = MAPS.c9b_under;
  assert.ok(isBlocked(U, G.x, G.y, has));
  assert.ok(!isBlocked(U, G.x, G.y, (f) => f === C9B.gate));
  assert.ok(condOk(U.warpAt.get(G.y * U.w + G.x).show, (f) => f === C9B.gate));
});

// ───────────── 柱は どの じゅんでも・ひとりで 全部 ─────────────
test('水しょうの 柱: どの じゅんでも・ひとりで 全部 ともせる・4本めで 店が 開く・5と 6で 門（村に 着いて から）', { timeout: 200000 }, async () => {
  for (const [seed, order] of [[9701, [0, 1, 2, 3, 4, 5]], [9702, [5, 4, 3, 2, 1, 0]], [9703, [2, 5, 0, 4, 1, 3]]]) {
    const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
    const { bot, c } = await act1Player(world, 'ソラ', 'c9_under', [C9B_SHAFT_SEEN]);
    await place(bot, C9B_MAP.under, UNDER_POS.arrive.x, UNDER_POS.arrive.y);
    for (const i of order) {
      await lightPillar(bot, i);
      assert.ok(c.flags[C9B_PILLARS[i]], `柱 ${i + 1}`);
      // 5・6本めは 村に 着いて いないと 門を 開けない（村に 着いた 時に 開く）
      if (c.flags[C9B_PILLARS[4]] && c.flags[C9B_PILLARS[5]] && !c.flags[C9B.village]) assert.ok(!c.flags[C9B.gate]);
    }
    assert.equal(pillarStage((f) => !!c.flags[f]), 6, `${order.join('')}: ひとりで 全部`);
    assert.ok(said(bot, '6本の水しょうの柱に、全部、明かりがともった'));
    // 村を 通ったら 着いた ことに なる（どの じゅんでも 村は 通る か ここで 入る）
    if (!c.flags[C9B.village]) await walkTo(bot, UNDER_POS.village.x + 9, UNDER_POS.village.y + 3);
    assert.ok(c.flags[C9B.village] && c.flags[C9B.gate], '門が 開く');
  }
  // 4本めの 前と あとの 店
  const dark = flagsOf(...UPTO('c9_village'));
  assert.ok(!JSON.stringify(SCRIPTS.c9b_shop(ctx(dark))).includes('"shop"'));
  assert.ok(JSON.stringify(SCRIPTS.c9b_shop(ctx({ ...dark, [C9B_PILLARS[3]]: true }))).includes('"shop","c9b_village"'));
  assert.ok(JSON.stringify(SCRIPTS.c9b_inn(ctx(dark))).includes('暗くて'));
  assert.ok(!JSON.stringify(SCRIPTS.c9b_inn(ctx({ ...dark, [C9B_PILLARS[3]]: true }))).includes('暗くて'));
  // 星の音さが ないと ともせない・ともった 柱は もう 何も しない
  assert.ok(!JSON.stringify(SCRIPTS.c9b_pillar1(ctx(dark))).includes(C9B_PILLARS[0]));
  assert.ok(!JSON.stringify(SCRIPTS.c9b_pillar1(ctx({ ...dark, [C9B_PILLARS[0]]: true }, { has: () => true }))).includes('"flag"'));
});

// ───────────── 家族 2人で 同じ 明かり ─────────────
test('家族 2人で: 柱は リーダーの 世界に・明かりは みんなで 同じ・こけの 光も パーティーで 1つ（40歩で 消える）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9801), rateLimit: false });
  const A = await act1Player(world, 'ソラ', 'c9_under', [C9B_SHAFT_SEEN]);
  const B = await act1Player(world, 'ミク', 'c9_under', [C9B_SHAFT_SEEN]);
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  assert.equal(A.bot.s.partyId, B.bot.s.partyId);
  world.placeSession(A.bot.s, C9B_MAP.under, UNDER_POS.arrive.x + 0.5, UNDER_POS.arrive.y + 0.5, 'down', true);
  world.placeSession(B.bot.s, C9B_MAP.under, UNDER_POS.arrive.x + 1.5, UNDER_POS.arrive.y + 0.5, 'down', true);
  await play(A.bot, { bots: [B.bot] });
  // ミクが 柱 1 と 2 を ともす → ソラの 世界に
  await lightPillar(B.bot, 0, { bots: [A.bot] });
  await lightPillar(B.bot, 1, { bots: [A.bot] });
  assert.ok(A.c.flags[C9B_PILLARS[0]] && A.c.flags[C9B_PILLARS[1]], 'リーダー（ソラ）の 世界に ともる');
  assert.equal(pillarStage(world.hasFlagFn(A.bot.s)), 2);
  assert.equal(pillarStage(world.hasFlagFn(B.bot.s)), 2, 'ミクにも 同じ 明かり');
  const P1 = UNDER_POS.pillars[0];
  assert.ok(underBrightAt(world, P1.x + 5, P1.y));
  // こけの 光（パーティーで 1つ）
  const U = MAPS.c9b_under;
  const mossK = U.c9a.moss[0];
  const mx = mossK % U.w, my = Math.floor(mossK / U.w);
  const side = D4.map(([dx, dy]) => [mx + dx, my + dy]).find(([x, y]) => canStand(U, x + 0.5, y + 0.5, () => true) && !U.c9a.mossSet.has(y * U.w + x));
  await place(A.bot, C9B_MAP.under, side[0], side[1], 'up', { bots: [B.bot] });
  await stepOn(A.bot, mx, my, { bots: [B.bot] });
  const st = lightFor(world, A.bot.s);
  assert.equal(st, lightFor(world, B.bot.s));
  assert.ok(st.lit.has(mossK));
  assert.deepEqual(c9aSnap(world, A.bot.s), c9aSnap(world, B.bot.s));
  assert.equal(st.lit.get(mossK).left, 40);
  // ふまずに 40歩 あるくと 消える（39歩では まだ）
  const other = D4.map(([dx, dy]) => [side[0] + dx, side[1] + dy]).find(([x, y]) => canStand(U, x + 0.5, y + 0.5, () => true) && !U.c9a.mossSet.has(y * U.w + x));
  for (let i = 0; i < 39; i++) await stepOn(A.bot, ...(i % 2 ? side : other), { bots: [B.bot] });
  assert.ok(st.lit.has(mossK), '39歩では まだ 光る');
  await stepOn(A.bot, ...(39 % 2 ? side : other), { bots: [B.bot] });
  assert.ok(!st.lit.has(mossK), '40歩で 消える');
  // 明かりは セーブしない・大地の下の「行った 所」は 取らない
  A.bot.send({ t: 'explored', map: C9B_MAP.under, data: 'AAAA' });
  await play(A.bot, { bots: [B.bot] });
  assert.ok(!A.c.explored?.[C9B_MAP.under], '大地の下の 行った 所は 取らない');
  assert.ok(!JSON.stringify(A.c).includes('c9aLight'));
});

// ───────────── 魔物 ─────────────
test('魔物: ふつうの 魔物は 柱の 明かりの 中だけ・大ミミズ（darkOnly）は 暗い 所だけ（柱・こけ・村の 明かりに 入らない）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9901), rateLimit: false });
  const { bot, c } = await act1Player(world, 'ソラ', 'c9_under', [C9B_SHAFT_SEEN, C9B_PILLARS[0]]);
  await place(bot, C9B_MAP.under, UNDER_POS.arrive.x, UNDER_POS.arrive.y);
  const dark = Object.keys(MONSTERS).find((k) => k === 'c9b_mimizu' && MONSTERS[k].darkOnly) || 'c9a_yamimushi';
  assert.equal(MONSTERS[dark].darkOnly, true);
  const normal = Object.keys(MONSTERS).find((k) => !MONSTERS[k].darkOnly);
  const P1 = UNDER_POS.pillars[0], P3 = UNDER_POS.pillars[2];
  const inLight = [P1.x + 3, P1.y + 1], inDark = [P3.x + 2, P3.y + 2];
  assert.equal(underBlocked(world, { sp: dark }, ...inLight), true, '大ミミズは 柱の 明かりに 入らない');
  assert.equal(underBlocked(world, { sp: dark }, ...inDark), false, '暗い 所は 歩ける');
  assert.equal(underBlocked(world, { sp: normal }, ...inLight), false, 'ふつうの 魔物は 明るい 所');
  assert.equal(underBlocked(world, { sp: normal }, ...inDark), true, 'ふつうの 魔物は 暗い 所に 出ない');
  // 柱を ともすと そこの 大ミミズは いなく なる
  c.flags[C9B_PILLARS[2]] = true;
  assert.equal(underBlocked(world, { sp: dark }, ...inDark), true);
  // 村の 小さな 明かりにも 入らない
  const lamp = underCenters(() => false).find((x) => x[3] === 'lamp');
  assert.equal(underBlocked(world, { sp: dark }, lamp[0] + 1, lamp[1]), true);
  // 世界で 出る 魔物（だれも いない 時は 出ない。表が ある）
  for (let i = 0; i < 40; i++) await tickN(world, 1);
  const { mapState } = await import('../public/js/shared/world/monsters.js');
  const ms = mapState(world, C9B_MAP.under);
  for (const s of ms.symbols.values()) {
    assert.equal(underBlocked(world, s, s.x, s.y), false, `${s.sp} ${s.x},${s.y} は 出て よい 所`);
  }
});

// ───────────── 通し ─────────────
test('通し: 第1幕を クリアした セーブから くぼ地・鉱山・たてあな・大地の下・村・やしき・大王・同じ テーブル・船着き場まで（かりの 戦い）', { timeout: 300000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9111), rateLimit: false });
  const { bot, c } = await act1Player(world, 'ソラ', 'c9_act1');
  const fought = [];
  const base = SCRIPTS.c9b_ring;
  SCRIPTS.c9b_ring = openRing(); // 幕が 開いた 時の 台本で ためす（開く 前は から）
  try {
    // 1 くぼ地で 音さ
    await place(bot, 'c9a_crater', 12, 15);
    await walkTo(bot, 12, 10);
    assert.ok(c.flags[C9B.ring2], 'c9_ring2');
    for (const t of ['ずっと、下から', '第2幕　鉱山の底の先', '武具屋']) assert.ok(said(bot, t), t);
    assert.equal(c.objective, C9B_OBJ.ring2);
    assert.equal(storyPlace(c).act, 2);
    assert.equal(storyPlace(c).actTitle, '鉱山の底の先');
    assert.ok(condOk(MAPS.c9a_crater.npcById.c9b_armorer.show, (f) => !!c.flags[f]));
    // 2 鉱山の さいおく（入口から）
    await place(bot, 'mine3', 14, 19);
    await stepOn(bot, 14, 18);
    assert.ok(c.flags[C9B.mine]);
    assert.equal(c.objective, C9B_OBJ.mine);
    await walkTo(bot, MINE_STAIRS9B.x, MINE_STAIRS9B.y);
    assert.equal(bot.s.map, C9B_MAP.shaft);
    // 3 たてあなの おどろきの 場面
    await walkTo(bot, SHAFT_POS.exit.x, SHAFT_POS.exit.y, { fought });
    assert.ok(said(bot, 'ダンジョンの「底」'));
    assert.equal(bot.s.map, C9B_MAP.under);
    // 4 大地の下
    await stepOn(bot, UNDER_POS.arrive.x, UNDER_POS.arrive.y + 1);
    assert.ok(c.flags[C9B.under]);
    assert.equal(c.objective, C9B_OBJ.under);
    for (const i of [0, 2]) await lightPillar(bot, i, { fought });
    // 5 村（北まわり）
    await walkTo(bot, UNDER_POS.village.x + 8, UNDER_POS.village.y + 2, { fought });
    assert.ok(c.flags[C9B.village]);
    assert.ok(said(bot, 'デデドン大王') && said(bot, 'いかだ'));
    assert.equal(c.objective, C9B_OBJ.village);
    await lightPillar(bot, 3, { fought });
    await lightPillar(bot, 4, { fought });
    await lightPillar(bot, 5, { fought });
    assert.ok(c.flags[C9B.gate]);
    assert.equal(c.objective, C9B_OBJ.gate);
    // 6 やしき: 門 → こっそり（もぐら兵の 見はりを よけて）→ はこ 3つ
    await walkTo(bot, UNDER_POS.gate.x, UNDER_POS.gate.y, { fought });
    assert.equal(bot.s.map, C9B_MAP.hall);
    const H = MAPS.c9b_hall;
    const seen = HALL_POS.guards.map((g) => g.see);
    const sneak = (tx, ty) => {
      const has = world.hasFlagFn(bot.s);
      const block = new Set();
      for (const r of seen) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) block.add(y * H.w + x);
      const prev = new Map([[Math.floor(bot.s.y) * H.w + Math.floor(bot.s.x), null]]);
      const q = [[Math.floor(bot.s.x), Math.floor(bot.s.y)]];
      for (let h = 0; h < q.length; h++) {
        const [x, y] = q[h];
        if (x === tx && y === ty) {
          const out = [];
          for (let k = y * H.w + x; prev.get(k) !== null; k = prev.get(k)) out.unshift([k % H.w, Math.floor(k / H.w)]);
          return out;
        }
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy, k = ny * H.w + nx;
          if (prev.has(k) || isBlocked(H, nx, ny, has) || H.chestAt.has(k) || block.has(k) || H.warpAt.has(k) || H.npcs.some((n) => condOk(n.show, has) && Math.floor(n.x) === nx && Math.floor(n.y) === ny)) continue;
          prev.set(k, y * H.w + x);
          q.push([nx, ny]);
        }
      }
      return null;
    };
    const boxes = [];
    for (let y = 0; y < H.h; y++) for (let x = 0; x < H.w; x++) if (H.tiles[y * H.w + x] === T.C9B_BOX) boxes.push({ x, y });
    for (const b of boxes) {
      const path = sneak(b.x, b.y + 1) || sneak(b.x - 1, b.y) || sneak(b.x + 1, b.y);
      assert.ok(path, `はこ ${b.x},${b.y} へ こっそり 行ける`);
      for (const [x, y] of path) await stepOn(bot, x, y, { fought });
      await examine(bot, b.x, b.y);
    }
    assert.ok(C9B_BOXES.every((f) => c.flags[f]), 'はこ 3つ');
    assert.deepEqual(fought.filter((f) => /guard/.test(f)), [], 'もぐら兵に 見つからずに 来られた');
    // 1組めとは 話して 戦う
    await talkTo(bot, C9B_MAP.hall, 'c9b_guard1', 0, { fought });
    assert.ok(c.flags[c9bGuardFlag(1)] && fought.includes(C9B_BATTLE.guard1));
    // 7 大王
    const door = sneak(HALL_POS.door.x, HALL_POS.door.y + 1);
    assert.ok(door, 'とびらの 前まで こっそり');
    for (const [x, y] of door) await stepOn(bot, x, y, { fought });
    await stepOn(bot, HALL_POS.door.x, HALL_POS.door.y, { fought });
    assert.ok(fought.includes(C9B_BATTLE.king));
    assert.ok(c.flags[C9B.king] && c.flags[C9B.raft], 'c9_king → c9_raft');
    assert.ok(c.keyItems.includes(UNDER_RAFT));
    for (const t of ['暗いのが、こわかった', '同じテーブル', 'こわくない', '大きないす']) assert.ok(said(bot, t), t);
    assert.ok(!C9B_BOXES.some((f) => c.flags[f]) && ![1, 2, 3].some((n) => c.flags[c9bGuardFlag(n)]) && !c.flags[C9B_SHAFT_SEEN], '小さな フラグは 消える');
    assert.equal(bot.s.map, C9B_MAP.under, '村へ');
    assert.equal(c.objective, C9B_OBJ.raft);
    assert.equal(effectiveTile(MAPS.c9b_under, UNDER_POS.lump.x, UNDER_POS.lump.y, (f) => !!c.flags[f]), T.C9B_LUMP_ON, '村の 明かりが もどる');
    // 9 船着き場
    await walkTo(bot, UNDER_POS.dockScene.x + 2, UNDER_POS.dockScene.y);
    assert.ok(c.flags[C9B.act2]);
    assert.ok(said(bot, 'ピラミッドの底'));
    assert.equal(c.objective, C9B_OBJ.act2);
    assert.ok(storyPlace(c).cleared);
    assert.ok(storyNext(c).end, '続きはアップデート');
    // 宝箱（柱の 明かりで 見える）・村の 人の ことばが 明るく
    C9B_CHEST_IDS.under.forEach((id, i) => assert.equal(condOk(MAPS.c9b_under.chests.find((x) => x.id === id).show, (f) => !!c.flags[f]), !!c.flags[C9B_PILLARS[i]], id));
    assert.ok(JSON.stringify(SCRIPTS.c9b_folk1(ctx(c.flags))).includes('ぴかぴか'));
    // のこる 小さな フラグ
    const left = Object.keys(c.flags).filter((f) => /^c9_/.test(f) && !STORY_STEPS.includes(f) && !C9B_PILLARS.includes(f));
    assert.ok(left.length <= 10, left.join(','));
  } finally {
    SCRIPTS.c9b_ring = base;
  }
});

// ───────────── 目標・しおり ─────────────
test('目標・行き先・仲間の ひとこと・しおり（第3部 第1章 第2幕）', () => {
  for (const t of Object.values(C9B_OBJ)) {
    assert.ok(CH9B_OBJECTIVE_TARGETS[t]?.length, `行き先 ${t}`);
    const talk = CH9B_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k].length >= 9, `${t} ${k}`);
  }
  // すすみぐあい（一本の 線 → 目標）
  for (const [f, t] of CH9B_PROGRESS) if (typeof f === 'string') assert.ok(C9B_LINE.includes(f), f);
  assert.equal(CH9B_PROGRESS.at(-1)[1], C9B_OBJ.act2);
  if (PART3_ACT2_OPEN) {
    for (const f of C9B_LINE) assert.equal(objectiveFromFlags({ flags: flagsOf(...UPTO(f)) }), CH9B_PROGRESS.find(([k]) => k === f)[1], f);
    for (const t of Object.values(C9B_OBJ)) assert.ok(CH9_OBJECTIVE_TARGETS[t] && CH9_OBJECTIVE_TALK[t] && KNOWN_OBJECTIVES.has(t), t);
  }
  // しおり
  const cAt = (f) => ({ flags: flagsOf(...UPTO(f)) });
  assert.equal(storyPlace(cAt('c9_act1')).act, 1);
  const p2 = storyPlace(cAt('c9_ring2'));
  assert.deepEqual([p2.part, p2.act, p2.actTitle, p2.cleared], [3, 2, '鉱山の底の先', false]);
  assert.ok(p2.label.includes('第3部') && p2.label.includes('第1章') && p2.label.includes('第2幕'));
  assert.equal(storyPlace(cAt('c9_act2')).cleared, true);
  assert.ok(storyNext({ objective: C9B_OBJ.act2 }).end);
  assert.ok(!storyNext({ objective: C9B_OBJ.under }).end);
});

// ───────────── 負けた 時・切れた 時 ─────────────
test('負けた 時: 大王は ごちそうの 間の とびらの 前から やり直せる（ヒントは ノクト）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9121), rateLimit: false });
  const { bot, c } = await act1Player(world, 'ソラ', 'c9_gate', [C9B_SHAFT_SEEN, C9B_BOXES[0]]);
  await place(bot, C9B_MAP.hall, HALL_POS.door.x, HALL_POS.door.y + 2);
  const fought = [];
  await stepOn(bot, HALL_POS.door.x, HALL_POS.door.y + 1, { fought, lose: () => true });
  await stepOn(bot, HALL_POS.door.x, HALL_POS.door.y, { fought, lose: () => true });
  assert.deepEqual(fought, [C9B_BATTLE.king]);
  assert.ok(!c.flags[C9B.king], 'まだ 勝って いない');
  assert.ok(c.flags[C9B_BOXES[0]], '取り返した はこは のこる');
  const d = retrySpot(C9B_BATTLE.king, C9B_MAP.hall, (f) => !!c.flags[f]);
  assert.ok(d && d.map === C9B_MAP.hall && d.y > HALL_POS.door.y, 'とびらの 前');
  assert.ok(canStand(MAPS.c9b_hall, d.x, d.y, () => false));
});

test('回線が 切れた 時の つづき: 大王に 勝って いかだの 前・村の 場面の 前・こけの 光は 切れても のこる', async () => {
  // 大王に 勝って いかだを もらう 前に 切れた: 目標は 村長・村長で いかだ
  const k = flagsOf(...UPTO('c9_king'));
  delete k[C9B.raft];
  assert.equal(CH9B_PROGRESS.findLast(([f]) => k[f])[1], C9B_OBJ.king);
  const chief = JSON.stringify(SCRIPTS.c9b_chief(ctx(k)));
  assert.ok(chief.includes(`"item","${UNDER_RAFT}"`) && chief.includes('"flag","c9_raft"'));
  assert.ok(!JSON.stringify(SCRIPTS.c9b_chief(ctx(flagsOf(...UPTO('c9_raft'))))).includes('"item"'));
  // 鉱山の 場面の 前に 切れた: もう一度 さいおくに 入れば
  assert.ok(JSON.stringify(SCRIPTS.c9b_mine_event(ctx(flagsOf(...UPTO('c9_ring2'))))).includes('"flag","c9_mine"'));
  assert.ok(JSON.stringify(SCRIPTS.c9b_miner(ctx(flagsOf(...UPTO('c9_ring2'))))).includes('"flag","c9_mine"'));
  // 大地の下: こけの 光は とぎれた 間も のこる・snap で また 見える
  const world = new GameWorld({ offline: true, rng: makeRng(9131), rateLimit: false });
  const { bot } = await act1Player(world, 'ソラ', 'c9_under', [C9B_SHAFT_SEEN]);
  const U = MAPS.c9b_under;
  const mossK = U.c9a.moss[0];
  const mx = mossK % U.w, my = Math.floor(mossK / U.w);
  const side = D4.map(([dx, dy]) => [mx + dx, my + dy]).find(([x, y]) => canStand(U, x + 0.5, y + 0.5, () => true) && !U.c9a.mossSet.has(y * U.w + x));
  await place(bot, C9B_MAP.under, side[0], side[1]);
  await stepOn(bot, mx, my);
  assert.equal(lightFor(world, bot.s).lit.size, 1);
  world.goAway(bot.s);
  pruneC9a(world);
  assert.equal(lightFor(world, bot.s).lit.size, 1);
  assert.equal(c9aSnap(world, bot.s).lit.length, 1);
});

// ───────────── 台本の きまり・絵 ─────────────
test('台本の きまり: もとの 作品の 名前・せりふを 使わない・第1部 第2部の ひみつ・カイ・3人組は 出ない・こわい 言い方なし', () => {
  const sets = [UPTO('c9_act1'), UPTO('c9_ring2'), UPTO('c9_mine'), UPTO('c9_under'), UPTO('c9_village'), UPTO('c9_gate'), UPTO('c9_king'), UPTO('c9_raft'), UPTO('c9_act2')];
  const scripts = { ...c9bScripts(c9bTitleSteps, true) };
  const all = JSON.stringify(sets.flatMap((fs) => Object.values(scripts).map((fn) => { try { return fn(ctx(flagsOf(...fs), { has: () => true })); } catch { return []; } })));
  assert.ok(all.includes('デデドン大王'));
  assert.ok(!/デデデ|カービィ|ワドルディ|メタナイト|プププ/.test(all), 'もとの 作品の 名前は 使わない');
  assert.ok(!/"カイ"|カイ[、。！]|ソリトゥス|トキネ|フリーゾン|ザルバ/.test(all), '第1部・第2部の ひみつに ふれない');
  assert.ok(!/ホシドロ|キラジョ|ボヤッチ|ズラッカ|3人組/.test(all), '3人組は 出ない');
  assert.ok(!/殺|ころす|死ね|しね|こわして|やっつけてやる/.test(all));
  // 字の きまり（ファイル）
  for (const f of FILES9B) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.ok(!/デデデ大王/.test(src.replace(/もとは デデデ大王/g, '')), `${f}: もとの 名前`);
  }
});

test('絵: 新しい タイル（2D 16×16・動く・2.5D）・テーマ・地下の 民と もぐら兵と 大王の え・かざり', async () => {
  const { C9A_PAINTERS, C9A_FRAMES, C9A_PROPS, C9A_THEMES, C9A_FLOOR_H, c9aBlockSpec } = await import('../public/js/client/render/tiles-c9a.js');
  const { Painter } = await import('../public/js/client/render/pixel.js');
  for (let id = C9B_TILE_FIRST; id <= C9B_TILE_LAST; id++) {
    const p = new Painter(16, 16);
    assert.ok(C9A_PAINTERS[id], String(id));
    C9A_PAINTERS[id](p, 3, 1, {});
    if (TILE_INFO[id].anim) assert.ok(C9A_FRAMES[id] >= 2, `${id} コマ`);
  }
  // 2.5D: かべ・岩は ブロック・柱と 家と 明かりは たてた もの・空どうは ゆかより 下
  for (const id of [T.C9B_ROCK, T.C9B_CLIFF, T.C9B_HALLWALL, T.C9B_GATE, T.C9B_CRATE, T.C9B_TABLE, T.C9B_BOX]) assert.ok(c9aBlockSpec(id, 0), String(id));
  for (const id of [T.C9B_PILLAR, T.C9B_PILLAR_ON, T.C9B_HUT, T.C9B_LUMP_ON, T.C9B_LAMP]) assert.ok(C9A_PROPS[id], String(id));
  assert.ok(C9A_FLOOR_H[T.C9B_VOID] < -0.5);
  for (const th of ['c9b_under', 'c9b_hall']) assert.ok(C9A_THEMES[th], th);
  const { paintC8cSpecial, C8C_NPC_LOOKS } = await import('../public/js/client/render/c8c-npc-art.js');
  const sprites = new Set();
  for (const id of [...C9B_MAP_IDS, 'mine3', 'c9a_crater']) for (const n of MAPS[id].npcs) if (/^c9b_/.test(n.id)) sprites.add(n.sprite);
  const grab = (v) => { if (Array.isArray(v)) { if (v[0] === 'actor') sprites.add(v[2].sprite); v.forEach(grab); } };
  for (const fs of [UPTO('c9_gate'), UPTO('c9_king')]) for (const fn of Object.values(c9bScripts(c9bTitleSteps, true))) { try { grab(fn(ctx(flagsOf(...fs)))); } catch { /* */ } }
  for (const s of sprites) assert.ok(C8C_NPC_LOOKS[s] || paintC8cSpecial(s, 'down', 1)?.p || ['miner2', 'c9a_spica'].includes(s), `絵 ${s}`);
  assert.ok(paintC8cSpecial('c9b_king_npc', 'down', 0).p.w >= 32, '大王は 大きい');
  // 明かりと かざりの 絵
  const light = await import('../public/js/client/c9b-light.js');
  for (const f of ['drawC9bDark2D', 'drawC9bDark3D', 'drawC9bDecor2D', 'drawC9bDecor3D', 'mapLit9b', 'notePillarStage']) assert.equal(typeof light[f], 'function', f);
  assert.ok(MAPS.c9b_under.c9b && MAPS.c9b_under.c9a.mossSteps === 40);
  void FOLK9B; void MINER9B; void MINE_EVENT9B;
});
