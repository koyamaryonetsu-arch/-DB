// カジノ（コイン・スロット・ポーカー・景品）と 小さなメダル（見つける・メダル王）の しょり
//
// 乱数と コインの 計算は ぜんぶ ここ（サーバー）。クライアントの メッセージは ひとつずつ たしかめる。
//   s.casino … いま 開いている まど（'coins' 'slot' 'poker' 'prizes' 'medal'）
//   s.poker  … ポーカーの とちゅう（くばった カード・賭けた コイン・ダブルアップ）。セーブには のこさない
// キャラクターに のこす もの（どれも なくても よい。むかしの セーブも そのまま 読める）
//   c.coins        … コインの 数
//   c.medalSpots   … 小さなメダルを 見つけた 場所 { id: 時こく }
//   c.medalsGiven  … メダル王に わたした 数
//   c.medalRewards … もらった ごほうび { 5: true, 10: true, … }
import { ITEMS } from '../data/items.js?v=a976b8a231af';
import { addItem, itemCount } from '../stats.js?v=a976b8a231af';
import {
  COIN_PRICE, COIN_MAX, COIN_BUY_MAX, COIN_PACKS, coinsOf, SLOT_BETS, REELS, slotLine, slotPay,
  POKER_BETS, JOKER, DOUBLE_MAX, evalPoker, doubleOutcome, PRIZES, MEDAL_REWARDS,
  medalsFound, medalsGiven, medalsHeld,
} from '../data/casino.js?v=a976b8a231af';
import { MEDAL_SPOTS, MEDAL_SPOT_BY_ID, medalSparkleId } from '../maps/casino.js?v=a976b8a231af';
import { MAPS, tileAt, condOk } from '../maps/index.js?v=a976b8a231af';
import { T } from '../tiles.js?v=a976b8a231af';

// 見つけた 光る 場所は もう 光らない（sparkles の 時こくを ずっと 先に）
export const MEDAL_TAKEN_AT = 9e15;
const fmt = (n) => Number(n).toLocaleString('ja-JP');
const CASINO_MODES = { coins: 'coins', slot1: 'slot', slot10: 'slot', poker: 'poker', prizes: 'prizes' };

// ───────────── まどを 開く ─────────────
export function casinoOpen(world, s, kind, arg) {
  const c = s.char;
  if (kind === 'medalKing') {
    if (s.map !== 'medal_castle') return null;
    s.casino = 'medal';
    return { mode: 'medal', ...medalInfo(c) };
  }
  const mode = CASINO_MODES[arg];
  if (kind !== 'casino' || !mode || s.map !== 'casino') return null;
  settlePoker(world, s);
  s.casino = mode;
  const base = { mode, coins: coinsOf(c), coinMax: COIN_MAX };
  switch (mode) {
    case 'coins': return { ...base, price: COIN_PRICE, packs: COIN_PACKS, buyMax: COIN_BUY_MAX };
    case 'slot': return { ...base, bets: SLOT_BETS, bet: arg === 'slot10' ? 10 : 1 };
    case 'poker': return { ...base, bets: POKER_BETS, doubleMax: DOUBLE_MAX };
    case 'prizes': return { ...base, prizes: PRIZES };
    default: return null;
  }
}

// ポーカーの とちゅうで まどを 閉じた: カードを そのまま 見せて 役を きめる（コインは もどらない ことは ない）
// ダブルアップの カードを えらぶ 前に 閉じたら、賭けた コインは もどらない
function settlePoker(world, s) {
  const p = s.poker;
  s.poker = null;
  if (!p || p.stage !== 'hold') return;
  const win = evalPoker(p.hand).mult * p.bet;
  if (win) addCoins(s.char, win);
  world.markDirty();
}

function addCoins(c, n) {
  const before = coinsOf(c);
  c.coins = Math.min(COIN_MAX, before + n);
  return c.coins - before; // 本当に ふえた 数（持てる 数を こえた ぶんは なくなる）
}

