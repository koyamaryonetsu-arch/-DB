// 仲間・馬車・酒場（家族の キャラも 馬車へ・総入れかえ・酒場と 馬車・お店の 装備・まものは レベル1・みちびきの糸）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES, CAVE_ENTRANCE } from '../public/js/shared/maps/overworld.js';
import { SEA_POS } from '../public/js/shared/maps/sea.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { gainExp, expForLevel, computeStats, itemCount, newMonsterCompanion } from '../public/js/shared/stats.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { runScript, runSteps } from '../public/js/shared/world/scripts.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { addMonsterCompanion, befriendLevel, MONSTER_JOIN_LEVEL } from '../public/js/shared/world/party.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode, importChar } from '../public/js/shared/world/transfer.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { memorySyncStore } from '../public/js/shared/world/sync.js';
import { WAGON_SLOTS } from '../public/js/shared/data/wagon.js';
import { ITEMS, itemKana } from '../public/js/shared/data/items.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ESCAPE_ITEM } from '../public/js/shared/data/escape.js';
import { dungeonExit, isDungeonMap } from '../public/js/shared/world/escape.js';
import { grantTreasureMap } from '../public/js/shared/world/treasure.js';
import { floorMapId } from '../public/js/shared/data/treasure.js';
import { openService } from '../public/js/shared/world/services.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const last = (bot, t) => bot.msgs.filter((m) => m.t === t).pop();

function level(world, bot, lv) {
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(lv) - c.exp);
  c.hp = computeStats(c).maxHp;
  world.sendSelf(bot.s);
}

// 家族 2人（ママは おわって、ケンが 遊ぶ）。ケンは 馬車を もっている
async function family(seed = 61) {
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const mama = new Bot(world, 'ママ');
  await mama.login();
  await mama.createAndPlay('priest');
  await mama.settle();
  const mamaId = mama.char.id;
  mama.send({ t: 'quit' });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  level(world, ken, 12);
  const c = world.data.characters[ken.char.id];
  c.flags.c1_clear = true;
  runScript(world, ken.s, 'tavern');
  await ken.settle();
  ken.s.map = 'overworld';
  ken.s.x = FIELD.x;
  ken.s.y = FIELD.y;
  return { world, mama, ken, c, mamaId, fam: 'fam:' + mamaId };
}

const tavern = (bot, msg) => {
  bot.send({ t: 'svc', kind: 'tavern', ...msg });
  return last(bot, 'svcRes');
};
const menu = (bot, msg) => {
  bot.send({ t: 'menu', ...msg });
  return last(bot, 'menuRes');
};

function fieldBattle(world, bot, group = ['pururin']) {
  const sym = { id: 'pw' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false };
  return startFieldBattle(world, bot.s, sym);
}

async function readyUp(world, ctx, id) {
  const a = ctx.battle.get(id);
  for (let i = 0; i < 800 && !a.ready && !ctx.battle.over; i++) await tickN(world, 1);
  return a.ready;
}

async function winNow(world, bot, ctx) {
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 200 && !ctx.battle.over; i++) await tickN(world, 1);
  await tickN(world, 2);
  bot.flushQueue();
}

// ───────────── 家族の キャラも 馬車へ ─────────────
test('家族の キャラも 馬車に 乗れる（メニュー・酒場・HPは そのまま・酒場で 元気いっぱい）', { timeout: 60000 }, async () => {
  const { world, ken, c, fam } = await family();
  for (const k of ['npc_gard', 'npc_mina']) tavern(ken, { action: 'recruit', key: k });
  // 酒場: 家族の キャラを つれていく → パーティー（いっぱいなら 馬車）
  let r = tavern(ken, { action: 'join', key: fam });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', fam]);
  assert.equal(ken.party.supports.find((x) => x.key === fam).family, true);
  // メニュー: パーティー → 馬車（家族の うつしの HPは そのまま）
  const copy = world.parties.get(ken.s.partyId).supports.find((x) => x.key === fam).char;
  copy.hp = 7;
  r = menu(ken, { action: 'wagon', op: 'in', key: fam });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.wagonKeys, [fam]);
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina']);
  const w = ken.party.wagon.find((x) => x.key === fam);
  assert.ok(w && w.family && w.wagon, 'クライアントの 馬車にも 家族');
  assert.equal(w.hp, 7, 'HPは そのまま');
  // 馬車 → パーティー（ガルドと 入れかわる）
  tavern(ken, { action: 'recruit', key: 'npc_poporo' });
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  r = menu(ken, { action: 'wagon', op: 'out', key: fam, with: 'npc_gard' });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.partyKeys, [fam, 'npc_mina', 'npc_poporo']);
  assert.deepEqual(c.wagonKeys, ['npc_gard']);
  assert.equal(ken.party.supports.find((x) => x.key === fam).hp, 7, 'うつしは おなじ（HPも おなじ）');
  // パーティーの 家族と 馬車の 仲間の 入れかえ（家族が 馬車へ。メニューでは 馬車の 仲間を えらんで 入れかえる）
  r = menu(ken, { action: 'wagon', op: 'out', key: 'npc_gard', with: fam });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  assert.deepEqual(c.wagonKeys, [fam]);
  // 馬車 → 酒場 → また 馬車へ（酒場で 休んだので 元気いっぱい）
  r = tavern(ken, { action: 'wagonWait', key: fam });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.wagonKeys, []);
  assert.ok(r.tavern.family.find((e) => e.key === fam && !e.inWagon && !e.inParty));
  r = tavern(ken, { action: 'toWagon', key: fam });
  assert.ok(r.ok, r.text);
  const w2 = ken.party.wagon.find((x) => x.key === fam);
  assert.equal(w2.hp, w2.maxHp, '酒場から 来た うつしは 元気いっぱい');
  assert.ok(r.tavern.family.find((e) => e.key === fam).inWagon, '酒場の じょうほうにも 馬車');
  // 宿屋で 回復（馬車の 家族も）
  const wc = world.parties.get(ken.s.partyId).famCopies.get(`${c.id}|${fam}`);
  wc.hp = 1;
  runSteps(world, ken.s, [['inn', 10]]);
  await ken.settle();
  assert.equal(wc.hp, computeStats(wc).maxHp, '宿屋で 馬車の 家族も 回復');
});

