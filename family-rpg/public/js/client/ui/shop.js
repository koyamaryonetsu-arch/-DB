// お店と 教会（ドラクエの ながれ）
//
// お店:  「どんなご用でしょう？」→ 買いにきた／売りにきた／やめる
//   買う: 品物を えらぶ（みぎに みんなの 強さが どう かわるか）→ いくつ？（道具）→「〇〇ゴールドですが、よろしいですか？」はい／いいえ
//         → 装備品なら「ここで装備していきますか？」→「どなたが装備しますか？」→「今までの〇〇は引き取りましょうか？」
//   売る: 品物を えらぶ → いくつ？ →「〇〇ゴールドで引き取りましょう。よろしいですか？」はい／いいえ
// 教会:  おいのりをする／生き返らせる／毒を治す／やめる（寄付の かくにん つき）
import { esc } from './dom.js';
import { Counter, EQUIP_TYPES, compareTeam, itemInfo, whoItems } from './counter.js';
import { ITEMS, sellPrice } from '../../shared/data/items.js';
import { itemCount } from '../../shared/stats.js';
import { boardIconURL } from '../render/boards.js';

// サーバーの へんじを まつ
export function request(game, msg) {
  return new Promise((resolve) => {
    game.svcWaiter = resolve;
    game.net.send({ t: 'svc', ...msg });
    setTimeout(() => {
      if (game.svcWaiter === resolve) {
        game.svcWaiter = null;
        resolve({ ok: false, text: '通信がおくれています' });
      }
    }, 6000);
  });
}

const AGAIN = 'ほかにも何かお求めですか？';

// ───────────── お店 ─────────────
export async function shopUI(game, data) {
  const ct = new Counter(game, { title: data.name, keeper: data.keeper || '店の人', icon: boardIconURL(data.kind) });
  let line = data.hello || 'いらっしゃいませ！\nどんなご用でしょう？';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(null);
    const cmd = await ct.pick([
      { label: '買いにきた', value: 'buy' },
      { label: '売りにきた', value: 'sell' },
      { label: 'やめる', value: 'exit' },
    ], { back: null });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    if (cmd.value === 'buy') await buyLoop(game, ct, data);
    else await sellLoop(game, ct);
    line = 'ほかにも何かご用はありますか？';
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('またのおこしをお待ちしております。');
  await ct.tap(1400);
  ct.close();
}

function buyRow(game, id) {
  const it = ITEMS[id];
  let tag = '';
  if (EQUIP_TYPES.includes(it.type)) {
    const team = compareTeam(game, id);
    if (!team.some((r) => r.can)) tag = '<span class="tag muted">装備できない</span>';
    else if (team.some((r) => r.can && !r.same && r.main.d > 0)) tag = '<span class="tag up">↑強くなる</span>';
  }
  return { value: id, label: it.name, html: `${esc(it.name)}${tag}`, right: `${it.price}G`, rightCls: game.me.gold < it.price ? 'dis' : 'gold' };
}

async function buyLoop(game, ct, data) {
  let line = 'どれをお求めですか？';
  let idx = 0;
  while (!ct.closed) {
    await ct.say(line);
    const rows = data.items.filter((id) => ITEMS[id]).map((id) => buyRow(game, id));
    const it = await ct.pick(rows, { start: idx, onMove: (x) => ct.info(x ? itemInfo(game, x.value) : null) });
    if (!it) return;
    idx = rows.findIndex((r) => r.value === it.value);
    line = await buyOne(game, ct, it.value);
  }
}

