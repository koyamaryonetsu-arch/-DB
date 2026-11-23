// 第90回 Z班: 第3部の 下じき（docs/plan-part3.md の 9。物語は まだ 進まない）
// 名前の 約束（フラグの 順・id）・第2部を クリアした セーブの 目標と しおりが 今の まま・しおりの「第3部 第1章」・
// 第1・2部の 表示が かわって いない・ゲストの 強さが かわって いない・かりの 置き場（data/c9a-stub.js）は A・B を 合わせた 時に 消した
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  C9A, C9A_LINE, C9A_PREP, C9A_LAMPS, C9A_SECRETS, C9A_MAP, C9A_MAP_IDS, c9aCaveId, C9A_BATTLE, C9A_BOSS_MON, SPICA, STAR_FORK,
  C9A_TRACKS, C9A_TRACK_IDS, C9A_TILE_FIRST, C9A_TILE_LAST,
} from '../public/js/shared/maps/c9a-flags.js';
import {
  CH9_STEPS, CH9_PROGRESS, CH9_OBJECTIVE_TARGETS, CH9_OBJECTIVE_TALK, C9_OBJ, C9_TITLE, c9TitleSteps, PART3_OPEN, PART2_END_OBJ,
  part2ClearObjective, C9_START_TALK, C9_START_TARGETS, applyCh9,
} from '../public/js/shared/data/story-c9.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { C8R_OBJ } from '../public/js/shared/data/story-c8r.js';
import { OLD_C8_OBJ } from '../public/js/shared/data/story-c8.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { OBJECTIVE_TARGETS } from '../public/js/shared/data/quest-targets.js';
import { OBJECTIVE_TALK } from '../public/js/shared/data/party-talk.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { GUEST_MAX_LEVEL, GUEST_LV_SPAN, guestLevelCap, guestPlan } from '../public/js/shared/guest-rule.js';
import { CHAPTERS, storyPlace, storyNext, chapterLabel, shioriOf } from '../public/js/shared/world/shiori.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { isPart2Map, isPart3Map, isPart3Track, battleBgm, PART3_PREFIX } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot, tickN } from './helpers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const P2_END = '第2部　完！第3部へ（続きはアップデートで！）';

