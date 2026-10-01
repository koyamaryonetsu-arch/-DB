// 馬車（ドラクエ4・5ふう）: もらう・乗りかえ・経験値・たたかいの いれかえ・マルチ・セーブ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { runScript, runSteps } from '../public/js/shared/world/scripts.js';
import { addMonsterCompanion, setPartyOrder } from '../public/js/shared/world/party.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode, importChar } from '../public/js/shared/world/transfer.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { WAGON_SLOTS, cleanWagon } from '../public/js/shared/data/wagon.js';
import { wagonHere } from '../public/js/shared/world/wagon.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

function level(world, bot, lv) {
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(lv) - c.exp);
  c.hp = computeStats(c).maxHp;
  world.sendSelf(bot.s);
}

async function hero(seed = 21, job = 'warrior', name = 'アル') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  level(world, bot, 12);
  bot.s.map = 'overworld';
  bot.s.x = FIELD.x;
  bot.s.y = FIELD.y;
  return { world, bot, c: world.data.characters[bot.char.id] };
}

// 酒場の 仲間を あつめて 馬車を もたせる（3人 パーティー + 馬車に ride）
async function withWagon(seed = 21) {
  const h = await hero(seed);
  const { bot, c } = h;
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k });
  for (const k of ['npc_rin', 'npc_tina']) bot.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: k, join: false });
  c.flags.c1_clear = true;
  runScript(h.world, bot.s, 'tavern');
  await bot.settle();
  return h;
}

function fieldBattle(world, bot, group = ['pururin']) {
  const sym = { id: 'w' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false };
  return startFieldBattle(world, bot.s, sym);
}

// てきを たおして かつ（ゲージを すすめて おわらせる）
async function winNow(world, bot, ctx) {
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 200 && !ctx.battle.over; i++) await tickN(world, 1);
  await tickN(world, 2);
  bot.flushQueue();
}

async function readyUp(world, ctx, id) {
  const a = ctx.battle.get(id);
  for (let i = 0; i < 800 && !a.ready && !ctx.battle.over; i++) await tickN(world, 1);
  return a.ready;
}

test('馬車: 第1章の あと、酒場の マスターから もらえる（1回だけ）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await hero();
  runScript(world, bot.s, 'tavern');
  await bot.settle();
  assert.ok(!c.wagon, '第1章の 前は もらえない');
  assert.equal(c.wagonKeys, undefined, 'ふるい セーブの 形は そのまま');
  c.flags.c1_clear = true;
  runScript(world, bot.s, 'tavern');
  await bot.settle();
  assert.equal(c.wagon, true);
  assert.deepEqual(c.wagonKeys, []);
  const said = (re) => bot.msgs.filter((m) => m.t === 'script').some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));
  assert.ok(said(/馬車を手に入れた/));
  assert.ok(bot.char.wagon, 'クライアントにも とどく');
  const n = bot.msgs.length;
  runScript(world, bot.s, 'tavern');
  await bot.settle();
  const again = bot.msgs.slice(n).some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'say' && /馬車を手に入れた/.test(st[2])));
  assert.ok(!again, '2回めは もらわない');
  assert.ok(Array.isArray(bot.party.wagon), 'パーティーの じょうほうに 馬車');
});

