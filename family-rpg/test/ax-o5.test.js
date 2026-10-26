// 第49回 O5（家・学校・料理） の もとからの 技の テスト。この ファイルは O5 だけが さわる
// ・どの グループにも いる テスト（技が ある・段の 予算（もとからの 技の AX_BUDGET_ORIG）・構えの 上限・気なし・敵1体/全体・敵→味方・味方に・音・時間が サーバーと おなじ・漢字なし）は
//   test/ax-groups.test.js が AX_SKILLS_O5 を 見て やる。ここには O5 だけの「決め手」を 書く（plan-r49-fx.md 7-3）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupReport, playAx, ONE, THREE, ALLY1, ALLY4 } from './ax-check.js';
import { AX_TIME_O5, AX_SKILLS_O5, AX_FAMILIES_O5 } from '../public/js/shared/data/ax-time-o5.js';
import { axDef } from '../public/js/client/render/axfx.js';
import { SFX_AX } from '../public/js/client/sfx-ax.js';
import { O5_SHAPES } from '../public/js/client/render/axfx-o5-fine.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';

const r = groupReport('o5');
test('第49回 O5: 表と え が そろう', () => {
  assert.deepEqual(r.problems, []);
  assert.equal(Object.keys(AX_TIME_O5).length, r.anims.length);
  for (const fam of Object.values(AX_FAMILIES_O5)) for (const a of fam) assert.ok(a in AX_TIME_O5, a);
  for (const v of Object.values(AX_SKILLS_O5)) assert.ok((typeof v === 'string' ? v : v.anim) in AX_TIME_O5);
});

test('第49回 O5: 6章の 93技を ぜんぶ つないだ・1技 1anim', () => {
  assert.equal(Object.keys(AX_SKILLS_O5).length, 93);
  assert.equal(Object.keys(AX_TIME_O5).length, 93);
  assert.equal(new Set(Object.values(AX_SKILLS_O5)).size, 93);
  assert.ok(AX_SKILLS_O5.dt_bentou === 'ox_bentou_todoke' && 'ox_bentou_todoke' in AX_TIME_O5);
});

test('第49回 O5: 構えは みじかい（basic 200・ほか 300 まで）・気なし・合体技は ため なし', () => {
  for (const [anim, e] of Object.entries(AX_TIME_O5)) {
    if (!e.charge) continue;
    assert.notEqual(e.charge.kind, 'ki', anim);
    assert.ok(e.charge.ms <= (e.tier === 'basic' ? 200 : 300), anim);
  }
  for (const [key, anim] of Object.entries(AX_SKILLS_O5)) if (key.startsWith('dt_')) assert.equal(AX_TIME_O5[anim].charge, false, key);
});

// play の 直後の つぶ（Effects を 1回 うごかす）
function snap(anim, pts = ONE, o = {}) {
  const key = Object.entries(AX_SKILLS_O5).find(([, v]) => v === anim)?.[0];
  const real = Math.random;
  let s = 7;
  Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647;
  try {
    const fx = new Effects();
    fx.play(anim, pts, null, { fromAlly: o.fromAlly ?? true, from: o.from || { x: 99, y: 122 }, ability: key, dual: !!DUAL_TECHS[key], n: pts.length, ...o });
    // 構えの あとの はなつ しゅんかんまで すすめる
    const ch = AX_TIME_O5[anim].charge ? AX_TIME_O5[anim].charge.ms : 0;
    for (let t = 0; t <= ch + 32; t += 16) fx.update(16);
    return fx.parts;
  } finally { Math.random = real; }
}

