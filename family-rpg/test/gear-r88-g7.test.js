// 第88回 G7班: 犬夜しゃ・ゆう☆遊☆白書
//   品の 数・名前が かぶらない・鉄さいがの 生まれ変わり（7だん）・四こんの玉・そろい・使う・とびら 2まいと ライバル・ガチャ・試練の ごほうび・宝の洞窟
//   （伝説の 強さ・★・読みがな は test/gear-r88.test.js が ぜんぶの 品で たしかめる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { ITEMS_R88 } from '../public/js/shared/data/items-r88.js';
import { SHIKON_KAKERA, SHIKON } from '../public/js/shared/data/items-r88-inuyasha.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { setTitles, rebirthNeedLack } from '../public/js/shared/gear-r88.js';
import { rebirthNeedText } from '../public/js/shared/gear-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { rebirthOf, upgradeCost, canUpgrade } from '../public/js/shared/data/forge.js';
import { upgradeId } from '../public/js/shared/data/items-forge.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN, GACHA_PRICE, r88MeiAll } from '../public/js/shared/data/gacha-r88.js';
import { RIVALS, RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { doorOpen } from '../public/js/shared/rivals-r88.js';
import { giveRivalRewards } from '../public/js/shared/world/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { hallLayout, roomId } from '../public/js/shared/maps/rivals-r88.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { T } from '../public/js/shared/tiles.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';

const ids = (work) => Object.keys(ITEMS_R88).filter((id) => ITEMS[id].work === work);
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  return c;
}
function fight(chars, enemies = ['rockman', 'rockman', 'pururin']) {
  const b = new Battle({ rng: makeRng(88), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const ev0 = () => ({ lines: [], upd: [] });

// ───────────── 品 ─────────────
test('G7: 品の 数（犬夜しゃ 32〈かけら 5つ〉＝ 36・ゆう☆遊☆白書 29）。作品・使う 技・入れない 品', () => {
  assert.equal(WORKS.inuyasha.name, '犬夜しゃ');
  assert.equal(WORKS.yuhaku.name, 'ゆう☆遊☆白書');
  assert.equal(ids('inuyasha').length, 36);
  assert.equal(ids('yuhaku').length, 29);
  for (const id of [...ids('inuyasha'), ...ids('yuhaku')]) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  const names = Object.values(ITEMS).map((it) => it.name);
  for (const n of ['霧骨', 'むこつ', '銀骨', 'ぎんこつ', '凶骨', 'きょうこつ', '赤子', '白夜', '煉骨', 'れんこつ', 'イチガキ']) assert.ok(!names.some((x) => x?.includes(n)), n);
  // 名前は かぶらない（作品の 中・ほかの 作品・今の 品と 技）
  const all = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!it.base && !ids('inuyasha').includes(id) && !ids('yuhaku').includes(id)) all.set(it.name, id);
  const ab = new Set(Object.entries(ABILITIES).filter(([k]) => !k.startsWith('r88u_')).map(([, a]) => a.name));
  const seen = new Set();
  for (const id of [...ids('inuyasha'), ...ids('yuhaku')]) {
    const n = ITEMS[id].name;
    assert.ok(!all.has(n) && !ab.has(n) && !seen.has(n), n);
    seen.add(n);
  }
});

test('G7: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）', () => {
  const list = [...ids('inuyasha'), ...ids('yuhaku')].filter((id) => ITEMS[id].use);
  assert.equal(list.length, 13);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
    c.equip[it.type] = id;
    const d = hero('warrior');
    d.id = 'p2';
    const b = fight([c, d]);
    const me = b.allies[0];
    // てんせいがは たおれた 仲間が いる 時
    if (id === 'r88_iy_tenseiga') { b.allies[1].alive = false; b.allies[1].hp = 0; }
    if (id === 'r88_yh_ankoku') b.allies[1].hp = 1;
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = ev0();
    b.perform(me, { type: 'item', id: `gear:${u.slot}` }, ev);
    assert.equal(me.mp, mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    if (id === 'r88_iy_tenseiga') assert.ok(b.allies[1].alive && b.allies[1].hp >= b.allies[1].maxHp * 0.4, ev.lines.join('/'));
    if (id === 'r88_yh_ankoku') {
      assert.equal(b.allies[1].hp, b.allies[1].maxHp, '仲間 1人を 全回復');
      assert.ok(me.hp <= me.maxHp - Math.round(me.maxHp * 0.5) + 1, 'HPを 半分 使う');
    }
    assert.equal(b.validate(me, { type: 'item', id: `gear:${u.slot}` }).ok, false, `${id}: 2回め`);
  }
});

// ───────────── 生まれ変わり ─────────────
test('G7: 鉄さいがの 7だん（さびついた刀 → 風のきず → ばくりゅうは → 赤 → 金ごうそうは → 竜りん → 黒い鉄さいが〈てんせいが〉）', () => {
  const line = ['r88_iy_sabi', 'r88_iy_kazenokizu', 'r88_iy_bakuryu', 'r88_iy_aka', 'r88_iy_kongou', 'r88_iy_ryurin', 'r88_iy_kuro'];
  assert.deepEqual(line.map((id) => ITEMS[id].grade), ['shop', 'mei', 'mei', 'mei', 'mei', 'den', 'den']);
  for (let i = 0; i < line.length - 1; i++) {
    const rb = rebirthOf(line[i]);
    assert.equal(rb?.to, line[i + 1], line[i]);
    const cost = upgradeCost(upgradeId(line[i], rb.at), null);
    assert.ok(cost?.reborn && cost.to.startsWith(line[i + 1]), `${line[i]}: ${JSON.stringify(cost)}`);
    assert.ok(cost.gold > (ITEMS[line[i]].sell || 0), '売っても もうからない');
  }
  assert.equal(rebirthOf('r88_iy_kuro'), null, 'いちばん 上');
  // 竜りん → 黒い 鉄さいがは てんせいがを 持つ こと・きたえた 回数を うけつぐ
  const rb = rebirthOf('r88_iy_ryurin');
  assert.deepEqual(rb.need, { items: ['r88_iy_tenseiga'] });
  assert.ok(rb.keep);
  const c = hero('inuyasha');
  assert.ok(rebirthNeedLack(c, rb.need));
  c.items.push({ id: 'r88_iy_tenseiga', n: 1 });
  assert.equal(rebirthNeedLack(c, rb.need), null);
  // 犬夜しゃは 剣を 持てる
  c.equip.weapon = 'r88_iy_kuro';
  assert.ok(computeStats(c).atk > 0);
});

test('G7: 四こんの玉（かけら 5つ ＋ 竜りんか 黒い 鉄さいがを 持って、かけらを きたえる）', () => {
  assert.equal(SHIKON_KAKERA.length, 5);
  assert.deepEqual(GEAR_SETS.shikon_kakera.items, SHIKON_KAKERA);
  for (const id of SHIKON_KAKERA) {
    assert.equal(rebirthOf(id).to, SHIKON);
    assert.ok(canUpgrade(id, null), id);
  }
  assert.equal(ITEMS[SHIKON].grade, 'den');
  const need = rebirthOf(SHIKON_KAKERA[0]).need;
  assert.match(rebirthNeedText(need), /鉄さいが・竜りんか黒い鉄さいがを持っていること/);
  const c = hero();
  c.items = SHIKON_KAKERA.slice(0, 4).map((id) => ({ id, n: 1 }));
  c.items.push({ id: 'r88_iy_ryurin', n: 1 });
  assert.equal(rebirthNeedLack(c, need).length, 1, '4つでは まだ');
  c.items.push({ id: SHIKON_KAKERA[4], n: 1 });
  assert.equal(rebirthNeedLack(c, need), null);
  c.items = c.items.filter((e) => e.id !== 'r88_iy_ryurin');
  assert.equal(rebirthNeedLack(c, need).length, 1, '鉄さいがが ない');
  c.items.push({ id: 'r88_iy_kuro', n: 1 });
  assert.equal(rebirthNeedLack(c, need), null, '黒い 鉄さいがでも よい');
  assert.ok(setTitles(c).some((t) => t.title === '四こんの玉を集めし者'));
});

test('G7: かじ屋で かけら → 四こんの玉', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(88), rateLimit: false });
  const bot = new Bot(world, 'ヒナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.gold = 99999;
  for (const id of SHIKON_KAKERA) addItem(c, id, 1);
  addItem(c, 'star_shard', 20);
  addItem(c, 'magic_powder', 10);
  const send = () => {
    bot.send({ t: 'svc', kind: 'forge', action: 'upgrade', id: SHIKON_KAKERA[2] });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let res = send();
  assert.equal(res.ok, false, '鉄さいがが ない');
  assert.match(res.text, /竜りん/);
  addItem(c, 'r88_iy_ryurin', 1);
  res = send();
  assert.equal(res.ok, true, res.text);
  assert.equal(itemCount(c, SHIKON), 1);
  assert.equal(itemCount(c, SHIKON_KAKERA[2]), 0);
});

// ───────────── そろい ─────────────
test('G7: 闇の三大秘宝（2つ 持って 1つ つけると 闇に強い・3つで しょう号）', () => {
  assert.deepEqual(GEAR_SETS.yami_hihou.items, ['r88_yh_goma', 'r88_yh_ankoku', 'r88_yh_gakidama']);
  const c = hero();
  c.equip.weapon = 'r88_yh_goma';
  const r0 = computeStats(c).resist.dark ?? 1;
  c.items = [{ id: 'r88_yh_gakidama', n: 1 }];
  assert.ok((computeStats(c).resist.dark ?? 1) < r0);
  c.items.push({ id: 'r88_yh_ankoku', n: 1 });
  assert.ok(setTitles(c).some((t) => t.title === '闇の三大秘宝の主'));
  // 右うでの 包帯は 玉（武器の ふつうの 攻撃が 炎）
  assert.equal(ITEMS.r88_yh_houtai.orb.el, 'fire');
  const d = hero();
  d.equip.weapon = 'r88_iy_goraishi';
  assert.equal(gearFxTotals(d).slay_spirit, 4, '五雷指は ゆうれいキラー');
});

// ───────────── とびらと ライバル ─────────────
test('G7: とびら 2まい（犬夜しゃ・ゆう☆遊☆白書）。5人ずつ・弱い 順・さいごが Lv100', () => {
  const di = RIVAL_DOORS.find((d) => d.work === 'inuyasha');
  const dy = RIVAL_DOORS.find((d) => d.work === 'yuhaku');
  assert.ok(di && dy);
  for (const d of [di, dy]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    for (const j of d.jobs) assert.ok(JOBS[j], j);
  }
  assert.deepEqual(rivalsOf('inuyasha').map((r) => r.id), ['iy_kagura', 'iy_kouga', 'iy_shichinin', 'iy_sessho', 'iy_sessho2']);
  assert.deepEqual(rivalsOf('inuyasha').map((r) => r.reward), [['r88_iy_kagura'], ['r88_iy_goraishi'], ['r88_iy_banryu', 'r88_iy_jakotsu'], ['r88_iy_tenseiga', 'r88_iy_toukijin'], ['r88_iy_bakusaiga']]);
  assert.deepEqual(rivalsOf('yuhaku').map((r) => r.id), ['yh_hihou', 'yh_urotogi', 'yh_bui', 'yh_shigure', 'yh_genkai']);
  assert.deepEqual(rivalsOf('yuhaku').map((r) => r.reward), [['r88_yh_goma', 'r88_yh_ankoku', 'r88_yh_gakidama'], ['r88_yh_makoku', 'r88_yh_kibidango'], ['r88_yh_bui_yoroi', 'r88_yh_bui_ono'], ['r88_yh_rinka'], ['r88_yh_reikou']]);
  for (const w of ['inuyasha', 'yuhaku']) {
    const list = rivalsOf(w);
    assert.ok(list.length <= 5);
    for (let i = 0; i < list.length; i++) {
      const rv = list[i];
      const last = i === list.length - 1;
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      assert.equal(rivalTier(rv.lv), last ? 100 : den ? 80 : 60, rv.id);
      if (i) assert.ok(rv.lv >= list[i - 1].lv);
      assert.ok(rv.words.length <= 40);
      assert.ok(rv.sig?.charge && rv.sig?.cast && rv.tune?.hp > 0);
      for (const m of rv.members || [rv]) assert.ok(JOBS[m.job], m.job);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)]);
      if (rv.sig.anim?.startsWith('r88_')) assert.ok(R88_ANIMS.has(rv.sig.anim), rv.sig.anim);
    }
  }
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('iy_kagura')].bg, 'forest');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('iy_sessho2')].bg, 'hoshiyomi');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('yh_bui')].bg, 'arena');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('yh_genkai')].bg, 'temple3');
  // 部屋（犬夜しゃは 森・ゆう☆遊☆白書は 石）と 回ろうの とびら
  const ri = MAPS[roomId('inuyasha')];
  assert.equal(ri.tiles[ri.w + 1], T.TREE);
  assert.equal(ri.tiles[3 * ri.w + 2], T.PINE);
  assert.ok(MAPS[roomId('yuhaku')]);
  const L = hallLayout();
  for (const w of ['inuyasha', 'yuhaku']) assert.ok(L.doors.some((d) => d.work === w), w);
  for (const d of L.doors) assert.ok(d.x > 0 && d.x < MAPS.rival_hall.w - 2, d.work);
  // 新しい えんしゅつ
  for (const a of ['r88_bakusai', 'r88_reikou', 'r88_jigento']) assert.ok(R88_ANIMS.has(a), a);
  assert.equal(ABILITIES.r88u_yh_jigento.anim, 'r88_jigento');
});

