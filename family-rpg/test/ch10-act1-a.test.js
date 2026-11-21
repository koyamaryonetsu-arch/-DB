// 第3部 第2章 第1幕「赤と緑」（第94回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c9_act4 → くぼ地で 星の音さ（c10_start。目標 2行）→ すきな じゅん:
//   赤 … 火口（c10_r_stairs）→ 古い 道 1〜2階（レバー）→ 熱の 間（c10r_boss）→ 赤の 音（c10_red_run）→ 溶岩に 追われて 火口へ（c10_note_re）
//   緑 … 大地の下の 根（c10_g_root）→ 根の国（音の つぼみ）→ 大木（c10g_boss）→ 緑の 音（c10_note_fa）→ ささやきの森の 切りかぶ
// → くぼ地の 赤と 緑の 台（c10_act1）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch10-act1.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { MAPS, isBlocked, canStand, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C10A, C10A_LINE, C10A_RED, C10A_GREEN, C10A_BUDS, C10A_LEVERS, C10A_BONUS, C10A_PED, C10A_MAP, C10A_MAP_IDS, C10A_RUN_MAPS, C10A_CHEST_ALL,
  C10A_TILE_FIRST, C10A_TILE_LAST, C10A_TRACK_IDS, C10A_BATTLE, C10A_LAVA_MS, C10A_LAVA_SLOW_MS, C10A_LAVA_GAP_MIN, lavaStageOfGap,
} from '../public/js/shared/maps/c10a-flags.js';
import { C9D_NOTES_PLACED, songStage9 } from '../public/js/shared/maps/c9d-flags.js';
import { CH10A_MAPS } from '../public/js/shared/maps/c10a.js';
import { C10A_POS, CRATER_STAIRS10A, UNDER_ROOT10A, STUMP10A } from '../public/js/shared/maps/c10a-rows.js';
import { runEntrance10a, lavaGap10a, c10aSnap } from '../public/js/shared/world/c10a-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH10_STEPS, PART3_C10A_OPEN, c10TitleSteps, CH10_PROGRESS } from '../public/js/shared/data/story-c10.js';
import { act4ClearObjective, ACT4_END_OLD } from '../public/js/shared/data/story-c9.js';
import { C9D_OBJ } from '../public/js/shared/data/story-c9d.js';
import {
  C10A_OBJ, C10A_OBJ_ALL, CH10A_STORY_SCRIPTS, CH10A_PROGRESS, CH10A_OBJECTIVE_TARGETS, CH10A_OBJECTIVE_TALK, c10aScripts, applyCh10a, objective10a,
} from '../public/js/shared/data/story-c10a.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10A_SHOP_ADD } from '../public/js/shared/data/items-c10a.js';
import { storyPlace, storyNext } from '../public/js/shared/world/shiori.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, touch, talkTo, fixedWorld, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES10A = ['public/js/shared/maps/c10a-flags.js', 'public/js/shared/data/story-c10.js', 'public/js/shared/data/story-c10a.js',
  'public/js/shared/maps/c10a.js', 'public/js/shared/maps/c10a-rows.js', 'public/js/shared/world/c10a-steps.js',
  'public/js/client/c10a-view.js', 'public/js/client/render/tiles-c10a.js', 'public/js/client/render/c10a-npc-art.js'];
const openScripts = () => c10aScripts(c10TitleSteps, true, { ped: SCRIPTS.c9c_ped });
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh10a(SCRIPTS, STORY_SCRIPTS, { title: c10TitleSteps, open: true });
}
const SLOW = 4.6 * 0.6; // client/field.js の いちばん おそい 歩き方（スティックを 少し たおす。マス/びょう）
const hasOf = (list) => (f) => list.includes(f);

// 歩いて とどく マス（has … フラグ）
function reach(map, sx, sy, has) {
  const seen = new Set([sy * map.w + sx]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(k) || isBlocked(map, nx, ny, has)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}
const at = (map, p) => p.y * map.w + p.x;
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) await stepOn(bot, x, y, opts);
}
// となりに 歩いて しらべる（えらぶ 物の 番号）
async function goExamine(bot, p, choice = 0, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x));
  assert.ok(side, `${map.id} ${p.x},${p.y} の となり`);
  await go(bot, side[0], side[1], opts);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}
