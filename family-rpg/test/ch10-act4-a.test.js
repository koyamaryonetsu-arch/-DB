// 第3部 第2章 第4幕「金の音と、星の橋」（第99回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c10_act3 → くぼ地で 星の音さ（c10d_start）→ 星の塔 1階の 金色の ゆか → てっぺんの さいだん（c10d_top。光の 階段）
//   → 星の 階段（門の 番人 4つ c10d_gate1〜4・星の いずみ）→ いただきの 鏡（c10d_mirror）→ 金の 音（c10_note_do）
//   → 星見の丘の 星の橋（c10d_bridge）→ くぼ地の 金の 台・8つめの 台（c10_act4）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch10-act4.test.js）
// B班の 戦い・品は 合わせた（かりの data/c10d-stub.js・data/c10d-names-b.js は 消した）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, isBlocked, canStand, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C10D, C10D_LINE, C10D_GATES, C10D_WELLS, C10D_PED, C10D_MAP, C10D_MAP_IDS, C10D_CHEST_IDS, C10D_TILE_FIRST, C10D_TILE_LAST,
  C10D_TRACK_IDS, C10D_BATTLE, C10D_GATE_BATTLES, C10D_STAIR_MAPS, C10D_POWER_KEY,
} from '../public/js/shared/maps/c10d-flags.js';
import { C9D_NOTES_PLACED, songStage9 } from '../public/js/shared/maps/c9d-flags.js';
import { CH10D_MAPS } from '../public/js/shared/maps/c10d.js';
import {
  STAIR1_POS, STAIR2_POS, STAIR3_POS, SUMMIT_POS, TOWER1_GOLD10D, TOWER1_BACK10D, TOP_GOLD10D, TOP_ARRIVE10D, TOP_SKYSTAIR10D, TOP_BACK10D,
  HILL_SCENE10D, HILL_BRIDGE10D, PED8_10D,
} from '../public/js/shared/maps/c10d-rows.js';
import { GATE_INFO10D, c10dOnPlay, lossOf10d } from '../public/js/shared/world/c10d-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH10_STEPS, PART3_C10D_OPEN, c10dTitleSteps, CH10_PROGRESS, act3ClearObjective } from '../public/js/shared/data/story-c10.js';
import { C10C_OBJ } from '../public/js/shared/data/story-c10c.js';
import {
  C10D_OBJ, C10D_OBJ_ALL, CH10D_STORY_SCRIPTS, CH10D_PROGRESS, CH10D_OBJECTIVE_TARGETS, CH10D_OBJECTIVE_TALK, c10dScripts, applyCh10d, objective10d,
} from '../public/js/shared/data/story-c10d.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { existsSync } from 'node:fs';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10D_SHOP_ADD } from '../public/js/shared/data/items-c10d.js';
import { computeStats } from '../public/js/shared/stats.js';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, fixedWorld, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES10D = ['public/js/shared/maps/c10d-flags.js', 'public/js/shared/data/story-c10d.js', 'public/js/shared/maps/c10d.js', 'public/js/shared/maps/c10d-rows.js',
  'public/js/shared/world/c10d-steps.js', 'public/js/client/c10d-view.js', 'public/js/client/render/tiles-c10d.js', 'public/js/client/render/c10d-npc-art.js'];
const openScripts = () => c10dScripts(c10dTitleSteps, true, { ped: SCRIPTS.c9c_ped });
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh10d(SCRIPTS, STORY_SCRIPTS, { title: c10dTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const NOTES6 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si'];
const key = (x, y) => `${x},${y}`;
const POS = { [C10D_MAP.stair1]: STAIR1_POS, [C10D_MAP.stair2]: STAIR2_POS, [C10D_MAP.stair3]: STAIR3_POS };

// 歩いて 行ける 所（ワープは ふまない）
function reachFrom(map, has, start) {
  const seen = new Set([key(start.x, start.y)]);
  const q = [[start.x, start.y]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(key(nx, ny))) continue;
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(ny * map.w + nx) || map.warpAt.has(ny * map.w + nx)) continue;
      seen.add(key(nx, ny));
      q.push([nx, ny]);
    }
  }
  return seen;
}
const nextTo = (set, p) => D4.some(([dx, dy]) => set.has(key(p.x + dx, p.y + dy)));

