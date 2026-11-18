// 第88回 G3班: まぼろしの回ろうの とびらを 調べた 時の まど（大きな まど 1まい。client/ui/paper-pop.js と おなじ 作り）
//   中み（p）は shared/rivals-r88.js の rivalPaper:
//     { kind: 'rival', work, workName, mark, own, need, rivals: [{ id, name, members, lv, state, use, rewards: [{ id, name }], words, miss }], ask }
//   下の 大きな ボタン（「○○とたたかう」／やめる）で えらぶ。キーボード・ゲームパッド・タッチで うごく。
//   見ている だけの 人（spectator）は 少しの 間 見せて とじる
import { el, ListMenu, esc } from './dom.js?v=2bf9080b36ff';
import { rareNameHtml } from './rarity.js?v=2bf9080b36ff';
import { boardIconURL } from '../render/boards.js?v=2bf9080b36ff';

const STATE_TEXT = { won: '○勝った', next: 'つぎの相手', lock: 'まだ', need: 'じょうけん' }; // G15班: need … じょうけんが たりない（竜王のひ孫）

const CSS = `
.rival-pop {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(calc(100% - 16px), 1000px);
  max-height: calc(100% - 16px - var(--safe-t) - var(--safe-b));
  display: flex; flex-direction: column; min-width: 0;
  font-size: calc(var(--fs) * 1.04);
  background: var(--win-solid);
  padding: 0.6em 0.9em 0.7em;
}
.rival-pop .rv-head { flex: none; display: flex; align-items: center; gap: 0.3em 0.7em; flex-wrap: wrap; }
.rival-pop .rv-kind { color: var(--accent); border: 1px solid currentColor; border-radius: 4px; padding: 0 0.45em; font-size: var(--fs-small); }
.rival-pop .rv-mark { width: 2em; height: 2em; image-rendering: pixelated; }
.rival-pop .rv-title { margin: 0; font-size: 1.35em; font-weight: bold; color: #fff; letter-spacing: 0.04em; }
.rival-pop .rv-own { margin-left: auto; color: var(--good); font-size: var(--fs-small); }
.rival-pop .rv-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; list-style: none; margin: 0.5em 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.45em; }
.rival-pop .rv-row { border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px; background: rgba(255, 255, 255, 0.05); padding: 0.4em 0.7em; min-width: 0; }
.rival-pop .rv-row.next { border-color: var(--accent); background: rgba(255, 214, 107, 0.1); }
.rival-pop .rv-row.lock { opacity: 0.55; }
.rival-pop .rv-row.need { opacity: 0.8; border-style: dashed; }
.rival-pop .rv-st.need { color: #ffb0b0; background: rgba(255, 120, 120, 0.14); }
.rival-pop .rv-need { font-size: var(--fs-small); color: #ffcf7a; }
.rival-pop .rv-notes { flex: none; margin-top: 0.35em; padding: 0.3em 0.6em; border-radius: 6px; background: rgba(255, 214, 107, 0.1); border: 1px solid rgba(255, 214, 107, 0.35); }
.rival-pop .rv-note { font-size: var(--fs-small); color: #ffe6a8; overflow-wrap: anywhere; }
.rival-pop .rv-note:first-child { font-weight: bold; color: var(--accent); }
.rival-pop .rv-top { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.2em 0.7em; }
.rival-pop .rv-n { color: var(--muted); font-size: var(--fs-small); }
.rival-pop .rv-name { font-weight: bold; font-size: 1.08em; }
.rival-pop .rv-lv { color: var(--muted); font-size: var(--fs-small); }
.rival-pop .rv-st { margin-left: auto; padding: 0 0.5em; border-radius: 4px; font-size: var(--fs-small); font-weight: bold; }
.rival-pop .rv-st.won { color: var(--good); background: rgba(125, 255, 176, 0.14); }
.rival-pop .rv-st.next { color: var(--accent); background: rgba(255, 214, 107, 0.16); }
.rival-pop .rv-st.lock { color: var(--muted); }
.rival-pop .rv-sub { font-size: var(--fs-small); color: #dcdcf0; overflow-wrap: anywhere; }
.rival-pop .rv-words { font-size: var(--fs-small); color: var(--muted); }
.rival-pop .rv-foot { flex: none; display: flex; align-items: center; gap: 0.4em 1.2em; margin-top: 0.55em; padding-top: 0.45em; border-top: 1px dashed rgba(255, 255, 255, 0.22); }
.rival-pop .rv-q { margin: 0; color: var(--accent); font-weight: bold; font-size: 1.1em; }
.rival-pop .rv-q.muted { color: var(--muted); font-weight: normal; }
.rival-pop .menu.rv-btns { flex: 1 1 auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5em; margin: 0 0 0 auto; max-width: 36em; }
.rival-pop .menu .item.rv-btn { min-height: 2.6em; justify-content: center; align-items: center; font-size: 1.08em; border: 2px solid rgba(255, 255, 255, 0.35); border-radius: 8px; padding-left: 1.3em; }
.rival-pop .menu .item.rv-btn.sel { border-color: var(--accent); background: rgba(255, 214, 107, 0.18); }
@media (orientation: portrait) {
  .rival-pop .rv-foot { flex-direction: column; align-items: stretch; }
  .rival-pop .rv-q { text-align: center; }
  .rival-pop .menu.rv-btns { margin: 0 auto; width: 100%; grid-template-columns: minmax(0, 1fr); }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('r88-rival-css')) return;
  const st = document.createElement('style');
  st.id = 'r88-rival-css';
  st.textContent = CSS;
  document.head.append(st);
}

export function rivalBody(p) {
  const icon = p.mark ? boardIconURL(p.mark) : null;
  const head = el('div', { class: 'rv-head' },
    el('span', { class: 'rv-kind', text: 'まぼろしの回ろう' }),
    icon ? el('img', { class: 'rv-mark', src: icon, alt: '' }) : null,
    el('h2', { class: 'rv-title', text: `${p.workName}のとびら` }),
    el('span', { class: 'rv-own', text: `${p.goodsName || p.workName}の品 ${p.own}こ（${p.need}こで開く）` }));
  const rows = (p.rivals || []).map((r, i) => {
    const who = r.members ? `${r.name}（${r.members.join('・')}）` : r.name;
    const rw = (r.rewards || []).map((x) => rareNameHtml(x.id, x.name)).join('・');
    return el('li', { class: `rv-row ${r.state}` },
      el('div', { class: 'rv-top' },
        el('span', { class: 'rv-n', text: `${i + 1}人め` }),
        el('span', { class: 'rv-name', text: r.state === 'lock' ? '？？？' : who }),
        el('span', { class: 'rv-lv', text: `Lv${r.lv}くらい` }),
        el('span', { class: `rv-st ${r.state}`, text: STATE_TEXT[r.state] || '' })),
      el('div', { class: 'rv-sub', html: `${r.use ? `使う品：${esc(r.use)}　` : ''}もらえる品：${rw || '—'}` }),
      r.miss?.length ? el('div', { class: 'rv-sub', text: `まだ持っていない品：${r.miss.join('・')}（もう一度勝つともらえる）` }) : null,
      r.need ? el('div', { class: 'rv-need', text: `★${r.need}` }) : null,
      r.words ? el('div', { class: 'rv-words', text: `「${r.words}」` }) : null);
  });
  // G16班: とびらの 上の 行（今日の ジムリーダー・持って いる バッジ。shared/rivals-r88.js の dailyNotes）
  const notes = p.notes?.length ? el('div', { class: 'rv-notes' }, ...p.notes.map((t) => el('div', { class: 'rv-note', text: t }))) : null;
  return [head, notes, el('ul', { class: 'rv-list' }, ...rows)].filter(Boolean);
}

// sp … ScriptPlayer・options … ボタンの 名前（さいごは やめる）・かえす もの: えらんだ ばんごう
export function rivalPop(sp, p, options, spectator, who) {
  const g = sp.game;
  addCss();
  return new Promise((resolve) => {
    const box = el('div', { class: `win rival-pop${spectator ? ' watch' : ''}` });
    box.append(...rivalBody(p));
    document.body.classList.add('big-choice');
    let menu = null;
    let timer = null;
    const last = options.length - 1;
    const finish = (v) => {
      clearTimeout(timer);
      menu?.blur();
      g.input.pop(watchH);
      box.remove();
      document.body.classList.remove('big-choice');
      if (sp.popClose === close) sp.popClose = null;
      resolve(v);
    };
    const close = () => finish(last);
    sp.popClose = close;
    const watchH = { onNav: (a) => { if (a === 'a' || a === 'b') finish(0); } };
    if (spectator) {
      box.append(el('div', { class: 'rv-foot' }, el('div', { class: 'rv-q muted', text: `（${who || '仲間'}が、とびらを調べています…）` })));
      document.getElementById('ui').append(box);
      g.input.push(watchH);
      timer = setTimeout(() => finish(0), 6000);
      return;
    }
    menu = new ListMenu(g.input, {
      items: options.map((o, i) => ({ label: o, value: i, cls: `rv-btn${i === 0 && options.length > 1 ? ' main' : ''}` })),
      cols: options.length > 1 ? 2 : 1,
      className: 'rv-btns',
      sound: (s) => g.audio.sfx(s),
      back: null,
      onSelect: (it) => finish(it.value),
      onCancel: () => { g.audio.sfx('cancel'); finish(last); },
    });
    box.append(el('div', { class: 'rv-foot' }, el('div', { class: 'rv-q', text: p.ask || '' }), menu.root));
    document.getElementById('ui').append(box);
    menu.focus();
  });
}
