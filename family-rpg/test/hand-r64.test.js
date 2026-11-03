// 第64回: たて持ちの ボタンの ならび（右手用・左手用・片手）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HANDS, HAND_NAMES, inStickZone } from '../public/js/client/ui/hand.js';

test('第64回: ならびは 4つ・名前', () => {
  assert.deepEqual(HANDS, ['right', 'left', 'oneR', 'oneL']);
  for (const h of HANDS) assert.ok(HAND_NAMES[h]);
});

test('第64回: スティックが 出る 所（たて持ち）', () => {
  const W = 390, H = 844;
  assert.ok(inStickZone(50, 700, W, H, 'right'));
  assert.ok(!inStickZone(350, 700, W, H, 'right'));
  assert.ok(inStickZone(350, 700, W, H, 'left'));
  assert.ok(!inStickZone(50, 700, W, H, 'left'));
  assert.ok(inStickZone(300, 750, W, H, 'oneR'));
  assert.ok(!inStickZone(300, 200, W, H, 'oneR'), '上の 半分は 出ない');
  assert.ok(!inStickZone(30, 750, W, H, 'oneR'), '反対の はしは 出ない');
  assert.ok(inStickZone(60, 750, W, H, 'oneL'));
  assert.ok(!inStickZone(370, 750, W, H, 'oneL'));
});

test('第64回: よこ持ちは 今のまま（どの ならびでも 左の 6わり）', () => {
  for (const h of HANDS) {
    assert.ok(inStickZone(100, 300, 844, 390, h), h);
    assert.ok(!inStickZone(700, 300, 844, 390, h), h);
  }
});

test('第64回: css は たて持ちの 時だけ・設定に「ボタンのならび」', () => {
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  const i = css.indexOf('body[data-hand="left"] #stick');
  assert.ok(i > 0);
  assert.ok(css.lastIndexOf('@media (orientation: portrait) {', i) > css.lastIndexOf('}\n}', i) - 2000);
  for (const h of ['left', 'oneR', 'oneL']) assert.ok(css.includes(`body[data-hand="${h}"] #btn-a`), h);
  const menu = readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(menu, /ボタンのならび（たて持ち）/);
  const input = readFileSync(new URL('../public/js/client/input.js', import.meta.url), 'utf8');
  assert.match(input, /stickZone\(t\.clientX, t\.clientY, innerWidth, innerHeight, document\.body\.dataset\.hand\)/);
});
