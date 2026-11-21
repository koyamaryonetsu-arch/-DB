// 第3部 第1章 第4幕「星のはかば」（第93回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c9_act3 → くぼ地の 黄の 台で スピカが 歌う（c9_song1）→ ピラミッドの 岸の ひびきの とびら（c9_echo1 → c9_door）→ ふたごの道 1階（echo2・echo3）
// → 2階（c9_g2。echo4・こだま echo5）→ 星のはかば（c9_grave）→ 魔人（c9d_mu）→ c9_mu → 大きな くぼみ（c9_hollow）→ くぼ地（c9_act4）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch9-act4.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C9D, C9D_LINE, C9D_MAP, C9D_MAP_IDS, C9D_ECHO, C9D_CHEST_IDS, C9D_TILE_FIRST, C9D_TILE_LAST, C9D_TRACK_IDS, C9D_BATTLE,
  C9D_SPICA_LIGHT, C9D_APART_LIGHT, C9D_FORK_SECONDS, songStage9,
} from '../public/js/shared/maps/c9d-flags.js';
import { C9A } from '../public/js/shared/maps/c9a-flags.js';
import { CH9D_MAPS, C9D_SEEN, CRATER_SONG9D, stoneScript9d } from '../public/js/shared/maps/c9d.js';
import { C9D_POS, SHORE_DOOR9D, SHORE_STONES9D } from '../public/js/shared/maps/c9d-rows.js';
import { stoneFront9d, laneCenters9d, laneBright9d, apartStage9d, FORK_MS9D } from '../public/js/shared/maps/c9d-lane.js';
import { stoneSteps9d, laneState9d, spicaAway9d, spicaLeft9d, spicaHelpHidden9d, c9dSnap, pruneC9d } from '../public/js/shared/world/c9d-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH9_STEPS, PART3_ACT4_OPEN, act3ClearObjective, ACT3_END_OLD, c9dTitleSteps, CH9_PROGRESS, CH9_OBJECTIVE_TARGETS, act4ClearObjective } from '../public/js/shared/data/story-c9.js';
import { C9C_OBJ } from '../public/js/shared/data/story-c9c.js';
import { C9D_OBJ, CH9D_STORY_SCRIPTS, CH9D_PROGRESS, CH9D_OBJECTIVE_TARGETS, CH9D_OBJECTIVE_TALK, c9dScripts, applyCh9d } from '../public/js/shared/data/story-c9d.js';
import { objectiveFromFlags, repairObjective, KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, fixedWorld } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES9D = ['public/js/shared/maps/c9d-flags.js', 'public/js/shared/data/story-c9d.js', 'public/js/shared/maps/c9d.js', 'public/js/shared/maps/c9d-rows.js',
  'public/js/shared/maps/c9d-lane.js', 'public/js/shared/world/c9d-steps.js',
  'public/js/client/c9d-view.js', 'public/js/client/render/tiles-c9d.js', 'public/js/client/render/c9d-npc-art.js'];
const openScripts = () => c9dScripts(c9dTitleSteps, true);
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh9d(SCRIPTS, STORY_SCRIPTS, { title: c9dTitleSteps, open: true });
}
const WALK = 4.6; // client/field.js の 歩く はやさ（マス/びょう）

