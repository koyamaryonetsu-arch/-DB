// 第88回 G4班: 作品を 思い出す 装備の 手に入れ方（docs/plan-r88-anime-gear.md の 7・実装メモ（G4班））
//   ガチャガチャ（入れ物・わりあい・10回の あとの 名品・G6班: まだ 持って いない 品だけ・全部 そろう・お金）・はじめの 品の 店・七つの玉と 竜神の ほこら・
//   宝の 入れ物・試練の ごほうび・しおり・セーブと 引っこしコード
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { serviceAction } from '../public/js/shared/world/services.js';
import { ITEMS, sellPrice } from '../public/js/shared/data/items.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { addItem, itemCount, newCharacter } from '../public/js/shared/stats.js';
import { lbId } from '../public/js/shared/data/items-forge.js';
import {
  GACHA_PRICE, GACHA_MEI_RATE, GACHA_PITY, gachaBlock, gachaTier, gachaOwned, gachaPool, gachaWorks, rollGacha, clearGachaCache, R88_RIVAL_GIFTS,
  ORB_PLACES, orbChestId, SEVEN_ORBS, RYUJIN_ORB, HOKORA, r88TmLoot, r88SdExtra, tmR88Rate, sdR88Rate, r88MeiAll, r88ShopItems, ownsR88,
  gachaDone, trialGiftFlag, addRivalGifts, rivalGiftIds, TM_R88_DEN, TM_R88_DEN_LV,
} from '../public/js/shared/data/gacha-r88.js';
import { gachaSpin, gachaView, hokoraExchange, trialGiftSteps } from '../public/js/shared/world/gacha-r88.js';
import { GACHA_SPOTS } from '../public/js/shared/maps/gacha-r88.js';
import { RIVALS } from '../public/js/shared/data/rivals-r88.js';
import { Bot } from './helpers.js';

// いつも 決まった 目が 出る 乱数（chance … 当たり／はずれ。pick … 何番め）
const fixedRng = (hit, at = 0) => ({ chance: () => hit, pick: (a) => a[Math.min(at, a.length - 1)], next: () => 0.5 });
const freshChar = (gold = 1000000) => {
  const c = newCharacter({ id: 'g4', name: 'ソラ', job: 'warrior', look: { body: 0, hair: 1, hairColor: 2, skin: 0, color: 3 } });
  c.gold = gold;
  return c;
};

// ───────────── 1. 出る 品の 入れ物 ─────────────
test('ガチャ: YAIBA は ふつう 4つ・名品 1つ。伝説・はじめの 品・生まれ変わりの 先・ライバルの 品・玉は 出ない', () => {
  assert.ok(gachaWorks().includes('yaiba'));
  const p = gachaPool('yaiba');
  assert.deepEqual([...p.fu].sort(), ['r88_eyepatch', 'r88_kanabo', 'r88_oni_horn', 'r88_shinai']);
  assert.deepEqual(p.mei, ['r88_niten']);
  // G5班: ほう神演義・スレイヤーズ・烈火の炎も ならぶ（G2班の gacha: false を 外した）
  assert.deepEqual(gachaWorks().slice(0, 4), ['yaiba', 'houshin', 'slayers', 'rekka']); // G7班から あとの 作品は うしろに
  for (const id of p.all) {
    const it = ITEMS[id];
    assert.ok(['mei', 'fu3', 'fu2'].includes(it.grade), id);
    assert.equal(gachaBlock(id), null);
  }
  // 出ない 物と その わけ
  assert.equal(gachaBlock('r88_haou_sword'), 'legend');
  assert.equal(gachaBlock('r88_raikoben'), 'legend');
  assert.equal(gachaBlock('r88_bokuto'), 'shop');
  assert.equal(gachaBlock('r88_raijin_sword'), 'rebirth', '雷神剣は 木刀の 生まれ変わり');
  assert.equal(gachaBlock('r88_kikuichi'), 'rival');
  assert.equal(gachaBlock('r88_fujin_sword'), 'rival');
  for (const id of SEVEN_ORBS) assert.equal(gachaBlock(id), 'orb', id);
  assert.notEqual(gachaBlock(RYUJIN_ORB), null);
  assert.equal(gachaBlock('herb'), 'notWork');
  // 生まれ変わりの 先は 1つも 入らない
  const to = new Set(Object.values(REBIRTH).map((r) => r.to));
  for (const id of p.all) assert.ok(!to.has(id), id);
  for (const r of RIVALS) for (const id of r.reward || []) { assert.ok(!p.all.includes(id), id); assert.equal(gachaBlock(id) === null, false, id); }
  assert.ok(rivalGiftIds().has('r88_kikuichi'), 'G3班の RIVALS の ごほうびを 読む');
});

