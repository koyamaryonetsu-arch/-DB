// 第89回: 宝の地図を 捨てる タイミング と、ボス戦に とちゅうから 入る（docs/plan-r89-treasure-join.md）
// 家族の 声:
//   「宝の地図を捨てるタイミングがおかしいです。もらったタイミングで捨てるものを選ばせて。」
//   「ボス戦も、フィールド戦と同じように接近すれば参加できるハズだったのにできないことがありました。」
// 設計の 1-3 の すじ道 H1〜H5 を 1つずつ 再現して、どれが 本当に 起きるかを たしかめる（セッション 2つ）。
//   H1 地図の まどで えらんで いる 間に、リーダーが ボスを 始めた → まきこまれる
//   H2 家族が べつの 場所へ 運ばれて ボスと 戦って いる → 近づけない
//   H3 近づいたが だまって ことわられた → わけが 出ない
//   H4 追跡で 止まる 所が 入れる きょりの 外（← 起きない。止まる 所 1.4 ＜ 入れる きょり）
//   H5 前の 戦いの けっかを 読んで いる 間に ボスが 始まった（← 入れなく ならない。読んで いる 人も だいほんに 入る）
//   H6（ほかの 原因）とちゅうから 入った 物語の 戦いの あと、サーバーで「だいほん中」の まま 動けなく なる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { TM_MAX, caveInfo, floorMapId, foundFlag } from '../public/js/shared/data/treasure.js';
import { grantTreasureMap } from '../public/js/shared/world/treasure.js';
import { runScript } from '../public/js/shared/world/scripts.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

function strong(c, level = 60) {
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
}

async function family(seed = 11) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await kid.login('ほし');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  for (const b of [papa, kid]) {
    const c = world.data.characters[b.char.id];
    for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) c.flags[f] = true;
    strong(c);
  }
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  place(papa, FIELD.x, FIELD.y);
  place(kid, FIELD.x + 20, FIELD.y);
  return { world, papa, kid, cp: world.data.characters[papa.char.id], ck: world.data.characters[kid.char.id] };
}

function place(bot, x, y, map = 'overworld') {
  bot.world.placeSession(bot.s, map, x, y, 'down');
  bot.s.invuln = 0;
  Object.assign(bot, { map, x, y, seq: bot.s.posSeq });
}

function fill(world, c) {
  while ((c.treasureMaps || []).length < TM_MAX) grantTreasureMap(world, c, { lv: 1 });
}

