// カジノ（カモメ港）と 小さなメダル（メダル王）の データ
//
// ・コインは ゴールドで 買う（1枚 20ゴールド）。ゴールドには もどせない（ドラクエと おなじ）
// ・スロットと ポーカーの 乱数・コインの 計算は ぜんぶ サーバー（world/casino.js）
// ・スロットの もどりは 賭けた コインの 約93%、ポーカーは おまかせで 遊んで 約95%（少しだけ 店が 勝つ）
// ・本物の お金は どこにも 出てこない

export const COIN_PRICE = 20; // コイン 1枚の ねだん（ゴールド）
export const COIN_MAX = 99999; // 持てる コインの 数
export const COIN_BUY_MAX = 9999; // 1回に 買える 数
export const COIN_PACKS = [10, 50, 100, 500, 1000];
// 第50回 D3: 景品を 豪華に（data/prizes-r50.js の 品を PRIZES・MEDAL_REWARDS の うしろに まぜる）
import { PRIZES_R50, MEDAL_REWARDS_R50 } from './prizes-r50.js?v=824fd873af63';

// コインの 数（こわれた セーブでも 0〜COIN_MAX の 整数）
export function coinsOf(c) {
  const n = Math.floor(Number(c?.coins));
  return Number.isFinite(n) ? Math.max(0, Math.min(COIN_MAX, n)) : 0;
}

// ───────────── スロット ─────────────
export const SLOT_BETS = [1, 10, 100];
export const SLOT_SYMBOLS = {
  seven: { name: '7' },
  bar: { name: 'BAR' },
  pururin: { name: 'ぷるりん' },
  star: { name: '星' },
  bell: { name: 'ベル' },
  cherry: { name: 'チェリー' },
};

// リール（上から 下へ ならぶ。どの 目で 止まるかは どれも 同じ 確率）
// 1つの リールに 7:1 BAR:2 ぷるりん:3 星:3 ベル:5 チェリー:6（ぜんぶで 20）
const R = { s: 'seven', b: 'bar', p: 'pururin', t: 'star', l: 'bell', c: 'cherry' };
const strip = (code) => [...code].map((k) => R[k]);
export const REELS = [
  strip('scltlcpbclcltplcpbtc'),
  strip('clpcltbcsltlcpcbltcp'),
  strip('lcbtclpcltscbplcltpc'),
];

// 役（上から じゅんに 見る）。line: まん中の 列の 目（null は なんでも よい）。mult: 賭けた コインの 何倍
export const SLOT_PAYS = [
  { id: 'seven3', line: ['seven', 'seven', 'seven'], mult: 250, name: '7が3つ' },
  { id: 'bar3', line: ['bar', 'bar', 'bar'], mult: 50, name: 'BARが3つ' },
  { id: 'pururin3', line: ['pururin', 'pururin', 'pururin'], mult: 30, name: 'ぷるりんが3つ' },
  { id: 'star3', line: ['star', 'star', 'star'], mult: 18, name: '星が3つ' },
  { id: 'bell3', line: ['bell', 'bell', 'bell'], mult: 10, name: 'ベルが3つ' },
  { id: 'cherry3', line: ['cherry', 'cherry', 'cherry'], mult: 5, name: 'チェリーが3つ' },
  { id: 'cherry2', line: ['cherry', 'cherry', null], mult: 3, name: 'チェリーが2つ' },
  { id: 'cherry1', line: ['cherry', null, null], mult: 1, name: 'チェリーが1つ（コインがもどる）' },
];

// まん中の 列の 目 → 役（なければ null）
export function slotPay(line) {
  for (const p of SLOT_PAYS) {
    if (p.line.every((sym, i) => sym === null || sym === line[i])) return p;
  }
  return null;
}

// 止まった 位置（まん中の 列に 来る 目の ばんごう）→ まん中の 列の 目
export function slotLine(stops) {
  return stops.map((st, i) => REELS[i][((st % REELS[i].length) + REELS[i].length) % REELS[i].length]);
}

// ───────────── ポーカー（ジョーカー 1枚 入り 53枚。5枚を くばって 1回 とりかえる）─────────────
export const POKER_BETS = [1, 10, 100];
export const JOKER = 52;
export const DOUBLE_MAX = 5; // ダブルアップは 5回まで
export const SUITS = ['spade', 'heart', 'diamond', 'club'];
export const SUIT_MARKS = ['♠', '♥', '♦', '♣'];
export const RANK_NAMES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