test('馬車: パーティー ⇄ 馬車 ⇄ 酒場（装備・ならび・いっぱい）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await withWagon();
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  const sword = gard.equip.weapon;
  assert.ok(sword);
  // メニュー: パーティー → 馬車（装備は そのまま）
  bot.send({ t: 'menu', action: 'wagon', op: 'in', key: 'npc_gard' });
  assert.deepEqual(c.partyKeys, ['npc_mina', 'npc_poporo']);
  assert.deepEqual(c.wagonKeys, ['npc_gard']);
  assert.equal(gard.equip.weapon, sword, '馬車では 装備を はずさない');
  assert.equal(bot.party.supports.length, 2);
  assert.deepEqual(bot.party.wagon.map((x) => x.key), ['npc_gard']);
  assert.ok(bot.party.wagon[0].wagon && bot.party.wagon[0].maxHp > 0);
  // 酒場: 待っている 仲間 → 馬車（元気いっぱい）
  const rin = c.companions.find((e) => e.key === 'npc_rin').char;
  rin.hp = 1;
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  assert.deepEqual(c.wagonKeys, ['npc_gard', 'npc_rin']);
  assert.equal(rin.hp, computeStats(rin).maxHp);
  const res = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(res.ok && res.tavern.wagon.keys.includes('npc_rin'));
  assert.ok(res.tavern.roster.find((e) => e.key === 'npc_rin').inWagon);
  // ならびを 変えて から 馬車 → パーティー（いっぱいなら 入れかわる。ならびは そのまま）
  bot.send({ t: 'svc', kind: 'tavern', action: 'join', key: 'npc_tina' });
  assert.deepEqual(c.partyKeys, ['npc_mina', 'npc_poporo', 'npc_tina']);
  assert.equal(setPartyOrder(world, bot.s, ['npc_mina', 'self', 'npc_poporo', 'npc_tina']).ok, true);
  bot.send({ t: 'menu', action: 'wagon', op: 'out', key: 'npc_gard' });
  assert.equal(bot.msgs.filter((m) => m.t === 'menuRes').pop().ok, false, 'いっぱいの ときは 入れかわる 人が いる');
  bot.send({ t: 'menu', action: 'wagon', op: 'out', key: 'npc_gard', with: 'npc_poporo' });
  assert.deepEqual(c.partyKeys, ['npc_mina', 'npc_gard', 'npc_tina'], 'ポポロの 場所に ガルド');
  assert.deepEqual(c.wagonKeys, ['npc_poporo', 'npc_rin'], 'ポポロは 馬車の ガルドの 席へ');
  assert.equal(c.selfPos, 1);
  assert.equal(bot.party.selfPos, 1);
  assert.deepEqual(bot.party.supports.map((x) => x.key), ['npc_mina', 'npc_gard', 'npc_tina']);
  // 馬車 → 酒場（装備は ふくろへ）
  const pop = c.companions.find((e) => e.key === 'npc_poporo').char;
  const staff = pop.equip.weapon;
  const had = itemCount(c, staff);
  bot.send({ t: 'svc', kind: 'tavern', action: 'wagonWait', key: 'npc_poporo' });
  assert.deepEqual(c.wagonKeys, ['npc_rin']);
  assert.equal(pop.equip.weapon, null);
  assert.equal(itemCount(c, staff), had + 1, '酒場で 待つ ときは 装備を ふくろへ');
  // 家族の キャラは 乗れない・4人まで
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'fam:zzz' });
  assert.equal(bot.msgs.filter((m) => m.t === 'svcRes').pop().ok, false);
  const s = bot.s;
  for (const sp of ['pururin', 'koumorin', 'wolf']) addMonsterCompanion(world, s, sp, 5, '__tavern');
  const mons = c.companions.filter((e) => e.kind === 'monster').map((e) => e.key);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_poporo' });
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: mons[0] });
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: mons[1] });
  assert.equal(c.wagonKeys.length, WAGON_SLOTS);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: mons[2] });
  const full = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.equal(full.ok, false);
  assert.ok(full.full);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: mons[2], swap: 'npc_poporo' });
  assert.ok(c.wagonKeys.includes(mons[2]) && !c.wagonKeys.includes('npc_poporo'), '入れかわって 酒場へ');
  // 別れた モンスターは 馬車からも いなくなる
  bot.send({ t: 'svc', kind: 'tavern', action: 'release', key: mons[2] });
  assert.ok(!c.wagonKeys.includes(mons[2]));
});

test('馬車: 洞窟の 中では 乗りかえられない', { timeout: 60000 }, async () => {
  const { bot, c } = await withWagon(22);
  assert.equal(wagonHere('overworld'), true);
  assert.equal(wagonHere('sea'), true);
  assert.equal(wagonHere('cave_b1'), false);
  bot.s.map = 'cave_b1';
  bot.send({ t: 'menu', action: 'wagon', op: 'in', key: 'npc_gard' });
  const r = bot.msgs.filter((m) => m.t === 'menuRes').pop();
  assert.equal(r.ok, false);
  assert.match(r.text, /入り口で待っている/);
  assert.deepEqual(c.wagonKeys, []);
});