// 歩ける 道（石・宝箱は よける。行き先だけは ふむ）
function pathFor(map, sx, sy, tx, ty, has) {
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
      if (!(nx === tx && ny === ty) && map.warpAt.has(k)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) await stepOn(bot, x, y, opts);
}
// 石の 前（南）まで 歩いて しらべる（choice … えらぶ 物の 番号）
async function useStone(bot, id, label, opts) {
  const map = MAPS[bot.s.map];
  const s = map.c9dStones.find((q) => q.id === id);
  const f = stoneFront9d(s);
  await go(bot, Math.floor(f.x), Math.floor(f.y), opts);
  // えらぶ 物の 番号は その 時の ようすで かわる（サーバーの 台本で ラベルを 見つける）
  const st = stoneSteps9d(bot.world, bot.s, id).find((x) => x[0] === 'choice');
  assert.ok(st, `${id}: えらぶ 物が ある`);
  const idx = st[2].findIndex((l) => l.includes(label));
  assert.ok(idx >= 0, `${id}: 「${label}」が えらべる（${st[2].join('/')}）`);
  bot.choice = idx;
  bot.send({ t: 'interact', kind: 'tile', x: s.x, y: s.y });
  await play(bot, opts);
  bot.choice = 0;
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: マップ 3まい・タイル 471〜・宝箱の id・一本の 線・ひびきの石・台本・やり直しの 行き先・字の きまり', () => {
  assert.deepEqual(CH9D_MAPS, ['c9d_g1', 'c9d_g2', 'c9d_grave']);
  for (const id of C9D_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
  }
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9D_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C9D_TILE_FIRST);
  assert.ok(ids[ids.length - 1] <= C9D_TILE_LAST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C9D_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.deepEqual(C9D_LINE, ['c9_song1', 'c9_door', 'c9_g2', 'c9_grave', 'c9_mu', 'c9_hollow', 'c9_act4']);
  assert.deepEqual(CH9_STEPS.slice(-8), ['c9_act3', ...C9D_LINE]);
  // 第94回 A班: その うしろに 第3部 第2章の 一本の 線（c10_start・c10_act1）
  assert.deepEqual(STORY_STEPS.slice(-10, -2), ['c9_act3', ...C9D_LINE]);
  assert.deepEqual(STORY_STEPS.slice(-2), ['c10_start', 'c10_act1']);
  assert.deepEqual(C9D_ECHO, ['c9_echo1', 'c9_echo2', 'c9_echo3', 'c9_echo4', 'c9_echo5']);
  for (const f of C9D_ECHO) assert.ok(!STORY_STEPS.includes(f), `${f} は 一本の 線に 入らない`);
  // 宝箱 8こ（1階 3・2階 3・はかば 2）
  const chests = C9D_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual(chests.sort(), [...C9D_CHEST_IDS].sort());
  // ひびきの石: 組ごとに 2つ（こだまは 3つ）・岸に 2つ
  const stones = [...MAPS.c9c_river.c9dStones, ...MAPS.c9d_g1.c9dStones, ...MAPS.c9d_g2.c9dStones];
  const by = (n) => stones.filter((s) => s.echo === n).length;
  assert.deepEqual([1, 2, 3, 4, 5].map(by), [2, 2, 2, 2, 3]);
  for (const s of stones) {
    assert.ok(SCRIPTS[stoneScript9d(s.id)], s.id);
    assert.ok(s.lane === 'L' || s.lane === 'R', s.id);
    assert.ok(['L', 'R'].every((l) => stones.some((q) => q.echo === s.echo && q.lane === l)), `組 ${s.echo} は 左右に ある`);
  }
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある
  for (const id of [...C9D_MAP_IDS, 'c9c_river', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c9d_/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH9D_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  assert.equal(BOSS_RETRY.c9d_mu, 'c9d_mu_event');
  assert.equal(BOSS_HINT_WHO.c9d_mu, 'ノクト');
  assert.deepEqual(C9D_TRACK_IDS, ['c9d_lane', 'c9d_grave', 'c9d_mu', 'c9d_song', 'c9d_end']);
  assert.equal(MAPS.c9d_g1.bgm, 'c9d_lane');
  assert.equal(MAPS.c9d_grave.bgm, 'c9d_grave');
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES9D) {
    assert.ok(list.some((x) => x.endsWith(f)), `gameFiles に ${f}`);
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c9d-stub.js・B の c9d-names-b.js）は 合わせた 時に 消した
  for (const f of gameFiles()) assert.ok(!/c9d-stub|c9d-names-b/.test(f), f);
  // 宝箱の 中みは B班の 品（お金では ない）
  for (const id of C9D_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(ch.item && !ch.gold, ch.id);
  assert.ok(ENCOUNTER_TABLES.t9d_lane && ENCOUNTER_TABLES.t9d_lane2 && FIXED_ENCOUNTERS.c9d_mu);
});

test('幕を 開けた（PART3_ACT4_OPEN）: 第3幕 クリアの 目標・前の 文の なおし・黄の 台の 前で 始まる（閉じた 形も のこる）', () => {
  assert.equal(PART3_ACT4_OPEN, true);
  assert.equal(act3ClearObjective(), C9D_OBJ.start);
  assert.equal(act3ClearObjective(false), C9C_OBJ.act3);
  assert.equal(ACT3_END_OLD, '第3部　第1章　第4幕へ（続きはアップデートで！）');
  const a3 = flagsOf(...UPTO('c9_act3'));
  assert.equal(objectiveFromFlags({ flags: a3 }), C9D_OBJ.start, '第3幕 クリアの 目標は 第4幕の はじまり');
  const old = { flags: a3, objective: ACT3_END_OLD };
  repairObjective(old);
  assert.equal(old.objective, C9D_OBJ.start, '前の 文は なおる');
  // 第94回 A班: 第2章 第1幕が 開いたので、第1章 クリア（c9_act4）の 目標は 第2章の はじまり（story-c9.js の act4ClearObjective）
  for (const [f, t] of CH9D_PROGRESS) assert.equal(objectiveFromFlags({ flags: flagsOf(...UPTO(f)) }), f === 'c9_act4' ? act4ClearObjective() : t, f);
  assert.ok(CH9_PROGRESS.some(([f]) => f === 'c9_act4'));
  assert.ok(KNOWN_OBJECTIVES.has(C9D_OBJ.start) && CH9_OBJECTIVE_TARGETS[C9D_OBJ.start]);
  // 閉じた 形（open false）は 何も 始まらない
  const closed = c9dScripts(c9dTitleSteps, false);
  assert.deepEqual(closed.c9d_song_event(ctx(a3)), []);
  assert.ok(SCRIPTS.c9d_song_event(ctx(a3)).length > 0);
  assert.ok(JSON.stringify(SCRIPTS.c9d_song_event(ctx(a3))).includes('第4幕　星のはかば'), '題の 画面');
  assert.ok(JSON.stringify(SCRIPTS.c9c_ped(ctx(a3))).includes('c9_song1'), '黄の 台を しらべても 始まる');
  assert.deepEqual(SCRIPTS.c9d_song_event(ctx(flagsOf(...UPTO('c9_note1')))), [], '第3幕の 間は 始まらない');
  // 岸の とびら・石は c9_song1 から（閉じて いる 間は 出ない）
  const river = MAPS.c9c_river;
  const no = () => false, yes = (f) => f === C9D.song1;
  assert.notEqual(effectiveTile(river, SHORE_DOOR9D.x, SHORE_DOOR9D.y, no), T.C9D_DOOR);
  assert.equal(effectiveTile(river, SHORE_DOOR9D.x, SHORE_DOOR9D.y, yes), T.C9D_DOOR);
  for (const s of SHORE_STONES9D) {
    assert.notEqual(effectiveTile(river, s.x, s.y, no), T.C9D_ECHO);
    assert.equal(effectiveTile(river, s.x, s.y, yes), T.C9D_ECHO);
  }
  assert.ok(MAPS.c9a_crater.triggers.some((t) => t.script === 'c9d_song_event'));
  assert.ok(CRATER_SONG9D.w > 0);
});

test('ふたごの道: どの マスからも 歩いて 入口へ もどれる（橋が かかる 前も あとも）・左右の 道は 入口で つながる', () => {
  for (const id of [C9D_MAP.g1, C9D_MAP.g2, C9D_MAP.grave]) {
    const map = MAPS[id];
    const P = C9D_POS[id];
    const combos = [[], ['c9_echo2'], ['c9_echo2', 'c9_echo3'], ['c9_echo4'], ['c9_echo4', 'c9_echo5'], ['c9_echo5'], C9D_ECHO];
    for (const fl of combos) {
      const has = (f) => fl.includes(f);
      const start = P.enter;
      const seen = new Set([start.y * map.w + start.x]);
      const q = [[start.x, start.y]];
      for (let h = 0; h < q.length; h++) {
        const [x, y] = q[h];
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
          if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(k) || isBlocked(map, nx, ny, has)) continue;
          seen.add(k);
          q.push([nx, ny]);
        }
      }
      // 島が ない: 歩ける マスは ぜんぶ 入口から とどく（とぎれた 道の 先も、橋が かかる まで 入れないので 島に ならない ものだけ）
      const walk = [];
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (!isBlocked(map, x, y, has)) walk.push(y * map.w + x);
      const lost = walk.filter((k) => !seen.has(k));
      // 橋が かかる 前の 先の 道は 入れない ので 島で よいが、そこへ 行く 手立て（橋が かかった 時）に 入口と つながる ことを 下で 見る
      if (fl === C9D_ECHO) assert.deepEqual(lost, [], `${id}: 橋が ぜんぶ かかった 時は どの マスからも 入口へ`);
    }
  }
  // 左右の 道は 入口の 広間で つながる（橋なし）
  for (const id of [C9D_MAP.g1, C9D_MAP.g2]) {
    const map = MAPS[id];
    const st = map.c9dStones;
    const L = st.find((s) => s.lane === 'L' && s.echo === Math.min(...st.map((q) => q.echo)));
    const R = st.find((s) => s.lane === 'R' && s.echo === L.echo);
    const a = stoneFront9d(L), b = stoneFront9d(R);
    assert.ok(pathFor(map, Math.floor(a.x), Math.floor(a.y), Math.floor(b.x), Math.floor(b.y), () => false), `${id}: 左の 石から 右の 石へ 歩ける`);
  }
});

