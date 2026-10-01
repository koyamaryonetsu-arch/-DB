// カジノ（コイン・スロット・ポーカー・景品）と 小さなメダル（メダル王）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { MEDAL_TAKEN_AT } from '../public/js/shared/world/casino.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import {
  COIN_PRICE, COIN_MAX, REELS, SLOT_PAYS, slotPay, slotLine, evalPoker, pokerSuggest, JOKER, PRIZES,
  MEDAL_REWARDS, medalsFound, medalsHeld, medalsGiven, coinsOf, doubleOutcome, POKER_HANDS,
} from '../public/js/shared/data/casino.js';
import { MEDAL_SPOTS, MEDAL_SPOT_BY_ID, MEDAL_CHEST_MAPS, CASINO_DOOR, CASTLE_DOOR, medalChestId, medalSparkleId } from '../public/js/shared/maps/casino.js';
import { MAPS, isBlocked, tileAt } from '../public/js/shared/maps/index.js';
import { TILE_INFO, T } from '../public/js/shared/tiles.js';
import { ITEMS, ITEM_KANA, EQUIP_RANKS } from '../public/js/shared/data/items.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { itemCount } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

// カード: マーク s（0♠ 1♥ 2♦ 3♣）・数 r（2〜14）
const C = (s, r) => s * 13 + (r - 2);
const J = JOKER;

async function player(seed = 5, name = 'ソラ') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  return { world, bot, c };
}

