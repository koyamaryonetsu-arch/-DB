// 見た目装備（shared/look-equip.js・メニューの lookEquip）: 見た目だけ かわって 強さは そのまま
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld, equipLook } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { computeStats, addItem, removeItem, itemCount, gainExp, expForLevel } from '../public/js/shared/stats.js';
import { recruitNpc, addMonsterCompanion, supportInfo } from '../public/js/shared/world/party.js';
import { allyFromCharacter } from '../public/js/shared/battle.js';
import { shownEquip, shownEquipKey, lookChoices, ownerTeam, cleanLookEquip, LOOK_NONE } from '../public/js/shared/look-equip.js';
import { repairChar, upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { Bot, tickN } from './helpers.js';

async function hero(job = 'warrior', level = 10) {
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const s = bot.s;
  gainExp(s.char, expForLevel(level) - s.char.exp);
  return { world, bot, s, c: s.char };
}
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const look = (bot, slot, id, who = 'self') => {
  bot.send({ t: 'menu', action: 'lookEquip', who, slot, id });
  return lastMenu(bot);
};
const statKey = (c) => JSON.stringify(computeStats(c));

test('見た目装備: ふくろの 物を えらぶと 見た目だけ かわる（強さ・本当の 装備は そのまま）', async () => {
  const { bot, c } = await hero('warrior');
  c.equip.weapon = 'iron_sword';
  addItem(c, 'oak_staff', 1);
  const before = statKey(c);
  // 戦士は かしのつえを 装備できないが、見た目には できる
  const r = look(bot, 'weapon', 'oak_staff');
  assert.equal(r.ok, true, r.text);
  assert.deepEqual(c.lookEquip, { weapon: 'oak_staff' });
  assert.equal(c.equip.weapon, 'iron_sword', '本当の 装備は そのまま');
  assert.equal(statKey(c), before, '強さは かわらない');
  assert.equal(itemCount(c, 'oak_staff'), 1, 'ふくろの 物は へらない');
  assert.equal(shownEquip(c).weapon, 'oak_staff');
  assert.equal(equipLook(c).split(',')[0], 'oak_staff', 'ほかの 人に おくる 見た目');
  // 自分の 画面にも とどく（self）
  assert.equal(bot.char.lookEquip?.weapon, 'oak_staff');
  // 今の装備と同じ に もどす
  const r2 = look(bot, 'weapon', null);
  assert.equal(r2.ok, true);
  assert.equal(c.lookEquip, undefined, 'からっぽに なったら 消す');
  assert.equal(shownEquip(c).weapon, 'iron_sword');
});

test('見た目装備: 装備なし（武器・よろい・頭）と、全部 もとに もどす', async () => {
  const { bot, c } = await hero('warrior');
  c.equip.weapon = 'iron_sword';
  c.equip.armor = 'iron_armor';
  c.equip.head = 'leather_hat';
  const before = statKey(c);
  for (const sl of ['weapon', 'armor', 'head']) assert.equal(look(bot, sl, LOOK_NONE).ok, true);
  assert.equal(shownEquipKey(c), ',,,', '武器も よろいも かぶとも 見えない');
  assert.equal(statKey(c), before);
  // 絵: 武器なし・ふだんの 服（よろいなし）・ぼうしなし
  const o = lookToOpts({}, 'warrior', shownEquip(c));
  assert.equal(o.weapon, undefined);
  assert.equal(o.outfit, 'under');
  assert.equal(o.hat, null);
  // 全部 もどす
  assert.equal(look(bot, 'all', null).ok, true);
  assert.equal(c.lookEquip, undefined);
  assert.equal(shownEquipKey(c), 'iron_sword,iron_armor,,leather_hat');
});

test('見た目装備: 持っていない物・部位が ちがう物・知らない 部位・モンスターは ことわる', async () => {
  const { world, bot, s, c } = await hero('warrior');
  c.equip.weapon = 'iron_sword';
  // 持っていない
  assert.equal(itemCount(c, 'oak_staff'), 0);
  let r = look(bot, 'weapon', 'oak_staff');
  assert.equal(r.ok, false);
  assert.equal(c.lookEquip, undefined);
  // 部位が ちがう（たてを 武器の 見た目に）
  addItem(c, 'leather_shield', 1);
  r = look(bot, 'weapon', 'leather_shield');
  assert.equal(r.ok, false);
  // 道具は だめ
  r = look(bot, 'weapon', 'herb');
  assert.equal(r.ok, false);
  // 知らない 部位・品物・アクセサリー
  assert.equal(look(bot, 'acc', 'leather_shield').ok, false);
  assert.equal(look(bot, 'bag', LOOK_NONE).ok, false);
  assert.equal(look(bot, 'weapon', 'no_such_item').ok, false);
  assert.equal(look(bot, 'all', 'oak_staff').ok, false);
  // 知らない 人
  assert.equal(look(bot, 'weapon', LOOK_NONE, 'nobody').ok, false);
  assert.equal(c.lookEquip, undefined, '何も かわらない');
  // モンスターの 仲間は 見た目装備が ない
  const m = addMonsterCompanion(world, s, 'pururin', 5);
  assert.ok(m.ok);
  const key = c.companions[c.companions.length - 1].key;
  r = look(bot, 'weapon', LOOK_NONE, key);
  assert.equal(r.ok, false);
  assert.equal(c.companions.find((e) => e.key === key).char.lookEquip, undefined);
});

test('見た目装備: 持っている物 = ふくろ・自分と 仲間が 装備している物（きたえた 物は もとの 物）', async () => {
  const { world, bot, s, c } = await hero('warrior');
  recruitNpc(world, s, 'npc_mina', { force: true });
  const mina = c.companions.find((e) => e.key === 'npc_mina').char;
  mina.equip.weapon = 'oak_staff';
  c.equip.weapon = 'iron_sword+2';
  addItem(c, 'iron_sword+2', 1);
  removeItem(c, 'oak_staff', itemCount(c, 'oak_staff'));
  const choices = lookChoices('weapon', c, ownerTeam(c));
  assert.ok(choices.includes('oak_staff'), '仲間が 装備している 物');
  assert.ok(choices.includes('iron_sword'), 'きたえた 物は もとの 物として');
  assert.ok(!choices.includes('iron_sword+2'));
  // 仲間の つえを 自分の 見た目に
  assert.equal(look(bot, 'weapon', 'oak_staff').ok, true);
  assert.equal(mina.equip.weapon, 'oak_staff', '仲間の 装備は そのまま');
  // きたえた 物を えらぶと もとの 物で おぼえる
  assert.equal(look(bot, 'weapon', 'iron_sword+2').ok, true);
  assert.equal(c.lookEquip.weapon, 'iron_sword');
  // 仲間の 見た目も かえられる（自分の ふくろ・自分の 装備から）
  const r = look(bot, 'head', LOOK_NONE, 'npc_mina');
  assert.equal(r.ok, true, r.text);
  assert.equal(mina.lookEquip.head, LOOK_NONE);
  assert.equal(look(bot, 'weapon', 'iron_sword', 'npc_mina').ok, true, '僧侶も 剣の 見た目に できる');
  assert.equal(shownEquip(mina).weapon, 'iron_sword');
  // パーティーの じょうほう・戦いの 顔・ついてくる 絵にも 出る
  const sup = bot.party.supports.find((x) => x.key === 'npc_mina');
  assert.deepEqual(sup.lookEquip, { head: LOOK_NONE, weapon: 'iron_sword' });
  assert.equal(supportInfo({ key: 'npc_mina', char: mina, kind: 'npc', owner: c.id }).lookEquip.weapon, 'iron_sword');
  assert.equal(allyFromCharacter(mina, {}).eq.split(',')[0], 'iron_sword');
  assert.equal(world.followerLooks(s).find((f) => f.name === mina.name).eq.split(',')[0], 'iron_sword');
});

test('見た目装備: えらんだ 物を 売った・捨てた あとも 見た目は のこる', async () => {
  const { bot, c } = await hero('warrior');
  addItem(c, 'iron_helm', 1);
  assert.equal(look(bot, 'head', 'iron_helm').ok, true);
  removeItem(c, 'iron_helm', 1);
  assert.equal(itemCount(c, 'iron_helm'), 0);
  assert.equal(shownEquip(c).head, 'iron_helm', 'おぼえた 見た目は そのまま');
  // ただし もう一度 えらぶ ことは できない（持っていないので）
  look(bot, 'head', null);
  assert.equal(look(bot, 'head', 'iron_helm').ok, false);
});

test('見た目装備: 絵は 見た目の 装備で かく（ほかの 人の 画面にも）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(31), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('warrior');
  await papa.settle();
  await kid.settle();
  const c = papa.s.char;
  c.equip.weapon = 'iron_sword';
  addItem(c, 'oak_staff', 1);
  assert.equal(look(papa, 'weapon', 'oak_staff').ok, true);
  // 絵の せってい: つえを もつ
  const o = lookToOpts(c.look, c.job, shownEquip(c));
  assert.equal(o.weapon.cat, ITEMS.oak_staff.cat);
  const real = paintHero(c.look, c.job, c.equip, 'down', 0, 4);
  const shown = paintHero(c.look, c.job, shownEquip(c), 'down', 0, 4);
  assert.notDeepEqual(Array.from(shown.rgba), Array.from(real.rgba), '本当の 装備と ちがう 絵');
  // ほかの 人の 画面（いちの じょうほう）
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 2.5, g.y + 0.5, 'down', true);
  await tickN(world, 4);
  const snap = kid.msgs.filter((m) => m.t === 'snap').pop()?.players.find((p) => p.sid === papa.s.id);
  assert.ok(snap);
  assert.equal(snap.eq.split(',')[0], 'oak_staff');
  // 「だれで遊ぶ？」の 一覧にも
  assert.equal(world.charList().find((x) => x.id === c.id).lookEquip.weapon, 'oak_staff');
});

