// 第67回: タッチの ボタンを 自分で ならべる（家族が 決めた）
//   ・動かせる 物: 歩く スティック（もとの 場所。さわった 所に 出るのは 今のまま）・A・B・走る（歩く時）、
//     上下左右ボタン・A・B（メニュー・戦い・お店の時）
//   ・たて持ちと よこ持ちは 別々に おぼえる。大きさも かえられる（小・中・大・特大）
//   ・この たんまつだけの 設定（localStorage）。決めて いない 向きは 今までの ならび（ui/hand.js の 右手用・左手用 など）
//   ・場所は 画面の 中の わりあい（まん中の 点）で おぼえる。画面の 大きさが かわっても ずれない
import { el } from './dom.js?v=89330e853b9b';

const KEY = 'kizuna_layout';
export const SIZES = [['小', 0.8], ['中', 1], ['大', 1.25], ['特大', 1.5]];
// group … walk（歩く時）・pad（メニュー・戦いの時）
export const LAYOUT_ITEMS = [
  { id: 'stick', sel: '#stick', name: '歩くスティック', group: 'walk', label: '' },
  { id: 'a', sel: '#btn-a', name: 'A', group: 'walk', label: 'A' },
  { id: 'b', sel: '#btn-b', name: 'B', group: 'walk', label: 'B' },
  { id: 'run', sel: '#btn-run', name: '走る', group: 'walk', label: '走る' },
  { id: 'cross', sel: '#pad-cross', name: '上下左右', group: 'pad', label: '' },
  { id: 'pa', sel: '#pad-ab .pa', name: 'A（メニュー）', group: 'pad', label: 'A' },
  { id: 'pb', sel: '#pad-ab .pb', name: 'B（メニュー）', group: 'pad', label: 'B' },
];
export const GROUP_NAMES = { walk: '歩く時', pad: 'メニュー・戦いの時' };

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const orientOf = (w = innerWidth, h = innerHeight) => (h > w ? 'tate' : 'yoko');
export const ORIENT_NAMES = { tate: 'たて持ち', yoko: 'よこ持ち' };

// 1つぶんを ととのえる（こわれた 値は すてる）
export function cleanSpot(v) {
  if (!isObj(v) || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  const s = SIZES.some(([, k]) => k === v.s) ? v.s : 1;
  return { x: clamp01(v.x), y: clamp01(v.y), s };
}
// 1つの 向きの ぜんぶ（7つ そろって いない ときは 使わない）
export function cleanOrient(v) {
  if (!isObj(v)) return null;
  const out = {};
  for (const it of LAYOUT_ITEMS) {
    const sp = cleanSpot(v[it.id]);
    if (!sp) return null;
    out[it.id] = sp;
  }
  return out;
}

export function loadLayout() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { tate: cleanOrient(v?.tate), yoko: cleanOrient(v?.yoko) };
  } catch {
    return { tate: null, yoko: null };
  }
}
export function saveLayout(orient, spots) {
  const all = loadLayout();
  all[orient] = spots ? cleanOrient(spots) : null;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* */ }
  applyLayout();
}

// 今の 向きの 自分で 決めた ならび（ない ときは null）
export function currentLayout() {
  return loadLayout()[orientOf()] || null;
}

// 1つに 当てる（spot が ない ときは 今までの ならびに もどす）
function place(node, spot) {
  if (!node) return;
  if (!spot) {
    for (const k of ['left', 'top', 'right', 'bottom', 'transform']) node.style[k] = '';
    delete node.dataset.lay;
    return;
  }
  node.style.left = `${(spot.x * 100).toFixed(3)}%`;
  node.style.top = `${(spot.y * 100).toFixed(3)}%`;
  node.style.right = 'auto';
  node.style.bottom = 'auto';
  node.style.transform = `translate(-50%, -50%) scale(${spot.s})`;
  node.dataset.lay = String(spot.s);
}

// 画面に 当てる（はじめ・向きが かわった・決めた とき）
export function applyLayout() {
  if (typeof document === 'undefined') return;
  const lay = currentLayout();
  document.body.classList.toggle('lay-custom', !!lay);
  // メニューの A・B は ふだん 小さな 入れものの 中。自分で 決めた ときは 画面いっぱいの 入れものに する
  const ab = document.getElementById('pad-ab');
  if (ab) {
    for (const [k, v] of Object.entries({ left: '0', top: '0', right: 'auto', bottom: 'auto', width: '100%', height: '100%' })) ab.style[k] = lay ? v : '';
  }
  for (const it of LAYOUT_ITEMS) place(document.querySelector(it.sel), lay?.[it.id] || null);
}

