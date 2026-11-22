// 第100回 U1: コントローラーで 戦いの 作戦を かえる
//   ・コマンドの まどに「作戦」（戦いのメニューを 開く。番は 使わない）
//   ・START（9）でも 戦いのメニュー（戦いの 中で、まどが ない 時・コマンドの まどが いちばん 上の 時だけ）
//   ・コントローラーが つながって いる 時の ヒント・あそびかたの 1行
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');

// 小さな にせの DOM（ListMenu・el が 動く だけ）
class FakeNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.attrs = {};
    this.listeners = {};
    this.hidden = false;
    const self = this;
    this.classList = {
      add: (...c) => { for (const x of c) if (!self.className.split(' ').includes(x)) self.className += ` ${x}`; },
      remove: (...c) => { self.className = self.className.split(' ').filter((x) => !c.includes(x)).join(' '); },
      toggle: (c, on) => { const has = self.className.split(' ').includes(c); if (on ?? !has) self.classList.add(c); else self.classList.remove(c); },
      contains: (c) => self.className.split(' ').includes(c),
    };
  }
  get isConnected() { let n = this; while (n.parentElement) n = n.parentElement; return n === FakeNode.root; }
  get lastElementChild() { return this.children[this.children.length - 1] || null; }
  append(...k) { for (const x of k) { if (x.parentElement) x.remove(); x.parentElement = this; this.children.push(x); } }
  prepend(...k) { for (const x of k) { x.parentElement = this; this.children.unshift(x); } }
  after(x) { const p = this.parentElement; if (!p) return; x.parentElement = p; p.children.splice(p.children.indexOf(this) + 1, 0, x); }
  remove() { const p = this.parentElement; if (p) p.children.splice(p.children.indexOf(this), 1); this.parentElement = null; }
  addEventListener(k, f) { (this.listeners[k] ||= []).push(f); }
  setAttribute(k, v) { this.attrs[k] = v; }
  querySelectorAll() { return []; }
  get innerText() { return [this.textContent, ...this.children.map((c) => c.innerText)].join(' '); }
}
FakeNode.root = new FakeNode('body');
function withDom(fn) {
  const keep = { document: globalThis.document, Node: globalThis.Node };
  globalThis.Node = FakeNode;
  globalThis.document = { createElement: (t) => new FakeNode(t), createTextNode: (t) => { const n = new FakeNode('#text'); n.textContent = t; return n; }, getElementById: () => null, body: FakeNode.root };
  try { return fn(); } finally { globalThis.document = keep.document; globalThis.Node = keep.Node; }
}

// にせの 戦いの 画面
function fakeScene({ auto = false } = {}) {
  const stack = [];
  const sent = [];
  const input = {
    stack,
    push(h) { stack.push(h); return h; },
    pop(h) { const i = stack.lastIndexOf(h); if (i >= 0) stack.splice(i, 1); },
    pad: { on: true },
  };
  const me = { id: 'a0', name: 'ソラ', kind: 'player', side: 'ally', tactics: 'balanced', auto, alive: true };
  const mate = { id: 'a1', name: 'ミーナ', kind: 'support', side: 'ally', tactics: 'aggressive', alive: true };
  const root = new FakeNode('div');
  FakeNode.root.append(root);
  const sc = {
    game: { input, audio: { sfx() {} }, net: { send: (m) => sent.push(m) } },
    root,
    c: new Map([[me.id, me], [mate.id, mate]]),
    mine: [me.id],
    primary: me,
    tac: null,
    menu: null,
    sent,
    allies: () => [me, mate],
    canTactics: () => true,
    toggleAuto() { sent.push({ auto: !me.auto }); },
    tacticsMenu(id) { sc.opened = id; },
    closeTactics() { const t = sc.tac; if (!t) return; sc.tac = null; t.menu.blur(); t.box.remove(); sc.menu?.focus(); },
  };
  return sc;
}

