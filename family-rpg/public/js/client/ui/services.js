// お店・転職・酒場・でんごんばん・ほしのかけら・きょうかい の がめん
import { el, ListMenu, toast, askText, confirmBox, esc } from './dom.js';
import { ITEMS, sellPrice } from '../../shared/data/items.js';
import { JOBS, JOB_ORDER } from '../../shared/data/jobs.js';
import { ABILITIES } from '../../shared/data/abilities.js';
import { canEquip, itemCount, learnedAbilities } from '../../shared/stats.js';
import { MONSTERS } from '../../shared/data/monsters.js';
import { TACTICS } from '../../shared/ai.js';
import { itemDetail, equipDiff, diffText } from './info.js';
import { playerSprite, followerSprite, faceURL } from '../field.js';

export function openServiceUI(game, kind, data) {
  switch (kind) {
    case 'shop': return shopUI(game, data);
    case 'jobChange': return jobUI(game);
    case 'tavern': return tavernUI(game, data);
    case 'board': return boardUI(game, data);
    case 'starTrade': return starUI(game, data);
    case 'church': return churchUI(game, data);
    default: return Promise.resolve();
  }
}

// サーバーの へんじを まつ
function request(game, msg) {
  return new Promise((resolve) => {
    game.svcWaiter = resolve;
    game.net.send({ t: 'svc', ...msg });
    setTimeout(() => {
      if (game.svcWaiter === resolve) {
        game.svcWaiter = null;
        resolve({ ok: false, text: 'つうしんが おくれています' });
      }
    }, 6000);
  });
}

// お店などの まど。みぎうえの「✕ とじる」と そとの タップで とじる（s.onClose を よぶ）
function shell(title, extraCls = '') {
  const backdrop = el('div', { class: 'modal-back' });
  const root = el('div', { class: `panel center-panel svc-panel ${extraCls}` });
  const right = el('span', { class: 'svc-right' });
  const s = { root, right, onClose: null };
  const userClose = () => {
    if (!s.onClose) return;
    s.game?.audio.sfx('cancel');
    s.onClose();
  };
  const closeBtn = el('button', { class: 'btn closebtn', text: '✕ とじる', 'aria-label': 'とじる', onclick: userClose });
  const head = el('div', { class: 'win svc-head' }, el('span', { class: 'gold', text: title }), right, closeBtn);
  const body = el('div', { class: 'fmenu' });
  root.append(head, body);
  backdrop.addEventListener('click', userClose);
  document.getElementById('ui').append(backdrop, root);
  // s.root.remove() で うしろの まくも いっしょに けす
  const removeRoot = root.remove.bind(root);
  root.remove = () => {
    backdrop.remove();
    removeRoot();
  };
  return Object.assign(s, { head, body });
}

function goldText(game) {
  return `${game.me.gold} G`;
}