test('ガチャ: 品を 足すと 自動で 入る。gacha: false・rival: true・addRivalGifts で 外れる', () => {
  ITEMS.r88_test_fu = { type: 'acc', grade: 'fu2', work: 'yaiba', rank: 4, rarity: 2, src: 'r88', name: 'ためしの品' };
  ITEMS.r88_test_off = { type: 'acc', grade: 'mei', work: 'yaiba', rank: 8, rarity: 4, src: 'r88', name: 'ためしの品2', gacha: false };
  ITEMS.r88_test_rv = { type: 'acc', grade: 'mei', work: 'yaiba', rank: 8, rarity: 4, src: 'r88', name: 'ためしの品3', rival: true };
  ITEMS.r88_test_rv2 = { type: 'acc', grade: 'mei', work: 'yaiba', rank: 8, rarity: 4, src: 'r88', name: 'ためしの品4' };
  try {
    clearGachaCache();
    let p = gachaPool('yaiba');
    assert.ok(p.fu.includes('r88_test_fu'));
    assert.ok(p.mei.includes('r88_test_rv2'));
    assert.ok(!p.all.includes('r88_test_off'));
    assert.ok(!p.all.includes('r88_test_rv'));
    addRivalGifts(['r88_test_rv2']);
    p = gachaPool('yaiba');
    assert.ok(!p.all.includes('r88_test_rv2'), 'G3班の 一覧で 外れる');
  } finally {
    for (const k of ['r88_test_fu', 'r88_test_off', 'r88_test_rv', 'r88_test_rv2']) delete ITEMS[k];
    R88_RIVAL_GIFTS.delete('r88_test_rv2');
    clearGachaCache();
  }
  assert.equal(gachaPool('yaiba').all.length, 5);
});

// ───────────── 2. わりあい・10回の あとの 名品 ─────────────
test('ガチャ: 名品は 2わり（ふつう 8わり）', () => {
  const rng = makeRng(88);
  let mei = 0;
  const N = 20000;
  for (let i = 0; i < N; i++) if (rollGacha(rng, 'yaiba', 0).tier === 'mei') mei++;
  assert.ok(Math.abs(mei / N - GACHA_MEI_RATE) < 0.015, `名品 ${(mei / N).toFixed(3)}`);
  assert.equal(GACHA_MEI_RATE, 0.2);
});

test('ガチャ: 名品が 出ない まま 10回 回すと、次は かならず 名品（キャラごと・作品ごとの 数）', () => {
  const c = freshChar();
  const miss = fixedRng(false, 0); // いつも ふつうの のこりの 1番め（同じ 品は 出ないので 毎回 ちがう 品）
  const ix = gachaWorks().indexOf('houshin');
  const seen = new Set();
  for (let i = 1; i <= GACHA_PITY; i++) {
    const r = gachaSpin(c, 'houshin', miss);
    assert.equal(r.ok, true, r.text);
    assert.equal(r.got.tier, 'fu', `${i}回め`);
    assert.ok(!seen.has(r.got.id), `${i}回め: 同じ 品は 出ない`);
    seen.add(r.got.id);
    assert.equal(c.gacha.houshin, i);
  }
  assert.equal(gachaView(c).works[ix].left, 0);
  const r = gachaSpin(c, 'houshin', miss);
  assert.equal(r.got.tier, 'mei', '11回めは かならず 名品');
  assert.equal(r.got.id, gachaPool('houshin').mei[0]);
  assert.equal(c.gacha.houshin, 0, '名品で もどる');
  // ほかの キャラは べつの 数
  const d = freshChar();
  assert.equal(d.gacha, undefined);
  assert.equal(gachaView(d).works[ix].left, GACHA_PITY);
});

test('ガチャ: のこりが ふつうだけ・名品だけ なら、のこって いる 方から。名品が ない 間は 10回の 数が すすまない', () => {
  const p = gachaPool('slayers');
  // 名品を 全部 持って いる → ふつうだけ（当たりの 目でも ふつう）。数は すすまない
  const c = freshChar();
  for (const id of p.mei) addItem(c, id, 1);
  c.gacha = { slayers: 7 };
  const r1 = gachaSpin(c, 'slayers', fixedRng(true, 0));
  assert.equal(r1.got.tier, 'fu');
  assert.equal(c.gacha.slayers, 7, '名品が のこって いない 間は 数えない');
  assert.equal(gachaView(c).works.find((w) => w.id === 'slayers').left, null);
  // あとで 名品を 1つ 売ると、また 名品が 出る（数は こわれて いない）
  c.items = c.items.filter((e) => e.id !== p.mei[0]);
  assert.equal(gachaView(c).works.find((w) => w.id === 'slayers').left, GACHA_PITY - 7);
  // ふつうを 全部 持って いる → 名品だけ（はずれの 目でも 名品）
  const d = freshChar();
  for (const id of p.fu) addItem(d, id, 1);
  d.gacha = { slayers: 3 };
  const r2 = gachaSpin(d, 'slayers', fixedRng(false, 0));
  assert.equal(r2.got.tier, 'mei');
  assert.equal(d.gacha.slayers, 0);
  // rollGacha も のこりから（持って いる 品を わたす）
  const own = new Set(p.all.slice(1));
  assert.deepEqual(rollGacha(fixedRng(true, 0), 'slayers', 0, own), { id: p.all[0], tier: gachaTier(p.all[0]) });
  assert.equal(rollGacha(fixedRng(true, 0), 'slayers', 0, new Set(p.all)), null);
});

