// 第3部 第1章 第1幕「星ふるえの夜」の 通し（第90回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第2部を クリアした セーブから c9_act1 まで、2つの 決まった 戦いを 本当に 戦う
//   （家族 4人: 勇者・大賢者・ゴッドハンド・大神官。しくみを 知って いる 人の 動き … tools/sim-ch9.mjs の know。たねは 決まって いる）
// ・負けると ノクトの ヒント →「もう一度いどむ」で 手前から やり直す（はじめの 3人組は 完全オートで 戦って 負ける）
// ・宝箱 13こ（中みは B班の data/items-c9a.js）が 取れる
// ・家族 2人: 同じ 光を 見る・ためしの とちゅうから 入れる（第89回 の きまり）・回線が 切れても 続きから
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand } from '../public/js/shared/maps/index.js';
import { C9A, C9A_MAP, C9A_PREP, C9A_FORK_RING, C9A_SECRETS, C9A_CHEST_IDS, STAR_FORK, c9aShard, c9aSeen } from '../public/js/shared/maps/c9a-flags.js';
import { cavePos, caveEntry, STAIRS9A } from '../public/js/shared/maps/c9a-cave.js';
import { FOREST_POS9A } from '../public/js/shared/maps/c9a-forest.js';
import { LAMPS9A } from '../public/js/shared/maps/c9a-field.js';
import { CRATER_POS, B4_TRIAL } from '../public/js/shared/maps/c9a-rows.js';
import { lightFor, c9aSnap } from '../public/js/shared/world/c9a-steps.js';
import { C9_OBJ, act1ClearObjective } from '../public/js/shared/data/story-c9.js';
import { C9A_OBJ } from '../public/js/shared/data/story-c9a.js';
import { C9A_TREASURE } from '../public/js/shared/data/items-c9a.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { itemCount } from '../public/js/shared/stats.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, UPTO, said, play, place, stepOn, examine, touch, talkTo, walkTo, pathTo, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
// 家族の キャラを 超級職 4人に（その ころの ★装備。boss … 'trio' | 'trial'）
function gear(chars, boss, lv) {
  const kit = ch9Party(boss, lv);
  chars.forEach((c, i) => { for (const k of COPY) c[k] = structuredClone(kit[i][k]); });
}
// 家族 4人（ソラ が 遊ぶ。ほかの 3人は ソラの パーティーに 入って いる 家族の キャラ）
async function family(seed) {
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
  const { bot, c } = await addPlayer(world, 'ソラ', 'c8_solitus');
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'trio', 96);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  return { world, bot, c, fam };
}
// 家族の キャラの うつしを 作りなおす（装備を かえた あと）
function refreshFam(world, bot) {
  const p = world.parties.get(bot.s.partyId);
  if (p?.famCopies) p.famCopies.clear();
  if (p) p.supports = [];
  const keys = [...bot.s.char.partyKeys];
  bot.s.char.partyKeys = [];
  for (const k of keys) assert.ok(companionJoin(world, bot.s, k).ok);
}
const KNOW = (id) => (id === 'c9a_trio' || id === 'c9a_trial' ? 'know' : null);
// 宝箱の となりへ 歩いて 開ける
async function openChest(bot, ch) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [ch.x + dx, ch.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
  assert.ok(side, `${map.id}: 宝箱 ${ch.id} の となりへ 歩ける`);
  await walkTo(bot, side[0], side[1]);
  await examine(bot, ch.x, ch.y);
  assert.ok(bot.s.char.chests[ch.id], ch.id);
}
const chestOf = (mapId, id) => MAPS[mapId].chests.find((x) => x.id === id);