// まものの シンボルを つくって ふれさせる
function fightAt(world, bot, x, y) {
  const ms = world.mapStates.get('overworld') || (world.tick(1), world.mapStates.get('overworld'));
  const sym = { id: 'sym' + Math.random(), sp: 'pururin', group: ['pururin'], table: 'outskirts', zone: 'outskirts', x, y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.s.x = x;
  bot.s.y = y;
  bot.send({ t: 'touch', id: sym.id });
  return sym;
}

// 戦いで かならず 宝の地図を 拾う（地図が いっぱいの 人は あずかりに 入る）
async function winWithMap(world, bot, x, y) {
  const rng = world.rng;
  fightAt(world, bot, x, y);
  assert.ok(bot.inBattle, '戦う');
  const ctx = [...world.battles.values()].find((b) => b.sids.includes(bot.s.id));
  for (const e of ctx.battle.enemies) e.hp = 1;
  const chance = rng.chance.bind(rng);
  rng.chance = (p) => (p > 0 && p < 0.5 ? true : chance(p));
  try {
    for (let i = 0; i < 4000 && bot.inBattle; i++) { bot.flushQueue(); await tickN(world, 1); }
  } finally {
    rng.chance = chance;
  }
  assert.ok(!bot.inBattle, '戦いが 終わる');
  return bot.battles[bot.battles.length - 1];
}

// テスト用の 物語の だいほん（リーダーの まわりの 家族も 入る。runScript の きまり）
let scriptSeq = 0;
function storyScript(steps) {
  const id = `__r89_${++scriptSeq}`;
  SCRIPTS[id] = () => steps;
  return id;
}

async function until(world, bots, fn, n = 400) {
  for (let i = 0; i < n && !fn(); i++) { for (const b of bots) b.flushQueue(); await tickN(world, 1); }
  return fn();
}

const toasts = (bot) => bot.msgs.filter((m) => m.t === 'toast').map((m) => m.text);
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const ctxOf = (world, bot) => [...world.battles.values()].find((b) => b.sids.includes(bot.s.id));

// ───────────── 宝の地図: もらった その 場で えらぶ ─────────────
test('第89回: 戦いで 拾った 地図が いっぱい → けっかの 中で えらぶ（サーバーは「えらんで いる」と 知って いる）', { timeout: 60000 }, async () => {
  const { world, kid, ck } = await family(21);
  fill(world, ck);
  const ids0 = ck.treasureMaps.map((t) => t.id);
  kid.keepResult = true;
  const end = await winWithMap(world, kid, FIELD.x + 20, FIELD.y);
  assert.equal(ck.tmPending?.length, 1, 'あずかりに 入る');
  const pid = ck.tmPending[0].id;
  assert.ok(end.lines.some((l) => /宝の地図を拾った/.test(l)), '「宝の地図を拾った！」の 行');
  assert.ok(!end.lines.some((l) => /あとで/.test(l)), '「あとで」は ない');
  assert.deepEqual((end.tmAsk || []).map((t) => t.id), [pid], 'けっかの 中で 聞く 地図');
  assert.equal(kid.s.busy, 'tmfull', 'えらんで いる 間は サーバーが 知って いる');
  // けっかを 閉じても、えらぶまでは「えらんで いる」
  kid.send({ t: 'resultDone' });
  assert.equal(kid.s.busy, 'tmfull');
  // メニューの ほかの ことは できない
  kid.send({ t: 'menu', action: 'tmap', op: 'discard', id: ids0[0] });
  assert.equal(lastRes(kid).ok, false);
  // 1まい 捨てて 新しい 地図を 持つ → すぐ 動ける
  kid.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid, id: ids0[2] });
  assert.ok(lastRes(kid).ok, lastRes(kid).text);
  assert.ok(!ck.treasureMaps.some((t) => t.id === ids0[2]), '捨てた 地図は 消える');
  assert.ok(ck.treasureMaps.some((t) => t.id === pid), '新しい 地図が 入る');
  assert.equal(ck.tmPending, undefined);
  assert.equal(kid.s.busy, null, 'えらぶと すぐ 動ける');
});

test('第89回: あきらめる → 新しい 地図が 消える・すぐ 動ける', { timeout: 60000 }, async () => {
  const { world, kid, ck } = await family(22);
  fill(world, ck);
  const before = JSON.stringify(ck.treasureMaps);
  await winWithMap(world, kid, FIELD.x + 20, FIELD.y);
  const pid = ck.tmPending[0].id;
  assert.equal(kid.s.busy, 'tmfull');
  kid.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid });
  assert.ok(lastRes(kid).ok);
  assert.equal(JSON.stringify(ck.treasureMaps), before, '持って いる 地図は そのまま');
  assert.equal(ck.tmPending, undefined, '新しい 地図は 消える');
  assert.equal(kid.s.busy, null);
});

