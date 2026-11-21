// 第3部 第2章 第2幕「青と白」（第95回 A班: 世界と 物語）※ ネタバレ注意（物語の 中みを ためす）
// c10_act1 → くぼ地で 星の音さ（c10b_start。目標 2行）→ すきな じゅん:
//   青 … ピラミッドの 岸の いかだ乗り場「青い流れ」（c10b_blue_in）→ 鐘で 水の 高さ → 湖の 底の かぎの 石（c10b_blue_key）→ 高い 岸の とびら
//        → かれた 間の 砂の しんし（c10b_gecko → c10b_blue_boss）→ 青の 音（c10_note_so）→ わき水から 水鏡の 広間
//   白 … 白銀の湖の 小島（夜だけ 光の 階段）→ 氷の 下の 道（c10b_white_in → c10b_white2。こっそり）→ 月の 間の かいとう（c10b_owl → c10b_white_boss）
//        → 白の 音（c10_note_la）→ 岸への 氷の 階段
// → くぼ地の 青と 白の 台（c10_act2）
// 戦いの 中みは B班。ここでは 決まった 戦いを テストの 中で すぐ 勝たせる（本当の 戦いは test/ch10-act2.test.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { MAPS, isBlocked, canStand, effectiveTile, condOk } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C10B, C10B_LINE, C10B_BLUE, C10B_WHITE, C10B_BONUS, C10B_PED, C10B_MAP, C10B_MAP_IDS, C10B_CHEST_ALL, C10B_TILE_FIRST, C10B_TILE_LAST,
  C10B_TRACK_IDS, C10B_BATTLE, C10B_SNEAK_MAPS, C10B_NOISE_MAX, C10B_CAUGHT_EASE, C10B_OWL_TURN_STEPS,
} from '../public/js/shared/maps/c10b-flags.js';
import { C9D_NOTES_PLACED } from '../public/js/shared/maps/c9d-flags.js';
import { CH10B_MAPS, c10bCell, NIGHT_STAIRS_FLAG } from '../public/js/shared/maps/c10b.js';
import {
  BLUE1_POS, BLUE2_POS, WHITE1_POS, WHITE2_POS, WHITE3_POS, heightAt10b, LAKE_STAIRS10B, LAKE_SIGN10B, LAKE_LAND10B, SHORE_STAIRS10B, HALL_ARRIVE10B,
} from '../public/js/shared/maps/c10b-rows.js';
import { waterOf10b, owlDir10b, owlView10b, watchedCells10b, hidden10b, activeOwls10b, c10bSnap, caughtOf10b } from '../public/js/shared/world/c10b-steps.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH10_STEPS, PART3_C10B_OPEN, c10bTitleSteps, CH10_PROGRESS, act1ClearObjective } from '../public/js/shared/data/story-c10.js';
import { C10A_OBJ } from '../public/js/shared/data/story-c10a.js';
import {
  C10B_OBJ, C10B_OBJ_ALL, CH10B_STORY_SCRIPTS, CH10B_PROGRESS, CH10B_OBJECTIVE_TARGETS, CH10B_OBJECTIVE_TALK, c10bScripts, applyCh10b, objective10b,
} from '../public/js/shared/data/story-c10b.js';
import { BOSS_RETRY, BOSS_HINT_WHO } from '../public/js/shared/data/boss-hints.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10B_SHOP_ADD } from '../public/js/shared/data/items-c10b.js';
import { existsSync } from 'node:fs';
import { isPart3Map } from '../public/js/client/audio-scene.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { tickN } from './helpers.js';
import { UPTO, flagsOf, said, D4, addPlayer, play, place, stepOn, examine, talkTo, fixedWorld, pathTo } from './c9a-play.js';

const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => true, count: () => 0, ...extra });
const FILES10B = ['public/js/shared/maps/c10b-flags.js', 'public/js/shared/data/story-c10b.js', 'public/js/shared/maps/c10b.js', 'public/js/shared/maps/c10b-rows.js',
  'public/js/shared/world/c10b-steps.js', 'public/js/shared/maps/c10b-sneak.js', 'public/js/client/c10b-view.js', 'public/js/client/render/tiles-c10b.js', 'public/js/client/render/c10b-npc-art.js'];
const openScripts = () => c10bScripts(c10bTitleSteps, true, { ped: SCRIPTS.c9c_ped });
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh10b(SCRIPTS, STORY_SCRIPTS, { title: c10bTitleSteps, open: true });
}
const hasOf = (list) => (f) => list.includes(f);
const waterHas = (L, flags = []) => (f) => f === `@w${L}` || flags.includes(f);

// ───── 水鏡の うら: 歩いて（飛びこんで・流されて）とどく マス ─────
// 1歩の 行き先（飛びこむ ワープ・流れ を ふくむ）
function blueMoves(L, flags = []) {
  const map = MAPS[C10B_MAP.blue1];
  const has = waterHas(L, flags);
  const enter = (x, y) => {
    const w = map.warps.find((v) => v.x === x && v.y === y && condOk(v.show, has));
    if (w && w.to.map === map.id) return [Math.floor(w.to.x), Math.floor(w.to.y)];
    if (w) return null;
    const r = carry(map, x, y, has);
    return [r.x, r.y];
  };
  const out = new Map();
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const list = [];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || isBlocked(map, nx, ny, has) || map.chestAt.has(ny * map.w + nx)) continue;
      const to = enter(nx, ny);
      if (to) list.push(`${to[0]},${to[1]}`);
    }
    out.set(`${x},${y}`, list);
  }
  return out;
}
function blueReach(L, start, flags = []) {
  const mv = blueMoves(L, flags);
  const seen = new Set([`${start.x},${start.y}`]);
  const q = [`${start.x},${start.y}`];
  for (let h = 0; h < q.length; h++) for (const k of mv.get(q[h]) || []) if (!seen.has(k)) { seen.add(k); q.push(k); }
  return seen;
}
// 行き先（goal の マス）へ 行ける マス ぜんぶ（うしろから さがす）
function blueCanReach(L, goals, flags = []) {
  const mv = blueMoves(L, flags);
  const back = new Map();
  for (const [k, list] of mv) for (const t of list) { if (!back.has(t)) back.set(t, []); back.get(t).push(k); }
  const good = new Set(goals);
  const q = [...goals];
  for (let h = 0; h < q.length; h++) for (const k of back.get(q[h]) || []) if (!good.has(k)) { good.add(k); q.push(k); }
  return good;
}
const nextTo = (set, p) => D4.some(([dx, dy]) => set.has(`${p.x + dx},${p.y + dy}`));