test('家族の キャラ: 本人が パーティーに 来たら うつしは 出ない（パーティーも 馬車も）', { timeout: 60000 }, async () => {
  const { world, mama, ken, c, fam, mamaId } = await family(62);
  tavern(ken, { action: 'toWagon', key: fam });
  assert.deepEqual(ken.party.wagon.map((x) => x.key), [fam]);
  // ママが また 遊んで、ケンの パーティーに 入る
  mama.send({ t: 'play', id: mamaId });
  await mama.settle();
  ken.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  assert.equal(ken.party.members.length, 2);
  assert.deepEqual(ken.party.wagon.map((x) => x.key), [], '本人が いるので 馬車の うつしは 出ない');
  assert.deepEqual(c.wagonKeys, [fam], 'しるしは のこる（本人が ぬけたら また 乗る）');
  // たたかい: 馬車の うつしは 出せない
  for (const b of [ken, mama]) { b.s.map = 'overworld'; b.s.x = FIELD.x; b.s.y = FIELD.y; }
  const ctx = fieldBattle(world, ken, ['golem']);
  for (const e of ctx.battle.enemies) e.atk = 1;
  ken.queue = [];
  mama.queue = [];
  const me = last(ken, 'battleStart').mine[0];
  assert.ok(await readyUp(world, ctx, me));
  const n = ken.msgs.filter((m) => m.t === 'battleRej').length;
  ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: me, key: fam } });
  assert.equal(ken.msgs.filter((m) => m.t === 'battleRej').length, n + 1, '本人が いる 家族の うつしは 出せない');
  assert.equal(ctx.battle.allies.filter((a) => a.charId === mamaId).length, 1, 'ママは 1人だけ');
  // ママが ぬけると また 馬車に
  for (const b of [ken, mama]) for (const a of ctx.battle.allies) if (a.controller === b.s.id) b.send({ t: 'battle', actor: a.id, auto: true });
  await winNow(world, ken, ctx);
  mama.flushQueue();
  mama.send({ t: 'party', action: 'leave' });
  assert.deepEqual(ken.party.wagon.map((x) => x.key), [fam]);
});

test('家族の キャラ: たたかいの いれかえ（家族が 馬車へ・馬車から）と 経験値の おすそわけ', { timeout: 60000 }, async () => {
  const { world, ken, c, fam, mamaId } = await family(63);
  for (const k of ['npc_gard', 'npc_mina']) tavern(ken, { action: 'recruit', key: k });
  tavern(ken, { action: 'join', key: fam });
  tavern(ken, { action: 'recruit', key: 'npc_rin' });
  assert.deepEqual(c.wagonKeys, ['npc_rin'], 'パーティーが いっぱいなので 新しい 仲間は 馬車へ');
  const ctx = fieldBattle(world, ken, ['golem']);
  const b = ctx.battle;
  for (const e of b.enemies) e.atk = 1;
  ken.queue = [];
  const me = last(ken, 'battleStart').mine[0];
  assert.ok(await readyUp(world, ctx, me));
  const mamaA = b.allies.find((a) => a.charId === mamaId);
  assert.ok(mamaA, 'ママの うつしが 戦っている');
  mamaA.hp = 3;
  const rej = () => ken.msgs.filter((m) => m.t === 'battleRej').length;
  const n = rej();
  ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: mamaA.id, key: 'npc_rin' } });
  assert.equal(rej(), n, '家族の キャラも 馬車に もどせる');
  assert.ok(mamaA.fled && mamaA.out);
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_rin']);
  assert.deepEqual(c.wagonKeys, [fam]);
  assert.equal(ken.party.wagon.find((x) => x.key === fam).hp, 3, '馬車の うつしに HPが もどる');
  // 馬車の 家族を また 出す（ガルドと）
  assert.ok(await readyUp(world, ctx, me));
  const gard = b.allies.find((a) => a.name === 'ガルド');
  ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: gard.id, key: fam } });
  assert.equal(rej(), n);
  const back = b.allies.find((a) => a.charId === mamaId);
  assert.ok(back && back.hp === 3, '家族が 馬車から 出る（HPは そのまま）');
  assert.deepEqual(c.partyKeys, [fam, 'npc_mina', 'npc_rin']);
  assert.deepEqual(c.wagonKeys, ['npc_gard']);
  // 勝つ: 馬車の 家族は 本人に パーティーの 半分の おすそわけ（お金は なし）
  for (const a of b.allies) if (a.controller === ken.s.id) ken.send({ t: 'battle', actor: a.id, auto: true });
  await winNow(world, ken, ctx);
  const mc = world.data.characters[mamaId];
  const log = mc.supportLog.at(-1);
  assert.ok(log && log.helper === 'ケン' && log.count >= 1, '戦った 家族の 本人に おすそわけ（ゴーレムは 経験値 0）');
  // ママを 馬車へ（ガルドが パーティーへ）して もう 1回: 馬車の 家族の おすそわけは パーティーの ときの 半分
  menu(ken, { action: 'wagon', op: 'out', key: 'npc_gard', with: fam });
  assert.deepEqual(c.wagonKeys, [fam]);
  world.parties.get(ken.s.partyId).famCopies.get(`${c.id}|${fam}`).hp = 30;
  const e0 = mc.exp, g0 = mc.gold;
  const ctx2 = fieldBattle(world, ken, ['wolf', 'wolf']);
  ken.flushQueue();
  await winNow(world, ken, ctx2);
  assert.equal(ken.battles.at(-1).outcome, 'win');
  const full = ctx2.battle.result.killed.reduce((a, sp) => a + (MONSTERS[sp].exp || 0), 0);
  assert.ok(full > 0);
  assert.equal(mc.exp - e0, Math.floor(Math.floor(full * 0.5) / 2), '馬車の 家族: 本人に パーティーの ときの 半分');
  assert.equal(mc.gold, g0, 'お金の おすそわけは なし');
});