// スティックを もとの 場所に もどす（はなした とき。input.js）
export function homeStickLayout(node) {
  const lay = currentLayout();
  place(node, lay?.stick || null);
}
// スティックを さわった 所に 出す 間は、まん中に よせる ずらしを はずす（大きさは そのまま）
export function floatStickLayout(node) {
  if (node?.dataset.lay) node.style.transform = `scale(${node.dataset.lay})`;
}
// さわった 所が スティックに なる 場所: 自分で 決めた ときは スティックの ある 側（左右）。ほかの ボタンは 自分で さわりを うけとる
export function stickSideOf(w = innerWidth, h = innerHeight) {
  const lay = loadLayout()[orientOf(w, h)];
  if (!lay) return null;
  return lay.stick.x < 0.5 ? 'left' : 'right';
}

let bound = false;
export function bindLayout() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  applyLayout();
  const again = () => setTimeout(applyLayout, 60);
  addEventListener('resize', again);
  addEventListener('orientationchange', again);
}

// ───────────── ならべる 画面 ─────────────
const CSS = `
body.lay-measure #touch, body.lay-measure #pad, body.lay-measure #touch > *, body.lay-measure #pad-ab, body.lay-measure #pad-cross { display: block !important; visibility: hidden !important; }
body.lay-measure #pad-cross { display: grid !important; }
.lay-ed { position: fixed; inset: 0; z-index: 400; background: rgba(4, 6, 24, 0.72); touch-action: none; color: #fff; }
.lay-ed .lay-bar { position: absolute; left: 50%; top: calc(8px + var(--safe-t, 0px)); transform: translateX(-50%); width: min(94vw, 520px);
  background: rgba(10, 12, 40, 0.95); border: 2px solid rgba(255, 255, 255, 0.6); border-radius: 10px; padding: 8px; font-size: 14px; }
.lay-ed .lay-title { font-weight: bold; color: #ffd66b; margin-bottom: 4px; }
.lay-ed .lay-help { font-size: 12px; color: #c8cbe0; margin-bottom: 6px; }
.lay-ed .lay-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; }
.lay-ed button.lb { min-height: 34px; padding: 4px 10px; border-radius: 8px; border: 2px solid rgba(255, 255, 255, 0.55); background: rgba(40, 44, 90, 0.9); color: #fff; font-size: 14px; }
.lay-ed button.lb.on { background: #ffd66b; color: #1a1a2e; border-color: #ffd66b; }
.lay-ed button.lb.ok { background: #3a8a4a; }
.lay-ed .lay-sel { min-width: 7em; color: #ffd66b; }
.lay-ed .lay-g { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); border-radius: 50%; border: 3px dashed rgba(255, 255, 255, 0.85);
  background: rgba(30, 40, 110, 0.55); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #fff; user-select: none; -webkit-user-select: none; }
.lay-ed .lay-g.sel { border-color: #ffd66b; border-style: solid; box-shadow: 0 0 14px rgba(255, 214, 107, 0.9); }
.lay-ed .lay-g.cross { border-radius: 14px; }
.lay-ed .lay-g .cr { font-size: 15px; line-height: 1.05; text-align: center; white-space: pre; }
.lay-ed .lay-g .nm { position: absolute; bottom: -1.5em; left: 50%; transform: translateX(-50%); font-size: 11px; white-space: nowrap; color: #ffe9a8; text-shadow: 0 1px 2px #000; }
`;
function addCss() {
  if (document.getElementById('lay-ed-css')) return;
  document.head.append(el('style', { id: 'lay-ed-css', text: CSS }));
}

// 今 画面に 出ている 大きさと 場所（かくれている 物は 見えない まま 出して はかる）
function measure() {
  const holders = ['touch', 'pad', 'btn-a', 'btn-b', 'btn-run', 'stick'].map((id) => document.getElementById(id)).filter(Boolean);
  const back = holders.map((h) => [h, h.hidden]);
  for (const h of holders) h.hidden = false;
  document.body.classList.add('lay-measure');
  const out = {};
  for (const it of LAYOUT_ITEMS) {
    const node = document.querySelector(it.sel);
    const r = node?.getBoundingClientRect();
    const s = Number(node?.dataset.lay) || 1;
    if (!r || !r.width) { out[it.id] = { x: 0.5, y: 0.8, s: 1, w: 64, h: 64 }; continue; }
    out[it.id] = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight, s, w: r.width / s, h: r.height / s };
  }
  document.body.classList.remove('lay-measure');
  for (const [h, hid] of back) h.hidden = hid;
  return out;
}

