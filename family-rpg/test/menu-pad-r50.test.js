// 第50回 N2: スマホの 5人旅の メニューの 体力表示（A）・コントローラーで 強さの 画面を スクロール・配合の 名前を A で 決める（C）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkFile } from '../tools/kanji-check.mjs';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');

// ちいさな にせの DOM（dom.js の el・askText・ListMenu が うごく ぶんだけ）
class FakeEl {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.style = { setProperty() {} };
    this.attrs = {};
    this.listeners = {};
    this.value = '';
    this.className = '';
    this.textContent = '';
    this.isConnected = true;
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  setAttribute(k, v) { this.attrs[k] = v; if (k === 'value') this.value = v; }
  addEventListener(k, f) { this.listeners[k] = f; }
  append(...kids) { for (const k of kids) this.children.push(k); }
  prepend(...kids) { this.children.unshift(...kids); }
  remove() { this.isConnected = false; }
  focus() {}
  blur() {}
  get lastElementChild() { return this.children[this.children.length - 1]; }
}
globalThis.Node = FakeEl;
const uiEl = new FakeEl('div');
let pads = [];
Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => pads }, configurable: true, writable: true });
const texts = (e) => [e.textContent, ...(e.children || []).flatMap((k) => (k instanceof FakeEl ? texts(k) : []))];
globalThis.document = {
  createElement: (t) => new FakeEl(t),
  createTextNode: (t) => ({ text: t }),
  getElementById: () => uiEl,
  body: null,
};
const dom = await import('../public/js/client/ui/dom.js');

const fakeInput = () => {
  const stack = [];
  return { stack, push(h) { stack.push(h); return h; }, pop(h) { const i = stack.lastIndexOf(h); if (i >= 0) stack.splice(i, 1); }, emit(a, rep) { stack[stack.length - 1]?.onNav?.(a, rep); } };
};

test('C: 名前を 書く まど（askText）は コントローラーの A で 決まる（書いて いなければ はじめの 名前）', async () => {
  const input = fakeInput();
  const p = dom.askText(input, { title: '生まれるスライムの名前', max: 8, initial: 'スライム' });
  assert.equal(input.stack.length, 1);
  input.emit('up');
  input.emit('a');
  assert.equal(await p, 'スライム');
  assert.equal(input.stack.length, 0, 'まどを とじたら はずす');
  // B は やめる
  const q = dom.askText(input, { title: 'x', initial: 'あ' });
  input.emit('b');
  assert.equal(await q, null);
  // まだ 見たことがない 子（空のまま → 種族の 名前に なる）
  const r = dom.askText(input, { title: 'x', initial: '', placeholder: '？？？' });
  input.emit('a');
  assert.equal(await r, '');
  // コントローラーが つながって いる ときだけ ヒントを 出す
  uiEl.children = [];
  const h0 = dom.askText(input, { title: 'x' });
  assert.ok(!texts(uiEl).some((t) => /コントローラー/.test(t)));
  input.emit('b');
  await h0;
  pads = [{ connected: true }];
  uiEl.children = [];
  const h1 = dom.askText(input, { title: 'x' });
  assert.ok(texts(uiEl).some((t) => t === 'コントローラー：Aで決定・Bでやめる'));
  input.emit('b');
  await h1;
  pads = [];
});

test('C: 十字キーで スクロール（scrollStep）: たて・よこ。はみ出して いない ときは うごかない', () => {
  const box = { scrollTop: 0, scrollLeft: 0, scrollHeight: 1000, clientHeight: 200, scrollWidth: 300, clientWidth: 300 };
  assert.equal(dom.scrollStep(box, true, 1), true);
  assert.equal(box.scrollTop, 80);
  dom.scrollStep(box, true, 1, true);
  assert.equal(box.scrollTop, 130, 'おしっぱなしは すこし ずつ');
  for (let i = 0; i < 30; i++) dom.scrollStep(box, true, 1);
  assert.equal(box.scrollTop, 800, '下の はしで とまる');
  for (let i = 0; i < 30; i++) dom.scrollStep(box, true, -1);
  assert.equal(box.scrollTop, 0, '上の はしで とまる');
  assert.equal(dom.scrollStep(box, false, 1), false, 'よこに はみ出して いない');
  box.scrollWidth = 700;
  assert.equal(dom.scrollStep(box, false, 1), true);
  assert.equal(box.scrollLeft, 120);
});