// ───────────── 3. 同じ 品は 出ない・全部 そろう・お金 ─────────────
test('ガチャ: まだ 持って いない 品だけが 出る（同じ 品は 出ない。お金も もどらない）', () => {
  const c = freshChar(100000);
  const r1 = gachaSpin(c, 'yaiba', fixedRng(false, 0));
  assert.equal(c.gold, 100000 - GACHA_PRICE);
  const id = r1.got.id;
  assert.equal(itemCount(c, id), 1);
  assert.equal(r1.got.rest, 4);
  assert.match(r1.text, /のこり4こ/);
  assert.equal(r1.got.dup, undefined, '「同じ 品」の しくみは ない');
  assert.equal(r1.got.refund, undefined);
  const r2 = gachaSpin(c, 'yaiba', fixedRng(false, 0));
  assert.notEqual(r2.got.id, id, '同じ 目でも ちがう 品');
  assert.equal(itemCount(c, r2.got.id), 1);
  assert.equal(c.gold, 100000 - 2 * GACHA_PRICE);
  // 預かり所に ある 品も「持って いる」→ 出ない
  const d = freshChar();
  d.bank = { gold: 0, items: [{ id, n: 1 }] };
  assert.ok(ownsR88(d, id));
  for (let i = 0; i < 4; i++) assert.notEqual(gachaSpin(d, 'yaiba', makeRng(30 + i)).got.id, id);
});

test('ガチャ: のこりが なくなるまで 回すと 全部 そろう。どの 作品も 品の 数 × 20000G（YAIBA 10万G・スレイヤーズ 32万G・烈火の炎 62万G・ほう神演義 70万G）', () => {
  const want = { yaiba: 100000, slayers: 320000, rekka: 620000, houshin: 700000, inuyasha: 380000, yuhaku: 360000, ranma: 520000, nube: 320000, naruto: 540000, kimetsu: 500000, dragonball: 360000, onepiece: 540000, kenshin: 380000, conan: 380000, kaito: 140000, doraemon: 480000, sailormoon: 460000, hagaren: 340000, frozen: 340000, dai: 260000, dq: 340000 }; // G15班: ダイの大冒険・ドラゴンクエスト // G11班: るろうに剣心・コナン・快と // G8班: らんま1/2・ぬ〜べ〜 / G10班: ナルト・きめつのやいば / G9班: ドラゴンボール・ワンピース / G12班: ドラえもん・セーラームーン
  for (const w of gachaWorks()) {
    const p = gachaPool(w);
    assert.equal(p.all.length * GACHA_PRICE, want[w], w);
    for (const seed of [1, 2, 3]) {
      const c = freshChar(10000000);
      const rng = makeRng(seed * 31 + w.length);
      const got = [];
      let rest = p.all.length;
      while (!gachaDone(c, w)) {
        const r = gachaSpin(c, w, rng);
        assert.equal(r.ok, true, r.text);
        assert.ok(!got.includes(r.got.id), `${w}: ${r.got.id} は 1回だけ`);
        got.push(r.got.id);
        rest--;
        assert.equal(r.got.rest, rest);
        assert.equal(gachaView(c).works.find((x) => x.id === w).rest, rest, 'まどの のこり');
        assert.ok(got.length <= p.all.length);
      }
      assert.deepEqual([...got].sort(), [...p.all].sort(), `${w}: 全部 1つずつ`);
      assert.equal(10000000 - c.gold, want[w], `${w}: そろえる お金`);
      // 名品が 出ない まま 11回めに なる ことは ない（10回の きまり）
      let miss = 0;
      for (const id of got) {
        miss = gachaTier(id) === 'mei' ? 0 : miss + 1;
        assert.ok(miss <= GACHA_PITY || !got.slice(got.indexOf(id)).some((x) => gachaTier(x) === 'mei'), `${w}: 10回の きまり`);
      }
    }
  }
});

test('ガチャ: その 作品の 品を 全部 持って いると「全部そろった！」で 回せない', () => {
  const c = freshChar(100000);
  for (const id of gachaPool('yaiba').all) addItem(c, id, 1);
  assert.ok(gachaDone(c, 'yaiba'));
  const r = gachaSpin(c, 'yaiba', fixedRng(false, 0));
  assert.equal(r.ok, false);
  assert.match(r.text, /全部そろった/);
  assert.equal(c.gold, 100000, 'お金は へらない');
  const v = gachaView(c).works[0];
  assert.equal(v.done, true);
  assert.equal(v.rest, 0);
});