// ならべる 画面を 開く（メニューの「設定」から）。おわると resolve
export function layoutEditor(game) {
  addCss();
  return new Promise((resolve) => {
    const orient = orientOf();
    const spots = measure();
    const root = el('div', { class: 'lay-ed' });
    let group = 'walk';
    let sel = 'stick';
    const ghosts = {};
    const selName = el('span', { class: 'lay-sel' });
    const sizeBtns = SIZES.map(([nm, k]) => el('button', { class: 'lb', text: nm, onclick: () => setSize(k) }));
    const tabBtns = Object.entries(GROUP_NAMES).map(([g, nm]) => el('button', { class: 'lb', text: nm, onclick: () => setGroup(g) }));
    const done = (saved) => {
      removeEventListener('resize', onTurn);
      root.remove();
      game?.audio?.sfx?.(saved ? 'confirm' : 'cancel');
      resolve(saved);
    };
    const bar = el('div', { class: 'lay-bar' },
      el('div', { class: 'lay-title', text: `ボタンの配置（${ORIENT_NAMES[orient]}）` }),
      el('div', { class: 'lay-help', text: 'ボタンを指で動かす。えらんだボタンは大きさもかえられる。\nスティックは、ここが「いつもの場所」。さわった所に出るのは今のまま。' }),
      el('div', { class: 'lay-row' }, ...tabBtns),
      el('div', { class: 'lay-row' }, selName, ...sizeBtns),
      el('div', { class: 'lay-row' },
        el('button', { class: 'lb ok', text: '決定', onclick: () => { saveLayout(orient, Object.fromEntries(LAYOUT_ITEMS.map((it) => [it.id, spots[it.id]]))); done(true); } }),
        el('button', { class: 'lb', text: 'もとにもどす', onclick: () => { saveLayout(orient, null); done(true); } }),
        el('button', { class: 'lb', text: 'やめる', onclick: () => done(false) })));
    bar.querySelector('.lay-help').style.whiteSpace = 'pre-line';
    root.append(bar);
    const draw = (id) => {
      const g = ghosts[id], sp = spots[id];
      g.style.left = `${sp.x * innerWidth}px`;
      g.style.top = `${sp.y * innerHeight}px`;
      g.style.width = `${sp.w * sp.s}px`;
      g.style.height = `${sp.h * sp.s}px`;
      g.classList.toggle('sel', id === sel);
      g.hidden = LAYOUT_ITEMS.find((x) => x.id === id).group !== group;
    };
    const drawAll = () => {
      for (const it of LAYOUT_ITEMS) draw(it.id);
      const it = LAYOUT_ITEMS.find((x) => x.id === sel);
      selName.textContent = `えらんだ物：${it.name}`;
      sizeBtns.forEach((b, i) => b.classList.toggle('on', SIZES[i][1] === spots[sel].s));
      tabBtns.forEach((b, i) => b.classList.toggle('on', Object.keys(GROUP_NAMES)[i] === group));
    };
    const setGroup = (g) => {
      group = g;
      sel = LAYOUT_ITEMS.find((x) => x.group === g).id;
      drawAll();
    };
    const setSize = (k) => {
      spots[sel].s = k;
      drawAll();
    };
    for (const it of LAYOUT_ITEMS) {
      const g = el('div', { class: `lay-g ${it.id === 'cross' ? 'cross' : ''}` });
      if (it.id === 'cross') g.append(el('span', { class: 'cr', text: '　▲　\n◀　▶\n　▼　' }));
      else if (it.label) g.append(el('span', { text: it.label }));
      g.append(el('span', { class: 'nm', text: it.name }));
      let drag = null;
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sel = it.id;
        drag = { id: e.pointerId, dx: e.clientX - spots[it.id].x * innerWidth, dy: e.clientY - spots[it.id].y * innerHeight };
        try { g.setPointerCapture(e.pointerId); } catch { /* */ }
        drawAll();
      });
      g.addEventListener('pointermove', (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        spots[it.id].x = clamp01((e.clientX - drag.dx) / innerWidth);
        spots[it.id].y = clamp01((e.clientY - drag.dy) / innerHeight);
        draw(it.id);
      });
      const end = () => { drag = null; };
      g.addEventListener('pointerup', end);
      g.addEventListener('pointercancel', end);
      ghosts[it.id] = g;
      root.append(g);
    }
    // とちゅうで 向きを かえたら やめる（向きごとに 決めるので）
    const onTurn = () => { if (orientOf() !== orient) done(false); };
    addEventListener('resize', onTurn);
    document.body.append(root);
    drawAll();
  });
}