async function buyOne(game, ct, id) {
  const it = ITEMS[id];
  const eq = EQUIP_TYPES.includes(it.type);
  let qty = 1;
  if (!eq) {
    const max = Math.min(99, Math.floor(game.me.gold / it.price));
    if (max < 1) {
      await ct.say(`${it.name}は${it.price}ゴールドです。\nおや？ゴールドが足りないようですね。`);
      await ct.tap(1800);
      return AGAIN;
    }
    qty = await ct.qty(`${it.name}ですね。\nいくつお求めですか？`, max, it.price, `持っている数: ${itemCount(game.me, id)}`);
    if (!qty) return AGAIN;
  }
  const total = it.price * qty;
  const yes = await ct.ask(qty > 1
    ? `${it.name}を${qty}個ですね。\n全部で${total}ゴールドになりますが、よろしいですか？`
    : `${it.name}ですね。\n${total}ゴールドになりますが、よろしいですか？`);
  if (ct.closed || yes !== 0) return AGAIN; // 買わない
  if (game.me.gold < total) {
    await ct.say('おや？ゴールドが足りないようですね。');
    await ct.tap(1800);
    return AGAIN;
  }
  let who = null;
  let sellOld = false;
  if (eq) {
    const rows = compareTeam(game, id);
    if (rows.some((r) => r.can && !r.same)) {
      const now = await ct.ask('ここで装備していきますか？');
      if (now === 0) {
        await ct.say('どなたが装備しますか？');
        const pick = await ct.pick(whoItems(rows), { box: 'info', back: '装備しない' });
        if (pick) {
          who = pick.value;
          const r = rows.find((x) => x.key === who);
          if (r?.cur && sellPrice(r.cur) > 0) {
            const ans = await ct.ask(`${r.name}が今まで装備していた${ITEMS[r.cur].name}は、\n${sellPrice(r.cur)}ゴールドで引き取りましょうか？`);
            sellOld = ans === 0;
          }
        }
      }
    }
  }
  if (ct.closed) return AGAIN;
  const res = await request(game, { kind: 'shop', action: 'buy', id, qty, who, sellOld });
  ct.updGold();
  if (!res.ok) {
    await ct.say(res.text || 'おや？何かおかしいようですね。');
    await ct.tap(1800);
    return AGAIN;
  }
  game.audio.sfx(who ? 'buff' : 'item');
  ct.info(itemInfo(game, id));
  await ct.say(res.text, { narr: true });
  await ct.tap(2400);
  return `まいどありがとうございます！\n${AGAIN}`;
}

async function sellLoop(game, ct) {
  const AGAIN_SELL = 'ほかに売る物はありますか？';
  let line = '何を売っていただけますか？';
  let idx = 0;
  while (!ct.closed) {
    // おなじ 品物は 1行に まとめる
    const counts = new Map();
    for (const e of game.me.items || []) if (ITEMS[e.id] && ITEMS[e.id].type !== 'key') counts.set(e.id, (counts.get(e.id) || 0) + e.n);
    const bag = [...counts].map(([id, n]) => ({ id, n }));
    if (!bag.length) {
      ct.list(null);
      ct.info(null);
      await ct.say('おや？売れる物は持っていないようですね。');
      await ct.tap(1800);
      return;
    }
    await ct.say(line);
    const rows = bag.map((e) => ({
      value: e.id,
      label: ITEMS[e.id].name,
      html: `${esc(ITEMS[e.id].name)}<span class="cnt">×${e.n}</span>`,
      right: sellPrice(e.id) > 0 ? `${sellPrice(e.id)}G` : '―',
      rightCls: 'gold',
      disabled: sellPrice(e.id) <= 0,
    }));
    const it = await ct.pick(rows, { start: Math.min(idx, rows.length - 1), onMove: (x) => ct.info(x ? itemInfo(game, x.value, { sell: true }) : null) });
    if (!it) return;
    idx = rows.findIndex((r) => r.value === it.value);
    const d = ITEMS[it.value];
    const price = sellPrice(it.value);
    const have = itemCount(game.me, it.value);
    let qty = 1;
    if (have > 1) {
      qty = await ct.qty(`${d.name}ですね。\nいくつ売りますか？`, have, price, `持っている数: ${have}`);
      if (!qty) {
        line = AGAIN_SELL;
        continue;
      }
    }
    const total = price * qty;
    const yes = await ct.ask(qty > 1
      ? `${d.name}を${qty}個ですね。\nそれなら全部で${total}ゴールドで引き取りましょう。よろしいですか？`
      : `${d.name}ですね。\nそれなら${total}ゴールドで引き取りましょう。よろしいですか？`);
    if (ct.closed) return;
    if (yes !== 0) {
      line = AGAIN_SELL;
      continue;
    }
    const res = await request(game, { kind: 'shop', action: 'sell', id: it.value, qty });
    ct.updGold();
    if (!res.ok) {
      await ct.say(res.text || 'おや？何かおかしいようですね。');
      await ct.tap(1800);
      line = AGAIN_SELL;
      continue;
    }
    game.audio.sfx('item');
    line = `まいどありがとうございます！\n${AGAIN_SELL}`;
  }
}