test('ガチャ: 「持って いる」は きたえた 物・限界とっぱ・装備・生まれ変わった 先・形を かえた 物も。売ると また 出る', () => {
  const p = gachaPool('yaiba');
  const c = freshChar();
  // きたえた 二天一流の二刀（+3）を 装備・限界とっぱの 竹刀は ふくろ
  c.equip.weapon = 'r88_niten+3';
  assert.ok(ITEMS[lbId('r88_shinai', 4, 1)], '竹刀+4★1');
  c.items.push({ id: lbId('r88_shinai', 4, 1), n: 1 });
  const own = gachaOwned(c);
  assert.ok(own.has('r88_niten') && own.has('r88_shinai'));
  assert.equal(gachaView(c).works[0].rest, p.all.length - 2);
  for (let i = 0; i < 3; i++) {
    const r = gachaSpin(c, 'yaiba', makeRng(70 + i));
    assert.ok(!['r88_niten', 'r88_shinai'].includes(r.got.id), r.got.id);
  }
  assert.ok(gachaDone(c, 'yaiba'), 'のこり 3つで そろう');
  // 生まれ変わった 先: 風神を 持って いれば 風のツメも 持って いる（烈火の炎）
  assert.equal(REBIRTH.r88_kaze_tsume.to, 'r88_fujin');
  assert.ok(gachaPool('rekka').all.includes('r88_kaze_tsume'));
  const d = freshChar();
  d.bank = { gold: 0, items: [{ id: 'r88_fujin', n: 1 }] };
  assert.ok(ownsR88(d, 'r88_kaze_tsume'));
  assert.ok(gachaView(d).works.find((w) => w.id === 'rekka').items.find((x) => x.id === 'r88_kaze_tsume').own);
  // 作品の 品で ない 先（賢者の石）を 持って いても、オリハルコンの像は まだ 出る
  const e = freshChar();
  e.items.push({ id: 'philosopher_stone', n: 1 });
  assert.ok(!ownsR88(e, 'r88_orihalcon'));
  // 形を かえた 物（同じ shape の 品）は 1つの 品
  const forms = Object.keys(ITEMS).filter((id) => ITEMS[id].shape === 'kougon' && !ITEMS[id].base);
  assert.ok(forms.length >= 2);
  const f = freshChar();
  f.equip.weapon = forms[1];
  for (const id of forms) assert.ok(ownsR88(f, id), id);
  // 売った（ふくろから なくなった）品は また 出る
  const g = freshChar();
  for (const id of p.all) addItem(g, id, 1);
  assert.ok(gachaDone(g, 'yaiba'));
  g.items = g.items.filter((x) => x.id !== 'r88_kanabo');
  assert.ok(!gachaDone(g, 'yaiba'));
  const r = gachaSpin(g, 'yaiba', makeRng(5));
  assert.equal(r.got.id, 'r88_kanabo', '売った 品が また 出る');
  assert.ok(gachaDone(g, 'yaiba'));
});

test('ガチャ: お金が 足りないと 回せない・ない 作品は 回せない', () => {
  const c = freshChar(GACHA_PRICE - 1);
  const r = gachaSpin(c, 'yaiba', fixedRng(true, 0));
  assert.equal(r.ok, false);
  assert.match(r.text, /お金が足りない/);
  assert.equal(c.gold, GACHA_PRICE - 1);
  assert.equal(c.items.some((e) => ITEMS[e.id]?.work), false);
  const d = freshChar();
  for (const w of ['nope', '__proto__', 7]) assert.equal(gachaSpin(d, w, fixedRng(true)).ok, false, String(w));
  assert.equal(d.gold, 1000000);
});

test('ガチャ: お金が ふえる 道は ない（売っても はらった 分より 少ない）', () => {
  for (const w of gachaWorks()) {
    for (const id of gachaPool(w).all) {
      const s = sellPrice(id);
      assert.ok(s > 0, id);
      assert.ok(s <= GACHA_PRICE / 4, `${id} 売り値 ${s} は ねだんの 4分の1 いか`);
    }
  }
});

// ───────────── 4. サーバーの 窓口（1人ずつ）─────────────
async function player(world, name) {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  return { bot, c: world.data.characters[bot.char.id] };
}