// ───── 氷の 下: 見はりに 見つからずに 行ける 道（すべる 氷は 本当の 動きと 同じ。うすい 氷は ふまない）─────
//   goal(x, y) … 着いたら おわり / 帰り … 通った マスの ならび（すべった マスも ふくむ）
function sneakPath(mapId, start, goal, { n = 0, asleep = false, flags = [] } = {}) {
  const map = MAPS[mapId];
  const has = (f) => flags.includes(f);
  const CY = C10B_OWL_TURN_STEPS * 4;
  const blocked = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x)
    || map.npcs.some((p) => p.solid && condOk(p.show, has) && Math.floor(p.x) === x && Math.floor(p.y) === y);
  const seenAt = (x, y, steps) => {
    const t = effectiveTile(map, x, y, has);
    if (hidden10b(t)) return false;
    return watchedCells10b(map, steps, n, asleep, has).has(`${x},${y}`);
  };
  const k0 = `${start.x},${start.y},0`;
  const prev = new Map([[k0, null]]);
  const q = [[start.x, start.y, 0, []]];
  for (let h = 0; h < q.length; h++) {
    const [x, y, st] = q[h];
    const key = `${x},${y},${st % CY}`;
    if (goal(x, y)) {
      const out = [];
      for (let k = key; prev.get(k); k = prev.get(k).from) out.unshift(...prev.get(k).cells);
      return out;
    }
    for (const [dx, dy] of D4) {
      let cx = x + dx, cy = y + dy;
      if (blocked(cx, cy)) continue;
      const isWarp = map.warpAt.has(cy * map.w + cx);
      if (isWarp && !goal(cx, cy)) continue;
      const cells = [[cx, cy]];
      let s2 = st + 1;
      let ok = true;
      if (effectiveTile(map, cx, cy, has) === T.C10B_THIN) continue;
      // すべる 氷: 前が ふさがるか、氷で ない マスに 着くまで すべる
      while (!isWarp && effectiveTile(map, cx, cy, has) === T.C10B_SLIDE && !blocked(cx + dx, cy + dy)) {
        cx += dx; cy += dy; s2 += 1;
        cells.push([cx, cy]);
        if (effectiveTile(map, cx, cy, has) === T.C10B_THIN) { ok = false; break; }
      }
      if (!ok) continue;
      if (!isWarp && map.warpAt.has(cy * map.w + cx) && !goal(cx, cy)) continue;
      if (!isWarp && seenAt(cx, cy, s2)) continue;
      const k = `${cx},${cy},${s2 % CY}`;
      if (prev.has(k)) continue;
      prev.set(k, { from: key, cells });
      q.push([cx, cy, s2]);
    }
  }
  return null;
}
const adj = (p) => (x, y) => Math.abs(x - p.x) + Math.abs(y - p.y) === 1;
const at = (p) => (x, y) => x === p.x && y === p.y;