test('馬車: 経験値と 職業の 修行を 半分 もらう（洞窟では もらわない・死んでいる 人も）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await withWagon(23);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_tina' });
  const rin = c.companions.find((e) => e.key === 'npc_rin').char;
  const tina = c.companions.find((e) => e.key === 'npc_tina').char;
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  // 同じ レベルに そろえて くらべる
  for (const ch of [rin, gard]) { ch.level = 10; ch.exp = expForLevel(10); ch.jobs[ch.job] = { lv: 1, b: 0 }; }
  tina.hp = 0;
  const e0 = { rin: rin.exp, gard: gard.exp, tina: tina.exp };
  const ctx = fieldBattle(world, bot, ['wolf', 'wolf']);
  bot.flushQueue();
  await winNow(world, bot, ctx);
  const end = bot.battles.pop();
  assert.equal(end.outcome, 'win');
  const got = { rin: rin.exp - e0.rin, gard: gard.exp - e0.gard };
  assert.ok(got.gard > 0);
  assert.equal(got.rin, Math.floor(got.gard / 2), '馬車の 仲間は 半分');
  assert.equal(tina.exp, e0.tina, '死んでいる 人は もらわない');
  assert.ok(end.lines.some((l) => /馬車の仲間は\d+ポイントの経験値/.test(l)));
  // 職業の 修行は 2回で 1回ぶん
  assert.equal(gard.jobs[gard.job].b, 1);
  assert.equal(rin.jobs[rin.job].b, 0);
  assert.equal(rin.wagonTrain, 0.5);
  const ctx2 = fieldBattle(world, bot, ['wolf', 'wolf']);
  bot.flushQueue();
  await winNow(world, bot, ctx2);
  assert.equal(rin.jobs[rin.job].b, 1);
  assert.equal(rin.wagonTrain, undefined);
  // 洞窟の 中では 馬車は 入り口で 待っている（もらわない）
  bot.s.map = 'cave_b1';
  const before = rin.exp;
  const ctx3 = fieldBattle(world, bot, ['wolf']);
  bot.flushQueue();
  await winNow(world, bot, ctx3);
  assert.equal(bot.battles.pop().outcome, 'win');
  assert.equal(rin.exp, before);
});

