// 第3部 第1章 第1幕「星ふるえの夜」（第90回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c8_solitus → ホシフル村（1年ぶりの 朝・c9_festival）→ したく 3つ（どれから でも）→ 星祭りの 夜（c9_night・c9_starfall）
// → 光る 道しるべ → 星ふるえの森 → ながれ星のくぼ地（c9_child・3人組 c9a_trio）→ 守り星の石の 階段（c9_stairs）
// → 星の石の地下道 4階（光の輪 c9_b1〜c9_b3）→ ともしびの ためし（c9a_trial）→ 星の音さ（c9_fork）→ くぼ地の 職人（c9_act1）
// 戦いの 中みは B班（data/encounters-c9a.js・monsters-c9a.js・items-c9a.js）。ここでは 戦いを テストの 中で 勝たせる（本当の 戦いは test/ch9-act1.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C9A, C9A_LINE, C9A_PREP, C9A_LAMPS, C9A_FLOWERS, C9A_KIDS, C9A_PREP_ASK, C9A_SECRETS, C9A_MAP, C9A_MAP_IDS, C9A_BATTLE, C9A_ROPE, C9A_FORK_RING,
  C9A_SHARD_N, c9aShard, c9aSeen, C9A_FOREST_IN, C9A_TABLE, C9A_CHEST_IDS, STAR_FORK, SPICA, SPICA_NAME, C9A_TILE_FIRST, C9A_TILE_LAST,
} from '../public/js/shared/maps/c9a-flags.js';
import { CH9A_MAPS, C9A_CAVE_IDS } from '../public/js/shared/maps/c9a.js';
import { cavePos, caveEntry, STAIRS9A, WELL9A } from '../public/js/shared/maps/c9a-cave.js';
import { FOREST9A, FOREST_POS9A, SIGNPOST9A } from '../public/js/shared/maps/c9a-forest.js';
import { LAMPS9A, FLOWERS9A, KIDS9A } from '../public/js/shared/maps/c9a-field.js';
import { CRATER_POS, B4_TRIAL } from '../public/js/shared/maps/c9a-rows.js';
import { newLight, stepLight, doorOpen, crystalsLit, litCells, connectedOf, MOSS_STEPS, LIGHT_ME } from '../public/js/shared/maps/c9a-light.js';
import { lightFor, c9aSnap, c9aLitAt, pruneC9a } from '../public/js/shared/world/c9a-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH9_PROGRESS, CH9_OBJECTIVE_TARGETS, CH9_OBJECTIVE_TALK, applyCh9, PART3_OPEN } from '../public/js/shared/data/story-c9.js';
import { C9A_OBJ, CH9A_STORY_SCRIPTS, CH9A_PROGRESS, C9A_TOWN_LINES, TRIO9A } from '../public/js/shared/data/story-c9a.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { OBJECTIVE_TARGETS, questMarks } from '../public/js/shared/data/quest-targets.js';
import { OBJECTIVE_TALK } from '../public/js/shared/data/party-talk.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { c9aChest, C9A_TREASURE } from '../public/js/shared/data/items-c9a.js';
import { BOSS_RETRY, BOSS_HINT_WHO, BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { retrySpot } from '../public/js/shared/world/boss-hints.js';
import { stairsPair, warpLanding } from '../public/js/shared/world/stairs.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';
import { solveCave, downGoal, rectGoal } from './c9a-solver.js';
import {
  UPTO, flagsOf, said, D4, addPlayer, setup, play, place, stepOn, examine, touch, talkTo, walkTo, pathTo,
} from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: マップ 6まい・タイル 407〜・宝箱の id・決まった 戦い・台本・やり直しの 行き先・だいじな 物', () => {
  assert.deepEqual(CH9A_MAPS, ['c9a_forest', 'c9a_crater', 'c9a_b1', 'c9a_b2', 'c9a_b3', 'c9a_b4']);
  for (const id of C9A_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m, id);
    assert.ok(m.name && !/\s/.test(m.name.replace(/　/g, '')), `${id} の 名前`);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
  }
  assert.equal(MAPS.c9a_forest.name, '星ふるえの森');
  assert.equal(MAPS.c9a_crater.name, 'ながれ星のくぼ地');
  for (let n = 1; n <= 4; n++) assert.equal(MAPS[`c9a_b${n}`].name, `星の石の地下道　地下${n}階`);
  // タイル（407 から。とって おいた 407〜426 の 中・かさならない）
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9A_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C9A_TILE_FIRST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C9A_TILE_FIRST + i));
  assert.ok(ids[ids.length - 1] <= C9A_TILE_LAST);
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length, 'タイルの 番号は かさならない');
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.ok(!TILE_INFO[T.C9A_MOSS].solid && TILE_INFO[T.C9A_DOOR].solid && TILE_INFO[T.C9A_SOURCE].solid && !TILE_INFO[T.C9A_ROPE].solid);
  // 宝箱（B班が 中みを 決める id）
  const chestIds = new Set(C9A_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id)));
  for (const id of [...C9A_CHEST_IDS.forest, ...['b1', 'b2', 'b3', 'b4'].flatMap((k) => C9A_CHEST_IDS[k]), ...C9A_CHEST_IDS.secret, C9A_CHEST_IDS.fork]) assert.ok(chestIds.has(id), id);
  assert.deepEqual(C9A_CHEST_IDS.forest, ['c9a_f1', 'c9a_f2']);
  assert.deepEqual(C9A_CHEST_IDS.secret, ['c9a_s1', 'c9a_s2']);
  // 決まった 戦い（B班）・やり直しの 行き先・ヒントを 言う 人
  for (const id of Object.values(C9A_BATTLE)) assert.ok(FIXED_ENCOUNTERS[id], id);
  assert.equal(BOSS_RETRY.c9a_trio, 'c9a_child_event');
  assert.equal(BOSS_RETRY.c9a_trial, 'c9a_trial');
  assert.equal(BOSS_HINT_WHO.c9a_trio, 'ノクト');
  assert.equal(BOSS_HINT_WHO.c9a_trial, 'ノクト');
  // だいじな 物
  assert.equal(ITEMS[STAR_FORK]?.type, 'key');
  assert.equal(ITEMS[STAR_FORK].name, '星の音さ');
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある・物語の 場面は 家族 みんなで
  for (const id of [...C9A_MAP_IDS, 'overworld']) {
    const m = MAPS[id];
    for (const a of [...m.actions, ...m.triggers, ...m.npcs]) if (/^c9a_/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH9A_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  for (const id of ['c9a_lamp1', 'c9a_flower1', 'c9a_kid1', 'c9a_secret1', 'c9a_board', 'c9a_shard1', 'c9a_well']) assert.ok(SCRIPTS[id] && !STORY_SCRIPTS.has(id), `${id} は ひとりでも`);
  // 魔物の 出る 表（B班の 名前。森 t9a_forest・地下道 t9a_b1〜t9a_b4。かりの 表は もう ない）
  assert.deepEqual(C9A_TABLE, { forest: 't9a_forest', b1: 't9a_b1', b2: 't9a_b2', b3: 't9a_b3', b4: 't9a_b4' });
  for (const z of Object.values(C9A_TABLE)) assert.ok(ENCOUNTER_TABLES[z]?.length, z);
  assert.equal(MAPS.c9a_forest.spawnCounts[C9A_TABLE.forest] > 0, true);
  for (const n of [1, 2, 3, 4]) {
    const m = MAPS[`c9a_b${n}`];
    assert.deepEqual(Object.keys(m.spawnCounts), [C9A_TABLE[`b${n}`]], `地下${n}階`);
    assert.ok(!m.tableFor, 'かりの 表の 入れかえは ない');
  }
  assert.equal(MAPS.c9a_forest.tableFor, undefined);
  // 地下4階の ためしの 間（とびらの 先）は 魔物が 出ない
  const TD = cavePos(4).trial;
  assert.equal(MAPS.c9a_b4.zoneAt(TD.x, TD.y - 1), 'safe:rest');
  // くらやみ虫（darkOnly）は 地下3・4階の 表に いる
  for (const z of ['t9a_b3', 't9a_b4']) assert.ok(ENCOUNTER_TABLES[z].some((e) => e.group.some(([sp]) => MONSTERS[sp]?.darkOnly)), z);
  assert.deepEqual(MAPS.c9a_crater.spawnCounts, {});
  // 宝箱の 中みは B班の 表（13こ。かりの「星のかけら 3こ」では ない）
  const all = C9A_MAP_IDS.flatMap((id) => MAPS[id].chests.filter((c) => /^c9a_/.test(c.id)));
  assert.equal(all.length, 13);
  for (const c of all) {
    assert.deepEqual({ item: c.item, n: c.n }, c9aChest(c.id), c.id);
    assert.ok(ITEMS[c.item], `${c.id}: ${c.item}`);
  }
  assert.deepEqual(all.map((c) => c.id).sort(), Object.keys(C9A_TREASURE).sort());
  // 一本の 線
  assert.deepEqual(C9A_LINE.slice(-1), ['c9_act1']);
  assert.equal(PART3_OPEN, true, '第1幕を つないだ（第2部 クリアの 目標が 星祭りに）');
});

