// 第75回: 宝の地図が いっぱいの ときは、今 持っている 地図を 捨てるか 選ばせる
// （家族の 声:「宝の地図が一杯の時は、今持っている地図を捨てるか選ばせて。」）
//   いっぱい → 新しい 地図は「あずかり」（c.tmPending。セーブに のこる）→ 画面で 1まい 捨てて もらう／あきらめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, condOk } from '../public/js/shared/maps/index.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import {
  caveInfo, floorMapId, clearedFlag, foundFlag, tmTitle, repairTreasureMaps, TM_MAX, TM_PEND_MAX,
} from '../public/js/shared/data/treasure.js';
import { grantTreasureMap, treasureAfterBattle, isPendingMap, normalizeTreasure } from '../public/js/shared/world/treasure.js';
import { tmPlaceShort } from '../public/js/shared/data/treasure-hint.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

function strong(c, level = 60) {
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
}

async function hero(seed = 7, name = 'ソラ', opts = {}) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, ...opts });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) c.flags[f] = true;
  return { world, bot, c };
}

// 地図を いっぱいに（cleared … 主を たおした ことに する）
function fill(world, c, { cleared = false } = {}) {
  while ((c.treasureMaps || []).length < TM_MAX) {
    const t = grantTreasureMap(world, c, { lv: 1 });
    if (cleared) { t.cleared = true; t.found = true; c.flags[clearedFlag(t.seed)] = true; c.flags[foundFlag(t.seed)] = true; }
  }
}
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const said = (bot, re) => bot.msgs.some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'say' && re.test(s[2] || '')));

test('第75回: いっぱい → あずかり → 1まい 捨てて 新しい 地図を 持つ', async () => {
  const { world, bot, c } = await hero(31);
  fill(world, c);
  const ids0 = c.treasureMaps.map((t) => t.id);
  // 主を たおした 地図が あっても、だまって 入れかえない
  c.treasureMaps[0].cleared = true;
  const nw = grantTreasureMap(world, c, { lv: 4 });
  assert.ok(nw, '新しい 地図');
  assert.ok(isPendingMap(c, nw), 'あずかりに 入った');
  assert.deepEqual(c.treasureMaps.map((t) => t.id), ids0, '持っている 地図は そのまま');
  assert.equal(c.tmPending.length, 1);
  assert.ok(!c.tmPending.some((t) => ids0.includes(t.id)), 'おなじ 地図は できない');
  // 画面に とどく（キャラの 中み）
  bot.send({ t: 'menu', action: 'tmap', op: 'noop', id: 'x' });
  assert.equal(bot.char.tmPending?.[0]?.id, nw.id, '画面にも あずかりの 地図');
  // 捨てる 地図の 宝箱・フラグも わすれる
  const drop = c.treasureMaps[3];
  c.chests[`tm_${drop.id}_1_0`] = true;
  bot.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid: nw.id, id: drop.id });
  const res = lastRes(bot);
  assert.ok(res.ok, res.text);
  assert.match(res.text, /を捨てて、\n.*を手に入れた！/);
  assert.equal(c.treasureMaps.length, TM_MAX);
  assert.ok(!c.treasureMaps.some((t) => t.id === drop.id), 'えらんだ 地図は 捨てた');
  assert.ok(c.treasureMaps.some((t) => t.id === nw.id && t.lv === 4 && !t.found && !t.cleared), '新しい 地図を 持った');
  assert.equal(c.tmPending, undefined, 'あずかりは 空');
  assert.ok(!c.chests[`tm_${drop.id}_1_0`]);
  // もう ない あずかりは えらべない
  bot.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid: nw.id, id: c.treasureMaps[0].id });
  assert.equal(lastRes(bot).ok, false);
  assert.equal(c.treasureMaps.length, TM_MAX);
});

test('第75回: 新しい 地図を あきらめる → 何も なくならない', async () => {
  const { world, bot, c } = await hero(32);
  fill(world, c);
  const before = JSON.stringify(c.treasureMaps);
  const nw = grantTreasureMap(world, c, { lv: 2 });
  bot.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid: nw.id });
  const res = lastRes(bot);
  assert.ok(res.ok);
  assert.match(res.text, /あきらめた/);
  assert.equal(JSON.stringify(c.treasureMaps), before, '持っている 地図は そのまま');
  assert.equal(c.tmPending, undefined);
  // 知らない id
  bot.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid: 'zzz' });
  assert.equal(lastRes(bot).ok, false);
});