test('コマンドの まどに「作戦」: 一覧の さいご・行き先は 戦いのメニュー（番は 使わない）', async () => {
  const b = src('js/client/battle.js');
  const open = b.slice(b.indexOf('  openCommand() {'), b.indexOf('  showMenu('));
  assert.match(open, /items\.push\(TACTICS_CMD\);/, '一覧に 足す');
  assert.match(open, /case 'tactics': return battlePadMenu\(this\);/, '行き先');
  // send（番を 使う）を よばない
  assert.doesNotMatch(open, /case 'tactics':[^\n]*send/);
  // 第3章 第1幕 などの 行は そのまま
  assert.match(open, /case 'c10dring':[^\n]*return c8rCmdPick\(this, a, it\.value\)/);
  assert.match(b, /import \{ bindBattlePad, battlePadMenu, TACTICS_CMD, tacticsToast \} from '\.\/battle-pad\.js';/);
  const { TACTICS_CMD } = await import('../public/js/client/battle-pad.js');
  assert.equal(TACTICS_CMD.label, '作戦');
  assert.equal(TACTICS_CMD.value, 'tactics');
  assert.ok(!TACTICS_CMD.disabled);
});

test('戦いのメニュー: 作戦 → 仲間の 作戦（今の 作戦が 右に）・とじると コマンドの まどに もどる', async () => {
  const { battlePadMenu, TACTICS_CMD } = await import('../public/js/client/battle-pad.js');
  const { ListMenu } = await import('../public/js/client/ui/dom.js');
  withDom(() => {
    const sc = fakeScene();
    // コマンドの まど（いちばん 上）
    const cmd = new ListMenu(sc.game.input, { items: [{ label: '戦う', value: 'attack' }, TACTICS_CMD], onSelect: () => {} });
    sc.menu = cmd;
    cmd.focus();
    assert.equal(battlePadMenu(sc), true);
    assert.ok(sc.tac, '戦いのメニューが 開いた');
    const items = sc.tac.menu.items;
    assert.deepEqual(items.map((x) => x.label), ['オートにする', 'ソラの作戦', 'ミーナの作戦', 'とじる']);
    assert.equal(items[2].right, 'ガンガンいこうぜ', '今の 作戦');
    assert.equal(sc.game.input.stack.at(-1), sc.tac.menu.handler, 'キーは 戦いのメニューへ');
    // A（十字キーで 下・下 → A）で ミーナの 作戦の まどへ
    sc.game.input.stack.at(-1).onNav('down');
    sc.game.input.stack.at(-1).onNav('down');
    sc.game.input.stack.at(-1).onNav('a');
    assert.equal(sc.opened, 'a1');
    assert.equal(sc.sent.length, 0, '番を 使う コマンドは 送らない');
    // もう1回 開いて B → コマンドの まどに もどる
    assert.equal(battlePadMenu(sc), true);
    sc.game.input.stack.at(-1).onNav('b');
    assert.equal(sc.tac, null);
    assert.equal(sc.game.input.stack.at(-1), cmd.handler, 'コマンドの まどに もどった');
  });
});

test('START: 戦いの 中で まどが ない 時・コマンドの まどの 時は 戦いのメニュー。ほかの まど・作戦の まどでは 今までどおり', async () => {
  const { battleStart, bindBattlePad, TACTICS_CMD } = await import('../public/js/client/battle-pad.js');
  const { ListMenu } = await import('../public/js/client/ui/dom.js');
  withDom(() => {
    // まどが ない（オートの 時・待って いる 時）
    const sc = fakeScene({ auto: true });
    assert.equal(battleStart(sc), true);
    assert.equal(sc.tac.menu.items[0].label, 'オートをやめる');
    // 開いて いる 時は うけとらない（B と 同じに とじる）
    assert.equal(battleStart(sc), false);
    sc.closeTactics();
    // コマンドの まどが いちばん 上
    const cmd = new ListMenu(sc.game.input, { items: [{ label: '戦う', value: 'attack' }, TACTICS_CMD], onSelect: () => {} });
    sc.menu = cmd;
    cmd.focus();
    assert.equal(battleStart(sc), true);
    sc.closeTactics();
    // 技の 一覧（作戦の ない まど）は うけとらない
    const list = new ListMenu(sc.game.input, { items: [{ label: 'ホイミ', value: 'hoimi' }], onSelect: () => {}, onCancel: () => {} });
    cmd.blur();
    sc.menu = list;
    list.focus();
    assert.equal(battleStart(sc), false);
    // 合体技の さそい・おわった 戦いでは 開かない
    list.blur();
    sc.invite = {};
    assert.equal(battleStart(sc), false);
    // hot: SELECT（map）と START
    const keep = { setInterval: globalThis.setInterval };
    const sc2 = fakeScene();
    sc2.game.input.hot = null;
    const off = bindBattlePad(sc2);
    assert.equal(sc2.game.input.hot('start'), true);
    assert.equal(sc2.game.input.hot('start'), false, '開いて いる 時は B へ');
    assert.equal(sc2.game.input.hot('map'), true, 'SELECT は とじる');
    assert.equal(sc2.game.input.hot('a'), false);
    off();
    assert.equal(sc2.game.input.hot, null);
    globalThis.setInterval = keep.setInterval;
  });
});