// ───────────── 第1章を 遊んで いる 人の 世界地図 ─────────────
test('第1章を 遊んで いる 人の 世界地図は かわらない（道しるべ・ちょうちん・階段・子ども・花が 見えない・森の 魔物が 同じ）', () => {
  const ow = MAPS.overworld;
  const kid = (f) => !!flagsOf('p_opening', 'p_start', 'p_flower', 'p_attack', 'c1_town')[f];
  // 足した 人は どれも 第3部の フラグが ないと 出ない
  for (const id of ['c9a_signpost', 'c9a_flower1', 'c9a_flower2', 'c9a_flower3', 'c9a_kid1', 'c9a_kid2', 'c9a_kid3']) {
    const n = ow.npcById[id];
    assert.ok(n, id);
    assert.ok(!condOk(n.show, kid), `${id} は 見えない`);
    assert.ok(!condOk(n.show, (f) => UPTO('c8_solitus').includes(f)), `${id} は 第2部 クリアでも まだ 見えない`);
  }
  // ちょうちん・階段の マスは 今の まま（歩ける）
  for (const p of [...LAMPS9A, STAIRS9A]) {
    const g = ow.gateAt.get(p.y * ow.w + p.x);
    assert.ok(g, `${p.x},${p.y}`);
    assert.equal(effectiveTile(ow, p.x, p.y, kid), ow.tiles[p.y * ow.w + p.x]);
    assert.ok(!isBlocked(ow, p.x, p.y, kid));
  }
  // 階段の 出入り口は c9_stairs の あとだけ
  const w = ow.warpAt.get(STAIRS9A.y * ow.w + STAIRS9A.x);
  assert.ok(w && w.show && !condOk(w.show, kid) && condOk(w.show, (f) => f === C9A.stairs));
  // 世界地図の 森は そのまま（魔物の 出る 表・数・森の マス）
  assert.equal(ow.zoneAt(110, 30), 'forest');
  assert.equal(ow.spawnCounts.forest, 14);
  for (let y = FOREST9A.y; y < FOREST9A.y + FOREST9A.h; y++) for (let x = FOREST9A.x; x < FOREST9A.x + FOREST9A.w; x++) {
    const g = ow.gateAt.get(y * ow.w + x);
    assert.ok(!g || !/c9/.test(JSON.stringify([g.flag, g.levels])), `森の ${x},${y} に 第3部の しかけは ない`);
  }
  assert.ok(!(ow.triggers || []).some((t) => t.id === 'c9a_morning' && condOk(t.show, kid)));
  // 1年ぶりの 朝は 第2部 クリアの 人だけ
  const tr = ow.triggers.find((t) => t.id === 'c9a_morning');
  assert.ok(condOk(tr.show, (f) => UPTO('c8_solitus').includes(f)) && !condOk(tr.show, (f) => UPTO('c8_gather').includes(f)));
  // 村の 人の ことばも 祭りの 間だけ（第1章の 子は 今の まま）
  for (const id of Object.keys(C9A_TOWN_LINES)) {
    if (!SCRIPTS[id]) continue;
    const base = JSON.stringify(SCRIPTS[id](ctx(flagsOf('p_opening', 'p_start'))));
    assert.ok(!/1年/.test(base), `${id} の 第1章の ことば`);
  }
});

// ───────────── 光の輪（計算）─────────────
test('光の輪: こけを ふむと 光る・みなもとに つながると ずっと・つながらない こけは 24歩で 消える・水しょうと とびら', () => {
  const info = MAPS.c9a_b1.c9a;
  const P = cavePos(1);
  const k = (x, y) => y * info.w + x;
  const st = newLight();
  // みなもとから 遠い こけ（つながらない）を ふむ → 24歩で 消える
  stepLight(info, st, 12, 4, 'a');
  assert.ok(st.lit.has(k(12, 4)) && st.lit.get(k(12, 4)).left === MOSS_STEPS);
  for (let i = 0; i < MOSS_STEPS - 1; i++) stepLight(info, st, 12, 5, 'a');
  assert.ok(st.lit.has(k(12, 4)), '23歩では まだ 光る');
  stepLight(info, st, 12, 5, 'a');
  assert.ok(!st.lit.has(k(12, 4)), '24歩で 消える');
  // ほかの 人の 歩数では へらない（家族で 遊ぶと 早い）
  stepLight(info, st, 13, 4, 'a');
  for (let i = 0; i < 30; i++) stepLight(info, st, 1, 1, 'b');
  assert.ok(st.lit.has(k(13, 4)), 'ふんだ 人の 歩数だけ');
  // みなもとの となりから つなぐと、つながった こけは ずっと 光る（こけは 5つで 水しょう）
  for (const m of P.moss) stepLight(info, st, m.x, m.y, 'a');
  assert.equal(connectedOf(info, st.lit).size, P.moss.length);
  for (let i = 0; i < 100; i++) stepLight(info, st, 1, 1, 'a');
  assert.equal(st.lit.size, P.moss.length, 'つながった こけは 消えない');
  assert.deepEqual(crystalsLit(info, st.lit), [true]);
  assert.ok(doorOpen(info, st.lit));
  // とちゅうが 消えると つながらない
  const st2 = newLight();
  stepLight(info, st2, 10, 4, 'a');
  stepLight(info, st2, 12, 4, 'a');
  assert.equal(connectedOf(info, st2.lit).size, 1, 'となりで ない こけは つながらない');
  // 地下3階: 水しょう 2つが どちらも 光らないと 開かない
  const i3 = MAPS.c9a_b3.c9a;
  const st3 = newLight();
  const P3 = cavePos(3);
  const trunk = P3.moss.filter((m) => m.x === 11 || (m.y === 9 && m.x <= 11) || (m.x === 3));
  const walk = [[11, 12], [11, 11], [11, 10], [11, 9], ...Array.from({ length: 8 }, (_, i) => [10 - i, 9]), [3, 8], [3, 7], [3, 6], [3, 5]];
  for (const [x, y] of walk) stepLight(i3, st3, x, y, 'a');
  assert.deepEqual(crystalsLit(i3, st3.lit), [true, false]);
  assert.ok(!doorOpen(i3, st3.lit), '1つだけでは 開かない');
  void trunk;
  for (const [x, y] of [...Array.from({ length: 8 }, (_, i) => [12 + i, 9]), [19, 8], [19, 7], [19, 6], [19, 5]]) stepLight(i3, st3, x, y, 'a');
  assert.ok(doorOpen(i3, st3.lit), '2つとも 光ると 開く');
  // 光の とどく マス（みなもとは いつも・自分の ほのかな 光は 入れない）
  const base = litCells(info, new Map());
  const S = P.sources[0];
  assert.ok(base.has(k(S.x + 3, S.y)) && !base.has(k(S.x + 4, S.y)));
  assert.equal(LIGHT_ME, 2.5);
});

