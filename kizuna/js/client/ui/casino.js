// カジノ（コイン売り場・スロット・ポーカー・景品コーナー）と メダル王の まど
//   乱数と コインの 計算は サーバー（shared/world/casino.js）。ここは 見せるだけ
//   キーボード: ←→↑↓ で えらぶ・Z/Enter で 決定・X/Esc で もどる。スマホは ボタンや カードを タップ
import { el } from './dom.js?v=f87d705c60fe';
import { Counter, itemInfo } from './counter.js?v=f87d705c60fe';
import { request } from './shop.js?v=f87d705c60fe';
import { boardIconURL } from '../render/boards.js?v=f87d705c60fe';
import { symbolCanvas, symbolURL, cardCanvas, iconURL, CARD_SIZE } from '../render/casino.js?v=f87d705c60fe';
import { ITEMS } from '../../shared/data/items.js?v=f87d705c60fe';
import { itemCount } from '../../shared/stats.js?v=f87d705c60fe';
import {
  REELS, SLOT_PAYS, SLOT_BETS, POKER_PAY_HANDS, POKER_BETS, pokerSuggest, cardName, coinsOf,
  medalsHeld, medalsGiven, COIN_PRICE,
} from '../../shared/data/casino.js?v=f87d705c60fe';

export function casinoUI(game, kind, data) {
  ensureStyle();
  if (kind === 'medalKing') return medalKingUI(game, data || {});
  switch (data?.mode) {
    case 'coins': return coinsUI(game, data);
    case 'slot': return slotUI(game, data);
    case 'poker': return pokerUI(game, data);
    case 'prizes': return prizesUI(game, data);
    default: return Promise.resolve();
  }
}

const fmt = (n) => Number(n || 0).toLocaleString('ja-JP');
const sendClose = (game, kind = 'casino') => game.net.send({ t: 'svc', kind, action: 'close' });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const itemsText = (items) => items.map(([id, n]) => `${ITEMS[id]?.name || id}${n > 1 ? `×${n}` : ''}`).join('と');

// ───────────── カウンターの まど（コイン・景品・メダル王）─────────────
class CasinoCounter extends Counter {
  constructor(game, opts) {
    super(game, { ...opts, cls: 'casino-counter' });
    this.purse = opts.purse || null;
    this.updGold();
  }

  updGold() {
    const me = this.game.me;
    if (!this.purse || !me) return super.updGold();
    this.goldEl.innerHTML = '';
    if (this.purse === 'coins') {
      this.goldEl.append(el('span', { text: `所持金 ${fmt(me.gold)} G` }), el('span', { class: 'cs-purse' }, el('img', { class: 'cs-ico', src: iconURL('coin'), alt: '' }), `${fmt(coinsOf(me))}枚`));
    } else {
      this.goldEl.append(el('span', { class: 'cs-purse' }, el('img', { class: 'cs-ico', src: iconURL('medal'), alt: '' }), `小さなメダル ${medalsHeld(me)}枚`));
    }
  }

  // 何枚？（◀▶ で 1枚・▲▼ で 10枚）。やめる・閉じる は 0
  async qtyCoins(text, max, price) {
    await this.say(text);
    return this.wait((done) => {
      if (!done) return 0;
      let q = Math.min(10, max);
      const val = el('div', { class: 'ct-qty-val' });
      const upd = () => { val.textContent = `◀ ${q}枚 ▶　${fmt(q * price)}G`; };
      const step = (d) => {
        q = Math.max(1, Math.min(max, q + d));
        this.game.audio.sfx('cursor');
        upd();
      };
      const btn = (text, d) => el('button', { class: 'btn', text, onclick: () => step(d) });
      const h = {
        onNav: (a) => {
          if (a === 'a') return finish(q);
          if (a === 'b') return finish(0);
          if (a === 'left') step(-1);
          else if (a === 'right') step(1);
          else if (a === 'down') step(-10);
          else if (a === 'up') step(10);
        },
      };
      const unhook = this.hook(() => finish(0));
      const finish = (v) => {
        unhook();
        this.game.input.pop(h);
        this.choiceBox.innerHTML = '';
        this.choiceBox.classList.remove('wide');
        if (v) this.game.audio.sfx('confirm');
        done(v);
      };
      upd();
      this.choiceBox.innerHTML = '';
      this.choiceBox.classList.add('wide');
      this.choiceBox.append(el('div', { class: 'ct-qty' }, val,
        el('div', { class: 'row' }, btn('－10', -10), btn('－1', -1), btn('＋1', 1), btn('＋10', 10)),
        el('div', { class: 'row' }, el('button', { class: 'btn', text: 'やめる', onclick: () => finish(0) }), el('button', { class: 'btn primary', text: '決定', onclick: () => finish(q) }))));
      this.game.input.push(h);
    }).then((v) => v || 0);
  }
}

function helpBox(lines) {
  return el('div', { class: 'detail cs-help', text: lines.join('\n') });
}

