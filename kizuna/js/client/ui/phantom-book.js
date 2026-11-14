// 第51回 F: メニューの「幻の書」（12の 幻の職業の 条件と すすみぐあい。shared/data/phantom.js の phantomBook）
//   はじめは ？？？。きわめておく 職業の どちらかを きわめると、名前・きわめておく 職業（✔）・条件の メーターが 見える
//   一覧（上）と えらんだ 物の 中み（下）。十字キーの 上下で えらぶ・左右で 中みを スクロール。タッチでも おなじ
import { el } from './dom.js?v=283f9a2c8227';
import { phantomBook, bigNum, PHANTOM_JOBS } from '../../shared/data/phantom.js?v=283f9a2c8227';
import { JOB_HINTS } from '../../shared/data/jobs.js?v=283f9a2c8227';

const CSS = `
.pb-view .pb-row .l { white-space: normal; }
.pb-view .pb-row.unknown .l { color: var(--muted); letter-spacing: 0.1em; }
.pb-view .pb-row .r { font-size: 0.85em; }
.pb-body { white-space: normal; line-height: 1.5; }
.pb-body .pb-pre { white-space: pre-line; }
.pb-body .pb-name { color: var(--accent, #ffd66b); font-weight: bold; margin-bottom: 0.2em; }
.pb-body .pb-sec { color: var(--muted); font-size: 0.85em; margin-top: 0.35em; }
.pb-body .pb-master { display: flex; gap: 0.4em; align-items: baseline; }
.pb-body .pb-master .ok { color: #7fe08a; }
.pb-body .pb-cond { margin: 0.25em 0 0.35em; }
.pb-body .pb-cond .t { font-size: 0.92em; }
.pb-body .pb-cond.done .t { color: #7fe08a; }
.pb-body .pb-meter { display: flex; align-items: center; gap: 0.4em; }
.pb-body .pb-bar { flex: 1 1 auto; min-width: 0; height: 0.65em; border-radius: 0.35em; background: rgba(255, 255, 255, 0.12); overflow: hidden; }
.pb-body .pb-bar i { display: block; height: 100%; background: linear-gradient(90deg, #8a6bff, #ffd66b); }
.pb-body .pb-cond.done .pb-bar i { background: #7fe08a; }
.pb-body .pb-num { flex: none; font-size: 0.82em; color: var(--muted); white-space: nowrap; }
.pb-body .pb-ready { color: #ffd66b; margin-top: 0.3em; }
.pb-body .pb-hint { color: var(--muted); font-size: 0.9em; margin-top: 0.3em; }
.pb-view .pb-row.pb-who .l { color: var(--accent, #ffd66b); }
@media (max-width: 420px) {
  .pb-body { font-size: 0.92em; }
  .pb-body .pb-num { font-size: 0.78em; }
}
`;
function addCss() {
  if (typeof document === 'undefined' || document.getElementById('r51f-css')) return;
  const st = document.createElement('style');
  st.id = 'r51f-css';
  st.textContent = CSS;
  document.head.append(st);
}

// 一覧の 右の しるし
function mark(r) {
  if (!r.known) return '';
  if (r.got) return '★なった';
  if (r.ready) return r.live ? 'なれる！' : 'そろった';
  return `${r.conds.filter((x) => x.done).length}/${r.conds.length}`;
}

// えらんだ 幻の職業の 中み
function detailOf(r, c) {
  const box = el('div');
  if (!r.known) {
    box.append(el('div', { class: 'pb-name', text: '？？？' }),
      el('div', { class: 'pb-pre', text: 'まだだれも知らない、幻の職業。\nきわめておく職業の、どちらかをきわめると、名前と条件がここに書きこまれる。' }));
    // うわさ（きわめておく 職業を はじめた ときだけ。名前は 出さない）
    if (JOB_HINTS[r.id] && PHANTOM_JOBS[r.id]?.masters.some((m) => c?.jobs?.[m])) box.append(el('div', { class: 'pb-hint', text: `うわさ：${JOB_HINTS[r.id]}` }));
    return box;
  }
  box.append(el('div', { class: 'pb-name', text: r.name }));
  box.append(el('div', { class: 'pb-sec', text: 'きわめておく職業' }));
  for (const m of r.masters) {
    box.append(el('div', { class: 'pb-master' }, el('span', { class: m.done ? 'ok' : 'muted', text: m.done ? '✔' : '・' }), el('span', { text: m.name })));
  }
  box.append(el('div', { class: 'pb-sec', text: 'やりこみの条件（どの職業の時でも数える）' }));
  for (const x of r.conds) {
    const pct = Math.max(0, Math.min(100, (x.now / x.goal) * 100));
    box.append(el('div', { class: `pb-cond ${x.done ? 'done' : ''}` },
      el('div', { class: 't', text: `${x.done ? '✔ ' : ''}${x.text}` }),
      el('div', { class: 'pb-meter' }, el('div', { class: 'pb-bar' }, el('i', { style: { width: `${pct}%` } })), el('span', { class: 'pb-num', text: `${bigNum(x.now)}/${bigNum(x.goal)}` }))));
  }
  if (r.got) box.append(el('div', { class: 'pb-ready', text: '★この職業になったことがある。神殿でいつでも転職できる。' }));
  else if (r.ready) box.append(el('div', { class: 'pb-ready', text: r.live ? '★条件がそろった！ルミナの町の神殿で転職できる。' : '★条件がそろった！（この職業は、まだじゅんびちゅう）' }));
  return box;
}