// ───────────── お店 ─────────────
function shopUI(game, data) {
  return new Promise((resolve) => {
    const s = shell(data.name);
    s.game = game;
    const side = el('div', { class: 'win side' });
    const main = el('div', { class: 'win main scroll' });
    const detail = el('div', { class: 'detail' });
    s.body.append(side, main);
    const updGold = () => { s.right.textContent = goldText(game); };
    updGold();
    const modeMenu = new ListMenu(game.input, {
      items: [{ label: 'かう', value: 'buy' }, { label: 'うる', value: 'sell' }, { label: 'やめる', value: 'exit' }],
      back: null,
      sound: (x) => game.audio.sfx(x),
      onSelect: (it) => {
        if (it.value === 'exit') return close();
        if (it.value === 'buy') showBuy();
        else showSell();
      },
      onCancel: () => close(),
    });
    side.append(modeMenu.root);
    modeMenu.focus();
    let list = null;
    const close = () => {
      list?.blur();
      modeMenu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    const back = () => {
      list?.blur();
      list = null;
      main.innerHTML = '';
      modeMenu.focus();
    };
    const showBuy = () => {
      modeMenu.blur();
      main.innerHTML = '';
      const items = data.items.map((id) => {
        const it = ITEMS[id];
        const eq = ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type);
        const mine = eq && !canEquip(game.me.job, id);
        return { label: it.name + (mine ? '' : ''), right: `${it.price}G`, value: id, cls: mine ? '' : '', html: `${it.name}${eq && !canEquip(game.me.job, id) ? '<span class="tag muted">そうびできない</span>' : ''}` };
      });
      list = new ListMenu(game.input, {
        items,
        sound: (x) => game.audio.sfx(x),
        onMove: (it) => {
          if (!it) return;
          const d = ITEMS[it.value];
          let text = itemDetail(it.value);
          if (['weapon', 'armor', 'shield', 'head', 'acc'].includes(d.type) && canEquip(game.me.job, it.value)) {
            text += `\nいまの そうびと くらべると: ${diffText(equipDiff(game.me, it.value))}`;
          }
          text += `\nもっている かず: ${itemCount(game.me, it.value)}`;
          detail.textContent = text;
        },
        onSelect: async (it) => {
          const d = ITEMS[it.value];
          list.blur();
          let qty = 1;
          const eq = ['weapon', 'armor', 'shield', 'head', 'acc'].includes(d.type);
          if (!eq) {
            qty = await pickQty(game, `${d.name}を いくつ かう？`, Math.min(99, Math.floor(game.me.gold / d.price)), d.price);
            if (!qty) return list.focus();
          }
          let equip = false;
          if (eq && canEquip(game.me.job, it.value)) {
            equip = await confirmBox(game.input, `${d.name}を ${d.price}ゴールドで かって\nすぐに そうびしますか？`, 'かって そうびする', 'かうだけ', (x) => game.audio.sfx(x));
          } else if (!(await confirmBox(game.input, `${d.name}を ${qty > 1 ? qty + 'こ ' : ''}${d.price * qty}ゴールドで かいますか？`, 'はい', 'いいえ', (x) => game.audio.sfx(x)))) {
            return list.focus();
          }
          const r = await request(game, { kind: 'shop', action: 'buy', id: it.value, qty, equip });
          if (r.ok) game.audio.sfx('item');
          toast(r.text || (r.ok ? 'まいど！' : 'かえませんでした'));
          updGold();
          list.focus();
        },
        onCancel: back,
      });
      main.append(list.root, detail);
      list.focus();
    };
    const showSell = () => {
      modeMenu.blur();
      const build = () => {
        main.innerHTML = '';
        const items = game.me.items.filter((e) => ITEMS[e.id] && ITEMS[e.id].type !== 'key').map((e) => ({ label: `${ITEMS[e.id].name} ×${e.n}`, right: `${sellPrice(e.id)}G`, value: e.id, disabled: sellPrice(e.id) <= 0 }));
        if (!items.length) {
          main.append(el('div', { class: 'muted', text: 'うれる ものを もっていない。' }));
          setTimeout(back, 900);
          return;
        }
        list = new ListMenu(game.input, {
          items,
          sound: (x) => game.audio.sfx(x),
          onMove: (it) => { detail.textContent = it ? itemDetail(it.value) : ''; },
          onSelect: async (it) => {
            list.blur();
            const have = itemCount(game.me, it.value);
            const qty = have > 1 ? await pickQty(game, `${ITEMS[it.value].name}を いくつ うる？`, have, sellPrice(it.value)) : 1;
            if (!qty) return list.focus();
            const r = await request(game, { kind: 'shop', action: 'sell', id: it.value, qty });
            if (r.ok) game.audio.sfx('item');
            toast(r.text || '');
            updGold();
            list.blur();
            build();
          },
          onCancel: back,
        });
        main.append(list.root, detail);
        list.focus();
      };
      build();
    };
  });
}

