// 第88回 G14班: 鋼のれん金術師・アナと雪の女王
//   品の 数・名前・今 ある 品の 作品（チョーク など）・全部の 品に 手に入れ方が ある・使う（ぜんぶ 動く）・発火布の手ぶくろと 雨・
//   4つの せいれいの しるしの そろいと 第5のせいれいのドレス（氷の石の台）・とびら 2まいと ライバル（グリードと ラストは 2体で 2つ）・
//   ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS_R88_HAGAREN } from '../public/js/shared/data/items-r88-hagaren.js';
import { ITEMS_R88_FROZEN, SPIRIT_MARKS, FIFTH_DRESS, FIFTH_ALTAR, FIFTH_FLAG } from '../public/js/shared/data/items-r88-frozen.js';
import { setTitles, reachOf } from '../public/js/shared/gear-r88.js';
import { dressState, grantDress } from '../public/js/shared/world/frozen-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { setWeather } from '../public/js/shared/battle-weather.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, rivalsOf, rivalTier, rivalEnc, rivalMembers } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { paintGachaSpecial } from '../public/js/client/render/gacha-art.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const WORKS2 = ['hagaren', 'frozen'];
const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const newIds = (work) => ids(work).filter((id) => ITEMS[id].src === 'r88');
const mineAll = () => [...newIds('hagaren'), ...newIds('frozen')];
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars) {
  const b = new Battle({ rng: makeRng(12), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies: ['rockman', 'rockman', 'pururin'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G14: 品の 数（鋼のれん金術師 26・アナと雪の女王 25）。今 ある 品にも 作品（チョークは れん金術師の 品。強さ・値段は そのまま）', () => {
  assert.equal(Object.keys(ITEMS_R88_HAGAREN).length, 26);
  assert.equal(Object.keys(ITEMS_R88_FROZEN).length, 25);
  assert.equal(newIds('hagaren').length, 26);
  assert.equal(newIds('frozen').length, 25);
  assert.equal(WORKS.hagaren.name, '鋼のれん金術師');
  assert.equal(WORKS.frozen.name, 'アナと雪の女王');
  assert.deepEqual(ids('hagaren').filter((id) => ITEMS[id].src !== 'r88').sort(), ['automail_arm', 'chalk', 'philosopher_stone']);
  assert.deepEqual(ids('frozen').filter((id) => ITEMS[id].src !== 'r88').sort(), ['c7it_queen_robe', 'snowqueen_shield', 'tmd_snow_queen_ring']);
  assert.equal(ITEMS.chalk.price, 30);
  assert.equal(ITEMS.automail_arm.src, 'tm');
  assert.equal(ITEMS.philosopher_stone.src, 'sd');
  for (const id of ['chalk', 'automail_arm', 'philosopher_stone', 'c7it_queen_robe', 'snowqueen_shield', 'tmd_snow_queen_ring']) {
    assert.ok(ITEMS[id].r88Tag, id);
    assert.equal(gachaBlock(id), 'grade', id);
  }
  // 賢者の石を 持って いても、スレイヤーズの オリハルコンの像は まだ ガチャに 出る（べつの 作品の 生まれ変わりは つながない）
  assert.ok(gachaPool('slayers').all.includes('r88_orihalcon'));
  for (const id of mineAll()) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set(mineAll());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(hg|fz)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(hg|fz)_/.test(id)).map((id) => ABILITIES[id].name);
  assert.equal(myAb.length, 6);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n) && !abNames.has(n), `技 ${n}`);
  // 伝説・本物の 銃は ない
  assert.deepEqual(newIds('hagaren').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_hg_hakka', 'r88_hg_saber']);
  assert.deepEqual(newIds('frozen').filter((id) => ITEMS[id].grade === 'den'), [FIFTH_DRESS]);
  for (const id of mineAll()) assert.ok(!/銃|じゅう|ピストル/.test(ITEMS[id].name), id);
  // 最強のほこは 1グループに とどく・アルの よろいは 毒・ねむり・マヒに かかりにくい・発火布は 氷に 弱い
  const c = hero('fullmetal');
  c.equip.weapon = 'r88_hg_hoko';
  assert.equal(reachOf(c), 'group');
  for (const st of ['poison', 'sleep', 'paralyze']) assert.ok(ITEMS.r88_hg_al.resist[st] < 1, st);
  assert.ok(ITEMS.r88_hg_hakka.resist.ice > 1);
  assert.ok(ITEMS.r88_hg_hakka.fx.some((x) => x.k === 'el_fire'));
});

