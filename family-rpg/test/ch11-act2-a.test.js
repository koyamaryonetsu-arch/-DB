// 第3部 第3章 第2幕「月の都と、名前のランプ」（第102回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c11_act1 → 星座の門の むこう（きりが 晴れる c11b_start）→ 月の都の おもて・名前の 広場（c11b_plaza）→ ホタル・月かげの 戸
//   → うらの 町・トモシビ（c11b_back・きまり c11b_rule）→ うら道（おもてと うら）→ 名前の 塔（c11b_tower）→ 番人（c11b_keeper）
//   → スピカの ランプ（c11b_lamp）→ テラスの オボロ（c11b_oboro）→ c11_act2
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当に 戦う 通しは test/ch11-act2.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C11B, C11B_ACT0, C11B_LINE, C11B_MARKS, C11B_MARK_MAX, C11B_MAP, C11B_MAP_IDS, C11B_PAIRS, C11B_CHEST_IDS, C11B_TILE_FIRST, C11B_TILE_LAST,
  C11B_TRACKS, C11B_TRACK_IDS, C11B_BATTLE, C11B_HELP_STEPS, C11B_PLACE, C11B_OBORO_NAME, C11B_OBORO_SHORT, C11B_KEEPER_NAME, NAME_LAMP,
} from '../public/js/shared/maps/c11b-flags.js';
import { CH11B_MAPS } from '../public/js/shared/maps/c11b.js';
import {
  CITY_ROWS11B, TOWER_ROWS11B, CITY_POS11B, TOWER_POS11B, C11B_SECTIONS, SEA_MOON_PIER11B, SEA_MOON_OUT11B, SEA_SCENE0_11B,
} from '../public/js/shared/maps/c11b-rows.js';
import { SEA_ARRIVE11A, SEA_BRIDGE11A, SEA_GATE11A } from '../public/js/shared/maps/c11a-rows.js';
import { C11A_LINE } from '../public/js/shared/maps/c11a-flags.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import { solve11b, reachable11b, nextHint11b, pairOf11b } from '../public/js/shared/world/c11b-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH11_STEPS, PART3_C11B_OPEN, c11bTitleSteps, CH11_PROGRESS, CH11_OBJECTIVE_TARGETS, act1ClearObjective, act2ClearObjective, C11B_TITLE,
} from '../public/js/shared/data/story-c11.js';
import { C11A_OBJ } from '../public/js/shared/data/story-c11a.js';
import {
  C11B_OBJ, C11B_OBJ_ALL, CH11B_STORY_SCRIPTS, CH11B_PROGRESS, CH11B_OBJECTIVE_TARGETS, CH11B_OBJECTIVE_TALK, c11bScripts, applyCh11b, objective11b,
} from '../public/js/shared/data/story-c11b.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { warpPlaces } from '../public/js/shared/world/travel.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { spicaOf } from '../public/js/shared/battle-c9a.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, addPlayer, play, place, stepOn, examine, talkTo, walkTo, fixedWorld } from './c9a-play.js';

// 本体の 台本（テストが 幕を 開けた 形を まぜる 前）
const BODY = { start: SCRIPTS.c11b_start_event, gate: SCRIPTS.c11a_gate };
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES11B = ['public/js/shared/maps/c11b-flags.js', 'public/js/shared/data/story-c11b.js', 'public/js/shared/maps/c11b.js', 'public/js/shared/maps/c11b-rows.js',
  'public/js/shared/world/c11b-steps.js', 'public/js/client/c11b-view.js', 'public/js/client/render/tiles-c11b.js', 'public/js/client/render/c11b-npc-art.js'];
const openScripts = () => c11bScripts(c11bTitleSteps, true);
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  // 第103回 A班: 第3幕が 開いても 前の 文に もどらない ように、幕の クリアの 目標は act2ClearObjective（本体の 台本と 同じ）
  applyCh11b(SCRIPTS, STORY_SCRIPTS, { title: c11bTitleSteps, open: true, act2Obj: act2ClearObjective() });
}
const hasOf = (list) => (f) => list.includes(f);
const tile = (s) => [Math.floor(s.x), Math.floor(s.y)];
const sideOf = (s) => MAPS[s.map].c11b.side;
const SEC = Object.fromEntries(C11B_SECTIONS.map((S) => [S.id, S]));
const lastSnap = (bot) => [...bot.msgs].reverse().find((m) => m.t === 'snap')?.c11b || null;