function pickQty(game, title, max, price) {
  return new Promise((resolve) => {
    if (max <= 0) {
      toast('ゴールドが たりないよ');
      resolve(0);
      return;
    }
    let q = 1;
    const box = el('div', { class: 'win panel center-panel', style: { width: 'min(90vw, 420px)', textAlign: 'center' } });
    const val = el('div', { style: { fontSize: '1.4em', margin: '0.3em 0' } });
    const upd = () => { val.textContent = `◀ ${q}こ ▶　${price * q}G`; };
    const minus = el('button', { class: 'btn', text: '－', onclick: () => { q = Math.max(1, q - 1); upd(); } });
    const plus = el('button', { class: 'btn', text: '＋', onclick: () => { q = Math.min(max, q + 1); upd(); } });
    const ok = el('button', { class: 'btn primary', text: 'けってい', onclick: () => done(q) });
    const no = el('button', { class: 'btn', text: 'やめる', onclick: () => done(0) });
    box.append(el('div', { text: title }), val, el('div', { class: 'row', style: { justifyContent: 'center' } }, minus, plus, no, ok));
    const h = {
      onNav: (a) => {
        if (a === 'left' || a === 'down') q = Math.max(1, q - 1);
        if (a === 'right' || a === 'up') q = Math.min(max, q + 1);
        if (a === 'a') return done(q);
        if (a === 'b') return done(0);
        game.audio.sfx('cursor');
        upd();
      },
    };
    const done = (v) => {
      game.input.pop(h);
      box.remove();
      resolve(v);
    };
    upd();
    game.input.push(h);
    document.getElementById('ui').append(box);
  });
}