test('馬車: たたかいの「いれかえ」（番を 使う・死んだ 仲間・自分・あとも そのまま）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await withWagon(24);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_tina' });
  const ctx = fieldBattle(world, bot, ['golem']);
  const b = ctx.battle;
  const start = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  bot.queue = []; // ロボットの オートを とめる
  const me = start.mine[0];
  const idOf = (name) => b.allies.find((a) => a.name === name)?.id;
  const rej = () => bot.msgs.filter((m) => m.t === 'battleRej').length;
  let n = rej();
  // 番が 来る 前は できない
  b.get(me).ready = false;
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: idOf('ガルド'), key: 'npc_rin' } });
  assert.equal(rej(), n + 1, '番が 来る 前は ことわられる');
  assert.ok(await readyUp(world, ctx, me));
  // 馬車に いない 人・家族でない 人・ゲスト は だめ
  n = rej();
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: idOf('ガルド'), key: 'npc_luca' } });
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: 'e1', key: 'npc_rin' } });
  assert.equal(rej(), n + 2);
  // ガルド（死んでいる）→ リン
  const gardA = b.get(idOf('ガルド'));
  gardA.hp = 0;
  gardA.alive = false;
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: gardA.id, key: 'npc_rin' } });
  assert.equal(rej(), n + 2, 'いれかえが とおる');
  assert.equal(b.get(me).ready, false, '番を 使った');
  assert.equal(b.get(me).atb, 0);
  assert.ok(gardA.fled && gardA.out);
  assert.ok(!b.allies.includes(gardA));
  const rinA = b.allies.find((a) => a.name === 'リン');
  assert.ok(rinA);
  assert.equal(rinA.slot, gardA.slot, 'おなじ 場所に 入る');
  assert.equal(b.allies.length, 4);
  assert.equal(c.companions.find((e) => e.key === 'npc_gard').char.hp, 0, 'HPは もどる');
  assert.deepEqual(c.partyKeys, ['npc_rin', 'npc_mina', 'npc_poporo'], 'パーティーと 馬車が 入れかわる');
  assert.deepEqual(c.wagonKeys, ['npc_gard', 'npc_tina']);
  await tickN(world, 1);
  const ev = bot.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).find((e) => e.swap);
  assert.ok(ev, 'いれかえの できごと');
  assert.ok(ev.lines.includes('リンが馬車から飛び出した！'));
  assert.ok(ev.lines.includes('ガルドは馬車に運びこまれた。'));
  // 死んでいる 人は 馬車から 出られない
  assert.ok(await readyUp(world, ctx, me));
  n = rej();
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: idOf('ミーナ'), key: 'npc_gard' } });
  assert.equal(rej(), n + 1);
  // 自分が 馬車に 乗る → ティナを 自分が うごかす
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: me, key: 'npc_tina' } });
  assert.equal(rej(), n + 1);
  const tinaA = b.allies.find((a) => a.name === 'ティナ');
  assert.equal(tinaA.controller, bot.s.id, '自分の 代わりは 自分が 命令する');
  assert.ok(!b.allies.some((a) => a.charId === c.id));
  assert.deepEqual(c.wagonKeys, ['npc_gard', 'npc_tina'], '自分と 代わった 仲間は ならびを かえない');
  // ティナの 番で 自分が もどる
  assert.ok(await readyUp(world, ctx, tinaA.id));
  bot.send({ t: 'battle', actor: tinaA.id, cmd: { type: 'swap', out: tinaA.id, key: 'self' } });
  assert.equal(rej(), n + 1);
  assert.ok(b.allies.some((a) => a.charId === c.id && a.kind === 'player'), '自分が もどる');
  // あとは オートで おわらせる
  for (const a of b.allies) if (a.controller === bot.s.id) bot.send({ t: 'battle', actor: a.id, auto: true });
  await winNow(world, bot, ctx);
  assert.deepEqual(c.partyKeys, ['npc_rin', 'npc_mina', 'npc_poporo'], 'たたかいの あとも そのまま');
  assert.deepEqual(bot.party.supports.map((x) => x.key), ['npc_rin', 'npc_mina', 'npc_poporo']);
  assert.deepEqual(c.wagonKeys, ['npc_gard', 'npc_tina']);
});

test('馬車: 洞窟では いれかえられない・オートは かってに いれかえない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await withWagon(25);
  bot.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  bot.s.map = 'cave_b1';
  const ctx = fieldBattle(world, bot, ['golem']);
  const start = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  bot.queue = [];
  const me = start.mine[0];
  assert.ok(await readyUp(world, ctx, me));
  const n = bot.msgs.filter((m) => m.t === 'battleRej').length;
  const gard = ctx.battle.allies.find((a) => a.name === 'ガルド');
  bot.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: gard.id, key: 'npc_rin' } });
  const rj = bot.msgs.filter((m) => m.t === 'battleRej');
  assert.equal(rj.length, n + 1);
  assert.match(rj.pop().reason, /入り口で待っている/);
  assert.deepEqual(c.wagonKeys, ['npc_rin']);
  // オートの たたかいは さいごまで いれかえない
  bot.send({ t: 'battle', actor: me, auto: true });
  for (let i = 0; i < 4000 && !ctx.battle.over; i++) await tickN(world, 1);
  assert.ok(!ctx.battle.combatants.some((a) => a.out), 'だれも 馬車に もどらない');
  assert.deepEqual(c.wagonKeys, ['npc_rin']);
});

