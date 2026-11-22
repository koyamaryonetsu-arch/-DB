// 第3部 第2章 第4幕「金の音と、星の橋」の 通し（第99回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第3幕を クリアした セーブ（c10_act3）から c10_act4（第2章 クリア）まで、決まった 戦い（門の 番人 4つ・ミラーレ）を 本当に 戦う（「すぐ 勝たせる」に しない）
// ・人が 動かす キャラ（このテストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。
//   「音を鳴らす」は { type: 'ability', id: m10_narasu, choice: 色 }・スピカの「てらす」「星のうた」・「防御」も 同じ 形。
//   何を 送るかは しくみを 知って いる 人の えらび方（shared/battle-c10d.js の 知っている 動き。decideAlly）
//   家族の 仲間（パーティーに 入れた 家族の キャラ）は tools/sim-ch9.mjs の 知って いる 手
// ・はじめは 完全オート（ボットも オート）で いどむ → 門と ボスに 負ける → おどり場で 目を 覚ます → 知って いる 動きで 勝つまで
// ・星の いずみ（3しゅ とも）・3回 負けて いずみが わく・帰って もどっても 門は 開いた まま・ひとり・家族 2人（戦いの 中で 回線が 切れて もどる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
// だいほん（story.js）を 先に 読む（くぼ地の 武具屋は 前の 章の 店から じゅんに 作る ため。ゲームと 同じ じゅん）
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { C10D, C10D_MAP, C10D_BATTLE, C10D_GATES, C10D_CHEST_IDS, C10D_POWER_KEY } from '../public/js/shared/maps/c10d-flags.js';
import { STAIR1_POS, STAIR2_POS, STAIR3_POS, SUMMIT_POS, TOWER1_GOLD10D, TOWER1_BACK10D } from '../public/js/shared/maps/c10d-rows.js';
import { GATE_INFO10D } from '../public/js/shared/world/c10d-steps.js';
import { act3ClearObjective, act4ClearObjective, PART3_C10D_OPEN, CH10_PROGRESS, CH10_OBJECTIVE_TARGETS, CH10_OBJECTIVE_TALK } from '../public/js/shared/data/story-c10.js';
import { PART3_C11A_OPEN, C11A_START_OBJ, CH11_PROGRESS } from '../public/js/shared/data/story-c11.js';
import { KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { C10C_OBJ } from '../public/js/shared/data/story-c10c.js';
import { C10D_OBJ } from '../public/js/shared/data/story-c10d.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10D_SHOP_ADD } from '../public/js/shared/data/items-c10d.js';
import { NARASU } from '../public/js/shared/data/abilities-c10d.js';
import { TERU } from '../public/js/shared/data/abilities-c9b.js';
import { SONG } from '../public/js/shared/data/abilities-c9d.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { fullHeal, computeStats } from '../public/js/shared/stats.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch9Party, MODES9 } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch10.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const ACT3 = ['c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la', 'c9_river'];
const NOTES6 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si'];
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
  const { bot, c } = await addPlayer(world, name, 'c10_act3', ACT3);
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES6])];
  c.objective = act3ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'gate1', 118);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  bot.fam = fam;
  return { bot, c, fam };
}

