// 第37回 A: サファラ闘技場の 画面（だいほんの ['ui', …]。shared/world/arena.js）
//   arenaCard … かけ試合の 組み合わせ（4ひきの すがた・オッズ）
//   arenaBout … かけ試合の ようす（1回戦 2つ と 決勝。短い 戦いの ようすを 1行ずつ。タップで 先へ・「とばす」で さいごまで）
//   arenaWall … 王者のかべ（家族サーバーでは 家族みんな、ひとりの サイトでは 自分の キャラたち）
import { el, ListMenu } from './dom.js?v=31a32b16dd7b';
import { monsterCanvas } from '../render/monsters.js?v=31a32b16dd7b';

const CSS = `
.arena-panel { display: flex; flex-direction: column; max-height: calc(100% - var(--safe-t) - 16px); }
.arena-main { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.arena-lead { white-space: pre-line; margin-bottom: 0.4em; }
.arena-card { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.4em 0.5em; align-items: center; }
.arena-vs { color: #ff8a6a; font-weight: bold; text-align: center; }
.arena-mon { display: flex; flex-direction: column; align-items: center; gap: 0.15em; padding: 0.3em; border-radius: 6px; background: rgba(255, 255, 255, 0.05); min-width: 0; }
.arena-mon.pick { box-shadow: 0 0 0 2px #ffd66b; background: rgba(255, 214, 107, 0.14); }
.arena-mon.out { opacity: 0.45; filter: grayscale(0.7); }
.arena-mon.champ { box-shadow: 0 0 0 2px #ffd66b, 0 0 14px rgba(255, 214, 107, 0.7); }
.arena-mon canvas { image-rendering: pixelated; display: block; }
.arena-mon .nm { font-size: var(--fs-small); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.arena-mon .od { color: #ffd66b; font-weight: bold; font-variant-numeric: tabular-nums; }
.arena-mon .no { color: var(--muted); font-size: 0.8em; }
.arena-hp { width: 100%; height: 0.45em; border-radius: 3px; background: rgba(255, 255, 255, 0.15); overflow: hidden; }
.arena-hp > i { display: block; height: 100%; background: #6ad86a; transition: width 0.35s; }
.arena-hp.low > i { background: #ff7a5a; }
.arena-round { text-align: center; color: #ffd66b; font-weight: bold; margin: 0.2em 0 0.3em; }
.arena-log { min-height: 4.6em; white-space: pre-line; margin-top: 0.4em; padding: 0.35em 0.5em; border-radius: 6px; background: rgba(0, 0, 0, 0.3); line-height: 1.45; }
.arena-result { text-align: center; font-weight: bold; margin-top: 0.4em; white-space: pre-line; }
.arena-result.hit { color: #ffd66b; }
.arena-btns { display: flex; gap: 0.5em; justify-content: center; margin-top: 0.4em; }
.arena-wall-rows { display: flex; flex-direction: column; }
.arena-wall-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'nm best' 'st st'; column-gap: 0.6em; padding: 0.3em 0.3em; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
.arena-wall-row.me { background: rgba(160, 120, 255, 0.16); border-radius: 4px; }
.arena-wall-row .nm { grid-area: nm; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.arena-wall-row .best { grid-area: best; color: #ffd66b; font-weight: bold; white-space: nowrap; }
.arena-wall-row .st { grid-area: st; display: flex; flex-wrap: wrap; gap: 0.2em; font-size: 0.82em; }
.arena-wall-row .st span { padding: 0 0.35em; border-radius: 3px; background: rgba(255, 255, 255, 0.07); color: var(--muted); }
.arena-wall-row .st span.on { background: rgba(255, 214, 107, 0.22); color: #ffe9a8; }
.arena-wall-row .st span.lg.on { background: rgba(255, 120, 200, 0.25); color: #ffd0f0; }
@media (orientation: landscape) and (max-height: 500px) {
  .arena-log { min-height: 3em; }
  .arena-card { gap: 0.2em 0.4em; }
  .arena-matches { display: grid; grid-template-columns: 1fr 1fr; gap: 0 0.8em; }
  .arena-lead { margin-bottom: 0.2em; }
  .arena-round { margin: 0 0 0.2em; }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('arena-r37-css')) return;
  const st = document.createElement('style');
  st.id = 'arena-r37-css';
  st.textContent = CSS;
  document.head.append(st);
}

// 魔物の すがた（大きさは 見た目で そろえる。px … いちばん 長い 辺）
function monPic(sp, px = 64, frame = 0) {
  const src = monsterCanvas(sp, frame);
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  const r = src.res || 1, w = src.width / r, h = src.height / r;
  const k = px / Math.max(w, h);
  c.style.width = `${Math.round(w * k)}px`;
  c.style.height = `${Math.round(h * k)}px`;
  return c;
}
const picSize = () => (typeof window !== 'undefined' && window.innerHeight < 500 ? 44 : 62);

// まどの 外がわ（見出し・✕）。close で とじる
function shell(game, title, onClose) {
  addCss();
  const back = el('div', { class: 'modal-back' });
  const root = el('div', { class: 'panel center-panel svc-panel arena-panel' });
  const closeBtn = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる', onclick: () => { game.audio?.sfx('cancel'); onClose(); } });
  root.append(el('div', { class: 'win svc-head' }, el('span', { class: 'gold', text: title }), el('span', { class: 'svc-right' }), closeBtn));
  const main = el('div', { class: 'win main arena-main' });
  root.append(main);
  back.addEventListener('click', () => onClose());
  document.getElementById('ui').append(back, root);
  return { root, main, remove: () => { back.remove(); root.remove(); } };
}
function okMenu(game, label, onPick) {
  const menu = new ListMenu(game.input, {
    items: [{ label, value: 'ok' }],
    sound: (x) => game.audio?.sfx(x),
    onSelect: () => onPick(),
    onCancel: () => onPick(),
    back: null,
  });
  return menu;
}

function monBox(m, i, extra = '') {
  return el('div', { class: `arena-mon ${extra}`, 'data-i': i },
    el('span', { class: 'no', text: `${i + 1}ばん` }), monPic(m.sp, picSize()), el('span', { class: 'nm', text: m.name }),
    m.odds ? el('span', { class: 'od', text: `${m.odds}倍` }) : null);
}

// ───────────── かけ試合の 組み合わせ ─────────────
export function arenaCardUI(game, data) {
  return new Promise((resolve) => {
    let menu;
    const close = () => {
      menu?.blur();
      s.remove();
      resolve();
    };
    const s = shell(game, 'かけ試合の組み合わせ', close);
    const card = Array.isArray(data?.card) ? data.card : [];
    s.main.append(el('div', { class: 'arena-lead small', text: '1回戦に勝った2ひきが、決勝で戦う。\n最後まで勝ちのこる1ぴきを当てよう！（オッズ＝当たった時の何倍か）' }));
    const matches = el('div', { class: 'arena-matches' });
    for (const [a, b] of data?.pairs || [[0, 1], [2, 3]]) {
      if (!card[a] || !card[b]) continue;
      matches.append(el('div', { class: 'arena-match' },
        el('div', { class: 'arena-round', text: a === 0 ? '1回戦　第1試合' : '1回戦　第2試合' }),
        el('div', { class: 'arena-card' }, monBox(card[a], a), el('span', { class: 'arena-vs', text: 'VS' }), monBox(card[b], b))));
    }
    s.main.append(matches);
    menu = okMenu(game, 'かける魔物を選ぶ', close);
    s.root.append(menu.root);
    menu.focus();
  });
}

// ───────────── かけ試合の ようす ─────────────
export function arenaBoutUI(game, data) {
  return new Promise((resolve) => {
    const card = Array.isArray(data?.card) ? data.card : [];
    const bouts = Array.isArray(data?.bouts) ? data.bouts : [];
    let menu = null, timer = null, done = false, skip = false;
    let next = null;
    const close = () => {
      if (!done) {
        // とちゅうで とじた: さいごまで とばす
        skip = true;
        next?.();
        return;
      }
      clearTimeout(timer);
      menu?.blur();
      s.remove();
      resolve();
    };
    const s = shell(game, 'かけ試合', close);
    const round = el('div', { class: 'arena-round' });
    const field = el('div', { class: 'arena-card' });
    const log = el('div', { class: 'arena-log' });
    const result = el('div', { class: 'arena-result' });
    const skipBtn = el('button', { class: 'btn', text: 'とばす ▶▶', onclick: (e) => { e.stopPropagation(); skip = true; next?.(); } });
    s.main.append(round, field, log, result, el('div', { class: 'arena-btns' }, skipBtn));
    log.addEventListener('click', () => next?.());
    field.addEventListener('click', () => next?.());
    const wait = (ms) => new Promise((r) => {
      if (skip) return r();
      next = () => { clearTimeout(timer); next = null; r(); };
      timer = setTimeout(() => next?.(), ms);
    });
    const hpBar = (hp, max) => {
      const ratio = Math.max(0, Math.min(1, hp / Math.max(1, max)));
      const bar = el('div', { class: `arena-hp ${ratio < 0.3 ? 'low' : ''}` }, el('i', { style: { width: `${Math.round(ratio * 100)}%` } }));
      return bar;
    };
    const setHp = (box, hp, max) => {
      const old = box.querySelector('.arena-hp');
      const bar = hpBar(hp, max);
      if (old) old.replaceWith(bar);
      else box.append(bar);
    };
    (async () => {
      for (const bt of bouts) {
        const A = card[bt.a], B = card[bt.b];
        if (!A || !B) continue;
        round.textContent = bt.final ? '決勝！' : bt.a === 0 ? '1回戦　第1試合' : '1回戦　第2試合';
        field.innerHTML = '';
        const ba = monBox({ ...A, odds: null }, bt.a, bt.a === data.pick ? 'pick' : '');
        const bb = monBox({ ...B, odds: null }, bt.b, bt.b === data.pick ? 'pick' : '');
        const max = bt.maxHp || [1, 1];
        setHp(ba, max[0], max[0]);
        setHp(bb, max[1], max[1]);
        field.append(ba, el('span', { class: 'arena-vs', text: 'VS' }), bb);
        log.textContent = `${A.name} 対 ${B.name}\n戦いがはじまった！`;
        game.audio?.sfx('encounter');
        await wait(1100);
        for (const ln of bt.lines || []) {
          if (skip) break;
          log.textContent = ln.text;
          if (Array.isArray(ln.hp)) {
            setHp(ba, ln.hp[0], max[0]);
            setHp(bb, ln.hp[1], max[1]);
          }
          game.audio?.sfx('hit');
          await wait(1000);
        }
        const W = card[bt.winner];
        (bt.winner === bt.a ? bb : ba).classList.add('out');
        if (bt.winner === bt.a) setHp(bb, 0, max[1]);
        else setHp(ba, 0, max[0]);
        log.textContent = `${W?.name || ''}の勝ち！`;
        await wait(1200);
      }
      // 優勝
      const C = card[data.champ];
      round.textContent = '優勝';
      field.innerHTML = '';
      if (C) field.append(el('span'), monBox({ ...C, odds: null }, data.champ, 'champ'), el('span'));
      const hit = data.champ === data.pick;
      result.className = `arena-result ${hit ? 'hit' : ''}`;
      result.textContent = hit ? `${C?.name || ''}の優勝！\n大当たり！ ${Number(data.win || 0).toLocaleString('ja-JP')}ゴールド！` : `${C?.name || ''}の優勝！\nはずれ…（${Number(data.bet || 0).toLocaleString('ja-JP')}Gかけた）`;
      log.textContent = '';
      log.style.display = 'none';
      skipBtn.remove();
      game.audio?.sfx(hit ? 'win' : 'buzz');
      done = true;
      menu = okMenu(game, 'とじる', close);
      s.root.append(menu.root);
      menu.focus();
    })();
  });
}

// ───────────── 王者のかべ ─────────────
export function arenaWallUI(game, data) {
  return new Promise((resolve) => {
    let menu;
    const close = () => {
      menu?.blur();
      s.remove();
      resolve();
    };
    const title = data?.offline ? '王者のかべ（このスマホのキャラ）' : `王者のかべ${data?.family ? `（${data.family}）` : ''}`;
    const s = shell(game, title, close);
    const ranks = Array.isArray(data?.ranks) ? data.ranks : [];
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    s.main.append(el('div', { class: 'arena-lead small muted', text: 'サファラ闘技場のランクを勝ちぬいた者の名前が、ここにきざまれる。' }));
    if (!rows.length) s.main.append(el('div', { class: 'muted', text: 'まだだれの名前もない。\n1番乗りをめざそう！' }));
    const list = el('div', { class: 'arena-wall-rows' });
    for (const r of rows) {
      const best = ranks.find((x) => x.rank === r.best);
      const label = best ? `${best.legend ? '伝説の部・' : ''}ランク${best.rank}` : '';
      const st = el('div', { class: 'st' });
      ranks.forEach((R, i) => {
        const n = r.ranks?.[i] || 0;
        st.append(el('span', { class: `${n > 0 ? 'on' : ''} ${R.legend ? 'lg' : ''}`, text: `${R.rank}${n > 0 ? '★' : ''}`, title: `${R.champ}${n > 1 ? `（${n}回）` : ''}` }));
      });
      const when = Number.isFinite(r.at) ? (() => { const d = new Date(r.at); return `${d.getMonth() + 1}月${d.getDate()}日`; })() : '';
      const withText = r.with?.length ? `${r.with.join('・')}といっしょ` : '';
      list.append(el('div', { class: `arena-wall-row ${r.id === data?.me?.id ? 'me' : ''}` },
        el('span', { class: 'nm', text: r.name }),
        el('span', { class: 'best', text: label }),
        st,
        (when || withText) ? el('span', { class: 'muted small', style: { gridColumn: '1 / -1' }, text: [when, withText].filter(Boolean).join('　') }) : null));
    }
    s.main.append(list);
    menu = okMenu(game, 'とじる', close);
    s.root.append(menu.root);
    menu.focus();
  });
}