async function act1Player(world, name, job) {
  openAct();
  const P = await addPlayer(world, name, 'c10_act1', ['c10_note_re', 'c10_note_fa', 'c10_r_stairs', 'c10_r_boss', 'c10_g_root', 'c10_g_boss'], job);
  P.c.keyItems = [...new Set([...(P.c.keyItems || []), 'note_mi', 'note_re', 'note_fa'])];
  P.c.objective = act1ClearObjective(true);
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
// 鐘を 鳴らす（L … 0 下・1 中・2 上。えらぶ 番号は 持って いる 音の じゅん）
async function ring(bot, L, opts) {
  const map = MAPS[C10B_MAP.blue1];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const bell = BLUE1_POS.bells.find((b) => D4.some(([dx, dy]) => (b.x + dx === sx && b.y + dy === sy) || (!isBlocked(map, b.x + dx, b.y + dy, has) && pathTo(map, sx, sy, b.x + dx, b.y + dy, has))));
  assert.ok(bell, 'とどく 鐘');
  await goExamine(bot, bell, L, opts);
  assert.equal(waterOf10b(bot.world, bot.s), L, `水：${L}`);
}
// 氷の 下で 見はりを よけて 歩く
async function sneakTo(bot, goal, opts) {
  const path = sneakPath(bot.s.map, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, goal, { n: caughtOf10b(bot.world, bot.s) });
  assert.ok(path, `${bot.s.map}: 見つからずに 行ける`);
  // 歩数を サーバーと そろえる（入口から 歩きはじめる 時は 0）
  const n0 = caughtOf10b(bot.world, bot.s);
  for (const [x, y] of path) {
    await stepOn(bot, x, y, opts);
    assert.equal(caughtOf10b(bot.world, bot.s), n0, `${bot.s.map} ${x},${y} で 見つからない（歩数 ${bot.s.c10bSn?.steps}）`);
    if (bot.s.map !== MAPS[bot.s.map].id) break;
  }
}
// くぼ地で 音さを 鳴らす（場面 0）
async function forkScene(bot, opts) {
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
}
// 青の 道（いかだ乗り場 → 水鏡の うら → かぎの 石 → とびら → かれた 間 → 青の 音）
async function blueRun(bot, opts) {
  const c = bot.s.char;
  const sh = { x: 85, y: 12 };
  await talkTo(bot, C9C_RIVER, 'c9c_post2', 2, opts);
  assert.equal(bot.s.map, C10B_MAP.blue1, '青い流れへ');
  assert.ok(c.flags[C10B_BLUE.in], '水鏡の うらに 着いた');
  assert.equal(waterOf10b(bot.world, bot.s), 1, 'はじめは 中');
  assert.ok(sh);
  // 水を 下げて 湖の 底の かぎの 石
  await ring(bot, 0, opts);
  await goExamine(bot, BLUE1_POS.key, 0, opts);
  assert.ok(c.flags[C10B_BLUE.key], 'かぎの 石');
  // 水を 上げて 高い 岸の とびらへ
  await ring(bot, 2, opts);
  await goTo(bot, BLUE1_POS.down.x, BLUE1_POS.down.y, opts);
  assert.equal(bot.s.map, C10B_MAP.blue2, 'かれた 間');
  const B = BLUE2_POS.bossScene;
  await goTo(bot, B.x + 4, B.y, opts);
  assert.ok(c.flags[C10B_BLUE.boss], '砂の しんしに 勝った');
  assert.ok(c.flags[C10B_BLUE.note] && (c.keyItems || []).includes('note_so'), '青の 音');
}
const C9C_RIVER = 'c9c_river';
// 白の 道（夜の 湖 → 氷の 下 → 月の 間 → 白の 音）
async function whiteRun(bot, opts) {
  const c = bot.s.char;
  // 夜にする（宿で 夜まで 休んだ 形）
  bot.world.c10bTestNight?.(bot.s);
  await place(bot, 'north', 27, 60, 'left', opts);
  await stepOn(bot, 26, 60, opts);
  await stepOn(bot, 25, 60, opts);
  assert.ok(said(bot, '光の階段'), '夜の 湖の 場面');
  await stepOn(bot, 25, 61, opts);
  await stepOn(bot, LAKE_STAIRS10B.x, LAKE_STAIRS10B.y, opts);
  assert.equal(bot.s.map, C10B_MAP.white1, '氷の 下へ');
  await play(bot, opts);
  assert.ok(c.flags[C10B_WHITE.in], '氷の 下に 入った');
  await sneakTo(bot, at(WHITE1_POS.down), opts);
  assert.equal(bot.s.map, C10B_MAP.white2);
  assert.ok(c.flags[C10B_WHITE.two]);
  await sneakTo(bot, at(WHITE2_POS.down), opts);
  assert.equal(bot.s.map, C10B_MAP.white3, '月の 間');
  const B = WHITE3_POS.bossScene;
  await goTo(bot, B.x + 4, B.y + 1, opts);
  assert.ok(c.flags[C10B_WHITE.boss], 'かいとうに 勝った');
  assert.ok(c.flags[C10B_WHITE.note] && (c.keyItems || []).includes('note_la'), '白の 音');
}
function setNight(world, s) {
  // パーティーの 時計を 夜に（clock.js の restShift と 同じ 形）
  const DAY = 20 * 60 * 1000;
  const now = world.now();
  const want = 0.8;
  const cur = ((now % DAY) + DAY) % DAY / DAY;
  s.char.timeShift = Math.round((((want - cur) % 1) + 1) % 1 * DAY);
}

test('名前の 約束: マップ 5まい・タイル 521〜550・宝箱の id・一本の 線（青・白は 入れない）・台本・やり直しの 行き先・字の きまり・かりは 本体から 読まない', () => {
  assert.deepEqual(CH10B_MAPS, ['c10b_blue1', 'c10b_blue2', 'c10b_white1', 'c10b_white2', 'c10b_white3']);
  for (const id of C10B_MAP_IDS) {
    const m = MAPS[id];
    assert.ok(m && m.name, id);
    assert.ok(isPart3Map(id, m), `${id} は 第3部の マップ`);
    assert.ok(m.noExplore, `${id} は「行った 所」を 取らない`);
    assert.ok(!m.noEscape, `${id} は 糸・羽が 使える`);
  }
  const ids = Object.entries(T).filter(([k]) => k.startsWith('C10B_')).map(([, v]) => v).sort((a, b) => a - b);
  assert.equal(ids[0], C10B_TILE_FIRST);
  assert.equal(ids[ids.length - 1], C10B_TILE_LAST);
  assert.deepEqual(ids, Array.from({ length: ids.length }, (_, i) => C10B_TILE_FIRST + i));
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length);
  for (const v of ids) assert.ok(TILE_INFO[v], String(v));
  assert.deepEqual(C10B_LINE, ['c10b_start', 'c10_act2']);
  assert.deepEqual(CH10_STEPS.slice(-22, -20), C10B_LINE); // 第97回 A班: うしろに 第3幕の 線（10こ）。第99回 A班: 第4幕の 線（10こ）
  // 第97回 A班: うしろに 第3幕の 線（10こ。maps/c10c-flags.js の C10C_LINE）
  assert.deepEqual(STORY_STEPS.slice(-25, -20), ['c9_act4', 'c10_start', 'c10_act1', 'c10b_start', 'c10_act2']);
  for (const f of [...Object.values(C10B_BLUE), ...Object.values(C10B_WHITE), ...Object.values(C10B_BONUS), ...Object.values(C10B_PED)]) {
    assert.ok(!STORY_STEPS.includes(f), `${f} は 一本の 線に 入らない（すきな じゅん）`);
  }
  // 宝箱 14こ（青 6・白 6・おまけ 2）
  const chests = C10B_MAP_IDS.flatMap((id) => MAPS[id].chests.map((c) => c.id));
  assert.deepEqual([...chests].sort(), [...C10B_CHEST_ALL].sort());
  // 台本: マップの 人・しらべる 所・ふむ 所の 台本は ぜんぶ ある（今の マップに 足した 物も）
  openAct();
  for (const id of [...C10B_MAP_IDS, 'north', 'c9a_crater']) {
    for (const a of [...MAPS[id].actions, ...MAPS[id].triggers, ...MAPS[id].npcs]) if (/^c10b|^c10_ped_(so|la)/.test(a.script)) assert.ok(SCRIPTS[a.script], `${id} ${a.script}`);
  }
  for (const id of CH10B_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id), id);
  assert.equal(BOSS_RETRY.c10b_gecko, 'c10b_gecko_event');
  assert.equal(BOSS_RETRY.c10b_owl, 'c10b_owl_event');
  assert.equal(BOSS_HINT_WHO.c10b_gecko, 'ノクト');
  assert.deepEqual(C10B_TRACK_IDS, ['c10b_blue', 'c10b_gecko', 'c10b_night', 'c10b_white', 'c10b_owl', 'c10b_five']);
  for (const id of ['c10b_blue1', 'c10b_blue2']) assert.equal(MAPS[id].bgm, 'c10b_blue');
  for (const id of ['c10b_white1', 'c10b_white2', 'c10b_white3']) assert.equal(MAPS[id].bgm, 'c10b_white');
  assert.ok(JSON.stringify(SCRIPTS.c10b_gecko_event(ctx(flagsOf('c10b_blue_in')))).includes('c10b_gecko'), '砂の しんしの 曲');
  assert.ok(JSON.stringify(SCRIPTS.c10b_owl_event(ctx(flagsOf('c10b_white2')))).includes('c10b_owl'), 'かいとうの 曲');
  assert.ok(JSON.stringify(SCRIPTS.c10b_lake_night(ctx(flagsOf('c10b_start')))).includes('c10b_night'), '夜の 湖の 曲');
  // スピカの歌: 青・白の 音で 1ふしずつ
  assert.ok(C9D_NOTES_PLACED.includes('c10_note_so') && C9D_NOTES_PLACED.includes('c10_note_la'));
  // 字の きまり（使えない 漢字 0・スペース 0）。新しい ファイルは gameFiles() に ある
  const list = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of FILES10B) {
    assert.ok(list.some((x) => x.endsWith(f)), `gameFiles に ${f}`);
    const g = gameFiles().find((x) => x.replace(/\\/g, '/').endsWith(f));
    assert.deepEqual(checkFile(g).filter((p) => p.kind !== 'kana'), [], f);
  }
  // かりの 置き場（A の c10b-stub.js・B の c10b-names-b.js）は 合わせた 時に 消した。だれも 読まない
  for (const f of ['../public/js/shared/data/c10b-stub.js', '../public/js/shared/data/c10b-names-b.js']) assert.ok(!existsSync(new URL(f, import.meta.url)), `${f} は 消した`);
  const walk = (dir) => readdirSync(new URL(dir, import.meta.url), { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(`${dir}${d.name}/`) : /\.m?js$/.test(d.name) ? [`${dir}${d.name}`] : []));
  for (const f of [...walk('../public/js/'), ...walk('../server/'), ...walk('../tools/'), ...walk('./')]) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/from '[^']*(c10b-stub|c10b-names-b)/.test(src), `${f} は かりを 読まない`);
  }
  // B班の 本物（宝箱 14こ・魔物の 表・決まった 戦い・だいじな 物・店）
  for (const id of C10B_CHEST_ALL) {
    const ch = C10B_MAP_IDS.flatMap((m) => MAPS[m].chests).find((c) => c.id === id);
    assert.ok(ch && (ch.item || ch.gold), `宝箱 ${id} の 中み`);
  }
  for (const t of ['t10b_blue_wet', 't10b_blue_dry']) assert.ok(ENCOUNTER_TABLES[t], t);
  for (const b of ['c10b_gecko', 'c10b_owl']) assert.ok(FIXED_ENCOUNTERS[b]?.boss && FIXED_ENCOUNTERS[b].canFlee === false, b);
  for (const b of C10B_BATTLE.watch) assert.ok(FIXED_ENCOUNTERS[b]?.loseOk && FIXED_ENCOUNTERS[b].canFlee !== false, `${b} は にげられる・負けても よい`);
  for (const k of ['note_so', 'note_la']) assert.equal(ITEMS[k]?.type, 'key', k);
  assert.ok(C10B_SHOP_ADD.every((id) => SHOPS.c10b_crater.items.includes(id)));
  assert.ok(JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act1', 'c10_act2')))).includes('c10b_crater'), '幕の クリアの あとの 店');
  assert.ok(!JSON.stringify(SCRIPTS.c9b_armorer(ctx(flagsOf('c10_act1')))).includes('c10b_crater'), 'クリアの 前は 今の 店');
});