// カード（0〜51 と ジョーカー 52）
export const cardSuit = (card) => (card === JOKER ? -1 : Math.floor(card / 13));
// 強さ: 2〜10・J=11・Q=12・K=13・A=14・ジョーカー=15
export const cardRank = (card) => (card === JOKER ? 15 : (card % 13) + 2);
export function cardName(card) {
  if (card === JOKER) return 'ジョーカー';
  const r = cardRank(card);
  return `${SUIT_MARKS[cardSuit(card)]}${RANK_NAMES[r] || r}`;
}
export const validCard = (card) => Number.isInteger(card) && card >= 0 && card <= JOKER;

// 役（強い じゅん）。mult: 賭けた コインの 何倍
export const POKER_HANDS = [
  { id: 'royal', name: 'ロイヤルストレートフラッシュ', mult: 500 },
  { id: 'five', name: 'ファイブカード', mult: 100 },
  { id: 'sflush', name: 'ストレートフラッシュ', mult: 50 },
  { id: 'four', name: 'フォーカード', mult: 20 },
  { id: 'full', name: 'フルハウス', mult: 10 },
  { id: 'flush', name: 'フラッシュ', mult: 6 },
  { id: 'straight', name: 'ストレート', mult: 4 },
  { id: 'three', name: 'スリーカード', mult: 2 },
  { id: 'two', name: 'ツーペア', mult: 1 },
  { id: 'one', name: 'ワンペア', mult: 0 },
  { id: 'none', name: '役なし', mult: 0 },
];
const HAND = Object.fromEntries(POKER_HANDS.map((h) => [h.id, h]));
export const POKER_PAY_HANDS = POKER_HANDS.filter((h) => h.mult > 0);

// ストレートに なるか（ジョーカーの 数で すきまを うめる。A は 1 にも なる）
function straightOk(ranks, jokers) {
  if (new Set(ranks).size !== ranks.length) return false;
  for (const set of [ranks, ranks.map((r) => (r === 14 ? 1 : r))]) {
    const lo = Math.min(...set), hi = Math.max(...set);
    if (hi - lo <= 4 && set.length + jokers === 5) return true;
  }
  return !ranks.length;
}

// 5枚の 役
export function evalPoker(cards) {
  const jokers = cards.filter((c) => c === JOKER).length;
  const plain = cards.filter((c) => c !== JOKER);
  const ranks = plain.map(cardRank);
  const counts = new Map();
  for (const r of ranks) counts.set(r, (counts.get(r) || 0) + 1);
  const groups = [...counts.values()].sort((a, b) => b - a);
  const top = (groups[0] || 0) + jokers;
  const flush = plain.every((c) => cardSuit(c) === cardSuit(plain[0]));
  const straight = straightOk(ranks, jokers);
  if (flush && straight && !jokers && ranks.every((r) => r >= 10)) return HAND.royal;
  if (top >= 5) return HAND.five;
  if (flush && straight) return HAND.sflush;
  if (top === 4) return HAND.four;
  if ((groups[0] === 3 && groups[1] === 2) || (jokers && groups[0] === 2 && groups[1] === 2)) return HAND.full;
  if (flush) return HAND.flush;
  if (straight) return HAND.straight;
  if (top === 3) return HAND.three;
  if (groups[0] === 2 && groups[1] === 2) return HAND.two;
  if (top === 2) return HAND.one;
  return HAND.none;
}

// おまかせ（のこす カードの おすすめ）。true の カードを のこす。ジョーカーは いつも のこす
//   できた 役（ストレートより 上）→ ぜんぶ / フォーカード・スリーカード・ツーペア → そろった カード
//   → あと1枚で ストレートフラッシュ・フラッシュ → ワンペア → ジョーカーと おなじ マーク2枚
//   → あと1枚で ストレート → おなじ マーク3枚 → おなじ マーク2枚
export function pokerSuggest(cards) {
  const hand = evalPoker(cards);
  if (['royal', 'five', 'sflush', 'full', 'flush', 'straight'].includes(hand.id)) return cards.map(() => true);
  const joker = cards.includes(JOKER);
  const counts = new Map();
  for (const c of cards) if (c !== JOKER) counts.set(cardRank(c), (counts.get(cardRank(c)) || 0) + 1);
  const keepSet = (set) => cards.map((c) => c === JOKER || set.includes(c));
  const paired = cards.filter((c) => c !== JOKER && counts.get(cardRank(c)) >= 2);
  if (['four', 'three', 'two'].includes(hand.id)) {
    // フォーカードは のこりの 1枚を かえて ファイブカードを ねらう
    return keepSet(paired);
  }
  const plain = cards.filter((c) => c !== JOKER);
  const need = joker ? 3 : 4;
  const sf = suitedRun(plain, need, true);
  if (sf) return keepSet(sf);
  const fl = suitedRun(plain, need, false);
  if (fl) return keepSet(fl);
  if (paired.length) return keepSet(paired);
  if (joker) {
    const two = suitedRun(plain, 2, true);
    if (two) return keepSet(two);
  }
  const st = straightRun(plain, need);
  if (st) return keepSet(st);
  for (const n of [3, 2]) {
    const s = suitedRun(plain, n, true) || suitedRun(plain, n, false);
    if (s && !joker) return keepSet(s);
  }
  return keepSet([]);
}

