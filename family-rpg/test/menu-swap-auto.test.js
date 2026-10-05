// メニュー: 仲間の 装備と 入れかえ（swapEquip）・オートで 使わない 技（autoSkill・ai.js）・レベルは 99まで
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, itemCount, learnedAbilities, MAX_LEVEL } from '../public/js/shared/stats.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { Battle, allyFromCharacter } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { Bot } from './helpers.js';

async function hero(job = 'warrior', level = 20) {
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const s = bot.s;
  gainExp(s.char, expForLevel(level) - s.char.exp);
  return { world, bot, s };
}
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

test('装備の 入れかえ: 仲間が 装備している 物を もらい、自分の 物を わたす', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  const me = s.char;
  const gard = me.companions.find((e) => e.key === 'npc_gard').char;
  me.equip.weapon = 'wood_sword';
  gard.equip.weapon = 'iron_sword';
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'weapon', who: 'self', from: 'npc_gard' });
  assert.equal(lastMenu(bot).ok, true, lastMenu(bot).text);
  assert.equal(me.equip.weapon, 'iron_sword');
  assert.equal(gard.equip.weapon, 'wood_sword');
  assert.match(lastMenu(bot).text, /入れかえた/);
  // 仲間の 側から（仲間が 自分の 物を もらう）
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'weapon', who: 'npc_gard', from: 'self' });
  assert.equal(lastMenu(bot).ok, true, lastMenu(bot).text);
  assert.equal(gard.equip.weapon, 'iron_sword');
  assert.equal(me.equip.weapon, 'wood_sword');
});

test('装備の 入れかえ: 自分が なにも 装備していない ときは もらうだけ。相手が 装備できない 物は ふくろへ', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  recruitNpc(world, s, 'npc_mina', { force: true });
  const me = s.char;
  const gard = me.companions.find((e) => e.key === 'npc_gard').char;
  const mina = me.companions.find((e) => e.key === 'npc_mina').char;
  // 自分は 何も 持っていない → もらうだけ
  me.equip.head = null;
  gard.equip.head = 'leather_hat';
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'head', who: 'self', from: 'npc_gard' });
  assert.equal(lastMenu(bot).ok, true, lastMenu(bot).text);
  assert.equal(me.equip.head, 'leather_hat');
  assert.equal(gard.equip.head, null);
  // ミーナ（僧侶）は 鉄のよろいを 装備できない → 自分の よろいは ふくろへ（自分は ミーナの 布の服を もらう）
  me.equip.armor = 'iron_armor';
  mina.equip.armor = 'cloth';
  const before = itemCount(me, 'iron_armor');
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'armor', who: 'self', from: 'npc_mina' });
  const r = lastMenu(bot);
  assert.equal(r.ok, true, r.text);
  assert.equal(me.equip.armor, 'cloth');
  assert.equal(mina.equip.armor, null, 'ミーナは 鉄のよろいを 装備しない');
  assert.equal(itemCount(me, 'iron_armor'), before + 1, 'よろいは ふくろへ');
  assert.match(r.text, /ふくろにしまった/);
  // 戦士は 杖を 装備できない → ことわる（何も かわらない）
  me.equip.weapon = 'iron_sword';
  mina.equip.weapon = 'oak_staff';
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'weapon', who: 'self', from: 'npc_mina' });
  assert.equal(lastMenu(bot).ok, false);
  assert.equal(me.equip.weapon, 'iron_sword');
  assert.equal(mina.equip.weapon, 'oak_staff');
});

test('装備の 入れかえ: 装備できない 物・おなじ 人・知らない 人は ことわる', async () => {
  const { world, bot, s } = await hero('mage');
  recruitNpc(world, s, 'npc_gard', { force: true });
  const me = s.char;
  const gard = me.companions.find((e) => e.key === 'npc_gard').char;
  gard.equip.armor = 'iron_armor';
  const myArmor = me.equip.armor;
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'armor', who: 'self', from: 'npc_gard' });
  // 魔法使いは 鉄のよろいを 装備できない
  assert.equal(lastMenu(bot).ok, false);
  assert.equal(me.equip.armor, myArmor);
  assert.equal(gard.equip.armor, 'iron_armor');
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'armor', who: 'self', from: 'self' });
  assert.equal(lastMenu(bot).ok, false);
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'armor', who: 'self', from: 'nobody' });
  assert.equal(lastMenu(bot).ok, false);
  bot.send({ t: 'menu', action: 'swapEquip', slot: 'bag', who: 'self', from: 'npc_gard' });
  assert.equal(lastMenu(bot).ok, false);
});

