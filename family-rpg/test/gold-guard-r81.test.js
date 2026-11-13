// 第81回: 全滅で へる お金が 少なく なる アクセサリー（docs/plan-r81-gold-guard.md）
//   へそくりのさいふ（4分の1）・金庫番のお守り（10分の1）
//   つけて いない 時は 半分・2つ つけても 足さない・家族で 負けた 時は つけた 人だけ・ボスでも ふつうの 戦いでも・
//   もともと へらない 場面は そのまま・見た目装備では 効かない・店で 買える・引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemKana } from '../public/js/shared/data/items.js';
import { ITEMS_R81, PURSE_ID, VAULT_ID, R81_SHOP_ADD, wipeShare } from '../public/js/shared/data/items-r81.js';
import { perkText } from '../public/js/shared/data/items-r31.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import '../public/js/shared/data/story-c7.js';
import '../public/js/shared/data/story-c7s.js';
import '../public/js/shared/data/story-c7i.js';
import { itemSources } from '../public/js/shared/item-sources.js';
import { isShopGear } from '../public/js/shared/data/items-rare.js';
import { wipeGoldLoss } from '../public/js/shared/world/bank.js';
import { wipeGuard } from '../public/js/shared/world/perks.js';
import { startFieldBattle, startFixedBattle } from '../public/js/shared/world/battles.js';
import { retrySpot, retryTrigger } from '../public/js/shared/world/boss-hints.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { computeStats, canEquipChar, itemCount } from '../public/js/shared/stats.js';
import { bestEquipPlan } from '../public/js/shared/equip-plan.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { sdFloorId } from '../public/js/shared/data/secret.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);

// ───── 品と 計算 ─────
test('2つの 品: アクセサリー・強さの ボーナスなし・せつめいに 数字・店の 品（★1）', () => {
  assert.deepEqual(Object.keys(ITEMS_R81), [PURSE_ID, VAULT_ID]);
  const p = ITEMS[PURSE_ID], v = ITEMS[VAULT_ID];
  assert.equal(p.name, 'へそくりのさいふ');
  assert.equal(v.name, '金庫番のお守り');
  for (const it of [p, v]) {
    assert.equal(it.type, 'acc');
    assert.ok(!it.bonus || !Object.keys(it.bonus).length, '強さは 上がらない');
    assert.ok(!it.resist && !it.atk && !it.def);
    assert.ok(it.price > 0 && isShopGear(it), '店の 品');
    assert.ok(perkText(it), 'メニューの ★の 文');
    assert.ok(!/[一-龯]/.test(itemKana(Object.keys(ITEMS_R81).find((k) => ITEMS[k] === it))));
  }
  assert.ok(p.desc.includes('半分から4分の1'));
  assert.ok(v.desc.includes('半分から10分の1'));
  assert.ok(perkText(p).includes('4分の1') && perkText(v).includes('10分の1'));
  // ねだん: さいふは 序章の ネコのすず（80G）と 同じ くらい・お守りは 第2部の 店の 装備の 上の 方
  assert.ok(p.price <= 300 && p.price >= ITEMS.neko_suzu.price);
  assert.ok(v.price >= 10000);
  // 強さが 同じ（だれでも つけられる）
  const c = { name: 'テ', job: 'warrior', level: 10, exp: 0, equip: {}, items: [] };
  const base = computeStats(c);
  for (const id of [PURSE_ID, VAULT_ID]) {
    assert.ok(canEquipChar(c, id), id);
    const st = computeStats({ ...c, equip: { acc: id } });
    for (const k of ['atk', 'dfn', 'agi', 'mag', 'heal', 'maxHp', 'maxMp']) assert.equal(st[k], base[k], `${id} ${k}`);
  }
});

test('へる 分の 計算: 半分・4分の1・10分の1（はしたは へる 方へ）', () => {
  assert.deepEqual(wipeGoldLoss({ gold: 1000 }), { before: 1000, after: 500, lost: 500 });
  assert.deepEqual(wipeGoldLoss({ gold: 7 }), { before: 7, after: 3, lost: 4 }, '今までと 同じ');
  assert.deepEqual(wipeGoldLoss({ gold: 1000 }, 4), { before: 1000, after: 750, lost: 250 });
  assert.deepEqual(wipeGoldLoss({ gold: 1000 }, 10), { before: 1000, after: 900, lost: 100 });
  assert.deepEqual(wipeGoldLoss({ gold: 30 }, 10), { before: 30, after: 27, lost: 3 });
  assert.deepEqual(wipeGoldLoss({ gold: 7 }, 4), { before: 7, after: 5, lost: 2 });
  assert.deepEqual(wipeGoldLoss({ gold: 0 }, 10), { before: 0, after: 0, lost: 0 });
  assert.deepEqual(wipeGoldLoss({ gold: 100 }, 'x'), { before: 100, after: 50, lost: 50 });
  assert.equal(wipeShare(2), '半分');
  assert.equal(wipeShare(4), '4分の1');
  assert.equal(wipeShare(10), '10分の1');
});

