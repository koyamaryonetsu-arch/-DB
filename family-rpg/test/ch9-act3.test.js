// 第3部 第1章 第3幕「さかさのピラミッド」の 通し（第92回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第2幕を クリアした セーブから c9_act3 まで、決まった 戦いを 本当に 戦う
//   （家族 4人: 勇者・大賢者・ゴッドハンド・大神官。tools/sim-ch9.mjs の 装備。ボスは しくみを 知って いる 人の 動き … know）
// ・ナゾカケに はじめは 完全オートで いどむ（負ければ ノクトの ヒント →「もう一度いどむ」）→ 知って いる 動きで 勝つまで（何回か やり直して よい）
//   強さの 数字が 少し かわっても 通る ように、勝ち負けの 回数は きめない（さいごに 勝てば よい。5回まで）
// ・宝箱 11こ（中みは B班の data/items-c9c.js）・くぼ地の 武具屋に 品が 4つ ふえる
// ・家族 2人: 向きは 人ごと・いっしょに ナゾカケと 戦う
// ・回線が 切れた 時: さかさの まま 切れて つなぎなおす → 同じ 場所・同じ 向き・続きから
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { TILE_INFO } from '../public/js/shared/tiles.js';
import { C9C, C9C_MAP, C9C_BATTLE, C9C_CHEST_ALL, NOTE_MI } from '../public/js/shared/maps/c9c-flags.js';
import { UNDER_RAFT } from '../public/js/shared/maps/c9b-flags.js';
import { RIVER_POS, PYR_C_POS } from '../public/js/shared/maps/c9c-rows.js';
import { C9C_BUTTONS, CRATER_EVENT9C } from '../public/js/shared/maps/c9c.js';
import { isPadTile, isShaftTile } from '../public/js/shared/maps/c9c-flip.js';
import { act2ClearObjective, PART3_ACT3_OPEN } from '../public/js/shared/data/story-c9.js';
import { C9C_OBJ, C9C_SHOPS } from '../public/js/shared/data/story-c9c.js';
import { C9C_TREASURE, C9C_SHOP_ADD } from '../public/js/shared/data/items-c9c.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, talkTo, pathTo, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
function gear(chars, boss, lv) {
  const kit = ch9Party(boss, lv);
  chars.forEach((c, i) => { for (const k of COPY) c[k] = structuredClone(kit[i % kit.length][k]); });
}
const giveRaft = (c) => { c.keyItems = [...new Set([...(c.keyItems || []), UNDER_RAFT])]; };
async function family(seed, upto = 'c9_act2') {
  const world = fixedWorld(seed);
  const ids = [];
  for (const name of ['パパ', 'ミク', 'ユイ']) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
    ids.push(b.char.id);
    b.send({ t: 'quit' });
  }
  const { bot, c } = await addPlayer(world, 'ソラ', upto);
  giveRaft(c);
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'riddle', 100);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  return { world, bot, c, fam };
}
// 向きを 見て 歩く 道（台・ふきぬけ・流れ・出入り口・宝箱は よける。行き先だけ ふむ）
function flipPath(map, sx, sy, tx, ty, has) {
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
      const t = effectiveTile(map, nx, ny, has);
      if (!(nx === tx && ny === ty) && (isPadTile(t) || isShaftTile(t) || map.warpAt.has(k) || TILE_INFO[t]?.flow)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = flipPath(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) {
    await stepOn(bot, x, y, opts);
    if (bot.s.map !== map.id) return;
  }
}
async function ride(bot, x, y, opts) {
  const map = MAPS[bot.s.map];
  let cx = x, cy = y;
  await stepOn(bot, cx, cy, opts);
  for (let g = 0; g < 200; g++) {
    const has = bot.world.hasFlagFn(bot.s);
    const d = TILE_INFO[effectiveTile(map, cx, cy, has)]?.flow;
    if (!d || isBlocked(map, cx + d[0], cy + d[1], has)) break;
    cx += d[0]; cy += d[1];
    await stepOn(bot, cx, cy, opts);
  }
}
async function walkPlain(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const p = pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(p, `${map.id}: ${tx},${ty}`);
  for (const [x, y] of p) await stepOn(bot, x, y, opts);
}
async function openChestNear(bot, ch, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  // 川は 流れの 上も 歩く（サーバーは 流れを 知らない。画面では いかだで 流される 道）
  const pf = map.c9cRaft ? (m, sx, sy, x, y, h) => pathTo(m, sx, sy, x, y, h) : flipPath;
  const side = D4.map(([dx, dy]) => [ch.x + dx, ch.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && pf(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
  assert.ok(side, `${map.id}: 宝箱 ${ch.id} の となりへ`);
  if (map.c9cRaft) await walkPlain(bot, side[0], side[1], opts);
  else await go(bot, side[0], side[1], opts);
  await examine(bot, ch.x, ch.y, opts);
}
const flipped = (bot) => !!bot.s.char.c9cFlip;
// きまった 戦いに 勝つまで（はじめの 1回は mode0。そのあと 知って いる 動き。負けると ヒント → やり直しの 所 → enter で もう一度）
async function bossUntilWin(bot, id, enter, { mode0 = 'know', max = 5, fought = [], bots = [] } = {}) {
  const res = [];
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    for (const b of [bot, ...bots]) { fullHeal(b.s.char); for (const m of b.s.char.companions || []) void m; }
    const before = bot.battles.length;
    await enter({ fought, bots, real: (fid) => (fid === id ? mode : fid ? 'know' : null) });
    // 勝った か は フラグで 見る（戦いの けっかは 家族の 分も とどく ことが ある）
    const won = !!bot.s.char.flags[{ [C9C_BATTLE.riddle]: C9C.riddle, [C9C_BATTLE.trio2]: C9C.trio2 }[id]];
    res.push(won ? 'win' : bot.battles.length > before ? 'lose' : 'none');
    if (won) return res;
  }
  return res;
}

test('通し（本当の 戦い）: 船着き場 → 川下り → ピラミッド 1〜4階 → ナゾカケ（負ければ ヒント → もう一度）→ 歌 → ヒックリカエール2号 → 少年 → 星の音 → くぼ地（c9_act3）。宝箱 11こ', { timeout: 1200000 }, async () => {
  assert.equal(PART3_ACT3_OPEN, true, '幕は 開いた');
  const { world, bot, c } = await family(9291);
  assert.equal(c.objective, act2ClearObjective());
  assert.equal(c.objective, C9C_OBJ.start);
  const fought = [];
  const opts = { fought };
  // 1 船着き場 → 題の 画面 → 地下の川
  await talkTo(bot, 'c9b_under', 'c9b_folk6', 0, opts);
  assert.ok(c.flags[C9C.raftGo] && bot.s.map === C9C_MAP.river);
  // 2 川下り（わき道 3つの 宝箱）→ 3 岸
  const R = MAPS.c9c_river;
  for (const ch of R.chests) await openChestNear(bot, ch, { ...opts, real: () => 'auto' });
  await walkPlain(bot, RIVER_POS.shoreScene.x, RIVER_POS.shoreScene.y + 2, { ...opts, real: () => 'auto' });
  assert.ok(c.flags[C9C.river]);
  await walkPlain(bot, RIVER_POS.gate.x, RIVER_POS.gate.y, opts);
  assert.equal(bot.s.map, C9C_MAP.p1);
  // 4 1階（宝箱）→ 台 → ふきぬけ
  const real = { ...opts, real: (id) => (id ? 'know' : 'auto') };
  for (const ch of MAPS.c9c_p1.chests) await openChestNear(bot, ch, real);
  await go(bot, 2, 8, real);
  assert.ok(flipped(bot));
  await go(bot, 7, 7, real);
  assert.equal(bot.s.map, C9C_MAP.p2);
  // 2階: 宝箱（ゆか 2・天じょう 1）と 台 3回
  const P2 = MAPS.c9c_p2;
  const q = (id) => P2.chests.find((x) => x.id === id);
  await go(bot, 1, 20, real); // A の へや（ふつう）
  await openChestNear(bot, P2.chests.find((x) => x.x === 1 && x.y === 21), real);
  await go(bot, 1, 16, real);
  assert.ok(flipped(bot));
  await openChestNear(bot, P2.chests.find((x) => x.c9cSide === 'ceil'), real);
  await go(bot, 21, 21, real);
  assert.ok(!flipped(bot));
  await openChestNear(bot, P2.chests.find((x) => x.x === 16 && x.y === 7), real);
  await go(bot, 21, 1, real);
  assert.ok(flipped(bot));
  void q;
  // 5 ナゾカケ（はじめは 完全オート）
  const v0 = bot.msgs.length;
  const enterRiddle = async (o) => {
    if (bot.s.map !== C9C_MAP.p2) await place(bot, C9C_MAP.p2, 21, 1, 'down', o);
    const inD = () => Math.floor(bot.s.y) <= 3 && Math.floor(bot.s.x) <= 13 && Math.floor(bot.s.x) >= 7;
    if (inD()) {
      // やり直しの 所が へやの 中: 1歩 出て 入りなおす（さかさなら 東の あなへ・ふつうなら 台で さかさに）
      if (!flipped(bot)) await go(bot, 7, 3, o);
      await go(bot, 15, 2, o);
    } else if (!flipped(bot)) {
      // やり直しの 所は C の へやの 台の 上（ふつう）: 1歩 おりて また ふむ
      await go(bot, 20, 1, o);
      await go(bot, 21, 1, o);
    }
    await go(bot, 12, 2, o);
  };
  const r1 = await bossUntilWin(bot, C9C_BATTLE.riddle, enterRiddle, { mode0: 'auto', fought });
  assert.equal(r1.at(-1), 'win', `ナゾカケに 勝つ（${r1.join(',')}）`);
  console.log('# riddle tries', r1.join(','));
  if (r1[0] === 'lose') {
    assert.ok(said(bot, BOSS_HINTS.c9c_riddle[0].slice(0, 8), v0), 'ノクトの ヒント');
  }
  assert.ok(c.flags[C9C.riddle]);
  assert.ok(said(bot, 'さかさの歌が、とびらを開く'));
  // さかさで ちか道 → さく → ふきぬけ
  if (!flipped(bot)) await go(bot, 7, 3, real);
  await go(bot, 11, 10, real);
  assert.equal(bot.s.map, C9C_MAP.p3);
  // 6 3階（1回め）: 北の へやへ 流される → ゆかの 宝箱・石の 板 → 台で さかさ → 逆の 流れで まん中 → ふきぬけ
  const P3 = MAPS.c9c_p3;
  const chest3 = (x, y) => P3.chests.find((ch) => ch.x === x && ch.y === y);
  await go(bot, 13, 9, real);
  await ride(bot, 13, 8, real);
  await openChestNear(bot, chest3(17, 1), real);
  await examine(bot, 13, 1, real);
  assert.ok(said(bot, '歌も、さかさに'));
  await go(bot, 9, 1, real);
  assert.ok(flipped(bot));
  await go(bot, 13, 5, real);
  await ride(bot, 13, 6, real);
  await go(bot, 13, 12, real);
  assert.equal(bot.s.map, C9C_MAP.p4);
  // 7 4階: 宝箱。ボタンを まちがえると 3階の まん中へ（のこりの 宝箱を 取りに 行く）
  await openChestNear(bot, MAPS.c9c_p4.chests[0], real);
  const press = async (key) => {
    const a = MAPS.c9c_p4.actions.find((x) => x.script === `c9c_btn_${key}`);
    await go(bot, a.x, a.y + 1, real);
    await examine(bot, a.x, a.y, real);
  };
  await press('sun');
  assert.equal(bot.s.map, C9C_MAP.p3, 'まちがえると 3階へ');
  assert.ok(!flipped(bot));
  // 3階（2回め）: 東の へや（ゆかの 宝箱）→ 台 → 西へ 流されて まん中 → 上へ
  await ride(bot, 18, 13, real);
  await openChestNear(bot, chest3(25, 17), real);
  await go(bot, 25, 9, real);
  assert.ok(flipped(bot));
  await go(bot, 22, 13, real);
  await ride(bot, 21, 13, real);
  await go(bot, 13, 12, real);
  assert.equal(bot.s.map, C9C_MAP.p4);
  await press('sun');
  assert.equal(bot.s.map, C9C_MAP.p3);
  // 3階（3回め）: 西の へや → 台で さかさ → 天じょうの 宝箱 → 東へ 流されて まん中 → 上へ
  await ride(bot, 8, 13, real);
  await go(bot, 1, 9, real);
  assert.ok(flipped(bot));
  await openChestNear(bot, P3.chests.find((ch) => ch.c9cSide === 'ceil'), real);
  await go(bot, 4, 13, real);
  await ride(bot, 5, 13, real);
  await go(bot, 13, 12, real);
  assert.equal(bot.s.map, C9C_MAP.p4);
  for (const k of ['star', 'moon', 'sand', 'sun']) await press(k);
  assert.ok(c.flags[C9C.song]);
  assert.ok(C9C_BUTTONS.every((b) => !c.flags[b.flag]));
  // 8 音の 間: ヒックリカエール2号（知って いる 動き。勝つまで）
  const enterRoom = async (o) => {
    if (bot.s.map !== C9C_MAP.p4) await place(bot, C9C_MAP.p4, 15, 16, 'down', o);
    if (Math.floor(bot.s.y) >= 19) await go(bot, 15, 17, o);
    await go(bot, 15, 20, o);
  };
  const r2 = await bossUntilWin(bot, C9C_BATTLE.trio2, enterRoom, { fought });
  assert.equal(r2.at(-1), 'win', `ヒックリカエール2号に 勝つ（${r2.join(',')}）`);
  console.log('# trio2 tries', r2.join(','));
  for (const [f, t] of [[C9C.trio2, 'ア、アルゴルさま'], [C9C.note1, 'のこりの音は、ぼくがもらう']]) {
    assert.ok(c.flags[f], f);
    assert.ok(said(bot, t), t);
  }
  assert.ok(c.keyItems.includes(NOTE_MI));
  // 11 地下の 階段 → 第4章の ピラミッド → 12 くぼ地
  await go(bot, PYR_C_POS.c9c_p4.stairs.x, PYR_C_POS.c9c_p4.stairs.y, real);
  assert.equal(bot.s.map, 'pyramid_b1');
  await place(bot, 'c9a_crater', 12, 15, 'up', real);
  await stepOn(bot, 12, CRATER_EVENT9C.y + 1, real);
  assert.ok(c.flags[C9C.act3]);
  assert.equal(c.objective, C9C_OBJ.act3);
  assert.ok(storyPlace(c).cleared);
  // くぼ地の 武具屋に 4つ ふえる
  const shop = SHOPS[C9C_SHOPS.crater];
  assert.ok(C9C_SHOP_ADD.length === 4 && C9C_SHOP_ADD.every((id) => shop.items.includes(id)));
  assert.ok(JSON.stringify(SCRIPTS_ARMORER(c)).includes(C9C_SHOPS.crater));
  // 宝箱 11こ 全部・中みは B班の 表
  const got = C9C_CHEST_ALL.filter((id) => c.chests[id]);
  assert.deepEqual(got, [...C9C_CHEST_ALL], '宝箱 11こ');
  for (const id of got) {
    const [it] = C9C_TREASURE[id];
    assert.ok(itemCount(c, it) >= 1 || c.equip && Object.values(c.equip).includes(it), `${id} → ${it}`);
  }
  assert.ok(fought.includes(C9C_BATTLE.riddle) && fought.includes(C9C_BATTLE.trio2));
});
let SCRIPTS_ARMORER = () => [];
const { SCRIPTS } = await import('../public/js/shared/data/story.js');
SCRIPTS_ARMORER = (c) => SCRIPTS.c9b_armorer({ flag: (f) => !!c.flags[f], has: () => false });

test('家族 2人: 向きは 人ごと（台を ふんだ 人だけ）・いっしょに ナゾカケと 戦って 勝つ・天じょうの 宝箱は さかさの 人が 取る', { timeout: 900000 }, async () => {
  // ソラ（リーダー）・ミク（もう 1人の 家族）・パーティーに 入れた 家族の キャラ 2人
  const world = fixedWorld(9292);
  const ids = [];
  for (const name of ['パパ', 'ユイ']) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
    ids.push(b.char.id);
    b.send({ t: 'quit' });
  }
  const A = await addPlayer(world, 'ソラ', 'c9_p2');
  const B = await addPlayer(world, 'ミク', 'c9_p2');
  const fam = ids.map((id) => world.data.characters[id]);
  gear([A.c, fam[0], fam[1], B.c], 'riddle', 100);
  for (const id of ids) assert.ok(companionJoin(world, A.bot.s, `fam:${id}`).ok);
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  const o = (other) => ({ bots: [other], real: (id) => (id ? 'know' : 'auto') });
  await place(A.bot, C9C_MAP.p3, 1, 16, 'up', o(B.bot));
  await place(B.bot, C9C_MAP.p3, 2, 16, 'up', o(A.bot));
  // 西の へや: ミクだけ 台で さかさ → 天じょうの 宝箱は ミクが 取れる・ソラは 取れない
  await go(B.bot, 1, 9, o(A.bot));
  assert.ok(flipped(B.bot) && !flipped(A.bot), '向きは 人ごと');
  const ceil = MAPS.c9c_p3.chests.find((x) => x.c9cSide === 'ceil');
  await examine(A.bot, ceil.x, ceil.y, o(B.bot));
  assert.ok(said(A.bot, '手が、とどかない'));
  await go(B.bot, ceil.x, ceil.y - 1, o(A.bot));
  await examine(B.bot, ceil.x, ceil.y, o(A.bot));
  assert.ok(B.c.chests[ceil.id] || A.c.chests[ceil.id], 'さかさの ミクが 取った');
  await tickN(world, 4);
  const snap = A.bot.msgs.filter((m) => m.t === 'snap' && m.map === C9C_MAP.p3).pop();
  assert.equal(snap.players.find((p) => p.sid === B.bot.s.id)?.fp, 1, 'ちがう 向きの 家族（画面で うすく）');
  // いっしょに ナゾカケ（2階の 番人の へやの 前に ふたり）
  for (const P of [A, B]) { P.c.c9cFlip = 1; }
  world.placeSession(A.bot.s, C9C_MAP.p2, 15.5, 2.5, 'left', true);
  world.placeSession(B.bot.s, C9C_MAP.p2, 14.5, 2.5, 'left', true);
  A.c.c9cFlip = 1; B.c.c9cFlip = 1;
  await play(A.bot, o(B.bot));
  const res = [];
  for (let k = 0; k < 5 && !A.c.flags[C9C.riddle]; k++) {
    fullHeal(A.c); fullHeal(B.c);
    if (A.bot.s.map !== C9C_MAP.p2 || Math.floor(A.bot.s.y) <= 3) { world.placeSession(A.bot.s, C9C_MAP.p2, 15.5, 2.5, 'left', true); world.placeSession(B.bot.s, C9C_MAP.p2, 14.5, 2.5, 'left', true); A.c.c9cFlip = 1; B.c.c9cFlip = 1; await play(A.bot, o(B.bot)); }
    const n0 = A.bot.battles.length;
    await go(A.bot, 13, 2, o(B.bot));
    res.push(A.bot.battles.slice(n0)[0]?.outcome);
  }
  assert.ok(A.c.flags[C9C.riddle], `ふたりで ナゾカケに 勝つ（${res.join(',')}）`);
  assert.ok(B.bot.battles.length >= 1, 'ミクも 戦った');
});

test('回線が 切れた 時: さかさの まま 切れて つなぎなおす → 同じ 場所・同じ 向き → そのまま ふきぬけで 上へ', { timeout: 300000 }, async () => {
  const world = fixedWorld(9293, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c9_riddle');
  const B = await addPlayer(world, 'ミク', 'c9_riddle');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  await place(A.bot, C9C_MAP.p2, 8, 3, 'up', { bots: [B.bot] });
  await go(A.bot, 7, 3, { bots: [B.bot] }); // 番人の へやの 台 → さかさ
  assert.ok(flipped(A.bot));
  await go(A.bot, 11, 6, { bots: [B.bot] }); // ちか道の あなの 上
  const where = [A.bot.s.map, Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)];
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  assert.ok(A2.resumed);
  assert.deepEqual([A2.s.map, Math.floor(A2.s.x), Math.floor(A2.s.y)], where, '同じ 場所');
  assert.ok(A2.s.char.c9cFlip && A2.char.c9cFlip, '同じ 向き（画面にも）');
  await go(A2, 11, 10, { bots: [B.bot] });
  assert.equal(A2.s.map, C9C_MAP.p3, 'そのまま 上の 階へ');
  assert.ok(A.c.flags[C9C.p3]);
});
