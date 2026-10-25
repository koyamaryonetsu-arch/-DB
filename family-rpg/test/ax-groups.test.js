// 第48回: 大技の グループ（G1〜G6）共通の テスト。グループは 表（shared/data/ax-time-gN.js）と え（render/axfx-gN.js）を 埋める だけで ここが ぜんぶ しらべる
// ・技が データに ある・anim の 時間と え が そろう・段の 予算（ため・合計。±150ms）・クライアントと サーバーで おなじ 時間
// ・敵1体・3体・5体（会心）・敵が 味方に（1人・4人。ノクトの影・鏡のうつし身）・味方に かける（1人・4人）で こわれない
//   （エラー・NaN・マイナスの 半径・画面から とおい つぶ・おわる 時間・同時の つぶの 上限と 下限・あたる 時間に 的の 近くで 光る）
// ・2回目は ため 半分・おそい 設定でも 0.85 の 速さ・サーバーの 待ち時間で つぎの 行動が かぶらない
// ・なかま（AX_FAMILIES）は 下から 上へ 段・長さ・つぶが へらない・音が ある・画面の 文字に 漢字（人 の ほか）が ない
// しらべかたは test/ax-check.js（G0。グループは さわらない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { groupReport } from './ax-check.js';
import { AX_GROUP_IDS, AX_TIME, AX_SKILLS, axGroupOf } from '../public/js/shared/ax-time.js';
import { axList, axDef } from '../public/js/client/render/axfx.js';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

for (const g of AX_GROUP_IDS) {
  test(`第48回 ${g.toUpperCase()}: 大技の 表・え・音・時間・予算・うごき`, () => {
    const r = groupReport(g);
    assert.deepEqual(r.problems, [], `${g}: ${r.problems.length}こ`);
  });
}

test('第48回: グループの ファイルが ある・G0 が つないだ（グループは axfx.js・sfx-ax.js・ax-time.js を さわらない）', () => {
  const axfx = src('../public/js/client/render/axfx.js');
  const sfx = src('../public/js/client/sfx-ax.js');
  const time = src('../public/js/shared/ax-time.js');
  for (const g of AX_GROUP_IDS) {
    const G = g.toUpperCase();
    for (const f of [`../public/js/client/render/axfx-${g}.js`, `../public/js/client/sfx-ax-${g}.js`, `../public/js/shared/data/ax-time-${g}.js`, `./ax-${g}.test.js`]) assert.ok(existsSync(new URL(f, import.meta.url)), f);
    assert.ok(axfx.includes(`import { AX_${G}, AX_${G}_FINE } from './axfx-${g}.js';`), `axfx.js: ${g}`);
    assert.ok(axfx.includes(`useAxGroup('${g}', AX_${G}, AX_${G}_FINE);`), `axfx.js: ${g}`);
    assert.ok(sfx.includes(`import { SFX_AX_${G} } from './sfx-ax-${g}.js';`), `sfx-ax.js: ${g}`);
    assert.ok(time.includes(`axAddTimes('${g}', AX_TIME_${G}, AX_SKILLS_${G}, AX_FAMILIES_${G});`), `ax-time.js: ${g}`);
  }
});

test('第48回: 大技は ぜんぶ どこかの グループ（おためし ax_demo_ の ほか）・技は 1つの グループだけ', () => {
  for (const anim of Object.keys(AX_TIME)) assert.ok(AX_GROUP_IDS.includes(axGroupOf(anim)), `${anim} の グループ`);
  for (const anim of axList('ax_')) {
    const g = axDef(anim).group;
    assert.ok(g === 'demo' || AX_GROUP_IDS.includes(g), `${anim}: グループ ${g}`);
  }
  for (const [key, s] of Object.entries(AX_SKILLS)) {
    assert.ok(AX_GROUP_IDS.includes(s.group), key);
    assert.equal(axGroupOf(s.anim), s.group, `${key}: ほかの グループの anim ${s.anim}`);
  }
});
