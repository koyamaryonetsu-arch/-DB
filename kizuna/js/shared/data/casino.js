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
export const PRIZES = [
  { id: 'magic_water', coins: 30 },
  { id: 'revive_flower', coins: 60 },
  { id: 'seed_str', coins: 300 },
  { id: 'seed_agi', coins: 300 },
  { id: 'seed_hp', coins: 300 },
  { id: 'sea_charm', coins: 500 },
  { id: 'pururin_shield', coins: 900 },
  { id: 'starry_cloak', coins: 2000 },
  { id: 'hayabusa_sword', coins: 3000 },
];

// ───────────── 小さなメダル（メダル王の ごほうび） ─────────────
// at: メダル王に わたした 数が ここまで とどくと もらえる（1回ずつ）
export const MEDAL_REWARDS = [
  { at: 5, items: [['seed_str', 1], ['seed_agi', 1]] },
  { at: 10, items: [['killer_earring', 1]] },
  { at: 15, items: [['mystic_hat', 1]] },
  { at: 20, items: [['kira_mail', 1]] },
  { at: 25, items: [['star_bangle', 1]] },
  { at: 30, items: [['kira_sword', 1]] },
  { at: 40, items: [['kira_shield', 1]] },
  { at: 50, items: [['medal_crown', 1]] },
];

// メダルの 数（c.medalSpots … 見つけた 場所 / c.medalsGiven … メダル王に わたした 数）
export function medalsFound(c) {
  return Object.keys(c?.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {}).length;
}
export function medalsGiven(c) {
  const n = Math.floor(Number(c?.medalsGiven));
  return Number.isFinite(n) ? Math.max(0, Math.min(medalsFound(c), n)) : 0;
}
// 持っている（まだ わたしていない）数
export function medalsHeld(c) {
  return Math.max(0, medalsFound(c) - medalsGiven(c));
}
// 次の ごほうび（なければ null）
export function nextMedalReward(c) {
  const got = c?.medalRewards && typeof c.medalRewards === 'object' ? c.medalRewards : {};
  return MEDAL_REWARDS.find((r) => !got[r.at]) || null;
}