test('第75回: あずかりは 3まいまで・メニューで 捨てると 空いた ところに 入る', async () => {
  const { world, bot, c } = await hero(33);
  fill(world, c);
  const got = [];
  for (let i = 0; i < TM_PEND_MAX; i++) got.push(grantTreasureMap(world, c, { lv: 1 }));
  assert.ok(got.every((t) => isPendingMap(c, t)));
  assert.equal(grantTreasureMap(world, c, { lv: 1 }), null, 'あずかりも いっぱい');
  assert.equal(c.tmPending.length, TM_PEND_MAX);
  // メニューの「地図を捨てる」（いつでも。たしかめる まどは 画面）→ あずかりの 1まいめが 入る
  const old = c.treasureMaps[5];
  bot.send({ t: 'menu', action: 'tmap', op: 'discard', id: old.id });
  const res = lastRes(bot);
  assert.ok(res.ok);
  assert.match(res.text, /あずかっていた.*を、かわりに持った！/);
  assert.equal(c.treasureMaps.length, TM_MAX);
  assert.ok(c.treasureMaps.some((t) => t.id === got[0].id));
  assert.deepEqual(c.tmPending.map((t) => t.id), [got[1].id, got[2].id]);
});

test('第75回: 洞窟の 主を たおして いっぱい → あずかり。今 いる 洞窟の 地図は 捨てられない', { timeout: 120000 }, async () => {
  const { world, bot, c } = await hero(23);
  strong(c);
  const tm = grantTreasureMap(world, c, { lv: 2 });
  tm.found = true;
  tm.at = 0;
  c.flags[foundFlag(tm.seed)] = true;
  fill(world, c, { cleared: true });
  const ids0 = c.treasureMaps.map((t) => t.id).sort();
  const info = caveInfo(tm.seed, tm.lv);
  const last = MAPS[floorMapId(tm, info.floors)];
  const boss = last.npcById.tm_boss;
  world.placeSession(bot.s, last.id, boss.x + 0.5, boss.y + 2.5, 'up');
  Object.assign(bot, { map: last.id, x: boss.x + 0.5, y: boss.y + 2.5, seq: bot.s.posSeq });
  bot.send({ t: 'interact', kind: 'npc', id: 'tm_boss' });
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '主と 戦う');
  for (const x of ctx.battle.enemies) x.hp = 1;
  await bot.settle();
  assert.equal(bot.battles.pop().outcome, 'win');
  assert.ok(c.flags[clearedFlag(tm.seed)]);
  assert.deepEqual(c.treasureMaps.map((t) => t.id).sort(), ids0, '主を たおした 地図も ふくめて、どれも 消えない');
  assert.equal(c.tmPending?.length, 1, '新しい 地図は あずかり');
  assert.ok(said(bot, /地図はいっぱい！\nこのあと、どの地図を捨てるか選んでね/), '会話で 知らせる');
  assert.equal(bot.char.tmPending?.length, 1, '画面にも とどく');
  const pid = c.tmPending[0].id;
  // 今 いる 洞窟の 地図は 捨てられない（主が また あらわれない ように）
  bot.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid, id: tm.id });
  assert.equal(lastRes(bot).ok, false);
  assert.match(lastRes(bot).text, /今は捨てられない/);
  assert.ok(c.treasureMaps.some((t) => t.id === tm.id) && c.flags[clearedFlag(tm.seed)]);
  assert.ok(!condOk(boss.show, (f) => !!c.flags[f]), '主は もう いない');
  // ほかの 地図なら 捨てられる
  const other = c.treasureMaps.find((t) => t.id !== tm.id);
  bot.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid, id: other.id });
  assert.ok(lastRes(bot).ok);
  assert.ok(c.treasureMaps.some((t) => t.id === pid));
  assert.equal(c.treasureMaps.length, TM_MAX);
  for (let i = 0; i < 60; i++) { bot.flushQueue(); await tickN(world, 1); }
  assert.equal(world.battles.size, 0, '主の 戦いは もう 始まらない');
});

test('第75回: 戦いで 拾った 地図も いっぱいなら あずかり（けっかの まどで 知らせる）', async () => {
  const { world, bot, c } = await hero(34);
  fill(world, c);
  const s = bot.s;
  const fake = { battle: { result: { outcome: 'win' }, boss: false, combatants: [{ side: 'enemy', lv: 14, species: 'wolf' }] }, opts: {}, map: 'overworld' };
  const rng = world.rng;
  world.rng = { ...rng, chance: () => true, next: () => 0.5 };
  const per = { [s.id]: { lines: [] } };
  treasureAfterBattle(world, fake, [s], per);
  assert.equal(c.treasureMaps.length, TM_MAX);
  assert.equal(c.tmPending?.length, 1);
  assert.ok(per[s.id].lines.some((l) => /宝の地図を拾った/.test(l)));
  assert.ok(per[s.id].lines.some((l) => /地図がいっぱい！\nあとで、どの地図を捨てるか選んでね/.test(l)));
  // あずかりも いっぱいなら「もう持てない」と 知らせる（だまって なくさない）
  for (let i = 1; i < TM_PEND_MAX; i++) grantTreasureMap(world, c, { lv: 1 });
  const per2 = { [s.id]: { lines: [] } };
  treasureAfterBattle(world, fake, [s], per2);
  assert.ok(per2[s.id].lines.some((l) => /もう持てない/.test(l)));
  world.rng = rng;
});