// ───── 本当の 戦い（人の ボットは 画面と 同じ 形の コマンド）─────
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
    if (a.controller && a.controller !== 'sim') continue;
    a.auto = false;
    a.controller = 'sim';
    if (!a.ready) continue;
    if (!MODES9.know.act(b, a)) { a.ready = false; b.enqueue(a, { type: 'ai' }); }
  }
}
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
// 決まった 戦いは ぜったいに「すぐ 勝たせる」に しない（play の real は いつも 本当に 戦う 形）
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
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(k)) continue;
      if (map.npcs.some((n) => n.solid && Math.floor(n.x) === nx && Math.floor(n.y) === ny && condOk(n.show, has))) continue;
      if (!(nx === tx && ny === ty) && map.warpAt.has(k)) continue;
      // 門の 前の マス（番人との 戦い）は 行き先の 時だけ ふむ
      if (!(nx === tx && ny === ty) && map.triggers.some((t) => /^c10d_gate\d_event$/.test(t.id) && condOk(t.show, has) && nx >= t.x && nx < t.x + t.w && ny >= t.y && ny < t.y + t.h)) continue;
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
async function openChests(bot, opts) {
  const map = MAPS[bot.s.map];
  for (const ch of map.chests) {
    if (bot.s.char.chests[ch.id]) continue;
    const has = bot.world.hasFlagFn(bot.s);
    const ok = D4.some(([dx, dy]) => canStand(map, ch.x + dx + 0.5, ch.y + dy + 0.5, has) && pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), ch.x + dx, ch.y + dy, has));
    if (ok) await goExamine(bot, ch, 0, opts);
  }
}
const at = (bot) => [Math.floor(bot.s.x), Math.floor(bot.s.y)];
const healAll = (bot, bots = []) => { for (const b of [bot, ...bots]) fullHeal(b.s.char); for (const ch of bot.fam || []) fullHeal(ch); };

// 門の 番人に 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き）。負けた 時は「あとにする」→ おどり場で 目を 覚ます
async function gateUntilWin(bot, g, { mode0 = 'auto', max = 6, fought = [], bots = [], sent = new Map(), onTick = null, losses = 0 } = {}) {
  const res = [];
  const G = GATE_INFO10D[g];
  const id = C10D_BATTLE[`gate${g}`];
  for (let k = 0; k < max; k++) {
    const mode = k < (losses || (mode0 === 'auto' ? 1 : 0)) ? 'auto' : 'know';
    healAll(bot, bots);
    const o = { fought, bots, sent, onTick, realMode: (fid) => (fid === id ? mode : 'know') };
    if (bot.s.map !== G.map) await warpTo(bot, G.map, G.landing.x, G.landing.y, o);
    const v0 = bot.msgs.length;
    bot.choice = 1; // ヒントの あとは「あとにする」（おどり場で 目を 覚ました まま）
    await go(bot, G.front.x + 1, G.front.y, o);
    bot.choice = 0;
    assert.ok(fought.filter((f) => f === id).length >= k + 1, `${id} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.s.char.flags[C10D_GATES[g - 1]];
    res.push(won ? 'win' : 'lose');
    if (won) return res;
    assert.equal(bot.s.map, G.map);
    assert.deepEqual(at(bot), [G.landing.x, G.landing.y], `${id} に 負けて おどり場で 目を 覚ます`);
    assert.ok(said(bot, BOSS_HINTS[id][0].slice(0, 6), v0), 'ノクトの ヒント');
  }
  return res;
}
// ミラーレに 勝つまで
async function mirrorUntilWin(bot, { mode0 = 'auto', max = 6, fought = [], bots = [], sent = new Map(), onTick = null } = {}) {
  const res = [];
  const id = C10D_BATTLE.mirror;
  gear([bot.s.char, ...(bot.fam || [])], 'mirror', 118);
  for (const b of bots) gear([b.s.char], 'mirror', 118);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    healAll(bot, bots);
    const o = { fought, bots, sent, onTick, realMode: (fid) => (fid === id ? mode : 'know') };
    const v0 = bot.msgs.length;
    await warpTo(bot, C10D_MAP.summit, 12, 14, o);
    bot.choice = 1;
    await walk(bot, 12, 13, o);
    await walk(bot, 12, 12, o);
    bot.choice = 0;
    assert.ok(fought.filter((f) => f === id).length >= k + 1, `${id} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.s.char.flags[C10D.mirror];
    res.push(won ? 'win' : 'lose');
    if (won) return res;
    assert.deepEqual([bot.s.map, ...at(bot)], [C10D_MAP.summit, SUMMIT_POS.entry.x, SUMMIT_POS.entry.y], 'いただきの 入口で 目を 覚ます');
    assert.ok(said(bot, BOSS_HINTS[id][Math.min(k, 2)].slice(0, 6), v0), `ノクトの ヒント ${k + 1}だんめ`);
  }
  return res;
}
// いずみを えらぶ（0 いやし・1 ちえ・2 ちから）
async function well(bot, i, choice, opts) {
  const P = [null, STAIR1_POS.wells[0], STAIR2_POS.wells[0], STAIR2_POS.wells[1], STAIR3_POS.wells[0]][i];
  await goExamine(bot, P, choice, opts);
  assert.ok(bot.s.char.flags[`c10d_well${i}`], `いずみ ${i}`);
}

test('幕が 開いて いる（PART3_C10D_OPEN）: 第3幕 クリアの 目標は 第4幕の はじまり・前の 文は 表から ぬいた・第2章 クリアの 目標は 1か所', () => {
  assert.equal(PART3_C10D_OPEN, true);
  assert.equal(act3ClearObjective(), C10D_OBJ.start);
  assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10C_OBJ.act3), '「第4幕へ（続きは…）」は 知らない 文に なり なおる');
  assert.ok(!(C10C_OBJ.act3 in CH10_OBJECTIVE_TARGETS));
  // 第3章 第1幕が 開いた: 第2章 クリアの 目標は 第3章の 表（CH11_PROGRESS）の 1か所だけ。前の 文は 表から ぬいた（知らない 文に なり なおる）
  assert.equal(PART3_C11A_OPEN, true);
  assert.equal(act4ClearObjective(), C11A_START_OBJ);
  assert.equal(C11A_START_OBJ, 'ながれ星のくぼ地で、ガンツと話そう');
  assert.equal(C10D_OBJ.act4, '第3部　第3章へ（続きはアップデートで！）');
  assert.ok(!CH10_PROGRESS.some(([, t]) => t === C10D_OBJ.act4), '前の 文は 第2章の 表に ない');
  assert.ok(!(C10D_OBJ.act4 in CH10_OBJECTIVE_TARGETS) && !(C10D_OBJ.act4 in CH10_OBJECTIVE_TALK));
  assert.ok(!KNOWN_OBJECTIVES.has(C10D_OBJ.act4), '前の 文は 知らない 文');
  assert.deepEqual([...CH10_PROGRESS, ...CH11_PROGRESS].filter(([k]) => k === C10D.act4), [[C10D.act4, C11A_START_OBJ]], '第2章 クリアの 目標');
});

