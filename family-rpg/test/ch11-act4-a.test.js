// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」（第104回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c11_act3 → 大とびらの 中・光の はかりの 広間（c11d_start）→ かがやきの 塔 1階 星座（c11d_t1）→ 2階 おもてと うら（c11d_t2）→ 3階 かげの 台（c11d_t3）
//   → 4階 音の 間（c11d_t4）→ 中ボス 鏡と 月の 使い（c11d_duo）→ 玉座の 間・女王（c11d_queen）→ 名前の ランプ（c11d_lamp）→ 星の橋（c11d_bridge）→ c11_act4
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当に 戦う 通しは test/ch11-act4.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C11D, C11D_ACT0, C11D_LINE, C11D_MAP, C11D_MAP_IDS, C11D_CHEST_IDS, C11D_TILE_FIRST, C11D_TILE_LAST, C11D_TRACKS, C11D_TRACK_IDS, C11D_BATTLE,
  C11D_MARKS, C11D_SONG_ORDER, C11D_PADS, C11D_PAD_HELP, C11D_HELP_STEPS, C11D_QUEEN_NAME, C11D_QUEEN_SHORT, C11D_FLOOR_FLAGS, C11D_EIGHT_ART, C11D_PAIR,
} from '../public/js/shared/maps/c11d-flags.js';
import { CH11D_MAPS, padAt11d } from '../public/js/shared/maps/c11d.js';
import {
  TOWER1_POS11D, TOWER2_POS11D, TOWER2_SECTIONS11D, TOWER3_POS11D, TOWER4_POS11D, THRONE_POS11D, SCALE_POS11D, CITY_POS11D, HILL_POS11D, PED8_11D, DOOR_IN11D,
  SCENES11D, CON11D,
} from '../public/js/shared/maps/c11d-rows.js';
import { C11C, C11C_LINE } from '../public/js/shared/maps/c11c-flags.js';
import { solve11a, goodStarts11a } from '../public/js/shared/data/constellations-c11a.js';
import { solve11b, reachable11b } from '../public/js/shared/world/c11b-steps.js';
import { solve11c, reachable11c, algolPed11c } from '../public/js/shared/world/c11c-steps.js';
import { padState11d } from '../public/js/shared/world/c11d-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH11_STEPS, PART3_C11D_OPEN, c11dTitleSteps, CH11_PROGRESS, CH11_OBJECTIVE_TARGETS, act3ClearObjective, C11D_TITLE,
} from '../public/js/shared/data/story-c11.js';
import { C11C_OBJ } from '../public/js/shared/data/story-c11c.js';
import {
  C11D_OBJ, C11D_OBJ_ALL, CH11D_STORY_SCRIPTS, CH11D_PROGRESS, CH11D_OBJECTIVE_TARGETS, CH11D_OBJECTIVE_TALK, c11dScripts, applyCh11d, objective11d,
  C11D_EIGHT_SCENE, C11D_END_TITLE,
} from '../public/js/shared/data/story-c11d.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { retrySpot } from '../public/js/shared/world/boss-hints.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { existsSync } from 'node:fs';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { C11D_FRONT_ADD } from '../public/js/shared/data/items-c11d.js';
import { C11D_BOSS_MON } from '../public/js/shared/maps/c11d-flags.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, addPlayer, play, place, stepOn, examine, talkTo, walkTo, fixedWorld } from './c9a-play.js';


// 本体の 台本（テストが 幕を 開けた 形を まぜる 前）
const BODY = { start: SCRIPTS.c11d_start_event, guard: SCRIPTS.c11b_guard, ace: SCRIPTS.c11c_end_event };
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES11D = ['public/js/shared/maps/c11d-flags.js', 'public/js/shared/data/story-c11d.js', 'public/js/shared/maps/c11d.js', 'public/js/shared/maps/c11d-rows.js',
  'public/js/shared/world/c11d-steps.js', 'public/js/client/c11d-view.js', 'public/js/client/render/tiles-c11d.js', 'public/js/client/render/c11d-npc-art.js'];
