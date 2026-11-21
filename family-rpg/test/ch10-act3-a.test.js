// 第3部 第2章 第3幕「むらさきと、うばわれた音」（第97回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c10_act2 → くぼ地で 星の音さ（c10c_start）→ クモイ地方の 光の うず → 空の 小島（音の 橋。c10c_isles2）→ うかぶ いせきの たいさ（c10c_colonel）
//   → 少年が むらさきの 音を うばう（c10c_stolen）→ くぼ地の 3人組（c10c_trio）→ 大地の下の うら口 → ベルトの 工場（c10c_fort_in → c10c_fort2）
//   → 少年の 間（c10c_algol）→ むらさきの 音（c10_note_si）→ くぼ地の むらさきの 台（c10_act3）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch10-act3.test.js）
// B班の 戦い・品は 合わせた（かりの data/c10c-stub.js・data/c10c-names-b.js は 消した）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, isBlocked, canStand, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C10C, C10C_LINE, C10C_LEVER, C10C_PED, C10C_MAP, C10C_MAP_IDS, C10C_CHEST_ALL, C10C_TILE_FIRST, C10C_TILE_LAST, C10C_TRACK_IDS, C10C_BATTLE,
  C10C_BRIDGE_MAPS, C10C_BELT_MAPS, C10C_BRIDGE_COLORS,
} from '../public/js/shared/maps/c10c-flags.js';
import { C9D_NOTES_PLACED } from '../public/js/shared/maps/c9d-flags.js';
import { CH10C_MAPS, BRIDGE_FLAG, spanStones10c } from '../public/js/shared/maps/c10c.js';
import {
  ISLES1_POS, ISLES2_POS, ISLES3_POS, FORT1_POS, FORT2_POS, FORT3_POS, KUMOI_VORTEX10C, KUMOI_LAND10C, UNDER_BACKDOOR10C, UNDER_LAND10C,
} from '../public/js/shared/maps/c10c-rows.js';
import { bridgesOf10c, c10cSnap, c10cOnPlay } from '../public/js/shared/world/c10c-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH10_STEPS, PART3_C10C_OPEN, c10cTitleSteps, CH10_PROGRESS, act2ClearObjective } from '../public/js/shared/data/story-c10.js';
import { C10B_OBJ } from '../public/js/shared/data/story-c10b.js';
import {
  C10C_OBJ, C10C_OBJ_ALL, CH10C_STORY_SCRIPTS, CH10C_PROGRESS, CH10C_OBJECTIVE_TARGETS, CH10C_OBJECTIVE_TALK, c10cScripts, applyCh10c, objective10c,
} from '../public/js/shared/data/story-c10c.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10C_SHOP_ADD } from '../public/js/shared/data/items-c10c.js';
import { existsSync } from 'node:fs';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { bridgeHudText10c } from '../public/js/client/c10c-view.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN, Bot } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, fixedWorld, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES10C = ['public/js/shared/maps/c10c-flags.js', 'public/js/shared/data/story-c10c.js', 'public/js/shared/maps/c10c.js', 'public/js/shared/maps/c10c-rows.js',
  'public/js/shared/world/c10c-steps.js', 'public/js/client/c10c-view.js', 'public/js/client/render/tiles-c10c.js', 'public/js/client/render/c10c-npc-art.js'];
const openScripts = () => c10cScripts(c10cTitleSteps, true, { ped: SCRIPTS.c9c_ped });
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh10c(SCRIPTS, STORY_SCRIPTS, { title: c10cTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const NOTES5 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la'];
const key = (x, y) => `${x},${y}`;

// ───── 歩いて（流されて）行ける 所 ─────
// 1歩の 行き先（流れ を ふくむ。宝箱・人・おし出される 箱 は 通れない。ワープは 行き先に しない）。
//   帰り … { to: 'x,y', path: [[x, y], …] }
function movesOf(map, has) {
  const npcAt = new Set(map.npcs.filter((n) => n.solid && condOk(n.show, has)).map((n) => key(Math.floor(n.x), Math.floor(n.y))));
  const bad = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x) || npcAt.has(key(x, y))
    || TILE_INFO[effectiveTile(map, x, y, has)]?.c10cPush;
  const out = new Map();
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (bad(x, y)) continue;
    const list = [];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (bad(nx, ny)) continue;
      if (map.warpAt.has(ny * map.w + nx)) { list.push({ to: key(nx, ny), path: [[nx, ny]], warp: true }); continue; }
      const r = carry(map, nx, ny, has);
      if (r.pit) { list.push({ to: key(r.x, r.y), path: r.path, warp: true }); continue; }
      if (bad(r.x, r.y)) continue;
      list.push({ to: key(r.x, r.y), path: r.path });
    }
    out.set(key(x, y), list);
  }
  return out;
}
function reachFrom(map, has, start) {
  const mv = movesOf(map, has);
  const seen = new Set([key(start.x, start.y)]);
  const q = [key(start.x, start.y)];
  for (let h = 0; h < q.length; h++) for (const m of mv.get(q[h]) || []) if (!m.warp && !seen.has(m.to)) { seen.add(m.to); q.push(m.to); }
  return seen;
}
const nextTo = (set, p) => D4.some(([dx, dy]) => set.has(key(p.x + dx, p.y + dy)));

// ───── 音の 橋: どの 小島・どの 橋の ならびからも 入口へ もどれる ─────
// 島の 上を 歩く（橋なし）＋ 石の となりから すき間の 両はしへ（その 石で 橋を かけて わたる）＋ 橋の 上から 両はしへ
function skyGraph(mapId) {
  const map = MAPS[mapId];
  const none = () => false;
  const mv = movesOf(map, none);
  const g = new Map([...mv].map(([k, l]) => [k, l.filter((m) => !m.warp).map((m) => m.to)]));
  const ends = (sp) => (sp.y0 === sp.y1 ? [[sp.x0 - 1, sp.y0], [sp.x1 + 1, sp.y0]] : [[sp.x0, sp.y0 - 1], [sp.x0, sp.y1 + 1]]);
  for (const sp of map.c10cSpans) {
    const E = ends(sp).map(([x, y]) => key(x, y));
    for (const st of sp.stones) for (const [dx, dy] of D4) {
      const k = key(st.x + dx, st.y + dy);
      if (g.has(k)) g.get(k).push(...E);
    }
    // 橋の 上に 立って いる（橋が かかって いる 時）: 両はしへ
    for (const p of sp.cells) g.set(key(p.x, p.y), [...E]);
  }
  return g;
}
function canReachBack(mapId, goal) {
  const g = skyGraph(mapId);
  const back = new Map();
  for (const [k, l] of g) for (const t of l) { if (!back.has(t)) back.set(t, []); back.get(t).push(k); }
  const good = new Set([goal]);
  const q = [goal];
  for (let h = 0; h < q.length; h++) for (const k of back.get(q[h]) || []) if (!good.has(k)) { good.add(k); q.push(k); }
  return { good, g };
}