// ───────────── セーブ・引っこし・データ合わせ ─────────────
test('家族の キャラの 馬車の しるしは セーブ・引っこし・データ合わせで のこる（いない 人は はずす）', () => {
  const save = {
    version: 4,
    characters: {
      c1: { id: 'c1', name: 'テツ', job: 'warrior', level: 3, exp: 30, hp: 10, mp: 0, wagon: true, partyKeys: ['fam:c2'], wagonKeys: ['fam:c3', 'm1', 'fam:c1', 'fam:c2'], companions: [{ key: 'm1', kind: 'monster', species: 'pururin', char: { name: 'ぷるる', species: 'pururin', level: 2, hp: 5 } }] },
      c2: { id: 'c2', name: 'ハナ', job: 'priest', level: 2, exp: 10, hp: 9, mp: 3 },
      c3: { id: 'c3', name: 'ソラ', job: 'mage', level: 2, exp: 10, hp: 9, mp: 3 },
    },
  };
  // セーブを 読む（repairChar → cleanWagon）: 自分と パーティーに いる 人は はずす。家族は のこす
  const up = upgradeSave(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(up.data.characters.c1.wagonKeys, ['fam:c3', 'm1']);
  assert.deepEqual(up.data.characters.c1.partyKeys, ['fam:c2']);
  // 引っこしコード: この セーブに いない 家族は はずす
  const ch = JSON.parse(JSON.stringify(up.data.characters.c1));
  ch.lastPlayed = 100;
  const parsed = parseCode(exportCode(ch));
  assert.ok(parsed.ok);
  const data = { characters: { c3: JSON.parse(JSON.stringify(save.characters.c3)) } };
  assert.ok(importChar(data, parsed.char).ok);
  assert.deepEqual(data.characters.c1.wagonKeys, ['fam:c3', 'm1'], 'いる 家族は のこる');
  assert.deepEqual(data.characters.c1.partyKeys, [], 'いない 家族は はずす');
  // データ合わせ: 家族の しるしも のこる
  const base = JSON.parse(JSON.stringify(up.data.characters.c1));
  base.lastPlayed = 1;
  const ours = JSON.parse(JSON.stringify(base));
  ours.lastPlayed = 5;
  const theirs = JSON.parse(JSON.stringify(base));
  theirs.wagonKeys = ['m1', 'fam:c3'];
  theirs.lastPlayed = 9;
  const m = mergeChars(base, ours, theirs);
  assert.deepEqual(m.wagonKeys, ['m1', 'fam:c3'], 'とどいた ほうの ならび（家族の しるしも）');
  assert.deepEqual(m.partyKeys, ['fam:c2']);
});

test('家族の キャラの 馬車の しるし: 家族サーバー ⇄ スマホで 合わせても のこる（いない 人は はずす）', async () => {
  const server = new GameWorld({ offline: false, rng: makeRng(3), checkPassword: () => true, rateLimit: false, syncStore: memorySyncStore(12) });
  const site = new GameWorld({ offline: true, rng: makeRng(4), syncStore: memorySyncStore(5) });
  const conn = (world) => {
    const got = [];
    const s = world.connect({ send: (m) => got.push(JSON.parse(JSON.stringify(m))) });
    world.handle(s, { t: 'hello', pw: 'x' });
    return { ask: (msg, want) => { world.handle(s, msg); return got.filter((m) => m.t === want).pop(); } };
  };
  const sv = conn(server), st = conn(site);
  const up = upgradeSave({
    version: 4,
    characters: {
      c1: { id: 'c1', name: 'テツ', job: 'warrior', level: 3, exp: 30, hp: 10, mp: 0, lastPlayed: 10, wagon: true, partyKeys: [], wagonKeys: ['fam:c2', 'fam:c9'], companions: [] },
      c2: { id: 'c2', name: 'ハナ', job: 'priest', level: 2, exp: 10, hp: 9, mp: 3, lastPlayed: 10 },
    },
  });
  Object.assign(server.data.characters, up.data.characters);
  const out = sv.ask({ t: 'syncOut' }, 'syncPayload');
  const r = st.ask({ t: 'syncIn', text: out.text }, 'syncResult');
  assert.ok(r.ok);
  assert.deepEqual(site.data.characters.c1.wagonKeys, ['fam:c2'], 'おなじ ときに とどいた 家族は のこる。いない 人は はずす');
});

// ───────────── 総入れかえ（メニュー）─────────────
async function eight(seed = 64) {
  const h = await family(seed);
  const { ken } = h;
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) tavern(ken, { action: 'recruit', key: k });
  for (const k of ['npc_rin', 'npc_tina']) tavern(ken, { action: 'recruit', key: k });
  tavern(ken, { action: 'join', key: h.fam });
  addMonsterCompanion(h.world, ken.s, 'pururin', 1, null);
  return h;
}

