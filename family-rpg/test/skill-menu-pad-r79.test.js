// 第79回: 覚えた技の「種類で見る／職業で見る」が コントローラーで 切りかえられない（家族の 報告）
// ・ブラウザの ボタンの 番号は 場所で きまる（0 下・1 右・2 左・3 上）。前は 上（3）だけを Y に して いたので、
//   左に Y が ある コントローラー（Switch の プロコン など）では Y を おしても 何も おきなかった
// ・yKey の ある まど（覚えた技の 見方・道具の ならべかえ・戦いの お気に入り）では 左（2）・上（3）の どちらも Y
// ・yKey の ない まどでは 今までどおり 上（3）は B・左（2）は 何も しない。フィールドでも 今までどおり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Input } from '../public/js/client/input.js';
import { checkFile } from '../tools/kanji-check.mjs';

const src = (p) => readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');

function withPad(fn) {
  const pressed = new Set();
  const gp = { connected: true, axes: [0, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ get pressed() { return pressed.has(i); } })) };
  const had = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [gp] }, configurable: true, writable: true });
  const fake = { pad: { prev: {}, dir: { x: 0, y: 0 }, repeat: {}, run: false }, stack: [], busy: false, quickPad: -1, out: [], emit(a) { this.out.push(a); } };
  const press = (...bs) => {
    pressed.clear();
    for (const b of bs) pressed.add(b);
    Input.prototype.update.call(fake);
  };
  try {
    fn(fake, press);
  } finally {
    if (had) Object.defineProperty(globalThis, 'navigator', had);
    else delete globalThis.navigator;
  }
}

// ListMenu の handler と おなじ 形（yKey・lr）
const menuTop = (out, { y = true, lr = true } = {}) => ({ yKey: y, lr, onNav: (a) => out.push(a) });

test('覚えた技の まど（yKey・lr）: 左（2）でも 上（3）でも Y、L・R（4・5）で タブ', () => {
  withPad((fake, press) => {
    fake.stack.push(menuTop(fake.out));
    press(3); press();
    press(2); press();
    press(4); press();
    press(5); press();
    assert.deepEqual(fake.out, ['y', 'y', 'l', 'r']);
    // おしっぱなしは 1回
    press(2); press(2); press(2); press();
    assert.deepEqual(fake.out.slice(4), ['y']);
    assert.equal(fake.pad.on, true, 'コントローラーが つながって いる（ヒント）');
  });
});

test('Y で まどが かわっても、おした ままの 上（3）は B に ならない', () => {
  withPad((fake, press) => {
    fake.stack.push(menuTop(fake.out));
    press(3);
    fake.stack.pop();
    fake.stack.push(menuTop(fake.out, { y: false, lr: false }));
    press(3);
    press(3);
    assert.deepEqual(fake.out, ['y']);
    press();
    press(3);
    assert.deepEqual(fake.out, ['y', 'b'], 'はなして もう一度 おすと B（今までどおり）');
  });
});

test('yKey の ない まど・フィールド: 上（3）・Start（9）は B、左（2）は 何も しない（走る）', () => {
  withPad((fake, press) => {
    fake.stack.push(menuTop(fake.out, { y: false, lr: false }));
    press(2); press();
    assert.deepEqual(fake.out, []);
    press(3); press();
    press(9); press();
    assert.deepEqual(fake.out, ['b', 'b']);
    fake.stack.pop();
    fake.out.length = 0;
    press(2);
    assert.equal(fake.pad.run, true, 'フィールドでは 左（2）は 走る');
    press();
    press(9); press();
    press(4); press();
    assert.deepEqual(fake.out, ['b', 'ride'], 'L は 大鳥・竜');
  });
});

test('コントローラーが ない 時は pad.on が false', () => {
  const had = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { value: { getGamepads: () => [null] }, configurable: true, writable: true });
  try {
    const fake = { pad: { prev: {}, dir: { x: 0, y: 0 }, repeat: {}, on: true }, stack: [], emit() {} };
    Input.prototype.update.call(fake);
    assert.equal(fake.pad.on, false);
  } finally {
    if (had) Object.defineProperty(globalThis, 'navigator', had);
    else delete globalThis.navigator;
  }
});

test('ヒント: コントローラーの 時は コントローラーの ボタンで 書く（キーボード・スマホは 今までどおり）', () => {
  const m = src('js/client/ui/menu.js');
  assert.match(m, /if \(g\.input\.pad\?\.on\) head\.append\(el\('div', \{ class: 'tab-hint pad-hint', text: 'コントローラー：L・Rで種類・Yで見方/);
  assert.match(m, /else if \(!touch\) head\.append\(el\('div', \{ class: 'tab-hint', text: 'L・R（Q・E）で種類・Yで見方/);
  // 見方の 切りかえ（Y・L・R）は かんたん表示では 出さない（今までどおり）
  assert.match(m, /\.\.\.\(simple \? \{\} : \{\s*onLR: \(d\) => goTab\(nextLearnTab\(tabs, cur\.key, d\)\),\s*onY: \(\) => setView\(view === 'job' \? 'kind' : 'job'\),/);
  // 道具の ならべかえ: コントローラーを つないだ スマホでも（Y）
  assert.match(m, /g\.input\.touch && !g\.input\.pad\?\.on \? 'ならべかえ' : 'ならべかえ（Y）'/);
  // 画面の 文字（使えない 漢字・文の 中の 空白）
  for (const f of ['js/client/ui/menu.js', 'js/client/input.js']) {
    const p = new URL(`../public/${f}`, import.meta.url).pathname;
    assert.deepEqual(checkFile(p).filter((x) => x.kind !== 'kana'), [], f);
  }
});
