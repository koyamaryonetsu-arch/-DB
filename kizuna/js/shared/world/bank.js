// 預かり所（お金と 道具を 預ける）と、全滅した ときの お金の きまり
//
// c.bank = { gold, items: [{ id, n }] } … ない ときも ある（はじめて 預けた ときに できる）
// ・どこの 預かり所でも おなじ 中み（キャラごと）
// ・全滅すると 持っている お金が 半分に なる（はしたは 切りすて）。預けた お金は へらない
import { ITEMS } from '../data/items.js?v=e2673ecbb09d';
import { BANKS, BANK_GOLD_MAX, BANK_KINDS, BANK_STACK } from '../data/facilities.js?v=e2673ecbb09d';
import { addItem, removeItem, itemCount } from '../stats.js?v=e2673ecbb09d';

// ふくろに 入る 1しゅるいの 数（stats.js の addItem と おなじ）
export const BAG_STACK = 99;

const int = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? n : 0;
};

// 預かり所の 中みを 読める 形に（知らない 品物も けさずに のこす。使えないので 出せない だけ）
export function normBank(b) {
  const src = b && typeof b === 'object' && !Array.isArray(b) ? b : {};
  const gold = Math.max(0, Math.min(BANK_GOLD_MAX, int(src.gold)));
  const map = new Map();
  for (const e of Array.isArray(src.items) ? src.items : []) {
    if (!e || typeof e.id !== 'string' || !e.id) continue;
    const n = Math.max(0, int(e.n));
    if (n) map.set(e.id, Math.min(BANK_STACK, (map.get(e.id) || 0) + n));
  }
  return { gold, items: [...map].map(([id, n]) => ({ id, n })) };
}

export function bankOf(c) {
  c.bank = normBank(c.bank);
  return c.bank;
}

export function bankGold(c) {
  return Math.max(0, int(c?.bank?.gold));
}

export function bankCount(c, id) {
  return (Array.isArray(c?.bank?.items) ? c.bank.items : []).find((e) => e?.id === id)?.n || 0;
}

export function bankInfo(world, s, place) {
  const b = BANKS[place] || BANKS.town;
  return { place: BANKS[place] ? place : 'town', name: b.name, keeper: b.keeper, hello: b.hello, kinds: BANK_KINDS, stack: BANK_STACK, goldMax: BANK_GOLD_MAX };
}

// 預ける・引き出す。reply(ok, text) で こたえる
export function bankAction(world, s, msg, reply) {
  const c = s.char;
  switch (msg.action) {
    case 'depositGold': {
      const amt = int(msg.amount);
      if (amt <= 0) return reply(false, 'いくら預けますか？');
      if (amt > c.gold) return reply(false, 'おや？お金が足りないようですね。');
      const b = bankOf(c);
      if (b.gold + amt > BANK_GOLD_MAX) return reply(false, `お預かりできるのは、全部で${BANK_GOLD_MAX}ゴールドまでです。`);
      c.gold -= amt;
      b.gold += amt;
      return reply(true, `${amt}ゴールドを預けた。\n預けているお金は、全部で${b.gold}ゴールドになった。`);
    }
    case 'withdrawGold': {
      const amt = int(msg.amount);
      if (amt <= 0) return reply(false, 'いくら引き出しますか？');
      if (amt > bankGold(c)) return reply(false, 'おや？それほどはお預かりしていないようですね。');
      if (c.gold + amt > BANK_GOLD_MAX) return reply(false, 'それでは、お金を持ちきれませんよ。');
      const b = bankOf(c);
      b.gold -= amt;
      c.gold += amt;
      return reply(true, `${amt}ゴールドを引き出した。\n預けているお金は、のこり${b.gold}ゴールドになった。`);
    }
    case 'depositItem': {
      const it = ITEMS[msg.id];
      if (!it || it.type === 'key') return reply(false, 'それはお預かりできません。');
      const qty = int(msg.qty || 1);
      const have = itemCount(c, msg.id);
      if (qty <= 0) return reply(false, 'いくつ預けますか？');
      if (have < qty) return reply(false, '持っていないようですね。');
      const cur = bankCount(c, msg.id);
      const b = bankOf(c);
      if (!cur && b.items.length >= BANK_KINDS) return reply(false, `もう${BANK_KINDS}種類の品物をお預かりしています。\n何か引き出してからにしてください。`);
      if (cur + qty > BANK_STACK) return reply(false, `${it.name}は、${BANK_STACK}個までしかお預かりできません。\n（今は${cur}個お預かりしています）`);
      removeItem(c, msg.id, qty);
      const e = b.items.find((x) => x.id === msg.id);
      if (e) e.n += qty;
      else b.items.push({ id: msg.id, n: qty });
      return reply(true, `${it.name}${qty > 1 ? `を${qty}個` : 'を'}預けた。`);
    }
    case 'withdrawItem': {
      const it = ITEMS[msg.id];
      const qty = int(msg.qty || 1);
      const cur = bankCount(c, msg.id);
      if (!it || !cur) return reply(false, 'それはお預かりしていないようですね。');
      if (qty <= 0) return reply(false, 'いくつ引き出しますか？');
      if (qty > cur) return reply(false, `${it.name}は、${cur}個しかお預かりしていません。`);
      if (itemCount(c, msg.id) + qty > BAG_STACK) return reply(false, `${it.name}は、ふくろに${BAG_STACK}個までしか入りません。`);
      const b = bankOf(c);
      const e = b.items.find((x) => x.id === msg.id);
      e.n -= qty;
      if (e.n <= 0) b.items = b.items.filter((x) => x !== e);
      addItem(c, msg.id, qty);
      return reply(true, `${it.name}${qty > 1 ? `を${qty}個` : 'を'}引き出した。`);
    }
    default:
      return reply(false, '');
  }
}

// 全滅した: 持っている お金が 半分に（はしたは 切りすて）。預かり所の お金は そのまま
export function wipeGoldLoss(c) {
  const before = Math.max(0, int(c?.gold));
  const after = Math.floor(before / 2);
  if (c) c.gold = after;
  return { before, after, lost: before - after };
}