// ───── 世界で 遊ぶ 手 ─────
async function act3Player(world, name, job) {
  openAct();
  const P = await addPlayer(world, name, 'c10_act3', [], job);
  P.c.keyItems = [...new Set([...(P.c.keyItems || []), ...NOTES6])];
  P.c.objective = act3ClearObjective(true);
  return P;
}
const goTo = async (bot, x, y, opts) => {
  const map = MAPS[bot.s.map];
  const path = pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${x},${y} まで 歩ける`);
  for (const [px, py] of path) await stepOn(bot, px, py, opts);
};
async function goExamine(bot, p, choice = 0, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x))
    .find(([x, y]) => (x === sx && y === sy) || pathTo(map, sx, sy, x, y, has));
  assert.ok(side, `${map.id} ${p.x},${p.y} の となり`);
  if (side[0] !== sx || side[1] !== sy) await goTo(bot, side[0], side[1], opts);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}
const front = (g) => { const G = GATE_INFO10D[g]; return { x: G.front.x + 1, y: G.front.y }; };
async function party2(world) {
  const A = await act3Player(world, 'ソラ');
  const B = await act3Player(world, 'ミナ', 'mage');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  return { A, B, oA: { bots: [B.bot] }, oB: { bots: [A.bot] } };
}

test('名前の 約束: マップ 4まい・タイル 591〜620・宝箱の id・一本の 線・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH10D_MAPS, ['c10d_stair1', 'c10d_stair2', 'c10d_stair3', 'c10d_summit']);
  for (const id of C10D_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
    assert.ok(!m.noEscape, `${id} は 糸・羽が 使える`);
    assert.deepEqual(m.spawnCounts, {}, `${id} は 魔物が 出ない`);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) assert.ok(String(m.zoneAt(x, y)).startsWith('safe'));
  }
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C10D_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C10D_TILE_FIRST);
  assert.ok(ids[ids.length - 1] <= C10D_TILE_LAST, 'タイルは 620 まで');
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C10D_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.deepEqual(C10D_LINE, ['c10d_start', 'c10d_top', 'c10d_gate1', 'c10d_gate2', 'c10d_gate3', 'c10d_gate4', 'c10d_mirror', 'c10_note_do', 'c10d_bridge', 'c10_act4']);
  assert.deepEqual(CH10_STEPS.slice(-C10D_LINE.length), C10D_LINE);
  const j3 = STORY_STEPS.indexOf('c10_act3'); // 第100回 A班: うしろに 第3章が つづく
  assert.deepEqual(STORY_STEPS.slice(j3, j3 + C10D_LINE.length + 1), ['c10_act3', ...C10D_LINE]);
  // セーブに 足す 線の ほかの フラグは いずみ 4つ（門 4つと 合わせて 8こ）と 台の 小さな フラグ（クリアで 消す）だけ
  assert.deepEqual(C10D_WELLS, ['c10d_well1', 'c10d_well2', 'c10d_well3', 'c10d_well4']);
  for (const f of [...C10D_WELLS, C10D_PED.do]) assert.ok(!STORY_STEPS.includes(f), `${f} は 線に 入らない`);
  assert.equal(C10D_GATES.length + C10D_WELLS.length, 8);
  // 宝箱 6こ
  const chests = C10D_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual([...chests].sort(), [...C10D_CHEST_IDS].sort());
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある（今の マップに 足した 物も）
  openAct();
  for (const id of [...C10D_MAP_IDS, 'star_tower_1f', 'star_tower_top', 'overworld', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c10d|^c10_ped_do/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH10D_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  assert.ok(!STORY_SCRIPTS.has('c10d_well1'), 'いずみは ひとりでも');
  assert.equal(BOSS_RETRY.c10d_mirror, 'c10d_mirror_event');
  for (const g of C10D_GATE_BATTLES) assert.equal(BOSS_RETRY[g], `${g}_event`);
  assert.equal(BOSS_HINT_WHO.c10d_mirror, 'ノクト');
  // 曲（F班の id。マップと 場面）
  assert.deepEqual(C10D_TRACK_IDS, ['c10d_stairs', 'c10d_gate', 'c10d_mirror', 'c10d_bridge', 'c10d_seven']);
  for (const id of C10D_MAP_IDS) assert.equal(MAPS[id].bgm, 'c10d_stairs');
  const sc = (id, ...fl) => JSON.stringify(SCRIPTS[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c10d_gate1_event', 'c10d_top').includes('"c10d_gate"'), '門の 番人の 曲');
  assert.ok(sc('c10d_mirror_event', 'c10d_gate4').includes('"c10d_mirror"'), '鏡の 曲');
  assert.ok(sc('c10d_mirror_event', 'c10d_gate4').includes('"c9d_song"'), 'スピカの歌');
  assert.ok(sc('c10d_bridge_event', 'c10_note_do').includes('"c10d_bridge"'), '星の橋の 曲');
  assert.ok(sc('c10_ped_do', 'c10d_start', 'c10_note_do', 'c10d_bridge').includes('"c10d_seven"'), '7つの 音の 曲');
  // スピカの歌: 金の 音で 7ふし
  assert.ok(C9D_NOTES_PLACED.includes('c10_note_do'));
  assert.equal(songStage9(hasOf(['c9_act3', 'c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la', 'c10_note_si', 'c10_note_do'])), 7);
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES10D) {
    assert.ok(list.some((x) => x.endsWith(f)), `gameFiles に ${f}`);
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c10d-stub.js・B の c10d-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['../public/js/shared/data/c10d-stub.js', '../public/js/shared/data/c10d-names-b.js']) assert.ok(!existsSync(new URL(f, import.meta.url)), `${f} は 消した`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c10d-stub|c10d-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // B班の 本物（宝箱 6こ・決まった 戦い 5つ・だいじな 物・店）
  for (const id of C10D_CHEST_IDS) {
    const ch = C10D_MAP_IDS.flatMap((m) => MAPS[m].chests).find((c) => c.id === id);
    assert.ok(ch && ch.item && !ch.gold, `宝箱 ${id} の 中み（かりの お金では ない）`);
  }
  for (const b of Object.values(C10D_BATTLE)) assert.ok(FIXED_ENCOUNTERS[b]?.boss && FIXED_ENCOUNTERS[b].canFlee === false, b);
  assert.equal(FIXED_ENCOUNTERS.c10d_mirror.bgm, 'c10d_mirror');
  assert.equal(FIXED_ENCOUNTERS.c10d_gate1.bgm, 'c10d_gate');
  assert.equal(ITEMS.note_do?.type, 'key');
  assert.ok(C10D_SHOP_ADD.every((id) => SHOPS.c10d_crater.items.includes(id)));
  assert.ok(SHOPS.c10c_crater.items.every((id) => SHOPS.c10d_crater.items.includes(id)), '第3幕の 店の 品も ある');
  assert.ok(JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act3', 'c10_act4')))).includes('c10d_crater'), '幕の クリアの あとの 店');
  assert.ok(!JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act3')))).includes('c10d_crater'), 'クリアの 前は 今の 店');
});

test('台本の きまり: 第1部・第2部の ひみつ・カイ・ソリトゥス・像の 名前と ことば・女王・少年の わけ・8つめの 音・鏡の もとの 作品を 書かない', () => {
  const src = ['public/js/shared/data/story-c10d.js', 'public/js/shared/maps/c10d.js', 'public/js/shared/maps/c10d-flags.js', 'public/js/shared/world/c10d-steps.js', 'public/js/shared/maps/c10d-rows.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const S = openScripts();
  const fl = flagsOf(...UPTO('c10_act3'), ...C10D_LINE.slice(0, -1));
  const all = JSON.stringify(Object.values(S).map((fn) => fn(ctx(fl))));
  const scenes = [
    S.c10d_fork_event(ctx(flagsOf(...UPTO('c10_act3')))), S.c10d_top_event(ctx(flagsOf('c10d_start'))),
    ...[1, 2, 3, 4].map((g) => S[`c10d_gate${g}_event`](ctx(flagsOf('c10d_top', ...C10D_GATES.slice(0, g - 1))))),
    S.c10d_mirror_event(ctx(flagsOf('c10d_gate4'))), S.c10d_bridge_event(ctx(flagsOf('c10_note_do'))),
    S.c10_ped_do(ctx(flagsOf('c10d_start', 'c10_note_do', 'c10d_bridge'))), S.c10d_ped8(ctx({})), S.c10d_bridge_look(ctx({})),
  ];
  const text = all + JSON.stringify(scenes);
  for (const w of ['カイ', 'ソリトゥス', 'ネフィ', 'カリム', 'ミナモ', 'リオン', '勇者', '星の海', '白雪', 'しらゆき', '鏡よ', 'かがみよ', 'お妃', 'きさき', 'りんご', 'リンゴ', '毒',
    '一番', 'いちばん美し', '美しい', '仮面', '小人', 'こびと', 'お城', '魔女']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  assert.ok(!/ソリトゥス|カイ[^ずだ]|白雪|鏡よ/.test(src.replace(/\/\/.*$/gm, '')), 'ソースの 文にも 出さない');
  // 女王は 鏡の ひとことだけ（だれかは 書かない）
  const says = JSON.parse(JSON.stringify(scenes)).flat(1).filter((s) => Array.isArray(s) && s[0] === 'say');
  const queen = says.filter((s) => String(s[2]).includes('女王'));
  assert.deepEqual(queen.map((s) => [s[1], s[2]]), [['ミラーレ', '…女王さまに、お知らせせねば。']]);
  // 鏡は「光の弱い者に、用はない」
  assert.ok(says.some((s) => String(s[2]).includes('光の弱い者に、用はない')));
  // 少年は 何も 言わない（わけを 書かない）
  assert.deepEqual(says.filter((s) => s[1] === 'アルゴル'), []);
  assert.ok(text.includes('何も言わず、立ちつくしている'));
  // 像は 光る だけ（名前・ことば なし）
  const bridge = JSON.stringify(scenes[7]);
  assert.ok(bridge.includes('4つの像が、しずかに、光った'));
  assert.ok(bridge.includes('橋は、空の、とちゅうで、止まった') && bridge.includes('もうひとつ、音が、ある'));
  // 8つめの 台は「何も のって いない」だけ（何の 音かは 書かない）
  const end = JSON.stringify(scenes[8]);
  assert.ok(end.includes('台は、7つ、作ったはず') && end.includes('8つめの、何も、のっていない台'));
  assert.ok(end.includes('第2章　七つの星の音') && end.includes('クリア！'), '第2章 クリアの 題');
  // 鏡は たおれない（ひびが 入って 帰る）
  assert.ok(text.includes('ひびが入った') && text.includes('空のさけめへ、帰っていった'));
});

test('閉じた 幕（PART3_C10D_OPEN）: くぼ地で 音さを 鳴らしても 始まらない・第3幕 クリアの 目標は 今の まま・幕を 開けた 形も ためす', () => {
  const a3 = flagsOf(...UPTO('c10_act3'));
  const closed = c10dScripts(c10dTitleSteps, false);
  assert.deepEqual(closed.c10d_fork_event(ctx(a3)), []);
  if (!PART3_C10D_OPEN) {
    assert.equal(act3ClearObjective(), C10C_OBJ.act3, '閉じて いる 間は「第4幕へ（続きは…）」の まま');
    assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10D_OBJ.place), '第4幕の 目標は まだ ない');
    assert.ok(CH10_PROGRESS.some(([, t]) => t === C10C_OBJ.act3));
    const end3 = JSON.stringify(SCRIPTS.c10_ped_si(ctx(flagsOf('c10c_start', 'c10_note_si'))));
    assert.ok(end3.includes(C10C_OBJ.act3), '第3幕の さいごの 場面の 目標も 今の まま');
  }
  assert.equal(act3ClearObjective(true), C10D_OBJ.start);
  const open = openScripts();
  const s = JSON.stringify(open.c10d_fork_event(ctx(a3)));
  assert.ok(s.includes('第2章　七つの星の音') && s.includes('第4幕　金の音と、星の橋'), '題の 画面');
  assert.ok(s.includes('星の塔の、てっぺん'), '星の塔を 指す');
  assert.deepEqual(open.c10d_fork_event(ctx(flagsOf(...UPTO('c10_act2')))), [], '第3幕の 間は 始まらない');
  assert.deepEqual(open.c10d_fork_event(ctx({ ...a3, c10d_start: true })), [], '1回だけ');
});

test('目標: 一本道の 目標・すすみぐあいから なおせる・行き先と ひとこと', () => {
  const o = (...fl) => objective10d(hasOf(['c10_act3', ...fl]));
  assert.equal(o(), C10D_OBJ.start);
  assert.equal(o('c10d_start'), C10D_OBJ.tower);
  assert.equal(o('c10d_start', 'c10d_top'), C10D_OBJ.stairs);
  assert.equal(o('c10d_start', 'c10d_top', 'c10d_gate2'), C10D_OBJ.stairs);
  assert.equal(o('c10d_start', 'c10d_gate4'), C10D_OBJ.summit);
  assert.equal(o('c10d_start', 'c10d_gate4', 'c10d_mirror'), C10D_OBJ.summit, '鏡の あと 音を 取る 前（光の 玉で やり直し）');
  assert.equal(o('c10d_start', 'c10_note_do'), C10D_OBJ.hill);
  assert.equal(o('c10d_start', 'c10_note_do', 'c10d_bridge'), C10D_OBJ.place);
  assert.equal(o('c10d_start', 'c10_act4'), C10D_OBJ.act4);
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH10D_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH10D_PROGRESS[i]; if (c.flags[k]) return t; } return null; };
  for (let i = 0; i < C10D_LINE.length; i++) {
    const fl = ['c10_act3', ...C10D_LINE.slice(0, i + 1)];
    assert.equal(prog(fl), objective10d(hasOf(fl)), fl.join(','));
  }
  for (const t of C10D_OBJ_ALL) {
    assert.ok(CH10D_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH10D_OBJECTIVE_TARGETS[t]) assert.ok(MAPS[p.map], p.map);
    const talk = CH10D_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
});

test('前の 章を 遊んで いる 人を こわさない: 星の塔・星見の丘・くぼ地に 足したのは フラグで 出る 物だけ・足した とびらには open の タイル', () => {
  openAct();
  const f1 = MAPS.star_tower_1f, top = MAPS.star_tower_top, ow = MAPS.overworld, cr = MAPS.c9a_crater;
  for (const has of [() => false, hasOf(UPTO('c10_act3'))]) {
    for (const p of TOWER1_GOLD10D) {
      assert.equal(effectiveTile(f1, p.x, p.y, has), T.CAVE_FLOOR, '1階の ゆかは 今の まま');
      for (const w of f1.warps.filter((v) => v.x === p.x && v.y === p.y)) assert.ok(!condOk(w.show, has), 'ワープも 動かない');
    }
    assert.equal(effectiveTile(top, TOP_GOLD10D.x, TOP_GOLD10D.y, has), T.TOP_FLOOR);
    assert.equal(effectiveTile(top, TOP_SKYSTAIR10D.x, TOP_SKYSTAIR10D.y, has), T.TOP_EDGE, '光の 階段は 出ない');
    assert.ok(isBlocked(top, TOP_SKYSTAIR10D.x, TOP_SKYSTAIR10D.y, has));
    for (const w of top.warps.filter((v) => [TOP_GOLD10D, TOP_SKYSTAIR10D].some((p) => p.x === v.x && p.y === v.y))) assert.ok(!condOk(w.show, has));
    // くぼ地の 場面 0 の マスは 第3幕を 終えた 人だけ（幕が 閉じて いる 間は 台本が 何も しない … 閉じた 幕の テスト）
    for (const tr of [...top.triggers, ...ow.triggers, ...cr.triggers].filter((t) => /^c10d/.test(t.id) && t.id !== 'c10d_fork_event')) assert.ok(!condOk(tr.show, has), `${tr.id} は 動かない`);
    for (const n of [...ow.npcs, ...cr.npcs].filter((x) => /^c10d|^c10_ped_do/.test(x.id))) assert.ok(!condOk(n.show, has), `${n.id} は 出ない`);
  }
  // フラグが あると 出る
  assert.equal(effectiveTile(f1, 13, 9, hasOf(['c10d_start'])), T.C10D_GOLD);
  assert.equal(effectiveTile(top, TOP_SKYSTAIR10D.x, TOP_SKYSTAIR10D.y, hasOf(['c10d_top'])), T.C10D_SKYSTAIR);
  assert.ok(condOk(ow.npcs.find((n) => n.id === 'c10d_bridge').show, hasOf(['c10d_bridge'])), '星の橋の 絵');
  assert.deepEqual([HILL_BRIDGE10D.x, HILL_BRIDGE10D.y], [63, 78]);
  // てっぺんの 祭だんは 今の まま（第4幕の 前）
  assert.deepEqual(SCRIPTS.c5_altar(ctx(flagsOf(...UPTO('c10_act3')))), SCRIPTS.c5_altar(ctx(flagsOf(...UPTO('c5_sky')))));
  assert.ok(JSON.stringify(SCRIPTS.c5_altar(ctx(flagsOf(...UPTO('c10_act3'), 'c10d_start')))).includes('光の、階段だ'), '祭だんで 音さ');
  // 着く 所は どの すすみぐあいでも 立てる（ワープの マスでは ない）
  for (const [m, p] of [[top, TOP_ARRIVE10D], [top, TOP_BACK10D], [f1, TOWER1_BACK10D]]) {
    for (const has of [() => false, () => true]) assert.ok(canStand(m, p.x + 0.5, p.y + 0.5, has), `${m.id} ${p.x},${p.y}`);
    assert.ok(!m.warpAt.has(p.y * m.w + p.x));
  }
  // 足した とびらには open の タイルが ある
  for (const id of ['star_tower_1f', 'star_tower_top', ...C10D_MAP_IDS]) for (const g of MAPS[id].gates.filter((x) => x.flag || x.levels)) assert.ok(TILE_INFO[g.open], `${id} ${g.x},${g.y} の open`);
  // くぼ地の 金の 台は 前の 台本へ（第4幕の 前は 今の まま）
  const ped2 = cr.npcs.find((n) => n.id === 'c9c_ped2');
  assert.equal(ped2.script, 'c10_ped_do');
  assert.deepEqual(SCRIPTS.c10_ped_do(ctx(flagsOf('c9_note1'))), SCRIPTS.c9c_ped(ctx(flagsOf('c9_note1'))));
  assert.deepEqual(SCRIPTS.c10_ped_do(ctx(flagsOf(...UPTO('c10_act3')))), SCRIPTS.c9c_ped(ctx(flagsOf(...UPTO('c10_act3')))), '第3幕の 人にも 今の まま');
  // 8つめの 台は 台の ならびの はし・第2章の クリアの あと だけ
  const p8 = cr.npcs.find((n) => n.id === 'c10d_ped8');
  assert.deepEqual([p8.x, p8.y], [PED8_10D.x, PED8_10D.y]);
  assert.ok(condOk(p8.show, hasOf(['c10_act4'])));
  const fork = cr.triggers.find((t) => t.id === 'c10d_fork_event');
  assert.ok(!condOk(fork.show, hasOf(UPTO('c10_act2'))) && condOk(fork.show, hasOf(UPTO('c10_act3'))) && !condOk(fork.show, hasOf([...UPTO('c10_act3'), 'c10d_start'])));
  // 星見の丘の 場面の マスは 金の 音の あと だけ・丘の 中
  const hill = ow.triggers.find((t) => t.id === 'c10d_bridge_event');
  assert.deepEqual([hill.x, hill.y, hill.w, hill.h], [HILL_SCENE10D.x, HILL_SCENE10D.y, HILL_SCENE10D.w, HILL_SCENE10D.h]);
  assert.ok(condOk(hill.show, hasOf(['c10_note_do'])) && !condOk(hill.show, hasOf(['c10_note_do', 'c10d_bridge'])));
});

test('星の 階段: 一本道・門は 番人に 勝つまで 通れない・開いた 門は 開いた まま・いずみは おどり場に・宝箱に とどく・着く 所', () => {
  const ups = { [C10D_MAP.stair1]: STAIR1_POS, [C10D_MAP.stair2]: STAIR2_POS, [C10D_MAP.stair3]: STAIR3_POS };
  let wellNo = 0;
  for (const id of C10D_STAIR_MAPS) {
    const map = MAPS[id], P = ups[id];
    const before = C10D_GATES.slice(0, P.gates[0].g - 1);
    const none = hasOf(before);
    const r0 = reachFrom(map, none, P.entry);
    // 門の 前の マス・いずみ・この 階の 宝箱（はじめの 門まで）に とどく / 上り 階段には とどかない
    const G0 = P.gates[0];
    for (let x = G0.front.x; x < G0.front.x + G0.front.w; x++) assert.ok(r0.has(key(x, G0.front.y)), `${id} 門 ${G0.g} の 前`);
    for (let x = G0.x; x < G0.x + G0.w; x++) {
      assert.equal(effectiveTile(map, x, G0.y, none), T.C10D_GATE);
      assert.ok(isBlocked(map, x, G0.y, none), '門は 通れない');
      assert.equal(effectiveTile(map, x, G0.y, hasOf(C10D_GATES)), T.C10D_GATE_OPEN, '開いた 門');
    }
    assert.ok(!nextTo(r0, P.up), `${id} 門を あけないと 上へ 行けない`);
    // ぜんぶ 開くと 上り 階段・宝箱・いずみに とどく
    const r1 = reachFrom(map, hasOf(C10D_GATES), P.entry);
    assert.ok(nextTo(r1, P.up), `${id} 上へ`);
    for (const ch of map.chests) assert.ok(nextTo(r1, ch), `${id} 宝箱 ${ch.id}`);
    for (const w of P.wells) assert.ok(nextTo(r1, w), `${id} いずみ`);
    // おどり場（負けた 時に 目を 覚ます 所）は 立てて、その 門の 前へ 歩ける
    for (const G of P.gates) {
      const has = hasOf(C10D_GATES.slice(0, G.g - 1));
      for (const h of [has, () => true]) assert.ok(canStand(map, G.landing.x + 0.5, G.landing.y + 0.5, h), `${id} おどり場 ${G.g}`);
      assert.ok(reachFrom(map, has, G.landing).has(key(G.front.x, G.front.y)), `${id} おどり場 ${G.g} から 門の 前へ`);
      // いずみ g は 門 g の 前の おどり場に ある
      const w = P.wells[P.gates.indexOf(G)];
      assert.ok(nextTo(reachFrom(map, has, G.landing), w), `いずみ ${G.g} は 門 ${G.g} の 前`);
    }
    wellNo += P.wells.length;
    // 回線が 切れた 時: 次の 門の 前の おどり場
    const s = { map: id, x: P.up.x + 0.5, y: P.up.y + 1.5 };
    const fake = { hasFlagFn: () => none };
    c10dOnPlay(fake, s);
    assert.deepEqual([Math.floor(s.x), Math.floor(s.y)], [G0.landing.x, G0.landing.y]);
  }
  assert.equal(wellNo, 4);
  // いただき: 入口から 鏡の 場面の マスへ・光の 出口・光の 玉
  const sm = MAPS[C10D_MAP.summit];
  const rs = reachFrom(sm, () => false, SUMMIT_POS.entry);
  assert.ok(rs.has(key(SUMMIT_POS.bossScene.x + 4, SUMMIT_POS.bossScene.y)));
  assert.ok(nextTo(rs, SUMMIT_POS.orb));
  for (const ch of sm.chests) assert.ok(nextTo(rs, ch), ch.id);
  assert.ok(isBlocked(sm, SUMMIT_POS.portal.x, SUMMIT_POS.portal.y, () => false) === false && !condOk(sm.warps.find((w) => w.x === SUMMIT_POS.portal.x && w.y === SUMMIT_POS.portal.y).show, () => false), '光の 出口は 金の 音の あと');
  // 星の 階段の 下は 雲の 海（落ちない）
  for (const id of C10D_MAP_IDS) assert.ok(MAPS[id].tiles.includes(T.CLOUD_SEA) && TILE_INFO[T.CLOUD_SEA].solid);
});

test('サーバー: 星の いずみ（リーダーが えらぶ・パーティーで 1つ・おどり場ごとに 1回きり・ほかの 人には 何を えらんだか）', async () => {
  const world = fixedWorld(9911);
  const { A, B, oA, oB } = await party2(world);
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf('c10d_start', 'c10d_top'));
  const E = STAIR1_POS.entry;
  await place(A.bot, C10D_MAP.stair1, E.x, E.y, 'up', oA);
  await place(B.bot, C10D_MAP.stair1, E.x + 1, E.y, 'up', oB);
  const W1 = STAIR1_POS.wells[0];
  // なかまが しらべると「リーダーが えらぼう」
  await goExamine(B.bot, W1, 0, oB);
  assert.ok(said(B.bot, 'リーダーが、えらぼう'));
  assert.ok(!A.c.flags.c10d_well1);
  // リーダーが いやしの水 → 2人とも HP が 全部
  A.c.hp = 1; B.c.hp = 1;
  const mpA = A.c.mp = 3;
  await goExamine(A.bot, W1, 0, oA);
  assert.ok(A.c.flags.c10d_well1, 'えらんだ しるし（リーダー）');
  for (const P of [A, B]) assert.equal(P.c.hp, computeStats(P.c).maxHp, `${P.c.name} の HP`);
  assert.equal(A.c.mp, mpA, 'いやしの水は MP を かえない');
  assert.ok(B.bot.msgs.some((m) => m.t === 'toast' && m.text.includes('いやしの水')), 'ほかの 人に 何を えらんだか');
  // もう 一度は もらえない
  A.c.hp = 1;
  await goExamine(A.bot, W1, 1, oA);
  assert.equal(A.c.hp, 1);
  assert.ok(said(A.bot, 'ここの水は、もう、もらった'));
  assert.equal(effectiveTile(MAPS[C10D_MAP.stair1], W1.x, W1.y, world.hasFlagFn(B.bot.s)), T.C10D_WELL_DRY, 'しずかな いずみ（なかまにも）');
  // ちえの水（いずみ 2）・ちからの水（いずみ 3）
  Object.assign(A.c.flags, flagsOf('c10d_gate1', 'c10d_gate2'));
  await place(A.bot, C10D_MAP.stair2, STAIR2_POS.entry.x, STAIR2_POS.entry.y, 'up', oA);
  await place(B.bot, C10D_MAP.stair2, STAIR2_POS.entry.x + 1, STAIR2_POS.entry.y, 'up', oB);
  A.c.mp = 0; B.c.mp = 0;
  await goExamine(A.bot, STAIR2_POS.wells[0], 1, oA);
  for (const P of [A, B]) assert.equal(P.c.mp, computeStats(P.c).maxMp, `${P.c.name} の MP`);
  await place(A.bot, C10D_MAP.stair2, 11, 21, 'up', oA);
  await place(B.bot, C10D_MAP.stair2, 12, 21, 'up', oB);
  await goExamine(A.bot, STAIR2_POS.wells[1], 2, oA);
  for (const P of [A, B]) assert.ok(P.bot.s[C10D_POWER_KEY], `${P.c.name}: ちからの水の しるし（B班が 戦いで 読む）`);
  assert.ok(world.c10d.takePower(world, [A.bot.s, B.bot.s]), 'しるしを 読む');
  assert.ok(!A.bot.s[C10D_POWER_KEY] && !B.bot.s[C10D_POWER_KEY], '読むと 消える');
  // やめる を えらぶと 何も しない
  await place(A.bot, C10D_MAP.stair3, STAIR3_POS.entry.x, STAIR3_POS.entry.y, 'up', oA);
  await goExamine(A.bot, STAIR3_POS.wells[0], 3, oA);
  assert.ok(!A.c.flags.c10d_well4);
});

test('サーバー: 門の 番人に 負けると その 門の 前の おどり場から・3回 負けると いずみが もう 一度 だけ わく・いただきは 入口から', async () => {
  const world = fixedWorld(9912);
  const { bot, c } = await act3Player(world, 'ソラ');
  Object.assign(c.flags, flagsOf('c10d_start', 'c10d_top', 'c10d_gate1', 'c10d_well2'));
  const lose = { lose: () => true };
  const G2 = GATE_INFO10D[2];
  for (let n = 1; n <= 6; n++) {
    await place(bot, C10D_MAP.stair2, front(2).x, front(2).y + 1, 'up', lose);
    c.hp = 5;
    bot.choice = 1; // 負けた あとの ヒントの「あとにする」（もう一度いどむ は 門の 手前へ … 下で ためす）
    await stepOn(bot, front(2).x, front(2).y, lose);
    bot.choice = 0;
    assert.ok(said(bot, 'まくの色がちがう'), `${n}回め: ノクトの ヒント`);
    assert.equal(bot.s.map, C10D_MAP.stair2);
    assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [G2.landing.x, G2.landing.y], `${n}回め: おどり場で 目を 覚ます`);
    assert.equal(c.hp, computeStats(c).maxHp, 'HP は 全滅の きまり（全部 回復）');
    assert.ok(!c.flags.c10d_gate2);
    assert.equal(lossOf10d(world, bot.s, 2).n, n);
    if (n === 3) {
      assert.ok(!c.flags.c10d_well2, '3回 負けて いずみが わいた');
      assert.ok(bot.msgs.some((m) => m.t === 'toast' && m.text.includes('もう一度、わきだした')));
      c.flags.c10d_well2 = true; // また えらんだ
    }
    if (n > 3) assert.ok(c.flags.c10d_well2, 'わくのは 1回だけ');
  }
  // もう一度いどむ: 門の 手前へ（立てる・門の 前の マスへ 歩ける）
  await place(bot, C10D_MAP.stair2, front(2).x, front(2).y + 1, 'up', lose);
  bot.choice = 0;
  await stepOn(bot, front(2).x, front(2).y, lose);
  assert.equal(bot.s.map, C10D_MAP.stair2);
  assert.ok(pathTo(MAPS[C10D_MAP.stair2], Math.floor(bot.s.x), Math.floor(bot.s.y), front(2).x, front(2).y, world.hasFlagFn(bot.s)), 'もう一度いどむ: 門の 前へ 歩ける');
  // 勝つと 門は 開いた まま
  await place(bot, C10D_MAP.stair2, front(2).x, front(2).y + 1, 'up');
  await stepOn(bot, front(2).x, front(2).y);
  assert.ok(c.flags.c10d_gate2);
  assert.ok(!isBlocked(MAPS[C10D_MAP.stair2], G2.x, G2.y, world.hasFlagFn(bot.s)), '開いた 門');
  await stepOn(bot, front(2).x, front(2).y - 1);
  assert.equal(Math.floor(bot.s.y), front(2).y - 1, '開いた 門を 通れる');
  // いただき（鏡）で 負けると いただきの 入口
  Object.assign(c.flags, flagsOf(...C10D_GATES));
  await place(bot, C10D_MAP.summit, SUMMIT_POS.entry.x, SUMMIT_POS.entry.y, 'up', lose);
  bot.choice = 1;
  await goTo(bot, SUMMIT_POS.bossScene.x + 4, SUMMIT_POS.bossScene.y + 1, lose);
  bot.choice = 0;
  assert.equal(bot.s.map, C10D_MAP.summit);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [SUMMIT_POS.entry.x, SUMMIT_POS.entry.y]);
  assert.ok(!c.flags.c10d_mirror);
});

test('サーバー: 回線が 切れて すぐ もどる（同じ セッションを ひきつぐ）→ 次の 門の 前の おどり場・開いた 門は 開いた まま', async () => {
  const world = fixedWorld(9913, { offline: false, checkPassword: () => true });
  const A = await act3Player(world, 'ソラ');
  Object.assign(A.c.flags, flagsOf('c10d_start', 'c10d_top', 'c10d_gate1', 'c10d_gate2'));
  await play(A.bot);
  await place(A.bot, C10D_MAP.stair2, 11, 12, 'up');
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, C10D_MAP.stair2);
  const G3 = GATE_INFO10D[3];
  assert.deepEqual([Math.floor(A2.s.x), Math.floor(A2.s.y)], [G3.landing.x, G3.landing.y], '門 3 の 前の おどり場');
  assert.ok(!isBlocked(MAPS[C10D_MAP.stair2], GATE_INFO10D[2].x, GATE_INFO10D[2].y, world.hasFlagFn(A2.s)), '門 2 は 開いた まま');
});

test('通し（ひとり）: くぼ地 → 星の塔の 金色の ゆか → てっぺん → 星の 階段（門 4つ・いずみ）→ いただきの 鏡 → 金の 音 → 星見の丘の 星の橋 → 金の 台（c10_act4）', async () => {
  const world = fixedWorld(9914);
  const { bot, c } = await act3Player(world, 'ソラ');
  const fought = [];
  const opts = { fought };
  // 0 くぼ地で 星の音さ
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
  assert.ok(c.flags[C10D.start], '幕が 始まった');
  assert.ok(said(bot, '第4幕　金の音と、星の橋'), '題の 画面');
  assert.equal(c.objective, C10D_OBJ.tower);
  // T1 星の塔 1階の 金色の ゆか → てっぺん
  await place(bot, 'star_tower_1f', TOWER1_BACK10D.x, TOWER1_BACK10D.y, 'up', opts);
  await stepOn(bot, TOWER1_GOLD10D[0].x, TOWER1_GOLD10D[0].y, opts);
  // T2 てっぺんに 着くと（着いた マスが 場面の マス）祭だんで 音さ → 光の 階段 → 星の 階段へ
  assert.ok(said(bot, '塔の、てっぺん…'), '金色の ゆかで てっぺんへ');
  assert.ok(c.flags[C10D.top], '光の 階段');
  assert.equal(bot.s.map, C10D_MAP.stair1, '星の 階段へ');
  assert.ok(said(bot, '世界が、小さく、見えた'));
  assert.equal(c.objective, C10D_OBJ.stairs);
  // いずみ 1（ちからの水）→ 門 1
  await goExamine(bot, STAIR1_POS.wells[0], 2, opts);
  assert.ok(c.flags.c10d_well1 && bot.s[C10D_POWER_KEY]);
  const chest1 = MAPS[C10D_MAP.stair1].chests[0];
  await goExamine(bot, chest1, 0, opts);
  assert.ok(c.chests[chest1.id], '宝箱');
  await goTo(bot, front(1).x, front(1).y, opts);
  assert.ok(fought.includes(C10D_BATTLE.gate1) && c.flags.c10d_gate1, '門 1');
  await goTo(bot, STAIR1_POS.up.x, STAIR1_POS.up.y, opts);
  assert.equal(bot.s.map, C10D_MAP.stair2);
  for (const g of [2, 3]) {
    await goTo(bot, front(g).x, front(g).y, opts);
    assert.ok(c.flags[`c10d_gate${g}`], `門 ${g}`);
  }
  await goTo(bot, STAIR2_POS.up.x, STAIR2_POS.up.y, opts);
  assert.equal(bot.s.map, C10D_MAP.stair3);
  await goTo(bot, front(4).x, front(4).y, opts);
  assert.ok(c.flags.c10d_gate4, '門 4');
  assert.equal(c.objective, C10D_OBJ.summit);
  await goTo(bot, STAIR3_POS.up.x, STAIR3_POS.up.y, opts);
  assert.equal(bot.s.map, C10D_MAP.summit);
  // T4・T5 鏡 → 金の 音
  await goTo(bot, SUMMIT_POS.bossScene.x + 4, SUMMIT_POS.bossScene.y + 1, opts);
  assert.ok(fought.includes(C10D_BATTLE.mirror), '鏡の 戦い');
  assert.ok(c.flags[C10D.mirror] && c.flags[C10D.note] && (c.keyItems || []).includes('note_do'), '金の 音');
  assert.ok(said(bot, '光の弱い者に、用はない'));
  assert.ok(said(bot, '女王さまに、お知らせせねば'));
  assert.ok(said(bot, 'さいごの、ひとふしまで'), '7ふしの 歌');
  assert.equal(c.objective, C10D_OBJ.hill);
  assert.deepEqual(fought.filter((f) => f !== 'field'), [...C10D_GATE_BATTLES, C10D_BATTLE.mirror], '決まった 戦いは 5つ');
  // 光の 出口 → てっぺん
  await goTo(bot, SUMMIT_POS.portal.x, SUMMIT_POS.portal.y, opts);
  assert.equal(bot.s.map, 'star_tower_top');
  // 金の 台は まだ（星見の丘が 先）
  await talkTo(bot, 'c9a_crater', 'c9c_ped2', 0, opts);
  assert.ok(said(bot, '星見の丘が、呼んでる') && !c.flags[C10D.act4]);
  // B1 星見の丘の 星の橋
  await place(bot, 'overworld', 60, 88, 'up', opts);
  await goTo(bot, 60, 86, opts);
  assert.ok(c.flags[C10D.bridge], '星の橋の 場面');
  assert.ok(said(bot, '橋は、空の、とちゅうで、止まった'));
  assert.equal(c.objective, C10D_OBJ.place);
  assert.ok(condOk(MAPS.overworld.npcs.find((n) => n.id === 'c10d_bridge').show, (f) => !!c.flags[f]), '止まった 橋の 絵が のこる');
  // E くぼ地の 金の 台 → 8つめの 台
  await talkTo(bot, 'c9a_crater', 'c9c_ped2', 0, opts);
  assert.ok(c.flags[C10D.act4], '幕と 第2章の クリア');
  assert.ok(!c.flags[C10D_PED.do], '小さな フラグは 消す');
  assert.ok(said(bot, '7つの台が、全部、光った'));
  assert.ok(said(bot, '台は、7つ、作ったはず'));
  assert.equal(c.objective, C10D_OBJ.act4);
  const has = (f) => !!c.flags[f];
  assert.ok(MAPS.c9a_crater.npcs.find((n) => n.id === 'c10_ped_do_on2' && condOk(n.show, has)), '光った 金の 台');
  assert.ok(MAPS.c9a_crater.npcs.find((n) => n.id === 'c10d_ped8' && condOk(n.show, has)), '8つめの 台');
  assert.ok(!C10D_MAP_IDS.some((id) => c.explored?.[id]), '「行った 所」は 取らない');
  // 金色の ゆかは いつでも（てっぺん ⇔ 1階）
  await place(bot, 'star_tower_top', TOP_ARRIVE10D.x, TOP_ARRIVE10D.y, 'down', opts);
  await stepOn(bot, TOP_GOLD10D.x, TOP_GOLD10D.y, opts);
  assert.equal(bot.s.map, 'star_tower_1f');
});

test('家族 2人: いっしょに 門の 番人と 戦う・いずみは リーダーが えらんで 2人に きく・なかまの 画面にも 開いた 門', async () => {
  const world = fixedWorld(9915);
  const { A, B, oA, oB } = await party2(world);
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf('c10d_start', 'c10d_top'));
  const E = STAIR1_POS.entry;
  await place(A.bot, C10D_MAP.stair1, E.x, E.y, 'up', oA);
  await place(B.bot, C10D_MAP.stair1, E.x + 1, E.y, 'up', oB);
  await goExamine(A.bot, STAIR1_POS.wells[0], 2, oA);
  assert.ok(A.bot.s[C10D_POWER_KEY] && B.bot.s[C10D_POWER_KEY], '2人に ちからの水');
  const fought = [];
  await goTo(A.bot, front(1).x, front(1).y, { ...oA, fought });
  assert.deepEqual(fought, [C10D_BATTLE.gate1]);
  assert.ok(A.c.flags.c10d_gate1, 'リーダーの フラグ');
  assert.ok(!isBlocked(MAPS[C10D_MAP.stair1], GATE_INFO10D[1].x, GATE_INFO10D[1].y, world.hasFlagFn(B.bot.s)), 'なかまにも 開いた 門');
  assert.ok(said(B.bot, '鏡のかけらでできた兵'), 'なかまも 同じ 場面を 見た');
});

test('見え方: 雲の すき間の 小さな 世界は どの マスでも 4つの 土地の どれか（マイナスで 配列の 外を 読まない）・曲の gateStage', async () => {
  const { landOf, noteC10dStage } = await import('../public/js/client/c10d-view.js');
  let n = 0;
  for (const id of C10D_MAP_IDS) {
    const m = MAPS[id];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const L = landOf(m, x, y);
      if (!L) continue;
      n++;
      assert.ok(L.land && L.land.g && L.land.l && L.land.dot, `${id} ${x},${y}`);
      for (const v of [L.ox, L.oy, L.r]) assert.ok(Number.isFinite(v) && v >= 0, `${id} ${x},${y}`);
    }
  }
  assert.ok(n > 10, `小さな 世界 ${n}こ`);
  // 大きな 座標（ハッシュが 2^31 を こえる 所）でも
  const big = { w: 4000, h: 4000, tiles: {} };
  let nb = 0;
  for (let y = 3900; y < 4000; y++) for (let x = 3900; x < 4000; x++) {
    big.tiles[y * 4000 + x] = T.CLOUD_SEA;
    const L = landOf(big, x, y);
    if (L) { nb++; assert.ok(L.land && L.ox >= 0 && L.oy >= 0, `${x},${y}`); }
  }
  assert.ok(nb > 0);
  const f = { map: MAPS[C10D_MAP.stair2], hasFlag: hasOf(['c10d_gate1', 'c10d_gate2']) };
  noteC10dStage(f);
  assert.equal(f.gateStage, 2);
  f.map = MAPS.c9a_crater;
  noteC10dStage(f);
  assert.equal(f.gateStage, 0, 'ほかの マップでは 0');
});