// カジノの 中に いて、まどを 開いた 人
async function gambler(seed = 5) {
  const p = await player(seed);
  p.c.flags.c2_ship = true;
  p.world.placeSession(p.bot.s, 'casino', 14, 16.2, 'up', true);
  // 係の人・台の だいほんの とちゅう（まどが 開いている）
  p.bot.s.busy = 'script';
  p.open = (arg) => openService(p.world, p.bot.s, 'casino', arg);
  p.act = (msg) => {
    serviceAction(p.world, p.bot.s, { kind: 'casino', ...msg });
    return p.bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return p;
}

test('カジノ: コインは 1枚20ゴールドで 買える。変な 数・ゴールド不足・持てる 数を こえる は だめ', async () => {
  const { c, open, act } = await gambler();
  c.gold = 1000;
  assert.equal(coinsOf(c), 0, 'はじめは 0枚（むかしの セーブも）');
  // まどを 開いていないと 買えない
  let r = act({ action: 'buyCoins', n: 10 });
  assert.equal(r.ok, false);
  const ui = open('coins');
  assert.equal(ui.price, COIN_PRICE);
  r = act({ action: 'buyCoins', n: 10 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, 10);
  assert.equal(c.gold, 1000 - 10 * COIN_PRICE);
  for (const n of [0, -5, 1.5, 'abc', null, 10000, Infinity]) {
    r = act({ action: 'buyCoins', n });
    assert.equal(r.ok, false, `n=${n}`);
  }
  assert.equal(c.coins, 10);
  r = act({ action: 'buyCoins', n: 100 });
  assert.equal(r.ok, false, 'ゴールドが 足りない');
  assert.equal(c.gold, 800);
  c.gold = 10 ** 7;
  c.coins = COIN_MAX - 5;
  r = act({ action: 'buyCoins', n: 6 });
  assert.equal(r.ok, false, '持てる 数を こえる');
  r = act({ action: 'buyCoins', n: 5 });
  assert.equal(r.ok, true);
  assert.equal(c.coins, COIN_MAX);
});

test('カジノ: まどを 閉じた あと（だいほんが おわった あと）は 遊べない', async () => {
  const { bot, c, open, act } = await gambler();
  c.coins = 100;
  open('slot1');
  assert.equal(act({ action: 'slot', bet: 1 }).ok, true);
  bot.s.busy = null;
  assert.equal(act({ action: 'slot', bet: 1 }).ok, false, '歩いている ときは 回せない');
  assert.equal(act({ action: 'close' }).ok, true, '閉じる は いつでも');
  bot.s.busy = 'script';
  assert.equal(act({ action: 'slot', bet: 1 }).ok, false, '閉じた まどでは 回せない');
});

test('カジノ: カジノの 外では 何も できない（サーバーが たしかめる）', async () => {
  const { world, bot, c, open, act } = await gambler();
  c.gold = 1000;
  open('coins');
  world.placeSession(bot.s, 'sea', CASINO_DOOR.x + 0.5, CASINO_DOOR.y + 1.6, 'down', true);
  const r = act({ action: 'buyCoins', n: 10 });
  assert.equal(r.ok, false);
  assert.equal(c.gold, 1000);
  assert.equal(openService(world, bot.s, 'casino', 'slot1'), null, '外では まどが 開かない');
});

test('スロット: 役と 倍率（まん中の 列）。店の もうけは 少し', () => {
  assert.equal(slotPay(['seven', 'seven', 'seven']).mult, 250);
  assert.equal(slotPay(['bar', 'bar', 'bar']).id, 'bar3');
  assert.equal(slotPay(['cherry', 'cherry', 'cherry']).id, 'cherry3');
  assert.equal(slotPay(['cherry', 'cherry', 'bell']).id, 'cherry2');
  assert.equal(slotPay(['cherry', 'bell', 'cherry']).id, 'cherry1', '左の チェリーだけ');
  assert.equal(slotPay(['bell', 'cherry', 'cherry']), null, 'チェリーは 左から');
  assert.equal(slotPay(['seven', 'seven', 'bar']), null);
  // ぜんぶの 止まり方を 数える
  let ret = 0, hit = 0, n = 0;
  const L = REELS.map((r) => r.length);
  for (let a = 0; a < L[0]; a++) for (let b = 0; b < L[1]; b++) for (let d = 0; d < L[2]; d++) {
    const p = slotPay(slotLine([a, b, d]));
    n++;
    if (p) { ret += p.mult; hit++; }
  }
  const rtp = ret / n;
  assert.ok(rtp > 0.9 && rtp < 0.97, `もどり ${rtp}`);
  assert.ok(hit / n > 0.25, `当たる 回数 ${hit / n}`);
  for (const p of SLOT_PAYS) assert.ok(p.mult >= 1 && p.name);
});

test('スロット: 賭けと 払いもどしは サーバーの 乱数（おなじ シードなら おなじ 結果）', async () => {
  const play = async () => {
    const { c, open, act } = await gambler(42);
    c.coins = 500;
    const ui = open('slot10');
    assert.equal(ui.bet, 10, '右の 台は 10枚から');
    const log = [];
    for (let i = 0; i < 60; i++) {
      const before = c.coins;
      const bet = [1, 10, 100][i % 3];
      if (before < bet) break;
      const r = act({ action: 'slot', bet });
      assert.equal(r.ok, true, r.text);
      const pay = slotPay(slotLine(r.stops));
      assert.deepEqual(r.line, slotLine(r.stops));
      assert.equal(r.win, pay ? pay.mult * bet : 0);
      assert.equal(c.coins, before - bet + r.win, 'コインの 計算');
      log.push(r.stops.join(','));
    }
    // だめな 賭け
    for (const bet of [0, 5, -10, '10', 1000]) assert.equal(act({ action: 'slot', bet }).ok, false, `bet=${bet}`);
    c.coins = 0;
    assert.equal(act({ action: 'slot', bet: 1 }).ok, false, 'コインが ない');
    return log;
  };
  const a = await play();
  const b = await play();
  assert.ok(a.length > 10);
  assert.deepEqual(a, b, 'おなじ シード → おなじ リール');
});

test('ポーカー: 役の はんてい（ジョーカーは なんにでも なる）', () => {
  const hand = (cards) => evalPoker(cards).id;
  assert.equal(hand([C(0, 10), C(0, 11), C(0, 12), C(0, 13), C(0, 14)]), 'royal');
  assert.equal(hand([C(0, 10), C(0, 11), J, C(0, 13), C(0, 14)]), 'sflush', 'ジョーカー入りは ストレートフラッシュ');
  assert.equal(hand([C(0, 7), C(1, 7), C(2, 7), C(3, 7), J]), 'five');
  assert.equal(hand([C(1, 5), C(1, 6), C(1, 7), C(1, 8), C(1, 9)]), 'sflush');
  assert.equal(hand([C(0, 9), C(1, 9), C(2, 9), C(3, 9), C(0, 2)]), 'four');
  assert.equal(hand([C(0, 9), C(1, 9), C(2, 9), C(3, 4), C(0, 4)]), 'full');
  assert.equal(hand([C(0, 9), C(1, 9), C(2, 4), C(3, 4), J]), 'full', 'ツーペア＋ジョーカー');
  assert.equal(hand([C(2, 2), C(2, 6), C(2, 9), C(2, 11), C(2, 13)]), 'flush');
  assert.equal(hand([C(0, 14), C(1, 2), C(2, 3), C(3, 4), C(0, 5)]), 'straight', 'A-2-3-4-5');
  assert.equal(hand([C(0, 10), C(1, 11), C(2, 12), C(3, 13), C(0, 14)]), 'straight');
  assert.equal(hand([C(0, 8), C(1, 9), J, C(3, 11), C(0, 12)]), 'straight');
  assert.equal(hand([C(0, 8), C(1, 8), C(2, 8), C(3, 11), C(0, 12)]), 'three');
  assert.equal(hand([C(0, 8), C(1, 8), J, C(3, 11), C(0, 2)]), 'three');
  assert.equal(hand([C(0, 8), C(1, 8), C(2, 11), C(3, 11), C(0, 2)]), 'two');
  assert.equal(hand([C(0, 8), C(1, 8), C(2, 11), C(3, 13), C(0, 2)]), 'one');
  assert.equal(hand([C(0, 8), C(1, 3), C(2, 11), C(3, 13), C(0, 2)]), 'none');
  assert.equal(evalPoker([C(0, 8), C(1, 8), C(2, 11), C(3, 13), C(0, 2)]).mult, 0, 'ワンペアは 当たりでは ない');
  // おまかせ: そろった カード・ジョーカー・4枚の フラッシュを のこす
  assert.deepEqual(pokerSuggest([C(0, 8), C(1, 8), C(2, 11), C(3, 13), C(0, 2)]), [true, true, false, false, false]);
  assert.deepEqual(pokerSuggest([C(1, 2), C(1, 6), C(1, 9), C(1, 11), C(0, 5)]), [true, true, true, true, false]);
  assert.deepEqual(pokerSuggest([C(0, 9), C(1, 9), C(2, 9), C(3, 9), C(0, 2)]), [true, true, true, true, false], 'フォーカードは ファイブカードを ねらう');
  assert.ok(pokerSuggest([J, C(0, 3), C(1, 8), C(2, 11), C(3, 13)])[0], 'ジョーカーは のこす');
  assert.deepEqual(pokerSuggest([C(0, 10), C(0, 11), C(0, 12), C(0, 13), C(0, 14)]), [true, true, true, true, true]);
  assert.equal(doubleOutcome(C(0, 7), C(1, 9)), 'win');
  assert.equal(doubleOutcome(C(0, 7), C(1, 7)), 'draw');
  assert.equal(doubleOutcome(C(0, 7), C(1, 3)), 'lose');
  assert.equal(doubleOutcome(C(0, 14), J), 'win', 'ジョーカーが いちばん 強い');
});

test('ポーカー: おまかせで 遊ぶと 少しだけ 店が 勝つ（シード つき）', () => {
  const rng = makeRng(2026);
  const N = 20000;
  let ret = 0;
  for (let i = 0; i < N; i++) {
    const deck = rng.shuffle([...Array(53).keys()]);
    const hand = deck.slice(0, 5);
    let k = 5;
    const hold = pokerSuggest(hand);
    ret += evalPoker(hand.map((card, j) => (hold[j] ? card : deck[k++]))).mult;
  }
  const rtp = ret / N;
  assert.ok(rtp > 0.85 && rtp < 1.0, `もどり ${rtp}`);
  assert.equal(POKER_HANDS.at(-1).id, 'none');
});

test('ポーカー: 配る → 取りかえる → ダブルアップ（勝ち・引き分け・負け）の コイン', async () => {
  const { bot, c, open, act } = await gambler(77);
  c.coins = 1000;
  open('poker');
  assert.equal(act({ action: 'pokerDraw', hold: [true, true, true, true, true] }).ok, false, '配る 前は だめ');
  let r = act({ action: 'pokerDeal', bet: 10 });
  assert.equal(r.ok, true);
  assert.equal(r.hand.length, 5);
  assert.equal(c.coins, 990, '賭けた コインは 先に はらう');
  assert.equal(act({ action: 'pokerDeal', bet: 10 }).ok, false, '勝負の とちゅうは 配れない');
  assert.equal(act({ action: 'pokerDraw', hold: [true] }).ok, false, 'のこす カードは 5枚ぶん');
  // サーバーが 決めた 手を ためす: ツーペア → 取りかえない
  const s = bot.s;
  s.poker.hand = [C(0, 8), C(1, 8), C(2, 11), C(3, 11), C(0, 2)];
  r = act({ action: 'pokerDraw', hold: [true, true, true, true, true] });
  assert.equal(r.result.id, 'two');
  assert.equal(r.win, 10);
  assert.equal(c.coins, 1000);
  assert.equal(r.stage, 'won');
  // ダブルアップ: 賭けた 10枚は 場に
  r = act({ action: 'pokerDouble' });
  assert.equal(r.ok, true);
  assert.equal(c.coins, 990);
  assert.ok(r.shown !== JOKER, '表の カードは ジョーカーでは ない');
  assert.equal(act({ action: 'pokerPick', i: 7 }).ok, false, '4枚の 中から');
  assert.equal(act({ action: 'pokerTake' }).ok, false, 'えらぶ 前は 受け取れない');
  s.poker.shown = C(0, 5);
  s.poker.cards = [C(1, 9), C(2, 3), C(3, 5), C(0, 2)];
  r = act({ action: 'pokerPick', i: 0 });
  assert.equal(r.outcome, 'win');
  assert.equal(r.win, 20);
  assert.equal(c.coins, 1010);
  // 引き分けは そのまま
  act({ action: 'pokerDouble' });
  assert.equal(c.coins, 990);
  s.poker.shown = C(0, 5);
  s.poker.cards = [C(1, 9), C(2, 3), C(3, 5), C(0, 2)];
  r = act({ action: 'pokerPick', i: 2 });
  assert.equal(r.outcome, 'draw');
  assert.equal(c.coins, 1010);
  assert.equal(r.stage, 'won');
  // 負けると なくなる
  act({ action: 'pokerDouble' });
  s.poker.shown = C(0, 13);
  s.poker.cards = [C(1, 9), C(2, 3), C(3, 5), C(0, 2)];
  r = act({ action: 'pokerPick', i: 1 });
  assert.equal(r.outcome, 'lose');
  assert.equal(r.win, 0);
  assert.equal(c.coins, 990);
  assert.equal(act({ action: 'pokerDouble' }).ok, false, '負けたら ダブルアップ できない');
  // 役なしは 何も もどらない
  act({ action: 'pokerDeal', bet: 1 });
  s.poker.hand = [C(0, 8), C(1, 3), C(2, 11), C(3, 13), C(0, 2)];
  r = act({ action: 'pokerDraw', hold: [true, true, true, true, true] });
  assert.equal(r.win, 0);
  assert.equal(c.coins, 989);
  // とちゅうで 閉じると、そのままの カードで 役が きまる
  act({ action: 'pokerDeal', bet: 100 });
  s.poker.hand = [C(0, 8), C(1, 8), C(2, 8), C(3, 13), C(0, 2)];
  act({ action: 'close' });
  assert.equal(c.coins, 989 - 100 + 200, 'スリーカード');
  assert.equal(s.poker, null);
});

test('ポーカー: ダブルアップは 5回まで', async () => {
  const { bot, c, open, act } = await gambler(3);
  c.coins = 100;
  open('poker');
  act({ action: 'pokerDeal', bet: 1 });
  bot.s.poker.hand = [C(0, 8), C(1, 8), C(2, 11), C(3, 11), C(0, 2)];
  act({ action: 'pokerDraw', hold: [true, true, true, true, true] });
  let r;
  for (let i = 0; i < 5; i++) {
    r = act({ action: 'pokerDouble' });
    assert.equal(r.ok, true, `${i}`);
    bot.s.poker.shown = C(0, 2);
    bot.s.poker.cards = [C(1, 9), C(1, 9), C(1, 9), C(1, 9)];
    r = act({ action: 'pokerPick', i: 0 });
  }
  assert.equal(r.win, 32, '1 → 2 → 4 → 8 → 16 → 32');
  assert.equal(r.stage, 'done');
  assert.equal(act({ action: 'pokerDouble' }).ok, false);
  assert.equal(c.coins, 100 - 1 + 32);
});

test('景品: コインで こうかん。足りない・ない 品・まどが ちがう は だめ', async () => {
  const { c, open, act } = await gambler();
  c.coins = 100;
  open('slot1');
  assert.equal(act({ action: 'prize', id: 'magic_water' }).ok, false, 'スロットの 台では こうかん できない');
  const ui = open('prizes');
  assert.deepEqual(ui.prizes, PRIZES);
  let r = act({ action: 'prize', id: 'magic_water' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, 70);
  assert.equal(itemCount(c, 'magic_water'), 1);
  r = act({ action: 'prize', id: 'hayabusa_sword' });
  assert.equal(r.ok, false, 'コインが 足りない');
  assert.equal(act({ action: 'prize', id: 'herb' }).ok, false, '景品に ない');
  assert.equal(act({ action: 'prize', id: '__proto__' }).ok, false);
  c.coins = 3000;
  r = act({ action: 'prize', id: 'hayabusa_sword' });
  assert.equal(r.ok, true);
  assert.equal(itemCount(c, 'hayabusa_sword'), 1);
  assert.equal(c.coins, 0);
});

test('景品・ごほうびの 装備: ランク4〜5（40・50枚は ランク6）。店では 買えず、売っても 安い', () => {
  for (const p of PRIZES) {
    const it = ITEMS[p.id];
    assert.ok(it, p.id);
    assert.ok(!(it.price > 0), `${p.id} は 店の 品では ない`);
    // 売っても コインで 買う ねだん（1枚 20G）より ずっと 安い
    assert.ok((it.sell ?? 0) < p.coins * COIN_PRICE / 2, `${p.id} の 売値`);
    if (it.rank) assert.ok(it.rank >= 2 && it.rank <= 5, `${p.id} rank ${it.rank}`);
  }
  for (const r of MEDAL_REWARDS) for (const [id] of r.items) {
    const it = ITEMS[id];
    assert.ok(it, id);
    if (it.rank) assert.ok(it.rank <= (r.at >= 40 ? 6 : 5), `${id} rank`);
    assert.ok(ITEM_KANA[id] || !/[一-龯]/.test(it.name), `${id} の 読み`);
  }
  // さいこうの 剣でも 次の ランクの めやすを 大きく こえない
  assert.ok(ITEMS.kira_sword.atk <= EQUIP_RANKS[4].sword + 5);
  assert.ok(ITEMS.hayabusa_sword.atk < EQUIP_RANKS[4].sword);
});

test('小さなメダル: 30か所。つぼなどは 調べられる マス、光る 場所・宝箱は 行ける マス', () => {
  assert.equal(MEDAL_SPOTS.length, 30);
  assert.equal(new Set(MEDAL_SPOTS.map((s) => s.id)).size, 30, 'id が かさならない');
  for (const s of MEDAL_SPOTS) {
    const m = MAPS[s.map];
    assert.ok(m, s.map);
    const info = TILE_INFO[tileAt(m, s.x, s.y)];
    if (s.how === 'search') assert.ok(info.solid, `${s.id}: 調べる ものは つぼ・たる など`);
    else assert.ok(!info.solid, `${s.id}: 歩ける マス`);
    if (s.how === 'chest') {
      const ch = m.chests.find((x) => x.id === medalChestId(s.id));
      assert.ok(ch && ch.medal === s.id && ch.item === 'small_medal', s.id);
    }
    if (s.how === 'shine') assert.ok(m.sparkles.some((k) => k.id === medalSparkleId(s.id) && k.medal === s.id), s.id);
    // 第2章の 場所は 第2章の フラグが ないと 取れない
    if (['sea', 'sea_cave', 'tower_2f', 'casino', 'medal_castle'].includes(s.map)) assert.ok(s.show?.all?.length, `${s.id} は 第2章から`);
  }
  // フィールド（ミドリナ地方・風の海）には メダルの 宝箱を おかない（宝箱は 洞窟・塔・たてものの 中だけ）
  for (const id of ['overworld', 'sea']) assert.ok(!MAPS[id].chests.some((c) => c.medal), `${id} に メダルの 宝箱が ある`);
  for (const s of MEDAL_SPOTS.filter((x) => x.how === 'chest')) assert.ok(MEDAL_CHEST_MAPS.includes(s.map), s.id);
  // 今までの 宝箱の 中身は かわらない
  assert.equal(MAPS.overworld.chests.find((c) => c.id === 'ow_island').item, 'swift_ring');
  assert.equal(MAPS.sea_cave.chests.find((c) => c.id === 'sc_boss').item, 'seed_str');
});

test('小さなメダル: 調べると 見つかる（1人 1回）。もう一度 調べると ふつうの つぼ', async () => {
  const { world, bot, c } = await player(9);
  const spot = MEDAL_SPOT_BY_ID.v_home_pot;
  world.placeSession(bot.s, 'overworld', spot.x - 0.5, spot.y + 0.5, 'right', true);
  await bot.examine(spot.x, spot.y);
  assert.equal(medalsFound(c), 1);
  assert.ok(c.medalSpots.v_home_pot);
  let says = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]);
  assert.ok(says.some((t) => /小さなメダルを見つけた/.test(t)), says.join('/'));
  assert.ok(says.some((t) => /メダル王/.test(t)), 'はじめての ときは せつめい');
  bot.msgs.length = 0;
  await bot.examine(spot.x, spot.y);
  assert.equal(medalsFound(c), 1, '2回は もらえない');
  says = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]);
  assert.ok(says.some((t) => /つぼを調べた/.test(t)) && !says.some((t) => /メダル/.test(t)), says.join('/'));
  // 井戸
  const well = MEDAL_SPOT_BY_ID.v_well;
  world.placeSession(bot.s, 'overworld', well.x + 0.5, well.y + 1.5, 'up', true);
  await bot.examine(well.x, well.y);
  assert.equal(medalsFound(c), 2);
  assert.equal(medalsHeld(c), 2);
});

