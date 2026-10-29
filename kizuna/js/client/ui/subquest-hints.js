// 第50回 N4: 困っている人（まだ 受けていない たのまれごと。shared/data/subquest-hints.js）
//   ・クエストの 画面に「困っている人」の 一らん（場所と 人と ひとこと）。「クエスト」を えらぶと 1人ずつ 見られて、地図に 黄色の しるし
//   ・新しく 困っている人が 出たら 知らせ（1回だけ）。クエストの 画面を 見るまで メニューに ●
import { el, toast } from './dom.js?v=847e4bcd6ab2';
import { availableSubQuests, newAsks, askLine, askJobNote, askToastText, setAskPin, askPin } from '../../shared/data/subquest-hints.js?v=847e4bcd6ab2';

const CSS = `
.qdot.ask { background: #ffd84a; }
.ask-row .l { white-space: normal; }
.ask-row .ap { color: var(--muted); font-size: 0.85em; margin-right: 0.3em; }
.ask-list .ah { color: var(--muted); font-size: 0.9em; margin: 0 0 0.25em 1.2em; white-space: pre-line; }
.ask-body { white-space: pre-line; line-height: 1.6; }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('r50-ask-css')) return;
  const st = document.createElement('style');
  st.id = 'r50-ask-css';
  st.textContent = CSS;
  document.head.append(st);
}

// 見た ことに する（クエストの 画面を 見たら サーバーに 送る）。
// メニューを とじるまでは「（新しい）」の まま（recent。AskWatcher が とじた 時に けす）
const recent = new Set();
function freshIds(g) {
  const fresh = newAsks(g.me, 'seen').map((q) => q.id);
  for (const id of fresh) recent.add(id);
  if (fresh.length) g.net.send({ t: 'menu', action: 'subAsk', kind: 'seen', ids: fresh });
  return recent;
}
// 新しい 人を 先に
const newFirst = (list, fresh) => [...list.filter((q) => fresh.has(q.id)), ...list.filter((q) => !fresh.has(q.id))];
const PREVIEW_MAX = 6;

// クエストの 画面（右の 見本）に 入れる 一らん
export function askSection(g) {
  addCss();
  const c = g.me;
  const list = availableSubQuests(c);
  const box = el('div', { class: 'ask-list' });
  box.append(el('h3', { style: { marginTop: '0.6em' }, text: '困っている人' }));
  if (!list.length) {
    box.append(el('div', { class: 'muted small', text: '今は、だれも困っていないみたい。お話が進むと、また困っている人が出てくるよ。' }));
    return box;
  }
  const unseen = freshIds(g);
  const pin = askPin();
  const shown = newFirst(list, unseen);
  for (const q of shown.slice(0, PREVIEW_MAX)) {
    box.append(el('div', { class: 'kv' }, el('span', {}, el('i', { class: 'qdot ask' }), `${q.place}の、${q.who}${unseen.has(q.id) ? '（新しい）' : ''}${pin === q.id ? '（しるし）' : ''}`)));
    box.append(el('div', { class: 'ah', text: `${q.hint}${askJobNote(q, c) ? `\n${askJobNote(q, c)}` : ''}` }));
  }
  const more = shown.length - PREVIEW_MAX;
  box.append(el('div', { class: 'small muted', text: `${more > 0 ? `ほかに${more}人。` : ''}「クエスト」を選ぶと、全部の人が見られて、会いに行く人に地図の黄色のしるしをつけられる。` }));
  return box;
}

// 「クエスト」を えらんだ 時: 1人ずつ 見て、地図に しるし（menu: FieldMenu）。困っている人が いない ときは null
export function askView(menu) {
  addCss();
  const g = menu.game;
  const c = g.me;
  const all = availableSubQuests(c);
  if (!all.length) return null;
  const unseen = freshIds(g);
  const list = newFirst(all, unseen);
  const box = el('div', { class: 'items-view ask-view' });
  const detail = el('div', { class: 'detail item-detail ask-body' });
  const pin = askPin();
  const rows = list.map((q) => ({
    html: `<span class="ap">${q.place}</span>${q.who}${unseen.has(q.id) ? '（新しい）' : ''}${pin === q.id ? '（しるし）' : ''}`,
    value: q.id,
    cls: 'ask-row',
  }));
  const show = (it) => {
    const q = list.find((x) => x.id === it?.value);
    detail.innerHTML = '';
    if (!q) return;
    const job = askJobNote(q, c);
    detail.append(el('div', { text: `${askLine(q)}\n${q.hint}${job ? `\n${job}` : ''}\n${askPin() === q.id ? '（地図に黄色のしるしがついている。もう一度選ぶと消す）' : '（選ぶと、地図に黄色のしるしをつける）'}` }));
  };
  const m = menu.mkSub({
    items: rows,
    onMove: (it) => show(it),
    onSelect: (it) => {
      const q = list.find((x) => x.id === it.value);
      if (!q) return;
      const on = askPin() !== q.id;
      setAskPin(on ? q.id : null);
      toast(on ? `${q.place}の、${q.who}に、地図のしるしをつけた` : 'しるしを消した');
      menu.redraw();
    },
  });
  box.append(el('div', { class: 'small gold', text: '困っている人（選ぶと、地図に黄色のしるし）' }), m.root, detail);
  return box;
}

// 新しく 困っている人が 出たら 1回だけ 知らせる（hud.js の update から。フィールドで 何も して いない 時だけ）
export class AskWatcher {
  constructor(game) {
    this.game = game;
    this.sent = new Set();
  }

  update() {
    const g = this.game;
    if (!g.menuOpen) recent.clear();
    if (!g.me || g.state !== 'field' || g.busy || g.menuOpen) return;
    const fresh = newAsks(g.me, 'told').filter((q) => !this.sent.has(q.id));
    if (!fresh.length) return;
    for (const q of fresh) this.sent.add(q.id);
    toast(askToastText(fresh), 6000);
    g.net.send({ t: 'menu', action: 'subAsk', kind: 'told', ids: fresh.map((q) => q.id) });
  }
}