test('通し（本当の 戦い・家族の 仲間 3人）: くぼ地 → 星の塔 → 星の 階段（はじめは 完全オートで 門に 負ける・3回 負けて いずみが わく）→ 門 4つ → ミラーレ（同じ）→ 星の橋 → 金の 台（c10_act4）。宝箱 6こ・いずみ 3しゅ・帰って もどる', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9921);
  const { bot, c } = await player(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
  const fought = [];
  const sent = new Map();
  const opts = { fought, sent };
  const log = [];
  // 0 くぼ地で 星の音さ → T1 1階の 金色の ゆか → T2 てっぺん → 星の 階段 1
  await warpTo(bot, 'c9a_crater', 12, 9, opts);
  await walk(bot, 12, 8, opts);
  await walk(bot, 12, 7, opts);
  assert.ok(c.flags[C10D.start] && said(bot, '第4幕　金の音と、星の橋'), '題の 画面');
  assert.equal(c.objective, C10D_OBJ.tower);
  await warpTo(bot, 'star_tower_1f', TOWER1_BACK10D.x, TOWER1_BACK10D.y, opts);
  await walk(bot, TOWER1_GOLD10D[0].x, TOWER1_GOLD10D[0].y, opts);
  assert.ok(c.flags[C10D.top] && bot.s.map === C10D_MAP.stair1, '光の 階段 → 星の 階段');
  assert.equal(c.objective, C10D_OBJ.stairs);
  // いずみ 1: ちからの水 → 門 1 を はじめは 完全オートで（負ける）
  await well(bot, 1, 2, opts);
  assert.ok(bot.s[C10D_POWER_KEY], 'ちからの水の しるし');
  await openChests(bot, opts);
  const r1 = await gateUntilWin(bot, 1, { ...opts, mode0: 'auto', losses: 3 });
  log.push(`gate1:${r1.join(',')}`);
  assert.deepEqual(r1.slice(0, 3), ['lose', 'lose', 'lose'], 'はじめの 完全オートでは 門 1 に 勝てない');
  assert.ok(!bot.s[C10D_POWER_KEY], 'ちからの水は 次の 戦い 1回で 消える（負けても）');
  // 3回 負けると いずみが もう 一度 わく（その あと 4回めから 知って いる 動き）
  assert.ok(said(bot, 'もう一度、わきだした') || bot.msgs.some((m) => m.t === 'toast' && m.text.includes('もう一度、わきだした')), 'いずみが わいた');
  assert.equal(r1[r1.length - 1], 'win', `門 1（${r1.join(',')}）`);
  // 門 2 の 前に 1回 くぼ地へ 帰って もどる（門 1 は 開いた まま・いずみ 1 は わいた ので もう一度 えらべる）
  await warpTo(bot, 'c9a_crater', 12, 12, opts);
  await warpTo(bot, 'star_tower_1f', TOWER1_BACK10D.x, TOWER1_BACK10D.y, opts);
  await walk(bot, TOWER1_GOLD10D[0].x, TOWER1_GOLD10D[0].y, opts);
  assert.equal(bot.s.map, 'star_tower_top', 'てっぺんの 場面は 1回だけ');
  await go(bot, 11, 2, opts);
  assert.equal(bot.s.map, C10D_MAP.stair1, '光の 階段は のこる');
  assert.ok(!isBlocked(MAPS[C10D_MAP.stair1], GATE_INFO10D[1].x, GATE_INFO10D[1].y, world.hasFlagFn(bot.s)), '帰って もどっても 門 1 は 開いた まま');
  assert.ok(!c.flags.c10d_well1, 'わいた いずみ');
  await well(bot, 1, 0, opts);
  assert.equal(effectiveTile(MAPS[C10D_MAP.stair1], STAIR1_POS.wells[0].x, STAIR1_POS.wells[0].y, world.hasFlagFn(bot.s)), T.C10D_WELL_DRY);
  await go(bot, STAIR1_POS.up.x, STAIR1_POS.up.y, opts);
  assert.equal(bot.s.map, C10D_MAP.stair2);
  // いずみ 2: ちえの水 → 門 2・いずみ 3: いやしの水 → 門 3
  c.mp = 0;
  await well(bot, 2, 1, opts);
  assert.equal(c.mp, computeStats(c).maxMp, 'ちえの水');
  await openChests(bot, opts);
  const r2 = await gateUntilWin(bot, 2, { ...opts, mode0: 'know' });
  c.hp = 1;
  await well(bot, 3, 0, opts);
  assert.equal(c.hp, computeStats(c).maxHp, 'いやしの水');
  await openChests(bot, opts);
  const r3 = await gateUntilWin(bot, 3, { ...opts, mode0: 'know' });
  await go(bot, STAIR2_POS.up.x, STAIR2_POS.up.y, opts);
  await well(bot, 4, 2, opts);
  await openChests(bot, opts);
  const r4 = await gateUntilWin(bot, 4, { ...opts, mode0: 'know' });
  log.push(`gate2:${r2.join(',')} gate3:${r3.join(',')} gate4:${r4.join(',')}`);
  assert.ok(C10D_GATES.every((f) => c.flags[f]), '門 4つ');
  assert.equal(c.objective, C10D_OBJ.summit);
  await go(bot, STAIR3_POS.up.x, STAIR3_POS.up.y, opts);
  assert.equal(bot.s.map, C10D_MAP.summit);
  await openChests(bot, opts);
  // T4 ミラーレ（はじめは 完全オートで 負ける）→ T5 金の 音
  const r5 = await mirrorUntilWin(bot, opts);
  log.push(`mirror:${r5.join(',')}`);
  assert.equal(r5[0], 'lose', 'はじめの 完全オートでは ミラーレに 勝てない');
  assert.ok(c.flags[C10D.mirror] && c.flags[C10D.note] && c.keyItems.includes('note_do'), `ミラーレに 勝つ → 金の 音（${r5.join(',')}）`);
  assert.ok((sent.get(SONG) || 0) + (sent.get(TERU) || 0) + (sent.get('defend') || 0) > 0, 'スピカの 星のうた・てらす・防御を 送った');
  assert.ok((sent.get(NARASU) || 0) > 0, '「音を鳴らす」を 画面と 同じ 形で 送った');
  assert.ok(said(bot, '女王さまに、お知らせせねば') && said(bot, 'さいごの、ひとふしまで'));
  assert.equal(c.objective, C10D_OBJ.hill);
  for (const id of C10D_CHEST_IDS) assert.ok(c.chests[id], `宝箱 ${id}`);
  // 光の 出口 → B1 星見の丘 → E くぼ地の 金の 台
  await go(bot, SUMMIT_POS.portal.x, SUMMIT_POS.portal.y, opts);
  assert.equal(bot.s.map, 'star_tower_top');
  await warpTo(bot, 'overworld', 60, 88, opts);
  await walk(bot, 60, 87, opts);
  await walk(bot, 60, 86, opts);
  assert.ok(c.flags[C10D.bridge] && said(bot, '橋は、空の、とちゅうで、止まった'));
  await warpTo(bot, 'c9a_crater', 8, 6, opts);
  bot.send({ t: 'interact', kind: 'npc', id: 'c9c_ped2' });
  await playReal(bot, R(opts));
  assert.ok(c.flags[C10D.act4], '幕と 第2章の クリア');
  assert.equal(c.objective, act4ClearObjective());
  assert.equal(c.objective, C11A_START_OBJ);
  assert.equal(storyPlace(c).label, '第3部 第2章 第4幕');
  assert.ok(storyPlace(c).cleared);
  assert.ok(C10D_SHOP_ADD.every((id) => SHOPS.c10d_crater.items.includes(id)), 'くぼ地の 武具屋に 品が ふえた');
  assert.deepEqual(fought.filter((f) => f !== 'field').filter((f, i, a) => a.indexOf(f) === i), [...C10D_GATES.map((_, i) => C10D_BATTLE[`gate${i + 1}`]), C10D_BATTLE.mirror]);
  console.log('# family', log.join(' '), [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
});

test('ひとり（仲間なし）: 門 1 と ミラーレに 知って いる 動きで いどむ（何度でも やり直せる）', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9922);
  const { bot, c } = await player(world, 'ソラ');
  const fought = [];
  const sent = new Map();
  const opts = { fought, sent };
  Object.assign(c.flags, { c10d_start: true, c10d_top: true });
  const r1 = await gateUntilWin(bot, 1, { ...opts, mode0: 'know', max: 12 });
  assert.ok(c.flags.c10d_gate1, `ひとりでも 門 1 に 勝てる（${r1.join(',')}）`);
  Object.assign(c.flags, Object.fromEntries(C10D_GATES.map((f) => [f, true])));
  const r2 = await mirrorUntilWin(bot, { ...opts, mode0: 'know', max: 12 });
  assert.ok(c.flags[C10D.note], `ひとりでも ミラーレに 勝てる（${r2.join(',')}）`);
  console.log('# solo', `gate1:${r1.join(',')} mirror:${r2.join(',')}`, [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
});

test('家族 2人（パーティー）: いずみは リーダーが えらんで 2人に きく・2人で 門と ミラーレ（どちらも 画面と 同じ 形の コマンド）・戦いの 中で 回線が 切れて もどる', { timeout: 1700000 }, async () => {
  const world = fixedWorld(9923, { offline: false, checkPassword: () => true });
  // 第101回 R2班: 仲間を つれない 家族 2人だけ（人数合わせの bare … 2人だけでも 門 1 と ミラーレに 勝てる）
  const A = await player(world, 'ソラ');
  const B = await player(world, 'ミナ');
  for (const P of [A, B]) Object.assign(P.c.flags, { c10d_start: true, c10d_top: true });
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const sent = new Map();
  const fought = [];
  const E = STAIR1_POS.entry;
  await warpTo(A.bot, C10D_MAP.stair1, E.x, E.y, { bots: [B.bot], fought, sent });
  await warpTo(B.bot, C10D_MAP.stair1, E.x + 1, E.y, { bots: [A.bot], fought, sent });
  // なかまは えらべない・リーダーが ちからの水 → 2人に しるし
  await goExamine(B.bot, STAIR1_POS.wells[0], 2, { bots: [A.bot], fought, sent });
  assert.ok(said(B.bot, 'リーダーが、えらぼう') && !A.c.flags.c10d_well1);
  await goExamine(A.bot, STAIR1_POS.wells[0], 2, { bots: [B.bot], fought, sent });
  assert.ok(A.bot.s[C10D_POWER_KEY] && B.bot.s[C10D_POWER_KEY], '2人に ちからの水');
  assert.ok(B.bot.msgs.some((m) => m.t === 'toast' && m.text.includes('ちからの水')), 'ミナに 何を えらんだか');
  // 2人で 門 1（知って いる 動き）。とちゅうで ミナの 回線が 切れて、すぐ もどる（同じ セッションを ひきつぐ）
  let cut = false, B2 = null;
  const pair = [B.bot];
  const onTick = async (i) => {
    if (cut || i < 300 || !world.battles.size) return;
    cut = true;
    world.disconnect(B.bot.s, B.bot.conn);
    await tickN(world, 20);
    B2 = new Bot(world, 'ミナ');
    await B2.login();
    B2.send({ t: 'play', id: B.c.id });
    pair[0] = B2;
  };
  await go(B.bot, GATE_INFO10D[1].front.x, GATE_INFO10D[1].front.y + 2, { bots: [A.bot], fought, sent });
  const r = await gateUntilWin(A.bot, 1, { mode0: 'know', max: 8, bots: pair, fought, sent, onTick });
  assert.ok(A.c.flags.c10d_gate1, `2人で 門 1 に 勝つ（${r.join(',')}）`);
  assert.ok(cut && B2?.resumed, 'ミナは 戦いの とちゅうで 切れて もどった');
  assert.ok(!A.bot.s[C10D_POWER_KEY] && !B.bot.s[C10D_POWER_KEY], 'ちからの水は 使った');
  const mates = B2 || B.bot;
  assert.ok(!isBlocked(MAPS[C10D_MAP.stair1], GATE_INFO10D[1].x, GATE_INFO10D[1].y, world.hasFlagFn(mates.s)), 'ミナにも 開いた 門');
  // 2人で ミラーレ
  for (const P of [A]) Object.assign(P.c.flags, Object.fromEntries(C10D_GATES.map((f) => [f, true])));
  await warpTo(mates, C10D_MAP.summit, 13, 14, { bots: [A.bot], fought, sent });
  const r2 = await mirrorUntilWin(A.bot, { mode0: 'know', max: 8, bots: [mates], fought, sent });
  assert.ok(A.c.flags[C10D.note], `2人で ミラーレに 勝つ（${r2.join(',')}）`);
  assert.ok((sent.get(NARASU) || 0) > 0, '「音を鳴らす」を 画面と 同じ 形で 送った');
  console.log('# pair', `gate1:${r.join(',')} mirror:${r2.join(',')}`, [...sent].map(([k, v]) => `${k}:${v}`).join(' '));
});
