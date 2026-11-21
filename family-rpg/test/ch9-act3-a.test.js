// 第3部 第1章 第3幕「さかさのピラミッド」（第92回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c9_act2 → 船着き場で いかだ（c9_raft_go）→ 地下の川 → ピラミッドの 岸（c9_river）→ さかさのピラミッド 1階 → 2階（c9_p2）→ なぞの番人（c9c_riddle）→ c9_riddle
// → 3階（c9_p3）→ 4階（c9_p4）→ 歌の ボタンを さかさに（c9_song）→ 音の 間: ヒックリカエール2号（c9c_trio2）→ c9_trio2 → 少年 → 星の音（c9_note1）
// → 第4章の ピラミッドの 地下の 階段 → ながれ星のくぼ地（c9_act3）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch9-act3.test.js）。幕は まだ 閉じて いる（PART3_ACT3_OPEN = false）ので、
// 通しの テストでは 台本を 開いた 形で まぜなおす（applyCh9c(…, { open: true })）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import {
  C9C, C9C_LINE, C9C_MAP, C9C_MAP_IDS, C9C_PYR_MAPS, C9C_BATTLE, C9C_BOSS_MON, C9C_CHEST_IDS, C9C_CHEST_ALL, C9C_TABLE, C9C_TRACK_IDS,
  C9C_TILE_FIRST, C9C_TILE_LAST, NOTE_MI, ALGOL, ALGOL_NAME, C9C_SONG, C9C_SONG_REVERSED,
} from '../public/js/shared/maps/c9c-flags.js';
import { UNDER_RAFT } from '../public/js/shared/maps/c9b-flags.js';
import { CH9C_MAPS, C9C_SEEN, C9C_BUTTONS, PYR_B1_STAIRS9C, PEDESTALS9C, PED_MI, CRATER_EVENT9C } from '../public/js/shared/maps/c9c.js';
import { RIVER_POS, PYR_C_POS, RIVER_W, RIVER_H } from '../public/js/shared/maps/c9c-rows.js';
import { flipReach, withFlip, FLIP_FLAG, isPadTile, isShaftTile } from '../public/js/shared/maps/c9c-flip.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH9_STEPS, CH9_PROGRESS, CH9_OBJECTIVE_TARGETS, PART3_ACT3_OPEN, act2ClearObjective, ACT2_END_OLD, c9cTitleSteps,
} from '../public/js/shared/data/story-c9.js';
import { C9C_OBJ, CH9C_STORY_SCRIPTS, CH9C_PROGRESS, CH9C_OBJECTIVE_TARGETS, CH9C_OBJECTIVE_TALK, c9cScripts, applyCh9c } from '../public/js/shared/data/story-c9c.js';
import { C9B_OBJ } from '../public/js/shared/data/story-c9b.js';
import { objectiveFromFlags, repairObjective, KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const FILES9C = ['public/js/shared/maps/c9c-flags.js', 'public/js/shared/data/story-c9c.js', 'public/js/shared/maps/c9c.js', 'public/js/shared/maps/c9c-rows.js',
  'public/js/shared/maps/c9c-flip.js', 'public/js/shared/world/c9c-steps.js', 'public/js/client/c9c-view.js', 'public/js/client/render/tiles-c9c.js',
  'public/js/client/render/c9c-npc-art.js'];
const openScripts = () => c9cScripts(c9cTitleSteps, true);
// 第2幕を クリアして いかだを もった 人
async function act2Player(world, name, upto = 'c9_act2', extra = []) {
  const P = await addPlayer(world, name, upto, extra);
  P.c.keyItems = [...(P.c.keyItems || []), UNDER_RAFT];
  return P;
}
// 向きを 見て 歩く 道（台・ふきぬけ・ありじごく・宝箱は よける。行き先だけは ふむ）
function flipPath(map, sx, sy, tx, ty, has) {
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (x === tx && y === ty) {
      const out = [];
      for (let k = y * map.w + x; k !== sy * map.w + sx; k = prev.get(k)) out.unshift([k % map.w, Math.floor(k / map.w)]);
      return out;
    }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || prev.has(k)) continue;
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(k)) continue;
      const t = effectiveTile(map, nx, ny, has);
      const goal = nx === tx && ny === ty;
      if (!goal && (isPadTile(t) || isShaftTile(t) || map.warpAt.has(k) || TILE_INFO[t]?.flow)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = flipPath(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける（向き ${bot.s.char.c9cFlip ? 'さかさ' : 'ふつう'}）`);
  for (const [x, y] of path) await stepOn(bot, x, y, opts);
}
// 流れる 砂・川に のる（のった 先まで 1歩ずつ。サーバーは 流れを 知らないので、画面と 同じ 道を 歩く）
async function ride(bot, x, y, opts) {
  const map = MAPS[bot.s.map];
  let cx = x, cy = y;
  await stepOn(bot, cx, cy, opts);
  for (let g = 0; g < 200; g++) {
    const has = bot.world.hasFlagFn(bot.s);
    const d = TILE_INFO[effectiveTile(map, cx, cy, has)]?.flow;
    if (!d || isBlocked(map, cx + d[0], cy + d[1], has)) break;
    cx += d[0]; cy += d[1];
    await stepOn(bot, cx, cy, opts);
    if (bot.s.map !== map.id) break;
  }
}
const flipped = (bot) => !!bot.s.char.c9cFlip;
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh9c(SCRIPTS, STORY_SCRIPTS, { title: c9cTitleSteps, open: true });
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: マップ 5まい・タイル 447〜・宝箱の id・一本の 線・決まった 戦い・台本・やり直しの 行き先・字の きまり', () => {
  assert.deepEqual(CH9C_MAPS, ['c9c_river', 'c9c_p1', 'c9c_p2', 'c9c_p3', 'c9c_p4']);
  for (const id of C9C_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
  }
  assert.deepEqual([MAPS.c9c_river.w, MAPS.c9c_river.h], [RIVER_W, RIVER_H]);
  assert.deepEqual([RIVER_W, RIVER_H], [90, 36]);
  assert.deepEqual(C9C_PYR_MAPS.map((id) => [MAPS[id].w, MAPS[id].h]), [[17, 17], [23, 23], [27, 27], [31, 27]]);
  for (const id of C9C_PYR_MAPS) assert.ok(MAPS[id].noEscape && !MAPS[id].pyramid, `${id}: 糸と 羽は 使えない・のろいの 宝の きまりは ない`);
  // タイル（447 から。かさならない・470 まで）
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9C_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C9C_TILE_FIRST);
  assert.ok(ids[ids.length - 1] <= C9C_TILE_LAST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C9C_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  // 一本の 線（第2幕の うしろ）
  assert.deepEqual(C9C_LINE, ['c9_raft_go', 'c9_river', 'c9_p2', 'c9_riddle', 'c9_p3', 'c9_p4', 'c9_song', 'c9_trio2', 'c9_note1', 'c9_act3']);
  assert.deepEqual(CH9_STEPS.slice(-11), ['c9_act2', ...C9C_LINE]);
  assert.deepEqual(STORY_STEPS.slice(-11), ['c9_act2', ...C9C_LINE]);
  // 宝箱（11こ。川 3・ピラミッド 8。天じょうの 宝箱が ある）
  const chests = C9C_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual(chests.sort(), [...C9C_CHEST_ALL].sort());
  assert.equal(C9C_CHEST_IDS.river.length, 3);
  assert.equal(C9C_CHEST_IDS.pyr.length, 8);
  assert.ok(C9C_PYR_MAPS.some((id) => MAPS[id].chests.some((c) => c.c9cSide === 'ceil')));
  // 決まった 戦い（B班）・やり直しの 行き先・ヒントを 言う 人
  for (const id of Object.values(C9C_BATTLE)) assert.ok(FIXED_ENCOUNTERS[id], id);
  assert.deepEqual(C9C_BOSS_MON, { riddle: 'c9c_nazokake', trio2: 'c9c_hikkuri' });
  assert.equal(BOSS_RETRY.c9c_riddle, 'c9c_riddle_event');
  assert.equal(BOSS_RETRY.c9c_trio2, 'c9c_trio2_event');
  assert.equal(BOSS_HINT_WHO.c9c_riddle, 'ノクト');
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある
  for (const id of [...C9C_MAP_IDS, 'pyramid_b1', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c9c_/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH9C_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  for (const id of ['c9c_btn_star', 'c9c_tablet', 'c9c_fount', 'c9c_keeper']) assert.ok(SCRIPTS[id] && !STORY_SCRIPTS.has(id), `${id} は ひとりでも`);
  // 魔物の 出る 表（B班の 名前）
  assert.deepEqual(C9C_TABLE, { river: 't9c_river', pyr: 't9c_pyr', pyr2: 't9c_pyr2' });
  assert.ok(MAPS.c9c_river.spawnCounts.t9c_river > 0 && MAPS.c9c_p1.spawnCounts.t9c_pyr > 0 && MAPS.c9c_p3.spawnCounts.t9c_pyr2 > 0);
  assert.deepEqual(MAPS.c9c_p4.spawnCounts, {}, '4階は 魔物なし');
  for (const z of Object.values(C9C_TABLE)) assert.ok(ENCOUNTER_TABLES[z]?.length, z);
  // 曲の id（F班）・少年・だいじな 物
  assert.deepEqual(C9C_TRACK_IDS, ['c9c_river', 'c9c_pyramid', 'c9c_riddle', 'c9c_trio2', 'c9c_algol', 'c9c_note']);
  assert.equal(MAPS.c9c_river.bgm, 'c9c_river');
  for (const id of C9C_PYR_MAPS) assert.equal(MAPS[id].bgm, 'c9c_pyramid');
  assert.equal(ALGOL, 'algol');
  assert.equal(ALGOL_NAME, 'アルゴル');
  assert.equal(NOTE_MI, 'note_mi');
  assert.deepEqual(C9C_SONG_REVERSED, ['star', 'moon', 'sand', 'sun']);
  // 新しい ファイルは gameFiles に ある・字の きまり
  for (const f of FILES9C) {
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c9c-stub.js・B の c9c-names-b.js）は 合わせた 時に 消した
  for (const f of gameFiles()) assert.ok(!/c9c-stub|c9c-names-b/.test(f), f);
});

// ───────────── 幕が 閉じて いる 間・第4章の ピラミッド ─────────────
test('幕を 開けた（PART3_ACT3_OPEN）: 第2幕 クリアの 目標・前の 文の なおし・船着き場の 番人（閉じた 形も のこる）・第4章の ピラミッドの 地下・くぼ地', () => {
  assert.equal(PART3_ACT3_OPEN, true);
  assert.equal(act2ClearObjective(false), C9B_OBJ.act2);
  assert.equal(act2ClearObjective(true), C9C_OBJ.start);
  assert.equal(ACT2_END_OLD, '第3部　第1章　第3幕へ（続きはアップデートで！）');
  const a2 = flagsOf(...UPTO('c9_act2'));
  assert.equal(objectiveFromFlags({ flags: a2 }), C9C_OBJ.start, '第2幕 クリアの 目標は 第3幕の はじまり');
  const old = { flags: a2, objective: ACT2_END_OLD };
  repairObjective(old);
  assert.equal(old.objective, C9C_OBJ.start, '前の 文は なおる');
  for (const [f, t] of CH9C_PROGRESS) assert.equal(objectiveFromFlags({ flags: flagsOf(...UPTO(f)) }), t, f);
  assert.ok(CH9_OBJECTIVE_TARGETS[C9C_OBJ.start] && KNOWN_OBJECTIVES.has(C9C_OBJ.start));
  // 船着き場の 番人: いかだを 持って いれば 幕が 始まる（パーティー みんなで 乗る）
  const x = ctx(a2, { has: (id) => id === UNDER_RAFT });
  assert.ok(JSON.stringify(SCRIPTS.c9b_folk6(x)).includes('"flag","c9_raft_go"'));
  assert.ok(STORY_SCRIPTS.has('c9b_folk6'));
  assert.ok(!JSON.stringify(SCRIPTS.c9b_folk6(ctx(flagsOf(...UPTO('c9_raft'))))).includes('c9_raft_go'), '第2幕の 間は 今の ことば');
  // 閉じた 形（open false）は 何も 始まらない
  assert.deepEqual(c9cScripts(c9cTitleSteps, false).c9c_ferry(x), []);
  assert.deepEqual(SCRIPTS.c9c_ferry(ctx(a2)), [], 'いかだが ないと 始まらない');
  // 第4章を 遊んで いる 人の ピラミッドの 地下: 階段は 見えない
  const b1 = MAPS.pyramid_b1, S = PYR_B1_STAIRS9C;
  const ch4 = (f) => UPTO('c4_clear').includes(f);
  assert.equal(effectiveTile(b1, S.x, S.y, ch4), b1.tiles[S.y * b1.w + S.x]);
  assert.equal(b1.tiles[S.y * b1.w + S.x], T.CAVE_FLOOR);
  const w = b1.warpAt.get(S.y * b1.w + S.x);
  assert.ok(w && !condOk(w.show, ch4) && condOk(w.show, (f) => f === C9C.note1));
  assert.equal(effectiveTile(b1, S.x, S.y, (f) => f === C9C.note1), T.STAIRS_UP);
  // くぼ地: 星の音の 前は 音の 台が 見えない
  const C = MAPS.c9a_crater;
  const peds = C.npcs.filter((n) => /^c9c_ped/.test(n.id));
  assert.equal(peds.length, 8);
  assert.ok(peds.every((n) => !condOk(n.show, (f) => a2[f])));
  assert.equal(peds.filter((n) => condOk(n.show, (f) => f === C9C.note1)).length, 7);
  assert.equal(peds.filter((n) => condOk(n.show, (f) => f === C9C.note1 || f === C9C.act3)).length, 7);
  assert.ok(!C.triggers.filter((t) => /^c9c_/.test(t.script)).some((t) => condOk(t.show, (f) => a2[f])));
});

// ───────────── いかだの 川下り ─────────────
test('川下り: 流れに 乗って 川の 終わりへ・かじを 切る 所 3つ・わき道の 岸に 宝箱・行き止まりが ない・岩で 止まる', () => {
  const m = MAPS.c9c_river;
  const has = () => false;
  const S = RIVER_POS.start, E = RIVER_POS.end;
  const r = flowReach(m, [S.x, S.y], has);
  const shore = (k) => { const [x, y] = k.split(',').map(Number); return x >= RIVER_POS.shore.x; };
  assert.ok([...r.stops].some(shore), '川の 終わりの 岸に 着ける');
  assert.ok(r.stops.has(`${E.x},${E.y}`));
  // わき道の 岸（宝箱の となり）に 着ける・ゆるい 所 3つで 止まれる
  for (const b of RIVER_POS.banks) assert.ok([...r.stops].some((k) => { const [x, y] = k.split(',').map(Number); return x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h; }), `岸 ${b.x},${b.y}`);
  for (const p of RIVER_POS.pools) assert.ok([...r.stops].some((k) => { const [x, y] = k.split(',').map(Number); return x >= p.x && y >= p.y && x < p.x + p.w && y < p.y + p.h; }), `ゆるい 所 ${p.x},${p.y}`);
  // どこで 止まっても 川の 終わりへ 行ける（行き止まりは ない）
  for (const k of r.stops) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(flowReach(m, [x, y], has).stops.has(`${E.x},${E.y}`), `${k} から 川の 終わりへ`);
  }
  // ゆるい 所から 行き先は 2つ（本流と わき道）
  for (const p of RIVER_POS.pools) {
    const outs = new Set();
    for (let y = p.y - 1; y <= p.y + p.h; y++) for (let x = p.x - 1; x <= p.x + p.w; x++) {
      const d = TILE_INFO[m.tiles[y * m.w + x]]?.flow;
      if (!d) continue;
      const nx = x + d[0], ny = y + d[1];
      const inside = nx >= p.x && ny >= p.y && nx < p.x + p.w && ny < p.y + p.h;
      if (!inside) outs.add(`${d[0]},${d[1]}`);
    }
    assert.ok(outs.size >= 2, `ゆるい 所 ${p.x},${p.y} の 行き先 ${[...outs]}`);
  }
  // 岩に ぶつかると 止まる（岩の 手前で 止まる マスが ある）
  for (const rk of RIVER_POS.rocks) {
    assert.equal(m.tiles[rk.y * m.w + rk.x], T.C9C_RIVROCK);
    assert.ok(r.stops.has(`${rk.x - 1},${rk.y}`) || r.stops.has(`${rk.x},${rk.y + 1}`) || r.stops.has(`${rk.x},${rk.y - 1}`), `岩 ${rk.x},${rk.y}`);
  }
  // 宝箱は わき道の 岸
  RIVER_POS.chests.forEach((c, i) => assert.equal(m.chestAt.get(c.y * m.w + c.x)?.id, C9C_CHEST_IDS.river[i]));
  // 暗い（スピカの 光 4マス）・天じょうの かざり（さかさの 町・ピラミッドの 先）・魔物は 流れの 上だけ
  assert.equal(m.c9cDark.spica, 4);
  assert.ok(m.c9bDecor.some((d) => d.kind === 'town') && m.c9bDecor.some((d) => d.kind === 'pyramid'));
  assert.equal(m.zoneAt(10, 18), 't9c_river');
  assert.ok(m.zoneAt(S.x, S.y).startsWith('safe'));
  assert.ok(m.zoneAt(RIVER_POS.gate.x, RIVER_POS.gate.y).startsWith('safe'));
});

// ───────────── さかさの 台と ふきぬけ（ぜんぶの マス）─────────────
test('さかさの 台と ふきぬけ: どの マスでも どちらの 向きでも 台か ふきぬけに 行ける・2階は 番人に 勝つまで 上へ 行けない・4階の ボタン', () => {
  for (const riddle of [false, true]) {
    const has = (f) => riddle && f === C9C.riddle;
    for (const id of C9C_PYR_MAPS.slice(0, 3)) {
      const m = MAPS[id];
      let n = 0;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) for (const f of [false, true]) {
        const h = withFlip(has, f);
        if (isBlocked(m, x, y, h) || m.chestAt.has(y * m.w + x) || m.npcs.some((q) => q.x === x && q.y === y)) continue;
        const r = flipReach(m, { x, y }, f, has, isBlocked, effectiveTile);
        assert.ok(r.shafts.length || r.pads.length || r.pits.length, `${id} ${x},${y} ${f ? 'さかさ' : 'ふつう'}: 台か ふきぬけへ 行ける`);
        n++;
      }
      assert.ok(n > 40, `${id} しらべた マス ${n}`);
      // 着いた 所から 上の 階へ 行ける（2階は 番人に 勝った あと）
      const P = PYR_C_POS[id];
      const st = P.up || P.enter;
      const r = flipReach(m, st, false, has, isBlocked, effectiveTile);
      const up = r.shafts.some((s) => s.flip);
      if (id === C9C_MAP.p2 && !riddle) assert.ok(!up, '2階: 番人に 勝つまで 上へ 行けない（さくが ある）');
      else assert.ok(up, `${id}: 上の 階へ 行ける`);
      // 着いた 所で もう 一度 落ちない（ふちに 着く）
      for (const k of ['up', 'down', 'enter']) {
        if (!P[k]) continue;
        const t = effectiveTile(m, P[k].x, P[k].y, () => false);
        assert.ok(!isShaftTile(t) && !isPadTile(t) && !isBlocked(m, P[k].x, P[k].y, () => false), `${id} ${k}`);
      }
    }
  }
  // 2階: 台を 3回 ふみ分けないと 番人の へやに 行けない（台を 2つ ふんだ だけでは とどかない）
  const p2 = MAPS.c9c_p2;
  const rd = PYR_C_POS.c9c_p2.riddle;
  const reach0 = flipReach(p2, PYR_C_POS.c9c_p2.up, false, () => false, isBlocked, effectiveTile);
  assert.ok(reach0.stops.some(([x, y]) => x >= rd.x && y >= rd.y && x < rd.x + rd.w && y < rd.y + rd.h), '番人の へやに 行ける');
  // ゆかの あな（ふつうは 通れない・さかさは 天じょう）・ぶら下がる 石（ふつうは 下を 通れる・さかさは かべ）
  assert.ok(isBlocked(p2, 11, 4, () => false) && !isBlocked(p2, 11, 4, (f) => f === FLIP_FLAG));
  assert.ok(!isBlocked(p2, 7, 15, () => false) && isBlocked(p2, 7, 15, (f) => f === FLIP_FLAG));
  assert.equal(effectiveTile(p2, 11, 9, (f) => f === FLIP_FLAG), T.C9C_FENCE, 'さかさの 人には さく');
  assert.equal(effectiveTile(p2, 11, 9, (f) => f === FLIP_FLAG || f === C9C.riddle), T.C9C_FLOOR, '番人に 勝つと さくが 開く');
  // 3階: 流れる 砂は さかさの 時 逆に 流れる
  const p3 = MAPS.c9c_p3;
  assert.equal(effectiveTile(p3, 13, 7, () => false), T.FLOW_N);
  assert.equal(effectiveTile(p3, 13, 7, (f) => f === FLIP_FLAG), T.FLOW_S);
  assert.ok(p3.warps.some((w) => w.to.map === C9C_MAP.p2), '下への 近道');
  // 4階: ふきぬけは ない・ボタン 4つ（月・太陽・星・砂）は どこからでも おせる
  const p4 = MAPS.c9c_p4;
  assert.ok(!p4.tiles.some((t) => t === T.C9C_SHAFT || t === T.C9C_PAD));
  const btn = C9C_BUTTONS.map((b) => p4.actions.find((a) => a.script === `c9c_btn_${b.key}`));
  assert.deepEqual(btn.map((a) => a.x).sort((a, b) => a - b), [9, 13, 17, 21]);
  const r4 = flipReach(p4, PYR_C_POS.c9c_p4.up, false, () => false, isBlocked, effectiveTile);
  for (const a of btn) assert.ok(D4.some(([dx, dy]) => r4.seen(a.x + dx, a.y + dy, false)), `ボタン ${a.script}`);
  assert.deepEqual(C9C_SONG, ['sun', 'sand', 'moon', 'star']);
});

// ───────────── サーバー: 向きは 人ごと・台・ふきぬけ・宝箱 ─────────────
test('サーバー: 台で 向きが かわる（人ごと）・ふきぬけで 上へ 下へ・1階から 岸へ・天じょうの 宝箱・家族の 向き（snap）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9201), rateLimit: false });
  const { bot } = await act2Player(world, 'ソラ', 'c9_river');
  const { bot: b2 } = await act2Player(world, 'ミナ', 'c9_river');
  // 1階: 台を ふむと さかさ（自分だけ）
  await place(bot, C9C_MAP.p1, 8, 15);
  await place(b2, C9C_MAP.p1, 9, 14);
  await go(bot, 2, 8);
  assert.ok(flipped(bot), 'さかさに なった');
  assert.ok(!flipped(b2), '家族の 向きは かわらない');
  assert.ok(world.hasFlagFn(bot.s)(FLIP_FLAG) && !world.hasFlagFn(b2.s)(FLIP_FLAG));
  assert.ok(bot.char.c9cFlip, '画面に 向きが とどく');
  // ふつうの 家族は あなに 入れない・さかさの 人は あなの 上を 歩ける
  const p1 = MAPS.c9c_p1;
  assert.ok(isBlocked(p1, 4, 8, world.hasFlagFn(b2.s)) && !isBlocked(p1, 4, 8, world.hasFlagFn(bot.s)));
  // snap: さかさの 人だけ fp
  await tickN(world, 4);
  const snap = b2.msgs.filter((m) => m.t === 'snap' && m.map === C9C_MAP.p1).pop();
  assert.ok(snap.players.find((p) => p.sid === bot.s.id)?.fp === 1);
  // さかさで ふきぬけ → 2階（ふちに 着く・向きは ふつうに もどる・2階の 場面）
  await go(bot, 7, 7);
  assert.equal(bot.s.map, C9C_MAP.p2);
  assert.ok(!flipped(bot));
  assert.ok(bot.s.char.flags[C9C.p2], '2階に 着いた');
  const U = PYR_C_POS.c9c_p2.up;
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [U.x, U.y]);
  // ふつうで ふきぬけ → 1階（ふちに 着く）→ さらに 1階の ふきぬけ → 岸
  await go(bot, 11, 12);
  assert.equal(bot.s.map, C9C_MAP.p1);
  const D = PYR_C_POS.c9c_p1.down;
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [D.x, D.y]);
  await go(bot, 8, 8);
  assert.equal(bot.s.map, C9C_MAP.river, '1階から 落ちると 岸');
  assert.ok(Math.floor(bot.s.x) >= RIVER_POS.shore.x);
  // 天じょうの 宝箱（2階 B の へや）: ふつうでは 取れない・さかさで 取れる。ゆかの 宝箱は さかさでは 取れない
  const p2 = MAPS.c9c_p2;
  const ceil = p2.chests.find((c) => c.c9cSide === 'ceil');
  const floorC = p2.chests.find((c) => c.c9cSide === 'floor' && c.x < 10);
  await place(bot, C9C_MAP.p2, ceil.x - 1, ceil.y);
  await examine(bot, ceil.x, ceil.y);
  assert.ok(!bot.s.char.chests[ceil.id] && said(bot, '手が、とどかない'));
  bot.s.char.c9cFlip = 1;
  await examine(bot, ceil.x, ceil.y);
  assert.ok(bot.s.char.chests[ceil.id], 'さかさで 取れた');
  await place(bot, C9C_MAP.p2, floorC.x + 1, floorC.y);
  bot.s.char.c9cFlip = 1;
  const before = bot.msgs.length;
  await examine(bot, floorC.x, floorC.y);
  assert.ok(!bot.s.char.chests[floorC.id] && said(bot, 'ゆかに、宝箱が見える', before));
  // 階を かわると ふつうに もどる（だいほんの テレポート でも）
  bot.s.char.c9cFlip = 1;
  await place(bot, C9C_MAP.p3, 13, 16);
  assert.ok(!flipped(bot));
  assert.ok(!bot.char.c9cFlip, '画面の 向きも もどる');
});

// ───────────── 回線が 切れた 時 ─────────────
test('回線が 切れた 時: 場所と 向きを いっしょに おぼえる・食いちがったら その 階の さいごの 台（なければ 着いた 所）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9202), rateLimit: false });
  const { bot, c } = await act2Player(world, 'ソラ', 'c9_p2');
  // 2階で さかさの まま 切れた（あなの 上）→ つなぎなおすと 同じ 場所・同じ 向き
  await place(bot, C9C_MAP.p2, 1, 17);
  await go(bot, 1, 16); // 台 → さかさ
  assert.ok(flipped(bot));
  await go(bot, 10, 19); // あなの 上
  assert.ok(isBlocked(MAPS.c9c_p2, 10, 19, () => false));
  world.leaveWorld(bot.s);
  assert.deepEqual([c.pos.map, Math.floor(c.pos.x), Math.floor(c.pos.y)], [C9C_MAP.p2, 10, 19]);
  assert.ok(c.c9cFlip, '向きも のこる');
  const b2 = new Bot(world, 'ソラ');
  await b2.login();
  b2.send({ t: 'play', id: c.id });
  await b2.settle();
  assert.deepEqual([b2.s.map, Math.floor(b2.s.x), Math.floor(b2.s.y)], [C9C_MAP.p2, 10, 19], '同じ 場所');
  assert.ok(b2.s.char.c9cFlip, '同じ 向き');
  // 食いちがった（向きだけ ふつうに なって いた）→ さいごに ふんだ 台へ
  world.leaveWorld(b2.s);
  delete c.c9cFlip;
  const b3 = new Bot(world, 'ソラ');
  await b3.login();
  b3.send({ t: 'play', id: c.id });
  await b3.settle();
  assert.deepEqual([b3.s.map, Math.floor(b3.s.x), Math.floor(b3.s.y)], [C9C_MAP.p2, 1, 16], 'さいごに ふんだ 台');
  // 台を おぼえて いない 時は 階の 着いた 所
  world.leaveWorld(b3.s);
  delete c.c9cPad;
  c.pos = { map: C9C_MAP.p2, x: 10.5, y: 19.5, dir: 'down' };
  const b4 = new Bot(world, 'ソラ');
  await b4.login();
  b4.send({ t: 'play', id: c.id });
  await b4.settle();
  const U = PYR_C_POS.c9c_p2.up;
  assert.deepEqual([b4.s.map, Math.floor(b4.s.x), Math.floor(b4.s.y)], [C9C_MAP.p2, U.x, U.y], '階の 着いた 所');
  // ピラミッドの 外で つながった 時は 向きを わすれる
  world.leaveWorld(b4.s);
  c.c9cFlip = 1;
  c.pos = { map: C9C_MAP.river, x: 86.5, y: 9.5, dir: 'down' };
  const b5 = new Bot(world, 'ソラ');
  await b5.login();
  b5.send({ t: 'play', id: c.id });
  await b5.settle();
  assert.ok(!c.c9cFlip);
});

// ───────────── 通し（ひとりで c9_act2 → c9_act3）─────────────
test('通し: 船着き場 → 川下り → ピラミッド 1〜4階（ひとりで）→ 番人 → 歌 → 3人組 → 少年 → 星の音 → 地下の 階段 → くぼ地（c9_act3）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9203), rateLimit: false });
  const { bot, c } = await act2Player(world, 'ソラ');
  c.objective = C9C_OBJ.start;
  const fought = [];
  const opts = { fought };
  // 1 船着き場の 番人
  await talkTo(bot, 'c9b_under', 'c9b_folk6', 0, opts);
  assert.ok(c.flags[C9C.raftGo]);
  assert.ok(said(bot, 'さかさのピラミッド'), '題の 画面');
  assert.equal(bot.s.map, C9C_MAP.river);
  assert.equal(c.objective, C9C_OBJ.raftGo);
  // 2 川下り（本流 → わき道 1 の 岸の 宝箱 → 本流 … さかさの 町 → 川の 終わり）
  const m = MAPS.c9c_river;
  const ch1 = RIVER_POS.chests[0];
  const path1 = pathTo(m, Math.floor(bot.s.x), Math.floor(bot.s.y), ch1.x - 1, ch1.y, () => false);
  for (const [x, y] of path1) await stepOn(bot, x, y, opts);
  await examine(bot, ch1.x, ch1.y, opts);
  assert.ok(c.chests[C9C_CHEST_IDS.river[0]], 'わき道の 宝箱');
  const S = RIVER_POS.shoreScene;
  const path2 = pathTo(m, Math.floor(bot.s.x), Math.floor(bot.s.y), S.x, S.y + 2, () => false);
  for (const [x, y] of path2) await stepOn(bot, x, y, opts);
  assert.ok(said(bot, '人が、住んでいるのか'), 'さかさの 町の 下');
  assert.ok(c.flags[C9C.river] && !c.flags[C9C_SEEN.town]);
  assert.equal(c.objective, C9C_OBJ.river);
  // いかだ乗り場（岸 ⇄ 里）
  await talkTo(bot, C9C_MAP.river, 'c9c_post2', 0, opts);
  assert.equal(bot.s.map, 'c9b_under');
  bot.choice = 1;
  await talkTo(bot, 'c9b_under', 'c9b_folk6', 1, opts);
  assert.equal(bot.s.map, C9C_MAP.river);
  assert.ok(Math.floor(bot.s.x) >= RIVER_POS.shore.x, 'ピラミッドの 岸へ すぐ 行ける');
  // 3 → 1階
  const G = RIVER_POS.gate;
  for (const [x, y] of pathTo(m, Math.floor(bot.s.x), Math.floor(bot.s.y), G.x, G.y, () => false)) await stepOn(bot, x, y, opts);
  assert.equal(bot.s.map, C9C_MAP.p1);
  await go(bot, 8, 13, opts);
  assert.ok(c.flags[C9C_SEEN.p1], '1階の ことば');
  await go(bot, 2, 12, opts);
  await examine(bot, 1, 12, opts); // 1階の 宝箱（となりから しらべる）
  await go(bot, 2, 8, opts);
  assert.ok(flipped(bot));
  await go(bot, 7, 7, opts);
  // 4 2階（台 3回）→ 5 番人
  assert.equal(bot.s.map, C9C_MAP.p2);
  assert.equal(c.objective, C9C_OBJ.p2);
  await go(bot, 1, 16, opts); // P1 → さかさ
  assert.ok(flipped(bot));
  await go(bot, 21, 21, opts); // B の P2 → ふつう
  assert.ok(!flipped(bot));
  await go(bot, 21, 1, opts); // C の P3 → さかさ
  assert.ok(flipped(bot));
  await go(bot, 12, 2, opts); // 番人の へや
  assert.ok(fought.includes(C9C_BATTLE.riddle), '番人と 戦った');
  assert.ok(c.flags[C9C.riddle]);
  assert.ok(said(bot, 'さかさの歌が、とびらを開く'));
  assert.equal(c.objective, C9C_OBJ.riddle);
  await go(bot, 11, 10, opts); // ちか道 → さく → ふきぬけ
  // 6 3階（流れる 砂: 北の へやへ → 台 → 逆の 流れで まん中へ → ふきぬけ）
  assert.equal(bot.s.map, C9C_MAP.p3);
  assert.ok(said(bot, '星の音は、この下よ'), '上から 3人組の 声');
  await go(bot, 13, 9, opts);
  await ride(bot, 13, 8, opts);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [13, 5], '北の へやへ 流された');
  await go(bot, 12, 1, opts);
  await examine(bot, 13, 1, opts);
  assert.ok(said(bot, 'さかさの国では、歌も、さかさに'), 'わらべ歌の 石の 板');
  await go(bot, 9, 1, opts);
  assert.ok(flipped(bot));
  await go(bot, 13, 5, opts);
  await ride(bot, 13, 6, opts);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [13, 9], 'さかさの 時は 逆に 流れる');
  await go(bot, 13, 12, opts);
  // 7 4階: まちがえると 3階へ・さかさの じゅんで とびら
  assert.equal(bot.s.map, C9C_MAP.p4);
  assert.equal(c.objective, C9C_OBJ.p4);
  const btn = (key) => C9C_BUTTONS.find((b) => b.key === key);
  const press = async (key) => {
    const a = MAPS.c9c_p4.actions.find((q) => q.script === `c9c_btn_${key}`);
    await go(bot, a.x, a.y + 1, opts);
    await examine(bot, a.x, a.y, opts);
  };
  await press('star');
  assert.ok(c.flags[btn('star').flag]);
  await press('sun'); // まちがい
  assert.equal(bot.s.map, C9C_MAP.p3, 'まちがえると 3階へ');
  assert.ok(!c.flags[btn('star').flag]);
  await place(bot, C9C_MAP.p4, PYR_C_POS.c9c_p4.up.x, PYR_C_POS.c9c_p4.up.y);
  for (const k of C9C_SONG_REVERSED) await press(k);
  assert.ok(c.flags[C9C.song]);
  assert.ok(C9C_BUTTONS.every((b) => !c.flags[b.flag]), 'ボタンの 小さな フラグは 消える');
  assert.ok(!isBlocked(MAPS.c9c_p4, 15, 18, world.hasFlagFn(bot.s)), 'とびらが 開いた');
  // 8〜11 音の 間
  await go(bot, 15, 20, opts);
  assert.ok(fought.includes(C9C_BATTLE.trio2), '3人組と 戦った');
  for (const [f, text] of [[C9C.trio2, 'ア、アルゴルさま'], [C9C.note1, 'のこりの音は、ぼくがもらう']]) {
    assert.ok(c.flags[f], f);
    assert.ok(said(bot, text), text);
  }
  assert.ok(said(bot, '空のにおいがする') && said(bot, 'の光が、少し強くなった'));
  assert.ok(c.keyItems.includes(NOTE_MI), '星の音・ミ');
  assert.equal(c.objective, C9C_OBJ.note1);
  // 地下の 階段 → 第4章の ピラミッドの 地下（ミイラのへや）
  const St = PYR_C_POS.c9c_p4.stairs;
  await go(bot, St.x, St.y, opts);
  assert.equal(bot.s.map, 'pyramid_b1');
  // 12 くぼ地
  const E = CRATER_EVENT9C;
  await place(bot, 'c9a_crater', 12, 15, 'up', opts);
  await stepOn(bot, 12, E.y + 1, opts);
  assert.ok(c.flags[C9C.act3]);
  assert.ok(said(bot, 'さかさのピラミッド'));
  assert.equal(c.objective, C9C_OBJ.act3);
  assert.ok(!c.flags[C9C_SEEN.p1], '小さな フラグは 消える');
  const C = MAPS.c9a_crater;
  assert.ok(condOk(C.npcById.c9c_ped_mi.show, (f) => !!c.flags[f]) && !condOk(C.npcById.c9c_ped3.show, (f) => !!c.flags[f]), '黄の 台が 光る');
  // 宝箱 11こ の うち 取った 物
  assert.ok(c.chests.c9c_q1, '1階の 宝箱');
  void PEDESTALS9C; void PED_MI;
});

// ───────────── 目標と しおり・台本の きまり ─────────────
test('目標と 行き先・仲間の ひとこと・すすみぐあい・しおり', async () => {
  for (const [f, t] of CH9C_PROGRESS) {
    assert.ok(C9C_LINE.includes(f), f);
    assert.ok(CH9C_OBJECTIVE_TARGETS[t]?.length, `行き先 ${t}`);
    const talk = CH9C_OBJECTIVE_TALK[t];
    assert.ok(talk && ['self', 'bold', 'kind', 'kid'].every((k) => talk[k]?.length > 8), `ひとこと ${t}`);
  }
  assert.ok(CH9C_OBJECTIVE_TARGETS[C9C_OBJ.start] && CH9C_OBJECTIVE_TALK[C9C_OBJ.start]);
  const { CHAPTERS } = await import('../public/js/shared/world/shiori.js').catch(() => ({}));
  const sh = readFileSync(new URL('../public/js/shared/world/shiori.js', import.meta.url), 'utf8');
  assert.ok(sh.includes("start: 'c9_raft_go', title: 'さかさのピラミッド'"), 'しおりの 第3幕');
  void CHAPTERS;
});

test('台本の きまり: もとの 作品の 名前を 使わない・第1部 第2部の ひみつ・カイ・ソリトゥス・少年の わけを 書かない', () => {
  const sets = C9C_LINE.map((f) => UPTO(f)).concat([UPTO('c9_act2')]);
  const scripts = openScripts();
  const all = JSON.stringify(sets.flatMap((fs) => Object.values(scripts).map((fn) => { try { return fn(ctx(flagsOf(...fs), { has: () => true })); } catch { return []; } })));
  assert.ok(all.includes('アルゴル') && all.includes('ナゾカケ') && all.includes('ヒックリカエール2号'));
  assert.ok(!/ドロンボー|ドロンジョ|ボヤッキー|トンズラー|スフィンクス/.test(all), 'もとの 作品の 名前は 使わない');
  assert.ok(!/"カイ"|カイ[、。！]|ソリトゥス|トキネ|フリーゾン|ザルバ/.test(all), '第1部・第2部の ひみつに ふれない');
  assert.ok(!/殺|ころす|死ね|しね/.test(all));
  // 少年は 名前と すがたと ひとことだけ（わけは 書かない）
  assert.ok(!/アルゴル[^"]*(ため|わけ|だから)/.test(all));
  assert.ok(all.includes('空のにおいがする') && all.includes('のこりの音は、ぼくがもらう'));
});

test('絵: 新しい タイル（2D 16×16・動く・2.5D）・テーマ（ふつう・さかさ）・少年と 番人と 光の 玉と 音の 台・いかだ', async () => {
  const { C9A_PAINTERS, C9A_FRAMES, C9A_PROPS, C9A_THEMES, C9A_FLOOR_H, c9aBlockSpec } = await import('../public/js/client/render/tiles-c9a.js');
  const { Painter } = await import('../public/js/client/render/pixel.js');
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9C_')).map(([, v]) => v);
  for (const id of ids) {
    const p = new Painter(16, 16);
    assert.ok(C9A_PAINTERS[id], String(id));
    C9A_PAINTERS[id](p, 3, 1, {});
    if (TILE_INFO[id].anim) assert.ok(C9A_FRAMES[id] >= 2, `${id} コマ`);
  }
  for (const id of [T.C9C_CAVE, T.C9C_WALL, T.C9C_STONE, T.C9C_RIVROCK, T.C9C_FENCE]) assert.ok(c9aBlockSpec(id, 0), String(id));
  assert.ok(C9A_PROPS[T.C9C_FOUNT]);
  assert.ok(C9A_FLOOR_H[T.C9C_SHAFT] < -0.5 && C9A_FLOOR_H[T.C9C_HOLE] < -0.5);
  for (const th of ['c9c_river', 'c9c_pyr', 'c9c_flip']) assert.ok(C9A_THEMES[th], th);
  const { paintC8cSpecial } = await import('../public/js/client/render/c8c-npc-art.js');
  for (const s of ['algol', 'c9c_nazokake', 'c9c_orb', 'c9c_post', 'c9c_ped_on', ...Array.from({ length: 7 }, (_, i) => `c9c_ped${i}`)]) assert.ok(paintC8cSpecial(s, 'down', 1)?.p, `絵 ${s}`);
  for (const id of C9C_MAP_IDS.concat(['c9a_crater'])) for (const n of MAPS[id].npcs) if (/^c9c_/.test(n.id)) assert.ok(paintC8cSpecial(n.sprite, 'down', 0)?.p, n.sprite);
  const view = await import('../public/js/client/c9c-view.js');
  for (const f of ['noteC9cTheme', 'c9cOtherAlpha', 'c9cChestAlpha', 'raftAt9c', 'drawRaft2D', 'raftEntity9c', 'drawC9cDark2D', 'drawC9cDark3D', 'drawC9cFlip2D', 'drawC9cFlip3D']) assert.equal(typeof view[f], 'function', f);
  // 向きで テーマが かわる・ちがう 向きの 家族は うすい・天じょうの 宝箱
  const map = { c9cPyr: true, theme: 'c9c_pyr' };
  const field = (flip) => ({ map, game: { me: { c9cFlip: flip ? 1 : 0 } } });
  view.noteC9cTheme(field(true));
  assert.equal(map.theme, 'c9c_flip');
  view.noteC9cTheme(field(false));
  assert.equal(map.theme, 'c9c_pyr');
  assert.equal(view.c9cOtherAlpha(field(false), { fp: true }), 0.4);
  assert.equal(view.c9cOtherAlpha(field(true), { fp: true }), 1);
  assert.equal(view.c9cChestAlpha(field(false), { c9cSide: 'ceil' }), 0.5);
  assert.equal(view.c9cChestAlpha(field(true), { c9cSide: 'floor' }), 0.4);
  const rv = { map: MAPS.c9c_river };
  assert.ok(view.raftAt9c(rv, 10.5, 18.5) && !view.raftAt9c(rv, RIVER_POS.gate.x + 0.5, RIVER_POS.gate.y + 0.5));
});