test('台本の きまり: 第1部・第2部の ひみつ・カイ・ソリトゥス・竜シラネ・少年の わけ・中ボスの もとの 作品の 名前と せりふを 書かない', () => {
  const src = ['public/js/shared/data/story-c10b.js', 'public/js/shared/maps/c10b.js', 'public/js/shared/maps/c10b-flags.js', 'public/js/shared/world/c10b-steps.js']
    .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const all = JSON.stringify(Object.values(openScripts()).map((fn) => {
    const fl = flagsOf(...UPTO('c10_act1'), 'c10b_start', 'c10b_blue_in', 'c10b_white_in', 'c10b_white2', 'c10b_blue_boss', 'c10b_white_boss', 'c10_note_so', 'c10_note_la', 'c10_ped_so', 'c10_ped_la');
    return fn(ctx(fl));
  }));
  const text = all + JSON.stringify([SCRIPTS.c10b_gecko_event(ctx(flagsOf('c10b_blue_in'))), SCRIPTS.c10b_owl_event(ctx(flagsOf('c10b_white2')))]);
  for (const w of ['カイ', 'ソリトゥス', 'シラネ', 'クロコダイル', 'キッド', 'コナン', 'ワンピース', '怪盗', 'ルフィ', 'Mr.', 'ミスター', '葉巻', 'フック', 'トランプ', '片めがね', 'ハンググライダー', '名探偵', 'ショータイム', 'イッツ']) {
    assert.ok(!text.includes(w), `台本に「${w}」を 書かない`);
  }
  // 「もっと光りなさい」と 言った のが だれかは 書かない・少年は「…あと、2つ」と だけ
  const end = JSON.stringify(SCRIPTS.c10_ped_la(ctx(flagsOf('c10b_start', 'c10_note_la', 'c10_ped_so'))));
  assert.ok(end.includes('もっと、光りなさい') && end.includes('わからない'));
  assert.ok(end.includes('…あと、2つ。'));
  const algol = JSON.parse(end).filter((s) => s[0] === 'say' && s[1] === 'アルゴル').map((s) => s[2]);
  assert.deepEqual(algol, ['…あと、2つ。'], '少年は ひとことだけ');
  assert.ok(!/ソリトゥス|カイ[^ず]/.test(src.replace(/\/\/.*$/gm, '')), 'ソースの 文にも 出さない');
  assert.ok(text.includes('ごきげんよう') && text.includes('…負けました。\\n星の音は、あなたがたに。'), 'かいとうの せりふ（設計の とおり）');
});

test('閉じた 幕（PART3_C10B_OPEN）: くぼ地で 音さを 鳴らしても 始まらない・第1幕 クリアの 目標は 今の まま・幕を 開けた 形も ためす', () => {
  const a1 = flagsOf(...UPTO('c10_act1'));
  const closed = c10bScripts(c10bTitleSteps, false);
  assert.deepEqual(closed.c10b_fork_event(ctx(a1)), []);
  if (!PART3_C10B_OPEN) {
    assert.equal(act1ClearObjective(), C10A_OBJ.act1, '閉じて いる 間は「第2幕へ（続きは…）」の まま');
    assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10B_OBJ.place), '第2幕の 目標は まだ ない');
    assert.ok(CH10_PROGRESS.some(([, t]) => t === C10A_OBJ.act1));
    assert.ok(!JSON.stringify(SCRIPTS.c9c_raftstop_shore(ctx(flagsOf(...UPTO('c10_act1'), 'c9_river')))).includes('青い流れ'), '閉じて いる 間は 行き先も ふえない');
  }
  assert.equal(act1ClearObjective(true), C10B_OBJ.start);
  const open = openScripts();
  const s = JSON.stringify(open.c10b_fork_event(ctx(a1)));
  assert.ok(s.includes('第2章　七つの星の音') && s.includes('第2幕　青と白'), '題の 画面');
  assert.deepEqual(open.c10b_fork_event(ctx(flagsOf(...UPTO('c10_start')))), [], '第1幕の 間は 始まらない');
  assert.deepEqual(open.c10b_fork_event(ctx({ ...a1, c10b_start: true })), [], '1回だけ');
  // 幕の クリアの あとの 目標（第1幕の 台本が 第2幕の 始まりの 文を わたす）
  const end1 = JSON.stringify(SCRIPTS.c10_ped_fa(ctx(flagsOf('c10_start', 'c10_note_fa', 'c10_ped_re'))));
  assert.ok(end1.includes(PART3_C10B_OPEN ? C10B_OBJ.start : C10A_OBJ.act1));
});

