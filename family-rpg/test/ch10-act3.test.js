// 第3部 第2章 第3幕「むらさきと、うばわれた音」の 通し（第97回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第2幕を クリアした セーブ（c10_act2）から c10_act3 まで、決まった 戦いを 本当に 戦う（「すぐ 勝たせる」に しない）
//   （家族 4人。tools/sim-ch10.mjs の 装備 CH9_KIT.colonel・algol）
// ・人が 動かす キャラ（このテストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。
//   「うつる」は { type: 'ability', id: うつる, choice: 石 }・スピカの「てらす」「星のうた」・「防御」も 同じ 形。
//   何を 送るかは しくみを 知って いる 人の えらび方（shared/battle-c10c.js の 知っている 動き。decideAlly）
//   家族の 仲間（パーティーに 入れた 家族の キャラ）は tools/sim-ch9.mjs の 知って いる 手
// ・はじめは 完全オート（ボットも オート）で いどむ → 2つの ボスに 負ける → ノクトの ヒント → 知って いる 動きで 勝つまで
// ・ふつうの 戦い（空の 小島・とりで）も 本当に 戦う（オート）。宝箱 12こ。くぼ地の 武具屋に 品が ふえる
// ・ひとり（仲間なし）・家族 2人（橋を 手分け・レバーを 手分け・2人で ボス）・回線が 切れた 時（戦いの 中で 切れて もどる・空の 小島で もどる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
// だいほん（story.js）を 先に 読む（くぼ地の 武具屋は 前の 章の 店から じゅんに 作る ため。ゲームと 同じ じゅん）
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { C10C, C10C_LEVER, C10C_MAP, C10C_BATTLE, C10C_CHEST_ALL, C10C_BRIDGE_COLORS } from '../public/js/shared/maps/c10c-flags.js';
import { ISLES1_POS, ISLES2_POS, ISLES3_POS, FORT1_POS, FORT2_POS, FORT3_POS, KUMOI_VORTEX10C, KUMOI_LAND10C, UNDER_BACKDOOR10C, UNDER_LAND10C } from '../public/js/shared/maps/c10c-rows.js';
import { bridgesOf10c } from '../public/js/shared/world/c10c-steps.js';
import { act2ClearObjective, act3ClearObjective, PART3_C10C_OPEN, CH10_PROGRESS } from '../public/js/shared/data/story-c10.js';
import { C10B_OBJ } from '../public/js/shared/data/story-c10b.js';
import { C10C_OBJ } from '../public/js/shared/data/story-c10c.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10C_SHOP_ADD } from '../public/js/shared/data/items-c10c.js';
import { UTSURU } from '../public/js/shared/data/abilities-c10c.js';
import { TERU } from '../public/js/shared/data/abilities-c9b.js';
import { SONG } from '../public/js/shared/data/abilities-c9d.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { stoneOf } from '../public/js/shared/battle-c10c.js';
import { ch9Party, MODES9 } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch10.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, talkTo, D4, addPlayer, finish } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const ACT2 = ['c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la', 'c9_river'];
const NOTES5 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la'];
const key = (x, y) => `${x},${y}`;
function gear(chars, boss, lv) {
  const kit = ch9Party(boss, lv);
  chars.forEach((c, i) => { for (const k of COPY) c[k] = structuredClone(kit[i % kit.length][k]); });
}
async function famIds(world, names) {
  const ids = [];
  for (const name of names) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
    ids.push(b.char.id);
    b.send({ t: 'quit' });
  }
  return ids;
}
async function player(world, name, famNames = []) {
  const ids = famNames.length ? await famIds(world, famNames) : [];
  const { bot, c } = await addPlayer(world, name, 'c10_act2', ACT2);
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES5])];
  c.objective = act2ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'colonel', 114);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  bot.fam = fam;
  return { bot, c, fam };
}

