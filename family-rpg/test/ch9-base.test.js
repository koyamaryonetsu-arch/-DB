// 第90回 Z班: 第3部の 下じき（docs/plan-part3.md の 9。物語は まだ 進まない）
// 名前の 約束（フラグの 順・id）・第2部を クリアした セーブの 目標と しおりが 今の まま・しおりの「第3部 第1章」・
// 第1・2部の 表示が かわって いない・ゲストの 強さが かわって いない・かりの 置き場（data/c9a-stub.js）が 本体から つながって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
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
  assert.deepEqual(CH9_STEPS, line);
  assert.deepEqual(Object.values(C9A), line);
  const i = STORY_STEPS.indexOf('c8_solitus');
  assert.ok(i > 0);
  assert.deepEqual(STORY_STEPS.slice(i + 1), line, 'c8_solitus の すぐ うしろが 第3部で、それで おわり');
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
  assert.ok(Math.max(...used) <= C9A_TILE_LAST, '今の さいごの タイルは 第3部 第1章 第1幕の わくの 中（A班が 407〜425 を 足した）');
  for (let n = C9A_TILE_FIRST; n <= C9A_TILE_LAST; n++) assert.ok(!used.includes(n) || Object.keys(T).find((k) => T[k] === n).startsWith('C9A_'), `タイル ${n}`);
  // 第3部の マップは A班が 作った（maps/c9a.js）。ほかの 第3部の マップは まだ ない。魔物・本物の 戦いは B が 作る
  for (const id of C9A_MAP_IDS) assert.ok(id in MAPS, `${id} は A班が 作った`);
  assert.deepEqual(Object.keys(MAPS).filter((id) => isPart3Map(id)).sort(), [...C9A_MAP_IDS].sort(), '第3部の マップは 第1幕の 6まいだけ');
  for (const id of Object.values(C9A_BOSS_MON)) assert.ok(!MONSTERS[id], `${id} は まだ ない`);
});

