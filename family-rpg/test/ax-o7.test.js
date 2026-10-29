// 第51回 C1（o7）: 幻の職業（海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI）の 技の えんしゅつの テスト。この ファイルは C1 だけが さわる
// ・どの グループにも いる しらべ（技が ある・予算（AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間・漢字なし）は
//   groupReport('o7')（test/ax-groups.test.js でも）。ここには o7 だけの「決め手」を 書く
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O7, AX_SKILLS_O7, AX_FAMILIES_O7 } from '../public/js/shared/data/ax-time-o7.js';
import { PHANTOM_ABILITIES_A } from '../public/js/shared/data/abilities-phantom-a.js';
import { HIRA_PHANTOM_A_ABILITIES } from '../public/js/shared/data/hirameki-phantom-a.js';
import { axPlan } from '../public/js/shared/ax-time.js';
import { Effects } from '../public/js/client/render/battlefx.js';

test('第51回 o7: 表と え が そろう（groupReport）', () => {
  const r = groupReport('o7');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O7).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O7)) for (const a of fam) assert.ok(a in AX_TIME_O7, a);
});

test('第51回 o7: 幻の職業の 32技と ひらめき技 4つが ぜんぶ o7 に つながる・技ごとに 自分の anim・いちばん 上の 段（legend）・気は つかわない', () => {
  const ids = [...Object.keys(PHANTOM_ABILITIES_A), ...Object.keys(HIRA_PHANTOM_A_ABILITIES)];
  assert.deepEqual(Object.keys(AX_SKILLS_O7).sort(), ids.sort());
  const own = Object.keys(PHANTOM_ABILITIES_A).map((id) => AX_SKILLS_O7[id]);
  assert.equal(new Set(own).size, 32, '32技 それぞれ 自分の anim');
  for (const [anim, e] of Object.entries(AX_TIME_O7)) {
    assert.match(anim, /^ox_[a-z0-9_]+$/);
    assert.equal(e.tier, 'legend', anim);
    assert.ok(!e.charge || e.charge.kind !== 'ki', `${anim}: 気（ki）は g1 だけ`);
    const P = axPlan(anim, { n: 1 });
    assert.ok(P.total >= 1600 && P.total <= 2400, `${anim} ${P.total}`);
  }
  // 看板の 技は いちばん 長い 2.4びょう
  for (const a of ['ox_pk_sig', 'ox_sh_sig', 'ox_sk_sig', 'ox_fa_sig']) assert.equal(axPlan(a, { n: 1 }).total, 2400, a);
});

// add を のぞいて つぶを あつめる
function collect(anim, pts, opts = {}) {
  const fx = new Effects();
  const all = [];
  const add0 = fx.add.bind(fx);
  fx.add = (p) => { all.push(p); return add0(p); };
  fx.play(anim, pts, null, { fromAlly: true, from: { x: 99, y: 122 }, n: pts.length, ...opts });
  for (let t = 0; t < 3200 && fx.parts.length; t += 16) fx.update(16);
  return all;
}
const shapes = (list) => list.filter((p) => p.kind === 'o7Obj').map((p) => p.shape);

test('第51回 o7: 海賊王の 大船団は 海賊船 3せき・大ほうの たま・敵ごとに 笑い顔、自由の技も 笑い顔と ワハハ', () => {
  const sig = collect('ox_pk_sig', THREE);
  const s = shapes(sig);
  assert.ok(s.filter((x) => x === 'ship').length >= 3);
  assert.ok(s.includes('ball'));
  assert.equal(s.filter((x) => x === 'laugh').length, 3);
  const free = collect('ox_pk_jiyuu', THREE);
  assert.equal(shapes(free).filter((x) => x === 'laugh').length, 3);
  assert.ok(free.some((p) => p.kind === 'o7Text' && p.text === 'ワハハ'));
  // 一味の いっせい攻撃: 海賊船と ゴムの こぶし
  assert.ok(shapes(collect('ox_pk_ichimi', ONE)).includes('ship'));
  assert.ok(shapes(collect('ox_pk_gatling', ONE)).filter((x) => x === 'fist').length >= 8);
});