test('効き目は 本当の 装備だけ・2つでも 足さない・見た目装備・魔物は 見ない', () => {
  assert.deepEqual(wipeGuard({ equip: {} }), { div: 2, item: null });
  assert.deepEqual(wipeGuard({ equip: { acc: PURSE_ID } }), { div: 4, item: PURSE_ID });
  assert.deepEqual(wipeGuard({ equip: { acc: VAULT_ID } }), { div: 10, item: VAULT_ID });
  // アクセサリーの わくは 1つだが、2つ ある 時も 大きい 方だけ（足して 40分の1 などには ならない）
  assert.deepEqual(wipeGuard({ equip: { acc: PURSE_ID, acc2: VAULT_ID } }), { div: 10, item: VAULT_ID });
  assert.deepEqual(wipeGuard({ equip: { acc: VAULT_ID, acc2: PURSE_ID } }), { div: 10, item: VAULT_ID });
  // 見た目装備（lookEquip）は 見ない
  assert.deepEqual(wipeGuard({ equip: { acc: 'neko_suzu' }, lookEquip: { acc: PURSE_ID, head: PURSE_ID } }), { div: 2, item: null });
  // 魔物の 仲間（お金を もたない）
  assert.deepEqual(wipeGuard({ species: 'slime', equip: { acc: VAULT_ID } }), { div: 2, item: null });
});

test('みんなさいきょう装備で はずさない・つけない（アクセサリーは そのまま）', () => {
  const c = { name: 'テ', job: 'warrior', level: 30, exp: 0, equip: { acc: PURSE_ID }, items: [] };
  const plan = bestEquipPlan([{ key: 'self', char: c }], { items: [{ id: 'power_ring', n: 1 }, { id: VAULT_ID, n: 1 }] });
  for (const p of plan) for (const ch of p.changes) assert.notEqual(ch.slot, 'acc');
});

// ───── 店 ─────
test('店: さいふは ホシフル村・ルミナの 道具屋（物語に 関係なく いつも）、お守りは 千年前の 町の 道具屋 4つ', () => {
  const none = () => false;
  for (const id of ['village', 'item']) {
    assert.ok(shopItems(SHOPS[id], none).includes(PURSE_ID), id);
    assert.ok(!shopItems(SHOPS[id], none).includes(VAULT_ID), id);
  }
  for (const id of ['past_item', 'c7_item', 'c7s_item', 'c7i_item']) {
    assert.ok(SHOPS[id], id);
    assert.ok(shopItems(SHOPS[id], none).includes(VAULT_ID), id);
    assert.ok(shopItems(SHOPS[id], () => true).includes(VAULT_ID), id);
    // ほかの 店と 同じ ならびの items は かえない（第2部の 道具の ならびは 道具だけ）
    assert.ok(!SHOPS[id].items.includes(VAULT_ID), id);
  }
  for (const [id, list] of Object.entries(R81_SHOP_ADD)) for (const x of list) assert.equal(shopItems(SHOPS[id], none).filter((y) => y === x).length, 1, `${id} 1つだけ`);
  // 品の 手に 入れ方（item-sources.js）にも 店が 出る
  const src = (id) => itemSources(id).filter((x) => x.kind === 'shop').map((x) => x.name);
  assert.ok(src(PURSE_ID).includes('ホシフル村のよろず屋') && src(PURSE_ID).includes('ルミナの道具屋'), src(PURSE_ID).join());
  assert.ok(src(VAULT_ID).includes('里の道具屋'), src(VAULT_ID).join());
  // ほかの 店には ない
  for (const [id, shop] of Object.entries(SHOPS)) {
    if (R81_SHOP_ADD[id]) continue;
    const all = shopItems(shop, () => true);
    assert.ok(!all.includes(PURSE_ID) && !all.includes(VAULT_ID), id);
  }
});