test('馬車: マルチでは リーダーの 馬車（家族の 仲間は 乗らない・リーダーだけ いれかえ）', { timeout: 60000 }, async () => {
  // 時計は 昼に そろえる（夜は 魔物の 出かたが かわって 乱数が ずれる）
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(26), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login();
  await kid.login();
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  // ゴーレムに ひと息で やられないように
  level(world, papa, 12);
  level(world, kid, 12);
  const pc = world.data.characters[papa.char.id];
  const kc = world.data.characters[kid.char.id];
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard' });
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_rin', join: false });
  kid.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina', join: false });
  pc.flags.c1_clear = true;
  kc.flags.c1_clear = true;
  runScript(world, papa.s, 'tavern');
  await papa.settle();
  runScript(world, kid.s, 'tavern');
  await kid.settle();
  papa.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  kid.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_mina' });
  kid.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'fam:' + papa.char.id });
  assert.deepEqual(kc.wagonKeys, ['npc_mina'], '家族の キャラは 乗れない');
  // いっしょに 冒険
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  assert.deepEqual(kid.party.wagon.map((x) => x.key), ['npc_rin'], 'リーダーの 馬車');
  // ほかの 人の 画面に 馬車（リーダーだけ）
  await tickN(world, 3);
  const snap = kid.msgs.filter((m) => m.t === 'snap').pop();
  assert.equal(snap.players.find((p) => p.sid === papa.s.id).wg, 1);
  const snap2 = papa.msgs.filter((m) => m.t === 'snap').pop();
  assert.equal(snap2.players.find((p) => p.sid === kid.s.id).wg, 0, 'なかまの 馬車は ついてこない');
  // リーダーで ない 人は メニューで 乗りかえられない
  kid.send({ t: 'menu', action: 'wagon', op: 'out', key: 'npc_mina' });
  assert.equal(kid.msgs.filter((m) => m.t === 'menuRes').pop().ok, false);
  // たたかい: リーダーだけ いれかえ できる
  for (const b of [papa, kid]) { b.s.map = 'overworld'; b.s.x = FIELD.x; b.s.y = FIELD.y; }
  const ctx = fieldBattle(world, papa, ['golem']);
  // Lv1 の 2人が 先に やられない ように（らんすうの ながれに よらず いれかえを ためせる）
  for (const e of ctx.battle.enemies) e.atk = 1;
  papa.queue = [];
  kid.queue = [];
  const kidId = kid.msgs.filter((m) => m.t === 'battleStart').pop().mine[0];
  const papaId = papa.msgs.filter((m) => m.t === 'battleStart').pop().mine[0];
  assert.ok(await readyUp(world, ctx, kidId));
  const gard = ctx.battle.allies.find((a) => a.name === 'ガルド');
  const n = kid.msgs.filter((m) => m.t === 'battleRej').length;
  kid.send({ t: 'battle', actor: kidId, cmd: { type: 'swap', out: kidId, key: 'npc_mina' } });
  kid.send({ t: 'battle', actor: kidId, cmd: { type: 'swap', out: gard.id, key: 'npc_rin' } });
  assert.equal(kid.msgs.filter((m) => m.t === 'battleRej').length, n + 2, 'リーダーで ない 人は できない');
  assert.ok(await readyUp(world, ctx, papaId));
  papa.send({ t: 'battle', actor: papaId, cmd: { type: 'swap', out: kidId, key: 'npc_rin' } });
  assert.ok(ctx.battle.allies.some((a) => a.id === kidId), '家族は 馬車に 入れられない');
  papa.send({ t: 'battle', actor: papaId, cmd: { type: 'swap', out: gard.id, key: 'npc_rin' } });
  assert.ok(ctx.battle.allies.some((a) => a.name === 'リン'));
  assert.deepEqual(pc.wagonKeys, ['npc_gard']);
  assert.deepEqual(kc.wagonKeys, ['npc_mina'], 'ユイの 馬車は そのまま');
  // つなぎなおし（mine は 今 戦っている キャラ）
  for (const b of [papa, kid]) for (const a of ctx.battle.allies) if (a.controller === b.s.id) b.send({ t: 'battle', actor: a.id, auto: true });
  await winNow(world, papa, ctx);
  kid.flushQueue();
  assert.deepEqual(papa.party.supports.map((x) => x.key), ['npc_rin']);
  assert.deepEqual(kid.party.wagon.map((x) => x.key), ['npc_gard']);
});