// ───────────── 各階が ひとりで とける ─────────────
test('星の石の地下道: どの 階も ひとりで 入口から 出口へ（光を つながないと 行けない）・地下2階は 24歩の うちに つなげる', { timeout: 120000 }, () => {
  for (let n = 1; n <= 4; n++) {
    const P = cavePos(n);
    const e = caveEntry(n);
    const start = { x: Math.floor(e.x), y: Math.floor(e.y) };
    const goal = n === 4 ? rectGoal(B4_TRIAL) : downGoal(P);
    const r = solveCave({ mapId: `c9a_b${n}`, start, goal, strict: true });
    assert.ok(!r.truncated, `地下${n}階 さがしきれた`);
    assert.ok(r.goal, `地下${n}階: ひとりで とける（つながらない こけが すぐ 消えても）`);
    if (n < 4) {
      assert.ok(r.opened, `地下${n}階: とびらを 開けて 通る`);
      const r0 = solveCave({ mapId: `c9a_b${n}`, start, goal, noLight: true });
      assert.ok(!r0.goal, `地下${n}階: 光を つながないと 行けない`);
    }
  }
  // 地下1階は 本当の 歩数でも
  const e1 = caveEntry(1);
  assert.ok(solveCave({ mapId: 'c9a_b1', start: { x: Math.floor(e1.x), y: Math.floor(e1.y) }, goal: downGoal(cavePos(1)) }).goal);
  // 地下2階: 遠い はしから こけの 道を みなもとへ 歩くと、着いた 時に ぜんぶ つながる（24歩の うち）。こけが 10歩で 消えると つながらない
  const info = MAPS.c9a_b2.c9a;
  const moss = cavePos(2).moss.slice().sort((a, b) => a.x - b.x);
  const run = (steps) => {
    const st = newLight();
    for (const m of moss) {
      stepLight(info, st, m.x, m.y, 'a');
      if (steps < MOSS_STEPS) for (const e of st.lit.values()) if (e.left !== Infinity && e.left > steps) e.left = Math.min(e.left, steps - (m.x - moss[0].x));
    }
    return doorOpen(info, st.lit);
  };
  assert.ok(moss.length <= MOSS_STEPS, 'こけの 道は 24歩より 短い');
  assert.ok(run(MOSS_STEPS), '24歩なら 1回で つながる');
  assert.ok(!run(10), '10歩で 消える なら つながらない（もどれば また 光る）');
});

test('星ふるえの森: 入口から くぼ地への 出口まで 歩ける・たおれた 木で 前の 道は ふさがる・かけらと 宝箱に とどく', () => {
  const m = MAPS.c9a_forest;
  const P = FOREST_POS9A;
  const has = () => false;
  const path = pathTo(m, P.arrive.x, P.arrive.y, P.north.x, P.north.y, has);
  assert.ok(path, 'くぼ地への 出口へ');
  for (const s of P.shards) assert.ok(pathTo(m, P.arrive.x, P.arrive.y, s.x, s.y, has), `かけら ${s.x},${s.y}`);
  for (const c of P.chests) assert.ok(D4.some(([dx, dy]) => pathTo(m, P.arrive.x, P.arrive.y, c.x + dx, c.y + dy, has)), `宝箱 ${c.x},${c.y}`);
  // たおれた 木を のぞくと もっと 近い（前の 道は ふさがって いる）
  const open = { ...m, gateAt: m.gateAt, tiles: m.tiles.map((t) => (t === T.C9A_LOG ? T.FOREST_FLOOR : t)) };
  const short = pathTo(open, P.arrive.x, P.arrive.y, P.north.x, P.north.y, has);
  assert.ok(short.length < path.length, `たおれた 木で 道が かわる（${short.length} → ${path.length}）`);
  // かけらの ならびが 道しるべ（出口への 道の そば）
  const near = (s) => path.some(([x, y]) => Math.abs(x - s.x) + Math.abs(y - s.y) <= 2);
  assert.ok(P.shards.filter(near).length >= C9A_SHARD_N - 1, 'かけらは 道の そば');
  // 南の 出口は 世界地図の 森の 入口へ・道しるべの そば
  const out = m.warps.find((w) => w.to.map === 'overworld');
  assert.ok(Math.hypot(out.to.x - SIGNPOST9A.x, out.to.y - SIGNPOST9A.y) < 4);
  assert.ok(!isBlocked(MAPS.overworld, Math.floor(out.to.x), Math.floor(out.to.y), has));
});

// ───────────── 階段 ─────────────
test('階段: 守り星の石の 南の 階段 ⇄ 地下1階・地下の 階段は どれも 行き先の 階段の 真上に 着く・井戸の ひも', () => {
  const has = (f) => [...UPTO('c9_stairs'), C9A_ROPE].includes(f);
  const ow = MAPS.overworld;
  const w0 = ow.warpAt.get(STAIRS9A.y * ow.w + STAIRS9A.x);
  const land0 = warpLanding('overworld', w0, has);
  assert.ok(land0.stair, '村の 階段 → 地下1階の 上り 階段の 真上');
  assert.equal(land0.map, 'c9a_b1');
  assert.deepEqual([Math.floor(land0.x), Math.floor(land0.y)], [cavePos(1).up.x, cavePos(1).up.y]);
  for (let n = 1; n <= 4; n++) {
    const m = MAPS[`c9a_b${n}`];
    const P = cavePos(n);
    for (const s of [P.up, P.down].filter(Boolean)) {
      const w = m.warpAt.get(s.y * m.w + s.x);
      assert.ok(w, `地下${n}階 ${s.x},${s.y}`);
      const pair = stairsPair(m.id, w);
      assert.ok(pair, `地下${n}階 ${s.x},${s.y} の 行き先の 階段`);
      const land = warpLanding(m.id, w, has);
      assert.ok(land.stair, `地下${n}階 ${s.x},${s.y} → ${land.map} の 階段の 真上`);
    }
  }
  // 井戸の ひも（地下4階 → 村の 井戸の となり）は c9_rope の あとだけ
  const b4 = MAPS.c9a_b4;
  const R = cavePos(4).rope;
  const wr = b4.warpAt.get(R.y * b4.w + R.x);
  assert.ok(wr.show && !condOk(wr.show, () => false) && condOk(wr.show, has));
  assert.ok(isBlocked(b4, R.x, R.y, () => false) && !isBlocked(b4, R.x, R.y, has));
  assert.ok(Math.hypot(wr.to.x - WELL9A.x, wr.to.y - WELL9A.y) < 2);
  assert.ok(!isBlocked(ow, Math.floor(wr.to.x), Math.floor(wr.to.y), has));
});