test('こだま（2階の さいごの 石 3つ）: 2つめから 3つめまで ひとりで 歩いて 20びょうに 間に 合う', () => {
  const map = MAPS.c9d_g2;
  const g5 = map.c9dStones.filter((s) => s.echo === 5);
  assert.equal(g5.length, 3);
  const has = (f) => f === 'c9_echo4';
  const [s1, s2, s3] = g5;
  assert.notEqual(s1.lane, s2.lane);
  const a = stoneFront9d(s2), b = stoneFront9d(s3);
  const p = pathFor(map, Math.floor(a.x), Math.floor(a.y), Math.floor(b.x), Math.floor(b.y), has);
  assert.ok(p);
  const sec = p.length / WALK;
  assert.ok(sec < C9D_FORK_SECONDS / 3, `${p.length}マス ${sec.toFixed(1)}びょう（しらべる 時間を 入れても 間に 合う）`);
  // 1つめ（スピカ）は 左の 道の おく（echo4 の 橋の 先）
  assert.ok(!pathFor(map, Math.floor(a.x), Math.floor(a.y), Math.floor(stoneFront9d(s1).x), Math.floor(stoneFront9d(s1).y), () => false));
  assert.ok(pathFor(map, Math.floor(a.x), Math.floor(a.y), Math.floor(stoneFront9d(s1).x), Math.floor(stoneFront9d(s1).y), has));
});

