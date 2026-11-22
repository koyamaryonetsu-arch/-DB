// 第96回 U班（画面の 使いやすさ）: 家族の 声 2つ
//   1. 道具の まどで 装備品を 見る 時、紹介が 長いと 一覧が せまく なる → 紹介の らんは 高さを きめて 中だけ スクロール。
//      いちばん 上に 強さと 効果（client/ui/info.js の gearSummary・gearDetailHtml）
//   2. タップは 1回めで えらぶ（カーソル）・同じ 所を もう1回で 決定（一覧の まど）。スクロールを 指で 止める タップは なにも しない。
//      はい・いいえ・コマンド・的を えらぶ 所は 1回で 決定。設定「タップ1回で決定：ON」で 今までどおり（client/ui/dom.js の ListMenu）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkFile } from '../tools/kanji-check.mjs';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');

// ちいさな にせの DOM（dom.js の el・ListMenu が うごく ぶんだけ。test/menu-pad-r50.test.js と おなじ 形）
class FakeEl {
  constructor(tag) {
    this.tagName = tag.toUpperCase();
    this.nodeType = 1;
    this.parentElement = null;
    this.children = [];
    this.style = { setProperty() {} };
    this.attrs = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.isConnected = true;
    const cls = new Set();
    this.classList = { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, on) => ((on ?? !cls.has(c)) ? cls.add(c) : cls.delete(c)), contains: (c) => cls.has(c) };
  }
  set innerHTML(v) { if (v === '') this.children = []; }
  get innerHTML() { return ''; }
  setAttribute(k, v) { this.attrs[k] = v; }
  addEventListener(k, f) { this.listeners[k] = f; }
  append(...kids) { for (const k of kids) { if (k instanceof FakeEl) k.parentElement = this; this.children.push(k); } }
  prepend(...kids) { this.children.unshift(...kids); }
  remove() { this.isConnected = false; }
  get lastElementChild() { return this.children[this.children.length - 1]; }
}
globalThis.Node = FakeEl;
globalThis.document = { createElement: (t) => new FakeEl(t), createTextNode: (t) => ({ text: t }), getElementById: () => new FakeEl('div'), body: null };
const dom = await import('../public/js/client/ui/dom.js');
const { ListMenu, TAP } = dom;
const { gearSummary, gearDetailHtml } = await import('../public/js/client/ui/info.js');
const { ITEMS } = await import('../public/js/shared/data/items.js');

const fakeInput = () => {
  const stack = [];
  return { stack, push(h) { stack.push(h); return h; }, pop(h) { const i = stack.lastIndexOf(h); if (i >= 0) stack.splice(i, 1); }, emit(a) { stack[stack.length - 1]?.onNav?.(a); } };
};
const rows = (n = 6) => Array.from({ length: n }, (_, i) => ({ label: `品${i}`, value: i }));
function menu(opts = {}) {
  const got = [];
  const moved = [];
  const m = new ListMenu(fakeInput(), { items: rows(), onSelect: (it) => got.push(it.value), onMove: (it) => moved.push(it.value), ...opts });
  m.focus();
  return { m, got, moved };
}
const reset = () => { TAP.down = null; TAP.last = new WeakMap(); ListMenu.tapOnce = false; };

// ───────────── 2. タップの きまり ─────────────
test('一覧の まど（list）: 1回めの タップは カーソルだけ・同じ 行を もう1回で 決定・ちがう 行は うつる だけ', () => {
  reset();
  const { m, got, moved } = menu({ list: true });
  m.tap(2);
  assert.equal(m.idx, 2, '1回めで カーソルが 合う');
  assert.deepEqual(got, [], '1回めは 決定しない');
  assert.deepEqual(moved.slice(-1), [2], 'せつめいも その 行に かわる（onMove）');
  m.tap(4);
  assert.equal(m.idx, 4);
  assert.deepEqual(got, [], 'ちがう 行も 決定しない');
  m.tap(4);
  assert.deepEqual(got, [4], '同じ 行を もう1回 → 決定');
});