function openGrass(map) {
  for (let y = 60; y < map.h - 4; y++) {
    for (let x = 40; x < map.w - 4; x++) {
      if (map.zoneAt(x, y) !== 'plains') continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (map.tiles[(y + dy) * map.w + x + dx] !== T.GRASS) { ok = false; break; }
      if (ok) return { x, y };
    }
  }
  return null;
}

test('見た目装備: セーブ・読みこみ・引っこしコードで のこる。こわれた 形は なおす', async () => {
  const { world, bot, c } = await hero('warrior');
  addItem(c, 'oak_staff', 1);
  look(bot, 'weapon', 'oak_staff');
  look(bot, 'armor', LOOK_NONE);
  // セーブ → 読みこみ
  const saved = JSON.parse(JSON.stringify(world.data));
  const w2 = new GameWorld({ offline: true, rng: makeRng(8), rateLimit: false, data: saved });
  assert.deepEqual(w2.data.characters[c.id].lookEquip, { weapon: 'oak_staff', armor: LOOK_NONE });
  // 引っこしコード
  const p = parseCode(exportCode(JSON.parse(JSON.stringify(c))));
  assert.equal(p.ok, true);
  assert.deepEqual(p.char.lookEquip, { weapon: 'oak_staff', armor: LOOK_NONE });
  // 古い セーブ（lookEquip が ない）は そのまま
  const old = { name: 'むかし', job: 'warrior', equip: { weapon: 'wood_sword' }, items: [] };
  repairChar(old, 'c_old');
  assert.equal(old.lookEquip, undefined);
  assert.equal(shownEquip(old).weapon, 'wood_sword');
  // こわれた 形・知らない 部位は すてる。新しい 版の 知らない 品物は のこす（その 版では 今の装備と同じに 見える）
  const bad = { name: 'x', job: 'warrior', equip: { weapon: 'iron_sword' }, items: [], lookEquip: { weapon: 'future_blade', bag: 'none', head: 3 } };
  repairChar(bad, 'c_bad');
  assert.deepEqual(bad.lookEquip, { weapon: 'future_blade' });
  assert.equal(shownEquip(bad).weapon, 'iron_sword');
  const bad2 = { lookEquip: 'oak_staff' };
  cleanLookEquip(bad2);
  assert.equal(bad2.lookEquip, undefined);
  // upgradeSave（セーブ ぜんたい）でも
  const up = upgradeSave({ version: 4, characters: { a: { name: 'a', job: 'mage', items: [], lookEquip: { head: LOOK_NONE } } } });
  assert.deepEqual(up.data.characters.a.lookEquip, { head: LOOK_NONE });
});