// ───────────── 転職 ─────────────
function jobUI(game) {
  return new Promise((resolve) => {
    const s = shell('星の神殿 ― 転職');
    s.game = game;
    const side = el('div', { class: 'win side' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    // だれが 転職する？（じぶん と 酒場の なかま。モンスターは 転職できない）
    let who = 'self';
    const mates = () => (game.party?.supports || []).filter((x) => x.kind === 'npc' && x.owner === game.me.id);
    const target = () => {
      if (who === 'self') return { name: game.me.name, job: game.me.job, jobs: game.me.jobs, look: game.me.look, equip: game.me.equip };
      return mates().find((x) => x.key === who) || null;
    };
    const whoRow = el('div', { class: 'who-list' });
    const renderWho = () => {
      whoRow.innerHTML = '';
      const list = [{ key: 'self', name: game.me.name }, ...mates()];
      if (list.length < 2) return;
      for (const m of list) {
        whoRow.append(el('button', {
          class: `btn ${who === m.key ? 'sel' : ''}`, text: m.name,
          onclick: () => { who = m.key; renderWho(); menu.setItems(render()); showJob(menu.current?.value || target().job); },
        }));
      }
    };
    const render = () => {
      if (!target()) who = 'self';
      const c = target();
      s.right.textContent = `${c.name}: ${JOBS[c.job]?.name || ''}`;
      return JOB_ORDER.map((j) => ({
        label: JOBS[j].name,
        right: c.jobs?.[j] ? `Lv${c.jobs[j].lv}` : 'はじめて',
        value: j,
        cls: j === c.job ? 'good' : '',
      }));
    };
    const menu = new ListMenu(game.input, {
      items: render(),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => showJob(it.value),
      onSelect: async (it) => {
        const c = target();
        if (!c) return;
        if (it.value === c.job) {
          toast('いまの しょくぎょうです');
          return;
        }
        menu.blur();
        const ok = await confirmBox(game.input, `${who === 'self' ? '' : c.name + 'を '}${JOBS[it.value].name}に 転職${who === 'self' ? 'しますか' : 'させますか'}？\n（いまの しょくぎょうの レベルは のこります）`, 'はい', 'いいえ', (x) => game.audio.sfx(x));
        if (ok) {
          const r = await request(game, { kind: 'jobChange', job: it.value, who });
          if (r.ok) {
            game.audio.sfx('join');
            if (who === 'self') game.field.flashLocal?.();
          }
          toast(r.text || '');
          // なかまの じょうほうが とどくのを すこし まつ
          setTimeout(() => { menu.setItems(render()); showJob(it.value); }, 150);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    const showJob = (j) => {
      const job = JOBS[j];
      const c = target();
      if (!job || !c) return;
      const lv = c.jobs?.[j]?.lv || 0;
      main.innerHTML = '';
      main.append(whoRow);
      renderWho();
      const pv = playerSprite(c.look, j, 'down', 0, c.equip);
      const img = el('canvas', { width: pv.width, height: pv.height, style: { width: '48px', height: '63px', imageRendering: 'pixelated', float: 'right' } });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: `${job.name}（${job.kana}）` }), el('div', { class: 'detail', text: job.desc }));
      const bars = el('div', { class: 'statbars', style: { margin: '0.5em 0' } });
      for (const [k, n] of [['hp', 'HP'], ['mp', 'MP'], ['str', 'ちから'], ['def', 'みのまもり'], ['agi', 'すばやさ'], ['mag', 'まりょく'], ['heal', 'かいふく']]) {
        const v = job.mods[k];
        bars.append(el('span', { text: n }), el('div', { class: 'b' }, el('i', { style: { width: `${Math.min(100, v / 1.5 * 100)}%` } })), el('span', { class: v > 1 ? 'up' : v < 1 ? 'down' : '', text: `${Math.round(v * 100)}%` }));
      }
      main.append(bars);
      const learn = el('div', { class: 'small' });
      learn.append(el('div', { class: 'gold', text: 'おぼえる わざ（しょくぎょうレベル）' }));
      for (const [l, id] of job.learn) {
        const a = ABILITIES[id];
        learn.append(el('div', { class: lv >= l ? 'good' : 'muted', text: `Lv${l}　${a.name}${lv >= l ? '（おぼえた）' : ''}` }));
      }
      main.append(learn);
      main.append(el('div', { class: 'detail', text: 'ほかの しょくぎょうで おぼえた わざも つかえるが、MPが ふえたり いりょくが さがる ことが ある。（旅芸人は きようなので ペナルティが かるい）\n酒場の なかまも ここで 転職できるよ。' }));
    };
    menu.focus();
  });
}

// ───────────── 酒場 ─────────────
// いっしょに いる なかま / 酒場で まつ なかま / あたらしい なかま / かぞくの キャラ
function tavernUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('なかまの 酒場', 'tavern-panel');
    s.game = game;
    const side = el('div', { class: 'win side scroll tavern-list' });
    const main = el('div', { class: 'win main scroll' });
    s.body.append(side, main);
    let info = data;
    const sfx = (x) => game.audio.sfx(x);
    const face = (e) => faceURL({ look: e.look, job: e.job, eq: e.equip, mon: e.species || undefined });
    const who = (e) => (e.species ? `${MONSTERS[e.species]?.name || ''} Lv${e.level}` : `${JOBS[e.job]?.name || ''} Lv${e.level}`);
    const byKey = () => {
      const m = new Map();
      for (const e of info.roster) m.set(e.key, { ...e, sec: 'roster' });
      for (const e of info.family) m.set(e.key, { ...e, sec: 'family' });
      for (const e of info.recruits) m.set(e.key, { ...e, sec: 'recruit' });
      return m;
    };
    let entries = byKey();
    const partyKeys = () => [...entries.values()].filter((e) => e.inParty).map((e) => e.key);
    const items = () => {
      const out = [];
      const inParty = [...entries.values()].filter((e) => e.inParty);
      out.push({ header: true, label: `いっしょに いる なかま（${inParty.length}/${info.slots}）` });
      if (!inParty.length) out.push({ label: '（まだ だれも いない）', value: null, disabled: true });
      for (const e of inParty) {
        out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span>${e.family ? '<span class="tag gold">かぞく</span>' : ''}${e.inParty && !e.active ? '<span class="tag muted">いまは まつ</span>' : ''}`, value: e.key });
      }
      const waiting = info.roster.filter((e) => !e.inParty);
      if (waiting.length) {
        out.push({ header: true, label: `酒場で まっている なかま（${waiting.length}）` });
        for (const e of waiting) out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span>${e.hp <= 0 ? '<span class="tag warn">やすんでいる</span>' : ''}`, value: e.key });
      }
      if (info.recruits.length) {
        out.push({ header: true, label: 'あたらしい なかまを さがす' });
        for (const e of info.recruits) out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span><span class="tag good">NEW</span>`, value: e.key });
      }
      const fam = info.family.filter((e) => !e.inParty);
      if (fam.length) {
        out.push({ header: true, label: 'かぞくの キャラクター（サポート）' });
        for (const e of fam) out.push({ face: face(e), html: `${esc(e.name)} <span class="muted small">${who(e)}</span>`, value: e.key });
      }
      return out;
    };
    const partyText = () => {
      const n = Math.min(4, (info.humans || 1) + info.used);
      return `パーティー ${n}/4人${info.isLeader ? '' : '（リーダーの なかまが ついてくる）'}`;
    };
    const show = (key) => {
      main.innerHTML = '';
      const e = entries.get(key);
      if (!e) {
        main.append(el('div', { class: 'detail', text: 'なかまを つれていくと いっしょに たたかって くれるよ。\nつれていけるのは 3人まで。まっている なかまとは いつでも いれかえられる。\nモンスターの なかまも ここで まっているよ。' }));
        return;
      }
      const pv = e.species ? followerSprite({ mon: e.species }, 'down', 0) : playerSprite(e.look, e.job, 'down', 0, e.equip);
      const img = el('canvas', { width: pv.width, height: pv.height, class: 'tv-face' });
      img.getContext('2d').drawImage(pv, 0, 0);
      main.append(img, el('h3', { text: e.name }), el('div', { class: 'small gold', text: e.sec === 'recruit' ? `${who(e)}（なかまに なると この レベル）` : who(e) }));
      if (e.maxHp) main.append(el('div', { class: 'small', text: `HP ${Math.max(0, e.hp)}/${e.maxHp}　MP ${e.mp}/${e.maxMp}${e.tactics ? `　さくせん: ${TACTICS[e.tactics]?.name || ''}` : ''}` }));
      if (e.sec === 'roster' && e.species) {
        const learned = learnedAbilities({ species: e.species, level: e.level });
        main.append(el('div', { class: 'small', text: `わざ: ${learned.map((id) => ABILITIES[id]?.name).filter(Boolean).join('・') || 'なし'}` }));
      }
      main.append(el('div', { class: 'detail', text: e.desc || '' }));
      if (e.sec === 'roster' && e.inParty && !e.active) main.append(el('div', { class: 'detail', text: 'いまは パーティーの にんずうが いっぱいなので まっている。' }));
    };
    const menu = new ListMenu(game.input, {
      items: items(),
      sound: sfx,
      onMove: (it) => show(it?.value),
      onSelect: (it) => act(it.value),
      back: null,
      onCancel: () => close(),
    });
    const refresh = (r) => {
      if (r?.tavern) {
        info = r.tavern;
        entries = byKey();
      }
      menu.setItems(items());
      s.right.textContent = partyText();
      show(menu.current?.value);
    };
    const ask = (title, opts) => choose(game, title, opts);
    const doReq = async (msg) => {
      const r = await request(game, { kind: 'tavern', ...msg });
      toast(r.text || '');
      if (r.ok) sfx(msg.action === 'wait' || msg.action === 'release' ? 'leave' : 'join');
      refresh(r);
      return r;
    };
    // いっぱいの ときは だれと いれかわるか えらぶ
    const pickSwap = async (name) => {
      const cur = partyKeys().map((k) => entries.get(k)).filter(Boolean);
      return ask(`パーティーが いっぱい！\n${name}と いれかわりに だれが 酒場で まつ？`, [
        ...cur.map((e) => ({ face: face(e), label: `${e.name}（${who(e)}）`, value: e.key })),
        { label: 'やめる', value: null },
      ]);
    };
    const act = async (key) => {
      const e = entries.get(key);
      if (!e) return;
      menu.blur();
      const full = partyKeys().length >= info.slots;
      if (e.sec === 'recruit') {
        const a = await ask(`${e.name}（${who(e)}）を なかまに する？`, [
          { label: full ? 'なかまに して いれかわる' : 'なかまに して つれていく', value: 'join' },
          { label: 'なかまに して 酒場で まってもらう', value: 'wait' },
          { label: 'やめる', value: null },
        ]);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'recruit', key, swap });
        } else if (a === 'wait') await doReq({ action: 'recruit', key, join: false });
      } else if (e.inParty) {
        const opts = [{ label: '酒場で まっていて もらう', value: 'wait' }];
        if (e.sec === 'roster') opts.push({ label: 'なまえを かえる', value: 'rename' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}を どうする？`, opts);
        if (a === 'wait') await doReq({ action: 'wait', key });
        else if (a === 'rename') await rename(e);
      } else {
        const opts = [{ label: full ? 'つれていく（いれかわる）' : 'つれていく', value: 'join' }];
        if (e.sec === 'roster') opts.push({ label: 'なまえを かえる', value: 'rename' });
        if (e.species) opts.push({ label: 'わかれる', value: 'release' });
        opts.push({ label: 'やめる', value: null });
        const a = await ask(`${e.name}を どうする？`, opts);
        if (a === 'join') {
          let swap = null;
          if (full) swap = await pickSwap(e.name);
          if (!full || swap) await doReq({ action: 'join', key, swap });
        } else if (a === 'rename') await rename(e);
        else if (a === 'release') {
          const ok = await confirmBox(game.input, `ほんとうに ${e.name}と わかれますか？\n（もう あえなくなるよ。そうびは ふくろに もどる）`, 'わかれる', 'やめる', sfx);
          if (ok) await doReq({ action: 'release', key });
        }
      }
      menu.focus();
    };
    const rename = async (e) => {
      const nm = await askText(game.input, { title: `${e.name}の あたらしい なまえ`, max: 8, initial: e.name });
      if (nm) await doReq({ action: 'rename', key: e.key, name: nm });
    };
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    side.append(menu.root);
    s.right.textContent = partyText();
    menu.focus();
  });
}

