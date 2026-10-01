// モンスターの なかまの 装備（ドラクエ5 ふう）と、めずらしい 強い 魔物（ぷるりん騎士・ヴァルドラゴン など）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Battle } from '../public/js/shared/battle.js';
import {
  canEquipChar, canEquipMonster, monsterGear, monsterSlots, computeStats, newMonsterCompanion, learnedAbilities, weaponOk,
  gainExp, expForLevel, itemCount,
} from '../public/js/shared/stats.js';
import { ITEMS, SLOTS, ITEM_KANA, sellPrice } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS, RACE_GEAR, breedResult, recipeHint } from '../public/js/shared/data/companions.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { addMonsterCompanion } from '../public/js/shared/world/party.js';
import { openService } from '../public/js/shared/world/services.js';
import { Bot } from './helpers.js';

const NEW_MONSTERS = ['pururin_knight', 'clockwork_knight', 'axe_rider', 'ikazuchi_tiger', 'great_dragon'];
const mon = (species, level = 10, equip = {}) => {
  const m = newMonsterCompanion({ id: 'x', species, level });
  m.equip = { ...m.equip, ...equip };
  return m;
};

async function solo(seed = 41, level = 12) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.flags.monster_bond = true;
  return { world, bot, c };
}

test('装備: どの 仲間の 魔物も アクセサリー いがいに 1つは 装備できる（部位と 品物）', () => {
  const noAcc = Object.values(ITEMS).filter((it) => SLOTS.includes(it.type) && it.type !== 'acc' && !it.base);
  for (const sp of Object.keys(MONSTER_FRIENDS)) {
    assert.ok(MONSTERS[sp], sp);
    assert.ok(RACE_GEAR[MONSTERS[sp].race], `${sp}: ${MONSTERS[sp].race} の 装備の きまり`);
    const slots = monsterSlots(sp);
    assert.ok(slots.includes('acc'), `${sp}: アクセサリー`);
    assert.ok(slots.some((s) => s !== 'acc'), `${sp}: アクセサリー いがいの 部位`);
    for (const s of slots.filter((x) => x !== 'acc')) {
      assert.ok(noAcc.some((it) => it.type === s && canEquipMonster(sp, Object.keys(ITEMS).find((id) => ITEMS[id] === it))), `${sp}: ${s} に 装備できる 品が ある`);
    }
    // メニューに 出ない 部位の 品は 装備できない
    for (const s of SLOTS.filter((x) => !slots.includes(x))) {
      assert.ok(!Object.keys(ITEMS).some((id) => ITEMS[id].type === s && canEquipMonster(sp, id)), `${sp}: ${s}`);
    }
    // アクセサリーは だれでも
    assert.ok(canEquipMonster(sp, 'power_ring'));
  }
});