// ───── 本当の 戦い（人の ボットは 画面と 同じ 形の コマンド）─────
// 送った コマンドの 数（id ごと）: sent.get('m10_utsuru') など
function driveReal(ctx2, mode, humans, sent) {
  const b = ctx2.battle;
  if (b.over || b.pendingEnd || mode === 'auto') return;
  b.knowsCh9 = 'know';
  for (const a of b.allies) {
    if (a.kind === 'guest' || !a.alive) continue;
    const h = humans.find((x) => x.s.id === a.controller);
    if (h) {
      // 人: オートを 切って（画面の「オート」ボタンと 同じ）、番が 来たら 1つ えらんで 送る
      if (a.auto) h.send({ t: 'battle', actor: a.id, auto: false });
      if (!a.ready || b.queue.some((q) => q.id === a.id)) continue;
      let cmd = decideAlly(b, a) || { type: 'attack', target: b.aliveEnemies()[0]?.id };
      if (cmd.type === 'ai') cmd = { type: 'attack', target: b.aliveEnemies()[0]?.id };
      const n0 = h.msgs.length;
      h.send({ t: 'battle', actor: a.id, cmd });
      const rej = h.msgs.slice(n0).some((m) => m.t === 'battleRej');
      if (rej) h.send({ t: 'battle', actor: a.id, cmd: { type: 'defend' } });
      else { const k = cmd.type === 'ability' ? cmd.id : cmd.type; sent.set(k, (sent.get(k) || 0) + 1); }
      continue;
    }
    if (a.controller && a.controller !== 'sim') continue; // ほかの 人（いない はず）
    // 家族の 仲間: tools/sim-ch9.mjs の 知って いる 手（test/c9a-play.js の drive と 同じ）
    a.auto = false;
    a.controller = 'sim';
    if (!a.ready) continue;
    if (!MODES9.know.act(b, a)) { a.ready = false; b.enqueue(a, { type: 'ai' }); }
  }
}
// play（test/c9a-play.js）と 同じ ながれ。決まった 戦いは real(id) の 形で 本当に 戦う。ふつうの 戦いは オート
async function playReal(bot, { real = () => 'auto', bots = [], fought = null, sent = new Map(), onTick = null, max = 60000 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    const all = [bot, ...bots];
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd) continue;
      if (!c2.done) { c2.done = true; if (fought) fought.push(c2.opts.fixed || 'field'); }
      driveReal(c2, c2.opts.fixed ? real(c2.opts.fixed) : 'auto', all, sent);
    }
    for (const b of all) b.flushQueue();
    await tickN(world, 1);
    for (const b of all) b.flushQueue();
    if (onTick) await onTick(i);
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (all.every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const b of all) b.flushQueue();
      if (all.every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
// 歩く・しらべる（決まった 戦いは ぜったいに「すぐ 勝たせる」に しない … play の real は いつも 本当に 戦う 形）
const R = (opts) => ({ ...opts, real: (fid) => (fid ? opts.realMode?.(fid) || 'know' : 'auto') });
async function walk(bot, x, y, opts) {
  bot.x = x + 0.5; bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await playReal(bot, R(opts));
}
async function look(bot, x, y, choice, opts) {
  bot.choice = choice;
  bot.send({ t: 'interact', kind: 'tile', x, y });
  await playReal(bot, R(opts));
  bot.choice = 0;
}
async function warpTo(bot, map, x, y, opts, dir = 'up') {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await playReal(bot, R(opts));
}
function pathFor(map, sx, sy, tx, ty, has) {
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (x === tx && y === ty) {
      const out = [];
      for (let k = y * map.w + x; k !== sy * map.w + sx; k = prev.get(k)) out.unshift([k % map.w, Math.floor(k / map.w)]);
      return out;
    }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || prev.has(k)) continue;
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(k) || TILE_INFO[effectiveTile(map, nx, ny, has)]?.flow) continue;
      if (map.npcs.some((n) => n.solid && Math.floor(n.x) === nx && Math.floor(n.y) === ny && condOk(n.show, has))) continue;
      if (!(nx === tx && ny === ty) && map.warpAt.has(k)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) {
    await walk(bot, x, y, opts);
    if (bot.s.map !== map.id) return;
  }
}
async function goExamine(bot, p, choice, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x) && ((x === sx && y === sy) || pathFor(map, sx, sy, x, y, has)));
  assert.ok(side, `${map.id}: ${p.x},${p.y} の となりへ`);
  if (side[0] !== sx || side[1] !== sy) await go(bot, side[0], side[1], opts);
  await look(bot, p.x, p.y, choice, opts);
}
// 橋を かける（すき間 i に 色 c。今 いる 島の がわの 石で）→ わたる
async function cross(bot, i, c, opts) {
  const map = MAPS[bot.s.map];
  const sp = map.c10cSpans[i];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const st = sp.stones.find((s) => D4.some(([dx, dy]) => (s.x + dx === sx && s.y + dy === sy) || (canStand(map, s.x + dx + 0.5, s.y + dy + 0.5, has) && pathFor(map, sx, sy, s.x + dx, s.y + dy, has))));
  assert.ok(st, `${map.id} すき間 ${i} の 石`);
  await goExamine(bot, st, C10C_BRIDGE_COLORS.indexOf(c), opts);
  assert.equal(bridgesOf10c(bot.world, bot.s)[c], i, `すき間 ${i} に ${c}`);
  const ends = sp.y0 === sp.y1 ? [{ x: sp.x0 - 1, y: sp.y0 }, { x: sp.x1 + 1, y: sp.y0 }] : [{ x: sp.x0, y: sp.y0 - 1 }, { x: sp.x0, y: sp.y1 + 1 }];
  const me = { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) };
  const d = (p) => Math.abs(p.x - me.x) + Math.abs(p.y - me.y);
  const [near, far] = d(ends[0]) <= d(ends[1]) ? ends : [ends[1], ends[0]];
  // 近い はしへ → 橋の 上を 1マスずつ → むこうの 島
  if (d(near)) await go(bot, near.x, near.y, opts);
  const cells = sp.cells.slice();
  if (Math.abs(cells[0].x - near.x) + Math.abs(cells[0].y - near.y) !== 1) cells.reverse();
  for (const p of [...cells, far]) await walk(bot, p.x, p.y, opts);
}
// ベルトの 工場（レバーを 引きながら。test/ch10-act3-a.test.js と 同じ さがし方）
const LVF = (red, blue) => (f) => (f === C10C_LEVER.red ? red : f === C10C_LEVER.blue ? blue : false);
function movesOf(map, has) {
  const npcAt = new Set(map.npcs.filter((n) => n.solid && condOk(n.show, has)).map((n) => key(Math.floor(n.x), Math.floor(n.y))));
  const bad = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x) || npcAt.has(key(x, y)) || TILE_INFO[effectiveTile(map, x, y, has)]?.c10cPush;
  const out = new Map();
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (bad(x, y)) continue;
    const list = [];
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (bad(nx, ny)) continue;
      if (map.warpAt.has(ny * map.w + nx)) { list.push({ to: key(nx, ny), path: [[nx, ny]], warp: true }); continue; }
      const r = carry(map, nx, ny, has);
      if (bad(r.x, r.y)) continue;
      list.push({ to: key(r.x, r.y), path: r.path });
    }
    out.set(key(x, y), list);
  }
  return out;
}
function fortSolve(mapId, start, red, blue, goal) {
  const map = MAPS[mapId];
  const mvs = [0, 1, 2, 3].map((i) => movesOf(map, LVF(!!(i & 1), !!(i & 2))));
  const levers = { red: [], blue: [] };
  for (const g of map.gates) {
    if (g.flag === C10C_LEVER.red && g.closed === T.C10C_LEVER_R) levers.red.push(g);
    if (g.flag === C10C_LEVER.blue && g.closed === T.C10C_LEVER_B) levers.blue.push(g);
  }
  const sk = (k, r, b) => `${k}|${r ? 1 : 0}${b ? 1 : 0}`;
  const prev = new Map([[sk(key(start.x, start.y), red, blue), null]]);
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
async function fortGo(bot, goal, opts) {
  const has = bot.world.hasFlagFn(bot.s);
  const plan = fortSolve(bot.s.map, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, !!has(C10C_LEVER.red), !!has(C10C_LEVER.blue), goal);
  assert.ok(plan, `${bot.s.map}: レバーを 引けば とどく`);
  for (const a of plan) {
    if (a.path) { for (const [x, y] of a.path) await walk(bot, x, y, opts); continue; }
    await look(bot, a.at.x, a.at.y, 0, opts);
  }
}
const at = (p) => (x, y) => x === p.x && y === p.y;
const adj = (p) => (x, y) => Math.abs(x - p.x) + Math.abs(y - p.y) === 1;
// 魔物を 1ぴき その 人に ぶつけて 本当に 戦う（オート）
async function fieldFight(bot, opts) {
  const world = bot.world;
  const ms = mapState(world, bot.s.map);
  for (let i = 0; i < 80 && !ms.symbols.size; i++) { bot.s.repelUntil = 0; await tickN(world, 5); }
  const sym = [...ms.symbols.values()][0];
  assert.ok(sym, `${bot.s.map}: 魔物が 出る`);
  bot.s.repelUntil = 0;
  sym.x = bot.s.x; sym.y = bot.s.y;
  fullHeal(bot.s.char);
  for (const f of bot.fam || []) fullHeal(f);
  startFieldBattle(world, bot.s, sym);
  await playReal(bot, R(opts));
  bot.s.repelUntil = 1e15;
  return sym.table;
}
// ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ヒント → もう一度）
async function bossUntilWin(bot, which, { mode0 = 'auto', max = 6, fought = [], bots = [], sent = new Map(), onTick = null } = {}) {
  const res = [];
  const colonel = which === 'colonel';
  const battle = colonel ? C10C_BATTLE.colonel : C10C_BATTLE.algol;
  const win = colonel ? C10C.colonel : C10C.algol;
  const party = [bot.s.char, ...(bot.fam || [])];
  gear(party, which, colonel ? 114 : 116);
  for (const b of bots) gear([b.s.char], which, colonel ? 114 : 116);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    for (const b of [bot, ...bots]) fullHeal(b.s.char);
    for (const ch of party) fullHeal(ch);
    const v0 = bot.msgs.length;
    const o = { fought, bots, sent, onTick, realMode: (fid) => (fid === battle ? mode : 'know') };
    if (colonel) {
      await warpTo(bot, C10C_MAP.isles3, 13, 17, o);
      await walk(bot, 13, 16, o);
      await walk(bot, 13, 15, o);
    } else {
      await warpTo(bot, C10C_MAP.fort3, 12, 14, o);
      await walk(bot, 12, 13, o);
      await walk(bot, 12, 12, o);
    }
    assert.ok(fought.filter((f) => f === battle).length >= k + 1, `${battle} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.s.char.flags[win];
    res.push(won ? 'win' : 'lose');
    if (!won) assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0) || k > 0, 'ノクトの ヒント');
    if (won) return res;
  }
  return res;
}
async function openChests(bot, mapId, opts) {
  for (const ch of MAPS[mapId].chests) {
    if (bot.s.char.chests[ch.id] || bot.s.map !== mapId) continue;
    if (MAPS[mapId].c10cSpans || !MAPS[mapId].c10cFort) {
      const has = bot.world.hasFlagFn(bot.s);
      const ok = D4.some(([dx, dy]) => canStand(MAPS[mapId], ch.x + dx + 0.5, ch.y + dy + 0.5, has) && pathFor(MAPS[mapId], Math.floor(bot.s.x), Math.floor(bot.s.y), ch.x + dx, ch.y + dy, has));
      if (!ok) continue;
      await goExamine(bot, ch, 0, opts);
    } else {
      await fortGo(bot, adj(ch), opts);
      await look(bot, ch.x, ch.y, 0, opts);
    }
  }
}

// ───── 空の 道（くぼ地 → クモイの うず → 小島 1・2 → いせきの 前）─────
async function skyRoad(bot, opts, log) {
  const c = bot.s.char;
  await warpTo(bot, 'c9a_crater', 12, 9, opts);
  await walk(bot, 12, 8, opts);
  await walk(bot, 12, 7, opts);
  assert.ok(c.flags[C10C.start], '幕が 始まった');
  assert.equal(c.objective, C10C_OBJ.sky);
  await warpTo(bot, 'kumoi', KUMOI_LAND10C.x, KUMOI_LAND10C.y, opts);
  await look(bot, KUMOI_VORTEX10C.x, KUMOI_VORTEX10C.y, 0, opts);
  assert.equal(bot.s.map, C10C_MAP.isles1, '光の うずから 空の 小島へ');
  log.push(await fieldFight(bot, opts));
  await go(bot, ISLES1_POS.entry.x, ISLES1_POS.entry.y, opts);
  await cross(bot, 0, 'red', opts);
  await cross(bot, 1, 'yellow', opts);
  await openChests(bot, C10C_MAP.isles1, opts);
  await cross(bot, 2, 'green', opts);
  await cross(bot, 4, 'blue', opts);
  await openChests(bot, C10C_MAP.isles1, opts);
  await cross(bot, 4, 'blue', opts);
  await cross(bot, 3, 'white', opts);
  await go(bot, ISLES1_POS.up.x, ISLES1_POS.up.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles2);
  assert.ok(c.flags[C10C.isles2]);
  // 2まいめ: 7つの すき間（遠回りの 宝箱は かけかえる）・風の 小島
  await cross(bot, 0, 'red', opts);
  await cross(bot, 1, 'yellow', opts);
  await go(bot, 17, 14, opts);
  await walk(bot, 17, 13, opts);
  for (let y = 12; y >= 7; y--) await walk(bot, 17, y, opts); // 風に 運ばれる（画面の 流れと 同じ マス）
  await openChests(bot, C10C_MAP.isles2, opts);
  await go(bot, 14, 7, opts);
  for (let y = 8; y <= 14; y++) await walk(bot, 14, y, opts); // もどりの 風
  await cross(bot, 6, 'red', opts); // 赤を うつす（入口の すき間の 橋は きえる）
  await openChests(bot, C10C_MAP.isles2, opts);
  await cross(bot, 6, 'red', opts);
  await cross(bot, 2, 'green', opts);
  await cross(bot, 5, 'blue', opts);
  await openChests(bot, C10C_MAP.isles2, opts);
  await cross(bot, 5, 'blue', opts);
  await cross(bot, 3, 'white', opts);
  await cross(bot, 4, 'red', opts);
  await go(bot, ISLES2_POS.up.x, ISLES2_POS.up.y, opts);
  assert.equal(bot.s.map, C10C_MAP.isles3, 'うかぶ いせき');
  await openChests(bot, C10C_MAP.isles3, opts);
  assert.ok(!c.flags[C10C.colonel], 'まだ たいさと 戦って いない');
}
// とりでの 道（うら口 → ベルトの 工場 1・2 → 少年の 間の 前）
async function fortRoad(bot, opts, log) {
  const c = bot.s.char;
  await warpTo(bot, 'c9b_under', UNDER_LAND10C.x, UNDER_LAND10C.y, opts, 'right');
  await walk(bot, UNDER_BACKDOOR10C.x, UNDER_BACKDOOR10C.y, opts);
  assert.equal(bot.s.map, C10C_MAP.fort1, 'うら口から とりでへ');
  assert.ok(c.flags[C10C.fortIn]);
  await fortGo(bot, (x, y) => x === 13 && y === 11, opts);
  log.push(await fieldFight(bot, opts));
  await openChests(bot, C10C_MAP.fort1, opts);
  await fortGo(bot, at(FORT1_POS.down), opts);
  assert.equal(bot.s.map, C10C_MAP.fort2);
  await openChests(bot, C10C_MAP.fort2, opts);
  await fortGo(bot, at(FORT2_POS.down), opts);
  assert.equal(bot.s.map, C10C_MAP.fort3, '少年の 間');
  await openChests(bot, C10C_MAP.fort3, opts);
  assert.ok(!c.flags[C10C.algol], 'まだ 少年と 戦って いない');
}

test('幕が 開いて いる（PART3_C10C_OPEN）: 第2幕 クリアの 目標は 第3幕の はじまり・前の 文は 表から ぬいた', () => {
  assert.equal(PART3_C10C_OPEN, true);
  assert.equal(act2ClearObjective(), C10C_OBJ.start);
  assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10B_OBJ.act2), '「第3幕へ（続きは…）」は 知らない 文に なり なおる');
  // 第99回 A班: 第4幕が 開いた あとは 第3幕 クリアの 目標も「ながれ星のくぼ地で、星の音さを鳴らそう」（act3ClearObjective。前の 文は 表から ぬいた）
  assert.ok(CH10_PROGRESS.some(([, t]) => t === act3ClearObjective()));
});

test('通し（本当の 戦い・家族の 仲間 3人）: くぼ地 → 空 → たいさ（はじめは 完全オートで 負ける）→ うばわれる → 3人組 → とりで → 少年（同じ）→ 台（c10_act3）。宝箱 12こ', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9721);
  const { bot, c } = await player(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
  const fought = [];
  const sent = new Map();
  const log = [];
  const opts = { fought, sent };
  await skyRoad(bot, opts, log);
  const r1 = await bossUntilWin(bot, 'colonel', opts);
  log.push(`colonel:${r1.join(',')}`);
  assert.equal(r1[0], 'lose', 'はじめの 完全オートでは たいさに 勝てない');
  assert.ok(c.flags[C10C.colonel] && c.flags[C10C.stolen] && c.flags[C10C.trio], `たいさに 勝つ → うばわれる → 3人組（${r1.join(',')}）`);
  assert.ok((sent.get(UTSURU) || 0) > 0, '「うつる」を 画面と 同じ 形で 送った');
  assert.ok(said(bot, 'とりでの、うら口、知ってるわよ'));
  assert.equal(bot.s.map, 'c9a_crater');
  await fortRoad(bot, opts, log);
  const r2 = await bossUntilWin(bot, 'algol', opts);
  log.push(`algol:${r2.join(',')}`);
  assert.equal(r2[0], 'lose', 'はじめの 完全オートでは 少年に 勝てない');
  assert.ok(c.flags[C10C.algol] && c.flags[C10C.note] && (c.keyItems || []).includes('note_si'), `少年に 勝つ → むらさきの 音（${r2.join(',')}）`);
  assert.ok((sent.get(SONG) || 0) + (sent.get(TERU) || 0) + (sent.get('defend') || 0) > 0, 'スピカの 星のうた・てらす・防御を 送った');
  console.log('# family', log.join(' '), [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
  for (const id of C10C_CHEST_ALL) assert.ok(c.chests[id], `宝箱 ${id}`);
  assert.ok(fought.filter((f) => f === 'field').length >= 2, 'ふつうの 戦い');
  // E くぼ地の むらさきの 台
  await warpTo(bot, 'c9a_crater', 17, 6, opts);
  await talkTo(bot, 'c9a_crater', 'c9c_ped7', 0, R(opts));
  await playReal(bot, R(opts));
  assert.ok(c.flags[C10C.act3], '幕の クリア');
  assert.equal(c.objective, act3ClearObjective()); // 第99回 A班: 第4幕が 開いた ので 第4幕の はじまり
  assert.equal(storyPlace(c).label, '第3部 第2章 第3幕');
  assert.ok(storyPlace(c).cleared);
  assert.ok(C10C_SHOP_ADD.every((id) => SHOPS.c10c_crater.items.includes(id)), 'くぼ地の 武具屋に 品が ふえた');
});

test('ひとり（仲間なし）: 2つの ボスに 知って いる 動きで いどむ（何度でも やり直せる）・橋と ベルトは ひとりで とける', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9722);
  const { bot, c } = await player(world, 'ソラ');
  const fought = [];
  const sent = new Map();
  const log = [];
  const opts = { fought, sent };
  await skyRoad(bot, opts, log);
  const r1 = await bossUntilWin(bot, 'colonel', { ...opts, mode0: 'know', max: 10 });
  assert.ok(c.flags[C10C.colonel], `ひとりでも たいさに 勝てる（${r1.join(',')}）`);
  await fortRoad(bot, opts, log);
  const r2 = await bossUntilWin(bot, 'algol', { ...opts, mode0: 'know', max: 10 });
  assert.ok(c.flags[C10C.note], `ひとりでも 少年に 勝てる（${r2.join(',')}）`);
  console.log('# solo', log.join(' '), `colonel:${r1.join(',')} algol:${r2.join(',')}`, [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
});

test('家族 2人（パーティー）: 橋を 手分け・レバーを 手分け・2人で ボス（どちらも 画面と 同じ 形の コマンド）・戦いの 中で 回線が 切れて もどる', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9723, { offline: false, checkPassword: () => true });
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ミナ');
  for (const P of [A, B]) Object.assign(P.c.flags, { c10c_start: true, c10c_isles2: true });
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const sent = new Map();
  const fought = [];
  const oA = { bots: [B.bot], fought, sent }, oB = { bots: [A.bot], fought, sent };
  // 橋を 手分け: ミナが かけて ソラが わたる・ソラが かけて ミナが わたる
  const E = ISLES2_POS.entry;
  await warpTo(A.bot, C10C_MAP.isles2, E.x, E.y, oA);
  await warpTo(B.bot, C10C_MAP.isles2, E.x + 1, E.y, oB);
  await goExamine(B.bot, MAPS[C10C_MAP.isles2].c10cSpans[0].stones[0], 4, oB);
  await go(A.bot, 13, 28, oA);
  assert.equal(Math.floor(A.bot.s.x), 13, 'ソラは ミナの 白い 橋を わたれた');
  await goExamine(A.bot, MAPS[C10C_MAP.isles2].c10cSpans[1].stones[1], 3, oA);
  await go(B.bot, 15, 19, oB);
  assert.equal(Math.floor(B.bot.s.y), 19, 'ミナも ソラの 青い 橋で 先の 島へ');
  // 2人で たいさ（知って いる 動き）。とちゅうで ミナの 回線が 切れて、すぐ もどる（同じ セッションを ひきつぐ）
  let cut = false, B2 = null;
  const pair = [B.bot];
  const onTick = async (i) => {
    if (cut || i < 600 || !world.battles.size) return;
    cut = true;
    world.disconnect(B.bot.s, B.bot.conn);
    await tickN(world, 20);
    B2 = new Bot(world, 'ミナ');
    await B2.login();
    B2.send({ t: 'play', id: B.c.id });
    pair[0] = B2;
  };
  const r = await bossUntilWin(A.bot, 'colonel', { mode0: 'know', max: 8, bots: pair, fought, sent, onTick });
  assert.ok(A.c.flags[C10C.colonel], `2人で たいさに 勝つ（${r.join(',')}）`);
  assert.ok(cut && B2?.resumed, 'ミナは 戦いの とちゅうで 切れて もどった');
  // レバーを 手分け（とりで 2: ミナが 入口で 赤を 引き、ソラは 分かれ道で 青を 引く）
  const mates = B2 || B.bot;
  for (const P of [A, B]) Object.assign(P.c.flags, { c10c_stolen: true, c10c_trio: true, c10c_fort_in: true, c10c_fort2: true });
  await warpTo(A.bot, C10C_MAP.fort2, 17, 20, { bots: [mates], fought, sent });
  await warpTo(mates, C10C_MAP.fort2, 4, 21, { bots: [A.bot], fought, sent });
  await look(mates, 3, 21, 0, { bots: [A.bot], fought, sent });
  await look(A.bot, 16, 19, 0, { bots: [mates], fought, sent });
  for (const s of [A.bot.s, mates.s]) assert.ok(world.hasFlagFn(s)(C10C_LEVER.red) && world.hasFlagFn(s)(C10C_LEVER.blue), '2人とも 赤と 青');
  const rb = carry(MAPS[C10C_MAP.fort2], 9, 23, world.hasFlagFn(mates.s));
  assert.deepEqual([rb.x, rb.y], [15, 23], 'ミナは 赤の ベルトで 東へ');
  // 2人で 少年（知って いる 動き）
  const r2 = await bossUntilWin(A.bot, 'algol', { mode0: 'know', max: 8, bots: [mates], fought, sent });
  assert.ok(A.c.flags[C10C.note], `2人で 少年に 勝つ（${r2.join(',')}）`);
  console.log('# pair', `colonel:${r.join(',')} algol:${r2.join(',')}`, [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
  void stoneOf; void finish; void examine; void place; void stepOn;
});