// おなじ マークの n枚（close: 5つの はばに おさまる もの だけ）。いちばん 強い 組を かえす
function suitedRun(plain, n, close) {
  let best = null;
  for (let s = 0; s < 4; s++) {
    const same = plain.filter((c) => cardSuit(c) === s).sort((a, b) => cardRank(b) - cardRank(a));
    if (same.length < n) continue;
    for (const combo of combos(same, n)) {
      if (close && !inRange(combo.map(cardRank))) continue;
      const score = combo.reduce((t, c) => t + cardRank(c), 0);
      if (!best || score > best.score) best = { combo, score };
    }
  }
  return best ? best.combo : null;
}

// ちがう 数の n枚が 5つの はばに おさまる（ストレートねらい）
function straightRun(plain, n) {
  let best = null;
  for (const combo of combos(plain, n)) {
    const ranks = combo.map(cardRank);
    if (new Set(ranks).size !== n || !inRange(ranks)) continue;
    const score = ranks.reduce((t, r) => t + r, 0);
    if (!best || score > best.score) best = { combo, score };
  }
  return best ? best.combo : null;
}

function inRange(ranks) {
  if (new Set(ranks).size !== ranks.length) return false;
  return [ranks, ranks.map((r) => (r === 14 ? 1 : r))].some((set) => Math.max(...set) - Math.min(...set) <= 4);
}

function combos(list, n, start = 0, acc = [], out = []) {
  if (acc.length === n) {
    out.push(acc.slice());
    return out;
  }
  for (let i = start; i < list.length; i++) {
    acc.push(list[i]);
    combos(list, n, i + 1, acc, out);
    acc.pop();
  }
  return out;
}

// ダブルアップ: 表の カードより 大きければ 勝ち。同じなら 引き分け
export function doubleOutcome(shown, picked) {
  const a = cardRank(shown), b = cardRank(picked);
  return b > a ? 'win' : b === a ? 'draw' : 'lose';
}

// ───────────── 景品 ─────────────
// coins: コインの 数（ゴールドで 買うと 1枚 20G）
// 第50回 D3: 種・木の実は 手に入りやすすぎたので ねあげ（ふつうの 種 300 → 800・ふしぎな木の実・いやしの種 400 → 1000・
//   星の木の実 2500 → 6000・黄金の木の実 8000 → 20000。メダル王の ごほうびの 種は そのまま）
export const PRIZES = [
  { id: 'magic_water', coins: 30 },
  { id: 'revive_flower', coins: 60 },
  { id: 'seed_str', coins: 800 },
  { id: 'seed_agi', coins: 800 },
  { id: 'seed_hp', coins: 800 },
  { id: 'sea_charm', coins: 500 },
  { id: 'pururin_shield', coins: 900 },
  { id: 'starry_cloak', coins: 2000 },
  { id: 'hayabusa_sword', coins: 3000 },
  { id: 'shiawase_boushi', coins: 5000 }, // 第31回: 経験値2倍のぼうし（data/items-r31.js）
  // 第31回: 物語が 進むと 景品が ふえる（need … その フラグが ついたら ならぶ。地方の レア装備は data/items-rare.js）
  { id: 'seed_def', coins: 800, need: 'c2_clear' },
  { id: 'seed_mag', coins: 800, need: 'c2_clear' },
  { id: 'mermaid_shield', coins: 1500, need: 'c2_clear' },
  { id: 'sea_trident', coins: 2500, need: 'c2_clear' },
  { id: 'yeti_club', coins: 3500, need: 'c3_clear' },
  { id: 'aurora_robe', coins: 4000, need: 'c3_clear' },
  { id: 'magic_carpet', coins: 6000, need: 'c4_clear' },
  { id: 'thief_knife', coins: 6500, need: 'c4_clear' },
  { id: 'gold_abacus', coins: 7000, need: 'c4_clear' },
  { id: 'milkyway_whip', coins: 9000, need: 'c5_argos' },
  { id: 'shooting_boomerang', coins: 10000, need: 'c5_argos' },
  { id: 'little_prince_cape', coins: 12000, need: 'c5_argos' },
  // 第44回（ポケモン P1）: 進化の 石・かわらずのいし（data/items-pokemon.js。第2章クリアの あと）
  { id: 'fire_stone', coins: 1500, need: 'c2_clear' },
  { id: 'water_stone', coins: 1500, need: 'c2_clear' },
  { id: 'thunder_stone', coins: 1500, need: 'c2_clear' },
  { id: 'moon_stone', coins: 2000, need: 'c2_clear' },
  { id: 'everstone', coins: 800, need: 'c2_clear' },
  // 第37回 B: 宝の地図の クリア数の 段（tier。data/casino-tier.js）で ふえる 景品。上の 段ほど めずらしい 種・★4〜★5
  { id: 'seed_mp', coins: 1000, tier: 1 },
  { id: 'seed_heal', coins: 1000, tier: 1 },
  { id: 'lucky_clover', coins: 7000, tier: 1 },
  { id: 'roulette_shield', coins: 8000, tier: 1 },
  { id: 'star_nut', coins: 6000, tier: 2 },
  { id: 'bunny_band', coins: 12000, tier: 2 },
  { id: 'joker_sword', coins: 15000, tier: 2 },
  { id: 'coin_mail', coins: 15000, tier: 2 },
  { id: 'gambler_hat', coins: 20000, tier: 3 },
  { id: 'jackpot_shield', coins: 26000, tier: 3 },
  { id: 'dealer_vest', coins: 26000, tier: 3 },
  { id: 'royal_fan', coins: 28000, tier: 3 },
  { id: 'gold_nut', coins: 20000, tier: 4 },
  { id: 'seven_ring', coins: 35000, tier: 4 },
  { id: 'fortune_cape', coins: 38000, tier: 4 },
  { id: 'casino_king_sword', coins: 40000, tier: 4 },
  // 第50回 D3: 4つの なかま（強い装備・見た目・便利な道具・めずらしい魔物）。お話が 進むと ふえる（data/prizes-r50.js）
  ...PRIZES_R50,
];
// 今 ならんでいる 景品（flags … キャラの フラグ・tier … 宝の地図の 段 0〜4）
export function prizesFor(flags = {}, tier = 0) {
  return PRIZES.filter((p) => (!p.need || flags?.[p.need]) && (p.tier || 0) <= tier);
}