test('装備: しゅぞくの けいで きまり、しゅぞくごとに うわがき できる', () => {
  // 騎士は 剣・たて・かぶと・重いよろい
  for (const sp of ['pururin_knight', 'clockwork_knight', 'demon_knight']) {
    for (const id of ['iron_sword', 'iron_shield', 'iron_helm', 'iron_armor', 'silver_sword', 'silver_shield', 'silver_helm', 'silver_mail']) {
      assert.ok(canEquipChar({ species: sp }, id), `${sp}: ${id}`);
    }
  }
  // アックスライダーは オノ（竜のオノも）・たて・かぶと
  for (const id of ['stone_axe', 'iron_axe', 'pirate_axe', 'dragon_axe', 'iron_shield', 'iron_helm', 'iron_armor']) assert.ok(canEquipMonster('axe_rider', id), id);
  // ぷるりん: 武器・たて・かぶとは だめ。服と ぼうしは よい
  assert.ok(!canEquipMonster('pururin', 'wood_sword'));
  assert.ok(!canEquipMonster('pururin', 'leather_shield'));
  assert.ok(!canEquipMonster('pururin', 'iron_helm'), 'かぶとは だめ');
  assert.ok(canEquipMonster('pururin', 'leather_hat'), 'ぼうしは よい');
  assert.ok(canEquipMonster('pururin', 'cloth'));
  assert.ok(!canEquipMonster('pururin', 'iron_armor'), '重いよろいは だめ');
  // けもの: ツメと 軽い よろい
  assert.ok(canEquipMonster('wolf', 'iron_claw') && canEquipMonster('wolf', 'leather_armor'));
  assert.ok(!canEquipMonster('wolf', 'iron_sword') && !canEquipMonster('wolf', 'iron_shield'));
  // ドラゴン: 武器は ツメ だけ。よろい・かぶとは よい
  assert.ok(canEquipMonster('great_dragon', 'iron_claw') && canEquipMonster('great_dragon', 'iron_armor') && canEquipMonster('great_dragon', 'iron_helm'));
  assert.ok(!canEquipMonster('great_dragon', 'iron_sword') && !canEquipMonster('great_dragon', 'iron_shield'));
  assert.ok(!canEquipMonster('sea_serpent', 'iron_claw'), '海へびは 武器を もたない');
  // 虎は ツメと 道着・かぶと
  assert.ok(canEquipMonster('ikazuchi_tiger', 'shark_fang') && canEquipMonster('ikazuchi_tiger', 'wave_gi') && canEquipMonster('ikazuchi_tiger', 'iron_helm'));
  // うわがき: キングぷるりんは 頭に 何も つけない
  assert.equal(monsterGear('king_pururin').head, false);
  assert.ok(!monsterSlots('king_pururin').includes('head'));
  // きたえた 装備（+1〜+3）は もとと おなじ
  assert.ok(canEquipMonster('pururin_knight', 'iron_sword+3'));
  assert.ok(!canEquipMonster('pururin', 'iron_sword+1'));
  assert.ok(ITEMS['dragon_axe+2'] && canEquipMonster('axe_rider', 'dragon_axe+2'));
  // 知らない しゅぞく（新しい バージョンの 魔物など）は アクセサリー だけ
  assert.ok(canEquipMonster('future_mon', 'power_ring'));
  assert.ok(!canEquipMonster('future_mon', 'cloth'));
});

test('装備: 武器を もつと こぶしの 技が つかえなく なる ことは ない（つかえる 武器 だけ）', () => {
  for (const [sp, f] of Object.entries(MONSTER_FRIENDS)) {
    const g = monsterGear(sp);
    for (const [, id] of f.learn) {
      const a = ABILITIES[id];
      if (!a?.weapon) continue;
      const cats = g.weapons.filter((cat) => weaponOk(a, cat));
      // 素手で つかえる 技は、どの 武器を もっても つかえる
      if (weaponOk(a, 'none')) assert.deepEqual(cats, g.weapons, `${sp}: ${id}`);
      // 剣の 技を 覚えるなら、その 武器を もてる
      else assert.ok(cats.length > 0, `${sp}: ${id} の 武器を もてる`);
    }
  }
});

test('装備: 武器の 攻撃力・よろいの 守備力・武器の 種類・毒の ナイフが 魔物の 強さに のる', () => {
  const bare = computeStats(mon('pururin_knight'));
  assert.equal(bare.weaponCat, 'none');
  const armed = computeStats(mon('pururin_knight', 10, { weapon: 'iron_sword', armor: 'iron_armor', shield: 'iron_shield', head: 'iron_helm' }));
  assert.equal(armed.atk - bare.atk, ITEMS.iron_sword.atk);
  assert.equal(armed.dfn - bare.dfn, ITEMS.iron_armor.def + ITEMS.iron_shield.def + ITEMS.iron_helm.def);
  assert.equal(armed.agi, bare.agi + ITEMS.iron_armor.bonus.agi, 'よろいの おまけ（素早さ−2）も');
  assert.equal(armed.weaponCat, 'sword');
  const pk = computeStats(mon('pururin_knight', 10, { weapon: 'poison_knife' }));
  assert.equal(pk.weaponCat, 'dagger');
  assert.equal(pk.onHit?.status, 'poison', '毒のナイフで 毒に できる');
  // たいせいも（貝のたて: 氷に 少し 強い）
  const sh = computeStats(mon('shell_knight', 10, { shield: 'shell_shield' }));
  assert.ok(sh.resist.ice < (computeStats(mon('shell_knight')).resist.ice ?? 1));
});