// ───── ベルトの 工場: レバー（赤・青）を 引きながら 行ける 所 ─────
const LV = (red, blue) => (f) => (f === C10C_LEVER.red ? red : f === C10C_LEVER.blue ? blue : false);
const leverCells = (map, color) => {
  const out = [];
  for (const g of map.gates) if (g.flag === (color === 'red' ? C10C_LEVER.red : C10C_LEVER.blue) && [T.C10C_LEVER_R, T.C10C_LEVER_B].includes(g.closed)) out.push({ x: g.x, y: g.y });
  return out;
};
// (x, y, 赤, 青) の BFS。goal(x, y) に 着く 手（[{ path } | { lever: 'red'|'blue', at }]）
function fortSolve(mapId, start, red, blue, goal) {
  const map = MAPS[mapId];
  const mvs = [0, 1, 2, 3].map((i) => movesOf(map, LV(!!(i & 1), !!(i & 2))));
  const levers = { red: leverCells(map, 'red'), blue: leverCells(map, 'blue') };
  const sk = (k, r, b) => `${k}|${r ? 1 : 0}${b ? 1 : 0}`;
  const k0 = sk(key(start.x, start.y), red, blue);
  const prev = new Map([[k0, null]]);
  const q = [[key(start.x, start.y), red, blue]];
  for (let h = 0; h < q.length; h++) {
    const [k, r, b] = q[h];
    const [x, y] = k.split(',').map(Number);
    if (goal(x, y)) {
      const out = [];
      for (let s = sk(k, r, b); prev.get(s); s = prev.get(s).from) out.unshift(prev.get(s).act);
      return out;
    }
    const push = (k2, r2, b2, act) => { const s = sk(k2, r2, b2); if (!prev.has(s)) { prev.set(s, { from: sk(k, r, b), act }); q.push([k2, r2, b2]); } };
    for (const m of mvs[(r ? 1 : 0) + (b ? 2 : 0)].get(k) || []) if (!m.warp || goal(...m.to.split(',').map(Number))) push(m.to, r, b, { path: m.path });
    for (const c of ['red', 'blue']) for (const L of levers[c]) if (Math.abs(L.x - x) + Math.abs(L.y - y) === 1) push(k, c === 'red' ? !r : r, c === 'blue' ? !b : b, { lever: c, at: L });
  }
  return null;
}