// ───────────── 小さなメダル（メダル王の ごほうび） ─────────────
// at: メダル王に わたした 数が ここまで とどくと もらえる（1回ずつ）
export const MEDAL_REWARDS = [
  { at: 5, items: [['seed_str', 1], ['seed_agi', 1]] },
  { at: 10, items: [['killer_earring', 1]] },
  { at: 15, items: [['mystic_hat', 1]] },
  { at: 20, items: [['kira_mail', 1]] },
  { at: 25, items: [['star_bangle', 1]] },
  { at: 30, items: [['kira_sword', 1]] },
  { at: 35, items: [['koufuku_kutsu', 1]] }, // 第31回: 歩くとMPが回復するくつ（data/items-r31.js）
  { at: 40, items: [['kira_shield', 1]] },
  // 第44回（ポケモン P1）: 進化の 石 4つ・かわらずのいし（data/items-pokemon.js）
  { at: 45, items: [['fire_stone', 1], ['water_stone', 1], ['thunder_stone', 1], ['moon_stone', 1], ['everstone', 1]] },
  { at: 50, items: [['medal_crown', 1]] },
  // 第50回 D3: 55〜100枚（need … お話が その フラグまで 進むと もらえる。data/prizes-r50.js）
  ...MEDAL_REWARDS_R50,
];
// その ごほうびが もう もらえる お話か（need が ない・その フラグが ついた）
export const medalRewardOpen = (flags, r) => !r?.need || !!flags?.[r.need];

// メダルの 数（c.medalSpots … 見つけた 場所 / c.medalsGiven … メダル王に わたした 数）
export function medalsFound(c) {
  return Object.keys(c?.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {}).length;
}
export function medalsGiven(c) {
  const n = Math.floor(Number(c?.medalsGiven));
  return Number.isFinite(n) ? Math.max(0, Math.min(medalsFound(c), n)) : 0;
}
// 第37回 B: すごろく券に かえた 数（c.medalsSpent）
export function medalsSpent(c) {
  const n = Math.floor(Number(c?.medalsSpent));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
// 持っている（まだ わたしていない・すごろく券に かえていない）数
export function medalsHeld(c) {
  return Math.max(0, medalsFound(c) - medalsGiven(c) - medalsSpent(c));
}
// 次の ごほうび（なければ null）
export function nextMedalReward(c) {
  const got = c?.medalRewards && typeof c.medalRewards === 'object' ? c.medalRewards : {};
  return MEDAL_REWARDS.find((r) => !got[r.at] && medalRewardOpen(c?.flags, r)) || null;
}