// ───────────── 第2部を クリアした セーブ ─────────────
test('第2部を クリアした セーブ: 目標・しおり・なおし は 今の まま（物語は 進まない）', () => {
  assert.equal(PART3_OPEN, false, '幕が できるまでは 入れかえない');
  assert.equal(PART2_END_OBJ, P2_END);
  assert.equal(C8R_OBJ.solitus, P2_END);
  assert.ok(!('solitus' in OLD_C8_OBJ), '前の 版の 文に まだ 回さない');
  const flags = flagsOf(...UPTO('c8_solitus'), 'c8r_arrive');
  assert.equal(objectiveFromFlags({ flags }), P2_END);
  assert.ok(KNOWN_OBJECTIVES.has(P2_END));
  const c = { flags, objective: P2_END };
  assert.equal(repairObjective(c), false, 'なおさない');
  assert.equal(c.objective, P2_END);
  // しおり
  const st = storyPlace(c);
  assert.deepEqual(st, { part: 2, chapter: 8, act: 4, label: '第2部 第8章 第4幕', title: '千年の約束', actTitle: '時のはざま', cleared: true });
  const nx = storyNext(c);
  assert.equal(nx.objective, P2_END);
  assert.equal(nx.end, true, '「続きはアップデートで！」の あつかい');
  assert.ok(nx.where, '行き先（4人の 勇者の 像）');
  // 仲間の ひとこと・行き先は 第2部の 物の まま
  assert.ok(/第2部/.test(OBJECTIVE_TALK[P2_END].bold));
  assert.notDeepEqual(OBJECTIVE_TARGETS[P2_END], C9_START_TARGETS);
  // 第3部の 目標の 文の 表は 第1幕の 物（第90回 A班。c9_festival から）。第2部 クリアの 文は PART3_OPEN まで かわらない
  assert.ok(CH9_PROGRESS.length > 0 && CH9_PROGRESS[0][0] === 'c9_festival');
  assert.equal(Object.keys(CH9_OBJECTIVE_TARGETS).length, Object.keys(CH9_OBJECTIVE_TALK).length);
  for (const [, t] of CH9_PROGRESS) assert.ok(KNOWN_OBJECTIVES.has(t) && CH9_OBJECTIVE_TARGETS[t] && CH9_OBJECTIVE_TALK[t], t);
  assert.ok(!KNOWN_OBJECTIVES.has(C9_OBJ.start), '新しい 目標の 文は まだ 出ない');
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
test('ゲストの レベルの 上限 99 → 110: 今 いる ゲストの 強さは かわらない', () => {
  assert.equal(GUEST_MAX_LEVEL, 110);
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
  assert.equal(guestLevelCap({ minLevel: 100, maxLevel: 120 }), 110);
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
    if (C9A_MAP_IDS.includes(id)) continue;
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

test('かりの 置き場（data/c9a-stub.js）は ゲームの 本体から つながって いない・字の きまりは 守る', () => {
  const files = [...walk(join(ROOT, 'public')), ...walk(join(ROOT, 'server'))];
  const users = files.filter((p) => /c9a-stub/.test(readFileSync(p, 'utf8')) && !p.endsWith('c9a-stub.js')).map((p) => relative(ROOT, p));
  assert.deepEqual(users, [], 'public・server の どこも かりの 置き場を 読まない');
  // 本体を 読みこんだ 今、かりの 戦い・マップは 入って いない
  assert.ok(!FIXED_ENCOUNTERS.c9a_trio && !FIXED_ENCOUNTERS.c9a_trial, 'かりの 戦いは 入って いない');
  assert.ok(!('c9a_stub_room' in MAPS) && !SCRIPTS.c9a_stub_boss);
  // 字の きまり（kanji-check.mjs の gameFiles に 入って いる）
  const mine = ['public/js/shared/data/story-c9.js', 'public/js/shared/maps/c9a-flags.js', 'public/js/shared/data/c9a-stub.js', 'public/js/shared/world/shiori.js', 'public/js/shared/data/story-c8r.js'];
  const gf = gameFiles();
  for (const f of mine) {
    const g = gf.find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.ok(g, `${f} は gameFiles に ある`);
    // 題「ほしのね」は 家族が きめた ひらがなの 名前（ひらがなの 目安だけ ゆるす）
    assert.deepEqual(checkFile(g).filter((p) => !(p.kind === 'kana' && p.text.includes('ほしのね'))), [], f);
  }
});

test('かりの 置き場: 決まった 戦い c9a_trio・c9a_trial と 部屋・台本（showMon → battle）が 動く', async () => {
  const stub = await import('../public/js/shared/data/c9a-stub.js');
  assert.equal(stub.C9A_STUB, true);
  for (const id of Object.values(C9A_BATTLE)) {
    const fx = FIXED_ENCOUNTERS[id];
    assert.ok(fx && fx.boss && fx.canFlee === false, id);
    for (const [sp] of fx.group) assert.ok(MONSTERS[sp], `${id}: ${sp}`);
  }
  assert.deepEqual({ id: stub.C9A_STUB_SPICA.id, name: stub.C9A_STUB_SPICA.name }, { id: 'spica', name: 'スピカ' });
  stub.installC9aStub({ maps: MAPS, scripts: SCRIPTS });
  const room = MAPS[stub.C9A_STUB_ROOM_ID];
  assert.ok(room && room.npcById.c9a_stub_boss);
  const ctx = (f) => ({ flag: (k) => !!f[k], has: () => false, count: () => 0, name: 'ソラ' });
  const s1 = SCRIPTS.c9a_stub_boss(ctx({}));
  assert.deepEqual(s1.filter((s) => s[0] === 'showMon' || s[0] === 'battle').map((s) => s[0]), ['showMon', 'battle']);
  assert.ok(s1.some((s) => s[0] === 'battle' && s[1] === 'c9a_trio'));
  assert.ok(SCRIPTS.c9a_stub_boss(ctx({ c9_trio: true })).some((s) => s[0] === 'battle' && s[1] === 'c9a_trial'));

  // 本当に 世界で: 部屋で 話しかけて 戦って 勝つと 先へ 進む
  const world = new GameWorld({ offline: true, rng: makeRng(9090), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO('c8_solitus')) c.flags[f] = true;
  c.objective = objectiveFromFlags(c);
  bot.s.repelUntil = 1e15;
  const S = stub.C9A_STUB_ROOM_POS.start;
  world.placeSession(bot.s, stub.C9A_STUB_ROOM_ID, S.x + 0.5, S.y + 0.5, 'up', true);
  const fought = [];
  const play = async () => {
    for (let i = 0; i < 20000; i++) {
      for (const c2 of world.battles.values()) {
        if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
        c2.done = true;
        fought.push(c2.opts.fixed);
        for (let k = 0; k < 20; k++) {
          const alive = c2.battle.enemies.filter((e) => e.alive);
          if (!alive.length) break;
          for (const e of alive) c2.battle.kill(e);
        }
        c2.battle.checkEnd();
      }
      bot.flushQueue();
      await tickN(world, 1);
      bot.flushQueue();
      if (!bot.s.busy && !bot.queue.length && !bot.inBattle && !world.battles.size) {
        await tickN(world, 2);
        bot.flushQueue();
        if (!bot.s.busy && !bot.queue.length && !bot.inBattle && !world.battles.size) return;
      }
    }
  };
  await play();
  // ボスの 前に 立って 話しかける
  world.placeSession(bot.s, stub.C9A_STUB_ROOM_ID, 4.5, 2.5, 'up', true);
  await play();
  bot.send({ t: 'interact', kind: 'npc', id: 'c9a_stub_boss' });
  await play();
  assert.ok(c.flags.c9_trio, '中ボス（かり）に 勝って c9_trio');
  bot.send({ t: 'interact', kind: 'npc', id: 'c9a_stub_boss' });
  await play();
  assert.ok(c.flags.c9_trial, 'ためし（かり）に 勝って c9_trial');
  assert.deepEqual(fought, ['c9a_trio', 'c9a_trial']);
  // 一本の 線の 前の フラグも 立つ（setStoryFlag）。しおりは 第3部 第1章
  assert.ok(c.flags.c9_festival && c.flags.c9_b3 && !c.flags.c9_fork);
  assert.equal(storyPlace(c).label, '第3部 第1章 第1幕');
});

test('しらべる 道具の わく（tools/sim-ch9.mjs）: 3つの やり方で、かりの 戦いが 動く', async () => {
  const sim = await import('../tools/sim-ch9.mjs');
  assert.deepEqual(Object.keys(sim.MODES9), ['auto', 'blind', 'know']);
  assert.deepEqual(sim.CH9_LV, { trio: 96, trial: 98 });
  const party = sim.ch9Party('trio', 96);
  assert.deepEqual(party.map((c) => c.job), ['hero', 'daikenja', 'god_hand', 'high_priest']);
  for (const boss of ['trio', 'trial']) {
    for (const mode of Object.keys(sim.MODES9)) {
      const r = sim.ch9Run(boss, sim.CH9_LV[boss], mode, 1);
      assert.equal(r.outcome, 'win', `${boss} ${mode}`);
    }
  }
  assert.match(sim.summary9([sim.ch9Run('trio', 96, 'know', 2)]).text, /勝率 100%/);
});