test('第75回: 宝探しのダイゴの 地図も いっぱいなら あずかり。あずかりが あると もう くれない', async () => {
  const { world, bot, c } = await hero(35);
  c.flags.tm_intro = true;
  fill(world, c, { cleared: true }); // 全部 クリア・Lv1 → ダイゴが もう1まい くれる
  const n = MAPS.overworld.npcById.tm_hunter;
  world.placeSession(bot.s, 'overworld', n.x + 0.5, n.y + 1.5, 'up');
  Object.assign(bot, { map: 'overworld', x: n.x + 0.5, y: n.y + 1.5, seq: bot.s.posSeq });
  await bot.talk('tm_hunter');
  assert.equal(c.treasureMaps.length, TM_MAX);
  assert.equal(c.tmPending?.length, 1, 'あずかり');
  assert.ok(said(bot, /地図がいっぱいじゃな/));
  await bot.talk('tm_hunter');
  assert.equal(c.tmPending.length, 1, 'ふえない');
  assert.ok(said(bot, /持ちきれない地図がある/));
});

test('第75回: あずかりは セーブに のこる（つなぎなおし・ログインしなおし）', async () => {
  const { world, bot, c } = await hero(36);
  fill(world, c);
  const nw = grantTreasureMap(world, c, { lv: 3 });
  // セーブの 形（JSON）→ 読みなおし
  const raw = JSON.parse(JSON.stringify(world.data));
  const up = upgradeSave(raw).data.characters[c.id];
  assert.equal(up.tmPending?.[0]?.id, nw.id, 'セーブに のこる');
  assert.equal(up.treasureMaps.length, TM_MAX);
  // つなぎなおし（おなじ キャラで もう一度 あそぶ）
  world.disconnect(bot.s, bot.conn);
  await tickN(world, 2);
  const b2 = new Bot(world, 'ソラ');
  await b2.login();
  b2.send({ t: 'play', id: c.id });
  await b2.settle();
  assert.equal(b2.char.tmPending?.[0]?.id, nw.id, 'もどってきても あずかりの 地図');
  b2.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid: nw.id, id: c.treasureMaps[0].id });
  assert.ok(lastRes(b2).ok);
  assert.ok(b2.char.treasureMaps.some((t) => t.id === nw.id));
});

test('第75回: セーブの 手直し（あずかり）', () => {
  const rec = (seed, extra = {}) => ({ id: String(seed), seed, lv: 1, map: 'overworld', x: 10, y: 10, found: false, cleared: false, ...extra });
  // 持っている 地図と おなじ 地図・こわれた 地図は のぞく。ほった・たおした しるしは 消す（新しい 地図）
  const a = { treasureMaps: [rec(1)], tmPending: [rec(1), null, { seed: -3 }, rec(2, { found: true, cleared: true }), rec(3), rec(4), rec(5)] };
  repairTreasureMaps(a);
  assert.deepEqual(a.tmPending.map((t) => t.seed), [2, 3, 4], `${TM_PEND_MAX}まいまで`);
  assert.ok(a.tmPending.every((t) => !t.found && !t.cleared));
  // 空なら 項目ごと 消す（前の セーブと おなじ 形）
  const b = { treasureMaps: [rec(1)], tmPending: [] };
  repairTreasureMaps(b);
  assert.ok(!('tmPending' in b));
  // 持ちきれない 地図（家族サーバーと 合わせた など）は なくさず あずかりへ
  const many = { treasureMaps: Array.from({ length: TM_MAX + 2 }, (_, i) => rec(100 + i)) };
  repairTreasureMaps(many);
  assert.equal(many.treasureMaps.length, TM_MAX);
  assert.deepEqual(many.tmPending.map((t) => t.seed), [100 + TM_MAX, 101 + TM_MAX]);
  // ログインの とき、空きが あれば あずかりから 入れる
  const c = { flags: {}, chests: {}, explored: {}, treasureMaps: [rec(7)], tmPending: [rec(8)] };
  normalizeTreasure(c);
  assert.deepEqual(c.treasureMaps.map((t) => t.seed), [7, 8]);
  assert.ok(!('tmPending' in c));
});

test('第75回: 画面に 出す 地図の 説明（場所・主）', () => {
  const t = { seed: 12345, lv: 3, map: 'overworld', x: 120, y: 45 };
  const place = tmPlaceShort(t);
  assert.ok(place.startsWith(MAPS.overworld.name), place);
  assert.match(tmTitle(t), /Lv3$/);
});