test('通し（本当の 戦い）: 第2部 クリア → 星祭り → 森 → 3人組（負けて ヒント → もう一度）→ 地下道 4階 → ためし → 星の音さ → 職人。宝箱 13こ', { timeout: 900000 }, async () => {
  const { world, bot, c, fam } = await family(9001);
  assert.equal(c.objective, C9_OBJ.start, '第2部 クリアの 目標は 星祭り（PART3_OPEN）');
  const fought = [];
  // 1〜3 朝・したく・夜（くわしくは ch9-act1-a）
  await place(bot, 'overworld', 27, 88, 'down');
  await stepOn(bot, 27, 89);
  await stepOn(bot, 27, 90);
  assert.ok(c.flags[C9A.festival]);
  await talkTo(bot, 'overworld', 'elder');
  for (let i = 0; i < 3; i++) await talkTo(bot, 'overworld', `c9a_kid${i + 1}`, [0, 1, 0][i]);
  for (const p of LAMPS9A) await touch(bot, p);
  for (let i = 0; i < 3; i++) await talkTo(bot, 'overworld', `c9a_flower${i + 1}`);
  assert.ok(Object.values(C9A_PREP).every((f) => c.flags[f]));
  await talkTo(bot, 'overworld', 'elder');
  assert.ok(c.flags[C9A.starfall]);
  // 4 森（宝箱 2こ）
  await talkTo(bot, 'overworld', 'c9a_signpost', 0);
  assert.equal(bot.s.map, C9A_MAP.forest);
  await stepOn(bot, FOREST_POS9A.arrive.x, FOREST_POS9A.arrive.y - 1);
  await touch(bot, FOREST_POS9A.shards[0]);
  assert.ok(c.flags[c9aShard(1)]);
  for (const id of C9A_CHEST_IDS.forest) await openChest(bot, chestOf(C9A_MAP.forest, id));
  await walkTo(bot, FOREST_POS9A.north.x, FOREST_POS9A.north.y);
  assert.equal(bot.s.map, C9A_MAP.crater);
  // 5・6 星の子 → 3人組。はじめは 完全オートで 負ける（しくみを 知らないと 勝てない）
  const C = CRATER_POS;
  const v0 = bot.msgs.length;
  await walkTo(bot, C.scene.x + 2, C.scene.y + 1, { fought, real: (id) => (id === 'c9a_trio' ? 'auto' : null) });
  assert.deepEqual(fought, ['c9a_trio']);
  assert.ok(c.flags[C9A.child] && !c.flags[C9A.trio], '負けた: 星の子とは 会えた・3人組は まだ');
  assert.equal(bot.battles.at(-1)?.outcome, 'lose');
  assert.equal(c.bossLoss?.c9a_trio, 1);
  // ノクトの ヒント →「もう一度いどむ」（えらぶ 0）→ くぼ地の 手前
  assert.ok(said(bot, 'ノクト', v0));
  assert.ok(said(bot, BOSS_HINTS.c9a_trio[0].slice(0, 8), v0), 'ヒントの 1つめ');
  assert.equal(bot.s.map, C9A_MAP.crater, 'くぼ地の 手前へ');
  assert.ok(Math.floor(bot.s.y) > C.scene.y + C.scene.h - 1);
  // もう一度（しくみを 知って 戦う）
  const v1 = bot.msgs.length;
  await walkTo(bot, C.scene.x + 2, C.scene.y + 1, { fought, real: KNOW });
  assert.deepEqual(fought, ['c9a_trio', 'c9a_trio']);
  assert.equal(bot.battles.at(-1)?.outcome, 'win', '本当の 戦いで 3人組に 勝つ');
  assert.ok(c.flags[C9A.trio] && !c.bossLoss?.c9a_trio);
  assert.ok(!said(bot, '光る子ども', v1), 'もう一度の 時は 星の子の 場面を とばす');
  assert.ok(itemCount(c, 'c9b_trio_badge') >= 1, 'B班の ボスの 品');
  // 7 守り星の石 → 階段 → 地下1階（ここからは ためしの ころの ★装備）
  gear([c, ...fam], 'trial', 98);
  refreshFam(world, bot);
  await talkTo(bot, 'overworld', 'star_stone');
  assert.ok(c.flags[C9A.stairs]);
  await place(bot, 'overworld', STAIRS9A.x, STAIRS9A.y + 1);
  await stepOn(bot, STAIRS9A.x, STAIRS9A.y);
  assert.equal(bot.s.map, 'c9a_b1');
  // 8 地下1階〜3階: こけを つなぐ → とびら → 宝箱
  await walkTo(bot, caveEntry(1).x - 0.5, caveEntry(1).y - 0.5);
  for (const m of cavePos(1).moss) await walkTo(bot, m.x, m.y);
  assert.ok(c.flags[C9A.b1]);
  for (const id of C9A_CHEST_IDS.b1) await openChest(bot, chestOf('c9a_b1', id));
  await walkTo(bot, cavePos(1).down.x, cavePos(1).down.y);
  assert.equal(bot.s.map, 'c9a_b2');
  const m2 = cavePos(2).moss.slice().sort((a, b) => a.x - b.x);
  for (const m of m2) await walkTo(bot, m.x, m.y);
  assert.ok(c.flags[C9A.b2]);
  for (const id of C9A_CHEST_IDS.b2) await openChest(bot, chestOf('c9a_b2', id));
  await walkTo(bot, cavePos(2).down.x, cavePos(2).down.y);
  assert.equal(bot.s.map, 'c9a_b3');
  const b3walk = [[11, 12], [11, 11], [11, 10], [11, 9], ...Array.from({ length: 8 }, (_, i) => [10 - i, 9]), [3, 8], [3, 7], [3, 6], [3, 5],
    ...Array.from({ length: 4 }, (_, i) => [3, 6 + i]), ...Array.from({ length: 16 }, (_, i) => [4 + i, 9]), [19, 8], [19, 7], [19, 6], [19, 5]];
  for (const [x, y] of b3walk) await walkTo(bot, x, y);
  assert.ok(c.flags[C9A.b3]);
  for (const id of C9A_CHEST_IDS.b3) await openChest(bot, chestOf('c9a_b3', id));
  await walkTo(bot, cavePos(3).down.x, cavePos(3).down.y);
  assert.equal(bot.s.map, 'c9a_b4');
  await walkTo(bot, caveEntry(4).x - 0.5, caveEntry(4).y - 1.5);
  for (const id of C9A_CHEST_IDS.b4) await openChest(bot, chestOf('c9a_b4', id));
  // 9 ともしびの ためし（本当の 戦い）
  await walkTo(bot, B4_TRIAL.x + 1, B4_TRIAL.y, { fought, real: KNOW });
  assert.deepEqual(fought.slice(-1), ['c9a_trial']);
  assert.equal(bot.battles.at(-1)?.outcome, 'win', '本当の 戦いで ためしに 勝つ');
  assert.ok(c.flags[C9A.trial]);
  // 10 星の音さ
  const Pd = cavePos(4).pedestal;
  await walkTo(bot, Pd.x, Pd.y + 1);
  await examine(bot, Pd.x, Pd.y);
  assert.ok(c.keyItems.includes(STAR_FORK) && c.flags[C9A.fork]);
  // 11 くぼ地の 職人 → 幕の おわり・音さの れんしゅうの 宝箱
  await place(bot, C9A_MAP.crater, C.enter.x, C.enter.y);
  await stepOn(bot, C.craft.x + 4, C.craft.y + 1);
  assert.ok(c.flags[C9A.act1]);
  assert.equal(c.objective, act1ClearObjective()); // 第91回: 第2幕が 開いた
  assert.ok(storyPlace(c).cleared);
  await touch(bot, C.rock, 0);
  assert.ok(c.flags[C9A_FORK_RING]);
  await openChest(bot, chestOf(C9A_MAP.crater, C9A_CHEST_IDS.fork));
  // ひみつの 部屋（先生・炎術士の 流れが いる 時）の 宝箱 2こ: とびらを 開けた 世界で
  for (const [k, n] of [[0, 2], [1, 3]]) {
    c.flags[C9A_SECRETS[k]] = true;
    const map = `c9a_b${n}`;
    await place(bot, map, caveEntry(n).x - 0.5, caveEntry(n).y - 0.5);
    await openChest(bot, chestOf(map, C9A_CHEST_IDS.secret[k]));
  }
  // 13こ 全部 開けた・中みは B班の 表
  const ids = Object.keys(C9A_TREASURE);
  assert.equal(ids.length, 13);
  for (const id of ids) assert.ok(c.chests[id], `宝箱 ${id}`);
  const want = {};
  for (const [it, n] of Object.values(C9A_TREASURE)) want[it] = (want[it] || 0) + n;
  for (const [it, n] of Object.entries(want)) assert.ok(itemCount(c, it) >= n, `${it} × ${n}`);
  // 戦いの 数（3人組 2回・ためし 1回）
  assert.deepEqual(fought, ['c9a_trio', 'c9a_trio', 'c9a_trial']);
});