// ───── 遊びの 流れ（ひとりモードと 同じ GameWorld）─────
async function hero(world, name, job = 'warrior') {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  return bot;
}

async function wipeField(world, bots) {
  const lead = bots[0];
  for (const b of bots) world.placeSession(b.s, 'overworld', FIELD.x + bots.indexOf(b), FIELD.y, 'down', true);
  for (const b of bots) await b.settle();
  const sym = { id: 'r81' + Math.random(), sp: 'golem', group: ['golem'], zone: 'outskirts', table: 'outskirts', busy: false };
  const ctx = startFieldBattle(world, lead.s, sym);
  for (const a of ctx.battle.allies) { a.hp = 0; a.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 6; i++) for (const b of bots) await b.settle(4000);
  return ctx;
}

test('ひとり: 店で 買って つける → ふつうの 全滅で 4分の1・文が 出る。はずすと 半分', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(81), rateLimit: false });
  const ken = await hero(world, 'ケン');
  const c = ken.s.char;
  c.gold = 1150;
  // ホシフル村の よろず屋で 買って その場で つける
  world.placeSession(ken.s, 'overworld', FIELD.x, FIELD.y, 'down', true);
  ken.s.openShop = 'village';
  ken.send({ t: 'svc', kind: 'shop', action: 'buy', id: PURSE_ID, who: 'self' });
  await ken.settle();
  assert.equal(c.equip.acc, PURSE_ID, 'つけた');
  assert.equal(c.gold, 1000);
  let from = ken.msgs.length;
  await wipeField(world, [ken]);
  assert.equal(c.gold, 750, '4分の1 へった');
  const end = ken.battles.at(-1);
  assert.equal(end.outcome, 'lose');
  assert.ok(end.lines.some((l) => l.includes('1000G→750G')));
  assert.ok(end.lines.some((l) => l.includes('さいふのおかげで、へったのは4分の1ですんだ')));
  assert.ok(!end.lines.some((l) => l.includes('半分になってしまった')));
  assert.ok(toasts(ken, from).some((t) => t.includes('さいふのおかげで')), '目を覚ました 時の 知らせにも');
  // はずす → 半分
  c.equip.acc = null;
  from = ken.msgs.length;
  await wipeField(world, [ken]);
  assert.equal(c.gold, 375);
  assert.ok(ken.battles.at(-1).lines.some((l) => l.includes('所持金が半分になってしまった…（750G→375G）')));
  assert.ok(!toasts(ken, from).some((t) => t.includes('おかげで')));
  // お守り → 10分の1
  c.equip.acc = VAULT_ID;
  c.gold = 2000;
  await wipeField(world, [ken]);
  assert.equal(c.gold, 1800);
  assert.ok(ken.battles.at(-1).lines.some((l) => l.includes('お守りのおかげで、へったのは10分の1ですんだ')));
  // 見た目装備で さいふに 見せても 効かない（アクセサリーは 見た目装備に ない）
  c.equip.acc = 'neko_suzu';
  c.lookEquip = { acc: PURSE_ID };
  c.gold = 1000;
  await wipeField(world, [ken]);
  assert.equal(c.gold, 500);
  // お金が 0 の 時は 何も 言わない
  c.equip.acc = PURSE_ID;
  c.gold = 0;
  await wipeField(world, [ken]);
  assert.ok(!ken.battles.at(-1).lines.some((l) => l.includes('おかげで')));
});

test('ボスの 戦い: お守りで 10分の1・ヒントと「もう一度いどむ」は そのまま', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(82), rateLimit: false });
  const ken = await hero(world, 'ケン');
  const c = ken.s.char;
  const id = 'c8_bowser';
  const sp = retrySpot(id, retryTrigger(id, null).mapId);
  world.placeSession(ken.s, sp.map, sp.x, sp.y, 'up', true);
  await ken.settle();
  c.equip.acc = VAULT_ID;
  c.gold = 5000;
  ken.choice = 0;
  const from = ken.msgs.length;
  runSteps(world, ken.s, [['battle', id]]);
  let ctx = null;
  for (let i = 0; i < 200 && !ctx; i++) { await tickN(world, 1); ctx = [...world.battles.values()].pop(); }
  assert.ok(ctx?.opts.boss);
  for (const a of ctx.battle.allies) { a.hp = 0; a.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 6; i++) await ken.settle(4000);
  assert.equal(c.gold, 4500);
  const end = ken.battles.at(-1);
  assert.ok(end.lines.some((l) => l.includes('5000G→4500G')));
  assert.ok(end.lines.some((l) => l.includes('お守りのおかげで')));
  const says = ken.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say'));
  assert.ok(says.some((s) => s[2] === BOSS_HINTS[id][0]), 'ヒントは そのまま');
  assert.equal(ken.s.map, sp.map, 'もう一度いどむ');
});