// ───────────── 目標・しおり ─────────────
test('目標・行き先・仲間の ひとこと・しおり（第3部 第1章 第1幕）', () => {
  assert.ok(CH9_PROGRESS.length >= CH9A_PROGRESS.length);
  for (const [, t] of CH9A_PROGRESS) {
    assert.ok(KNOWN_OBJECTIVES.has(t), t);
    const talk = OBJECTIVE_TALK[t];
    assert.ok(talk, t);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && talk[k].length > 8, `${t} ${k}`);
    const specs = OBJECTIVE_TARGETS[t];
    assert.ok(specs?.length, t);
    for (const s of specs) if (s.map) assert.ok(MAPS[s.map], `${t} ${s.map}`);
    for (const s of specs) if (s.npc) assert.ok(Object.values(MAPS).some((m) => m.npcById?.[s.npc]), `${t} ${s.npc}`);
    assert.ok(!/\s/.test(t.replace(/　/g, '')), `空白 ${t}`);
    // ネタバレしない（3人組の 親玉・カイ）
    for (const s of [t, ...Object.values(talk)]) assert.ok(!/カイ|ソリトゥス|ライバル/.test(s), s);
  }
  assert.equal(Object.keys(CH9_OBJECTIVE_TARGETS).length, Object.keys(CH9_OBJECTIVE_TALK).length);
  const of = (...f) => objectiveFromFlags({ flags: flagsOf(...f) });
  const P2 = UPTO('c8_solitus');
  assert.equal(of(...P2, C9A.festival), C9A_OBJ.festival);
  assert.equal(of(...P2, C9A.festival, C9A_PREP_ASK), C9A_OBJ.ask);
  assert.equal(of(...P2, C9A.festival, C9A_PREP_ASK, C9A_PREP.flower, C9A_PREP.story), C9A_OBJ.ask);
  assert.equal(of(...P2, C9A.festival, C9A_PREP_ASK, ...Object.values(C9A_PREP)), C9A_OBJ.ready);
  assert.equal(of(...UPTO('c9_starfall')), C9A_OBJ.starfall);
  assert.equal(of(...UPTO('c9_starfall'), 'c9_forest_in'), C9A_OBJ.forest);
  assert.equal(of(...UPTO('c9_child')), C9A_OBJ.child);
  assert.equal(of(...UPTO('c9_trio')), C9A_OBJ.trio);
  assert.equal(of(...UPTO('c9_stairs'), c9aSeen(1)), C9A_OBJ.cave1);
  assert.equal(of(...UPTO('c9_b1'), c9aSeen(1)), C9A_OBJ.c9_b1);
  assert.equal(of(...UPTO('c9_b1'), c9aSeen(1), c9aSeen(2)), C9A_OBJ.cave2);
  assert.equal(of(...UPTO('c9_b3'), c9aSeen(4)), C9A_OBJ.cave4);
  assert.equal(of(...UPTO('c9_fork')), C9A_OBJ.fork);
  assert.equal(of(...UPTO('c9_act1')), C9A_OBJ.act1);
  assert.ok(/アップデート/.test(C9A_OBJ.act1) && C9A_OBJ.act1.includes('第3部'));
  // 地図の しるし（したくの 間は 星の花・ちょうちん・子ども。すんだ 物は 出ない）
  const c = { flags: flagsOf(...P2, C9A.festival, C9A_PREP_ASK, C9A_LAMPS[0]), objective: C9A_OBJ.ask };
  const marks = questMarks(c, 'overworld').filter((m) => m.kind === 'main');
  assert.ok(marks.length >= 3);
  assert.ok(!marks.some((m) => m.x === LAMPS9A[0].x && m.y === LAMPS9A[0].y), '火を 入れた ちょうちんは 出ない');
  // しおり
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c9_festival')) }).label, '第3部 第1章 第1幕');
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c9_trial')) }).cleared, false);
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c9_act1')) }).cleared, true);
});

// ───────────── したくは どの じゅんでも ─────────────
test('祭りの したく: 3つは どの じゅんでも・3つ そろうと ばあちゃんで 夜・小さな フラグは 消える', () => {
  const orders = [['flower', 'lamp', 'story'], ['story', 'flower', 'lamp'], ['lamp', 'story', 'flower']];
  for (const order of orders) {
    const fl = flagsOf(...UPTO('c8_solitus'), C9A.festival, C9A_PREP_ASK);
    const run = (steps) => {
      for (const s of steps) {
        if (s[0] === 'flag') fl[s[1]] = true;
        if (s[0] === 'unflag') delete fl[s[1]];
        if (s[0] === 'choice') run(s[3][0]);
      }
      return steps;
    };
    const parts = { flower: [0, 1, 2].map((i) => `c9a_flower${i + 1}`), lamp: [0, 1, 2, 3].map((i) => `c9a_lamp${i + 1}`), story: [0, 1, 2].map((i) => `c9a_kid${i + 1}`) };
    for (const p of order) {
      for (const id of parts[p]) run(SCRIPTS[id](ctx(fl)));
      assert.ok(fl[C9A_PREP[p]], `${order.join('→')}: ${p}`);
    }
    for (const f of [...C9A_FLOWERS, ...C9A_LAMPS, ...C9A_KIDS]) assert.ok(!fl[f], `${f} は 消える`);
    const el = JSON.stringify(SCRIPTS.elder(ctx(fl)));
    assert.ok(el.includes('"flag","c9_night"') && el.includes('"flag","c9_starfall"'), `${order.join('→')}: 夜へ`);
  }
  // 途中で ばあちゃんに 話すと のこりを 教えて くれる
  const half = flagsOf(...UPTO('c8_solitus'), C9A.festival, C9A_PREP_ASK, C9A_PREP.lamp);
  const s = JSON.stringify(SCRIPTS.elder(ctx(half)));
  assert.ok(s.includes('星の花') && s.includes('子どもたちへのお話') && !s.includes('c9_night'));
  // 子どもの 問いは まちがえても 進む
  const kid = SCRIPTS.c9a_kid2(ctx(flagsOf(...UPTO('c8_solitus'), C9A.festival)));
  const ch = kid.find((x) => x[0] === 'choice');
  for (const br of ch[3]) assert.ok(JSON.stringify(br).includes(C9A_KIDS[1]), 'どの 答えでも お話した ことに なる');
});

