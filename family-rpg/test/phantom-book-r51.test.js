// 第51回 F: メニューの「幻の書」（client/ui/phantom-book.js）を にせの DOM で うごかす（コントローラーの 上下・A・B）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

class FakeEl {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.style = { setProperty() {} };
    this.attrs = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.isConnected = true;
    this.scrollTop = 0;
    this.clientHeight = 100;
    this.scrolled = 0;
    this.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, f) { this.listeners[k] = f; }
  append(...kids) { for (const k of kids) this.children.push(k); }
  prepend(...kids) { this.children.unshift(...kids); }
  remove() { this.isConnected = false; }
  focus() {}
  blur() {}
  scrollBy({ top }) { this.scrolled += top; }
  get lastElementChild() { return this.children[this.children.length - 1]; }
}
globalThis.Node = FakeEl;
Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [] }, configurable: true, writable: true });
globalThis.document = {
  createElement: (t) => new FakeEl(t),
  createTextNode: (t) => ({ text: t }),
  getElementById: () => null,
  head: new FakeEl('head'),
  body: null,
};
const texts = (e) => [e.textContent, ...(e.children || []).flatMap((k) => (k instanceof FakeEl ? texts(k) : []))].filter(Boolean);
const { ListMenu } = await import('../public/js/client/ui/dom.js');
const { phantomBookView } = await import('../public/js/client/ui/phantom-book.js');

const fakeInput = () => {
  const stack = [];
  return { stack, push(h) { stack.push(h); return h; }, pop(h) { const i = stack.lastIndexOf(h); if (i >= 0) stack.splice(i, 1); }, emit(a, rep) { stack[stack.length - 1]?.onNav?.(a, rep); } };
};
function fakeMenu(me) {
  const input = fakeInput();
  const menu = { game: { me, input }, backs: 0, sub: null };
  menu.mkSub = (opts) => (menu.sub = new ListMenu(input, { onCancel: () => menu.backs++, ...opts }));
  return { menu, input };
}

test('幻の書: 12行。はじめは ？？？・きわめると 名前と メーター。コントローラーの 上下で 中みが かわる・B で もどる', () => {
  const me = { name: 'ユイ', look: { body: 1 }, job: 'warrior', jobs: { warrior: { lv: 3 }, creator: { lv: 10 } }, feats: { use: { support: 300 }, heal: 12000, big5000: 2 } };
  const { menu, input } = fakeMenu(me);
  // 右の 見本（えらぶ 前）
  const pv = phantomBookView(menu, false);
  assert.ok(texts(pv).some((t) => t.includes('見つけた幻の職業　2/12')), texts(pv).join('/'));
  const box = phantomBookView(menu, true);
  const m = menu.sub;
  assert.equal(m.items.length, 12);
  assert.equal(m.items.filter((it) => it.label === '？？？').length, 10);
  const ai = m.items.find((it) => it.value === 'facility_ai');
  assert.equal(ai.label, '天才しせつ管理者AI');
  assert.equal(ai.right, '0/2');
  m.focus();
  const detail = box.children[1];
  assert.ok(texts(detail).includes('？？？'), 'はじめの 行は ？？？');
  // 下へ 3つ → 天才しせつ管理者AI
  for (let i = 0; i < 3; i++) input.emit('down');
  const t = texts(detail);
  assert.ok(t.includes('天才しせつ管理者AI'), t.join('/'));
  assert.ok(t.includes('✔') && t.includes('クリエイター') && t.includes('天才しせつ管理者'));
  assert.ok(t.includes('補助の技を1500回使う') && t.includes('300/1500'), t.join('/'));
  assert.ok(t.includes('1.2万/5万'), t.join('/'));
  // 左右で 中みを スクロール
  input.emit('right');
  assert.ok(detail.scrolled > 0);
  // B で もどる
  input.emit('b');
  assert.equal(menu.backs, 1);
});

test('幻の書: メニューに 1行・スマホの せまい 画面の CSS・漢字の きまり', async () => {
  const menuSrc = fs.readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(menuSrc, /\{ label: '幻の書', value: 'phantom' \}/);
  assert.match(menuSrc, /case 'phantom': return this\.focusSub\(phantomBookView\(this, true\)\);/);
  const src = fs.readFileSync(new URL('../public/js/client/ui/phantom-book.js', import.meta.url), 'utf8');
  assert.match(src, /@media \(max-width: 420px\)/);
  assert.match(src, /\.pb-bar \{[^}]*min-width: 0/);
  const { gameFiles, checkFile } = await import('../tools/kanji-check.mjs');
  const files = gameFiles();
  for (const f of ['client/ui/phantom-book.js', 'shared/data/phantom.js', 'shared/world/phantom.js']) {
    const full = files.find((x) => x.endsWith(f));
    assert.ok(full, `${f} は 漢字の チェックの 一覧に ある`);
    assert.deepEqual(checkFile(full), [], f);
  }
});