test('目標は 2行（青・白）: 片方 終えたら のこりの 1行・2つ そろったら 台へ・すすみぐあいから なおせる・行き先と ひとこと', () => {
  const o = (...fl) => objective10b(hasOf(['c10_act1', ...fl]));
  assert.equal(o(), C10B_OBJ.start);
  assert.equal(o('c10b_start'), `${C10B_OBJ.blue0}\n${C10B_OBJ.white0}`);
  assert.ok(C10B_OBJ.white0.includes('夜') && C10B_OBJ.white0.includes('宿で夜まで休める'), '夜に 来る・宿で 休める');
  assert.equal(o('c10b_start', 'c10b_blue_in'), `${C10B_OBJ.blue1}\n${C10B_OBJ.white0}`);
  assert.equal(o('c10b_start', 'c10b_blue_in', 'c10b_blue_key'), `${C10B_OBJ.blueKey}\n${C10B_OBJ.white0}`);
  assert.equal(o('c10b_start', 'c10_note_so', 'c10b_white_in'), C10B_OBJ.white1);
  assert.equal(o('c10b_start', 'c10_note_la', 'c10b_blue_boss'), C10B_OBJ.blueOrb);
  assert.equal(o('c10b_start', 'c10_note_so', 'c10_note_la'), C10B_OBJ.place);
  assert.equal(o('c10b_start', 'c10_note_so', 'c10_note_la', 'c10_act2'), C10B_OBJ.act2);
  // すすみぐあいから なおせる（フラグの 組み合わせ どれでも）
  const prog = (flags) => { const c = { flags: flagsOf(...flags) }; for (let i = CH10B_PROGRESS.length - 1; i >= 0; i--) { const [k, t] = CH10B_PROGRESS[i]; if (typeof k === 'function' ? k(c) : c.flags[k]) return t; } return null; };
  for (const fl of [['c10_act1'], ['c10_act1', 'c10b_start'], ['c10_act1', 'c10b_start', 'c10b_white_in', 'c10b_blue_in'], ['c10_act1', 'c10b_start', 'c10_note_so', 'c10_note_la'], ['c10_act1', 'c10b_start', 'c10_act2']]) {
    assert.equal(prog(fl), objective10b(hasOf(fl)), fl.join(','));
  }
  for (const t of C10B_OBJ_ALL) {
    assert.ok(CH10B_OBJECTIVE_TARGETS[t]?.length, `行き先: ${t}`);
    const talk = CH10B_OBJECTIVE_TALK[t];
    assert.ok(talk, `ひとこと: ${t}`);
    for (const k of ['self', 'bold', 'kind', 'kid']) assert.ok(talk[k] && [...talk[k]].length >= 9, `${t} ${k} は 9字 いじょう`);
  }
  // 昼に 来た 人への しるし（立てふだ・仲間の ひとこと）
  assert.ok(JSON.stringify(SCRIPTS.c10b_lake_sign ? openScripts().c10b_lake_sign(ctx({}, { night: false })) : []).includes('夜まで休んで'));
  assert.ok(CH10B_OBJECTIVE_TALK[C10B_OBJ.white0].kind.includes('夜まで休む'));
});

test('前の 章を 遊んで いる 人を こわさない: 白銀の湖・水鏡の広間・いかだ乗り場・くぼ地に 足したのは フラグで 出る 物だけ', () => {
  openAct();
  const none = () => false;
  const night = (f) => f === '@night';
  const lake = MAPS.north;
  const S = LAKE_STAIRS10B, SH = SHORE_STAIRS10B;
  for (const has of [none, night, (f) => f === 'c10b_start']) {
    assert.equal(effectiveTile(lake, S.x, S.y, has), T.SNOW, '小島の 階段は 出ない（フラグと 夜の 両方が いる）');
    assert.equal(effectiveTile(lake, SH.x, SH.y, has), T.SNOW, '岸の 氷の 階段は 出ない');
    for (const w of lake.warps.filter((v) => [`${S.x},${S.y}`, `${SH.x},${SH.y}`].includes(`${v.x},${v.y}`))) assert.ok(!condOk(w.show, has), 'ワープも 動かない');
  }
  assert.equal(effectiveTile(lake, S.x, S.y, (f) => f === 'c10b_start' || f === '@night' || f === NIGHT_STAIRS_FLAG), T.C10B_LIGHTSTAIRS, '夜と フラグで 光の 階段');
  assert.ok(lake.npcs.filter((n) => n.id.startsWith('c10b')).every((n) => !condOk(n.show, night)), '立てふだは フラグの ない 人には 出ない');
  // 小島の 宝箱・湖の 岩は 今の まま
  assert.ok(lake.chests.some((c) => c.id === 'n_lake' && c.x === 24 && c.y === 60), '小島の 宝箱');
  assert.equal(lake.tiles[59 * lake.w + 25], T.SNOW);
  assert.ok(!lake.gates.some((g) => (g.x === 24 && g.y === 60)));
  // 足した とびらには open の タイルが ある
  for (const id of ['north', ...C10B_MAP_IDS]) for (const g of MAPS[id].gates.filter((x) => x.levels || x.flag)) assert.ok(g.open !== undefined || !g.flag, `${id} ${g.x},${g.y}`);
  for (const g of lake.gates.filter((x) => x.levels?.some(([f]) => /c10b|c10_note/.test(f)))) assert.ok(TILE_INFO[g.open], 'open の タイル');
  // 水鏡の広間の 水鏡・いかだ乗り場: フラグの ない 人には 今の 台本
  const hall = SCRIPTS.c4_water_mirror(ctx(flagsOf('c4_clear')));
  assert.ok(!JSON.stringify(hall).includes('かれた間'), '水鏡は 今の まま');
  assert.ok(JSON.stringify(SCRIPTS.c4_water_mirror(ctx(flagsOf('c4_clear', 'c10_note_so')))).includes('もぐる'), '青の 音の あとは もぐれる');
  const stop = (fl) => JSON.stringify(SCRIPTS.c9c_raftstop_shore(ctx(flagsOf(...fl))));
  assert.ok(!stop(['c9_river']).includes('青い流れ'), 'いかだ乗り場は 今の まま');
  assert.ok(stop(['c9_river', 'c10b_start']).includes('青い流れ'), 'c10b_start から 行き先が ふえる');
  // くぼ地: 青と 白の 台は 前の 台本へ
  const ped5 = MAPS.c9a_crater.npcs.find((n) => n.id === 'c9c_ped5');
  assert.equal(ped5.script, 'c10_ped_so');
  assert.deepEqual(SCRIPTS.c10_ped_so(ctx(flagsOf('c9_note1'))), SCRIPTS.c9c_ped(ctx(flagsOf('c9_note1'))));
});

