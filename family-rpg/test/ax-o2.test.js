// 第49回 O2（こぶし・守り・魔物・闇） の もとからの 技の テスト。この ファイルは O2 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O2 を 見て やる。ここには O2 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, FIVE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O2, AX_SKILLS_O2, AX_FAMILIES_O2 } from '../public/js/shared/data/ax-time-o2.js';

test('第49回 O2: 表と え が そろう', () => {
  const r = groupReport('o2');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O2).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O2)) for (const a of fam) assert.ok(a in AX_TIME_O2, a);
  for (const v of Object.values(AX_SKILLS_O2)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O2);
});

// 決め手（plan-r49-fx.md 7-3）
import { axPlan } from '../public/js/shared/ax-time.js';

test('第49回 O2: こぶしの なかまは 段が 上がるほど つぶが 多く 長い（せいけんづき → 神速の拳）', () => {
  const a = playAx('ox_seiken_zuki', ONE, { ability: 'seiken' });
  const b = playAx('ox_shinsoku_ken', ONE, { ability: 'gh_shinsoku' });
  assert.ok(b.maxParts > a.maxParts, `${a.maxParts} → ${b.maxParts}`);
  assert.ok(axPlan('ox_shinsoku_ken', { key: 'gh_shinsoku' }).total > axPlan('ox_seiken_zuki', { key: 'seiken' }).total);
});

test('第49回 O2: 構えなしの すばやい 技（いっせんづき・神速の拳）と 魔王の 技は 伝説の 長さ', () => {
  for (const [anim, key] of [['ox_issen_zuki', 'issen'], ['ox_shinsoku_ken', 'gh_shinsoku'], ['ox_maou_tsume', 'mo_tsume']]) assert.equal(axPlan(anim, { key }).charge, 0, anim);
  const sup = axPlan('ox_god_hand', { key: 'gh_godfist' }).total;
  for (const [anim, key] of [['ox_hametsu_hikari', 'mo_hametsu'], ['ox_yami_no_sekai', 'hi_yami_sekai']]) {
    const P = axPlan(anim, { key });
    assert.equal(P.tier, 'legend');
    assert.ok(P.total > sup, anim);
  }
});

test('第49回 O2: ダ天使の 技（dt_〜）は 合体技で なく 構えが ある。合体技は ため なし', () => {
  for (const key of ['dt_hohoemi', 'dt_keiyaku', 'dt_tsubasa', 'dt_darkangel']) {
    const s = AX_SKILLS_O2[key];
    assert.ok(axPlan(s, { key }).charge > 0, key);
  }
  for (const key of ['dt_hametsu', 'dt_wild_rush', 'dt_henshin_hero']) assert.equal(axPlan(AX_SKILLS_O2[key], { key, dual: true }).charge, 0, key);
  assert.ok(axPlan('ox_wild_rush', { key: 'dt_wild_rush', dual: true }).total > axPlan('ox_beast_cross', { key: 'dt_beast_cross', dual: true }).total, '3人 > 2人');
});

test('第49回 O2: 敵全体の 技は 敵5体でも 上限を こえない（c.all で へらす）', () => {
  for (const [anim, key] of [['ox_mawashi_geri', 'mawashigeri'], ['ox_senpuu_kyaku', 'hk_senpuukyaku'], ['ox_bakuretsu_ken', 'bakuretsu']]) {
    const r = playAx(anim, FIVE, { ability: key, crit: true, n: 5 });
    assert.ok(r.maxParts <= 132, `${anim} ${r.maxParts}`);
  }
});
void [THREE, ALLY1, ALLY4];