test('小さなメダル: 光る 場所は 1回だけ。宝箱は 新しい 宝箱。第2章の 場所は フラグが いる', async () => {
  const { world, bot, c } = await player(10);
  const sh = MEDAL_SPOT_BY_ID.f_hill_shine;
  world.placeSession(bot.s, 'overworld', sh.x + 0.5, sh.y + 1.5, 'up', true);
  await bot.examine(sh.x, sh.y);
  assert.equal(medalsFound(c), 1);
  assert.equal(c.sparkles[medalSparkleId(sh.id)], MEDAL_TAKEN_AT, 'もう 光らない');
  const bag = JSON.stringify(c.items);
  await bot.examine(sh.x, sh.y);
  assert.equal(medalsFound(c), 1);
  assert.equal(JSON.stringify(c.items), bag, 'ふつうの きらきらの 道具も 出ない');
  // 宝箱（なげきの洞窟の 新しい 宝箱）
  const ch = MEDAL_SPOT_BY_ID.cave1_corner;
  world.placeSession(bot.s, 'cave_b1', ch.x + 1.5, ch.y + 0.5, 'left', true);
  await bot.examine(ch.x, ch.y);
  assert.equal(medalsFound(c), 2);
  assert.ok(c.chests[medalChestId(ch.id)]);
  assert.ok(!c.keyItems.includes('small_medal'), 'メダルは ふくろに 入らない（数で おぼえる）');
  await bot.examine(ch.x, ch.y);
  assert.equal(medalsFound(c), 2, '空っぽ');
  // 第2章: 港の 井戸は 船を 借りる 前は 取れない
  const pw = MEDAL_SPOT_BY_ID.p_well;
  world.placeSession(bot.s, 'sea', pw.x + 0.5, pw.y + 1.5, 'up', true);
  await bot.examine(pw.x, pw.y);
  assert.equal(medalsFound(c), 2, 'まだ 取れない');
  c.flags.c2_ship = true;
  await bot.examine(pw.x, pw.y);
  assert.equal(medalsFound(c), 3);
  // 嵐の島は 灯台の 光の あと
  const st = MEDAL_SPOT_BY_ID.s_storm_isle;
  world.placeSession(bot.s, 'sea', st.x + 0.5, st.y + 1.5, 'up', true);
  await bot.examine(st.x, st.y);
  assert.equal(medalsFound(c), 3);
  c.flags.c2_light = true;
  await bot.examine(st.x, st.y);
  assert.equal(medalsFound(c), 4);
});