test('水の 高さ: 3つの 高さ × ぜんぶの マスから、入口か 鐘に 行ける。中は 水路・上は 高い 岸・下は 湖の 底', () => {
  const map = MAPS[C10B_MAP.blue1];
  const E = BLUE1_POS.entry;
  const goals = [`${E.x},${E.y}`, ...BLUE1_POS.bells.flatMap((b) => D4.map(([dx, dy]) => `${b.x + dx},${b.y + dy}`))];
  for (const L of [0, 1, 2]) for (const flags of [[], [C10B_BLUE.key], [C10B_BLUE.key, C10B_BONUS.blue]]) {
    const has = waterHas(L, flags);
    const good = blueCanReach(L, goals, flags);
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      if (isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x) || map.warpAt.has(y * map.w + x)) continue;
      assert.ok(good.has(`${x},${y}`), `水 ${L}: ${x},${y} から 入口か 鐘へ`);
    }
  }
  // 入口から: 下の 時だけ かぎの 石・上の 時だけ とびら・中の 時だけ 流れで 東の ほら穴の 宝箱
  const r = [0, 1, 2].map((L) => blueReach(L, E));
  assert.ok(nextTo(r[0], BLUE1_POS.key), 'かぎの 石は 下の 時 歩いて とどく');
  assert.deepEqual([0, 1, 2].map((L) => effectiveTile(map, BLUE1_POS.key.x, BLUE1_POS.key.y, waterHas(L))), [T.C10B_KEYSTONE, T.C10B_WATER, T.C10B_DEEP], 'かぎの 石は 下の 時だけ 水の 外');
  assert.deepEqual([0, 1, 2].map((L) => nextTo(r[L], BLUE1_POS.door)), [false, false, true], 'とびらは 上の 時だけ');
  const grotto = BLUE1_POS.chests[2];
  assert.deepEqual([0, 1, 2].map((L) => nextTo(r[L], grotto)), [false, true, false], 'ほら穴の 宝箱は 中の 時だけ（流れで 運ばれる）');
  // 水路は 中の 時だけ 流れる（下 … 水が ない・上 … 天じょうまで 水）
  const F = BLUE1_POS.flowE[0];
  assert.deepEqual([0, 1, 2].map((L) => effectiveTile(map, F.x, F.y, waterHas(L))), [T.C10B_TRENCH, T.C10B_FLOW_E, T.C10B_TRENCH]);
  // 1マスの すがた（低い 所は 水・同じ 高さは 岸・高い 所の ふちは がけ）
  assert.equal(c10bCell(0, 1), T.C10B_WATER);
  assert.equal(c10bCell(0, 2), T.C10B_DEEP);
  assert.equal(c10bCell(1, 1), T.C10B_FLOOR1);
  assert.equal(c10bCell(2, 0, '', true), T.C10B_CLIFF);
  assert.equal(c10bCell(2, 0, '', false), T.C10B_FLOOR2);
  assert.equal(c10bCell(1, 0, 'ramp', true), T.C10B_RAMP);
  assert.ok(TILE_INFO[T.C10B_WATER].c10bRaft && !TILE_INFO[T.C10B_WATER].solid, '水は いかだで 進める');
  // 飛びこめる ふちは 下が 水の 時だけ
  const D = BLUE1_POS.dives[0];
  assert.deepEqual([0, 1, 2].map((L) => map.warps.some((w) => w.x === D.x && w.y === D.y && condOk(w.show, waterHas(L)))), [false, true, false]);
  // 高い 岸からは 飛びこめる（下からは 上れない）
  assert.ok(!r[1].has(`${D.x},${D.y}`), '中の 時、下からは 高い 岸に 上れない');
  assert.ok(blueReach(1, { x: 24, y: 4 }).has(`${D.to.x},${D.to.y}`), '中の 時、高い 岸から 水へ 飛びこめる');
  // うずは 白の 音で こおる（おまけ）
  const W = BLUE1_POS.whirl[0];
  assert.equal(effectiveTile(map, W.x, W.y, waterHas(1)), T.C10B_WHIRL);
  assert.equal(effectiveTile(map, W.x, W.y, waterHas(1, [C10B_BONUS.blue])), T.C10B_ICEBRIDGE);
  assert.ok(!nextTo(r[1], BLUE1_POS.plinth) && nextTo(blueReach(1, E, [C10B_BONUS.blue]), BLUE1_POS.plinth), 'こおると 台の 宝箱へ');
});

test('サーバー: 水の 高さは パーティーで 同じ・階に 入ると 中・鐘で かわる・がけに なった 所の 人は 立てる 所へ・回線が 切れた 時・ほかの パーティーとは べつ', async () => {
  const world = fixedWorld(9511);
  const A = await act1Player(world, 'ソラ');
  const B = await act1Player(world, 'ミナ', 'mage');
  const C = await act1Player(world, 'リク', 'priest');
  for (const P of [A, B, C]) Object.assign(P.c.flags, flagsOf('c10b_start', 'c10b_blue_in'));
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot, C.bot] });
  const E = BLUE1_POS.entry;
  const bots = { bots: [B.bot, C.bot] };
  await place(A.bot, C10B_MAP.blue1, E.x, E.y, 'up', bots);
  await place(B.bot, C10B_MAP.blue1, E.x + 2, E.y, 'up', { bots: [A.bot, C.bot] });
  await place(C.bot, C10B_MAP.blue1, E.x - 2, E.y, 'up', { bots: [A.bot, B.bot] });
  for (const P of [A, B, C]) assert.equal(waterOf10b(world, P.bot.s), 1, 'はじめは 中');
  // ミナを 入口の 段の ふち（坂の となり）に 立たせて、ソラが 水を 下げる → ふちは がけ → ミナは 立てる 所へ
  await place(B.bot, C10B_MAP.blue1, 23, 32, 'up', { bots: [A.bot, C.bot] });
  await ring(A.bot, 0, bots);
  assert.equal(waterOf10b(world, B.bot.s), 0, 'パーティーの 水は 同じ');
  assert.equal(waterOf10b(world, C.bot.s), 1, 'ほかの パーティーは べつ');
  const has = world.hasFlagFn(B.bot.s);
  assert.ok(canStand(MAPS[C10B_MAP.blue1], B.bot.s.x, B.bot.s.y, has), 'ミナは 立てる 所に いる');
  assert.equal(c10bSnap(world, B.bot.s).w, 0, 'snap の 水');
  // 回線が 切れた: もどると 階の 入口
  await place(A.bot, C10B_MAP.blue1, 10, 25, 'up', bots);
  A.bot.s.char.pos = { map: C10B_MAP.blue1, x: 10.5, y: 25.5, dir: 'up' };
  world.disconnect?.(A.bot.conn);
  // パーティーの だれも いなく なると 水は わすれる
  await place(B.bot, 'c9a_crater', 12, 9, 'up', { bots: [C.bot] });
  await tickN(world, 3);
  assert.ok(!world.c10bWater.has(B.bot.s.partyId) || waterOf10b(world, B.bot.s) === 1);
});