test('総入れかえ（メニュー）: 1〜4番目が 戦う 仲間、5〜8番目が 馬車。自分は かならず 1〜4番目', { timeout: 60000 }, async () => {
  const { world, ken, c, fam } = await eight();
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  const mon = c.companions.find((e) => e.kind === 'monster').key;
  assert.deepEqual(c.wagonKeys, ['npc_rin', 'npc_tina', fam, mon], 'パーティーが いっぱいなら 馬車へ');
  const arrange = (party, wagon) => menu(ken, { action: 'wagon', op: 'arrange', party, wagon });
  const before = JSON.stringify([c.partyKeys, c.wagonKeys, c.selfPos]);
  const bad = [
    [['npc_rin', 'npc_tina', fam, mon], ['self', 'npc_gard', 'npc_mina', 'npc_poporo']], // 自分が 馬車
    [['npc_rin', 'npc_tina', fam], [mon, 'npc_gard', 'npc_mina', 'npc_poporo']], // 自分が いない
    [['self', 'self', 'npc_rin', 'npc_tina'], [fam, mon, 'npc_gard', 'npc_mina']], // 自分が 2人
    [['self', 'npc_rin', 'npc_tina'], [fam, mon, 'npc_gard', 'npc_mina']], // ポポロが いない
    [['self', 'npc_rin', 'npc_tina', 'npc_tina'], ['npc_poporo', fam, mon, 'npc_gard']], // 2回（ミーナが いない）
    [['self', 'npc_rin', 'npc_tina', 'npc_luca'], [fam, mon, 'npc_gard', 'npc_mina']], // 知らない 仲間（ポポロが いない）
    [['self', 'npc_rin', 'npc_tina', fam, mon], ['npc_gard', 'npc_mina', 'npc_poporo']], // 戦う 仲間が 5人
    [['self', 'npc_rin'], ['npc_tina', fam, mon, 'npc_gard', 'npc_mina', 'npc_poporo']], // 馬車に 6人
    ['x', []],
  ];
  for (const [p, w] of bad) {
    const r = arrange(p, w);
    assert.equal(r.ok, false, JSON.stringify(p) + ' ' + JSON.stringify(w));
  }
  assert.equal(JSON.stringify([c.partyKeys, c.wagonKeys, c.selfPos]), before, 'まちがいは なにも かえない');
  // 4番目に 自分（1〜3番目に 仲間）
  let r = arrange(['npc_rin', fam, mon, 'self'], ['npc_tina', 'npc_gard', 'npc_mina', 'npc_poporo']);
  assert.ok(r.ok, r.text);
  assert.match(r.text, /総入れかえ/);
  assert.deepEqual(c.partyKeys, ['npc_rin', fam, mon]);
  assert.deepEqual(c.wagonKeys, ['npc_tina', 'npc_gard', 'npc_mina', 'npc_poporo']);
  assert.equal(c.selfPos, 3);
  assert.deepEqual(ken.party.supports.map((x) => x.key), ['npc_rin', fam, mon], 'パーティーの ならび');
  assert.equal(ken.party.selfPos, 3);
  assert.deepEqual(ken.party.wagon.map((x) => x.key), ['npc_tina', 'npc_gard', 'npc_mina', 'npc_poporo']);
  // 戦う 仲間を へらして 馬車へ（のこりの 席は あき）
  r = arrange(['self', 'npc_gard'], ['npc_rin', fam, mon, 'npc_tina']);
  assert.equal(r.ok, false, '馬車は 4人まで（7人は 入らない）');
  const extra = ['npc_mina', 'npc_poporo'];
  tavern(ken, { action: 'wait', key: 'npc_rin' });
  tavern(ken, { action: 'wait', key: fam });
  for (const k of extra) tavern(ken, { action: 'wagonWait', key: k });
  assert.deepEqual(c.partyKeys, [mon]);
  assert.deepEqual(c.wagonKeys, ['npc_tina', 'npc_gard']);
  r = arrange(['self'], [mon, 'npc_tina', 'npc_gard']);
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.partyKeys, []);
  assert.deepEqual(c.wagonKeys, [mon, 'npc_tina', 'npc_gard']);
  assert.equal(ken.party.supports.length, 0);
  // 洞窟の 中・馬車が ない・リーダーで ない ときは できない
  ken.s.map = 'cave_b1';
  r = arrange(['npc_tina', 'self'], [mon, 'npc_gard']);
  assert.equal(r.ok, false);
  assert.match(r.text, /入り口で待っている/);
  ken.s.map = 'overworld';
  c.wagon = false;
  r = arrange(['npc_tina', 'self'], [mon, 'npc_gard']);
  assert.equal(r.ok, false);
  c.wagon = true;
  r = arrange(['npc_tina', 'self'], [mon, 'npc_gard']);
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.partyKeys, ['npc_tina']);
  assert.equal(c.selfPos, 1);
  assert.equal(world.parties.get(ken.s.partyId).supports[0].key, 'npc_tina');
});

test('総入れかえ（メニュー）: マルチでは リーダーだけ', { timeout: 60000 }, async () => {
  const { mama, ken, c, mamaId } = await family(65);
  tavern(ken, { action: 'recruit', key: 'npc_gard' });
  mama.send({ t: 'play', id: mamaId });
  await mama.settle();
  ken.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  const mc = mama.s.char;
  mc.wagon = true;
  mc.wagonKeys = [];
  const r = menu(mama, { action: 'wagon', op: 'arrange', party: ['self'], wagon: [] });
  assert.equal(r.ok, false, 'リーダーで ない 人は できない');
  const r2 = menu(ken, { action: 'wagon', op: 'arrange', party: ['self'], wagon: ['npc_gard'] });
  assert.ok(r2.ok, r2.text);
  assert.deepEqual(c.wagonKeys, ['npc_gard']);
});