test('第51回 o7: かめはめデインは 金色の 気の オーラ → 青い 気の たま → ビーム と 雷（ki の ため は つかわず え の 中で）', () => {
  const ps = collect('ox_sh_sig', ONE);
  assert.ok(ps.some((p) => p.kind === 'axAura' && p.style === 'flame' && p.color === '#ffd23a'), '金色の オーラ');
  assert.ok(ps.some((p) => p.kind === 'axOrb'), '気の たま');
  const beam = ps.find((p) => p.kind === 'axBeam' && p.w >= 10);
  assert.ok(beam, 'ビーム');
  assert.ok(ps.filter((p) => p.kind === 'axBolt').length >= 3, '雷を まとう');
  assert.equal(AX_TIME_O7.ox_sh_sig.charge.kind, 'holy');
});

test('第51回 o7: 日の火影の 看板の 技は 分身 5人が 炎の 刀で まう（炎の 三日月が 何回も）、影分身は 4人', () => {
  const ps = collect('ox_sk_sig', THREE);
  const ninjas = ps.filter((p) => p.kind === 'o7Obj' && p.shape === 'ninja');
  assert.equal(ninjas.length, 5);
  assert.ok(ninjas.every((p) => p.fire && p.swing));
  assert.ok(ps.filter((p) => p.kind === 'axCrescent').length >= 9);
  assert.equal(shapes(collect('ox_sk_bunshin', ALLY1)).filter((x) => x === 'ninja').length, 4);
  assert.ok(shapes(collect('ox_sk_bijuu', THREE)).includes('fox'));
});

test('第51回 o7: 天才しせつ管理者AIは 六角形の パネル・照準・ドローン・カプセル・建物', () => {
  const sig = collect('ox_fa_sig', THREE);
  assert.ok(shapes(sig).includes('building'));
  assert.ok(sig.some((p) => p.kind === 'o7Hex' && p.n >= 3));
  assert.ok(collect('ox_fa_scan', THREE).filter((p) => p.kind === 'o7Reticle').length === 3);
  assert.equal(shapes(collect('ox_fa_drone', THREE)).filter((x) => x === 'drone').length, 3);
  assert.equal(shapes(collect('ox_fa_shohou', ALLY4)).filter((x) => x === 'capsule').length, 4);
});

test('第51回 o7: ひらめき技は vars で ちがいが 出る（雷の ガトリング・2回 切る・らせん手裏剣・デジタルツイン）', () => {
  const bolts = (list) => list.filter((p) => p.kind === 'axBolt').length;
  assert.ok(bolts(collect('ox_pk_gatling', ONE, { ability: 'hi_pk_raijin' })) > bolts(collect('ox_pk_gatling', ONE, { ability: 'pk_gatling' })));
  const cres = (list) => list.filter((p) => p.kind === 'axCrescent').length;
  assert.ok(cres(collect('ox_sh_ken', ONE, { ability: 'hi_sh_raikou' })) > cres(collect('ox_sh_ken', ONE, { ability: 'sh_ken' })));
  assert.ok(collect('ox_fa_kuuchou', ALLY4, { ability: 'hi_fa_twin' }).some((p) => p.shape === 'ninja'));
});

test('第51回 o7: 画面の 文字は カタカナ・ひらがな・記号・ローマ字だけ（漢字なし）', () => {
  for (const anim of Object.keys(AX_TIME_O7)) {
    const party = !!AX_TIME_O7[anim].party;
    for (const p of collect(anim, party ? ALLY4 : THREE)) {
      if (p.kind === 'o7Text') assert.ok(!/\p{Script=Han}/u.test(p.text.replace(/人/g, '')), `${anim}: ${p.text}`);
    }
  }
});

test('第51回 o7: 敵が まねて 味方に つかう ときも こわれない（攻撃の 技）', () => {
  for (const anim of ['ox_pk_sig', 'ox_sh_sig', 'ox_sk_sig', 'ox_fa_sig', 'ox_sk_bijuu', 'ox_fa_drone']) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.ok(r.maxParts > 60, `${anim} ${r.maxParts}`);
  }
});
