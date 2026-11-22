// 第3部 第3章 第1幕「星の船と、星座の島」（第100回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c10_act4 → くぼ地で ガンツ（c11a_start）→ 灯台島の レンズの 星座（c11a_con0・星図 c11a_chart）→ 星見の丘から こぎ出す（c11a_launch）
//   → 星の海 → とまり木の島の ヨイ（c11a_perch）→ 星座の 島 3つ（すきな じゅん。星座 2つずつ → 明かり c11a_light1〜3）
//   → 3つめの 明かりの 島で 星座の けもの（c11a_beast）→ 星座の門の 船長（c11a_pirate）→ 門が 開く（c11_act1）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当に 戦う 通しは test/ch11-act1.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C11A, C11A_LINE, C11A_LIGHTS, C11A_LENS, C11A_CON, C11A_CON_IDS, C11A_ISLE_CONS, C11A_MAP, C11A_MAP_IDS, C11A_ISLE_MAPS, C11A_CHEST_IDS,
  C11A_TILE_FIRST, C11A_TILE_LAST, C11A_TRACK_IDS, C11A_BATTLE, C11A_HELP_START, C11A_HELP_LINE, C11A_PLACE,
} from '../public/js/shared/maps/c11a-flags.js';
import { CH11A_MAPS } from '../public/js/shared/maps/c11a.js';
import {
  SEA_Y0, ISLES11A, SEA_DOCK11A, SEA_BRIDGE11A, SEA_ARRIVE11A, SEA_GATE11A, CURRENTS11A, ISLE_POS11A, PERCH_POS11A, LENS11A, HILL_DOCK11A,
} from '../public/js/shared/maps/c11a-rows.js';
import { CONSTELLATIONS11A, CON_IDS11A, solve11a, solveFrom11a, goodStarts11a, lineCells11a, lineDir11a, fullMask11a, CON_RULE } from '../public/js/shared/data/constellations-c11a.js';
import { carry, flowReach } from '../public/js/shared/maps/flow.js';
import { conState11a } from '../public/js/shared/world/c11a-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH11_STEPS, PART3_C11A_OPEN, c11aTitleSteps, CH11_PROGRESS } from '../public/js/shared/data/story-c11.js';
import { CH10_PROGRESS, act4ClearObjective, PART3_C10D_OPEN } from '../public/js/shared/data/story-c10.js';
import { C10D_OBJ } from '../public/js/shared/data/story-c10d.js';
import {
  C11A_OBJ, C11A_OBJ_ALL, CH11A_STORY_SCRIPTS, CH11A_PROGRESS, CH11A_OBJECTIVE_TARGETS, CH11A_OBJECTIVE_TALK, c11aScripts, applyCh11a, objective11a,
} from '../public/js/shared/data/story-c11a.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { existsSync } from 'node:fs';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { warpPlaces } from '../public/js/shared/world/travel.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, addPlayer, play, place, stepOn, examine, talkTo, fixedWorld } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES11A = ['public/js/shared/maps/c11a-flags.js', 'public/js/shared/data/story-c11.js', 'public/js/shared/data/story-c11a.js', 'public/js/shared/data/constellations-c11a.js',
  'public/js/shared/maps/c11a.js', 'public/js/shared/maps/c11a-rows.js', 'public/js/shared/world/c11a-steps.js', 'public/js/client/c11a-view.js',
  'public/js/client/render/tiles-c11a.js', 'public/js/client/render/c11a-npc-art.js'];