// ───────────── 総入れかえ（たたかい）─────────────
test('総入れかえ（たたかい）: 戦う 仲間を まとめて えらびなおす（番は 1回・自分は そのまま）', { timeout: 60000 }, async () => {
  const { world, ken, c, fam } = await eight(66);
  const mon = c.companions.find((e) => e.kind === 'monster').key;
  const ctx = fieldBattle(world, ken, ['golem']);
  const b = ctx.battle;
  for (const e of b.enemies) e.atk = 1;
  ken.queue = [];
  const me = last(ken, 'battleStart').mine[0];
  const rej = () => ken.msgs.filter((m) => m.t === 'battleRej');
  const swapAll = (all, actor = me) => ken.send({ t: 'battle', actor, cmd: { type: 'swap', all } });
  // 番が 来る 前は できない
  b.get(me).ready = false;
  let n = rej().length;
  swapAll(['npc_rin', 'npc_tina', fam]);
  assert.equal(rej().length, n + 1);
  assert.ok(await readyUp(world, ctx, me));
  // まちがい: 人数・知らない 仲間・かさなり・だれも かわらない・死んでいる 仲間
  const rin = c.companions.find((e) => e.key === 'npc_rin').char;
  rin.hp = 0;
  n = rej().length;
  swapAll(['npc_rin', 'npc_tina']);
  swapAll(['npc_rin', 'npc_tina', fam, mon]);
  swapAll(['npc_luca', 'npc_tina', fam]);
  swapAll(['npc_tina', 'npc_tina', fam]);
  swapAll(['npc_gard', 'npc_mina', 'npc_poporo']);
  swapAll(['npc_rin', 'npc_mina', 'npc_poporo']);
  swapAll('npc_rin');
  assert.equal(rej().length, n + 7);
  assert.match(rej().pop().reason, /おかしい/);
  rin.hp = computeStats(rin).maxHp;
  assert.equal(b.get(me).ready, true, 'まちがいでは 番を 使わない');
  // 3人 まとめて 入れかえ
  const gardA = b.allies.find((a) => a.name === 'ガルド');
  gardA.hp = 0;
  gardA.alive = false;
  swapAll(['npc_mina', fam, 'npc_tina']);
  assert.equal(rej().length, n + 7, 'とおる');
  assert.equal(b.get(me).ready, false, '番を 使った');
  assert.equal(b.get(me).atb, 0);
  assert.ok(b.allies.some((a) => a.id === me), '自分は そのまま 戦う');
  const names = b.allies.map((a) => a.name);
  assert.ok(names.includes('ミーナ') && names.includes('ママ') && names.includes('ティナ'));
  assert.ok(!names.includes('ガルド') && !names.includes('ポポロ'));
  assert.equal(b.allies.length, 4);
  assert.deepEqual(c.partyKeys, [fam, 'npc_mina', 'npc_tina'], '入れかわった 場所に 入る');
  assert.deepEqual(c.wagonKeys, ['npc_rin', 'npc_poporo', 'npc_gard', mon], '出た 仲間は 馬車の 場所へ');
  assert.equal(c.companions.find((e) => e.key === 'npc_gard').char.hp, 0, '死んでいた ガルドは 馬車へ（HPは もどる）');
  await tickN(world, 1);
  const ev = ken.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).filter((e) => e.swap).pop();
  assert.equal(ev.swap.list.length, 2, '1つの できごとに 2人ぶん');
  assert.ok(ev.lines.includes('ガルドは馬車に運びこまれた。'));
  assert.ok(ev.lines.some((l) => /ママとティナが馬車から飛び出した！|ティナとママが馬車から飛び出した！/.test(l)));
  assert.equal(ev.joined.length, 2);
  // 勝ったら そのまま
  for (const a of b.allies) if (a.controller === ken.s.id) ken.send({ t: 'battle', actor: a.id, auto: true });
  await winNow(world, ken, ctx);
  assert.deepEqual(ken.party.supports.map((x) => x.key), [fam, 'npc_mina', 'npc_tina']);
  assert.deepEqual(ken.party.wagon.map((x) => x.key), ['npc_rin', 'npc_poporo', 'npc_gard', mon]);
});

test('総入れかえ（たたかい）: あいている 場所にも 入れる・自分が 馬車に いる ときは できない', { timeout: 60000 }, async () => {
  const { world, ken, c } = await family(67);
  for (const k of ['npc_gard', 'npc_mina', 'npc_rin']) tavern(ken, { action: 'recruit', key: k });
  menu(ken, { action: 'wagon', op: 'arrange', party: ['self', 'npc_gard'], wagon: ['npc_mina', 'npc_rin'] });
  assert.deepEqual(c.partyKeys, ['npc_gard']);
  assert.deepEqual(c.wagonKeys, ['npc_mina', 'npc_rin']);
  const ctx = fieldBattle(world, ken, ['golem']);
  const b = ctx.battle;
  for (const e of b.enemies) e.atk = 1;
  ken.queue = [];
  const me = last(ken, 'battleStart').mine[0];
  const rej = () => ken.msgs.filter((m) => m.t === 'battleRej').length;
  // 自分が 馬車に 乗る（ミーナが 代わり）→ 代わりの 番では 総入れかえは できない
  assert.ok(await readyUp(world, ctx, me));
  ken.send({ t: 'battle', actor: me, cmd: { type: 'swap', out: me, key: 'npc_mina' } });
  const mina = b.allies.find((a) => a.name === 'ミーナ');
  assert.ok(mina && mina.controller === ken.s.id);
  assert.ok(await readyUp(world, ctx, mina.id));
  let n = rej();
  ken.send({ t: 'battle', actor: mina.id, cmd: { type: 'swap', all: ['npc_gard', 'npc_rin'] } });
  assert.equal(rej(), n + 1, '自分が 馬車に いる ときは ひとりずつ');
  ken.send({ t: 'battle', actor: mina.id, cmd: { type: 'swap', out: mina.id, key: 'self' } });
  assert.equal(rej(), n + 1, '自分が もどる');
  // あいている 場所に 2人 入る（4人に ふえる）
  const me2 = b.allies.find((a) => a.charId === c.id).id;
  assert.ok(await readyUp(world, ctx, me2));
  n = rej();
  ken.send({ t: 'battle', actor: me2, cmd: { type: 'swap', all: ['npc_gard', 'npc_mina', 'npc_rin'] } });
  assert.equal(rej(), n, 'ふえる 入れかえも できる');
  assert.equal(b.allies.length, 4);
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_rin']);
  assert.deepEqual(c.wagonKeys, []);
  await tickN(world, 1);
  const ev = ken.msgs.filter((m) => m.t === 'battleEv').flatMap((m) => m.evs).filter((e) => e.swap?.list).pop();
  assert.deepEqual(ev.swap.list.map((x) => x.out), [null, null], '入れかわる 人は いない（ふえる）');
});