// ───────────── そうさ ─────────────
export function casinoAction(world, s, msg) {
  const c = s.char;
  const reply = (ok, text, extra = {}) => {
    world.sendSelf(s);
    world.send(s, { t: 'svcRes', ok, text, coins: coinsOf(c), gold: c.gold, ...extra });
    world.markDirty();
  };
  // まどが 開いている あいだ（係の人・台の だいほんの とちゅう）だけ
  if (msg.action !== 'close' && s.busy !== 'script') return reply(false, '今はできません');
  if (msg.kind === 'medal') return medalAction(world, s, msg, reply);
  if (s.map !== 'casino') return reply(false, 'ここはカジノではない');
  const want = (mode) => s.casino === mode;
  const coins = coinsOf(c);
  switch (msg.action) {
    case 'buyCoins': {
      if (!want('coins')) return reply(false, '');
      const n = msg.n;
      if (!Number.isInteger(n) || n < 1 || n > COIN_BUY_MAX) return reply(false, 'その枚数は買えません');
      if (coins + n > COIN_MAX) return reply(false, `コインは${fmt(COIN_MAX)}枚までしか持てません`);
      const cost = n * COIN_PRICE;
      if (c.gold < cost) return reply(false, 'ゴールドが足りないようです');
      c.gold -= cost;
      c.coins = coins + n;
      return reply(true, `${fmt(cost)}ゴールドをはらって、コインを${fmt(n)}枚手に入れた！`, { bought: n });
    }
    case 'slot': {
      if (!want('slot')) return reply(false, '');
      const bet = msg.bet;
      if (!SLOT_BETS.includes(bet)) return reply(false, 'その枚数はかけられません');
      if (coins < bet) return reply(false, 'コインが足りません');
      const stops = REELS.map((r) => world.rng.int(0, r.length - 1));
      const line = slotLine(stops);
      const pay = slotPay(line);
      c.coins = coins - bet;
      const win = pay ? addCoins(c, pay.mult * bet) : 0;
      return reply(true, '', { stops, line, pay: pay ? { id: pay.id, name: pay.name, mult: pay.mult } : null, win, bet });
    }
    case 'pokerDeal': {
      if (!want('poker')) return reply(false, '');
      if (s.poker && ['hold', 'pick'].includes(s.poker.stage)) return reply(false, '勝負のとちゅうです');
      const bet = msg.bet;
      if (!POKER_BETS.includes(bet)) return reply(false, 'その枚数はかけられません');
      if (coins < bet) return reply(false, 'コインが足りません');
      const deck = world.rng.shuffle([...Array(JOKER + 1).keys()]);
      s.poker = { bet, deck, hand: deck.splice(0, 5), stage: 'hold', win: 0, doubles: 0 };
      c.coins = coins - bet;
      return reply(true, '', { hand: s.poker.hand, stage: 'hold', bet });
    }
    case 'pokerDraw': {
      const p = s.poker;
      if (!want('poker') || !p || p.stage !== 'hold') return reply(false, '');
      const hold = msg.hold;
      if (!Array.isArray(hold) || hold.length !== 5) return reply(false, '');
      p.hand = p.hand.map((card, i) => (hold[i] === true ? card : p.deck.shift()));
      const hand = evalPoker(p.hand);
      const win = hand.mult ? addCoins(c, hand.mult * p.bet) : 0;
      p.win = win;
      p.stage = win ? 'won' : 'done';
      return reply(true, '', { hand: p.hand, result: { id: hand.id, name: hand.name, mult: hand.mult }, win, stage: p.stage });
    }
    case 'pokerDouble': {
      // ダブルアップ: 勝った コインを かけて、表の カードより 大きい カードを 4枚の 中から 1枚 えらぶ
      const p = s.poker;
      if (!want('poker') || !p || p.stage !== 'won' || !(p.win > 0)) return reply(false, '');
      if (p.doubles >= DOUBLE_MAX) return reply(false, `ダブルアップは${DOUBLE_MAX}回までです`);
      if (coins < p.win) return reply(false, 'コインが足りません');
      const deck = world.rng.shuffle([...Array(JOKER + 1).keys()]);
      const at = deck.findIndex((x) => x !== JOKER);
      const shown = deck.splice(at, 1)[0];
      p.shown = shown;
      p.cards = deck.slice(0, 4);
      p.stake = p.win;
      p.stage = 'pick';
      c.coins = coins - p.stake;
      return reply(true, '', { shown, stage: 'pick', stake: p.stake, doubles: p.doubles });
    }
    case 'pokerPick': {
      const p = s.poker;
      if (!want('poker') || !p || p.stage !== 'pick') return reply(false, '');
      const i = msg.i;
      if (!Number.isInteger(i) || i < 0 || i > 3) return reply(false, '');
      const outcome = doubleOutcome(p.shown, p.cards[i]);
      if (outcome === 'win') {
        p.win = addCoins(c, p.stake * 2);
        p.doubles += 1;
        p.stage = p.doubles >= DOUBLE_MAX ? 'done' : 'won';
      } else if (outcome === 'draw') {
        addCoins(c, p.stake);
        p.stage = 'won';
      } else {
        p.win = 0;
        p.stage = 'done';
      }
      return reply(true, '', { shown: p.shown, cards: p.cards, picked: i, outcome, win: p.win, stage: p.stage, doubles: p.doubles });
    }
    case 'pokerTake': {
      const p = s.poker;
      if (!want('poker') || !p || p.stage !== 'won') return reply(false, '');
      p.stage = 'done';
      return reply(true, '', { win: p.win, stage: 'done' });
    }
    case 'prize': {
      if (!want('prizes')) return reply(false, '');
      const pr = PRIZES.find((x) => x.id === msg.id);
      if (!pr || !ITEMS[pr.id]) return reply(false, 'その景品はありません');
      if (coins < pr.coins) return reply(false, 'コインが足りないようです');
      if (itemCount(c, pr.id) >= 99) return reply(false, 'それ以上は持てないようです');
      c.coins = coins - pr.coins;
      addItem(c, pr.id, 1);
      return reply(true, `コイン${fmt(pr.coins)}枚と${ITEMS[pr.id].name}をこうかんした！`, { got: pr.id });
    }
    case 'close': {
      settlePoker(world, s);
      s.casino = null;
      return reply(true, '');
    }
    default:
      return reply(false, '');
  }
}