async function act0Player(world, name, upto = C11B_ACT0, job) {
  openAct();
  const P = await addPlayer(world, name, upto, [], job);
  P.c.objective = objective11b((f) => !!P.c.flags[f]);
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
// 道さがしの とおりに 動く（画面と 同じ: 歩く・戸の 上で しらべる・ランプを しらべる）
async function runPath(bot, S, opts) {
  const has = bot.world.hasFlagFn(bot.s);
  const [x0, y0] = tile(bot.s);
  const path = solve11b(S, { side: sideOf(bot.s), x: x0, y: y0 }, has);
  assert.ok(path, `${S.id}: ${bot.s.map} ${x0},${y0} から 出口へ`);
  for (const step of path) {
    const [sd, x, y] = step.st;
    if (step.act?.kind === 'door') {
      await examine(bot, x, y - 1, opts);
      assert.equal(bot.s.map, C11B_PAIRS[S.pair][sd], `${S.id}: 戸で ${sd ? 'うら' : 'おもて'}へ`);
      assert.deepEqual(tile(bot.s), [x, y], '同じ 場所');
    } else if (step.act?.kind === 'lamp') {
      await examine(bot, step.act.x, step.act.y, opts);
    } else await stepOn(bot, x, y, opts);
  }
  return path;
}

test('名前の 約束: マップ 8まい・タイル 661〜700・宝箱の id・一本の 線・しるし 12こ まで・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH11B_MAPS, ['c11b_front', 'c11b_back', 'c11b_tower1', 'c11b_tower2', 'c11b_tower3', 'c11b_towerb1', 'c11b_towerb2', 'c11b_towerb3']);
  for (const id of C11B_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」の 地図を 取らない（セーブを 小さく）`);
    assert.ok(C11B_TRACK_IDS.includes(m.bgm), `${id} の 曲は この 幕の id`);
  }
  assert.equal(MAPS.c11b_front.bgm, C11B_TRACKS.front);
  assert.equal(MAPS.c11b_back.bgm, C11B_TRACKS.back);
  for (const id of ['c11b_tower1', 'c11b_towerb3']) assert.equal(MAPS[id].bgm, C11B_TRACKS.tower);
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C11B_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.ok(ids.length && ids.every((v) => v >= C11B_TILE_FIRST && v <= C11B_TILE_LAST), 'タイル 661〜700');
  for (const v of ids) assert.ok(TILE_INFO[v], `TILE_INFO ${v}`);
  // 宝箱 8こ
  const chests = C11B_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id)).sort();
  assert.deepEqual(chests, [...C11B_CHEST_IDS].sort());
  // 一本の 線（c11_act1 の うしろ）。とびら・ランプの しるしは 線に 入れない。12こ まで
  const j = STORY_STEPS.indexOf(C11B_ACT0);
  // 第103回 A班: うしろに 第3幕の 線が つづく（線の 場所は 名前で さがす）
  assert.deepEqual(STORY_STEPS.slice(j + 1, j + 1 + C11B_LINE.length), C11B_LINE);
  assert.deepEqual(CH11_STEPS.slice(0, C11A_LINE.length + C11B_LINE.length), [...C11A_LINE, ...C11B_LINE]);
  assert.ok(C11B_MARKS.length <= C11B_MARK_MAX);
  const used = new Set(C11B_MAP_IDS.flatMap((id) => MAPS[id].gates.map((g) => g.flag)).filter((f) => /^c11b_d/.test(f)));
  assert.ok([...used].every((f) => C11B_MARKS.includes(f)) && used.size === C11B_MARKS.length, `使う しるし ${[...used]}`);
  for (const f of C11B_MARKS) assert.ok(!STORY_STEPS.includes(f), `${f} は 線に 入らない`);
  // 台本（パーティーで 見る）・やり直しの 行き先（ノクト）
  openAct();
  for (const id of CH11B_STORY_SCRIPTS) { assert.ok(SCRIPTS[id], id); assert.ok(STORY_SCRIPTS.has(id), `${id} は パーティーで 見る`); }
  for (const m of C11B_MAP_IDS.map((id) => MAPS[id])) {
    for (const n of m.npcs) assert.ok(SCRIPTS[n.script], `${m.id} ${n.id}`);
    for (const a of m.actions) assert.ok(SCRIPTS[a.script], `${m.id} ${a.script}`);
    for (const t of m.triggers) assert.ok(SCRIPTS[t.script], `${m.id} ${t.script}`);
  }
  assert.equal(BOSS_RETRY[C11B_BATTLE.keeper], 'c11b_keeper_event');
  assert.equal(BOSS_RETRY[C11B_BATTLE.oboro], 'c11b_oboro_event');
  assert.equal(BOSS_HINT_WHO[C11B_BATTLE.keeper], 'ノクト');
  assert.equal(BOSS_HINT_WHO[C11B_BATTLE.oboro], 'ノクト');
  assert.ok(MAPS.c11b_tower3.triggers.some((t) => t.script === 'c11b_keeper_event'));
  assert.ok(MAPS.c11b_tower3.triggers.some((t) => t.script === 'c11b_oboro_event'));
  // 曲（18-5 の 表）
  const S = openScripts();
  const sc = (id, ...fl) => JSON.stringify(S[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c11b_city_event', C11B.start).includes(`"${C11B_TRACKS.plaza}"`), '名前の 広場の 曲');
  assert.ok(sc('c11b_back_event', C11B.plaza).includes(`"${C11B_TRACKS.back}"`), 'うらの 曲');
  assert.ok(sc('c11b_keeper_event', C11B.tower).includes(`"${C11B_TRACKS.keeper}"`), '中ボスの 曲');
  assert.ok(sc('c11b_oboro_event', C11B.lamp).includes(`"${C11B_TRACKS.oboro}"`), 'ボスの 曲');
  // ルーラ（行った 所）に 月の都
  assert.ok(warpPlaces({ visited: { [C11B_PLACE]: true } }).includes(C11B_PLACE));
  assert.ok(!warpPlaces({ visited: {} }).includes(C11B_PLACE));
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES11B) {
    const g = list.find((x) => x.endsWith(f));
    assert.ok(g, `gameFiles に ${f}`);
    assert.deepEqual(checkFile(gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f))).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の data/c11b-stub.js・B の data/c11b-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['c11b-stub.js', 'c11b-names-b.js']) assert.ok(!existsSync(new URL(`../public/js/shared/data/${f}`, import.meta.url)), `${f} は ない`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c11b-stub|c11b-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // 本物に つないだ: 宝箱（B班の 中み）・店・魔物の 表・戦い・ボスの 名前・だいじな 物
  for (const id of C11B_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(ch.item, `${ch.id} は B班の 品`);
  assert.deepEqual(MAPS.c11b_back.spawnCounts, { t11b_alley: 4 });
  assert.deepEqual(MAPS.c11b_front.spawnCounts, {}, 'おもての 町では 出ない');
  for (const n of [1, 2, 3]) {
    assert.deepEqual(Object.keys(MAPS[`c11b_tower${n}`].spawnCounts), ['t11b_tower']);
    assert.deepEqual(Object.keys(MAPS[`c11b_towerb${n}`].spawnCounts), ['t11b_towerb']);
  }
  for (const y of [10, 20, 30]) for (let x = 1; x < 35; x++) assert.ok(String(MAPS.c11b_front.zoneAt(x, y)).startsWith('safe'), 'おもては 出ない');
  for (let y = 27; y < 39; y++) for (let x = 1; x < 35; x++) assert.ok(String(MAPS.c11b_back.zoneAt(x, y)).startsWith('safe'), 'うらの 町（店の ある 所）は 出ない');
  for (const id of Object.values(C11B_BATTLE)) assert.ok(FIXED_ENCOUNTERS[id]?.boss, id);
  assert.equal(MONSTERS.c11b_keeper.name, C11B_KEEPER_NAME);
  assert.equal(MONSTERS.c11b_oboro.name, C11B_OBORO_NAME);
  assert.equal(ITEMS[NAME_LAMP]?.type, 'key');
  assert.ok(SHOPS.c11b_arms.items.length && SHOPS.c11b_back_shop.items.length && SHOPS.c11b_back_shop.items.every((i) => ITEMS[i]));
});

test('台本の きまり: 明かすのは きまりと スピカが だれか まで・女王は 出ない・少年は ひとこと だけ・カイ・ソリトゥス・鏡・8つめの 音・もとの 昔話の 言葉を 書かない', () => {
  const S = openScripts();
  const all = Object.fromEntries([...C11B_LINE, ...C11B_MARKS, C11B_ACT0].map((f) => [f, true]));
  const story = [
    S.c11b_start_event(ctx(flagsOf(C11B_ACT0))), S.c11b_city_event(ctx(flagsOf(C11B.start))), S.c11b_hotaru(ctx(flagsOf(C11B.plaza))),
    S.c11b_back_event(ctx(flagsOf(C11B.plaza))), S.c11b_tower_event(ctx(flagsOf(C11B.rule))), S.c11b_keeper_event(ctx(flagsOf(C11B.tower))),
    S.c11b_oboro_event(ctx(flagsOf(C11B.lamp))),
  ];
  const others = [...Object.values(S).map((fn) => fn(ctx(all))), ...Object.values(S).map((fn) => fn(ctx({})))];
  for (const k of C11B_LINE) others.push(...Object.values(S).map((fn) => fn(ctx(flagsOf(...UPTO(k))))));
  const text = JSON.stringify([story, others]);
  for (const w of ['カイ', 'ソリトゥス', 'ネフィ', 'カリム', 'ミナモ', 'リオン', '勇者', 'ミラーレ', '鏡', '8つめ', '八つめ', 'アルゴル', '少年',
    'かぐや', '竹', 'おじいさん', 'おばあさん', '姫', 'なぜ', 'どうして女王', 'c9c_algol', '"algol"']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  // 女王は 出ない（話さない・すがたも ない）。言葉は トモシビの「ひとりむすめ」だけ
  const says = [story, others].flat(2).filter((s) => Array.isArray(s) && s[0] === 'say');
  assert.ok(!says.some((s) => String(s[1] || '').includes('女王')), '女王は 話さない');
  assert.ok(!text.includes('queen'), '女王の すがたは ない');
  const tell = says.filter((s) => s[2].includes('女王'));
  assert.ok(tell.length && tell.every((s) => s[1] === 'トモシビ' && s[2].includes('ひとりむすめ')), '女王の ことは「ひとりむすめ」だけ');
  // きまり（光の はかり・ながされる）は うらの 町で トモシビ が 言う
  const back = JSON.stringify(story[3]);
  assert.ok(back.includes('光のはかり') && back.includes('ながされる') && back.includes('下の世界へ、おとされる') && back.includes('わたしも？'));
  assert.ok(back.includes('消された名前のランプは、名前の塔に、しまってある'));
  // 少年は さいごの ひとこと だけ（名前も すがたも 出さない。かげ）
  const end = JSON.stringify(story[6]);
  const boy = says.filter((s) => s[2].includes('門は開かないよ'));
  assert.equal(new Set(boy.map((s) => s[2])).size, 1);
  assert.ok(end.includes('c11b_shadow') && end.includes('そのやり方じゃ、門は開かないよ'));
  assert.equal(says.filter((s) => s[1] === '？？？' && s[2].includes('門')).length >= 1, true);
  // スピカは 自分で 決める・オボロは たおれない（引く）・題の 画面
  assert.ok(end.includes('わたし、お母さまに、会いにいく') && end.includes('光のはかりの日に、また') && end.includes('第2幕　クリア！'));
  assert.ok(end.includes(C11B_OBORO_NAME) && C11B_OBORO_SHORT === 'オボロ', 'ボスの 名前は c11b-flags.js');
  assert.ok(end.includes('下の世界のことは、すべて、おわすれください'));
  assert.ok(JSON.stringify(story[5]).includes(C11B_KEEPER_NAME) && JSON.stringify(story[5]).includes('女王さまの、ひとりむすめじゃ'));
  assert.ok(JSON.stringify(story[0]).includes(C11B_TITLE.act) && C11B_TITLE.act === '第2幕　月の都と、名前のランプ', '題の 画面');
  const city = JSON.stringify(story[1]);
  assert.ok(city.includes('下の世界の方は、光が、うすいですね') && city.includes('光のはかりの前です。\\nお通しできません') && city.includes('…ここ、知ってる') && city.includes('でも…ない'));
});

test('閉じた 幕（PART3_C11B_OPEN）: 第1幕 クリアの あとも 何も かわらない（目標・きりの 門・門の 文）・幕を 開けた 形も ためす', () => {
  const a1 = flagsOf(...UPTO(C11B_ACT0));
  const has1 = (f) => !!a1[f];
  const closed = c11bScripts(c11bTitleSteps, false);
  assert.deepEqual(closed.c11b_start_event(ctx(a1)), []);
  const sea = MAPS.c11_sea;
  if (!PART3_C11B_OPEN) {
    assert.equal(act1ClearObjective(), C11A_OBJ.act1, '閉じて いる 間は「第3部　第3章　第2幕へ（続きは…）」の まま');
    assert.ok(!CH11_PROGRESS.some(([, t]) => C11B_OBJ_ALL.includes(t)), '第2幕の 目標は まだ ない');
    assert.ok(CH11_PROGRESS.some(([, t]) => t === C11A_OBJ.act1));
    assert.ok(!(C11B_OBJ.start in CH11_OBJECTIVE_TARGETS));
    assert.deepEqual(BODY.start(ctx(a1)), [], '本体の 台本も 始まらない');
    assert.ok(JSON.stringify(BODY.gate(ctx(a1))).includes('アップデート'), '門を しらべた 文も 今の まま');
    const pir = JSON.stringify(SCRIPTS.c11a_pirate_event(ctx(flagsOf(...UPTO('c11a_beast'), 'c11a_light1', 'c11a_light2', 'c11a_light3'))));
    assert.ok(pir.includes(C11A_OBJ.act1), '第1幕の さいごの 場面の 目標も 今の まま');
  }
  assert.equal(act1ClearObjective(true), C11B_OBJ.start);
  // 星座の門の むこうは きりの まま（c11b_start が ない）。船で 行けるのは 門まで
  for (const g of sea.gates.filter((q) => q.flag === C11B.start)) assert.equal(effectiveTile(sea, g.x, g.y, has1), T.C11A_MIST);
  const R = flowReach(sea, [SEA_ARRIVE11A.x, SEA_ARRIVE11A.y], has1);
  for (const k of R.stops) assert.ok(Number(k.split(',')[1]) >= SEA_GATE11A.y, `門の むこうへは 行けない ${k}`);
  assert.ok(!R.pits.has(`${SEA_MOON_PIER11B.x},${SEA_MOON_PIER11B.y}`));
  // 門の 前の 場面 0 の マスは、閉じて いる 間 何も しない（台本が から）
  const tr = sea.triggers.find((t) => t.script === 'c11b_start_event');
  assert.ok(tr && condOk(tr.show, has1) && !condOk(tr.show, () => false));
  // 開けた 形: きりが 晴れて、題の 画面
  const open = openScripts();
  const st = JSON.stringify(open.c11b_start_event(ctx(a1)));
  assert.ok(st.includes(`"${C11B.start}"`) && st.includes(C11B_TITLE.act));
  assert.deepEqual(open.c11b_start_event(ctx(flagsOf(...UPTO('c11a_pirate')))), [], '第1幕の 間は 始まらない');
  assert.deepEqual(open.c11b_start_event(ctx({ ...a1, [C11B.start]: true })), [], '1回だけ');
  // しおり
  assert.equal(storyPlace({ flags: a1 }).label, '第3部 第3章 第1幕', '始まる 前は 第1幕 の まま');
  const sp = storyPlace({ flags: flagsOf(...UPTO(C11B.start)) });
  assert.equal(sp.label, '第3部 第3章 第2幕');
  assert.equal(sp.actTitle, '月の都と、名前のランプ');
});

test('目標: すすみぐあいから なおせる・行き先と ひとこと・第1幕 クリアの 目標の つなぎ', () => {
  const o = (...fl) => objective11b(hasOf([C11B_ACT0, ...fl]));
  assert.equal(o(), C11B_OBJ.start);
  assert.equal(o(C11B.start), C11B_OBJ.city);
  assert.equal(o(C11B.start, C11B.plaza), C11B_OBJ.hotaru);
  assert.equal(o(C11B.back), C11B_OBJ.tomo);
  assert.equal(o(C11B.rule), C11B_OBJ.tower);
  assert.equal(o(C11B.tower), C11B_OBJ.top);
  assert.equal(o(C11B.keeper), C11B_OBJ.shelf);
  assert.equal(o(C11B.lamp), C11B_OBJ.terrace);
  assert.equal(o(C11B.oboro, C11B.act2), C11B_OBJ.act2);
  assert.equal(C11B_OBJ.act2, '第3部　第3章　第3幕へ（続きはアップデートで！）');
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH11B_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH11B_PROGRESS[i]; if (c.flags[k]) return t; } return null; };
  for (const f of [C11B_ACT0, ...C11B_LINE]) {
    const fl = UPTO(f);
    assert.equal(prog(fl), objective11b(hasOf(fl)), f);
  }
  for (const t of C11B_OBJ_ALL) {
    assert.ok(CH11B_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH11B_OBJECTIVE_TARGETS[t]) assert.ok(MAPS[p.map] && !isBlocked(MAPS[p.map], p.x, p.y, () => true) || MAPS[p.map].warpAt.has(p.y * MAPS[p.map].w + p.x) || MAPS[p.map].npcs.some((n) => n.x === p.x && n.y === p.y), `${t} ${p.map} ${p.x},${p.y}`);
    const talk = CH11B_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
  // 第1幕の さいごの 場面は act1ClearObjective（前の 幕の テストが まぜなおしても 同じ 文）
  const pir = JSON.stringify(SCRIPTS.c11a_pirate_event(ctx(flagsOf(...UPTO('c11a_beast'), 'c11a_light1', 'c11a_light2', 'c11a_light3'))));
  assert.ok(pir.includes(act1ClearObjective()));
});

test('前の 章を こわさない: 星の海に 足したのは 門の むこう（きりの 先）と 場面 0 の マスだけ', () => {
  const sea = MAPS.c11_sea;
  for (let y = SEA_GATE11A.y; y < sea.h; y++) for (let x = 0; x < sea.w; x++) {
    const t = sea.tiles[y * sea.w + x];
    assert.ok(t < C11B_TILE_FIRST || t > C11B_TILE_LAST, `${x},${y} は 前の まま`);
  }
  for (const g of sea.gates.filter((q) => q.flag === C11B.start)) assert.ok(g.y < SEA_GATE11A.y);
  for (const w of sea.warps.filter((q) => q.to.map.startsWith('c11b_'))) assert.ok(w.y < SEA_GATE11A.y, '都の はとばは 門の むこう');
  const add = sea.triggers.filter((t) => /^c11b_/.test(t.script));
  assert.deepEqual(add.map((t) => [t.script, t.x, t.y, t.w, t.h]), [['c11b_start_event', SEA_SCENE0_11B.x, SEA_SCENE0_11B.y, SEA_SCENE0_11B.w, SEA_SCENE0_11B.h]]);
  for (const f of [() => false, hasOf(UPTO('c11a_pirate'))]) assert.ok(!condOk(add[0].show, f), '第1幕を クリアするまで 出ない');
  // 前の 幕の 場面（船長）の マスは 第1幕 クリアの あと 出ない（場面 0 と かさならない）
  const pir = sea.triggers.find((t) => t.script === 'c11a_pirate_event');
  assert.ok(!condOk(pir.show, hasOf(UPTO(C11B_ACT0))));
});

test('おもてと うらの 形が 同じ: 同じ 大きさ・まわりの かべ・月かげの 戸の 場所・もとの 形の かべ', () => {
  const ROWS = [CITY_ROWS11B, TOWER_ROWS11B[1], TOWER_ROWS11B[2], TOWER_ROWS11B[3]];
  C11B_PAIRS.forEach(([fid, bid], n) => {
    const F = MAPS[fid], B = MAPS[bid];
    assert.equal(F.w, B.w); assert.equal(F.h, B.h);
    assert.equal(F.c11b.other, bid); assert.equal(B.c11b.other, fid);
    assert.equal(F.c11b.side, 0); assert.equal(B.c11b.side, 1);
    const doors = (m) => { const out = []; for (let i = 0; i < m.tiles.length; i++) if (m.tiles[i] === T.C11B_DOOR) out.push(i); return out; };
    assert.deepEqual(doors(F), doors(B), `${fid}: 戸の 場所`);
    assert.ok(doors(F).length >= 2);
    for (let y = 0; y < F.h; y++) for (let x = 0; x < F.w; x++) {
      const ch = ROWS[n][y][x];
      if (ch === '#') assert.ok(isBlocked(F, x, y, () => true) && isBlocked(B, x, y, () => true), `${fid} ${x},${y} かべ`);
      if (x === 0 || y === 0 || x === F.w - 1 || y === F.h - 1) {
        if (!F.warpAt.has(y * F.w + x)) assert.ok(isBlocked(F, x, y, () => true), `${fid} ${x},${y} まわり`);
        if (!B.warpAt.has(y * B.w + x)) assert.ok(isBlocked(B, x, y, () => true), `${bid} ${x},${y} まわり`);
      }
      // 戸の 両がわは 立てる
      if (ch === 'D') assert.ok(!isBlocked(F, x, y, () => false) && !isBlocked(B, x, y, () => false), `${fid} 戸 ${x},${y}`);
    }
    // おもてと うらは 色で すぐ わかる（ゆかの 地図の 色が ちがう）
    const col = (m) => new Set(Array.from(m.tiles).map((t) => TILE_INFO[t]?.mapColor));
    const both = [...col(F)].filter((c) => col(B).has(c));
    assert.ok(both.length <= 3, `${fid}: 同じ 色は 戸など だけ ${both}`);
  });
});

test('どの 区切りも とける・行き止まりが ない（道さがし）・星の海の 北も 流れで 行き止まりが ない', () => {
  const base = hasOf([C11B.rule, C11B.start, C11B_ACT0]);
  const doorsUsed = {};
  for (const S of C11B_SECTIONS) {
    const path = solve11b(S, S.start, base);
    assert.ok(path, `${S.id} は とける`);
    const acts = path.filter((p) => p.act).map((p) => p.act.kind);
    doorsUsed[S.id] = acts.filter((k) => k === 'door').length;
    console.log(`  ${S.id}: ${path.length}歩 ${path.filter((p) => p.act).map((p) => `${p.act.kind}@${p.act.x},${p.act.y}`).join(' → ')}`);
    const R = reachable11b(S, base);
    for (const st of R.states) {
      const has = (f) => { const i = R.flags.indexOf(f); return i >= 0 ? !!(st[3] & (1 << i)) : base(f); };
      assert.ok(solve11b(S, { side: st[0], x: st[1], y: st[2] }, has), `${S.id}: ${st} から 出口へ 行ける（行き止まりが ない）`);
    }
  }
  // 町の 区切りは おもてと うらを 2〜4回 乗りかえる
  for (const id of ['c1', 'c2', 'c3']) assert.ok(doorsUsed[id] >= 2 && doorsUsed[id] <= 4, `${id}: ${doorsUsed[id]}回`);
  // 区切りごとの きまり: 塔 1階 … 光の ゆか・2階 … ランプ（かげの 橋）・3階 … 両方
  const kinds = (id) => new Set(solve11b(SEC[id], SEC[id].start, base).filter((p) => p.act).map((p) => p.act.kind));
  assert.ok(kinds('t1').has('floor') && !kinds('t1').has('lamp'));
  assert.ok(kinds('t2').has('lamp') && !kinds('t2').has('floor'));
  assert.ok(kinds('t3').has('lamp') && kinds('t3').has('floor'));
  for (const id of ['c1', 'c2', 'c3']) assert.ok(!kinds(id).has('lamp') && !kinds(id).has('floor'), `${id} は きほん`);
  // 塔 2階: ランプを 1つ ともすと ほかの 色は 消える（橋が 動く）
  const P2 = pairOf11b(2);
  assert.deepEqual([...new Set(P2.lamps.map((q) => q.f))].length, 2);
  // 星の海の 北: きりが 晴れると 都の はとばへ 行ける・どこで 止まっても 橋の先の はとばへ もどれる
  const sea = MAPS.c11_sea;
  const has = hasOf([...UPTO(C11B.start)]);
  const R = flowReach(sea, [SEA_ARRIVE11A.x, SEA_ARRIVE11A.y], has);
  assert.ok(R.pits.has(`${SEA_MOON_PIER11B.x},${SEA_MOON_PIER11B.y}`), '都の はとば');
  const dock = `${SEA_BRIDGE11A[0].x},${SEA_BRIDGE11A[0].y}`;
  for (const k of new Set([...R.stops, `${SEA_MOON_OUT11B.x},${SEA_MOON_OUT11B.y}`])) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(flowReach(sea, [x, y], has).pits.has(dock), `${k} から 橋の先へ`);
  }
  // 都 ⇔ 星の海
  assert.ok(sea.warps.some((w) => w.x === SEA_MOON_PIER11B.x && w.y === SEA_MOON_PIER11B.y && w.to.map === C11B_MAP.front));
  assert.ok(MAPS.c11b_front.warps.some((w) => w.to.map === 'c11_sea' && Math.floor(w.to.x) === SEA_MOON_OUT11B.x && Math.floor(w.to.y) === SEA_MOON_OUT11B.y));
});

test('サーバー: 月かげの 戸（乗って A で 同じ 場所の もう 片方・ついていく 仲間も）・光の ゆか・ランプと かげの 橋・橋が 消えたら よける', async () => {
  const world = fixedWorld(11201);
  const { bot, c } = await act0Player(world, 'ソラ', C11B.tower);
  const D = CITY_POS11B.door;
  await place(bot, C11B_MAP.front, D.x, D.y);
  await examine(bot, D.x, D.y - 1);
  assert.equal(bot.s.map, C11B_MAP.back);
  assert.deepEqual(tile(bot.s), [D.x, D.y], '同じ 場所の うら');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('うらに、出た')));
  await examine(bot, D.x + 1, D.y);
  assert.equal(bot.s.map, C11B_MAP.front, 'どの 向きでも 戸の 上なら もどる');
  // 戸の となりで 戸を しらべると 説明
  await place(bot, C11B_MAP.front, D.x + 1, D.y);
  await examine(bot, D.x, D.y);
  assert.equal(bot.s.map, C11B_MAP.front);
  assert.ok(said(bot, '三日月のしるし'));
  // 塔 1階: 光の ゆか → うらの 同じ 場所の とびら
  const F1 = MAPS.c11b_tower1.c11b.floors[0];
  const has = () => world.hasFlagFn(bot.s);
  assert.ok(isBlocked(MAPS.c11b_towerb1, F1.x, F1.y, has()), 'はじめは とじた とびら');
  await place(bot, C11B_MAP.tower1, F1.x + 1, F1.y);
  await stepOn(bot, F1.x, F1.y);
  assert.ok(c.flags[F1.f], 'しるし');
  assert.equal(effectiveTile(MAPS.c11b_tower1, F1.x, F1.y, has()), T.C11B_LIGHTFLOOR_ON);
  assert.equal(effectiveTile(MAPS.c11b_towerb1, F1.x, F1.y, has()), T.C11B_OPENDOOR);
  assert.ok(!isBlocked(MAPS.c11b_towerb1, F1.x, F1.y, has()));
  // 塔 2階: 青い ランプ → 下の 谷に 橋。金の ランプ → 青は 消えて 上の 谷に 橋
  const m2 = MAPS.c11b_tower2, b2 = MAPS.c11b_towerb2;
  const [blue, gold] = [m2.c11b.lamps.find((q) => q.c === 'a'), m2.c11b.lamps.find((q) => q.c === 'b')];
  const brBlue = b2.c11b.bridges.find((q) => q.f === blue.f), brGold = b2.c11b.bridges.find((q) => q.f === gold.f);
  assert.ok(isBlocked(b2, brBlue.x, brBlue.y, has()) && isBlocked(b2, brGold.x, brGold.y, has()), 'はじめは 橋が ない');
  await place(bot, C11B_MAP.tower2, blue.x + 1, blue.y);
  await examine(bot, blue.x, blue.y);
  assert.ok(c.flags[blue.f] && !isBlocked(b2, brBlue.x, brBlue.y, has()) && isBlocked(b2, brGold.x, brGold.y, has()));
  assert.equal(effectiveTile(m2, blue.x, blue.y, has()), T.C11B_LAMP_A_ON);
  // 青い 橋の 上に 立って いる 時に 金を ともすと、橋が 消えて 近くへ よける
  await place(bot, C11B_MAP.towerb2, brBlue.x, brBlue.y);
  c.flags[gold.f] = true;
  delete c.flags[blue.f];
  // （ランプを しらべた 時と 同じ しくみで よける。ここでは しるしを かえた あと 同じ よびだし）
  const { unstickAll } = await import('../public/js/shared/world/hazards.js');
  unstickAll(world, bot.s);
  assert.ok(!isBlocked(b2, ...tile(bot.s), has()), '谷の 上に いない');
  // ランプを しらべて かえる（青に もどす）
  await place(bot, C11B_MAP.tower2, blue.x + 1, blue.y);
  await examine(bot, blue.x, blue.y);
  assert.ok(c.flags[blue.f] && !c.flags[gold.f], '1つ ともすと ほかは 消える');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('青いランプが、ともった')));
});

test('助け（ホタル）: 同じ 区切りで 長く 歩いても すすまないと、次の 戸が 光る・すすむと 消える', async () => {
  const world = fixedWorld(11202);
  const { bot } = await act0Player(world, 'ソラ', C11B.rule);
  const S = SEC.c1;
  await place(bot, C11B_MAP.back, S.start.x, S.start.y);
  for (let i = 0; i < C11B_HELP_STEPS - 2; i++) await stepOn(bot, S.start.x, S.start.y - (i % 2 ? 0 : 1));
  await tickN(world, 2);
  assert.equal(lastSnap(bot), null, 'まだ 光らない');
  for (let i = 0; i < 4; i++) await stepOn(bot, S.start.x, S.start.y - (i % 2 ? 0 : 1));
  await tickN(world, 2);
  const h = lastSnap(bot)?.h;
  const want = nextHint11b(S, { side: 1, x: tile(bot.s)[0], y: tile(bot.s)[1] }, world.hasFlagFn(bot.s));
  assert.ok(h && want, '光った');
  assert.deepEqual(h, [want.x, want.y, want.kind]);
  assert.equal(h[2], 'door');
  assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('ホタル')));
  // 戸を くぐると 消える（もう 片方で 数えなおし）
  await runPath(bot, S);
  await tickN(world, 2);
  assert.equal(lastSnap(bot), null, '数えなおし');
  // 塔の 中は いつでも（光の ゆかが 先なら ゆか）
  await place(bot, C11B_MAP.tower1, 12, 17);
  bot.s.c11bHelp = { key: `t1|${pairOf11b(1).flags.map(() => 0).join('')}`, n: C11B_HELP_STEPS, hint: null };
  await stepOn(bot, 11, 17);
  await tickN(world, 2);
  assert.equal(lastSnap(bot)?.h?.[2], 'floor', '1階は まず 光の ゆか');
});

test('家族 2人: おもてと うらに 分かれて、ゆか・ランプを 同時に 使える（もう 片方に 知らせる・しるしは リーダー）・ひとりでも とける', async () => {
  const world = fixedWorld(11203);
  const { A, B, oA, oB } = await party2(world, C11B.tower);
  const F1 = MAPS.c11b_tower1.c11b.floors[0];
  // B（うら）は とびらの 前で 待つ・A（おもて）が ゆかを ふむ
  await place(B.bot, C11B_MAP.towerb1, F1.x + 1, F1.y, 'left', oB);
  await place(A.bot, C11B_MAP.tower1, F1.x + 1, F1.y - 1, 'down', oA);
  assert.ok(isBlocked(MAPS.c11b_towerb1, F1.x, F1.y, world.hasFlagFn(B.bot.s)));
  await stepOn(A.bot, F1.x + 1, F1.y, oA);
  await stepOn(A.bot, F1.x, F1.y, oA);
  assert.ok(A.c.flags[F1.f], 'リーダーの しるし');
  assert.ok(B.bot.msgs.some((m) => m.t === 'toast' && m.text.includes('おもてで、光のゆかを、ふんだ')), 'うらの B に 知らせ');
  await stepOn(B.bot, F1.x, F1.y, oB);
  assert.deepEqual(tile(B.bot.s), [F1.x, F1.y], 'B は すぐ 通れる');
  // B（仲間）が おもてで ランプを ともしても リーダーの しるし。A（うら）に 知らせ
  const m2 = MAPS.c11b_tower2;
  const blue = m2.c11b.lamps.find((q) => q.c === 'a');
  await place(A.bot, C11B_MAP.towerb2, 10, 17, 'up', oA);
  await place(B.bot, C11B_MAP.tower2, blue.x + 1, blue.y, 'left', oB);
  await examine(B.bot, blue.x, blue.y, oB);
  assert.ok(A.c.flags[blue.f] && !B.c.flags[blue.f], 'しるしは リーダー');
  assert.ok(A.bot.msgs.some((m) => m.t === 'toast' && m.text.includes('青いランプを、ともした')));
  // 2人の 方が 戸を くぐる 回数が 少ない（2階: A は うらの 谷を わたり、B は おもてで ランプ）
  const S2 = SEC.t2;
  const one = solve11b(S2, S2.start, hasOf([C11B.rule])).filter((p) => p.act?.kind === 'door').length;
  const P = pairOf11b(2);
  void P;
  // A: うらだけで 歩く（B が 先に ランプを 用意する 形 … 青 → わたる → 金 → わたる）
  await place(A.bot, C11B_MAP.towerb2, S2.start.x, S2.start.y, 'up', oA);
  const bridgeA = MAPS.c11b_towerb2.c11b.bridges.filter((q) => q.f === blue.f);
  await walkTo(A.bot, bridgeA[0].x, bridgeA[0].y + 2, oA);
  for (const q of [...bridgeA].sort((a, b) => b.y - a.y)) await stepOn(A.bot, q.x, q.y, oA);
  await stepOn(A.bot, bridgeA[0].x, Math.min(...bridgeA.map((q) => q.y)) - 1, oA);
  const gold = m2.c11b.lamps.find((q) => q.c === 'b' && q.y > 7);
  await place(B.bot, C11B_MAP.tower2, gold.x - 1, gold.y, 'right', oB);
  await examine(B.bot, gold.x, gold.y, oB);
  const bridgeG = MAPS.c11b_towerb2.c11b.bridges.filter((q) => q.f === gold.f);
  await walkTo(A.bot, bridgeG[0].x, Math.max(...bridgeG.map((q) => q.y)) + 1, oA);
  for (const q of [...bridgeG].sort((a, b) => b.y - a.y)) await stepOn(A.bot, q.x, q.y, oA);
  assert.equal(A.bot.s.map, C11B_MAP.towerb2);
  assert.ok(tile(A.bot.s)[1] <= Math.min(...bridgeG.map((q) => q.y)), 'A は 戸を くぐらずに 上の 床へ');
  assert.ok(one >= 5, `ひとりだと 戸を ${one}回`);
});

test('サーバー: 回線が 切れて すぐ もどる（同じ セッションを ひきつぐ）→ 消えた 橋の 上なら 近くの 立てる マス・あけた とびらは そのまま', async () => {
  const world = fixedWorld(11204, { offline: false, checkPassword: () => true });
  const A = await act0Player(world, 'ソラ', C11B.tower);
  const b2 = MAPS.c11b_towerb2;
  const [bl, gd] = ['c11b_d4', 'c11b_d5'];
  A.c.flags[bl] = true;
  A.c.flags.c11b_d1 = true;
  const br = b2.c11b.bridges.find((q) => q.f === bl);
  await place(A.bot, C11B_MAP.towerb2, br.x, br.y);
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  delete A.c.flags[bl];
  A.c.flags[gd] = true;
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, C11B_MAP.towerb2);
  assert.ok(!isBlocked(b2, ...tile(A2.s), world.hasFlagFn(A2.s)), '立てる マス');
  assert.ok(A.c.flags.c11b_d1, 'あけた とびらは そのまま（セーブ）');
});

test('通し（ひとり）: 星座の門の むこう → 月の都（おもて → うら）→ うら道 → 名前の 塔 1〜3階 → 番人 → スピカの ランプ → オボロ → c11_act2', async () => {
  const world = fixedWorld(11205);
  const { bot, c } = await act0Player(world, 'ソラ', C11B_ACT0);
  const fought = [];
  let spica = null;
  const real = (id) => {
    for (const c2 of world.battles.values()) if (c2.opts.fixed === C11B_BATTLE.oboro && !spica) spica = spicaOf(c2.battle);
    void id;
    return null;
  };
  const o = { fought, real };
  // 0 門の むこう（きりが 晴れる）
  const S0 = SEA_SCENE0_11B;
  await place(bot, 'c11_sea', S0.x + 4, S0.y + S0.h, 'up', o);
  await stepOn(bot, S0.x + 4, S0.y + S0.h - 1, o);
  assert.ok(c.flags[C11B.start] && said(bot, C11B_TITLE.act));
  assert.equal(c.objective, C11B_OBJ.city);
  assert.equal(effectiveTile(MAPS.c11_sea, 31, 36, world.hasFlagFn(bot.s)), T.C11A_SEA, 'きりが 晴れた');
  // 都の はとばへ（流れで 行ける ことは 上の テスト）
  await place(bot, 'c11_sea', SEA_MOON_OUT11B.x, SEA_MOON_OUT11B.y, 'up', o);
  await stepOn(bot, SEA_MOON_PIER11B.x, SEA_MOON_PIER11B.y, o);
  assert.equal(bot.s.map, C11B_MAP.front);
  // M1・M2
  await stepOn(bot, CITY_POS11B.harbor.x, CITY_POS11B.harbor.y - 1, o);
  assert.ok(c.flags[C11B.plaza] && said(bot, '名前のランプ'));
  await stepOn(bot, CITY_POS11B.harbor.x, CITY_POS11B.harbor.y - 2, o);
  assert.ok(c.visited?.[C11B_PLACE], 'ルーラで 行ける');
  assert.equal(c.objective, C11B_OBJ.hotaru);
  // M3 ホタル → 月かげの 戸 → U1
  await talkTo(bot, C11B_MAP.front, 'c11b_hotaru', 0, o);
  assert.ok(said(bot, '月かげの戸'));
  const D = CITY_POS11B.door;
  await place(bot, C11B_MAP.front, D.x, D.y, 'up', o);
  await examine(bot, D.x, D.y - 1, o);
  assert.equal(bot.s.map, C11B_MAP.back);
  await stepOn(bot, D.x, D.y - 1, o);
  assert.ok(c.flags[C11B.back] && c.flags[C11B.rule] && said(bot, '光のはかり'));
  assert.equal(c.objective, C11B_OBJ.tower);
  assert.ok(!isBlocked(MAPS.c11b_back, CITY_POS11B.rule.x, CITY_POS11B.rule.y, world.hasFlagFn(bot.s)), 'うら道の 入口が あいた');
  // D1 うら道（区切り 1〜3）
  await walkTo(bot, CITY_POS11B.rule.x, CITY_POS11B.rule.y + 1, o);
  for (const id of ['c1', 'c2', 'c3']) await runPath(bot, SEC[id], o);
  await stepOn(bot, CITY_POS11B.tower.x, CITY_POS11B.tower.y, o);
  assert.equal(bot.s.map, C11B_MAP.tower1);
  // T1 塔
  await stepOn(bot, TOWER_POS11B[1].arrive.x - 1, TOWER_POS11B[1].arrive.y, o);
  assert.ok(c.flags[C11B.tower]);
  await runPath(bot, SEC.t1, o);
  await stepOn(bot, TOWER_POS11B[1].up.x, TOWER_POS11B[1].up.y, o);
  assert.equal(bot.s.map, C11B_MAP.towerb2);
  await runPath(bot, SEC.t2, o);
  await stepOn(bot, TOWER_POS11B[2].up.x, TOWER_POS11B[2].up.y, o);
  assert.equal(bot.s.map, C11B_MAP.tower3);
  await runPath(bot, SEC.t3, o);
  assert.deepEqual(fought.filter((f) => f === C11B_BATTLE.keeper), [C11B_BATTLE.keeper], '番人は 1回');
  assert.ok(c.flags[C11B.keeper] && c.flags[C11B.lamp] && c.keyItems?.includes(NAME_LAMP));
  assert.ok(said(bot, 'ひとりむすめ'));
  assert.equal(c.objective, C11B_OBJ.terrace);
  // T3 テラス
  await walkTo(bot, TOWER_POS11B[3].terrace.x, TOWER_POS11B[3].terrace.y + 1, o);
  await stepOn(bot, TOWER_POS11B[3].terrace.x, TOWER_POS11B[3].terrace.y, o);
  assert.ok(fought.includes(C11B_BATTLE.oboro));
  assert.ok(spica, 'ボス戦に スピカが いる');
  assert.ok(c.flags[C11B.oboro] && c.flags[C11B.act2]);
  assert.equal(c.objective, act2ClearObjective()); // 第103回 A班: 第3幕が 開くと 第3幕の はじめの 目標
  assert.equal(storyPlace(c).label, '第3部 第3章 第2幕');
  assert.ok(storyPlace(c).cleared);
  // 使った しるしは 12こ まで（セーブに のこる 物）
  assert.ok(Object.keys(c.flags).filter((f) => /^c11b_d/.test(f)).length <= C11B_MARK_MAX);
});

// ───────────── 第102回 C1班: 1マス はばの 道の 曲がりかど（スマホの スティック）─────────────
test('かど: うら道・塔への 道・塔の 中の 1マス はばの 曲がりかどは 内がわを 広げた（同じ 形の きまりの まま）・かどで すべる（スティックが ななめでも まがれる。第102回 M1班から みんなの 歩き方）', async () => {
  const { Field } = await import('../public/js/client/field.js');
  const { walkStep } = await import('../public/js/client/walk.js');
  const ALL = () => true;
  const IDS = ['c11b_front', 'c11b_back', 'c11b_tower1', 'c11b_towerb1', 'c11b_tower2', 'c11b_towerb2', 'c11b_tower3', 'c11b_towerb3'];
  for (const id of IDS) assert.ok(MAPS[id]?.c11b, id);
  // 1) 広げた マス（もとの 形の 文字。道と 同じ 文字 … おもて／うらの どちらで 通れるかは かわらない）
  const city = CITY_ROWS11B;
  for (const [x, y] of [[18, 3], [11, 9], [19, 16], [9, 23], [17, 15], [19, 15]]) assert.equal(city[y][x], 'b', `おもての 細道 ${x},${y}`);
  for (const [x, y] of [[25, 5], [26, 13], [29, 18], [29, 21], [27, 25]]) assert.equal(city[y][x], 'f', `うら道 ${x},${y}`);
  assert.equal(TOWER_ROWS11B[1][14][3], '.');
  assert.equal(TOWER_ROWS11B[1][7][19], 'f');
  assert.equal(TOWER_ROWS11B[3][20][4], '.');
  // 宝箱・戸・ゆか・ランプ・階段の 場所は そのまま
  for (const [x, y, ch] of [[29, 8, 'c'], [14, 14, 'c'], [8, 21, 'c'], [20, 4, 'D'], [16, 8, 'D'], [10, 12, 'D'], [27, 14, 'D'], [24, 17, 'D'], [14, 22, 'D'], [21, 24, 'D'], [17, 1, 'T'], [28, 26, 'R']]) assert.equal(city[y][x], ch, `${x},${y}`);
  for (const [f, x, y, ch] of [[1, 4, 15, 'L'], [1, 11, 8, 'L'], [1, 7, 6, 'L'], [1, 20, 15, 'D'], [1, 9, 9, 'D'], [1, 20, 2, 'u'], [1, 7, 4, 'c'], [3, 4, 21, 'L'], [3, 12, 21, 'D'], [3, 19, 13, 'P'], [3, 20, 14, 'c']]) assert.equal(TOWER_ROWS11B[f][y][x], ch, `${f}階 ${x},${y}`);
  // 2) 町の 外・塔の 中に「1マス はばの 道の L の かど（内がわも かべ）」が のこって いない（宝箱の 前・階段の となりの くぼみは のぞく）
  const left = [];
  for (const id of IDS) {
    const m = MAPS[id];
    const ok = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !isBlocked(m, x, y, ALL);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!ok(x, y) || (m.c11bCity && y >= 27)) continue;
      const n = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => ok(x + dx, y + dy));
      if (n.length !== 2 || n[0][0] + n[1][0] === 0) continue;
      if (!ok(x + n[0][0] + n[1][0], y + n[0][1] + n[1][1])) left.push(`${id} ${x},${y}`);
    }
  }
  assert.deepEqual(left, ['c11b_tower2 21,17', 'c11b_towerb3 20,14'], '階段の となりの くぼみ・宝箱の 前 だけ');
  // 3) かどで すべる: 第102回 M1班で みんなの 歩き方（client/walk.js の walkStep）に うつした（この 幕だけの しくみは 外した）
  const src = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.match(src, /else moved = walkStep\(\(x, y\) => this\.boxFree\(x, y\), me, ix, iy, sp\);/);
  assert.doesNotMatch(src, /c11bCornerSlide/);
  const fieldOf = (m, me = { x: 0, y: 0 }) => Object.assign(Object.create(Field.prototype), {
    map: m, me, npcState: new Map(), scriptHidden: new Set(), followAuto: false, game: { me: { flags: {}, chests: {} } }, hasFlag: () => true,
  });
  // 4) まがれるか（field.js の いどうの 行と 同じ 形。かどの マスに 入りぐあい f で 入って、ななめ ±25° まで ずらして 1.2 秒）
  const fails = [];
  let turns = 0;
  for (const id of IDS) {
    const m = MAPS[id];
    const f0 = fieldOf(m);
    const ok = (x, y) => !f0.solidAt(x, y);
    const run = (me, ix, iy) => {
      const fld = fieldOf(m, me);
      const sp = 4.6 * 0.016;
      walkStep((x, y) => fld.boxFree(x, y), me, ix, iy, sp);
    };
    for (let y = 1; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
      if (!ok(x, y) || (m.c11bCity && y >= 27)) continue;
      const nb = [[0, -1], [1, 0], [0, 1], [-1, 0]].filter(([dx, dy]) => ok(x + dx, y + dy));
      for (const a of nb) for (const b of nb) {
        if (a[0] * b[0] + a[1] * b[1] !== 0) continue;
        const narrow = (d) => !ok(x + d[0] - d[1], y + d[1] + d[0]) && !ok(x + d[0] + d[1], y + d[1] - d[0]);
        if (!narrow(a) || !narrow(b)) continue;
        turns++;
        for (const f of [0.05, 0.3, 0.6, 0.97]) for (const deg of [-25, -15, 0, 15, 25]) {
          const me = { x: x + a[0] + 0.5, y: y + a[1] + 0.5 };
          for (let k = 0; k < 200; k++) {
            const fr = a[0] ? (a[0] < 0 ? me.x - x : x + 1 - me.x) : (a[1] < 0 ? me.y - y : y + 1 - me.y);
            if (Math.floor(me.x) === x && Math.floor(me.y) === y && fr >= f) break;
            run(me, -a[0], -a[1]);
          }
          const r = (deg * Math.PI) / 180;
          for (let k = 0; k < 75; k++) run(me, b[0] * Math.cos(r) - b[1] * Math.sin(r), b[0] * Math.sin(r) + b[1] * Math.cos(r));
          if ((Math.floor(me.x) - x) * b[0] + (Math.floor(me.y) - y) * b[1] < 1) fails.push(`${id} ${x},${y} ${a}→${b} f${f} ${deg}°`);
        }
      }
    }
  }
  assert.ok(turns >= 10, `かどの 数 ${turns}`);
  assert.deepEqual(fails, []);
});