// ───── 世界で 遊ぶ 手 ─────
async function act2Player(world, name, job) {
  openAct();
  const P = await addPlayer(world, name, 'c10_act2', ['c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la'], job);
  P.c.keyItems = [...new Set([...(P.c.keyItems || []), ...NOTES5])];
  P.c.objective = act2ClearObjective(true);
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
// 橋を かける（すき間 i に 色 c。今 いる 島の がわの 石で）
async function bridge(bot, i, c, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const st = map.c10cSpans[i].stones.find((s) => D4.some(([dx, dy]) => (s.x + dx === sx && s.y + dy === sy) || (!isBlocked(map, s.x + dx, s.y + dy, has) && pathTo(map, sx, sy, s.x + dx, s.y + dy, has))));
  assert.ok(st, `${map.id} すき間 ${i} の 石に とどく`);
  await goExamine(bot, st, C10C_BRIDGE_COLORS.indexOf(c), opts);
  assert.equal(bridgesOf10c(bot.world, bot.s)[c], i, `${map.id} すき間 ${i} に ${c} の 橋`);
}
// ベルトの 工場を レバーを 引きながら 進む
async function fortGo(bot, goal, opts) {
  const c = bot.s.char;
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const plan = fortSolve(map.id, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, !!has(C10C_LEVER.red), !!has(C10C_LEVER.blue), goal);
  assert.ok(plan, `${map.id}: レバーを 引けば とどく`);
  for (const a of plan) {
    if (a.path) { for (const [x, y] of a.path) await stepOn(bot, x, y, opts); continue; }
    const before = !!bot.world.hasFlagFn(bot.s)(C10C_LEVER[a.lever]);
    bot.choice = 0;
    await examine(bot, a.at.x, a.at.y, opts);
    assert.equal(!!bot.world.hasFlagFn(bot.s)(C10C_LEVER[a.lever]), !before, `${a.lever} の レバー`);
  }
  return c;
}
async function forkScene(bot, opts) {
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
}
const at = (p) => (x, y) => x === p.x && y === p.y;
const adj = (p) => (x, y) => Math.abs(x - p.x) + Math.abs(y - p.y) === 1;

test('名前の 約束: マップ 6まい・タイル 551〜590・宝箱の id・一本の 線・台本・やり直しの 行き先・曲・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH10C_MAPS, ['c10c_isles1', 'c10c_isles2', 'c10c_isles3', 'c10c_fort1', 'c10c_fort2', 'c10c_fort3']);
  for (const id of C10C_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
    assert.ok(!m.noEscape, `${id} は 糸・羽が 使える`);
  }
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C10C_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C10C_TILE_FIRST);
  assert.ok(ids[ids.length - 1] <= C10C_TILE_LAST, 'タイルは 590 まで');
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C10C_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.deepEqual(C10C_LINE, ['c10c_start', 'c10c_isles2', 'c10c_colonel', 'c10c_stolen', 'c10c_trio', 'c10c_fort_in', 'c10c_fort2', 'c10c_algol', 'c10_note_si', 'c10_act3']);
  assert.deepEqual(CH10_STEPS.slice(-C10C_LINE.length), C10C_LINE);
  assert.deepEqual(STORY_STEPS.slice(-C10C_LINE.length - 1), ['c10_act2', ...C10C_LINE]);
  for (const f of [...Object.values(C10C_LEVER), C10C_PED.si]) assert.ok(!STORY_STEPS.includes(f), `${f} は 線に 入らない`);
  // 宝箱 12こ（空 6・とりで 6）
  const chests = C10C_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual([...chests].sort(), [...C10C_CHEST_ALL].sort());
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある（今の マップに 足した 物も）
  openAct();
  for (const id of [...C10C_MAP_IDS, 'kumoi', 'c9b_under', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c10c|^c10_ped_si/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH10C_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  assert.equal(BOSS_RETRY.c10c_colonel, 'c10c_colonel_event');
  assert.equal(BOSS_RETRY.c10c_algol, 'c10c_algol_event');
  assert.equal(BOSS_HINT_WHO.c10c_colonel, 'ノクト');
  assert.equal(BOSS_HINT_WHO.c10c_algol, 'ノクト');
  // 曲（F班の id。マップと 場面）
  assert.deepEqual(C10C_TRACK_IDS, ['c10c_isles', 'c10c_colonel', 'c10c_stolen', 'c10c_fort', 'c10c_rival', 'c10c_six']);
  for (const id of ['c10c_isles1', 'c10c_isles2', 'c10c_isles3']) assert.equal(MAPS[id].bgm, 'c10c_isles');
  for (const id of ['c10c_fort1', 'c10c_fort2', 'c10c_fort3']) assert.equal(MAPS[id].bgm, 'c10c_fort');
  const sc = (id, ...fl) => JSON.stringify(SCRIPTS[id](ctx(flagsOf(...fl))));
  assert.ok(sc('c10c_colonel_event', 'c10c_start', 'c10c_isles2').includes('"c10c_colonel"'), 'たいさの 曲');
  assert.ok(sc('c10c_colonel_event', 'c10c_start', 'c10c_isles2').includes('"c10c_stolen"'), 'うばわれた 場面の 曲');
  assert.ok(sc('c10c_algol_event', 'c10c_fort2').includes('"c10c_rival"'), '少年との 戦いの 曲');
  assert.ok(sc('c10_ped_si', 'c10c_start', 'c10_note_si').includes('"c10c_six"'), '6つの 音の 曲');
  // スピカの歌: むらさきの 音で 1ふし
  assert.ok(C9D_NOTES_PLACED.includes('c10_note_si'));
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES10C) {
    assert.ok(list.some((x) => x.endsWith(f)), `gameFiles に ${f}`);
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c10c-stub.js・B の c10c-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['../public/js/shared/data/c10c-stub.js', '../public/js/shared/data/c10c-names-b.js']) assert.ok(!existsSync(new URL(f, import.meta.url)), `${f} は 消した`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c10c-stub|c10c-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // B班の 本物（宝箱 12こ・魔物の 表・決まった 戦い・だいじな 物・店）
  for (const id of C10C_CHEST_ALL) {
    const ch = C10C_MAP_IDS.flatMap((m) => MAPS[m].chests).find((c) => c.id === id);
    assert.ok(ch && ch.item && !ch.gold, `宝箱 ${id} の 中み（かりの お金では ない）`);
  }
  for (const t of ['t10c_isles', 't10c_fort']) assert.ok(ENCOUNTER_TABLES[t], t);
  assert.ok(MAPS.c10c_isles1.spawnCounts.t10c_isles && MAPS.c10c_fort1.spawnCounts.t10c_fort, '魔物が 出る');
  assert.equal(MAPS.c10c_isles1.zoneAt(18, 25), 't10c_isles');
  for (const b of ['c10c_colonel', 'c10c_algol']) assert.ok(FIXED_ENCOUNTERS[b]?.boss && FIXED_ENCOUNTERS[b].canFlee === false, b);
  assert.equal(FIXED_ENCOUNTERS.c10c_algol.bgm, 'c10c_rival', '少年の 戦いの 曲');
  assert.equal(ITEMS.note_si?.type, 'key');
  assert.ok(C10C_SHOP_ADD.every((id) => SHOPS.c10c_crater.items.includes(id)));
  assert.ok(SHOPS.c10b_crater.items.every((id) => SHOPS.c10c_crater.items.includes(id)), '第2幕の 店の 品も ある');
  assert.ok(JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act1', 'c10_act2', 'c10_act3')))).includes('c10c_crater'), '幕の クリアの あとの 店');
  assert.ok(!JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act1', 'c10_act2')))).includes('c10c_crater'), 'クリアの 前は 今の 店');
  assert.equal(bridgeHudText10c({ red: 0, green: 2 }), '橋 ●○●○○');
});

test('台本の きまり: 第1部・第2部の ひみつ・カイ・ソリトゥス・影の城の 中・少年の わけ・小さな 暗い 星・たいさの もとの 作品を 書かない', () => {
  const src = ['public/js/shared/data/story-c10c.js', 'public/js/shared/maps/c10c.js', 'public/js/shared/maps/c10c-flags.js', 'public/js/shared/world/c10c-steps.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const S = openScripts();
  const fl = flagsOf(...UPTO('c10_act2'), ...C10C_LINE.slice(0, -1), C10C_LEVER.red);
  const all = JSON.stringify(Object.values(S).map((fn) => fn(ctx(fl))));
  const scenes = JSON.stringify([
    S.c10c_fork_event(ctx(flagsOf(...UPTO('c10_act2')))), S.c10c_vortex(ctx(flagsOf('c10c_start'))), S.c10c_isles2_in(ctx(flagsOf('c10c_start'))),
    S.c10c_colonel_event(ctx(flagsOf('c10c_start', 'c10c_isles2'))), S.c10c_trio_event(ctx(flagsOf('c10c_stolen'))), S.c10c_fort_in(ctx(flagsOf('c10c_trio'))),
    S.c10c_algol_event(ctx(flagsOf('c10c_fort2'))), S.c10_ped_si(ctx(flagsOf('c10c_start', 'c10_note_si'))),
    ...['c10c_hint_f2b', 'c10c_hint_f2c'].flatMap((id) => [S[id](ctx({})), S[id](ctx(flagsOf(C10C_LEVER.red, C10C_LEVER.blue)))]),
  ]);
  const text = all + scenes;
  for (const w of ['カイ', 'ソリトゥス', 'シラネ', 'ラピュタ', 'ムスカ大佐', 'ムスカ。', 'バルス', 'ゴミのよう', '3分', '三分', '目が、目が', '目がぁ', 'ロボット兵', 'シータ', 'パズー',
    '飛行石', 'サングラス', 'ペンダント', '銃', '王の']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  assert.ok(!/ソリトゥス|カイ[^ずだ]/.test(src.replace(/\/\/.*$/gm, '')), 'ソースの 文にも 出さない');
  // 少年は「ぼくに いる 物だ」まで（わけは 書かない）
  const algol = JSON.parse(scenes).flat().filter((s) => s[0] === 'say' && s[1] === 'アルゴル').map((s) => s[2]);
  assert.deepEqual(algol, ['…返さない。\nこれは、ぼくに、いる物だ。', '……。', '…にてなど、いない。']);
  const si = JSON.parse(JSON.stringify(S.c10c_vorb(ctx(flagsOf('c10c_algol'))))).filter((s) => s[0] === 'say' && s[1] === 'アルゴル').map((s) => s[2]);
  assert.deepEqual(si, ['…にてなど、いない。']);
  // スピカの 記おく: 小さな 暗い 星の 名前は 思い出せない（だれかは 書かない）
  const end = JSON.stringify(S.c10_ped_si(ctx(flagsOf('c10c_start', 'c10_note_si'))));
  assert.ok(end.includes('小さな、暗い星') && end.includes('思い出せない'));
  assert.ok(end.includes('星の塔') && end.includes('金色'), '遠くの 星の塔が 光る');
  // 影の城は 遠くに 見えるだけ
  assert.ok(!/影の城の(中|おく|王|あるじ)/.test(text));
  // ズラッカだけ いつも 逆
  assert.ok(text.includes('ぜんぶ、逆を言ってる'));
});

test('閉じた 幕（PART3_C10C_OPEN）: くぼ地で 音さを 鳴らしても 始まらない・第2幕 クリアの 目標は 今の まま・幕を 開けた 形も ためす', () => {
  const a2 = flagsOf(...UPTO('c10_act2'));
  const closed = c10cScripts(c10cTitleSteps, false);
  assert.deepEqual(closed.c10c_fork_event(ctx(a2)), []);
  if (!PART3_C10C_OPEN) {
    assert.equal(act2ClearObjective(), C10B_OBJ.act2, '閉じて いる 間は「第3幕へ（続きは…）」の まま');
    assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10C_OBJ.place), '第3幕の 目標は まだ ない');
    assert.ok(CH10_PROGRESS.some(([, t]) => t === C10B_OBJ.act2));
    // 第2幕の さいごの 場面の 目標も 今の まま
    const end2 = JSON.stringify(SCRIPTS.c10_ped_la(ctx(flagsOf('c10b_start', 'c10_note_la', 'c10_ped_so'))));
    assert.ok(end2.includes(C10B_OBJ.act2));
  }
  assert.equal(act2ClearObjective(true), C10C_OBJ.start);
  const open = openScripts();
  const s = JSON.stringify(open.c10c_fork_event(ctx(a2)));
  assert.ok(s.includes('第2章　七つの星の音') && s.includes('第3幕　むらさきと、うばわれた音'), '題の 画面');
  assert.ok(s.includes('…雲の上か。'), 'ノクト');
  assert.deepEqual(open.c10c_fork_event(ctx(flagsOf(...UPTO('c10_act1')))), [], '第2幕の 間は 始まらない');
  assert.deepEqual(open.c10c_fork_event(ctx({ ...a2, c10c_start: true })), [], '1回だけ');
});

test('目標: 一本道の 目標・すすみぐあいから なおせる・行き先と ひとこと', () => {
  const o = (...fl) => objective10c(hasOf(['c10_act2', ...fl]));
  assert.equal(o(), C10C_OBJ.start);
  assert.equal(o('c10c_start'), C10C_OBJ.sky);
  assert.equal(o('c10c_start', 'c10c_isles2'), C10C_OBJ.isles);
  assert.equal(o('c10c_start', 'c10c_isles2', 'c10c_colonel', 'c10c_stolen'), C10C_OBJ.trio);
  assert.equal(o('c10c_start', 'c10c_trio'), C10C_OBJ.trio);
  assert.equal(o('c10c_start', 'c10c_fort_in'), C10C_OBJ.fort);
  assert.equal(o('c10c_start', 'c10c_fort2'), C10C_OBJ.fort2);
  assert.equal(o('c10c_start', 'c10_note_si'), C10C_OBJ.place);
  assert.equal(o('c10c_start', 'c10_note_si', 'c10_act3'), C10C_OBJ.act3);
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH10C_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH10C_PROGRESS[i]; if (typeof k === 'function' ? k(c) : c.flags[k]) return t; } return null; };
  for (let i = 0; i < C10C_LINE.length; i++) {
    const fl = ['c10_act2', ...C10C_LINE.slice(0, i + 1)];
    assert.equal(prog(fl), objective10c(hasOf(fl)), fl.join(','));
  }
  for (const t of C10C_OBJ_ALL) {
    assert.ok(CH10C_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    for (const p of CH10C_OBJECTIVE_TARGETS[t]) assert.ok(MAPS[p.map], p.map);
    const talk = CH10C_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
});

test('前の 章を 遊んで いる 人を こわさない: クモイ地方・大地の下・くぼ地に 足したのは フラグで 出る 物だけ・足した とびらには open の タイル', () => {
  openAct();
  const k = MAPS.kumoi, u = MAPS.c9b_under;
  const V = KUMOI_VORTEX10C, B = UNDER_BACKDOOR10C;
  for (const has of [() => false, hasOf(UPTO('c10_act2'))]) {
    assert.equal(effectiveTile(k, V.x, V.y, has), T.CLOUD_SEA, '光の うずは 出ない（雲の 海の まま）');
    assert.ok(isBlocked(k, V.x, V.y, has));
    assert.ok(k.actions.filter((a) => a.script === 'c10c_vortex').every((a) => !condOk(a.show, has)));
    assert.equal(effectiveTile(u, B.x, B.y, has), T.C9B_ROCK, 'うら口は 出ない（岩の まま）');
    for (const w of u.warps.filter((v) => v.x === B.x && v.y === B.y)) assert.ok(!condOk(w.show, has), 'ワープも 動かない');
  }
  assert.equal(effectiveTile(k, V.x, V.y, hasOf(['c10c_start'])), T.C10C_VORTEX);
  assert.equal(effectiveTile(u, B.x, B.y, hasOf(['c10c_trio'])), T.C10C_BACKDOOR);
  // 光の うずは 影の城の前の小島の 北の はしから しらべる（着く 所は 歩ける）
  const has5 = hasOf(UPTO('c10_act2'));
  assert.ok(canStand(k, KUMOI_LAND10C.x + 0.5, KUMOI_LAND10C.y + 0.5, has5), 'クモイ地方に もどった 所');
  assert.equal(Math.abs(KUMOI_LAND10C.x - V.x) + Math.abs(KUMOI_LAND10C.y - V.y), 1);
  // うら口の 前は 大地の下の 道から 歩いて 行ける
  const r = reachFrom(u, hasOf([...UPTO('c10_act2'), 'c10c_trio']), { x: 9, y: 8 });
  assert.ok(r.has(key(UNDER_LAND10C.x, UNDER_LAND10C.y)), 'うら口の 前へ 歩ける');
  // 足した とびらには open の タイルが ある
  for (const id of ['kumoi', 'c9b_under', ...C10C_MAP_IDS]) for (const g of MAPS[id].gates.filter((x) => x.flag || x.levels)) assert.ok(TILE_INFO[g.open], `${id} ${g.x},${g.y} の open`);
  // くぼ地の むらさきの 台は 前の 台本へ
  const ped7 = MAPS.c9a_crater.npcs.find((n) => n.id === 'c9c_ped7');
  assert.equal(ped7.script, 'c10_ped_si');
  assert.deepEqual(SCRIPTS.c10_ped_si(ctx(flagsOf('c9_note1'))), SCRIPTS.c9c_ped(ctx(flagsOf('c9_note1'))));
  assert.deepEqual(SCRIPTS.c10_ped_si(ctx(flagsOf(...UPTO('c10_act2')))), SCRIPTS.c9c_ped(ctx(flagsOf(...UPTO('c10_act2')))), '第2幕の 人にも 今の まま');
  // 第3幕の はじめの マスは 第2幕を 終えた 人だけ
  const fork = MAPS.c9a_crater.triggers.find((t) => t.id === 'c10c_fork_event');
  assert.ok(!condOk(fork.show, hasOf(UPTO('c10_act1'))) && condOk(fork.show, hasOf(UPTO('c10_act2'))));
});

test('音の 橋: 同じ 色は 1本・どの 小島・どの 橋の ならびからも 入口へ もどれる・1まいめは 5本で 足りる・2まいめは かけかえる・風の 小島', () => {
  for (const id of C10C_BRIDGE_MAPS) {
    const map = MAPS[id];
    const E = id === C10C_MAP.isles1 ? ISLES1_POS.entry : ISLES2_POS.entry;
    // すき間の 両はしに 石が 1つずつ（どの 小島からも 自分で かけ直せる）
    for (const sp of map.c10cSpans) {
      assert.equal(sp.stones.length, 2);
      for (const s of sp.stones) assert.equal(map.tiles[s.y * map.w + s.x], T.C10C_STONE, `${id} 石 ${s.x},${s.y}`);
      assert.deepEqual(sp.stones, spanStones10c(sp));
      // 橋が なければ 雲の 海（落ちない）・5色の どれでも かかる
      for (const p of sp.cells) {
        assert.equal(effectiveTile(map, p.x, p.y, () => false), T.CLOUD_SEA);
        assert.ok(isBlocked(map, p.x, p.y, () => false));
        for (const c of C10C_BRIDGE_COLORS) assert.ok(!isBlocked(map, p.x, p.y, (f) => f === BRIDGE_FLAG(sp.i, c)), `${c} の 橋`);
      }
    }
    // どの マス（島の 上・どの 橋の 上）からも 入口へ（石で かけ直して）
    const { good, g } = canReachBack(id, key(E.x, E.y));
    for (const k of g.keys()) assert.ok(good.has(k), `${id} ${k} から 入口へ`);
    // 入口から 出口（上り 階段）・宝箱へ
    const fwd = new Set([key(E.x, E.y)]);
    const q = [key(E.x, E.y)];
    for (let h = 0; h < q.length; h++) for (const t of g.get(q[h]) || []) if (!fwd.has(t)) { fwd.add(t); q.push(t); }
    const up = id === C10C_MAP.isles1 ? ISLES1_POS.up : ISLES2_POS.up;
    assert.ok(nextTo(fwd, up), `${id} 出口へ`);
    for (const ch of map.chests) assert.ok(nextTo(fwd, ch), `${id} 宝箱 ${ch.id}`);
  }
  // 1まいめ: すき間 5つ（5色で ぜんぶ かけられる）・入口から 出口まで 4本
  const m1 = MAPS[C10C_MAP.isles1];
  assert.equal(m1.c10cSpans.length, 5);
  const all1 = (f) => /^@br(\d):(\w+)$/.test(f) && C10C_BRIDGE_COLORS[Number(f[3])] === f.split(':')[1];
  const r1 = reachFrom(m1, all1, ISLES1_POS.entry);
  assert.ok(nextTo(r1, ISLES1_POS.up) && m1.chests.every((c) => nextTo(r1, c)), '1まいめは 5本 かけたまま ぜんぶ 行ける');
  // 2まいめ: すき間 7つ（5本では たりない）。出口までの 5本を かけた まま では 遠回りの 宝箱へ 行けない
  const m2 = MAPS[C10C_MAP.isles2];
  assert.equal(m2.c10cSpans.length, 7);
  const main5 = (f) => /^@br(\d):(\w+)$/.test(f) && Number(f[3]) < 5 && C10C_BRIDGE_COLORS[Number(f[3])] === f.split(':')[1];
  const r2 = reachFrom(m2, main5, ISLES2_POS.entry);
  assert.ok(nextTo(r2, ISLES2_POS.up), '5本で 出口へ');
  const far = m2.chests.filter((c) => !nextTo(r2, c));
  assert.ok(far.length >= 2, `遠回りの 宝箱は かけかえないと 行けない（${far.map((c) => c.id).join(',')}）`);
  // 風の 小島: 風の 道で 行って 帰れる（橋は いらない）
  const windChest = m2.chests.find((c) => c.y <= 7 && c.x <= 20);
  const j2 = { x: 15, y: 16 };
  const rw = reachFrom(m2, () => false, j2);
  assert.ok(nextTo(rw, windChest), '風に 乗って 風の 小島の 宝箱へ');
  assert.ok(reachFrom(m2, () => false, { x: windChest.x, y: windChest.y + 1 }).has(key(j2.x, j2.y)), 'もどりの 風で 帰れる');
  for (const [x, y] of [[17, 13], [14, 8]]) assert.ok(TILE_INFO[m2.tiles[y * m2.w + x]].flow, '風の 道');
  // 魔物は 橋・風の 上では 出ない
  for (const sp of m2.c10cSpans) for (const p of sp.cells) assert.ok(String(m2.zoneAt(p.x, p.y)).startsWith('safe'));
});

test('ベルトと レバー: レバーの 4つの 向き × どの ベルトに 乗っても 歩いて レバーか 入口へ・ひとりで ぜんぶ とける・箱は ベルトの 先に ない', () => {
  for (const id of C10C_BELT_MAPS) {
    const map = MAPS[id];
    const ent = id === C10C_MAP.fort1 ? [FORT1_POS.exit, FORT1_POS.entry] : [FORT2_POS.up, FORT2_POS.entry];
    const levers = [...leverCells(map, 'red'), ...leverCells(map, 'blue')];
    assert.ok(leverCells(map, 'red').length >= 2 && leverCells(map, 'blue').length >= 2, `${id} 赤と 青の レバー`);
    let belts = 0;
    for (const red of [false, true]) for (const blue of [false, true]) {
      const has = LV(red, blue);
      const mv = movesOf(map, has);
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
        const fl = TILE_INFO[effectiveTile(map, x, y, has)]?.flow;
        if (!fl) continue;
        belts++;
        const r = carry(map, x, y, has);
        assert.ok(!r.loop && !r.pit, `${id} ${x},${y} の ベルトは 止まる`);
        assert.ok(!TILE_INFO[effectiveTile(map, r.x, r.y, has)]?.c10cPush, `${id} ベルトの 先に おし出される 箱が ない`);
        // 止まった 所から 歩いて レバーか 入口へ
        const seen = new Set([key(r.x, r.y)]);
        const q = [key(r.x, r.y)];
        let ok = false;
        for (let h = 0; h < q.length && !ok; h++) {
          const [cx, cy] = q[h].split(',').map(Number);
          if (levers.some((L) => Math.abs(L.x - cx) + Math.abs(L.y - cy) === 1) || ent.some((e) => Math.abs(e.x - cx) + Math.abs(e.y - cy) <= 1)) ok = true;
          for (const m of mv.get(q[h]) || []) if (!m.warp && !seen.has(m.to)) { seen.add(m.to); q.push(m.to); }
        }
        assert.ok(ok, `${id} 赤${red ? '引' : '-'}青${blue ? '引' : '-'}: ${x},${y} の ベルトから レバーか 入口へ`);
      }
      // ベルトの 上には 魔物が 出ない
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (TILE_INFO[effectiveTile(map, x, y, has)]?.flow) assert.ok(String(map.zoneAt(x, y)).startsWith('safe'));
    }
    assert.ok(belts > 0);
    // おし出される 箱の となりは ベルトでは ない（箱で もどされて また 運ばれる ことが ない）
    for (const g of map.gates.filter((x) => x.open === T.C10C_PUSHER)) for (const [dx, dy] of D4) assert.ok(!TILE_INFO[map.tiles[(g.y + dy) * map.w + g.x + dx]]?.flow, `${id} 箱 ${g.x},${g.y}`);
  }
  // ひとりで ぜんぶ とける（どの レバーの 向きから 始めても。下り 階段・宝箱）
  for (const [id, start, down] of [[C10C_MAP.fort1, FORT1_POS.entry, FORT1_POS.down], [C10C_MAP.fort2, FORT2_POS.entry, FORT2_POS.down]]) {
    const map = MAPS[id];
    for (const red of [false, true]) for (const blue of [false, true]) {
      assert.ok(fortSolve(id, start, red, blue, at(down)), `${id} 下り 階段へ（赤${red}・青${blue}）`);
      for (const c of map.chests) assert.ok(fortSolve(id, start, red, blue, adj(c)), `${id} 宝箱 ${c.id}`);
      // 下り 階段から 入口へ も もどれる
      const back = id === C10C_MAP.fort1 ? FORT1_POS.exit : FORT2_POS.up;
      assert.ok(fortSolve(id, { x: down.x, y: down.y + 1 }, red, blue, at(back)), `${id} 入口へ もどれる`);
    }
    // レバーを 引かないと 行けない（遊びに なって いる）
    assert.ok(!reachFrom(map, LV(false, false), start).has(key(down.x, down.y + 1)), `${id} は レバーを 引かないと おくへ 行けない`);
  }
  // 少年の 間: 入口から 少年の 前へ 歩ける
  const m3 = MAPS[C10C_MAP.fort3];
  assert.ok(reachFrom(m3, () => false, FORT3_POS.entry).has(key(FORT3_POS.bossScene.x + 4, FORT3_POS.bossScene.y)));
});

test('サーバー: 音の 橋は パーティーで 同じ・ほかの パーティーとは べつ・同じ 色は 1本・人が いる 橋は 消えない・階を 出ると 消える・snap・回線が 切れた 時', async () => {
  const world = fixedWorld(9711);
  const A = await act2Player(world, 'ソラ');
  const B = await act2Player(world, 'ミナ', 'mage');
  const C = await act2Player(world, 'リク', 'priest');
  for (const P of [A, B, C]) Object.assign(P.c.flags, flagsOf('c10c_start'));
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  const bots = { bots: [B.bot, C.bot] };
  await play(A.bot, bots);
  const E = ISLES1_POS.entry;
  await place(A.bot, C10C_MAP.isles1, E.x, E.y, 'up', bots);
  await place(B.bot, C10C_MAP.isles1, E.x + 1, E.y, 'up', { bots: [A.bot, C.bot] });
  await place(C.bot, C10C_MAP.isles1, E.x - 1, E.y, 'up', { bots: [A.bot, B.bot] });
  // ソラが 赤の 橋（すき間 0）→ ミナにも 見える・リクには 見えない
  await bridge(A.bot, 0, 'red', bots);
  const sp0 = MAPS[C10C_MAP.isles1].c10cSpans[0];
  assert.ok(!isBlocked(MAPS[C10C_MAP.isles1], sp0.cells[0].x, sp0.cells[0].y, world.hasFlagFn(B.bot.s)), 'ミナにも 橋');
  assert.ok(isBlocked(MAPS[C10C_MAP.isles1], sp0.cells[0].x, sp0.cells[0].y, world.hasFlagFn(C.bot.s)), 'ほかの パーティーには 橋が ない');
  assert.deepEqual(c10cSnap(world, B.bot.s), { br: { red: 0 } }, 'snap の 橋');
  assert.ok(said(A.bot, '光の橋が、となりの島へ、かかった'));
  // ミナが 橋の 上へ → ソラが べつの すき間に 赤を かけようと しても 消えない
  await stepOn(B.bot, sp0.cells[1].x, sp0.cells[1].y, { bots: [A.bot] });
  await place(A.bot, C10C_MAP.isles1, 15, 22, 'up', bots);
  const st1 = MAPS[C10C_MAP.isles1].c10cSpans[1].stones[1];
  await goExamine(A.bot, st1, 0, bots);
  assert.ok(said(A.bot, 'だれかが、赤の橋を、わたっている'), 'だれかが わたって いる');
  assert.equal(bridgesOf10c(world, A.bot.s).red, 0, '赤は すき間 0 の まま');
  // 黄（ミ）なら かけられる → 2本
  await goExamine(A.bot, st1, 1, bots);
  assert.deepEqual(bridgesOf10c(world, B.bot.s), { red: 0, yellow: 1 });
  // ミナが 橋から おりると 赤を うつせる（すき間 0 の 橋は 消える）
  await stepOn(B.bot, sp0.cells[0].x - 1, sp0.cells[0].y, { bots: [A.bot] });
  await goExamine(A.bot, st1, 0, bots);
  assert.deepEqual(bridgesOf10c(world, B.bot.s), { red: 1 }, '同じ 色は 1本だけ（黄の すき間に 赤）');
  assert.ok(isBlocked(MAPS[C10C_MAP.isles1], sp0.cells[0].x, sp0.cells[0].y, world.hasFlagFn(B.bot.s)), 'すき間 0 の 橋は 消えた');
  // 回線が 切れて もどった 時は 階の 入口（場所だけ）
  const s = { map: C10C_MAP.isles2, x: 30.5, y: 16.5 };
  c10cOnPlay(world, s);
  assert.deepEqual([Math.floor(s.x), Math.floor(s.y)], [ISLES2_POS.entry.x, ISLES2_POS.entry.y]);
  // パーティーの だれも 階に いなく なると 橋は 消える
  await place(A.bot, 'c9a_crater', 12, 9, 'up', bots);
  await place(B.bot, 'c9a_crater', 13, 9, 'up', { bots: [A.bot, C.bot] });
  await tickN(world, 3);
  await place(A.bot, C10C_MAP.isles1, E.x, E.y, 'up', bots);
  assert.deepEqual(bridgesOf10c(world, A.bot.s), {}, '橋なし から');
});

test('サーバー: 回線が 切れて すぐ もどる（同じ セッションを ひきつぐ）→ 空の 小島の 入口・橋は 家族が いれば その まま', async () => {
  const world = fixedWorld(9712, { offline: false, checkPassword: () => true });
  const A = await act2Player(world, 'ソラ');
  const B = await act2Player(world, 'ミナ', 'mage');
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf('c10c_start', 'c10c_isles2'));
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const E = ISLES2_POS.entry;
  await place(A.bot, C10C_MAP.isles2, E.x, E.y, 'up', { bots: [B.bot] });
  await place(B.bot, C10C_MAP.isles2, E.x + 1, E.y, 'up', { bots: [A.bot] });
  await bridge(A.bot, 0, 'green', { bots: [B.bot] });
  await goTo(A.bot, 15, 28, { bots: [B.bot] });
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed, '同じ セッションを ひきついだ');
  assert.equal(A2.s.map, C10C_MAP.isles2);
  assert.deepEqual([Math.floor(A2.s.x), Math.floor(A2.s.y)], [E.x, E.y], '階の 入口');
  assert.deepEqual(bridgesOf10c(world, A2.s), { green: 0 }, '橋は 家族と 同じ まま（ミナは まだ 階に いる）');
});