test('第89回: 家族と いっしょの 戦い → えらぶ 人は リーダーの「閉じる」に ついて いかない', { timeout: 60000 }, async () => {
  const { world, papa, kid, ck, cp } = await family(23);
  fill(world, ck);
  delete cp.flags.c1_clear; // パパは 地図を 拾わない（ユイだけ 拾う）
  place(kid, FIELD.x + 1, FIELD.y);
  papa.keepResult = true;
  kid.keepResult = true;
  const rng = world.rng;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle && kid.inBattle, 'いっしょに 戦う');
  for (const e of ctxOf(world, papa).battle.enemies) e.hp = 1;
  const chance = rng.chance.bind(rng);
  rng.chance = (p) => (p > 0 && p < 0.5 ? true : chance(p));
  try { await until(world, [papa, kid], () => !papa.inBattle && !kid.inBattle, 4000); } finally { rng.chance = chance; }
  const kend = kid.battles.pop();
  assert.equal(ck.tmPending?.length, 1, 'ユイは あずかりに 入る');
  assert.ok(papa.battles.pop().lines.length > 0, 'パパにも 読む 行が ある（ふだんは 仲間が パパに ついて 閉じる）');
  assert.ok(kend.tmAsk?.length, 'ユイは けっかの 中で えらぶ');
  assert.ok(!kend.followLeader, 'リーダーが 閉じても ユイの まどは 閉じない');
  papa.send({ t: 'resultDone' });
  assert.ok(!kid.msgs.some((m) => m.t === 'resultClose'), 'ユイには「閉じる」が とどかない');
  assert.equal(kid.s.busy, 'tmfull');
});

test('第89回: 洞窟の 主の あと・ダイゴの 会話の 中で すぐ えらぶ（「あとで」は ない）', { timeout: 120000 }, async () => {
  const { world, papa: kid, cp: ck } = await family(24); // 物語・洞窟は リーダー（パパ）の もの
  // 洞窟の 主
  const tm = grantTreasureMap(world, ck, { lv: 2 });
  tm.found = true;
  ck.flags[foundFlag(tm.seed)] = true;
  fill(world, ck);
  const info = caveInfo(tm.seed, tm.lv);
  const last = MAPS[floorMapId(tm, info.floors)];
  const boss = last.npcById.tm_boss;
  place(kid, boss.x + 0.5, boss.y + 2.5, last.id);
  kid.send({ t: 'interact', kind: 'npc', id: 'tm_boss' });
  assert.ok(await until(world, [kid], () => world.battles.size > 0), '主と 戦う');
  for (const x of ctxOf(world, kid).battle.enemies) x.hp = 1;
  await until(world, [kid], () => !kid.inBattle && !world.battles.size, 4000);
  await until(world, [kid], () => kid.s.busy !== 'script', 400);
  const steps = kid.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps);
  const at = steps.findIndex((s) => s[0] === 'say' && /宝の地図を見つけた！/.test(s[2] || ''));
  assert.ok(at >= 0);
  assert.equal(steps[at + 1]?.[0], 'tmAsk', '「宝の地図を見つけた！」の すぐ あとで えらぶ');
  assert.equal(steps[at + 1][1], kid.s.id);
  assert.ok(!steps.some((s) => s[0] === 'say' && /あとで|このあと|メニューの「道具」/.test(s[2] || '')), '「あとで」の 文は ない');
  assert.equal(kid.s.busy, 'tmfull', '会話が 終わっても えらぶまでは「えらんで いる」');
  kid.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid: ck.tmPending[0].id });
  assert.equal(kid.s.busy, null);
  // ダイゴ
  place(kid, 0, 0);
  ck.flags.tm_intro = true;
  for (const t of ck.treasureMaps) { t.cleared = true; t.found = true; t.lv = 1; }
  const n = MAPS.overworld.npcById.tm_hunter;
  place(kid, n.x + 0.5, n.y + 1.5);
  const m0 = kid.msgs.length;
  kid.send({ t: 'interact', kind: 'npc', id: 'tm_hunter' });
  await until(world, [kid], () => kid.s.busy !== 'script');
  const st2 = kid.msgs.slice(m0).filter((m) => m.t === 'script').flatMap((m) => m.steps);
  const at2 = st2.findIndex((s) => s[0] === 'say' && /を手に入れた！/.test(s[2] || ''));
  assert.ok(at2 >= 0, 'ダイゴが くれる');
  assert.equal(st2[at2 + 1]?.[0], 'tmAsk', '「手に入れた！」の すぐ あとで えらぶ');
  assert.ok(!st2.some((s) => s[0] === 'say' && /このあと|あとで/.test(s[2] || '')));
});