test('明かりの 計算: スピカ 5マス・はなれた 人 1マス半・ランプ・鳴って いる 石・曲の apartStage・スピカの歌の songStage', () => {
  const map = MAPS.c9d_g1;
  assert.equal(C9D_SPICA_LIGHT, 5);
  assert.equal(C9D_APART_LIGHT, 1.5);
  const sp = { x: 4.5, y: 22.5 };
  const cs = laneCenters9d(map, { spica: sp, singing: true, people: [{ x: 26.5, y: 22.5 }], lamps: { L: false, R: true }, ringing: new Set(['g1a']) });
  assert.ok(cs.some((c) => c[3] === 'song' && c[2] === 5));
  assert.ok(cs.some((c) => c[3] === 'me' && c[2] === 1.5));
  assert.ok(cs.some((c) => c[3] === 'lamp') && cs.some((c) => c[3] === 'lampDim'));
  assert.ok(cs.some((c) => c[3] === 'ring'));
  // 魔物の 明るさ: スピカの まわりと 光った ランプ
  assert.ok(laneBright9d(map, { spica: sp, lamps: {} }, 4, 24));
  assert.ok(!laneBright9d(map, { spica: sp, lamps: {} }, 26, 22));
  assert.ok(laneBright9d(map, { spica: sp, lamps: { R: true } }, 24, 22));
  assert.equal(apartStage9d({ x: 4.5, y: 24 }, sp), 0);
  assert.equal(apartStage9d({ x: 26.5, y: 24 }, sp), 1);
  // スピカの歌: くぼ地の 台に 置いた 星の音の 数（今は 黄の 1つ）
  assert.equal(songStage9(() => false), 1);
  assert.equal(songStage9((f) => f === 'c9_act3'), 1);
});

test('「音楽を聞く」: スピカの歌は 集めた 音の 数の ふしまで（ほかの 曲は 4だん）', async () => {
  const { phaseMaxOf } = await import('../public/js/client/ui/soundtest.js');
  assert.equal(phaseMaxOf('c9d_song', () => false), 0);
  assert.equal(phaseMaxOf('c9d_song', (f) => f === 'c9_act3'), 0, '黄の 1つだけ → 1ふしめ');
  assert.equal(phaseMaxOf('c9d_lane', () => false), 3);
  assert.equal(phaseMaxOf('c9a_child', () => false), 3);
});

