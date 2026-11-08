// 第69回: ランクの 高い 魔物 どうしの 配合で、ランクの 低い 子に ならない（品が なくても）
import test from 'node:test';
import assert from 'node:assert/strict';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS, BREED_RECIPES, rankIdx, rankOf, breedOutcome } from '../public/js/shared/data/companions.js';

const lv = (species, level = 40) => ({ species, level });

test('ヴァルドラゴン ＋ いかずちタイガー（S どうし）→ いかずちドラゴンは S で、おすすめ', () => {
  assert.equal(rankOf('great_dragon', MONSTERS), 'S');
  assert.equal(rankOf('ikazuchi_tiger', MONSTERS), 'S');
  assert.equal(rankOf('thunder_dragon', MONSTERS), 'S');
  for (const [a, b] of [['great_dragon', 'ikazuchi_tiger'], ['ikazuchi_tiger', 'great_dragon']]) {
    const o = breedOutcome(lv(a), lv(b), MONSTERS);
    assert.equal(o.child, 'thunder_dragon');
    assert.equal(o.rank, 'S');
    assert.ok(!o.low);
  }
});

test('配合だけで 生まれる 子は、きまった 組み合わせの 親の 高いほうより ランクが 下がらない', () => {
  for (const r of BREED_RECIPES) {
    if (!MONSTERS[r.child] || !MONSTER_FRIENDS[r.child]?.breedOnly) continue;
    const ids = [r.a, r.b].filter((x) => typeof x === 'string' && MONSTERS[x]);
    if (!ids.length) continue;
    const hi = Math.max(...ids.map((x) => rankIdx(x, MONSTERS)));
    assert.ok(rankIdx(r.child, MONSTERS) >= Math.min(6, hi), `${r.child}（${rankOf(r.child, MONSTERS)}）`);
  }
});

test('S どうしの 配合の おすすめは、品が なくても S（SS は 品か 4体配合）', () => {
  const S = Object.keys(MONSTER_FRIENDS).filter((sp) => MONSTERS[sp] && !MONSTERS[sp].boss && rankOf(sp, MONSTERS) === 'S').slice(0, 12);
  for (const a of S) for (const b of S) {
    const o = breedOutcome(lv(a, 60), lv(b, 60), MONSTERS);
    assert.ok(['S', 'SS'].includes(o.rank) && !o.low, `${a} ＋ ${b} → ${o.child}（${o.rank}）`);
  }
});