test('第89回: 通信が 切れて のこった あずかりは、次に 世界に 入った すぐに 聞く', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(25), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  fill(world, c);
  const nw = grantTreasureMap(world, c, { lv: 3 });
  bot.send({ t: 'quit' });
  const b2 = new Bot(world, 'ソラ');
  await b2.login();
  b2.send({ t: 'play', id: c.id });
  assert.ok(b2.msgs.some((m) => m.t === 'tmAsk'), '入った すぐに 聞く');
  assert.equal(b2.s.busy, 'tmfull');
  b2.send({ t: 'menu', action: 'tmap', op: 'pendKeep', pid: nw.id, id: c.treasureMaps[0].id });
  assert.ok(lastRes(b2).ok);
  assert.equal(b2.s.busy, null);
});

test('第89回: えらんで いる 間に 通信が 切れて つなぎなおす → もう一度 聞く', { timeout: 60000 }, async () => {
  const { world, kid, ck } = await family(26);
  fill(world, ck);
  await winWithMap(world, kid, FIELD.x + 20, FIELD.y);
  assert.equal(kid.s.busy, 'tmfull');
  world.disconnect(kid.s, kid.conn);
  const k2 = new Bot(world, 'ユイ');
  await k2.login('ほし');
  k2.send({ t: 'play', id: ck.id });
  assert.ok(k2.resumed);
  assert.ok(k2.msgs.some((m) => m.t === 'tmAsk'), 'つなぎなおすと もう一度 聞く');
});

// ───────────── H1〜H5 と ほかの 原因 ─────────────
test('H1: 地図を えらんで いる 間に リーダーが ボスを 始めても まきこまれない。えらんだ あと「戦いに入る」で 入れる', { timeout: 60000 }, async () => {
  const { world, papa, kid, ck } = await family(31);
  fill(world, ck);
  await winWithMap(world, kid, FIELD.x + 2, FIELD.y);
  assert.ok(ck.tmPending?.length, 'ユイは えらんで いる');
  // リーダーが すぐ そばで 物語の ボスを 始める
  place(papa, FIELD.x, FIELD.y);
  runScript(world, papa.s, storyScript([['say', null, 'ボスがあらわれた！'], ['battle', 'argos']]), { story: true });
  await until(world, [papa, kid], () => papa.inBattle);
  assert.ok(papa.inBattle);
  assert.notEqual(kid.s.busy, 'script', 'えらんで いる ユイは だいほんに まきこまれない');
  assert.ok(!kid.inBattle, 'ボスの 戦いにも まきこまれない');
  assert.equal(kid.s.busy, 'tmfull');
  // 「戦いに入る」ボタンが 出る（パーティーの 知らせ）
  const fights = kid.party.fights || [];
  assert.equal(fights.length, 1, 'ボタンに 出す 戦い');
  assert.equal(fights[0].sid, papa.s.id);
  // えらんで いる 間は 入れない（わけが 出る）
  kid.send({ t: 'joinBattle', sid: papa.s.id, remote: true });
  assert.ok(!kid.inBattle);
  assert.match(toasts(kid).pop() || '', /今は入れない/);
  // えらぶ → 入る
  kid.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid: ck.tmPending[0].id });
  kid.send({ t: 'joinBattle', sid: papa.s.id, remote: true });
  assert.ok(kid.inBattle, '戦いに 入れる');
  for (const e of ctxOf(world, papa).battle.enemies) e.hp = 1;
  await until(world, [papa, kid], () => !papa.inBattle && !kid.inBattle, 4000);
  await until(world, [papa, kid], () => !kid.s.busy, 50);
  // ボスの 戦いでも 地図を 拾う ことが ある（まだ いっぱい → また その 場で えらぶ）
  if (ck.tmPending?.length) {
    assert.equal(kid.s.busy, 'tmfull');
    kid.send({ t: 'menu', action: 'tmap', op: 'pendGive', pid: ck.tmPending[0].id });
  }
  assert.equal(kid.s.busy, null, '戦いの あと 動ける');
});