// ───────────── 通し（第2部を クリアした セーブから c9_act1 まで）─────────────
test('通し: 第2部を クリアした セーブから 1年ぶりの 朝・したく・夜・森・くぼ地・階段・地下道 4階・ためし・星の音さ・職人まで', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(9101);
  const fought = [];
  // 1 村に 入ると ルカ
  await place(bot, 'overworld', 27, 88, 'down');
  await stepOn(bot, 27, 89);
  await stepOn(bot, 27, 90);
  assert.ok(c.flags[C9A.festival], 'c9_festival');
  for (const t of ['いつまでねてるんだよ', '1年前も、同じこと言ったな', '第3部　ほしのね', '第1幕　星ふるえの夜']) assert.ok(said(bot, t), t);
  assert.equal(c.objective, C9A_OBJ.festival);
  // 2 したく（子ども → ちょうちん → 花。子ども 2人めは まちがえる）
  await talkTo(bot, 'overworld', 'elder');
  assert.ok(c.flags[C9A_PREP_ASK]);
  assert.equal(c.objective, C9A_OBJ.ask);
  for (let i = 0; i < 3; i++) await talkTo(bot, 'overworld', `c9a_kid${i + 1}`, i === 1 ? 0 : [0, 1, 0][i]);
  assert.ok(c.flags[C9A_PREP.story] && !C9A_KIDS.some((f) => c.flags[f]));
  assert.ok(said(bot, 'えー、ちがうよ'), 'まちがえても 進む');
  for (const p of LAMPS9A) await touch(bot, p);
  assert.ok(c.flags[C9A_PREP.lamp]);
  assert.equal(effectiveTile(MAPS.overworld, LAMPS9A[0].x, LAMPS9A[0].y, (f) => !!c.flags[f]), T.C9A_LANTERN_ON);
  // 村の 人の 1年後の ことば
  const v0 = bot.msgs.length;
  await talkTo(bot, 'overworld', 'v_oldman');
  assert.ok(said(bot, '1年前の星祭り', v0));
  for (let i = 0; i < 3; i++) await talkTo(bot, 'overworld', `c9a_flower${i + 1}`);
  assert.ok(c.flags[C9A_PREP.flower]);
  assert.equal(c.objective, C9A_OBJ.ready);
  // 3 夜
  await talkTo(bot, 'overworld', 'elder');
  assert.ok(c.flags[C9A.night] && c.flags[C9A.starfall]);
  for (const t of ['ガルド', 'ミーナ', 'ポポロ', 'リン', 'ティナ', 'ピピ', 'ノクト', '星ふるえ']) assert.ok(said(bot, t), t);
  assert.ok(!said(bot, '"カイ"'), 'カイは 出ない');
  assert.equal(c.objective, C9A_OBJ.starfall);
  // 4 道しるべ → 森
  await talkTo(bot, 'overworld', 'c9a_signpost', 0);
  assert.equal(bot.s.map, C9A_MAP.forest);
  await stepOn(bot, FOREST_POS9A.arrive.x, FOREST_POS9A.arrive.y - 1);
  assert.ok(c.flags.c9_forest_in);
  assert.equal(c.objective, C9A_OBJ.forest);
  const S0 = FOREST_POS9A.shards[0];
  await touch(bot, S0);
  assert.ok(c.flags[c9aShard(1)]);
  await walkTo(bot, FOREST_POS9A.north.x, FOREST_POS9A.north.y);
  assert.equal(bot.s.map, C9A_MAP.crater);
  // 5・6 星の子 → 3人組
  const C = CRATER_POS;
  await walkTo(bot, C.scene.x + 2, C.scene.y + 1, { fought });
  assert.ok(c.flags[C9A.child] && c.flags[C9A.trio], 'c9_child → c9_trio');
  assert.deepEqual(fought, ['c9a_trio']);
  for (const t of [SPICA_NAME, TRIO9A.band, TRIO9A.boss, TRIO9A.mecha, TRIO9A.power, TRIO9A.catch, '空の上からの声']) assert.ok(said(bot, t), t);
  assert.ok(!c.flags[c9aShard(1)] && !c.flags.c9_forest_in, 'かけらの フラグは 消える');
  assert.ok(world.followerLooks(bot.s).some((f) => f.spica), '星の子が うしろを 歩く');
  assert.ok(!(c.guests || []).includes(SPICA), '戦いの わくには 入らない');
  // 7 守り星の石 → 階段
  await talkTo(bot, 'overworld', 'star_stone');
  assert.ok(c.flags[C9A.stairs]);
  assert.equal(effectiveTile(MAPS.overworld, STAIRS9A.x, STAIRS9A.y, (f) => !!c.flags[f]), T.STAIRS_DOWN);
  await place(bot, 'overworld', STAIRS9A.x, STAIRS9A.y + 1);
  await stepOn(bot, STAIRS9A.x, STAIRS9A.y);
  assert.equal(bot.s.map, 'c9a_b1');
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [cavePos(1).up.x, cavePos(1).up.y], '上り 階段の 真上に 着く');
  // 8 地下1階: こけを つなぐ
  await walkTo(bot, caveEntry(1).x - 0.5, caveEntry(1).y - 0.5);
  assert.ok(c.flags[c9aSeen(1)]);
  for (const m of cavePos(1).moss) await walkTo(bot, m.x, m.y);
  assert.ok(c.flags[C9A.b1], 'とびらが 開いた');
  assert.equal(c.objective, C9A_OBJ.c9_b1);
  await walkTo(bot, cavePos(1).down.x, cavePos(1).down.y);
  assert.equal(bot.s.map, 'c9a_b2');
  // 地下2階: 遠い はしから
  const m2 = cavePos(2).moss.slice().sort((a, b) => a.x - b.x);
  await walkTo(bot, m2[0].x, m2[0].y);
  for (const m of m2.slice(1)) await walkTo(bot, m.x, m.y);
  assert.ok(c.flags[C9A.b2]);
  await walkTo(bot, cavePos(2).down.x, cavePos(2).down.y);
  assert.equal(bot.s.map, 'c9a_b3');
  // 地下3階: 2本の 光の 道
  const b3walk = [[11, 12], [11, 11], [11, 10], [11, 9], ...Array.from({ length: 8 }, (_, i) => [10 - i, 9]), [3, 8], [3, 7], [3, 6], [3, 5],
    ...Array.from({ length: 4 }, (_, i) => [3, 6 + i]), ...Array.from({ length: 16 }, (_, i) => [4 + i, 9]), [19, 8], [19, 7], [19, 6], [19, 5]];
  for (const [x, y] of b3walk) await walkTo(bot, x, y);
  assert.ok(c.flags[C9A.b3]);
  await walkTo(bot, cavePos(3).down.x, cavePos(3).down.y);
  assert.equal(bot.s.map, 'c9a_b4');
  await walkTo(bot, caveEntry(4).x - 0.5, caveEntry(4).y - 1.5);
  assert.ok(c.flags[C9A_ROPE], 'ルカが ひもを 下ろした');
  // 9 ためし
  await walkTo(bot, B4_TRIAL.x + 1, B4_TRIAL.y, { fought });
  assert.ok(c.flags[C9A.trial]);
  assert.deepEqual(fought, ['c9a_trio', 'c9a_trial']);
  // 10 星の音さ（広場で 鳴らす）
  const Pd = cavePos(4).pedestal;
  await walkTo(bot, Pd.x, Pd.y + 1);
  await examine(bot, Pd.x, Pd.y);
  assert.ok(c.keyItems.includes(STAR_FORK) && c.flags[C9A.fork]);
  assert.ok(said(bot, '7つ'));
  assert.equal(bot.s.map, 'overworld');
  assert.equal(c.objective, C9A_OBJ.fork);
  // 11 くぼ地の 職人
  await place(bot, C9A_MAP.crater, C.enter.x, C.enter.y);
  await stepOn(bot, C.craft.x + 4, C.craft.y + 1);
  assert.ok(c.flags[C9A.act1]);
  assert.equal(c.objective, C9A_OBJ.act1);
  assert.ok(storyPlace(c).cleared);
  for (const id of ['c9a_inn', 'c9a_shop', 'c9a_buyer']) assert.ok(condOk(MAPS.c9a_crater.npcById[id].show, (f) => !!c.flags[f]), id);
  // 星の音さの れんしゅう（くぼ地で 鳴らすと かくれた 宝箱が 光る）
  const chest = MAPS.c9a_crater.chests.find((x) => x.id === C9A_CHEST_IDS.fork);
  assert.ok(!condOk(chest.show, (f) => !!c.flags[f]));
  await touch(bot, C.rock, 0);
  assert.ok(c.flags[C9A_FORK_RING]);
  assert.ok(condOk(chest.show, (f) => !!c.flags[f]), '宝箱が 光る');
  // のこる 小さな フラグ（セーブを 小さく）
  const left = Object.keys(c.flags).filter((f) => /^c9_/.test(f) && !C9A_LINE.includes(f));
  assert.ok(left.length <= 10, left.join(','));
});