// ───────────── コイン売り場 ─────────────
async function coinsUI(game, data) {
  const price = data.price || COIN_PRICE;
  const ct = new CasinoCounter(game, { title: 'コイン売り場', keeper: 'コイン係', icon: boardIconURL('casino'), purse: 'coins' });
  const AGAIN = 'ほかにも何かご用はありますか？';
  let line = `いらっしゃいませ！\nコインは1枚${price}ゴールドです。何枚お求めですか？`;
  while (!ct.closed) {
    await ct.say(line);
    ct.info(helpBox([`コイン1枚 = ${price}ゴールド`, 'コインはスロットとポーカーで使えます。', 'ふやしたコインは、景品コーナーで景品とこうかんできます。', 'コインはゴールドにはもどせません。']));
    const gold = game.me.gold;
    const rows = (data.packs || [10, 50, 100, 500, 1000]).map((n) => ({ label: `${fmt(n)}枚`, right: `${fmt(n * price)}G`, value: n, rightCls: gold < n * price ? 'dis' : 'gold' }));
    rows.push({ label: '枚数を決める', value: 'custom' }, { label: 'やめる', value: 'exit' });
    const pick = await ct.pick(rows, { back: null });
    if (ct.closed) break;
    if (!pick || pick.value === 'exit') break;
    let n = pick.value;
    const canBuy = Math.min(data.buyMax || 9999, Math.floor(game.me.gold / price), (data.coinMax || 99999) - coinsOf(game.me));
    if (n === 'custom') {
      if (canBuy < 1) {
        await ct.say('おや？ゴールドが足りないようですね。');
        await ct.tap(1800);
        line = AGAIN;
        continue;
      }
      n = await ct.qtyCoins('何枚お求めですか？', canBuy, price);
      if (!n) {
        line = AGAIN;
        continue;
      }
    }
    if (game.me.gold < n * price) {
      await ct.say(`コイン${fmt(n)}枚は${fmt(n * price)}ゴールドです。\nおや？ゴールドが足りないようですね。`);
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    const yes = await ct.ask(`コイン${fmt(n)}枚ですね。\n${fmt(n * price)}ゴールドになりますが、よろしいですか？`);
    if (ct.closed) break;
    if (yes !== 0) {
      line = AGAIN;
      continue;
    }
    const r = await request(game, { kind: 'casino', action: 'buyCoins', n });
    ct.updGold();
    if (!r.ok) {
      game.audio.sfx('buzz');
      await ct.say(r.text || 'おや？何かおかしいようですね。');
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    game.audio.sfx('coin');
    await ct.say(r.text, { narr: true });
    await ct.tap(2000);
    line = `まいどありがとうございます！\n${AGAIN}`;
  }
  if (!ct.closed) {
    ct.list(null);
    ct.info(null);
    await ct.say('またのおこしをお待ちしております。\nごゆっくりお楽しみください。');
    await ct.tap(1400);
    ct.close();
  }
  sendClose(game);
}

// ───────────── 景品コーナー ─────────────
async function prizesUI(game, data) {
  const ct = new CasinoCounter(game, { title: '景品コーナー', keeper: '景品係', icon: boardIconURL('casino'), purse: 'coins' });
  const AGAIN = 'ほかにも何かこうかんしますか？';
  let line = 'いらっしゃいませ！\nコインを、すてきな景品とこうかんいたします。';
  let idx = 0;
  while (!ct.closed) {
    await ct.say(line);
    const coins = coinsOf(game.me);
    const rows = (data.prizes || []).filter((p) => ITEMS[p.id]).map((p) => ({
      value: p.id, label: ITEMS[p.id].name, right: `${fmt(p.coins)}枚`, rightCls: coins < p.coins ? 'dis' : 'gold', coins: p.coins,
    }));
    const pick = await ct.pick(rows, { start: idx, back: 'やめる', onMove: (x) => ct.info(x ? itemInfo(game, x.value) : null) });
    if (ct.closed || !pick) break;
    idx = rows.findIndex((r) => r.value === pick.value);
    const it = ITEMS[pick.value];
    if (coinsOf(game.me) < pick.coins) {
      game.audio.sfx('buzz');
      await ct.say(`${it.name}は、コイン${fmt(pick.coins)}枚です。\nおや？コインが足りないようですね。`);
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    const yes = await ct.ask(`${it.name}ですね。\nコイン${fmt(pick.coins)}枚とこうかんしますか？`);
    if (ct.closed) break;
    if (yes !== 0) {
      line = AGAIN;
      continue;
    }
    const r = await request(game, { kind: 'casino', action: 'prize', id: pick.value });
    ct.updGold();
    if (!r.ok) {
      game.audio.sfx('buzz');
      await ct.say(r.text || 'おや？何かおかしいようですね。');
      await ct.tap(1800);
      line = AGAIN;
      continue;
    }
    game.audio.sfx('item');
    ct.info(itemInfo(game, pick.value));
    await ct.say(`${r.text}\n（持っている数: ${itemCount(game.me, pick.value)}）`, { narr: true });
    await ct.tap(2400);
    line = `おめでとうございます！\n${AGAIN}`;
  }
  if (!ct.closed) {
    ct.list(null);
    ct.info(null);
    await ct.say('またのおこしをお待ちしております。');
    await ct.tap(1400);
    ct.close();
  }
  sendClose(game);
}

// ───────────── メダル王 ─────────────
async function medalKingUI(game, data) {
  const ct = new CasinoCounter(game, { title: 'メダル王の城', keeper: 'メダル王', icon: boardIconURL('medal'), purse: 'medals' });
  let info = data;
  const held = () => medalsHeld(game.me);
  let line = held() ? `おお、小さなメダルを${held()}枚持っておるな！\nさあ、どうするかな？` : 'さあ、どうするかな？';
  while (!ct.closed) {
    await ct.say(line);
    ct.info(medalSummary(game, info));
    const cmd = await ct.pick([
      { label: 'メダルをわたす', value: 'give' },
      { label: 'ごほうびの一覧', value: 'list' },
      { label: 'やめる', value: 'exit' },
    ], { back: null });
    if (ct.closed || !cmd || cmd.value === 'exit') break;
    if (cmd.value === 'list') {
      await rewardList(game, ct, info);
      line = 'ほかに何か用かな？';
      continue;
    }
    const n = held();
    if (!n) {
      await ct.say('おや、小さなメダルを持っておらんようじゃな。\nつぼやたる、井戸の中などを調べて探してみるのじゃ。');
      await ct.tap(2200);
      line = 'ほかに何か用かな？';
      continue;
    }
    const yes = await ct.ask(`小さなメダルを${n}枚、わしにわたしてくれるかな？`);
    if (ct.closed) break;
    if (yes !== 0) {
      line = 'そうか。気が向いたら、いつでも持ってくるがよい。';
      continue;
    }
    const r = await request(game, { kind: 'medal', action: 'give' });
    ct.updGold();
    if (r.medal) info = r.medal;
    if (!r.ok) {
      await ct.say(r.text || 'おや？');
      await ct.tap(1800);
      line = 'ほかに何か用かな？';
      continue;
    }
    game.audio.sfx('coin');
    ct.info(medalSummary(game, info));
    await ct.say(`${r.gave}枚のメダル、たしかにうけとったぞ！\nこれで、わしにわたしたメダルは全部で${r.total}枚じゃな。`);
    await ct.tap(2400);
    for (const g of r.got || []) {
      game.audio.play('jackpot');
      await ct.say(`${g.at}枚のほうびとして、これをとらせよう！`);
      await ct.tap(1600);
      await ct.say(`${game.me.name}は${itemsText(g.items)}を手に入れた！`, { narr: true });
      ct.info(itemInfo(game, g.items[0][0]));
      await ct.tap(2600);
    }
    const next = info.rewards?.find((x) => !x.got);
    line = next ? `次は${next.at}枚で、${itemsText(next.items)}をやろう。\nがんばって探すのじゃぞ！` : 'わしのほうびは、これで全部じゃ！\nそなたこそ、真のメダル王じゃ！';
  }
  if (!ct.closed) {
    ct.list(null);
    ct.info(null);
    await ct.say('また小さなメダルを見つけたら、持ってくるのじゃぞ。');
    await ct.tap(1400);
    ct.close();
  }
  sendClose(game, 'medal');
}

// ごほうびまで あと何枚（持っている メダルを わたせば とどく ときは そう 言う）
function rewardLeft(game, given, r) {
  if (r.got) return { text: 'もらった', cls: 'good' };
  const left = r.at - given - medalsHeld(game.me);
  return left <= 0 ? { text: 'わたすともらえる', cls: 'gold' } : { text: `あと${left}枚`, cls: '' };
}

function medalSummary(game, info) {
  const given = info.given ?? medalsGiven(game.me);
  const next = info.rewards?.find((x) => !x.got);
  const box = el('div', { class: 'cs-medal-sum' });
  box.append(el('div', { class: 'kv' }, el('span', { class: 'k', text: '持っているメダル' }), el('span', { class: 'gold', text: `${medalsHeld(game.me)}枚` })));
  box.append(el('div', { class: 'kv' }, el('span', { class: 'k', text: 'メダル王にわたした数' }), el('span', { text: `${given}枚` })));
  if (next) box.append(el('div', { class: 'detail', text: `次のごほうび: ${next.at}枚で「${itemsText(next.items)}」（${rewardLeft(game, given, next).text}）` }));
  else box.append(el('div', { class: 'detail good', text: 'ごほうびは全部もらった！' }));
  box.append(el('div', { class: 'detail', text: '小さなメダルは、つぼ・たる・本だな・井戸などを調べると見つかることがある。光っている地面や、宝箱に入っていることもある。' }));
  return box;
}

async function rewardList(game, ct, info) {
  const given = info.given ?? medalsGiven(game.me);
  await ct.say('わしにわたしたメダルの数に合わせて、\nこれらのほうびをとらせよう。');
  const rows = (info.rewards || []).map((r) => {
    const left = rewardLeft(game, given, r);
    // 名前の とちゅうでは おりかえさない（品と 品の あいだだけ）。せまい 画面では みぎの じょうたいが 下の 行へ
    const names = r.items.map(([id, n]) => `<span class="nw">${ITEMS[id]?.name || id}${n > 1 ? `×${n}` : ''}</span>`).join('と<wbr>');
    return { value: r.at, cls: 'cs-rw', html: `<span class="cs-at">${r.at}枚</span><span class="cs-rn">${names}</span>`, right: left.text, rightCls: left.cls, items: r.items };
  });
  await ct.pick(rows, { back: 'もどる', onMove: (x) => ct.info(x ? itemInfo(game, x.items[0][0]) : null) });
}

// ───────────── スロット・ポーカーの まど ─────────────
function casinoShell(game, { title, cls }) {
  const back = el('div', { class: 'modal-back' });
  const coinsEl = el('span', { class: 'cs-coins' });
  const s = { onClose: null, locked: false };
  const closeBtn = el('button', {
    class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる',
    onclick: () => { if (!s.locked) s.onClose?.(); },
  });
  const head = el('div', { class: 'win svc-head cs-head' },
    el('span', { class: 'gold ct-title' }, el('img', { class: 'ct-icon', src: boardIconURL('casino'), alt: '' }), title), coinsEl, closeBtn);
  const body = el('div', { class: 'cs-body' });
  const root = el('div', { class: `panel casino-panel ${cls}` }, head, body);
  back.addEventListener('click', () => { if (!s.locked) s.onClose?.(); });
  document.getElementById('ui').append(back, root);
  Object.assign(s, {
    root, body, closeBtn,
    setCoins(n) {
      coinsEl.innerHTML = '';
      coinsEl.append(el('img', { class: 'cs-ico', src: iconURL('coin'), alt: '' }), `コイン ${fmt(n)}枚`);
    },
    lock(on) {
      s.locked = on;
      closeBtn.disabled = on;
    },
    remove() {
      back.remove();
      root.remove();
    },
  });
  return s;
}

// コインの 数を すこしずつ ふやして 見せる
function countUp(sh, from, to, sfx) {
  clearInterval(sh.countTimer);
  if (to <= from) {
    sh.setCoins(to);
    return;
  }
  let v = from;
  const stepN = Math.max(1, Math.ceil((to - from) / 24));
  let k = 0;
  sh.countTimer = setInterval(() => {
    v = Math.min(to, v + stepN);
    sh.setCoins(v);
    if (k++ % 3 === 0) sfx?.();
    if (v >= to) clearInterval(sh.countTimer);
  }, 45);
}

// キーボード・パッドで えらぶ ボタンや カード（row: 行。↑↓ で 行を かえる）
class Focus {
  constructor() {
    this.items = [];
    this.idx = 0;
  }

  set(items, start = 0) {
    for (const it of this.items) it.el.classList.remove('cs-focus');
    this.items = items.filter((it) => it.el && !it.el.disabled);
    this.idx = Math.max(0, Math.min(this.items.length - 1, start));
    this.show();
  }

  show() {
    this.items.forEach((it, i) => it.el.classList.toggle('cs-focus', i === this.idx));
  }

  move(dir) {
    const n = this.items.length;
    if (!n) return false;
    const cur = this.items[this.idx];
    if (dir === 'left' || dir === 'right') {
      const row = this.items.filter((it) => it.row === cur.row);
      const k = row.indexOf(cur);
      const next = row[(k + (dir === 'left' ? -1 : 1) + row.length) % row.length];
      this.idx = this.items.indexOf(next);
    } else {
      const rows = [...new Set(this.items.map((it) => it.row))].sort((a, b) => a - b);
      const ri = rows.indexOf(cur.row);
      const target = rows[ri + (dir === 'up' ? -1 : 1)];
      if (target === undefined) return false;
      const cand = this.items.filter((it) => it.row === target);
      const cx = cur.el.getBoundingClientRect().left;
      cand.sort((a, b) => Math.abs(a.el.getBoundingClientRect().left - cx) - Math.abs(b.el.getBoundingClientRect().left - cx));
      this.idx = this.items.indexOf(cand[0]);
    }
    this.show();
    return true;
  }

  press() {
    this.items[this.idx]?.act();
  }
}

// ───────────── スロット ─────────────
const RW = 296, RH = 248, CELL_W = 80, CELL_H = 72, FR = 16, GAP = 12;
const SPIN_V = 16; // 1びょうに すすむ 絵がらの 数

function slotUI(game, data) {
  return new Promise((resolve) => {
    const sh = casinoShell(game, { title: 'スロット', cls: 'slot-panel' });
    const bets = data.bets || SLOT_BETS;
    let bet = bets.includes(data.bet) ? data.bet : bets[0];
    let coins = data.coins;
    let spinning = false;
    let result = null;
    let flashUntil = 0;
    let closed = false;
    sh.setCoins(coins);

    const cv = el('canvas', { class: 'cs-reels', width: RW, height: RH });
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const msg = el('div', { class: 'cs-msg', text: 'かけるコインを選んで、スタート！' });
    const betBtns = bets.map((b) => el('button', { class: 'btn cs-bet', text: `${b}枚`, onclick: () => setBet(b) }));
    const spinBtn = el('button', { class: 'btn primary cs-big', text: 'スタート', onclick: () => press() });
    const payRows = SLOT_PAYS.map((p) => {
      const syms = el('span', { class: 'syms' }, ...p.line.map((sym) => (sym ? el('img', { src: symbolURL(sym), alt: '' }) : el('span', { class: 'any', text: '―' }))));
      const coinsCell = el('span', { class: 'c' });
      const row = [syms, el('span', { class: 'm', text: `×${p.mult}` }), coinsCell];
      return { p, row, coinsCell };
    });
    const pay = el('div', { class: 'cs-pay' }, ...payRows.flatMap((r) => r.row));
    const side = el('div', { class: 'win cs-side scroll' },
      el('div', { class: 'cs-controls cs-bets' }, el('span', { class: 'small muted', text: 'かける' }), ...betBtns),
      el('div', { class: 'cs-controls' }, spinBtn),
      el('div', { class: 'cs-subhead', text: 'まん中の列にそろうと当たり' }), pay,
      el('div', { class: 'detail cs-tip', text: game.input.touch ? '「ストップ」でリールを早く止められる。' : '←→: かける枚数／Z: スタート・ストップ／X: 閉じる' }));
    const machine = el('div', { class: 'win cs-machine' }, cv, msg);
    sh.body.append(machine, side);

    const reels = REELS.map((strip, i) => ({ strip, pos: (i * 7 + 3) % strip.length, state: 'idle', stopAt: 0, target: 0, from: 0, t0: 0, dur: 0 }));

    const setBet = (b) => {
      if (spinning || !bets.includes(b)) return;
      bet = b;
      game.audio.sfx('cursor');
      renderBets();
    };
    const renderBets = () => {
      betBtns.forEach((btn, i) => btn.classList.toggle('on', bets[i] === bet));
      for (const r of payRows) {
        r.coinsCell.textContent = `${fmt(r.p.mult * bet)}枚`;
        r.row.forEach((c) => c.classList.toggle('hit', !!result?.pay && result.pay.id === r.p.id));
      }
      spinBtn.textContent = spinning ? 'ストップ' : 'スタート';
      spinBtn.classList.toggle('stop', spinning);
    };
    renderBets();

    const spin = async () => {
      if (spinning) return;
      if (coins < bet) {
        game.audio.sfx('buzz');
        msg.textContent = 'コインが足りない。\nコイン売り場（左のカウンター）で買える。';
        return;
      }
      spinning = true;
      sh.lock(true);
      result = null;
      renderBets();
      msg.textContent = 'まわれ、まわれ…！';
      game.audio.sfx('coin');
      coins -= bet;
      sh.setCoins(coins);
      const now = performance.now();
      for (const r of reels) { r.state = 'spin'; r.stopAt = Infinity; }
      const res = await request(game, { kind: 'casino', action: 'slot', bet });
      if (closed) return;
      if (!res.ok || !res.stops) {
        for (const r of reels) r.state = 'idle';
        spinning = false;
        sh.lock(false);
        coins = res.coins ?? coinsOf(game.me);
        sh.setCoins(coins);
        msg.textContent = res.text || 'うまく動かなかった…';
        game.audio.sfx('buzz');
        renderBets();
        return;
      }
      result = res;
      const t = Math.max(now + 650, performance.now() + 250);
      // リーチ（左と まん中が そろって、そろえば 当たり）は さいごの リールを ゆっくり
      const reach = res.line[0] === res.line[1] && SLOT_PAYS.some((p) => p.line.every((sym) => sym === res.line[0]));
      reels[0].stopAt = t;
      reels[1].stopAt = t + 420;
      reels[2].stopAt = t + 840 + (reach ? 900 : 0);
      reels.forEach((r, i) => { r.stop = res.stops[i]; });
      result.reach = reach;
    };

    // つぎの リールを すぐ 止める（見た目だけ。結果は もう きまっている）
    const stopNext = () => {
      if (!result) return;
      const r = reels.find((x) => x.state === 'spin');
      if (r) r.stopAt = Math.min(r.stopAt, performance.now());
    };

    const press = () => {
      if (closed) return;
      if (spinning) stopNext();
      else spin();
    };

    const beginStop = (r, now) => {
      const n = r.strip.length;
      const base = Math.ceil(r.pos + 2);
      const d = (((r.stop - base) % n) + n) % n;
      r.from = r.pos;
      r.target = base + d;
      r.t0 = now;
      r.dur = (3 * (r.target - r.from) / SPIN_V) * 1000;
      r.state = 'stopping';
    };

    const finish = () => {
      spinning = false;
      sh.lock(false);
      const res = result;
      renderBets();
      if (res.pay) {
        flashUntil = performance.now() + 1800;
        const back = res.pay.mult === 1;
        msg.textContent = back ? 'チェリーが1つ！\nかけたコインがもどってきた。' : `${res.pay.name}！${res.pay.id === 'seven3' ? '\n大当たり！' : ''}\nコインを${fmt(res.win)}枚手に入れた！`;
        if (res.pay.mult >= 30) game.audio.play('jackpot');
        else game.audio.sfx('win');
        countUp(sh, coins, res.coins, () => game.audio.sfx('coin'));
      } else {
        msg.textContent = 'はずれ…';
        sh.setCoins(res.coins);
      }
      coins = res.coins;
    };

    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      if (closed) return;
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      let allIdle = true;
      reels.forEach((r, i) => {
        if (r.state === 'spin') {
          r.pos += SPIN_V * dt;
          if (now >= r.stopAt) beginStop(r, now);
          allIdle = false;
        }
        if (r.state === 'stopping') {
          const x = Math.min(1, (now - r.t0) / r.dur);
          r.pos = r.from + (r.target - r.from) * (1 - (1 - x) ** 3);
          allIdle = false;
          if (x >= 1) {
            r.pos = r.target;
            r.state = 'bounce';
            r.t0 = now;
            game.audio.sfx('reel');
            if (i === 1 && result?.reach) game.audio.sfx('reach');
          }
        }
        if (r.state === 'bounce') {
          const x = (now - r.t0) / 160;
          r.draw = x < 1 ? r.target + Math.sin(x * Math.PI) * 0.1 : r.target;
          if (x >= 1) { r.state = 'idle'; r.draw = null; }
          else allIdle = false;
        }
      });
      if (spinning && result && allIdle) finish();
      drawReels(ctx, reels, now, now < flashUntil);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const h = {
      el: sh.root,
      onNav: (a) => {
        if (a === 'a') press();
        else if (a === 'b') { if (!spinning) close(); }
        else if (a === 'left' || a === 'right') {
          const i = bets.indexOf(bet);
          setBet(bets[(i + (a === 'left' ? -1 : 1) + bets.length) % bets.length]);
        }
      },
    };
    game.input.push(h);
    const close = () => {
      if (closed || spinning) return;
      closed = true;
      cancelAnimationFrame(raf);
      clearInterval(sh.countTimer);
      game.input.pop(h);
      game.audio.sfx('cancel');
      sh.remove();
      sendClose(game);
      resolve();
    };
    sh.onClose = close;
  });
}

// リールを かく（まん中の 列が 当たりの 線）
function drawReels(ctx, reels, now, flash) {
  ctx.fillStyle = '#2a0c2e';
  ctx.fillRect(0, 0, RW, RH);
  // わくの ランプ
  const on = Math.floor(now / 260) % 2;
  for (let i = 0; i < 18; i++) {
    const x = 8 + i * ((RW - 16) / 17);
    ctx.fillStyle = (i + on) % 2 ? '#ffd84a' : '#8a3a2a';
    ctx.fillRect(Math.round(x) - 2, 4, 4, 4);
    ctx.fillRect(Math.round(x) - 2, RH - 8, 4, 4);
  }
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 2;
  ctx.strokeRect(FR - 5, FR - 5, RW - 2 * FR + 10, RH - 2 * FR + 10);
  reels.forEach((r, i) => {
    const x0 = FR + i * (CELL_W + GAP), y0 = FR;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, y0, CELL_W, CELL_H * 3);
    ctx.clip();
    ctx.fillStyle = '#f4f2fa';
    ctx.fillRect(x0, y0, CELL_W, CELL_H * 3);
    const p = r.draw ?? r.pos;
    const base = Math.floor(p);
    const n = r.strip.length;
    for (let k = base - 2; k <= base + 2; k++) {
      const sym = r.strip[((k % n) + n) % n];
      const dy = (p - k) * CELL_H;
      ctx.drawImage(symbolCanvas(sym), x0 + (CELL_W - 64) / 2, Math.round(y0 + CELL_H + dy + (CELL_H - 64) / 2));
    }
    // リールの まるみ（上と 下を くらく）
    const g = ctx.createLinearGradient(0, y0, 0, y0 + CELL_H * 3);
    g.addColorStop(0, 'rgba(20, 10, 40, 0.55)');
    g.addColorStop(0.22, 'rgba(20, 10, 40, 0)');
    g.addColorStop(0.78, 'rgba(20, 10, 40, 0)');
    g.addColorStop(1, 'rgba(20, 10, 40, 0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(x0, y0, CELL_W, CELL_H * 3);
    ctx.restore();
    ctx.strokeStyle = '#140818';
    ctx.lineWidth = 3;
    ctx.strokeRect(x0 - 1.5, y0 - 1.5, CELL_W + 3, CELL_H * 3 + 3);
  });
  // 当たりの 線
  const ly = FR + CELL_H * 1.5;
  const lit = flash && Math.floor(now / 120) % 2 === 0;
  ctx.fillStyle = lit ? '#fff080' : 'rgba(232, 48, 58, 0.85)';
  ctx.fillRect(FR - 2, ly - 2, RW - 2 * FR + 4, 4);
  for (const [x, d] of [[FR - 12, 1], [RW - FR + 12, -1]]) {
    ctx.beginPath();
    ctx.moveTo(x, ly - 8);
    ctx.lineTo(x + d * 9, ly);
    ctx.lineTo(x, ly + 8);
    ctx.closePath();
    ctx.fill();
  }
}

// ───────────── ポーカー ─────────────
function pokerUI(game, data) {
  return new Promise((resolve) => {
    const sh = casinoShell(game, { title: 'ポーカー', cls: 'poker-panel' });
    const bets = data.bets || POKER_BETS;
    let bet = bets[0];
    let coins = data.coins;
    let stage = 'bet';
    let hand = [null, null, null, null, null];
    let hold = [false, false, false, false, false];
    let lastHand = null;
    let win = 0;
    let doubles = 0;
    let closed = false;
    let busy = false;
    const doubleMax = data.doubleMax || 5;
    sh.setCoins(coins);

    const cardEls = [0, 1, 2, 3, 4].map((i) => {
      const c = el('canvas', { width: CARD_SIZE.w, height: CARD_SIZE.h });
      c.getContext('2d').imageSmoothingEnabled = false;
      const lab = el('div', { class: 'pk-hold', text: '残す' });
      const box = el('div', { class: 'pk-card', onclick: () => onCard(i) }, lab, c);
      return { box, c, lab };
    });
    const drawCard = (i, card) => {
      const { c } = cardEls[i];
      const x = c.getContext('2d');
      x.clearRect(0, 0, c.width, c.height);
      x.drawImage(cardCanvas(card), 0, 0);
    };
    const flip = async (i, card) => {
      const b = cardEls[i].box;
      b.classList.add('flip');
      await wait(90);
      drawCard(i, card);
      b.classList.remove('flip');
      game.audio.sfx('card');
    };
    cardEls.forEach((_, i) => drawCard(i, null));
    const msg = el('div', { class: 'cs-msg', text: 'かけるコインを選んで「配る」をおしてください。' });
    const controls = el('div', { class: 'cs-controls pk-controls' });
    const table = el('div', { class: 'win cs-table' }, el('div', { class: 'pk-cards' }, ...cardEls.map((e) => e.box)), msg, controls);
    const handRows = POKER_PAY_HANDS.map((hd) => ({ hd, row: [el('span', { class: 'n', text: hd.name }), el('span', { class: 'm', text: `×${hd.mult}` }), el('span', { class: 'c' })] }));
    const pay = el('div', { class: 'cs-pay pk-pay' }, ...handRows.flatMap((r) => r.row));
    const side = el('div', { class: 'win cs-side scroll' }, el('div', { class: 'cs-subhead', text: '役とコインの倍率' }), pay,
      el('div', { class: 'detail', text: 'ジョーカーは、どのカードの代わりにもなる。\nワンペアでは当たりにならない。' + (game.input.touch ? '' : '\n←→↑↓: 選ぶ／Z: 決定・残す／X: 閉じる') }));
    sh.body.append(table, side);
    const focus = new Focus();

    const renderPay = () => {
      for (const r of handRows) {
        r.row[2].textContent = `${fmt(r.hd.mult * bet)}枚`;
        r.row.forEach((c) => c.classList.toggle('hit', lastHand === r.hd.id));
      }
    };
    const renderHold = () => cardEls.forEach((e, i) => e.box.classList.toggle('held', stage === 'hold' && hold[i]));
    const button = (text, act, cls = '') => el('button', { class: `btn ${cls}`, text, onclick: () => { if (!busy) act(); } });

    // 場面ごとの ボタン
    const render = () => {
      controls.innerHTML = '';
      const items = [];
      renderHold();
      renderPay();
      cardEls.forEach((e) => e.box.classList.toggle('pickable', stage === 'double'));
      if (stage === 'bet') {
        const bb = bets.map((b) => button(`${b}枚`, () => { bet = b; game.audio.sfx('cursor'); render(); }, `cs-bet ${b === bet ? 'on' : ''}`));
        const deal = button('配る', () => deal0(), 'primary cs-big');
        controls.append(el('span', { class: 'small muted', text: 'かける' }), ...bb, deal);
        bb.forEach((b, i) => items.push({ el: b, row: 1, act: () => b.click() }));
        items.push({ el: deal, row: 1, act: () => deal0() });
        focus.set(items, items.length - 1);
      } else if (stage === 'hold') {
        const auto = button('おまかせ', () => { hold = pokerSuggest(hand); game.audio.sfx('confirm'); renderHold(); });
        const draw = button('カードを取りかえる', () => draw0(), 'primary cs-big');
        controls.append(auto, draw);
        cardEls.forEach((e, i) => items.push({ el: e.box, row: 0, act: () => onCard(i) }));
        items.push({ el: auto, row: 1, act: () => auto.click() }, { el: draw, row: 1, act: () => draw0() });
        focus.set(items, focus.items.length && focus.items[focus.idx]?.row === 0 ? focus.idx : 0);
      } else if (stage === 'won') {
        const left = doubleMax - doubles;
        const dbl = button(`ダブルアップ（あと${left}回）`, () => double0(), 'primary');
        const take = button('コインを受け取る', () => take0());
        controls.append(dbl, take);
        items.push({ el: dbl, row: 1, act: () => double0() }, { el: take, row: 1, act: () => take0() });
        focus.set(items, 0);
      } else if (stage === 'double') {
        cardEls.forEach((e, i) => { if (i > 0) items.push({ el: e.box, row: 0, act: () => onCard(i) }); });
        focus.set(items, 0);
      } else {
        const again = button('もう一回', () => { stage = 'bet'; msg.textContent = 'かけるコインを選んで「配る」をおしてください。'; render(); }, 'primary cs-big');
        controls.append(again);
        items.push({ el: again, row: 1, act: () => again.click() });
        focus.set(items, 0);
      }
      sh.lock(stage === 'double' || busy);
    };

    const onCard = (i) => {
      if (busy) return;
      if (stage === 'hold') {
        hold[i] = !hold[i];
        game.audio.sfx('cursor');
        renderHold();
      } else if (stage === 'double' && i > 0) pick0(i - 1);
    };

    const deal0 = async () => {
      if (coins < bet) {
        game.audio.sfx('buzz');
        msg.textContent = 'コインが足りない。\nコイン売り場（左のカウンター）で買える。';
        return;
      }
      busy = true;
      render();
      const r = await request(game, { kind: 'casino', action: 'pokerDeal', bet });
      if (closed) return;
      busy = false;
      if (!r.ok) {
        game.audio.sfx('buzz');
        msg.textContent = r.text || 'うまく配れなかった…';
        coins = r.coins ?? coins;
        sh.setCoins(coins);
        render();
        return;
      }
      coins = r.coins;
      sh.setCoins(coins);
      game.audio.sfx('coin');
      lastHand = null;
      hand = r.hand;
      hold = [false, false, false, false, false];
      busy = true;
      for (let i = 0; i < 5; i++) drawCard(i, null);
      for (let i = 0; i < 5; i++) {
        await flip(i, hand[i]);
        await wait(60);
      }
      if (closed) return;
      busy = false;
      stage = 'hold';
      msg.textContent = '残すカードを選んで（タップで「残す」）、\n「カードを取りかえる」をおしてください。';
      render();
    };

    const draw0 = async () => {
      busy = true;
      render();
      const r = await request(game, { kind: 'casino', action: 'pokerDraw', hold });
      if (closed) return;
      if (!r.ok) {
        busy = false;
        msg.textContent = r.text || 'うまくいかなかった…';
        render();
        return;
      }
      const held = hold.slice();
      stage = 'drawing';
      renderHold();
      // 残した カードも サーバーの 手で かきなおす（いつも サーバーと おなじ カード）
      for (let i = 0; i < 5; i++) drawCard(i, held[i] ? r.hand[i] : null);
      await wait(150);
      for (let i = 0; i < 5; i++) {
        if (held[i]) continue;
        await flip(i, r.hand[i]);
        await wait(70);
      }
      if (closed) return;
      hand = r.hand;
      busy = false;
      lastHand = r.result.id;
      win = r.win;
      doubles = 0;
      if (r.win > 0) {
        msg.textContent = `${r.result.name}！\nコインを${fmt(r.win)}枚手に入れた！`;
        if (r.result.mult >= 20) game.audio.play('jackpot');
        else game.audio.sfx('win');
        countUp(sh, coins, r.coins, () => game.audio.sfx('coin'));
        stage = r.stage === 'won' ? 'won' : 'done';
      } else {
        msg.textContent = `${r.result.name}…\nざんねん。`;
        sh.setCoins(r.coins);
        stage = 'done';
      }
      coins = r.coins;
      render();
    };

    const double0 = async () => {
      busy = true;
      render();
      const r = await request(game, { kind: 'casino', action: 'pokerDouble' });
      if (closed) return;
      busy = false;
      if (!r.ok) {
        game.audio.sfx('buzz');
        msg.textContent = r.text || 'ダブルアップできなかった…';
        render();
        return;
      }
      coins = r.coins;
      sh.setCoins(coins);
      lastHand = null;
      stage = 'double';
      busy = true;
      render();
      await flip(0, r.shown);
      for (let i = 1; i < 5; i++) drawCard(i, null);
      busy = false;
      msg.textContent = `ダブルアップ！表のカードは${cardName(r.shown)}。\nこれより大きいカードを、1枚選んでください。`;
      render();
    };

    const pick0 = async (i) => {
      busy = true;
      render();
      const r = await request(game, { kind: 'casino', action: 'pokerPick', i });
      if (closed) return;
      if (!r.ok) {
        busy = false;
        msg.textContent = r.text || 'うまくいかなかった…';
        render();
        return;
      }
      await flip(i + 1, r.cards[i]);
      await wait(350);
      for (let k = 0; k < 4; k++) if (k !== i) await flip(k + 1, r.cards[k]);
      cardEls[i + 1].box.classList.add('picked');
      setTimeout(() => cardEls[i + 1].box.classList.remove('picked'), 1600);
      busy = false;
      const pc = cardName(r.cards[i]);
      if (r.outcome === 'win') {
        msg.textContent = `${pc}！勝ち！\nコインが${fmt(r.win)}枚になった！`;
        game.audio.sfx('win');
        countUp(sh, coins, r.coins, () => game.audio.sfx('coin'));
      } else if (r.outcome === 'draw') {
        msg.textContent = `${pc}…引き分け。\nコイン${fmt(r.win)}枚はそのまま。`;
        sh.setCoins(r.coins);
      } else {
        msg.textContent = `${pc}…負け。\nかけたコインはなくなってしまった。`;
        game.audio.sfx('buzz');
        sh.setCoins(r.coins);
      }
      coins = r.coins;
      win = r.win;
      doubles = r.doubles;
      stage = r.stage === 'won' ? 'won' : 'done';
      if (r.outcome === 'win' && r.stage === 'done') msg.textContent += `\nダブルアップはここまで！`;
      render();
    };

    const take0 = async () => {
      busy = true;
      render();
      const r = await request(game, { kind: 'casino', action: 'pokerTake' });
      if (closed) return;
      busy = false;
      if (r.ok) game.audio.sfx('coin');
      coins = r.coins ?? coins;
      sh.setCoins(coins);
      msg.textContent = `コイン${fmt(win)}枚を受け取った！\nかけるコインを選んで「配る」をおしてください。`;
      stage = 'bet';
      render();
    };

    render();
    const h = {
      el: sh.root,
      onNav: (a) => {
        if (busy) return;
        if (a === 'a') focus.press();
        else if (a === 'b') {
          if (stage === 'hold') {
            // 取りかえる ボタンへ
            focus.idx = focus.items.length - 1;
            focus.show();
            game.audio.sfx('cursor');
          } else if (stage !== 'double') close();
        } else if (focus.move(a)) game.audio.sfx('cursor');
      },
    };
    game.input.push(h);
    const close = () => {
      if (closed || busy || stage === 'double') return;
      closed = true;
      clearInterval(sh.countTimer);
      game.input.pop(h);
      game.audio.sfx('cancel');
      sh.remove();
      sendClose(game);
      resolve();
    };
    sh.onClose = close;
  });
}

// ───────────── メニュー（道具・クエスト）に 出す もの ─────────────
// 道具の 大事な物に「小さなメダル ×N」（見つけた ことが あれば）
export function medalItemRow(c) {
  if (!c || (!medalsHeld(c) && !medalsGiven(c))) return null;
  return { html: `${ITEMS.small_medal.name}<span class="tag gold">大事</span>`, right: `×${medalsHeld(c)}`, value: 'small_medal', key: true };
}

// クエストの 画面: 小さなメダルと カジノの コイン
export function walletView(c) {
  const lines = [];
  const found = medalsHeld(c) + medalsGiven(c);
  if (found) lines.push(`小さなメダル ${medalsHeld(c)}枚（見つけた数 ${found}枚・メダル王にわたした数 ${medalsGiven(c)}枚）`);
  if (coinsOf(c)) lines.push(`カジノのコイン ${fmt(coinsOf(c))}枚`);
  return lines.length ? el('div', { class: 'detail', text: lines.join('\n') }) : null;
}

// ───────────── 見た目（このファイルだけの CSS）─────────────
let styled = false;
function ensureStyle() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'casino-style';
  st.textContent = `
.casino-panel { left: 50%; top: calc(var(--safe-t) + max(6px, 2vh)); transform: translateX(-50%); width: min(96vw, 920px);
  max-height: calc(100% - 12px - 2vh - var(--safe-t) - var(--safe-b)); gap: 6px; }
.casino-panel .win { background: var(--win-solid); }
.cs-head { margin-bottom: 0; min-height: 2.7em; flex: none; }
.cs-coins, .cs-purse { display: inline-flex; align-items: center; gap: 0.3em; white-space: nowrap; font-variant-numeric: tabular-nums; }
.cs-coins { margin-left: auto; color: var(--accent); font-size: var(--fs-small); }
.cs-ico { width: 1.25em; height: 1.25em; image-rendering: pixelated; flex: none; }
.casino-counter .ct-gold { display: inline-flex; gap: 0.8em; align-items: center; }
.casino-counter .ct-qty .row + .row { margin-top: 0.1em; }
.cs-body { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 6px; }
.cs-machine, .cs-table { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.45em; min-height: 0; }
.cs-reels { display: block; width: min(100%, 440px); height: auto; aspect-ratio: ${RW} / ${RH}; image-rendering: pixelated; border-radius: 4px; }
.cs-msg { min-height: 4.35em; width: 100%; text-align: center; white-space: pre-line; line-height: 1.45; }
body:has(#ui .casino-panel) #hud { visibility: hidden; }
.cs-side { display: flex; flex-direction: column; gap: 0.45em; min-height: 0; }
.cs-controls { display: flex; flex-wrap: wrap; gap: 0.4em; justify-content: center; align-items: center; }
.cs-bet { min-width: 4.4em; min-height: 44px; }
.cs-bet.on { border-color: var(--accent); color: var(--accent); background: rgba(255, 214, 107, 0.14); }
.cs-big { min-width: 9em; min-height: 50px; font-size: 1.08em; }
.cs-big.stop { border-color: #ff8a7a; color: #ffb0a0; }
.casino-panel .btn.cs-focus, .pk-card.cs-focus canvas { outline: 2px solid #fff; outline-offset: 2px; }
.cs-subhead { color: var(--accent); font-size: var(--fs-small); border-bottom: 1px dashed rgba(255, 214, 107, 0.35); padding-bottom: 0.1em; }
.cs-pay { display: grid; grid-template-columns: auto auto 1fr; gap: 0.1em 0.7em; align-items: center; font-size: var(--fs-small); font-variant-numeric: tabular-nums; }
.cs-pay > span { padding: 0.05em 0.2em; border-radius: 3px; }
.cs-pay .syms { display: inline-flex; gap: 0.1em; align-items: center; }
.cs-pay .syms img { width: 1.7em; height: 1.7em; image-rendering: pixelated; }
.cs-pay .syms .any { width: 1.7em; text-align: center; color: var(--muted); }
.cs-pay .m { color: var(--accent); text-align: right; }
.cs-pay .c { text-align: right; color: var(--muted); }
.cs-pay .hit { background: rgba(255, 214, 107, 0.2); color: #fff; }
.pk-pay { grid-template-columns: 1fr auto auto; }
.cs-help { margin-top: 0; }
.cs-medal-sum .kv { padding: 0.1em 0; }
.cs-at { display: inline-block; min-width: 3.2em; color: var(--accent); }
.menu .item.cs-rw { flex-wrap: wrap; row-gap: 0; }
.menu .item.cs-rw .l { display: flex; align-items: baseline; flex: 1 1 auto; min-width: 0; }
.menu .item.cs-rw .cs-at { flex: none; min-width: 2.9em; }
.menu .item.cs-rw .cs-rn { min-width: 0; }
.menu .item.cs-rw .nw { white-space: nowrap; }
.menu .item.cs-rw .r { margin-left: auto; }
.pk-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0.45em; width: min(100%, 520px); }
.pk-card { position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; padding-top: 1.6em; touch-action: manipulation; }
.pk-card canvas { display: block; width: 100%; height: auto; aspect-ratio: ${CARD_SIZE.w} / ${CARD_SIZE.h}; image-rendering: pixelated; transition: transform 0.12s; border-radius: 3px; }
.pk-card.held canvas { transform: translateY(-5px); box-shadow: 0 0 0 2px var(--accent); }
.pk-card.flip canvas { transform: scaleX(0.08); }
.pk-card.picked canvas { box-shadow: 0 0 0 3px #fff; }
.pk-card.pickable:not(:first-child) canvas { box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5); }
.pk-hold { position: absolute; top: 0; z-index: 1; font-size: var(--fs-small); line-height: 1.25; color: var(--accent); visibility: hidden; white-space: nowrap; }
.pk-card.held .pk-hold { visibility: visible; }
@media (max-aspect-ratio: 1/1) {
  .cs-body { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
  .cs-side { overflow-y: auto; }
  .cs-reels { width: min(100%, 310px); }
}
@media (max-height: 520px) and (orientation: landscape) {
  .casino-panel { top: calc(var(--safe-t) + 4px); max-height: calc(100% - 8px - var(--safe-t) - var(--safe-b)); height: calc(100% - 8px - var(--safe-t) - var(--safe-b)); width: min(96vw, 860px); }
  .cs-head, .casino-counter .svc-head { min-height: max(2.3em, 40px); padding-top: 0.15em; padding-bottom: 0.15em; }
  .cs-body { grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
  .cs-reels { width: auto; height: min(56vh, 230px); max-width: 100%; }
  .cs-msg { min-height: 4.05em; font-size: 0.95em; line-height: 1.35; }
  .cs-machine, .cs-table { padding-top: 0.35em; padding-bottom: 0.35em; gap: 0.3em; }
  .cs-bet { min-height: 38px; }
  .cs-big { min-height: 42px; }
  .pk-cards { width: min(100%, calc((100vh - 13em) * 5 * ${CARD_SIZE.w} / ${CARD_SIZE.h} + 2em)); }
  .pk-card { padding-top: 1.45em; }
  .cs-table { justify-content: flex-start; }
  .cs-pay { row-gap: 0; }
  .cs-pay .syms img, .cs-pay .syms .any { width: 1.45em; height: 1.45em; }
  .cs-side .cs-tip { display: none; }
}
`;
  document.head.append(st);
}