test('家族 2人: 同じ 光・ためしの とちゅうから 入れる（そばに 行く・「戦いに入る」ボタン）・いっしょに 勝つ', { timeout: 600000 }, async () => {
  const world = fixedWorld(9010);
  const A = await addPlayer(world, 'ソラ', 'c9_b3');
  const B = await addPlayer(world, 'ミク', 'c9_b3');
  const P = await addPlayer(world, 'パパ', 'c9_b3');
  const Y = await addPlayer(world, 'ユイ', 'c9_b3');
  // ソラ（勇者）・ミク（大賢者）は 人。パパ（ゴッドハンド）・ユイ（大神官）は ソラの パーティーに 入れた 家族の キャラ
  gear([A.c, B.c, P.c, Y.c], 'trial', 98);
  for (const F of [P, Y]) {
    F.bot.send({ t: 'quit' });
    assert.ok(companionJoin(world, A.bot.s, `fam:${F.c.id}`).ok);
  }
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  assert.equal(A.bot.s.partyId, B.bot.s.partyId);
  // 地下1階で 同じ 光（ミクが ふむと ソラにも 見える）
  const mo = cavePos(1).moss.slice().sort((a, b) => a.x - b.x);
  world.placeSession(A.bot.s, 'c9a_b1', mo[1].x + 0.5, mo[1].y + 1.5, 'up', true);
  await place(B.bot, 'c9a_b1', mo[0].x, mo[0].y + 1, 'up', { bots: [A.bot] });
  await stepOn(B.bot, mo[0].x, mo[0].y, { bots: [A.bot] });
  assert.equal(lightFor(world, A.bot.s), lightFor(world, B.bot.s));
  assert.deepEqual(c9aSnap(world, A.bot.s), c9aSnap(world, B.bot.s));
  assert.equal(c9aSnap(world, A.bot.s).lit.length, 1);
  // ためし: ソラが 先に 始める（ミクは 遠い 地下1階）
  world.placeSession(A.bot.s, 'c9a_b4', B4_TRIAL.x + 1.5, B4_TRIAL.y + 2.5, 'up', true);
  const fought = [];
  let joined = null;
  // 戦いが 始まって 少し たったら ミクが「戦いに入る」ボタン（どこからでも 入れる 物語の 戦い）
  const onTick = async () => {
    if (joined || A.bot.s.busy !== 'battle') return;
    const ctx = world.battles.get(A.bot.s.battleId);
    if (!ctx || ctx.battle.over || (ctx.t0 = ctx.t0 ?? 0, ++ctx.t0) < 200) return;
    // そばに いない 時は ことわられる（物語の 戦いは ボタンで 入れると 教える）
    B.bot.send({ t: 'joinBattle', sid: A.bot.s.id });
    assert.equal(ctx.sids.includes(B.bot.s.id), false);
    B.bot.send({ t: 'joinBattle', sid: A.bot.s.id, remote: true });
    joined = ctx.sids.includes(B.bot.s.id);
  };
  await stepOn(A.bot, B4_TRIAL.x + 1, B4_TRIAL.y + 1, { fought, real: KNOW, bots: [B.bot], onTick });
  await walkTo(A.bot, B4_TRIAL.x + 1, B4_TRIAL.y, { fought, real: KNOW, bots: [B.bot], onTick });
  assert.ok(joined, 'ミクが とちゅうから 入った');
  assert.deepEqual(fought, ['c9a_trial']);
  assert.equal(A.bot.battles.at(-1)?.outcome, 'win');
  assert.equal(B.bot.battles.at(-1)?.outcome, 'win', 'ミクも いっしょに 勝った');
  assert.ok(A.c.flags[C9A.trial]);
  assert.equal(B.bot.s.map, 'c9a_b1', 'ボタンで 入った 人は 戦いの あと もとの 所へ');
});

