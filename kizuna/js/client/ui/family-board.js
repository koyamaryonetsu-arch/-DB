// 第51回 B: 家族のけいじ板（メニューの「けいじ板」。サーバーの きまりは shared/world/family-board.js）
//   一覧は 見出しだけ（だれが・何を・いつ）。なりかた・覚えかたは その 行で「見る」を おした 時だけ 出る（ネタバレ よけ）
//   まだ 見ていない 知らせが あると メニューに ●（キャラごとの c.boardSeen）。
//   だれかの 知らせが のると、遊んでいる 人に 小さな 知らせ（戦いの 間は 戦いが おわってから）
import { el, esc, toast } from './dom.js?v=66b0267ceac2';
import { boardRows, boardUnread, boardWhen } from '../../shared/world/family-board.js?v=66b0267ceac2';

export const BOARD_TOAST = '家族のけいじ板に、\n新しい知らせがあります';
const TOAST_GAP = 8000;

function stateOf(g) {
  if (!g.fboard) g.fboard = { list: null, last: 0, opened: new Set(), onChange: null, toastWait: false, toastAt: 0 };
  return g.fboard;
}

// まだ 見ていない 知らせが あるか（メニューの ●）
export function hasBoardUnread(g) {
  return !!g?.me && boardUnread(stateOf(g).last, g.me);
}

// メニューが 開いていれば「家族のけいじ板」の ● を 今の ようすに
function markMenu(g) {
  const lm = g.menu?.root && g.menu.menu;
  if (!lm?.items) return;
  const on = hasBoardUnread(g);
  lm.items.forEach((it, i) => {
    if (it.value !== 'fboard') return;
    it.cls = on ? 'has-new' : '';
    lm.root.children[i]?.classList.toggle('has-new', on);
  });
}

// 小さな 知らせ（戦いの 間は おわってから。つづけて 来ても 1回）
function newToast(g) {
  const st = stateOf(g);
  if (st.toastWait || performance.now() - st.toastAt < TOAST_GAP) return;
  const show = () => {
    st.toastWait = false;
    if (!g.me) return;
    st.toastAt = performance.now();
    toast(BOARD_TOAST, 4000);
  };
  if (g.state === 'battle' || g.battleClosing) {
    st.toastWait = true;
    g.waitBattleClosed().then(show);
  } else show();
}

// フィールドに 入った 時（キャラが かわる ことも ある）: 前の 一覧は すてて、さいごの 時こくだけ 聞く
export function boardOnEnter(g) {
  const st = stateOf(g);
  st.list = null;
  st.opened = new Set();
  st.last = 0;
  g.net.send({ t: 'fboard', action: 'peek' });
}

// サーバーからの 知らせ（game.js の onMessage）
export function onBoardMsg(g, m) {
  const st = stateOf(g);
  switch (m.t) {
    case 'fboardLast':
      st.last = Math.max(st.last, m.last || 0);
      markMenu(g);
      return;
    case 'fboardList':
      st.list = Array.isArray(m.list) ? m.list : [];
      st.last = Math.max(st.last, m.last || 0);
      st.onChange?.();
      return;
    case 'fboardNew': {
      const e = m.entry;
      if (!e || !g.me) return;
      if (st.list && !st.list.some((x) => x.id === e.id)) st.list.unshift(e);
      // 自分の 知らせは ● も 知らせも 出さない（自分で 知っている）
      if (e.charId !== g.me.id) st.last = Math.max(st.last, e.at || 0);
      st.onChange?.();
      if (e.charId === g.me.id) return;
      markMenu(g);
      newToast(g);
      return;
    }
    default:
  }
}

// 行の 見た目
function rowItem(r) {
  const head = `<span class="fb-tag fb-${esc(r.kind)}">${esc(r.tag)}</span><span class="fb-tt">${esc(r.title)}</span>`;
  const when = `<span class="ln fb-when">${esc(boardWhen(r.at))}${r.mine ? '　（自分）' : ''}</span>`;
  const body = r.open ? `<span class="ln fb-detail">${esc(r.detail)}</span>` : '';
  return { html: head + when + body, value: r.id, right: r.open ? 'とじる' : '見る', rightCls: 'fb-see', cls: `fb-row ${r.unread ? 'unread' : ''} ${r.open ? 'open' : ''}` };
}

