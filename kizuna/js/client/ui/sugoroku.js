// 第37回 B: すごろく場の まど（受付 → すごろくの 盤）
//   さいころ・マスの できごと・こまの 場所は サーバー（shared/world/sugoroku.js）。ここは 見せるだけ
//   受付（Counter）: すごろくで あそぶ・すごろく券を 買う・あそび方
//   盤（casinoShell）: 盤の 絵（render/sugoroku.js）と、さいころ・分かれ道・宝部屋・お店・戦いの ボタン
//   戦いの マスで「戦う！」→ まどを とじる → 戦い（サーバーの だいほん）→ 終わると また この まどが 開く（盤は そのまま）
//   十字キー・A・B: ボタンを えらぶ（ui/padnav.js）。A で 決定・B で 閉じる（ことばは A・B・タップで すすむ）
import { el } from './dom.js?v=521ab50e1f2b';
import { itemInfo } from './counter.js?v=521ab50e1f2b';
import { request } from './shop.js?v=521ab50e1f2b';
import { padNav } from './padnav.js?v=521ab50e1f2b';
import { CasinoCounter, casinoShell, fmt, sendClose, helpBox } from './casino.js?v=521ab50e1f2b';
import { boardIconURL } from '../render/boards.js?v=521ab50e1f2b';
import { iconURL, symbolURL } from '../render/casino.js?v=521ab50e1f2b';
import { SgBoardView, SQ_LOOK, dieURL } from '../render/sugoroku.js?v=521ab50e1f2b';
import { monsterCanvas } from '../render/monsters.js?v=521ab50e1f2b';
import { playerSprite } from '../field.js?v=521ab50e1f2b';
import { shownEquip } from '../../shared/look-equip.js?v=521ab50e1f2b';
import { ITEMS } from '../../shared/data/items.js?v=521ab50e1f2b';
import { MONSTERS } from '../../shared/data/monsters.js?v=521ab50e1f2b';
import { itemCount } from '../../shared/stats.js?v=521ab50e1f2b';
import { coinsOf, medalsHeld } from '../../shared/data/casino.js?v=521ab50e1f2b';
import { BOARD_BY_ID, DICE, TICKET_ITEM, SQ_NAME, squareText } from '../../shared/data/sugoroku.js?v=521ab50e1f2b';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const DIR = (b, from, to) => {
  const a = b.sq[from], t = b.sq[to];
  if (!a || !t) return '';
  if (t.x > a.x) return '→';
  if (t.x < a.x) return '←';
  return t.y > a.y ? '↓' : '↑';
};

// サーバーの へんじ（すごろくの ようす）を 受けとる
const sgReq = (game, msg) => request(game, { kind: 'casino', ...msg });

export async function sugorokuUI(game, data) {
  ensureSgStyle();
  let info = { ...data };
  // まどを 開いた ときの ようす（つなぎなおしで 古い まどの データが とどく ことが あるので、サーバーに 聞きなおす）
  const fresh = await sgReq(game, { action: 'sgState' });
  if (fresh.ok) info = { ...info, run: fresh.sg, tickets: fresh.tickets, medals: fresh.medals, coins: fresh.coins ?? info.coins, after: [...(info.after || []), ...(fresh.after || [])] };
  let result = 'close';
  for (let guard = 0; guard < 200; guard++) {
    if (!document.getElementById('ui')) break;
    if (info.run) {
      const r = await boardScreen(game, info);
      info.after = [];
      if (r === 'fight') { result = 'fight'; break; }
      if (r === 'close') break;
      // おわった・やめた → 受付へ
      const st = await sgReq(game, { action: 'sgState' });
      info = { ...info, run: st.sg ?? null, tickets: st.tickets ?? info.tickets, medals: st.medals ?? info.medals, last: null };
      if (st.clears) info.boards = info.boards.map((b) => ({ ...b, clears: st.clears[b.id] || 0 }));
      continue;
    }
    const r = await deskUI(game, info);
    if (!r) break;
    info = { ...info, run: r.sg, tickets: r.tickets, medals: r.medals, startOps: r.ops, last: null };
  }
  sendClose(game);
  return result;
}