test('オートで 使う 技: 使わない に した 技は AI が えらばない（ぜんぶ使う で もとどおり）', async () => {
  const { bot, s } = await hero('priest', 30);
  const me = s.char;
  const heals = learnedAbilities(me).filter((id) => ABILITIES[id]?.effect?.type === 'heal');
  assert.ok(heals.length >= 1, `回復の 呪文を 覚えている (${heals})`);
  for (const id of heals) bot.send({ t: 'menu', action: 'autoSkill', key: 'self', id, op: 'off' });
  assert.deepEqual([...me.autoOff].sort(), [...heals].sort());
  // たたかい: なかまの HPが へっても 回復の 呪文を 使わない
  const mk = () => {
    const b = new Battle({
      rng: makeRng(3),
      allies: [{ char: me, auto: true }, { char: { ...me, name: 'けが人', autoOff: [] }, auto: true, kind: 'support' }],
      enemies: ['pururin'],
      canFlee: false,
    });
    const ally = b.allies[0];
    b.allies[1].hp = 1;
    return { b, ally };
  };
  for (let i = 0; i < 20; i++) {
    const { b, ally } = mk();
    const cmd = decideAlly(b, ally);
    assert.ok(!(cmd.type === 'ability' && heals.includes(cmd.id)), `使わない 技を えらんだ: ${JSON.stringify(cmd)}`);
  }
  // 全部使う
  bot.send({ t: 'menu', action: 'autoSkill', key: 'self', op: 'all' });
  assert.equal(me.autoOff, undefined);
  let used = false;
  for (let i = 0; i < 20 && !used; i++) {
    const { b, ally } = mk();
    const cmd = decideAlly(b, ally);
    if (cmd.type === 'ability' && heals.includes(cmd.id)) used = true;
  }
  assert.ok(used, '回復の 呪文を また 使う');
});

test('オートで 使う 技: 仲間の 分も 決められる（覚えていない 技は ことわる）。パーティーの 情報にも のる', async () => {
  const { world, bot, s } = await hero('warrior', 25);
  recruitNpc(world, s, 'npc_mina', { force: true });
  const mina = s.char.companions.find((e) => e.key === 'npc_mina').char;
  const id = learnedAbilities(mina).find((x) => !ABILITIES[x].fieldOnly);
  assert.ok(id, 'ミーナが 技を 覚えている');
  bot.send({ t: 'menu', action: 'autoSkill', key: 'npc_mina', id, op: 'off' });
  assert.equal(lastMenu(bot).ok, true);
  assert.deepEqual(mina.autoOff, [id]);
  const info = (bot.party?.supports || []).find((x) => x.key === 'npc_mina');
  assert.deepEqual(info?.autoOff, [id], 'クライアントに とどく');
  // たたかいの すがたにも
  assert.deepEqual(allyFromCharacter(mina).autoOff, [id]);
  bot.send({ t: 'menu', action: 'autoSkill', key: 'npc_mina', id: 'not_a_skill', op: 'off' });
  assert.equal(lastMenu(bot).ok, false);
  bot.send({ t: 'menu', action: 'autoSkill', key: 'npc_mina', id, op: 'on' });
  assert.equal(mina.autoOff, undefined);
});

test('レベルは 99まで（経験値が ふえても 99で とまる）', async () => {
  const { s } = await hero('warrior', 1);
  assert.equal(MAX_LEVEL, 99);
  gainExp(s.char, expForLevel(MAX_LEVEL) + 1_000_000);
  assert.equal(s.char.level, 99);
  const ups = gainExp(s.char, 5_000_000);
  assert.equal(ups.length, 0);
  assert.equal(s.char.level, 99);
});