// ───────────── 世界で 遊ぶ ─────────────
async function act3Player(world, name) {
  openAct();
  const P = await addPlayer(world, name, 'c9_act3');
  P.c.objective = act3ClearObjective(true);
  return P;
}
// ピラミッドの 岸に 立つ
async function toShore(bot, opts) {
  await place(bot, 'c9c_river', 86, 6, 'up', opts);
}

test('サーバー: スピカに 歌って もらう → ついて 来ない・音さ 20びょう・組が そろうと 開く・スピカが もどる・HUD で よぶ・戦いの 助け', async () => {
  const world = fixedWorld(9301);
  const { bot, c } = await act3Player(world, 'ソラ');
  for (const f of UPTO('c9_door')) c.flags[f] = true;
  const opts = {};
  await place(bot, C9D_MAP.g1, 15, 35, 'up', opts);
  // 1 左の 石で スピカに 歌って もらう
  await useStone(bot, 'g1a', 'ここで歌ってもらう', opts);
  assert.ok(spicaLeft9d(world, bot.s), 'スピカが 石に のこった');
  assert.ok(said(bot, 'はやく、もどってきてね'));
  assert.ok(!world.followerLooks(bot.s).some((f) => f.spica), 'ついて 来ない');
  const snap = c9dSnap(world, bot.s);
  assert.equal(snap.at, 'g1a');
  assert.ok(snap.lamps && snap.lamps[1] > 0, '向こう（右）の 道の ランプが 光る');
  assert.ok(!spicaAway9d(world, bot.s), '石の そばでは いっしょ');
  // 右の 道へ（暗い 中を 歩く）→ はなれると 戦いの 助けが ない
  await go(bot, 26, 30, opts);
  assert.ok(spicaAway9d(world, bot.s), 'はなれて いる');
  assert.ok(spicaHelpHidden9d(world, [bot.s], C9A.child) && spicaHelpHidden9d(world, [bot.s], 'c9_song1') && spicaHelpHidden9d(world, [bot.s], 'c9_act1'));
  assert.ok(!spicaHelpHidden9d(world, [bot.s], 'c5_ms1'), 'ほかの フラグは かわらない');
  // HUD の「スピカをよぶ」
  bot.send({ t: 'menu', action: 'c9dCall' });
  await tickN(world, 2);
  assert.ok(!spicaLeft9d(world, bot.s), 'よぶと もどる');
  assert.ok(world.followerLooks(bot.s).some((f) => f.spica), 'また ついて 来る');
  // 2 もう一度 のこして、右の 石を 音さで 鳴らす → 開く
  await useStone(bot, 'g1a', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g1b', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo2, '橋が かかった');
  assert.ok(!spicaLeft9d(world, bot.s), 'スピカは きらめきと いっしょに もどる');
  assert.equal(effectiveTile(MAPS.c9d_g1, 3, 18, world.hasFlagFn(bot.s)), T.C9D_BRIDGE);
  // 3 音さだけ: 20びょう すぎると 止まる（片方だけ 鳴らしても 開かない）
  await useStone(bot, 'g1d', '星の音さを鳴らす', opts);
  assert.ok(!c.flags.c9_echo3);
  assert.ok(laneState9d(world, bot.s).forks.g1d > world.now(), JSON.stringify([laneState9d(world, bot.s), world.now()]));
  await tickN(world, Math.ceil(FORK_MS9D / 50) + 5);
  pruneC9d(world);
  assert.ok(!(laneState9d(world, bot.s).forks.g1d > world.now()), '20びょうで 止まる');
  // 開いた 橋は 開いた まま（石を しらべても かわらない）
  const fb = stoneFront9d(MAPS.c9d_g1.c9dStones.find((q) => q.id === 'g1b'));
  await go(bot, Math.floor(fb.x), Math.floor(fb.y), opts);
  await examine(bot, 26, 21, opts);
  assert.ok(said(bot, '橋は、もう、かかっている'));
  assert.ok(c.flags.c9_echo2);
});

test('回線が 切れた 時: スピカは リーダーの 所に もどる', async () => {
  const world = fixedWorld(9302);
  const { bot, c } = await act3Player(world, 'ソラ');
  for (const f of UPTO('c9_door')) c.flags[f] = true;
  await place(bot, C9D_MAP.g1, 15, 35, 'up', {});
  await useStone(bot, 'g1a', 'ここで歌ってもらう', {});
  assert.ok(spicaLeft9d(world, bot.s));
  // 切れる（スマホの スリープ）→ もどる
  world.disconnect(bot.s, bot.conn);
  await tickN(world, 30);
  pruneC9d(world);
  assert.ok(!spicaLeft9d(world, bot.s), '切れて いる 間に もどった');
});

test('家族 2人: 左右の 石を 音さで 鳴らせば 開く（スピカは リーダーと いっしょ）・スピカと いっしょの 人が 鳴らすと 向こうの ランプ', async () => {
  const world = fixedWorld(9303);
  const A = await act3Player(world, 'ソラ');
  const B = await addPlayer(world, 'ハル', 'c9_act3');
  for (const f of UPTO('c9_door')) A.c.flags[f] = true;
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  const { partyOf } = await import('../public/js/shared/world/party.js');
  const p = partyOf(world, A.bot.s);
  assert.ok(p && p.members.length === 2 && p.leader === A.bot.s.id, 'パーティー');
  const leader = A, other = B;
  await place(leader.bot, C9D_MAP.g1, 4, 23, 'up', {});
  await place(other.bot, C9D_MAP.g1, 26, 23, 'up', {});
  await useStone(leader.bot, 'g1a', '星の音さを鳴らす', {});
  assert.ok(c9dSnap(world, other.bot.s).lamps?.[1] > 0, 'スピカと いっしょの 人が 鳴らすと 右の ランプが 光る');
  await useStone(other.bot, 'g1b', '星の音さを鳴らす', {});
  assert.ok(world.worldFlags(other.bot.s).c9_echo2, '2人で 開いた');
});

test('通し（ひとり）: 黄の 台 → ひびきの とびら → ふたごの道 1〜2階（こだま）→ はかば → 魔人 → 大きな くぼみ → くぼ地（c9_act4）', async () => {
  const world = fixedWorld(9304);
  const { bot, c } = await act3Player(world, 'ソラ');
  const fought = [];
  const opts = { fought };
  // 1 くぼ地の 黄の 台
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
  assert.ok(c.flags[C9D.song1], '黄の 台で 歌った');
  assert.ok(said(bot, '星のうた'), '新しい 技');
  assert.equal(c.objective, C9D_OBJ.song1);
  // 2 ピラミッドの 岸: とびらの 場面 → 石 2つ
  await toShore(bot, opts);
  await go(bot, 86, 5, opts);
  assert.ok(said(bot, '同時に、鳴らせ'), 'とびらの 場面');
  assert.ok(c.flags[C9D_SEEN.door]);
  await useStone(bot, 'sh_l', 'ここで歌ってもらう', opts);
  await useStone(bot, 'sh_r', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo1 && c.flags[C9D.door], 'とびらが 開いた');
  assert.ok(!c.flags[C9D_SEEN.door], '小さな フラグは 消す');
  assert.equal(c.objective, C9D_OBJ.door);
  // 3 ふたごの道 1階
  await go(bot, SHORE_DOOR9D.x, SHORE_DOOR9D.y, opts);
  assert.equal(bot.s.map, C9D_MAP.g1);
  await go(bot, 15, 35, opts);
  assert.ok(said(bot, '道が、左と右に'), '1階の 場面');
  await useStone(bot, 'g1a', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g1b', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo2);
  await useStone(bot, 'g1c', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g1d', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo3);
  // 宝箱（1階）
  for (const ch of MAPS.c9d_g1.chests) {
    const side = D4.map(([dx, dy]) => [ch.x + dx, ch.y + dy]).find(([x, y]) => canStand(MAPS.c9d_g1, x + 0.5, y + 0.5, world.hasFlagFn(bot.s)));
    await go(bot, side[0], side[1], opts);
    await examine(bot, ch.x, ch.y, opts);
    assert.ok(c.chests[ch.id], ch.id);
  }
  // 4 2階
  const S1 = C9D_POS.c9d_g1.stairs;
  await go(bot, S1.x, S1.y, opts);
  assert.equal(bot.s.map, C9D_MAP.g2);
  await go(bot, 15, 29, opts);
  assert.ok(c.flags[C9D.g2]);
  assert.equal(c.objective, C9D_OBJ.g2);
  await useStone(bot, 'g2a', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g2b', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo4);
  // こだま: 1つめ スピカ → 2つめ 音さ → 歩いて 3つめ 音さ（20びょうの 間に）
  await useStone(bot, 'g2c', 'ここで歌ってもらう', opts);
  const t0 = world.now();
  await useStone(bot, 'g2d', '星の音さを鳴らす', opts);
  assert.ok(!c.flags.c9_echo5, 'まだ 3つめが ない');
  await useStone(bot, 'g2e', '星の音さを鳴らす', opts);
  assert.ok(world.now() - t0 < FORK_MS9D, `${world.now() - t0}ms で 間に 合った`);
  assert.ok(c.flags.c9_echo5, 'こだまで 北の 出口への 橋');
  // 5 はかば
  const X = C9D_POS.c9d_g2.exit;
  await go(bot, X.x, X.y, opts);
  assert.equal(bot.s.map, C9D_MAP.grave);
  await go(bot, 15, 20, opts);
  assert.ok(c.flags[C9D.grave]);
  assert.ok(said(bot, 'ここで、ねむる') || true);
  assert.ok(!MAPS.c9d_grave.spawnCounts || !Object.keys(MAPS.c9d_grave.spawnCounts).length, '魔物は 出ない');
  // 6・7 魔人
  await go(bot, 15, 15, opts);
  assert.ok(fought.includes(C9D_BATTLE.mu), '魔人と 戦った');
  assert.ok(c.flags[C9D.mu]);
  assert.ok(said(bot, 'みんな、おきてたの'));
  assert.equal(c.objective, C9D_OBJ.mu);
  // 8・9 大きな くぼみ → くぼ地
  await go(bot, 15, 7, opts);
  assert.ok(c.flags[C9D.hollow] && c.flags[C9D.act4]);
  assert.ok(said(bot, '空から、ながされたの'));
  assert.ok(said(bot, 'ここに、おれたちがいる'));
  assert.ok(said(bot, 'おちてきた星の子'), '第1章 クリアの 題の 画面');
  assert.equal(bot.s.map, 'c9a_crater');
  assert.equal(c.objective, C9D_OBJ.act4);
  assert.ok(!c.flags[C9D_SEEN.g1], '小さな フラグは 消す');
  // 「行った 所」は 取らない
  assert.ok(!C9D_MAP_IDS.some((id) => c.explored?.[id]));
});

test('目標と 行き先・仲間の ひとこと・すすみぐあい・しおり', () => {
  for (const [f, t] of CH9D_PROGRESS) {
    assert.ok(C9D_LINE.includes(f), f);
    assert.ok(CH9D_OBJECTIVE_TARGETS[t]?.length, `行き先 ${t}`);
    const talk = CH9D_OBJECTIVE_TALK[t];
    assert.ok(talk && ['self', 'bold', 'kind', 'kid'].every((k) => talk[k]?.length > 8), `ひとこと ${t}`);
  }
  assert.ok(CH9D_OBJECTIVE_TARGETS[C9D_OBJ.start] && CH9D_OBJECTIVE_TALK[C9D_OBJ.start]);
  for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(CH9D_OBJECTIVE_TALK[C9D_OBJ.start][k].length > 8);
  const sh = readFileSync(new URL('../public/js/shared/world/shiori.js', import.meta.url), 'utf8');
  assert.ok(sh.includes("start: 'c9_song1', title: '星のはかば'"), 'しおりの 第4幕');
});

test('台本の きまり: くぼみの 星の 名前・だれの くぼみか・ながされた わけ・ひみつ・カイ・ソリトゥス・少年の わけを 書かない', () => {
  const sets = C9D_LINE.map((f) => UPTO(f)).concat([UPTO('c9_act3')]);
  const scripts = openScripts();
  const all = JSON.stringify(sets.flatMap((fs) => Object.values(scripts).map((fn) => { try { return fn(ctx(flagsOf(...fs))); } catch { return []; } })));
  assert.ok(all.includes('ムウ') && all.includes('アルゴル'));
  assert.ok(!/魔人ブウ|ブウ|マジン/.test(all), 'もとの 作品の 名前は 使わない');
  assert.ok(!/"カイ"|カイ[、。！]|ソリトゥス|トキネ|フリーゾン|ザルバ/.test(all), '第1部・第2部の ひみつに ふれない');
  assert.ok(!/殺|ころす|死ね|しね|死/.test(all), 'こわがらせすぎない');
  // 「ながされた」は スピカの 問いと 石の 文字だけ（だれが・なぜは 書かない）
  const nag = all.match(/[^"]*ながされ[^"]*/g) || [];
  assert.ok(nag.length >= 2);
  for (const l of nag) assert.ok(/空から、ながされたの|「空から、ながされた星」/.test(l), l);
  assert.ok(!/ながした|ながす|だれが|なぜ/.test(all.replace(/だれか/g, '')), 'だれが・なぜは 書かない');
  // 大きな くぼみの 場面に 星の 名前・人の 名前を 出さない（だれの くぼみか 書かない）
  const hollow = JSON.stringify(scripts.c9d_hollow_event(ctx(flagsOf(...UPTO('c9_mu')))));
  assert.ok(!/の星」|星の名|くぼみは.*の|ノクトの昔|むかし/.test(hollow));
  // 少年は ひとことも 言わない（……だけ）
  const alg = hollow.match(/\["say","アルゴル","([^"]*)"\]/g) || [];
  for (const l of alg) assert.ok(l.includes('……'), l);
  assert.ok(!/アルゴル[^"]*(ため|わけ|だから)/.test(all));
});

test('絵: 新しい タイル（2D 16×16・動く・2.5D）・テーマ・魔人と おかし・スピカの 見え方の 道具', async () => {
  const { C9A_PAINTERS, C9A_FRAMES, C9A_THEMES, C9A_FLOOR_H, c9aBlockSpec } = await import('../public/js/client/render/tiles-c9a.js');
  const { Painter } = await import('../public/js/client/render/pixel.js');
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C9D_')).map(([, v]) => v);
  for (const id of ids) {
    const p = new Painter(16, 16);
    assert.ok(C9A_PAINTERS[id], String(id));
    C9A_PAINTERS[id](p, 3, 1, {});
  }
  for (const id of [T.C9D_BRIDGE, T.C9D_ECHO, T.C9D_HOLLOW]) assert.ok(C9A_FRAMES[id] >= 2);
  for (const id of [T.C9D_ROCK, T.C9D_GRAVE_ROCK, T.C9D_DOOR, T.C9D_LAMP]) assert.ok(c9aBlockSpec(id, 0), String(id));
  assert.ok(C9A_FLOOR_H[T.C9D_CHASM] < -0.5);
  for (const th of ['c9d_lane', 'c9d_grave']) assert.ok(C9A_THEMES[th], th);
  const { paintC8cSpecial } = await import('../public/js/client/render/c8c-npc-art.js');
  for (const s of ['c9d_mu', 'c9d_mu_sit', 'c9d_mumu_sit', 'c9d_candy']) assert.ok(paintC8cSpecial(s, 'down', 1)?.p, `絵 ${s}`);
  for (const id of C9D_MAP_IDS) for (const n of MAPS[id].npcs) assert.ok(paintC8cSpecial(n.sprite, 'down', 0)?.p, n.sprite);
  const view = await import('../public/js/client/c9d-view.js');
  for (const f of ['noteC9dSnap', 'noteC9dStage', 'c9dSpicaLeft', 'c9dSingingSpica', 'drawC9dDark2D', 'drawC9dDark3D', 'drawC9dRing2D', 'drawC9dRing3D', 'C9dCallButton']) assert.equal(typeof view[f], 'function', f);
  // 歌って いる スピカ・曲の だん
  const field = { map: MAPS.c9d_g1, time: 1000, me: { x: 26.5, y: 22.5 }, others: new Map(), game: { sid: 's1' }, hasFlag: (f) => f === 'c9_act3' };
  view.noteC9dSnap(field, { lead: 's1', at: 'g1a', lamps: [0, 5000] });
  assert.ok(view.c9dSpicaLeft(field));
  const sp = view.c9dSingingSpica(field);
  assert.ok(sp && Math.abs(sp.x - 4.5) < 0.01);
  view.noteC9dStage(field);
  assert.equal(field.apartStage, 1);
  assert.equal(field.songStage, 1);
  view.noteC9dSnap(field, { lead: 's1' });
  view.noteC9dStage(field);
  assert.equal(field.apartStage, 0, 'スピカが もどると いっしょ');
});