// ───────────── メダル王 ─────────────
function medalInfo(c) {
  const got = c.medalRewards && typeof c.medalRewards === 'object' ? c.medalRewards : {};
  return {
    found: medalsFound(c), given: medalsGiven(c), held: medalsHeld(c), total: MEDAL_SPOTS.length,
    rewards: MEDAL_REWARDS.map((r) => ({ at: r.at, items: r.items, got: !!got[r.at] })),
  };
}

function medalAction(world, s, msg, reply) {
  const c = s.char;
  if (s.map !== 'medal_castle' || s.casino !== 'medal') return reply(false, '');
  if (msg.action === 'close') {
    s.casino = null;
    return reply(true, '');
  }
  if (msg.action !== 'give') return reply(false, '');
  const held = medalsHeld(c);
  if (!held) return reply(false, '小さなメダルを持っていない', { medal: medalInfo(c) });
  const total = medalsGiven(c) + held;
  c.medalsGiven = total;
  c.medalRewards = c.medalRewards && typeof c.medalRewards === 'object' ? c.medalRewards : {};
  const got = [];
  for (const r of MEDAL_REWARDS) {
    if (r.at > total || c.medalRewards[r.at]) continue;
    c.medalRewards[r.at] = true;
    for (const [id, n] of r.items) addItem(c, id, n);
    got.push({ at: r.at, items: r.items });
  }
  return reply(true, '', { gave: held, total, got, medal: medalInfo(c) });
}