test('サーバー: レバーは パーティーで 同じ（リーダーの フラグ・セーブする）・おし出される 箱は 1マス もどす', async () => {
  const world = fixedWorld(9713);
  const A = await act2Player(world, 'ソラ');
  const B = await act2Player(world, 'ミナ', 'mage');
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf(...C10C_LINE.slice(0, 6)));
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const map = MAPS[C10C_MAP.fort1];
  await place(A.bot, C10C_MAP.fort1, 14, 20, 'up', { bots: [B.bot] });
  await place(B.bot, C10C_MAP.fort1, 11, 20, 'up', { bots: [A.bot] });
  // ミナ（なかま）が 赤の レバーを 引く → ソラ（リーダー）の フラグ ＝ 2人とも ベルトが 北へ
  const L = leverCells(map, 'red').find((p) => p.y === 20);
  B.bot.choice = 0;
  await examine(B.bot, L.x, L.y, { bots: [A.bot] });
  assert.ok(A.c.flags[C10C_LEVER.red], 'リーダーの フラグ（セーブする）');
  for (const P of [A, B]) assert.equal(effectiveTile(map, 13, 15, world.hasFlagFn(P.bot.s)), T.C10C_BELT_RN, `${P.c.name}: 赤の ベルトは 北へ`);
  assert.ok(said(B.bot, 'ぎゃくに流れだした'));
  // おし出される 箱（赤の レバーを 引くと 出る）: ふれると 1マス もどされる
  await place(A.bot, C10C_MAP.fort1, 5, 10, 'left', { bots: [B.bot] });
  assert.equal(effectiveTile(map, 4, 10, world.hasFlagFn(A.bot.s)), T.C10C_PUSHER);
  await stepOn(A.bot, 4, 10, { bots: [B.bot] });
  assert.deepEqual([Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)], [5, 10], '1マス もどされた');
  assert.ok(A.bot.msgs.some((m) => m.t === 'toast' && m.text.includes('おしもどされた')));
  // レバーを もどすと 箱は ひっこむ（すみの 宝箱へ）
  await place(A.bot, C10C_MAP.fort1, 12, 10, 'up', { bots: [B.bot] });
  A.bot.choice = 0;
  await examine(A.bot, 12, 9, { bots: [B.bot] });
  assert.ok(!A.c.flags[C10C_LEVER.red]);
  await place(A.bot, C10C_MAP.fort1, 5, 10, 'left', { bots: [B.bot] });
  await stepOn(A.bot, 4, 10, { bots: [B.bot] });
  assert.deepEqual([Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)], [4, 10], '箱が ひっこんで 通れる');
});