test('回線が 切れた 時の つづき: 地下2階の とちゅうで 切れて つなぎなおす → 同じ 場所・同じ フラグ・同じ 光・星の子も うしろに', { timeout: 300000 }, async () => {
  // 切れても しばらく 待つ 世界（offline で ない。合言葉は なんでも よい）
  const world = fixedWorld(9020, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c9_b1', [c9aSeen(1)]);
  const B = await addPlayer(world, 'ミク', 'c9_b1');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  const m2 = cavePos(2).moss.slice().sort((a, b) => a.x - b.x);
  await place(A.bot, 'c9a_b2', caveEntry(2).x - 0.5, caveEntry(2).y - 0.5, 'up', { bots: [B.bot] });
  await walkTo(A.bot, m2[0].x, m2[0].y, { bots: [B.bot] });
  const lit0 = lightFor(world, A.bot.s).lit.size;
  assert.ok(lit0 >= 1);
  const where = [A.bot.s.map, Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)];
  // 切れる（ミクは のこる）→ つなぎなおす
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  assert.ok(A2.resumed, 'つづきから');
  assert.deepEqual([A2.s.map, Math.floor(A2.s.x), Math.floor(A2.s.y)], where);
  assert.equal(lightFor(world, A2.s).lit.size, lit0, '光は のこる');
  assert.ok(A2.s.char.flags[C9A.child] && A2.s.char.flags[C9A.b1]);
  assert.ok(world.followerLooks(A2.s).some((f) => f.spica), '星の子も うしろに');
  // そのまま 地下2階の とびらを 開ける
  for (const m of m2.slice(1)) await walkTo(A2, m.x, m.y, { bots: [B.bot] });
  assert.ok(A2.s.char.flags[C9A.b2]);
  assert.equal(A2.s.char.objective, C9A_OBJ.c9_b2);
});