test('馬車: つなぎなおしても いれかえた 戦いが つづく（うごかす キャラ・馬車の じょうほう）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(28), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  await papa.login();
  await papa.createAndPlay('warrior');
  await papa.settle();
  level(world, papa, 12);
  const pc = world.data.characters[papa.char.id];
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_gard' });
  papa.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_rin', join: false });
  pc.flags.c1_clear = true;
  runScript(world, papa.s, 'tavern');
  await papa.settle();
  papa.send({ t: 'svc', kind: 'tavern', action: 'toWagon', key: 'npc_rin' });
  papa.s.map = 'overworld';
  papa.s.x = FIELD.x;
  papa.s.y = FIELD.y;
  const ctx = fieldBattle(world, papa, ['golem']);
  papa.queue = [];
  const me = papa.msgs.filter((m) => m.t === 'battleStart').pop().mine[0];
  assert.ok(await readyUp(world, ctx, me));
  // 自分が 馬車に 乗って リンが 出る
  papa.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: me, key: 'npc_rin' } });
  const rin = ctx.battle.allies.find((a) => a.name === 'リン');
  assert.ok(rin);
  // つなぎなおす（スマホの スリープの あと など）
  const papa2 = new Bot(world, 'パパ');
  await papa2.login();
  papa2.send({ t: 'play', id: pc.id });
  const enter = papa2.msgs.find((m) => m.t === 'enter');
  assert.ok(enter?.resumed);
  assert.deepEqual(enter.party.wagon.map((x) => x.key), ['npc_rin'], 'リンは 戦いの あと 馬車に もどる');
  const rs = papa2.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.ok(rs?.resume);
  assert.deepEqual(rs.mine, [rin.id], '今 うごかせる キャラは 代わりの リン');
  assert.ok(!rs.snap.combatants.some((c) => c.charId === pc.id), '馬車に いる 自分は 戦いの 画面に 出ない');
  // あとは オートで 勝つ
  papa2.flushQueue();
  await winNow(world, papa2, ctx);
  assert.equal(papa2.battles.pop()?.outcome, 'win');
  assert.deepEqual(pc.partyKeys, ['npc_gard']);
  assert.deepEqual(pc.wagonKeys, ['npc_rin']);
});