test('H2: リーダーが だいほんで べつの 場所へ 運ばれた ボス戦に、「戦いに入る」で 入れる（自分は もとの 場所に もどる）', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(32);
  kid.s.busy = 'shop'; // 会話の 時は ほかの ことを して いた
  const to = MAPS.tower_3f;
  runScript(world, papa.s, storyScript([['teleport', 'tower_3f', 5.5, 5.5, 'up'], ['say', null, 'ボスがあらわれた！'], ['battle', 'argos']]), { story: true });
  await until(world, [papa], () => papa.inBattle);
  assert.ok(papa.inBattle && papa.s.map === 'tower_3f' && to);
  kid.s.busy = null;
  const home = { map: kid.s.map, x: kid.s.x, y: kid.s.y };
  // 近づいて 入る 形では とどかない（べつの マップ）→ わけを 出す
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle);
  assert.ok(toasts(kid).length > 0, 'だまって ことわらない');
  // 「戦いに入る」ボタン
  assert.equal((kid.party.fights || []).length, 1);
  kid.send({ t: 'joinBattle', sid: papa.s.id, remote: true });
  assert.ok(kid.inBattle, 'どこに いても 入れる');
  const js = kid.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.ok(js.joined && js.boss && js.story);
  assert.equal((kid.party.fights || []).filter((f) => !f.sids.includes(kid.s.id)).length, 0, '入ったら ボタンは 消える');
  for (const e of ctxOf(world, papa).battle.enemies) e.hp = 1;
  await until(world, [papa, kid], () => !papa.inBattle && !kid.inBattle, 4000);
  assert.deepEqual({ map: kid.s.map, x: kid.s.x, y: kid.s.y }, home, '自分の いた 所に もどる');
  assert.equal(kid.s.busy, null);
  await until(world, [papa, kid], () => !papa.s.busy, 400);
  assert.equal((kid.party.fights || []).length, 0, '戦いが 終わったら ボタンは 消える');
});

test('H3: 近づいたのに ことわる 時は かならず わけを 出す', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(33);
  kid.s.busy = 'shop'; // 会話の 時は ほかの ことを して いた（同じ マップの 家族は だいほんに 入る ため）
  runScript(world, papa.s, storyScript([['battle', 'argos']]), { story: true });
  await until(world, [papa], () => papa.inBattle);
  kid.s.busy = 'shop';
  place(kid, FIELD.x + 1, FIELD.y);
  const n0 = toasts(kid).length;
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle);
  assert.equal(toasts(kid).length, n0 + 1, 'わけが 出る');
  assert.match(toasts(kid).pop(), /今は入れない/);
  kid.s.busy = null;
  // 戦いが 終わりかけ
  const ctx = ctxOf(world, papa);
  ctx.battle.pendingEnd = true;
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle);
  assert.match(toasts(kid).pop(), /もうすぐ戦いが終わる/);
  ctx.battle.pendingEnd = false;
  // 遠い
  place(kid, FIELD.x + 6, FIELD.y);
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle);
  assert.match(toasts(kid).pop(), /近づ/);
  // 近い（入れる きょりの きわ）→ 入れる
  place(kid, FIELD.x + 2.3, FIELD.y);
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(kid.inBattle);
});

test('H4: 「ついていく」で 止まる 所からでも 入れる（止まる きょり ＜ 画面が 送る きょり ≦ サーバーの きょり）', async () => {
  const rule = await import('../public/js/shared/join-rule.js');
  assert.ok(rule.FOLLOW_STOP < rule.JOIN_NEAR, '追跡で 止まる 所は 入れる きょりの 内がわ');
  const { LATE_JOIN_RADIUS } = await import('../public/js/shared/world/battles.js');
  assert.ok(rule.JOIN_NEAR <= LATE_JOIN_RADIUS, '画面が 送る きょりは サーバーでも 入れる');
  // 画面は その きまりを 使う（数を じかに 書かない）
  const src = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.match(src, /JOIN_NEAR/);
  assert.match(src, /FOLLOW_STOP/);
});