// ちいさな えらぶ まど（Promise で えらんだ value。やめたら null）
export function choose(game, title, items) {
  return new Promise((resolve) => {
    const back = el('div', { class: 'modal-back', style: { zIndex: 6 }, onclick: () => { game.audio.sfx('cancel'); done(null); } });
    const box = el('div', { class: 'win panel center-panel choose-pop', style: { width: 'min(90vw, 440px)', zIndex: 7 } }, el('div', { class: 'small gold', style: { whiteSpace: 'pre-line' }, text: title }));
    const hasCancel = items.some((i) => i.value === null);
    const m = new ListMenu(game.input, {
      items,
      sound: (x) => game.audio.sfx(x),
      back: hasCancel ? null : 'やめる',
      onSelect: (it) => done(it.value),
      onCancel: () => done(null),
    });
    box.append(m.root);
    document.getElementById('ui').append(back, box);
    m.focus();
    const done = (v) => {
      m.blur();
      back.remove();
      box.remove();
      resolve(v);
    };
  });
}

// ───────────── でんごんばん ─────────────
function boardUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('かぞくの でんごんばん');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    s.body.append(main);
    let posts = data.posts || [];
    const render = () => {
      main.innerHTML = '';
      if (!posts.length) main.append(el('div', { class: 'muted', text: 'まだ なにも かかれていない。さいしょの メッセージを かいてみよう！' }));
      for (const p of posts.slice(0, 20)) {
        main.append(el('div', { class: 'combo-row' }, el('span', { class: 'gold', text: p.from }), el('span', { class: 'muted small', text: `　${ago(p.time)}` }), el('div', { text: p.text })));
      }
    };
    render();
    const menu = new ListMenu(game.input, {
      items: [{ label: 'かきこむ', value: 'post' }, { label: 'とじる', value: 'close' }],
      cols: 2,
      sound: (x) => game.audio.sfx(x),
      onSelect: async (it) => {
        if (it.value === 'close') return close();
        menu.blur();
        const text = await askText(game.input, { title: 'でんごんばんに かく', placeholder: 'きょうは どうくつまで いったよ！', max: 120 });
        if (text) {
          const r = await request(game, { kind: 'board', action: 'post', text });
          toast(r.text || '');
          if (r.posts) posts = r.posts;
          render();
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    main.before(menu.root);
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    menu.focus();
  });
}

export function ago(t) {
  const d = (Date.now() - t) / 1000;
  if (d < 60) return 'たったいま';
  if (d < 3600) return `${Math.floor(d / 60)}ぷんまえ`;
  if (d < 86400) return `${Math.floor(d / 3600)}じかんまえ`;
  return `${Math.floor(d / 86400)}にちまえ`;
}

// ───────────── ほしのかけら ─────────────
function starUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('ほしのかけら こうかん');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    const detail = el('div', { class: 'detail' });
    s.body.append(main);
    const upd = () => { s.right.textContent = `ほしのかけら ${itemCount(game.me, 'star_shard')}こ`; };
    upd();
    const menu = new ListMenu(game.input, {
      items: data.trades.map((t, i) => ({ label: ITEMS[t.item].name, right: `★${t.shards}`, value: i })),
      sound: (x) => game.audio.sfx(x),
      onMove: (it) => { detail.textContent = itemDetail(data.trades[it.value].item); },
      onSelect: async (it) => {
        const t = data.trades[it.value];
        menu.blur();
        if (await confirmBox(game.input, `ほしのかけら ${t.shards}こで ${ITEMS[t.item].name}と こうかんする？`, 'はい', 'いいえ', (x) => game.audio.sfx(x))) {
          const r = await request(game, { kind: 'starTrade', index: it.value });
          if (r.ok) game.audio.sfx('sparkle');
          toast(r.text || '');
          setTimeout(upd, 100);
        }
        menu.focus();
      },
      back: null,
      onCancel: () => close(),
    });
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    main.append(menu.root, detail);
    menu.focus();
  });
}