test('ガチャ: 店の 人に 話して 画面を 開いてから 回す。家族でも 自分の お金・自分の 品', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const a = await player(world, 'ソラ');
  const b = await player(world, 'ミオ');
  a.c.gold = 100000;
  b.c.gold = 100000;
  const spin = (p) => {
    serviceAction(world, p.bot.s, { kind: 'gacha', action: 'spin', work: 'yaiba' });
    return p.bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  // 画面を 開く 前は だめ
  assert.equal(spin(a).ok, false);
  assert.equal(a.c.gold, 100000);
  // ルミナの町の 店の 人
  const g = GACHA_SPOTS[0];
  world.placeSession(a.bot.s, g.map, g.keeper[0] + 0.5, g.keeper[1] + 1.5, 'up', true);
  a.bot.choice = 0;
  await a.bot.talk('r88_gacha_keeper_0');
  const ui = a.bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'ui' && st[1] === 'gacha');
  assert.ok(ui, '画面が 開く');
  assert.equal(ui[2].price, GACHA_PRICE);
  assert.deepEqual(ui[2].works.map((w) => w.id).slice(0, 4), ['yaiba', 'houshin', 'slayers', 'rekka'], 'G5班: 3作品が ならぶ');
  assert.ok(a.c.flags.r88_gacha_seen);
  const r = spin(a);
  assert.equal(r.ok, true, r.text);
  assert.ok(r.got && ITEMS[r.got.id].work === 'yaiba');
  assert.equal(a.c.gold, 100000 - GACHA_PRICE);
  assert.ok(ownsR88(a.c, r.got.id));
  // ミオは かわらない（画面も 開いて いない）
  assert.equal(b.c.gold, 100000);
  assert.equal(spin(b).ok, false);
  assert.ok(!b.c.items.some((e) => ITEMS[e.id]?.work));
});

test('ガチャ: 台と 店の 人は ルミナの町（星の神殿の 外）と 王都サファラ', () => {
  assert.equal(GACHA_SPOTS.length, 2);
  const names = [];
  GACHA_SPOTS.forEach((g, i) => {
    const m = MAPS[g.map];
    const mc = m.npcById[`r88_gacha_${i}`];
    const kp = m.npcById[`r88_gacha_keeper_${i}`];
    assert.ok(mc && kp);
    assert.equal(mc.sprite, 'r88_gacha');
    assert.ok(SCRIPTS[mc.script] && SCRIPTS[kp.script]);
    names.push(m.areaName(kp.x, kp.y));
    // 立つ 場所が ふさがって いない（前の マス）
    assert.ok(!isBlocked(m, kp.x, kp.y + 1, () => true));
  });
  assert.deepEqual(names, ['ルミナの町', '王都サファラ']);
});

// ───────────── 5. はじめの 品の 店 ─────────────
test('はじめの 品: 木刀は ホシフル村の よろず屋に ならぶ（品から 自動で）', () => {
  assert.deepEqual(r88ShopItems(), { village: ['r88_bokuto', 'r88_tsurizao', 'r88_shortsword', 'r88_jewels', 'r88_iy_sabi', 'r88_nb_monosashi', 'r88_nr_shuriken', 'r88_db_seiryu', 'r88_ks_shinai', 'r88_hg_yari', 'r88_fz_boots', 'r88_da_papnica', 'r88_da_booster'] }); // G15班: パプニカのナイフ・マジカルブースター // G14班: れん成のやり・冬のブーツ // G11班: 神谷道場の竹刀 // G10班: 木の葉の手裏剣 / G9班: 青竜刀 / G2班の はじめの 品（つりざお・リナのショートソード・ジュエルズアミュレット）も
  assert.ok(shopItems(SHOPS.village).includes('r88_bokuto'));
  assert.equal(ITEMS.r88_bokuto.price, 50);
  // 格が「店」の 作品の 品は ぜんぶ どこかの 店に
  const all = Object.values(SHOPS).flatMap((s) => shopItems(s, () => true));
  for (const [id, it] of Object.entries(ITEMS)) if (it?.work && it.grade === 'shop' && !it.base) assert.ok(all.includes(id), id);
});

// ───────────── 6. 七つの玉と 竜神の ほこら ─────────────
// 入口から 歩いて 行けるか（となりの マスまで）
function reachable(m, x, y) {
  const starts = m.id === 'overworld' ? [[56, 30]] : m.warps.map((w) => [w.x, w.y]);
  const seen = new Uint8Array(m.w * m.h);
  const q = [];
  for (const [sx, sy] of starts) { seen[sy * m.w + sx] = 1; q.push([sx, sy]); }
  for (let h = 0; h < q.length; h++) {
    const [cx, cy] = q[h];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx === x && ny === y) return true;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen[ny * m.w + nx]) continue;
      if (isBlocked(m, nx, ny, () => true) || m.chestAt.has(ny * m.w + nx)) continue;
      seen[ny * m.w + nx] = 1;
      q.push([nx, ny]);
    }
  }
  return false;
}

test('七つの玉: 7つの 場所に 1つずつ。宝箱は 歩いて 行ける 所', () => {
  assert.equal(ORB_PLACES.length, 7);
  assert.deepEqual(ORB_PLACES.map((p) => p.item).sort(), [...SEVEN_ORBS].sort());
  const spots = new Set();
  for (const p of ORB_PLACES) {
    const m = MAPS[p.map];
    const ch = m.chests.find((x) => x.id === orbChestId(p));
    assert.ok(ch, p.id);
    assert.equal(ch.item, p.item);
    assert.equal(m.chestAt.get(p.y * m.w + p.x), ch, `${p.id} の マスに ほかの 宝箱が ない`);
    assert.ok(!isBlocked(m, p.x, p.y, () => true), `${p.id} は かべの 中で ない`);
    assert.ok(!m.npcs.some((n) => Math.floor(n.x) === p.x && Math.floor(n.y) === p.y), p.id);
    assert.ok(reachable(m, p.x, p.y), `${p.id} に 行ける`);
    assert.ok(p.hint && !p.hint.includes(m.name), `${p.id} の うわさに 地名を 書かない`);
    spots.add(`${p.map}:${p.x},${p.y}`);
  }
  assert.equal(spots.size, 7);
  const top = MAPS[HOKORA.map];
  assert.ok(top.npcById.r88_hokora);
  assert.ok(reachable(top, HOKORA.x, HOKORA.y));
});