test('input.js: START は 先に hot（戦いの 中だけ）、うけとらなければ 今までどおり B', async () => {
  const inp = src('js/client/input.js');
  assert.match(inp, /if \(\(start && !this\.hot\?\.\('start'\)\) \|\| \(!yKey && top && !start\)\) this\.emit\('b'\);/);
  const keepNav = globalThis.navigator;
  const { Input } = await import('../public/js/client/input.js');
  const gp = { connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [gp] }, configurable: true, writable: true });
  try {
    const mk = (hot) => {
      const x = Object.create(Input.prototype);
      Object.assign(x, { stack: [], held: new Set(), pad: { prev: {}, dir: { x: 0, y: 0 }, repeat: {}, run: false }, quickPad: 6, got: [], hot });
      x.fieldHandler = (a) => x.got.push(a);
      x.onStack = null;
      return x;
    };
    const tap = (x, i) => { gp.buttons[i].pressed = true; x.update(); gp.buttons[i].pressed = false; x.update(); };
    // フィールド（hot なし）: START は 今までどおり B（メニューを 開く）
    const f = mk(null);
    tap(f, 9);
    assert.deepEqual(f.got, ['b']);
    // 戦い: hot が うけとった → B は 出ない
    const asked = [];
    const b1 = mk((a) => { asked.push(a); return a === 'start'; });
    tap(b1, 9);
    assert.deepEqual(asked, ['start']);
    assert.deepEqual(b1.got, []);
    // 戦い: hot が うけとらない → B
    const b2 = mk(() => false);
    tap(b2, 9);
    assert.deepEqual(b2.got, ['b']);
    // SELECT は map
    const b3 = mk((a) => a === 'map');
    tap(b3, 8);
    assert.deepEqual(b3.got, []);
    // 上（3）は 今までどおり B（START と ちがって hot に 聞かない）
    const asked4 = [];
    const b4 = mk((a) => { asked4.push(a); return true; });
    tap(b4, 3);
    assert.deepEqual(asked4, ['b']);
  } finally {
    Object.defineProperty(globalThis, 'navigator', { value: keepNav, configurable: true, writable: true });
  }
});

test('知らせる: ヒント・作戦の 知らせ・あそびかたの 1行', async () => {
  const bp = src('js/client/battle-pad.js');
  assert.ok(bp.includes("text: 'SELECT／START：作戦'"));
  assert.match(bp, /hint\.hidden = !input\.pad\?\.on \|\| btn\.hidden \|\| !!scene\.ended;/, 'コントローラーが ない 時は 出さない');
  assert.match(src('css/style.css'), /\.b-tools \.b-padhint\[hidden\] \{ display: none; \}/);
  // 同じ 作戦を えらんだ 時だけ 知らせる（かえた 時は サーバーの menuRes）
  assert.match(src('js/client/battle.js'), /tacticsToast\(a, it\.value, now\);/);
  assert.match(src('js/shared/world/tactics.js'), /text: `\$\{a\.name\}の作戦を「\$\{TACTICS\[t\]\.name\}」にした。`/);
  const m = src('js/client/ui/menu.js');
  assert.ok(m.includes('戦いの作戦は、コマンドの「作戦」か、味方のつよさのまどをタップで変えられる'));
  assert.ok(m.includes('戦いの作戦: コマンドの「作戦」・Mキー（コントローラーはSELECT・START）'));
  // フィールドの 作戦の 一覧にも「今」
  assert.match(m, /right: k === v\.tac \? '今' : ''/);
  // 戦いの 作戦の まどは 1回で 決定（list なし。A も タップも 1回）
  const b = src('js/client/battle.js');
  const tm = b.slice(b.indexOf('  tacticsMenu(id) {'), b.indexOf('  closeTactics() {'));
  assert.doesNotMatch(tm, /list: true/);
  assert.match(tm, /right: k === now \? '今' : ''/);
});
