// 第67回: タッチの ボタンを 自分で ならべる（client/ui/layout.js。たて・よこ 別々・大きさ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const store = new Map();
globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
globalThis.innerWidth = 390;
globalThis.innerHeight = 844;
const L = await import('../public/js/client/ui/layout.js');

const full = (x = 0.5) => Object.fromEntries(L.LAYOUT_ITEMS.map((it) => [it.id, { x, y: 0.8, s: 1.25 }]));

test('第67回 ボタンの配置: 動かせる 物（歩く時 4つ・メニューの時 3つ）・大きさ 4つ', () => {
  assert.deepEqual(L.LAYOUT_ITEMS.map((x) => x.id), ['stick', 'a', 'b', 'run', 'cross', 'pa', 'pb']);
  assert.deepEqual(L.LAYOUT_ITEMS.filter((x) => x.group === 'walk').map((x) => x.id), ['stick', 'a', 'b', 'run']);
  assert.deepEqual(L.SIZES.map(([, k]) => k), [0.8, 1, 1.25, 1.5]);
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  for (const id of ['stick', 'btn-a', 'btn-b', 'btn-run']) assert.ok(html.includes(`id="${id}"`), id);
});

test('第67回 ボタンの配置: たて・よこ 別々に おぼえる。こわれた 値は 使わない', () => {
  store.clear();
  assert.deepEqual(L.loadLayout(), { tate: null, yoko: null });
  L.saveLayout('tate', full(0.8));
  assert.equal(L.loadLayout().tate.stick.x, 0.8);
  assert.equal(L.loadLayout().yoko, null, 'よこ持ちは 今のまま');
  assert.equal(L.orientOf(390, 844), 'tate');
  assert.equal(L.orientOf(844, 390), 'yoko');
  // 1つ 足りない・大きさが へん・はみ出し
  const bad = full();
  delete bad.pb;
  assert.equal(L.cleanOrient(bad), null);
  assert.deepEqual(L.cleanSpot({ x: 2, y: -1, s: 9 }), { x: 1, y: 0, s: 1 });
  store.set('kizuna_layout', '{こわれた');
  assert.deepEqual(L.loadLayout(), { tate: null, yoko: null });
  // もとにもどす
  L.saveLayout('tate', full(0.8));
  L.saveLayout('tate', null);
  assert.equal(L.loadLayout().tate, null);
});

test('第67回 ボタンの配置: スティックを さわって 出せる 側は、決めた スティックの 側', () => {
  store.clear();
  assert.equal(L.stickSideOf(390, 844), null, '決めて いない ときは 今までの しくみ（ui/hand.js）');
  L.saveLayout('tate', full(0.8));
  assert.equal(L.stickSideOf(390, 844), 'right');
  L.saveLayout('tate', full(0.2));
  assert.equal(L.stickSideOf(390, 844), 'left');
  assert.equal(L.stickSideOf(844, 390), null, 'よこ持ちは 別');
});

test('第67回 ボタンの配置: 設定に 入口・漢字の きまり', async () => {
  const menu = readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(menu, /ボタンの配置を自分で決める/);
  const { gameFiles, checkFile } = await import('../tools/kanji-check.mjs');
  const f = gameFiles().find((x) => x.replaceAll('\\', '/').endsWith('client/ui/layout.js'));
  assert.ok(f);
  assert.deepEqual(checkFile(f).filter((p) => p.kind === 'kanji' || p.kind === 'space'), []);
});