test('たたかい: 剣を もった 魔物は 剣の 技（大地斬）を つかえる。素手では つかえない', () => {
  const play = (equip) => {
    const m = mon('pururin_knight', 10, equip);
    const b = new Battle({ rng: makeRng(3), allies: [{ char: m, controller: 's1' }], enemies: ['pururin'] });
    const a = b.allies[0];
    return { a, r: b.validate(a, { type: 'ability', id: 'daichi', target: b.enemies[0].id }) };
  };
  const armed = play({ weapon: 'iron_sword' });
  assert.equal(armed.a.weaponCat, 'sword');
  assert.equal(armed.a.weaponId, 'iron_sword', 'ぶきの エフェクト用');
  assert.ok(armed.a.abilities.includes('daichi'));
  assert.ok(armed.r.ok, armed.r.reason);
  const bare = play({});
  assert.equal(bare.a.weaponCat, 'none');
  assert.equal(bare.r.ok, false);
  // こぶしの 技は ツメを もっても つかえる
  const w = new Battle({ rng: makeRng(4), allies: [{ char: mon('wolf', 14, { weapon: 'iron_claw' }), controller: 's1' }], enemies: ['pururin'] });
  assert.ok(w.validate(w.allies[0], { type: 'ability', id: 'mouko', target: w.enemies[0].id }).ok);
});

test('メニュー: 魔物に 装備・はずす・さいきょう装備（装備できない 物は えらばない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(42);
  const k = addMonsterCompanion(world, bot.s, 'pururin_knight', 12);
  assert.ok(k.ok && k.joined);
  const kn = c.companions.find((e) => e.key === k.key).char;
  c.items.push({ id: 'iron_sword', n: 1 }, { id: 'bronze_sword', n: 1 }, { id: 'iron_shield', n: 1 }, { id: 'iron_helm', n: 1 }, { id: 'chain_mail', n: 1 }, { id: 'iron_claw', n: 1 }, { id: 'wizard_robe', n: 1 });
  const before = computeStats(kn).atk;
  bot.send({ t: 'menu', action: 'equip', id: 'bronze_sword', who: k.key });
  assert.equal(kn.equip.weapon, 'bronze_sword');
  bot.send({ t: 'menu', action: 'equip', id: 'iron_claw', who: k.key });
  assert.equal(kn.equip.weapon, 'bronze_sword', 'ツメは もてない');
  assert.match(bot.msgs.filter((m) => m.t === 'menuRes').pop().text, /装備できない/);
  // さいきょう装備: いちばん 強い 剣・たて・かぶと・よろい（ローブは 着ない）
  bot.send({ t: 'menu', action: 'bestEquip', who: k.key });
  assert.equal(kn.equip.weapon, 'iron_sword');
  assert.equal(kn.equip.shield, 'iron_shield');
  assert.equal(kn.equip.head, 'iron_helm');
  assert.equal(kn.equip.armor, 'chain_mail');
  assert.equal(itemCount(c, 'bronze_sword'), 1, 'まえの 剣は ふくろへ');
  assert.equal(itemCount(c, 'wizard_robe'), 1);
  assert.ok(computeStats(kn).atk > before);
  // パーティーの じょうほうにも 装備が のる（メニュー・お店の くらべ）
  const sup = bot.party.supports.find((x) => x.key === k.key);
  assert.equal(sup.equip.weapon, 'iron_sword');
  bot.send({ t: 'menu', action: 'unequip', slot: 'shield', who: k.key });
  assert.equal(kn.equip.shield, null);
  assert.equal(itemCount(c, 'iron_shield'), 1);
  // みんな さいきょう装備: 魔物の なかまも（ならびの じゅん。自分が 先）
  c.items.push({ id: 'leather_shield', n: 1 });
  bot.send({ t: 'menu', action: 'bestEquip', who: 'all' });
  assert.equal(c.equip.shield, 'iron_shield', '自分が 先に 強い たて');
  assert.equal(kn.equip.shield, 'leather_shield', '魔物の なかまも たてを 装備');
  // 酒場で 待つと 装備は ふくろへ（ほかの なかまと おなじ）
  bot.send({ t: 'svc', kind: 'tavern', action: 'wait', key: k.key });
  assert.equal(kn.equip.weapon, null);
  assert.equal(itemCount(c, 'iron_sword'), 1);
});

