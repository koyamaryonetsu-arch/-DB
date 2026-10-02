// 装備の ランクと、魔物が 落とす 物（長い 物語の ための ものさし）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, EQUIP_RANKS, RANK_MAX, SLOTS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { SHOPS, STAR_TRADES, shopItems } from '../public/js/shared/data/shops.js';
import { monsterDrops, rollDrops, stealPick, DROP_N } from '../public/js/shared/data/loot.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { newCharacter, itemCount, gainExp, expForLevel, computeStats, ownsItem } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const EQUIPS = Object.entries(ITEMS).filter(([, it]) => SLOTS.includes(it.type));
const defOf = (it) => (it.def || 0) + (it.bonus?.def || 0);

test('装備: すべて ランクが あり、★は 店で 買えない', () => {
  assert.equal(EQUIP_RANKS.length, RANK_MAX);
  EQUIP_RANKS.forEach((r, i) => assert.equal(r.rank, i + 1));
  for (const [id, it] of EQUIPS) {
    assert.ok(Number.isInteger(it.rank) && it.rank >= 1 && it.rank <= RANK_MAX, `${id} の ランク`);
    if (it.star || it.unique) assert.ok(!(it.price > 0), `${id} は 店の 品では ない`);
    if (it.unique) assert.equal(it.type, 'acc', `${id}: ボスの 品は アクセサリー`);
    if (it.rank < RANK_MAX) assert.ok(!it.name.includes('伝説'), `${id}: 「伝説」は ランク10だけ`);
  }
});

test('装備: おなじ 種類なら ランクが 上がるほど 強い（店の 品）', () => {
  // [グループ名, 強さ]
  const groups = new Map();
  const put = (key, id, it, power) => {
    if (it.star || !(it.price > 0)) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id, rank: it.rank, power });
  };
  for (const [id, it] of EQUIPS) {
    if (it.type === 'weapon') put(`weapon:${it.cat}`, id, it, it.atk);
    else if (it.type === 'armor') put(`armor:${it.armorType}`, id, it, defOf(it));
    else if (it.type === 'shield') put('shield', id, it, defOf(it));
    else if (it.type === 'head') put(`head:${it.helm ? 'helm' : 'hat'}`, id, it, defOf(it));
  }
  for (const [key, list] of groups) {
    for (const a of list) {
      for (const b of list) {
        if (a.rank < b.rank) assert.ok(a.power <= b.power, `${key}: ${a.id}（ランク${a.rank} ${a.power}）より ${b.id}（ランク${b.rank} ${b.power}）が 強い`);
      }
    }
  }
  // 竹のバットで 木→金属の あいだが うまる（第3章で はがねの バット）
  const bats = groups.get('weapon:bat').map((x) => x.rank).sort();
  assert.deepEqual([...new Set(bats)], [1, 2, 3, 4, 5]);
});

test('お店: 売るのは その章の ランク。★や ボスの 品は 売らない', () => {
  const all = (id) => shopItems(SHOPS[id], () => true);
  const ranks = (list) => list.filter((id) => SLOTS.includes(ITEMS[id].type)).map((id) => ITEMS[id].rank);
  assert.ok(ranks(all('village')).every((r) => r === 1), 'ホシフル村は ランク1');
  assert.ok(ranks(SHOPS.weapon.items).every((r) => r <= 2), 'ルミナの 武器屋は はじめ ランク2まで');
  assert.ok(ranks(SHOPS.armor.items).every((r) => r <= 2));
  assert.ok(ranks(all('weapon')).some((r) => r === 3), '森の主の あとで ランク3');
  assert.ok(ranks(all('port_arms')).every((r) => r === 4), 'カモメ港は ランク4');
  for (const id of Object.keys(SHOPS)) for (const it of all(id)) assert.ok(!ITEMS[it].star && !ITEMS[it].unique, `${id}: ${it}`);
  for (const t of STAR_TRADES) assert.ok(ITEMS[t.item], t.item);
});

test('落とす物: ふつうの 魔物は「よく」と「レア」、ボスは かならず 落とす', () => {
  for (const [sp, m] of Object.entries(MONSTERS)) {
    const list = monsterDrops(sp);
    for (const d of list) assert.ok(ITEMS[d.item], `${sp}: ${d.item}`);
    if (m.breedOnly || !(m.exp > 0)) continue; // 配合だけ・物語の 敵
    if (m.boss) {
      const boss = list.filter((d) => d.kind === 'boss');
      assert.equal(boss.length, 1, `${sp} の ボスの 品`);
      assert.ok(ITEMS[boss[0].item].unique, `${sp}: 1人 1つの 品`);
      continue;
    }
    const common = list.find((d) => d.kind === 'common');
    const rare = list.find((d) => d.kind === 'rare');
    assert.ok(common && rare, `${sp} に よく落とす物と レアが ある`);
    assert.ok(rare.n >= 32 && rare.n <= 128, `${sp}: レアは 32〜128回に 1回`);
    assert.ok(common.n <= 32, `${sp}: よく落とす物は 32回に 1回より よく出る`);
    const r = ITEMS[rare.item];
    assert.ok(r.type === 'use' || r.type === 'acc' || SLOTS.includes(r.type), `${sp}: レアは 装備か 種`);
    if (r.type === 'use') assert.ok(r.effect?.type === 'seed', `${sp}: 道具の レアは 種`);
  }
  assert.equal(DROP_N.rare, 64);
});