test('G14: 手に 入らない 品は ない（店・ガチャ・ライバル・試練・氷の石の台・宝の 入れ物）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  for (const w of WORKS2) {
    const pool = new Set(gachaPool(w).all);
    const rival = new Set(rivalsOf(w).flatMap((rv) => rv.reward));
    for (const id of newIds(w)) {
      const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練', id === FIFTH_DRESS && '台',
        TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
      assert.ok(how.length, `${id}: 手に入れ方が ない`);
    }
  }
  assert.ok(shop.has('r88_hg_yari') && shop.has('r88_fz_boots'), 'はじめの 品は 店に');
});

test('G14: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 2つ', () => {
  const list = mineAll().filter((id) => ITEMS[id].use);
  assert.deepEqual(list.sort(), ['r88_fz_dress5', 'r88_fz_scepter', 'r88_fz_troll', 'r88_hg_gauntlet', 'r88_hg_hakka', 'r88_hg_scar'].sort());
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c, hero('warrior')]);
    const me = b.allies[0];
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    assert.ok(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), `${id}: 2回めは だめ`);
  }
  // トロールの いやしの光: 仲間 1人の 混乱と ねむりを 治して 回復
  const c = hero('warrior');
  c.equip.acc = 'r88_fz_troll';
  const b = fight([c, hero('warrior')]);
  const pal = b.allies[1];
  pal.status.confuse = { turns: 3 };
  pal.status.sleep = { turns: 3 };
  pal.hp = 50;
  useGear(b, b.allies[0], 'use_acc');
  assert.ok(!pal.status.confuse && !pal.status.sleep, '治る');
  assert.ok(pal.hp > 50, '回復');
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_snap', 'r88_elsa']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_hg_hakka.use.ability].anim, 'r88_snap');
  assert.equal(ABILITIES[ITEMS[FIFTH_DRESS].use.ability].anim, 'r88_elsa');
});

// ───────────── 発火布の手ぶくろと 雨 ─────────────
test('G14: 発火布の手ぶくろ … 晴れなら 敵全体に 炎。雨の 時は しめって 火が 出ない（1回は へらない。雨が やめば 使える）', () => {
  // 晴れ（天気なし も 同じ）
  for (const kind of ['sun', null]) {
    const c = hero('warrior');
    c.equip.weapon = 'r88_hg_hakka';
    const b = fight([c]);
    if (kind) setWeather(b, kind, 10, 'ally');
    const me = b.allies[0];
    const hp = b.enemies.map((e) => e.hp);
    const ev = useGear(b, me, 'use_weapon');
    assert.equal(ev.ability, 'r88u_hg_snap');
    assert.ok(b.enemies.every((e, i) => e.hp < hp[i]), `${kind}: 敵全体に 炎`);
    assert.ok(me.gearUses.find((x) => x.slot === 'use_weapon').used);
  }
  // 雨（敵の 側の 雨でも）
  for (const side of ['ally', 'enemy']) {
    const c = hero('warrior');
    c.equip.weapon = 'r88_hg_hakka';
    const b = fight([c]);
    setWeather(b, 'rain', 10, side);
    const me = b.allies[0];
    const hp = b.enemies.map((e) => e.hp);
    const ev = useGear(b, me, 'use_weapon');
    assert.ok(ev.lines.join('').includes('しめっていて、火が出ない'), ev.lines.join('/'));
    assert.ok(!ev.ability, '技は 出ない');
    assert.deepEqual(b.enemies.map((e) => e.hp), hp, '何も 起きない');
    const u = me.gearUses.find((x) => x.slot === 'use_weapon');
    assert.ok(!u.used, '1回は へらない');
    // 雨が やむと 使える
    b.weather = null;
    const ev2 = useGear(b, me, 'use_weapon');
    assert.equal(ev2.ability, 'r88u_hg_snap');
    assert.ok(u.used);
  }
  // ほかの 品は 雨でも ふつうに 使える
  const c = hero('warrior');
  c.equip.weapon = 'r88_hg_scar';
  const b = fight([c]);
  setWeather(b, 'rain', 10, 'ally');
  assert.equal(useGear(b, b.allies[0], 'use_weapon').ability, 'r88u_hg_bunkai');
});

