// 預かり所（ドラクエ風の カウンター）
//
// 「どんなご用でしょう？」→ お金を預ける／お金を引き出す／道具を預ける／道具を引き出す／やめる
//   お金: 100・1000・10000ゴールド・全部・金額を入れる → 「〇〇ゴールドですね。よろしいですか？」
//   道具: ふくろ（預かり所）の 品物を えらぶ → いくつ？ → 預ける（引き出す）
// 全滅すると 持っている お金は 半分に なるが、預けた お金は へらない
import { el, esc, askText } from './dom.js?v=630ae227a032';
import { Counter } from './counter.js?v=630ae227a032';
import { request } from './shop.js?v=630ae227a032';
import { itemStats, rankText } from './info.js?v=630ae227a032';
import { ITEMS } from '../../shared/data/items.js?v=630ae227a032';
import { itemCount } from '../../shared/stats.js?v=630ae227a032';
import { BANK_KINDS, BANK_STACK, BANK_GOLD_MAX } from '../../shared/data/facilities.js?v=630ae227a032';
import { bankGold, bankCount, BAG_STACK } from '../../shared/world/bank.js?v=630ae227a032';
import { boardIconURL } from '../render/boards.js?v=630ae227a032';

const AGAIN = 'ほかにもご用はありますか？';

const bankItems = (game) => (game.me?.bank?.items || []).filter((e) => ITEMS[e?.id] && e.n > 0);

// みぎの まど: 預けている 物の ようす
function summary(game, hint = '') {
  const me = game.me;
  const box = el('div', { class: 'ct-item bank-sum' });
  box.append(
    el('div', { class: 'hd' }, el('span', { class: 'gold', text: '預けている物' })),
    el('div', { class: 'bank-row' }, el('span', { text: '預けているお金' }), el('span', { class: 'gold', text: `${bankGold(me)} G` })),
    el('div', { class: 'bank-row' }, el('span', { text: '持っているお金' }), el('span', { text: `${me.gold} G` })),
    el('div', { class: 'bank-row' }, el('span', { text: '預けている道具' }), el('span', { text: `${bankItems(game).length}／${BANK_KINDS}種類` })),
  );
  const list = bankItems(game);
  if (list.length) box.append(el('div', { class: 'small muted bank-list', text: list.slice(0, 12).map((e) => `${ITEMS[e.id].name}×${e.n}`).join('、') + (list.length > 12 ? '…' : '') }));
  box.append(el('div', { class: 'detail small', text: hint || '全滅すると、持っているお金は半分になってしまう。\n預かり所に預けたお金は、へらずに守られる。' }));
  return box;
}

const HINTS = {
  depositGold: '持っているお金を預ける。\n預けたお金は、全滅してもへらない。',
  withdrawGold: '預けたお金を引き出す。\nどこの預かり所でも引き出せる。',
  depositItem: 'ふくろの道具や装備を預ける。\n1種類99個まで、全部で60種類までお預かりできる。',
  withdrawItem: '預けた道具を、ふくろにもどす。',
  exit: '',
};

export async function bankUI(game, data) {
  const ct = new Counter(game, { title: data.name || '預かり所', keeper: data.keeper || '預かり所の人', icon: boardIconURL('bank') });
  let line = data.hello || 'ようこそ、預かり所へ。\nどんなご用でしょう？';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(summary(game));
    const cmd = await ct.pick([
      { label: 'お金を預ける', value: 'depositGold' },
      { label: 'お金を引き出す', value: 'withdrawGold' },
      { label: '道具を預ける', value: 'depositItem' },
      { label: '道具を引き出す', value: 'withdrawItem' },
      { label: 'やめる', value: 'exit' },
    ], { back: null, onMove: (x) => ct.info(summary(game, HINTS[x?.value])) });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    if (cmd.value === 'depositGold' || cmd.value === 'withdrawGold') await goldFlow(game, ct, cmd.value === 'depositGold');
    else await itemLoop(game, ct, cmd.value === 'depositItem');
    line = AGAIN;
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(summary(game));
  await ct.say('またのおこしをお待ちしております。');
  await ct.tap(1400);
  ct.close();
}

// 全角の 数字も 読む
function parseAmount(t) {
  const s = String(t || '').replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/[^0-9]/g, '');
  return s ? Math.floor(Number(s)) : 0;
}

