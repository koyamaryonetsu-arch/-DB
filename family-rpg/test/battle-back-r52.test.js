// 第52回: スマホ たてむきの 戦いで、コマンドの わくの 外・左下に 大きな「← もどる」
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');

test('第52回: もどれる メニューの ときだけ、たてむきで 大きな もどるを 出す', () => {
  // ふだんは 出さない・たてむきの 中で has-back の ときだけ 出す
  assert.match(css, /\.b-backbar \{ display: none;/);
  const portrait = css.slice(css.indexOf('@media (max-aspect-ratio: 1/1) {\n  .b-top'));
  assert.match(portrait.slice(0, 3000), /#battle\.has-back \.b-backbar \{ display: flex; \}/);
  // わくの 中の 小さい もどる（← の 札・もどるの チップ）は かくす
  assert.match(portrait.slice(0, 3000), /#battle\.has-back \.b-cmd \.menu \.backchip, #battle\.has-back \.b-tabs \.bt-back \{ display: none; \}/);
  // メニューを 出す たびに もどれるか どうかで つける・とじたら はずす
  assert.match(js, /classList\.toggle\('has-back', !!onCancel\)/);
  assert.match(js, /classList\.remove\('has-back'\)/);
  // おすと メニューの もどる（B ボタンと おなじ）
  assert.match(js, /class: 'btn b-backbig'[\s\S]{0,200}this\.menu\?\.cancel\(\)/);
});