// ───────────── 受付 ─────────────
class SgCounter extends CasinoCounter {
  updGold() {
    const me = this.game.me;
    if (!me || !this.goldEl) return;
    this.goldEl.innerHTML = '';
    this.goldEl.append(
      el('span', { class: 'cs-purse' }, el('img', { class: 'cs-ico', src: iconURL('coin'), alt: '' }), `${fmt(coinsOf(me))}枚`),
      el('span', { class: 'cs-purse sg-tk', text: `券 ${itemCount(me, TICKET_ITEM)}まい` }),
      el('span', { class: 'cs-purse' }, el('img', { class: 'cs-ico', src: iconURL('medal'), alt: '' }), `${medalsHeld(me)}まい`),
    );
  }
}

async function deskUI(game, info) {
  const ct = new SgCounter(game, { title: 'すごろく場', keeper: 'すごろく場の受付', icon: boardIconURL('casino'), purse: 'coins' });
  const t = info.tier || { tier: 0, clears: 0, left: 3 };
  const next = (info.boards || []).find((b) => !b.open);
  const note = next ? `\n（宝の地図をあと${next.left}こクリアすると「${next.name}」があらわれます）` : '';
  let line = `いらっしゃいませ！すごろく場へようこそ。\nすごろく券で、さいころのすごろくがあそべます。${note}`;
  // 負けて おわった（戦いの あと）: さいごの けっか
  if (info.last && info.last.reason === 'lose') {
    for (const a of info.last.after || []) {
      await ct.say(a, { narr: true });
      await ct.tap(2400);
    }
    line = `おかえりなさい。おつかれさまでした！${note}`;
  }
  let out = null;
  while (!ct.closed && !out) {
    await ct.say(line);
    ct.info(helpBox([
      `宝の地図をクリアした数: ${t.clears}こ（${t.name || ''}）`,
      'すごろく券は、コイン100枚で1まい。小さなメダル1まいで2まい。',
      'さいころをふれる回数がなくなるか、ゴールしたらおしまい。手に入れた物は持って帰れる。',
    ]));
    const cmd = await ct.pick([
      { label: 'すごろくであそぶ', value: 'play' },
      { label: 'すごろく券を買う', value: 'buy' },
      { label: 'あそび方を聞く', value: 'help' },
      { label: 'やめる', value: 'exit' },
    ], { back: null });
    if (ct.closed || !cmd || cmd.value === 'exit') break;
    if (cmd.value === 'help') {
      await howTo(ct);
      line = 'ほかに何かご用はありますか？';
      continue;
    }
    if (cmd.value === 'buy') {
      await buyTickets(game, ct, info);
      line = 'ほかに何かご用はありますか？';
      continue;
    }
    // すごろくを 選ぶ
    await ct.say('どのすごろくであそびますか？');
    const tk = itemCount(game.me, TICKET_ITEM);
    const rows = (info.boards || []).map((b) => ({
      value: b.id, label: b.name, b,
      right: b.open ? `券${b.tickets}まい` : `地図あと${b.left}こ`, rightCls: !b.open || tk < b.tickets ? 'dis' : 'gold',
    }));
    const pick = await ct.pick(rows, { back: 'もどる', onMove: (x) => ct.info(x ? boardInfo(x.b) : null) });
    if (ct.closed) break;
    if (!pick) { line = 'ほかに何かご用はありますか？'; continue; }
    const b = pick.b;
    if (!b.open) {
      game.audio.sfx('buzz');
      await ct.say(`「${b.name}」は、宝の地図をあと${b.left}こクリアすると、あそべるようになります。\n宝探しのダイゴさんのところへ行ってみては？`);
      await ct.tap(2600);
      line = 'ほかに何かご用はありますか？';
      continue;
    }
    if (itemCount(game.me, TICKET_ITEM) < b.tickets) {
      game.audio.sfx('buzz');
      const yes = await ct.ask(`「${b.name}」には、すごろく券が${b.tickets}まいいります。\n（今${itemCount(game.me, TICKET_ITEM)}まい）すごろく券を買いますか？`);
      if (ct.closed) break;
      if (yes === 0) await buyTickets(game, ct, info);
      line = 'ほかに何かご用はありますか？';
      continue;
    }
    const yes = await ct.ask(`「${b.name}」ですね。\nすごろく券を${b.tickets}まい使います。よろしいですか？`);
    if (ct.closed) break;
    if (yes !== 0) { line = 'ほかに何かご用はありますか？'; continue; }
    const r = await sgReq(game, { action: 'sgStart', board: b.id });
    ct.updGold();
    if (!r.ok || !r.sg) {
      game.audio.sfx('buzz');
      await ct.say(r.text || 'おや？何かおかしいようですね。');
      await ct.tap(2000);
      line = 'ほかに何かご用はありますか？';
      continue;
    }
    game.audio.sfx('confirm');
    await ct.say('それでは、いってらっしゃいませ！\nよい目が出ますように！');
    await ct.tap(1200);
    out = r;
  }
  if (!ct.closed && !out) {
    ct.list(null);
    ct.info(null);
    await ct.say('またのおこしをお待ちしております。');
    await ct.tap(1200);
  }
  ct.close();
  return out;
}

