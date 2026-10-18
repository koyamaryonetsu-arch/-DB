// 第37回 B: ルーレット（0〜36。0 は 1つだけ）
//
// ・数字（36倍）・赤／黒・奇数／偶数・前半（1〜18）／後半（19〜36）（2倍）・12ずつ（1〜12・13〜24・25〜36。3倍）
//   倍率は「かけた コインの 何倍が もどるか」（かけた ぶんも ふくむ）。0 が 出ると、数字の 0 いがいは はずれ
// ・1回に いくつも かけられる。チップは 1・10・100枚
// ・どの かけ方でも もどりは 36/37（約97%。少しだけ 店が 勝つ）
// ・玉が 止まる 数は サーバーの 乱数（world/casino.js）。ここは 計算だけ

export const ROULETTE_CHIPS = [1, 10, 100];
export const ROULETTE_MAX_TOTAL = 3000; // 1回に かけられる コインの 合計
export const ROULETTE_MAX_SPOTS = 40; // 1回に かけられる 場所の 数
export const ROULETTE_N = 37; // 0〜36

// 赤い 数（のこりの 1〜36 は 黒・0 は 緑）
export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const RED = new Set(RED_NUMBERS);
export const numColor = (n) => (n === 0 ? 'green' : RED.has(n) ? 'red' : 'black');

// 円ばんの ならび（時計まわり。0 から）
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// かけ方（k）。v … 数字（0〜36）か 12ずつの ばんごう（1〜3）
export const BET_KINDS = {
  num: { mult: 36, name: (v) => `${v}`, wins: (n, v) => n === v, vals: [...Array(37).keys()] },
  red: { mult: 2, name: () => '赤', wins: (n) => RED.has(n) },
  black: { mult: 2, name: () => '黒', wins: (n) => n > 0 && !RED.has(n) },
  odd: { mult: 2, name: () => 'きすう', wins: (n) => n > 0 && n % 2 === 1 },
  even: { mult: 2, name: () => 'ぐうすう', wins: (n) => n > 0 && n % 2 === 0 },
  low: { mult: 2, name: () => '1〜18', wins: (n) => n >= 1 && n <= 18 },
  high: { mult: 2, name: () => '19〜36', wins: (n) => n >= 19 },
  dozen: { mult: 3, name: (v) => `${(v - 1) * 12 + 1}〜${v * 12}`, wins: (n, v) => n > 0 && Math.ceil(n / 12) === v, vals: [1, 2, 3] },
};

// かける 場所の なまえ（'num:17' 'red' 'dozen:2'）
export const betKey = (k, v) => (BET_KINDS[k]?.vals ? `${k}:${v}` : k);
export function parseBetKey(key) {
  const [k, s] = String(key).split(':');
  const kind = Object.hasOwn(BET_KINDS, k) ? BET_KINDS[k] : null;
  if (!kind) return null;
  if (!kind.vals) return s === undefined ? { k, v: null } : null;
  const v = Number(s);
  return kind.vals.includes(v) ? { k, v } : null;
}
export const betName = (k, v) => BET_KINDS[k]?.name(v) ?? '';

// かけ（[{ k, v, c }]）を たしかめて まとめる（{ key: 枚数 }）。だめなら null
export function normBets(list) {
  if (!Array.isArray(list) || !list.length || list.length > ROULETTE_MAX_SPOTS * 4) return null;
  const out = {};
  let total = 0;
  for (const b of list) {
    if (!b || typeof b !== 'object') return null;
    const kind = typeof b.k === 'string' && Object.hasOwn(BET_KINDS, b.k) ? BET_KINDS[b.k] : null;
    if (!kind) return null;
    if (kind.vals ? !kind.vals.includes(b.v) : b.v !== undefined && b.v !== null) return null;
    if (!Number.isInteger(b.c) || b.c < 1 || b.c > ROULETTE_MAX_TOTAL) return null;
    const key = betKey(b.k, b.v);
    out[key] = (out[key] || 0) + b.c;
    total += b.c;
  }
  if (total > ROULETTE_MAX_TOTAL || Object.keys(out).length > ROULETTE_MAX_SPOTS) return null;
  return { bets: out, total };
}

// その 数で もどる コイン（かけた ぶんも ふくむ）と、当たった 場所
export function roulettePayout(bets, n) {
  let win = 0;
  const hits = [];
  for (const [key, c] of Object.entries(bets)) {
    const b = parseBetKey(key);
    if (!b) continue;
    const kind = BET_KINDS[b.k];
    if (!kind.wins(n, b.v)) continue;
    win += c * kind.mult;
    hits.push(key);
  }
  return { win, hits };
}