test('見た目装備: 家族サーバーと サイトの データ合わせ（あとで遊んだほう）', async () => {
  const { c } = await hero('warrior');
  const base = JSON.parse(JSON.stringify(c));
  base.lastPlayed = 1000;
  // こちら（家族サーバー）は かえない、むこう（サイト）で 見た目を かえた
  const ours = JSON.parse(JSON.stringify(base));
  ours.lastPlayed = 2000;
  const theirs = JSON.parse(JSON.stringify(base));
  theirs.lastPlayed = 3000;
  theirs.lookEquip = { weapon: LOOK_NONE };
  let m = mergeChars(base, ours, theirs);
  assert.deepEqual(m.lookEquip, { weapon: LOOK_NONE });
  // 両方で かえた → あとで 遊んだ ほう
  ours.lookEquip = { head: LOOK_NONE };
  ours.lastPlayed = 4000;
  m = mergeChars(base, ours, theirs);
  assert.deepEqual(m.lookEquip, { head: LOOK_NONE });
  // むこうで もとに もどした（消した）
  const base2 = JSON.parse(JSON.stringify(theirs));
  const ours2 = JSON.parse(JSON.stringify(base2));
  const theirs2 = JSON.parse(JSON.stringify(base2));
  delete theirs2.lookEquip;
  theirs2.lastPlayed = 9000;
  m = mergeChars(base2, ours2, theirs2);
  assert.equal(m.lookEquip, undefined);
  // 仲間の 見た目装備も のこる
  const b3 = JSON.parse(JSON.stringify(base));
  b3.companions = [{ key: 'npc_gard', kind: 'npc', char: { name: 'ガルド', job: 'warrior', level: 3, exp: 0, equip: {}, items: [] } }];
  const a3 = JSON.parse(JSON.stringify(b3));
  const t3 = JSON.parse(JSON.stringify(b3));
  t3.companions[0].char.lookEquip = { armor: LOOK_NONE };
  t3.lastPlayed = 5000;
  m = mergeChars(b3, a3, t3);
  assert.deepEqual(m.companions[0].char.lookEquip, { armor: LOOK_NONE });
});