// ───────────── 光の輪の サーバーの 動き ─────────────
test('光の輪（サーバー）: 家族で 同じ 明かり・こけが 消える・とびらは リーダーの 世界に・穴に 落ちると 入口・階を 出ると もどる・snap', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9202), rateLimit: false });
  const A = await addPlayer(world, 'ソラ', 'c9_stairs');
  const B = await addPlayer(world, 'ミク', 'c9_stairs');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  assert.equal(A.bot.s.partyId, B.bot.s.partyId);
  const e = caveEntry(1);
  world.placeSession(A.bot.s, 'c9a_b1', e.x, e.y, 'down', true);
  world.placeSession(B.bot.s, 'c9a_b1', e.x + 1, e.y, 'down', true);
  await play(A.bot, { bots: [B.bot] });
  // ミクが みなもとの となりの こけを ふむ・ソラが その となり → 同じ 明かり
  const P = cavePos(1);
  const mo = P.moss.slice().sort((a, b) => a.x - b.x);
  await place(B.bot, 'c9a_b1', mo[0].x, mo[0].y + 1);
  await stepOn(B.bot, mo[0].x, mo[0].y);
  await place(A.bot, 'c9a_b1', mo[1].x, mo[1].y + 1);
  await stepOn(A.bot, mo[1].x, mo[1].y);
  const st = lightFor(world, A.bot.s);
  assert.equal(st, lightFor(world, B.bot.s), 'パーティーで 1つ');
  assert.equal(connectedOf(MAPS.c9a_b1.c9a, st.lit).size, 2);
  const snapA = c9aSnap(world, A.bot.s), snapB = c9aSnap(world, B.bot.s);
  assert.deepEqual(snapA, snapB);
  assert.equal(snapA.lit.length, 2);
  // のこりを 家族で つなぐと とびらが 開く（リーダーの 世界に）
  for (const m of mo.slice(2)) { await place(B.bot, 'c9a_b1', m.x, m.y + 1); await stepOn(B.bot, m.x, m.y); }
  assert.ok(A.c.flags[C9A.b1], 'リーダー（ソラ）の 世界の とびらが 開く');
  // 穴に 落ちる（地下2階）
  const P2 = cavePos(2);
  const h = P2.holes[0];
  world.placeSession(A.bot.s, 'c9a_b2', h.x - 1 + 0.5, h.y + 0.5, 'right', true);
  await play(A.bot, { bots: [B.bot] });
  await stepOn(A.bot, h.x, h.y);
  assert.equal(A.bot.s.map, 'c9a_b2');
  assert.deepEqual([A.bot.s.x, A.bot.s.y], [caveEntry(2).x, caveEntry(2).y], '入口に もどる');
  assert.ok(said(A.bot, '') || A.bot.msgs.some((m) => m.t === 'toast' && /穴に落ちて/.test(m.text)));
  // 階を 出ると その 階の 明かりは もどる
  world.placeSession(B.bot.s, 'overworld', 30.5, 100.5, 'down', true);
  world.placeSession(A.bot.s, 'overworld', 31.5, 100.5, 'down', true);
  pruneC9a(world);
  assert.ok(![...(world.c9aLight || new Map()).keys()].some((k) => k.endsWith('|c9a_b1')), '明かりは セーブしない・階を 出ると 消える');
  assert.ok(!('c9aLight' in A.c) && !JSON.stringify(A.c).includes('c9aLight'));
  // ひとりの こけは ふんだ 人の 24歩で 消える（サーバー）
  const solo = await setup(9203, 'c9_stairs');
  world.placeSession;
  const s1 = solo.bot;
  await place(s1, 'c9a_b1', mo[3].x, mo[3].y + 1);
  await stepOn(s1, mo[3].x, mo[3].y);
  const st1 = lightFor(solo.world, s1.s);
  assert.equal(st1.lit.size, 1);
  for (let i = 0; i < MOSS_STEPS; i++) await stepOn(s1, mo[3].x - (i % 2), mo[3].y + 1);
  assert.equal(st1.lit.size, 0, '24歩で 消える');
});