function boardInfo(b) {
  const B = BOARD_BY_ID[b.id];
  const lines = [b.desc, `さいころ: ${b.rolls}回 ／ すごろく券: ${b.tickets}まい`, b.open ? `ゴールした回数: ${b.clears}回` : `宝の地図をあと${b.left}こクリアすると、あそべる`];
  if (B?.goal?.first && !b.clears && b.open) lines.push(`初めてゴールすると「${ITEMS[B.goal.first]?.name}」ももらえる！`);
  if (B?.bosses?.length) lines.push(`ボス: ${B.bosses.map((x) => x.name).join('・')}`);
  return helpBox(lines);
}

async function howTo(ct) {
  const lines = [
    'すごろくは、さいころをふって、自分のこまを進めるあそびです。\nゴールにつくと、大きな景品がもらえます！',
    'さいころをふれる回数には、かぎりがあります。\nなくなると、そこでおしまい。それまでに手に入れた物は持って帰れます。',
    'マスには、ゴールド・道具・宿屋・わな・前へ／後ろへ・？？？などがあります。\n？？？は、止まった時のおたのしみ！',
    '宝の地図をたくさんクリアすると、大きなすごろくがあらわれます。\n分かれ道・戦い・ワープ・スイッチ・ボス・宝部屋・お店…\n上のすごろくほど、しかけもいっぱい！',
    '戦いのマスでは、本当に魔物と戦います。\n負けるとすごろくは終わりですが、お金はへりません。',
  ];
  for (const l of lines) {
    await ct.say(l);
    await ct.tap(6000);
    if (ct.closed) return;
  }
}

async function buyTickets(game, ct, info) {
  const price = info.ticketCoins || 100;
  const per = info.medalTickets || 2;
  const how = await ct.pick([
    { label: `コインで買う（1まい ${price}枚）`, value: 'coins', right: `${fmt(coinsOf(game.me))}枚`, rightCls: coinsOf(game.me) < price ? 'dis' : 'gold' },
    { label: `小さなメダルとこうかん（1まいで${per}まい）`, value: 'medal', right: `${medalsHeld(game.me)}まい`, rightCls: medalsHeld(game.me) < 1 ? 'dis' : 'gold' },
  ], { back: 'もどる' });
  if (ct.closed || !how) return;
  const coins = coinsOf(game.me);
  const max = how.value === 'coins' ? Math.min(info.buyMax || 20, Math.floor(coins / price), 99 - itemCount(game.me, TICKET_ITEM))
    : Math.min(10, medalsHeld(game.me), Math.floor((99 - itemCount(game.me, TICKET_ITEM)) / per));
  if (max < 1) {
    game.audio.sfx('buzz');
    await ct.say(how.value === 'coins' ? `コインが足りないようです。\nすごろく券は1まい${price}枚です。` : '小さなメダルを持っていないようです。');
    await ct.tap(2200);
    return;
  }
  const n = how.value === 'coins'
    ? await ct.qty('何まい買いますか？', max, null, `1まいでコイン${price}枚`)
    : await ct.qty('小さなメダルを何まいこうかんしますか？', max, null, `メダル1まいで、すごろく券${per}まい`);
  if (!n || ct.closed) return;
  const r = await sgReq(game, { action: 'sgBuy', pay: how.value, n });
  ct.updGold();
  if (!r.ok) {
    game.audio.sfx('buzz');
    await ct.say(r.text || 'おや？何かおかしいようですね。');
    await ct.tap(2000);
    return;
  }
  game.audio.sfx('coin');
  await ct.say(r.text, { narr: true });
  await ct.tap(2000);
}

