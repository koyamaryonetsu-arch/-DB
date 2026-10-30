// 第50回 N6: 家族に 道具を あげる（メニューの 道具 →「家族にあげる」。client/ui/gift.js）
//
// ・あげる 相手: 同じ 家族サーバーの ほかの キャラ（パーティーで なくても、今 遊んでいなくても よい）
//   - キャラは サーバーの world.data.characters に いつも ある（遊んでいない 人も）。ふくろに 入れて セーブ
//     すれば なくならない（酒場に 魔物が 来る しくみ〈recruit-share.js〉と 同じ）
//   - その キャラを スマホ（ひとりで遊ぶ）で 遊んでいても、合わせる 時に ふえた ぶんは のこる（merge.js の 道具は ふえた・へった 数を たす）
// ・ひとりで遊ぶ（offline）時は できない（家族と いっしょに 遊ぶ 時の しくみ。メニューにも 出さない）
// ・あげられる 物: ふくろの 道具・装備品・種・素材（装備している 物は ふくろに ないので あげられない。外してから）
// ・あげられない 物: 大事な物・1人1つの 品（ボスの 品〈unique〉）
// ・相手の ふくろが いっぱい（1つの 品は 99こまで）なら やめる（何も へらない）
// ・知らせ: 遊んでいる 相手には その 場で（戦いの 中なら 終わってから）。いない 人は c.tavernNews に のこし、
//   つぎに 入った 時に 出す（recruit-share.js の tavernNewsText が この 文を 使う）
// ・数・相手・品物は ぜんぶ サーバーで たしかめる（クライアントの 言う ことは 信じない）
import { ITEMS } from '../data/items.js?v=bf896afe56a6';
import { itemCount, addItem, removeItem } from '../stats.js?v=bf896afe56a6';

export const GIFT_STACK_MAX = 99;
const NEWS_MAX = 10; // recruit-share.js の TAVERN_NEWS_MAX と 同じ

const own = (o, k) => !!o && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const qtyText = (name, n) => (n > 1 ? `${name}を${n}こ` : `${name}を`);

// 今 遊んでいる（知らせが とどく）セッション
function liveSession(world, charId) {
  for (const m of world.sessions.values()) if (m.charId === charId && m.inWorld && m.conn && !m.away) return m;
  return null;
}

// あげられる 品か（だめな 時は わけ）
export function giftBlock(c, id) {
  const it = own(ITEMS, id) ? ITEMS[id] : null;
  if (!it) return 'それはあげられない';
  if (it.type === 'key' || c?.keyItems?.includes(id)) return '大事な物はあげられない';
  if (it.unique) return `${it.name}は1人1つの品なので、あげられない`;
  return null;
}

// あげる 相手の 一覧（自分の ほかの キャラ。作った じゅん）。online … 今 遊んでいる
export function giftTargets(world, s) {
  if (world.offline) return [];
  const me = s?.char?.id;
  return Object.values(world.data.characters || {})
    .filter((c) => c && c.id && c.id !== me && !c.species)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map((c) => ({ id: c.id, name: c.name, level: c.level, online: !!liveSession(world, c.id) }));
}

// あげる。msg: { id: 品物, to: キャラの id, n: 数 }。もどりち: { ok, text }
export function giveItem(world, s, msg) {
  const c = s?.char;
  if (!c) return { ok: false, text: '' };
  if (world.offline) return { ok: false, text: '家族サーバーで遊んでいる時だけ、家族に道具をあげられる' };
  const id = msg?.id;
  const why = giftBlock(c, id);
  if (why) return { ok: false, text: why };
  const it = ITEMS[id];
  const to = typeof msg?.to === 'string' ? msg.to : '';
  if (to && to === c.id) return { ok: false, text: '自分にはあげられない' };
  const chars = world.data.characters || {};
  const target = own(chars, to) ? chars[to] : null;
  if (!target || target.species) return { ok: false, text: 'その人が見つからない' };
  if (target === c) return { ok: false, text: '自分にはあげられない' };
  const n = msg?.n;
  if (!Number.isInteger(n) || n < 1 || n > GIFT_STACK_MAX) return { ok: false, text: 'その数はあげられない' };
  const have = itemCount(c, id);
  if (have < 1) {
    const worn = Object.values(c.equip || {}).includes(id);
    return { ok: false, text: worn ? `装備している${it.name}はあげられない\n（外してからにしよう）` : `${it.name}を持っていない` };
  }
  if (have < n) return { ok: false, text: `${it.name}は${have}こしか持っていない` };
  if (!Array.isArray(target.items)) target.items = [];
  if (itemCount(target, id) + n > GIFT_STACK_MAX) {
    return { ok: false, text: `${target.name}のふくろには、もう${it.name}が入らない\n（1つの品は${GIFT_STACK_MAX}こまで）` };
  }
  // ここまで たしかめてから 動かす（とちゅうで 止まらない）
  if (!removeItem(c, id, n)) return { ok: false, text: '' };
  addItem(target, id, n);
  const note = { gift: true, item: id, n, from: c.name, at: world.now() };
  const m = liveSession(world, target.id);
  if (m) {
    world.send(m, { t: 'toast', text: giftNewsText(note, true), afterBattle: true, sfx: 'confirm' });
    world.sendSelf(m);
  } else {
    const list = Array.isArray(target.tavernNews) ? target.tavernNews : [];
    target.tavernNews = [...list, note].slice(-NEWS_MAX);
  }
  world.markDirty();
  return { ok: true, text: `${target.name}に${qtyText(it.name, n)}あげた！` };
}

// 知らせの 文（now … その 場で もらった。ちがう 時は 遊んでいない 間に とどいた）
export function giftNewsText(n, now = false) {
  const name = own(ITEMS, n?.item) ? ITEMS[n.item].name : '道具';
  const k = Math.max(1, Math.floor(Number(n?.n) || 1));
  const from = String(n?.from || '家族');
  return now ? `${from}から${qtyText(name, k)}もらった！` : `${from}から${name}${k > 1 ? `が${k}こ` : 'が'}とどいていた！\n（ふくろに入っているよ）`;
}
