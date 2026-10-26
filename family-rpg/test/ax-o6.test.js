// 第49回 O6（魔法・星・お笑い・配信） の もとからの 技の テスト。この ファイルは O6 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O6 を 見て やる。ここには O6 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O6, AX_SKILLS_O6, AX_FAMILIES_O6 } from '../public/js/shared/data/ax-time-o6.js';
import { axPlan } from '../public/js/shared/ax-time.js';
import { Effects } from '../public/js/client/render/battlefx.js';

test('第49回 O6: 表と え が そろう', () => {
  const r = groupReport('o6');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O6).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O6)) for (const a of fam) assert.ok(a in AX_TIME_O6, a);
  for (const v of Object.values(AX_SKILLS_O6)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O6);
});

test('第49回 O6: plan の 106技 ぜんぶに 自分だけの anim', () => {
  const keys = Object.keys(AX_SKILLS_O6);
  assert.equal(keys.length, 106);
  const anims = new Set(Object.values(AX_SKILLS_O6));
  assert.equal(anims.size, 106);
  for (const a of anims) assert.match(a, /^ox_[a-z0-9_]+$/);
});

// add を のぞいて つぶを あつめる（敵1体・全体・味方）
function collect(anim, pts, opts = {}) {
  const fx = new Effects();
  const all = [];
  const add0 = fx.add.bind(fx);
  fx.add = (p) => { all.push(p); return add0(p); };
  fx.play(anim, pts, null, { fromAlly: true, from: { x: 99, y: 122 }, n: pts.length, ...opts });
  for (let t = 0; t < 3000 && fx.parts.length; t += 16) fx.update(16);
  return all;
}

test('第49回 O6: ギャグの なかまは 段が 上がるほど 長く・つぶが 多い（ギャグ → 大ばくしょう → 一発ギャグ → 爆笑のうず → 4分間のまんざい）', () => {
  const fam = AX_FAMILIES_O6.ギャグ;
  const total = fam.map((a) => axPlan(a, { n: 1 }).total);
  for (let i = 1; i < total.length; i++) assert.ok(total[i] > total[i - 1], `${fam[i]} ${total[i]} > ${fam[i - 1]} ${total[i - 1]}`);
  const parts = fam.map((a) => playAx(a, ONE).maxParts);
  assert.ok(parts[4] > parts[0] * 2, `まんざい ${parts[4]} は ギャグ ${parts[0]} の 2倍 より 多い`);
});

test('第49回 O6: ツッコミは ハリセン・ダーツは 的・タロットは カード（技の 形が 名前どおり）', () => {
  const props = (anim, pts = ONE) => new Set(collect(anim, pts).filter((p) => p.kind === 'o6Prop').map((p) => p.prop));
  assert.ok(props('ox_densetsu_tsukkomi').has('harisen'));
  assert.ok(props('ox_nori_tsukkomi').has('harisen'));
  assert.ok(props('ox_darts').has('target') && props('ox_darts').has('dart'));
  for (const a of ['ox_tarot_taiyou', 'ox_tarot_tsuki', 'ox_tarot_hoshi', 'ox_tarot_tou', 'ox_tarot_unmei']) assert.ok(props(a, a === 'ox_tarot_taiyou' || a === 'ox_tarot_unmei' ? ALLY1 : ONE).has('card'), a);
  assert.ok(props('ox_tendon').has('tarai'));
  assert.ok(props('ox_controller_nage').has('controller'));
  assert.ok(props('ox_sekai_yuushou').has('trophy') && props('ox_yuushou_no_toki').has('trophy'));
});

test('第49回 O6: 金だらいは 4回 どんどん 大きく（天どん）', () => {
  const tubs = collect('ox_tendon', ONE).filter((p) => p.prop === 'tarai').map((p) => p.s);
  assert.equal(tubs.length, 4);
  for (let i = 1; i < 4; i++) assert.ok(tubs[i] > tubs[i - 1]);
});

test('第49回 O6: 運だめしは 会心なら サイコロが 6、ふだんは 2〜5', () => {
  const face = (crit) => collect('ox_undameshi', ONE, { crit }).find((p) => p.prop === 'dice' && p.face)?.face;
  assert.equal(face(true), 6);
  const f = face(false);
  assert.ok(f >= 2 && f <= 5, String(f));
});

test('第49回 O6: 配信の 技は 配信の わくと コメントの 帯、スパチャの なかまは 数字か 帯', () => {
  const ks = (anim, pts) => new Set(collect(anim, pts).map((p) => p.kind));
  for (const [a, pts] of [['ox_nama_haishin', ALLY1], ['ox_collab_haishin', ALLY4], ['ox_dai_collab', THREE]]) {
    const k = ks(a, pts);
    assert.ok(k.has('o6Frame') && k.has('o6Comments'), a);
  }
  assert.ok(ks('ox_hyakuman_saisei', THREE).has('o6Counter'));
  assert.ok(ks('ox_kougaku_superchat', ONE).has('o6Band'));
});

test('第49回 O6: げんまは 大きな すがた（炎の 魔神・竜）、竜神は 魔神より 長い', () => {
  assert.ok(collect('ox_genma_ifrit', THREE).some((p) => p.kind === 'o6Figure' && p.fig === 'ifrit' && p.s >= 14));
  assert.ok(collect('ox_genma_ryuujin', THREE).some((p) => p.kind === 'o6Dragon'));
  assert.ok(axPlan('ox_genma_ryuujin', { n: 1 }).total > axPlan('ox_genma_ifrit', { n: 1 }).total);
});

test('第49回 O6: 画面の 文字は カタカナ・ひらがな・記号・数字だけ（漢字なし）', () => {
  for (const anim of Object.keys(AX_TIME_O6)) {
    const party = !!AX_TIME_O6[anim].party;
    for (const p of collect(anim, party ? ALLY4 : THREE)) {
      if (p.kind === 'o6Text') assert.ok(!/\p{Script=Han}/u.test(p.text.replace(/人/g, '')), `${anim}: ${p.text}`);
    }
  }
});

test('第49回 O6: 敵が まねて 味方に つかう ときも 下むきに 出る（攻撃の 技）', () => {
  for (const anim of ['ox_densetsu_tsukkomi', 'ox_genma_ryuujin', 'ox_yuushou_no_toki', 'ox_hifuki_gei']) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.ok(r.maxParts > 40, anim);
  }
});
