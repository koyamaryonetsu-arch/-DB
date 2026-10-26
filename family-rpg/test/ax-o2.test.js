// 第49回 O2（こぶし・守り・魔物・闇） の もとからの 技の テスト。この ファイルは O2 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O2 を 見て やる。ここには O2 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O2, AX_SKILLS_O2, AX_FAMILIES_O2 } from '../public/js/shared/data/ax-time-o2.js';

test('第49回 O2: 表と え が そろう', () => {
  const r = groupReport('o2');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O2).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O2)) for (const a of fam) assert.ok(a in AX_TIME_O2, a);
  for (const v of Object.values(AX_SKILLS_O2)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O2);
});

// 例（決め手。plan-r49-fx.md 7-3）:
// test('第49回 O2: なかまは 段が 上がるほど つぶが 多い', () => {
//   const n = ['ox_弱い', 'ox_強い'].map((a) => playAx(a, ONE).maxParts);
//   assert.ok(n[1] > n[0]);
// });
void [playAx, ONE, THREE, ALLY1, ALLY4];