// ───────────── 盤 ─────────────
function boardScreen(game, info) {
  return new Promise((resolve) => {
    const B = BOARD_BY_ID[info.run.board];
    const sh = casinoShell(game, { title: B.name, cls: 'sugoroku-panel' });
    sh.setCoins(info.coins ?? coinsOf(game.me));
    let run = info.run;
    let busy = false;
    let closed = false;
    let picking = null; // 数を 選ぶ さいころ（'pick' | 'gold'）
    let summary = null;
    let msgDone = null;

    const cv = el('canvas', { class: 'sg-canvas' });
    const wrap = el('div', { class: 'sg-wrap' }, cv);
    const hud = el('div', { class: 'sg-hud' });
    const msgText = el('div', { class: 'sg-msgtext' });
    const msgMore = el('div', { class: 'ct-more sg-more', text: '▼' });
    const msg = el('div', { class: 'cs-msg sg-msg', onclick: () => msgDone?.() }, msgText, msgMore);
    const extra = el('div', { class: 'sg-extra' });
    const controls = el('div', { class: 'cs-controls sg-controls' });
    const side = el('div', { class: 'win sg-side' }, hud, msg, extra, controls);
    sh.body.classList.add('sg-body');
    sh.body.append(el('div', { class: 'win sg-boardbox' }, wrap), side);
    const me = game.me;
    const eq = shownEquip(me);
    const view = new SgBoardView(cv, B, { sprite: (dir, f) => playerSprite(me.look, me.job, dir, f, eq) });
    view.setRun(run, { snap: true });

    // 盤を タップ: 光っている マス（分かれ道・竜の背）を 選ぶ・ほかの マスは 説明
    cv.addEventListener('click', (e) => {
      const r = cv.getBoundingClientRect();
      const s = view.squareAt(e.clientX - r.left, e.clientY - r.top);
      if (!s || busy) return;
      const k = view.hl.indexOf(s.i);
      if (k >= 0 && run?.pending) return choose(k);
      if (!msgDone) setMsg(`${SQ_NAME[s.t]}のマス: ${squareText(B, s)}`);
    });

    const setMsg = (t) => { msgText.textContent = t; msgMore.hidden = true; };
    // ことば（A・B・タップで すすむ。ms で じどう）
    const say = (t, ms = 2600) => new Promise((res) => {
      msgText.textContent = t;
      msgMore.hidden = false;
      let timer = null;
      const done = () => {
        if (msgDone !== done) return;
        clearTimeout(timer);
        msgDone = null;
        msgMore.hidden = true;
        res();
      };
      msgDone = done;
      timer = setTimeout(done, ms);
    });

    const renderHud = () => {
      hud.innerHTML = '';
      if (!run) return;
      const items = [
        el('span', { class: 'sg-chip' }, el('img', { src: dieURL(5), alt: '' }), `のこり ${run.rolls}回`),
        el('span', { class: 'sg-chip gold', text: `+${fmt(run.gold)}G` }),
      ];
      if (B.stars.length) items.push(el('span', { class: 'sg-chip star', text: `★ ${run.stars.length}/${B.stars.length}` }));
      if (B.sq.some((s) => s.t === 'switch')) items.push(el('span', { class: 'sg-chip', text: `スイッチ ${run.sw ? 'ON' : 'OFF'}` }));
      const got = run.got.reduce((a, [, n]) => a + n, 0);
      if (got) items.push(el('span', { class: 'sg-chip', text: `手に入れた物 ${got}こ` }));
      if (run.coins) items.push(el('span', { class: 'sg-chip', text: `コイン+${fmt(run.coins)}` }));
      hud.append(...items);
    };

    const btn = (text, act, cls = '', disabled = false) => el('button', { class: `btn ${cls}`, text, disabled, onclick: () => { if (!busy) act(); } });

    const renderControls = () => {
      controls.innerHTML = '';
      extra.innerHTML = '';
      view.hl = [];
      const add = (...b) => controls.append(...b);
      if (summary) {
        add(btn('受付にもどる', () => finish('desk'), 'primary cs-big'));
        refreshNav();
        return;
      }
      if (!run) return;
      const p = run.pending;
      if (!p) {
        if (picking) {
          const max = picking === 'gold' ? 12 : 6;
          setMsg(`${DICE[picking].name}！\n進みたい数を選んでね。`);
          for (let n = 1; n <= max; n++) add(btn(String(n), () => roll(picking, n), 'sg-num'));
          add(btn('もどる', () => { picking = null; renderControls(); }, 'sg-small'));
        } else {
          add(btn('さいころをふる', () => roll('normal'), 'primary cs-big sg-roll'));
          for (const d of ['double', 'pick', 'gold']) {
            const n = run.dice?.[d] || 0;
            if (!n) continue;
            const b = el('button', { class: `btn sg-die ${d}`, onclick: () => { if (busy) return; if (d === 'double') roll('double'); else { picking = d; renderControls(); } } },
              el('img', { src: dieURL(d === 'double' ? 2 : d === 'gold' ? 6 : 3, d === 'gold'), alt: '' }), `${DICE[d].name} ×${n}`);
            add(b);
          }
          add(btn(view.mode === 'all' ? 'こまを見る' : 'ぜんたいを見る', () => { view.mode = view.mode === 'all' ? 'follow' : 'all'; renderControls(); }, 'sg-small'));
          add(btn('やめる', () => quit(), 'sg-small'));
        }
      } else if (p.kind === 'branch' || p.kind === 'dragon') {
        view.hl = p.options.slice();
        p.options.forEach((to, k) => {
          const s = B.sq[to];
          const lab = `${k + 1}. ${p.kind === 'branch' ? DIR(B, p.at, to) : '竜で'} ${SQ_NAME[s.t]}${p.kind === 'branch' ? 'の道' : 'のマスへ'}`;
          add(btn(lab, () => choose(k), 'sg-opt'));
        });
      } else if (p.kind === 'vault') {
        for (let k = 0; k < (p.n || 3); k++) add(el('button', { class: 'btn sg-box', onclick: () => { if (!busy) pickBox(k); } }, el('span', { class: 'sg-boxart', text: '宝' }), `宝箱${k + 1}`));
      } else if (p.kind === 'shop') {
        p.items.forEach((it, k) => {
          const ok = (game.me.gold || 0) >= it.price;
          const b = btn(`${ITEMS[it.id]?.name || it.id} ${fmt(it.price)}G`, () => buy(k), `sg-opt ${ok ? '' : 'dis'}`);
          b.addEventListener('focus', () => showItem(it.id));
          b.addEventListener('mouseenter', () => showItem(it.id));
          add(b);
        });
        add(btn('買わない', () => buy(-1), 'sg-small'));
        extra.append(el('div', { class: 'small muted', text: `所持金 ${fmt(game.me.gold)}G` }));
      } else if (p.kind === 'battle') {
        const box = el('div', { class: 'sg-mons' });
        for (const sp of p.mons || []) {
          const c = monsterCanvas(sp, 0, 40);
          if (c) { const img = el('img', { class: 'sg-mon', alt: MONSTERS[sp]?.name || '' }); img.src = c.toDataURL(); box.append(img); }
        }
        extra.append(box);
        add(btn(p.boss !== null && p.boss !== undefined ? 'ボスと戦う！' : '戦う！', () => fight(), 'primary cs-big'));
      }
      refreshNav();
    };

    const showItem = (id) => {
      extra.innerHTML = '';
      const node = itemInfo(game, id);
      if (node) extra.append(node);
    };

    const sfx = (name) => {
      if (!name) return;
      if (name === 'jackpot' || name === 'fanfare') game.audio.play('jackpot');
      else if (name === 'warp') game.audio.sfx('sparkle');
      else game.audio.sfx(name);
    };

    // サーバーの できごとを じゅんに 見せる
    const playOps = async (ops = []) => {
      for (const op of ops) {
        if (closed) return;
        switch (op.op) {
          case 'dice':
            game.audio.sfx('reel');
            await view.rollDice(op.dice, op.die === 'gold' ? 12 : 6);
            game.audio.sfx('confirm');
            setMsg(op.dice.length > 1 ? `${op.dice.join('と')}で${op.total}！` : `${op.total}が出た！`);
            await wait(250);
            view.hideDice();
            break;
          case 'move':
            await view.moveAlong(op.path, () => game.audio.sfx('cursor'));
            break;
          case 'jump':
            game.audio.sfx('sparkle');
            await view.jumpTo(op.to);
            break;
          case 'switch':
            if (run) run.sw = op.sw;
            break;
          case 'slot':
            await showSlot(op.reels);
            break;
          case 'vault':
            showVault(op);
            break;
          case 'say':
            sfx(op.sfx);
            await say(op.text);
            break;
          case 'over':
            summary = op;
            break;
          default:
        }
      }
    };

    const showSlot = async (reels) => {
      extra.innerHTML = '';
      const syms = ['seven', 'bar', 'star', 'bell', 'cherry'];
      const imgs = reels.map(() => el('img', { class: 'sg-slotsym', alt: '' }));
      extra.append(el('div', { class: 'sg-slot' }, ...imgs));
      for (let k = 0; k < 3; k++) {
        const t0 = performance.now();
        while (performance.now() - t0 < 380) {
          for (let j = k; j < 3; j++) imgs[j].src = symbolURL(syms[Math.floor(Math.random() * syms.length)]);
          await wait(60);
        }
        imgs[k].src = symbolURL(reels[k]);
        game.audio.sfx('reel');
      }
      await wait(300);
    };

    const showVault = (op) => {
      extra.innerHTML = '';
      const box = el('div', { class: 'sg-vault' });
      op.boxes.forEach((name, k) => box.append(el('div', { class: `sg-vbox ${k === op.picked ? 'on' : ''}` }, el('span', { class: 'sg-boxart', text: '宝' }), el('span', { text: name }))));
      extra.append(box);
    };

    // へんじを うけとって 見せる
    const apply = async (r) => {
      if (!r.ok) {
        game.audio.sfx('buzz');
        if (r.text) await say(r.text, 2200);
        if ('sg' in r) run = r.sg;
        return;
      }
      await playOps(r.ops);
      if (closed) return;
      run = r.sg ?? null;
      view.setRun(run, { snap: true });
      sh.setCoins(r.coins ?? coinsOf(game.me));
      if (!run && summary) showSummary();
    };

    const act = async (msgObj) => {
      if (busy || closed) return;
      busy = true;
      sh.lock(true);
      controls.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      const r = await sgReq(game, msgObj);
      if (closed) return;
      await apply(r);
      busy = false;
      sh.lock(false);
      renderHud();
      renderControls();
      if (run?.pending) promptPending();
      else if (run && !summary) setMsg(`のこり${run.rolls}回。\nさいころをふろう！`);
    };

    const promptPending = () => {
      const p = run.pending;
      if (p.kind === 'branch') setMsg('分かれ道だ！\nどちらへ進む？（光っているマスをタップしてもよい）');
      else if (p.kind === 'dragon') setMsg('竜の背！\nどこへ連れていってもらう？');
      else if (p.kind === 'vault') setMsg('宝部屋！\n3つの宝箱から、1つだけ選んで開けよう。');
      else if (p.kind === 'shop') setMsg('お店のマス！\nすごろくの中だけの品。ゴールドで買える。');
      else if (p.kind === 'battle') setMsg(p.name ? `${p.name}が立ちはだかる！` : `${(p.mons || []).map((sp) => MONSTERS[sp]?.name).filter(Boolean).join('と')}があらわれた！`);
    };

    const roll = (die, n) => {
      picking = null;
      return act({ action: 'sgRoll', die, ...(n ? { n } : {}) });
    };
    const choose = (i) => act({ action: 'sgChoose', i });
    const pickBox = (i) => act({ action: 'sgPick', i });
    const buy = (i) => act({ action: 'sgShop', i });
    const quit = async () => {
      if (busy) return;
      controls.innerHTML = '';
      setMsg('すごろくをやめますか？\n（今までに手に入れた物は持って帰れる。すごろく券はもどらない）');
      controls.append(btn('やめる', () => act({ action: 'sgQuit' }), 'sg-opt'), btn('つづける', () => { renderControls(); setMsg('さいころをふろう！'); }, 'primary'));
      refreshNav();
    };
    const fight = async () => {
      if (busy) return;
      busy = true;
      const r = await sgReq(game, { action: 'sgFight' });
      busy = false;
      if (!r.ok) { renderControls(); return; }
      game.audio.sfx('encounter');
      finish('fight');
    };

    const showSummary = () => {
      const s = summary;
      extra.innerHTML = '';
      const L = [];
      const why = { goal: 'ゴール！', rolls: 'さいころがなくなった', lose: '力つきた', quit: 'とちゅうでやめた' }[s.reason] || '';
      L.push(el('div', { class: 'gold sg-sumhead', text: `けっか: ${why}` }));
      L.push(el('div', { text: `ゴールド +${fmt(s.gold)}G${s.coins ? `／コイン +${fmt(s.coins)}枚` : ''}` }));
      for (const [id, n] of s.got || []) L.push(el('div', { class: s.prizes?.includes(id) ? 'gold' : '', text: `${ITEMS[id]?.name || id}${n > 1 ? ` ×${n}` : ''}` }));
      extra.append(el('div', { class: 'sg-sum scroll' }, ...L));
      setMsg(s.reason === 'goal' ? 'おめでとう！\n景品はふくろに入れておいたよ。' : 'おつかれさま！\n手に入れた物は、ふくろに入っているよ。');
      renderHud();
      renderControls();
    };

    // ───── キー・パッド ─────
    let nav = null;
    const refreshNav = () => {
      if (!nav) return;
      nav.refresh();
    };
    nav = padNav(sh.root, { onB: () => close(), sound: (x) => game.audio.sfx(x) });
    const h = {
      el: sh.root,
      onNav: (a) => {
        if (msgDone && (a === 'a' || a === 'b')) { msgDone(); return; }
        if (busy) return;
        nav.onNav(a);
      },
    };
    game.input.push(h);

    const finish = (why) => {
      if (closed) return;
      closed = true;
      view.destroy();
      game.input.pop(h);
      sh.remove();
      resolve(why);
    };
    const close = () => {
      if (busy || closed) return;
      game.audio.sfx('cancel');
      finish(summary ? 'desk' : 'close');
    };
    sh.onClose = close;

    // はじめ（つづきから・戦いの あと）
    (async () => {
      busy = true;
      sh.lock(true);
      renderHud();
      const after = info.after || [];
      const startOps = info.startOps || [];
      info.startOps = null;
      if (startOps.length) await playOps(startOps);
      else if (!after.length) await say(run.turn ? `${B.name}の続きから！\nのこり${run.rolls}回。` : `${B.name}、スタート！`, 1600);
      for (const a of after) await say(a);
      busy = false;
      sh.lock(false);
      renderHud();
      renderControls();
      if (run?.pending) promptPending();
      else setMsg(`のこり${run.rolls}回。\nさいころをふろう！`);
    })();
  });
}