test('七つの玉: 宝箱は キャラごとに 1回。7つ そろえて ほこらで 竜神の玉と 引きかえ（7つは なくなる）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9), rateLimit: false });
  const { bot, c } = await player(world, 'ソラ');
  for (const p of ORB_PLACES) {
    const m = MAPS[p.map];
    world.placeSession(bot.s, p.map, p.x + 0.5, p.y + 1.5, 'up', true);
    if (isBlocked(m, p.x, p.y + 1, () => true)) world.placeSession(bot.s, p.map, p.x + 1.5, p.y + 0.5, 'left', true);
    await bot.examine(p.x, p.y);
    assert.ok(c.chests[orbChestId(p)], p.id);
    assert.equal(itemCount(c, p.item), 1, p.id);
    await bot.examine(p.x, p.y);
    assert.equal(itemCount(c, p.item), 1, `${p.id} は 1回だけ`);
  }
  // 1つ 装備して いても 引きかえられる
  c.equip.acc = 'r88_orb_tou';
  c.items = c.items.filter((e) => e.id !== 'r88_orb_tou');
  // ほこら（はい）
  world.placeSession(bot.s, HOKORA.map, HOKORA.x + 0.5, HOKORA.y + 1.5, 'up', true);
  bot.choice = 0;
  await bot.talk('r88_hokora');
  for (const id of SEVEN_ORBS) assert.ok(!ownsR88(c, id), `${id} は なくなる`);
  assert.equal(c.equip.acc, null);
  assert.equal(itemCount(c, RYUJIN_ORB), 1);
  // もう 玉が ないので 2つめは もらえない
  assert.equal(hokoraExchange(c), false);
  assert.equal(itemCount(c, RYUJIN_ORB), 1);
});

test('七つの玉: 6つでは 引きかえられない。「やめる」も できる', async () => {
  const c = freshChar();
  for (const id of SEVEN_ORBS.slice(0, 6)) addItem(c, id, 1);
  assert.equal(hokoraExchange(c), false);
  assert.equal(itemCount(c, RYUJIN_ORB), 0);
  for (const id of SEVEN_ORBS.slice(0, 6)) assert.equal(itemCount(c, id), 1);
  const world = new GameWorld({ offline: true, rng: makeRng(10), rateLimit: false });
  const { bot, c: d } = await player(world, 'ミオ');
  for (const id of SEVEN_ORBS) addItem(d, id, 1);
  world.placeSession(bot.s, HOKORA.map, HOKORA.x + 0.5, HOKORA.y + 1.5, 'up', true);
  bot.choice = 1;
  await bot.talk('r88_hokora');
  for (const id of SEVEN_ORBS) assert.equal(itemCount(d, id), 1);
  assert.equal(itemCount(d, RYUJIN_ORB), 0);
});

test('七つの玉: ガチャガチャ屋が うわさを 1つずつ（まだ 見つけて いない 玉。地名は 言わない）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(11), rateLimit: false });
  const { bot, c } = await player(world, 'ソラ');
  const g = GACHA_SPOTS[0];
  world.placeSession(bot.s, g.map, g.keeper[0] + 0.5, g.keeper[1] + 1.5, 'up', true);
  c.chests[orbChestId(ORB_PLACES[0])] = true;
  bot.choice = 1;
  const heard = new Set();
  for (let i = 0; i < 6; i++) {
    const n = bot.msgs.length;
    await bot.talk('r88_gacha_keeper_0');
    const says = bot.msgs.slice(n).filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]);
    const h = ORB_PLACES.find((p) => says.includes(p.hint));
    assert.ok(h, 'うわさが 1つ');
    heard.add(h.id);
  }
  assert.equal(heard.size, 6, '6つの うわさを じゅんに');
  assert.ok(!heard.has(ORB_PLACES[0].id), '見つけた 玉の うわさは 言わない');
  assert.ok(c.flags.r88_orb_heard);
});