test('一覧の まど: はじめから カーソルの ある 行でも、1回めの タップでは 決定しない（家族の 声）', () => {
  reset();
  const { m, got } = menu({ list: true });
  assert.equal(m.idx, 0);
  m.tap(0);
  assert.deepEqual(got, [], 'カーソルの ある 行を 1回 → まだ');
  m.tap(0);
  assert.deepEqual(got, [0], 'もう1回で 決定');
  // キーで うごかした あとの タップも 1回めは えらぶ だけ
  m.input.emit('down');
  assert.equal(m.idx, 1);
  m.tap(1);
  assert.deepEqual(got, [0], 'キーで カーソルを 合わせた 行も タップは 2回');
  m.tap(1);
  assert.deepEqual(got, [0, 1]);
});

test('キーボード・十字ボタンは かわらない（上下で 動かして 決定）', () => {
  reset();
  const { m, got } = menu({ list: true });
  m.input.emit('down');
  m.input.emit('down');
  m.input.emit('a');
  assert.deepEqual(got, [2]);
});

test('1回で 決定の まど（list なし: はい・いいえ・コマンド・的）は 1回の タップで 決定', () => {
  reset();
  const { m, got } = menu();
  m.tap(3);
  assert.deepEqual(got, [3]);
  const yes = menu({ items: [{ label: 'はい', value: true }, { label: 'いいえ', value: false }] });
  yes.m.tap(1);
  assert.deepEqual(yes.got, [false]);
});

test('設定「タップ1回で決定：ON」: 今までどおり（カーソルの 行は 1回で 決定。tapConfirm の まどは ちがう 行で せつめい だけ）', () => {
  reset();
  ListMenu.tapOnce = true;
  const a = menu({ list: true });
  a.m.tap(0);
  assert.deepEqual(a.got, [0], 'ON: カーソルの 行は 1回で 決定');
  a.m.tap(3);
  assert.deepEqual(a.got, [0, 3], 'ON（tapConfirm なし）: ちがう 行も 1回で 決定（今までの マウス・PC）');
  const b = menu({ list: true, tapConfirm: true });
  b.m.tap(3);
  assert.deepEqual(b.got, [], 'ON（tapConfirm。今までの スマホの 道具・技）: ちがう 行は せつめい だけ');
  b.m.tap(3);
  assert.deepEqual(b.got, [3]);
  reset();
});

test('スクロールが 動いて いる 時の タップ（指で 止める）・なぞった 時は、カーソルも 決定も しない', () => {
  reset();
  const { m, got } = menu({ list: true });
  const scroller = new FakeEl('div');
  scroller.append(m.root);
  const t = performance.now();
  // 指を おく 0.05秒 前まで 一覧の まどが 動いて いた
  TAP.last.set(scroller, t - 50);
  TAP.down = { x: 100, y: 200, t };
  const ev = { clientX: 100, clientY: 200, detail: 1 };
  m.tap(3, ev);
  assert.equal(m.idx, 0, 'カーソルは うごかない');
  assert.deepEqual(got, [], '決定しない');
  // 止まって から（SCROLL_STOP_MS より 前に 止まった）の タップは ふつう
  TAP.last.set(scroller, t - TAP.SCROLL_STOP_MS - 300);
  m.tap(3, ev);
  assert.equal(m.idx, 3);
  m.tap(3, ev);
  assert.deepEqual(got, [3]);
  // 指を おいて いる 間に スクロールした（なぞった）
  TAP.last.set(scroller, t + 120);
  m.tap(4, ev);
  assert.equal(m.idx, 3, 'なぞって スクロールした あとの はなす タップは なにも しない');
  // 指を おいた 所から 大きく 動いた（なぞった）
  TAP.last = new WeakMap();
  m.tap(5, { clientX: 100, clientY: 200 + TAP.DRAG_PX + 30, detail: 1 });
  assert.equal(m.idx, 3);
  // 1回で 決定の まどでも おなじ（スクロールを 止めた タップで 決まらない）
  const one = menu();
  scroller.append(one.m.root);
  TAP.last.set(scroller, t - 20);
  one.m.tap(2, ev);
  assert.deepEqual(one.got, []);
  reset();
});