test('第49回 O5: 名前の 小物が 大きく（8px いじょう）出る', () => {
  const want = {
    ox_randoseru_attack: 'randoseru', ox_dodgeball: 'ball', ox_houchou_sabaki: 'knife', ox_tsuyobi: 'wok', ox_flambe: 'frypan',
    ox_makura_nage: 'pillow', ox_saikyou_slipper: 'slipper', ox_okan_binta: 'pa', ox_chabudai_gaeshi: 'chabudai',
    ox_wedding_cake: 'wcake', ox_kyuukyoku_hitosara: 'cloche', ox_full_course: 'cloche', ox_kaimono_kago: 'basket',
    ox_obentou: 'bento', ox_gohan_okawari: 'ohitsu', ox_shuugaku_ryokou: 'pillow', ox_okashi_no_ie: 'cookiehouse',
    ox_randoseru_rocket: 'randoseru', ox_ippatsu_gyakuten: 'gu', ox_kazoku_kaigi: 'chabudai', ox_uchiage_hanabi: null,
  };
  for (const [anim, shape] of Object.entries(want)) {
    if (!shape) continue;
    assert.ok(O5_SHAPES.includes(shape), shape);
    const parts = snap(anim, axDef(anim).party ? ALLY1 : ONE);
    const big = parts.filter((p) => p.kind === 'o5Obj' && p.shape === shape && (p.s || 0) >= 8);
    assert.ok(big.length >= 1, `${anim}: ${shape}`);
  }
});

test('第49回 O5: なかまは 段が 上がるほど 大きく・長く（スリッパ → ビンタ の つぶが ふえる）', () => {
  const n = ['ox_saikyou_slipper', 'ox_okan_binta'].map((a) => r.plans[Object.keys(AX_SKILLS_O5).find((k) => AX_SKILLS_O5[k] === a)].maxParts);
  assert.ok(n[1] > n[0], `${n}`);
  for (const fam of Object.values(AX_FAMILIES_O5)) {
    const tot = fam.map((a) => AX_TIME_O5[a].hit + AX_TIME_O5[a].len + (AX_TIME_O5[a].charge ? AX_TIME_O5[a].charge.ms : 0));
    for (let i = 1; i < tot.length; i++) assert.ok(tot[i] >= tot[i - 1], fam.join('→'));
  }
  // 包丁: 鉄人の包丁（超級）は 銀と 金の 三日月の 斬げきが 4回、包丁さばきは 銀の すじ 3本
  const tetsu = snap('ox_tetsujin_bouchou').filter((p) => p.kind === 'axCrescent').length;
  assert.ok(tetsu >= 4, `${tetsu}`);
});

test('第49回 O5: 料理の 炎は 炎の 色・中華なべの 炎は 段で 竜巻が ふえる', () => {
  const tw = (a) => snap(a).filter((p) => p.kind === 'o5Twister').length;
  assert.equal(tw('ox_tsuyobi'), 0);
  assert.ok(tw('ox_daikaryoku_itame') >= 2);
  assert.ok(tw('ox_honoo_furaipan') > tw('ox_daikaryoku_itame'));
});

test('第49回 O5: 味方に かける 技は 味方の ところで 光る・敵が まねても 下向きに 当たる', () => {
  for (const [key, anim] of Object.entries(AX_SKILLS_O5)) {
    if (!axDef(anim).party) continue;
    const parts = snap(anim, ALLY4);
    assert.ok(parts.some((p) => p.y > 100), `${key}: 味方の ところ`);
  }
  for (const anim of ['ox_randoseru_attack', 'ox_okan_binta', 'ox_bukatsu_smash', 'ox_honoo_furaipan']) {
    const res = playAx(anim, ALLY4, { fromAlly: false, toParty: true, n: 4 });
    assert.deepEqual(res.errors, [], anim);
    assert.equal(res.far, null, anim);
  }
  void THREE;
});

test('第49回 O5: 背景は うすく 一しゅん（a 0.35・0.6s まで）・画面の 色は 使わない', () => {
  for (const anim of Object.keys(AX_TIME_O5)) {
    const parts = snap(anim, axDef(anim).party ? ALLY1 : ONE);
    for (const p of parts.filter((q) => q.kind === 'o5Bg')) {
      assert.ok(p.a <= 0.35, anim);
      assert.ok(p.life <= 600, anim);
    }
  }
});

test('第49回 O5: 音は ぜんぶ 0.8びょう いない', () => {
  const bad = [];
  for (const anim of Object.keys(AX_TIME_O5)) {
    const id = axDef(anim).sfx;
    let end = 0;
    const a = { tone: () => {}, noise: (dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); } };
    const T = (f, dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); };
    SFX_AX[id](a, T);
    bad.push(...(end <= 0.8 + 1e-9 ? [] : [`${id}: ${end.toFixed(2)}s`]));
  }
  assert.deepEqual(bad, []);
});