// ───────────── 7. 宝の 入れ物 ─────────────
test('宝の 入れ物: ひみつのダンジョン 20階から・宝の洞窟 Lv26 から 名品が まれに。レア装備は へらない', () => {
  // G5班: ぜんぶの 作品の 名品（YAIBA の 二天一流の二刀が 先頭）
  assert.equal(r88MeiAll()[0], 'r88_niten');
  assert.ok(r88MeiAll().length > 1);
  for (const id of r88MeiAll()) assert.equal(ITEMS[id].grade, 'mei');
  // ひみつのダンジョン
  assert.deepEqual(r88SdExtra(19, fixedRng(true)), []);
  assert.deepEqual(r88SdExtra(20, fixedRng(true)), [{ item: 'r88_niten', n: 1 }]);
  assert.deepEqual(r88SdExtra(45, fixedRng(false)), []);
  assert.equal(sdR88Rate(20), 0.05);
  assert.equal(sdR88Rate(40), 0.08);
  // 宝の洞窟
  assert.equal(tmR88Rate(25), 0);
  assert.equal(tmR88Rate(30, 'bossA'), 0);
  const gold = { gold: 500 };
  const shopEq = { item: 'iron_sword' };
  assert.deepEqual(r88TmLoot(fixedRng(true), 25, 'normal', shopEq), shopEq, 'Lv25 までは かわらない');
  assert.deepEqual(r88TmLoot(fixedRng(true), 30, 'normal', shopEq), { item: 'r88_niten' }, '店の 装備の かわり');
  assert.deepEqual(r88TmLoot(fixedRng(true), 30, 'normal', gold), gold, 'ふつうの 宝箱の お金は そのまま（装備の 出やすさを かえない）');
  assert.deepEqual(r88TmLoot(fixedRng(true), 30, 'bossB', gold), { item: 'r88_niten' });
  const rare = Object.keys(ITEMS).find((id) => ITEMS[id].src === 'tm' && ITEMS[id].rarity >= 3);
  assert.deepEqual(r88TmLoot(fixedRng(true), 30, 'bossA', { item: rare }), { item: rare }, 'レア装備は そのまま');
  assert.deepEqual(r88TmLoot(fixedRng(true), 30, 'bossA', { item: 'limit_stone', n: 1 }), { item: 'limit_stone', n: 1 });
  // 本当の 宝箱: Lv30 の ふつうの 宝箱で 名品は 2〜4%・レア装備（★2〜）の 出る 数は 名品が ない 時と 同じ
  let r88 = 0, rareN = 0;
  const N = 6000;
  for (let i = 0; i < N; i++) {
    const l = chestLoot(makeRng(1000 + i), 30, 'normal');
    if (ITEMS[l.item]?.work) r88++;
    else if ((ITEMS[l.item]?.rarity || 0) >= 2) rareN++;
  }
  assert.ok(r88 / N > 0.02 && r88 / N < 0.04, `名品 ${(r88 / N).toFixed(3)}`);
  // 名品が 1つも ない 時（入れ物を 空に して）と くらべる
  const meiAll = r88MeiAll();
  addRivalGifts(meiAll);
  let rare0 = 0;
  try {
    assert.deepEqual(r88MeiAll(), []);
    for (let i = 0; i < N; i++) {
      const l = chestLoot(makeRng(1000 + i), 30, 'normal');
      assert.ok(!ITEMS[l.item]?.work);
      if ((ITEMS[l.item]?.rarity || 0) >= 2) rare0++;
    }
  } finally {
    for (const id of meiAll) R88_RIVAL_GIFTS.delete(id);
    clearGachaCache();
  }
  assert.equal(rareN, rare0, 'レア装備の 数は 同じ');
  assert.ok(rareN / N > 0.1, `レア装備 ${(rareN / N).toFixed(3)}`);
});

test('G6: 斬よう剣（スレイヤーズの 伝説）は 宝の洞窟の いちばん おくの 伝説の 入れ物に（光界玉・ガルヴェイラ・ラグドメゼギスと いっしょ）', () => {
  assert.equal(ITEMS.r88_zanyo.name, '斬よう剣');
  assert.equal(ITEMS.r88_zanyo.work, 'slayers');
  assert.equal(gachaBlock('r88_zanyo'), 'legend', 'ガチャには 出ない');
  assert.ok(TM_R88_DEN.includes('r88_zanyo'));
  assert.deepEqual(TM_R88_DEN.slice(0, 3), ['r88_kokai', 'r88_galvaira', 'r88_ragud']);
  const last = { chance: () => true, pick: (a) => a[a.indexOf('r88_zanyo')], next: () => 0.5 }; // G7班: うしろに 伝説が ふえたので 斬よう剣を えらぶ
  assert.deepEqual(r88TmLoot(last, TM_R88_DEN_LV, 'bossB', { gold: 500 }), { item: 'r88_zanyo' });
  assert.notEqual(r88TmLoot(last, TM_R88_DEN_LV - 1, 'bossB', { gold: 500 }).item, 'r88_zanyo');
  // 本当の 宝箱で 出る（Lv48 の 2つめの 主の 宝箱）
  let n = 0;
  for (let i = 0; i < 6000 && !n; i++) if (chestLoot(makeRng(300 + i), 48, 'bossB').item === 'r88_zanyo') n++;
  assert.ok(n > 0, '斬よう剣が 出る');
  // ほかに 斬よう剣が 手に 入る 所は ない（ライバルでは ない）
  assert.ok(!RIVALS.some((r) => (r.reward || []).includes('r88_zanyo')));
});