// menu: FieldMenu（mkSub・back を 使う）。active: えらべる 画面か（false は 右の 見本）
export function familyBoardView(menu, active) {
  addCss();
  const g = menu.game;
  const st = stateOf(g);
  const box = el('div', { class: 'items-view fboard-view' });
  if (!active) {
    const fresh = hasBoardUnread(g);
    box.append(el('div', { class: 'muted', text: `${fresh ? '新しい知らせがあります。\n' : ''}家族のだれかが転職したり、ひらめき技や合体技を覚えたりすると、ここに自動でのる。\nなりかた・覚えかたは「見る」をおした時だけ出る。` }));
    return box;
  }
  // ● は この 画面の 間は 出した まま（開いた 時の「見た 時こく」で 見る）
  const seenMe = { id: g.me?.id, boardSeen: g.me?.boardSeen || 0 };
  const m = menu.mkSub({
    items: [{ label: '読みこみ中…', value: null, disabled: true }],
    onSelect: (it) => {
      if (!it?.value) return;
      if (st.opened.has(it.value)) st.opened.delete(it.value);
      else st.opened.add(it.value);
      render();
    },
  });
  const render = () => {
    if (!st.list) return;
    const rows = boardRows(st.list, st.opened, seenMe);
    m.setItems(rows.length ? rows.map(rowItem) : [{ label: 'まだ知らせはない。', value: null, disabled: true }]);
  };
  // 見た ことに する（サーバーに 記録。キャラごと）
  const markSeen = () => {
    if (!st.last || !g.me || st.last <= (g.me.boardSeen || 0)) return;
    g.net.send({ t: 'fboard', action: 'seen', at: st.last });
    g.me.boardSeen = st.last;
    markMenu(g);
  };
  // ひとりモードでは 返事が すぐ 来る ことが ある（まだ 画面に 出す 前）ので、出た あとで はずれていたら やめる
  let born = true;
  setTimeout(() => { born = false; }, 0);
  st.onChange = () => {
    if (!born && !m.root.isConnected) { st.onChange = null; return; }
    render();
    markSeen();
  };
  if (st.list) {
    render();
    markSeen();
  }
  g.net.send({ t: 'fboard', action: 'list' });
  box.append(el('div', { class: 'small muted fb-help', text: '行を選ぶと、なりかた・覚えかたが出る（ネタバレ注意）' }), m.root);
  return box;
}

const CSS = `
.fboard-view > .fb-help { flex: none; margin-bottom: 0.3em; }
/* 行が高くなってもつぶれない */
.fboard-view .fb-row { flex: none; align-items: flex-start; }
.fboard-view .fb-row .l { white-space: normal; line-height: 1.35; min-width: 0; }
.fboard-view .fb-row .fb-tag { display: inline-block; font-size: 0.68em; padding: 0 0.4em; margin-right: 0.35em; border: 1px solid #8fa0d8; border-radius: 3px; color: #b8c4ff; vertical-align: 0.12em; white-space: nowrap; }
.fboard-view .fb-row .fb-hirameki { border-color: #6bd88f; color: #8ff0ae; }
.fboard-view .fb-row .fb-dual { border-color: #ff9a6b; color: #ffb48f; }
.fboard-view .fb-row .fb-phantom_reveal, .fboard-view .fb-row .fb-phantom_get { border-color: #ffd66b; color: #ffd66b; }
.fboard-view .fb-row .fb-when { display: block; color: var(--muted); font-size: 0.78em; }
.fboard-view .fb-row .fb-detail { display: block; margin-top: 0.3em; padding: 0.3em 0.45em; white-space: pre-line; font-size: 0.88em; color: var(--text); background: rgba(255, 255, 255, 0.06); border-left: 3px solid var(--accent); border-radius: 3px; }
.fboard-view .fb-row.unread .fb-tt::after { content: '●'; color: #ff6b6b; font-size: 0.7em; margin-left: 0.3em; vertical-align: 0.15em; }
.fboard-view .fb-row .r.fb-see { flex: none; margin-top: 0.1em; font-size: 0.78em; padding: 0.05em 0.5em; border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 4px; color: var(--accent); white-space: nowrap; }
.fboard-view .fb-row.open .r.fb-see { color: var(--muted); }
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('fboard-css')) return;
  const st = document.createElement('style');
  st.id = 'fboard-css';
  st.textContent = CSS;
  document.head.append(st);
}