test('G7: とびらは 品を 3つで 開く。勝つと 品（七人隊は 2つ・三大秘宝の 3人は 3つ）', () => {
  const c = newCharacter({ id: 'a', name: 'ア', job: 'warrior', look: {} });
  c.items.push({ id: 'r88_iy_nenju', n: 1 }, { id: 'r88_iy_koma', n: 1 });
  assert.equal(doorOpen(c, 'inuyasha'), false);
  c.items.push({ id: 'r88_iy_shakujo', n: 1 });
  assert.equal(doorOpen(c, 'inuyasha'), true);
  assert.equal(doorOpen(c, 'yuhaku'), false);
  for (const id of ['r88_yh_lupe', 'r88_yh_itako', 'r88_yh_youkikei']) c.items.push({ id, n: 1 });
  assert.equal(doorOpen(c, 'yuhaku'), true);
  giveRivalRewards([c], RIVAL_BY_ID.iy_shichinin);
  giveRivalRewards([c], RIVAL_BY_ID.yh_hihou);
  for (const id of ['r88_iy_banryu', 'r88_iy_jakotsu', 'r88_yh_goma', 'r88_yh_ankoku', 'r88_yh_gakidama']) assert.ok(c.items.some((e) => e.id === id), id);
});

// ───────────── 手に入れ方 ─────────────
test('G7: ガチャに 2作品が ならぶ。ライバル・伝説・生まれ変わりの 先・店・試練の ごほうびは 出ない', () => {
  assert.ok(gachaWorks().includes('inuyasha') && gachaWorks().includes('yuhaku'));
  const rival = new Set(RIVALS.flatMap((r) => r.reward));
  const p1 = gachaPool('inuyasha');
  const p2 = gachaPool('yuhaku');
  assert.equal(p1.all.length, 19);
  assert.equal(p2.all.length, 18);
  assert.equal(p1.all.length * GACHA_PRICE, 380000);
  assert.equal(p2.all.length * GACHA_PRICE, 360000);
  for (const id of [...p1.all, ...p2.all]) {
    assert.ok(['mei', 'fu3', 'fu2'].includes(ITEMS[id].grade), id);
    assert.ok(!rival.has(id), id);
  }
  for (const id of SHIKON_KAKERA) assert.ok(p1.mei.includes(id), id);
  assert.ok(p1.mei.includes('r88_iy_kanna'), '神無の鏡（神無は ライバルに しない）');
  assert.ok(p2.fu.includes('r88_yh_yoyo'), 'デビルヨーヨー（すずこまは ライバルに しない）');
  const block = {
    r88_iy_sabi: 'shop', r88_iy_kazenokizu: 'rebirth', r88_iy_kongou: 'rebirth', r88_iy_ryurin: 'legend', r88_iy_shikon: 'legend', r88_iy_hinezumi: 'trial',
    r88_iy_tenseiga: 'rival', r88_iy_kagura: 'rival', r88_yh_ring: 'trial', r88_yh_reikou: 'legend', r88_yh_rinka: 'rival', r88_yh_goma: 'rival',
  };
  for (const [id, why] of Object.entries(block)) assert.equal(gachaBlock(id), why, id);
  assert.ok(r88MeiAll().includes('r88_iy_hiraikotsu'), '宝の 入れ物の 名品にも');
});

test('G7: 試練の ごほうび（犬夜しゃ → 火ねずみの衣・ゆう助 → れいげきリング）・はじめの 品・宝の洞窟の 伝説', () => {
  assert.equal(trialGiftOf('inuyasha'), 'r88_iy_hinezumi');
  assert.equal(trialGiftOf('yusuke'), 'r88_yh_ring');
  assert.ok(shopItems(SHOPS.village).includes('r88_iy_sabi'), 'さびついた刀は ホシフル村の よろず屋');
  for (const id of ['r88_iy_sounga', 'r88_yh_jigento']) {
    assert.ok(TM_R88_DEN.includes(id), id);
    assert.equal(ITEMS[id].grade, 'den');
  }
});