// ───────────── 酒場と 馬車 ─────────────
test('酒場: 新しい 仲間は パーティー → 馬車 → どちらも いっぱいなら 入れかわり（パーティーか 馬車の 人が 酒場へ）', { timeout: 60000 }, async () => {
  const { ken, c, fam } = await family(68);
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) tavern(ken, { action: 'recruit', key: k });
  assert.deepEqual(c.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  let r = tavern(ken, { action: 'recruit', key: 'npc_rin' });
  assert.ok(r.ok);
  assert.match(r.text, /馬車に乗りこんだ/);
  assert.deepEqual(c.wagonKeys, ['npc_rin']);
  r = tavern(ken, { action: 'join', key: fam });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /馬車に乗りこんだ/);
  tavern(ken, { action: 'recruit', key: 'npc_tina' });
  // 酒場で 待っている 仲間（まもの）も つれていく → 馬車
  addMonsterCompanion(ken.world, ken.s, 'pururin', 1, '__tavern');
  const mon = c.companions.find((e) => e.kind === 'monster').key;
  r = tavern(ken, { action: 'join', key: mon });
  assert.ok(r.ok, r.text);
  assert.equal(c.wagonKeys.length, WAGON_SLOTS);
  assert.deepEqual(c.wagonKeys, ['npc_rin', fam, 'npc_tina', mon]);
  // どちらも いっぱい: 入れかわる 人が いないと だめ
  const gard = c.companions.find((e) => e.key === 'npc_gard').char;
  tavern(ken, { action: 'wait', key: 'npc_gard' });
  assert.deepEqual(c.partyKeys, ['npc_mina', 'npc_poporo']);
  tavern(ken, { action: 'join', key: 'npc_gard' });
  r = tavern(ken, { action: 'recruit', key: 'npc_luca' });
  assert.equal(r.ok, true);
  assert.match(r.text, /仲間になった/);
  assert.ok(!c.partyKeys.includes('npc_luca') && !c.wagonKeys.includes('npc_luca'), 'いっぱいなら 酒場で 待つ');
  assert.ok(gard);
  // 酒場の ルカを つれていく: 馬車の ティナと 入れかわり（ティナは 酒場へ・装備は ふくろへ）
  const tina = c.companions.find((e) => e.key === 'npc_tina').char;
  const fan = tina.equip.weapon;
  r = tavern(ken, { action: 'join', key: 'npc_luca' });
  assert.equal(r.ok, false);
  assert.ok(r.full, 'どちらも いっぱい');
  r = tavern(ken, { action: 'join', key: 'npc_luca', swap: 'npc_tina' });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.wagonKeys, ['npc_rin', fam, 'npc_luca', mon]);
  assert.equal(tina.equip.weapon, null);
  assert.ok(itemCount(c, fan) >= 1);
  // パーティーの 人と 入れかわる（家族の キャラは 装備を しまわない）
  r = tavern(ken, { action: 'join', key: 'npc_tina', swap: fam });
  assert.ok(r.ok, r.text);
  assert.deepEqual(c.wagonKeys, ['npc_rin', 'npc_tina', 'npc_luca', mon]);
  // 酒場の じょうほう
  const info = r.tavern;
  assert.deepEqual(info.wagon.keys, c.wagonKeys);
  assert.ok(info.roster.find((e) => e.key === 'npc_tina').inWagon);
  assert.ok(!info.family.find((e) => e.key === fam).inWagon);
});

// ───────────── お店: 馬車の 仲間も その場で 装備 ─────────────
test('お店・ふくろ: 馬車の 仲間も その場で 装備できる（セーブにも のこる）', { timeout: 60000 }, async () => {
  const { world, ken, c } = await family(69);
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin']) tavern(ken, { action: 'recruit', key: k });
  assert.deepEqual(c.wagonKeys, ['npc_rin']);
  c.gold = 5000;
  c.flags.c1_treant = true;
  assert.ok(openService(world, ken.s, 'shop', 'weapon'));
  ken.send({ t: 'svc', kind: 'shop', action: 'buy', id: 'iron_claw', who: 'npc_rin' });
  const r = last(ken, 'svcRes');
  assert.ok(r.ok && r.equipped, r.text);
  const rin = c.companions.find((e) => e.key === 'npc_rin').char;
  assert.equal(rin.equip.weapon, 'iron_claw');
  assert.equal(ken.party.wagon.find((x) => x.key === 'npc_rin').equip.weapon, 'iron_claw', '馬車の じょうほうも かわる');
  // ふくろの 道具 → 装備する（馬車の 仲間）
  c.items.push({ id: 'leather_hat', n: 1 });
  const m = menu(ken, { action: 'equip', id: 'leather_hat', who: 'npc_rin' });
  assert.ok(m.ok, m.text);
  assert.equal(rin.equip.head, 'leather_hat');
  // セーブして 読みなおしても のこる
  const saved = upgradeSave(JSON.parse(JSON.stringify(world.data)));
  const rin2 = saved.data.characters[c.id].companions.find((e) => e.key === 'npc_rin').char;
  assert.equal(rin2.equip.weapon, 'iron_claw');
  assert.equal(rin2.equip.head, 'leather_hat');
  assert.deepEqual(saved.data.characters[c.id].wagonKeys, ['npc_rin']);
});

// ───────────── 仲間に なる まもの ─────────────
test('仲間に なる まものは 主人公の レベルに かかわらず レベル1（HP・MPは まんたん、ふつうに そだつ）', { timeout: 60000 }, async () => {
  const { world, ken, c } = await family(70);
  level(world, ken, 30);
  assert.equal(befriendLevel(c, 'golem'), 1);
  assert.equal(MONSTER_JOIN_LEVEL, 1);
  c.flags.monster_bond = true;
  world.offerBefriend(ken.s, 'pururin', 25);
  ken.choice = 0;
  await ken.settle();
  const e = c.companions.find((x) => x.kind === 'monster');
  assert.ok(e, '仲間に なった');
  assert.equal(e.char.level, 1, 'レベル1');
  const st = computeStats(e.char);
  const plain = computeStats(newMonsterCompanion({ id: 'x', species: 'pururin', level: 1 }));
  assert.equal(st.maxHp, plain.maxHp);
  assert.equal(e.char.hp, st.maxHp);
  assert.equal(e.char.mp, st.maxMp);
  assert.equal(e.char.exp, expForLevel(1));
  const ups = gainExp(e.char, expForLevel(4) - e.char.exp);
  assert.equal(e.char.level, 4);
  assert.equal(ups.length, 3, 'ふつうに そだつ');
});