test('H4: 追跡で 止まる 所（リーダーから 1.4）＋ 通信の ずれ でも サーバーは 入れる', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(34);
  kid.s.busy = 'shop'; // 会話の 時は ほかの ことを して いた（同じ マップの 家族は だいほんに 入る ため）
  runScript(world, papa.s, storyScript([['battle', 'argos']]), { story: true });
  await until(world, [papa], () => papa.inBattle);
  kid.s.busy = null;
  place(kid, FIELD.x + 1.4 + 0.5, FIELD.y);
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(kid.inBattle);
});

test('H5: 前の 戦いの けっかを 読んで いる 間に ボスが 始まっても、だいほんに 入って いっしょに 戦う', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(35);
  kid.keepResult = true;
  await winWithMap(world, kid, FIELD.x + 2, FIELD.y); // 地図は いっぱいで ない（あずかりは ない）
  assert.ok(kid.s.reading, 'けっかを 読んで いる');
  place(papa, FIELD.x, FIELD.y);
  runScript(world, papa.s, storyScript([['battle', 'argos']]), { story: true });
  await until(world, [papa, kid], () => papa.inBattle);
  assert.ok(kid.inBattle, '読んで いた ユイも いっしょに 戦う');
});

test('ほかの 原因: とちゅうから 入った 物語の 戦いの あと、サーバーで「だいほん中」の まま 動けなく ならない（2つめの 戦いにも 入れる）', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(36);
  kid.s.busy = 'shop';
  runScript(world, papa.s, storyScript([['battle', 'argos'], ['say', null, 'まだ終わらない！'], ['battle', 'argos']]), { story: true });
  await until(world, [papa], () => papa.inBattle);
  kid.s.busy = null;
  place(kid, FIELD.x + 1, FIELD.y);
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(kid.inBattle, '1つめに 入る');
  for (const e of ctxOf(world, papa).battle.enemies) e.hp = 1;
  await until(world, [papa, kid], () => !kid.inBattle, 4000);
  assert.equal(kid.s.busy, null, 'だいほんに 入って いない ユイは「だいほん中」に ならない');
  // 動ける（サーバーが 位置を うけとる）
  kid.send({ t: 'move', x: FIELD.x + 1.6, y: FIELD.y, dir: 'down', moving: true, seq: kid.s.posSeq });
  assert.equal(kid.s.x, FIELD.x + 1.6);
  // 2つめの 戦い
  await until(world, [papa, kid], () => papa.inBattle && ctxOf(world, papa), 600);
  assert.ok(papa.inBattle, '2つめの 戦い');
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(kid.inBattle, '2つめにも 入れる');
});

test('第89回: 1人の けいこ・その場の 対戦には「戦いに入る」で 入れない（わけを 出す）', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family(37);
  kid.s.busy = 'shop'; // 会話の 時は ほかの ことを して いた（同じ マップの 家族は だいほんに 入る ため）
  runScript(world, papa.s, storyScript([['battle', 'argos']]), { story: true });
  await until(world, [papa], () => papa.inBattle);
  kid.s.busy = null;
  const ctx = ctxOf(world, papa);
  ctx.opts.solo = true;
  world.sendParty(world.parties.get(papa.s.partyId));
  assert.equal((kid.party.fights || []).length, 0, '1人の 戦いは ボタンを 出さない');
  kid.send({ t: 'joinBattle', sid: papa.s.id, remote: true });
  assert.ok(!kid.inBattle);
  assert.ok(toasts(kid).length > 0);
  // ふつうの フィールドの 戦いも ボタンは 出さない（近づくと 入る）
  ctx.opts.solo = false;
  ctx.opts.fixed = null;
  world.sendParty(world.parties.get(papa.s.partyId));
  assert.equal((kid.party.fights || []).length, 0);
  kid.send({ t: 'joinBattle', sid: papa.s.id, remote: true });
  assert.ok(!kid.inBattle);
});