// ───────────── 見た目 ─────────────
let styled = false;
function ensureSgStyle() {
  if (styled || typeof document === 'undefined') return;
  styled = true;
  const st = document.createElement('style');
  st.id = 'sugoroku-style';
  st.textContent = `
.cs-body.sg-body { grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); }
.sg-boardbox { padding: 4px; min-height: 0; display: flex; }
.sg-wrap { position: relative; flex: 1 1 auto; min-height: 0; min-width: 0; overflow: hidden; border-radius: 4px; }
.sg-canvas { position: absolute; left: 0; top: 0; display: block; touch-action: manipulation; }
.sg-side { display: flex; flex-direction: column; gap: 0.4em; min-height: 0; overflow-y: auto; }
.sg-hud { display: flex; flex-wrap: wrap; gap: 0.3em; }
.sg-chip { display: inline-flex; align-items: center; gap: 0.25em; padding: 0.1em 0.45em; border-radius: 1em; background: rgba(255,255,255,0.1); font-size: var(--fs-small); white-space: nowrap; }
.sg-chip img { width: 1.2em; height: 1.2em; }
.sg-chip.gold { color: var(--accent); }
.sg-chip.star { color: #ffe84a; }
.sg-msg { position: relative; text-align: left; min-height: 4.4em; padding: 0.3em 0.5em; background: rgba(0,0,0,0.25); border-radius: 4px; cursor: pointer; }
.sg-msgtext { white-space: pre-line; line-height: 1.45; }
.sg-more { position: absolute; right: 0.4em; bottom: 0.1em; }
.sg-controls { justify-content: flex-start; }
.sg-controls .btn { min-height: 44px; }
.sg-roll { min-width: 8em; }
.sg-die { display: inline-flex; align-items: center; gap: 0.3em; font-size: var(--fs-small); }
.sg-die img { width: 1.5em; height: 1.5em; }
.sg-die.gold { border-color: #ffd84a; color: #ffe89a; }
.sg-num { min-width: 2.8em; }
.sg-opt { flex: 1 1 100%; text-align: left; }
.sg-opt.dis { opacity: 0.6; }
.sg-small { font-size: var(--fs-small); }
.sg-box { display: inline-flex; flex-direction: column; align-items: center; min-width: 5em; }
.sg-boxart { display: inline-block; width: 1.9em; height: 1.6em; line-height: 1.6em; text-align: center; background: #9a6020; border: 2px solid #ffd84a; border-radius: 4px; color: #fff; }
.sg-vault { display: flex; gap: 0.4em; justify-content: center; }
.sg-vbox { display: flex; flex-direction: column; align-items: center; gap: 0.2em; font-size: var(--fs-small); opacity: 0.6; text-align: center; max-width: 6em; }
.sg-vbox.on { opacity: 1; color: var(--accent); }
.sg-slot { display: flex; gap: 0.4em; justify-content: center; }
.sg-slotsym { width: 48px; height: 48px; image-rendering: pixelated; background: #f4f2fa; border-radius: 4px; }
.sg-mons { display: flex; gap: 0.4em; justify-content: center; flex-wrap: wrap; }
.sg-mon { height: 56px; image-rendering: pixelated; }
.sg-sum { max-height: 30vh; overflow-y: auto; font-size: var(--fs-small); line-height: 1.5; }
.sg-sumhead { font-size: 1.05em; }
.sg-tk { color: #ffe89a; }
.sugoroku-panel .btn.pad-focus { outline: 3px solid #fff; outline-offset: 1px; }
@media (max-aspect-ratio: 1/1) {
  .cs-body.sg-body { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; }
  .sg-side { max-height: 46vh; }
  .sugoroku-panel { height: calc(100% - 12px - 2vh - var(--safe-t) - var(--safe-b)); }
  .sg-msg { min-height: 3.3em; font-size: 0.92em; }
  .sg-controls .btn { min-height: 42px; }
}
@media (max-height: 520px) and (orientation: landscape) {
  .cs-body.sg-body { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); }
  .sg-msg { min-height: 3.1em; font-size: 0.85em; }
  .sg-controls .btn { min-height: 36px; }
  .sg-roll.cs-big { min-height: 40px; }
  .sg-hud { gap: 0.2em; }
  .sg-chip { font-size: 0.75em; }
}
`;
  document.head.append(st);
}