// ───────────── そろいと 第5のせいれいのドレス ─────────────
test('G14: 4つの せいれいの しるしは 1人が 4つ 持つと しょう号「第5のせいれい」', () => {
  assert.deepEqual(GEAR_SETS.frozen_spirits.items, SPIRIT_MARKS);
  for (const id of SPIRIT_MARKS) {
    assert.equal(ITEMS[id].set, 'frozen_spirits', id);
    assert.equal(ITEMS[id].type, 'acc', id);
    assert.ok(gachaPool('frozen').all.includes(id), `${id}: ガチャで 出る`);
    assert.ok(ITEMS[id].desc.includes('白銀の湖'), `${id}: 行く 所が 書いて ある`);
  }
  assert.ok(GEAR_SETS.frozen_spirits.tiers[0].text.includes('氷の石の台'));
  const c = hero('warrior');
  for (const id of SPIRIT_MARKS.slice(0, 3)) addItem(c, id, 1);
  assert.ok(!setTitles(c).some((t) => t.set === 'frozen_spirits'));
  c.bank = { gold: 0, items: [{ id: SPIRIT_MARKS[3], n: 1 }] }; // 預かり所でも よい
  assert.ok(setTitles(c).some((t) => t.title === '第5のせいれい'));
});

test('G14: 第5のせいれいのドレス … 4つの しるしを 持って 氷の石の台へ（しるしは のこる。1人 1回）', async () => {
  const m = MAPS[FIFTH_ALTAR.map];
  assert.equal(m.name, 'シロガネ地方');
  const n = m.npcs.find((x) => x.id === 'r88_fifth_altar');
  assert.ok(n && n.x === FIFTH_ALTAR.x && n.y === FIFTH_ALTAR.y);
  assert.ok(SCRIPTS.r88_fifth);
  assert.ok(paintGachaSpecial('r88_fifth_altar', 'down', 0));
  assert.equal(m.npcs.filter((x) => x.x === n.x && x.y === n.y).length, 1);
  assert.ok(!m.chests.some((x) => x.x === n.x && x.y === n.y));
  assert.equal(gachaBlock(FIFTH_DRESS), 'legend');
  const c = hero();
  assert.equal(dressState(c), 'lack');
  assert.equal(grantDress(c), false);
  // 台の 前で 話す（3つ → 4つ → もう もらえない）
  const world = new GameWorld({ offline: true, rng: makeRng(14), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const d = world.data.characters[bot.char.id];
  const spots = [[0, -1, 'down'], [0, 1, 'up'], [1, 0, 'left'], [-1, 0, 'right']];
  const s = spots.find(([dx, dy]) => !isBlocked(m, n.x + dx, n.y + dy, () => true));
  assert.ok(s, '台の まわりに 立てる');
  world.placeSession(bot.s, FIFTH_ALTAR.map, n.x + s[0] + 0.5, n.y + s[1] + 0.5, s[2], true);
  for (const id of SPIRIT_MARKS.slice(0, 3)) addItem(d, id, 1);
  await bot.talk('r88_fifth_altar');
  assert.equal(itemCount(d, FIFTH_DRESS), 0);
  d.equip.acc = SPIRIT_MARKS[3]; // 装備して いても よい
  await bot.talk('r88_fifth_altar');
  assert.equal(itemCount(d, FIFTH_DRESS), 1, 'ドレスが もらえる');
  for (const id of SPIRIT_MARKS.slice(0, 3)) assert.equal(itemCount(d, id), 1, `${id}: しるしは のこる`);
  assert.equal(d.equip.acc, SPIRIT_MARKS[3]);
  assert.equal(d.flags[FIFTH_FLAG], true);
  // 売っても もう もらえない（1人 1回）
  d.items = d.items.filter((x) => x.id !== FIFTH_DRESS);
  await bot.talk('r88_fifth_altar');
  assert.equal(itemCount(d, FIFTH_DRESS), 0, '1人 1回');
  const text = bot.msgs.filter((x) => x.t === 'script').flatMap((x) => x.steps).filter((st) => st[0] === 'say').map((st) => st[2]).join('\n');
  assert.ok(text.includes('3/4') && text.includes('第5のせいれいのドレスを手に入れた'), text);
});

// ───────────── とびらと ライバル ─────────────
test('G14: とびら 2まいと ライバル（5人ずつ・弱い 順・さいごは Lv100。グリードと ラストは 2体で 2つ もらえる）', () => {
  const dh = RIVAL_DOORS.find((d) => d.work === 'hagaren');
  const df = RIVAL_DOORS.find((d) => d.work === 'frozen');
  assert.ok(dh && df);
  assert.equal(RIVAL_DOORS.filter((d) => WORKS2.includes(d.work)).length, 2);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  for (const d of [dh, df]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  assert.ok(dh.jobs.includes('fullmetal') && df.jobs.includes('snow_queen'));
  const h = rivalsOf('hagaren');
  assert.deepEqual(h.map((x) => x.id), ['hg_scar', 'hg_greed', 'hg_olivier', 'hg_mustang', 'hg_bradley']);
  assert.deepEqual(h.map((x) => x.reward), [['r88_hg_scar'], ['r88_hg_tate', 'r88_hg_hoko'], ['r88_hg_meito'], ['r88_hg_hakka'], ['r88_hg_saber', 'r88_hg_patch']]);
  assert.deepEqual(rivalMembers(h[1]).map((x) => x.name), ['グリード', 'ラスト']);
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('hg_greed')].group.reduce((s, [, k]) => s + k, 0), 2, 'グリードと ラストは 2体');
  const f = rivalsOf('frozen');
  assert.deepEqual(f.map((x) => x.id), ['fz_marshmallow', 'fz_hans', 'fz_bruni', 'fz_nokk', 'fz_giant']);
  assert.deepEqual(f.map((x) => x.reward), [['r88_fz_claw'], ['r88_fz_hans'], ['r88_fz_bruni'], ['r88_fz_mane'], ['r88_fz_rock']]);
  for (const list of [h, f]) {
    assert.equal(list.length, 5);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(list[list.length - 1].lv, 100);
    for (const rv of list) {
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      const last = rv === list[list.length - 1];
      assert.equal(rivalTier(rv.lv), last ? 100 : den ? 80 : 60, `${rv.id}: Lv${rv.lv}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, rv.work, id);
    }
  }
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('hg_scar')].bg, 'desert');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('hg_mustang')].bg, 'plains_east');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('fz_hans')].bg, 'snowfield');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('fz_giant')].bg, 'summit');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G14: ガチャガチャ（2作品が ならぶ。ライバル・伝説・店・試練の ごほうび・ドレスは 出ない。しるしは 出る）', () => {
  assert.ok(gachaWorks().includes('hagaren') && gachaWorks().includes('frozen'));
  const ph = gachaPool('hagaren'), pf = gachaPool('frozen');
  assert.equal(ph.all.length, 17);
  assert.equal(pf.all.length, 17);
  for (const [w, p] of [['hagaren', ph], ['frozen', pf]]) {
    const all = new Set(p.all);
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || [trialGiftOf('fullmetal'), trialGiftOf('snow_queen')].includes(id)
        || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  assert.ok(!pf.all.includes(FIFTH_DRESS));
  for (const id of SPIRIT_MARKS) assert.ok(pf.all.includes(id), id);
});

test('G14: 試練の ごほうび（はがねのれん金術師 → 赤いコート・雪の女王 → 氷のドレス）', () => {
  assert.equal(trialGiftOf('fullmetal'), 'r88_hg_coat');
  assert.equal(trialGiftOf('snow_queen'), 'r88_fz_icedress');
  assert.equal(ITEMS.r88_hg_coat.name, '赤いコート');
  assert.equal(ITEMS.r88_fz_icedress.name, '氷のドレス');
  for (const id of ['r88_hg_coat', 'r88_fz_icedress']) {
    assert.equal(ITEMS[id].grade, 'mei', id);
    assert.equal(gachaBlock(id), 'trial', id);
  }
});

// ───────────── セーブと 引っこし ─────────────
test('G14: セーブと 引っこしコード（ライバル・品・ドレスを もらった 記録）', () => {
  const c = hero('snow_queen');
  c.rivals = { hg_greed: 1, fz_giant: 1 };
  for (const id of [...SPIRIT_MARKS, 'r88_hg_tate', 'r88_hg_hoko', 'r88_hg_hakka']) addItem(c, id, 1);
  grantDress(c);
  c.equip.armor = FIFTH_DRESS;
  c.items = c.items.filter((x) => x.id !== FIFTH_DRESS);
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { hg_greed: 1, fz_giant: 1 });
  assert.equal(back.equip.armor, FIFTH_DRESS);
  assert.equal(itemCount(back, 'r88_hg_hakka'), 1);
  assert.equal(back.flags[FIFTH_FLAG], true, 'ドレスを もらった 記録');
  assert.equal(dressState(back), 'done');
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