test('こっそり: 見はりの 見る マス・ひとりで ぜんぶ とける（入口 → 階段・宝箱・レバー・おまけ）・部屋の 入口は 見られて いない', () => {
  for (const id of C10B_SNEAK_MAPS) {
    const map = MAPS[id];
    for (const o of map.c10bOwls) {
      assert.equal(map.tiles[o.y * map.w + o.x], T.C10B_PILLAR, `${id} フクロウは 氷の 柱に とまる`);
      assert.equal(o.dirs.length, 4);
    }
    // 4歩ごとに 向きを かえる
    const o0 = map.c10bOwls[0];
    assert.equal(owlDir10b(o0, 3), o0.dirs[0]);
    assert.equal(owlDir10b(o0, 4), o0.dirs[1]);
    // 部屋の 入口は はじめ（歩数 0）見られて いない
    for (const r of map.c10bRooms) assert.ok(!watchedCells10b(map, 0, 0, false, () => false).has(`${r.ent.x},${r.ent.y}`), `${id} 部屋の 入口 ${r.ent.x},${r.ent.y}`);
    // かべの うしろは 見えない
    for (const o of map.c10bOwls) for (const d of ['up', 'down', 'left', 'right']) for (const [x, y] of owlView10b(map, o, d)) assert.ok(!isBlocked(map, x, y, () => false));
  }
  const W1 = MAPS[C10B_MAP.white1], W2 = MAPS[C10B_MAP.white2];
  const s1 = { x: WHITE1_POS.up.x, y: WHITE1_POS.up.y - 1 };
  const s2 = { x: WHITE2_POS.up.x, y: WHITE2_POS.up.y - 1 };
  const goals1 = { 下り階段: at(WHITE1_POS.down), レバー: adj(WHITE1_POS.lever), 宝箱1: adj(W1.chests[0]), 宝箱2: adj(W1.chests[1]), おまけ: adj(WHITE1_POS.melt) };
  for (const [k, g] of Object.entries(goals1)) assert.ok(sneakPath(C10B_MAP.white1, s1, g), `白 1: 入口 → ${k}`);
  const goals2 = { 下り階段: at(WHITE2_POS.down), レバー: adj(WHITE2_POS.lever), 宝箱1: adj(W2.chests[0]), 宝箱2: adj(W2.chests[1]) };
  for (const [k, g] of Object.entries(goals2)) assert.ok(sneakPath(C10B_MAP.white2, s2, g), `白 2: 入口 → ${k}`);
  // どの 部屋の 入口からも 先へ 進める（見つかって もどっても やり直せる）
  for (const [id, goal] of [[C10B_MAP.white1, at(WHITE1_POS.down)], [C10B_MAP.white2, at(WHITE2_POS.down)]]) {
    for (const r of MAPS[id].c10bRooms) assert.ok(sneakPath(id, r.ent, goal), `${id} 部屋の 入口 ${r.ent.x},${r.ent.y} から`);
  }
  // 3回 見つかると 見はりが へる（ease の だん）
  assert.ok(activeOwls10b(W1, C10B_CAUGHT_EASE).length < activeOwls10b(W1, 0).length);
  // 見はりの 見る マスは 「何もしないと 通れない」所が ある（遊びに なって いる）
  const free1 = sneakPath(C10B_MAP.white1, s1, at(WHITE1_POS.down), { asleep: true });
  const real1 = sneakPath(C10B_MAP.white1, s1, at(WHITE1_POS.down));
  assert.ok(real1.length > free1.length, `見はりが いると 遠回りか 待ち（${free1.length} → ${real1.length}）`);
  const s2b = { x: WHITE2_POS.up.x, y: WHITE2_POS.up.y - 1 };
  const free2 = sneakPath(C10B_MAP.white2, s2b, at(WHITE2_POS.down), { asleep: true });
  const real2 = sneakPath(C10B_MAP.white2, s2b, at(WHITE2_POS.down));
  assert.ok(real2.length > free2.length, `白 2 も（${free2.length} → ${real2.length}）`);
});

test('サーバー: 見つかると 部屋の 入口へ（見はりの 戦い）・うすい 氷 3回で けものが 起きる・3回で 見はりが へる・レバー・家族は べつ・回線が 切れた 時', async () => {
  const world = fixedWorld(9512);
  const A = await act1Player(world, 'ソラ');
  const B = await act1Player(world, 'ミナ', 'mage');
  for (const P of [A, B]) Object.assign(P.c.flags, flagsOf('c10b_start', 'c10b_white_in'));
  const fought = [];
  const map = MAPS[C10B_MAP.white1];
  const R0 = map.c10bRooms[0];
  await place(A.bot, C10B_MAP.white1, R0.ent.x, R0.ent.y, 'up', { fought, bots: [B.bot] });
  await place(B.bot, C10B_MAP.white1, R0.ent.x + 1, R0.ent.y, 'up', { fought, bots: [A.bot] });
  // ソラを フクロウの 目の 前へ（歩数 0 の 向きの 見る マス）
  const o = map.c10bOwls[0];
  const view = owlView10b(map, o, owlDir10b(o, 1));
  const [vx, vy] = view.find(([x, y]) => !hidden10b(map.tiles[y * map.w + x]));
  A.bot.s.c10bSn = { map: map.id, steps: 0, noise: 0, last: [vx, vy + 1] };
  await stepOn(A.bot, vx, vy, { fought, bots: [B.bot] });
  assert.ok(said(A.bot, '見つかった'), '見つかった');
  assert.ok(fought.includes(C10B_BATTLE.watch[0]), '見はりの 戦い');
  assert.deepEqual([Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)], [R0.ent.x, R0.ent.y], '部屋の 入口へ');
  assert.equal(caughtOf10b(world, A.bot.s), 1);
  assert.equal(caughtOf10b(world, B.bot.s), 0, 'ミナは その まま');
  assert.equal(B.bot.s.map, C10B_MAP.white1);
  // あと 2回 → 見はりが 1ぴき へる
  for (let i = 0; i < 2; i++) {
    A.bot.s.c10bSn = { map: map.id, steps: 0, noise: 0, last: [vx, vy + 1] };
    await stepOn(A.bot, vx, vy, { fought, bots: [B.bot] });
  }
  assert.equal(caughtOf10b(world, A.bot.s), 3);
  assert.ok(said(A.bot, 'どこかへ、とんでいった'), '見はりが へった');
  assert.ok(activeOwls10b(map, 3).length < map.c10bOwls.length);
  // うすい 氷 3回で けものが 起きる
  const W1 = WHITE1_POS;
  const thin = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (map.tiles[y * map.w + x] === T.C10B_THIN) thin.push([x, y]);
  const R1 = map.c10bRooms[1];
  await place(A.bot, C10B_MAP.white1, thin[0][0], thin[0][1] - 1, 'down', { fought, bots: [B.bot] });
  for (let i = 0; i < C10B_NOISE_MAX; i++) {
    A.bot.s.c10bSn = { ...(A.bot.s.c10bSn || {}), map: map.id, steps: 0, sleep: 0, last: [thin[0][0], thin[0][1] - 1] };
    world.c10bSleep.add(`${A.bot.s.partyId}|${map.id}`);
    await stepOn(A.bot, thin[0][0], thin[0][1], { fought, bots: [B.bot] });
    if (i < C10B_NOISE_MAX - 1) await stepOn(A.bot, thin[0][0], thin[0][1] - 1, { fought, bots: [B.bot] });
  }
  assert.ok(said(A.bot, '目をさました'), 'けものが 起きた');
  assert.deepEqual([Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)], [R1.ent.x, R1.ent.y], '部屋の 入口へ');
  assert.ok(W1.beasts.length >= 1);
  // レバー: パーティーの みんなの 見はりが ねむる
  world.c10bSleep.clear();
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  await place(A.bot, C10B_MAP.white1, W1.lever.x, W1.lever.y + 1, 'up', { fought, bots: [B.bot] });
  A.bot.choice = 0;
  await examine(A.bot, W1.lever.x, W1.lever.y, { fought, bots: [B.bot] });
  assert.ok(said(A.bot, 'ねむった'));
  assert.ok(c10bSnap(world, B.bot.s).sl, 'ミナの 見はりも ねむった');
  // 回線が 切れて もどった 時は その 部屋の 入口（場所を 見る だけ）
  const { c10bOnPlay } = await import('../public/js/shared/world/c10b-steps.js');
  const s = { map: map.id, x: 20.5, y: 12.5 };
  c10bOnPlay(world, s);
  assert.deepEqual([Math.floor(s.x), Math.floor(s.y)], [R1.ent.x, R1.ent.y]);
  const s2 = { map: C10B_MAP.blue1, x: 30.5, y: 10.5 };
  c10bOnPlay(world, s2);
  assert.deepEqual([Math.floor(s2.x), Math.floor(s2.y)], [BLUE1_POS.entry.x, BLUE1_POS.entry.y], '水鏡の うらは 階の 入口');
});