// ───────────── 名前の 約束（9-4）─────────────
test('名前の 約束: 一本の 線の フラグの 順・STORY_STEPS の さいご（c8_solitus の うしろ）', () => {
  const line = ['c9_festival', 'c9_night', 'c9_starfall', 'c9_child', 'c9_trio', 'c9_stairs', 'c9_b1', 'c9_b2', 'c9_b3', 'c9_trial', 'c9_fork', 'c9_act1'];
  assert.deepEqual(C9A_LINE, line);
  // 第91回 A班: 第2幕の 一本の 線（maps/c9b-flags.js の C9B_LINE）が 第1幕の うしろに
  const line2 = ['c9_ring2', 'c9_mine', 'c9_under', 'c9_village', 'c9_gate', 'c9_king', 'c9_raft', 'c9_act2'];
  // 第92回 A班: 第3幕の 一本の 線（maps/c9c-flags.js の C9C_LINE）が 第2幕の うしろに
  const line3 = ['c9_raft_go', 'c9_river', 'c9_p2', 'c9_riddle', 'c9_p3', 'c9_p4', 'c9_song', 'c9_trio2', 'c9_note1', 'c9_act3'];
  // 第93回 A班: 第4幕の 一本の 線（maps/c9d-flags.js の C9D_LINE）が 第3幕の うしろに
  const line4 = ['c9_song1', 'c9_door', 'c9_g2', 'c9_grave', 'c9_mu', 'c9_hollow', 'c9_act4'];
  assert.deepEqual(CH9_STEPS, [...line, ...line2, ...line3, ...line4]);
  assert.deepEqual(Object.values(C9A), line);
  const i = STORY_STEPS.indexOf('c8_solitus');
  assert.ok(i > 0);
  // 第94回 A班: 第3部 第2章の 一本の 線（はじめと おわりだけ。赤・緑は すきな じゅんなので 入れない。maps/c10a-flags.js の C10A_LINE）
  // 第95回 A班: 第2幕の はじめと おわり（青・白も すきな じゅんなので 入れない。maps/c10b-flags.js の C10B_LINE）
  // 第97回 A班: 第3幕は 一本道（ぜんぶ 線に 入る。maps/c10c-flags.js の C10C_LINE）
  const line10 = ['c10_start', 'c10_act1', 'c10b_start', 'c10_act2', 'c10c_start', 'c10c_isles2', 'c10c_colonel', 'c10c_stolen', 'c10c_trio', 'c10c_fort_in', 'c10c_fort2', 'c10c_algol', 'c10_note_si', 'c10_act3',
    // 第99回 A班: 第4幕も 一本道（maps/c10d-flags.js の C10D_LINE。いずみの しるしは 入れない）
    'c10d_start', 'c10d_top', 'c10d_gate1', 'c10d_gate2', 'c10d_gate3', 'c10d_gate4', 'c10d_mirror', 'c10_note_do', 'c10d_bridge', 'c10_act4'];
  // 第100回 A班: 第3部 第3章 第1幕（maps/c11a-flags.js の C11A_LINE。島の 明かり 3つ・星座の しるしは 入れない）
  const line11 = ['c11a_start', 'c11a_chart', 'c11a_launch', 'c11a_perch', 'c11a_beast', 'c11a_pirate', 'c11_act1'];
  assert.deepEqual(STORY_STEPS.slice(i + 1), [...line, ...line2, ...line3, ...line4, ...line10, ...line11], 'c8_solitus の すぐ うしろが 第3部で、それで おわり');
  assert.equal(new Set(STORY_STEPS).size, STORY_STEPS.length, 'フラグは 1回ずつ');
});