// ───────────── 教会 ─────────────
export async function churchUI(game, data) {
  const ct = new Counter(game, { title: data.title || '教会', keeper: data.keeper || '神父さま', icon: boardIconURL('church') });
  let info = data;
  const AGAIN_C = 'ほかにも何かご用かな？';
  let line = 'おお、迷える子羊よ。神の家によくぞ来られた。\n今日はどんなご用かな？';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(null);
    const cmd = await ct.pick([
      { label: 'おいのりをする', value: 'record' },
      { label: '生き返らせる', value: 'revive' },
      { label: '毒を治す', value: 'cure' },
      { label: 'やめる', value: 'exit' },
    ], { back: null, onMove: (x) => ct.info(churchHint(x?.value)) });
    if (ct.closed) return;
    if (!cmd || cmd.value === 'exit') break;
    if (cmd.value === 'record') {
      const yes = await ct.ask('神にいのりをささげて、\nここを、いのりの場所として記録しますか？');
      if (yes === 0) {
        const r = await request(game, { kind: 'church', action: 'record' });
        if (r.ok) game.audio.sfx('heal');
        await ct.say(r.text || '');
        await ct.tap(2400);
      }
      line = AGAIN_C;
      continue;
    }
    const list = cmd.value === 'revive' ? info.dead : info.poisoned;
    if (!list.length) {
      await ct.say(cmd.value === 'revive' ? '生き返らせる者は、おらぬようじゃな。' : '毒にかかっている者は、おらぬようじゃな。');
      await ct.tap(1800);
      line = AGAIN_C;
      continue;
    }
    await ct.say(cmd.value === 'revive' ? 'だれを生き返らせるのかな？' : 'だれの毒を治すのかな？');
    const who = await ct.pick(list.map((d) => ({ value: d.ref, label: d.name, right: `${d.price}G`, rightCls: 'gold' })), { back: 'やめる' });
    if (ct.closed) return;
    if (!who) {
      line = AGAIN_C;
      continue;
    }
    const d = list.find((x) => x.ref === who.value);
    const yes = await ct.ask(cmd.value === 'revive'
      ? `${d.name}を生き返らせるには、\n${d.price}ゴールドの寄付が必要じゃ。よろしいかな？`
      : `${d.name}の毒を治すには、\n${d.price}ゴールドの寄付が必要じゃ。よろしいかな？`);
    if (ct.closed) return;
    if (yes !== 0) {
      line = AGAIN_C;
      continue;
    }
    const r = await request(game, { kind: 'church', action: cmd.value, ref: d.ref });
    ct.updGold();
    if (r.church) info = r.church;
    if (r.ok) game.audio.sfx('heal');
    ct.list(null);
    await ct.say(r.text || '');
    await ct.tap(2400);
    line = AGAIN_C;
  }
  if (ct.closed) return;
  ct.list(null);
  ct.info(null);
  await ct.say('あなたに神のご加護がありますように。');
  await ct.tap(1400);
  ct.close();
}

function churchHint(action) {
  const text = {
    record: 'おいのりをすると、ここが「いのりの場所」になる。\n全員がたおれたときは、最後においのりした教会で目を覚ますよ。',
    revive: '死んでしまった仲間を、寄付と引きかえに生き返らせてもらえる。',
    cure: '毒にかかった仲間を、寄付と引きかえに治してもらえる。',
    exit: '',
  }[action];
  if (!text) return null;
  const box = document.createElement('div');
  box.className = 'detail';
  box.textContent = text;
  return box;
}
