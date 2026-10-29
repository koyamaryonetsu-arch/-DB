// 第51回 C2（o8）: 幻の職業 4つ（名探てい王・銀河の女王・大魔導王・天下むそうの剣聖）の 技の えんしゅつの テスト。この ファイルは C2 だけが さわる
// ・どの グループにも いる テスト（技が ある・伝説の 予算・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_GROUP_IDS の o8 を 見て やる。ここには o8 だけの「決め手」を 書く
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { groupReport, playAx, ONE, THREE, FIVE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O8, AX_SKILLS_O8, AX_FAMILIES_O8 } from '../public/js/shared/data/ax-time-o8.js';
import { PHANTOM_ABILITIES_B } from '../public/js/shared/data/abilities-phantom-b.js';
import { PHANTOM_JOBS_B } from '../public/js/shared/data/jobs-phantom-b.js';
import { axPlan, AX_BUDGET_ORIG, AX_GROUP_IDS } from '../public/js/shared/ax-time.js';
import { axDef } from '../public/js/client/render/axfx.js';

test('第51回 o8: 表と え が そろう（groupReport）', () => {
  assert.ok(AX_GROUP_IDS.includes('o8'));
  const r = groupReport('o8');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O8).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O8)) for (const a of fam) assert.ok(a in AX_TIME_O8, a);
  for (const v of Object.values(AX_SKILLS_O8)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O8);
});

test('第51回 o8: 4つの 職業の 技 ぜんぶに 自分だけの えんしゅつ（データの anim と 表が おなじ）', () => {
  const ids = Object.values(PHANTOM_JOBS_B).flatMap((j) => j.learn.map(([, id]) => id));
  assert.equal(ids.length, 32);
  assert.deepEqual(Object.keys(AX_SKILLS_O8).sort(), ids.sort());
  const anims = new Set();
  for (const id of ids) {
    const anim = AX_SKILLS_O8[id];
    assert.equal(PHANTOM_ABILITIES_B[id].anim, anim, id);
    assert.ok(!anims.has(anim), `${anim} が かぶる`);
    anims.add(anim);
  }
  // 先読みの 反撃（技では ない）も ある
  assert.ok(axDef('ox_tk_yomi_hit'));
});

test('第51回 o8: どれも 伝説の 予算（合計 1.6〜2.4びょう・構えは みじかく 気なし）。看板の 技は いちばん 長い', () => {
  const B = AX_BUDGET_ORIG.legend;
  for (const [key, anim] of Object.entries(AX_SKILLS_O8)) {
    const P = axPlan(anim, { key });
    assert.equal(P.tier, 'legend', key);
    assert.ok(P.total >= B.total[0] && P.total <= B.total[1], `${key} ${P.total}`);
    assert.ok(P.charge <= 300 && P.kind !== 'ki', key);
  }
  for (const [job, j] of Object.entries(PHANTOM_JOBS_B)) {
    const sig = axPlan(AX_SKILLS_O8[`${job}_sig`], { key: `${job}_sig` }).total;
    for (const [, id] of j.learn) assert.ok(axPlan(AX_SKILLS_O8[id], { key: id }).total <= sig, `${job}: ${id}`);
  }
});

test('第51回 o8: 看板の 技は 敵1体でも つぶが 多い・敵5体でも 上限を こえない', () => {
  const hi = Math.round(AX_BUDGET_ORIG.legend.parts[1] * 1.1);
  for (const [anim, key] of [['ox_detective_king_sig', 'detective_king_sig'], ['ox_galaxy_queen_sig', 'galaxy_queen_sig'], ['ox_grand_magus_sig', 'grand_magus_sig'], ['ox_sword_saint_sig', 'sword_saint_sig']]) {
    const one = playAx(anim, ONE, { ability: key });
    assert.ok(one.maxParts >= 150, `${anim} ${one.maxParts}`);
    const five = playAx(anim, FIVE, { ability: key, crit: true, n: 5 });
    assert.ok(five.maxParts <= hi && !five.errors.length, `${anim} ${five.maxParts}`);
  }
});

test('第51回 o8: 味方に かける 技（いやし・バリア・かんむり・構え）は 味方の 上で 出る', () => {
  for (const key of ['tk_show', 'gq_iyashi', 'gq_barrier', 'gq_fukkatsu', 'gq_amanogawa', 'gq_kanmuri', 'gm_mana', 'gm_niju', 'gm_shugo', 'ks_kokoro', 'ks_kenki']) {
    const anim = AX_SKILLS_O8[key];
    assert.ok(axDef(anim).party, key);
    for (const pts of [ALLY1, ALLY4]) assert.deepEqual(playAx(anim, pts, { ability: key }).errors, [], key);
  }
});

test('第51回 o8: 画面の 文字は カタカナと 記号（カットイン・画面の くらさ なし）', () => {
  for (const f of ['kit', 'tantei', 'ginga', 'madou', 'kensei']) {
    const src = readFileSync(new URL(`../public/js/client/render/axfx-o8-${f}.js`, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    assert.ok(!/\bcutIn\s*\(|\.dim\s*\(/.test(src), f);
  }
  void THREE;
});
