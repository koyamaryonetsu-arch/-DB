// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」（第103回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c11_act2 → 名前の 塔の 前（アルゴル c11c_start）→ 3人組の メカ 3号（c11c_mecha）→ アルゴルが いっしょに（c11c_join）
//   → うらの 町の 古い 戸 → はかりの 回ろう 1〜3階（c11c_h1・ひと休みの 部屋 c11c_h2・c11c_rest）→ 大とびらの 前（c11c_h3）→ 隊長（c11c_ace）→ c11_act3
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当に 戦う 通しは test/ch11-act3.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { MAPS, isBlocked, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C11C, C11C_ACT0, C11C_LINE, C11C_MAP, C11C_MAP_IDS, C11C_HALL_MAPS, C11C_CHEST_IDS, C11C_TILE_FIRST, C11C_TILE_LAST, C11C_TRACKS, C11C_TRACK_IDS,
  C11C_BATTLE, C11C_HELP_STEPS, C11C_ACE_NAME, C11C_ACE_SHORT, C11C_MECHA_NAME, C11C_FLOOR_FLAGS,
} from '../public/js/shared/maps/c11c-flags.js';
import { CH11C_MAPS, fenceOpen11c, pedAt11c, laneAt11c } from '../public/js/shared/maps/c11c.js';
import { HALL_ROWS11C, HALL_POS11C, CITY_POS11C, DOOR_POS11C, C11C_RANGE } from '../public/js/shared/maps/c11c-rows.js';
import { C11B_LINE, C11B_MAP_IDS } from '../public/js/shared/maps/c11b-flags.js';
import { solve11c, reachable11c, nextHint11c, canRecall11c, algolPed11c } from '../public/js/shared/world/c11c-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH11_STEPS, PART3_C11C_OPEN, c11cTitleSteps, CH11_PROGRESS, CH11_OBJECTIVE_TARGETS, act2ClearObjective, C11C_TITLE,
} from '../public/js/shared/data/story-c11.js';
import { C11B_OBJ } from '../public/js/shared/data/story-c11b.js';
import {
  C11C_OBJ, C11C_OBJ_ALL, CH11C_STORY_SCRIPTS, CH11C_PROGRESS, CH11C_OBJECTIVE_TARGETS, CH11C_OBJECTIVE_TALK, c11cScripts, applyCh11c, objective11c,
} from '../public/js/shared/data/story-c11c.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { C11C_BACK_ADD } from '../public/js/shared/data/items-c11c.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, addPlayer, play, place, stepOn, examine, talkTo, walkTo, fixedWorld } from './c9a-play.js';

// 本体の 台本（テストが 幕を 開けた 形を まぜる 前）
const BODY = { start: SCRIPTS.c11c_start_event, oboro: SCRIPTS.c11b_oboro_event };
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES11C = ['public/js/shared/maps/c11c-flags.js', 'public/js/shared/data/story-c11c.js', 'public/js/shared/maps/c11c.js', 'public/js/shared/maps/c11c-rows.js',
  'public/js/shared/world/c11c-steps.js', 'public/js/client/c11c-view.js', 'public/js/client/render/tiles-c11c.js', 'public/js/client/render/c11c-npc-art.js'];