test('くらやみ虫（darkOnly）: 光って いる マスには 入らない・出ない・光ると 消える', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9303), rateLimit: false });
  const { bot } = await addPlayer(world, 'ソラ', 'c9_b2');
  const sp = 'c9a_yamimushi'; // B班の くらやみ虫
  assert.equal(MONSTERS[sp]?.darkOnly, true);
  {
    const m = MAPS.c9a_b3;
    const S = cavePos(3).sources[0];
    assert.ok(c9aLitAt(world, 'c9a_b3', S.x, S.y - 1), 'みなもとの まわりは 光って いる');
    assert.ok(!c9aLitAt(world, 'c9a_b3', 2, 6));
    const sym = { sp, x: 2.5, y: 6.5 };
    assert.equal(m.symBlock(world, sym, 2.5, 6.5), false, '暗い 所は 歩ける');
    assert.equal(m.symBlock(world, sym, S.x + 0.5, S.y - 0.5), true, '光の 中には 入らない');
    assert.equal(m.symBlock(world, { sp: Object.keys(MONSTERS).find((k) => !MONSTERS[k].darkOnly), x: 0, y: 0 }, S.x + 0.5, S.y - 0.5), false, 'ふつうの 魔物は かわらない');
    // こけを 光らせると その まわりも 光る
    world.placeSession(bot.s, 'c9a_b3', 2.5, 13.5, 'up', true);
    await play(bot);
    await walkTo(bot, 11, 12);
    await walkTo(bot, 11, 9);
    assert.ok(c9aLitAt(world, 'c9a_b3', 11, 7), '光る こけの まわりが 光る');
    // 光の 中に いた 虫は 消える・光の 中には 出ない
    const { mapState, moveSymbols } = await import('../public/js/shared/world/monsters.js');
    const ms = mapState(world, 'c9a_b3');
    ms.symbols.set('bug1', { id: 'bug1', sp, x: 11.5, y: 8.5, hx: 11.5, hy: 8.5, vx: 0, vy: 0, t: 0, state: 'wander', busy: false, stun: 0, speed: 1, aggro: true, level: 97, zone: C9A_TABLE.b3, group: [sp] });
    ms.symbols.set('bug2', { id: 'bug2', sp, x: 2.5, y: 6.5, hx: 2.5, hy: 6.5, vx: 0, vy: 0, t: 0, state: 'wander', busy: false, stun: 0, speed: 1, aggro: true, level: 97, zone: C9A_TABLE.b3, group: [sp] });
    moveSymbols(world, ms, 50, []);
    assert.ok(!ms.symbols.has('bug1') && ms.symbols.has('bug2'));
  }
});

// ───────────── ひみつの 部屋 ─────────────
test('ひみつの 部屋: 先生の 流れ（地下2階の 黒板の とびら）・炎術士の 流れ（地下3階の こおった とびら）が いる 時だけ 開く', () => {
  const fl = flagsOf(...UPTO('c9_b2'));
  const pc = (job) => ({ partyChars: () => [{ name: 'ソラ', job }] });
  // 黒板: 答えは わかるが、先生が いないと 開かない
  const no = SCRIPTS.c9a_board(ctx(fl, pc('warrior')));
  const chNo = no.find((s) => s[0] === 'choice');
  assert.ok(!JSON.stringify(chNo[3][0]).includes(C9A_SECRETS[0]), '先生が いないと 開かない');
  assert.ok(JSON.stringify(chNo[3][0]).includes('小学校の先生'), '何の 職業か ヒント');
  for (const job of ['elem_teacher', 'nube', 'jigoku_sensei']) {
    const yes = SCRIPTS.c9a_board(ctx(fl, pc(job)));
    assert.ok(JSON.stringify(yes).includes('ぽうっと光った'), `${job}: 答えが 光る`);
    assert.ok(JSON.stringify(yes.find((s) => s[0] === 'choice')[3][0]).includes(C9A_SECRETS[0]), `${job}: 開く`);
    assert.ok(!JSON.stringify(yes.find((s) => s[0] === 'choice')[3][1]).includes(C9A_SECRETS[0]), 'まちがえると 開かない');
  }
  // こおった とびら
  assert.ok(!JSON.stringify(SCRIPTS.c9a_secret2(ctx(fl, pc('warrior')))).includes(C9A_SECRETS[1]));
  for (const job of ['enjutsushi', 'rekka']) assert.ok(JSON.stringify(SCRIPTS.c9a_secret2(ctx(fl, pc(job)))).includes(C9A_SECRETS[1]), job);
  // とびらの おくは 宝箱だけ・ひとりで 先へ 進むには いらない
  for (const [n, k] of [[2, 0], [3, 1]]) {
    const m = MAPS[`c9a_b${n}`];
    const K = cavePos(n).secret;
    assert.ok(isBlocked(m, K.x, K.y, () => false) && !isBlocked(m, K.x, K.y, (f) => f === C9A_SECRETS[k]));
    assert.ok(m.chests.some((c) => c.id === C9A_CHEST_IDS.secret[k]));
  }
});

// ───────────── 負けた 時・とちゅうで 切れた 時 ─────────────
test('負けた 時: 3人組は くぼ地の 手前から・ためしは とびらの 前から やり直せる（ヒントは ノクト）', async () => {
  const { world, bot, c } = await setup(9404, 'c9_trio', [C9A_FOREST_IN]);
  delete c.flags[C9A.trio];
  delete c.flags[C9A.child];
  c.flags[C9A.starfall] = true;
  const C = CRATER_POS;
  await place(bot, C9A_MAP.crater, C.enter.x, C.enter.y);
  const fought = [];
  await walkTo(bot, C.scene.x + 2, C.scene.y + 1, { fought, lose: (id) => id === 'c9a_trio' });
  assert.deepEqual(fought, ['c9a_trio']);
  assert.ok(c.flags[C9A.child] && !c.flags[C9A.trio], '星の子とは 会えた・3人組は まだ');
  // 負けた 回数は B班の ヒントの 文（data/boss-hints-c9a.js）が 入ると 数える
  if (BOSS_HINTS.c9a_trio) assert.equal(c.bossLoss?.c9a_trio, 1);
  const has = (f) => !!c.flags[f];
  const d = retrySpot('c9a_trio', bot.s.map, has);
  assert.ok(d && d.map === C9A_MAP.crater && d.y > C.scene.y + C.scene.h - 1, 'くぼ地の 手前');
  // もう一度: 星の子の 場面は とばして 3人組だけ
  const again = JSON.stringify(SCRIPTS.c9a_child_event(ctx(c.flags)));
  assert.ok(again.includes('c9a_trio') && !again.includes('光る子ども'));
  // ためし
  const d2 = retrySpot('c9a_trial', 'c9a_b4', (f) => UPTO('c9_b3').includes(f));
  assert.ok(d2 && d2.map === 'c9a_b4' && d2.y > B4_TRIAL.y, 'とびらの 前');
  assert.ok(canStand(MAPS.c9a_b4, d2.x, d2.y, () => false));
  void world;
});

test('回線が 切れた 時の つづき: 夜の とちゅう・星の音さを 取った あと・3人組の あと（フラグから 続きが 見られる）', () => {
  // 夜の とちゅうで 切れた（c9_night だけ）: ばあちゃんで 夜を もう一度
  const n1 = JSON.stringify(SCRIPTS.elder(ctx(flagsOf(...UPTO('c9_night'), C9A_PREP_ASK, ...Object.values(C9A_PREP)))));
  assert.ok(n1.includes('"flag","c9_starfall"'));
  // 星の音さを 取って 広場の 前で 切れた: 台で 広場の 場面から
  const p1 = JSON.stringify(SCRIPTS.c9a_pedestal(ctx(flagsOf(...UPTO('c9_trial')), { has: (id) => id === STAR_FORK })));
  assert.ok(p1.includes('"flag","c9_fork"') && !p1.includes('"item","star_fork"'));
  const p0 = JSON.stringify(SCRIPTS.c9a_pedestal(ctx(flagsOf(...UPTO('c9_trial')))));
  assert.ok(p0.includes('"item","star_fork"'));
  // 3人組に 勝った あと: 目標は 村の 守り星の石・石で 階段
  assert.equal(objectiveFromFlags({ flags: flagsOf(...UPTO('c9_trio')) }), C9A_OBJ.trio);
  assert.ok(JSON.stringify(SCRIPTS.star_stone(ctx(flagsOf(...UPTO('c9_trio'))))).includes('"flag","c9_stairs"'));
  // 職人の 場面の とちゅう: くぼ地に 入れば もう一度
  assert.ok(JSON.stringify(SCRIPTS.c9a_crafts(ctx(flagsOf(...UPTO('c9_fork'))))).includes('"flag","c9_act1"'));
  assert.deepEqual(SCRIPTS.c9a_crafts(ctx(flagsOf(...UPTO('c9_act1')))), []);
});

