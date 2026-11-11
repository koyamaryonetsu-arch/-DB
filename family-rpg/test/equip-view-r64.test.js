// 第64回: 装備の 一覧: 装備 そのものの 強さ（白）・今の 装備との 差（色）・くらべる まど・おすすめ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { newCharacter, computeStats } from '../public/js/shared/stats.js';
import { gearOwnStats, gearOwnText, gearRowHtml, statChanges } from '../public/js/client/ui/info.js';

test('第64回: 装備 そのものの 強さ（外した 時との 差）と 1行の 文', () => {
  const c = newCharacter({ id: 'e1', name: 'ユイ', job: 'warrior' });
  c.equip = { ...(c.equip || {}), weapon: 'wood_sword' };
  const own = gearOwnStats(c, 'weapon', 'iron_sword');
  const atk = own.find((x) => x.k === 'atk');
  assert.ok(atk && atk.v > 0);
  const off = computeStats({ ...c, equip: { ...c.equip, weapon: null } }).atk;
  const on = computeStats({ ...c, equip: { ...c.equip, weapon: 'iron_sword' } }).atk;
  assert.equal(atk.v, on - off);
  assert.deepEqual(gearOwnStats(c, 'weapon', null), []);
  assert.match(gearOwnText(own), /^攻撃力\+\d+/);
  assert.equal(gearOwnText([]), '強さなし');
  const before = computeStats(c);
  const html = gearRowHtml(own, statChanges(before, computeStats({ ...c, equip: { ...c.equip, weapon: 'iron_sword' } })));
  assert.match(html, /<span class="eq-own">攻撃力\+\d+<\/span><span class="eq-d up">↑\d+<\/span>/);
  assert.ok(!/class="sc up"|class="sc down"/.test(html), '強さの 字は 色なし（差だけ 色）');
  assert.match(gearRowHtml([], []), /強さは変わらない/);
  // 外す: 強さは なし・差は 下がる
  assert.match(gearRowHtml([], [{ k: 'atk', n: '攻撃力', b: 20, a: 14, d: -6 }]), /攻撃力<\/span><span class="eq-d down">↓6/);
});

test('第64回: 一覧に おすすめ（上から 3つ）・下に くらべる まど・強さは 白', () => {
  const menu = readFileSync(new URL('../public/js/client/ui/menu.js', import.meta.url), 'utf8');
  assert.match(menu, /\.slice\(0, 3\)\.map\(\(x\) => x\.id\)\)/);
  assert.match(menu, /eq-rec">おすすめ/);
  assert.match(menu, /class: 'eq-compare'/); // 第76回: 大きな くらべる まど（equip-compare.js）
  assert.match(menu, /onMove, foot \}\);/);
  const css = readFileSync(new URL('../public/css/style.css', import.meta.url), 'utf8');
  assert.match(css, /\.menu \.item\.eq-opt \.eq-sc \.sc \{ color: #fff; \}/);
});