test('通し（ひとり）: くぼ地 → クモイの 光の うず → 空の 小島（橋）→ うかぶ いせき → うばわれる → 3人組 → うら口 → ベルトの 工場 → 少年の 間 → 台（c10_act3）', async () => {
  const world = fixedWorld(9714);
  const { bot, c } = await act2Player(world, 'ソラ');
  const fought = [];
  const opts = { fought };
  await forkScene(bot, opts);
  assert.ok(c.flags[C10C.start], '幕が 始まった');
  assert.ok(said(bot, '第3幕　むらさきと、うばわれた音'), '題の 画面');
  assert.equal(c.objective, C10C_OBJ.sky);
  // S1 クモイ地方の 光の うず
  await place(bot, 'kumoi', KUMOI_LAND10C.x, KUMOI_LAND10C.y, 'up', opts);
  await examine(bot, KUMOI_VORTEX10C.x, KUMOI_VORTEX10C.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles1, '星の竜が 空の 小島へ');
  assert.ok(said(bot, '星ふるえで、雲の上に'));
  await talkTo(bot, C10C_MAP.isles1, 'c10c_sign1', 0, opts);
  assert.ok(said(bot, '同じ色の橋は、ひとつだけ'));
  await place(bot, C10C_MAP.isles1, ISLES1_POS.entry.x, ISLES1_POS.entry.y, 'up', opts);
  // S2 1まいめ: 4本 かけて 出口へ
  for (const [i, col] of [[0, 'red'], [1, 'yellow'], [2, 'green'], [3, 'blue']]) {
    await bridge(bot, i, col, opts);
    const sp = MAPS[C10C_MAP.isles1].c10cSpans[i];
    const far = sp.y0 === sp.y1 ? { x: sp.x1 + 1, y: sp.y0 } : { x: sp.x0, y: sp.y0 - 1 };
    await goTo(bot, far.x, far.y, opts);
  }
  await goTo(bot, ISLES1_POS.up.x, ISLES1_POS.up.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles2);
  assert.ok(c.flags[C10C.isles2], '2まいめ');
  assert.equal(c.objective, C10C_OBJ.isles);
  // 2まいめ: 出口までの 5本 ＋ 遠回りの 宝箱（赤を かけかえる）
  const m2 = MAPS[C10C_MAP.isles2];
  const cross = async (i, col, back = false) => {
    await bridge(bot, i, col, opts);
    const sp = m2.c10cSpans[i];
    const ends = sp.y0 === sp.y1 ? [{ x: sp.x0 - 1, y: sp.y0 }, { x: sp.x1 + 1, y: sp.y0 }] : [{ x: sp.x0, y: sp.y0 - 1 }, { x: sp.x0, y: sp.y1 + 1 }];
    const me = { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) };
    const far = ends.sort((a, b) => (Math.abs(b.x - me.x) + Math.abs(b.y - me.y)) - (Math.abs(a.x - me.x) + Math.abs(a.y - me.y)))[back ? 1 : 0];
    await goTo(bot, far.x, far.y, opts);
  };
  await cross(0, 'red'); await cross(1, 'yellow'); await cross(2, 'green');
  // j3 → j6（遠回りの 宝箱。赤は 入口の すき間から うつる）
  await cross(5, 'red');
  const ch6 = m2.chests.find((x) => x.y >= 26 && x.x >= 23);
  await goExamine(bot, ch6, 0, opts);
  assert.ok(c.chests[ch6.id], '遠回りの 宝箱');
  assert.deepEqual(Object.keys(bridgesOf10c(world, bot.s)).sort(), ['green', 'red', 'yellow'], '赤は 1本だけ');
  await cross(5, 'red');
  await cross(3, 'blue'); await cross(4, 'white');
  await goTo(bot, ISLES2_POS.up.x, ISLES2_POS.up.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles3, 'うかぶ いせき');
  // S3 たいさ → S4 うばわれる → S5 くぼ地の 3人組
  const B = ISLES3_POS.bossScene;
  await goTo(bot, B.x + 4, B.y, opts);
  assert.ok(fought.includes(C10C_BATTLE.colonel), 'たいさの 戦い');
  assert.ok(c.flags[C10C.colonel] && c.flags[C10C.stolen] && c.flags[C10C.trio]);
  assert.ok(said(bot, '…まって！'), 'スピカ');
  assert.ok(said(bot, 'とりでの、うら口、知ってるわよ'), '3人組');
  assert.equal(bot.s.map, 'c9a_crater', 'くぼ地へ もどった');
  assert.equal(c.objective, C10C_OBJ.trio);
  assert.ok(!(c.keyItems || []).includes('note_si'), 'むらさきの 音は うばわれた');
  // F1 大地の下の うら口 → F2 ベルトの 工場
  await place(bot, 'c9b_under', UNDER_LAND10C.x, UNDER_LAND10C.y, 'right', opts);
  await stepOn(bot, UNDER_BACKDOOR10C.x, UNDER_BACKDOOR10C.y, opts);
  assert.equal(bot.s.map, C10C_MAP.fort1, 'とりでへ');
  assert.ok(c.flags[C10C.fortIn], 'とりでに 入った');
  assert.equal(c.objective, C10C_OBJ.fort);
  await talkTo(bot, C10C_MAP.fort1, 'c10c_hint_f1a', 0, opts);
  assert.ok(said(bot, 'レバーを、引いてごらんなさい'), 'キラジョの ヒント');
  await place(bot, C10C_MAP.fort1, FORT1_POS.entry.x, FORT1_POS.entry.y, 'up', opts);
  for (const ch of MAPS[C10C_MAP.fort1].chests) { await fortGo(bot, adj(ch), opts); await examine(bot, ch.x, ch.y, opts); assert.ok(c.chests[ch.id], ch.id); }
  await fortGo(bot, at(FORT1_POS.down), opts);
  assert.equal(bot.s.map, C10C_MAP.fort2);
  assert.ok(c.flags[C10C.fort2]);
  // ズラッカの ヒント（いつも 逆）
  await talkTo(bot, C10C_MAP.fort2, 'c10c_hint_f2b', 0, opts);
  assert.ok(said(bot, '…本当か？'));
  await place(bot, C10C_MAP.fort2, FORT2_POS.entry.x, FORT2_POS.entry.y, 'up', opts);
  for (const ch of MAPS[C10C_MAP.fort2].chests) { await fortGo(bot, adj(ch), opts); await examine(bot, ch.x, ch.y, opts); assert.ok(c.chests[ch.id], ch.id); }
  await fortGo(bot, at(FORT2_POS.down), opts);
  assert.equal(bot.s.map, C10C_MAP.fort3, '少年の 間');
  // F3 少年 → F4 むらさきの 音
  const AB = FORT3_POS.bossScene;
  await goTo(bot, AB.x + 4, AB.y, opts);
  assert.ok(fought.includes(C10C_BATTLE.algol), '少年との 戦い');
  assert.ok(c.flags[C10C.algol] && c.flags[C10C.note] && (c.keyItems || []).includes('note_si'), 'むらさきの 音');
  assert.ok(said(bot, '…にてなど、いない。'));
  assert.ok(said(bot, '歌が、ひとふし、ふえた'));
  assert.equal(c.objective, C10C_OBJ.place);
  // 光の 出口から 大地の下へ
  await goTo(bot, FORT3_POS.portal.x, FORT3_POS.portal.y, opts);
  assert.equal(bot.s.map, 'c9b_under');
  // E くぼ地の むらさきの 台
  await talkTo(bot, 'c9a_crater', 'c9c_ped7', 0, opts);
  assert.ok(c.flags[C10C.act3], '幕の クリア');
  assert.ok(!c.flags[C10C_PED.si], '小さな フラグは 消す');
  assert.ok(said(bot, '6つの台が、いっしょに、光った'));
  assert.ok(said(bot, '小さな、暗い星'), 'スピカの 記おく');
  assert.equal(c.objective, C10C_OBJ.act3);
  assert.ok(MAPS.c9a_crater.npcs.find((n) => n.id === 'c10_ped_si_on2' && condOk(n.show, (f) => !!c.flags[f])), '光った 台');
  assert.ok(!C10C_MAP_IDS.some((id) => c.explored?.[id]), '「行った 所」は 取らない');
  // 光の うずからは いつでも 空の 小島へ（2回めは 短く）
  await place(bot, 'kumoi', KUMOI_LAND10C.x, KUMOI_LAND10C.y, 'up', opts);
  await examine(bot, KUMOI_VORTEX10C.x, KUMOI_VORTEX10C.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles1);
  await goExamine(bot, ISLES1_POS.vortex, 0, opts);
  assert.equal(bot.s.map, 'kumoi', 'うずから もどれる');
});