test('小さなメダル: パーティーでは 見つけた 人だけが もらう（家族サーバー）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(11), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  const spot = MEDAL_SPOT_BY_ID.v_shop_shelf;
  world.placeSession(kid.s, 'overworld', spot.x + 0.5, spot.y + 1.5, 'up', true);
  world.placeSession(papa.s, 'overworld', spot.x + 1.5, spot.y + 1.5, 'up', true);
  await kid.examine(spot.x, spot.y);
  const pc = world.data.characters[papa.char.id];
  const kc = world.data.characters[kid.char.id];
  assert.equal(medalsFound(kc), 1, '見つけた ユイ');
  assert.equal(medalsFound(pc), 0, 'パパは もらわない');
  assert.ok(papa.msgs.some((m) => m.t === 'toast' && /ユイが小さなメダルを見つけた/.test(m.text)), 'なかまに 知らせる');
  await papa.examine(spot.x, spot.y);
  assert.equal(medalsFound(pc), 1, 'パパも 自分で 調べれば 1枚');
});

test('メダル王: わたした 数で ごほうび（それぞれ 1回）。一覧と 次の ごほうび', async () => {
  const { world, bot, c } = await player(12);
  c.flags.c2_ship = true;
  world.placeSession(bot.s, 'medal_castle', 8, 3.5, 'up', true);
  bot.s.busy = 'script'; // メダル王の まどが 開いている
  const open = () => openService(world, bot.s, 'medalKing');
  const give = () => {
    serviceAction(world, bot.s, { kind: 'medal', action: 'give' });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let ui = open();
  assert.equal(ui.held, 0);
  assert.equal(ui.rewards.length, MEDAL_REWARDS.length);
  assert.equal(give().ok, false, 'メダルが ない');
  // 12枚 見つけた
  c.medalSpots = Object.fromEntries(MEDAL_SPOTS.slice(0, 12).map((s) => [s.id, 1]));
  let r = give();
  assert.equal(r.ok, true);
  assert.equal(r.gave, 12);
  assert.equal(r.total, 12);
  assert.deepEqual(r.got.map((g) => g.at), [5, 10]);
  assert.equal(itemCount(c, 'seed_str'), 1);
  assert.equal(itemCount(c, 'killer_earring'), 1);
  assert.equal(medalsHeld(c), 0);
  assert.equal(medalsGiven(c), 12);
  assert.equal(give().ok, false, 'もう わたす メダルが ない');
  // もう 3枚 → 15枚の ごほうび（5枚・10枚は もう もらった）
  for (const s of MEDAL_SPOTS.slice(12, 15)) c.medalSpots[s.id] = 1;
  r = give();
  assert.deepEqual(r.got.map((g) => g.at), [15]);
  assert.equal(itemCount(c, 'seed_str'), 1, '5枚の ごほうびは 1回だけ');
  assert.equal(itemCount(c, 'mystic_hat'), 1);
  ui = open();
  assert.deepEqual(ui.rewards.filter((x) => x.got).map((x) => x.at), [5, 10, 15]);
  // メダル王の 城の 外では わたせない
  world.placeSession(bot.s, 'sea', CASTLE_DOOR.x + 0.5, CASTLE_DOOR.y + 1.6, 'down', true);
  for (const s of MEDAL_SPOTS.slice(15, 20)) c.medalSpots[s.id] = 1;
  assert.equal(give().ok, false);
  assert.equal(medalsHeld(c), 5);
});

test('むかしの セーブ: 新しい 項目が なくても 読める。家族サーバーと スマホで 合わせる', () => {
  const { data } = upgradeSave({ version: 4, characters: { a: { id: 'a', name: 'ソラ', job: 'warrior', level: 3, exp: 30, gold: 10, flags: {}, items: [] } } });
  const c = data.characters.a;
  assert.equal(coinsOf(c), 0);
  assert.equal(medalsFound(c), 0);
  assert.equal(medalsHeld(c), 0);
  // こわれた 値でも だいじょうぶ
  assert.equal(coinsOf({ coins: 'x' }), 0);
  assert.equal(coinsOf({ coins: 1e9 }), COIN_MAX);
  assert.equal(medalsGiven({ medalSpots: { a: 1 }, medalsGiven: 5 }), 1, 'わたした 数は 見つけた 数まで');
  // 合わせる: コインは ふえた・へった ぶん、メダルの 場所と ごほうびは 両方
  const base = { id: 'a', name: 'ソラ', coins: 100, medalSpots: { v_well: 1 }, medalsGiven: 0, medalRewards: {}, items: [], equip: {}, lastPlayed: 1 };
  const ours = { ...base, coins: 150, medalSpots: { v_well: 1, t_well: 2 }, lastPlayed: 2 };
  const theirs = { ...base, coins: 80, medalSpots: { v_well: 1, p_well: 3 }, medalsGiven: 1, lastPlayed: 3 };
  const m = mergeChars(base, ours, theirs);
  assert.equal(m.coins, 130);
  assert.deepEqual(Object.keys(m.medalSpots).sort(), ['p_well', 't_well', 'v_well']);
  assert.equal(m.medalsGiven, 1);
  assert.equal(medalsHeld(m), 2);
});

test('カジノと メダル王の城: 港と 島から 入れて、人と 台に 近づける', () => {
  const sea = MAPS.sea;
  // 港の 入り口: かんばん・ワープ・前は 歩ける
  assert.equal(tileAt(sea, CASINO_DOOR.x, CASINO_DOOR.y), T.DOOR);
  assert.ok(sea.boards.some((b) => b.kind === 'casino' && b.name === 'カジノ'));
  assert.ok(sea.boards.some((b) => b.kind === 'medal'));
  assert.ok(!isBlocked(sea, CASINO_DOOR.x, CASINO_DOOR.y + 1, () => false));
  assert.equal(sea.warpAt.get(CASINO_DOOR.y * sea.w + CASINO_DOOR.x).to.map, 'casino');
  assert.equal(sea.warpAt.get(CASTLE_DOOR.y * sea.w + CASTLE_DOOR.x).to.map, 'medal_castle');
  assert.ok(sea.zoneAt(CASTLE_DOOR.x, CASTLE_DOOR.y + 1).startsWith('safe'), '島では 魔物が 出ない');
  for (const id of ['casino', 'medal_castle']) {
    const m = MAPS[id];
    assert.ok(m.spawnCounts && !Object.keys(m.spawnCounts).length, '魔物は 出ない');
    for (const n of m.npcs) assert.ok(SCRIPTS[n.script], `${id} ${n.id} ${n.script}`);
    for (const w of m.warps) assert.equal(w.to.map, 'sea');
  }
  assert.ok(SCRIPTS.medal_fan && MAPS.overworld.npcById.medal_fan, 'ルミナの町の メダル集めの 少年');
  const kingSteps = SCRIPTS.medal_king({ c: { medalSpots: {} }, flag: () => false });
  assert.deepEqual(kingSteps.at(-1), ['medalKing']);
  assert.deepEqual(SCRIPTS.casino_poker(), [['casino', 'poker']]);
});

test('カジノ: 台に 話しかけると スロットの まどが 開く（だいほん）', async () => {
  const { world, bot, c } = await player(21);
  c.flags.c2_ship = true;
  c.coins = 30;
  const slot = MAPS.casino.npcById.slot_a0;
  world.placeSession(bot.s, 'casino', slot.x + 0.5, slot.y + 1.6, 'up', true);
  await bot.talk('slot_a0');
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'ui');
  assert.ok(ui, 'まどが 開く');
  assert.equal(ui[1], 'casino');
  assert.equal(ui[2].mode, 'slot');
  assert.equal(ui[2].bet, 1);
  assert.equal(ui[2].coins, 30);
});