test('お店: 魔物の なかまに 買って すぐ 装備できる（装備できない 物は ことわる）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(43);
  const k = addMonsterCompanion(world, bot.s, 'axe_rider', 14);
  const t = addMonsterCompanion(world, bot.s, 'pururin', 14);
  c.gold = 20000;
  c.flags.c2_kraken = true;
  assert.ok(openService(world, bot.s, 'shop', 'port_arms'));
  const items = shopItems(SHOPS.port_arms, () => true);
  assert.ok(items.includes('pirate_axe') && items.includes('silver_dagger'));
  const buy = (id, who) => {
    bot.send({ t: 'svc', kind: 'shop', action: 'buy', id, who });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let r = buy('pirate_axe', k.key);
  assert.ok(r.ok && r.equipped, r.text);
  assert.equal(c.companions.find((e) => e.key === k.key).char.equip.weapon, 'pirate_axe');
  r = buy('silver_dagger', t.key);
  assert.equal(r.ok, false, 'ぷるりんは 短剣を もてない');
  r = buy('captain_hat', t.key);
  assert.ok(r.ok && r.equipped, 'ぷるりんは ぼうしを かぶれる');
});

test('セーブ: むかしの 魔物の なかま（アクセサリー だけ）も そのまま 読めて、新しく 装備できる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(44);
  // むかしの 形の なかま（acc だけ 装備）
  c.companions = [{
    key: 'm1', kind: 'monster', species: 'wolf',
    char: { id: `${c.id}:m1`, name: 'ガルル', species: 'wolf', look: null, job: null, jobs: {}, level: 9, exp: expForLevel(9), hp: 40, mp: 5,
      equip: { weapon: null, armor: null, shield: null, head: null, acc: 'power_ring' }, items: [], seeds: {}, status: {}, flags: {}, tactics: 'balanced' },
  }];
  c.partyKeys = ['m1'];
  c.monsterSeq = 2;
  const raw = JSON.parse(JSON.stringify({ version: 4, characters: { [c.id]: c } }));
  const up = upgradeSave(raw).data.characters[c.id];
  const old = up.companions[0].char;
  assert.equal(old.equip.acc, 'power_ring');
  assert.equal(computeStats(old).weaponCat, 'none');
  assert.ok(computeStats(old).atk > 0);
  // そのまま あそぶ
  const world2 = new GameWorld({ offline: true, rng: makeRng(45), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const b2 = new Bot(world2, 'モモ');
  b2.send({ t: 'hello' });
  b2.send({ t: 'play', id: c.id });
  await b2.settle();
  const c2 = world2.data.characters[c.id];
  const wolf = c2.companions.find((e) => e.key === 'm1').char;
  assert.ok(b2.party.supports.some((x) => x.key === 'm1'), 'パーティーに いる');
  c2.items.push({ id: 'iron_claw', n: 1 });
  const atk = computeStats(wolf).atk;
  b2.send({ t: 'menu', action: 'equip', id: 'iron_claw', who: 'm1' });
  assert.equal(wolf.equip.weapon, 'iron_claw');
  assert.equal(wolf.equip.acc, 'power_ring', 'アクセサリーは そのまま');
  assert.equal(computeStats(wolf).atk, atk + ITEMS.iron_claw.atk);
});

test('めずらしい 魔物: 図鑑・仲間・出現表・落とす物・技が そろっている', () => {
  const tables = new Map();
  for (const [t, list] of Object.entries(ENCOUNTER_TABLES)) for (const e of list) for (const [sp] of e.group) if (!tables.has(sp)) tables.set(sp, t);
  for (const sp of NEW_MONSTERS) {
    const m = MONSTERS[sp];
    assert.ok(m && m.name && m.desc && m.race && m.lv >= 10 && m.exp > 0 && m.gold > 0, sp);
    assert.ok(!m.boss && !m.breedOnly, `${sp}: 図鑑の ふつうの 魔物の ところに 出る`);
    const f = MONSTER_FRIENDS[sp];
    assert.ok(f && f.rate > 0 && f.rate <= 1 / 24, `${sp}: なかなか 仲間に ならない（${f?.rate}）`);
    assert.ok(f.names.length >= 4 && f.note && f.growth, sp);
    for (const [, id] of f.learn) assert.ok(ABILITIES[id], `${sp}: ${id}`);
    assert.ok(f.learn.length >= 6, `${sp}: 技が たくさん`);
    // どこかに 出る（めずらしい 組み合わせ。先頭なので フィールドで その すがた）
    const t = tables.get(sp);
    assert.ok(t, `${sp} の 出る 場所`);
    const entry = Object.values(ENCOUNTER_TABLES).flat().find((e) => e.group[0][0] === sp);
    assert.ok(entry && entry.w <= 1, `${sp}: 先頭で、めずらしい`);
    // 落とす 物
    const drops = monsterDrops(sp);
    assert.ok(drops.some((d) => d.kind === 'rare') && drops.some((d) => d.kind === 'common'), sp);
  }
  // 出る 場所は 第1章の おわり〜第2章（フィールドの 魔物が うろうろする ちいき）
  const zoneOk = (z) => Object.values(MAPS).some((map) => map.spawnCounts?.[z]) || Object.entries(NIGHT_ZONES).some(([day, night]) => night === z && Object.values(MAPS).some((map) => map.spawnCounts?.[day]));
  for (const sp of NEW_MONSTERS) {
    const zones = Object.entries(ENCOUNTER_TABLES).filter(([, list]) => list.some((e) => e.group.some(([x]) => x === sp))).map(([z]) => z);
    assert.ok(zones.length && zones.every(zoneOk), `${sp}: ${zones}`);
  }
  // 夜だけの 虎
  assert.ok(MONSTERS.ikazuchi_tiger.night && ENCOUNTER_TABLES.isle_night.some((e) => e.group[0][0] === 'ikazuchi_tiger'));
  // 新しい 技・品物
  for (const id of ['m_bounce_slash', 'm_jelly_spin', 'm_twin_slash', 'm_clock_beam', 'm_full_beam', 'm_dragon_dive', 'm_thunder_fang', 'm_dragon_roar', 'm_jade_flare']) {
    assert.ok(ABILITIES[id]?.kind === 'monster' && ABILITIES[id].desc && ABILITIES[id].anim, id);
  }
  for (const id of ['dragon_axe', 'dragon_eye']) {
    assert.ok(ITEMS[id].star && !(ITEMS[id].price > 0) && sellPrice(id) > 0 && ITEM_KANA[id], id);
    for (const s of Object.values(SHOPS)) assert.ok(!s.items.includes(id), `${id} は 店で 売らない`);
  }
});

test('めずらしい 魔物: 配合でも 生まれる（ヒントも 出る）', { timeout: 60000 }, async () => {
  assert.equal(breedResult('pururin', 'skeleton', MONSTERS), 'pururin_knight');
  assert.equal(breedResult('skeleton', 'kirakira', MONSTERS), 'pururin_knight');
  assert.equal(breedResult('rockman', 'skeleton', MONSTERS), 'clockwork_knight');
  assert.equal(breedResult('chibi_dragon', 'sea_serpent', MONSTERS), 'great_dragon');
  assert.equal(breedResult('demon_knight', 'chibi_dragon', MONSTERS), 'axe_rider');
  assert.equal(breedResult('thunder_imp', 'star_panther', MONSTERS), 'ikazuchi_tiger');
  // いままでの 配合は かわらない
  assert.equal(breedResult('rockman', 'armor_crab', MONSTERS), 'golem');
  assert.equal(breedResult('pururin', 'ice_pururin', MONSTERS), 'king_pururin');
  assert.equal(breedResult('skeleton', 'goblin', MONSTERS), 'demon_knight');
  for (const sp of NEW_MONSTERS) assert.ok(recipeHint(sp, MONSTERS), sp);
  // ほんとうに 配合する（ちびドラゴン ＋ 海へび → ヴァルドラゴン）
  const { world, bot, c } = await solo(46, 20);
  const a = addMonsterCompanion(world, bot.s, 'chibi_dragon', 12);
  const b = addMonsterCompanion(world, bot.s, 'sea_serpent', 12);
  c.items.push({ id: 'iron_helm', n: 1 });
  bot.send({ t: 'menu', action: 'equip', id: 'iron_helm', who: a.key });
  assert.equal(c.companions.find((e) => e.key === a.key).char.equip.head, 'iron_helm', 'ちびドラゴンは かぶとを かぶれる');
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, name: 'ヴァル' });
  const r = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.ok(r.ok, r.text);
  const kid = c.companions.find((e) => e.species === 'great_dragon');
  assert.ok(kid && kid.char.level === 1 && kid.char.name === 'ヴァル');
  assert.equal(itemCount(c, 'iron_helm'), 1, 'おやの 装備は ふくろへ');
  assert.ok(learnedAbilities(kid.char).includes('m_bite'));
  assert.equal(c.bestiary.great_dragon.bred, 1);
});