async function goldFlow(game, ct, deposit) {
  const me = game.me;
  const max = deposit ? Math.min(me.gold, BANK_GOLD_MAX - bankGold(me)) : Math.min(bankGold(me), BANK_GOLD_MAX - me.gold);
  if (max <= 0) {
    await ct.say(deposit ? (me.gold > 0 ? 'これ以上はお預かりできません。' : 'おや？お金を持っていないようですね。') : 'お預かりしているお金はありません。');
    await ct.tap(1800);
    return;
  }
  await ct.say(deposit ? `いくら預けますか？\n（持っているお金: ${me.gold}ゴールド）` : `いくら引き出しますか？\n（預けているお金: ${bankGold(me)}ゴールド）`);
  const opts = [100, 1000, 10000].filter((v) => v < max).map((v) => ({ label: `${v}ゴールド`, value: v }));
  opts.push({ label: `全部（${max}ゴールド）`, value: max }, { label: '金額を入れる', value: 'input' });
  const pick = await ct.pick(opts, { back: 'もどる', onMove: () => ct.info(summary(game, HINTS[deposit ? 'depositGold' : 'withdrawGold'])) });
  if (ct.closed || !pick) return;
  let amt = pick.value;
  if (amt === 'input') {
    const t = await askText(game.input, { title: deposit ? `いくら預ける？（${max}ゴールドまで）` : `いくら引き出す？（${max}ゴールドまで）`, placeholder: String(Math.min(max, 1000)), max: 8, numeric: true });
    if (ct.closed || t === null) return;
    amt = parseAmount(t);
    if (amt <= 0) return;
    if (amt > max) {
      await ct.say(deposit ? `おや？お預かりできるのは${max}ゴールドまでです。` : `おや？引き出せるのは${max}ゴールドまでです。`);
      await ct.tap(1800);
      return;
    }
  }
  const yes = await ct.ask(`${amt}ゴールドを${deposit ? '預け' : '引き出し'}ますね。\nよろしいですか？`);
  if (ct.closed || yes !== 0) return;
  const res = await request(game, { kind: 'bank', action: deposit ? 'depositGold' : 'withdrawGold', amount: amt });
  ct.updGold();
  ct.info(summary(game));
  if (res.ok) game.audio.sfx('item');
  await ct.say(res.text || 'おや？何かおかしいようですね。', { narr: !!res.ok });
  await ct.tap(2200);
}

// 品物の せつめい（持っている数・預けている数）
function itemBox(game, id) {
  const it = ITEMS[id];
  if (!it) return null;
  const box = el('div', { class: 'ct-item' });
  box.append(el('div', { class: 'hd' }, el('span', { class: 'gold', text: it.name }), el('span', { class: 'st', text: itemStats(id) }), el('span', { class: 'rk', text: rankText(id) })));
  box.append(el('div', { class: 'detail', text: it.desc || '' }));
  box.append(el('div', { class: 'bank-row small' }, el('span', { text: '持っている数' }), el('span', { text: `${itemCount(game.me, id)}` })));
  box.append(el('div', { class: 'bank-row small' }, el('span', { text: '預けている数' }), el('span', { class: 'gold', text: `${bankCount(game.me, id)}` })));
  return box;
}

async function itemLoop(game, ct, deposit) {
  const AGAIN_I = deposit ? 'ほかに預ける物はありますか？' : 'ほかに引き出す物はありますか？';
  let line = deposit ? '何を預けますか？' : '何を引き出しますか？';
  let idx = 0;
  while (!ct.closed) {
    const me = game.me;
    const list = deposit ? (me.items || []).filter((e) => ITEMS[e.id] && ITEMS[e.id].type !== 'key' && e.n > 0) : bankItems(game);
    if (!list.length) {
      ct.list(null);
      ct.info(summary(game));
      await ct.say(deposit ? 'おや？預けられる道具は持っていないようですね。' : 'お預かりしている道具はありません。');
      await ct.tap(1800);
      return;
    }
    await ct.say(line);
    const rows = list.map((e) => ({
      value: e.id,
      label: ITEMS[e.id].name,
      html: `${esc(ITEMS[e.id].name)}${ITEMS[e.id].type === 'mat' ? '<span class="tag mat">素材</span>' : ''}<span class="cnt">×${e.n}</span>`,
    }));
    const it = await ct.pick(rows, { start: Math.min(idx, rows.length - 1), onMove: (x) => ct.info(x ? itemBox(game, x.value) : null) });
    if (ct.closed || !it) return;
    idx = rows.findIndex((r) => r.value === it.value);
    const d = ITEMS[it.value];
    const have = deposit ? itemCount(me, it.value) : bankCount(me, it.value);
    const room = deposit ? BANK_STACK - bankCount(me, it.value) : BAG_STACK - itemCount(me, it.value);
    const max = Math.min(have, room);
    if (max <= 0) {
      await ct.say(deposit ? `${d.name}は、${BANK_STACK}個までしかお預かりできません。` : `${d.name}は、ふくろに${BAG_STACK}個までしか入りません。`);
      await ct.tap(1800);
      line = AGAIN_I;
      continue;
    }
    let qty = 1;
    if (max > 1) {
      qty = await ct.qty(`${d.name}ですね。\nいくつ${deposit ? '預け' : '引き出し'}ますか？`, max, null, `持っている数: ${itemCount(me, it.value)}　預けている数: ${bankCount(me, it.value)}`);
      if (!qty) {
        line = AGAIN_I;
        continue;
      }
    }
    const res = await request(game, { kind: 'bank', action: deposit ? 'depositItem' : 'withdrawItem', id: it.value, qty });
    if (ct.closed) return;
    if (!res.ok) {
      await ct.say(res.text || 'おや？何かおかしいようですね。');
      await ct.tap(1800);
      line = AGAIN_I;
      continue;
    }
    game.audio.sfx('item');
    ct.info(itemBox(game, it.value));
    await ct.say(res.text, { narr: true });
    await ct.tap(1600);
    line = AGAIN_I;
  }
}