// ───────────── 小さなメダルを 見つける ─────────────
const SPOT_INDEX = new Map(MEDAL_SPOTS.filter((sp) => sp.how !== 'chest').map((sp) => [`${sp.map}:${sp.x}:${sp.y}`, sp]));

function takeMedal(world, s, spotId) {
  const c = s.char;
  c.medalSpots = c.medalSpots && typeof c.medalSpots === 'object' ? c.medalSpots : {};
  const first = medalsFound(c) === 0 && medalsGiven(c) === 0;
  c.medalSpots[spotId] = world.now();
  world.markDirty();
  // パーティーの なかまにも 知らせる（見つけた 人だけが もらう）
  const p = world.parties?.get(s.partyId);
  if (p && p.members.length > 1) {
    for (const sid of p.members) if (sid !== s.id) world.send(world.sessions.get(sid), { t: 'toast', text: `${c.name}が小さなメダルを見つけた！` });
  }
  const lines = [];
  if (first) lines.push('小さなメダルは、世界中にかくされている不思議なメダル。\nメダル王という王さまが集めているらしい。');
  lines.push(`持っている小さなメダル: ${medalsHeld(c)}枚${medalsGiven(c) ? `（メダル王にわたした数: ${medalsGiven(c)}枚）` : ''}`);
  return lines.map((l) => ['say', null, l]);
}

// 調べた マス（x, y）に 小さなメダルが あれば だいほん（なければ null … ふつうの 調べる に まかせる）
export function medalSearchSteps(world, s, tx, ty) {
  const sp = SPOT_INDEX.get(`${s.map}:${tx}:${ty}`);
  if (!sp) return null;
  const c = s.char;
  const taken = !!c.medalSpots?.[sp.id];
  const open = condOk(sp.show, world.hasFlagFn(s));
  if (sp.how === 'shine') {
    // 光る 場所は ふつうの きらきら と ちがうので、取った あとは 何も ない
    if (taken || !open) return [['say', null, '何もない。']];
    c.sparkles = c.sparkles && typeof c.sparkles === 'object' ? c.sparkles : {};
    c.sparkles[medalSparkleId(sp.id)] = MEDAL_TAKEN_AT;
    return [['sfx', 'key'], ['say', null, `足元で何かが光っている…\n${c.name}は小さなメダルを拾った！`], ...takeMedal(world, s, sp.id)];
  }
  if (taken || !open) return null;
  const tile = tileAt(MAPS[s.map], tx, ty);
  const found = {
    [T.WELL]: '井戸の中をのぞきこんだ。\nなんと、小さなメダルが落ちていた！',
    [T.FOUNTAIN]: 'ふんすいの底で何かが光っている…\nなんと、小さなメダルを見つけた！',
    [T.BED]: 'ベッドの下を調べた。\nなんと、小さなメダルを見つけた！',
  }[tile];
  const names = { [T.POT]: 'つぼ', [T.BARREL]: 'たる', [T.SHELF]: 'たな', [T.BOOKSHELF]: '本だな', [T.CRATE]: '箱' };
  const text = found || `${c.name}は${names[tile] || 'それ'}を調べた。\nなんと、小さなメダルを見つけた！`;
  return [['sfx', 'key'], ['say', null, text], ...takeMedal(world, s, sp.id)];
}

// 小さなメダルの 宝箱（chest.medal … 場所の id）
export function medalChestSteps(world, s, chest) {
  const c = s.char;
  const sp = MEDAL_SPOT_BY_ID[chest.medal];
  c.chests[chest.id] = true;
  world.markDirty();
  if (!sp || c.medalSpots?.[sp.id]) return [['sfx', 'chest'], ['chestOpen', chest.id], ['say', null, '宝箱は空っぽだ。']];
  return [['sfx', 'chest'], ['chestOpen', chest.id], ['say', null, `${c.name}は宝箱を開けた！\n小さなメダルを手に入れた！`], ['sfx', 'key'], ...takeMedal(world, s, sp.id)];
}
