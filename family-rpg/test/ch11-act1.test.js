// 第3部 第3章 第1幕「星の船と、星座の島」の 通し（第101回: A班〈世界と 物語〉と B班〈戦いと 品〉・F班〈曲〉を つないだ あと）※ ネタバレ注意
// ・第2章を クリアした セーブ（c10_act4）から c11_act1 まで、決まった 戦い（星座の けもの・いかり船長）を 本当に 戦う（「すぐ 勝たせる」に しない）
//   （tools/sim-ch11.mjs の 装備 CH9_KIT.beast・pirate）
// ・人が 動かす キャラ（このテストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。
//   「時計を投げる」は { type: 'ability', id: 'm11_tokeinage' }（画面の c11aCmdPick と 同じ）。何を 送るかは 知って いる 人の えらび方（decideAlly）
//   家族の 仲間は tools/sim-ch9.mjs の 知って いる 手
// ・幕は まだ 閉じて いる（PART3_C11A_OPEN = false。第2章 第4幕を 公開した あとで 開ける）ので、テストの 中で 開いた 形に して ためす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { C11A, C11A_LIGHTS, C11A_LENS, C11A_CON, C11A_CON_IDS, C11A_ISLE_CONS, C11A_MAP, C11A_BATTLE, C11A_CHEST_IDS, C11A_PLACE, STAR_CHART, STAR_SHIP } from '../public/js/shared/maps/c11a-flags.js';
import { ISLES11A, SEA_GATE11A, SEA_GATE_SCENE11A, ISLE_POS11A, PERCH_POS11A, HILL_SCENE11A } from '../public/js/shared/maps/c11a-rows.js';
import { SHOP11A } from '../public/js/shared/maps/c11a.js';
import { solve11a } from '../public/js/shared/data/constellations-c11a.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { act4ClearObjective } from '../public/js/shared/data/story-c10.js';
import { PART3_C11A_OPEN, c11aTitleSteps } from '../public/js/shared/data/story-c11.js';
import { C11A_OBJ, applyCh11a } from '../public/js/shared/data/story-c11a.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C11A_PERCH_ARMS } from '../public/js/shared/data/items-c11a.js';
import { TOKEI_NAGE } from '../public/js/shared/data/abilities-c11a.js';
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

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const NOTES7 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si', 'note_do'];
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
let opened = false;
function openAct() {
  if (opened) return;
  opened = true;
  applyCh11a(SCRIPTS, STORY_SCRIPTS, { title: c11aTitleSteps, open: true });
}
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
  openAct();
  const ids = famNames.length ? await famIds(world, famNames) : [];
  const { bot, c } = await addPlayer(world, name, 'c10_act4');
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES7])];
  c.objective = act4ClearObjective(true);
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'beast', 119);
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
async function playReal(bot, { real = () => 'auto', bots = [], fought = null, sent = new Map(), max = 80000 } = {}) {
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
      // 星座の 星は ふまない（入る 時だけ）
      if (!(nx === tx && ny === ty) && effectiveTile(map, nx, ny, has) === T.C11A_STAR) continue;
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
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x) && effectiveTile(map, x, y, has) !== T.C11A_STAR && ((x === sx && y === sy) || pathFor(map, sx, sy, x, y, has)));
  assert.ok(side, `${map.id}: ${p.x},${p.y} の となりへ`);
  if (side[0] !== sx || side[1] !== sy) await go(bot, side[0], side[1], opts);
  await look(bot, p.x, p.y, choice, opts);
}
// 星座を ひとふでで（地面を 歩いて 入口の 星へ → 線の 向きの マスを しらべる ＝ 画面で 向きを 入れたのと 同じ）
async function drawCon(bot, id, opts, part = null) {
  const map = MAPS[bot.s.map];
  const con = map.c11aCons.find((C) => C.id === id);
  const sol = solve11a(con, con.entries);
  const [x, y] = con.stars[sol.start];
  const has = bot.world.hasFlagFn(bot.s);
  const g = D4.map(([dx, dy]) => [x + dx, y + dy]).find(([gx, gy]) => !con.stars.some(([a, b]) => a === gx && b === gy) && !isBlocked(map, gx, gy, has));
  await go(bot, g[0], g[1], opts);
  await walk(bot, x, y, opts);
  for (const m of part ? sol.path.slice(...part) : sol.path) {
    const [dx, dy] = DIRV[m.dir];
    await look(bot, Math.floor(bot.s.x) + dx, Math.floor(bot.s.y) + dy, 0, opts);
  }
  return sol;
}
// 島へ（星の海の はとばの 前の 海 → はとば）
async function toIsle(bot, n, opts) {
  const I = ISLES11A[`isle${n}`];
  await warpTo(bot, C11A_MAP.sea, I.sea.x, I.sea.y, opts);
  await walk(bot, I.pier.x, I.pier.y, opts);
  assert.equal(bot.s.map, `c11a_isle${n}`);
}
async function isleDo(bot, n, opts) {
  await toIsle(bot, n, opts);
  for (const id of C11A_ISLE_CONS[n]) await drawCon(bot, id, opts);
  assert.ok(bot.s.char.flags[C11A_LIGHTS[n - 1]] || bot.world.hasFlagFn(bot.s)(C11A_LIGHTS[n - 1]), `島 ${n} の 明かり`);
}
async function openChests(bot, mapId, opts) {
  for (const ch of MAPS[mapId].chests) {
    if (bot.s.char.chests[ch.id] || bot.s.map !== mapId) continue;
    await goExamine(bot, ch, 0, opts);
  }
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
// けもの: 3つめの 明かりの 島の 明かりの そばの マス（負けた 時の やり直しの マス）
async function beastAgain(bot, n, opts) {
  const P = ISLE_POS11A[n];
  await warpTo(bot, `c11a_isle${n}`, P.light.x, P.light.y + 4, opts);
  await walk(bot, P.light.x, P.light.y + 3, opts);
}
async function pirateGo(bot, opts) {
  const G = SEA_GATE_SCENE11A;
  await warpTo(bot, C11A_MAP.sea, G.x + 4, G.y + G.h + 1, opts);
  await walk(bot, G.x + 4, G.y + G.h - 1, opts);
}
// ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ノクトの ヒント → もう一度）
async function bossUntilWin(bot, which, first, again, { mode0 = 'know', max = 8, fought, bots = [], sent } = {}) {
  const res = [];
  const battle = C11A_BATTLE[which];
  const win = which === 'beast' ? C11A.beast : C11A.pirate;
  gear([bot.s.char, ...(bot.fam || [])], which, which === 'beast' ? 119 : 120);
  for (const b of bots) gear([b.s.char], which, which === 'beast' ? 119 : 120);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    healAll([bot, ...bots]);
    const v0 = bot.msgs.length;
    const o = { fought, bots, sent, realMode: (fid) => (fid === battle ? mode : 'know') };
    await (k === 0 ? first(o) : again(o));
    assert.ok(fought.filter((f) => f === battle).length >= k + 1, `${battle} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.world.hasFlagFn(bot.s)(win);
    res.push(won ? 'win' : 'lose');
    if (!won && k === 0) { await tickN(bot.world, 40); await playReal(bot, R({ fought, bots, sent })); assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0), 'ノクトの ヒント'); }
    if (won) return res;
  }
  return res;
}

// ───── くぼ地 → 灯台 → 星見の丘 → 星の海 → とまり木の島 ─────
async function opening(bot, opts) {
  const c = bot.s.char;
  await warpTo(bot, 'c9a_crater', 12, 16, opts);
  await walk(bot, 12, 15, opts);
  assert.ok(c.flags[C11A.start] && said(bot, '星の船'), '場面 0');
  assert.equal(c.objective, C11A_OBJ.lens);
  assert.equal(storyPlace(c).label, '第3部 第3章 第1幕');
  // 灯台守 → レンズの 星座 → 星図
  const K = MAPS.sea.npcById.lh_keeper;
  await warpTo(bot, 'sea', K.x - 1, K.y, opts);
  bot.send({ t: 'interact', kind: 'npc', id: 'lh_keeper' });
  await playReal(bot, R(opts));
  assert.ok(c.flags[C11A_LENS]);
  await drawCon(bot, C11A_CON.con0, opts);
  assert.ok(c.flags[C11A.chart] && !c.flags[C11A_LENS] && c.keyItems.includes(STAR_CHART), '星図');
  // 星見の丘 → 星の海
  const H = HILL_SCENE11A;
  await warpTo(bot, 'overworld', H.x + 4, H.y + H.h, opts);
  await walk(bot, H.x + 4, H.y + H.h - 1, opts);
  assert.ok(c.flags[C11A.launch] && c.keyItems.includes(STAR_SHIP) && bot.s.map === C11A_MAP.sea, 'こぎ出した');
  // とまり木の島
  const P = ISLES11A.perch;
  await warpTo(bot, C11A_MAP.sea, P.sea.x, P.sea.y, opts);
  await walk(bot, P.pier.x, P.pier.y, opts);
  await walk(bot, PERCH_POS11A.arrive.x, PERCH_POS11A.arrive.y - 1, opts);
  assert.ok(c.flags[C11A.perch] && said(bot, 'ヨイ'));
  assert.ok(c.visited?.[C11A_PLACE], 'ルーラで とまり木の島へ 行ける');
  await openChests(bot, C11A_MAP.perch, opts);
}

test('通し（家族の 仲間 3人）: 第2章の クリアから → 灯台 → 星の海 → 島 3つ（けもの を 本当に）→ 船長（はじめ 完全オートで 負け → ヒント → 時計を投げる で 勝ち）→ c11_act1', async () => {
  const world = fixedWorld(11101);
  const { bot, c } = await player(world, 'ソラ', ['ミナ', 'リン', 'ガル']);
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  await opening(bot, opts);
  // 海と 島の 魔物（本当に 戦う。船の 上の 背景）
  await warpTo(bot, C11A_MAP.sea, 30, 62, opts);
  const t1 = await fieldFight(bot, opts);
  assert.equal(t1, 't11a_sea');
  // 島 1 → 島 3 → 島 2（すきな じゅん）。3つめの 島 2 で けもの
  for (const n of [1, 3]) { await isleDo(bot, n, opts); await openChests(bot, `c11a_isle${n}`, opts); }
  await warpTo(bot, 'c11a_isle1', 14, 19, opts);
  assert.equal(await fieldFight(bot, opts), 't11a_isle1');
  gear([c, ...bot.fam], 'beast', 119);
  healAll([bot]);
  const resB = await bossUntilWin(bot, 'beast', async (o) => isleDo(bot, 2, o), async (o) => beastAgain(bot, 2, o), { fought, sent });
  assert.equal(resB.at(-1), 'win', `けもの ${resB}`);
  assert.equal(fought.filter((f) => f === C11A_BATTLE.beast).length, resB.length, 'けものは 3つめの 島だけ');
  await openChests(bot, 'c11a_isle2', opts);
  assert.equal(c.objective, C11A_OBJ.gate);
  // 船長（はじめは 完全オート → 負け → ヒント → 知って いる 動き）
  const resP = await bossUntilWin(bot, 'pirate', async (o) => pirateGo(bot, o), async (o) => pirateGo(bot, o), { mode0: 'auto', fought, sent });
  assert.equal(resP[0], 'lose', '完全オートでは 勝てない');
  assert.equal(resP.at(-1), 'win', `船長 ${resP}`);
  assert.ok((sent.get(TOKEI_NAGE) || 0) > 0, `「時計を投げる」を 画面と 同じ 形で 送った（${sent.get(TOKEI_NAGE)}）`);
  assert.ok(c.flags[C11A.act1] && c.flags[C11A.pirate]);
  assert.ok(said(bot, '帰ってきた、のかな') && said(bot, '第1幕　クリア！'));
  assert.equal(c.objective, C11A_OBJ.act1);
  assert.equal(effectiveTile(MAPS.c11_sea, SEA_GATE11A.x, SEA_GATE11A.y, world.hasFlagFn(bot.s)), T.C11A_GATE_OPEN, '門が 開いた');
  assert.ok(storyPlace(c).cleared);
  // 星座の しるし 7つ・明かり 3つ・宝箱 8こ（B班の 品）・店
  for (const f of [...C11A_CON_IDS, ...C11A_LIGHTS]) assert.ok(c.flags[f], f);
  for (const id of C11A_CHEST_IDS) assert.ok(c.chests[id], `宝箱 ${id}`);
  assert.deepEqual(SHOPS[SHOP11A.arms].items, C11A_PERCH_ARMS);
  console.log(`  けもの ${resB.join('→')}・船長 ${resP.join('→')}・時計を投げる ${sent.get(TOKEI_NAGE)}回・戦い ${fought.length}回`);
});

test('ひとり（仲間なし）: けもの・船長とも 勝つまで（知って いる 動き。時計を投げる）', async () => {
  const world = fixedWorld(11102);
  const { bot, c } = await player(world, 'ソラ');
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  await opening(bot, opts);
  for (const n of [3, 2]) await isleDo(bot, n, opts);
  const resB = await bossUntilWin(bot, 'beast', async (o) => isleDo(bot, 1, o), async (o) => beastAgain(bot, 1, o), { fought, sent, max: 10 });
  assert.equal(resB.at(-1), 'win', `けもの ${resB}`);
  const resP = await bossUntilWin(bot, 'pirate', async (o) => pirateGo(bot, o), async (o) => pirateGo(bot, o), { fought, sent, max: 12 });
  assert.equal(resP.at(-1), 'win', `船長 ${resP}`);
  assert.ok((sent.get(TOKEI_NAGE) || 0) > 0);
  assert.ok(c.flags[C11A.act1]);
  console.log(`  ひとり: けもの ${resB.join('→')}・船長 ${resP.join('→')}`);
});

test('家族 2人（＋仲間 2人）: べつべつの 島で 星座（明かりは リーダーの 物）→ 3つめの 島で 2人で けもの → 2人で 船長（2人とも 画面の 形で 時計を投げる）', async () => {
  const world = fixedWorld(11103);
  // 2人 ＋ 家族の 仲間 2人（B班の はかり方の「2人＋自動2人」）
  const A = await player(world, 'ソラ', ['リン', 'ガル']);
  const B = await player(world, 'ミナ');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  const fought = [], sent = new Map();
  const oA = { fought, sent, bots: [B.bot] }, oB = { fought, sent, bots: [A.bot] };
  await playReal(A.bot, oA);
  await opening(A.bot, oA);
  // A は 島 1・B は 島 2（パーティーで 分かれる）
  await isleDo(A.bot, 1, oA);
  await toIsle(B.bot, 2, oB);
  for (const id of C11A_ISLE_CONS[2]) await drawCon(B.bot, id, oB);
  assert.ok(A.c.flags.c11a_light1 && A.c.flags.c11a_light2, '明かりは リーダーの フラグ（B が ともした 島 2 も）');
  // 島 3 へ 2人で → けもの
  gear([A.c, B.c], 'beast', 119);
  await toIsle(A.bot, 3, oA);
  await warpTo(B.bot, 'c11a_isle3', ISLE_POS11A[3].arrive.x + 1, ISLE_POS11A[3].arrive.y, oB);
  const resB = await bossUntilWin(A.bot, 'beast', async (o) => { for (const id of C11A_ISLE_CONS[3]) await drawCon(A.bot, id, o); }, async (o) => {
    await warpTo(B.bot, 'c11a_isle3', ISLE_POS11A[3].light.x + 1, ISLE_POS11A[3].light.y + 4, oB);
    await beastAgain(A.bot, 3, o);
  }, { fought, sent, bots: [B.bot], max: 10 });
  assert.equal(resB.at(-1), 'win', `けもの ${resB}`);
  // 船長（2人）
  await warpTo(B.bot, C11A_MAP.sea, SEA_GATE_SCENE11A.x + 5, SEA_GATE_SCENE11A.y + SEA_GATE_SCENE11A.h + 1, oB);
  const humans0 = new Map();
  const resP = await bossUntilWin(A.bot, 'pirate', async (o) => pirateGo(A.bot, o), async (o) => {
    await warpTo(B.bot, C11A_MAP.sea, SEA_GATE_SCENE11A.x + 5, SEA_GATE_SCENE11A.y + SEA_GATE_SCENE11A.h + 1, oB);
    await pirateGo(A.bot, o);
  }, { fought, sent, bots: [B.bot], max: 10 });
  void humans0;
  assert.equal(resP.at(-1), 'win', `船長 ${resP}`);
  assert.ok((sent.get(TOKEI_NAGE) || 0) > 0);
  assert.ok(A.c.flags[C11A.act1]);
  assert.ok(said(B.bot, '帰ってきた、のかな'), 'なかまも おわりの 場面を 見た');
  console.log(`  2人: けもの ${resB.join('→')}・船長 ${resP.join('→')}`);
});

test('島の じゅん（6とおり）: どの じゅんでも 3つめの 島で けもの（本当に 戦う）・ほかの 島では 出ない', async () => {
  const orders = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]];
  for (const [k, ord] of orders.entries()) {
    const world = fixedWorld(11110 + k);
    const { bot, c } = await player(world, 'ソラ', ['ミナ', 'リン', 'ガル']);
    for (const f of UPTO(C11A.perch)) c.flags[f] = true;
    const fought = [], sent = new Map();
    const opts = { fought, sent };
    for (const n of ord.slice(0, 2)) {
      await isleDo(bot, n, opts);
      assert.ok(!fought.includes(C11A_BATTLE.beast), `${ord}: 島 ${n} では 出ない`);
    }
    gear([c, ...bot.fam], 'beast', 119);
    const n3 = ord[2];
    const res = await bossUntilWin(bot, 'beast', async (o) => isleDo(bot, n3, o), async (o) => beastAgain(bot, n3, o), { fought, sent });
    assert.equal(res.at(-1), 'win', `${ord}: ${res}`);
    assert.ok(c.flags[C11A.beast] && C11A_LIGHTS.every((f) => c.flags[f]));
    assert.equal(c.objective, C11A_OBJ.gate);
  }
  assert.equal(PART3_C11A_OPEN, false, '幕は まだ 閉じて いる（第2章 第4幕の あと メインが 開ける）');
});
