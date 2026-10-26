// 第49回 O1（剣・和・かげの 仕事） の もとからの 技の テスト。この ファイルは O1 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O1 を 見て やる。ここには O1 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4, ALLY_FROM } from './ax-check.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { AX_TIME_O1, AX_SKILLS_O1, AX_FAMILIES_O1 } from '../public/js/shared/data/ax-time-o1.js';
import { axPlan } from '../public/js/shared/ax-time.js';

test('第49回 O1: 表と え が そろう', () => {
  const r = groupReport('o1');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O1).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O1)) for (const a of fam) assert.ok(a in AX_TIME_O1, a);
  for (const v of Object.values(AX_SKILLS_O1)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O1);
});

test('第49回 O1: plan-r49-fx.md 6章の 83技が ぜんぶ つながる（技ごとに 自分の anim）', () => {
  assert.equal(Object.keys(AX_SKILLS_O1).length, 83);
  assert.equal(new Set(Object.values(AX_SKILLS_O1)).size, 83);
  for (const [key, anim] of Object.entries(AX_SKILLS_O1)) assert.match(anim, /^ox_[a-z0-9_]+$/, key);
});

test('第49回 O1: 居合斬りは 構え なしで 0.15びょう いないに あたる', () => {
  const P = axPlan('ox_iai', { key: 'sa_iai' });
  assert.equal(P.charge, 0);
  assert.ok(P.hit <= 150, `${P.hit}`);
  // 急所づき・はやてづきも 構え なしの すばやい 技
  for (const [a, k] of [['ox_kyuusho_zuki', 'as_kyuusho'], ['ox_hayatezuki', 'hayatezuki']]) {
    const Q = axPlan(a, { key: k });
    assert.equal(Q.charge, 0, a);
    assert.ok(Q.hit <= 150, a);
  }
});

test('第49回 O1: 職業の Lv10・看板の 技は おなじ 職業の Lv1 より 長く 豪華', () => {
  const pairs = [
    ['ox_kabutowari', 'kabutowari', 'ox_tamashii_ichigeki', 'tamashii'],
    ['ox_knife_throw', 'spy_knife', 'ox_mission_complete', 'spy_sig'],
    ['ox_moroba_giri', 'bm_moroba', 'ox_hakai_ichigeki', 'bm_hakai'],
    ['ox_seinaru_tsurugi', 'pl_seiken', 'ox_judgment', 'pl_judgment'],
    ['ox_mineuchi_samurai', 'sa_mineuchi', 'ox_ittou_ryoudan', 'sa_ittou'],
    ['ox_kyuusho_zuki', 'as_kyuusho', 'ox_ichigeki_hissatsu', 'assassin_sig'],
    ['ox_darkness_blade', 'ms_dark', 'ox_hades_blade', 'ms_hades'],
    ['ox_koumyou_zan', 'swm_seiken', 'ox_zenkengi', 'swm_zenken'],
    ['ox_ikkiuchi', 'sg_ikkiuchi', 'ox_tenka_ichi', 'sg_tenka'],
  ];
  for (const [a, ka, b, kb] of pairs) {
    const pa = axPlan(a, { key: ka }), pb = axPlan(b, { key: kb });
    assert.ok(pb.total > pa.total, `${b} の 長さ ${pb.total} > ${a} ${pa.total}`);
    const na = playAx(a, ONE, { ability: ka }).maxParts, nb = playAx(b, ONE, { ability: kb }).maxParts;
    assert.ok(nb > na, `${b} の つぶ ${nb} > ${a} ${na}`);
  }
});

test('第49回 O1: 合体技は 人数が 多いほど 長い（2人 < 3人 < 4人）', () => {
  const tot = (a, k) => axPlan(a, { key: k, dual: true }).total;
  const two = tot('ox_cross_mahouken', 'dt_cross_mahouken');
  const three = tot('ox_delta_strike', 'dt_delta');
  const four = tot('ox_grand_finale', 'dt_finale');
  assert.ok(two < three && three < four, `${two} ${three} ${four}`);
});

test('第49回 O1: 魔法剣・クロス魔法剣は 呪文の 属性で 色が かわる', () => {
  const grab = (anim, key, element, dual) => {
    const fx = new Effects();
    fx.play(anim, ONE, element, { fromAlly: true, from: ALLY_FROM, ability: key, dual });
    const P = axPlan(anim, { key, dual });
    const out = new Set();
    for (let t = 0; t < P.hit + 200; t += 16) {
      fx.update(16);
      for (const p of fx.parts) if (!(p.delay > 0)) for (const k of ['color', 'glow', 'main']) if (typeof p[k] === 'string') out.add(p[k].toLowerCase());
    }
    return out;
  };
  for (const [anim, key, dual] of [['ox_mahouken', 'mahouken', false], ['ox_cross_mahouken', 'dt_cross_mahouken', true]]) {
    const fire = grab(anim, key, 'fire', dual), ice = grab(anim, key, 'ice', dual);
    assert.ok(fire.has('#ff6a1a') && !fire.has('#7ad8ff'), `${anim} 炎`);
    assert.ok(ice.has('#7ad8ff') && !ice.has('#ff6a1a'), `${anim} 氷`);
  }
});

test('第49回 O1: 味方に かける 技は 味方の 位置で 光る・敵が まねても こわれない', () => {
  for (const [anim, key] of [['ox_aegis', 'pl_aegis'], ['ox_dai_gorei', 'sg_gorei'], ['ox_gunbai', 'sg_gunbai'], ['ox_tenka_touitsu', 'hi_tenka_touitsu'], ['ox_iyashi_mai', 'iyashi_mai']]) {
    const r = playAx(anim, ALLY4, { ability: key });
    assert.deepEqual(r.errors, [], anim);
    assert.ok(r.maxParts >= 30, `${anim} ${r.maxParts}`);
    const one = playAx(anim, ALLY1, { ability: key });
    assert.deepEqual(one.errors, [], anim);
  }
  for (const [anim, key] of [['ox_tenka_ichi', 'sg_tenka'], ['ox_hades_blade', 'ms_hades'], ['ox_judgment', 'pl_judgment']]) {
    const r = playAx(anim, THREE, { ability: key, fromAlly: false, toParty: true });
    assert.deepEqual(r.errors, [], anim);
    assert.equal(r.far, null, anim);
  }
});