test('馬車: セーブ・引っこしコード・データ合わせで 馬車の 仲間を ととのえる', () => {
  // cleanWagon
  const c = {
    wagon: true, partyKeys: ['a'], wagonKeys: ['a', 'b', 'b', 'gone', 'fam:x', 'c', 'd', 'e', 'f', 7],
    companions: ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => ({ key: k, kind: 'npc', char: { name: k } })),
  };
  cleanWagon(c);
  assert.deepEqual(c.wagonKeys, ['b', 'c', 'd', 'e'], 'いない 仲間・家族・パーティーの 仲間・かさなりを はずし 4人まで');
  const old = { companions: [], partyKeys: [] };
  cleanWagon(old);
  assert.ok(!('wagonKeys' in old), 'ふるい セーブには たさない');
  const got = { wagon: true, companions: [] };
  cleanWagon(got);
  assert.deepEqual(got.wagonKeys, []);

  // セーブを 読む（upgradeSave → repairChar）
  const save = { version: 4, characters: { c1: { id: 'c1', name: 'テツ', job: 'warrior', level: 3, exp: 30, hp: 10, mp: 0, wagon: true, partyKeys: [], wagonKeys: ['m1', 'm9'], companions: [{ key: 'm1', kind: 'monster', species: 'pururin', char: { name: 'ぷるる', species: 'pururin', level: 2, hp: 5 } }] } } };
  const up = upgradeSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(up.data.characters.c1.wagonKeys, ['m1']);
  // 知らない モンスターの 仲間は しまって、馬車からは はずす
  const odd = JSON.parse(JSON.stringify(save));
  odd.characters.c1.companions[0].species = 'future_mon';
  odd.characters.c1.companions[0].char.species = 'future_mon';
  const up2 = upgradeSave(odd);
  assert.deepEqual(up2.data.characters.c1.wagonKeys, []);
  assert.equal(up2.data.characters.c1.stash.companions.length, 1);

  // 引っこしコード
  const ch = JSON.parse(JSON.stringify(save.characters.c1));
  ch.id = 'cwagon1';
  ch.lastPlayed = 100;
  const code = exportCode(ch);
  const parsed = parseCode(code);
  assert.ok(parsed.ok);
  const data = { characters: {} };
  const r = importChar(data, parsed.char);
  assert.ok(r.ok);
  assert.equal(data.characters.cwagon1.wagon, true);
  assert.deepEqual(data.characters.cwagon1.wagonKeys, ['m1']);

  // データ合わせ（べつべつに 仲間に なった まもの・どちらかで もらった 馬車）
  const base = { id: 'c1', name: 'テツ', job: 'warrior', level: 3, exp: 30, hp: 10, mp: 0, partyKeys: [], companions: [], monsterSeq: 2, lastPlayed: 1 };
  const ours = JSON.parse(JSON.stringify(base));
  ours.companions.push({ key: 'm2', kind: 'monster', species: 'pururin', char: { name: 'ぷるる', species: 'pururin', level: 2, hp: 5, exp: 3 } });
  ours.monsterSeq = 3;
  ours.lastPlayed = 5;
  const theirs = JSON.parse(JSON.stringify(base));
  theirs.companions.push({ key: 'm2', kind: 'monster', species: 'wolf', char: { name: 'ウルフ', species: 'wolf', level: 3, hp: 9, exp: 8 } });
  theirs.monsterSeq = 3;
  theirs.wagon = true;
  theirs.wagonKeys = ['m2'];
  theirs.lastPlayed = 9;
  const m = mergeChars(base, ours, theirs);
  assert.equal(m.wagon, true, 'どちらかで もらって いれば 馬車を もっている');
  const wolf = m.companions.find((e) => e.species === 'wolf');
  assert.notEqual(wolf.key, 'm2', 'まものの 番号が かわる');
  assert.deepEqual(m.wagonKeys, [wolf.key], '馬車の 仲間も あたらしい 番号に');
  // こちらで 馬車の 仲間が 酒場へ、とどいた ほうは そのまま → こちら
  const b2 = JSON.parse(JSON.stringify(m));
  const a2 = JSON.parse(JSON.stringify(m));
  a2.wagonKeys = [];
  a2.lastPlayed = 20;
  const t2 = JSON.parse(JSON.stringify(m));
  const m2 = mergeChars(b2, a2, t2);
  assert.deepEqual(m2.wagonKeys, []);
  // 馬車を もらう まえの 版の データと 合わせても 馬車は なくならない
  const t3 = JSON.parse(JSON.stringify(b2));
  delete t3.wagon;
  delete t3.wagonKeys;
  t3.lastPlayed = 99;
  const m3 = mergeChars(b2, JSON.parse(JSON.stringify(b2)), t3);
  assert.equal(m3.wagon, true);
  assert.deepEqual(m3.wagonKeys, [wolf.key]);
});

test('馬車: 宿屋と 教会（馬車の 仲間も 回復・生き返る）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await withWagon(27);
  bot.send({ t: 'menu', action: 'wagon', op: 'in', key: 'npc_gard' });
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  gard.hp = 0;
  c.gold = 5000;
  bot.send({ t: 'svc', kind: 'church', action: 'revive', ref: 'wagon:npc_gard' });
  assert.ok(gard.hp > 0, '教会で 生き返る');
  gard.hp = 1;
  gard.mp = 0;
  // 教会の リストにも 出る
  bot.send({ t: 'svc', kind: 'church', action: 'cure', ref: 'wagon:npc_gard' });
  assert.equal(bot.msgs.filter((m) => m.t === 'svcRes').pop().ok, false, '毒では ない');
  runSteps(world, bot.s, [['inn', 10]]);
  await bot.settle();
  assert.equal(gard.hp, computeStats(gard).maxHp, '宿屋で 回復');
});