test('仲間に なる まもの: パーティーが いっぱいなら 馬車へ。どちらも いっぱいの ときだけ だれが 酒場へ もどるか えらぶ', { timeout: 60000 }, async () => {
  const { world, ken, c, fam } = await family(71);
  c.flags.monster_bond = true;
  for (const k of ['npc_gard', 'npc_mina', 'npc_poporo']) tavern(ken, { action: 'recruit', key: k });
  const said = (re, from = 0) => ken.msgs.slice(from).filter((m) => m.t === 'script').some((m) => m.steps.some((st) => st[0] === 'say' && re.test(st[2])));
  const choices = (from = 0) => ken.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((st) => st[0] === 'choice'));
  let n = ken.msgs.length;
  world.offerBefriend(ken.s, 'pururin');
  ken.choice = 0;
  await ken.settle();
  const mon1 = c.companions.find((x) => x.kind === 'monster');
  assert.deepEqual(c.wagonKeys, [mon1.key], 'パーティーが いっぱいなので 馬車へ');
  assert.ok(said(/馬車に乗りこんだ！/, n));
  assert.equal(choices(n).length, 1, '「仲間にしますか？」だけ（だれが 酒場へ は 聞かない）');
  // 洞窟の 中では 入り口の 馬車へ
  ken.s.map = 'cave_b1';
  n = ken.msgs.length;
  world.offerBefriend(ken.s, 'koumorin');
  await ken.settle();
  assert.equal(c.wagonKeys.length, 2);
  assert.ok(said(/入り口で待つ馬車へ向かった/, n));
  ken.s.map = 'overworld';
  tavern(ken, { action: 'toWagon', key: fam });
  world.offerBefriend(ken.s, 'wolf');
  await ken.settle();
  assert.equal(c.wagonKeys.length, WAGON_SLOTS);
  // どちらも いっぱい: パーティーと 馬車の みんなと 新しい まものから えらぶ
  n = ken.msgs.length;
  ken.choice = 0;
  // 1つめの えらび（はい）→ 2つめ（だれが 酒場へ）は 馬車の 家族（5ばんめ）
  const answers = [0, 5];
  const orig = ken.onMsg.bind(ken);
  ken.onMsg = (m) => {
    if (m.t === 'script' && m.steps.at(-1)?.[0] === 'choice') ken.choice = answers.shift() ?? 0;
    orig(m);
  };
  world.offerBefriend(ken.s, 'goblin');
  await ken.settle();
  ken.onMsg = orig;
  const ch = choices(n).find((st) => st[1] === 'だれが酒場へもどる？');
  assert.ok(ch, 'だれが 酒場へ もどるか 聞く');
  assert.equal(ch[2].length, 3 + WAGON_SLOTS + 1, 'パーティー 3人 + 馬車 4人 + 新しい まもの');
  assert.match(ch[2][5], /ママ（馬車）/);
  assert.match(ch[2][0], /（パーティー）/);
  assert.ok(said(/パーティーも馬車もいっぱい/, n));
  const gob = c.companions.find((x) => x.species === 'goblin');
  assert.ok(gob && c.wagonKeys.includes(gob.key), '新しい まものが 家族の 席へ');
  assert.ok(!c.wagonKeys.includes(fam) && !c.partyKeys.includes(fam), '家族は 酒場へ');
  assert.equal(gob.char.level, 1);
});

// ───────────── みちびきの糸 ─────────────
test('みちびきの糸: 道具屋で 売っている・読みがな・洞窟の 中だけ', () => {
  const it = ITEMS[ESCAPE_ITEM];
  assert.equal(it.name, 'みちびきの糸');
  assert.ok(it.price >= 60 && it.price <= 80);
  assert.equal(it.type, 'use');
  assert.ok(it.field && !it.battle);
  assert.equal(itemKana(ESCAPE_ITEM), 'みちびきのいと');
  for (const id of ['village', 'item', 'port_item']) assert.ok(shopItems(SHOPS[id]).includes(ESCAPE_ITEM), id);
  assert.ok(isDungeonMap(MAPS.cave_b2) && isDungeonMap(MAPS.tower_2f) && isDungeonMap(MAPS.sea_cave));
  assert.ok(!isDungeonMap(MAPS.overworld) && !isDungeonMap(MAPS.casino) && !isDungeonMap(MAPS.medal_castle), 'たてものの 中は のぞく');
});

test('みちびきの糸: なげきの洞窟 地下2階 → 洞窟の 入り口の 外（ついていく 家族も）・外では 使えない', { timeout: 60000 }, async () => {
  const { world, mama, ken, c, mamaId } = await family(72);
  c.items.push({ id: ESCAPE_ITEM, n: 2 });
  // 外では 使えない（へらない）
  let r = menu(ken, { action: 'useItem', id: ESCAPE_ITEM });
  assert.equal(r.ok, false);
  assert.match(r.text, /ここでは使えない/);
  assert.equal(itemCount(c, ESCAPE_ITEM), 2);
  // ママも いっしょに（ついていく）
  mama.send({ t: 'play', id: mamaId });
  await mama.settle();
  ken.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  // 洞窟の 入り口から 入る（ワープ）→ 地下2階へ（はじめての イベントは もう 見た）
  c.flags.c1_cave = true;
  world.placeSession(ken.s, 'overworld', CAVE_ENTRANCE.x + 0.5, CAVE_ENTRANCE.y + 1.5, 'up', true);
  ken.s.x = CAVE_ENTRANCE.x + 0.5;
  ken.s.y = CAVE_ENTRANCE.y + 0.5;
  world.onEnterTile(ken.s, CAVE_ENTRANCE.x, CAVE_ENTRANCE.y);
  assert.equal(ken.s.map, 'cave_b1');
  assert.equal(c.dungeonFrom?.map, 'overworld', '入った 場所を おぼえる');
  world.placeSession(ken.s, 'cave_b2', 20.5, 20.5, 'down', true);
  world.placeSession(mama.s, 'cave_b2', 21.5, 20.5, 'down', true);
  mama.s.follow = true;
  assert.equal(c.dungeonFrom?.in, 'cave_b1', '階を おりても わすれない');
  r = menu(ken, { action: 'useItem', id: ESCAPE_ITEM });
  assert.ok(r.ok, r.text);
  assert.match(r.text, /なげきの洞窟の外/);
  assert.equal(ken.s.map, 'overworld');
  assert.ok(Math.abs(ken.s.x - (CAVE_ENTRANCE.x + 0.5)) < 1.5 && ken.s.y > CAVE_ENTRANCE.y && ken.s.y < CAVE_ENTRANCE.y + 3, '入り口の すぐ 外');
  assert.equal(mama.s.map, 'overworld', 'ついていく 家族も いっしょ');
  assert.equal(itemCount(c, ESCAPE_ITEM), 1);
  assert.equal(c.dungeonFrom, undefined, '外に 出たら わすれる');
  // カジノの 中では 使えない
  world.placeSession(ken.s, 'casino', 14, 15, 'up', true);
  r = menu(ken, { action: 'useItem', id: ESCAPE_ITEM });
  assert.equal(r.ok, false);
  assert.equal(itemCount(c, ESCAPE_ITEM), 1);
});