test('家族 2人: 橋を 手分け（1人が 石の そばで かけ、もう 1人が わたる）・レバーを 手分け', async () => {
  const world = fixedWorld(9715);
  const A = await act2Player(world, 'ソラ');
  const B = await act2Player(world, 'ミナ', 'mage');
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf('c10c_start', 'c10c_isles2'));
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const oA = { bots: [B.bot] }, oB = { bots: [A.bot] };
  const E = ISLES2_POS.entry;
  await place(A.bot, C10C_MAP.isles2, E.x, E.y, 'up', oA);
  await place(B.bot, C10C_MAP.isles2, E.x + 1, E.y, 'up', oB);
  // ミナが すき間 0 を かける → ソラが わたる
  await bridge(B.bot, 0, 'white', oB);
  await goTo(A.bot, 13, 28, oA);
  assert.equal(Math.floor(A.bot.s.x), 13, 'ソラは わたれた');
  // ソラが すき間 1 を かける → ミナが わたって 追いつく
  await bridge(A.bot, 1, 'blue', oA);
  await goTo(B.bot, 15, 19, oB);
  assert.equal(Math.floor(B.bot.s.y), 19, 'ミナも 2つ先の 島へ');
  // レバーを 手分け（とりで 2: ミナが 入口で 赤を 引き、ソラは 分かれ道で 青を 引く）
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf(...C10C_LINE.slice(0, 7)));
  await place(A.bot, C10C_MAP.fort2, 17, 20, 'up', oA);
  await place(B.bot, C10C_MAP.fort2, 4, 21, 'up', oB);
  B.bot.choice = 0;
  await examine(B.bot, 3, 21, oB);
  A.bot.choice = 0;
  await examine(A.bot, 16, 19, oA);
  for (const P of [A, B]) {
    const has = world.hasFlagFn(P.bot.s);
    assert.ok(has(C10C_LEVER.red) && has(C10C_LEVER.blue), `${P.c.name}: 赤と 青 どちらも 引いた`);
  }
  // ミナは 赤の ベルトで 分かれ道へ・ソラは 青の ベルトで 北の 部屋へ
  await stepOn(B.bot, 9, 23, oB);
  const rb = carry(MAPS[C10C_MAP.fort2], 9, 23, world.hasFlagFn(B.bot.s));
  assert.deepEqual([rb.x, rb.y], [15, 23], '赤の ベルトで 東へ');
  const ra = carry(MAPS[C10C_MAP.fort2], 18, 18, world.hasFlagFn(A.bot.s));
  assert.deepEqual([ra.x, ra.y], [18, 10], '青の ベルトで 北へ');
});