test('タップの 決まりの 中み: ListMenu.tap・設定の 保存（この 端末の localStorage）・「もう一度タップで決定」', () => {
  const d = src('js/client/ui/dom.js');
  assert.match(d, /onclick: \(e\) => \{\s*e\.stopPropagation\(\);\s*this\.tap\(i, e\);/, '行の クリック（タップ）は tap() へ');
  assert.match(d, /localStorage\.getItem\('kizuna_tap1'\) === '1'/);
  assert.match(d, /export const TAP_HINT = 'もう一度タップで決定';/);
  assert.match(d, /document\.addEventListener\('scroll',[\s\S]*capture: true/, 'スクロールは どの まども 見る（capture）');
  assert.match(d, /markProgScroll\(\);/, 'カーソルの 行を 見せる スクロールは 数えない');
  assert.equal(ListMenu.tapOnce, false, 'はじめは OFF（2回で 決定）');
  // 設定は キャラの セーブ・引っこしコードに 入れない（サーバーは 知らない）
  for (const f of ['shared/world/services.js', 'shared/stats.js']) {
    const p = new URL(`../public/js/${f}`, import.meta.url);
    if (fs.existsSync(p)) assert.ok(!/kizuna_tap1|tapOnce/.test(fs.readFileSync(p, 'utf8')), f);
  }
  const css = src('css/style.css');
  assert.match(css, /\.tap-hint \{[^}]*position: fixed/);
  assert.match(css, /\.tap-hint \{[^}]*pointer-events: none/, 'ヒントの 上を タップしても じゃまに ならない');
});

test('どの まどが「一覧（2回）」か「えらぶ（1回）」か（まどの しゅるいで きめる）', () => {
  const m = src('js/client/ui/menu.js');
  // メニューの 中の 画面（道具・装備・呪文・特技・職業・仲間・作戦・図鑑・設定・お知らせ・けいじ板 など）は 一覧
  assert.match(m, /mkSub\(opts\) \{[\s\S]*?new ListMenu\(this\.game\.input, \{ sound: this\.sfx, onCancel: \(\) => this\.back\(\), start, list: true, \.\.\.opts \}\)/);
  assert.equal((m.match(/\{ label: 'もどる', value: 'back' \}\], list: false,/g) || []).length, 3, '「もどる」だけの 画面は 1回');
  // pick は 1回（どうする？・はい／いいえ）。行き先・装備を えらぶ・見た目は 一覧
  assert.match(m, /pick\(title, items, \{ wide = false, big = false, tapConfirm = false, list = false,/);
  assert.equal((m.match(/warpChoices\(\), \{ label: 'やめる', value: null \}\], \{ list: true \}\)/g) || []).length, 2, 'どこへ飛ぶ？（町の 一覧）');
  assert.match(m, /big: true, tapConfirm: touch, list: true,/, '装備を えらぶ まど');
  assert.match(m, /cls: 'look-pick', start: cur, head: \(\) => pv, list: true,/);
  // メインの コマンド（はなす・道具…）は 1回（戦いの コマンドと おなじ）
  assert.ok(!/this\.menu = new ListMenu\(g\.input, \{[^}]*list: true/.test(m));
  // 戦い: 呪文・特技・道具の 一覧（tapConfirm の 一覧）だけ 2回。コマンド・的は 1回
  const b = src('js/client/battle.js');
  assert.match(b, /list: tapConfirm,/);
  // かくにんの まど（はい・いいえ）は 1回
  const d = src('js/client/ui/dom.js');
  const cb = d.slice(d.indexOf('export function confirmBox'), d.indexOf('export function bar'));
  assert.ok(cb.includes('new ListMenu') && !/list: true/.test(cb));
  // お店（せつめいの ある 品物の 一覧）は 2回、買う・売る などは 1回。お金の 数・作品の 力の 入れかえ・闘技場の コマンドは 1回
  const ct = src('js/client/ui/counter.js');
  assert.match(ct, /pick\(items, \{ box = 'list', onMove, back = 'もどる', start = null, list = !!onMove && box === 'list' \} = \{\}\)/);
  assert.match(src('js/client/ui/bank.js'), /back: 'もどる', list: false, onMove/);
  assert.match(src('js/client/ui/alchemy.js'), /back: null, list: false, onMove/);
  assert.match(src('js/client/ui/monarena.js'), /back: null, start, list: false, onMove: \(x\) => ct\.info\(mainInfo/);
  // いらい板・しおり・音楽・宝の地図・転職・仲間・星のかけら は 一覧
  for (const f of ['missions.js', 'shiori.js', 'soundtest.js', 'treasure.js', 'services.js']) assert.match(src(`js/client/ui/${f}`), /list: true/, f);
  // 物語の えらぶ 問い・数を えらぶ まどは 1回
  assert.ok(!/list: true/.test(src('js/client/ui/script.js')));
  assert.ok(!/list: true/.test(src('js/client/ui/gift.js')));
});

test('設定に「タップ1回で決定：ON／OFF」（はじめは OFF）', () => {
  const m = src('js/client/ui/menu.js');
  assert.match(m, /\{ label: `タップ1回で決定：\$\{ListMenu\.tapOnce \? 'ON' : 'OFF'\}`, value: 'tap1' \}/);
  assert.match(m, /it\.value === 'tap1'\) \{\s*setTapOncePref\(!tapOncePref\(\)\);/);
});

// ───────────── 1. 装備品の 紹介 ─────────────
test('装備品の 紹介: いちばん 上に 強さと 効果（作品の力・使う・そろい）、その 下に 今までの 文', () => {
  const id = 'r88_keisei+2';
  assert.ok(ITEMS[id]);
  const s = gearSummary(id);
  // 伝説の 品の 数字は、その 種類の 今 いちばん 強い 品に 合わせて 上がる（fitR88Legends）。数を 書かずに 今の 守備と くらべる
  assert.ok(ITEMS[id].def >= 184, `守備 ${ITEMS[id].def}`);
  assert.match(s.stats, new RegExp(`守備\\+${ITEMS[id].def}(?!\\d)`));
  assert.match(s.rank, /★★★★★（ランク10）/);
  assert.ok(s.fx.some((t) => /^作品の力：みかわし\+8/.test(t)), s.fx.join('|'));
  assert.ok(s.fx.some((t) => /^使う：けい世元じょうのまどわし（1つの戦いで1回）$/.test(t)), '使う は 1行で');
  assert.ok(s.fx.some((t) => /^そろい：スーパー宝貝/.test(t)));
  assert.ok(s.fx.every((t) => !t.includes('\n')), '効果は 1つ 1行');
  assert.equal(s.more[0], ITEMS[id].desc, 'くわしい 文の はじめは ものがたりの 文');
  assert.ok(s.more.some((t) => /羽衣をひるがえして/.test(t)), '使う 技の せつめいは 下に');
  assert.ok(s.more.some((t) => /^装備: /.test(t)), 'だれが 装備できるか（長い 文）は 下に');
  const h = gearDetailHtml(id);
  const iStr = h.indexOf('強さ'), iFx = h.indexOf('効果'), iDesc = h.indexOf(ITEMS[id].desc);
  assert.ok(iStr >= 0 && iFx > iStr && iDesc > iFx, '強さ → 効果 → 紹介の 文 の じゅん');
  assert.match(h, /^<div class="gd-sum">/);
  // 装備では ない 物は 今までどおり
  assert.equal(gearSummary('herb'), null);
  assert.equal(gearDetailHtml('herb'), '');
});

test('装備品の 紹介: 今 つけて いる 人に とって 上がるか 下がるか（装備の まどと おなじ 色）・だれが 装備できるか（短く）', () => {
  const c = { job: 'warrior', level: 10, equip: { weapon: 'iron_sword' }, seeds: {}, jobs: { warrior: { lv: 1 } }, items: [], status: {} };
  assert.ok(ITEMS.iron_sword && ITEMS.steel_sword);
  const s = gearSummary('steel_sword', { char: c, can: [{ name: 'A', can: true }, { name: 'B', can: false }] });
  assert.match(s.stats, /eq-own/);
  assert.match(s.stats, /eq-d (up|down)/, '今の 武器との 差に 色');
  assert.equal(s.can, '装備できる：A');
  assert.equal(gearSummary('steel_sword', { can: [{ name: 'A', can: true }, { name: 'B', can: true }] }).can, 'みんな装備できる');
  assert.equal(gearSummary('steel_sword', { can: [{ name: 'A', can: false }] }).can, '装備できる人がいない');
});

test('道具の まど: 紹介の らんは 高さを きめて 中だけ スクロール（一覧は 6わり いじょう）・つづきの ▼・Q・E で 読める', () => {
  const css = src('css/style.css');
  const m = /\.fmenu \.main > \.items-view\.inv-view > \.item-detail \{([^}]*)\}/.exec(css);
  assert.ok(m, 'inv-view の せつめい');
  const h = Number(/(?:^|;)\s*height: (\d+)%/.exec(m[1])?.[1]);
  const mh = Number(/max-height: (\d+)%/.exec(m[1])?.[1]);
  assert.ok(h > 0 && h <= 30 && mh <= 30, `高さは まどの 3わり まで（${h}%）`);
  assert.match(m[1], /overscroll-behavior: contain/, '中だけ スクロール（まわりは 動かない）');
  assert.match(css, /\.item-detail\.more::after[^{]*\{[^}]*content: '▼'[^}]*position: sticky/);
  assert.match(css, /\.items-view > \.menu \{[^}]*flex: 1 1 auto[^}]*overflow-y: auto/, '一覧は のこりを ぜんぶ');
  const menu = src('js/client/ui/menu.js');
  const il = menu.slice(menu.indexOf('  itemsList(active'), menu.indexOf('  async itemAction('));
  assert.match(il, /box\.classList\.add\('inv-view'\)/);
  assert.match(il, /gearDetailHtml\(it\.value, \{ char: c,/, '装備品は 強さと 効果が 先');
  assert.match(il, /moreMark\(detail\)/);
  assert.match(il, /onLR: \(d\) => \{ if \(scrollStep\(detail, true, d\)\) moreMark\(detail\); \}/, 'Q・E（L・R）で せつめいを スクロール');
  // お店の せつめいも 強さの 下に 効果（同じ 形）
  const ct = src('js/client/ui/counter.js');
  assert.match(ct, /gearSummary\(id, \{ who: game\.me \}\)\?\.fx/);
  assert.match(ct, /moreMark\(this\.infoBox\)/);
});

test('moreMark: つづきが ある 時だけ ▼（.more）', () => {
  const box = new FakeEl('div');
  Object.assign(box, { scrollHeight: 500, clientHeight: 100, scrollTop: 0 });
  dom.moreMark(box);
  assert.equal(box.classList.contains('more'), true);
  box.scrollTop = 400;
  box.listeners.scroll();
  assert.equal(box.classList.contains('more'), false, 'いちばん 下まで 読んだら けす');
});

test('第96回の 文は 漢字の きまりを まもる', () => {
  for (const f of ['js/client/ui/dom.js', 'js/client/ui/info.js', 'js/client/ui/menu.js', 'js/client/ui/counter.js', 'js/shared/gear-r88-view.js']) {
    assert.deepEqual(checkFile(new URL(`../public/${f}`, import.meta.url).pathname).filter((x) => x.kind !== 'kana'), [], f);
  }
});