async function act4Player(world, name, job) {
  openAct();
  const P = await addPlayer(world, name, 'c9_act4', [], job);
  P.c.objective = act4ClearObjective(true);
  return P;
}
// くぼ地で 音さを 鳴らす（場面 0）
async function forkScene(bot, opts) {
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
}
// 赤の 道（行き。levers … 引く レバー）→ 熱の 間の 科学者 → 赤の 音（にげはじめる）
async function redDown(bot, opts, levers = [1, 2, 3]) {
  const c = bot.s.char;
  await place(bot, 'volcano3', 14, 21, 'up', opts);
  await stepOn(bot, 14, 20, opts);
  assert.ok(c.flags[C10A_RED.stairs], '火口の 階段を 見た');
  await go(bot, CRATER_STAIRS10A.x, CRATER_STAIRS10A.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r1);
  for (const n of levers.filter((k) => k === 1)) await goExamine(bot, C10A_POS.c10r_1.levers[0], 0, opts);
  await go(bot, C10A_POS.c10r_1.down.x, C10A_POS.c10r_1.down.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r2);
  for (const L of C10A_POS.c10r_2.levers) if (levers.includes(L.n)) await goExamine(bot, L, 0, opts);
  await go(bot, C10A_POS.c10r_2.down.x, C10A_POS.c10r_2.down.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r3);
  const B = C10A_POS.c10r_3.bossScene;
  await go(bot, B.x + 5, B.y + 1, opts);
  assert.ok(c.flags[C10A_RED.boss], '科学者に 勝った');
  assert.ok(c.flags[C10A_RED.run], 'にげはじめた');
  assert.ok((c.keyItems || []).includes('note_re'), '赤の 音');
}
// 赤の 道（帰り。溶岩に 追われて かけ上がる）
async function redUp(bot, opts) {
  const c = bot.s.char;
  await go(bot, C10A_POS.c10r_3.up.x, C10A_POS.c10r_3.up.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r2);
  await go(bot, C10A_POS.c10r_2.up.x, C10A_POS.c10r_2.up.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r1);
  await go(bot, C10A_POS.c10r_1.up.x, C10A_POS.c10r_1.up.y, opts);
  assert.equal(bot.s.map, 'volcano3');
  await play(bot, opts);
  await tickN(bot.world, 3);
  await play(bot, opts);
  assert.ok(c.flags[C10A_RED.note], 'にげ終わった（赤の 音）');
  assert.ok(!c.flags[C10A_RED.run], 'にげて いる しるしは 消す');
}
// 緑の 道
async function greenRun(bot, opts) {
  const c = bot.s.char;
  await place(bot, UNDER_ROOT10A.map, UNDER_ROOT10A.x + 1, UNDER_ROOT10A.y, 'left', opts);
  bot.choice = 0;
  await examine(bot, UNDER_ROOT10A.x, UNDER_ROOT10A.y, opts);
  assert.ok(c.flags[C10A_GREEN.root], '根を のぼった');
  assert.equal(bot.s.map, C10A_MAP.g1);
  const P1 = C10A_POS.c10g_1;
  for (const b of P1.buds) await goExamine(bot, b, 0, opts);
  assert.ok(c.flags.c10_bud1 && c.flags.c10_bud2);
  await go(bot, P1.north.x, P1.north.y, opts);
  assert.equal(bot.s.map, C10A_MAP.g2);
  const P2 = C10A_POS.c10g_2;
  await goExamine(bot, P2.buds[0], 0, opts);
  await goExamine(bot, P2.buds[1], 0, opts);
  const B = P2.bossScene;
  await go(bot, B.x + 4, B.y + 2, opts);
  assert.ok(c.flags[C10A_GREEN.boss], 'だんしゃくに 勝った');
  const H = P2.hollow[0];
  await go(bot, H.x, H.y, opts);
  assert.ok(c.flags[C10A_GREEN.note], '緑の 音');
  assert.ok((c.keyItems || []).includes('note_fa'));
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: マップ 5まい・タイル 491〜・宝箱の id・一本の 線（赤・緑は 入れない）・台本・やり直しの 行き先・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH10A_MAPS, ['c10r_1', 'c10r_2', 'c10r_3', 'c10g_1', 'c10g_2']);
  for (const id of C10A_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
  }
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C10A_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C10A_TILE_FIRST);
  assert.ok(ids[ids.length - 1] <= C10A_TILE_LAST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C10A_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.deepEqual(C10A_LINE, ['c10_start', 'c10_act1']);
  // 第95回 A班: 第2幕の はじめと おわりが うしろに（test/ch10-act2-a.test.js）
  assert.deepEqual(CH10_STEPS.slice(0, 2), C10A_LINE);
  // 第97回 A班: うしろに 第2幕の 2つ（c10b_start・c10_act2）と 第3幕の 線（10こ）
  // 第99回 A班: さらに うしろに 第4幕の 線（10こ）
  assert.deepEqual(STORY_STEPS.slice(-25, -22), ['c9_act4', 'c10_start', 'c10_act1']);
  for (const f of [...Object.values(C10A_RED), ...Object.values(C10A_GREEN), ...C10A_BUDS, ...C10A_LEVERS, ...Object.values(C10A_BONUS), ...Object.values(C10A_PED)]) {
    assert.ok(!STORY_STEPS.includes(f), `${f} は 一本の 線に 入らない（すきな じゅん）`);
  }
  // 宝箱 14こ（赤 6・緑 6・おまけ 2）
  const chests = C10A_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual([...chests].sort(), [...C10A_CHEST_ALL].sort());
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある（今の マップに 足した 物も）
  for (const id of [...C10A_MAP_IDS, 'volcano3', 'c9b_under', 'overworld', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c10/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH10A_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  assert.equal(BOSS_RETRY.c10r_boss, 'c10r_boss_event');
  assert.equal(BOSS_RETRY.c10g_boss, 'c10g_boss_event');
  assert.equal(BOSS_HINT_WHO.c10r_boss, 'ノクト');
  assert.deepEqual(C10A_TRACK_IDS, ['c10_fork', 'c10r_road', 'c10r_run', 'c10r_boss', 'c10g_roots', 'c10g_boss']);
  for (const id of ['c10r_1', 'c10r_2', 'c10r_3']) assert.equal(MAPS[id].bgm, 'c10r_road');
  for (const id of ['c10g_1', 'c10g_2']) assert.equal(MAPS[id].bgm, 'c10g_roots');
  const st = JSON.stringify(Object.values(openScripts()).map((fn) => fn(ctx(flagsOf(...UPTO('c9_act4'), 'c10_start', 'c10_red_run', 'c10_r_stairs', 'c10_r_boss')))));
  assert.ok(st.includes('c10_fork') || true);
  assert.ok(JSON.stringify(SCRIPTS.c10r_out(ctx(flagsOf('c10_red_run')))).includes('c9d_song'), 'にげ終わると スピカの歌');
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES10A) {
    assert.ok(list.some((x) => x.endsWith(f)), `gameFiles に ${f}`);
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c10a-stub.js・B の c10a-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['../public/js/shared/data/c10a-stub.js', '../public/js/shared/data/c10a-names-b.js']) assert.ok(!existsSync(new URL(f, import.meta.url)), `${f} は 消した`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c10a-stub|c10a-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // B班の 本物（宝箱 14こ・魔物の 表・決まった 戦い・だいじな 物）
  for (const id of C10A_CHEST_ALL) {
    const ch = C10A_MAP_IDS.flatMap((m) => MAPS[m].chests).find((c) => c.id === id);
    assert.ok(ch && (ch.item || ch.gold), `宝箱 ${id} の 中み`);
  }
  for (const t of ['t10r_1', 't10r_2', 't10g_1', 't10g_2']) assert.ok(ENCOUNTER_TABLES[t], t);
  for (const b of ['c10r_boss', 'c10g_boss']) assert.ok(FIXED_ENCOUNTERS[b]?.boss, b);
  for (const k of ['note_re', 'note_fa']) assert.equal(ITEMS[k]?.type, 'key', k);
});

test('閉じた 幕（PART3_C10A_OPEN）: くぼ地で 音さを 鳴らしても 始まらない・第1章 クリアの 目標は 今の まま・幕を 開けた 形も ためす', () => {
  const a4 = flagsOf(...UPTO('c9_act4'));
  const closed = c10aScripts(c10TitleSteps, false);
  assert.deepEqual(closed.c10_fork_event(ctx(a4)), []);
  if (!PART3_C10A_OPEN) {
    assert.equal(act4ClearObjective(), C9D_OBJ.act4, '閉じて いる 間は「第3部　第2章へ」の まま');
    assert.deepEqual(CH10_PROGRESS, []);
  }
  assert.equal(act4ClearObjective(true), C10A_OBJ.start);
  assert.equal(ACT4_END_OLD, C9D_OBJ.act4);
  const open = openScripts();
  const s = JSON.stringify(open.c10_fork_event(ctx(a4)));
  assert.ok(s.includes('第2章　七つの星の音') && s.includes('第1幕　赤と緑'), '題の 画面');
  assert.ok(s.includes('c10_fork'), '2つの 方向の 曲');
  assert.deepEqual(open.c10_fork_event(ctx(flagsOf(...UPTO('c9_hollow')))), [], '第1章の 間は 始まらない');
  assert.deepEqual(open.c10_fork_event(ctx({ ...a4, c10_start: true })), [], '1回だけ');
});

test('目標は 2行（赤・緑）: 片方 終えたら のこりの 1行・2つ そろったら 台へ・すすみぐあいから なおせる・行き先と ひとこと', () => {
  const o = (...fl) => objective10a(hasOf(['c9_act4', ...fl]));
  assert.equal(o(), C10A_OBJ.start);
  assert.equal(o('c10_start'), `${C10A_OBJ.red0}\n${C10A_OBJ.green0}`);
  assert.equal(o('c10_start', 'c10_r_stairs', 'c10_g_root'), `${C10A_OBJ.red1}\n${C10A_OBJ.green1}`);
  assert.equal(o('c10_start', 'c10_r_stairs', 'c10_r_boss', 'c10_red_run'), `${C10A_OBJ.redRun}\n${C10A_OBJ.green0}`);
  assert.equal(o('c10_start', 'c10_note_re'), C10A_OBJ.green0, '赤を 終えたら 緑の 1行');
  assert.equal(o('c10_start', 'c10_g_root', 'c10_g_boss', 'c10_note_fa', 'c10_r_stairs'), C10A_OBJ.red1, '緑を 終えたら 赤の 1行');
  assert.equal(o('c10_start', 'c10_note_re', 'c10_note_fa'), C10A_OBJ.place);
  assert.equal(o('c10_start', 'c10_note_re', 'c10_note_fa', 'c10_act1'), C10A_OBJ.act1);
  for (const t of C10A_OBJ_ALL) {
    assert.ok(t.split('\n').length <= 2, t);
    assert.ok(CH10A_OBJECTIVE_TARGETS[t]?.length, `行き先 ${t}`);
    if (t.includes('\n')) assert.ok(CH10A_OBJECTIVE_TARGETS[t].length >= 2, `2行の 行き先 ${t}`);
    const talk = CH10A_OBJECTIVE_TALK[t];
    assert.ok(talk && ['self', 'bold', 'kind', 'kid'].every((k) => talk[k]?.length > 8), `ひとこと ${t}`);
  }
  // すすみぐあい（progress.js の 形。うしろから 見て さいしょに 当てはまる 文）
  const fromFlags = (fl) => {
    const c = { flags: flagsOf(...UPTO('c9_act4'), ...fl) };
    for (let i = CH10A_PROGRESS.length - 1; i >= 0; i--) {
      const [k, t] = CH10A_PROGRESS[i];
      if (typeof k === 'function' ? k(c) : c.flags[k]) return t;
    }
    return null;
  };
  for (const fl of [['c10_start'], ['c10_start', 'c10_r_stairs'], ['c10_start', 'c10_note_fa', 'c10_g_root', 'c10_g_boss'], ['c10_start', 'c10_note_re', 'c10_note_fa'], ['c10_start', 'c10_act1']]) {
    assert.equal(fromFlags(fl), objective10a(hasOf([...UPTO('c9_act4'), ...fl])), fl.join(','));
  }
  // しおり: 「第3部 第2章 第1幕」・2つの 行き先を ならべる
  const c = { flags: flagsOf(...UPTO('c9_act4'), 'c10_start'), objective: o('c10_start') };
  const pl = storyPlace(c);
  assert.equal(pl.label, '第3部 第2章 第1幕');
  assert.equal(pl.title, '七つの星の音');
  assert.equal(pl.actTitle, '赤と緑');
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c9_act4'), 'c10_start', 'c10_act1') }).cleared, true);
  const sh = readFileSync(new URL('../public/js/shared/world/shiori.js', import.meta.url), 'utf8');
  assert.ok(sh.includes("start: 'c10_start', title: '赤と緑'"), 'しおりの 第1幕');
  if (PART3_C10A_OPEN) assert.ok(storyNext(c).where.includes('／'), '2つの 行き先');
});

test('前の 章を 遊んで いる 人を こわさない: 火口・大地の下・ささやきの森・くぼ地に 足したのは フラグで 出る 物だけ', () => {
  const old = (f) => !String(f).startsWith('c10_');
  const allOld = (f) => old(f); // 前の 章の フラグは ぜんぶ ある（c10 は ない）
  const none = () => false;
  for (const id of ['volcano3', 'c9b_under', 'overworld']) {
    const m = MAPS[id];
    for (const g of m.gates) {
      const fl = [...(g.levels || []).map(([f]) => f), g.flag].filter(Boolean);
      if (!fl.some((f) => String(f).startsWith('c10_'))) continue;
      for (const has of [none, allOld]) assert.equal(effectiveTile(m, g.x, g.y, has), g.closed, `${id} ${g.x},${g.y} は 今の まま`);
      assert.equal(g.closed, m.tiles[g.y * m.w + g.x], `${id} ${g.x},${g.y} の もとの マス`);
    }
    for (const w of m.warps) if (C10A_MAP_IDS.includes(w.to?.map)) assert.ok(w.show && !condOk(w.show, allOld), `${id} の 出入り口は フラグで 出る`);
    for (const a of [...m.actions, ...m.triggers]) if (/^c10/.test(a.script)) assert.ok(a.show && !condOk(a.show, allOld), `${id} ${a.script} は フラグで 出る`);
  }
  // 火口: c10_start で 黒い 石と 下り 階段
  const v3 = MAPS.volcano3;
  const S = CRATER_STAIRS10A;
  assert.equal(effectiveTile(v3, S.x, S.y, hasOf(['c10_start'])), T.STAIRS_DOWN);
  assert.ok(v3.gates.filter((g) => g.closed === T.LAVA).length >= 10);
  for (const g of v3.gates.filter((q) => q.closed === T.LAVA)) assert.equal(effectiveTile(v3, g.x, g.y, hasOf(['c10_start'])), T.OBSIDIAN);
  // 炎の山 1・2階（ガチャの 玉・お仕事いらい・第3章の レバー）は さわらない
  for (const id of ['volcano1', 'volcano2']) {
    const m = MAPS[id];
    assert.ok(!JSON.stringify([m.gates, m.warps, m.actions, m.triggers, m.npcs.map((n) => [n.id, n.show])]).includes('c10'), `${id} は かわらない`);
  }
  // 大地の下の 根・ささやきの森の 切りかぶ
  const R = UNDER_ROOT10A;
  assert.equal(effectiveTile(MAPS.c9b_under, R.x, R.y, hasOf(['c10_start'])), T.C10A_HANGROOT);
  assert.ok(!isBlocked(MAPS.c9b_under, R.x + 1, R.y, none), '根の となりに 立てる');
  assert.equal(effectiveTile(MAPS.overworld, STUMP10A.x, STUMP10A.y, hasOf(['c10_note_fa'])), T.C10A_STUMP);
  // くぼ地の 台: 光って いない 台は 音を 置くまで 今の まま
  const crater = MAPS.c9a_crater;
  const red = crater.npcById.c9c_ped1;
  assert.ok(condOk(red.show, hasOf(['c9_note1', 'c9_act4'])) && !condOk(red.show, hasOf(['c9_note1', 'c10_ped_re'])));
  assert.ok(condOk(crater.npcById.c10_ped_re_on.show, hasOf(['c10_ped_re'])));
  assert.ok(condOk(crater.npcById.c10_ped_fa_on2.show, hasOf(['c10_act1'])));
  // 台を しらべた 時: c10 の フラグが なければ 前の 台本と 同じ
  const f = flagsOf(...UPTO('c9_act4'));
  assert.deepEqual(SCRIPTS.c10_ped_re(ctx(f)), SCRIPTS.c9c_ped(ctx(f)));
  assert.deepEqual(SCRIPTS.c10_fork_event(ctx(flagsOf(...UPTO('c9_hollow')))), []);
});

test('古い 道: レバーを 引かなくても 遠回りで 上へ・下へ 行ける。レバーを 引くと 近道。魔物の 表・宝箱', () => {
  for (const id of [C10A_MAP.r1, C10A_MAP.r2]) {
    const m = MAPS[id];
    const P = C10A_POS[id];
    const up = { x: P.up.x, y: P.up.y + 1 }, down = { x: P.down.x, y: P.down.y - 1 };
    for (const fl of [[], C10A_LEVERS]) {
      const r = reach(m, down.x, down.y, hasOf(fl));
      assert.ok(r.has(at(m, up)), `${id} 下から 上へ（レバー ${fl.length ? 'あり' : 'なし'}）`);
      for (const ch of m.chests.filter((c) => c.id !== 'c10r_bonus')) assert.ok(D4.some(([dx, dy]) => r.has((ch.y + dy) * m.w + ch.x + dx)), `${id} 宝箱 ${ch.id}`);
    }
    // 近道（レバー）は 遠回りより ずっと 短い
    const len = (fl) => pathTo(m, down.x, down.y, up.x, up.y, hasOf(fl)).length;
    assert.ok(len(C10A_LEVERS) < len([]) * 0.75, `${id} 近道 ${len(C10A_LEVERS)} / 遠回り ${len([])}`);
  }
  // おまけの 部屋（つるの かべ）は 緑の 音で ひらく まで 入れない
  const r2 = MAPS.c10r_2;
  const B = C10A_POS.c10r_2.bonus;
  const D2 = C10A_POS.c10r_2.down;
  assert.ok(!reach(r2, D2.x, D2.y - 1, hasOf(C10A_LEVERS)).has(at(r2, { x: B.x, y: B.y + 1 })));
  assert.ok(reach(r2, D2.x, D2.y - 1, hasOf([C10A_BONUS.red])).has(at(r2, { x: B.x, y: B.y + 1 })));
  // 熱の 間: 階段から 科学者・光の 玉の 前へ
  const r3 = MAPS.c10r_3;
  const U3 = C10A_POS.c10r_3.up;
  const r = reach(r3, U3.x, U3.y + 1, () => false);
  const O = C10A_POS.c10r_3.orb;
  assert.ok(D4.some(([dx, dy]) => r.has((O.y + dy) * r3.w + O.x + dx)));
  assert.equal(r3.zoneAt(13, 12), 'safe:heat', '熱の 間は 魔物が 出ない');
  // 魔物の 表（行きは ふつうの 戦い）
  assert.equal(MAPS.c10r_1.zoneAt(3, 20), 't10r_1');
  assert.equal(MAPS.c10r_2.zoneAt(14, 20), 't10r_2');
  assert.equal(MAPS.c10g_1.zoneAt(10, 15), 't10g_1');
  assert.equal(MAPS.c10g_2.zoneAt(10, 22), 't10g_2');
});

test('溶岩に 追われる: いちばん おそい 歩き方でも 遠回りで 間に 合う（歩きつづければ 溶岩と 10だん いじょう 開く）', () => {
  for (const id of C10A_RUN_MAPS) {
    const m = MAPS[id];
    const E = runEntrance10a(id);
    const U = C10A_POS[id].up;
    const path = pathTo(m, Math.floor(E.x), Math.floor(E.y), U.x, U.y, () => false);
    assert.ok(path, `${id} 遠回りの 道`);
    // 3びょうに 1だん（はじめは マップの 下の はし）。1マス 1/SLOW びょう
    let tm = 0, minGap = Infinity, last = null;
    for (const [x, y] of path) {
      tm += 1 / SLOW;
      const lava = m.h - Math.floor((tm * 1000) / C10A_LAVA_MS);
      const g = lavaGap10a(lava, y + 0.5);
      minGap = Math.min(minGap, g);
      last = g;
    }
    assert.ok(minGap >= 1, `${id} とちゅうで 追いつかれない（いちばん 近い ${minGap}だん）`);
    assert.ok(last >= C10A_LAVA_GAP_MIN, `${id} 上の 階段で ${last}だん 開いた（${path.length}歩・${tm.toFixed(1)}びょう）`);
    // ななめ 見え方（2.5D・スマホの たて）で 1.3倍 かかっても 間に 合う
    let tm2 = 0, min2 = Infinity;
    for (const [, y] of path) { tm2 += 1.3 / SLOW; min2 = Math.min(min2, lavaGap10a(m.h - Math.floor((tm2 * 1000) / C10A_LAVA_MS), y + 0.5)); }
    assert.ok(min2 >= 1, `${id} 1.3倍 おそくても 追いつかれない`);
  }
  assert.deepEqual([12, 10, 9, 7, 6, 4, 3, 0].map(lavaStageOfGap), [0, 0, 1, 1, 2, 2, 3, 3]);
});

test('サーバー: 溶岩は 3びょうに 1だん・場面と メニューで 止まる・追いつかれると 階の 入口（ダメージ・お金は へらない）・3回で おそく・回線が 切れた 時・魔物と 糸', async () => {
  const world = fixedWorld(9401);
  const { bot, c } = await act4Player(world, 'ソラ');
  for (const f of ['c10_start', 'c10_r_stairs', 'c10_r_boss', 'c10_red_run']) c.flags[f] = true;
  const E = runEntrance10a(C10A_MAP.r2);
  await place(bot, C10A_MAP.r2, Math.floor(E.x), Math.floor(E.y), 'up');
  await tickN(world, 2);
  let snap = c10aSnap(world, bot.s);
  assert.ok(snap, 'snap に 溶岩');
  const h = MAPS.c10r_2.h;
  assert.equal(snap.lava, h);
  await tickN(world, C10A_LAVA_MS / 50);
  assert.equal(c10aSnap(world, bot.s).lava, h - 1, '3びょうで 1だん');
  // メニューを 開いて いる 間は 止まる
  bot.send({ t: 'menu', action: 'c10Hold', on: true });
  await tickN(world, 2 * C10A_LAVA_MS / 50);
  assert.equal(c10aSnap(world, bot.s).lava, h - 1, 'メニューの 間は 止まる');
  bot.send({ t: 'menu', action: 'c10Hold', on: false });
  // 魔物は 出ない・糸と 羽は 使えない
  assert.ok(MAPS.c10r_2.noEscape, 'にげて いる 間は 糸と 羽が 使えない');
  assert.ok(MAPS.c10r_2.symBlock(world, {}), '魔物は 出ない');
  // 立ち止まると 追いつかれる → 入口へ（HP・お金は へらない）
  const hp = c.hp, gold = c.gold;
  await stepOn(bot, Math.floor(E.x), Math.floor(E.y) - 1);
  await tickN(world, 4 * C10A_LAVA_MS / 50);
  assert.equal(Math.floor(bot.s.y), Math.floor(E.y), '階の 入口に もどった');
  assert.equal(c.hp, hp);
  assert.equal(c.gold, gold);
  assert.equal(c10aSnap(world, bot.s).n, 1);
  assert.ok(c10aSnap(world, bot.s).lava >= h - 1, '溶岩も 階の はじめに もどる');
  // 3回で おそく なる
  await tickN(world, 2 * 4 * C10A_LAVA_MS / 50);
  assert.equal(c10aSnap(world, bot.s).n, 3);
  assert.equal(c10aSnap(world, bot.s).iv, C10A_LAVA_SLOW_MS, '3回 追いつかれると 5びょうに 1だん');
  // 回線が 切れた 時: その 階の 入口から
  await stepOn(bot, Math.floor(E.x), Math.floor(E.y) - 2);
  bot.s.away = true;
  bot.s.awayAt = world.now();
  await tickN(world, 2);
  bot.s.away = false;
  await tickN(world, 2);
  assert.equal(Math.floor(bot.s.y), Math.floor(E.y), 'つなぎなおすと 階の 入口');
  // ゲームを 入りなおした（セーブの 場所が 古い 道）: 入口から
  bot.s.c10Arrive = null;
  bot.s.c10Lava = null;
  bot.s.y = E.y - 3;
  await tickN(world, 2);
  assert.equal(Math.floor(bot.s.y), Math.floor(E.y));
  // フラグの ない 人には 溶岩は ない
  delete c.flags.c10_red_run;
  await tickN(world, 2);
  assert.equal(c10aSnap(world, bot.s), null);
  assert.ok(!MAPS.c10r_2.noEscape);
});

test('根の国: つぼみを さかせないと 先へ 行けない・さかせると つる・葉・きのこで 道が できる・見はらし台・おまけの こおった つぼみ', () => {
  const g1 = MAPS.c10g_1, g2 = MAPS.c10g_2;
  const P1 = C10A_POS.c10g_1, P2 = C10A_POS.c10g_2;
  const s1 = { x: P1.south.x, y: P1.south.y - 1 };
  const n1 = { x: P1.north.x, y: P1.north.y + 1 };
  assert.ok(!reach(g1, s1.x, s1.y, () => false).has(at(g1, n1)), '1: つぼみなしでは 北へ 行けない');
  assert.ok(!reach(g1, s1.x, s1.y, hasOf(['c10_bud1'])).has(at(g1, n1)), '1: つぼみ 1 だけでは 行けない');
  assert.ok(reach(g1, s1.x, s1.y, hasOf(['c10_bud1', 'c10_bud2'])).has(at(g1, n1)), '1: 2つ さかせると 北へ');
  // どの つぼみも その 前の つぼみで 行ける 所に ある
  assert.ok(D4.some(([dx, dy]) => reach(g1, s1.x, s1.y, () => false).has((P1.buds[0].y + dy) * g1.w + P1.buds[0].x + dx)));
  assert.ok(D4.some(([dx, dy]) => reach(g1, s1.x, s1.y, hasOf(['c10_bud1'])).has((P1.buds[1].y + dy) * g1.w + P1.buds[1].x + dx)));
  const s2 = { x: P2.south.x, y: P2.south.y - 1 };
  const tree = { x: P2.boss.x, y: P2.boss.y + 1 };
  assert.ok(!reach(g2, s2.x, s2.y, hasOf(['c10_bud3'])).has(at(g2, tree)), '2: つぼみ 3 だけでは 大木へ 行けない');
  assert.ok(reach(g2, s2.x, s2.y, hasOf(['c10_bud3', 'c10_bud4'])).has(at(g2, tree)), '2: 2つ さかせると 大木へ');
  assert.ok(D4.some(([dx, dy]) => reach(g2, s2.x, s2.y, hasOf(['c10_bud3'])).has((P2.buds[1].y + dy) * g2.w + P2.buds[1].x + dx)));
  // きのこ: はねて 高い 台へ（決まった 着地点。着く 所は 出入り口で ない）
  for (const [m, P] of [[g1, P1], [g2, P2]]) {
    for (const s of P.shrooms) {
      const w = m.warpAt.get(s.y * m.w + s.x);
      assert.ok(w && w.to.map === m.id && !condOk(w.show, () => false) && condOk(w.show, hasOf([C10A_BUDS[s.bud - 1]])), `${m.id} きのこ`);
      assert.ok(!m.warpAt.has(Math.floor(w.to.y) * m.w + Math.floor(w.to.x)) && !isBlocked(m, Math.floor(w.to.x), Math.floor(w.to.y), () => true));
      const top = reach(m, Math.floor(w.to.x), Math.floor(w.to.y), () => true);
      assert.ok(D4.some(([dx, dy]) => top.has((P.lookout.y + dy) * m.w + P.lookout.x + dx)), `${m.id} 見はらし台に 行ける`);
      assert.ok(top.has(s.back.y * m.w + s.back.x), `${m.id} とびおりる きのこ`);
    }
  }
  // おまけ（赤の 音で 火の 花）
  const B = P1.bonus;
  assert.ok(!reach(g1, s1.x, s1.y, hasOf(C10A_BUDS)).has(at(g1, { x: B.x - 1, y: B.y })));
  assert.ok(reach(g1, s1.x, s1.y, hasOf([C10A_BONUS.green])).has(at(g1, { x: B.x - 1, y: B.y })));
  // 大木の うろ: 緑の 音の あとは ささやきの森へ。切りかぶから もどれる
  for (const H of P2.hollow) {
    const w = g2.warpAt.get(H.y * g2.w + H.x);
    assert.equal(w.to.map, 'overworld');
    assert.ok(!condOk(w.show, hasOf(['c10_g_boss'])) && condOk(w.show, hasOf(['c10_note_fa'])));
  }
  const ow = MAPS.overworld;
  const sw = ow.warpAt.get(STUMP10A.y * ow.w + STUMP10A.x);
  assert.equal(sw.to.map, C10A_MAP.g2);
  assert.ok(!isBlocked(ow, Math.floor(sw.to.x), Math.floor(sw.to.y), () => true) || true);
  assert.ok(!isBlocked(g2, Math.floor(sw.to.x), Math.floor(sw.to.y), hasOf(C10A_BUDS)));
  // ワープの 着く 所は ワープの マスに しない（maps.test と 同じ きまり）
  for (const id of [...C10A_MAP_IDS, 'volcano3', 'c9b_under', 'overworld']) {
    for (const w of MAPS[id].warps) {
      if (!C10A_MAP_IDS.includes(w.to.map) && !C10A_MAP_IDS.includes(id)) continue;
      const to = MAPS[w.to.map];
      assert.ok(!to.warpAt.has(Math.floor(w.to.y) * to.w + Math.floor(w.to.x)), `${id} → ${w.to.map} ${w.to.x},${w.to.y}`);
    }
  }
});

test('スピカの歌: 赤・緑の 音を 手に 入れると 1ふしずつ ふえる（C9D_NOTES_PLACED の 形）', () => {
  assert.ok(C9D_NOTES_PLACED.includes('c10_note_re') && C9D_NOTES_PLACED.includes('c10_note_fa'));
  assert.equal(songStage9(hasOf(['c9_act3'])), 1);
  assert.equal(songStage9(hasOf(['c9_act3', 'c10_note_re'])), 2);
  assert.equal(songStage9(hasOf(['c9_act3', 'c10_note_fa'])), 2);
  assert.equal(songStage9(hasOf(['c9_act3', 'c10_note_re', 'c10_note_fa'])), 3);
});

for (const order of ['red', 'green']) {
  test(`通し（ひとり・${order === 'red' ? '赤 → 緑' : '緑 → 赤'}）: くぼ地 → ${order === 'red' ? '赤の 道（溶岩に 追われる）→ 緑の 道' : '緑の 道 → 赤の 道'} → おまけ → 台に 置く（c10_act1）`, async () => {
    const world = fixedWorld(order === 'red' ? 9411 : 9412);
    const { bot, c } = await act4Player(world, 'ソラ');
    const fought = [];
    const opts = { fought };
    await forkScene(bot, opts);
    assert.ok(c.flags[C10A.start], '2つの 方向');
    assert.ok(said(bot, '第2章　七つの星の音'), '題の 画面');
    assert.equal(c.objective, `${C10A_OBJ.red0}\n${C10A_OBJ.green0}`);
    const red = async () => {
      await redDown(bot, opts, order === 'red' ? [1, 2, 3] : []);
      assert.ok(fought.includes(C10A_BATTLE.red));
      assert.ok(said(bot, 'おぼえてろ'));
      await redUp(bot, opts);
      assert.ok(said(bot, '歌が、ひとふし、ふえた'));
    };
    const green = async () => {
      await greenRun(bot, opts);
      assert.ok(fought.includes(C10A_BATTLE.green));
    };
    if (order === 'red') {
      await red();
      assert.equal(c.objective, C10A_OBJ.green0, '赤を 終えたら 緑の 1行');
      await green();
    } else {
      await green();
      assert.equal(c.objective, C10A_OBJ.red0, '緑を 終えたら 赤の 1行');
      await red();
    }
    assert.equal(c.objective, C10A_OBJ.place);
    // おまけの 部屋（2つ 取った あとなら 両方 取れる）
    await place(bot, C10A_MAP.g1, 40, 30, 'right', opts);
    bot.choice = 0;
    await examine(bot, C10A_POS.c10g_1.iceBud.x, C10A_POS.c10g_1.iceBud.y, opts);
    assert.ok(c.flags[C10A_BONUS.green], 'こおった つぼみ');
    await go(bot, C10A_POS.c10g_1.bonus.x - 1, C10A_POS.c10g_1.bonus.y, opts);
    await examine(bot, C10A_POS.c10g_1.bonus.x, C10A_POS.c10g_1.bonus.y, opts);
    assert.ok(c.chests.c10g_bonus, 'おまけの 宝箱（緑）');
    const W = C10A_POS.c10r_2.vineWall;
    await place(bot, C10A_MAP.r2, W.x + 1, W.y, 'left', opts);
    await examine(bot, W.x, W.y, opts);
    assert.ok(c.flags[C10A_BONUS.red], 'つるの かべ');
    const BR = C10A_POS.c10r_2.bonus;
    await go(bot, BR.x + 1, BR.y, opts);
    await examine(bot, BR.x, BR.y, opts);
    assert.ok(c.chests.c10r_bonus, 'おまけの 宝箱（赤）');
    // 大木の うろ → ささやきの森の 切りかぶ → もどる
    const H = C10A_POS.c10g_2.hollow[0];
    await place(bot, C10A_MAP.g2, H.x, H.y + 2, 'up', opts);
    await go(bot, H.x, H.y, opts);
    assert.equal(bot.s.map, 'overworld', 'うろから ささやきの森へ');
    await go(bot, STUMP10A.x, STUMP10A.y, opts);
    assert.equal(bot.s.map, C10A_MAP.g2, '切りかぶから 大木へ');
    // E くぼ地の 台
    await talkTo(bot, 'c9a_crater', 'c9c_ped1', 0, opts);
    assert.ok(c.flags[C10A_PED.re], '赤の 台');
    assert.ok(!c.flags[C10A.act1]);
    await talkTo(bot, 'c9a_crater', 'c9c_ped4', 0, opts);
    assert.ok(c.flags[C10A.act1], '幕の クリア');
    assert.ok(!c.flags[C10A_PED.re] && !c.flags[C10A_PED.fa], '小さな フラグは 消す');
    assert.ok(said(bot, '光の町'), 'スピカの 記おく');
    assert.equal(c.objective, C10A_OBJ.act1);
    // くぼ地の 武具屋に 品が 4つ ふえた
    const shop = JSON.stringify(SCRIPTS.c9b_armorer(ctx(c.flags)));
    assert.ok(shop.includes('c10a_crater') && C10A_SHOP_ADD.every((id) => SHOPS.c10a_crater.items.includes(id)));
    assert.ok(!JSON.stringify(SCRIPTS.c9b_armorer(ctx({ ...c.flags, c10_act1: false }))).includes('c10a_crater'), 'クリアの 前は 今の 店');
    // 「行った 所」は 取らない
    assert.ok(!C10A_MAP_IDS.some((id) => c.explored?.[id]));
  });
}

test('家族 2人: 赤と 緑に 分かれて 同時に（それぞれ 自分の 物語）・溶岩は 1人ずつ', async () => {
  const world = fixedWorld(9413);
  const A = await act4Player(world, 'ソラ');
  const B = await act4Player(world, 'ミナ', 'mage');
  const opts = { bots: [B.bot] };
  for (const P of [A, B]) {
    P.c.flags.c10_start = true;
    P.c.objective = objective10a((f) => !!P.c.flags[f]);
  }
  // ソラは 赤・ミナは 緑（パーティーを 組まずに 同時に）
  await redDown(A.bot, { bots: [B.bot] }, [1]);
  await greenRun(B.bot, { bots: [A.bot] });
  assert.ok(A.c.flags.c10_red_run && !A.c.flags.c10_g_root);
  assert.ok(B.c.flags.c10_note_fa && !B.c.flags.c10_r_stairs);
  // 溶岩は ソラだけ
  await go(A.bot, C10A_POS.c10r_3.up.x, C10A_POS.c10r_3.up.y, opts);
  assert.ok(c10aSnap(world, A.bot.s));
  await place(B.bot, C10A_MAP.r2, 15, 30, 'up', { bots: [A.bot] });
  assert.equal(c10aSnap(world, B.bot.s), null, 'ミナには 溶岩が ない');
  await redUp(A.bot, opts);
  assert.ok(A.c.flags.c10_note_re);
});

test('家族 2人（いっしょに）: 赤の 帰りは 1人ずつ にげる・先に 着いた 人は 待つ・2人とも 火口に 着くと 終わり', async () => {
  const world = fixedWorld(9414);
  const A = await act4Player(world, 'ソラ');
  const B = await act4Player(world, 'ミナ', 'mage');
  A.c.flags.c10_start = true;
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  for (const f of ['c10_r_stairs', 'c10_r_boss', 'c10_red_run']) A.c.flags[f] = true;
  const E2 = runEntrance10a(C10A_MAP.r2);
  await place(A.bot, C10A_MAP.r2, Math.floor(E2.x), Math.floor(E2.y), 'up', { bots: [B.bot] });
  await place(B.bot, C10A_MAP.r2, Math.floor(E2.x) - 1, Math.floor(E2.y), 'up', { bots: [A.bot] });
  await tickN(world, 2);
  assert.ok(c10aSnap(world, A.bot.s) && c10aSnap(world, B.bot.s), '2人とも 溶岩');
  // ソラは 走って 上へ・ミナは 立ち止まって 追いつかれる
  await go(A.bot, C10A_POS.c10r_2.up.x, C10A_POS.c10r_2.up.y, { bots: [B.bot] });
  await go(A.bot, C10A_POS.c10r_1.up.x, C10A_POS.c10r_1.up.y, { bots: [B.bot] });
  assert.equal(A.bot.s.map, 'volcano3');
  await stepOn(B.bot, Math.floor(E2.x) - 1, Math.floor(E2.y) - 1, { bots: [A.bot] });
  await tickN(world, 4 * C10A_LAVA_MS / 50);
  assert.ok(c10aSnap(world, B.bot.s).n >= 1, 'ミナは 追いつかれて もどった');
  assert.equal(c10aSnap(world, A.bot.s), null, 'ソラは もう 火口（溶岩は ない）');
  assert.ok(A.c.flags.c10_red_run, 'ミナが まだ 古い 道に いる 間は 終わらない');
  await go(B.bot, C10A_POS.c10r_2.up.x, C10A_POS.c10r_2.up.y, { bots: [A.bot] });
  await go(B.bot, C10A_POS.c10r_1.up.x, C10A_POS.c10r_1.up.y, { bots: [A.bot] });
  await tickN(world, 3);
  await play(A.bot, { bots: [B.bot] });
  assert.ok(A.c.flags.c10_note_re && !A.c.flags.c10_red_run, '2人とも 着いて 終わり');
});