test('家族: いっしょに 全滅 → つけた 人だけ 少なく へる（ほかの 人は 半分）', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(83), rateLimit: false });
  const papa = await hero(world, 'パパ');
  const yui = await hero(world, 'ユイ', 'priest');
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  papa.s.char.gold = 1000;
  yui.s.char.gold = 1000;
  yui.s.char.equip.acc = PURSE_ID;
  const ctx = await wipeField(world, [papa, yui]);
  assert.ok(ctx.sids.includes(yui.s.id), 'ユイも 戦った');
  assert.equal(papa.s.char.gold, 500, 'つけていない パパは 半分');
  assert.equal(yui.s.char.gold, 750, 'つけた ユイは 4分の1');
  assert.ok(!papa.battles.at(-1).lines.some((l) => l.includes('おかげで')));
  assert.ok(yui.battles.at(-1).lines.some((l) => l.includes('さいふのおかげで')));
});

test('もともと へらない 場面は そのまま（負けても よい 戦い〈闘技場〉・ひみつのダンジョン）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(84), rateLimit: false });
  const ken = await hero(world, 'ケン');
  const c = ken.s.char;
  c.equip.acc = PURSE_ID;
  c.gold = 1000;
  // 闘技場（loseOk）
  world.placeSession(ken.s, 'overworld', FIELD.x, FIELD.y, 'down', true);
  await ken.settle();
  const p = startFixedBattle(world, ken.s, [ken.s], 'ar1_1');
  const ctx = [...world.battles.values()].pop();
  for (const a of ctx.battle.allies) { a.hp = 0; a.alive = false; }
  ctx.battle.checkEnd();
  for (let i = 0; i < 4; i++) await ken.settle(4000);
  assert.equal(await p, 'lose');
  assert.equal(c.gold, 1000, '闘技場');
  assert.ok(!ken.battles.at(-1).lines.some((l) => l.includes('おかげで')));
  // ひみつのダンジョン
  const m = MAPS[sdFloorId(3)];
  world.placeSession(ken.s, m.id, m.sd.arrive.x, m.sd.arrive.y, 'up', true);
  await ken.settle();
  const sym = { id: 'r81sd', sp: 'golem', group: ['golem'], zone: 'x', table: 'x', busy: false };
  const ctx2 = startFieldBattle(world, ken.s, sym);
  for (const a of ctx2.battle.allies) { a.hp = 0; a.alive = false; }
  ctx2.battle.checkEnd();
  for (let i = 0; i < 4; i++) await ken.settle(4000);
  assert.equal(c.gold, 1000, 'ひみつのダンジョン');
  assert.ok(ken.battles.at(-1).lines.some((l) => l.includes('お金はへらない')));
  assert.ok(!ken.battles.at(-1).lines.some((l) => l.includes('おかげで')));
});

test('引っこしコード: つけていても ただの 品（新しい 項目なし）・もどすと そのまま', () => {
  const c = { id: 'k1', name: 'ケン', level: 30, job: 'warrior', flags: {}, items: [{ id: VAULT_ID, n: 1 }], equip: { acc: PURSE_ID }, gold: 100 };
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const ch = r.char;
  const eq = ch.equip || {};
  assert.equal(eq.acc, PURSE_ID);
  assert.equal(itemCount(ch, VAULT_ID), 1);
});

test('文字のきまり（使える 漢字・空白）と gameFiles', () => {
  const files = gameFiles();
  for (const f of ['public/js/shared/data/items-r81.js', 'public/js/shared/world/battles.js', 'public/js/shared/world/bank.js', 'public/js/shared/world/perks.js']) {
    const full = files.find((y) => y.endsWith(f));
    assert.ok(full, f);
    // 読みがな（ITEM_KANA の ひらがな）は 目安なので 見ない
    assert.deepEqual(checkFile(full).filter((x) => x.kind !== 'kana'), [], f);
  }
});