test('めずらしい 魔物: 仲間に なると 強いが、強すぎない（同じ レベルの ほかの 魔物と くらべる）', () => {
  const lv = 20;
  const st = (sp) => computeStats(newMonsterCompanion({ id: 'x', species: sp, level: lv }));
  const others = Object.keys(MONSTER_FRIENDS).filter((sp) => !NEW_MONSTERS.includes(sp)).map(st);
  const maxOf = (k) => Math.max(...others.map((s) => s[k]));
  for (const sp of NEW_MONSTERS) {
    const s = st(sp);
    for (const k of ['maxHp', 'atk', 'dfn', 'agi']) assert.ok(s[k] <= maxOf(k) * 1.12, `${sp}: ${k} ${s[k]}（ほかの いちばん ${maxOf(k)}）`);
    const sum = s.maxHp / 3 + s.atk + s.dfn + s.agi;
    assert.ok(sum > others.map((o) => o.maxHp / 3 + o.atk + o.dfn + o.agi).sort((x, y) => x - y)[Math.floor(others.length / 2)], `${sp}: ふつうより 強い`);
  }
});

test('せつめい: 魔物の 装備できる 物・その 品を 装備できる 仲間の 魔物の 名前', async () => {
  const { whoCanEquip, gearText } = await import('../public/js/client/ui/info.js');
  assert.match(gearText('pururin_knight'), /武器（剣・やり・短剣）/);
  assert.match(gearText('pururin_knight'), /たて/);
  assert.doesNotMatch(gearText('pururin'), /武器/);
  assert.match(gearText('pururin'), /よろい（服）・ぼうし・アクセサリー/);
  assert.equal(whoCanEquip('power_ring'), 'だれでも装備できる');
  const mons = [{ name: 'ランス', species: 'pururin_knight' }, { name: 'ぷるる', species: 'pururin' }];
  const sword = whoCanEquip('iron_sword', mons);
  assert.match(sword, /^装備: 戦士/);
  assert.match(sword, /仲間の魔物: ランス$/);
  assert.match(whoCanEquip('wood_bat', mons), /仲間の魔物は装備できない/);
  assert.match(whoCanEquip('iron_sword'), /仲間の魔物 \d+種類/, '名前が 分からない ときは 数');
  assert.ok(!whoCanEquip('iron_sword', []).includes('魔物'), 'まだ 魔物の なかまが いない ときは 書かない');
});