test('みちびきの糸: 嵐の塔の 屋上・宝の洞窟・読みこみなおし・新しい 何階もの 洞窟', { timeout: 60000 }, async () => {
  const { world, ken, c } = await family(73);
  c.items.push({ id: ESCAPE_ITEM, n: 9 });
  const use = () => menu(ken, { action: 'useItem', id: ESCAPE_ITEM });
  // 嵐の塔の 屋上 → 塔の 入り口の 外（海）
  world.placeSession(ken.s, 'sea', SEA_POS.towerDoor.x + 0.5, SEA_POS.towerDoor.y + 1.6, 'up', true);
  world.placeSession(ken.s, 'tower_1f', 11, 19.6, 'up', true);
  world.placeSession(ken.s, 'tower_3f', 10, 12, 'up', true);
  let r = use();
  assert.ok(r.ok, r.text);
  assert.equal(ken.s.map, 'sea');
  assert.ok(Math.hypot(ken.s.x - (SEA_POS.towerDoor.x + 0.5), ken.s.y - (SEA_POS.towerDoor.y + 1.6)) < 0.01);
  // 宝の洞窟 地下2階 → 地図の 場所（ほった 穴の そば）
  const rec = grantTreasureMap(world, c, { lv: 3, map: 'overworld' });
  const f2 = floorMapId(rec, 2);
  assert.ok(MAPS[f2]?.tm, '宝の洞窟の 地下2階');
  world.placeSession(ken.s, f2, MAPS[f2].tm.arrive.x, MAPS[f2].tm.arrive.y, 'down', true);
  r = use();
  assert.ok(r.ok, r.text);
  assert.equal(ken.s.map, 'overworld');
  assert.ok(Math.abs(ken.s.x - (rec.x + 0.5)) <= 2.5 && Math.abs(ken.s.y - (rec.y + 0.5)) <= 2.5, '地図の 場所の そば');
  // 読みこみなおし（セーブから）: 洞窟の 中で おわって また はじめても 使える
  world.placeSession(ken.s, 'overworld', CAVE_ENTRANCE.x + 0.5, CAVE_ENTRANCE.y + 0.5, 'up', true);
  world.placeSession(ken.s, 'cave_b1', 24, 32.6, 'up', true);
  world.placeSession(ken.s, 'cave_b2', 43.5, 30.5, 'down', true);
  ken.send({ t: 'quit' });
  const saved = JSON.parse(JSON.stringify(world.data));
  const world2 = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, data: saved });
  const ken2 = new Bot(world2, 'ケン');
  await ken2.login();
  ken2.send({ t: 'play', id: c.id });
  await ken2.settle();
  assert.equal(ken2.s.map, 'cave_b2');
  assert.equal(ken2.s.char.dungeonFrom?.map, 'overworld');
  ken2.send({ t: 'menu', action: 'useItem', id: ESCAPE_ITEM });
  assert.ok(last(ken2, 'menuRes').ok);
  assert.equal(ken2.s.map, 'overworld');
  // 新しい 何階もの 洞窟（データを たさなくても ワープを たどる）。出口が 2つ ある ときは 入った ほう
  const mk = (id, warps) => ({ id, name: `ためしの洞窟　${id}`, kind: 'dungeon', warps });
  const tmp = {
    zz_f1: mk('zz_f1', [{ x: 1, y: 1, to: { map: 'overworld', x: 10.5, y: 10.5, dir: 'down' } }, { x: 2, y: 1, to: { map: 'zz_f2', x: 2, y: 2 } }]),
    zz_f2: mk('zz_f2', [{ x: 1, y: 1, to: { map: 'zz_f1', x: 2, y: 2 } }, { x: 2, y: 1, to: { map: 'zz_f3', x: 2, y: 2 } }]),
    zz_f3: mk('zz_f3', [{ x: 1, y: 1, to: { map: 'zz_f2', x: 2, y: 2 } }, { x: 2, y: 1, to: { map: 'overworld', x: 90.5, y: 30.5, dir: 'down' } }]),
  };
  try {
    Object.assign(MAPS, tmp);
    const s = { map: 'zz_f2', char: { dungeonFrom: { map: 'overworld', x: 10, y: 9, in: 'zz_f1' } } };
    assert.deepEqual(dungeonExit(world, s), { map: 'overworld', x: 10.5, y: 10.5, dir: 'down' }, '入った 入り口へ');
    s.char.dungeonFrom = { map: 'overworld', x: 90, y: 29, in: 'zz_f3' };
    assert.deepEqual(dungeonExit(world, s), { map: 'overworld', x: 90.5, y: 30.5, dir: 'down' }, 'もう 1つの 入り口から 入った とき');
    s.char.dungeonFrom = null;
    s.map = 'zz_f3';
    assert.equal(dungeonExit(world, s).x, 90.5, 'おぼえて いなければ 近い 出口');
  } finally {
    for (const k of Object.keys(tmp)) delete MAPS[k];
  }
});

test('家族の キャラを 消すと、ほかの 人の パーティー・馬車からも はずれる（見えない 席が のこらない）', { timeout: 60000 }, async () => {
  const { world, mama, ken, c, fam, mamaId } = await family(74);
  tavern(ken, { action: 'toWagon', key: fam });
  assert.deepEqual(ken.party.wagon.map((x) => x.key), [fam]);
  mama.send({ t: 'deleteChar', id: mamaId, confirm: 'ママ' });
  assert.ok(!world.data.characters[mamaId]);
  assert.deepEqual(c.wagonKeys, [], '馬車の しるしも はずれる');
  assert.deepEqual(ken.party.wagon, [], 'クライアントの 馬車も すぐ かわる');
});