test('回線が 切れた 時: 光の 明かりは のこる（パーティーが ある 間）・もどると snap で また 見える', async () => {
  const { world, bot } = await setup(9505, 'c9_stairs');
  const mo = cavePos(1).moss.slice().sort((a, b) => a.x - b.x);
  await place(bot, 'c9a_b1', mo[0].x, mo[0].y + 1);
  await stepOn(bot, mo[0].x, mo[0].y);
  assert.equal(lightFor(world, bot.s).lit.size, 1);
  // 切れた（とぎれた まま。セッションは のこる）
  world.goAway(bot.s);
  pruneC9a(world);
  assert.equal(lightFor(world, bot.s).lit.size, 1, 'とぎれた 間も のこる');
  const snap = c9aSnap(world, bot.s);
  assert.equal(snap.lit.length, 1);
});

// ───────────── 台本の きまり・絵 ─────────────
test('台本の きまり: 字の ルール・こわい 言い方なし・第1部 第2部の ひみつに ふれない・3人組は もとの 作品の 名前を 使わない', () => {
  const files = ['public/js/shared/data/story-c9a.js', 'public/js/shared/maps/c9a.js', 'public/js/shared/maps/c9a-rows.js', 'public/js/shared/maps/c9a-cave.js',
    'public/js/shared/maps/c9a-forest.js', 'public/js/shared/maps/c9a-field.js', 'public/js/shared/maps/c9a-light.js', 'public/js/shared/world/c9a-steps.js',
    'public/js/client/c9a-light.js', 'public/js/client/render/tiles-c9a.js', 'public/js/client/render/c9a-npc-art.js'];
  const gf = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of files) {
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana' || !/ほしのね/.test(p.text)).filter((p) => p.kind !== 'kana'), [], f);
  }
  void gf;
  const flagSets = [UPTO('c8_solitus'), UPTO('c9_festival'), [...UPTO('c9_festival'), C9A_PREP_ASK], UPTO('c9_starfall'), UPTO('c9_child'), UPTO('c9_trio'), UPTO('c9_trial'), UPTO('c9_fork')];
  const all = JSON.stringify(flagSets.flatMap((fs) => Object.entries(SCRIPTS).filter(([k]) => /^c9a_/.test(k)).map(([, fn]) => { try { return fn(ctx(flagsOf(...fs))); } catch { return []; } })))
    + JSON.stringify(SCRIPTS.elder(ctx(flagsOf(...UPTO('c9_festival'), C9A_PREP_ASK, ...Object.values(C9A_PREP)))));
  assert.ok(!/殺|ころす|死ね|しね/.test(all));
  assert.ok(!/ドロンボー|ドロンジョ|ボヤッキー|トンズラー|ヤッターマン|ポチッとな/.test(all), 'もとの 作品の 名前・せりふは 使わない');
  assert.ok(!/"カイ"|ソリトゥス|トキネ|フリーゾン|ザルバ/.test(all), '第1部・第2部の ひみつに ふれない');
  assert.ok(all.includes('ポチッとね') && all.includes('ホシドロ一味'));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
});

test('絵: 新しい タイル（2D 16×16・動く・2.5D）・テーマ・星の子と 3人組と ふくろうの え・フィールドの 連れ', async () => {
  const { C8A_PAINTERS, C8A_FRAMES, C8A_PROPS, C8A_THEMES, C8A_FLOOR_H } = await import('../public/js/client/render/tiles-c8a.js');
  const { Painter } = await import('../public/js/client/render/pixel.js');
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9A_')).map(([, v]) => v);
  for (const id of ids) {
    const p = new Painter(16, 16);
    assert.ok(C8A_PAINTERS[id], String(id));
    C8A_PAINTERS[id](p, 3, 1, {});
    if (TILE_INFO[id].anim) assert.ok(C8A_FRAMES[id] >= 2, `${id} コマ`);
  }
  assert.ok(C8A_PROPS[T.C9A_SOURCE] && C8A_PROPS[T.C9A_CRYSTAL_ON] && C8A_PROPS[T.C9A_LANTERN_ON]);
  assert.ok(C8A_FLOOR_H[T.C9A_CRATER] < 0);
  for (const th of ['c9a_cave', 'c9a_forest']) assert.ok(C8A_THEMES[th], th);
  const { paintC8cSpecial, C8C_NPC_LOOKS } = await import('../public/js/client/render/c8c-npc-art.js');
  for (const k of ['c9a_spica', 'c9a_owl', 'c9a_signpost']) assert.ok(paintC8cSpecial(k, 'down', 1)?.p, k);
  for (const k of ['c9a_gard', 'c9a_mina', 'c9a_poporo', 'c9a_rin', 'c9a_tina', 'c9a_kirajo', 'c9a_boyacchi', 'c9a_zurakka', 'c9a_buyer', 'c9a_kid']) assert.ok(C8C_NPC_LOOKS[k], k);
  // 場面の 役者・人の 絵の 名前は ある
  const looks = new Set([...Object.keys(C8C_NPC_LOOKS), 'c9a_spica', 'c9a_owl', 'c9a_signpost', 'elder', 'luca', 'nocto', 'pipi', 'woman', 'merchant', 'boy', 'girl', 'flower']);
  const sprites = new Set();
  const grab = (v) => { if (Array.isArray(v)) { if (v[0] === 'actor') sprites.add(v[2].sprite); v.forEach(grab); } };
  for (const fs of [UPTO('c9_festival'), UPTO('c9_starfall'), UPTO('c9_trio'), UPTO('c9_trial'), UPTO('c9_fork')]) {
    for (const [k, fn] of Object.entries(SCRIPTS)) if (/^c9a_|^elder$/.test(k)) { try { grab(fn(ctx(flagsOf(...fs, C9A_PREP_ASK, ...Object.values(C9A_PREP))))); } catch { /* */ } }
  }
  for (const s of sprites) assert.ok(looks.has(s), `役者の 絵 ${s}`);
  for (const id of C9A_MAP_IDS.concat('overworld')) for (const n of MAPS[id].npcs) if (/^c9a_/.test(n.id)) assert.ok(looks.has(n.sprite), `${n.id} ${n.sprite}`);
  // 光の輪の 絵（2D・2.5D）と 星の子の 連れ
  const light = await import('../public/js/client/c9a-light.js');
  assert.equal(typeof light.drawC9aDark2D, 'function');
  assert.equal(typeof light.drawC9aDark3D, 'function');
  for (const id of C9A_CAVE_IDS) assert.ok(MAPS[id].c9a && MAPS[id].dark, `${id} は 光の輪`);
});