// ───────────── 8. 試練の ごほうび ─────────────
test('試練の ごほうび: works.js の trialGift の 品を、一の試練を こえた 人が 1回 もらう（仮の データ）', () => {
  assert.deepEqual(WORKS.yaiba.trialGift || {}, {}, 'YAIBA は 木刀から 生まれ変わるので 今は 空');
  const before = WORKS.yaiba.trialGift;
  WORKS.yaiba.trialGift = { yaiba: 'r88_shinai' };
  clearGachaCache();
  try {
    assert.equal(gachaBlock('r88_shinai'), 'trial', '試練の ごほうびは ガチャに 入らない');
    const c = freshChar();
    c.jobs.yaiba = { lv: 10, tr: 0 };
    assert.deepEqual(trialGiftSteps(c, '番人'), [], 'まだ こえて いない');
    c.jobs.yaiba.tr = 1;
    const steps = trialGiftSteps(c, '番人');
    assert.ok(steps.some((st) => st[0] === 'say' && /竹刀/.test(st[2])));
    assert.equal(itemCount(c, 'r88_shinai'), 1);
    assert.ok(c.flags[trialGiftFlag('yaiba')]);
    assert.deepEqual(trialGiftSteps(c, '番人'), [], '2回めは ない');
    assert.equal(itemCount(c, 'r88_shinai'), 1);
  } finally {
    if (before === undefined) delete WORKS.yaiba.trialGift;
    else WORKS.yaiba.trialGift = before;
    clearGachaCache();
  }
});

test('試練の ごほうび: もう こえて いる 人は、試練の番人に 話すと もらえる', async () => {
  const before = WORKS.yaiba.trialGift;
  WORKS.yaiba.trialGift = { yaiba: 'r88_shinai' };
  clearGachaCache();
  try {
    const world = new GameWorld({ offline: true, rng: makeRng(12), rateLimit: false });
    const { bot, c } = await player(world, 'ソラ');
    c.jobs.yaiba = { lv: 15, tr: 1 };
    const k = MAPS.overworld.npcById.trial_keeper;
    world.placeSession(bot.s, 'overworld', k.x + 0.5, k.y + 1.5, 'up', true);
    await bot.talk('trial_keeper');
    assert.equal(itemCount(c, 'r88_shinai'), 1);
    await bot.talk('trial_keeper');
    assert.equal(itemCount(c, 'r88_shinai'), 1);
  } finally {
    if (before === undefined) delete WORKS.yaiba.trialGift;
    else WORKS.yaiba.trialGift = before;
    clearGachaCache();
  }
});

// ───────────── 9. しおり・セーブと 引っこし ─────────────
test('しおり: 店の 人に 話すと「作品のガチャガチャ」、うわさを 聞くと「七つの玉」が 1行ずつ', () => {
  const c = freshChar();
  const ids = () => shioriOf(c).tracks.map((t) => t.id);
  assert.ok(!ids().includes('gacha'));
  assert.ok(!ids().includes('orbs'));
  c.flags.r88_gacha_seen = true;
  c.flags.r88_orb_heard = true;
  c.chests[orbChestId(ORB_PLACES[2])] = true;
  const t = shioriOf(c).tracks;
  const g = t.find((x) => x.id === 'gacha');
  const o = t.find((x) => x.id === 'orbs');
  assert.ok(g && o);
  assert.equal(g.items.length, gachaWorks().length, '作品ごとに 1行');
  assert.equal(o.now, 1);
  assert.equal(o.total, 7);
  assert.equal(o.items.filter((x) => x.name === '？？？').length, 6, 'まだの 玉は 名前を 出さない');
});

test('セーブと 引っこしコード: ガチャの 回数・玉の 宝箱・もらった しるしが もどる', () => {
  const c = freshChar();
  c.gacha = { yaiba: 7 };
  c.chests[orbChestId(ORB_PLACES[0])] = true;
  c.flags[trialGiftFlag('yaiba')] = true;
  c.flags.r88_gacha_seen = true;
  addItem(c, 'r88_niten', 1);
  const want = repairChar(JSON.parse(JSON.stringify(c)));
  assert.deepEqual(want.gacha, { yaiba: 7 });
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  assert.deepEqual(r.char.gacha, { yaiba: 7 });
  assert.ok(r.char.chests[orbChestId(ORB_PLACES[0])]);
  assert.ok(r.char.flags[trialGiftFlag('yaiba')]);
  assert.equal(itemCount(r.char, 'r88_niten'), 1);
  // こわれた 数は 0〜10 に
  const d = freshChar();
  d.gacha = { yaiba: 'x' };
  assert.equal(gachaView(d).works[0].left, GACHA_PITY);
  d.gacha = { yaiba: 999 };
  assert.equal(gachaView(d).works[0].left, 0);
});