// ───────────── きょうかい ─────────────
function churchUI(game, data) {
  return new Promise((resolve) => {
    const s = shell('きょうかい');
    s.game = game;
    const main = el('div', { class: 'win main scroll', style: { gridColumn: '1 / -1' } });
    s.body.append(main);
    let info = data;
    const opts = () => {
      const items = [];
      for (const d of info.dead) items.push({ label: `${d.name}を いきかえらせる`, right: `${d.price}G`, value: { action: 'revive', ref: d.ref } });
      for (const d of info.poisoned) items.push({ label: `${d.name}の どくを なおす`, right: `${d.price}G`, value: { action: 'cure', ref: d.ref } });
      items.push({ label: 'おいのりを する（ここを きろくする）', value: { action: 'record' } });
      items.push({ label: 'なんでもない', value: { action: 'close' } });
      return items;
    };
    s.right.textContent = goldText(game);
    const menu = new ListMenu(game.input, {
      items: opts(),
      sound: (x) => game.audio.sfx(x),
      onSelect: async (it) => {
        if (it.value.action === 'close') return close();
        const r = await request(game, { kind: 'church', ...it.value });
        if (r.ok) game.audio.sfx('heal');
        toast(r.text || '');
        if (r.church) info = r.church;
        else if (r.ok && it.value.action !== 'record') {
          info = { dead: info.dead.filter((d) => d.ref !== it.value.ref), poisoned: info.poisoned.filter((d) => d.ref !== it.value.ref) };
        }
        menu.setItems(opts());
        setTimeout(() => { s.right.textContent = goldText(game); }, 100);
      },
      back: null,
      onCancel: () => close(),
    });
    main.append(menu.root, el('div', { class: 'detail', text: 'ぜんめつ すると、さいごに おいのりした きょうかいで めを さますよ。' }));
    const close = () => {
      menu.blur();
      s.root.remove();
      resolve();
    };
    s.onClose = close;
    menu.focus();
  });
}