const openScripts = () => c11dScripts(c11dTitleSteps, true, SCRIPTS);
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh11d(SCRIPTS, STORY_SCRIPTS, { title: c11dTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const tile = (s) => [Math.floor(s.x), Math.floor(s.y)];
const lastSnap = (bot, k = 'c11d') => [...bot.msgs].reverse().find((m) => m.t === 'snap')?.[k] || null;
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const M = (k) => MAPS[C11D_MAP[k]];
const C11D_DOOR_MAP = 'c11c_door';

async function act0Player(world, name, upto = C11D_ACT0, job) {
  openAct();
  const P = await addPlayer(world, name, upto, [], job);
  P.c.objective = objective11d((f) => !!P.c.flags[f]);
  return P;
}
async function party2(world, upto) {
  const A = await act0Player(world, 'ソラ', upto);
  const B = await act0Player(world, 'ミナ', upto, 'mage');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  B.bot.s.follow = false;
  return { A, B, oA: { bots: [B.bot] }, oB: { bots: [A.bot] } };
}
// 1階: 星座を ひとふでで（画面と 同じ: 地面から 星に 入る → 星の 上で 線の マスを しらべる）
async function runCon(bot, opts) {
  const con = M('tower1').c11aCons[0];
  const sol = solve11a(con, con.entries);
  assert.ok(sol, '星座は とける');
  const [x, y] = con.stars[sol.start];
  const has = bot.world.hasFlagFn(bot.s);
  const g = Object.values(DIRV).map(([dx, dy]) => [x + dx, y + dy]).find(([gx, gy]) => !con.stars.some(([a, b]) => a === gx && b === gy) && !isBlocked(M('tower1'), gx, gy, has));
  await walkTo(bot, g[0], g[1], opts);
  await stepOn(bot, x, y, opts);
  for (const m of sol.path) {
    const [dx, dy] = DIRV[m.dir];
    await examine(bot, Math.floor(bot.s.x) + dx, Math.floor(bot.s.y) + dy, opts);
  }
  return sol;
}
// 2階: おもてと うら（画面と 同じ: 歩く・戸の 上で しらべる）
const sideOf = (s) => MAPS[s.map].c11b.side;
async function runMoon(bot, opts) {
  const S = TOWER2_SECTIONS11D[0];
  const [x0, y0] = tile(bot.s);
  const path = solve11b(S, { side: sideOf(bot.s), x: x0, y: y0 }, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `2階: ${bot.s.map} ${x0},${y0} から 出口へ`);
  for (const step of path) {
    const [sd, x, y] = step.st;
    if (step.act?.kind === 'door') {
      await examine(bot, x, y - 1, opts);
      assert.equal(bot.s.map, sd ? C11D_MAP.tower2b : C11D_MAP.tower2, `戸で ${sd ? 'うら' : 'おもて'}へ`);
    } else await stepOn(bot, x, y, opts);
  }
  return path;
}
// 3階: かげの 台（画面と 同じ: 歩く・台の 上で A・台の ない 所で A → 「よびもどす」）
async function runShadow(bot, opts) {
  const map = M('tower3');
  const [x0, y0] = tile(bot.s);
  const path = solve11c(map, { x: x0, y: y0 }, algolPed11c(bot.world, bot.s));
  assert.ok(path, `3階: ${x0},${y0} から 出口へ`);
  for (const step of path) {
    const [x, y, a] = step.st;
    if (step.act?.kind === 'call') {
      await examine(bot, x, y - 1, opts);
      assert.equal(algolPed11c(bot.world, bot.s), a);
    } else if (step.act?.kind === 'recall') {
      bot.choice = 0;
      await examine(bot, x, y - 1, opts);
    } else await stepOn(bot, x, y, opts);
  }
  return path;
}
// 4階: 音の 台を 1つ ふむ（台の ない 下の 列から 上がって、下りる）
async function stepPad(bot, i, opts) {
  const P = TOWER4_POS11D.pads[i];
  await walkTo(bot, P.x, P.y + 1, opts);
  await stepOn(bot, P.x, P.y, opts);
  await stepOn(bot, P.x, P.y + 1, opts);
}

test('名前の 約束: マップ 7まい・タイル 741〜780・宝箱の id・一本の 線・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH11D_MAPS, ['c11d_scale', 'c11d_tower1', 'c11d_tower2', 'c11d_tower2b', 'c11d_tower3', 'c11d_tower4', 'c11d_throne']);
  for (const id of C11D_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」の 地図を 取らない（セーブを 小さく）`);
    assert.ok(C11D_TRACK_IDS.includes(m.bgm), `${id} の 曲は この 幕の id`);
    assert.ok(m.c11cAlgol, `${id} は アルゴルが いっしょ`);
  }
  assert.equal(M('scale').bgm, C11D_TRACKS.scale);
  for (const k of ['tower1', 'tower2', 'tower2b', 'tower3', 'tower4']) assert.equal(M(k).bgm, C11D_TRACKS.tower);
  assert.deepEqual(['tower1', 'tower2', 'tower2b', 'tower3', 'tower4', 'scale', 'throne'].map((k) => M(k).c11dTower || 0), [1, 2, 2, 3, 4, 0, 0], '曲の towerStage（塔の 階）');
  // 前の 幕の しくみを この マップで 使う
  assert.ok(M('tower1').c11aCons?.length === 1, '1階は ひとふで書き');
  assert.equal(M('tower2').c11b.pair, C11D_PAIR); assert.equal(M('tower2b').c11b.other, C11D_MAP.tower2);
  assert.ok(M('tower3').c11c?.peds.length === 3, '3階は かげの 台');
  assert.equal(M('tower4').c11dPads.length, 7, '4階は 7色の 音の 台');
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C11D_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.ok(ids.length && ids.every((v) => v >= C11D_TILE_FIRST && v <= C11D_TILE_LAST), 'タイル 741〜780');
  for (const v of ids) assert.ok(TILE_INFO[v], `TILE_INFO ${v}`);
  // 宝箱 8こ
  const chests = C11D_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id)).sort();
  assert.deepEqual(chests, [...C11D_CHEST_IDS].sort());
  // 一本の 線（c11_act3 の うしろ。それで おわり）。階を 通った しるしも 線の 中
  const j = STORY_STEPS.indexOf(C11D_ACT0);
  assert.deepEqual(STORY_STEPS.slice(j + 1), C11D_LINE);
  assert.deepEqual(CH11_STEPS.slice(-C11D_LINE.length - C11C_LINE.length), [...C11C_LINE, ...C11D_LINE]);
  assert.deepEqual(Object.values(C11D_FLOOR_FLAGS), [C11D.t1, C11D.t2, C11D.t3, C11D.t4]);
  assert.equal(CON11D.id, C11D.t1, '星座が できる ＝ 1階を 通った');
  for (const f of C11D_MARKS) assert.ok(!STORY_STEPS.includes(f), `${f} は 線に 入らない`);
  // 台本（パーティーで 見る）・やり直しの 行き先（ノクト）
  openAct();
  for (const id of CH11D_STORY_SCRIPTS) { assert.ok(SCRIPTS[id], id); assert.ok(STORY_SCRIPTS.has(id), `${id} は パーティーで 見る`); }
  for (const m of [...C11D_MAP_IDS, 'c11b_front', 'c11c_door', 'overworld', 'c9a_crater'].map((id) => MAPS[id])) {
    for (const n of m.npcs) assert.ok(SCRIPTS[n.script], `${m.id} ${n.id}`);
    for (const a of m.actions) assert.ok(SCRIPTS[a.script], `${m.id} ${a.script}`);
    for (const t of m.triggers) assert.ok(SCRIPTS[t.script], `${m.id} ${t.script}`);
  }
  assert.ok(SCRIPTS[`c11a_done_${C11D.t1}`] && SCRIPTS.c11d_pads_done, '星座が できた・7つの 音が そろった 台本');
  assert.equal(BOSS_RETRY[C11D_BATTLE.duo], 'c11d_duo_event');
  assert.equal(BOSS_RETRY[C11D_BATTLE.queen], 'c11d_queen_event');
  assert.equal(BOSS_HINT_WHO[C11D_BATTLE.duo], 'ノクト');
  assert.equal(BOSS_HINT_WHO[C11D_BATTLE.queen], 'ノクト');
  // やり直しの 場所: 中ボスは 4階の 音の 間（いずみの ある 階）・女王は 玉座の 間の 入口
  const has = hasOf([...UPTO(C11D.duo)]);
  const r1 = retrySpot(C11D_BATTLE.duo, C11D_MAP.tower4, hasOf(UPTO(C11D.t4)));
  assert.ok(r1 && r1.map === C11D_MAP.tower4 && r1.y > SCENES11D.duo.y + 1, `中ボスの やり直し ${JSON.stringify(r1)}`);
  const r2 = retrySpot(C11D_BATTLE.queen, C11D_MAP.throne, has);
  assert.ok(r2 && r2.map === C11D_MAP.throne && r2.y >= SCENES11D.queen.y + 2, `女王の やり直し ${JSON.stringify(r2)}`);
  // 曲（20-6 の 表）
  const S = openScripts();
  const sc = (id, ...fl) => JSON.stringify(S[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c11d_start_event', C11D_ACT0).includes(`"${C11D_TRACKS.scale}"`), 'はかりの 広間の 曲');
  assert.ok(sc('c11d_duo_event', C11D.t4).includes(`"${C11D_TRACKS.duo}"`), '中ボスの 曲');
  const q = sc('c11d_queen_event', C11D.duo);
  for (const k of ['queen', 'lamps', 'end']) assert.ok(q.includes(`"${C11D_TRACKS[k]}"`), `${k} の 曲`);
  assert.equal(C11D_EIGHT_SCENE.bgm, C11D_TRACKS.eight); assert.equal(C11D_EIGHT_SCENE.after, C11D_TRACKS.queen2);
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES11D) {
    const g = list.find((x) => x.endsWith(f));
    assert.ok(g, `gameFiles に ${f}`);
    assert.deepEqual(checkFile(gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f))).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の data/c11d-stub.js・B の data/c11d-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['c11d-stub.js', 'c11d-names-b.js']) assert.ok(!existsSync(new URL(`../public/js/shared/data/${f}`, import.meta.url)), `${f} は ない`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c11d-stub|c11d-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // 本物に つないだ: 宝箱（B班の 中み）・魔物の 表（階ごと）・戦い・ボスの 種・店（クリアで 4つ）・だいじな 物
  for (const id of C11D_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(ch.item && ITEMS[ch.item], `${ch.id} は B班の 品`);
  for (const n of [1, 3]) assert.deepEqual(Object.keys(MAPS[`c11d_tower${n}`].spawnCounts), [`t11d_tower${n}`]);
  assert.deepEqual(Object.keys(MAPS.c11d_tower2.spawnCounts), ['t11d_tower2']);
  for (const k of ['scale', 'tower4', 'throne']) assert.deepEqual(M(k).spawnCounts, {}, `${k} では 出ない`);
  for (const id of Object.values(C11D_BATTLE)) assert.ok(FIXED_ENCOUNTERS[id]?.boss, id);
  for (const id of Object.values(C11D_BOSS_MON)) assert.ok(MONSTERS[id], `ボスの 種 ${id}`);
  assert.equal(MONSTERS[C11D_BOSS_MON.queen].name, C11D_QUEEN_NAME);
  const shop = SHOPS.c11b_arms;
  assert.ok(!C11D_FRONT_ADD.some((i) => shopItems(shop, () => false).includes(i)), 'クリアの 前は ない');
  assert.ok(C11D_FRONT_ADD.every((i) => ITEMS[i] && shopItems(shop, (f) => f === C11D.act4).includes(i)), 'クリアで 4つ');
  assert.ok(ITEMS.note_eight && JSON.stringify(SCRIPTS.c11d_queen_event(ctx(flagsOf(...UPTO(C11D.duo))))).includes('"note_eight"'), '八つめの 音を E1 で わたす');
  // 女王の 名前は flags（台本が 読む）
  assert.equal(C11D_QUEEN_NAME, 'かがやきの女王ポラリス');
  assert.ok(sc('c11d_start_event', C11D_ACT0).includes(C11D_QUEEN_SHORT));
});

// 台本の 文を ぜんぶ 集める（いろいろな フラグで）
function allText() {
  const S = openScripts();
  const story = [
    S.c11d_start_event(ctx(flagsOf(...UPTO(C11D_ACT0)))), S.c11d_tower1_event(ctx(flagsOf(...UPTO(C11D.start)))),
    S.c11d_tower2_event(ctx(flagsOf(...UPTO(C11D.t1)))), S.c11d_tower3_event(ctx(flagsOf(...UPTO(C11D.t1)))), S.c11d_tower4_event(ctx(flagsOf(...UPTO(C11D.t2)))),
    S[`c11a_done_${C11D.t1}`](ctx(flagsOf(...UPTO(C11D.start)))), S.c11d_pads_done(ctx(flagsOf(...UPTO(C11D.t3)))),
    S.c11d_duo_event(ctx(flagsOf(...UPTO(C11D.t4)))), S.c11d_duo_event(ctx(flagsOf(...UPTO(C11D.t4)), { c: { __c11dDuoSeen: true } })),
    S.c11d_queen_event(ctx(flagsOf(...UPTO(C11D.duo)))), S.c11d_queen_event(ctx(flagsOf(...UPTO(C11D.duo)), { c: { __c11dQueenSeen: true } })),
    S.c11d_end_event(ctx(flagsOf(...UPTO(C11D.queen)))), S.c11d_end_event(ctx(flagsOf(...UPTO(C11D.lamp)))), S.c11d_end_event(ctx(flagsOf(...UPTO(C11D.bridge)))),
  ];
  const others = [];
  for (const k of [C11D_ACT0, ...C11D_LINE]) others.push(...Object.entries(S).filter(([id]) => /^c11d_/.test(id) || /^c11b_/.test(id)).map(([, fn]) => fn(ctx(flagsOf(...UPTO(k))))));
  const eight = C11D_EIGHT_SCENE.lines.map((l) => ['say', l.who, l.text]);
  return { story, others, eight };
}

test('台本の きまり（20-1）: カイ・ソリトゥス・第1部と 第2部の ひみつを 書かない・八つめの 音は 名前も 正体も 言わない・トキネは 声の ひとこと・女王は 悪者に しない', () => {
  const { story, others, eight } = allText();
  for (const [i, st] of story.entries()) assert.ok(st.length, `場面 ${i}`);
  const text = JSON.stringify([story, others, eight, C11D_EIGHT_SCENE]);
  for (const w of ['カイ', 'ソリトゥス', 'トキネ', 'ネフィ', 'カリム', 'ミナモ', 'リオン', '勇者', '紋章', '第1部', '第2部', '千年前', '正体', 'ひみつ', '死ん', 'たおれ', '悪者']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  const says = [story, others, eight].flat(2).filter((s) => Array.isArray(s) && s[0] === 'say');
  // 八つめの 音（T6）: 地の 文と ノクトの ひとこと「……おまえ、なのか」だけ。だれの 光かを 書かない
  const e = C11D_EIGHT_SCENE.lines;
  assert.ok(e.length >= 4 && e.length <= 8, '短い 場面');
  assert.deepEqual(e.filter((l) => l.who).map((l) => [l.who, l.text]), [['ノクト', '……おまえ、なのか。']], 'せりふは ノクトの ひとこと だけ');
  assert.ok(e.some((l) => l.text.includes('8つめの台')) && e.some((l) => l.text.includes('小さな光')), '8つめの 台が 光る・小さな 光が のぼって 来る');
  assert.ok(e.some((l) => l.art === C11D_EIGHT_ART.ped) && e.some((l) => l.art === C11D_EIGHT_ART.light), '絵');
  for (const l of e) for (const w of ['だれ', '名前', 'むかし', '星の子', 'ノクトの', '友', 'あいつ']) assert.ok(!l.text.includes(w), `八つめの 音の 場面に「${w}」を 書かない`);
  // 「おまえ、なのか」は T6 だけ
  assert.ok(!JSON.stringify([story, others]).includes('おまえ、なのか'), 'T6 の ほかで 言わない');
  // 「ひとりぼっち」は スピカ・アルゴル・女王・ながされた 星の こと だけ
  for (const s of says.filter((q) => String(q[2]).includes('ひとりぼっち'))) assert.ok(/ながされた星|スピカ|アルゴル|女王|わたし/.test(s[2]), `ひとりぼっち: ${s[2]}`);
  // トキネは エンディングで 声の ひとこと だけ（名前の 札は「？？？」）
  const voice = says.filter((s) => s[1] === '？？？');
  assert.ok(voice.length && voice.every((s) => s[2] === '千年後の空も、きっと、にぎやかね。'), 'すがたの ない 声は ひとこと');
  assert.ok(!JSON.stringify(story).includes('"tokine') && !JSON.stringify(story).includes('c8r_statue'), 'トキネ・像の すがたは 出さない（像は 光 だけ）');
  // 女王は 悪者に しない: たおれない・さいごは「……おかえりなさい」・きまりを 守る わけ（20-2）
  const all = JSON.stringify(story);
  for (const w of ['きまりは、だれにも、同じです', 'ついて来なさい', '消えかけた、長い夜', 'いちばん光る星を、まん中に', '全部、おぼえています', 'わすれない、ためです',
    'むすめだけを助けることは、できません', 'みんなを、助けて。', '手を、下ろした', 'つないだ光は、\\nこんなに、明るいのですね', '……おかえりなさい。',
    '名前のランプを、ともす日', '…うそつけ。', 'ほんとだよ。', 'さいごまで、かかった', '橋の、番人に、なる', '…にぎやかに、なるな。', C11D_END_TITLE, C11D_TITLE.act]) {
    assert.ok(all.includes(w), `台本に「${w}」`);
  }
  assert.equal(C11D_END_TITLE, '第3部　ほしのね ― 七つの星の音　完');
  assert.equal(C11D_TITLE.act, '第4幕　かがやきの女王と、八つめの音');
  const s0 = JSON.stringify(story[0]);
  assert.ok(s0.indexOf(C11D_TITLE.act) > s0.indexOf('ついて来なさい'), '題の 画面は 女王が 塔へ 行った あと');
  // 3人組は いつもの 口ぶり（キラジョ … わよ・ボヤッチ … まんねん・まっせ・ズラッカ … ぜ）・泣く
  const trio = (who) => says.filter((s) => s[1] === who).map((s) => s[2]);
  assert.ok(trio('ボヤッチ').length && trio('ボヤッチ').every((l) => /まんねん|まっせ|でっせ|〜！|…/.test(l)), 'ボヤッチの 口ぶり');
  assert.ok(trio('ズラッカ').length && trio('ズラッカ').every((l) => /ぜ/.test(l)), 'ズラッカの 口ぶり');
  assert.ok(/なみだ|ないて|ううう/.test(JSON.stringify(story)), '3人組が 泣く');
  // せりふは 短く（1行 32字 まで・2行 まで）。1つの 場面の せりふは 多すぎない
  for (const s of says) {
    const ls = String(s[2]).split('\n');
    assert.ok(ls.length <= 2, `2行 まで: ${s[2]}`);
    for (const l of ls) assert.ok([...l].length <= 32, `長い 行: ${l}`);
  }
  // 女王の 話（T5）は 分けて 見せる（ひとつの 台本の 中で 場面ごとに 20行 くらいまで … 女王の 話・E1・E2・E3・E4）
  const sayCount = (st) => st.filter((s) => s[0] === 'say').length;
  assert.ok(sayCount(story[0]) <= 30, `場面 0: ${sayCount(story[0])}`);
});

test('閉じた 幕（PART3_C11D_OPEN）: 第3幕 クリアの あとも 何も かわらない（目標・大とびら・月の都・丘・くぼ地）・幕を 開けた 形も ためす', () => {
  const a3 = flagsOf(...UPTO(C11D_ACT0));
  const has3 = (f) => !!a3[f];
  const closed = c11dScripts(c11dTitleSteps, false, SCRIPTS);
  assert.deepEqual(closed.c11d_start_event(ctx(a3)), []);
  if (!PART3_C11D_OPEN) {
    assert.equal(act3ClearObjective(), C11C_OBJ.act3, '閉じて いる 間は「第3部　第3章　第4幕へ（続きは…）」の まま');
    assert.ok(!CH11_PROGRESS.some(([, t]) => C11D_OBJ_ALL.includes(t)), '第4幕の 目標は まだ ない');
    assert.ok(CH11_PROGRESS.some(([, t]) => t === C11C_OBJ.act3));
    assert.ok(!(C11D_OBJ.start in CH11_OBJECTIVE_TARGETS));
    assert.deepEqual(BODY.start(ctx(a3)), [], '本体の 台本も 始まらない');
    const ace = JSON.stringify(BODY.ace(ctx(flagsOf(...UPTO(C11C.ace)))));
    assert.ok(ace.includes(C11C_OBJ.act3), '第3幕の さいごの 場面の 目標も 今の まま');
  }
  assert.equal(act3ClearObjective(true), C11D_OBJ.start);
  // 足した 物は、フラグが ないと 出ない（大とびらの 出入り口・月の都・丘・くぼ地）
  const door = MAPS.c11c_door;
  for (const p of DOOR_IN11D) assert.ok(!condOk(door.warps.find((w) => w.x === p.x && w.y === p.y).show, has3), '大とびらの 中へは まだ 入れない');
  const tr = door.triggers.find((t) => t.script === 'c11d_start_event');
  assert.ok(tr && condOk(tr.show, has3) && !condOk(tr.show, () => false));
  const F = MAPS.c11b_front, C = CITY_POS11D;
  assert.equal(effectiveTile(F, C.hook.x, C.hook.y, has3), T.C11B_LAMPHOOK);
  assert.equal(effectiveTile(F, C.gate.x, C.gate.y, has3), T.C11B_SCALEGATE);
  assert.equal(effectiveTile(F, C.bridgeEnd.x, C.bridgeEnd.y, has3), T.C11B_F_PAVE);
  assert.ok(!condOk(F.warps.find((w) => w.x === C.bridgeEnd.x && w.y === C.bridgeEnd.y).show, has3));
  for (const n of F.npcs.filter((q) => q.id.startsWith('c11d_'))) assert.ok(!condOk(n.show, has3), `${n.id} は 出ない`);
  const ow = MAPS.overworld, B = HILL_POS11D.bridge;
  assert.ok(condOk(ow.npcs.find((n) => n.id === 'c10d_bridge').show, has3), 'とちゅうで 止まった 橋は 今の まま');
  assert.ok(!condOk(ow.npcs.find((n) => n.id === 'c11d_bridge').show, has3));
  assert.ok(!condOk(ow.warps.find((w) => w.x === B.x && w.y === B.y).show, has3));
  const cr = MAPS.c9a_crater;
  assert.ok(condOk(cr.npcs.find((n) => n.id === 'c10d_ped8').show, has3) && !condOk(cr.npcs.find((n) => n.id === 'c11d_ped8').show, has3));
  // 前の 幕の 台本（月の都の 人）は クリアの 前は 今の まま
  assert.deepEqual(SCRIPTS.c11b_guard(ctx(a3)), BODY.guard(ctx(a3)));
  // 開けた 形: 大とびらの 中へ → 女王 → 題の 画面
  const open = openScripts();
  const st = JSON.stringify(open.c11d_start_event(ctx(a3)));
  assert.ok(st.includes(`"${C11D.start}"`) && st.includes(C11D_TITLE.act) && st.includes(`"${C11D_MAP.scale}"`));
  assert.deepEqual(open.c11d_start_event(ctx(flagsOf(...UPTO(C11C.ace)))), [], '第3幕の 間は 始まらない');
  assert.deepEqual(open.c11d_start_event(ctx({ ...a3, [C11D.start]: true })), [], '1回だけ');
  // しおり
  assert.equal(storyPlace({ flags: a3 }).label, '第3部 第3章 第3幕', '始まる 前は 第3幕 の まま');
  const sp = storyPlace({ flags: flagsOf(...UPTO(C11D.start)) });
  assert.equal(sp.label, '第3部 第3章 第4幕');
  assert.equal(sp.actTitle, 'かがやきの女王と、八つめの音');
  assert.ok(!sp.cleared);
  const end = storyPlace({ flags: flagsOf(...UPTO(C11D.act4)) });
  assert.ok(end.cleared && end.partClear && end.label === '第3部', `クリアの あとは 第3部 クリア（${end.label}）`);
});

test('目標: すすみぐあいから なおせる・行き先と ひとこと・第3幕 クリアの 目標の つなぎ', () => {
  const o = (...fl) => objective11d(hasOf([C11D_ACT0, ...fl]));
  assert.equal(o(), C11D_OBJ.start);
  assert.equal(o(C11D.start), C11D_OBJ.tower1);
  assert.equal(o(C11D.t1), C11D_OBJ.tower2);
  assert.equal(o(C11D.t2), C11D_OBJ.tower3);
  assert.equal(o(C11D.t3), C11D_OBJ.tower4);
  assert.equal(o(C11D.t4), C11D_OBJ.duo);
  assert.equal(o(C11D.duo), C11D_OBJ.throne);
  assert.equal(o(C11D.queen), C11D_OBJ.end);
  assert.equal(o(C11D.act4), C11D_OBJ.act4);
  assert.equal(C11D_OBJ.start, '王宮の大とびらの中へ。光のはかりの広間へ進もう');
  assert.equal(C11D_OBJ.act4, '第3部　クリア！　おめでとう！（星の橋で、空と地上を行き来できるよ）');
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH11D_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH11D_PROGRESS[i]; if (c.flags[k]) return t; } return null; };
  for (const f of [C11D_ACT0, C11D.start, C11D.t1, C11D.t2, C11D.t3, C11D.t4, C11D.duo, C11D.queen, C11D.act4]) {
    const fl = UPTO(f);
    assert.equal(prog(fl), objective11d(hasOf(fl)), f);
  }
  for (const t of C11D_OBJ_ALL) {
    assert.ok(CH11D_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH11D_OBJECTIVE_TARGETS[t]) {
      const m = MAPS[p.map];
      assert.ok(m && (!isBlocked(m, p.x, p.y, () => true) || m.warpAt.has(p.y * m.w + p.x)), `${t} ${p.map} ${p.x},${p.y}`);
    }
    const talk = CH11D_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
  // 第3幕の さいごの 場面は act3ClearObjective（閉じて いる 間は 今の 文）
  const ace = JSON.stringify(SCRIPTS.c11c_end_event(ctx(flagsOf(...UPTO(C11C.ace)))));
  assert.ok(ace.includes(act3ClearObjective()));
});

test('前の 章を こわさない: 足したのは フラグで 出る 物だけ（大とびらの 前・月の都・星見の丘・くぼ地）', () => {
  const add = (m) => [...m.triggers.filter((t) => /^c11d_/.test(t.script)), ...m.npcs.filter((n) => /^c11d_/.test(n.id)), ...m.warps.filter((w) => w.to.map.startsWith('c11d_') || (m.id === 'c11b_front' && w.to.map === 'overworld') || (m.id === 'overworld' && w.to.map === 'c11b_front'))];
  const door = MAPS.c11c_door;
  assert.deepEqual(add(door).map((q) => q.script || q.to.map), ['c11d_start_event', 'c11d_scale', 'c11d_scale']);
  for (const w of door.warps.filter((q) => q.to.map === C11D_MAP.scale)) assert.ok(w.show?.all?.includes(C11D.start));
  const F = MAPS.c11b_front;
  assert.deepEqual(add(F).map((q) => q.id || q.to.map).sort(), ['c11d_ace', 'c11d_mirror', 'c11d_oboro', 'c11d_queen', 'overworld']);
  for (const q of add(F)) assert.ok(q.show?.all?.includes(C11D.act4), `${q.id || q.to.map} は クリアの あと`);
  const ow = MAPS.overworld;
  assert.deepEqual(add(ow).map((q) => q.id || q.to.map), ['c11d_bridge', 'c11b_front']);
  for (const q of add(ow)) assert.ok(q.show?.all?.some((f) => f === C11D.bridge || f === C11D.act4));
  assert.deepEqual(add(MAPS.c9a_crater).map((q) => q.id), ['c11d_ped8']);
  // 月の都の タイルは かわらない（とびらの 形で だけ かわる）・前の 幕の マップに この 幕の タイルは ない
  for (const id of [...Object.keys(MAPS)].filter((k) => /^(c11[abc]_|c11_sea)/.test(k))) {
    const m = MAPS[id];
    for (let i = 0; i < m.tiles.length; i++) assert.ok(m.tiles[i] < C11D_TILE_FIRST || m.tiles[i] > C11D_TILE_LAST, `${id} の タイルは 前の まま`);
  }
  // 星の橋の はし・月の都から 来た 所は 立てる
  const has = hasOf([...UPTO(C11D.act4)]);
  assert.ok(!isBlocked(F, CITY_POS11D.bridgeEnd.x, CITY_POS11D.bridgeEnd.y, has) && !isBlocked(F, CITY_POS11D.bridgeBack.x, CITY_POS11D.bridgeBack.y, has));
  assert.ok(!isBlocked(ow, HILL_POS11D.back.x, HILL_POS11D.back.y, has) && !isBlocked(ow, HILL_POS11D.bridge.x, HILL_POS11D.bridge.y, has));
  // クリアの あとの 人は 道を ふさがない（広場の 町の 中・ほかの 人と かさならない）
  const others = F.npcs.filter((n) => !n.id.startsWith('c11d_'));
  for (const n of F.npcs.filter((q) => q.id.startsWith('c11d_'))) {
    assert.ok(!others.some((o) => o.x === n.x && o.y === n.y), `${n.id} は ほかの 人と かさならない`);
    assert.ok(!isBlocked(F, n.x, n.y, () => false), `${n.id} は ゆかの 上`);
  }
});

test('どの 階も とける・行き止まりが ない（道さがし）・前の 幕の しくみの まま', () => {
  // 1階: ひとふで書き（第1幕の きまり。とける 入口の 星が ある・まちがった 星からも 「やり直す」で もどれる）
  const con = M('tower1').c11aCons[0];
  const sol = solve11a(con, con.entries);
  assert.ok(sol, '星座は とける');
  assert.ok(goodStarts11a(con, con.entries).length >= 1 && goodStarts11a(con, con.entries).length < con.entries.length, 'はじめる 星を えらぶ 遊び');
  assert.equal(con.lines.length, 8);
  console.log(`  1階: ${sol.start} から ${sol.path.map((m) => m.dir).join(' ')}`);
  // 2階: おもてと うら（第2幕の きまり）。どの 状態からも 出口へ
  const S = TOWER2_SECTIONS11D[0];
  const p2 = solve11b(S, S.start, () => false);
  assert.ok(p2, '2階は とける');
  const acts2 = p2.filter((p) => p.act).map((p) => p.act.kind);
  assert.deepEqual(acts2, ['floor', 'door', 'door'], '光の ゆか → 戸 → 戸');
  console.log(`  2階: ${p2.length}歩 ${p2.filter((p) => p.act).map((p) => `${p.act.kind}@${p.act.x},${p.act.y}`).join(' → ')}`);
  const R = reachable11b(S, () => false);
  for (const st of R.states) {
    const has = (f) => { const i = R.flags.indexOf(f); return i >= 0 ? !!(st[3] & (1 << i)) : false; };
    assert.ok(solve11b(S, { side: st[0], x: st[1], y: st[2] }, has), `2階: ${st} から 出口へ`);
  }
  assert.deepEqual(R.flags, C11D_MARKS, '2階の しるしは 1つ');
  // 3階: かげの 台（第3幕の きまり）
  const m3 = M('tower3');
  const p3 = solve11c(m3, m3.c11c.arrive, -1);
  assert.ok(p3, '3階は とける');
  assert.deepEqual(p3.filter((p) => p.act).map((p) => p.act.kind), ['call', 'call', 'call']);
  console.log(`  3階: ${p3.length}歩 ${p3.filter((p) => p.act).map((p) => `${p.act.kind}@${p.st[0]},${p.st[1]}`).join(' → ')}`);
  for (const [x, y, a] of reachable11c(m3)) assert.ok(solve11c(m3, { x, y }, a), `3階: ${x},${y} アルゴル ${a} から 出口へ`);
  assert.equal(m3.c11c.cards.length, 0); assert.equal(m3.c11c.bridges.length, 0);
  // 4階: 7つの 音（ならびは くぼ地と 同じ。じゅんは 歌の 7ふし ＝ 7つの ちがう 台）
  assert.deepEqual([...C11D_SONG_ORDER].sort(), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(C11D_PADS.map((p) => p.c), ['赤', '金', '黄', '緑', '青', '白', 'むらさき']);
  assert.deepEqual(C11D_SONG_ORDER.map((i) => C11D_PADS[i].note), ['ミ', 'レ', 'ファ', 'ソ', 'ラ', 'シ', 'ド']);
  for (const [i, P] of TOWER4_POS11D.pads.entries()) assert.equal(padAt11d(M('tower4'), P.x, P.y), i);
  // 魔物: 1〜3階だけ（しかけの 上と そばでは 出ない）。4階・玉座の 間・はかりの 広間は 出ない
  const zone = (m, x, y) => m.zoneAt(x, y);
  for (const [x, y] of con.stars) assert.ok(zone(M('tower1'), x, y).startsWith('safe'), '星の 上は 出ない');
  for (const P of m3.c11c.peds) assert.ok(zone(m3, P.x, P.y).startsWith('safe'), '台の 上は 出ない');
  for (const k of ['tower4', 'throne', 'scale']) for (let y = 0; y < M(k).h; y++) for (let x = 0; x < M(k).w; x++) assert.ok(zone(M(k), x, y).startsWith('safe'), `${k} は 出ない`);
});

test('かど: 1マス はばの 道の 曲がりかどが ない（しかけが 開いても とじても）', () => {
  const left = [];
  for (const id of C11D_MAP_IDS) {
    const m = MAPS[id];
    for (const has of [() => true, () => false]) {
      const ok = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !isBlocked(m, x, y, has);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (!ok(x, y)) continue;
        const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => ok(x + dx, y + dy));
        if (n.length !== 2 || n[0][0] + n[1][0] === 0) continue;
        if (!ok(x + n[0][0] + n[1][0], y + n[0][1] + n[1][1])) left.push(`${id} ${x},${y}`);
      }
    }
  }
  assert.deepEqual([...new Set(left)], [], '1マス はばの かどは ない');
});

test('サーバー: 音の 間（まちがえると はじめから・3回で じゅんが 光る・歌の じゅんで とびらが 開く）・助け（2階・3階）', async () => {
  const world = fixedWorld(11401);
  const { bot, c } = await act0Player(world, 'ソラ', C11D.t3);
  const m4 = M('tower4');
  await place(bot, C11D_MAP.tower4, TOWER4_POS11D.arrive.x, TOWER4_POS11D.arrive.y);
  // 1つめは 黄（ミ）。赤を ふむと「はじめの 音では ない」
  await stepPad(bot, 0);
  assert.equal(padState11d(world, bot.s).n, 0);
  assert.ok(toasts(bot).some((t) => t.includes('はじめの音では、ないみたい')));
  await stepPad(bot, C11D_SONG_ORDER[0]);
  await stepPad(bot, C11D_SONG_ORDER[1]);
  assert.equal(padState11d(world, bot.s).n, 2, '2つ 鳴らした');
  await tickN(world, 2);
  assert.equal(lastSnap(bot)?.n, 2);
  assert.equal(lastSnap(bot)?.nx, C11D_SONG_ORDER[2]);
  // まちがえる → はじめから（ばつ なし）
  await stepPad(bot, C11D_SONG_ORDER[5]);
  assert.equal(padState11d(world, bot.s).n, 0);
  assert.ok(toasts(bot).some((t) => t.includes('はじめから')));
  assert.ok(!lastSnap(bot)?.h);
  await stepPad(bot, 6);
  await tickN(world, 2);
  assert.equal(padState11d(world, bot.s).miss, C11D_PAD_HELP);
  assert.equal(lastSnap(bot)?.h, 1, '3回 まちがえると じゅんが 光る');
  assert.ok(toasts(bot).some((t) => t.includes('口ずさんでいる')));
  assert.ok(isBlocked(m4, 10, 7, world.hasFlagFn(bot.s)), 'とびらは まだ');
  // 歌の じゅんに 7つ → とびらが 開く（c11d_t4）
  for (const i of C11D_SONG_ORDER) await stepPad(bot, i);
  assert.ok(c.flags[C11D.t4], '4階を 通った');
  assert.ok(said(bot, '7つの音が、ひとつの、歌に、なった'));
  assert.ok(!isBlocked(m4, 10, 7, world.hasFlagFn(bot.s)) && effectiveTile(m4, 11, 7, world.hasFlagFn(bot.s)) === T.C11D_SOUNDDOOR_OPEN, 'とびらが 開いた');
  assert.equal(c.objective, C11D_OBJ.duo);
  await tickN(world, 2);
  assert.equal(lastSnap(bot)?.d, 1);
  // いずみ・かべの 歌の 絵
  await place(bot, C11D_MAP.tower4, TOWER4_POS11D.spring.x - 1, TOWER4_POS11D.spring.y);
  c.hp = 1;
  await examine(bot, TOWER4_POS11D.spring.x, TOWER4_POS11D.spring.y);
  assert.ok(said(bot, 'いずみの水'));
  await place(bot, C11D_MAP.tower4, 5, 8);
  await examine(bot, 5, 7);
  assert.ok(said(bot, '黄→赤→緑→青→白→むらさき→金'), '歌の 絵の じゅん');
  // 2階の 助け（スピカの 声）: 同じ 区切りで 長く 歩くと 次の 所が 光る
  delete c.flags[C11D.t2];
  await place(bot, C11D_MAP.tower2, TOWER2_POS11D.arrive.x, TOWER2_POS11D.arrive.y);
  const A2 = TOWER2_POS11D.arrive;
  for (let i = 0; i < C11D_HELP_STEPS + 2; i++) await stepOn(bot, A2.x + (i % 2), A2.y);
  await tickN(world, 2);
  assert.ok(lastSnap(bot, 'c11b')?.h, '2階の 助け');
  assert.ok(toasts(bot).some((t) => t.includes('スピカ「…こっち。')), 'スピカの 声（ホタルでは ない）');
  // 3階の 助け（前の 幕と 同じ 3人組の 声）・通った 階では 出ない
  const A3 = TOWER3_POS11D.arrive;
  delete c.flags[C11D.t3];
  await place(bot, C11D_MAP.tower3, A3.x, A3.y);
  for (let i = 0; i < C11D_HELP_STEPS + 2; i++) await stepOn(bot, A3.x + (i % 2), A3.y);
  await tickN(world, 2);
  assert.ok(lastSnap(bot, 'c11c')?.h, '3階の 助け');
  bot.s.c11cHelp = null;
  c.flags[C11D.t3] = true;
  for (let i = 0; i < C11D_HELP_STEPS + 2; i++) await stepOn(bot, A3.x + (i % 2), A3.y);
  await tickN(world, 2);
  assert.ok(!lastSnap(bot, 'c11c')?.h, '3階を 通ったら 出ない');
});

test('家族 2人: 音の 間は 分かれて ふんでも よい・1階の 星座は パーティーで 1つ（2人とも 星に 乗って いても できる・とびらは 2人に 開く）・2階の しるしは パーティーで 同じ', async () => {
  const world = fixedWorld(11402);
  const { A, B, oA, oB } = await party2(world, C11D.t3);
  await place(A.bot, C11D_MAP.tower4, 4, 12, 'up', oA);
  await place(B.bot, C11D_MAP.tower4, 18, 12, 'up', oB);
  for (const [n, i] of C11D_SONG_ORDER.entries()) await stepPad(n % 2 ? B.bot : A.bot, i, n % 2 ? oB : oA);
  assert.ok(A.c.flags[C11D.t4], '2人で ふんで 開いた（リーダーの フラグ）');
  assert.ok(toasts(B.bot).some((t) => t.includes('ソラが、♪')), 'もう 1人に 知らせる');
  // 1階: 2人とも 星に 乗る。A が 線を 引く（パーティーで 1つの 星座。B が 乗って いても 「行ける 線が ない」に ならない）
  delete A.c.flags[C11D.t1];
  const con = M('tower1').c11aCons[0];
  const sol = solve11a(con, con.entries);
  const [sx, sy] = con.stars[sol.start];
  for (const [bot, o] of [[A.bot, oA], [B.bot, oB]]) { await place(bot, C11D_MAP.tower1, sx, sy - 1, 'down', o); await stepOn(bot, sx, sy, o); }
  for (const [k, m] of sol.path.entries()) {
    const [bot, o] = [A.bot, oA];
    const [dx, dy] = DIRV[m.dir];
    await examine(bot, Math.floor(bot.s.x) + dx, Math.floor(bot.s.y) + dy, o);
    if (k === 0) await tickN(world, 2);
  }
  assert.ok(A.c.flags[C11D.t1], '星座が できた');
  assert.ok(!isBlocked(M('tower1'), TOWER1_POS11D.up.x, TOWER1_POS11D.up.y, world.hasFlagFn(B.bot.s)), 'とびらは B にも 開いた');
  // 2階: A が 光の ゆかを ふむと、B の うらの とびらも 開く
  delete A.c.flags.c11d_m1;
  const L = { x: 10, y: 11 };
  await place(B.bot, C11D_MAP.tower2b, 12, 11, 'left', oB);
  assert.ok(isBlocked(M('tower2b'), L.x, L.y, world.hasFlagFn(B.bot.s)));
  await place(A.bot, C11D_MAP.tower2, 10, 12, 'up', oA);
  await stepOn(A.bot, L.x, L.y, oA);
  assert.ok(!isBlocked(M('tower2b'), L.x, L.y, world.hasFlagFn(B.bot.s)), 'うらの とびらが 開いた');
  assert.ok(toasts(B.bot).some((t) => t.includes('光のゆかを、ふんだ')));
});

test('サーバー: 回線が 切れて すぐ もどる → 星座の 上なら 地面・かげの 間は 入口・セーブに 足すのは 線と 2階の しるし だけ', async () => {
  const world = fixedWorld(11403, { offline: false, checkPassword: () => true });
  const A = await act0Player(world, 'ソラ', C11D.start);
  const con = M('tower1').c11aCons[0];
  const [sx, sy] = con.stars[1];
  await place(A.bot, C11D_MAP.tower1, sx, sy - 1);
  await stepOn(A.bot, sx, sy);
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, C11D_MAP.tower1);
  assert.deepEqual(tile(A2.s), [con.land.x, con.land.y], '星座の 地面');
  // かげの 間
  A.c.flags[C11D.t1] = true; A.c.flags[C11D.t2] = true;
  await place(A2, C11D_MAP.tower3, 12, 13);
  await examine(A2, 12, 12);
  assert.equal(algolPed11c(world, A2.s), M('tower3').c11c.peds.findIndex((P) => P.x === 12 && P.y === 13));
  await stepOn(A2, 11, 13);
  world.disconnect(A2.s, A2.conn);
  await tickN(world, 5);
  const A3 = new Bot(world, 'ソラ');
  await A3.login();
  A3.send({ t: 'play', id: A.c.id });
  await A3.settle();
  await tickN(world, 2);
  assert.equal(A3.s.map, C11D_MAP.tower3);
  assert.deepEqual(tile(A3.s), [TOWER3_POS11D.arrive.x, TOWER3_POS11D.arrive.y], 'かげの 間の 入口');
  const saved = JSON.stringify(A.c);
  assert.ok(!/@cf|@lb|@cs|c11dSt|c11cSt|__c11d/.test(saved), 'しかけの 今は セーブしない');
  assert.ok(Object.keys(A.c.flags).filter((f) => f.startsWith('c11d_')).every((f) => C11D_LINE.includes(f) || C11D_MARKS.includes(f)), 'セーブに 足すのは 線と 2階の しるし だけ');
});

test('クリアの あと: 星見の丘 ⇔ 月の都（星の橋）・はかりの門・アルゴルの ランプ・女王 たちと 話せる・8つめの 台が 光る・人の ことば', async () => {
  const world = fixedWorld(11404);
  const { bot, c } = await act0Player(world, 'ソラ', C11D.act4);
  c.objective = C11D_OBJ.act4;
  const has = world.hasFlagFn(bot.s);
  const F = MAPS.c11b_front, C = CITY_POS11D;
  assert.equal(effectiveTile(F, C.hook.x, C.hook.y, has), T.C11D_HOOK_ON, 'アルゴルの ランプ');
  assert.equal(effectiveTile(F, C.gate.x, C.gate.y, has), T.C11D_SCALEGATE_OPEN, 'はかりの門が 開いた');
  assert.equal(effectiveTile(MAPS.overworld, HILL_POS11D.bridge.x, HILL_POS11D.bridge.y, has), effectiveTile(MAPS.overworld, HILL_POS11D.bridge.x, HILL_POS11D.bridge.y, () => false));
  // 星見の丘の 星の橋 → 月の都 → 星の橋の はし → 星見の丘
  await place(bot, 'overworld', HILL_POS11D.bridge.x - 1, HILL_POS11D.bridge.y);
  await stepOn(bot, HILL_POS11D.bridge.x, HILL_POS11D.bridge.y);
  assert.equal(bot.s.map, 'c11b_front');
  assert.deepEqual(tile(bot.s), [C.bridgeBack.x, C.bridgeBack.y]);
  await stepOn(bot, C.bridgeEnd.x, C.bridgeEnd.y);
  assert.equal(bot.s.map, 'overworld');
  assert.deepEqual(tile(bot.s), [HILL_POS11D.back.x, HILL_POS11D.back.y]);
  // 女王 たち（短い ひとこと）・門番・都の 人
  for (const id of ['c11d_queen', 'c11d_mirror', 'c11d_oboro', 'c11d_ace']) {
    const n0 = bot.msgs.length;
    await talkTo(bot, 'c11b_front', id);
    assert.ok(bot.msgs.slice(n0).some((m) => m.t === 'script'), `${id} と 話せる`);
  }
  await talkTo(bot, 'c11b_front', 'c11b_guard');
  assert.ok(said(bot, 'どなたでも、どうぞ'));
  await talkTo(bot, 'c11b_front', 'c11b_folkF2');
  assert.ok(said(bot, '星の橋で、行ってみたい'), 'おもての 人の ことばが かわる（つめたく ない）');
  // くぼ地の 8つめの 台
  await talkTo(bot, 'c9a_crater', 'c11d_ped8');
  assert.ok(said(bot, 'やさしい光'));
  assert.ok(!condOk(MAPS.c9a_crater.npcs.find((n) => n.id === 'c10d_ped8').show, has), '前の 台の 絵は 光る 台に かわる');
  // 目標・しおり
  assert.equal(c.objective, C11D_OBJ.act4);
  assert.equal(storyPlace({ flags: c.flags }).label, '第3部');
  // スピカは 今まで どおり ゲスト（台本は ゲストを 外さない）
  assert.ok(!JSON.stringify(openScripts().c11d_end_event(ctx(flagsOf(...UPTO(C11D.queen))))).includes('"guest",'), 'スピカは はなれない');
});

test('通し（ひとり）: 大とびら → はかりの 広間（女王）→ 塔 1〜4階 → 中ボス → 玉座の 間・女王 → 名前の ランプ → 星の橋 → c11_act4（第3部 完）', async () => {
  const world = fixedWorld(11405);
  const { bot, c } = await act0Player(world, 'ソラ', C11D_ACT0);
  const fought = [];
  const o = { fought };
  assert.equal(c.objective, C11D_OBJ.start);
  // 0 大とびらの 前 → はかりの 広間（女王・題の 画面）
  await place(bot, C11D_DOOR_MAP, 9, 6, 'up', o);
  await stepOn(bot, 9, 5, o);
  await stepOn(bot, 9, 4, o);
  assert.ok(c.flags[C11D.start] && said(bot, C11D_TITLE.act) && said(bot, 'ついて来なさい'));
  assert.equal(bot.s.map, C11D_MAP.scale);
  assert.equal(c.objective, C11D_OBJ.tower1);
  assert.equal(storyPlace({ flags: c.flags }).label, '第3部 第3章 第4幕');
  // 塔 1階（星座）
  await walkTo(bot, SCALE_POS11D.up.x, SCALE_POS11D.up.y, o);
  assert.equal(bot.s.map, C11D_MAP.tower1);
  await stepOn(bot, TOWER1_POS11D.arrive.x, TOWER1_POS11D.arrive.y - 1, o);
  assert.ok(said(bot, '星座の間'));
  await runCon(bot, o);
  await play(bot, o);
  assert.ok(c.flags[C11D.t1] && said(bot, 'ほしのてんびん'), '星座が できた');
  assert.equal(c.objective, C11D_OBJ.tower2);
  await walkTo(bot, TOWER1_POS11D.up.x, TOWER1_POS11D.up.y, o);
  assert.equal(bot.s.map, C11D_MAP.tower2);
  // 2階（おもてと うら）
  await stepOn(bot, TOWER2_POS11D.arrive.x, TOWER2_POS11D.arrive.y - 1, o);
  assert.ok(said(bot, '月かげの間'));
  await runMoon(bot, o);
  assert.equal(bot.s.map, C11D_MAP.tower3);
  // 3階（かげの 台）
  await stepOn(bot, TOWER3_POS11D.arrive.x, TOWER3_POS11D.arrive.y - 1, o);
  assert.ok(c.flags[C11D.t2] && said(bot, 'ぼくの、出番だな'));
  assert.equal(c.objective, C11D_OBJ.tower3);
  await runShadow(bot, o);
  assert.equal(bot.s.map, C11D_MAP.tower4);
  // 4階（音の 間）
  await stepOn(bot, TOWER4_POS11D.arrive.x, TOWER4_POS11D.arrive.y - 1, o);
  assert.ok(c.flags[C11D.t3] && said(bot, '音の間'));
  assert.ok(!isBlocked(MAPS[C11D_MAP.scale], SCALE_POS11D.lift.x, SCALE_POS11D.lift.y, world.hasFlagFn(bot.s)), '広間の のぼり台が 開いた');
  for (const i of C11D_SONG_ORDER) await stepPad(bot, i, o);
  assert.ok(c.flags[C11D.t4]);
  // 中ボス
  await walkTo(bot, 11, 6, o);
  await stepOn(bot, 11, 5, o);
  assert.ok(fought.includes(C11D_BATTLE.duo) && c.flags[C11D.duo]);
  assert.equal(c.objective, C11D_OBJ.throne);
  // 玉座の 間 → 女王 → E1〜E4
  await walkTo(bot, TOWER4_POS11D.up.x, TOWER4_POS11D.up.y, o);
  assert.equal(bot.s.map, C11D_MAP.throne);
  await walkTo(bot, 11, 11, o);
  assert.ok(fought.includes(C11D_BATTLE.queen), '女王と 戦った');
  for (const f of [C11D.queen, C11D.lamp, C11D.bridge, C11D.act4]) assert.ok(c.flags[f], f);
  for (const w of ['……おかえりなさい。', '名前のランプを、ともす日', 'さいごまで、かかった', '千年後の空も、きっと、にぎやかね。', '橋の、番人に、なる', C11D_END_TITLE]) assert.ok(said(bot, w), w);
  assert.equal(c.objective, C11D_OBJ.act4);
  assert.equal(bot.s.map, 'overworld', '星見の丘で おわる');
  assert.ok(storyPlace({ flags: c.flags }).partClear);
  // 宝箱 8こ は 開けられる 所に ある
  for (const id of C11D_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(MAPS[id].chestAt.has(ch.y * MAPS[id].w + ch.x));
  console.log(`  通し: ${fought.join(' → ')}`);
});