test('C: padScroll … 「もどる」だけの 画面で 上下（と 左右）が スクロールに なる。A・B は いつもどおり', () => {
  const input = fakeInput();
  let chosen = 0, canceled = 0;
  const m = new dom.ListMenu(input, { items: [{ label: 'もどる', value: 'back' }], onSelect: () => chosen++, onCancel: () => canceled++ });
  const ys = { scrollTop: 0, scrollHeight: 900, clientHeight: 300, scrollLeft: 0, scrollWidth: 300, clientWidth: 300 };
  const xs = { scrollTop: 0, scrollHeight: 100, clientHeight: 100, scrollLeft: 0, scrollWidth: 800, clientWidth: 300 };
  dom.padScroll(m, { ys: () => ys, xs });
  m.focus();
  input.emit('down');
  input.emit('down');
  assert.equal(ys.scrollTop, 240);
  input.emit('up');
  assert.equal(ys.scrollTop, 120);
  input.emit('right');
  assert.equal(xs.scrollLeft, 120, '全員の 強さの 表は よこにも');
  input.emit('left');
  assert.equal(xs.scrollLeft, 0);
  input.emit('a');
  assert.equal(chosen, 1);
  input.emit('b');
  assert.equal(canceled, 1);
});

test('C: 強さ（くわしい 画面）・全員の 強さは padScroll を つかう', () => {
  const s = src('js/client/ui/menu.js');
  const st = s.slice(s.indexOf('  statusView(who'), s.indexOf('  allStatusView('));
  assert.match(st, /padScroll\(this\.sub, \{ ys: /);
  const all = s.slice(s.indexOf('  allStatusView('), s.indexOf('  partyView(active)'));
  assert.match(all, /padScroll\(this\.sub, \{ ys: .*xs: wrap \}\)/);
  assert.match(all, /class: 'allstat-wrap'/);
});

test('C: 配合の ながれ（受けつぐ 技 → 名前 → たしかめ）は ListMenu と askText（A で 決まる）', () => {
  const s = src('js/client/ui/services.js');
  const b = s.slice(s.indexOf('const breedWith = async'), s.indexOf('const breedPick = async'));
  assert.match(b, /pickSkills\(pv\)/);
  assert.match(b, /askText\(game\.input/);
  assert.match(b, /confirmBox\(game\.input/);
  assert.match(src('js/client/ui/dom.js'), /if \(a === 'a'\) done\(field\.value\.trim\(\)\); else if \(a === 'b'\) done\(null\);/);
});

test('A: 4人いじょうの 旅は メニューの 上を 小さく（.fm-head.many・HP の バー・スマホの たてだけ）', () => {
  const s = src('js/client/ui/menu.js');
  const up = s.slice(s.indexOf('  updateHead() {'), s.indexOf('  close() {'));
  assert.match(up, /classList\.toggle\('many', rows\.length >= 4\)/);
  assert.match(up, /setProperty\('--n'/);
  assert.match(up, /class: `hpb \$\{m\.hpCls\}`/);
  const css = src('css/style.css');
  const i = css.indexOf('第50回 A');
  assert.ok(i > 0);
  const block = css.slice(i, css.indexOf('}\n}', i) + 3);
  assert.match(block, /@media \(max-width: 700px\) and \(orientation: portrait\)/);
  assert.match(block, /\.fm-head\.many \{[^}]*grid-template-areas: "gold close" "party party"/);
  assert.match(block, /\.fm-head\.many \.fm-party \{[^}]*repeat\(var\(--n, 5\)/);
  assert.match(block, /\.fm-head\.many \.fm-mem \.hpb \{ display: block; \}/);
  assert.match(css, /\.fm-mem \.hpb \{ display: none;/, 'ふだんは バーを 出さない');
  // コマンドの 一覧は つぶさない（せつめいの まどを ちぢめる）
  assert.match(block, /\.fmenu-panel:not\(\.sub-open\) \.fmenu \.side \{ flex: none;/);
  assert.match(block, /\.fmenu-panel:not\(\.sub-open\) \.fmenu \.main \{ flex: 0 1 calc\(54vh - var\(--pad-h\)\);/);
});

test('第50回 N2 の 文: 使えない 漢字・スペースが ない', () => {
  for (const f of ['js/client/ui/menu.js', 'js/client/ui/dom.js', 'js/shared/data/difficulty.js']) {
    const p = new URL(`../public/${f}`, import.meta.url).pathname;
    assert.deepEqual(checkFile(p).filter((x) => x.kind !== 'kana'), [], f);
  }
});