test('落とす物: 1体から 1つまで・レアは まれ・ボスは かならず・ぬすむと レアが 出やすい', () => {
  const rng = makeRng(11);
  let rare = 0, common = 0;
  const N = 64000;
  for (let i = 0; i < N; i++) {
    const got = rollDrops('wolf', rng);
    assert.ok(got.length <= 1);
    if (got[0] === 'iron_claw') rare++;
    if (got[0] === 'herb') common++;
  }
  assert.ok(rare > N / 64 * 0.8 && rare < N / 64 * 1.2, `レア ${rare}`);
  assert.ok(common > N / 6 * 0.85 && common < N / 6 * 1.15, `よく ${common}`);
  for (let i = 0; i < 20; i++) assert.deepEqual(rollDrops('goldoon', rng), ['rock_bangle']);
  let stolen = 0;
  for (let i = 0; i < 8000; i++) {
    const id = stealPick('wolf', rng);
    assert.ok(id === 'iron_claw' || id === 'herb');
    if (id === 'iron_claw') stolen++;
  }
  assert.ok(stolen > 8000 / 8 * 0.8 && stolen < 8000 / 8 * 1.2, `ぬすんだ レア ${stolen}`);
  assert.equal(stealPick('goldoon', rng), null, 'ボスの 品は ぬすめない');
});

// その まものの 落とす 物を 一時的に かえて たたかう
async function fightWith(drops, runs = 1) {
  const world = new GameWorld({ offline: true, rng: makeRng(21), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(12) - c.exp);
  c.hp = computeStats(c).maxHp;
  const keep = MONSTERS.pururin.drops;
  MONSTERS.pururin.drops = drops;
  try {
    for (let i = 0; i < runs; i++) {
      startFieldBattle(world, bot.s, { id: 'test' + i, sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
      await bot.settle(8000);
    }
  } finally {
    MONSTERS.pururin.drops = keep;
  }
  return { c, bot };
}

test('落とす物: 手に入れると 図鑑に のる', { timeout: 60000 }, async () => {
  const { c, bot } = await fightWith({ rare: ['iron_claw', 1] });
  assert.equal(bot.battles.length, 1);
  assert.equal(itemCount(c, 'iron_claw'), 1);
  assert.equal(c.bestiary.pururin.drop_iron_claw, 1, '図鑑に 記録');
  assert.ok(!c.bestiary.pururin.drop_jelly, 'まだ 手に入れていない 物は ？？？のまま');
  const lines = bot.battles[0].result?.lines || bot.battles[0].lines || [];
  assert.ok(JSON.stringify(bot.battles[0]).includes('鉄のツメを持っていた'), JSON.stringify(lines).slice(0, 200));
});

test('ボスの 品は 1人 1つ（2回 たおしても ふえない）', { timeout: 60000 }, async () => {
  const { c } = await fightWith({ boss: ['rock_bangle'] }, 2);
  assert.equal(itemCount(c, 'rock_bangle'), 1);
  assert.ok(ownsItem(c, 'rock_bangle'));
});

test('セーブの ひきつぎ: もう たおした ボスの 品を わたす（もう 持っていれば わたさない）', () => {
  const c = newCharacter({ id: 'hina', name: 'ヒナ', job: 'warrior' });
  c.flags = { c1_treant: true, c1_boss: true, c2_kraken: true };
  c.equip.acc = 'rock_bangle';
  const up = upgradeSave({ version: 3, characters: { [c.id]: c } }).data.characters[c.id];
  assert.equal(itemCount(up, 'forest_necklace'), 1, '森の首かざり');
  assert.equal(itemCount(up, 'deep_ring'), 1, '深海の指輪');
  assert.equal(itemCount(up, 'rock_bangle'), 0, '装備して いるので ふやさない');
  assert.equal(up.equip.acc, 'rock_bangle');
  assert.equal(itemCount(up, 'storm_bangle'), 0, 'まだ たおして いない');
  assert.equal(up.bestiary.dark_treant.drop_forest_necklace, 1);
  // もう いちど 読んでも ふえない
  const again = upgradeSave({ version: 3, characters: { [up.id]: JSON.parse(JSON.stringify(up)) } }).data.characters[up.id];
  assert.equal(itemCount(again, 'forest_necklace'), 1);
  // 新しい セーブは そのまま
  const fresh = newCharacter({ id: 'n', name: 'n', job: 'mage' });
  const up2 = upgradeSave({ version: 3, characters: { n: fresh } }).data.characters.n;
  assert.ok(!up2.items.some((e) => ITEMS[e.id]?.unique));
});

test('家族の データを 合わせる: 両方で ボスの 品を もらっても 1つ', () => {
  const base = newCharacter({ id: 'hina', name: 'ヒナ', job: 'warrior' });
  const a = JSON.parse(JSON.stringify(base));
  const t = JSON.parse(JSON.stringify(base));
  a.items.push({ id: 'rock_bangle', n: 1 }, { id: 'herb', n: 2 });
  t.items.push({ id: 'rock_bangle', n: 1 }, { id: 'herb', n: 3 });
  t.lastPlayed = (a.lastPlayed || 0) + 1000;
  const m = mergeChars(base, a, t);
  assert.equal(itemCount(m, 'rock_bangle'), 1, 'ボスの 品は ふえない');
  assert.equal(itemCount(m, 'herb'), itemCount(base, 'herb') + 5, 'ふつうの 道具は たす');
  // 片方で 売ったら なくなる
  const b2 = JSON.parse(JSON.stringify(m));
  const a2 = JSON.parse(JSON.stringify(m));
  const t2 = JSON.parse(JSON.stringify(m));
  a2.items = a2.items.filter((e) => e.id !== 'rock_bangle');
  assert.equal(itemCount(mergeChars(b2, a2, t2), 'rock_bangle'), 0);
});
