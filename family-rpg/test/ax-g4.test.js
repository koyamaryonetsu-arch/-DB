// 第48回 G4（ダイの大冒険 ＋ ロトの勇者 ＋ マリオ ＋ 3年B組）の 大技の テスト。この ファイルは G4 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ）は
//   test/ax-groups.test.js が AX_SKILLS_G4 を 見て やる。ここには G4 だけの「決め手」を 書く（plan-r48-fx.md 8-5）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_G4, AX_SKILLS_G4, AX_FAMILIES_G4 } from '../public/js/shared/data/ax-time-g4.js';

test('第48回 G4: 表と え が そろう', () => {
  const r = groupReport('g4');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_G4).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_G4)) for (const a of fam) assert.ok(a in AX_TIME_G4, a);
  for (const v of Object.values(AX_SKILLS_G4)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_G4);
});

// 例（決め手。plan-r48-fx.md 8-5）:
// test('第48回 G4: かめはめ波は 段が 上がるほど ビームが 太い', () => {
//   const w = ['ax_kamehameha', 'ax_kamehameha_super'].map((a) => Math.max(...playAx(a, ONE).parts.filter((p) => p.kind === 'axBeam').map((p) => p.w)));
//   assert.ok(w[1] > w[0]);
// });
void [playAx, ONE, THREE, ALLY1, ALLY4];