test('名前の 約束: 小さな フラグ・マップ・決まった 戦い・星の子・だいじな 物・曲・タイルの わく', () => {
  assert.deepEqual(Object.values(C9A_PREP), ['c9_prep_flower', 'c9_prep_lamp', 'c9_prep_story']);
  assert.deepEqual(C9A_LAMPS, ['c9_lamp1', 'c9_lamp2', 'c9_lamp3', 'c9_lamp4']);
  assert.deepEqual(C9A_SECRETS, ['c9_secret1', 'c9_secret2']);
  assert.deepEqual(C9A_MAP_IDS, ['c9a_forest', 'c9a_crater', 'c9a_b1', 'c9a_b2', 'c9a_b3', 'c9a_b4']);
  assert.equal(C9A_MAP.forest, 'c9a_forest');
  assert.deepEqual([1, 2, 3, 4].map(c9aCaveId), ['c9a_b1', 'c9a_b2', 'c9a_b3', 'c9a_b4']);
  assert.deepEqual(C9A_BATTLE, { trio: 'c9a_trio', trial: 'c9a_trial' });
  assert.deepEqual(C9A_BOSS_MON, { trio: 'c9a_suitoru', trial: 'c9a_hoshimori' });
  assert.equal(SPICA, 'spica');
  assert.equal(STAR_FORK, 'star_fork');
  assert.deepEqual(C9A_TRACK_IDS, ['c9a_festival', 'c9a_forest', 'c9a_child', 'c9a_cave', 'c9a_trio', 'c9a_trial']);
  assert.equal(C9A_TRACKS.trial, 'c9a_trial');
  for (const id of C9A_TRACK_IDS) assert.ok(isPart3Track(id), `${id} は 第3部の 曲`);
  // タイル 407〜426 は この 幕の もの（第90回 A班が 407〜425 を 足した。さいごは 426 まで）
  assert.equal(C9A_TILE_FIRST, 407);
  assert.equal(C9A_TILE_LAST, 426);
  const used = Object.values(T);
  // 第91回 A班: 第2幕の タイル 427〜446（C9B_）が うしろに。第92回 A班: 第3幕の タイル 447〜470（C9C_）が その うしろに
  // 第93回 A班: 第4幕の タイル 471〜490（C9D_）が その うしろに
  // 第94回 A班: 第2章 第1幕の タイル 491〜520（C10A_）が その うしろに
  assert.ok(used.filter((v) => v > 490 && v <= 520).every((v) => v >= 491), '第2章 第1幕の タイルは 491〜520（第94回 A班）');
  // 第95回 A班: 第2章 第2幕の タイル 521〜550（C10B_）が その うしろに
  assert.ok(used.filter((v) => v > 520 && v <= 550).every((v) => v >= 521), '第2章 第2幕の タイルは 521〜550（第95回 A班）');
  // 第97回 A班: 第2章 第3幕の タイル 551〜590（C10C_）が その うしろに
  assert.ok(used.filter((v) => v > 550 && v <= 590).every((v) => v >= 551), '第2章 第3幕の タイルは 551〜590（第97回 A班）');
  // 第99回 A班: 第2章 第4幕の タイル 591〜620（C10D_）が その うしろに
  assert.ok(used.filter((v) => v > 590 && v <= 620).every((v) => v >= 591), '第2章 第4幕の タイルは 591〜620（第99回 A班）');
  // 第100回 A班: 第3章 第1幕の タイル 621〜660（C11A_）が その うしろに
  assert.ok(used.filter((v) => v > 620).every((v) => v >= 621 && v <= 660), '第3章 第1幕の タイルは 621〜660（第100回 A班）');
  assert.ok(Math.max(...used) <= 660, '今の さいごの タイルは 第3部 第3章 第1幕の わくの 中（第100回 A班が 621〜660 を とった）');
  for (let n = 447; n <= 470; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C9C_'), `タイル ${n}`);
  for (let n = 471; n <= 490; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C9D_'), `タイル ${n}`);
  for (let n = 491; n <= 520; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C10A_'), `タイル ${n}`);
  for (let n = 521; n <= 550; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C10B_'), `タイル ${n}`);
  for (let n = 551; n <= 590; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C10C_'), `タイル ${n}`);
  for (let n = 591; n <= 620; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C10D_'), `タイル ${n}`);
  for (let n = 621; n <= Math.max(...used); n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C11A_'), `タイル ${n}`);
  for (let n = C9A_TILE_FIRST; n <= C9A_TILE_LAST; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C9A_'), `タイル ${n}`);
  // 第3部の マップは A班が 作った（maps/c9a.js）。ほかの 第3部の マップは まだ ない。ボスの 魔物は B班が 作った（data/monsters-c9a.js）
  for (const id of C9A_MAP_IDS) assert.ok(id in MAPS, `${id} は A班が 作った`);
  assert.deepEqual(Object.keys(MAPS).filter((id) => isPart3Map(id)).sort(), [...C9A_MAP_IDS, 'c9b_shaft', 'c9b_under', 'c9b_hall', 'c9c_river', 'c9c_p1', 'c9c_p2', 'c9c_p3', 'c9c_p4', 'c9d_g1', 'c9d_g2', 'c9d_grave', 'c10r_1', 'c10r_2', 'c10r_3', 'c10g_1', 'c10g_2', 'c10b_blue1', 'c10b_blue2', 'c10b_white1', 'c10b_white2', 'c10b_white3', 'c10c_isles1', 'c10c_isles2', 'c10c_isles3', 'c10c_fort1', 'c10c_fort2', 'c10c_fort3', 'c10d_stair1', 'c10d_stair2', 'c10d_stair3', 'c10d_summit', 'c11_sea', 'c11a_perch', 'c11a_isle1', 'c11a_isle2', 'c11a_isle3'].sort(), '第3部の マップは 第1幕の 6まいと 第2幕の 3まい（第91回 A班）と 第3幕の 5まい（第92回 A班）と 第4幕の 3まい（第93回 A班）と 第2章 第1幕の 5まい（第94回 A班）と 第2幕の 5まい（第95回 A班）と 第3幕の 6まい（第97回 A班）と 第4幕の 4まい（第99回 A班）と 第3章 第1幕の 5まい（第100回 A班）だけ');
  for (const id of Object.values(C9A_BOSS_MON)) assert.ok(MONSTERS[id]?.boss, `${id} は B班の ボス`);
});

// ───────────── 第2部を クリアした セーブ ─────────────
test('第2部を クリアした セーブ: 目標は 第3部の はじまりに（PART3_OPEN。第90回 A・B を 合わせた 時）・前の 文は なおる', () => {
  assert.equal(PART3_OPEN, true, '第1幕が できたので 入れかえた');
  assert.equal(PART2_END_OBJ, P2_END);
  assert.equal(C8R_OBJ.solitus, C9_OBJ.start);
  assert.equal(OLD_C8_OBJ.solitus, P2_END, '前の 版の 文に 回した');
  const flags = flagsOf(...UPTO('c8_solitus'), 'c8r_arrive');
  assert.equal(objectiveFromFlags({ flags }), C9_OBJ.start);
  assert.ok(KNOWN_OBJECTIVES.has(C9_OBJ.start));
  assert.ok(!KNOWN_OBJECTIVES.has(P2_END), '「第2部　完！…」は もう 出ない');
  // 前の 版で セーブした 人（「第2部　完！…」の まま）は 開いた 時に なおる
  const c = { flags, objective: P2_END };
  assert.equal(repairObjective(c), true, 'なおす');
  assert.equal(c.objective, C9_OBJ.start);
  // しおり（まだ 星祭りに 行って いない 間は 第2部の クリアの まま）
  const st = storyPlace(c);
  assert.deepEqual(st, { part: 2, chapter: 8, act: 4, label: '第2部 第8章 第4幕', title: '千年の約束', actTitle: '時のはざま', cleared: true });
  const nx = storyNext(c);
  assert.equal(nx.objective, C9_OBJ.start);
  assert.equal(nx.end, false, '「続きはアップデートで！」では ない');
  assert.equal(nx.where, 'ホシフル村');
  // 仲間の ひとこと・行き先は 第3部の はじまりの 物
  assert.deepEqual(OBJECTIVE_TALK[C9_OBJ.start], C9_START_TALK);
  assert.deepEqual(OBJECTIVE_TARGETS[C9_OBJ.start], C9_START_TARGETS);
  // 第3部の 目標の 文の 表は 第1幕の 物（第90回 A班。c9_festival から）
  assert.ok(CH9_PROGRESS.length > 0 && CH9_PROGRESS[0][0] === 'c9_festival');
  assert.equal(Object.keys(CH9_OBJECTIVE_TARGETS).length, Object.keys(CH9_OBJECTIVE_TALK).length);
  for (const [, t] of CH9_PROGRESS) assert.ok(KNOWN_OBJECTIVES.has(t) && CH9_OBJECTIVE_TARGETS[t] && CH9_OBJECTIVE_TALK[t], t);
});

test('目標の 文の 入れかえの しくみ（PART3_OPEN を true に した 時の 文）', () => {
  assert.equal(part2ClearObjective(false), P2_END);
  assert.equal(part2ClearObjective(true), 'ホシフル村の星祭りに行こう（ホシミばあちゃんが呼んでいる）');
  assert.equal(C9_OBJ.start, 'ホシフル村の星祭りに行こう（ホシミばあちゃんが呼んでいる）');
  assert.ok(!/アップデート/.test(C9_OBJ.start));
  for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(C9_START_TALK[k], `ひとこと ${k}`);
  assert.deepEqual(C9_START_TARGETS, [{ npc: 'elder' }]);
  assert.ok(MAPS.overworld.npcs.some((n) => n.id === 'elder'), 'ホシミばあちゃん');
  // 題の 画面（9-1 の 1）
  assert.deepEqual(C9_TITLE, { part: '第3部　ほしのね', chapter: '第1章　おちてきた星の子', act: '第1幕　星ふるえの夜' });
  assert.deepEqual(c9TitleSteps(), [['chapter', '第3部　ほしのね', '第1章　おちてきた星の子'], ['chapter', '第1章　おちてきた星の子', '第1幕　星ふるえの夜']]);
  // applyCh9 は 第1幕の 台本（data/story-c9a.js の applyCh9a）を まぜる（第90回 A班）
  const sc = {};
  const ss = new Set();
  applyCh9(sc, ss);
  assert.ok(sc.c9a_morning && sc.c9a_child_event && sc.c9a_trial && ss.has('c9a_morning'));
  assert.ok(JSON.stringify(sc.c9a_morning({ flag: (f) => f === 'c8_solitus' })).length > 2);
});

// ───────────── しおり ─────────────
test('しおり: 第3部は「第3部 第1章」（中の 番号は 9）。かりに c9_festival を 立てた 時', () => {
  assert.deepEqual([0, 1, 5, 8, 9, 10, 11].map(chapterLabel), ['序章', '第1章', '第5章', '第8章', '第1章', '第2章', '第3章']);
  const ch9 = CHAPTERS.find((C) => C.n === 9);
  assert.deepEqual({ part: ch9.part, start: ch9.start, title: ch9.title }, { part: 3, start: 'c9_festival', title: 'おちてきた星の子' });
  assert.deepEqual(ch9.acts[0], { n: 1, start: 'c9_festival', title: '星ふるえの夜', seen: 'c9_festival', clear: 'c9_act1' });
  const c = { flags: flagsOf(...UPTO('c9_festival')), objective: P2_END };
  assert.deepEqual(storyPlace(c), { part: 3, chapter: 9, act: 1, label: '第3部 第1章 第1幕', title: 'おちてきた星の子', actTitle: '星ふるえの夜', cleared: false });
  const done = { flags: flagsOf(...UPTO('c9_act1')) };
  assert.equal(storyPlace(done).cleared, true);
  assert.equal(storyPlace(done).label, '第3部 第1章 第1幕');
  // しおり ぜんたいも 作れる
  const sh = shioriOf({ ...c, name: 'ソラ', level: 96, job: 'hero', jobs: {}, equip: {}, items: [], keyItems: [], chests: {}, quests: {} });
  assert.equal(sh.story.label, '第3部 第1章 第1幕');
});

test('しおり: 第1・2部の 表示は かわらない（章の はじめ・幕の はじめ ごと）', () => {
  const want = [
    [null, '序章'],
    ['p_attack', '第1部 第1章'], ['c2_start', '第1部 第2章'], ['c3_start', '第1部 第3章'], ['c4_start', '第1部 第4章'], ['c5_start', '第1部 第5章'],
    ['c6_start', '第2部 第6章 第1幕'], ['c6_tree', '第2部 第6章 第2幕'], ['c6_flow', '第2部 第6章 第3幕'], ['c6_kanata', '第2部 第6章 第4幕'],
    ['c7_start', '第2部 第7章 第1幕'], ['c7_karim', '第2部 第7章 第2幕'], ['c7_kai', '第2部 第7章 第3幕'],
    ['c8_start', '第2部 第8章 第1幕'], ['c8_jafar', '第2部 第8章 第2幕'], ['c8_hades', '第2部 第8章 第3幕'], ['c8_bowser', '第2部 第8章 第4幕'], ['c8_solitus', '第2部 第8章 第4幕'],
  ];
  for (const [f, label] of want) {
    const flags = f ? flagsOf(...UPTO(f)) : {};
    assert.equal(storyPlace({ flags }).label, label, `${f} の あと`);
  }
  for (let n = 1; n <= 8; n++) assert.equal(chapterLabel(n), `第${n}章`);
});

// ───────────── ゲスト ─────────────
test('ゲストの レベルの 上限 99 → 110（第3部 第3章 第1幕で 120）: 今 いる ゲストの 強さは かわらない', () => {
  assert.equal(GUEST_MAX_LEVEL, 122); // 第102回 B班: 第3部 第3章 第2幕で 120 → 122
  const old = (def) => Math.max(def.minLevel || 1, Math.min(99, def.maxLevel || (def.minLevel || 1) + GUEST_LV_SPAN));
  for (const [id, def] of Object.entries(GUESTS)) {
    assert.equal(guestLevelCap(def), old(def), `${id} の 上限`);
    assert.ok(guestLevelCap(def) < 99, `${id} は 99 に とどかない`);
  }
  // とても 強い 家族（Lv150）でも、ゲストの レベルは その ゲストの 上限まで
  const fam = [{ name: 'a', job: 'warrior', level: 150, exp: 0, equip: {}, jobs: {}, seeds: {} }];
  for (const id of ['luca', 'kai8', 'karim8r']) {
    if (!GUESTS[id]) continue;
    const p = guestPlan(GUESTS[id], fam);
    assert.ok(p.level <= old(GUESTS[id]), `${id} Lv${p.level}`);
  }
  // 上限を 上げた ぶんは maxLevel が 99 より 上の ゲスト（第3部で 作る）だけに きく
  // 第101回 B班: 第3部 第3章 第1幕で 120 に（Lv118〜120）
  assert.equal(guestLevelCap({ minLevel: 100, maxLevel: 120 }), 120);
  assert.equal(guestLevelCap({ minLevel: 100, maxLevel: 130 }), 120);
  assert.equal(guestLevelCap({ minLevel: 96 }), 104);
});

// ───────────── 曲の わく ─────────────
test('曲の わく: 第3部の マップ（c9〜c11）は battle3（ない 間は battle）。今の 場所の 曲は かわらない', () => {
  assert.deepEqual(PART3_PREFIX, ['c9', 'c10', 'c11']);
  for (const id of C9A_MAP_IDS) {
    assert.ok(isPart3Map(id) && !isPart2Map(id), id);
    assert.equal(battleBgm({ snapBgm: 'battle', mapId: id, has: (t) => t !== 'battle3' }), 'battle', `${id}: 曲が まだ ない`);
    assert.equal(battleBgm({ snapBgm: 'battle', mapId: id, has: () => true }), 'battle3', `${id}: F班の 曲が できたら`);
  }
  // 今の マップは 第3部 第1章 第1幕の 6まい（第90回 A班）の ほかは 第3部 あつかいに ならない
  for (const id of Object.keys(MAPS)) {
    if (C9A_MAP_IDS.includes(id) || /^c9[bcd]_/.test(id)) continue; // 第91回 A班: 第2幕の 3まいも 第3部。第92回 A班: 第3幕の 5まいも。第93回 A班: 第4幕の 3まいも
    if (/^c10[rg]_[123]$/.test(id)) continue; // 第94回 A班: 第2章 第1幕の 5まいも 第3部
    if (/^c10b_(blue[12]|white[123])$/.test(id)) continue; // 第95回 A班: 第2章 第2幕の 5まいも 第3部
    if (/^c10c_(isles|fort)[123]$/.test(id)) continue; // 第97回 A班: 第2章 第3幕の 6まいも 第3部
    if (/^c10d_(stair[123]|summit)$/.test(id)) continue; // 第99回 A班: 第2章 第4幕の 4まいも 第3部
    if (/^(c11_sea|c11a_(perch|isle[123]))$/.test(id)) continue; // 第100回 A班: 第3章 第1幕の 5まいも 第3部
    assert.ok(!isPart3Map(id, MAPS[id]), `${id}`);
  }
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c8r_hall', has: () => true }), 'battle2');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'overworld', has: () => true }), 'battle');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'tm_45_1', has: () => true }), 'battle_strong');
});

// ───────────── かりの 置き場 ─────────────
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(m?js|html)$/.test(f)) out.push(p);
  }
  return out;
}

test('かりの 置き場（data/c9a-stub.js）は 消した（A・B を 合わせた）・決まった 戦いは B班の 本物・字の きまりは 守る', () => {
  assert.ok(!existsSync(join(ROOT, 'public/js/shared/data/c9a-stub.js')), 'かりの 置き場は ない');
  const files = [...walk(join(ROOT, 'public')), ...walk(join(ROOT, 'server')), ...walk(join(ROOT, 'tools')), ...walk(join(ROOT, 'test'))];
  const users = files.filter((p) => /c9a-stub\.js'/.test(readFileSync(p, 'utf8')) && !p.endsWith('ch9-base.test.js')).map((p) => relative(ROOT, p));
  assert.deepEqual(users, [], 'どこも かりの 置き場を 読まない');
  // 決まった 戦いは B班の 本物（data/encounters-c9a.js）
  assert.equal(FIXED_ENCOUNTERS.c9a_trio?.group?.[0]?.[0], C9A_BOSS_MON.trio, '3人組は B班の 本物');
  assert.equal(FIXED_ENCOUNTERS.c9a_trial?.group?.[0]?.[0], C9A_BOSS_MON.trial, 'ためしは B班の 本物');
  for (const id of Object.values(C9A_BATTLE)) {
    const fx = FIXED_ENCOUNTERS[id];
    assert.ok(fx && fx.boss && fx.canFlee === false, id);
    for (const [sp] of fx.group) assert.ok(MONSTERS[sp], `${id}: ${sp}`);
  }
  assert.ok(!('c9a_stub_room' in MAPS) && !SCRIPTS.c9a_stub_boss);
  // 台本は ['showMon', ボスの 魔物] → ['battle', 決まった 戦い]
  const ctx = { flag: (k) => ['c9_child', 'c9_b3'].includes(k), has: () => false, count: () => 0, name: 'ソラ' };
  for (const [sc, k] of [['c9a_child_event', 'trio'], ['c9a_trial', 'trial']]) {
    const steps = JSON.stringify(SCRIPTS[sc](ctx));
    assert.ok(steps.includes(`["showMon","${C9A_BOSS_MON[k]}"]`) && steps.includes(`["battle","${C9A_BATTLE[k]}"]`), sc);
  }
  // 字の きまり（kanji-check.mjs の gameFiles に 入って いる）
  const mine = ['public/js/shared/data/story-c9.js', 'public/js/shared/maps/c9a-flags.js', 'public/js/shared/world/shiori.js', 'public/js/shared/data/story-c8r.js'];
  const gf = gameFiles();
  assert.ok(!gf.some((x) => /c9a-stub/.test(x)));
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    // 題「ほしのね」は 家族が きめた ひらがなの 名前（ひらがなの 目安だけ ゆるす）
    assert.deepEqual(checkFile(g).filter((p) => !(p.kind === 'kana' && p.text.includes('ほしのね'))), [], f);
  }
});


test('しらべる 道具の わく（tools/sim-ch9.mjs）: 3つの やり方で、本物の 戦いが 動く（B班の 戦い）', async () => {
  const sim = await import('../tools/sim-ch9.mjs');
  assert.deepEqual(Object.keys(sim.MODES9), ['auto', 'blind', 'know']);
  assert.deepEqual(sim.CH9_LV, { trio: 96, trial: 98 });
  const party = sim.ch9Party('trio', 96);
  assert.deepEqual(party.map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  // B班の 本物の 戦い: どの やり方でも 終わる（勝つか 負ける。強さの 数字は test/ch9-act1-b.test.js）
  for (const boss of ['trio', 'trial']) {
    for (const mode of Object.keys(sim.MODES9)) {
      const r = sim.ch9Run(boss, sim.CH9_LV[boss], mode, 1);
      assert.ok(['win', 'lose'].includes(r.outcome), `${boss} ${mode}: ${r.outcome}`);
    }
  }
  assert.match(sim.summary9([sim.ch9Run('trio', 96, 'know', 2)]).text, /勝率 +\d+%/);
});