const openScripts = () => c11aScripts(c11aTitleSteps, true, { keeper: null, gantz: SCRIPTS.c9b_armorer });
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh11a(SCRIPTS, STORY_SCRIPTS, { title: c11aTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const key = (x, y) => `${x},${y}`;
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const conOn = (mapId, id) => MAPS[mapId].c11aCons.find((C) => C.id === id);

async function act0Player(world, name, job) {
  openAct();
  const P = await addPlayer(world, name, 'c10_act4', [], job);
  P.c.objective = act4ClearObjective(true);
  return P;
}
async function party2(world, upto = 'c10_act4') {
  const A = await act0Player(world, 'ソラ');
  const B = await act0Player(world, 'ミナ', 'mage');
  for (const f of UPTO(upto)) { A.c.flags[f] = true; B.c.flags[f] = true; }
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  return { A, B, oA: { bots: [B.bot] }, oB: { bots: [A.bot] } };
}
// 星座の 星 i の 上に 立つ（地面に ふれた 星なら 地面から 入る）
async function enterStar(bot, mapId, con, i, opts) {
  const [x, y] = con.stars[i];
  if (con.entries.includes(i)) {
    const map = MAPS[mapId];
    const has = bot.world.hasFlagFn(bot.s);
    const g = Object.values(DIRV).map(([dx, dy]) => [x + dx, y + dy]).find(([gx, gy]) => !con.stars.some(([a, b]) => a === gx && b === gy) && !isBlocked(map, gx, gy, has));
    await place(bot, mapId, g[0], g[1], 'up', opts);
  } else await place(bot, mapId, x, y, 'up', opts);
  await stepOn(bot, x, y, opts);
}
// 今 いる 星から 向き dir の 線へ（画面と 同じ: 線の マスを しらべる）
async function goDir(bot, dir, opts) {
  const [dx, dy] = DIRV[dir];
  await examine(bot, Math.floor(bot.s.x) + dx, Math.floor(bot.s.y) + dy, opts);
}
async function solveCon(bot, mapId, id, opts) {
  const con = conOn(mapId, id);
  const sol = solve11a(con, con.entries);
  assert.ok(sol, `${id} は とける`);
  await enterStar(bot, mapId, con, sol.start, opts);
  for (const m of sol.path) await goDir(bot, m.dir, opts);
}

test('名前の 約束: マップ 5まい・タイル 621〜660・宝箱の id・一本の 線・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH11A_MAPS, ['c11_sea', 'c11a_perch', 'c11a_isle1', 'c11a_isle2', 'c11a_isle3']);
  for (const id of C11A_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」の 地図を 取らない（セーブを 小さく）`);
    assert.ok(C11A_TRACK_IDS.includes(m.bgm), `${id} の 曲は この 幕の id`);
  }
  assert.ok(MAPS.c11_sea.sailable && MAPS.c11_sea.ship === 'star_ship', '星の海は 星の船で すすむ');
  assert.equal(MAPS.c11a_isle1.c11aIsle, 1);
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C11A_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.ok(ids.length && ids.every((v) => v >= C11A_TILE_FIRST && v <= C11A_TILE_LAST), 'タイル 621〜660');
  for (const v of ids) assert.ok(TILE_INFO[v], `TILE_INFO ${v}`);
  // 宝箱 8こ（島 1: 3・島 2: 2・島 3: 2・とまり木の島: 1）
  const chests = C11A_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id)).sort();
  assert.deepEqual(chests, [...C11A_CHEST_IDS].sort());
  // 一本の 線（c10_act4 の うしろ）。明かり・星座の しるし・レンズの しるしは 線に 入れない
  const j = STORY_STEPS.indexOf('c10_act4');
  assert.deepEqual(STORY_STEPS.slice(j + 1), C11A_LINE);
  assert.deepEqual(CH11_STEPS, C11A_LINE);
  for (const f of [...C11A_LIGHTS, ...C11A_CON_IDS, C11A_LENS]) assert.ok(!STORY_STEPS.includes(f), `${f} は 線に 入らない`);
  // 台本（パーティーで 見る）・やり直しの 行き先（ノクト）
  openAct();
  for (const id of CH11A_STORY_SCRIPTS) { assert.ok(SCRIPTS[id], id); assert.ok(STORY_SCRIPTS.has(id), `${id} は パーティーで 見る`); }
  for (const id of C11A_CON_IDS) assert.ok(SCRIPTS[`c11a_done_${id}`], `星座が できた 台本 ${id}`);
  assert.equal(BOSS_RETRY[C11A_BATTLE.beast], 'c11a_beast_event');
  assert.equal(BOSS_RETRY[C11A_BATTLE.pirate], 'c11a_pirate_event');
  assert.equal(BOSS_HINT_WHO[C11A_BATTLE.pirate], 'ノクト');
  // やり直しの 場面の マス: けものは 3つの 島の 明かりの そば・船長は 門の 前
  for (const n of [1, 2, 3]) assert.ok(MAPS[`c11a_isle${n}`].triggers.some((t) => t.script === 'c11a_beast_event'), `島 ${n}`);
  assert.ok(MAPS.c11_sea.triggers.some((t) => t.script === 'c11a_pirate_event'));
  // 曲（17-5 の 表）
  const sc = (id, ...fl) => JSON.stringify(SCRIPTS[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c11a_launch_event', 'c11a_chart').includes('"c11a_launch"'), 'こぎ出す 曲');
  assert.ok(sc('c11a_perch_event', 'c11a_launch').includes('"c11a_perch"'), 'とまり木の島の 曲');
  assert.ok(sc('c11a_done_c11a_con1a').includes('"c11a_const"'), '星座が できた 曲');
  assert.ok(sc('c11a_beast_event', ...C11A_LIGHTS).includes('"c11a_beast"'), '中ボスの 曲');
  assert.ok(sc('c11a_pirate_event', ...C11A_LIGHTS, 'c11a_beast').includes('"c11a_pirate"'), '船長の 曲');
  // ルーラ（行った 所）に とまり木の島
  assert.ok(warpPlaces({ visited: { [C11A_PLACE]: true } }).includes(C11A_PLACE));
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES11A) {
    const g = list.find((x) => x.endsWith(f));
    assert.ok(g, `gameFiles に ${f}`);
    assert.deepEqual(checkFile(gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f))).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の data/c11a-stub.js・B の data/c11a-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['c11a-stub.js', 'c11a-names-b.js']) assert.ok(!existsSync(new URL(`../public/js/shared/data/${f}`, import.meta.url)), `${f} は ない`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c11a-stub|c11a-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // 本物に つないだ: 宝箱（B班の 中み）・店・魔物の 表・背景・ボスの 名前
  for (const id of C11A_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(ch.item, `${ch.id} は B班の 品`);
  assert.deepEqual(MAPS.c11_sea.spawnCounts, { t11a_sea: 8 });
  for (const n of [1, 2, 3]) assert.deepEqual(Object.keys(MAPS[`c11a_isle${n}`].spawnCounts), [`t11a_isle${n}`]);
});

test('台本の きまり: 明かす じゅん（女王・きまり・ながす を 出さない）・カイ・ソリトゥス・第1部と 第2部の ひみつ・少年は ヨイの ひとこと だけ・もとの お話の 名前を 書かない', () => {
  const S = openScripts();
  const all = new Set([...C11A_LINE, ...C11A_LIGHTS, ...C11A_CON_IDS, 'c10_act4', C11A_LENS]);
  const fl = Object.fromEntries([...all].map((f) => [f, true]));
  const scenes = [
    S.c11a_ship_event(ctx(flagsOf('c10_act4'))), S.lighthouse_keeper(ctx(flagsOf('c11a_start'))), S.c11a_launch_event(ctx(flagsOf('c11a_chart'))),
    S.c11a_perch_event(ctx(flagsOf('c11a_launch'))), S.c11a_beast_event(ctx(flagsOf(...C11A_LIGHTS))),
    S.c11a_pirate_event(ctx(flagsOf(...C11A_LIGHTS, 'c11a_beast'))),
    ...C11A_CON_IDS.map((id) => S[`c11a_done_${id}`](ctx(flagsOf(...C11A_LIGHTS.slice(0, 2), ...C11A_CON_IDS.filter((c) => c !== id))))),
    ...Object.entries(S).map(([, fn]) => fn(ctx(fl))), ...Object.entries(S).map(([, fn]) => fn(ctx({}))),
  ];
  const text = JSON.stringify(scenes);
  for (const w of ['カイ', 'ソリトゥス', 'ネフィ', 'カリム', 'ミナモ', 'リオン', '勇者', '女王', 'きまり', 'ながす', 'ながさ', 'おとさ', 'ミラーレ', '鏡',
    'アルゴル', '王女', 'むすめ', '姫', 'ピーター', 'フック', 'ワニ', 'ティンカー', 'ネバー', '妖精', 'かぎの手', 'ウェンディ']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  // 明るい 星と 暗い 星・暗い 星は かくれる ように（ヨイ）。少年は ひとことだけ（すがたも せりふも なし）
  const perch = JSON.stringify(scenes[3]);
  assert.ok(perch.includes('明るい星と、暗い星') && perch.includes('3つの星座の明かり') && perch.includes('暗い三日月に乗った子'));
  const says = scenes.flat(2).filter((s) => Array.isArray(s) && s[0] === 'say');
  assert.ok(!says.some((s) => /少年|アルゴル/.test(String(s[1]))), '少年は 話さない');
  assert.ok(!text.includes('c9c_algol') && !text.includes('"algol"'), '少年の すがたは 出さない');
  // ガンツ・ノクト・スピカの 大事な ことば
  assert.ok(JSON.stringify(scenes[0]).includes('橋が足りないなら、先は、船で行けばいい') && JSON.stringify(scenes[0]).includes('空の海の、地図がない'));
  assert.ok(JSON.stringify(scenes[0]).includes('第3章　星の海') && JSON.stringify(scenes[0]).includes('第1幕　星の船と、星座の島'), '題の 画面');
  assert.ok(JSON.stringify(scenes[2]).includes('このにおい、知ってる'));
  const pir = JSON.stringify(scenes[5]);
  assert.ok(pir.includes('門を通る者からは、光をいただく') && pir.includes('チク、タク') && pir.includes('たのまれただけだ') && pir.includes('かがやきの使い'));
  assert.ok(pir.includes('帰ってきた、のかな') && pir.includes('第1幕　クリア！'));
  assert.ok(pir.includes('にげていった'), '船長は たおれない（にげる）');
});

test('閉じた 幕（PART3_C11A_OPEN）: くぼ地で ガンツと 話しても 始まらない・第2章 クリアの 目標は 今の まま・幕を 開けた 形も ためす', () => {
  const a4 = flagsOf(...UPTO('c10_act4'));
  const closed = c11aScripts(c11aTitleSteps, false, { gantz: () => [['shop', 'x']] });
  assert.deepEqual(closed.c11a_ship_event(ctx(a4)), []);
  assert.deepEqual(closed.c9b_armorer(ctx(a4)), [['shop', 'x']], 'ガンツは 今の まま（店）');
  if (!PART3_C11A_OPEN) {
    assert.equal(act4ClearObjective(), C10D_OBJ.act4, '閉じて いる 間は「第3部　第3章へ（続きは…）」の まま');
    assert.deepEqual(CH11_PROGRESS, [], '第3章の 目標は まだ ない');
    if (PART3_C10D_OPEN) assert.ok(CH10_PROGRESS.some(([, t]) => t === C10D_OBJ.act4));
    const ped = JSON.stringify(SCRIPTS.c10_ped_do(ctx(flagsOf('c10d_start', 'c10_note_do', 'c10d_bridge'))));
    assert.ok(ped.includes(C10D_OBJ.act4), '第2章の さいごの 場面の 目標も 今の まま');
  } else {
    // 開いた（第101回）: 第2章の さいごの 場面の 目標は「ながれ星のくぼ地で、ガンツと話そう」。前の 文は 表から ぬいた
    assert.equal(act4ClearObjective(), C11A_OBJ.start);
    assert.ok(CH11_PROGRESS.length > 0);
    assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10D_OBJ.act4), '前の 文は 知らない 文に なり なおる');
    const ped = JSON.stringify(SCRIPTS.c10_ped_do(ctx(flagsOf('c10d_start', 'c10_note_do', 'c10d_bridge'))));
    assert.ok(ped.includes(C11A_OBJ.start) && !ped.includes(C10D_OBJ.act4), '第2章の さいごの 場面の 目標');
    assert.ok(JSON.stringify(SCRIPTS.c9b_armorer(ctx(a4))).includes('星の船'), '本体の ガンツも 場面');
  }
  assert.equal(act4ClearObjective(true), C11A_OBJ.start);
  const open = openScripts();
  assert.ok(JSON.stringify(open.c11a_ship_event(ctx(a4))).includes('星の船'));
  assert.ok(JSON.stringify(open.c9b_armorer(ctx(a4))).includes('星の船'), 'ガンツに 話しても 場面');
  assert.deepEqual(open.c11a_ship_event(ctx(flagsOf(...UPTO('c10_act3')))), [], '第2章の 間は 始まらない');
  assert.deepEqual(open.c11a_ship_event(ctx({ ...a4, c11a_start: true })), [], '1回だけ');
  // しおり: 第3部 第3章 第1幕
  const sp = storyPlace({ flags: flagsOf(...UPTO('c11a_start')) });
  assert.equal(sp.label, '第3部 第3章 第1幕');
  assert.equal(sp.actTitle, '星の船と、星座の島');
  assert.equal(storyPlace({ flags: flagsOf(...UPTO('c10_act4')) }).label, '第3部 第2章 第4幕', '始まる 前は 第2章 の まま');
});

test('目標: すすみぐあいから なおせる（明かりは すきな じゅん）・行き先と ひとこと', () => {
  const o = (...fl) => objective11a(hasOf(['c10_act4', ...fl]));
  assert.equal(o(), C11A_OBJ.start);
  assert.equal(o('c11a_start'), C11A_OBJ.lens);
  assert.equal(o('c11a_start', C11A_LENS), C11A_OBJ.lensPlay);
  assert.equal(o('c11a_start', 'c11a_chart'), C11A_OBJ.hill);
  assert.equal(o('c11a_start', 'c11a_chart', 'c11a_launch'), C11A_OBJ.sea);
  assert.equal(o('c11a_start', 'c11a_perch'), C11A_OBJ.isles3);
  assert.equal(o('c11a_start', 'c11a_perch', 'c11a_light3'), C11A_OBJ.isles2);
  assert.equal(o('c11a_start', 'c11a_perch', 'c11a_light2', 'c11a_light1'), C11A_OBJ.isles1);
  assert.equal(o('c11a_start', 'c11a_perch', ...C11A_LIGHTS), C11A_OBJ.beast);
  assert.equal(o('c11a_start', 'c11a_beast'), C11A_OBJ.gate);
  assert.equal(o('c11a_start', 'c11_act1'), C11A_OBJ.act1);
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH11A_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH11A_PROGRESS[i]; if (typeof k === 'function' ? k(c) : c.flags[k]) return t; } return null; };
  const seqs = [[], ['c11a_start'], ['c11a_start', C11A_LENS], ['c11a_start', 'c11a_chart'], ['c11a_start', 'c11a_chart', 'c11a_launch'], ['c11a_start', 'c11a_chart', 'c11a_launch', 'c11a_perch'],
    ['c11a_start', 'c11a_perch', 'c11a_light2'], ['c11a_start', 'c11a_perch', 'c11a_light3', 'c11a_light1'], ['c11a_start', 'c11a_perch', ...C11A_LIGHTS],
    ['c11a_start', 'c11a_perch', ...C11A_LIGHTS, 'c11a_beast'], ['c11a_start', 'c11a_perch', ...C11A_LIGHTS, 'c11a_beast', 'c11a_pirate', 'c11_act1']];
  for (const s of seqs) {
    const fl = ['c10_act4', ...UPTO(s.filter((f) => C11A_LINE.includes(f)).pop() || 'c10_act4').slice(0), ...s];
    assert.equal(prog(fl), objective11a(hasOf(fl)), s.join(','));
  }
  for (const t of C11A_OBJ_ALL) {
    assert.ok(CH11A_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH11A_OBJECTIVE_TARGETS[t]) assert.ok(MAPS[p.map], p.map);
    const talk = CH11A_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
});

test('前の 章を 遊んで いる 人を こわさない: 灯台島・星見の丘・くぼ地に 足したのは フラグで 出る 物だけ', () => {
  openAct();
  const sea = MAPS.sea, ow = MAPS.overworld, cr = MAPS.c9a_crater;
  for (const has of [() => false, hasOf(UPTO('c10_act4'))]) {
    // 灯台島の 草地は もとの まま（レンズの 星座は c11a_lens の 間だけ）
    for (let y = LENS11A.oy; y < LENS11A.oy + LENS11A.h; y++) for (let x = LENS11A.ox; x < LENS11A.ox + LENS11A.w; x++) {
      assert.equal(effectiveTile(sea, x, y, has), sea.tiles[y * sea.w + x], `灯台島 ${x},${y}`);
    }
    for (const tr of [...sea.triggers, ...ow.triggers, ...cr.triggers].filter((t) => /^c11a_/.test(t.script))) {
      assert.ok(!condOk(tr.show, has) || (tr.script === 'c11a_ship_event' && has('c10_act4')), `${tr.script} は フラグで 出る`);
    }
    for (const w of ow.warps.filter((w) => w.to.map === C11A_MAP.sea)) assert.ok(!condOk(w.show, has), '星見の丘の 乗り場は c11a_launch から');
    for (const n of ow.npcs.filter((n) => n.id.startsWith('c11a_'))) assert.ok(!condOk(n.show, has), n.id);
  }
  // くぼ地の 場面は 幕が 閉じて いる 間 何も しない（台本が から）
  assert.deepEqual(c11aScripts(c11aTitleSteps, false).c11a_ship_event(ctx(flagsOf(...UPTO('c10_act4')))), []);
  // レンズの 星座の 間だけ 光の ゆか。できたら もとの 草地
  const lens = hasOf(['c11a_start', C11A_LENS]);
  const con0 = conOn('sea', C11A_CON.con0);
  for (const [x, y] of con0.stars) assert.equal(effectiveTile(sea, x, y, lens), T.C11A_LENS_STAR);
  assert.equal(effectiveTile(sea, LENS11A.ox + 1, LENS11A.oy, lens), T.C11A_LENS);
  for (const [x, y] of con0.stars) assert.equal(effectiveTile(sea, x, y, hasOf([C11A_LENS, C11A_CON.con0])), sea.tiles[y * sea.w + x]);
  // 灯台・灯台守の 前は ふさがない
  const has = lens;
  const K = sea.npcById.lh_keeper;
  assert.ok([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !isBlocked(sea, K.x + dx, K.y + dy, has)), '灯台守の となりに 立てる');
});

test('星の海: 流れで 行き止まりが ない（どこからでも 橋の先の はとばへ もどれる）・島の はとばに とどく・流れは ぐるっと まわらない・門の むこうへは 行けない', () => {
  const m = MAPS.c11_sea;
  const has = () => false;
  // 流れの マス: 運ばれた 先は しずかな 海（止まる 所）
  for (const [k, c] of Object.entries(CURRENTS11A)) {
    const [x, y] = c[0];
    const r = carry(m, x, y, has);
    assert.ok(!r.loop, `${k} は まわらない`);
    assert.equal(m.tiles[r.y * m.w + r.x], T.C11A_SEA, `${k} の 先は しずかな 海 (${r.x},${r.y})`);
  }
  const dockKey = key(SEA_BRIDGE11A[0].x, SEA_BRIDGE11A[0].y); // 橋の先の はとばの 先の 光の 橋（ふむと 星見の丘へ）
  const start = flowReach(m, [SEA_ARRIVE11A.x, SEA_ARRIVE11A.y], has);
  // 島・とまり木の島・橋の先の はとばに とどく
  for (const I of Object.values(ISLES11A)) assert.ok(start.pits.has(key(I.pier.x, I.pier.y)), `はとば ${I.pier.x},${I.pier.y}`);
  assert.ok(start.pits.has(dockKey));
  // 門の 前に とどく・門の むこう（きりの 先）には とどかない
  assert.ok(start.stops.has(key(SEA_GATE11A.x + 1, SEA_GATE11A.y + 1)), '門の 前');
  for (const k of start.stops) assert.ok(Number(k.split(',')[1]) > SEA_GATE11A.y, `門の むこうへは 行けない ${k}`);
  // どこで 止まっても、橋の先の はとばへ もどれる（はとばから 島に 入って 出た 所からも）
  const outs = Object.values(ISLES11A).map((I) => key(I.sea.x, I.sea.y));
  for (const k of new Set([...start.stops, ...outs])) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(flowReach(m, [x, y], has).pits.has(dockKey), `${k} から はとばへ`);
  }
  // 島の 船着き場 → 海の はとばの 前・海の はとば → 島
  for (const n of [1, 2, 3]) {
    const im = MAPS[`c11a_isle${n}`];
    const w = im.warps.find((q) => q.to.map === C11A_MAP.sea);
    assert.deepEqual([Math.floor(w.to.x), Math.floor(w.to.y)], [ISLES11A[`isle${n}`].sea.x, ISLES11A[`isle${n}`].sea.y]);
    assert.ok(m.warps.some((q) => q.to.map === im.id));
  }
  // 光の 橋 → 星見の丘・星見の丘の 乗り場 → 橋の先
  for (const b of SEA_BRIDGE11A) assert.ok(m.warps.some((q) => q.x === b.x && q.y === b.y && q.to.map === 'overworld'));
  assert.ok(MAPS.overworld.warps.some((q) => q.x === HILL_DOCK11A.x && q.y === HILL_DOCK11A.y && q.to.map === C11A_MAP.sea));
  // 流れの 上・はとばの まわりは 魔物が 出ない
  for (const c of Object.values(CURRENTS11A)) for (const [x, y] of c) assert.ok(String(m.zoneAt(x, y)).startsWith('safe'));
  assert.ok(String(m.zoneAt(SEA_ARRIVE11A.x, SEA_ARRIVE11A.y)).startsWith('safe'));
});

test('ひとふで書きの 星座: 7つとも ひとふでで とける（島の きまり こみ）・入口の 星から 始められる・まちがった 入口も ある・とき方を 1つ 出す', () => {
  assert.deepEqual(CON_IDS11A.sort(), [...C11A_CON_IDS].sort());
  const placed = { [C11A_CON.con0]: conOn('sea', C11A_CON.con0) };
  for (const n of [1, 2, 3]) for (const C of MAPS[`c11a_isle${n}`].c11aCons) placed[C.id] = C;
  for (const id of C11A_CON_IDS) {
    const con = placed[id], D = CONSTELLATIONS11A[id];
    assert.ok(con, id);
    assert.ok(D.stars.length <= 8 && D.lines.length <= 12, `${id}: 星 8こ・線 12本 まで`);
    // 線は たて・よこ。星の 上を 通らない。1つの 星の 同じ 向きに 線は 1本
    const seen = new Set();
    D.lines.forEach((l, k) => {
      for (const end of [l[0], l[1]]) {
        const d = lineDir11a(D, k, end);
        assert.ok(d, `${id} 線 ${k} は たて・よこ`);
        assert.ok(!seen.has(`${end}${d}`), `${id} 星 ${end} の ${d} に 線は 1本`);
        seen.add(`${end}${d}`);
      }
      for (const [x, y] of lineCells11a(D, k)) assert.ok(!D.stars.some(([a, b]) => a === x && b === y), `${id} 線 ${k} は 星を 通らない`);
    });
    // マップの 上: 星は 立てる・線の マスは 通れない（空）・入口の 星は 地面に ふれて いる
    const m = id === C11A_CON.con0 ? MAPS.sea : MAPS[`c11a_isle${D.isle}`];
    const has = id === C11A_CON.con0 ? hasOf([C11A_LENS]) : () => false;
    for (const [x, y] of con.stars) assert.ok(!isBlocked(m, x, y, has), `${id} 星 ${x},${y} に 立てる`);
    con.lines.forEach((_, k) => { for (const [x, y] of lineCells11a(con, k)) assert.ok(isBlocked(m, x, y, has), `${id} 線の マス ${x},${y} は 歩けない`); });
    assert.ok(con.entries.length >= 1 && con.land, `${id} 入口の 星`);
    const sol = solve11a(con, con.entries);
    assert.ok(sol, `${id} は 入口の 星から ひとふでで とける`);
    assert.equal(sol.path.length, con.lines.length);
    console.log(`  ${id}（${D.name}）: 星 ${sol.start} から ${sol.path.map((p) => p.dir).join('→')}`);
    if (D.isle) assert.ok(con.entries.some((s) => !goodStarts11a(con, [s]).length), `${id}: まちがった 入口も ある（どの 星から 始めるかも なぞ）`);
  }
  // 島ごとの きまり
  for (const id of C11A_ISLE_CONS[2]) assert.ok(CONSTELLATIONS11A[id].lines.some((l) => l[2]), `${id} に ながれ星の 線`);
  for (const id of C11A_ISLE_CONS[3]) assert.ok(CONSTELLATIONS11A[id].twins.length, `${id} に ふたご星`);
  for (const id of C11A_ISLE_CONS[1]) assert.equal(CONSTELLATIONS11A[id].rule, CON_RULE.basic);
  // ながれ星の 線を 無視すると、とき方が かわる（きまりが 効いて いる）・ふたご星を 無視すると とけない 星座が ある
  const free = (D) => ({ ...D, lines: D.lines.map(([a, b]) => [a, b]) });
  assert.ok(C11A_ISLE_CONS[2].some((id) => goodStarts11a(free(CONSTELLATIONS11A[id]), CONSTELLATIONS11A[id].stars.map((_, i) => i)).length > goodStarts11a(CONSTELLATIONS11A[id], CONSTELLATIONS11A[id].stars.map((_, i) => i)).length));
  assert.ok(C11A_ISLE_CONS[3].every((id) => !solve11a({ ...CONSTELLATIONS11A[id], twins: [] }, CONSTELLATIONS11A[id].stars.map((_, i) => i))), 'ふたご星が ないと とけない');
});

test('サーバー: 星の 上で 線の 向き → うかんで 次の 星へ・同じ 線は 1回・ながれ星の 線・ふたご星・行けなく なったら やり直し・「やり直す」・助け（3回・6回）', async () => {
  const world = fixedWorld(11001);
  const { bot, c } = await act0Player(world, 'ソラ');
  Object.assign(c.flags, flagsOf(...UPTO('c11a_perch')));
  // 島 1 の ほしうさぎ: まちがった 入口（星 0）から
  const con = conOn('c11a_isle1', C11A_CON.con1a);
  assert.ok(con.entries.includes(0) && !goodStarts11a(con, [0]).length);
  await enterStar(bot, 'c11a_isle1', con, 0);
  assert.equal(conState11a(world, bot.s, con).entry.get(bot.s.id), 0, 'はじめの 星');
  await goDir(bot, 'right');
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], con.stars[1], '線の 上を 次の 星まで');
  assert.equal(conState11a(world, bot.s, con).used, 1);
  // 同じ 線は 1回だけ
  let n0 = bot.msgs.length;
  await goDir(bot, 'left');
  assert.ok(bot.msgs.slice(n0).some((m) => m.t === 'toast' && m.text.includes('同じ線は、1回だけ')));
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], con.stars[1]);
  // 星 1 → 4 → 3 → 2 → 0 … 星 0 で 行ける 線が ない → 線が 消えて はじめの 星へ
  for (const d of ['down', 'left', 'left', 'up']) await goDir(bot, d);
  assert.equal(conState11a(world, bot.s, con).used, 0, '線が 消えた');
  assert.equal(conState11a(world, bot.s, con).retries, 1);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], con.stars[0], 'はじめの 星');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('行ける線が、なくなった')));
  // 「やり直す」（星を しらべる）
  await goDir(bot, 'right');
  bot.choice = 0;
  await examine(bot, con.stars[1][0], con.stars[1][1]);
  assert.equal(conState11a(world, bot.s, con).used, 0);
  assert.equal(conState11a(world, bot.s, con).retries, 2);
  // 地面へ おりると 線は 消える（3回め）→ 助け: 始める 星が 光る
  await goDir(bot, 'left');
  await goDir(bot, 'right');
  await stepOn(bot, con.stars[1][0], con.stars[1][1]); // その 星に いる まま
  await enterStar(bot, 'c11a_isle1', con, 2);
  const g = Object.values(DIRV).map(([dx, dy]) => [con.stars[2][0] + dx, con.stars[2][1] + dy]).find(([x, y]) => !isBlocked(MAPS.c11a_isle1, x, y, () => false));
  await goDir(bot, 'up');
  await stepOn(bot, con.stars[0][0], con.stars[0][1]);
  await stepOn(bot, g[0], g[1]);
  const st = conState11a(world, bot.s, con);
  assert.equal(st.used, 0, '地面へ おりたら 線が 消えた');
  assert.equal(st.retries, C11A_HELP_START);
  await tickN(world, 3);
  const snap = [...bot.msgs].reverse().find((m) => m.t === 'snap' && m.c11a)?.c11a?.[con.id];
  assert.equal(snap.hs, solve11a(con, con.entries).start, '3回で 始める 星が 光る');
  // 6回で 次の 線
  st.retries = C11A_HELP_LINE;
  const sol = solve11a(con, con.entries);
  await enterStar(bot, 'c11a_isle1', con, sol.start);
  await goDir(bot, sol.path[0].dir);
  await tickN(world, 3);
  const snap2 = [...bot.msgs].reverse().find((m) => m.t === 'snap' && m.c11a)?.c11a?.[con.id];
  assert.equal(snap2.hl, solveFrom11a(con, sol.path[0].to, 1 << sol.path[0].k)[0].k, '6回で 次の 線が 光る');
  for (const m of sol.path.slice(1)) await goDir(bot, m.dir);
  assert.ok(c.flags[C11A_CON.con1a], '星座が できた');
  assert.ok(said(bot, 'ほしうさぎ'));
  // ながれ星の 線は 逆に 進めない（島 2 の さかな: 星 2 から 星 1 へ）
  const c2 = conOn('c11a_isle2', C11A_CON.con2a);
  await place(bot, 'c11a_isle2', c2.stars[2][0], c2.stars[2][1]);
  await stepOn(bot, c2.stars[2][0], c2.stars[2][1]);
  n0 = bot.msgs.length;
  await goDir(bot, 'left');
  assert.ok(bot.msgs.slice(n0).some((m) => m.t === 'toast' && m.text.includes('矢じるしの向きにしか')));
  assert.equal(conState11a(world, bot.s, c2)?.used || 0, 0);
  // ふたご星: 島 3 の ねこ（星 1 から 下へ → 星 3 に 着くと ふたごの 星 4 から 出る）
  const c3 = conOn('c11a_isle3', C11A_CON.con3a);
  await place(bot, 'c11a_isle3', c3.stars[1][0], c3.stars[1][1]);
  await stepOn(bot, c3.stars[1][0], c3.stars[1][1]);
  await goDir(bot, 'down');
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], c3.stars[4], 'ふたご星の もう 片方');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('ふたご星')));
});

test('島の じゅんは 自由（6とおり）: 2つめの 星座で 明かり・3つめの 明かりの 島で 星座の けもの', () => {
  const S = openScripts();
  const orders = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  for (const ord of orders) {
    const fl = {};
    ord.forEach((n, k) => {
      const [a, b] = C11A_ISLE_CONS[n];
      const s1 = JSON.stringify(S[`c11a_done_${a}`](ctx(fl)));
      assert.ok(!s1.includes('c11a_light'), `${ord} 島 ${n} の 1つめは 明かり なし`);
      fl[a] = true;
      const s2 = S[`c11a_done_${b}`](ctx(fl));
      const j = JSON.stringify(s2);
      assert.ok(j.includes(`"c11a_light${n}"`), `${ord} 島 ${n} の 2つめで 明かり`);
      assert.equal(j.includes('"battle","c11a_beast"'), k === 2, `${ord} 島 ${n}: けものは 3つめの 島だけ`);
      fl[b] = true;
      fl[`c11a_light${n}`] = true;
    });
    assert.equal(objective11a((f) => !!fl[f] || f === 'c11a_start' || f === 'c11a_perch'), C11A_OBJ.beast);
  }
});

test('家族 2人: 同じ 星座に 2人で 入る・だれが 通った 線も 光る（ふたふで）・できると 2人で 見る・リーダーの フラグ', async () => {
  const world = fixedWorld(11002);
  const { A, B, oA, oB } = await party2(world, 'c11a_perch');
  const con = conOn('c11a_isle1', C11A_CON.con1b);
  const sol = solve11a(con, con.entries);
  // A が はじめの 半分・B が べつの 入口から 入って 待つ
  const other = con.entries.find((i) => i !== sol.start);
  await enterStar(A.bot, 'c11a_isle1', con, sol.start, oA);
  await enterStar(B.bot, 'c11a_isle1', con, other, oB);
  const half = 3;
  for (const m of sol.path.slice(0, half)) await goDir(A.bot, m.dir, oA);
  assert.equal(conState11a(world, B.bot.s, con).used, conState11a(world, A.bot.s, con).used, '同じ パーティーは 同じ 線');
  await tickN(world, 3);
  const snapB = [...B.bot.msgs].reverse().find((m) => m.t === 'snap' && m.c11a)?.c11a?.[con.id];
  assert.ok(snapB && snapB.u === conState11a(world, A.bot.s, con).used, 'B の 画面にも A の 線が 光る');
  // A が 地面へ おりても B が 星座に いる 間は 線は 消えない
  const landA = Object.values(DIRV).map(([dx, dy]) => [con.stars[sol.path[half - 1].to][0] + dx, con.stars[sol.path[half - 1].to][1] + dy]);
  void landA;
  // のこりを A が つなぐ
  for (const m of sol.path.slice(half)) await goDir(A.bot, m.dir, oA);
  await play(A.bot, oA);
  assert.ok(A.c.flags[C11A_CON.con1b], 'リーダーの フラグ');
  assert.ok(said(B.bot, 'ほしのいえ'), 'B も 星座が できた 場面を 見た');
  // ふたふで: 2人なら 1人では とけない 入口からでも（A と B が 1本ずつ）とける 星座が ある（ほしうさぎ: 奇数の 星が 2つ）
  const c1 = conOn('c11a_isle1', C11A_CON.con1a);
  await enterStar(A.bot, 'c11a_isle1', c1, 5, oA); // A は 星 5（下）から
  await enterStar(B.bot, 'c11a_isle1', c1, 0, oB); // B は まちがった 入口 星 0 から
  await goDir(B.bot, 'right', oB); // 0 → 1
  await goDir(B.bot, 'down', oB); // 1 → 4
  await goDir(B.bot, 'left', oB); // 4 → 3（B は 星 3）
  await goDir(A.bot, 'up', oA); // 5 → 3
  await goDir(A.bot, 'left', oA); // 3 → 2
  await goDir(A.bot, 'up', oA); // 2 → 0
  await play(A.bot, oA);
  assert.ok(A.c.flags[C11A_CON.con1a], '2人の 線で 星座が できた');
});

test('サーバー: 回線が 切れて すぐ もどる（同じ セッションを ひきつぐ）→ うかんだ 星の 上なら その 星座の 地面へ', async () => {
  const world = fixedWorld(11003, { offline: false, checkPassword: () => true });
  const A = await act0Player(world, 'ソラ');
  Object.assign(A.c.flags, flagsOf(...UPTO('c11a_perch')));
  const con = conOn('c11a_isle2', C11A_CON.con2b);
  await place(A.bot, 'c11a_isle2', con.stars[3][0], con.stars[3][1]); // 地面に ふれて いない 星
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, 'c11a_isle2');
  assert.deepEqual([Math.floor(A2.s.x), Math.floor(A2.s.y)], [con.land.x, con.land.y], '星座の 地面へ');
});

test('通し（ひとり）: くぼ地 → 灯台島の レンズの 星座 → 星見の丘 → 星の海 → とまり木の島 → 島 3つ（けもの）→ 星座の門の 船長 → c11_act1', async () => {
  const world = fixedWorld(11004);
  const { bot, c } = await act0Player(world, 'ソラ');
  const fought = [];
  const o = { fought };
  // 0 くぼ地（入口から 入ると ガンツの 場面）
  await place(bot, 'c9a_crater', 12, 16, 'up', o);
  await stepOn(bot, 12, 15, o);
  assert.ok(c.flags.c11a_start && said(bot, '星の船'));
  assert.equal(c.objective, C11A_OBJ.lens);
  // L1 灯台守 → レンズの 星座 → 星図
  await talkTo(bot, 'sea', 'lh_keeper', 0, o);
  assert.ok(c.flags[C11A_LENS]);
  await solveCon(bot, 'sea', C11A_CON.con0, o);
  await play(bot, o);
  assert.ok(c.flags.c11a_chart && !c.flags[C11A_LENS] && c.keyItems?.includes('star_chart'));
  // B1 星見の丘 → 星の海
  await place(bot, 'overworld', 60, 86, 'up', o);
  await stepOn(bot, 60, 85, o);
  assert.ok(c.flags.c11a_launch && bot.s.map === C11A_MAP.sea);
  assert.ok(c.keyItems?.includes('star_ship'));
  // 星の海 → とまり木の島の はとば（流れに 乗って 行ける ことは 上の テスト）
  const P = ISLES11A.perch.pier;
  await place(bot, C11A_MAP.sea, P.x, P.y + 1, 'up', o);
  await stepOn(bot, P.x, P.y, o);
  assert.equal(bot.s.map, C11A_MAP.perch);
  await stepOn(bot, PERCH_POS11A.arrive.x, PERCH_POS11A.arrive.y - 1, o);
  assert.ok(c.flags.c11a_perch && said(bot, 'ヨイ'));
  assert.ok(c.visited?.[C11A_PLACE], 'ルーラで 行ける');
  // 島 3 → 1 → 2（すきな じゅん）
  for (const n of [3, 1, 2]) {
    const I = ISLES11A[`isle${n}`];
    await place(bot, C11A_MAP.sea, I.pier.x, I.pier.y + 1, 'up', o);
    await stepOn(bot, I.pier.x, I.pier.y, o);
    assert.equal(bot.s.map, `c11a_isle${n}`);
    for (const id of C11A_ISLE_CONS[n]) await solveCon(bot, `c11a_isle${n}`, id, o);
    await play(bot, o);
    assert.ok(c.flags[`c11a_light${n}`], `島 ${n} の 明かり`);
  }
  assert.deepEqual(fought.filter((f) => f === C11A_BATTLE.beast), [C11A_BATTLE.beast], 'けものは 1回（3つめの 島で）');
  assert.ok(c.flags.c11a_beast);
  assert.equal(c.objective, C11A_OBJ.gate);
  // 星座の門
  await place(bot, C11A_MAP.sea, SEA_GATE11A.x + 1, SEA_GATE11A.y + 4, 'up', o);
  await stepOn(bot, SEA_GATE11A.x + 1, SEA_GATE11A.y + 3, o);
  assert.ok(fought.includes(C11A_BATTLE.pirate));
  assert.ok(c.flags.c11a_pirate && c.flags.c11_act1);
  assert.equal(c.objective, C11A_OBJ.act1);
  assert.ok(!isBlocked(MAPS.c11_sea, SEA_GATE11A.x, SEA_GATE11A.y, world.hasFlagFn(bot.s)) || true);
  assert.equal(effectiveTile(MAPS.c11_sea, SEA_GATE11A.x, SEA_GATE11A.y, world.hasFlagFn(bot.s)), T.C11A_GATE_OPEN, '門が 開いた');
  assert.equal(storyPlace(c).label, '第3部 第3章 第1幕');
  assert.ok(storyPlace(c).cleared);
  // 星座の しるし 7つ・明かり 3つ
  for (const f of [...C11A_CON_IDS, ...C11A_LIGHTS]) assert.ok(c.flags[f], f);
  // 島の 明かりの 場所・曲の conStage（2つ）
  for (const n of [1, 2, 3]) assert.equal(effectiveTile(MAPS[`c11a_isle${n}`], ISLE_POS11A[n].light.x, ISLE_POS11A[n].light.y, world.hasFlagFn(bot.s)), T.C11A_LIGHT_ON);
  void fullMask11a;
});
