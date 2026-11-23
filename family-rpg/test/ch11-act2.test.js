// 第3部 第3章 第2幕「月の都と、名前のランプ」の 通し（第102回: A班〈世界と 物語〉と B班〈戦いと 品〉・F班〈曲〉を つないだ あと）※ ネタバレ注意
// ・第1幕を クリアした セーブ（c11_act1）から c11_act2 まで、決まった 戦い（ランプの番人・月のむかえ オボロ）を 本当に 戦う（「すぐ 勝たせる」に しない）
//   （tools/sim-ch11.mjs の 装備 CH9_KIT.keeper・oboro）
// ・人が 動かす キャラ（この テストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。
//   「よびかける」は { type: 'ability', id: 'm11_yobikake', choice: 'spica' か 仲間 }（画面の c11bCmdPick と 同じ）。何を 送るかは 知って いる 人の えらび方（decideAlly）
//   家族の 仲間は tools/sim-ch9.mjs の 知って いる 手
// ・幕は 開いた（PART3_C11B_OPEN = true）。本体の 台本の まま（まぜなおさない）
// ・おもてと うらは 画面と 同じ: 戸の 上で しらべる・ランプを しらべる・歩いて 光の ゆかを ふむ（道さがし solve11b の とおり）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { C11B, C11B_MAP, C11B_PAIRS, C11B_BATTLE, C11B_CHEST_IDS, C11B_PLACE, NAME_LAMP } from '../public/js/shared/maps/c11b-flags.js';
import { C11A } from '../public/js/shared/maps/c11a-flags.js';
import { CITY_POS11B, TOWER_POS11B, C11B_SECTIONS, SEA_MOON_PIER11B, SEA_MOON_OUT11B, SEA_SCENE0_11B } from '../public/js/shared/maps/c11b-rows.js';
import { SEA_GATE11A } from '../public/js/shared/maps/c11a-rows.js';
import { solve11b } from '../public/js/shared/world/c11b-steps.js';
import { PART3_C11B_OPEN, act1ClearObjective } from '../public/js/shared/data/story-c11.js';
import { C11A_OBJ } from '../public/js/shared/data/story-c11a.js';
import { C11B_OBJ } from '../public/js/shared/data/story-c11b.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C11B_FRONT_ARMS } from '../public/js/shared/data/items-c11b.js';
import { YOBIKAKE } from '../public/js/shared/data/abilities-c11b.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch9Party, MODES9 } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch11.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, D4, addPlayer, UPTO } from './c9a-play.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { SKY_FLAG } from '../public/js/shared/data/sky.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const NOTES7 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si', 'note_do'];
const SEC = Object.fromEntries(C11B_SECTIONS.map((S) => [S.id, S]));
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
  const { bot, c } = await addPlayer(world, name, C11A.act1, [SKY_FLAG]);
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES7, 'star_chart', 'star_ship'])];
  c.objective = act1ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'keeper', 121);
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
      if (a.auto) h.send({ t: 'battle', actor: a.id, auto: false });
      if (!a.ready || b.queue.some((q) => q.id === a.id)) continue;
      let cmd = decideAlly(b, a) || { type: 'attack', target: b.aliveEnemies()[0]?.id };
      if (cmd.type === 'ai') cmd = { type: 'attack', target: b.aliveEnemies()[0]?.id };
      // 知って いる 人: スピカの 思い出が へって いて、まだ だれも よびかけて いなければ よびかける（画面の c11bCmdPick と 同じ 形）
      const st = b.c11b;
      if (st?.kind === 'oboro' && st.forget >= 1 && !b.queue.some((q) => q.cmd?.id === YOBIKAKE)) cmd = { type: 'ability', id: YOBIKAKE, choice: 'spica' };
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
async function playReal(bot, { real = () => 'auto', bots = [], fought = null, sent = new Map(), onBattle = null, max = 80000 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    const all = [bot, ...bots];
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd) continue;
      if (!c2.done) { c2.done = true; if (fought) fought.push(c2.opts.fixed || 'field'); onBattle?.(c2); }
      driveReal(c2, c2.opts.fixed ? real(c2.opts.fixed) : 'auto', all, sent);
    }
    for (const b of all) b.flushQueue();
    await tickN(world, 1);
    for (const b of all) b.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (all.every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const b of all) b.flushQueue();
      if (all.every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
const R = (opts) => ({ ...opts, real: (fid) => (fid ? opts.realMode?.(fid) || 'know' : 'auto') });
async function walk(bot, x, y, opts) {
  bot.x = x + 0.5; bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await playReal(bot, R(opts));
}
async function look(bot, x, y, opts) {
  bot.send({ t: 'interact', kind: 'tile', x, y });
  await playReal(bot, R(opts));
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
async function talkNpc(bot, mapId, id, opts) {
  const n = MAPS[mapId].npcById[id];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [Math.floor(n.x) + dx, Math.floor(n.y) + dy]).find(([x, y]) => canStand(MAPS[mapId], x + 0.5, y + 0.5, has));
  await warpTo(bot, mapId, side[0], side[1], opts);
  bot.send({ t: 'interact', kind: 'npc', id });
  await playReal(bot, R(opts));
}
// 区切りを 道さがしの とおりに（画面と 同じ: 歩く・戸の 上で しらべる・ランプを しらべる）。マップが 思わぬ 所に かわったら（戦いに 負けた など）やめる
async function runPath(bot, S, opts) {
  const has = bot.world.hasFlagFn(bot.s);
  const side = MAPS[bot.s.map].c11b.side;
  const path = solve11b(S, { side, x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, has);
  assert.ok(path, `${S.id}: ${bot.s.map} から 出口へ`);
  for (const step of path) {
    const [sd, x, y] = step.st;
    if (step.act?.kind === 'door') await look(bot, x, y - 1, opts);
    else if (step.act?.kind === 'lamp') await look(bot, step.act.x, step.act.y, opts);
    else await walk(bot, x, y, opts);
    if (bot.s.map !== C11B_PAIRS[S.pair][sd]) return false;
  }
  return true;
}
// 魔物を 1ぴき その 人に ぶつけて 本当に 戦う（オート）
async function fieldFight(bot, opts) {
  const world = bot.world;
  const ms = mapState(world, bot.s.map);
  for (let i = 0; i < 120 && !ms.symbols.size; i++) { bot.s.repelUntil = 0; await tickN(world, 5); }
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
const healAll = (bots) => { for (const b of bots) { fullHeal(b.s.char); for (const f of b.fam || []) fullHeal(f); } };

// ───── 門の むこう → 月の都 → うらの 町 → うら道 → 名前の 塔 3階（番人の 前）─────
async function toCity(bot, opts) {
  const c = bot.s.char;
  const S0 = SEA_SCENE0_11B;
  await warpTo(bot, 'c11_sea', S0.x + 4, S0.y + S0.h, opts);
  await walk(bot, S0.x + 4, S0.y + S0.h - 1, opts);
  assert.ok(c.flags[C11B.start] && said(bot, '第2幕　月の都と、名前のランプ'), '場面 0 と 題の 画面');
  assert.equal(storyPlace(c).label, '第3部 第3章 第2幕');
  await warpTo(bot, 'c11_sea', SEA_MOON_OUT11B.x, SEA_MOON_OUT11B.y, opts);
  await walk(bot, SEA_MOON_PIER11B.x, SEA_MOON_PIER11B.y, opts);
  assert.equal(bot.s.map, C11B_MAP.front);
  await walk(bot, CITY_POS11B.harbor.x, CITY_POS11B.harbor.y - 1, opts);
  assert.ok(c.flags[C11B.plaza] && said(bot, '名前のランプ'));
  await walk(bot, CITY_POS11B.harbor.x, CITY_POS11B.harbor.y - 2, opts);
  assert.ok(c.visited?.[C11B_PLACE], 'ルーラで 月の都へ 行ける');
  await talkNpc(bot, C11B_MAP.front, 'c11b_hotaru', opts);
  const D = CITY_POS11B.door;
  await warpTo(bot, C11B_MAP.front, D.x, D.y, opts);
  await look(bot, D.x, D.y - 1, opts);
  assert.equal(bot.s.map, C11B_MAP.back);
  await walk(bot, D.x, D.y - 1, opts);
  assert.ok(c.flags[C11B.rule] && said(bot, '光のはかり'));
}
async function toTower3(bot, opts) {
  const c = bot.s.char;
  await go(bot, CITY_POS11B.rule.x, CITY_POS11B.rule.y + 1, opts);
  for (const id of ['c1', 'c2', 'c3']) assert.ok(await runPath(bot, SEC[id], opts), id);
  await walk(bot, CITY_POS11B.tower.x, CITY_POS11B.tower.y, opts);
  assert.equal(bot.s.map, C11B_MAP.tower1);
  await walk(bot, TOWER_POS11B[1].arrive.x - 1, TOWER_POS11B[1].arrive.y, opts);
  assert.ok(c.flags[C11B.tower]);
  assert.ok(await runPath(bot, SEC.t1, opts), 't1');
  await walk(bot, TOWER_POS11B[1].up.x, TOWER_POS11B[1].up.y, opts);
  assert.ok(await runPath(bot, SEC.t2, opts), 't2');
  await walk(bot, TOWER_POS11B[2].up.x, TOWER_POS11B[2].up.y, opts);
  assert.equal(bot.s.map, C11B_MAP.tower3);
}
// 番人: 3階の 上の 広間へ（はじめは 道さがしで。やり直しは 広間の 下の はしから 1歩）
const keeperFirst = (bot) => async (o) => { await runPath(bot, SEC.t3, o); };
const keeperAgain = (bot) => async (o) => {
  await warpTo(bot, C11B_MAP.tower3, 13, 10, o);
  await walk(bot, 14, 10, o);
};
const oboroGo = (bot) => async (o) => {
  const P = TOWER_POS11B[3].terrace;
  await warpTo(bot, C11B_MAP.tower3, 12, 6, o);
  await go(bot, P.x, P.y + 1, o);
  await walk(bot, P.x, P.y, o);
};
// ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ノクトの ヒント → もう一度）
async function bossUntilWin(bot, which, first, again, { mode0 = 'know', max = 8, fought, bots = [], sent, seen = null } = {}) {
  const res = [];
  const battle = C11B_BATTLE[which];
  const win = which === 'keeper' ? C11B.keeper : C11B.oboro;
  gear([bot.s.char, ...(bot.fam || [])], which, which === 'keeper' ? 121 : 122);
  for (const b of bots) gear([b.s.char], which, which === 'keeper' ? 121 : 122);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    healAll([bot, ...bots]);
    const v0 = bot.msgs.length;
    const o = { fought, bots, sent, realMode: (fid) => (fid === battle ? mode : 'know'), onBattle: seen };
    await (k === 0 ? first(o) : again(o));
    assert.ok(fought.filter((f) => f === battle).length >= k + 1, `${battle} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.world.hasFlagFn(bot.s)(win);
    res.push(won ? 'win' : 'lose');
    if (!won && k === 0) { await tickN(bot.world, 40); await playReal(bot, R({ fought, bots, sent })); assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0), 'ノクトの ヒント'); }
    if (won) return res;
  }
  return res;
}

test('幕が 開いた: もう 第1幕を クリアした 人の セーブ（古い 目標の 文）は ログインで「星の船で、星座の門のむこうへ。…」に なおり、門の むこうへ 行ける・前の 人は かわらない', async () => {
  assert.equal(PART3_C11B_OPEN, true);
  assert.equal(act1ClearObjective(), C11B_OBJ.start);
  assert.equal(C11A_OBJ.act1, '第3部　第3章　第2幕へ（続きはアップデートで！）');
  const world = fixedWorld(11231);
  const done = await addPlayer(world, 'ソラ', C11A.act1, [SKY_FLAG]);
  done.c.objective = C11A_OBJ.act1; // 幕を 開ける 前に 第1幕を クリアした 人の セーブ
  done.c.keyItems = [...new Set([...(done.c.keyItems || []), 'star_chart', 'star_ship'])];
  const mid = await addPlayer(world, 'ミナ', 'c11a_beast', [SKY_FLAG, 'c11a_light1', 'c11a_light2', 'c11a_light3']);
  const part2 = await addPlayer(world, 'ポポ', 'c8_solitus', [SKY_FLAG]);
  const keep = [[mid, C11A_OBJ.gate], [part2, part2.c.objective]];
  const w2 = new GameWorld({ offline: true, rng: makeRng(11232), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const enter = async (P) => {
    const b = new Bot(w2, P.c.name);
    await b.login();
    b.send({ t: 'play', id: P.c.id });
    await b.settle();
    return { bot: b, c: w2.data.characters[P.c.id] };
  };
  const A = await enter(done);
  assert.equal(A.c.objective, C11B_OBJ.start, '古い 文は なおる');
  for (const [P, want] of keep) {
    const B = await enter(P);
    assert.equal(B.c.objective, want, `${P.c.name} は かわらない`);
  }
  assert.equal(storyPlace(A.c).label, '第3部 第3章 第1幕', '始まる 前は 第1幕 の まま');
  // 門の 前へ → きりが 晴れる・題の 画面 → 門の むこうの 都の はとばへ
  A.bot.s.repelUntil = 1e15;
  const opts = { fought: [], sent: new Map() };
  await toCity(A.bot, opts);
  assert.equal(A.c.objective, C11B_OBJ.tower);
  assert.ok(!isBlocked(MAPS.c11_sea, 31, 36, w2.hasFlagFn(A.bot.s)), 'きりが 晴れた');
  assert.ok(said(A.bot, '…ここ、知ってる'));
  // 門を しらべた 文は「続きは アップデート」を 言わない
  const n0 = A.bot.msgs.length;
  await warpTo(A.bot, 'c11_sea', SEA_GATE11A.x + 1, SEA_GATE11A.y + 1, opts);
  await look(A.bot, SEA_GATE11A.x + 1, SEA_GATE11A.y, opts);
  const txt = JSON.stringify(A.bot.msgs.slice(n0).filter((m) => m.t === 'script'));
  assert.ok(txt.includes('星座の門は、開いている') && !txt.includes('アップデート'));
});

test('通し（家族の 仲間 3人）: 第1幕の クリアから → 月の都（おもて → うら）→ うら道（魔物）→ 塔 → 番人（本当に）→ スピカの ランプ → オボロ（はじめ 完全オートで つれて いかれて 負け → ヒント → よびかける で 勝ち）→ c11_act2', async () => {
  const world = fixedWorld(11201);
  const { bot, c } = await player(world, 'ソラ', ['ミナ', 'リン', 'ガル']);
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  await toCity(bot, opts);
  // うら道の 魔物（本当に 戦う）
  await warpTo(bot, C11B_MAP.back, 30, 21, opts);
  assert.equal(await fieldFight(bot, opts), 't11b_alley');
  await warpTo(bot, C11B_MAP.back, 28, 27, opts);
  await toTower3(bot, opts);
  await warpTo(bot, C11B_MAP.towerb2, 10, 17, opts);
  assert.equal(await fieldFight(bot, opts), 't11b_towerb');
  await warpTo(bot, C11B_MAP.tower3, 20, 23, opts);
  const resK = await bossUntilWin(bot, 'keeper', keeperFirst(bot), keeperAgain(bot), { fought, sent, max: 10 });
  assert.equal(resK.at(-1), 'win', `番人 ${resK}`);
  assert.ok(c.flags[C11B.lamp] && c.keyItems.includes(NAME_LAMP) && said(bot, 'ひとりむすめ'));
  assert.equal(c.objective, C11B_OBJ.terrace);
  // オボロ（はじめは 完全オート → スピカが つれて いかれて 負け → ヒント → 知って いる 動き）。スピカは ゲスト
  let spica = 0, ob = 0;
  const seen = (c2) => { if (c2.opts.fixed === C11B_BATTLE.oboro) { ob++; if (c2.battle.c9sp) spica++; } };
  const resO = await bossUntilWin(bot, 'oboro', oboroGo(bot), oboroGo(bot), { mode0: 'auto', fought, sent, max: 10, seen });
  assert.equal(resO[0], 'lose', '完全オートでは 勝てない');
  assert.equal(resO.at(-1), 'win', `オボロ ${resO}`);
  assert.ok(ob >= resO.length && spica === ob, `オボロ戦には いつも スピカが いる（${spica}/${ob}）`);
  assert.ok((sent.get(YOBIKAKE) || 0) > 0, `「よびかける」を 画面と 同じ 形で 送った（${sent.get(YOBIKAKE)}）`);
  assert.ok(c.flags[C11B.oboro] && c.flags[C11B.act2]);
  assert.ok(said(bot, 'わたし、お母さまに、会いにいく') && said(bot, '第2幕　クリア！'));
  assert.equal(c.objective, C11B_OBJ.act2);
  assert.ok(storyPlace(c).cleared);
  // 店（B班の 品）・宝箱の 中み
  assert.deepEqual(SHOPS.c11b_arms.items, C11B_FRONT_ARMS);
  for (const id of C11B_CHEST_IDS) assert.ok(C11B_MAP && Object.values(C11B_MAP).some((m) => MAPS[m].chests.some((q) => q.id === id && q.item)), id);
  console.log(`  番人 ${resK.join('→')}・オボロ ${resO.join('→')}・よびかける ${sent.get(YOBIKAKE)}回・戦い ${fought.length}回`);
});

test('ひとり（仲間なし）: 番人・オボロとも 勝つまで（知って いる 動き。よびかける）', async () => {
  const world = fixedWorld(11202);
  const { bot, c } = await player(world, 'ソラ');
  bot.s.repelUntil = 1e15;
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  await toCity(bot, opts);
  await toTower3(bot, opts);
  const resK = await bossUntilWin(bot, 'keeper', keeperFirst(bot), keeperAgain(bot), { fought, sent, max: 12 });
  assert.equal(resK.at(-1), 'win', `番人 ${resK}`);
  const resO = await bossUntilWin(bot, 'oboro', oboroGo(bot), oboroGo(bot), { fought, sent, max: 12 });
  assert.equal(resO.at(-1), 'win', `オボロ ${resO}`);
  assert.ok((sent.get(YOBIKAKE) || 0) > 0);
  assert.ok(c.flags[C11B.act2]);
  console.log(`  ひとり: 番人 ${resK.join('→')}・オボロ ${resO.join('→')}`);
});

test('家族 2人（＋仲間 2人）: 塔で おもてと うらに 分かれる（ゆか・ランプは リーダーの しるし）→ 2人で 番人 → 2人で オボロ（2人とも 画面の 形で よびかける）', async () => {
  const world = fixedWorld(11203);
  const A = await player(world, 'ソラ', ['リン', 'ガル']);
  const B = await player(world, 'ミナ');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  B.bot.s.follow = false;
  const fought = [], sent = new Map();
  const oA = { fought, sent, bots: [B.bot] }, oB = { fought, sent, bots: [A.bot] };
  await playReal(A.bot, oA);
  await toCity(A.bot, oA);
  await warpTo(A.bot, C11B_MAP.back, 28, 27, oA);
  await go(A.bot, CITY_POS11B.rule.x, CITY_POS11B.rule.y + 1, oA);
  for (const id of ['c1', 'c2', 'c3']) assert.ok(await runPath(A.bot, SEC[id], oA), id);
  await walk(A.bot, CITY_POS11B.tower.x, CITY_POS11B.tower.y, oA);
  await walk(A.bot, TOWER_POS11B[1].arrive.x - 1, TOWER_POS11B[1].arrive.y, oA);
  // 1階: A は おもてで 光の ゆか・B は うらの ろうかで 待って、開いたら すぐ 通る
  const F1 = MAPS.c11b_tower1.c11b.floors[0];
  await warpTo(B.bot, C11B_MAP.towerb1, F1.x + 2, F1.y, oB);
  assert.ok(isBlocked(MAPS.c11b_towerb1, F1.x, F1.y, world.hasFlagFn(B.bot.s)));
  await go(A.bot, F1.x, F1.y, oA);
  assert.ok(A.c.flags[F1.f] && !B.c.flags[F1.f], 'リーダーの しるし');
  await go(B.bot, 2, 10, oB);
  assert.deepEqual([Math.floor(B.bot.s.x), Math.floor(B.bot.s.y)], [2, 10], 'B は 戸を くぐらずに 西の 部屋へ');
  // 2階: B が おもてで 青 → 金 の ランプ、A は うらで 谷を わたる
  await warpTo(A.bot, C11B_MAP.towerb2, 20, 17, oA);
  const m2 = MAPS.c11b_tower2;
  const blue = m2.c11b.lamps.find((q) => q.c === 'a' && q.y > 12), gold = m2.c11b.lamps.find((q) => q.c === 'b' && q.y > 7 && q.y < 13);
  await warpTo(B.bot, C11B_MAP.tower2, blue.x + 1, blue.y, oB);
  await look(B.bot, blue.x, blue.y, oB);
  await go(A.bot, 5, 11, oA);
  await warpTo(B.bot, C11B_MAP.tower2, gold.x - 1, gold.y, oB);
  await look(B.bot, gold.x, gold.y, oB);
  await go(A.bot, 17, 6, oA);
  assert.ok(A.c.flags.c11b_d5 && !A.c.flags.c11b_d4, '金が ともり 青は 消えた');
  assert.ok(B.bot.msgs.some((m) => m.t === 'toast' && /ランプが、ともった/.test(m.text)) && A.bot.msgs.some((m) => m.t === 'toast' && /おもてで/.test(m.text)));
  // 3階 → 2人で 番人・オボロ
  await warpTo(A.bot, C11B_MAP.tower3, 20, 23, oA);
  await warpTo(B.bot, C11B_MAP.tower3, 19, 23, oB);
  const resK = await bossUntilWin(A.bot, 'keeper', keeperFirst(A.bot), async (o) => {
    await warpTo(B.bot, C11B_MAP.tower3, 12, 10, oB);
    await keeperAgain(A.bot)(o);
  }, { fought, sent, bots: [B.bot], max: 10 });
  assert.equal(resK.at(-1), 'win', `番人 ${resK}`);
  await warpTo(B.bot, C11B_MAP.tower3, 13, 4, oB);
  const humans = new Set();
  const resO = await bossUntilWin(A.bot, 'oboro', async (o) => { await oboroGo(A.bot)(o); }, async (o) => {
    await warpTo(B.bot, C11B_MAP.tower3, 13, 4, oB);
    await oboroGo(A.bot)(o);
  }, { fought, sent, bots: [B.bot], max: 10, seen: (c2) => { for (const a of c2.battle.allies) if (a.controller === A.bot.s.id || a.controller === B.bot.s.id) humans.add(a.controller); } });
  assert.equal(resO.at(-1), 'win', `オボロ ${resO}`);
  assert.equal(humans.size, 2, '2人とも オボロ戦に いる');
  assert.ok((sent.get(YOBIKAKE) || 0) > 0);
  assert.ok(A.c.flags[C11B.act2]);
  assert.ok(said(B.bot, 'お母さまに、会いにいく'), 'なかまも おわりの 場面を 見た');
  console.log(`  2人: 番人 ${resK.join('→')}・オボロ ${resO.join('→')}`);
});

void T; void UPTO;