for (const order of ['blue', 'white']) {
  test(`通し（ひとり・${order === 'blue' ? '青 → 白' : '白 → 青'}）: くぼ地 → ${order === 'blue' ? '水鏡の うら → 氷の 下' : '氷の 下 → 水鏡の うら'} → おまけ → 近道 → 台に 置く（c10_act2）`, async () => {
    const world = fixedWorld(order === 'blue' ? 9513 : 9514);
    world.c10bTestNight = (s) => setNight(world, s);
    const { bot, c } = await act1Player(world, 'ソラ');
    c.flags.c9_river = true;
    const fought = [];
    const opts = { fought };
    await forkScene(bot, opts);
    assert.ok(c.flags[C10B.start], '青と 白');
    assert.ok(said(bot, '第2幕　青と白'), '題の 画面');
    assert.equal(c.objective, `${C10B_OBJ.blue0}\n${C10B_OBJ.white0}`);
    const blue = async () => {
      await blueRun(bot, opts);
      assert.ok(fought.includes(C10B_BATTLE.blue));
      assert.ok(said(bot, 'びしょぬれ'));
      assert.ok(said(bot, '歌が、ひとふし、ふえた'));
      // わき水 → 水鏡の 広間（えらんだ のは「とびこむ」）
      assert.equal(bot.s.map, HALL_ARRIVE10B.map, '水鏡の 広間へ');
      // 水鏡を しらべると かれた 間へ もどれる
      await place(bot, 'temple_hall', 13, 8, 'up', opts);
      await examine(bot, 13, 7, opts);
      assert.equal(bot.s.map, C10B_MAP.blue2, '水鏡から かれた 間へ');
    };
    const white = async () => {
      // 昼に 来ても 道は ない（立てふだ）
      await place(bot, 'north', 27, 60, 'left', opts);
      await stepOn(bot, 26, 60, opts);
      await stepOn(bot, 25, 60, opts);
      await stepOn(bot, 25, 61, opts);
      await stepOn(bot, LAKE_STAIRS10B.x, LAKE_STAIRS10B.y, opts);
      assert.equal(bot.s.map, 'north', '昼は 下りられない');
      await talkTo(bot, 'north', 'c10b_lake_sign', 0, opts);
      assert.ok(said(bot, '夜に来るべし'));
      await whiteRun(bot, opts);
      assert.ok(fought.includes(C10B_BATTLE.white));
      assert.ok(said(bot, '…負けました。'));
      // 岸への 氷の 階段（昼でも）
      const S3 = WHITE3_POS.iceStairs;
      await goTo(bot, S3.x, S3.y, opts);
      assert.equal(bot.s.map, 'north', '岸へ');
      assert.equal(Math.floor(bot.s.y), SHORE_STAIRS10B.y + 1);
      c.timeShift = 0;
      await stepOn(bot, SHORE_STAIRS10B.x, SHORE_STAIRS10B.y, opts);
      assert.equal(bot.s.map, C10B_MAP.white3, '岸から 月の 間へ（昼でも）');
    };
    if (order === 'blue') {
      await blue();
      assert.equal(c.objective, C10B_OBJ.white0, '青を 終えたら 白の 1行');
      await white();
    } else {
      await white();
      assert.equal(c.objective, C10B_OBJ.blue0, '白を 終えたら 青の 1行');
      await blue();
    }
    assert.equal(c.objective, C10B_OBJ.place);
    // おまけの 部屋（2つ 取った あとなら 両方 取れる）
    await place(bot, C10B_MAP.blue1, BLUE1_POS.freeze.x, BLUE1_POS.freeze.y + 1, 'up', opts);
    bot.choice = 0;
    await examine(bot, BLUE1_POS.freeze.x, BLUE1_POS.freeze.y, opts);
    assert.ok(c.flags[C10B_BONUS.blue], 'うずが こおった');
    await goTo(bot, BLUE1_POS.plinth.x, BLUE1_POS.plinth.y + 1, opts);
    await examine(bot, BLUE1_POS.plinth.x, BLUE1_POS.plinth.y, opts);
    assert.ok(c.chests.c10b_bbonus, 'おまけの 宝箱（青）');
    const M = WHITE1_POS.melt;
    await place(bot, C10B_MAP.white1, M.x - 1, M.y, 'right', opts);
    await examine(bot, M.x, M.y, opts);
    assert.ok(c.flags[C10B_BONUS.white], '氷の かべが とけた');
    await goExamine(bot, WHITE1_POS.bonus, 0, opts);
    assert.ok(c.chests.c10b_wbonus, 'おまけの 宝箱（白）');
    // E くぼ地の 台
    await talkTo(bot, 'c9a_crater', 'c9c_ped5', 0, opts);
    assert.ok(c.flags[C10B_PED.so], '青の 台');
    assert.ok(!c.flags[C10B.act2]);
    await talkTo(bot, 'c9a_crater', 'c9c_ped6', 0, opts);
    assert.ok(c.flags[C10B.act2], '幕の クリア');
    assert.ok(!c.flags[C10B_PED.so] && !c.flags[C10B_PED.la], '小さな フラグは 消す');
    assert.ok(said(bot, 'もっと、光りなさい'), 'スピカの 記おく');
    assert.ok(said(bot, '…あと、2つ。'), '少年');
    assert.equal(c.objective, C10B_OBJ.act2);
    assert.ok(!C10B_MAP_IDS.some((id) => c.explored?.[id]), '「行った 所」は 取らない');
  });
}

test('家族 2人: 青と 白に 分かれて 同時に（それぞれ 自分の 物語）・水と 見はりは 人ごと（パーティーごと）', async () => {
  const world = fixedWorld(9515);
  world.c10bTestNight = (s) => setNight(world, s);
  const A = await act1Player(world, 'ソラ');
  const B = await act1Player(world, 'ミナ', 'mage');
  for (const P of [A, B]) {
    Object.assign(P.c.flags, flagsOf('c10b_start', 'c9_river'));
    P.c.objective = objective10b((f) => !!P.c.flags[f]);
  }
  await blueRun(A.bot, { bots: [B.bot] });
  await whiteRun(B.bot, { bots: [A.bot] });
  assert.ok(A.c.flags.c10_note_so && !A.c.flags.c10b_white_in);
  assert.ok(B.c.flags.c10_note_la && !B.c.flags.c10b_blue_in);
  assert.equal(A.c.objective, C10B_OBJ.white0);
  assert.equal(B.c.objective, C10B_OBJ.blue0);
});