// 第66回: パーティーの みんなの ぶんも 見る（家族が ねがった）。サーバーの phantomPeople（world/phantom.js）
//   いちばん上の「◀ 〇〇の幻の書 ▶」を えらぶ（左右・タップ）と、見る 人が かわる。1人だけの ときは 出さない
const WHO = '__pb_who';
// サーバーに みんなの ぶんを たのむ（shop.js の request と 同じ しくみ。shop.js を よむと じゅんかんに なるので ここに 書く）
function askPeople(game) {
  return new Promise((resolve) => {
    if (!game?.net?.send) return resolve(null);
    game.svcWaiter = resolve;
    game.net.send({ t: 'svc', kind: 'phantomBook' });
    setTimeout(() => {
      if (game.svcWaiter === resolve) {
        game.svcWaiter = null;
        resolve(null);
      }
    }, 6000);
  });
}
let lastWho = 'self';

// menu: FieldMenu（mkSub・back を 使う）。active: えらべる 画面か（false は 右の 見本）
// state: { people, i }（サーバーから もらった みんなの ぶん。まだ ない ときは 自分だけ）
export function phantomBookView(menu, active, state = null) {
  addCss();
  const me = menu.game.me;
  const people = state?.people || [{ key: 'self', name: me.name, tag: '自分', rows: phantomBook(me), jobs: me.jobs }];
  const pi = Math.max(0, Math.min(people.length - 1, state?.i ?? 0));
  const who = people[pi];
  const rows = who.rows;
  const c = who.key === 'self' ? me : { jobs: who.jobs };
  const box = el('div', { class: 'items-view pb-view' });
  if (!active) {
    const n = rows.filter((r) => r.known).length;
    box.append(el('div', { class: 'muted', text: `伝説の職業の、さらに上にある「幻の職業」の書。\nきわめておく職業と、やりこみの条件のすすみぐあいを見る。（パーティーの仲間のぶんも見られる）\n見つけた幻の職業　${n}/${rows.length}` }));
    return box;
  }
  const detail = el('div', { class: 'detail item-detail pb-body' });
  const show = (it) => {
    detail.innerHTML = '';
    if (it?.value === WHO) {
      detail.append(el('div', { class: 'pb-pre', text: `今は、${who.name}（${who.tag}）の幻の書を見ている。\n選ぶか左右で、見る人をかえられる。` }));
      return;
    }
    const r = rows.find((x) => x.id === it?.value);
    if (r) detail.append(detailOf(r, c));
    detail.scrollTop = 0;
  };
  // 見る 人を かえる（同じ 画面を つくりなおす）
  const swap = (d) => {
    const i = (pi + d + people.length) % people.length;
    lastWho = people[i].key;
    menu.sfx?.('cursor');
    menu.showView(() => phantomBookView(menu, true, { people, i }), 0);
  };
  const items = rows.map((r) => ({
    label: r.name,
    value: r.id,
    right: mark(r),
    rightCls: r.got || r.ready ? 'gold' : '',
    cls: `pb-row ${r.known ? '' : 'unknown'}`,
  }));
  if (people.length > 1) items.unshift({ label: `◀ ${who.name}の幻の書 ▶`, value: WHO, right: `${pi + 1}/${people.length}`, cls: 'pb-row pb-who' });
  const m = menu.mkSub({
    items,
    onMove: (it) => show(it),
    onSelect: (it) => (it?.value === WHO ? swap(1) : show(it)),
    // 左右で 中みを スクロール（コントローラーだけで 下まで 読める）。いちばん上の 行では 見る 人を かえる
    onSide: (d) => (items[m.idx]?.value === WHO ? swap(d > 0 ? 1 : -1) : detail.scrollBy({ top: d * detail.clientHeight * 0.7, behavior: 'smooth' })),
  });
  box.append(m.root, detail);
  show(items[m.idx]);
  // はじめて 開いた とき: みんなの ぶんを もらって、2人 いじょう なら つくりなおす（前に 見ていた 人から）
  if (!state) {
    askPeople(menu.game).then((res) => {
      const list = Array.isArray(res?.people) ? res.people.filter((p) => p && Array.isArray(p.rows)) : [];
      if (list.length < 2 || !box.isConnected || menu.sub !== m) return;
      const i = Math.max(0, list.findIndex((p) => p.key === lastWho));
      menu.showView(() => phantomBookView(menu, true, { people: list, i }), 0);
    });
  }
  return box;
}
