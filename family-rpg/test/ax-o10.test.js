// 第51回 W（天気の 職業）の 技の えんしゅつ o10 の テスト。この ファイルは W だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_GROUP_IDS（'o10'）から やる。ここには o10 だけの「決め手」を 書く
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O10, AX_SKILLS_O10, AX_FAMILIES_O10 } from '../public/js/shared/data/ax-time-o10.js';
import { axPlan, AX_GROUP_IDS } from '../public/js/shared/ax-time.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { Effects } from '../public/js/client/render/battlefx.js';

const WEATHER_JOBS = ['kishou', 'otenki_caster', 'tenkou_tsukai'];
const TIER = ['basic', 'advanced', 'super'];

test('第51回 W: o10 の 表と え が そろう（グループの しらべ）', () => {
  assert.ok(AX_GROUP_IDS.includes('o10'));
  const r = groupReport('o10');
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O10).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O10)) for (const a of fam) assert.ok(a in AX_TIME_O10, a);
});

test('第51回 W: 天気の 職業の 技（ひらめき技も）ぜんぶに 自分だけの anim・段は 職業の 段', () => {
  const ids = new Set();
  for (const j of WEATHER_JOBS) for (const [, id] of JOBS[j].learn) ids.add(id);
  for (const [id, a] of Object.entries(ABILITIES)) if (a.hirameki && WEATHER_JOBS.includes(a.job)) ids.add(id);
  assert.deepEqual([...ids].sort(), Object.keys(AX_SKILLS_O10).sort());
  const anims = Object.values(AX_SKILLS_O10);
  assert.equal(new Set(anims).size, anims.length);
  for (const [id, anim] of Object.entries(AX_SKILLS_O10)) {
    assert.match(anim, /^ox_w_[a-z0-9_]+$/);
    assert.equal(AX_TIME_O10[anim].tier, TIER[JOBS[ABILITIES[id].job].tier], `${id} の 段`);
  }
});

// add を のぞいて つぶを あつめる
function collect(anim, pts, opts = {}) {
  const fx = new Effects();
  const all = [];
  const add0 = fx.add.bind(fx);
  fx.add = (p) => { all.push(p); return add0(p); };
  fx.play(anim, pts, null, { fromAlly: true, from: { x: 99, y: 122 }, n: pts.length, ...opts });
  for (let t = 0; t < 3000 && fx.parts.length; t += 16) fx.update(16);
  return all;
}
const shapes = (anim, pts) => new Set(collect(anim, pts).filter((p) => p.kind === 'o10Obj').map((p) => p.shape));
const kinds = (anim, pts) => new Set(collect(anim, pts).map((p) => p.kind));

test('第51回 W: 天気の 形が 名前どおり（かさ・天気図・温度計・テレビ・太陽・にじ・台風の うず・前線・雨の カーテン）', () => {
  assert.ok(shapes('ox_w_minna_kasa', ALLY4).has('umbrella'));
  assert.ok(shapes('ox_w_ashita_yohou', ALLY4).has('map'));
  assert.ok(shapes('ox_w_manatsubi', ONE).has('thermo') && shapes('ox_w_moushobi', THREE).has('thermo'));
  assert.ok(shapes('ox_w_raiu_zensen', THREE).has('tv'));
  assert.ok(kinds('ox_w_raiu_zensen', THREE).has('o10Front'));
  assert.ok(shapes('ox_w_zubari', ALLY1).has('mic'));
  assert.ok(shapes('ox_w_manatsu_taiyou', THREE).has('sun'));
  assert.ok(kinds('ox_w_niji', ALLY4).has('o10Rainbow'));
  assert.ok(kinds('ox_w_sora_gourei', THREE).has('o10Rainbow'));
  assert.ok(kinds('ox_w_taifuu', THREE).has('o10Spiral'));
  for (const a of ['ox_w_niwaka_ame', 'ox_w_ooame_keihou', 'ox_w_guerrilla', 'ox_w_megumi_ame']) assert.ok(kinds(a, a === 'ox_w_megumi_ame' ? ALLY4 : THREE).has('o10Rain'), a);
});

test('第51回 W: かみなりの なかまは 段が 上がるほど いなずまが ふとく・多い（三れん発は 3回）', () => {
  const bolts = (anim, pts = ONE) => collect(anim, pts).filter((p) => p.kind === 'axBolt');
  const w = (anim) => Math.max(...bolts(anim).map((p) => p.w));
  assert.ok(w('ox_w_kaminari_chuuiho') < w('ox_w_kaminari_mark') && w('ox_w_kaminari_mark') < w('ox_w_ikazuchi'));
  assert.equal(bolts('ox_w_sanrenpatsu').length, 3);
  assert.equal(bolts('ox_w_sanrenpatsu', THREE).length, 9);
});

test('第51回 W: なかまは 段が 上がるほど 長く・つぶが 多い', () => {
  for (const [name, fam] of Object.entries(AX_FAMILIES_O10)) {
    const total = fam.map((a) => axPlan(a, { n: 1 }).total);
    for (let i = 1; i < total.length; i++) assert.ok(total[i] > total[i - 1], `${name}: ${fam[i]}`);
    const parts = fam.map((a) => playAx(a, ONE).maxParts);
    assert.ok(parts[2] > parts[0], `${name}: ${parts.join(' < ')}`);
  }
});

test('第51回 W: 画面の 文字は カタカナ・記号・数字・英字だけ（漢字なし）', () => {
  for (const anim of Object.keys(AX_TIME_O10)) {
    const party = !!AX_TIME_O10[anim].party;
    for (const p of collect(anim, party ? ALLY4 : THREE)) {
      if (p.kind === 'o10Text') assert.ok(!/\p{Script=Han}/u.test(p.text), `${anim}: ${p.text}`);
    }
  }
});

test('第51回 W: 敵が まねて 味方に つかう ときも 下むきに 出る（攻撃の 技）', () => {
  for (const anim of ['ox_w_raiu', 'ox_w_kaminari_mark', 'ox_w_taifuu', 'ox_w_sora_gourei', 'ox_w_guerrilla']) {
    const r = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(r.errors, [], anim);
    assert.ok(r.maxParts > 40, anim);
  }
});