const openScripts = () => c11cScripts(c11cTitleSteps, true);
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh11c(SCRIPTS, STORY_SCRIPTS, { title: c11cTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const tile = (s) => [Math.floor(s.x), Math.floor(s.y)];
const lastSnap = (bot) => [...bot.msgs].reverse().find((m) => m.t === 'snap')?.c11c || null;
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);
const H = (n) => MAPS[C11C_MAP[`hall${n}`]];

async function act0Player(world, name, upto = C11C_ACT0, job) {
  openAct();
  const P = await addPlayer(world, name, upto, [], job);
  P.c.objective = objective11c((f) => !!P.c.flags[f]);
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
// 道さがしの とおりに 動く（画面と 同じ: 歩く・台の 上で A・台の ない 所で A → 「よびもどす」）
async function runHall(bot, n, opts) {
  const map = H(n);
  const [x0, y0] = tile(bot.s);
  const path = solve11c(map, { x: x0, y: y0 }, algolPed11c(bot.world, bot.s));
  assert.ok(path, `${map.id} ${x0},${y0} から 出口へ`);
  for (const step of path) {
    const [x, y, a] = step.st;
    if (step.act?.kind === 'call') {
      await examine(bot, x, y - 1, opts);
      assert.equal(algolPed11c(bot.world, bot.s), a, `${map.id}: アルゴルが ${x},${y} の 台へ`);
    } else if (step.act?.kind === 'recall') {
      bot.choice = 0;
      await examine(bot, x, y - 1, opts);
      assert.equal(algolPed11c(bot.world, bot.s), -1, `${map.id}: よびもどした`);
    } else await stepOn(bot, x, y, opts);
  }
  return path;
}

test('名前の 約束: マップ 5まい・タイル 701〜740・宝箱の id・一本の 線・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH11C_MAPS, ['c11c_hall1', 'c11c_hall2', 'c11c_rest', 'c11c_hall3', 'c11c_door']);
  for (const id of C11C_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」の 地図を 取らない（セーブを 小さく）`);
    assert.ok(C11C_TRACK_IDS.includes(m.bgm), `${id} の 曲は この 幕の id`);
    assert.ok(m.c11cAlgol, `${id} は アルゴルが いっしょ`);
  }
  for (const id of C11C_HALL_MAPS) assert.equal(MAPS[id].bgm, C11C_TRACKS.hall);
  assert.equal(MAPS.c11c_rest.bgm, C11C_TRACKS.rest);
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C11C_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.ok(ids.length && ids.every((v) => v >= C11C_TILE_FIRST && v <= C11C_TILE_LAST), 'タイル 701〜740');
  for (const v of ids) assert.ok(TILE_INFO[v], `TILE_INFO ${v}`);
  // 宝箱 8こ
  const chests = C11C_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id)).sort();
  assert.deepEqual(chests, [...C11C_CHEST_IDS].sort());
  // 一本の 線（c11_act2 の うしろ）。階を 通った しるしも 線の 中
  const j = STORY_STEPS.indexOf(C11C_ACT0);
  // 第104回 A班: うしろに 第4幕の 線が つづく（線の 場所は 名前で さがす）
  assert.deepEqual(STORY_STEPS.slice(j + 1, j + 1 + C11C_LINE.length), C11C_LINE);
  const k = CH11_STEPS.indexOf(C11B_LINE[0]);
  assert.deepEqual(CH11_STEPS.slice(k, k + C11B_LINE.length + C11C_LINE.length), [...C11B_LINE, ...C11C_LINE]);
  assert.deepEqual(Object.values(C11C_FLOOR_FLAGS), [C11C.h1, C11C.h2, C11C.h3]);
  // 台本（パーティーで 見る）・やり直しの 行き先（ノクト）
  openAct();
  for (const id of CH11C_STORY_SCRIPTS) { assert.ok(SCRIPTS[id], id); assert.ok(STORY_SCRIPTS.has(id), `${id} は パーティーで 見る`); }
  for (const m of [...C11C_MAP_IDS, ...C11B_MAP_IDS].map((id) => MAPS[id])) {
    for (const n of m.npcs) assert.ok(SCRIPTS[n.script], `${m.id} ${n.id}`);
    for (const a of m.actions) assert.ok(SCRIPTS[a.script], `${m.id} ${a.script}`);
    for (const t of m.triggers) assert.ok(SCRIPTS[t.script], `${m.id} ${t.script}`);
  }
  assert.equal(BOSS_RETRY[C11C_BATTLE.mecha], 'c11c_mecha_event');
  assert.equal(BOSS_RETRY[C11C_BATTLE.ace], 'c11c_ace_event');
  assert.equal(BOSS_HINT_WHO[C11C_BATTLE.mecha], 'ノクト');
  assert.equal(BOSS_HINT_WHO[C11C_BATTLE.ace], 'ノクト');
  assert.ok(MAPS.c11b_front.triggers.some((t) => t.script === 'c11c_mecha_event'));
  assert.ok(MAPS.c11c_door.triggers.some((t) => t.script === 'c11c_ace_event'));
  // 曲（19-5 の 表）
  const S = openScripts();
  const sc = (id, ...fl) => JSON.stringify(S[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c11c_start_event', C11C_ACT0).includes(`"${C11C_TRACKS.mecha}"`), '中ボスの 曲');
  assert.ok(sc('c11c_start_event', C11C_ACT0).includes(`"${C11C_TRACKS.join}"`), 'アルゴルが いっしょに（短い 曲）');
  assert.ok(sc('c11c_rest_event', C11C.h1).includes(`"${C11C_TRACKS.rest}"`), 'ひと休みの 曲');
  assert.ok(sc('c11c_door_event', C11C.rest).includes(`"${C11C_TRACKS.ace}"`), 'ボスの 曲');
  assert.ok(sc('c11c_door_event', C11C.rest).includes(`"${C11C_TRACKS.door}"`), '大とびらが 開く 曲');
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES11C) {
    const g = list.find((x) => x.endsWith(f));
    assert.ok(g, `gameFiles に ${f}`);
    assert.deepEqual(checkFile(gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f))).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の data/c11c-stub.js・B の data/c11c-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['c11c-stub.js', 'c11c-names-b.js']) assert.ok(!existsSync(new URL(`../public/js/shared/data/${f}`, import.meta.url)), `${f} は ない`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c11c-stub|c11c-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // 本物に つないだ: 宝箱（B班の 中み）・魔物の 表（階ごと）・戦い・ボスの 名前・うらの 町の 店（幕の クリアで 4つ）
  for (const id of C11C_MAP_IDS) for (const ch of MAPS[id].chests) assert.ok(ch.item && ITEMS[ch.item], `${ch.id} は B班の 品`);
  for (const n of [1, 2, 3]) assert.deepEqual(Object.keys(MAPS[`c11c_hall${n}`].spawnCounts), [`t11c_hall${n}`]);
  for (const id of ['c11c_rest', 'c11c_door']) assert.deepEqual(MAPS[id].spawnCounts, {}, `${id} では 出ない`);
  for (const id of Object.values(C11C_BATTLE)) assert.ok(FIXED_ENCOUNTERS[id]?.boss && FIXED_ENCOUNTERS[id].bgm === id, id);
  assert.equal(C11C_MECHA_NAME, 'バラバラン3号');
  assert.equal(C11C_ACE_NAME, '近衛の隊長エース');
  assert.equal(MONSTERS.c11c_ace.name, C11C_ACE_NAME);
  const shop = SHOPS.c11b_back_shop;
  assert.ok(!C11C_BACK_ADD.some((i) => shopItems(shop, () => false).includes(i)), 'クリアの 前は ない');
  assert.ok(C11C_BACK_ADD.every((i) => ITEMS[i] && shopItems(shop, (f) => f === C11C.act3).includes(i)), 'クリアで 4つ');
});

test('台本の きまり: 明かすのは アルゴルの わけ まで・女王は 声だけ・鏡と オボロは 立つ だけ・カイ・ソリトゥス・8つめの 音・もとの お話の 言葉を 書かない', () => {
  const S = openScripts();
  const all = Object.fromEntries([...C11C_LINE, C11C_ACT0].map((f) => [f, true]));
  const story = [
    S.c11c_start_event(ctx(flagsOf(C11C_ACT0))), S.c11c_mecha_event(ctx(flagsOf(C11C.start))), S.c11c_join_event(ctx(flagsOf(C11C.mecha))),
    S.c11c_hall1_event(ctx(flagsOf(C11C.join))), S.c11c_hall2_event(ctx(flagsOf(C11C.join))), S.c11c_rest_event(ctx(flagsOf(C11C.h1))),
    S.c11c_hall3_event(ctx(flagsOf(C11C.rest))), S.c11c_door_event(ctx(flagsOf(C11C.rest))), S.c11c_ace_event(ctx(flagsOf(C11C.h3))), S.c11c_end_event(ctx(flagsOf(C11C.ace))),
  ];
  for (const [i, st] of story.entries()) assert.ok(st.length, `場面 ${i}`);
  const others = [...Object.values(S).map((fn) => fn(ctx(all))), ...Object.values(S).map((fn) => fn(ctx({})))];
  for (const k of C11C_LINE) others.push(...Object.values(S).map((fn) => fn(ctx(flagsOf(...UPTO(k))))));
  const text = JSON.stringify([story, others]);
  for (const w of ['カイ', 'ソリトゥス', 'ネフィ', 'カリム', 'ミナモ', 'リオン', '勇者', 'ミラーレ', '8つめ', '八つめ', '女王',
    'アリス', 'ハート', '首を', 'はねよ', 'なぜ', 'どうして女王', 'queen']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  const says = [story, others].flat(2).filter((s) => Array.isArray(s) && s[0] === 'say');
  // 高い 所からの 声は「……スピカ。」の ひとこと だけ（だれかは 出さない）
  const voice = says.filter((s) => s[1] === '？？？');
  assert.ok(voice.length && voice.every((s) => s[2] === '……スピカ。'), '高い 所の 声は ひとこと');
  // 鏡と オボロは さいごに 立って いる だけ（せりふ なし）
  const end = JSON.stringify(story[7]);
  assert.ok(end.includes('c10d_mirror_f') && end.includes('c11b_oboro'), '鏡と オボロが 立つ');
  assert.ok(!says.some((s) => /鏡|オボロ/.test(String(s[1] || ''))), '鏡と オボロは 話さない');
  // アルゴルの わけ（ひと休みの 部屋）
  const rest = JSON.stringify(story[5]);
  for (const w of ['…ぼくも、光の、弱い星だ。', 'ながされた星の光を、食べて、線の上に、いた', '食べた光は、すぐに、消える', '…これが、ほんとうの、ぼくの光だ', '…きれい。', '…うそつけ。',
    'アルゴルさまの光が、すきなんでまんねん', '自分で「会いにいく」って、決めたのを、見た', 'ぼくの光で、はかりの前に、立ちたい']) assert.ok(rest.includes(w), `ひと休み: ${w}`);
  // 0 と J1: 屋根から 下りる・下の道・3人組の かんちがい・いっしょに 行こう
  const s0 = JSON.stringify(story[0]);
  for (const w of ['はかりの門は、光の強い者しか、通さない', '…下の道なら、知ってる。', 'アルゴルさまを、かえせ〜！', '…ばか。', 'ぼくが、たのんだんだ', '…いっしょに、行こう。', C11C_TITLE.act]) assert.ok(s0.includes(w), `場面 0: ${w}`);
  assert.ok(s0.indexOf(C11C_TITLE.act) < s0.indexOf('"battle"'), '題の 画面は 中ボスの 前');
  assert.equal(C11C_TITLE.act, '第3幕　はかりの回ろうと、ふたつの光');
  assert.ok(s0.includes(C11C_MECHA_NAME), 'メカの 名前は c11c-flags.js');
  // D1・E: 隊長の ことば・カードに もどる（たおれない）・かね・3人組の おべんとう・クリアの 題
  for (const w of ['はかりの日に、はかられぬ者は、通さぬ。', 'カードのよろいが、ばらばらと、ほどけて', 'かねが、鳴りひびく', 'おべんとう、わすれてまっせ〜！', '第3幕　クリア！', C11C_ACE_NAME]) {
    assert.ok(end.includes(w), `大とびら: ${w}`);
  }
  assert.ok(C11C_ACE_SHORT && end.includes(C11C_ACE_SHORT));
  // 3人組は いつもの 口ぶり（キラジョ … わよ・ボヤッチ … まんねん・まっせ・ズラッカ … ぜ）
  const trio = (who) => says.filter((s) => s[1] === who).map((s) => s[2]);
  assert.ok(trio('ボヤッチ').every((l) => /まんねん|まっせ|でっせ|〜！|…/.test(l)), 'ボヤッチの 口ぶり');
  assert.ok(trio('ズラッカ').every((l) => /ぜ/.test(l)), 'ズラッカの 口ぶり');
  // せりふは 短く（1行 30字 まで・2行 まで）
  for (const s of says) for (const l of s[2].split('\n')) assert.ok([...l].length <= 32, `長い 行: ${l}`);
});

test('閉じた 幕（PART3_C11C_OPEN）: 第2幕 クリアの あとも 何も かわらない（目標・塔の 前・うらの 町）・幕を 開けた 形も ためす', () => {
  const a2 = flagsOf(...UPTO(C11C_ACT0));
  const has2 = (f) => !!a2[f];
  const closed = c11cScripts(c11cTitleSteps, false);
  assert.deepEqual(closed.c11c_start_event(ctx(a2)), []);
  if (!PART3_C11C_OPEN) {
    assert.equal(act2ClearObjective(), C11B_OBJ.act2, '閉じて いる 間は「第3部　第3章　第3幕へ（続きは…）」の まま');
    assert.ok(!CH11_PROGRESS.some(([, t]) => C11C_OBJ_ALL.includes(t)), '第3幕の 目標は まだ ない');
    assert.ok(CH11_PROGRESS.some(([, t]) => t === C11B_OBJ.act2));
    assert.ok(!(C11C_OBJ.start in CH11_OBJECTIVE_TARGETS));
    assert.deepEqual(BODY.start(ctx(a2)), [], '本体の 台本も 始まらない');
    const ob = JSON.stringify(BODY.oboro(ctx(flagsOf(...UPTO('c11b_lamp')))));
    assert.ok(ob.includes(C11B_OBJ.act2), '第2幕の さいごの 場面の 目標も 今の まま');
  }
  assert.equal(act2ClearObjective(true), C11C_OBJ.start);
  // 月の都に 足した 物は、幕が 始まるまで 出ない（塔の 前の 場面の マスは 閉じて いる 間 から の 台本・うらの 戸は かべ）
  const back = MAPS.c11b_back, D = CITY_POS11C.hallDoor;
  assert.equal(effectiveTile(back, D.x, D.y, has2), T.C11B_B_HOUSE, 'うらの 町の 戸は まだ 小屋の かべ');
  assert.ok(isBlocked(back, D.x, D.y, has2));
  assert.ok(!condOk(back.warps.find((w) => w.x === D.x && w.y === D.y).show, has2), '戸の 出入り口も 出ない');
  for (const n of back.npcs.filter((q) => q.id.startsWith('c11c_'))) assert.ok(!condOk(n.show, has2), `${n.id} は 出ない`);
  const tr = MAPS.c11b_front.triggers.find((t) => t.script === 'c11c_start_event');
  assert.ok(tr && condOk(tr.show, has2) && !condOk(tr.show, () => false));
  for (const id of ['c11c_mecha_event', 'c11c_join_event']) assert.ok(!condOk(MAPS.c11b_front.triggers.find((t) => t.script === id).show, has2), id);
  // 開けた 形: アルゴルが 下りて 来て、題の 画面
  const open = openScripts();
  const st = JSON.stringify(open.c11c_start_event(ctx(a2)));
  assert.ok(st.includes(`"${C11C.start}"`) && st.includes(C11C_TITLE.act));
  assert.deepEqual(open.c11c_start_event(ctx(flagsOf(...UPTO('c11b_oboro')))), [], '第2幕の 間は 始まらない');
  assert.deepEqual(open.c11c_start_event(ctx({ ...a2, [C11C.start]: true })), [], '1回だけ');
  // しおり
  assert.equal(storyPlace({ flags: a2 }).label, '第3部 第3章 第2幕', '始まる 前は 第2幕 の まま');
  const sp = storyPlace({ flags: flagsOf(...UPTO(C11C.start)) });
  assert.equal(sp.label, '第3部 第3章 第3幕');
  assert.equal(sp.actTitle, 'はかりの回ろうと、ふたつの光');
});

test('目標: すすみぐあいから なおせる・行き先と ひとこと・第2幕 クリアの 目標の つなぎ', () => {
  const o = (...fl) => objective11c(hasOf([C11C_ACT0, ...fl]));
  assert.equal(o(), C11C_OBJ.start);
  assert.equal(o(C11C.start), C11C_OBJ.mecha);
  assert.equal(o(C11C.mecha), C11C_OBJ.talk);
  assert.equal(o(C11C.join), C11C_OBJ.hall);
  assert.equal(o(C11C.h1), C11C_OBJ.bridge);
  assert.equal(o(C11C.h2), C11C_OBJ.rest);
  assert.equal(o(C11C.rest), C11C_OBJ.card);
  assert.equal(o(C11C.h3), C11C_OBJ.ace);
  assert.equal(o(C11C.ace), C11C_OBJ.door);
  assert.equal(o(C11C.act3), C11C_OBJ.act3);
  assert.equal(C11C_OBJ.start, '月の都の、名前の塔の前へ。かげの少年が、待っている');
  assert.equal(C11C_OBJ.act3, '第3部　第3章　第4幕へ（続きはアップデートで！）');
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH11C_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH11C_PROGRESS[i]; if (c.flags[k]) return t; } return null; };
  for (const f of [C11C_ACT0, ...C11C_LINE]) {
    const fl = UPTO(f);
    assert.equal(prog(fl), objective11c(hasOf(fl)), f);
  }
  for (const t of C11C_OBJ_ALL) {
    assert.ok(CH11C_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH11C_OBJECTIVE_TARGETS[t]) assert.ok(MAPS[p.map] && !isBlocked(MAPS[p.map], p.x, p.y, () => true) || MAPS[p.map].warpAt.has(p.y * MAPS[p.map].w + p.x), `${t} ${p.map} ${p.x},${p.y}`);
    const talk = CH11C_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
  // 第2幕の さいごの 場面は act2ClearObjective（前の 幕の テストが まぜなおしても 同じ 文）
  const ob = JSON.stringify(SCRIPTS.c11b_oboro_event(ctx(flagsOf(...UPTO('c11b_lamp')))));
  assert.ok(ob.includes(act2ClearObjective()));
});

test('前の 章を こわさない: 月の都に 足したのは 塔の 前の 場面の マス・うらの 町の 古い 戸・3人組と アルゴル だけ（フラグで 出る）', () => {
  for (const id of C11B_MAP_IDS) {
    const m = MAPS[id];
    for (let i = 0; i < m.tiles.length; i++) assert.ok(m.tiles[i] < C11C_TILE_FIRST || m.tiles[i] > C11C_TILE_LAST, `${id} の タイルは 前の まま`);
    const add = [...m.triggers.filter((t) => /^c11c_/.test(t.script)), ...m.npcs.filter((n) => /^c11c_/.test(n.id)), ...m.warps.filter((w) => w.to.map.startsWith('c11c_'))];
    if (id === 'c11b_front') assert.deepEqual(add.map((t) => t.script), ['c11c_start_event', 'c11c_mecha_event', 'c11c_join_event']);
    else if (id === 'c11b_back') {
      assert.deepEqual(add.map((q) => q.id || q.to.map), ['c11c_algol', 'c11c_trio1', 'c11c_trio2', 'c11c_trio3', 'c11c_hall1']);
      for (const q of add) assert.ok(q.show?.all?.includes(C11C.join), `${q.id || q.to.map} は アルゴルが いっしょに なってから`);
    } else assert.deepEqual(add, [], id);
  }
  // 戸は 小屋の かべ（もとの 形の 文字は 家）。開くと 通れる・ふむと 回ろう 1階
  const back = MAPS.c11b_back, D = CITY_POS11C.hallDoor;
  const has = hasOf([...UPTO(C11C.join)]);
  assert.equal(effectiveTile(back, D.x, D.y, has), T.C11C_HALLDOOR);
  assert.ok(!isBlocked(back, D.x, D.y, has));
  assert.equal(back.warps.find((w) => w.x === D.x && w.y === D.y).to.map, C11C_MAP.hall1);
  assert.ok(!isBlocked(back, CITY_POS11C.hallDoorFront.x, CITY_POS11C.hallDoorFront.y, has), '戸の 前に 立てる');
  // 3人組と アルゴルは 戸の 前を ふさがない
  for (const n of back.npcs.filter((q) => q.id.startsWith('c11c_'))) assert.ok(!(n.x === CITY_POS11C.hallDoorFront.x && n.y === CITY_POS11C.hallDoorFront.y));
  // 塔の 前の 場面の マスは 塔から 出て 来た 所（c11b の towerBack）
  const tr = MAPS.c11b_front.triggers.find((t) => t.script === 'c11c_start_event');
  const out = MAPS.c11b_tower1.warps.find((w) => w.to.map === 'c11b_front').to;
  assert.ok(Math.floor(out.x) >= tr.x && Math.floor(out.x) < tr.x + tr.w && Math.floor(out.y) >= tr.y && Math.floor(out.y) < tr.y + tr.h, '塔から 出ると 場面の マス');
});

test('どの 階も とける・行き止まりが ない（道さがし）・階ごとに 新しい きまり', () => {
  const kinds = {};
  for (const n of [1, 2, 3]) {
    const map = H(n);
    const C = map.c11c;
    const path = solve11c(map, C.arrive, -1);
    assert.ok(path, `${map.id} は とける`);
    kinds[n] = path.filter((p) => p.act).map((p) => p.act.kind);
    console.log(`  ${map.id}: ${path.length}歩 ${path.filter((p) => p.act).map((p) => `${p.act.kind}@${p.st[0]},${p.st[1]}`).join(' → ')}`);
    // 入口から 行ける どの 状態（アルゴルが どの 台に いても）からも 出口へ 行ける
    const R = reachable11c(map);
    for (const [x, y, a] of R) assert.ok(solve11c(map, { x, y }, a), `${map.id}: ${x},${y} アルゴル ${a} から 出口へ（行き止まりが ない）`);
    // 動いて いる カードを よけて 通り道に 入った 人も（見つかると 入口に もどされる）
    for (const [x, y, a] of reachable11c(map, { sneak: true })) {
      const k = laneAt11c(map, x, y);
      const from = k >= 0 ? C.cards[k].back : { x, y };
      assert.ok(solve11c(map, from, a), `${map.id}: ${x},${y} アルゴル ${a}（カードを よけた 人）から 出口へ`);
    }
    // 台は さくの 上に ない・どの さくも 同じ 色の 台の 輪の 中・台 3〜4つ
    assert.ok(C.peds.length >= 3 && C.peds.length <= 4, `${map.id}: 台 ${C.peds.length}`);
    for (const P of C.peds) assert.ok(!C.fences.some((F) => F.cells.some((q) => q.x === P.x && q.y === P.y)));
    C.fences.forEach((F, g) => assert.ok(C.peds.some((P) => P.fences.includes(g)), `${map.id}: さく ${g} を 食べる 台が ある`));
    for (const P of C.peds) for (const g of P.fences) assert.ok(C.fences[g].c === P.c && C.fences[g].cells.some((q) => Math.hypot(q.x - P.x, q.y - P.y) <= C11C_RANGE));
  }
  // 1階 … きほん（台 3〜4つ・さく 4〜6つ）。よぶ だけで とける
  assert.ok(H(1).c11c.fences.length >= 4 && H(1).c11c.fences.length <= 6);
  assert.ok(kinds[1].every((k) => k === 'call') && kinds[1].length >= 3);
  assert.equal(H(1).c11c.bridges.length, 0); assert.equal(H(1).c11c.cards.length, 0);
  // 2階 … スピカの 光の 橋: 橋に 近い 台（橋が 消える）と 遠い 台。とき方は 遠い 台
  const C2 = H(2).c11c;
  assert.equal(C2.bridges.length, 1); assert.equal(C2.cards.length, 0);
  assert.ok(C2.peds.some((P) => P.bridges.length) && C2.peds.some((P) => !P.bridges.length && P.c === C2.peds.find((Q) => Q.bridges.length).c), '同じ 色で 橋に 近い 台と 遠い 台');
  const p2 = solve11c(H(2), C2.arrive, -1).filter((p) => p.act?.kind === 'call');
  assert.ok(p2.every((p) => !C2.peds[p.act.p].bridges.length), '橋を わたる 前に 橋に 近い 台は 使わない');
  // 橋に 近い 台に 立たせると、さくは 開くが 橋は わたれない（よびもどすと 橋が もどる）
  const near = C2.peds.findIndex((P) => P.bridges.length);
  assert.ok(fenceOpen11c(H(2), near, null, C2.peds[near].fences[0]));
  const B0 = C2.bridges[0].cells[0];
  assert.ok(isBlocked(H(2), B0.x, B0.y, (f) => (f.startsWith('@lb') ? false : f.startsWith('@cf'))), '橋が 消える');
  // 3階 … 見はりの カードと 橋（2つを 合わせた 短い 階）: カードを 止める 台は 橋も 食べる → 通り道の 先で よびもどす
  const C3 = H(3).c11c;
  assert.equal(C3.cards.length, 1);
  assert.ok(kinds[3].includes('recall'), '3階は よびもどす');
  assert.ok(C3.peds.some((P) => P.cards.length && P.bridges.length), 'カードを 止める 台は 橋に 近い');
  assert.ok(solve11c(H(3), C3.arrive, -1).length < solve11c(H(2), C2.arrive, -1).length + 10, '3階は 短い');
  // 助け: 入口では 次の 台が 光る
  for (const n of [1, 2, 3]) assert.equal(nextHint11c(H(n), H(n).c11c.arrive, -1).kind, 'ped');
  // よびもどすと 出られなく なる 所（1階の 東の 小部屋）では もどらない
  const D1 = H(1).c11c.peds.findIndex((P) => P.c === 'd');
  assert.ok(!canRecall11c(H(1), 20, 10), '東の 小部屋で よびもどすと 出られない');
  assert.ok(solve11c(H(1), { x: 20, y: 10 }, D1), 'アルゴルが 黄の 台に いれば もどれる');
});

test('かど: 1マス はばの 道の 曲がりかどが ない（さくが 開いても とじても・橋が あっても なくても）', () => {
  const left = [];
  for (const id of C11C_MAP_IDS) {
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
  // 回ろうの 道は 2マス はば（さく・橋・通り道は 2マス）
  for (const n of [1, 2, 3]) {
    const C = H(n).c11c;
    for (const F of [...C.fences, ...C.bridges, ...C.cards]) assert.equal(F.cells.length % 2, 0, `${n}階 ${JSON.stringify(F.cells[0])}`);
  }
});

test('サーバー: かげの 台で A（アルゴルが 来て さくを 食べる・べつの 台へ うつる・同じ 台で もどる）・よびもどす（となり・はなれて たずねる）・光の 橋・見はりの カード', async () => {
  const world = fixedWorld(11301);
  const { bot } = await act0Player(world, 'ソラ', C11C.join);
  const m1 = H(1), C = m1.c11c;
  const A = C.peds.findIndex((P) => P.c === 'a'), B = C.peds.findIndex((P) => P.c === 'b');
  const has = () => world.hasFlagFn(bot.s);
  const fa = C.fences.findIndex((F) => F.c === 'a'), fb = C.fences.findIndex((F) => F.c === 'b');
  const cellA = C.fences[fa].cells[0], cellB = C.fences[fb].cells[0];
  await place(bot, C11C_MAP.hall1, C.peds[A].x, C.peds[A].y);
  assert.ok(isBlocked(m1, cellA.x, cellA.y, has()), 'はじめは さく');
  await examine(bot, C.peds[A].x, C.peds[A].y - 1);
  assert.equal(algolPed11c(world, bot.s), A);
  assert.ok(!isBlocked(m1, cellA.x, cellA.y, has()), '青い さくを 食べた');
  assert.equal(effectiveTile(m1, cellA.x, cellA.y, has()), T.C11C_FENCE_OFF);
  assert.ok(toasts(bot).some((t) => t.includes('青の、かげの台に、立った')));
  await tickN(world, 2);
  assert.equal(lastSnap(bot)?.a, A, 'snap に アルゴルの 台');
  // さくを 通って 大広間 → 緑の 台へ うつる（青い さくは もどる）
  await walkTo(bot, C.peds[B].x, C.peds[B].y);
  await examine(bot, C.peds[B].x, C.peds[B].y - 1);
  assert.equal(algolPed11c(world, bot.s), B, '立てる 台は 1つ');
  assert.ok(isBlocked(m1, cellA.x, cellA.y, has()) && !isBlocked(m1, cellB.x, cellB.y, has()));
  // 同じ 台で A → もどって 来る
  await examine(bot, C.peds[B].x, C.peds[B].y - 1);
  assert.equal(algolPed11c(world, bot.s), -1);
  assert.ok(isBlocked(m1, cellB.x, cellB.y, has()));
  // はなれた 所で A → たずねる（やめる → そのまま / よびもどす → もどる）
  await examine(bot, C.peds[B].x, C.peds[B].y - 1);
  await stepOn(bot, C.peds[B].x + 1, C.peds[B].y);
  await stepOn(bot, C.peds[B].x + 2, C.peds[B].y);
  bot.choice = 1;
  await examine(bot, C.peds[B].x + 2, C.peds[B].y - 1);
  assert.equal(algolPed11c(world, bot.s), B, 'やめる');
  assert.ok(said(bot, 'アルゴルを、よびもどす？'));
  bot.choice = 0;
  await examine(bot, C.peds[B].x + 2, C.peds[B].y - 1);
  assert.equal(algolPed11c(world, bot.s), -1, 'よびもどした');
  // となりで アルゴルの 台を しらべる → すぐ もどる
  await place(bot, C11C_MAP.hall1, C.peds[B].x, C.peds[B].y);
  await examine(bot, C.peds[B].x, C.peds[B].y - 1);
  await stepOn(bot, C.peds[B].x + 1, C.peds[B].y);
  const n0 = bot.msgs.length;
  await examine(bot, C.peds[B].x, C.peds[B].y);
  assert.equal(algolPed11c(world, bot.s), -1, 'となりで 話すと すぐ');
  assert.ok(!said(bot, 'よびもどす？', n0));
  // 東の 小部屋（黄の さくの 先）で よびもどすと 出られない → もどらない
  const D = C.peds.findIndex((P) => P.c === 'd');
  await place(bot, C11C_MAP.hall1, C.peds[D].x, C.peds[D].y);
  await examine(bot, C.peds[D].x, C.peds[D].y - 1);
  await walkTo(bot, 20, 11);
  bot.choice = 0;
  await examine(bot, 20, 10);
  assert.equal(algolPed11c(world, bot.s), D, 'もどらない');
  assert.ok(said(bot, '出られなくなるぞ'));
  // 2階: 橋に 近い 赤の 台 → 橋が 消える
  const m2 = H(2), C2 = m2.c11c;
  const near = C2.peds.findIndex((P) => P.bridges.length);
  const B0 = C2.bridges[0].cells[0];
  await place(bot, C11C_MAP.hall2, C2.peds[near].x, C2.peds[near].y);
  assert.ok(!isBlocked(m2, B0.x, B0.y, has()), 'はじめは 橋が ある');
  await examine(bot, C2.peds[near].x, C2.peds[near].y - 1);
  assert.ok(isBlocked(m2, B0.x, B0.y, has()) && effectiveTile(m2, B0.x, B0.y, has()) === T.C11C_GROOVE, '橋が 消えた');
  assert.ok(toasts(bot).some((t) => t.includes('スピカの光の橋が')));
  // 3階: 見はりの カードは 動く → 赤の 台で 止まる → ふれると 入口に もどされる
  const m3 = H(3), C3 = m3.c11c;
  const K = C3.cards[0];
  await place(bot, C11C_MAP.hall3, C3.arrive.x, C3.arrive.y);
  await tickN(world, 2);
  const c0 = lastSnap(bot).cd[0];
  await tickN(world, 10);
  assert.notEqual(lastSnap(bot).cd[0], c0, 'カードは 動く');
  const red = C3.peds.findIndex((P) => P.cards.length);
  await place(bot, C11C_MAP.hall3, C3.peds[red].x, C3.peds[red].y);
  await examine(bot, C3.peds[red].x, C3.peds[red].y - 1);
  await tickN(world, 2);
  const c1 = lastSnap(bot).cd[0];
  await tickN(world, 10);
  assert.equal(lastSnap(bot).cd[0], c1, 'アルゴルが 食べて いる 間は 止まる');
  // 止まった カードの 横を 通れる（通り道を 歩く）
  await place(bot, C11C_MAP.hall3, K.back.x, K.back.y);
  for (let y = K.y1; y >= K.y0; y--) await stepOn(bot, K.x0, y);
  assert.deepEqual(tile(bot.s), [K.x0, K.y0], '通り道の 先');
  // よびもどして カードが 動き出すと、通り道の 中で ふれると 入口に もどされる
  const st3 = world.c11cSt.get([...world.c11cSt.keys()].find((k) => k.endsWith(`|${C11C_MAP.hall3}`)));
  st3.a = -1;
  const st = st3.cards[0];
  await place(bot, C11C_MAP.hall3, K.x0, K.y1);
  st.pos = K.y1 - 0.2; st.dir = 1;
  await tickN(world, 1);
  assert.deepEqual(tile(bot.s), [K.back.x, K.back.y], '入口に もどされた');
  assert.ok(toasts(bot).some((t) => t.includes('見はりのカードに、見つかった')));
});

test('助け（3人組の 声）: 同じ 階で アルゴルの 台が かわらない まま 長く 歩くと、次の 台が 光る・台を かえると 数えなおし・通った 階は 出ない', async () => {
  const world = fixedWorld(11302);
  const { bot, c } = await act0Player(world, 'ソラ', C11C.join);
  const m1 = H(1), C = m1.c11c;
  const S = C.arrive;
  await place(bot, C11C_MAP.hall1, S.x, S.y);
  for (let i = 0; i < C11C_HELP_STEPS - 2; i++) await stepOn(bot, S.x + (i % 2), S.y);
  await tickN(world, 2);
  assert.ok(!lastSnap(bot)?.h, 'まだ 光らない');
  for (let i = 0; i < 4; i++) await stepOn(bot, S.x + (i % 2), S.y);
  await tickN(world, 2);
  const h = lastSnap(bot)?.h;
  const want = nextHint11c(m1, { x: tile(bot.s)[0], y: tile(bot.s)[1] }, -1);
  assert.ok(h && want, '光った');
  assert.deepEqual(h, [want.x, want.y, want.kind]);
  assert.equal(h[2], 'ped');
  assert.deepEqual([h[0], h[1]], [C.peds.find((P) => P.c === 'a').x, C.peds.find((P) => P.c === 'a').y], '入口の 青の 台');
  assert.ok(toasts(bot).some((t) => t.includes('ボヤッチの声') && t.includes('青の台')), '3人組の 声');
  // 台に よぶと 数えなおし
  await walkTo(bot, h[0], h[1]);
  await examine(bot, h[0], h[1] - 1);
  await stepOn(bot, h[0] - 1, h[1]);
  await tickN(world, 2);
  assert.ok(!lastSnap(bot)?.h, '数えなおし');
  // 通った 階では 出ない
  c.flags[C11C.h1] = true;
  bot.s.c11cHelp = { key: `${C11C_MAP.hall1}|${algolPed11c(world, bot.s)}`, n: C11C_HELP_STEPS, hint: null };
  await stepOn(bot, h[0] - 1, h[1] + 1);
  await tickN(world, 2);
  assert.ok(!lastSnap(bot)?.h);
});

test('家族 2人: もう 1人が 黄の 台に 立つと 黄の さくを おさえる（近道）・おりると さくが もどって よける・ひとりでは アルゴルで 橋が 消える', async () => {
  const world = fixedWorld(11303);
  const { A, B, oA, oB } = await party2(world, C11C.rest);
  const m3 = H(3), C3 = m3.c11c;
  const D = C3.peds.findIndex((P) => P.c === 'd');
  const fd = C3.fences.findIndex((F) => F.c === 'd');
  const B1 = C3.peds[D].bridges[0];
  const cell = C3.fences[fd].cells[0];
  const br = C3.bridges[B1].cells;
  // ひとり: アルゴルを 黄の 台へ → さくは 開くが 東の 橋が 消える
  await place(A.bot, C11C_MAP.hall3, C3.peds[D].x, C3.peds[D].y, 'up', oA);
  await place(B.bot, C11C_MAP.hall3, cell.x, cell.y + 1, 'up', oB);
  await examine(A.bot, C3.peds[D].x, C3.peds[D].y - 1, oA);
  const hasB = () => world.hasFlagFn(B.bot.s);
  assert.ok(!isBlocked(m3, cell.x, cell.y, hasB()) && br.every((q) => isBlocked(m3, q.x, q.y, hasB())), 'アルゴルでは 橋が 消える');
  // アルゴルを よびもどす → A が 黄の 台に 立つ（A いがいの 人には さくが 開く・橋は のこる）
  await examine(A.bot, C3.peds[D].x, C3.peds[D].y - 1, oA);
  assert.equal(algolPed11c(world, A.bot.s), -1);
  assert.ok(isBlocked(m3, cell.x, cell.y, world.hasFlagFn(A.bot.s)), '立って いる 人には とじた まま');
  assert.ok(!isBlocked(m3, cell.x, cell.y, hasB()) && br.every((q) => !isBlocked(m3, q.x, q.y, hasB())), 'B には 開いて、橋も ある');
  await tickN(world, 2);
  assert.ok(lastSnap(B.bot).hd.includes(D), 'B の snap に 家族の 台');
  // B は さく → 東の 橋 → 北の 広間（通り道と 3階の 橋を 通らない 近道）
  const path = [];
  for (let y = cell.y; y >= 6; y--) path.push([cell.x, y]);
  for (const [x, y] of path) await stepOn(B.bot, x, y, oB);
  await stepOn(B.bot, cell.x, 5, oB);
  assert.deepEqual(tile(B.bot.s), [cell.x, 5], 'B は 北の 広間へ');
  const one = solve11c(m3, C3.arrive, -1).length;
  assert.ok(one > path.length + 20, `ひとりの とき方（${one}歩）より ずっと 短い`);
  // さくの 上に いる 時に A が おりると、さくが もどって B は よける
  await place(B.bot, C11C_MAP.hall3, cell.x, cell.y + 1, 'up', oB);
  await stepOn(B.bot, cell.x, cell.y, oB);
  assert.deepEqual(tile(B.bot.s), [cell.x, cell.y]);
  await stepOn(A.bot, C3.peds[D].x - 1, C3.peds[D].y, oA);
  await tickN(world, 2);
  assert.ok(!isBlocked(m3, ...tile(B.bot.s), hasB()), 'B は 立てる マスへ');
  assert.deepEqual(tile(B.bot.s), [cell.x, cell.y + 1], 'さいごに 立てた マス');
  assert.ok(toasts(B.bot).some((t) => t.includes('光のさくが、もどって来た')));
  // アルゴルは パーティーで 1つ（B が よぶと A の 階でも 同じ）
  await place(B.bot, C11C_MAP.hall3, C3.peds[D].x, C3.peds[D].y, 'up', oB);
  await examine(B.bot, C3.peds[D].x, C3.peds[D].y - 1, oB);
  assert.equal(algolPed11c(world, A.bot.s), D);
  assert.ok(toasts(A.bot).some((t) => t.includes('アルゴルを、黄の台に、よんだ')));
});

test('サーバー: 回線が 切れて すぐ もどる（同じ セッションを ひきつぐ）→ 階の 入口・ひとりなら アルゴルは はじめの 所・セーブに アルゴルは 入らない', async () => {
  const world = fixedWorld(11304, { offline: false, checkPassword: () => true });
  const A = await act0Player(world, 'ソラ', C11C.join);
  const m1 = H(1), C = m1.c11c;
  const P0 = C.peds.find((P) => P.c === 'a');
  await place(A.bot, C11C_MAP.hall1, P0.x, P0.y);
  await examine(A.bot, P0.x, P0.y - 1);
  const fa = C.fences.find((F) => F.c === 'a').cells[0];
  await walkTo(A.bot, fa.x, fa.y);
  assert.ok(algolPed11c(world, A.bot.s) >= 0);
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, C11C_MAP.hall1);
  assert.deepEqual(tile(A2.s), [C.arrive.x, C.arrive.y], '階の 入口');
  assert.ok(!isBlocked(m1, ...tile(A2.s), world.hasFlagFn(A2.s)));
  // セーブ（キャラの データ）に アルゴルの 台・さくの しるしは 入らない
  const saved = JSON.stringify(A.c);
  assert.ok(!/@cf|@lb|c11cSt|c11cHelp/.test(saved));
  assert.ok(Object.keys(A.c.flags).filter((f) => f.startsWith('c11c_')).every((f) => C11C_LINE.includes(f)), 'セーブに 足すのは 線の フラグ だけ');
  // だれも いなく なると わすれる（入り直すと はじめの 所）
  await place(A2, 'c11b_back', CITY_POS11C.hallDoorFront.x, CITY_POS11C.hallDoorFront.y);
  await tickN(world, 2);
  assert.ok(![...(world.c11cSt?.keys() || [])].some((k) => k.endsWith(`|${C11C_MAP.hall1}`)), 'わすれた');
  await place(A2, C11C_MAP.hall1, C.arrive.x, C.arrive.y);
  assert.equal(algolPed11c(world, A2.s), -1);
});

test('通し（ひとり）: 名前の 塔の 前 → メカ 3号 → アルゴルが いっしょに → うらの 町の 古い 戸 → 回ろう 1〜3階（ひと休み）→ 大とびら → 隊長 → c11_act3', async () => {
  const world = fixedWorld(11305);
  const { bot, c } = await act0Player(world, 'ソラ', C11C_ACT0);
  const fought = [];
  const o = { fought };
  assert.equal(c.objective, C11C_OBJ.start);
  // 0 名前の 塔から 出て 来た 所（塔の 前）→ アルゴル・題の 画面・メカ 3号 → J1 → うらの 町の 古い 戸の 前
  const T0 = CITY_POS11C.towerFront;
  await place(bot, 'c11b_front', T0.x + 1, T0.y + 2, 'up', o);
  await stepOn(bot, T0.x, T0.y + 2, o);
  assert.ok(c.flags[C11C.start] && c.flags[C11C.mecha] && c.flags[C11C.join], '場面 0・中ボス・アルゴルが いっしょ');
  assert.ok(said(bot, C11C_TITLE.act));
  assert.ok(fought.includes(C11C_BATTLE.mecha));
  assert.equal(bot.s.map, 'c11b_back');
  assert.deepEqual(tile(bot.s), [CITY_POS11C.hallDoorFront.x, CITY_POS11C.hallDoorFront.y], '古い 戸の 前へ');
  assert.equal(c.objective, C11C_OBJ.hall);
  assert.equal(storyPlace({ flags: c.flags }).label, '第3部 第3章 第3幕');
  // 3人組と アルゴル（うらの 町）
  await talkTo(bot, 'c11b_back', 'c11c_trio2', 0, o);
  assert.ok(said(bot, 'まんねん') || said(bot, 'まっせ'));
  // 古い 戸 → 回ろう 1階（説明）
  await place(bot, 'c11b_back', CITY_POS11C.hallDoorFront.x, CITY_POS11C.hallDoorFront.y, 'up', o);
  await stepOn(bot, CITY_POS11C.hallDoor.x, CITY_POS11C.hallDoor.y, o);
  assert.equal(bot.s.map, C11C_MAP.hall1);
  await stepOn(bot, HALL_POS11C[1].arrive.x + 1, HALL_POS11C[1].arrive.y, o);
  assert.ok(said(bot, 'かげの台に、立って、ぼくを、よべ'));
  // H1
  await runHall(bot, 1, o);
  assert.equal(bot.s.map, C11C_MAP.hall2);
  await stepOn(bot, HALL_POS11C[2].arrive.x, HALL_POS11C[2].arrive.y - 1, o);
  assert.ok(c.flags[C11C.h1] && said(bot, '細い橋を、えがいた'));
  assert.equal(c.objective, C11C_OBJ.bridge);
  // H2 → ひと休みの 部屋（アルゴルの 話）
  await runHall(bot, 2, o);
  assert.equal(bot.s.map, C11C_MAP.rest);
  await stepOn(bot, 6, 7, o);
  assert.ok(c.flags[C11C.h2] && c.flags[C11C.rest] && said(bot, 'ぼくの光で、はかりの前に、立ちたい'));
  assert.equal(c.objective, C11C_OBJ.card);
  await walkTo(bot, 9, 2, o);
  await stepOn(bot, 9, 1, o);
  assert.equal(bot.s.map, C11C_MAP.hall3);
  await stepOn(bot, HALL_POS11C[3].arrive.x + 1, HALL_POS11C[3].arrive.y, o);
  assert.ok(said(bot, '見はりのカードだ'));
  // H3（見はりの カード・よびもどして 橋）
  await runHall(bot, 3, o);
  assert.equal(bot.s.map, C11C_MAP.door);
  // D1 → 隊長 → E
  await stepOn(bot, DOOR_POS11C.arrive.x, DOOR_POS11C.arrive.y - 2, o);
  await walkTo(bot, DOOR_POS11C.arrive.x, 10, o);
  assert.ok(fought.includes(C11C_BATTLE.ace));
  assert.ok(c.flags[C11C.h3] && c.flags[C11C.ace] && c.flags[C11C.act3]);
  assert.ok(said(bot, '……スピカ。') && said(bot, '第3幕　クリア！'));
  assert.equal(c.objective, C11C_OBJ.act3);
  assert.equal(effectiveTile(MAPS.c11c_door, 9, 2, world.hasFlagFn(bot.s)), T.C11C_BIGDOOR_OPEN, '大とびらが 開いた');
  assert.ok(storyPlace({ flags: c.flags }).cleared || storyPlace({ flags: c.flags }).label === '第3部 第3章 第3幕');
  // 宝箱（回ろうの 8こ）は 開けられる
  assert.ok(MAPS.c11c_door.chests.length === 1);
  console.log(`  通し: ${fought.join(' → ')}`);
});
